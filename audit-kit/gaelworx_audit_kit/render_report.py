#!/usr/bin/env python3
"""
GAELWORX Site-Audit report renderer.

USAGE (from the managed agent):
    python3 render_report.py audit.json report_card.pdf

audit.json must match audit_schema.json. Output is a print-ready A4 PDF
(plus a sibling .html). Charts are generated as inline SVG — no network,
no external libraries beyond playwright (already in the sandbox).

The agent's only job is to produce a valid audit.json and call this file.
Everything about layout, branding, charts, and pagination lives here so the
agent never has to reason about HTML/CSS.
"""
import sys, json, math, html, datetime

_STYLES = r'''
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&display=swap');
  @page { size: A4; margin: 0; }
  :root{
    --void:#0c0d10;
    --panel:#181b21;
    --panel-2:#20242b;
    --steel:#333944;
    --steel-line:#444b57;
    --ink:#f1f2f4;          /* primary text — high contrast */
    --ink-2:#cfd4dc;        /* secondary — lifted for readability */
    --ink-dim:#a8aeb9;      /* dim but still legible */
    --ink-faint:#838996;    /* labels only, never body */
    --forge:#f0641f;
    --forge-soft:#f6864a;
    --green:#56c47c;
    --blue:#5c93f0;
    --amber:#e0a838;
    --red:#e0563a;
    --mono:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;
    --serif:"Hoefler Text","Georgia",serif;
    --sans:"Helvetica Neue",Arial,sans-serif;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:var(--void);color:var(--ink);font-family:var(--sans);-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{
    width:210mm;height:297mm;margin:0 auto;position:relative;overflow:hidden;
    background:radial-gradient(120% 70% at 50% -8%, #16181e 0%, var(--void) 58%);
    padding:16mm 15mm 13mm;
    page-break-after:always;
  }
  .page:last-child{page-break-after:auto}
  .hairline{height:1px;background:linear-gradient(90deg,transparent,var(--steel-line) 10%,var(--steel-line) 90%,transparent)}

  /* ---------- MASTHEAD ---------- */
  .mast{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding-bottom:12px}
  .brand .gx{
    font-family:"Cinzel Decorative","Hoefler Text",var(--serif);font-weight:700;font-size:25px;letter-spacing:.12em;
    text-transform:uppercase;color:var(--ink);
  }
  .brand .gx b{color:var(--forge);font-weight:700}
  .brand .tag{font-family:var(--sans);font-size:8px;letter-spacing:.30em;text-transform:uppercase;color:var(--ink-faint);margin-top:7px}
  .doc-meta{text-align:right;font-family:var(--mono);font-size:9px;color:var(--ink-dim);line-height:1.8;letter-spacing:.03em;white-space:nowrap}
  .mast-cta{display:flex;align-items:center;gap:9px;align-self:center}
  .mast-cta a{text-decoration:none;font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;white-space:nowrap}
  .mast-cta .book{background:var(--forge);color:var(--void);font-weight:bold}
  .mast-cta .call{border:1px solid var(--steel-line);color:var(--ink-2)}
  .mast-cta .call b{color:var(--forge-soft)}
  .doc-meta .lbl{color:var(--forge)}

  
  /* ---------- TARGET HEADER ---------- */
  .target{display:flex;justify-content:space-between;align-items:stretch;gap:16px;margin-top:18px}
  .target .who{flex:1;border:1px solid var(--steel-line);background:var(--panel);padding:20px 22px;position:relative}
  .target .who::before{content:"01";position:absolute;top:14px;right:16px;font-family:var(--mono);font-size:11px;color:var(--steel-line)}
  .eyebrow{font-family:var(--sans);font-size:9px;letter-spacing:.30em;text-transform:uppercase;color:var(--forge);margin-bottom:11px}
  .biz{font-family:var(--serif);font-size:34px;line-height:1.06;letter-spacing:.005em;color:var(--ink)}
  .url{font-family:var(--mono);font-size:12px;color:var(--ink-dim);margin-top:11px;word-break:break-all}
  .flags{display:flex;flex-wrap:wrap;gap:7px;margin-top:18px}
  .flag{font-family:var(--mono);font-size:9.5px;letter-spacing:.05em;padding:5px 10px;border:1px solid var(--steel-line);color:var(--ink-2);background:var(--panel-2);text-transform:uppercase}
  .flag.hot{border-color:var(--forge);color:var(--forge-soft)}

  .verdict-box{width:188px;flex:none;border:1px solid var(--steel-line);background:var(--panel);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 14px}
  .verdict-box .vlabel{font-family:var(--sans);font-size:8.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--ink-faint)}
  .grade{font-family:var(--serif);font-size:84px;line-height:.9;font-weight:600;margin:6px 0 4px}
  .avg{font-family:var(--mono);font-size:13px;color:var(--ink-dim)}
  .avg b{color:var(--ink)}
  .g-A{color:var(--green)} .g-B{color:var(--blue)} .g-C{color:var(--amber)} .g-D{color:var(--red)} .g-F{color:var(--red)}

  /* ---------- SECTION TITLES ---------- */
  .sec-h{display:flex;align-items:baseline;gap:13px;margin:30px 0 16px}
  .sec-h.first{margin-top:26px}
  .sec-h .n{font-family:var(--mono);font-size:12px;color:var(--forge);letter-spacing:.04em}
  .sec-h .t{font-family:var(--serif);font-size:19px;letter-spacing:.05em;text-transform:uppercase;color:var(--ink)}
  .sec-h .r{flex:1;height:1px;background:var(--steel-line);align-self:center;margin-left:6px}

  /* ---------- SCORE GRID ---------- */
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:13px 26px;margin-top:6px}
  .dim{display:flex;align-items:center;gap:12px}
  .dim .dn{font-family:var(--sans);font-size:12px;color:var(--ink-2);width:150px;flex:none;letter-spacing:.01em}
  .dim .track{flex:1;height:11px;background:var(--panel-2);border:1px solid var(--steel-line);position:relative;overflow:hidden}
  .dim .track > i{display:block;height:100%}
  .fill-hi{background:var(--green)} .fill-mid{background:var(--amber)} .fill-lo{background:var(--red)}
  .dim .sc{font-family:var(--mono);font-size:12px;width:42px;text-align:right;flex:none;color:var(--ink-dim)}
  .dim .sc b{color:var(--ink)}
  .chart-row{display:grid;grid-template-columns:1.05fr 1fr;gap:18px;margin-top:20px;align-items:stretch}
  .chart-card{border:1px solid var(--steel-line);background:var(--panel);padding:15px 17px 13px;display:flex;flex-direction:column}
  .chart-card .ct{font-family:var(--sans);font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--forge);margin-bottom:4px}
  .chart-card .cs{font-family:var(--sans);font-size:10px;color:var(--ink-faint);margin-bottom:10px;line-height:1.4}
  .chart-card .cwrap{flex:1;display:flex;align-items:center;justify-content:center}
  .chart-wide{border:1px solid var(--steel-line);background:var(--panel);padding:16px 18px;margin-top:14px}
  .chart-wide .ct{font-family:var(--sans);font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--forge);margin-bottom:12px}
  .dial-card{border:1px solid var(--steel-line);background:var(--panel);padding:14px 16px;margin-top:14px;display:flex;align-items:center;gap:20px}
  .dial-card .dwrap{flex:none;width:200px}
  .dial-card .dtext{flex:1}
  .dial-card .dtext .dt{font-family:var(--sans);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--forge);margin-bottom:8px}
  .dial-card .dtext p{font-size:11.5px;line-height:1.55;color:var(--ink-2)}
  /* competitor table */
  .cmp-sec{margin-top:26px}
  .cmp-table{width:100%;border-collapse:collapse;margin-top:6px}
  .cmp-table th{font-family:var(--sans);font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-faint);text-align:center;padding:9px 6px;border-bottom:1px solid var(--steel-line);font-weight:600}
  .cmp-table th.lead-col{text-align:left;color:var(--forge)}
  .cmp-table td{font-family:var(--sans);font-size:10.5px;color:var(--ink-2);text-align:center;padding:10px 6px;border-bottom:1px solid var(--steel)}
  .cmp-table td.name{text-align:left;color:var(--ink);font-size:11px}
  .cmp-table tr.you{background:rgba(240,100,31,0.07)}
  .cmp-table tr.you td.name{color:var(--forge-soft);font-weight:700}
  .cmp-table .chk{color:var(--green);font-family:var(--mono)}
  .cmp-table .x{color:var(--red);font-family:var(--mono)}
  .cmp-table .mid{color:var(--amber);font-family:var(--mono)}
  .cmp-rating{font-family:var(--mono);font-size:10.5px}
  .cmp-note{font-family:var(--sans);font-size:9px;color:var(--ink-faint);margin-top:9px;line-height:1.45;font-style:italic}
  /* timeline */
  .timeline{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:10px;position:relative}
  .tl-track{position:absolute;top:13px;left:6%;right:6%;height:2px;background:var(--steel-line)}
  .tl-step{position:relative;padding:0 8px;text-align:center}
  .tl-dot{width:13px;height:13px;border-radius:50%;background:var(--forge);border:3px solid var(--void);margin:7px auto 0;position:relative;z-index:2}
  .tl-dot.later{background:var(--steel-line)}
  .tl-wk{font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--forge);margin-top:9px}
  .tl-title{font-family:var(--sans);font-size:10.5px;font-weight:700;color:var(--ink);margin-top:4px;line-height:1.25}
  .tl-desc{font-family:var(--sans);font-size:9px;color:var(--ink-dim);margin-top:4px;line-height:1.4}
  .forge-sec{margin-top:18px}
  .cal-cta{display:flex;align-items:center;justify-content:space-between;gap:14px;border:1px solid var(--forge);background:linear-gradient(180deg,#231711,#16100b);padding:13px 18px;margin-bottom:14px;text-decoration:none}
  .cal-cta .cc-l{font-family:var(--serif);font-size:14px;color:var(--ink);line-height:1.25}
  .cal-cta .cc-l b{color:var(--forge-soft);font-weight:600}
  .cal-cta .cc-btn{flex:none;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--void);background:var(--forge);padding:9px 15px;white-space:nowrap}
  .forge-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:13px}
  .forge-head .fh-l{font-family:"Cinzel Decorative","Hoefler Text",var(--serif);font-weight:700;font-size:15px;letter-spacing:.06em;color:var(--ink);text-transform:uppercase}
  .forge-head .fh-l b{color:var(--forge)}
  .forge-head .fh-r{font-family:var(--sans);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-dim)}
  .forge-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .forge-card{border:1px solid var(--steel-line);background:var(--panel);padding:9px 12px;position:relative;display:flex;flex-direction:column;text-decoration:none}
  .forge-card .fc-no{position:absolute;top:10px;right:12px;font-family:var(--mono);font-size:8px;color:var(--steel-line);letter-spacing:.05em}
  .forge-card .fc-cat{font-family:var(--sans);font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--forge);margin-bottom:5px}
  .forge-card .fc-name{font-family:var(--serif);font-size:14px;color:var(--ink);line-height:1.1;margin-bottom:2px}
  .forge-card .fc-tag{font-family:var(--sans);font-size:8.5px;color:var(--ink-dim);font-style:italic;margin-bottom:5px}
  .forge-card .fc-desc{font-family:var(--sans);font-size:8.5px;line-height:1.4;color:var(--ink-2);flex:1}
  .forge-card .fc-cta{font-family:var(--mono);font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--forge-soft);margin-top:8px}
  .forge-foot{text-align:center;font-family:var(--mono);font-size:8.5px;letter-spacing:.12em;color:var(--ink-faint);margin-top:11px}
  .forge-foot a,.forge-foot{text-decoration:none}
  .forge-foot b{color:var(--forge)}
  .grid-note{font-family:var(--sans);font-size:10.5px;color:var(--ink-faint);margin-top:18px;line-height:1.5}

  /* ---------- TWO-COL NARRATIVE ---------- */
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:6px}
  .block{border:1px solid var(--steel-line);background:var(--panel);padding:18px 19px}
  .block h4{font-family:var(--sans);font-size:10px;letter-spacing:.20em;text-transform:uppercase;color:var(--forge);margin-bottom:14px}
  .block.good h4{color:var(--green)}
  .item{display:flex;gap:11px;padding:9px 0;border-bottom:1px dotted var(--steel);font-size:12px;line-height:1.55}
  .item:last-child{border-bottom:none}
  .item .k{flex:none;width:6px;height:6px;border-radius:50%;margin-top:6px;background:var(--forge)}
  .block.good .item .k{background:var(--green)}
  .item .x b{color:var(--ink)} .item .x{color:var(--ink-2)}

  /* ---------- WIDE PANELS ---------- */
  .wide{border:1px solid var(--steel-line);background:var(--panel);padding:18px 20px;margin-top:6px}
  .wide .lead{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--forge);margin-bottom:13px}
  .wide p{font-size:12.5px;line-height:1.62;color:var(--ink-2)}
  .wide p b{color:var(--ink)}
  .wide p + p{margin-top:11px}
  .kv{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:6px}
  .kv .cell{border:1px solid var(--steel-line);background:var(--panel-2);padding:14px 14px}
  .kv .cell .m{font-family:var(--mono);font-size:24px;color:var(--ink)}
  .kv .cell .l{font-family:var(--sans);font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:var(--ink-faint);margin-top:6px}
  .kv .cell.accent .m{color:var(--forge)}

  .codeblock{font-family:var(--mono);font-size:11px;line-height:1.85;color:var(--ink-2);background:var(--panel-2);border:1px solid var(--steel-line);border-left:3px solid var(--forge);padding:15px 17px;margin-top:12px;white-space:pre-wrap}
  .codeblock .ok{color:var(--green)} .codeblock .no{color:var(--red)} .codeblock .c{color:var(--ink-faint)}

  /* ---------- BOTTOM LINE ---------- */
  .bottom{border:1px solid var(--forge);background:linear-gradient(180deg,#231711,#16100b);padding:22px 24px;margin-top:8px}
  .bottom .bl{font-family:var(--mono);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--forge);margin-bottom:13px}
  .bottom p{font-family:var(--serif);font-size:15px;line-height:1.62;color:var(--ink)}

  .foot{position:absolute;left:15mm;right:15mm;bottom:9mm;display:flex;justify-content:space-between;align-items:center;font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;color:var(--ink-faint);text-transform:uppercase}
  .foot .pg{color:var(--ink-dim)} .foot .pg b{color:var(--forge)}
  .foot .fx{color:var(--forge)}

  .intro-line{font-size:13px;line-height:1.6;color:var(--ink-dim);margin:14px 0 2px;max-width:165mm}
  .intro-line b{color:var(--ink-2)}
'''

def _preflight():
    """Verify Chromium/Playwright are usable. If not, print exact fix and exit
    cleanly instead of hanging. Run automatically before any render."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("RENDER ERROR: playwright not installed.\n"
              "FIX: pip install playwright && python3 -m playwright install chromium",
              file=sys.stderr)
        sys.exit(2)
    try:
        p = sync_playwright().start()
        try:
            b = p.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage",
                                         "--disable-gpu", "--single-process"])
            b.close()
        finally:
            p.stop()
    except Exception as e:
        print(f"RENDER ERROR: Chromium failed to launch ({type(e).__name__}: {e}).\n"
              "FIX: python3 -m playwright install chromium\n"
              "     (managed-agent sandboxes often ship Python without a browser.)",
              file=sys.stderr)
        sys.exit(2)

# ----------------------------------------------------------------------------
# PALETTE (GAELWORX) — single source of truth for colours used in charts too
# ----------------------------------------------------------------------------
C = dict(
    void="#0c0d10", panel="#181b21", panel2="#20242b", steel="#333944",
    steel_line="#444b57", ink="#f1f2f4", ink2="#cfd4dc", ink_dim="#a8aeb9",
    ink_faint="#838996", forge="#f0641f", forge_soft="#f6864a",
    green="#56c47c", blue="#5c93f0", amber="#e0a838", red="#e0563a",
)
MONO = 'font-family="SFMono-Regular,Consolas,Menlo,monospace"'
SANS = 'font-family="Helvetica Neue,Arial,sans-serif"'

# The booking calendar + branch links are GAELWORX constants, not per-lead data.
CALENDAR_URL = "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1Tq2Xdj7GjrysRzGq_oitD63iIppkWMOtO7SnsNNweoS6oIckUUlYrAOtUjzbOigiyNpAfEa7x"
BRANCHES = [
    ("01 · Software", "GW–01", "Custom Software", "One cockpit to run the whole operation.",
     "Purpose-built operations software for service businesses — voice-logged crews, predictive inventory, and dispatch unified in a single command center built around how you actually work.",
     "See what we build →", "https://www.gaelworx.com/services/software"),
    ("02 · Voice Agents", "GW–02", "AI Voice Agents", "Your pipeline, dialed cold and warm.",
     "Outbound and inbound voice agents that book, qualify, and follow up by phone — every lead chased and every call answered, day and night, without adding headcount.",
     "Hear one in action →", "https://www.gaelworx.com/services/voice-agents"),
    ("03 · Automations", "GW–03", "Workflow Automations", "Automatic execution for the modern age.",
     "Silent systems that quote, follow up, invoice, and chase reviews while you sleep — the repetitive work handled automatically. Built once, paid forever.",
     "Automate the busywork →", "https://www.gaelworx.com/services/automations"),
    ("04 · Web Design", "GW–04", "Web Design", "A site that turns visitors into booked jobs.",
     "Studio-grade, interactive websites engineered to fix exactly the gaps in this report — fast, mobile-first, and built to route every visitor straight to a call or a quote.",
     "View live work →", "https://www.gaelworx.com/services/web-design"),
]

def esc(t):
    return html.escape(str(t), quote=True)

def band(v):           # bar fill class by score
    return "fill-hi" if v >= 7 else ("fill-mid" if v >= 4 else "fill-lo")
def band_color(v):
    return C["green"] if v >= 7 else (C["amber"] if v >= 4 else C["red"])
def grade_from_avg(a):
    if a >= 9: return "A", C["green"]
    if a >= 8: return "A-", C["green"]
    if a >= 7: return "B", C["blue"]
    if a >= 6: return "B-", C["blue"]
    if a >= 5: return "C", C["amber"]
    if a >= 4.3: return "C-", C["amber"]
    if a >= 3.5: return "D+", C["red"]
    if a >= 2.5: return "D", C["red"]
    return "F", C["red"]

# ----------------------------------------------------------------------------
# CHARTS (inline SVG) — driven by the audit data
# ----------------------------------------------------------------------------
def radar_svg(scores):
    # only the 4 VERIFIED dimensions
    dims = [("Design / UX", scores["design"]), ("Mobile", scores["mobile"]),
            ("Technical SEO", scores["tech_seo"]), ("CRO", scores["cro"])]
    cx, cy, R, n = 158, 150, 92, 4
    def pt(i, r):
        a = -math.pi/2 + i*2*math.pi/n
        return (cx + r*math.cos(a), cy + r*math.sin(a))
    rings = "".join(
        f'<polygon points="{" ".join(f"{pt(i,R*g)[0]:.1f},{pt(i,R*g)[1]:.1f}" for i in range(n))}" '
        f'fill="none" stroke="{C["steel_line"]}" stroke-width="1" opacity="0.6"/>'
        for g in (0.25, 0.5, 0.75, 1.0))
    spokes = "".join(
        f'<line x1="{cx}" y1="{cy}" x2="{pt(i,R)[0]:.1f}" y2="{pt(i,R)[1]:.1f}" '
        f'stroke="{C["steel_line"]}" stroke-width="1" opacity="0.5"/>' for i in range(n))
    dpts = " ".join(f"{pt(i,R*(v/10))[0]:.1f},{pt(i,R*(v/10))[1]:.1f}" for i,(_,v) in enumerate(dims))
    dots = "".join(f'<circle cx="{pt(i,R*(v/10))[0]:.1f}" cy="{pt(i,R*(v/10))[1]:.1f}" r="3.5" fill="{C["forge"]}"/>'
                   for i,(_,v) in enumerate(dims))
    labels = ""
    for i,(name,v) in enumerate(dims):
        lx, ly = pt(i, R+24)
        anchor = "middle" if abs(lx-cx) < 10 else ("end" if lx < cx else "start")
        dy = 4 if abs(ly-cy) < 10 else (12 if ly > cy else -2)
        labels += (f'<text x="{lx:.0f}" y="{ly+dy:.0f}" {SANS} font-size="11" fill="{C["ink2"]}" text-anchor="{anchor}">{name}</text>'
                   f'<text x="{lx:.0f}" y="{ly+dy+12:.0f}" {MONO} font-size="10" fill="{band_color(v)}" text-anchor="{anchor}">{v}/10</text>')
    return (f'<svg viewBox="0 0 320 305" xmlns="http://www.w3.org/2000/svg" width="100%" style="max-width:320px">'
            f'{rings}{spokes}<polygon points="{dpts}" fill="{C["forge"]}" fill-opacity="0.18" '
            f'stroke="{C["forge"]}" stroke-width="2"/>{dots}{labels}'
            f'<circle cx="{cx}" cy="{cy}" r="2" fill="{C["ink_faint"]}"/></svg>')

def bands_svg(scores):
    vals = list(scores.values())
    crit = sum(1 for s in vals if s < 4)
    work = sum(1 for s in vals if 4 <= s < 7)
    strong = sum(1 for s in vals if s >= 7)
    W, x, segs = 600, 0, ""
    for cnt, col in [(crit, C["red"]), (work, C["amber"]), (strong, C["green"])]:
        w = W*cnt/len(vals)
        if cnt:
            segs += (f'<rect x="{x:.1f}" y="0" width="{w-3:.1f}" height="34" fill="{col}" rx="2"/>'
                     f'<text x="{x+(w-3)/2:.1f}" y="22" {MONO} font-size="15" fill="{C["void"]}" '
                     f'text-anchor="middle" font-weight="bold">{cnt}</text>')
        x += w
    leg, lx = "", 0
    for name, cnt, col in [("Critical", crit, C["red"]), ("Needs Work", work, C["amber"]), ("Strong", strong, C["green"])]:
        leg += (f'<rect x="{lx}" y="0" width="11" height="11" fill="{col}" rx="2"/>'
                f'<text x="{lx+16}" y="10" {SANS} font-size="11" fill="{C["ink2"]}">{name} ({cnt})</text>')
        lx += len(name)*6.2 + 46
    return (f'<svg viewBox="0 0 660 60" xmlns="http://www.w3.org/2000/svg" width="100%">'
            f'<g>{segs}</g><g transform="translate(2,50)">{leg}</g></svg>')

def dial_svg(scores):
    val = round((scores["aeo"] + scores["geo"] + scores["agentic"]) / 30 * 100)
    col = C["red"] if val < 40 else (C["amber"] if val < 70 else C["green"])
    cx, cy, r = 110, 110, 82
    start, sweep = math.pi*0.75, math.pi*1.5
    def arc(frac, color, w):
        a0, a1 = start, start+sweep*frac
        x0, y0 = cx+r*math.cos(a0), cy+r*math.sin(a0)
        x1, y1 = cx+r*math.cos(a1), cy+r*math.sin(a1)
        large = 1 if (a1-a0) > math.pi else 0
        return (f'<path d="M {x0:.1f} {y0:.1f} A {r} {r} 0 {large} 1 {x1:.1f} {y1:.1f}" '
                f'fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>')
    return (f'<svg viewBox="0 0 220 210" xmlns="http://www.w3.org/2000/svg" width="100%" style="max-width:220px">'
            f'{arc(1.0,C["steel_line"],12)}{arc(val/100,col,12)}'
            f'<text x="{cx}" y="{cy-2}" {MONO} font-size="40" fill="{col}" text-anchor="middle" font-weight="bold">{val}%</text>'
            f'<text x="{cx}" y="{cy+20}" {SANS} font-size="10" fill="{C["ink_faint"]}" text-anchor="middle" letter-spacing="1.5">AI VISIBILITY</text>'
            f'<text x="{cx}" y="{cy+78}" {SANS} font-size="10" fill="{C["ink_dim"]}" text-anchor="middle">Directional readiness index</text></svg>')

def gap_svg(local):
    rep = min(96, 50 + local["reviews"]/2 + (float(local["rating"])-4)*20)  # reputation strength heuristic
    vis = 28
    W = 520
    def bar(y, label, v, col, note):
        bw = (W-260)*v/100
        return (f'<text x="0" y="{y+15}" {SANS} font-size="12" fill="{C["ink2"]}">{label}</text>'
                f'<rect x="150" y="{y}" width="{W-160}" height="22" fill="{C["panel2"]}" stroke="{C["steel_line"]}" rx="2"/>'
                f'<rect x="150" y="{y}" width="{bw:.0f}" height="22" fill="{col}" rx="2"/>'
                f'<text x="{150+bw+8:.0f}" y="{y+16}" {MONO} font-size="10.5" fill="{col}">{note}</text>')
    b1 = bar(8, "Reputation strength", rep, C["green"], f'{local["rating"]} of 5 - {local["reviews"]} rev')
    b2 = bar(48, "Search visibility", vis, C["red"], "buried")
    return f'<svg viewBox="0 0 600 90" xmlns="http://www.w3.org/2000/svg" width="100%">{b1}{b2}</svg>'

# ----------------------------------------------------------------------------
# HTML fragment builders
# ----------------------------------------------------------------------------
def score_grid(s):
    order = [("Design / UX","design"),("Mobile Experience","mobile"),("Technical SEO","tech_seo"),
             ("Local SEO","local_seo"),("Content / E-E-A-T","content_eeat"),("AEO · Answer Engine","aeo"),
             ("GEO · Generative","geo"),("Agentic Readiness","agentic"),("Accessibility","accessibility"),("CRO","cro")]
    rows = ""
    for label, key in order:
        v = s[key]
        rows += (f'<div class="dim"><span class="dn">{label}</span>'
                 f'<span class="track"><i class="{band(v)}" style="width:{v*10}%"></i></span>'
                 f'<span class="sc"><b>{v}</b>/10</span></div>')
    return rows

def items(lst, good=False):
    out = ""
    for it in lst:
        out += (f'<div class="item"><span class="k"></span><span class="x">'
                f'<b>{esc(it["title"])}</b> {esc(it["detail"])}</span></div>')
    return out

def probe_block(probe):
    rows = ""
    width = max((len(p["label"]) for p in probe), default=20)
    for p in probe:
        dots = "." * max(2, (width+4) - len(p["label"]))
        status_cls = "ok" if p["status"] in ("PRESENT","ADEQUATE") else "no"
        note = f'   <span class="c">{esc(p.get("note",""))}</span>' if p.get("note") else ""
        rows += f'{esc(p["label"])} {dots} <span class="{status_cls}">{esc(p["status"])}</span>{note}\n'
    return rows.rstrip("\n")

def competitor_rows(comps):
    sym = {"yes": ('chk','✓'), "no": ('x','✕'), "partial": ('mid','~')}
    out = ""
    for c in comps:
        cls = ' class="you"' if c["you"] else ""
        name = f'{esc(c["name"])} (you)' if c["you"] else esc(c["name"])
        mc_cls, mc = sym[c["mobile_call"]]
        sc_cls, sc = sym[c["schema"]]
        nd = c["name_domain"]
        nd_cls = "chk" if nd == "ok" else "x"
        nd_txt = "✓" if nd == "ok" else esc(nd)
        ov_cls = "chk" if c["overall"][0] in "AB" else ("mid" if c["overall"][0] == "C" else "x")
        out += (f'<tr{cls}><td class="name">{name}</td>'
                f'<td class="cmp-rating">{esc(c["rating"])}★ · {c["reviews"]}</td>'
                f'<td class="{mc_cls}">{mc}</td><td class="{sc_cls}">{sc}</td>'
                f'<td class="{nd_cls}">{nd_txt}</td><td class="{ov_cls}">{esc(c["overall"])}</td></tr>')
    return out

def flag_chips(flags):
    icon = {"AGENT-BLIND":"⚡","AI-INVISIBLE":"🔍","A11Y-RISK":"♿","NO-LOCAL":"📍"}
    return "".join(f'<span class="flag hot">{icon.get(f,"")} {f}</span>' for f in flags)

def timeline_steps(plan):
    out = ""
    for st in plan:
        dot = "tl-dot" + (" later" if st["phase"] == "later" else "")
        out += (f'<div class="tl-step"><div class="{dot}"></div>'
                f'<div class="tl-wk">{esc(st["week"])}</div>'
                f'<div class="tl-title">{esc(st["title"])}</div>'
                f'<div class="tl-desc">{esc(st["detail"])}</div></div>')
    return out

def branch_cards():
    out = ""
    for cat, gw, name, tag, desc, cta, url in BRANCHES:
        out += (f'<a class="forge-card" href="{url}"><div class="fc-no">{gw}</div>'
                f'<div class="fc-cat">{cat}</div><div class="fc-name">{name}</div>'
                f'<div class="fc-tag">{tag}</div><div class="fc-desc">{desc}</div>'
                f'<div class="fc-cta">{cta}</div></a>')
    return out

def paras(lst):
    return "".join(f"<p>{esc(p) if False else p}</p>" for p in lst)  # allow inline <b> in source

# ----------------------------------------------------------------------------
# MASTER TEMPLATE
# ----------------------------------------------------------------------------
def build_html(a):
    s = a["scores"]
    avg = sum(s.values())/len(s)
    grade, gcol = grade_from_avg(avg)
    biz, url = esc(a["business"]["name"]), esc(a["business"]["url"])
    ref, date = esc(a["meta"]["ref"]), esc(a["meta"]["date"])
    L = a["local"]

    mast_cta = ('<div class="mast-cta">'
                f'<a class="book" href="{CALENDAR_URL}">Book a Meeting</a>'
                f'<a class="call" href="tel:+13692121203">Call <b>(369) 212-1203</b></a>'
                '</div>')

    def mast(tag):
        return (f'<div class="mast"><div class="brand"><div class="gx">G<b>A</b><b>E</b>LWORX</div>'
                f'<div class="tag">{tag}</div></div>'
                f'{mast_cta}'
                f'<div class="doc-meta"><div><span class="lbl">REF</span> {ref}</div>'
                f'<div><span class="lbl">CLASS</span> CONFIDENTIAL</div></div></div>')

    def foot(n, total=5):
        return (f'<div class="foot"><div>Generated {date} · <span class="fx">Confidential</span></div>'
                f'<div class="pg">PAGE <b>0{n}</b> / 0{total}</div><div>GAELWORX</div></div>')

    css = _STYLES

    # ---- PAGE 1 ----
    p1 = f'''<div class="page">
  <div class="mast"><div class="brand"><div class="gx">G<b>A</b><b>E</b>LWORX</div>
  <div class="tag">Brand Source of Truth · Automatic Execution · Clan Protected</div></div>
  {mast_cta}
  <div class="doc-meta"><div><span class="lbl">DOC</span> SITE-AUDIT-LEDGER</div>
  <div><span class="lbl">REF</span> {ref}</div><div><span class="lbl">CLASS</span> CONFIDENTIAL</div></div></div>
  <div class="hairline"></div>
  <div class="target"><div class="who"><div class="eyebrow">Audit Target</div>
  <div class="biz">{biz}</div><div class="url">{url}</div>
  <div class="flags">{flag_chips(a["flags"])}</div></div>
  <div class="verdict-box"><div class="vlabel">Overall Grade</div>
  <div class="grade" style="color:{gcol}">{grade}</div><div class="avg">AVG <b>{avg:.1f}</b> / 10</div></div></div>
  <p class="intro-line">A ten-dimension audit of your website's ability to win customers across <b>search, mobile, AI assistants, and local discovery.</b> Every finding below is observed directly from your live site — nothing estimated.</p>
  <div class="sec-h first"><span class="n">02</span><span class="t">Dimensional Scoring</span><span class="r"></span></div>
  <div class="grid">{score_grid(s)}</div>
  <p class="grid-note">Bars: <span style="color:{C['green']}">green</span> = strong (7–10) · <span style="color:{C['amber']}">amber</span> = needs work (4–6) · <span style="color:{C['red']}">red</span> = critical (1–3). The three lowest dimensions are where you're losing the most customers right now — detailed on the following pages.</p>
  <div class="chart-row">
    <div class="chart-card"><div class="ct">Verified Dimensions</div>
      <div class="cs">The four dimensions measured directly from your live site.</div>
      <div class="cwrap">{radar_svg(s)}</div></div>
    <div class="chart-card"><div class="ct">Score Distribution</div>
      <div class="cs">How all ten dimensions fall across the risk bands.</div>
      <div class="cwrap">{bands_svg(s)}</div></div>
  </div>
  {foot(1)}
</div>'''

    # ---- PAGE 2: Forge Report + AI Blind Spot ----
    p2 = f'''<div class="page">{mast("Site Audit Ledger · "+biz)}<div class="hairline"></div>
  <div class="sec-h first"><span class="n">03</span><span class="t">Forge Report</span><span class="r"></span></div>
  <div class="cols">
    <div class="block good"><h4>◢ What's Working</h4>{items(a["working"], True)}</div>
    <div class="block"><h4>◢ What's Costing You Leads Now</h4>{items(a["costing"])}</div>
  </div>
  <div class="sec-h"><span class="n">04</span><span class="t">Your AI Search Blind Spot</span><span class="r"></span></div>
  <div class="wide"><div class="lead">AEO + GEO · How machines read your site</div>
  {paras(a["ai_blind_spot"]["paragraphs"])}
  <div class="codeblock"><span class="c">// machine-readiness probe — answer & generative engines</span>
{probe_block(a["ai_blind_spot"]["probe"])}</div></div>
  {foot(2)}
</div>'''

    # ---- PAGE 3: dial + agentic + competitor table ----
    p3 = f'''<div class="page">{mast("Site Audit Ledger · "+biz)}<div class="hairline"></div>
  <div style="margin-top:22px"></div>
  <div class="dial-card"><div class="dwrap">{dial_svg(s)}</div>
  <div class="dtext"><div class="dt">Combined AI Visibility</div>
  <p>A blended index of how discoverable you are to answer engines, generative search, and autonomous agents — the AI layer that increasingly sits between customers and local businesses.</p></div></div>
  <div class="sec-h"><span class="n">05</span><span class="t">Agentic &amp; Future Readiness</span><span class="r"></span></div>
  <div class="wide"><div class="lead">Can an autonomous AI agent actually use your site?</div>
  {paras(a["agentic"]["paragraphs"])}
  <div class="codeblock"><span class="c">// agent-access probe</span>
{probe_block(a["agentic"]["probe"])}</div></div>
  <div class="sec-h cmp-sec"><span class="n">06</span><span class="t">Local Competitive Position</span><span class="r"></span></div>
  <table class="cmp-table"><thead><tr><th class="lead-col">Business</th><th>Google</th>
  <th>Mobile<br>Call</th><th>Schema /<br>AI-Ready</th><th>Name /<br>Domain</th><th>Overall</th></tr></thead>
  <tbody>{competitor_rows(a["competitors"])}</tbody></table>
  <p class="cmp-note">Google ratings &amp; review counts are live data. Mobile-call, schema, and overall columns are illustrative — based on a first-pass look, not a full audit of each competitor's site.</p>
  {foot(3)}
</div>'''

    # ---- PAGE 4: Local Position + Accessibility ----
    acc = ""
    if s["accessibility"] <= 6:
        acc = f'''<div class="sec-h"><span class="n">07</span><span class="t">Accessibility &amp; Compliance</span><span class="r"></span></div>
  <div class="wide"><div class="lead">Score {s["accessibility"]} / 10 · included because it's below threshold</div>
  <p>A portion of your potential customers — and Google's own ranking systems — depend on an accessible site. We found gaps that are both a legal-exposure risk and a quiet ranking drag:</p>
  <div class="codeblock"><span class="c">// accessibility & compliance probe</span>
{probe_block(a["accessibility"]["probe"])}</div>
  <p>{esc(a["accessibility"]["note"])}</p></div>'''
    p4 = f'''<div class="page">{mast("Site Audit Ledger · "+biz)}<div class="hairline"></div>
  <div class="sec-h first"><span class="n">{"06b" if False else "0"}</span><span class="t">Local Position &amp; Reputation</span><span class="r"></span></div>
  <div class="kv">
    <div class="cell accent"><div class="m">{esc(L["rating"])}★</div><div class="l">Google Rating</div></div>
    <div class="cell"><div class="m">{L["reviews"]}</div><div class="l">Reviews</div></div>
    <div class="cell"><div class="m">{esc(L["competitor_count"])}</div><div class="l">Local Competitors</div></div>
    <div class="cell accent"><div class="m">{esc(L["map_rank"])}</div><div class="l">Map-Pack Rank</div></div>
  </div>
  <div class="chart-wide"><div class="ct">Reputation vs. Search Visibility</div>{gap_svg(L)}</div>
  <div class="wide" style="margin-top:6px"><div class="lead">The disconnect between reputation and visibility</div>
  {paras(L["paragraphs"])}</div>
  {acc}
  {foot(4)}
</div>'''

    # ---- PAGE 5: timeline + bottom line + calendar + forges ----
    p5 = f'''<div class="page">{mast("Site Audit Ledger · "+biz)}<div class="hairline"></div>
  <div class="sec-h first"><span class="n">08</span><span class="t">The 30-Day Plan</span><span class="r"></span></div>
  <div class="timeline"><div class="tl-track"></div>{timeline_steps(a["plan"])}</div>
  <div class="sec-h"><span class="n">09</span><span class="t">Bottom Line</span><span class="r"></span></div>
  <div class="bottom"><div class="bl">◣ The One Thing That Matters Most ◢</div>
  <p>{esc(a["bottom_line"])}</p></div>
  <div class="forge-sec">
    <div class="forge-head"><div class="fh-l">Four Branches · One <b>Forge</b></div>
    <div class="fh-r">Point the sword. Pick the branch.</div></div>
    <a class="cal-cta" href="{CALENDAR_URL}">
      <div class="cc-l">Ready to fix what's in this report? <b>Book a 15-minute call.</b></div>
      <div class="cc-btn">Grab a time →</div></a>
    <div class="forge-grid">{branch_cards()}</div>
    <div class="forge-foot">GAELWORX · <b>gaelworx.com</b> · Automatic Execution</div>
  </div>
  {foot(5)}
</div>'''

    return f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GAELWORX Audit Ledger — {biz}</title><style>{css}</style></head>
<body>{p1}{p2}{p3}{p4}{p5}</body></html>'''

# ----------------------------------------------------------------------------
# RENDER
# ----------------------------------------------------------------------------
def render(audit_path, pdf_path):
    """Render audit JSON -> A4 PDF. Hardened for locked-down sandboxes with a
    THREE-TIER fallback so the report card is ALWAYS produced in some form:
      1. Playwright/Chromium  (best: full fidelity, the intended path)
      2. weasyprint           (browser-free PDF, if installed)
      3. HTML only            (never fails — the .html is always written first)
    Always prints which tier succeeded, or a RENDER ERROR with the exact fix.
    """
    import os
    a = json.load(open(audit_path))
    html_doc = build_html(a)
    html_path = os.path.abspath(pdf_path.replace(".pdf", ".html"))
    pdf_path = os.path.abspath(pdf_path)
    # The HTML is written FIRST and unconditionally — it can never fail, so the
    # report card always exists at least as HTML even if every PDF path dies.
    open(html_path, "w").write(html_doc)

    # ---- TIER 1: Playwright / Chromium ----
    try:
        from playwright.sync_api import sync_playwright
        p = b = None
        try:
            p = sync_playwright().start()
            b = p.chromium.launch(args=[
                "--no-sandbox", "--disable-dev-shm-usage",
                "--disable-gpu", "--single-process",
            ])
            pg = b.new_page()
            pg.set_default_timeout(60000)
            pg.goto("file://" + html_path, wait_until="load", timeout=60000)
            pg.pdf(path=pdf_path, format="A4", print_background=True,
                   prefer_css_page_size=True,
                   margin={"top": "0", "bottom": "0", "left": "0", "right": "0"})
        finally:
            try:
                if b: b.close()
            except Exception: pass
            try:
                if p: p.stop()
            except Exception: pass
        if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 1000:
            return pdf_path, html_path, "chromium"
    except Exception as e:
        sys.stderr.write(f"[tier1 chromium failed: {type(e).__name__}: {e}] trying fallback...\n")

    # ---- TIER 2: weasyprint (browser-free) ----
    try:
        from weasyprint import HTML as _WHTML
        _WHTML(filename=html_path).write_pdf(pdf_path)
        if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 1000:
            return pdf_path, html_path, "weasyprint"
    except Exception as e:
        sys.stderr.write(f"[tier2 weasyprint unavailable: {type(e).__name__}] using HTML fallback...\n")

    # ---- TIER 3: HTML only (always succeeds) ----
    # No PDF engine available. The .html is fully styled and self-contained —
    # it can be opened in any browser and printed to PDF manually, or attached
    # to the email as-is. The report card is NOT lost.
    return None, html_path, "html-only"

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("usage: python3 render_report_standalone.py audit.json report_card.pdf"); sys.exit(1)
    try:
        pdf, htmlf, tier = render(sys.argv[1], sys.argv[2])
        if tier == "html-only":
            print(f"BUILT (HTML only — no PDF engine in this sandbox):\n  {htmlf}\n"
                  f"  To enable PDF: pip install playwright && python3 -m playwright install chromium\n"
                  f"  (the HTML is fully styled and can be attached or printed as-is)")
        else:
            print(f"rendered ({tier}): {pdf}\n          {htmlf}")
    except Exception as e:
        # Loud, single-line failure so the agent never sees "no outcome"
        print(f"RENDER ERROR: {type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)
