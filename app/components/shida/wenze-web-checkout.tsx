"use client";
import {useEffect,useRef,useState} from "react";
import type {Locale} from "../../lib/i18n";
import type {CommerceCart,CommerceSellerGroup} from "../../types/shida-commerce";
import {WenzeBuyerProvider,useWenzeBuyer} from "./wenze-buyer";
const copy={
 en:{title:"Order on the website",pickup:"Pickup",delivery:"Delivery",city:"City",commune:"Commune",address:"Delivery address",save:"Save choice",choose:"Choose pickup or delivery",login:"Sign in to place your order",confirm:"Place order",busy:"Please wait…",error:"We couldn’t complete this step. Refresh your cart and try again.",note:"Placing an order does not make a payment. Arrange payment with the seller.",pending:"Delivery price is still to be agreed with the seller.",saved:"Choice saved"},
 fr:{title:"Commander sur le site",pickup:"Retrait",delivery:"Livraison",city:"Ville",commune:"Commune",address:"Adresse de livraison",save:"Enregistrer le choix",choose:"Choisissez le retrait ou la livraison",login:"Connectez-vous pour commander",confirm:"Passer commande",busy:"Veuillez patienter…",error:"Impossible de terminer cette étape. Actualisez votre panier et réessayez.",note:"Passer commande ne déclenche aucun paiement. Convenez du paiement avec le vendeur.",pending:"Le prix de livraison reste à convenir avec le vendeur.",saved:"Choix enregistré"}
};
async function send(path:string,method:string,body:unknown,binding?:string){
 const r=await fetch(`/api/shida/cart/${path}/`,{method,credentials:"same-origin",cache:"no-store",signal:AbortSignal.timeout(15000),headers:{"Content-Type":"application/json",...(binding?{"X-Shida-Session":binding}:{})},body:JSON.stringify(body)});
 if(!r.ok)throw Object.assign(new Error(),{status:r.status});return r.json();
}
export function WenzeWebCheckout(props:{locale:Locale;cart:CommerceCart;replace:(cart:CommerceCart)=>void;onComplete:(reference:string,whatsapp:string|null)=>void;disabled:boolean;onBusy:(value:boolean)=>void;onConflict:()=>Promise<void>}){
 return <WenzeBuyerProvider locale={props.locale} loginMessage={copy[props.locale].login}><Checkout {...props}/></WenzeBuyerProvider>;
}
function Checkout({locale,cart,replace,onComplete,disabled,onBusy,onConflict}:{locale:Locale;cart:CommerceCart;replace:(cart:CommerceCart)=>void;onComplete:(reference:string,whatsapp:string|null)=>void;disabled:boolean;onBusy:(value:boolean)=>void;onConflict:()=>Promise<void>}){
 const buyer=useWenzeBuyer(),t=copy[locale],key=useRef<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 const [editing,setEditing]=useState<string[]>(cart.seller_groups.map(g=>g.store_reference));
 useEffect(()=>{onBusy(busy);return()=>onBusy(false);},[busy,onBusy]);
 const alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const activeBinding=useRef(buyer.binding);
 useEffect(()=>{activeBinding.current=buyer.binding;},[buyer.binding]);
 const chosen=cart.seller_groups.every(g=>g.fulfillment_method&&!editing.includes(g.store_reference));
 async function confirm(){
  if(!buyer.binding||busy||disabled)return;
  const binding=buyer.binding;
  setBusy(true);setError(false);key.current??=crypto.randomUUID();
  try{const result=await send("confirm","POST",{idempotency_key:key.current},binding);if(alive.current&&activeBinding.current===binding)onComplete(result.reference,result.whatsapp_url??null);}
  catch(error){setError(true);if(error instanceof Error&&"status" in error&&error.status===409)await onConflict();}finally{setBusy(false);}
 }
 return <section className="wenze-web-checkout"><h3>{t.title}</h3>
 {cart.seller_groups.map(group=><Fulfillment key={group.store_reference} group={group} version={cart.version} locale={locale} replace={replace} onBusy={setBusy} disabled={disabled||busy} onEditing={value=>setEditing(current=>value?[...new Set([...current,group.store_reference])]:current.filter(ref=>ref!==group.store_reference))}/>)}
 <p>{t.note}</p>{cart.seller_groups.some(g=>g.delivery_fee_status==="pending")&&<p>{t.pending}</p>}
 {error&&<p role="alert">{t.error}</p>}
 {!buyer.binding?<button className="button button-primary" disabled={buyer.checking||disabled||busy} onClick={buyer.login}>{t.login}</button>:<button className="button button-primary" disabled={!chosen||disabled||busy} onClick={()=>void confirm()}>{busy?t.busy:t.confirm}</button>}
 </section>;
}
function Fulfillment({group,version,locale,replace,disabled,onEditing,onBusy}:{group:CommerceSellerGroup;version:number;locale:Locale;replace:(cart:CommerceCart)=>void;disabled:boolean;onEditing:(value:boolean)=>void;onBusy:(value:boolean)=>void}){
 const t=copy[locale],[method,setMethod]=useState(group.fulfillment_method??""),[fields,setFields]=useState({city:"",commune:"",address:""}),[busy,setBusy]=useState(false),[error,setError]=useState(false),[saved,setSaved]=useState(false);
 async function save(){if(disabled||busy)return;onBusy(true);setBusy(true);setError(false);try{const result=await send("fulfillment","PUT",{store_reference:group.store_reference,method,expected_version:version,...(method==="delivery"?fields:{})});replace(result.cart);setSaved(true);onEditing(false);}catch{setError(true);}finally{setBusy(false);onBusy(false);}}
 return <form onSubmit={e=>{e.preventDefault();void save();}}><strong>{group.store_name}</strong><label>{t.choose}<select required value={method} disabled={disabled||busy} onChange={e=>{setMethod(e.target.value as typeof method);setSaved(false);onEditing(true);}}><option value="">—</option>{group.available_methods?.map(value=><option key={value} value={value}>{t[value]}</option>)}</select></label>
 {method==="delivery"&&(["city","commune","address"] as const).map(field=><label key={field}>{t[field]}<input required disabled={disabled||busy} maxLength={field==="address"?500:120} value={fields[field]} onChange={e=>{setFields({...fields,[field]:e.target.value});setSaved(false);onEditing(true);}}/></label>)}
 {method==="delivery"&&Boolean(group.delivery_areas?.length)&&<p>{group.delivery_areas!.join(" · ")}</p>}
 <button className="button button-secondary" disabled={!method||disabled||busy}>{t.save}</button>{saved&&<p role="status">{t.saved}</p>}{error&&<p role="alert">{t.error}</p>}
 </form>;
}
