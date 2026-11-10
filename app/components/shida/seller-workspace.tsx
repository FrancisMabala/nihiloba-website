"use client";
import {useEffect, useRef, type ReactNode} from "react";
import "./seller-workspace.css";

import {SellerWorkspaceIcon} from "./services-workspace-icon";
export {SellerWorkspaceIcon} from "./services-workspace-icon";
type IconName=Parameters<typeof SellerWorkspaceIcon>[0]["name"];
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
