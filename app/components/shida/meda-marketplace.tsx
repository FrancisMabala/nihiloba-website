'use client';
import {useEffect,useRef,useState,type FormEvent,type ReactNode} from 'react';
import {WenzeBuyerProvider,useWenzeBuyer} from './wenze-buyer';
import {RegistrationCountry} from './registration-country';
import {medaCopy,type MedaLocale} from '../../lib/meda-copy';
import './meda.css';

type Listing={reference:string;revision?:number;status:'draft'|'published'|'closed'|'expired';title:string;side:'offer'|'request';category:'luggage'|'airport'|'container';origin_country:string;origin_city:string;destination_country:string;destination_city:string;departure_at:string;deadline_at:string;capacity:string|number;unit:'kg'|'m3';description:string;price:string|number|null;currency:string|null;price_basis:'kg'|'m3'|'total'|null};
type Message={reference:string;body:string;mine:boolean;created_at:string};
type Enquiry={reference:string;revision:number;status:'open'|'closed';listing:Listing;role:string;can_reply:boolean;unread:number;messages?:Message[];older?:string|null};
type Page<T>={items:T[];page:number;has_more:boolean};
type View='browse'|'mine'|'enquiries'|'create'|'detail'|'conversation'|'review';
const currencies=['CDF','USD','EUR','GBP','CAD','CHF','SEK','ZAR'];

export function MedaMarketplace({locale}:{locale:MedaLocale}){
 return <WenzeBuyerProvider locale={locale} loginMessage={medaCopy[locale].login}><Bound locale={locale}/></WenzeBuyerProvider>;
}
function Bound({locale}:{locale:MedaLocale}){const actor=useWenzeBuyer();return <Workspace key={actor.binding??'public'} locale={locale} actor={actor}/>;}
function Workspace({locale,actor}:{locale:MedaLocale;actor:ReturnType<typeof useWenzeBuyer>}){
 const t=medaCopy[locale],prefix=locale==='en'?'':'/'+locale;
 const [view,setView]=useState<View>('browse'),[listings,setListings]=useState<Page<Listing>|null>(null),[enquiries,setEnquiries]=useState<Page<Enquiry>|null>(null);
 const [selected,setSelected]=useState<Listing|null>(null),[conversation,setConversation]=useState<Enquiry|null>(null),[editing,setEditing]=useState<Listing|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[closing,setClosing]=useState(false);
 const [filters,setFilters]=useState({category:'',side:'',origin:'',destination:'',after:''});
 const alive=useRef(true),locked=useRef(false),generation=useRef(0),messageKey=useRef(crypto.randomUUID());
 const fieldError=(code:string)=>Object.hasOwn(t,code)?t[code as keyof typeof t]:t.error;
 const date=(value:string)=>new Intl.DateTimeFormat(locale==='ln'?'fr':locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
 function navigate(next:View,reference?:string){setView(next);setClosing(false);setNotice('');setError('');const q=new URLSearchParams();if(next!=='browse')q.set('view',next);if(reference)q.set('ref',reference);history.replaceState(null,'',location.pathname+(q.size?'?'+q:''));}
 async function call(path:string,body?:object,privateCall=true){
  const response=await fetch(`/api/shida/${privateCall?'personal/':''}meda/${path}`,{method:body?'POST':'GET',cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(15000),headers:{...(privateCall?{'x-shida-session':actor.binding??''}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  const data=await response.json();if(!response.ok){if(response.status===401)actor.login();throw Error(data.detail??'error');}return data;
 }
 async function work(action:()=>Promise<void>){if(locked.current)return;locked.current=true;setBusy(true);setError('');setNotice('');try{await action();}catch(e){if(alive.current)setError(e instanceof Error?e.message:'error');}finally{locked.current=false;if(alive.current)setBusy(false);}}
 async function load(next:'browse'|'mine'|'enquiries',page=1){
  navigate(next);setListings(null);setEnquiries(null);if(next!=='browse'&&!actor.binding){actor.login();return;}
  await work(async()=>{const params=new URLSearchParams({page:String(page)});if(next==='browse')for(const [key,value] of Object.entries(filters))if(value)params.set(key,key==='after'?new Date(value+'T00:00:00').toISOString():value);
   const data=await call(`${next==='enquiries'?'enquiries':'listings'}/?${params}`,undefined,next!=='browse');
   if(alive.current){if(next==='enquiries')setEnquiries(data);else setListings(data);}
  });
 }
 async function openListing(row:Listing){setSelected(row);navigate(row.status==='draft'?'review':'detail',row.reference);}
 async function openEnquiry(reference:string){
  if(!actor.binding){navigate('conversation',reference);actor.login();return;}
  await work(async()=>{const data:Enquiry=await call(`enquiries/${reference}/`);if(alive.current){setConversation(data);navigate('conversation',reference);}const last=data.messages?.at(-1);if(last)await call(`enquiries/${reference}/read/`,{message_ref:last.reference});});
 }
 useEffect(()=>{alive.current=true;const ticket=++generation.current;
  const params=new URLSearchParams(location.search),next=params.get('view'),reference=params.get('ref');
  async function initial(){
   if(next==='create'){setView('create');return;}
   if((next==='enquiries'||next==='mine'||next==='conversation'||next==='review')&&!actor.binding){setView(next==='review'?'mine':next);return;}
   if(next==='conversation'&&reference){await openEnquiry(reference);return;}
   if((next==='detail'||next==='review')&&reference){await work(async()=>{if(next==='detail'){const row=await call(`listings/${reference}/`,undefined,false);if(alive.current&&ticket===generation.current){setSelected(row);setView('detail');}}
    else {const row:Listing=await call(`listings/${reference}/`);if(alive.current&&ticket===generation.current){setSelected(row);setView('review');}}});return;}
   await load(next==='enquiries'||next==='mine'?next:'browse');
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
 function card(row:Listing){return <article className="meda-card" key={row.reference}><div className="meda-card-top"><span className="meda-tag">{t[row.category]}</span><span>{t[row.side]}</span></div><h2>{row.title}</h2><p className="meda-route">{row.origin_city} <span aria-hidden="true">→</span> {row.destination_city}</p><p>{date(row.departure_at)}</p><div className="meda-card-bottom"><strong>{Number(row.capacity).toLocaleString(locale)} {t[row.unit]}</strong><span>{row.price===null?t.negotiable:`${Number(row.price).toLocaleString(locale)} ${row.currency} / ${t[row.price_basis??'total']}`}</span></div>{view==='mine'&&<p className="meda-status">{t[row.status]}</p>}<button type="button" onClick={()=>void openListing(row)} disabled={busy}>{t.details} <span aria-hidden="true">↗</span></button></article>;}
 const privateView=view!=='browse'&&view!=='detail';
 return <section className="meda" lang={locale}><div className="container">
  <header className="meda-hero"><div><p className="meda-eyebrow">SHIDA MEDA</p><h1>{t.intro}</h1><p>{t.description}</p><button type="button" className="button button-primary" disabled={busy||actor.checking} onClick={()=>{setEditing(null);navigate('create');if(!actor.binding)actor.login();}}>{t.create} <span aria-hidden="true">＋</span></button></div><div className="meda-journey" aria-hidden="true"><span>✈</span><div className="meda-journey-line"/><span>▣</span><p>{t.luggage} · {t.container}</p></div></header>
  <nav className="meda-tabs" aria-label={t.title}>{(['browse','mine','enquiries'] as const).map(tab=><button key={tab} disabled={busy} aria-current={view===tab?'page':undefined} onClick={()=>void load(tab)}>{t[tab]}</button>)}</nav>
  {busy&&<p role="status">{t.loading}</p>}{error&&<div className="meda-error" role="alert">{fieldError(error)} <button type="button" disabled={busy} onClick={()=>{if(view==='conversation'&&conversation)void openEnquiry(conversation.reference);else void load(view==='enquiries'?'enquiries':privateView?'mine':'browse');}}>{t.retry}</button></div>}{notice&&<p role="status">{notice}</p>}
  {privateView&&!actor.binding?<div className="meda-panel"><p>{t.login}</p><button disabled={actor.checking} onClick={actor.login}>{t.signIn}</button></div>:<>
  {view==='browse'&&<form className="meda-search" onSubmit={event=>{event.preventDefault();void load('browse');}}><label>{t.origin}<input value={filters.origin} maxLength={100} onChange={e=>setFilters({...filters,origin:e.target.value})}/></label><label>{t.destination}<input value={filters.destination} maxLength={100} onChange={e=>setFilters({...filters,destination:e.target.value})}/></label><label>{t.after}<input type="date" value={filters.after} onChange={e=>setFilters({...filters,after:e.target.value})}/></label><button disabled={busy} className="button button-primary">{t.search}</button><label>{t.all}<select value={filters.category} onChange={e=>setFilters({...filters,category:e.target.value})}><option value="">{t.all}</option>{(['luggage','airport','container'] as const).map(k=><option key={k} value={k}>{t[k]}</option>)}</select></label><label>{t.offer} / {t.request}<select value={filters.side} onChange={e=>setFilters({...filters,side:e.target.value})}><option value="">{t.all}</option><option value="offer">{t.offer}</option><option value="request">{t.request}</option></select></label></form>}
  {(view==='browse'||view==='mine')&&<><div className="meda-grid">{listings?.items.map(card)}</div>{listings?.items.length===0&&<div className="meda-empty"><h2>{t.empty}</h2><p>{t.description}</p></div>}<Pagination data={listings} t={t} busy={busy} load={page=>void load(view,page)}/></>}
  {view==='create'&&<ListingForm locale={locale} initial={editing} busy={busy} onCancel={()=>void load('mine')} onSave={async(values,operation)=>{await work(async()=>{const row=await call(editing?`listings/${editing.reference}/`:'listings/',editing?{action:'save',revision:editing.revision,values}:{operation_key:operation,values});if(alive.current){setSelected(row);navigate('review',row.reference);}});}}/>}
  {(view==='detail'||view==='review')&&selected&&<div className="meda-detail"><div className="meda-panel"><button type="button" onClick={()=>void load(selected.revision?'mine':'browse')}>{t.back}</button><p className="meda-eyebrow">{t[selected.category]} · {t[selected.side]}</p><h2>{selected.title}</h2><p className="meda-route">{selected.origin_city}, {selected.origin_country} → {selected.destination_city}, {selected.destination_country}</p><dl><dt>{t.departure}</dt><dd>{date(selected.departure_at)}</dd><dt>{t.deadline}</dt><dd>{date(selected.deadline_at)}</dd><dt>{t.capacity}</dt><dd>{selected.capacity} {t[selected.unit]}</dd><dt>{t.price}</dt><dd>{selected.price===null?t.negotiable:`${selected.price} ${selected.currency} / ${t[selected.price_basis??'total']}`}</dd></dl><p className="meda-description">{selected.description}</p><p>{t[selected.status]}</p></div><aside className="meda-panel">
   {selected.revision?<>{selected.status==='draft'&&<><h2>{t.review}</h2><p>{t.draftNote}</p><button disabled={busy} className="button button-primary" onClick={()=>void listingAction('publish')}>{t.publish}</button><button disabled={busy} onClick={()=>{setEditing(selected);navigate('create');}}>{t.edit}</button></>}{(selected.status==='published'||selected.status==='draft'||selected.status==='expired')&&<button disabled={busy} onClick={()=>setClosing(true)}>{t.close}</button>}</>:selected.status==='published'&&<><h2>{t.enquire}</h2><p>{t.notBooking}</p>{actor.binding?<MessageForm t={t} busy={busy} onSubmit={send} label={t.send}/>:<button disabled={actor.checking} onClick={actor.login}>{t.signIn}</button>}</>}
   {closing&&<div role="alert"><p>{t.closeNote}</p><button disabled={busy} onClick={()=>void listingAction('close')}>{t.confirmClose}</button><button disabled={busy} onClick={()=>setClosing(false)}>{t.cancel}</button></div>}
  </aside></div>}
  {view==='enquiries'&&<><div className="meda-grid">{enquiries?.items.map(item=><article className="meda-card" key={item.reference}><h2>{item.listing.title}</h2><p>{item.listing.origin_city} → {item.listing.destination_city}</p><p>{item.unread} {t.unread}</p><p>{item.can_reply?t.published:t.closed}</p><button disabled={busy} onClick={()=>void openEnquiry(item.reference)}>{t.details}</button></article>)}</div>{enquiries?.items.length===0&&<p className="meda-empty">{t.emptyEnquiries}</p>}<Pagination data={enquiries} t={t} busy={busy} load={page=>void load('enquiries',page)}/></>}
  {view==='conversation'&&conversation&&<div className="meda-conversation meda-panel"><button onClick={()=>void load('enquiries')}>{t.back}</button><h2>{conversation.listing.title}</h2><p>{t.notBooking}</p>{conversation.older&&<button disabled={busy} onClick={()=>void work(async()=>{const result=await call(`enquiries/${conversation.reference}/?before=${conversation.older}`);if(alive.current)setConversation({...conversation,messages:[...result.messages,...(conversation.messages??[])],older:result.older});})}>{t.older}</button>}<ol className="meda-messages">{conversation.messages?.map(message=><li key={message.reference} data-mine={message.mine}><strong>{message.mine?t.you:t.other}</strong><p>{message.body}</p><time dateTime={message.created_at}>{date(message.created_at)}</time></li>)}</ol>{conversation.can_reply?<MessageForm t={t} busy={busy} onSubmit={send} label={t.reply}/>:<p>{t.readOnly}</p>}{conversation.status==='open'&&<button disabled={busy} onClick={()=>setClosing(true)}>{t.closeEnquiry}</button>}{closing&&<div><p>{t.closeNote}</p><button disabled={busy} onClick={()=>void work(async()=>{const result=await call(`enquiries/${conversation.reference}/close/`,{revision:conversation.revision});if(alive.current){setConversation(result);setClosing(false);}})}>{t.confirmClose}</button><button disabled={busy} onClick={()=>setClosing(false)}>{t.cancel}</button></div>}</div>}
  </>}
  <footer className="meda-notes"><p>{t.payment}</p><p>{t.safety}</p><a href={`${prefix}/shida/space/?view=support`}>{t.support}</a></footer>
 </div></section>;
}
type Copy=typeof medaCopy[MedaLocale];
function Pagination({data,t,busy,load}:{data:Page<unknown>|null;t:Copy;busy:boolean;load:(page:number)=>void}){return data&&<nav className="meda-pagination" aria-label={t.browse}>{data.page>1&&<button disabled={busy} onClick={()=>load(data.page-1)}>{t.previous}</button>}{data.has_more&&<button disabled={busy} onClick={()=>load(data.page+1)}>{t.next}</button>}</nav>;}
function MessageForm({t,busy,onSubmit,label}:{t:Copy;busy:boolean;onSubmit:(event:FormEvent<HTMLFormElement>)=>void;label:string}){return <form onSubmit={onSubmit}><label>{t.message}<textarea name="message" required minLength={1} maxLength={2000} rows={4} disabled={busy}/></label><p className="meda-hint">{t.privacy}</p><button disabled={busy} className="button button-primary">{label}</button></form>;}
function localDate(value?:string){if(!value)return '';const date=new Date(value);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);}
function ListingForm({locale,initial,busy,onSave,onCancel}:{locale:MedaLocale;initial:Listing|null;busy:boolean;onSave:(values:object,operation:string)=>Promise<void>;onCancel:()=>void}){
 const t=medaCopy[locale],operation=useRef(crypto.randomUUID()),[category,setCategory]=useState(initial?.category??'luggage'),[unit,setUnit]=useState(initial?.unit??'kg'),[from,setFrom]=useState(initial?.origin_country??''),[to,setTo]=useState(initial?.destination_country??''),[hasPrice,setHasPrice]=useState(Boolean(initial?.price!=null));
 function field(label:string,element:ReactNode){return <label>{label}{element}</label>;}
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const f=new FormData(event.currentTarget),price=String(f.get('price')??'').trim();await onSave({title:f.get('title'),side:f.get('side'),category,origin_country:from,origin_city:f.get('origin_city'),destination_country:to,destination_city:f.get('destination_city'),departure_at:new Date(String(f.get('departure_at'))).toISOString(),deadline_at:new Date(String(f.get('deadline_at'))).toISOString(),capacity:f.get('capacity'),unit,description:f.get('description'),price:price||null,currency:price?f.get('currency'):null,price_basis:price?f.get('price_basis'):null},operation.current);}
 return <form className="meda-panel meda-form" onSubmit={event=>void submit(event)}><h2>{initial?t.edit:t.create}</h2><p>{t.draftNote}</p><fieldset disabled={busy}>
 <div className="meda-form-grid">{field(t.offer+' / '+t.request,<select name="side" defaultValue={initial?.side??'offer'}><option value="offer">{t.offer}</option><option value="request">{t.request}</option></select>)}{field(t.luggage+' / '+t.container,<select value={category} onChange={e=>{const value=e.target.value as Listing['category'];setCategory(value);if(value!=='container')setUnit('kg');}}>{(['luggage','airport','container'] as const).map(k=><option value={k} key={k}>{t[k]}</option>)}</select>)}</div>
 {field(t.titleLabel,<input name="title" minLength={5} maxLength={120} required defaultValue={initial?.title}/>)}
 <div className="meda-form-grid"><div><label htmlFor="meda-from-country">{t.fromCountry}</label><RegistrationCountry id="meda-from-country" value={from} onChange={setFrom} locale={locale} required/></div>{field(t.fromCity,<input name="origin_city" minLength={2} maxLength={100} required defaultValue={initial?.origin_city}/>)}<div><label htmlFor="meda-to-country">{t.toCountry}</label><RegistrationCountry id="meda-to-country" value={to} onChange={setTo} locale={locale} required/></div>{field(t.toCity,<input name="destination_city" minLength={2} maxLength={100} required defaultValue={initial?.destination_city}/>)}
 {field(t.departure,<input type="datetime-local" name="departure_at" required defaultValue={localDate(initial?.departure_at)}/>)}{field(t.deadline,<input type="datetime-local" name="deadline_at" required defaultValue={localDate(initial?.deadline_at)}/>)}
 {field(t.capacity,<input name="capacity" type="number" min="0.001" max="1000000" step="0.001" required defaultValue={initial?.capacity}/>)}{field(t.unit,<select value={unit} onChange={e=>setUnit(e.target.value as 'kg'|'m3')}><option value="kg">kg</option>{category==='container'&&<option value="m3">m³</option>}</select>)}</div><p className="meda-hint">{t.timezone}</p>
 {field(t.goods,<textarea name="description" minLength={10} maxLength={2000} required rows={4} defaultValue={initial?.description}/>)}<p className="meda-hint">{t.privacy}</p>
 <div className="meda-form-grid">{field(t.price,<input name="price" type="number" min="0" max="1000000000" step="0.01" defaultValue={initial?.price??''} onChange={e=>setHasPrice(e.target.value!=='')}/>)}{hasPrice&&<>{field(t.currency,<select name="currency" defaultValue={initial?.currency??'USD'}>{currencies.map(c=><option key={c}>{c}</option>)}</select>)}{field(t.basis,<select name="price_basis" defaultValue={initial?.price_basis??'total'}><option value="total">{t.total}</option><option value={unit}>{t[unit]}</option></select>)}</>}</div>
 <div className="meda-actions"><button className="button button-primary">{t.save}</button><button type="button" onClick={onCancel}>{t.cancel}</button></div></fieldset></form>;
}
