# NOTICE

This directory contains a modified derivative of design-critique guidance
originally published at:

  https://github.com/pbakaus/impeccable

Copyright the original authors and contributors of `pbakaus/impeccable`.
Licensed under the Apache License, Version 2.0 (see `LICENSE` in this
directory for the full license text).

## Changes made

`SKILL.md` in this directory is **not** a verbatim copy of the upstream
skill file. It has been condensed and rewritten by GAELWORX for use as a
project skill inside the `leadflow` repo:

- Reduced from a 25-command, CLI-style skill (`/impeccable init`,
  `/impeccable craft`, `/impeccable live`, etc.) to a single critique-and-
  polish checklist, since this repo builds static one-page spec-sites and
  PDF report cards rather than iterating live in a running dev server.
- Re-scoped the "when to use this" guidance to this repo's build steps
  (no-site-builder, has-site-cards, state-exclusive, report-card) instead of
  the original's general-purpose project workflow.
- Retained the upstream anti-pattern list and concrete numeric rules
  (contrast ratios, line-length caps, heading clamp ceilings, motion easing,
  z-index scale guidance) as factual design heuristics, condensed from the
  original wording.

No trademark of the original project or its authors is used here beyond
what is necessary to describe the origin of this derivative work.
