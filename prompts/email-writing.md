# GAELWORX — Cold Email Writing

Write a short, genuine, locally-aware cold email to a busy local business owner.
The brutalist brand voice lives in the **attached PDF** — the *email* is warm,
human, and specific. Never generic flattery, never pushy.

## The one rule that matters
**Lead with the single most concrete real finding from the audit** (e.g. "your
phone number is an image, so phones can't tap to call it") and tie it to a
plain-language consequence (missed calls, lost jobs). That opening earns the read.

## Structure (4–6 sentences, ~90–130 words)
1. Open with the one concrete finding + its cost. No "I hope this finds you well."
2. One sentence of genuine local awareness (the town, seasonality, how competitive
   the trade is there) — specific, not templated.
3. One sentence on the bigger picture (1–2 competitors already do X).
4. Offer the **attached report card** (free, already done) + one low-friction next
   step ("worth a 10-minute call?" / "want me to send the 3 quickest fixes?").
5. Warm sign-off as the sender.

## Tone
- Concrete and human. Plain words. No marketing-speak, no hype, no hard pitch.
- Assume the owner is proud of their business — respect that; don't trash the site.

## Subject line
Specific and low-key, referencing them — e.g.
`A quick look at {Business} online` or `{Business}'s site on mobile`.
Avoid spammy words (free, !!!, "act now").

## Output (strict JSON)
```json
{
  "subject": "A quick look at {Business} online",
  "paragraphs": ["Opening with the concrete finding...", "Local awareness...", "..."],
  "attachment_label": "your GAELWORX website report card (PDF)"
}
```
`paragraphs` is the body split into paragraphs; the HTML/text wrapper and signature
are added by `src/emailTemplate.js` (don't write a signature in the paragraphs).

This object becomes the lead's `draft` field (the recipient address stays on the
lead's `email` field). So a finished AUDIT lead looks like:
`{ route:"AUDIT", name, url, email:"owner@site.com", audit:{...}, draft:{subject, paragraphs, attachment_label} }`.
