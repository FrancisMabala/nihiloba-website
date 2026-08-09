import Link from "next/link";
import type { Locale } from "../../lib/i18n";
import type {
  ApartmentCollection,
  ApartmentPropertyType,
  ApartmentSearch,
  PublicApartmentOwnerProfile,
} from "../../types/shida-public";
import { ApartmentCard, marketplacePath, propertyTypeLabel, publicLocation } from "./marketplace";
import { marketplaceCopy } from "./marketplace-copy";
import { MarketplaceBreadcrumb } from "./marketplace-primitives";

function hasAdvancedFilters(search: ApartmentSearch): boolean {
  return Boolean(search.city || search.area || search.property_type || search.bedrooms != null || search.min_price != null || search.max_price != null);
}

export function hasApartmentSearch(search: ApartmentSearch): boolean {
  return Boolean(search.query || hasAdvancedFilters(search));
}

function value(value: string | number | undefined): string | number | undefined {
  return value == null ? undefined : value;
}

export function ApartmentFilters({ locale, search, propertyTypes }: {
  locale: Locale;
  search: ApartmentSearch;
  propertyTypes: ApartmentPropertyType[];
}) {
  const t = marketplaceCopy[locale];
  const action = marketplacePath(locale, "/shida/appartements");
  return <form className="marketplace-filters" action={action} method="get">
    <div className="marketplace-search-row">
      <label><span>{t.searchLabel}</span><input type="search" name="query" defaultValue={search.query} placeholder={t.searchPlaceholder} maxLength={120}/></label>
      <button className="button button-primary" type="submit">{t.search}</button>
    </div>
    <details className="marketplace-advanced-filters" open={hasAdvancedFilters(search) || undefined}>
      <summary>{t.filters}</summary>
      <div className="marketplace-filter-grid">
        <label><span>{t.city}</span><input name="city" defaultValue={search.city} maxLength={120}/></label>
        <label><span>{t.area}</span><input name="area" defaultValue={search.area} maxLength={120}/></label>
        <label><span>{t.propertyType}</span><select name="property_type" defaultValue={search.property_type ?? ""}>
          <option value="">{t.any}</option>
          {propertyTypes.map((type) => <option value={type} key={type}>{propertyTypeLabel(type, locale)}</option>)}
        </select></label>
        <label><span>{t.bedrooms}</span><input type="number" name="bedrooms" min="1" max="100" step="1" inputMode="numeric" defaultValue={value(search.bedrooms)}/></label>
        <label><span>{t.minimumPrice}</span><input type="number" name="min_price" min="0" step="1" inputMode="numeric" defaultValue={value(search.min_price)}/></label>
        <label><span>{t.maximumPrice}</span><input type="number" name="max_price" min="0" step="1" inputMode="numeric" defaultValue={value(search.max_price)}/></label>
      </div>
      <div className="marketplace-filter-actions">
        <button className="button button-secondary" type="submit">{t.applyFilters}</button>
        {hasApartmentSearch(search) && <Link href={action}>{t.resetFilters}</Link>}
      </div>
    </details>
  </form>;
}

function paginationHref(locale: Locale, search: ApartmentSearch, page: number): string {
  const params = new URLSearchParams();
  for (const key of ["query", "city", "area", "property_type"] as const) {
    const item = search[key];
    if (item) params.set(key, item);
  }
  for (const key of ["bedrooms", "min_price", "max_price", "page_size"] as const) {
    const item = search[key];
    if (item != null) params.set(key, String(item));
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `${marketplacePath(locale, "/shida/appartements")}${query ? `?${query}` : ""}`;
}

export function ApartmentPagination({ locale, search, collection }: {
  locale: Locale;
  search: ApartmentSearch;
  collection: ApartmentCollection;
}) {
  const t = marketplaceCopy[locale];
  const totalPages = Math.max(1, Math.ceil(collection.total / collection.page_size));
  if (totalPages <= 1) return null;
  return <nav className="marketplace-pagination" aria-label={`${t.page} ${collection.page} ${t.of} ${totalPages}`}>
    {collection.page > 1
      ? <Link className="button button-secondary" href={paginationHref(locale, search, collection.page - 1)}>← {t.previous}</Link>
      : <span/>}
    <span>{t.page} {collection.page} {t.of} {totalPages}</span>
    {collection.page < totalPages
      ? <Link className="button button-secondary" href={paginationHref(locale, search, collection.page + 1)}>{t.next} →</Link>
      : <span/>}
  </nav>;
}

export function ApartmentOwnerProfile({ locale, profile }: { locale: Locale; profile: PublicApartmentOwnerProfile }) {
  const t = marketplaceCopy[locale];
  const location = publicLocation(profile.area, profile.city);
  return <>
    <section className="marketplace-detail-hero"><div className="container">
      <MarketplaceBreadcrumb label={t.breadcrumb} items={[
        { label: t.home, href: locale === "en" ? "/" : `/${locale}` },
        { label: "SHIDA", href: marketplacePath(locale, "/shida") },
        { label: t.apartments, href: marketplacePath(locale, "/shida/appartements") },
        { label: profile.public_name },
      ]}/>
      <p className="eyebrow">SHIDA · {t.ownerProfile}</p>
      <h1>{profile.public_name}</h1>
      {location && <p className="marketplace-detail-location">{location}</p>}
      <p className="marketplace-owner-count">{profile.active_apartment_count} {profile.active_apartment_count === 1 ? t.result : t.results}</p>
      {profile.description && <p className="marketplace-owner-description">{profile.description}</p>}
    </div></section>
    <section className="section marketplace-owner-listings"><div className="container">
      <div className="marketplace-section-heading"><h2>{t.availableListings}</h2><Link href={marketplacePath(locale, "/shida/appartements")}>{t.backToListings}</Link></div>
      {profile.apartments.length > 0
        ? <div className="marketplace-grid">{profile.apartments.map((listing) => <ApartmentCard key={listing.public_ref} listing={listing} locale={locale}/>)}</div>
        : <div className="marketplace-state" role="status"><p>{t.ownerEmpty}</p></div>}
    </div></section>
  </>;
}
