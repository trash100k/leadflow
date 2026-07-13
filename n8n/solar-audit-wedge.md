# n8n board: GAELWORX Solar Runbook (Claude-run)

**Canonical board:** `HTmsHJ7MhuyYGOXq` — "GAELWORX Solar Runbook (Claude-run)" ·
https://gaelworx.app.n8n.cloud/workflow/HTmsHJ7MhuyYGOXq

**Runs from Claude Code, not n8n.** No credentials live in n8n. The board is a
**visual checklist**: each node is a step, sticky notes name the MCP tool the model
already has + how to use it. The model does the step, checks it off, moves to the
next node. (Use the TaskCreate todo list to track the check-offs.)

> The earlier credentialed auto-executing board (`4gJ6e1tulxMzvgVo`,
> "GAELWORX Solar Audit Wedge") is **archived** — it required n8n creds, which we
> don't use. Kept only as a reference shape.

## The steps (each = a tool the model runs)
1. **Brief** — solar installers + metro + target N.
2. **Discover** — `mcp__Nimble__nimble_search` (focus location) + `mcp__Exa__web_search_exa`, over-pull ~3×; exclude directories/chains.
3. **Dedup** — `node src/ledger.js seen <url> "<name>"` + `mcp__Attio__search-records` (companies by domain).
4. **Research** — `mcp__Nimble__nimble_extract` (homepage + contact, simplified_html); probe the saved file with python. Solar layers: financing, NABCEP/license, service-area, panel brands, review themes.
5. **Filter** — keep good reviews (≥4.5 / ≥25) + weak site; route AUDIT / PITCH_OTHER / SKIP. Never fabricate.
6. **Write email (Sonnet)** — thoughtful first-touch, lead with the one concrete finding, **no PDF**.
7. **Draft** — `mcp__AgentMail__create_draft` from `gaelworx@agentmail.to`; **Reply-To `zach@gaelworx.com`**; no attachment.
8. **CRM** — `mcp__Attio__upsert-record` companies + people; `create-note` (rundown); `create-task` (Zach `e40f1558-…`).
9. **Ledger** — `node src/ledger.js add <json>`.
10. **On reply** — render the report card via the kit (`node src/prepare.js` / `render_report.py`) → host → attach the PDF in the now-warm thread.

## First-touch CTA (trust = mailto to your Gmail)
No PDF cold. Primary CTA is a **pre-filled mailto button to `zach@gaelworx.com`**
(opens their own mail client to your real address — no third-party domain, no
tracker). `src/emailTemplate.js` renders it via `cta_mailto` + `cta_label`
(default "Send me my report"). Always set **Reply-To `zach@gaelworx.com`** so a
plain reply also lands in your Gmail. Secondary: Google Calendar link; for hot
leads, a personalized Loom. Avoid raw Drive/GitHub links in cold mail.
