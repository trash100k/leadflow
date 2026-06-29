// n8n delivery path: finished lead -> PDF render + delivery payload files.
// For the Claude Code + MCP path use scripts/deliver.js instead (stdout only, no delivery.json).
//
// Bridge: a finished lead (real-schema audit + written email) -> rendered PDF
// (via the official GAELWORX kit) + delivery payload. Writes out/<slug>.audit.json,
// out/<slug>.pdf, and out/<slug>.delivery.json.
//
// Input file shape:
// {
//   "brief": { sender_name, sender_title?, sender_email?, sender_phone?, geo, industry, date?,
//              mode?('draft'|'send'), company_address?, unsubscribe_url?|unsubscribe_mailto? },
//   "lead":  {
//     route, name, url, email, manual_contact?,   // email = recipient ADDRESS
//     report_url?,                                 // hosted report card link (first touch)
//     audit: { ...FULL object matching audit-kit/.../audit_schema.json... },
//     draft: { subject, paragraphs[], report_cta? }   // the written email
//   }
// }
//
// Usage: node src/prepare.js <lead.json>
import { renderAuditToPdf } from './renderKit.js';
import { buildEmail } from './emailTemplate.js';
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

  const base = slug(lead.name);
  const today = brief.date || new Date().toISOString().slice(0, 10);

  // 1) Assemble a valid audit object (real kit schema) and render via render_report.py.
  //    lead.audit is expected to be the full schema; fill meta/business if absent.
  const audit = { ...(lead.audit || {}) };
  audit.business = audit.business || { name: lead.name, url: lead.url };
  audit.meta = audit.meta || { ref: `${base.slice(0, 8).toUpperCase()}-${today.replace(/-/g, '')}`, date: today };

  const outDir = new URL('../out/', import.meta.url);
  await mkdir(outDir, { recursive: true });
  const auditPath = new URL(`../out/${base}.audit.json`, import.meta.url).pathname;
  const pdfPath = new URL(`../out/${base}.pdf`, import.meta.url).pathname;
  const rendered = await renderAuditToPdf(audit, { auditPath, pdfPath });

  // 2) Wrap the email. `lead.email` is the recipient; `lead.draft` is the written
  //    content. First touch links to the hosted report (lead.report_url).
  const em = lead.draft || {};
  const { html: htmlBody, text: textBody } = buildEmail({
    paragraphs: em.paragraphs || [],
    sender_name: brief.sender_name,
    sender_title: brief.sender_title,
    sender_email: brief.sender_email,
    sender_phone: brief.sender_phone,
    report_url: lead.report_url || em.report_url || '',
    report_cta: em.report_cta,
    company_address: brief.company_address,
    unsubscribe_url: brief.unsubscribe_url,
    unsubscribe_mailto: brief.unsubscribe_mailto || brief.sender_email,
  });

  // 3) Delivery payload (Attio link / AgentMail / n8n all consume this).
  const payload = {
    mode: brief.mode || 'draft',
    sendTo: lead.email,
    subject: em.subject || `A quick look at ${lead.name} online`,
    htmlBody,
    textBody,
    report_url: lead.report_url || em.report_url || '',
    filename: `GAELWORX-Report-${base}.pdf`,
    pdf_base64: rendered.base64,
    business: lead.name,
    url: lead.url,
  };

  const deliveryPath = new URL(`../out/${base}.delivery.json`, import.meta.url).pathname;
  await writeFile(deliveryPath, JSON.stringify(payload, null, 2));

  return {
    deliveryPath, auditPath, base,
    pdfPath: rendered.pdfPath, htmlPath: rendered.htmlPath, bytes: rendered.bytes, tier: rendered.tier,
    sendTo: payload.sendTo, subject: payload.subject,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inPath = process.argv[2];
  if (!inPath) { console.error('usage: node src/prepare.js <lead.json>'); process.exit(1); }
  const input = JSON.parse(await readFile(inPath, 'utf8'));
  const res = await prepareLead(input);
  console.log(JSON.stringify({
    ok: true, business: input.lead.name, sendTo: res.sendTo, subject: res.subject, render: res.tier,
    pdf: res.pdfPath ? `out/${res.base}.pdf (${res.bytes} bytes)` : `out/${res.base}.html (html-only)`,
    audit: `out/${res.base}.audit.json`, delivery: `out/${res.base}.delivery.json`,
  }, null, 2));
}
