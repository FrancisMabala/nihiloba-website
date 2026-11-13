import {Fragment,useEffect,useState} from 'react';
import {sellerText} from '../../lib/wenze-seller-copy';
import type {WenzeLocale} from '../../lib/wenze-copy';
import {moneyValue} from './wenze-money-dashboard';
import {useWenzeApi} from '../../lib/wenze-seller-api';
import './wenze-period-tables.css';

type Row=Record<string,unknown>;
type Display={locale:WenzeLocale;zone:string};
function instant(value:unknown){
  if(typeof value!=='string'||!value)return null;
  // The report API stores UTC. Older records can omit the ISO offset.
  const date=new Date(/^\d{4}-\d\d-\d\dT[\d:.]+$/.test(value)?value+'Z':value);
  return Number.isNaN(date.getTime())?null:date;
}
function stamp(value:unknown,{locale,zone}:Display,generation=false){
  const date=instant(value);
  if(date&&generation&&locale==='fr'){
    return date.toLocaleDateString('fr',{timeZone:zone,dateStyle:'medium'})+' à '+date.toLocaleTimeString('fr',{timeZone:zone,timeStyle:'short'});
  }
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
const pageSize=10;
type SalesPage={sales:Row[];total:number;recorded:number;cancelled:number;next_cursor:string|null};
export function PagedShopSales({base,range,locale,zone}:{base:string;range:string}&Display){
  const {request}=useWenzeApi();
  const [cursors,setCursors]=useState(['']);
  const [page,setPage]=useState<SalesPage|null>(null);
  const [failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
  const cursor=cursors[cursors.length-1],start=(cursors.length-1)*pageSize+1;
  const t=(key:string)=>sellerText(locale,key);
  useEffect(()=>{
    let current=true;
    const params=new URLSearchParams(range);
    params.set('limit',String(pageSize));
    if(cursor)params.set('cursor',cursor);
    request(base+'/reports/physical-sales?'+params).then(response=>{
      const result=response as SalesPage;
      if(!Array.isArray(result.sales))throw new Error('Invalid sales page');
      if(current)setPage(result);
    }).catch(()=>{if(current)setFailed(true);});
    return ()=>{current=false;};
  },[base,range,request,cursor,retry]);
  function move(next:string[]){
    setPage(null);
    setFailed(false);
    setCursors(next);
  }
  if(failed)return <p role="alert">{t('unavailable')} <button onClick={()=>{setFailed(false);setRetry(n=>n+1);}}>{t('retry')}</button></p>;
  if(!page)return <p role="status">{t('loading')}</p>;
  // Older API revisions can return only the rows and next cursor.
  const count=(status:string,num:number|undefined,key:string)=>{
    const n=num??page.sales.filter(s=>s.status===status).length;
    return n+' '+t(key+(n===1?'One':'Many'));
  };
  return <><p>{count('active',page.recorded,'saleRecorded')} · {count('reversed',page.cancelled,'saleCancelled')}</p>
    <ShopSalesTable key={cursor} sales={page.sales} locale={locale} zone={zone}/>
    {(page.total>pageSize||cursor||page.next_cursor)?<nav className="wr-pages" aria-label={t('physical_sales')}>
      <span aria-live="polite">{t('salePageRange').replace('{start}',String(start)).replace('{end}',String(start+page.sales.length-1)).replace('{total}',String(page.total??'…'))}</span>
      <button disabled={cursors.length===1} onClick={()=>move(cursors.slice(0,-1))}>{t('previous')}</button>
      <button disabled={!page.next_cursor} onClick={()=>{if(page.next_cursor)move([...cursors,page.next_cursor]);}}>{t('next')}</button>
    </nav>:null}</>;
}
function ShopSalesTable({sales,locale,zone}:{sales:Row[]}&Display){
  const [expanded,setExpanded]=useState<string[]>([]);
  const t=(k:string)=>sellerText(locale,k);
  return <table className="wr-table wr-sales"><thead><tr><td aria-hidden="true"/>{['saleDateTime','saleProduct','saleQuantity','saleAmount','saleStatus'].map(k=><th scope="col" key={k}>{t(k)}</th>)}</tr></thead>
    <tbody>{sales.map(s=>{
      const ref=String(s.sale_ref),open=expanded.includes(ref),label=String(s.target_label??'—');
      const split=s.target_type==='variant'?label.lastIndexOf(' - '):-1;
      const product=split<0?label:label.slice(0,split),variant=split<0?'':label.slice(split+3);
      const money=(v:unknown)=>v==null?'—':moneyValue(v,locale)+' '+s.currency;
      const qty=Number(s.quantity),unit=s.unit==='piece'?t(qty===1?'salePiece':'salePieces'):String(s.unit??'');
      return <Fragment key={ref}><tr>
        <td className="wr-toggle"><button type="button" aria-label={label} aria-expanded={open} aria-controls={open?'wr-'+ref:undefined} onClick={()=>setExpanded(old=>old.includes(ref)?old.filter(id=>id!==ref):[...old,ref])}><span aria-hidden="true">{open?'▾':'▸'}</span></button></td>
        <td className="wr-date"><time dateTime={String(s.occurred_at)}>{stamp(s.occurred_at,{locale,zone})}</time></td>
        <td className="wr-product">{product}{variant&&<small>{variant}</small>}</td>
        <td className="wr-qty" data-label={t('saleQuantity')}>{moneyValue(qty,locale)}</td><td className="wr-amount">{money(s.revenue)}</td>
        <td className="wr-status"><span className="wr-badge" data-cancelled={s.status==='reversed'}>{t(s.status==='active'?'saleRecorded':s.status==='reversed'?'saleCancelled':String(s.status))}</span></td></tr>
        {open&&<tr id={'wr-'+ref} className="wr-detail"><td colSpan={6}><dl>
          <div><dt>{t('unit_sale_price')}</dt><dd>{money(s.unit_sale_price)}</dd></div>
          <div><dt>{t('cost_basis')}</dt><dd>{s.cost_basis==null?t('saleMissing'):money(s.cost_basis)}</dd></div>
          <div><dt>{t('saleMargin')}</dt><dd>{money(s.gross_profit)}</dd></div>
        </dl><details className="wr-extra"><summary>{t('saleDetails')}</summary><dl>
          <div><dt>{t('saleRef')}</dt><dd>{ref}</dd></div>
          <div><dt>{t('occurred_at')}</dt><dd>{stamp(s.occurred_at,{locale,zone})}</dd></div>
          <div><dt>{t('saleTotal')}</dt><dd>{qty} {unit} × {money(s.unit_sale_price)} · {money(s.revenue)}</dd></div>
          <div><dt>{t('unit_cost_snapshot')}</dt><dd>{s.unit_cost_snapshot==null?t('saleMissing'):money(s.unit_cost_snapshot)}</dd></div>
          {s.reversed_at!=null&&<div><dt>{t('saleReversedAt')}</dt><dd>{stamp(s.reversed_at,{locale,zone})}</dd></div>}
          {([['reversal_ref','saleReversalRef'],['reversal_reason','saleReversalReason'],['replacement_sale_ref','saleReplacement']] as const).map(([field,key])=>s[field]!=null&&<div key={field}><dt>{t(key)}</dt><dd>{field==='reversal_reason'?t(String(s[field])):String(s[field])}</dd></div>)}
        </dl></details></td></tr>}</Fragment>;
    })}</tbody></table>;
}

export function ReportHistoryTable({history,locale,zone,busy,download}:{history:Row[];busy:boolean;download:(ref:string)=>void}&Display){
  const t=(key:string)=>sellerText(locale,key);
  return <section className="wr-list"><header><h3>{t('reportArchive')}</h3></header><table className="wr-table wr-history"><thead><tr>
    <th>{t('reportCoverage')}</th><th>{t('reportGenerated')}</th><th>{t('saleStatus')}</th><th>{t('reportDownload')}</th></tr></thead>
    <tbody>{history.map(h=>{
      const reportZone=typeof h.timezone==='string'&&['UTC','Africa/Kinshasa','Africa/Lubumbashi'].includes(h.timezone)?h.timezone:zone;
      const covered=period(h,{locale,zone:reportZone}),files=(Array.isArray(h.artifacts)?h.artifacts:[]) as Row[];
      return <tr key={String(h.run_ref)} id={String(h.run_ref)}><td>{covered.detail?<details><summary>{covered.label}</summary><small>{covered.detail} · {reportZone}</small></details>:covered.label}</td>
        <td data-label={t('reportGenerated')}>{stamp(h.generated_at,{locale,zone:reportZone},true)}</td>
        <td><span className="wr-badge">{t(h.status==='generated'?'reportReady':String(h.status))}</span></td>
        <td className="wr-download">{files.map(f=><button key={String(f.artifact_ref)} disabled={f.status!=='active'||busy} onClick={()=>download(String(f.artifact_ref))}>{f.format==='xlsx'?'Excel':String(f.format).toUpperCase()}</button>)}</td></tr>;
    })}</tbody></table></section>;
}
