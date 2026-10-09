import {dateText} from '../app/lib/restaurant-work';
import {describe,it,expect} from 'vitest';
import {periodDates} from '../app/lib/restaurant-statistics';
import {pricing} from '../app/lib/restaurant-seller';
import {validOrderBody} from '../app/lib/restaurant-orders-contract';
import {basicText} from '../app/lib/restaurant-basic-copy';
describe('Restaurant basic completion',()=>{
 it('uses numeric Lingala dates without accented French month names',()=>{expect(dateText('2026-02-10T12:00:00Z','ln','Africa/Kinshasa')).toMatch(/^10\/02\/2026/);});
 it('uses establishment calendar across UTC date and DST boundaries',()=>{
  expect(periodDates(7,'America/New_York',new Date('2026-03-09T02:00:00Z'))).toEqual({from:'2026-03-02',to:'2026-03-09'});
 });
 it('preserves explicit flexible and configured money policies',()=>{
  const fields={pricing_model:'AMOUNT_PRICED',currency:'CDF',minimum_amount:'500',amount_step:'100',amount_mode:'flexible',allowed_amounts:''};
  const p=pricing(fields);expect(p).toMatchObject({amount_mode:'flexible',minimum_amount:'500',amount_step:'100',allowed_amounts:[]});
  expect(validOrderBody('RST_EXAMPLE/menu-batches',{operation_key:'one',expected_updated_at:'revision',category_name:'Food',rows:[{key:'food',fields:{name:'Pondu',...p}}]})).toBe(true);
  expect(()=>pricing({...fields,minimum_amount:''})).toThrow();
  expect(pricing({...fields,amount_mode:'configured',allowed_amounts:'500;1000'})).toMatchObject({amount_mode:'configured',amount_step:null,allowed_amounts:['500','1000']});
 });
 it('covers new labels in all languages without French accents in Lingala',()=>{
  for(const locale of ['en','fr','ln','sw'])for(const key of ['today','week','month','average_completed_food_value','response_time','preparation_time','paymentNote','flexibleFrom']){const text=basicText(locale,key);expect(text).not.toBe('—');if(locale==='ln')expect(text).not.toMatch(/[àâäéèêëîïôöùûüç]/i);}
 });
});
