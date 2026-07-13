// Smoke test: build a sample report card and render it natively to PDF.
import { buildReportCard } from '../src/reportCard.js';
import { renderToFile, closeBrowser } from '../src/render.js';
import { mkdir } from 'node:fs/promises';

const sampleAudit = {
  business: "Muskogee Lawn & Landscape",
  url: "muskogeelawn.com",
  scores: {
    design: { score: 4, note: "Template theme from ~2014, low-contrast text over photos, no clear visual hierarchy." },
    mobile: { score: 3, note: "Layout does not reflow on phones; the hero text is unreadable and the menu overflows." },
    tech_seo: { score: 5, note: "Missing meta descriptions on 6 of 8 pages; no schema markup for a local business." },
    cro: { score: 2, note: "Phone number is an image, not click-to-call; no quote form above the fold." },
    performance: { score: 5, note: "4.8s LCP on mobile; uncompressed hero image is 3.2MB." },
    content: { score: 6, note: "Services listed but no pricing or service-area pages." },
    trust: { score: 4, note: "No reviews surfaced on site despite 80+ Google reviews." },
    local_seo: { score: 5, note: "NAP present but inconsistent with Google Business Profile." },
    accessibility: { score: 4, note: "Images missing alt text; contrast fails WCAG AA in nav." },
    branding: { score: 6, note: "Logo is clean but applied inconsistently across pages." },
  },
  verified: ["design", "mobile", "tech_seo", "cro"],
  top_findings: [
    "Your phone number is an image, so phones can't tap to call it — every mobile visitor who wants to call has to memorize or copy it.",
    "The site doesn't reflow on mobile, where ~70% of local landscaping searches happen, so the first impression is broken text.",
    "You have 80+ Google reviews but none appear on the site, so visitors can't see the trust you've already earned.",
  ],
  competitors: [
    { name: "Green Country Lawns", url: "greencountrylawns.com", edge: "Click-to-call in the header, instant quote form, and review stars on every page." },
    { name: "Three Rivers Landscaping", url: "threeriverslandscape.com", edge: "Fast mobile site with a project gallery and clear service-area pages." },
  ],
  bottom_line: "Muskogee Lawn & Landscape has earned real reputation offline but the website actively loses the mobile callers it should be converting. The fastest wins are click-to-call, a mobile-first rebuild, and surfacing the Google reviews you already have. Two local competitors already do all three, which means every week the gap compounds.",
};

const brief = { sender_name: "Zach", geo: "Muskogee, Oklahoma", industry: "landscapers", date: new Date().toISOString().slice(0, 10) };

await mkdir(new URL('../out/', import.meta.url), { recursive: true });
const html = buildReportCard(sampleAudit, brief);
const outPath = new URL('../out/sample-report.pdf', import.meta.url).pathname;
const res = await renderToFile(html, outPath, { margin: { top: '0', bottom: '0', left: '0', right: '0' } });
await closeBrowser();
console.log(`OK: ${res.path} (${res.bytes} bytes, base64 len ${res.base64.length})`);
