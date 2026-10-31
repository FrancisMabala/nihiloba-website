import type {RegistrationLocale} from './copy';
export const profileCopy = {
 en:{first_name:'First name',family_name:'Family name',additional_name:'Additional name / Postnom (optional)',legacy:'Your saved full name is preserved. Confirm your first and family names when you are ready.'},
 fr:{first_name:'Prénom',family_name:'Nom de famille',additional_name:'Postnom (facultatif)',legacy:'Votre nom complet est conservé. Confirmez votre prénom et votre nom de famille quand vous le souhaitez.'},
 ln:{first_name:'Prénom',family_name:'Kombo ya libota',additional_name:'Postnom (esengeli te)',legacy:'Kombo na yo mobimba ebombami. Ndima prénom mpe kombo ya libota ntango okobonga.'},
 sw:{first_name:'Jina la kwanza',family_name:'Jina la familia',additional_name:'Jina la ziada / Postnom (si lazima)',legacy:'Jina lako kamili limehifadhiwa. Thibitisha jina la kwanza na la familia ukiwa tayari.'},
};
export function profileLabel(locale:RegistrationLocale,key:string):string|undefined {
 return Object.prototype.hasOwnProperty.call(profileCopy[locale],key)?profileCopy[locale][key as keyof typeof profileCopy.en]:undefined;
}
