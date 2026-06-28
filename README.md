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
4. **Render PDF** — write a real-schema `audit.json` and run the **official kit**
   `audit-kit/gaelworx_audit_kit/render_report.py` (via `src/renderKit.js` /
   `src/prepare.js`). The kit owns layout, charts, branding, grade math.
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
audit-kit/gaelworx_audit_kit/  OFFICIAL renderer + schema (render_report.py,
                      audit_schema.json, example_audit.json, AGENT_PROMPT.md) — source of truth
src/renderKit.js      calls render_report.py: real-schema audit.json -> branded PDF
src/emailTemplate.js  on-brand HTML email wrapper + plain-text fallback
src/prepare.js        one finished lead -> audit.json + PDF (via kit) + delivery.json
src/reportCard.js     DEPRECATED (early homegrown template; superseded by the kit)
src/render.js         generic native HTML -> PDF (used for ad-hoc HTML, not the report)
src/runWave.js        batch: render payloads + cap/dedup + ledger (+ optional Attio)
src/ledger.js         dedup + status ledger + daily cap (data/leads.jsonl)
src/rundown.js        per-lead human rundown (used for the Attio note)
src/attio.js          push lead + grade + report link + rundown into Attio (CRM)
src/toAgentMail.js    map a delivery payload -> AgentMail send/draft args (yardworx)
prompts/              lead-qualification, audit-rubric, email-writing
n8n/delivery-workflow.sdk.js   reference copy of the n8n delivery workflow
scripts/render-sample.js       smoke test (writes out/sample-report.pdf)
DELIVERABILITY.md     Phase 0 checklist — do before any cold send
```

## Setup

```bash
npm install                                   # playwright-core (for ad-hoc node renders)
pip install playwright==1.55.0                 # for the OFFICIAL kit renderer (render_report.py)
# Chromium is pre-provided at /opt/pw-browsers (build 1194). Python playwright 1.55
# expects build 1187 — if its launch can't find the browser, symlink once:
#   ln -sfn /opt/pw-browsers/chromium-1194 /opt/pw-browsers/chromium-1187
#   ln -sfn /opt/pw-browsers/chromium_headless_shell-1194 /opt/pw-browsers/chromium_headless_shell-1187
# Verify: python3 audit-kit/gaelworx_audit_kit/render_report.py \
#           audit-kit/gaelworx_audit_kit/example_audit.json out/example.pdf   # -> "rendered (chromium)"
```

The kit's three-tier fallback (chromium → weasyprint → html-only) always produces a
deliverable, so a missing browser degrades to a styled `.html` rather than failing.

## Prerequisite (one-time, you)

Attach a **Gmail OAuth2 credential** to BOTH Gmail nodes in the n8n workflow
**GAELWORX Delivery** (`sWZvE2db8q7bmatR`). That's the only credential the pipeline
needs (no Anthropic key — Claude Code is the model; no Gotenberg — rendering is
native). Exa + Nimble are used by Claude Code directly.

**Before switching to `send`:** complete `DELIVERABILITY.md` (SPF/DKIM/DMARC,
verification, warm-up). Until then the pipeline runs in **draft mode**.

## Delivery modes
The delivery workflow routes on the payload's `mode`:
- **`draft`** (default, safe): Gmail draft/create with the report-card **PDF attached**
  — for review, and for the reply follow-up.
- **`send`**: Gmail message/send — cold first touch carries a **link** to the hosted
  report card (no attachment, better deliverability); n8n attribution is off.

## Running a wave (how Claude Code drives it)

1. You give a brief: `{ industry, geo, target, batch_cap, mode, sender_name,
   sender_email, company_address, ... }`.
2. Claude Code discovers + audits + writes per lead (prompts/), assembling a
   `wave.json` of qualified leads. For `send` mode it first uploads each PDF to a host
   and sets `report_url`.
3. `node src/runWave.js wave.json` renders PDFs + delivery payloads, enforces the
   daily cap + dedup, and logs the ledger.
4. For each `out/*.delivery.json`, Claude Code calls the n8n delivery workflow
   (`sWZvE2db8q7bmatR`, webhook input = the payload) → a draft or a send.
5. Repeat in batches until `node src/ledger.js count` shows the target.

## Scale note (100+)
The `draft` payload carries the PDF as base64. The `send` path links to a hosted PDF
instead (no base64), which also keeps the orchestration light at volume.

## AgentMail delivery (yardworx sender) — optional, preferred for sending
Instead of the n8n Gmail node, sending can go through **AgentMail** from a
`@yardworx.tech` identity. Claude Code calls AgentMail directly, so n8n isn't needed
for delivery. `src/toAgentMail.js` maps a `delivery.json` into the AgentMail tool args
(first touch: HTML body + report link, no attachment; reply: PDF attached).

One-time setup (you):
1. In AgentMail, **add + verify the `yardworx.tech` domain** (publish the MX/SPF/DKIM/
   DMARC records it gives you — this also covers most of `DELIVERABILITY.md` Phase 0).
2. Claude Code then creates the inbox `zach@yardworx.tech` and sends per lead.

Status: AgentMail org is connected, but `yardworx.tech` is **not yet added** (create
returns "Domain not found") and there are 0 inboxes — so this path is ready in code but
waiting on domain verification.

## CRM sync (Attio)
Each AUDIT lead can be pushed into Attio: a company record (name + domain), optional
custom fields (grade / score / status / report link), and a **Note** with the full
rundown (`src/rundown.js`). `src/runWave.js` does this automatically when
`ATTIO_API_KEY` is set; or run `node src/attio.js <lead.json>` for one lead.

Setup:
1. `export ATTIO_API_KEY=...` (Attio → Settings → Developers → API key).
2. Defaults: object `companies`, dedupe on `domains`. Override with `ATTIO_OBJECT`,
   `ATTIO_MATCH_ATTR`.
3. To populate custom fields, map our keys → your attribute slugs:
   `export ATTIO_FIELDS_JSON='{"grade":"gaelworx_grade","score":"gaelworx_score","status":"lead_status","report":"report_url"}'`
   (omit any you don't have — the rundown Note is written regardless, so it works on a
   stock Attio workspace with no custom attributes).

Note: there is no Attio MCP connector in this session; this module talks to the Attio
REST API directly and needs the key above.
