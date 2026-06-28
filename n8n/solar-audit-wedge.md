# n8n board: GAELWORX Solar Audit Wedge

**Workflow id:** `4gJ6e1tulxMzvgVo` · project: Zachary Isaacson (gaelworx.com) ·
URL: https://gaelworx.app.n8n.cloud/workflow/4gJ6e1tulxMzvgVo

The "Sonnet-with-minimal-effort" board: deterministic discovery + research do the
heavy lifting; the Sonnet node only writes the email.

## Flow
`Run Solar Batch` → `Brief` (geo, target, min_rating, min_reviews) →
`Discover Solar (search API)` → `Parse to Leads` → `Each Lead` (loop, batch 1):
- `Fetch Site` (GET homepage, text) → `Extract Signals` (Code: viewport, tel,
  mailto, JSON-LD, forms, builder, title, on-page email; computes `weak`) →
- `Good Reviews + Weak Site?` (IF: rating ≥ min AND reviews ≥ min AND weak)
  - **true** → `Audit + Write Email` (Claude Sonnet 4.6 + structured output:
    route, contact_email, subject, body, top_finding, light scores) →
    `Normalize Output` → `AgentMail Draft` (HTTP) → `Log Done`
  - **false** → `Log Skip`
→ `Batch Complete`.

## Wire before running (placeholders in the board)
1. **Discover Solar** — set the search/enrichment endpoint (Nimble / SerpAPI /
   Google Places) + a `Search API` header credential. It must return a JSON list of
   `{name, website, rating, reviews, phone}` (Parse to Leads is tolerant of
   results/data/leads/array shapes).
2. **Claude Sonnet** — attach an `Anthropic` credential.
3. **AgentMail Draft** — set the AgentMail create-draft endpoint for
   `gaelworx@agentmail.to` + a Bearer `AgentMail` credential. Body `{to,subject,text}`.

## Design choices
- **Filter = good reviews + weak site** (the original wedge), scoped to solar.
- **Research layers** live in `Extract Signals` (site health + AI-visibility
  signals). Expand here for deeper scoping (contact-page fetch, reviews themes,
  solar-specific checks: financing, NABCEP/licenses, service-area, panel brands).
- **No PDF at first touch** — the email teases the findings (better deliverability,
  and you shouldn't cold-attach). The branded report card is rendered on REPLY by
  the `gaelworx-prospecting` skill / Claude Code.
- Keep as **drafts** until deliverability Phase 0 (SPF/DKIM/DMARC on a sending
  subdomain like `outreach.gaelworx.com`) is done.

Reference SDK lives in this repo's git history (created via create_workflow_from_code).
