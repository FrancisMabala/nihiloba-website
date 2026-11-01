# Individual selling modernization: integration checkpoint

## Architecture audit

Individual listings are canonical Wenze products in an explicitly typed Personal
selling context, not boutiques. Existing product publication, photos, inventory,
orders, lifecycle and drafts remain authoritative. The current draft lifetime is
24 hours; uploads allow five JPEG/PNG/WebP images of up to 8 MiB. Professional
services are grouped only by backend-provided professional identity references.

My Space previously linked individual contexts to the standalone selling page.
It now embeds that same listing manager at `space?view=listings`, with the same
authenticated gateway and account-bound API provider. It does not implement a
second manager. An account opens listings as its primary management view only
after all activity sources and the navigation permission read succeed, no further
restaurant pages remain, and no other marketplace or organization is present.
Mixed, unknown and partially loaded accounts retain My Activities. Sidebar
navigation retains the existing unsaved-work confirmation.

## Completed in this checkpoint

- Shared account-bound activity loading for sidebar and activity content.
- Dedicated My Listings destination and contextual primary navigation.
- Existing listing management embedded without a second page header.
- Conservative classification for mixed, property and organization accounts.
- Compact listing rows with real product photos or a category placeholder,
  native sharing/copy-link fallback, and expandable management actions. Sale
  provenance remains separate from payment verification.

## Remaining approved work (not implemented by this checkpoint)

The current selling form remains location-first and uses shared-context
fulfillment. Four-step product-first creation, per-listing accepted payment
methods, and the new WhatsApp creation conversation remain pending. Store-wide
payment preferences cannot honestly be presented as per-listing preferences.
Durable storage and canonical publication need extension before exposing those
controls. No payment verification or receipt behavior has changed.

The separately requested universal activity dashboard is queued after the
individual-selling batch. Existing navigation only establishes presence for
properties, jobs, hotels and Wewa; it does not yet supply exact owned-entity counts.
Those categories must not acquire invented counts or invented web management.

## Validation

- 26 focused activity/view unit tests passed.
- Five browser routing cases passed: individual-only, mixed boutique, partial
  source failure, property ownership, organization access; mobile overflow checked.
- Production webpack build and TypeScript passed; scoped ESLint passed.
- All 12 Quick Sell browser checks passed (EN/FR/LN/SW at 390/768/1280 pixels),
  including durable draft resumption and uncertain-publication retry.
- All 12 My Space regression checks passed. Two stale assertions were updated
  to the existing Messages wording and the existing hidden-shop restore control;
  neither production behavior was changed for those assertions.
- Mobile individual-only screenshot inspected from controlled browser fixtures.

This is an implementation checkpoint, not completion of the full approved batch.
No backend schema, production data or urgent WhatsApp template settings changed.
