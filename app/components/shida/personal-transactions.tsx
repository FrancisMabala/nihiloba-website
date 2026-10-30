'use client';
import Image from 'next/image';
import {useEffect,useState} from 'react';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {transactionText} from '../../lib/transactions-copy';
import {isOverview,transactionDetail,transactionAmount,transactionLink,transactionStatus,type Transaction,type TransactionCategory,type TransactionOverview} from '../../lib/personal-transactions';
import './transactions-design.css';
const icons:Record<Transaction['kind'],SpaceIconName>={wenze:'shop',negotiated:'shop',food:'restaurant',food_receipt:'receipts',reservation:'restaurant',application:'management',posted:'requests',service:'requests',booking:'tool',bill:'receipts',hotel:'home',transport:'orders',housing:'home',visit:'home'};
export function PersonalTransactions({binding,locale}:{binding:string;locale:MarketplaceLocale}){
 const t=(key:Parameters<typeof transactionText>[1])=>transactionText(locale,key),prefix=locale==='en'?'':`/${locale}`;
 const [category,setCategory]=useState<TransactionCategory>('all'),[sort,setSort]=useState('recent'),[page,setPage]=useState(1),[attempt,setAttempt]=useState(0);
 const [result,setResult]=useState<{key:string;data:TransactionOverview}|null>(null),[failure,setFailure]=useState('');
 const key=`${binding}:${locale}:${category}:${sort}:${page}:${attempt}`,data=result?.key===key?result.data:null,failed=failure===key;
 useEffect(()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);let active=true;
  fetch(`/api/shida/personal/transactions/?category=${category}&sort=${sort}&page=${page}&page_size=10&language=${locale}`,{headers:{'X-Shida-Session':binding},credentials:'same-origin',cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();const value:unknown=await response.json();if(!isOverview(value))throw Error();if(active)setResult({key,data:value});}).catch(()=>{if(active)setFailure(key);}).finally(()=>clearTimeout(timer));
  return()=>{active=false;clearTimeout(timer);controller.abort();};
 },[binding,locale,category,sort,page,attempt,key]);
 const recentItems=data?.items.filter(row=>category!=='all'||row.category!=='documents')??[];
 const documents=data?[...data.items.filter(row=>row.category==='documents'),...data.documents]:[];
 function filter(value:TransactionCategory){setCategory(value);setPage(1);}
 function row(item:Transaction){
  const action=item.category==='documents'?'openDocument':item.category==='orders'?'viewOrder':item.kind==='application'?'viewApplication':['booking','reservation'].includes(item.kind)?'viewReservation':'viewRequest';
  const date=item.date&&Number.isFinite(Date.parse(item.date))?new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(item.date)):'—';
  const tone=['completed','delivered','collected','accepted','confirmed','hired'].includes(item.status.toLowerCase())?'positive':['pending','awaiting_agreement','submitted','open'].includes(item.status.toLowerCase())?'waiting':['preparing','in_progress','in_review'].includes(item.status.toLowerCase())?'progress':'neutral';
  return <article className="tx-row" key={item.id} data-kind={item.kind}><div className="tx-type"><span className="tx-icon"><SpaceIcon name={icons[item.kind]}/></span><span>{t(item.kind)}</span></div><div className="tx-identity"><strong>{item.title||t(item.kind)}</strong>{item.reference&&<small>{item.reference}</small>}</div><div className="tx-date"><time dateTime={item.date??undefined}>{date}</time>{item.amount!==null&&<strong>{transactionAmount(item,locale)}</strong>}</div><span className={`tx-status tx-status-${tone}`}>{transactionStatus(item,locale)}</span>{['hotel','transport','housing','visit'].includes(item.kind)?<details className="tx-detail"><summary className="tx-action">{t('review')}</summary><div>{Object.entries(item.details??{}).map(([name,value])=><p key={name}>{t(name as Parameters<typeof t>[0])}: {transactionDetail(name,value,locale)}</p>)}<p>{t('chatManagement')}</p></div></details>:<a className="tx-action" href={transactionLink(item,locale)} aria-label={`${t(action)} — ${item.title||t(item.kind)}${item.reference?' · '+item.reference:''}`}>{t(action)}</a>}</article>;
 }
 return <div className="tx-overview" aria-busy={!data&&!failed}>
  <p className="space-intro">{t('intro')}</p>
  <div className="tx-summary">{(['orders','requests','documents'] as const).map((name,index)=><button key={name} type="button" onClick={()=>filter(name)} disabled={!data} aria-pressed={category===name}><span className="tx-icon"><SpaceIcon name={(['orders','requests','receipts'] as const)[index]}/></span><span className="tx-summary-label">{t(name)}</span><strong>{data?data.counts[name]:'—'}</strong><small>{t(({orders:'ordersHint',requests:'requestsHint',documents:'documentsHint'} as const)[name])}</small></button>)}</div>
  {failed?<section className="tx-message" role="alert"><p>{t('failed')}</p><button onClick={()=>setAttempt(n=>n+1)}>{t('retry')}</button></section>:!data?<p className="tx-message" role="status">{t('loading')}</p>:data.counts.all===0?<section className="tx-empty"><Image unoptimized src="/images/shida/transactions-empty.svg" alt="" width="420" height="205"/><h2>{t('empty')}</h2><p>{t('emptyBody')}</p><a className="tx-explore" href={`${prefix}/shida`}><SpaceIcon name="search"/>{t('explore')}</a><a className="tx-activities" href={`${prefix}/shida/space/?view=management`}>{t('activities')} <span aria-hidden="true">→</span></a></section>:<>
   <nav className="tx-filters" aria-label={t('intro')}>{(['all','orders','requests','documents'] as const).map(name=><button key={name} type="button" aria-pressed={category===name} onClick={()=>filter(name)}>{t(name==='documents'?'documentFilter':name)} ({data.counts[name]})</button>)}</nav>
   <section aria-label={t('recent')}><div className="tx-heading"><h2>{category==='documents'?t('documents'):t('recent')}</h2><label>{t('sort')}<select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}><option value="recent">{t('newest')}</option><option value="oldest">{t('oldest')}</option></select></label></div>{recentItems.length?<div className="tx-list">{recentItems.map(row)}</div>:<p className="tx-message">{t('noResults')}</p>}
   {(page>1||data.has_more)&&<nav className="tx-pagination" aria-label={t('page')}><button disabled={page===1} onClick={()=>setPage(n=>n-1)}>{t('previous')}</button><span>{t('page')} {page}</span><button disabled={!data.has_more} onClick={()=>setPage(n=>n+1)}>{t('next')}</button></nav>}</section>
   {category==='all'&&data.counts.documents>0&&<section className="tx-documents"><div className="tx-heading"><h2>{t('documents')}</h2><button onClick={()=>filter('documents')}>{t('viewAll')} <span aria-hidden="true">→</span></button></div>{documents.length>0&&<div className="tx-list">{documents.map(row)}</div>}<p className="tx-note">{t('documentNote')}</p></section>}
   {category==='documents'&&<p className="tx-note">{t('documentNote')}</p>}
  </>}
 </div>;
}
