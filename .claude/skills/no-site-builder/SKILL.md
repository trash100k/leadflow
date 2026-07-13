---
name: no-site-builder
description: >-
  Workflow B — find local businesses WITHOUT a website, harvest their whole
  Google Business Profile (info, reviews, owner photos), BUILD them a live
  one-page site, render a mini presence report card, and run outreach
  (email if verified, Attio CALL queue otherwise). Use when asked to "run
  no-site-builder", "build sites for no-website businesses", or to prospect
  GBP-only businesses in an ICP.
---

# Workflow B — no-site-builder

One batch: discover no-site businesses → GBP harvest → enrich → **build the
site** → deploy → mini report card → deliver → CRM → ledger.

## Kickoff brief
`/no-site-builder <vertical> | <metro, ST> | [target] | [overrides]`
Defaults: owner-operator filter (they answer their own phone) · **build for
EVERY qualified lead, no cap** (Zach's call) · phone-first delivery.

## Decided parameters (Zach, Jul 2026 — don't re-ask)
- **Site builder:** invoke Zach's claude.ai skill **`front-end-design`** (by
  name via the Skill tool) to design each one-pager. If that skill isn't
  available in the session, fall back to `templates/spec-site/` conventions
  (section order below) — never block a batch on the skill's absence.
- **Stack:** static self-contained HTML → Vercel (`deploy_to_vercel`,
  `name: "gw-<slug>"`, `target: "production"` → `gw-<slug>.vercel.app`).
- **Build gate:** none — every qualified lead gets a live site before first
  contact. The pitch IS "it already exists."
- **Preview-safe policy (standing, legal):** `noindex,nofollow` + robots
  disallow · footer "Website preview built for {Business} by GAELWORX ·
  gaelworx.com" · owner-uploaded GBP photos ONLY · text business name, **no
  logo** without permission · auto-unpublish after 30 days unclaimed (ledger
  carries `expires`; each run unpublishes overdue previews — redeploy a
  simple "preview expired — call GAELWORX" placeholder to the project).
- **Deliverable = site + mini report card** (both links in every touch).

## Steps (per run)
1. **Discover** Nimble location search; keep leads with NO real website
   (empty/FB-only/Google-sites/dead). **Verify absence**: one `"{name}" {city}`
   search — a live business domain reroutes the lead to has-site-cards.
2. **Dedup**: ledger + Attio search, as in Workflow A.
3. **GBP harvest (the core of this flow):** Nimble extract of the Google Maps
   place page → `out/<slug>/gbp.json` + `out/<slug>/photos/`:
   - rating, review count, hours, services, attributes, booking links
   - **ALL owner-uploaded photos** (download; skip customer/Street View —
     other people's copyright)
   - **best review pull-quotes verbatim with first names** (the good press —
     these become the site's review wall and the card's proof lines)
   - owner-reply signatures ("— Alec"), description, Q&A
4. **Enrich** (never fabricate):
   - Owner name: Sunbiz officer lookup (search.sunbiz.org via Nimble; NOT the
     registered agent), review-reply signatures, FB page About.
   - Email: FB About → contact; any found email must be plausible + noted as
     unverified unless confirmed. No verified email → CALL path.
5. **Build the site** — one page, client-branded, from harvest data. Invoke
   `front-end-design`; give it the gbp.json + photos + this section order:
   sticky header (name/city/tap-to-call/quote CTA) → hero ("[Service] in
   [City]" + 3 proof points + star badge over a real owner photo) → trust bar
   → services grid → **real review wall** → service-area map/list → hours +
   3–5-field quote form placeholder → preview footer + mobile sticky call bar.
   Apply the preview-safe policy. Output: one self-contained `index.html`.
6. **Deploy** to Vercel → `gw-<slug>.vercel.app`. Append `?src=call|email` on
   links you hand out (interest tracking via Vercel runtime logs).
7. **Mini presence report card:** write a presence-flavored audit.json —
   pain #1 = "You don't have a website — customers can't find or vet you";
   pains 2–3 from the harvest (reviews invisible, AI can't recommend you);
   scores honest (site dims low); `business.url` = `gw-<slug>.vercel.app`;
   plan near-steps = "Claim the site we built" — then
   `node src/reportCardV2.js` → `out/<slug>-card.pdf`, host in `reports/`.
8. **Deliver:** verified email → AgentMail (rotation rules from Workflow A):
   subject `I went ahead and built {Business} a website`, ONE link (the site),
   card link second line. Otherwise → Attio **📞 CALL** flag with site + card
   links + owner name + call windows. Post-call text-it-yourself is expected.
9. **CRM + ledger:** same as Workflow A (REST preferred; `PENDING_ATTIO`
   status when the connector is down). Ledger row carries `site_url`,
   `expires` (+30 days), `status: SITE_BUILT → SENT|CALL_QUEUED`.
10. **Expiry sweep + summary:** unpublish overdue previews; report counts,
    sites built, links, inbox usage. Commit artifacts.

## Guardrails
- Owner photos only; no logos; preview labeling always; expiry always.
- Never fabricate reviews/stats — the review wall is verbatim quotes.
- Takedown-on-request: owner asks → unpublish same day, note in Attio.
