import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminPage } from './AdminPage';
import { useAuth } from '../../viewmodels/useAuth';
import { fetchAdminReservations } from '../../services/admin-reservations.service';
import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminPlannedModule } from '../components/admin/AdminPlannedModule';
import { AdminReservationsPage } from './AdminReservationsPage';
vi.mock('../../viewmodels/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../../services/admin-reservations.service', () => ({ fetchAdminReservations: vi.fn() }));
vi.mock('../components/admin/AdminReservations', () => ({ AdminReservations: () => <h1>Solicitações de reserva</h1> }));
afterEach(cleanup);
it('bloqueia contas comuns sem consultar endpoints administrativos', () => {
  vi.mocked(useAuth).mockReturnValue({
    status: 'authenticated',
    accessToken: 'user-token',
    account: {
      id: 2,
      role: 'user',
      name: 'Conta comum',
      email: 'user@example.test',
      phone: null,
      cpf: null,
      cnpj: null,
      institution: null,
    },
    logout: vi.fn(),
    login: vi.fn(),
    createAccount: vi.fn(),
    updateProfile: vi.fn(),
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
  expect(screen.getByRole('heading', { name: 'Acesso restrito' })).toBeTruthy();
  expect(fetchAdminReservations).not.toHaveBeenCalled();
});

function renderAdmin(path = '/admin') {
  vi.mocked(useAuth).mockReturnValue({
    status: 'authenticated',
    accessToken: 'admin-token',
    account: {
      id: 1,
      role: 'admin',
      name: 'Equipe SEMISPE',
      email: 'admin@example.test',
      phone: null,
      cpf: null,
      cnpj: null,
      institution: null,
    },
    logout: vi.fn(),
    login: vi.fn(),
    createAccount: vi.fn(),
    updateProfile: vi.fn(),
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin" element={<AdminPage />}>
            <Route index element={<AdminOverview />} />
            <Route path="reservas" element={<AdminReservationsPage />} />
            <Route path=":moduleId" element={<AdminPlannedModule />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

it('abre uma visão geral do portal e oferece navegação para os módulos', () => {
  renderAdmin();
  expect(screen.getByRole('heading', { name: 'Administração do portal', level: 1 })).toBeTruthy();
  const menu = within(screen.getByRole('navigation', { name: 'Administração' }));
  expect(menu.getByRole('link', { name: 'Visão geral' }).getAttribute('aria-current')).toBe('page');
  for (const title of [
    'Reservas',
    'Eventos',
    'Notícias',
    'Parceiros',
    'Ecossistema de inovação',
    'Editais',
    'Oportunidades',
    'Usuários e permissões',
  ]) {
    expect(menu.getByRole('link', { name: new RegExp(title) })).toBeTruthy();
  }
  expect(fetchAdminReservations).not.toHaveBeenCalled();
});

it('mantém reservas como módulo e marca somente seu link como ativo', () => {
  renderAdmin('/admin/reservas');
  expect(screen.getByRole('heading', { name: 'Solicitações de reserva' })).toBeTruthy();
  const menu = within(screen.getByRole('navigation', { name: 'Administração' }));
  expect(menu.getByRole('link', { name: 'Reservas' }).getAttribute('aria-current')).toBe('page');
  expect(menu.getByRole('link', { name: 'Visão geral' }).getAttribute('aria-current')).toBeNull();
});

it('identifica funcionalidades futuras como planejadas e permite voltar ao início', () => {
  renderAdmin('/admin/eventos');
  expect(screen.getByRole('heading', { name: 'Eventos', level: 1 })).toBeTruthy();
  expect(screen.getByText('Módulo planejado')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /adicionar|salvar|publicar/i })).toBeNull();
  fireEvent.click(screen.getByRole('link', { name: 'Voltar à visão geral' }));
  expect(screen.getByRole('heading', { name: 'Administração do portal', level: 1 })).toBeTruthy();
});
