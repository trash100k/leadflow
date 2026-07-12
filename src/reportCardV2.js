// GAELWORX report card V2 — the HAS_SITE outreach edition.
// Input: the SAME audit.json the official kit consumes (audit-kit schema).
// Output: a 5-page A4 PDF — 2 pages of condensed, prioritized site audit,
// then 3 pages of the GAELWORX arsenal (Web Design as "the fix", Voice
// Agents, Automations, Software, AI Installation · UltraPlan) with one CTA.
// The official kit (render_report.py) stays the source of truth for the full
// deep-dive report; this renderer exists for the sales-forward variant and
// never edits the kit.
//
// Usage: node src/reportCardV2.js <audit.json> <out.pdf> [--html <out.html>]
import { readFile, writeFile } from 'node:fs/promises';
import { renderToFile, closeBrowser } from './render.js';

const BOOKING_URL =
  'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1Tq2Xdj7GjrysRzGq_oitD63iIppkWMOtO7SnsNNweoS6oIckUUlYrAOtUjzbOigiyNpAfEa7x';
const PHONE_DISPLAY = '(369) 212-1203';
const PHONE_TEL = '+13692121203';

const DIM_LABELS = {
  design: 'Design / UX',
  mobile: 'Mobile Experience',
  tech_seo: 'Technical SEO',
  local_seo: 'Local SEO',
  content_eeat: 'Content / E-E-A-T',
  aeo: 'AEO · Answer Engine',
  geo: 'GEO · Generative',
  agentic: 'Agentic Readiness',
  accessibility: 'Accessibility',
  cro: 'CRO',
};

// What the GAELWORX rebuild fixes, per failing dimension (page 3 mapping).
const DIM_FIXES = {
  design: 'Studio-grade rebuild — a mark that drops the visitor’s guard on sight.',
  mobile: 'Mobile-first layout with a sticky click-to-call bar — the call is always one thumb away.',
  tech_seo: 'Clean technical foundation: titles, meta, sitemap, sub-2.5s loads.',
  local_seo: 'Service-area pages + LocalBusiness schema that put you in the map pack.',
  content_eeat: 'Proof-first content — licenses, real jobs, review equity made visible.',
  aeo: 'FAQ + structured answers so ChatGPT and AI Overviews cite YOU.',
  geo: 'Generative-engine visibility baked into every page, not bolted on.',
  agentic: 'A machine-readable business identity (JSON-LD) that AI agents can find, quote, and book.',
  accessibility: 'WCAG AA contrast, alt text, keyboard navigation — no customer turned away.',
  cro: 'Every page routes the visitor to one of two doors: call, or quote.',
};

// Kit-exact grade math (mirrors render_report.py grade_from_avg).
export function gradeFromAvg(a) {
  if (a >= 9) return { grade: 'A', color: '#56c47c' };
  if (a >= 8) return { grade: 'A-', color: '#56c47c' };
  if (a >= 7) return { grade: 'B', color: '#5c93f0' };
  if (a >= 6) return { grade: 'B-', color: '#5c93f0' };
  if (a >= 5) return { grade: 'C', color: '#e0a838' };
  if (a >= 4.3) return { grade: 'C-', color: '#e0a838' };
  if (a >= 3.5) return { grade: 'D+', color: '#e0563a' };
  if (a >= 2.5) return { grade: 'D', color: '#e0563a' };
  return { grade: 'F', color: '#e0563a' };
}

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

const fillClass = (v) => (v >= 7 ? 'fill-hi' : v >= 4 ? 'fill-mid' : 'fill-lo');

function dimBar(key, v) {
  return `<div class="dim"><span class="dn">${esc(DIM_LABELS[key] || key)}</span><span class="track"><i class="${fillClass(v)}" style="width:${v * 10}%"></i></span><span class="sc"><b>${v}</b>/10</span></div>`;
}

// Audit-authored copy (titles/bodies/paragraphs) is trusted content that may
// carry inline markup, exactly as the official kit renders it — insert raw.
function items(list, max) {
  return (list || [])
    .slice(0, max)
    .map(
      (it) =>
        `<div class="item"><span class="k"></span><span class="x"><b>${it.title ?? ''}</b> ${it.body ?? it.detail ?? ''}</span></div>`,
    )
    .join('');
}

function probeBlock(title, probe) {
  const rows = (probe || [])
    .map((p) => {
      const status = String(p.status ?? p.result ?? 'fail');
      const cls = status === 'pass' ? 'ok' : 'no';
      const label = String(p.check ?? p.label ?? '');
      const dots = '.'.repeat(Math.max(2, 34 - label.length));
      return `${esc(label)} ${dots} <span class="${cls}">${esc(status)}</span>`;
    })
    .join('\n');
  return `<div class="codeblock"><span class="c">// ${esc(title)}</span>\n${rows}</div>`;
}

function competitorRows(competitors) {
  const mark = (v) =>
    v === 'yes'
      ? '<td class="chk">✓</td>'
      : v === 'partial'
        ? '<td class="mid">~</td>'
        : v === 'ok'
          ? '<td class="chk">✓</td>'
          : '<td class="x">✕</td>';
  return (competitors || [])
    .map((c) => {
      const cls = c.you ? ' class="you"' : '';
      const name = c.you ? `${esc(c.name)} (you)` : esc(c.name);
      return `<tr${cls}><td class="name">${name}</td><td class="cmp-rating">${esc(c.rating)}★ · ${esc(c.reviews)}</td>${mark(c.mobile_call)}${mark(c.schema)}${mark(c.name_domain)}<td class="${c.you ? 'mid' : 'chk'}">${esc(c.overall)}</td></tr>`;
    })
    .join('');
}

function planTimeline(plan) {
  return `<div class="timeline"><div class="tl-track"></div>${(plan || [])
    .slice(0, 4)
    .map(
      (p, i) =>
        `<div class="tl-step"><div class="tl-dot${p.phase === 'later' ? ' later' : ''}"></div><div class="tl-wk">Week ${i + 1}</div><div class="tl-title">${p.title ?? ''}</div><div class="tl-desc">${p.body ?? p.detail ?? ''}</div></div>`,
    )
    .join('')}</div>`;
}

function mast(sub, ref) {
  return `<div class="mast"><div class="brand"><div class="gx">G<b>A</b><b>E</b>LWORX</div>
  <div class="tag">${esc(sub)}</div></div>
  <div class="mast-cta"><a class="book" href="${BOOKING_URL}">Book a Meeting</a><a class="call" href="tel:${PHONE_TEL}">Call <b>${PHONE_DISPLAY}</b></a></div>
  <div class="doc-meta"><div><span class="lbl">REF</span> ${esc(ref)}</div><div><span class="lbl">CLASS</span> CONFIDENTIAL</div></div></div>
  <div class="hairline"></div>`;
}

function foot(date, n) {
  return `<div class="foot"><div>Generated ${esc(date)} · <span class="fx">Confidential</span></div><div class="pg">PAGE <b>0${n}</b> / 05</div><div>GAELWORX</div></div>`;
}

function ctaBand(line) {
  return `<a class="cal-cta" href="${BOOKING_URL}">
    <div class="cc-l">${line} <b>Book a 15-minute call.</b></div>
    <div class="cc-btn">Grab a time →</div></a>`;
}

// Branch page hero: number, name, tagline, body paragraphs, feature items.
function branch({ no, cat, name, tag, paras, feats }) {
  return `<div class="branch">
    <div class="br-head"><span class="br-no">GW–${no}</span><span class="br-cat">${esc(cat)}</span></div>
    <div class="br-name">${esc(name)}</div>
    <div class="br-tag">${esc(tag)}</div>
    ${paras.map((p) => `<p class="br-p">${p}</p>`).join('')}
    ${feats?.length ? `<div class="br-feats">${feats.map((f) => `<div class="bf"><span class="bf-k">▸</span><span>${f}</span></div>`).join('')}</div>` : ''}
  </div>`;
}

export function buildHtml(audit, opts = {}) {
  const scores = audit.scores || {};
  const vals = Object.values(scores).filter((v) => typeof v === 'number');
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const avg1 = Math.round(avg * 10) / 10;
  const { grade, color } = gradeFromAvg(avg);
  const biz = audit.business || {};
  const meta = audit.meta || {};
  const name = biz.name || 'Your Business';
  const date = meta.date || new Date().toDateString();
  const ref = meta.ref || 'GAELWORX-AUDIT';
  const flags = (audit.flags || [])
    .map((f) => `<span class="flag hot">⚡ ${esc(f)}</span>`)
    .join('');

  // Three worst dimensions drive the page-3 fix mapping.
  const worst = Object.entries(scores)
    .filter(([, v]) => typeof v === 'number')
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);

  const abs = audit.ai_blind_spot || {};

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GAELWORX Report Card — ${esc(name)}</title><style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&display=swap');
  @page { size: A4; margin: 0; }
  :root{
    --void:#0c0d10; --panel:#181b21; --panel-2:#20242b; --steel:#333944; --steel-line:#444b57;
    --ink:#f1f2f4; --ink-2:#cfd4dc; --ink-dim:#a8aeb9; --ink-faint:#838996;
    --forge:#f0641f; --forge-soft:#f6864a; --green:#56c47c; --blue:#5c93f0; --amber:#e0a838; --red:#e0563a;
    --mono:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;
    --serif:"Hoefler Text","Georgia",serif;
    --sans:"Helvetica Neue",Arial,sans-serif;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:var(--void);color:var(--ink);font-family:var(--sans);-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;height:297mm;margin:0 auto;position:relative;overflow:hidden;
    background:radial-gradient(120% 70% at 50% -8%, #16181e 0%, var(--void) 58%);
    padding:16mm 15mm 13mm;page-break-after:always}
  .page:last-child{page-break-after:auto}
  .hairline{height:1px;background:linear-gradient(90deg,transparent,var(--steel-line) 10%,var(--steel-line) 90%,transparent)}
  .mast{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding-bottom:12px}
  .brand .gx{font-family:"Cinzel Decorative","Hoefler Text",var(--serif);font-weight:700;font-size:25px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink)}
  .brand .gx b{color:var(--forge);font-weight:700}
  .brand .tag{font-size:8px;letter-spacing:.30em;text-transform:uppercase;color:var(--ink-faint);margin-top:7px}
  .doc-meta{text-align:right;font-family:var(--mono);font-size:9px;color:var(--ink-dim);line-height:1.8;white-space:nowrap}
  .doc-meta .lbl{color:var(--forge)}
  .mast-cta{display:flex;align-items:center;gap:9px;align-self:center}
  .mast-cta a{text-decoration:none;font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;white-space:nowrap}
  .mast-cta .book{background:var(--forge);color:var(--void);font-weight:bold}
  .mast-cta .call{border:1px solid var(--steel-line);color:var(--ink-2)}
  .mast-cta .call b{color:var(--forge-soft)}
  .target{display:flex;justify-content:space-between;align-items:stretch;gap:16px;margin-top:16px}
  .target .who{flex:1;border:1px solid var(--steel-line);background:var(--panel);padding:18px 20px;position:relative}
  .eyebrow{font-size:9px;letter-spacing:.30em;text-transform:uppercase;color:var(--forge);margin-bottom:10px}
  .biz{font-family:var(--serif);font-size:28px;line-height:1.08;color:var(--ink)}
  .url{font-family:var(--mono);font-size:11px;color:var(--ink-dim);margin-top:9px;word-break:break-all}
  .flags{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}
  .flag{font-family:var(--mono);font-size:9px;letter-spacing:.05em;padding:5px 10px;border:1px solid var(--steel-line);color:var(--ink-2);background:var(--panel-2);text-transform:uppercase}
  .flag.hot{border-color:var(--forge);color:var(--forge-soft)}
  .verdict-box{width:180px;flex:none;border:1px solid var(--steel-line);background:var(--panel);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px 14px}
  .verdict-box .vlabel{font-size:8.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--ink-faint)}
  .grade{font-family:var(--serif);font-size:76px;line-height:.9;font-weight:600;margin:6px 0 4px}
  .avg{font-family:var(--mono);font-size:13px;color:var(--ink-dim)}
  .avg b{color:var(--ink)}
  .sec-h{display:flex;align-items:baseline;gap:13px;margin:24px 0 14px}
  .sec-h .n{font-family:var(--mono);font-size:12px;color:var(--forge)}
  .sec-h .t{font-family:var(--serif);font-size:18px;letter-spacing:.05em;text-transform:uppercase;color:var(--ink)}
  .sec-h .r{flex:1;height:1px;background:var(--steel-line);align-self:center;margin-left:6px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:11px 24px;margin-top:4px}
  .dim{display:flex;align-items:center;gap:11px}
  .dim .dn{font-size:11.5px;color:var(--ink-2);width:142px;flex:none}
  .dim .track{flex:1;height:10px;background:var(--panel-2);border:1px solid var(--steel-line);position:relative;overflow:hidden}
  .dim .track > i{display:block;height:100%}
  .fill-hi{background:var(--green)} .fill-mid{background:var(--amber)} .fill-lo{background:var(--red)}
  .dim .sc{font-family:var(--mono);font-size:11.5px;width:40px;text-align:right;flex:none;color:var(--ink-dim)}
  .dim .sc b{color:var(--ink)}
  .block{border:1px solid var(--steel-line);background:var(--panel);padding:16px 18px;margin-top:4px}
  .block h4{font-size:10px;letter-spacing:.20em;text-transform:uppercase;color:var(--forge);margin-bottom:12px}
  .block.good h4{color:var(--green)}
  .item{display:flex;gap:11px;padding:8px 0;border-bottom:1px dotted var(--steel);font-size:11.5px;line-height:1.5}
  .item:last-child{border-bottom:none}
  .item .k{flex:none;width:6px;height:6px;border-radius:50%;margin-top:5px;background:var(--forge)}
  .block.good .item .k{background:var(--green)}
  .item .x b{color:var(--ink)} .item .x{color:var(--ink-2)}
  .wide{border:1px solid var(--steel-line);background:var(--panel);padding:16px 18px;margin-top:4px}
  .wide .lead{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--forge);margin-bottom:11px}
  .wide p{font-size:12px;line-height:1.6;color:var(--ink-2)}
  .wide p b{color:var(--ink)}
  .wide p + p{margin-top:9px}
  .codeblock{font-family:var(--mono);font-size:10.5px;line-height:1.8;color:var(--ink-2);background:var(--panel-2);border:1px solid var(--steel-line);border-left:3px solid var(--forge);padding:13px 15px;margin-top:11px;white-space:pre-wrap}
  .codeblock .ok{color:var(--green)} .codeblock .no{color:var(--red)} .codeblock .c{color:var(--ink-faint)}
  .cmp-table{width:100%;border-collapse:collapse;margin-top:4px}
  .cmp-table th{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-faint);text-align:center;padding:8px 6px;border-bottom:1px solid var(--steel-line);font-weight:600}
  .cmp-table th.lead-col{text-align:left;color:var(--forge)}
  .cmp-table td{font-size:10px;color:var(--ink-2);text-align:center;padding:9px 6px;border-bottom:1px solid var(--steel)}
  .cmp-table td.name{text-align:left;color:var(--ink);font-size:10.5px}
  .cmp-table tr.you{background:rgba(240,100,31,0.07)}
  .cmp-table tr.you td.name{color:var(--forge-soft);font-weight:700}
  .cmp-table .chk{color:var(--green);font-family:var(--mono)}
  .cmp-table .x{color:var(--red);font-family:var(--mono)}
  .cmp-table .mid{color:var(--amber);font-family:var(--mono)}
  .cmp-rating{font-family:var(--mono);font-size:10px}
  .bottom{border:1px solid var(--forge);background:linear-gradient(180deg,#231711,#16100b);padding:18px 21px;margin-top:14px}
  .bottom .bl{font-family:var(--mono);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--forge);margin-bottom:11px}
  .bottom p{font-family:var(--serif);font-size:13.5px;line-height:1.6;color:var(--ink)}
  .timeline{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:8px;position:relative}
  .tl-track{position:absolute;top:13px;left:6%;right:6%;height:2px;background:var(--steel-line)}
  .tl-step{position:relative;padding:0 8px;text-align:center}
  .tl-dot{width:13px;height:13px;border-radius:50%;background:var(--forge);border:3px solid var(--void);margin:7px auto 0;position:relative;z-index:2}
  .tl-dot.later{background:var(--steel-line)}
  .tl-wk{font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--forge);margin-top:9px}
  .tl-title{font-size:10px;font-weight:700;color:var(--ink);margin-top:4px;line-height:1.25}
  .tl-desc{font-size:8.5px;color:var(--ink-dim);margin-top:4px;line-height:1.4}
  .cal-cta{display:flex;align-items:center;justify-content:space-between;gap:14px;border:1px solid var(--forge);background:linear-gradient(180deg,#231711,#16100b);padding:13px 18px;margin-top:16px;text-decoration:none}
  .cal-cta .cc-l{font-family:var(--serif);font-size:14px;color:var(--ink);line-height:1.25}
  .cal-cta .cc-l b{color:var(--forge-soft);font-weight:600}
  .cal-cta .cc-btn{flex:none;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--void);background:var(--forge);padding:9px 15px;white-space:nowrap}
  .foot{position:absolute;left:15mm;right:15mm;bottom:9mm;display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;color:var(--ink-faint);text-transform:uppercase}
  .foot .pg{color:var(--ink-dim)} .foot .pg b{color:var(--forge)}
  .foot .fx{color:var(--forge)}
  /* ---- arsenal / branch pages ---- */
  .arsenal-intro{font-family:var(--serif);font-size:16px;line-height:1.5;color:var(--ink-2);margin:18px 0 4px;max-width:170mm}
  .arsenal-intro b{color:var(--forge-soft)}
  .branch{border:1px solid var(--steel-line);background:var(--panel);padding:20px 22px;margin-top:14px;position:relative}
  .br-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px}
  .br-no{font-family:var(--mono);font-size:10px;color:var(--steel-line);letter-spacing:.05em}
  .br-cat{font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:var(--forge)}
  .br-name{font-family:var(--serif);font-size:26px;color:var(--ink);line-height:1.1}
  .br-tag{font-size:11px;color:var(--ink-dim);font-style:italic;margin:5px 0 12px}
  .br-p{font-size:12px;line-height:1.62;color:var(--ink-2)}
  .br-p + .br-p{margin-top:8px}
  .br-p b{color:var(--ink)}
  .br-feats{display:grid;grid-template-columns:1fr 1fr;gap:7px 18px;margin-top:13px}
  .bf{display:flex;gap:8px;font-size:10.5px;line-height:1.45;color:var(--ink-2)}
  .bf .bf-k{color:var(--forge);flex:none}
  .fixmap{margin-top:4px}
  .fm-row{display:flex;align-items:center;gap:14px;padding:11px 0;border-bottom:1px dotted var(--steel)}
  .fm-row:last-child{border-bottom:none}
  .fm-dim{flex:none;width:170px}
  .fm-dim .fmd-l{font-size:11px;color:var(--ink-2)}
  .fm-dim .fmd-s{font-family:var(--mono);font-size:10px;margin-top:3px}
  .fm-arrow{flex:none;color:var(--forge);font-family:var(--mono);font-size:13px}
  .fm-fix{font-size:11.5px;line-height:1.5;color:var(--ink-2)}
  .fm-fix b{color:var(--ink)}
  .ultra{border:1px solid var(--forge);background:linear-gradient(180deg,#231711,#120d09);padding:20px 22px;margin-top:14px}
  .ultra .u-cat{font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:var(--forge);margin-bottom:7px}
  .ultra .u-name{font-family:"Cinzel Decorative","Hoefler Text",var(--serif);font-weight:700;font-size:21px;color:var(--ink);letter-spacing:.05em}
  .ultra .u-tag{font-size:11px;color:var(--ink-dim);font-style:italic;margin:6px 0 11px}
  .ultra p{font-size:12px;line-height:1.62;color:var(--ink-2)}
  .ultra p b{color:var(--forge-soft)}
  .u-stack{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:13px}
  .u-cell{border:1px solid var(--steel-line);background:rgba(12,13,16,.55);padding:10px 11px;text-align:center}
  .u-cell .uc-n{font-family:var(--mono);font-size:8px;color:var(--forge);letter-spacing:.1em}
  .u-cell .uc-t{font-size:10px;font-weight:700;color:var(--ink);margin-top:4px;line-height:1.25}
  .forge-foot{text-align:center;font-family:var(--mono);font-size:8.5px;letter-spacing:.12em;color:var(--ink-faint);margin-top:14px}
  .forge-foot b{color:var(--forge)}
</style></head>
<body>

<!-- ============ PAGE 1 — THE SITE REPORT: VERDICT + SCORES + LEAKS ============ -->
<div class="page">
  ${mast('Brand Source of Truth · Automatic Execution · Clan Protected', ref)}
  <div class="target"><div class="who"><div class="eyebrow">Site Audit · ${esc(date)}</div>
    <div class="biz">${esc(name)}</div><div class="url">${esc(biz.url || '')}</div>
    <div class="flags">${flags}</div></div>
  <div class="verdict-box"><div class="vlabel">Overall Grade</div>
    <div class="grade" style="color:${color}">${grade}</div><div class="avg">AVG <b>${avg1}</b> / 10</div></div></div>
  <div class="sec-h"><span class="n">01</span><span class="t">Dimensional Scoring</span><span class="r"></span></div>
  <div class="grid">${Object.keys(DIM_LABELS)
    .filter((k) => typeof scores[k] === 'number')
    .map((k) => dimBar(k, scores[k]))
    .join('')}</div>
  <div class="sec-h"><span class="n">02</span><span class="t">What’s Costing You Leads Now</span><span class="r"></span></div>
  <div class="block">${items(audit.costing, 4)}</div>
  ${foot(date, 1)}
</div>

<!-- ============ PAGE 2 — EVIDENCE: AI BLIND SPOT + COMPETITORS + BOTTOM LINE ============ -->
<div class="page">
  ${mast(`Site Audit Ledger · ${name}`, ref)}
  <div class="sec-h"><span class="n">03</span><span class="t">Your AI Search Blind Spot</span><span class="r"></span></div>
  <div class="wide"><div class="lead">AEO + GEO · How machines read your site</div>
    ${(abs.paragraphs || []).slice(0, 1).map((p) => `<p>${p}</p>`).join('')}
    ${probeBlock('machine-readiness probe — answer & generative engines', abs.probe)}
  </div>
  <div class="sec-h"><span class="n">04</span><span class="t">Local Competitive Position</span><span class="r"></span></div>
  <table class="cmp-table"><thead><tr><th class="lead-col">Business</th><th>Google</th>
    <th>Mobile<br>Call</th><th>Schema /<br>AI-Ready</th><th>Name /<br>Domain</th><th>Overall</th></tr></thead>
    <tbody>${competitorRows(audit.competitors)}</tbody></table>
  <div class="bottom"><div class="bl">◣ The One Thing That Matters Most ◢</div>
    <p>${audit.bottom_line || ''}</p></div>
  ${foot(date, 2)}
</div>

<!-- ============ PAGE 3 — THE FIX: WEB DESIGN, MAPPED TO THEIR WORST DIMS ============ -->
<div class="page">
  ${mast('Four Branches · One Forge', ref)}
  <p class="arsenal-intro">Everything on the last two pages is <b>fixable</b>. GAELWORX exists to fix it — and then to hand you the machines that run the empire after the fires die down.</p>
  ${branch({
    no: '04',
    cat: '01 · The Fix · Web Design',
    name: 'Your Mark, Forged for the Modern Web',
    tag: 'Studio-grade interactive sites engineered to drop the visitor’s guard and route the lead straight to the truck.',
    paras: [
      `A rebuilt <b>${esc(biz.url || 'site')}</b> isn’t a paint job — it’s engineered directly against the gaps in this report. Your three weakest dimensions become the build spec:`,
    ],
    feats: [],
  })}
  <div class="block fixmap">
    <h4>◢ Their weakest dimensions → the build spec</h4>
    ${worst
      .map(
        ([k, v]) =>
          `<div class="fm-row"><div class="fm-dim"><div class="fmd-l">${esc(DIM_LABELS[k])}</div><div class="fmd-s" style="color:${v >= 7 ? '#56c47c' : v >= 4 ? '#e0a838' : '#e0563a'}">${v} / 10</div></div><div class="fm-arrow">→</div><div class="fm-fix">${DIM_FIXES[k] || ''}</div></div>`,
      )
      .join('')}
  </div>
  <div class="sec-h"><span class="n">05</span><span class="t">The 30-Day Plan</span><span class="r"></span></div>
  ${planTimeline(audit.plan)}
  ${ctaBand('Want the whole list handled by week four?')}
  ${foot(date, 3)}
</div>

<!-- ============ PAGE 4 — THE ARSENAL: VOICE AGENTS + AUTOMATIONS ============ -->
<div class="page">
  ${mast('Four Branches · One Forge', ref)}
  <div class="sec-h"><span class="n">06</span><span class="t">After the Site: The Arsenal</span><span class="r"></span></div>
  <p class="arsenal-intro">A website catches the lead. <b>These keep it.</b> Every branch below installs into the rebuilt site — one system, not four subscriptions.</p>
  ${branch({
    no: '02',
    cat: '02 · AI Voice Agents',
    name: 'Meet Maeve — The Warrior Queen',
    tag: 'Your pipeline, dialed cold and warm. Speak your campaign. She’ll answer.',
    paras: [
      `Most calls to small service businesses go unanswered while the crew is on a job — and callers rarely leave voicemail; they call the next name on the list. Maeve answers <b>every</b> call to ${esc(name)} in seconds, books the estimate, qualifies the job, and texts you the summary.`,
      `Outbound, she works the follow-up list you never get to — yesterday’s quotes, last season’s customers, the review requests.`,
    ],
    feats: [
      '24/7 inbound answering — no missed-call leak',
      'Books estimates straight into your calendar',
      'Outbound follow-up on quotes & reactivations',
      'Every call logged, transcribed, summarized',
    ],
  })}
  ${branch({
    no: '03',
    cat: '03 · Workflow Automations',
    name: 'Workflow Engines',
    tag: 'Automatic execution for the modern age. Built once, paid forever.',
    paras: [
      `Silent machines that <b>quote, follow up, invoice, and chase reviews while you sleep</b>. The jobs that eat your evenings — estimates, reminders, review requests, rescheduling — run themselves, wired into the site and the phone line.`,
    ],
    feats: [
      'Instant quote follow-up (the first responder wins the job)',
      'Review engine — every happy customer asked, automatically',
      'Invoice + payment chasing without the awkward calls',
      'One dashboard — see every lead’s status at a glance',
    ],
  })}
  ${foot(date, 4)}
</div>

<!-- ============ PAGE 5 — SOFTWARE + ULTRAPLAN + FINAL CTA ============ -->
<div class="page">
  ${mast('Four Branches · One Forge', ref)}
  ${branch({
    no: '01',
    cat: '04 · Custom Software',
    name: 'An Operational War Room',
    tag: 'The battlefield is changing. Dashboards that decide. Pipelines that don’t sleep.',
    paras: [
      `We ship our own platforms — <b>YardWorx, RepairWorx, SalesWorx, AgentWorx</b> — and engineer custom software for the clans that need their own: voice-logged crews, predictive inventory, dispatch in one cockpit. Systems built once, sharpened forever.`,
    ],
    feats: [
      'Crew + dispatch cockpit built around how you actually run jobs',
      'Bespoke internal tooling — yours, not rented',
    ],
  })}
  <div class="ultra">
    <div class="u-cat">05 · AI Installation</div>
    <div class="u-name">ULTRAPLAN</div>
    <div class="u-tag">The full arsenal, installed as one system — not four projects.</div>
    <p>UltraPlan is the whole forge pointed at one business: the rebuilt site, Maeve on the phones, the workflow engines underneath, and the software cockpit on top — <b>designed, installed, and maintained by GAELWORX</b> so you run the trade and the machines run the busywork.</p>
    <div class="u-stack">
      <div class="u-cell"><div class="uc-n">GW–04</div><div class="uc-t">Site<br>rebuilt</div></div>
      <div class="u-cell"><div class="uc-n">GW–02</div><div class="uc-t">Maeve on<br>the phones</div></div>
      <div class="u-cell"><div class="uc-n">GW–03</div><div class="uc-t">Engines<br>underneath</div></div>
      <div class="u-cell"><div class="uc-n">GW–01</div><div class="uc-t">Cockpit<br>on top</div></div>
    </div>
  </div>
  ${ctaBand('Point the sword — pick one branch, or all of them.')}
  <div class="forge-foot">GAELWORX · <b>gaelworx.com</b> · Point the sword. We take care of the battlefield.</div>
  ${foot(date, 5)}
</div>

</body></html>`;
}

// CLI: node src/reportCardV2.js <audit.json> <out.pdf> [--html <out.html>]
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , inPath, outPdf = 'out/report-v2.pdf'] = process.argv;
  if (!inPath) {
    console.error('usage: node src/reportCardV2.js <audit.json> <out.pdf> [--html <out.html>]');
    process.exit(1);
  }
  const audit = JSON.parse(await readFile(inPath, 'utf8'));
  const html = buildHtml(audit);
  const htmlFlag = process.argv.indexOf('--html');
  if (htmlFlag !== -1 && process.argv[htmlFlag + 1]) {
    await writeFile(process.argv[htmlFlag + 1], html);
  }
  const res = await renderToFile(html, outPdf);
  await closeBrowser();
  console.log(`Rendered ${outPdf} (${res.bytes} bytes)`);
}
