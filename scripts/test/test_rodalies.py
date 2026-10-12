"""When Renfe's two feeds disagree on a regional, the Rodalies feed (fom, one timetable per day) wins the days it has
the whole train; the AV_LD feed (av, one timetable for every day) only fills in what fom lacks.
Run: python3 -m unittest discover -s scripts/test"""
import pathlib, sys, unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
import extract_red

# Renfe's feeds of 12-10-2026, R11 to Sants on Tuesday 13-10. Rodalies: the 09:40 at Sants is the all-stops train from
# Portbou (07:05), the 09:10 the semi-fast one from Figueres (07:08). AV_LD gives every day the other way round:
# the 09:40 semi-fast from Figueres (07:46), the 09:10 all-stops from Portbou (06:33). (seq, stop_id, arrival, departure)
FOM_0940 = [(1, "79315", 425, 425), (5, "79309", 448, 449), (13, "79300", 488, 489), (18, "79200", 514, 515),
            (21, "79105", 527, 527), (22, "79104", 531, 532), (23, "79100", 547, 548), (25, "79009", 569, 570),
            (26, "71802", 574, 575), (27, "71801", 580, 580)]
AV_0940 = [(1, "79309", 466, 466), (3, "79300", 499, 499), (6, "79200", 521, 521), (7, "79104", 533, 533),
           (8, "79009", 570, 570), (9, "71802", 575, 575), (10, "71801", 580, 580)]
FOM_0910 = [(1, "79309", 428, 428), (3, "79300", 462, 464), (6, "79200", 486, 486), (7, "79104", 497, 498),
            (8, "79009", 539, 540), (9, "71802", 544, 545), (10, "71801", 550, 550)]
AV_0910 = [(1, "79315", 393, 393), (5, "79309", 417, 417), (13, "79300", 457, 457), (18, "79200", 483, 483),
           (21, "79105", 495, 495), (22, "79104", 500, 500), (23, "79100", 516, 516), (25, "79009", 540, 540),
           (26, "71802", 545, 545), (27, "71801", 550, 550)]


class FomPiece(unittest.TestCase):
    def test_a_whole_train_with_stops_av_lacks_is_not_a_piece(self):
        self.assertFalse(extract_red.fom_is_piece(FOM_0940, AV_0940))

    def test_a_faster_train_on_the_same_slot_is_not_a_piece(self):
        # its stops are all in av's, but skipping some and at other times: another timetable, not a piece of av's
        self.assertFalse(extract_red.fom_is_piece(FOM_0910, AV_0910))

    def test_the_last_stretch_of_the_same_train_is_a_piece(self):
        # fom sometimes splits a train (Lleida via La Plana-Picamoixons): the stretch that reaches Barcelona
        # stops where av's does, at the same minute (a minute apart at most; fom finer on arrivals)
        tail = [(1, "79200", 520, 521), (2, "79104", 532, 533), (3, "79009", 569, 570), (4, "71802", 574, 575),
                (5, "71801", 580, 580)]
        self.assertTrue(extract_red.fom_is_piece(tail, AV_0940))

    def test_the_same_stops_a_couple_of_minutes_apart_are_the_same_train(self):
        # the R15 of 14:03 from Sants: fom has it reach Reus (71400) at 15:33, av at 15:35. Only a different
        # pattern of stops makes fom another timetable; minutes alone don't
        fom = [(3, "71801", 841, 843), (9, "71401", 922, 922), (10, "71400", 933, 933)]
        av = [(3, "71801", 841, 843), (9, "71401", 922, 922), (10, "71400", 935, 935)]
        self.assertTrue(extract_red.fom_is_piece(fom, av))

    def test_a_train_that_turns_back_at_the_end_of_a_branch_is_still_a_piece(self):
        # the R16 of 09:15 from França: fom takes it to Tortosa (65400) and back to L'Aldea (65402), where fom's
        # data ends; av lists Tortosa and then Ulldecona (65314). The second L'Aldea is the same train going on
        fom = [(14, "65402", 715, 715), (15, "65400", 733, 733), (16, "65402", 751, 751)]
        av = [(14, "65402", 715, 715), (15, "65400", 733, 733), (16, "65314", 774, 774)]
        self.assertTrue(extract_red.fom_is_piece(fom, av))


class SameTrain(unittest.TestCase):
    def test_the_same_train_with_different_ends_in_each_feed(self):
        # the R16 to França of 07:18 at L'Aldea (65402): fom starts it at Camp-redó (65401), av at Ulldecona
        # (65314) through Tortosa (65400). Every station both have, at the same minute: one train, kept whole
        fom = [("65401", 430, 430), ("65402", 438, 438), ("71801", 577, 577), ("79400", 594, 594)]
        av = [("65314", 387, 387), ("65400", 420, 420), ("65402", 438, 438), ("71801", 577, 577), ("79400", 594, 594)]
        self.assertTrue(extract_red.same_train(fom, av))

    def test_two_timetables_for_the_same_slot_are_not(self):
        fom = [(sid, a, e) for _q, sid, a, e in FOM_0940]
        av = [(sid, a, e) for _q, sid, a, e in AV_0940]
        self.assertFalse(extract_red.same_train(fom, av))


if __name__ == "__main__":
    unittest.main()
