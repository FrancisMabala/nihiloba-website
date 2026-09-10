import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShidaApiError } from "../../services/shida/public-client";
import { getRestaurant, getRestaurantActions, getRestaurantBusiness, getRestaurantMenu, getRestaurants, restaurantQuery, type Restaurant, type RestaurantLocale, type RestaurantMenuItem, type RestaurantSearch } from "../../services/shida/restaurants-client";
import { businessPath, restaurantCopy, restaurantLocales, restaurantPath, restaurantReturn } from "../../lib/restaurant-i18n";
import { MarketplaceBreadcrumb } from "./marketplace-primitives";
import { MarketplaceImage } from "./marketplace-image";
import { RestaurantRevalidation } from "./restaurant-revalidation";
import { RestaurantRetry } from "./restaurant-retry";

// Native document navigation deliberately re-reads eligibility rather than prefetching public projections.
function Internal({ href, children }: { href: string; children: React.ReactNode }) { return <a className="restaurant-link" href={href}>{children}</a>; }
function Languages({ locale, suffix = "", search = "", business }: { locale: RestaurantLocale; suffix?: string; search?: string; business?: string }) {
  return <nav className="restaurant-languages" aria-label={restaurantCopy[locale].language}>{restaurantLocales.map((lang) => <a key={lang} href={`${business ? businessPath(lang, business) : restaurantPath(lang, suffix)}${search ? `?${search}` : ""}`} hrefLang={lang} lang={lang} aria-current={locale === lang ? "page" : undefined}>{({ en: "English", fr: "Français", ln: "Lingála", sw: "Kiswahili" })[lang]}</a>)}</nav>;
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
function Status({ locale, hours }: { locale: RestaurantLocale; hours: Restaurant["hours"] }) { return <span className="marketplace-status">{restaurantCopy[locale][hours.status]}</span>; }
export function RestaurantHours({ locale, hours }: { locale: RestaurantLocale; hours: Restaurant["hours"] }) {
  const t = restaurantCopy[locale];
  return <section className="restaurant-hours"><h2>{t.hours}</h2><Status locale={locale} hours={hours}/><p>{t.information}</p>
    {hours.timezone_name && <p>{t.timezone}: {hours.timezone_name}</p>}
    {hours.windows.length > 0 && <ul>{hours.windows.map((window, index) => <li key={index}>{t.days[window.weekday]}: {window.start} – {window.end}</li>)}</ul>}
    {!!hours.closures.length && <><h3>{t.closures}</h3><ul>{hours.closures.map((closure, index) => <li key={index}><DateValue value={closure.starts_at} timezone={hours.timezone_name} locale={locale}/> – <DateValue value={closure.ends_at} timezone={hours.timezone_name} locale={locale}/></li>)}</ul></>}
    {hours.evaluated_at && <p className="restaurant-note">{t.evaluated}: <DateValue value={hours.evaluated_at} timezone={hours.timezone_name} locale={locale}/></p>}
  </section>;
}
function DateValue({ value, timezone, locale }: { value: string; timezone: string | null; locale: RestaurantLocale }) {
  let display = value;
  try { display = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: timezone ?? "UTC" }).format(new Date(value)); } catch { /* Preserve the supplied timestamp; do not infer status. */ }
  return <time dateTime={value}>{display}</time>;
}
export function RestaurantPrice({ item, locale }: { item: RestaurantMenuItem; locale: RestaurantLocale }) {
  const t = restaurantCopy[locale];
  if (item.pricing_model === "UNIT_PRICED" && item.unit_price !== null && item.currency) return <p><strong>{t.unit}: {item.unit_price} {item.currency}</strong>{item.sale_unit_label && <> / {item.sale_unit_label}</>}</p>;
  if (item.pricing_model === "AMOUNT_PRICED" && item.currency && (item.allowed_amounts.length || item.minimum_amount !== null)) return <div><p><strong>{t.amounts}</strong>{item.sale_unit_label && <> · {item.sale_unit_label}</>}</p>{item.allowed_amounts.length > 0 && <p>{item.allowed_amounts.map((amount) => `${amount} ${item.currency}`).join(" · ")}</p>}{item.minimum_amount !== null && <p>{t.minimum}: {item.minimum_amount} {item.currency}</p>}</div>;
  return <p>{t.unknownPrice}</p>;
}
export function RestaurantMenu({ items, locale }: { items: RestaurantMenuItem[]; locale: RestaurantLocale }) {
  const t = restaurantCopy[locale];
  if (!items.length) return <p role="status">{t.noMenu}</p>;
  const categories = new Map<string, { name: string | null; items: RestaurantMenuItem[] }>();
  for (const item of items) { const category = categories.get(item.category.public_ref) ?? { name: item.category.name, items: [] }; category.items.push(item); categories.set(item.category.public_ref, category); }
  return <div>{[...categories].map(([ref, category]) => <section key={ref}><h2>{category.name || t.menu}</h2><div className="restaurant-grid">{category.items.map((item) => <article key={item.public_ref} id={`item-${item.public_ref}`} className="marketplace-card restaurant-menu-item">
    {item.image_url && <div className="restaurant-photo"><MarketplaceImage src={item.image_url} alt={item.name || t.menu} fallback={t.photo}/></div>}
    <div className="marketplace-card-body"><p className="eyebrow">{item.presentation === "component" ? t.component : t.fixed}</p><h3>{item.name || t.menu}</h3><span className="marketplace-status">{t[item.availability]}</span>{item.description && <p>{item.description}</p>}<RestaurantPrice item={item} locale={locale}/>
      {item.dated_offering && <p>{t.dated}: <DateValue value={item.dated_offering.starts_at} timezone={item.dated_offering.timezone_name} locale={locale}/> {t.until} <DateValue value={item.dated_offering.ends_at} timezone={item.dated_offering.timezone_name} locale={locale}/> ({item.dated_offering.timezone_name})</p>}
    </div></article>)}</div></section>)}</div>;
}
export async function RestaurantListPage({ locale, search = {} }: { locale: RestaurantLocale; search?: RestaurantSearch }) {
  const t = restaurantCopy[locale], params = restaurantQuery(search), path = restaurantPath(locale);
  let result;
  try { result = await getRestaurants(locale, search); } catch { return <Shell locale={locale} title={t.title} search={params.toString()}><Failure locale={locale} href={`${path}?${params}`}/></Shell>; }
  return <Shell locale={locale} title={t.title} search={params.toString()}><p>{t.intro}</p>
    <p><Link className="button button-secondary" href={`${locale === "en" ? "" : `/${locale}`}/shida/seller/restaurants`}>{({ en: "Personal seller area", fr: "Espace vendeur Personnel", ln: "Esika ya moteki Personnel", sw: "Eneo la muuzaji Binafsi" })[locale]}</Link></p>
    <form action={path} method="get" className="restaurant-filters">
      {(["query", "name", "city", "area", "dish"] as const).map((key) => <label key={key}>{key === "query" ? t.search : t[key]}<input name={key} defaultValue={params.get(key) ?? ""} maxLength={200}/></label>)}
      <label>{t.type}<select name="food_type" defaultValue={params.get("food_type") ?? ""}><option value="">{t.all}</option>{(["restaurant", "malewa", "cafe", "fast_food", "catering"] as const).map((type) => <option key={type} value={type}>{t[type]}</option>)}</select></label>
      <label>{t.mode}<select name="service_mode" defaultValue={params.get("service_mode") ?? ""}><option value="">{t.all}</option>{[...new Set([...(params.get("service_mode") ? [params.get("service_mode")!] : []), ...result.service_mode_options])].map((mode) => <option key={mode} value={mode}>{mode}</option>)}</select></label>
      <label className="restaurant-checkbox"><input type="checkbox" name="open_now" value="true" defaultChecked={params.get("open_now") === "true"}/>{t.openOnly}</label>
      <button type="submit" className="restaurant-link">{t.search}</button><Internal href={path}>{t.reset}</Internal>
    </form><p role="status">{result.total} {t.results}</p>
    {!result.items.length && <p>{t.empty} <Internal href={locale === "en" ? "/shida" : "/fr/shida"}>SHIDA</Internal></p>}
    <div className="restaurant-grid">{result.items.map((item) => {
      const href = `${path}/${encodeURIComponent(item.public_ref)}?${new URLSearchParams({ back: params.toString() })}`;
      return <article className="marketplace-card" id={`restaurant-${item.public_ref}`} key={item.public_ref}>
        <a className="restaurant-photo" href={href} aria-label={`${t.details}: ${item.name || t.title}`}><MarketplaceImage src={item.images[0]?.url ?? item.logo?.url ?? null} alt={item.images[0]?.alt || item.name || t.title} fallback={t.photo}/></a>
        <div className="marketplace-card-body"><p className="eyebrow">{item.type_label}</p><h2><a href={href}>{item.name || t.title}</a></h2><Status locale={locale} hours={item.hours}/><p>{item.location}</p><p>{item.description}</p>{item.menu_summary && <p>{t.menu}: {t.available} {item.menu_summary.available} · {t.sold_out} {item.menu_summary.sold_out} · {t.temporarily_unavailable} {item.menu_summary.temporarily_unavailable}</p>}<Internal href={href}>{t.details}</Internal></div>
      </article>;
    })}</div><Pagination locale={locale} {...result} href={(page) => { const next = new URLSearchParams(params); next.set("page", String(page)); return `${path}?${next}`; }}/>
  </Shell>;
}
export async function RestaurantDetailPage({ locale, id, search = {}, menuOnly = false }: { locale: RestaurantLocale; id: string; search?: RestaurantSearch; menuOnly?: boolean }) {
  const t = restaurantCopy[locale], back = restaurantReturn(search), context = new URLSearchParams({ back });
  const menuPage = restaurantQuery(search).get("page") ?? "1";
  let establishment;
  try { establishment = await getRestaurant(locale, id); } catch (error) { if (error instanceof ShidaApiError && error.kind === "not-found") notFound(); return <Shell locale={locale} title={t.title}><Failure locale={locale}/></Shell>; }
  const suffix = `/${encodeURIComponent(establishment.public_ref)}${menuOnly ? "/menu" : ""}`;
  const [menuResult, actionsResult] = await Promise.allSettled([getRestaurantMenu(locale, establishment.public_ref, menuPage), getRestaurantActions(locale, establishment.public_ref)]);
  // A newly withdrawn parent must not leave a stale detail visible after a menu eligibility check fails.
  if (menuResult.status === "rejected" && menuResult.reason instanceof ShidaApiError && menuResult.reason.kind === "not-found") notFound();
  if (actionsResult.status === "rejected" && actionsResult.reason instanceof ShidaApiError && actionsResult.reason.kind === "not-found") notFound();
  const actions = actionsResult.status === "fulfilled" ? actionsResult.value : null;
  const detailPath = restaurantPath(locale, `/${encodeURIComponent(establishment.public_ref)}`);
  return <Shell locale={locale} title={establishment.name || t.title} suffix={suffix} search={`${context}${menuOnly ? `&page=${menuPage}` : ""}`}>
    <Internal href={`${restaurantPath(locale)}${back ? `?${back}` : ""}#restaurant-${establishment.public_ref}`}>{t.back}</Internal>
    {menuOnly ? <p><Internal href={`${detailPath}?${context}`}>{t.details}</Internal></p> : <>
      {establishment.images[0] && <div className="restaurant-photo restaurant-hero-photo"><MarketplaceImage src={establishment.images[0].url} alt={establishment.images[0].alt || establishment.name || t.title} fallback={t.photo}/></div>}
      <p>{establishment.type_label}</p><p>{establishment.description}</p><p>{establishment.location}</p>
      {establishment.service_modes.length > 0 && <p>{t.mode}: {establishment.service_modes.join(" · ")}</p>}
      {establishment.opening_information && <p>{establishment.opening_information}</p>}
      <section><h2>{t.owner}</h2>{establishment.owning_business ? <Internal href={`${businessPath(locale, establishment.owning_business.public_ref)}?${new URLSearchParams({ establishment: establishment.public_ref, back })}`}>{establishment.owning_business.name || t.business}</Internal> : <p>{t.noBusiness}</p>}</section>
    </>}
    <RestaurantHours locale={locale} hours={menuResult.status === "fulfilled" ? menuResult.value.hours : establishment.hours}/>
    <section><h2>{t.menu}</h2>{!menuOnly && <p><Internal href={`${detailPath}/menu?${context}`}>{t.menu}</Internal></p>}
      {menuResult.status === "fulfilled" ? <><RestaurantMenu locale={locale} items={menuResult.value.items}/><Pagination locale={locale} {...menuResult.value} href={(page) => `${detailPath}/menu?${context}&page=${page}`}/></> : <Failure locale={locale}/>}
    </section>
    <div className="restaurant-actions">{actions?.save && <a className="restaurant-link" href={actions.save} target="_blank" rel="noopener noreferrer">{t.save}</a>}{actions?.follow && <a className="restaurant-link" href={actions.follow} target="_blank" rel="noopener noreferrer">{t.follow}</a>}{actions?.share && <a className="restaurant-link" href={actions.share} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a>}{actions?.menu && <a className="restaurant-link" href={actions.menu} target="_blank" rel="noopener noreferrer">{t.menuWhatsapp}</a>}</div>
    <p>{actions?.share ? t.report : t.actionsUnavailable}</p>
  </Shell>;
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
