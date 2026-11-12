'use client';
import Image from 'next/image';
import {useCallback,useEffect,useState} from 'react';
import {listingText,type MissionLocale} from '../../lib/personal-missions-copy';
import {occText} from '../../lib/occasional-copy';
import {payload,type MissionValues} from '../../lib/mission-form';
import {candidateApplicationPath} from './candidate-employment';
import {MissionWizard} from './mission-wizard';
import {MissionPeople} from './mission-people';
import {SpaceIcon} from './account-space-icon';
import {PersonalWhatsAppLogin} from './personal-whatsapp-login';
import {QuickSell} from './quick-sell';
import {listingCopy} from '../../lib/wenze-listings-copy';
import './mission-management.css';
import './personal-listings.css';

type Status='draft'|'closed'|'open'|'available'|'online'|'hidden'|'sold'|'pending'|'archived';
type Kind='article'|'job'|'service';
type Row={type:Kind;reference:string;title:string;status:Status;location?:string;photo?:string;count?:number;price?:string;currency?:string};
type Work={example?:string;name:string;city:string;communes:string[];days:string[];slots:string[];frequency:string[];missions:{name:string;category:string;tasks:string[];experience:string;rate:string;amount:string;currency:string;unit:string}[];message?:string};
type Model=Row&{locations?:{kinshasa_communes:string[];quartiers:Record<string,string[]>};rows:Row[];version:string;values:MissionValues;profile:Work|null;application?:string};
type Props={locale:MissionLocale;binding:string};
export const missionQuery=(view:string,query:Record<string,string>)=>'?'+new URLSearchParams({view,...query});
function useMission(binding:string,kind:string,offer:string){
 const [data,set]=useState<Model|null>(null),[error,fail]=useState(''),[round,reload]=useState(0);
 const api=useCallback(async(body?:object,signal?:AbortSignal)=>{const params=new URLSearchParams({kind,...(offer?{offer}:{})});
 const r=await fetch('/api/shida/personal/job-offer/?'+params,{method:body?'POST':'GET',cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal});
 if(!r.ok){const d=await r.json().catch(()=>({}));throw Error(d.code === 'personal_sign_in_required' ? d.code : d.field || String(r.status))}return r.json()},[binding,kind,offer]);
 useEffect(()=>{const c=new AbortController();api(undefined,c.signal).then(v=>{if(!c.signal.aborted){set(v);fail('')}},e=>{if(!c.signal.aborted)fail(e.message)});return()=>c.abort()},[api,round]);
 return {data,set,error,fail,api,retry:()=>{set(null);fail('');reload(n=>n+1)}}
}
export function ProfileSummary({work,locale}:{work:Work;locale:MissionLocale}){
 const t=(k:string)=>occText(locale,k);
 return <div className="profile-share"><div className="share-person"><span aria-hidden="true">{work.name?.split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase()}</span><div><h3>{work.name}</h3>{listingText(locale,'workProfile')}</div></div><p>{[work.city,...work.communes].filter(Boolean).join(' · ')}</p>
 {work.missions.map((m,i)=><p key={i}><strong>{m.name||t(m.category)}</strong> · {[...m.tasks,m.experience&&t(m.experience),m.rate==='agree'?t('flexible'):m.rate==='amount'?[m.amount,m.currency,t(m.unit)].join(' '):''].filter(Boolean).join(' · ')}</p>)}
 <p>{[...work.days,...work.slots,...(work.frequency||[])].map(t).join(' · ')}</p>{work.example&&<p>{work.example}</p>}</div>
}
export function MissionApply({locale,binding,offer}:Props&{offer:string}){
 const t=(k:Parameters<typeof listingText>[1])=>listingText(locale,k),{data,set,api,error,fail,retry}=useMission(binding,'apply',offer);
 const [note,write]=useState(''),[busy,lock]=useState(false);
 const prefix=locale==='en'?'':'/'+locale,detail=prefix+'/shida/emplois/'+encodeURIComponent(offer);
 if(!data||error==='409')return <p role="status">{error==='409'?t('unavailable'):error?t('error'):t('loading')} {error&&<button onClick={retry}>{t('retry')}</button>}</p>
 if(data.application)return <section className="mission-card" role="status"><h2>{t('sent')}</h2><a href={candidateApplicationPath(locale,data.application)}>{t('specific')} →</a></section>;
 return <section className="mission-card"><p>{data.title} · {data.location}</p>{data.profile?<form onSubmit={async e=>{e.preventDefault();if(busy)return;lock(true);fail('');try{set(await api({action:'apply',confirmed:true,message:note,version:data.version}))}catch(e){if((e as Error).message==='412'){retry()}else fail((e as Error).message)}finally{lock(false)}}}>
 <h2>{t('shared')}</h2><ProfileSummary work={data.profile} locale={locale}/><label>{t('note')}<textarea maxLength={800} value={note} onChange={e=>write(e.target.value)}/></label><p>{t('consent')}</p>
 {error&&<p role="alert">{t('error')}</p>}<div className="mission-actions"><a href={detail}>{t('cancel')}</a><button disabled={busy} className="button button-primary">{error?t('retry'):t('submit')}</button></div></form>:<a className="button button-primary" href={missionQuery('job-search',{section:'profiles',profile:'occasional_work',job:offer,from:'mission'})}>{t('profile')}</a>}</section>
}
function Manager({locale,binding,offer,kind}:Props&{offer:string;kind:string}){
 const t=(k:Parameters<typeof listingText>[1])=>listingText(locale,k),{api,data,set,error,fail,retry}=useMission(binding,'manage',offer);
 const [edit,editing]=useState(false),[form,change]=useState<MissionValues>({}),[confirm,ask]=useState<'close'|'remove'|null>(null),[busy,lock]=useState(false);
 const list=missionQuery('listings',{}),dest=(k:string)=>missionQuery('listings',{offer,kind:k});
 async function send(action:string){if(!data||busy)return;lock(true);fail('');try{const d=await api({action,confirmed:true,version:data.version,language:locale,...(action==='edit'?{values:payload(form)}:{})});if(d.removed){window.location.assign(list);return}set(d);editing(false);ask(null)}catch(e){fail((e as Error).message)}finally{lock(false)}}
 if(!data)return <p role="status">{error?t('error'):t('loading')} {error&&<button onClick={retry}>{t('retry')}</button>}</p>;
 return <section className="mission-card"><a href={list}>← {t('list')}</a><h2>{data.title}</h2><p>{t(data.status)} · {data.location}</p>
 {error&&<p role="alert">{t('error')} <button onClick={()=>{editing(false);retry()}}>{t('retry')}</button></p>}
 {edit?<MissionWizard locations={data.locations} locale={locale} values={form} change={change} busy={busy} pending={false} editLabel={t('save')} preview={v=>api({action:'preview_edit',version:data.version,language:locale,values:v})} save={()=>editing(false)} publish={()=>void send('edit')}/>:<>
 <div className="mission-actions">{data.status==='open'&&<><a href={(locale==='en'?'':'/'+locale)+'/shida/emplois/'+encodeURIComponent(offer)}>{t('view')}</a><button onClick={()=>{change(data.values);editing(true)}}>{t('edit')}</button></>}</div>
 <nav className="mission-actions"><a className={'button '+(kind!=='candidates'?'button-primary':'')} href={dest('applications')}>{t('applications')} ({data.count})</a>{data.status==='open'&&<a className={'button '+(kind==='candidates'?'button-primary':'')} href={dest('candidates')}>{t('find')}</a>}</nav>
 {['applications','candidates'].includes(kind)&&<MissionPeople locale={locale} binding={binding}/>}
 <div className="mission-actions">{data.status==='open'&&<button onClick={()=>ask('close')}>{t('close')}</button>}<button onClick={()=>ask('remove')}>{t('remove')}</button></div>
 {confirm&&<section aria-label={t(confirm)} className="mission-confirm"><p>{t(confirm==='remove'?'removeHelp':'closeHelp')}</p><button disabled={busy} onClick={()=>ask(null)}>{t('cancel')}</button> <button disabled={busy} onClick={()=>void send(confirm)}>{t(confirm)}</button></section>}</>}</section>
}
export function PersonalListings(props:Props) {
 const query = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
 const offer = query.get('offer');
 const article = query.get('tab') === 'article' && query.has('item');
 if (offer || article) return <><h1>{listingCopy[props.locale].title}</h1>
   {offer ? <Manager {...props} offer={offer} kind={query.get('kind') || 'manage'}/> : <QuickSell locale={props.locale} embedded/>}
 </>;
 const initial = query.get('tab');
 return <Catalogue {...props} initial={filters.find(key => key === initial) || 'all'}/>;
}

const filters = ['all','article','job','service'] as const;
const icons = {article:'orders',job:'management',service:'tool'} as const;
const actionLabels = {article:'sell',job:'post',service:'provide'} as const;
const typeLabels = {article:'articleType',job:'jobType',service:'serviceType'} as const;
const manageLabels = {article:'articleAction',job:'jobAction',service:'serviceAction'} as const;

function ListingThumbnail({row}:{row:Row}) {
 const [failed,markFailed]=useState(false);
 const photo=row.type==='article' && row.photo && /^https:\/\//i.test(row.photo) && !failed;
 return <div className="listing-thumbnail">{photo && row.photo
   ? <Image src={row.photo} unoptimized width={64} height={64} alt="" referrerPolicy="no-referrer" onError={()=>markFailed(true)}/>
   : <SpaceIcon name={icons[row.type]}/>}</div>;
}

function Catalogue({locale,binding,initial}:Props & {initial:typeof filters[number]}) {
 const {data,error,retry} = useMission(binding,'catalogue','');
 const [tab,choose] = useState(initial);
 const [menu,open] = useState(false);
 const t = (key:Parameters<typeof listingText>[1]) => listingText(locale,key);
 const service = (locale==='en'?'':'/'+locale)+'/shida/seller/services/';
 const forms = {
   article:missionQuery('listings',{tab:'article',item:'new'}),
   job:missionQuery('job-offer',{intent:'mission'}),
   service:service+'?view=services&intent=create'
 };
 const choices = <section className="listing-choices" id="listing-publishing-choices">
   {!data?.rows.length && <p>{t('none')}</p>}
   <h2>{t('publishWhat')}</h2>
   <div>{(['article','job','service'] as const).map(key=><a className="button" key={key} href={forms[key]}>
     <SpaceIcon name={icons[key]}/>{t(actionLabels[key])}
   </a>)}</div>
 </section>;
 const title = <h1>{listingCopy[locale].title}</h1>;
 if (error === '401' || error === 'personal_sign_in_required') return <>{title}<section className="space-sign-in">
   <p>{t('signInForListings')}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>window.location.reload()}/>
 </section></>;
 if (!data || error) return <>{title}<p role="status">{t(error?'error':'loading')} {error && <button onClick={retry}>{t('retry')}</button>}</p></>;
 const rows = data.rows.filter(row=>tab==='all'||row.type===tab);
 function listing(row:Row) {
   const ref = encodeURIComponent(row.reference);
   const manage = row.type==='job' ? row.status==='draft' ? missionQuery('job-offer',{intent:'mission',draft:row.reference}) : missionQuery('listings',{kind:'manage',offer:row.reference})
     : row.type==='article' ? missionQuery('listings',{tab:'article',item:row.reference})
     : row.status==='draft' ? forms.service : service+'?offering='+ref;
   const job = row.type==='job';
   const count = row.count;
   const responses = count===undefined ? null : count===0 ? t(job?'noApplications':'noRequests')
     : <a href={job?missionQuery('listings',{kind:'applications',offer:row.reference}):service+'?view=work&offering='+ref}>
       {t(job?(count===1?'viewApplication':'viewApplications'):(count===1?'viewRequest':'viewRequests')).replace('{n}',String(count))}
     </a>;
   return <article className="personal-listing" key={row.type+row.reference}>
     <ListingThumbnail key={row.photo} row={row}/>
     <div className="listing-identity"><small>{t(typeLabels[row.type])}</small><h2>{row.title||t('draft')}</h2>
       <div className="listing-meta">{row.location&&<span>{row.location}</span>}{row.price&&<span>{row.price} {row.currency}</span>}{responses&&<span>{responses}</span>}</div>
     </div>
     <div className="listing-controls"><span>{t(row.status)}</span><a className="button" href={manage}>{t(manageLabels[row.type])}</a></div>
   </article>;
 }
 return <div className="my-listings"><header>{title}{data.rows.length>0&&<button className="button button-primary" aria-expanded={menu} aria-controls="listing-publishing-choices" onClick={()=>open(!menu)}>+ {t('create')}</button>}</header>
   {data.rows.length===0 ? choices : <>
     {menu&&choices}
     <div className="listing-filters">{filters.map(key=><button className={'button'+(tab===key?' button-primary':'')} key={key} aria-pressed={key===tab} onClick={()=>choose(key)}>
       {t(key)} ({key==='all'?data.rows.length:data.rows.filter(row=>row.type===key).length})
     </button>)}</div>
     {rows.map(listing)}
     {!rows.length && tab!=='all' && <section className="listing-choices"><p>{t(tab==='job'?'nojob':tab==='service'?'noservice':'noarticle')}</p>
       <a className="button" href={forms[tab]}>{t(actionLabels[tab])}</a></section>}
   </>}
 </div>;
}
