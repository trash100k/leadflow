// GAELWORX report-card template — PURE (no fs, no Node APIs).
// Shared by the CLI renderer (src/reportCardV2.js) and the browser generator
// (webapp). buildHtml(audit, { coinUri, fontCss }) -> full self-contained HTML.

const BOOKING_URL =
  'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1Tq2Xdj7GjrysRzGq_oitD63iIppkWMOtO7SnsNNweoS6oIckUUlYrAOtUjzbOigiyNpAfEa7x';
const PHONE_DISPLAY = '(369) 212-1203';
const PHONE_TEL = '+13692121203';

const DIM_LABELS = {
  design: 'Design', mobile: 'Mobile', tech_seo: 'Tech SEO', local_seo: 'Local SEO',
  content_eeat: 'Content', aeo: 'AI Answers', geo: 'AI Search', agentic: 'AI Agents',
  accessibility: 'Access', cro: 'Conversion',
};
// Short, plain-language fix per weak dimension (page 2 "from → to").
const DIM_FIX = {
  design: ['Dated, cluttered look', 'A clean site that builds trust in 3 seconds'],
  mobile: ['Hard to use on a phone', 'Thumb-friendly, with tap-to-call on every screen'],
  tech_seo: ['Google can barely read it', 'Fast, clean pages Google ranks'],
  local_seo: ['Buried in local search', 'Service-area pages that land you in the map pack'],
  content_eeat: ['No proof you’re legit', 'Licenses, reviews & real jobs up front'],
  aeo: ['Invisible to ChatGPT', 'Answers AI assistants actually quote'],
  geo: ['Missing from AI search', 'Built to show up when people ask AI'],
  agentic: ['AI can’t read your info', 'A profile AI can find, quote, and book'],
  accessibility: ['Turns some customers away', 'Readable and usable for everyone'],
  cro: ['Visitors leave without calling', 'Every page pushes one thing: call or quote'],
};

export function gradeFromAvg(a) {
  if (a >= 9) return { grade: 'A', color: '#E7DECB' };
  if (a >= 8) return { grade: 'A-', color: '#E7DECB' };
  if (a >= 7) return { grade: 'B', color: '#D9A441' };
  if (a >= 6) return { grade: 'B-', color: '#D9A441' };
  if (a >= 5) return { grade: 'C', color: '#E08A2E' };
  if (a >= 4.3) return { grade: 'C-', color: '#E08A2E' };
  if (a >= 3.5) return { grade: 'D+', color: '#C4622F' };
  if (a >= 2.5) return { grade: 'D', color: '#C4622F' };
  return { grade: 'F', color: '#A32B22' };
}

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

// Trim an audit finding to its first plain sentence and drop trailing "(Tech SEO 6)" refs.
function oneLine(str) {
  let t = String(str ?? '').replace(/\s*\([^)]*\d\/?\d?\)\s*$/, '').trim();
  const m = t.match(/^(.*?[.!?])(\s|$)/);
  if (m) t = m[1];
  return t;
}

function mast(sub) {
  return `<div class="mast"><div class="brand"><div class="gx">G<b>A</b><b>E</b>LWORX</div>
  <div class="tag">${esc(sub)}</div></div>
  <a class="call" href="tel:${PHONE_TEL}">☎ ${PHONE_DISPLAY}</a></div>
  <div class="hairline"></div>`;
}

function foot(n) {
  return `<div class="foot"><span>GAELWORX · gaelworx.com</span><span class="pg">${n} / 4</span></div>`;
}

function bigCta(line) {
  return `<a class="cta" href="${BOOKING_URL}">
    <div class="cta-l">${line}</div>
    <div class="cta-b">Book a 15-min call →</div></a>`;
}

export function buildHtml(audit, assets = {}) {
  const coinUri = assets.coinUri || '';
  const FONT_FACE_CSS = assets.fontCss || '';
  const scores = audit.scores || {};
  const vals = Object.values(scores).filter((v) => typeof v === 'number');
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const avg1 = Math.round(avg * 10) / 10;
  const { grade, color } = gradeFromAvg(avg);
  const biz = audit.business || {};
  const name = biz.name || 'Your Business';
  const worst = Object.entries(scores)
    .filter(([, v]) => typeof v === 'number')
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);

  // Page 1 pains: top costing findings, shortened. Fall back to worst-dimension prompts.
  const costing = (audit.costing || []).slice(0, 3);
  const pains = costing.length
    ? costing.map((c) => ({ h: oneLine(c.title), l: oneLine(c.body ?? c.detail ?? '') }))
    : worst.map(([k]) => ({ h: `Weak ${DIM_LABELS[k] || k}`, l: DIM_FIX[k]?.[0] || '' }));

  // Universal business-wide leaks (page 3) and the solutions that plug them (page 4).
  const LEAKS = [
    { n: '01', h: 'Missed calls walk next door', l: 'Most calls hit voicemail while you’re on a job. 8 of 10 callers won’t leave one — they just dial the next name.' },
    { n: '02', h: 'Slow quotes lose the job', l: 'The first to reply usually wins. A quote that sits overnight is a job someone faster already booked.' },
    { n: '03', h: 'The busywork eats your nights', l: 'Scheduling, invoicing, and chasing reviews by hand is hours every week you never bill for.' },
    { n: '04', h: 'After-hours leads go cold', l: 'Calls and form-fills at 8pm sit until morning. By then they’ve moved on.' },
  ];
  const SOLUTIONS = [
    { gw: 'GW–02', tag: 'AI Voice Agent', name: 'Maeve answers every call', l: 'Picks up in seconds — day, night, weekend — books the job and texts you the details. No missed call, ever.', fixes: 'Fixes #01 + #04' },
    { gw: 'GW–03', tag: 'Automations', name: 'The busywork runs itself', l: 'Instant quote follow-up, automatic invoicing, and a review engine that fills your Google page while you sleep.', fixes: 'Fixes #02 + #03' },
    { gw: 'GW–01', tag: 'Custom Software', name: 'One screen runs it all', l: 'Jobs, crews, and cash in a single dashboard built around how you actually work — not another app to babysit.', fixes: 'The whole operation' },
    { gw: 'GW–05', tag: 'AI Installation · UltraPlan', name: 'We install the whole forge', l: 'Site, phone, automations, software — set up and maintained by us. You run the trade; the machines run the rest.', fixes: 'Everything, done for you' },
  ];

  const painCards = pains
    .map(
      (p, i) => `<div class="pain"><div class="num">${String(i + 1).padStart(2, '0')}</div>
      <div class="pt"><div class="ph">${p.h}</div><div class="pl">${p.l}</div></div></div>`,
    )
    .join('');

  const fromTo = worst
    .map(([k, v]) => {
      const f = DIM_FIX[k] || ['', ''];
      return `<div class="ft"><div class="ft-x">${f[0]}</div><div class="ft-a">→</div><div class="ft-t">${f[1]}</div></div>`;
    })
    .join('');

  const plan = (audit.plan || []).slice(0, 4);
  const getList = plan.length
    ? plan.map((p) => `<div class="get"><span class="gk">✓</span>${esc(p.title)}</div>`).join('')
    : '';

  const leakCards = LEAKS.map(
    (x) => `<div class="leak"><div class="lnum">${x.n}</div><div class="lt"><div class="lh">${x.h}</div><div class="ll">${x.l}</div></div></div>`,
  ).join('');

  const solCards = SOLUTIONS.map(
    (s) => `<div class="sol"><div class="sol-top"><span class="sol-gw">${s.gw}</span><span class="sol-tag">${esc(s.tag)}</span></div>
    <div class="sol-name">${esc(s.name)}</div><div class="sol-l">${esc(s.l)}</div>
    <div class="sol-fix">${esc(s.fixes)}</div></div>`,
  ).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GAELWORX Report Card — ${esc(name)}</title><style>
  ${FONT_FACE_CSS}
  @page { size: A4; margin: 0; }
  :root{
    --void:#0C0906; --panel:#17110A; --panel-2:#110C07; --steel:#2A1F13; --steel-line:#57411F;
    --ink:#E7DECB; --ink-2:#CDBFA8; --ink-dim:#9B8F7D; --ink-faint:#7A6E5C;
    --forge:#D98A34; --forge-soft:#E9A94F; --amber:#E08A2E; --ember:#E85D04; --terra:#B5623A; --crit:#A32B22;
    --display:'Grenze Gotisch',Georgia,serif;
    --sans:'Hanken Grotesk','Helvetica Neue',Arial,sans-serif;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:var(--void);color:var(--ink);font-family:var(--sans);font-size:15px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;height:297mm;margin:0 auto;position:relative;overflow:hidden;
    background:radial-gradient(120% 75% at 62% -10%, #22160c 0%, var(--void) 60%);
    padding:20mm 18mm;page-break-after:always;display:flex;flex-direction:column}
  .page:last-child{page-break-after:auto}
  .coinwm{position:absolute;top:-70px;right:-90px;width:430px;opacity:.06;pointer-events:none;z-index:0}
  .page > *:not(.coinwm){position:relative;z-index:1}
  .hairline{height:2px;background:linear-gradient(90deg,var(--forge),transparent 80%);margin:12px 0 0}
  /* masthead */
  .mast{display:flex;justify-content:space-between;align-items:center;gap:16px}
  .gx{font-family:var(--display);font-weight:700;font-size:30px;color:var(--ink)}
  .gx b{background:linear-gradient(to top,#B5623A,#E9A94F 52%,#E7DECB);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#E9A94F}
  .tag{font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:var(--ink-faint);margin-top:5px}
  .call{font-family:var(--sans);font-weight:700;font-size:14px;color:var(--void);background:var(--terra);padding:9px 15px;border-radius:2px;text-decoration:none;white-space:nowrap}
  /* eyebrow + big page headline */
  .eyebrow{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--forge);font-weight:700;margin-bottom:8px}
  .h1{font-family:var(--display);font-weight:700;font-size:40px;line-height:1.02;color:var(--ink);letter-spacing:.01em}
  .h1 .amb{color:var(--forge-soft)}
  .lead{font-size:17px;line-height:1.5;color:var(--ink-2);margin-top:14px;max-width:150mm}
  .lead b{color:var(--ink)}
  /* page-1 identity + grade */
  .idrow{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-top:6px}
  .idrow .biz{font-family:var(--display);font-weight:700;font-size:26px;line-height:1.05;color:var(--ink)}
  .idrow .url{font-family:var(--sans);font-size:13px;color:var(--ink-dim);margin-top:5px}
  .gradebox{flex:none;text-align:center}
  .gradebox .g{font-family:var(--display);font-weight:800;font-size:76px;line-height:.8}
  .gradebox .gl{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint);margin-top:4px}
  /* pain cards */
  .pain{display:flex;gap:16px;align-items:flex-start;border:2px solid var(--steel-line);background:var(--panel);padding:18px 20px;margin-top:14px}
  .pain .num{font-family:var(--display);font-weight:800;font-size:34px;color:var(--ember);line-height:1;flex:none;width:44px}
  .ph{font-size:19px;font-weight:700;color:var(--ink);line-height:1.2}
  .pl{font-size:15px;line-height:1.5;color:var(--ink-dim);margin-top:6px}
  /* from -> to rows */
  .ft{display:flex;align-items:center;gap:14px;border:2px solid var(--steel-line);background:var(--panel);padding:15px 18px;margin-top:12px}
  .ft-x{flex:1;font-size:15px;color:var(--ink-dim);text-decoration:line-through;text-decoration-color:var(--terra)}
  .ft-a{flex:none;color:var(--ember);font-size:22px;font-weight:700}
  .ft-t{flex:1.3;font-size:15px;color:var(--ink);font-weight:700}
  /* what you get checklist */
  .getwrap{border:2px solid var(--forge);background:linear-gradient(180deg,#2a1a0d,#140c06);padding:18px 20px;margin-top:18px}
  .getwrap .gh{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--forge);font-weight:700;margin-bottom:12px}
  .get{display:flex;gap:11px;font-size:16px;color:var(--ink-2);padding:7px 0;line-height:1.35}
  .get .gk{color:var(--ember);font-weight:800;flex:none}
  /* leak cards (page 3) */
  .leak{display:flex;gap:16px;align-items:flex-start;border:2px solid var(--steel-line);background:var(--panel);padding:17px 20px;margin-top:13px}
  .leak .lnum{font-family:var(--display);font-weight:800;font-size:28px;color:var(--forge);flex:none;width:44px;line-height:1}
  .lh{font-size:19px;font-weight:700;color:var(--ink)}
  .ll{font-size:15px;line-height:1.5;color:var(--ink-dim);margin-top:6px}
  /* solution cards (page 4) */
  .sol{border:2px solid var(--steel-line);background:var(--panel);padding:16px 20px;margin-top:12px}
  .sol-top{display:flex;justify-content:space-between;align-items:baseline}
  .sol-gw{font-family:var(--sans);font-size:11px;color:var(--ink-faint);letter-spacing:.06em}
  .sol-tag{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--forge);font-weight:700}
  .sol-name{font-family:var(--display);font-weight:700;font-size:24px;color:var(--ink);margin-top:4px;line-height:1.1}
  .sol-l{font-size:15px;line-height:1.5;color:var(--ink-2);margin-top:7px}
  .sol-fix{display:inline-block;margin-top:10px;font-size:12px;font-weight:700;letter-spacing:.04em;color:var(--ember);border:1px solid var(--steel-line);padding:5px 10px}
  /* CTA */
  .cta{display:flex;justify-content:space-between;align-items:center;gap:16px;text-decoration:none;border:2px solid var(--forge);background:linear-gradient(180deg,#2a1a0d,#140c06);padding:18px 22px;margin-top:auto}
  .cta-l{font-family:var(--display);font-weight:700;font-size:22px;color:var(--ink);line-height:1.15}
  .cta-b{flex:none;font-family:var(--sans);font-weight:700;font-size:14px;color:var(--void);background:var(--ember);padding:12px 16px;white-space:nowrap}
  /* footer + closing */
  .spacer{flex:1}
  .foot{display:flex;justify-content:space-between;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-faint);margin-top:16px;padding-top:12px;border-top:1px solid var(--steel)}
  .foot .pg{color:var(--forge)}
  .close{text-align:center;margin-top:20px}
  .close img{width:66px;opacity:.95}
  .close .cw{font-family:var(--display);font-weight:700;font-size:18px;color:var(--ink-2);margin-top:10px;letter-spacing:.04em}
</style></head>
<body>

<!-- ===== PAGE 1 — THE BLEED ===== -->
<div class="page">
  ${coinUri ? `<img class="coinwm" src="${coinUri}" alt="">` : ''}
  ${mast('Website Report Card')}
  <div class="idrow">
    <div><div class="eyebrow">Prepared for</div><div class="biz">${esc(name)}</div><div class="url">${esc(biz.url || '')}</div></div>
    <div class="gradebox"><div class="g" style="color:${color}">${grade}</div><div class="gl">Site Grade</div></div>
  </div>
  <div class="h1" style="margin-top:26px">Your website is quietly <span class="amb">costing you calls.</span></div>
  <div class="lead">We looked at your site the way a customer — and Google’s AI — sees it. Here are the <b>three things</b> losing you the most work right now:</div>
  ${painCards}
  <div class="spacer"></div>
  ${foot(1)}
</div>

<!-- ===== PAGE 2 — THE FIX ===== -->
<div class="page">
  ${mast('The Fix · Web Design')}
  <div class="eyebrow" style="margin-top:22px">The good news</div>
  <div class="h1">Every one of those is <span class="amb">fixable.</span></div>
  <div class="lead">We don’t patch the old site — we forge a new one, built as a <b>lead engine</b>: fast, mobile-first, and pointed at one thing — getting the phone to ring.</div>
  <div style="margin-top:20px">${fromTo}</div>
  ${getList ? `<div class="getwrap"><div class="gh">What you get in the first 30 days</div>${getList}</div>` : ''}
  <div class="spacer"></div>
  ${bigCta('Want this handled by next month?')}
  ${foot(2)}
</div>

<!-- ===== PAGE 3 — THE LEAKS ===== -->
<div class="page">
  ${mast('The Bigger Picture')}
  <div class="eyebrow" style="margin-top:22px">Beyond the website</div>
  <div class="h1">The site is just the <span class="amb">front door.</span></div>
  <div class="lead">Even with a perfect site, most local service businesses leak work in the same four places. Sound familiar?</div>
  ${leakCards}
  <div class="spacer"></div>
  ${foot(3)}
</div>

<!-- ===== PAGE 4 — THE FORGE (solutions) ===== -->
<div class="page">
  ${coinUri ? `<img class="coinwm" src="${coinUri}" alt="">` : ''}
  ${mast('Point the sword · The Forge')}
  <div class="eyebrow" style="margin-top:22px">What we install</div>
  <div class="h1">One system. It plugs <span class="amb">every leak.</span></div>
  ${solCards}
  ${bigCta('Let’s forge yours.')}
  <div class="foot"><span>GAELWORX · Point the sword. We take care of the battlefield.</span><span class="pg">4 / 4</span></div>
</div>

</body></html>`;
}
