// Appends a single row to data/leads.jsonl. Avoids shell-quoting issues.
// Usage: node scripts/log-row.js <row.json>
import { addRow } from '../src/ledger.js';
import { readFile } from 'node:fs/promises';

const inPath = process.argv[2];
if (!inPath) { console.error('usage: node scripts/log-row.js <row.json>'); process.exit(1); }

const row = JSON.parse(await readFile(inPath, 'utf8'));
const rec = await addRow(row);
console.log(JSON.stringify({ ok: true, status: rec.status, business: rec.business }));
