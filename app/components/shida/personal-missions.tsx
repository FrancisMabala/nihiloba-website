'use client';
import Image from 'next/image';
import {medaCopy} from '../../lib/meda-copy';
import {medaDiscoveryCopy} from '../../lib/meda-discovery-copy';
import {MedaListingRow} from './meda-discovery';
import type {MedaListing} from './meda-listing-form';
import {MedaMarketplace} from './meda-marketplace';
import {individualApplicationCopy} from '../../lib/individual-application-copy';
import {useCallback,useEffect,useState,useRef} from 'react';
import {listingText,type MissionLocale} from '../../lib/personal-missions-copy';
import {occText} from '../../lib/occasional-copy';
import {payload,type MissionValues} from '../../lib/mission-form';
import {candidateApplicationPath} from './candidate-employment';
import {MissionPresentation} from './mission-presentation';
import {missionText} from '../../lib/mission-copy';
import {MissionWizard} from './mission-wizard';
import {FinanceSheet} from './finance-sheet';
import {useWorkDraft,WenzeLeaveDialog,leaveWork} from '../../lib/wenze-work';
import {MissionPeople} from './mission-people';
import {SpaceIcon} from './account-space-icon';
import {PersonalWhatsAppLogin} from './personal-whatsapp-login';
import {PersonalEmployerPhoto} from './personal-employer-photo';
import {QuickSell} from './quick-sell';
import {listingCopy} from '../../lib/wenze-listings-copy';
import './mission-management.css';
import './personal-listings.css';
import './personal-space-mobile.css';
import {personalSpaceMobileCopy} from '../../lib/personal-space-mobile-copy';

type Status='draft'|'closed'|'open'|'paused'|'available'|'online'|'hidden'|'sold'|'pending'|'archived';
type Kind='article'|'job'|'service';
type Row={type:Kind;reference:string;title:string;status:Status;location?:string;photo?:string;count?:number;price?:string;currency?:string};
type Work={example?:string;name:string;city:string;communes:string[];days:string[];slots:string[];frequency:string[];missions:{name:string;category:string;tasks:string[];experience:string;rate:string;amount:string;currency:string;unit:string}[];message?:string};
type Model=Row&{locations?:{kinshasa_communes:string[];quartiers:Record<string,string[]>};rows:Row[];version:string;values:MissionValues;profile:Work|null;application?:string;allowed_actions?:string[]};
type Props={locale:MissionLocale;binding:string};
type ManagementAction='pause'|'reactivate'|'close'|'remove';
export function missionManagementActions(data:{status:string;allowed_actions?:string[]}){
 return (['pause','reactivate','close','remove'] as const).filter(action=>Array.isArray(data.allowed_actions)?data.allowed_actions.includes(action):action==='remove'||action==='close'&&data.status==='open');
}
export function MissionActionConfirmation({locale,action,busy,onCancel,onConfirm,cancelRef}:{locale:MissionLocale;action:ManagementAction;busy:boolean;onCancel:()=>void;onConfirm:()=>void;cancelRef?:React.Ref<HTMLButtonElement>}){
 const t=(key:Parameters<typeof listingText>[1])=>listingText(locale,key);
 return <><p>{t(action==='pause'?'pauseHelp':action==='reactivate'?'reactivateHelp':action==='remove'?'removeHelp':'closeHelp')}</p><button ref={cancelRef} disabled={busy} onClick={onCancel}>{t('cancel')}</button><button className={action==='close'||action==='remove'?'listing-danger':'button button-primary'} disabled={busy} onClick={onConfirm}>{action==='close'?missionText(locale,'closeListing'):t(action)}</button></>;
}
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
 const t=(k:Parameters<typeof listingText>[1])=>listingText(locale,k),c=individualApplicationCopy[locale],{data,set,api,error,fail,retry}=useMission(binding,'apply',offer);
 const draftKey=`shida:application-message:${binding}:${offer}`;
 const [note,write]=useState(''),[busy,lock]=useState(false),[uncertain,setUncertain]=useState(false),[changed,setChanged]=useState(false);
 const sending=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;try{const saved=JSON.parse(sessionStorage.getItem(draftKey)||'null');if(saved&&saved.expires>Date.now()&&typeof saved.message==='string')queueMicrotask(()=>{if(alive.current)write(saved.message.slice(0,800));});}catch{}return()=>{alive.current=false;};},[draftKey]);
 function update(value:string){write(value);try{sessionStorage.setItem(draftKey,JSON.stringify({message:value,expires:Date.now()+86400000}));}catch{}}
 const prefix=locale==='en'?'':'/'+locale,detail=prefix+'/shida/emplois/'+encodeURIComponent(offer),profile=missionQuery('job-search',{section:'profiles',profile:'occasional_work',job:offer,from:'mission'});
 async function submit(){
  if(sending.current||!data)return;sending.current=true;lock(true);fail('');setChanged(false);
  try{
   // Read first on every attempt: reconcile a lost success and recheck availability/profile sharing.
   const latest=await api();if(!alive.current)return;
   set(latest);if(latest.application){setUncertain(false);try{sessionStorage.removeItem(draftKey);}catch{}return;}
   if(latest.version!==data.version){setChanged(true);setUncertain(false);return;}
   setUncertain(true);
   try{const result=await api({action:'apply',confirmed:true,message:note,version:latest.version});if(alive.current){set(result);setUncertain(false);try{sessionStorage.removeItem(draftKey);}catch{}}}
   catch(caught){
    const code=(caught as Error).message;
    if(code==='412'){set(await api());setChanged(true);setUncertain(false);}
    else if(code==='409'||code==='422'||code==='profile_required'){setUncertain(false);fail(code);}
    else{try{const resolved=await api();if(alive.current){set(resolved);setUncertain(false);if(!resolved.application)fail(code);else try{sessionStorage.removeItem(draftKey);}catch{}}}catch{if(alive.current)fail(code);}}
   }
  }catch(caught){if(alive.current)fail((caught as Error).message);}
  finally{sending.current=false;if(alive.current)lock(false);}
 }
 if(!data)return <section className="mission-card"><p role="status">{error==='409'?c.closed:error?t('error'):t('loading')}</p>{error&&<button onClick={retry}>{t('retry')}</button>}<a href={detail}>{c.back}</a></section>;
 if(data.application)return <section className="mission-card" role="status"><h2>{c.sent}</h2><a href={candidateApplicationPath(locale,data.application)}>{c.application} →</a><p><a href={detail}>{c.back}</a></p></section>;
 return <section className="mission-card mission-application"><a href={detail}>← {c.back}</a><p>{data.title} · {data.location}</p>{data.profile?<form onSubmit={e=>{e.preventDefault();void submit();}}>
 <section className="mission-profile-summary"><h2>{c.profile}</h2><ProfileSummary work={data.profile} locale={locale}/><div className="mission-actions"><a href={profile+'&preview=1'}>{c.view}</a><a href={profile}>{c.edit}</a></div></section><p>{c.share}</p>
 <label htmlFor="mission-message">{c.note} <small>{c.optional}</small></label><p id="mission-message-help">{c.helper}</p><textarea id="mission-message" aria-describedby="mission-message-help mission-message-limit" maxLength={800} rows={5} value={note} onChange={e=>update(e.target.value)}/><small id="mission-message-limit">{note.length}/800 · {c.limit}</small>
 {changed&&<p role="status">{c.changed}</p>}{error&&<p role="alert">{error==='409'?c.closed:error==='profile_required'?c.required:t('error')}</p>}{uncertain&&<p role="status">{c.checking}</p>}
 <div className="mission-actions"><button disabled={busy||error==='409'} className="button button-primary">{c.submit}</button><a href={detail}>{c.back}</a></div></form>:<><p>{c.needed}</p><a className="button button-primary" href={profile}>{t('profile')}</a></>}</section>;
}

function Manager({locale,binding,offer,kind}:Props&{offer:string;kind:string}){
 const t=(k:Parameters<typeof listingText>[1])=>listingText(locale,k),{api,data,set,error,fail,retry}=useMission(binding,'manage',offer);
 const [edit,editing]=useState(false),[form,change]=useState<MissionValues>({}),[confirm,ask]=useState<'close'|'remove'|'pause'|'reactivate'|null>(null),[busy,lock]=useState(false);
 const [actions,showActions]=useState(false),cancelAction=useRef<HTMLButtonElement>(null),firstAction=useRef<HTMLButtonElement>(null),checkAction=useRef<HTMLButtonElement>(null);
 const [notice,setNotice]=useState<'pausedSaved'|'reactivatedSaved'|'missionChanged'|'missionReconciled'|''>(''),[uncertain,setUncertain]=useState(false);
 const sending=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const listingTab=typeof window==='undefined'?'':new URLSearchParams(window.location.search).get('listing_tab')||'';
 const returnTab=['article','job','service'].includes(listingTab)?listingTab:'';
 const list=missionQuery('listings',returnTab?{tab:returnTab}:{}),dest=(k:string)=>missionQuery('listings',{offer,kind:k,...(returnTab?{listing_tab:returnTab}:{})});
 useWorkDraft(edit&&JSON.stringify(form)!==JSON.stringify(data?.values),t('error'));
 useEffect(()=>{if(actions&&!busy)(uncertain?checkAction:confirm?cancelAction:firstAction).current?.focus();},[confirm,actions,busy,uncertain]);
 const allowed=(action:string,fallback=false)=>Array.isArray(data?.allowed_actions)?data.allowed_actions.includes(action):fallback;
 async function reconcile(message:'missionChanged'|'missionReconciled'){
  // A lost response may have committed. Read current state; never repeat the command automatically.
  ask(null);setUncertain(true);
  try{const latest=await api();if(alive.current){set(latest);setUncertain(false);setNotice(message);fail('');showActions(false);}}
  catch{if(alive.current)fail('reconcile');}
 }
 async function checkStatus(){if(sending.current)return;sending.current=true;lock(true);try{await reconcile('missionReconciled');}finally{sending.current=false;if(alive.current)lock(false);}}
 async function send(action:string){
  if(!data||sending.current||uncertain)return;
  const lifecycle=action==='pause'||action==='reactivate';
  if(lifecycle&&!allowed(action))return;
  sending.current=true;lock(true);fail('');setNotice('');
  try{
   const d=await api({action,confirmed:true,version:data.version,language:locale,...(action==='edit'?{values:payload(form)}:{})});
   if(!alive.current)return;
   if(d.removed){window.location.assign(list);return;}
   set(d);editing(false);ask(null);showActions(false);
   if(lifecycle)setNotice(action==='pause'?'pausedSaved':'reactivatedSaved');
  }catch(e){
   if(!alive.current)return;
   const code=(e as Error).message;
   if(lifecycle){
    if(code==='409')await reconcile('missionChanged');
    else if(!/^4\d\d$/.test(code))await reconcile('missionReconciled');
    else{ask(null);fail(code);}
   }else fail(code);
  }finally{sending.current=false;if(alive.current)lock(false);}
 }
 if(!data)return <p role="status">{error?t('error'):t('loading')} {error&&<button onClick={retry}>{t('retry')}</button>}</p>;
 const mt=(k:string)=>missionText(locale,k),v=data.values,open=data.status==='open',tab=kind==='candidates'&&open?'candidates':'applications';
 const stopEdit=async()=>{if(await leaveWork()){editing(false);fail('')}};
 return <section className="mission-manager"><WenzeLeaveDialog locale={locale}/>
 {edit?<><button className="mission-link" disabled={busy} onClick={()=>void stopEdit()}>← {mt('backListing')}</button><h1>{mt('editTitle')}</h1><p>{data.title}</p></>:<><a href={list} onClick={event=>{if(document.referrer){const previous=new URL(document.referrer);if(previous.origin===location.origin&&previous.pathname===location.pathname&&previous.searchParams.get('view')==='listings'&&!previous.searchParams.has('offer')&&!previous.searchParams.has('item')){event.preventDefault();history.back();}}}}>← {t('list')}</a><h1>{data.title}</h1></>}
 {notice&&!actions&&<p role="status">{t(notice)}</p>}
 {!actions&&error&&<p role="alert">{t('error')}</p>}
 {uncertain&&!actions&&<p role="status">{t('missionUncertain')} <button disabled={busy} onClick={()=>void checkStatus()}>{t('checkStatus')}</button></p>}
 {edit?<MissionWizard locations={data.locations} locale={locale} values={form} change={change} busy={busy} pending={false} editLabel={t('save')} preview={v=>api({action:'preview_edit',version:data.version,language:locale,values:v})} cancel={()=>void stopEdit()} publish={()=>void send('edit')}/>:<>
 <div className="mission-toolbar"><div><span className="mission-status">{t(data.status)}</span> {data.location}</div><div className="mission-actions">
 {allowed('edit',open)&&<button disabled={busy||uncertain} className="button button-primary" onClick={()=>{change(data.values);editing(true);fail('')}}>{mt('editTitle')}</button>}{open&&<a className="button" href={(locale==='en'?'':'/'+locale)+'/shida/emplois/'+encodeURIComponent(offer)}>{t('view')}</a>}
 <button type="button" aria-haspopup="dialog" aria-expanded={actions} onClick={()=>showActions(true)}>{mt('more')}</button></div></div>
 {actions&&<FinanceSheet title={confirm?t(confirm):mt('more')} locale={locale} onClose={()=>{if(!busy){showActions(false);ask(null)}}}><div className="listing-action-sheet">
 {confirm?<MissionActionConfirmation locale={locale} action={confirm} busy={busy||uncertain} cancelRef={cancelAction} onCancel={()=>ask(null)} onConfirm={()=>void send(confirm)}/>:<>
 {missionManagementActions(data).map((action,index)=><button key={action} ref={index===0?firstAction:undefined} disabled={busy||uncertain} className={action==='remove'?'listing-danger':undefined} onClick={()=>{fail('');setNotice('');ask(action);}}>{action==='close'?mt('closeListing'):t(action)}</button>)}
 </>}
 {notice&&<p role="status">{t(notice)}</p>}{busy&&<p role="status">{t('loading')}</p>}{error&&<p role="alert">{t('error')}</p>}
 {uncertain&&<p role="status">{t('missionUncertain')} <button ref={checkAction} disabled={busy} onClick={()=>void checkStatus()}>{t('checkStatus')}</button></p>}
 </div></FinanceSheet>}
 <section className="mission-card"><MissionPresentation locale={locale} title="" description={v.short_summary} frequency={v.duration_frequency} hours={v.work_schedule} pay={v.budget} experience={v.optional_experience}/></section>
 {kind==='manage'&&<PersonalEmployerPhoto locale={locale} binding={binding} offerRef={offer} disabled={busy||uncertain||actions}/>}
 <section className="mission-card"><nav className="mission-tabs"><a aria-current={tab==='applications'?'page':undefined} href={dest('applications')}>{t('applications')} ({data.count})</a>{open&&<a aria-current={tab==='candidates'?'page':undefined} href={dest('candidates')}>{t('find')}</a>}</nav>
 <MissionPeople locale={locale} binding={binding} defaultKind={tab} discovery={open}/></section></>}</section>

}
export function PersonalListings(props:Props) {
 const query = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
 if(query.get('tab')==='meda'&&query.has('meda_view')&&query.get('meda_view')!=='mine')return <><a href={missionQuery('listings',{})}>{listingCopy[props.locale].all}</a><MedaMarketplace locale={props.locale} embedded/></>;
 const offer = query.get('offer');
 if (offer) return <Manager key={JSON.stringify([props.binding,offer])} {...props} offer={offer} kind={query.get('kind') || 'manage'}/>;
 const initial = query.get('tab');
 return <Catalogue {...props} initial={filters.find(key => key === initial) || 'all'}/>;
}

const filters = ['all','article','job','service','meda'] as const;
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
 const [meda,setMeda]=useState<{items:MedaListing[];has_more:boolean;total?:number}|null>(null);
 const [medaPage,setMedaPage]=useState(1),[medaError,setMedaError]=useState(false),[medaAttempt,setMedaAttempt]=useState(0);
 useEffect(()=>{const controller=new AbortController();void fetch(`/api/shida/personal/meda/listings/?page=${medaPage}`,{headers:{'x-shida-session':binding},cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();const result=await response.json();if(!controller.signal.aborted){setMeda(result);setMedaError(false)}}).catch(()=>{if(!controller.signal.aborted)setMedaError(true)});return()=>controller.abort()},[binding,medaPage,medaAttempt]);
 const [articleCount,setArticleCount]=useState<number|null>(null);
 const [menu,open] = useState(initial==='meda');
 const strip=useRef<HTMLDivElement>(null),restored=useRef(false);
 useEffect(()=>{const sync=()=>{const value=new URLSearchParams(location.search).get('tab');choose(filters.find(k=>k===value)||'all')};window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync)},[]);
 useEffect(()=>{const button=strip.current?.querySelector<HTMLButtonElement>('[aria-pressed=true]');if(button&&strip.current&&tab!=='article'){const box=button.getBoundingClientRect(),parent=strip.current.getBoundingClientRect();if(box.left<parent.left)strip.current.scrollLeft-=parent.left-box.left;else if(box.right>parent.right)strip.current.scrollLeft+=box.right-parent.right;}},[tab,data]);
 useEffect(()=>{if(!data||restored.current)return;restored.current=true;const saved=history.state?.shidaListings;if(saved?.path===location.pathname+location.search)requestAnimationFrame(()=>window.scrollTo(0,Number(saved.scrollY)||0));},[data]);
 async function selectTab(value:typeof filters[number]){if(!await leaveWork())return;const url=new URL(location.href);if(value==='all')url.searchParams.delete('tab');else url.searchParams.set('tab',value);url.searchParams.delete('item');url.searchParams.delete('article_status');url.searchParams.delete('article_page');remember();window.location.assign(url.toString());}
 function remember(){history.replaceState({...history.state,shidaListings:{path:location.pathname+location.search,scrollY:window.scrollY}},'');}

 const t = (key:Parameters<typeof listingText>[1]) => listingText(locale,key);
 const service = (locale==='en'?'':'/'+locale)+'/shida/seller/services/';
 const forms = {
   article:missionQuery('listings',{tab:'article',item:'new'}),
   job:missionQuery('job-offer',{intent:'mission'}),
   service:service+'?view=services&intent=create'
 };
 const choices = <section className="listing-choices" id="listing-publishing-choices">
   {!data?.rows.length&&!meda?.items.length && <p>{t('none')}</p>}
   <h2>{t('publishWhat')}</h2>
   <div>{(['article','job','service'] as const).map(key=><a className="button" key={key} href={forms[key]}>
     <SpaceIcon name={icons[key]}/><span>{t(actionLabels[key])}</span>
   </a>)}<a className="button listing-choice-meda" href={missionQuery('listings',{tab:'meda',meda_view:'create'})}><SpaceIcon name="meda"/><span><strong>{medaDiscoveryCopy[locale].creation}</strong><small>{medaDiscoveryCopy[locale].categories}</small></span></a></div>
 </section>;
 const title = <h1 className="space-page-title">{listingCopy[locale].title}</h1>;
 if (error === '401' || error === 'personal_sign_in_required') return <>{title}<section className="space-sign-in">
   <p>{t('signInForListings')}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>window.location.reload()}/>
 </section></>;
 if (!data || error) return <>{title}<p role="status">{t(error?'error':'loading')} {error && <button onClick={retry}>{t('retry')}</button>}</p></>;
 const rows = data.rows.filter(row=>tab==='all'||row.type===tab);
 function listing(row:Row) {
   const ref = encodeURIComponent(row.reference);
   const manage = row.type==='job' ? row.status==='draft' ? missionQuery('job-offer',{intent:'mission',draft:row.reference}) : missionQuery('listings',{kind:'manage',offer:row.reference,...(tab!=='all'?{listing_tab:tab}:{})})
     : row.type==='article' ? missionQuery('listings',{tab:'article',item:row.reference})
     : row.status==='draft' ? forms.service : service+'?offering='+ref;
   const job = row.type==='job';
   const count = row.count;
   const responses = row.type==='article'||typeof count!=='number' ? null : count===0 ? t(job?'noApplications':'noRequests')
     : <a href={job?missionQuery('listings',{kind:'applications',offer:row.reference,...(tab!=='all'?{listing_tab:tab}:{})}):service+'?view=work&offering='+ref}>
       {t(job?(count===1?'viewApplication':'viewApplications'):(count===1?'viewRequest':'viewRequests')).replace('{n}',String(count))}
     </a>;
   return <article className="personal-listing" key={row.type+row.reference}>
     <ListingThumbnail key={row.photo} row={row}/>
     <div className="listing-identity"><small>{t(typeLabels[row.type])}</small><h2>{row.title||t('untitled')}</h2></div>
     <div className="listing-meta">{row.location&&<span>{row.location}</span>}{row.price&&<span>{row.price} {row.currency}</span>}{responses&&<span>{responses}</span>}</div>
     <div className="listing-controls"><span className="listing-status">{t(row.status)}</span><a className="button" href={manage} aria-label={`${t(manageLabels[row.type])}: ${row.title||t('untitled')}`}>{t(row.status==='draft'?'resumeDraft':'manage')} <span aria-hidden="true">›</span></a></div>
   </article>;
 }
 const categoryNavigation=<div className="listing-filters" ref={strip} role="group" aria-label={t('list')}>{filters.map(key=><button className={'button'+(tab===key?' button-primary':'')} key={key} aria-pressed={key===tab} onClick={()=>selectTab(key)}>
       {key==='meda'?'Meda':personalSpaceMobileCopy[locale].listingTabs[key]} ({key==='meda'?(meda?.total??(meda?`${meda.items.length}${meda.has_more?'+':''}`:'…')):key==='all'?`${data.rows.filter(row=>row.type!=='article').length+(articleCount??data.rows.filter(row=>row.type==='article').length)+(meda?.total??meda?.items.length??0)}${!meda||meda.total===undefined&&meda.has_more?'+':''}`:key==='article'?(articleCount??data.rows.filter(row=>row.type==='article').length):data.rows.filter(row=>row.type===key).length})
     </button>)}</div>;
 return <div className={`my-listings${tab==='article'?' my-article-listings':''}`} onClickCapture={event=>{if((event.target as HTMLElement).closest('a'))remember()}}>
  {tab==='article'
   ?<QuickSell locale={locale} embedded heading={title} categoriesNav={categoryNavigation} onInventoryLoaded={setArticleCount}/>
   :<><header>{title}<button className="button button-primary" aria-expanded={menu} aria-controls="listing-publishing-choices" onClick={()=>open(!menu)}>+ {t('create')}</button></header>
    {menu&&choices}{categoryNavigation}{rows.map(listing)}</>}
  {(tab==='all'||tab==='meda')&&<>
   {medaError?<p role="alert">{medaCopy[locale].error} <button onClick={()=>setMedaAttempt(n=>n+1)}>{t('retry')}</button></p>:!meda?<p role="status">{t('loading')}</p>:meda.items.map(row=><MedaListingRow key={row.reference} row={row} locale={locale}/>)}
   {tab==='all'&&meda?.has_more&&<a href={missionQuery('listings',{tab:'meda'})}>{medaCopy[locale].mine} →</a>}
   {tab==='meda'&&meda&&<nav className="meda-owner-pagination" aria-label={medaCopy[locale].mine}>{medaPage>1&&<button onClick={()=>{setMeda(null);setMedaPage(p=>p-1)}}>{medaCopy[locale].previous}</button>}{meda.has_more&&<button onClick={()=>{setMeda(null);setMedaPage(p=>p+1)}}>{medaCopy[locale].next}</button>}</nav>}
  </>}
  {!data.rows.length&&tab==='all'&&!menu&&choices}
  {!rows.length&&(tab==='job'||tab==='service')&&<section className="listing-choices">
   <p>{t(tab==='job'?'nojob':'noservice')}</p><a className="button" href={forms[tab]}>{t(actionLabels[tab])}</a>
  </section>}

 </div>;
}
