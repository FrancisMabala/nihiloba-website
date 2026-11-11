'use client';
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
import './mission-management.css';

type Status='draft'|'closed'|'open'|'available'|'online'|'hidden'|'sold'|'pending'|'archived';
type Kind='article'|'job'|'service';
type Row={type:Kind;reference:string;title:string;status:Status;location?:string;count?:number;price?:string;currency?:string};
type Work={example?:string;name:string;city:string;communes:string[];days:string[];slots:string[];frequency:string[];missions:{name:string;category:string;tasks:string[];experience:string;rate:string;amount:string;currency:string;unit:string}[];message?:string};
type Model=Row&{locations?:{kinshasa_communes:string[];quartiers:Record<string,string[]>};rows:Row[];version:string;values:MissionValues;profile:Work|null;application?:string};
type Props={locale:MissionLocale;binding:string};
export const missionQuery=(view:string,query:Record<string,string>)=>'?'+new URLSearchParams({view,...query});
function useMission(binding:string,kind:string,offer:string){
 const [data,set]=useState<Model|null>(null),[error,fail]=useState(''),[round,reload]=useState(0);
 const api=useCallback(async(body?:object,signal?:AbortSignal)=>{const params=new URLSearchParams({kind,...(offer?{offer}:{})});
 const r=await fetch('/api/shida/personal/job-offer?'+params,{method:body?'POST':'GET',cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal});
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
export function PersonalListings(props:Props){
 const params=new URLSearchParams(typeof window==='undefined'?'':window.location.search),offer=params.get('offer'),kind=params.get('kind');
 if(offer)return <Manager {...props} offer={offer} kind={kind||'manage'}/>;
 return <Catalogue {...props} initial={params.get('tab')||'all'}/>
}
function Catalogue({locale,binding,initial}:Props&{initial:string}){
 const {data,error,retry}=useMission(binding,'catalogue',''),t=(k:Parameters<typeof listingText>[1])=>listingText(locale,k);
 const [tab,choose]=useState(initial),[filter,select]=useState('all'),[menu,open]=useState(false);
 const service=(locale==='en'?'':'/'+locale)+'/shida/seller/services',serviceForm=service+'?view=services&intent=create',mission=missionQuery('job-offer',{intent:'mission'}),article=missionQuery('listings',{tab:'article',item:'new'});
 if (error === '401' || error === 'personal_sign_in_required') {
   return <section className="space-sign-in">
     <p>{t('signInForListings')}</p>
     <PersonalWhatsAppLogin locale={locale} onAuthenticated={() => window.location.reload()}/>
   </section>;
 }
 const create=<nav className="mission-actions"><a href={article}>{t('sell')}</a><a href={mission}>{t('post')}</a><a href={serviceForm}>{t('provide')}</a></nav>;
 const rows=(data?.rows||[]).filter(r=>(tab==='all'||r.type===tab)&&(tab!=='job'||filter==='all'||r.status===filter));
 return <div className="personal-listings-catalogue"><button className="button button-primary" aria-expanded={menu} onClick={()=>open(!menu)}>＋ {t('create')}</button>{menu&&create}
 <nav className="mission-actions">{(['all','article','job','service'] as const).map(k=><button key={k} aria-pressed={tab===k} onClick={()=>{choose(k);select('all')}}>{t(k)}{data?' ('+data.rows.filter(r=>k==='all'||r.type===k).length+')':''}</button>)}</nav>
 {tab==='job'&&<nav className="mission-actions">{(['all','draft','open','closed'] as const).map((k,i)=><button key={k} aria-pressed={k===filter} onClick={()=>select(k)}>{t((['all','drafts','opens','closes'] as const)[i])}</button>)}</nav>}
 {!data?<p role="status">{error?t('error'):t('loading')} {error&&<button onClick={retry}>{t('retry')}</button>}</p>:tab==='article'?<QuickSell locale={locale} embedded/>:rows.length?rows.map(r=>{
 const href=r.type==='job'?r.status==='draft'?missionQuery('job-offer',{intent:'mission',draft:r.reference}):missionQuery('listings',{kind:'manage',offer:r.reference}):r.type==='article'?missionQuery('listings',{tab:'article',item:r.reference}):r.status==='draft'?serviceForm:service+'?offering='+encodeURIComponent(r.reference);
 return <article key={r.type+r.reference} className="listing-row"><SpaceIcon name={r.type==='job'?'management':r.type==='service'?'tool':'shop'}/><div><small>{t(r.type)}</small><h2>{r.title||t('draft')}</h2><p>{[r.location,r.price&&[r.price,r.currency].join(' '),r.count!=null?r.count+' '+t(r.type==='job'?(r.count===1?'oneApplication':'applications'):(r.count===1?'oneRequest':'requests')).toLocaleLowerCase():null].filter(Boolean).join(' · ')}</p></div><div><span>{t(r.status)}</span><a href={href}>{t(r.type==='job'?'jobAction':r.type==='service'?'serviceAction':'articleAction')} →</a></div></article>}):<section className="mission-card"><p>{t(tab==='service'?'noservice':tab==='job'?'nojob':'none')}</p>{tab==='job'?<a href={mission}>{t('post')}</a>:tab==='service'?<a href={serviceForm}>{t('provide')}</a>:create}</section>}</div>
}
