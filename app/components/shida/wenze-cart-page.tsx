"use client";

import Link from "next/link";
import "./wenze-cart.css";
import { useState } from "react";
import type { Locale } from "../../lib/i18n";
import { safePublicImageUrl, safePublicWebsiteUrl } from "../../lib/safe-public-url";
import { acceptCartPriceChanges, CartClientError, createCartHandoff, validateCart } from "../../services/shida/cart-browser-client";
import type { CommerceCartConflict, CommerceCartItem } from "../../types/shida-commerce";
import { CartIcon } from "../icons";
import { useCart } from "./cart-provider";
import { MarketplaceImage } from "./marketplace-image";
import { MarketplaceBreadcrumb } from "./marketplace-primitives";
import { commerceErrorMessage, wenzeCartCopy } from "./wenze-cart-copy";
import {WenzeWebCheckout} from "./wenze-web-checkout";

export function formatCommerceMoney(amount: string | null, currency: string | null, locale: Locale): string | null {
  if (amount == null) return null;
  const value = Number(amount);
  const displayed = Number.isFinite(value) ? value.toLocaleString(locale, { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 }) : amount;
  return `${displayed}${currency ? ` ${currency}` : ""}`;
}

export function WenzeCartPage({ locale }: { locale: Locale }) {
  const [checkoutBusy,setCheckoutBusy]=useState(false);
  const [orderWhatsApp,setOrderWhatsApp]=useState<string|null>(null);
  const [confirmed,setConfirmed]=useState<string|null>(null);
  const { cart, loading, error: restoreError, update, remove, clear, replace, refresh } = useCart();
  const [pendingItem, setPendingItem] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"clear" | "validate" | "accept" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [conflicts, setConflicts] = useState<CommerceCartConflict[]>([]);
  const t = wenzeCartCopy[locale];
  const shoppingPath = locale === "fr" ? "/fr/shida/wenze" : "/shida/wenze";

  function message(caught: unknown) { return commerceErrorMessage(locale, caught instanceof CartClientError ? caught.code : "api_unavailable"); }
  async function changeQuantity(item: CommerceCartItem, quantity: number) {
    if (checkoutBusy || pendingAction || pendingItem || quantity < 1 || quantity > 100 || quantity === item.quantity) return;
    setPendingItem(item.reference); setItemErrors((current) => ({ ...current, [item.reference]: "" }));
    try { await update(item.reference, quantity); setConflicts((current) => current.filter((value) => value.item_reference !== item.reference)); }
    catch (caught) { setItemErrors((current) => ({ ...current, [item.reference]: message(caught) })); }
    finally { setPendingItem(null); }
  }
  async function removeItem(item: CommerceCartItem) {
    if (checkoutBusy || pendingAction || pendingItem) return; setPendingItem(item.reference);
    try { await remove(item.reference); setConflicts((current) => current.filter((value) => value.item_reference !== item.reference)); }
    catch (caught) { setItemErrors((current) => ({ ...current, [item.reference]: message(caught) })); }
    finally { setPendingItem(null); }
  }
  async function clearCart() {
    if (checkoutBusy || pendingItem || pendingAction) return;
    if (!window.confirm(t.clearConfirm)) return;
    setPendingAction("clear"); setError(null);
    try { await clear(); setConflicts([]); }
    catch (caught) { setError(message(caught)); }
    finally { setPendingAction(null); }
  }
  async function acceptPrices() {
    if (checkoutBusy || pendingItem || pendingAction) return;
    setPendingAction("accept"); setError(null);
    try { replace(await acceptCartPriceChanges()); const result = await validateCart(); replace(result.cart); setConflicts(result.conflicts); }
    catch (caught) { setError(message(caught)); }
    finally { setPendingAction(null); }
  }
  async function handoff() {
    if (checkoutBusy || pendingItem || pendingAction) return;
    setPendingAction("validate"); setError(null);
    try {
      const result = await validateCart(); replace(result.cart); setConflicts(result.conflicts);
      if (!result.valid || result.conflicts.length) return;
      const handoffResult = await createCartHandoff();
      window.location.assign(handoffResult.whatsapp_url);
    } catch (caught) { setError(caught instanceof CartClientError ? message(caught) : t.handoffFailed); }
    finally { setPendingAction(null); }
  }

  if(confirmed)return <section className="wenze-cart-page"><div className="container wenze-cart-empty" role="status"><h1>{locale==="fr"?"Commande enregistrée":"Order placed"}</h1><p>{confirmed}</p><p>{locale==="fr"?"Votre commande est enregistrée. Le paiement reste à convenir avec le vendeur.":"Your order is saved. Arrange payment with the seller."}</p><Link className="button button-primary" href={`${locale==="fr"?"/fr":""}/shida/wenze/orders/`}>{locale==="fr"?"Suivre mes commandes":"Track my orders"}</Link>{orderWhatsApp&&<><p><a className="button button-secondary" href={orderWhatsApp}>{locale==="fr"?"Voir mes commandes sur WhatsApp":"View my orders on WhatsApp"}</a></p><p>{locale==="fr"?"Appuyez sur Envoyer dans WhatsApp avec le même compte SHIDA. Ouvrir le lien n’envoie aucun message.":"Press Send in WhatsApp using the same SHIDA account. Opening this link does not send a message."}</p></>}</div></section>;
  if (loading) return <section className="wenze-cart-page"><div className="container marketplace-state" role="status"><p>{t.loading}</p></div></section>;
  if (!cart || cart.item_count === 0) return <section className="wenze-cart-page"><div className="container wenze-cart-empty"><CartIcon/><h1>{t.title}</h1><p>{restoreError ? commerceErrorMessage(locale, restoreError) : t.empty}</p>{restoreError&&<button className="button button-secondary" type="button" onClick={() => void refresh()}>{t.retry}</button>}<Link className="button button-primary" href={shoppingPath}>{t.continueShopping}</Link></div></section>;

  const fulfillmentChosen = cart.seller_groups.every(group => group.fulfillment_method !== null);
  const priceChanges = conflicts.filter((conflict) => conflict.code === "price_changed");
  const hasBlockingConflict = conflicts.some((conflict) => conflict.code !== "price_changed");
  const globalConflicts = conflicts.filter((conflict) => !conflict.item_reference);
  return <div className="wenze-cart-shell"><section className="wenze-cart-hero"><div className="container"><MarketplaceBreadcrumb label={locale==="fr"?"Fil d’Ariane":"Breadcrumb"} items={[{label:"SHIDA",href:locale==="fr"?"/fr/shida":"/shida"},{label:"Wenze",href:shoppingPath},{label:t.title}]}/><div className="wenze-cart-title"><div><p className="wenze-cart-eyebrow">WENZE · SHIDA</p><h1>{t.title}</h1></div><span>{cart.item_count} {t.items}</span></div><p>{t.intro}</p></div></section><section className="wenze-cart-page"><div className="container wenze-cart-layout">
    <div className="wenze-cart-groups">
      {cart.seller_groups.map((group) => <section className="wenze-cart-group" key={group.store_reference} aria-labelledby={`store-${group.store_reference}`}><header><h2 id={`store-${group.store_reference}`}>{group.store_name}</h2><span>{group.items.reduce((sum, item) => sum + item.quantity, 0)}</span></header>
        <div>{group.items.map((item) => { const productUrl = safePublicWebsiteUrl(item.product_url); const image = safePublicImageUrl(item.image?.url); const conflict = conflicts.find((value) => value.item_reference === item.reference); return <article className="wenze-cart-item" key={item.reference}>
          <div className="wenze-cart-item-image"><MarketplaceImage src={image} alt={item.image?.alt || item.name} fallback={t.productImage} sizes="(max-width: 600px) 96px, 128px"/></div>
          <div className="wenze-cart-item-main"><h3>{productUrl?<Link href={productUrl}>{item.name}</Link>:item.name}</h3>{item.variant&&<p>{item.variant}</p>}<strong>{formatCommerceMoney(item.unit_price,item.currency,locale)}</strong>
            <div className="wenze-cart-quantity"><span>{t.quantity}</span><button type="button" onClick={() => void changeQuantity(item,item.quantity-1)} disabled={checkoutBusy||pendingAction!==null||pendingItem!==null||item.quantity<=1} aria-label={`${t.decrease}: ${item.name}`}>−</button><input key={`${item.reference}-${item.quantity}`} type="number" disabled={checkoutBusy||pendingAction!==null||pendingItem!==null} min="1" max="100" defaultValue={item.quantity} aria-label={`${t.quantity}: ${item.name}`} onBlur={(event)=>{const requested=Number(event.target.value);event.target.value=String(item.quantity);void changeQuantity(item,requested);}} onKeyDown={(event)=>{if(event.key==="Enter")event.currentTarget.blur();}}/><button type="button" onClick={() => void changeQuantity(item,item.quantity+1)} disabled={checkoutBusy||pendingAction!==null||pendingItem!==null} aria-label={`${t.increase}: ${item.name}`}>+</button></div>
            <button className="wenze-cart-remove" type="button" onClick={() => void removeItem(item)} disabled={checkoutBusy||pendingAction!==null||pendingItem!==null}>{t.remove}</button>
            {(itemErrors[item.reference]||conflict)&&<p className="wenze-cart-line-error" role="alert">{itemErrors[item.reference]||commerceErrorMessage(locale,conflict!.code)}{conflict?.current_value!=null?` (${conflict.current_value}${conflict.code==="price_changed"&&cart.currency?` ${cart.currency}`:""})`:""}</p>}
          </div><strong className="wenze-cart-line-total">{formatCommerceMoney(item.line_total,item.currency,locale)}</strong>
        </article>})}</div>
        {group.estimates && <div>{group.estimates.preparation && <p>{locale === "fr" ? "Préparation estimée" : "Estimated preparation"}: {group.estimates.preparation}</p>}{group.estimates.delivery && <p>{locale === "fr" ? "Livraison estimée" : "Estimated delivery"}: {group.estimates.delivery}</p>}</div>}
        <footer><span>{t.sellerSubtotal}</span><strong>{formatCommerceMoney(group.subtotal,group.currency,locale)}</strong></footer>
      </section>)}
      <div className="wenze-cart-secondary-actions"><Link href={shoppingPath}>{t.continueShopping}</Link><button type="button" onClick={() => void clearCart()} disabled={checkoutBusy||pendingItem!==null||pendingAction!==null}>{t.clear}</button></div>
    </div>
    <aside className="wenze-cart-summary"><p className="wenze-cart-eyebrow">{t.nextStep}</p><h2>{t.summary}</h2><dl><div><dt>{t.subtotal}</dt><dd>{formatCommerceMoney(cart.product_subtotal,cart.currency,locale)}</dd></div><div><dt>{t.delivery}</dt><dd>{!fulfillmentChosen||cart.delivery_total==null?t.pendingDelivery:formatCommerceMoney(cart.delivery_total,cart.currency,locale)}</dd></div>{fulfillmentChosen&&cart.grand_total!=null&&<div className="wenze-cart-grand-total"><dt>{t.total}</dt><dd>{formatCommerceMoney(cart.grand_total,cart.currency,locale)}</dd></div>}</dl>
      {(conflicts.length>0||error)&&<div className="wenze-cart-conflicts" role="alert"><h3>{t.conflicts}</h3>{error&&<p>{error}</p>}{globalConflicts.map((conflict,index)=><p key={`${conflict.code}-${index}`}>{commerceErrorMessage(locale,conflict.code)}</p>)}{priceChanges.length>0&&<p>{t.priceReview}</p>}{priceChanges.length>0&&!hasBlockingConflict&&<button className="button button-secondary" type="button" onClick={() => void acceptPrices()} disabled={checkoutBusy||pendingItem!==null||pendingAction!==null}>{t.acceptPrices}</button>}</div>}
      <WenzeWebCheckout onBusy={setCheckoutBusy} onConflict={async()=>{try{const result=await validateCart();replace(result.cart);setConflicts(result.conflicts);}catch(caught){setError(message(caught));}}} locale={locale} cart={cart} replace={replace} disabled={pendingAction!==null||pendingItem!==null||conflicts.length>0} onComplete={(reference,whatsapp)=>{setOrderWhatsApp(whatsapp);setConfirmed(reference);replace(null);}}/>
      <button className="button button-secondary wenze-cart-handoff" type="button" onClick={() => void handoff()} disabled={checkoutBusy||pendingItem!==null||pendingAction!==null||conflicts.length>0}>{pendingAction==="validate"?t.validating:t.continueWhatsApp}</button><p className="wenze-cart-handoff-help">{t.handoffHelp}</p>
    </aside>
  </div></section></div>;
}
