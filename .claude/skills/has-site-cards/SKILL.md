---
name: has-site-cards
description: >-
  Workflow A — find local businesses WITH websites in an ICP, grade each site,
  render the GAELWORX 4-page report card, and run outreach (auto-email with
  inbox rotation when an email exists, Attio CALL queue when not). Use when
  asked to "run has-site-cards", "run the report-card wave", or to prospect
  an ICP of businesses that already have websites.
---

# Workflow A — has-site-cards

One batch: discover → qualify → audit → render card → deliver → CRM → ledger.

## Kickoff brief (all runs take one)
`/has-site-cards <vertical> | <metro, ST> | [target/day] | [filter overrides]`
e.g. `/has-site-cards pool service | Tampa Bay, FL | 50`
Defaults: target **50 qualified/day** · filter **owner-operator** (reviews <~60,
namesake/initials/family names, single location, FB-page-or-real-site). The
filter is overridable in the brief ("any size", "50-500 reviews", etc.).

## Decided parameters (Zach, Jul 2026 — don't re-ask)
- **Cadence:** scheduled daily (see Scheduling below). Also callable manually.
- **Batch:** 50 qualified leads/run.
- **Auto-email: ON with inbox rotation.** When a real email is found, send the
  card automatically via AgentMail, ≤15 sends/inbox/day, rotating across an
  inbox pool sized `ceil(planned_sends/15)` (create `gaelworx-oN@agentmail.to`
  inboxes with `create_inbox` as needed; `zach-gaelworx@agentmail.to` is #1).
  Always `Reply-To: zach@gaelworx.com`. Kill switch: pause ALL sends if
  bounce >2% or complaints >0.1% (domain reputation is shared across inboxes —
  rotation spreads caps, not risk).
- No email found → Attio company flagged **📞 CALL** (best windows 7–8:30am /
  4:30–6pm Tue–Thu) with the card link in the note.

## Steps (per run)
1. **Discover** `mcp__Nimble__nimble_search` (focus "location") over the metro;
   over-pull 2×. Capture name/phone/rating/reviews/address/website. Exclude
   directories, chains, out-of-market (verify area code — the "Kelly's TX" rule).
2. **Route**: keep only leads whose `website` is a real, live, self-identifying
   business domain (FB-only/dead/none → hand to no-site-builder or skip).
3. **Dedup** BEFORE any work: `node src/ledger.js seen "<url>" "<name>"` +
   Attio `search-records`. Skip seen.
4. **Per lead** (subagent fan-out fine, ~10 at a time):
   a. Scrape homepage+contact via `mcp__Exa__web_fetch_exa` or Nimble extract
      (MCP only — Bash curl is proxy-blocked for external sites).
   a2. **GBP harvest (every lead, every workflow):** Nimble extract the Google
      Maps place page → save `out/<slug>/gbp.json`: rating, review count,
      hours, services/attributes, booking links, **best review pull-quotes
      verbatim** (the good press — short lines with first names, e.g.
      “Best pool service in the area — Megan T.”), owner-reply signatures
      (owner names!), and **photo URLs with attribution** — download
      owner-uploaded photos to `out/<slug>/photos/` (owner-uploaded ONLY;
      customer/Street View photos are other people’s copyright). This feeds
      the report card (real quotes in pain/strength lines) AND any site build.
   b. Write `out/<slug>.audit.json` — scores (10 dims, honest 1–10), flags,
      **costing = exactly 3 pains in plain owner language** (see
      `prompts/audit-rubric.md` § Pain-point copy: money/customer consequence
      first, zero jargon in the first sentence), plan = 4 steps (2 near/2 later).
      Capture a real email if one exists (contact page, mailto). Never invent.
   c. Render: `node src/reportCardV2.js out/<slug>.audit.json out/<slug>-card.pdf`
   d. Host: `cp` to `reports/`, `git add -f && commit && push` →
      `https://raw.githubusercontent.com/trash100k/leadflow/<branch>/reports/<slug>-card.pdf`
      (one commit can host the whole batch — do it once at the end).
   e. Deliver: email found → AgentMail `send_message` from the next rotation
      inbox — subject `Your website's report card — {grade}`, short plain body,
      ONE link (the card), no attachment, CAN-SPAM footer. No email → CALL flag.
   f. CRM: Attio REST when `ATTIO_API_KEY` is set (`src/attio.js` pattern);
      else MCP `search-records`→`create-record` (NEVER `upsert-record`; a
      timeout may still have written — re-search before retrying).
   g. Ledger: `node src/ledger.js add '{"status":"SENT|CALL_QUEUED",...}'` and
      append to `data/<vertical>-leads.jsonl` (the durable queue — survives
      connector flaps; use status `PENDING_ATTIO` when the CRM is down).
5. **Exhaustion:** metro dry → auto-expand to adjacent metros in the same
   state; note the move in the ledger + run summary.
6. **Summary:** counts (discovered/qualified/sent/queued), hot flags, inbox
   usage, link list. Commit artifacts.

## Scheduling (optional)
`CronCreate` daily (e.g. 9:00 ET) with prompt
`/has-site-cards <same brief>` — but note: **mega-flow is the intended daily
job**; schedule this alone only for a has-site-only campaign.

## Guardrails
- Never fabricate scores/reviews/stats/emails. Unverified email = CALL path.
- New ICP? mega-flow's first-10 review gate applies here too when run standalone.
- Hot-flag rule stands: Irish/Gaelic-named businesses get `hot: true` + note.
