"use client";
import Link from 'next/link';
import {createContext,useContext,useEffect,useRef,useState,useCallback,type ReactNode} from 'react';
import type {Locale} from '../../lib/i18n';
import {restorePersonalSession,PERSONAL_SESSION_EVENT,type PersonalSession,PersonalSessionError} from '../../lib/personal-session-browser';
import {PersonalWhatsAppLogin} from './personal-whatsapp-login';
import {restaurantReviewCopy,restaurantReviewReasons} from '../../lib/restaurant-review-copy';

const words={en:{save:'♡ Favourite',saved:'♥ Saved',follow:'Follow boutique',following:'Following',favourites:'My favourites',empty:'No favourites yet.',login:'Sign in to save favourites, follow boutiques or review your purchases.',close:'Close',failed:'This action is unavailable. Please try again.',check:'Checking…',eligible:'Only buyers with a completed SHIDA order from this boutique can leave a review.',shopResponse:'Boutique response',signIn:'Sign in',refresh:'Refresh'},fr:{save:'♡ Favori',saved:'♥ Enregistré',follow:'Suivre la boutique',following:'Abonné',favourites:'Mes favoris',empty:'Aucun favori pour le moment.',login:'Connectez-vous pour enregistrer des favoris, suivre des boutiques ou évaluer vos achats.',close:'Fermer',failed:'Cette action est indisponible. Réessayez.',check:'Vérification…',eligible:'Seuls les acheteurs ayant une commande SHIDA terminée dans cette boutique peuvent laisser un avis.',shopResponse:'Réponse de la boutique',signIn:'Se connecter',refresh:'Actualiser'}};
type Buyer={binding:string|null;checking:boolean;login:()=>void};
const Context=createContext<Buyer>({binding:null,checking:false,login:()=>{}});
export function useWenzeBuyer(){return useContext(Context);}
export async function buyerRequest(path:string,binding:string,method='GET',body?:unknown){
 const response=await fetch(`/api/shida/personal/wenze-buyer/${path}/`,{method,credentials:'same-origin',cache:'no-store',headers:{'X-Shida-Session':binding,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 if(!response.ok)throw Error(String(response.status));return response.json();
}
export function WenzeBuyerProvider({locale,children}:{locale:Locale;children:ReactNode}){
 const [session,setSession]=useState<PersonalSession|null>(null),[checking,setChecking]=useState(true),[open,setOpen]=useState(false),[failed,setFailed]=useState(false);
 const loginPanel=useRef<HTMLElement>(null),t=words[locale];
 useEffect(()=>{if(open){loginPanel.current?.scrollIntoView({block:"center",behavior:"smooth"});loginPanel.current?.focus();}},[open]);
 useEffect(()=>{let alive=true,epoch=0;let request:AbortController|null=null;
  async function check(clear=false){const ticket=++epoch;request?.abort();const controller=new AbortController();request=controller;if(clear)setSession(null);setChecking(true);const timer=setTimeout(()=>controller.abort(),12000);
   try{const value=await restorePersonalSession(controller.signal);if(alive&&ticket===epoch){setSession(value);setFailed(false);setOpen(false);}}
   catch(error){if(alive&&ticket===epoch){setSession(null);setFailed(!(error instanceof PersonalSessionError&&[401,403].includes(error.status)));}}
   finally{clearTimeout(timer);if(alive&&ticket===epoch)setChecking(false);}
  }
  const changed=()=>void check(true),focus=()=>void check(),storage=(e:StorageEvent)=>{if(e.key===PERSONAL_SESSION_EVENT)changed();};
  void check();window.addEventListener(PERSONAL_SESSION_EVENT,changed);window.addEventListener('focus',focus);window.addEventListener('storage',storage);
  return()=>{alive=false;++epoch;request?.abort();window.removeEventListener(PERSONAL_SESSION_EVENT,changed);window.removeEventListener('focus',focus);window.removeEventListener('storage',storage);};
 },[]);
 return <Context.Provider value={{binding:session?.binding??null,checking,login:()=>setOpen(true)}}>{open&&<section ref={loginPanel} tabIndex={-1} className="wzp-buyer-login container" role="region" aria-label={t.signIn}><button className="wzp-close" onClick={()=>setOpen(false)}>{t.close}</button><p>{t.login}</p>{failed&&<p role="alert">{t.failed}</p>}<PersonalWhatsAppLogin locale={locale} onAuthenticated={()=>{window.dispatchEvent(new Event(PERSONAL_SESSION_EVENT));}}/></section>}{children}</Context.Provider>;
}
export function WenzeRelation({locale,reference,kind,follow=false,iconOnly=false}:{locale:Locale;reference:string;kind:'wenze_store'|'wenze_product';follow?:boolean;iconOnly?:boolean}){
 const buyer=useContext(Context),t=words[locale];
 return <Relation key={`${buyer.binding}:${reference}`} buyer={buyer} t={t} reference={reference} kind={kind} follow={follow} iconOnly={iconOnly}/>;
}
function Relation({buyer,t,reference,kind,follow,iconOnly}:{buyer:Buyer;t:typeof words.en|typeof words.fr;reference:string;kind:string;follow:boolean;iconOnly:boolean}){
 const [enabled,setEnabled]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false),alive=useRef(true);
 const path=`relations/${kind}/${reference}`,relation=follow?'following':'saved';
 useEffect(()=>{alive.current=true;if(buyer.binding)void buyerRequest(path,buyer.binding).then(v=>{if(alive.current){setEnabled(v[relation]);setReady(true);}}).catch(()=>{if(alive.current)setError(true);});return()=>{alive.current=false;};},[buyer.binding,path,relation]);
 async function toggle(){if(!buyer.binding){buyer.login();return;}if(busy)return;setBusy(true);setError(false);try{if(!ready){const value=await buyerRequest(path,buyer.binding);if(alive.current){setEnabled(value[relation]);setReady(true);}return;}const value=await buyerRequest(path,buyer.binding,'PUT',{relation,enabled:!enabled});if(alive.current)setEnabled(value.enabled);}catch{if(alive.current)setError(true);}finally{if(alive.current)setBusy(false);}}
 return <div className={iconOnly?"wzp-relation wzp-relation-icon":"wzp-relation"}><button type="button" aria-pressed={ready?enabled:undefined} disabled={buyer.checking||busy||Boolean(buyer.binding&&!ready&&!error)} onClick={()=>void toggle()}>{iconOnly?<><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill={enabled?"currentColor":"none"} stroke="currentColor" strokeWidth="1.5"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg><span className="wzp-visually-hidden">{enabled?t.saved:t.save}</span></>:follow?(enabled?t.following:t.follow):(enabled?t.saved:t.save)}</button>{error&&<small role="alert">{t.failed}</small>}</div>;
}
export function WenzeFavourites({locale}:{locale:Locale}){
 const buyer=useContext(Context);return <Favourites key={buyer.binding??'guest'} buyer={buyer} locale={locale}/>;
}
function Favourites({buyer,locale}:{buyer:Buyer;locale:Locale}){
 const [open,setOpen]=useState(false),[items,setItems]=useState<{kind:string;reference:string;name:string}[]|null>(null),[error,setError]=useState(false);const t=words[locale];
 const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 async function show(){if(!buyer.binding){buyer.login();return;}setOpen(true);setItems(null);setError(false);try{const data=await buyerRequest('saved',buyer.binding);if(alive.current)setItems(data.items);}catch{if(alive.current)setError(true);}}
 return <div className="wzp-favourites"><button disabled={buyer.checking} onClick={()=>void show()}>{t.favourites}</button>{open&&<section><button className="wzp-close" onClick={()=>setOpen(false)}>{t.close}</button><h2>{t.favourites}</h2>{error?<p role="alert">{t.failed}</p>:!items?<p role="status">{t.check}</p>:items.length?<ul>{items.map(item=><li key={`${item.kind}:${item.reference}`}><Link href={`${locale==='fr'?'/fr':''}/shida/wenze/${item.kind==='wenze_product'?(locale==='fr'?'produits/':'products/'):''}${encodeURIComponent(item.reference)}`}>{item.name}</Link><WenzeRelation locale={locale} kind={item.kind as 'wenze_product'|'wenze_store'} reference={item.reference}/></li>)}</ul>:<p>{t.empty}</p>}</section>}</div>;
}
type Review={review_ref:string;rating:number;comment:string|null;seller_response?:string|null;revision:number;status:string;verified_experience:boolean};
export function WenzeReviews({locale,storeRef}:{locale:Locale;storeRef:string}){
 const buyer=useContext(Context);return <Reviews key={`${buyer.binding}:${storeRef}`} buyer={buyer} locale={locale} storeRef={storeRef}/>;
}
function Reviews({buyer,locale,storeRef}:{buyer:Buyer;locale:Locale;storeRef:string}){
 const t=restaurantReviewCopy[locale],w=words[locale],base=`stores/${storeRef}`;
 const [data,setData]=useState<{items:Review[];total:number;summary:{average:number|null;count:number}}|null>(null),[page,setPage]=useState(1),[eligibility,setEligibility]=useState<{eligible:boolean;existing_review:Review|null}|null>(null),[rating,setRating]=useState(5),[comment,setComment]=useState(''),[error,setError]=useState(false),[busy,setBusy]=useState(false),[report,setReport]=useState<string|null>(null),[reason,setReason]=useState('inaccurate'),[notice,setNotice]=useState('');
 const alive=useRef(true),loadEpoch=useRef(0),own=eligibility?.existing_review;
 const load=useCallback(async()=>{const ticket=++loadEpoch.current;try{const response=await fetch(`/api/shida/wenze-reviews/${storeRef}/?page=${page}`,{cache:'no-store'});if(!response.ok)throw Error();const value=await response.json();if(alive.current&&ticket===loadEpoch.current){setData(value);setError(false);}}catch{if(alive.current&&ticket===loadEpoch.current){setError(true);setData(null);}}},[storeRef,page]);
 const privateLoad=useCallback(async()=>{if(!buyer.binding)return;try{const value=await buyerRequest(`${base}/review-eligibility`,buyer.binding);if(alive.current){setEligibility(value);setRating(value.existing_review?.rating??5);setComment(value.existing_review?.comment??'');}}catch{if(alive.current)setEligibility(null);}},[buyer.binding,base]);
 // These loaders update state only after a network response or failure.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{alive.current=true;void privateLoad();return()=>{alive.current=false;};},[privateLoad]);
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{void load();},[load]);
 async function act(path:string,method:string,body:unknown){if(!buyer.binding){buyer.login();return;}setBusy(true);setNotice('');try{await buyerRequest(path,buyer.binding,method,body);if(alive.current){if(path.endsWith('/report')){setReport(null);setNotice(t.reportSaved);}else{await privateLoad();await load();}}}catch{if(alive.current)setNotice(w.failed);}finally{if(alive.current)setBusy(false);}}
 return <section id="reviews" className="wzp-reviews" aria-labelledby="wenze-reviews"><h2 id="wenze-reviews">{t.reviews}</h2>{error?<p role="alert">{t.failed} <button onClick={()=>void load()}>{w.refresh}</button></p>:!data?<p role="status">{w.check}</p>:<><p>{data.summary.count?`${data.summary.average} ★ · ${data.summary.count}`:t.noReviews}</p>{data.items.map(item=><article key={item.review_ref}><strong>{item.rating} ★</strong> · {t.reviewer}{item.verified_experience&&<span> · {t.verified}</span>}{item.comment&&<p>{item.comment}</p>}{item.seller_response&&<p>{w.shopResponse}: {item.seller_response}</p>}<button onClick={()=>{if(!buyer.binding)buyer.login();else setReport(item.review_ref);}}>{t.report}</button></article>)}{data.total>5&&<nav><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>{t.previous}</button><span>{page}</span><button disabled={page*5>=data.total} onClick={()=>setPage(p=>p+1)}>{t.next}</button></nav>}</>}
 <p>{w.eligible}</p>{!buyer.binding&&!buyer.checking&&<button onClick={buyer.login}>{w.signIn}</button>}
 {eligibility?.eligible&&own?.status!=='hidden'&&<form onSubmit={e=>{e.preventDefault();void act(`${base}/review`,'PUT',{rating,comment:comment.trim()||null,expected_revision:own?.revision??null});}}><h3>{own?t.update:t.leave}</h3><label>{t.rating}<select value={rating} onChange={e=>setRating(Number(e.target.value))}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} ★</option>)}</select></label><label>{t.comment}<textarea maxLength={2000} value={comment} onChange={e=>setComment(e.target.value)}/></label><button disabled={busy}>{t.publish}</button>{own?.status==='visible'&&<button type="button" disabled={busy} onClick={()=>void act(`${base}/review/withdraw`,'POST',{expected_revision:own.revision})}>{t.withdraw}</button>}</form>}
 {report&&<form onSubmit={e=>{e.preventDefault();void act(`${base}/reviews/${report}/report`,'POST',{reason});}}><label>{t.report}<select value={reason} onChange={e=>setReason(e.target.value)}>{Object.entries(restaurantReviewReasons[locale]).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><button disabled={busy}>{t.report}</button><button type="button" onClick={()=>setReport(null)}>{w.close}</button></form>}{notice&&<p role="status">{notice}</p>}
 </section>;
}
