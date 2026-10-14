import {describe,it,expect} from 'vitest';
import {apartmentVisitEvent,localDate,monthBounds,restaurantEvent,servicesEvent,shiftMonth} from '../app/lib/shida-calendar';

describe('shared calendar presentation',()=>{
  it('navigates month boundaries and preserves local days around DST',()=>{
    expect(monthBounds('2026-10')).toEqual({from:'2026-10-01',to:'2026-11-01'});
    expect(shiftMonth('2026-12',1)).toBe('2027-01');
    expect(localDate('2026-10-24T22:30:00Z','Europe/Stockholm')).toBe('2026-10-25');
    expect(localDate('2026-10-25T02:30:00Z','Europe/Stockholm')).toBe('2026-10-25');
    expect(localDate('2026-10-31T23:30:00Z','Europe/Stockholm')).toBe('2026-11-01');
  });
  it('marks seller decisions distinctly and keeps only opaque destinations',()=>{
    const row={reservation_ref:'RRS_opaque',starts_at:'2026-10-25T02:30:00Z',timezone_name:'Europe/Stockholm',party_size:3,state:'pending'};
    expect(restaurantEvent(row,'Awaiting seller response','Guests')).toMatchObject({marketplace:'restaurants',tone:'pending',destination:{kind:'detail',reference:'RRS_opaque'}});
    expect(restaurantEvent({...row,state:'accepted'},'Accepted','Guests').tone).toBe('confirmed');
    const projection={reference:'opaque',startsAt:'2026-10-25T02:30:00Z',timeZone:'Europe/Stockholm',title:'Visit',status:'Proposed',tone:'pending' as const};
    expect(servicesEvent(projection).marketplace).toBe('services');
    expect(apartmentVisitEvent(projection).marketplace).toBe('apartments');
  });
});
