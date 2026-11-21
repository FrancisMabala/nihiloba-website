'use client';
import {useEffect,useId,useRef,useState,type FormEvent,type Dispatch,type SetStateAction} from 'react';
import {medaParticipationCopy} from '../../lib/meda-participation-copy';
import {medaCopy,type MedaLocale} from '../../lib/meda-copy';
import {medaIntentionCopy} from '../../lib/meda-intention-copy';

import type {MedaListing} from './meda-listing-form';
export type MedaMessage={reference:string;body:string;mine:boolean;created_at:string;event?:{kind?:string;values?:AgreementValues;handover?:{contact:string;address:string}}};
export type AgreementValues={objects:Objects;price:string;currency:string;free_transport:boolean;collection:string;destination:string;conditions:string;estimated_arrival?:string;inclusions?:string};
export type MedaProposal={reference:string;version:number;status:'proposed'|'accepted'|'declined';values:AgreementValues;can_decide:boolean;can_revise:boolean};
export type MedaEnquiry={reference:string;revision:number;status:'open'|'closed';listing:MedaListing;listing_snapshot?:MedaListing|null;listing_changed?:boolean;proposal?:MedaProposal|null;role:string;can_reply:boolean;unread:number;messages?:MedaMessage[];older?:string|null;participant_label?:string;agreement?:{version:number;values?:AgreementValues;acknowledged?:boolean;confirmed?:boolean;mutual?:boolean};objects?:Objects;handover?:{contact:string;address:string}[]};
export type MedaCall=(path:string,body?:object)=>Promise<MedaEnquiry>;
export type Objects={photos:string[];contents:string;weight_kg:string|number|null;packages:number|null;dimensions_cm:string};
export const emptyObjects:Objects={photos:[],contents:'',weight_kg:null,packages:null,dimensions_cm:''};

export function MedaPhoto({reference,binding,locale="en"}:{reference:string;binding:string;locale?:MedaLocale}){
 const [url,setUrl]=useState('');
 useEffect(()=>{const controller=new AbortController();let objectUrl='';
  void fetch(`/api/shida/personal/meda/photos/${encodeURIComponent(reference)}/`,{headers:{'x-shida-session':binding},cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();const blob=await response.blob();if(controller.signal.aborted)return;objectUrl=URL.createObjectURL(blob);setUrl(objectUrl)}).catch(()=>{});
  return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl)};
 },[reference,binding]);
 // Private bytes never pass through the image optimizer or browser storage.
 // eslint-disable-next-line @next/next/no-img-element
 return url?<img src={url} alt={medaParticipationCopy[locale].photos} width={180} height={150}/>:<span aria-hidden="true">▧</span>;
}

export function ObjectFields({locale,value,onChange,call,binding,required=false,goodsRequired=required,weightRequired=false,memberAudience=false,onBusy}:{locale:MedaLocale;value:Objects;onChange:Dispatch<SetStateAction<Objects>>;call:MedaCall;binding:string;required?:boolean;goodsRequired?:boolean;weightRequired?:boolean;memberAudience?:boolean;onBusy?:(busy:boolean)=>void}){
 const t=medaParticipationCopy[locale],[busy,setBusy]=useState(false),[error,setError]=useState(''),fileRef=useRef<HTMLInputElement>(null),pending=useRef<{file:File;key:string}|null>(null);
 const photoHeading=useId();
 async function upload(file:File){setBusy(true);onBusy?.(true);setError('');try{
   if(file.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)||value.photos.length>=5)throw Error();
   if(pending.current?.file!==file)pending.current={file,key:crypto.randomUUID()};
   const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file)});
   const result=await call('photos/',{operation_key:pending.current.key,mime:file.type,data});onChange(current=>({...current,photos:[...current.photos,result.reference]}));pending.current=null;if(fileRef.current)fileRef.current.value='';
  }catch{setError(t.error)}finally{setBusy(false);onBusy?.(false)}}
 const dimensions=value.dimensions_cm.match(/^\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*$/i);
 const volume=dimensions?dimensions.slice(1).reduce((a,b)=>a*Number(b.replace(',','.')),1)*(value.packages||1)/1000000:null;
 return <section className="meda-objects"><h3 id={photoHeading}>{t.photos}{required?' *':''}</h3><p id={`${photoHeading}-help`}>{t.photoHelp}</p><p id={`${photoHeading}-audience`}>{memberAudience?t.memberPhotos:t.privatePhotos}</p>
  <div className="meda-photos">{value.photos.map(ref=><div key={ref}><MedaPhoto locale={locale} reference={ref} binding={binding}/><button type="button" onClick={()=>onChange(current=>({...current,photos:current.photos.filter(p=>p!==ref)}))}>{t.remove}</button></div>)}</div>
  <div className="meda-photo-upload"><input ref={fileRef} type="file" aria-labelledby={photoHeading} aria-describedby={`${photoHeading}-help ${photoHeading}-audience`} accept="image/jpeg,image/png,image/webp" disabled={busy||value.photos.length>=5} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file)}}/></div>
  {busy&&<p role="status">{t.uploading}</p>}{error&&<p role="alert">{error}<button type="button" onClick={()=>{if(pending.current)void upload(pending.current.file)}}>{t.next}</button></p>}
  {goodsRequired&&<><label>{t.contents}<textarea required minLength={3} maxLength={2000} value={value.contents} onChange={e=>{const contents=e.currentTarget.value;onChange(current=>({...current,contents}))}}/></label>
  <label>{t.weight}<input required={weightRequired} placeholder={weightRequired?undefined:medaIntentionCopy[locale].unknown} type="number" min="0.001" max="1000000" step="0.001" value={value.weight_kg??''} onChange={e=>{const weight_kg=e.currentTarget.value||null;onChange(current=>({...current,weight_kg}))}}/></label>
  <label>{t.packages}<input placeholder={medaIntentionCopy[locale].unknown} type="number" min="1" max="10000" value={value.packages??''} onChange={e=>{const packages=e.currentTarget.value?Number(e.currentTarget.value):null;onChange(current=>({...current,packages}))}}/></label>
  <label>{t.dimensions}<input placeholder={medaIntentionCopy[locale].unknown} maxLength={200} value={value.dimensions_cm} onChange={e=>{const dimensions_cm=e.currentTarget.value;onChange(current=>({...current,dimensions_cm}))}}/></label>
  {volume!==null&&<p>{volume.toLocaleString(locale,{maximumFractionDigits:4})} m³ · {t.volumeHint}</p>}</>}
 </section>;
}

export function ApplicationForm({locale,call,binding,reference,category='luggage',onSaved}:{locale:MedaLocale;call:MedaCall;binding:string;reference:string;category?:MedaListing['category'];onSaved:(data:MedaEnquiry)=>void}){
 const t=medaParticipationCopy[locale],[uploading,setUploading]=useState(false),[objects,setObjects]=useState<Objects>(emptyObjects),[busy,setBusy]=useState(false),[error,setError]=useState(''),key=useRef(crypto.randomUUID());
 const active=useRef(true);
 useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');try{if(category==='airport'&&!objects.photos.length)throw Error();const data=await call(`listings/${reference}/enquiries/`,{body:objects.contents,objects,operation_key:key.current});if(active.current)onSaved(data);}catch{if(active.current)setError(t.error)}finally{if(active.current)setBusy(false)}}
 return <form onSubmit={e=>void submit(e)}><ObjectFields locale={locale} value={objects} onChange={setObjects} call={call} binding={binding} required={category==='airport'} goodsRequired weightRequired={category==='airport'} onBusy={setUploading}/>{error&&<p role="alert">{error}</p>}<button className="button button-primary" disabled={busy||uploading||(category==='airport'&&!objects.photos.length)}>{t.send}</button></form>;
}

export function MedaAgreement({locale,conversation,call,binding,onSaved=()=>{}}:{locale:MedaLocale;conversation:MedaEnquiry;call:MedaCall;binding:string;onSaved?:(data:MedaEnquiry)=>void}){
 const t=medaParticipationCopy[locale],a=conversation.agreement??{version:0},[uploading,setUploading]=useState(false),[edit,setEdit]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const initial=a.values?.objects??(conversation.objects?.photos?.length?conversation.objects:conversation.listing.details?.objects)??emptyObjects;
 const [objects,setObjects]=useState<Objects>(initial),[ack,setAck]=useState(false),[share,setShare]=useState(false),[free,setFree]=useState(Boolean(a.values?.free_transport));
 const pending=useRef<{signature:string;operation_key:string}|null>(null);
 async function action(action:string,values?:object){setBusy(true);setError('');const payload={action,revision:conversation.revision,version:a.version,...(values?{values}:{})};const signature=JSON.stringify(payload);if(pending.current?.signature!==signature)pending.current={signature,operation_key:crypto.randomUUID()};try{onSaved(await call(`enquiries/${conversation.reference}/agreement/`,{...payload,operation_key:pending.current.operation_key}));pending.current=null;setEdit(false)}catch{setError(t.error)}finally{setBusy(false)}}
 function propose(e:FormEvent<HTMLFormElement>){e.preventDefault();const data=new FormData(e.currentTarget);void action('propose',{objects,price:free?'0':data.get('price'),currency:data.get('currency'),free_transport:free,collection:data.get('collection'),destination:data.get('destination'),conditions:data.get('conditions')})}
 return <section className="meda-agreement"><h3>{t.agreement}{a.values?` · ${t.version} ${a.version}`:''}</h3>{error&&<p role="alert">{error}</p>}
 {a.values&&<><p>{a.values.objects.contents}</p>{a.values.objects.weight_kg!==null&&<p>{a.values.objects.weight_kg} kg</p>}{a.values.objects.packages!==null&&<p>{a.values.objects.packages} {t.packages}</p>}{a.values.objects.dimensions_cm&&<p>{t.dimensions}: {a.values.objects.dimensions_cm}</p>}<div className="meda-photos">{a.values.objects.photos.map((ref:string)=><MedaPhoto locale={locale} key={ref} reference={ref} binding={binding}/>)}</div><p><strong>{t.total}: {a.values.price} {a.values.currency}</strong>{a.values.free_transport?' · '+t.free:''}</p><p>{a.values.collection}</p><p>{a.values.destination}</p><p>{a.values.conditions}</p>{a.values.estimated_arrival&&<p>{medaIntentionCopy[locale].arrival}: {new Date(a.values.estimated_arrival).toLocaleString(locale)}</p>}{a.values.inclusions&&<p>{medaIntentionCopy[locale].inclusions}: {a.values.inclusions}</p>}<strong>{a.mutual?t.mutual:t.waiting}</strong></>}
 {conversation.can_reply&&<>{!conversation.proposal&&<button type="button" disabled={busy} onClick={()=>setEdit(!edit)}>{t.propose}</button>}{edit&&!conversation.proposal&&<form onSubmit={propose}>
 <ObjectFields locale={locale} value={objects} onChange={setObjects} call={call} binding={binding} required={conversation.listing.category==='airport'} goodsRequired weightRequired={conversation.listing.category==='airport'} onBusy={setUploading}/>
 <label><input type="checkbox" checked={free} onChange={e=>setFree(e.target.checked)}/>{t.free}</label>
 {!free&&<label>{t.total}<input name="price" type="number" required min="0.01" max="1000000000" step="0.01" defaultValue={a.values?.price}/></label>}
 <label>{medaCopy[locale].currency}<select name="currency" defaultValue={a.values?.currency??'USD'}>{['CDF','USD','EUR','GBP','CAD','CHF','SEK','ZAR'].map(c=><option key={c}>{c}</option>)}</select></label>
 {(['collection','destination','conditions'] as const).map(k=><label key={k}>{t[k==='collection'?'collectionTerms':k==='destination'?'destinationTerms':k]}<textarea name={k} required minLength={3} maxLength={1000} defaultValue={a.values?.[k]}/></label>)}
 <button disabled={busy||uploading||(conversation.listing.category==='airport'&&!objects.photos.length)}>{t.propose}</button></form>}
 {a.values&&!a.confirmed&&(!conversation.proposal||conversation.proposal.status==='accepted')&&<div className="meda-warning" role="region" aria-label={t.agreement}><p>{t.warning}</p><p><strong>{t.version} {a.version} · {t.total}: {a.values.price} {a.values.currency}{a.values.free_transport?` · ${t.free}`:''}</strong></p>{!a.acknowledged?<><label><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/>{t.acknowledge}</label><button disabled={!ack||busy} onClick={()=>void action('acknowledge')}>{t.acknowledge}</button></>:<button disabled={busy} onClick={()=>void action('confirm')}>{t.confirm}</button>}</div>}
 <details><summary>{t.share}</summary><p>{t.shareHelp}</p><form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);setBusy(true);void call(`enquiries/${conversation.reference}/handover/`,{revision:conversation.revision,shared_with_participant:true,contact:data.get('contact'),address:data.get('address')}).then(onSaved).catch(()=>setError(t.error)).finally(()=>setBusy(false))}}><label>{t.contact}<input name="contact" required minLength={3} maxLength={300}/></label><label>{t.address}<textarea name="address" required minLength={3} maxLength={1000}/></label><label><input type="checkbox" checked={share} onChange={e=>setShare(e.target.checked)}/>{t.share}</label><button disabled={!share||busy}>{t.share}</button></form></details></>}
 {(conversation.handover??[]).map((item,i)=><div key={i} className="meda-private"><p>{item.contact}</p><p>{item.address}</p></div>)}
 </section>;
}

export function MedaReport({locale,reference,call}:{locale:MedaLocale;reference:string;call:MedaCall}){
 const t=medaParticipationCopy[locale],[state,setState]=useState('');return <details><summary>{t.report}</summary><form onSubmit={e=>{e.preventDefault();const message=String(new FormData(e.currentTarget).get('message')??'');setState('…');void call(`reports/${reference}/`,{reason:'other',message,language:locale}).then(()=>setState(t.saved)).catch(()=>setState(t.error))}}><label>{t.reason}<textarea required name="message" minLength={3} maxLength={2000}/></label><button>{t.report}</button><p role="status">{state}</p></form></details>;
}
