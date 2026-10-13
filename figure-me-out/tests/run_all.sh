#!/bin/sh
# Builds and runs every offline test. usage: sh tests/run_all.sh   (from the figure-me-out folder; needs /tmp/claude-0/lu/luau)
LUAU=${LUAU:-/tmp/claude-0/lu/luau}
fail=0
python3 tests/build_rules_test.py && python3 tests/build_server_test.py && python3 tests/build_server_test.py full_scenario.luau fmo_full_test.luau && python3 tests/build_server_test.py team_scenario.luau fmo_team_test.luau && python3 tests/build_server_test.py ctf_scenario.luau fmo_ctf_test.luau && python3 tests/build_client_test.py || exit 1
python3 tests/static_checks.py || fail=1
for t in fmo_rules_test fmo_server_test fmo_full_test fmo_team_test fmo_ctf_test fmo_client_test; do
	out=$($LUAU /tmp/claude-0/lu/$t.luau 2>&1) || true
	pass=$(printf '%s\n' "$out" | grep -ac '^PASS')
	bad=$(printf '%s\n' "$out" | grep -ac 'FAIL\|COROUTINE ERROR\|BADCLASS\|BADENUM\|BADTWEEN\|BADPROP\|BADREAD\|HANDLER ERROR\|stacktrace\|^WARN.*failed')
	echo "$t: $pass passed, $bad problems"
	if [ "$bad" -gt 0 ]; then
		printf '%s\n' "$out" | grep -a 'FAIL\|COROUTINE ERROR\|BAD\|stacktrace\|failed' | head -10
		fail=1
	fi
done
# type-check against Roblox's real API (skipped when the tools are not installed)
LSP=${LSP:-/tmp/claude-0/lu/luau-lsp}
if [ -x "$LSP" ] && [ -f /tmp/claude-0/lu/globalTypes.d.luau ]; then
	/tmp/claude-0/lu/rojo sourcemap default.project.json -o /tmp/claude-0/lu/sourcemap.json >/dev/null 2>&1
	types=$($LSP analyze --definitions=/tmp/claude-0/lu/globalTypes.d.luau --base-luaurc=/tmp/claude-0/lu/base.luaurc --sourcemap=/tmp/claude-0/lu/sourcemap.json src 2>&1 | grep -a "TypeError" | grep -av "not found in table 'refs'")
	if [ -n "$types" ]; then echo "real-API type check: problems"; echo "$types" | head -8; fail=1; else echo "real-API type check: OK"; fi
fi
exit $fail
