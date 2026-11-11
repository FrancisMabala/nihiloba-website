'use client';
import {createPortal} from 'react-dom';
import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {jobSearchCopy,jobSearchPath} from '../../lib/job-search-copy';
import {jobSearchRequest,JobSearchError,type JobRelationshipState} from '../../lib/job-search-api';
import {restorePersonalSession,PersonalSessionError,PERSONAL_SESSION_EVENT,type PersonalSession} from '../../lib/personal-session-browser';
import {LOGIN_EVENT} from '../../lib/personal-login-browser';
import {PersonalWhatsAppLogin} from './personal-whatsapp-login';
import {useConfirmation} from './confirmation-dialog';
// The detail header and its portal target mount together and keep the same DOM identity.
const subscribeToHeader = () => () => {};
type Action='save'|'follow'|'unsave'|'unfollow';
export function JobRelationshipActions({locale,jobReference,canSave,canFollow,detail=false}:{locale:keyof typeof jobSearchCopy;jobReference:string;canSave:boolean;canFollow:boolean;detail?:boolean}){
 const t=jobSearchCopy[locale];
 const [session,setSession]=useState<PersonalSession|null>(null),[state,setState]=useState<JobRelationshipState|null>(null),[phase,setPhase]=useState<'loading'|'guest'|'ready'|'error'>('loading');
 const [pending,setPending]=useState<Action|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState<{text:string;action:Action}|null>(null),[revision,setRevision]=useState(0);
 const lock=useRef(false),epoch=useRef(0),alive=useRef(false);
 const {request:confirm,confirmation}=useConfirmation(locale);
 function intent(action:Action|null){setPending(action);const url=new URL(window.location.href);if(action)url.searchParams.set('job-action',action);else url.searchParams.delete('job-action');window.history.replaceState(null,'',url);}
 useEffect(()=>{
  alive.current=true;let active=true;
  let controller:AbortController|undefined;
  async function refresh(){const current=++epoch.current;controller?.abort();controller=new AbortController();setSession(null);setState(null);setNotice(null);setPhase('loading');
   try{const user=await restorePersonalSession(controller.signal);const data=await jobSearchRequest<JobRelationshipState>(user.binding,locale,`jobs/${encodeURIComponent(jobReference)}`,'GET',undefined,controller.signal);if(alive.current&&current===epoch.current){setSession(user);setState(data);setPhase('ready');}}
   catch(e){if(alive.current&&current===epoch.current)setPhase((e instanceof PersonalSessionError||e instanceof JobSearchError)&&e.status===401?'guest':'error');}
  }
  // Starting the embedded login invalidates private state without unmounting it.
  const loginStarted=()=>{++epoch.current;controller?.abort();setSession(null);setState(null);setNotice(null);setPhase('guest');};
  const changed=()=>void refresh(),focused=()=>{if(!lock.current)changed();};
  const storage=(e:StorageEvent)=>{if(e.key===LOGIN_EVENT)loginStarted();else if(e.key===PERSONAL_SESSION_EVENT)changed();};
  void refresh().then(()=>{if(active){const value=new URLSearchParams(window.location.search).get('job-action');if(value==='save'||value==='follow'||value==='unsave'||value==='unfollow')setPending(value);}});
  window.addEventListener(PERSONAL_SESSION_EVENT,changed);window.addEventListener(LOGIN_EVENT,loginStarted);window.addEventListener('storage',storage);window.addEventListener('focus',focused);
  return()=>{active=false;alive.current=false;controller?.abort();window.removeEventListener(PERSONAL_SESSION_EVENT,changed);window.removeEventListener(LOGIN_EVENT,loginStarted);window.removeEventListener('storage',storage);window.removeEventListener('focus',focused);};
 },[jobReference,locale,revision]);
 async function apply(action:Action,enabled:boolean,user=session){
  if(lock.current||!user)return;lock.current=true;setBusy(true);setNotice(null);const current=++epoch.current;
  try{const data=await jobSearchRequest<JobRelationshipState>(user.binding,locale,`jobs/${encodeURIComponent(jobReference)}`,'PUT',{action,enabled});if(alive.current&&current===epoch.current){setState(data);setSession(user);setPhase('ready');intent(null);setNotice({action,text:action==='save'?(enabled?t.savedAction:t.removedAction):(enabled?t.followedAction:t.unfollowedAction)});return true;}}
  catch(e){if(alive.current&&current===epoch.current){if(e instanceof JobSearchError&&e.status===401){setSession(null);setState(null);setPhase('guest');intent(enabled?action:action==='save'?'unsave':'unfollow');}else setPhase('error');}}
  finally{lock.current=false;if(alive.current)setBusy(false);}
  return false;
 }
 function click(action:Action){if(phase==='guest'){intent(action);return;}if(action==='follow'&&state?.employer?.following){confirm({title:t.unfollow,description:state.employer.name,confirmLabel:t.unfollow,cancelLabel:t.cancel,onConfirm:async()=>{if(!await apply('follow',false))throw new Error('unfollow_unconfirmed');}});return;}void apply(action,action==='save'?!state?.saved:!state?.employer?.following);}
 function resume(action:Action,user=session){return apply(action==='unsave'?'save':action==='unfollow'?'follow':action,action==='save'||action==='follow',user);}
 async function authenticated(){const action=pending;if(!action)return;try{const user=await restorePersonalSession();if(alive.current)await resume(action,user);}catch{if(alive.current)setPhase('error');}}
 const [hover,setHover]=useState(false),[focus,setFocus]=useState(false);
 const mount = useSyncExternalStore(subscribeToHeader, () => detail ? document.getElementById('detail-follow-control') : null, () => null);
 useEffect(()=>{if(!notice||hover||focus)return;const timer=setTimeout(()=>setNotice(null),8000);return()=>clearTimeout(timer);},[notice,hover,focus]);
 const labels={fr:{saved:'Enregistrée',followed:'Suivi',close:'Fermer'},en:{saved:'Saved',followed:'Following',close:'Close'},ln:{saved:'Ebombami',followed:'Olandi',close:'Kanga'},sw:{saved:'Imehifadhiwa',followed:'Unafuata',close:'Funga'}}[locale];
 const followButton=(canFollow||state?.employer)&&<button type="button" className="job-action-button" disabled={busy||phase==='loading'||phase==='error'||phase==='ready'&&!state?.employer} aria-label={state?.employer?.following?t.unfollow:t.follow} aria-pressed={!!state?.employer?.following} onClick={()=>click('follow')}>{state?.employer?.following?labels.followed+" ✓":t.follow}</button>;
 return <div className="job-relationship-actions" aria-busy={busy||phase==='loading'}>
  {confirmation}
  {(canSave||state?.saved)&&<button type="button" className="job-action-button" disabled={busy||phase==='loading'||phase==='error'||phase==='ready'&&!state?.saved&&!state?.can_save} aria-label={state?.saved?t.unsave:t.save} aria-pressed={!!state?.saved} onClick={()=>click('save')}><span aria-hidden="true">⚑ </span>{state?.saved?labels.saved+" ✓":t.save}</button>}
  {mount?createPortal(followButton,mount):followButton}
  {phase==='error'&&<p role="alert">{t.error} <button type="button" onClick={()=>setRevision(v=>v+1)}>{t.retry}</button></p>}
  {notice&&<div className="job-success-toast" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocus={()=>setFocus(true)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocus(false);}}><span aria-hidden="true">✓</span><div><strong role="status">{notice.text}</strong><a href={jobSearchPath(locale,notice.action==='save'?'saved':'following')}>{notice.action==='save'?t.saved:t.following} →</a></div><button aria-label={labels.close} onClick={()=>{setNotice(null);setFocus(false);setHover(false);}}>×</button></div>}
  {pending&&<section className="job-action-login"><p>{t.signIn} · {t[pending]}</p>{!session?<PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>void authenticated()} returnTo={`${typeof window==='undefined'?'':window.location.pathname}?job-action=${pending}`}/>:phase==='ready'?<button type="button" disabled={busy} onClick={()=>void resume(pending)}>{t[pending]}</button>:null}<button type="button" disabled={busy} onClick={()=>intent(null)}>{t.cancel}</button></section>}
 </div>;
}
