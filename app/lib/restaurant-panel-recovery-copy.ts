import type {RestaurantLocale} from '../services/shida/restaurants-client';

export const restaurantPanelRecoveryCopy:Record<RestaurantLocale,{
 title:string;help:string;publicHelp:string;retry:string;back:string;reload:string;reloadHelp:string;
}>={
 fr:{title:'Cette rubrique n’a pas pu se charger.',help:'Réessayez ou revenez à votre espace.',publicHelp:'Réessayez ou revenez au marché.',retry:'Réessayer',back:'Revenir',reload:'Recharger la page',reloadHelp:'Si le problème persiste, rechargez la page pour obtenir la version actuelle. Les modifications non enregistrées peuvent être perdues.'},
 en:{title:'This section could not load.',help:'Try again or return to your workspace.',publicHelp:'Try again or return to the marketplace.',retry:'Try again',back:'Go back',reload:'Reload page',reloadHelp:'If the problem continues, reload the page to get the current version. Unsaved changes may be lost.'},
 ln:{title:'Eteni oyo ekokaki kofungwama te.',help:'Meka lisusu to zonga na esika na yo.',publicHelp:'Meka lisusu to zonga na zando.',retry:'Meka lisusu',back:'Zonga',reload:'Fungola lokasa lisusu',reloadHelp:'Soki mokakatano ezali kaka, fungola lokasa lisusu mpo na kozwa version ya sika. Mbongwana oyo ebombami te ekoki kobunga.'},
 sw:{title:'Sehemu hii haikuweza kufunguka.',help:'Jaribu tena au rudi kwenye nafasi yako.',publicHelp:'Jaribu tena au rudi sokoni.',retry:'Jaribu tena',back:'Rudi',reload:'Pakia ukurasa upya',reloadHelp:'Tatizo likiendelea, pakia ukurasa upya ili kupata toleo la sasa. Mabadiliko ambayo hujahifadhi yanaweza kupotea.'},
};
