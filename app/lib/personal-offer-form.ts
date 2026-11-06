// These are presentation suggestions for canonical text fields, not a new job taxonomy.
export const offerFormCopy = {
  en: {required:'Fields marked * are required.',choose:'Choose…',custom:'Other / custom',manual:'Enter the neighbourhood manually if it is not listed.',days:'Working days',from:'From',to:'To',flexible:'Flexible hours',customSchedule:'Describe a custom schedule',structured:'Use day and time controls',overnight:'Ends the following day',skip:'Prefer not to specify',amount:'Amount',currency:'Currency',period:'Payment period',unspecified:'Not specified',review:'Check the information below before publishing your offer.',edit:'Edit',duration:['Full-time','Part-time','Occasional work'],experience:['No experience required','Beginners welcome','Less than one year','One year or more'],week:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],periods:['month','day','hour','week','intervention'],titleExample:'e.g. Housekeeper, childcare…',descriptionExample:'Describe the work and responsibilities…'},
  fr: {required:'Les champs marqués d’un * sont obligatoires.',choose:'Choisir…',custom:'Autre / personnalisé',manual:'Saisissez le quartier manuellement s’il ne figure pas dans la liste.',days:'Jours de travail',from:'De',to:'À',flexible:'Horaires flexibles',customSchedule:'Décrire des horaires personnalisés',structured:'Choisir les jours et horaires',overnight:'Se termine le lendemain',skip:'Je préfère ne pas préciser',amount:'Montant',currency:'Devise',period:'Période de paiement',unspecified:'Non précisé',review:'Relisez les informations ci-dessous avant de publier votre offre.',edit:'Modifier',duration:['Temps plein','Temps partiel','Travail occasionnel'],experience:['Aucune expérience nécessaire','Débutant accepté','Moins d’un an','1 an et plus'],week:['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],periods:['mois','jour','heure','semaine','intervention'],titleExample:'Ex. Femme de ménage, garde d’enfants…',descriptionExample:'Ex. Entretien de la maison, lessive, préparation des repas…'},
  ln: {required:'Bisika ezali na * esengeli kotondisa.',choose:'Pona…',custom:'Mosusu / koma yo moko',manual:'Koma kartye yo moko soki ezali na liste te.',days:'Mikolo ya mosala',from:'Banda',to:'Kino',flexible:'Bangonga oyo ekoki kobongwana',customSchedule:'Limbola bangonga mosusu',structured:'Pona mikolo mpe bangonga',overnight:'Esili mokolo oyo elandi',skip:'Nalingi koyebisa te',amount:'Motango',currency:'Mbongo',period:'Ntango ya lifuti',unspecified:'Epesami te',review:'Tala makambo oyo liboso ya kobimisa mosala.',edit:'Bongisa',duration:['Ntango mobimba','Ndambu ya ntango','Mosala ya ntango mosusu'],experience:['Boyebi esengeli te','Babandi bandimami','Na nse ya mbula moko','Mbula moko to koleka'],week:['M yambo','M mibale','M misato','M minei','M mitano','M poso','Eyenga'],periods:['sanza','mokolo','ngonga','poso','mosala'],titleExample:'Ndakisa: mosala ya ndako, kobatela bana…',descriptionExample:'Limbola mosala mpe mikumba…'},
  sw: {required:'Sehemu zenye * ni lazima.',choose:'Chagua…',custom:'Nyingine / eleza',manual:'Andika mtaa ikiwa haupo kwenye orodha.',days:'Siku za kazi',from:'Kuanzia',to:'Hadi',flexible:'Saa zinazobadilika',customSchedule:'Eleza ratiba nyingine',structured:'Chagua siku na saa',overnight:'Inaisha siku inayofuata',skip:'Sipendi kutaja',amount:'Kiasi',currency:'Sarafu',period:'Kipindi cha malipo',unspecified:'Haijatajwa',review:'Kagua taarifa zifuatazo kabla ya kuchapisha tangazo.',edit:'Hariri',duration:['Muda wote','Muda wa sehemu','Kazi ya mara kwa mara'],experience:['Uzoefu hauhitajiki','Wanaoanza wanakaribishwa','Chini ya mwaka mmoja','Mwaka mmoja au zaidi'],week:['Jtat','Jnne','Jtano','Alh','Ijumaa','Jmos','Jpil'],periods:['mwezi','siku','saa','wiki','huduma'],titleExample:'Mf. Mtunza nyumba, mlezi wa watoto…',descriptionExample:'Eleza kazi na majukumu…'},
};
export const OFFER_TEXT_LIMIT = 4000;
export type OfferLocale = keyof typeof offerFormCopy;

// Do not parse legacy prose heuristically or convert compensation units.
export function parseOfferBudget(value:string) {
  const match = /^(\d+(?:[.,]\d{1,2})?) (CDF|USD) \/ (.+)$/.exec(value);
  return match ? {amount:match[1],currency:match[2],period:match[3]} : null;
}
export function formatOfferBudget(amount:string,currency:string,period:string) {
  return amount && period ? `${amount} ${currency} / ${period}` : '';
}
export function formatOfferSchedule(days:string[],from:string,to:string,flexible:string,overnight:string) {
  return [days.join(', '),flexible || [from,to].filter(Boolean).join('–'),overnight].filter(Boolean).join(' · ');
}
export function parseOfferSchedule(value:string,locale:OfferLocale){
 const parts=value.split(' · ');
 for(const copy of Object.values(offerFormCopy)){
  const indexes=(parts[0]??'').split(', ').map(day=>copy.week.indexOf(day));
  if(!indexes.length||indexes.some(index=>index<0))continue;
  const flexible=parts[1]===copy.flexible;
  const times=/^(\d{2}:\d{2})–(\d{2}:\d{2})$/.exec(parts[1]??'');
  if(!flexible&&!times)continue;
  if(parts.length>3||parts[2]&&parts[2]!==copy.overnight)continue;
  return {days:indexes.map(index=>offerFormCopy[locale].week[index]),from:times?.[1]??'',to:times?.[2]??'',flexible,overnight:parts[2]===copy.overnight};
 }
 return null;
}
