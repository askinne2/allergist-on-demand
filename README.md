# AlleDrops Symptom Quiz — Shopify Theme

Shopify theme for the AOD (Allergist on Demand) storefront. The symptom quiz itself lives in the **sister app repo** — this theme repo's only quiz-related responsibility is rendering the Theme App Block that embeds the quiz.

## Architecture

```
Storefront page (Shopify)
  └── Theme App Block (extensions/quiz-block in app repo)
        └── cross-origin iframe → https://alle-drops-quiz-app.fly.dev
              └── POST /api/quiz/submit → Cloud SQL (PHI)
                                       → Shopify metafields (non-PHI only)

/account page
  └── Customer Account UI extension (extensions/quiz-history in app repo)
        └── GET /api/me/assessments → Cloud SQL ledger
        └── GET /api/me/assessment/{id}/pdf → PDF download
```

**PHI never touches this repo.** All submission data (name, DOB, email, phone, score, answers) is stored in Cloud SQL via the Fly app. The only Shopify data written is `alledrops.last_completed_at` and `alledrops.quiz_count` (non-PHI metafields).

## Sister repos

| Repo | Purpose |
|---|---|
| `~/Local Sites/alle-drops-quiz-app/` | Shopify app — quiz bundle, API, extensions, PDF, admin |
| `~/Local Sites/allergist-on-demand/` | This repo — Shopify theme |

Deploy independently:
- `shopify theme push` — pushes this theme to Shopify
- `shopify app deploy` (from app repo) — pushes Theme App Block + Customer Account extension
- `fly deploy -a alle-drops-quiz-app` (from app repo) — pushes Fly web service

## Theme structure (quiz-related)

```
sections/
├── quiz-history.liquid     # Legacy section — now just redirects to /account.
│                           # Template page.quiz-history.json still references it.
├── main-account.liquid     # Standard account page. PHI metafield block removed.
└── regional-info.liquid    # Product page section for regional allergy info (keep).

templates/
├── page.quiz.json          # Primary quiz page — uses Theme App Block via apps section
├── page.quiz-history.json  # Legacy URL — renders redirect section above
└── page.symptom-quiz.json  # Alternate quiz page template (apps section only)

snippets/
├── quiz-progress.liquid    # Progress indicator (referenced by deleted section — may be unused)
└── severity-scale.liquid   # Severity input (may be unused)
```

## Quiz page setup

The quiz page (`/pages/quiz`) uses `templates/page.quiz.json`, which includes the Theme App Block via Shopify's `apps` section type. The block is configured with:

- `app_url`: `https://alle-drops-quiz-app.fly.dev`
- No Cloudflare Worker URL field (removed — all submissions go directly to Fly)

To add the quiz to a new page: Online Store → Pages → assign template `page.quiz`.

## Compliance

- No PHI in this repo or any Shopify surface
- No analytics, tracking pixels, or session-replay tools on quiz pages
- `alledrops.last_completed_at` and `alledrops.quiz_count` are the only quiz-related metafields permitted
- Full HIPAA architecture in app repo CLAUDE.md

## Common commands

```bash
# Push theme to Shopify
shopify theme push --store=allergist-on-demand.myshopify.com

# Local dev
shopify theme dev --store=allergist-on-demand.myshopify.com
```

## Key contacts / references

- Full MVP plan: `~/Documents/Claude/Projects/AoD/aod-mvp-plan.md`
- App repo CLAUDE.md: `~/Local Sites/alle-drops-quiz-app/CLAUDE.md`
- Fly app: `alle-drops-quiz-app` (region: iad)
- Cloud SQL instance: `alledrops-quiz-data` (GCP project: `alledrops-quiz`)
