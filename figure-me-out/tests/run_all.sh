#!/bin/sh
# Builds and runs every offline test. usage: sh tests/run_all.sh   (from the figure-me-out folder; needs /tmp/claude-0/lu/luau)
LUAU=${LUAU:-/tmp/claude-0/lu/luau}
fail=0
python3 tests/build_rules_test.py && python3 tests/build_server_test.py && python3 tests/build_client_test.py || exit 1
python3 tests/static_checks.py || fail=1
for t in fmo_rules_test fmo_server_test fmo_client_test; do
	out=$($LUAU /tmp/claude-0/lu/$t.luau 2>&1) || true
	pass=$(printf '%s\n' "$out" | grep -ac '^PASS')
	bad=$(printf '%s\n' "$out" | grep -ac 'FAIL\|COROUTINE ERROR\|BADCLASS\|BADENUM\|BADTWEEN\|BADPROP\|BADREAD\|HANDLER ERROR\|stacktrace\|^WARN.*failed')
	echo "$t: $pass passed, $bad problems"
	if [ "$bad" -gt 0 ]; then
		printf '%s\n' "$out" | grep -a 'FAIL\|COROUTINE ERROR\|BAD\|stacktrace\|failed' | head -10
		fail=1
	fi
done
exit $fail
