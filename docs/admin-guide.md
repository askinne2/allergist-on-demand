# AlleDrops Theme — Admin Guide

> **Note:** Updated 2026-05-10. The previous system (Cloudflare Worker, Google Sheets, script-tag injection) has been fully removed. All quiz management now happens through the Shopify app and Fly.io admin.

## Quiz page setup

The quiz lives at `/pages/quiz` and uses `templates/page.quiz.json`. That template includes the Theme App Block from the `alledrops-quiz-production` app, which renders the quiz as a cross-origin iframe from `https://alle-drops-quiz-app.fly.dev`.

**To assign the quiz to a different page:**
1. Online Store → Pages → select the page
2. Change template to `page.quiz`

**Theme App Block settings** (Online Store → Themes → Customize → quiz page → AlleDrops Quiz block):
- `app_url` — should always be `https://alle-drops-quiz-app.fly.dev`
- `heading` / `subheading` — displayed above the iframe
- `show_disclaimer` — toggles medical disclaimer text
- `consult_redirect_url` — where moderate/high scorers are sent after submission
- `enable_test_mode` — off in production

## Viewing quiz submissions

Submissions are in the **Fly.io admin app**, not Shopify.

1. Go to `https://alle-drops-quiz-app.fly.dev/app` (requires Shopify staff login)
2. The admin dashboard shows total submissions, weekly counts, TN/TX breakdown, and bracket distribution
3. Click any row to view full submission detail and download a PDF

Patient history is visible to logged-in patients via the Customer Account UI extension on `/account`.

## Quiz scoring (current brackets)

| Score | Bracket | Outcome |
|---|---|---|
| 0–2 | `0-2` | Auto-submitted silently — no manual consent step |
| 3–6 | `3-6` | Shown consultation CTA |
| 7+ | `7+` | Shown product + additional history form |

Available states: **Tennessee** and **Texas** only.

## Consent version

The current consent version string is stored in `app/lib/consent-version.ts` in the app repo. When counsel finalizes the consent text, update that file and bump the version to `v1.0-YYYY-MM-DD`. The string is recorded per submission in Cloud SQL.

## Adding the quiz to navigation

1. Online Store → Navigation
2. Select the menu
3. Add menu item → link to `/pages/quiz`

## Deployment

This theme deploys independently of the Fly app:

```bash
# Push theme changes to Shopify
shopify theme push --store=allergist-on-demand.myshopify.com
```

The quiz logic (API, extensions, PDF) is deployed separately from the app repo via `fly deploy` and `shopify app deploy`.

## Troubleshooting

| Symptom | Check |
|---|---|
| Quiz iframe not loading | Verify `app_url` in Theme App Block settings is `https://alle-drops-quiz-app.fly.dev` |
| Submission not appearing in admin | Check Fly logs: `fly logs -a alle-drops-quiz-app` |
| `/account` quiz history missing | Customer Account UI extension — check app deploy status |
| `/pages/quiz-history` shows old content | That URL now redirects to `/account` — expected |
