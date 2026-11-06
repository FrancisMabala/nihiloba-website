import Link from "next/link";
import type { ServiceLocale as Locale } from "../../lib/services-i18n";
import { safePublicActionUrl, safePublicImageUrl } from "../../lib/safe-public-url";
import type { ApartmentListing, HotelListing, HotelRoomType, PublicApartmentOwnerSummary } from "../../types/shida-public";
import { ButtonLink } from "../button-link";
import { firstHotelRoomImage, resolveHotelRoomImages } from "./hotel-room-images";
import { ImageGallery } from "./image-gallery";
import { marketplaceCopy } from "./marketplace-copy";
import { MarketplaceImage } from "./marketplace-image";
import { AvailabilityBadge, MarketplaceBreadcrumb } from "./marketplace-primitives";
import { apartmentDetailCopy } from "../../lib/apartment-detail-copy";
import "./apartment-detail.css";
import { ApartmentReport } from './apartment-report';
import { apartmentSafetyCopy } from '../../lib/apartment-safety-copy';
import { ApartmentInterest } from './apartment-interest';
import { apartmentInterestCopy } from '../../lib/apartment-interest-copy';

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
      <ButtonLink href={marketplacePath(locale, "/shida/restaurants")} variant="secondary">Restaurants &amp; Malewa</ButtonLink>
      <ButtonLink href={marketplacePath(locale, "/shida/emplois")} variant="secondary">{t.jobs}</ButtonLink>
      <ButtonLink href={marketplacePath(locale, "/shida/appartements")} variant="secondary">{t.apartments}</ButtonLink>
      <ButtonLink href={marketplacePath(locale, "/shida/hotels")} variant="secondary">{t.hotels}</ButtonLink>
      <ButtonLink href={marketplacePath(locale, "/shida/services")} variant="secondary">{t.services}</ButtonLink>
      <ButtonLink href={marketplacePath(locale, "/shida/wenze")} variant="secondary">{t.wenze}</ButtonLink>
    </div>
  </div></section>;
}

export function MarketplaceState({ children }: { children: string }) {
  return <div className="container marketplace-state" role="status"><p>{children}</p></div>;
}

function apartmentTitle(listing: ApartmentListing, locale: Locale): string {
  const type = propertyTypeLabel(listing.property_type, locale);
  if (!type || listing.bedroom_count == null) return listing.title;
  const t = apartmentDetailCopy[locale];
  return `${type} · ${listing.bedroom_count} ${listing.bedroom_count === 1 ? t.bedroom : t.bedrooms}${listing.commune ? ` — ${listing.commune}` : ''}`;
}

export function ApartmentCard({ listing, locale }: { listing: ApartmentListing; locale: Locale }) {
  const t = marketplaceCopy[locale];
  const title = apartmentTitle(listing, locale);
  const location = publicLocation(listing.quartier, listing.commune, listing.area, listing.city);
  const price = formatPrice(listing.rent, listing.currency, locale);
  const type = propertyTypeLabel(listing.property_type, locale);
  const image = listing.images.map((item) => ({ ...item, safeUrl: safePublicImageUrl(item.url) })).find((item) => item.safeUrl);
  const href = marketplacePath(locale, `/shida/appartements/${encodeURIComponent(listing.slug)}`);
  return <article className="marketplace-card apt-card">
    <Link className="marketplace-card-image" href={href}>
      <MarketplaceImage src={image?.safeUrl ?? null} alt={image?.alt || title} fallback={t.imageUnavailable} />
    </Link>
    <div className="marketplace-card-body">
      <AvailabilityBadge state={listing.availability_state} locale={locale}/>
      <h2><Link href={href}>{title}</Link></h2>
      {location && <p className="marketplace-location">{location}</p>}
      <div className="marketplace-card-facts">
        {price && <strong>{price} <small>/ {t.perMonth}</small></strong>}
        {type && <span>{type}</span>}
        {listing.bedroom_count == null && listing.number_of_rooms != null && <span>{listing.number_of_rooms} {t.rooms}</span>}
      </div>
      <ButtonLink href={href} variant="text">{t.details}</ButtonLink>
      {listing.owner && <ApartmentOwnerSummary owner={listing.owner} locale={locale}/>}
    </div>
  </article>;
}

export function ApartmentDetail({ listing, locale }: { listing: ApartmentListing; locale: Locale }) {
  const t = marketplaceCopy[locale], d = apartmentDetailCopy[locale], safety = apartmentSafetyCopy[locale];
  const title = apartmentTitle(listing, locale);
  const location = publicLocation(listing.quartier, listing.commune, listing.area, listing.city);
  const price = formatPrice(listing.rent, listing.currency, locale);
  const action = listing.availability_state?.toLowerCase() === 'available' ? safePublicActionUrl(listing.visit_url) : null;
  const images = listing.images.flatMap((item) => {
    const url = safePublicImageUrl(item.url);
    return url ? [{ url, alt: item.alt }] : [];
  });
  const equipment = (['water','electricity','bathroom','toilet','kitchen','parking'] as const).filter(key => listing.amenities?.[key] === true);
  return <article className="apt-detail"><div className="container">
    <MarketplaceBreadcrumb label={t.breadcrumb} items={[
      {label:t.home,href:locale==='en'?'/':`/${locale}`},
      {label:'SHIDA',href:marketplacePath(locale,'/shida')},
      {label:t.apartments,href:marketplacePath(locale,'/shida/appartements')}, {label:title},
    ]}/>
    <Link className="apt-back" href={marketplacePath(locale,'/shida/appartements')}>← {d.back}</Link>
    <header className="apt-heading"><div><h1>{title}</h1>{location && <p>{location}</p>}</div><AvailabilityBadge state={listing.availability_state} locale={locale}/></header>
    <div className="apt-hero">
      <ImageGallery images={images} title={title} fallback={t.imageUnavailable} photosLabel={t.photos} preload variant="portfolio" locale={locale} thumbnailLimit={5} sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1240px) 60vw, 740px"/>
      <aside className="apt-summary" aria-label={d.monthly}>
        <p>{d.monthly}</p>{price && <strong className="apt-rent">{price} <small>/ {t.perMonth}</small></strong>}
        <ul className="apt-facts">
          {listing.bedroom_count != null && <li>{listing.bedroom_count} {listing.bedroom_count === 1 ? d.bedroom : d.bedrooms}</li>}
          {listing.number_of_rooms != null && <li>{d.rooms} : {listing.number_of_rooms}</li>}
          {listing.size_sqm != null && <li>{d.size} : {listing.size_sqm} m²</li>}
          {equipment.filter(key=>key==='water'||key==='electricity'||key==='parking').map(key=><li key={key}>{d[key]} <small>· {d.declared}</small></li>)}
        </ul>
        {listing.availability_state?.toLowerCase()==='available' && <ApartmentInterest locale={locale} reference={listing.public_ref} title={title}/>}
        {action && <a href={action} target="_blank" rel="noopener noreferrer">{apartmentInterestCopy[locale].whatsapp}<span className="sr-only"> · {d.visit}</span></a>}
        <p className="apt-privacy">{d.privacy}</p>
      </aside>
    </div>
    <div className="apt-panels">
      <section className="apt-panel"><h2>{d.home}</h2>
        {listing.description && <p className="apt-description">{listing.description}</p>}
        {equipment.length>0 && <><p>{d.declared}</p><ul className="apt-equipment">{equipment.map(key=><li key={key}>{d[key]}</li>)}</ul></>}
      </section>
      <section className="apt-panel"><h2>{d.terms}</h2>{price && <p>{d.monthly} : <strong>{price}</strong></p>}<p>{d.unknown}</p></section>
      <section className="apt-panel"><h2>{safety.title}</h2>
        {listing.advertiser_role && <p>{safety.roles[listing.advertiser_role]}</p>}
        <ul><li>{safety.identity}</li><li>{safety.property}</li><li>{safety.independent}</li></ul>
        <p className="apt-safety-notice">{safety.notice}</p><ApartmentReport locale={locale} reference={listing.public_ref}/>
      </section>
    </div>
    {listing.owner && <div className="apt-owner"><ApartmentOwnerSummary owner={listing.owner} locale={locale} extended/></div>}
    <section className="apt-publish"><h2>{d.publish}</h2><ButtonLink href={marketplacePath(locale,'/shida/appartements/publier')}>{d.publishAction} →</ButtonLink></section>
  </div></article>;
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
    en: { hourly: "hour", hour: "hour", night: "night", day: "day", week: "week", month: "month" },
    ln: {hourly:"ngonga",hour:"ngonga",night:"butu",day:"mokolo",week:"poso",month:"sanza"},
    sw: {hourly:"saa",hour:"saa",night:"usiku",day:"siku",week:"wiki",month:"mwezi"},
    fr: { hourly: "heure", hour: "heure", night: "nuit", day: "jour", week: "semaine", month: "mois" },
  };
  return labels[locale][period.trim().toLowerCase()] ?? period;
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
  // Compare only like currencies and rental periods, never USD against CDF.
  const rates=new Map<string,{price:number;currency:string|null;period:string|null}>();
  for(const room of listing.room_types){if(room.price==null)continue;const key=`${room.currency}|${room.rental_period}`;if(!rates.has(key)||rates.get(key)!.price>room.price)rates.set(key,{price:room.price,currency:room.currency,period:room.rental_period});}
  return <article className="marketplace-card">
    <Link className="marketplace-card-image" href={marketplacePath(locale, `/shida/hotels/${listing.slug}`)}><MarketplaceImage src={hotelImage(listing)} alt={listing.name} fallback={t.imageUnavailable}/></Link>
    <div className="marketplace-card-body"><h2><Link href={marketplacePath(locale, `/shida/hotels/${listing.slug}`)}>{listing.name}</Link></h2>
      {location && <p className="marketplace-location">{location}</p>}
      {rates.size>0&&<div className="hotel-prices">{[...rates].map(([key,rate])=><p key={key}>{t.from} <strong>{formatPrice(rate.price,rate.currency,locale)}</strong>{rentalPeriodLabel(rate.period,locale)&&<> / {rentalPeriodLabel(rate.period,locale)}</>}</p>)}</div>}{listing.room_types.length>0&&<p>{listing.room_types.length} {({en:"room options",fr:"types de chambre",ln:"lolenge ya bashambre",sw:"aina za vyumba"})[locale]}</p>}
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
    <section className="marketplace-detail-hero"><div className="container"><MarketplaceBreadcrumb label={t.breadcrumb} items={[{label:"SHIDA",href:marketplacePath(locale,"/shida")},{label:t.hotels,href:marketplacePath(locale,"/shida/hotels")},{label:listing.name}]}/><h1>{listing.name}</h1>{location && <p>{location}</p>}</div></section>
    <section className="section"><div className="container marketplace-hotel-detail">
      {listing.description && <p className="lead-copy">{listing.description}</p>}
      {listing.landmark && <p><strong>{t.landmark}:</strong> {listing.landmark}</p>}
      <h2>{t.roomTypes}</h2>
      <div className="marketplace-room-grid">{listing.room_types.map((room, index) => <HotelRoomCard room={room} hotelName={listing.name} locale={locale} bookingUrl={listing.booking_url} key={`${room.name}-${index}`}/>)}</div>
      {action ? <ButtonLink href={action} external variant="secondary">{t.book}</ButtonLink> : <p className="marketplace-action-unavailable">{t.actionUnavailable}</p>}
    </div></section>
  </>;
}
