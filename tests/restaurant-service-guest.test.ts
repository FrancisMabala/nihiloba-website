import {it,expect,vi,afterEach} from 'vitest';
import {GET,POST} from '../app/api/shida/restaurant-guests/[...path]/route';
import {guestRoute,guestBody,GUEST_COOKIE} from '../app/lib/restaurant-guest-contract';
import {guestAction,replayGuestAction} from '../app/lib/restaurant-guest-browser';
const visit='establishments/RST_one/visits/RGV_one',proposal=visit+'/service-proposals/RSP_one/approve';
const body={operation_key:'approve-original',group_revision:4,visit_revision:2,confirm:true};
const ctx=(path:string)=>({params:Promise.resolve({path:path.split('/')})});
const req=(path:string,method='GET',data?:unknown,origin='https://nihiloba.com')=>new Request('https://nihiloba.com/api/shida/restaurant-guests/'+path,{method,headers:{Origin:origin,Cookie:GUEST_COOKIE+'='+'x'.repeat(43),'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})});
afterEach(()=>vi.unstubAllGlobals());
it('adds exactly the three association routes; no decline, assisted actions, bearer or billing endpoint',()=>{
 for(const [path,method] of [[visit+'/service-proposals','GET'],[visit+'/service-group','GET'],[proposal,'POST']])expect(guestRoute(path,method)).toBe(true);
 for(const path of [visit+'/service-proposals/RSP_one/decline',visit+'/service-group/approve',visit+'/service-group/bill',visit+'/service/orders/ROD_one/pickup-code'])for(const method of ['GET','POST'])expect(guestRoute(path,method)).toBe(false);
 expect(guestRoute(proposal,'GET')).toBe(false);
});
it('requires exact operation/revision envelope and explicit true guest confirmation',()=>{
 expect(guestBody(proposal,body)).toBe(true);
 for(const extra of [{confirm:false},{visit_revision:0},{group_revision:undefined},{visit_secret:'public-ref'},{assignment_ref:'RKA_one'},{payment_verified:true}])expect(guestBody(proposal,{...body,...extra})).toBe(false);
});
it('preserves HTTPS same-origin cookie-only authority, exact query and private errors',async()=>{
 const fetcher=vi.fn(async()=>Response.json({items:[],copy:{}}));vi.stubGlobal('fetch',fetcher);
 const list=await GET(req(visit+'/service-proposals?language=ln'),ctx(visit+'/service-proposals'));expect(list.status).toBe(200);expect(list.headers.get('cache-control')).toBe('private, no-store');expect(list.headers.get('vary')).toBe('Cookie, Origin');
 expect((fetcher.mock.calls[0] as unknown as [URL,RequestInit])[1].headers).toMatchObject({Cookie:GUEST_COOKIE+'='+'x'.repeat(43)});
 expect((await GET(req(visit+'/service-group?language=en'),ctx(visit+'/service-group'))).status).toBe(422);
 expect((await POST(req(proposal,'POST',body,'https://bad.invalid'),ctx(proposal))).status).toBe(403);
 expect(fetcher).toHaveBeenCalledTimes(1);
});
it('rereads visit, pending proposals and confirmed group before retrying exactly the original approval',async()=>{
 const fetcher=vi.fn(async()=>Response.json({group:null,items:[]}));vi.stubGlobal('fetch',fetcher);
 const original=guestAction('/visits/RGV_one/service-proposals/RSP_one/approve','POST',body);
 await replayGuestAction('RST_one','RGV_one',original);
 const calls=fetcher.mock.calls as unknown as [string,RequestInit][];
 expect(calls.map(([url])=>url.split('/').filter(Boolean).at(-1))).toEqual(['RGV_one','service-proposals','service-group','approve']);
 expect(calls[3][1].body).toBe(original.body);expect(calls.slice(0,3).every(([,init])=>!init.method)).toBe(true);
});
