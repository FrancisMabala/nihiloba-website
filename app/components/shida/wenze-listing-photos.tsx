"use client";
import Image from "next/image";
import {useRef,useState} from "react";
import {useWenzeApi} from "@/app/lib/wenze-seller-api";
import {quickSellCopy} from "@/app/lib/quick-sell-copy";
import {listingCopy} from "@/app/lib/wenze-listings-copy";
import type {WenzeLocale} from "@/app/lib/wenze-copy";

type Item={public_ref:string;revision:number;photos:{photo_ref:string;url:string}[]};
export function WenzeListingPhotos({item,base,locale,onClose}:{item:Item;base:string;locale:WenzeLocale;onClose:()=>void}){
 const {request}=useWenzeApi(),t=quickSellCopy[locale],l=listingCopy[locale];
 const [current,setCurrent]=useState(item),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const lock=useRef(false);
 async function change(action:string,photo_ref?:string,file?:File){
  if(lock.current)return;lock.current=true;setBusy(true);setError("");
  try{
   let upload_ref:string|undefined;
   if(file){
    if(file.size>8*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type))throw Error();
    const content_base64=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.readAsDataURL(file);});
    const uploaded=await request(`${base}/uploads`,{method:"POST",body:JSON.stringify({target_type:"product",target_ref:current.public_ref,content_base64})}) as {upload_ref:string};upload_ref=uploaded.upload_ref;
   }
   const result=await request(`${base}/products/${encodeURIComponent(current.public_ref)}/photos`,{method:"POST",body:JSON.stringify({expected_revision:current.revision,action,photo_ref,upload_ref})}) as Item;
   setCurrent(result);
  }catch{setError(t.conflict);}finally{lock.current=false;setBusy(false);}
 }
 return <section className="qs-photo-editor" aria-label={l.photos}><h2>{l.photos}</h2><p role="status">{error}</p><p>{t.uploadHelp}</p><div className="qs-photos">{current.photos.map((p,i)=><div key={p.photo_ref}><Image unoptimized src={p.url} width={180} height={150} alt={`${t.photos} ${i+1}`}/><button disabled={busy||current.photos.length<2} onClick={()=>void change("remove",p.photo_ref)}>{t.remove}</button><button disabled={busy||i===0} onClick={()=>void change("earlier",p.photo_ref)}>{t.earlier}</button></div>)}</div><label>{t.photos}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||current.photos.length>=5} onChange={e=>{const file=e.target.files?.[0];if(file)void change("add",undefined,file);e.target.value="";}}/></label><button disabled={busy} onClick={onClose}>{l.close}</button></section>;
}
