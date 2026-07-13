---
name: report-card
description: >-
  Generate the GAELWORX 4-page outreach report card PDF for a business website
  and send it into chat. Use when the user says "/report-card <url>", "make a
  report card for <site>", or "audit <site> for the report card". Fast path:
  one lead, one PDF, delivered in-chat for the user to text over themselves.
---

# /report-card — one URL in, branded PDF in chat

Input: a website URL, optionally a business name (`/report-card chlorinecowboy.com Chlorine Cowboy`).
Output: `out/<slug>-card.pdf` sent into chat via SendUserFile.

## Steps

1. **Parse** the URL (add `https://` if missing) and derive `slug` from the
   domain (`chlorinecowboy.com` → `chlorine-cowboy` or just the domain body).

2. **Scrape the site — MCP tools only.** `mcp__Exa__web_fetch_exa` (batch
   homepage + `/contact` in one call) or `mcp__Nimble__nimble_extract`
   (`output_format: simplified_html`). **Never curl/Bash for external sites**
   — the egress proxy 403s arbitrary hosts; only the MCP fetchers work.
   If both fail, tell the user the site is unreachable and offer to build the
   card from pain points they type (the manual artifact flow).

3. **Optional grounding:** one `mcp__Exa__web_search_exa` for
   `"<business>" <city> reviews` if rating/review facts would strengthen a
   pain point. Facts only — **never fabricate** a review count, competitor,
   or statistic (repo rule).

4. **Write `out/<slug>.audit.json`** (the reportCardV2 shape — a subset of the
   kit schema):
   ```json
   {
     "business": { "name": "...", "url": "domain.com" },
     "meta": { "ref": "SLUG-YYYYMMDD", "date": "13 Jul 2026" },
     "scores": { "design": 5, "mobile": 5, "tech_seo": 5, "local_seo": 5,
                 "content_eeat": 5, "aeo": 3, "geo": 3, "agentic": 2,
                 "accessibility": 5, "cro": 5 },
     "flags": [],
     "costing": [ { "title": "...", "detail": "..." } ],
     "plan": [ { "title": "...", "phase": "near" } ]
   }
   ```
   - **scores**: 10 honest ints 1–10 from what you observed (most small-biz
     sites land 4–7). Flags only if true: `AGENT-BLIND` agentic≤3,
     `AI-INVISIBLE` aeo+geo≤5, `A11Y-RISK` accessibility≤4, `NO-LOCAL` local_seo≤3.
   - **costing = EXACTLY 3, plain owner language** (this drives page 1 —
     see `prompts/audit-rubric.md` § Pain-point copy): title = the pain with
     the customer/money consequence first, NO jargon (no schema/JSON-LD/meta/
     H1/LCP up front). Detail = 1–2 plain sentences, cost first, tech last.
   - **plan = EXACTLY 4** short fix steps; first two `"near"`, last two `"later"`.

5. **Render:** `node src/reportCardV2.js out/<slug>.audit.json out/<slug>-card.pdf`
   (fonts + coin are embedded in the renderer; output is the mobile-first
   4-pager: Bleed → Fix → Leaks → Forge).

6. **Deliver into chat:** `SendUserFile` with `out/<slug>-card.pdf`,
   caption = business name + grade + the one-line top pain. `status: normal`.

7. Only if the user asks: host it (`cp` to `reports/` + commit/push for a raw
   URL), log a ledger row, or push the lead to Attio.

## Guardrails
- Never fabricate scores, reviews, competitors, or stats. Unobserved ≠ bad —
  score from evidence, skip claims you can't see.
- Keep the whole run tight: scrape → audit.json → render → send. No Attio, no
  email, no hosting unless asked.
