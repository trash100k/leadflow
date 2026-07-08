# HANDOFF — read this first

The shortest path that **actually works today**, validated end-to-end. Everything
here runs from Claude Code with the MCP tools already connected — **zero new
credentials, no n8n, no Gmail OAuth, no yardworx domain.**

If you're picking this up fresh: read this file, then `.claude/skills/gaelworx-prospecting/SKILL.md`
for the per-lead audit detail. `README.md` documents an older, heavier delivery path
(n8n Gmail draft + base64 PDF) — **ignore it for delivery**; it's superseded by the
AgentMail + GitHub-raw flow below.

---

## TL;DR — the whole loop, no setup required

```
discover → verify+scrape → score+route → audit.json → render PDF
        → host PDF (git raw URL) → deliver (AgentMail) → Attio → ledger
```

Two things make this frictionless and were **proven live** this session:

1. **Delivery = AgentMail, sends right now.** Inbox `zach-gaelworx@agentmail.to`
   (2 others also live). `mcp__AgentMail__send_message` returns a real SES message id.
   No domain verification needed for testing/low volume — `agentmail.to` is the
   default sending domain.
2. **PDF hosting = commit to `reports/`, link the GitHub raw URL.** Confirmed
   `HTTP 200`. This is how a PDF reaches an email or an Attio record — **by URL**,
   never as a base64 attachment (see dead ends).

---

## The shortest validated path (per lead)

```bash
# 1–4. Discover / verify / score / write audit.json  → see SKILL.md steps 1–5
#      (Nimble+Exa discover, Nimble extract + python regex probe, honest scores,
#       real email, route AUDIT|PITCH_OTHER|SKIP). Output: out/<slug>.lead.json

# 5. Render the branded PDF (official kit; never edit render_report.py)
node src/prepare.js out/<slug>.lead.json      # -> out/<slug>.audit.json + out/<slug>.pdf + delivery.json

# 6. Host it — one commit hosts many
cp out/<slug>.pdf reports/<slug>.pdf
git add -f reports/<slug>.pdf && git commit -m "Publish <slug> report card" && git push
RAW="https://raw.githubusercontent.com/trash100k/leadflow/claude/n8n-email-pdf-workflow-8qsge5/reports/<slug>.pdf"
curl -sI "$RAW" | head -1     # expect: HTTP/2 200

# 7. Deliver via AgentMail  (mcp__AgentMail__send_message)
#    FIRST TOUCH: html body + link to $RAW, NO attachment (deliverability).
#    ON REPLY:    attachments:[{ url: $RAW, filename: "<slug>.pdf" }]  — attach by URL.

# 8. Attio (mcp__Attio__*): upsert company + person, create-note (rundown + [PDF](RAW)), create-task.
node scripts/attio-prep.js out/<slug> <email> AUDIT   # generates the description + note markdown

# 9. Ledger (dedup + cap)
node src/ledger.js seen "<url>" "<name>"              # check BEFORE auditing
node src/ledger.js add '{"status":"DONE","business":"<name>","url":"<url>","email":"<email>","grade":"<g>"}'
node src/ledger.js count                              # progress toward target
```

Batch: fan out **one subagent per candidate** (Agent tool, general-purpose, parallel)
for steps 1–4, then render/host/Attio/ledger centrally. Over-pull ≥1.5× the target
since some route PITCH_OTHER/SKIP.

---

## Proven working (exact mechanisms)

| Capability | How | Status |
|---|---|---|
| Send email | `mcp__AgentMail__send_message`, `inboxId: zach-gaelworx@agentmail.to` | ✅ SES msg id returned |
| Inline report card | full report-card HTML as the `html` body | ✅ renders in Gmail (good for tests/preview) |
| Attach the PDF | `attachments:[{ url: <raw github url> }]` | ✅ URL-attach is the way |
| Host the PDF | commit to `reports/`, use `raw.githubusercontent.com/...` | ✅ HTTP 200 |
| Render PDF | `node src/prepare.js <lead.json>` → official kit (Chromium) | ✅ 5-page branded PDF |
| CRM | `mcp__Attio__*` (workspace GaelWorx) — company/person/note/task | ✅ no API key needed |
| Dedup/ledger | `node src/ledger.js seen|add|count|today` | ✅ |

---

## Dead ends — do NOT retry (each cost real time)

- **Base64 PDF as an MCP attachment.** The PDF (~356 KB) → ~484 KB base64 is too
  large to pass as a tool parameter, and the Read tool can't load it back (256 KB
  cap + long-line truncation). **Always attach by URL.**
- **Calling MCP servers from an external Node script** (`gw-mcp-upload.mjs` etc.).
  The CCR proxy auth is bound to the Claude Code session; an external process gets
  `authentication required`. Call MCP tools directly, in-session only. (Scripts removed.)
- **n8n Gmail delivery.** The workflow exists but needs a Gmail OAuth2 credential
  that was never attached. AgentMail replaces it entirely — don't chase the n8n path.
- **yardworx.tech domain.** Not verified. **Not needed** — send from `agentmail.to`.
- **Editing `audit-kit/.../render_report.py`.** It's the source of truth for layout,
  charts, grade/avg math. Only ever produce a valid `audit.json`.

---

## Key constants

- **Repo:** `trash100k/leadflow` · **branch:** `claude/n8n-email-pdf-workflow-8qsge5`
  (update raw URLs to `main` after merge).
- **AgentMail inboxes (all live, all send now):** `zach-gaelworx@agentmail.to`
  (primary, "Zach · GAELWORX"), `gaelworx@agentmail.to`, `gaelworx-outreach@agentmail.to`.
  Always set **Reply-To `zach@gaelworx.com`** so replies land in the real Gmail.
- **Attio:** workspace GaelWorx · Zach member id `e40f1558-3a31-48a1-b15d-784299e0d97f`.
- **Sender identity:** Zach / GAELWORX / zach@gaelworx.com / (369) 212-1203.
- **Never fabricate** a score, review, competitor, stat, or email — observe via tools or skip.

---

## Where we left off / next actions

- **Solar (Tampa) run in progress.** Published report cards live in `reports/`:
  florida-power-services, solarwise-energy, coast-to-coast-solar (+ Tulsa landscaper
  canary). Ledger: `node src/ledger.js count`.
- **Before any cold *send* at volume:** complete `DELIVERABILITY.md` Phase 0
  (SPF/DKIM/DMARC on a sending subdomain, warm-up, verification). Low-volume tests
  from `agentmail.to` are fine now.
- **Next:** finish the Tampa AUDIT leads → host → Attio → draft first-touch emails
  (link-first, no attachment) → review before sending.
