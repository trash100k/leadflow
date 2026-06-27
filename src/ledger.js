// Run ledger — dedup + per-lead status tracking for the prospecting wave.
// Append-only JSONL at data/leads.jsonl. One row per lead, tagged by session and
// status (DONE | PITCH_OTHER | SKIP | MANUAL_CONTACT | AGENT_FAILED).
import { appendFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';

const LEDGER = new URL('../data/leads.jsonl', import.meta.url).pathname;

export function normalizeDomain(url = '') {
  return String(url)
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .trim()
    .toLowerCase();
}

const normName = (s = '') => String(s).trim().toLowerCase().replace(/\s+/g, ' ');

export async function readLedger() {
  if (!existsSync(LEDGER)) return [];
  const raw = await readFile(LEDGER, 'utf8');
  return raw.split('\n').filter(Boolean).map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

// Already seen by domain OR business name (matches the Wave dedup logic).
export async function seenBefore(url, name) {
  const rows = await readLedger();
  const d = normalizeDomain(url);
  const n = normName(name);
  return rows.some((r) => (d && normalizeDomain(r.url) === d) || (n && normName(r.business) === n));
}

export async function addRow(row) {
  await mkdir(dirname(LEDGER), { recursive: true });
  const rec = { ...row, logged_at: new Date().toISOString() };
  await appendFile(LEDGER, JSON.stringify(rec) + '\n');
  return rec;
}

export async function counts() {
  const rows = await readLedger();
  const by = {};
  for (const r of rows) by[r.status] = (by[r.status] || 0) + 1;
  return { total: rows.length, ...by, DONE: by.DONE || 0 };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , cmd, ...rest] = process.argv;
  if (cmd === 'add') {
    const row = JSON.parse(rest.join(' '));
    const rec = await addRow(row);
    console.log('logged', rec.status, rec.business);
  } else if (cmd === 'seen') {
    console.log(await seenBefore(rest[0], rest.slice(1).join(' ')));
  } else if (cmd === 'count') {
    console.log(JSON.stringify(await counts(), null, 2));
  } else {
    console.log('usage: ledger.js add <json> | seen <url> <name> | count');
  }
}
