# temporary: why red.json has a Sants->Reus 15:33->17:03 on 2026-11-04 that trains.json does not
import csv, collections, io, json, sys, zipfile
SANTS, REUS = "71801", "71400"
DATES = ["20261028", "20261103", "20261104", "20261105"]
DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
import datetime as dt
def feed(path):
    z = zipfile.ZipFile(path)
    def rows(name):
        with z.open(name) as f:
            r = csv.reader(io.TextIOWrapper(f, encoding="utf-8-sig")); head = [h.strip() for h in next(r)]
            for row in r: yield {head[i]: (row[i].strip() if i < len(row) else "") for i in range(len(head))}
    return z, rows
for label, path in (("AV_LD", sys.argv[1]), ("FOMENTO", sys.argv[2])):
    z, rows = feed(path)
    names = z.namelist()
    cal = {r["service_id"]: r for r in rows("calendar.txt")} if "calendar.txt" in names else {}
    exc = collections.defaultdict(dict)
    if "calendar_dates.txt" in names:
        for r in rows("calendar_dates.txt"): exc[r["service_id"]][r["date"]] = r["exception_type"]
    def runs(sid, ds):
        if ds in exc[sid]: return exc[sid][ds] == "1"
        c = cal.get(sid); d = dt.datetime.strptime(ds, "%Y%m%d").date()
        return bool(c) and c["start_date"] <= ds <= c["end_date"] and c[DAYS[d.weekday()]] == "1"
    ends = sorted(c["end_date"] for c in cal.values()); starts = sorted(c["start_date"] for c in cal.values())
    print(f"== {label}: {len(cal)} services, start {starts[:1]}..{starts[-1:]}, end {ends[:1]}..{ends[-1:]}")
    for ds in DATES: print("  services running", ds, sum(runs(s, ds) for s in set(cal) | set(exc)))
    st = collections.defaultdict(dict)
    for r in rows("stop_times.txt"):
        if r["stop_id"] in (SANTS, REUS): st[r["trip_id"]][r["stop_id"]] = (r["departure_time"], r["arrival_time"], int(r["stop_sequence"]))
    trips = {r["trip_id"]: r for r in rows("trips.txt")}
    for tid, v in sorted(st.items(), key=lambda kv: kv[1].get(SANTS, ("",))[0]):
        if SANTS in v and REUS in v and v[SANTS][2] < v[REUS][2] and "14:30" <= v[SANTS][0][:5] <= "16:30":
            t = trips[tid]; sid = t["service_id"]
            print(f"  {tid} short={t.get('trip_short_name')} route={t.get('route_id')} svc={sid} Sants {v[SANTS][0]} Reus {v[REUS][1]}",
                  "cal=" + (f"{cal[sid]['start_date']}-{cal[sid]['end_date']} {''.join(cal[sid][d][0] for d in DAYS)}" if sid in cal else "-"),
                  "runs=" + ",".join(ds[4:] for ds in DATES if runs(sid, ds)))
tj = json.load(open("data/trains.json")); rj = json.load(open("data/red.json"))
for d in ("2026-10-28", "2026-11-03", "2026-11-04"):
    print("trains.json r", d, [(f"{a//60:02d}:{a%60:02d}", n) for a, b, n in tj.get(d, {}).get("r", []) if 14*60 <= a <= 17*60])
    out = []
    for i in rj["dias"].get(d, []):
        t = rj["trenes"][i]; s = {x[0]: x for x in t["s"]}
        if SANTS in s and REUS in s and 14*60 <= s[SANTS][2] <= 17*60: out.append((f"{s[SANTS][2]//60:02d}:{s[SANTS][2]%60:02d}", t.get("n"), t.get("p"), f"{s[REUS][1]//60:02d}:{s[REUS][1]%60:02d}"))
    print("red.json      ", d, sorted(out))
