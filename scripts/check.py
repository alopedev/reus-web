"""Design checks for the hero, on desktop and mobile. Exits non-zero if a rule breaks.

Rules checked:
  1. The site name never overlaps the window (name bottom < window top).
  2. The departure block starts below the window (window bottom < info top).
  3. No JavaScript errors on load.
  4. Small text uses Literata; times use Young Serif.
  5. Below the hero, the shelf holds its three paper objects,
     uses the same two fonts and nothing sticks out sideways. The notebook opens onto a single page
     («Cómo se hizo»): four concepts, each with the technology behind it.
  6. Scrolling tilts the wall away; at the end the papers have landed and the notebook is open.
     While the gaze drops, the painting always fills the screen: nothing behind it ever shows,
     not even right after a sudden jump of the scroll.
     The wall leads and the table follows; the table touches down before the end of the first
     screen and bounces up a little; the wall's shade follows its angle, not the scroll.
     Each paper in the air casts its shadow farther and lighter than at rest; on the pinned table
     each paper starts falling before the previous one lands and the cover opens as the last one
     settles. While the wall turns, the watercolour is painted once per frame, never twice (`check.py pintado`).
     Scrolling back to the top undoes everything. While the table tilts in, its near edge (wider than the
     screen in perspective) never makes the page wider than the screen: a phone would zoom out and the hero, the
     table and the letters would drift apart (`check_drop_width`, also in `check.py letras`).
  7. The table is painted in watercolor once it arrives and carries its travel things
     (coffee, pen, Rodalies ticket); the page never scrolls sideways.
  8. Across 12 screen sizes (320 px, the reflow of WCAG 1.4.10, to 2560 px): nothing leaves the screen sideways, tickets are
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
     pairing must be exactly: C→Q, a→u, p→è, a→é, c→gap (fuses), a→s, s→gap, a→gap. Before the
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
     train shown changes (never on the 30 s refresh) and names its time; the ticket's arrows read «Canviar el sentit»; the recording shortcuts (R, P) work only with ?grabar in the URL; the
     «horari aproximat» note speaks impersonally. Modo rápido: `python3 scripts/check.py a11y`.
  14. The site reads the network timetable (data/red.json; the parity build, its frozen copy
     scripts/baseline/red.json): the back of the ticket credits «Origen de los datos: Renfe Operadora», as Renfe's
     licence asks, with the days the timetable covers, says the regionals' live delay shows and credits Renfe's live
     feed and Open-Meteo (CC BY 4.0). Modo rápido: `python3 scripts/check.py red`.
  15. The hero B (docs/plan.md, 28-09): the site is called «Capacasa» (title and h1) with the subtitle «El tren cap
     a casa, i el de tornada a Barcelona». One ticket, «Bitllet · Sants ▶▶▷ Reus»: the three arrows turn the trip around
     (the route reads «Reus → Sants», the live region names the new train, the focus stays on them); the stub carries
     the day of the train shown, printed in dot matrix. A board of
     two trips, the first to leave and the one after it, regional or AVE (from Camp de Tarragona: Reus is in the Baix
     Camp): «R15 10:03 el pròxim, en 3 min → 11:33», «R15 11:03 després → 12:33», «en X min» only on the train
     shown while live, the AVE says «des de/fins a Camp de Tarragona» under its arrival, no
     headings and no «Luego»/«Anterior»; the other trip is a button, and choosing one, AVE included, makes it the
     train shown. With no trains left today it shows tomorrow's first ones under «Avui ja no en queden · demà». The ruler of the day has one
     mark: every train is a tick, the AVE like the rest; the knob always stands on the train shown; «ara» is a
     thin line with its word, with no «Son las HH:MM» heading; away from now a station clock stands on that line in
     place of the word and goes back to now; the arrow
     keys step through every train, AVE included. From Reus in the evening, when no regional is left but an AVE
     from Camp de Tarragona is, that AVE is the train shown and tomorrow's first regional follows it, marked «demà».
     The ticket's town (`.tk .town`) opens a native `#selp` dialog (docs/spec-3.3.md): step 1 lists the four
     corridor groups (R11, R13, R14, R16) with their line pills; step 2 lists a group's stops in real order, the
     ramal after the main line's; choosing a stop closes the dialog, moves the board and ruler to it, and returns
     the focus to the ticket. Modo rápido: `python3 scripts/check.py hero`.
  16. The travel things and the painted table follow the papers when these settle after the table was first
     measured (the web fonts arriving late): once the papers' text reflows, everything sits where measuring afresh
     puts it, on desktop and mobile. Modo rápido: `python3 scripts/check.py mesa`.
  17. Sharing the link shows a preview (LinkedIn, X, WhatsApp): dist/index.html carries a description, the Open Graph
     tags and a large X card; og:image is an absolute URL on the published site whose file ships in dist/, its size
     matches og:image:width/height (1200 × 630) and it stays light (< 1 MB). Modo rápido: `python3 scripts/check.py compartir`.
Also saves screenshots to screenshots/ for a visual review.

Needs: pip install playwright && playwright install chromium
Usage: npm run build && npm run build:paridad && python3 scripts/check.py [paridad|letras|a11y|red|hero|mesa|pintado]   (or: npm run check)
       (paridad: only check 10, in a minute; letras: only check 11, on desktop and mobile, in a minute; a11y: only check 13; red: only check 14;
        hero: only check 15; mesa: only check 16; compartir: only check 17, in a second; pintado: only the one-paint-per-frame part of check 6)
"""
import asyncio, functools, html.parser, http.server, io, json, os, pathlib, re, sys, threading
import urllib.parse
import xml.etree.ElementTree as ET
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

# «Com llegir-la» (Àlex 11-10, option C): what each piece of the hero means, in the words of both phone and desktop
LEAFLET = ["El pròxim tren. D’aquí, a comprar-lo a Renfe.",
           "Toca el poble o l’estació per canviar-los; les fletxes giren el sentit.",
           "El de després. Toca’l per triar-lo.",
           "El dia: cada ratlla, un tren; la boleta, el que mires; el taronja, ara.",
           "Si mires un altre tren, et torna a ara."]

async def check_shelf(page, name):
    """The shelf below the hero: the page scrolls (no written hint since 09-10: fewer words on the wall), the three
    paper objects, nothing sticking out sideways."""
    errs = []
    if await page.evaluate("!!document.querySelector('#more')"): errs.append("«Què és i com s’ha fet» is back in the hero (removed 09-10)")
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
        concepts: items.map(li => [...li.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim()),
        extra: [...document.querySelectorAll('#cuaderno .tachado, #cuaderno .lema, #cuaderno .izq h2, #cuaderno .izq li')].length};
      // the leaflet is a legend (Àlex 11-10, option C): each line opens with the piece of the hero it explains, drawn
      // as on the wall and hidden from the reader, who hears the words
      const rows = [...document.querySelectorAll('#folleto li')];
      const leaflet = {drawing: !!q('#folleto .mini'), keys: rows.filter(li => li.querySelector('.clau[aria-hidden="true"]')).length,
        words: rows.map(li => li.querySelector('.que')?.textContent.trim())};
      return {missing, wide, sideways, notebook, leaflet, heading: q('#qe') ? f(q('#qe')) : null, body: q('#repisa p') ? f(q('#repisa p')) : null};
    })()""")
    if shelf["missing"]: errs.append(f"shelf is missing {', '.join(shelf['missing'])}")
    if shelf["sideways"]: errs.append("the page scrolls sideways")
    nb = shelf["notebook"]
    # three concepts since 11-10 (Àlex): the landscape, the daily timetable and the checks, each with what makes it
    if nb["items"] != 3 or nb["bare"]: errs.append(f"the notebook's page should list 3 concepts, each with its technology ({nb['items']} listed, {nb['bare']} without one)")
    if nb["concepts"] != ["Un paisatge en 3D, pintat en directe", "Horaris de Renfe, al dia cada matí", "Provat a cada canvi"]:
        errs.append(f"the notebook lists {nb['concepts']}")
    if nb["extra"]: errs.append("the notebook still has crossed-out words, the motto or a second page of content")
    lf = shelf["leaflet"]
    if lf["drawing"] or lf["keys"] != len(LEAFLET) or lf["words"] != LEAFLET:
        errs.append(f"the leaflet should be the legend of the hero's pieces ({lf['keys']} keys, drawing: {lf['drawing']}): {lf['words']}")
    try:
        await page.wait_for_function("document.getElementById('lienzo')?.dataset.pintada === '1'", timeout=12000)
        px = await page.evaluate("""(() => { const c = document.getElementById('lienzo'), g = c.getContext('webgl'), p = new Uint8Array(4);
          g.readPixels(c.width >> 1, c.height >> 1, 1, 1, g.RGBA, g.UNSIGNED_BYTE, p); return p[0] + p[1] + p[2]; })()""")
        if px > 600: errs.append("the table is still bare paper")
    except Exception:
        errs.append("the table never gets painted")
    if shelf["wide"]: errs.append(f"shelf sticks out sideways: {', '.join(shelf['wide'])}")
    if shelf["heading"] and shelf["heading"] != "Young Serif": errs.append(f"shelf heading font is {shelf['heading']}")
    if shelf["body"] and shelf["body"] != "Literata": errs.append(f"shelf text font is {shelf['body']}")
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

async def steady_reading(page, spots, wall=False):
    """Brightness at spots of the screen, read once two screenshots in a row agree (within 3): on the CI's software
    rendering a screenshot can still hold an older frame, half painted or before the wash caught up with the hinge
    (21-10: «no wash at the hinge» at 74 → 67 on the desktop, a resting wall read 33 instead of 65 on the phone).
    With `wall`, the spots are the wall's own and go through its tilt (WALL_AT)"""
    last = None
    for _ in range(8):
        img = Image.open(io.BytesIO(await page.screenshot())).convert("RGB")
        at = await page.evaluate(f"({WALL_AT})({spots})") if wall else spots
        now = [brightness(img, xy) for xy in at]
        if last and max(abs(a - b) for a, b in zip(now, last)) <= 3: return now
        last = now; await page.wait_for_timeout(500)
    return last

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
    base = await steady_reading(page, [near, far])
    seen = {}
    for f in (.3, .7):
        await at(f)
        seen[f] = await steady_reading(page, [near, far], wall=True)
        if await page.evaluate("+getComputedStyle(document.getElementById('sombra')).opacity > 0"): errs.append(f"the flat #sombra veil darkens the wall at {f:.0%} although WebGL paints it")
    if not seen[.3][0] < base[0] - 8: errs.append(f"no wash at the hinge at 30% ({base[0]:.0f} → {seen[.3][0]:.0f})")
    if abs(seen[.3][1] - base[1]) > 10: errs.append(f"the wash already covers the top of the wall at 30% ({base[1]:.0f} → {seen[.3][1]:.0f})")
    if not seen[.7][1] < base[1] - 8: errs.append(f"the wash does not climb the wall: its top is still bare at 70% ({base[1]:.0f} → {seen[.7][1]:.0f})")
    if await page.evaluate("getComputedStyle(document.querySelector('.stage')).filter") == "none": errs.append("the texts on the wall do not dim with the wash at 70%")
    await at(0)
    back = await steady_reading(page, [near, far])
    if max(abs(back[0] - base[0]), abs(back[1] - base[1])) > 10: errs.append(f"the wash leaves a trace back at the top ({base[0]:.0f}/{base[1]:.0f} → {back[0]:.0f}/{back[1]:.0f})")
    return errs

# every draw onto the screen of the landscape's canvas (#gl), keyed by the frame it belongs to: the document
# timeline's time stands still for the whole of one rendering update (scroll events, animation frames, observers)
SCREEN_DRAWS = """window.__pasadas = [];
for (const P of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype]) for (const fn of ['drawElements', 'drawArrays']) {
  const draw = P[fn];
  P[fn] = function(...a) { if (this.canvas.id === 'gl' && !this.getParameter(this.FRAMEBUFFER_BINDING)) __pasadas.push(document.timeline.currentTime); return draw.apply(this, a); };
}"""

async def check_one_paint(page):
    """While the wall turns away, the watercolour is painted once per frame: the landscape's loop paints it with
    the wash it has, and the wash only paints on its own in a frame the loop leaves alone. Painted twice, every
    frame of the transition costs a second full-screen pass of the most expensive shader (rendimiento, 11-10).
    Needs SCREEN_DRAWS as an init script; the landscape must be moving (no reduced motion)."""
    if not await page.evaluate("!!document.getElementById('gl')"): return []
    await page.evaluate("scrollTo({top: 0, behavior: 'instant'})"); await hinge_caught_up(page)
    await page.evaluate("__pasadas = []")
    for i in range(1, 25):
        await page.evaluate(f"scrollTo({{top: reus.hingeAt(0) * {i / 30}, behavior: 'instant'}})")
        await page.wait_for_timeout(120)
    await hinge_caught_up(page); await page.wait_for_timeout(500)
    frames = {}
    for t in await page.evaluate("__pasadas"): frames[t] = frames.get(t, 0) + 1
    twice = sum(1 for n in frames.values() if n > 1)
    await page.evaluate("scrollTo({top: 0, behavior: 'instant'})"); await hinge_caught_up(page)
    if not frames: return ["no watercolour painted while the wall turns away"]
    return [f"the watercolour is painted more than once in {twice} of {len(frames)} frames while the wall turns away"] if twice else []

# every shader program linked on the landscape's canvas (#gl), and when, against its first draw
SHADER_LINKS = """window.__enlaces = []; window.__primerDibuix = null;
for (const P of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype]) {
  const link = P.linkProgram;
  P.linkProgram = function(...a) { if (this.canvas.id === 'gl') __enlaces.push(performance.now()); return link.apply(this, a); };
  for (const fn of ['drawElements', 'drawArrays']) { const draw = P[fn];
    P[fn] = function(...a) { if (this.canvas.id === 'gl' && __primerDibuix === null) __primerDibuix = performance.now(); return draw.apply(this, a); }; }
}"""

async def check_shaders_ready(page):
    """Every shader the landscape's canvas will need is ready before it draws its first frame: none is compiled in
    the middle of the board's flaps (the copy of the kept wall, when the paint-in ends) or of the first turn to the
    table (the wash). Compiling the watercolour shader stops the page for over a second on a modest phone
    (rendimiento/movil.md, 30-10). Needs SHADER_LINKS as an init script; the landscape must be moving."""
    if not await page.evaluate("!!document.getElementById('gl')"): return []
    await page.evaluate("scrollTo({top: 0, behavior: 'instant'})"); await hinge_caught_up(page)
    for i in (8, 15, 22, 30):
        await page.evaluate(f"scrollTo({{top: reus.hingeAt(0) * {i / 30}, behavior: 'instant'}})"); await hinge_caught_up(page)
    await page.evaluate("scrollTo({top: 0, behavior: 'instant'})"); await hinge_caught_up(page)
    late = await page.evaluate("__enlaces.filter(t => __primerDibuix !== null && t > __primerDibuix).length")
    return [f"{late} shader program(s) compiled after the landscape's first frame (a stall mid-animation)"] if late else []

async def check_still_idle(browser):
    """With reduced motion nothing moves, so a page left alone asks for no animation frames: each one wakes the
    phone's main thread for nothing (ScrollTrigger asked for 64 a second, rendimiento/movil.md, 30-10)."""
    errs = []
    for name, (w, h) in VIEWPORTS.items():
        page = await open_page(browser, viewport={"width": w, "height": h}, reduced_motion="reduce")
        await page.goto(page_url); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(4000)
        n = await page.evaluate("""new Promise(done => { let n = 0; const raf = window.requestAnimationFrame;
          window.requestAnimationFrame = cb => { n++; return raf.call(window, cb); };
          setTimeout(() => { window.requestAnimationFrame = raf; done(n); }, 3000); })""")
        await page.close()
        if n > 3: errs.append(f"{name}: {n} animation frames asked in 3 s with reduced motion and nobody touching the page")
    return errs

# --- Fase 3 · el viaje de letras (h1.brand -> h2#qe) --------------------------------------------------------
# The pairing for the site's name: chip i is the i-th letter of NAME (source order is preserved on the wall side);
# QE_TARGET[i] is which character of "Què és" it lands on (index 3 is the space, where the three chips with no
# letter to become fuse instead). See docs/referencias/viaje-letras.md.
NAME = "Capacasa"
QE_TARGET = [0, 1, 2, 4, 3, 5, 3, 3]
# the journey's stagger, from the approved prototype (docs/referencias/viaje-letras.md, "Movimiento"): letter i
# lifts off at roughly this progress
def letters_start(i): return .06 + i * .035

CHIP_RECT = """(i => { const chips = document.querySelectorAll('#letras .ficha'); const el = chips[i]; if(!el) return null;
  const b = el.getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2}; })"""
# the on-screen box of the i-th character of an element's text, over all its text nodes in order (h1.brand has a
# span per cell of its board, h2#qe one text node), through whatever transform its ancestors currently carry
# (the wall's or the table's tilt)
GLYPH_RECT = """((sel, i) => { const el = document.querySelector(sel); if(!el) return null;
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node = walk.nextNode();
  while(node && i >= node.length){ i -= node.length; node = walk.nextNode(); }
  if(!node || i < 0) return null;
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
    sin pareja (nombre más corto) aparecen solas con un fundido corto. Con 'Capacasa' -> 'Què és' debe dar
    exactamente: C->Q, a->u, p->è, a->é, c->hueco (se funde), a->s, s->hueco, a->hueco.
    reus.letras.state(p) debe existir también: es la función pura que usan el resto de los checks."""
    ok = await page.evaluate("""() => !!(window.reus && window.reus.letras
      && typeof window.reus.letras.pair === 'function' && typeof window.reus.letras.state === 'function')""")
    if not ok: return ["reus.letras.pair/state is missing"]
    errs = []
    proto = await page.evaluate("() => window.reus.letras.pair('Capacasa', 'Què és')")
    got = [[it.get("from"), it.get("to")] for it in proto] if isinstance(proto, list) and all(isinstance(it, dict) for it in proto) else None
    expected = [["C", "Q"], ["a", "u"], ["p", "è"], ["a", "é"], ["c", None], ["a", "s"], ["s", None], ["a", None]]
    if got != expected: errs.append(f"pair('Capacasa','Què és') = {got}, expected {expected}")
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
    errs += await rule("Bea", "Què és")           # shorter than the name: some target letters appear alone
    errs += await rule("Alexandra", "Què és")     # longer than the name: excess source letters fuse in the gap
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
    transforms of #hero/#repisa, within 3 px. Uses the pairing of NAME -> 'Què és' (QE_TARGET)."""
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

async def check_drop_width(browser):
    """While the table tilts in, the page never gets wider than the screen. In perspective the table's near edge is
    wider than the screen; if that counts as page width, a phone widens its layout viewport (innerWidth grows, iOS
    zooms out): the fixed wall then fills the wider viewport while the table keeps the screen's width, and the
    letters, measured on the old width, fly off their glyphs (Àlex's iPhone, 10-10). Mobile emulation (is_mobile)
    reproduces that widening in Chromium."""
    errs = []
    for name, opts in {"phone": dict(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, device_scale_factor=3),
                       "desktop": dict(viewport={"width": 1440, "height": 900})}.items():
        page = await open_page(browser, **opts)
        await page.goto(page_url); await hero_settled(page)
        w0 = await page.evaluate("innerWidth")
        wide = []
        for f in (.03, .06, .12, .24, .36, .6):
            await page.evaluate(f"scrollTo({{top: {f} * reus.hingeAt(0), behavior: 'instant'}})")
            await hinge_caught_up(page)
            m = await page.evaluate("({sw: document.scrollingElement.scrollWidth, iw: innerWidth, p: reus.dropped()})")
            if m["sw"] > w0 + 1 or m["iw"] != w0: wide.append(f"p={m['p']:.2f} (page {m['sw']} px, viewport {m['iw']} px)")
        if wide: errs.append(f"{name}: the page gets wider than the {w0} px screen while the table tilts in: {', '.join(wide)}")
        await page.close()
    return errs

async def check_letters_suite(browser):
    """Quick mode: only the letters' journey checks, on desktop and mobile (like paridad)."""
    failures = await check_drop_width(browser)
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

# the departure board's cells never overlap (on a 320 px phone the big time ran over «en 13 min · sense dades» and its arrow)
BOARD_OVERLAP = """(() => { const errs = [];
  // the ink, not the grid cell: a cell that does not wrap spills out of its box
  const ink = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  document.querySelectorAll('#board .trip').forEach(row => { const cells = [...row.children].filter(c => ink(c).width);
    cells.forEach((a, i) => cells.slice(i + 1).forEach(b => { const x = ink(a), y = ink(b);
      // a line's box is taller than its letters: stacked cells (the AVE's «fins a Camp de Tarragona» under its arrival) share
      // a sliver that grows with the root (3 px at 1440, 5 at 2560), so they must share a third of the shorter one to collide
      if(Math.min(x.right, y.right) - Math.max(x.left, y.left) > 4 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > Math.min(x.height, y.height) / 3)
        errs.push(`board cells overlap: «${a.textContent.trim()}» and «${b.textContent.trim()}»`); })); });
  return errs; })()"""
SIZES = {"320x568": (320, 568), "360x740": (360, 740), "390x844": (390, 844), "430x932": (430, 932), "768x1024": (768, 1024), "1000x1300": (1000, 1300),
         "1024x768": (1024, 768), "900x900": (900, 900), "1280x720": (1280, 720), "1366x768": (1366, 768), "1440x900": (1440, 900), "1920x1080": (1920, 1080), "2560x1440": (2560, 1440)}
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
  // (a phone held sideways has two columns instead: check_landscape)
  const sideways = matchMedia('(orientation:landscape) and (max-height:500px)').matches;
  if(matchMedia('(max-width:700px), (max-aspect-ratio:4/5)').matches && !sideways){
    const st = q('#stage'), cs = getComputedStyle(st), inner = st.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const win = q('#win').getBoundingClientRect(), rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    // the glass leaves 1.1rem on each side for its frame
    if(win.width < inner - 2.2 * rem - 1) errs.push(`window only ${Math.round(win.width)} of ${Math.round(inner - 2.2 * rem)} px wide on the stacked hero`);
    const low = Math.max(...[...document.querySelectorAll('.tk')].map(t => t.getBoundingClientRect().bottom));
    if(low > win.top - .022 * innerHeight - 4) errs.push(`a ticket touches the window's frame (${Math.round(low)} vs frame at ${Math.round(win.top - .022 * innerHeight)})`);
  }
  // the ticket never lies over the name's board: a square window (between 4/5 and 1/1) once took the portrait root size
  // with the wide layout, and the ticket covered «CAPACASA»
  const brd = q('.tauler').getBoundingClientRect();
  document.querySelectorAll('.tk').forEach(t => { const b = t.getBoundingClientRect();
    if(b.left < brd.right - 1 && b.right > brd.left + 1 && b.top < brd.bottom - 1 && b.bottom > brd.top + 1) errs.push(`the ticket covers the name (${Math.round(b.left)} < ${Math.round(brd.right)})`); });
  errs.push(...""" + BOARD_OVERLAP + """);
  const pages = [...document.querySelectorAll('.cuaderno .hoja')].map(h => h.offsetWidth); if(Math.min(...pages) < 240) errs.push(`notebook page only ${Math.min(...pages)} px wide`);
  const esc = q('.escena'), mesa = q('.mesa');
  if(getComputedStyle(esc).position === 'sticky' && mesa.offsetTop + mesa.offsetHeight > esc.clientHeight - 40)
    errs.push(`pinned table does not fit: content ends at ${mesa.offsetTop + mesa.offsetHeight} of ${esc.clientHeight}`);
  // like a poster: proportional to the screen, never below a legible floor
  const ref = Math.min(innerWidth, innerHeight * 1.6), brand = parseFloat(getComputedStyle(q('.brand')).fontSize);
  const expected = 4.1 * Math.max(14, ref * .01111);
  if(innerWidth > innerHeight && !sideways && Math.abs(brand - expected) / expected > .05) errs.push(`hero does not scale: name is ${Math.round(brand)} px for a ${Math.round(ref)} px screen`);
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

# the travel things on the table and every line of the papers' text, in viewport pixels: each thing by its own
# drawing (the ticket's card, the cup's saucer, the pen's barrel), each line by its text's client rects
THINGS_AND_TEXT = """(() => {
  const things = {cafe: '#cafe svg', boli: '#boli svg', rodalies: '#rodalies .rodalies'};
  const box = r => [r.left, r.top, r.right, r.bottom];
  const out = {things: {}, text: []};
  // each thing's four corners as drawn (the things are turned): read from probes pinned to its corners
  for(const [k, s] of Object.entries(things)){ const el = document.querySelector(s); if(!el || el.closest('[hidden]')) continue;
    const pos = getComputedStyle(el).position === 'static' ? (el.style.position = 'relative', true) : false;
    out.things[k] = [[0, 0], [100, 0], [100, 100], [0, 100]].map(([x, y]) => { const i = document.createElement('i');
      i.style.cssText = `position:absolute;left:${x}%;top:${y}%;width:0;height:0`; el.append(i);
      const r = i.getBoundingClientRect(); i.remove(); return [r.left, r.top]; });
    if(pos) el.style.position = ''; }
  const walk = document.createTreeWalker(document.querySelector('.mesa'), NodeFilter.SHOW_TEXT);
  for(let n; (n = walk.nextNode());){
    if(!n.textContent.trim() || n.parentElement.closest('[aria-hidden="true"], .sr, .tapa')) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    for(const q of r.getClientRects()) if(q.width > 1 && q.height > 1) out.text.push([n.textContent.trim().slice(0, 24), ...box(q)]);
  }
  return out; })()"""

def covers(quad, rect):
    """Whether a turned quadrilateral (four corners) and an upright rectangle overlap: they do unless some edge
    direction of either separates them (separating axes)."""
    l, t, r, b = rect; box = [(l, t), (r, t), (r, b), (l, b)]
    for poly in (quad, box):
        for i in range(4):
            (x0, y0), (x1, y1) = poly[i], poly[(i + 1) % 4]; nx, ny = y1 - y0, x0 - x1
            a = [nx * x + ny * y for x, y in quad]; c = [nx * x + ny * y for x, y in box]
            if max(a) <= min(c) or max(c) <= min(a): return False
    return True

async def check_things_clear(browser):
    """On a phone the papers stack in one column and the travel things go in the gaps between them, never over their
    text (table.ts: «things go in the gaps, never over the text»): on 320 and 360 px phones the Rodalies ticket covered
    «Revers del bitllet», and there it is left off. Read once the table has settled, at every phone width check.py knows."""
    errs = []
    # on the narrowest phones the Rodalies ticket is left off the table (option B, Àlex 12-10); from 390 px it lies there
    for name, (w, h), ticket in [("320x568", (320, 568), False), ("360x740", (360, 740), False), ("390x844", (390, 844), True), ("430x932", (430, 932), True)]:
        page = await open_page(browser, viewport={"width": w, "height": h}, reduced_motion="reduce")
        await page.goto(page_url); await page.evaluate("document.fonts.ready")
        await page.evaluate("scrollTo({top: document.scrollingElement.scrollHeight, behavior: 'instant'})")
        try: await page.wait_for_function("document.getElementById('lienzo')?.dataset.pintada === '1'", timeout=12000)
        except Exception: errs.append(f"{name}: the table never gets painted"); await page.close(); continue
        await page.wait_for_timeout(500); await table_sized(page)
        seen = await page.evaluate(THINGS_AND_TEXT); await page.close()
        if ("rodalies" in seen["things"]) != ticket: errs.append(f"{name}: the Rodalies ticket is {'missing from' if ticket else 'still on'} the table")
        for k, quad in seen["things"].items():
            for text, tl, tt, tr, tb in seen["text"]:
                if covers(quad, (tl + 1, tt + 1, tr - 1, tb - 1)): errs.append(f"{name}: #{k} covers «{text}»")
    return errs

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

# counts the painted table's draws (its own WebGL context on #lienzo), from before the page's scripts run
COUNT_TABLE_DRAWS = """(() => { window.__mesaDraws = 0; const draw = WebGLRenderingContext.prototype.drawArrays;
  WebGLRenderingContext.prototype.drawArrays = function(...a){ if(this.canvas && this.canvas.id === 'lienzo') window.__mesaDraws++; return draw.apply(this, a); }; })()"""

# every frame as painted (read in a task right after it, before the next frame's scroll event): where the wall's hinge
# sits (the hero's transform-origin) against where the table's edge is for the scroll. Apart, the page shows between them
HINGE_LAG = """window.__hingeLag = [];
  const look = () => { const h = document.getElementById('hero'); if(!h || !window.reus || !h.style.transform) return;
    const off = Math.abs(parseFloat(h.style.transformOrigin.split(' ')[1]) - reus.hingeAt(reus.dropped()));
    if(off > 1) window.__hingeLag.push(off); };
  const tick = () => { setTimeout(look, 0); requestAnimationFrame(tick); }; requestAnimationFrame(tick);"""

async def check_magnet(browser):
    """Let go halfway through the turn and the page finishes it (option 2, Àlex 20-10): on in the direction the
    gesture was going, never resting with the wall half turned and the letters in the air; a nudge at either end is
    not a turn and goes back (magnet.ts, whose rule npm test checks). With real gestures: the wheel on a desk, a
    finger on a phone. Below the turn, reading the table, nothing moves; with reduced motion there is no turn."""
    errs = []
    WHERE = "Math.round(reus.dropped() * 1000) / 1000"
    async def rests(page):
        # the page has stopped: the same scroll for three seconds (software rendering gives a frame or two a second,
        # so a snap can take a while to start)
        last, same = None, 0
        for _ in range(60):
            y = await page.evaluate("scrollY")
            same = same + 1 if y == last else 0
            if same >= 6: return await page.evaluate(WHERE)
            last = y; await page.wait_for_timeout(500)
        return await page.evaluate(WHERE)
    async def gesture(page, cdp, to, touch):
        # from where the page is to a share of the turn, then let go. Programmatic scrolls are not gestures: the page
        # leaves them where they put it. The wheel through Input.synthesizeScrollGesture; a finger as raw touch events
        # (synthesizeScrollGesture does not scroll a phone here), slowly, so it does not fling on
        y, top, w, h = await page.evaluate("[scrollY, reus.hingeAt(0), innerWidth, innerHeight]")
        dy = top * to - y
        if not touch:
            await cdp.send("Input.synthesizeScrollGesture", {"x": w / 2, "y": h / 2, "yDistance": -dy, "speed": 400,
                "gestureSourceType": "mouse", "preventFling": True})
            return
        x, y0 = w / 2, h / 2 + dy / 2
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y0}]})
        for i in range(1, 21):
            await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x, "y": y0 - dy * i / 20}]})
            await page.wait_for_timeout(40)
        await page.wait_for_timeout(300)
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    for name, opts in {"1440x900": dict(viewport={"width": 1440, "height": 900}),
                       "390x844": dict(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)}.items():
        page = await open_page(browser, **opts); cdp = await page.context.new_cdp_session(page)
        await page.add_init_script(HINGE_LAG)
        await page.goto(page_url); await page.wait_for_timeout(9000); await hero_settled(page)
        for label, start, to, want in (("down to 35%", 0, .35, 1), ("down a nudge (5%)", 0, .05, 0),
                                       ("up from the table to 65%", 1, .65, 0), ("up a nudge from the table (95%)", 1, .95, 1)):
            await page.evaluate(f"scrollTo({{top: reus.hingeAt(0) * {start}, behavior: 'instant'}})"); await page.wait_for_timeout(1500)
            await gesture(page, cdp, to, "is_mobile" in opts)
            p = await rests(page)
            if abs(p - want) > .002: errs.append(f"{name}: let go {label}, the page rests at {p:.0%} of the turn (expected {want:.0%})")
            lag = await page.evaluate("window.__hingeLag.splice(0)")
            if lag: errs.append(f"{name}: let go {label}, {len(lag)} frames show the wall's hinge away from the table's edge "
                                f"(up to {max(lag):.0f} px: the page shows behind them)")
        # a scroll the page's code makes (a link, a check), not a hand, is left where it put the page
        await page.wait_for_timeout(3500)
        await page.evaluate("scrollTo({top: reus.hingeAt(0) * .5, behavior: 'instant'})")
        p = await rests(page)
        if abs(p - .5) > .002: errs.append(f"{name}: a scroll by the page's code to 50% of the turn moves on its own to {p:.0%}")
        # below the turn, the table is read as it is
        await page.evaluate("scrollTo({top: reus.hingeAt(0) * 1.4, behavior: 'instant'})"); await page.wait_for_timeout(300)
        await gesture(page, cdp, 1.6, "is_mobile" in opts)
        y0 = await page.evaluate("scrollY"); await page.wait_for_timeout(2500)
        if await page.evaluate("scrollY") != y0: errs.append(f"{name}: reading the table below the turn, the page moves on its own")
        await page.close()
    page = await open_page(browser, viewport={"width": 1440, "height": 900}, reduced_motion="reduce"); cdp = await page.context.new_cdp_session(page)
    await page.goto(page_url); await page.wait_for_timeout(3000)
    await gesture(page, cdp, .4, False)
    p = await rests(page)
    if abs(p - .4) > .02: errs.append(f"reduced motion: let go at 40%, the page moves on its own to {p:.0%}")
    await page.close()
    return errs

async def check_table_at_load(browser):
    """At load the table is out of sight under the hero (the wall covers the screen until you scroll), yet it gets
    painted then, while the landscape is being painted. Nobody can see it: it is painted at once, in a draw or two
    (a second if the papers settle when the fonts arrive), never animated frame after frame alongside the landscape."""
    errs = []
    for name, (w, h) in {"1440x900": (1440, 900), "390x844": (390, 844)}.items():
        page = await open_page(browser, viewport={"width": w, "height": h})
        await page.add_init_script(COUNT_TABLE_DRAWS)
        await page.goto(page_url)
        try: await page.wait_for_function("document.getElementById('lienzo')?.dataset.pintada === '1'", timeout=12000)
        except Exception: errs.append(f"{name}: the table never gets painted at load"); await page.close(); continue
        await page.wait_for_timeout(5000)   # past the 3.4 s an animated paint-in would take
        draws, y = await page.evaluate("[window.__mesaDraws, scrollY]")
        # a resize that leaves the table its size (iOS Safari's toolbar, which shrinks mid-transition) repaints nothing
        await page.evaluate("dispatchEvent(new Event('resize'))"); await page.wait_for_timeout(800)
        again = await page.evaluate("window.__mesaDraws"); await page.close()
        if y: errs.append(f"{name}: the page scrolled to {y} on its own (the check proves nothing)"); continue
        if draws > 2: errs.append(f"{name}: the hidden table is drawn {draws} times at load; painted at once it takes 1 or 2")
        if again > draws: errs.append(f"{name}: a resize that leaves the table its size repaints it ({again - draws} draws)")
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

# phones held sideways: short and wide, a desktop's proportions without its height
LANDSCAPE = {"844x390": (844, 390), "667x375": (667, 375), "932x430": (932, 430)}

async def check_landscape(browser):
    """A phone held sideways keeps the window painted and readable (option A, Àlex 12-10): two columns, the window
    on the left as tall as the screen allows, the name, the ticket, the board and the ruler on the right. Before, the
    window shrank to a slit (844 x 390: 0 px; 667 x 375: a strip) and the ticket covered the name's board. Its rows
    are the phone's (a button per trip, «›»), and the train's sheet fits the screen: its two buttons can be reached."""
    errs = []
    for name, (w, h) in LANDSCAPE.items():
        page = await open_page(browser, viewport={"width": w, "height": h}, reduced_motion="reduce", is_mobile=True, has_touch=True, device_scale_factor=2)
        await page.goto(page_url); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(1500)
        # the hero's part of FIT: the table's notebook, two pages of 226 px at 932 x 430, reads well and is not this check's
        errs += [f"{name}: {e}" for e in await page.evaluate(FIT) if not e.startswith("notebook page")]
        g = await page.evaluate("""(() => { const r = s => document.querySelector(s).getBoundingClientRect().toJSON();
          return {win: r('#win'), brd: r('.tauler'), tk: r('.tk'), info: r('#info'), hours: r('.hours'), phone: !!document.querySelector('#board button.big')}; })()""")
        win, brd, tk, info = g["win"], g["brd"], g["tk"], g["info"]
        if g["hours"]["bottom"] > h: errs.append(f"{name}: the ruler's hours leave the screen ({g['hours']['bottom']:.0f} > {h})")
        if win["height"] < .55 * h: errs.append(f"{name}: the window is {win['height']:.0f} px tall, under 55% of the screen")
        if win["width"] < .35 * w: errs.append(f"{name}: the window is {win['width']:.0f} px wide, under 35% of the screen")
        meet = lambda a, b: min(a["right"], b["right"]) - max(a["left"], b["left"]) > 0 and min(a["bottom"], b["bottom"]) - max(a["top"], b["top"]) > 0
        for n1, a, n2, b in [("the ticket", tk, "the name's board", brd), ("the name's board", brd, "the window", win),
                             ("the ticket", tk, "the window", win), ("the board", info, "the window", win), ("the ticket", tk, "the board", info)]:
            if meet(a, b): errs.append(f"{name}: {n1} overlaps {n2}")
        # its small window is painted twice as fine, as upright (Àlex 21-10): with a desktop's grain the strokes read as pixels
        k = await page.evaluate("window.reus.paisaje ? reus.paisaje() : null")
        if k is None or k < 1.5 * 1.25: errs.append(f"{name}: landscape painted at {k} px per window px, expected ≥ {1.5 * 1.25:.2f} on a phone held sideways")
        if not g["phone"]: errs.append(f"{name}: the board's rows are not the phone's (no button for the big train)")
        else:
            await page.tap("#board button.big"); await page.wait_for_timeout(800)
            for sel in ["#detalle .comprar", "#detalle .avisa"]:
                loc = page.locator(sel)
                try: await loc.scroll_into_view_if_needed(timeout=3000)
                except Exception: pass
                b = await loc.bounding_box()
                if not b or b["y"] < 0 or b["y"] + b["height"] > h: errs.append(f"{name}: {sel} cannot be reached in the train's sheet")
        await page.close()
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
    """A page with generous timeouts: software rendering on a two-core CI machine can take long to give a frame.
    Open-Meteo is never asked: the window keeps fair weather, so no check depends on the real weather
    (check_weather answers for it). Nor are the lines' notices (/api/avisos, a Vercel function): check_avisos answers;
    Renfe's live delays (/api/retards) answer every train on time; check_retards answers its own."""
    page = await browser.new_page(**options); page.set_default_timeout(120000)
    await page.route("https://api.open-meteo.com/**", lambda route: route.abort())
    await page.route("**/api/avisos", lambda route: route.abort())
    await page.route("**/api/retards", on_time)
    return page

def _on_time_answer():
    """/api/retards for every check but check_retards: every train of both timetables running on time, which says
    nothing, so no other check meets the live delay. (No answer at all would read «sense dades en directe encara».)
    Read far in the future, so it is fresh at whatever time a check fixes the clock to."""
    import json, re
    numbers = set()
    for f in ("data/red.json", "scripts/baseline/red.json"):
        for t in json.loads((root / f).read_text())["trenes"]:
            m = re.match(r"^\d{4}[A-Z](\d+)[A-Z]", t["n"]); numbers.add(m.group(1) if m else t["n"])
    return json.dumps({"llegit": "2100-01-01T00:00:00Z", "trens": {n: {"estat": "circula", "retard": 0, "parada": ""} for n in numbers}})
ON_TIME = None
async def on_time(route):
    global ON_TIME
    ON_TIME = ON_TIME or _on_time_answer()
    await route.fulfill(status=200, content_type="application/json", body=ON_TIME)
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

# visible text not inside a landmark (main, a named region…); modal sheets are left out: they take over the page when open
OUTSIDE_LANDMARKS = """(() => {
  const lm = 'main,header,footer,nav,aside,dialog,[role=main],[role=banner],[role=contentinfo],[role=navigation],[role=complementary],' +
    '[role=region][aria-label],[role=region][aria-labelledby],section[aria-label],section[aria-labelledby]';
  const out = [], walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for(let n; (n = walk.nextNode());){
    const el = n.parentElement;
    if(!n.textContent.trim() || el.closest('script,style,[aria-hidden=true]') || el.closest(lm)) continue;
    const box = el.getBoundingClientRect(); if(!box.width && !box.height && !el.closest('.sr')) continue;
    out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} «${n.textContent.trim().slice(0, 30)}»`);
  }
  return out.slice(0, 4);
})()"""

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
    # every text a screen reader can reach sits in a landmark, so jumping between regions finds the trains too
    loose = await page.evaluate(OUTSIDE_LANDMARKS)
    if loose: errs.append(f"text outside any landmark: {' | '.join(loose)}")
    label = await page.evaluate("document.querySelector('.tk .swap')?.getAttribute('aria-label') || ''")
    if not label.startswith("Canviar el sentit"): errs.append(f"the ticket's → reads «{label}», expected «Canviar el sentit…»")
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
    if not note: errs.append("a day beyond the timetable shows no «horari aproximat» note")
    elif any(w in note.lower().split() for w in ("tinc", "tenim", "jo")): errs.append(f"the note speaks in the first person: «{note}»")
    await page.close()
    # with reduced motion the wall never turns, but the table still covers the fixed hero: the keyboard must not reach
    # its controls there (Shift+Tab from «Privacitat» once landed on the ruler, out of sight)
    for w, h in ((1280, 800), (390, 844)):
        page = await open_page(browser, viewport={"width": w, "height": h}, reduced_motion="reduce")
        await page.goto(parity_url); await page.wait_for_timeout(1500)
        await page.evaluate("scrollTo({top: document.scrollingElement.scrollHeight, behavior: 'instant'})"); await page.wait_for_timeout(500)
        if await page.evaluate("getComputedStyle(document.getElementById('hero')).visibility") != "hidden":
            errs.append(f"{w}x{h}, reduced motion, at the table: the hero under it can still take the focus")
        # the table's still frame can hold the page's first scroll back up for a second under software rendering: wait
        # for the hero, not for a fixed time (it once took 1.1 s at 1280 x 800)
        await page.evaluate("scrollTo({top: 0, behavior: 'instant'})")
        try: await page.wait_for_function("getComputedStyle(document.getElementById('hero')).visibility !== 'hidden'", timeout=5000)
        except Exception: errs.append(f"{w}x{h}, reduced motion, back at the top: the hero stays hidden")
        await page.close()
    return errs

async def check_firma(browser):
    """The site is signed (11-10, option A of three): the inside of the notebook's cover carries «Àlex Olivé» with a
    raised link to alope.dev (new tab) and a «Privacitat» button that opens a cut sheet, short (Àlex, 11-10): no cookies,
    no sign-up, hosted on Vercel, the weather from Open-Meteo; Esc closes it and the focus goes back to the button. Claude is
    not named on the page (D2). Desktop and phone. Modo rápido: `python3 scripts/check.py firma`."""
    errs = []
    for name, (w, h) in {"escritorio": (1440, 900), "movil": (390, 844)}.items():
        page = await open_page(browser, viewport={"width": w, "height": h}, reduced_motion="reduce", has_touch=w < 600)
        await page.goto(page_url); await page.wait_for_timeout(1500)
        await page.evaluate("scrollTo({top: document.scrollingElement.scrollHeight, behavior: 'instant'})"); await page.wait_for_timeout(1500)
        g = await page.evaluate("""(() => { const g = document.querySelector('#cuaderno .guarda'); if(!g) return null;
          const a = g.querySelector('a[href^="https://alope.dev"]'), b = g.querySelector('button.priv');
          const hidden = el => !!el.closest('[aria-hidden="true"]');
          return {text: g.textContent.replace(/\\s+/g, ' ').trim(), link: a && {tab: a.target === '_blank', hidden: hidden(a), shadow: getComputedStyle(a).textShadow},
                  button: b && {hidden: hidden(b), text: b.textContent.trim()}, claude: /Claude/.test(document.body.innerText)}; })()""")
        if not g: errs.append(f"{name}: the notebook has no inside cover"); await page.close(); continue
        if "Àlex Olivé" not in g["text"]: errs.append(f"{name}: the inside cover is not signed «Àlex Olivé» («{g['text']}»)")
        if "Fet per" in g["text"]: errs.append(f"{name}: the signature still says «Fet per» (Àlex, 11-10: just the name)")
        if not g["link"]: errs.append(f"{name}: the signature has no link to alope.dev")
        elif not g["link"]["tab"] or g["link"]["hidden"] or g["link"]["shadow"] == "none": errs.append(f"{name}: the alope.dev link should open a new tab, be heard and look raised ({g['link']})")
        if g["claude"]: errs.append(f"{name}: the page names Claude (D2: only Àlex signs the site)")
        if not g["button"] or g["button"]["text"] != "Privacitat" or g["button"]["hidden"]: errs.append(f"{name}: no «Privacitat» button on the inside cover ({g['button']})"); await page.close(); continue
        await page.click("#cuaderno .guarda button.priv"); await page.wait_for_timeout(400)
        d = await page.evaluate("""(() => { const d = document.getElementById('privacitat'); return d && {open: d.open, text: d.textContent.replace(/\\s+/g, ' ')}; })()""")
        if not d or not d["open"]: errs.append(f"{name}: «Privacitat» does not open the #privacitat sheet")
        else:
            for words in ("Sense cookies", "Vercel", "Open-Meteo"):
                if words not in d["text"]: errs.append(f"{name}: the privacy sheet does not mention {words}")
            await page.keyboard.press("Escape"); await page.wait_for_timeout(300)
            back = await page.evaluate("[!document.getElementById('privacitat').open, document.activeElement?.matches('#cuaderno .guarda button.priv')]")
            if back != [True, True]: errs.append(f"{name}: Esc should close the privacy sheet and give the focus back to its button ({back})")
        await page.screenshot(path=str(shots / f"{name}-firma.png"))
        await page.close()
    return errs

MONTHS = ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"]

def catalan_date(y, m, d):
    """«2 d’octubre del 2026», as the browser writes it in Catalan (toLocaleDateString('ca-ES'))."""
    month = MONTHS[m - 1]
    return f"{d} {'d’' if month[0] in 'aeiou' else 'de '}{month} del {y}"

async def check_red(browser):
    """14. The site reads data/red.json: the attribution Renfe's licence asks for, with the data's update date."""
    import json
    red = json.loads((root / "scripts/baseline/red.json").read_text()) if (root / "scripts/baseline/red.json").exists() else None
    if not red: return ["no frozen network timetable at scripts/baseline/red.json for the parity build"]
    page = await open_page(browser, viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    await page.clock.set_fixed_time("2026-09-28T08:00:00Z")
    await page.goto(parity_url); await page.wait_for_timeout(1500)
    text = " ".join((await page.evaluate("document.getElementById('reverso').textContent")).split())
    await page.close()
    errs = []
    if red["fuente"] not in text: errs.append(f"the back of the ticket does not credit «{red['fuente']}» (it reads «{text[-90:]}»)")
    # the days the frozen timetable covers (28-09 to 11-10), in one span since 11-10
    if "Horaris del 28 de setembre a l’11 d’octubre del 2026." not in text: errs.append(f"the back of the ticket does not give the days the timetable covers (it reads «{text[-160:]}»)")
    # the live delays show since the PR #45 (11-10): the back says so, and credits both CC BY 4.0 sources
    if "retards no surten" in text or "retard en directe dels regionals" not in text: errs.append(f"the back of the ticket does not say the regionals' live delay shows («{text[:120]}»)")
    for credit in ("Retards en directe: Renfe, CC BY 4.0.", "Temps: Open-Meteo, CC BY 4.0."):
        if credit not in text: errs.append(f"the back of the ticket does not credit «{credit}»")
    return errs

# the weather at home (08-10): Open-Meteo's answer → what the window paints. None: Open-Meteo fails (a 503)
WEATHER = [(61, "rain"), (45, "fog"), (3, "cloudy"), (1, "clear"), (None, "clear")]

async def check_weather(browser):
    """The window paints the weather of the chosen town, as Open-Meteo gives it, and fair weather when it fails."""
    import json
    errs = []
    if not any("ll" in v for v in json.loads((root / "data/red.json").read_text())["estaciones"].values()):
        return ["data/red.json has no town coordinates (ll): the window can never show the weather"]
    for code, want in WEATHER:
        page = await browser.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce"); page.set_default_timeout(120000)
        asked = []
        async def answer(route, request, code=code):
            asked.append(request.url)
            if code is None: await route.fulfill(status=503, body="")
            else: await route.fulfill(status=200, content_type="application/json", headers={"access-control-allow-origin": "*"},
                                      body=json.dumps({"current": {"weather_code": code}}))
        await page.route("https://api.open-meteo.com/**", answer)
        await page.goto(page_url)
        # the answer comes after the first paint; give it time, then a frame to repaint the window
        try: await page.wait_for_function(f"window.reus && window.reus.tiempo() === '{want}'", timeout=30000)
        except Exception: pass
        await page.wait_for_timeout(1500)
        got = await page.evaluate("window.reus.tiempo()")
        if not asked: errs.append(f"weather code {code}: Open-Meteo is never asked")
        elif "latitude=41." not in asked[0]: errs.append(f"Open-Meteo is asked for somewhere other than Reus: {asked[0]}")
        if got != want: errs.append(f"weather code {code}: the window paints «{got}», expected «{want}»")
        if want in ("rain", "fog"): await page.screenshot(path=str(shots / f"tiempo-{want}.png"))
        await page.close()
    return errs

# the lines' notices (09-10): what /api/avisos answers → what the board and the train's sheet say. At 10:00 on the
# frozen timetable the board holds two R15 (Sants → Reus)
NOTICE = "Servei alternatiu per carretera entre Reus i Riudecanyes per obres."
AVISOS_JS = """() => ({
  stamp: document.querySelector('.tk .segell')?.textContent.trim() ?? null,
  open: document.getElementById('avis').open, sheet: document.getElementById('avis').textContent.replace(/\\s+/g, ' ').trim(),
  focus: document.activeElement?.className ?? '', aviso: document.getElementById('aviso').textContent,
  detail: document.querySelector('#detalle .avisos')?.textContent.replace(/\\s+/g, ' ').trim() ?? null,
  boxed: !!document.querySelector('#detalle .avisos.avis'),
  more: document.querySelector('#detalle .avisos .mes, #avis .mes')?.getAttribute('href') ?? null })"""

def avisos_answer(kind):
    """The function's answer: «avis» on every line, «normal», «old» (read an hour before the page's 10:00) or «503»."""
    import json
    if kind == "503": return {"status": 503, "body": "{}"}
    line = {"estat": "avis", "text": NOTICE, "publicat": "2026-09-28T03:04:00Z"} if kind == "avis" else {"estat": "normal"}
    llegit = "2026-09-28T07:00:00Z" if kind == "old" else "2026-09-28T07:58:00Z"
    return {"status": 200, "content_type": "application/json",
            "body": json.dumps({"llegit": llegit, "linies": {l: line for l in ["R11", "R13", "R14", "R15", "R16", "R17"]}})}

async def avisos_page(browser, kind, w, h):
    page = await open_page(browser, viewport={"width": w, "height": h}, reduced_motion="reduce")
    asked = []
    async def answer(route, request):
        asked.append(request.url); await route.fulfill(**avisos_answer(kind))
    await page.route("**/api/avisos", answer)   # the latest route wins over open_page's abort
    await page.clock.set_fixed_time("2026-09-28T08:00:00Z")
    await page.goto(parity_url); await page.evaluate("document.fonts.ready")
    try: await page.wait_for_function("window.reus && window.reus.avisos() !== null", timeout=20000)
    except Exception: pass
    await page.wait_for_timeout(800)
    return page, asked

async def check_avisos(browser):
    """Desktop: a notice on a line of the board puts an ink stamp on the ticket, which opens a sheet with the whole
    text; no notice, or no answer, no stamp. Phone: nothing on the board; the train's sheet says its line's notice,
    that there is none (and when it was read), or that it could not be read (an error, or an answer too old)."""
    errs = []
    page, asked = await avisos_page(browser, "avis", 1440, 900)
    if not asked: errs.append("the page never asks /api/avisos")
    a = await page.evaluate(AVISOS_JS)
    if not a["stamp"] or "R15" not in a["stamp"] or "per carretera" not in a["stamp"]:
        errs.append(f"with a notice on the R15, the ticket's stamp reads «{a['stamp']}», expected «Avís R15» and «per carretera»")
    if "Avís de la Generalitat a l’R15" not in a["aviso"]: errs.append(f"#aviso does not announce the notice: «{a['aviso']}»")
    await page.screenshot(path=str(shots / "avisos-escritorio.png"))
    try: await page.click(".tk .segell", timeout=CLICK_MS)
    except Exception: errs.append("the stamp is not clickable")
    await page.wait_for_timeout(500); a = await page.evaluate(AVISOS_JS)
    if not a["open"]: errs.append("the stamp does not open #avis")
    elif NOTICE not in a["sheet"] or "consultat a les 09:58" not in a["sheet"].lower() or "Generalitat de Catalunya" not in a["sheet"]:
        errs.append(f"the notice's sheet reads «{a['sheet']}»")
    if a["more"] != "https://rodalies.gencat.cat/ca/": errs.append(f"the notice's sheet links to {a['more']}")
    await page.screenshot(path=str(shots / "avisos-hoja.png"))
    await page.keyboard.press("Escape"); await page.wait_for_timeout(300); a = await page.evaluate(AVISOS_JS)
    if a["open"] or "segell" not in a["focus"]: errs.append(f"Esc leaves #avis open ({a['open']}) or the focus off the stamp ({a['focus']})")
    await page.close()
    for kind in ("normal", "503", "old"):
        page, _ = await avisos_page(browser, kind, 1440, 900)
        a = await page.evaluate(AVISOS_JS)
        if a["stamp"]: errs.append(f"with «{kind}» the ticket has a stamp: «{a['stamp']}»")
        await page.close()
    # a phone: never a stamp; the big train's sheet says what is known of the R15
    phone = {"avis": NOTICE, "normal": "Sense avisos a l’R15 (consultat a les 09:58).",
             "503": "No hem pogut consultar els avisos de l’R15.", "old": "No hem pogut consultar els avisos de l’R15."}
    for kind, want in phone.items():
        page, _ = await avisos_page(browser, kind, 390, 844)
        a = await page.evaluate(AVISOS_JS)
        if a["stamp"]: errs.append(f"phone, «{kind}»: the ticket has a stamp")
        try: await page.click("#board button.big", timeout=CLICK_MS)
        except Exception: errs.append(f"phone, «{kind}»: the big train is not clickable"); await page.close(); continue
        await page.wait_for_timeout(500); a = await page.evaluate(AVISOS_JS)
        if not a["detail"] or want not in a["detail"]: errs.append(f"phone, «{kind}»: the train's sheet says «{a['detail']}», expected «{want}»")
        if kind == "avis":
            if not a["boxed"]: errs.append("phone: the notice in the train's sheet is not framed")
            await page.screenshot(path=str(shots / "avisos-movil.png"))
        await page.close()
    return errs

# the live delay of the train shown (10-10, Àlex: option A, the time corrected; on time says nothing): what
# /api/retards answers → what the board and the train's sheet say. At 10:00 on 28-09 of the frozen timetable the big
# train is the R15 15005, Sants 10:03 → Reus 11:33
RETARDS_JS = """() => { const big = document.querySelector('#board .big');
  return { tach: !!big?.querySelector('#dep.tach'), nova: big?.querySelector('.nova')?.textContent.trim() ?? null,
    text: big?.textContent.replace(/\\s+/g, ' ').trim() ?? '', arr: big?.querySelector('.arr')?.textContent.replace(/\\s+/g, ' ').trim() ?? '',
    aviso: document.getElementById('aviso').textContent,
    sheet: document.getElementById('detalle').open ? document.getElementById('detalle').textContent.replace(/\\s+/g, ' ').trim() : null } }"""
LATE = {"15005": {"estat": "circula", "retard": 25, "parada": "71802"}}
RETARDS = {
    "late": ("200", LATE),
    "ontime": ("200", {"15005": {"estat": "circula", "retard": 1, "parada": "71802"}}),
    "notyet": ("200", {}),
    "503": ("503", {}),
    "cancel": ("200", {"15005": {"estat": "cancelat"}}),
}

async def retards_page(browser, kind, w, h):
    import json
    status, trens = RETARDS[kind]
    page = await open_page(browser, viewport={"width": w, "height": h}, reduced_motion="reduce")
    async def answer(route):
        if status != "200": await route.fulfill(status=int(status), body="{}")
        else: await route.fulfill(status=200, content_type="application/json", body=json.dumps({"llegit": "2026-09-28T07:59:40Z", "trens": trens}))
    await page.route("**/api/retards", answer)   # the latest route wins over open_page's abort
    await page.clock.set_fixed_time("2026-09-28T08:00:00Z")
    await page.goto(parity_url); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(2500)
    return page

async def check_retards(browser):
    """Desktop: a late train has its time struck in orange and the new one beside it, «+25 min» and the countdown to the
    new departure, and its arrival corrected; on time nothing changes; not in the feed yet or no answer, «sense dades en
    directe encara»; cancelled, struck and «cancel·lat». Phone: the same in the row, and the train's sheet says it."""
    errs = []
    page = await retards_page(browser, "late", 1440, 900)
    r = await page.evaluate(RETARDS_JS)
    if not r["tach"]: errs.append("late: the big time is not struck")
    if r["nova"] != "10:28": errs.append(f"late: the new time reads «{r['nova']}», expected «10:28»")
    if "+25 min" not in r["text"] or "en 28 min" not in r["text"]: errs.append(f"late: the big row reads «{r['text']}»")
    if "11:33" not in r["arr"] or "11:58" not in r["arr"]: errs.append(f"late: the arrival reads «{r['arr']}», expected 11:33 struck and 11:58")
    if "amb 25 min de retard" not in r["aviso"]: errs.append(f"late: #aviso does not say the delay: «{r['aviso']}»")
    await page.screenshot(path=str(shots / "retard-escritorio.png")); await page.close()
    for kind in ("ontime", "notyet", "503", "cancel"):
        page = await retards_page(browser, kind, 1440, 900)
        r = await page.evaluate(RETARDS_JS)
        if r["nova"]: errs.append(f"{kind}: a new time shows («{r['nova']}»)")
        if kind == "ontime" and (r["tach"] or "el pròxim, en 3 min" not in r["text"] or "sense dades" in r["text"]):
            errs.append(f"on time: the big row changed: «{r['text']}»")
        if kind in ("notyet", "503") and "sense dades en directe encara" not in r["text"]:
            errs.append(f"{kind}: the big row does not say there is no live data yet: «{r['text']}»")
        if kind == "cancel" and (not r["tach"] or "cancel·lat" not in r["text"] or "en 3 min" in r["text"]):
            errs.append(f"cancelled: the big row reads «{r['text']}» (struck: {r['tach']})")
        await page.screenshot(path=str(shots / f"retard-escritorio-{kind}.png")); await page.close()
    phone = {"late": ("10:28", "Amb 25 min de retard"), "ontime": (None, None), "notyet": (None, "sense dades"), "cancel": (None, "Cancel·lat")}
    for kind, (nova, said) in phone.items():
        page = await retards_page(browser, kind, 390, 844)
        r = await page.evaluate(RETARDS_JS)
        if r["nova"] != nova: errs.append(f"phone, {kind}: the new time reads «{r['nova']}», expected «{nova}»")
        if kind == "late" and ("en 28 min" not in r["text"] or "11:58" not in r["arr"]): errs.append(f"phone, late: the row reads «{r['text']}»")
        if kind == "ontime" and ("en 3 min" not in r["text"] or "sense dades" in r["text"]): errs.append(f"phone, on time: the row reads «{r['text']}»")
        await page.screenshot(path=str(shots / f"retard-movil-{kind}.png"))
        try: await page.click("#board button.big", timeout=CLICK_MS)
        except Exception: errs.append(f"phone, {kind}: the big train is not clickable"); await page.close(); continue
        await page.wait_for_timeout(600); r = await page.evaluate(RETARDS_JS)
        if said and (not r["sheet"] or said not in r["sheet"]): errs.append(f"phone, {kind}: the sheet says «{r['sheet']}», expected «{said}»")
        if kind == "ontime" and r["sheet"] and ("retard" in r["sheet"].lower() or "sense dades" in r["sheet"]): errs.append(f"phone, on time: the sheet says «{r['sheet']}»")
        if kind == "late": await page.screenshot(path=str(shots / "retard-movil-hoja.png"))
        await page.close()
    # the narrowest phone: whatever the live delay writes beside the big time fits beside it
    for kind in RETARDS:
        page = await retards_page(browser, kind, 320, 568)
        errs += [f"320 px, {kind}: {e}" for e in await page.evaluate(BOARD_OVERLAP)]
        await page.screenshot(path=str(shots / f"retard-movil320-{kind}.png")); await page.close()
    return errs

SUBTITLE = "El tren cap a casa, i el de tornada a Barcelona"

async def hero_page(browser, w=1440, h=900, at="2026-09-28T08:00:00Z"):
    """The hero on the frozen timetable, as a still frame at a fixed Madrid time (10:00 by default)."""
    page = await open_page(browser, viewport={"width": w, "height": h}, reduced_motion="reduce")
    await page.clock.set_fixed_time(at)
    await page.goto(parity_url); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(1200)
    return page

# the light follows the real sun (08-10): (Madrid day, minute) → the light it must be, and the sunset it must find
DAYLIGHT = [("2026-12-21", 16*60, "dusk"), ("2026-12-21", 18*60+30, "night"), ("2026-12-21", 12*60, "day"),
            ("2026-06-21", 21*60, "dusk"), ("2026-06-21", 20*60, "dusk"), ("2026-06-21", 23*60, "night"), ("2026-06-21", 7*60, "dawn")]
SUNSET = {"2026-12-21": 17*60+25, "2026-06-21": 21*60+28}

async def check_daylight(browser):
    """The light of the window and the carriage on the sun's clock (light.ts), winter and summer."""
    errs = []
    page = await hero_page(browser)
    for day, minute, want in DAYLIGHT:
        got = await page.evaluate(f"window.reus.daylight({minute}, '{day}').name")
        if got != want: errs.append(f"on {day} at {minute//60:02d}:{minute%60:02d} the light is «{got}», expected «{want}»")
    for day, sunset in SUNSET.items():
        # an hour before sunset the sun still shows; 20 minutes after it, the blue hour: no sun, the sky bluer than red
        before = await page.evaluate(f"window.reus.daylight({sunset-60}, '{day}').glow")
        blue = await page.evaluate(f"(l => [l.glow, l.top[2] - l.top[0]])(window.reus.daylight({sunset+20}, '{day}'))")
        if not before > 0: errs.append(f"on {day} the sun has gone an hour before sunset ({sunset//60:02d}:{sunset%60:02d})")
        if blue[0] != 0 or blue[1] < .2: errs.append(f"on {day} 20 minutes after sunset it is not the blue hour (glow {blue[0]}, sky blue minus red {blue[1]:.2f})")
    await page.close()
    return errs

# the name's board (flaps.ts): one letter per cell, and where each letter's glyph sits
BOARD_JS = """(() => { const cells = [...document.querySelectorAll('.tauler .celes i')].map(c => c.getBoundingClientRect());
  const h1 = document.querySelector('.brand'), letters = [...h1.querySelectorAll('span')].map(l => l.getBoundingClientRect());
  return {cells: cells.map(r => [r.left, r.top, r.right, r.bottom]), letters: letters.map(r => [r.left, r.top, r.right, r.bottom]),
    label: h1.getAttribute('aria-label'), upper: getComputedStyle(h1).textTransform, canvas: !!document.querySelector('.tauler canvas')}; })()"""

async def check_board_still(page):
    """The name is a split-flap board: eight cells and a letter of «Capacasa» centred in each, in capitals, with
    the name for the screen reader; with reduced motion the flaps never turn (no canvas over the cells)."""
    errs = []
    b = await page.evaluate(BOARD_JS)
    if len(b["cells"]) != len(NAME): errs.append(f"the board has {len(b['cells'])} cells, expected {len(NAME)}")
    if b["label"] != NAME: errs.append(f"the name's accessible label is «{b['label']}», expected «{NAME}»")
    if b["upper"] != "uppercase": errs.append(f"the board does not write the name in capitals ({b['upper']})")
    if b["canvas"]: errs.append("with reduced motion the board still turns its flaps")
    for i, (c, l) in enumerate(zip(b["cells"], b["letters"])):
        g = await page.evaluate(f"({GLYPH_RECT})('.brand', {i})")
        cx, cy = (c[0] + c[2]) / 2, (c[1] + c[3]) / 2
        if not g or abs(g["x"] - cx) > 2 or abs(g["y"] - cy) > .12 * (c[3] - c[1]):
            errs.append(f"letter {i} of the name is not centred in its cell ({g} vs cell centre {cx:.0f}, {cy:.0f})")
    return errs

async def check_flaps(browser):
    """With motion, the board turns its flaps when the hero comes in (a canvas over the cells) and, once the last
    flap lands, leaves the real h1 alone, in a desktop and a phone (at 3 device pixels per CSS pixel, like an
    iPhone). The board keeps its size while they turn: a canvas that takes part in its layout made it grow with
    its own pixels (10-10, seen on an iPhone)."""
    errs = []
    size = "(() => { const b = document.querySelector('.tauler').getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; })()"
    for w, h, dpr in [(1440, 900, 1), (390, 844, 3)]:
        page = await open_page(browser, viewport={"width": w, "height": h}, device_scale_factor=dpr)
        jserr = []; page.on("pageerror", lambda e: jserr.append(str(e)))
        await page.goto(parity_url)
        try: await page.wait_for_function("document.querySelector('.tauler canvas')", timeout=60000)
        except Exception: errs.append(f"{w}x{h}: the board never turns its flaps"); await page.close(); continue
        turning = []
        for _ in range(4):
            if not await page.evaluate("!!document.querySelector('.tauler canvas')"): break
            turning.append(await page.evaluate(size)); await page.wait_for_timeout(150)
        try: await page.wait_for_function("!document.querySelector('.tauler canvas')", timeout=60000)
        except Exception: errs.append(f"{w}x{h}: the flaps never stop (the canvas stays over the board)")
        still = await page.evaluate(size)
        grown = [t for t in turning if abs(t[0] - still[0]) > 1 or abs(t[1] - still[1]) > 1]
        if grown: errs.append(f"{w}x{h}: the board measures {grown[0][0]}x{grown[0][1]} while its flaps turn and {still[0]}x{still[1]} at rest")
        errs += [f"{w}x{h}: JS error: {e}" for e in jserr]
        await page.close()
    return errs

# the window's box on screen with a margin for the painted wobble of its edge, in CSS px
WIN_BOX = """(() => { const r = document.getElementById('win').getBoundingClientRect(), m = 12;
  return [Math.floor(r.left - m), Math.floor(r.top - m), Math.ceil(r.right + m), Math.ceil(r.bottom + m)]; })()"""

# Date stands still at that instant, and every timer and frame runs as usual
FIXED_DATE = """(() => { const at = Date.parse('%s'), D = Date;
  window.Date = class extends D { constructor(...a){ super(...(a.length ? a : [at])); } static now(){ return at; } }; })()"""

def wall_difference(a, b, box):
    """How many pixels of the wall (everything but the window's box) differ between two screenshots, and by how much at most."""
    a, b = Image.open(io.BytesIO(a)).convert("RGB"), Image.open(io.BytesIO(b)).convert("RGB")
    d = ImageChops.difference(a, b).convert("L")
    d.paste(0, tuple(box))
    hist = d.histogram()
    return sum(hist[9:]), max((v for v in range(256) if hist[v]), default=0)

async def check_wall_kept(browser):
    """Once painted, the wall stays as it is: each frame of the moving landscape repaints only the window (the
    watercolour pass is most of the GPU's work, and outside the window nothing moves), and what the screen shows
    of the wall is the same as a still frame at that hour. Also after the wall changes: a wash on the way to the
    table and back, and another hour on the ruler (its light)."""
    errs = []
    for w, h, dpr in [(1440, 900, 1), (390, 844, 3)]:
        tag = f"{w}x{h}"
        still = await open_page(browser, viewport={"width": w, "height": h}, device_scale_factor=dpr, reduced_motion="reduce")
        await still.clock.set_fixed_time("2026-09-28T08:00:00Z")
        await still.goto(parity_url); await still.evaluate("document.fonts.ready")
        page = await open_page(browser, viewport={"width": w, "height": h}, device_scale_factor=dpr)
        await page.add_init_script(FIXED_DATE % "2026-09-28T08:00:00Z")   # page.clock blocks screenshots while the landscape runs
        jserr = []; page.on("pageerror", lambda e: jserr.append(str(e)))
        await page.goto(parity_url)
        try: await page.wait_for_function("document.getElementById('stage').classList.contains('in') && !document.querySelector('.tauler canvas')", timeout=60000)
        except Exception: errs.append(f"{tag}: the hero never comes in"); await still.close(); await page.close(); continue
        await hero_settled(page); await page.wait_for_timeout(2500)
        box = await page.evaluate(WIN_BOX)
        area = (box[2] - box[0]) * (box[3] - box[1]) / (w * h)
        shares = []
        for _ in range(4): shares.append(await page.evaluate("window.reus.acuarela()")); await page.wait_for_timeout(400)
        if max(shares) > min(.6, area * 1.3): errs.append(f"{tag}: once painted, each frame repaints {max(shares):.0%} of the screen (the window is {area:.0%})")
        # only the painting is compared: the texts on the wall hide (the station clock's second hand turns with motion)
        for pg in (page, still): await pg.add_style_tag(content="#stage{visibility:hidden!important}")
        async def same_wall(when, margin=12):
            box = await page.evaluate(WIN_BOX.replace("m = 12", f"m = {margin}"))   # the board may have grown a line and moved the window
            shot, ref = await page.screenshot(), await still.screenshot()
            n, worst = wall_difference(shot, ref, [round(v * dpr) for v in box])
            if n > 50:
                d = ImageChops.difference(Image.open(io.BytesIO(shot)).convert("RGB"), Image.open(io.BytesIO(ref)).convert("RGB")).convert("L").point(lambda v: 255 if v > 8 else 0)
                d.paste(80, tuple(round(v * dpr) for v in box)); bb = d.point(lambda v: 255 if v == 255 else 0).getbbox()
                errs.append(f"{tag}: {when}, around {bb}, the wall differs from a still frame at that hour in {n} px (by up to {worst})")
        await same_wall("moving")
        # a wash on the way to the table, and back to the hero. While the wall turns away its wash changes every
        # frame, but the wall under it does not: the watercolour still repaints only the window (twice: with and
        # without the wash), and the wash is laid over the wall already painted
        await page.evaluate("scrollTo({top: innerHeight * .3, behavior: 'instant'})"); await page.wait_for_timeout(2000)
        turning = []
        for i in range(4):
            await page.evaluate(f"scrollTo({{top: innerHeight * {.3 + .02 * (i + 1)}, behavior: 'instant'}})"); await page.wait_for_timeout(400)
            turning.append(await page.evaluate("window.reus.acuarela()"))
        if max(turning) > min(.9, area * 2.6): errs.append(f"{tag}: while the wall turns away, each frame repaints {max(turning):.0%} of the screen in watercolour (the window is {area:.0%})")
        await page.evaluate("scrollTo({top: 0, behavior: 'instant'})"); await page.wait_for_timeout(2500)
        await same_wall("after a wash and back")
        # a new size while the wall is turned (iOS Safari's toolbar shrinks as the page scrolls, mid-transition): the
        # window is still painted where #win rests, not where the tilted wall put it. The frame around the glass is
        # part of the wall, so this compares it too, with only the wobble of the glass's edge left out
        await page.evaluate("scrollTo({top: innerHeight * .3, behavior: 'instant'})"); await page.wait_for_timeout(2000)
        await page.evaluate("dispatchEvent(new Event('resize'))"); await page.wait_for_timeout(1500)
        await page.evaluate("scrollTo({top: 0, behavior: 'instant'})"); await page.wait_for_timeout(2500)
        await same_wall("after a new size mid-turn and back", margin=4)
        # another hour on the ruler: 23:00, another light on the wall
        at_night = "(() => { const t = document.getElementById('t'); t.value = 1380; t.dispatchEvent(new Event('input', {bubbles: true})); })()"
        await page.evaluate(at_night); await still.evaluate(at_night)
        await page.wait_for_timeout(2500); await still.wait_for_timeout(1500)
        await same_wall("at another hour")
        errs += [f"{tag}: JS error: {e}" for e in jserr]
        await still.close(); await page.close()
    return errs

# the board's box, and whether its CSS still paints a panel and cells over the wall
TAULER_JS = """(() => { const t = document.querySelector('.tauler'), r = t.getBoundingClientRect();
  return {rect: [r.left, r.top, r.right, r.bottom], bg: getComputedStyle(t).backgroundColor,
    cells: getComputedStyle(t.querySelector('.celes')).visibility, gl: !!document.getElementById('gl')}; })()"""

def painted_edges(img, rect):
    """How far each edge of the board painted on the wall (dark on the light wall) falls from the board's box, in
    px: scanned from the wall inwards along five lines per side, the first pixel at half the wall's brightness.
    None for a side where nothing dark is painted."""
    l, t, r, b = rect; W, H = img.size
    def bright(x, y): p = img.getpixel((min(W - 1, max(0, int(x))), min(H - 1, max(0, int(y))))); return sum(p[:3]) / 3
    def edge(points):
        ref = sorted(bright(x, y) for x, y in points[:5])[2]
        return next((i for i, (x, y) in enumerate(points) if bright(x, y) < .5 * ref), None)
    out = {}
    for side in ("top", "bottom", "left", "right"):
        d = int(min(16, t - 1 if side == "top" else H - b - 1 if side == "bottom" else l - 1 if side == "left" else W - r - 1))
        found = []
        for f in (.2, .35, .5, .65, .8):
            x, y = l + (r - l) * f, t + (b - t) * f
            pts = {"top": [(x, t - d + i) for i in range(2 * d)], "bottom": [(x, b + d - i) for i in range(2 * d)],
                   "left": [(l - d + i, y) for i in range(2 * d)], "right": [(r + d - i, y) for i in range(2 * d)]}[side]
            i = edge(pts)
            if i is not None: found.append(i - d)
        out[side] = sorted(found)[len(found) // 2] if len(found) >= 3 else None
    return out

async def board_painted(page, label):
    """The board is painted on the wall by the watercolour (Àlex, 10-10, option A): its CSS paints no panel and
    no cells, and with the whole board hidden the wall still shows it, its edges on the board's box."""
    errs = []
    s = await page.evaluate(TAULER_JS)
    if not s["gl"]: return [f"{label}: no WebGL in this browser, the painted board cannot be read"]
    if s["bg"] not in ("transparent", "rgba(0, 0, 0, 0)"): errs.append(f"{label}: the board's CSS still paints a panel ({s['bg']}) over the wall")
    if s["cells"] != "hidden": errs.append(f"{label}: the board's CSS still paints its cells over the wall")
    # the ticket too: on a phone it sits just under the name (no subtitle since 19-10), and its paper would read as wall
    await page.add_style_tag(content=".tauler, .tickets{visibility:hidden !important}"); await page.wait_for_timeout(300)
    shot = Image.open(io.BytesIO(await page.screenshot())).convert("RGB")
    await page.evaluate("document.head.lastElementChild.remove()")
    off = painted_edges(shot, s["rect"])
    if any(v is None for v in off.values()): errs.append(f"{label}: the wall does not paint the board under the name (edges found: {off})")
    elif any(abs(v) > 3 for v in off.values()): errs.append(f"{label}: the painted board is off its box by {off} px")
    return errs

async def check_board_painted(browser):
    """The name's board painted by the watercolour, in a desktop and a phone: on a still frame, after the window
    changes size, and after the hero's entrance with motion (the texts rise 6 px as they come in: the paint must
    land where the board rests, not where it was at load)."""
    errs = []
    for (w, h), (w2, h2) in (((1440, 900), (1280, 800)), ((390, 844), (360, 740))):
        page = await hero_page(browser, w, h)
        errs += await board_painted(page, f"{w}x{h}")
        await page.set_viewport_size({"width": w2, "height": h2}); await page.wait_for_timeout(1500)
        errs += await board_painted(page, f"{w}x{h} resized to {w2}x{h2}")
        await page.close()
        page = await open_page(browser, viewport={"width": w, "height": h})
        await page.goto(parity_url)
        try:
            await page.wait_for_function("document.getElementById('stage').classList.contains('in')", timeout=60000)
            await page.wait_for_function("!document.querySelector('.tauler canvas')", timeout=60000); await page.wait_for_timeout(1500)
            errs += await board_painted(page, f"{w}x{h} with motion")
        except Exception: errs.append(f"{w}x{h} with motion: the hero never comes in")
        await page.close()
    return errs

# from load until the hero comes in (#stage.in), the painted board's box every 50 ms: the wall reads that box
# whenever it resizes, so it must hold still -- nothing may slide it while the texts wait to rise
BOARD_TOPS = """(() => { const tops = window.__boardTops = [];
  const id = setInterval(() => { const hero = document.getElementById('hero'), b = document.querySelector('.tauler');
    if(document.getElementById('stage')?.classList.contains('in')){ clearInterval(id); window.__boardDone = true; return; }
    if(hero && hero.classList.contains('pintada') && b) tops.push(b.getBoundingClientRect().top); }, 50); })()"""

async def check_board_steady(browser):
    """Before the hero comes in, the painted board's box never moves (letters.measure() must not leave .top
    sliding back into place: the wall would read the board mid-slide and paint it out of its box)."""
    errs = []
    for w, h in [(1440, 900), (390, 844)]:
        page = await open_page(browser, viewport={"width": w, "height": h})
        await page.add_init_script(BOARD_TOPS)
        await page.goto(parity_url)
        try: await page.wait_for_function("window.__boardDone", timeout=60000)
        except Exception: errs.append(f"{w}x{h}: the hero never comes in"); await page.close(); continue
        tops = await page.evaluate("window.__boardTops")
        if not tops: errs.append(f"{w}x{h}: the board was never painted before the hero came in")
        elif max(tops) - min(tops) > 1: errs.append(f"{w}x{h}: the painted board's box moves {max(tops) - min(tops):.1f} px before the hero comes in ({min(tops):.1f} to {max(tops):.1f})")
        await page.close()
    return errs

# time on the page runs N times slower (rAF and performance.now alike: the landscape's loop and the flaps), so a
# screenshot can catch the flaps half-way even under software rendering
SLOW_TIME = """(() => { const N = %d, now = performance.now.bind(performance), p0 = now(), raf = requestAnimationFrame.bind(window);
  performance.now = () => p0 + (now() - p0) / N;
  window.requestAnimationFrame = cb => raf(t => cb(p0 + (t - p0) / N)); })()"""

CELLS_JS = "[...document.querySelectorAll('.tauler .celes i')].map(c => { const r = c.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })"

def cell_margins(img, cells):
    """The pixels of each cell clear of its letter and its hinge: thin strips at both sides, above and below the hinge."""
    out = []
    for l, t, r, b in cells:
        w, h = r - l, b - t
        for x in [l + w * f for f in (.02, .05)] + [r - w * f for f in (.02, .05)]:
            for f in (.15, .25, .35, .65, .75, .85): out.append(img.getpixel((int(x), int(t + h * f)))[:3])
    return out

async def check_flaps_painted(browser):
    """While its flaps turn, the board still looks painted: the flaps' canvas shows the cells as the wall paints
    them, so nothing jumps when it goes and leaves the painted board (desktop, and a phone at 3 device pixels)."""
    errs = []
    for w, h, dpr in [(1440, 900, 1), (390, 844, 3)]:
        page = await open_page(browser, viewport={"width": w, "height": h}, device_scale_factor=dpr)
        await page.add_init_script(SLOW_TIME % 4)
        await page.goto(parity_url)
        try: await page.wait_for_function("document.querySelector('.tauler canvas')", timeout=120000)
        except Exception: errs.append(f"{w}x{h}: the board never turns its flaps"); await page.close(); continue
        await page.wait_for_timeout(2500)
        if not await page.evaluate("!!document.querySelector('.tauler canvas')"): errs.append(f"{w}x{h}: the flaps stopped before they could be seen"); await page.close(); continue
        cells = await page.evaluate(CELLS_JS)
        turning = Image.open(io.BytesIO(await page.screenshot(scale="css"))).convert("RGB")
        await page.wait_for_function("!document.querySelector('.tauler canvas')", timeout=120000); await page.wait_for_timeout(1500)
        still = Image.open(io.BytesIO(await page.screenshot(scale="css"))).convert("RGB")
        a, b = cell_margins(turning, cells), cell_margins(still, cells)
        # the median pixel: the flaps falling at that moment (shaded as they turn) are a minority of the strips
        diffs = sorted(sum(abs(p - q) for p, q in zip(u, v)) / 3 for u, v in zip(a, b))
        diff = diffs[len(diffs) // 2]
        if diff > 6: errs.append(f"{w}x{h}: the cells change by {diff:.0f}/255 when the flaps' canvas goes (turning {a[0]}, at rest {b[0]})")
        await page.close()
    return errs

NO_WEBGL = """(() => { const get = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(kind, ...rest){ return /webgl/.test(kind) ? null : get.call(this, kind, ...rest); }; })()"""

async def check_board_without_webgl(browser):
    """Without WebGL nothing paints the wall: the board keeps its CSS panel and cells, in place."""
    errs = []
    page = await open_page(browser, viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    await page.add_init_script(NO_WEBGL)
    await page.goto(parity_url); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(1200)
    s = await page.evaluate(TAULER_JS)
    if s["gl"]: errs.append("the check could not take WebGL away from the page")
    if s["bg"] in ("transparent", "rgba(0, 0, 0, 0)"): errs.append("without WebGL the board has no panel")
    if s["cells"] != "visible": errs.append("without WebGL the board has no cells")
    if await page.evaluate("getComputedStyle(document.querySelector('.tauler')).transform") != "none": errs.append("without WebGL the board is moved off its place")
    await page.close()
    return errs

# the highlighted time: what the page shows of it, read in the browser
HORA = """(() => { const h = document.getElementById('hero'), d = document.getElementById('dep'), c = getComputedStyle(d);
  const m = c.textShadow.match(/(-?[\\d.]+)px (-?[\\d.]+)px ([\\d.]+)px/);
  const anim = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).animationName : null; };
  return {raised: !!m && +m[1] > 0 && +m[3] === 0, shadow: c.textShadow, link: !!d.closest('a'), cls: h.className,
          dep: anim('#dep'), mas: anim('#board .big .mas'), talo: anim('.talo .in'),
          kept: (() => { try { return localStorage.getItem('capacasa.hora'); } catch { return null; } })()}; })()"""

async def check_hora(browser):
    """The highlighted time is only a time (Àlex 18-10): the stubs «Compra» and «Avisa» say what it leads to, so the
    hint that it could be pressed (raised until the first press, beating at a touch where nothing answers; option C,
    12-10) is gone. Flat, not a link on a desktop, still at a touch on the window, nothing kept in the browser."""
    errs = []
    for name, (w, h) in {"desktop": (1440, 900), "phone": (390, 844)}.items():
        page = await open_page(browser, viewport={"width": w, "height": h})
        # the real clock: a fixed one also stops the landscape's paint-in, and the hero would never come in
        await page.goto(page_url); await page.evaluate("document.fonts.ready")
        await page.wait_for_function("document.getElementById('stage').classList.contains('in')", timeout=30000)
        await page.mouse.click(*(await page.evaluate("(r => [r.x + r.width / 2, r.y + r.height / 2])(document.getElementById('win').getBoundingClientRect())")))
        await page.wait_for_timeout(150)
        s = await page.evaluate(HORA)
        if s["raised"]: errs.append(f"{name}: the highlighted time is raised ({s['shadow']})")
        if s["link"]: errs.append(f"{name}: the highlighted time is a link (the stub «Compra» is the way to Renfe)")
        if any(s[k] not in (None, "none") for k in ("dep", "mas", "talo")) or "batec" in s["cls"] or "duda" in s["cls"]:
            errs.append(f"{name}: a touch on the window makes something beat ({s})")
        if s["kept"] is not None: errs.append(f"{name}: the browser still keeps «capacasa.hora» ({s['kept']})")
        await page.close()
    return errs

async def check_hero(browser):
    """15. The hero B: its name and subtitle."""
    errs = []
    page = await hero_page(browser)
    got = await page.evaluate("({title: document.title, name: document.querySelector('.brand').textContent.trim(), sub: document.querySelector('.sub').textContent.trim()})")
    if not got["title"].startswith(NAME + " - "): errs.append(f"the page's title is «{got['title']}», expected «{NAME} - …»")
    if got["name"] != NAME: errs.append(f"the name on the wall is «{got['name']}», expected «{NAME}»")
    if got["sub"] != SUBTITLE: errs.append(f"the subtitle is «{got['sub']}», expected «{SUBTITLE}»")
    errs += await check_hero_ticket(page)
    errs += await check_town_ticket(page)
    errs += await check_board_still(page)
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
    errs += [f"strip: {e}" for e in await check_strip_whole(browser)]
    errs += [f"phone: {e}" for e in await check_phone_board(browser)]
    errs += [f"phone sheet: {e}" for e in await check_sheet_close(browser)]
    errs += [f"paper: {e}" for e in await check_paper_motion(browser)]
    errs += await check_sheet_holds_page(browser)
    # 3.5 · the Barcelona station
    errs += [f"station: {e}" for e in await check_station(browser)]
    # the big train's route, only on a desktop
    errs += [f"route: {e}" for e in await check_journey(browser)]
    errs += [f"wagon: {e}" for e in await check_wagon(browser)]
    errs += [f"board: {e}" for e in await check_flaps(browser)]
    errs += [f"board: {e}" for e in await check_board_painted(browser)]
    errs += [f"board: {e}" for e in await check_board_steady(browser)]
    errs += [f"board: {e}" for e in await check_board_without_webgl(browser)]
    errs += [f"board: {e}" for e in await check_flaps_painted(browser)]
    errs += [f"wall: {e}" for e in await check_wall_kept(browser)]
    errs += [f"light: {e}" for e in await check_daylight(browser)]
    errs += [f"weather: {e}" for e in await check_weather(browser)]
    errs += [f"foot: {e}" for e in await check_ruler_foot(browser)]
    errs += [f"notices: {e}" for e in await check_avisos(browser)]
    errs += [f"live delay: {e}" for e in await check_retards(browser)]
    errs += [f"time: {e}" for e in await check_hora(browser)]
    errs += [f"days: {e}" for e in await check_days(browser)]
    errs += [f"stubs: {e}" for e in await check_talons(browser)]
    # 21:30, from Reus: no regional left today, but two AVE from Camp de Tarragona (22:17, 22:39)
    page = await hero_page(browser, at="2026-09-28T19:30:00Z")
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    b = await page.evaluate(BOARD); r = await page.evaluate(RULER)
    want = ["AVE 22:17 el pròxim, en 47 min → 22:59 des de Camp de Tarragona", "R15 05:36 demà → 07:07"]
    if b["rows"] != want: errs.append(f"at 21:30 from Reus the board reads {b['rows']}, expected today's AVE and tomorrow's first regional {want}")
    if b["dep"] != "22:17" or r["knob"] != 1337: errs.append(f"at 21:30 from Reus the train shown is {b['dep']} with the knob at {r['knob']}, expected the 22:17 AVE (1337)")
    if b["soon"] != "en 47 min": errs.append(f"at 21:30 from Reus .soon reads «{b['soon']}», expected «en 47 min»")
    if "Avui ja no queden regionals" not in b["info"]: errs.append("at 21:30 from Reus the board does not say «Avui ja no queden regionals»")
    errs += [f"at 21:30 from Reus: {e}" for e in buy_link(b, CAMP_ID, SANTS_ID, "28/09/2026")]
    # picking tomorrow's trip keeps it tomorrow's: never today's 05:36, long gone
    await page.click("#board .tt"); await page.wait_for_timeout(300)
    b = await page.evaluate(BOARD)
    dia = await page.evaluate("document.querySelector('.tk .fecha')?.dataset.dia")
    if b["dep"] != "05:36" or dia != "2026-09-29": errs.append(f"at 21:30 from Reus, tomorrow's 05:36 picked: the train shown is {b['dep']} on {dia}, expected 05:36 on 2026-09-29")
    pressed = await page.evaluate("document.querySelector('.full.on')?.dataset.dia")
    if not b["rows"][0].startswith("R15 05:36 demà") or pressed != "dema": errs.append(f"at 21:30 from Reus, tomorrow's 05:36 picked: the board reads {b['rows']} with the «{pressed}» sheet pressed, expected «demà» on both")
    errs += [f"at 21:30 from Reus, tomorrow's 05:36 picked: {e}" for e in buy_link(b, REUS_TOWN, SANTS_ID, "29/09/2026")]
    await page.close()
    # «ara» at both ends of the day (00:30 is clamped to the ruler's start, 23:59 is its end) never leaves the screen
    for at, when in (("2026-09-28T22:30:00Z", "00:30"), ("2026-09-28T21:59:00Z", "23:59")):
        for w, h in ((390, 844), (1440, 900)):
            page = await hero_page(browser, w, h, at=at)
            out = await page.evaluate("""(() => { const b = document.querySelector('.nowline span')?.getBoundingClientRect();
              return b ? b.left < -1 || b.right > innerWidth + 1 : 'missing'; })()""")
            if out: errs.append(f"{w}x{h} at {when}: the word «ara» leaves the screen ({out})")
            await page.close()
    # away from now (late in the evening, the first train chosen) the station clock stands on the line of «ara» in
    # place of its word, on screen, telling 23:10; pressing it goes back to now
    for w, h in ((390, 844), (1440, 900)):
        page = await hero_page(browser, w, h, at="2026-09-28T21:10:00Z")
        await page.focus("#t"); await page.keyboard.press("Home"); await page.wait_for_timeout(300)
        c = await page.evaluate("""(() => { const a = document.getElementById('nowBtn'), l = document.querySelector('.nowline'), w = l?.querySelector('span');
          if(!a || !l || a.hidden) return null; const r = a.getBoundingClientRect(), s = l.getBoundingClientRect(), st = getComputedStyle(a);
          return {dx: Math.abs((r.left + r.right) / 2 - (s.left + s.right) / 2), gap: s.top - r.bottom, left: r.left, right: r.right - innerWidth,
                  word: getComputedStyle(w).visibility, name: a.getAttribute('aria-label'), h: st.getPropertyValue('--h').trim(), m: st.getPropertyValue('--m').trim()}; })()""")
        if not c: errs.append(f"{w}x{h} at 23:10, away from now: no clock on the ruler"); await page.close(); continue
        if c["dx"] > 3 or not -4 < c["gap"] < 6: errs.append(f"{w}x{h} at 23:10: the clock does not stand on the line of «ara» (off by {c['dx']:.1f} px, {c['gap']:.1f} px above it)")
        if c["left"] < 0 or c["right"] > 0: errs.append(f"{w}x{h} at 23:10: the clock leaves the screen")
        if c["word"] != "hidden": errs.append(f"{w}x{h} at 23:10: the word «ara» still shows under the clock")
        if c["name"] != "Tornar a ara": errs.append(f"{w}x{h} at 23:10: the clock is called «{c['name']}», expected «Tornar a ara» for a screen reader")
        if (c["h"], c["m"]) != ("335deg", "60deg"): errs.append(f"{w}x{h} at 23:10: the clock's hands read {c['h']} and {c['m']}, expected 335deg and 60deg")
        await page.click("#nowBtn"); await page.wait_for_timeout(300)
        back = await page.evaluate("[document.getElementById('nowBtn').hidden, getComputedStyle(document.querySelector('.nowline span')).visibility]")
        if back != [True, "visible"]: errs.append(f"{w}x{h} at 23:10: pressing the clock does not go back to now (clock hidden, word: {back})")
        await page.close()
    # at 23:30 no train is left today: tomorrow's first ones, and the board says so
    page = await hero_page(browser, at="2026-09-28T21:30:00Z")
    b = await page.evaluate(BOARD)
    want = ["AVE 05:50 el pròxim → 06:22 fins a Camp de Tarragona", "R15 06:33 després → 08:03"]
    if b["rows"] != want: errs.append(f"at 23:30 the board reads {b['rows']}, expected tomorrow's first trips {want}")
    if "Avui ja no en queden" not in b["info"]: errs.append("at 23:30 the board does not say «Avui ja no en queden · demà»")
    dia = await page.evaluate("document.querySelector('.tk .fecha')?.dataset.dia")
    if dia != "2026-09-29": errs.append(f"at 23:30, with tomorrow's trains on the board, the stub is printed with the day {dia}, expected 2026-09-29")
    errs += [f"at 23:30: {e}" for e in buy_link(b, "71801", CAMP_ID, "29/09/2026")]
    await page.close()
    return errs

# «Avui · Demà» (B3, Àlex 15-10): two tear-off calendar sheets over the ruler, hanging from one cardboard that prints
# the month in dots (drawing A, Àlex 15-10; the sheets lost their weekday, H2 18-10). The day looked at is pressed flat, the
# other raised; «Demà» shows tomorrow's train at this time of day with tomorrow's ruler, «Avui» goes back to now
DAYS = """(() => { const f = [...document.querySelectorAll('#days .full')], t = document.getElementById('t'), n = s => s.replace(/\\s+/g, ' ').trim();
  const box = e => { const r = e.getBoundingClientRect(); return {l: r.left, r: r.right, t: r.top, b: r.bottom}; };
  return {sheets: f.map(b => ({dia: b.dataset.dia, text: n(b.textContent), pressed: b.getAttribute('aria-pressed'), name: b.getAttribute('aria-label'),
            shadow: getComputedStyle(b).filter, wd: b.querySelector('.pp svg')?.dataset.t ?? null, mark: b.classList.contains('on') && getComputedStyle(b, '::after').content !== 'none', inCap: !!b.closest('#cap'), ...box(b)})),
          head: document.querySelector('#days .taco svg')?.dataset.t ?? null,
          focus: document.activeElement?.dataset?.dia ?? null, ticks: document.querySelectorAll('#ticks i').length, on: [...document.querySelectorAll('#ticks i.on')].length,
          knob: +t.value, nowline: !!document.querySelector('.nowline'), clock: !document.getElementById('nowBtn').hidden,
          dia: document.querySelector('.tk .fecha')?.dataset.dia, ara: (l => l ? box(l) : null)(document.querySelector('.nowline span')),
          track: box(document.querySelector('.track'))}; })()"""

HITS = """[...document.querySelectorAll('#days .full')].map(b => { const r = b.getBoundingClientRect(), x = r.left + r.width / 2; let n = 0;
  for(let y = r.top - 30; y < r.bottom + 30; y++) if(document.elementFromPoint(x, y)?.closest('.full') === b) n++; return n; })"""

async def check_days(browser):
    errs = []
    for w, h in ((1440, 900), (390, 844)):
        page = await hero_page(browser, w, h)
        d = await page.evaluate(DAYS)
        texts = [x["text"] for x in d["sheets"]]
        if texts != ["avui 28", "demà 29"]: errs.append(f"{w}x{h}: the day sheets read {texts}, expected «avui 28» and «demà 29»"); await page.close(); continue
        if [x["pressed"] for x in d["sheets"]] != ["true", "false"]: errs.append(f"{w}x{h}: at load «Avui» is not the sheet pressed")
        if [x["name"] for x in d["sheets"]] != ["Avui, dilluns, 28 de setembre", "Demà, dimarts, 29 de setembre"]: errs.append(f"{w}x{h}: the sheets are called {[x['name'] for x in d['sheets']]}")
        if d["head"] != "SETEMBRE 2026" or [x["wd"] for x in d["sheets"]] != [None, None]: errs.append(f"{w}x{h}: the pad prints «{d['head']}» on its cardboard and {[x['wd'] for x in d['sheets']]} on its sheets (no weekday since H2)")
        # on a phone the days are flat tabs heading the board (P2 on one line, Àlex 19-10): «Compra» is the one thing
        # raised, and the day looked at is underlined
        if w > 600 and ("drop-shadow" in d["sheets"][0]["shadow"] or "drop-shadow" not in d["sheets"][1]["shadow"]): errs.append(f"{w}x{h}: «Avui» should lie flat and «Demà» be raised (shadows {d['sheets'][0]['shadow']} / {d['sheets'][1]['shadow']})")
        if w < 600 and (not all(x["inCap"] for x in d["sheets"]) or any("drop-shadow" in x["shadow"] for x in d["sheets"]) or [x["mark"] for x in d["sheets"]] != [True, False]): errs.append(f"{w}x{h}: over the board «Avui» should be underlined and neither day raised (in the head {[x['inCap'] for x in d['sheets']]}, marks {[x['mark'] for x in d['sheets']]}, shadows {[x['shadow'] for x in d['sheets']]})")
        if w < 600:
            hits = await page.evaluate(HITS)
            if min(hits) < 44: errs.append(f"{w}x{h}: a day answers a finger over less than 44 px ({hits} px)")
        if any(x["b"] > d["track"]["t"] for x in d["sheets"]): errs.append(f"{w}x{h}: a day sheet reaches into the ruler")
        a = d["ara"]
        if a and any(x["l"] < a["r"] and a["l"] < x["r"] and x["t"] < a["b"] and a["t"] < x["b"] for x in d["sheets"]): errs.append(f"{w}x{h}: a day sheet covers «ara»")
        await page.click('#days .full[data-dia="dema"]'); await page.wait_for_timeout(400)
        d = await page.evaluate(DAYS); b = await page.evaluate(BOARD)
        if [x["pressed"] for x in d["sheets"]] != ["false", "true"] or d["focus"] != "dema": errs.append(f"{w}x{h}: after «Demà» the sheets are pressed {[x['pressed'] for x in d['sheets']]} with the focus on {d['focus']}")
        if w < 600 and [x["mark"] for x in d["sheets"]] != [False, True]: errs.append(f"{w}x{h}: after «Demà» the underlines are {[x['mark'] for x in d['sheets']]}, expected on «Demà»")
        if d["nowline"] or d["clock"]: errs.append(f"{w}x{h}: tomorrow's ruler still has «ara» or the clock on it")
        if d["dia"] != "2026-09-29" or d["knob"] != 603 or d["on"] != 1: errs.append(f"{w}x{h}: «Demà» at 10:00 shows the day {d['dia']} with the knob at {d['knob']} ({d['on']} marks on), expected tomorrow's 10:03 (603)")
        if w > 600:
            if b["rows"][0] != "R15 10:03 demà → 11:33": errs.append(f"{w}x{h}: «Demà» at 10:00, the board reads {b['rows']}, expected «R15 10:03 demà → 11:33» first")
            errs += [f"{w}x{h} «Demà»: {e}" for e in buy_link(b, SANTS_ID, REUS_TOWN, "29/09/2026")]
        # the ruler keeps to tomorrow: its last train is tomorrow's
        await page.focus("#t"); await page.keyboard.press("End"); await page.wait_for_timeout(300)
        d = await page.evaluate(DAYS)
        if d["dia"] != "2026-09-29" or d["sheets"][1]["pressed"] != "true": errs.append(f"{w}x{h}: «Demà», End on the ruler goes back to the day {d['dia']}")
        await page.click('#days .full[data-dia="avui"]'); await page.wait_for_timeout(400)
        d = await page.evaluate(DAYS)
        if d["dia"] != "2026-09-28" or not d["nowline"] or d["knob"] != 603 or d["sheets"][0]["pressed"] != "true": errs.append(f"{w}x{h}: «Avui» does not go back to now (day {d['dia']}, «ara» {d['nowline']}, knob {d['knob']})")
        await page.close()
        # at 23:30 no train is left today: the board shows tomorrow's first, and «demà» is the day pressed (Àlex 19-10);
        # pressing it again changes nothing
        page = await hero_page(browser, w, h, at="2026-09-28T21:30:00Z")
        d = await page.evaluate(DAYS)
        if [x["pressed"] for x in d["sheets"]] != ["false", "true"] or d["dia"] != "2026-09-29": errs.append(f"{w}x{h} at 23:30: with tomorrow's first train on the board ({d['dia']}) the sheets pressed are {[x['pressed'] for x in d['sheets']]}, expected «Demà»")
        await page.click('#days .full[data-dia="dema"]'); await page.wait_for_timeout(400)
        e = await page.evaluate(DAYS)
        if (e["dia"], e["knob"]) != (d["dia"], d["knob"]): errs.append(f"{w}x{h} at 23:30: pressing «Demà», already pressed, moves the train shown to {e['dia']} {e['knob']}")
        await page.close()
    return errs

# the stubs (A3, Àlex 18-10; talons.ts): what the highlighted time leads to. On a desktop «Compra» over the
# highlighted time; on a phone (P2 on one line, Àlex 19-10) heading the board at the right, the days at its left
TALONS = """(() => { const box = e => { const r = e.getBoundingClientRect(); return {l: r.left, r: r.right, t: r.top, b: r.bottom}; };
  const n = s => s.replace(/\\s+/g, ' ').trim();
  return {stubs: [...document.querySelectorAll('#talons .talo, #board .talo')].map(a => ({cls: a.classList[1], text: n(a.textContent), href: a.href, tab: a.target,
            label: a.getAttribute('aria-label'), shadow: getComputedStyle(a).filter, wrap: a.querySelector('.in').getBoundingClientRect().height, inCap: !!a.closest('#cap'), ...box(a)})),
          sheets: [...document.querySelectorAll('#days .full')].map(box), track: box(document.querySelector('.track')),
          ara: (l => l ? box(l) : null)(document.querySelector('.nowline span')), vw: innerWidth, vh: innerHeight,
          dep: box(document.getElementById('dep')), win: box(document.getElementById('win')), rows: [...document.querySelectorAll('#board .trip')].map(box),
          sub: getComputedStyle(document.querySelector('.sub')).display, lbl: getComputedStyle(document.getElementById('lbl')).display,
          route: box(document.querySelector('.tk .route')), tk: box(document.querySelector('.tk')), onTicket: !!document.querySelector('.tk #days'),
          fecha: getComputedStyle(document.querySelector('.tk .fecha')).display, taco: getComputedStyle(document.querySelector('#days .taco')).display,
          avisa: [...document.querySelectorAll('.avisa')].filter(a => !a.closest('#detalle')).length,
          rem: parseFloat(getComputedStyle(document.documentElement).fontSize)}; })()"""

def overlap(a, b): return a["l"] < b["r"] and b["l"] < a["r"] and a["t"] < b["b"] and b["t"] < a["b"]

async def check_talons(browser):
    """The stubs (A3, Àlex 18-10): «Compra», Renfe’s search for the train shown. On a desktop just over the
    highlighted time, clear of the window (Àlex 18-10). On a phone the window first (P2 on one line, Àlex 19-10;
    ventanilla/filosofias.md): no subtitle, the board one line, and «Compra» heading it at the right, the days at its
    left, both above the highlighted time; the one thing raised, and no «Avisa» on the wall (it stays in the train's
    sheet). The ticket as it was, with its printed date. Raised, on one line, a finger big, inside the screen and clear
    of what is around it, from 320 px to the phone held sideways. On a 390 × 726 phone (an iPhone with Safari's bars)
    the window is at least 265 px tall, as before the day pad, day and night."""
    errs = []
    for w, h in ((1440, 900), (1280, 800), (1920, 1080), (390, 844), (390, 726), (360, 740), (320, 568), (844, 390)):
        page = await hero_page(browser, w, h)
        t = await page.evaluate(TALONS); phone = w < 600 or h < 500
        if [x["text"] for x in t["stubs"]] != ["Compra"]: errs.append(f"{w}x{h}: the stubs read {[x['text'] for x in t['stubs']]}, expected «Compra» alone"); await page.close(); continue
        c = t["stubs"][0]
        if "venta.renfe.com" not in c["href"] or c["tab"] != "_blank" or "Renfe" not in (c["label"] or ""): errs.append(f"{w}x{h}: «Compra» is not a link to Renfe in a new tab ({c})")
        if "drop-shadow" not in c["shadow"]: errs.append(f"{w}x{h}: «Compra» is not raised ({c['shadow']})")
        if c["wrap"] > 3.2 * t["rem"] + 2: errs.append(f"{w}x{h}: «Compra» breaks in two lines ({c['wrap']:.0f} px)")
        if c["l"] < 0 or c["r"] > t["vw"] or c["b"] > t["vh"]: errs.append(f"{w}x{h}: «Compra» leaves the screen ({c})")
        for name, o in [("the window", t["win"])] + [("a row of the board", y) for y in t["rows"]] + [("the ruler", t["track"]), ("«ara»", t["ara"])]:
            if o and overlap(c, o): errs.append(f"{w}x{h}: «Compra» covers {name}")
        d = t["dep"]
        if t["avisa"]: errs.append(f"{w}x{h}: «Avisa» is on the wall (it stays in the train's sheet)")
        if t["onTicket"] or t["fecha"] == "none": errs.append(f"{w}x{h}: the ticket lost its printed date or holds the days")
        if not phone:
            if c["inCap"]: errs.append(f"{w}x{h}: a desktop has «Compra» heading the board")
            if c["b"] > d["t"] + 2 or d["t"] - c["b"] > 3 * t["rem"] or c["l"] >= d["r"] or d["l"] >= c["r"]:
                errs.append(f"{w}x{h}: «Compra» is not just over the time (stub {c['l']:.0f}–{c['r']:.0f} × {c['t']:.0f}–{c['b']:.0f}, time {d['l']:.0f}–{d['r']:.0f} from {d['t']:.0f})")
            if t["taco"] == "none": errs.append(f"{w}x{h}: a desktop lost its day pad")
        else:
            sh, rows = t["sheets"], t["rows"]
            if len(rows) != 1: errs.append(f"{w}x{h}: the phone's board has {len(rows)} rows, expected the highlighted time alone")
            if not c["inCap"]: errs.append(f"{w}x{h}: «Compra» does not head the board")
            # the days at the left, «Compra» at the right, on one line over the highlighted time
            elif max(x["r"] for x in sh) > c["l"] or any(x["b"] < c["t"] or x["t"] > c["b"] for x in sh) or c["b"] > rows[0]["t"] + 2 or c["r"] < rows[0]["r"] - 3 * t["rem"]:
                errs.append(f"{w}x{h}: the days and «Compra» do not head the board on one line (days {sh}, stub {c}, row {rows[0]})")
            if t["taco"] != "none": errs.append(f"{w}x{h}: a phone still hangs the day pad")
            if w < 600 and h > 500 and t["sub"] != "none": errs.append(f"{w}x{h}: a phone still has the subtitle")
            if t["lbl"] != "none": errs.append(f"{w}x{h}: a phone still has the label over the board")
            if c["r"] - c["l"] < 44: errs.append(f"{w}x{h}: «Compra» is narrower than a finger ({c['r'] - c['l']:.0f} px)")
            hits = await page.evaluate("""(a => { const r = a.getBoundingClientRect(), x = r.left + r.width / 2; let n = 0;
              for(let y = r.top - 30; y < r.bottom + 30; y++) if(document.elementFromPoint(x, y)?.closest('.talo') === a) n++; return n; })(document.querySelector('#cap .talo'))""")
            if hits < 44: errs.append(f"{w}x{h}: «Compra» answers a finger over {hits} px of height, under 44")
            if overlap(t["tk"], t["win"]): errs.append(f"{w}x{h}: the ticket covers the window")
            if t["win"]["b"] - t["win"]["t"] < 120: errs.append(f"{w}x{h}: the window is a slit ({t['win']['b'] - t['win']['t']:.0f} px tall)")
        await page.close()
    # the window first: on a 390 × 726 phone at least as tall as before the day pad (265 px), day and night
    for at in ("2026-09-28T08:00:00Z", "2026-09-28T21:30:00Z"):
        page = await hero_page(browser, 390, 726, at=at)
        win = await page.evaluate("document.getElementById('win').getBoundingClientRect().height")
        if win < 265: errs.append(f"390x726 at {at}: the window is {win:.0f} px tall, under 265")
        await page.close()
    # a long town name breaks the ticket's route in two lines: the ticket stays on the screen
    for w, h in ((390, 844), (320, 568), (844, 390)):
        page = await hero_page(browser, w, h)
        e = await choose_town(page, "R16", "65420"); await page.wait_for_timeout(600)
        if e: errs += [f"{w}x{h}: {x}" for x in e]
        else:
            r = await page.evaluate("(() => ({tk: document.querySelector('.tk').getBoundingClientRect().right, vw: innerWidth}))()")
            if r["tk"] > r["vw"]: errs.append(f"{w}x{h}, L'Hospitalet de l'Infant: the ticket leaves the screen (to {r['tk']:.0f} of {r['vw']})")
        await page.close()
    # late in the evening «ara» and the station clock stand at the ruler's right end, early in the morning at its left
    # end: «Compra» keeps clear of them
    for w, h, at in ((1440, 900, "2026-09-28T20:00:00Z"), (1440, 900, "2026-09-28T21:00:00Z"), (390, 844, "2026-09-28T04:30:00Z"),
                     (320, 568, "2026-09-28T04:30:00Z"), (390, 844, "2026-09-28T21:00:00Z"), (844, 390, "2026-09-28T04:30:00Z")):
        page = await hero_page(browser, w, h, at=at)
        for clock in (False, True):
            if clock: await page.focus("#t"); await page.keyboard.press("Home"); await page.wait_for_timeout(300)
            t = await page.evaluate(TALONS)
            o = await page.evaluate("(e => e && !e.hidden ? (r => ({l: r.left, r: r.right, t: r.top, b: r.bottom}))(e.getBoundingClientRect()) : null)(document.getElementById('nowBtn'))")
            for x in t["stubs"]:
                for name, b in (("«ara»", t["ara"]), ("the station clock", o)) + tuple(("a row of the board", y) for y in t["rows"]):
                    if b and overlap(x, b): errs.append(f"{w}x{h} at {at}: «{x['text']}» covers {name}")
        await page.close()
    return errs

BOARD = """(() => { const n = s => s.replace(/\\s+/g, ' ').trim(), rows = [...document.querySelectorAll('#board .trip')];
  // the big train's route (desktop) is for the eye only, read by check_journey; the stub «Compra» (A3, Àlex 18-10)
  // is the way to Renfe, the time is only a time
  const text = r => { const c = r.cloneNode(true); c.querySelectorAll('.rec').forEach(x => x.remove()); return n(c.textContent); };
  const word = document.querySelector('.talo.compra'), q = word?.href ? new URL(word.href).searchParams : null;
  return {rows: rows.map(text), buy: q && {from: q.get('cdgoOrigen'), to: q.get('cdgoDestino'), day: q.get('FechaIdaSel'), host: new URL(word.href).host, query: Object.fromEntries(q),
            tab: word.target === '_blank', label: word.getAttribute('aria-label') ?? word.textContent}, boardLink: !!document.querySelector('#board a[href]:not(.talo)'), buttons: rows.map(r => r.matches('button.tt')), dep: document.getElementById('dep')?.textContent,
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
    if r["now"] != "ara": errs.append(f"the ruler's now mark reads «{r['now']}», expected a thin line with «ara»")
    elif abs(r["nowAt"] - (600 - 300) / (1439 - 300) * 100) > .1: errs.append(f"«ara» stands at {r['nowAt']}%, not at 10:00")
    import re
    if re.search(r"\d\d:\d\d|Son las|Són les|Ahora|Ara", r["head"]): errs.append(f"the ruler still has a heading with the time: «{r['head']}»")
    await page.focus("#t")
    steps = [("End", "22:03", "tren de les 22:03"), ("ArrowLeft", "21:33", "tren de les 21:33"), ("Home", "05:50", "AVE de les 05:50"),
             ("ArrowRight", "06:33", "tren de les 06:33"), ("ArrowLeft", "05:50", "AVE de les 05:50")]
    for key, dep, text in steps:
        await page.keyboard.press(key); await page.wait_for_timeout(250)
        r = await page.evaluate(RULER)
        if r["dep"] != dep or r["text"] != text: errs.append(f"{key} on the ruler shows {r['dep']} («{r['text']}»), expected {dep} («{text}»)")
    if r["knob"] != 350: errs.append(f"with the 05:50 AVE shown the knob stands at minute {r['knob']}, expected 350")
    await page.click("#nowBtn"); await page.wait_for_timeout(300)
    return errs

def luminance(rgb):
    """WCAG relative luminance of an sRGB colour."""
    f = lambda v: v / 12.92 if v <= .03928 else ((v + .055) / 1.055) ** 2.4
    r, g, b = (f(v / 255) for v in rgb[:3]); return .2126 * r + .7152 * g + .0722 * b

HOURS = """(() => { const row = document.querySelector('.hours'), c = getComputedStyle(row).color.match(/\\d+/g).map(Number);
  const box = e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
  return {color: c, row: box(row), labels: [...row.querySelectorAll('span')].map(box)}; })()"""

async def check_ruler_foot(browser):
    """The foot of the hero: the ruler's hours read against the painted wall at its brightest (10:00, AA: 4.5:1, the
    foot of the wall in shadow), and on a phone the hours and «Què és» keep clear of the safe area at the
    bottom (Àlex, 09-10, option A)."""
    errs = []
    for w, h in ((390, 844), (1440, 900)):
        page = await hero_page(browser, w, h); await page.wait_for_timeout(1500)
        g = await page.evaluate(HOURS)
        shot = Image.open(io.BytesIO(await page.screenshot())).convert("RGB")
        # the wall between the labels (clear of their soft shadow), its brighter pixels: the paper's grain varies
        x0, y0, x1, y1 = g["row"]; pad = 4
        wall = sorted(luminance(shot.getpixel((x, y))) for x in range(max(0, int(x0)), min(w, int(x1)), 2) for y in range(int(y0), int(y1), 2)
                      if not any(l - pad <= x <= r + pad for l, _, r, _ in g["labels"]))
        if not wall: errs.append(f"{w}x{h}: no wall to read between the ruler's hours"); await page.close(); continue
        bright = wall[int(.9 * len(wall)) - 1]
        ratio = (luminance(g["color"]) + .05) / (bright + .05)
        if ratio < 4.5: errs.append(f"{w}x{h} at 10:00: the ruler's hours stand at {ratio:.1f}:1 against the wall, AA needs 4.5:1")
        await page.close()
    # on a phone the foot keeps clear of the safe area Safari reports: Chromium has none, so read the rule itself
    page = await hero_page(browser, 390, 844)
    safe = await page.evaluate("""[...document.styleSheets].filter(s => !s.href || s.href.startsWith(location.origin)).flatMap(s => [...s.cssRules]).some(function has(r){
      // a style rule has cssRules too (nesting): look at its own style first
      return r.selectorText === '.stage' && /env\\(safe-area-inset-bottom/.test(r.style.paddingBottom) || [...(r.cssRules || [])].some(has); })""")
    if not safe: errs.append("on a phone the hero's foot does not keep clear of env(safe-area-inset-bottom)")
    await page.close()
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
    b = await expect("at 10:00", ["R15 10:03 el pròxim, en 3 min → 11:33", "R15 11:03 després → 12:33"], "10:03", "en 3 min")
    for word in ("Pròxim", "Després", "Anterior", "Tren triat"):
        if word in b["info"]: errs.append(f"the board still says «{word}»")
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    # the big train is the first to leave, AVE included
    await expect("at 10:00, Reus → Sants", ["AVE 10:30 el pròxim, en 30 min → 11:11 des de Camp de Tarragona", "R15 10:36 després → 12:07"], "10:30", "en 30 min", ("04104", "71801", "28/09/2026"))
    async def choose(time):
        ok = await page.evaluate(f"(() => {{ const b = [...document.querySelectorAll('#board button.tt')].find(b => b.querySelector('.t').textContent === '{time}'); if(b) b.click(); return !!b; }})()")
        await page.wait_for_timeout(300); return ok
    if not await choose("10:36"): return errs + ["the R15 at 10:36 is not a button"]
    await expect("after choosing the 10:36", ["R15 10:36 el pròxim → 12:07", "AVE 11:00 després → 11:44 des de Camp de Tarragona"], "10:36", "", ("71400", "71801", "28/09/2026"))
    await page.click("#nowBtn"); await page.wait_for_timeout(300)
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    if not await choose("11:03"): return errs + ["the R15 at 11:03 is not a button"]
    await expect("after choosing the 11:03", ["R15 11:03 el pròxim → 12:33", "AVE 12:00 després → 12:31 fins a Camp de Tarragona"], "11:03", "")
    if not await choose("12:00"): return errs + ["the AVE at 12:00 is not a button"]
    b = await expect("after choosing the AVE", ["AVE 12:00 el pròxim → 12:31 fins a Camp de Tarragona", "R14 12:03 després → 13:33"], "12:00", "", ("71801", "04104", "28/09/2026"))
    if "AVE" not in b["aviso"] or "Camp de Tarragona" not in b["aviso"]: errs.append(f"choosing the AVE, the live region does not say it is an AVE to Camp de Tarragona («{b['aviso']}»)")
    await page.click("#nowBtn"); await page.wait_for_timeout(300)
    return errs

RENFE_FIELDS = {"adultos_": "1", "ninos_": "0", "ninosMenores": "0", "tipoBusqueda": "autocomplete",
                "currenLocation": "menuBusqueda", "vengoderenfecom": "SI"}

def buy_link(b, frm, to, day):
    """The stub «Compra» opens Renfe's search for the train shown, its trip and day, in a new tab (src/buy.ts); the
    time itself is not a link (Àlex 18-10)."""
    k = b.get("buy")
    if not k: return ["the stub «Compra» is not a link to Renfe"]
    errs = ["the board still links to Renfe (the stub «Compra» is the way there)"] if b.get("boardLink") else []
    if k["host"] != "venta.renfe.com": errs.append(f"the buy link goes to {k['host']}, expected venta.renfe.com")
    if (k["from"], k["to"], k["day"]) != (f"0071,{frm},{frm}", f"0071,{to},{to}", day):
        errs.append(f"the buy link searches {k['from']} → {k['to']} on {k['day']}, expected {frm} → {to} on {day}")
    # without these renfe.com answers E500 to a first visit, or shows a returning visitor their previous search
    missing = [f for f, v in RENFE_FIELDS.items() if k["query"].get(f) != v]
    if missing: errs.append(f"the buy link lacks the fields Renfe needs to search ({', '.join(missing)}): «{k['query']}»")
    if not k["tab"]: errs.append("the stub «Compra» does not open in a new tab")
    if "Renfe" not in (k["label"] or ""): errs.append(f"the stub's label does not say it buys on Renfe («{k['label']}»)")
    return errs

TICKET = """(() => { const t = [...document.querySelectorAll('#tickets .tk')], sw = document.querySelector('.tk .swap');
  return {n: t.length, text: t[0] ? t[0].textContent.replace(/\\s+/g, ' ').trim() : '', route: [...(t[0]?.querySelector('.route')?.children ?? [])].map(b => b.matches('.swap') ? '→' : b.textContent.trim()).join(' '),
          swap: sw ? sw.querySelectorAll('svg.fletxes path').length : null, dia: t[0]?.querySelector('.fecha')?.dataset.dia, focus: document.activeElement === sw, aviso: document.getElementById('aviso').textContent}; })()"""

async def check_hero_ticket(page):
    """One ticket with both ends; → turns the trip around and keeps the focus."""
    errs = []
    t = await page.evaluate(TICKET)
    if t["n"] != 1: return [f"{t['n']} tickets in the hero, expected one"]
    if not t["text"].startswith("Bitllet"): errs.append(f"the ticket reads «{t['text']}», expected «Bitllet …»")
    if t["route"] != "Sants → Reus": errs.append(f"the ticket's route reads «{t['route']}», expected «Sants → Reus»")
    if t["swap"] != 3: return errs + [f"the ticket's swap (.tk .swap) is not the three arrows of a printed ticket ({t['swap']} drawn)"]
    if t["dia"] != "2026-09-28": errs.append(f"the stub is printed with the day {t['dia']}, expected 2026-09-28 (today)")
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    t = await page.evaluate(TICKET)
    if t["route"] != "Reus → Sants": errs.append(f"after the arrows the route reads «{t['route']}», expected «Reus → Sants»")
    if not t["focus"]: errs.append("after the arrows the focus is not on them any more")
    if "a Barcelona Sants" not in t["aviso"]: errs.append(f"after the arrows the live region does not name the new trip («{t['aviso'][:80]}»)")
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    t = await page.evaluate(TICKET)
    if t["route"] != "Sants → Reus": errs.append(f"the arrows twice do not bring the trip back («{t['route']}»)")
    return errs

# --- 3.3 · the town selector ---------------------------------------------------------------------------------
# eligible network stations (spec-3.3.md, decision 2): everything in the frozen timetable except Barcelona's own
# stops, Camp de Tarragona (AVE only) and the three Barcelona-area stations the selector leaves out
EXCLUDED_TOWNS = {"71707", "72400", "71708", "04104"}
SANTS_ID, CAMP_ID, REUS_TOWN, GIRONA_TOWN, TARRAGONA_TOWN, LLEIDA_TOWN = "71801", "04104", "71400", "79300", "71500", "78400"

def _net():
    import json
    return json.loads((root / "scripts/baseline/red.json").read_text())

_BOTH_WAYS = None
def _both_ways():
    """Stations with a direct train from a Barcelona station and one back (12-10: Cerbère only had trains out)."""
    global _BOTH_WAYS
    if _BOTH_WAYS is None:
        net = _net()
        bcn = {sid for sid, info in net["estaciones"].items() if info.get("barcelona")}
        out, back = set(), set()
        for t in net["trenes"]:
            ids = [s[0] for s in t["s"]]
            at = [i for i, sid in enumerate(ids) if sid in bcn]
            if at:
                out |= set(ids[at[-1] + 1:]); back |= set(ids[:at[0]])
        _BOTH_WAYS = out & back
    return _BOTH_WAYS

def _eligible(sid, info):
    return sid not in EXCLUDED_TOWNS and not info.get("barcelona") and sid in _both_ways()

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

def _stops(net, day, frm, to, dep):
    """The stops of the direct train that leaves `frm` at `dep` for `to`, both left out, as the big train's route
    labels them (mirrors src/time.ts's stopsBetween() and stopName()): «Altafulla», and the minute each is reached
    (the route shows names only since 09-10; the time is the dot's place on the line)."""
    import re
    def label(sid):
        n = re.sub(r"\s*-\s*(?=[A-ZÀ-Ý]).*$", "", re.sub(r"^Barcelona[- ](Estació de )?", "", net["estaciones"][sid]["nombre"]))
        return re.sub(r" de .*$", "", n) if len(n) > 16 else n
    for i in net["dias"].get(day, []):
        t = net["trenes"][i]; ids = [s[0] for s in t["s"]]
        if frm in ids and to in ids and ids.index(frm) < ids.index(to) and t["s"][ids.index(frm)][2] == dep:
            a, b = ids.index(frm), ids.index(to)
            return [label(s[0]) for s in t["s"][a + 1:b]], [s[1] % 1440 for s in t["s"][a + 1:b]], t["s"][a][2], t["s"][b][1]
    return None

JOURNEY = """(() => { const rec = document.querySelector('#board .trip.big .rec'); if(!rec) return null;
  const box = e => { const r = e.getBoundingClientRect(); return {l: r.left, r: r.right, t: r.top, b: r.bottom}; };
  const shown = [...rec.querySelectorAll('.s')].filter(s => !s.hidden), fold = rec.querySelector('.pleg');
  return {dots: [...rec.querySelectorAll('i')].map(i => parseFloat(i.style.left)), labels: [...rec.querySelectorAll('.s:not(.pleg)')].map(s => s.textContent),
          folded: rec.classList.contains('plegat'), fold: fold && !fold.hidden ? {text: fold.textContent, title: fold.title} : null,
          bare: [...rec.querySelectorAll('i')].map(i => i.hidden), full: [...rec.querySelectorAll('i')].map(i => i.dataset.n),
          tram: getComputedStyle(rec.querySelector('.tram')).display,
          shown: shown.map(s => ({text: s.textContent, side: s.classList.contains('up') ? 'up' : s.classList.contains('down') ? 'down' : '', ...box(s)})),
          titles: [...rec.querySelectorAll('i')].map(i => i.title), rec: box(rec), off: rec.classList.contains('off'), hidden: rec.getAttribute('aria-hidden'),
          win: box(document.getElementById('win')), lead: box(document.querySelector('#board .big .lead')), arr: box(document.querySelector('#board .big .arr'))}; })()"""

async def check_journey(browser):
    """The big train's route (Àlex 08-10, option A, only on a desktop): in the gap between «compra’l ↗» and the
    arrival, a line with a dot per stop placed by the time the train reaches it, and each stop's name above or below
    its dot, without its time (Àlex 09-10: the dot's place already says it). When not every name fits, the line folds (Àlex 08-10, option B): the first two stops and the
    last two keep their names, the stops between lose their dots under a dotted stretch with «· N parades ·» over it
    (the folded stops as its tooltip). Labels never overlap each other, the board's words, the arrival or the window.
    No route for the AVE (no stops) nor on a phone."""
    errs, net, day = [], _net(), "2026-09-28"
    def judge(when, j, want, folded):
        if j is None: errs.append(f"{when}: the big train has no route (.rec)"); return
        names, mins, d0, a0 = want
        if j["hidden"] != "true": errs.append(f"{when}: the route is not aria-hidden")
        if j["off"]: errs.append(f"{when}: the route is hidden for lack of room")
        if j["labels"] != names: errs.append(f"{when}: the route's stops are {j['labels']}, expected {names}")
        at = [round((m - d0) % 1440 / (a0 - d0) * 100, 1) for m in mins]
        if [round(x, 1) for x in j["dots"]] != at: errs.append(f"{when}: the dots stand at {j['dots']}%, expected {at}% (by the time of each stop)")
        n, texts = len(names), [s["text"] for s in j["shown"]]
        if j["folded"] != folded: errs.append(f"{when}: the line is {'folded' if j['folded'] else 'not folded'}, expected {'folded' if folded else 'every stop named'}")
        elif not folded:
            if texts != names: errs.append(f"{when}: the labels shown are {texts}, expected every stop {names}")
            if any(j["bare"]) or j["fold"] or j["tram"] != "none": errs.append(f"{when}: unfolded, yet a dot is hidden or the fold shows")
        else:
            # two names at each end when they fit, else one; the fold's word anywhere among them
            k = (len(texts) - 1) // 2; want_fold = f"· {n - 2 * k} parades ·"
            if k < 1 or sorted(texts) != sorted(names[:k] + [want_fold] + names[n - k:]):
                errs.append(f"{when}: folded, the labels shown are {texts}, expected the first and last one or two stops and «· N parades ·»")
            elif j["bare"] != [False] * k + [True] * (n - 2 * k) + [False] * k: errs.append(f"{when}: folded, the hidden dots are {j['bare']}, expected only the {n - 2 * k} in the fold")
            elif j["fold"]["title"] != ", ".join(j["full"][k:n - k]): errs.append(f"{when}: the fold's tooltip is {j['fold']['title']!r}, expected the folded stops")
            if j["tram"] == "none": errs.append(f"{when}: folded, but no dotted stretch")
        if any(j["titles"]): errs.append(f"{when}: a dot has a tooltip although its stop is named or folded")
        cut = lambda p, q: p["l"] < q["r"] - .5 and q["l"] < p["r"] - .5 and p["t"] < q["b"] - .5 and q["t"] < p["b"] - .5
        for i, p in enumerate(j["shown"]):
            if not p["side"]: errs.append(f"{when}: «{p['text']}» is shown on neither side")
            if p["l"] < j["rec"]["l"] - .5 or p["r"] > j["rec"]["r"] + .5: errs.append(f"{when}: «{p['text']}» leaves the route's line")
            for name in ("win", "lead", "arr"):
                if cut(p, j[name]): errs.append(f"{when}: «{p['text']}» overlaps {name}")
            for q in j["shown"][i + 1:]:
                if cut(p, q): errs.append(f"{when}: «{p['text']}» overlaps «{q['text']}»")
    # at 10:00, Sants → Reus: the R15 at 10:03, every stop labelled
    page = await hero_page(browser)
    judge("Sants → Reus at 10:00", await page.evaluate(JOURNEY), _stops(net, day, SANTS_ID, REUS_TOWN, 603), False)
    # Reus → Sants: the AVE from Camp de Tarragona is the big train, and has no stops
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    if await page.evaluate(JOURNEY) is not None: errs.append("the AVE (no stops between Camp de Tarragona and Sants) has a route")
    await page.close()
    # a long train on a small desktop: Lleida (the R14 at 12:03, 13 stops), at 1024 × 768: folded
    page = await hero_page(browser, 1024, 768)
    e = await choose_town(page, "R13", LLEIDA_TOWN)
    if e: errs += e
    else:
        await page.wait_for_timeout(300)
        dep = await page.evaluate("document.getElementById('dep').textContent")
        want = _stops(net, day, SANTS_ID, LLEIDA_TOWN, int(dep[:2]) * 60 + int(dep[3:]))
        if not want: errs.append(f"Lleida: no direct train at {dep} in the frozen timetable")
        else: judge(f"Sants → Lleida {dep} at 1024x768", await page.evaluate(JOURNEY), want, True)
    await page.close()
    # a phone has no room for it (6B): its board keeps only the times
    page = await hero_page(browser, 390, 844)
    if await page.evaluate("!!document.querySelector('#board .rec')"): errs.append("the phone's board has a route")
    await page.close()
    return errs

WAGON = """(() => { const rec = document.querySelector('#board .trip.big .rec'), v = rec?.querySelector('.vago');
  const box = e => { const r = e.getBoundingClientRect(); return {l: r.left, r: r.right, t: r.top, b: r.bottom}; };
  if(!v) return {wagon: null};
  return {wagon: {...box(v), svg: !!v.querySelector('svg'), label: v.getAttribute('aria-hidden') || rec.getAttribute('aria-hidden')}, rec: box(rec),
          shown: [...rec.querySelectorAll('.s')].filter(s => !s.hidden).map(s => ({text: s.textContent, ...box(s)})),
          win: box(document.getElementById('win'))}; })()"""

async def check_wagon(browser):
    """Where the train shown is now (Àlex 10-10): a paper wagon on its route (option A), only while the train is on
    its way («solo en marcha»): none for the next train, still to leave. Placed by the timetable, its middle at the
    share of the trip already gone, its wheels on the line; the name it would cover climbs over it, so no name is lost
    and none overlaps the wagon, another name or the window. On a phone, the train's sheet draws the same thing
    simplified (option A): the line between its two ends with the wagon, and «Ara entre … i …» under it. The board
    says «ja ha sortit» of a train shown that has left, where it says «el pròxim» of the next one."""
    errs, net, day = [], _net(), "2026-09-28"
    names, mins, d0, a0 = _stops(net, day, SANTS_ID, REUS_TOWN, 543)
    pts = [("Sants", d0)] + list(zip(names, mins)) + [("Reus", a0)]
    now = 600
    i = max(k for k, (_, m) in enumerate(pts) if m <= now)
    words = f"Ara a {pts[i][0]}" if pts[i][1] == now else f"Ara entre {pts[i][0]} i {pts[i + 1][0]}"
    share = (now - d0) / (a0 - d0)
    pick = "(() => { const t = document.getElementById('t'); t.value = 543; t.dispatchEvent(new Event('change')); })()"
    lead = "document.querySelector('#board .trip.big .nx')?.textContent.trim()"
    page = await hero_page(browser)
    if (await page.evaluate(WAGON))["wagon"]: errs.append("the next train, still at Sants, has a wagon on its route")
    if (t := await page.evaluate(lead)) != "el pròxim,": errs.append(f"the next train's board says «{t}», expected «el pròxim,»")
    await page.evaluate(pick); await page.wait_for_timeout(400)
    # fitJourney places the names on a later frame, and software rendering gives few frames: wait until they are spread
    try: await page.wait_for_function("new Set([...document.querySelectorAll('#board .trip.big .rec .s')].filter(s => !s.hidden).map(s => Math.round(s.getBoundingClientRect().left))).size > 1", timeout=CLICK_MS)
    except Exception: pass
    # a train that has already left is not «el pròxim» (Àlex 10-10)
    if (t := await page.evaluate(lead)) != "ja ha sortit": errs.append(f"the 09:03, gone at 10:00, says «{t}» on the board, expected «ja ha sortit»")
    j = await page.evaluate(WAGON)
    w = j["wagon"]
    if not w: errs.append("the 09:03, on its way at 10:00, has no wagon on its route")
    else:
        if not w["svg"]: errs.append("the wagon is not a drawing (svg)")
        if w["label"] != "true": errs.append("the wagon is not hidden from screen readers")
        mid, want = (w["l"] + w["r"]) / 2, j["rec"]["l"] + share * (j["rec"]["r"] - j["rec"]["l"])
        if abs(mid - want) > 2: errs.append(f"the wagon's middle is at {mid:.0f}px, expected {want:.0f}px ({share:.0%} of the trip, by the timetable)")
        if abs(w["b"] - (j["rec"]["t"] + j["rec"]["b"]) / 2) > 3: errs.append(f"the wagon's wheels are not on the line (bottom {w['b']:.0f}, line {(j['rec']['t'] + j['rec']['b']) / 2:.0f})")
        cut = lambda p, q: p["l"] < q["r"] - .5 and q["l"] < p["r"] - .5 and p["t"] < q["b"] - .5 and q["t"] < p["b"] - .5
        texts = [s["text"] for s in j["shown"]]
        if texts != names: errs.append(f"with the wagon, the names shown are {texts}, expected every stop {names}")
        for k, p in enumerate(j["shown"]):
            if cut(p, w): errs.append(f"«{p['text']}» overlaps the wagon")
            if cut(p, j["win"]): errs.append(f"«{p['text']}» overlaps the window")
            for q in j["shown"][k + 1:]:
                if cut(p, q): errs.append(f"«{p['text']}» overlaps «{q['text']}»")
    await page.close()
    # a phone: the sheet of the train shown
    page = await hero_page(browser, 390, 844)
    await page.click("#board button.big"); await page.wait_for_timeout(500)
    if await page.evaluate("!!document.querySelector('#detalle .viatge')"): errs.append("phone: the next train's sheet has a wagon")
    await page.keyboard.press("Escape"); await page.wait_for_timeout(300)
    await page.evaluate(pick); await page.wait_for_timeout(400)
    await page.click("#board button.big"); await page.wait_for_timeout(500)
    s = await page.evaluate("""(() => { const v = document.querySelector('#detalle .viatge'); if(!v) return null;
      const via = v.querySelector('.via').getBoundingClientRect(), w = v.querySelector('.vago')?.getBoundingClientRect();
      return {ends: [...v.querySelectorAll('.ends span')].map(e => e.textContent), ara: v.querySelector('.ara')?.textContent,
              mid: w ? (w.left + w.right) / 2 : null, l: via.left, r: via.right, hidden: v.querySelector('.via').getAttribute('aria-hidden')}; })()""")
    if not s: errs.append("phone: the sheet of the 09:03, on its way, has no line with its wagon")
    else:
        if s["ends"] != ["Sants", "Reus"]: errs.append(f"phone: the sheet's line ends at {s['ends']}, expected ['Sants', 'Reus']")
        if s["ara"] != words: errs.append(f"phone: the sheet says {s['ara']!r}, expected {words!r}")
        if s["mid"] is None or abs(s["mid"] - (s["l"] + share * (s["r"] - s["l"]))) > 2: errs.append(f"phone: the wagon stands at {s['mid']}, expected {share:.0%} along the line")
        if s["hidden"] != "true": errs.append("phone: the drawn line is not hidden from screen readers (the words say it)")
    await page.close()
    return errs

TOWN = """(() => { const b = document.querySelector('.tk .town'); if(!b) return null;
  return {tag: b.tagName, text: b.textContent.trim(), haspopup: b.getAttribute('aria-haspopup'),
          style: getComputedStyle(b).textDecorationLine, raised: getComputedStyle(b).textShadow, label: b.getAttribute('aria-label') || '',
          route: [...(document.querySelector('.tk .route')?.children ?? [])].map(b => b.matches('.swap') ? '→' : b.textContent.trim()).join(' ')}; })()"""

async def check_town_ticket(page):
    """The town on the ticket: a button that opens the selector, raised like every interactive text (an offset
    shadow, no underline), with an
    accessible name starting with the town's own name; the route still reads «Sants → Reus»."""
    t = await page.evaluate(TOWN)
    if not t: return ["'.tk .town' is missing"]
    errs = []
    if t["tag"] != "BUTTON": errs.append(f".tk .town is a {t['tag']}, expected a button")
    if t["text"] != "Reus": errs.append(f".tk .town reads «{t['text']}», expected «Reus»")
    if t["haspopup"] != "dialog": errs.append(f".tk .town aria-haspopup is «{t['haspopup']}», expected «dialog»")
    if t["style"] != "none": errs.append(f".tk .town is underlined ({t['style']}): what you can press is raised, not underlined")
    if t["raised"] in ("", "none"): errs.append(".tk .town has no offset shadow: what you can press stands off the paper")
    if not t["label"].startswith("Reus"): errs.append(f".tk .town accessible name is «{t['label']}», expected to start with «Reus»")
    if t["route"] != "Sants → Reus": errs.append(f".tk .route reads «{t['route']}», expected «Sants → Reus»")
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
        if got["h3"] != "On vas?": errs.append(f"#selp's question reads «{got['h3']}», expected «On vas?»")
        if not got["focusedFirst"]: errs.append("the focus is not on the first .ln when the selector opens")
    await page.keyboard.press("Escape"); await page.wait_for_timeout(300)
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    e = await open_town(page)
    if e: errs += e
    else:
        h3 = await page.evaluate("document.querySelector('#selp h3')?.textContent.trim()")
        if h3 != "D’on tornes?": errs.append(f"with the direction swapped, #selp's question reads «{h3}», expected «D’on tornes?»")
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
    page = await hero_page(browser)
    errs = await choose_town(page, "R11", GIRONA_TOWN)
    if errs: await page.close(); return errs
    await page.wait_for_timeout(300)
    if await page.evaluate("document.getElementById('selp')?.open"): errs.append("#selp is still open after choosing Girona")
    route = await page.evaluate("[...(document.querySelector('.tk .route')?.children ?? [])].map(b => b.matches('.swap') ? '→' : b.textContent.trim()).join(' ')")
    if route != "Sants → Girona": errs.append(f"after choosing Girona the route reads «{route}», expected «Sants → Girona»")
    if not await page.evaluate("document.activeElement === document.querySelector('.tk .town')"): errs.append("the focus is not on .tk .town after choosing Girona")
    b = await page.evaluate(BOARD); r = await page.evaluate(RULER)
    # the words of each row and the ruler's count are scripts/test/board.test.ts's; here, that the page paints them
    want = ["R11 10:16 el pròxim, en 16 min → 11:35", "R11 11:16 després → 12:47"]
    if b["rows"] != want: errs.append(f"after choosing Girona the board reads {b['rows']}, expected {want}")
    if any("AVE" in row for row in b["rows"]): errs.append("Girona has no AVE, but the board shows one")
    total = 23
    if r["ticks"] != total: errs.append(f"the ruler has {r['ticks']} ticks, expected {total} (the day's direct R11 Sants→Girona trains)")
    if "Girona" not in b["aviso"]: errs.append(f"choosing Girona, the live region does not name it («{b['aviso'][:80]}»)")
    errs += buy_link(b, SANTS_ID, GIRONA_TOWN, "28/09/2026")
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    route = await page.evaluate("[...(document.querySelector('.tk .route')?.children ?? [])].map(b => b.matches('.swap') ? '→' : b.textContent.trim()).join(' ')")
    if route != "Girona → Sants": errs.append(f"after the arrows the route reads «{route}», expected «Girona → Sants»")
    b = await page.evaluate(BOARD)
    want = ["R11 10:19 el pròxim, en 19 min → 11:40", "R11 11:09 després → 12:40"]
    if b["rows"] != want: errs.append(f"Girona → Sants: the board reads {b['rows']}, expected {want}")
    await page.close()
    return errs

async def check_town_choose_tarragona(browser):
    """Choosing Tarragona (Tarragonès): the first two trains to leave, regional or AVE to Camp de Tarragona, on the
    frozen timetable (how an AVE row reads is scripts/test/board.test.ts's)."""
    page = await hero_page(browser)
    errs = await choose_town(page, "R14", TARRAGONA_TOWN)
    if errs: await page.close(); return errs
    await page.wait_for_timeout(300)
    b = await page.evaluate(BOARD)
    want = ["R15 10:03 el pròxim, en 3 min → 11:12", "R17 10:33 després → 11:42"]   # the AVE's words: board.test.ts
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
        route = await page.evaluate("[...(document.querySelector('.tk .route')?.children ?? [])].map(b => b.matches('.swap') ? '→' : b.textContent.trim()).join(' ')")
        if route != "Sants → Reus": out.append(f"{how}: the route changed to «{route}»")
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
    """With the longest eligible town's name chosen (Puigverd de Lleida-Artesa de Lleida), across the 12 SIZES:
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

async def check_strip_whole(browser):
    """On a landscape desktop of 1280 × 720 or more, every corridor's list of towns fits its sheet whole: nothing
    hides below the fold (12-10: at 1440 × 900 R14·R15 hid Flix and Lleida-Pirineus, and macOS's hidden scrollbars
    gave no hint). Option C of three (12-10): three columns on a desktop."""
    errs = []
    for size in ("1280x720", "1366x768", "1440x900", "1920x1080"):
        w, h = SIZES[size]
        page = await hero_page(browser, w, h)
        e = await open_town(page)
        if e: errs += [f"{size}: {x}" for x in e]; await page.close(); continue
        for g in GROUPS:
            await page.click(f'.ln[data-group="{g}"]', timeout=CLICK_MS); await page.wait_for_timeout(200)
            r = await page.evaluate("(() => { const p = document.querySelector('#selp .pp'); return [p.scrollHeight, p.clientHeight]; })()")
            if r[0] > r[1] + 1: errs.append(f"{size}: the {g} list is {r[0] - r[1]} px taller than its sheet")
            await page.click("#selp .back", timeout=CLICK_MS); await page.wait_for_timeout(200)
        await page.close()
    return errs

SITE = "https://capacasa.alope.dev/"   # D1 (Àlex, 11-10): the site's address; reus-web.vercel.app sends here (vercel.json)
TITLE = "Capacasa - D’un cop d’ull, el proper tren cap a casa"
DESCRIPTION = "Tornes a casa? D’un cop d’ull veus quan surt el pròxim tren entre Barcelona i el teu poble, si va amb retard, i el compres a Renfe."
def check_share(folder="dist"):
    """Check 17: the link preview's tags and image, read from the build (no browser needed)."""
    class Metas(html.parser.HTMLParser):
        def __init__(self): super().__init__(); self.tags = {}; self.links = {}; self.icons = []; self.ld = False; self.data = []
        def handle_starttag(self, tag, attrs):
            a = dict(attrs)
            if tag == "meta" and (a.get("property") or a.get("name")): self.tags[a.get("property") or a.get("name")] = a.get("content") or ""
            if tag == "link" and a.get("rel"): self.links[a["rel"]] = a.get("href") or ""
            if tag == "link" and a.get("rel") in ("icon", "apple-touch-icon"): self.icons.append(a)
            self.ld = tag == "script" and a.get("type") == "application/ld+json"
        def handle_endtag(self, tag): self.ld = False
        def handle_data(self, data):
            if self.ld: self.data.append(data)
    m = Metas(); m.feed((root / folder / "index.html").read_text(encoding="utf-8")); t = m.tags
    if m.links.get("canonical") != SITE: out_canon = [f"<link rel=canonical> is {m.links.get('canonical')!r}, expected {SITE}"]
    else: out_canon = []
    if t.get("og:url") and t["og:url"] != SITE: out_canon.append(f"og:url is {t['og:url']}, expected {SITE}")
    out = [f"<meta> {k} is missing or empty" for k in ("description", "og:type", "og:title", "og:description", "og:url",
           "og:image", "og:image:width", "og:image:height", "og:image:alt", "twitter:card") if not t.get(k)]
    # the image's tickets turn with three arrows since 09-10, not «⇄»: screen readers on LinkedIn and X read this
    if "⇄" in t.get("og:image:alt", ""): out.append("og:image:alt still describes the tickets with «⇄» (they carry ▶▶▷ since 09-10)")
    # the tab and the search result (Àlex, 11-10); the description, close, for Google and the preview alike
    title = re.search(r"<title>(.*?)</title>", (root / folder / "index.html").read_text(encoding="utf-8"), re.S)
    if not title or title.group(1) != TITLE: out.append(f"<title> reads «{title and title.group(1)}», expected «{TITLE}»")
    for k in ("description", "og:description"):
        if t.get(k) != DESCRIPTION: out.append(f"<meta> {k} reads «{t.get(k)}», expected «{DESCRIPTION}»")
    if t.get("twitter:card") and t["twitter:card"] != "summary_large_image": out.append(f"twitter:card is {t['twitter:card']}, expected summary_large_image")
    img = t.get("og:image", "")
    if img and not img.startswith(SITE): out.append(f"og:image must be an absolute URL on {SITE} (crawlers don't resolve relative ones): {img}")
    elif img:
        f = root / folder / img[len(SITE):]
        if not f.is_file(): out.append(f"og:image {img} is not in {folder}/ (put it in src/public/)")
        else:
            w, h = Image.open(f).size
            if (str(w), str(h)) != (t.get("og:image:width"), t.get("og:image:height")): out.append(f"og:image is {w}×{h}, the tags say {t.get('og:image:width')}×{t.get('og:image:height')}")
            if (w, h) != (1200, 630): out.append(f"og:image is {w}×{h}, expected 1200×630")
            if f.stat().st_size >= 1_000_000: out.append(f"og:image weighs {f.stat().st_size // 1000} kB, keep it under 1 MB")
    # search engines: robots.txt lets everything in and names the sitemap, which lists the one page
    robots = root / folder / "robots.txt"
    if not robots.is_file(): out.append(f"robots.txt is not in {folder}/ (put it in src/public/)")
    else:
        lines = [l.strip() for l in robots.read_text().splitlines()]
        if "User-agent: *" not in lines or any(l.startswith("Disallow:") and l != "Disallow:" for l in lines): out.append("robots.txt must let every crawler in")
        if f"Sitemap: {SITE}sitemap.xml" not in lines: out.append(f"robots.txt must name the sitemap, Sitemap: {SITE}sitemap.xml")
    sitemap = root / folder / "sitemap.xml"
    if not sitemap.is_file(): out.append(f"sitemap.xml is not in {folder}/ (put it in src/public/)")
    else:
        locs = [e.text for e in ET.parse(sitemap).getroot().iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
        if locs != [SITE]: out.append(f"sitemap.xml lists {locs}, expected [{SITE}]")
    # the icon (opción A, Àlex 11-10: a flap of the name's board with its «C»): an SVG for the tab, /favicon.ico for
    # browsers that ask for it on their own, and a 180 × 180 opaque PNG for a phone's home screen
    svg = next((i for i in m.icons if i.get("rel") == "icon" and i.get("type") == "image/svg+xml"), None)
    if not svg: out.append("no <link rel=icon type=image/svg+xml>")
    elif not (root / folder / svg["href"].lstrip("/")).is_file(): out.append(f"the tab icon {svg['href']} is not in {folder}/")
    ico = root / folder / "favicon.ico"
    if not ico.is_file(): out.append(f"favicon.ico is not in {folder}/ (browsers ask for it on their own)")
    elif 32 not in [s[0] for s in Image.open(ico).info.get("sizes", [])]: out.append(f"favicon.ico has no 32 × 32 picture ({Image.open(ico).info.get('sizes')})")
    touch = next((i for i in m.icons if i.get("rel") == "apple-touch-icon"), None)
    if not touch: out.append("no <link rel=apple-touch-icon>")
    elif not (root / folder / touch["href"].lstrip("/")).is_file(): out.append(f"the home screen icon {touch['href']} is not in {folder}/")
    else:
        im = Image.open(root / folder / touch["href"].lstrip("/"))
        if im.size != (180, 180): out.append(f"the home screen icon is {im.size[0]}×{im.size[1]}, expected 180×180")
        if im.mode in ("RGBA", "LA") and im.getextrema()[-1][0] < 255: out.append("the home screen icon has see-through pixels (iOS paints them black)")
    # structured data: what the site is, for search engines (schema.org WebApplication)
    try: ld = [json.loads(d) for d in m.data]
    except ValueError as e: ld = []; out.append(f"the JSON-LD block is not valid JSON: {e}")
    app = next((d for d in ld if d.get("@type") == "WebApplication"), None)
    if not app: out.append("no JSON-LD WebApplication in index.html")
    else:
        want = {"@context": "https://schema.org", "name": "Capacasa", "url": SITE, "inLanguage": "ca", "isAccessibleForFree": True}
        out += [f"JSON-LD {k} is {app.get(k)!r}, expected {v!r}" for k, v in want.items() if app.get(k) != v]
        if not app.get("description"): out.append("JSON-LD description is missing")
        if (app.get("author") or {}).get("name") != "Àlex Olivé" or (app.get("author") or {}).get("url") != "https://alope.dev": out.append(f"JSON-LD author is {app.get('author')}, expected Àlex Olivé, https://alope.dev")
        if (app.get("offers") or {}).get("price") not in ("0", 0): out.append(f"JSON-LD offers is {app.get('offers')}, expected a price of 0")
    return out_canon + out

# --- an open sheet holds the page still (12-10) -------------------------------------------------------------------
async def check_sheet_holds_page(browser):
    """While a sheet is open (the train's on a phone, the town chooser, a notice, privacy), scrolling does not move the
    page behind it: a wheel, the keyboard or a finger on the backdrop would scroll the wall towards the table under
    the darkened backdrop (Àlex, 12-10). Closed again, the page scrolls as before."""
    errs = []
    async def swipe(page, x, y, dy):
        """A finger dragged dy px (Input.synthesizeScrollGesture does not scroll here; raw touch events do)."""
        cdp = await page.context.new_cdp_session(page)
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
        for i in range(1, 11): await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x, "y": y + dy * i / 10}]})
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        await page.wait_for_timeout(600)
    async def tries(page, x, opener, touch):
        before = await page.evaluate("scrollY")
        await page.click(opener, timeout=CLICK_MS); await page.wait_for_timeout(500)
        await page.mouse.move(x, 60); await page.mouse.wheel(0, 600); await page.wait_for_timeout(400)
        await page.keyboard.press("PageDown"); await page.keyboard.press("Space"); await page.wait_for_timeout(400)
        if touch: await swipe(page, x, 120, 300); await swipe(page, x, 400, -300)
        return before, await page.evaluate("scrollY")
    page = await open_page(browser, viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, reduced_motion="reduce")
    await page.clock.set_fixed_time("2026-09-28T08:00:00Z")
    await page.goto(parity_url); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(1200)
    for sel, opener in (("#detalle", "#board button.big"), ("#selp", ".tk .town")):
        b, a = await tries(page, 195, opener, True)
        if a != b: errs.append(f"phone: with {sel} open the page scrolled from {b} to {a}")
        await page.keyboard.press("Escape")
        await page.evaluate("scrollTo({top: 0, behavior: 'instant'})"); await page.wait_for_timeout(1500)
    await swipe(page, 195, 700, -300)
    if await page.evaluate("scrollY") == 0: errs.append("phone: with the sheets closed a finger no longer scrolls the page")
    await page.close()
    page = await hero_page(browser)
    b, a = await tries(page, 720, ".tk .town", False)
    if a != b: errs.append(f"desktop: with #selp open the page scrolled from {b} to {a}")
    await page.keyboard.press("Escape"); await page.wait_for_timeout(300)
    await page.mouse.wheel(0, 300); await page.wait_for_timeout(600)
    if await page.evaluate("scrollY") == 0: errs.append("desktop: with the chooser closed the wheel no longer scrolls the page")
    await page.close()
    return errs

PHONE = """(() => { const n = s => s.replace(/\\s+/g, ' ').trim(), d = document.getElementById('detalle'), a = d.querySelector('.comprar');
  const q = a ? new URL(a.href).searchParams : null;
  return {rows: [...document.querySelectorAll('#board .trip')].map(r => n(r.textContent)), buttons: [...document.querySelectorAll('#board .trip')].map(r => r.matches('button')),
          buy: document.querySelectorAll('#board a:not(.talo)').length, dep: document.getElementById('dep')?.textContent, open: d.open, sheet: n(d.textContent),
          link: q && {from: q.get('cdgoOrigen'), to: q.get('cdgoDestino'), day: q.get('FechaIdaSel'), tab: a.target === '_blank'},
          home: (h => h && {url: h.origin + h.pathname, text: h.searchParams.get('text'), tab: d.querySelector('.avisa').target === '_blank'})(d.querySelector('.avisa') && new URL(d.querySelector('.avisa').href)),
          focus: document.activeElement?.matches('#board button.big') ?? false}; })()"""

# the sheet's way out, armed before the gesture: whether the sheet was still open when the gesture landed, the
# animations it then ran (the paper's keyframes and the backdrop's) and when it closed
# sheet.ts closes a sheet within a second of page time, but on the CI's software rendering a frame holds its timers
# back: closing took 1.8 s on 20-10, 2.4 s and 2.54 s on 21-10. A sheet that never closes still fails (SHEET_WATCH
# gives up at 4 s)
SHEET_SHUT_MS = 3500
SHEET_WATCH = """(() => { const d = document.getElementById('detalle'), p = d.querySelector('.pliego');
  window.__cierre = new Promise(done => {
    const go = () => { const t0 = performance.now();
      setTimeout(() => {                                     // once the gesture's own handlers have run
        const still = d.open;
        const runs = document.getAnimations().filter(a => a.playState === 'running');
        const paper = runs.find(a => a.effect.target === p), dim = runs.find(a => a.effect.target === d && a.effect.pseudoElement === '::backdrop');
        const last = paper ? paper.effect.getKeyframes().at(-1).transform : null;
        (function wait(){ if(d.open && performance.now() - t0 < 4000) return setTimeout(wait, 20);
          done({still, last, dim: !!dim, open: d.open, ms: Math.round(performance.now() - t0),
                focus: document.activeElement?.matches('#board button.big') ?? false}); })();
      }, 0);
    };
    d.addEventListener('cancel', go, {once:true, capture:true});
    d.addEventListener('click', e => { if(e.target === d) go(); }, {once:true, capture:true});
  }); })()"""

async def check_sheet_close(browser):
    """The train's sheet on a phone closes softly (Àlex 20-10, option A): no handle on top (nothing can be dragged
    yet) and no ✕ drawn (Àlex: «quita la x»); a tap outside, Esc or Android's back gesture slide the paper back down
    the way it came while the backdrop clears, and only then is it closed, with the focus back on the big train. The
    ✕ stays for the keyboard and the screen reader: invisible until it gets the keyboard's focus. With reduced
    motion it closes at once, as it opens."""
    errs = []
    for motion in ("no-preference", "reduce"):
        page = await open_page(browser, viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, reduced_motion=motion)
        await page.clock.set_fixed_time("2026-09-28T08:00:00Z")
        # the landscape paused (P, for recording), as in check_paper_motion: painted in software it holds the page's
        # thread for seconds a frame, and the close's timers with it (3.1 s on main's 21-10 run for a 0.2 s slide).
        # With reduced motion it never runs, and P would start it
        await page.goto(parity_url + "?grabar"); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(1200)
        if motion == "no-preference": await page.keyboard.press("p"); await page.wait_for_timeout(300)
        if await page.evaluate("reus.playing()"): errs.append(f"({motion}) the landscape still runs while the sheet's close is timed")
        await page.add_style_tag(content=".top,.info{opacity:1!important;transition:none!important;transform:none!important}")
        for how in ("a tap outside", "Esc"):
            await page.click("#board button.big", timeout=CLICK_MS); await page.wait_for_timeout(900)
            if motion == "no-preference" and how == "a tap outside":
                k = await page.evaluate("""(() => { const p = document.querySelector('#detalle .pliego'), x = document.querySelector('#detalle .x'), r = x?.getBoundingClientRect();
                  return {handle: getComputedStyle(p, '::before').content, x: x ? {w: r.width, h: r.height, label: x.getAttribute('aria-label')} : null}; })()""")
                if k["handle"] not in ("none", "normal"): errs.append(f"the sheet still draws a handle on top ({k['handle']})")
                if not k["x"]: errs.append("the sheet has no close button for the keyboard and the reader")
                elif k["x"]["w"] > 1 or k["x"]["h"] > 1: errs.append(f"the ✕ is still drawn ({k['x']['w']:.0f} × {k['x']['h']:.0f} px)")
                elif k["x"]["label"] != "Tancar": errs.append(f"the hidden close button is called «{k['x']['label']}»")
                await page.keyboard.press("Tab")
                f = await page.evaluate("(() => { const x = document.activeElement, r = x.getBoundingClientRect(); return {x: x.matches('#detalle .x'), w: r.width, h: r.height}; })()")
                if not f["x"]: errs.append("Tab from the sheet does not reach its close button first")
                elif f["w"] < 44 or f["h"] < 44: errs.append(f"the close button is {f['w']:.0f} × {f['h']:.0f} px with the keyboard's focus: it must show, at least 44 px")
                await page.evaluate("document.querySelector('#detalle .pliego').focus()")
            await page.evaluate(SHEET_WATCH)
            if how == "Esc": await page.keyboard.press("Escape")
            else: await page.mouse.click(195, 60)
            c = await page.evaluate("window.__cierre")
            when = f"{how} ({motion})"
            if c["open"]: errs.append(f"{when}: the sheet does not close")
            elif not c["focus"]: errs.append(f"{when}: the focus is not back on the big train")
            if motion == "reduce":
                if c["still"]: errs.append(f"{when}: the sheet waits before closing; with reduced motion it closes at once")
            else:
                if not c["still"]: errs.append(f"{when}: the sheet closes at once, without sliding down")
                if not c["last"] or "translateY(100%)" not in c["last"].replace(" ", ""): errs.append(f"{when}: the paper does not slide back down (ends at {c['last']})")
                if not c["dim"]: errs.append(f"{when}: the backdrop does not clear with the paper")
                if c["ms"] > SHEET_SHUT_MS: errs.append(f"{when}: the sheet takes {c['ms']} ms to close")
            await page.wait_for_timeout(300)
        await page.close()
    return errs

# every CSS animation that starts on the page, with its keyframes' ends, as it starts (a slow software frame can end
# a short animation before a check gets to read it)
REC = """(() => { if(window.__rec) { window.__rec.length = 0; return; } window.__rec = []; const seen = new WeakSet();
  const ends = k => k ? {transform: (k.transform || '').replace(/\\s+/g, ''), opacity: String(k.opacity ?? '')} : null;
  const look = () => { for(const a of document.getAnimations()){ if(seen.has(a) || !(a.animationName || a.id)) continue; seen.add(a);
    const t = a.effect.target, k = a.effect.getKeyframes();
    window.__rec.push({name: a.animationName || a.id, el: (t.id ? '#' + t.id + ' ' : '') + (typeof t.className === 'string' ? t.className : ''),
      pseudo: a.effect.pseudoElement || '', first: ends(k[0]), last: ends(k.at(-1)), ms: a.effect.getTiming().duration}); } };
  // read the moment something changes (a slow software frame can end a short animation before a check gets to it)
  new MutationObserver(look).observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['open', 'class', 'style']});
  document.addEventListener('animationstart', look, true); })()"""
# whether a dialog was still open once a gesture's own handlers had run, and when it closed
SHUT = """((id) => { const d = document.getElementById(id);
  window.__shut = new Promise(done => { let held = null;
    const go = e => { const t0 = performance.now(); if(e.type === 'cancel') held = e.cancelable;
      setTimeout(() => { const still = d.open;
        (function wait(){ if(d.open && performance.now() - t0 < 4000) return setTimeout(wait, 20);
          done({still, held, open: d.open, ms: Math.round(performance.now() - t0), focus: document.activeElement?.className || ''}); })(); }, 0);
    };
    d.addEventListener('cancel', go, {once:true, capture:true});
    d.addEventListener('click', e => { if(e.target === d || e.target.closest('.x, .opt, .est')) go(e); }, {once:true, capture:true});
  }); })"""

# what SHUT saw, or that nothing closed the dialog within 8 s (a gesture that missed it would wait forever)
SHUT_READ = "Promise.race([window.__shut, new Promise(r => setTimeout(() => r({still: true, held: null, open: true, ms: 8000, focus: ''}), 8000))])"

async def tap_at(page, sel):
    """A plain click at the middle of what sel finds, without waiting for it to stand still (the ticket's ends and
    the chooser's rows may still be settling from the last move: that is not what these checks look at)"""
    at = await page.evaluate(f"(() => {{ const r = document.querySelector('{sel}')?.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; }})()")
    if at: await page.mouse.click(*at)
    return bool(at)

def paper_moves(rec, when, way, motion, shut=None):
    """What a sheet ran as it opened ('in') or closed ('out'), from REC (and SHUT for 'out'): option B «De papel»"""
    errs = []
    paper = [r for r in rec if "sheet" in r["el"] and not r["pseudo"]]
    dim = [r for r in rec if r["pseudo"] == "::backdrop"]
    if motion == "reduce":
        if paper or dim: errs.append(f"{when}: with reduced motion the sheet still moves ({[r['name'] for r in paper + dim]})")
        if shut and shut["still"]: errs.append(f"{when}: with reduced motion the sheet waits before closing")
        return errs
    if not paper: return [f"{when}: the sheet does not move"]
    p = paper[-1]
    p = {**p, "first": p["first"] or {"transform": "", "opacity": ""}, "last": p["last"] or {"transform": "", "opacity": ""}}
    if way == "in":
        t = p["first"]["transform"]
        if "translateY" not in t or "rotate" not in t: errs.append(f"{when}: the sheet does not come up from below and settle (starts at {p['first']})")
        if not 250 <= p["ms"] <= 400: errs.append(f"{when}: the sheet takes {p['ms']} ms to come in, expected about 320")
    else:
        if shut and not shut["still"]: errs.append(f"{when}: the sheet closes at once, without leaving" + (" (the browser would not hold Esc)" if shut.get("held") is False else ""))
        if "translateY" not in p["last"]["transform"]: errs.append(f"{when}: the sheet does not go back down (ends at {p['last']})")
        if p["last"]["opacity"] != "0": errs.append(f"{when}: the sheet does not fade as it leaves (ends at {p['last']})")
        if not 120 <= p["ms"] <= 300: errs.append(f"{when}: the sheet takes {p['ms']} ms to leave, expected about 200")
        # sheet.ts closes within a second; a software-rendered frame holds its timers back (SHEET_SHUT_MS)
        if shut and shut["ms"] > SHEET_SHUT_MS: errs.append(f"{when}: the sheet takes {shut['ms']} ms to close")
    if not dim: errs.append(f"{when}: the backdrop does not {'darken' if way == 'in' else 'clear'} with the sheet")
    return errs

def paper_turns(rec, when, sign, motion):
    """A step of the chooser, from REC: the new page comes in from the side the gesture points to and the old one
    leaves to the other, neither laid down again like a new sheet; with reduced motion nothing moves."""
    papers = [r for r in rec if "sheet" in r["el"] and not r["pseudo"]]
    if motion == "reduce": return [f"{when}: with reduced motion the step still moves ({[r['name'] for r in papers]})"] if papers else []
    errs = []
    def dx(t):
        m = re.search(r"translateX?\((-?[\d.]+)", t or ""); return float(m.group(1)) if m else 0
    new = [r for r in papers if " va" not in r["el"] + " "]
    old = [r for r in papers if "va" in r["el"].split()]
    if any(r["first"] and "translateY" in r["first"]["transform"] for r in new): errs.append(f"{when}: the new page is laid down like a new sheet")
    if not new or dx(new[-1]["first"]["transform"]) * sign <= 0: errs.append(f"{when}: the new page does not come in from the {'right' if sign > 0 else 'left'} ({new[-1]['first'] if new else None})")
    if not old or dx(old[-1]["last"]["transform"]) * sign >= 0 or old[-1]["last"]["opacity"] != "0": errs.append(f"{when}: the old page does not leave to the {'left' if sign > 0 else 'right'} ({old[-1]['last'] if old else None})")
    return errs

async def check_paper_motion(browser):
    """Option B «De papel» (Àlex 20-10): what opens, closes or changes moves the way paper would. The town and the
    station choosers, the notice and privacy come up from below and settle at their tilt (0.32 s, Vaul's curve, the
    backdrop darkening with them), and leave the way they came, down and fading (0.2 s), closed only once that ends,
    with the focus back where it was: by ✕, a tap outside or Esc. With reduced motion, nothing moves: they open and
    close at once, as before."""
    errs = []
    for (w, h, mobile) in ((390, 844, True), (1440, 900, False)):
        for motion in ("no-preference", "reduce"):
            where = f"{'phone' if mobile else 'desktop'} ({motion})"
            page = await open_page(browser, viewport={"width": w, "height": h}, is_mobile=mobile, has_touch=mobile, reduced_motion=motion)
            await page.clock.set_fixed_time("2026-09-28T08:00:00Z")
            # the landscape paused (P, for recording): painted in software it holds the page's thread for seconds a frame,
            # and a 0.2 s sheet would take as long to leave; what is checked here does not move with it
            await page.goto(parity_url + "?grabar"); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(1200)
            await page.keyboard.press("p"); await page.wait_for_timeout(300)
            await page.add_style_tag(content=".top,.info{opacity:1!important;transition:none!important;transform:none!important}")
            for how, end in (("✕", "town"), ("a tap outside", "bcn"), ("Esc", "town")):
                await page.evaluate(REC)
                await tap_at(page, f".tk .end.{end}"); await page.wait_for_timeout(700)
                if not await page.evaluate("document.getElementById('selp').open"): errs.append(f"{where}: the chooser does not open from .end.{end}"); continue
                errs += paper_moves(await page.evaluate("window.__rec"), f"{where}, opening", "in", motion)
                await page.evaluate(REC); await page.evaluate(SHUT + "('selp')")
                if how == "✕":
                    x = await page.evaluate("(() => { const r = document.querySelector('#selp .x').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()")
                    await page.mouse.click(*x)
                elif how == "Esc": await page.keyboard.press("Escape")
                else: await page.mouse.click(w // 2, h - 6)
                c = await page.evaluate(SHUT_READ)
                when = f"{where}, {how}"
                if c["open"]: errs.append(f"{when}: the chooser does not close"); continue
                if end not in c["focus"]: errs.append(f"{when}: the focus is not back on the ticket's end (on «{c['focus']}»)")
                errs += paper_moves(await page.evaluate("window.__rec"), when, "out", motion, c)
                await page.wait_for_timeout(300)
            # the chooser's steps turn like pages: a line forward, «‹ Línies» back; the sheet is not laid down again
            await tap_at(page, ".tk .end.town"); await page.wait_for_timeout(700)
            for (step, sel, sign) in (("a line", "#selp .ln:nth-child(3)", 1), ("«‹ Línies»", "#selp .back", -1)):
                await page.evaluate(REC)
                if not await tap_at(page, sel): errs.append(f"{where}, {step}: no {sel} to press"); break
                await page.wait_for_timeout(800)
                errs += paper_turns(await page.evaluate("window.__rec"), f"{where}, {step}", sign, motion)
                n = await page.evaluate("document.querySelectorAll('#selp .sheet').length")
                if n != 1: errs.append(f"{where}, {step}: {n} sheets left in the chooser once it has turned")
                if not await page.evaluate("document.getElementById('selp').contains(document.activeElement)"): errs.append(f"{where}, {step}: the focus left the chooser")
            await page.keyboard.press("Escape"); await page.wait_for_timeout(800)
            # the notice and privacy are the same paper: opened here straight away (their buttons are a stamp that only
            # shows with a notice, and the notebook's cover down on the table); the notice gets a stand-in body
            for (sheet, how) in (("avis", "✕"), ("avis", "Esc"), ("privacitat", "✕"), ("privacitat", "Esc")):
                await page.evaluate(REC)
                await page.evaluate(f"""(() => {{ const d = document.getElementById('{sheet}');
                  if(!d.querySelector('.sheet')) d.innerHTML = '<div class="sheet"><div class="pp"><button type="button" class="x" aria-label="Tancar">✕</button><h3 id="avisH">Avís</h3><p>Prova</p></div></div>';
                  d.showModal(); }})()""")
                await page.wait_for_timeout(700)
                errs += paper_moves(await page.evaluate("window.__rec"), f"{where}, #{sheet} opening", "in", motion)
                await page.evaluate(REC); await page.evaluate(SHUT + f"('{sheet}')")
                if how == "✕":
                    x = await page.evaluate(f"(() => {{ const r = document.querySelector('#{sheet} .x').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }})()")
                    await page.mouse.click(*x)
                else: await page.keyboard.press("Escape")
                c = await page.evaluate(SHUT_READ)
                if c["open"]: errs.append(f"{where}, #{sheet} by {how}: it does not close"); continue
                errs += paper_moves(await page.evaluate("window.__rec"), f"{where}, #{sheet} by {how}", "out", motion, c)
                await page.wait_for_timeout(300)
            # the arrows cross the two ends over to their new places, one over and one under
            for turn in range(2):
                await page.evaluate(REC)
                await tap_at(page, ".tk .swap"); await page.wait_for_timeout(700)
                cr = [r for r in await page.evaluate("window.__rec") if r["name"] == "creua"]
                when = f"{where}, the arrows ({turn + 1})"
                if motion == "reduce":
                    if cr: errs.append(f"{when}: with reduced motion the ends still move")
                    continue
                def dx(r): m = re.search(r"translate\((-?[\d.]+)px", r["first"]["transform"]); return float(m.group(1)) if m else 0
                ends = {k: [r for r in cr if f"end {k}" in r["el"]] for k in ("town", "bcn")}
                if not all(ends.values()): errs.append(f"{when}: the ends do not cross over ({[r['el'] for r in cr]})"); continue
                if dx(ends["town"][-1]) * dx(ends["bcn"][-1]) >= 0: errs.append(f"{when}: the ends do not come from each other's place ({ends['town'][-1]['first']}, {ends['bcn'][-1]['first']})")
                if not 300 <= ends["town"][-1]["ms"] <= 400: errs.append(f"{when}: the ends take {ends['town'][-1]['ms']} ms to cross, expected about 340")
            # what is picked is stamped on the ticket once the sheet has gone: the end lands from above, big, and settles
            for (end, steps) in (("town", ["#selp .ln:nth-child(2)", "#selp .strip li:nth-child(3) .opt"]), ("bcn", ["#selp .est:nth-child(2)"])):
                await tap_at(page, f".tk .end.{end}"); await page.wait_for_timeout(700)
                await page.evaluate(REC)
                for sel in steps:
                    if not await tap_at(page, sel): errs.append(f"{where}, picking from .end.{end}: no {sel} to press"); break
                    await page.wait_for_timeout(800)
                await page.wait_for_timeout(600)
                rec = await page.evaluate("window.__rec")
                st = [r for r in rec if f"end {end}" in r["el"] and not r["pseudo"]]
                when = f"{where}, picking from .end.{end}"
                if motion == "reduce":
                    if st: errs.append(f"{when}: with reduced motion the ticket's end still moves ({[r['name'] for r in st]})")
                    continue
                m = re.search(r"scale\(([\d.]+)", (st[-1]["first"] or {}).get("transform", "")) if st else None
                if not m or float(m.group(1)) < 1.2: errs.append(f"{when}: the end is not stamped on the ticket ({st[-1]['first'] if st else 'it does not move'})")
                elif not 200 <= st[-1]["ms"] <= 400: errs.append(f"{when}: the stamp takes {st[-1]['ms']} ms, expected about 300")
            # «Compra» is punched when pressed (Renfe's tab is kept from opening here): a hole stays in the stub and its
            # chad falls; another train is another stub, whole
            await page.evaluate(REC)
            await page.evaluate("document.addEventListener('click', e => { if(e.target.closest('#talons a')) e.preventDefault(); }, {once: true})")
            b = await page.evaluate("(() => { const r = document.querySelector('#talons .compra').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()")
            await page.mouse.click(*b); await page.wait_for_timeout(1200)
            k = await page.evaluate("""(() => { const c = document.querySelector('#talons .compra'), i = c?.querySelector('i');
              return {punched: !!c?.classList.contains('picat'), hole: i ? getComputedStyle(i, '::after').content : 'none', chads: document.querySelectorAll('#talons .xapa').length}; })()""")
            when = f"{where}, «Compra»"
            if not k["punched"] or k["hole"] in ("none", "normal"): errs.append(f"{when}: pressed, the stub is not punched ({k})")
            if k["chads"]: errs.append(f"{when}: the chad is still there once it has fallen")
            chad = [r for r in await page.evaluate("window.__rec") if "xapa" in r["el"]]
            if motion == "reduce":
                if chad: errs.append(f"{when}: with reduced motion the chad still falls")
            elif not chad or "translate" not in (chad[-1]["last"] or {}).get("transform", "") or chad[-1]["last"]["opacity"] != "0":
                errs.append(f"{when}: no chad falls from the stub ({chad[-1] if chad else None})")
            await page.focus("#t"); await page.keyboard.press("ArrowRight"); await page.wait_for_timeout(500)
            if await page.evaluate("!!document.querySelector('#talons .compra.picat')"): errs.append(f"{when}: another train's stub is still punched")
            await page.close()
    return errs

async def check_phone_board(browser):
    """6B (Àlex, 06-10): on a phone the board keeps only the times, the countdown and a «›»; since 19-10 (P2 on
    one line) it is the highlighted time alone, a button that opens a paper sheet with its detail and «Compra a Renfe ↗».
    Another train picked on the ruler is the one the sheet tells. Esc, ✕ and the backdrop close the sheet and hand the focus
    back to the big train. On a wide screen the board is unchanged (check_hero_board). The sheet also says «Avisar a
    casa» (Àlex 06-10, only on a phone): a link to WhatsApp (wa.me, no number) with the train written as a message."""
    errs = []
    page = await hero_page(browser, 390, 844)
    b = await page.evaluate(PHONE)
    # the window first (P2 on one line, Àlex 19-10): the highlighted time alone; the next one is on the ruler
    want = ["R15 10:03 en 3 min → 11:33 ›"]
    if b["rows"] != want: errs.append(f"at 10:00 the phone board reads {b['rows']}, expected {want}")
    if b["buttons"] != [True]: errs.append(f"on a phone the trip should be a button, got {b['buttons']}")
    if b["buy"]: errs.append("on a phone the board's row holds a link (the way to Renfe is «Compra» over it and in the sheet)")
    async def tap(sel, when):
        try: await page.click(sel, timeout=CLICK_MS)
        except Exception: errs.append(f"{when}: {sel} is not clickable"); return None
        await page.wait_for_timeout(500); return await page.evaluate(PHONE)
    def home(b, when, text):
        h = b["home"]
        if not h: errs.append(f"{when}: the sheet has no «Avisar a casa»"); return
        if h["url"] != "https://wa.me/" or h["text"] != text or not h["tab"]:
            errs.append(f"{when}: «Avisar a casa» goes to {h['url']} with «{h['text']}» (new tab: {h['tab']}), expected https://wa.me/ with «{text}»")
    async def sheet(when, dep, arr, said, link):
        if when == "after picking the 11:03":
            await page.focus("#t"); await page.keyboard.press("ArrowRight"); await page.wait_for_timeout(300)
        b = await tap("#board button.big", when)
        if not b: return
        if not b["open"]: errs.append(f"{when}: the sheet does not open"); return
        for word in (f"{dep} → {arr}", said, "de viatge", "Compra a Renfe"):
            if word not in b["sheet"]: errs.append(f"{when}: the sheet does not say «{word}» («{b['sheet']}»)")
        if b["dep"] != dep: errs.append(f"{when}: the train shown is {b['dep']}, expected {dep}")
        k = b["link"]
        if not k: errs.append(f"{when}: the sheet has no link to Renfe")
        elif (k["from"], k["to"], k["day"]) != link or not k["tab"]: errs.append(f"{when}: «Compra a Renfe» searches {k}, expected {link} in a new tab")
        home(b, when, f"Agafo l’R15 de les {dep} a Sants. Arribo a Reus a les {arr}.")
        if "Avisar a casa" not in b["sheet"]: errs.append(f"{when}: the sheet does not say «Avisar a casa»")
    await sheet("tapping the big train", "10:03", "11:33", "Surt en 3 min", ("0071,71801,71801", "0071,71400,71400", "28/09/2026"))
    await page.keyboard.press("Escape"); await page.wait_for_timeout(300)
    b = await page.evaluate(PHONE)
    if b["open"]: errs.append("Esc does not close the sheet")
    elif not b["focus"]: errs.append("after Esc the focus is not back on the big train")
    await sheet("after picking the 11:03", "11:03", "12:33", "Surt en 1 h 3 min", ("0071,71801,71801", "0071,71400,71400", "28/09/2026"))
    await page.keyboard.press("Tab"); await page.keyboard.press("Enter"); await page.wait_for_timeout(300)
    if (await page.evaluate(PHONE))["open"]: errs.append("the close button (Tab, Enter) does not close the sheet")
    await tap("#board button.big", "the backdrop")
    await page.mouse.click(195, 40); await page.wait_for_timeout(300)
    if (await page.evaluate(PHONE))["open"]: errs.append("the backdrop does not close the sheet")
    await page.close()
    # from Reus at 21:30 the train shown is today's last AVE, from Camp de Tarragona: the message says where it leaves
    page = await hero_page(browser, 390, 844, at="2026-09-28T19:30:00Z")
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    b = await tap("#board button.big", "the AVE from Reus at 21:30")
    if b: home(b, "the AVE from Reus at 21:30", "Agafo l’AVE de les 22:17 a Camp de Tarragona. Arribo a Sants a les 22:59.")
    await page.close()
    return errs

# --- 3.5 · the Barcelona station ------------------------------------------------------------------------------
PDG_ID, FRANCA_ID = "71802", "79400"
STATIONS = [SANTS_ID, PDG_ID, FRANCA_ID]
ROUTE = "[...(document.querySelector('.tk .route')?.children ?? [])].map(b => b.matches('.swap') ? '→' : b.textContent.trim()).join(' ')"

async def choose_station(page, station, timeout=CLICK_MS):
    """The two taps that choose the Barcelona station: the ticket's Barcelona end, then the station."""
    try: await page.click(".tk .bcn", timeout=timeout)
    except Exception: return ["'.tk .bcn' is not a clickable button that opens #selp"]
    try: await page.click(f'#selp .est[data-station="{station}"]', timeout=timeout)
    except Exception: return [f"'.est[data-station={station}]' is not clickable"]
    await page.wait_for_timeout(300)
    return []

async def check_station(browser):
    """3.5. Barcelona's end of the ticket is a raised button that opens the same sheet with the three stations
    (Sants, Passeig de Gràcia, França), the chosen one stamped and focused, each saying which lines it misses; the
    sheet's paper is cut ragged like the ticket. Choosing one rebuilds the route, the board and the buy link from
    that station; Esc changes nothing; França has no R11, so to Girona the board names the stations that have one."""
    errs = []
    page = await hero_page(browser)
    t = await page.evaluate("""(() => { const b = document.querySelector('.tk .bcn'); if(!b) return null; const c = getComputedStyle(b);
      return {tag: b.tagName, text: b.textContent.trim(), haspopup: b.getAttribute('aria-haspopup'), label: b.getAttribute('aria-label') || '',
              line: c.textDecorationLine, raised: c.textShadow}; })()""")
    if not t: await page.close(); return ["'.tk .bcn' is missing: Barcelona's end of the ticket is not a button"]
    if t["tag"] != "BUTTON" or t["text"] != "Sants" or t["haspopup"] != "dialog": errs.append(f".tk .bcn is a {t['tag']} reading «{t['text']}» (aria-haspopup {t['haspopup']}), expected a dialog button «Sants»")
    if not t["label"].startswith("Sants"): errs.append(f".tk .bcn accessible name is «{t['label']}», expected to start with «Sants»")
    if t["line"] != "none" or t["raised"] in ("", "none"): errs.append(".tk .bcn is not raised like the other ends of the ticket")
    try: await page.click(".tk .bcn", timeout=CLICK_MS)
    except Exception: await page.close(); return errs + ["'.tk .bcn' is not clickable"]
    await page.wait_for_timeout(300)
    got = await page.evaluate("""(() => { const d = document.getElementById('selp'), pp = d.querySelector('.sheet .pp');
      return {open: d.open, h3: d.querySelector('h3')?.textContent.trim(), cut: pp ? getComputedStyle(pp).clipPath : '',
              rows: [...d.querySelectorAll('.est')].map(b => ({id: b.dataset.station, d: b.querySelector('.d')?.textContent.trim(),
                current: b.getAttribute('aria-current'), focused: document.activeElement === b, h: b.getBoundingClientRect().height}))}; })()""")
    if not got["open"]: errs.append("#selp does not open from .tk .bcn")
    if got["h3"] != "De quina estació surts?": errs.append(f"the station sheet asks «{got['h3']}»")
    if not got["cut"].startswith("polygon"): errs.append(f"the sheet's paper is not cut like the ticket (clip-path {got['cut'][:40]})")
    ids = [r["id"] for r in got["rows"]]
    if ids != STATIONS: errs.append(f"the station sheet lists {ids}, expected {STATIONS}")
    else:
        if got["rows"][0]["current"] != "true" or not got["rows"][0]["focused"]: errs.append("Sants is not marked as the current station and focused")
        if "R11" not in (got["rows"][2]["d"] or ""): errs.append(f"França does not say it misses the R11 («{got['rows'][2]['d']}»)")
        if "R11" in (got["rows"][1]["d"] or ""): errs.append(f"Passeig de Gràcia says it misses the R11 («{got['rows'][1]['d']}»)")
    await page.keyboard.press("Escape"); await page.wait_for_timeout(300)
    if await page.evaluate(ROUTE) != "Sants → Reus": errs.append("Esc in the station sheet changed the route")
    if not await page.evaluate("document.activeElement === document.querySelector('.tk .bcn')"): errs.append("after Esc the focus is not back on .tk .bcn")
    e = await choose_station(page, PDG_ID)
    if e: await page.close(); return errs + e
    if await page.evaluate(ROUTE) != "Gràcia → Reus": errs.append(f"after choosing Passeig de Gràcia the route reads «{await page.evaluate(ROUTE)}»")
    if not await page.evaluate("document.activeElement === document.querySelector('.tk .bcn')"): errs.append("the focus is not on .tk .bcn after choosing a station")
    b = await page.evaluate(BOARD)
    want = ["R15 10:56 el pròxim, en 56 min → 12:33", "R14 11:56 després → 13:33"]
    if b["rows"] != want: errs.append(f"from Passeig de Gràcia the board reads {b['rows']}, expected {want}")
    errs += buy_link(b, PDG_ID, REUS_TOWN, "28/09/2026")
    await page.click(".tk .swap"); await page.wait_for_timeout(300)
    if await page.evaluate(ROUTE) != "Reus → Gràcia": errs.append(f"after the arrows the route reads «{await page.evaluate(ROUTE)}»")
    await page.click(".tk .bcn", timeout=CLICK_MS); await page.wait_for_timeout(300)
    h3 = await page.evaluate("document.querySelector('#selp h3')?.textContent.trim()")
    if h3 != "A quina estació arribes?": errs.append(f"coming back, the station sheet asks «{h3}»")
    await page.keyboard.press("Escape")
    await page.close()
    # França has no R11: to Girona the board is empty and says where the train does leave from
    page = await hero_page(browser)
    e = await choose_station(page, FRANCA_ID) or await choose_town(page, "R11", GIRONA_TOWN)
    if e: await page.close(); return errs + e
    await page.wait_for_timeout(300)
    b = await page.evaluate(BOARD); lbl = await page.evaluate("document.getElementById('lbl').textContent.trim()")
    if b["rows"]: errs.append(f"França → Girona has no direct train, but the board reads {b['rows']}")
    say = "Des de França no hi ha tren directe a Girona. Surt de Sants o de Passeig de Gràcia."
    if lbl != say: errs.append(f"França → Girona: #lbl reads «{lbl}», expected «{say}»")
    if say not in b["aviso"]: errs.append(f"França → Girona: the live region does not say where to go («{b['aviso'][:90]}»)")
    await page.close()
    # a finger fits each station on the smallest phone
    page = await hero_page(browser, 360, 740)
    try:
        await page.click(".tk .bcn", timeout=CLICK_MS); await page.wait_for_timeout(300)
        short = [x for x in await page.evaluate("[...document.querySelectorAll('#selp .est')].map(el => el.getBoundingClientRect().height)") if x < 43.5]
        if short: errs.append(f"360x740: a station is only {min(short):.0f} px tall")
        sheet = await page.evaluate("(() => { const b = document.querySelector('#selp .sheet').getBoundingClientRect(); return [b.left, b.right]; })()")
        if sheet[0] < -1 or sheet[1] > 361: errs.append(f"360x740: the station sheet ({sheet[0]:.0f}–{sheet[1]:.0f}) does not fit")
    except Exception: errs.append("360x740: '.tk .bcn' is not clickable")
    await page.close()
    return errs

async def check_own_fonts(browser):
    """The two letters come from the site itself, not from Google Fonts (privacy, plan de lanzamiento §6): no request
    leaves for fonts.googleapis.com or fonts.gstatic.com, and Young Serif and Literata 500/700 are loaded."""
    errs = []
    page = await open_page(browser, viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    asked = []; page.on("request", lambda r: asked.append(r.url))
    await page.clock.set_fixed_time("2026-09-28T08:00:00Z")   # 10:00 in Madrid
    await page.goto(parity_url); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(1500)
    google = sorted({u.split("/")[2] for u in asked if "fonts.googleapis.com" in u or "fonts.gstatic.com" in u})
    if google: errs.append(f"the page still asks {', '.join(google)} for its fonts")
    # FontFace.weight is one weight ('500', 'normal') or a variable font's range ('200 900')
    faces = await page.evaluate("""[...document.fonts].filter(f => f.status === 'loaded').map(f => [f.family.replace(/"/g, ''), f.weight])""")
    def weights(w):
        n = [{"normal": 400, "bold": 700}.get(x) or int(x) for x in w.split()]
        return range(n[0], n[-1] + 1)
    for family, weight in (("Young Serif", 400), ("Literata", 500), ("Literata", 700)):
        if not any(f == family and weight in weights(w) for f, w in faces): errs.append(f"{family} {weight} is not loaded (loaded: {faces})")
    await page.close()
    # cut to what the site writes (30-10, scripts/fuentes.py): on a desktop and on a phone the two letters weigh at
    # most 65 kB, the small Catalan files (60); the full latin ones (80) wait for a letter the site does not write
    for vp in ({"viewport": {"width": 1440, "height": 900}}, {"viewport": {"width": 390, "height": 844}, "device_scale_factor": 3, "is_mobile": True, "has_touch": True}):
        page = await open_page(browser, reduced_motion="reduce", **vp)
        woff = []
        async def size(r):
            if r.url.endswith(".woff2"):
                try: woff.append((r.url.rsplit("/", 1)[-1], len(await r.body())))
                except Exception: pass
        page.on("response", lambda r: asyncio.ensure_future(size(r)))
        await page.clock.set_fixed_time("2026-09-28T08:00:00Z")
        await page.goto(parity_url); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(1500)
        kb = sum(n for _, n in woff) / 1000
        if not woff or kb > 65: errs.append(f"{vp['viewport']['width']}px: the letters weigh {kb:.1f} kB: the full latin files came too ({woff})")
        await page.close()
    return errs

async def check_offline(browser):
    """17. Without a connection the site opens again, from what the first visit kept (src/sw.js)."""
    errs = []
    ctx = await browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
    page = await ctx.new_page(); page.set_default_timeout(120000)
    errors = []; page.on("pageerror", lambda e: errors.append(str(e)))
    await page.clock.set_fixed_time("2026-09-28T08:00:00Z")   # 10:00 in Madrid
    # a visitor from before 11-10 keeps Google's fonts in a cache of their own: the fonts now come with each build,
    # so that cache is dropped when the new worker takes over
    await page.add_init_script("caches.open('capacasa-fuentes')")
    await page.goto(parity_url)
    try: await page.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.controller !== null", timeout=60000)
    except Exception:
        errs.append("no offline worker takes over the page after the first visit"); await ctx.close(); return errs
    if "capacasa-fuentes" in await page.evaluate("caches.keys()"): errs.append("the offline worker keeps the old cache of Google's fonts")
    kept = await page.evaluate("""(async () => { const k = (await caches.keys()).find(k => k.startsWith('capacasa-') && k !== 'capacasa-fuentes');
      return k ? (await (await caches.open(k)).keys()).map(r => new URL(r.url).pathname) : []; })()""")
    for f in ["/"] + [p for p in await page.evaluate("[...document.querySelectorAll('script[src], link[rel=stylesheet][href^=\"/\"]')].map(e => new URL(e.src || e.href).pathname)")]:
        if f not in kept: errs.append(f"the offline worker does not keep {f} (keeps {kept})")
    await ctx.set_offline(True)
    try:
        await page.reload(); await page.wait_for_timeout(1500)
        board = await page.evaluate("(() => ({dep: document.getElementById('dep')?.textContent || '', worker: !!navigator.serviceWorker.controller}))()")
        if board["dep"] != "10:03": errs.append(f"offline the board shows «{board['dep']}», expected the 10:03")
        await page.evaluate("document.fonts.ready")
        loaded = await page.evaluate("""[...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '') + ' ' + f.weight)""")
        for face in ("Young Serif 400", "Literata 500", "Literata 700"):
            if face not in loaded: errs.append(f"offline {face} is not loaded (loaded: {loaded})")
    except Exception as e: errs.append(f"offline the page does not open again ({str(e)[:80]})")
    errs += [f"JS error offline: {e}" for e in errors]
    await ctx.close()
    return errs

async def main():
    failures = []
    if sys.argv[1:] == ["compartir"]:
        failures += check_share()
        print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · compartir"); sys.exit(1 if failures else 0)
    async with async_playwright() as p:
        # software WebGL so it also runs on machines without a GPU (slow but faithful)
        browser = await p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        if sys.argv[1:] == ["letras"]:
            failures += await check_letters_suite(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · letras"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["firma"]:
            failures += await check_firma(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · firma"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["red"]:
            failures += await check_red(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · red"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["horitzontal"]:
            failures += await check_landscape(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · horitzontal"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["hero"]:
            failures += await check_hero(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · hero"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["mesa"]:
            failures += await check_things_clear(browser)
            failures += await check_table_at_load(browser)
            failures += await check_table_follows(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · mesa"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["fuentes"]:
            failures += await check_own_fonts(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · fuentes"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["sinred"]:
            failures += await check_offline(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · sinred"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["pintado"]:
            for name, (w, h) in VIEWPORTS.items():
                page = await open_page(browser, viewport={"width": w, "height": h})
                await page.add_init_script(SCREEN_DRAWS); await page.add_init_script(SHADER_LINKS)
                await page.goto(page_url); await hero_settled(page)
                failures += [f"{name}: {e}" for e in await check_one_paint(page)]
                failures += [f"{name}: {e}" for e in await check_shaders_ready(page)]
                await page.close()
            failures += await check_still_idle(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · pintado"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["iman"]:
            failures += await check_magnet(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · iman"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["talons"]:
            failures += await check_talons(browser) + await check_days(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · talons"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["hora"]:
            failures += await check_hora(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · hora"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["moviment"]:
            failures += await check_paper_motion(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · moviment"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["fulls"]:
            failures += await check_sheet_holds_page(browser)
            failures += await check_sheet_close(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · fulls"); sys.exit(1 if failures else 0)
        if sys.argv[1:] == ["a11y"]:
            failures += await check_a11y(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · a11y"); sys.exit(1 if failures else 0)
        failures += await check_parity(browser)
        if sys.argv[1:] == ["paridad"]:
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · paridad"); sys.exit(1 if failures else 0)
        for name, (w, h) in VIEWPORTS.items():
            page = await open_page(browser, viewport={"width": w, "height": h})
            await page.add_init_script(SCREEN_DRAWS); await page.add_init_script(SHADER_LINKS)
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            await page.goto(page_url)
            await page.wait_for_timeout(9000)  # let the paint-in finish
            await hero_settled(page)  # ...and .top/.info's own entrance transition too (check_letters needs it settled)
            box = await page.evaluate("""(() => {
              const r = s => document.querySelector(s).getBoundingClientRect();
              const f = s => { const c = getComputedStyle(document.querySelector(s)); return c.fontFamily.split(',')[0].replace(/"/g,''); };
              return {name: r('.tauler').bottom, winTop: r('#win').top, winBottom: r('#win').bottom, info: r('#info').top,
                      texto: f('.soon'), serif: f('#dep')};
            })()""")
            if not box["name"] < box["winTop"]: failures.append(f"{name}: name overlaps window ({box['name']:.0f} ≥ {box['winTop']:.0f})")
            if not box["winBottom"] < box["info"]: failures.append(f"{name}: departure block overlaps window")
            if box["texto"] != "Literata": failures.append(f"{name}: small text font is {box['texto']}")
            if box["serif"] != "Young Serif": failures.append(f"{name}: time font is {box['serif']}")
            # the landscape's brush strokes are sized in the render target's pixels: a small window (phones) is
            # painted twice as fine as the desktop one, or each stroke covers too much of it and reads as pixels
            grain = await page.evaluate("""(() => { const g = window.reus.paisaje ? reus.paisaje() : null;
              return g == null ? null : {g, s: Math.min(devicePixelRatio || 1, 1.25),
                stacked: matchMedia('(max-width:700px), (max-aspect-ratio:4/5), (orientation:landscape) and (max-height:500px)').matches}; })()""")
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
            failures += [f"{name}: {e}" for e in await check_one_paint(page)]
            failures += [f"{name}: {e}" for e in await check_shaders_ready(page)]
            failures += [f"{name}: {e}" for e in await check_wash(page, name)]
            failures += [f"{name}: {e}" for e in await check_backstage(page, name)]
            failures += [f"{name}: {e}" for e in await check_letters(page, name)]
            await page.close()
        failures += await check_drop_width(browser)
        failures += await check_still_idle(browser)
        failures += await check_sizes(browser)
        failures += await check_landscape(browser)
        failures += [f"compartir: {e}" for e in check_share()]
        failures += [f"a11y: {e}" for e in await check_a11y(browser)]
        failures += [f"sinred: {e}" for e in await check_offline(browser)]
        failures += [f"fuentes: {e}" for e in await check_own_fonts(browser)]
        failures += [f"red: {e}" for e in await check_red(browser)]
        failures += [f"firma: {e}" for e in await check_firma(browser)]
        failures += [f"hero: {e}" for e in await check_hero(browser)]
        failures += [f"iman: {e}" for e in await check_magnet(browser)]
        failures += [f"mesa: {e}" for e in await check_table_at_load(browser)]
        failures += [f"mesa: {e}" for e in await check_table_follows(browser)]
        failures += [f"mesa: {e}" for e in await check_things_clear(browser)]
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
