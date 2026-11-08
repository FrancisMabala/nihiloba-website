import type {RestaurantLocale} from '../services/shida/restaurants-client';

export const orderDetailCopy: Record<RestaurantLocale, {tracking:string; summary:string; documents:string; payment:string; restaurant:string}> = {
 en: {tracking:'Order tracking', summary:'Order summary', documents:'Documents and receipt', payment:'Payment and fulfillment', restaurant:'Restaurant order'},
 fr: {tracking:'Suivi de la commande', summary:'Récapitulatif de commande', documents:'Documents et reçu', payment:'Paiement et remise', restaurant:'Commande restaurant'},
 ln: {tracking:'Kolanda commande', summary:'Bokuse ya commande', documents:'Mikanda mpe reçu', payment:'Kofuta mpe kozwa', restaurant:'Commande ya restaurant'},
 sw: {tracking:'Ufuatiliaji wa agizo', summary:'Muhtasari wa agizo', documents:'Nyaraka na risiti', payment:'Malipo na makabidhiano', restaurant:'Agizo la mgahawa'},
};

export const orderCancellationCopy = {
 en: {cancelTitle:'Cancel this order?', cancelHelp:'Confirm cancellation of this order.', requestTitle:'Request cancellation?', requestHelp:'The restaurant must review your request. The order remains active until cancellation is confirmed.', keep:'Keep the order', failed:'The cancellation could not be confirmed. Retry or refresh the order to check its current status.'},
 fr: {cancelTitle:'Annuler cette commande ?', cancelHelp:'Confirmez l’annulation de cette commande.', requestTitle:'Demander l’annulation ?', requestHelp:'Le restaurant doit examiner votre demande. La commande reste active tant que l’annulation n’est pas confirmée.', keep:'Conserver la commande', failed:'L’annulation n’a pas pu être confirmée. Réessayez ou actualisez la commande pour vérifier son état actuel.'},
 ln: {cancelTitle:'Kolongola commande oyo?', cancelHelp:'Ndima kolongola commande oyo.', requestTitle:'Kosenga kolongola commande?', requestHelp:'Restaurant esengeli kotala bosenga na yo. Commande ekotikala kino bandimi kolongola yango.', keep:'Bomba commande', failed:'Kolongola commande endimami te. Meka lisusu to fungola commande lisusu mpo na kotala ndenge ezali.'},
 sw: {cancelTitle:'Ghairi agizo hili?', cancelHelp:'Thibitisha kughairi agizo hili.', requestTitle:'Omba kughairi?', requestHelp:'Mgahawa lazima ukague ombi lako. Agizo linaendelea hadi kughairiwa kuthibitishwe.', keep:'Hifadhi agizo', failed:'Kughairi hakujathibitishwa. Jaribu tena au onyesha upya agizo ili kukagua hali yake.'},
};

export const orderEvidenceCopy = {
 en: {history:'Only the recorded creation date and current status are available. Intermediate transition times are not provided.', recorded:'Payment recorded by the restaurant', unknown:'Payment status unavailable', pending:'Cancellation requested — awaiting the restaurant’s decision.'},
 fr: {history:'Seuls la date de création enregistrée et l’état actuel sont disponibles. Les horaires des étapes intermédiaires ne sont pas fournis.', recorded:'Paiement enregistré par le restaurant', unknown:'État du paiement indisponible', pending:'Annulation demandée — en attente de la décision du restaurant.'},
 ln: {history:'Ezali kaka mokolo commande esalemaki mpe ndenge ezali sikoyo. Bantango ya biteni mosusu epesami te.', recorded:'Restaurant ekomi ete mbongo efutami', unknown:'Ndenge ya kofuta eyebani te', pending:'Bosenga ya kolongola commande — zela eyano ya restaurant.'},
 sw: {history:'Tarehe ya kuunda iliyorekodiwa na hali ya sasa tu zinapatikana. Nyakati za hatua za kati hazijatolewa.', recorded:'Malipo yamerekodiwa na mgahawa', unknown:'Hali ya malipo haipatikani', pending:'Kughairi kumeombwa — inasubiri uamuzi wa mgahawa.'},
};
