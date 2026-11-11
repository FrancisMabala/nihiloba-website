import {marketName} from "../../lib/public-markets";
import type {ServiceLocale} from "../../lib/services-i18n";

const loading = {en:"Loading open offers…",fr:"Chargement des offres…",ln:"Tozali kozwa misala…",sw:"Inapakia nafasi za kazi…"};
export function JobFeedLoading({locale}:{locale:ServiceLocale}){return <section className="section" aria-live="polite" aria-busy="true"><div className="container job-loading"><p className="eyebrow">SHIDA · {marketName(locale,"emplois")}</p><h1>{loading[locale]}</h1><div className="job-result-list" aria-hidden="true"><div className="job-result marketplace-skeleton"/><div className="job-result marketplace-skeleton"/><div className="job-result marketplace-skeleton"/></div></div></section>;}
