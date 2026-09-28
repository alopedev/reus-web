"""Design checks for the hero, on desktop and mobile. Exits non-zero if a rule breaks.

Rules checked:
  1. The site name never overlaps the window (name bottom < window top).
  2. The departure block starts below the window (window bottom < info top).
  3. No JavaScript errors on load.
  4. Small text uses Karla; times use Young Serif.
  5. The hero shows a scroll hint; below it, the shelf holds its three paper objects,
     uses the same two fonts and nothing sticks out sideways.
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
     motion and the clock fixed at 10:00 in Madrid): the guard for refactors that must change nothing.
     A missing reference is written from the current build; delete one to renew it.
  11. Fase 3, the letters' journey: scrolling from the hero to the table, the letters of h1.brand peel off the
     wall as paper cut-outs and land forming h2#qe, paired by position (reus.letras.pair) — with "Nombre" the
     pairing must match the approved prototype exactly: N→Q, o→u, m→é, b→e, r→gap (fuses), e→s. Before the
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
Also saves screenshots to screenshots/ for a visual review.

Needs: pip install playwright && playwright install chromium
Usage: npm run build && python3 scripts/check.py [paridad|letras]   (or: npm run check)
       (paridad: only check 10, in a minute; letras: only check 11, on desktop and mobile, in a minute)
"""
import asyncio, functools, http.server, io, os, pathlib, sys, threading
from PIL import Image, ImageChops, ImageStat
from playwright.async_api import async_playwright

root = pathlib.Path(__file__).resolve().parent.parent
# served over HTTP, as the real site will be: ES modules do not load from file://
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(root / "dist")))
threading.Thread(target=server.serve_forever, daemon=True).start()
page_url = f"http://127.0.0.1:{server.server_address[1]}/"
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
      return {missing, wide, sideways, heading: q('#qe') ? f(q('#qe')) : null, body: q('#repisa p') ? f(q('#repisa p')) : null};
    })()""")
    if shelf["missing"]: errs.append(f"shelf is missing {', '.join(shelf['missing'])}")
    if shelf["sideways"]: errs.append("the page scrolls sideways")
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
# The pairing Àlex approved for the current placeholder name: chip i is the i-th letter of "Nombre" (source
# order is preserved on the wall side); QE_TARGET[i] is which character of "Qué es" it lands on (index 3 is the
# space, where the 'r' chip has no letter to become and fuses instead). See docs/referencias/viaje-letras.md.
QE_TARGET = [0, 1, 2, 4, 3, 5]
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
    sin pareja (nombre más corto) aparecen solas con un fundido corto. Con 'Nombre' -> 'Qué es' debe dar
    exactamente el emparejado del prototipo aprobado: N->Q, o->u, m->é, b->e, r->hueco (se funde), e->s.
    reus.letras.state(p) debe existir también: es la función pura que usan el resto de los checks."""
    ok = await page.evaluate("""() => !!(window.reus && window.reus.letras
      && typeof window.reus.letras.pair === 'function' && typeof window.reus.letras.state === 'function')""")
    if not ok: return ["reus.letras.pair/state is missing"]
    errs = []
    proto = await page.evaluate("() => window.reus.letras.pair('Nombre', 'Qué es')")
    got = [[it.get("from"), it.get("to")] for it in proto] if isinstance(proto, list) and all(isinstance(it, dict) for it in proto) else None
    expected = [["N", "Q"], ["o", "u"], ["m", "é"], ["b", "e"], ["r", None], ["e", "s"]]
    if got != expected: errs.append(f"pair('Nombre','Qué es') = {got}, expected {expected} (the approved prototype pairing)")

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
    if st["count"] != 6: errs.append(f"{st['count']} chips at p=0.3, expected 6 (as many as letters in 'Nombre')")
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
    transforms of #hero/#repisa, within 3 px. Uses the pairing Àlex approved for 'Nombre' -> 'Qué es'."""
    errs = []
    for i in range(6):
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
        await page.goto(page_url); await page.evaluate("document.fonts.ready"); await page.wait_for_timeout(2500)
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

async def main():
    failures = []
    async with async_playwright() as p:
        # software WebGL so it also runs on machines without a GPU (slow but faithful)
        browser = await p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        if sys.argv[1:] == ["letras"]:
            failures += await check_letters_suite(browser)
            await browser.close(); print("FAIL\n  " + "\n  ".join(failures) if failures else "OK · letras"); sys.exit(1 if failures else 0)
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
