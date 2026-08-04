# NIHILOBA website

The bilingual English/French production website for NIHILOBA, built with Next.js App Router, TypeScript and Tailwind CSS. The project exports to a fully static site for deployment on Render.

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

The build creates the static site in the `out` directory. To check the code separately, run:

```bash
npm run lint
```

## Deploy as a Render Static Site

1. Push this repository to a Git provider supported by Render.
2. In Render, create a new **Static Site** and connect the repository.
3. Use these deployment settings:
   - Build command: `npm ci && npm run build`
   - Publish directory: `out`
4. Deploy the site.
5. Add `nihiloba.com` as the custom domain when DNS is ready.

The repository includes a `render.yaml` Blueprint with the production security headers. Connect or synchronize that Blueprint in Render so the CSP, HSTS and other response-header rules are applied to the existing static site.

The project uses `output: "export"` in `next.config.ts`, so no Node.js server is required in production.

## Routes

- `/`
- `/en` and `/fr`
- `/en/about` and `/fr/about`
- `/en/products` and `/fr/products`
- `/en/shida` and `/fr/shida`
- `/en/education` and `/fr/education`
- `/en/contact` and `/fr/contact`
- `/en/privacy` and `/fr/privacy`
- `/en/data-protection` and `/fr/protection-des-donnees`
- `/en/terms` and `/fr/terms`

The root route `/` serves the English homepage as the default. Each localized page includes canonical and alternate-language metadata.

## Content requiring confirmation before wider launch

- Final legal review of the preliminary website terms
- Official NIHILOBA social profile URLs
- Professional `@nihiloba.com` email address
- Timing and scope of planned SHIDA features
- Programme details for the planned NIHILOBA Education initiative
