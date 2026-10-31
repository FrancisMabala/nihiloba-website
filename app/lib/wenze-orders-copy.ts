import type {WenzeLocale} from './wenze-copy';
const words:Record<string,readonly [string,string,string,string]>={
 title:['Online orders','Commandes en ligne','Bakomande na internet','Maagizo ya mtandaoni'],
 intro:['Manage orders placed by customers through your SHIDA shop.','Gérez les commandes passées par vos clients sur SHIDA.','Tala bakomande oyo basombi batindi na butiki na yo ya SHIDA.','Simamia maagizo ya wateja kupitia duka lako la SHIDA.'],
 onlineNotice:['These are online orders from the SHIDA marketplace.','Ce sont les commandes passées en ligne sur SHIDA.','Oyo ezali bakomande ya zando SHIDA na internet.','Haya ni maagizo ya mtandaoni kutoka soko la SHIDA.'],
 salesNotice:['In-store sales are recorded in Checkout and can be reviewed in your sales history.','Les ventes en boutique sont enregistrées dans la caisse et consultables dans l’historique des ventes.','Boteki na butiki ekomamaka na caisse mpe emonanaka na lisolo ya boteki.','Mauzo ya dukani hurekodiwa kwenye malipo na yanaonekana katika historia ya mauzo.'],
 notReady:['Online ordering is not configured for this shop.','Les commandes en ligne ne sont pas configurées pour cette boutique.','Bakomande na internet ebongisami te mpo na butiki oyo.','Maagizo ya mtandaoni hayajasanidiwa kwa duka hili.'],
 notReadyHelp:['You are not currently accepting new orders through SHIDA.','Vous n’acceptez pas actuellement de nouvelles commandes sur SHIDA.','Ozali koyamba bakomande ya sika na SHIDA te sikoyo.','Kwa sasa hupokei maagizo mapya kupitia SHIDA.'],
 historyNotice:['New online orders are unavailable. Existing orders remain accessible.','Les nouvelles commandes en ligne sont indisponibles. Les commandes existantes restent accessibles.','Bakomande ya sika na internet ezali te. Bakomande ya kala ezali kaka.','Maagizo mapya ya mtandaoni hayapatikani. Maagizo yaliyopo bado yanaweza kufikiwa.'],
 shopSettings:['Review pickup and delivery in My shop','Consulter le retrait et la livraison dans Ma boutique','Tala kozwa mpe kotinda na Butiki na ngai','Kagua kuchukua na uwasilishaji katika Duka langu'],
 checkout:['Go to Checkout','Aller à la caisse','Kende na caisse','Nenda kwenye malipo'],
 upToDate:['Your online orders are up to date.','Vos commandes en ligne sont à jour.','Bakomande na yo ya internet ezali na molongo.','Maagizo yako ya mtandaoni yamesasishwa.'],

 order:['Order','Commande','Komande','Agizo'],customer:['Customer','Client','Mosombi','Mteja'],items:['Order items','Articles commandés','Biloko ya komande','Bidhaa zilizoagizwa'],total:['Total','Total','Nyonso','Jumla'],
 fulfillment:['Fulfillment','Remise de la commande','Kopesa komande','Uwasilishaji'],payment:['Payment information','Informations de paiement','Makambo ya lifuti','Taarifa za malipo'],status:['Status','Statut','Ezaleli','Hali'],date:['Date','Date','Mokolo','Tarehe'],actions:['Actions','Actions','Misala','Hatua'],view:['View order','Voir la commande','Tala komande','Ona agizo'],
 search:['Order reference, customer or product','Référence, client ou produit','Nimero, mosombi to eloko','Nambari ya agizo, mteja au bidhaa'],clear:['Clear search','Effacer la recherche','Longola boluki','Futa utafutaji'],
 empty_action_required:['No orders need your attention.','Aucune commande à traiter.','Komande ya kosala ezali te.','Hakuna maagizo yanayohitaji hatua.'],
 empty_in_progress:['No orders in progress.','Aucune commande en cours.','Komande ezali kosalema te.','Hakuna maagizo yanayoendelea.'],
 empty_completed:['No completed orders yet.','Aucune commande terminée pour le moment.','Komande esili naino te.','Hakuna maagizo yaliyokamilika bado.'],
 empty_cancelled:['No cancelled or expired orders.','Aucune commande annulée ou expirée.','Komande elongolami to esili ntango ezali te.','Hakuna maagizo yaliyoghairiwa au kuisha muda.'],
 empty_all:['No online orders yet.','Aucune commande en ligne pour le moment.','Komande na internet ezali naino te.','Hakuna maagizo ya mtandaoni bado.'],
 newOrders:['New customer orders will appear here.','Les nouvelles commandes apparaîtront ici.','Bakomande ya sika ekomonana awa.','Maagizo mapya ya wateja yataonekana hapa.'],
 noSearch:['No orders match your search.','Aucune commande ne correspond à votre recherche.','Komande moko te eyokani na boluki.','Hakuna maagizo yanayolingana na utafutaji wako.'],
 back:['Back to Orders','Retour aux commandes','Zonga na bakomande','Rudi kwenye maagizo'],
 complete:['Mark as completed','Marquer comme terminée','Tyá ete esili','Weka kuwa limekamilika'],
 completionHelp:['Confirm that the order has been fulfilled. This does not confirm payment.','Confirmez que la commande a été remise. Cela ne confirme pas le paiement.','Ndima ete komande epesami. Yango endimaka lifuti te.','Thibitisha kuwa agizo limewasilishwa. Hii haithibitishi malipo.'],
 paymentHelp:['Order completion does not verify an external payment.','La fin de la commande ne vérifie pas un paiement externe.','Komande kosila endimaka lifuti ya libanda te.','Kukamilika kwa agizo hakuthibitishi malipo ya nje.'],
 pickupHelp:['The customer collects the order from your shop.','Le client retire la commande à votre boutique.','Mosombi akozwa komande na butiki na yo.','Mteja anachukua agizo dukani kwako.'],
 created:['Order created','Commande créée','Komande esalami','Agizo limeundwa'],updated:['Last updated','Dernière mise à jour','Mbongwana ya suka','Ilisasishwa mwisho'],
 quantity:['Quantity','Quantité','Motango','Idadi'],unit:['Unit price','Prix unitaire','Ntalo ya eloko moko','Bei ya kipimo'],agreed:['Order amount','Montant de la commande','Mbongo ya komande','Kiasi cha agizo'],
 noActions:['No status changes are available for this order.','Aucun changement de statut disponible pour cette commande.','Ezaleli ya komande oyo ekoki kobongwana te.','Hakuna mabadiliko ya hali yanayopatikana kwa agizo hili.'],
 retry:['Try again','Réessayer','Meka lisusu','Jaribu tena'],cancel:['Cancel','Annuler','Tika','Ghairi'],
};
export const ordersText=(locale:WenzeLocale,key:string)=>words[key]?.[(['en','fr','ln','sw'] as const).indexOf(locale)]??'—';
export function orderDate(value:string,locale:WenzeLocale){
 const parsed=new Date(/^\d{4}-\d\d-\d\dT[\d:.]+$/.test(value)?value+'Z':value);
 return Number.isNaN(parsed.valueOf())?'—':new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(parsed);
}
