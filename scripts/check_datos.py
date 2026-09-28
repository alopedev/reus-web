"""Checks data/red.json against its contract (docs/referencias/datos-red-contrato.md).
Exits non-zero if a rule breaks. Pure standard library: no dependencies, runs in seconds.

Rules checked:
  1. The file exists, loads as JSON, and has fuente exactly «Origen de los datos: Renfe
     Operadora», actualizado (an ISO date), estaciones, trenes and dias.
  2. dias covers at least 14 consecutive days from actualizado; every index it lists
     points to an existing train.
  3. Every train: n is non-empty, p is one of R11/R13/R14/R15/R16/R17/AVE/AVLO, it has
     at least 2 stops, every stop's stop_id is in estaciones, arrival <= departure at
     each stop, and times never go backwards along s.
  4. Every train touches at least one Barcelona station (71801, 71802, 79009, 79400) —
     the site is Barcelona <-> your town.
  5. AVE/AVLO trains only stop, among the saved stations, at Sants (71801) and Camp de
     Tarragona (04104).
  6. No duplicates: within the same day, no two trains share n, and no two trains share
     the same sequence of (stop_id, salida) — the same physical train under another number.
  7. Stations: the Barcelona ones carry barcelona: true; every town carries a non-empty
     comarca and lineas; Camp de Tarragona (04104) carries lineas == ["AVE"] or including AVE.
  8. Coverage: at least the 59 towns with a direct train to Barcelona (by stops.txt name)
     are present, and Reus (71400) is in Baix Camp.
  9. Parity with the current site: for every date present in both data/trains.json and
     red.json, the direct Sants->Reus trains derived from red.json (a train stopping at
     71801 then later at 71400) match trains.json's "r" key exactly on (salida, llegada),
     and Reus->Sants matches "b". Reports concrete extra/missing departures (HH:MM).
  10. There is an AVE Sants -> Camp de Tarragona every day (at least 5 a day), and the
      same in the opposite direction.
  11. Size: red.json is <= 150 KB gzip-compressed.

Usage: python3 scripts/check_datos.py [path-to-red.json]   (default: data/red.json)
"""
import gzip, json, pathlib, sys

root = pathlib.Path(__file__).resolve().parent.parent

SANTS, PDG, CLOT, FRANCA = "71801", "71802", "79009", "79400"
BARCELONA_IDS = {SANTS, PDG, CLOT, FRANCA}
REUS = "71400"
CAMP_TARRAGONA = "04104"
PRODUCTOS = {"R11", "R13", "R14", "R15", "R16", "R17", "AVE", "AVLO"}
ALTA_VELOCIDAD = {"AVE", "AVLO"}
MAX_BYTES_GZIP = 150 * 1024

# the 59 towns with a direct train to Barcelona (by stops.txt name), sorted.
# See docs/referencias/datos-red-contrato.md and the GTFS investigation for how this list was built.
PUEBLOS_59 = sorted([
    "Alcover", "Altafulla-Tamarit", "Ascó", "Bellvitge - Gornal", "Bordils-Juià",
    "Caldes de Malavella", "Camallera", "Camarles-Deltebre", "Cambrils", "Camp-redó",
    "Capçanes", "Celrà", "Cerbère", "Colera", "Duesaigües-L'Argentera",
    "El Prat Aeroport", "El Prat de Llobregat", "Figueres", "Flaçà",
    "Fornells de la Selva", "Girona", "Granollers Centre", "Gualba", "Hostalric",
    "L'Aldea-Amposta-Tortosa", "L'Ametlla de Mar", "L'Ampolla-El Perelló-Deltebre",
    "L'Hospitalet de l'Infant", "La Plana-Picamoixons", "La Selva del Camp",
    "Les Borges del Camp", "Llançà", "Marçà-Falset", "Maçanet-Massanes",
    "Móra la Nova", "Nulles-Bràfim", "Portbou", "Pradell", "Reus",
    "Riells i Viabrea-Breda", "Riudecanyes-Botarell", "Riudellots", "Roda de Mar",
    "Salomó", "Salou-Port Aventura", "Sant Celoni", "Sant Jordi Desvalls",
    "Sant Miquel de Fluvià", "Sant Vicenç de Calders", "Sils", "Tarragona",
    "Torredembarra", "Tortosa", "Valls", "Vila-seca", "Vilabella", "Vilajuïga",
    "Vilamalla", "Vilanova i la Geltrú",
])


def load(path):
    """Returns (data, errors). data is None if it could not be loaded."""
    if not path.exists():
        return None, [f"{path} does not exist"]
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError as e:
        return None, [f"cannot read {path}: {e}"]
    try:
        return json.loads(raw), []
    except json.JSONDecodeError as e:
        return None, [f"{path} is not valid JSON: {e}"]


def capped(errs, n=5):
    if len(errs) <= n:
        return errs
    return errs[:n] + [f"... and {len(errs) - n} more"]


def check_top_level(d):
    """Rule 1: shape and the fixed fuente string."""
    errs = []
    fuente = d.get("fuente")
    if fuente != "Origen de los datos: Renfe Operadora":
        errs.append(f"fuente should be «Origen de los datos: Renfe Operadora», got {fuente!r}")
    for key in ("actualizado", "estaciones", "trenes", "dias"):
        if key not in d:
            errs.append(f"missing top-level key {key!r}")
    if "actualizado" in d:
        try:
            iso_date(d["actualizado"])
        except ValueError:
            errs.append(f"actualizado is not an ISO date: {d['actualizado']!r}")
    return errs


def iso_date(s):
    import datetime as dt
    return dt.date.fromisoformat(s)


def check_dias(d):
    """Rule 2: 14 consecutive days from actualizado, indices point to real trains."""
    errs = []
    dias = d.get("dias")
    trenes = d.get("trenes")
    actualizado = d.get("actualizado")
    if not isinstance(dias, dict) or not isinstance(trenes, list) or not actualizado:
        return ["cannot check dias: missing dias/trenes/actualizado"]
    try:
        start = iso_date(actualizado)
    except ValueError:
        return []  # already reported by check_top_level
    import datetime as dt
    missing_days = [
        (start + dt.timedelta(days=i)).isoformat()
        for i in range(14)
        if (start + dt.timedelta(days=i)).isoformat() not in dias
    ]
    if missing_days:
        errs.append(f"dias does not cover 14 consecutive days from {actualizado}: missing {', '.join(missing_days)}")
    bad_indices = []
    for day, indices in dias.items():
        if not isinstance(indices, list):
            errs.append(f"dias[{day!r}] is not a list of indices")
            continue
        for idx in indices:
            if not isinstance(idx, int) or not (0 <= idx < len(trenes)):
                bad_indices.append(f"{day}: index {idx!r}")
    errs += [f"dias points to a non-existent train: {e}" for e in capped(bad_indices)]
    return errs


def check_trenes(d):
    """Rule 3: n, p, stops, stop_id membership, non-decreasing times."""
    errs = []
    trenes = d.get("trenes")
    estaciones = d.get("estaciones", {})
    if not isinstance(trenes, list):
        return ["trenes is not a list"]
    bad = []
    for i, t in enumerate(trenes):
        label = f"train #{i} (n={t.get('n')!r})"
        if not t.get("n"):
            bad.append(f"{label}: empty n")
        if t.get("p") not in PRODUCTOS:
            bad.append(f"{label}: p={t.get('p')!r} not in {sorted(PRODUCTOS)}")
        s = t.get("s")
        if not isinstance(s, list) or len(s) < 2:
            bad.append(f"{label}: fewer than 2 stops")
            continue
        prev_salida = None
        for stop in s:
            if not isinstance(stop, list) or len(stop) != 3:
                bad.append(f"{label}: malformed stop {stop!r}")
                continue
            stop_id, llegada, salida = stop
            if stop_id not in estaciones:
                bad.append(f"{label}: stop {stop_id!r} not in estaciones")
            if not (isinstance(llegada, (int, float)) and isinstance(salida, (int, float))):
                bad.append(f"{label}: non-numeric times at {stop_id!r}")
                continue
            if llegada > salida:
                bad.append(f"{label}: arrival {llegada} > departure {salida} at {stop_id!r}")
            if prev_salida is not None and llegada < prev_salida:
                bad.append(f"{label}: time goes backwards at {stop_id!r} ({llegada} < {prev_salida})")
            prev_salida = salida
    errs += capped(bad)
    return errs


def check_toca_barcelona(d):
    """Rule 4: every train touches a Barcelona station."""
    bad = []
    for t in d.get("trenes", []):
        ids = {stop[0] for stop in t.get("s", []) if isinstance(stop, list) and stop}
        if not ids & BARCELONA_IDS:
            bad.append(f"train n={t.get('n')!r} (p={t.get('p')!r}) never touches Barcelona")
    return capped(bad)


def check_alta_velocidad_paradas(d):
    """Rule 5: AVE/AVLO only stop at Sants and Camp de Tarragona."""
    bad = []
    allowed = {SANTS, CAMP_TARRAGONA}
    for t in d.get("trenes", []):
        if t.get("p") not in ALTA_VELOCIDAD:
            continue
        ids = {stop[0] for stop in t.get("s", []) if isinstance(stop, list) and stop}
        extra = ids - allowed
        if extra:
            bad.append(f"{t.get('p')} train n={t.get('n')!r} stops at {sorted(extra)}, only Sants/Camp de Tarragona allowed")
    return capped(bad)


def check_duplicados(d):
    """Rule 6: within a day, no two trains share n, or the same (stop_id, salida) sequence."""
    trenes = d.get("trenes", [])
    dias = d.get("dias", {})
    bad = []
    for day, indices in dias.items():
        if not isinstance(indices, list):
            continue
        seen_n, seen_seq = {}, {}
        for idx in indices:
            if not isinstance(idx, int) or not (0 <= idx < len(trenes)):
                continue
            t = trenes[idx]
            n = t.get("n")
            if n in seen_n:
                bad.append(f"{day}: n={n!r} appears twice (trains #{seen_n[n]} and #{idx})")
            else:
                seen_n[n] = idx
            seq = tuple((stop[0], stop[2]) for stop in t.get("s", []) if isinstance(stop, list) and len(stop) == 3)
            if seq in seen_seq:
                bad.append(f"{day}: trains #{seen_seq[seq]} (n={trenes[seen_seq[seq]].get('n')!r}) and "
                            f"#{idx} (n={n!r}) share the same stop sequence — same physical train")
            else:
                seen_seq[seq] = idx
    return capped(bad)


def check_estaciones(d):
    """Rule 7: Barcelona flag, comarca/lineas for towns, Camp de Tarragona's lineas."""
    errs = []
    estaciones = d.get("estaciones", {})
    bad = []
    for sid, info in estaciones.items():
        if not isinstance(info, dict):
            bad.append(f"{sid}: not an object")
            continue
        if sid in BARCELONA_IDS:
            if info.get("barcelona") is not True:
                bad.append(f"{sid} ({info.get('nombre')}): missing barcelona: true")
            continue
        if sid == CAMP_TARRAGONA:
            lineas = info.get("lineas")
            if lineas != ["AVE"] and (not isinstance(lineas, list) or "AVE" not in lineas):
                bad.append(f"{sid} (Camp de Tarragona): lineas should be [\"AVE\"] or include AVE, got {lineas!r}")
            continue
        # a plain town
        if not info.get("comarca"):
            bad.append(f"{sid} ({info.get('nombre')}): missing comarca")
        if not info.get("lineas"):
            bad.append(f"{sid} ({info.get('nombre')}): missing or empty lineas")
    errs += capped(bad)
    return errs


def check_cobertura(d):
    """Rule 8: the 59 towns with a direct train to Barcelona are present, plus Reus/Baix Camp."""
    errs = []
    estaciones = d.get("estaciones", {})
    trenes = d.get("trenes", [])
    by_nombre = {}
    for sid, info in estaciones.items():
        if isinstance(info, dict) and info.get("nombre"):
            by_nombre.setdefault(info["nombre"], []).append(sid)
    served_ids = set()
    for t in trenes:
        for stop in t.get("s", []):
            if isinstance(stop, list) and stop:
                served_ids.add(stop[0])
    missing = []
    for nombre in PUEBLOS_59:
        ids = by_nombre.get(nombre)
        if not ids:
            missing.append(f"{nombre}: no station with this name in estaciones")
            continue
        if not any(sid in served_ids for sid in ids):
            missing.append(f"{nombre}: station {ids} has no train")
    errs += capped(missing)
    reus = estaciones.get(REUS)
    if not reus:
        errs.append(f"{REUS} (Reus) is not in estaciones")
    elif reus.get("comarca") != "Baix Camp":
        errs.append(f"{REUS} (Reus): comarca should be Baix Camp, got {reus.get('comarca')!r}")
    return errs


def check_paridad(d, trains_path):
    """Rule 9: direct Sants<->Reus trains match data/trains.json's r/b keys exactly."""
    if not trains_path.exists():
        return []  # nothing to compare against
    try:
        trains = json.loads(trains_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        return [f"cannot read {trains_path} for parity: {e}"]

    trenes = d.get("trenes", [])
    dias = d.get("dias", {})

    def hhmm(m):
        return f"{m // 60:02d}:{m % 60:02d}"

    def derive(day, origin, dest):
        """(salida, llegada) pairs for trains that stop at origin, then later at dest."""
        pairs = set()
        for idx in dias.get(day, []):
            if not isinstance(idx, int) or not (0 <= idx < len(trenes)):
                continue
            s = trenes[idx].get("s", [])
            pos = {stop[0]: i for i, stop in enumerate(s) if isinstance(stop, list) and len(stop) == 3}
            if origin in pos and dest in pos and pos[origin] < pos[dest]:
                salida = s[pos[origin]][2]
                llegada = s[pos[dest]][1]
                pairs.add((salida, llegada))
        return pairs

    errs = []
    for day, entry in trains.items():
        if day not in dias:
            continue
        for key, origin, dest in (("r", SANTS, REUS), ("b", REUS, SANTS)):
            expected = {(row[0], row[1]) for row in entry.get(key, [])}
            actual = derive(day, origin, dest)
            missing = sorted(expected - actual)
            extra = sorted(actual - expected)
            diffs = [f"missing {hhmm(dep)}->{hhmm(arr)}" for dep, arr in missing] + \
                    [f"extra {hhmm(dep)}->{hhmm(arr)}" for dep, arr in extra]
            if diffs:
                errs.append(f"{day} [{key}]: {', '.join(capped(diffs, 5))}")
    return capped(errs, 10)


def check_ave_camp_tarragona(d):
    """Rule 10: at least 5 AVE/AVLO Sants->Camp de Tarragona every day, and the reverse."""
    trenes = d.get("trenes", [])
    dias = d.get("dias", {})
    errs = []
    for day, indices in dias.items():
        if not isinstance(indices, list):
            continue
        counts = {"ida": 0, "vuelta": 0}
        for idx in indices:
            if not isinstance(idx, int) or not (0 <= idx < len(trenes)):
                continue
            t = trenes[idx]
            if t.get("p") not in ALTA_VELOCIDAD:
                continue
            s = t.get("s", [])
            pos = {stop[0]: i for i, stop in enumerate(s) if isinstance(stop, list) and len(stop) == 3}
            if SANTS in pos and CAMP_TARRAGONA in pos:
                if pos[SANTS] < pos[CAMP_TARRAGONA]:
                    counts["ida"] += 1
                elif pos[CAMP_TARRAGONA] < pos[SANTS]:
                    counts["vuelta"] += 1
        if counts["ida"] < 5:
            errs.append(f"{day}: only {counts['ida']} AVE/AVLO Sants->Camp de Tarragona (need >= 5)")
        if counts["vuelta"] < 5:
            errs.append(f"{day}: only {counts['vuelta']} AVE/AVLO Camp de Tarragona->Sants (need >= 5)")
    return capped(errs)


def check_tamano(path):
    """Rule 11: <= 150 KB gzip-compressed."""
    try:
        raw = path.read_bytes()
    except OSError as e:
        return [f"cannot read {path} to measure size: {e}"]
    size = len(gzip.compress(raw))
    if size > MAX_BYTES_GZIP:
        return [f"{path} is {size / 1024:.1f} KB gzipped, over the {MAX_BYTES_GZIP / 1024:.0f} KB limit"]
    return []


def run(path, trains_path):
    failures = []
    d, load_errs = load(path)
    if load_errs:
        return load_errs
    for prefix, fn in (
        ("shape", lambda: check_top_level(d)),
        ("dias", lambda: check_dias(d)),
        ("trenes", lambda: check_trenes(d)),
        ("barcelona", lambda: check_toca_barcelona(d)),
        ("alta velocidad", lambda: check_alta_velocidad_paradas(d)),
        ("duplicados", lambda: check_duplicados(d)),
        ("estaciones", lambda: check_estaciones(d)),
        ("cobertura", lambda: check_cobertura(d)),
        ("paridad", lambda: check_paridad(d, trains_path)),
        ("AVE Camp de Tarragona", lambda: check_ave_camp_tarragona(d)),
        ("tamaño", lambda: check_tamano(path)),
    ):
        failures += [f"{prefix}: {e}" for e in fn()]
    return failures


if __name__ == "__main__":
    red_path = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "data/red.json"
    trains_path = root / "data/trains.json"
    failures = run(red_path, trains_path)
    if failures:
        print("FAIL\n  " + "\n  ".join(failures))
        sys.exit(1)
    print("OK · datos")
