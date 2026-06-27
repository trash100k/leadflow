// On-brand HTML email wrapper for GAELWORX cold outreach.
// Deliverability-first: light background, simple structure, a restrained brand
// signature (the brutalist heavy-metal styling stays in the attached PDF). The
// AI writes the subject + body paragraphs per lead; this only wraps them.

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
//   paragraphs: string[],        // AI-written body, one entry per paragraph
//   sender_name, sender_title?,  // signature
//   sender_email?, sender_phone?,
//   attachment_label?            // e.g. "your GAELWORX report card (PDF)"
// }
export function buildEmail(email = {}) {
  const paras = (email.paragraphs || []).filter(Boolean);
  const sender = esc(email.sender_name || 'The GAELWORX team');
  const title = email.sender_title ? esc(email.sender_title) : 'GAELWORX';
  const contactBits = [
    email.sender_email ? esc(email.sender_email) : null,
    email.sender_phone ? esc(email.sender_phone) : null,
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  const htmlParas = paras.map((p) => `<p style="margin:0 0 16px;">${esc(p)}</p>`).join('\n');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <div style="max-width:560px;margin:0 auto;padding:28px 24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:${INK};background:#ffffff;">
    ${htmlParas}
    <div style="margin-top:28px;padding-top:18px;border-top:2px solid ${CELTIC_BLOOD};">
      <div style="font-weight:700;color:${INK};">${sender}</div>
      <div style="font-size:13px;color:${ASH};letter-spacing:0.06em;text-transform:uppercase;margin-top:2px;">
        <span style="color:${CELTIC_BLOOD};font-weight:700;">G<span style="color:${EMBER};">AE</span>LWORX</span> &nbsp;·&nbsp; ${title}
      </div>
      ${contactBits ? `<div style="font-size:13px;color:${ASH};margin-top:4px;">${contactBits}</div>` : ''}
    </div>
    <div style="margin-top:14px;font-size:12px;color:${ASH};">
      ${email.attachment_label ? `📎 Attached: ${esc(email.attachment_label)}` : ''}
    </div>
  </div>
</body></html>`;

  const text = [
    ...paras,
    '',
    `— ${email.sender_name || 'The GAELWORX team'}`,
    `GAELWORX · ${email.sender_title || ''}`.trim(),
    [email.sender_email, email.sender_phone].filter(Boolean).join(' · '),
    email.attachment_label ? `Attached: ${email.attachment_label}` : '',
  ].filter((l) => l !== undefined).join('\n').trim();

  return { html, text };
}

export default buildEmail;
