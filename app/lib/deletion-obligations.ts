import {deletionUx} from './deletion-ux-copy';
import {workText} from './restaurant-work-copy';
export type DeletionLocale='en'|'fr'|'ln'|'sw';
export type DeletionObligation={reference:string;kind:string;action_path?:string|null;action?:string;display_name?:string|null;responsibility?:string|null;status?:string|null;occurred_at?:string|null};
export function obligationTitle(locale:DeletionLocale,item:DeletionObligation){
 const key=({organization_responsibilities:'organization',restaurant_order:'restaurant_order',restaurant_reservation:'restaurant_reservation',service:'service',wenze:'wenze',order:'orderTitle',seller_order:'orderTitle',hotel:'hotel',wewa:'wewa',refund:'refund'} as const)[item.kind as 'service']??'activity';
 const name=typeof item.display_name==='string'?item.display_name.trim().slice(0,160):'';
 return item.kind==='organization_responsibilities'?name||deletionUx(locale,key):deletionUx(locale,key)+(name?` · ${name}`:'');
}
export function obligationDetail(locale:DeletionLocale,item:DeletionObligation){
 if(item.kind==='organization_responsibilities')return deletionUx(locale,item.responsibility==='owner'?'owner':item.responsibility==='admin'?'admin':'resolve');
 const states=['pending','accepted','preparing','ready','out_for_delivery','completed','rejected','cancelled','expired','uncollected','delivery_failed'];
 const status=item.kind.startsWith('restaurant_')&&states.includes(item.status??'')?workText(locale,item.status as 'pending'):deletionUx(locale,'resolve');
 const date=item.occurred_at&&Number.isFinite(Date.parse(item.occurred_at))?new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(item.occurred_at)):'';
 return status+(date?` · ${date}`:'');
}
/** Accept only implemented, exact destinations; legacy/general links become contextual review. */
export function obligationHref(locale:DeletionLocale,item:DeletionObligation){
 const path=item.action_path??'';
 if(item.action==='organization'&&/^https:\/\/business\.nihiloba\.com\/businesses\/[A-Za-z0-9_-]+\/settings$/.test(path))return `${path}?lang=${locale}`;
 if(item.action==='activity'&&(/^\/shida\/restaurant-orders\/ROD_[A-Za-z0-9_-]+\/$/.test(path)||/^\/shida\/restaurant-reservations\/\?reservation=[A-Za-z0-9_-]+$/.test(path)))return `${locale==='en'?'':'/'+locale}${path}`;
 return null;
}
