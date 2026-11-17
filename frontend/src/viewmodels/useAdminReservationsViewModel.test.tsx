import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { AdminReservationDetail } from '../models/admin-reservation.model';
import { ApiError } from '../services/api';
import { fetchSpaces } from '../services/spaces.service';
import {
  fetchAdminReservation,
  fetchAdminReservations,
  fetchReservationSummary,
  reviewReservation,
} from '../services/admin-reservations.service';
import { useAdminReservationsViewModel } from './useAdminReservationsViewModel';

vi.mock('../services/spaces.service', () => ({ fetchSpaces: vi.fn() }));
vi.mock('../services/admin-reservations.service', () => ({
  fetchAdminReservation: vi.fn(),
  fetchAdminReservations: vi.fn(),
  fetchReservationSummary: vi.fn(),
  reviewReservation: vi.fn(),
  downloadReservationAttachment: vi.fn(),
}));
const space = {
  id: 47,
  name: 'Sala de Reunião 1',
  capacity: 8,
  description: null,
  equipment: [],
  photoUrls: [],
  state: 'active' as const,
};
const record: AdminReservationDetail = {
  id: 71,
  userId: 21,
  status: 'pending',
  space,
  spaceId: 47,
  date: '2099-06-10',
  startTime: '09:00:00',
  endTime: '10:00:00',
  participants: 8,
  eventType: 'Reunião',
  subject: 'Reunião de projetos',
  equipment: [],
  needsItSupport: false,
  consent: true,
  requester: {
    name: 'Maria Silva',
    email: 'maria@example.test',
    phone: '98999999999',
    type: 'pessoa-fisica',
    document: '52998224725',
    institution: null,
  },
  attachments: [],
  reviewNote: null,
  reviewedAt: null,
  reviewedBy: null,
  createdAt: '2026-11-17T12:00:00Z',
  updatedAt: '2026-11-17T12:00:00Z',
};
let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(fetchSpaces).mockResolvedValue([space]);
  vi.mocked(fetchAdminReservation).mockResolvedValue(record);
  vi.mocked(fetchAdminReservations).mockResolvedValue({ items: [record], total: 11, page: 1, limit: 10 });
  vi.mocked(fetchReservationSummary).mockResolvedValue({
    pending: 11,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    total: 11,
  });
  vi.mocked(reviewReservation).mockResolvedValue({ status: 'approved' });
});
afterEach(() => {
  cleanup();
  client.clear();
});
function setup(url = '/admin/reservas?solicitacao=71') {
  const expired = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  const hook = renderHook(() => useAdminReservationsViewModel('admin-token', 1, expired), { wrapper });
  return { ...hook, expired };
}
describe('gestão administrativa de reservas', () => {
  it('busca apenas pendentes inicialmente e reinicia paginação e seleção ao filtrar', async () => {
    const hook = setup('/admin/reservas?pagina=2&solicitacao=71');
    await waitFor(() => expect(hook.result.current.list.isSuccess).toBe(true));
    expect(fetchAdminReservations).toHaveBeenCalledWith(
      { status: 'pending', date: '', spaceId: '', page: 2 },
      'admin-token',
      expect.any(AbortSignal)
    );
    act(() => hook.result.current.changeFilters({ status: 'approved', spaceId: '47' }));
    expect(hook.result.current.filters).toEqual({ status: 'approved', spaceId: '47', date: '', page: 1 });
    expect(hook.result.current.selectedId).toBeNull();
  });
  it.each(['approved', 'rejected'] as const)(
    'registra %s apenas após confirmação e atualiza lista, detalhe e resumo',
    async (decision) => {
      const hook = setup();
      await waitFor(() => expect(hook.result.current.detail.isSuccess).toBe(true));
      act(() => {
        hook.result.current.setDecision(decision);
        hook.result.current.setNote('Análise da equipe');
      });
      expect(reviewReservation).not.toHaveBeenCalled();
      vi.mocked(fetchAdminReservation).mockResolvedValue({ ...record, status: decision });
      act(() => {
        void hook.result.current.confirmDecision();
        void hook.result.current.confirmDecision();
      });
      await waitFor(() => expect(hook.result.current.isSaving).toBe(false));
      expect(reviewReservation).toHaveBeenCalledTimes(1);
      expect(reviewReservation).toHaveBeenCalledWith(71, decision, 'Análise da equipe', 'admin-token');
      expect(hook.result.current.notice?.kind).toBe('success');
      expect(vi.mocked(fetchAdminReservations).mock.calls.length).toBeGreaterThan(1);
      expect(vi.mocked(fetchReservationSummary).mock.calls.length).toBeGreaterThan(1);
      expect(hook.result.current.detail.data?.status).toBe(decision);
    }
  );
  it('não permite reanalisar uma solicitação já decidida', async () => {
    vi.mocked(fetchAdminReservation).mockResolvedValue({ ...record, status: 'approved' });
    const hook = setup();
    await waitFor(() => expect(hook.result.current.detail.isSuccess).toBe(true));
    act(() => hook.result.current.setDecision('rejected'));
    await act(() => hook.result.current.confirmDecision());
    expect(reviewReservation).not.toHaveBeenCalled();
  });
  it('trata conflito sem simular sucesso ou repetir a decisão', async () => {
    vi.mocked(reviewReservation).mockRejectedValue(new ApiError(409, 'Esta reserva já foi analisada.'));
    const hook = setup();
    await waitFor(() => expect(hook.result.current.detail.isSuccess).toBe(true));
    act(() => hook.result.current.setDecision('approved'));
    await act(() => hook.result.current.confirmDecision());
    expect(reviewReservation).toHaveBeenCalledTimes(1);
    expect(hook.result.current.notice).toMatchObject({ kind: 'error' });
    expect(hook.result.current.notice?.message).toContain('já foi analisada');
    expect(hook.result.current.decision).toBeNull();
  });
  it('encerra a sessão quando o backend devolve 401', async () => {
    vi.mocked(fetchAdminReservations).mockRejectedValue(new ApiError(401, 'Unauthorized'));
    const hook = setup();
    await waitFor(() => expect(hook.expired).toHaveBeenCalled());
  });
  it('não confirma uma decisão de outro pedido após trocar a seleção', async () => {
    const hook = setup();
    await waitFor(() => expect(hook.result.current.detail.isSuccess).toBe(true));
    act(() => hook.result.current.setDecision('approved'));
    act(() => hook.result.current.select(72));
    await act(() => hook.result.current.confirmDecision());
    expect(reviewReservation).not.toHaveBeenCalled();
  });
});
