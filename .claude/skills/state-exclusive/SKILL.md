---
name: state-exclusive
description: >-
  Workflow D — the one-per-state play. One flagship template site per vertical;
  each prospect sees it REBRANDED with their own name, reviews, and photos;
  the website is sold once per state (standard contract + state-exclusivity),
  first-come. Use when asked to "run state-exclusive", "sell the state site",
  or to pitch the exclusive vertical template into a new state.
---

# Workflow D — state-exclusive (one site, one state, one buyer)

The product: a flagship, best-in-vertical website template. The offer: **we
sell the website once per state** — standard site-sale contract otherwise,
with a state+vertical exclusivity clause. When a state sells, it's closed.

## Kickoff brief
`/state-exclusive <vertical> | <state> | [price] | [target prospects=10]`
e.g. `/state-exclusive pool service | FL | $4,500`
First vertical: **pools** (Zach's call — we already hold the market data,
review language, and pain patterns). Price is set at kickoff.

## Decided parameters (Zach, Jul 2026 — don't re-ask)
- **Model:** one-time website sale, once per state per vertical. Standard
  contract + exclusivity clause. No recurring implied (upsells welcome later).
- **Buyer ICP:** ambitious owner-operators — the same small shops from A/B,
  specifically the ones showing growth appetite (rising review velocity,
  service-area breadth, "we're hiring", multiple trucks in photos).
- **Pitch artifact:** a **rebranded demo per prospect** — the flagship
  template deployed with THEIR name, THEIR reviews, THEIR owner photos at
  `gw-<st>-<slug>.vercel.app`. Scarcity line: *"One {vertical} company per
  state gets this site. When {state} is claimed, it's gone."*
- Preview-safe policy applies to every demo (noindex, preview footer, owner
  photos only, 30-day expiry, unpublish losers when the state sells).

## One-time per vertical: the flagship
1. Build `templates/state-<vertical>/` with the **`front-end-design`** skill
   (Zach's claude.ai skill; fall back to spec-site conventions if absent) —
   the best site in the vertical: conversion-tuned, mobile-first, review wall,
   tap-to-call, service-area architecture, AI-readable (schema/FAQ).
2. **Zach approves the flagship once** before any state is pitched.

## State registry (the source of truth)
`data/state-claims.jsonl` — one row per (vertical, state):
`{"vertical":"pool service","state":"FL","status":"OPEN|PITCHING|SOLD","buyer":null,"price":null,"demos":["gw-fl-..."],"date":null}`
Always read before a run; a SOLD state is never pitched again.

## Steps (per run)
1. Registry check → state OPEN? Mark PITCHING.
2. **Prospect** ~2× target with Nimble across the state's major metros;
   rank by ambition signals (review velocity, breadth, hiring, fleet photos).
   Both has-site and no-site businesses qualify — the offer replaces whatever
   they have. Dedup vs ledger/Attio/registry demos.
3. **GBP harvest** each finalist (photos, review pull-quotes/good press,
   services, owner names via Sunbiz/reply signatures — same harvest spec as
   the other workflows).
4. **Rebranded demo** per finalist: flagship template + their harvest data →
   deploy `gw-<st>-<slug>.vercel.app` (preview-safe). Track visits via
   `?src=` params — a prospect who keeps returning is your first call.
5. **Outreach:** phone-first (owner-operators answer). Email/text artifact:
   subject `Built this for {Business} — one {vertical} site per state`,
   demo link + the scarcity line + price. CALL queue in Attio for the rest,
   tagged `state-exclusive · {ST}`, tasks carry the call windows.
6. **On sale:** registry → SOLD (buyer, price, date) · unpublish every other
   demo in that state · deliver: deploy the site to the buyer's domain,
   standard contract + exclusivity clause, hand-off note in Attio. On no sale
   after the demo-expiry window: registry back to OPEN, demos unpublished,
   learnings noted.
7. **Summary:** state, prospects pitched, demo links, visits, calls queued,
   registry status.

## Guardrails
- Exclusivity is real: registry is checked and honored on every run — never
  pitch a SOLD state, never leave two live "yours exclusively" demos post-sale.
- All shared rules: never fabricate; owner photos only; MCP-only scraping;
  Attio search-before-create; durable staging; takedown-on-request.
- Don't quote the price on the first cold call — demo first, price on the
  callback (per the outreach research).
