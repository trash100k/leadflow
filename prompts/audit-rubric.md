# GAELWORX — Website Audit Rubric (official kit)

**Authoritative spec:** `audit-kit/gaelworx_audit_kit/audit_schema.json` and
`audit-kit/gaelworx_audit_kit/AGENT_PROMPT.md`. Start every audit from
`example_audit.json` and replace the values. Your only creative output is a valid
`audit.json`; the renderer owns grade/average/AI-% math, charts, branding, layout.

## The ten dimensions (each integer 1–10)
`design`, `mobile`, `tech_seo`, `local_seo`, `content_eeat`, `aeo`, `geo`,
`agentic`, `accessibility`, `cro`

- **VERIFIED from direct observation** (feed the radar — be rigorous):
  `design`, `mobile`, `tech_seo`, `cro`
- **Reasoned estimates** (feed the bar grid only):
  `local_seo`, `content_eeat`, `aeo`, `geo`, `agentic`, `accessibility`
- Do **not** set grade, average, or AI-visibility % — the renderer computes them.

## Flags (the renderer lights them; include only if TRUE)
`AGENT-BLIND` if `agentic<=3` · `AI-INVISIBLE` if `aeo+geo<=5` ·
`A11Y-RISK` if `accessibility<=4` · `NO-LOCAL` if `local_seo<=3`

## Required sections (see schema for exact shapes)
- `working`: 2–3 observed strengths `{title, detail}`
- `costing`: 3–4 problems, most valuable first `{title, detail}`
- `ai_blind_spot`: `{paragraphs[] (inline <b> ok; cite a real local query), probe[{label,status,note?}]}`
  — status ∈ PRESENT | ABSENT | PARTIAL | UNVERIFIED
- `agentic`: `{paragraphs[], probe[]}`
- `local`: `{rating, reviews, competitor_count, map_rank, paragraphs[]}` — rating + reviews MUST be real (GBP)
- `competitors`: up to 4 incl. target (`you:true`); rating+reviews REAL, other columns illustrative
- `accessibility`: `{probe[], note}` — only renders when `accessibility<=6`
- `plan`: exactly 4 `{week, title, detail, phase}` — weeks 1–2 `near`, 3–4 `later`
- `bottom_line`: exactly 3 sentences — current state → biggest opportunity → revenue impact

## Render
`python3 audit-kit/gaelworx_audit_kit/render_report.py audit.json report_card.pdf`
(or via `node src/prepare.js <lead.json>`, which writes the audit.json and calls the kit).
Three-tier fallback (chromium → weasyprint → html-only) always produces a deliverable.

## Pain-point copy (drives the mobile outreach card — `reportCardV2`)
The `costing` items become the three big pain points on page 1 of the outreach
card, so write them for the **owner**, not an SEO. The renderer shows each
`title` as the headline and the **first sentence** of `detail` as the plain
line beneath it.

- **`title` = the pain the owner feels, in plain words.** Lead with the money/
  customer consequence, not the technical cause.
  - ✗ "No AggregateRating in schema — 75 reviews invisible to AI"
  - ✓ "Your 75 five-star reviews are invisible in Google search"
  - ✗ "Missing meta description / weak title tags"
  - ✓ "You're losing clicks to competitors before anyone sees your site"
  - ✗ "No LocalBusiness JSON-LD; agent-blind"
  - ✓ "When someone asks ChatGPT for a company like yours, you don't come up"
- **`detail` first sentence = plain explanation + what it costs** (calls, jobs,
  trust). Put any technical note in a later sentence, not the first.
- No jargon in the first sentence: avoid "schema," "JSON-LD," "meta," "H1,"
  "LCP," "aggregateRating" up front — name the effect a homeowner understands.
- Still **true and specific** to what you observed — plain ≠ vague, and never
  invent a number or a review you didn't see.

## Never fabricate
A score, review, competitor, statistic, or email. Where unobserved, use the
documented status values rather than guessing. Better to skip than to invent.
