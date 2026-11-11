import {SpaceIcon} from './account-space-icon';
import {MarketplaceImage} from './marketplace-image';
import {employerCopy} from '../../lib/employer-page-copy';
import {jobSearchCopy} from '../../lib/job-search-copy';
import type {JobSearchItem,JobSearchList} from '../../lib/job-search-api';

export const followListCopy={
 fr:{one:'offre ouverte',many:'offres ouvertes',none:'Aucune offre ouverte',removed:'Vous ne suivez plus {name}.'},
 en:{one:'open vacancy',many:'open vacancies',none:'No open vacancies',removed:'You no longer follow {name}.'},
 ln:{one:'mosala ya polele',many:'misala ya polele',none:'Mosala ya polele ezali te',removed:'Otiki kolanda {name}.'},
 sw:{one:'nafasi wazi',many:'nafasi wazi',none:'Hakuna nafasi wazi',removed:'Hufuati tena {name}.'}
};
export function FollowedEmployers({locale,list,destination,remove,busy,retry}:{locale:keyof typeof jobSearchCopy;list:JobSearchList;destination:(item:JobSearchItem)=>string;remove:(item:JobSearchItem)=>void;busy:boolean;retry:()=>void}){
 const t=jobSearchCopy[locale],c=followListCopy[locale],owner=employerCopy[locale];
 if(!list.items.length)return <p>{t.emptyFollowing}</p>;
 return <div className="workspace-records candidate-application-list">{list.items.map(item=>{
  const href=item.available&&item.reference?destination(item):null,n=item.open_job_count;
  return <article key={item.relation_ref} className="workspace-record">
   <span className="workspace-record-icon follow-tile" aria-hidden="true"><MarketplaceImage src={item.logo??null} sizes="48px" alt="" fallback={Array.from(item.name?.trim()||'')[0]?.toLocaleUpperCase(locale)||'•'}/></span>
   <div className="workspace-record-body"><h3>{item.name||t.unavailable}</h3>
    {item.management_status&&<p>{item.management_status==='managed'?owner.managed+' '+item.name:owner.created}</p>}
    {href&&typeof n==='number'&&(n===0?<p>{c.none}</p>:<a className="workspace-inline-link" href={href+(item.kind==='company'&&!item.employer_ref?'?view=jobs':'')+'#vacancies'}><SpaceIcon name="management"/>{new Intl.NumberFormat(locale).format(n)} {n===1?c.one:c.many} →</a>)}
    {href&&item.metadata_error&&<div role="alert">{t.error} <button onClick={retry}>{t.retry}</button></div>}
   </div><div className="workspace-record-actions">{href&&<a href={href}>{t.organisation} →</a>}<button type="button" disabled={busy} onClick={()=>remove(item)}>{t.unfollow}</button></div>
  </article>;
 })}</div>;
}
