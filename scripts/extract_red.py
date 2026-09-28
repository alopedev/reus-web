"""Genera data/red.json: la red de Rodalies/regionales de Catalunya con tren directo
a Barcelona (R11, R13-R17) mas AVE/Avlo Barcelona-Sants <-> Camp de Tarragona.

Sigue la regla final de la investigacion (docs/referencias/datos-red.md, seccion 5) y
el contrato de docs/referencias/datos-red-contrato.md (formato, tests en check_datos.py).

Fuentes GTFS de Renfe:
  - "fom" = Fichero_CER_FOMENTO (Rodalies/Media Distancia, nacional): base de los
    regionales R11/R13-R17, tal cual. No trae numero de tren (trip_short_name) ni
    calendar_dates.txt; cada service_id de fom cubre un unico dia (start_date ==
    end_date), asi que un trip_id de fom identifica un tren en un dia concreto.
  - "av"  = Fichero_AV_LD (Alta Velocidad/Larga Distancia, nacional): completa los
    regionales que fom no trae completos o no trae en absoluto (producto REGIONAL,
    REG.EXP. o MD que toca Barcelona) y aporta el AVE/Avlo Sants <-> Camp de Tarragona.

Regla de fusion (docs/referencias/datos-red.md #5):
  1. Base: todos los trips de fom en R11/R13-R17 que tocan una estacion de Barcelona
     (Sants/Passeig de Gracia/Clot/Franca) se quedan; el resto (tramos que no llegan
     a Barcelona, p.ej. Lleida-Pirineus -> La Plana-Picamoixons) no se guardan como
     tren suelto, pero sus paradas cuentan para la heuristica de linea del punto 4.
  2. Completar con av: los trips de av se agrupan primero por numero de tren
     (trip_short_name) -- ver punto 5 -- y se procesan una vez por numero, no por
     trip_id ni por dia (fom y av a veces registran la llegada a una misma estacion
     de Barcelona con 1-2 min de diferencia para el mismo tren fisico; comparar toda
     la firma de Barcelona -salida en cada parada de Barcelona, en orden- evita que
     esa diferencia, o una coincidencia de minuto entre dos trenes distintos, decida
     mal si es un duplicado). Un tren de av cuyo producto sea REGIONAL/REG.EXP./MD,
     que toque una estacion de Barcelona Y una parada ya incluida en la red (pueblo
     real, no solo Barcelona -- si no, cualquier regional que pase por Barcelona
     colaria):
       - Si su firma de Barcelona coincide, en algun dia en que circula, con la de
         un tren de fom ya admitido -> es el mismo tren fisico (normalmente
         REGIONAL, que duplica fom 1:1; tambien el caso de un tren que fom trae
         partido en un tramo interno, como Lleida via La Plana-Picamoixons). Se usa
         el tren completo de av (con su numero real) para TODOS los dias en que
         circula -- coincida o no fom ese dia concreto -- y se descarta el/los
         trip_id de fom que hacian de tramo corto (si no, el mismo tren fisico
         saldria una vez como tramo corto de fom y otra como version completa de
         av). La linea (`p`) se toma de fom (autoritativa), no de la heuristica.
       - Si no coincide en ningun dia -> se anade completo desde av, con la linea
         de la heuristica del punto 4 (los REG.EXP./MD que fom no tiene en
         absoluto: Ribera d'Ebre, Tortosa-Ulldecona, Girona-Portbou...).
  3. AVE/Avlo: de av, producto cuyo route_short_name empieza por AVE (incluye
     "AVE INT") o es AVLO, solo paradas Sants y Camp de Tarragona.
  4. `p` de los regionales que vienen de av sin coincidir con fom (REGIONAL/REG.EXP./
     MD no es un codigo de linea valido en el contrato): se asigna la linea R11-R17
     de fom con la que el tren comparte mas paradas (todas las paradas de todos los
     trips de fom de esa linea en el rango, toquen o no Barcelona). Empate -> orden
     R11,R13,R14,R15,R16,R17.
  5. Deduplicar av (regionales y AVE/Avlo) por numero de tren: un mismo
     trip_short_name puede tener varios trip_id/service_id (reexportaciones con
     rangos solapados, o simplemente periodos de calendario consecutivos) -- se
     agrupan todos bajo el numero, se toma el horario de uno cualquiera (coincide
     entre todos) y se unen los dias en que circula cualquiera de ellos.
  6. Solo paradas en Catalunya: una parada se descarta si su nombre no esta en la
     tabla COMARCA de este script (que solo cubre poblaciones catalanas). Barcelona
     y Camp de Tarragona se conservan siempre. Si una parada SI aparece en un tren
     guardado y no tiene comarca, el script falla con un mensaje claro (no se
     inventa una comarca).
  7. Un mismo tren fisico (misma linea/producto + misma secuencia de paradas y
     horas) que circula varios dias se guarda una sola vez en `trenes`; `dias` lista
     los indices que circulan cada fecha.

Uso:
  python3 scripts/extract_red.py [--fomento RUTA] [--avld RUTA] [--desde AAAA-MM-DD]

--fomento / --avld aceptan un .zip o una carpeta ya descomprimida con los CSV del
feed; si se omiten, se descargan de ssl.renfe.com (para que corra en GitHub Actions).
--desde fija el primer dia (por defecto, hoy en Europe/Madrid) para poder repetir
pruebas con un resultado estable.
"""
import argparse, collections, csv, datetime as dt, gzip, io, json, pathlib, sys
import urllib.request, zipfile
from zoneinfo import ZoneInfo

FOMENTO_URL = "https://ssl.renfe.com/ftransit/Fichero_CER_FOMENTO/fomento_transit.zip"
AVLD_URL = "https://ssl.renfe.com/gtransit/Fichero_AV_LD/google_transit.zip"

SANTS, PDG, CLOT, FRANCA = "71801", "71802", "79009", "79400"
# paradas que se descartan a sabiendas: fuera de Catalunya (Arago, Pais Valencia) y las estaciones de Barcelona
# que no usamos (solo Sants, Passeig de Gracia, El Clot y Franca). Cualquier otra parada sin comarca hace fallar el script
FUERA = {
    "Caspe", "Fabara", "Nonaspe", "La Puebla de Híjar", "La Zaida-Sástago", "Quinto", "Samper",
    "Zaragoza Delicias", "Zaragoza-Goya", "Zaragoza-Miraflores", "Zaragoza-Portillo",
    "Alcalá de Chivert", "Benicarló-Peñíscola", "Benicàssim", "Castelló de la Plana", "Nules la Villavella", "Orpesa",
    "Sagunt", "Torreblanca", "València-Cabanyal", "València-Estació del Nord", "Vila-Real", "Vinaròs",
    "Barcelona Sant Andreu",
}
BARCELONA = {
    SANTS: "Barcelona-Sants", PDG: "Barcelona-Passeig de Gracia",
    CLOT: "Barcelona El Clot", FRANCA: "Barcelona Estacio de Franca",
}
CAMP_TARRAGONA = "04104"
LINEAS_FOM = ["R11", "R13", "R14", "R15", "R16", "R17"]
PRODUCTOS_REGIONALES_AV = {"REGIONAL", "REG.EXP.", "MD"}
DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
NDIAS = 14

root = pathlib.Path(__file__).resolve().parent.parent
out = root / "data/red.json"

# Comarca de cada pueblo con tren directo a Barcelona. Punto de partida: la tabla
# COMARCA del prototipo (rama prototipo/selector-pueblo, src/prototipo/datos_proto.py),
# ampliada con los pueblos que solo entran en la red por el feed av (completando un
# tren que fom trae partido o que fom no trae en absoluto, ver docstring): Lleida-
# Pirineus, Puigverd de Lleida-Artesa de Lleida, Les Borges Blanques, L'Espluga de
# Francoli y Montblanc (linea Lleida-Barcelona via La Plana-Picamoixons) y Ulldecona-
# Alcanar-La Senia (R16).
COMARCA = {
    "Bellvitge - Gornal": "Barcelones", "El Prat Aeroport": "Baix Llobregat",
    "El Prat de Llobregat": "Baix Llobregat", "Granollers Centre": "Valles Oriental",
    "Sant Celoni": "Valles Oriental", "Gualba": "Valles Oriental",
    "Riells i Viabrea-Breda": "Selva", "Hostalric": "Selva", "Maçanet-Massanes": "Selva",
    "Sils": "Selva", "Caldes de Malavella": "Selva", "Riudellots": "Selva",
    "Fornells de la Selva": "Gironès", "Girona": "Gironès", "Celrà": "Gironès",
    "Bordils-Juià": "Gironès", "Flaçà": "Gironès", "Sant Jordi Desvalls": "Gironès",
    "Camallera": "Alt Empordà", "Sant Miquel de Fluvià": "Alt Empordà",
    "Vilamalla": "Alt Empordà", "Figueres": "Alt Empordà", "Vilajuïga": "Alt Empordà",
    "Llançà": "Alt Empordà", "Colera": "Alt Empordà", "Portbou": "Alt Empordà",
    "Cerbère": "Rosselló",
    "Nulles-Bràfim": "Alt Camp", "Roda de Mar": "Tarragonès", "Salomó": "Tarragonès",
    "Valls": "Alt Camp", "Vilabella": "Alt Camp", "La Plana-Picamoixons": "Alt Camp",
    "Sant Vicenç de Calders": "Baix Penedès", "Alcover": "Alt Camp",
    "La Selva del Camp": "Baix Camp", "Reus": "Baix Camp", "Vila-seca": "Tarragonès",
    "Altafulla-Tamarit": "Tarragonès", "Tarragona": "Tarragonès",
    "Torredembarra": "Tarragonès", "Ascó": "Ribera d'Ebre", "Capçanes": "Priorat",
    "Duesaigües-L'Argentera": "Baix Camp", "Les Borges del Camp": "Baix Camp",
    "Marçà-Falset": "Priorat", "Móra la Nova": "Ribera d'Ebre", "Pradell": "Priorat",
    "Riudecanyes-Botarell": "Baix Camp", "Vilanova i la Geltrú": "Garraf",
    "Camarles-Deltebre": "Baix Ebre", "Cambrils": "Baix Camp", "Camp-redó": "Baix Ebre",
    "L'Aldea-Amposta-Tortosa": "Baix Ebre", "L'Ametlla de Mar": "Baix Ebre",
    "L'Ampolla-El Perelló-Deltebre": "Baix Ebre", "L'Hospitalet de l'Infant": "Baix Camp",
    "Tortosa": "Baix Ebre", "Salou-Port Aventura": "Tarragonès",
    # Ampliaciones sobre el prototipo:
    "Ulldecona-Alcanar-La Sénia": "Montsià",
    # paradas de trenes directos a Barcelona que solo trae av (Lleida por Valls y La Riba, Ribera d'Ebre)
    "Flix": "Ribera d'Ebre", "Riba-roja d'Ebre": "Ribera d'Ebre", "Faió-La Pobla de Massaluca": "Terra Alta",
    "Juneda": "Garrigues", "Vinaixa": "Garrigues", "La Riba": "Alt Camp",
    "Vilaverd": "Conca de Barberà", "Vimbodí i Poblet": "Conca de Barberà", "La Floresta": "Vallès Occidental",
    "Lleida-Pirineus": "Segrià",
    "Puigverd de Lleida-Artesa de Lleida": "Segrià",
    "Les Borges Blanques": "Garrigues",
    "L'Espluga de Francolí": "Conca de Barberà",
    "Montblanc": "Conca de Barberà",
}


# ---------- lectura GTFS (zip o carpeta descomprimida) ----------

class GTFS:
    """Envoltorio para leer ficheros de un feed GTFS desde un .zip o una carpeta."""

    def __init__(self, zf=None, dirpath=None):
        self.zf, self.dirpath = zf, dirpath

    def _open(self, name):
        if self.zf is not None:
            try:
                return io.TextIOWrapper(self.zf.open(name), encoding="utf-8-sig", newline="")
            except KeyError:
                return None
        p = self.dirpath / name
        if not p.exists():
            return None
        return p.open(encoding="utf-8-sig", newline="")

    def rows(self, name):
        """Yields dicts, campos con espacios recortados (como extract_trains.py)."""
        fh = self._open(name)
        if fh is None:
            return
        with fh:
            r = csv.reader(fh)
            try:
                head = [h.strip() for h in next(r)]
            except StopIteration:
                return
            for row in r:
                yield {head[i]: (row[i].strip() if i < len(row) else "") for i in range(len(head))}

    def fast_rows(self, name, wanted_cols, trip_ids=None):
        """Lector rapido para ficheros grandes (stop_times.txt): evita construir un
        dict por fila y, si se da `trip_ids`, descarta la fila antes de tocar el
        resto de columnas. Devuelve tuplas (trip_id, *wanted_cols)."""
        fh = self._open(name)
        if fh is None:
            return
        with fh:
            r = csv.reader(fh)
            try:
                head = [h.strip() for h in next(r)]
            except StopIteration:
                return
            idx = {h: i for i, h in enumerate(head)}
            positions = [idx[c] for c in wanted_cols]
            trip_pos = idx["trip_id"]
            for row in r:
                trip_id = row[trip_pos].strip()
                if trip_ids is not None and trip_id not in trip_ids:
                    continue
                yield (trip_id, *(row[p].strip() for p in positions))


def load_gtfs(spec, default_url):
    if spec is None:
        print(f"  descargando {default_url} ...", file=sys.stderr)
        data = urllib.request.urlopen(default_url, timeout=180).read()
        return GTFS(zf=zipfile.ZipFile(io.BytesIO(data)))
    p = pathlib.Path(spec)
    if p.is_dir():
        return GTFS(dirpath=p)
    return GTFS(zf=zipfile.ZipFile(p))


def mins(t):
    """'H:MM:SS' o 'HH:MM:SS' -> minutos desde medianoche (puede pasar de 1440)."""
    h, m, _s = t.split(":")
    return int(h) * 60 + int(m)


def build_calendar(gtfs):
    cal = {r["service_id"]: r for r in gtfs.rows("calendar.txt")}
    exc = collections.defaultdict(dict)
    for r in gtfs.rows("calendar_dates.txt"):
        exc[r["service_id"]][r["date"]] = r["exception_type"]
    return cal, exc


def runs(cal, exc, sid, d):
    ds = d.strftime("%Y%m%d")
    if ds in exc.get(sid, {}):
        return exc[sid][ds] == "1"
    c = cal.get(sid)
    return bool(c) and c["start_date"] <= ds <= c["end_date"] and c[DAYS[d.weekday()]] == "1"


# ---------- fom: regionales R11/R13-R17 ----------

def load_fom(gtfs, day_range):
    """Devuelve:
      - fom_trains: lista de dicts {trip_id, date, line, stops:[(seq,stop_id,arr,dep)]}
        (todas las paradas, sin filtrar Catalunya todavia), solo trips activos en
        day_range cuya linea sea R11/R13-R17.
      - line_stops: {linea: set(stop_id)} de TODOS los trips de fom de esa linea en
        el rango (toquen o no Barcelona), para la heuristica de asignacion de `p`.
    """
    routes = {}
    for r in gtfs.rows("routes.txt"):
        name = r["route_short_name"]
        if name in LINEAS_FOM:
            routes[r["route_id"]] = name
    if not routes:
        raise SystemExit("fom: no se ha encontrado ninguna de las lineas R11/R13-R17 en routes.txt")

    trip_line, trip_service = {}, {}
    for r in gtfs.rows("trips.txt"):
        line = routes.get(r["route_id"])
        if line:
            trip_line[r["trip_id"]] = line
            trip_service[r["trip_id"]] = r["service_id"]
    if not trip_line:
        raise SystemExit("fom: no hay trips en las lineas R11/R13-R17")

    service_date = {}
    for r in gtfs.rows("calendar.txt"):
        if r["service_id"] not in {trip_service[t] for t in trip_line}:
            continue
        if r["start_date"] != r["end_date"]:
            raise SystemExit(
                f"fom: se esperaba que cada service_id cubriera un solo dia, pero "
                f"{r['service_id']!r} va de {r['start_date']} a {r['end_date']} -- "
                f"revisa build_calendar/load_fom, el feed puede haber cambiado de forma"
            )
        service_date[r["service_id"]] = dt.datetime.strptime(r["start_date"], "%Y%m%d").date()

    day_set = set(day_range)
    trip_ids = {
        t for t, sid in trip_service.items()
        if sid in service_date and service_date[sid] in day_set
    }
    if not trip_ids:
        raise SystemExit("fom: ningun trip de R11/R13-R17 cae dentro del rango de dias pedido")

    stops_by_trip = collections.defaultdict(list)
    for trip_id, stop_id, seq, arr, dep in gtfs.fast_rows(
        "stop_times.txt", ("stop_id", "stop_sequence", "arrival_time", "departure_time"),
        trip_ids=trip_ids,
    ):
        stops_by_trip[trip_id].append((int(seq), stop_id, mins(arr), mins(dep)))

    fom_trains, line_stops = [], collections.defaultdict(set)
    for trip_id in trip_ids:
        stops = sorted(stops_by_trip.get(trip_id, []))
        if not stops:
            continue
        line = trip_line[trip_id]
        for _seq, stop_id, _a, _d in stops:
            line_stops[line].add(stop_id)
        fom_trains.append({
            "trip_id": trip_id, "date": service_date[trip_service[trip_id]],
            "line": line, "stops": stops,
        })
    return fom_trains, line_stops


# ---------- av: completar regionales + AVE/Avlo ----------

def load_av_candidates(gtfs):
    """route_id -> producto en mayusculas (REGIONAL/REG.EXP./MD/AVE.../AVLO), solo
    los productos que nos interesan."""
    route_product = {}
    for r in gtfs.rows("routes.txt"):
        prod = r["route_short_name"].strip().upper()
        if prod in PRODUCTOS_REGIONALES_AV or prod.startswith("AVE") or prod == "AVLO":
            route_product[r["route_id"]] = prod
    return route_product


def load_av_trips(gtfs, route_product):
    """trip_id -> (service_id, trip_short_name, producto)."""
    trips = {}
    for r in gtfs.rows("trips.txt"):
        prod = route_product.get(r["route_id"])
        if prod:
            trips[r["trip_id"]] = (r["service_id"], r["trip_short_name"].strip(), prod)
    return trips


# ---------- filtro Catalunya + comarca ----------

def filter_catalunya(stops, stop_names, dropped):
    """Quita las paradas fuera de Catalunya, conservando el orden: se queda con Barcelona, Camp de
    Tarragona y las estaciones con comarca en COMARCA, y descarta las de FUERA. Una parada que no
    este en ninguna de las dos listas (Renfe ha anadido una estacion) hace fallar el script: nunca
    se descarta en silencio un pueblo catalan."""
    kept = []
    for seq, stop_id, arr, dep in stops:
        name = stop_names.get(stop_id, stop_id)
        if stop_id in BARCELONA or stop_id == CAMP_TARRAGONA or name in COMARCA:
            kept.append((seq, stop_id, arr, dep))
        elif name in FUERA:
            dropped.add(name)
        else:
            raise SystemExit(f"Parada {stop_id} ({name!r}) desconocida: anadela a COMARCA (si es catalana) o a FUERA "
                             f"en scripts/extract_red.py. data/red.json no se ha tocado.")
    return kept


def best_line(stop_ids, line_stops):
    """Linea de fom (R11/R13-R17) con la que `stop_ids` comparte mas paradas.
    Empate -> la primera en el orden fijo LINEAS_FOM. None si no hay ningun
    solape (no deberia pasar: ya se exige tocar una parada de la red)."""
    best, best_n = None, 0
    for line in LINEAS_FOM:
        n = len(stop_ids & line_stops.get(line, set()))
        if n > best_n:
            best, best_n = line, n
    return best, best_n


# ---------- programa principal ----------

def parse_args():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--fomento", help="zip o carpeta del feed Fichero_CER_FOMENTO (por defecto, se descarga)")
    p.add_argument("--avld", help="zip o carpeta del feed Fichero_AV_LD (por defecto, se descarga)")
    p.add_argument("--desde", help="AAAA-MM-DD; por defecto, hoy en Europe/Madrid")
    return p.parse_args()


def main():
    args = parse_args()
    if args.desde:
        start = dt.date.fromisoformat(args.desde)
    else:
        start = dt.datetime.now(ZoneInfo("Europe/Madrid")).date()
    day_range = [start + dt.timedelta(days=i) for i in range(NDIAS)]

    print("Leyendo fom (Fichero_CER_FOMENTO)...", file=sys.stderr)
    fom_gtfs = load_gtfs(args.fomento, FOMENTO_URL)
    fom_trains, line_stops = load_fom(fom_gtfs, day_range)
    dropped = set()   # paradas de av fuera de Catalunya (o nuevas sin comarca): se listan al final

    stop_names = {}
    for r in fom_gtfs.rows("stops.txt"):
        if r["stop_name"]:
            stop_names[r["stop_id"]] = r["stop_name"]

    print("Leyendo av (Fichero_AV_LD)...", file=sys.stderr)
    av_gtfs = load_gtfs(args.avld, AVLD_URL)
    for r in av_gtfs.rows("stops.txt"):
        if r["stop_id"] not in stop_names and r["stop_name"]:
            stop_names[r["stop_id"]] = r["stop_name"]

    route_product = load_av_candidates(av_gtfs)
    av_trips = load_av_trips(av_gtfs, route_product)
    cal, exc = build_calendar(av_gtfs)

    av_stops_by_trip = collections.defaultdict(list)
    for trip_id, stop_id, seq, arr, dep in av_gtfs.fast_rows(
        "stop_times.txt", ("stop_id", "stop_sequence", "arrival_time", "departure_time"),
        trip_ids=set(av_trips),
    ):
        av_stops_by_trip[trip_id].append((int(seq), stop_id, mins(arr), mins(dep)))
    for trip_id in av_stops_by_trip:
        av_stops_by_trip[trip_id].sort()

    # -- red_stations: paradas (no-Barcelona) que ya forman parte de la red segun
    # los trenes de fom que SI tocan Barcelona (paso 1 de la regla de fusion). --
    fom_by_date = collections.defaultdict(list)
    for t in fom_trains:
        if any(s[1] in BARCELONA for s in t["stops"]):
            fom_by_date[t["date"]].append(t)

    red_stations = set()
    for trains in fom_by_date.values():
        for t in trains:
            red_stations.update(s[1] for s in t["stops"] if s[1] not in BARCELONA)

    # -- indice fecha -> {firma de Barcelona: trip_id}, para detectar duplicados de av
    # y prestarles el numero de tren. La firma es la tupla ORDENADA de (stop_id,
    # llegada, salida) en las paradas de Barcelona del tren de fom -- comparar solo
    # un punto (una estacion + un minuto) hace falsos positivos cuando dos trenes
    # distintos coinciden por casualidad en un solo minuto (visto en la practica:
    # dos trenes de lineas distintas llegando a Sants en el mismo minuto). --
    def bcn_signature(stops):
        # Solo la salida: fom y av a veces registran la llegada a un mismo minuto
        # real con 1-2 min de diferencia (fom mas fino, av repite la salida como
        # llegada); la salida es estable entre feeds y es ademas la misma clave
        # que usa check_datos.py para detectar "mismo tren fisico" (regla 6).
        return tuple((sid, e) for _seq, sid, a, e in stops if sid in BARCELONA)

    fom_bcn_index = collections.defaultdict(dict)  # date -> {firma: trip_id}
    fom_by_trip_id = {t["trip_id"]: t for t in fom_trains}
    touching_trip_ids = {t["trip_id"] for trains in fom_by_date.values() for t in trains}
    for t in fom_trains:
        if t["trip_id"] not in touching_trip_ids:
            continue  # no toca Barcelona: no puede prestar/recibir numero por esta via
        sig = bcn_signature(t["stops"])
        if sig:
            fom_bcn_index[t["date"]].setdefault(sig, t["trip_id"])

    fom_numero = {}  # trip_id -> numero de tren prestado por av (solo informativo)
    # trip_id de fom que un tren de av ya cubre (mismo tren fisico): no se emite por
    # separado, el tren completo se toma de av (ver bloque siguiente).
    absorbed_fom_trip_ids = set()

    # -- av trae reexportaciones periodicas con rangos de fecha solapados: el mismo
    # numero de tren puede tener varios trip_id/service_id activos el mismo dia (o en
    # semanas consecutivas) con identico horario (docs/referencias/datos-red.md #3).
    # Se agrupa por numero, quedandose con un trip_id cualquiera de los activos como
    # representante del horario y uniendo los dias en que circula CUALQUIERA de sus
    # trip_id. El horario (y por tanto la firma de comparacion con fom) es UNA sola
    # cosa por numero, calculada una vez -- si se recalculara por dia, un mismo tren
    # fisico podria acabar repartido en varias entradas de `trenes` con `p` distinto
    # segun que dias coincidieran con fom y cuales no (visto en la practica). --
    by_numero = collections.defaultdict(list)
    for trip_id, (service_id, numero, prod) in av_trips.items():
        key = numero if numero else trip_id  # sin numero: no se agrupa con nada
        by_numero[key].append(trip_id)

    # -- av: candidatos regionales/REG.EXP./MD y AVE/Avlo, uno por numero --
    ave_ocurrencias = []      # [(date, p, tuple(stops filtrados), numero)]
    regional_ocurrencias = []  # idem

    for numero, trip_ids in by_numero.items():
        dias_numero = set()
        for tid in trip_ids:
            service_id = av_trips[tid][0]
            for d in day_range:
                if runs(cal, exc, service_id, d):
                    dias_numero.add(d)
        if not dias_numero:
            continue
        trip_id = trip_ids[0]  # representante: cualquiera vale, el horario coincide
        _service_id, numero, prod = av_trips[trip_id]
        stops = av_stops_by_trip.get(trip_id)
        if not stops or len(stops) < 2:
            continue
        stop_ids = {s[1] for s in stops}

        if prod.startswith("AVE") or prod == "AVLO":
            if SANTS not in stop_ids or CAMP_TARRAGONA not in stop_ids:
                continue
            p = "AVE" if prod.startswith("AVE") else "AVLO"
            kept = [s for s in stops if s[1] in (SANTS, CAMP_TARRAGONA)]
            seq = tuple((sid, a, e) for _sq, sid, a, e in kept)
            for d in dias_numero:
                ave_ocurrencias.append((d, p, seq, numero))
            continue

        # REGIONAL / REG.EXP. / MD
        if not (stop_ids & BARCELONA.keys()):
            continue
        if not (stop_ids & red_stations):
            continue  # no toca ninguna parada ya presente en la red (mas alla de Barcelona)

        kept = filter_catalunya(stops, stop_names, dropped)
        if len(kept) < 2:
            continue
        seq = tuple((sid, a, e) for _sq, sid, a, e in kept)

        # coincide con fom (misma firma de Barcelona) en algun dia en que este tren
        # circula? -> es un duplicado; se usa la linea que fom le da (autoritativa)
        # y se absorbe el/los trip_id de fom para no emitirlos por separado. Si
        # coincide en dias distintos con lineas de fom distintas (variantes de
        # ruta con el mismo numero), se usa la mas frecuente.
        sig = bcn_signature(stops)
        matched_lines = collections.Counter()
        matched_ftids = []
        if sig:
            for d in dias_numero:
                ftid = fom_bcn_index[d].get(sig)
                if ftid:
                    matched_ftids.append(ftid)
                    matched_lines[fom_by_trip_id[ftid]["line"]] += 1

        if matched_lines:
            line = matched_lines.most_common(1)[0][0]
            absorbed_fom_trip_ids.update(matched_ftids)
            for ftid in matched_ftids:
                fom_numero.setdefault(ftid, numero)
        else:
            line, n_overlap = best_line(stop_ids, line_stops)
            if not line:
                print(
                    f"  aviso: tren av {numero!r} ({prod}) no comparte ninguna parada "
                    f"con R11/R13-R17; se descarta (no se le puede asignar linea)",
                    file=sys.stderr,
                )
                continue

        for d in dias_numero:
            regional_ocurrencias.append((d, line, seq, numero))

    # -- fom: construir las ocurrencias finales, salvo los trips absorbidos por un
    # tren completo de av (mismo tren fisico, ver arriba). --
    fom_ocurrencias = []
    for date, trains in fom_by_date.items():
        for t in trains:
            if t["trip_id"] in absorbed_fom_trip_ids:
                continue
            kept = filter_catalunya(t["stops"], stop_names, dropped)
            if len(kept) < 2:
                continue
            seq = tuple((sid, a, e) for _sq, sid, a, e in kept)
            fom_ocurrencias.append((date, t["line"], seq, t["trip_id"]))

    # -- unir por (linea/producto, secuencia de paradas): mismo tren fisico en varios
    # dias -> una sola entrada en `trenes`, con `dias` apuntando a todas las fechas. --
    todas = fom_ocurrencias + regional_ocurrencias + ave_ocurrencias
    signatures = {}   # (p, stops) -> indice en `trenes`
    trenes = []
    dias = collections.defaultdict(set)
    for date, p, stops, numero in todas:
        key = (p, stops)
        idx = signatures.get(key)
        if idx is None:
            idx = len(trenes)
            signatures[key] = idx
            trenes.append({"n": numero, "p": p, "s": [list(s) for s in stops]})
        elif not trenes[idx]["n"] and numero:
            trenes[idx]["n"] = numero
        dias[date.isoformat()].add(idx)

    # -- ultima red: el mismo tren fisico dos veces en un dia (los feeds difieren a veces
    # en un minuto en una estacion, p. ej. Passeig de Gracia, o Renfe da dos numeros al
    # mismo tren, uno de ellos alargado hasta Ulldecona). Mismo criterio que la regla 6
    # de check_datos.py: dos o mas estaciones comunes, en el mismo orden, saliendo con
    # un minuto de diferencia como mucho. Se queda el de mas paradas; si empatan, el que
    # tiene numero de tren real (los de fom sin pareja llevan su trip_id). --
    def same_train(x, y):
        sx = {sid: e for sid, _a, e in x["s"]}; sy = {sid: e for sid, _a, e in y["s"]}
        shared = [sid for sid, _a, _e in x["s"] if sid in sy]
        return (len(shared) >= 2 and shared == [sid for sid, _a, _e in y["s"] if sid in sx]
                and all(abs(sx[k] - sy[k]) <= 1 for k in shared))
    rank = lambda i: (len(trenes[i]["s"]), trenes[i]["n"].isdigit())
    for date, idxs in dias.items():
        kept = []
        for i in sorted(idxs, key=rank, reverse=True):
            if not any(same_train(trenes[i], trenes[k]) for k in kept):
                kept.append(i)
        dias[date] = set(kept)
    used = sorted({i for idxs in dias.values() for i in idxs})
    remap = {old: new for new, old in enumerate(used)}
    trenes = [trenes[i] for i in used]
    dias = {d: {remap[i] for i in idxs} for d, idxs in dias.items()}

    if not trenes:
        raise SystemExit("No se ha generado ningun tren: revisa los feeds/rango de fechas. data/red.json no se ha tocado.")

    # -- estaciones: solo las que aparecen en algun tren --
    used_ids = {sid for t in trenes for sid, _a, _e in t["s"]}
    estaciones = {}
    for sid in used_ids:
        if sid in BARCELONA:
            estaciones[sid] = {"nombre": stop_names.get(sid, BARCELONA[sid]), "barcelona": True}
            continue
        if sid == CAMP_TARRAGONA:
            estaciones[sid] = {"nombre": stop_names.get(sid, "Camp de Tarragona"), "lineas": ["AVE"]}
            continue
        name = stop_names.get(sid)
        comarca = COMARCA.get(name)
        if not comarca:
            raise SystemExit(
                f"Estacion {sid} ({name!r}) no tiene comarca asignada en COMARCA -- "
                f"anadela a scripts/extract_red.py antes de seguir (no se inventa)."
            )
        estaciones[sid] = {"nombre": name, "comarca": comarca, "lineas": set()}

    for t in trenes:
        for sid, _a, _e in t["s"]:
            if sid == CAMP_TARRAGONA:
                continue  # ya fijado a ["AVE"]
            if sid in BARCELONA:
                estaciones[sid].setdefault("lineas", set()).add(t["p"])
            else:
                estaciones[sid]["lineas"].add(t["p"])
    for info in estaciones.values():
        if "lineas" in info:
            info["lineas"] = sorted(info["lineas"])

    data = {
        "fuente": "Origen de los datos: Renfe Operadora",
        "actualizado": start.isoformat(),
        "estaciones": estaciones,
        "trenes": trenes,
        "dias": {d: sorted(idxs) for d, idxs in dias.items()},
    }
    out.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    size_gzip = len(gzip.compress(out.read_bytes()))
    print(
        f"{len(estaciones)} estaciones, {len(trenes)} trenes, {len(dias)} dias "
        f"-> {out} ({size_gzip / 1024:.1f} KB gzip)",
        file=sys.stderr,
    )
    print(f"Paradas descartadas (FUERA): {', '.join(sorted(dropped)) or 'ninguna'}", file=sys.stderr)


if __name__ == "__main__":
    main()
