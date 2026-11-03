import type {WenzeLocale} from "@/app/lib/wenze-copy";
import {transactionText} from "@/app/lib/transactions-copy";
import {SpaceIcon} from "./account-space-icon";

const copy = {
  en: {title:"Sell on SHIDA, your way", intro:"Sell an occasional item without opening a shop. Keep your personal listings and your boutiques in the same workspace.", shops:"Your Wenze boutiques", manage:"Manage boutique", settings:"Each listing keeps its own location, payment preferences and handover arrangements.", payments:"Payment preferences do not mean that SHIDA has collected or verified payment.", notifications:"Notifications", activity:"My activities"},
  fr: {title:"Vendez sur SHIDA, à votre façon", intro:"Vendez un article à titre individuel sans créer une boutique. Retrouvez vos annonces personnelles et vos boutiques dans le même espace.", shops:"Vos boutiques Wenze", manage:"Gérer la boutique", settings:"Chaque annonce conserve son lieu de vente, ses paiements acceptés et ses modalités de remise.", payments:"Les paiements acceptés ne signifient pas que SHIDA a encaissé ou vérifié un paiement.", notifications:"Notifications", activity:"Mes activités"},
  ln: {title:"Tɛká na SHIDA, na ndenge na yo", intro:"Tɛká eloko moko kozanga kofungola boutique. Tala mayebisi na yo mpe ba-boutique na esika moko.", shops:"Ba-boutique na yo ya Wenze", manage:"Tambwisa boutique", settings:"Liyebisi nyonso ezali na esika na yango, ndenge ya kofuta mpe ya kopesa eloko.", payments:"Ndenge ya kofuta oyo ondimi elingi koloba te ete SHIDA ezwi to etali mbongo.", notifications:"Mayebisi", activity:"Misala na ngai"},
  sw: {title:"Uza kwenye SHIDA kwa njia yako", intro:"Uza bidhaa binafsi bila kufungua duka. Simamia matangazo yako binafsi na maduka katika sehemu moja.", shops:"Maduka yako ya Wenze", manage:"Simamia duka", settings:"Kila tangazo lina mahali pake, njia za malipo na masharti ya kukabidhi bidhaa.", payments:"Njia za malipo zinazokubaliwa hazimaanishi kwamba SHIDA imekusanya au kuthibitisha malipo.", notifications:"Arifa", activity:"Shughuli zangu"},
} as const;

export function IndividualSellerOverview({locale,shops}:{locale:WenzeLocale;shops:{public_ref:string;name:string}[]}) {
  const t=copy[locale], prefix=locale==="en"?"":`/${locale}`;
  return <div className="qs-overview">
    <section className="qs-overview-hero"><span className="qs-overview-icon"><SpaceIcon name="orders"/></span><div><h2>{t.title}</h2><p>{t.intro}</p></div></section>
    {shops.length>0&&<section className="qs-boutiques"><h2>{t.shops} <span>({shops.length})</span></h2><div>{shops.map(shop=><article key={shop.public_ref}><SpaceIcon name="shop"/><strong>{shop.name}</strong><a href={`${prefix}/shida/seller/wenze?store=${encodeURIComponent(shop.public_ref)}`}>{t.manage} →</a></article>)}</div></section>}
    <div className="qs-selling-help"><p><SpaceIcon name="settings"/>{t.settings}</p><p><SpaceIcon name="shield"/>{t.payments}</p></div>
    <nav className="qs-overview-links"><a href={`${prefix}/shida/space?view=transactions&role=seller`}><SpaceIcon name="orders"/>{transactionText(locale,"sellerRole")} →</a><a href={`${prefix}/shida/space?view=management`}><SpaceIcon name="management"/>{t.activity} →</a><a href={`${prefix}/shida/space?view=messages`}><SpaceIcon name="messages"/>{t.notifications} →</a></nav>
  </div>;
}
