// Read a rendered audit.json (kit schema) and emit the Attio payload pieces:
// company description, note title, note markdown (with report link). Keeps the
// CRM note faithful to the real audit data (no transcription).
// Usage: node scripts/attio-prep.js <fileBase> <email> <route>
import { readFile } from 'node:fs/promises';

const RAWBASE = 'https://raw.githubusercontent.com/trash100k/leadflow/main/reports';
const [, , fileBase, email = '', route = 'AUDIT'] = process.argv;

function gradeFromAvg(a) {
  if (a >= 9) return 'A'; if (a >= 8) return 'A-'; if (a >= 7) return 'B'; if (a >= 6) return 'B-';
  if (a >= 5) return 'C'; if (a >= 4.3) return 'C-'; if (a >= 3.5) return 'D+'; if (a >= 2.5) return 'D'; return 'F';
}

const a = JSON.parse(await readFile(new URL(`../out/${fileBase}.audit.json`, import.meta.url), 'utf8'));
const s = a.scores;
const avg = Math.round((Object.values(s).reduce((x, y) => x + y, 0) / Object.values(s).length) * 10) / 10;
const grade = gradeFromAvg(avg);
const domain = String(a.business.url).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
const report_url = route === 'AUDIT' ? `${RAWBASE}/${fileBase}.pdf` : '';
const flags = (a.flags || []).join(', ') || 'none';

const description = `GAELWORX audit: ${grade} (${avg}/10) · ${route} · Tulsa landscaper. Flags: ${flags}.`
  + (a.costing?.[0] ? ` Top issue: ${a.costing[0].title}` : '')
  + (report_url ? ` Report: ${report_url}` : '');

const cost = (a.costing || []).slice(0, 3).map((c) => `- **${c.title}** ${c.detail}`).join('\n');
const note_md = [
  `## GAELWORX Website Audit — ${grade} (${avg}/10)`,
  `**${a.business.name}** · ${a.business.url} · ${a.local?.rating || '?'}★ (${a.local?.reviews ?? '?'} reviews) · Route: **${route}**`,
  report_url ? `\n[**Report card (PDF)**](${report_url})\n` : '',
  `### Scorecard`,
  `Verified — Design ${s.design} · Mobile ${s.mobile} · Technical SEO ${s.tech_seo} · CRO ${s.cro}`,
  `Reasoned — Local SEO ${s.local_seo} · Content/E-E-A-T ${s.content_eeat} · AEO ${s.aeo} · GEO ${s.geo} · Agentic ${s.agentic} · Accessibility ${s.accessibility}`,
  `Flags: ${flags}`,
  ``,
  `### What's costing leads`,
  cost,
  ``,
  `### Bottom line`,
  a.bottom_line || '',
].filter((x) => x !== undefined).join('\n');

console.log(JSON.stringify({
  name: a.business.name, domain, email, route, grade, avg, report_url,
  note_title: `GAELWORX Website Audit — ${grade} (${avg}/10)`,
  description, note_md,
}));
