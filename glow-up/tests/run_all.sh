#!/bin/sh
# Builds and runs every offline test. usage: sh tests/run_all.sh   (from the glow-up folder; needs /tmp/claude-0/lu/luau)
set -e
LUAU=${LUAU:-/tmp/claude-0/lu/luau}
python3 tests/build_server_test.py && python3 tests/build_client_test.py && python3 tests/build_lift_test.py
fail=0
python3 tests/static_checks.py || fail=1
for t in server_test client_test lift_test; do
	out=$($LUAU /tmp/claude-0/lu/$t.luau 2>&1) || true
	pass=$(printf '%s\n' "$out" | grep -ac '^PASS' || true)
	bad=$(printf '%s\n' "$out" | grep -ac 'FAIL\|COROUTINE ERROR\|BADCLASS\|BADENUM\|BADTWEEN\|BADPROP\|stacktrace' || true)
	echo "$t: $pass passed, $bad problems"
	if [ "$bad" -gt 0 ]; then
		printf '%s\n' "$out" | grep -a 'FAIL\|COROUTINE ERROR\|BAD\|stacktrace' | head -10
		fail=1
	fi
done
cd tests/preview && python3 animate_test.py | tail -1
exit $fail
