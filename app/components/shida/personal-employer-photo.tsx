'use client';
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import {personalEmployerPhotoCopy} from '../../lib/personal-employer-photo-copy';
import './personal-employer-photo.css';
const policy='public-personal-employer-photo-v1',asset=/^AST_[A-Za-z0-9_-]{1,76}$/;
type View={offer_ref:string;version:string;policy:typeof policy;photo:{asset_ref:string}|null};
type Props={locale:keyof typeof personalEmployerPhotoCopy;binding:string;offerRef:string;disabled?:boolean};
export function personalEmployerPhotoView(value:unknown,offer:string):View{
 if(!value||typeof value!=='object')throw Error();const data=value as Partial<View>;
 if(data.offer_ref!==offer||!/^[a-f0-9]{64}$/.test(data.version??'')||data.policy!==policy||data.photo!==null&&!asset.test(data.photo?.asset_ref??''))throw Error();
 return {offer_ref:offer,version:data.version!,policy,photo:data.photo?{asset_ref:data.photo.asset_ref}:null};
}
export function PersonalEmployerPhoto(props:Props){return <PhotoEditor key={JSON.stringify([props.binding,props.offerRef])} {...props}/>;}
function PhotoEditor({locale,binding,offerRef,disabled=false}:Props){
 const t=personalEmployerPhotoCopy[locale],alive=useRef(false),pending=useRef(new Set<AbortController>()),lock=useRef(false);
 const [view,setView]=useState<View|null>(null),[loading,setLoading]=useState(true),[loadError,setLoadError]=useState(false),[attempt,setAttempt]=useState(0),[collapsed,setCollapsed]=useState(false);
 const [selection,setSelection]=useState<{file:File;url:string}|null>(null),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[stale,setStale]=useState(false),[message,setMessage]=useState('');
 const [preview,setPreview]=useState<{reference:string;url:string}|null>(null),[previewError,setPreviewError]=useState(false),[previewAttempt,setPreviewAttempt]=useState(0);
 const photo=view?.photo?.asset_ref,shown=preview?.reference===photo?preview?.url:null;
 useEffect(()=>{alive.current=true;const requests=pending.current;return()=>{alive.current=false;for(const controller of requests)controller.abort();requests.clear();};},[]);
 useEffect(()=>{
  const controller=new AbortController(),requests=pending.current;requests.add(controller);
  void fetch('/api/shida/personal/employer-photo/?'+new URLSearchParams({offer_ref:offerRef}),{cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding},signal:controller.signal}).then(async response=>{if(!response.ok)throw Error(String(response.status));const data=personalEmployerPhotoView(await response.json(),offerRef);if(!controller.signal.aborted){setView(data);setLoadError(false);setStale(false);setMessage('');}}).catch(error=>{if(!controller.signal.aborted){setLoadError(true);if(error instanceof Error&&error.message==='401')setMessage(t.signIn);}}).finally(()=>{requests.delete(controller);if(!controller.signal.aborted)setLoading(false);});
  return()=>{controller.abort();requests.delete(controller);};
 },[binding,offerRef,attempt,t.signIn]);
 useEffect(()=>{
  if(!photo)return;const controller=new AbortController(),requests=pending.current;requests.add(controller);let url:string|undefined;
  void fetch('/api/shida/personal/employer-photo/?'+new URLSearchParams({asset_ref:photo}),{cache:'no-store',credentials:'same-origin',headers:{'X-Shida-Session':binding},signal:controller.signal}).then(async response=>{if(!response.ok||response.headers.get('content-type')?.split(';')[0]!=='image/jpeg')throw Error();const blob=await response.blob();if(!blob.size||blob.size>5*1024*1024)throw Error();if(!controller.signal.aborted){url=URL.createObjectURL(blob);setPreview({reference:photo,url});setPreviewError(false);}}).catch(()=>{if(!controller.signal.aborted)setPreviewError(true);}).finally(()=>requests.delete(controller));
  return()=>{controller.abort();requests.delete(controller);if(url)URL.revokeObjectURL(url);};
 },[photo,binding,previewAttempt]);
 useEffect(()=>()=>{if(selection)URL.revokeObjectURL(selection.url);},[selection]);
 function refresh(){setLoading(true);setLoadError(false);setConsent(false);setAttempt(n=>n+1);}
 function choose(file?:File){setMessage('');setConsent(false);setSelection(null);if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||!file.size||file.size>5*1024*1024){setMessage(t.invalid);return;}setSelection({file,url:URL.createObjectURL(file)});}
 async function mutate(remove=false){
  if(lock.current||disabled||stale||!view||(!remove&&(!selection||!consent)))return;lock.current=true;setBusy(true);setMessage('');const controller=new AbortController();pending.current.add(controller);
  try{
   const query=remove?'':new URLSearchParams({offer_ref:offerRef,version:view.version,policy,public_consent:'true'}).toString();
   const response=await fetch('/api/shida/personal/employer-photo/'+(query?'?'+query:''),{method:remove?'DELETE':'POST',cache:'no-store',credentials:'same-origin',signal:controller.signal,headers:{'X-Shida-Session':binding,'Content-Type':remove?'application/json':selection!.file.type},body:remove?JSON.stringify({offer_ref:offerRef,version:view.version}):selection!.file});
   if(!response.ok)throw Error(String(response.status));const result=personalEmployerPhotoView(await response.json(),offerRef);
   if(!controller.signal.aborted&&alive.current){setView(result);setSelection(null);setConsent(false);setMessage(remove?t.removed:t.saved);setPreviewError(false);}
  }catch(error){if(!controller.signal.aborted&&alive.current){const code=error instanceof Error?error.message:'';if(code==='409'){setStale(true);setConsent(false);}if(code==='401'){setSelection(null);setConsent(false);setView(null);setLoadError(true);}setMessage(code==='409'?t.stale:code==='401'?t.signIn:t.error);}}
  finally{pending.current.delete(controller);lock.current=false;if(alive.current)setBusy(false);}
 }
 const unavailable=disabled||busy||loading||stale;
 return <section className="personal-employer-photo mission-card" id="personal-employer-photo" aria-busy={busy||loading}>
  <h2>{t.title}</h2>{collapsed?<button type="button" onClick={()=>setCollapsed(false)}>{t.open}</button>:<><p>{t.help}</p><p>{t.publicHelp}</p>
   {loading?<p role="status">{t.loading}</p>:loadError?<p role="alert">{message||t.loadError} {message===t.signIn?<a href={(locale==='en'?'':'/'+locale)+'/shida/space?'+new URLSearchParams({view:'listings',kind:'manage',offer:offerRef})}>{t.signInAction}</a>:<button type="button" disabled={disabled||busy} onClick={refresh}>{t.retry}</button>}</p>:view&&<>
    <div className="personal-employer-photo-previews">{photo?<figure>{shown&&<Image unoptimized src={shown} width={96} height={96} alt={t.current}/>}<figcaption>{t.current}</figcaption>{previewError&&<p role="alert">{t.previewError} <button type="button" disabled={unavailable} onClick={()=>{setPreviewError(false);setPreviewAttempt(n=>n+1);}}>{t.retry}</button></p>}</figure>:<p>{t.none}</p>}{selection&&<figure><Image unoptimized src={selection.url} width={96} height={96} alt={t.selected}/><figcaption>{t.selected}</figcaption></figure>}</div>
    <label className="personal-employer-photo-upload">{t.choose}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={unavailable} onChange={event=>{choose(event.target.files?.[0]);event.target.value='';}}/></label><small>{t.format}</small>
    <label className="personal-employer-photo-consent"><input type="checkbox" checked={consent} disabled={unavailable||!selection} onChange={event=>setConsent(event.target.checked)}/><span>{t.consent}</span></label>
    <div className="personal-employer-photo-actions"><button type="button" disabled={unavailable||!selection||!consent} onClick={()=>void mutate()}>{t.publish}</button>{photo&&<button type="button" disabled={unavailable} onClick={()=>void mutate(true)}>{t.remove}</button>}</div>
    {message&&<p role={message===t.saved||message===t.removed?'status':'alert'}>{message}</p>}{stale&&<button type="button" disabled={disabled||busy} onClick={refresh}>{t.reload}</button>}
   </>}
   <button type="button" disabled={busy} onClick={()=>{setSelection(null);setConsent(false);setCollapsed(true);}}>{t.skip}</button>
  </>}
 </section>;
}
