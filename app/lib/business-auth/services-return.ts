/** Allowlisted navigation only; the destination reauthenticates and authorizes. */
export function safeServicesReturn(value: string | null): string | null {
  if (!value || value.length > 700 || !/^\/businesses\/BUS_[A-Za-z0-9_-]+\/services(?:\?|$)/.test(value)) return null;
  const url = new URL(value, "https://return.invalid");
  if (url.origin !== "https://return.invalid" || url.hash || !/^\/businesses\/BUS_[A-Za-z0-9_-]+\/services$/.test(url.pathname)) return null;
  const rules: Record<string, RegExp> = {
    lang: /^(en|fr|ln|sw)$/,
    view: /^(today|work|calendar|services|locations|messages|money|reports|templates|settings|available|proposals|share)$/,
    offering: /^SVC_[A-Za-z0-9_-]{1,28}$/,
    request: /^(SPR|SWR)_[A-Za-z0-9_-]{1,28}$/,
    proposal: /^SPF_[A-Za-z0-9_-]{1,28}$/,
    quote: /^SQT_[A-Za-z0-9_-]{1,28}$/,
    booking: /^RSV_[A-Za-z0-9_-]{1,28}$/,
  };
  for (const [key, entry] of url.searchParams) {
    if (!rules[key]?.test(entry) || url.searchParams.getAll(key).length !== 1) return null;
  }
  return url.pathname + url.search;
}

export function servicesReturnLanguage(href: string): string | null {
  const url = new URL(href);
  const direct = safeServicesReturn(url.pathname + url.search);
  const destination = direct ?? (/^\/login(?:\/verify)?\/?$/.test(url.pathname) ? safeServicesReturn(url.searchParams.get("returnTo")) : null);
  return destination ? new URL(destination, url.origin).searchParams.get("lang") : null;
}

/** Keep an explicit language choice when this exact Services task is refreshed. */
export function withServicesLanguage(href: string, language: string): string | null {
  if (!/^(en|fr|ln|sw)$/.test(language)) return null;
  const url = new URL(href);
  const direct = safeServicesReturn(url.pathname + url.search);
  if (direct) {
    url.searchParams.set("lang", language);
    return url.pathname + url.search;
  }
  if (!/^\/login(?:\/verify)?\/?$/.test(url.pathname)) return null;
  const target = safeServicesReturn(url.searchParams.get("returnTo"));
  if (!target) return null;
  const destination = new URL(target, url.origin);
  destination.searchParams.set("lang", language);
  url.searchParams.set("returnTo", destination.pathname + destination.search);
  return url.pathname + url.search;
}
