import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const token='candidate_test_token_not_real_12345',jar=new Map<string,string>();
vi.mock('next/headers',()=>({cookies:async()=>({get:(k:string)=>jar.has(k)?{value:jar.get(k)}:undefined,set:(k:string,v:string)=>jar.set(k,v)})}));
import {GET,POST,DELETE} from '../app/api/shida/personal/candidate/[[...path]]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const upstream=vi.fn<typeof fetch>();
const context=(path:string[]=[])=>({params:Promise.resolve({path})});
const request=(method='GET',body?:string,headers:Record<string,string>={},query='')=>new Request('https://nihiloba.com/api/shida/personal/candidate'+query,{method,body,headers:{Origin:'https://nihiloba.com','Content-Type':'application/json','X-Shida-Session':personalSessionBinding(token),...headers}});
beforeEach(()=>{jar.set(PERSONAL_SESSION_COOKIE,token);vi.stubGlobal('fetch',upstream);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');upstream.mockReset().mockResolvedValue(Response.json({profiles:[]}));});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('requires the bound account and an allowed origin before forwarding',async()=>{
 expect((await GET(request('GET',undefined,{'X-Shida-Session':'wrong'}),context())).status).toBe(401);
 expect((await POST(request('POST','{}',{Origin:'https://evil.test'}),context())).status).toBe(403);
 expect(upstream).not.toHaveBeenCalled();
 const response=await GET(request('GET',undefined,{},'?language=ln'),context());expect(response.status).toBe(200);
 expect(response.headers.get('Cache-Control')).toContain('private, no-store');
 expect(String(upstream.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/employment/candidate-onboarding?language=ln');
 expect(upstream.mock.calls[0][1]?.redirect).toBe('manual');
});
it('rejects scope injection, unknown paths, oversized bodies and non-PDF uploads',async()=>{
 expect((await GET(request('GET',undefined,{},'?owner=someone'),context())).status).toBe(404);
 expect((await POST(request('POST','{}'),context(['publish']))).status).toBe(404);
 expect((await POST(request('POST','{}',{'Content-Length':'40001'}),context())).status).toBe(413);
 expect((await POST(request('POST','{}'),context(['document']))).status).toBe(415);
 expect(upstream).not.toHaveBeenCalled();
});
it('retains stale revision errors without reflecting private backend details',async()=>{
 upstream.mockResolvedValueOnce(Response.json({detail:'private candidate content'},{status:409}));
 const response=await POST(request('POST','{"action":"save","revision":1}'),context());
 expect(response.status).toBe(409);expect(await response.text()).not.toContain('private candidate content');
});
it('forwards bounded title suggestions without permitting scope or duplicate query injection',async()=>{
 const response=await GET(request('GET',undefined,{},'?category=it_telecommunications&query=Engineer&language=en'),context(['title-suggestions']));
 expect(response.status).toBe(200);
 expect(String(upstream.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/employment/candidate-onboarding/title-suggestions?category=it_telecommunications&query=Engineer&language=en');
 upstream.mockClear();
 for(const query of ['?category=it&category=health','?category=it&owner=USR_other','?category=it&query='+ 'a'.repeat(81),'?category=../private'])expect((await GET(request('GET',undefined,{},query),context(['title-suggestions']))).status).toBe(404);
 expect(upstream).not.toHaveBeenCalled();
});
it('keeps photo upload revision-bound, image-only and limited to five MB',async()=>{
 const query='?target=draft&reference=COP_sample&revision=3&language=fr';
 expect((await POST(request('POST','image',{'Content-Type':'image/png'},query),context(['photo']))).status).toBe(200);
 expect(upstream.mock.calls[0][1]?.headers).toMatchObject({'Content-Type':'image/png'});
 expect(String(upstream.mock.calls[0][0])).toContain('reference=COP_sample&revision=3');
 upstream.mockClear();
 expect((await POST(request('POST','x',{'Content-Type':'image/svg+xml'},query),context(['photo']))).status).toBe(415);
 expect((await POST(request('POST','x',{'Content-Type':'image/jpeg','Content-Length':String(5*1024*1024+1)},query),context(['photo']))).status).toBe(413);
 expect((await POST(request('POST','x',{'Content-Type':'image/jpeg'},'?target=draft&reference=COP_sample'),context(['photo']))).status).toBe(404);
 expect(upstream).not.toHaveBeenCalled();
});
it('bounds streamed photo uploads even when content-length is absent',async()=>{
 expect((await POST(request('POST','x'.repeat(5*1024*1024+1),{'Content-Type':'image/jpeg'},'?target=draft&reference=COP_sample&revision=1'),context(['photo']))).status).toBe(413);
 expect(upstream).not.toHaveBeenCalled();
});
it('requires origin and binding for removal and preserves the photo conflict response',async()=>{
 const payload=JSON.stringify({target:'profile',reference:'CND_owned',version:'2026-11-20T12:00:00Z'});
 expect((await DELETE(request('DELETE',payload,{Origin:'https://evil.test'}),context(['photo']))).status).toBe(403);
 expect((await DELETE(request('DELETE',payload,{'X-Shida-Session':'foreign'}),context(['photo']))).status).toBe(401);
 expect(upstream).not.toHaveBeenCalled();
 upstream.mockResolvedValueOnce(Response.json({detail:'private stale photo'},{status:409}));
 const response=await DELETE(request('DELETE',payload),context(['photo']));
 expect(response.status).toBe(409);expect(await response.text()).not.toContain('private stale');
 expect(upstream.mock.calls[0][1]?.method).toBe('DELETE');
});
it('relays private JPEG bytes only after authenticating the exact session',async()=>{
 const query='?asset_ref=AST_owned';
 expect((await GET(request('GET',undefined,{'X-Shida-Session':'foreign'},query),context(['photo']))).status).toBe(401);
 expect((await GET(request('GET',undefined,{},'?asset_ref=https://evil.test/photo'),context(['photo']))).status).toBe(404);
 expect(upstream).not.toHaveBeenCalled();
 upstream.mockResolvedValueOnce(new Response(new Uint8Array([255,216,255]),{headers:{'Content-Type':'image/jpeg'}}));
 const response=await GET(request('GET',undefined,{},query),context(['photo']));
 expect(String(upstream.mock.calls[0][0])).toBe('https://backend.test/api/assets/AST_owned');
 expect(response.headers.get('Cache-Control')).toContain('private, no-store');
 expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
 expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([255,216,255]));
});
it('fails closed for foreign assets, redirects, wrong MIME or oversized private delivery',async()=>{
 const query='?asset_ref=AST_owned';
 for(const upstreamResponse of [Response.json({detail:'foreign owner'},{status:404}),new Response(null,{status:302,headers:{Location:'https://private.test'}}),new Response('<svg/>',{headers:{'Content-Type':'image/svg+xml'}}),new Response('x',{headers:{'Content-Type':'image/jpeg','Content-Length':String(5*1024*1024+1)}}),new Response('x'.repeat(5*1024*1024+1),{headers:{'Content-Type':'image/jpeg'}})]){
  upstream.mockResolvedValueOnce(upstreamResponse);const response=await GET(request('GET',undefined,{},query),context(['photo']));
  expect([404,502]).toContain(response.status);expect(await response.text()).not.toContain('foreign owner');
 }
});
