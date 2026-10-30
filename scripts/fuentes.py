"""The two letters, cut to what the site writes (rendimiento/carga.md, 30-10): the latin files of @fontsource (Google's
subsets) carry Vietnamese, Icelandic, Polish… letters the site never shows. This cuts each one to the letters below,
keeping every OpenType feature (Literata's Catalan «l·l» is a `locl`), its hinting and Literata's whole weight axis,
so each letter draws exactly as before, and prints the unicode-range of each file for src/styles/fonts.css.
The full latin files stay in fonts.css behind these, for a letter that is not here (a new station name).
Needs fonttools and brotli (pip install fonttools brotli). Run it after a new letter or a new @fontsource:
python3 scripts/fuentes.py"""
import pathlib
from fontTools import subset
from fontTools.ttLib import TTFont

root = pathlib.Path(__file__).resolve().parent.parent
modules = root / "node_modules"
out = root / "src/styles/fuentes"

# printable ASCII, the no-break spaces, «·» and the Catalan (and Spanish, for Renfe's attribution) letters in both
# cases, ×, dashes, quotes, «…», ‹ › and €
LETTERS = ([*range(0x20, 0x7F)] + [0xA0, 0xAB, 0xB7, 0xBB, 0xD7] + [ord(c) for c in "ÀÇÈÉÍÏÑÒÓÚÜàçèéíïñòóúü"]
           + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0x202F, 0x2039, 0x203A, 0x20AC])

FILES = {
    "young-serif-catala.woff2": "@fontsource/young-serif/files/young-serif-latin-400-normal.woff2",
    "literata-catala-wght.woff2": "@fontsource-variable/literata/files/literata-latin-wght-normal.woff2",
}

def unicode_range(codes):
    runs, codes = [], sorted(codes)
    for c in codes:
        if runs and c == runs[-1][1] + 1: runs[-1][1] = c
        else: runs.append([c, c])
    return ", ".join(f"U+{a:04X}" if a == b else f"U+{a:04X}-{b:04X}" for a, b in runs)

def main():
    out.mkdir(exist_ok=True)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]; options.name_languages = ["*"]; options.name_legacy = True
    options.notdef_outline = True; options.glyph_names = True; options.hinting = True
    options.legacy_kern = True; options.symbol_cmap = True; options.prune_unicode_ranges = False
    for name, source in FILES.items():
        font = subset.load_font(str(modules / source), options)
        cutter = subset.Subsetter(options); cutter.populate(unicodes=LETTERS); cutter.subset(font)
        subset.save_font(font, str(out / name), options)
        drawn = TTFont(out / name).getBestCmap()
        print(f"{name}: {(modules / source).stat().st_size / 1000:.1f} → {(out / name).stat().st_size / 1000:.1f} kB")
        print(f"  unicode-range: {unicode_range(drawn)};")

if __name__ == "__main__":
    main()
