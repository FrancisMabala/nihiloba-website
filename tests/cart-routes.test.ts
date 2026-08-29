import { beforeEach, describe, expect, it, vi } from "vitest";

let storedToken: string | null = null;
const setCookie = vi.fn((name: string, value: string) => { storedToken = value || null; });
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: () => storedToken ? { value: storedToken } : undefined, set: setCookie })) }));

import { POST as addItem } from "../app/api/shida/cart/items/route";
import { GET as restoreRoute } from "../app/api/shida/cart/route";

const emptyCart = { reference:"SH-CART",status:"active",currency:null,version:1,item_count:0,seller_count:0,product_subtotal:"0.00",delivery_total:"0.00",grand_total:"0.00",seller_groups:[],expires_at:"2026-09-20T00:00:00+00:00" };
const filledCart = { ...emptyCart, currency:"USD",version:2,item_count:1,seller_count:1,product_subtotal:"20.00",grand_total:"20.00",seller_groups:[{store_reference:"WNZ-STORE",store_name:"Store",subtotal:"20.00",currency:"USD",fulfillment_method:null,delivery_fee:null,delivery_fee_status:null,seller_phone:"PRIVATE",items:[{reference:"SH-CI-item",product_reference:"WNP-PRODUCT",name:"Shoe",variant:null,quantity:1,unit_price:"20.00",line_total:"20.00",currency:"USD",internal_id:99}]}] };

beforeEach(() => { storedToken = null; setCookie.mockClear(); vi.unstubAllGlobals(); });

describe("same-origin cart BFF", () => {
  it("lazily creates a cart, stores only its token in an HttpOnly cookie, and never returns it", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/api/v1/carts")) return new Response(JSON.stringify({ cart_token:"opaque-secret",cart:emptyCart }),{status:201});
      if (url.includes("/api/public/")) return new Response(JSON.stringify({public_detail_url:"https://nihiloba.com/shida/wenze/products/shoe",images:[]}));
      return new Response(JSON.stringify({cart:filledCart}));
    }); vi.stubGlobal("fetch",fetchMock);
    const response=await addItem(new Request("https://nihiloba.com/api/shida/cart/items/",{method:"POST",headers:{origin:"https://nihiloba.com","content-type":"application/json"},body:JSON.stringify({product_reference:"WNP-PRODUCT",variant_reference:null,quantity:1})}));
    const body=await response.json(); expect(response.status).toBe(200); expect(body.cart.item_count).toBe(1); expect(JSON.stringify(body)).not.toContain("opaque-secret");expect(JSON.stringify(body)).not.toContain("PRIVATE");expect(JSON.stringify(body)).not.toContain("internal_id");
    expect(setCookie).toHaveBeenCalledWith("nihiloba_shida_cart","opaque-secret",expect.objectContaining({httpOnly:true,sameSite:"lax",path:"/api/shida/cart",priority:"high"}));
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("rejects cross-site mutations before calling the backend", async () => {
    const fetchMock=vi.fn();vi.stubGlobal("fetch",fetchMock);
    const response=await addItem(new Request("https://nihiloba.com/api/shida/cart/items/",{method:"POST",headers:{origin:"https://evil.example","content-type":"application/json"},body:JSON.stringify({product_reference:"WNP-PRODUCT"})}));
    expect(response.status).toBe(403);expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts the canonical website origin behind Render's internal proxy origin", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/api/v1/carts")) return new Response(JSON.stringify({ cart_token:"opaque-secret",cart:emptyCart }),{status:201});
      if (url.includes("/api/public/")) return new Response(JSON.stringify({public_detail_url:"https://nihiloba.com/shida/wenze/products/shoe",images:[]}));
      return new Response(JSON.stringify({cart:filledCart}));
    });
    vi.stubGlobal("fetch", fetchMock);
    const response = await addItem(new Request("https://nihiloba-website.onrender.com/api/shida/cart/items/", { method:"POST", headers:{ origin:"https://nihiloba.com", "content-type":"application/json" }, body:JSON.stringify({ product_reference:"WNP-PRODUCT" }) }));
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalled();
  });

  it("restores a cart from the HttpOnly cookie and clears an expired token",async()=>{
    storedToken="opaque-secret";
    vi.stubGlobal("fetch",vi.fn(async(input:string|URL|Request)=>String(input).includes("/api/public/")?new Response(JSON.stringify({public_detail_url:"https://nihiloba.com/shida/wenze/products/shoe",images:[]})):new Response(JSON.stringify({cart:filledCart}))));
    const restored=await restoreRoute();expect((await restored.json()).cart.item_count).toBe(1);expect(restored.headers.get("cache-control")).toContain("no-store");
    vi.stubGlobal("fetch",vi.fn(async()=>new Response(JSON.stringify({detail:{code:"cart_not_found"}}),{status:404})));
    const expired=await restoreRoute();const body=await expired.json();expect(body).toEqual({cart:null,reason:"invalid_cart"});expect(storedToken).toBeNull();
  });
});
