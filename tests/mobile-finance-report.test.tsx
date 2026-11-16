import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect} from 'vitest';
import {PeriodReport} from '../app/components/shida/wenze-period-report';
import {WenzeApiProvider} from '../app/lib/wenze-seller-api';
import {moneyText} from '../app/lib/wenze-money-copy';
import {WenzeReportFacts} from '../app/components/shida/wenze-report-facts';

// Server rendering verifies data presentation only, not mobile interactions.
const base='wenze/contexts/personal/stores/WNZ_synthetic';
function report(data:Record<string,unknown>){return renderToStaticMarkup(<WenzeApiProvider binding="synthetic" onUnauthorized={()=>{}}><PeriodReport base={base} data={data} range="period=last_30_days&timezone=Africa%2FKinshasa" locale="en" zone="Africa/Kinshasa"/></WenzeApiProvider>);}
describe('compact finance report data presentation',()=>{
 it('keeps currencies separate and qualifies operational results independently',()=>{
  const html=report({currency_summaries:[
   {currency:'CDF',combined_sales:{total_revenue:'15000',known_gross_profit:'7500'},recorded_operating_expenses:{total:'395000'},operational_result:'-387500',completeness:{profit_complete:true,operational_result_complete:false}},
   {currency:'USD',combined_sales:{total_revenue:'5.50',known_gross_profit:null},recorded_operating_expenses:{total:'0'},operational_result:null,completeness:{profit_complete:false,operational_result_complete:false}},
  ]});
  expect(html).toContain('15,000 CDF');expect(html).toContain('5.5 USD');expect(html).toContain('-387,500 CDF');expect(html).toContain('0 USD');
  expect(html).toContain('<strong>—</strong>');expect(html).not.toContain('15,005.5');
  expect(html.match(/class="wm-partial"/g)).toHaveLength(3);
 });
 it('uses the singular sold unit and preserves the revenue ranking',()=>{
  const html=report({currency_summaries:[{currency:'CDF'}],top_items:{top_by_revenue:[{currency:'CDF',items:[{label:'Synthetic product',revenue:'10000',channel_breakdown:{physical:{quantity:1},marketplace:{quantity:0}}}]}]}});
  expect(html).toContain('Synthetic product · 1 '+moneyText('en','unitSold'));expect(html).toContain('10,000 CDF');
 });
 it('labels expense facts in all four languages without exposing raw field names',()=>{
  for(const locale of ['fr','en','ln','sw'] as const){
   const html=renderToStaticMarkup(<WenzeReportFacts locale={locale} value={{total_expenses:'45',expense_count:1}}/>);
   expect(html).toContain(moneyText(locale,'total_expenses'));expect(html).toContain(moneyText(locale,'expense_count'));
   expect(html).not.toContain('total_expenses');expect(html).not.toContain('expense_count');
  }
 });
});
