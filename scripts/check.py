"""Design checks for the hero, on desktop and mobile. Exits non-zero if a rule breaks.

Rules checked:
  1. The site name never overlaps the window (name bottom < window top).
  2. The departure block starts below the window (window bottom < info top).
  3. No JavaScript errors on load.
  4. Small text uses Karla; times use Young Serif.
  5. The hero shows a scroll hint; below it, the shelf holds its three paper objects,
     uses the same two fonts and nothing sticks out sideways. The notebook opens onto a single page
     («Cómo se hizo»): four concepts, each with the technology behind it.
  6. Scrolling tilts the wall away; at the end the papers have landed and the notebook is open.
     While the gaze drops, the painting always fills the screen: nothing behind it ever shows,
     not even right after a sudden jump of the scroll.
     The wall leads and the table follows; the table touches down before the end of the first
     screen and bounces up a little; the wall's shade follows its angle, not the scroll.
     Each paper in the air casts its shadow farther and lighter than at rest; on the pinned table
     each paper starts falling before the previous one lands and the cover opens as the last one
     settles. Scrolling back to the top undoes everything.
  7. The table is painted in watercolor once it arrives and carries its travel things
     (coffee, pen, Rodalies ticket); the page never scrolls sideways.
  8. Across 11 screen sizes (360 px to 2560 px): nothing leaves the screen sideways, tickets are
     as wide as their text, no text is under 13 px, the notebook's pages never become strips,
     the pinned table fits the screen and, on landscape screens, the hero scales like a poster. On the stacked
     hero (phones, portrait tablets) the window is panoramic, as wide as the stage, and no ticket touches its frame.
     With reduced motion nothing moves and everything is already in place, and the still frame's window is painted
     where #win is once the page is laid out.
  9. The wall darkens as a pigment wash painted in its own shader, not a flat DOM veil: it starts at
     the hinge and climbs the wall as the wall turns away, the texts on the wall dim with it, and
     nothing lingers once you scroll back to the top.
  10. The site looks the same as the reference frames in scripts/baseline/<system>/ (a still frame with reduced
     motion, the clock fixed at 10:00 in Madrid and the frozen timetable scripts/baseline/red.json, built into
     dist-paridad/ by npm run build:paridad): the guard for refactors that must change nothing.
     A missing reference is written from the current build; delete one to renew it.
  11. Fase 3, the letters' journey: scrolling from the hero to the table, the letters of h1.brand peel off the
     wall as paper cut-outs and land forming h2#qe, paired by position (reus.letras.pair) — with "Capacasa" the
     pairing must be exactly: C→Q, a→u, p→é, a→e, c→gap (fuses), a→s, s→gap, a→gap. Before the
     journey starts there are no chips and h1 shows normally; midway there are as many chips as source letters
     and the real h1/h2 are hidden only visually (never visibility:hidden/display:none, their text stays
     accessible); each chip starts glued to its glyph on the wall and ends glued to its glyph on the table
     (±3 px, both read live through #hero/#repisa's real transforms); once the wall is gone the chips vanish
     and the real h2 shows where they landed; scrubbing back and forth is reversible; reduced motion skips the
     whole journey (final states only). Modo rápido: `python3 scripts/check.py letras` corre solo estos checks
     en escritorio y móvil (como "paridad"); la suite completa también los incluye. Antes de tocar el scroll,
     ambos modos esperan (`hero_settled`) a que `.top`/`.info` hayan terminado su propia transición de entrada
     (independiente del scroll, añadida por scenery.ts al acabar el pintado del paisaje) -- nunca con un tiempo
     fijo, la regla de siempre. With iOS Safari's toolbar shrunk (innerHeight taller than the table's 100svh rest,
     simulated) the wall's hinge still sits on the table's real edge and the chips still land on their glyphs.
  12. The landscape is painted twice as fine on the stacked hero as on the wide one (reus.paisaje(): px of the
     landscape per px of the window), so its brush strokes don't read as pixels in a small window.
  13. Accessibility without visible changes: no live region holds a control; the live region speaks only when the
     train shown changes (never on the 30 s refresh) and names its time; the ticket's ⇄ reads «Cambiar el sentido»; the recording shortcuts (R, P) work only with ?grabar in the URL; the
     «horario aproximado» note speaks impersonally. Modo rápido: `python3 scripts/check.py a11y`.
  14. The site reads the network timetable (data/red.json; the parity build, its frozen copy
     scripts/baseline/red.json): the back of the ticket credits «Origen de los datos: Renfe Operadora» with the
     date the data was updated, as Renfe's licence asks. Modo rápido: `python3 scripts/check.py red`.
  15. The hero B (docs/plan.md, 28-09): the site is called «Capacasa» (title and h1) with the subtitle «El tren a
     casa, y de vuelta a Barcelona». One ticket, «Billete · Sants ⇄ Reus»: ⇄ turns the trip around (the
     route reads «Reus ⇄ Sants», the live region names the new train, the focus stays on ⇄). A board of
     two trips, the first to leave and the one after it, regional or AVE (from Camp de Tarragona: Reus is in the Baix
     Camp): «R15 10:03 el próximo, en 3 min → 11:33», «R15 11:03 el siguiente → 12:33», «en X min» only on the train
     shown while live, the AVE says «desde/hasta Camp de Tarragona» under its arrival, no
     headings and no «Luego»/«Anterior»; the other trip is a button, and choosing one, AVE included, makes it the
     train shown. With no trains left today it shows tomorrow's first ones under «Hoy ya no quedan · mañana». The ruler of the day has one
     mark: every train is a tick, the AVE like the rest; the knob always stands on the train shown; «ahora» is a
     thin line with its word, with no «Son las HH:MM» heading; «Volver a ahora» never covers that word; the arrow
     keys step through every train, AVE included. From Reus in the evening, when no regional is left but an AVE
     from Camp de Tarragona is, that AVE is the train shown and tomorrow's first regional follows it, marked «mañana».
     The ticket's town (`.tk .town`) opens a native `#selp` dialog (docs/spec-3.3.md): step 1 lists the four
     corridor groups (R11, R13, R14, R16) with their line pills; step 2 lists a group's stops in real order, the
     ramal after the main line's; choosing a stop closes the dialog, moves the board and ruler to it, and returns
     the focus to the ticket. Modo rápido: `python3 scripts/check.py hero`.
  16. The travel things and the painted table follow the papers when these settle after the table was first
     measured (the web fonts arriving late): once the papers' text reflows, everything sits where measuring afresh
     puts it, on desktop and mobile. Modo rápido: `python3 scripts/check.py mesa`.
Also saves screenshots to screenshots/ for a visual review.

Needs: pip install playwright && playwright install chromium
Usage: npm run build && npm run build:paridad && python3 scripts/check.py [paridad|letras|a11y|red|hero|mesa]   (or: npm run check)
       (paridad: only check 10, in a minute; letras: only check 11, on desktop and mobile, in a minute; a11y: only check 13; red: only check 14;
        hero: only check 15; mesa: only check 16)
"""
import asyncio, functools, http.server, io, os, pathlib, sys, threading
from PIL import Image, ImageChops, ImageStat
from playwright.async_api import async_playwright

root = pathlib.Path(__file__).resolve().parent.parent
# served over HTTP, as the real site will be: ES modules do not load from file://
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
def serve(folder):
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(root / folder)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{server.server_address[1]}/"
page_url = serve("dist")
# the parity build carries a frozen timetable (npm run build:paridad): the daily refresh never moves its reference frames
parity_url = serve("dist-paridad")
shots = root / "screenshots"; shots.mkdir(exist_ok=True)
VIEWPORTS = {"desktop": (1440, 860), "mobile": (390, 820)}

async def settle(page):
    """Software rendering is slow: wait until the scrubbed animations have caught up with the scroll."""
    await page.wait_for_timeout(300); await scrub_caught_up(page)
    try: await page.wait_for_function(f"({LANDED}).length === 0", timeout=40000)
    except Exception: pass
    await page.wait_for_timeout(500)

async def check_shelf(page, name):
    """The shelf below the hero: a visible hint to scroll, the three paper objects, nothing sticking out sideways."""
    errs = []
    hint = await page.evaluate("""(() => { const m = document.querySelector('#more');
      if(!m) return null; const r = m.getBoundingClientRect(); return {bottom: r.bottom, h: innerHeight}; })()""")
    if not hint: return ["no scroll hint (#more) in the hero"]
    if hint["bottom"] > hint["h"]: errs.append("scroll hint is below the fold")
    if not await page.evaluate("document.scrollingElement.scrollHeight > innerHeight + 10"):
        return errs + ["page does not scroll"]
    await page.evaluate("scrollTo({top: document.scrollingElement.scrollHeight, behavior: 'instant'})")
    await settle(page)
    shelf = await page.evaluate("""(() => {
      const q = s => document.querySelector(s), f = el => getComputedStyle(el).fontFamily.split(',')[0].replace(/"/g,'');
      const missing = ['#qe', '#folleto', '#cuaderno', '#reverso', '#lienzo', '#cafe', '#boli', '#rodalies'].filter(s => !q(s));
      // decorative layers (.deco) are clipped to the table, so what they hold may run past the edges
      const wide = [...document.querySelectorAll('#repisa *')].filter(el => { if(el.closest('.deco')) return false; const r = el.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); })
        .slice(0, 3).map(el => el.id || el.className || el.tagName);
      const sideways = document.scrollingElement.scrollWidth > innerWidth + 1;
      // the notebook opens onto one page: each concept with the technology behind it, nothing crossed out, no motto
      const items = [...document.querySelectorAll('#cuaderno .der li')];
      const notebook = {items: items.length, bare: items.filter(li => !li.querySelector('.tec')).length,
        extra: [...document.querySelectorAll('#cuaderno .tachado, #cuaderno .lema, #cuaderno .izq h2, #cuaderno .izq li')].length};
      return {missing, wide, sideways, notebook, heading: q('#qe') ? f(q('#qe')) : null, body: q('#repisa p') ? f(q('#repisa p')) : null};
    })()""")
    if shelf["missing"]: errs.append(f"shelf is missing {', '.join(shelf['missing'])}")
    if shelf["sideways"]: errs.append("the page scrolls sideways")
    nb = shelf["notebook"]
    if nb["items"] != 4 or nb["bare"]: errs.append(f"the notebook's page should list 4 concepts, each with its technology ({nb['items']} listed, {nb['bare']} without one)")
    if nb["extra"]: errs.append("the notebook still has crossed-out words, the motto or a second page of content")
    try:
        await page.wait_for_function("document.getElementById('lienzo')?.dataset.pintada === '1'", timeout=12000)
        px = await page.evaluate("""(() => { const c = document.getElementById('lienzo'), g = c.getContext('webgl'), p = new Uint8Array(4);
          g.readPixels(c.width >> 1, c.height >> 1, 1, 1, g.RGBA, g.UNSIGNED_BYTE, p); return p[0] + p[1] + p[2]; })()""")
        if px > 600: errs.append("the table is still bare paper")
    except Exception:
        errs.append("the table never gets painted")
    if shelf["wide"]: errs.append(f"shelf sticks out sideways: {', '.join(shelf['wide'])}")
    if shelf["heading"] and shelf["heading"] != "Young Serif": errs.append(f"shelf heading font is {shelf['heading']}")
    if shelf["body"] and shelf["body"] != "Karla": errs.append(f"shelf text font is {shelf['body']}")
    await page.screenshot(path=str(shots / f"{name}-repisa.png"))
    return errs

LANDED = """(() => ['#folleto', '#cuaderno', '#reverso', '.cuaderno .izq'].filter(s => {
  const el = document.querySelector(s); if(!el) return false; const c = getComputedStyle(el);
  const flat = c.transform === 'none' || /^matrix\\(1, 0, 0, 1, 0, 0\\)$/.test(c.transform) || s !== '.cuaderno .izq';
  return +c.opacity < .99 || c.visibility === 'hidden' || !flat; }))()"""

def magenta(png):
    """Share of a screenshot where the magenta background shows through (read on a 360 × 220 thumbnail)."""
    img = Image.open(io.BytesIO(png)).convert("RGB").resize((360, 220))
    return sum(1 for r, g, b in img.get_flattened_data() if r > 200 and g < 70 and b > 200) / (360 * 220)

async def check_backstage(page, name):
    """Paint what lies behind the site magenta and make sure no frame of the transition shows it."""
    await page.evaluate("""(() => { document.documentElement.style.setProperty('background', '#ff00ff', 'important');
      document.body.style.setProperty('background', '#ff00ff', 'important'); })()""")
    leaks, lagged = [], []
    # each frame is taken once the page has caught up with the scroll: software rendering can lag seconds behind
    # the compositor, and a frame from that gap is half drawn (a band as tall as the last jump shows the background),
    # not the design. If the page never catches up, say so instead of reading that frame
    for f in (.1, .25, .4, .55, .7, .85, .95):
        await page.evaluate(f"scrollTo({{top: innerHeight * {f}, behavior: 'instant'}})"); await page.wait_for_timeout(300)
        if not await hinge_caught_up(page): lagged.append(f"{int(f * 100)}%"); continue
        png = await page.screenshot(); share = magenta(png)
        if share:
            why = await page.evaluate("""(() => { const h = document.getElementById('hero').style, r = document.getElementById('repisa').getBoundingClientRect();
              const top = document.elementFromPoint(innerWidth / 2, 20);
              return `scroll ${(scrollY / innerHeight).toFixed(3)}, wall ${h.visibility || 'visible'} ${h.transform || 'flat'} @ ${h.transformOrigin}, table top ${r.top.toFixed(0)}, at the top ${top ? top.id || top.className || top.tagName : 'nothing'}`; })()""")
            leaks.append(f"{int(f * 100)}% ({share:.1%}; {why})"); (shots / f"{name}-fondo-{int(f * 100)}.png").write_bytes(png)
    for a, b in ((.05, .9), (.9, .1)):
        await page.evaluate(f"scrollTo({{top: innerHeight * {a}, behavior: 'instant'}})"); await page.wait_for_timeout(300)
        await hinge_caught_up(page)
        await page.evaluate(f"scrollTo({{top: innerHeight * {b}, behavior: 'instant'}})"); await page.wait_for_timeout(300)
        if not await hinge_caught_up(page): lagged.append(f"jump {int(a * 100)}→{int(b * 100)}%"); continue
        share = magenta(await page.screenshot())
        if share: leaks.append(f"jump {int(a * 100)}→{int(b * 100)}% ({share:.1%})")
    await page.evaluate("scrollTo({top: 0, behavior: 'instant'})")
    return ([f"background shows during the transition at {', '.join(leaks)}"] if leaks else []) + \
           ([f"the hinge never catches up with the scroll at {', '.join(lagged)} (frame not read)"] if lagged else [])

ANGLE = """(s => { const m = document.querySelector(s).style.transform.match(/rotateX\\((-?[\\d.]+)deg\\)/); return m ? +m[1] : 0; })"""

async def hinge_caught_up(page):
    """Software rendering gives very few frames: wait until the hinge has caught up with the scroll."""
    try:
        # the page's reus API gives hingeAt and dropped: the hinge is defined in one place only
        await page.wait_for_function("""Math.abs(parseFloat(document.getElementById('hero').style.transformOrigin.split(' ')[1])
          - reus.hingeAt(reus.dropped())) < 1""", timeout=15000)
        return True
    except Exception: return False

async def check_rhythm(page):
    """The wall leads and the table follows; the table lands before the end of the first screen and bounces up a little.
    The wall's shade follows its angle: it holds still once the wall has finished turning."""
    errs, at = [], {}
    for f in (.3, .88, .95):
        await page.evaluate(f"scrollTo({{top: innerHeight * {f}, behavior: 'instant'}})"); await page.wait_for_timeout(300)
        if not await hinge_caught_up(page): errs.append(f"the hinge never catches up with the scroll at {f:.0%}")
        at[f] = await page.evaluate(f"({{wall: ({ANGLE})('#hero'), table: ({ANGLE})('#repisa'), shade: +(document.getElementById('hero').style.getPropertyValue('--lavado') || 0)}})")
    wall, table = at[.3]["wall"] / 34, 1 - at[.3]["table"] / 24
    if wall <= table: errs.append(f"the table arrives before the wall turns (30%: wall {wall:.0%} of its turn, table {table:.0%})")
    if at[.88]["table"] > .15: errs.append(f"the table has not touched down at 88% ({at[.88]['table']:.2f}°)")
    if at[.95]["table"] < .5: errs.append(f"the table does not bounce as it lands ({at[.95]['table']:.2f}° at 95%)")
    if not at[.3]["shade"] < at[.88]["shade"]: errs.append(f"the wall does not darken as it turns ({at[.3]['shade']:.2f} → {at[.88]['shade']:.2f})")
    if abs(at[.88]["shade"] - at[.95]["shade"]) > .01: errs.append(f"the wall's shade follows the scroll, not its angle ({at[.88]['shade']:.2f} → {at[.95]['shade']:.2f} with the wall still)")
    return errs

async def check_overlap(page):
    """On the pinned table each paper starts falling before the previous one lands, and the cover opens as the last one settles."""
    spans = await page.evaluate("""(() => {
      if(getComputedStyle(document.querySelector('.escena')).position !== 'sticky') return null;
      // the pinned timeline: three papers and the notebook's cover
      const st = reus.ScrollTrigger.getAll().find(t => t.animation && t.animation.getChildren(false).length === 4);
      return st ? st.animation.getChildren(false).map(c => [c.startTime(), c.endTime()]) : []; })()""")
    if spans is None: return []
    if len(spans) != 4: return ["no pinned timeline with three papers and the cover"]
    names = ["leaflet", "notebook", "ticket", "cover"]
    return [f"the {names[i + 1]} waits for the {names[i]} to land" for i in range(3) if not spans[i + 1][0] < spans[i][1]]

# each paper's hard shadow: how far it lies (x), how dark it is (a), how visible the paper is (o) and its resting offset
SHADOWS = """(() => {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const read = (sel, prop, rest, holder) => { const v = getComputedStyle(document.querySelector(sel))[prop];
    const c = v.match(/rgba?\\(([^)]*)\\)/), n = v.replace(/rgba?\\([^)]*\\)/, '').match(/(-?[\\d.]+)px/);
    const a = c ? c[1].split(/[\\s,\\/]+/).filter(Boolean)[3] : undefined;
    return {x: n ? Math.abs(+n[1]) : 0, a: a === undefined ? 1 : +a, o: +getComputedStyle(document.querySelector(holder)).opacity, rest: rest * rem}; };
  return {leaflet: read('#folleto', 'boxShadow', .375, '#folleto'), notebook: read('#cuaderno .der', 'boxShadow', .375, '#cuaderno'),
          cover: read('#cuaderno .tapa', 'boxShadow', .375, '#cuaderno'), ticket: read('#reverso', 'filter', .3, '#reverso')}; })()"""

async def scrub_caught_up(page):
    """Wait until every scrubbed animation has caught up with the real scroll position (they lag on purpose, by .6 s).
    Both the trigger's progress and its animation's are compared with where the page really is: under load the ticker
    can go seconds without a frame, and then the two agree with each other while both are stale."""
    try: await page.wait_for_function("""reus.ScrollTrigger.getAll().every(t => { if(!t.animation) return true;
      const real = Math.min(1, Math.max(0, (scrollY - t.start) / (t.end - t.start)));   // t.scroll() is cached too
      return Math.abs(t.progress - real) < .005 && Math.abs(t.animation.progress() - real) < .005; })""", timeout=30000)
    except Exception: pass

async def check_fall(page):
    """While a paper is in the air its shadow lies farther from it, and lighter, than when it rests on the table."""
    await page.evaluate("scrollTo({top: innerHeight * 1.2, behavior: 'instant'})"); await page.wait_for_timeout(1500)
    spots = await page.evaluate("""(() => {
      const shelf = document.getElementById('repisa');
      if(getComputedStyle(document.querySelector('.escena')).position === 'sticky') {
        const a = shelf.offsetTop, b = a + shelf.offsetHeight - innerHeight; return [.08, .16, .24, .32, .4].map(t => a + (b - a) * t); }
      // stacked papers fall one by one as they scroll in
      return ['#folleto', '#cuaderno', '#reverso'].flatMap(s => { let top = 0; for(let n = document.querySelector(s); n; n = n.offsetParent) top += n.offsetTop;
        return [.95, .87, .8].map(t => top - innerHeight * t); }); })()""")
    far, light = {}, {}
    for y in spots:
        await page.evaluate(f"scrollTo({{top: {y}, behavior: 'instant'}})"); await page.wait_for_timeout(300)
        await scrub_caught_up(page)
        for paper, sh in (await page.evaluate(SHADOWS)).items():
            if sh["o"] > .3:
                far[paper] = max(far.get(paper, 0), sh["x"] / sh["rest"]); light[paper] = min(light.get(paper, 1), sh["a"])
    errs = [f"the {p} keeps its resting shadow in the air (at most {far.get(p, 0):.2f}×)" for p in ("leaflet", "notebook", "cover", "ticket") if far.get(p, 0) <= 1.6]
    return errs + [f"the {p}'s shadow is as dark in the air as at rest" for p in ("leaflet", "notebook", "cover", "ticket") if light.get(p, 1) > .9]

async def check_return(page):
    """Scrolling back to the top undoes everything: the wall stands flat, the papers are gone and the notebook is closed."""
    await page.evaluate("scrollTo({top: 0, behavior: 'instant'})"); await page.wait_for_timeout(300)
    await hinge_caught_up(page)
    back = """(() => { const c = s => getComputedStyle(document.querySelector(s)), out = [];
      ['#folleto', '#cuaderno', '#reverso'].forEach(s => { if(+c(s).opacity > .01 && c(s).visibility !== 'hidden') out.push(s); });
      const leaf = c('.cuaderno .izq').transform; if(leaf === 'none' || /^matrix\\(1, 0, 0, 1, 0, 0\\)$/.test(leaf)) out.push('.cuaderno .izq');
      if(document.getElementById('hero').style.transform) out.push('#hero');
      if(+document.getElementById('sombra').style.opacity > 0) out.push('#sombra');
      if(c('.stage').filter !== 'none') out.push('the dimmed texts');
      return out; })()"""
    try: await page.wait_for_function(f"{back}.length === 0", timeout=15000)
    except Exception: return [f"scrolling back up does not undo {', '.join(await page.evaluate(back))}"]
    return []

# where points of the wall (in its own px, as laid out at rest) land on screen, through the wall's tilt
WALL_AT = """(pts => { const cs = getComputedStyle(document.getElementById('hero')), [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat);
  const m = new DOMMatrix().translate(ox, oy).multiply(cs.transform === 'none' ? new DOMMatrix() : new DOMMatrix(cs.transform)).translate(-ox, -oy);
  return pts.map(([x, y]) => { const q = m.transformPoint(new DOMPoint(x, y, 0, 1)); return [q.x / q.w, q.y / q.w]; }); })"""

def brightness(img, xy):
    """Mean brightness of a 5 × 5 patch of a screenshot."""
    x, y = int(xy[0]), int(xy[1]); px = [img.getpixel((min(img.width - 1, max(0, x + i)), min(img.height - 1, max(0, y + j)))) for i in range(-2, 3) for j in range(-2, 3)]
    return sum(sum(p) / 3 for p in px) / len(px)

async def check_wash(page, name):
    """The wall's shadow is a pigment wash painted in its own shader, not the flat #sombra veil: it starts at the
    hinge and climbs the wall as the wall turns away, the texts on the wall dim with it, and nothing lingers once
    you scroll back to the top. Read from screenshots, so the canvas needs no preserved drawing buffer."""
    errs = []
    if not await page.evaluate("!!document.getElementById('gl')"): return []  # no WebGL: the #sombra fallback runs instead
    async def at(f):
        await page.evaluate(f"scrollTo({{top: innerHeight * {f}, behavior: 'instant'}})"); await page.wait_for_timeout(300)
        await hinge_caught_up(page); await page.wait_for_timeout(600)
    await at(0)
    # two bare-wall spots beside the window (clear of the seats): one just above where the hinge will be at 30%, one high up
    # a panoramic window (stacked hero) leaves no bare wall beside its frame: then the high spot sits just above the frame
    near, far = await page.evaluate("""(() => { const w = document.getElementById('win').getBoundingClientRect(), seats = innerWidth / innerHeight > 1.15 ? .25 * innerHeight : 0;
      const frame = .022 * innerHeight, rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const beside = innerWidth - seats - (w.right + frame) > 2 * rem;
      const x = beside ? w.right + (innerWidth - seats - w.right) / 2 : innerWidth - 1.5 * rem;
      return [[x, reus.hingeAt(.3) - .02 * innerHeight], [x, beside ? w.top + .15 * w.height : w.top - frame - .6 * rem]]; })()""")
    rest = Image.open(io.BytesIO(await page.screenshot())).convert("RGB")
    base = [brightness(rest, near), brightness(rest, far)]
    seen = {}
    for f in (.3, .7):
        await at(f)
        img = Image.open(io.BytesIO(await page.screenshot())).convert("RGB")
        spots = await page.evaluate(f"({WALL_AT})({[near, far]})")
        seen[f] = [brightness(img, xy) for xy in spots]
        if await page.evaluate("+getComputedStyle(document.getElementById('sombra')).opacity > 0"): errs.append(f"the flat #sombra veil darkens the wall at {f:.0%} although WebGL paints it")
    if not seen[.3][0] < base[0] - 8: errs.append(f"no wash at the hinge at 30% ({base[0]:.0f} → {seen[.3][0]:.0f})")
    if abs(seen[.3][1] - base[1]) > 10: errs.append(f"the wash already covers the top of the wall at 30% ({base[1]:.0f} → {seen[.3][1]:.0f})")
    if not seen[.7][1] < base[1] - 8: errs.append(f"the wash does not climb the wall: its top is still bare at 70% ({base[1]:.0f} → {seen[.7][1]:.0f})")
    if await page.evaluate("getComputedStyle(document.querySelector('.stage')).filter") == "none": errs.append("the texts on the wall do not dim with the wash at 70%")
    await at(0)
    img = Image.open(io.BytesIO(await page.screenshot())).convert("RGB")
    back = [brightness(img, near), brightness(img, far)]
    if max(abs(back[0] - base[0]), abs(back[1] - base[1])) > 10: errs.append(f"the wash leaves a trace back at the top ({base[0]:.0f}/{base[1]:.0f} → {back[0]:.0f}/{back[1]:.0f})")
    return errs

# --- Fase 3 · el viaje de letras (h1.brand -> h2#qe) --------------------------------------------------------
# The pairing for the site's name: chip i is the i-th letter of NAME (source order is preserved on the wall side);
# QE_TARGET[i] is which character of "Qué es" it lands on (index 3 is the space, where the three chips with no
# letter to become fuse instead). See docs/referencias/viaje-letras.md.
NAME = "Capacasa"
QE_TARGET = [0, 1, 2, 4, 3, 5, 3, 3]
# the journey's stagger, from the approved prototype (docs/referencias/viaje-letras.md, "Movimiento"): letter i
# lifts off at roughly this progress
def letters_start(i): return .06 + i * .035

CHIP_RECT = """(i => { const chips = document.querySelectorAll('#letras .ficha'); const el = chips[i]; if(!el) return null;
  const b = el.getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2}; })"""
# the on-screen box of the i-th character of an element's own text (Range, not a split span: keeps kerning),
# through whatever transform its ancestors currently carry (the wall's or the table's tilt)
GLYPH_RECT = """((sel, i) => { const el = document.querySelector(sel); if(!el) return null;
  const node = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.length); if(!node) return null;
  if(i < 0 || i >= node.textContent.length) return null;
  const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1);
  const rects = r.getClientRects(); if(!rects.length) return null; const b = rects[0];
  return {x: b.left + b.width / 2, y: b.top + b.height / 2}; })"""
LETTERS_STATE = """(() => { const chips = document.querySelectorAll('#letras .ficha');
  const c = s => getComputedStyle(document.querySelector(s));
  const h1 = c('.brand'), h2 = c('#qe');
  return {count: chips.length,
    h1Opacity: +h1.opacity, h1Vis: h1.visibility, h1Disp: h1.display, h1Text: document.querySelector('.brand').textContent,
    h2Opacity: +h2.opacity, h2Vis: h2.visibility, h2Disp: h2.display, h2Text: document.querySelector('#qe').textContent}; })()"""

async def letters_at(page, p):
    """Scroll to progress p (matching dropped()) and wait for the page to catch up, exactly like pitch()."""
    await page.evaluate(f"scrollTo({{top: innerHeight * {p}, behavior: 'instant'}})")
    await page.wait_for_timeout(200)
    await hinge_caught_up(page)

async def check_letters_pair(page):
    """reus.letras.pair(nombre, destino) empareja letra a letra por posición (no por identidad semántica).
    Letras sobrantes del origen aterrizan en el hueco del destino (su espacio) y se funden; letras de destino
    sin pareja (nombre más corto) aparecen solas con un fundido corto. Con 'Capacasa' -> 'Qué es' debe dar
    exactamente: C->Q, a->u, p->é, a->e, c->hueco (se funde), a->s, s->hueco, a->hueco.
    reus.letras.state(p) debe existir también: es la función pura que usan el resto de los checks."""
    ok = await page.evaluate("""() => !!(window.reus && window.reus.letras
      && typeof window.reus.letras.pair === 'function' && typeof window.reus.letras.state === 'function')""")
    if not ok: return ["reus.letras.pair/state is missing"]
    errs = []
    proto = await page.evaluate("() => window.reus.letras.pair('Capacasa', 'Qué es')")
    got = [[it.get("from"), it.get("to")] for it in proto] if isinstance(proto, list) and all(isinstance(it, dict) for it in proto) else None
    expected = [["C", "Q"], ["a", "u"], ["p", "é"], ["a", "e"], ["c", None], ["a", "s"], ["s", None], ["a", None]]
    if got != expected: errs.append(f"pair('Capacasa','Qué es') = {got}, expected {expected}")
    name = await page.evaluate("document.querySelector('.brand').textContent")
    if name != NAME: errs.append(f"h1.brand reads «{name}», expected «{NAME}»")

    async def rule(name, dest):
        res = await page.evaluate("([n, d]) => window.reus.letras.pair(n, d)", [name, dest])
        if not isinstance(res, list): return [f"pair({name!r}, {dest!r}) did not return an array"]
        out, real = [], [ch for ch in dest if ch != " "]
        froms = [it.get("from") for it in res if it.get("from") is not None]
        tos = [it.get("to") for it in res if it.get("to") is not None]
        if froms != list(name): out.append(f"pair({name!r}, {dest!r}): source letters read back as {froms}, expected {list(name)}")
        if tos != real: out.append(f"pair({name!r}, {dest!r}): target letters read back as {tos}, expected {real}")
        gaps = sum(1 for it in res if it.get("from") is not None and it.get("to") is None)
        solos = sum(1 for it in res if it.get("from") is None and it.get("to") is not None)
        empties = sum(1 for it in res if it.get("from") is None and it.get("to") is None)
        exp_gaps, exp_solos = max(0, len(name) - len(real)), max(0, len(real) - len(name))
        if gaps != exp_gaps: out.append(f"pair({name!r}, {dest!r}): {gaps} source letters land in the gap, expected {exp_gaps}")
        if solos != exp_solos: out.append(f"pair({name!r}, {dest!r}): {solos} target letters appear alone, expected {exp_solos}")
        if empties: out.append(f"pair({name!r}, {dest!r}): {empties} entries have neither a source nor a target letter")
        return out
    errs += await rule("Bea", "Qué es")           # shorter than the name: some target letters appear alone
    errs += await rule("Alexandra", "Qué es")     # longer than the name: excess source letters fuse in the gap
    return errs

async def check_letters_layer(page):
    """#letras: fixed, full viewport, non-interactive, a direct child of body (sibling of #hero/#repisa, never
    nested inside either — their transform/filter would break its fixed positioning), above both of them."""
    info = await page.evaluate("""() => { const l = document.getElementById('letras'); if(!l) return null;
      const c = getComputedStyle(l);
      return {position: c.position, pointerEvents: c.pointerEvents, zIndex: c.zIndex,
              parentIsBody: l.parentElement === document.body, ariaHidden: l.getAttribute('aria-hidden')}; }""")
    if not info: return ["#letras is missing"]
    errs = []
    if info["position"] != "fixed": errs.append(f"#letras is not position:fixed ({info['position']})")
    if info["pointerEvents"] != "none": errs.append("#letras is not pointer-events:none")
    if not info["parentIsBody"]: errs.append("#letras is not a direct child of body")
    if info["ariaHidden"] != "true": errs.append("#letras is not aria-hidden")
    try: z = float(info["zIndex"])
    except (TypeError, ValueError): z = None
    if z is None or z <= 2: errs.append(f"#letras z-index ({info['zIndex']}) is not above the wall (0) and the table (2)")
    return errs

async def check_letters_rest(page):
    """Before the journey starts (p=0) there are no chips and the real h1 shows normally. The relay from h1 to
    chips must not fire before the first letter's own liftoff (letters_start(0)): a chip may already exist just
    before it lifts off (it sits glued to the wall, pixel-identical to h1 -- check_letters_positions relies on
    that), but h1 itself must still read at full opacity right up to that point."""
    errs = []
    await letters_at(page, 0)
    st = await page.evaluate(LETTERS_STATE)
    if st["count"]: errs.append(f"{st['count']} chips visible at p=0")
    if st["h1Opacity"] < .95: errs.append("h1.brand is dimmed at p=0")
    p = max(0, letters_start(0) - .02)
    await letters_at(page, p)
    st = await page.evaluate(LETTERS_STATE)
    if st["h1Opacity"] < .95: errs.append(f"h1.brand is dimmed at p={p:.3f}, before letter 0 even lifts off (opacity {st['h1Opacity']})")
    return errs

async def check_letters_midway(page):
    """Halfway through the journey (p=0.3) there are as many chips as letters in the name, the real h1/h2 are
    hidden only visually (their text must stay in the accessibility tree: never visibility:hidden/display:none)
    and the chips sit above both the wall and the table."""
    await letters_at(page, .3)
    st = await page.evaluate(LETTERS_STATE)
    errs = []
    if st["count"] != len(NAME): errs.append(f"{st['count']} chips at p=0.3, expected {len(NAME)} (as many as letters in '{NAME}')")
    if st["h1Opacity"] > .4: errs.append(f"h1.brand is not hidden at p=0.3 (opacity {st['h1Opacity']})")
    if st["h1Vis"] == "hidden" or st["h1Disp"] == "none": errs.append("h1.brand was hidden with visibility/display, not just color/opacity")
    if not st["h1Text"].strip(): errs.append("h1.brand lost its text content")
    if st["h2Opacity"] > .4: errs.append(f"h2#qe is not hidden at p=0.3 (opacity {st['h2Opacity']})")
    if st["h2Vis"] == "hidden" or st["h2Disp"] == "none": errs.append("h2#qe was hidden with visibility/display, not just color/opacity")
    if not st["h2Text"].strip(): errs.append("h2#qe lost its text content")
    above = await page.evaluate("""() => { const z = s => { const el = document.querySelector(s); return el ? +getComputedStyle(el).zIndex || 0 : 0; };
      return z('#letras') > z('#hero') && z('#letras') > z('#repisa'); }""")
    if not above: errs.append("#letras is not above #hero and #repisa at p=0.3")
    return errs

async def check_letters_positions(page):
    """Each chip starts glued to its glyph on the wall (h1.brand), one per letter of the name -- just before its
    own liftoff -- and ends glued to its glyph on the table (h2#qe) at p=0.97, both read live through the real
    transforms of #hero/#repisa, within 3 px. Uses the pairing of NAME -> 'Qué es' (QE_TARGET)."""
    errs = []
    for i in range(len(NAME)):
        p = max(0, letters_start(i) - .015)
        await letters_at(page, p)
        chip = await page.evaluate(f"({CHIP_RECT})({i})")
        glyph = await page.evaluate(f"({GLYPH_RECT})('.brand', {i})")
        if not chip or not glyph: errs.append(f"chip {i} or its h1 glyph not measurable at p={p:.3f} (just before liftoff)"); continue
        d = ((chip["x"] - glyph["x"]) ** 2 + (chip["y"] - glyph["y"]) ** 2) ** .5
        if d > 3: errs.append(f"chip {i} is {d:.1f}px from its h1 glyph at p={p:.3f} (just before liftoff)")
    await letters_at(page, .97)
    for i, di in enumerate(QE_TARGET):
        chip = await page.evaluate(f"({CHIP_RECT})({i})")
        glyph = await page.evaluate(f"({GLYPH_RECT})('#qe', {di})")
        if not chip or not glyph: errs.append(f"chip {i} or its h2 glyph {di} not measurable at p=0.97"); continue
        d = ((chip["x"] - glyph["x"]) ** 2 + (chip["y"] - glyph["y"]) ** 2) ** .5
        if d > 3: errs.append(f"chip {i} is {d:.1f}px from its h2 glyph at p=0.97")
    return errs

async def check_letters_landed(page):
    """Once the wall is gone (p=1) the chips are gone too, and the real h2 shows where they landed."""
    await letters_at(page, 1)
    st = await page.evaluate(LETTERS_STATE)
    errs = []
    if st["count"]: errs.append(f"{st['count']} chips still visible at p=1")
    if st["h2Opacity"] < .95: errs.append(f"h2#qe is not shown at p=1 (opacity {st['h2Opacity']})")
    return errs

async def check_letters_reversible(page):
    """Scrubbing 0.3 -> 0.8 -> 0.3 leaves the chips exactly where they were the first time at 0.3."""
    async def snapshot():
        return await page.evaluate("""() => [...document.querySelectorAll('#letras .ficha')].map(el => {
          const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; })""")
    await letters_at(page, .3); before = await snapshot()
    await letters_at(page, .8); await letters_at(page, .3); after = await snapshot()
    if before != after: return [f"letters at p=0.3 differ after scrubbing to 0.8 and back: {before} != {after}"]
    return []

async def check_letters_reduced(page):
    """With reduced motion there is never a chip, and h1/h2 are always shown in their final state, at any scroll."""
    errs = []
    for p in (0, .3, .6, 1):
        await page.evaluate(f"scrollTo({{top: innerHeight * {p}, behavior: 'instant'}})"); await page.wait_for_timeout(200)
        st = await page.evaluate(LETTERS_STATE)
        if st["count"]: errs.append(f"{st['count']} chips at p={p} with reduced motion")
        if st["h1Opacity"] < .95: errs.append(f"h1.brand is dimmed at p={p} with reduced motion")
        if st["h2Opacity"] < .95: errs.append(f"h2#qe is not shown at p={p} with reduced motion")
    return errs

async def check_toolbar(page):
    """iOS Safari: when its toolbar shrinks, innerHeight grows but the table still rests at 100svh (its layout top).
    The hinge must follow the table's real edge, not innerHeight: simulated here by lifting the table's rest 40 px
    above the bottom of the screen, as the shrunk toolbar does. The wall's hinge sits on the table's edge at every
    point, and the chips still land on their glyphs of h2#qe."""
    errs = []
    await page.evaluate("""(() => { const s = document.createElement('style'); s.id = 'barra';
      s.textContent = '#repisa{ margin-top:calc(100svh - 40px) !important; }'; document.head.appendChild(s);
      dispatchEvent(new Event('resize')); })()""")
    await page.wait_for_timeout(300)
    async def at(p):
        await page.evaluate(f"scrollTo({{top: document.getElementById('repisa').offsetTop * {p}, behavior: 'instant'}})")
        await page.wait_for_timeout(200); await hinge_caught_up(page)
    for f in (.3, .6, .9):
        await at(f)
        d = await page.evaluate("""parseFloat(document.getElementById('hero').style.transformOrigin.split(' ')[1])
          - document.getElementById('repisa').getBoundingClientRect().top""")
        if abs(d) > 1.5: errs.append(f"with the toolbar shrunk, the wall's hinge is {d:.0f} px off the table's edge at {f:.0%}")
    await at(.97)
    for i, di in enumerate(QE_TARGET):
        chip = await page.evaluate(f"({CHIP_RECT})({i})")
        glyph = await page.evaluate(f"({GLYPH_RECT})('#qe', {di})")
        if not chip or not glyph: errs.append(f"chip {i} or its h2 glyph {di} not measurable at p=0.97 with the toolbar shrunk"); continue
        d = ((chip["x"] - glyph["x"]) ** 2 + (chip["y"] - glyph["y"]) ** 2) ** .5
        if d > 3: errs.append(f"with the toolbar shrunk, chip {i} lands {d:.1f}px from its h2 glyph")
    await page.evaluate("document.getElementById('barra').remove(); dispatchEvent(new Event('resize')); scrollTo({top: 0, behavior: 'instant'})")
    await page.wait_for_timeout(300); await hinge_caught_up(page)
    return errs

async def shoot_letters(page, name):
    """Screenshots of the journey at a handful of points, for a visual review."""
    for f in (.1, .25, .4, .6, .9):
        await letters_at(page, f)
        await page.screenshot(path=str(shots / f"{name}-letras-{int(f * 100)}.png"))

async def check_letters(page, name):
    """All of the letters' journey checks for one already-loaded page, plus its review screenshots."""
    errs = []
    errs += [f"pair: {e}" for e in await check_letters_pair(page)]
    errs += [f"layer: {e}" for e in await check_letters_layer(page)]
    errs += [f"rest: {e}" for e in await check_letters_rest(page)]
    errs += [f"midway: {e}" for e in await check_letters_midway(page)]
    errs += [f"positions: {e}" for e in await check_letters_positions(page)]
    errs += [f"landed: {e}" for e in await check_letters_landed(page)]
    errs += [f"reversible: {e}" for e in await check_letters_reversible(page)]
    errs += [f"toolbar: {e}" for e in await check_toolbar(page)]
    await shoot_letters(page, name)
    return errs

async def hero_settled(page):
    """.top/.info carry their own entrance transition (translateY(6px)/opacity 0 -> resting), independent of the
    scroll, added once the landscape's own paint-in finishes: wait for it instead of a fixed timeout, or a check
    that scrolls early would compare a chip (measured at its settled position) against a still-animating h1."""
    try: await page.wait_for_function("getComputedStyle(document.querySelector('.top')).transform === 'none'", timeout=15000)
    except Exception: pass

async def check_letters_suite(browser):
    """Quick mode: only the letters' journey checks, on desktop and mobile (like paridad)."""
    failures = []
    for name, (w, h) in VIEWPORTS.items():
        page = await open_page(browser, viewport={"width": w, "height": h})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.goto(page_url); await hero_settled(page)
        failures += [f"{name}: {e}" for e in await check_letters(page, name)]
        failures += [f"{name}: JS error: {e}" for e in errors]
        await page.close()
        rpage = await open_page(browser, viewport={"width": w, "height": h}, reduced_motion="reduce")
        await rpage.goto(page_url); await rpage.wait_for_timeout(1500)
        failures += [f"{name} reduced: {e}" for e in await check_letters_reduced(rpage)]
        await rpage.close()
    return failures
# --- fin viaje de letras --------------------------------------------------------------------------------------

async def check_motion(page, name, reduced=False):
    """Halfway down, the wall is tilting (or, with reduced motion, still); at the end everything has landed."""
    errs = []
    await page.evaluate("scrollTo({top: 0, behavior: 'instant'})"); await page.wait_for_timeout(800)
    await page.evaluate("scrollTo({top: innerHeight * .5, behavior: 'instant'})"); await page.wait_for_timeout(1800)
    if not reduced and not await hinge_caught_up(page): errs.append("the hinge never catches up with the scroll at 50%")
    tilt = await page.evaluate("getComputedStyle(document.querySelector('#hero')).transform")
    if reduced and tilt not in ("none", ""): errs.append("wall moves with reduced motion")
    if reduced:
        moving = await page.evaluate("[...new Set(document.getAnimations().filter(a => a.playState === 'running').map(a => a.effect?.target?.className?.baseVal ?? a.effect?.target?.className))]")
        if moving: errs.append(f"things still move with reduced motion: {', '.join(map(str, moving))}")
    if not reduced and tilt in ("none", ""): errs.append("wall does not tilt while scrolling")
    await page.screenshot(path=str(shots / f"{name}-scroll50.png"))
    await page.evaluate("scrollTo({top: document.scrollingElement.scrollHeight, behavior: 'instant'})"); await settle(page)
    off = await page.evaluate(LANDED)
    if off: errs.append(f"not landed at the end: {', '.join(off)}")
    for paper, sh in (await page.evaluate(SHADOWS)).items():
        if abs(sh["x"] - sh["rest"]) > 1 or sh["a"] < .99: errs.append(f"the {paper}'s shadow is not at rest at the end ({sh['x']:.1f} px at {sh['a']:.2f}, rest {sh['rest']:.1f} px)")
    return errs

SIZES = {"360x740": (360, 740), "390x844": (390, 844), "430x932": (430, 932), "768x1024": (768, 1024), "1000x1300": (1000, 1300),
         "1024x768": (1024, 768), "1280x720": (1280, 720), "1366x768": (1366, 768), "1440x900": (1440, 900), "1920x1080": (1920, 1080), "2560x1440": (2560, 1440)}
FIT = """(() => {
  const q = s => document.querySelector(s), errs = [];
  const out = sel => [...document.querySelectorAll(sel)].filter(el => { if(el.closest('.deco')) return false; const b = el.getBoundingClientRect();
    return b.width && (b.right > innerWidth + 1 || b.left < -1); }).slice(0, 3).map(el => el.id || el.className.baseVal || el.className || el.tagName);
  const o = out('#stage *'); if(o.length) errs.push('hero sticks out: ' + o.join(', '));
  document.querySelectorAll('.tk').forEach(t => { const w = t.getBoundingClientRect().width; t.style.width = 'max-content'; t.style.flex = 'none';
    const m = t.getBoundingClientRect().width; t.style.width = ''; t.style.flex = ''; if(w > m + 2) errs.push(`ticket stretched to ${Math.round(w)} px (text needs ${Math.round(m)})`); });
  const small = [...document.querySelectorAll('#stage p, #stage span, #stage button, #repisa p, #repisa li, #repisa h2')]
    .filter(el => el.offsetParent && el.textContent.trim() && parseFloat(getComputedStyle(el).fontSize) < 13).slice(0, 3).map(el => el.textContent.trim().slice(0, 20));
  if(small.length) errs.push('text under 13 px: ' + small.join(' | '));
  // stacked hero (phones, portrait tablets): the window is panoramic, as wide as the stage, and no ticket touches
  // its painted wooden frame (.022 of the screen's height around #win, see watercolor.frag)
  if(matchMedia('(max-width:700px), (max-aspect-ratio:4/5)').matches){
    const st = q('#stage'), cs = getComputedStyle(st), inner = st.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const win = q('#win').getBoundingClientRect(), rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    // the glass leaves 1.1rem on each side for its frame
    if(win.width < inner - 2.2 * rem - 1) errs.push(`window only ${Math.round(win.width)} of ${Math.round(inner - 2.2 * rem)} px wide on the stacked hero`);
    const low = Math.max(...[...document.querySelectorAll('.tk')].map(t => t.getBoundingClientRect().bottom));
    if(low > win.top - .022 * innerHeight - 4) errs.push(`a ticket touches the window's frame (${Math.round(low)} vs frame at ${Math.round(win.top - .022 * innerHeight)})`);
  }
  const pages = [...document.querySelectorAll('.cuaderno .hoja')].map(h => h.offsetWidth); if(Math.min(...pages) < 240) errs.push(`notebook page only ${Math.min(...pages)} px wide`);
  const esc = q('.escena'), mesa = q('.mesa');
  if(getComputedStyle(esc).position === 'sticky' && mesa.offsetTop + mesa.offsetHeight > esc.clientHeight - 40)
    errs.push(`pinned table does not fit: content ends at ${mesa.offsetTop + mesa.offsetHeight} of ${esc.clientHeight}`);
  // like a poster: proportional to the screen, never below a legible floor
  const ref = Math.min(innerWidth, innerHeight * 1.6), brand = parseFloat(getComputedStyle(q('.brand')).fontSize);
  const expected = 6.6 * Math.max(14, ref * .01111);
  if(innerWidth > innerHeight && Math.abs(brand - expected) / expected > .05) errs.push(`hero does not scale: name is ${Math.round(brand)} px for a ${Math.round(ref)} px screen`);
  return errs;
})()"""

# where table.ts put each travel thing, and the painted table's size (what layout() and paint() write)
TABLE_STATE = """(() => ({things: Object.fromEntries(['cafe', 'boli', 'rodalies', 'gafas'].map(id => { const s = document.getElementById(id).style;
    return [id, [parseFloat(s.left), parseFloat(s.top)]]; })), lienzo: [document.getElementById('lienzo').width, document.getElementById('lienzo').height],
  papers: ['folleto', 'cuaderno', 'reverso'].map(id => { const e = document.getElementById(id); return [e.offsetTop, e.offsetHeight]; })}))()"""
# the painted table already has the size the scene asks for now (table.ts size(): the scene, at most 1.3 Mpx)
TABLE_SIZED = """(() => { const e = document.getElementById('escena'), c = document.getElementById('lienzo'), W = e.clientWidth, H = e.clientHeight,
  k = Math.min(1, Math.sqrt(1.3e6 / (W * H))); return c.width === Math.max(2, Math.round(W * k)) && c.height === Math.max(2, Math.round(H * k)); })()"""

async def table_sized(page, timeout=10000):
    """Wait for the painted table to follow the scene: a new size waits for the ResizeObserver (next frame), the 200 ms
    debounce and the repaint, which on CI's software rendering can take longer than any fixed wait. On a timeout the
    caller's comparison reports the mismatch."""
    try: await page.wait_for_function(TABLE_SIZED, timeout=timeout)
    except Exception: pass

async def check_table_follows(browser):
    """The papers can settle after the table was first measured (on a slow network the web fonts arrive after it,
    and Linux's fallback font wraps the text differently): the travel things and the painted table follow them.
    The papers' text reflows once the table is painted; what the page shows then must be what measuring afresh
    (a resize) gives."""
    errs = []
    for name, (w, h) in {"1440x900": (1440, 900), "390x844": (390, 844)}.items():
        page = await open_page(browser, viewport={"width": w, "height": h}, reduced_motion="reduce")
        await page.goto(page_url); await page.evaluate("document.fonts.ready")
        await page.evaluate("scrollTo({top: document.scrollingElement.scrollHeight, behavior: 'instant'})")
        try: await page.wait_for_function("document.getElementById('lienzo')?.dataset.pintada === '1'", timeout=12000)
        except Exception: errs.append(f"{name}: the table never gets painted"); await page.close(); continue
        await page.wait_for_timeout(500)
        before = await page.evaluate(TABLE_STATE)
        # the papers' text reflows, as when the web fonts replace the fallback
        await page.add_style_tag(content=".mesa p, .mesa li{ letter-spacing:.07em; }"); await page.wait_for_timeout(800); await table_sized(page)
        settled = await page.evaluate(TABLE_STATE)
        await page.evaluate("dispatchEvent(new Event('resize'))"); await page.wait_for_timeout(800); await table_sized(page)
        fresh = await page.evaluate(TABLE_STATE); await page.close()
        if settled["papers"] == before["papers"]: errs.append(f"{name}: the papers did not reflow (the check proves nothing)"); continue
        for thing, (x, y) in fresh["things"].items():
            sx, sy = settled["things"][thing]
            if abs(sx - x) > 1 or abs(sy - y) > 1: errs.append(f"{name}: #{thing} stays at {sx:.0f},{sy:.0f} after the papers settle; measured afresh it goes to {x:.0f},{y:.0f}")
        if settled["lienzo"] != fresh["lienzo"]: errs.append(f"{name}: the painted table stays {settled['lienzo']} after the papers settle; measured afresh it is {fresh['lienzo']}")
    return errs

async def check_still_window(browser):
    """With reduced motion the still frame is painted where #win is once the page is laid out (tickets and fonts in):
    at 10:00, the sky just inside the top of #win and the wall just above its painted frame look clearly different. A
    frame painted from an earlier layout (before the tickets or the fonts) shows the same glass at both."""
    errs = []
    for name, (w, h) in {"390x844": (390, 844), "1440x900": (1440, 900)}.items():
        page = await open_page(browser, viewport={"width": w, "height": h}, reduced_motion="reduce")
        await page.clock.set_fixed_time("2026-09-28T08:00:00Z")   # 10:00 in Madrid: a blue sky against a brown wall
        await page.goto(page_url); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(2500)
        a, b = await page.evaluate("""(() => { const r = document.getElementById('win').getBoundingClientRect(), x = r.left + r.width / 2;
          return [[x, r.top - .022 * innerHeight - 14], [x, r.top + 12]]; })()""")
        img = Image.open(io.BytesIO(await page.screenshot())).convert("RGB"); await page.close()
        pa, pb = [[sum(img.getpixel((int(x) + i, int(y) + j))[c] for i in range(-2, 3) for j in range(-2, 3)) / 25 for c in range(3)] for x, y in (a, b)]
        d = sum((u - v) ** 2 for u, v in zip(pa, pb)) ** .5
        if d < 60: errs.append(f"{name}: the still frame's window is not where #win is (wall above it and sky inside differ by only {d:.0f})")
    return errs

async def check_sizes(browser):
    """Layout at every size: read straight from the page, no waiting for the painting."""
    failures = []
    for name, (w, h) in SIZES.items():
        page = await open_page(browser, viewport={"width": w, "height": h})
        await page.goto(page_url); await page.wait_for_timeout(1200)
        failures += [f"{name}: {e}" for e in await page.evaluate(FIT)]
        await page.close()
    return failures

# fonts and antialiasing differ between systems, so each one keeps its own reference frames
baseline = root / "scripts/baseline" / sys.platform

async def open_page(browser, **options):
    """A page with generous timeouts: software rendering on a two-core CI machine can take long to give a frame."""
    page = await browser.new_page(**options); page.set_default_timeout(120000); return page
PARITY = {"escritorio-hero": (1440, 900, False), "escritorio-mesa": (1440, 900, True), "movil-hero": (390, 844, False)}

async def check_parity(browser):
    """The site looks as it did: a still frame (reduced motion, clock fixed) compared with the reference frames."""
    errs = []; baseline.mkdir(parents=True, exist_ok=True)
    for name, (w, h, table) in PARITY.items():
        page = await open_page(browser, viewport={"width": w, "height": h}, reduced_motion="reduce")
        await page.clock.set_fixed_time("2026-09-28T08:00:00Z")   # 10:00 in Madrid, a day inside the timetable
        await page.goto(parity_url); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(2500)
        if table:
            await page.evaluate("scrollTo({top: document.scrollingElement.scrollHeight, behavior: 'instant'})")
            try: await page.wait_for_function("document.getElementById('lienzo')?.dataset.pintada === '1'", timeout=12000)
            except Exception: errs.append(f"{name}: the table never gets painted")
            await page.wait_for_timeout(1500)
        shot = Image.open(io.BytesIO(await page.screenshot())).convert("RGB"); await page.close()
        ref = baseline / f"{name}.png"
        if not ref.exists():
            shot.save(ref); print(f"reference frame written: {ref.relative_to(root)}")
            # in CI a missing reference is a failure: download the written one from the run and commit it
            if os.environ.get("CI"): errs.append(f"{name}: no reference frame for {sys.platform} yet (written to {ref.relative_to(root)})")
            continue
        diff = ImageChops.difference(shot.resize((360, round(360 * h / w))), Image.open(ref).convert("RGB").resize((360, round(360 * h / w))))
        # both a faint change everywhere and a clear change in a small spot count
        mean = sum(ImageStat.Stat(diff).mean) / 3
        spots = sum(1 for px in diff.get_flattened_data() if max(px) > 40) / (diff.width * diff.height)
        print(f"{name}: mean difference {mean:.2f}, changed {spots:.2%}")
        if mean > 2 or spots > .005: errs.append(f"{name} no longer looks like its reference (mean {mean:.1f}, changed {spots:.1%})"); shot.save(shots / f"{name}-distinto.png")
    return errs

# a train in Madrid's morning, on the frozen timetable (the same day the parity frames use)
LIVE = """(() => { const live = [...document.querySelectorAll('[aria-live]')];
  return {n: live.length, holding: live.filter(l => l.querySelector('input,button,a,select')).map(l => l.id || l.className),
          text: live.map(l => l.textContent.trim()).join(' | '), dep: document.getElementById('dep').textContent}; })()"""

async def check_a11y(browser):
    """13. Screen readers hear the train, not the clock; one-key shortcuts stay off for the public; the labels read right."""
    errs = []
    page = await open_page(browser, viewport={"width": 390, "height": 844})
    await page.clock.install(time="2026-09-28T08:00:00Z")   # 10:00 in Madrid
    await page.goto(parity_url); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(1500)
    live = await page.evaluate(LIVE)
    if not live["n"]: errs.append("no live region: changing train is never announced")
    if live["holding"]: errs.append(f"a live region holds controls ({', '.join(live['holding'])}): every re-render is read out")
    # the 30 s refresh rewrites the countdown; the live region must stay quiet while the train shown is the same
    await page.evaluate("""window.__talk = 0; document.querySelectorAll('[aria-live]').forEach(l =>
      new MutationObserver(m => { window.__talk += m.length; }).observe(l, {childList: true, subtree: true, characterData: true}))""")
    await page.clock.run_for(61000); await page.wait_for_timeout(300)
    after = await page.evaluate(LIVE)
    talk = await page.evaluate("window.__talk")
    if after["dep"] == live["dep"] and talk: errs.append(f"the live region speaks {talk} times in a minute with the same train ({live['dep']})")
    pick = await page.evaluate("(() => { const b = document.querySelector('.tt'); if(!b) return null; b.click(); return b.querySelector('.t').textContent; })()")
    await page.wait_for_timeout(300)
    said = (await page.evaluate(LIVE))["text"]
    if pick and pick not in said: errs.append(f"choosing the {pick} train is not announced (live region: «{said[:80]}»)")
    label = await page.evaluate("document.querySelector('.tk .swap')?.getAttribute('aria-label') || ''")
    if not label.startswith("Cambiar el sentido"): errs.append(f"the ticket's ⇄ reads «{label}», expected «Cambiar el sentido…»")
    # R and P are for recording the video only: without ?grabar a stray key must not pause the landscape
    PLAYING = "window.reus.playing ? reus.playing() : null"
    await page.keyboard.press("p"); await page.wait_for_timeout(200)
    playing = await page.evaluate(PLAYING)
    if playing is None: errs.append("reus.playing() is missing (whether the landscape is running)")
    elif not playing: errs.append("P pauses the landscape without ?grabar in the URL")
    await page.close()
    page = await open_page(browser, viewport={"width": 390, "height": 844})
    await page.goto(parity_url + "?grabar"); await page.wait_for_timeout(1500)
    await page.keyboard.press("p"); await page.wait_for_timeout(200)
    if await page.evaluate(PLAYING) is not False: errs.append("P does not pause the landscape with ?grabar")
    await page.close()
    # a day beyond the timetable: the note speaks impersonally
    page = await open_page(browser, viewport={"width": 390, "height": 844})
    await page.clock.install(time="2027-03-10T09:00:00Z")
    await page.goto(parity_url); await page.wait_for_timeout(1500)
    note = await page.evaluate("document.getElementById('note').textContent")
    if not note: errs.append("a day beyond the timetable shows no «horario aproximado» note")
    elif any(w in note.lower().split() for w in ("tengo", "tenemos", "yo")): errs.append(f"the note speaks in the first person: «{note}»")
    await page.close()
    return errs

MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

async def check_red(browser):
    """14. The site reads data/red.json: the attribution Renfe's licence asks for, with the data's update date."""
    import json
    red = json.loads((root / "scripts/baseline/red.json").read_text()) if (root / "scripts/baseline/red.json").exists() else None
    if not red: return ["no frozen network timetable at scripts/baseline/red.json for the parity build"]
    y, m, d = map(int, red["actualizado"].split("-"))
    page = await open_page(browser, viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    await page.clock.set_fixed_time("2026-09-28T08:00:00Z")
    await page.goto(parity_url); await page.wait_for_timeout(1500)
    text = " ".join((await page.evaluate("document.getElementById('reverso').textContent")).split())
    await page.close()
    errs = []
    if red["fuente"] not in text: errs.append(f"the back of the ticket does not credit «{red['fuente']}» (it reads «{text[-90:]}»)")
    if f"{d} de {MONTHS[m - 1]} de {y}" not in text: errs.append(f"the back of the ticket does not give the data's update date, {d} de {MONTHS[m - 1]} de {y}")
    return errs

SUBTITLE = "El tren a casa, y de vuelta a Barcelona"

async def hero_page(browser, w=1440, h=900, at="2026-09-28T08:00:00Z"):
    """The hero on the frozen timetable, as a still frame at a fixed Madrid time (10:00 by default)."""
    page = await open_page(browser, viewport={"width": w, "height": h}, reduced_motion="reduce")
    await page.clock.set_fixed_time(at)
    await page.goto(parity_url); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(1200)
    return page

async def check_hero(browser):
    """15. The hero B: its name and subtitle."""
    errs = []
    page = await hero_page(browser)
    got = await page.evaluate("({title: document.title, name: document.querySelector('.brand').textContent.trim(), sub: document.querySelector('.sub').textContent.trim()})")
    if got["title"] != NAME: errs.append(f"the page's title is «{got['title']}», expected «{NAME}»")
    if got["name"] != NAME: errs.append(f"the name on the wall is «{got['name']}», expected «{NAME}»")
    if got["sub"] != SUBTITLE: errs.append(f"the subtitle is «{got['sub']}», expected «{SUBTITLE}»")
    errs += await check_hero_ticket(page)
    errs += await check_town_ticket(page)
    errs += await check_hero_board(page)
    errs += await check_hero_ruler(page)
    await page.close()
    # 3.3 · the town selector: opening, its two steps, choosing a town (with and without AVE), closing without
    # choosing, and fitting the sheet with the longest eligible name
    errs += [f"town: {e}" for e in await check_town_dialog(browser)]
    errs += [f"town: {e}" for e in await check_town_step1(browser)]
    errs += [f"town: {e}" for e in await check_town_groups(browser)]
    errs += [f"town: {e}" for e in await check_town_choose_girona(browser)]
    errs += [f"town: {e}" for e in await check_town_choose_tarragona(browser)]
    errs += [f"town: {e}" for e in await check_town_close(browser)]
    errs += [f"town: {e}" for e in await check_town_fit(browser)]
    errs += [f"phone: {e}" for e in await check_phone_board(browser)]
    # 21:30, from Reus: no regional left today, but two AVE from Camp de Tarragona (22:17, 22:39)
    page = await hero_page(browser, at="2026-09-28T19:30:00Z")
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    b = await page.evaluate(BOARD); r = await page.evaluate(RULER)
    want = ["AVE 22:17 el próximo, en 47 min → 22:59 desde Camp de Tarragona", "R15 05:36 mañana → 07:07"]
    if b["rows"] != want: errs.append(f"at 21:30 from Reus the board reads {b['rows']}, expected today's AVE and tomorrow's first regional {want}")
    if b["dep"] != "22:17" or r["knob"] != 1337: errs.append(f"at 21:30 from Reus the train shown is {b['dep']} with the knob at {r['knob']}, expected the 22:17 AVE (1337)")
    if b["soon"] != "en 47 min": errs.append(f"at 21:30 from Reus .soon reads «{b['soon']}», expected «en 47 min»")
    if "Hoy ya no quedan regionales" not in b["info"]: errs.append("at 21:30 from Reus the board does not say «Hoy ya no quedan regionales»")
    errs += [f"at 21:30 from Reus: {e}" for e in buy_link(b, CAMP_ID, SANTS_ID, "28/09/2026")]
    await page.close()
    # «ahora» at both ends of the day (00:30 is clamped to the ruler's start, 23:59 is its end) never leaves the screen
    for at, when in (("2026-09-28T22:30:00Z", "00:30"), ("2026-09-28T21:59:00Z", "23:59")):
        for w, h in ((390, 844), (1440, 900)):
            page = await hero_page(browser, w, h, at=at)
            out = await page.evaluate("""(() => { const b = document.querySelector('.nowline span')?.getBoundingClientRect();
              return b ? b.left < -1 || b.right > innerWidth + 1 : 'missing'; })()""")
            if out: errs.append(f"{w}x{h} at {when}: the word «ahora» leaves the screen ({out})")
            await page.close()
    # late in the evening «ahora» sits on the right of the ruler, where «Volver a ahora» used to be
    for w, h in ((390, 844), (1440, 900)):
        page = await hero_page(browser, w, h, at="2026-09-28T21:10:00Z")
        await page.focus("#t"); await page.keyboard.press("Home"); await page.wait_for_timeout(300)
        hit = await page.evaluate("""(() => { const a = document.getElementById('nowBtn'), b = document.querySelector('.nowline span');
          if(!a || !b || a.hidden) return 'missing'; const r = a.getBoundingClientRect(), s = b.getBoundingClientRect();
          return r.right > s.left && s.right > r.left && r.bottom > s.top && s.bottom > r.top; })()""")
        if hit: errs.append(f"{w}x{h} at 23:10: «Volver a ahora» covers the word «ahora» ({hit})")
        await page.close()
    # at 23:30 no train is left today: tomorrow's first ones, and the board says so
    page = await hero_page(browser, at="2026-09-28T21:30:00Z")
    b = await page.evaluate(BOARD)
    want = ["AVE 05:50 el próximo → 06:22 hasta Camp de Tarragona", "R15 06:33 el siguiente → 08:03"]
    if b["rows"] != want: errs.append(f"at 23:30 the board reads {b['rows']}, expected tomorrow's first trips {want}")
    if "Hoy ya no quedan" not in b["info"]: errs.append("at 23:30 the board does not say «Hoy ya no quedan · mañana»")
    errs += [f"at 23:30: {e}" for e in buy_link(b, "71801", CAMP_ID, "29/09/2026")]
    await page.close()
    return errs

BOARD = """(() => { const n = s => s.replace(/\\s+/g, ' ').trim(), rows = [...document.querySelectorAll('#board .trip')];
  // «comprar ↗» is the big row's link to Renfe, read on its own (buy) rather than as part of the row's text
  const text = r => { const c = r.cloneNode(true); c.querySelectorAll('.buy').forEach(x => x.remove()); return n(c.textContent); };
  const dep = document.getElementById('dep'), word = document.querySelector('#board .buy'), q = dep?.href ? new URL(dep.href).searchParams : null;
  return {rows: rows.map(text), buy: q && {from: q.get('cdgoOrigen'), to: q.get('cdgoDestino'), day: q.get('FechaIdaSel'), host: new URL(dep.href).host,
            tab: dep.target === '_blank' && word?.target === '_blank', same: word?.href === dep.href, label: dep.getAttribute('aria-label')}, buttons: rows.map(r => r.matches('button.tt')), dep: document.getElementById('dep')?.textContent,
          soon: document.querySelector('.soon')?.textContent.trim(), info: n(document.getElementById('info').textContent),
          aviso: document.getElementById('aviso').textContent}; })()"""

RULER = """(() => { const t = document.getElementById('t'), line = document.querySelector('.nowline');
  const look = i => { const c = getComputedStyle(i); return [c.width, c.height, c.borderRadius, c.backgroundColor, c.opacity].join(); };
  return {ticks: document.querySelectorAll('#ticks i').length, looks: new Set([...document.querySelectorAll('#ticks i:not(.on)')].map(look)).size, knob: +t.value,
          text: t.getAttribute('aria-valuetext'), now: line ? line.textContent.trim() : null, nowAt: line ? parseFloat(line.style.left) : null,
          head: document.querySelector('.rulerHead').innerText, dep: document.getElementById('dep').textContent}; })()"""

async def check_hero_ruler(page):
    """At 10:00, Sants → Reus on the frozen timetable: 20 regionals and 14 AVE on the ruler."""
    errs = []
    r = await page.evaluate(RULER)
    if r["ticks"] != 34: errs.append(f"the ruler has {r['ticks']} ticks, expected 34 (20 regionals and 14 AVE)")
    if r["looks"] != 1: errs.append(f"the ruler's ticks look {r['looks']} different ways, expected one (the AVE like the rest)")
    if r["knob"] != 603: errs.append(f"the knob stands at minute {r['knob']}, expected 603 (the train shown, 10:03)")
    if r["now"] != "ahora": errs.append(f"the ruler's now mark reads «{r['now']}», expected a thin line with «ahora»")
    elif abs(r["nowAt"] - (600 - 300) / (1439 - 300) * 100) > .1: errs.append(f"«ahora» stands at {r['nowAt']}%, not at 10:00")
    import re
    if re.search(r"\d\d:\d\d|Son las|Ahora", r["head"]): errs.append(f"the ruler still has a heading with the time: «{r['head']}»")
    await page.focus("#t")
    steps = [("End", "22:03", "tren de las 22:03"), ("ArrowLeft", "21:33", "tren de las 21:33"), ("Home", "05:50", "AVE de las 05:50"),
             ("ArrowRight", "06:33", "tren de las 06:33"), ("ArrowLeft", "05:50", "AVE de las 05:50")]
    for key, dep, text in steps:
        await page.keyboard.press(key); await page.wait_for_timeout(250)
        r = await page.evaluate(RULER)
        if r["dep"] != dep or r["text"] != text: errs.append(f"{key} on the ruler shows {r['dep']} («{r['text']}»), expected {dep} («{text}»)")
    if r["knob"] != 350: errs.append(f"with the 05:50 AVE shown the knob stands at minute {r['knob']}, expected 350")
    await page.click("#nowBtn"); await page.wait_for_timeout(300)
    return errs

async def check_hero_board(page):
    """Two trips at 10:00 on the frozen timetable, the train shown and the one after it, regional or AVE (Sants → Reus:
    R15 10:03, R15 11:03; Reus → Sants: AVE 10:30 from Camp de Tarragona, R15 10:36: the big train is the first to
    leave, AVE included); choosing a trip, AVE included,
    makes it the train shown."""
    errs = []
    async def expect(when, rows, dep, soon, buy=("71801", "71400", "28/09/2026")):
        b = await page.evaluate(BOARD)
        if b["rows"] != rows: errs.append(f"{when}: the board reads {b['rows']}, expected {rows}"); return b
        errs.extend(f"{when}: {e}" for e in buy_link(b, *buy))
        if b["dep"] != dep: errs.append(f"{when}: the train shown (#dep) is {b['dep']}, expected {dep}")
        if b["soon"] != soon: errs.append(f"{when}: .soon reads «{b['soon']}», expected «{soon}»")
        big = [r.split()[1] for r, btn in zip(b["rows"], b["buttons"]) if not btn]
        if big != [dep]: errs.append(f"{when}: the trips that are not buttons are {big}, expected only the train shown, {dep}")
        return b
    b = await expect("at 10:00", ["R15 10:03 el próximo, en 3 min → 11:33", "R15 11:03 el siguiente → 12:33"], "10:03", "en 3 min")
    for word in ("Próximo", "Luego", "Anterior", "Tren elegido"):
        if word in b["info"]: errs.append(f"the board still says «{word}»")
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    # the big train is the first to leave, AVE included
    await expect("at 10:00, Reus → Sants", ["AVE 10:30 el próximo, en 30 min → 11:11 desde Camp de Tarragona", "R15 10:36 el siguiente → 12:07"], "10:30", "en 30 min", ("04104", "71801", "28/09/2026"))
    async def choose(time):
        ok = await page.evaluate(f"(() => {{ const b = [...document.querySelectorAll('#board button.tt')].find(b => b.querySelector('.t').textContent === '{time}'); if(b) b.click(); return !!b; }})()")
        await page.wait_for_timeout(300); return ok
    if not await choose("10:36"): return errs + ["the R15 at 10:36 is not a button"]
    await expect("after choosing the 10:36", ["R15 10:36 el próximo → 12:07", "AVE 11:00 el siguiente → 11:44 desde Camp de Tarragona"], "10:36", "", ("71400", "71801", "28/09/2026"))
    await page.click("#nowBtn"); await page.wait_for_timeout(300)
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    if not await choose("11:03"): return errs + ["the R15 at 11:03 is not a button"]
    await expect("after choosing the 11:03", ["R15 11:03 el próximo → 12:33", "AVE 12:00 el siguiente → 12:31 hasta Camp de Tarragona"], "11:03", "")
    if not await choose("12:00"): return errs + ["the AVE at 12:00 is not a button"]
    b = await expect("after choosing the AVE", ["AVE 12:00 el próximo → 12:31 hasta Camp de Tarragona", "R14 12:03 el siguiente → 13:33"], "12:00", "", ("71801", "04104", "28/09/2026"))
    if "AVE" not in b["aviso"] or "Camp de Tarragona" not in b["aviso"]: errs.append(f"choosing the AVE, the live region does not say it is an AVE to Camp de Tarragona («{b['aviso']}»)")
    await page.click("#nowBtn"); await page.wait_for_timeout(300)
    return errs

def buy_link(b, frm, to, day):
    """The big train's time and «comprar ↗» open Renfe's search for its trip and day, in a new tab (src/buy.ts)."""
    k = b.get("buy")
    if not k: return ["the train shown (#dep) is not a link to Renfe"]
    errs = []
    if k["host"] != "venta.renfe.com": errs.append(f"the buy link goes to {k['host']}, expected venta.renfe.com")
    if (k["from"], k["to"], k["day"]) != (f"0071,{frm},{frm}", f"0071,{to},{to}", day):
        errs.append(f"the buy link searches {k['from']} → {k['to']} on {k['day']}, expected {frm} → {to} on {day}")
    if not k["tab"]: errs.append("the buy links do not open in a new tab")
    if not k["same"]: errs.append("«comprar ↗» and the time do not open the same search")
    if "Renfe" not in (k["label"] or ""): errs.append(f"the time's label does not say it buys on Renfe («{k['label']}»)")
    return errs

TICKET = """(() => { const t = [...document.querySelectorAll('#tickets .tk')], sw = document.querySelector('.tk .swap');
  return {n: t.length, text: t[0] ? t[0].textContent.replace(/\\s+/g, ' ').trim() : '', route: t[0]?.querySelector('.route')?.textContent.replace(/\\s+/g, ' ').trim(),
          swap: sw ? sw.textContent.trim() : null, focus: document.activeElement === sw, aviso: document.getElementById('aviso').textContent}; })()"""

async def check_hero_ticket(page):
    """One ticket with both ends; ⇄ turns the trip around and keeps the focus."""
    errs = []
    t = await page.evaluate(TICKET)
    if t["n"] != 1: return [f"{t['n']} tickets in the hero, expected one"]
    if not t["text"].startswith("Billete"): errs.append(f"the ticket reads «{t['text']}», expected «Billete …»")
    if t["route"] != "Sants ⇄ Reus": errs.append(f"the ticket's route reads «{t['route']}», expected «Sants ⇄ Reus»")
    if t["swap"] != "⇄": return errs + ["the ticket has no ⇄ button (.tk .swap)"]
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    t = await page.evaluate(TICKET)
    if t["route"] != "Reus ⇄ Sants": errs.append(f"after ⇄ the route reads «{t['route']}», expected «Reus ⇄ Sants»")
    if not t["focus"]: errs.append("after ⇄ the focus is not on ⇄ any more")
    if "a Barcelona Sants" not in t["aviso"]: errs.append(f"after ⇄ the live region does not name the new trip («{t['aviso'][:80]}»)")
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    t = await page.evaluate(TICKET)
    if t["route"] != "Sants ⇄ Reus": errs.append(f"⇄ twice does not bring the trip back («{t['route']}»)")
    return errs

# --- 3.3 · the town selector ---------------------------------------------------------------------------------
# eligible network stations (spec-3.3.md, decision 2): everything in the frozen timetable except Barcelona's own
# stops, Camp de Tarragona (AVE only) and the three Barcelona-area stations the selector leaves out
EXCLUDED_TOWNS = {"71707", "72400", "71708", "04104"}
SANTS_ID, CAMP_ID, REUS_TOWN, GIRONA_TOWN, TARRAGONA_TOWN = "71801", "04104", "71400", "79300", "71500"

def _net():
    import json
    return json.loads((root / "scripts/baseline/red.json").read_text())

def _eligible(sid, info):
    return sid not in EXCLUDED_TOWNS and not info.get("barcelona")

def _line_set(net, line):
    """Eligible stations whose lineas include this line."""
    return {sid for sid, info in net["estaciones"].items() if _eligible(sid, info) and line in info.get("lineas", [])}

def _branch_set(net, main_line, ramal_line):
    """Eligible stations of a ramal: they carry its line but not the main one."""
    return {sid for sid, info in net["estaciones"].items()
            if _eligible(sid, info) and ramal_line in info.get("lineas", []) and main_line not in info.get("lineas", [])}

# corridor groups of step 1 (spec-3.3.md, decision 5): data-group id -> (label, main line, ramal line or None)
GROUPS = {
    "R11": ("Girona · Figueres · Portbou", "R11", None),
    "R13": ("Valls · Montblanc · Lleida", "R13", None),
    "R14": ("Tarragona · Reus · Falset · Móra la Nova", "R15", "R14"),
    "R16": ("Tarragona · Salou · Cambrils · Tortosa", "R16", "R17"),
}

def group_towns(net, group):
    """(main, ramal) sets of eligible stop ids for a corridor group."""
    _, main_line, ramal_line = GROUPS[group]
    return _line_set(net, main_line), (_branch_set(net, main_line, ramal_line) if ramal_line else set())

# known relative orders of real stops, Barcelona outwards (spec-3.3.md, decision 4): enough to catch a wrong
# merge without reimplementing it -- the strip's exact order is the implementation's algorithm to get right, not
# ours to duplicate. Faió-La Pobla de Massaluca (after Móra la Nova on paper) is missing from the frozen network.
KNOWN_ORDER = {
    "R11": {"main": ["79100", "79104", "79300", "79309", "79315"], "ramal": None},  # Granollers Centre, Sant Celoni, Girona, Figueres, Portbou
    "R13": {"main": ["71600", "76004", "73008", "78400"], "ramal": None},           # Sant Vicenç de Calders, Valls, Montblanc, Lleida-Pirineus
    "R14": {"main": ["71500", "71400", "71303", "71300"], "ramal": ["73101", "73008", "78400"]},  # Tarragona, Reus, Marçà-Falset, Móra la Nova · ramal Alcover, Montblanc, Lleida-Pirineus
    "R16": {"main": ["71500", "65422", "65405"], "ramal": None},                    # Tarragona, Cambrils, L'Ametlla de Mar · ramal is Salou-Port Aventura alone
}

def hhmm(m):
    m = m % 1440
    return f"{m // 60:02d}:{m % 60:02d}"

def board_row(line, dep, arr, which, soon=None, camp=None):
    """Text of one #board .trip once whitespace is collapsed (mirrors timetable.ts's trip()): «el próximo» (with its
    countdown) or «el siguiente», and under an AVE's arrival «hasta/desde Camp de Tarragona»."""
    bits = [line, hhmm(dep), which + (f", {soon}" if soon else ""), f"→ {hhmm(arr)}"]
    if camp: bits.append(f"{camp} Camp de Tarragona")
    return " ".join(bits)

def two_rows(trains, now, camp=None):
    """The board for a list of trains in order of departure: the first is «el próximo» with its countdown, the
    second «el siguiente»."""
    return [board_row(t[2], t[0], t[1], "el próximo" if i == 0 else "el siguiente", soon=(f"en {t[0] - now} min" if i == 0 else None),
                      camp=(camp if t[2] == "AVE" else None)) for i, t in enumerate(trains[:2])]

def _direct(net, day, frm, to):
    """The direct trains of a day between two stops, straight from the frozen network (mirrors src/time.ts's
    direct()): needed to compute the expected board, unlike the strip's stop order, checked above instead by
    known relative order and exact sets."""
    out = []
    for i in net["dias"].get(day, []):
        t = net["trenes"][i]; ids = [s[0] for s in t["s"]]
        if frm in ids and to in ids:
            a, b = ids.index(frm), ids.index(to)
            if b > a: out.append((t["s"][a][2], t["s"][b][1], t["p"]))
    return sorted(out)

TOWN = """(() => { const b = document.querySelector('.tk .town'); if(!b) return null;
  return {tag: b.tagName, text: b.textContent.trim(), haspopup: b.getAttribute('aria-haspopup'),
          style: getComputedStyle(b).textDecorationLine, raised: getComputedStyle(b).textShadow, label: b.getAttribute('aria-label') || '',
          route: document.querySelector('.tk .route')?.textContent.replace(/\\s+/g, ' ').trim()}; })()"""

async def check_town_ticket(page):
    """The town on the ticket: a button that opens the selector, raised like every interactive text (an offset
    shadow, no underline), with an
    accessible name starting with the town's own name; the route still reads «Sants ⇄ Reus»."""
    t = await page.evaluate(TOWN)
    if not t: return ["'.tk .town' is missing"]
    errs = []
    if t["tag"] != "BUTTON": errs.append(f".tk .town is a {t['tag']}, expected a button")
    if t["text"] != "Reus": errs.append(f".tk .town reads «{t['text']}», expected «Reus»")
    if t["haspopup"] != "dialog": errs.append(f".tk .town aria-haspopup is «{t['haspopup']}», expected «dialog»")
    if t["style"] != "none": errs.append(f".tk .town is underlined ({t['style']}): what you can press is raised, not underlined")
    if t["raised"] in ("", "none"): errs.append(".tk .town has no offset shadow: what you can press stands off the paper")
    if not t["label"].startswith("Reus"): errs.append(f".tk .town accessible name is «{t['label']}», expected to start with «Reus»")
    if t["route"] != "Sants ⇄ Reus": errs.append(f".tk .route reads «{t['route']}», expected «Sants ⇄ Reus»")
    return errs

# a click in the town selector may wait for a slow frame: the software-rendered hero takes seconds per frame at the
# largest sizes on a slow CI runner (1000x1300, 1920x1080 and 2560x1440 timed out at 4 s on 32-minute runs, passed on a
# 17-minute one). The wait only costs time when the click never becomes possible
CLICK_MS = 15000

async def open_town(page, timeout=CLICK_MS):
    """Open the town selector from the ticket. Returns an error list ([] on success)."""
    try: await page.click(".tk .town", timeout=timeout)
    except Exception as e:
        # Playwright's call log ends with why it kept retrying (covered by another element, not stable, off screen…)
        log = [l.strip(" -") for l in str(e).splitlines()]
        why = [l for l in log if any(k in l for k in ("intercepts pointer events", "not stable", "outside of the viewport", "not visible", "not enabled"))]
        return [f"'.tk .town' is not a clickable button that opens #selp ({(why[-1] if why else log[0])[:200]})"]
    return []

async def choose_town(page, group, town, timeout=CLICK_MS):
    """The three taps that choose a town: the ticket's town, its corridor group, then the stop itself."""
    errs = await open_town(page, timeout)
    if errs: return errs
    try: await page.click(f'.ln[data-group="{group}"]', timeout=timeout)
    except Exception: return [f"'.ln[data-group={group}]' is not clickable"]
    try: await page.click(f'#selp .strip .opt[data-town="{town}"]', timeout=timeout)
    except Exception: return [f"'.opt[data-town={town}]' is not clickable"]
    return []

async def check_town_dialog(browser):
    """Opening the selector: a native <dialog> labelled by its own question, focus on the first group; the
    question changes with the direction."""
    errs = []
    page = await hero_page(browser)
    e = await open_town(page)
    if e: await page.close(); return e
    got = await page.evaluate("""() => { const d = document.getElementById('selp'); if(!d) return null;
      const h = d.querySelector('h3'), first = d.querySelector('.ln');
      return {tag: d.tagName, open: d.open, labelledby: d.getAttribute('aria-labelledby'), h3id: h?.id,
              h3: h?.textContent.trim(), focusedFirst: !!first && document.activeElement === first}; }""")
    if not got: errs.append("#selp is missing")
    else:
        if got["tag"] != "DIALOG": errs.append(f"#selp is a {got['tag']}, expected a native <dialog>")
        if not got["open"]: errs.append("#selp is not open after clicking .tk .town")
        if not got["labelledby"] or got["labelledby"] != got["h3id"]: errs.append(f"#selp's aria-labelledby ({got['labelledby']}) does not point at its h3 ({got['h3id']})")
        if got["h3"] != "¿A qué pueblo vas?": errs.append(f"#selp's question reads «{got['h3']}», expected «¿A qué pueblo vas?»")
        if not got["focusedFirst"]: errs.append("the focus is not on the first .ln when the selector opens")
    await page.keyboard.press("Escape"); await page.wait_for_timeout(300)
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    e = await open_town(page)
    if e: errs += e
    else:
        h3 = await page.evaluate("document.querySelector('#selp h3')?.textContent.trim()")
        if h3 != "¿Desde qué pueblo vuelves?": errs.append(f"with the direction swapped, #selp's question reads «{h3}», expected «¿Desde qué pueblo vuelves?»")
    await page.close()
    return errs

async def check_town_step1(browser):
    """Step 1: exactly 4 corridor groups, in order, with their exact labels and line pills."""
    page = await hero_page(browser)
    e = await open_town(page)
    if e: await page.close(); return e
    got = await page.evaluate("""() => [...document.querySelectorAll('#selp .ln')].map(b => ({
      group: b.dataset.group, text: b.textContent.replace(/\\s+/g, ' ').trim(),
      pills: [...b.querySelectorAll('.pill')].map(p => p.textContent.trim())}))""")
    await page.close()
    errs = []
    order = ["R11", "R13", "R14", "R16"]
    groups = [o["group"] for o in got]
    if groups != order: errs.append(f".ln groups are {groups}, expected {order}")
    for o in got:
        if o["group"] not in GROUPS: continue
        label, main_line, ramal_line = GROUPS[o["group"]]
        if label not in o["text"]: errs.append(f"{o['group']}: text «{o['text']}» does not contain the label «{label}»")
        want_pills = sorted([main_line, ramal_line]) if ramal_line else [main_line]
        if o["pills"] != want_pills: errs.append(f"{o['group']}: pills are {o['pills']}, expected {want_pills}")
    return errs

async def check_town_groups(browser):
    """Step 2, per corridor group: the exact set of eligible stops, the ramal placed after the main ones, the
    known relative order of real stops, no excluded station anywhere, .back returning to step 1, and the current
    town (Reus) marked and focused when its own group (R14) is entered."""
    net = _net()
    errs = []
    page = await hero_page(browser)
    e = await open_town(page)
    if e: await page.close(); return e
    for group in ("R11", "R13", "R14", "R16"):
        try: await page.click(f'.ln[data-group="{group}"]', timeout=CLICK_MS)
        except Exception: errs.append(f"{group}: '.ln[data-group={group}]' is not clickable"); continue
        await page.wait_for_timeout(200)
        opts = await page.evaluate("""() => [...document.querySelectorAll('#selp .strip .opt')].map(o => ({
          town: o.dataset.town, branch: !!o.closest('li.branch'), current: o.getAttribute('aria-current'),
          focused: document.activeElement === o}))""")
        if not opts:
            errs.append(f"{group}: no .strip .opt found at step 2")
        else:
            main, ramal = group_towns(net, group)
            got_main = {o["town"] for o in opts if not o["branch"]}
            got_ramal = {o["town"] for o in opts if o["branch"]}
            if got_main != main: errs.append(f"{group}: main stops are {sorted(got_main)}, expected {sorted(main)}")
            if got_ramal != ramal: errs.append(f"{group}: ramal stops are {sorted(got_ramal)}, expected {sorted(ramal)}")
            branch_flags = [o["branch"] for o in opts]
            if True in branch_flags:
                first_branch = branch_flags.index(True)
                if any(not b for b in branch_flags[first_branch:]): errs.append(f"{group}: the ramal is not placed after all the main stops")
            towns = [o["town"] for o in opts]
            for kind, seq in KNOWN_ORDER[group].items():
                if not seq: continue
                missing = [t for t in seq if t not in towns]
                if missing: errs.append(f"{group} {kind}: missing known stops {[net['estaciones'][t]['nombre'] for t in missing]}")
                idxs = [towns.index(t) for t in seq if t in towns]
                if idxs != sorted(idxs): errs.append(f"{group} {kind}: known stops out of order ({[net['estaciones'][t]['nombre'] for t in seq if t in towns]})")
            excluded_here = [t for t in towns if t in EXCLUDED_TOWNS or net["estaciones"].get(t, {}).get("barcelona")]
            if excluded_here: errs.append(f"{group}: excluded stations present: {excluded_here}")
            if group == "R14":
                reus = next((o for o in opts if o["town"] == REUS_TOWN), None)
                if not reus: errs.append("R14: Reus is missing from its own group")
                else:
                    if reus["current"] != "true": errs.append("R14: Reus does not carry aria-current=true")
                    if not reus["focused"]: errs.append("R14: the focus is not on Reus when entering its group")
        try: await page.click("#selp .back", timeout=CLICK_MS)
        except Exception: errs.append(f"{group}: '.back' is not clickable"); continue
        await page.wait_for_timeout(200)
        step1 = await page.evaluate("document.querySelectorAll('#selp .ln').length")
        if step1 != 4: errs.append(f"{group}: .back did not return to step 1 (4 .ln expected, {step1} found)")
    await page.close()
    return errs

async def check_town_choose_girona(browser):
    """Choosing Girona (R11, Gironès, no AVE) in three taps: the board becomes the 2 next R11 direct trains
    Sants -> Girona after 10:00 (+2 min margin, as the live board does), no AVE; the ruler has as many ticks as
    that day's direct R11 trains; the live region names Girona. Swapping flips the board to Girona -> Sants."""
    net, day, now, margin = _net(), "2026-09-28", 600, 2
    page = await hero_page(browser)
    errs = await choose_town(page, "R11", GIRONA_TOWN)
    if errs: await page.close(); return errs
    await page.wait_for_timeout(300)
    if await page.evaluate("document.getElementById('selp')?.open"): errs.append("#selp is still open after choosing Girona")
    route = await page.evaluate("document.querySelector('.tk .route')?.textContent.replace(/\\s+/g, ' ').trim()")
    if route != "Sants ⇄ Girona": errs.append(f"after choosing Girona the route reads «{route}», expected «Sants ⇄ Girona»")
    if not await page.evaluate("document.activeElement === document.querySelector('.tk .town')"): errs.append("the focus is not on .tk .town after choosing Girona")
    b = await page.evaluate(BOARD); r = await page.evaluate(RULER)
    want = two_rows([t for t in _direct(net, day, SANTS_ID, GIRONA_TOWN) if t[0] >= now + margin], now)
    if b["rows"] != want: errs.append(f"after choosing Girona the board reads {b['rows']}, expected {want}")
    if any("AVE" in row for row in b["rows"]): errs.append("Girona has no AVE, but the board shows one")
    total = len(_direct(net, day, SANTS_ID, GIRONA_TOWN))
    if r["ticks"] != total: errs.append(f"the ruler has {r['ticks']} ticks, expected {total} (the day's direct R11 Sants→Girona trains)")
    if "Girona" not in b["aviso"]: errs.append(f"choosing Girona, the live region does not name it («{b['aviso'][:80]}»)")
    errs += buy_link(b, SANTS_ID, GIRONA_TOWN, "28/09/2026")
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    route = await page.evaluate("document.querySelector('.tk .route')?.textContent.replace(/\\s+/g, ' ').trim()")
    if route != "Girona ⇄ Sants": errs.append(f"after ⇄ the route reads «{route}», expected «Girona ⇄ Sants»")
    b = await page.evaluate(BOARD)
    want = two_rows([t for t in _direct(net, day, GIRONA_TOWN, SANTS_ID) if t[0] >= now + margin], now)
    if b["rows"] != want: errs.append(f"Girona ⇄ Sants: the board reads {b['rows']}, expected {want}")
    await page.close()
    return errs

async def check_town_choose_tarragona(browser):
    """Choosing Tarragona (Tarragonès): the first two trains to leave, regional or AVE to Camp de Tarragona, all
    computed from the frozen network."""
    net, day, now, margin = _net(), "2026-09-28", 600, 2
    page = await hero_page(browser)
    errs = await choose_town(page, "R14", TARRAGONA_TOWN)
    if errs: await page.close(); return errs
    await page.wait_for_timeout(300)
    b = await page.evaluate(BOARD)
    regs = [t for t in _direct(net, day, SANTS_ID, TARRAGONA_TOWN) if t[0] >= now + margin]
    aves = [t for t in _direct(net, day, SANTS_ID, CAMP_ID) if t[0] >= now + margin]
    if not aves: await page.close(); return ["no AVE Sants→Camp de Tarragona after 10:00 in the frozen data: the test's assumption is wrong"]
    want = two_rows(sorted(regs[:2] + aves[:2]), now, camp="hasta")
    if b["rows"] != want: errs.append(f"choosing Tarragona the board reads {b['rows']}, expected {want}")
    await page.close()
    return errs

async def check_town_close(browser):
    """Closing the selector without choosing (Esc, the × button, or a click on the backdrop) never changes the
    town and returns the focus to the ticket."""
    errs = []
    async def unchanged(page, how):
        out = []
        if await page.evaluate("document.getElementById('selp')?.open"): out.append(f"{how}: #selp is still open")
        route = await page.evaluate("document.querySelector('.tk .route')?.textContent.replace(/\\s+/g, ' ').trim()")
        if route != "Sants ⇄ Reus": out.append(f"{how}: the route changed to «{route}»")
        if not await page.evaluate("document.activeElement === document.querySelector('.tk .town')"): out.append(f"{how}: the focus did not return to .tk .town")
        return out
    page = await hero_page(browser)
    e = await open_town(page)
    if e: errs += [f"Esc: {x}" for x in e]
    else:
        await page.keyboard.press("Escape"); await page.wait_for_timeout(300)
        errs += await unchanged(page, "Esc")
    await page.close()
    page = await hero_page(browser)
    e = await open_town(page)
    if e: errs += [f"button.x: {x}" for x in e]
    else:
        try:
            await page.click("#selp button.x", timeout=CLICK_MS); await page.wait_for_timeout(300)
            errs += await unchanged(page, "button.x")
        except Exception: errs.append("button.x: '#selp button.x' is not clickable")
    await page.close()
    page = await hero_page(browser)
    e = await open_town(page)
    if e: errs += [f"backdrop: {x}" for x in e]
    else:
        await page.mouse.click(2, 2); await page.wait_for_timeout(300)
        errs += await unchanged(page, "backdrop")
    await page.close()
    return errs

async def check_town_fit(browser):
    """With the longest eligible town's name chosen (Puigverd de Lleida-Artesa de Lleida), across the 11 SIZES:
    the existing FIT still passes, the sheet opened at step 2 fits the screen without a horizontal overflow, and
    every .ln/.opt is at least 44 px tall."""
    net = _net()
    town, name = max(((sid, info["nombre"]) for sid, info in net["estaciones"].items() if _eligible(sid, info)), key=lambda x: len(x[1]))
    group = next(g for g in GROUPS if town in (group_towns(net, g)[0] | group_towns(net, g)[1]))
    failures = []
    for size, (w, h) in SIZES.items():
        page = await hero_page(browser, w, h)
        e = await open_town(page)
        if e: failures += [f"{size}: {x}" for x in e]; await page.close(); continue
        short = [x for x in await page.evaluate("[...document.querySelectorAll('#selp .ln')].map(el => el.getBoundingClientRect().height)") if x < 43.5]
        if short: failures.append(f"{size}: a .ln is only {min(short):.0f} px tall")
        try: await page.click(f'.ln[data-group="{group}"]', timeout=CLICK_MS)
        except Exception: failures.append(f"{size}: '.ln[data-group={group}]' is not clickable"); await page.close(); continue
        await page.wait_for_timeout(200)
        sheet = await page.evaluate("(() => { const b = document.querySelector('#selp .sheet').getBoundingClientRect(); return {left: b.left, right: b.right}; })()")
        if sheet["left"] < -1 or sheet["right"] > w + 1: failures.append(f"{size}: the sheet ({sheet['left']:.0f}–{sheet['right']:.0f}) does not fit the {w} px width")
        short = [x for x in await page.evaluate("[...document.querySelectorAll('#selp .strip .opt')].map(el => el.getBoundingClientRect().height)") if x < 43.5]
        if short: failures.append(f"{size}: a .opt is only {min(short):.0f} px tall")
        try: await page.click(f'#selp .strip .opt[data-town="{town}"]', timeout=CLICK_MS)
        except Exception: failures.append(f"{size}: '.opt[data-town={town}]' ({name}) is not clickable"); await page.close(); continue
        await page.wait_for_timeout(200)
        failures += [f"{size}: {e}" for e in await page.evaluate(FIT)]
        await page.close()
    return failures

PHONE = """(() => { const n = s => s.replace(/\\s+/g, ' ').trim(), d = document.getElementById('detalle'), a = d.querySelector('.comprar');
  const q = a ? new URL(a.href).searchParams : null;
  return {rows: [...document.querySelectorAll('#board .trip')].map(r => n(r.textContent)), buttons: [...document.querySelectorAll('#board .trip')].map(r => r.matches('button')),
          buy: document.querySelectorAll('#board a').length, dep: document.getElementById('dep')?.textContent, open: d.open, sheet: n(d.textContent),
          link: q && {from: q.get('cdgoOrigen'), to: q.get('cdgoDestino'), day: q.get('FechaIdaSel'), tab: a.target === '_blank'},
          focus: document.activeElement?.matches('#board button.big') ?? false}; })()"""

async def check_phone_board(browser):
    """6B (Àlex, 06-10): on a phone the board keeps only the times, the countdown on the big train and a «›» on every
    trip; every trip is a button (the big one too) that opens a paper sheet with its detail and «Comprar en Renfe ↗».
    Tapping another trip makes it the train shown first. Esc, ✕ and the backdrop close the sheet and hand the focus
    back to the big train. On a wide screen the board is unchanged (check_hero_board)."""
    errs = []
    page = await hero_page(browser, 390, 844)
    b = await page.evaluate(PHONE)
    want = ["R15 10:03 en 3 min → 11:33 ›", "R15 11:03 → 12:33 ›"]
    if b["rows"] != want: errs.append(f"at 10:00 the phone board reads {b['rows']}, expected {want}")
    if b["buttons"] != [True, True]: errs.append(f"on a phone every trip should be a button, got {b['buttons']}")
    if b["buy"]: errs.append("on a phone the board still holds a link (the way to Renfe belongs to the sheet)")
    async def tap(sel, when):
        try: await page.click(sel, timeout=CLICK_MS)
        except Exception: errs.append(f"{when}: {sel} is not clickable"); return None
        await page.wait_for_timeout(500); return await page.evaluate(PHONE)
    async def sheet(when, dep, arr, said, link):
        b = await tap("#board button.big", when) if when != "after tapping the 11:03" else await tap("#board .tt", when)
        if not b: return
        if not b["open"]: errs.append(f"{when}: the sheet does not open"); return
        for word in (f"{dep} → {arr}", said, "de viaje", "Comprar en Renfe"):
            if word not in b["sheet"]: errs.append(f"{when}: the sheet does not say «{word}» («{b['sheet']}»)")
        if b["dep"] != dep: errs.append(f"{when}: the train shown is {b['dep']}, expected {dep}")
        k = b["link"]
        if not k: errs.append(f"{when}: the sheet has no link to Renfe")
        elif (k["from"], k["to"], k["day"]) != link or not k["tab"]: errs.append(f"{when}: «Comprar en Renfe» searches {k}, expected {link} in a new tab")
    await sheet("tapping the big train", "10:03", "11:33", "Sale en 3 min", ("0071,71801,71801", "0071,71400,71400", "28/09/2026"))
    await page.keyboard.press("Escape"); await page.wait_for_timeout(300)
    b = await page.evaluate(PHONE)
    if b["open"]: errs.append("Esc does not close the sheet")
    elif not b["focus"]: errs.append("after Esc the focus is not back on the big train")
    await sheet("after tapping the 11:03", "11:03", "12:33", "Sale en 1 h 3 min", ("0071,71801,71801", "0071,71400,71400", "28/09/2026"))
    if await tap("#detalle .x", "✕") and (await page.evaluate(PHONE))["open"]: errs.append("✕ does not close the sheet")
    await tap("#board button.big", "the backdrop")
    await page.mouse.click(195, 40); await page.wait_for_timeout(300)
    if (await page.evaluate(PHONE))["open"]: errs.append("the backdrop does not close the sheet")
    await page.close()
    return errs

async def main():
    failures = []
    async with async_playwright() as p:
        # software WebGL so it also runs on machines without a GPU (slow but faithful)
        browser = await p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        if sys.argv[1:] == ["letras"]:
            failures += await check_letters_suite(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · letras"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["red"]:
            failures += await check_red(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · red"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["hero"]:
            failures += await check_hero(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · hero"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["mesa"]:
            failures += await check_table_follows(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · mesa"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["a11y"]:
            failures += await check_a11y(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · a11y"); sys.exit(1 if failures else 0)
        failures += await check_parity(browser)
        if sys.argv[1:] == ["paridad"]:
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · paridad"); sys.exit(1 if failures else 0)
        for name, (w, h) in VIEWPORTS.items():
            page = await open_page(browser, viewport={"width": w, "height": h})
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            await page.goto(page_url)
            await page.wait_for_timeout(9000)  # let the paint-in finish
            await hero_settled(page)  # ...and .top/.info's own entrance transition too (check_letters needs it settled)
            box = await page.evaluate("""(() => {
              const r = s => document.querySelector(s).getBoundingClientRect();
              const f = s => { const c = getComputedStyle(document.querySelector(s)); return c.fontFamily.split(',')[0].replace(/"/g,''); };
              return {name: r('.brand').bottom, winTop: r('#win').top, winBottom: r('#win').bottom, info: r('#info').top,
                      sans: f('.soon'), serif: f('#dep')};
            })()""")
            if not box["name"] < box["winTop"]: failures.append(f"{name}: name overlaps window ({box['name']:.0f} ≥ {box['winTop']:.0f})")
            if not box["winBottom"] < box["info"]: failures.append(f"{name}: departure block overlaps window")
            if box["sans"] != "Karla": failures.append(f"{name}: small text font is {box['sans']}")
            if box["serif"] != "Young Serif": failures.append(f"{name}: time font is {box['serif']}")
            # the landscape's brush strokes are sized in the render target's pixels: a small window (phones) is
            # painted twice as fine as the desktop one, or each stroke covers too much of it and reads as pixels
            grain = await page.evaluate("""(() => { const g = window.reus.paisaje ? reus.paisaje() : null;
              return g == null ? null : {g, s: Math.min(devicePixelRatio || 1, 1.25),
                stacked: matchMedia('(max-width:700px), (max-aspect-ratio:4/5)').matches}; })()""")
            if not grain: failures.append(f"{name}: reus.paisaje() is missing (the landscape's px per window px)")
            elif grain["stacked"] and grain["g"] < 1.5 * grain["s"]: failures.append(f"{name}: landscape painted at {grain['g']:.2f} px per window px, expected ≥ {1.5 * grain['s']:.2f} on a stacked hero")
            elif not grain["stacked"] and grain["g"] > grain["s"]: failures.append(f"{name}: landscape painted at {grain['g']:.2f} px per window px on a wide hero (cost), expected ≤ {grain['s']:.2f}")
            failures += [f"{name}: JS error: {e}" for e in errors]
            await page.screenshot(path=str(shots / f"{name}.png"))
            print(f"{name}: name→{box['name']:.0f}px, window {box['winTop']:.0f}–{box['winBottom']:.0f}px, info→{box['info']:.0f}px")
            failures += [f"{name}: {e}" for e in await check_shelf(page, name)]
            failures += [f"{name}: {e}" for e in await check_motion(page, name)]
            failures += [f"{name}: {e}" for e in await check_return(page)]
            failures += [f"{name}: {e}" for e in await check_rhythm(page)]
            failures += [f"{name}: {e}" for e in await check_overlap(page)]
            failures += [f"{name}: {e}" for e in await check_fall(page)]
            failures += [f"{name}: {e}" for e in await check_wash(page, name)]
            failures += [f"{name}: {e}" for e in await check_backstage(page, name)]
            failures += [f"{name}: {e}" for e in await check_letters(page, name)]
            await page.close()
        failures += await check_sizes(browser)
        failures += [f"a11y: {e}" for e in await check_a11y(browser)]
        failures += [f"red: {e}" for e in await check_red(browser)]
        failures += [f"hero: {e}" for e in await check_hero(browser)]
        failures += [f"mesa: {e}" for e in await check_table_follows(browser)]
        failures += [f"reduced: {e}" for e in await check_still_window(browser)]
        # reduced motion: a still frame and every paper already in place
        page = await open_page(browser, viewport={"width": 1440, "height": 860}, reduced_motion="reduce")
        await page.goto(page_url); await page.wait_for_timeout(3000)
        failures += [f"reduced: {e}" for e in await check_motion(page, "reduced", reduced=True)]
        failures += [f"reduced: {e}" for e in await check_letters_reduced(page)]
        await page.close()
        await browser.close()
    if failures:
        print("FAIL\n  " + "\n  ".join(failures)); sys.exit(1)
    print("OK · screenshots in screenshots/")

asyncio.run(main())
