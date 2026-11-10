// Only local SHIDA destinations; never accept a credential-bearing/external URL.
export function registrationReturnPath(value: string | null, fallback: string): string {
  // Only this public, non-credential action may survive a registration return.
  // A URL alone never performs the write; the destination still authenticates
  // and asks the returning user to continue the action.
  if (value && /^\/(?:fr\/|en\/|ln\/|sw\/)?shida\/emplois\/[A-Za-z0-9_-]+\/?\?job-action=(?:save|unsave|follow|unfollow)$/.test(value)) return value;
  if (!value || !/^\/(?:fr\/|en\/|ln\/|sw\/)?shida(?:\/[A-Za-z0-9_-]+)*\/?$/.test(value) || /[\\?#\s]/.test(value) || /\/register(?:\/|$)/.test(value)) return fallback;
  return value;
}
