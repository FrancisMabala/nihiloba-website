import {IllustratedMarketplaceHero} from "./illustrated-marketplace-hero";
import {marketName} from "../../lib/public-markets";
import {stayTravelOnboarding} from "../../lib/stay-travel-onboarding";
import Image from "next/image";
import Link from "next/link";
import { SpaceIcon } from "./account-space-icon";
import type { ServiceLocale } from "../../lib/services-i18n";
import { APARTMENTS_SLOGAN, HOTELS_SLOGAN, TRANSPORT_SLOGAN, OFFICIAL_CHANNELS } from "../../lib/brand";
import "./stay-travel-discovery.css";

export const stayTravelCopy = {
  en: {
    apartments: {intro:"Discover homes and properties suited to your needs.", invitation:"Have a property to offer?", description:"Publish your property for rent on SHIDA.", action:"Publish a property"},
    hotels: {intro:"Discover hotels and accommodation listed on SHIDA.", invitation:"Manage a hotel or accommodation?", description:"Present your establishment and its rooms to travellers on SHIDA.", action:"Add my establishment"},
    transport: {intro:"Start a journey request with SHIDA on WhatsApp.", invitation:"Are you a driver?", description:"Discover how to offer Wewa rides through SHIDA.", action:"Become a partner driver"},
    emptyHotel:"Hotels to discover soon", emptyHotelText:"No hotels have been published on SHIDA yet.", retry:"Try again", whatsapp:"Continue on WhatsApp", how:"How does it work?", rideTypes:"Journey type", motorcycle:"Motorcycle / Wewa",
  },
  fr: {
    apartments: {intro:"Découvrez des logements et des biens immobiliers adaptés à vos besoins.", invitation:"Vous avez un bien à proposer ?", description:"Publiez votre bien à louer sur SHIDA.", action:"Publier un bien"},
    hotels: {intro:"Découvrez les hôtels et hébergements disponibles sur SHIDA.", invitation:"Vous gérez un hôtel ou un hébergement ?", description:"Présentez votre établissement et ses chambres aux voyageurs sur SHIDA.", action:"Ajouter mon établissement"},
    transport: {intro:"Commencez votre demande de trajet avec SHIDA sur WhatsApp.", invitation:"Vous êtes chauffeur ?", description:"Découvrez comment proposer vos trajets Wewa à travers SHIDA.", action:"Devenir chauffeur partenaire"},
    emptyHotel:"Bientôt des hôtels à découvrir", emptyHotelText:"Aucun hôtel n'est encore publié sur SHIDA.", retry:"Réessayer", whatsapp:"Continuer sur WhatsApp", how:"Comment ça marche ?", rideTypes:"Type de trajet", motorcycle:"Moto / Wewa",
  },
  ln: {
    apartments: {intro:"Tala bandako mpe bisika ya kofanda oyo ekoki na bosenga na yo.", invitation:"Ozali na ndako ya kopesa?", description:"Tia ndako na yo ya kofutela na SHIDA.", action:"Publier ndako"},
    hotels: {intro:"Tala ba hôtels mpe bisika ya kolala oyo ezali na SHIDA.", invitation:"Ozalaka kokamba hôtel to esika ya kolala?", description:"Lakisa hôtel mpe bashambre na yo na bato ya mibembo na SHIDA.", action:"Bakisa hôtel na ngai"},
    transport: {intro:"Banda bosengi ya mobembo na SHIDA na WhatsApp.", invitation:"Ozali mokumbi?", description:"Yeba ndenge ya kopesa mibembo ya Wewa na SHIDA.", action:"Koma mokumbi partenaire"},
    emptyHotel:"Ba hôtels ekoya kala mingi te", emptyHotelText:"Hôtel moko te ebimisami naino na SHIDA.", retry:"Meka lisusu", whatsapp:"Koba na WhatsApp", how:"Esalaka ndenge nini?", rideTypes:"Lolenge ya mobembo", motorcycle:"Moto / Wewa",
  },
  sw: {
    apartments: {intro:"Gundua nyumba na mali zinazofaa mahitaji yako.", invitation:"Una nyumba ya kupangisha?", description:"Chapisha nyumba yako ya kupangisha kwenye SHIDA.", action:"Chapisha nyumba"},
    hotels: {intro:"Gundua hoteli na malazi yaliyochapishwa kwenye SHIDA.", invitation:"Unasimamia hoteli au malazi?", description:"Onyesha hoteli na vyumba vyako kwa wasafiri kwenye SHIDA.", action:"Ongeza hoteli yangu"},
    transport: {intro:"Anza ombi la safari na SHIDA kwenye WhatsApp.", invitation:"Wewe ni dereva?", description:"Jua jinsi ya kutoa safari za Wewa kupitia SHIDA.", action:"Kuwa dereva mshirika"},
    emptyHotel:"Hoteli zinakuja hivi karibuni", emptyHotelText:"Hakuna hoteli iliyochapishwa kwenye SHIDA bado.", retry:"Jaribu tena", whatsapp:"Endelea kwenye WhatsApp", how:"Inafanyaje kazi?", rideTypes:"Aina ya safari", motorcycle:"Pikipiki / Wewa",
  },
} as const;
type Kind = "apartments" | "hotels" | "transport";
const slogans = {apartments:APARTMENTS_SLOGAN,hotels:HOTELS_SLOGAN,transport:TRANSPORT_SLOGAN};
export function StayTravelHero({kind,locale}:{kind:Kind;title:string;locale:ServiceLocale}) {
  return <IllustratedMarketplaceHero tone={kind} title={marketName(locale,kind==="apartments"?"appartements":kind)} slogan={slogans[kind]} intro={stayTravelCopy[locale][kind].intro} art={<Image src={`/images/marketplace-heroes/${kind}.webp`} alt="" width={kind==="transport"?159:kind==="hotels"?117:131} height={kind==="transport"?79:kind==="hotels"?78:76} unoptimized/>}/>;

}
export function stayTravelCommand(command:string) {const url=new URL(OFFICIAL_CHANNELS.whatsapp);url.searchParams.set("text",command);return url.toString();}
export function StayTravelInvitation({kind,locale}:{kind:Kind;locale:ServiceLocale}) {
  const t=stayTravelCopy[locale],c=t[kind];
  if(kind === 'apartments') return <aside className="st-invitation st-apartments"><span className="st-invitation-icon" aria-hidden="true"><SpaceIcon name="home"/></span><div><h2>{c.invitation}</h2><p>{c.description}</p></div><Link className="button button-primary" href={`${locale === 'en' ? '' : '/'+locale}/shida/appartements/publier/`}>{c.action} →</Link></aside>;
  return <aside className={`st-invitation st-${kind}`}><span className="st-invitation-icon" aria-hidden="true"><SpaceIcon name={kind==="hotels"?"business":"people"}/></span><div><h2>{c.invitation}</h2><p>{c.description}</p></div><a className="button button-primary" href={stayTravelCommand(stayTravelOnboarding[kind][locale])} target="_blank" rel="noopener noreferrer">{c.action} <span aria-hidden="true">→</span><small>{t.whatsapp}</small></a></aside>;
}
