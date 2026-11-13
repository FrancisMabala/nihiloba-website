import {offerPrice,catalogCopy} from "../../lib/service-catalog";
import Link from 'next/link';
import type {PublicServiceProvider,PublicServiceSummary,ServiceReviewCollection} from '../../types/shida-public';
import {professionalAction,professionalBase,professionalCategory,storefrontCopy} from '../../lib/professional-storefront';
import {servicesLocalizedPath,type ServiceLocale} from '../../lib/services-i18n';
import {safePublicExternalUrl,safePublicImageUrl} from '../../lib/safe-public-url';
import {MarketplaceImage} from './marketplace-image';
import {ProfessionalCategoryArt} from './professional-illustration';
import {ProfessionalShare} from './professional-share';
import './professional-storefront.css';

type Labels={category:(category:string)=>string;mode:(service:PublicServiceSummary)=>string|null;duration:(minutes:number)=>string;unavailable:string;empty:string;external:string};
export function ProfessionalStorefront({profile,reviews,locale,labels}:{profile:PublicServiceProvider;reviews?:ServiceReviewCollection;locale:ServiceLocale;labels:Labels}){
 const t=storefrontCopy[locale],category=professionalCategory(profile),base=professionalBase(profile),path=servicesLocalizedPath(locale,`/shida/services/providers/${encodeURIComponent(profile.slug)}`);
 const modes=[...new Set(profile.services.map(labels.mode).filter(Boolean))],social=safePublicExternalUrl(profile.social_link),bookable=profile.services.filter(s=>professionalAction(s)==='book'),quotable=profile.services.filter(s=>professionalAction(s)==='quote');
 const serviceHref=(s:PublicServiceSummary)=>servicesLocalizedPath(locale,`/shida/services/${encodeURIComponent(s.slug)}`);
 const action=bookable.length?t.book:quotable.length?t.quote:t.choose;
 return <div className="services-public professional-storefront"><div className="container">
  <Link className="professional-return" href={servicesLocalizedPath(locale,'/shida/services?mode=professionals')}>← {t.back}</Link>
  <header className="professional-hero" data-category={category}>
   <div className="professional-identity service-provider-header">
    <div className="professional-avatar"><MarketplaceImage src={safePublicImageUrl(profile.profile_image?.url)} alt={profile.name} fallback={profile.name.split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase()} sizes="(max-width:600px) 76px, 132px"/></div>
    <div className="professional-name"><p className="professional-category">{profile.categories.map(labels.category).join(' · ')}</p><h1>{profile.name}</h1>{base&&<p className="professional-base">{t.base}: {base}</p>}<div className="professional-modes">{modes.map(mode=><span key={mode}>{mode}</span>)}</div></div>
    <ProfessionalCategoryArt category={category}/>
   </div>
   <div className="professional-actions">{profile.services.length>0&&<a className="professional-primary" href="#professional-services">{action} <span aria-hidden="true">↓</span></a>}<ProfessionalShare locale={locale} path={path} name={profile.name}/></div>
  </header>
  <nav className="professional-nav" aria-label={profile.name}><a href="#professional-services">{t.services} ({profile.services.length})</a><a href="#professional-about">{t.about}</a><a href="#professional-reviews">{t.reviews}</a></nav>
  <div className="professional-columns"><section id="professional-services" tabIndex={-1}><h2>{t.services}</h2>
   {profile.services.length?<div className="professional-service-list">{profile.services.map(item=>{const image=safePublicImageUrl(item.image_preview?.url),kind=professionalAction(item),price=item.starting_price?.price,formatted=price?/[A-Za-z]{3}|[$€£]/.test(price)?price:`${price}${item.starting_price?.currency?` ${item.starting_price.currency}`:''}`:null;return <article className="professional-service-row" key={item.public_ref} data-category={item.category}>
    <Link className="professional-service-photo" href={serviceHref(item)} aria-label={item.service_name}>{image?<MarketplaceImage src={image} alt={item.image_preview?.alt||item.service_name} fallback={labels.category(item.category)} sizes="88px"/>:<ProfessionalCategoryArt category={item.category}/>}</Link>
    <div className="professional-service-text"><h3><Link href={serviceHref(item)}>{item.service_name}</Link></h3><p>{labels.category(item.category)}{item.duration_minutes!=null?` · ${item.availability_mode==="flexible"?catalogCopy(locale).estimated+" · ":""}${labels.duration(item.duration_minutes)}`:''}</p>{labels.mode(item)&&<small>{labels.mode(item)}</small>}{item.offer_terms?.pricing?<strong>{offerPrice(item.offer_terms,locale)}</strong>:formatted&&<strong>{t.from} {formatted}</strong>}</div>
    <Link className={kind==='book'?'professional-primary professional-service-action':'professional-service-action'} href={`${serviceHref(item)}${kind==='details'?'':'#booking'}`}>{t[kind]} <span aria-hidden="true">→</span></Link>
   </article>;})}</div>:<p className="professional-empty">{labels.empty}</p>}
  </section><aside className="professional-information">
   <section id="professional-about" tabIndex={-1}><h2>{t.about}</h2>{profile.bio?profile.bio.split(/\r?\n/).filter(Boolean).map((p,i)=><p key={i}>{p}</p>):<p>{t.noBio}</p>}
    {base&&<p><strong>{t.base}</strong><br/>{base}</p>}{modes.length>0&&<p><strong>{t.modes}</strong><br/>{modes.join(' · ')}</p>}
    {profile.workplace&&<details><summary>{t.publicAddress}</summary><p>{[profile.workplace.workplace_name,profile.workplace.city,profile.workplace.commune,profile.workplace.quartier,profile.workplace.avenue,profile.workplace.landmark].filter(Boolean).join(' · ')}</p></details>}
    {!profile.workplace&&profile.location.address_visibility==='public'&&(profile.location.address||profile.location.landmark)&&<details><summary>{t.publicAddress}</summary><p>{[profile.location.address,profile.location.landmark].filter(Boolean).join(' · ')}</p></details>}
    {social&&<a href={social} target="_blank" rel="noopener noreferrer">{labels.external} ↗</a>}
   </section>
   <section id="professional-reviews" className="professional-reviews" tabIndex={-1}><h2><span aria-hidden="true">☆</span> {t.reviews}</h2>{reviews?.items.length?reviews.items.map((review,index)=><article key={index}><span aria-label={`${review.rating}/5`}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span><p>{review.comment}</p><small>{t.reviewer}{review.created_at&&/^\d{4}-\d{2}-\d{2}$/.test(review.created_at)?` · ${new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(`${review.created_at}T12:00:00Z`))}`:''}</small></article>):<p>{reviews?t.none:labels.unavailable}</p>}</section>
  </aside></div>
 </div></div>;
}
