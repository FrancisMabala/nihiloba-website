# SHIDA École public discovery — 23 October 2026

The existing localized École entry now reads the backend's reviewed School projection and links to individual published detail pages in EN/FR/LN/SW. Anonymous readers see only approved School name/type, city, commune, public introduction and accurate SHIDA verification wording. Dynamic server reads use `no-store`, so unpublication and expired verification are not hidden by a static page cache. An empty published list and an unavailable backend have distinct messages. Detail pages return 404 for unpublished/unknown references.

The website never reads private School, pupil, fee, Guardian or stock endpoints. No School is automatically listed by this deployment; publication still requires verified real School authority, Organization consent and independent review. Enquiries, follow/report actions, photographs and admissions are outside this slice.
