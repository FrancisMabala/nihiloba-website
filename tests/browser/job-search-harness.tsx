import {PersonalListings,MissionApply} from '../../app/components/shida/personal-missions';
import {WenzeApiProvider} from '../../app/lib/wenze-seller-api';
import {PersonalOfferSpace} from '../../app/components/shida/personal-offer-space';
import {AccountSecurity} from '../../app/components/shida/account-security';
import {ExternalJobAction} from '../../app/components/shida/job-public-actions';
import {createRoot} from 'react-dom/client';
import type {AnchorHTMLAttributes} from 'react';
import {JobRelationshipActions} from '../../app/components/shida/job-relationship-actions';
import {JobSearchSpace} from '../../app/components/shida/job-search-space';
import {SpaceSidebar} from '../../app/components/shida/space-sidebar';
import '../../app/components/shida/account-space.css';
import '../../app/components/shida/activities-design.css';
import {jobSearchCopy} from '../../app/lib/job-search-copy';

// Only Next navigation adapters are replaced; the tested UI and login are real.
export function usePathname(){return window.location.pathname;}
export function useSearchParams(){return new URLSearchParams(window.location.search);}
export function useRouter(){return {push:(href:string)=>window.location.assign(href),replace:(href:string)=>window.location.replace(href),refresh:()=>window.location.reload()};}
export default function Link(props:AnchorHTMLAttributes<HTMLAnchorElement>){return <a {...props}/>;}
const query = new URLSearchParams(window.location.search);
const locale = (window.location.pathname.match(/^\/(fr|ln|sw)\//)?.[1] ?? 'en') as keyof typeof jobSearchCopy;
createRoot(document.getElementById('root')!).render(window.location.pathname.includes('/space') ?
  <main className="account-space" lang={locale}><SpaceSidebar view="job-search" locale={locale}/><div className="space-content"><h1>{jobSearchCopy[locale].title}</h1>{query.get('view')==='listings'?<WenzeApiProvider binding={'a'.repeat(64)} onUnauthorized={()=>{}}><PersonalListings binding={'a'.repeat(64)} locale={locale}/></WenzeApiProvider>:query.get('kind')==='apply'?<MissionApply binding={'a'.repeat(64)} locale={locale} offer={query.get('offer')!}/>:query.get('view')==='job-offer'?<PersonalOfferSpace binding={'a'.repeat(64)} locale={locale} onUnauthorized={()=>{document.body.dataset.unauthorized='true'}}/>:query.get('view')==='settings'?<AccountSecurity binding={'a'.repeat(64)} locale={locale}/>:<JobSearchSpace locale={locale} binding={'a'.repeat(64)} initialSection={query.get('section') ?? 'overview'} onUnauthorized={()=>{document.body.dataset.unauthorized='true';}}/>}</div></main> :
  <><JobRelationshipActions locale={locale} jobReference={window.location.pathname.split('/').filter(Boolean).pop()!} canSave canFollow/>
   {query.has('external')&&<ExternalJobAction locale={locale} jobReference={window.location.pathname.split('/').filter(Boolean).pop()!} action={{mode:'redirect',action:'redirect',endpoint:'external-action'}}/>}</>);
