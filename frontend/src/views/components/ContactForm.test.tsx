import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ContactForm } from './ContactForm';
import { useContatoViewModel } from '../../viewmodels/useContatoViewModel';
import { sendContact } from '../../services/contacts.service';
import { ApiError } from '../../services/api';

vi.mock('../../services/contacts.service', () => ({ sendContact: vi.fn() }));
const receipt = { id: 12, createdAt: '2026-11-23T12:00:00Z', message: 'Mensagem recebida com sucesso.' };
function Harness() { return <ContactForm vm={useContatoViewModel()} />; }
function renderForm() { render(<MemoryRouter><Harness /></MemoryRouter>); }
function fillForm() {
  fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: ' Maria Silva ' } });
  fireEvent.change(screen.getByLabelText(/^E-mail/), { target: { value: ' Maria@Example.com ' } });
  fireEvent.change(screen.getByLabelText(/^Assunto/), { target: { value: ' Visita ao Parque ' } });
  fireEvent.change(screen.getByLabelText(/^Mensagem/), { target: { value: ' Gostaria de conhecer os espaços. ' } });
  fireEvent.click(screen.getByRole('checkbox'));
}
beforeEach(() => { vi.mocked(sendContact).mockReset().mockResolvedValue(receipt); });
afterEach(cleanup);

it('valida campos obrigatórios e autorização antes de chamar a API', async () => {
  renderForm();
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
  await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(5));
  expect(sendContact).not.toHaveBeenCalled();
});

it('envia sem login somente os quatro campos normalizados e confirma o recebimento', async () => {
  renderForm(); fillForm();
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Mensagem recebida!'));
  expect(sendContact).toHaveBeenCalledExactlyOnceWith({
    name: 'Maria Silva', email: 'maria@example.com', subject: 'Visita ao Parque', message: 'Gostaria de conhecer os espaços.',
  });
  expect(document.activeElement).toBe(screen.getByRole('status'));
  expect(screen.getByRole('status').textContent).not.toMatch(/e-mail enviado/i);
  fireEvent.click(screen.getByRole('button', { name: /Enviar outra mensagem/ }));
  expect((screen.getByLabelText(/^Nome/) as HTMLInputElement).value).toBe('');
  expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
});

it('bloqueia envio duplicado e mantém a indicação de envio até a resposta', async () => {
  let finish!: (value: typeof receipt) => void;
  vi.mocked(sendContact).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  renderForm(); fillForm();
  const form = screen.getByRole('form', { name: 'Envie sua mensagem' });
  fireEvent.submit(form); fireEvent.submit(form);
  await waitFor(() => expect(sendContact).toHaveBeenCalledTimes(1));
  expect((screen.getByRole('button', { name: 'Enviando…' }) as HTMLButtonElement).disabled).toBe(true);
  finish(receipt);
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Mensagem recebida!'));
  expect(sendContact).toHaveBeenCalledTimes(1);
});

it('preserva os dados quando a rede falha e permite uma nova tentativa manual', async () => {
  vi.mocked(sendContact).mockRejectedValueOnce(new TypeError('Failed to fetch'));
  renderForm(); fillForm();
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Seus dados foram mantidos'));
  expect((screen.getByLabelText(/^Assunto/) as HTMLInputElement).value).toBe(' Visita ao Parque ');
  expect(screen.queryByRole('status')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Mensagem recebida!'));
});

it('informa o limite de tentativas sem apagar a mensagem', async () => {
  vi.mocked(sendContact).mockRejectedValue(new ApiError(429, 'Too Many Requests'));
  renderForm(); fillForm();
  fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Aguarde um minuto'));
  expect((screen.getByLabelText(/^Mensagem/) as HTMLTextAreaElement).value).toContain('conhecer os espaços');
});
