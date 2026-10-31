import type {WenzeLocale} from './wenze-copy';
const labels = {
 setup:['Set up your shop to start selling','Préparez votre boutique pour vendre','Bongisa boutique na yo mpo na koteka','Andaa duka lako ili uanze kuuza'],
 setupHelp:['Complete the missing shop details to welcome customers.','Complétez les informations manquantes pour accueillir vos clients.','Tondisa makambo ya boutique oyo ezangi mpo na koyamba bakiliya.','Kamilisha maelezo ya duka yanayokosekana ili kupokea wateja.'],
 complete:['Complete shop setup','Compléter ma boutique','Silisa kobongisa boutique','Kamilisha mipangilio ya duka'],
 attention:['Needs your attention','À traiter','Makambo ya kosala','Yanahitaji uangalizi'],
 clear:['Everything is up to date','Tout est à jour','Nyonso ezali na molongo','Kila kitu kiko sawa'],
 clearHelp:['No pending orders or stock alerts.','Aucune commande en attente ni alerte de stock.','Komande ya kozela to likebisi ya stock ezali te.','Hakuna maagizo yanayosubiri wala tahadhari za stock.'],
 recent:['Recent orders','Commandes récentes','Bakomande ya sika','Maagizo ya karibuni'],
 noOrders:['No orders yet','Aucune commande pour le moment','Komande ezali naino te','Hakuna maagizo bado'],
 noOrdersHelp:['Your shop’s orders will appear here.','Les commandes de votre boutique apparaîtront ici.','Bakomande ya boutique ekomonana awa.','Maagizo ya duka lako yataonekana hapa.'],
 performance:['Shop performance','Performance de la boutique','Matomba ya boutique','Utendaji wa duka'],
 stock:['Stock overview','Vue du stock','Stock ya boutique','Muhtasari wa stock'],
 viewAll:['View all','Tout voir','Tala nyonso','Ona yote'],
 inStock:['In stock','En stock','Ezali na stock','Zipo kwenye stock'],
 outStock:['Out of stock','En rupture','Stock esili','Stock imeisha'],
 untracked:['Stock not tracked','Stock non suivi','Stock elandami te','Stock haifuatiliwi'],
 uninitialized:['Stock awaiting setup','Stock à initialiser','Stock ya kobongisa','Stock inayohitaji kusanidiwa'],
 next:['Next steps','Prochaines étapes','Makambo ya kolanda','Hatua zinazofuata'],
 unavailable:['Unavailable','Indisponible','Ezali te sikoyo','Haipatikani'],
 recorded:['Sales recorded','Ventes enregistrées','Boteki ekomami','Mauzo yaliyorekodiwa'],
 rating:['Average rating','Note moyenne','Moyenne ya makanisi','Wastani wa alama'],
} as const;
export const todayText=(locale:WenzeLocale,key:keyof typeof labels)=>labels[key][['en','fr','ln','sw'].indexOf(locale)];
