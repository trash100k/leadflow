// Per-lead delivery prep for the Claude Code + MCP path.
//
// Builds the GAELWORX email and (when lead.audit is present) renders the PDF.
// Emits a single JSON object to stdout — no files written except the PDF itself.
// Claude Code reads the JSON and drives all MCP calls atomically per lead:
//
//   node scripts/deliver.js <lead.json> [brief.json]
//   → stdout: { ok, sendTo, subject, htmlBody, textBody, rundown, business, url, pdfPath? }
//
// Claude Code then, for THIS lead before moving to the next:
//   1. mcp__Gmail__create_draft(sendTo, subject, htmlBody, textBody)    ┐ parallel
//   2. mcp__Attio__upsert-record(domain)                                ┘
//   → have draft_id and attio_id
//   3. mcp__Attio__create-note(attio_id, rundown)                       ┐ parallel
//   4. mcp__Attio__create-task(attio_id)                                ┘
//   5. node scripts/log-row.js {business,email,status:'DONE',draft_id,attio_id}
//
// Input shape for lead.json:
// {
//   "brief"?: { sender_name, sender_title, sender_email, sender_phone,
//               cta_mailto, cta_subject, cta_label, unsubscribe_mailto,
//               calendar_url, company_address, mode },
//   "lead": {
//     "name": "Acme Solar",
//     "url":  "https://acmesolar.com",
//     "email": "owner@acmesolar.com",
//     "audit"?: { scores:{...}, top_findings:[...], competitors:[...], bottom_line:"..." },
//     "draft": { "subject": "...", "paragraphs": ["...", "..."] }
//   }
// }
//
// brief.json (second arg, optional) is the canonical sender config — values in
// lead.json's brief field override it so per-lead overrides are still possible.
import { buildEmail } from '../src/emailTemplate.js';
import { buildRundown } from '../src/rundown.js';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const slug  = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'lead';

const [,, inPath, briefPath] = process.argv;
if (!inPath) {
  console.error('usage: node scripts/deliver.js <lead.json> [brief.json]');
  process.exit(1);
}

const input     = JSON.parse(await readFile(inPath, 'utf8'));
const briefFile = briefPath ? JSON.parse(await readFile(briefPath, 'utf8')) : {};

// brief.json is the base; lead.json's brief field overrides.
const brief = { ...briefFile, ...(input.brief || {}) };
const lead  = input.lead || input;
const em    = lead.draft || {};
const base  = slug(lead.name);

// ── PDF render (only when full audit data is present) ────────────────────────
let pdfPath = null;
if (lead.audit) {
  const { renderAuditToPdf } = await import('../src/renderKit.js');
  const today = brief.date || new Date().toISOString().slice(0, 10);
  const audit = { ...(lead.audit) };
  audit.business = audit.business || { name: lead.name, url: lead.url };
  audit.meta     = audit.meta     || {
    ref:  `${base.slice(0, 8).toUpperCase()}-${today.replace(/-/g, '')}`,
    date: today,
  };
  await mkdir(join(ROOT, 'out'), { recursive: true });
  const rendered = await renderAuditToPdf(audit, {
    auditPath: join(ROOT, 'out', `${base}.audit.json`),
    pdfPath:   join(ROOT, 'out', `${base}.pdf`),
  });
  pdfPath = rendered.pdfPath || null;
}

// ── Email build ───────────────────────────────────────────────────────────────
const { html: htmlBody, text: textBody } = buildEmail({
  paragraphs:         em.paragraphs || [],
  sender_name:        brief.sender_name        || 'Zach',
  sender_title:       brief.sender_title       || 'Founder',
  sender_email:       brief.sender_email       || 'zach@gaelworx.com',
  sender_phone:       brief.sender_phone       || '(369) 212-1203',
  report_url:         lead.report_url          || em.report_url  || '',
  report_cta:         em.report_cta            || 'View your free website report card',
  cta_mailto:         em.cta_mailto            || brief.cta_mailto  || '',
  cta_subject:        em.cta_subject           || brief.cta_subject || '',
  cta_label:          em.cta_label             || brief.cta_label   || '',
  company_address:    brief.company_address,
  unsubscribe_url:    brief.unsubscribe_url,
  unsubscribe_mailto: brief.unsubscribe_mailto || brief.sender_email || 'zach@gaelworx.com',
  calendar_url:       brief.calendar_url,
});

// ── Attio note content (pre-built so Claude Code doesn't have to reconstruct) ─
const rundown = buildRundown({
  lead,
  audit:         lead.audit,
  brief,
  report_url:    lead.report_url || '',
  email_subject: em.subject,
});

// ── Emit single JSON blob ─────────────────────────────────────────────────────
const out = {
  ok:       true,
  business: lead.name,
  url:      lead.url,
  sendTo:   lead.email,
  subject:  em.subject || `A quick look at ${lead.name} online`,
  htmlBody,
  textBody,
  rundown,
};
if (pdfPath) out.pdfPath = pdfPath;

console.log(JSON.stringify(out));
