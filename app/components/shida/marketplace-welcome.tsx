import type {ReactNode} from "react";
import {marketName,type PublicMarket} from "../../lib/public-markets";
import type {ServiceLocale} from "../../lib/services-i18n";
import {SpaceIcon} from "./account-space-icon";
import "./marketplace-welcome.css";

type Market = Exclude<PublicMarket,"transport"> | "shops";
const icons = {wenze:"orders",shops:"shop",restaurants:"restaurant",services:"people",emplois:"business",appartements:"home",hotels:"business"} as const;
const copy = {
 fr:{welcome:"Bienvenue sur",wenze:"Il n’y a pas encore d’articles en vente ici. Vous avez quelque chose à vendre ?",shops:"Il n’y a pas encore de boutiques ici. Voulez-vous ouvrir la vôtre ?",restaurants:"Vous préparez de bons plats ? Faites découvrir votre menu sur SHIDA.",services:"Besoin d’un coup de main ou envie de proposer votre savoir-faire ?",emplois:"Vous cherchez du travail ou une personne pour une mission ?",appartements:"Vous avez un logement ou un local à louer ? Présentez votre bien sur SHIDA.",hotels:"Vous gérez un hôtel ou un hébergement ? Faites découvrir votre établissement aux voyageurs."},
 en:{welcome:"Welcome to",wenze:"There are no items for sale here yet. Have something to sell?",shops:"There are no shops here yet. Would you like to open yours?",restaurants:"Cook something delicious? Share your menu on SHIDA.",services:"Need a hand, or have a skill to offer?",emplois:"Looking for work or someone to hire?",appartements:"Have a home or space to rent? List it on SHIDA.",hotels:"Run a hotel or guesthouse? Introduce it to travellers."},
 ln:{welcome:"Boyei malamu na",wenze:"Eloko ya kotɛka ezali naino te awa. Ozali na eloko ya kotɛka?",shops:"Butiki ezali naino te awa. Olingi kofungola oyo ya yo?",restaurants:"Olambaka bilei ya elengi? Lakisá menu na yo na SHIDA.",services:"Ozali na mposa ya lisalisi to olingi kopesa mayele na yo?",emplois:"Ozali koluka mosala to moto ya kosala mosala?",appartements:"Ozali na ndako to esika ya kofutisa? Lakisá yango na SHIDA.",hotels:"Okambaka otɛlɛ to esika ya kolala? Lakisá esika na yo na bato ya mobembo."},
 sw:{welcome:"Karibu kwenye",wenze:"Bado hakuna bidhaa zinazouzwa hapa. Una kitu cha kuuza?",shops:"Bado hakuna maduka hapa. Ungependa kufungua lako?",restaurants:"Unapika chakula kitamu? Onyesha menyu yako kwenye SHIDA.",services:"Unahitaji msaada au ungependa kutoa huduma zako?",emplois:"Unatafuta kazi au mtu wa kuajiri?",appartements:"Una nyumba au eneo la kupangisha? Litangaze kwenye SHIDA.",hotels:"Unasimamia hoteli au malazi? Wajulishe wasafiri kuhusu mahali pako."}
};
export function MarketplaceWelcome({market,locale,children}:{market:Market;locale:ServiceLocale;children:ReactNode}) {
 const t=copy[locale];
 return <section className={`market-welcome welcome-${market}`}><span className="market-welcome-icon" aria-hidden="true">{market==="wenze"||market==="shops"?<svg viewBox="0 0 64 56" fill="none" aria-hidden="true"><ellipse cx="32" cy="49" rx="24" ry="4" fill="#d3dfbf"/><path d="m16 21-4 27h40l-4-27H16Z" fill="#fffaf0" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/><path d="M24 25V15a8 8 0 0 1 16 0v10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>:market==="restaurants"?<svg viewBox="0 0 64 56" fill="none" aria-hidden="true"><path d="M7 29c1 25 48 25 50 0Z" fill="#fff3d5" stroke="currentColor" strokeWidth="2.5"/><ellipse cx="32" cy="29" rx="25" ry="7" fill="#e1a545" stroke="currentColor" strokeWidth="2"/><path d="M28 30q1-11 9-6 7-5 12 5" fill="#457446"/><path d="M22 17c5-6-5-7 0-13m10 13c5-6-5-7 0-13m10 13c5-6-5-7 0-13" stroke="#bc7c27" strokeWidth="2.5" strokeLinecap="round"/></svg>:<SpaceIcon name={icons[market]}/>}</span>
   <h2>{t.welcome} {marketName(locale,market==="shops"?"wenze":market)}{locale==="fr"?" !":"!"}</h2>
   <p>{t[market]}</p><div className="market-welcome-actions">{children}</div></section>;
}
