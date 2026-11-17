import { act, renderHook, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { UserAccount } from '../models/auth.model';
import type { Space } from '../models/space.model';
import { ApiError } from '../services/api';
import { fetchSpaces } from '../services/spaces.service';
import { fetchSchedule, submitReservation } from '../services/reservations.service';
import { useReservaViewModel, type AnswerValue } from './useReservaViewModel';

vi.mock('../services/spaces.service', () => ({ fetchSpaces: vi.fn() }));
vi.mock('../services/reservations.service', () => ({ fetchSchedule: vi.fn(), submitReservation: vi.fn() }));
const space: Space = {
  id: 47,
  name: 'Sala de Reunião 1',
  capacity: 8,
  description: null,
  equipment: ['Projetor'],
  photoUrls: [],
  state: 'active',
};
const account: UserAccount = {
  id: 21,
  name: 'Maria Silva',
  email: 'maria@example.com',
  phone: '98999999999',
  cpf: '52998224725',
  cnpj: null,
  institution: null,
  role: 'user',
};
const schedule = {
  spaceId: 47,
  date: '2099-06-10',
  active: true,
  occupied: [{ startTime: '09:00:00', endTime: '10:00:00' }],
};
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  vi.mocked(fetchSpaces).mockResolvedValue([space]);
  vi.mocked(fetchSchedule).mockResolvedValue(schedule);
  vi.mocked(submitReservation).mockResolvedValue({ id: 73, status: 'pending', createdAt: '2099-06-01T12:00:00Z' });
});
afterEach(() => {
  cleanup();
  client.clear();
});
function setup(token: string | null = 'session-token') {
  const expired = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/estrutura/reserva?espaco=47']}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  const hook = renderHook(() => useReservaViewModel([space], account, token, expired), { wrapper });
  const answer = (value: AnswerValue) => act(() => hook.result.current.answer(value));
  const toTimes = async () => {
    answer(47);
    answer('2099-06-10');
    await waitFor(() => expect(hook.result.current.scheduleLoading).toBe(false));
  };
  const toReview = async () => {
    await toTimes();
    answer('08:00');
    answer('09:00');
    answer(8);
    answer('Reunião');
    answer(['Projetor']);
    answer('nao');
    answer('Alinhamento de projetos');
    answer(new File(['%PDF-1.4\n%%EOF'], 'oficio.pdf', { type: 'application/pdf' }));
    answer(null);
    answer(null);
    answer(null);
    act(() => hook.result.current.setConsent(true));
    expect(hook.result.current.phase).toBe('revisao');
  };
  return { ...hook, answer, toTimes, toReview, expired };
}
describe('reserva integrada', () => {
  it('usa IDs reais e exclui intervalos ocupados, aceitando horários adjacentes', async () => {
    const hook = setup();
    await hook.toTimes();
    const input = hook.result.current.composer!.input;
    expect(input.kind).toBe('time');
    if (input.kind !== 'time') throw Error('Campo inesperado');
    expect(input.slots).not.toContain('09:00');
    expect(input.slots).not.toContain('09:30');
    expect(input.slots).toContain('10:00');
    hook.answer('08:30');
    const end = hook.result.current.composer!.input;
    if (end.kind !== 'time') throw Error('Campo inesperado');
    expect(end.slots).toEqual(['09:00']);
    expect(fetchSchedule).toHaveBeenCalledWith(47, '2099-06-10', expect.any(AbortSignal));
  });
  it('recusa excesso de capacidade e equipamentos fora do cadastro', async () => {
    const hook = setup();
    await hook.toTimes();
    hook.answer('08:00');
    hook.answer('09:00');
    hook.answer(9);
    expect(hook.result.current.error).toContain('até 8');
    expect(hook.result.current.composer?.id).toBe('participantes');
    hook.answer(8);
    hook.answer('Reunião');
    hook.answer(['Microfone']);
    expect(hook.result.current.composer?.id).toBe('equipamentos');
    expect(hook.result.current.error).toContain('lista');
  });
  it('revalida disponibilidade e exibe somente o protocolo real; impede envio duplicado', async () => {
    const hook = setup();
    await hook.toReview();
    act(() => {
      hook.result.current.submit();
      hook.result.current.submit();
    });
    await waitFor(() => expect(hook.result.current.phase).toBe('enviado'));
    expect(submitReservation).toHaveBeenCalledTimes(1);
    expect(submitReservation).toHaveBeenCalledWith(
      expect.objectContaining({ spaceId: 47, participants: 8 }),
      expect.objectContaining({ oficio: expect.any(File) }),
      'session-token'
    );
    expect(hook.result.current.pending?.messages.join(' ')).toContain('73');
    expect(hook.result.current.pending?.messages.join(' ')).toContain('não confirma');
  });
  it.each([401, 409, 429, 500])('preserva respostas e anexos quando a API retorna %s', async (status) => {
    vi.mocked(submitReservation).mockRejectedValue(new ApiError(status, 'Falha de teste'));
    const hook = setup();
    await hook.toReview();
    act(() => hook.result.current.submit());
    await waitFor(() => expect(hook.result.current.error).not.toBeNull());
    expect(hook.result.current.phase).not.toBe('enviado');
    expect(
      hook.result.current.summary.flatMap((group) => group.items).find((item) => item.id === 'oficio')?.value
    ).toContain('oficio.pdf');
    if (status === 401) expect(hook.expired).toHaveBeenCalledTimes(1);
    if (status === 409) expect(hook.result.current.composer?.id).toBe('inicio');
  });
  it('não envia sem sessão', async () => {
    const hook = setup(null);
    await hook.toReview();
    act(() => hook.result.current.submit());
    expect(hook.expired).toHaveBeenCalledTimes(1);
    expect(submitReservation).not.toHaveBeenCalled();
  });
  it('consulta novamente a agenda antes do POST e recusa um horário recém-ocupado', async () => {
    const hook = setup();
    await hook.toReview();
    vi.mocked(fetchSchedule).mockResolvedValue({
      ...schedule,
      occupied: [{ startTime: '08:00:00', endTime: '09:00:00' }],
    });
    act(() => hook.result.current.submit());
    await waitFor(() => expect(hook.result.current.error).not.toBeNull());
    expect(submitReservation).not.toHaveBeenCalled();
    expect(hook.result.current.composer?.id).toBe('inicio');
  });
  it('recusa capacidade alterada no cadastro durante o preenchimento', async () => {
    const hook = setup();
    await hook.toReview();
    vi.mocked(fetchSpaces).mockResolvedValue([{ ...space, capacity: 5 }]);
    act(() => hook.result.current.submit());
    await waitFor(() => expect(hook.result.current.error).toContain('até 5'));
    expect(submitReservation).not.toHaveBeenCalled();
    expect(hook.result.current.composer?.id).toBe('participantes');
  });
  it('não oferece horários quando a consulta falha e permite tentar novamente', async () => {
    vi.mocked(fetchSchedule).mockRejectedValueOnce(new Error('offline'));
    const hook = setup();
    await hook.toTimes();
    expect(hook.result.current.scheduleError).toBe(true);
    hook.answer('08:00');
    expect(hook.result.current.composer?.id).toBe('inicio');
    act(() => hook.result.current.retrySchedule());
    await waitFor(() => expect(hook.result.current.scheduleError).toBe(false));
  });
});
