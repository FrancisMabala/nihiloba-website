import {personalSpaceMobileCopy} from '../../lib/personal-space-mobile-copy';
import type {ActivityData} from '../../lib/use-personal-activity-data';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {managementSelectorCopy} from '../../lib/management-selector-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';
import {SpaceIcon} from './account-space-icon';

/** Records come only from the authenticated management list endpoints. Destination APIs recheck authority. */
export function ManagementSpaceSelector({locale,data,onRetry}:{locale:MarketplaceLocale;data:ActivityData|null;onRetry:()=>void}){
 const c=managementSelectorCopy[locale],t=accountSpaceCopy[locale],prefix=locale==='en'?'':`/${locale}`;
 const seen=new Set<string>(),items=data?.items.filter(row=>{if(row.market==='wenze'&&row.individual)return false;const key=row.market+':'+(row.providerRef||row.ref);if(seen.has(key))return false;seen.add(key);return true;})??[];
 return <section className="management-space-selector"><h1>{c.title}</h1><p>{c.intro}</p>{!data?<p role="status">{t.loading}</p>:<>
  {data.failed&&<p role="alert">{mySpaceCopy[locale].loadError} <button type="button" onClick={onRetry}>{t.retry}</button></p>}
  <div className="management-space-cards">{items.map(row=><a key={row.market+row.ref} href={`${prefix}/shida/seller/${row.market}?${row.query}`}><SpaceIcon name={row.market==='wenze'?'shop':row.market==='restaurants'?'restaurant':'tool'}/><span><strong>{row.name||mySpaceCopy[locale].unnamed}</strong><small>{c[row.market]}</small></span><span aria-hidden="true">›</span></a>)}</div>
  {!items.length&&!data.failed&&<p>{c.empty}</p>}
  {data.business&&<p><a href="https://business.nihiloba.com/">{c.organization} →</a></p>}
  <section className="personal-selling-shortcut"><h2>{personalSpaceMobileCopy[locale].personalSales}</h2><div className="management-space-cards"><a href={`${prefix}/shida/space?view=listings&tab=article`}><SpaceIcon name="orders"/><span><strong>{personalSpaceMobileCopy[locale].personal}</strong><small>{personalSpaceMobileCopy[locale].personalHelp}</small></span><span aria-hidden="true">›</span></a></div></section><p className="space-note">{c.note}</p><a href={`${prefix}/shida/space?view=management`}>{c.create} →</a>
 </>}</section>;
}
