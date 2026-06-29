// Push a finished lead into Attio (CRM): assert a company record (name + domain),
// optionally set mapped custom attributes (grade / status / report link), and attach
// a Note containing the full rundown. Uses Node's global fetch (this runs in Claude
// Code's environment, which has network — unlike an n8n Code node).
//
// Config via env:
//   ATTIO_API_KEY     (required) — Bearer token from Attio (Settings → Developers).
//   ATTIO_OBJECT      object slug to write to (default "companies").
//   ATTIO_MATCH_ATTR  attribute to dedupe/assert on (default "domains").
//   ATTIO_FIELDS_JSON optional map of our keys -> your attribute slugs, e.g.
//                     {"grade":"gaelworx_grade","status":"lead_status","report":"report_url","score":"gaelworx_score"}
//                     Omit to only set standard name/domains + the rundown note.
//
// Usage: node src/attio.js <lead.json>   (same shape prepare.js consumes)
import { buildRundown } from './rundown.js';
import { computeGrade } from './reportCard.js';
import { normalizeDomain } from './ledger.js';

const API = 'https://api.attio.com/v2';

function cfg() {
  const key = process.env.ATTIO_API_KEY;
  if (!key) throw new Error('ATTIO_API_KEY not set — cannot push to Attio.');
  let fields = {};
  if (process.env.ATTIO_FIELDS_JSON) {
    try { fields = JSON.parse(process.env.ATTIO_FIELDS_JSON); } catch { /* ignore */ }
  }
  return {
    key,
    object: process.env.ATTIO_OBJECT || 'companies',
    matchAttr: process.env.ATTIO_MATCH_ATTR || 'domains',
    fields,
  };
}

async function api(path, method, body, key) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Attio ${method} ${path} -> ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

// Assert (create-or-update) a record, matching on matchAttr so re-runs don't dupe.
export async function assertRecord({ name, domain, extraValues = {} }, c = cfg()) {
  const values = { ...extraValues };
  if (name) values.name = name;
  if (domain) values.domains = [domain];
  const out = await api(
    `/objects/${c.object}/records?matching_attribute=${encodeURIComponent(c.matchAttr)}`,
    'PUT',
    { data: { values } },
    c.key,
  );
  return out?.data?.id?.record_id;
}

export async function addNote({ recordId, title, content }, c = cfg()) {
  const out = await api('/notes', 'POST', {
    data: { parent_object: c.object, parent_record_id: recordId, title, format: 'plaintext', content },
  }, c.key);
  return out?.data?.id?.note_id;
}

export async function addTask({ recordId, content, assigneeId }, c = cfg()) {
  const data = { content };
  if (assigneeId) data.assignees = [{ referenced_actor_type: 'workspace-member', referenced_actor_id: assigneeId }];
  if (recordId) data.linked_records = [{ target_object: c.object, target_record_id: recordId }];
  const out = await api('/tasks', 'POST', { data }, c.key);
  return out?.data?.id?.task_id;
}

// input: { brief, lead } (prepare.js shape) + optional report_url on lead
export async function pushLead(input = {}) {
  const c = cfg();
  const lead = input.lead || {};
  const audit = lead.audit || {};
  const brief = input.brief || {};
  const domain = normalizeDomain(lead.url);
  const { average, grade } = computeGrade(audit.scores || {});

  // Map optional custom attributes if the workspace has them configured.
  const extraValues = {};
  const f = c.fields;
  if (f.grade) extraValues[f.grade] = grade;
  if (f.score) extraValues[f.score] = average;
  if (f.status) extraValues[f.status] = lead.route || 'AUDIT';
  if (f.report && lead.report_url) extraValues[f.report] = lead.report_url;
  if (f.email && lead.email) extraValues[f.email] = lead.email;

  const recordId = await assertRecord({ name: lead.name, domain, extraValues }, c);

  const content = buildRundown({
    lead, audit, brief,
    report_url: lead.report_url,
    email_subject: lead.draft && lead.draft.subject,
  });
  const noteId = await addNote({
    recordId,
    title: `GAELWORX audit — ${grade} (${average}/10)`,
    content,
  }, c);

  return { recordId, noteId, grade, average };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFile } = await import('node:fs/promises');
  const inPath = process.argv[2];
  if (!inPath) { console.error('usage: node src/attio.js <lead.json>'); process.exit(1); }
  const input = JSON.parse(await readFile(inPath, 'utf8'));
  const res = await pushLead(input);
  console.log(JSON.stringify({ ok: true, ...res }, null, 2));
}
