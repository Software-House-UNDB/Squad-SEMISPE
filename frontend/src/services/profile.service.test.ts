import { afterEach, expect, it, vi } from 'vitest';
import { fetchMyProfile, updateMyProfile } from './auth.service';
afterEach(() => vi.unstubAllGlobals());
const profile = { id: 2, name: 'Maria Silva', email: 'maria@example.test', role: 'user', phone: '98988887777', cpf: '52998224725', institution: null, cnpj: null };
it('consulta o próprio perfil com JWT e sem cache', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(profile))); vi.stubGlobal('fetch', fetchMock);
  expect(await fetchMyProfile('token')).toEqual(profile);
  const [url, options] = fetchMock.mock.calls[0]; expect(url).toContain('/users/me'); expect(options.cache).toBe('no-store'); expect(options.headers.get('Authorization')).toBe('Bearer token');
});
it('atualiza os dados editáveis pelo endpoint do titular', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(profile))); vi.stubGlobal('fetch', fetchMock);
  const payload = { email: profile.email, phone: profile.phone, institution: null, cnpj: null };
  await updateMyProfile(payload, 'token');
  const [url, options] = fetchMock.mock.calls[0]; expect(url).toContain('/users/me'); expect(options.method).toBe('PATCH'); expect(JSON.parse(options.body)).toEqual(payload);
});
