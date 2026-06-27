# leadflow — GAELWORX prospecting harness

Claude Code is the runtime. It finds and qualifies local leads, audits their
websites, renders an on-brand GAELWORX **report-card PDF natively** (headless
Chromium — no Gotenberg), writes a personalized email, and produces a **Gmail
draft with the PDF attached** via one small n8n delivery workflow. You set a short
brief and review the drafts.

This is the "GAELWORX Pipeline (Wave)" n8n design, refitted so the brain runs in
Claude Code (real web tools, native rendering, no hallucinated agents) and n8n is
reduced to a reliable delivery connector.

## Pipeline (per lead)

1. **Discover** — Exa + Nimble find real `{industry}` in `{geo}` (no directories,
   no chains). `prompts/lead-qualification.md`.
2. **Verify + scrape** — Nimble confirms the business's own site + a real contact
   email; otherwise `MANUAL_CONTACT` / `SKIP`.
3. **Audit + route** — 10-dimension audit (4 verified by observation), competitors,
   3-sentence bottom line; route `AUDIT` / `PITCH_OTHER` / `SKIP`.
   `prompts/audit-rubric.md`.
4. **Render PDF** — `src/reportCard.js` → `src/render.js` (Chromium `page.pdf()`),
   full brand fidelity.
5. **Write email** — fully AI, on-brand, leads with the single most concrete
   finding. `prompts/email-writing.md` + `src/emailTemplate.js`.
6. **Deliver** — `src/prepare.js` builds the payload; one `execute_workflow` call
   to the n8n **GAELWORX Draft Delivery** workflow creates the Gmail draft with the
   PDF attached.
7. **Ledger** — `data/leads.jsonl` (dedup + per-status tracking). `src/ledger.js`.

The **wave** repeats in small batches until the ledger shows the target number of
`DONE` drafts (e.g. 100) or candidates run out.

## Layout

```
src/reportCard.js     GAELWORX report-card HTML (from the brand source of truth)
src/emailTemplate.js  on-brand HTML email wrapper + plain-text fallback
src/render.js         native HTML -> PDF via pre-installed Chromium
src/prepare.js        one finished lead -> out/<slug>.delivery.json (+ PDF)
src/runWave.js        batch: render payloads + log ledger for a wave file
src/ledger.js         dedup + status ledger (data/leads.jsonl)
prompts/              lead-qualification, audit-rubric, email-writing
n8n/delivery-workflow.sdk.js   reference copy of the n8n delivery workflow
scripts/render-sample.js       smoke test (writes out/sample-report.pdf)
```

## Setup

```bash
npm install            # installs playwright-core; Chromium is pre-provided
npm run render:sample  # smoke test -> out/sample-report.pdf
```

Chromium is found at `/opt/pw-browsers/...`; override with `CHROMIUM_PATH` if needed.

## Prerequisite (one-time, you)

Attach a **Gmail OAuth2 credential** to the *Create Gmail Draft* node in the n8n
workflow **GAELWORX Draft Delivery** (`Ka6O5TOqkwlBJGm1`). That's the only
credential the pipeline needs (no Anthropic key — Claude Code is the model; no
Gotenberg — rendering is native). Exa + Nimble are used by Claude Code directly.

## Running a wave (how Claude Code drives it)

1. You give a brief: `{ industry, geo, target, sender_name, sender_email }`.
2. Claude Code discovers + audits + writes per lead (prompts/), assembling a
   `wave.json` of qualified leads.
3. `node src/runWave.js wave.json` renders PDFs + delivery payloads and logs the
   ledger.
4. For each `out/*.delivery.json`, Claude Code calls `execute_workflow`
   (`Ka6O5TOqkwlBJGm1`, webhook input = the payload) → a Gmail draft with the PDF.
5. Repeat in batches until `node src/ledger.js count` shows target `DONE`.

You review the drafts in Gmail and hit send on the ones you like.

## Scale note (100+)

The delivery payload carries the PDF as base64. For large waves, an optional
optimization is to upload each PDF to Google Drive and pass a download URL the
n8n workflow fetches (an HTTP node before the Gmail node), keeping base64 out of
the orchestration. Not required for the first 100; called out so it's a conscious
choice.
