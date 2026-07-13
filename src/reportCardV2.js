// GAELWORX report card V2 — HAS_SITE outreach edition (mobile-first, 4 pages).
// Input: the SAME audit.json the official kit consumes (audit-kit schema).
// Output: a 4-page A4 PDF built to be read on a phone — big type, one idea per
// block, short copy:
//   P1  THE BLEED   — 3 short website pain points + grade
//   P2  THE FIX     — we rebuild the site as a lead engine
//   P3  THE LEAKS   — where the rest of the business bleeds (universal)
//   P4  THE FORGE   — the GAELWORX solutions that plug each leak
// The official kit (render_report.py) stays the deep-dive; this is the punchy
// sales-forward variant and never edits the kit.
//
// Usage: node src/reportCardV2.js <audit.json> <out.pdf> [--html <out.html>]
import { readFile, writeFile } from 'node:fs/promises';
import { readFileSync as rfs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renderToFile, closeBrowser } from './render.js';

const __dir = dirname(fileURLToPath(import.meta.url));
// The GAELWORX coin (triple-hound medallion) — embedded so the PDF is self-contained.
let COIN = '';
try { COIN = rfs(join(__dir, '../assets/coin.b64'), 'utf8').trim(); } catch { /* optional */ }
const coinUri = COIN ? `data:image/png;base64,${COIN}` : '';

// Fonts embedded as base64 @font-face — the render container can't reliably reach
// fonts.gstatic.com at print time, so a live @import silently falls back to Georgia.
function fontFace(family, weight, file) {
  try {
    const b64 = rfs(join(__dir, '../assets/fonts', file)).toString('base64');
    return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/ttf;base64,${b64}) format('truetype')}`;
  } catch {
    return '';
  }
}
const FONT_FACE_CSS = [
  fontFace('Grenze Gotisch', 700, 'grenze700.ttf'),
  fontFace('Grenze Gotisch', 800, 'grenze800.ttf'),
  fontFace('Hanken Grotesk', 400, 'hanken400.ttf'),
  fontFace('Hanken Grotesk', 600, 'hanken600.ttf'),
  fontFace('Hanken Grotesk', 700, 'hanken700.ttf'),
].join('\n');

import { buildHtml as buildHtmlPure, gradeFromAvg } from './reportCardTemplate.js';

// Provide the embedded assets (coin + fonts) the pure template needs.
const ASSETS = { coinUri, fontCss: FONT_FACE_CSS };
export function buildHtml(audit) { return buildHtmlPure(audit, ASSETS); }
export { gradeFromAvg };

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
  if (htmlFlag !== -1 && process.argv[htmlFlag + 1]) await writeFile(process.argv[htmlFlag + 1], html);
  const res = await renderToFile(html, outPdf);
  await closeBrowser();
  console.log(`Rendered ${outPdf} (${res.bytes} bytes)`);
}
