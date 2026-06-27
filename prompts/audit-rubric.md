# GAELWORX — Website Audit Rubric

Score a verified business site across **ten dimensions, 0–10**. Four are
**VERIFIED** — they must come from *direct observation* of the live site, not
assumption. The renderer computes the average and letter grade; **you never set
grade or average.**

## The ten dimensions
| key | dimension | verified? | what to look at |
|---|---|---|---|
| `design` | Visual Design | ✅ | layout, hierarchy, modernity, contrast |
| `mobile` | Mobile Experience | ✅ | reflow on phones, tap targets, readable hero |
| `tech_seo` | Technical SEO | ✅ | titles/meta, schema, headings, indexability |
| `cro` | Conversion (CRO) | ✅ | click-to-call, forms, CTAs above the fold |
| `performance` | Performance / Speed | – | LCP, image weight, render-blocking |
| `content` | Content & Messaging | – | services, pricing, service-area pages |
| `trust` | Trust & Social Proof | – | reviews on-site, credentials, guarantees |
| `local_seo` | Local SEO | – | NAP consistency, GBP linkage, local pages |
| `accessibility` | Accessibility | – | alt text, contrast, semantics |
| `branding` | Branding | – | logo use, consistency, voice |

## Rules
- Each score needs a **specific, concrete `note`** tied to what you actually saw
  ("phone number is an image, not click-to-call"), never generic ("could improve").
- **`top_findings`**: 2–4 of the most concrete, costly issues, written in plain
  owner-facing language (lost calls/leads), not jargon. These feed the email.
- **`competitors`**: 2–3 REAL competitors in the same geo, each with a one-line
  `edge` (what they do better). Verify they exist — never invent.
- **`bottom_line`**: exactly **3 sentences** — situation, the fastest wins, the
  competitive stakes.
- Never fabricate a score, note, review, competitor, or email.

## Audit JSON shape
```json
{
  "business": "Name",
  "url": "domain.com",
  "scores": {
    "design":      {"score": 4, "note": "..."},
    "mobile":      {"score": 3, "note": "..."},
    "tech_seo":    {"score": 5, "note": "..."},
    "cro":         {"score": 2, "note": "..."},
    "performance": {"score": 5, "note": "..."},
    "content":     {"score": 6, "note": "..."},
    "trust":       {"score": 4, "note": "..."},
    "local_seo":   {"score": 5, "note": "..."},
    "accessibility":{"score": 4, "note": "..."},
    "branding":    {"score": 6, "note": "..."}
  },
  "verified": ["design", "mobile", "tech_seo", "cro"],
  "top_findings": ["...", "..."],
  "competitors": [{"name": "...", "url": "...", "edge": "..."}],
  "bottom_line": "Three sentences."
}
```
