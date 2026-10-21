"use client";
import {useState} from "react";
import {SellerWorkspaceNavigation, type SellerNavigationItem} from "./seller-workspace";
import {wenzeUX} from "@/app/lib/wenze-ux-copy";
import {sellerText} from "@/app/lib/wenze-seller-copy";
import type {WenzeLocale} from "@/app/lib/wenze-copy";
export const wenzeGroup=(view:string)=>["catalog","inventory","imports"].includes(view)?"catalog":["reports","costs","expenses","schedules"].includes(view)?"reports":view;
export function WenzeNavigation({locale,view,onNavigate}:{locale:WenzeLocale;view:string;onNavigate:(view:string)=>void}){
 const [more,setMore]=useState(false),u=(key:Parameters<typeof wenzeUX>[1])=>wenzeUX(locale,key);
 const items:SellerNavigationItem[]=[{key:"today",label:sellerText(locale,"today"),icon:"overview"},{key:"sales",label:sellerText(locale,"sales"),icon:"finance"},{key:"orders",label:sellerText(locale,"orders"),icon:"work"},{key:"catalog",label:u("productsStock"),icon:"stock"},{key:"reports",label:u("money"),icon:"reports"},{key:"shop",label:u("shop"),icon:"settings"}];
 return <><div className="wz-desktop-navigation"><SellerWorkspaceNavigation label={sellerText(locale,"navigation")} items={items} current={wenzeGroup(view)} onNavigate={onNavigate}/></div><nav className="wz-mobile-navigation" aria-label={sellerText(locale,"navigation")}>{items.slice(0,4).map(item=><button key={item.key} aria-current={wenzeGroup(view)===item.key?"page":undefined} onClick={()=>{setMore(false);onNavigate(item.key);}}>{item.label}</button>)}<button aria-expanded={more} aria-current={["reports","shop"].includes(wenzeGroup(view))?"page":undefined} onClick={()=>setMore(!more)}>{u("more")}</button>{more&&<div className="wz-more-menu">{items.slice(4).map(item=><button key={item.key} onClick={()=>{setMore(false);onNavigate(item.key);}}>{item.label}</button>)}</div>}</nav></>;
}
export function WenzeSubnavigation({locale,view,onNavigate}:{locale:WenzeLocale;view:string;onNavigate:(view:string)=>void}){
 const group=wenzeGroup(view),tabs=group==="catalog"?["catalog","inventory","imports"]:group==="reports"?["reports","costs","expenses","schedules"]:[];
 return tabs.length?<nav className="wz-section-tabs" aria-label={wenzeUX(locale,group==="catalog"?"productsStock":"money")}>{tabs.map(tab=><button key={tab} aria-current={view===tab?"page":undefined} onClick={()=>onNavigate(tab)}>{sellerText(locale,tab)}</button>)}</nav>:null;
}
