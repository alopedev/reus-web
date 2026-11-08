"""Every Rodalies line with a direct train to Barcelona (R1, R2, R2 Nord, R2 Sud, R3, R4, R7, R8), for anyone in
Catalonia (Àlex, 08-11-2026). They go to data/rodalies.json, apart from red.json: the web does not read them yet, and
they weigh four times the rest of the network. A train counts if it calls at a station in Barcelona itself (Sants,
Passeig de Gràcia, Plaça de Catalunya, Arc de Triomf, Clot, França, Sant Andreu, La Sagrera, Fabra i Puig, Torre Baró)
and somewhere else; a train red.json already has (Rodalies calls R2 Sud a few R15 to Flix) is not repeated.
Run: python3 -m unittest discover -s scripts/test"""
import json, pathlib, sys, tempfile, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import check_datos, extract_red


def stops(*xs):
    return [(i + 1, sid, a, e) for i, (sid, a, e) in enumerate(xs)]


NAMES = {"71801": "Barcelona-Sants", "78805": "Barcelona Plaça de Catalunya", "78804": "Barcelona Arc de Triomf",
         "79009": "Barcelona El Clot", "79404": "Badalona", "79500": "Mataró", "79606": "Blanes",
         "71600": "Sant Vicenç de Calders", "71701": "Sitges", "71500": "Tarragona", "71210": "Flix",
         "78802": "Barcelona Fabra i Puig", "77102": "La Garriga", "77109": "Vic", "79300": "Girona",
         "78200": "Tardienta", "99999": "Estació nova"}
LL = {"79500": [41.533, 2.446], "79404": [41.445, 2.249], "79606": [41.673, 2.769]}

# Renfe's Rodalies feed of 08-11-2026: the R1 25601 from L'Hospitalet to Maçanet, cut to a few stops
R1_25601 = stops(("71801", 330, 331), ("78805", 335, 336), ("78804", 337, 338), ("79009", 341, 341),
                 ("79404", 349, 349), ("79500", 372, 373), ("79606", 412, 412))
R1_25603 = stops(("71801", 360, 361), ("78805", 365, 366), ("79500", 402, 403))
# the R2 Sud 28009 from Sant Vicenç to França, by Sitges
R2S_28009 = stops(("71600", 400, 400), ("71701", 425, 426), ("71801", 460, 461))
# a train Rodalies calls R2 Sud that red.json has as an R15 (to Flix), a minute off at Sants
R2S_15009 = stops(("71210", 300, 300), ("71500", 380, 382), ("71801", 450, 452))
R15_15009 = [["71210", 300, 300], ["71500", 380, 382], ["71801", 451, 451]]
# the R3 between La Garriga and Vic, cut off from Barcelona by the works: no direct train
R3_VIC = stops(("77102", 500, 500), ("77109", 540, 540))
# the R3 bus from Fabra i Puig (works): not a train
R3_BUS = stops(("78802", 480, 480), ("77102", 520, 520))
# a train that only calls in Barcelona
ONLY_BCN = stops(("71801", 600, 600), ("78805", 605, 605), ("78802", 615, 615))


def fom(trip_id, line, date, xs, bus=False):
    return {"trip_id": trip_id, "date": date, "line": line, "bus": bus, "stops": xs}


D1, D2 = extract_red.dt.date(2026, 11, 9), extract_red.dt.date(2026, 11, 10)


def build(trains, red_trenes=(), red_dias=None, names=NAMES):
    return extract_red.rodalies(list(trains), list(red_trenes), red_dias or {}, names, set())


class RodaliesTrains(unittest.TestCase):
    def test_a_train_to_barcelona_keeps_every_catalan_stop_its_line_and_its_number(self):
        trenes, dias = build([fom("5112L25601R1", "R1", D1, R1_25601)])
        self.assertEqual(trenes, [{"n": "25601", "p": "R1", "s": [list(x[1:]) for x in R1_25601]}])
        self.assertEqual(dias, {D1.isoformat(): {0}})

    def test_the_same_train_on_two_days_is_saved_once(self):
        trenes, dias = build([fom("5112L25601R1", "R1", D1, R1_25601), fom("5113M25601R1", "R1", D2, R1_25601),
                              fom("5112L25603R1", "R1", D1, R1_25603)])
        self.assertEqual(len(trenes), 2)
        self.assertEqual(dias[D1.isoformat()], {0, 1})
        self.assertEqual(len(dias[D2.isoformat()]), 1)

    def test_no_bus_no_train_cut_off_from_barcelona_and_no_train_only_in_barcelona(self):
        trenes, _ = build([fom("5112L32001R3", "R3", D1, R3_VIC), fom("5112L90001R3", "R3", D1, R3_BUS, bus=True),
                           fom("5112L25999R1", "R1", D1, ONLY_BCN)])
        self.assertEqual(trenes, [])

    def test_a_train_red_json_already_has_that_day_is_left_out(self):
        red = [{"n": "15009", "p": "R15", "s": R15_15009}]
        trenes, _ = build([fom("5112L15009R2S", "R2S", D1, R2S_15009), fom("5112L28009R2S", "R2S", D1, R2S_28009),
                           fom("5113M15009R2S", "R2S", D2, R2S_15009)],
                          red, {D1.isoformat(): {0}})
        # on D1 red.json has it; on D2 it does not (another timetable that day): Rodalies keeps it
        self.assertEqual(sorted(t["n"] for t in trenes), ["15009", "28009"])

    def test_a_stop_out_of_catalonia_goes_and_a_new_one_stops_the_script(self):
        xs = stops(("71801", 330, 331), ("79500", 372, 373), ("78200", 500, 500))
        trenes, _ = build([fom("5112L25601R1", "R1", D1, xs)])
        self.assertEqual([s[0] for s in trenes[0]["s"]], ["71801", "79500"])
        xs = stops(("71801", 330, 331), ("99999", 372, 373))
        with self.assertRaises(SystemExit):
            build([fom("5112L25601R1", "R1", D1, xs)])

    def test_stations_barcelona_flagged_towns_with_comarca_lines_and_place(self):
        trenes, _ = build([fom("5112L25601R1", "R1", D1, R1_25601), fom("5112L28009R2S", "R2S", D1, R2S_28009)])
        est = extract_red.rodalies_stations(trenes, NAMES, LL)
        self.assertEqual(est["78805"], {"nombre": "Barcelona Plaça de Catalunya", "barcelona": True, "lineas": ["R1"]})
        self.assertEqual(est["71801"]["lineas"], ["R1", "R2S"])
        self.assertEqual(est["79500"], {"nombre": "Mataró", "comarca": "Maresme", "lineas": ["R1"], "ll": [41.533, 2.446]})
        self.assertEqual(est["71701"]["comarca"], "Garraf")


def network(trenes, dias, est):
    return {"fuente": "Origen de los datos: Renfe Operadora", "actualizado": "2026-11-09", "estaciones": est,
            "trenes": trenes, "dias": dias}


class RodaliesChecks(unittest.TestCase):
    def good(self):
        trains = []
        for i in range(14):
            d = D1 + extract_red.dt.timedelta(days=i)
            trains += [fom(f"x{i}a25601R1", "R1", d, R1_25601), fom(f"x{i}a28009R2S", "R2S", d, R2S_28009)]
        trenes, dias = build(trains)
        est = extract_red.rodalies_stations(trenes, NAMES, LL)
        return network(trenes, {k: sorted(v) for k, v in dias.items()}, est)

    def check(self, d):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "rodalies.json"
            path.write_text(json.dumps(d), encoding="utf-8")
            return check_datos.run_rodalies(path, towns=["Mataró", "Sitges"])

    def test_a_good_file_passes(self):
        self.assertEqual(self.check(self.good()), [])

    def test_a_line_that_is_not_rodalies_fails(self):
        d = self.good(); d["trenes"][0]["p"] = "R15"
        self.assertTrue(any("p='R15'" in e for e in self.check(d)))

    def test_a_train_that_never_reaches_barcelona_fails(self):
        d = self.good(); d["trenes"][0]["s"] = [s for s in d["trenes"][0]["s"] if not s[0].startswith("7")
                                               or s[0] in ("79404", "79500", "79606")]
        self.assertTrue(any("never touches Barcelona" in e for e in self.check(d)))

    def test_the_r2_trunk_on_a_weekend_is_no_short_day(self):
        # the R2 proper runs on weekdays (51 a day on 10-11-2026) and barely at weekends (2): the R2 Nord and Sud
        # take over. Counted together, a weekend is no short day
        trains = []
        for i in range(14):
            d = D1 + extract_red.dt.timedelta(days=i)
            weekend = d.weekday() >= 5
            trains += [fom(f"x{i}a25601R1", "R1", d, R1_25601)]
            trains += [fom(f"x{i}b{k}R2S", "R2S", d, [(1, "71600", 400 + k, 400 + k), (2, "71801", 460 + k, 461 + k)])
                       for k in range(5 if weekend else 3)]
            trains += [fom(f"x{i}c{k}R2", "R2", d, [(1, "71701", 500 + k, 500 + k), (2, "71801", 560 + k, 561 + k)])
                       for k in range(0 if weekend else 2)]
        trenes, dias = build(trains)
        d = network(trenes, {k: sorted(v) for k, v in dias.items()}, extract_red.rodalies_stations(trenes, NAMES, LL))
        self.assertEqual(check_datos.avisos_dia_incompleto(d, check_datos.PRODUCTOS_RODALIES,
                                                           check_datos.FAMILIA_RODALIES), [])

    def test_a_missing_town_fails(self):
        d = self.good()
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "rodalies.json"
            path.write_text(json.dumps(d), encoding="utf-8")
            errs = check_datos.run_rodalies(path, towns=["Mataró", "Manresa"])
        self.assertTrue(any("Manresa" in e for e in errs))


if __name__ == "__main__":
    unittest.main()
