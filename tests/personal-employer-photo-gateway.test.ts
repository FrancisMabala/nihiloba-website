import {beforeEach,afterEach,it,expect,vi} from 'vitest';
const jar=new Map<string,string>(),token='employer_photo_synthetic_token_12345';
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key:string,value:string)=>jar.set(key,value)})}));
import {GET,POST,DELETE} from '../app/api/shida/personal/employer-photo/route';
import {GET as publicPhoto} from '../app/api/shida/employer-photo/[asset]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const state={offer_ref:'JOB_fixture',version:'a'.repeat(64),policy:'public-personal-employer-photo-v1',photo:{asset_ref:'AST_fixture',url:'https://private-provider.invalid/secret'}},upstream=vi.fn<typeof fetch>();
const request=(method='GET',query='?offer_ref=JOB_fixture',body?:string,headers:Record<string,string>={})=>new Request('https://nihiloba.com/api/shida/personal/employer-photo/'+query,{method,body,headers:{Origin:'https://nihiloba.com','X-Shida-Session':personalSessionBinding(token),'Content-Type':'application/json',...headers}});
const uploadQuery='?offer_ref=JOB_fixture&version='+state.version+'&policy='+state.policy+'&public_consent=true';
beforeEach(()=>{jar.clear();jar.set(PERSONAL_SESSION_COOKIE,token);upstream.mockReset().mockResolvedValue(Response.json(state));vi.stubGlobal('fetch',upstream);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('requires the owner session and exact query, then strips every provider URL and extra field',async()=>{
 expect((await GET(request('GET',undefined,undefined,{'X-Shida-Session':'other'}))).status).toBe(401);
 for(const query of ['?offer_ref=JOB_fixture&owner=other','?offer_ref=JOB_a&offer_ref=JOB_b','?offer_ref=EMP_other','?asset_ref=AST_a&offer_ref=JOB_a'])expect((await GET(request('GET',query))).status).toBe(404);
 expect(upstream).not.toHaveBeenCalled();const response=await GET(request());expect(response.status).toBe(200);expect(await response.json()).toEqual({...state,photo:{asset_ref:'AST_fixture'}});expect(response.headers.get('cache-control')).toContain('private, no-store');
 expect(String(upstream.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/employment/personal-offer-onboarding/employer-photo?offer_ref=JOB_fixture');
});
it('requires an explicit public consent and version, rejects cross-site uploads and preserves raw MIME',async()=>{
 for(const query of [uploadQuery.replace('true','false'),uploadQuery.replace('public_consent=true','public_consent=1'),uploadQuery.replace(state.policy,'other'),uploadQuery.replace(state.version,'wrong')])expect((await POST(request('POST',query,'image',{'Content-Type':'image/png'}))).status).toBe(422);
 expect((await POST(request('POST',uploadQuery,'image',{'Content-Type':'image/png',Origin:'https://elsewhere.test'}))).status).toBe(403);expect(upstream).not.toHaveBeenCalled();
 expect((await POST(request('POST',uploadQuery,'image',{'Content-Type':'image/webp'}))).status).toBe(200);expect(upstream.mock.calls[0][1]?.headers).toMatchObject({'Content-Type':'image/webp'});expect(upstream.mock.calls[0][1]?.redirect).toBe('manual');
});
it('bounds upload streams to 5 MB and excludes SVG and arbitrary URL payloads',async()=>{
 expect((await POST(request('POST',uploadQuery,'<svg/>',{'Content-Type':'image/svg+xml'}))).status).toBe(415);
 expect((await POST(request('POST',uploadQuery,'x',{'Content-Type':'image/jpeg','Content-Length':String(5*1024*1024+1)}))).status).toBe(413);
 expect((await POST(request('POST',uploadQuery,'x'.repeat(5*1024*1024+1),{'Content-Type':'image/jpeg'}))).status).toBe(413);expect(upstream).not.toHaveBeenCalled();
});
it('keeps removal revision-bound, rejects extra fields and redacts stale details',async()=>{
 expect((await DELETE(request('DELETE','',JSON.stringify({offer_ref:'JOB_fixture',version:state.version,owner:'other'})))).status).toBe(422);
 expect((await DELETE(request('DELETE','',JSON.stringify({offer_ref:'JOB_fixture',version:state.version}),{Origin:'https://other.test'}))).status).toBe(403);expect(upstream).not.toHaveBeenCalled();
 upstream.mockResolvedValueOnce(Response.json({detail:'private stale owner metadata'},{status:409}));const result=await DELETE(request('DELETE','',JSON.stringify({offer_ref:'JOB_fixture',version:state.version})));expect(result.status).toBe(409);expect(await result.text()).not.toContain('private stale');
});
it('refuses mismatched owner projection and malformed photo references',async()=>{
 for(const body of [{...state,offer_ref:'JOB_other'},{...state,photo:{asset_ref:'https://private.test'}},{...state,version:'legacy'},{...state,policy:'old'}]){upstream.mockResolvedValueOnce(Response.json(body));expect((await GET(request())).status).toBe(502);}
});
it('previews only a bound AST JPEG with bounded bytes and no cache',async()=>{
 expect((await GET(request('GET','?asset_ref=https://private.test'))).status).toBe(404);expect(upstream).not.toHaveBeenCalled();
 upstream.mockResolvedValueOnce(new Response(new Uint8Array([255,216,255]),{headers:{'Content-Type':'image/jpeg'}}));const response=await GET(request('GET','?asset_ref=AST_fixture'));expect(response.status).toBe(200);expect(String(upstream.mock.calls[0][0])).toBe('https://backend.test/api/assets/AST_fixture');expect(response.headers.get('x-content-type-options')).toBe('nosniff');
});
it('rejects foreign, oversized, redirected and non-JPEG owner preview responses',async()=>{
 for(const response of [new Response('foreign',{status:404}),new Response(null,{status:302,headers:{Location:'https://provider.invalid'}}),new Response('<svg/>',{headers:{'Content-Type':'image/svg+xml'}}),new Response('x'.repeat(5*1024*1024+1),{headers:{'Content-Type':'image/jpeg'}})]){upstream.mockResolvedValueOnce(response);const result=await GET(request('GET','?asset_ref=AST_fixture'));expect([404,502]).toContain(result.status);expect(await result.text()).not.toContain('foreign');}
});
const publicRequest=(query='')=>new Request('https://nihiloba.com/api/shida/employer-photo/AST_fixture/'+query,{headers:{Cookie:'private=synthetic',Authorization:'synthetic','X-Shida-Session':'synthetic','User-Agent':'private-UA'}});
it('public portrait relay forwards no private identity and disables all caching and redirects',async()=>{
 upstream.mockResolvedValueOnce(new Response(new Uint8Array([255,216,255]),{headers:{'Content-Type':'image/jpeg'}}));const response=await publicPhoto(publicRequest(),{params:Promise.resolve({asset:'AST_fixture'})});expect(response.status).toBe(200);
 expect(upstream.mock.calls[0][0]).toBe('https://backend.test/api/public/emploi/employer-photos/AST_fixture');expect(upstream.mock.calls[0][1]).toMatchObject({headers:{Accept:'image/jpeg'},credentials:'omit',cache:'no-store',redirect:'manual'});expect(Object.keys(upstream.mock.calls[0][1]!.headers!)).toHaveLength(1);expect(response.headers.get('cache-control')).toContain('no-store');expect(response.headers.get('x-content-type-options')).toBe('nosniff');
});
it('public portrait relay rejects scope injection, revoked photos, wrong MIME and oversized delivery',async()=>{
 expect((await publicPhoto(publicRequest('?url=private'),{params:Promise.resolve({asset:'AST_fixture'})})).status).toBe(404);expect((await publicPhoto(publicRequest(),{params:Promise.resolve({asset:'../private'})})).status).toBe(404);expect(upstream).not.toHaveBeenCalled();
 for(const response of [new Response(null,{status:404}),new Response(null,{status:302,headers:{Location:'https://private.test'}}),new Response('svg',{headers:{'Content-Type':'image/svg+xml'}}),new Response('x',{headers:{'Content-Type':'image/jpeg','Content-Length':String(5*1024*1024+1)}}),new Response('x'.repeat(5*1024*1024+1),{headers:{'Content-Type':'image/jpeg'}})]){upstream.mockResolvedValueOnce(response);expect([404,502]).toContain((await publicPhoto(publicRequest(),{params:Promise.resolve({asset:'AST_fixture'})})).status);}
});
