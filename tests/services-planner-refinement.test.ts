import {afterEach,it,expect,vi} from 'vitest';
import {GET} from '../app/api/shida/services/availability/route';
import {copyWorkingHours,validWorkingHours} from '../app/lib/services-hours-model';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('copies exact intervals and breaks only to explicitly selected days',()=>{
 const hours=[{day:'monday',start:'09:00',end:'12:00'},{day:'monday',start:'13:00',end:'17:00'},{day:'sunday',start:'10:00',end:'11:00'}];
 const copied=copyWorkingHours(hours,'monday',['tuesday','tuesday']);
 expect(copied.filter(row=>row.day==='tuesday')).toEqual(hours.slice(0,2).map(row=>({...row,day:'tuesday'})));expect(copied.filter(row=>row.day==='sunday')).toEqual(hours.slice(2));expect(hours).toHaveLength(3);
});
it('rejects invalid and overlapping intervals while preserving split days',()=>{
 expect(validWorkingHours([{day:'monday',start:'09:00',end:'12:00'},{day:'monday',start:'13:00',end:'17:00'}])).toBe(true);
 for(const rows of [[{day:'monday',start:'17:00',end:'09:00'}],[{day:'monday',start:'09:00',end:'13:00'},{day:'monday',start:'12:00',end:'17:00'}],[{day:'monday',start:'29:00',end:'30:00'}]])expect(validWorkingHours(rows)).toBe(false);
});
it('reads the exact public availability API without sessions, caching or booking links',async()=>{
 const fetcher=vi.fn().mockResolvedValue(Response.json({service_ref:'SVC_one',appointment_booking:true,availability_mode:'time_slots',timezone:'Africa/Kinshasa',requested_time_requires_provider_confirmation:true,from:'2026-12-01',to:'2026-12-01',slots:[{date:'2026-12-01',start_time:'09:00',end_time:'09:30',is_available:true,booking_url:null},{date:'2026-12-01',start_time:'10:00',end_time:'10:30',is_available:false,booking_url:null}],booking_url:null}));
 vi.stubGlobal('fetch',fetcher);vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');
 const response=await GET(new Request('https://nihiloba.com/api/shida/services/availability?service=SVC_one&date=2026-12-01'));expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toContain('no-store');const value=await response.json();expect(value.slots).toEqual([{date:'2026-12-01',start_time:'09:00',end_time:'09:30'}]);
 expect(String(fetcher.mock.calls[0][0])).toBe('https://backend.test/api/public/shida/services/SVC_one/availability?from=2026-12-01&to=2026-12-01');expect(fetcher.mock.calls[0][1].cache).toBe('no-store');expect(JSON.stringify(fetcher.mock.calls)).not.toContain('Cookie');
});
it('rejects malformed or cross-site preview requests and distinguishes API failure',async()=>{
 const fetcher=vi.fn().mockRejectedValue(Error('offline'));vi.stubGlobal('fetch',fetcher);
 const base='https://nihiloba.com/api/shida/services/availability?service=SVC_one&date=';
 for(const url of [base+'2026-02-30',base+'2026-12-01&date=2026-12-02',base+'2026-12-01&private=true'])expect((await GET(new Request(url))).status).toBe(400);
 expect((await GET(new Request(base+'2026-12-01',{headers:{'Sec-Fetch-Site':'cross-site'}}))).status).toBe(400);expect(fetcher).not.toHaveBeenCalled();expect((await GET(new Request(base+'2026-12-01'))).status).toBe(503);
});
