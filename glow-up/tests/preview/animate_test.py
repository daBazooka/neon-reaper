"""Builds every animal under the offline harness and animates it for a few hundred frames (still and running).
usage: python3 tests/preview/animate_test.py   (needs the luau CLI)"""
import subprocess, os
here = os.path.dirname(os.path.abspath(__file__))
src = open(here + "/harness.luau").read()
prelude = src.split("-- ===== load Animals and run =====")[0]
animals = open(here + "/../../src/shared/Animals.luau").read()
test = prelude + "local Animals = (function()\n" + animals + "\nend)()\n" + '''
local count, bad = 0, 0
for id in Animals.Species do
	local rig = Animals.build(id)
	assert(rig and rig.model and rig.root, id .. " builds")
	assert(rig.groundDrop ~= nil, id .. " has a ground height")
	local parts = 0
	for _, ch in rig.model._children do if ch.ClassName ~= "Weld" then parts += 1 end end
	assert(parts >= 25, id .. " has enough detail: " .. parts)
	for frame = 1, 300 do
		local speed = (frame > 100 and frame < 200) and 9 or 0
		local breath = Animals.animate(rig, 1 / 60, speed)
		assert(type(breath) == "number" and breath == breath, id .. " breath is a number")
	end
	count += 1
end
print("ANIMALS OK", count)
'''
open("/tmp/claude-0/preview/animate_test.luau", "w").write(test)
out = subprocess.run([os.environ.get("LUAU", "/tmp/claude-0/lu/luau"), "/tmp/claude-0/preview/animate_test.luau"], capture_output=True, text=True)
print(out.stdout.strip(), out.stderr.strip()[:600])
