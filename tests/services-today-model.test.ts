import {describe,it,expect} from 'vitest';
import {appointmentsForDay,activeWork,previewCount,uniqueTasks} from '../app/lib/services-today-model';
describe('Services Today truthful projections',()=>{
 it('uses Kinshasa midnight and excludes completed and pending appointments',()=>{
  const item={reference:'RSV_one',title:'Service',status:'confirmed',startsAt:'2026-10-30T23:30:00Z'};
  expect(appointmentsForDay([item,item,{...item,reference:'RSV_old',startsAt:'2026-10-30T22:30:00Z'},{...item,reference:'RSV_done',status:'completed'},{...item,reference:'RSV_pending',status:'pending'}],'2026-10-31').map(row=>row.reference)).toEqual(['RSV_one']);
 });
 it('counts existing active reservation states once, never submitted proposals or completed work',()=>{
  const row={reservation_ref:'RSV_one',status:'accepted'};
  expect(activeWork([row,row,{reservation_ref:'RSV_two',status:'in_progress'},{reservation_ref:'RSV_three',status:'confirmed'},{reservation_ref:'RSV_four',status:'completed'},{status:'SUBMITTED'}])).toHaveLength(3);
 });
 it('preserves bounded queue meaning',()=>{expect(previewCount(5,true)).toBe('5+');expect(previewCount(0,false)).toBe('0');expect(uniqueTasks([{request_ref:'SWR_one'},{request_ref:'SWR_one'}])).toHaveLength(1);});
});
