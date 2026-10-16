import type {WenzeLocale} from '@/app/lib/wenze-copy';
import {sellerText} from '@/app/lib/wenze-seller-copy';
const fields=new Set(['operational_result','recorded_operating_expenses','label','target_label','catalog_label','currency','quantity','unit','on_hand','reserved','available','low_stock_threshold','is_low_stock','total_revenue','revenue','unit_sale_price','unit_cost','unit_cost_snapshot','cost_basis','gross_profit','known_gross_profit','known_cost_basis','sales_missing_cost','lines_missing_cost','quantity_sold','sales_count','sale_facts_count','expense_count','total_expenses','category','valuation','valued_targets','missing_cost','unknown_stock','total_targets','complete','profit_complete','current','previous','change','percentage_change','revenue_cost_coverage_percent','current_sales_missing_cost','previous_sales_missing_cost','current_revenue_cost_coverage_percent','previous_revenue_cost_coverage_percent','status','occurred_at','amount','occurred_on','note']);
const groups=new Set(['currency_summaries','totals','items','sales','lines','categories','top_by_quantity','top_by_revenue','top_by_known_gross_profit','revenue','known_gross_profit','recorded_operating_expenses','operational_result','quantity_sold','completeness','variants']);
export function WenzeReportFacts({value,locale}:{value:unknown;locale:WenzeLocale}){
 const t=(key:string)=>sellerText(locale,key);
 if(Array.isArray(value))return <div className="wz-grid">{value.map((row,i)=><WenzeReportFacts key={i} value={row} locale={locale}/>)}</div>;
 if(!value||typeof value!=='object')return null;
 const entries=Object.entries(value),metrics=entries.filter(([key,v])=>fields.has(key)&&(v===null||typeof v!=='object'));
 return <div className="wz-report-facts">{metrics.length>0&&<dl>{metrics.map(([key,v])=><div key={key}><dt>{t(key)}</dt><dd>{v===null?'—':typeof v==='boolean'?t(v?'yes':'no'):String(v)}</dd></div>)}</dl>}{entries.filter(([key,v])=>groups.has(key)&&v!==null&&typeof v==='object').map(([key,v])=><section key={key}><h4>{t(key)}</h4><WenzeReportFacts value={v} locale={locale}/></section>)}</div>;
}
