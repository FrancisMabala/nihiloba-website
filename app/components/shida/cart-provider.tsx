"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { addCartItem, CartClientError, deleteAllCartItems, deleteCartItem, restoreCart, setCartItemQuantity } from "../../services/shida/cart-browser-client";
import { CartMutationQueue } from "../../services/shida/cart-mutation-queue";
import type { CommerceCart } from "../../types/shida-commerce";

type CartContextValue = {
  cart: CommerceCart | null;
  loading: boolean;
  error: string | null;
  add: (productReference: string, variantReference: string | null) => Promise<CommerceCart>;
  update: (itemReference: string, quantity: number) => Promise<CommerceCart>;
  remove: (itemReference: string) => Promise<CommerceCart>;
  clear: () => Promise<CommerceCart | null>;
  replace: (cart: CommerceCart | null) => void;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children, initialCart = null, restoreOnMount = true }: { children: ReactNode; initialCart?: CommerceCart | null; restoreOnMount?: boolean }) {
  const [cart, setCart] = useState<CommerceCart | null>(initialCart);
  const [loading, setLoading] = useState(restoreOnMount);
  const [error, setError] = useState<string | null>(null);
  const cartRef = useRef<CommerceCart | null>(initialCart);
  const mutations = useRef(new CartMutationQueue());

  const replace = useCallback((next: CommerceCart | null) => { cartRef.current = next; setCart(next); }, []);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { replace(await restoreCart()); } catch (caught) { if (caught instanceof CartClientError && caught.code === "cart_not_found") replace(null); else setError(caught instanceof CartClientError ? caught.code : "api_unavailable"); }
    finally { setLoading(false); }
  }, [replace]);

  useEffect(() => {
    if (!restoreOnMount) return;
    let active = true;
    void restoreCart().then((next) => { if (active) replace(next); }).catch((caught) => {
      if (!active) return;
      if (caught instanceof CartClientError && caught.code === "cart_not_found") replace(null);
      else setError(caught instanceof CartClientError ? caught.code : "api_unavailable");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [replace, restoreOnMount]);

  const value: CartContextValue = {
    cart, loading, error, replace, refresh,
    add(productReference, variantReference) {
      const key = `${productReference}:${variantReference ?? ""}`;
      return mutations.current.run(key, async () => { const next = await addCartItem(productReference, variantReference, cartRef.current?.version); replace(next); return next; });
    },
    update(itemReference, quantity) { return mutations.current.run(null, async () => { const next = await setCartItemQuantity(itemReference, quantity, cartRef.current?.version); replace(next); return next; }); },
    remove(itemReference) { return mutations.current.run(null, async () => { const next = await deleteCartItem(itemReference, cartRef.current?.version); replace(next); return next; }); },
    clear() { return mutations.current.run(null, async () => { const next = await deleteAllCartItems(cartRef.current?.version); replace(next); return next; }); },
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

export function useOptionalCart(): CartContextValue | null {
  return useContext(CartContext);
}
