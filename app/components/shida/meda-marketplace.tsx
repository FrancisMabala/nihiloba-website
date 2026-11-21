'use client';
import {useRouter} from 'next/navigation';
import {useEffect,useLayoutEffect,useRef,useState,type FormEvent} from 'react';
import {WenzeBuyerProvider,useWenzeBuyer} from './wenze-buyer';
import {MedaListingForm,type MedaListing as Listing} from './meda-listing-form';
import {ApplicationForm,MedaAgreement,MedaReport,MedaPhoto,type MedaEnquiry as Enquiry} from './meda-participation';
import {MedaProposalForm,MedaProposalReview} from './meda-transport-proposal';
import {medaParticipationCopy} from '../../lib/meda-participation-copy';
import {medaCopy,medaHistoryCopy,type MedaLocale} from '../../lib/meda-copy';
import {MedaHero,MedaInvitation,MedaSearch,MedaResultCard,defaultMedaFilters,readMedaFilters,type MedaFilters} from './meda-discovery';
import {SpaceIcon} from './account-space-icon';
import {medaDiscoveryCopy} from '../../lib/meda-discovery-copy';
import {MedaPublication} from '../../lib/meda-publication';
import {medaIntentionCopy} from '../../lib/meda-intention-copy';
import {medaDestination} from '../../lib/meda-navigation';
import {MedaConversationState} from '../../lib/meda-conversation-state';
import './meda.css';

type Page<T>={items:T[];page:number;has_more:boolean};
type View='browse'|'mine'|'enquiries'|'create'|'detail'|'conversation'|'review';

export function MedaMarketplace({locale,embedded=false,activity=false}:{locale:MedaLocale;embedded?:boolean;activity?:boolean}){
 return <WenzeBuyerProvider locale={locale} loginMessage={medaCopy[locale].login}><Bound locale={locale} embedded={embedded} activity={activity}/></WenzeBuyerProvider>;
}
function Bound({locale,embedded,activity}:{locale:MedaLocale;embedded:boolean;activity:boolean}){const actor=useWenzeBuyer();return <Workspace key={actor.binding??'public'} locale={locale} actor={actor} embedded={embedded} activity={activity}/>;}
function Workspace({locale,actor,embedded,activity}:{locale:MedaLocale;activity:boolean;actor:ReturnType<typeof useWenzeBuyer>;embedded:boolean}){
 const router=useRouter();
 const c=medaIntentionCopy[locale],v=medaDiscoveryCopy[locale],t=medaCopy[locale],x=medaParticipationCopy[locale],prefix=locale==='en'?'':'/'+locale;
 const [view,setView]=useState<View>('browse'),[listings,setListings]=useState<Page<Listing>|null>(null),[enquiries,setEnquiries]=useState<Page<Enquiry>|null>(null);
 const [selected,setSelected]=useState<Listing|null>(null),[conversation,setConversation]=useState<Enquiry|null>(null),[editing,setEditing]=useState<Listing|null>(null);
 const [enquiryListing,setEnquiryListing]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[closing,setClosing]=useState(false);
 const [filters,setFilters]=useState<MedaFilters>(defaultMedaFilters);
 const alive=useRef(true),locked=useRef(false),generation=useRef(0),messageKey=useRef(crypto.randomUUID());
 const conversationState=useRef(new MedaConversationState());
 const publication=useRef(new MedaPublication());
 const fieldError=(code:string)=>Object.hasOwn(t,code)?t[code as keyof typeof t]:t.error;
 function navigate(next:View,reference?:string,listingFilter?:string|null){
  const messages=next==='conversation'||next==='enquiries';
  conversationState.current.select(next==='conversation'&&reference?reference:null);
  if(next==='browse'&&embedded){router.push(`${prefix}/shida/meda/`);return;}
  if(next!=='browse'&&next!=='detail'&&(!embedded||messages!==activity)){router.push(medaDestination(locale,next,reference,listingFilter));return;}
  setView(next);setClosing(false);setNotice('');setError('');
  const q=new URLSearchParams(embedded?(activity?'view=messages&market=meda':'view=listings&tab=meda'):'');
  if(next!=='browse')q.set(embedded?'meda_view':'view',next);if(reference)q.set('ref',reference);if(listingFilter)q.set('listing',listingFilter);
  history.replaceState(null,'',location.pathname+(q.size?'?'+q:''));
 }
 async function call(path:string,body?:object,privateCall=true){
  const response=await fetch(`/api/shida/${privateCall?'personal/':''}meda/${path}`,{method:body?'POST':'GET',cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(15000),headers:{...(privateCall?{'x-shida-session':actor.binding??''}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const data=await response.json();if(!response.ok){if(response.status===401)actor.login();throw Object.assign(Error(data.detail??'error'),{status:response.status});}return data;
 }
 async function conversationCall(path:string,body?:object){
  // Agreement and private handover forms have their own pending state. Commit
  // their response here, with the selection captured before the request starts.
  const ticket=conversationState.current.begin();
  const data=await call(path,body);
  if(alive.current&&path.startsWith('enquiries/')){const accepted=conversationState.current.accept(ticket,data);if(accepted)setConversation(accepted);}
  return data;
 }
 function enterConversation(data:Enquiry){
  conversationState.current.select(data.reference);const accepted=conversationState.current.accept(conversationState.current.begin(),data);
  if(accepted){setConversation(accepted);navigate('conversation',data.reference);}
 }
 async function work(action:()=>Promise<void>){if(locked.current)return;locked.current=true;setBusy(true);setError('');setNotice('');try{await action();}catch(e){if(alive.current)setError(e instanceof Error?e.message:'error');}finally{locked.current=false;if(alive.current)setBusy(false);}}
 async function load(next:'browse'|'mine'|'enquiries',page=1,listingFilter:string|null=null,searchFilters=filters){
  navigate(next,undefined,listingFilter);setEnquiryListing(listingFilter);setListings(null);setEnquiries(null);if(!actor.binding)return;
  await work(async()=>{const params=new URLSearchParams({page:String(page)});if(next==='enquiries'&&listingFilter)params.set('listing',listingFilter);if(next==='browse')for(const [key,value] of Object.entries(searchFilters))if(value)params.set(key,key==='after'?new Date(value+'T00:00:00').toISOString():value);
   if(next==='browse'){const url=new URL(location.href);for(const [key,value] of Object.entries(searchFilters)){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}history.replaceState(null,'',url);}
   const data=await call(`${next==='enquiries'?'enquiries':next==='browse'?'discovery':'listings'}/?${params}`);
   if(alive.current){if(next==='enquiries')setEnquiries(data);else setListings(data);}
  });
 }
 async function openListing(row:Listing){await work(async()=>{const detail:Listing=row.revision?row:await call(`discovery/${row.reference}/`);if(alive.current){setSelected(detail);navigate(detail.revision?'review':'detail',detail.reference);}});}
 async function openEnquiry(reference:string){
  if(!actor.binding){navigate('conversation',reference);actor.login();return;}
  await work(async()=>{conversationState.current.select(reference);const ticket=conversationState.current.begin();const data:Enquiry=await call(`enquiries/${reference}/`);if(alive.current){const accepted=conversationState.current.accept(ticket,data);if(accepted){setConversation(accepted);navigate('conversation',reference);const last=data.messages?.at(-1);if(last)await call(`enquiries/${reference}/read/`,{message_ref:last.reference});}}});
 }
 useEffect(()=>{alive.current=true;const ticket=++generation.current;
  const params=new URLSearchParams(location.search),next=params.get(embedded?'meda_view':'view')??(embedded?(activity?'enquiries':'mine'):null),reference=params.get('ref');
  async function initial(){
   if(!embedded&&['mine','create','review','enquiries','conversation'].includes(next??'')){router.replace(medaDestination(locale,next!,reference??undefined,params.get('listing')));return;}
   const initialFilters=readMedaFilters(params);setFilters(initialFilters);
   if(!actor.binding){setView('browse');return;}
   if(next==='create'){if(reference){await work(async()=>{const row=await call(`listings/${reference}/`);if(alive.current&&ticket===generation.current){setEditing(row);setView('create');}});}else setView('create');return;}
   if((next==='enquiries'||next==='mine'||next==='conversation'||next==='review')&&!actor.binding){setView(next==='review'?'mine':next);return;}
   if(next==='conversation'&&reference){await openEnquiry(reference);return;}
   if((next==='detail'||next==='review')&&reference){await work(async()=>{if(next==='detail'){const row=await call(`discovery/${reference}/`);if(alive.current&&ticket===generation.current){setSelected(row);setView(row.revision?'review':'detail');}}
    else {const row:Listing=await call(`listings/${reference}/`);if(alive.current&&ticket===generation.current){setSelected(row);setView('review');}}});return;}
   await load(next==='enquiries'||next==='mine'?next:'browse',1,params.get('listing'),initialFilters);
  }
  // Effect replay can supersede this setup before its locked read completes.
  // Only the current setup may acquire the work lock; keep response guards too.
  queueMicrotask(()=>{if(alive.current&&ticket===generation.current)void initial();});return()=>{alive.current=false;};
 // Each authenticated identity remounts this workspace, clearing private data.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 async function listingAction(action:'publish'|'close'|'pause'|'resume'|'withdraw'){
  if(!selected)return;await work(async()=>{const row=await call(`listings/${selected.reference}/`,{action,revision:selected.revision});if(alive.current){setSelected(row);setClosing(false);setNotice(t.saved);setView('detail');}});
 }
 async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!actor.binding){actor.login();return;}const form=event.currentTarget,body=String(new FormData(form).get('message')??'');
  await work(async()=>{const path=view==='conversation'&&conversation?`enquiries/${conversation.reference}/messages/`:`listings/${selected!.reference}/enquiries/`;
   const ticket=conversationState.current.begin(),inConversation=view==='conversation';
   const data=await call(path,{body,operation_key:messageKey.current});messageKey.current=crypto.randomUUID();if(alive.current){if(inConversation){const accepted=conversationState.current.accept(ticket,data);if(!accepted)return;setConversation(accepted);}else enterConversation(data);setNotice(t.persisted);form.reset();}});
 }
 useEffect(()=>{if(view==='detail')document.querySelector<HTMLElement>('.meda-detail')?.focus({preventScroll:true});},[view,selected?.reference]);
 const privateView=view!=='browse'&&view!=='detail';
 const searched=Boolean(filters.origin||filters.destination||filters.category||filters.after||filters.side==='request');
 useEffect(()=>{if(view!=='conversation'||!conversation?.reference||!actor.binding)return;let active=true;const id=window.setInterval(()=>{if(document.hidden||locked.current)return;const ticket=conversationState.current.begin();void call(`enquiries/${conversation.reference}/`).then(async data=>{if(active&&alive.current){const accepted=conversationState.current.accept(ticket,data);if(!accepted)return;setConversation(accepted);const last=data.messages?.at(-1);if(last)await call(`enquiries/${conversation.reference}/read/`,{message_ref:last.reference});}}).catch(()=>{});},15000);return()=>{active=false;window.clearInterval(id)};
 // The actor binding remounts the workspace and invalidates all private requests.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[view,conversation?.reference,actor.binding]);
 return <section className={`meda market-surface${embedded?' meda-embedded':''}`} lang={locale}><div className="container">
  {view==='browse'&&!embedded&&<MedaHero locale={locale}/>}
  {embedded&&<div className="meda-private-heading"><a href={activity?medaDestination(locale,'enquiries'):medaDestination(locale,'mine')}>{activity?v.backMessages:v.backListings}</a><a href={`${prefix}/shida/meda/`}>{t.browse} →</a>{view==='mine'&&<a className="button button-primary" href={medaDestination(locale,'create')}>{t.create}</a>}</div>}
  {view==='enquiries'&&<h1>{v.conversations}</h1>}
  {busy&&<p role="status">{t.loading}</p>}{error&&<div className="meda-error" role="alert">{fieldError(error)} {view!=='create'&&<button type="button" disabled={busy} onClick={()=>{if(view==='conversation'&&conversation)void openEnquiry(conversation.reference);else void load(view==='enquiries'?'enquiries':privateView?'mine':'browse');}}>{t.retry}</button>}</div>}{notice&&<p role="status">{notice}</p>}
  {!actor.binding?<>{actor.checking?<p role="status">{t.loading}</p>:<div className="meda-access-layout"><section className="meda-panel meda-access"><SpaceIcon name="lock"/><h2>{v.access}</h2><p>{v.accessHelp}</p><div className="meda-actions"><button className="button button-primary" onClick={actor.login}>{t.signIn}</button>{process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED==='true'&&<a className="button button-secondary" href={`${prefix}/shida/register/?returnTo=${encodeURIComponent(typeof window==='undefined'?`${prefix}/shida/meda/`:location.pathname+location.search)}`}>{v.register}</a>}</div></section><MedaInvitation locale={locale}/></div>}</>:<>
  {view==='browse'&&<MedaSearch locale={locale} filters={filters} setFilters={setFilters} busy={busy} onSearch={next=>void load('browse',1,null,next)}/>}
  <div className={(view==='browse'||view==='detail')&&!embedded?'meda-list-detail'+(view==='detail'?' meda-detail-open':''):undefined}>
  {(view==='browse'||view==='mine'||(view==='detail'&&listings))&&<div className="meda-list-column">
   {view==='browse'&&listings&&listings.items.length>0&&<h2 className="meda-results-title">{filters.side==='request'?v.requests:v.results}</h2>}
   <div className="meda-results-list">{listings?.items.map(row=><MedaResultCard key={row.reference} row={row} locale={locale} busy={busy} selected={selected?.reference===row.reference} onOpen={()=>void openListing(row)}/>)}</div>
   {listings?.items.length===0&&!busy&&!error&&<div className="meda-empty"><h2>{view==='mine'?t.empty:searched?v.noMatch:v.empty}</h2>{view==='browse'&&searched&&<button onClick={()=>{document.querySelector<HTMLInputElement>('.meda-route-field input')?.focus();}}>{v.editFilters}</button>}{view==='browse'&&<MedaInvitation locale={locale}/>}</div>}
   <Pagination data={listings} t={t} busy={busy} load={page=>void load(view==='mine'?'mine':'browse',page)}/>
  </div>}
  {view==='create'&&<MedaListingForm call={call} binding={actor.binding??''} locale={locale} initial={editing} busy={busy} onCancel={()=>void load('mine')} onSave={async(values,operation,publish)=>{await work(async()=>{const result=await publication.current.save(call,editing,values,operation,publish,row=>{if(alive.current){setEditing(row);setNotice(c.savedDraft);const url=new URL(location.href);url.searchParams.set('ref',row.reference);history.replaceState(null,'',url);}});if(alive.current){setSelected(result);navigate('review',result.reference);setNotice(t.saved);}});}}/>}
  {(view==='detail'||view==='review')&&selected&&<div className="meda-detail" role="region" aria-label={t.details} tabIndex={-1}><div className="meda-panel"><button type="button" onClick={()=>void load(selected.revision?'mine':'browse')}>{t.back}</button><p className="meda-eyebrow">{t[selected.category]} · {t[selected.side]}</p><h2>{selected.title}</h2><p className="meda-route">{selected.origin_city}, {selected.origin_country} → {selected.destination_city}, {selected.destination_country}</p>{selected.details?.already_at_airport&&<strong className="meda-urgent">{c.urgent}</strong>}<p className="meda-description">{selected.description}</p><p>{selected.status==='paused'||selected.status==='withdrawn'?c[selected.status]:t[selected.status]}</p><div className="meda-photos">{selected.details?.objects?.photos?.map((ref:string)=><MedaPhoto locale={locale} key={ref} reference={ref} binding={actor.binding??''}/>)}</div><p>{selected.details?.conditions}</p><ListingFacts listing={selected} locale={locale}/>
<MedaReport locale={locale} reference={selected.reference} call={call}/></div><aside className="meda-panel">
   {selected.revision?<><button onClick={()=>void load('enquiries',1,selected.reference)}>{t.enquiries}</button><button onClick={()=>{setEditing(null);navigate('create')}}>{x.replacement}</button>{selected.status==='draft'&&<><h2>{t.review}</h2><p>{t.draftNote}</p><button disabled={busy} className="button button-primary" onClick={()=>void listingAction('publish')}>{t.publish}</button></>}{['draft','published','paused'].includes(selected.status)&&<button disabled={busy} onClick={()=>{publication.current.reset();setEditing(selected);navigate('create',selected.reference);}}>{c.edit}</button>}{selected.status==='published'&&<button disabled={busy} onClick={()=>void listingAction('pause')}>{c.pause}</button>}{selected.status==='paused'&&<button disabled={busy} onClick={()=>void listingAction('resume')}>{c.resume}</button>}{!['closed','withdrawn'].includes(selected.status)&&<button disabled={busy} onClick={()=>setClosing(true)}>{c.withdraw}</button>}</>:selected.status==='published'&&<><h2>{t.enquire}</h2><p>{t.notBooking}</p>{actor.binding?(selected.side==='offer'?<ApplicationForm key={selected.reference} category={selected.category} locale={locale} call={call} binding={actor.binding} reference={selected.reference} onSaved={enterConversation}/>:<MedaProposalForm locale={locale} listing={selected} call={call} binding={actor.binding} onSaved={enterConversation}/>):<button disabled={actor.checking} onClick={actor.login}>{t.signIn}</button>}</>}
   {closing&&<div role="alert"><p>{c.withdrawHelp}</p><button disabled={busy} onClick={()=>void listingAction('withdraw')}>{c.withdraw}</button><button disabled={busy} onClick={()=>setClosing(false)}>{t.cancel}</button></div>}
  </aside></div>}
  </div>
  {view==='enquiries'&&<><div className="meda-grid">{enquiries?.items.map(item=><article className="meda-card" key={item.reference}><h2>{item.listing.title}</h2><p>{item.listing.origin_city} → {item.listing.destination_city}</p><p>{item.unread} {t.unread}</p><p>{item.can_reply?t.published:t.closed}</p><button disabled={busy} onClick={()=>void openEnquiry(item.reference)}>{t.details}</button><p>{item.participant_label}</p></article>)}</div>{enquiries?.items.length===0&&<p className="meda-empty">{t.emptyEnquiries}</p>}<Pagination data={enquiries} t={t} busy={busy} load={page=>void load('enquiries',page,enquiryListing)}/></>}
  {view==='conversation'&&conversation&&<div className="meda-conversation meda-panel"><button onClick={()=>void load('enquiries')}>{v.backMessages}</button><header className="meda-conversation-summary"><h2>{(conversation.listing_snapshot??conversation.listing).title}</h2><p><strong>{conversation.participant_label||t.other}</strong></p><p>{(conversation.listing_snapshot??conversation.listing).origin_city} → {(conversation.listing_snapshot??conversation.listing).destination_city}</p><p>{t[(conversation.listing_snapshot??conversation.listing).category]} · {t.notBooking}</p>{conversation.listing_changed&&<p role="status">{c.changed}</p>}</header><MedaConversationHistory key={conversation.reference} conversation={conversation} locale={locale} busy={busy} onOlder={()=>void work(async()=>{const ticket=conversationState.current.begin(conversation.older!);const result=await call(`enquiries/${conversation.reference}/?before=${encodeURIComponent(conversation.older!)}`);if(alive.current){const accepted=conversationState.current.accept(ticket,result);if(accepted)setConversation(accepted);}})}/><MedaProposalReview key={`${conversation.reference}:${conversation.proposal?.version??0}`} locale={locale} conversation={conversation} call={conversationCall} binding={actor.binding??''}/><MedaAgreement key={`${conversation.reference}:${(conversation.agreement as {version?:number})?.version??0}`} locale={locale} conversation={conversation} call={conversationCall} binding={actor.binding??''}/><MedaReport locale={locale} reference={conversation.reference} call={call}/>{conversation.can_reply?<MessageForm t={t} busy={busy} onSubmit={send} label={t.reply}/>:<p>{t.readOnly}</p>}{conversation.status==='open'&&<button disabled={busy} onClick={()=>setClosing(true)}>{t.closeEnquiry}</button>}{closing&&<div><p>{t.closeNote}</p><button disabled={busy} onClick={()=>void work(async()=>{await conversationCall(`enquiries/${conversation.reference}/close/`,{revision:conversation.revision});if(alive.current)setClosing(false);})}>{t.confirmClose}</button><button disabled={busy} onClick={()=>setClosing(false)}>{t.cancel}</button></div>}</div>}
  </>}
  <footer className="meda-notes"><p className="meda-safety"><SpaceIcon name="shield"/>{v.safety}</p><details><summary>{v.explanation}</summary><p>{t.payment}</p><p>{t.safety}</p><a href={`${prefix}/shida/space/?view=support`}>{t.support}</a></details></footer>
 </div></section>;
}
type HistoryPosition={first:string|undefined;anchor:string|undefined;offset:number;top:number;following:boolean};
export function captureMedaHistoryPosition(region:HTMLDivElement):HistoryPosition{
 const rows=Array.from(region.querySelectorAll<HTMLElement>('[data-message-ref]')),top=region.getBoundingClientRect().top;
 const anchor=rows.find(row=>row.getBoundingClientRect().bottom>top);
 return {first:rows[0]?.dataset.messageRef,anchor:anchor?.dataset.messageRef,offset:anchor?anchor.getBoundingClientRect().top-top:0,top:region.scrollTop,following:region.scrollHeight-region.clientHeight-region.scrollTop<=48};
}
export function restoreMedaHistoryPosition(region:HTMLDivElement,previous:HistoryPosition|null):HistoryPosition{
 const rows=Array.from(region.querySelectorAll<HTMLElement>('[data-message-ref]'));
 // New messages follow only readers already at the end. Prepending older pages
 // preserves the visible message, even if a newer message arrived concurrently.
 if(!previous||!previous.first||(previous.following&&previous.first===rows[0]?.dataset.messageRef))region.scrollTop=region.scrollHeight;
 else {
  const anchor=rows.find(row=>row.dataset.messageRef===previous.anchor);
  region.scrollTop=anchor?region.scrollTop+anchor.getBoundingClientRect().top-region.getBoundingClientRect().top-previous.offset:previous.top;
 }
 return captureMedaHistoryPosition(region);
}
export function MedaConversationHistory({conversation,locale,busy,onOlder}:{conversation:Enquiry;locale:MedaLocale;busy:boolean;onOlder:()=>void}){
 const t=medaCopy[locale],x=medaParticipationCopy[locale],copy=medaHistoryCopy[locale],intent=medaIntentionCopy[locale];
 const region=useRef<HTMLDivElement>(null),position=useRef<HistoryPosition|null>(null);
 const date=(value:string)=>new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
 useLayoutEffect(()=>{if(region.current)position.current=restoreMedaHistoryPosition(region.current,position.current);},[conversation.messages]);
 useEffect(()=>{
  if(!region.current||typeof ResizeObserver==='undefined')return;
  const observer=new ResizeObserver(()=>{if(region.current)position.current=restoreMedaHistoryPosition(region.current,position.current);});
  observer.observe(region.current);const list=region.current.querySelector('ol');if(list)observer.observe(list);return()=>observer.disconnect();
 },[]);
 function remember(){if(region.current)position.current=captureMedaHistoryPosition(region.current);}
 function latest(){if(!region.current)return;region.current.scrollTop=region.current.scrollHeight;remember();region.current.focus({preventScroll:true});}
 return <div className="meda-history">
  <div className="meda-history-actions">{conversation.older&&<button type="button" disabled={busy} onClick={onOlder}>{t.older}</button>}<button type="button" onClick={latest}>{copy.latest}</button></div>
  <div className="meda-history-scroll" ref={region} role="region" aria-label={copy.history} tabIndex={0} onScroll={remember} onToggle={remember}>
   <ol className="meda-messages">{conversation.messages?.map(message=><li key={message.reference} data-message-ref={message.reference} data-mine={message.mine}><strong>{message.mine?t.you:t.other}</strong><p>{message.body||(message.event?.kind?message.event.kind.startsWith('proposal_')?(message.event.kind==='proposal_accept'?intent.acceptedStatus:message.event.kind==='proposal_decline'?intent.declined:intent.proposal):x[message.event.kind==='handover'?'handover_event':message.event.kind]??x.agreement:'')}</p>{message.event?.values&&<details><summary>{x.agreement}</summary><p>{message.event.values.objects.contents}</p><p>{message.event.values.objects.weight_kg} kg · {message.event.values.objects.packages} {x.packages}</p><p>{message.event.values.price} {message.event.values.currency}</p><p>{message.event.values.collection}</p><p>{message.event.values.destination}</p><p>{message.event.values.conditions}</p>{message.event.values.estimated_arrival&&<p>{intent.arrival}: {date(message.event.values.estimated_arrival)}</p>}{message.event.values.inclusions&&<p>{intent.inclusions}: {message.event.values.inclusions}</p>}</details>}{message.event?.handover&&<details><summary>{x.handover_event}</summary><p>{message.event.handover.contact}</p><p>{message.event.handover.address}</p></details>}<time dateTime={message.created_at}>{date(message.created_at)}</time></li>)}</ol>
  </div>
 </div>;
}

type Copy=typeof medaCopy[MedaLocale];
function Pagination({data,t,busy,load}:{data:Page<unknown>|null;t:Copy;busy:boolean;load:(page:number)=>void}){return data&&<nav className="meda-pagination" aria-label={t.browse}>{data.page>1&&<button disabled={busy} onClick={()=>load(data.page-1)}>{t.previous}</button>}{data.has_more&&<button disabled={busy} onClick={()=>load(data.page+1)}>{t.next}</button>}</nav>;}
function MessageForm({t,busy,onSubmit,label}:{t:Copy;busy:boolean;onSubmit:(event:FormEvent<HTMLFormElement>)=>void;label:string}){return <form onSubmit={onSubmit}><label>{t.message}<textarea name="message" required minLength={1} maxLength={2000} rows={4} disabled={busy}/></label><p className="meda-hint">{t.privacy}</p><button disabled={busy} className="button button-primary">{label}</button></form>;}

function ListingFacts({listing,locale}:{listing:Listing;locale:MedaLocale}){
 const d=listing.details??{},x=medaParticipationCopy[locale],t=medaCopy[locale],c=medaIntentionCopy[locale];
 const date=(value:string)=>new Date(value).toLocaleString(locale,{timeZone:d.timezone??'UTC'});
 const sender=listing.side==='request',container=listing.category==='container',airport=listing.category==='airport';
 return <dl>{sender&&!airport?<><dt>{c.desired}</dt><dd>{d.desired_date??c.flexible}</dd></>:<>{listing.departure_at&&<><dt>{airport?c.flightDate:t.departure}</dt><dd>{date(listing.departure_at)} · {d.timezone??'UTC'}</dd></>}{listing.deadline_at&&<><dt>{airport?c.handoverDeadline:t.deadline}</dt><dd>{date(listing.deadline_at)} · {d.timezone??'UTC'}</dd></>}</>}
 {d.neighbourhood&&<><dt>{c.neighbourhood}</dt><dd>{d.neighbourhood}</dd></>}
 {!sender&&listing.capacity!==null&&<><dt>{t.capacity}</dt><dd>{listing.capacity} {listing.unit==='m3'?'m³':'kg'}</dd></>}
 {listing.price!==null&&<><dt>{sender?c.budget:t.price}</dt><dd>{Number(listing.price)===0?c.free:`${listing.price} ${listing.currency} / ${listing.price_basis==='kg'?'kg':listing.price_basis==='m3'?'m³':listing.price_basis==='package'?x.package:t.total}`}</dd></>}
 {airport&&<><dt>{x.departureAirport}</dt><dd>{d.departure_airport_code} · {d.departure_airport}</dd>{d.arrival_airport&&<><dt>{x.arrivalAirport}</dt><dd>{d.arrival_airport}</dd></>}{(d.airline||d.flight)&&<><dt>{x.flight}</dt><dd>{d.airline} {d.flight}</dd></>}</>}
 {sender&&d.objects&&<>{d.objects.weight_kg!==null&&<><dt>{x.weight}</dt><dd>{d.objects.weight_kg} kg</dd></>}{d.objects.packages!==null&&<><dt>{x.packages}</dt><dd>{d.objects.packages}</dd></>}{d.objects.dimensions_cm&&<><dt>{x.dimensions}</dt><dd>{d.objects.dimensions_cm}</dd></>}</>}
 {container&&!sender&&<>{d.collection_area&&<><dt>{x.collectionArea}</dt><dd>{d.collection_area}</dd></>}{d.collection_from&&<><dt>{c.collectionFrom} / {c.collectionTo}</dt><dd>{d.collection_from} – {d.collection_to}</dd></>}{d.collection_mode&&<><dt>{c.collectionMode}</dt><dd>{c[d.collection_mode as keyof typeof c]}</dd></>}{d.arrival_from&&<><dt>{c.arrival}</dt><dd>{date(d.arrival_from)}{d.arrival_to?' – '+date(d.arrival_to):''}</dd></>}{d.cartons?.map((row,index)=><div key={index} className="meda-fact-group"><dt>{c.cartons} {index+1}</dt><dd>{row.length_cm} × {row.width_cm} × {row.height_cm} cm<br/><strong>{row.price} {row.currency} / {x.package}</strong><br/>{row.supplied?c.supplied:c.customerCarton}{row.max_weight_kg?` · ${x.maxWeight}: ${row.max_weight_kg} kg`:''}</dd></div>)}{d.bulky&&<><dt>{c.bulky}</dt><dd>{d.bulky.basis==='quote'?c.quote:`${d.bulky.price} ${d.bulky.currency} / ${c[d.bulky.basis]}`}</dd></>}{d.destination_mode&&<><dt>{c.destinationMode}</dt><dd>{c[d.destination_mode as keyof typeof c]}</dd></>}{d.destination_charges&&<><dt>{c.destinationCharges}</dt><dd>{d.destination_charges}</dd></>}</>}
 {!sender&&<>{d.restrictions&&<><dt>{c.restrictions}</dt><dd>{d.restrictions}</dd></>}{d.size_limits&&<><dt>{c.sizeLimits}</dt><dd>{d.size_limits}</dd></>}{d.payment_methods?.length?<><dt>{c.payments}</dt><dd>{d.payment_methods.map(k=>c[k as keyof typeof c]).join(' · ')}</dd></>:null}{d.payment_timing&&<><dt>{c.timing}</dt><dd>{d.payment_timing}</dd></>}{d.included_costs&&<><dt>{c.included}</dt><dd>{d.included_costs}</dd></>}{d.excluded_costs&&<><dt>{c.excluded}</dt><dd>{d.excluded_costs}</dd></>}</>}
 {d.accepted_objects?.length?<><dt>{x.accepted}</dt><dd>{d.accepted_objects.map(k=>x[k]).join(' · ')}</dd></>:null}{d.included_services?.length?<><dt>{x.included}</dt><dd>{d.included_services.map(k=>x[k]).join(' · ')}</dd></>:null}{d.handover&&<><dt>{x.handover}</dt><dd>{x[d.handover]}</dd></>}
 </dl>;
}
