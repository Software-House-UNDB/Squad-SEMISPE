import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const station = {
  id: 1,
  name: 'Centro - SEMIT',
  latitude: -2.53,
  longitude: -44.3,
  online: true,
  lastDataReceivedAt: '2026-11-23T18:00:00.000Z',
  aqi: 29,
  parameters: [],
};

beforeEach(() => vi.resetModules());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function loadService() {
  return (await import('./stationsService')).listStations;
}

it('em produção sem VITE_API_URL lê o stations.json do próprio site', async () => {
  vi.stubEnv('PROD', true);
  vi.stubEnv('VITE_API_URL', '');
  const generatedAt = '2026-11-23T18:27:55.384Z';
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ generatedAt, stations: [station] })));
  vi.stubGlobal('fetch', fetchMock);

  expect(await (await loadService())()).toEqual({ stations: [station], generatedAt });
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toMatch(/\/stations\.json$/);
  expect(url).not.toContain('/api/');
  expect(options.cache).toBe('no-cache');
  expect(options.headers).toBeUndefined();
});

it('falha com mensagem clara quando o stations.json ainda não existe', async () => {
  vi.stubEnv('PROD', true);
  vi.stubEnv('VITE_API_URL', '');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));

  await expect((await loadService())()).rejects.toThrow('ainda não estão disponíveis');
});

it('com VITE_API_URL consulta a API e não o arquivo estático', async () => {
  vi.stubEnv('PROD', true);
  vi.stubEnv('VITE_API_URL', 'https://api.exemplo.com/api');
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([station])));
  vi.stubGlobal('fetch', fetchMock);

  expect(await (await loadService())()).toEqual({ stations: [station], generatedAt: null });
  expect(fetchMock.mock.calls[0][0]).toBe('https://api.exemplo.com/api/stations');
});

it('em desenvolvimento consulta a API local mesmo sem VITE_API_URL', async () => {
  vi.stubEnv('PROD', false);
  vi.stubEnv('VITE_API_URL', '');
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([station])));
  vi.stubGlobal('fetch', fetchMock);

  await (await loadService())();
  expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/api/stations');
});
