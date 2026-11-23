import { afterEach, expect, it, vi } from 'vitest';
import { downloadReservationAttachment, fetchAdminReservations, reviewReservation } from './admin-reservations.service';
import { ApiError } from './api';
afterEach(() => vi.unstubAllGlobals());
it('envia filtros e paginação com JWT e sem cache', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ items: [], total: 0, page: 2, limit: 10 })));
  vi.stubGlobal('fetch', fetchMock);
  await fetchAdminReservations({ page: 2, status: 'pending', spaceId: '47', date: '2099-06-10' }, 'admin-token');
  const [url, options] = fetchMock.mock.calls[0];
  const parsed = new URL(url);
  expect(Object.fromEntries(parsed.searchParams)).toEqual({
    page: '2',
    limit: '10',
    status: 'pending',
    spaceId: '47',
    date: '2099-06-10',
  });
  expect(options.headers.get('Authorization')).toBe('Bearer admin-token');
  expect(options.cache).toBe('no-store');
});
it('envia somente a decisão e a observação normalizada; o revisor é definido pelo backend', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
  vi.stubGlobal('fetch', fetchMock);
  await reviewReservation(71, 'rejected', '  Indisponível  ', 'admin-token');
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain('/reservations/71/status');
  expect(options.method).toBe('PATCH');
  expect(JSON.parse(options.body)).toEqual({ status: 'rejected', reviewNote: 'Indisponível' });
});
it('baixa anexo com Bearer no cabeçalho e propaga erros de autorização', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response('%PDF-1.4', { headers: { 'Content-Type': 'application/pdf' } }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 }));
  vi.stubGlobal('fetch', fetchMock);
  const blob = await downloadReservationAttachment(71, 9, 'admin-token');
  expect(blob.size).toBe(8);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toMatch(/\/reservations\/71\/attachments\/9$/);
  expect(url).not.toContain('token');
  expect(options.headers.get('Authorization')).toBe('Bearer admin-token');
  await expect(downloadReservationAttachment(71, 9, 'admin-token')).rejects.toBeInstanceOf(ApiError);
});
