import {beforeEach,describe,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({token:'synthetic-meda-session-token-123456'}));
vi.mock('next/headers',()=>({cookies:async()=>({get:()=>({value:state.token})})}));
import {personalSessionBinding} from '../app/api/shida/employment/route-utils';
import {GET,POST} from '../app/api/shida/personal/meda/[[...path]]/route';
import {GET as PUBLIC} from '../app/api/shida/meda/[[...path]]/route';
import {medaCopy} from '../app/lib/meda-copy';
const context=(path:string)=>({params:Promise.resolve({path:path.split('/')})});
const request=(path:string,method='GET',headers:Record<string,string>={},body?:string)=>new Request('https://nihiloba.com/api/shida/personal/meda/'+path,{method,headers:{'x-shida-session':personalSessionBinding(state.token),...headers},body});
beforeEach(()=>{vi.stubGlobal('fetch',vi.fn(async()=>Response.json({items:[],page:1,has_more:false})));});
describe('Meda gateway',()=>{
 it('requires the existing per-login binding before forwarding private reads',async()=>{
  const response=await GET(request('listings','GET',{'x-shida-session':'old-binding'}),context('listings'));
  expect(response.status).toBe(401);expect(fetch).not.toHaveBeenCalled();
 });
 it('forwards only the personal cookie and fixed upstream path',async()=>{
  const response=await GET(request('listings'),context('listings'));
  expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toContain('no-store');
  const [url,init]=vi.mocked(fetch).mock.calls[0];expect(String(url)).toBe('https://api.nihiloba.com/api/dashboard/personal/meda/listings');
  expect((init?.headers as Record<string,string>).Cookie).toBe('shida_dashboard_session='+state.token);
 });
 it.each(['admin','listings/../../admin','enquiries/MEQ_test/read'])('rejects private GET outside the allowlist: %s',async path=>{
  expect((await GET(request('listings'),context(path))).status).toBe(404);expect(fetch).not.toHaveBeenCalled();
 });
 it.each([undefined,'https://evil.example'])('rejects mutations without a valid origin: %s',async origin=>{
  expect((await POST(request('listings','POST',{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},'{}'),context('listings'))).status).toBe(403);
  expect(fetch).not.toHaveBeenCalled();
 });
 it('rejects oversized bodies and duplicate query parameters',async()=>{
  expect((await POST(request('listings','POST',{'Content-Type':'application/json',Origin:'https://nihiloba.com'},JSON.stringify({body:'x'.repeat(16001)})),context('listings'))).status).toBe(413);
  expect((await GET(request('listings?page=1&page=2'),context('listings'))).status).toBe(422);
 });
 it('preserves known validation errors and hides arbitrary backend details',async()=>{
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({detail:'meda_contact'},{status:422}));
  expect(await (await POST(request('listings','POST',{'Content-Type':'application/json',Origin:'https://nihiloba.com'},'{}'),context('listings'))).json()).toEqual({detail:'meda_contact'});
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({detail:'private backend contents'},{status:500}));
  expect(await (await GET(request('listings'),context('listings'))).json()).toEqual({detail:'meda_unavailable'});
 });
 it('public browsing never forwards cookies or user-controlled destinations',async()=>{
  const result=await PUBLIC(new Request('https://nihiloba.com/api/shida/meda/listings?origin=Paris',{headers:{Cookie:'private=secret'}}),context('listings'));
  expect(result.status).toBe(200);expect((vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string,string>).Cookie).toBeUndefined();
 });
 it('has complete localized copy without raw error keys',()=>{
  const keys=Object.keys(medaCopy.en).sort();for(const copy of Object.values(medaCopy)){expect(Object.keys(copy).sort()).toEqual(keys);for(const [key,value] of Object.entries(copy)){expect(value.trim()).not.toBe('');if(key.startsWith('meda_'))expect(value).not.toBe(key);}}
 });
});
