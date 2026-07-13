// Renders the GAELWORX audit PDF for a lead. No email build, no delivery payload.
// Usage: node scripts/render-pdf.js <input.json>
// Input shape: { brief?: { date? }, lead: { name, url, audit: {...} } }
// Stdout: JSON { ok, base, auditPath, pdfPath, htmlPath, bytes, tier, base64 }
import { renderAuditToPdf } from '../src/renderKit.js';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'lead';

const inPath = process.argv[2];
if (!inPath) { console.error('usage: node scripts/render-pdf.js <input.json>'); process.exit(1); }

const input = JSON.parse(await readFile(inPath, 'utf8'));
const brief = input.brief || {};
const lead  = input.lead  || input;
const base  = slug(lead.name);
const today = brief.date || new Date().toISOString().slice(0, 10);

const audit = { ...(lead.audit || {}) };
audit.business = audit.business || { name: lead.name, url: lead.url };
audit.meta     = audit.meta     || {
  ref:  `${base.slice(0, 8).toUpperCase()}-${today.replace(/-/g, '')}`,
  date: today,
};

await mkdir(join(ROOT, 'out'), { recursive: true });
const auditPath = join(ROOT, 'out', `${base}.audit.json`);
const pdfPath   = join(ROOT, 'out', `${base}.pdf`);

const rendered = await renderAuditToPdf(audit, { auditPath, pdfPath });

console.log(JSON.stringify({
  ok:       true,
  base,
  auditPath,
  pdfPath:  rendered.pdfPath  || pdfPath,
  htmlPath: rendered.htmlPath || null,
  bytes:    rendered.bytes    || 0,
  tier:     rendered.tier     || 'unknown',
  base64:   rendered.base64   || null,
}));
