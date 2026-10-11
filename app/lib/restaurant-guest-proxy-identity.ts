import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const GUEST_BROWSER_COOKIE = "__Secure-restaurant-browser";
export const GUEST_PROXY_HEADER = "X-Shida-Restaurant-Guest-Proxy";
const COOKIE_PATH = "/api/shida/restaurant-guests";
const COOKIE_AGE = 30 * 86400;

function sign(secret: string, purpose: string, value: string): string {
  return createHmac("sha256", secret).update(`${purpose}\n${value}`).digest("hex");
}

export function guestProxyIdentity(request: Request, secret: string): {header: string; setCookie: string | null} {
  if (Buffer.byteLength(secret, "utf8") < 32) throw new Error("restaurant_guest_proxy_secret_invalid");
  const matches = (request.headers.get("cookie") ?? "").split(";").map(part => part.trim())
    .filter(part => part.startsWith(`${GUEST_BROWSER_COOKIE}=`));
  let browser: string | undefined;
  if (matches.length === 1) {
    const match = /^v1\.([0-9a-f]{32})\.([0-9a-f]{64})$/.exec(matches[0].slice(GUEST_BROWSER_COOKIE.length + 1));
    if (match) {
      const supplied = Buffer.from(match[2], "hex");
      const expected = Buffer.from(sign(secret, "guest-browser", match[1]), "hex");
      if (timingSafeEqual(supplied, expected)) browser = match[1];
    }
  }
  const created = !browser;
  browser ??= randomBytes(16).toString("hex");
  const expiry = String(Math.floor(Date.now() / 1000) + 300);
  const signature = sign(secret, "guest-proxy", `${browser}\n${expiry}`);
  return {
    header: `v1.${browser}.${expiry}.${signature}`,
    setCookie: created ? `${GUEST_BROWSER_COOKIE}=v1.${browser}.${sign(secret, "guest-browser", browser)}; Path=${COOKIE_PATH}; Max-Age=${COOKIE_AGE}; Secure; HttpOnly; SameSite=Strict` : null,
  };
}
