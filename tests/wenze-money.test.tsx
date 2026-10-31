import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {WenzeMoneyDashboard,moneyValue} from '../app/components/shida/wenze-money-dashboard';
import {moneyText} from '../app/lib/wenze-money-copy';
describe('honest financial presentation',()=>{
 it('does not turn unknown values into zero',()=>{
  for(const value of [null,undefined,'',NaN,Infinity])expect(moneyValue(value,'en')).toBe('—');
  expect(moneyValue(0,'en')).toBe('0');expect(moneyValue(-125,'en')).toBe('-125');
 });
 it('qualifies operational results independently of gross-margin completeness',()=>{
  const html=renderToStaticMarkup(<WenzeMoneyDashboard locale="en" storeRef="TEST" busy={false} error={false} data={{currency_summaries:[{currency:'CDF',combined_sales:{total_revenue:'30000',known_gross_profit:'10000'},recorded_operating_expenses:{total:'12000'},operational_result:'-2000',completeness:{profit_complete:true,operational_result_complete:false}}]}}/>);
  expect(html).toContain('Partial calculation');expect(html).toContain('-2,000');expect(html).toContain('Known margin before expenses');
 });
 it('does not present errors or loading as an empty financial period',()=>{
  for(const state of [{busy:true,error:false},{busy:false,error:true}])expect(renderToStaticMarkup(<WenzeMoneyDashboard locale="en" storeRef="TEST" data={{}} {...state}/>)).not.toContain('No transactions in this period');
 });
 it('has translated financial qualifications in all supported languages',()=>{
  for(const locale of ['en','fr','ln','sw'] as const)for(const key of ['partial','warning','scope','coverage','overview','recordedOnly'])expect(moneyText(locale,key)).not.toBe('—');
 });
});
