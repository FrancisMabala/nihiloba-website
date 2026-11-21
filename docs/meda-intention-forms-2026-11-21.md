# Personal Meda intention forms — 21 November 2026

Implementation is local and under independent acceptance review. This document
does not establish publication, deployment or production migration approval.

The canonical product requirements are Backend
`docs/business_modules/meda.md`, updated from the owner's 21 November request.
Sender/space intention and traveller/airport/container type drive six conditional
forms. Ordinary sender transport dates, measurements, budget and photos are
optional. Airport sender/application photos remain required; departure local time
uses the Backend airport catalogue. Its initial supported list contains 31 airports;
unsupported airports are not assigned a guessed timezone.

Container offers include carton choices, collection/arrival, delivery charges and
payment arrangements. These are participant terms, not SHIDA payment collection.
Structured proposals have independent conversations and explicit sender decisions.
Accepting a proposal does not replace the prominent warning and both participants'
separate confirmation of the same final agreement. Existing private access,
notifications and exact enquiry/proposal/version binding remain authoritative.

Mes annonces supports editing, pause/reactivation and withdrawal. Conversation
headers preserve available listing snapshots and identify changed announcements.
Withdrawn or expired announcements stop new enquiries while existing conversations
remain accessible according to the existing authorization policy.

Publication keeps authoring mounted until completion. A saved draft's owner-only
reference is retained in the URL for reload. Failed publication retries reuse that
draft; a lost successful response is reconciled only against the exact owned
reference, values and expected next revision. Unconfirmed/conflicting results are
not reported as success. Unsaved pre-save contents are not stored in browser
storage; existing navigation/before-unload guards protect dirty forms.

Temporary same-identity session refresh errors preserve the form. Confirmed
401/403/409 restrictions and explicit login/account changes still clear private
state. A failed explanatory deletion lookup cannot override its authoritative409.

Local evidence: 171 initial focused checks; publication recovery follow-up70;
1517 Website unit tests in187 files passed after integration. Initial production
build passed before the final recovery refinement; final build and real accepted
browser/API validation remain required. Source/evidence commands and screenshots
are maintained in shared `release-evidence/meda-intention-forms-20261121`.

Backend migration0262 and material product/session release effects require the
applicable current v3 approval. Old Backend readers cannot safely interpret new
nullable dates or independent proposal threads after new writes; previous release
exceptions do not authorize this rollout. No professional management, reviews or
payment processing is included.
