"""A train number whose timetable changes partway through the 14 days keeps each timetable on its own days.
Run: python3 -m unittest discover -s scripts/test"""
import pathlib, sys, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import extract_red

# Renfe's AV_LD feed of 12-10-2026: the R15 15032 leaves Faió-La Pobla de Massaluca (71208) at 08:33 until
# 12-10 and at 08:50 from 13-10 (it waits 17 minutes less at Móra la Nova, 71300); Sants (71801) is the same.
OLD = [(4, "71208", 513, 513), (8, "71300", 557, 575), (19, "71801", 727, 729)]
NEW = [(4, "71208", 530, 530), (8, "71300", 574, 575), (19, "71801", 727, 729)]


class Versions(unittest.TestCase):
    def test_two_timetables_under_one_number_stay_apart(self):
        trips = {"1503212026-10-11": ("s1", "15032", "REG.EXP."), "1503212026-10-13": ("s2", "15032", "REG.EXP.")}
        stops = {"1503212026-10-11": OLD, "1503212026-10-13": NEW}
        groups = extract_red.av_groups(trips, stops)
        self.assertEqual(sorted(groups), [["1503212026-10-11"], ["1503212026-10-13"]])

    def test_reexports_with_the_same_timetable_are_one_train(self):
        trips = {"a": ("s1", "15774", "MD"), "b": ("s2", "15774", "MD")}
        self.assertEqual(sorted(extract_red.av_groups(trips, {"a": OLD, "b": list(OLD)})), [["a", "b"]])

    def test_trips_without_a_number_never_group(self):
        trips = {"a": ("s1", "", "MD"), "b": ("s2", "", "MD")}
        self.assertEqual(sorted(extract_red.av_groups(trips, {"a": OLD, "b": OLD})), [["a"], ["b"]])


if __name__ == "__main__":
    unittest.main()
