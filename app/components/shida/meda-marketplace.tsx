'use client';
import {useRouter} from 'next/navigation';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {WenzeBuyerProvider,useWenzeBuyer} from './wenze-buyer';
import {MedaListingForm,type MedaListing as Listing} from './meda-listing-form';
import {ApplicationForm,MedaAgreement,MedaReport,MedaPhoto,type MedaEnquiry as Enquiry} from './meda-participation';
import {medaParticipationCopy} from '../../lib/meda-participation-copy';
import {medaCopy,type MedaLocale} from '../../lib/meda-copy';
import {MedaHero,MedaInvitation,MedaSearch,MedaResultCard,defaultMedaFilters,readMedaFilters,type MedaFilters} from './meda-discovery';
import {SpaceIcon} from './account-space-icon';
import {medaDiscoveryCopy} from '../../lib/meda-discovery-copy';
import {medaDestination} from '../../lib/meda-navigation';
import './meda.css';

type Page<T>={items:T[];page:number;has_more:boolean};
type View='browse'|'mine'|'enquiries'|'create'|'detail'|'conversation'|'review';

export function MedaMarketplace({locale,embedded=false,activity=false}:{locale:MedaLocale;embedded?:boolean;activity?:boolean}){
 return <WenzeBuyerProvider locale={locale} loginMessage={medaCopy[locale].login}><Bound locale={locale} embedded={embedded} activity={activity}/></WenzeBuyerProvider>;
}
function Bound({locale,embedded,activity}:{locale:MedaLocale;embedded:boolean;activity:boolean}){const actor=useWenzeBuyer();return <Workspace key={actor.binding??'public'} locale={locale} actor={actor} embedded={embedded} activity={activity}/>;}
function Workspace({locale,actor,embedded,activity}:{locale:MedaLocale;activity:boolean;actor:ReturnType<typeof useWenzeBuyer>;embedded:boolean}){
 const router=useRouter();
 const v=medaDiscoveryCopy[locale],t=medaCopy[locale],x=medaParticipationCopy[locale],prefix=locale==='en'?'':'/'+locale;
 const [view,setView]=useState<View>('browse'),[listings,setListings]=useState<Page<Listing>|null>(null),[enquiries,setEnquiries]=useState<Page<Enquiry>|null>(null);
 const [selected,setSelected]=useState<Listing|null>(null),[conversation,setConversation]=useState<Enquiry|null>(null),[editing,setEditing]=useState<Listing|null>(null);
 const [enquiryListing,setEnquiryListing]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[closing,setClosing]=useState(false);
 const [filters,setFilters]=useState<MedaFilters>(defaultMedaFilters);
 const alive=useRef(true),locked=useRef(false),generation=useRef(0),messageKey=useRef(crypto.randomUUID());
 const fieldError=(code:string)=>Object.hasOwn(t,code)?t[code as keyof typeof t]:t.error;
 const date=(value:string)=>new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
 function navigate(next:View,reference?:string,listingFilter?:string|null){
  const messages=next==='conversation'||next==='enquiries';
  if(next==='browse'&&embedded){router.push(`${prefix}/shida/meda/`);return;}
  if(next!=='browse'&&next!=='detail'&&(!embedded||messages!==activity)){router.push(medaDestination(locale,next,reference,listingFilter));return;}
  setView(next);setClosing(false);setNotice('');setError('');
  const q=new URLSearchParams(embedded?(activity?'view=messages&market=meda':'view=listings&tab=meda'):'');
  if(next!=='browse')q.set(embedded?'meda_view':'view',next);if(reference)q.set('ref',reference);if(listingFilter)q.set('listing',listingFilter);
  history.replaceState(null,'',location.pathname+(q.size?'?'+q:''));
 }
 async function call(path:string,body?:object,privateCall=true){
  const response=await fetch(`/api/shida/${privateCall?'personal/':''}meda/${path}`,{method:body?'POST':'GET',cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(15000),headers:{...(privateCall?{'x-shida-session':actor.binding??''}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const data=await response.json();if(!response.ok){if(response.status===401)actor.login();throw Error(data.detail??'error');}return data;
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
  await work(async()=>{const data:Enquiry=await call(`enquiries/${reference}/`);if(alive.current){setConversation(data);navigate('conversation',reference);}const last=data.messages?.at(-1);if(last)await call(`enquiries/${reference}/read/`,{message_ref:last.reference});});
 }
 useEffect(()=>{alive.current=true;const ticket=++generation.current;
  const params=new URLSearchParams(location.search),next=params.get(embedded?'meda_view':'view')??(embedded?(activity?'enquiries':'mine'):null),reference=params.get('ref');
  async function initial(){
   if(!embedded&&['mine','create','review','enquiries','conversation'].includes(next??'')){router.replace(medaDestination(locale,next!,reference??undefined,params.get('listing')));return;}
   const initialFilters=readMedaFilters(params);setFilters(initialFilters);
   if(!actor.binding){setView('browse');return;}
   if(next==='create'){setView('create');return;}
   if((next==='enquiries'||next==='mine'||next==='conversation'||next==='review')&&!actor.binding){setView(next==='review'?'mine':next);return;}
   if(next==='conversation'&&reference){await openEnquiry(reference);return;}
   if((next==='detail'||next==='review')&&reference){await work(async()=>{if(next==='detail'){const row=await call(`discovery/${reference}/`);if(alive.current&&ticket===generation.current){setSelected(row);setView(row.revision?'review':'detail');}}
    else {const row:Listing=await call(`listings/${reference}/`);if(alive.current&&ticket===generation.current){setSelected(row);setView('review');}}});return;}
   await load(next==='enquiries'||next==='mine'?next:'browse',1,params.get('listing'),initialFilters);
  }
  void initial();return()=>{alive.current=false;};
 // Each authenticated identity remounts this workspace, clearing private data.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 async function listingAction(action:'publish'|'close'){
  if(!selected)return;await work(async()=>{const row=await call(`listings/${selected.reference}/`,{action,revision:selected.revision});if(alive.current){setSelected(row);setClosing(false);setNotice(t.saved);setView('detail');}});
 }
 async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!actor.binding){actor.login();return;}const form=event.currentTarget,body=String(new FormData(form).get('message')??'');
  await work(async()=>{const path=view==='conversation'&&conversation?`enquiries/${conversation.reference}/messages/`:`listings/${selected!.reference}/enquiries/`;
   const data=await call(path,{body,operation_key:messageKey.current});messageKey.current=crypto.randomUUID();if(alive.current){setConversation(data);navigate('conversation',data.reference);setNotice(t.persisted);form.reset();}});
 }
 const privateView=view!=='browse'&&view!=='detail';
 const searched=Boolean(filters.origin||filters.destination||filters.category||filters.after||filters.side==='request');
 useEffect(()=>{if(view!=='conversation'||!conversation?.reference||!actor.binding)return;let active=true;const id=window.setInterval(()=>{if(document.hidden||locked.current)return;void call(`enquiries/${conversation.reference}/`).then(async data=>{if(active&&alive.current){setConversation(data);const last=data.messages?.at(-1);if(last)await call(`enquiries/${conversation.reference}/read/`,{message_ref:last.reference});}}).catch(()=>{});},15000);return()=>{active=false;window.clearInterval(id)};
 // The actor binding remounts the workspace and invalidates all private requests.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[view,conversation?.reference,actor.binding]);
 return <section className={`meda market-surface${embedded?' meda-embedded':''}`} lang={locale}><div className="container">
  {view==='browse'&&!embedded&&<MedaHero locale={locale}/>}
  {embedded&&<div className="meda-private-heading"><a href={activity?medaDestination(locale,'enquiries'):medaDestination(locale,'mine')}>{activity?v.backMessages:v.backListings}</a><a href={`${prefix}/shida/meda/`}>{t.browse} →</a>{view==='mine'&&<a className="button button-primary" href={medaDestination(locale,'create')}>{t.create}</a>}</div>}
  {view==='enquiries'&&<h1>{v.conversations}</h1>}
  {busy&&<p role="status">{t.loading}</p>}{error&&<div className="meda-error" role="alert">{fieldError(error)} <button type="button" disabled={busy} onClick={()=>{if(view==='conversation'&&conversation)void openEnquiry(conversation.reference);else void load(view==='enquiries'?'enquiries':privateView?'mine':'browse');}}>{t.retry}</button></div>}{notice&&<p role="status">{notice}</p>}
  {!actor.binding?<>{actor.checking?<p role="status">{t.loading}</p>:<div className="meda-access-layout"><section className="meda-panel meda-access"><SpaceIcon name="lock"/><h2>{v.access}</h2><p>{v.accessHelp}</p><div className="meda-actions"><button className="button button-primary" onClick={actor.login}>{t.signIn}</button>{process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED==='true'&&<a className="button button-secondary" href={`${prefix}/shida/register/?returnTo=${encodeURIComponent(typeof window==='undefined'?`${prefix}/shida/meda/`:location.pathname+location.search)}`}>{v.register}</a>}</div></section><MedaInvitation locale={locale}/></div>}</>:<>
  {view==='browse'&&<MedaSearch locale={locale} filters={filters} setFilters={setFilters} busy={busy} onSearch={next=>void load('browse',1,null,next)}/>}
  {(view==='browse'||view==='mine')&&<>
   {view==='browse'&&listings&&listings.items.length>0&&<h2 className="meda-results-title">{filters.side==='request'?v.requests:v.results}</h2>}
   <div className="meda-grid">{listings?.items.flatMap((row,index)=>[<MedaResultCard key={row.reference} row={row} locale={locale} busy={busy} onOpen={()=>void openListing(row)}/>,...(view==='browse'&&index===0?[<MedaInvitation key="invitation" locale={locale}/>]:[])])}</div>
   {listings?.items.length===0&&!busy&&!error&&<div className="meda-empty"><h2>{view==='mine'?t.empty:searched?v.noMatch:v.empty}</h2>{view==='browse'&&searched&&<button onClick={()=>{document.querySelector<HTMLInputElement>('.meda-route-field input')?.focus();}}>{v.editFilters}</button>}{view==='browse'&&<MedaInvitation locale={locale}/>}</div>}
   <Pagination data={listings} t={t} busy={busy} load={page=>void load(view,page)}/>
  </>}
  {view==='create'&&<MedaListingForm call={call} binding={actor.binding??''} locale={locale} initial={editing} busy={busy} onCancel={()=>void load('mine')} onSave={async(values,operation,publish)=>{await work(async()=>{const row=await call(editing?`listings/${editing.reference}/`:'listings/',editing?{action:'save',revision:editing.revision,values}:{operation_key:operation,values});if(alive.current){setSelected(row);navigate('review',row.reference);}if(publish){const published=await call(`listings/${row.reference}/`,{action:'publish',revision:row.revision});if(alive.current){setSelected(published);setNotice(t.saved);}}});}}/>}
  {(view==='detail'||view==='review')&&selected&&<div className="meda-detail"><div className="meda-panel"><button type="button" onClick={()=>void load(selected.revision?'mine':'browse')}>{t.back}</button><p className="meda-eyebrow">{t[selected.category]} · {t[selected.side]}</p><h2>{selected.title}</h2><p className="meda-route">{selected.origin_city}, {selected.origin_country} → {selected.destination_city}, {selected.destination_country}</p><dl><dt>{t.departure}</dt><dd>{date(selected.departure_at)}</dd><dt>{t.deadline}</dt><dd>{date(selected.deadline_at)}</dd><dt>{t.capacity}</dt><dd>{selected.capacity===null?x.unknown:`${selected.capacity} ${t[selected.unit]}`}</dd><dt>{t.price}</dt><dd>{selected.price===null?t.negotiable:`${selected.price} ${selected.currency} / ${(x[selected.price_basis??'total']??t[(selected.price_basis==='kg'||selected.price_basis==='m3')?selected.price_basis:'total'])}`}</dd></dl><p className="meda-description">{selected.description}</p><p>{t[selected.status]}</p><div className="meda-photos">{selected.details?.objects?.photos?.map((ref:string)=><MedaPhoto locale={locale} key={ref} reference={ref} binding={actor.binding??''}/>)}</div><p>{selected.details?.conditions}</p><ListingFacts listing={selected} locale={locale}/>
<MedaReport locale={locale} reference={selected.reference} call={call}/></div><aside className="meda-panel">
   {selected.revision?<><button onClick={()=>void load('enquiries',1,selected.reference)}>{t.enquiries}</button><button onClick={()=>{setEditing(null);navigate('create')}}>{x.replacement}</button>{selected.status==='draft'&&<><h2>{t.review}</h2><p>{t.draftNote}</p><button disabled={busy} className="button button-primary" onClick={()=>void listingAction('publish')}>{t.publish}</button><button disabled={busy} onClick={()=>{setEditing(selected);navigate('create');}}>{t.edit}</button></>}{(selected.status==='published'||selected.status==='draft'||selected.status==='expired')&&<button disabled={busy} onClick={()=>setClosing(true)}>{t.close}</button>}</>:selected.status==='published'&&<><h2>{t.enquire}</h2><p>{t.notBooking}</p>{actor.binding?(selected.side==='offer'?<ApplicationForm locale={locale} call={call} binding={actor.binding} reference={selected.reference} onSaved={data=>{setConversation(data);navigate('conversation',data.reference)}}/>:<MessageForm t={t} busy={busy} onSubmit={send} label={t.send}/>):<button disabled={actor.checking} onClick={actor.login}>{t.signIn}</button>}</>}
   {closing&&<div role="alert"><p>{t.closeNote}</p><button disabled={busy} onClick={()=>void listingAction('close')}>{t.confirmClose}</button><button disabled={busy} onClick={()=>setClosing(false)}>{t.cancel}</button></div>}
  </aside></div>}
  {view==='enquiries'&&<><div className="meda-grid">{enquiries?.items.map(item=><article className="meda-card" key={item.reference}><h2>{item.listing.title}</h2><p>{item.listing.origin_city} → {item.listing.destination_city}</p><p>{item.unread} {t.unread}</p><p>{item.can_reply?t.published:t.closed}</p><button disabled={busy} onClick={()=>void openEnquiry(item.reference)}>{t.details}</button><p>{item.participant_label}</p></article>)}</div>{enquiries?.items.length===0&&<p className="meda-empty">{t.emptyEnquiries}</p>}<Pagination data={enquiries} t={t} busy={busy} load={page=>void load('enquiries',page,enquiryListing)}/></>}
  {view==='conversation'&&conversation&&<div className="meda-conversation meda-panel"><button onClick={()=>void load('enquiries')}>{v.backMessages}</button><header className="meda-conversation-summary"><h2>{conversation.listing.origin_city} → {conversation.listing.destination_city}</h2><p>{t[conversation.listing.category]} · {t.notBooking}</p></header>{conversation.older&&<button disabled={busy} onClick={()=>void work(async()=>{const result=await call(`enquiries/${conversation.reference}/?before=${conversation.older}`);if(alive.current)setConversation({...conversation,messages:[...result.messages,...(conversation.messages??[])],older:result.older});})}>{t.older}</button>}<ol className="meda-messages">{conversation.messages?.map(message=><li key={message.reference} data-mine={message.mine}><strong>{message.mine?t.you:t.other}</strong><p>{message.body||(message.event?.kind?x[message.event.kind==='handover'?'handover_event':message.event.kind]??x.agreement:'')}</p>{message.event?.values&&<details><summary>{x.agreement}</summary><p>{message.event.values.objects.contents}</p><p>{message.event.values.objects.weight_kg} kg · {message.event.values.objects.packages} {x.packages}</p><p>{message.event.values.price} {message.event.values.currency}</p><p>{message.event.values.collection}</p><p>{message.event.values.destination}</p><p>{message.event.values.conditions}</p></details>}{message.event?.handover&&<details><summary>{x.handover_event}</summary><p>{message.event.handover.contact}</p><p>{message.event.handover.address}</p></details>}<time dateTime={message.created_at}>{date(message.created_at)}</time></li>)}</ol><MedaAgreement key={`${conversation.reference}:${(conversation.agreement as {version?:number})?.version??0}`} locale={locale} conversation={conversation} call={call} binding={actor.binding??''} onSaved={setConversation}/><MedaReport locale={locale} reference={conversation.reference} call={call}/>{conversation.can_reply?<MessageForm t={t} busy={busy} onSubmit={send} label={t.reply}/>:<p>{t.readOnly}</p>}{conversation.status==='open'&&<button disabled={busy} onClick={()=>setClosing(true)}>{t.closeEnquiry}</button>}{closing&&<div><p>{t.closeNote}</p><button disabled={busy} onClick={()=>void work(async()=>{const result=await call(`enquiries/${conversation.reference}/close/`,{revision:conversation.revision});if(alive.current){setConversation(result);setClosing(false);}})}>{t.confirmClose}</button><button disabled={busy} onClick={()=>setClosing(false)}>{t.cancel}</button></div>}</div>}
  </>}
  <footer className="meda-notes"><p className="meda-safety"><SpaceIcon name="shield"/>{v.safety}</p><details><summary>{v.explanation}</summary><p>{t.payment}</p><p>{t.safety}</p><a href={`${prefix}/shida/space/?view=support`}>{t.support}</a></details></footer>
 </div></section>;
}
type Copy=typeof medaCopy[MedaLocale];
function Pagination({data,t,busy,load}:{data:Page<unknown>|null;t:Copy;busy:boolean;load:(page:number)=>void}){return data&&<nav className="meda-pagination" aria-label={t.browse}>{data.page>1&&<button disabled={busy} onClick={()=>load(data.page-1)}>{t.previous}</button>}{data.has_more&&<button disabled={busy} onClick={()=>load(data.page+1)}>{t.next}</button>}</nav>;}
function MessageForm({t,busy,onSubmit,label}:{t:Copy;busy:boolean;onSubmit:(event:FormEvent<HTMLFormElement>)=>void;label:string}){return <form onSubmit={onSubmit}><label>{t.message}<textarea name="message" required minLength={1} maxLength={2000} rows={4} disabled={busy}/></label><p className="meda-hint">{t.privacy}</p><button disabled={busy} className="button button-primary">{label}</button></form>;}

function ListingFacts({listing,locale}:{listing:Listing;locale:MedaLocale}){
 const d=listing.details,x=medaParticipationCopy[locale];if(!d)return null;
 return <dl>{d.collection_area&&<><dt>{x.collectionArea}</dt><dd>{d.collection_area}</dd></>}{d.departure_certainty&&<><dt>{x.certainty}</dt><dd>{x[d.departure_certainty]} · {d.timezone}</dd></>}{d.arrival_from&&<><dt>{x.arrivalFrom}</dt><dd>{new Date(d.arrival_from).toLocaleString(locale)}{d.arrival_to?' – '+new Date(d.arrival_to).toLocaleString(locale):''}</dd></>}{listing.category==='airport'&&<><dt>{x.departureAirport}</dt><dd>{d.departure_airport}</dd><dt>{x.arrivalAirport}</dt><dd>{d.arrival_airport}</dd><dt>{x.flight}</dt><dd>{d.airline} {d.flight}</dd></>}{d.max_weight_kg&&<><dt>{x.maxWeight}</dt><dd>{d.max_weight_kg} kg</dd></>}{d.accepted_objects?.length? <><dt>{x.accepted}</dt><dd>{d.accepted_objects.map(k=>x[k]).join(' · ')}</dd></>:null}{d.included_services?.length?<><dt>{x.included}</dt><dd>{d.included_services.map(k=>x[k]).join(' · ')}</dd></>:null}{d.handover&&<><dt>{x.handover}</dt><dd>{x[d.handover]}</dd></>}{d.objects?.contents&&<><dt>{x.contents}</dt><dd>{d.objects.contents}</dd><dt>{x.weight}</dt><dd>{d.objects.weight_kg} kg · {d.objects.packages} {x.packages} · {d.objects.dimensions_cm}</dd></>}</dl>;
}
