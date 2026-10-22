import Link from "next/link";
import type { ReactNode } from "react";
import { discoveryCopy, discoveryPath, type DiscoveryLocale } from "../../lib/discovery-copy";
import { getJobs, getServices, ShidaApiError } from "../../services/shida/public-client";
import { publicLocation } from "../shida/marketplace";
import { ServiceCard } from "../shida/services";
import { ArrowRightIcon, BriefcaseIcon } from "../icons";

async function available<T>(load: () => Promise<T>): Promise<T | null> {
  try { return await load(); } catch (error) { if (error instanceof ShidaApiError) return null; throw error; }
}
export function DiscoveryListingGroup({ locale, label, href, state, children }: { locale: DiscoveryLocale; label: string; href: string; state: "ready" | "empty" | "error"; children?: ReactNode }) {
  const t = discoveryCopy[locale];
  return <section className="discovery-group" aria-label={label}><div className="discovery-group-heading"><h3>{label}</h3><Link href={href}>{t.all}<ArrowRightIcon/></Link></div>
    {state === "ready" ? <div className="discovery-results">{children}</div> : <div className="discovery-state" role="status"><p>{state === "error" ? t.error : t.empty}</p>{state === "error" && <a href={discoveryPath(locale, "/shida")}>{t.retry}</a>}</div>}
  </section>;
}
export async function DiscoveryListings({ locale }: { locale: DiscoveryLocale }) {
  const t = discoveryCopy[locale], jobLocale = locale === "en" ? "en" : "fr";
  const [jobs, services] = await Promise.all([
    available(() => getJobs({ page: 1, page_size: 3 }, jobLocale)),
    available(() => getServices({ page: 1, page_size: 3 })),
  ]);
  return <div className="discovery-feed">
    <DiscoveryListingGroup locale={locale} label={t.labels[0]} href={discoveryPath(jobLocale, "/shida/emplois")} state={!jobs ? "error" : jobs.items.length ? "ready" : "empty"}>
      {jobs?.items.map(job => { const href = discoveryPath(jobLocale, `/shida/emplois/${encodeURIComponent(job.slug || job.public_ref)}`); return <article className="discovery-job" key={job.public_ref}>
        <span className="discovery-job-icon"><BriefcaseIcon/></span><h4><Link href={href}>{job.title}</Link></h4>
        {job.employer.name && <p>{job.employer.name}</p>}<p className="discovery-muted">{publicLocation(job.location.city, job.location.commune, job.location.area)}</p>
        {job.published_at && Number.isFinite(Date.parse(job.published_at)) && <time dateTime={job.published_at}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Africa/Kinshasa" }).format(new Date(job.published_at))}</time>}
        <Link className="discovery-detail" href={href}>{t.details}<ArrowRightIcon/></Link>
      </article>; })}
    </DiscoveryListingGroup>
    <DiscoveryListingGroup locale={locale} label={t.labels[1]} href={discoveryPath(locale, "/shida/services")} state={!services ? "error" : services.items.length ? "ready" : "empty"}>
      {services?.items.map(item => <ServiceCard key={item.public_ref} item={item} locale={locale}/>)}
    </DiscoveryListingGroup>
  </div>;
}
