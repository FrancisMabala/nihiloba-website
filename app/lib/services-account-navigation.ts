import type {MarketplaceLocale} from "../components/shida/marketplace-account-copy";

export const servicesAccountCopy = {
 en:{requests:"My requests",bills:"Received bills",describe:"Describe what you need",provider:"My provider area",offer:"Offer my services"},
 fr:{requests:"Mes demandes",bills:"Factures reçues",describe:"Décrire mon besoin",provider:"Mon espace prestataire",offer:"Proposer mes services"},
 ln:{requests:"Masengi na ngai",bills:"Bafacture oyo nazwá",describe:"Limbola bosengi na ngai",provider:"Esika na ngai ya misala",offer:"Kopesa misala na ngai"},
 sw:{requests:"Maombi yangu",bills:"Bili nilizopokea",describe:"Eleza ninachohitaji",provider:"Eneo langu la huduma",offer:"Toa huduma zangu"},
} satisfies Record<MarketplaceLocale,Record<string,string>>;

export type ServicesProviderAccess = "provider" | "setup" | "unavailable";
export function servicesProviderAccess(profiles:unknown, capabilities:unknown):ServicesProviderAccess {
 if(!Array.isArray(profiles)||!Array.isArray(capabilities)||!capabilities.includes("profile"))return "unavailable";
 if(profiles.some(row=>!row||typeof row!=="object"||typeof row.public_ref!=="string"||!/^SVC_[A-Za-z0-9_-]+$/.test(row.public_ref)))return "unavailable";
 return profiles.length?"provider":"setup";
}
