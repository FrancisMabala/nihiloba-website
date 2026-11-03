# Individual selling and Mes annonces — 3 November 2026

Implemented four-step individual selling with canonical saved progress, listing
payment/fulfillment preferences, and cross-channel resumption. Mixed accounts
retain their activity dashboard and boutique management. Personal seller orders
use an explicit role in My Transactions, separate from customer purchases, and
open the existing authorized order details. Completion does not verify payment.

Validation: production build and type check passed; 28 transaction/summary/gateway
unit tests passed; 20 wizard browser cases cover EN/FR/LN/SW at five widths;
seven My Space/role navigation browser tests passed. Synthetic test records and
mocked browser responses are validation fixtures, never production listings.

Requires backend migration 0217 and the matching backend release first. Website
rollout is pending. No new dependency or environment variable is introduced.
Backend technical record: docs/wenze/UNIFIED_LISTINGS_2026_11_03.md in shida-backend.
