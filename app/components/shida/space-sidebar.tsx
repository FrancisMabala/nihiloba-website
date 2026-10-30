import type {MouseEventHandler} from 'react';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {marketplaceAccountCopy,type MarketplaceLocale} from './marketplace-account-copy';
export function SpaceSidebar({locale,view,onNavigate}:{locale:MarketplaceLocale;view:string;onNavigate?:MouseEventHandler<HTMLAnchorElement>}){
 const n=accountNavigationCopy[locale],t=accountSpaceCopy[locale],a=marketplaceAccountCopy[locale];
 const base=`${locale==='en'?'':`/${locale}`}/shida/space`;
 const entries:[string,string,SpaceIconName][]=[['management',n.activities,'management'],['transactions',n.transactions,'orders'],['messages',t.messages,'messages'],['settings',n.account,'settings']];
 return <aside className="space-sidebar"><h2>{a.space}</h2><nav aria-label={a.space}>{entries.map(([key,label,icon])=><a key={key} onClick={onNavigate} href={`${base}?view=${key}`} aria-current={(key===view||key==='transactions'&&['orders','requests','receipts'].includes(view))?'page':undefined}><SpaceIcon name={icon}/><span>{label}</span></a>)}</nav></aside>;
}
