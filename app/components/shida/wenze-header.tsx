"use client";
import type {ReactNode} from "react";
import {MarketplaceControls,marketplaceAccountCopy,type MarketplaceLocale} from "./marketplace-controls";
import "./wenze-header.css";
import "./marketplace-workspaces.css";
export function WenzeHeader({locale,name,brandHref,onLanguage,onAccount,onLogout,pending=false,children,marketplace="Wenze",beforeNavigate}:{locale:MarketplaceLocale;name?:string|null;brandHref:string;onLanguage:(locale:MarketplaceLocale)=>void;onAccount:()=>void;onLogout:()=>void;pending?:boolean;children?:ReactNode;marketplace?:string;beforeNavigate?:()=>boolean|Promise<boolean>}){
 const a=marketplaceAccountCopy[locale],spaceHref=`${locale==="en"?"":`/${locale}`}/shida/space`;
 const homeHref=locale==="fr"?"/fr":"/",sellerHref=brandHref.replace("/shida/","/shida/seller/");
 return <header className="wz-header"><div className="wz-header-row"><div className="market-brand-group"><a className="market-home" href={homeHref} aria-label={a.home} onClick={async event=>{if(beforeNavigate){event.preventDefault();if(await beforeNavigate())window.location.assign(homeHref);}}}>NIHILOBA</a><a className="wz-header-brand" href={brandHref} onClick={async event=>{if(beforeNavigate){event.preventDefault();if(await beforeNavigate())window.location.assign(brandHref);}}}>SHIDA <span>{marketplace}</span></a></div>
 <MarketplaceControls locale={locale} name={name} spaceHref={spaceHref} links={[{label:a.space,href:spaceHref},{label:a.seller,href:sellerHref},{label:a.inbox,href:`${spaceHref}?view=inbox`},{label:a.market,href:brandHref}]} onLanguage={onLanguage} onAccount={onAccount} onLogout={onLogout} pending={pending} beforeNavigate={beforeNavigate}/></div>{children}</header>;
}
