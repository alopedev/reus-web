"""Rule 9 of check_datos.py: red.json's direct Sants<->Reus trains match trains.json (AV_LD only), except a train
only the Rodalies feed gives (its `n` is a GTFS trip id, not a number). Since 12-10 Rodalies wins when the two feeds
disagree, so such a train is in red.json on purpose. Run: python3 -m unittest discover -s scripts/test"""
import json, pathlib, sys, tempfile, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import check_datos

DAY = "2026-11-04"
SANTS, REUS = check_datos.SANTS, check_datos.REUS

def train(n, dep, arr):
    return {"n": n, "p": "R15", "s": [[SANTS, dep, dep], [REUS, arr, arr]]}

def paridad(trenes, r):
    red = {"trenes": trenes, "dias": {DAY: list(range(len(trenes)))}}
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump({DAY: {"r": r, "b": []}}, f)
    return check_datos.check_paridad(red, pathlib.Path(f.name))

class Paridad(unittest.TestCase):
    def test_same_trains_pass(self):
        self.assertEqual(paridad([train("15011", 573, 663)], [[573, 663, "15011"]]), [])

    def test_a_train_only_rodalies_gives_passes(self):
        # 04-11-2026: AV_LD drops the R15 15:33 to Reus (15013) from its new period, Rodalies keeps it every day
        trenes = [train("15011", 573, 663), train("5107X15013R15", 933, 1023)]
        self.assertEqual(paridad(trenes, [[573, 663, "15011"]]), [])

    def test_an_extra_av_ld_train_still_fails(self):
        trenes = [train("15011", 573, 663), train("15013", 933, 1023)]
        errs = paridad(trenes, [[573, 663, "15011"]])
        self.assertTrue(errs and "extra 15:33->17:03" in errs[0], errs)

    def test_a_missing_train_still_fails(self):
        errs = paridad([train("15011", 573, 663)], [[573, 663, "15011"], [933, 1023, "15013"]])
        self.assertTrue(errs and "missing 15:33->17:03" in errs[0], errs)

    def test_a_rodalies_train_repeating_one_already_there_still_fails(self):
        trenes = [train("15011", 573, 663), train("5107X15011R15", 573, 663)]
        errs = paridad(trenes, [[573, 663, "15011"]])
        self.assertTrue(errs and "repeated 09:33->11:03" in errs[0], errs)

if __name__ == "__main__":
    unittest.main()
