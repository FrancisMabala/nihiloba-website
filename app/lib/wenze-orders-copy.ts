import type {WenzeLocale} from './wenze-copy';
const words:Record<string,readonly [string,string,string,string]>={
 intro:['Manage orders received by your shop.','Gérez les commandes reçues par votre boutique.','Tala bakomande oyo butiki na yo eyambi.','Simamia maagizo yaliyopokelewa dukani kwako.'],
 order:['Order','Commande','Komande','Agizo'],customer:['Customer','Client','Mosombi','Mteja'],items:['Order items','Articles commandés','Biloko ya komande','Bidhaa zilizoagizwa'],total:['Total','Total','Nyonso','Jumla'],
 fulfillment:['Fulfillment','Remise de la commande','Kopesa komande','Uwasilishaji'],payment:['Payment information','Informations de paiement','Makambo ya lifuti','Taarifa za malipo'],status:['Status','Statut','Ezaleli','Hali'],date:['Date','Date','Mokolo','Tarehe'],actions:['Actions','Actions','Misala','Hatua'],view:['View order','Voir la commande','Tala komande','Ona agizo'],
 search:['Order reference, customer or product','Référence, client ou produit','Nimero, mosombi to eloko','Nambari ya agizo, mteja au bidhaa'],clear:['Clear search','Effacer la recherche','Longola boluki','Futa utafutaji'],
 empty_action_required:['No orders need your attention.','Aucune commande à traiter.','Komande ya kosala ezali te.','Hakuna maagizo yanayohitaji hatua.'],
 empty_in_progress:['No orders in progress.','Aucune commande en cours.','Komande ezali kosalema te.','Hakuna maagizo yanayoendelea.'],
 empty_completed:['No completed orders yet.','Aucune commande terminée pour le moment.','Komande esili naino te.','Hakuna maagizo yaliyokamilika bado.'],
 empty_cancelled:['No cancelled or expired orders.','Aucune commande annulée ou expirée.','Komande elongolami to esili ntango ezali te.','Hakuna maagizo yaliyoghairiwa au kuisha muda.'],
 empty_all:['No orders yet.','Aucune commande pour le moment.','Komande ezali naino te.','Hakuna maagizo bado.'],
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
