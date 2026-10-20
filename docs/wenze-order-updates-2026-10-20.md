# Wenze web order updates — WNZ-06

Order details now show durable order updates, unread counts and an explicit
Mark as read action. The component uses the existing authenticated gateway;
backend source ownership and exact recipient identity remain authoritative.
Current-order links and timeline remain beside the updates.

The adapter reuses unified inbox thread/read cursors and Wenze outbox records.
Web-only confirmations/preparation notices cannot trigger a WhatsApp send.
Reading on the website does not claim WhatsApp delivery or payment. This batch
adds order updates, not unrestricted chat. Latest 100 updates are shown; older
outbox evidence remains retained.

Buyer locales: EN/FR. Personal and Organization seller locales: EN/FR/LN/SW.
Mobile checks use synthetic records. Failed authorization clears displayed
updates. WNZ-07 owns actual inbound-window checks and proactive eligibility.
No new dependency, configuration or migration. Deploy backend before frontends.
Exact validation and release evidence is in the existing implementation tracker.
