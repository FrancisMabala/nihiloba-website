/** Explicit Personal channel allowlist. Domain authority remains in the backend. */
export function servicesRequestTarget(parts: string[], method: string, query: URLSearchParams): string | null {
  const [kind, ref, action, document, operation] = parts;
  const get = method === "GET", post = method === "POST";
  if (!get && !post) return null;
  const reference = (prefix: string, value = ref) => new RegExp(`^${prefix}_[A-Za-z0-9_-]{1,28}$`).test(value ?? "");
  let path: string | null = null, keys: string[] = [];
  if (kind === "destinations" && parts.length === 2 && get && reference("SVC")) {
    path = `service-direct-briefs/offerings/${ref}`; keys = ["language"];
  } else if (kind === "briefs") {
    if (parts.length === 1) {
      path = "service-briefs";
      if (get) keys = ["offset"];
    } else if (reference("SCB")) {
      if (parts.length === 2 && get) path = `service-briefs/${ref}`;
      if (parts.length === 3 && (get && action === "documents" || post && ["save", "review", "close", "document-upload"].includes(action)))
        path = `service-briefs/${ref}/${action}`;
      if (parts.length === 5 && action === "documents" && reference("SCD", document) && (get && operation === "download" || post && operation === "remove"))
        path = `service-briefs/${ref}/documents/${document}/${operation}`;
      if (parts.length === 3 && post && action === "publish") path = `service-postings/from-brief/${ref}`;
      if (parts.length === 3 && post && action === "send") path = `service-direct-briefs/${ref}/submit`;
    }
  } else if (kind === "postings") {
    if (parts.length === 1 && get) { path = "service-postings"; keys = ["before_ref"]; }
    if (parts.length === 2 && ref === "available" && get) { path = "service-postings/available"; keys = ["offering_ref", "before_ref"]; }
    if (reference("SPR")) {
      if (parts.length === 2 && get) { path = `service-postings/${ref}`; keys = ["offering_ref"]; }
      if (parts.length === 3 && (action === "proposals" || post && ["revise", "withdraw", "accept"].includes(action))) {
        path = `service-postings/${ref}/${action}`;
        if (get) keys = ["before_ref"];
      }
    }
  } else if (kind === "proposals") {
    if (parts.length === 1 && get) { path = "service-proposals"; keys = ["offering_ref", "before_ref"]; }
    if (reference("SPF")) {
      if (parts.length === 2 && get) path = `service-proposals/${ref}`;
      if (parts.length === 3 && (get && action === "history" || post && ["save", "submit", "withdraw", "ask", "answer"].includes(action))) {
        path = `service-proposals/${ref}/${action}`;
        if (get) keys = ["before_ref"];
      }
    }
  } else if (kind === "requests" && reference("SWR")) {
    if (parts.length === 2 && get) path = `service-requests/${ref}`;
    if (parts.length === 3 && get && ["reviewed-brief", "quotes"].includes(action)) path = `service-requests/${ref}/${action}`;
  } else if (kind === "quotes" && reference("SQT")) {
    if (parts.length === 2 && get) path = `service-quotes/${ref}`;
    if (parts.length === 3 && post && ["accept", "reject"].includes(action)) path = `service-quotes/${ref}/${action}`;
  } else if (kind === "bookings" && reference("RSV") && parts.length === 2 && get) {
    path = `service-reservations/${ref}/lifecycle`;
  }
  if (!path || [...query].some(([key, value]) => !keys.includes(key) || query.getAll(key).length !== 1 ||
    !(key === "language" ? ["en", "fr", "ln", "sw"].includes(value) : key === "offset" ? /^\d{1,5}$/.test(value) && Number(value) <= 10000 :
      key === "offering_ref" ? reference("SVC", value) :
      /^(SPR|SPF|SPV)_[A-Za-z0-9_-]{1,28}$/.test(value)))) return null;
  if ((kind === "proposals" && parts.length === 1 || kind === "postings" && ref === "available") && !query.has("offering_ref")) return null;
  return path + (query.size ? `?${query}` : "");
}
