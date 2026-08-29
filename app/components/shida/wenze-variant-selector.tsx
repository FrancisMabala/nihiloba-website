"use client";

import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { safePublicActionUrl } from "../../lib/safe-public-url";
import type { WenzeProductVariant } from "../../types/shida-public";
import { WenzeCartActions } from "./wenze-cart-actions";

export const WENZE_VARIANT_CHIP_LIMIT = 8;

const labels = {
  en: { size: "Size", shoe_size: "Shoe size", storage: "Storage", volume: "Volume", other: "Option", sold: "Sold out", choose: "Select an option first.", unavailable: "This option cannot be opened on SHIDA right now.", buy: "Buy on SHIDA" },
  fr: { size: "Taille", shoe_size: "Pointure", storage: "Capacité", volume: "Volume", other: "Option", sold: "Épuisé", choose: "Choisissez d’abord une option.", unavailable: "Cette option ne peut pas être ouverte sur SHIDA pour le moment.", buy: "Acheter sur SHIDA" },
} as const;

export function variantTypeLabel(type: string | null, locale: Locale) {
  return labels[locale][type as keyof typeof labels.en] || labels[locale].other;
}

export function variantPurchaseUrl(variant: WenzeProductVariant | null) {
  return variant && variant.is_available && variant.available_stock !== 0
    ? safePublicActionUrl(variant.buy_url)
    : null;
}

export function WenzeVariantSelector({ variants, type, l: locale, productReference, priceNegotiable = false }: { variants: WenzeProductVariant[]; type: string | null; l: Locale; productReference?: string; priceNegotiable?: boolean }) {
  const [selected, setSelected] = useState("");
  const t = labels[locale];
  const available = (variant: WenzeProductVariant) => variant.is_available && variant.available_stock !== 0;
  const selectedVariant = variants.find((variant) => variant.public_ref === selected && available(variant)) ?? null;
  const purchaseUrl = variantPurchaseUrl(selectedVariant);

  return <div className="wenze-variant-selector">
    <fieldset><legend>{variantTypeLabel(type, locale)}</legend>
      {variants.length <= WENZE_VARIANT_CHIP_LIMIT
        ? <div className="wenze-variant-chips">{variants.map((variant) => <button type="button" key={variant.public_ref} disabled={!available(variant)} aria-pressed={selectedVariant?.public_ref === variant.public_ref} onClick={() => setSelected(variant.public_ref)}>{variant.label}{!available(variant) && <small>{t.sold}</small>}</button>)}</div>
        : <select aria-label={variantTypeLabel(type, locale)} value={selectedVariant?.public_ref ?? ""} onChange={(event) => setSelected(event.target.value)}><option value="">—</option>{variants.map((variant) => <option key={variant.public_ref} value={variant.public_ref} disabled={!available(variant)}>{variant.label}{!available(variant) ? ` — ${t.sold}` : ""}</option>)}</select>}
    </fieldset>
    {priceNegotiable
      ? purchaseUrl
        ? <WenzeCartActions locale={locale} productReference={productReference ?? "negotiation"} negotiationUrl={purchaseUrl}/>
        : <><button className="button button-primary wenze-buy-button" type="button" disabled>{t.buy}</button><p className="wenze-variant-prompt" role="status">{selectedVariant ? t.unavailable : t.choose}</p></>
      : productReference
        ? <><WenzeCartActions locale={locale} productReference={productReference} variantReference={selectedVariant?.public_ref ?? null} disabled={!selectedVariant}/>{!selectedVariant && <p className="wenze-variant-prompt" role="status">{t.choose}</p>}</>
        : purchaseUrl
          ? <a className="button button-primary wenze-buy-button" href={purchaseUrl} target="_blank" rel="noopener noreferrer">{t.buy}</a>
          : <><button className="button button-primary wenze-buy-button" type="button" disabled>{t.buy}</button><p className="wenze-variant-prompt" role="status">{selectedVariant ? t.unavailable : t.choose}</p></>}
  </div>;
}
