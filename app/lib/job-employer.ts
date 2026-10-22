import type { PublicJobEmployerSummary } from "../types/shida-public";

/** A personal poster is not a public employer profile, including legacy records. */
export function publicJobEmployerKey(employer: PublicJobEmployerSummary): string | null {
  return employer.identity_type === "individual" || !employer.public_ref ? null : employer.slug || employer.public_ref;
}
