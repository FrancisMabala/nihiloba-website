import {workspaceText} from './personal-workspace-copy';
export function restaurantWorkspaceGroups(locale:'en'|'fr'|'ln'|'sw'){
 return [
 {label:workspaceText(locale,'daily'),keys:['today','pos','counter','orders','service']},
 {label:workspaceText(locale,'menuStock'),keys:['items','categories','batch','inventory','offerings','intake']},
 {label:workspaceText(locale,'customers'),keys:['reservations','reviews','daily','recovery','activity']},
 {label:workspaceText(locale,'settings'),keys:['settings','profile','hours','sharing','photos','preview','paymentMethods']},
 ];
}
