import type {ActivityKind} from './overview-records';
type Labels=[one:string,many:string,manage:string,choose:string,list:string];
export const overviewCopy:Record<'fr'|'en'|'ln'|'sw',Record<ActivityKind,Labels>>={
 fr:{
 shop:['1 boutique','{n} boutiques','Gérer la boutique','Choisir une boutique','Mes boutiques'],
 malewa:['1 malewa','{n} malewas','Gérer le malewa','Choisir un malewa','Mes malewas'],
 restaurant:['1 restaurant','{n} restaurants','Gérer le restaurant','Choisir un restaurant','Mes restaurants'],
 profile:['1 profil professionnel','{n} profils professionnels','Gérer le profil','Choisir un profil','Mes profils professionnels'],
 job:['1 offre d’emploi publiée','{n} offres d’emploi publiées','Gérer l’offre','Choisir une offre','Mes offres publiées'],
 apartment:['1 logement','{n} logements','Gérer le logement','Choisir un logement','Mes logements'],
 hotel:['1 hôtel','{n} hôtels','Gérer l’hôtel','Choisir un hôtel','Mes hôtels'],
 driver:['1 activité de transport','{n} activités de transport','Gérer le profil de transport','Choisir une activité','Mes activités de transport'],
 item:['1 annonce','{n} annonces','Gérer l’annonce','Choisir une annonce','Mes annonces']},
 en:{
 shop:['1 shop','{n} shops','Manage shop','Choose a shop','My shops'],
 malewa:['1 malewa','{n} malewas','Manage malewa','Choose a malewa','My malewas'],
 restaurant:['1 restaurant','{n} restaurants','Manage restaurant','Choose a restaurant','My restaurants'],
 profile:['1 professional profile','{n} professional profiles','Manage profile','Choose a profile','My professional profiles'],
 job:['1 posted job','{n} posted jobs','Manage job','Choose a job','My posted jobs'],
 apartment:['1 property','{n} properties','Manage property','Choose a property','My properties'],
 hotel:['1 hotel','{n} hotels','Manage hotel','Choose a hotel','My hotels'],
 driver:['1 transport activity','{n} transport activities','Manage driver profile','Choose an activity','My transport activities'],
 item:['1 listing','{n} listings','Manage listing','Choose a listing','My listings']},
 ln:{
 shop:['Butiki 1','Babutiki {n}','Kamba butiki','Pona butiki','Babutiki na ngai'],
 malewa:['Malewa 1','Malewa {n}','Kamba malewa','Pona malewa','Malewa na ngai'],
 restaurant:['Restora 1','Barestora {n}','Kamba restora','Pona restora','Barestora na ngai'],
 profile:['Profil ya mosala 1','Baprofili ya mosala {n}','Kamba profil','Pona profil','Baprofili na ngai ya mosala'],
 job:['Libaku ya mosala 1 ebimisami','Mabaku ya mosala {n} ebimisami','Kamba libaku','Pona libaku','Mabaku ya mosala nabimisi'],
 apartment:['Ndako 1','Bandako {n}','Kamba ndako','Pona ndako','Bandako na ngai'],
 hotel:['Otɛlɛ 1','Baotɛlɛ {n}','Kamba otɛlɛ','Pona otɛlɛ','Baotɛlɛ na ngai'],
 driver:['Mosala ya transport 1','Misala ya transport {n}','Kamba profil ya sofɛrɛ','Pona mosala','Misala na ngai ya transport'],
 item:['Liyebisi 1','Mayebisi {n}','Kamba liyebisi','Pona liyebisi','Mayebisi na ngai']},
 sw:{
 shop:['Duka 1','Maduka {n}','Simamia duka','Chagua duka','Maduka yangu'],
 malewa:['Malewa 1','Malewa {n}','Simamia malewa','Chagua malewa','Malewa zangu'],
 restaurant:['Mgahawa 1','Migahawa {n}','Simamia mgahawa','Chagua mgahawa','Migahawa yangu'],
 profile:['Wasifu 1 wa kitaalamu','Wasifu {n} wa kitaalamu','Simamia wasifu','Chagua wasifu','Wasifu wangu wa kitaalamu'],
 job:['Tangazo 1 la kazi lililochapishwa','Matangazo {n} ya kazi yaliyochapishwa','Simamia tangazo la kazi','Chagua tangazo la kazi','Matangazo yangu ya kazi'],
 apartment:['Nyumba 1','Nyumba {n}','Simamia nyumba','Chagua nyumba','Nyumba zangu'],
 hotel:['Hoteli 1','Hoteli {n}','Simamia hoteli','Chagua hoteli','Hoteli zangu'],
 driver:['Shughuli 1 ya usafiri','Shughuli {n} za usafiri','Simamia wasifu wa dereva','Chagua shughuli','Shughuli zangu za usafiri'],
 item:['Tangazo 1','Matangazo {n}','Simamia tangazo','Chagua tangazo','Matangazo yangu']}
};
