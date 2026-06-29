// One-shot Attio push via REST API — no MCP, no ToolSearch, no approval prompts.
// Replaces the three separate mcp__Attio__ calls (upsert-record, create-note, create-task).
//
// Usage: node scripts/push-attio.js <deliver-output.json> <draft_id>
//
//   deliver-output.json: stdout from scripts/deliver.js (contains business, url, rundown, subject)
//   draft_id:            Gmail draft ID returned by mcp__Gmail__create_draft
//
// Requires: ATTIO_API_KEY in .env or environment.
// Output:   { ok, attio_id, note_id, task_id }
//
// After this script completes, run scripts/log-row.js with the combined result.
import { assertRecord, addNote, addTask } from '../src/attio.js';
import { normalizeDomain } from '../src/ledger.js';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Load .env if present (no external deps — plain key=value parsing).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(ROOT, '.env');
if (existsSync(envPath)) {
  const lines = (await readFile(envPath, 'utf8')).split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const [,, deliverPath, draftId] = process.argv;
if (!deliverPath || !draftId) {
  console.error('usage: node scripts/push-attio.js <deliver-output.json> <draft_id>');
  process.exit(1);
}

const d = JSON.parse(await readFile(deliverPath, 'utf8'));
const domain = normalizeDomain(d.url);

// Attio assignee — Zachary Isaacson (workspace member). Override via ATTIO_ASSIGNEE_ID env.
const assigneeId = process.env.ATTIO_ASSIGNEE_ID || 'e40f1558-3a31-48a1-b15d-784299e0d97f';

// 1. Upsert company record (dedupes on domain).
const attio_id = await assertRecord({ name: d.business, domain });

// 2. Audit note (rundown pre-built by deliver.js).
const noteTitle = `GAELWORX audit — ${d.subject.slice(0, 80)}`;
const noteContent = [
  d.rundown || '',
  '',
  `Outreach email: ${d.subject}`,
  `Draft ID: ${draftId}`,
  `Sent to: ${d.sendTo}`,
].join('\n').trim();

const note_id = await addNote({ recordId: attio_id, title: noteTitle, content: noteContent });

// 3. Review task assigned to Zach.
const task_id = await addTask({
  recordId:   attio_id,
  content:    `Review GAELWORX audit / send outreach — ${d.business}`,
  assigneeId,
});

console.log(JSON.stringify({ ok: true, attio_id, note_id, task_id }));
