import { EmployerPageView } from "./employer-page-view";
import {MarketplaceWelcome} from "./marketplace-welcome";
import {SpaceIcon} from "./account-space-icon";
import {JobRelationshipActions} from "./job-relationship-actions";
import {employerCopy} from "../../lib/employer-page-copy";
import {JobCategories, JobCategoryIcon, jobDiscoveryCopy, type JobCategory} from "./job-discovery-ui";
import {ActiveSearchFilters} from "./active-search-filters";
import {marketplaceDiscoveryCopy} from "../../lib/marketplace-discovery-copy";
import type {Metadata} from "next";
import {JobsDiscoveryHero, JobsInvitations, jobsFinalCopy} from "./jobs-discovery-final";
import Link from "next/link";
import "./jobs-public.css";
import type {ServiceLocale as Locale} from "../../lib/services-i18n";
import {safePublicImageUrl} from "../../lib/safe-public-url";
import {getJobPreview, getJobEmployer, getJobs, getJobCategories, jobSearchQuery, ShidaApiError} from "../../services/shida/public-client";
import type {JobCollection, JobSearch, PublicJobEmployer} from "../../types/shida-public";
import {ButtonLink} from "../button-link";
import {listingText} from "../../lib/personal-missions-copy";
import "./mission-management.css";
import {MarketplaceImage} from "./marketplace-image";
import {marketplacePath, MarketplaceState} from "./marketplace";
import {JobAccess} from "./job-access";
import {copy, discoveryCopy, employerLocation, contractLabel, JobCard, JobUnavailable} from "./job-presentation";
export {JobDetailPage} from "./job-detail-reader";
function viewHref(locale:Locale,search:JobSearch,view:"professional"|"individual"){return `${marketplacePath(locale,"/shida/emplois")}${jobSearchQuery({...search,view,page:1})}`;}
function pageHref(locale:Locale,search:JobSearch,page:number){return `${marketplacePath(locale,"/shida/emplois")}${jobSearchQuery({...search,page})}`;}
function JobFilters({locale,search}:{locale:Locale;search:JobSearch}) {
  const t=copy[locale];
  return <form className="jobs-public-filters mp-search" action={marketplacePath(locale,"/shida/emplois")} method="get" role="search" aria-label={t.search}>
    {search.category&&<input type="hidden" name="category" value={search.category}/>}{search.view&&<input type="hidden" name="view" value={search.view}/>}
    <div className="jobs-search-primary mp-search-primary">
      <label>{t.search}<input type="search" name="query" defaultValue={search.query} placeholder={jobsFinalCopy[locale].placeholder} maxLength={120}/></label>
      <label>{t.city}<input name="city" defaultValue={search.city} placeholder={t.city} maxLength={120}/></label>
      <button className="button button-primary" type="submit">{marketplaceDiscoveryCopy[locale].search}<span aria-hidden="true">→</span></button>
    </div>
    <div className="jobs-search-secondary">
      <details open={Boolean(search.area||search.commune||search.contract)||undefined}>
        <summary>{t.filters}</summary>
        <div className="jobs-search-advanced">
          <label>{t.contract}<select name="contract" defaultValue={search.contract?.toLowerCase()||""}><option value="">—</option>{Array.from(new Set(["cdi","cdd","stage",...(search.contract?[search.contract.toLowerCase()]:[])])).map(key=><option key={key} value={key}>{contractLabel(key,locale)}</option>)}</select></label>
          <label>{t.area}<input name="area" defaultValue={search.area} maxLength={120}/></label>
          <label>{t.commune}<input name="commune" defaultValue={search.commune} maxLength={120}/></label>
        </div>
      </details>

    </div>
  <ActiveSearchFilters locale={locale} path={marketplacePath(locale,"/shida/emplois")} query={jobSearchQuery(search)} values={{contract: search.contract ? {[search.contract]:contractLabel(search.contract,locale)||search.contract} : {}}} labels={{contract:t.contract,query:t.search,city:t.city,area:t.area,commune:t.commune,category:jobDiscoveryCopy[locale].categories}}/>
  </form>;
}
function JobPagination({locale,search,collection}:{locale:Locale;search:JobSearch;collection:JobCollection}){const t=copy[locale],p=collection.pagination;if(p.total_pages<=1)return null;return <nav className="marketplace-pagination" aria-label={`${t.page} ${p.page} ${t.of} ${p.total_pages}`}><span>{p.page>1?<Link href={pageHref(locale,search,p.page-1)}>{t.previous}</Link>:t.previous}</span><span>{t.page} {p.page} {t.of} {p.total_pages}</span><span>{p.page<p.total_pages?<Link href={pageHref(locale,search,p.page+1)}>{t.next}</Link>:t.next}</span></nav>;}
export async function JobCollectionPage({locale,search,initialOffer}:{locale:Locale;search:JobSearch;initialOffer?:string}) {
  const t=copy[locale],d=discoveryCopy[locale],u=jobDiscoveryCopy[locale];
  let collection:JobCollection|undefined;
  try { collection=await getJobs({...search,page:search.page??1,page_size:search.page_size??12},locale); }
  catch(error){if(!(error instanceof ShidaApiError)||error.kind==="not-found")throw error;}
  let categories:JobCategory[]=[];
  try{categories=await getJobCategories(locale);}catch{/* Discovery still works if the optional catalog cannot load. */}
  const activeItems=collection?.items??[];
  const filtered=Boolean(search.query||search.city||search.area||search.commune||search.contract||search.category||search.view||(search.page??1)>1);
  const welcome=collection?.pagination.total_items===0&&!filtered;
  const emptyMessage=filtered?u.filtered:u.empty;
  return <JobAccess locale={locale} initialOffer={initialOffer}><div className="jobs-public marketplace-public" lang={locale}>
    <div className="container">
      <JobsDiscoveryHero locale={locale}/>
    <section id="job-discovery" className="jobs-public-discovery" aria-labelledby="job-discovery-title">
      <JobFilters locale={locale} search={search}/>
      <JobCategories locale={locale} search={search} categories={categories}/><nav className="job-offer-tabs mp-chips" aria-label={t.jobs}>
        <Link href={pageHref(locale,{...search,view:undefined},1)} className={!search.view?"job-offer-tab-active":undefined} aria-current={!search.view?"page":undefined}>{d.all}</Link>
        <Link href={viewHref(locale,search,"professional")} className={search.view==="professional"?"job-offer-tab-active":undefined} aria-current={search.view==="professional"?"page":undefined}>{t.professional}</Link>
        <Link href={viewHref(locale,search,"individual")} className={search.view==="individual"?"job-offer-tab-active":undefined} aria-current={search.view==="individual"?"page":undefined}>{listingText(locale,'job')}</Link>
      </nav>
      <div className="jobs-results-heading mp-results-heading"><h2 id="job-discovery-title">{d.opportunities}</h2>{collection&&<p className="marketplace-result-count" role="status">{collection.pagination.total_items} {collection.pagination.total_items===1?t.result:t.results}</p>}</div>
      <div className="job-results" id="job-results">
        {collection?<>
          {activeItems.length?<div className="job-result-list">{activeItems.map(item=><JobCard key={item.public_ref} item={item} locale={locale}/>)}</div>:welcome?<MarketplaceWelcome market="emplois" locale={locale}><ButtonLink href={marketplacePath(locale,"/shida/space?view=job-search")}>{({fr:"Ma recherche d’emploi",en:"My job search",ln:"Boluki mosala na ngai",sw:"Utafutaji wangu wa kazi"})[locale]}</ButtonLink><ButtonLink variant="secondary" href={marketplacePath(locale,"/shida/space?view=job-offer")}>{({fr:"Publier une offre",en:"Post a job",ln:"Tia mosala",sw:"Chapisha nafasi ya kazi"})[locale]}</ButtonLink></MarketplaceWelcome>:<div className="job-view-empty"><JobCategoryIcon category={null}/><MarketplaceState>{emptyMessage}</MarketplaceState>{filtered&&<ButtonLink href={marketplacePath(locale,"/shida/emplois")} variant="secondary">{u.clear}</ButtonLink>}<ButtonLink href={marketplacePath(locale,"/shida")} variant="text">{t.exploreMarketplaces}</ButtonLink></div>}
          <JobPagination locale={locale} search={search} collection={collection}/>
        </>:<div className="job-api-error" role="alert"><MarketplaceState>{t.unavailable}</MarketplaceState><ButtonLink href={pageHref(locale,search,search.page??1)} variant="secondary">{t.retry}</ButtonLink></div>}
      </div>
    </section>
    {!welcome&&<JobsInvitations locale={locale}/>}
    </div>
  </div></JobAccess>;
}

export async function JobEmployerPage({locale,slug}:{locale:Locale;slug:string}) {
  const t=copy[locale], c=employerCopy[locale], jobsPath=marketplacePath(locale,"/shida/emplois");
  let employer:PublicJobEmployer;
  try { employer=await getJobEmployer(slug,locale); }
  catch(error) {
    if(error instanceof ShidaApiError) return error.kind==="not-found"?<JobUnavailable locale={locale} employer/>:<MarketplaceState>{t.unavailable}</MarketplaceState>;
    throw error;
  }
  const directory=employer.identity_type==="organization_directory", managed=employer.management_status==="managed";
  const invitation=directory && employer.management_status==="shida_created";
  const location=employerLocation(employer), ref=encodeURIComponent(employer.public_ref);
  const businessEntry=`https://business.nihiloba.com/employer-management/${ref}?lang=${locale}`;
  const registration=process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED==="true"
    ? `${marketplacePath(locale,"/shida/register")}?employer=${ref}` : businessEntry;
  return <JobAccess locale={locale}><div className="container employer-page">
    {directory && <EmployerPageView key={employer.public_ref} reference={employer.public_ref}/>}
    <Link className="employer-back" href={jobsPath}>← {c.back}</Link>
    <header>
      <div className="employer-title-row"><div className="employer-avatar"><MarketplaceImage src={safePublicImageUrl(employer.profile_image?.url)} alt="" fallback={Array.from(employer.name.trim())[0]?.toLocaleUpperCase(locale)||"•"} sizes="80px"/></div>
        <h1>{employer.name}</h1>
        {employer.identity_type!=="individual"&&<JobRelationshipActions locale={locale} employerReference={employer.public_ref} canFollow canSave={false}/>}
      </div>
      {(directory||managed)&&<p>{managed?`${c.managed} ${employer.name}`:c.created}</p>}
      {directory&&!managed&&<p>{c.intro}</p>}
      {employer.description&&<p>{employer.description}</p>}{location&&<p>{location}</p>}
    </header>
    <section id="vacancies" className="employer-vacancies"><h2>{employer.open_job_count?`${employer.open_job_count} ${employer.open_job_count===1?t.result:t.results}`:c.empty}</h2>
      {employer.jobs.length?<div className="job-result-list">{employer.jobs.map(item=><JobCard key={item.public_ref} item={item} locale={locale} forEmployer/>)}</div>:<Link href={jobsPath}>{c.back} →</Link>}
    </section>
    {invitation&&<aside className="employer-invitation"><SpaceIcon name="business"/><div><h2>{c.represent.replace("{name}",employer.name)}</h2><p>{c.body}</p><p>{c.review}</p>
      <div className="employer-entry-links"><ButtonLink href={registration} variant="secondary">{c.create}</ButtonLink>
      <a href={businessEntry}>{c.login} →</a></div></div></aside>}
  </div></JobAccess>;
}

function metadataBase(locale:Locale,path:string,title:string,description:string|undefined,image:string|null):Metadata{const canonical=marketplacePath(locale,path);return {title,description,alternates:{canonical,languages:{en:path,fr:`/fr${path}`,ln:`/ln${path}`,sw:`/sw${path}`,"x-default":path}},openGraph:{title,description,url:canonical,images:[{url:image||"/NIHILOBA_logo.png",alt:title}]}};}
export function jobsMetadata(locale:Locale):Metadata{const t=copy[locale];return metadataBase(locale,"/shida/emplois",t.title,t.intro,null);}
export async function jobMetadata(locale:Locale,slug:string):Promise<Metadata>{
  try {
    const item=await getJobPreview(slug,locale);
    return metadataBase(locale,`/shida/emplois/${item.slug||item.public_ref}`,`${item.title} — ${item.employer.name} | SHIDA`,item.summary_preview||undefined,safePublicImageUrl(item.employer.profile_image?.url));
  } catch {return {title:copy[locale].jobs,robots:{index:false,follow:false}};}
}
export async function jobEmployerMetadata(locale:Locale,slug:string):Promise<Metadata>{try{const item=await getJobEmployer(slug,locale),location=employerLocation(item),description=locale==="fr"?`${item.open_job_count} offre${item.open_job_count===1?"":"s"} ouverte${item.open_job_count===1?"":"s"}${location?` à ${location}`:""} sur SHIDA.`:`${item.open_job_count} open job${item.open_job_count===1?"":"s"}${location?` in ${location}`:""} on SHIDA.`;return metadataBase(locale,`/shida/emplois/employeurs/${item.slug||item.public_ref}`,`${item.name} | SHIDA`,item.description||description,safePublicImageUrl(item.profile_image?.url));}catch{return {title:copy[locale].employerUnavailable,robots:{index:false,follow:false}};}}

export {JobCard} from "./job-presentation";
