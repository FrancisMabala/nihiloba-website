# Restaurants: statistics redesign — 15 November 2026

Implemented on Web and Business: compact summary, local 1/7/30-day presets, custom ranges, accessible chart/list, ranked quantities, source bars, and secondary lifecycle/amount details. Web retains current followers and privacy-gated interest measurements in the lower visibility card. Business has no existing authorized insights endpoint; it keeps order statistics rather than inventing follower/view data.

Main cards, daily buckets and channel counts use submitted orders in the selected local period and their current states. Handed-over means completed, not paid. Other statuses remain explicit. Completed-in-period monetary/event metrics retain their previous separate meaning. CDF and USD remain separate.

The server aggregates authorized retained facts. Ranking includes accepted/progressing/completed cohort orders, counting each canonical standalone or composed-plate dish line once; extras are excluded. Recorded units and amount-based portions remain distinct. Historical names come from snapshots. SQL pagination is retained. Covered dates only may produce zero bars; unavailable coverage returns no metrics. Custom periods over 31 days use labelled 7-day buckets.

Validation: 16 targeted backend statistics tests passed (SQLite, personal and organization); 21 Web browser cases passed across FR/EN/LN/SW and 320/375/390/820/1440 widths, plus two calendar-series tests. Type checks, targeted lint and both production builds passed. Desktop/mobile screenshots reviewed in C:/NIHILOBA/release-evidence/restaurant-seven-20261114. Initial duplicate effect load was corrected; refresh preserves the selected period.

No migration, new tracking, message channel, or production test data. PostgreSQL aggregation has not been exercised locally because Docker is unavailable; SQLite is not concurrency evidence. Native-speaker LN/SW review remains advisable. Existing fullscreen shell is reused.
