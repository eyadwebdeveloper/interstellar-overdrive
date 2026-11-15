"""Builds docs/AURA-AstroVitals-Documentation.pdf.

Run from the project root:  python3 _technical_support/docs/build_pdf.py
Needs reportlab and the Carlito / Caladea / DejaVu Sans Mono fonts (common on Linux).
Screenshots come from docs/screenshots (regenerate them with
_technical_support/ai-verification/capture_docs.py).
"""
import os
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Preformatted, Spacer, Table, TableStyle, NextPageTemplate,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon, Circle

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SHOTS = os.path.join(ROOT, "docs", "screenshots")
OUT = os.path.join(ROOT, "docs", "AURA-AstroVitals-Documentation.pdf")

FD = "/usr/share/fonts/truetype/crosextra/"
pdfmetrics.registerFont(TTFont("Body", FD + "Carlito-Regular.ttf"))
pdfmetrics.registerFont(TTFont("Body-B", FD + "Carlito-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Body-I", FD + "Carlito-Italic.ttf"))
pdfmetrics.registerFont(TTFont("Body-BI", FD + "Carlito-BoldItalic.ttf"))
pdfmetrics.registerFont(TTFont("Head", FD + "Caladea-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Mono", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily("Body", normal="Body", bold="Body-B", italic="Body-I", boldItalic="Body-BI")

FOREST = colors.HexColor("#173c35")
FOREST2 = colors.HexColor("#26584b")
MINT = colors.HexColor("#c1ebc9")
MINT_SOFT = colors.HexColor("#e9f6ec")
PAPER = colors.HexColor("#f7f8f3")
INK = colors.HexColor("#1b2a26")
MUTED = colors.HexColor("#5d6e67")
LINE = colors.HexColor("#d9e2d6")
AMBER = colors.HexColor("#c98a2a")
AMBER_SOFT = colors.HexColor("#fbf1dc")
INFO_SOFT = colors.HexColor("#e6eff6")

W, H = A4
M = 2.0 * cm
FW = W - 2 * M

S = {
    "body": ParagraphStyle("body", fontName="Body", fontSize=10.5, leading=15.2, textColor=INK, spaceAfter=7),
    "lead": ParagraphStyle("lead", fontName="Body", fontSize=12.5, leading=18, textColor=MUTED, spaceAfter=10),
    "h1": ParagraphStyle("h1", fontName="Head", fontSize=25, leading=29, textColor=FOREST, spaceBefore=0, spaceAfter=10),
    "h2": ParagraphStyle("h2", fontName="Body-B", fontSize=14.5, leading=18, textColor=FOREST, spaceBefore=12, spaceAfter=5),
    "h3": ParagraphStyle("h3", fontName="Body-B", fontSize=11.5, leading=15, textColor=FOREST2, spaceBefore=8, spaceAfter=3),
    "bullet": ParagraphStyle("bullet", fontName="Body", fontSize=10.5, leading=15, textColor=INK, leftIndent=14, bulletIndent=3, spaceAfter=3),
    "cap": ParagraphStyle("cap", fontName="Body-I", fontSize=9, leading=12, textColor=MUTED, spaceAfter=10, alignment=TA_LEFT),
    "cell": ParagraphStyle("cell", fontName="Body", fontSize=9.5, leading=12.6, textColor=INK),
    "cellb": ParagraphStyle("cellb", fontName="Body-B", fontSize=9.5, leading=12.6, textColor=INK),
    "cellh": ParagraphStyle("cellh", fontName="Body-B", fontSize=9.5, leading=12.6, textColor=colors.white),
    "code": ParagraphStyle("code", fontName="Mono", fontSize=8.2, leading=11.2, textColor=INK),
    "toc1": ParagraphStyle("toc1", fontName="Body-B", fontSize=12.5, leading=25, textColor=FOREST, leftIndent=0),
    "toc2": ParagraphStyle("toc2", fontName="Body", fontSize=10, leading=15, textColor=MUTED, leftIndent=16),
}


def P(text, style="body"):
    return Paragraph(text, S[style])


def bullets(items):
    return [Paragraph(t, S["bullet"], bulletText="•") for t in items]


def table(rows, widths, header=True, zebra=True):
    data = []
    for r, row in enumerate(rows):
        data.append([Paragraph(str(c), S["cellh"] if (header and r == 0) else S["cell"]) for c in row])
    t = Table(data, colWidths=[w * FW for w in widths], repeatRows=1 if header else 0)
    st = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
    ]
    if header:
        st += [("BACKGROUND", (0, 0), (-1, 0), FOREST)]
    if zebra:
        for i in range(1 if header else 0, len(rows)):
            if i % 2 == 0:
                st.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f3f6f0")))
    t.setStyle(TableStyle(st))
    return t


def callout(title, text, kind="info"):
    bg, bar = {"info": (INFO_SOFT, colors.HexColor("#4a7a9b")), "warn": (AMBER_SOFT, AMBER), "ok": (MINT_SOFT, FOREST2)}[kind]
    inner = [Paragraph(f"<b>{title}</b>", ParagraphStyle("ct", parent=S["cell"], fontName="Body-B", fontSize=10.5, textColor=FOREST, spaceAfter=2)),
             Paragraph(text, ParagraphStyle("cx", parent=S["cell"], fontSize=10, leading=14))]
    t = Table([[inner]], colWidths=[FW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("LINEBEFORE", (0, 0), (0, -1), 3.2, bar),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return KeepTogether([t, Spacer(1, 9)])


def code(text):
    pre = Preformatted(text.strip("\n"), S["code"])
    t = Table([[pre]], colWidths=[FW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#eef2ec")), ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return [t, Spacer(1, 9)]


def shot(name, width=1.0, caption=None, max_h=11.5 * cm, keep=True):
    path = os.path.join(SHOTS, name)
    from PIL import Image as PI
    w, h = PI.open(path).size
    tw = FW * width
    th = tw * h / w
    if th > max_h:
        th = max_h
        tw = th * w / h
    img = Image(path, width=tw, height=th)
    box = Table([[img]], colWidths=[tw + 4])
    box.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.7, LINE), ("LEFTPADDING", (0, 0), (-1, -1), 1),
                             ("RIGHTPADDING", (0, 0), (-1, -1), 1), ("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 1)]))
    box.hAlign = "CENTER"
    parts = [box]
    if caption:
        parts.append(Spacer(1, 4))
        parts.append(Paragraph(caption, ParagraphStyle("c2", parent=S["cap"], alignment=1)))
    else:
        parts.append(Spacer(1, 8))
    return KeepTogether(parts) if keep else parts


# ----------------------------------------------------------------- diagrams --

def arrow(d, x1, y, x2, color=FOREST2):
    d.add(Line(x1, y, x2 - 4, y, strokeColor=color, strokeWidth=1.4))
    d.add(Polygon([x2, y, x2 - 6, y + 3.2, x2 - 6, y - 3.2], fillColor=color, strokeColor=color))


def box(d, x, y, w, h, title, sub="", fill=colors.white, stroke=FOREST2, tcolor=FOREST):
    d.add(Rect(x, y, w, h, rx=6, ry=6, fillColor=fill, strokeColor=stroke, strokeWidth=1.1))
    d.add(String(x + w / 2, y + h - 15 if sub else y + h / 2 - 4, title, fontName="Body-B", fontSize=9.6, fillColor=tcolor, textAnchor="middle"))
    if sub:
        for i, line in enumerate(sub.split("\n")):
            d.add(String(x + w / 2, y + h - 28 - i * 10.5, line, fontName="Body", fontSize=8.2, fillColor=colors.HexColor("#cfe5db") if fill == FOREST else MUTED, textAnchor="middle"))


def diagram_layers():
    d = Drawing(FW, 215)
    box(d, 0, 85, 74, 46, "Vitals", "14 days\nsimulated", fill=MINT_SOFT)
    box(d, 108, 158, 118, 50, "Tier 0 · Rules", "fixed, transparent\nthresholds", fill=colors.white, stroke=AMBER, tcolor=colors.HexColor("#8a5d12"))
    box(d, 108, 85, 118, 50, "Tier 1 · Patterns", "personal baselines,\ncross-signal links")
    box(d, 108, 12, 118, 50, "Tier 2 · Forecast", "7-day outlook,\nuncertainty band")
    box(d, 270, 158, 100, 50, "Official alerts", "only Tier 0\ncan create these", fill=AMBER_SOFT, stroke=AMBER, tcolor=colors.HexColor("#8a5d12"))
    box(d, 270, 85, 100, 50, "Insights", "readiness, drivers,\nnext steps", fill=MINT_SOFT)
    box(d, 414, 118, 100, 46, "Copilot", "explains, never\ndecides", fill=FOREST, stroke=FOREST, tcolor=colors.white)
    box(d, 414, 40, 100, 46, "3D atlas", "findings pinned\nto anatomy", fill=colors.white)
    d.add(Line(74, 108, 90, 108, strokeColor=FOREST2, strokeWidth=1.4))
    arrow(d, 90, 110, 108)
    d.add(Line(90, 183, 90, 37, strokeColor=FOREST2, strokeWidth=1.4))
    for yy in (183, 37):
        arrow(d, 90, yy, 108)
    arrow(d, 226, 183, 270, AMBER)
    arrow(d, 226, 110, 270)
    d.add(Line(226, 37, 248, 37, strokeColor=FOREST2, strokeWidth=1.4))
    d.add(Line(248, 37, 248, 110, strokeColor=FOREST2, strokeWidth=1.4))
    arrow(d, 370, 110, 414, FOREST2)
    d.add(Line(392, 110, 392, 63, strokeColor=FOREST2, strokeWidth=1.4))
    arrow(d, 392, 63, 414)
    d.add(Line(392, 110, 392, 141, strokeColor=FOREST2, strokeWidth=1.4))
    arrow(d, 392, 141, 414)
    d.add(String(0, 3, "Amber path: rules are the only route to an official alert. Green paths are advisory.", fontName="Body-I", fontSize=8.4, fillColor=MUTED))
    return d


def diagram_copilot():
    d = Drawing(FW, 150)
    box(d, 0, 80, 86, 46, "Your question", "typed or tapped", fill=MINT_SOFT)
    box(d, 118, 80, 100, 46, "Build context", "readings JSON,\nno personal data")
    box(d, 250, 100, 118, 46, "Claude · live", "api/copilot.ts streams\nif a key is set", fill=FOREST, stroke=FOREST, tcolor=colors.white)
    box(d, 250, 22, 118, 46, "On-device engine", "always available,\nworks offline", fill=colors.white)
    box(d, 400, 60, 110, 56, "Answer", "+ Based-on chips\n+ action buttons", fill=MINT_SOFT)
    arrow(d, 86, 103, 118)
    d.add(Line(218, 103, 234, 103, strokeColor=FOREST2, strokeWidth=1.4))
    d.add(Line(234, 123, 234, 45, strokeColor=FOREST2, strokeWidth=1.4))
    arrow(d, 234, 123, 250)
    arrow(d, 234, 45, 250)
    d.add(Line(368, 123, 384, 123, strokeColor=FOREST2, strokeWidth=1.4))
    d.add(Line(384, 123, 384, 45, strokeColor=FOREST2, strokeWidth=1.4))
    d.add(Line(368, 45, 384, 45, strokeColor=FOREST2, strokeWidth=1.4))
    arrow(d, 384, 88, 400)
    d.add(String(262, 78, "no key, offline or error", fontName="Body-I", fontSize=8.2, fillColor=MUTED))
    return d


def diagram_3d():
    d = Drawing(FW, 100)
    box(d, 0, 28, 150, 52, "Human-Atlas models", "public/models · 3 sets\nthousands of structures", fill=FOREST, stroke=FOREST, tcolor=colors.white)
    box(d, 190, 28, 140, 52, "Built-in body", "BodyTwin · lightweight\nprocedural 3D")
    box(d, 370, 28, 140, 52, "Text index", "systems listed with\nlinks to each page", fill=colors.white)
    arrow(d, 150, 54, 190)
    arrow(d, 330, 54, 370)
    d.add(String(152, 86, "files missing / no WebGL2", fontName="Body-I", fontSize=8, fillColor=MUTED))
    d.add(String(332, 86, "no WebGL at all", fontName="Body-I", fontSize=8, fillColor=MUTED))
    return d


# ------------------------------------------------------------------ document --

class Doc(BaseDocTemplate):
    def __init__(self, path):
        super().__init__(path, pagesize=A4, leftMargin=M, rightMargin=M, topMargin=2.2 * cm, bottomMargin=2.0 * cm,
                         title="AURA AstroVitals — Product and Technical Documentation", author="AURA AstroVitals project",
                         subject="Documentation for the AURA AstroVitals prototype")
        cover = Frame(0, 0, W, H, id="cover", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        body = Frame(M, 2.0 * cm, FW, H - 4.2 * cm, id="body", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate("cover", [cover], onPage=draw_cover), PageTemplate("body", [body], onPageEnd=draw_page)])
        self.section = ""

    def afterFlowable(self, f):
        if isinstance(f, Paragraph):
            name = f.style.name
            if name in ("h1", "h2"):
                text = f.getPlainText()
                if name == "h1":
                    self.notify("TOCEntry", (0, text, self.page))
                if name == "h1":
                    self.section = text
                    self.canv.bookmarkPage(f"p{self.page}")
                    self.canv.addOutlineEntry(text, f"p{self.page}", 0, 0)


def draw_cover(c, doc):
    c.saveState()
    c.setFillColor(FOREST)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    # soft orbit rings
    c.setStrokeColor(colors.HexColor("#2e6b5b"))
    for r, a in [(15.5, 0.5), (11.5, 0.7), (7.5, 0.9)]:
        c.setLineWidth(0.9)
        c.setStrokeAlpha(a * 0.55)
        c.circle(W * 0.78, H * 0.70, r * cm, stroke=1, fill=0)
    c.setStrokeAlpha(1)
    c.setFillColor(MINT)
    c.circle(W * 0.78 + 7.5 * cm * 0.707, H * 0.70 + 7.5 * cm * 0.707, 0.2 * cm, stroke=0, fill=1)
    c.setFillColor(colors.HexColor("#2e6b5b"))
    c.circle(W * 0.78, H * 0.70, 2.6 * cm, stroke=0, fill=1)
    c.setFillColor(colors.HexColor("#1f4c42"))
    c.circle(W * 0.78 - 0.6 * cm, H * 0.70 + 0.5 * cm, 1.8 * cm, stroke=0, fill=1)
    # text
    c.setFillColor(MINT)
    c.setFont("Body-B", 11)
    c.drawString(2.4 * cm, H * 0.50 + 4.2 * cm, "P R O D U C T   &   T E C H N I C A L   D O C U M E N T A T I O N")
    c.setFillColor(colors.white)
    c.setFont("Head", 54)
    c.drawString(2.4 * cm, H * 0.50 + 0.6 * cm, "AURA")
    c.setFont("Head", 33)
    c.drawString(2.4 * cm, H * 0.50 - 1.0 * cm, "AstroVitals")
    c.setFont("Body", 15)
    c.setFillColor(colors.HexColor("#cfe5db"))
    c.drawString(2.4 * cm, H * 0.50 - 2.7 * cm, "A health workspace for crews far from Earth, with an AI that explains itself.")
    c.setStrokeColor(MINT)
    c.setLineWidth(1.4)
    c.line(2.4 * cm, H * 0.50 - 3.6 * cm, 5.4 * cm, H * 0.50 - 3.6 * cm)
    c.setFont("Body", 11)
    c.setFillColor(colors.HexColor("#a9cbbd"))
    c.drawString(2.4 * cm, 4.6 * cm, "Version 1.0  ·  November 2026")
    c.drawString(2.4 * cm, 3.95 * cm, "Real 3D anatomy atlas  ·  On-device AI  ·  Optional live Claude copilot")
    c.setFont("Body-I", 9.5)
    c.drawString(2.4 * cm, 2.4 * cm, "A demonstration prototype. All readings are simulated; the AI is advisory and not a clinical system.")
    c.restoreState()


def draw_page(c, doc):
    c.saveState()
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(M, H - 1.7 * cm, W - M, H - 1.7 * cm)
    c.setFont("Body-B", 9)
    c.setFillColor(FOREST)
    c.drawString(M, H - 1.5 * cm, "AURA · AstroVitals")
    c.setFont("Body", 9)
    c.setFillColor(MUTED)
    c.drawRightString(W - M, H - 1.5 * cm, doc.section)
    c.line(M, 1.6 * cm, W - M, 1.6 * cm)
    c.drawString(M, 1.05 * cm, "Simulated demo data · advisory only")
    c.drawRightString(W - M, 1.05 * cm, f"{doc.page}")
    c.restoreState()


def build():
    story = []
    story += [NextPageTemplate("body"), PageBreak()]

    # ---- contents
    story.append(P("Contents", "h1"))
    toc = TableOfContents()
    toc.levelStyles = [S["toc1"], S["toc2"]]
    toc.dotsMinLevel = 0
    story += [toc, Spacer(1, 16)]
    story.append(callout("How to read this document", "Sections 1–3 describe what the app does and how to run it. Sections 4–6 explain the AI, the copilot and the 3D atlas in depth. Sections 7–9 cover readability, configuration and how to extend the project. Sections 10–12 cover verification, safety and troubleshooting.", "ok"))
    story.append(PageBreak())

    # ---- 1 overview
    story.append(P("1. Overview", "h1"))
    story.append(P("AURA AstroVitals is an interactive health workspace for long-duration crews. It brings a person’s signals (sleep, heart rate variability, reaction time, radiation dose, fitness) together with a real 3D human-anatomy atlas, and adds an AI that tells them, in plain language, what it notices, why, and what would help.", "lead"))
    story.append(P("It is a <b>prototype</b>. Every reading is simulated, nothing is transmitted, and the AI is advisory. The goal is to show what a calm, trustworthy, <i>explainable</i> companion could feel like when a clinic is far away."))
    story.append(P("Design principles", "h2"))
    story += bullets([
        "<b>Your own baseline is the reference.</b> Findings compare you with your first week, not with a population average.",
        "<b>The AI shows its working.</b> Every statement names the readings behind it, and every layer of the system is labelled.",
        "<b>Rules and AI never blur.</b> Only fixed, transparent threshold rules can raise an official alert. The AI explains, forecasts and suggests; it never decides.",
        "<b>The body is the interface.</b> Findings are pinned to real anatomy that can be orbited, zoomed and opened.",
        "<b>Readable and local-first.</b> Large, adjustable text; everything works offline; data stays in the browser.",
    ])
    story.append(P("What is in the box", "h2"))
    story.append(table([
        ["Area", "Route", "Summary"],
        ["Overview", "#/", "AI hero (readiness, drivers, patterns, ask box) beside the 3D atlas, daily tasks, alerts, care links."],
        ["AURA Intelligence", "#/intelligence", "Readiness, next steps, the four AI layers, findings on the body, per-signal forecasts, cross-signal patterns, what-if simulator."],
        ["My health", "#/dashboard", "Metric detail, baselines, 7/14-day views, hazard filters, confidence and source time."],
        ["Body view", "#/body", "The full atlas with angle, zoom, layer and AI-overlay controls."],
        ["Alerts", "#/alerts", "Official rule alerts, advisory AI patterns (with Explain with AURA), reminders."],
        ["Check-in and tests", "#/checkin, #/pvt", "Four-step check-in and a three-minute reaction-time test."],
        ["Exercise", "#/exercise", "Equipment context, timers, sets, RPE, completed and partial records."],
        ["Training room", "#/games", "Four short educational games on space-health concepts."],
        ["Care", "#/support, #/crew, #/medical-event", "Local support notes, crew directory, validated medical-event documentation with JSON export."],
    ], [0.2, 0.22, 0.58]))
    story.append(Spacer(1, 8))
    story.append(callout("Keyboard shortcuts", "<b>Ctrl/Cmd + K</b> opens search. <b>Ctrl/Cmd + J</b> (or <b>/</b>) opens the Ask AURA copilot from anywhere. <b>Esc</b> closes dialogs and the copilot."))
    story.append(PageBreak())

    # ---- 2 getting started
    story.append(P("2. Getting started", "h1"))
    story.append(P("Requirements", "h2"))
    story += bullets([
        "Node.js 22.12 or newer (Node 24 recommended) and npm.",
        "A current Chrome, Edge, Safari or Firefox with CSS <font name='Mono'>@scope</font>, WebGL2 and <font name='Mono'>DecompressionStream</font> for the full atlas.",
        "The Human-Atlas model files in <font name='Mono'>public/models/</font> (about 70 MB across three sets).",
    ])
    story.append(P("Install and run", "h2"))
    story += code("""npm ci
npm run dev        # http://localhost:3000
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm run lint       # oxlint""")
    story.append(P("The app uses hash routing, so it runs on any static host without rewrites, for example <font name='Mono'>http://localhost:3000/#/intelligence</font>."))
    story.append(P("Enable the live Claude copilot (optional)", "h2"))
    story.append(P("The copilot works fully offline with no setup. To have Claude write the answers instead, give the server a key:"))
    story += code("""cp .env.example .env.local
# edit .env.local and set:
ANTHROPIC_API_KEY=your-key
npm run dev""")
    story.append(P("The badge in the copilot header changes from <b>On-device</b> to <b>Claude · live</b>. The key is read by the server function only and never reaches the browser."))
    story.append(callout("Without the model files", "If <font name='Mono'>public/models/</font> is missing, or the browser lacks WebGL2, the app does not break: it shows a smaller built-in 3D body and lists the systems as links. See section 6.", "warn"))
    story.append(P("First five minutes", "h2"))
    story += bullets([
        "Open <b>Overview</b>. Read the AI headline, then drag the 3D body and tap a label.",
        "Press <b>Ctrl/Cmd + J</b> and ask “Why is my reaction time slower?”. Note the <i>Based on</i> chips.",
        "Open <b>AURA Intelligence</b>, move the sleep slider in <i>What if?</i> and watch projected readiness change.",
        "Open <b>Body view</b>, try Back, Head and With muscle.",
        "Open <b>Profile → Text size</b> and choose Large.",
    ])
    story.append(PageBreak())

    # ---- 3 tour
    story.append(P("3. A tour of the app", "h1"))
    story.append(P("Overview and AURA Intelligence", "h2"))
    story.append(P("The Overview opens with the AI’s reading of today: a readiness score, the signals pulling it down, the strongest patterns, and an ask box, beside the 3D atlas with findings pinned to the anatomy. The Intelligence page expands each part."))
    story.append(shot("intelligence-top.png", 1.0, "AURA Intelligence: readiness with named drivers, and ranked next steps."))
    story.append(P("My health", "h2"))
    story.append(P("Every metric has a personal baseline, a 7- or 14-day view, a confidence figure and a source time, so the numbers are never presented as more certain than they are."))
    story.append(shot("dashboard.png", 1.0, "My health: signal trend against your own baseline, with a daily summary.", max_h=9.5 * cm))
    story.append(PageBreak())
    story.append(P("Alerts, check-ins and exercise", "h2"))
    story.append(P("Alerts separates transparent <b>rule</b> notices from <b>advisory</b> AI patterns and reminders. Each advisory has an <i>Explain with AURA</i> button. The check-in adds mood, energy, stress and sleep, which the wearable cannot see; exercise records sets and effort."))
    story.append(shot("alerts.png", 0.9, "Alerts: official rule alerts and advisory patterns are visibly different.", max_h=8.5 * cm))
    story.append(shot("checkin.png", 0.9, "Daily check-in: a short, focused flow with saved summaries.", max_h=8.5 * cm))
    story.append(PageBreak())
    story.append(P("Training room", "h2"))
    story.append(P("Four short games rehearse space-health ideas. Mechanics are illustrative and labelled as such; figures quoted in summaries reflect public space-life-science findings."))
    story.append(table([
        ["Game", "Route", "What it teaches"],
        ["Fuel the crew", "#/games/fuel", "Match six rations to the body system that needs them (bone, red cells, fluids, muscle, immunity)."],
        ["Load bearing", "#/games/load", "Plan twelve mission weeks of countermeasures on a tight time budget; overtraining halves gains."],
        ["Keep the clock", "#/games/clock", "Build one orbital day from seven decisions; a 24-hour dial and melatonin curve show the effect on sleep."],
        ["Fact from fiction", "#/games/facts", "Twelve myth-or-fact claims about the body in space, each explained."],
    ], [0.2, 0.2, 0.6]))
    story.append(Spacer(1, 8))
    story.append(shot("games.png", 0.9, "The Training room hub.", max_h=8.5 * cm))
    story.append(PageBreak())

    # ---- 4 AI
    story.append(P("4. AURA Intelligence", "h1"))
    story.append(P("The AI is built as four layers that are kept deliberately separate, so a reader always knows what produced a statement.", "lead"))
    story.append(diagram_layers())
    story.append(Spacer(1, 4))
    story.append(table([
        ["Layer", "Role", "Where it runs"],
        ["Tier 0 · Rules", "Fixed, transparent thresholds. The <b>only</b> layer that can raise an official alert.", "Backend (optional) or labelled fallback snapshot"],
        ["Tier 1 · Patterns", "Compares each signal with your own baseline; finds signals moving together.", "On this device (src/ai/engine.ts)"],
        ["Tier 2 · Forecast and risk", "Projects the next 7 days with an uncertainty band; scores deconditioning risk.", "On this device; backend model when connected"],
        ["Copilot", "Explains the findings in plain language using only the numbers it is given.", "On this device, or Claude via the server function"],
    ], [0.22, 0.5, 0.28]))
    story.append(shot("pipeline.png", 1.0, "The same four layers, as shown on the Intelligence page.", max_h=6.5 * cm))
    story.append(PageBreak())

    story.append(P("The on-device engine", "h2"))
    story.append(P("<font name='Mono'>src/ai/engine.ts</font> is deterministic and offline: the same readings always give the same findings. It is cheap enough to run on every render."))
    story.append(P("Step by step", "h3"))
    story += bullets([
        "<b>Baseline.</b> The median of the first seven days, with spread = MAD × 1.4826 (never smaller than a per-signal minimum), so one odd day cannot move “normal”.",
        "<b>Current value.</b> The mean of the last three days.",
        "<b>Drift.</b> (current − baseline) ÷ spread, signed so that positive always means “moved the wrong way” (for example HRV down, resting heart rate up).",
        "<b>Status.</b> Drift ≥ 2.5 is flagged as drifting; ≥ 1.2 in the worse direction is “watch”; otherwise steady.",
        "<b>Forecast.</b> A least-squares line over the 14 days, extended 7 days. The band is 1.64 × the residual spread, widening with the horizon like a random walk. Also reports days until the usual range would be left.",
        "<b>Sleep debt.</b> Hours under a 7 h 30 m target, summed over 14 days.",
    ])
    story.append(P("Signals and their weight in readiness", "h3"))
    story.append(table([
        ["Signal", "Worse when", "Weight", "Smallest change that matters"],
        ["Sleep", "lower", "0.27", "0.4 h"],
        ["HRV", "lower", "0.22", "3 ms"],
        ["Reaction time (PVT)", "higher", "0.17", "10 ms"],
        ["Resting heart rate", "higher", "0.14", "2 bpm"],
        ["VO₂ max", "lower", "0.10", "0.8"],
        ["Weight", "lower", "0.05", "0.8 kg"],
        ["Radiation dose", "higher", "0.05", "0.1 mSv/day"],
    ], [0.34, 0.2, 0.16, 0.3]))
    story.append(Spacer(1, 6))
    story.append(P("Readiness score", "h3"))
    story.append(P("Readiness starts at 92 and loses points for each signal that has drifted the wrong way: <font name='Mono'>points = −round(min(drift, 4) ÷ 4 × weight × 100 × 0.62)</font>. The result is clamped to 20–99 and labelled <b>Ready</b> (≥ 85), <b>Mostly ready</b> (≥ 70), <b>Run down</b> (≥ 55) or <b>Needs recovery</b>. The drivers are always listed, so the number is never a black box."))
    story.append(PageBreak())

    story.append(P("Signals, forecasts and patterns", "h2"))
    story.append(shot("signals.png", 1.0, "Each signal: your baseline band, recorded line, dashed forecast with uncertainty, and a plain sentence.", max_h=9.5 * cm))
    story.append(P("Cross-signal patterns", "h3"))
    story.append(P("When several signals move together, AURA names the pattern and its supporting evidence. Current patterns include <b>Reaction time is following your sleep</b> (with the correlation), <b>A recovery debt is building</b> (sleep, HRV and resting heart rate), <b>Aerobic fitness is drifting down slowly</b>, and <b>Radiation dose rate is creeping up</b>. The percentage shown is how strongly the data supports the <i>pattern</i>; it is not a probability of illness."))
    story.append(shot("patterns.png", 1.0, "Patterns are advisory (dashed border) and expandable to show their evidence.", max_h=6.5 * cm))
    story.append(PageBreak())

    story.append(P("What-if simulator", "h2"))
    story.append(P("The simulator answers “what if I slept more?” without guessing. A <b>personal response model</b> is fitted on the person’s own 14 days: how many milliseconds of reaction time and HRV moved per hour of sleep. Changing the sleep slider applies that relationship (damped to 60% so projections stay modest) and recomputes readiness against “if nothing changes”, which continues today’s trend."))
    story.append(P("Aerobic minutes are different: there is no exercise series in the data, so their effect (a small, saturating gain to HRV and resting heart rate, capped at 40 minutes a day) is an explicit <b>assumption</b> and is labelled as one on screen."))
    story.append(shot("what-if.png", 1.0, "Projected readiness, reaction time, HRV and resting heart rate for the chosen week.", max_h=7.5 * cm))
    story.append(callout("Honest limits", "Bands and percentages are not clinical intervals. The model has 14 points per signal; it illustrates a relationship, it does not prove one. The screen says so.", "warn"))
    story.append(PageBreak())

    # ---- 5 copilot
    story.append(P("5. The copilot: Ask AURA", "h1"))
    story.append(P("A conversational layer that explains the findings. Open it from the floating button, <b>Ctrl/Cmd + J</b>, or <b>/</b>. History is kept per crew member in the browser.", "lead"))
    story.append(diagram_copilot())
    story.append(Spacer(1, 6))
    tbl = Table([[shot("copilot.png", 0.5, "A grounded answer with evidence chips and an action button.", max_h=13.5 * cm, keep=False),
                  [P("How answers are grounded", "h3")] + bullets([
                      "<b>Based on</b> chips list the exact readings used (for example reaction time 264 ms now vs 244 ms baseline).",
                      "<b>Action buttons</b> jump to the right screen: the vigilance test, the exercise plan, the body view, the simulator.",
                      "<b>Follow-up chips</b> suggest the next question.",
                      "<b>Intents covered locally:</b> overall status, sleep, reaction time, heart and HRV, radiation, exercise, forecast, alerts and patterns, what-if (it parses “8 hours”), body, check-in context, baselines, and how AURA works.",
                      "<b>Emergency wording</b> (chest pain, trouble breathing, bleeding, loss of consciousness, self-harm and similar) is never answered clinically. It points to official procedures and the Medical event page.",
                  ])]], colWidths=[FW * 0.5, FW * 0.5])
    tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (0, 0), 14)]))
    story.append(tbl)
    story.append(PageBreak())

    story.append(P("The live endpoint", "h2"))
    story.append(P("<font name='Mono'>api/copilot.ts</font> is a serverless function (Vercel). It keeps the API key on the server and streams plain text to the browser."))
    story.append(table([
        ["Method", "Purpose", "Details"],
        ["GET /api/copilot", "Status probe", "Returns <font name='Mono'>{ \"configured\": true | false, \"simulated\": true }</font>. The UI uses it to choose between Claude · live and On-device."],
        ["POST /api/copilot", "Ask a question", "Body: <font name='Mono'>{ messages: [{role, content}], context }</font>. Streams text deltas. Returns 503 when no key is set."],
    ], [0.22, 0.2, 0.58]))
    story.append(Spacer(1, 8))
    story.append(P("Request context", "h3"))
    story.append(P("The browser sends only a compact, number-based context: readiness and drivers, each signal’s baseline, current value, drift, slope, 7-day forecast and 14 recorded values, detected patterns, sleep debt, the personal response fit, the count of open official alerts and the latest check-in. There are no names beyond the demo profile and no free-form health history."))
    story.append(P("Guard rails", "h3"))
    story += bullets([
        "The system prompt tells the model to use <b>only</b> numbers from the context, to say when it does not know, never to diagnose, prescribe or create alerts, and to route emergencies to official procedures.",
        "Answers are capped at about 160 words and 500 output tokens; only the last ten turns, each at most 1,500 characters, are sent.",
        "<font name='Mono'>COPILOT_ALLOWED_ORIGIN</font> optionally restricts which origin may call the endpoint.",
        "On any failure (no key, network, upstream error) the client discards the partial answer and falls back to the on-device engine, so the user always gets a reply.",
    ])
    story.append(P("Local development", "h3"))
    story.append(P("<font name='Mono'>vite.config.ts</font> includes a small dev plugin that serves the same handler, so <font name='Mono'>npm run dev</font> with a key in <font name='Mono'>.env.local</font> behaves like production."))
    story.append(P("Extending the copilot", "h3"))
    story += bullets([
        "<b>Add a topic:</b> add a branch to <font name='Mono'>answerLocally()</font> in <font name='Mono'>src/ai/copilot.ts</font>, before the default overview. Return text, evidence, actions and follow-ups.",
        "<b>Add a suggested question:</b> edit <font name='Mono'>SUGGESTED_PROMPTS</font>.",
        "<b>Give the model more facts:</b> add them to <font name='Mono'>serialiseContext()</font>; keep them numeric and simulated.",
    ])
    story.append(PageBreak())

    # ---- 6 atlas
    story.append(P("6. The 3D atlas", "h1"))
    story.append(P("The Body view shows real Human-Atlas anatomy, not a schematic figure. The same atlas appears in the Overview hero and the Intelligence page.", "lead"))
    story.append(table([
        ["Model", "Source", "Notes"],
        ["Male body", "BodyParts3D 4.0 (CC BY 4.0)", "2,234 individually selectable structures."],
        ["Female body", "Human Reference Atlas v1.10 (CC BY 4.0)", "1,220 meshes."],
        ["Leg muscles", "Visible Human Female (CC BY 4.0)", "76 donor muscles."],
    ], [0.2, 0.42, 0.38]))
    story.append(Spacer(1, 8))
    story.append(P("Models stream as gzip binary chunks on demand (only the systems currently shown are fetched), mount as zero-copy typed arrays and render in a handful of draw calls while every structure stays individually addressable. Credits and licences: <font name='Mono'>ATTRIBUTION.md</font>."))
    story.append(P("Stage and framing", "h2"))
    story += bullets([
        "<b>Immersive stage.</b> A dark observatory: glass platform, tick ring, drifting dust, a slow scan sweep, floor glow and vignette. The ambient motion turns off with <i>Reduce motion</i>.",
        "<b>Starts close.</b> The camera is framed by how many metres of body fill the view (head to hips by default) rather than a fixed far distance, with width protected so phones never crop the shoulders.",
        "<b>Curated layers.</b> Overview and Intelligence show glass skin, skeleton and organs without the muscle layer, so structures read and fewer files are downloaded.",
    ])
    story.append(P("Body view controls", "h2"))
    story.append(table([
        ["Control", "Options"],
        ["Model", "Male body · Female body · Leg muscles"],
        ["Angle", "Front · 3/4 · Side · Back"],
        ["Zoom", "Upper body · Torso · Head · Legs · Full body"],
        ["Layers", "See inside (hides muscle) · With muscle"],
        ["AI findings", "On · Off (callouts pinned to the anatomy)"],
        ["Mouse and touch", "Drag to orbit · scroll or pinch to zoom · hover for a structure’s name · tap to bring its system forward"],
    ], [0.25, 0.75]))
    story.append(Spacer(1, 8))
    story.append(P("AI on the anatomy", "h2"))
    story.append(P("Callouts are anchored to real structures and follow the camera: the heart for cardiovascular, the brain for nervous, the lymphatic nodes for immune and the skeleton for skeletal and muscular. Colour-coded dots show steady, watch or drifting; a callout fades when its structure is behind the body. Tapping a callout opens that system’s page, and hovering a system in the index brings it forward on the atlas."))
    story.append(KeepTogether([P("Fallback chain", "h2"), diagram_3d(), Spacer(1, 4)]))
    story.append(P("Key files", "h3"))
    story.append(table([
        ["File", "Purpose"],
        ["src/components/body/anatomyEngine.ts", "Three.js engine: loading, stage, framing, picking, projection for labels."],
        ["src/components/body/AtlasBodyScene.tsx", "Maps AURA systems to atlas systems; pins callouts; applies layers, view and framing."],
        ["src/components/body/AtlasStage.tsx", "Hero and Intelligence stage with automatic fallback."],
        ["src/components/body/presets.ts", "Framings, views and layer sets. Tune the camera here."],
        ["src/components/body/BodyTwin.tsx", "Built-in procedural body used only as a fallback."],
    ], [0.45, 0.55]))
    story.append(PageBreak())

    # ---- 7 readable
    story.append(P("7. Readable by design", "h1"))
    story.append(P("Small type was the most common usability problem, so text is larger by default and adjustable.", "lead"))
    story += bullets([
        "<b>Larger by default.</b> Every font size in the stylesheets is rem-based with a comfortable floor (nothing below about 12 px at the standard setting). Former 9–11 px labels are now 12–13 px; body text is about 16.5 px.",
        "<b>Text size control.</b> <i>Profile → Text size</i> offers Standard (100%), Large (112.5%) and Extra large (125%). Because sizes are rem-based, the whole interface scales together, including the 3D labels, and the choice is remembered.",
        "<b>Verified.</b> All 17 routes were checked at desktop and phone widths at both Standard and Extra large; none scrolls sideways.",
    ])
    story.append(shot("settings.png", 0.78, "Profile and preferences, with the Text size control.", max_h=10.5 * cm))
    story.append(shot("dashboard-xl.png", 0.82, "My health at Extra large text.", max_h=8 * cm))
    story.append(P("Other accessibility features", "h3"))
    story += bullets([
        "Kumbh Sans for body text; high-contrast colour tokens; visible focus rings.",
        "Dialog focus trapping and Escape to close; keyboard-reachable 3D labels and copilot controls.",
        "The copilot log is an <font name='Mono'>aria-live</font> region, and its status badge says whether answers are on-device or live.",
        "<i>Reduce motion</i> stops page transitions, the 3D ambient effects and auto-rotation, and the OS preference is respected as well.",
    ])
    story.append(PageBreak())

    # ---- 8 config & deploy
    story.append(P("8. Configuration and deployment", "h1"))
    story.append(P("Environment variables", "h2"))
    story.append(table([
        ["Variable", "Where", "Purpose"],
        ["ANTHROPIC_API_KEY", "Server or .env.local", "Enables the live Claude copilot. Never prefix with VITE_, which would expose it to the browser."],
        ["ANTHROPIC_MODEL", "Server", "Model used by the copilot. Defaults to claude-sonnet-5-5; check it against your account."],
        ["COPILOT_ALLOWED_ORIGIN", "Server", "Optional. Only this origin may call /api/copilot."],
        ["VITE_COPILOT_ENDPOINT", "Build time", "Optional. Point the UI at a copilot function hosted elsewhere."],
    ], [0.28, 0.2, 0.52]))
    story.append(Spacer(1, 8))
    story.append(P("Deploying", "h2"))
    story += bullets([
        "<b>Vercel (recommended).</b> Import the repository with the Vite framework preset. <font name='Mono'>api/copilot.ts</font> becomes a function automatically. Add <font name='Mono'>ANTHROPIC_API_KEY</font> under Environment Variables and redeploy to enable live mode.",
        "<b>Any static host.</b> Run <font name='Mono'>npm run build</font> and serve <font name='Mono'>dist/</font>. Hash routing needs no rewrite rules. The copilot stays on-device unless you host the function elsewhere.",
        "<b>Model files.</b> <font name='Mono'>public/models/</font> must ship with the build; it is not generated. Chunks are fetched on demand and are well suited to a CDN with long-lived caching.",
    ])
    story.append(P("Optional backend", "h2"))
    story.append(P("Tier 0/1/2 snapshots can come from a backend described in <font name='Mono'>src/api/</font> (contract, client, adapters). Without it, the app labels its data as a fallback snapshot. During development the dev server proxies <font name='Mono'>/api</font> to a local backend, so a harmless 502 in the console just means none is running. <font name='Mono'>_technical_support/aura-integration/</font> contains a mock backend and adapter tests."))
    story.append(PageBreak())

    # ---- 9 structure
    story.append(P("9. Project structure and extending it", "h1"))
    story += code("""api/
  copilot.ts              Serverless copilot endpoint (GET status, POST stream)
src/
  ai/
    engine.ts             Baselines, drift, forecasts, patterns, readiness, what-if
    copilot.ts            Grounded local answers, live client, status probe, typing
  api/                    Backend contract, client and adapters (optional)
  components/
    ai/                   Copilot panel + launcher, AI hero, readiness ring, badges
    body/                 Atlas engine, scene, stage, presets, callouts, fallback twin
    ui/                   Accessible primitives and charts
    AppShell.tsx          Navigation, search, profile + text-size settings
  data/                   Simulated vitals, games and medical content
  hooks/                  useAura (backend), useIntelligence (AI context)
  lib/anatomy/            Atlas manifest types, loading, layout
  pages/                  Route screens (+ games/)
  stores/                 Zustand: crew, settings, app workflows, copilot
  styles/                 design-system.css (tokens), ai.css, page CSS using @scope
public/models/            Human-Atlas geometry (manifests + .bin.gz chunks)
_technical_support/       Verification scripts, mock backend, this document's builder
docs/                     Screenshots and the documentation PDF""")
    story.append(P("Recipes", "h2"))
    story.append(P("Add a signal to the AI", "h3"))
    story += bullets([
        "Add it to <font name='Mono'>src/data/vitalsData.ts</font> with a 14-day <font name='Mono'>spark</font>, a unit and a <font name='Mono'>normalRange</font>.",
        "Add a spec to <font name='Mono'>SIGNAL_SPECS</font> in <font name='Mono'>engine.ts</font>: id, short name, polarity (which direction is worse), weight, body system and the smallest change that matters. Keep weights summing to about 1.",
        "The signals table, forecast, readiness drivers, copilot context and 3D callouts pick it up automatically.",
    ])
    story.append(P("Add a pattern", "h3"))
    story.append(P("Push a new entry in <font name='Mono'>analyse()</font> with a title, detail, confidence, systems, evidence strings and an <font name='Mono'>ask</font> prompt. It appears on Overview, the Intelligence page and in the copilot."))
    story.append(P("Change the camera", "h3"))
    story.append(P("Edit <font name='Mono'>ZOOMS</font> and <font name='Mono'>CLOSE_FRAMING</font> in <font name='Mono'>presets.ts</font> (height in metres that fills the view, and the height looked at). The hero uses its own framing in <font name='Mono'>AtlasStage.tsx</font>."))
    story.append(P("Change text sizes", "h3"))
    story.append(P("Sizes are rem-based. To change the three presets edit <font name='Mono'>TEXT_SCALE</font> in <font name='Mono'>settingsStore.ts</font>; to change a component’s size edit its rem value in the stylesheet."))
    story.append(PageBreak())

    # ---- 10 verification
    story.append(P("10. Testing and verification", "h1"))
    story.append(P("Checks run on this version", "h2"))
    story.append(table([
        ["Check", "Result"],
        ["TypeScript (tsc, strict)", "0 errors"],
        ["Production build (vite)", "Builds cleanly"],
        ["oxlint", "0 errors, 12 warnings (hook-dependency notes)"],
        ["Route sweep", "17 routes × desktop and phone × Standard and Extra large text: no horizontal overflow, no console errors"],
        ["Copilot endpoint (no key)", "GET returns configured:false; POST returns 503; the app falls back to on-device answers"],
        ["Copilot conversation", "Questions answered with evidence chips and actions; typing speed adapts to answer length"],
        ["3D code paths", "Framing, dark stage, pinned callouts, angle and zoom controls exercised against a stand-in atlas"],
    ], [0.34, 0.66]))
    story.append(Spacer(1, 8))
    story.append(callout("What was not tested", "The authoring environment did not contain the real Human-Atlas model files, so the 3D code was exercised with a small stand-in atlas in the same binary format. The framing numbers in presets.ts were chosen from that and may need a small tweak against the real models. The live Claude path was verified up to the missing-key response, not with a real key.", "warn"))
    story.append(P("Scripts", "h2"))
    story.append(table([
        ["Script (_technical_support/ai-verification)", "What it does"],
        ["smoke.py", "Loads Overview, Intelligence and Body at two viewports; asks the copilot; reports console errors."],
        ["smoke_atlas.py + make_fake_atlas.py", "Serves a generated stand-in atlas by intercepting /models requests and screenshots the 3D screens."],
        ["text_size_check.py", "Visits every route at two sizes and widths and reports horizontal overflow."],
        ["capture_docs.py", "Regenerates the screenshots used in this document and the README."],
    ], [0.4, 0.6]))
    story.append(Spacer(1, 6))
    story += code("""npx tsc --noEmit && npm run build && npm run lint
npx vite preview --port 4173 &
python3 _technical_support/ai-verification/text_size_check.py
python3 _technical_support/docs/build_pdf.py     # rebuild this PDF""")
    story.append(PageBreak())

    # ---- 11 safety
    story.append(P("11. Safety, privacy and limitations", "h1"))
    story.append(callout("This is a demonstration, not a clinical system", "Do not use it to make health decisions and do not enter real patient or astronaut data.", "warn"))
    story += bullets([
        "<b>Everything is simulated.</b> Vitals, baselines, thresholds, forecasts, risk and confidence are illustrative. Crew profiles share one demo dataset.",
        "<b>The AI is advisory.</b> It never diagnoses, prescribes, creates alerts or claims clinical accuracy. Support percentages describe how strongly the data backs a <i>pattern</i>, not the probability of illness.",
        "<b>Local storage is not clinical storage.</b> Check-ins, exercise, PVT results, support notes, copilot history and preferences live unencrypted in the browser.",
        "<b>Nothing is sent anywhere</b> unless live mode is enabled, in which case only the compact simulated readings and the question go to the copilot function and on to the model provider.",
        "<b>Communication delay is simulated.</b> No clinician availability or treatment approval is claimed.",
        "<b>Models have limits.</b> Fourteen points per signal is a small sample; the personal response model illustrates a relationship and the aerobic effect is an assumption.",
        "<b>Reference anatomy.</b> The atlas shows reference anatomy for orientation; it is not a complete model of every variation.",
    ])
    story.append(P("Known limitations", "h2"))
    story += bullets([
        "No authentication, real wearable connection, live telemetry or real communication link.",
        "The on-device copilot is rule-routed: it answers the topics it knows well and offers a grounded overview otherwise. Enable live mode for open-ended questions.",
        "The 3D atlas needs WebGL2 and <font name='Mono'>DecompressionStream</font>; older browsers get the built-in body.",
    ])
    story.append(PageBreak())

    # ---- 12 troubleshooting
    story.append(P("12. Troubleshooting", "h1"))
    story.append(table([
        ["Symptom", "Likely cause and fix"],
        ["A small built-in body appears instead of the atlas", "<font name='Mono'>public/models/</font> is missing or blocked, or the browser lacks WebGL2 or DecompressionStream. Restore the folder and reload."],
        ["Copilot says On-device although I set a key", "The variable must be named ANTHROPIC_API_KEY (not VITE_…), set on the server, and the dev server or deployment restarted. Check that GET /api/copilot returns configured:true."],
        ["Copilot answers are generic", "The on-device engine is topic-based. Enable live mode, or add a branch in answerLocally()."],
        ["502 errors in the console", "The dev or preview server proxies /api to a backend that is not running. Harmless; the app uses its fallback snapshot."],
        ["Text is too small or too large", "Open Profile → Text size and choose Standard, Large or Extra large."],
        ["The 3D view feels slow", "Turn on Reduce motion (stops ambient effects) and use Upper body or Torso zoom. Integrated graphics benefit most."],
        ["Labels on the body overlap", "They fade when their structure is behind the body; rotate or use a zoom preset. Offsets can be tuned in ai.css (.twin-label.sys-…)."],
        ["Routes 404 on a static host", "The app uses hash routes (#/…). Make sure links include the # and that index.html is served at the root."],
    ], [0.34, 0.66]))
    story.append(P("Glossary", "h2"))
    story.append(table([
        ["Term", "Meaning"],
        ["Baseline", "A person’s own typical level, from their first week of readings."],
        ["Drift", "How many baseline-spreads a signal has moved in the worse direction."],
        ["HRV", "Heart rate variability: beat-to-beat variation, a common recovery signal."],
        ["PVT", "Psychomotor vigilance test: a short reaction-time test sensitive to fatigue."],
        ["Readiness", "AURA’s 0–100 summary of how recovered the signals suggest you are. Guidance, not a medical score."],
        ["Tier 0/1/2", "Rules, patterns, and forecast and risk. Only Tier 0 creates official alerts."],
        ["MAD", "Median absolute deviation: a robust measure of spread."],
    ], [0.22, 0.78]))
    story.append(P("Credits", "h2"))
    story.append(P("Anatomy: BodyParts3D (The Database Center for Life Science), Human Reference Atlas / HuBMAP (Browne and Schlehlein), and the Visible Human Female leg-muscle set (Andreassen et al. 2023), all CC BY 4.0. Type: Bricolage Grotesque and Kumbh Sans. Built with React, Vite, Three.js, Zustand, Framer Motion and Lucide. The optional copilot uses Claude by Anthropic."))

    doc = Doc(OUT)
    doc.multiBuild(story)
    print("wrote", OUT)


if __name__ == "__main__":
    build()
