"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { safePublicActionUrl } from "../../lib/safe-public-url";
import { CartClientError } from "../../services/shida/cart-browser-client";
import { useOptionalCart } from "./cart-provider";
import { commerceErrorMessage, wenzeCartCopy, wenzeCartPath } from "./wenze-cart-copy";

type Props = {
  locale: Locale;
  productReference: string;
  variantReference?: string | null;
  disabled?: boolean;
  negotiationUrl?: string | null;
  compact?: boolean;
};

export function WenzeCartActions({ locale, productReference, variantReference = null, disabled = false, negotiationUrl, compact = false }: Props) {
  const cart = useOptionalCart();
  const loading = cart?.loading ?? false;
  const [pending, setPending] = useState<"add" | "buy" | null>(null);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = wenzeCartCopy[locale];
  const cartPath = wenzeCartPath(locale);
  const negotiation = safePublicActionUrl(negotiationUrl);

  if (negotiation) return <a className="button button-primary wenze-buy-button" href={negotiation} target="_blank" rel="noopener noreferrer">{t.negotiate}</a>;

  async function submit(mode: "add" | "buy") {
    if (pending || disabled || loading) return;
    setPending(mode); setError(null); setAdded(false);
    try {
      if (!cart) throw new CartClientError("api_unavailable");
      await cart.add(productReference, variantReference);
      if (mode === "buy") window.location.assign(cartPath);
      else setAdded(true);
    } catch (caught) { setError(commerceErrorMessage(locale, caught instanceof CartClientError ? caught.code : "api_unavailable")); }
    finally { setPending(null); }
  }

  return <div className={compact ? "wenze-cart-actions wenze-cart-actions-compact" : "wenze-cart-actions"}>
    <div className="wenze-cart-action-buttons">
      <button className="button button-primary" type="button" disabled={disabled || loading || pending !== null} onClick={() => void submit("add")}>{pending === "add" ? t.adding : t.add}</button>
      <button className="button button-secondary" type="button" disabled={disabled || loading || pending !== null} onClick={() => void submit("buy")}>{pending === "buy" ? t.adding : t.buyNow}</button>
    </div>
    {added && <p className="wenze-cart-action-status" role="status">{t.added} · <Link href={cartPath}>{t.viewCart}</Link></p>}
    {error && <p className="wenze-cart-action-error" role="alert">{error}</p>}
  </div>;
}
