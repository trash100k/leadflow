// DEPRECATED for the Claude Code + MCP delivery path.
// Use scripts/deliver.js instead — it does the same email build plus optional PDF
// render and pre-builds the Attio note, all to stdout with no file writes.
//
// This file is kept for the n8n delivery path (reads out/<slug>.delivery.json).
// Builds GAELWORX email HTML + delivery payload for a lead. No PDF re-render.
// Usage: node scripts/build-delivery.js <input.json> <report_url>
// Input: { brief?: {...}, lead: { name, url, email, draft: {subject, paragraphs} } }
// report_url overrides lead.report_url.
// Stdout: JSON { ok, sendTo, subject, deliveryPath }
// Writes: out/<slug>.delivery.json
import { buildEmail } from '../src/emailTemplate.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'lead';

const [,, inPath, reportUrl] = process.argv;
if (!inPath) { console.error('usage: node scripts/build-delivery.js <input.json> <report_url>'); process.exit(1); }

const input    = JSON.parse(await readFile(inPath, 'utf8'));
const brief    = input.brief || {};
const lead     = input.lead  || input;
const em       = lead.draft  || {};
const base     = slug(lead.name);
const finalUrl = reportUrl || lead.report_url || '';

const { html: htmlBody, text: textBody } = buildEmail({
  paragraphs:          em.paragraphs || [],
  sender_name:         brief.sender_name         || 'Zach',
  sender_title:        brief.sender_title        || 'Founder',
  sender_email:        brief.sender_email        || 'zach@gaelworx.com',
  sender_phone:        brief.sender_phone        || '(369) 212-1203',
  report_url:          finalUrl,
  report_cta:          em.report_cta             || 'View your free website report card',
  cta_mailto:          em.cta_mailto             || brief.cta_mailto   || '',
  cta_subject:         em.cta_subject            || brief.cta_subject  || '',
  cta_label:           em.cta_label              || brief.cta_label    || '',
  company_address:     brief.company_address,
  unsubscribe_url:     brief.unsubscribe_url,
  unsubscribe_mailto:  brief.unsubscribe_mailto  || brief.sender_email || 'zach@gaelworx.com',
  calendar_url:        brief.calendar_url,
});

const payload = {
  mode:       brief.mode || 'draft',
  sendTo:     lead.email,
  subject:    em.subject || `A quick look at ${lead.name} online`,
  htmlBody,
  textBody,
  report_url: finalUrl,
  business:   lead.name,
  url:        lead.url,
};

await mkdir(join(ROOT, 'out'), { recursive: true });
const deliveryPath = join(ROOT, 'out', `${base}.delivery.json`);
await writeFile(deliveryPath, JSON.stringify(payload, null, 2));

console.log(JSON.stringify({ ok: true, sendTo: payload.sendTo, subject: payload.subject, deliveryPath }));
