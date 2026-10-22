"use client";
import Link from "next/link";
import type {RestaurantLocale} from "../../services/shida/restaurants-client";
import {PersonalWhatsAppLogin} from "./personal-whatsapp-login";
import "./seller-landing.css";

type Marketplace = "wenze" | "restaurants" | "services";
const copy = {
 en:{area:"SHIDA / SELLER AREA",browse:"Browse the marketplace",choose:"Choose your seller area",restaurants:"Restaurants",services:"Services",wenze:"Wenze",title:"Your boutique, your space."},
 fr:{area:"SHIDA / ESPACE VENDEUR",browse:"Explorer le marché",choose:"Choisissez votre espace vendeur",restaurants:"Restaurants",services:"Services",wenze:"Wenze",title:"Votre boutique, votre espace."},
 ln:{area:"SHIDA / ESIKA YA KOTEKA",browse:"Tala zando",choose:"Pona esika na yo ya koteka",restaurants:"Barestaurant",services:"Misala",wenze:"Wenze",title:"Butiki na yo, esika na yo."},
 sw:{area:"SHIDA / ENEO LA MUUZAJI",browse:"Tembelea soko",choose:"Chagua eneo lako la muuzaji",restaurants:"Mikahawa",services:"Huduma",wenze:"Wenze",title:"Duka lako, nafasi yako."},
};

/** Shared entry presentation only: callers retain session and marketplace authorization. */
export function SellerLanding({marketplace,locale,design,browseHref,onAuthenticated,compact=false}:{compact?:boolean;marketplace:Marketplace;locale:RestaurantLocale;design:{title:string;intro:string;personal:string};browseHref:string;onAuthenticated:()=>void}){
 const t=copy[locale];
 return <div className="shida-seller-landing">
  <div className="ssl-entry"><p className="ssl-eyebrow">{t.area} · {t[marketplace]}</p><h1>{marketplace==="wenze"&&!compact?t.title:design.title}</h1><p className="ssl-intro">{design.intro}</p><PersonalWhatsAppLogin locale={locale} onAuthenticated={onAuthenticated}/><p className="ssl-personal">{design.personal}</p><Link className="ssl-browse" prefetch={false} href={browseHref}>{t.browse}<span aria-hidden="true">→</span></Link></div>
  <nav className="ssl-marketplaces" aria-label={t.choose}><p>{t.choose}</p><div>{(["wenze","restaurants","services"] as const).map(key=><Link key={key} prefetch={false} aria-current={key===marketplace?"page":undefined} href={`${locale==="en"?"":`/${locale}`}/shida/seller/${key}`}>{t[key]}<span aria-hidden="true">↗</span></Link>)}</div></nav>
 </div>;
}
