# NIHILOBA website

The bilingual English/French production website for NIHILOBA, built with Next.js App Router, TypeScript and Tailwind CSS. It runs as a Render Node web service so public SHIDA marketplace pages can be rendered from the official API.

## Requirements

- Node.js 22.13 or newer
- npm

## Installation

```bash
npm install
```

## Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Production build

```bash
npm run build
```

To run all local checks separately:

```bash
npm run lint
npm run typecheck
npm test
```

## Deploy as a Render Node web service

1. Push this repository to a Git provider supported by Render.
2. In Render, create a **Web Service** with the Node runtime and connect the repository.
3. Use these deployment settings:
   - Build command: `npm ci && npm run build`
   - Start command: `npm run start`
   - Environment variable: `SHIDA_API_BASE_URL=https://api.nihiloba.com`
4. Deploy the site.
5. Add `nihiloba.com` as the custom domain when DNS is ready.

The repository includes a `render.yaml` Blueprint with the production runtime configuration and security headers. Connect or synchronize that Blueprint so the CSP, HSTS and other response-header rules are retained.

See `docs/shida-public-marketplaces.md` for API boundaries, caching and migration notes.

## Routes

- `/`
- `/en` and `/fr`
- `/en/about` and `/fr/about`
- `/en/products` and `/fr/products`
- `/shida`, `/en/shida` and `/fr/shida`
- `/shida/appartements`, `/shida/appartements/{slug}` and French equivalents
- `/shida/hotels`, `/shida/hotels/{slug}` and French equivalents
- `/en/education` and `/fr/education`
- `/en/contact` and `/fr/contact`
- `/en/privacy` and `/fr/privacy`
- `/en/data-protection` and `/fr/protection-des-donnees`
- `/en/terms` and `/fr/terms`

The root route `/` serves the English homepage as the default. Each localized page includes canonical and alternate-language metadata.

## Content requiring confirmation before wider launch

- Final legal review of the preliminary website terms
- Timing and scope of planned SHIDA features
- Programme details for the planned NIHILOBA Education initiative
