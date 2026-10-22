"use client";
import {useEffect,useState,useRef} from "react";
import Link from "next/link";
type Locale = "en"|"fr"|"ln"|"sw";
import {WenzeBuyerProvider,useWenzeBuyer} from "./wenze-buyer";
import {WenzeOrderTimeline,type Timeline} from "./wenze-order-timeline";
import {WenzeOrderUpdates} from "./wenze-order-updates";
import {buyerRequest} from "./wenze-buyer";
import {DeliveryDetails,deliveryLabels} from "./delivery-details";
import styles from "./wenze-buyer-orders.module.css";
type Order={fulfillment_method?:string;delivery_details?:Record<string,string|null>|null;delivery_fee?:string|null;delivery_fee_status?:string;reference:string;store_name:string;total:string|null;currency:string;timeline:Timeline;items:{name:string;quantity:number;variant:string|null}[];estimates?:{preparation:string|null;delivery:string|null}|null};
const copy={
 en:{title:"My Wenze orders",login:"Sign in to see your orders",empty:"No orders yet. Explore the boutiques to find something you like.",failed:"We couldn’t load your orders. Please try again.",refresh:"Refresh",loading:"Loading your orders…",back:"Browse boutiques",previous:"Previous",next:"Next",amount:"Order total",unknown:"Total to be agreed",note:"Order progress does not confirm payment.",prepare:"Preparation",delivery:"Delivery"},
 fr:{title:"Mes commandes Wenze",login:"Connectez-vous pour voir vos commandes",empty:"Aucune commande pour le moment. Découvrez les boutiques.",failed:"Impossible de charger vos commandes. Réessayez.",refresh:"Actualiser",loading:"Chargement des commandes…",back:"Découvrir les boutiques",previous:"Précédent",next:"Suivant",amount:"Total de la commande",unknown:"Total à convenir",note:"Le suivi de commande ne confirme pas le paiement.",prepare:"Préparation",delivery:"Livraison"} ,ln:{"title": "Bacommande Wenze na ngai", "login": "Kota mpo na kotala bacommande", "empty": "Commande ezali naino te. Tala baboutique.", "failed": "Tokoki kotala bacommande te. Meka lisusu.", "refresh": "Zongisa", "loading": "Tozali koluka bacommande…", "back": "Tala baboutique", "previous": "Ya liboso", "next": "Ya nsima", "amount": "Mbongo nyonso", "unknown": "Mbongo esengeli koyokana", "note": "Kokende liboso ya commande elakisi kofuta te.", "prepare": "Kobongisa", "delivery": "Livraison"},sw:{"title": "Maagizo yangu ya Wenze", "login": "Ingia kuona maagizo", "empty": "Hakuna maagizo bado. Angalia maduka.", "failed": "Hatukuweza kupakia maagizo. Jaribu tena.", "refresh": "Pakua upya", "loading": "Inapakia maagizo…", "back": "Angalia maduka", "previous": "Iliyotangulia", "next": "Inayofuata", "amount": "Jumla ya agizo", "unknown": "Jumla bado kujadiliwa", "note": "Maendeleo ya agizo hayathibitishi malipo.", "prepare": "Maandalizi", "delivery": "Kupeleka"}
};
export function WenzeBuyerOrdersPage({locale}:{locale:Locale}){
 return <WenzeBuyerProvider locale={locale}><OrdersBoundary locale={locale}/></WenzeBuyerProvider>;
}
function OrdersBoundary({locale}:{locale:Locale}){
 const buyer=useWenzeBuyer(),t=copy[locale];
 return <main className={`container ${styles.page}`} style={{paddingBlock:"2rem",minHeight:"55vh"}}><h1>{t.title}</h1><Link href={`${locale==="en"?"":`/${locale}`}/shida/wenze/`}>{t.back}</Link>
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
 <OrderDestination key={`${binding}:${order.reference}`} binding={binding} order={order} locale={locale}/><WenzeOrderTimeline locale={locale} timeline={order.timeline}/><WenzeOrderUpdates key={`${binding}:${order.reference}`} locale={locale} identity={`${binding}:${order.reference}`} load={()=>buyerRequest(`orders/${order.reference}/updates`,binding)} read={()=>buyerRequest(`orders/${order.reference}/updates/read`,binding,"POST",{})}/>
 {order.estimates?.preparation&&<p>{t.prepare}: {order.estimates.preparation}</p>}{order.estimates?.delivery&&<p>{t.delivery}: {order.estimates.delivery}</p>}
 </article>)}</div>}
 <nav style={{display:"flex",gap:"1rem"}}><button disabled={!data||page===0} onClick={()=>load(page-1)}>{t.previous}</button><button disabled={!data||(page+1)*20>=data.total} onClick={()=>load(page+1)}>{t.next}</button></nav></>;
}

function OrderDestination({binding,order,locale}:{binding:string;order:Order;locale:Locale}){
 const [detail,setDetail]=useState<Order|null>(null),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const t=deliveryLabels[locale];
 async function open(){setBusy(true);setFailed(false);try{const value=await buyerRequest(`orders/${order.reference}`,binding);if(alive.current)setDetail(value);}catch{if(alive.current)setFailed(true);}finally{if(alive.current)setBusy(false);}}
 return <section><button type="button" disabled={busy} aria-expanded={!!detail} onClick={()=>detail?setDetail(null):void open()}>{t.open}</button>{failed&&<p role="alert">{copy[locale].failed}</p>}{detail&&<><p>{detail.fulfillment_method==="delivery"?t.delivery:t.pickup}</p>{detail.fulfillment_method==="delivery"&&<>{detail.delivery_details&&Object.values(detail.delivery_details).some(Boolean)?<DeliveryDetails locale={locale} fields={detail.delivery_details}/>:<p>{t.missing}</p>}<p>{t.fee}: {detail.delivery_fee_status==="pending"?t.pending:`${detail.delivery_fee??"—"} ${detail.currency}`}</p></>}</>}</section>;
}
