# Permanent homepage brand copy

The existing ShidaPage renders all four locales. SHIDA_SLOGAN in app/lib/brand.ts is the canonical Lingala headline, rendered with lang="ln". Supporting descriptions use discovery-copy.ts; existing localized SEO titles, routes, search and visual structure remain intact. Wenze and My Space branding are untouched by this batch.

Validation: production build/type check, 20 discovery tests, 21 browser checks across EN/FR/LN/SW and 360/390/768/1024/1440px, language switching and search destination. Reviewed French desktop and English mobile screenshots; all viewport checks have no horizontal overflow. Evidence: test-results/brand-refinement. No backend, migration, authentication or notification changes.
