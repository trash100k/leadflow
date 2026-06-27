# Deliverability — Phase 0 (do this BEFORE any cold send)

Cold-sending volume from `zach@gaelworx.com` with no authentication or warm-up can
push your **real business email into spam** — yours and your recipients'. The
harness therefore defaults to **draft mode**. Do not flip to `mode: "send"` until
the boxes below are checked.

## 1. Use a separate sending identity (protect the root domain)
Don't cold-send from the mailbox you run the business on. Options, best first:
- **Subdomain:** `mail.gaelworx.com` (or `outreach.gaelworx.com`) with its own DNS auth.
- **Separate lookalike domain:** e.g. `getgaelworx.com` / `gaelworx.io`, forwarded to you.
Reputation damage then stays off the root `gaelworx.com`.

## 2. Authenticate the sending domain (all three — non-negotiable)
- **SPF** — TXT record authorizing your sender (Google Workspace: `v=spf1 include:_spf.google.com ~all`).
- **DKIM** — generate the key in Google Admin (Apps → Gmail → Authenticate email) and publish the TXT record.
- **DMARC** — TXT at `_dmarc.<domain>`: start `v=DMARC1; p=none; rua=mailto:dmarc@<domain>`, tighten to `quarantine` later.
Verify with mxtoolbox.com or `dig`. Without all three, you hit spam regardless of content.

## 3. Verify every address before sending (cut bounces)
Bounce rate >3% wrecks reputation fast. Before each batch, run recipients through an
email-verification API (NeverBounce / ZeroBounce / MillionVerifier). Drop
undeliverable, role (`info@`, `sales@`), and catch-all addresses (or treat catch-alls
as low-confidence). The harness logs `MANUAL_CONTACT` when no real address is found —
never invents one.

## 4. Warm up the mailbox/domain (ramp the cap)
A brand-new domain blasting 35/day looks like spam. Ramp:
| Days | Daily cap (`brief.batch_cap`) |
|---|---|
| 1–3 | 5 |
| 4–7 | 10 |
| 8–12 | 20 |
| 13+ | 35 (steady state) |
Stay ≤ ~35–40 per mailbox/day. To go higher, add **more mailboxes**, not more per box.
Optionally run a warm-up service (Instantly/Mailreach) for 2–3 weeks first.

## 5. Content rules (already enforced by the templates)
- **One link** (the hosted report card) — `src/emailTemplate.js`. No link shorteners.
- **No first-touch attachment** — attaching a PDF cold is a spam signal; we link instead and
  attach the real PDF only on reply.
- Light HTML, plain human copy, a question to elicit replies, no spam-trigger words
  (free/guarantee/act now/!!!).
- **CAN-SPAM:** every email carries a physical mailing address + opt-out line
  (`brief.company_address`, `unsubscribe_*`). Honor opt-outs.
- n8n's "sent automatically with n8n" attribution is turned **off** on the send node.

## 6. Cadence
Spread the daily cap across business hours with randomized gaps — not a burst. Tue–Thu
mornings (recipient local time) convert best. The harness sends per-lead with jitter
rather than all at once.

## 7. Test + monitor
- Before each batch: seed-test the exact email through **mail-tester.com** (aim 9–10/10)
  or GlockApps; fix anything flagged.
- Watch **bounce rate (<3%)** and **spam-complaint rate (<0.1%)**. If either spikes,
  pause and reduce volume.
- Keep a real reply-to inbox monitored; replies are the strongest positive signal.

## Flip-to-send checklist
- [ ] Sending from a subdomain / separate domain (not root `gaelworx.com`)
- [ ] SPF + DKIM + DMARC verified
- [ ] Email verification in the pipeline; bounce <3%
- [ ] Warm-up ramp started; `brief.batch_cap` set to the current step
- [ ] mail-tester score ≥ 9/10
- [ ] CAN-SPAM footer present (address + opt-out)
- [ ] Reply inbox monitored

Only when all are checked: set `brief.mode = "send"`.
