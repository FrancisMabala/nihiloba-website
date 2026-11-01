import {RestaurantDiscoveryHero} from "./restaurant-discovery-hero";
import {restaurantDiscoveryFinalCopy} from "../../lib/restaurant-discovery-final-copy";
import {discoverRestaurantDishes} from "../../lib/restaurant-dish-discovery";
import {RestaurantPrice} from "./restaurant-menu-price";
import {SpaceIcon} from "./account-space-icon";
import {ActiveSearchFilters} from "./active-search-filters";


import { restaurantCopy, restaurantPath } from "../../lib/restaurant-i18n";
import { discoveryCopy } from "../../lib/restaurant-discovery-copy";
import { restaurantReviewCopy } from "../../lib/restaurant-review-copy";
import { getRestaurants, restaurantQuery, type RestaurantLocale, type RestaurantSearch } from "../../services/shida/restaurants-client";
import { RestaurantPhoto } from "./restaurant-photo";
import { RestaurantRevalidation } from "./restaurant-revalidation";
import { RestaurantRetry } from "./restaurant-retry";
import { DiscoveryLanguage } from "./restaurant-discovery-controls";
import "./restaurant-discovery.css";

export async function RestaurantDiscovery({ locale, search = {} }: { locale: RestaurantLocale; search?: RestaurantSearch }) {
 const c = restaurantDiscoveryFinalCopy[locale], t = restaurantCopy[locale], d = discoveryCopy[locale], params = restaurantQuery(search), path = restaurantPath(locale);
 const dishPage=Array.isArray(search.dish_page)?search.dish_page[0]:search.dish_page;
 if(dishPage&&/^\d+$/.test(dishPage)&&Number.isSafeInteger(Number(dishPage))&&Number(dishPage)>0)params.set('dish_page',String(Number(dishPage)));
 let result: Awaited<ReturnType<typeof getRestaurants>> | null = null;
 const [placesResult,dishesResult]=await Promise.allSettled([getRestaurants(locale,search,6),discoverRestaurantDishes(locale,search)]);
 if(placesResult.status==="fulfilled")result=placesResult.value;
 const dishes=dishesResult.status==="fulfilled"?dishesResult.value:null;
 const link=(extra:Record<string,string>,anchor="")=>`${path}?${new URLSearchParams({...Object.fromEntries(params),...extra})}${anchor}`;
 const modes = [...new Set([...(params.get("service_mode") ? [params.get("service_mode")!] : []), ...(result?.service_mode_options ?? [])])];
 const advanced = ["name", "area", "dish", "service_mode"].filter(key => params.get(key)).length + (["fast_food", "catering"].includes(params.get("food_type") ?? "") ? 1 : 0);
 return <section className="restaurant-public restaurant-discovery marketplace-public" lang={locale}><div className="container">
  <RestaurantRevalidation/>
  <RestaurantDiscoveryHero locale={locale}/>
  <div className="rd-language-row"><DiscoveryLanguage locale={locale} search={params.toString()}/></div>
 </div>
 <div className="container">
  <form id="restaurant-discovery" action={path} method="get" className="rd-search mp-search">
   <div className="mp-search-primary mp-food-search"><label><span className="rd-primary-label">{t.search}</span><input name="query" placeholder={c.query} defaultValue={params.get("query") ?? ""} maxLength={200}/></label><label><span className="rd-primary-label">{t.city}</span><input name="city" placeholder={t.city} defaultValue={params.get("city") ?? ""} maxLength={200}/></label><button className="rd-submit" type="submit">{t.search}</button></div>
   <fieldset className="rd-types"><legend className="sr-only">{t.type}</legend>{(["", "malewa", "restaurant", "cafe"] as const).map(type => <label className="rd-chip" key={type}><input type="radio" name="food_type" value={type} defaultChecked={(params.get("food_type") ?? "") === type}/><span><SpaceIcon name={type===""?"menu":"restaurant"}/>{type ? t[type] : t.all}</span></label>)}<label className="rd-chip rd-open"><input type="checkbox" name="open_now" value="true" defaultChecked={params.get("open_now") === "true"}/><span>{t.openOnly.split(" — ")[0]}</span></label></fieldset>
   <details className="rd-advanced" open={advanced>0||undefined}><summary>{d.filters}{advanced > 0 ? ` (${advanced})` : ""}</summary><div className="rd-fields"><label><span className="rd-primary-label">{d.dish}</span><input name="dish" defaultValue={params.get("dish")??""} maxLength={200}/></label>{(["name", "area"] as const).map(key => <label key={key}>{t[key]}<input name={key} defaultValue={params.get(key) ?? ""} maxLength={200}/></label>)}<label>{t.mode}<select name="service_mode" defaultValue={params.get("service_mode") ?? ""}><option value="">{t.all}</option>{modes.map(mode => <option key={mode} value={mode}>{mode}</option>)}</select></label><fieldset><legend>{t.type}</legend>{(["fast_food", "catering"] as const).map(type => <label className="rd-chip" key={type}><input type="radio" name="food_type" value={type} defaultChecked={params.get("food_type") === type}/><span>{t[type]}</span></label>)}</fieldset></div></details>
   <ActiveSearchFilters locale={locale} path={path} query={params.toString()} labels={{query:t.search,city:t.city,dish:d.dish,name:t.name,area:t.area,food_type:t.type,open_now:t.openOnly.split(" — ")[0],service_mode:t.mode}} values={{food_type:{malewa:t.malewa,restaurant:t.restaurant,cafe:t.cafe,fast_food:t.fast_food,catering:t.catering},open_now:{true:t.openOnly.split(" — ")[0]}}}/>
  </form>
  <p className="rd-filter-explanation">{c.filterHelp}</p>
  <section id="dishes" aria-labelledby="rd-dish-title"><div className="rd-results-heading"><h2 id="rd-dish-title">{c.dishes}</h2><a href={link({dish_page:"1"},"#dishes")}>{c.allDishes} →</a></div><p className="rd-selection-note">{c.selection}</p>
  {(!dishes||dishes.failed)&&<div className="rd-empty" role="status"><p>{c.dishError}</p><RestaurantRetry label={t.retry}/></div>}
  {dishes&&!dishes.failed&&!dishes.items.length&&<div className="rd-empty"><p>{c.noDishes}</p><a href={path}>{t.reset}</a></div>}
  <div className="rd-dish-grid">{dishes?.items.map(({item,establishment})=>{
   const href=`${path}/${encodeURIComponent(establishment.public_ref)}/menu?${new URLSearchParams({item:item.public_ref,back:params.toString()})}#item-${encodeURIComponent(item.public_ref)}`;
   return <article className="rd-dish-card" key={`${establishment.public_ref}:${item.public_ref}`}><a className="rd-dish-photo" href={href} aria-label={`${c.choose}: ${item.name}`}><span className="rd-food-fallback" aria-hidden="true"><SpaceIcon name="restaurant"/></span><RestaurantPhoto src={item.image_url} alt={item.name||t.menu} sizes="(max-width:650px) 45vw, 280px"/></a><div className="rd-dish-body"><h3><a href={href}>{item.name}</a></h3><a className="rd-dish-parent" href={`${path}/${encodeURIComponent(establishment.public_ref)}/menu`}>{establishment.name}</a><p className="rd-dish-location">{establishment.general_location}</p><RestaurantPrice item={item} locale={locale}/>{item.availability!=="available"&&<p className="rd-status-closed">{t[item.availability]}</p>}<a className="rd-dish-choose" href={href}>{item.availability==="available"?c.choose:d.menu} →</a></div></article>;
  })}</div>
  {dishes&&dishes.total>dishes.page_size&&<nav className="restaurant-pagination" aria-label={c.dishes}>{dishes.page>1&&<a href={link({dish_page:String(dishes.page-1)},"#dishes")}>{t.previous}</a>}<span>{t.page} {dishes.page}</span>{dishes.page*dishes.page_size<dishes.total&&<a href={link({dish_page:String(dishes.page+1)},"#dishes")}>{t.next}</a>}</nav>}
  </section>
  <div id="establishments" className="rd-results-heading mp-results-heading"><h2>{c.places}{params.get("city") ? ` · ${params.get("city")}` : ""}</h2>{result && <p role="status">{result.total} {t.results}</p>}<a href={link({page:"1"},"#establishments")}>{c.allPlaces} →</a></div>
  {!result ? <div className="rd-empty" role="status"><p>{t.error}</p><RestaurantRetry label={t.retry}/></div> : <>
   {!result.items.length && <div className="rd-empty"><p>{t.empty}</p><a href={path}>{t.reset}</a></div>}
   <div className="rd-grid">{result.items.map(item => {
    const href = `${path}/${encodeURIComponent(item.public_ref)}`, back = new URLSearchParams({ back: params.toString() });
    const summary = item.menu_summary;
    const message = summary ? summary.available > 0 ? null : summary.sold_out + summary.temporarily_unavailable > 0 ? d.unavailableMenu : d.emptyMenu : null;
    return <article className="rd-card" id={`restaurant-${item.public_ref}`} key={item.public_ref}>
     <a className={`rd-photo${!item.establishment_photo?.url&&!item.images.length&&item.logo?.url?" rd-logo":""}`} href={`${href}?${back}`} aria-label={`${t.details}: ${item.name || t.title}`}><span className="rd-food-fallback" aria-hidden="true"><SpaceIcon name="shop"/></span><RestaurantPhoto src={item.establishment_photo?.url ?? item.images[0]?.url ?? item.logo?.url ?? null} alt={item.establishment_photo?.alt || item.images[0]?.alt || item.name || t.title} establishment/></a>
     <div className="rd-card-body"><h3><a href={`${href}?${back}`}>{item.name || t.title}</a></h3><p>{[item.type_label, item.general_location].filter(Boolean).join(" · ")}</p>{item.service_modes.length > 0 && <p className="rd-card-modes">{item.service_modes.join(" · ")}</p>}{item.review_summary&&<p>{item.review_summary.count?`${item.review_summary.average} ★ · ${item.review_summary.count} ${restaurantReviewCopy[locale].reviews}`:restaurantReviewCopy[locale].noReviews}</p>}<p className={`rd-status rd-status-${item.hours.status}`}><span aria-hidden="true"/>{item.hours.status === "unknown" ? d.unknown : t[item.hours.status]}</p>{message && <p className="rd-menu-note">{message}</p>}<a className="rd-menu" href={`${href}/menu?${back}`}>{d.menu}<span aria-hidden="true"> →</span></a></div>
    </article>;
   })}</div>
   <nav className="restaurant-pagination" aria-label={t.page}>{result.page > 1 && <a className="restaurant-link" href={`${path}?${new URLSearchParams({ ...Object.fromEntries(params), page: String(result.page - 1) })}`}>{t.previous}</a>}<span aria-current="page">{t.page} {result.page} / {Math.max(1, Math.ceil(result.total / result.page_size))}</span>{result.page * result.page_size < result.total && <a className="restaurant-link" href={`${path}?${new URLSearchParams({ ...Object.fromEntries(params), page: String(result.page + 1) })}`}>{t.next}</a>}</nav>
  </>}
  <section className="rd-owner-invite"><SpaceIcon name="shop"/><div><h2>{c.invite}</h2><p>{c.inviteText}</p></div><nav aria-label={c.invite}><a href={`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants?create=restaurant`}>{c.restaurant} →</a><a href={`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants?create=malewa`}>{c.malewa} →</a></nav></section>
 </div></section>;
}
