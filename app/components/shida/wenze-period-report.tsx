"use client";
import {useEffect,useRef,useState,type ReactNode} from 'react';
import './wenze-finance-mobile.css';
import {useWenzeApi} from '../../lib/wenze-seller-api';
import type {WenzeLocale} from '../../lib/wenze-copy';
import {sellerText} from '../../lib/wenze-seller-copy';
import {moneyText} from '../../lib/wenze-money-copy';
import {moneyValue,ComparisonChart} from './wenze-money-dashboard';
import {WenzeReportFacts} from './wenze-report-facts';

import {PagedShopSales,ReportHistoryTable} from './wenze-period-tables';

function ReportSection({title,children,initial=false}:{title:string;children:ReactNode;initial?:boolean}){
 const [open,setOpen]=useState(initial);
 useEffect(()=>{const media=matchMedia('(min-width:761px)'),update=()=>setOpen(media.matches||initial);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[initial]);
 return <details className="finance-report-section" open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary>{title}</summary><div>{children}</div></details>;
}
type Row=Record<string,unknown>;
const obj=(v:unknown)=>(v??{}) as Row;
const list=(v:unknown):Row[]=>Array.isArray(v)?v:[];
export function PeriodReport({base,data,range,locale,zone}:{base:string;data:Row;range:string;locale:WenzeLocale;zone:string}){
 const {request,download}=useWenzeApi();
 const t=(k:string)=>sellerText(locale,k),m=(k:string)=>moneyText(locale,k);
 const word=(fr:string,key:string)=>locale==='fr'?fr:t(key);
 const [historyResult,setHistoryResult]=useState<{base:string;revision:number;rows:Row[];failed:boolean}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false),[revision,refresh]=useState(0);
 const currentHistory=historyResult?.base===base&&historyResult.revision===revision?historyResult:null;
 const history=currentHistory?.rows??null,historyError=currentHistory?.failed===true;
 const lock=useRef(false),command=useRef(new Map<string,string>());
 useEffect(()=>{let current=true;
  async function pages(path:string,key:string){const records:Row[]=[];let cursor='';const seen=new Set<string>();
   do{if(seen.has(cursor))throw Error();seen.add(cursor);const page=obj(await request(base+'/'+path+(path.includes('?')?'&':'?')+'limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):'')));records.push(...list(page[key]));cursor=String(page.next_cursor??'');}while(cursor&&current);return records;}
  pages('reports/history','reports').then(rows=>{if(current){setHistoryResult({base,revision,rows,failed:false});setError(false);}}).catch(()=>{if(current){setError(true);setHistoryResult({base,revision,rows:[],failed:true});}});
  return()=>{current=false;};
 },[request,base,revision]);
 async function action(work:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setError(false);try{await work();}catch{setError(true);}finally{lock.current=false;setBusy(false);}}
 async function generate(format:string){const params=new URLSearchParams(range),key=base+range+format;
  if(!command.current.has(key))command.current.set(key,crypto.randomUUID());
  const run=obj(await request(base+'/reports/advanced',{method:'POST',headers:{'Idempotency-Key':command.current.get(key)!},body:JSON.stringify({...Object.fromEntries(params),language:locale,formats:[format]})}));
  const file=list(run.artifacts).find(a=>a.format===format);if(!file)throw Error();
  await download(base+'/reports/artifacts/'+file.artifact_ref);command.current.delete(key);refresh(v=>v+1);
 }
 const span=obj(data.period),currencies=list(data.currency_summaries),money=(v:unknown,code:unknown)=>v==null?'—':moneyValue(v,locale)+' '+code;
 const date=(v:unknown)=>v?new Date(String(v).slice(0,10)+'T12:00Z').toLocaleDateString(locale,{timeZone:'UTC',dateStyle:'medium'}):'—';
 return <div className="wm-period">{error&&<p role="alert">{t('unavailable')} <button onClick={()=>refresh(v=>v+1)}>{t('retry')}</button></p>}
 <section><header><h2>{word('Rapport de la période','reports')}</h2><span>{date(span.date_from)} – {date(span.date_to)}</span><details className="finance-export"><summary>{m('exportReport')}</summary><div className="wz-actions">{['pdf','xlsx'].map(f=><button disabled={busy} key={f} onClick={()=>void action(()=>generate(f))}>{f==='pdf'?word('Télécharger le PDF','pdf'):word('Classeur Excel','xlsx')}</button>)}</div></details></header>
 {currencies.map(c=>{const s=obj(c.combined_sales),code=c.currency,partial=obj(c.completeness).profit_complete!==true;return <div key={String(code)}><div className="wm-kpis">{[[m('sales'),s.total_revenue],[m('expenses'),obj(c.recorded_operating_expenses).total],[word('Marge connue avant dépenses','gross_profit'),s.known_gross_profit],[word('Résultat opérationnel','operational_result'),c.operational_result]].map(([label,n],i)=><article key={i} data-negative={n!=null&&Number(n)<0}><span>{String(label)}</span><strong>{money(n,code)}</strong>{((partial&&i===2)||(i===3&&obj(c.completeness).operational_result_complete!==true))&&<small className="wm-partial">{m('partial')}</small>}</article>)}</div>
 {partial&&<div className="wm-warning">{locale==='fr'?`Coût d’achat connu pour ${money(s.revenue_with_known_cost,code)} sur ${money(s.total_revenue,code)} de ventes (${moneyValue(obj(c.completeness).revenue_cost_coverage_percent,locale)} %).`:m('warning')} <a href={'?store='+encodeURIComponent(String(data.store_ref??base.split('/').pop()))+'&view=costs'}>{m('viewCosts')}</a></div>}</div>;})}</section>
 {currencies.map(c=>{const code=String(c.currency);const items=list(list(obj(data.top_items).top_by_revenue).find(g=>g.currency===code)?.items);
 return <div className="wm-report-pair" key={code}><ReportSection initial title={word('Ventes par canal','sales')}>{[[word('En boutique','physical'),obj(c.physical_sales).total_revenue],[word('Sur Wenze','marketplace'),obj(c.marketplace_sales).total_revenue],[t('total'),obj(c.combined_sales).total_revenue]].map(([k,v])=><p key={String(k)}>{String(k)} <b>{money(v,code)}</b></p>)}</ReportSection><ReportSection title={m('top')}>{!items.length&&<p>{t('empty')}</p>}{items.map((it,i)=><p key={i}>{String(it.label)} · {Object.values(obj(it.channel_breakdown)).reduce<number>((sum,ch)=>sum+Number(obj(ch).quantity??0),0)} {m(Object.values(obj(it.channel_breakdown)).reduce<number>((sum,ch)=>sum+Number(obj(ch).quantity??0),0)===1?'unitSold':'units')} <b>{money(it.revenue,code)}</b></p>)}</ReportSection></div>})}
 <ReportSection title={word('Ventes en boutique','physical_sales')}><header><button onClick={()=>void action(()=>download(base+'/reports/physical-sales.csv?'+range+'&language='+locale))}>{t('saleExport')}</button></header>
 <PagedShopSales key={base+'?'+range} base={base} range={range} locale={locale} zone={zone}/></ReportSection>
 <ReportSection title={t('reportArchive')}>{historyError?<p>{t('unavailable')}</p>:history===null?<p role="status">{t('loading')}</p>:<ReportHistoryTable history={history} locale={locale} zone={zone} busy={busy} download={ref=>void action(()=>download(base+'/reports/artifacts/'+encodeURIComponent(ref)))}/>}</ReportSection>
 <ReportSection title={word('Stock actuel','inventory')}>{data.generated_at?date(data.generated_at):null}<WenzeReportFacts value={data.current_inventory} locale={locale} timeZone={zone}/><WenzeReportFacts value={data.low_stock} locale={locale} timeZone={zone}/></ReportSection>
 <details><summary>{m('moreReports')}</summary>{list(obj(data.comparison).currency_summaries).map(c=><ComparisonChart key={String(c.currency)} data={c} currency={String(c.currency)} locale={locale}/>)}{currencies.map(c=><WenzeReportFacts key={String(c.currency)} value={obj(c.recorded_operating_expenses).top_categories} locale={locale} timeZone={zone}/>)}<a href={'?store='+base.split('/').pop()+'&view=expenses&'+range}>{m('expenses')}</a></details>
</div>;
}
