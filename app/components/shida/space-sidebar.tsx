import {candidateCopy} from '../../lib/candidate-profile-copy';
import {universalSpaceCopy} from '../../lib/universal-space-copy';
import type {MouseEventHandler} from 'react';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {marketplaceAccountCopy,type MarketplaceLocale} from './marketplace-account-copy';
import {listingCopy} from '../../lib/wenze-listings-copy';
export function SpaceSidebar({locale,view,onNavigate,individualOnly=false,hasListings=false}:{locale:MarketplaceLocale;view:string;onNavigate?:MouseEventHandler<HTMLAnchorElement>;individualOnly?:boolean;hasListings?:boolean}){
 const n=accountNavigationCopy[locale],t=accountSpaceCopy[locale],a=marketplaceAccountCopy[locale];
 const base=`${locale==='en'?'':`/${locale}`}/shida/space`;
 const entries:[string,string,SpaceIconName][]=[['management',n.activities,'management'],['transactions',n.transactions,'orders'],['messages',t.messages,'messages'],['settings',n.account,'settings']];
 if(individualOnly&&view!=='job-offer')entries[0]=['listings',listingCopy[locale].title,'orders'];
 else if(hasListings||view==='listings')entries.splice(1,0,['listings',listingCopy[locale].title,'orders']);
 entries.splice(entries.findIndex(e=>e[0]==='transactions'),0,['candidate',candidateCopy[locale].title,'people']);
 entries.unshift(['overview',universalSpaceCopy[locale].overview,'home']);
 return <aside className="space-sidebar"><h2>{a.space}</h2><nav aria-label={a.space}>{entries.map(([key,label,icon])=><a key={key} onClick={onNavigate} href={`${base}?view=${key}`} aria-current={(key===view||key==='management'&&view==='job-offer'||key==='transactions'&&['orders','requests','receipts'].includes(view))?'page':undefined}><SpaceIcon name={icon}/><span>{label}</span></a>)}</nav></aside>;
}
