import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
const token='isolated_test_session_not_real_123456';
const jar=new Map<string,string>();
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>jar.has(key)?{value:jar.get(key)}:undefined,set:(key:string,value:string)=>{if(value)jar.set(key,value);else jar.delete(key);}})}));
import {GET,POST,PATCH,DELETE} from '../app/api/shida/personal/services/[[...path]]/route';
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from '../app/api/shida/employment/route-utils';
const fetcher=vi.fn<typeof fetch>();
const context=(path='')=>({params:Promise.resolve({path:path?path.split('/'):[]})});
const request=(path='',method='GET',body?:object,extra:Record<string,string>={})=>new Request(`https://nihiloba.com/api/shida/personal/services${path?`/${path}`:''}`,{method,headers:{Origin:'https://nihiloba.com','X-Shida-Session':personalSessionBinding(token),'Content-Type':'application/json',...extra},body:body?JSON.stringify(body):undefined});
beforeEach(()=>{jar.clear();jar.set(PERSONAL_SESSION_COOKIE,token);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');vi.stubGlobal('fetch',fetcher);fetcher.mockReset();fetcher.mockImplementation(async()=>Response.json({profiles:[]}));});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});

it('routes exact Personal calendar, hours and QR reads and authenticated schedule writes',async()=>{
 for(const path of ['calendar?date_from=2026-12-01&date_to=2027-01-01&page=1&offering_ref=SVC_one','SVC_one/schedule','SVC_one/share?language=ln']){
  expect((await GET(request(path),context(path.split('?')[0]))).status).toBe(200);
 }
 const body={expected_revision:1,operation_key:'hours-1',mode:'appointments',confirmation:'automatic',hours:[{day:'monday',start:'09:00',end:'17:00'}]};
 expect((await PATCH(request('SVC_one/schedule','PATCH',body),context('SVC_one/schedule'))).status).toBe(200);
 expect(JSON.parse(fetcher.mock.calls.at(-1)?.[1]?.body as string)).toEqual(body);
 for(const path of ['calendar?date_from=bad&date_to=2027-01-01','calendar?date_from=2026-12-01&date_from=2026-12-02&date_to=2027-01-01','calendar?organization_ref=BUS_other']){
  expect((await GET(request(path),context('calendar'))).status).toBe(404);
 }
 expect(fetcher).toHaveBeenCalledTimes(4);
});

describe('Personal Services gateway',()=>{
 it('keeps Today Personal and preserves only an allowed language',async()=>{
  expect((await GET(request('today?language=sw'),context('today'))).status).toBe(200);
  expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/service-profiles/today?language=sw');
  fetcher.mockClear();
  expect((await GET(request('today?organization_ref=BUS_other'),context('today'))).status).toBe(404);
  expect(fetcher).not.toHaveBeenCalled();
 });
 it('routes bounded aggregate reports and private CSV without Organization selectors',async()=>{
  const path='transactions/reports/operational.csv';
  const query='?start_date=2026-10-01&end_date=2026-10-15';
  fetcher.mockImplementationOnce(async()=>new Response('start_date,offering\n2026-10-01,safe\n',{headers:{'Content-Type':'text/csv','Content-Disposition':'attachment; filename="services-operational-report.csv"'}}));
  const result=await GET(request(path+query),context(path));
  expect(result.status).toBe(200);
  expect(result.headers.get('Cache-Control')).toContain('private, no-store');
  expect(result.headers.get('content-disposition')).toContain('attachment');
  expect(await result.text()).toContain('safe');
  expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/services/reports/operational.csv'+query);
  fetcher.mockClear();
  expect((await GET(request(path+query+'&organization_ref=BUS_other'),context(path))).status).toBe(404);
  expect(fetcher).not.toHaveBeenCalled();
 });
 it('reads the private effective Services pilot capabilities',async()=>{
  const result=await GET(request('capabilities'),context('capabilities'));
  expect(result.status).toBe(200);
  expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/service-profiles/capabilities');
  expect(result.headers.get('Cache-Control')).toContain('private, no-store');
 });
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

it('routes only Personal template management and draft application',async()=>{
 const list='transactions/templates';
 expect((await GET(request(list+'?kind=quote'),context(list))).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/services/templates?kind=quote');
 fetcher.mockClear();
 const apply='transactions/templates/SDT_one/apply';
 expect((await POST(request(apply,'POST',{template_revision:1,target_ref:'SWR_one',target_revision:1,idempotency_key:'apply-one'}),context(apply))).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/services/templates/SDT_one/apply');
 fetcher.mockClear();
 expect((await GET(request(list+'?organization_ref=BUS_other'),context(list))).status).toBe(404);
 expect((await POST(request('transactions/templates/SDT_one/issue','POST',{}),context('transactions/templates/SDT_one/issue'))).status).toBe(404);
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

it('routes bill presentation only in the bound Personal context',async()=>{
 const path='transactions/bill-presentation';
 expect((await GET(request(path),context(path))).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/services/bill-presentation');
 fetcher.mockClear();
 const body={revision:1,idempotency_key:'branding-one',display_name:'Studio Kivu',accent:'blue'};
 expect((await PATCH(request(path,'PATCH',body),context(path))).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/services/bill-presentation');
 fetcher.mockClear();
 expect((await GET(request(path+'?organization_ref=BUS_other'),context(path))).status).toBe(404);
 expect(fetcher).not.toHaveBeenCalled();
});

it('allows only exact Personal job declarations and paged customer history reads',async()=>{
 const entries='transactions/finance/entries';
 expect((await GET(request(entries+'?reservation_ref=RSV_one&offset=20'),context(entries))).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toContain('/services/finance/entries?reservation_ref=RSV_one&offset=20');
 fetcher.mockClear();
 const history='transactions/reservations/RSV_one/customer-history';
 expect((await GET(request(history+'?offset=20'),context(history))).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toContain('/service-reservations/RSV_one/customer-history?offset=20');
 fetcher.mockClear();
 expect((await GET(request(entries+'?reservation_ref=RSV_bad%2Fpath'),context(entries))).status).toBe(404);
 expect((await GET(request(history+'?organization_ref=BUS_other'),context(history))).status).toBe(404);
 expect((await GET(request('transactions/reservations/RSV_one/customer-history/entries'),context('transactions/reservations/RSV_one/customer-history/entries'))).status).toBe(404);
 expect(fetcher).not.toHaveBeenCalled();
});

it('routes version-bound bill delivery and rejects injected scope',async()=>{
 const path='transactions/reservations/RSV_one/bills/SBF_one/send';
 const payload={version_ref:'SBV_one',revision:2,reservation_revision:1,idempotency_key:'bill-send-key'};
 const response=await POST(request(path,'POST',payload),context(path));
 expect(response.status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toContain('/api/dashboard/services/reservations/RSV_one/bills/SBF_one/send');
 expect(response.headers.get('Cache-Control')).toContain('no-store');
 expect(fetcher.mock.calls[0][1]?.body).toBe(JSON.stringify(payload));
 fetcher.mockClear();
 expect((await POST(request(path+'?organization_ref=BUS_wrong','POST',payload),context(path))).status).toBeGreaterThanOrEqual(400);
 expect(fetcher).not.toHaveBeenCalled();
 const history='transactions/bills/SBF_one/deliveries';
 expect((await GET(request(history),context(history))).status).toBe(200);
});

it('archives and restores only an exact Personal service with a bounded revision',async()=>{
 expect((await DELETE(request('SVC_one?expected_revision=3','DELETE',{}),context('SVC_one'))).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/service-profiles/SVC_one?expected_revision=3');
 expect(fetcher.mock.calls[0][1]?.method).toBe('DELETE');
 expect((await POST(request('SVC_one/reactivate?expected_revision=4','POST',{}),context('SVC_one/reactivate'))).status).toBe(200);
 expect(String(fetcher.mock.calls[1][0])).toBe('https://backend.test/api/dashboard/service-profiles/SVC_one/reactivate?expected_revision=4');
 fetcher.mockClear();
 for(const query of ['', '?expected_revision=-1', '?expected_revision=0', '?expected_revision=1&expected_revision=2','?expected_revision=3&organization_ref=BUS_other']){
  expect((await DELETE(request('SVC_one'+query,'DELETE',{}),context('SVC_one'))).status).toBe(404);
  expect((await POST(request('SVC_one/reactivate'+query,'POST',{}),context('SVC_one/reactivate'))).status).toBe(404);
 }
 expect((await DELETE(request('SVC_one?expected_revision=3','DELETE',{}, {Origin:'https://other.invalid'}),context('SVC_one'))).status).toBe(403);
 expect((await DELETE(request('SVC_one?expected_revision=3','DELETE',{}, {'X-Shida-Session':'stale'}),context('SVC_one'))).status).toBe(401);
 expect(fetcher).not.toHaveBeenCalled();
});
it('edits a Personal social link without accepting context selectors',async()=>{
 expect((await PATCH(request('SVC_one','PATCH',{expected_revision:3,field:'social_link',value:'https://example.com'}),context('SVC_one'))).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/service-profiles/SVC_one');
 expect((await PATCH(request('SVC_one?organization_ref=BUS_other','PATCH',{}),context('SVC_one'))).status).toBe(404);
});

it('allows only the bound Personal professional-profile update',async()=>{
 const body={expected_revision:3,name:'Cabinet Horizon',bio:'Advice',social_link:''};
 expect((await PATCH(request('SVC_one/professional-profile','PATCH',body),context('SVC_one/professional-profile'))).status).toBe(200);
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/dashboard/service-profiles/SVC_one/professional-profile');
 expect((await PATCH(request('SVC_one/professional-profile?organization_ref=BUS_other','PATCH',body),context('SVC_one/professional-profile'))).status).toBe(404);
 expect((await PATCH(request('SVC_one/professional-profile','PATCH',body,{'X-Shida-Session':'wrong'}),context('SVC_one/professional-profile'))).status).toBe(401);
 expect(fetcher).toHaveBeenCalledTimes(1);
});
