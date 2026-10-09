import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RestaurantDetailPage } from "../app/components/shida/restaurants";
import { RestaurantCheckoutPage } from "../app/components/shida/restaurant-checkout-page";
import { checkoutCopy } from "../app/lib/restaurant-checkout-copy";
import { actions, menu, restaurant } from "./fixtures/restaurants.mjs";
vi.mock("next/navigation", async original => ({...await original<typeof import("next/navigation")>(),useRouter:()=>({refresh:vi.fn()})}));

const options={available:true,methods:{pickup:{windows:[{public_ref:"RWI_test",starts_at:"2027-01-01T10:00:00Z",ends_at:"2027-01-01T12:00:00Z",timezone_name:"Africa/Kinshasa"}]},delivery:null},evaluated_at:"2026-10-08T10:00:00Z"};
afterEach(()=>vi.unstubAllGlobals());
function fixture(available=true){vi.stubGlobal("fetch",vi.fn(async(input:string)=>{const path=new URL(input).pathname;return Response.json(path.endsWith("/ordering-options")?{...options,available,methods:available?options.methods:{}}:path.endsWith("/menu")?menu:path.includes("entity-actions")?actions:{...restaurant,ordering_available:available});}));}
describe("Restaurant public checkout",()=>{
 it.each(["en","fr","ln","sw"] as const)("shows localized checkout only with a released exact establishment in %s",async locale=>{
  fixture(true);const html=renderToStaticMarkup(await RestaurantDetailPage({locale,id:"RST-TEST1",menuOnly:true}));expect(html).toContain(checkoutCopy[locale].order);expect(html).toContain("/order");
  fixture(false);const closed=renderToStaticMarkup(await RestaurantDetailPage({locale,id:"RST-TEST1",menuOnly:true}));expect(closed).not.toContain(`href="${locale==="en"?"":`/${locale}`}/shida/restaurants/RST-TEST1/order"`);
 });
 it("renders grouped menu choices and a protected customer continuation",async()=>{
  fixture(true);const html=renderToStaticMarkup(await RestaurantCheckoutPage({locale:"en",id:"RST-TEST1",page:"1"}));expect(html).toContain("Poulet");expect(html).toContain("Pondu");expect(html).toContain("My food orders");expect(html).not.toContain("PRIVATE_ADDRESS_SENTINEL");
 });
});
