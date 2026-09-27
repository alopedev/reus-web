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
     the pinned table fits the screen and, on landscape screens, the hero scales like a poster.
     With reduced motion nothing moves and everything is already in place.
  9. The wall darkens as a pigment wash painted in its own shader, not a flat DOM veil: it starts at
     the hinge and climbs the wall as the wall turns away, the texts on the wall dim with it, and
     nothing lingers once you scroll back to the top.
Also saves screenshots to screenshots/ for a visual review.

Needs: pip install playwright && playwright install chromium
Usage: python3 scripts/build.py && python3 scripts/check.py
"""
import asyncio, io, pathlib, sys
from PIL import Image
from playwright.async_api import async_playwright

root = pathlib.Path(__file__).resolve().parent.parent
page_url = (root / "dist/index.html").as_uri()
shots = root / "screenshots"; shots.mkdir(exist_ok=True)
VIEWPORTS = {"desktop": (1440, 860), "mobile": (390, 820)}

async def settle(page):
    """Software rendering is slow: wait until the scrubbed animations have caught up with the scroll."""
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
    await page.evaluate("scrollTo(0, document.scrollingElement.scrollHeight)")
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
    leaks = []
    # each frame is taken once the page has caught up with the scroll: software rendering can lag seconds behind
    # the compositor, and a frame from that gap shows a stale page, not the design
    for f in (.1, .25, .4, .55, .7, .85, .95):
        await page.evaluate(f"scrollTo({{top: innerHeight * {f}, behavior: 'instant'}})"); await page.wait_for_timeout(300)
        await hinge_caught_up(page)
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
        await hinge_caught_up(page)
        share = magenta(await page.screenshot())
        if share: leaks.append(f"jump {int(a * 100)}→{int(b * 100)}% ({share:.1%})")
    await page.evaluate("scrollTo(0, 0)")
    return [f"background shows during the transition at {', '.join(leaks)}"] if leaks else []

ANGLE = """(s => { const m = document.querySelector(s).style.transform.match(/rotateX\\((-?[\\d.]+)deg\\)/); return m ? +m[1] : 0; })"""

async def hinge_caught_up(page):
    """Software rendering gives very few frames: wait until the hinge has caught up with the scroll."""
    try:
        # hingeAt and dropped come from the page: the hinge is defined in one place only
        await page.wait_for_function("""Math.abs(parseFloat(document.getElementById('hero').style.transformOrigin.split(' ')[1])
          - hingeAt(dropped())) < 1""", timeout=15000)
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
      const st = ScrollTrigger.getAll().find(t => t.animation && t.animation.getChildren(false).length === 4);
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
    """Wait until every scrubbed animation has caught up with its scroll position (they lag on purpose, by .6 s)."""
    try: await page.wait_for_function("ScrollTrigger.getAll().every(t => !t.animation || Math.abs(t.animation.progress() - t.progress) < .005)", timeout=20000)
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
    near, far = await page.evaluate("""(() => { const w = document.getElementById('win').getBoundingClientRect(), seats = innerWidth / innerHeight > 1.15 ? .25 * innerHeight : 0;
      const x = w.right + (innerWidth - seats - w.right) / 2; return [[x, hingeAt(.3) - .02 * innerHeight], [x, w.top + .15 * w.height]]; })()""")
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

async def check_motion(page, name, reduced=False):
    """Halfway down, the wall is tilting (or, with reduced motion, still); at the end everything has landed."""
    errs = []
    await page.evaluate("scrollTo({top: 0, behavior: 'instant'})"); await page.wait_for_timeout(800)
    await page.evaluate("scrollTo({top: innerHeight * .5, behavior: 'instant'})"); await page.wait_for_timeout(1800)
    if not reduced and not await hinge_caught_up(page): errs.append("the hinge never catches up with the scroll at 50%")
    tilt = await page.evaluate("getComputedStyle(document.querySelector('#hero')).transform")
    if reduced and tilt not in ("none", ""): errs.append("wall moves with reduced motion")
    if not reduced and tilt in ("none", ""): errs.append("wall does not tilt while scrolling")
    await page.screenshot(path=str(shots / f"{name}-scroll50.png"))
    await page.evaluate("scrollTo(0, document.scrollingElement.scrollHeight)"); await settle(page)
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

async def check_sizes(browser):
    """Layout at every size: read straight from the page, no waiting for the painting."""
    failures = []
    for name, (w, h) in SIZES.items():
        page = await browser.new_page(viewport={"width": w, "height": h})
        await page.goto(page_url); await page.wait_for_timeout(1200)
        failures += [f"{name}: {e}" for e in await page.evaluate(FIT)]
        await page.close()
    return failures

async def main():
    failures = []
    async with async_playwright() as p:
        # software WebGL so it also runs on machines without a GPU (slow but faithful)
        browser = await p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        for name, (w, h) in VIEWPORTS.items():
            page = await browser.new_page(viewport={"width": w, "height": h})
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            await page.goto(page_url)
            await page.wait_for_timeout(9000)  # let the paint-in finish
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
            await page.close()
        failures += await check_sizes(browser)
        # reduced motion: a still frame and every paper already in place
        page = await browser.new_page(viewport={"width": 1440, "height": 860}, reduced_motion="reduce")
        await page.goto(page_url); await page.wait_for_timeout(3000)
        failures += [f"reduced: {e}" for e in await check_motion(page, "reduced", reduced=True)]
        await page.close()
        await browser.close()
    if failures:
        print("FAIL\n  " + "\n  ".join(failures)); sys.exit(1)
    print("OK · screenshots in screenshots/")

asyncio.run(main())
