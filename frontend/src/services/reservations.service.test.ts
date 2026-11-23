import { afterEach, expect, it, vi } from 'vitest';
import { submitReservation } from './reservations.service';
import type { ReservationRequest } from '../models/reservation.model';
afterEach(() => vi.unstubAllGlobals());
it('envia JSON e arquivos em multipart com Bearer, sem fixar Content-Type', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ id: 99, status: 'pending', createdAt: '2026-11-17' }), { status: 201 })
    );
  vi.stubGlobal('fetch', fetchMock);
  const file = new File(['%PDF'], 'oficio.pdf', { type: 'application/pdf' });
  const request = { spaceId: 47 } as ReservationRequest;
  const receipt = await submitReservation(
    request,
    { oficio: file, projeto: null, apresentacao: null, pauta: null },
    'token-teste'
  );
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toContain('/api/reservations');
  expect(options.method).toBe('POST');
  expect(options.headers.get('Authorization')).toBe('Bearer token-teste');
  expect(options.headers.has('Content-Type')).toBe(false);
  expect(options.body.get('dados')).toBe(JSON.stringify(request));
  expect(options.body.get('oficio')).toBe(file);
  expect(options.body.has('projeto')).toBe(false);
  expect(receipt.id).toBe(99);
});
