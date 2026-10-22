import {describe,it,expect} from 'vitest';
import {activityRows} from '../app/lib/personal-activity';
describe('Personal activity previews',()=>{
 for(const locale of ['en','fr','ln','sw'] as const)it(`keeps marketplace states and links in ${locale}`,()=>{
  const food=activityRows('food',{items:[{order_ref:'ROD_1',state:'ready',establishment_name:'Kitchen',submitted_at:'2026-10-22T10:00:00Z'}]},locale)[0];
  expect(food.attention).toBe(true);expect(food.href).toContain('/shida/restaurant-orders/ROD_1');
  const job=activityRows('jobs',{applications:[{reference:'APP_1',job_title:'Nurse',status:'received'}]},locale)[0];expect(job.attention).toBe(false);expect(job.status).not.toBe('received');
  expect(activityRows('services',{requests:[{posted_ref:'SPR_1',status:'OPEN',summary:{description:'Repair'}}]},locale)[0].attention).toBe(false);
 });
 it('bounds previews and rejects malformed sources instead of claiming empty',()=>{
  expect(activityRows('shops',{orders:Array.from({length:20},(_,i)=>({reference:`WZ_${i}`,store_name:'Shop',timeline:{current:'preparing'}}))},'en')).toHaveLength(5);
  expect(()=>activityRows('jobs',{},'en')).toThrow();expect(()=>activityRows('food',{items:[{}]},'en')).toThrow();
 });
});
