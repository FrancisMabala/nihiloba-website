import {candidateWorkspaceCopy} from '../../lib/candidate-workspace-copy';
import {jobSearchCopy} from '../../lib/job-search-copy';
import {jobOverviewCopy} from '../../lib/job-overview-copy';
import type {JobSearchItem,JobSearchList} from '../../lib/job-search-api';
import {SpaceIcon} from './account-space-icon';

export const savedCopy={
 fr:{unavailable:'Offre indisponible',removed:'Offre retirée de votre liste.'},
 en:{unavailable:'Job unavailable',removed:'Job removed from your list.'},
 ln:{unavailable:'Offre ezali lisusu te',removed:'Offre elongwe na liste na yo.'},
 sw:{unavailable:'Nafasi haipatikani',removed:'Nafasi imeondolewa kwenye orodha yako.'}
};

export function SavedOffers({locale,list,destination,remove,busy}:{locale:keyof typeof jobSearchCopy;list:JobSearchList;destination:(item:JobSearchItem)=>string;remove:(item:JobSearchItem)=>void;busy:boolean}){
 const t=jobSearchCopy[locale],u=jobOverviewCopy[locale];
 if(!list.items.length)return <p>{t.emptySaved}</p>;
 return <div className="workspace-records candidate-application-list">{list.items.map(item=>{
  const accessible=item.available&&!!item.reference;
  const status=item.status==='open'?u.open:item.status==='expired'?t.expired:['closed','archived'].includes(item.status??'')?u.closed:t.unavailable;
  return <article className="workspace-record" key={item.relation_ref}>
   <span className="workspace-record-icon"><SpaceIcon name="bookmark"/></span>
   <div className="workspace-record-body"><h3>{accessible?item.name:savedCopy[locale].unavailable}</h3>
    {accessible&&<><p>{[item.employer_name,item.location].filter(Boolean).join(' · ')}</p>{item.external_redirect&&<p>{candidateWorkspaceCopy[locale].external}</p>}<div className="search-badges">
     {item.origin&&<span>{item.origin==='external'?t.external:u.direct}</span>}<span data-open={item.status==='open'}>{status}</span></div></>}
   </div>
   <div className="workspace-record-actions">{accessible&&<a href={destination(item)}>{t.open} →</a>}<button type="button" disabled={busy} onClick={()=>remove(item)}>{t.remove}</button></div>
  </article>;
 })}</div>;
}
