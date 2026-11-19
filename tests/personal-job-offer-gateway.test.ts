import {beforeEach, afterEach, it, expect, vi} from 'vitest';
const token = 'synthetic_offer_token_not_real_12345', jar = new Map<string, string>();
vi.mock('next/headers', () => ({cookies: async () => ({get: (key: string) => jar.has(key) ? {value: jar.get(key)} : undefined, set: (key: string, value: string) => jar.set(key, value)})}));
import {GET, POST} from '../app/api/shida/personal/job-offer/route';
import {PERSONAL_SESSION_COOKIE, personalSessionBinding} from '../app/api/shida/employment/route-utils';
const upstream = vi.fn<typeof fetch>();
const request = (method = 'GET', body?: string, headers: Record<string, string> = {}, query = '') => new Request('https://nihiloba.com/api/shida/personal/job-offer' + query, {method, body, headers: {Origin: 'https://nihiloba.com', 'Content-Type': 'application/json', 'X-Shida-Session': personalSessionBinding(token), ...headers}});
beforeEach(() => {jar.set(PERSONAL_SESSION_COOKIE, token); vi.stubGlobal('fetch', upstream); vi.stubEnv('SHIDA_API_BASE_URL', 'https://backend.test'); upstream.mockReset().mockResolvedValue(Response.json({progress: []}));});
afterEach(() => {vi.unstubAllGlobals(); vi.unstubAllEnvs();});

it.each(['pause','reactivate'])('forwards the confirmed %s command unchanged to the bound management endpoint',async action=>{
  const command={action,version:'synthetic-current-version',confirmed:true,language:'fr'};
  const management={type:'job',reference:'JOB_test',status:action==='pause'?'paused':'open',version:'next-version',allowed_actions:action==='pause'?['reactivate','close','remove']:['pause','close','remove']};
  upstream.mockResolvedValueOnce(Response.json(management));
  const result=await POST(request('POST',JSON.stringify(command),{},'?kind=manage&offer=JOB_test'));
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual(management);
  expect(result.headers.get('Cache-Control')).toContain('private, no-store');
  const [url,options]=upstream.mock.calls[0];
  expect(String(url)).toBe('https://backend.test/api/dashboard/employment/personal-offer-onboarding/JOB_test/manage');
  expect(JSON.parse(String(options?.body))).toEqual(command);
  expect(options).toMatchObject({method:'POST',cache:'no-store',redirect:'manual',headers:{Cookie:`shida_dashboard_session=${token}`,Origin:'https://nihiloba.com'}});
});

it.each(['pause','reactivate'])('does not forward %s from an unbound or cross-site session',async action=>{
  const body=JSON.stringify({action,confirmed:true,version:'current'}),query='?kind=manage&offer=JOB_test';
  expect((await POST(request('POST',body,{'X-Shida-Session':'wrong'},query))).status).toBe(401);
  expect((await POST(request('POST',body,{Origin:'https://evil.test'},query))).status).toBe(403);
  expect(upstream).not.toHaveBeenCalled();
});

it.each([403,404,409,422,503])('retains management failure %s without exposing private lifecycle details',async status=>{
  upstream.mockResolvedValueOnce(Response.json({detail:'private lifecycle reason',phone:'private'}, {status}));
  const result=await POST(request('POST',JSON.stringify({action:'pause',confirmed:true,version:'stale'}),{},'?kind=manage&offer=JOB_test'));
  expect(result.status).toBe(status);
  expect(await result.json()).toEqual({detail:'personal_offer_unavailable'});
  expect(upstream).toHaveBeenCalledTimes(1);
});

it.each(['mission_self_application','mission_application_closed','mission_application_expired','mission_application_disabled'])('forwards only safe application reason %s',async code=>{
  upstream.mockResolvedValueOnce(Response.json({detail:code},{status:409}));
  const response=await GET(request('GET',undefined,{},'?kind=apply&offer=JOB_test'));
  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({code});
  expect(response.headers.get('Cache-Control')).toContain('private, no-store');
});
it('does not interpret legacy or private conflicts as closed applications',async()=>{
  for(const detail of ['mission_closed','private content']){
    upstream.mockResolvedValueOnce(Response.json({detail},{status:409}));
    const response=await GET(request('GET',undefined,{},'?kind=apply&offer=JOB_test'));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({detail:'personal_offer_unavailable'});
  }
});

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
