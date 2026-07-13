---
name: impeccable
description: >-
  Design-quality critique and polish pass for any site or page this repo
  builds (spec-sites, report cards, state-exclusive templates). Flags AI-design
  clichés (stat-grid repetition, eyebrow kickers, warm-beige defaults, identical
  card grids, gradient text) and enforces concrete color/type/layout/motion
  rules. Use before shipping any no-site-builder / has-site-cards /
  state-exclusive build, or whenever asked to "critique", "audit", or "polish"
  a page's design.
---

# impeccable — design critique & polish

> Adapted from [pbakaus/impeccable](https://github.com/pbakaus/impeccable)
> (Apache License 2.0 — see `LICENSE` in this directory). This file is a
> condensed, **modified** version of the original skill, rewritten for this
> repo's spec-site / report-card build flow rather than the original's
> general-purpose `/impeccable <command>` CLI surface. Not affiliated with
> or endorsed by the original author beyond the license grant.

## When to use this

Run a pass of this before any build in `no-site-builder`, `has-site-cards`,
`state-exclusive`, or `report-card` goes live — right after the HTML is
drafted, before `deploy_to_vercel` or PDF render. Also usable standalone:
"critique this page," "audit the design," "polish before we ship."

## The core question

Would this design give away that it's a template — could a viewer guess its
category (as opposed to this specific business) just from the visual
choices? If yes, it needs another pass.

## Absolute bans — kill these on sight

- **Side-stripe borders** (colored `border-left`/`border-right` on cards or
  alerts) — use a full border or a background tint instead.
- **Gradient text** (`background-clip: text`) — solid color only.
- **Glassmorphism as the default look** — blur/glass is for one rare,
  purposeful moment, not the base style.
- **Hero-metric template repeated** — a big-number + small-label stat row is
  fine ONCE; a near-identical stat grid stacked right below it (hero stats +
  a "trust bar" saying the same things) is the single most common tell.
- **Identical card grids** — icon + heading + one-line text, repeated 5-6
  times with zero variation. Real content has unequal weight; let one card
  differ (bigger, a CTA, a photo, a different background) instead of forcing
  uniformity.
- **Eyebrow kickers** — small all-caps tracked labels above every section
  ("WHAT WE DO," "GET IN TOUCH," "OUR PROCESS") read as scaffolding, not
  copy. Let the heading stand on its own.
- **Numbered section markers** (01 / 02 / 03) used decoratively rather than
  because the content is a genuine, ordered sequence.
- **Text overflow** — headings that break awkwardly at tablet/mobile widths
  because no `text-wrap: balance` was set.
- **Warm-beige-as-default body background** (cream, sand, parchment) used as
  if it were a brand decision rather than the single most common AI-default
  neutral. If cream/sand IS the deliberate brand call for this business (a
  bakery, a farmhouse aesthetic), that's fine — the test is whether it was
  chosen for this subject or reached for by default.

## Concrete rules

**Color & contrast**
- Body text ≥ 4.5:1 against its background; large text (≥24px regular, or
  ≥18.7px bold — WCAG's 18pt/14pt-bold thresholds in px) ≥ 3:1. Placeholder
  text gets the same 4.5:1 — no muted-gray exemption.
- Tinted neutrals: shift the neutral 0.005–0.015 chroma toward the brand's
  own hue, not toward generic warm beige.
- Pick a color strategy deliberately, not by default:
  - *Restrained* — tinted neutrals + one accent used on ≤10% of surface.
  - *Committed* — one saturated color carries 30–60% of the surface.
  - *Full palette* — 3–4 named roles, each used with a job.
  - *Drenched* — the surface itself IS the color.

**Typography**
- Cap body line length at 65–75ch.
- Pair faces on a contrast axis (serif + sans, geometric + humanist) — not
  two faces from the same family.
- Display/hero heading ceiling: `clamp()` max ≤ 6rem (~96px); letter-spacing
  floor ≥ -0.04em on big display type.
- `text-wrap: balance` on h1–h3; `text-wrap: pretty` on body prose.

**Layout**
- Flexbox for one-dimensional groups, Grid for two-dimensional layouts.
- Responsive grids with no explicit breakpoint: `repeat(auto-fit,
  minmax(min(280px, 100%), 1fr))` — the `min()` keeps a container narrower
  than 280px from overflowing horizontally.
- Vary spacing on purpose for rhythm — don't let every section land on the
  same padding value. Avoid nested cards (a card inside a card).
- Semantic z-index scale (10/20/30…), never arbitrary values like 999/9999.

**Motion**
- Ease-out with exponential curves (quart/quint/expo) — no bounce, no
  elastic.
- Every animation needs a `@media (prefers-reduced-motion: reduce)`
  fallback.
- Reveal animations should enhance an already-usable default, not gate
  content behind JS.
- Prefer blur/mask/clip-path over layout-affecting animation for a premium
  feel.

**Interaction**
- Never `position: absolute` a dropdown/menu inside an `overflow: hidden`
  ancestor — use `<dialog>`, the popover API, or `position: fixed`.

## How to run it

1. Read the built HTML (or the artifact/preview) in full.
2. Walk the "absolute bans" list first — these are near-automatic fixes,
   not judgment calls. Fix or justify each one explicitly.
3. Check the concrete rules relevant to what's on the page (skip motion
   rules for a page with no animation, etc.).
4. Report back: what was flagged, what changed, and anything deliberately
   kept as-is with the reason (e.g., "cream IS the brand for this bakery").
5. Re-check after edits — a fix for one rule (e.g., adding a CTA card) can
   accidentally trip another (e.g., breaking the grid's responsive
   collapse).

## Attribution & modifications

This file is a derivative work of `pbakaus/impeccable`, licensed Apache 2.0.
Per the license: a full copy of the Apache License 2.0 is included as
`LICENSE` in this directory, and this NOTICE records that the file has been
changed from the original — condensed from a 25-command CLI-style skill
(`init`, `craft`, `shape`, `critique`, `audit`, `polish`, `bolder`, `quieter`,
`animate`, `colorize`, `typeset`, `layout`, and more) into a single
critique-and-polish checklist scoped to this repo's static one-page site and
report-card builds. See `NOTICE.md` for details.
