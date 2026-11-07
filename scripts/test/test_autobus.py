"""A train that runs part of its way by bus (works on the line: from 02-11-2026 Rodalies runs Lleida <-> La
Plana-Picamoixons by bus on the R13 and R14). AV_LD still gives the whole train, Rodalies gives the train from La
Plana and the bus apart: red.json keeps the trip as the bus and then the train, with the bus part in `b`.
Run: python3 -m unittest discover -s scripts/test"""
import pathlib, sys, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import extract_red


def stops(*xs):
    return [(i + 1, sid, a, e) for i, (sid, a, e) in enumerate(xs)]


# Renfe's feeds of 05-11-2026. AV_LD: the R14 from Lleida at 12:08 to França, as a train all the way
AV_1208 = stops(("78400", 728, 728), ("73001", 748, 748), ("73002", 763, 763), ("73003", 773, 773),
                ("73004", 783, 783), ("73005", 798, 798), ("73006", 808, 808), ("73007", 815, 815),
                ("73008", 825, 825), ("73009", 833, 833), ("73010", 838, 838), ("73100", 844, 854),
                ("73101", 860, 860), ("71400", 874, 876), ("71801", 967, 969), ("79400", 984, 984))
# Rodalies: the same train, from La Plana
PIECE_1208 = stops(("73100", 854, 854), ("73101", 860, 860), ("71400", 874, 876), ("71801", 967, 969),
                   ("79400", 984, 984))
# Rodalies' buses to La Plana that day around it: the 12:08, stopping almost everywhere (not at Vimbodi, 73006),
# the 12:45, faster and with fewer stops, and the 07:14
BUS_1208 = stops(("78400", 728, 728), ("73001", 748, 748), ("73002", 763, 763), ("73003", 773, 773),
                 ("73004", 783, 783), ("73005", 798, 798), ("73007", 815, 815), ("73008", 825, 825),
                 ("73009", 833, 833), ("73010", 838, 838), ("73100", 844, 844))
BUS_1245 = stops(("78400", 765, 765), ("73003", 790, 790), ("73005", 806, 806), ("73007", 820, 820),
                 ("73008", 830, 831), ("73100", 844, 844))
BUS_0714 = stops(("78400", 434, 434), ("73003", 479, 479), ("73100", 550, 550))


def ids(xs):
    return [sid for _q, sid, _a, _e in xs]


class BusThenTrain(unittest.TestCase):
    def test_the_trip_is_the_bus_and_then_the_train(self):
        trip, b = extract_red.with_bus(PIECE_1208, AV_1208, [BUS_0714, BUS_1245, BUS_1208])
        self.assertEqual(b, ["78400", "73100"])
        # the bus that stops at the most towns, so that no town on it loses the trip; Vimbodi, where it does not stop,
        # is not on the trip
        self.assertEqual(ids(trip), ids(BUS_1208) + ids(PIECE_1208)[1:])
        self.assertNotIn("73006", ids(trip))
        # at La Plana, the bus arrives at 14:04 and the train leaves at 14:14
        self.assertEqual([x[1:] for x in trip if x[1] == "73100"], [("73100", 844, 854)])
        self.assertEqual(trip[0][1:], ("78400", 728, 728))
        self.assertEqual(trip[-1][1:], ("79400", 984, 984))

    def test_no_bus_to_the_train_no_trip(self):
        self.assertIsNone(extract_red.with_bus(PIECE_1208, AV_1208, [BUS_0714]))

    def test_the_whole_train_needs_no_bus(self):
        self.assertIsNone(extract_red.with_bus(AV_1208, AV_1208, [BUS_1208]))


# the other way: AV_LD's R14 from França at 07:12 to Lleida; Rodalies' train ends at La Plana at 08:57, and its
# buses leave La Plana at 06:40 (too early) and at 10:00, a fast one and one stopping almost everywhere
AV_0712 = stops(("79400", 432, 432), ("71801", 448, 450), ("71600", 495, 496), ("73100", 537, 540),
                ("73008", 558, 559), ("73007", 568, 569), ("73006", 575, 576), ("73005", 585, 586),
                ("73003", 610, 611), ("73002", 620, 621), ("78400", 656, 656))
PIECE_0712 = stops(("79400", 432, 432), ("71801", 448, 450), ("71600", 495, 496), ("73100", 537, 537))
BUS_0640 = stops(("73100", 400, 400), ("73008", 414, 414), ("78400", 479, 479))
BUS_1000 = stops(("73100", 600, 600), ("73008", 614, 614), ("73007", 624, 624), ("78400", 679, 679))
BUS_1000_ALL = stops(("73100", 600, 600), ("73010", 606, 606), ("73009", 611, 611), ("73008", 619, 619),
                     ("73007", 629, 629), ("73006", 636, 636), ("73005", 646, 646), ("73003", 671, 671),
                     ("73002", 681, 681), ("78400", 716, 716))


class TrainThenBus(unittest.TestCase):
    def test_the_trip_is_the_train_and_then_the_bus(self):
        trip, b = extract_red.with_bus(PIECE_0712, AV_0712, [BUS_0640, BUS_1000, BUS_1000_ALL])
        self.assertEqual(b, ["73100", "78400"])
        self.assertEqual(ids(trip), ids(PIECE_0712) + ids(BUS_1000_ALL)[1:])
        # at La Plana, the train arrives at 08:57 and the bus leaves at 10:00
        self.assertEqual([x[1:] for x in trip if x[1] == "73100"], [("73100", 537, 600)])

    def test_a_bus_from_somewhere_else_is_not_the_trip(self):
        # a bus that does not go on towards where the train went (here, back towards Barcelona) is another trip
        back = stops(("73100", 600, 600), ("71600", 650, 650))
        self.assertIsNone(extract_red.with_bus(PIECE_0712, AV_0712, [back]))


class BusNobodyJoined(unittest.TestCase):
    """the day Rodalies runs part of a line by bus and red.json still has a train there (no `b` for it): a train
    that does not run. with_bus joins the buses it can; this tells us of the ones it cannot (a new kind of works)"""
    DAY = __import__("datetime").date(2026, 11, 5)
    TRAIN = [list(x[1:]) for x in AV_1208]

    def gaps(self, t, days=None):
        return extract_red.bus_gaps([t], days or {self.DAY.isoformat(): {0}}, {self.DAY: [BUS_1208]})

    def test_a_train_where_the_bus_runs_that_day(self):
        g = self.gaps({"n": "15052", "p": "R14", "s": self.TRAIN})
        self.assertEqual(g, [("2026-11-05", "15052", "R14", "78400", "73100")])

    def test_the_bus_part_of_a_trip_is_the_bus(self):
        trip, b = extract_red.with_bus(PIECE_1208, AV_1208, [BUS_1208])
        self.assertEqual(self.gaps({"n": "15052", "p": "R14", "s": [list(x[1:]) for x in trip], "b": b}), [])

    def test_another_day_has_no_bus(self):
        self.assertEqual(self.gaps({"n": "15052", "p": "R14", "s": self.TRAIN}, {"2026-11-06": {0}}), [])

    def test_a_train_that_only_touches_where_the_bus_ends(self):
        # from La Plana on, the train runs: La Plana is where the bus meets it, not a stretch by bus
        self.assertEqual(self.gaps({"n": "15052", "p": "R14", "s": [list(x[1:]) for x in PIECE_1208]}), [])


import check_datos

STATIONS = {sid: {} for sid in ("78400", "73003", "73100", "71801")}
BUS_TRAIN = [["78400", 728, 728], ["73003", 773, 773], ["73100", 844, 854], ["71801", 967, 969]]


def trenes_ok(t):
    return check_datos.check_trenes({"trenes": [{"n": "15052", "p": "R14", "s": BUS_TRAIN, **t}],
                                     "estaciones": STATIONS})


class BusInTheContract(unittest.TestCase):
    def test_the_bus_part_is_two_of_the_trains_stops_in_order(self):
        self.assertEqual(trenes_ok({"b": ["78400", "73100"]}), [])

    def test_anything_else_fails(self):
        for b in (["73100", "78400"], ["78400", "78400"], ["78400", "79400"], ["78400"], "78400-73100",
                  ["78400", "73003", "73100"]):
            with self.subTest(b=b):
                self.assertNotEqual(trenes_ok({"b": b}), [])


if __name__ == "__main__":
    unittest.main()
