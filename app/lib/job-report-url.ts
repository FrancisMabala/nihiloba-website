import {safePublicActionUrl} from "./safe-public-url";

/** The backend supplies the configured destination and public-only message. */
export function jobReportUrl(value: string | null | undefined, reference: string): string | null {
  if (!safePublicActionUrl(value)) return null;
  const url = new URL(value!);
  if (url.hostname !== "wa.me" || !/^\/[1-9][0-9]{7,14}$/.test(url.pathname)) return null;
  const message = url.searchParams.get("text") || "";
  return new RegExp(`^SHIDA JOB REPORT ${reference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} (fr|en|ln|sw)$`).test(message.trim().split("\n").at(-1) || "") ? value! : null;
}
