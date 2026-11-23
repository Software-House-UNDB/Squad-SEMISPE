import { afterEach, expect, it, vi } from 'vitest';
import { sendContact } from './contacts.service';
afterEach(() => vi.unstubAllGlobals());

it('integra o formulário ao POST público sem autenticação ou dados administrativos', async () => {
  const receipt = { id: 8, createdAt: '2026-11-23T12:00:00Z', message: 'Mensagem recebida com sucesso.' };
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(receipt), { status: 201 }));
  vi.stubGlobal('fetch', fetchMock);
  const request = { name: 'Maria', email: 'maria@example.com', subject: 'Visita', message: 'Gostaria de visitar.' };
  expect(await sendContact(request)).toEqual(receipt);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain('/api/contacts');
  expect(options.method).toBe('POST');
  expect(options.headers.get('Content-Type')).toBe('application/json');
  expect(options.headers.has('Authorization')).toBe(false);
  expect(JSON.parse(options.body)).toEqual(request);
  expect(options.signal).toBeTruthy();
});
