"""Build dist/index.html: the hero template with the timetable embedded.

Usage: python3 scripts/build.py
"""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
tpl = (root / "src/hero.html").read_text(encoding="utf-8")
data = json.loads((root / "data/trains.json").read_text(encoding="utf-8"))
assert "__DATA__" in tpl, "src/hero.html must contain the __DATA__ placeholder"
out = root / "dist/index.html"
out.parent.mkdir(exist_ok=True)
out.write_text(tpl.replace("__DATA__", json.dumps(data, separators=(",", ":"))), encoding="utf-8")
days = sorted(data)
print(f"dist/index.html written · {len(days)} days of timetable, {days[0]} → {days[-1]}")
