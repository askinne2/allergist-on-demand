# AlleDrops Symptom Quiz — Project Context

> Updated 2026-05-10. Previous system (Cloudflare Worker, Google Sheets, script-tag injection) fully removed.

## What this repo is

The Shopify theme for the AOD (Allergist on Demand) storefront. It does **not** contain the quiz — the quiz lives in the sister app repo at `~/Local Sites/alle-drops-quiz-app/`.

This theme's only quiz responsibility: a Theme App Block (`apps` section in `templates/page.quiz.json`) that embeds the quiz as a cross-origin iframe from Fly.io.

## Sister repo

```
~/Local Sites/alle-drops-quiz-app/   # Shopify app on Fly.io
  ├── app/routes/                     # Quiz embed, submit API, patient ledger, PDF, admin
  ├── app/lib/                        # DB, validation, HMAC auth, PDF gen
  ├── extensions/quiz-block/          # Theme App Block (iframe wrapper)
  └── extensions/quiz-history/        # Customer Account UI extension
```

## Current data flow

```
Patient fills quiz (cross-origin iframe)
  → POST /api/quiz/submit (Fly.io)
  → Cloud SQL submissions table (all PHI)
  → Shopify metafields: last_completed_at + quiz_count only (non-PHI)

Patient views history (/account)
  → Customer Account UI extension
  → GET /api/me/assessments (HMAC-signed)
  → Cloud SQL

Provider views submissions
  → /app admin (Shopify-embedded, session auth)
  → Cloud SQL
```

## PHI rules

- PHI fields: name, DOB, email, phone, state, score, bracket, answers, personal_history, family_history
- PHI lives in Cloud SQL only — never Shopify, never Google Workspace
- No analytics, tracking pixels, or session-replay on any quiz page
- Permitted Shopify metafields: `alledrops.last_completed_at`, `alledrops.quiz_count`

## States served

Tennessee and Texas only.

## Score brackets

| Score | Bracket | Path |
|---|---|---|
| 0–2 | `0-2` | Silent auto-submit |
| 3–6 | `3-6` | Consultation CTA |
| 7+ | `7+` | Product + history form |

## Key contacts

- Full MVP plan: `~/Documents/Claude/Projects/AoD/aod-mvp-plan.md`
- App repo CLAUDE.md (architecture + PHI rules): `~/Local Sites/alle-drops-quiz-app/CLAUDE.md`
