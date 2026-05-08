# Allergist on Demand — Shopify Theme

> **Compliance note:** This is the Shopify storefront theme for a telehealth allergy clinic. The symptom quiz collects PHI. The bulk of the PHI handling lives in the **separate** app repo at `~/Local Sites/alle-drops-quiz-app/`. This theme repo's only PHI-related responsibility is rendering the quiz block (which currently injects a script tag, will become an iframe).
>
> **Do not** add analytics, tracking pixels, or session-replay tools to the symptom quiz page. The quiz collects PHI and adding scripts to that page risks HIPAA exposure regardless of where the data is stored. If you need to add a script for marketing/analytics on the storefront, exclude the symptom quiz template explicitly.

## What this repo is

The Shopify theme for the AOD storefront. Page templates, sections, account pages, custom Liquid for non-quiz parts of the site.

## Sister project

The actual symptom quiz lives in the app repo:

```
~/Local Sites/alle-drops-quiz-app/   # Shopify app (Fly.io). Holds the quiz, API, extensions, PHI logic.
~/Local Sites/allergist-on-demand/   # This repo — Shopify theme.
```

The two repos deploy independently:
- `shopify app deploy` (run from app repo) — pushes the Theme App Block + Customer Account extension to Shopify
- `fly deploy -a alle-drops-quiz-app` — pushes the web service (quiz bundle + API) to Fly
- `shopify theme push` (run from this repo) — pushes the theme

## Cloudflare Worker (`cloudflare-worker/`)

**Slated for deletion.** This worker was previously in the PHI submission path; it's being retired in favor of direct Fly submission. Don't add new functionality to it. See `~/Documents/Claude/Projects/AoD/aod-mvp-plan.md` for the deletion plan.

## Reference docs

- MVP architecture and plan: `~/Documents/Claude/Projects/AoD/aod-mvp-plan.md`
- Verbatim consent text: `~/Documents/Claude/Projects/AoD/aod-consent-text.md`
- LLM Council verdict: `~/Documents/Claude/Projects/AoD/council-report-2026-05-06.html`
- App repo CLAUDE.md (full architecture): `~/Local Sites/alle-drops-quiz-app/CLAUDE.md`

## When the iframe conversion happens

Right now the quiz Theme App Block injects a `<script>` tag pointing at the Fly app's bundle. The MVP plan converts it to a cross-origin iframe pointing at `quiz.allerdrops.com` / `quiz.alledrops.com`. When that conversion lands:

- The Theme App Block becomes a thin iframe wrapper with a postMessage listener for resize.
- No PHI ever lives in the storefront DOM — the form is rendered cross-origin so storefront scripts cannot read it.
- The "Cloudflare Worker URL" customizer field should already be removed by then; if not, remove it.

The iframe's host page is in the **app repo**, not this one.
