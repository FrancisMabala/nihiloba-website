"use client";
import {SellerWorkspaceNavigation, SellerWorkspaceIcon, type SellerNavigationItem} from "./seller-workspace";
import {wenzeUX} from "@/app/lib/wenze-ux-copy";
import {sellerText} from "@/app/lib/wenze-seller-copy";
import type {WenzeLocale} from "@/app/lib/wenze-copy";
export const wenzeGroup=(view:string)=>["catalog","inventory","imports"].includes(view)?"catalog":["reports","costs","expenses","schedules"].includes(view)?"reports":view;
export function WenzeNavigation({locale,view,onNavigate}:{locale:WenzeLocale;view:string;onNavigate:(view:string)=>void}){
 const u=(key:Parameters<typeof wenzeUX>[1])=>wenzeUX(locale,key);
 const items:SellerNavigationItem[]=[{key:"today",label:sellerText(locale,"today"),icon:"overview"},{key:"sales",label:sellerText(locale,"sales"),icon:"finance"},{key:"orders",label:sellerText(locale,"orders"),icon:"work"},{key:"catalog",label:u("productsStock"),icon:"stock"},{key:"reports",label:u("money"),icon:"reports"},{key:"shop",label:u("shop"),icon:"settings"}];
 const short={en:["Today","Sell","Orders","Products","Money","My shop"],fr:["Aujourd’hui","Vendre","Commandes","Produits","Finances","Boutique"],ln:["Lelo","Teka","Mitindo","Biloko","Mbongo","Butiki"],sw:["Leo","Uza","Maagizo","Bidhaa","Fedha","Duka"]}[locale];
 return <><div className="wz-desktop-navigation"><SellerWorkspaceNavigation label={sellerText(locale,"navigation")} items={items} current={wenzeGroup(view)} onNavigate={onNavigate}/></div><nav className="wz-mobile-navigation" aria-label={sellerText(locale,"navigation")}>{items.map((item,index)=><button type="button" key={item.key} aria-label={item.label} aria-current={wenzeGroup(view)===item.key?"page":undefined} onClick={()=>onNavigate(item.key)}><SellerWorkspaceIcon name={item.icon}/><span>{short[index]}</span></button>)}</nav></>;

}
export function WenzeSubnavigation({locale,view,onNavigate}:{locale:WenzeLocale;view:string;onNavigate:(view:string)=>void}){
 const group=wenzeGroup(view),tabs=group==="catalog"?["catalog","inventory","imports"]:group==="reports"?["reports","costs","expenses","schedules"]:[];
 return tabs.length?<nav className="wz-section-tabs" aria-label={wenzeUX(locale,group==="catalog"?"productsStock":"money")}>{tabs.map(tab=><button key={tab} aria-current={view===tab?"page":undefined} onClick={()=>onNavigate(tab)}>{sellerText(locale,tab)}</button>)}</nav>:null;
}
