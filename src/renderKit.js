// Render a real-schema audit object to the branded GAELWORX PDF using the OFFICIAL
// kit renderer (audit-kit/gaelworx_audit_kit/render_report.py). The kit owns all
// layout, charts, fonts, branding, grade/average math, and pagination — we only
// hand it a valid audit.json (matching audit_schema.json) and read the PDF back.
//
// Env: render_report.py launches Python Playwright (Chromium). This repo pins
// playwright==1.55.0 (matches the pre-installed build 1194). See README "Renderer".
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';

const execFileP = promisify(execFile);
const KIT = new URL('../audit-kit/gaelworx_audit_kit/render_report.py', import.meta.url).pathname;

// audit: full object matching audit_schema.json (meta, business, scores, flags,
// working, costing, ai_blind_spot, agentic, local, competitors, accessibility,
// plan, bottom_line). Writes auditPath, renders pdfPath. Returns { base64, bytes,
// pdfPath, htmlPath, tier }.
export async function renderAuditToPdf(audit, { auditPath, pdfPath }) {
  await mkdir(dirname(pdfPath), { recursive: true });
  await writeFile(auditPath, JSON.stringify(audit, null, 2));
  const env = { ...process.env, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' };
  const { stdout } = await execFileP('python3', [KIT, auditPath, pdfPath], { env, maxBuffer: 16 * 1024 * 1024 });
  const out = stdout.trim();
  const htmlPath = pdfPath.replace(/\.pdf$/, '.html');
  if (existsSync(pdfPath)) {
    const buf = await readFile(pdfPath);
    const tier = out.includes('weasyprint') ? 'weasyprint' : 'chromium';
    return { base64: buf.toString('base64'), bytes: buf.length, pdfPath, htmlPath, tier };
  }
  // Tier-3 fallback: only HTML was produced (no PDF engine). Caller can host the HTML.
  return { base64: null, bytes: 0, pdfPath: null, htmlPath, tier: 'html-only' };
}

export default renderAuditToPdf;
