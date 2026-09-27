"""Download Renfe's open GTFS (AV/LD/MD feed) and extract direct regional trains
Barcelona-Sants <-> Reus for the next 14 days into data/trains.json.

Format: {"YYYY-MM-DD": {"r": [[dep_min, arr_min, "train_no"], ...],   # Sants -> Reus
                        "b": [...],                                    # Reus -> Sants
                        "a": [...]}}                                   # kept from previous file (AVE to Camp de Tarragona, not used yet)
Minutes are counted from midnight, Madrid local time.

Stop IDs: Barcelona-Sants 71801, Reus 71400.
Usage: python3 scripts/extract_trains.py
"""
import csv, collections, datetime as dt, io, json, pathlib, urllib.request, zipfile

URL = "https://ssl.renfe.com/gtransit/Fichero_AV_LD/google_transit.zip"
SANTS, REUS = "71801", "71400"
root = pathlib.Path(__file__).resolve().parent.parent
out = root / "data/trains.json"

z = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(URL, timeout=60).read()))
def rows(name):
    with z.open(name) as f:
        r = csv.reader(io.TextIOWrapper(f, encoding="utf-8-sig"))
        head = [h.strip() for h in next(r)]
        for row in r:
            yield {head[i]: (row[i].strip() if i < len(row) else "") for i in range(len(head))}

stops = collections.defaultdict(dict)
for row in rows("stop_times.txt"):
    if row["stop_id"] in (SANTS, REUS):
        stops[row["trip_id"]][row["stop_id"]] = (row["departure_time"], row["arrival_time"], int(row["stop_sequence"]))
trips = {r["trip_id"]: (r["service_id"], r["trip_short_name"]) for r in rows("trips.txt")}
cal = {r["service_id"]: r for r in rows("calendar.txt")}
exc = collections.defaultdict(dict)
for r in rows("calendar_dates.txt"):
    exc[r["service_id"]][r["date"]] = r["exception_type"]
DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

def runs(sid, d):
    ds = d.strftime("%Y%m%d")
    if ds in exc[sid]:
        return exc[sid][ds] == "1"
    c = cal.get(sid)
    return bool(c) and c["start_date"] <= ds <= c["end_date"] and c[DAYS[d.weekday()]] == "1"

mins = lambda s: int(s.split(":")[0]) * 60 + int(s.split(":")[1])
today = dt.date.today()
result = collections.defaultdict(dict)
for key, a, b in (("r", SANTS, REUS), ("b", REUS, SANTS)):
    per_day = collections.defaultdict(set)
    for trip, v in stops.items():
        if a in v and b in v and v[a][2] < v[b][2]:
            sid, num = trips[trip]
            for i in range(14):
                d = today + dt.timedelta(i)
                if runs(sid, d):
                    per_day[d.isoformat()].add((mins(v[a][0]), mins(v[b][1]), num))
    for d, v in per_day.items():
        result[d][key] = [list(x) for x in sorted(v)]

old = json.loads(out.read_text(encoding="utf-8")) if out.exists() else {}
for d in result:
    result[d].setdefault("r", []); result[d].setdefault("b", [])
    result[d]["a"] = old.get(d, {}).get("a", [])
if not result:
    raise SystemExit("No trains found: check the stop IDs or the feed. data/trains.json left untouched.")
out.write_text(json.dumps(dict(sorted(result.items())), separators=(",", ":")), encoding="utf-8")
days = sorted(result)
print(f"{len(days)} days: {days[0]} → {days[-1]} · e.g. {days[0]}: {len(result[days[0]]['r'])} to Reus, {len(result[days[0]]['b'])} to Sants")
