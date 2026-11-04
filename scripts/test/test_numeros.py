"""A train's number in the Rodalies feed, kept in red.json as `f` where it differs from `n`: a cancelled train has no
position in Renfe's real-time feed, only the Rodalies trip_id, and the page has to know which train that is.
Run: python3 -m unittest discover -s scripts/test"""
import pathlib, sys, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import extract_red


class RodaliesNumbers(unittest.TestCase):
    def test_only_the_trains_numbered_differently(self):
        # Renfe's feeds of 04-11-2026: Sants 19:03 to Reus is AV_LD's 15039 and Rodalies' 30519; Rodalies' 15039 is
        # the 20:03, AV_LD's 15019. The 15702 is the 15702 in both
        absorbed = {"5107X30519R15": "15039", "5108J30519R15": "15039", "5107X15039R15": "15019",
                    "5107X15702R11": "15702"}
        self.assertEqual(extract_red.rodalies_numbers(absorbed), {"15039": "30519", "15019": "15039"})

    def test_a_train_with_two_rodalies_numbers_keeps_none(self):
        # which one a cancellation means could not be told: better no cancellation than the wrong train's
        self.assertEqual(extract_red.rodalies_numbers({"5107X30519R15": "15039", "5108J30520R15": "15039"}), {})



import check_datos


def trenes_ok(trenes):
    return check_datos.check_trenes({"trenes": trenes, "estaciones": {"71801": {}, "71400": {}}})


class RodaliesNumberInTheContract(unittest.TestCase):
    STOPS = [["71801", 1143, 1143], ["71400", 1234, 1234]]

    def test_a_rodalies_number_is_a_number_other_than_n(self):
        self.assertEqual(trenes_ok([{"n": "15039", "f": "30519", "p": "R15", "s": self.STOPS}]), [])

    def test_anything_else_fails(self):
        for f in ("15039", "", "5107X30519R15", 30519):
            with self.subTest(f=f):
                self.assertNotEqual(trenes_ok([{"n": "15039", "f": f, "p": "R15", "s": self.STOPS}]), [])


if __name__ == "__main__":
    unittest.main()
