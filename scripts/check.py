"""Design checks for the hero, on desktop and mobile. Exits non-zero if a rule breaks.

Rules checked:
  1. The site name never overlaps the window (name bottom < window top).
  2. The departure block starts below the window (window bottom < info top).
  3. No JavaScript errors on load.
  4. Small text uses Familjen Grotesk; times use Young Serif.
  5. The hero shows a scroll hint; below it, the shelf holds its three paper objects,
     uses the same two fonts and nothing sticks out sideways.
Also saves screenshots to screenshots/ for a visual review.

Needs: pip install playwright && playwright install chromium
Usage: python3 scripts/build.py && python3 scripts/check.py
"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright

root = pathlib.Path(__file__).resolve().parent.parent
page_url = (root / "dist/index.html").as_uri()
shots = root / "screenshots"; shots.mkdir(exist_ok=True)
VIEWPORTS = {"desktop": (1440, 860), "mobile": (390, 820)}

async def check_shelf(page, name):
    """The shelf below the hero: a visible hint to scroll, the three paper objects, nothing sticking out sideways."""
    errs = []
    hint = await page.evaluate("""(() => { const m = document.querySelector('#more');
      if(!m) return null; const r = m.getBoundingClientRect(); return {bottom: r.bottom, h: innerHeight}; })()""")
    if not hint: return ["no scroll hint (#more) in the hero"]
    if hint["bottom"] > hint["h"]: errs.append("scroll hint is below the fold")
    if not await page.evaluate("document.scrollingElement.scrollHeight > innerHeight + 10"):
        return errs + ["page does not scroll"]
    await page.evaluate("document.querySelector('#repisa').scrollIntoView({block:'start'})")
    await page.wait_for_timeout(2500)
    shelf = await page.evaluate("""(() => {
      const q = s => document.querySelector(s), f = el => getComputedStyle(el).fontFamily.split(',')[0].replace(/"/g,'');
      const missing = ['#qe', '#folleto', '#cuaderno', '#reverso'].filter(s => !q(s));
      const wide = [...document.querySelectorAll('#repisa *')].filter(el => { const r = el.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); })
        .slice(0, 3).map(el => el.id || el.className || el.tagName);
      return {missing, wide, heading: q('#qe') ? f(q('#qe')) : null, body: q('#repisa p') ? f(q('#repisa p')) : null};
    })()""")
    if shelf["missing"]: errs.append(f"shelf is missing {', '.join(shelf['missing'])}")
    if shelf["wide"]: errs.append(f"shelf sticks out sideways: {', '.join(shelf['wide'])}")
    if shelf["heading"] and shelf["heading"] != "Young Serif": errs.append(f"shelf heading font is {shelf['heading']}")
    if shelf["body"] and shelf["body"] != "Familjen Grotesk": errs.append(f"shelf text font is {shelf['body']}")
    await page.locator('#repisa').screenshot(path=str(shots / f"{name}-repisa.png"))
    return errs

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
            if box["sans"] != "Familjen Grotesk": failures.append(f"{name}: small text font is {box['sans']}")
            if box["serif"] != "Young Serif": failures.append(f"{name}: time font is {box['serif']}")
            failures += [f"{name}: JS error: {e}" for e in errors]
            await page.screenshot(path=str(shots / f"{name}.png"))
            print(f"{name}: name→{box['name']:.0f}px, window {box['winTop']:.0f}–{box['winBottom']:.0f}px, info→{box['info']:.0f}px")
            failures += [f"{name}: {e}" for e in await check_shelf(page, name)]
            await page.close()
        await browser.close()
    if failures:
        print("FAIL\n  " + "\n  ".join(failures)); sys.exit(1)
    print("OK · screenshots in screenshots/")

asyncio.run(main())
