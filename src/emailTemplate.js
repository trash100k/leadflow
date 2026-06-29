// GAELWORX canonical email template — brand truth for every send.
// Works in AgentMail, Gmail, and any SMTP path. Inline styles only (Gmail strips <style>).
// Table-based shell for Outlook; div body for clean rendering elsewhere.
// Same buildEmail() API — the pipeline never changes, only this wrapper does.

const CELTIC_BLOOD = '#C1292E';
const EMBER       = '#E85D04';
const FORGE       = '#0B0C10';
const INK         = '#1a1a1a';
const ASH         = '#6b7280';
const SMOKE       = '#F4F4F5';
const BORDER      = '#e4e4e7';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// buildEmail(email)
//
// email: {
//   paragraphs:          string[]   — AI-written body (one per paragraph)
//   sender_name?:        string     — default "Zach"
//   sender_title?:       string     — default "Web & Growth"
//   sender_email?:       string
//   sender_phone?:       string
//   calendar_url?:       string     — optional secondary CTA (Google Calendar booking)
//   cta_mailto?:         string     — first-touch: pre-filled mailto to your Gmail
//   cta_subject?:        string     — mailto subject
//   cta_label?:          string     — button label, default "Send me my report"
//   report_url?:         string     — warm reply: link to hosted PDF
//   report_cta?:         string     — link label, default "View your report card"
//   company_address?:    string     — CAN-SPAM physical address
//   unsubscribe_url?:    string     — opt-out link
//   unsubscribe_mailto?: string     — opt-out mailto (used if no url)
// }
export function buildEmail(email = {}) {
  const paras        = (email.paragraphs || []).filter(Boolean);
  const sender       = esc(email.sender_name  || 'Zach');
  const title        = esc(email.sender_title || 'Web & Growth');
  const senderEmail  = email.sender_email ? esc(email.sender_email) : '';
  const senderPhone  = email.sender_phone ? esc(email.sender_phone) : '';

  // ── Body paragraphs ────────────────────────────────────────────────────────
  const htmlParas = paras
    .map(p => `<p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:${INK};">${esc(p)}</p>`)
    .join('\n        ');

  // ── Primary CTA ────────────────────────────────────────────────────────────
  // Priority: cta_mailto (trust-first mailto to Gmail) > report_url (hosted link)
  let primaryCta = '';
  if (email.cta_mailto) {
    const subj  = encodeURIComponent(email.cta_subject || 'Send my report');
    const label = esc(email.cta_label || 'Send me my report');
    primaryCta = `
        <table border="0" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
          <tr>
            <td style="background:${CELTIC_BLOOD};border-radius:4px;">
              <a href="mailto:${esc(email.cta_mailto)}?subject=${subj}"
                 style="display:inline-block;padding:13px 28px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">${label} &rarr;</a>
            </td>
          </tr>
        </table>`;
  } else if (email.report_url) {
    const label = esc(email.report_cta || 'View your report card');
    primaryCta = `
        <table border="0" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
          <tr>
            <td style="background:${CELTIC_BLOOD};border-radius:4px;">
              <a href="${esc(email.report_url)}"
                 style="display:inline-block;padding:13px 28px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">${label} &rarr;</a>
            </td>
          </tr>
        </table>`;
  }

  // ── Secondary CTA (calendar) ───────────────────────────────────────────────
  const calCta = email.calendar_url
    ? `<p style="margin:8px 0 0;font-size:13px;color:${ASH};">Or <a href="${esc(email.calendar_url)}" style="color:${CELTIC_BLOOD};text-decoration:none;font-weight:600;">book a 15-min call</a> if easier.</p>`
    : '';

  // ── Signature contact line ─────────────────────────────────────────────────
  const contactLine = [senderEmail, senderPhone].filter(Boolean)
    .map(v => `<span style="color:${ASH};">${v}</span>`)
    .join(`<span style="color:${BORDER};"> &nbsp;·&nbsp; </span>`);

  // ── CAN-SPAM opt-out ──────────────────────────────────────────────────────
  const optOut = email.unsubscribe_url
    ? `<a href="${esc(email.unsubscribe_url)}" style="color:${ASH};text-decoration:underline;">Unsubscribe</a>`
    : email.unsubscribe_mailto
      ? `<a href="mailto:${esc(email.unsubscribe_mailto)}?subject=unsubscribe" style="color:${ASH};text-decoration:underline;">Reply &ldquo;unsubscribe&rdquo;</a>`
      : `<span style="color:${ASH};">Reply &ldquo;unsubscribe&rdquo; to opt out</span>`;
  const addr = email.company_address ? `<span style="color:${ASH};">${esc(email.company_address)}</span> &nbsp;&middot;&nbsp; ` : '';

  // ── Full HTML ──────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
</head>
<body style="margin:0;padding:0;background:#f9f9f9;">

<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f9f9f9;">
  <tr>
    <td align="center" style="padding:24px 12px;">

      <!-- Card -->
      <table width="100%" border="0" cellpadding="0" cellspacing="0"
             style="max-width:580px;background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

        <!-- ── Header ── -->
        <tr>
          <td style="background:${FORGE};border-bottom:3px solid ${CELTIC_BLOOD};padding:18px 32px;">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:0.12em;color:#ffffff;">
              G<span style="color:${CELTIC_BLOOD};">AE</span>L<span style="color:${EMBER};">W</span>ORX
            </span>
          </td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style="padding:36px 32px 28px;">
            <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
              ${htmlParas}
              ${primaryCta}
              ${calCta}
            </div>
          </td>
        </tr>

        <!-- ── Signature ── -->
        <tr>
          <td style="background:${SMOKE};border-top:1px solid ${BORDER};padding:20px 32px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
                    <div style="font-weight:700;font-size:15px;color:${INK};">${sender}</div>
                    <div style="font-size:13px;color:${ASH};margin-top:2px;">
                      <span style="font-weight:700;color:${CELTIC_BLOOD};letter-spacing:0.06em;">G<span style="color:${EMBER};">AE</span>LWORX</span>
                      <span style="color:${BORDER};"> &nbsp;·&nbsp; </span>
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
          <td style="background:${FORGE};padding:14px 32px;">
            <p style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:#4b4f52;">
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

  const calText = email.calendar_url
    ? `Book a call: ${email.calendar_url}`
    : '';

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
