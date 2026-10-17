import { PublicMarketplaceHero, PublicMarketplaceClosing } from "./public-marketplace";
import { propertyDiscoveryCopy } from "./property-discovery-copy";
import { filterPublicHotels, type HotelSearch } from "../../lib/hotel-search";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "../../lib/i18n";
import { safePublicImageUrl } from "../../lib/safe-public-url";
import { apartmentSearchQuery, getApartment, getApartmentOwner, getApartments, getHotel, getHotels, ShidaApiError } from "../../services/shida/public-client";
import type { ApartmentSearch } from "../../types/shida-public";
import { apartmentPropertyTypes } from "../../types/shida-public";
import { ApartmentFilters, ApartmentOwnerProfile, ApartmentPagination, hasApartmentSearch } from "./apartment-marketplace";
import { ApartmentCard, ApartmentDetail, HotelCard, HotelDetail, marketplacePath, MarketplaceState, propertyTypeLabel, publicLocation } from "./marketplace";
import { marketplaceCopy } from "./marketplace-copy";
import { MarketplaceSectionBreadcrumb } from "./marketplace-primitives";
import { firstHotelRoomImage } from "./hotel-room-images";

function marketplaceMetadata(locale: Locale, kind: "apartments" | "hotels"): Metadata {
  const t = marketplaceCopy[locale];
  const isApartments = kind === "apartments";
  const path = isApartments ? "/shida/appartements" : "/shida/hotels";
  const title = isApartments ? t.apartmentTitle : t.hotelTitle;
  const description = isApartments ? t.apartmentIntro : t.hotelIntro;
  return {
    title, description,
    alternates: { canonical: marketplacePath(locale, path), languages: { en: path, fr: `/fr${path}`, "x-default": path } },
    openGraph: { title, description, url: marketplacePath(locale, path), images: [{ url: "/NIHILOBA_logo.png", width: 1536, height: 1024, alt: "NIHILOBA" }] },
  };
}

export function apartmentCollectionMetadata(locale: Locale): Metadata { return marketplaceMetadata(locale, "apartments"); }
export function hotelCollectionMetadata(locale: Locale): Metadata { return marketplaceMetadata(locale, "hotels"); }

function unavailable(error: unknown): boolean {
  return error instanceof ShidaApiError && error.kind !== "not-found";
}

export async function ApartmentCollectionPage({ locale, search = {} }: { locale: Locale; search?: ApartmentSearch }) {
  const t = marketplaceCopy[locale], d = propertyDiscoveryCopy[locale].apartments;
  const path = marketplacePath(locale, "/shida/appartements");
  let listings;
  try { listings = await getApartments({ ...search, page: search.page ?? 1, page_size: search.page_size ?? 12 }); }
  catch (error) { if (!unavailable(error)) throw error; }
  const types = listings?.filters.property_types ?? [...apartmentPropertyTypes];
  return <div className="marketplace-public apartment-public"><div className="container">
    <div className="mp-topline"><MarketplaceSectionBreadcrumb locale={locale} current={t.apartments}/><Link href={marketplacePath(locale,"/shida/hotels")}>{d.related} <span aria-hidden="true">↗</span></Link></div>
    <PublicMarketplaceHero eyebrow={d.eyebrow} title={d.title} intro={t.apartmentIntro} image="/images/apartment-discovery.webp" unoptimized imageAlt={d.image} badge={`SHIDA / ${t.apartments.toLocaleUpperCase(locale)}`} browse={d.browse} href="#apartment-discovery"/>
    <section id="apartment-discovery" aria-labelledby="apartment-results-title">
      <ApartmentFilters locale={locale} search={search} propertyTypes={types}/>
      <nav className="mp-chips" aria-label={t.propertyType}><Link href={`${path}${apartmentSearchQuery({...search,property_type:undefined,page:1})}`} aria-current={!search.property_type?"page":undefined}>{d.all}</Link>{types.map(type=><Link key={type} href={`${path}${apartmentSearchQuery({...search,property_type:type,page:1})}`} aria-current={search.property_type===type?"page":undefined}>{propertyTypeLabel(type,locale)}</Link>)}</nav>
      <div className="mp-results-heading"><h2 id="apartment-results-title">{d.results}</h2>{listings&&<p className="marketplace-result-count" role="status">{listings.total} {listings.total===1?t.result:t.results}</p>}</div>
      {listings ? <>
        {listings.items.length > 0
          ? <div className="marketplace-grid">{listings.items.map(listing=><ApartmentCard key={listing.public_ref} listing={listing} locale={locale}/>)}</div>
          : <div className="marketplace-empty-results"><MarketplaceState>{hasApartmentSearch(search)?t.noSearchResults:t.emptyApartments}</MarketplaceState>{hasApartmentSearch(search)&&<Link className="button button-secondary" href={path}>{t.resetFilters}</Link>}</div>}
        <ApartmentPagination locale={locale} search={search} collection={listings}/>
      </> : <MarketplaceState>{t.unavailable}</MarketplaceState>}
    </section>
    <PublicMarketplaceClosing copy={d} badge="SHIDA" href={marketplacePath(locale,"/shida")}/>
  </div></div>;
}

export async function HotelCollectionPage({ locale, search = {} }: { locale: Locale; search?: HotelSearch }) {
  const t = marketplaceCopy[locale], d = propertyDiscoveryCopy[locale].hotels;
  const path = marketplacePath(locale,"/shida/hotels");
  let listings;
  try { listings = await getHotels(); }
  catch (error) { if (!unavailable(error)) throw error; }
  const items = listings ? filterPublicHotels(listings.items, search) : [];
  const cities = [...new Set(listings?.items.map(item=>item.city?.trim()).filter((city):city is string=>Boolean(city)) ?? [])].sort((a,b)=>a.localeCompare(b,locale));
  const cityHref = (city?:string) => { const params = new URLSearchParams(); if(search.query)params.set("query",search.query); if(city)params.set("city",city); return `${path}${params.size?`?${params}`:""}`; };
  return <div className="marketplace-public hotel-public"><div className="container">
    <div className="mp-topline"><MarketplaceSectionBreadcrumb locale={locale} current={t.hotels}/><Link href={marketplacePath(locale,"/shida/appartements")}>{d.related} <span aria-hidden="true">↗</span></Link></div>
    <PublicMarketplaceHero eyebrow={d.eyebrow} title={d.title} intro={t.hotelIntro} image="/shida/shida-hotel.png" imageAlt={d.image} badge={`SHIDA / ${t.hotels.toLocaleUpperCase(locale)}`} browse={d.browse} href="#hotel-discovery"/>
    <section id="hotel-discovery" aria-labelledby="hotel-results-title">
      <form className="mp-search" action={path} method="get" role="search" aria-label={d.search}>
        <div className="mp-search-primary"><label>{d.search}<input type="search" name="query" defaultValue={search.query} placeholder={d.placeholder} maxLength={120}/></label><label>{t.city}<input name="city" defaultValue={search.city} placeholder={t.city} maxLength={120}/></label><button className="button button-primary" type="submit">{t.search}</button></div>
        {(search.query||search.city)&&<Link className="mp-search-reset" href={path}>{t.resetFilters}</Link>}
      </form>
      {cities.length>0&&<nav className="mp-chips" aria-label={t.city}><Link href={cityHref()} aria-current={!search.city?"page":undefined}>{d.all}</Link>{cities.map(city=><Link key={city} href={cityHref(city)} aria-current={search.city?.toLocaleLowerCase()===city.toLocaleLowerCase()?"page":undefined}>{city}</Link>)}</nav>}
      <div className="mp-results-heading"><h2 id="hotel-results-title">{d.results}</h2>{listings&&<p role="status">{items.length} {items.length===1?d.one:d.many}</p>}</div>
      {listings ? items.length>0 ? <div className="marketplace-grid">{items.map(listing=><HotelCard key={listing.public_ref} listing={listing} locale={locale}/>)}</div>
        : <MarketplaceState>{search.query||search.city?d.empty:t.emptyHotels}</MarketplaceState>
        : <MarketplaceState>{t.unavailable}</MarketplaceState>}
    </section>
    <PublicMarketplaceClosing copy={d} badge={`SHIDA / ${t.apartments.toLocaleUpperCase(locale)}`} href={marketplacePath(locale,"/shida/appartements")}/>
  </div></div>;
}

export async function ApartmentDetailPage({ locale, slug }: { locale: Locale; slug: string }) {
  let listing;
  try { listing = await getApartment(slug); }
  catch (error) {
    if (error instanceof ShidaApiError && error.kind === "not-found") notFound();
    if (!unavailable(error)) throw error;
  }
  return listing ? <ApartmentDetail listing={listing} locale={locale}/> : <section className="section"><MarketplaceState>{marketplaceCopy[locale].unavailable}</MarketplaceState></section>;
}

export async function HotelDetailPage({ locale, slug }: { locale: Locale; slug: string }) {
  let listing;
  try { listing = await getHotel(slug); }
  catch (error) {
    if (error instanceof ShidaApiError && error.kind === "not-found") notFound();
    if (!unavailable(error)) throw error;
  }
  return listing ? <HotelDetail listing={listing} locale={locale}/> : <section className="section"><MarketplaceState>{marketplaceCopy[locale].unavailable}</MarketplaceState></section>;
}

export async function ApartmentOwnerPage({ locale, owner }: { locale: Locale; owner: string }) {
  let profile;
  try { profile = await getApartmentOwner(owner); }
  catch (error) {
    if (error instanceof ShidaApiError && error.kind === "not-found") notFound();
    if (!unavailable(error)) throw error;
  }
  return profile ? <ApartmentOwnerProfile locale={locale} profile={profile}/> : <section className="section"><MarketplaceState>{marketplaceCopy[locale].unavailable}</MarketplaceState></section>;
}

function detailMetadata(locale: Locale, path: string, title: string, description: string | null, image: string | null): Metadata {
  const canonical = marketplacePath(locale, path);
  const englishPath = path;
  const frenchPath = `/fr${path}`;
  return {
    title, description: description ?? undefined,
    alternates: { canonical, languages: { en: englishPath, fr: frenchPath, "x-default": englishPath } },
    openGraph: { title, description: description ?? undefined, url: canonical, images: [{ url: image ?? "/NIHILOBA_logo.png", alt: title }] },
  };
}

export async function apartmentDetailMetadata(locale: Locale, slug: string): Promise<Metadata> {
  try {
    const listing = await getApartment(slug);
    const image = listing.images.map((item) => safePublicImageUrl(item.url)).find(Boolean) ?? null;
    const location = publicLocation(listing.commune, listing.city);
    const title = location ? `${listing.title} ${locale === "fr" ? "à" : "in"} ${location}` : listing.title;
    return detailMetadata(locale, `/shida/appartements/${listing.slug}`, title, listing.description, image);
  } catch { return { title: marketplaceCopy[locale].notFound, robots: { index: false, follow: false } }; }
}

export async function hotelDetailMetadata(locale: Locale, slug: string): Promise<Metadata> {
  try {
    const listing = await getHotel(slug);
    const image = firstHotelRoomImage(listing.room_types, listing.name);
    const location = publicLocation(listing.city, listing.country_code);
    const title = location ? `${listing.name} ${locale === "fr" ? "à" : "in"} ${location}` : listing.name;
    return detailMetadata(locale, `/shida/hotels/${listing.slug}`, title, listing.description, image);
  } catch { return { title: marketplaceCopy[locale].notFound, robots: { index: false, follow: false } }; }
}

export async function apartmentOwnerMetadata(locale: Locale, owner: string): Promise<Metadata> {
  try {
    const profile = await getApartmentOwner(owner);
    const path = `/shida/appartements/proprietaires/${encodeURIComponent(profile.slug || profile.public_ref)}`;
    const count = profile.active_apartment_count;
    const title = locale === "fr"
      ? `${profile.public_name} | Logements disponibles sur SHIDA`
      : `${profile.public_name} | Available homes on SHIDA`;
    const location = publicLocation(profile.area, profile.city);
    const description = locale === "fr"
      ? `Découvrez ${count} logement${count === 1 ? "" : "s"} disponible${count === 1 ? "" : "s"} publié${count === 1 ? "" : "s"} par ${profile.public_name}${location ? ` à ${location}` : ""} sur SHIDA.`
      : `Discover ${count} available home${count === 1 ? "" : "s"} published by ${profile.public_name}${location ? ` in ${location}` : ""} on SHIDA.`;
    const image = profile.apartments.flatMap((listing) => listing.images).map((item) => safePublicImageUrl(item.url)).find(Boolean) ?? null;
    return detailMetadata(locale, path, title, profile.description ?? description, image);
  } catch { return { title: marketplaceCopy[locale].ownerNotFound, robots: { index: false, follow: false } }; }
}
