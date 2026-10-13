import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
const token='isolated_test_session_not_real_123456';
const jar=new Map<string,string>();
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key:string,value:string)=>{if(value)jar.set(key,value);else jar.delete(key);}})}));
import {GET,POST,PATCH} from '../app/api/shida/personal/services/[[...path]]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const fetcher=vi.fn<typeof fetch>();
const context=(path='')=>({params:Promise.resolve({path:path?path.split('/'):[]})});
const request=(path='',method='GET',body?:object,extra:Record<string,string>={})=>new Request(`https://nihiloba.com/api/shida/personal/services${path?`/${path}`:''}`,{method,headers:{Origin:'https://nihiloba.com','X-Shida-Session':personalSessionBinding(token),'Content-Type':'application/json',...extra},body:body?JSON.stringify(body):undefined});
beforeEach(()=>{jar.clear();jar.set(PERSONAL_SESSION_COOKIE,token);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');vi.stubGlobal('fetch',fetcher);fetcher.mockReset();fetcher.mockImplementation(async()=>Response.json({profiles:[]}));});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});

describe('Personal Services gateway',()=>{
 it('forwards only the Personal session without Organization selection',async()=>{
  const result=await GET(request(),context());expect(result.status).toBe(200);
  const [target,init]=fetcher.mock.calls[0];expect(String(target)).toBe('https://backend.test/api/dashboard/service-profiles');
  expect((init?.headers as Record<string,string>).Cookie).toBe(`shida_dashboard_session=${token}`);
  expect(result.headers.get('Cache-Control')).toContain('private, no-store');
 });
 it('rejects Organization injection, stale binding and unsupported paths',async()=>{
  expect((await GET(request('?organization_ref=BUS_other'),context())).status).toBe(404);
  expect((await GET(request('SVC_one','GET',undefined,{'X-Shida-Session':'stale'}),context('SVC_one'))).status).toBe(401);
  expect((await GET(request(),context('businesses/BUS_other'))).status).toBe(404);
  expect(fetcher).not.toHaveBeenCalled();
 });
 it('bounds write bodies and requires creation replay key',async()=>{
  expect((await POST(request('','POST',{name:'Solo',service_name:'Visit',category:'cleaning'}),context())).status).toBe(422);
  expect((await POST(request('','POST',{name:'Solo',service_name:'Visit',category:'cleaning'},{'Idempotency-Key':'one'}),context())).status).toBe(200);
  expect((await PATCH(request('SVC_one/details','PATCH',{description:'x'.repeat(11000)}),context('SVC_one/details'))).status).toBe(413);
  expect(fetcher).toHaveBeenCalledTimes(1);
 });
});

it('routes provider transactions without accepting Organization or requester selectors',async()=>{
 const path='transactions/requests';
 expect((await GET(request(path+'?offset=20'),context(path))).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/service-requests?offset=20&provider=true');
 fetcher.mockClear();
 expect((await GET(request(path+'?provider=false'),context(path))).status).toBe(404);
 expect((await POST(request('transactions/quotes/SQT_one/accept','POST',{}),context('transactions/quotes/SQT_one/accept'))).status).toBe(404);
 expect(fetcher).not.toHaveBeenCalled();
 expect((await POST(request('transactions/reservations/RSV_one/decision','POST',{revision:2,decision:'accept',idempotency_key:'one'}),context('transactions/reservations/RSV_one/decision'))).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/service-reservations/RSV_one/decision');
});

it('keeps provider bill writes and exact-customer reads on private authenticated routes',async()=>{
 const issue='transactions/reservations/RSV_one/bills/SBF_one/issue';
 expect((await POST(request(issue,'POST',{revision:2,reservation_revision:1,idempotency_key:'issue-key',due_date:'2030-01-20'}),context(issue))).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/services/reservations/RSV_one/bills/SBF_one/issue');
 fetcher.mockClear();
 const customer='transactions/customer/reservations/RSV_one/bills';
 const response=await GET(request(customer),context(customer));
 expect(response.headers.get('Cache-Control')).toContain('private, no-store');
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/services/customer/reservations/RSV_one/bills');
 fetcher.mockClear();
 expect((await GET(request(customer+'?organization_ref=BUS_other'),context(customer))).status).toBe(404);
 expect(fetcher).not.toHaveBeenCalled();
});

it('routes only Personal Finance entries and requires a replay key',async()=>{
 const path='transactions/finance/entries';
 const payload={measure:'recorded_income',association_kind:'job',reservation_ref:'RSV_one',amount:'1.25',currency:'USD',effective_date:'2026-10-13',category:'service_income'};
 expect((await POST(request(path,'POST',payload),context(path))).status).toBe(422);
 expect((await POST(request(path,'POST',payload,{'Idempotency-Key':'receipt-one'}),context(path))).status).toBe(200);
 const [target,init]=fetcher.mock.calls[0];
 expect(String(target)).toBe('https://backend.test/api/dashboard/services/finance/entries');
 expect((init?.headers as Record<string,string>)['Idempotency-Key']).toBe('receipt-one');
 fetcher.mockClear();
 expect((await GET(request(path+'?organization_ref=BUS_other'),context(path))).status).toBe(404);
 expect((await GET(request('transactions/finance/entries/FEN_one'),context('transactions/finance/entries/FEN_one'))).status).toBe(404);
 expect(fetcher).not.toHaveBeenCalled();
});

it('routes private Personal totals with only exact date filters',async()=>{
 const period='transactions/finance/totals';
 const query='?start_date=2026-10-01&end_date=2026-11-01&as_of=2026-10-20T12%3A00%3A00.000Z';
 expect((await GET(request(period+query),context(period))).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toContain('/api/dashboard/services/finance/totals?start_date=2026-10-01');
 expect((await GET(request(period+query+'&organization_ref=BUS_other'),context(period))).status).toBe(404);
 const job='transactions/finance/reservations/RSV_one/totals';
 expect((await GET(request(job+'?as_of=2026-10-20T12%3A00%3A00Z'),context(job))).status).toBe(200);
 expect(String(fetcher.mock.calls[1][0])).toContain('/api/dashboard/services/finance/reservations/RSV_one/totals?');
});
