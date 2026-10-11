"""The same physical train never reaches the board twice (rule 6 of check_datos.py). Run: python3 -m unittest discover -s scripts/test"""
import pathlib, sys, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import check_datos, extract_red

# Renfe's AV_LD feed of 11-10-2026: the R16 leaving França at 19:15 under two numbers. 18055 ends
# at Tortosa and lets you off everywhere; 18189 is the same train sold through to Ulldecona and
# Vinaròs (no drop-off before Tortosa, where it waits 8 minutes). Vinaròs is outside Catalonia.
R16_18055 = [["79400", 1155, 1155], ["71802", 1166, 1166], ["71801", 1173, 1173], ["71600", 1219, 1219],
             ["71503", 1229, 1229], ["71502", 1232, 1232], ["71500", 1244, 1244], ["71401", 1252, 1252],
             ["65422", 1265, 1265], ["65420", 1277, 1277], ["65405", 1289, 1289], ["65404", 1299, 1299],
             ["65403", 1306, 1306], ["65402", 1313, 1313], ["65401", 1320, 1320], ["65400", 1332, 1332]]
R16_18189 = [["79400", 1155, 1155], ["71802", 1165, 1166], ["71801", 1171, 1173], ["71600", 1218, 1219],
             ["71503", 1228, 1229], ["71502", 1232, 1232], ["71500", 1242, 1244], ["71401", 1252, 1252],
             ["65422", 1264, 1265], ["65420", 1276, 1277], ["65405", 1288, 1289], ["65404", 1298, 1299],
             ["65403", 1305, 1306], ["65402", 1312, 1313], ["65400", 1332, 1340], ["65314", 1371, 1372]]


def red(*trains):
    return {"trenes": [{"n": n, "p": "R16", "s": s} for n, s in trains],
            "dias": {"2026-10-13": list(range(len(trains)))}}


class Rule6(unittest.TestCase):
    def test_one_train_under_two_numbers_is_a_duplicate_even_if_one_waits_where_the_other_ends(self):
        errs = check_datos.check_duplicados(red(("18055", R16_18055), ("18189", R16_18189)))
        self.assertEqual(len(errs), 1, errs)
        self.assertIn("same physical train", errs[0])

    def test_two_trains_an_hour_apart_are_not(self):
        later = [[sid, a + 60, e + 60] for sid, a, e in R16_18055]
        self.assertEqual(check_datos.check_duplicados(red(("18055", R16_18055), ("18057", later))), [])


class OnePerTrain(unittest.TestCase):
    """extract_red.py keeps one train per physical train, without losing a town it serves."""

    def test_the_r16_of_19_15_is_one_train_that_still_reaches_camp_redo_and_ulldecona(self):
        trenes = [{"n": "18055", "p": "R16", "s": R16_18055}, {"n": "18189", "p": "R16", "s": R16_18189}]
        trenes, dias = extract_red.one_per_train(trenes, {"2026-10-13": {0, 1}})
        self.assertEqual(len(dias["2026-10-13"]), 1)
        t = trenes[min(dias["2026-10-13"])]
        self.assertEqual(t["n"], "18055")   # the number that lets you off everywhere
        stops = {sid: (a, e) for sid, a, e in t["s"]}
        self.assertEqual(stops["65401"], (1320, 1320))   # Camp-redó, only in 18055
        self.assertEqual(stops["65400"], (1332, 1340))   # Tortosa: arrives, waits, goes on
        self.assertEqual(stops["65314"], (1371, 1372))   # Ulldecona, only in 18189
        self.assertEqual([sid for sid, _a, _e in t["s"]][-3:], ["65401", "65400", "65314"])

    def test_a_train_running_alone_on_other_days_stays_as_it_is(self):
        trenes = [{"n": "18055", "p": "R16", "s": R16_18055}, {"n": "18189", "p": "R16", "s": R16_18189}]
        trenes, dias = extract_red.one_per_train(trenes, {"2026-10-13": {0, 1}, "2026-10-14": {0}})
        self.assertEqual([trenes[i]["s"] for i in dias["2026-10-14"]], [R16_18055])


if __name__ == "__main__":
    unittest.main()
