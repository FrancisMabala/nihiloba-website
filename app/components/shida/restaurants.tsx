import {soloCopy} from '../../lib/restaurant-solo-copy';
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShidaApiError } from "../../services/shida/public-client";
import { getRestaurant, getRestaurantActions, getRestaurantBusiness, getRestaurantMenu, getRestaurantReviews, restaurantQuery, type Restaurant, type RestaurantLocale, type RestaurantMenuItem, type RestaurantSearch } from "../../services/shida/restaurants-client";
import { checkoutCopy } from "../../lib/restaurant-checkout-copy";
import { reservationCopy } from "../../lib/restaurant-reservation-copy";
import { reservationAvailability } from "../../services/shida/restaurant-reservations";
import { RestaurantGuest } from "./restaurant-guest";
import { businessPath, restaurantCopy, restaurantLocales, restaurantPath, restaurantReturn } from "../../lib/restaurant-i18n";
import { MarketplaceBreadcrumb } from "./marketplace-primitives";
import { RestaurantInterest } from './restaurant-interest';
import { RestaurantPhoto } from "./restaurant-photo";
import { RestaurantPrice } from "./restaurant-menu-price";
export { RestaurantPrice } from "./restaurant-menu-price";
import { RestaurantRevalidation } from "./restaurant-revalidation";
import { RestaurantRetry } from "./restaurant-retry";
import { restaurantDetailCopy, restaurantLanguageNames } from "../../lib/restaurant-detail-copy";
import { restaurantReviewCopy } from "../../lib/restaurant-review-copy";
import { RestaurantReviewForm, RestaurantReviewReport } from "./restaurant-review-form";
import "./restaurant-detail.css";

// Native document navigation deliberately re-reads eligibility rather than prefetching public projections.
function Internal({ href, children }: { href: string; children: React.ReactNode }) { return <a className="restaurant-link" href={href}>{children}</a>; }
function Languages({ locale, suffix = "", search = "", business }: { locale: RestaurantLocale; suffix?: string; search?: string; business?: string }) {
  return <nav className="restaurant-languages" aria-label={restaurantCopy[locale].language}>{restaurantLocales.map((lang) => <a key={lang} href={`${business ? businessPath(lang, business) : restaurantPath(lang, suffix)}${search ? `?${search}` : ""}`} hrefLang={lang} lang={lang} aria-current={locale === lang ? "page" : undefined}>{restaurantLanguageNames[lang]}</a>)}</nav>;
}
function Shell({ locale, title, children, suffix, search, business }: { locale: RestaurantLocale; title: string; children: React.ReactNode; suffix?: string; search?: string; business?: string }) {
  const t = restaurantCopy[locale];
  return <section className="section restaurant-public" lang={locale}><div className="container">
    <RestaurantRevalidation/>
    <MarketplaceBreadcrumb label={t.breadcrumb} items={[{ label: "SHIDA", href: locale === "en" ? "/shida" : "/fr/shida" }, { label: t.title, ...(suffix || business ? { href: restaurantPath(locale) } : {}) }, ...(suffix || business ? [{ label: title }] : [])]}/>
    <Languages locale={locale} suffix={suffix} search={search} business={business}/><h1>{title}</h1>{children}
  </div></section>;
}
export function restaurantMetadata(locale: RestaurantLocale, suffix = "", business?: string): Metadata {
  const path = business ? businessPath(locale, business) : restaurantPath(locale, suffix);
  // Static metadata contains neither private fields nor stale establishment previews.
  return { title: business ? restaurantCopy[locale].business : restaurantCopy[locale].title, description: restaurantCopy[locale].intro, alternates: { canonical: path, languages: Object.fromEntries(restaurantLocales.map((lang) => [lang, business ? businessPath(lang, business) : restaurantPath(lang, suffix)])) }, openGraph: { url: path, title: restaurantCopy[locale].title }, robots: suffix || business ? { index: false, follow: true } : { index: true, follow: true } };
}
export async function restaurantDetailMetadata(locale: RestaurantLocale, id: string, menuOnly = false): Promise<Metadata> {
  try {
    const establishment = await getRestaurant(locale, id);
    return restaurantMetadata(locale, `/${establishment.public_ref}${menuOnly ? "/menu" : ""}`);
  } catch {
    return { ...restaurantMetadata(locale), robots: { index: false, follow: false } };
  }
}
function Failure({ locale, href }: { locale: RestaurantLocale; href?: string }) { return <div role="status"><p>{restaurantCopy[locale].error}</p>{href ? <Internal href={href}>{restaurantCopy[locale].retry}</Internal> : <RestaurantRetry label={restaurantCopy[locale].retry}/>}</div>; }
function Pagination({ locale, page, page_size, total, href }: { locale: RestaurantLocale; page: number; page_size: number; total: number; href: (page: number) => string }) {
  const t = restaurantCopy[locale];
  return <nav className="restaurant-pagination" aria-label={t.page}>{page > 1 && <Internal href={href(page - 1)}>{t.previous}</Internal>}<span aria-current="page">{t.page} {page} / {Math.max(1, Math.ceil(total / page_size))}</span>{page * page_size < total && <Internal href={href(page + 1)}>{t.next}</Internal>}</nav>;
}
function groupedHours(hours: Restaurant["hours"]) {
  const groups: { first: number; last: number; windows: { start: string; end: string }[] }[] = [];
  for (let day = 0; day < 7; day++) {
    const windows = hours.windows.filter(window => window.weekday === day).map(({ start, end }) => ({ start, end })).sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
    const previous = groups.at(-1);
    if (previous && JSON.stringify(previous.windows) === JSON.stringify(windows)) previous.last = day;
    else groups.push({ first: day, last: day, windows });
  }
  return groups;
}
function Status({ locale, hours }: { locale: RestaurantLocale; hours: Restaurant["hours"] }) { return <span className={`marketplace-status restaurant-hours-status status-${hours.status}`}>{restaurantCopy[locale][hours.status]}</span>; }
export function RestaurantHours({ locale, hours }: { locale: RestaurantLocale; hours: Restaurant["hours"] }) {
  const t = restaurantCopy[locale];
  return <section className="restaurant-hours"><h2>{t.hours}</h2><Status locale={locale} hours={hours}/><p>{t.information}</p>
    {hours.timezone_name && <p>{t.timezone}: {hours.timezone_name}</p>}
    {hours.windows.length > 0 && <ul>{groupedHours(hours).map(({ first, last, windows }) => <li key={first}>{t.days[first]}{last > first ? ` – ${t.days[last]}` : ""}: {windows.length ? windows.map(({ start, end }) => `${start} – ${end}${end < start ? ` (${restaurantDetailCopy[locale].nextDay})` : ""}`).join(", ") : t.closed}</li>)}</ul>}
    {!!hours.closures.length && <><h3>{t.closures}</h3><ul>{hours.closures.map((closure, index) => <li key={index}><DateValue value={closure.starts_at} timezone={hours.timezone_name} locale={locale}/> – <DateValue value={closure.ends_at} timezone={hours.timezone_name} locale={locale}/></li>)}</ul></>}
    {hours.evaluated_at && <p className="restaurant-note">{restaurantDetailCopy[locale].evaluated}: <DateValue value={hours.evaluated_at} timezone={hours.timezone_name} locale={locale}/></p>}
  </section>;
}
function DateValue({ value, timezone, locale }: { value: string; timezone: string | null; locale: RestaurantLocale }) {
  let display = value;
  try { display = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: timezone ?? "UTC" }).format(new Date(value)); } catch { /* Preserve the supplied timestamp; do not infer status. */ }
  return <time dateTime={value}>{display}</time>;
}
export function RestaurantMenu({ items, locale }: { items: RestaurantMenuItem[]; locale: RestaurantLocale }) {
  const t = restaurantCopy[locale];
  if (!items.length) return <p role="status">{t.noMenu}</p>;
  const categories = new Map<string, { name: string | null; items: RestaurantMenuItem[] }>();
  for (const item of items) { const category = categories.get(item.category.public_ref) ?? { name: item.category.name, items: [] }; category.items.push(item); categories.set(item.category.public_ref, category); }
  return <div className="restaurant-menu-sections"><nav className="restaurant-categories" aria-label={restaurantDetailCopy[locale].categories}>{[...categories].map(([ref, category]) => <a key={ref} href={`#category-${ref}`}>{category.name || t.menu}</a>)}</nav>{[...categories].map(([ref, category]) => <section key={ref} id={`category-${ref}`}><h2>{category.name || t.menu}</h2><div className="restaurant-grid">{category.items.map((item) => <article key={item.public_ref} id={`item-${item.public_ref}`} className="marketplace-card restaurant-menu-item">
    {item.image_url && <div className="restaurant-photo"><RestaurantPhoto src={item.image_url} alt={item.name || t.menu}/></div>}
    <div className="marketplace-card-body"><div className="restaurant-item-description"><h3>{item.name || t.menu}</h3>{item.description && <p>{item.description}</p>}</div><div className="restaurant-item-price"><RestaurantPrice item={item} locale={locale}/>{item.availability !== "available" && <span className={`marketplace-status availability-${item.availability}`}>{t[item.availability]}</span>}</div>
      {item.dated_offering && <p>{t.dated}: <DateValue value={item.dated_offering.starts_at} timezone={item.dated_offering.timezone_name} locale={locale}/> {t.until} <DateValue value={item.dated_offering.ends_at} timezone={item.dated_offering.timezone_name} locale={locale}/> ({item.dated_offering.timezone_name})</p>}
    </div></article>)}</div></section>)}</div>;
}
export { RestaurantDiscovery as RestaurantListPage } from "./restaurant-discovery";
function RestaurantHeader({ locale, establishment, hours }: { locale: RestaurantLocale; establishment: Restaurant; hours: Restaurant["hours"] }) {
  const t = restaurantCopy[locale];
  const photo = establishment.establishment_photo?.url ?? establishment.images[0]?.url;
  return <header className={`restaurant-detail-header${photo ? " has-photo" : ""}`}>
    <div><h1>{establishment.name || t.title}</h1><p>{[establishment.type_label, establishment.location].filter(Boolean).join(" · ")}</p><span className={`restaurant-current-status status-${hours.status}`}>{t[hours.status]}</span>{establishment.review_summary&&<p>{establishment.review_summary.count ? `${establishment.review_summary.average} ★ · ${establishment.review_summary.count} ${restaurantReviewCopy[locale].reviews}` : restaurantReviewCopy[locale].noReviews}</p>}<RestaurantHours locale={locale} hours={hours}/></div>
    {photo && <div className="restaurant-header-art restaurant-establishment-photo"><RestaurantPhoto src={photo} alt={establishment.establishment_photo?.alt || establishment.images[0]?.alt || establishment.name || t.title} establishment/></div>}
  </header>;
}
export async function RestaurantDetailPage({ locale, id, search = {}, menuOnly = false }: { locale: RestaurantLocale; id: string; search?: RestaurantSearch; menuOnly?: boolean }) {
  const t = restaurantCopy[locale], back = restaurantReturn(search), context = new URLSearchParams({ back });
  const tableLocator = typeof search.table === 'string' && /^[A-Za-z0-9_-]{32}$/.test(search.table) ? search.table : null;
  if ('table' in search && !tableLocator) notFound();
  if (tableLocator) context.set('table', tableLocator);
  const menuPage = restaurantQuery(search).get("page") ?? "1";
  const rawReviewPage = Array.isArray(search.review_page) ? search.review_page[0] : search.review_page;
  const reviewPage = rawReviewPage && /^[1-9]\d{0,3}$/.test(rawReviewPage) ? rawReviewPage : "1";
  let establishment;
  try { establishment = await getRestaurant(locale, id); } catch (error) { if (error instanceof ShidaApiError && error.kind === "not-found") notFound(); return <Shell locale={locale} title={t.title}><Failure locale={locale}/></Shell>; }
  const suffix = `/${encodeURIComponent(establishment.public_ref)}${menuOnly ? "/menu" : ""}`;
  const [menuResult, actionsResult, reviewsResult, reservationResult] = await Promise.allSettled([getRestaurantMenu(locale, establishment.public_ref, menuPage), getRestaurantActions(locale, establishment.public_ref), menuOnly ? Promise.resolve(null) : getRestaurantReviews(establishment.public_ref, reviewPage),reservationAvailability(establishment.public_ref)]);
  // A newly withdrawn parent must not leave a stale detail visible after a menu eligibility check fails.
  if (menuResult.status === "rejected" && menuResult.reason instanceof ShidaApiError && menuResult.reason.kind === "not-found") notFound();
  if (actionsResult.status === "rejected" && actionsResult.reason instanceof ShidaApiError && actionsResult.reason.kind === "not-found") notFound();
  const actions = actionsResult.status === "fulfilled" ? actionsResult.value : null;
  const detailPath = restaurantPath(locale, `/${encodeURIComponent(establishment.public_ref)}`);
  const copy = restaurantDetailCopy[locale], routeContext = `${context}&page=${menuPage}`;
  const currentHours = menuResult.status === "fulfilled" ? menuResult.value.hours : establishment.hours;
  return <section className="restaurant-public restaurant-detail" lang={locale}><div className="container">
    <RestaurantRevalidation/>
    <div className="restaurant-detail-top"><Internal href={`${restaurantPath(locale)}${back ? `?${back}` : ""}#restaurant-${establishment.public_ref}`}>← {t.back}</Internal><Languages locale={locale} suffix={suffix} search={routeContext}/></div>
    <RestaurantHeader locale={locale} establishment={establishment} hours={currentHours}/>
    <RestaurantInterest establishmentRef={establishment.public_ref} locale={locale} menuOnly={menuOnly} menuAvailable={menuResult.status === "fulfilled"}/>
    {(actions?.share || actions?.save || actions?.follow) && <nav className="restaurant-top-actions" aria-label={t.services}>{actions?.share && <a className="restaurant-link restaurant-whatsapp" href={actions.share} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a>}{actions?.save && <a className="restaurant-link" href={actions.save} target="_blank" rel="noopener noreferrer">{t.save}</a>}{actions?.follow && <a className="restaurant-link" href={actions.follow} target="_blank" rel="noopener noreferrer">{t.follow}</a>}</nav>}
    <nav className="restaurant-detail-tabs" aria-label={t.title}><a href={`${detailPath}/menu?${routeContext}`} aria-current={menuOnly ? "page" : undefined}>{t.menu}</a><a href={`${detailPath}?${routeContext}#restaurant-info`} aria-current={!menuOnly ? "page" : undefined}>{copy.establishment}</a>{reservationResult.status==='fulfilled'&&reservationResult.value.available&&<a href={`${locale==='en'?'':`/${locale}`}/shida/restaurant-reservations?establishment=${encodeURIComponent(establishment.public_ref)}`}>{reservationCopy[locale].reserve}</a>}</nav>
    <div className="restaurant-detail-columns"><div className="restaurant-detail-content">
    <p className="restaurant-note">{soloCopy[locale].publicHelp}</p><RestaurantGuest locale={locale} establishmentRef={establishment.public_ref} tableLocator={tableLocator} menu={menuResult.status === "fulfilled" ? menuResult.value : null}/>
    {!menuOnly && <section id="restaurant-info" className="restaurant-establishment"><h2>{copy.establishment}</h2>

      {establishment.description && <p>{establishment.description}</p>}
      {establishment.service_modes.length > 0 && <p>{t.mode}: {establishment.service_modes.join(" · ")}</p>}
      {establishment.opening_information && <p>{establishment.opening_information}</p>}
      {establishment.owning_business && <section><h2>{t.owner}</h2><Internal href={`${businessPath(locale, establishment.owning_business.public_ref)}?${new URLSearchParams({ establishment: establishment.public_ref, back })}`}>{establishment.owning_business.name || t.business}</Internal></section>}
      <section id="reviews" className="restaurant-public-reviews"><h2>{restaurantReviewCopy[locale].reviews}</h2>
       {reviewsResult.status === "fulfilled" && reviewsResult.value ? <>
        {!reviewsResult.value.total&&<p>{restaurantReviewCopy[locale].noReviews}</p>}
        {reviewsResult.value.items.map(item=><article key={item.review_ref} className="rst-card"><p><strong>{item.rating} ★</strong> · {restaurantReviewCopy[locale].reviewer}{item.verified_experience&&<> · {restaurantReviewCopy[locale].verified}</>}</p>{item.comment&&<p>{item.comment}</p>}{item.seller_response&&<p><strong>{restaurantReviewCopy[locale].response}:</strong> {item.seller_response}</p>}<RestaurantReviewReport locale={locale} establishmentRef={establishment.public_ref} reviewRef={item.review_ref}/></article>)}
        {reviewsResult.value.total>5&&<Pagination locale={locale} {...reviewsResult.value} href={(page)=>`${detailPath}?${new URLSearchParams({back,review_page:String(page)})}#reviews`}/>}
       </>:<p role="status">{restaurantReviewCopy[locale].failed}</p>}
       <RestaurantReviewForm locale={locale} establishmentRef={establishment.public_ref} establishmentName={establishment.name||t.title}/>
      </section>
    </section>}
    </div><aside className="restaurant-practical"><h2>{copy.practical}</h2>
    <div className="restaurant-actions"><a className="restaurant-link" href="#guest-order">{soloCopy[locale].publicOrder}</a>{establishment.ordering_available && <a className="restaurant-link" href={`${detailPath}/order`}>{checkoutCopy[locale].order}</a>}{reservationResult.status==='fulfilled'&&reservationResult.value.available&&<a className="restaurant-link" href={`${locale==='en'?'':`/${locale}`}/shida/restaurant-reservations?establishment=${encodeURIComponent(establishment.public_ref)}`}>{reservationCopy[locale].reserve}</a>}<a className="restaurant-link" href={`${locale==='en'?'':`/${locale}`}/shida/restaurant-reservations`}>{reservationCopy[locale].mine}</a>{actions?.menu && <a className="restaurant-link" href={actions.menu} target="_blank" rel="noopener noreferrer">{t.menuWhatsapp}</a>}</div>
    <p className="restaurant-note">{actions?.share ? t.report : t.actionsUnavailable}</p>
    </aside></div>
  </div></section>;
}
export async function RestaurantBusinessPage({ locale, id, search = {} }: { locale: RestaurantLocale; id: string; search?: RestaurantSearch }) {
  const t = restaurantCopy[locale], page = restaurantQuery(search).get("page") ?? "1", back = restaurantReturn(search);
  const establishment = typeof search.establishment === "string" && /^[A-Za-z0-9_-]+$/.test(search.establishment) ? search.establishment : null;
  const context = new URLSearchParams({ back, ...(establishment ? { establishment } : {}) });
  let business;
  try { business = await getRestaurantBusiness(locale, id, page); } catch (error) { if (error instanceof ShidaApiError && error.kind === "not-found") notFound(); return <Shell locale={locale} title={t.business} business={id}><Failure locale={locale} href={`${businessPath(locale, id)}?${context}&page=${page}`}/></Shell>; }
  return <Shell locale={locale} title={business.name || t.business} business={id} search={`${context}&page=${page}`}>
    {establishment && <Internal href={`${restaurantPath(locale, `/${establishment}`)}?${new URLSearchParams({ back })}`}>{t.details}</Internal>}
    <h2>{t.activities}</h2>{!business.activities.items.length && <p>{t.noActivities}</p>}
    <ul className="restaurant-activities">{business.activities.items.map((activity) => {
      // These are the four reviewed backend adapters, not all Business modules.
      const path = activity.marketplace === "restaurants" ? `${restaurantPath(locale, `/${encodeURIComponent(activity.public_ref)}`)}?${new URLSearchParams({ back })}` : `${locale === "en" ? "" : "/fr"}/shida/${activity.marketplace === "jobs" ? "emplois" : activity.marketplace}/${encodeURIComponent(activity.public_ref)}`;
      return <li key={`${activity.marketplace}-${activity.public_ref}`}><Internal href={path}>{activity.name || activity.public_ref}</Internal> <span>{activity.marketplace === "restaurants" ? t.title : t[activity.marketplace]}</span></li>;
    })}</ul><Pagination locale={locale} {...business.activities} href={(next) => `${businessPath(locale, id)}?${context}&page=${next}`}/>
  </Shell>;
}
