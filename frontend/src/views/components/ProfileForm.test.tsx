import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ProfileForm } from './ProfileForm';
import { useAuth } from '../../viewmodels/useAuth';
import { ApiError } from '../../services/api';
import type { UserAccount } from '../../models/auth.model';
vi.mock('../../viewmodels/useAuth', () => ({ useAuth: vi.fn() }));
const account: UserAccount = {
  id: 2,
  role: 'user',
  name: 'Maria Silva',
  email: 'maria@example.test',
  cpf: '52998224725',
  phone: '98999999999',
  cnpj: null,
  institution: null,
};
const update = vi.fn();
beforeEach(() => {
  update.mockReset().mockResolvedValue({ ...account, phone: '98988887777' });
  vi.mocked(useAuth).mockReturnValue({
    status: 'authenticated',
    accessToken: 'token',
    account,
    logout: vi.fn(),
    login: vi.fn(),
    createAccount: vi.fn(),
    updateProfile: update,
  });
});
afterEach(cleanup);
function setup() {
  const saved = vi.fn(),
    expired = vi.fn();
  render(<ProfileForm account={account} onSaved={saved} onSessionExpired={expired} />);
  return { saved, expired };
}
it('mantém nome e CPF bloqueados e envia apenas dados editáveis', async () => {
  const { saved } = setup();
  expect((screen.getByLabelText('Nome completo') as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByLabelText('CPF') as HTMLInputElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Telefone com DDD'), { target: { value: '98988887777' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(update).toHaveBeenCalledWith({ email: account.email, phone: '98988887777', institution: null, cnpj: null });
  expect(screen.getByRole('status').textContent).toContain('atualizados com sucesso');
});
it('recusa telefone inválido antes do envio', async () => {
  setup();
  fireEvent.change(screen.getByLabelText('Telefone com DDD'), { target: { value: '123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('telefone válido'));
  expect(update).not.toHaveBeenCalled();
});
it('mantém alterações em caso de e-mail duplicado e não apresenta sucesso', async () => {
  update.mockRejectedValue(new ApiError(409, 'Já existe um usuário cadastrado com este e-mail.'));
  setup();
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'outro@example.test' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('este e-mail'));
  expect((screen.getByLabelText('E-mail') as HTMLInputElement).value).toBe('outro@example.test');
  expect(screen.queryByRole('status')).toBeNull();
});
it('solicita novo login em caso de sessão expirada', async () => {
  update.mockRejectedValue(new ApiError(401, 'Unauthorized'));
  const { expired } = setup();
  fireEvent.change(screen.getByLabelText('Telefone com DDD'), { target: { value: '98988887777' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await waitFor(() => expect(expired).toHaveBeenCalledTimes(1));
});
