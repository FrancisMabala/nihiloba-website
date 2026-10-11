import {describe,expect,it} from 'vitest';
import {dailyRoutes,isDailyPath,validDailyBody,validDailyQuery} from '../app/lib/restaurant-daily-contract';
import {dailyText} from '../app/lib/restaurant-daily-copy';

const root='RST_exact/service/';
const allowed=(path:string,method:string)=>dailyRoutes.some(([pattern,methods])=>pattern.test(path)&&methods.includes(method));
const base={operation_key:'original-key',expected_revision:0,kind:'expense',amount:'4.00',currency:'CDF',method_ref:'RPM_cash',category:'Supplies'};
describe('exact owner daily contract',()=>{
 it('limits journal and closing to exact owner Service routes',()=>{
  expect(allowed(root+'financial/entries','POST')).toBe(true);
  expect(allowed(root+'daily/days/2026-10-09/close','POST')).toBe(true);
  expect(allowed(root+'daily/days/2026-10-09/adjustments','GET')).toBe(true);
  expect(allowed('RST_exact/stations/service/financial/entries','POST')).toBe(false);
  expect(allowed(root+'daily/days/2026-10-09/close','GET')).toBe(false);
  expect(isDailyPath(root+'financial/recover')).toBe(true);
 });
 it('keeps corrections separate from attested recovery',()=>{
  expect(validDailyBody(root+'financial/entries',base)).toBe(true);
  expect(validDailyBody(root+'financial/entries',{...base,kind:'replacement',target_ref:'RFE_old',reason:'wrong amount'})).toBe(true);
  expect(validDailyBody(root+'financial/recover',{...base,kind:'recovery',target_ref:'RFE_old',reason:'cash returned'})).toBe(false);
  expect(validDailyBody(root+'financial/recover',{...base,kind:'recovery',target_ref:'RFE_old',reason:'cash returned',actually_recovered:true,category:undefined})).toBe(false);
  expect(validDailyBody(root+'financial/recover',{kind:'recovery',operation_key:'same-key',expected_revision:1,amount:'2',currency:'CDF',method_ref:'RPM_cash',target_ref:'RFE_old',reason:'cash returned',actually_recovered:true})).toBe(true);
 });
 it('accepts explicit zero cash, but no missing or negative cash',()=>{
  const path=root+'daily/days/2026-10-09/opening/CDF';
  expect(validDailyBody(path,{operation_key:'k',expected_revision:0,amount:'0',attested:true})).toBe(true);
  expect(validDailyBody(path,{operation_key:'k',expected_revision:0,amount:'',attested:true})).toBe(false);
  expect(validDailyBody(path,{operation_key:'k',expected_revision:0,amount:'-1',attested:true})).toBe(false);
 });
 it('validates bounded private queries and four translations',()=>{
  expect(validDailyQuery(root+'financial/entries','GET',new URLSearchParams('after_revision=0&limit=100'))).toBe(true);
  expect(validDailyQuery(root+'financial/entries','GET',new URLSearchParams('limit=101'))).toBe(false);
  expect(validDailyQuery(root+'daily/days/2026-10-09/adjustments','GET',new URLSearchParams('after=100&limit=50'))).toBe(true);
  for(const locale of ['fr','en','ln','sw'] as const)expect(dailyText(locale,'dayNotEnded').length).toBeGreaterThan(15);
 });
});
