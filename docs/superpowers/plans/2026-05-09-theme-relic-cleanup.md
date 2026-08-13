# Theme Relic Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all legacy quiz system artifacts from the `allergist-on-demand` Shopify theme — old script-tag injection sections, Cloudflare Worker code, Google Sheets JS assets, and deprecated PHI metafield reads that reference fields deleted in WS1.

**Architecture:** The Shopify App's Theme App Block extension (`extensions/quiz-block/blocks/symptom-quiz.liquid` in the `alle-drops-quiz-app` repo) already serves the quiz via cross-origin iframe. The theme's own `sections/symptom-quiz.liquid` is a legacy parallel system using script-tag injection. The Customer Account UI extension (in the Shopify app) already handles submission history. The theme sections that read PHI metafields are now inert (those fields were deleted in WS1) but still contain relic code that must be removed.

**Tech Stack:** Shopify Liquid, theme JSON templates, vanilla JS asset files

**Repos involved:** `allergist-on-demand` (this plan lives here)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `sections/symptom-quiz.liquid` | Delete or replace | Legacy script-tag quiz embed — replace with iframe section or delete if Theme App Block covers it |
| `sections/quiz-history.liquid` | Delete or gut | Reads deleted PHI metafields — dead code |
| `sections/main-account.liquid` | Modify | Remove the quiz history block that reads deleted PHI metafields |
| `assets/symptom-quiz.js` | Delete | Legacy quiz form manager + Cloudflare Worker submission |
| `assets/google-sheets-integration.js` | Delete | Google Sheets CORS proxy — explicitly prohibited in CLAUDE.md |
| `assets/quiz-config.js` | Delete | Hardcoded questions for old system |
| `assets/quiz-results.js` | Delete | Old results display tied to script-tag system |
| `cloudflare-worker/` | Delete directory | Legacy worker infrastructure — decommissioned |
| `templates/*.json` | Check + possibly modify | Verify which templates reference symptom-quiz section |

---

## Task 1: Audit which templates use the legacy section

**Files:**
- Read: `templates/*.json` and `sections/symptom-quiz.liquid`

Before deleting anything, confirm which page templates include the `symptom-quiz` section — and whether those same pages are configured to use the Theme App Block instead.

- [ ] **Step 1: Find all template references to symptom-quiz**

```bash
grep -rl "symptom-quiz" /Users/andrewskinner/Local\ Sites/allergist-on-demand/templates/
grep -rl "symptom-quiz" /Users/andrewskinner/Local\ Sites/allergist-on-demand/config/
```

Note every file that references it.

- [ ] **Step 2: Find all template references to quiz-history**

```bash
grep -rl "quiz-history" /Users/andrewskinner/Local\ Sites/allergist-on-demand/templates/
grep -rl "quiz-history" /Users/andrewskinner/Local\ Sites/allergist-on-demand/sections/
```

- [ ] **Step 3: Check if the Cloudflare Worker URL field is populated**

In the Shopify Admin → Themes → Customize → find the symptom-quiz block/section. If the "Cloudflare Worker URL" customizer field has a value, submissions are currently routing through the old worker, **bypassing Fly**. Clear it immediately.

Also check: `sections/symptom-quiz.liquid` schema for `cloudflare_worker_url` field — confirm it exists and note whether the Theme App Block's schema has already removed it (the Theme App Block in `alle-drops-quiz-app/extensions/quiz-block/` does NOT have this field).

- [ ] **Step 4: Decision gate**

Based on Step 1 findings, two scenarios:

**Scenario A — Template uses Theme App Block (no section reference):**  
The quiz page template was updated when the Theme App Block was deployed. The `sections/symptom-quiz.liquid` section may still exist in the theme but isn't included in any active template. → Safe to delete the section directly (Task 2A).

**Scenario B — Template still references `sections/symptom-quiz`:**  
The page template's JSON still includes the old section. The Theme App Block is installed but may not be in the right template. → Must update the template to use the Theme App Block before deleting the section (Task 2B).

---

## Task 2A: Delete the legacy symptom-quiz section (Scenario A)

*Only do this if Task 1 confirmed no active template references the section.*

**Files:**
- Delete: `sections/symptom-quiz.liquid`
- Delete: `assets/symptom-quiz.js`, `assets/google-sheets-integration.js`, `assets/quiz-config.js`, `assets/quiz-results.js`

- [ ] **Step 1: Delete the section file**

```bash
rm "/Users/andrewskinner/Local Sites/allergist-on-demand/sections/symptom-quiz.liquid"
```

- [ ] **Step 2: Delete the JS assets**

```bash
rm "/Users/andrewskinner/Local Sites/allergist-on-demand/assets/symptom-quiz.js"
rm "/Users/andrewskinner/Local Sites/allergist-on-demand/assets/google-sheets-integration.js"
rm "/Users/andrewskinner/Local Sites/allergist-on-demand/assets/quiz-config.js"
rm "/Users/andrewskinner/Local Sites/allergist-on-demand/assets/quiz-results.js"
```

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "fix(theme): remove legacy script-tag quiz section and old JS assets"
```

---

## Task 2B: Replace legacy section with iframe wrapper (Scenario B)

*Only do this if Task 1 found active template references to the old section.*

**Files:**
- Replace: `sections/symptom-quiz.liquid`

The goal is to replace the script-tag injection content with a thin iframe wrapper that points to the Fly app — essentially the same HTML the Theme App Block renders, but as a standalone section so the existing template JSON doesn't need to change. Once verified working, migrate the template to use the Theme App Block instead and delete this section.

- [ ] **Step 1: Replace the section content**

Overwrite `sections/symptom-quiz.liquid` with a minimal iframe wrapper (no script tags, no `window.AlleDropsQuizConfig`, no `cloudflare_worker_url` field):

```liquid
{%- comment -%}
  AlleDrops Symptom Quiz — standalone section wrapper.
  Renders quiz via cross-origin iframe. No PHI is accessible to storefront scripts.
  Migration target: replace this section with the Theme App Block from the Shopify app.
{%- endcomment -%}

{%- assign fly_url = 'https://alle-drops-quiz-app.fly.dev' -%}
{%- assign embed_src = fly_url | append: '/quiz-embed' -%}

<div class="symptom-quiz-wrapper page-width">
  <iframe
    id="alledrops-quiz-section"
    src="{{ embed_src }}"
    title="AlleDrops Symptom Assessment"
    style="width:100%; border:none; display:block; min-height:600px;"
    scrolling="no"
  ></iframe>

  <script>
    (function() {
      var iframe = document.getElementById('alledrops-quiz-section');
      window.addEventListener('message', function(e) {
        if (!e.data || typeof e.data !== 'object') return;
        if (e.data.type === 'quiz:resize' && iframe) {
          iframe.style.height = (e.data.height + 24) + 'px';
        }
        if (e.data.type === 'quiz:navigate' && e.data.url) {
          window.location.assign(e.data.url);
        }
      });
    })();
  </script>
</div>

{% schema %}
{
  "name": "AlleDrops Quiz (Legacy Section)",
  "tag": "section",
  "class": "section",
  "settings": []
}
{% endschema %}
```

- [ ] **Step 2: Delete the now-unused JS assets**

```bash
rm "/Users/andrewskinner/Local Sites/allergist-on-demand/assets/symptom-quiz.js"
rm "/Users/andrewskinner/Local Sites/allergist-on-demand/assets/google-sheets-integration.js"
rm "/Users/andrewskinner/Local Sites/allergist-on-demand/assets/quiz-config.js"
rm "/Users/andrewskinner/Local Sites/allergist-on-demand/assets/quiz-results.js"
```

- [ ] **Step 3: Push and test on storefront**

Deploy the theme change (via Shopify CLI or theme editor upload), then open the quiz page on the storefront and verify the iframe loads and a test submission completes successfully.

- [ ] **Step 4: Commit**

```bash
git add sections/symptom-quiz.liquid
git add -u assets/
git commit -m "fix(theme): replace script-tag quiz section with cross-origin iframe wrapper"
```

---

## Task 3: Remove PHI metafield reads from quiz-history.liquid

**Files:**
- Delete or replace: `sections/quiz-history.liquid`

This section reads `customer.metafields.alledrops.quiz_history`, `alledrops.symptom_profile_id`, `alledrops.quiz_score`, `alledrops.severity_level`, `alledrops.quiz_date`, and `alledrops.quiz_region` — all deleted in WS1. It also embeds ~130 lines of JavaScript for parsing that data. The Customer Account UI extension (in the Shopify app) is the correct surface for submission history now.

**Decision:** If `quiz-history.liquid` is included in any template, replace it with a simple message redirecting patients to the Customer Accounts page. If it's not in any template, delete it.

- [ ] **Step 1: Check template references**

```bash
grep -rl "quiz-history" /Users/andrewskinner/Local\ Sites/allergist-on-demand/templates/
```

- [ ] **Step 2A (no template references): Delete the section**

```bash
rm "/Users/andrewskinner/Local Sites/allergist-on-demand/sections/quiz-history.liquid"
git add -u
git commit -m "fix(theme): remove quiz-history section — PHI metafields deleted, history in account extension"
```

- [ ] **Step 2B (template references exist): Replace with redirect message**

Replace the entire content of `sections/quiz-history.liquid` with:

```liquid
{%- comment -%}
  Legacy quiz history section — replaced by Customer Account UI extension.
  PHI metafields were deleted in WS1 cleanup (2026-05-09).
{%- endcomment -%}

<div class="page-width" style="padding: 2rem 0; text-align: center;">
  <p>Your assessment history is available in your <a href="/account">account dashboard</a>.</p>
</div>

{% schema %}
{
  "name": "Quiz History (Legacy)",
  "tag": "section",
  "settings": []
}
{% endschema %}
```

Then commit:

```bash
git add sections/quiz-history.liquid
git commit -m "fix(theme): gut quiz-history section — redirect to account extension"
```

---

## Task 4: Strip PHI metafield block from main-account.liquid

**Files:**
- Modify: `sections/main-account.liquid`

This file has two quiz-history blocks: ~lines 31–98 (quiz history display using metafields) and ~lines 226–304 (duplicate JavaScript). Both must be removed. The rest of the account page (login form, order history, address book, etc.) must be preserved.

- [ ] **Step 1: Open the file and locate the quiz blocks**

The PHI block starts around line 31 with:
```liquid
{%- assign quiz_history = customer.metafields.alledrops.quiz_history.value -%}
```

Find both blocks. The first is Liquid + HTML (rendering quiz history). The second is a `<script>` block parsing quiz data from data attributes.

- [ ] **Step 2: Delete both quiz-related blocks**

Remove:
- The `{%- assign quiz_history -%}` through the closing `</div>` of the quiz history display (first block)
- The entire `<script>` block that references `quizHistoryData`, `quiz_history_items`, or similar quiz-related JS variables (second block)

Keep everything else in the file intact.

- [ ] **Step 3: Verify the file renders without errors**

In Local (your local WordPress/Shopify dev environment) or Shopify CLI dev, open the account page and confirm no Liquid errors and the quiz history block is gone. Order history, addresses, and other account sections should still render.

- [ ] **Step 4: Run typecheck on the theme (if applicable)**

```bash
# If using Shopify CLI:
shopify theme check
```

- [ ] **Step 5: Commit**

```bash
git add sections/main-account.liquid
git commit -m "fix(theme): remove PHI metafield quiz history block from main-account.liquid"
```

---

## Task 5: Delete Cloudflare Worker directory

**Files:**
- Delete: `cloudflare-worker/` (entire directory)

This directory contains `worker.js`, `wrangler.toml`, and `test-quiz-submission.js`. The worker proxied submissions to Google Sheets and wrote PHI metafields — both deprecated. The worker should have been decommissioned when Fly replaced it.

**Before deleting, confirm the worker is not live.** 

- [ ] **Step 1: Confirm worker is not active**

Check `wrangler.toml` for the worker name (`alledrops-quiz-worker`). Then verify it's not deployed:

```bash
# Requires wrangler CLI logged in as the correct account:
wrangler list 2>/dev/null || echo "wrangler not available — check Cloudflare dashboard"
```

Alternatively, open the Cloudflare dashboard → Workers & Pages and confirm `alledrops-quiz-worker` either doesn't exist or shows 0 requests in the last 7 days.

If the worker is still receiving traffic, that means live submissions are going through it. Do not delete until traffic is confirmed zero.

- [ ] **Step 2: Delete the directory**

```bash
rm -rf "/Users/andrewskinner/Local Sites/allergist-on-demand/cloudflare-worker"
```

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "fix(theme): delete Cloudflare Worker directory — worker decommissioned"
```

---

## Task 6: Push and deploy theme

- [ ] **Step 1: Verify clean state**

```bash
cd "/Users/andrewskinner/Local Sites/allergist-on-demand"
git status
git log --oneline -6
```

- [ ] **Step 2: Push to remote**

```bash
git push
```

- [ ] **Step 3: Deploy to Shopify**

Use Shopify CLI or the Theme Editor upload. The exact command depends on whether you're using theme push or the online editor:

```bash
shopify theme push --theme <theme-id>
# OR upload via: Shopify Admin → Online Store → Themes → Actions → Edit code
```

- [ ] **Step 4: Smoke test on live storefront**

1. Open the quiz page — confirm quiz loads via iframe, no console errors referencing `AlleDropsQuizConfig` or `workers.dev`
2. Open `/account` — confirm no quiz history section or Liquid errors
3. Complete a test submission end-to-end — confirm it lands in Cloud SQL (`fly logs -a alle-drops-quiz-app` should show `[submit]` log line)
4. Check Fly logs for any 500s after the deploy

---

## Self-review

**Spec coverage:**
- Cloudflare Worker URL references ✅ Task 5 (delete directory) + Task 2A/2B (remove from section)
- `window.AlleDropsQuizConfig` pattern ✅ Task 2A/2B (delete or replace section)
- Deprecated PHI metafields in quiz-history.liquid ✅ Task 3
- Deprecated PHI metafields in main-account.liquid ✅ Task 4
- JS assets (old submission pipeline) ✅ Task 2A/2B (delete assets)
- Cloudflare Worker directory ✅ Task 5
- Third-party scripts — COMPLIANT (explore agent confirmed no trackers on quiz pages)

**Blocked items:**
- Confirming worker traffic = zero requires Cloudflare dashboard access (Andrew)
- Template audit in Task 1 determines which of Task 2A vs 2B to execute — cannot be determined from code alone
