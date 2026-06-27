// Bridge: a finished lead (audit + written email) -> delivery payload for the
// n8n Gmail draft node. Renders the GAELWORX report card to PDF natively, wraps
// the email in the on-brand template, and writes out/<slug>.delivery.json.
//
// Input file shape:
// {
//   "brief": { sender_name, sender_title?, sender_email?, sender_phone?, geo, industry, date? },
//   "lead":  {
//     route, name, url, email, manual_contact?,   // email = recipient ADDRESS
//     audit: { ...see audit-rubric.md... },
//     draft: { subject, paragraphs[], attachment_label? }   // the written email
//   }
// }
//
// Usage: node src/prepare.js <lead.json>
import { buildReportCard } from './reportCard.js';
import { buildEmail } from './emailTemplate.js';
import { renderToFile, closeBrowser } from './render.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const slug = (s = '') =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'lead';

export async function prepareLead(input) {
  const brief = input.brief || {};
  const lead = input.lead || {};
  if (lead.route !== 'AUDIT') {
    throw new Error(`prepare only handles route=AUDIT (got ${lead.route})`);
  }
  if (!lead.email || lead.manual_contact) {
    throw new Error('no verified contact email — log MANUAL_CONTACT instead of preparing a draft');
  }

  const audit = { business: lead.name, url: lead.url, ...(lead.audit || {}) };
  const date = brief.date || new Date().toISOString().slice(0, 10);

  // 1) Render the branded PDF natively.
  const outDir = new URL('../out/', import.meta.url);
  await mkdir(outDir, { recursive: true });
  const base = slug(lead.name);
  const pdfPath = new URL(`../out/${base}.pdf`, import.meta.url).pathname;
  const html = buildReportCard(audit, { ...brief, date });
  const { base64, bytes } = await renderToFile(html, pdfPath);

  // 2) Wrap the email. `lead.email` is the recipient address; `lead.draft` is the
  // written content (subject + paragraphs).
  const em = lead.draft || {};
  const { html: htmlBody, text: textBody } = buildEmail({
    paragraphs: em.paragraphs || [],
    sender_name: brief.sender_name,
    sender_title: brief.sender_title,
    sender_email: brief.sender_email,
    sender_phone: brief.sender_phone,
    attachment_label: em.attachment_label || 'your GAELWORX website report card (PDF)',
  });

  // 3) Delivery payload for the n8n Gmail draft node.
  const payload = {
    sendTo: lead.email,
    subject: em.subject || `A quick look at ${lead.name} online`,
    htmlBody,
    textBody,
    filename: `GAELWORX-Report-${base}.pdf`,
    pdf_base64: base64,
    business: lead.name,
    url: lead.url,
  };

  const deliveryPath = new URL(`../out/${base}.delivery.json`, import.meta.url).pathname;
  await writeFile(deliveryPath, JSON.stringify(payload, null, 2));

  return { deliveryPath, pdfPath, bytes, base, sendTo: payload.sendTo, subject: payload.subject };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inPath = process.argv[2];
  if (!inPath) { console.error('usage: node src/prepare.js <lead.json>'); process.exit(1); }
  const input = JSON.parse(await readFile(inPath, 'utf8'));
  const res = await prepareLead(input);
  await closeBrowser();
  // Print only a summary — the base64 lives in the delivery.json, not stdout.
  console.log(JSON.stringify({
    ok: true, business: input.lead.name, sendTo: res.sendTo, subject: res.subject,
    pdf: `out/${res.base}.pdf (${res.bytes} bytes)`, delivery: `out/${res.base}.delivery.json`,
  }, null, 2));
}
