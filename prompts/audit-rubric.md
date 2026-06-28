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

## Never fabricate
A score, review, competitor, statistic, or email. Where unobserved, use the
documented status values rather than guessing. Better to skip than to invent.
