import { cookies, headers } from "next/headers";
import { privateTestPath, TEST_MARKETPLACE_COOKIE } from "../../lib/test-marketplace";

export async function testMarketplaceToken(): Promise<string | null> {
  const value = (await cookies()).get(TEST_MARKETPLACE_COOKIE)?.value;
  return value && /^[A-Za-z0-9_-]{20,256}$/.test(value) ? value : null;
}

export async function testMarketplaceRequest(path: string, operation = false) {
  const privatePath = privateTestPath(path);
  if (!privatePath && !operation) return {path, headers: {} as Record<string,string>};
  let token = await testMarketplaceToken();
  const explicit = !!token;
  if (!token && operation && path.startsWith('/api/restaurant-guests/')) {
    // The backend keeps a signed-in tester out of real guest transactions even
    // when the tester has switched back to browsing the public marketplace.
    const value = (await cookies()).get('nihiloba_personal_session')?.value;
    if (value && /^[A-Za-z0-9_-]{20,256}$/.test(value)) token = value;
  }
  if (!token) return {path, headers: {} as Record<string,string>};
  const extra: Record<string,string> = {Cookie: `shida_dashboard_session=${token}`};
  if (operation) {
    if (explicit) extra["X-Shida-Test-Marketplace"] = "1";
    const origin = (await headers()).get("origin");
    if (origin) extra.Origin = origin;
  }
  return {path: privatePath ?? path, headers: extra};
}
