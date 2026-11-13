import type {PublicServiceProvider, PublicServiceSummary} from '../types/shida-public';

/** A mixed practice has no primary-category field in the current public contract.
 * Never choose its identity from service order, search filters or translated text. */
export function professionalCategory(profile:Pick<PublicServiceProvider,'categories'>):string {
 const categories=[...new Set(profile.categories.filter(Boolean))];
 return categories.length===1?categories[0]:'general';
}
export function professionalBase(profile:PublicServiceProvider):string {
 // workplace is consent-filtered by the public API. Legacy service commune/area
 // fields can contain coverage lists, so they are not an identity address.
 return profile.workplace?.city
  ? [...new Set([profile.workplace.commune,profile.workplace.city].filter(Boolean))].join(', ')
  : profile.location.city?.trim()||'';
}
export function professionalAction(item:PublicServiceSummary):'book'|'quote'|'details' {
 if(item.intake_paused)return 'details';
 if(item.availability_mode==='time_slots')return 'book';
 if(item.requests_enabled)return 'quote';
 return 'details';
}
export const storefrontCopy={
 en:{services:'Services offered',about:'About',reviews:'Customer reviews',book:'Book an appointment',quote:'Request a quotation',details:'View service',choose:'Choose a service',share:'Share',copied:'Link copied',failed:'Could not share. Copy the page address to share this profile.',noBio:'No public description yet.',none:'No public reviews yet.',base:'Based in',modes:'Service delivery',publicAddress:'Public workplace',back:'All professionals',from:'From',reviewer:'Verified customer'},
 fr:{services:'Services proposés',about:'À propos',reviews:'Avis clients',book:'Prendre rendez-vous',quote:'Demander un devis',details:'Voir le service',choose:'Choisir un service',share:'Partager',copied:'Lien copié',failed:'Impossible de partager. Copiez l’adresse de la page pour partager ce profil.',noBio:'Aucune description publique pour le moment.',none:'Aucun avis public pour le moment.',base:'Localisation',modes:'Modes de prestation',publicAddress:'Lieu de travail public',back:'Tous les professionnels',from:'À partir de',reviewer:'Client vérifié'},
 ln:{services:'Misala oyo epesami',about:'Na ntina na',reviews:'Makanisi ya bakiliya',book:'Zwá rendez-vous',quote:'Senga devis',details:'Tala mosala',choose:'Pona mosala',share:'Kabola',copied:'Lien ekopiami',failed:'Tokoki kokabola te. Kopia adresse ya lokasa mpo na kokabola profil.',noBio:'Ndimbola ya bato nyonso ezali naino te.',none:'Makanisi ya bato ezali naino te.',base:'Esika',modes:'Ndenge ya kopesa mosala',publicAddress:'Esika ya mosala ya bato nyonso',back:'Bapesi misala nyonso',from:'Kobanda na',reviewer:'Kiliya oyo atalaki mosala'},
 sw:{services:'Huduma zinazotolewa',about:'Kuhusu',reviews:'Maoni ya wateja',book:'Weka miadi',quote:'Omba makadirio',details:'Tazama huduma',choose:'Chagua huduma',share:'Shiriki',copied:'Kiungo kimenakiliwa',failed:'Imeshindikana kushiriki. Nakili anwani ya ukurasa kushiriki wasifu.',noBio:'Bado hakuna maelezo ya umma.',none:'Bado hakuna maoni ya umma.',base:'Eneo',modes:'Namna ya kutoa huduma',publicAddress:'Mahali pa kazi pa umma',back:'Wataalamu wote',from:'Kuanzia',reviewer:'Mteja aliyethibitishwa'},
} as const;
