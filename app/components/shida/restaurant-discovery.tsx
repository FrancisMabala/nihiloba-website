import { restaurantCopy, restaurantPath } from "../../lib/restaurant-i18n";
import { discoveryCopy } from "../../lib/restaurant-discovery-copy";
import { getRestaurants, restaurantQuery, type RestaurantLocale, type RestaurantSearch } from "../../services/shida/restaurants-client";
import { MarketplaceBreadcrumb } from "./marketplace-primitives";
import { MarketplaceImage } from "./marketplace-image";
import { RestaurantRevalidation } from "./restaurant-revalidation";
import { RestaurantRetry } from "./restaurant-retry";
import { DiscoveryLanguage } from "./restaurant-discovery-controls";
import "./restaurant-discovery.css";

export async function RestaurantDiscovery({ locale, search = {} }: { locale: RestaurantLocale; search?: RestaurantSearch }) {
 const t = restaurantCopy[locale], d = discoveryCopy[locale], params = restaurantQuery(search), path = restaurantPath(locale);
 let result: Awaited<ReturnType<typeof getRestaurants>> | null = null;
 try { result = await getRestaurants(locale, search); } catch { /* Keep the complete search form and exact-document retry. */ }
 const modes = [...new Set([...(params.get("service_mode") ? [params.get("service_mode")!] : []), ...(result?.service_mode_options ?? [])])];
 const advanced = ["name", "area", "dish", "service_mode"].filter(key => params.get(key)).length + (["fast_food", "catering"].includes(params.get("food_type") ?? "") ? 1 : 0);
 return <section className="restaurant-public restaurant-discovery" lang={locale}><div className="container">
  <RestaurantRevalidation/>
  <div className="rd-top"><MarketplaceBreadcrumb label={t.breadcrumb} items={[{ label: "SHIDA", href: locale === "en" ? "/shida" : "/fr/shida" }, { label: t.title }]}/><div className="rd-tools"><a href={`${locale === "en" ? "" : `/${locale}`}/shida/seller/restaurants`}>{d.seller}</a><DiscoveryLanguage locale={locale} search={params.toString()}/></div></div>
  <header className="rd-intro"><h1>{d.headline}</h1><p>{d.hint}</p></header>
 </div>
 <picture className="rd-painted-band">
  {/* Complete approved scene, proportionally resized through the local WebP pipeline. */}
  <img src="/images/restaurants/terrasse-quartier-720.webp" srcSet="/images/restaurants/terrasse-quartier-480.webp 480w, /images/restaurants/terrasse-quartier-720.webp 720w, /images/restaurants/terrasse-quartier-1080.webp 1080w, /images/restaurants/terrasse-quartier-1440.webp 1440w" sizes="(max-width: 720px) 100vw, 720px" width={2171} height={724} alt="" decoding="async"/>
 </picture>
 <div className="container">
  <form action={path} method="get" className="rd-search">
   <div className="rd-primary"><label><span className="rd-primary-label">{t.search}</span><input name="query" placeholder={d.query} defaultValue={params.get("query") ?? ""} maxLength={200}/></label><label><span className="rd-primary-label">{t.city}</span><input name="city" placeholder={t.city} defaultValue={params.get("city") ?? ""} maxLength={200}/></label><button className="rd-submit" type="submit">{t.search}</button></div>
   <fieldset className="rd-types"><legend className="sr-only">{t.type}</legend>{(["", "malewa", "restaurant", "cafe"] as const).map(type => <label className="rd-chip" key={type}><input type="radio" name="food_type" value={type} defaultChecked={(params.get("food_type") ?? "") === type}/><span>{type ? t[type] : t.all}</span></label>)}<label className="rd-chip rd-open"><input type="checkbox" name="open_now" value="true" defaultChecked={params.get("open_now") === "true"}/><span>{t.openOnly.split(" — ")[0]}</span></label></fieldset>
   <details className="rd-advanced"><summary>{d.filters}{advanced > 0 ? ` (${advanced})` : ""}</summary><div className="rd-fields">{(["name", "area", "dish"] as const).map(key => <label key={key}>{key === "dish" ? d.dish : t[key]}<input name={key} defaultValue={params.get(key) ?? ""} maxLength={200}/></label>)}<label>{t.mode}<select name="service_mode" defaultValue={params.get("service_mode") ?? ""}><option value="">{t.all}</option>{modes.map(mode => <option key={mode} value={mode}>{mode}</option>)}</select></label><fieldset><legend>{t.type}</legend>{(["fast_food", "catering"] as const).map(type => <label className="rd-chip" key={type}><input type="radio" name="food_type" value={type} defaultChecked={params.get("food_type") === type}/><span>{t[type]}</span></label>)}</fieldset></div></details>
   <a className="rd-reset" href={path}>{t.reset}</a>
  </form>
  <div className="rd-results-heading"><h2>{d.discover}{params.get("city") ? ` · ${params.get("city")}` : ""}</h2>{result && <p role="status">{result.total} {t.results}</p>}</div>
  {!result ? <div className="rd-empty" role="status"><p>{t.error}</p><RestaurantRetry label={t.retry}/></div> : <>
   {!result.items.length && <div className="rd-empty"><p>{t.empty}</p><a href={locale === "en" ? "/shida" : "/fr/shida"}>SHIDA</a></div>}
   <div className="rd-grid">{result.items.map(item => {
    const href = `${path}/${encodeURIComponent(item.public_ref)}`, back = new URLSearchParams({ back: params.toString() });
    const summary = item.menu_summary;
    const message = summary ? summary.available > 0 ? null : summary.sold_out + summary.temporarily_unavailable > 0 ? d.unavailableMenu : d.emptyMenu : null;
    return <article className="rd-card" id={`restaurant-${item.public_ref}`} key={item.public_ref}>
     <a className="rd-photo" href={`${href}?${back}`} aria-label={`${t.details}: ${item.name || t.title}`}><MarketplaceImage src={item.images[0]?.url ?? item.logo?.url ?? null} alt={item.images[0]?.alt || item.name || t.title} fallback={d.photo} sizes="(max-width: 600px) 104px, (max-width: 1050px) 45vw, 380px"/></a>
     <div className="rd-card-body"><h3><a href={`${href}?${back}`}>{item.name || t.title}</a></h3><p>{[item.type_label, item.location].filter(Boolean).join(" · ")}</p><p className={`rd-status rd-status-${item.hours.status}`}><span aria-hidden="true"/>{item.hours.status === "unknown" ? d.unknown : t[item.hours.status]}</p>{message && <p className="rd-menu-note">{message}</p>}<a className="rd-menu" href={`${href}/menu?${back}`}>{d.menu}<span aria-hidden="true"> →</span></a></div>
    </article>;
   })}</div>
   <nav className="restaurant-pagination" aria-label={t.page}>{result.page > 1 && <a className="restaurant-link" href={`${path}?${new URLSearchParams({ ...Object.fromEntries(params), page: String(result.page - 1) })}`}>{t.previous}</a>}<span aria-current="page">{t.page} {result.page} / {Math.max(1, Math.ceil(result.total / result.page_size))}</span>{result.page * result.page_size < result.total && <a className="restaurant-link" href={`${path}?${new URLSearchParams({ ...Object.fromEntries(params), page: String(result.page + 1) })}`}>{t.next}</a>}</nav>
  </>}
 </div></section>;
}
