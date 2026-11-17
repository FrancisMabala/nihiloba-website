'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {accountSupportCopy} from '../../lib/account-support-copy';
import {useHelpDrafts} from '../../lib/help-question-drafts';
import './account-support.css';
type Locale=keyof typeof accountSupportCopy;
type Category=keyof typeof accountSupportCopy.en.categories;
type Ticket={public_ref:string;category:string;message:string;status:'open'|'answered'|'closed';created_at:string;updated_at:string;latest_at?:string;preview?:string;unread?:boolean;can_reopen?:boolean};
type Detail={ticket:Ticket;messages:{id:number;sender_type:string;message:string;created_at:string}[]};
type List={tickets:Ticket[];has_more:boolean;page:number};
type LocationState={reference:string;compose:boolean;page:number;filter:'all'|'active'|'closed'};
function locationState():LocationState{
 const q=new URLSearchParams(window.location.search),ref=q.get('case')||'',page=Number(q.get('supportPage'));
 return {reference:/^SCT_[A-Za-z0-9_-]{1,100}$/.test(ref)?ref:'',compose:q.get('compose')==='1',page:Number.isInteger(page)&&page>0&&page<=10000?page:1,filter:q.get('supportStatus')==='closed'?'closed':q.get('supportStatus')==='active'?'active':'all'};
}
export function AccountSupport({locale,binding,displayName}:{locale:Locale;binding:string;displayName?:string}){
 const t=accountSupportCopy[locale],lock=useRef(false),detailSequence=useRef(0),listSequence=useRef(0),scroll=useRef(0),composing=useRef(false),replyField=useRef<HTMLTextAreaElement>(null);
 const [location,setLocation]=useState<LocationState>({reference:'',compose:false,page:1,filter:'all'}),[hydrated,setHydrated]=useState(false);
 const [list,setList]=useState<List|null>(null),[detail,setDetail]=useState<Detail|null>(null),[category,setCategory]=useState<Category>('other');
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[reading,setReading]=useState(false),[error,setError]=useState(false),[notice,setNotice]=useState('');
 const {drafts,setDrafts,ready,unavailable}=useHelpDrafts(binding);
 const draftKey=location.compose?'new':location.reference,draft=drafts[draftKey]??{message:'',key:''};
 const stateRef=useRef(location);
 const api=useCallback(async(path='',body?:object)=>{
  const response=await fetch(`/api/shida/personal/support/${path}`,{method:body?'POST':'GET',cache:'no-store',headers:{'x-shida-session':binding,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok)throw Error();return response.json();
 },[binding]);
 const load=useCallback(async()=>{
  const id=++listSequence.current,state=stateRef.current;setLoading(true);
  try{const value=await api(`?page=${state.page}&status=${state.filter}`) as List;if(id===listSequence.current)setList(value);}
  catch{if(id===listSequence.current)setError(true);}finally{if(id===listSequence.current)setLoading(false);}
 },[api]);
 const open=useCallback(async(reference:string,background=false)=>{
  const id=++detailSequence.current;if(!background)setReading(true);
  try{
   const value=await api(reference+'/') as Detail;
   if(id!==detailSequence.current||stateRef.current.reference!==reference||stateRef.current.compose)return;
   setDetail(value);
   if(document.visibilityState==='visible'){
    await api(reference+'/read/',{through:Math.max(0,...value.messages.map(m=>m.id||0))});
    if(id===detailSequence.current){setList(old=>old?{...old,tickets:old.tickets.map(item=>item.public_ref===reference?{...item,unread:false}:item)}:old);window.dispatchEvent(new Event('shida-notifications-changed'));}
   }
  }catch{if(id===detailSequence.current)setError(true);}finally{if(id===detailSequence.current)setReading(false);}
 },[api]);
 useEffect(()=>{
  const sync=()=>{detailSequence.current++;stateRef.current=locationState();setLocation(stateRef.current);setHydrated(true);};
  const timer=setTimeout(sync,0);window.addEventListener('popstate',sync);
  const invalidate=()=>{detailSequence.current++;listSequence.current++;};
  return()=>{clearTimeout(timer);invalidate();window.removeEventListener('popstate',sync);};
 },[binding]);
 useEffect(()=>{if(!hydrated)return;const timer=setTimeout(()=>void load(),0);return()=>clearTimeout(timer);},[hydrated,location.page,location.filter,load]);
 useEffect(()=>{if(!hydrated)return;const timer=setTimeout(()=>{if(location.reference&&!location.compose)void open(location.reference);else setDetail(null);},0);return()=>clearTimeout(timer);},[hydrated,location.reference,location.compose,open]);
 useEffect(()=>{
  if(!hydrated)return;
  const refresh=()=>{if(document.visibilityState==='visible'&&navigator.onLine&&!lock.current){void load();const state=stateRef.current;if(state.reference&&!state.compose)void open(state.reference,true);}};
  const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);window.addEventListener('online',refresh);
  return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);};
 },[hydrated,load,open]);
 useEffect(()=>{if(location.compose)requestAnimationFrame(()=>replyField.current?.focus());},[location.compose]);
 function navigate(change:Partial<LocationState>,replace=false){
  detailSequence.current++;setReading(false);setError(false);setNotice('');
  const next={...stateRef.current,...change};stateRef.current=next;setLocation(next);
  const url=new URL(window.location.href);url.searchParams.set('view','support');
  for(const [key,value] of Object.entries({case:next.reference,compose:next.compose?'1':'',supportPage:next.page===1?'':String(next.page),supportStatus:next.filter==='all'?'':next.filter}))if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);
  window.history[replace?'replaceState':'pushState']({},'',url);
 }
 function select(reference:string){scroll.current=window.scrollY;navigate({reference,compose:false});}
 function back(){navigate({reference:'',compose:false});requestAnimationFrame(()=>window.scrollTo({top:scroll.current}));}
 async function run(work:()=>Promise<void>){if(lock.current)return;lock.current=true;detailSequence.current++;listSequence.current++;setBusy(true);setError(false);setNotice('');try{await work();}catch{setError(true);}finally{lock.current=false;setBusy(false);}}
 async function submit(){
  if(composing.current||!draft.message.trim()||!ready)return;
  const key=draftKey,creation=location.compose,reference=location.reference;
  await run(async()=>{
   const result=await api(creation?'':reference+'/reply/',{message:draft.message,request_id:draft.key,...(creation?{category,language:locale}:{})});
   setDrafts(old=>({...old,[key]:{message:'',key:''}}));
   const ref=result.ticket.public_ref;navigate({reference:ref,compose:false},creation);
   setDetail(result.messages?result:null);setNotice(t.saved);void load();
   if(!creation)await open(ref,true);
  });
 }
 async function transition(action:'close'|'reopen'){
  if(!detail)return;await run(async()=>{setDetail(await api(detail.ticket.public_ref+'/'+action+'/',{}));await load();});
 }
 const categoryName=(value:string)=>t.categories[value as Category]??(value==='general_question'?t.general:t.categories.other);
 const timestamp=(value:string)=>new Date(value).toLocaleString(locale==='ln'?'fr-CD':locale,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
 const initials=(displayName||t.user).trim().split(/\s+/).slice(0,2).map(s=>Array.from(s)[0]).join('').toUpperCase();
 const activeDetail=detail?.ticket.public_ref===location.reference?detail:null;
 const composer=(creation:boolean)=><form className="assistance-composer" onSubmit={e=>{e.preventDefault();void submit();}}>
  {creation&&<label htmlFor="support-category">{t.category}<select id="support-category" disabled={busy} value={category} onChange={e=>setCategory(e.target.value as Category)}>{(Object.keys(t.categories) as Category[]).map(key=><option key={key} value={key}>{t.categories[key]}</option>)}</select></label>}
  <label htmlFor="support-reply">{creation?t.message:t.reply}</label>
  <textarea ref={replyField} id="support-reply" required rows={4} maxLength={4000} disabled={busy||!ready} placeholder={t.placeholder} value={draft.message} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} onChange={e=>setDrafts(old=>({...old,[draftKey]:{message:e.target.value,key:crypto.randomUUID()}}))}/>
  {unavailable&&<small>{t.draftLocal}</small>}<div className="assistance-send"><button disabled={busy||!ready||!draft.message.trim()}>{busy?t.sending:creation?t.send:t.replySend}</button></div>
 </form>;
 return <section className={'space-support assistance'+(location.reference?' has-conversation':'')+(location.compose?' is-composing':'')}>
  <header className="assistance-heading"><div><h1>{t.title}</h1><p>{t.intro}</p></div><button disabled={busy} onClick={()=>{scroll.current=window.scrollY;navigate({compose:true,reference:''});}}>{t.new}</button></header>
  {error&&<div role="alert" className="assistance-error">{t.error}<button className="assistance-secondary" disabled={busy} onClick={()=>{setError(false);void load();if(location.reference)void open(location.reference);}}>{t.refresh}</button></div>}
  {notice&&<p role="status">{notice}</p>}
  {location.compose?<div className="assistance-new"><button className="assistance-back" disabled={busy} onClick={back}>← {t.back}</button><h2>{t.new}</h2>{composer(true)}</div>:<div className="assistance-workspace">
   <aside className="assistance-list"><div className="assistance-list-heading"><h2>{t.requests}</h2><button className="assistance-secondary" aria-label={t.refresh} disabled={busy||loading} onClick={()=>void load()}>↻</button></div>
    <nav className="assistance-filters" aria-label={t.requests}>{(['all','active','closed'] as const).map(filter=><button key={filter} disabled={busy} aria-pressed={location.filter===filter} onClick={()=>navigate({filter,page:1})}>{filter==='closed'?t.resolvedFilter:t[filter]}</button>)}</nav>
    {loading&&!list?<p role="status">{t.loading}</p>:list?.tickets.length?<ul>{list.tickets.map(ticket=><li key={ticket.public_ref}><button className="assistance-row" disabled={busy} aria-current={ticket.public_ref===location.reference?'true':undefined} onClick={()=>select(ticket.public_ref)}><span className="assistance-row-top"><strong>{categoryName(ticket.category)}</strong><span className="assistance-status">{ticket.status==='closed'?t.closed:t.active}</span></span><span className="assistance-preview">{ticket.preview||ticket.message}</span><span className="assistance-row-bottom"><time dateTime={ticket.latest_at||ticket.updated_at||ticket.created_at}>{timestamp(ticket.latest_at||ticket.updated_at||ticket.created_at)}</time>{ticket.unread&&<span className="assistance-unread" aria-label={t.unread}>●</span>}</span></button></li>)}</ul>:!error&&<p>{t.empty}</p>}
    {(location.page>1||list?.has_more)&&<nav className="assistance-pagination" aria-label={t.pages}><button disabled={busy||loading||location.page===1} onClick={()=>navigate({page:location.page-1})}>{t.previous}</button><span>{location.page}</span><button disabled={busy||loading||!list?.has_more} onClick={()=>navigate({page:location.page+1})}>{t.next}</button></nav>}
   </aside>
   <div className="assistance-conversation"><button className="assistance-back" disabled={busy} onClick={back}>← {t.back}</button>
    {reading&&!activeDetail?<p role="status">{t.loading}</p>:activeDetail?<>
     <header className="assistance-ticket-heading"><div><h2>{categoryName(activeDetail.ticket.category)}</h2><p>{t.reference} {activeDetail.ticket.public_ref}</p><span className="assistance-status">{activeDetail.ticket.status==='closed'?t.closed:t.active}</span></div><details className="assistance-actions" onKeyDown={e=>{if(e.key==='Escape'){e.currentTarget.open=false;e.currentTarget.querySelector('summary')?.focus();}}}><summary aria-label={t.actions}>•••</summary><div>{activeDetail.ticket.status!=='closed'?<button disabled={busy} onClick={()=>void transition('close')}>{t.close}</button>:activeDetail.ticket.can_reopen?<button disabled={busy} onClick={()=>void transition('reopen')}>{t.reopen}</button>:<span>{t.closedHelp}</span>}</div></details></header>
     <div className="assistance-history" aria-label={t.conversation}>
      {activeDetail.messages.map(m=><article key={m.id} className={m.sender_type==='support'?'assistance-message from-support':'assistance-message'}><span className="assistance-avatar" aria-hidden="true">{m.sender_type==='support'?'S':initials}</span><div><div className="assistance-message-meta"><strong>{m.sender_type==='support'?t.support:t.user}</strong> · <time dateTime={m.created_at}>{timestamp(m.created_at)}</time></div><p>{m.message}</p></div></article>)}
     </div>
     {activeDetail.ticket.status!=='closed'?composer(false):<p className="assistance-closed">{activeDetail.ticket.can_reopen?t.reopenHelp:t.closedHelp}</p>}
    </>:!reading&&<p className="assistance-choose">{t.choose}</p>}
   </div>
  </div>}
 </section>;
}
