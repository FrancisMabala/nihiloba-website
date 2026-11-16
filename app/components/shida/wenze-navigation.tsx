"use client";
import "./wenze-expense-list.css";
import editorCopy from "@/app/lib/wenze-editor-copy.json";
import {expenseText} from "@/app/lib/wenze-expense-copy";
import {SellerWorkspaceNavigation, type SellerNavigationItem} from "./seller-workspace";
import {ManagementMobileNavigation} from "./management-mobile-navigation";
import {ordersText} from '@/app/lib/wenze-orders-copy';
import {moneyText} from "@/app/lib/wenze-money-copy";
import {checkoutText} from "@/app/lib/wenze-checkout-copy";
import {posText} from "@/app/lib/wenze-pos-copy";
import {wenzeUX} from "@/app/lib/wenze-ux-copy";
import {sellerText} from "@/app/lib/wenze-seller-copy";
import type {WenzeLocale} from "@/app/lib/wenze-copy";
export const wenzeGroup=(view:string)=>view==="sales"?"today":["catalog","inventory","imports"].includes(view)?"catalog":["money","reports","costs","expenses","schedules","receipts"].includes(view)?"money":view;
export function WenzeNavigation({locale,view,onNavigate,physical=false,showOrders=true}:{showOrders?:boolean;physical?:boolean;locale:WenzeLocale;view:string;onNavigate:(view:string)=>void}){
 const u=(key:Parameters<typeof wenzeUX>[1])=>wenzeUX(locale,key);
 const items:SellerNavigationItem[]=[{key:"today",label:sellerText(locale,"today"),icon:"overview"},{key:"sales",label:checkoutText(locale,"counter"),icon:"finance"},{key:"orders",label:ordersText(locale,"title"),icon:"work"},{key:"catalog",label:u("productsStock"),icon:"stock"},{key:"money",label:u("money"),icon:"reports"},{key:"shop",label:u("shop"),icon:"settings"}];
 const short={en:["Today","Sell","Orders","Products","Money","My shop"],fr:["Aujourd’hui","Vendre","Commandes","Produits","Finances","Boutique"],ln:["Lelo","Teka","Mitindo","Biloko","Mbongo","Butiki"],sw:["Leo","Uza","Maagizo","Bidhaa","Fedha","Duka"]}[locale];
 const visible=items.filter(item=>(physical||item.key!=="sales")&&(showOrders||item.key!=="orders"));
 return <><div className="wz-desktop-navigation"><SellerWorkspaceNavigation label={sellerText(locale,"navigation")} items={visible} current={view==='sales'?'sales':wenzeGroup(view)} onNavigate={onNavigate}/></div><ManagementMobileNavigation locale={locale} items={visible.filter(item=>item.key!=='sales').map(item=>({...item,shortLabel:short[items.indexOf(item)]}))} primary={['today','orders','catalog','money','shop']} current={wenzeGroup(view)} onNavigate={onNavigate}/></>;

}
export function WenzeSubnavigation({locale,view,onNavigate,physical=false}:{physical?:boolean;locale:WenzeLocale;view:string;onNavigate:(view:string)=>void}){
 const group=wenzeGroup(view),tabs=group==="today"&&physical?["today","sales"]:group==="catalog"?["catalog","inventory","imports"]:group==="money"?["money","costs","expenses","reports","schedules","receipts"]:[];
 return tabs.length?<><label className="we-section-select" hidden={!(group==="money")}><span>{expenseText(locale,"sections")}</span><select aria-label={expenseText(locale,"sections")} value={view} onChange={e=>onNavigate(e.target.value)}>{tabs.map(tab=><option key={tab} value={tab}>{tab==="sales"?checkoutText(locale,"counter"):tab==="money"?moneyText(locale,"overview"):tab==="catalog"?sellerText(locale,"products"):tab==="receipts"?posText(locale,"receipts"):sellerText(locale,tab)}</option>)}</select></label><nav className={`wz-section-tabs ${group==="catalog"?"wd-catalog-tabs":""} ${group==="money"?"we-section-tabs":""}`} aria-label={group==="today"?sellerText(locale,"today"):wenzeUX(locale,group==="catalog"?"productsStock":group==="shop"?"shop":"money")}>{tabs.map(tab=><button key={tab} className={group==="catalog"&&tab==="imports"?"wd-import-desktop":undefined} aria-current={view===tab?"page":undefined} onClick={()=>onNavigate(tab)}>{tab==="sales"?checkoutText(locale,"counter"):tab==="money"?moneyText(locale,"overview"):tab==="catalog"?sellerText(locale,"products"):tab==="receipts"?posText(locale,"receipts"):sellerText(locale,tab)}</button>)}{group==="catalog"&&<details className="wd-import-menu"><summary aria-label={editorCopy[locale].more}>•••</summary><div><button aria-current={view==="imports"?"page":undefined} onClick={event=>{event.currentTarget.closest("details")?.removeAttribute("open");onNavigate("imports");}}>{sellerText(locale,"imports")}</button></div></details>}</nav></>:null;
}
