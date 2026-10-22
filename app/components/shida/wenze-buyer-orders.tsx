"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import type {Locale} from "../../lib/i18n";
import {WenzeBuyerProvider,useWenzeBuyer} from "./wenze-buyer";
import {WenzeOrderTimeline,type Timeline} from "./wenze-order-timeline";
import {WenzeOrderUpdates} from "./wenze-order-updates";
import {buyerRequest} from "./wenze-buyer";
import styles from "./wenze-buyer-orders.module.css";
type Order={reference:string;store_name:string;total:string|null;currency:string;timeline:Timeline;items:{name:string;quantity:number;variant:string|null}[];estimates?:{preparation:string|null;delivery:string|null}|null};
const copy={
 en:{title:"My Wenze orders",login:"Sign in to see your orders",empty:"No orders yet. Explore the boutiques to find something you like.",failed:"We couldn’t load your orders. Please try again.",refresh:"Refresh",loading:"Loading your orders…",back:"Browse boutiques",previous:"Previous",next:"Next",amount:"Order total",unknown:"Total to be agreed",note:"Order progress does not confirm payment.",prepare:"Preparation",delivery:"Delivery"},
 fr:{title:"Mes commandes Wenze",login:"Connectez-vous pour voir vos commandes",empty:"Aucune commande pour le moment. Découvrez les boutiques.",failed:"Impossible de charger vos commandes. Réessayez.",refresh:"Actualiser",loading:"Chargement des commandes…",back:"Découvrir les boutiques",previous:"Précédent",next:"Suivant",amount:"Total de la commande",unknown:"Total à convenir",note:"Le suivi de commande ne confirme pas le paiement.",prepare:"Préparation",delivery:"Livraison"}
};
export function WenzeBuyerOrdersPage({locale}:{locale:Locale}){
 return <WenzeBuyerProvider locale={locale}><OrdersBoundary locale={locale}/></WenzeBuyerProvider>;
}
function OrdersBoundary({locale}:{locale:Locale}){
 const buyer=useWenzeBuyer(),t=copy[locale];
 return <main className={`container ${styles.page}`} style={{paddingBlock:"2rem",minHeight:"55vh"}}><h1>{t.title}</h1><Link href={`${locale==="fr"?"/fr":""}/shida/wenze/`}>{t.back}</Link>
 {buyer.checking?<p role="status">{t.loading}</p>:!buyer.binding?<p><button className="btn" onClick={buyer.login}>{t.login}</button></p>:<Orders key={buyer.binding} binding={buyer.binding} locale={locale}/>}
 </main>;
}
function Orders({binding,locale}:{binding:string;locale:Locale}){
 const t=copy[locale], [page,setPage]=useState(0),[refresh,setRefresh]=useState(0),[data,setData]=useState<{orders:Order[];total:number}|null>(null),[error,setError]=useState(false);
 useEffect(()=>{const controller=new AbortController();let active=true;
  fetch(`/api/shida/personal/wenze-buyer/orders/?offset=${page*20}&limit=20`,{cache:"no-store",credentials:"same-origin",signal:controller.signal,headers:{"X-Shida-Session":binding}})
   .then(async r=>{if(!r.ok)throw Error();return r.json();}).then(value=>{if(active){setData(value);setError(false);}}).catch(()=>{if(active){setError(true);setData(null);}});
  return()=>{active=false;controller.abort();};
 },[binding,page,refresh]);
 function load(next:number){setData(null);setError(false);setPage(next);setRefresh(value=>value+1);}
 return <><p>{t.note}</p><button onClick={()=>load(page)}>{t.refresh}</button>
 {error?<p role="alert">{t.failed}</p>:!data?<p role="status">{t.loading}</p>:!data.orders.length?<p>{t.empty}</p>:<div style={{display:"grid",gap:"1rem",marginBlock:"1.5rem"}}>{data.orders.map(order=><article id={order.reference} key={order.reference} style={{padding:"1.25rem",border:"1px solid #deded3",borderRadius:".75rem",minWidth:0,overflowWrap:"anywhere"}}>
 <h2>{order.store_name}</h2><small>{order.reference}</small><ul>{order.items.map((item,i)=><li key={i}>{item.name} {item.variant} × {item.quantity}</li>)}</ul>
 <p><strong>{order.total===null?t.unknown:`${t.amount}: ${new Intl.NumberFormat(locale).format(Number(order.total))} ${order.currency}`}</strong></p>
 <WenzeOrderTimeline locale={locale} timeline={order.timeline}/><WenzeOrderUpdates key={`${binding}:${order.reference}`} locale={locale} identity={`${binding}:${order.reference}`} load={()=>buyerRequest(`orders/${order.reference}/updates`,binding)} read={()=>buyerRequest(`orders/${order.reference}/updates/read`,binding,"POST",{})}/>
 {order.estimates?.preparation&&<p>{t.prepare}: {order.estimates.preparation}</p>}{order.estimates?.delivery&&<p>{t.delivery}: {order.estimates.delivery}</p>}
 </article>)}</div>}
 <nav style={{display:"flex",gap:"1rem"}}><button disabled={!data||page===0} onClick={()=>load(page-1)}>{t.previous}</button><button disabled={!data||(page+1)*20>=data.total} onClick={()=>load(page+1)}>{t.next}</button></nav></>;
}
