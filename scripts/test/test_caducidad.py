"""How many days of timetable the published site has left (check_datos.py --caducidad). Run: python3 -m unittest discover -s scripts/test"""
import datetime as dt, json, pathlib, subprocess, sys, tempfile, unittest

root = pathlib.Path(__file__).resolve().parent.parent.parent

def red(desde, dias):
    start = dt.date.fromisoformat(desde)
    return {"actualizado": desde, "dias": {(start + dt.timedelta(days=i)).isoformat(): [] for i in range(dias)}}

def caducidad(data, hoy):
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(data, f)
    r = subprocess.run([sys.executable, str(root / "scripts/check_datos.py"), "--caducidad", "--hoy", hoy, f.name],
                       capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr

class Caducidad(unittest.TestCase):
    def test_published_today_is_fine(self):
        code, out = caducidad(red("2026-10-11", 14), "2026-10-11")
        self.assertEqual(code, 0, out)
        self.assertIn("2026-10-24", out)   # the last day with a timetable

    def test_a_robot_stuck_for_a_week_warns(self):
        code, out = caducidad(red("2026-10-01", 14), "2026-10-08")
        self.assertEqual(code, 1, out)
        self.assertIn("6 days", out)   # 08 to 14: the site still shows real trains on 6 more days after today

    def test_the_last_day_with_eight_left_is_still_fine(self):
        code, out = caducidad(red("2026-10-01", 14), "2026-10-06")
        self.assertEqual(code, 0, out)

if __name__ == "__main__":
    unittest.main()
