/** Provider-only channel contract, shared with the Organization dashboard. */
export function proposalPath(parts: string[], method: string): string | null {
  const [kind, reference, action] = parts, get = method === "GET", post = method === "POST";
  if (!get && !post) return null;
  if (kind === "postings") {
    if (parts.length === 2 && get && reference === "available") return "service-postings/available";
    if (!/^SPR_[A-Za-z0-9_-]{1,28}$/.test(reference ?? "")) return null;
    if (parts.length === 2 && get) return `service-postings/${reference}`;
    if (parts.length === 3 && post && action === "proposals") return `service-postings/${reference}/proposals`;
  }
  if (kind === "proposals") {
    if (parts.length === 1 && get) return "service-proposals";
    if (!/^SPF_[A-Za-z0-9_-]{1,28}$/.test(reference ?? "")) return null;
    if (parts.length === 2 && get) return `service-proposals/${reference}`;
    if (parts.length === 3 && (get && action === "history" || post && ["save", "submit", "withdraw", "ask"].includes(action)))
      return `service-proposals/${reference}/${action}`;
  }
  return null;
}
export function proposalQuery(parts: string[], query: URLSearchParams, method: string): boolean {
  if (!proposalPath(parts, method)) return false;
  const offering = method === "GET" && (parts[0] === "postings" && parts.length === 2 || parts[0] === "proposals" && parts.length === 1);
  const cursor = method === "GET" && (parts[1] === "available" || parts[0] === "proposals" && (parts.length === 1 || parts[2] === "history"));
  if (offering && !query.has("offering_ref")) return false;
  return [...query].every(([key, value]) => query.getAll(key).length === 1 &&
    (key === "offering_ref" && offering && /^SVC_[A-Za-z0-9_-]{1,28}$/.test(value) ||
      key === "before_ref" && cursor && /^(SPR|SPF|SPV)_[A-Za-z0-9_-]{1,28}$/.test(value)));
}
