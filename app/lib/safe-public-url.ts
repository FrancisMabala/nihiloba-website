const CLOUDINARY_HOST = "res.cloudinary.com";
const CLOUDINARY_PREFIX = "/dbrxpvmzp/image/upload/";

export function safePublicActionUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const allowed =
      url.protocol === "https:" &&
      (url.hostname === "wa.me" ||
        url.hostname === "api.nihiloba.com" ||
        (url.hostname === "nihiloba.com" && url.pathname.startsWith("/go/")));
    return allowed ? value : null;
  } catch {
    return null;
  }
}

export function safePublicImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === CLOUDINARY_HOST &&
      url.pathname.startsWith(CLOUDINARY_PREFIX)
      ? value
      : null;
  } catch {
    return null;
  }
}

export function safePublicExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? value : null;
  } catch {
    return null;
  }
}
