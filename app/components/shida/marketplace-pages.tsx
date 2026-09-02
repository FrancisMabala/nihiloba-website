import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "../../lib/i18n";
import { safePublicImageUrl } from "../../lib/safe-public-url";
import { getApartment, getApartmentOwner, getApartments, getHotel, getHotels, ShidaApiError } from "../../services/shida/public-client";
import type { ApartmentSearch } from "../../types/shida-public";
import { apartmentPropertyTypes } from "../../types/shida-public";
import { ApartmentFilters, ApartmentOwnerProfile, ApartmentPagination, hasApartmentSearch } from "./apartment-marketplace";
import { ApartmentCard, ApartmentDetail, HotelCard, HotelDetail, marketplacePath, MarketplaceState, publicLocation } from "./marketplace";
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
  const t = marketplaceCopy[locale];
  let listings;
  try {
    listings = await getApartments({ ...search, page: search.page ?? 1, page_size: search.page_size ?? 12 });
  } catch (error) {
    if (!unavailable(error)) throw error;
  }
  return <><section className="marketplace-heading"><div className="container"><MarketplaceSectionBreadcrumb locale={locale} current={t.apartments}/><h1>{t.apartmentTitle}</h1><p>{t.apartmentIntro}</p></div></section>
    <section className="section marketplace-collection"><div className="container">
      <ApartmentFilters locale={locale} search={search} propertyTypes={listings?.filters.property_types ?? [...apartmentPropertyTypes]}/>
      {listings ? <>
        <p className="marketplace-result-count" role="status">{listings.total} {listings.total === 1 ? t.result : t.results}</p>
        {listings.items.length > 0
          ? <div className="marketplace-grid">{listings.items.map((listing) => <ApartmentCard key={listing.public_ref} listing={listing} locale={locale}/>)}</div>
          : <div className="marketplace-empty-results"><MarketplaceState>{hasApartmentSearch(search) ? t.noSearchResults : t.emptyApartments}</MarketplaceState>{hasApartmentSearch(search) && <Link className="button button-secondary" href={marketplacePath(locale, "/shida/appartements")}>{t.resetFilters}</Link>}</div>}
        <ApartmentPagination locale={locale} search={search} collection={listings}/>
      </> : <MarketplaceState>{t.unavailable}</MarketplaceState>}
    </div></section></>;
}

export async function HotelCollectionPage({ locale }: { locale: Locale }) {
  const t = marketplaceCopy[locale];
  let listings;
  try {
    listings = await getHotels();
  } catch (error) {
    if (!unavailable(error)) throw error;
  }
  return <><section className="marketplace-heading"><div className="container"><MarketplaceSectionBreadcrumb locale={locale} current={t.hotels}/><h1>{t.hotelTitle}</h1><p>{t.hotelIntro}</p></div></section>
    <section className="section">{listings ? <><div className="container marketplace-grid">{listings.items.map((listing) => <HotelCard key={listing.public_ref} listing={listing} locale={locale}/>)}</div>{listings.items.length === 0 && <MarketplaceState>{t.emptyHotels}</MarketplaceState>}</> : <MarketplaceState>{t.unavailable}</MarketplaceState>}</section></>;
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
