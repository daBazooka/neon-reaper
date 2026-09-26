# btb — the Burn to Become Field Manual in your terminal

A small command-line companion to *Burn to Become* by Bazooka. It runs the book's 30-day Field Manual and keeps your receipts: what you said you would do, what you actually did, and the gap between them.

Pure Python (3.10+), no dependencies. Your data stays in one file: `~/.btb/log.json` (set `BTB_HOME` to move it).

## Install
```
cd burn-to-become/engine
pip install .          # gives you the `btb` command
# or run without installing:  python -m btb <command>
```

## Daily use
| Command | What it does | Book chapter |
|---|---|---|
| `btb start` | Begin the 30 days today (`--date YYYY-MM-DD` to backdate) | Field Manual |
| `btb today` / `btb day 12` | Show today's (or any day's) practice | Field Manual |
| `btb intent add "When it is 7:00 at my desk, I will write one page"` | Log a When–Then intention (rejects vague ones) | Ch. 9 |
| `btb intent list` · `btb intent kept 3` · `btb intent missed 3 --reason "tired"` | Close the loop; kept intentions go into your evidence file | Ch. 7, 18 |
| `btb friction "writing" "YouTube" --minutes 40` | Log an avoidance: the task you escaped and what you escaped to | Ch. 2, 8 |
| `btb evidence "Sent the application"` | Add to your evidence file | Ch. 18 |
| `btb fail --tried … --happened … --learned … --change …` | Add to your failure portfolio | Ch. 16 |
| `btb voices "Quit my job"` | Run the Four Voices (fear, ego, approval, values) on a decision | Ch. 4 |
| `btb receipts [--days 7] [--save]` | Weekly receipts: keep rate, top escapes, avoidance peak hour, the gap, and one action for the next 24 hours | Ch. 3 |
| `btb status` | One-line summary | — |

## Tests
```
python -m unittest discover -s tests
```
