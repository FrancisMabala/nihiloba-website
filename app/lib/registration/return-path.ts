// Only local SHIDA destinations; never accept a credential-bearing/external URL.
export function registrationReturnPath(value: string | null, fallback: string): string {
  if (!value || !/^\/(?:fr\/|en\/|ln\/|sw\/)?shida(?:\/[A-Za-z0-9_-]+)*\/?$/.test(value) || /[\\?#\s]/.test(value) || /\/register(?:\/|$)/.test(value)) return fallback;
  return value;
}
