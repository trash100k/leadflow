# DESIGN-ASSETS — hero imagery & design references for spec-site builds

How every spec-site build sources its hero image and leans on design
references. Written during the Tampa landscaper pilot (Jul 2026) after the
MasterCut build; the specific photo/library links below were found and
verified via live search that session. Companion to `PIPELINES.md` §B3 and
the `impeccable` skill.

---

## 1. Hero image priority ladder

Work down this list; stop at the first rung that yields a usable image.

1. **Owner's own photos** (GBP "by owner" uploads, FB cover/photo grid).
   Always the first choice — it's real proof and it's theirs. Usable =
   roughly landscape, ≥1200px wide, and enough quiet area for the headline
   under a dark scrim. The MasterCut build's FB cover is this rung.
2. **Town/area-specific stock** — the market's actual scenery (palm-lined
   Tampa streets, FL suburban aerials). Grounds the page in *their* city
   without claiming work that isn't theirs. See §3 for vetted candidates.
3. **Generic service-category stock** (mowing crew, fresh-cut lawn) — last
   resort when nothing area-specific fits.
4. **Generated neutral scenery** (`mcp__higgsfield__generate_image`) — only
   when 1–3 all fail; must read as generic scenery, never as documentary
   footage of "their crew."

**Labeling rule (non-negotiable):** stock or generated imagery is scenery
ONLY. It never appears under "Photos from the crew" / "our work" headings,
and never in the gallery — the gallery stays 100% owner-uploaded photos.
Hero backdrop is atmospheric; if the hero uses stock, the caption/alt text
says what it is ("South Tampa residential street"), not "our work."

**Hero composition:** put the image behind the existing dark gradient scrim
(`linear-gradient(...) , url(...) center 30% / cover`), keep headline
contrast ≥4.5:1 over the darkest part of the scrim, and prefer images with
negative space (sky, lawn plane) where the type lands.

## 2. Stock libraries (licenses verified)

Two free libraries cover this pipeline's needs. Both allow commercial use
without attribution; both prohibit implying endorsement by identifiable
people/brands in the photos — avoid recognizable faces on client heroes.

| Library | License | Notes for this pipeline |
|---|---|---|
| **Unsplash** — unsplash.com | [unsplash.com/license](https://unsplash.com/license) — free commercial use, no attribution required; no selling unaltered copies; no implied endorsement | Best area-specific inventory (Tampa aerials below). Direct file: `https://unsplash.com/photos/<ID>/download` 302s to the full-res CDN file — browser-friendly hotlink. Or pull the page's `og:image` (Nimble extract) for an `images.unsplash.com/...` URL that accepts `?w=1920&q=80&fit=crop` params. |
| **Pexels** — pexels.com | [pexels.com/license](https://www.pexels.com/license/) — free use/modify, no attribution required; no implied endorsement; no reselling unaltered | Deep service-category inventory. Direct file via the page's `og:image` → `images.pexels.com/photos/<id>/...` accepting `?auto=compress&cs=tinysrgb&w=1920`. |

**Sandbox constraint (verified):** this environment's proxy blocks raw
binary downloads (`curl` → CONNECT 403), so builds hotlink stock URLs
rather than self-hosting; a real browser loads them fine. Verify rendering
on the deployed URL, not in the sandbox.

## 3. Vetted photo candidates (found via live search, Jul 2026)

### Tampa / Florida area-specific (Unsplash) — rung 2 for the Tampa pilot
- `Dk5C85XSC34` — street of houses with palm trees, suburban subdivision
  east of downtown Tampa. Strong default Tampa hero.
- `Z7xYvFPFmOs` — Tampa skyline seen over houses + palms from a residential
  neighborhood. Good "serving the whole metro" feel.
- `_5RCkLiCJjo` — bird's-eye Tampa-area neighborhood with pool.
- `SCPouwf5yi0` — aerial of two suburban Tampa houses (tight crop).
- `qnbZolZ5kjs`, `9Iqsq31tqbQ` — titled "Orlando Florida Real Estate" but
  described as a Tampa master-planned community ~15mi north of downtown —
  title/description conflict; eyeball before using.

Photo page = `https://unsplash.com/photos/<ID>`; file = `<page>/download`.

### Service-category (rung 3)
- Unsplash: `BKBRtbcjlxI` (two-man crew mowing/trimming a residential
  lawn), `bsld7GjQwjI` (man mowing), `7AhHdGeSDVQ` (overgrown lawn —
  useful as a "before" image in report cards).
- Unsplash photographer `@cutabovelandscapingnc` — a real NC landscaping
  company publishing its own work photos under the Unsplash license; a
  rich, legitimate vein for lawn-care imagery.
- Pexels photo IDs: `12087398`, `13630739`, `9029162`, `20727438`; search
  hubs: `/search/lawn care/`, `/search/lawn mowing/`, `/search/landscaping/`,
  `/search/commercial lawn mower/`.

For other verticals/metros, repeat the same two searches ("<service>
site:unsplash.com", "<metro> neighborhood site:unsplash.com") and append
findings here.

## 4. Design references (design-md-style libraries)

- **`pbakaus/impeccable`** (github.com/pbakaus/impeccable, Apache 2.0) —
  design guidance for AI coding agents, organized around per-project
  `DESIGN.md` + `PRODUCT.md` context files and 46 detector rules for
  AI-design tells. Already adapted into this repo as the callable
  **`impeccable` skill** (`.claude/skills/impeccable/`) — run it on every
  build before deploy. For deeper cuts (its `animate`, `typeset`,
  `layout`, `bolder`, `overdrive` command guidance), read the upstream
  repo's skill files directly.
- **In-repo references:** `audit-kit/gaelworx_audit_kit/TEMPLATE_ANNOTATED.html`
  (report-card layout language), `src/reportCardTemplate.js` /
  `src/reportCardV2.js` (brand palette + type pairing), `PIPELINES.md` §B3
  (spec-site section order).
- *Unverified, worth evaluating later:* other agent-design rulebooks in the
  impeccable style exist (it ships adapters for a dozen editors); none
  besides impeccable were evaluated this session — don't cite others as
  vetted until actually reviewed.

## 5. Per-build checklist addition

At build time (between GBP harvest and deploy):

1. Rank owner photos; pick hero per §1. If none usable → pick from §3
   area-specific list (or run the two searches for a new metro).
2. Record the choice + source URL in the lead's `out/<slug>/` notes.
3. Gallery = owner photos only. Stock never enters the gallery.
4. Run the `impeccable` skill pass.
5. Deploy, then verify the hero actually paints in a real browser
   (sandbox can't — §2).
