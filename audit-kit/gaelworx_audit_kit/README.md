# GAELWORX Site-Audit Agent Kit

This kit lets a managed agent produce a branded, 5-page PDF site-audit report
for any local business. **The agent's only job is to gather data and write one
JSON file. This kit does all the layout, charts, branding, and PDF rendering.**

## Files

| File | What it is | Does the agent edit it? |
|------|-----------|-------------------------|
| `render_report.py` | The renderer. Takes an audit JSON + emits a print-ready A4 PDF (and .html). Holds all layout, charts, GAELWORX branding, booking/call CTAs, and the four service branches. | **No.** Never edit. Just call it. |
| `template_styles.css` | All CSS. Read by the renderer. | No. |
| `audit_schema.json` | The data contract. Defines every field the agent must produce and the rules for each. | No — but **read it**; it is the spec. |
| `example_audit.json` | A complete, real worked example (Rolling Hills Landscaping). | No — **copy its shape** for each new lead. |

## The workflow, per lead

```
1. DISCOVER + AUDIT the business's real website (see system prompt steps).
2. WRITE audit.json  ← the ONLY creative step; must match audit_schema.json
3. RUN:  python3 render_report.py audit.json report_card.pdf
4. The PDF (and a sibling report_card.html) appear in the working dir.
5. Attach/link the PDF in the outreach email.
```

That's it. Steps 1 and 2 are the agent's work. Step 3 is one shell command.

## How to write `audit.json`

- **Start from `example_audit.json`** and replace the values. Keep the exact
  structure and key names.
- **Validate against `audit_schema.json`.** Every required field must be present.
- **Scores are 1–10 integers.** The renderer computes the average, the letter
  grade (colour-coded), and lights the flags automatically — do NOT hand-set the
  grade or average.
- **Only 4 scores are "verified"** (`design`, `mobile`, `tech_seo`, `cro`) and
  they feed the radar chart. They MUST come from direct observation of the site.
- **The other 6 scores are reasoned estimates** and only feed the bar grid.
- **Never invent specifics.** If you didn't observe something, use the documented
  status values (`UNVERIFIED`, `ABSENT`, etc.) rather than guessing a fact.
- **Competitor rows:** `rating` and `reviews` must be REAL (from each competitor's
  Google Business Profile). The `mobile_call` / `schema` / `overall` columns are
  illustrative unless you actually audited that competitor's site. The renderer
  prints a footnote saying so.
- **`bottom_line`** is the one field that needs real synthesis: exactly 3
  sentences — current state → biggest single opportunity → revenue impact.

## What the renderer handles for you (don't rebuild any of this)

- 5-page A4 layout, pagination, page numbers, footers
- All four charts (radar, score-distribution, AI-visibility dial, reputation gap)
  generated as inline SVG from your numbers — no libraries, works offline
- GAELWORX branding: wordmark (A & E in forge-orange), palette, section styling
- "Book a Meeting" + "Call (369) 212-1203" CTAs in the masthead on every page
- The 30-Day Plan timeline (built from your `plan` array)
- The four service branches + calendar CTA on the final page
- Accessibility section auto-shows only when that score ≤ 6

## Environment requirements

- Python 3 with `playwright` (Chromium) available — already present in the
  managed-agent sandbox. The renderer launches headless Chromium to print the PDF.
- No network needed for rendering. (Network IS needed earlier, for the agent to
  scrape the target + competitor sites.)
- Keep `render_report.py` and `template_styles.css` in the same directory.

## One open item

The wordmark currently falls back to a serif font because Cinzel Decorative
isn't embedded. To get the true brand font in the PDF, drop a base64 `@font-face`
for Cinzel Decorative Bold at the top of `template_styles.css`. Everything else
renders identically with or without it.
