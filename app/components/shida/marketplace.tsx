import Link from "next/link";
import type { Locale } from "../../lib/i18n";
import { safePublicActionUrl, safePublicImageUrl } from "../../lib/safe-public-url";
import type { ApartmentListing, HotelListing, HotelRoomType, PublicApartmentOwnerSummary } from "../../types/shida-public";
import { ButtonLink } from "../button-link";
import { firstHotelRoomImage, resolveHotelRoomImages } from "./hotel-room-images";
import { ImageGallery } from "./image-gallery";
import { marketplaceCopy } from "./marketplace-copy";
import { MarketplaceImage } from "./marketplace-image";
import { AvailabilityBadge, availabilityLabel, MarketplaceBreadcrumb, MarketplaceFacts } from "./marketplace-primitives";
import type { MarketplaceFact } from "./marketplace-primitives";

export function marketplacePath(locale: Locale, path: string): string {
  return locale === "en" ? path : `/${locale}${path}`;
}

export function apartmentOwnerPath(locale: Locale, owner: Pick<PublicApartmentOwnerSummary, "public_ref" | "slug">): string {
  const identifier = owner.slug || owner.public_ref;
  return marketplacePath(locale, `/shida/appartements/proprietaires/${encodeURIComponent(identifier)}`);
}

export function propertyTypeLabel(type: ApartmentListing["property_type"], locale: Locale): string | null {
  return type ? marketplaceCopy[locale].propertyTypes[type] : null;
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
      <ButtonLink href={marketplacePath(locale, "/shida/wenze")} variant="secondary">{t.wenze}</ButtonLink>
    </div>
  </div></section>;
}

export function MarketplaceState({ children }: { children: string }) {
  return <div className="container marketplace-state" role="status"><p>{children}</p></div>;
}

export function ApartmentCard({ listing, locale }: { listing: ApartmentListing; locale: Locale }) {
  const t = marketplaceCopy[locale];
  const location = publicLocation(listing.quartier, listing.commune, listing.area, listing.city);
  const price = formatPrice(listing.rent, listing.currency, locale);
  const type = propertyTypeLabel(listing.property_type, locale);
  const image = listing.images.map((item) => ({ ...item, safeUrl: safePublicImageUrl(item.url) })).find((item) => item.safeUrl);
  return <article className="marketplace-card">
    <Link className="marketplace-card-image" href={marketplacePath(locale, `/shida/appartements/${listing.slug}`)}>
      <MarketplaceImage src={image?.safeUrl ?? null} alt={image?.alt || listing.title} fallback={t.imageUnavailable} />
    </Link>
    <div className="marketplace-card-body">
      <AvailabilityBadge state={listing.availability_state} locale={locale}/>
      <h2><Link href={marketplacePath(locale, `/shida/appartements/${listing.slug}`)}>{listing.title}</Link></h2>
      {location && <p className="marketplace-location">{location}</p>}
      <div className="marketplace-card-facts">
        {price && <strong>{price} <small>/ {t.perMonth}</small></strong>}
        {type && <span>{type}</span>}
        {listing.number_of_rooms != null && <span>{listing.number_of_rooms} {t.rooms}</span>}
      </div>
      {listing.description && <p className="marketplace-description">{listing.description}</p>}
      {listing.owner && <ApartmentOwnerSummary owner={listing.owner} locale={locale}/>}
      <ButtonLink href={marketplacePath(locale, `/shida/appartements/${listing.slug}`)} variant="text">{t.details}</ButtonLink>
    </div>
  </article>;
}

export function ApartmentDetail({ listing, locale }: { listing: ApartmentListing; locale: Locale }) {
  const t = marketplaceCopy[locale];
  const location = publicLocation(listing.quartier, listing.commune, listing.area, listing.city);
  const price = formatPrice(listing.rent, listing.currency, locale);
  const status = availabilityLabel(listing.availability_state, locale);
  const action = safePublicActionUrl(listing.visit_url);
  const images = listing.images.flatMap((item) => {
    const url = safePublicImageUrl(item.url);
    return url ? [{ url, alt: item.alt }] : [];
  });
  const facts: MarketplaceFact[] = [];
  if (price) facts.push({ label: t.price, value: `${price} / ${t.perMonth}` });
  if (listing.number_of_rooms != null) facts.push({ label: t.rooms, value: `${listing.number_of_rooms} ${t.rooms}` });
  if (location) facts.push({ label: t.location, value: location });
  if (status) facts.push({ label: t.availability, value: status });
  const locationDetails = [
    listing.quartier ? { label: "Quartier", value: listing.quartier } : null,
    listing.commune ? { label: "Commune", value: listing.commune } : null,
    listing.area && listing.area !== listing.commune ? { label: locale === "fr" ? "Zone" : "Area", value: listing.area } : null,
    listing.city ? { label: locale === "fr" ? "Ville" : "City", value: listing.city } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);
  return <>
    <section className="marketplace-detail-hero"><div className="container">
      <MarketplaceBreadcrumb label={t.breadcrumb} items={[
        { label: t.home, href: locale === "en" ? "/" : `/${locale}` },
        { label: "SHIDA", href: marketplacePath(locale, "/shida") },
        { label: t.apartments, href: marketplacePath(locale, "/shida/appartements") },
        { label: listing.title },
      ]}/>
      <h1>{listing.title}</h1>{location && <p className="marketplace-detail-location">{location}</p>}
    </div></section>
    <section className="marketplace-gallery-section"><div className="container"><ImageGallery images={images} title={listing.title} fallback={t.imageUnavailable} photosLabel={t.photos} preload/></div></section>
    <section className="section marketplace-property-section"><div className="container">
      <MarketplaceFacts facts={facts}/>
      <div className="marketplace-detail">
        <aside className="marketplace-action-card">
          <AvailabilityBadge state={listing.availability_state} locale={locale}/>
          {price && <p className="marketplace-price">{price}<small>/ {t.perMonth}</small></p>}
          {listing.number_of_rooms != null && <p>{listing.number_of_rooms} {t.rooms}</p>}
          <h2>{t.visitTitle}</h2><p>{t.visitText}</p>
          {action ? <ButtonLink href={action} external className="marketplace-visit-button">{t.visit}</ButtonLink> : <p className="marketplace-action-unavailable">{t.actionUnavailable}</p>}
        </aside>
        <div className="marketplace-property-content">
          {listing.description && <section><h2>{t.descriptionTitle}</h2><p className="lead-copy">{listing.description}</p></section>}
          {locationDetails.length > 0 && <section><h2>{t.detailsTitle}</h2><dl className="marketplace-property-details">{locationDetails.map((detail) => <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl></section>}
          {listing.owner && <section><ApartmentOwnerSummary owner={listing.owner} locale={locale} extended/></section>}
        </div>
      </div>
    </div></section>
  </>;
}

export function ApartmentOwnerSummary({ locale, owner, extended = false }: {
  locale: Locale;
  owner: PublicApartmentOwnerSummary;
  extended?: boolean;
}) {
  const t = marketplaceCopy[locale];
  const href = apartmentOwnerPath(locale, owner);
  return <div className={extended ? "marketplace-owner-summary marketplace-owner-summary-detail" : "marketplace-owner-summary"}>
    <span>{t.publishedBy}</span>
    <Link href={href}>{owner.public_name}</Link>
    {extended && <ButtonLink href={href} variant="text">{t.ownerListings} {owner.public_name}</ButtonLink>}
  </div>;
}

function hotelImage(listing: HotelListing): string | null {
  return firstHotelRoomImage(listing.room_types, listing.name);
}

function rentalPeriodLabel(period: string | null, locale: Locale): string | null {
  if (!period) return null;
  const labels: Record<Locale, Record<string, string>> = {
    en: { night: "night", day: "day", week: "week", month: "month" },
    fr: { night: "nuit", day: "jour", week: "semaine", month: "mois" },
  };
  return labels[locale][period.trim().toLowerCase()] ?? null;
}

export function HotelRoomCard({ room, hotelName, locale, bookingUrl = null }: { room: HotelRoomType; hotelName: string; locale: Locale; bookingUrl?: string | null }) {
  const t = marketplaceCopy[locale];
  const images = resolveHotelRoomImages(room, hotelName);
  const price = formatPrice(room.price, room.currency, locale);
  const period = rentalPeriodLabel(room.rental_period, locale);
  const action = safePublicActionUrl(bookingUrl);
  return <article className="marketplace-room">
    <div className="marketplace-room-gallery"><ImageGallery images={images} title={`${room.name} - ${hotelName}`} fallback={t.imageUnavailable} photosLabel={`${t.roomPhotos}: ${room.name}`} sizes="(max-width: 720px) calc(100vw - 64px), 34vw"/></div>
    <div className="marketplace-room-copy"><h3>{room.name}</h3>
      {price && <p className="marketplace-price">{price}{period && <small> / {period}</small>}</p>}
      {room.capacity != null && <p>{t.capacity}: {room.capacity} {t.guests}</p>}
      {room.total_rooms != null && <p>{room.total_rooms} {t.availableRooms}</p>}
      {room.description && <p>{room.description}</p>}
      {action && <ButtonLink href={action} external className="marketplace-room-booking">{t.bookRoom}</ButtonLink>}
    </div>
  </article>;
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
      <div className="marketplace-room-grid">{listing.room_types.map((room, index) => <HotelRoomCard room={room} hotelName={listing.name} locale={locale} bookingUrl={listing.booking_url} key={`${room.name}-${index}`}/>)}</div>
      {action ? <ButtonLink href={action} external variant="secondary">{t.book}</ButtonLink> : <p className="marketplace-action-unavailable">{t.actionUnavailable}</p>}
    </div></section>
  </>;
}
