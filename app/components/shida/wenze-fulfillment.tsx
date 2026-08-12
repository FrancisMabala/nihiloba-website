import type { Locale } from "../../lib/i18n";
import type { WenzeFulfillment } from "../../types/shida-public";

const copy = {
  en: { pickup: "Pickup available", pickupCompact: "Pickup available", delivery: "Delivery available", free: "Free delivery", areas: "Delivery areas", communes: "Communes served" },
  fr: { pickup: "Retrait en boutique", pickupCompact: "Retrait disponible", delivery: "Livraison disponible", free: "Livraison gratuite", areas: "Zones de livraison", communes: "Communes desservies" },
} as const;

function deliveryFee(fee: string | null, currency: string | null, locale: Locale) {
  if (!fee) return null;
  const trimmed = fee.trim();
  const amount = /^\d+(?:\.\d+)?$/.test(trimmed)
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Number(trimmed))
    : trimmed;
  return `${amount}${currency ? ` ${currency}` : ""}`;
}

export function WenzeFulfillmentInfo({ fulfillment, locale, city, compact = false }: {
  fulfillment: WenzeFulfillment;
  locale: Locale;
  city: string | null;
  compact?: boolean;
}) {
  const t = copy[locale];
  const pickup = fulfillment.methods.includes("pickup");
  const delivery = fulfillment.methods.includes("delivery");
  const fee = fulfillment.delivery?.fee_type === "fixed"
    ? deliveryFee(fulfillment.delivery.fee, fulfillment.delivery.currency, locale)
    : null;
  const deliveryLabel = fulfillment.delivery?.fee_type === "free"
    ? t.free
    : fee
      ? `${locale === "fr" ? "Livraison :" : "Delivery:"} ${fee}`
      : t.delivery;
  const areas = fulfillment.delivery?.areas ?? [];

  if (!pickup && !delivery) return null;
  return <div className={`wenze-fulfillment${compact ? " wenze-fulfillment-compact" : ""}`}>
    <ul>
      {pickup && <li><span aria-hidden="true">📍</span> {compact ? t.pickupCompact : t.pickup}</li>}
      {delivery && <li><span aria-hidden="true">🚚</span> {deliveryLabel}</li>}
    </ul>
    {!compact && delivery && areas.length > 0 && <div className="wenze-delivery-areas">
      <strong>{city?.toLowerCase() === "kinshasa" ? t.communes : t.areas}</strong>
      <div>{areas.map((area) => <span key={area}>{area}</span>)}</div>
    </div>}
  </div>;
}

export function WenzeDeliveryAreas({ fulfillment, locale, city }: {
  fulfillment: WenzeFulfillment;
  locale: Locale;
  city: string | null;
}) {
  const areas = fulfillment.delivery?.areas ?? [];
  if (!fulfillment.methods.includes("delivery") || areas.length === 0) return null;
  const t = copy[locale];
  return <div className="wenze-delivery-areas">
    <strong>{city?.toLowerCase() === "kinshasa" ? t.communes : t.areas}</strong>
    <div>{areas.map((area) => <span key={area}>{area}</span>)}</div>
  </div>;
}
