import Link from "next/link";
import type { Locale } from "../../lib/i18n";
import { safePublicActionUrl, safePublicImageUrl } from "../../lib/safe-public-url";
import type { ApartmentListing, HotelListing } from "../../types/shida-public";
import { ButtonLink } from "../button-link";
import { marketplaceCopy } from "./marketplace-copy";
import { MarketplaceImage } from "./marketplace-image";

export function marketplacePath(locale: Locale, path: string): string {
  return locale === "en" ? path : `/${locale}${path}`;
}

export function formatPrice(amount: number | null, currency: string | null, locale: Locale): string | null {
  if (amount == null) return null;
  if (!currency) return new Intl.NumberFormat(locale).format(amount);
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${new Intl.NumberFormat(locale).format(amount)} ${currency}`;
  }
}

export function publicLocation(...parts: Array<string | null>): string {
  return [...new Set(parts.filter((part): part is string => Boolean(part?.trim())))].join(", ");
}

export function MarketplaceGateway({ locale }: { locale: Locale }) {
  const t = marketplaceCopy[locale];
  return <section className="section marketplace-gateway"><div className="container">
    <p className="eyebrow">{t.browse}</p><h2>{t.gateway}</h2><p>{t.gatewayText}</p>
    <div className="marketplace-gateway-links">
      <ButtonLink href={marketplacePath(locale, "/shida/appartements")}>{t.apartments}</ButtonLink>
      <ButtonLink href={marketplacePath(locale, "/shida/hotels")} variant="secondary">{t.hotels}</ButtonLink>
    </div>
  </div></section>;
}

export function MarketplaceState({ children }: { children: string }) {
  return <div className="container marketplace-state" role="status"><p>{children}</p></div>;
}

export function ApartmentCard({ listing, locale }: { listing: ApartmentListing; locale: Locale }) {
  const t = marketplaceCopy[locale];
  const location = publicLocation(listing.quartier, listing.commune, listing.area, listing.city);
  const image = listing.images.map((item) => ({ ...item, safeUrl: safePublicImageUrl(item.url) })).find((item) => item.safeUrl);
  return <article className="marketplace-card">
    <Link className="marketplace-card-image" href={marketplacePath(locale, `/shida/appartements/${listing.slug}`)}>
      <MarketplaceImage src={image?.safeUrl ?? null} alt={image?.alt || listing.title} fallback={t.imageUnavailable} />
    </Link>
    <div className="marketplace-card-body">
      {listing.availability_state && <span className="marketplace-status">{listing.availability_state}</span>}
      <h2><Link href={marketplacePath(locale, `/shida/appartements/${listing.slug}`)}>{listing.title}</Link></h2>
      {location && <p className="marketplace-location">{location}</p>}
      <div className="marketplace-facts">
        {formatPrice(listing.rent, listing.currency, locale) && <strong>{formatPrice(listing.rent, listing.currency, locale)}</strong>}
        {listing.number_of_rooms != null && <span>{listing.number_of_rooms} {t.rooms}</span>}
      </div>
      {listing.description && <p className="marketplace-description">{listing.description}</p>}
      <ButtonLink href={marketplacePath(locale, `/shida/appartements/${listing.slug}`)} variant="text">{t.details}</ButtonLink>
    </div>
  </article>;
}

export function ApartmentDetail({ listing, locale }: { listing: ApartmentListing; locale: Locale }) {
  const t = marketplaceCopy[locale];
  const location = publicLocation(listing.quartier, listing.commune, listing.area, listing.city);
  const action = safePublicActionUrl(listing.visit_url);
  const images = listing.images.map((item) => ({ ...item, safeUrl: safePublicImageUrl(item.url) })).filter((item) => item.safeUrl);
  return <>
    <section className="marketplace-detail-hero"><div className="container">
      <Link className="marketplace-back" href={marketplacePath(locale, "/shida/appartements")}>← {t.backApartments}</Link>
      <p className="eyebrow">SHIDA · {t.apartments}</p><h1>{listing.title}</h1>{location && <p>{location}</p>}
    </div></section>
    <section className="section"><div className="container marketplace-detail">
      <div className="marketplace-gallery">{images.length ? images.map((item, index) => <div className="marketplace-gallery-image" key={`${item.url}-${index}`}><MarketplaceImage src={item.safeUrl} alt={item.alt || listing.title} fallback={t.imageUnavailable}/></div>) : <div className="marketplace-gallery-image"><MarketplaceImage src={null} alt="" fallback={t.imageUnavailable}/></div>}</div>
      <aside className="marketplace-detail-copy">
        {listing.availability_state && <p><strong>{t.availability}:</strong> {listing.availability_state}</p>}
        {formatPrice(listing.rent, listing.currency, locale) && <p className="marketplace-price">{formatPrice(listing.rent, listing.currency, locale)}</p>}
        {listing.number_of_rooms != null && <p>{listing.number_of_rooms} {t.rooms}</p>}
        {listing.description && <p>{listing.description}</p>}
        {action ? <ButtonLink href={action} external>{t.visit}</ButtonLink> : <p className="marketplace-action-unavailable">{t.actionUnavailable}</p>}
      </aside>
    </div></section>
  </>;
}

function hotelImage(listing: HotelListing): string | null {
  for (const room of listing.room_types) {
    const image = safePublicImageUrl(room.image_reference);
    if (image) return image;
  }
  return null;
}

export function HotelCard({ listing, locale }: { listing: HotelListing; locale: Locale }) {
  const t = marketplaceCopy[locale];
  const location = publicLocation(listing.quartier, listing.commune, listing.area, listing.city, listing.country_code);
  const prices = listing.room_types.map((room) => room.price).filter((price): price is number => price != null);
  const minimum = prices.length ? Math.min(...prices) : null;
  const currency = listing.room_types.find((room) => room.price === minimum)?.currency ?? null;
  return <article className="marketplace-card">
    <Link className="marketplace-card-image" href={marketplacePath(locale, `/shida/hotels/${listing.slug}`)}><MarketplaceImage src={hotelImage(listing)} alt={listing.name} fallback={t.imageUnavailable}/></Link>
    <div className="marketplace-card-body"><h2><Link href={marketplacePath(locale, `/shida/hotels/${listing.slug}`)}>{listing.name}</Link></h2>
      {location && <p className="marketplace-location">{location}</p>}
      {minimum != null && <p><span>{t.from} </span><strong>{formatPrice(minimum, currency, locale)}</strong></p>}
      {listing.description && <p className="marketplace-description">{listing.description}</p>}
      <ButtonLink href={marketplacePath(locale, `/shida/hotels/${listing.slug}`)} variant="text">{t.details}</ButtonLink>
    </div>
  </article>;
}

export function HotelDetail({ listing, locale }: { listing: HotelListing; locale: Locale }) {
  const t = marketplaceCopy[locale];
  const location = publicLocation(listing.address_line, listing.quartier, listing.commune, listing.area, listing.city, listing.country_code);
  const action = safePublicActionUrl(listing.booking_url);
  return <>
    <section className="marketplace-detail-hero"><div className="container"><Link className="marketplace-back" href={marketplacePath(locale, "/shida/hotels")}>← {t.backHotels}</Link><p className="eyebrow">SHIDA · {t.hotels}</p><h1>{listing.name}</h1>{location && <p>{location}</p>}</div></section>
    <section className="section"><div className="container marketplace-hotel-detail">
      {listing.description && <p className="lead-copy">{listing.description}</p>}
      {listing.landmark && <p><strong>{t.landmark}:</strong> {listing.landmark}</p>}
      <h2>{t.roomTypes}</h2>
      <div className="marketplace-room-grid">{listing.room_types.map((room, index) => <article className="marketplace-room" key={`${room.name}-${index}`}>
        <div className="marketplace-room-image"><MarketplaceImage src={safePublicImageUrl(room.image_reference)} alt={room.name} fallback={t.imageUnavailable}/></div>
        <div><h3>{room.name}</h3>{formatPrice(room.price, room.currency, locale) && <p className="marketplace-price">{formatPrice(room.price, room.currency, locale)}</p>}{room.capacity != null && <p>{t.capacity}: {room.capacity} {t.guests}</p>}{room.total_rooms != null && <p>{room.total_rooms} {t.availableRooms}</p>}{room.description && <p>{room.description}</p>}</div>
      </article>)}</div>
      {action ? <ButtonLink href={action} external>{t.book}</ButtonLink> : <p className="marketplace-action-unavailable">{t.actionUnavailable}</p>}
    </div></section>
  </>;
}
