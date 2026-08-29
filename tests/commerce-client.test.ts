import { afterEach, describe, expect, it, vi } from "vitest";
import { acceptCommercePriceChanges, addCommerceCartItem, clearCommerceCart, CommerceApiError, createCommerceCart, createCommerceHandoff, getCommerceCart, removeCommerceCartItem, updateCommerceCartItem, validateCommerceCart } from "../app/services/shida/commerce-client";

const cart = {
  reference: "SH-CART-public", status: "active", currency: "USD", version: 2, item_count: 2, seller_count: 1,
  product_subtotal: "40.00", delivery_total: "0.00", grand_total: "40.00", expires_at: "2026-09-20T12:00:00+00:00",
  seller_groups: [{ store_reference: "WNZ-STORE", store_name: "Store A", subtotal: "40.00", currency: "USD", fulfillment_method: null, delivery_fee: null, delivery_fee_status: null,
    items: [{ reference: "SH-CI-item", product_reference: "WNP-PRODUCT", name: "Shoe", variant: "42", quantity: 2, unit_price: "20.00", line_total: "40.00", currency: "USD" }] }],
};
const publicProduct = { public_ref: "WNP-PRODUCT", public_detail_url: "https://nihiloba.com/shida/wenze/products/shoe", images: [{ url: "https://res.cloudinary.com/dbrxpvmzp/image/upload/wenze/shoe.jpg", alt: "Shoe" }] };

function mockBackend(response: unknown, status = 200) {
  return vi.fn(async (...args: [input: string | URL | Request, init?: RequestInit]) => String(args[0]).includes("/api/public/shida/wenze/products/")
    ? new Response(JSON.stringify(publicProduct))
    : new Response(JSON.stringify(response), { status }));
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("commerce API client", () => {
  it("creates and restores an opaque-token cart without exposing the token in the cart", async () => {
    const token = "secret-cart-token";
    const fetchMock = mockBackend({ cart_token: token, cart }); vi.stubGlobal("fetch", fetchMock);
    const created = await createCommerceCart();
    expect(created.token).toBe(token); expect(created.cart).not.toHaveProperty("cart_token"); expect(created.cart.seller_groups[0].items[0].image?.url).toContain("cloudinary.com");
    expect(created.cart.seller_groups[0].items[0].product_url).toBe("https://nihiloba.com/shida/wenze/products/shoe");
    vi.stubGlobal("fetch", mockBackend({ cart })); const restored = await getCommerceCart(token); expect(restored.item_count).toBe(2);
  });

  it("adds products and exact variants with backend version control", async () => {
    const fetchMock = mockBackend({ cart }); vi.stubGlobal("fetch", fetchMock);
    await addCommerceCartItem("cart-token", "WNP-PRODUCT", "WNV-SIZE-42", 1, 7);
    const request = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/items"))!;
    expect(String(request[0])).toContain("/api/v1/carts/cart-token/items");
    expect(JSON.parse(String((request[1] as RequestInit).body))).toEqual({ product_reference: "WNP-PRODUCT", variant_reference: "WNV-SIZE-42", quantity: 1, expected_version: 7 });
  });

  it("updates quantity, removes an item, and clears the cart through authoritative endpoints", async () => {
    const fetchMock = mockBackend({ cart }); vi.stubGlobal("fetch", fetchMock);
    await updateCommerceCartItem("cart-token", "SH-CI-item", 3, 2);
    await removeCommerceCartItem("cart-token", "SH-CI-item", 3);
    await clearCommerceCart("cart-token", 4);
    const commerceCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes("/api/v1/"));
    expect((commerceCalls[0][1] as RequestInit).method).toBe("PATCH");
    expect(String(commerceCalls[1][0])).toContain("SH-CI-item?expected_version=3"); expect((commerceCalls[1][1] as RequestInit).method).toBe("DELETE");
    expect(String(commerceCalls[2][0])).toContain("/items?expected_version=4");
  });

  it("validates conflicts and accepts explicit price changes", async () => {
    const validation = { valid: false, cart, conflicts: [{ code: "price_changed", item_reference: "SH-CI-item", message: "hidden backend text", current_value: "25.00" }] };
    vi.stubGlobal("fetch", mockBackend(validation)); const result = await validateCommerceCart("cart-token");
    expect(result.conflicts).toEqual([{ code: "price_changed", item_reference: "SH-CI-item", current_value: "25.00" }]);
    const fetchMock = mockBackend({ cart }); vi.stubGlobal("fetch", fetchMock); await acceptCommercePriceChanges("cart-token");
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/accept-price-changes"))).toBe(true);
  });

  it("uses the exact backend WhatsApp handoff URL", async () => {
    const whatsapp = "https://wa.me/46760000000?text=CART%20opaque-handoff";
    vi.stubGlobal("fetch", mockBackend({ handoff_reference: "SH-HANDOFF", expires_at: "2026-08-29T12:15:00+00:00", whatsapp_url: whatsapp }));
    expect((await createCommerceHandoff("cart-token")).whatsapp_url).toBe(whatsapp);
  });

  it("rejects malformed handoff destinations and returns structured cart errors", async () => {
    vi.stubGlobal("fetch", mockBackend({ handoff_reference: "SH-HANDOFF", expires_at: "soon", whatsapp_url: "https://evil.example/CART" }));
    await expect(createCommerceHandoff("cart-token")).rejects.toMatchObject({ code: "malformed_response" });
    vi.stubGlobal("fetch", mockBackend({ detail: { code: "cart_conflict", conflicts: [{ code: "insufficient_stock", item_reference: "SH-CI-item", message: "internal", current_value: 1 }] } }, 409));
    await expect(addCommerceCartItem("cart-token", "WNP-PRODUCT", null, 2)).rejects.toMatchObject({ code: "cart_conflict", status: 409, conflicts: [{ code: "insufficient_stock", current_value: 1 }] });
  });

  it("handles expired carts and never logs complete cart tokens", async () => {
    const token = "complete-secret-token"; const consoleSpy = vi.spyOn(console, "log");
    vi.stubGlobal("fetch", mockBackend({ detail: { code: "cart_not_found" } }, 404));
    await expect(getCommerceCart(token)).rejects.toBeInstanceOf(CommerceApiError);
    expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain(token);
  });
});
