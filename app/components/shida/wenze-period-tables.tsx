import {Fragment,useState} from 'react';
import {sellerText} from '../../lib/wenze-seller-copy';
import type {WenzeLocale} from '../../lib/wenze-copy';
import {moneyValue} from './wenze-money-dashboard';
import './wenze-period-tables.css';

type Row=Record<string,unknown>;
type Display={locale:WenzeLocale;zone:string};
function instant(value:unknown){
  if(typeof value!=='string'||!value)return null;
  // The report API stores UTC. Older records can omit the ISO offset.
  const date=new Date(/^\d{4}-\d\d-\d\dT[\d:.]+$/.test(value)?value+'Z':value);
  return Number.isNaN(date.getTime())?null:date;
}
function stamp(value:unknown,{locale,zone}:Display){
  const date=instant(value);
  return date?new Intl.DateTimeFormat(locale,{timeZone:zone,dateStyle:'medium',timeStyle:'short'}).format(date):'—';
}
function period(row:Row,{locale,zone}:Display){
  const from=instant(row.period_start),end=instant(row.period_end);
  if(!from||!end||end<=from)return {label:'—',detail:''};
  const last=new Date(end.getTime()-1);
  const day=new Intl.DateTimeFormat(locale,{timeZone:zone,day:'numeric',month:'short',year:'numeric'});
  const clock=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const midnight=(d:Date)=>clock.format(d)==='00:00:00'&&d.getUTCMilliseconds()===0;
  return {label:day.formatRange(from,last),detail:midnight(from)&&midnight(end)?'':stamp(row.period_start,{locale,zone})+' – '+stamp(last.toISOString(),{locale,zone})};
}
export function ShopSalesTable({sales,locale,zone}:{sales:Row[]}&Display){
  const [expanded,setExpanded]=useState<string[]>([]);
  const t=(k:string)=>sellerText(locale,k);
  const count=(status:string,key:string)=>{const n=sales.filter(s=>s.status===status).length;return n+' '+t(key+(n===1?'One':'Many'));};
  return <><p>{count('active','saleRecorded')} · {count('reversed','saleCancelled')}</p>
    <table className="wr-table wr-sales"><thead><tr>{['saleDateTime','saleProduct','saleQuantity','saleAmount','saleStatus'].map(k=><th scope="col" key={k}>{t(k)}</th>)}</tr></thead>
    <tbody>{sales.map(s=>{
      const ref=String(s.sale_ref),open=expanded.includes(ref),label=String(s.target_label??'—');
      const split=s.target_type==='variant'?label.lastIndexOf(' - '):-1;
      const product=split<0?label:label.slice(0,split),variant=split<0?'':label.slice(split+3);
      const money=(v:unknown)=>v==null?'—':moneyValue(v,locale)+' '+s.currency;
      const qty=Number(s.quantity),unit=s.unit==='piece'?t(qty===1?'salePiece':'salePieces'):String(s.unit??'');
      return <Fragment key={ref}><tr>
        <td className="wr-date"><time>{stamp(s.occurred_at,{locale,zone})}</time></td>
        <td className="wr-product"><button type="button" aria-expanded={open} onClick={()=>setExpanded(old=>open?old.filter(id=>id!==ref):[...old,ref])}><span aria-hidden="true">{open?'▾':'▸'}</span><span>{product}{variant&&<small>{variant}</small>}</span></button></td>
        <td className="wr-qty" data-label={t('saleQuantity')}>{moneyValue(qty,locale)}</td><td className="wr-amount">{money(s.revenue)}</td>
        <td className="wr-status"><span className="wr-badge" data-cancelled={s.status==='reversed'}>{t(s.status==='active'?'saleRecorded':s.status==='reversed'?'saleCancelled':String(s.status))}</span></td></tr>
        {open&&<tr className="wr-detail"><td colSpan={5}><dl>
          <div><dt>{t('unit_sale_price')}</dt><dd>{qty} {unit} × {money(s.unit_sale_price)}</dd></div>
          <div><dt>{t('saleTotal')}</dt><dd>{money(s.revenue)}</dd></div>
          <div><dt>{t('unit_cost_snapshot')}</dt><dd>{s.unit_cost_snapshot==null?t('saleMissing'):money(s.unit_cost_snapshot)}</dd></div>
          <div><dt>{t('cost_basis')}</dt><dd>{s.cost_basis==null?t('saleMissing'):money(s.cost_basis)}</dd></div>
          <div><dt>{t('saleMargin')}</dt><dd>{money(s.gross_profit)}</dd></div>
        </dl></td></tr>}</Fragment>;
    })}</tbody></table></>;
}
const types:Record<string,string>={manual:'reportManual',scheduled_daily:'reportDaily',scheduled_weekly:'reportWeekly',scheduled_monthly:'reportMonthly'};
export function ReportHistoryTable({history,locale,zone,busy,download}:{history:Row[];busy:boolean;download:(ref:string)=>void}&Display){
  const t=(key:string)=>sellerText(locale,key),mixed=new Set(history.map(h=>h.run_type)).size>1;
  return <section><header><h3>{t('reportArchive')}</h3></header><table className="wr-table wr-history"><thead><tr>
    <th>{t('reportCoverage')}</th>{mixed&&<th>{t('reportType')}</th>}<th>{t('reportGenerated')}</th><th>{t('saleStatus')}</th><th>{t('reportDownload')}</th></tr></thead>
    <tbody>{history.map(h=>{
      const covered=period(h,{locale,zone}),files=(Array.isArray(h.artifacts)?h.artifacts:[]) as Row[];
      return <tr key={String(h.run_ref)} id={String(h.run_ref)}><td>{covered.detail?<details><summary>{covered.label}</summary><small>{covered.detail} · {zone}</small></details>:covered.label}</td>
        {mixed&&<td>{t(types[String(h.run_type)]??String(h.run_type))}</td>}
        <td data-label={t('reportGenerated')}>{stamp(h.generated_at,{locale,zone})}</td>
        <td><span className="wr-badge">{t(h.status==='generated'?'reportReady':String(h.status))}</span></td>
        <td className="wr-download">{files.map(f=><button key={String(f.artifact_ref)} disabled={f.status!=='active'||busy} onClick={()=>download(String(f.artifact_ref))}>{f.format==='xlsx'?'Excel':String(f.format).toUpperCase()}</button>)}</td></tr>;
    })}</tbody></table></section>;
}
