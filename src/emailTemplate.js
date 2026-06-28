// On-brand HTML email wrapper for GAELWORX cold outreach — deliverability-first.
// Cold first-touch best practices: light HTML, ONE link (to the hosted report —
// never a cold attachment), plain human copy, a restrained brand signature, and a
// CAN-SPAM footer (physical address + opt-out). The brutalist heavy-metal styling
// stays in the report card itself. The AI writes subject + body paragraphs; this
// only wraps them.

const CELTIC_BLOOD = '#C1292E';
const EMBER = '#E85D04';
const INK = '#1a1a1a';
const ASH = '#6b7280';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// email: {
//   paragraphs: string[],         // AI-written body, one entry per paragraph
//   sender_name, sender_title?,   // signature
//   sender_email?, sender_phone?,
//   report_url?,                  // hosted report card link (first-touch CTA)
//   report_cta?,                  // link label, default "See your website report card"
//   company_address?,             // physical address (CAN-SPAM)
//   unsubscribe_url? | unsubscribe_mailto?  // opt-out (CAN-SPAM)
// }
export function buildEmail(email = {}) {
  const paras = (email.paragraphs || []).filter(Boolean);
  const sender = esc(email.sender_name || 'The GAELWORX team');
  const title = email.sender_title ? esc(email.sender_title) : 'GAELWORX';
  const contactBits = [
    email.sender_email ? esc(email.sender_email) : null,
    email.sender_phone ? esc(email.sender_phone) : null,
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  const ctaLabel = esc(email.report_cta || 'See your website report card');
  const htmlParas = paras.map((p) => `<p style="margin:0 0 16px;">${esc(p)}</p>`).join('\n');

  // Single CTA link — a text link (not a big image button) reads less "markety"
  // and lands better on a cold first touch. Trust order for FIRST touch (no PDF):
  //   1) cta_mailto → a pre-filled mailto to your Gmail (most trustworthy: no
  //      third-party domain, opens their own mail client to your real address).
  //   2) report_url → a hosted report link (use only on your own/verified domain).
  // Also set Reply-To: <your Gmail> at send time so a plain reply lands there too.
  let ctaHtml = '';
  if (email.cta_mailto) {
    const subj = encodeURIComponent(email.cta_subject || 'Send my report');
    ctaHtml = `<p style="margin:0 0 16px;"><a href="mailto:${esc(email.cta_mailto)}?subject=${subj}" style="color:${CELTIC_BLOOD};font-weight:700;">${esc(email.cta_label || 'Send me my report')} →</a></p>`;
  } else if (email.report_url) {
    ctaHtml = `<p style="margin:0 0 16px;"><a href="${esc(email.report_url)}" style="color:${CELTIC_BLOOD};font-weight:700;">${ctaLabel} →</a></p>`;
  }

  // CAN-SPAM footer: physical address + opt-out are required for compliance and
  // also help inbox placement.
  const optOut = email.unsubscribe_url
    ? `<a href="${esc(email.unsubscribe_url)}" style="color:${ASH};">unsubscribe</a>`
    : email.unsubscribe_mailto
      ? `<a href="mailto:${esc(email.unsubscribe_mailto)}?subject=unsubscribe" style="color:${ASH};">reply &quot;unsubscribe&quot;</a>`
      : 'reply "unsubscribe" and I\'ll take you off my list';
  const addr = email.company_address ? esc(email.company_address) : '';
  const footerBits = [addr, optOut].filter(Boolean).join(' &nbsp;·&nbsp; ');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:${INK};">
    ${htmlParas}
    ${ctaHtml}
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
      <div style="font-weight:700;color:${INK};">${sender}</div>
      <div style="font-size:13px;color:${ASH};margin-top:2px;">
        <span style="color:${CELTIC_BLOOD};font-weight:700;">G<span style="color:${EMBER};">AE</span>LWORX</span> &nbsp;·&nbsp; ${title}
      </div>
      ${contactBits ? `<div style="font-size:13px;color:${ASH};margin-top:4px;">${contactBits}</div>` : ''}
    </div>
    <div style="margin-top:14px;font-size:11px;color:#9ca3af;line-height:1.5;">${footerBits}</div>
  </div>
</body></html>`;

  const textOptOut = email.unsubscribe_url
    ? `Unsubscribe: ${email.unsubscribe_url}`
    : `Don't want these? Reply "unsubscribe" and I'll take you off my list.`;
  const text = [
    ...paras,
    email.report_url ? `${email.report_cta || 'See your website report card'}: ${email.report_url}` : '',
    '',
    `— ${email.sender_name || 'The GAELWORX team'}`,
    `GAELWORX${email.sender_title ? ' · ' + email.sender_title : ''}`,
    [email.sender_email, email.sender_phone].filter(Boolean).join(' · '),
    '',
    email.company_address || '',
    textOptOut,
  ].filter((l) => l !== undefined).join('\n').replace(/\n{3,}/g, '\n\n').trim();

  return { html, text };
}

export default buildEmail;
