// Serverless audit endpoint. GET/POST { url, name? } -> audit.json for the card.
// Fetches the target site's HTML and asks Claude to score it + write plain-
// language pain points. Requires ANTHROPIC_API_KEY in the environment.
// If the key is absent it returns 501 so the UI falls back to manual entry.

const MODEL = 'claude-sonnet-5';

const SYS = `You are a website auditor for GAELWORX, a web-design + automation agency selling to local service businesses (pool companies, landscapers, roofers, solar, etc.). You will be given the RAW HTML of a small business website. Score it and write plain-language pain points an OWNER (not an SEO) would feel.

Return ONLY a JSON object, no prose, matching exactly:
{
  "business": { "name": string, "url": string },
  "scores": { "design": int, "mobile": int, "tech_seo": int, "local_seo": int, "content_eeat": int, "aeo": int, "geo": int, "agentic": int, "accessibility": int, "cro": int },
  "flags": string[],            // include only if TRUE: "AGENT-BLIND" if agentic<=3, "AI-INVISIBLE" if aeo+geo<=5, "A11Y-RISK" if accessibility<=4, "NO-LOCAL" if local_seo<=3
  "costing": [ { "title": string, "detail": string } ],   // EXACTLY 3, most important first
  "plan": [ { "title": string, "phase": "near"|"later" } ] // EXACTLY 4; first two "near", last two "later"
}

RULES:
- Every score is an integer 1-10, judged only from what the HTML shows. Be honest and a little tough; most small-biz sites land 4-7.
- "costing[].title" = the pain in plain words, leading with the customer/money consequence. NO jargon (no "schema", "JSON-LD", "meta", "H1", "LCP", "aggregateRating"). Examples: "Your 5-star reviews are invisible in Google search", "Visitors can't tap to call you on a phone", "When someone asks ChatGPT for a company like yours, you don't appear".
- "costing[].detail" = one or two plain sentences: what it costs (calls/jobs/trust) first, any technical note last.
- "plan[].title" = short fix step (e.g. "Add tap-to-call to every page").
- Derive "business.name" from the <title>/logo/H1; keep it short. Echo back the url given.
- NEVER invent a specific review count, competitor, or statistic you cannot see in the HTML.`;

async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  return await new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => (d += c));
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(501).json({ error: 'no_key', message: 'ANTHROPIC_API_KEY is not set on the server. Add it in Vercel → Project → Settings → Environment Variables, then redeploy. Until then use Manual mode.' });
  }

  let url = req.method === 'POST' ? (await readBody(req)).url : req.query.url;
  let name = req.method === 'POST' ? (await readBody(req)).name : req.query.name;
  if (!url) return res.status(400).json({ error: 'no_url', message: 'Pass a ?url=' });
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  // 1. Fetch the site HTML.
  let html = '';
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GAELWORX-Audit/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    html = await r.text();
  } catch (e) {
    return res.status(502).json({ error: 'fetch_failed', message: `Couldn't load ${url} (${e.message}). Check the address or use Manual mode.` });
  }
  // Trim to keep the model call fast/cheap; keep <head> + start of <body>.
  const trimmed = html.replace(/\s+/g, ' ').slice(0, 18000);

  // 2. Audit via Claude.
  try {
    const ar = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYS,
        messages: [{ role: 'user', content: `URL: ${url}\n${name ? `Business name (use this): ${name}\n` : ''}\nRAW HTML (truncated):\n${trimmed}` }],
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!ar.ok) {
      const t = await ar.text();
      return res.status(502).json({ error: 'model_failed', message: `Audit model error (${ar.status}). ${t.slice(0, 200)}` });
    }
    const data = await ar.json();
    let text = (data.content || []).map((c) => c.text || '').join('').trim();
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return res.status(502).json({ error: 'parse_failed', message: 'Audit did not return JSON.' });
    const audit = JSON.parse(m[0]);
    if (!audit.business) audit.business = {};
    audit.business.url = audit.business.url || url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (name) audit.business.name = name;
    return res.status(200).json(audit);
  } catch (e) {
    return res.status(500).json({ error: 'server', message: e.message });
  }
}
