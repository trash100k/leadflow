---
name: mega-flow
description: >-
  Workflow C — THE daily job. One discovery sweep over an ICP, router splits
  leads into has-site (report card outreach) and no-site (site build + mini
  card) tracks, shared CRM/ledger/summary. Use when asked to "run mega-flow",
  "run the daily wave", or to prospect an ICP end-to-end covering both
  businesses with and without websites.
---

# Workflow C — mega-flow (the daily 50)

One run = one metro sweep → router → Workflow A track + Workflow B track →
one summary. A and B stay callable standalone; **this is the one you schedule.**

## Kickoff brief
`/mega-flow <vertical> | <metro, ST> | [target/day=50] | [overrides]`
e.g. `/mega-flow pool service | Tampa Bay, FL | 50`

## Decided parameters (Zach, Jul 2026 — don't re-ask)
- **Daily target:** 50 qualified leads/run (across both tracks combined).
- **Router:** GBP `website` field + a `"{name}" {city}` verification search —
  real live self-ID domain → **A track** (`has-site-cards` steps) ·
  none/FB-only/Google-sites/dead → **B track** (`no-site-builder` steps) ·
  directory/chain/out-of-market → SKIP (ledger).
- **GBP harvest runs for EVERY lead before routing** (photos, review
  pull-quotes/good press, hours, services, owner signatures →
  `out/<slug>/gbp.json` + `photos/`). Cards quote it; sites are built from it.
- **NO_SITE deliverable:** live spec site + mini presence card (both links).
- **Exhaustion:** metro dry → auto-expand to adjacent metros, same state;
  ledger + summary note the move.
- **First-10 gate (once per NEW ICP/vertical):** the first run processes 10
  leads and **sends nothing** — cards, sites, and draft emails go to Zach as a
  review bundle. On his 👍, record the ICP in `data/icp-approvals.json` and
  every later run is fully autonomous. (Check that file at the start of every
  run.)
- **Sending:** Workflow A's rules — auto-email on verified address, AgentMail
  inbox rotation ≤15/inbox/day, pool sized to the day's sends, Reply-To
  zach@gaelworx.com, kill switch at bounce >2% / complaints >0.1%. Everything
  else → 📞 CALL queue in Attio.

## Steps (per run)
1. Read `data/icp-approvals.json` → gated or autonomous?
2. **Sweep:** Nimble location search over the metro, over-pull 2×; apply the
   ICP filter (default owner-operator); dedup (ledger + Attio) before work.
3. **Harvest + route** each survivor (subagent fan-out, ~10 concurrent):
   GBP harvest → router → run the lead down its track using the sibling
   skill's per-lead steps verbatim (`has-site-cards` §4 / `no-site-builder`
   §3–8). Do NOT re-document them here — the sibling skills are the spec.
4. **Batch close-out:** one hosting commit (`reports/` PDFs), Attio pushes
   (REST preferred; `PENDING_ATTIO` staging when down), ledger rows, expiry
   sweep for old previews (B §10).
5. **Summary** (to chat + Attio note "Daily wave — {date}"): discovered /
   qualified / A-track sent + queued / B-track sites built + sent + queued /
   hot flags / inbox usage / metro moves / anything PENDING.

## Scheduling (this is the one)
Create the daily trigger once per campaign:
`CronCreate` — schedule e.g. `0 9 * * *` (9am ET), prompt:
`/mega-flow pool service | Tampa Bay, FL | 50`
Pause/adjust with CronList/CronDelete. One cron per active ICP campaign.

## Guardrails
- All shared rules apply: never fabricate; MCP-only scraping; search-before-
  create in Attio (never upsert-record; a timeout may have written); durable
  staging in `data/<vertical>-leads.jsonl`; preview-safe site policy;
  owner-photos only; kill switch on deliverability.
- The first-10 gate is per ICP, not per session — trust the approvals file.
