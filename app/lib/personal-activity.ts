import type {MarketplaceLocale} from '../components/shida/marketplace-account-copy';
import {workText} from './restaurant-work-copy';
import {progressText} from '../components/shida/wenze-order-timeline';
import {comparisonWords} from './services-comparison-copy';
import {workspaceText} from './personal-workspace-copy';
export type PersonalActivity={id:string;title:string;market:'restaurant'|'shop'|'requests';href:string;status:string;date:string|null;attention:boolean};
const jobLabels:Record<string,readonly string[]>={received:['Received','Reçue','Eyambami','Limepokelewa'],under_review:['Under review','En cours d’examen','Bazali kotala','Linakaguliwa'],shortlisted:['Shortlisted','Présélectionnée','Eponami liboso','Limeorodheshwa'],interview_proposed:['Interview proposed','Entretien proposé','Basengi entretien','Mahojiano yamependekezwa'],interview_confirmed:['Interview confirmed','Entretien confirmé','Entretien endimami','Mahojiano yamethibitishwa'],offered:['Offered','Offre reçue','Offre eyambami','Ofa imepokelewa'],hired:['Hired','Embauché','Ozwi mosala','Umeajiriwa'],rejected:['Rejected','Refusée','Eboyami','Limekataliwa'],withdrawn:['Withdrawn','Retirée','Elongolami','Limeondolewa'],closed:['Closed','Clôturée','Ekangami','Limefungwa']};
export function applicationStatus(locale:MarketplaceLocale,status:string){return jobLabels[status]?.[['en','fr','ln','sw'].indexOf(locale)]??workspaceText(locale,'review');}
export const activitySources=[['food','/api/shida/personal/restaurant-orders/?page=1&page_size=5'],['shops','/api/shida/personal/wenze-buyer/orders/?offset=0&limit=5'],['services','/api/shida/personal/service-requests/postings'],['jobs','/api/shida/employment/applications/']] as const;
export function activityRows(source:typeof activitySources[number][0],value:unknown,locale:MarketplaceLocale):PersonalActivity[]{
 const data=value as Record<string,unknown>,prefix=locale==='en'?'':`/${locale}`,bilingual=locale==='en'?'':'/fr';
 const field={food:'items',shops:'orders',services:'requests',jobs:'applications'}[source];
 if(!data||!Array.isArray(data[field]))throw Error('Unavailable activity');
 return (data[field] as Record<string,unknown>[]).slice(0,5).map(row=>{
  if(!row||typeof row!=='object')throw Error('Unavailable activity');
  const id=source==='food'?row.order_ref:source==='services'?row.posted_ref:row.reference;
  if(typeof id!=='string'||!id)throw Error('Unavailable activity');
  const date=source==='food'?row.submitted_at:row.created_at;
  const common={id:`${source}:${id}`,date:typeof date==='string'&&Number.isFinite(Date.parse(date))?date:null};
  const ref=encodeURIComponent(id);
  if(source==='food')return {...common,title:typeof row.establishment_name==='string'?row.establishment_name:'Restaurant',market:'restaurant',href:`${prefix}/shida/restaurant-orders/${ref}`,status:workText(locale,String(row.state)),attention:row.state==='ready'};
  if(source==='shops'){const state=(row.timeline as {current?:string}|undefined)?.current??'progress';return {...common,title:typeof row.store_name==='string'?row.store_name:'Wenze',market:'shop',href:`${bilingual}/shida/wenze/orders#${ref}`,status:progressText(locale,state),attention:state==='ready'};}
  if(source==='services'){const summary=row.summary as {description?:string}|undefined;return {...common,title:summary?.description||'Services',market:'requests',href:`${prefix}/shida/service-requests?request=${ref}`,status:comparisonWords(locale)[String(row.status) as keyof ReturnType<typeof comparisonWords>]??workspaceText(locale,'review'),attention:false};}
  return {...common,title:typeof row.job_title==='string'?row.job_title:workspaceText(locale,'applications'),market:'requests',href:`${locale==='fr'?'/fr/shida/mes-candidatures':`${prefix}/shida/my-applications`}/${ref}`,status:applicationStatus(locale,String(row.status)),attention:['interview_proposed','offered'].includes(String(row.status))};
 });
}
