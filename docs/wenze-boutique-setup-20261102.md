# Wenze boutique setup — implementation audit

## Existing architecture and reused behavior
Personal boutique creation lives in WenzeWorkspace; organization management retains its existing authorized Business context. Existing My Space activity aggregation discovers the resulting canonical WenzeStore record. Individual item selling and its listings are unchanged.

The same create_wenze_store publication service now accepts optional initial_settings. It validates existing payment methods, fulfillment readiness, estimates and public pickup consent, then writes the shop and its settings in the existing publication transaction. Retries reuse the publication reference; changed payloads conflict. No migration, new payment processor or independent settings store is introduced. Pickup/delivery columns and payment_preferences_json are the same values read by My Shop. Creation preserves existing visibility rules.

## WhatsApp audit
Current public creation/configuration actions deliberately hand off to authenticated web management. This remains unchanged. Existing retained conversation handlers support durable workflows: they now collect optional setup and offline payment preferences and require explicit review before creation. They call the same publication service. The minimal path no longer creates a shop immediately after city selection. Existing numbered-choice rendering, routing, Back, workflow snapshots and cancellation are retained. Urgent notification templates are unchanged.

## Drafts and boundaries
Web drafts remain in sessionStorage for up to 24 hours, keyed by the existing authenticated session binding. Retries retain the publication reference. WhatsApp snapshots retain settings in the existing create_wenze_store workflow. There is no existing authenticated web adapter for these conversation snapshots; cross-channel draft editing is NOT implemented or claimed. A future adapter needs actor/context authorization, revision checking and reuse of the workflow publication identity. No parallel draft database was added. Organization creation remains in the existing Business UI; this Personal UI does not confer organization rights.

## Validation
60 focused existing/new backend tests passed (boutique setup, seller activation, publication idempotency, release R5). Additional retained-WhatsApp configuration and defer tests passed (8 setup tests total), and a management API round-trip test passed. Tests verify selected cash + external Mobile Money, pickup/delivery, estimates, idempotency, invalid setup atomicity and rejection of injected ownership fields. Frontend production webpack build and ESLint passed; browser tests cover 360/390/768/1024/1440 widths, EN/FR/LN/SW, retry identity and same-session draft recovery. Controlled fixtures only; no production shops or messages created.

## Release
Not deployed. This release needs the explicit authorization requested by the supplied brief. Deploy backend before website. No database migration required. Roll back website first if needed; new backend fields are optional for old clients. Do not remove urgent WhatsApp templates. Live checks must verify both commit SHAs and a real authorized creation flow; local validation does not establish production deployment.

## Pickup and delivery settings

The pickup commune filters quartier suggestions. A seller can enter an unlisted quartier or keep an existing address. Delivery communes are saved separately. The registration and pickup fields share the same suggestions. The reference includes [OpenStreetMap RDC quartier data](https://data.humdata.org/dataset/quartiers-rdc-quarters-drc), © OpenStreetMap contributors, under the [Open Database License](https://www.openstreetmap.org/copyright). The derived directory is available in `app/lib/registration/kinshasa-quartiers.json`.
