import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "../../lib/i18n";
import { safePublicImageUrl } from "../../lib/safe-public-url";
import { getApartment, getApartments, getHotel, getHotels, ShidaApiError } from "../../services/shida/public-client";
import { ApartmentCard, ApartmentDetail, HotelCard, HotelDetail, marketplacePath, MarketplaceState, publicLocation } from "./marketplace";
import { marketplaceCopy } from "./marketplace-copy";

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

export async function ApartmentCollectionPage({ locale }: { locale: Locale }) {
  const t = marketplaceCopy[locale];
  let listings;
  try {
    listings = await getApartments();
  } catch (error) {
    if (!unavailable(error)) throw error;
  }
  return <><section className="marketplace-heading"><div className="container"><p className="eyebrow">SHIDA · {t.apartments}</p><h1>{t.apartmentTitle}</h1><p>{t.apartmentIntro}</p></div></section>
    <section className="section">{listings ? <><div className="container marketplace-grid">{listings.items.map((listing) => <ApartmentCard key={listing.public_ref} listing={listing} locale={locale}/>)}</div>{listings.items.length === 0 && <MarketplaceState>{t.emptyApartments}</MarketplaceState>}</> : <MarketplaceState>{t.unavailable}</MarketplaceState>}</section></>;
}

export async function HotelCollectionPage({ locale }: { locale: Locale }) {
  const t = marketplaceCopy[locale];
  let listings;
  try {
    listings = await getHotels();
  } catch (error) {
    if (!unavailable(error)) throw error;
  }
  return <><section className="marketplace-heading"><div className="container"><p className="eyebrow">SHIDA · {t.hotels}</p><h1>{t.hotelTitle}</h1><p>{t.hotelIntro}</p></div></section>
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
    const image = listing.room_types.map((room) => safePublicImageUrl(room.image_reference)).find(Boolean) ?? null;
    const location = publicLocation(listing.city, listing.country_code);
    const title = location ? `${listing.name} ${locale === "fr" ? "à" : "in"} ${location}` : listing.name;
    return detailMetadata(locale, `/shida/hotels/${listing.slug}`, title, listing.description, image);
  } catch { return { title: marketplaceCopy[locale].notFound, robots: { index: false, follow: false } }; }
}
