# AlleDrops Theme — Technical Reference

> **Note:** This document reflects the current architecture as of 2026-05-10. The previous system (script-tag injection, Cloudflare Worker, Google Sheets) has been fully removed.

## Current Architecture

The quiz is served by a Shopify app hosted on Fly.io. This theme repo contains only the Theme App Block wrapper — no quiz logic, no JS assets, no data handling.

```
Storefront (this repo)
  └── Theme App Block (apps section in page.quiz.json)
        └── iframe src="https://alle-drops-quiz-app.fly.dev/quiz-embed"

Fly.io app (alle-drops-quiz-app repo)
  ├── /quiz-embed              — serves cross-origin iframe
  ├── POST /api/quiz/submit    — validates + inserts to Cloud SQL
  ├── GET /api/me/assessments  — HMAC-authenticated patient ledger
  ├── GET /api/me/assessment/{id}/pdf — HMAC-authenticated PDF
  └── /api/admin/*             — Shopify-session-authenticated admin views

Cloud SQL (alledrops-quiz-data, GCP project alledrops-quiz)
  └── submissions table        — all PHI (name, DOB, email, phone, score, answers)

Shopify metafields (non-PHI only)
  └── alledrops.last_completed_at
  └── alledrops.quiz_count
```

## Theme files — quiz-related

| File | Purpose |
|---|---|
| `templates/page.quiz.json` | Primary quiz page. Uses `apps` section containing the Theme App Block. |
| `templates/page.symptom-quiz.json` | Alternate quiz page. Apps section only (no legacy sections). |
| `templates/page.quiz-history.json` | Legacy URL — renders `sections/quiz-history.liquid` redirect. |
| `sections/quiz-history.liquid` | Minimal redirect to `/account`. Template still wires it in so the URL doesn't 404. |
| `sections/main-account.liquid` | Standard account page. PHI metafield block was removed 2026-05-10. |
| `sections/regional-info.liquid` | Product page section for regional allergy info. Not quiz-related. |

## What was removed (2026-05-10)

| Removed | Reason |
|---|---|
| `sections/symptom-quiz.liquid` | Legacy script-tag quiz — replaced by Theme App Block |
| `sections/quiz-results.liquid` | Old inline results display — referenced deleted CSS |
| `assets/symptom-quiz.js/.css` | Old quiz bundle and styles |
| `assets/quiz-config.js` | Hardcoded question definitions for old system |
| `assets/quiz-results.js` | Old results rendering |
| `assets/google-sheets-integration.js` | Google Sheets CORS proxy — prohibited (no BAA) |
| `cloudflare-worker/` | Worker that proxied PHI to Google Sheets |
| `google-apps-script/` | Apps Script that received and stored PHI in Sheets |
| PHI blocks in `main-account.liquid` | Metafield reads for deleted PHI fields |

## App repo

All quiz logic, API routes, extensions, and PDF generation live in:
`~/Local Sites/alle-drops-quiz-app/`

See that repo's `CLAUDE.md` for full architecture, PHI rules, and key files.
