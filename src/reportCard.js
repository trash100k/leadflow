// GAELWORX report-card HTML builder.
// Turns an audit object into a 5-page, print-ready, on-brand HTML document.
// Visual system is lifted from the GAELWORX Source of Truth: Neo-Gaelic
// Brutalist — Forged Iron ground, Celtic Blood + Ember Glow accents, Cinzel /
// Bricolage / Hanken type, hard borders, the forge-text gradient on A/E.

const BRAND = {
  celticBlood: '#C1292E',
  forgedIron: '#0B0C10',
  coldSteel: '#1F2833',
  fogWhite: '#F1F2F6',
  ash: '#8D99AE',
  emberGlow: '#E85D04',
};

// The ten audit dimensions. The first four are VERIFIED by direct observation;
// the rest are scored from observable evidence. Order here = order on the card.
export const DIMENSIONS = [
  { key: 'design', label: 'Visual Design', verified: true },
  { key: 'mobile', label: 'Mobile Experience', verified: true },
  { key: 'tech_seo', label: 'Technical SEO', verified: true },
  { key: 'cro', label: 'Conversion (CRO)', verified: true },
  { key: 'performance', label: 'Performance / Speed', verified: false },
  { key: 'content', label: 'Content & Messaging', verified: false },
  { key: 'trust', label: 'Trust & Social Proof', verified: false },
  { key: 'local_seo', label: 'Local SEO', verified: false },
  { key: 'accessibility', label: 'Accessibility', verified: false },
  { key: 'branding', label: 'Branding', verified: false },
];

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Wordmark with the mandated forge-fire 'A' and 'E'.
function wordmark() {
  return `G<span class="forge">A</span><span class="forge">E</span>LWORX`;
}

// Average of all present scores (0–10) and a letter grade. The agent never sets
// these — the renderer computes them so the math is always honest.
export function computeGrade(scores) {
  const vals = DIMENSIONS.map((d) => scores?.[d.key]?.score)
    .filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (!vals.length) return { average: 0, grade: 'N/A' };
  const average = vals.reduce((a, b) => a + b, 0) / vals.length;
  const g = average;
  let grade = 'F';
  if (g >= 9.3) grade = 'A';
  else if (g >= 9.0) grade = 'A-';
  else if (g >= 8.5) grade = 'B+';
  else if (g >= 8.0) grade = 'B';
  else if (g >= 7.5) grade = 'B-';
  else if (g >= 7.0) grade = 'C+';
  else if (g >= 6.0) grade = 'C';
  else if (g >= 5.0) grade = 'D+';
  else if (g >= 4.0) grade = 'D';
  return { average: Math.round(average * 10) / 10, grade };
}

function scoreColor(score) {
  if (score >= 8) return BRAND.fogWhite;
  if (score >= 6) return BRAND.emberGlow;
  return BRAND.celticBlood;
}

function dimensionRow(dim, entry) {
  const score = typeof entry?.score === 'number' ? entry.score : null;
  const pct = score === null ? 0 : Math.max(0, Math.min(100, score * 10));
  const color = score === null ? BRAND.ash : scoreColor(score);
  const note = esc(entry?.note || '');
  const badge = dim.verified
    ? `<span class="verified">VERIFIED</span>`
    : `<span class="inferred">SCORED</span>`;
  return `
    <div class="dim">
      <div class="dim-head">
        <span class="dim-label">${esc(dim.label)} ${badge}</span>
        <span class="dim-score" style="color:${color}">${score === null ? '—' : score.toFixed(1)}<span class="dim-out">/10</span></span>
      </div>
      <div class="bar"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
      ${note ? `<div class="dim-note">${note}</div>` : ''}
    </div>`;
}

function competitorCard(c) {
  return `
    <div class="comp">
      <div class="comp-name">${esc(c.name || 'Competitor')}</div>
      ${c.url ? `<div class="comp-url">${esc(c.url)}</div>` : ''}
      <div class="comp-edge">${esc(c.edge || '')}</div>
    </div>`;
}

// audit: { business, url, scores{}, verified[], competitors[], bottom_line,
//          top_findings[] }  |  brief: { sender_name, geo, industry, date }
export function buildReportCard(audit = {}, brief = {}) {
  const scores = audit.scores || {};
  const { average, grade } = computeGrade(scores);
  const date = esc(brief.date || new Date().toISOString().slice(0, 10));
  const findings = (audit.top_findings || []).slice(0, 4);
  const competitors = (audit.competitors || []).slice(0, 3);

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Hanken+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: ${BRAND.forgedIron}; color: ${BRAND.fogWhite};
    font-family: 'Hanken Grotesk', sans-serif; }
  .page { width: 210mm; min-height: 297mm; padding: 18mm; position: relative;
    page-break-after: always; overflow: hidden; background: ${BRAND.forgedIron}; }
  .page:last-child { page-break-after: auto; }
  .mono { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.08em; text-transform: uppercase; }
  .cinzel { font-family: 'Cinzel Decorative', serif; }
  .forge { background: linear-gradient(to bottom, ${BRAND.emberGlow}, ${BRAND.celticBlood});
    -webkit-background-clip: text; background-clip: text; color: transparent; }
  .rule { height: 4px; background: ${BRAND.celticBlood}; width: 100%; margin: 6mm 0; }
  .kicker { color: ${BRAND.ash}; font-size: 11px; }
  /* Top bar */
  .topbar { display: flex; justify-content: space-between; align-items: center;
    border-bottom: 2px solid ${BRAND.celticBlood}; padding-bottom: 6mm; }
  .topbar .logo { font-family: 'Cinzel Decorative', serif; font-weight: 900;
    font-size: 22px; letter-spacing: 0.18em; }
  /* Cover */
  .cover { display: flex; flex-direction: column; height: 261mm; }
  .cover .title { font-family: 'Cinzel Decorative', serif; font-size: 46px; line-height: 1.05;
    margin-top: 28mm; }
  .cover .biz { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800;
    font-size: 40px; margin-top: 10mm; color: ${BRAND.fogWhite}; }
  .cover .url { color: ${BRAND.emberGlow}; font-size: 16px; margin-top: 3mm; }
  .grade-wrap { margin-top: auto; display: flex; align-items: flex-end; gap: 10mm;
    border-top: 2px solid ${BRAND.coldSteel}; padding-top: 8mm; }
  .grade-box { border: 3px solid ${BRAND.celticBlood}; box-shadow: 8px 8px 0 #000;
    padding: 4mm 8mm; text-align: center; background: ${BRAND.coldSteel}; }
  .grade-box .g { font-family: 'Cinzel Decorative', serif; font-size: 64px; line-height: 1;
    color: ${BRAND.fogWhite}; }
  .grade-box .lbl { color: ${BRAND.ash}; font-size: 10px; }
  .avg { font-size: 14px; color: ${BRAND.ash}; }
  .avg b { color: ${BRAND.fogWhite}; font-size: 28px; font-family: 'Bricolage Grotesque'; }
  /* Section heads */
  h2.sec { font-family: 'Cinzel Decorative', serif; font-size: 24px; margin: 8mm 0 2mm; }
  .sub { color: ${BRAND.ash}; font-size: 12px; margin-bottom: 6mm; }
  /* Dimensions */
  .dim { margin-bottom: 5mm; }
  .dim-head { display: flex; justify-content: space-between; align-items: baseline; }
  .dim-label { font-weight: 700; font-size: 14px; }
  .dim-score { font-family: 'Bricolage Grotesque'; font-weight: 800; font-size: 20px; }
  .dim-out { color: ${BRAND.ash}; font-size: 12px; font-weight: 400; }
  .bar { height: 8px; background: ${BRAND.coldSteel}; margin-top: 2mm; border: 1px solid #000; }
  .bar-fill { height: 100%; }
  .dim-note { color: ${BRAND.ash}; font-size: 11.5px; margin-top: 2mm; line-height: 1.5; }
  .verified { font-family: 'JetBrains Mono', monospace; font-size: 8px; color: ${BRAND.forgedIron};
    background: ${BRAND.emberGlow}; padding: 1px 5px; vertical-align: middle; margin-left: 4px; }
  .inferred { font-family: 'JetBrains Mono', monospace; font-size: 8px; color: ${BRAND.ash};
    border: 1px solid ${BRAND.ash}; padding: 1px 5px; vertical-align: middle; margin-left: 4px; }
  /* Findings */
  .finding { border-left: 4px solid ${BRAND.emberGlow}; background: ${BRAND.coldSteel};
    padding: 4mm 5mm; margin-bottom: 4mm; font-size: 13.5px; line-height: 1.5; }
  .bottom-line { border: 2px solid ${BRAND.celticBlood}; padding: 6mm; margin-top: 6mm;
    background: ${BRAND.coldSteel}; font-size: 15px; line-height: 1.6; }
  /* Competitors */
  .comp { border: 1px solid ${BRAND.ash}; background: ${BRAND.coldSteel}; padding: 5mm;
    margin-bottom: 4mm; box-shadow: 6px 6px 0 #000; }
  .comp-name { font-family: 'Bricolage Grotesque'; font-weight: 800; font-size: 18px; }
  .comp-url { color: ${BRAND.emberGlow}; font-size: 12px; margin: 1mm 0 3mm; }
  .comp-edge { color: ${BRAND.fogWhite}; font-size: 13px; line-height: 1.5; }
  /* CTA */
  .cta { display: flex; flex-direction: column; height: 261mm; justify-content: center;
    text-align: center; }
  .cta .big { font-family: 'Cinzel Decorative', serif; font-size: 40px; line-height: 1.15; }
  .cta .tag { color: ${BRAND.ash}; font-size: 14px; margin-top: 6mm; letter-spacing: 0.2em; }
  .cta .signoff { margin-top: 14mm; font-size: 14px; color: ${BRAND.fogWhite}; }
  .footer { position: absolute; bottom: 10mm; left: 18mm; right: 18mm; display: flex;
    justify-content: space-between; color: ${BRAND.ash}; font-size: 9px; }
</style></head>
<body>

  <!-- PAGE 1 — COVER -->
  <section class="page cover">
    <div class="topbar">
      <div class="logo">${wordmark()}</div>
      <div class="mono kicker">Website Audit · ${date}</div>
    </div>
    <div class="title cinzel">WEBSITE<br/>AUDIT<br/><span class="forge">REPORT CARD</span></div>
    <div class="biz">${esc(audit.business || 'Your Business')}</div>
    <div class="url">${esc(audit.url || '')}</div>
    <div class="grade-wrap">
      <div class="grade-box">
        <div class="g">${esc(grade)}</div>
        <div class="lbl mono">Overall Grade</div>
      </div>
      <div class="avg">Composite score<br/><b>${average}</b> <span style="color:${BRAND.ash}">/ 10</span></div>
    </div>
    <div class="footer mono"><span>${wordmark()}</span><span>Automatic Execution · Clan Protected</span></div>
  </section>

  <!-- PAGE 2 — SCORECARD -->
  <section class="page">
    <div class="topbar"><div class="logo">${wordmark()}</div><div class="mono kicker">01 · The Scorecard</div></div>
    <h2 class="sec">The Scorecard</h2>
    <div class="sub mono">Ten dimensions · four verified by direct inspection</div>
    ${DIMENSIONS.map((d) => dimensionRow(d, scores[d.key])).join('')}
    <div class="footer mono"><span>${esc(audit.business || '')}</span><span>${esc(audit.url || '')}</span></div>
  </section>

  <!-- PAGE 3 — FINDINGS -->
  <section class="page">
    <div class="topbar"><div class="logo">${wordmark()}</div><div class="mono kicker">02 · What We Found</div></div>
    <h2 class="sec">What We Found</h2>
    <div class="sub mono">The concrete issues costing you calls and leads</div>
    ${findings.length
      ? findings.map((f) => `<div class="finding">${esc(f)}</div>`).join('')
      : `<div class="finding">Detailed findings available on request.</div>`}
    <div class="bottom-line">${esc(audit.bottom_line || '')}</div>
    <div class="footer mono"><span>${esc(audit.business || '')}</span><span>${esc(audit.url || '')}</span></div>
  </section>

  <!-- PAGE 4 — COMPETITORS -->
  <section class="page">
    <div class="topbar"><div class="logo">${wordmark()}</div><div class="mono kicker">03 · The Battlefield</div></div>
    <h2 class="sec">The Battlefield</h2>
    <div class="sub mono">How real competitors in ${esc(brief.geo || 'your market')} are positioned</div>
    ${competitors.length
      ? competitors.map(competitorCard).join('')
      : `<div class="comp"><div class="comp-edge">Competitor analysis available on request.</div></div>`}
    <div class="footer mono"><span>${esc(audit.business || '')}</span><span>${esc(audit.url || '')}</span></div>
  </section>

  <!-- PAGE 5 — CTA -->
  <section class="page cta">
    <div class="big cinzel">NOT WITHOUT<br/><span class="forge">DANGER</span></div>
    <div class="tag mono">Automatic Execution · Clan Protected</div>
    <div class="signoff">
      This report was forged by <b>${wordmark()}</b>.<br/>
      ${esc(brief.sender_name ? `Reply to ${brief.sender_name} to point the sword.` : 'Reply to start the rebuild.')}
    </div>
    <div class="footer mono"><span>${wordmark()}</span><span>© ${new Date().getFullYear()} GAELWORX</span></div>
  </section>

</body></html>`;
}

export default buildReportCard;
