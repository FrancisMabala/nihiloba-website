export class DashboardApiError extends Error {
  constructor(public readonly kind: string, public readonly status: number, public readonly detail?: string) { super(kind); }
}
export async function request(path: string, init: RequestInit = {}, binding: string): Promise<unknown> {
  let response: Response;
  try { response = await fetch(`/api/shida/${path}`, { ...init, cache: "no-store", credentials: "same-origin", headers: { Accept: "application/json", "X-Shida-Session": binding, ...(init.body ? { "Content-Type": "application/json" } : {}) } }); }
  catch { throw new DashboardApiError("unavailable", 503); }
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new DashboardApiError(response.status === 409 ? "conflict" : response.status === 422 ? "validation" : "unavailable", response.status, typeof value?.detail === "string" && /^restaurant_[a-z_]+$/.test(value.detail) ? value.detail : undefined);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new DashboardApiError("unavailable", 502);
  return value;
}
