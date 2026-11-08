"""The fast trains (AVE, Avant, Alvia, Euromed, Intercity) between Barcelona and any Catalan station, both ways, from
Renfe's AV_LD feed: the same physical train once, though Renfe sells it under two names (AVE 03062 = Avant 34062).
Run: python3 -m unittest discover -s scripts/test"""
import pathlib, sys, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import check_datos, extract_red


def stops(*xs):
    return [(i + 1, sid, a, e) for i, (sid, a, e) in enumerate(xs)]


NAMES = {"71801": "Barcelona-Sants", "04104": "Camp de Tarragona", "78400": "Lleida-Pirineus", "79300": "Girona",
         "04307": "Figueres-Vilafant", "04040": "Zaragoza Delicias", "60000": "Madrid-Puerta de Atocha",
         "87374": "Perpignan", "87303": "Lyon Part Dieu", "65422": "Cambrils", "65402": "L'Aldea-Amposta-Tortosa",
         "65312": "Vinaròs", "99999": "Barcelona-La Sagrera"}
GEO = {"71801": (41.379, 2.140), "04104": (41.143, 1.166), "78400": (41.621, 0.633), "79300": (41.979, 2.817),
       "04307": (42.264, 2.940), "04040": (41.659, -0.911), "60000": (40.406, -3.690), "87374": (42.696, 2.880),
       "87303": (45.760, 4.859), "65422": (41.076, 1.059), "65402": (40.748, 0.618), "65312": (40.470, 0.470),
       "99999": (41.421, 2.191)}

# Renfe's AV_LD feed of 08-11-2026
AVE_03062 = stops(("71801", 350, 350), ("04104", 382, 384), ("78400", 411, 413), ("04040", 456, 459),
                  ("60000", 580, 580))
AVANT_34062 = stops(("71801", 350, 350), ("04104", 382, 384), ("78400", 411, 411))
AVE_03062_TO_ZARAGOZA = stops(("71801", 395, 395), ("04040", 481, 484), ("60000", 592, 592))
AVE_03123 = stops(("60000", 747, 747), ("04040", 842, 843), ("78400", 890, 892), ("04104", 920, 920),
                  ("71801", 969, 969))
AVANT_34823 = stops(("78400", 892, 892), ("71801", 969, 969))   # the same train, not sold to Camp de Tarragona
AVE_INT_09737 = stops(("71801", 494, 494), ("79300", 535, 538), ("04307", 552, 555), ("87374", 577, 591),
                      ("87303", 800, 800))
ALVIA_00697 = stops(("71801", 460, 460), ("04104", 494, 497), ("65422", 522, 524), ("65402", 547, 549),
                    ("65312", 567, 569))


def trip(xs, prod):
    return extract_red.fast_trip(xs, prod, NAMES, GEO, set())


class FastTrip(unittest.TestCase):
    def test_every_catalan_stop_both_ways_and_nothing_beyond(self):
        self.assertEqual(trip(AVE_03062, "AVE")[1], (("71801", 350, 350), ("04104", 382, 384), ("78400", 411, 413)))
        self.assertEqual(trip(AVE_03123, "AVE")[1], (("78400", 890, 892), ("04104", 920, 920), ("71801", 969, 969)))
        # Perpignan, so close it falls inside Catalonia's box, is in France
        self.assertEqual([s for s, _a, _e in trip(AVE_INT_09737, "AVE INT")[1]], ["71801", "79300", "04307"])
        # the Alvia to Córdoba: Cambrils and L'Aldea, the R16's own stations
        self.assertEqual([s for s, _a, _e in trip(ALVIA_00697, "ALVIA")[1]], ["71801", "04104", "65422", "65402"])

    def test_the_ave_is_told_apart_only_to_keep_its_number_when_trains_merge(self):
        self.assertEqual(trip(AVANT_34062, "AVANT")[0], "AV")
        self.assertEqual(trip(ALVIA_00697, "ALVIA")[0], "AV")
        self.assertEqual(trip(ALVIA_00697, "INTERCITY")[0], "AV")
        self.assertEqual(trip(AVE_03062, "AVE")[0], "AVE")
        self.assertEqual(trip(AVE_INT_09737, "AVE INT")[0], "AVE")

    def test_a_train_with_only_barcelona_in_catalonia_is_no_trip(self):
        self.assertIsNone(trip(AVE_03062_TO_ZARAGOZA, "AVE"))

    def test_a_new_catalan_station_stops_the_script(self):
        with self.assertRaises(SystemExit):
            trip(stops(("71801", 600, 600), ("99999", 606, 606), ("79300", 640, 640)), "AVANT")


def merged(*trains, day="2026-11-10"):
    trenes = [{"n": n, "p": p, "s": [list(x) for x in trip(xs, prod)[1]]} for n, p, xs, prod in trains]
    trenes, dias = extract_red.one_per_train(trenes, {day: set(range(len(trenes)))})
    return [trenes[i] for i in sorted(dias[day])]


class OneFastTrain(unittest.TestCase):
    def test_the_ave_and_the_avant_of_05_50_are_one_train_under_the_ave_number(self):
        for order in ((0, 1), (1, 0)):
            pair = [("03062", "AVE", AVE_03062, "AVE"), ("34062", "AV", AVANT_34062, "AVANT")]
            out = merged(*(pair[i] for i in order))
            self.assertEqual([(t["n"], t["p"]) for t in out], [("03062", "AV")])

    def test_every_fast_train_is_published_as_av(self):
        out = merged(("03062", "AVE", AVE_03062, "AVE"), ("09737", "AVE", AVE_INT_09737, "AVE INT"),
                     ("00697", "AV", ALVIA_00697, "ALVIA"))
        self.assertEqual(sorted((t["n"], t["p"]) for t in out), [("00697", "AV"), ("03062", "AV"), ("09737", "AV")])

    def test_an_avant_not_sold_to_camp_de_tarragona_does_not_take_camp_from_the_train(self):
        out = merged(("34823", "AV", AVANT_34823, "AVANT"), ("03123", "AVE", AVE_03123, "AVE"))
        self.assertEqual(len(out), 1)
        self.assertEqual([s for s, _a, _e in out[0]["s"]], ["78400", "04104", "71801"])

    def test_a_fast_train_is_never_taken_for_a_regional_at_the_same_minutes(self):
        out = merged(("00697", "AV", ALVIA_00697, "ALVIA"), ("18011", "R16", ALVIA_00697, "ALVIA"))
        self.assertEqual(sorted(t["p"] for t in out), ["AV", "R16"])


def red(*trains):
    return {"trenes": [{"n": n, "p": p, "s": s} for n, p, s in trains], "dias": {"2026-11-10": list(range(len(trains)))}}


class Contract(unittest.TestCase):
    """check_datos.py, the contract of red.json, takes the fast trains in."""

    def test_line_av_and_any_catalan_station(self):
        d = red(("34609", "AV", [["71801", 400, 400], ["79300", 443, 443], ["04307", 458, 458]]),
                ("03062", "AV", [["71801", 350, 350], ["04104", 382, 384], ["78400", 411, 413]]))
        d["estaciones"] = {sid: {"nombre": sid} for sid in ("71801", "79300", "04307", "04104", "78400")}
        self.assertEqual([e for e in check_datos.check_trenes(d) if "p=" in e], [])
        self.assertEqual(check_datos.check_alta_velocidad_paradas(d), [])

    def test_the_web_shows_every_fast_train_as_av_so_ave_is_no_line_any_more(self):
        d = red(("03062", "AVE", [["71801", 350, 350], ["04104", 382, 384]]))
        d["estaciones"] = {sid: {"nombre": sid} for sid in ("71801", "04104")}
        self.assertEqual(len([e for e in check_datos.check_trenes(d) if "p=" in e]), 1)

    def test_a_fast_train_that_only_calls_in_barcelona_is_not_a_trip(self):
        d = red(("03080", "AV", [["71801", 505, 505], ["71802", 510, 510]]))
        self.assertEqual(len(check_datos.check_alta_velocidad_paradas(d)), 1)

    def test_a_day_half_empty_of_fast_trains_is_one_line_short(self):
        fast = lambda n, dep: (n, "AV", [["71801", dep, dep], ["79300", dep + 40, dep + 40]])
        trains = [fast(f"{i}", 300 + 30 * i) for i in range(10)]
        d = {"trenes": [{"n": n, "p": p, "s": s} for n, p, s in trains],
             "dias": {"2026-11-10": list(range(10)), "2026-11-11": list(range(10)), "2026-11-12": [0, 1, 2]}}
        self.assertEqual(check_datos.check_dia_incompleto(d), [])
        warns = check_datos.avisos_dia_incompleto(d)
        self.assertEqual(len(warns), 1, warns)
        self.assertIn("2026-11-12: AV runs 3", warns[0])

if __name__ == "__main__":
    unittest.main()
