import { GUEST_BACKEND, GUEST_COOKIE, GUEST_PROXY } from "./restaurant-guest-contract";

// Only the expected exact visit path is rewritten, including expiry/deletion.
export function guestSetCookie(raw: string, establishment: string, visit: string): string | null {
  const path = `${GUEST_BACKEND}/establishments/${establishment}/visits/${visit}`;
  if (!raw.startsWith(`${GUEST_COOKIE}=`) || !/(?:^|;)\s*HttpOnly(?:;|$)/i.test(raw) || !/(?:^|;)\s*Secure(?:;|$)/i.test(raw) || !/(?:^|;)\s*SameSite=Strict(?:;|$)/i.test(raw) || /(?:^|;)\s*Domain=/i.test(raw)) return null;
  const paths = raw.match(/(?:^|;)\s*Path=([^;]*)/gi);
  if (paths?.length !== 1 || paths[0].split("=")[1] !== path) return null;
  return raw.replace(/(;)\s*Path=[^;]*/i, `$1 Path=${GUEST_PROXY}/establishments/${establishment}/visits/${visit}`);
}
