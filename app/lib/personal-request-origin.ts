const PUBLIC_ORIGIN = "https://nihiloba.com";

// Never derive trust from Host, Forwarded or X-Forwarded-* headers. Production
// uses its explicit public origin, independently of the reverse proxy's URL.
export function personalRequestOrigin(request: Request, allowPrivateRead = false): string | null {
  if (request.headers.get("sec-fetch-site") === "cross-site") return null;
  const url = new URL(request.url);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    && ["http:", "https:"].includes(url.protocol);
  const supplied = request.headers.get("origin");
  if (supplied === null) {
    // Same-origin browser GETs omit Origin. This is not a mutation exemption;
    // the gateway still requires its private HttpOnly browser binding.
    return allowPrivateRead && request.method === "GET" && request.headers.get("sec-fetch-site") === "same-origin"
      ? (local ? url.origin : PUBLIC_ORIGIN) : null;
  }
  try {
    const parsed = new URL(supplied);
    // Require a serialized HTTP origin, not a URL with credentials/path/query,
    // an opaque origin, a list, or a value normalized into an allowed origin.
    if (parsed.origin !== supplied || !["http:", "https:"].includes(parsed.protocol)) return null;
    return supplied === PUBLIC_ORIGIN || (local && supplied === url.origin) ? supplied : null;
  } catch { return null; }
}
