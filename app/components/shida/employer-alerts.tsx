'use client';
import {useEffect,useRef,useState} from 'react';
import {alertCopy} from '../../lib/employer-alert-copy';
import {jobSearchCopy,jobSearchPath} from '../../lib/job-search-copy';
import {jobSearchRequest,type JobAlerts,type JobSearchList,type JobSearchItem} from '../../lib/job-search-api';
import {MarketplaceImage} from './marketplace-image';
import {SpaceIcon} from './account-space-icon';
import './employer-alerts.css';

type Channel='email'|'whatsapp';
type Preference={channel:Channel;email_state:'ready'|'passkey'|'passkey_wait'|'verify_email'|'add_email'|'account_unavailable';masked_email:string|null};
type Mutation={path:string;body:{channel:Channel}|{enabled:boolean}};
export function EmployerAlerts({locale,binding,unauthorized,revision}:{locale:keyof typeof alertCopy;binding:string;unauthorized:()=>void;revision:number}){
 const c=alertCopy[locale],t=jobSearchCopy[locale],prefix=locale==='en'?'':'/'+locale;
 const [page,setPage]=useState(1),[reload,refresh]=useState(0),[data,setData]=useState<{list:JobSearchList;pref:Preference;profiles:JobAlerts}|null>(null);
 const [failed,setFailed]=useState(false),[retry,setRetry]=useState<Mutation|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const lock=useRef(false),generation=useRef(0),auth=useRef(unauthorized);
 useEffect(()=>{auth.current=unauthorized;},[unauthorized]);
 useEffect(()=>{if(!notice)return;const timer=window.setTimeout(()=>setNotice(''),5000);return()=>window.clearTimeout(timer);},[notice]);
 useEffect(()=>{const ctrl=new AbortController(),seq=++generation.current;
 const get=<T,>(path:string)=>jobSearchRequest<T>(binding,locale,path,'GET',undefined,ctrl.signal);
 Promise.all([get<JobSearchList>('following?cards=1&page='+page),get<Preference>('delivery-channel'),get<JobAlerts>('alerts')]).then(([list,pref,profiles])=>{
 if(!ctrl.signal.aborted&&seq===generation.current){if(page>1&&!list.items.length){setPage(page-1);return;}setData({list,pref,profiles});setFailed(false);}
 },e=>{if(!ctrl.signal.aborted&&seq===generation.current){if(e.status===401)auth.current();else setFailed(true);}});
 return()=>ctrl.abort();},[binding,locale,page,revision,reload]);
 async function save(action:Mutation){
 if(lock.current)return;lock.current=true;++generation.current;setBusy(true);setRetry(null);setNotice('');
 try{const result=await jobSearchRequest<Preference|JobAlerts>(binding,locale,action.path,'PUT',action.body);
 setData(previous=>{if(!previous)return previous;
 if(action.path==='delivery-channel')return {...previous,pref:result as Preference};
 if(action.path==='alerts')return {...previous,profiles:result as JobAlerts};
 return {...previous,list:{...previous.list,items:previous.list.items.map(item=>action.path==='relations/'+item.relation_ref+'/notifications'?{...item,notifications:(action.body as {enabled:boolean}).enabled}:item)}};});
 setNotice('channel' in action.body&&action.body.channel==='email'?c.emailSaved:t.updated);
 }catch(e){if((e as {status:number}).status===401)auth.current();else setRetry(action);}
 finally{lock.current=false;setBusy(false);refresh(n=>n+1);}
 }
 const changePage=(n:number)=>{setData(null);setRetry(null);setPage(n);};
 if(failed)return <div role="alert">{t.error} <button disabled={busy} onClick={()=>refresh(n=>n+1)}>{t.retry}</button></div>;
 if(!data)return <p role="status">{t.loading}</p>;
 const {list,pref,profiles}=data,state=pref.email_state;
 const setup=prefix+'/shida/space?view=settings&from=job-alerts#job-alert-'+(state==='passkey'||state==='passkey_wait'?'passkey':'login-email');
 const toggle=(item:JobSearchItem)=>save({path:'relations/'+item.relation_ref+'/notifications',body:{enabled:!item.notifications}});
 return <div className="employer-alerts">
 {retry&&<div role="alert">{t.error} <button disabled={busy} onClick={()=>void save(retry)}>{t.retry}</button></div>}{notice&&<p role="status" className="workspace-toast">{notice}</p>}
 <section className="candidate-private-panel"><h3>{c.jobs}</h3><p>{c.choose}</p>
 {!list.items.length&&<p>{c.empty} <a href={prefix+'/shida/emplois'}>{t.browse} →</a></p>}
 {list.items.map(item=><div className="employer-alert-row" key={item.relation_ref}>
 <span className="workspace-record-icon follow-tile"><MarketplaceImage src={item.logo??null} alt="" sizes="44px" fallback={Array.from(item.name||'')[0]?.toLocaleUpperCase(locale)||'•'}/></span>
 <strong>{item.name||t.unavailable}</strong><button role="switch" type="button" aria-checked={!!item.notifications} aria-label={(item.notifications?c.on:c.off)+' · '+(item.name||t.unavailable)} disabled={busy||!item.available} onClick={()=>void toggle(item)}>{item.notifications?c.on:c.off}<i aria-hidden="true"/></button></div>)}
 {(page>1||list.has_more)&&<nav className="candidate-actions">{page>1&&<button disabled={busy} onClick={()=>changePage(page-1)}>{t.previous}</button>}{list.has_more&&<button disabled={busy} onClick={()=>changePage(page+1)}>{t.next}</button>}</nav>}</section>
 <section className="candidate-private-panel"><h3 id="job-channel-title">{c.how}</h3>
 <div role="radiogroup" aria-labelledby="job-channel-title">
 {(['whatsapp','email'] as const).map(ch=><div key={ch} className="employer-alert-radio"><label><input type="radio" name="employer-alert-channel" value={ch} checked={pref.channel===ch} disabled={busy||(ch==='email'&&state!=='ready')} onChange={()=>void save({path:'delivery-channel',body:{channel:ch}})}/><SpaceIcon name={ch==='email'?'email':'whatsapp'}/>{ch==='email'?c.email:'WhatsApp'}</label>
 <div>{ch==='whatsapp'?c.phone:state==='ready'?pref.masked_email:<>{pref.channel==='email'&&<p>{c.paused}</p>}{state==='account_unavailable'?c[state]:<>{state==='passkey_wait'&&<p>{c[state]}</p>}<a href={setup}>{c[state==='passkey_wait'?'passkey':state]} →</a></>}</>}</div></div>)}</div></section>
 <details className="candidate-private-panel"><summary>{c.matching}</summary><p>{t.matchingHelp}</p>{profiles.profile_count?<><p>{profiles.enabled_count===0?t.disabled:profiles.enabled_count===profiles.profile_count?t.enabled:t.mixed}</p><button disabled={busy} onClick={()=>void save({path:'alerts',body:{enabled:profiles.enabled_count!==profiles.profile_count}})}>{profiles.enabled_count===profiles.profile_count?t.disable:t.enable}</button></>:<><p>{t.needProfile}</p><a href={jobSearchPath(locale,'profiles')}>{t.profiles}</a></>}</details>
 </div>;
}
