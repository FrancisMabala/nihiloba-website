"use client";
import {useEffect,useRef,useState} from "react";
type Data={unread_count:number;updates:{event:string;created_at:string}[]};
const words={
 en:["Order updates","Unread","Mark as read","No updates yet.","Couldn’t load updates. Try again.","Refresh","Order received","Preparing your order","Ready for pickup","Out for delivery","Order completed","Order cancelled","Order updated"],
 fr:["Actualités de la commande","Non lus","Marquer comme lu","Aucune actualité pour le moment.","Impossible de charger les actualités. Réessayez.","Actualiser","Commande reçue","Préparation de la commande","Prête pour le retrait","En cours de livraison","Commande terminée","Commande annulée","Commande mise à jour"],
 ln:["Nsango ya commande","Etangami naino te","Tyá ete etangami","Nsango ezali naino te.","Nsango ekoki kofungwama te. Meká lisusu.","Zongela","Commande eyambami","Bazali kobongisa commande","Ekoki kozwama","Bazali komema commande","Commande esili","Commande elongolami","Commande ebongwani"],
 sw:["Taarifa za agizo","Hazijasomwa","Weka kuwa imesomwa","Hakuna taarifa bado.","Taarifa hazikupatikana. Jaribu tena.","Onyesha upya","Agizo limepokelewa","Agizo linaandaliwa","Tayari kuchukuliwa","Linasafirishwa","Agizo limekamilika","Agizo limeghairiwa","Agizo limesasishwa"],
};
function label(event:string,t:string[]){
 if(event==="web_order_received"||event==="new_order")return t[6];
 if(event==="web_preparing")return t[7];
 if(["web_ready","fixed_order_ready"].includes(event))return t[8];
 if(["web_out_for_delivery","fixed_order_out_for_delivery"].includes(event))return t[9];
 if(["fixed_order_completed","picked_up","delivered"].includes(event))return t[10];
 if(/cancel|declin|expired/.test(event))return t[11];
 return t[12];
}
export function WenzeOrderUpdates({locale,identity,load,read}:{locale:keyof typeof words;identity:string;load:()=>Promise<unknown>;read:()=>Promise<unknown>}){
 const t=words[locale],[data,setData]=useState<Data|null>(null),[error,setError]=useState(false),[refresh,setRefresh]=useState(0),[busy,setBusy]=useState(false);
 const callbacks=useRef({load,read});useEffect(()=>{callbacks.current={load,read};},[load,read]);
 useEffect(()=>{let active=true;callbacks.current.load().then(value=>{if(active){setData(value as Data);setError(false);}}).catch(()=>{if(active){setError(true);setData(null);}});return()=>{active=false;};},[identity,refresh]);
 return <section style={{borderTop:"1px solid #deded3",marginTop:"1rem",paddingTop:"1rem"}} aria-label={t[0]}>
 <h3>{t[0]} {Boolean(data?.unread_count)&&<span>· {t[1]} ({data!.unread_count})</span>}</h3>
 {error&&<p role="alert">{t[4]}</p>}
 {data?.updates?.length?<ul>{data.updates.map((item,i)=><li key={`${item.created_at}-${i}`}>{label(item.event,t)} <small>{new Date(item.created_at).toLocaleString(locale)}</small></li>)}</ul>:data&&<p>{t[3]}</p>}
 <button type="button" style={{marginRight:".5rem",marginBottom:".5rem"}} onClick={()=>setRefresh(v=>v+1)}>{t[5]}</button>
 {Boolean(data?.unread_count)&&<button type="button" disabled={busy} onClick={()=>{setBusy(true);void callbacks.current.read().then(value=>{setData(value as Data);setError(false);}).catch(()=>{setError(true);setData(null);}).finally(()=>setBusy(false));}}>{t[2]}</button>}
 </section>;
}
