// Native PDF rendering for the GAELWORX harness.
// Drives the pre-installed Chromium (no Gotenberg, no network) to turn an HTML
// string into a print-perfect PDF. Honors the brand's A4 page + full backgrounds.
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';

// The web container ships Chromium under PLAYWRIGHT_BROWSERS_PATH. We launch it
// by explicit executablePath so the playwright-core version never has to match
// the installed browser build exactly.
function resolveChromium() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/opt/pw-browsers/chromium/chrome-linux/chrome',
  ].filter(Boolean);
  for (const p of candidates) if (existsSync(p)) return p;
  // Last resort: let playwright-core try its own resolution.
  return undefined;
}

let _browser = null;
// Reuse a single browser across many leads in a wave — launching Chromium per
// lead is the slow part; one instance renders hundreds of pages cheaply.
export async function getBrowser() {
  if (_browser) return _browser;
  _browser = await chromium.launch({
    executablePath: resolveChromium(),
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  return _browser;
}

export async function closeBrowser() {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}

// Render an HTML string to a PDF Buffer. Waits for fonts/network so the Cinzel /
// Bricolage / Hanken webfonts and any remote assets are present before printing.
export async function htmlToPdf(html, opts = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle', timeout: 60_000 });
    try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch {}
    const pdf = await page.pdf({
      format: opts.format || 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: opts.margin || { top: '0', bottom: '0', left: '0', right: '0' },
    });
    return pdf; // Buffer
  } finally {
    await page.close();
  }
}

// Convenience: render to a file and also return base64 (what the n8n Gmail
// delivery node consumes as the attachment).
export async function renderToFile(html, outPath, opts = {}) {
  const pdf = await htmlToPdf(html, opts);
  await writeFile(outPath, pdf);
  return { path: outPath, base64: pdf.toString('base64'), bytes: pdf.length };
}

// CLI: node src/render.js <input.html> <output.pdf>
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , inPath, outPath = 'out.pdf'] = process.argv;
  if (!inPath) {
    console.error('usage: node src/render.js <input.html> <output.pdf>');
    process.exit(1);
  }
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(inPath, 'utf8');
  const res = await renderToFile(html, outPath);
  await closeBrowser();
  console.log(`Rendered ${outPath} (${res.bytes} bytes)`);
}
