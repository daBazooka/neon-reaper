import io, json, os, tempfile, unittest
from contextlib import redirect_stdout
from datetime import date, datetime, timedelta

os.environ["BTB_HOME"] = tempfile.mkdtemp()
from btb import cli  # noqa: E402


def run(*args):
    buf = io.StringIO()
    with redirect_stdout(buf):
        cli.main(list(args))
    return buf.getvalue()


class TestBTB(unittest.TestCase):
    def setUp(self):
        os.environ["BTB_HOME"] = tempfile.mkdtemp()

    def test_field_manual_has_30_days(self):
        self.assertEqual([d["day"] for d in cli.FIELD_MANUAL], list(range(1, 31)))
        self.assertIn("The Receipts", run("day", "1"))

    def test_start_and_today(self):
        run("start", "--date", (date.today() - timedelta(days=2)).isoformat())
        self.assertIn("DAY 3", run("today"))

    def test_intent_parsing(self):
        self.assertEqual(cli.parse_intent("When it is 7:00 at my desk, I will write one page"),
                         ("it is 7:00 at my desk", "write one page"))
        self.assertEqual(cli.parse_intent("If I feel like quitting then I will do five more minutes.")[1], "do five more minutes")
        with self.assertRaises(ValueError):
            cli.parse_intent("write more")

    def test_intent_lifecycle_and_receipts(self):
        run("intent", "add", "When it is 7:00 at my desk, I will write one page")
        run("intent", "add", "When I get home, I will train for 20 minutes")
        run("intent", "kept", "1")
        run("intent", "missed", "2", "--reason", "tired")
        run("friction", "writing", "instagram", "--minutes", "40")
        run("friction", "writing", "Instagram", "--minutes", "30")
        run("evidence", "Sent the application")
        r = cli.receipts(cli.load(), 7)
        self.assertIn("kept 1", r)
        self.assertIn("missed 1", r)
        self.assertIn("Keep rate (closed intentions): 50%", r)
        self.assertIn("instagram ×2", r)
        self.assertIn("70 min", r)
        self.assertIn("“tired” ×1", r)
        self.assertIn("put “instagram” out of reach", r)
        db = cli.load()
        self.assertEqual(len(db["evidence"]), 2)  # manual entry + kept intention

    def test_receipts_window_excludes_old(self):
        db = cli.load()
        old = (datetime.now() - timedelta(days=20)).isoformat(timespec="minutes")
        db["friction"].append({"ts": old, "task": "x", "escape": "y", "minutes": 99, "note": ""})
        cli.save(db)
        self.assertIn("Avoidance episodes logged: 0", cli.receipts(cli.load(), 7))

    def test_voices_noninteractive(self):
        run("voices", "Quit", "my", "job", "--fear", "broke", "--ego", "failure", "--approval", "parents", "--values", "freedom")
        self.assertEqual(cli.load()["voices"][0]["values"], "freedom")


if __name__ == "__main__":
    unittest.main()
