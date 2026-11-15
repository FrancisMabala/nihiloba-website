import {workspaceText} from './personal-workspace-copy';
/** Legacy section identifiers remain valid; only their parent navigation changes. */
export function restaurantSection(key:string){
 if(['items','categories','batch','offerings'].includes(key))return 'items';
 if(['daily','recovery'].includes(key))return 'daily';
 if(['profile','settings','hours','intake','sharing','photos','preview','paymentMethods'].includes(key))return 'profile';
 if(['pos','counter','service'].includes(key))return 'pos';
 if(['kitchen','routing'].includes(key))return 'orders';
 return key;
}
export function restaurantDestination(key:string){
 const aliases:Record<string,string>={menu:'items',finances:'daily',establishment:'profile',kitchen:'orders',routing:'orders'};
 const valid=['today','pos','counter','orders','items','offerings','categories','batch','inventory','reservations','daily','recovery','activity','reviews','profile','settings','hours','intake','sharing','photos','preview','paymentMethods','service'];
 return aliases[key]??(valid.includes(key)?key:'today');
}
export function restaurantWorkspaceGroups(locale:'en'|'fr'|'ln'|'sw'){
 return [
 {label:workspaceText(locale,'daily'),keys:['today','pos','counter','orders','service']},
 {label:workspaceText(locale,'menuStock'),keys:['items','categories','batch','inventory','offerings','intake']},
 {label:workspaceText(locale,'customers'),keys:['reservations','reviews','daily','recovery','activity']},
 {label:workspaceText(locale,'settings'),keys:['settings','profile','hours','sharing','photos','preview','paymentMethods']},
 ];
}
