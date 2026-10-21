import type {ProviderLocale} from "./services-provider-copy";
const labels:Record<string,Record<ProviderLocale,string>>={
 beauty_wellness:{en:"Appointments",fr:"Rendez-vous",ln:"Ba rendez-vous",sw:"Miadi"},
 home_housing:{en:"Home visits",fr:"Visites à domicile",ln:"Ba visite ya ndako",sw:"Ziara za nyumbani"},
 repair_maintenance:{en:"Repair visits",fr:"Visites de réparation",ln:"Ba visite ya kobongisa",sw:"Ziara za matengenezo"},
 education_training:{en:"Lessons",fr:"Cours",ln:"Mateya",sw:"Masomo"},
 photo_video:{en:"Photo and video sessions",fr:"Séances photo et vidéo",ln:"Ba séance ya foto mpe video",sw:"Vipindi vya picha na video"},
 professional_services:{en:"Consultations and planned work",fr:"Consultations et travaux prévus",ln:"Ba consultation mpe misala ebongisami",sw:"Ushauri na kazi zilizopangwa"},
 cleaning:{en:"Cleaning visits",fr:"Interventions de nettoyage",ln:"Ba visite ya bopetoli",sw:"Ziara za usafi"},
};
/** Wording only: no changes to category eligibility or booking policy. */
export function serviceCalendarLabel(category:string|undefined,locale:ProviderLocale):string|undefined{
 return category&&Object.prototype.hasOwnProperty.call(labels,category)?labels[category][locale]:undefined;
}
export const calendarStateCopy={
 en:{loading:"Loading your calendar…",linkHelp:"This link opens your customer booking page. Customers choose an available time or explain what they need, according to your booking settings."},
 fr:{loading:"Chargement de votre calendrier…",linkHelp:"Ce lien ouvre votre page de réservation client. Selon vos réglages, les clients choisissent un créneau libre ou décrivent leur besoin."},
 ln:{loading:"Manaka na yo ezali kofungwama…",linkHelp:"Lien oyo efungolaka lokasa ya réservation ya bakiliya. Na kolanda ndenge obongisi réservation, bakiliya baponaka ngonga ya polele to balimbolaka bosenga na bango."},
 sw:{loading:"Inapakia kalenda yako…",linkHelp:"Kiungo hiki kinafungua ukurasa wako wa kuweka nafasi. Kulingana na mipangilio yako, wateja huchagua muda ulio wazi au kueleza wanachohitaji."},
};
