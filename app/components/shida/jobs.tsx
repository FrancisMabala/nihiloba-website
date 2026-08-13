import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "../../lib/i18n";
import { safePublicActionUrl, safePublicExternalUrl, safePublicImageUrl } from "../../lib/safe-public-url";
import { getJob, getJobEmployer, getJobs, jobSearchQuery, ShidaApiError } from "../../services/shida/public-client";
import type { JobCollection, JobSearch, PublicJob, PublicJobEmployer, PublicJobEmployerSummary, PublicJobSummary } from "../../types/shida-public";
import { ButtonLink } from "../button-link";
import { MarketplaceImage } from "./marketplace-image";
import { MarketplaceBreadcrumb } from "./marketplace-primitives";
import { marketplacePath, MarketplaceState, publicLocation } from "./marketplace";

const copy={
  en:{jobs:"💼 Jobs",title:"Jobs on SHIDA",intro:"Discover open opportunities and apply directly through SHIDA.",search:"Search jobs",placeholder:"Search jobs or employers…",city:"City",area:"Area",commune:"Commune",filters:"Location filters",applyFilters:"Search",clear:"Clear filters",result:"open job",results:"open jobs",empty:"No jobs match your search.",unavailable:"Jobs are temporarily unavailable. Please try again shortly.",details:"View job",employer:"Employer",location:"Location",compensation:"Compensation",published:"Published",description:"About this job",requirements:"Requirements",requirementsDocument:"Additional requirements information will be provided in SHIDA.",apply:"Apply on SHIDA",finalApply:"Interested in this job?",actionUnavailable:"Applications are temporarily unavailable for this job.",employerProfile:"Employer profile",openJobs:"Open jobs",noEmployerJobs:"This employer has no open jobs right now.",employerUnavailable:"This employer profile is no longer available.",jobUnavailable:"This job is no longer available.",back:"Back to jobs",previous:"Previous",next:"Next",page:"Page",of:"of",image:"Employer image unavailable",external:"Public employer profile"},
  fr:{jobs:"💼 Emplois",title:"Offres d’emploi sur SHIDA",intro:"Découvrez des offres ouvertes et postulez directement via SHIDA.",search:"Rechercher des offres",placeholder:"Rechercher un poste ou un employeur…",city:"Ville",area:"Zone",commune:"Commune",filters:"Filtres de localisation",applyFilters:"Rechercher",clear:"Effacer les filtres",result:"offre ouverte",results:"offres ouvertes",empty:"Aucune offre ne correspond à votre recherche.",unavailable:"Les offres d’emploi sont temporairement indisponibles. Veuillez réessayer bientôt.",details:"Voir l’offre",employer:"Employeur",location:"Localisation",compensation:"Rémunération",published:"Publié le",description:"À propos du poste",requirements:"Profil recherché / Exigences",requirementsDocument:"Des informations complémentaires sur les exigences seront fournies dans SHIDA.",apply:"Postuler sur SHIDA",finalApply:"Intéressé par cette offre ?",actionUnavailable:"Les candidatures sont temporairement indisponibles pour cette offre.",employerProfile:"Profil de l’employeur",openJobs:"Offres ouvertes",noEmployerJobs:"Cet employeur n’a aucune offre ouverte pour le moment.",employerUnavailable:"Ce profil d’employeur n’est plus disponible.",jobUnavailable:"Cette offre n’est plus disponible.",back:"Retour aux offres",previous:"Précédent",next:"Suivant",page:"Page",of:"sur",image:"Image de l’employeur indisponible",external:"Profil public de l’employeur"},
} as const;

function jobPath(locale:Locale,item:Pick<PublicJobSummary,"slug"|"public_ref">):string{return marketplacePath(locale,`/shida/emplois/${encodeURIComponent(item.slug||item.public_ref)}`);}
function employerPath(locale:Locale,item:Pick<PublicJobEmployerSummary,"slug"|"public_ref">):string{return marketplacePath(locale,`/shida/emplois/employeurs/${encodeURIComponent(item.slug||item.public_ref)}`);}
function jobLocation(item:PublicJobSummary):string{return item.location.display||publicLocation(item.location.quartier,item.location.commune,item.location.area,item.location.city);}
function employerLocation(item:PublicJobEmployerSummary):string{return publicLocation(item.area,item.city);}
function initials(name:string):string{return name.split(/\s+/).filter(Boolean).slice(0,2).map((part)=>part[0]?.toUpperCase()).join("")||"SH";}
function publishedDate(value:string|null,locale:Locale):string|null{if(!value)return null;const date=new Date(value);return Number.isNaN(date.getTime())?null:new Intl.DateTimeFormat(locale,{day:"numeric",month:"long",year:"numeric"}).format(date);}
function hasSearch(search:JobSearch):boolean{return Object.entries(search).some(([key,value])=>key!=="page_size"&&value!=null&&value!=="");}
function pageHref(locale:Locale,search:JobSearch,page:number):string{return `${marketplacePath(locale,"/shida/emplois")}${jobSearchQuery({...search,page})}`;}

function EmployerIdentity({employer,locale,large=false,heading=false}:{employer:PublicJobEmployerSummary;locale:Locale;large?:boolean;heading?:boolean}){
  const image=safePublicImageUrl(employer.profile_image?.url),href=employerPath(locale,employer),location=employerLocation(employer);
  return <div className={large?"job-employer-identity job-employer-identity-large":"job-employer-identity"}>
    <Link className="job-employer-image" href={href}><MarketplaceImage src={image} alt={employer.name} fallback={initials(employer.name)} sizes={large?"96px":"56px"}/></Link>
    <div>{heading?<h1 className="job-employer-name">{employer.name}</h1>:<Link className="job-employer-name" href={href}>{employer.name}</Link>}{large&&location&&<p>{location}</p>}</div>
  </div>;
}

export function JobCard({item,locale}:{item:PublicJobSummary;locale:Locale}){
  const t=copy[locale],href=jobPath(locale,item),location=jobLocation(item);
  return <article className="marketplace-card job-card"><div className="marketplace-card-body">
    <EmployerIdentity employer={item.employer} locale={locale}/>
    <h2><Link href={href}>{item.title}</Link></h2>
    {location&&<p className="marketplace-location">📍 {location}</p>}
    {item.description_preview&&<p className="marketplace-description job-description-preview">{item.description_preview}</p>}
    {item.compensation&&<p className="job-compensation">{item.compensation}</p>}
    <ButtonLink href={href} variant="text">{t.details}</ButtonLink>
  </div></article>;
}

function JobFilters({locale,search}:{locale:Locale;search:JobSearch}){const t=copy[locale];return <form className="marketplace-filters" action={marketplacePath(locale,"/shida/emplois")} method="get">
  <div className="marketplace-search-row"><label><span>{t.search}</span><input type="search" name="query" defaultValue={search.query} placeholder={t.placeholder}/></label><button className="button button-primary" type="submit">{t.applyFilters}</button></div>
  <details className="marketplace-advanced-filters" open={Boolean(search.city||search.area||search.commune)||undefined}><summary>{t.filters}</summary><div className="marketplace-filter-grid"><label>{t.city}<input name="city" defaultValue={search.city}/></label><label>{t.area}<input name="area" defaultValue={search.area}/></label><label>{t.commune}<input name="commune" defaultValue={search.commune}/></label></div></details>
  {hasSearch(search)&&<div className="marketplace-filter-actions"><Link href={marketplacePath(locale,"/shida/emplois")}>{t.clear}</Link></div>}
  </form>;}

function JobPagination({locale,search,collection}:{locale:Locale;search:JobSearch;collection:JobCollection}){const t=copy[locale],p=collection.pagination;if(p.total_pages<=1)return null;return <nav className="marketplace-pagination" aria-label={`${t.page} ${p.page} ${t.of} ${p.total_pages}`}><span>{p.page>1?<Link href={pageHref(locale,search,p.page-1)}>{t.previous}</Link>:t.previous}</span><span>{t.page} {p.page} {t.of} {p.total_pages}</span><span>{p.page<p.total_pages?<Link href={pageHref(locale,search,p.page+1)}>{t.next}</Link>:t.next}</span></nav>;}

export async function JobCollectionPage({locale,search}:{locale:Locale;search:JobSearch}){const t=copy[locale];let collection:JobCollection|undefined;try{collection=await getJobs({...search,page:search.page??1,page_size:search.page_size??12});}catch(error){if(!(error instanceof ShidaApiError)||error.kind==="not-found")throw error;}return <><section className="marketplace-heading"><div className="container"><p className="eyebrow">SHIDA · {t.jobs}</p><h1>{t.title}</h1><p>{t.intro}</p></div></section><section className="section marketplace-collection"><div className="container"><JobFilters locale={locale} search={search}/>{collection?<><p className="marketplace-result-count" role="status">{collection.pagination.total_items} {collection.pagination.total_items===1?t.result:t.results}</p>{collection.items.length?<div className="marketplace-grid job-grid">{collection.items.map((item)=><JobCard key={item.public_ref} item={item} locale={locale}/>)}</div>:<MarketplaceState>{t.empty}</MarketplaceState>}<JobPagination locale={locale} search={search} collection={collection}/></>:<MarketplaceState>{t.unavailable}</MarketplaceState>}</div></section></>;}

function JobUnavailable({locale,employer=false}:{locale:Locale;employer?:boolean}){const t=copy[locale];return <section className="section"><div className="container job-unavailable"><h1>{employer?t.employerUnavailable:t.jobUnavailable}</h1><ButtonLink href={marketplacePath(locale,"/shida/emplois")} variant="secondary">{t.back}</ButtonLink></div></section>;}

export async function JobDetailPage({locale,slug}:{locale:Locale;slug:string}){const t=copy[locale];let item:PublicJob|undefined;try{item=await getJob(slug);}catch(error){if(error instanceof ShidaApiError&&error.kind==="not-found")return <JobUnavailable locale={locale}/>;if(!(error instanceof ShidaApiError))throw error;}if(!item)return <MarketplaceState>{t.unavailable}</MarketplaceState>;
  const location=jobLocation(item),date=publishedDate(item.published_at,locale),action=safePublicActionUrl(item.apply_url),social=safePublicExternalUrl(item.public_social_link);
  const applyButton=action?<ButtonLink href={action} external>{t.apply}</ButtonLink>:null;
  return <><section className="marketplace-detail-hero job-detail-hero"><div className="container"><MarketplaceBreadcrumb label="Breadcrumb" items={[{label:"SHIDA",href:marketplacePath(locale,"/shida")},{label:t.jobs,href:marketplacePath(locale,"/shida/emplois")},{label:item.title}]}/><EmployerIdentity employer={item.employer} locale={locale} large/><h1>{item.title}</h1>{location&&<p className="marketplace-detail-location">📍 {location}</p>}<div className="job-detail-meta">{date&&<p className="job-published">{t.published} {date}</p>}{item.compensation&&<p className="job-hero-compensation"><span>{t.compensation}:</span> <strong>{item.compensation}</strong></p>}</div><div className="job-hero-action">{applyButton??<p className="marketplace-action-unavailable">{t.actionUnavailable}</p>}</div></div></section>
    <section className="section"><div className="container job-detail"><div className="marketplace-property-content">
      {item.description&&<section><h2>{t.description}</h2><p className="lead-copy">{item.description}</p></section>}
      {item.requirements_document.available&&<section><h2>{t.requirements}</h2><p>{t.requirementsDocument}</p></section>}
      <section><h2>{t.employer}</h2><EmployerIdentity employer={item.employer} locale={locale} large/><ButtonLink href={employerPath(locale,item.employer)} variant="text">{t.employerProfile}</ButtonLink>{social&&<p><a href={social} target="_blank" rel="noopener noreferrer">{t.external}</a></p>}</section>
      {applyButton&&<section className="job-final-action"><h2>{t.finalApply}</h2>{applyButton}</section>}
    </div></div></section></>;
}

export async function JobEmployerPage({locale,slug}:{locale:Locale;slug:string}){const t=copy[locale];let employer:PublicJobEmployer|undefined;try{employer=await getJobEmployer(slug);}catch(error){if(error instanceof ShidaApiError&&error.kind==="not-found")return <JobUnavailable locale={locale} employer/>;if(!(error instanceof ShidaApiError))throw error;}if(!employer)return <MarketplaceState>{t.unavailable}</MarketplaceState>;return <><section className="marketplace-detail-hero job-employer-hero"><div className="container"><MarketplaceBreadcrumb label="Breadcrumb" items={[{label:"SHIDA",href:marketplacePath(locale,"/shida")},{label:t.jobs,href:marketplacePath(locale,"/shida/emplois")},{label:employer.name}]}/><EmployerIdentity employer={employer} locale={locale} large heading/>{employer.description&&<p className="lead-copy">{employer.description}</p>}</div></section><section className="section"><div className="container"><h2>{t.openJobs} ({employer.open_job_count})</h2>{employer.jobs.length?<div className="marketplace-grid job-grid">{employer.jobs.map((item)=><JobCard key={item.public_ref} item={item} locale={locale}/>)}</div>:<MarketplaceState>{t.noEmployerJobs}</MarketplaceState>}</div></section></>;}

function metadataBase(locale:Locale,path:string,title:string,description:string|undefined,image:string|null):Metadata{const canonical=marketplacePath(locale,path);return {title,description,alternates:{canonical,languages:{en:path,fr:`/fr${path}`,"x-default":path}},openGraph:{title,description,url:canonical,images:[{url:image||"/NIHILOBA_logo.png",alt:title}]}};}
export function jobsMetadata(locale:Locale):Metadata{const t=copy[locale];return metadataBase(locale,"/shida/emplois",t.title,t.intro,null);}
export async function jobMetadata(locale:Locale,slug:string):Promise<Metadata>{try{const item=await getJob(slug),location=jobLocation(item),title=locale==="fr"?`${item.title} chez ${item.employer.name} | SHIDA`:`${item.title} at ${item.employer.name} | SHIDA`,description=[item.description_preview,location].filter(Boolean).join(" · ")||undefined;return metadataBase(locale,`/shida/emplois/${item.slug}`,title,description,safePublicImageUrl(item.employer.profile_image?.url));}catch{return {title:copy[locale].jobUnavailable,robots:{index:false,follow:false}};}}
export async function jobEmployerMetadata(locale:Locale,slug:string):Promise<Metadata>{try{const item=await getJobEmployer(slug),location=employerLocation(item),description=locale==="fr"?`${item.open_job_count} offre${item.open_job_count===1?"":"s"} ouverte${item.open_job_count===1?"":"s"}${location?` à ${location}`:""} sur SHIDA.`:`${item.open_job_count} open job${item.open_job_count===1?"":"s"}${location?` in ${location}`:""} on SHIDA.`;return metadataBase(locale,`/shida/emplois/employeurs/${item.slug}`,`${item.name} | SHIDA`,item.description||description,safePublicImageUrl(item.profile_image?.url));}catch{return {title:copy[locale].employerUnavailable,robots:{index:false,follow:false}};}}
