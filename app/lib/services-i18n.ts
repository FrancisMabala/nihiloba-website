import type {ServiceLocale} from "./services-category-experience";
export type {ServiceLocale} from "./services-category-experience";
export const serviceLocales=["en","fr","ln","sw"] as const;
export function isServiceLocale(value:string):value is ServiceLocale{return serviceLocales.includes(value as ServiceLocale);}
/** Other NIHILOBA sections still use their existing supported languages. */
export function servicesLocalizedPath(locale:ServiceLocale,path:string){
 const supported=/^\/shida\/(?:services|seller\/services|service-bills|service-requests|restaurants)(?:[/?#]|$)/.test(path);
 const language=supported?locale:locale==="en"?"en":"fr";
 return `${language==="en"?"":`/${language}`}${path}`;
}
export const serviceNavigationCopy={
 en:{language:"Services language",breadcrumb:"Breadcrumb",loading:"Loading service…",unavailable:"Unavailable",review:"out of 5"},
 fr:{language:"Langue des services",breadcrumb:"Fil d’Ariane",loading:"Chargement du service…",unavailable:"Indisponible",review:"sur 5"},
 ln:{language:"Monoko ya misala",breadcrumb:"Nzela ya lokasa",loading:"Mosala ezali kofungwama…",unavailable:"Ezali te",review:"na 5"},
 sw:{language:"Lugha ya huduma",breadcrumb:"Njia ya ukurasa",loading:"Inapakia huduma…",unavailable:"Haipatikani",review:"kati ya 5"}
} as const;
