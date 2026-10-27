import {expect,it} from 'vitest';
import {periodDates,shiftCalendarDate} from '../app/lib/restaurant-statistics';
it('shows inclusive calendar days without changing exclusive API boundaries',()=>{
 const dates=periodDates(1,'Africa/Kinshasa',new Date('2026-10-27T09:00:00Z'));
 expect(dates).toEqual({from:'2026-10-27',to:'2026-10-28'});
 expect(shiftCalendarDate(dates.to,-1)).toBe(dates.from);
 expect(shiftCalendarDate('2026-12-31',1)).toBe('2027-01-01');
 expect(shiftCalendarDate('2024-03-01',-1)).toBe('2024-02-29');
 expect(shiftCalendarDate('',1)).toBe('');
});
