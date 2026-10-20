# WNZ-10 — product discovery

Wenze and each boutique link to `/shida/wenze/catalog` (also under `/fr`).
Public visitors can filter the complete eligible catalog by category, condition,
availability, explicit-currency price and existing variant options. Shop links
retain the shop reference.

The backend filters before pagination. Next-page links retain every filter;
changing filters starts a fresh traversal. Empty and failed searches give clear
recovery guidance. Hidden products remain excluded; sold-out products are only
included when explicitly selected and cannot be added to a basket.

No new structured product attributes, inventory dimension, migration or
deployment settings. The direct product and boutique URLs remain unchanged.
