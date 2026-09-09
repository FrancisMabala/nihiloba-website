import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getRestaurantActions, getRestaurantMenu, getRestaurants, parseBusiness, parseMenuItem, parseRestaurant, restaurantQuery } from "../app/services/shida/restaurants-client";
import { RestaurantBusinessPage, RestaurantDetailPage, RestaurantHours, RestaurantListPage, RestaurantMenu, RestaurantPrice, restaurantMetadata } from "../app/components/shida/restaurants";
import { restaurantReturn, restaurantLocales, restaurantCopy } from "../app/lib/restaurant-i18n";
import { actions, business, category, collection, dated, hours, menu, monetary, restaurant, unit, unknown } from "./fixtures/restaurants.mjs";
import { RestaurantRetry } from "../app/components/shida/restaurant-retry";

vi.mock("next/navigation", async (original) => ({ ...await original<typeof import("next/navigation")>(), useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(() => vi.unstubAllGlobals());
function mockApi(overrides: Record<string, unknown> = {}) {
  const fetcher = vi.fn(async (url: string) => {
    const path = new URL(url).pathname;
    const payload = path in overrides ? overrides[path] : path.includes("entity-actions") ? actions : path.includes("businesses") ? business : path.endsWith("/menu") ? menu : path.endsWith("/restaurants") ? { ...collection([restaurant]), service_mode_options: ["Sur place"] } : restaurant;
    return payload instanceof Response ? payload : new Response(JSON.stringify(payload), { status: 200 });
  }); vi.stubGlobal("fetch", fetcher); return fetcher;
}
describe("Restaurant released public contract", () => {
  it("retries the current document without dropping menu page or exposing a legacy slug", async () => {
    const reload = vi.fn();
    vi.stubGlobal("window", { location: { reload } });
    RestaurantRetry({ label: "Retry" }).props.onClick();
    expect(reload).toHaveBeenCalledExactlyOnceWith();
    mockApi({ "/api/public/shida/restaurants/private-legacy-slug": new Response("unavailable", { status: 503 }) });
    const html = renderToStaticMarkup(await RestaurantDetailPage({ locale: "en", id: "private-legacy-slug", search: { page: "3", back: "city=Kinshasa&page=2" } }));
    expect(html).toContain('type="button"');
    expect(html).toContain("Try again");
    expect(html).not.toContain("private-legacy-slug");
  });
  it("names photo-less discovery links with their actual establishment", async () => {
    mockApi();
    const html = renderToStaticMarkup(await RestaurantListPage({ locale: "en" }));
    expect(html).toContain('aria-label="View establishment: Test Malewa"');
    expect(html).toContain("No photo available");
  });
  it("preserves results context when following a Business Restaurant activity", async () => {
    mockApi();
    const html = renderToStaticMarkup(await RestaurantBusinessPage({ locale: "sw", id: "BUS-TEST1", search: { back: "city=Kinshasa&page=2" } }));
    expect(html).toContain('/sw/shida/restaurants/RST-TEST1?back=city%3DKinshasa%26page%3D2');
  });
  it("allowlists fields and honors public location consent", () => {
    expect(JSON.stringify(parseRestaurant(restaurant))).not.toContain("PRIVATE_");
    expect(parseRestaurant({ ...restaurant, location: { ...restaurant.location, address_visibility: "public", address: "Public venue", landmark: null } }).location).toContain("Public venue");
    expect(JSON.stringify(parseBusiness(business))).not.toContain("PRIVATE_");
    expect(parseRestaurant({ ...restaurant, owning_business: null }).owning_business).toBeNull();
  });
  it("only forwards supported bounded filters and pagination", async () => {
    const fetcher = mockApi(); await getRestaurants("ln", { city: "Kinshasa", dish: "pondu", open_now: "true", page: "2", cuisine: "invented", private: "secret" });
    expect(fetcher.mock.calls[0][0]).toContain("language=ln");
    expect(fetcher.mock.calls[0][0]).toContain("page=2");
    expect(fetcher.mock.calls[0][0]).not.toMatch(/cuisine|secret/);
    expect(restaurantQuery({ page: "-1", query: "x".repeat(300) }).get("query")).toHaveLength(200);
    expect(restaurantReturn({ back: "https://evil.test/?secret=yes&city=Gombe&page=2" })).toBe("city=Gombe&page=2");
  });
  it("keeps every Restaurant fetch out of shared caches", async () => {
    const fetcher = mockApi(); await getRestaurants("en", {}); await getRestaurantMenu("en", "RST-TEST1"); await getRestaurantActions("en", "RST-TEST1");
    for (const call of fetcher.mock.calls as unknown as [string, RequestInit][]) expect(call[1].cache).toBe("no-store");
  });
  it("uses exact actions, rejects mismatched targets and unsafe URLs", async () => {
    mockApi(); expect((await getRestaurantActions("fr", "RST-TEST1")).follow).toBe(actions.follow_url);
    mockApi({ "/api/public/shida/entity-actions/restaurant/RST-TEST1": { ...actions, public_ref: "RST-OTHER" } });
    await expect(getRestaurantActions("en", "RST-TEST1")).rejects.toMatchObject({ kind: "malformed" });
    mockApi({ "/api/public/shida/entity-actions/restaurant/RST-TEST1": { ...actions, save_url: "https://evil.test/go/TEST", link_destination_available: false } });
    expect(await getRestaurantActions("en", "RST-TEST1")).toMatchObject({ save: null, share: null, menu: null });
  });
  it("rejects hidden or expired records and cross-establishment menu payloads", async () => {
    expect(() => parseMenuItem({ ...unit, visible: false })).toThrow();
    expect(() => parseMenuItem({ ...unit, category: { ...category, visible: false } })).toThrow();
    expect(() => parseMenuItem({ ...dated, dated_offering: { ...dated.dated_offering, state: "expired" } })).toThrow();
    mockApi({ "/api/public/shida/restaurants/RST-TEST1/menu": { ...menu, items: [{ ...unit, establishment_ref: "RST-OTHER" }] } });
    await expect(getRestaurantMenu("en", "RST-TEST1")).rejects.toThrow();
  });
  it("renders unit prices, configured amounts, unknown prices, components and current dated states distinctly", () => {
    expect(renderToStaticMarkup(<RestaurantPrice item={parseMenuItem(unit)} locale="en"/>)).toContain("Unit price: 5.00 USD");
    const html = renderToStaticMarkup(<RestaurantMenu items={[monetary, unknown, dated].map(parseMenuItem)} locale="en"/>);
    expect(html).toContain("Available monetary amounts"); expect(html).toContain("1000.00 CDF"); expect(html).toContain("Minimum amount"); expect(html).toContain("Price not specified"); expect(html).toContain("Sold out"); expect(html).toContain("Component"); expect(html).toContain("Current dated offering");
    expect(html).not.toMatch(/Add to cart|Order now|rating/);
  });
  it("renders backend status without using browser time", () => {
    const data = parseRestaurant({ ...restaurant, hours: { ...hours, status: "closed", basis: "exceptional_closure", schedule: { windows: [{ weekday: 0, start: "08:00", end: "22:00" }] }, exceptional_closures: [{ starts_at: "2026-09-09T00:00:00Z", ends_at: "2026-09-10T00:00:00Z" }] } });
    const html = renderToStaticMarkup(<RestaurantHours locale="en" hours={data.hours}/>);
    expect(html).toContain("Closed"); expect(html).toContain("Monday"); expect(html).toContain("Exceptional closures");
  });
  it("preserves filtered result position and renders only supported actions", async () => {
    mockApi(); const html = renderToStaticMarkup(await RestaurantDetailPage({ locale: "en", id: "RST-TEST1", search: { back: "city=Kinshasa&page=2" } }));
    expect(html).toContain("city=Kinshasa&amp;page=2#restaurant-RST-TEST1"); expect(html).toContain("/shida/businesses/BUS-TEST1");
    expect(html).toContain("select Report"); expect(html).toContain('rel="noopener noreferrer"'); expect(html).not.toContain("PRIVATE_");
  });
  it("uses generic failures and 404 for withdrawn detail/menu/Business", async () => {
    mockApi({ "/api/public/shida/restaurants/RST-TEST1/menu": new Response("private suspension reason", { status: 404 }) });
    await expect(RestaurantDetailPage({ locale: "en", id: "RST-TEST1" })).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
    mockApi({ "/api/public/shida/businesses/BUS-TEST1": new Response("private reason", { status: 404 }) });
    await expect(RestaurantBusinessPage({ locale: "en", id: "BUS-TEST1" })).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
    mockApi({ "/api/public/shida/restaurants": new Response("private failure", { status: 500 }) });
    const html = renderToStaticMarkup(await RestaurantListPage({ locale: "en" })); expect(html).toContain("temporarily unavailable"); expect(html).not.toContain("private failure");
  });
  it.each(restaurantLocales)("supports %s routes, localized empty states and static privacy-safe metadata", async (locale) => {
    mockApi({ "/api/public/shida/restaurants": { ...collection([]), service_mode_options: [] } });
    const html = renderToStaticMarkup(await RestaurantListPage({ locale })); expect(html).toContain(restaurantCopy[locale].empty); expect(html).toContain(`lang="${locale}"`);
    expect(JSON.stringify(restaurantMetadata(locale, "/RST-TEST1"))).not.toContain("PRIVATE_");
  });
});
