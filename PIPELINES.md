# PIPELINES — dual-track prospecting (HAS_SITE / NO_SITE)

The end-to-end plan for running both pipelines autonomously from Claude Code.
Grounded in (a) this project's own session history (what worked / what failed),
(b) a 7-agent research pass (spec-site outreach, GBP scraping, site builders,
presence report cards, autonomous ops, connector verification, adversarial
critique) — full findings in `research/dual-pipeline-research.json`.

**TL;DR:** One discovery front end, a router on the GBP `website` field, two
delivery tracks. HAS_SITE keeps the proven audit→report-card flow. NO_SITE
scrapes the Google Business Profile as the de-facto homepage, enriches
(owner name, email, photos), builds a personalized one-page spec site,
deploys it to `<slug>.vercel.app`, renders a condensed presence report card
whose remaining pages road-map GAELWORX services, and delivers **phone-first**
(email is the follow-up channel, not the primary). Attio writes go through the
REST API, not the MCP connector.

---

## 1. What worked / what failed (session ledger — binding)

### Keep (proven here)
| Mechanism | Evidence |
|---|---|
| Nimble `nimble_search` focus:"location" | 15-20 real GBP candidates/call: name, phone, rating, reviews, address, website-or-absence. The `website` field IS the router. |
| Exa targeted verification | Found Celtic Blue's owner "Erin" in review snippets; caught Kelly's (Arlington TX ≠ Tampa) market error |
| Owner-operator heuristics | reviews <~60, namesake/initials names, FB-only/no site, single location → owner answers the phone |
| `search-records` → `create-record` | Gate-free Attio dedup pattern (upsert-record hits a user-side permission gate) |
| Staging queue `data/pool-leads.jsonl` + status field | Survived 3 connector outages with zero data loss |
| AgentMail send (`zach-gaelworx@agentmail.to`) | Real SES message IDs; inline HTML renders in Gmail |
| Native Chromium render (audit-kit) | Branded 5-page PDFs, brand-perfect |
| GitHub raw URLs for PDFs | HTTP 200 — fine for *download* links |
| HANDOFF.md + skill files | Cross-session memory that actually worked |

### Never retry (failed here)
| Dead end | What happened | Rule |
|---|---|---|
| **Attio MCP as pipeline writer** | Flapped nearly every turn; killed writes 3 ways (Stream closed, 60s timeout, permission-stream closed) | Autonomous writes go through **Attio REST** (`ATTIO_API_KEY`, `src/attio.js` pattern). MCP = interactive fallback only. |
| `upsert-record` | User-side permission gate | search→create instead |
| Base64 blobs as tool params | 484KB b64 > all limits | Files + URLs, always |
| External Node → MCP servers | CCR session auth rejected | In-session tool calls only |
| n8n Gmail delivery | OAuth never attached | AgentMail replaced it |
| GitHub raw for **HTML** | Serves text/plain — no rendering | Spec sites need real hosting (Vercel) |
| Timeout ≠ failure | A timed-out create may exist server-side | Always search-before-create |

---

## 2. Discovery + router (shared front end)

1. `nimble_search` (focus location) over the metro, over-pull 2×. Optional
   upgrade: **Outscraper** API has a literal "only businesses WITHOUT a
   website" + "operational only" filter ($1–5 per 1,000 places) — worth adding
   the day we scale past hand-routing (env key, no MCP needed).
2. Qualify: operational (recent reviews, working phone), small owner-operator
   signals, in-market (verify area code / address — the Kelly's TX lesson).
3. **Verify the absence** before routing NO_SITE: empty GBP website field is
   not proof — run one `"{name}" {city}` search; a FB page / Google-sites page
   / dead domain still routes NO_SITE, a real live domain routes HAS_SITE.
4. Route: `HAS_SITE` → §3 · `NO_SITE` → §4 · directory/chain/out-of-market →
   SKIP (ledger).
5. Dedup: ledger (`node src/ledger.js seen`) + Attio search-before-create.

## 3. Pipeline A — HAS_SITE (exists; tighten only)

Unchanged from HANDOFF.md: scrape site → 10-dim audit (official kit schema,
never fabricate) → render PDF → host → Attio (REST) company+person+note+task →
email if a real address was found (link-first, no attachment) else CALL flag →
ledger.

**Outreach render (built):** `node src/reportCardV2.js <audit.json> <out.pdf>`
— same audit.json in, mobile-first 4-pager out (big type, one idea per block):
P1 THE BLEED (3 short site pain points + grade), P2 THE FIX (worst-3 dims
from→to + 30-day checklist + CTA), P3 THE LEAKS (4 universal business
bottlenecks: missed calls, slow quotes, busywork, after-hours), P4 THE FORGE
(GAELWORX solutions each tagged to the leak it plugs — voice + outreach
agents, automations, software, **UltraPlan** — + CTA). Brand: warm
forged-iron palette, blackletter
(Grenze Gotisch) + Hanken, coin watermark, all embedded. The official kit
remains the deep-dive variant. Two tightenings:
- Attio writes via REST (§1 rule).
- Email volume stays ≤15–20/day/inbox and ramps only after DELIVERABILITY.md
  Phase 0 (research: fresh identities warm 2–4 weeks; >0.3% spam-complaint =
  Gmail blocks the domain; cold sends from the main business domain poison
  transactional mail — use a lookalike sending domain when volume starts).

## 4. Pipeline B — NO_SITE (new)

> Research-driven design changes vs the first sketch: **phone-first delivery**
> (owners answer 30–50% of calls vs <2% cold-email reply; "I noticed you have
> no website" feels natural on a call and surveillance-y in an email), and a
> **counting scrape before industrializing** (the Tampa no-website pool TAM may
> be <50 businesses — if so this runs as a 10-prospect pilot, not a factory).

### B0. Counting scrape (one time, ~1 day)
Scrape the metro once; count qualified NO_SITE pool companies (operational,
20+ reviews, recent activity); measure real owner-name and email fill rates.
Decides pilot-vs-pipeline and sets expectations. (Current signal: 17/17 pool
leads have `email:null` — plan around calls.)

### B1. GBP deep-scrape (per lead)
Nimble extract on the Google Maps place page → save raw to `out/<slug>/`:
hours, services, categories/attributes, description, reviews (text + themes +
owner replies), Q&A, booking links, photo URLs (`lh*.googleusercontent.com`,
resizable via `=w1920` suffix) + per-photo attribution.
**Photo rule (legal):** only reuse photos attributed **"by owner"** — the
business owns those. Customer/reviewer photos and Street View are other
people's copyright: never reuse.

### B2. Enrich
- **Owner name** (feeds "talk to the owner" calls): FL **Sunbiz**
  (search.sunbiz.org) entity search → Officer/Director detail (NOT the
  registered agent — often a lawyer/filing service). Fallbacks: GBP
  review-reply signatures ("– Jerry, Owner"), FB page, BBB. Expect ~70% fill
  on claimed listings; near-0 reply-mining on unclaimed ones.
- **Email**: GBP never exposes emails, and there's no website to crawl — so:
  FB page About → Contact section; Sunbiz filings. Expect a LOW hit rate;
  **SMTP-verify anything found** before sending (stale FB emails bounce;
  >2-3% bounce damages the sender). No verified email → CALL-only, never guess.
- **Photos**: pick best 3–6 owner-uploaded; if thin, use clearly-generic pool
  imagery (never implied to be theirs) or generate neutral hero art.

### B3. Spec-site build (native template — no paid builder)
`templates/spec-site/` one-pager, client-branded, assembled from GBP data.
Section order (synthesis of the builder + pool-site research):
1. Sticky header: business name (text — **no logo without permission**), city,
   tappable phone, "Get Free Quote"
2. Hero: "[Service] in [City]" + 3 proof points + star badge + dual CTA
   (Call Now / Free Quote) over a real owner-photo
3. Trust bar: license #, insured, years, review count
4. Services grid (from GBP services/categories)
5. Review wall: real Google reviews, real names/stars (never typed-in fakes)
6. Service-area section: named cities + map
7. Hours + contact + 3–5-field quote form placeholder (name, phone, ZIP,
   service dropdown)
8. Footer: **"Website preview built for {Business} by GAELWORX · gaelworx.com
   · not affiliated until claimed"** + click-to-call sticky bar on mobile
Hygiene (non-negotiable): `noindex,nofollow` meta + robots.txt disallow +
takedown-on-request + auto-expire/unpublish after 30 days unclaimed.

### B4. Deploy — verified connector path
`mcp__Vercel__deploy_to_vercel` (schema-verified this session): inline
`files[]` (utf-8/base64), `name:"gw-<slug>"` auto-creates a per-lead project,
`target:"production"` → stable `https://gw-<slug>.vercel.app`. No git, no
build step. Track interest with `?src=call|email` params + Vercel runtime
logs (a prospect who visits 5× is warm — call them first).
Fallback: Supabase edge function serving HTML. (Cloudflare MCP is read-only
for Workers — no deploy tool; Drive can't host; higgsfield is overkill:
verified, not guessed.)

### B5. Condensed presence report card (new template, kit visual language)
**Page 1 — the keys, condensed and prioritized** (research: >5 findings or
multiple CTAs dilute; grades create curiosity):
- Letter-grade strip: GBP completeness · Reviews · Local-pack position ·
  AI visibility · Website (F — but framed as *fixable*, one row among several)
- Competitor table vs their ACTUAL local 3-pack (reviews, rating, velocity —
  the realistic target is the weakest pack member, not a scary national avg)
- One AI-visibility live test, dated: "we asked ChatGPT for the best pool
  company near {city} — you don't appear" (+ the 6%→45% adoption stat)
- Revenue-leak line **labeled "industry estimate," sourced** (never invented
  numbers — repo rule)
- ONE priority fix + the spec-site URL/QR: "we already built the fix — look"
**Pages 2–5 — the GAELWORX 90-day roadmap** (not a menu — each service tied to
a diagnosed gap): Web Design (the live spec site = proof) → Missed calls → AI
Voice Agents → No follow-up/quoting → Automations → Ops chaos → Custom
Software → AI invisibility → AI Installation (UltraPlan). One CTA: book/call.

### B6. Deliver — phone-first
- **Always**: Attio (REST) company + owner person + note (spec URL, report
  URL, owner name, call-window) + **task "📞 CALL {owner} 7:00–8:30am or
  4:30–6pm Tue–Thu"** (trade owners are on job sites 9–4; those windows are
  the data-backed answer). HOT flags (Irish/Gaelic etc.) unchanged.
- **If verified email**: AgentMail send — subject "I went ahead and built
  this for {Business}", plain-ish text, ONE link (spec site), no price, no
  attachment; report card follows on reply. Reply-To zach@gaelworx.com.
  A reply = call them within minutes, not email back.
- **No email** (the majority): CALL queue only. Post-call, text/email the
  link same-day ("here's that preview — 30 seconds to look").
- Cadence if emailing: 4 touches max (Day 0 / 3 / 9 / 17 breakup) — steps 1–3
  capture ~74% of replies; more touches mostly add spam complaints.
- Ledger status: `SITE_BUILT` → `SENT` / `CALL_QUEUED` → `REPLIED` / `DEAD`.

---

## 5. Connector matrix (decided)

| Role | Connector | Status |
|---|---|---|
| Discovery/scrape | Nimble MCP | proven |
| Verification | Exa MCP | proven |
| Spec-site hosting | **Vercel MCP `deploy_to_vercel`** | schema-verified, canary next |
| Email | AgentMail MCP | proven (low volume) |
| CRM | **Attio REST via `ATTIO_API_KEY`** | code exists (`src/attio.js`); key needed |
| PDF hosting | GitHub raw | proven (move to `main` URLs after merge) |
| Render | audit-kit Chromium | proven |
| Worth adding (env keys, not MCP) | Outscraper (no-website bulk filter, $1–5/1k) · an SMTP verifier (MillionVerifier/ZeroBounce) before any cold send | optional, at scale |
| Dropped | n8n delivery, Gmail drafts, Lovable (OAuth broken headless), Cloudflare (no write tools), Drive hosting, higgsfield sites | — |

## 6. Autonomy loop + human gates

Per batch (self-paced, scheduled session or on-demand): discover → route →
A-track and B-track per-lead subagents in parallel → build/render → deploy →
Attio REST → deliver → ledger → commit artifacts → summary.

**Caps:** discovery 20/run · spec-site builds 5/day · emails 15–20/day/inbox
(ramp only post-Phase-0) · calls queue unbounded (human-dialed).

**Human gates (research-mandated, not optional):**
1. First 10 spec sites + first 20 emails reviewed by Zach before autonomy
   opens (the n8n AI-SDR reference pattern: approve first N, then 10% rolling
   spot-checks).
2. **All replies and all calls are Zach's** — reply latency >1 day kills
   deals; the pipeline flags, never converses.
3. Kill switch: bounce >2% or spam complaint >0.1% → sends auto-pause.
4. Wrong-business/wrong-owner check inside every send-approval view (12–20%
   of automated personalizations contain a false claim — verify or omit).

**Hard legal rules:** manual human dialing only (no auto/AI dialers to cells —
TCPA); CAN-SPAM footer; scrape via third-party paths only, never through a
Google Cloud key or the GAELWORX Google account; owner-photos only; noindex +
label + expiry on every spec site; dollar claims labeled as estimates with
sources; FDUTPA-safe framing ("built this preview for you" only when true —
it will be, we build before outreach).

## 7. Sequencing (the critic's verdict, adopted)

1. **Now:** B0 counting scrape (TAM + fill rates) · Vercel deploy canary
   (1 dummy site) · spec-site + presence-report templates · Attio REST cutover.
2. **Pilot:** 10 NO_SITE prospects end-to-end (Jay's Pool Service and sammie
   porch are already queued — both flagged no-website). Zach calls; measure
   view→call→close.
3. **In parallel:** Pipeline A keeps running (it works); Phase 0
   deliverability starts (sending subdomain, SPF/DKIM/DMARC, warm-up).
4. **Scale** whichever converts, per the pilot numbers — possibly to new
   metros/niches rather than deeper into a small Tampa TAM.

## 8. One-time asks (Zach)

1. **`ATTIO_API_KEY` in `.env`** — unblocks reliable CRM writes (biggest lever).
2. Confirm Vercel connector may create projects (I'll canary once).
3. Approve the spec-site branding stance (text name, owner photos only,
   noindex + preview footer + 30-day expiry).
4. Own the call queue: 7:00–8:30am / 4:30–6:00pm Tue–Thu blocks.
5. (At volume) sending subdomain + SMTP-verifier key.
