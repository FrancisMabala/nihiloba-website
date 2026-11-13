import type {WenzeLocale} from './wenze-copy';
const copy:Record<string,string[]>={
amount:['Fee amount','Montant','Motuya','Kiasi'],
chooseZones:['Choose communes','Choisir les communes','Pona bakómini','Chagua maeneo'],
oneZone:['1 commune selected','1 commune sélectionnée','Komini 1 eponami','Eneo 1 limechaguliwa'],
selectedZones:['{n} communes selected','{n} communes sélectionnées','Bakómini {n} eponami','Maeneo {n} yamechaguliwa'],
searchZones:['Search communes','Rechercher une commune','Luka komini','Tafuta eneo'],
prepExample:['E.g. 2 hours','Ex. : 2 heures','Ndakisa: ngonga 2','Mf. saa 2'],
deliveryExample:['E.g. 1 to 2 days','Ex. : 1 à 2 jours','Ndakisa: mokolo 1 to 2','Mf. siku 1 hadi 2'],
photoHint:['JPG, PNG or WebP · 8 MB maximum','JPG, PNG ou WebP · 8 Mo maximum','JPG, PNG to WebP · koleka 8 Mo te','JPG, PNG au WebP · hadi MB 8'],
presentation:['Presentation','Présentation','Maloba ya butiki','Utambulisho'],
description:['Shop description','Description de la boutique','Ndimbola ya butiki','Maelezo ya duka'],
editPresentation:['Edit presentation','Modifier la présentation','Bongola maloba ya butiki','Badili utambulisho'],
practical:['Practical information','Informations pratiques','Makambo ya kosalela','Taarifa muhimu'],
receive:['How do customers receive their purchases?','Comment vos clients reçoivent-ils leurs achats ?','Basombi bazwaka biloko na bango ndenge nini ?','Wateja wanapokeaje bidhaa zao?'],
customerPreview:['Customer preview','Aperçu pour vos clients','Ndenge basombi bakomona','Mwonekano kwa wateja'],
privatePreview:['Private preview','Aperçu privé','Botali ya nkuku','Onyesho binafsi'],
testPrivate:['Test shop · Private preview only','Boutique de test · Visible uniquement en aperçu privé','Butiki ya komeka · Botali ya nkuku kaka','Duka la majaribio · Onyesho binafsi pekee'],
zones:['Which communes do you deliver to?','Dans quelles communes livrez-vous ?','Bakómini ya livraison','Maeneo ya uwasilishaji'],
noAddress:['No pickup address published','Aucune adresse de retrait publiée','Adresi ya kozwa biloko emonisami te','Hakuna anwani ya kuchukulia iliyochapishwa'],
sharing:['Sharing and shop management','Partage et gestion des boutiques','Kokabola mpe kotambwisa butiki','Kushiriki na kusimamia maduka'],
choosePhoto:['Choose photo','Ajouter une photo','Pona foto','Chagua picha'],
replacePhoto:['Replace photo','Modifier la photo','Bongola foto','Badili picha'],
photoTip:['Use a clear photo of your shop, logo or storefront.','Utilisez une photo claire de votre boutique, logo ou façade.','Salela foto ya polele ya butiki, logo to liboso na yango.','Tumia picha wazi ya duka, nembo au mbele ya duka.'],
trust:['Seller quality and trust','Qualité et confiance','Qualité mpe confiance','Ubora na uaminifu'],
commitment:['Seller commitment','Engagement du vendeur','Elaka ya moteki','Ahadi ya muuzaji'],
policyHelp:['Describe products accurately and provide reliable service. SHIDA may restrict access under its acceptable-use policy. This reminder is not a violation notice.','Décrivez fidèlement vos produits et offrez un service fiable. SHIDA peut limiter l’accès selon sa politique d’utilisation. Ce rappel ne signale pas une infraction.','Limbola biloko na bosolo mpe pesa service ya malamu. SHIDA ekoki kopekisa accès na mibeko na yango. Bokundoli oyo ezali accusation te.','Eleza bidhaa kwa usahihi na toa huduma ya kuaminika. SHIDA inaweza kuzuia ufikiaji kulingana na sera yake. Kikumbusho hiki si taarifa ya ukiukaji.'],
policy:['View applicable policy','Voir la politique applicable','Tala mibeko','Angalia sera'],
suspended:['Shop suspended','Boutique suspendue','Butiki ekangami mpo na ntango','Duka limesimamishwa'],
restriction:['SHIDA has suspended this shop. Changing its visibility cannot remove this restriction. Refer to the notice you received or contact support for an explanation.','SHIDA a suspendu cette boutique. Modifier sa visibilité ne lève pas cette restriction. Consultez l’avis reçu ou contactez l’assistance pour une explication.','SHIDA ekangi butiki oyo. Kobongola visibilité ekolongola epekiseli te. Tala liyebisi oyo ozwaki to benga lisungi.','SHIDA imesimamisha duka hili. Kubadili mwonekano hakuondoi kizuizi. Soma taarifa uliyopokea au wasiliana na msaada.'],
visibility:['Shop visibility','Visibilité de la boutique','Komonana ya butiki','Mwonekano wa duka'],
activeHelp:['Visible when your shop is ready.','Visible lorsque la boutique est prête.','Emonanaka soki butiki ebongami.','Linaonekana duka likiwa tayari.'],
hiddenHelp:['Temporarily hide your shop.','Masquez temporairement la boutique.','Bomba butiki mpo na ntango.','Ficha duka kwa muda.'],
archiveHelp:['Keep your shop data while removing its public listing.','Conservez les données sans afficher la boutique au public.','Bomba butiki mpe batela makambo na yango.','Hifadhi taarifa bila kuonyesha duka kwa umma.'],
view:['View shop','Voir la boutique','Tala butiki','Angalia duka'],
info:['Shop information','Informations de la boutique','Makambo ya butiki','Taarifa za duka'],
photo:['Choose or replace your shop photo','Choisir ou remplacer la photo','Pona to bongola foto ya butiki','Chagua au badili picha ya duka'],
location:['Pickup location','Lieu de retrait','Esika ya kozwa biloko','Mahali pa kuchukulia'],
timing:['Preparation and delivery time','Préparation et livraison','Ntango ya kobongisa mpe kotinda','Muda wa maandalizi na uwasilishaji'],
fees:['Delivery fees','Frais de livraison','Ntalo mpe bisika ya kotinda','Gharama na maeneo ya uwasilishaji'],
unknown:['Status unavailable','Statut indisponible','Statut eyebani te','Hali haipatikani']
};
export const shopText=(locale:WenzeLocale,key:string)=>copy[key]?.[['en','fr','ln','sw'].indexOf(locale)]??'—';
export const shopState=(status:unknown,visible:unknown)=>status==='suspended'?'suspended':status==='active'?(visible==='true'?'active':'hidden'):['inactive','archived'].includes(String(status))?'archived':'unknown';
export const canChangeShopVisibility=(status:unknown)=>['active','inactive','archived'].includes(String(status));

export function shopUsage(used:number,limit:number){return Number.isFinite(used)&&Number.isFinite(limit)&&limit>0?Math.min(100,Math.max(0,used/limit*100)):null;}
