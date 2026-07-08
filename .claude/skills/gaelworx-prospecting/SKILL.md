---
name: gaelworx-prospecting
description: >-
  Run the GAELWORX cold-outreach prospecting pipeline for local service
  businesses (default: landscapers). Discover real leads, audit each website in
  the official GAELWORX audit-kit schema, render a branded 5-page PDF report card,
  host it, and load each lead into Attio (company + contact + rundown note + task);
  optionally draft via AgentMail. Use when asked to find leads, run an audit
  batch / wave / canary, generate report cards, or push prospects into the CRM.
---

# GAELWORX Prospecting Pipeline

> **Start with `HANDOFF.md` at the repo root** — it's the shortest validated path
> (AgentMail sends now, PDFs host via GitHub-raw, no n8n/Gmail-OAuth/yardworx) plus
> the dead ends not to retry. This skill has the per-lead audit detail.

## Campaign goal
Sell **dirt-cheap web design** to local landscapers as the wedge, and onboard them
to the **yardworx (yrdwrx)** app. The free website **audit report card** is the
door-opener and the credibility piece; the redesign is the conversion; yardworx is
the product they end up using.

## Core principle
**Never fabricate** a score, review, competitor, statistic, or email. Observe every
fact via tools. Better to skip a lead than audit the wrong site or invent a finding.

## One-time environment setup
```bash
cd /home/user/leadflow
npm install                       # playwright-core (ad-hoc node renders)
pip install playwright==1.55.0    # for the official kit renderer
# Chromium is pre-installed at /opt/pw-browsers (build 1194); py-playwright 1.55
# expects 1187 — symlink once so render_report.py Tier-1 (chromium) works:
ln -sfn /opt/pw-browsers/chromium-1194 /opt/pw-browsers/chromium-1187
ln -sfn /opt/pw-browsers/chromium_headless_shell-1194 /opt/pw-browsers/chromium_headless_shell-1187
# verify: python3 audit-kit/gaelworx_audit_kit/render_report.py \
#           audit-kit/gaelworx_audit_kit/example_audit.json out/example.pdf  # -> "rendered (chromium)"
```

## The audit kit is the source of truth
`audit-kit/gaelworx_audit_kit/` — **never edit `render_report.py`**. Read
`audit_schema.json` + `AGENT_PROMPT.md`; copy the shape of `example_audit.json`.
The kit owns layout, charts, branding, grade/average/AI-% math, and pagination. The
agent's only creative output is a valid `audit.json`.

## Per-lead pipeline

**1. Discover** (over-pull ≥1.5×N) with Nimble + Exa:
`mcp__Nimble__nimble_search` (focus "location", e.g. "landscaping company Tulsa Oklahoma")
and/or `mcp__Exa__web_search_exa`. Capture name, declared website, phone, Google
rating, review count. **Exclude** directories/aggregators (yelp, angi, houzz,
thumbtack, porch, facebook, bbb, nextdoor, *chamber*) and national chains.

**2. Resolve + verify the real site.** Prefer the GBP website. Verify: self-ID
(title/H1 names the business), domain match, not a directory, reachable. Else SKIP.

**3. Scrape** homepage + contact page with `mcp__Nimble__nimble_extract`
(`output_format: simplified_html`). Extracts are large and saved to a file — **do
not read the whole thing**; probe with python regex (viewport, `tel:`, `mailto:`,
emails, JSON-LD, og, h1/h2, `<img>` alt, forms, builder fingerprint, title, meta).

**4. Score 1–10 + route.**
- VERIFIED from observation (feed the radar): `design`, `mobile`, `tech_seo`, `cro`.
- Reasoned (bar grid only): `local_seo`, `content_eeat`, `aeo`, `geo`, `agentic`, `accessibility`.
- Do NOT set grade/avg/AI-% (renderer computes). Flags auto: `AGENT-BLIND` agentic≤3,
  `AI-INVISIBLE` aeo+geo≤5, `A11Y-RISK` accessibility≤4, `NO-LOCAL` local_seo≤3.
- Route: **AUDIT** (real but weak → full report + outreach), **PITCH_OTHER**
  (already strong → log, different-service angle, no teardown), **SKIP**
  (dead/fake/directory/unreachable/no contact).
- Capture a **real** contact email; if none → `manual_contact: true`.

**5. Write `audit.json`** matching the schema: meta, business, scores(10), flags,
working(2–3), costing(3–4, most valuable first), ai_blind_spot{paragraphs,probe},
agentic{paragraphs,probe}, local{rating+reviews REAL}, competitors(2–3 real from the
discovery pool + the target `you:true`), accessibility{probe,note}, plan(exactly 4),
bottom_line(exactly 3 sentences). Pick 2–3 REAL competitors with real GBP ratings.

**6. Render.** `node src/prepare.js out/<slug>.lead.json` (writes audit.json + PDF +
delivery.json via the kit), or directly
`python3 audit-kit/gaelworx_audit_kit/render_report.py audit.json out/<slug>.pdf`.

**7. Host** (so Attio/AgentMail can link the PDF):
```bash
cp out/<slug>.pdf reports/<slug>.pdf && git add -f reports/<slug>.pdf
git commit -m "Publish <slug> report card" && git push
# raw URL: https://raw.githubusercontent.com/trash100k/leadflow/<BRANCH>/reports/<slug>.pdf
```
(Confirm reachable: `curl -sI <raw_url>` → 200. Note: branch is currently
`claude/n8n-email-pdf-workflow-8qsge5`; update to `main` after merge.)

**8. Push to Attio** (workspace GaelWorx; via `mcp__Attio__*`):
- `upsert-record` object `companies`, matching `domains` → {name, domains:[domain],
  description: "GAELWORX audit: <grade> (<avg>/10) · <route> · <geo> <industry>. Flags… Report: <raw_url>"}. Keep the returned `record_id`.
- `upsert-record` object `people`, matching `email_addresses` → {email_addresses:[email],
  company:[{target_object:"companies", target_record_id:<id>}]}. (Skip if manual_contact.)
- `create-note` parent companies/<id>, title "GAELWORX Website Audit — <grade> (<avg>/10)",
  markdown body with scorecard, flags, top costing items, bottom line, and a
  **[Report card (PDF)](<raw_url>)** link. Use `node scripts/attio-prep.js <fileBase> <email> <route>`
  to generate the description + note markdown straight from the rendered audit.json.
- `create-task` linked to companies/<id>, assignee `e40f1558-3a31-48a1-b15d-784299e0d97f`
  (Zach): "Review GAELWORX audit (<grade>) + send outreach to <name> — <one-line angle>."

**9. Ledger** (dedup + cap): `node src/ledger.js add '{"session_id":...,"status":"DONE|PITCH_OTHER|SKIP|MANUAL_CONTACT","business":...,"url":...,"email":...,"grade":...}'`.
Dedup before auditing: `node src/ledger.js seen <url> "<name>"`. Daily cap helper:
`node src/ledger.js today`.

## Batch / wave pattern (recommended for N>2)
1. Discover the candidate pool (over-pull).
2. Fan out **one subagent per candidate** (Agent tool, general-purpose, in parallel)
   — each reads the schema, scrapes via Nimble, scores honestly, finds the email,
   routes, and writes `out/<slug>.audit.json` + `out/<slug>.lead.json`, returning a
   compact `{slug,name,url,route,email,manual_contact,avg_estimate,one_line_finding}`.
3. Centrally: render each AUDIT lead (`src/prepare.js`), host the PDFs (one commit),
   then push all to Attio (companies → people → notes → tasks), then ledger rows.
Keep going / over-pull until the AUDIT count hits the target (some route PITCH/SKIP).

## Email strategy (when you draft/send)
- **First touch: do NOT attach the PDF.** Cold attachments tank deliverability and
  give away the asset. Lead with the single most concrete finding, tease the report
  card, one low-friction question. Link-first at most; ideally plain text.
- **Attach the report card on reply** (warm thread) — the PDF carries the GAELWORX
  pitch + booking link, funneling to the cheap redesign → yardworx.
- Per email: one link max, light HTML, no spam-trigger words, CAN-SPAM footer
  (physical address + opt-out). See `DELIVERABILITY.md`.

## Delivery channels
- **Attio (primary for this campaign):** report card lives as a link on the record +
  rundown note (Attio holds links, not embedded PDFs). Done via MCP, no API key.
- **AgentMail (sends NOW, no setup):** primary inbox `zach-gaelworx@agentmail.to`
  (also `gaelworx@agentmail.to`, `gaelworx-outreach@agentmail.to`). `send_message`
  returns a real SES message id — the `agentmail.to` default domain works for
  testing/low volume; verify a sending subdomain only for real cold volume (see
  DELIVERABILITY.md). Always set **Reply-To `zach@gaelworx.com`**. Attach the PDF
  **by URL** (`attachments:[{url:<raw_url>,filename}]`) — never inline base64 (too
  large to pass as a tool param) and never upload lead data to public/anonymous hosts.
- **n8n** `GAELWORX Delivery` (`sWZvE2db8q7bmatR`): draft|send routing if Gmail OAuth
  is attached. Optional; Attio + AgentMail cover this campaign.

## Solar variant — runs FROM CLAUDE CODE (no n8n creds)
**This pipeline runs from here, not inside n8n.** Do NOT put auths in n8n. The n8n
board **`HTmsHJ7MhuyYGOXq`** ("GAELWORX Solar Runbook (Claude-run)") is just the
**visual checklist** — each node is a step, its sticky names the MCP tool you
already have + how to use it. Walk it node by node: do the step with your tool,
**check it off (TaskCreate todo), move to the next node.** See `n8n/solar-audit-wedge.md`.
(The earlier credentialed board `4gJ6e1tulxMzvgVo` is archived — it needed creds.)

Same wedge (good reviews + weak site → free audit offer), scoped to solar with
deeper **research layers** (financing, NABCEP/license, service-area, panel brands,
review themes) added at the research step. **No PDF at first touch** — the report
card renders on REPLY.

**First-touch CTA = trust via mailto to your Gmail.** No cold attachment, no raw
Drive/GitHub link. Use `src/emailTemplate.js` `cta_mailto: "zach@gaelworx.com"`
(+ `cta_label: "Send me my report"`) → a pre-filled mailto button that opens the
prospect's own mail client addressed to your real Workspace address. Always set
**Reply-To `zach@gaelworx.com`** on the AgentMail draft so a plain reply also lands
in your Gmail. Secondary CTA: Google Calendar link; hot leads: a personalized Loom.

## Key constants
- Repo: `trash100k/leadflow` · Attio workspace: GaelWorx · Zach member id:
  `e40f1558-3a31-48a1-b15d-784299e0d97f` · AgentMail primary inbox:
  `zach-gaelworx@agentmail.to` (Reply-To `zach@gaelworx.com`).
- Brief defaults: sender Zach / GAELWORX / zach@gaelworx.com; mode `draft` until
  deliverability Phase 0 is done.
