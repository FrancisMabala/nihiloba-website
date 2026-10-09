export class DashboardApiError extends Error {
  constructor(public readonly kind: string, public readonly status: number, public readonly detail?: string, public readonly itemRef?: string, public readonly changedItems?: string[]) { super(kind); }
}
export async function request(path: string, init: RequestInit = {}, binding: string): Promise<unknown> {
  let response: Response;
  const [pathname, query] = path.split("?");
  const target = `/api/shida/${pathname.replace(/\/$/, "")}/${query ? `?${query}` : ""}`;
  try { response = await fetch(target, { ...init, cache: "no-store", credentials: "same-origin", headers: { Accept: "application/json", "X-Shida-Session": binding, ...(init.body ? { "Content-Type": "application/json" } : {}) } }); }
  catch { throw new DashboardApiError("unavailable", 503); }
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new DashboardApiError(response.status === 409 ? "conflict" : response.status === 422 ? "validation" : "unavailable", response.status, typeof value?.detail === "string" && /^restaurant_[a-z_]+$/.test(value.detail) ? value.detail : undefined, typeof value?.item_ref === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value.item_ref) ? value.item_ref : undefined, Array.isArray(value?.changed_items) ? value.changed_items.filter((ref:unknown)=>typeof ref==="string" && /^[A-Za-z0-9_-]{1,64}$/.test(ref)).slice(0,20) : undefined);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new DashboardApiError("unavailable", 502);
  return value;
}
