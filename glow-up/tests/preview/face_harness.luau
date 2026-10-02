-- Face preview: builds the custom face for several players/levels and dumps the parts (see face_render.py).
-- (Uses the same tiny Vector3/CFrame/Instance as harness.luau)
HARNESS_PRELUDE
Random = { new = function(seed)
	math.randomseed(seed)
	return { NextNumber = function() return math.random() end, NextInteger = function(_, a, b) return math.random(a, b) end }
end }
local Genome = (function() GENOME_SOURCE end)()
local Face = (function() FACE_SOURCE end)()
local out = {}
local function num(x) return string.format("%.4f", x) end
local cases = { {1001, 1}, {1001, 60}, {1001, 250}, {1001, 900}, {2002, 1}, {2002, 250}, {2002, 900}, {3003, 900}, {4004, 900}, {5005, 900}, {6006, 900}, {7007, 900} }
local Config = { Weirdness = function(level)
	if level <= 100 then return 1 - (level - 1) * 0.0075 end
	return math.max(0, 0.2575 * (1 - (level - 100) / 300))
end }
for _, case in cases do
	local userId, level = case[1], case[2]
	local g = Genome.get(userId)
	local head = Instance.new("Part")
	head.Size = Vector3.new(1.4, 1.4, 1.4)
	head.CFrame = CFrame.new(0, 0, 0)
	head.Color = Genome.skin(Color3.fromRGB(214, 190, 150), g)
	local folder = Instance.new("Folder")
	Face.build(head, folder, head.Size, g, Config.Weirdness(level), head.Color)
	if level >= 40 then Face.hair(head, folder, head.Size, g, level) end
	local parts = {}
	for _, p in folder._children do
		local cf = p.CFrame
		local r = cf.r
		table.insert(parts, string.format('{"c":"%s","s":"%s","z":[%s,%s,%s],"p":[%s,%s,%s],"r":[%s],"k":[%s,%s,%s],"t":%s}', p.ClassName, tostring(p.Shape), num(p.Size.X), num(p.Size.Y), num(p.Size.Z), num(cf.p.X), num(cf.p.Y), num(cf.p.Z), table.concat((function() local t = {} for i = 1, 9 do t[i] = num(r[i]) end return t end)(), ","), num(p.Color.R), num(p.Color.G), num(p.Color.B), num(p.Transparency or 0)))
	end
	table.insert(out, string.format('{"id":%d,"level":%d,"head":[%s,%s,%s],"hc":[%s,%s,%s],"parts":[%s]}', userId, level, num(head.Size.X), num(head.Size.Y), num(head.Size.Z), num(head.Color.R), num(head.Color.G), num(head.Color.B), table.concat(parts, ",")))
end
print("[" .. table.concat(out, ",") .. "]")
