import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './useAuth';
import { fetchAccount, login } from '../services/auth.service';
import { ApiError } from '../services/api';

vi.mock('../services/auth.service', () => ({
  login: vi.fn(),
  fetchAccount: vi.fn(),
  loadSession: vi.fn(() => null),
  saveSession: vi.fn(),
  clearSession: vi.fn(),
  register: vi.fn(),
  updateMyProfile: vi.fn(),
}));
const account = {
  id: 2,
  name: 'Maria Silva',
  email: 'maria@example.test',
  role: 'user' as const,
  phone: null,
  cpf: null,
  cnpj: null,
  institution: null,
};
beforeEach(() => {
  vi.mocked(login).mockResolvedValue({
    accessToken: 'test-token',
    user: { id: 2, name: account.name, email: account.email, role: 'user' },
  });
  vi.mocked(fetchAccount).mockResolvedValue(account);
});
afterEach(cleanup);
function setup() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={['/estrutura/reserva?espaco=47']}>{children}</MemoryRouter>
  );
  const hook = renderHook(() => ({ auth: useAuth(), location: useLocation() }), { wrapper });
  act(() => hook.result.current.auth.logout());
  return hook;
}
it('redireciona o administrador para a visão geral após confirmar seu perfil na API', async () => {
  vi.mocked(fetchAccount).mockResolvedValue({ ...account, role: 'admin' });
  const hook = setup();
  await act(() => hook.result.current.auth.login({ email: account.email, password: 'password123' }));
  expect(hook.result.current.location.pathname).toBe('/admin');
  expect(hook.result.current.location.search).toBe('');
  expect(hook.result.current.auth.account?.role).toBe('admin');
});
it('mantém usuários comuns na página onde fizeram login', async () => {
  const hook = setup();
  await act(() => hook.result.current.auth.login({ email: account.email, password: 'password123' }));
  expect(hook.result.current.location.pathname).toBe('/estrutura/reserva');
  expect(hook.result.current.location.search).toBe('?espaco=47');
});
it('não redireciona quando a autenticação falha', async () => {
  vi.mocked(login).mockRejectedValue(new ApiError(401, 'Unauthorized'));
  const hook = setup();
  await act(async () => {
    await expect(hook.result.current.auth.login({ email: account.email, password: 'invalid' })).rejects.toBeInstanceOf(
      ApiError
    );
  });
  expect(hook.result.current.location.pathname).toBe('/estrutura/reserva');
  expect(hook.result.current.auth.status).toBe('anonymous');
});
