import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {POST} from '../app/api/shida/statistics/route';
const body={consent:true,policy:'web-statistics-v1',visitor:'00000000-0000-4000-8000-000000000001',session:'00000000-0000-4000-8000-000000000002',visit:'00000000-0000-4000-8000-000000000003',page_group:'employment',device:'phone',browser:'chrome',language:'fr',source:'direct',active_seconds:0};
const upstream=vi.fn<typeof fetch>();
const request=(value:unknown=body,headers:Record<string,string>={},query='')=>new Request('https://nihiloba.com/api/shida/statistics/'+query,{method:'POST',headers:{Origin:'https://nihiloba.com','Content-Type':'application/json',cookie:'private=synthetic','User-Agent':'private-browser','X-Forwarded-For':'192.0.2.1',Referer:'https://nihiloba.com/private?token=synthetic',...headers},body:typeof value==='string'?value:JSON.stringify(value)});
beforeEach(()=>{upstream.mockReset().mockResolvedValue(new Response(null,{status:204}));vi.stubGlobal('fetch',upstream);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('forwards only the exact consented categories without cookies, URL, IP, UA or credentials',async()=>{
 const response=await POST(request());expect(response.status).toBe(204);expect(response.headers.get('cache-control')).toContain('no-store');
 expect(upstream.mock.calls[0][0]).toBe('https://backend.test/api/public/shida/statistics');expect(upstream.mock.calls[0][1]).toMatchObject({credentials:'omit',redirect:'manual',cache:'no-store',headers:{Origin:'https://nihiloba.com','Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});expect(Object.keys(upstream.mock.calls[0][1]!.headers!)).toHaveLength(3);
});
it('rejects absent origin, cross-site, unknown query, consent false, extra fields and invalid enums',async()=>{
 expect((await POST(request(body,{Origin:'https://evil.test'}))).status).toBe(403);const missing=request();missing.headers.delete('origin');expect((await POST(missing)).status).toBe(403);
 expect((await POST(request(body,{'Sec-Fetch-Site':'cross-site'}))).status).toBe(403);expect((await POST(request(body,{},'?url=secret'))).status).toBe(404);
 for(const value of [{...body,consent:false},{...body,consent:'true'},{...body,url:'secret'},{...body,visitor:'account-id'},{...body,device:'iPhone serial'},{...body,active_seconds:0.1},{...body,active_seconds:14401},{...body,active_seconds:-1},{...body,policy:'other'},null,[]])expect((await POST(request(value))).status).toBe(422);
 expect(upstream).not.toHaveBeenCalled();
});
it('bounds declared and streamed bodies to 2048 bytes and rejects unsupported content types',async()=>{
 expect((await POST(request(body,{'Content-Length':'2049'}))).status).toBe(413);expect((await POST(request(' '.repeat(2049)))).status).toBe(413);expect((await POST(request(body,{'Content-Type':'text/plain'}))).status).toBe(415);expect(upstream).not.toHaveBeenCalled();
});
it('redacts upstream errors and rejects redirects rather than following them',async()=>{
 for(const response of [new Response('private debug',{status:500}),new Response(null,{status:302,headers:{Location:'https://foreign.test'}}),new Response('private debug',{status:429})]){upstream.mockResolvedValueOnce(response);const result=await POST(request());expect([503,429]).toContain(result.status);expect(await result.text()).not.toContain('private debug');}
});
