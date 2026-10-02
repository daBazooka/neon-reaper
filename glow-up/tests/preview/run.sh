#!/bin/sh
# usage: tests/preview/run.sh out.png [species...]   (needs the luau CLI and matplotlib)
set -e
here="$(cd "$(dirname "$0")" && pwd)"
python3 - "$here" <<'PY'
import sys
h = sys.argv[1]
src = open(h + "/harness.luau").read()
animals = open(h + "/../../src/shared/Animals.luau").read()
open("/tmp/claude-0/preview/animals_preview.luau", "w").write(src.replace("(function() ANIMALS_SOURCE end)()", "(function()\n" + animals + "\nend)()"))
PY
${LUAU:-/tmp/claude-0/lu/luau} /tmp/claude-0/preview/animals_preview.luau > /tmp/claude-0/preview/animals.json
out="$1"; shift
python3 "$here/render.py" /tmp/claude-0/preview/animals.json "$out" "$@"
