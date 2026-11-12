'use client';
import {Fragment,useState,type CSSProperties,type ReactNode} from 'react';
import {overviewCopy} from '../../lib/activity-overview-copy';
import {overviewEntries,type ActivityKind} from '../../lib/overview-records';
import type {ActivityData} from '../../lib/use-personal-activity-data';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {accountSpaceCopy} from '../../lib/account-space-copy';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {activitiesDesignCopy} from '../../lib/activities-design-copy';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';
import {workspaceText} from '../../lib/personal-workspace-copy';
import {jobSearchCopy} from '../../lib/job-search-copy';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import './activity-overview.css';

const icons:Record<ActivityKind,SpaceIconName>={shop:'shop',restaurant:'restaurant',malewa:'restaurant',profile:'tool',job:'management',apartment:'home',hotel:'business',driver:'people',item:'orders'};
export function ActivityOverview({locale,current,creation,onRetry}:{locale:MarketplaceLocale;current:ActivityData|null;creation:ReactNode;onRetry:()=>void}){
 const [expanded,setExpanded]=useState<ActivityKind|null>(null),[creating,setCreating]=useState(false);
 const d=activitiesDesignCopy[locale],c=mySpaceCopy[locale],labels=overviewCopy[locale],prefix=locale==='en'?'':'/'+locale;
 if(!current?.overview)return <p role="status">{accountSpaceCopy[locale].loading}</p>;
 const entries=overviewEntries(locale,current.items,current.overview);
 const kinds=(Object.keys(labels) as ActivityKind[]).filter(kind=>entries.some(row=>row.kind===kind));
 const empty=!kinds.length&&!current.failed;
 return <section className="activity-overview">
   <header><h2>{accountNavigationCopy[locale].activities}</h2><button aria-expanded={creating} aria-controls="overview-create" onClick={()=>setCreating(!creating)}>{creating?d.close:'+ '+d.newActivity}</button></header>
   {creating&&<div id="overview-create">{creation}</div>}
   {current.failed&&<div role="alert">{workspaceText(locale,'partial')} <button onClick={onRetry}>{c.retry}</button></div>}
   {empty&&<div className="overview-welcome"><h3>{d.start}</h3><p>{d.empty}</p>{!creating&&creation}</div>}
   <div className="overview-grid">{kinds.map((kind,index)=>{
     const rows=entries.filter(row=>row.kind===kind),single=rows.length===1,open=expanded===kind;
     const [one,many,manage,choose,list]=labels[kind],id='overview-'+kind;
     const content=<><SpaceIcon name={icons[kind]}/><span><strong>{single?one:many.replace('{n}',String(rows.length))}</strong>{single&&<span>{rows[0].name||c.unnamed}</span>}{single&&rows[0].location&&<small>{rows[0].location}</small>}<span className="overview-action">{single?manage:choose} <span aria-hidden="true">{single?'→':open?'⌃':'⌄'}</span></span></span></>;
     const card={className:'overview-card',style:{order:2*index},'data-kind':kind};
     return <Fragment key={kind}>{single?<a {...card} href={rows[0].url}>{content}</a>:<button {...card} aria-expanded={open} aria-controls={id} onClick={()=>setExpanded(open?null:kind)}>{content}</button>}
     {open&&!single&&<section id={id} className="overview-options" aria-label={list} style={{'--wide':Math.floor(index/4)*8+7,'--medium':Math.floor(index/2)*4+3,'--narrow':2*index+1} as CSSProperties}><h3>{list}</h3><ul>{rows.map(row=><li key={row.ref}><a href={row.url}><SpaceIcon name={icons[kind]}/><span><strong>{row.name||c.unnamed}</strong>{row.location&&<small>{row.location}</small>}</span><span className="overview-row-action">{manage} <span aria-hidden="true">→</span></span></a></li>)}</ul></section>}</Fragment>;
   })}</div>
   <footer>{current.overview.seeker!==undefined&&<a href={prefix+'/shida/space?view='+(current.overview.seeker?'job-search':'candidate')}>{current.overview.seeker?jobSearchCopy[locale].title:d.seeker}</a>}
   <a href={prefix+'/shida'}>{d.explore}</a>
   <details className="space-legacy-help"><summary>{c.legacy}</summary><p>{c.legacyHelp}</p><a href={prefix+'/shida/space?view=support'}>{c.support}</a></details></footer>
 </section>;
}
