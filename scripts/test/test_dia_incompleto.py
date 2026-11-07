"""Rule 12 of check_datos.py: a day with a line under half its usual trains. One line alone is usually works
(Rodalies closes a stretch): the robot publishes and warns. Two or more lines short the same day look like a broken
feed: nothing is published (Àlex, 07-11). Run: python3 -m unittest discover -s scripts/test"""
import pathlib, sys, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import check_datos

def red(per_day):
    """per_day: {day: {line: trains}} -> a red.json with that many trains of each line each day."""
    trenes, dias = [], {}
    for day, lines in per_day.items():
        dias[day] = []
        for p, k in lines.items():
            for _ in range(k):
                dias[day].append(len(trenes)); trenes.append({"n": str(len(trenes)), "p": p, "s": []})
    return {"trenes": trenes, "dias": dias}

USUAL = {"R13": 8, "R14": 4, "R15": 20}
WEEK = {f"2026-11-{d:02d}": dict(USUAL) for d in range(2, 9)}

class DiaIncompleto(unittest.TestCase):
    def test_a_normal_week_passes_without_warning(self):
        d = red(WEEK)
        self.assertEqual(check_datos.check_dia_incompleto(d), [])
        self.assertEqual(check_datos.avisos_dia_incompleto(d), [])

    def test_one_line_short_one_day_publishes_and_warns(self):
        d = red({**WEEK, "2026-11-05": {**USUAL, "R14": 1}})
        self.assertEqual(check_datos.check_dia_incompleto(d), [])
        avisos = check_datos.avisos_dia_incompleto(d)
        self.assertEqual(len(avisos), 1, avisos)
        self.assertIn("2026-11-05", avisos[0]); self.assertIn("R14", avisos[0])

    def test_two_lines_short_the_same_day_still_fail(self):
        d = red({**WEEK, "2026-11-05": {**USUAL, "R14": 1, "R15": 3}})
        errs = check_datos.check_dia_incompleto(d)
        self.assertTrue(errs and "2026-11-05" in errs[0], errs)
        self.assertEqual(check_datos.avisos_dia_incompleto(d), [])

    def test_two_lines_short_on_different_days_publish_and_warn_twice(self):
        d = red({**WEEK, "2026-11-04": {**USUAL, "R13": 2}, "2026-11-06": {**USUAL, "R14": 0}})
        self.assertEqual(check_datos.check_dia_incompleto(d), [])
        self.assertEqual(len(check_datos.avisos_dia_incompleto(d)), 2)

if __name__ == "__main__":
    unittest.main()
