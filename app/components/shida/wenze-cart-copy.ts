import type { Locale } from "../../lib/i18n";

export const wenzeCartCopy = {
  en: {
    cart: "Cart", loading: "Loading cart", add: "Add to cart", buyNow: "Buy now", adding: "Adding…", added: "Added to cart", viewCart: "View cart", chooseOption: "Select an option first.", soldOut: "Sold out", negotiate: "Negotiate on WhatsApp",
    title: "Your Wenze cart", intro: "Review products from each shop before continuing in WhatsApp.", empty: "Your cart is empty.", continueShopping: "Continue shopping", quantity: "Quantity", decrease: "Decrease quantity", increase: "Increase quantity", remove: "Remove", clear: "Clear cart", clearConfirm: "Remove every item from your cart?",
    subtotal: "Subtotal", delivery: "Delivery", total: "Total", pendingDelivery: "Calculated in WhatsApp", sellerSubtotal: "Shop subtotal", continueWhatsApp: "Continue on WhatsApp", handoffHelp: "You’ll choose delivery or pickup and confirm your order in WhatsApp.", validating: "Checking cart…", opening: "Opening WhatsApp…", retry: "Try again", acceptPrices: "Accept updated prices", priceReview: "Review and accept the updated prices before continuing.", conflicts: "Your cart needs attention", unavailableItem: "This product or option is no longer available.", insufficientStock: "The requested quantity is no longer available.", priceChanged: "The product price has changed.", mixedCurrency: "This cart cannot combine products in different currencies.", invalidVariant: "This product option is no longer available.", apiUnavailable: "The cart is temporarily unavailable. Please try again.", invalidCart: "Your previous cart expired. You can start a new cart.", invalidRequest: "This product could not be added.", handoffFailed: "WhatsApp could not be opened. Please try again.", stale: "Your cart changed in another request. Please try again.", productImage: "Product image unavailable",
  },
  fr: {
    cart: "Panier", loading: "Chargement du panier", add: "Ajouter au panier", buyNow: "Acheter maintenant", adding: "Ajout…", added: "Ajouté au panier", viewCart: "Voir le panier", chooseOption: "Choisissez d’abord une option.", soldOut: "Épuisé", negotiate: "Négocier sur WhatsApp",
    title: "Votre panier Wenze", intro: "Vérifiez les produits de chaque boutique avant de continuer dans WhatsApp.", empty: "Votre panier est vide.", continueShopping: "Continuer les achats", quantity: "Quantité", decrease: "Diminuer la quantité", increase: "Augmenter la quantité", remove: "Retirer", clear: "Vider le panier", clearConfirm: "Retirer tous les articles de votre panier ?",
    subtotal: "Sous-total", delivery: "Livraison", total: "Total", pendingDelivery: "Calculée dans WhatsApp", sellerSubtotal: "Sous-total boutique", continueWhatsApp: "Continuer sur WhatsApp", handoffHelp: "Vous terminerez le choix de la livraison ou du retrait et confirmerez votre commande dans WhatsApp.", validating: "Vérification du panier…", opening: "Ouverture de WhatsApp…", retry: "Réessayer", acceptPrices: "Accepter les nouveaux prix", priceReview: "Vérifiez et acceptez les nouveaux prix avant de continuer.", conflicts: "Votre panier nécessite une vérification", unavailableItem: "Ce produit ou cette option n’est plus disponible.", insufficientStock: "La quantité demandée n’est plus disponible.", priceChanged: "Le prix du produit a changé.", mixedCurrency: "Ce panier ne peut pas combiner des produits dans différentes devises.", invalidVariant: "Cette option de produit n’est plus disponible.", apiUnavailable: "Le panier est temporairement indisponible. Veuillez réessayer.", invalidCart: "Votre ancien panier a expiré. Vous pouvez en créer un nouveau.", invalidRequest: "Ce produit n’a pas pu être ajouté.", handoffFailed: "WhatsApp n’a pas pu être ouvert. Veuillez réessayer.", stale: "Votre panier a changé pendant une autre action. Veuillez réessayer.", productImage: "Image du produit indisponible",
  },
} as const;

export function wenzeCartPath(locale: Locale): string {
  return locale === "fr" ? "/fr/shida/wenze/panier" : "/shida/wenze/cart";
}

export function commerceErrorMessage(locale: Locale, code: string): string {
  const t = wenzeCartCopy[locale];
  if (code === "cart_not_found") return t.invalidCart;
  if (code === "insufficient_stock") return t.insufficientStock;
  if (code === "mixed_currency" || code === "unsupported_currency") return t.mixedCurrency;
  if (code === "invalid_variant" || code === "not_found") return t.invalidVariant;
  if (code === "unavailable" || code === "negotiation_required") return t.unavailableItem;
  if (code === "price_changed") return t.priceChanged;
  if (code === "stale_cart_version") return t.stale;
  if (code === "invalid_request" || code === "validation_error") return t.invalidRequest;
  return t.apiUnavailable;
}
