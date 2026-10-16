"use client";
import {useEffect, useRef, type ReactNode} from "react";
import "./seller-workspace.css";

const paths = {
 overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
 catalog: "M4 7h16v14H4z M8 7V4h8v3 M4 12h16 M10 12v3h4v-3",
 work: "M5 5h14v16H5z M9 3h6v4H9z M8 12h8 M8 16h5",
 finance: "M3 6h18v14H3z M3 9h18 M15 13h6v4h-6z M6 6V3h12",
 reports: "M4 3v18h17 M9 17v-6 M14 17V7 M19 17V4",
 document: "M6 3h9l4 4v14H6z M15 3v5h4 M9 12h7 M9 16h7",
 settings: "M4 4h16v16H4z M8 4v16 M8 9h12 M13 13h3 M13 16h3",
 calendar: "M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2 M8 17h2",
 stock: "m3 7 9-4 9 4-9 4z M3 7v10l9 4 9-4V7 M12 11v10",
 profile: "M8 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M4 21v-3a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v3",
} as const;
type IconName = keyof typeof paths;
export function SellerWorkspaceIcon({name}:{name:IconName}) {
 return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;
}
export function SellerWorkspaceIdentity({mark,title,subtitle}:{mark:string;title:string;subtitle:string}) {
 return <div className="seller-identity"><span aria-hidden="true">{mark}</span><div><strong>{title}</strong><small>{subtitle}</small></div></div>;
}
export type SellerNavigationItem = {key:string;label:string;icon:IconName;active?:boolean};
export function SellerWorkspaceNavigation({id,label,items,current,onNavigate,disabled=false,className=""}:{id?:string;label:string;items:SellerNavigationItem[];current:string;onNavigate:(key:string)=>void;disabled?:boolean;className?:string}) {
 const navigation=useRef<HTMLElement>(null);
 useEffect(()=>{
  const nav=navigation.current, active=nav?.querySelector<HTMLElement>('[aria-current="page"]');
  if(!nav||!active)return;
  // Reveal deep-linked and programmatically selected sections without scrolling the page.
  const outer=nav.getBoundingClientRect(), inner=active.getBoundingClientRect();
  if(inner.left<outer.left)nav.scrollLeft-=outer.left-inner.left;
  else if(inner.right>outer.right)nav.scrollLeft+=inner.right-outer.right;
  if(inner.top<outer.top)nav.scrollTop-=outer.top-inner.top;
  else if(inner.bottom>outer.bottom)nav.scrollTop+=inner.bottom-outer.bottom;
 },[current]);
 return <nav ref={navigation} id={id} className={`seller-navigation ${className}`} aria-label={label}>{items.map(item=><button key={item.key} type="button" disabled={disabled} aria-current={item.active || current===item.key ? "page" : undefined} onClick={()=>onNavigate(item.key)}><SellerWorkspaceIcon name={item.icon}/>{item.label}</button>)}</nav>;
}
export function SellerWorkspaceHeading({eyebrow,title,children,actions}:{eyebrow:string;title:string;children?:ReactNode;actions?:ReactNode}) {
 return <header className="seller-heading"><div><p className="seller-eyebrow">{eyebrow}</p><h1>{title}</h1>{children}</div>{actions&&<div className="seller-heading-actions">{actions}</div>}</header>;
}
