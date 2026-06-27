// Per-lead rundown — a clean human summary of the audit for the CRM (Attio note),
// internal review, or anywhere a readable digest of the lead is useful.
import { DIMENSIONS, computeGrade } from './reportCard.js';

// input: { lead:{name,url,email,route,manual_contact}, audit:{scores,top_findings,
//          competitors,bottom_line}, brief:{geo,industry,sender_name},
//          report_url?, email_subject? }
export function buildRundown(input = {}) {
  const lead = input.lead || {};
  const audit = input.audit || lead.audit || {};
  const brief = input.brief || {};
  const scores = audit.scores || {};
  const { average, grade } = computeGrade(scores);

  const line = (label, val) => (val ? `${label}: ${val}` : null);
  const L = [];

  L.push(`# ${lead.name || 'Lead'} — ${grade} (${average}/10)`);
  L.push('');
  L.push([
    line('Website', lead.url),
    line('Route', lead.route),
    line('Contact', lead.manual_contact ? 'none found (manual)' : lead.email),
    line('Market', brief.geo),
    line('Industry', brief.industry),
  ].filter(Boolean).join('  ·  '));
  if (input.report_url) L.push(`Report card: ${input.report_url}`);
  L.push('');

  // Scores
  L.push('## Scorecard');
  for (const d of DIMENSIONS) {
    const e = scores[d.key];
    if (!e || typeof e.score !== 'number') continue;
    const v = `${d.verified ? '✓' : ' '} ${d.label}: ${e.score}/10${e.note ? ` — ${e.note}` : ''}`;
    L.push(`- ${v}`);
  }
  L.push('');

  // Findings
  const findings = (audit.top_findings || []).slice(0, 4);
  if (findings.length) {
    L.push('## Top findings');
    findings.forEach((f) => L.push(`- ${f}`));
    L.push('');
  }

  // Competitors
  const comps = (audit.competitors || []).slice(0, 3);
  if (comps.length) {
    L.push('## Competitors');
    comps.forEach((c) => L.push(`- ${c.name || 'Competitor'}${c.url ? ` (${c.url})` : ''}${c.edge ? ` — ${c.edge}` : ''}`));
    L.push('');
  }

  if (audit.bottom_line) {
    L.push('## Bottom line');
    L.push(audit.bottom_line);
    L.push('');
  }

  if (input.email_subject || (lead.draft && lead.draft.subject)) {
    L.push('## Outreach');
    L.push(`Subject: ${input.email_subject || lead.draft.subject}`);
    if (brief.sender_name) L.push(`From: ${brief.sender_name} (GAELWORX)`);
  }

  return L.join('\n').trim();
}

export default buildRundown;

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFile } = await import('node:fs/promises');
  const inPath = process.argv[2];
  if (!inPath) { console.error('usage: node src/rundown.js <lead.json>'); process.exit(1); }
  const input = JSON.parse(await readFile(inPath, 'utf8'));
  // Accept either {brief,lead} or a flat lead object.
  const norm = input.lead ? { lead: input.lead, audit: input.lead.audit, brief: input.brief, report_url: input.lead.report_url }
                          : { lead: input, audit: input.audit };
  console.log(buildRundown(norm));
}
