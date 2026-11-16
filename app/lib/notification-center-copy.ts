export const notificationCopy = {
 en: ['Notifications','Close','All activity','Unread','Action required','All marketplaces','No alerts in this view.','Open activity','Mark read','Acknowledge','Continue in WhatsApp','Send the prepared message in WhatsApp to continue.','Load more','Notifications are temporarily unavailable. Try again.','Mark this page read','Loading…','Expired','Acknowledged','Optional alerts in badge','Essential alerts remain enabled.','Retry'],
 fr: ['Notifications','Fermer','Toute l’activité','Non lues','Action requise','Tous les marchés','Aucune alerte dans cette vue.','Ouvrir l’activité','Marquer comme lue','Accuser réception','Continuer sur WhatsApp','Envoyez le message préparé dans WhatsApp pour continuer.','Voir la suite','Les notifications sont temporairement indisponibles. Réessayez.','Marquer cette page comme lue','Chargement…','Expirée','Réception confirmée','Alertes facultatives dans le compteur','Les alertes essentielles restent actives.','Réessayer'],
 ln: ['Mayebisi','Kanga','Makambo nyonso','Etángami naino te','Esengeli kosala','Bazando nyonso','Liyebisi ezali te awa.','Fungola likambo','Tya ete otángi','Ndima boyambi','Koba na WhatsApp','Tinda nsango oyo ebongisami na WhatsApp mpo na kokoba.','Tala mosusu','Mayebisi ezali te sikoyo. Meka lisusu.','Tya ete otángi lokasa oyo','Ezali koya…','Ntango esili','Boyambi endimami','Mayebisi ya kopona na motángo','Mayebisi ya ntina ekotikala kosala.','Meka lisusu'],
 sw: ['Arifa','Funga','Shughuli zote','Hazijasomwa','Hatua inahitajika','Masoko yote','Hakuna arifa katika mwonekano huu.','Fungua shughuli','Weka imesomwa','Thibitisha kupokea','Endelea kwenye WhatsApp','Tuma ujumbe ulioandaliwa kwenye WhatsApp ili kuendelea.','Onyesha zaidi','Arifa hazipatikani kwa sasa. Jaribu tena.','Weka ukurasa huu umesomwa','Inapakia…','Muda umeisha','Kupokea kumethibitishwa','Arifa za hiari kwenye hesabu','Arifa muhimu zinaendelea kutumika.','Jaribu tena'],
} as const;
type Locale = keyof typeof notificationCopy;
export const modules = ['wenze','services','employment','apartments','hotels','restaurants','security','school','support'];
export const moduleNames: Record<Locale,string[]> = {
 en:['Wenze','Services','Employment','Apartments','Hotels','Restaurants & Malewa','Account security','School','Help and questions'],
 fr:['Wenze','Services','Emploi','Logement','Hôtels','Restaurants & Malewa','Sécurité du compte','École','Aide et questions'],
 ln:['Wenze','Misala','Mosala','Bandako','Baotɛlɛ','Restaurants & Malewa','Bobateli ya konte','Eteyelo','Lisalisi na mituna'],
 sw:['Wenze','Huduma','Ajira','Makazi','Hoteli','Restaurants & Malewa','Usalama wa akaunti','Shule','Msaada na maswali'],
};

export const notificationLayoutCopy = {
 fr:{all:'Toutes',filters:'Filtres',clear:'Effacer les filtres',actions:'Autres actions',today:'Aujourd’hui',yesterday:'Hier',unread:'Notification non lue'},
 en:{all:'All',filters:'Filters',clear:'Clear filters',actions:'More actions',today:'Today',yesterday:'Yesterday',unread:'Unread notification'},
 ln:{all:'Nyonso',filters:'Baponi',clear:'Longola baponi',actions:'Makambo mosusu',today:'Lelo',yesterday:'Lobi eleki',unread:'Liyebisi etángami naino te'},
 sw:{all:'Zote',filters:'Vichujio',clear:'Ondoa vichujio',actions:'Vitendo vingine',today:'Leo',yesterday:'Jana',unread:'Arifa haijasomwa'},
} as const;

// Keep the existing browser-local timezone, including its daylight-saving rules.
export function notificationTimestamp(value:string,locale:Locale,now=new Date()) {
 const date=new Date(value),yesterday=new Date(now);yesterday.setDate(now.getDate()-1);
 const sameDay=(a:Date,b:Date)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
 const label=sameDay(date,now)?notificationLayoutCopy[locale].today:sameDay(date,yesterday)?notificationLayoutCopy[locale].yesterday:null;
 return {short:label?`${label}, ${date.toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'})}`:date.toLocaleDateString(locale,{day:'numeric',month:'short',...(date.getFullYear()!==now.getFullYear()?{year:'numeric' as const}:{})}),full:date.toLocaleString(locale,{dateStyle:'full',timeStyle:'long'})};
}
