import {beforeEach, afterEach, it, expect, vi} from 'vitest';
const token = 'synthetic_offer_token_not_real_12345', jar = new Map<string, string>();
vi.mock('next/headers', () => ({cookies: async () => ({get: (key: string) => jar.has(key) ? {value: jar.get(key)} : undefined, set: (key: string, value: string) => jar.set(key, value)})}));
import {GET, POST} from '../app/api/shida/personal/job-offer/route';
import {PERSONAL_SESSION_COOKIE, personalSessionBinding} from '../app/api/shida/employment/route-utils';
const upstream = vi.fn<typeof fetch>();
const request = (method = 'GET', body?: string, headers: Record<string, string> = {}, query = '') => new Request('https://nihiloba.com/api/shida/personal/job-offer' + query, {method, body, headers: {Origin: 'https://nihiloba.com', 'Content-Type': 'application/json', 'X-Shida-Session': personalSessionBinding(token), ...headers}});
beforeEach(() => {jar.set(PERSONAL_SESSION_COOKIE, token); vi.stubGlobal('fetch', upstream); vi.stubEnv('SHIDA_API_BASE_URL', 'https://backend.test'); upstream.mockReset().mockResolvedValue(Response.json({progress: []}));});
afterEach(() => {vi.unstubAllGlobals(); vi.unstubAllEnvs();});

it('requires bound session and same-site origin before forwarding', async () => {
  expect((await GET(request('GET', undefined, {'X-Shida-Session': 'wrong'}))).status).toBe(401);
  expect((await POST(request('POST', '{}', {Origin: 'https://evil.test'}))).status).toBe(403);
  expect(upstream).not.toHaveBeenCalled();
  const response = await GET(request());
  expect(response.headers.get('Cache-Control')).toContain('private, no-store');
  expect(String(upstream.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/employment/personal-offer-onboarding');
  expect(upstream.mock.calls[0][1]?.redirect).toBe('manual');
});

it('rejects query scope injection and oversized or malformed inputs', async () => {
  expect((await GET(request('GET', undefined, {}, '?owner=someone'))).status).toBe(404);
  expect((await POST(request('POST', '{}', {'Content-Length': '40001'}))).status).toBe(413);
  expect((await POST(request('POST', 'x'.repeat(40001)))).status).toBe(413);
  expect((await POST(request('POST', '[]'))).status).toBe(422);
  expect(upstream).not.toHaveBeenCalled();
});

it('preserves conflict status without exposing backend details', async () => {
  upstream.mockResolvedValueOnce(Response.json({detail: 'private content'}, {status: 409}));
  const response = await POST(request('POST', '{"action":"save","revision":1}'));
  expect(response.status).toBe(409);
  expect(await response.text()).not.toContain('private content');
});

it('fails safely on upstream timeouts and redirects', async () => {
  upstream.mockRejectedValueOnce(new Error('timeout'));
  expect((await GET(request())).status).toBe(503);
  upstream.mockResolvedValueOnce(new Response(null, {status: 302, headers: {Location: 'https://foreign.test'}}));
  expect((await GET(request())).status).toBe(502);
});

it('recognizes a Personal workspace denial on the catalogue and preserves other not-found responses', async () => {
  const denied = () => Response.json({detail: 'personal_mission_unavailable'}, {status: 404});
  upstream.mockResolvedValueOnce(denied());
  const recovery = await GET(request('GET', undefined, {}, '?kind=catalogue'));
  expect(recovery.status).toBe(403);
  expect(await recovery.json()).toEqual({code: 'personal_sign_in_required'});
  expect(jar.get(PERSONAL_SESSION_COOKIE)).toBe(token);
  upstream.mockResolvedValueOnce(denied());
  expect((await GET(request('GET', undefined, {}, '?kind=manage&offer=JOB_missing'))).status).toBe(404);
  upstream.mockResolvedValueOnce(Response.json({detail:'Not Found'},{status:404}));
  expect((await GET(request('GET', undefined, {}, '?kind=catalogue'))).status).toBe(404);
});
