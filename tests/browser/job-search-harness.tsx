import {createRoot} from 'react-dom/client';
import type {AnchorHTMLAttributes} from 'react';
import {JobRelationshipActions} from '../../app/components/shida/job-relationship-actions';
import {JobSearchSpace} from '../../app/components/shida/job-search-space';
import type {jobSearchCopy} from '../../app/lib/job-search-copy';

// Only Next navigation adapters are replaced; the tested UI and login are real.
export function usePathname(){return window.location.pathname;}
export function useSearchParams(){return new URLSearchParams(window.location.search);}
export function useRouter(){return {push:(href:string)=>window.location.assign(href),replace:(href:string)=>window.location.replace(href),refresh:()=>window.location.reload()};}
export default function Link(props:AnchorHTMLAttributes<HTMLAnchorElement>){return <a {...props}/>;}
const query = new URLSearchParams(window.location.search);
const locale = (window.location.pathname.match(/^\/(fr|ln|sw)\//)?.[1] ?? 'en') as keyof typeof jobSearchCopy;
createRoot(document.getElementById('root')!).render(window.location.pathname.includes('/space') ?
  <JobSearchSpace locale={locale} binding={'a'.repeat(64)} initialSection={query.get('section') ?? 'overview'} onUnauthorized={()=>{document.body.dataset.unauthorized='true';}}/> :
  <JobRelationshipActions locale={locale} jobReference="JOB_fixture" canSave canFollow/>);
