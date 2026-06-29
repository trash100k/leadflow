// GAELWORX canonical email template — brand truth for every send.
// Cinzel Decorative wordmark · Hanken Grotesk body · forge-fire AE treatment.
// Table-based shell (Outlook); inline styles only (Gmail strips <style>).
// Same buildEmail() API — the pipeline never changes, only this wrapper does.

// ── Official palette (Stitch design system) ───────────────────────────────
const CELTIC_BLOOD = '#C1292E';   // primary red
const EMBER        = '#E85D04';   // ember glow
const FORGE        = '#0B0C10';   // forged iron — primary bg
const COLD_STEEL   = '#1F2833';   // secondary surfaces / outer wrap
const FOG          = '#F1F2F6';   // fog white — light text / "bone"
const ASH          = '#8D99AE';   // ash — frame borders, muted text
const GLOW         = '#E34A27';   // forge-fire drop-shadow accent

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Forge-fire AE: gradient Celtic Blood → Ember → Fog White, bottom to top.
// color:${EMBER} is the Gmail fallback (Gmail strips background-clip).
// Supporting clients (Apple Mail, Outlook.com) render the full gradient.
const AE = `color:${EMBER};background:linear-gradient(to top,${CELTIC_BLOOD},${EMBER} 50%,${FOG});-webkit-background-clip:text;-webkit-text-fill-color:transparent;`;

// buildEmail(email)
//
// email: {
//   paragraphs:          string[]   — AI-written body (one per paragraph)
//   sender_name?:        string     — default "Zach"
//   sender_title?:       string     — default "Web & Growth"
//   sender_email?:       string
//   sender_phone?:       string
//   calendar_url?:       string     — optional secondary CTA (Google Calendar)
//   cta_mailto?:         string     — first-touch: pre-filled mailto to Gmail
//   cta_subject?:        string     — mailto subject
//   cta_label?:          string     — button label
//   report_url?:         string     — warm reply: link to hosted PDF
//   report_cta?:         string     — link label
//   company_address?:    string     — CAN-SPAM physical address
//   unsubscribe_url?:    string     — opt-out link
//   unsubscribe_mailto?: string     — opt-out mailto (used if no url)
// }
export function buildEmail(email = {}) {
  const paras       = (email.paragraphs || []).filter(Boolean);
  const sender      = esc(email.sender_name  || 'Zach');
  const title       = esc(email.sender_title || 'Web & Growth');
  const senderEmail = email.sender_email ? esc(email.sender_email) : '';
  const senderPhone = esc(email.sender_phone || '(369) 212-1203');

  // ── Body paragraphs ────────────────────────────────────────────────────────
  const htmlParas = paras
    .map(p => `<p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:${FORGE};">${esc(p)}</p>`)
    .join('\n        ');

  // ── Primary CTA ─────────────────────────────────────────────────────────────
  // "Point the Sword" logic: sharp corners, high-contrast, no border-radius.
  let primaryCta = '';
  if (email.cta_mailto) {
    const subj  = encodeURIComponent(email.cta_subject || 'Send my report');
    const label = esc(email.cta_label || 'Send me my report');
    primaryCta = `
        <table border="0" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
          <tr>
            <td style="background:${CELTIC_BLOOD};">
              <a href="mailto:${esc(email.cta_mailto)}?subject=${subj}"
                 style="display:inline-block;padding:13px 28px;font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:0.04em;color:${FOG};text-decoration:none;">${label} &rarr;</a>
            </td>
          </tr>
        </table>`;
  } else if (email.report_url) {
    const label = esc(email.report_cta || 'View your report card');
    primaryCta = `
        <table border="0" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
          <tr>
            <td style="background:${CELTIC_BLOOD};">
              <a href="${esc(email.report_url)}"
                 style="display:inline-block;padding:13px 28px;font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:0.04em;color:${FOG};text-decoration:none;">${label} &rarr;</a>
            </td>
          </tr>
        </table>`;
  }

  // ── Secondary CTA (calendar) ───────────────────────────────────────────────
  // Always shown; calendar_url overrides the mailto fallback.
  const calHref = email.calendar_url || 'mailto:zach@gaelworx.com?subject=Book%20a%2015-min%20call';
  const calCta  = `<p style="margin:8px 0 0;font-size:13px;color:${ASH};font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;">Or <a href="${esc(calHref)}" style="color:${CELTIC_BLOOD};text-decoration:none;font-weight:700;">book a 15-min call</a> if easier.</p>`;

  // ── Signature contact line ─────────────────────────────────────────────────
  const contactLine = [senderEmail, senderPhone].filter(Boolean)
    .map(v => `<span style="color:${ASH};">${v}</span>`)
    .join(`<span style="color:${ASH};"> &nbsp;·&nbsp; </span>`);

  // ── CAN-SPAM opt-out ──────────────────────────────────────────────────────
  const optOut = email.unsubscribe_url
    ? `<a href="${esc(email.unsubscribe_url)}" style="color:${ASH};text-decoration:underline;">Unsubscribe</a>`
    : email.unsubscribe_mailto
      ? `<a href="mailto:${esc(email.unsubscribe_mailto)}?subject=unsubscribe" style="color:${ASH};text-decoration:underline;">Reply &ldquo;unsubscribe&rdquo;</a>`
      : `<span style="color:${ASH};">Reply &ldquo;unsubscribe&rdquo; to opt out</span>`;
  const addr = email.company_address
    ? `<span style="color:${ASH};">${esc(email.company_address)}</span> &nbsp;&middot;&nbsp; `
    : '';

  // ── Full HTML ──────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Hanken+Grotesk:wght@400;600;700&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:${COLD_STEEL};">

<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:${COLD_STEEL};">
  <tr>
    <td align="center" style="padding:32px 12px;">

      <!-- Card — 1px Ash frame + 8px hard black shadow (Brutalist Snap) -->
      <table width="100%" border="0" cellpadding="0" cellspacing="0"
             style="max-width:580px;background:#ffffff;border:1px solid ${ASH};box-shadow:8px 8px 0 #000000;">

        <!-- ── Header ── -->
        <tr>
          <td style="background:${FORGE};border-bottom:3px solid ${CELTIC_BLOOD};padding:20px 32px 14px;">
            <div style="font-family:'Cinzel Decorative',Georgia,'Times New Roman',serif;font-weight:900;line-height:0.88;letter-spacing:0;color:${FOG};">
              <div style="font-size:32px;">G<span style="${AE}">AE</span>L</div>
              <div style="font-size:32px;">WORX</div>
            </div>
          </td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style="padding:36px 32px 28px;">
            <div style="font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;">
              ${htmlParas}
              ${primaryCta}
              ${calCta}
            </div>
          </td>
        </tr>

        <!-- ── Signature ── -->
        <tr>
          <td style="background:${COLD_STEEL};border-top:1px solid ${ASH};padding:20px 32px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <div style="font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;">
                    <div style="font-weight:700;font-size:15px;color:${FOG};">${sender}</div>
                    <div style="font-size:13px;color:${ASH};margin-top:2px;">
                      <span style="font-family:'Cinzel Decorative',Georgia,serif;font-weight:900;font-size:12px;letter-spacing:0;color:${FOG};">G<span style="color:${CELTIC_BLOOD};">AE</span>LWORX</span>
                      <span style="color:${ASH};"> &nbsp;·&nbsp; </span>
                      <span>${title}</span>
                    </div>
                    ${contactLine ? `<div style="font-size:13px;margin-top:5px;">${contactLine}</div>` : ''}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Footer (CAN-SPAM) ── -->
        <tr>
          <td style="background:${FORGE};border-top:3px solid ${CELTIC_BLOOD};padding:14px 32px;">
            <p style="margin:0;font-family:'Hanken Grotesk',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:#4b5056;">
              ${addr}${optOut}
            </p>
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td>
  </tr>
</table>

</body>
</html>`;

  // ── Plain-text fallback ────────────────────────────────────────────────────
  const textOptOut = email.unsubscribe_url
    ? `Unsubscribe: ${email.unsubscribe_url}`
    : `Don't want these? Reply "unsubscribe" and I'll remove you.`;

  const calText = email.calendar_url ? `Book a call: ${email.calendar_url}` : '';

  const text = [
    ...paras,
    '',
    email.cta_mailto
      ? `${email.cta_label || 'Send me my report'}: mailto:${email.cta_mailto}?subject=${encodeURIComponent(email.cta_subject || 'Send my report')}`
      : email.report_url
        ? `${email.report_cta || 'View your report card'}: ${email.report_url}`
        : '',
    calText,
    '',
    `— ${email.sender_name || 'Zach'}`,
    `GAELWORX · ${email.sender_title || 'Web & Growth'}`,
    [email.sender_email, email.sender_phone].filter(Boolean).join(' · '),
    '',
    email.company_address || '',
    textOptOut,
  ].filter(l => l !== undefined).join('\n').replace(/\n{3,}/g, '\n\n').trim();

  return { html, text };
}

export default buildEmail;
