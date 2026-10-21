"use client";
import {SellerWorkspaceNavigation, SellerWorkspaceIcon, type SellerNavigationItem} from "./seller-workspace";
import {checkoutText} from "@/app/lib/wenze-checkout-copy";
import {posText} from "@/app/lib/wenze-pos-copy";
import {wenzeUX} from "@/app/lib/wenze-ux-copy";
import {sellerText} from "@/app/lib/wenze-seller-copy";
import type {WenzeLocale} from "@/app/lib/wenze-copy";
export const wenzeGroup=(view:string)=>["catalog","inventory","imports"].includes(view)?"catalog":["reports","costs","expenses","schedules","receipts"].includes(view)?"reports":view;
export function WenzeNavigation({locale,view,onNavigate,physical=false}:{physical?:boolean;locale:WenzeLocale;view:string;onNavigate:(view:string)=>void}){
 const u=(key:Parameters<typeof wenzeUX>[1])=>wenzeUX(locale,key);
 const items:SellerNavigationItem[]=[{key:"today",label:sellerText(locale,"today"),icon:"overview"},{key:"sales",label:checkoutText(locale,"counter"),icon:"finance"},{key:"orders",label:sellerText(locale,"orders"),icon:"work"},{key:"catalog",label:u("productsStock"),icon:"stock"},{key:"reports",label:u("money"),icon:"reports"},{key:"shop",label:u("shop"),icon:"settings"}];
 const short={en:["Today","Sell","Orders","Products","Money","My shop"],fr:["Aujourd’hui","Vendre","Commandes","Produits","Finances","Boutique"],ln:["Lelo","Teka","Mitindo","Biloko","Mbongo","Butiki"],sw:["Leo","Uza","Maagizo","Bidhaa","Fedha","Duka"]}[locale];
 return <><div className="wz-desktop-navigation"><SellerWorkspaceNavigation label={sellerText(locale,"navigation")} items={items.filter(item=>physical||item.key!=="sales")} current={wenzeGroup(view)} onNavigate={onNavigate}/></div><nav className="wz-mobile-navigation" style={{gridTemplateColumns:`repeat(${physical?6:5},minmax(0,1fr))`}} aria-label={sellerText(locale,"navigation")}>{items.map((item,index)=>!physical&&item.key==="sales"?null:<button type="button" key={item.key} aria-label={item.label} aria-current={wenzeGroup(view)===item.key?"page":undefined} onClick={()=>onNavigate(item.key)}><SellerWorkspaceIcon name={item.icon}/><span>{item.key==="sales"?checkoutText(locale,"counter"):short[index]}</span></button>)}</nav></>;

}
export function WenzeSubnavigation({locale,view,onNavigate}:{locale:WenzeLocale;view:string;onNavigate:(view:string)=>void}){
 const group=wenzeGroup(view),tabs=group==="catalog"?["catalog","inventory","imports"]:group==="reports"?["reports","costs","expenses","schedules","receipts"]:[];
 return tabs.length?<nav className="wz-section-tabs" aria-label={wenzeUX(locale,group==="catalog"?"productsStock":"money")}>{tabs.map(tab=><button key={tab} aria-current={view===tab?"page":undefined} onClick={()=>onNavigate(tab)}>{tab==="receipts"?posText(locale,"receipts"):sellerText(locale,tab)}</button>)}</nav>:null;
}
