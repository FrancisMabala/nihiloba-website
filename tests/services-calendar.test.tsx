import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {GET} from '../app/api/shida/services/booking-link/route';
import {ServiceAvailabilityPanel} from '../app/components/shida/service-availability';
import type {ServiceAvailability} from '../app/types/shida-public';
const fetcher=vi.fn<typeof fetch>();
beforeEach(()=>{vi.stubEnv('SHIDA_API_BASE_URL','https://backend.test');vi.stubGlobal('fetch',fetcher);fetcher.mockReset();});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
const url='https://nihiloba.com/api/shida/services/booking-link?service=SVC_one&date=2026-12-12&start=09:00&end=09:30';
it('mints only an explicitly selected slot, forwarding no session or customer data',async()=>{
 fetcher.mockResolvedValue(Response.json({booking_url:'https://wa.me/243812345678?text=START%20opaque',private_phone:'secret'}));
 const result=await GET(new Request(url));expect(result.status).toBe(200);
 const body=await result.json();expect(Object.keys(body)).toEqual(['booking_url']);expect(result.headers.get('Cache-Control')).toContain('no-store');
 const [target,options]=fetcher.mock.calls[0];expect(String(target)).toContain('/SVC_one/booking-link?');expect(options?.cache).toBe('no-store');expect(JSON.stringify(options)).not.toContain('Cookie');
});
it('rejects malformed, duplicate and cross-site slot selection before reaching backend',async()=>{
 for(const request of [new Request(url+'&date=2026-12-13'),new Request(url+'&organization_ref=BUS_other'),new Request(url.replace('09:00','29:00')),new Request(url,{headers:{'Sec-Fetch-Site':'cross-site'}})])expect((await GET(request)).status).toBe(400);
 expect(fetcher).not.toHaveBeenCalled();
});
it('does not expose stale slots or unsafe action URLs',async()=>{
 for(const reply of [Response.json({}, {status:409}),Response.json({booking_url:'javascript:alert(1)'})]){
  fetcher.mockResolvedValueOnce(reply);expect((await GET(new Request(url))).status).toBe(409);
 }
});
it.each(['en','fr'] as const)('renders explicit appointment calendar and truthful instant policy in %s',locale=>{
 const availability:ServiceAvailability={service_ref:'SVC_one',appointment_booking:true,timezone:'Africa/Kinshasa',availability_mode:'time_slots',from:'2026-12-12',to:'2026-12-12',requested_time_requires_provider_confirmation:false,slots:[{date:'2026-12-12',start_time:'09:00',end_time:'09:30',is_available:true,booking_url:null}],booking_url:null};
 const html=renderToStaticMarkup(<ServiceAvailabilityPanel locale={locale} availability={availability} bookingUrl={null} path="/shida/services/SVC_one"/>);
 expect(html).toContain('service-date-grid');expect(html).toContain('Kinshasa');expect(html).toContain('WhatsApp');expect(html).not.toContain('href="https://wa.me');
});
