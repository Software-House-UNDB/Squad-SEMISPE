import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountMenu } from './AccountMenu';
import { useAuth } from '../../viewmodels/useAuth';
vi.mock('../../viewmodels/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('./AuthModal', () => ({ AuthModal: () => <p>Acesso à conta</p> }));
const logout = vi.fn();
beforeEach(() => {
  logout.mockReset();
  vi.mocked(useAuth).mockReturnValue({
    status: 'authenticated',
    accessToken: 'token',
    account: {
      id: 2,
      name: 'Maria Silva',
      role: 'user',
      email: 'maria@example.test',
      phone: null,
      cpf: null,
      cnpj: null,
      institution: null,
    },
    logout,
    login: vi.fn(),
    createAccount: vi.fn(),
    updateProfile: vi.fn(),
  });
});
afterEach(cleanup);
function setup() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <AccountMenu />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
it('oferece somente Meus dados e Sair no menu da conta', () => {
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Conta de Maria' }));
  expect(screen.getByRole('link', { name: 'Meus dados' }).getAttribute('href')).toBe('/meus-dados');
  expect(screen.getAllByRole('link')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
  expect(logout).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('link', { name: 'Meus dados' })).toBeNull();
});
it('fecha com Escape e devolve o foco ao botão da conta', () => {
  setup();
  const button = screen.getByRole('button', { name: 'Conta de Maria' });
  fireEvent.click(button);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('link', { name: 'Meus dados' })).toBeNull();
  expect(document.activeElement).toBe(button);
});
it('oferece acesso à conta para visitantes', () => {
  vi.mocked(useAuth).mockReturnValue({
    status: 'anonymous',
    accessToken: null,
    account: null,
    logout,
    login: vi.fn(),
    createAccount: vi.fn(),
    updateProfile: vi.fn(),
  });
  setup();
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(screen.getByText('Acesso à conta')).toBeTruthy();
});
