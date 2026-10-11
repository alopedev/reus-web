"""The site's icon (opción A, Àlex 11-10): a flap of the name's board with its «C», in Young Serif drawn as a path.
src/public/favicon.svg is the tab's; scripts/icono-casa.svg, the same flap on the wall's colour, is the phone home
screen's. This draws the pictures browsers want from them, with Chromium:
  src/public/favicon.ico            16, 32 and 48 px, for browsers that ask /favicon.ico on their own
  src/public/apple-touch-icon.png   180 × 180, opaque (iOS paints see-through pixels black)
Run it after changing either SVG: python3 scripts/icono.py"""
import asyncio, io, pathlib
from PIL import Image
from playwright.async_api import async_playwright

root = pathlib.Path(__file__).resolve().parent.parent

async def draw(page, svg, px):
    await page.set_viewport_size({"width": px, "height": px})
    await page.set_content(f"<style>*{{margin:0}}svg{{display:block;width:{px}px;height:{px}px}}</style>{svg.read_text()}")
    return Image.open(io.BytesIO(await page.screenshot(omit_background=True))).convert("RGBA")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(); page = await browser.new_page()
        tab = root / "src/public/favicon.svg"
        big = await draw(page, tab, 48)
        big.save(root / "src/public/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[await draw(page, tab, 16), await draw(page, tab, 32)])
        (await draw(page, root / "scripts/icono-casa.svg", 180)).convert("RGB").save(root / "src/public/apple-touch-icon.png", optimize=True)
        await browser.close()

asyncio.run(main())
