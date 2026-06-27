// Batch the deterministic half of a wave: for a file of qualified leads, render
// each AUDIT lead's PDF + email into a delivery payload and log every lead to the
// ledger. The LLM half (discover / audit / write email — done by Claude Code per
// lead following the prompts/) produces the input file; this turns it into
// ready-to-deliver payloads. Delivery itself is one execute_workflow call per
// payload against the n8n "GAELWORX Draft Delivery" workflow.
//
// Input file: { "brief": {...}, "leads": [ { route, name, url, email, audit, email{...} }, ... ] }
// Usage: node src/runWave.js <wave.json>
import { prepareLead } from './prepare.js';
import { closeBrowser } from './render.js';
import { addRow, seenBefore } from './ledger.js';
import { readFile } from 'node:fs/promises';

const inPath = process.argv[2];
if (!inPath) { console.error('usage: node src/runWave.js <wave.json>'); process.exit(1); }

const { brief = {}, leads = [] } = JSON.parse(await readFile(inPath, 'utf8'));
const session = brief.session_id || `sess_${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}`;
const summary = { session, total: leads.length, prepared: [], DONE_READY: 0, PITCH_OTHER: 0, SKIP: 0, MANUAL_CONTACT: 0, DUPLICATE: 0, ERROR: 0 };

for (const lead of leads) {
  try {
    if (await seenBefore(lead.url, lead.name)) {
      summary.DUPLICATE++;
      continue;
    }
    if (lead.route === 'PITCH_OTHER') {
      await addRow({ session_id: session, status: 'PITCH_OTHER', business: lead.name, url: lead.url, email: lead.email || '' });
      summary.PITCH_OTHER++;
    } else if (lead.route === 'SKIP') {
      await addRow({ session_id: session, status: 'SKIP', business: lead.name, url: lead.url, skip_reason: lead.skip_reason || '' });
      summary.SKIP++;
    } else if (lead.route === 'AUDIT' && (!lead.email || lead.manual_contact)) {
      await addRow({ session_id: session, status: 'MANUAL_CONTACT', business: lead.name, url: lead.url });
      summary.MANUAL_CONTACT++;
    } else if (lead.route === 'AUDIT') {
      const res = await prepareLead({ brief: { ...brief, session_id: session }, lead });
      summary.prepared.push({ business: lead.name, sendTo: res.sendTo, delivery: `out/${res.base}.delivery.json` });
      summary.DONE_READY++;
      // Note: ledger DONE row is written after the draft is created via n8n.
    }
  } catch (e) {
    await addRow({ session_id: session, status: 'ERROR', business: lead.name, url: lead.url, error: String(e.message || e) });
    summary.ERROR++;
  }
}

await closeBrowser();
console.log(JSON.stringify(summary, null, 2));
