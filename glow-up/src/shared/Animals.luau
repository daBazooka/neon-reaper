-- SUB 5 TO TRUE ADAM: realistic animals built from parts. Each animal is a small skeleton of joints (neck, tail
-- chain, legs, wings...) with real proportions, fur patterns, eyes, ears and whiskers, and it animates: legs walk
-- in diagonal pairs, tails sway, wings flap, chests breathe. Build one with Animals.build(speciesId), then call
-- Animals.animate(rig, dt, speed) every frame (speed in studs/second).
local Animals = {}

local SP = Enum.Material.SmoothPlastic
local BALL, BLOCK, CYL = Enum.PartType.Ball, Enum.PartType.Block, Enum.PartType.Cylinder
local V3, C3, CF = Vector3.new, Color3.fromRGB, CFrame.new
local ANG = CFrame.Angles
local WHITE, BLACK = C3(255, 255, 255), C3(18, 16, 18)

--------------------------------------------------------------------------------
-- Species definitions
--------------------------------------------------------------------------------
-- kind: quad (cats, dogs, horses...), bird, fish, ape.  Lengths are in studs at scale 1.
Animals.Species = {
	cat = { kind = "quad", scale = 1.25, len = 1.9, h = 0.78, w = 0.62, legH = 0.85, legT = 0.2, neck = 0.25, head = V3(0.74, 0.66, 0.68), snout = V3(0.24, 0.2, 0.2), ears = "point", earSize = 0.36, tail = "long", tailLen = 1.9, main = C3(222, 128, 48), belly = C3(250, 232, 205), accent = C3(246, 214, 176), dark = C3(120, 56, 20), eye = C3(120, 190, 70), nose = C3(236, 150, 150), pattern = "tabby", whiskers = true, slit = true },
	pup = { kind = "quad", scale = 1.2, len = 2.3, h = 0.98, w = 0.78, legH = 1.1, legT = 0.28, neck = 0.3, head = V3(0.82, 0.76, 0.8), snout = V3(0.44, 0.34, 0.5), ears = "floppy", earSize = 0.5, tail = "feather", tailLen = 1.5, main = C3(224, 168, 82), belly = C3(242, 206, 140), accent = C3(240, 196, 120), dark = C3(160, 100, 40), eye = C3(80, 48, 24), nose = BLACK, pattern = "none", tongue = true },
	mouse = { kind = "quad", scale = 1, len = 1.15, h = 0.5, w = 0.42, legH = 0.34, legT = 0.1, neck = 0.1, head = V3(0.42, 0.38, 0.5), snout = V3(0.18, 0.16, 0.3), ears = "round", earSize = 0.34, tail = "thin", tailLen = 1.4, main = C3(168, 168, 178), belly = C3(236, 220, 220), accent = C3(240, 160, 170), dark = C3(120, 120, 130), eye = BLACK, nose = C3(240, 140, 150), pattern = "none", whiskers = true, buckTeeth = true },
	wolf = { kind = "quad", scale = 1.3, len = 2.7, h = 1.1, w = 0.8, legH = 1.5, legT = 0.28, neck = 0.4, head = V3(0.8, 0.72, 0.78), snout = V3(0.42, 0.3, 0.62), ears = "point", earSize = 0.4, tail = "bushy", tailLen = 1.7, main = C3(128, 130, 138), belly = C3(206, 206, 212), accent = C3(70, 72, 80), dark = C3(54, 56, 62), eye = C3(220, 170, 40), nose = BLACK, pattern = "saddle", fluff = true },
	fox = { kind = "quad", scale = 1.2, len = 2.1, h = 0.82, w = 0.62, legH = 1.05, legT = 0.2, neck = 0.3, head = V3(0.66, 0.6, 0.7), snout = V3(0.3, 0.22, 0.54), ears = "tall", earSize = 0.55, tail = "bushy", tailLen = 1.9, main = C3(226, 108, 34), belly = C3(250, 244, 236), accent = C3(30, 26, 26), dark = C3(30, 26, 26), eye = C3(150, 96, 30), nose = BLACK, pattern = "socks", tailTip = C3(252, 250, 246), fluff = true },
	lion = { kind = "quad", scale = 1.3, len = 3.0, h = 1.3, w = 1.0, legH = 1.55, legT = 0.38, neck = 0.3, head = V3(0.95, 0.85, 0.9), snout = V3(0.5, 0.36, 0.5), ears = "round", earSize = 0.38, tail = "tuft", tailLen = 2.3, main = C3(212, 164, 98), belly = C3(236, 208, 160), accent = C3(190, 140, 78), dark = C3(110, 62, 28), eye = C3(150, 100, 30), nose = C3(90, 50, 50), pattern = "none", mane = C3(118, 64, 26) },
	bull = { kind = "quad", scale = 1.2, len = 3.1, h = 1.7, w = 1.25, legH = 1.4, legT = 0.4, neck = 0.55, head = V3(0.9, 0.95, 1.1), snout = V3(0.62, 0.5, 0.5), ears = "side", earSize = 0.5, tail = "tuft", tailLen = 1.8, main = C3(104, 52, 38), belly = C3(150, 96, 72), accent = C3(60, 36, 30), dark = C3(40, 26, 22), eye = BLACK, nose = C3(224, 170, 170), pattern = "none", horns = C3(244, 232, 204), hump = true, nosePatch = C3(244, 240, 232) },
	dragon = { kind = "quad", scale = 1.25, len = 3.2, h = 1.3, w = 1.0, legH = 1.2, legT = 0.38, neck = 0.8, head = V3(0.85, 0.7, 1.0), snout = V3(0.5, 0.34, 0.6), ears = "none", earSize = 0, tail = "spiked", tailLen = 3.2, main = C3(76, 168, 92), belly = C3(240, 218, 130), accent = C3(40, 100, 56), dark = C3(32, 84, 48), eye = C3(255, 190, 40), nose = C3(40, 90, 50), pattern = "scales", horns = C3(246, 230, 190), wings = C3(150, 70, 150), spikes = C3(240, 220, 160), slit = true },
	pegasus = { kind = "quad", scale = 1.25, len = 3.2, h = 1.35, w = 0.9, legH = 2.2, legT = 0.3, neck = 1.0, head = V3(0.72, 0.8, 1.15), snout = V3(0.4, 0.4, 0.66), ears = "tall", earSize = 0.36, tail = "flow", tailLen = 2.6, main = C3(246, 246, 250), belly = C3(250, 250, 255), accent = C3(220, 224, 236), dark = C3(160, 190, 236), eye = C3(60, 90, 160), nose = C3(236, 190, 196), pattern = "none", wings = C3(252, 252, 255), mane = C3(150, 196, 255), hooves = C3(214, 214, 226) },
	owl = { kind = "bird", scale = 1.3, h = 1.5, w = 1.2, main = C3(138, 100, 70), belly = C3(228, 206, 170), accent = C3(96, 66, 44), dark = C3(70, 48, 32), face = C3(236, 214, 182), eye = C3(250, 190, 30), beak = C3(230, 150, 50), tufts = true, float = 0.2 },
	phoenix = { kind = "bird", scale = 1.5, h = 1.5, w = 1.0, main = C3(236, 70, 40), belly = C3(255, 170, 50), accent = C3(255, 220, 90), dark = C3(170, 30, 30), face = C3(255, 200, 80), eye = C3(255, 250, 200), beak = C3(255, 200, 60), crest = true, fireTail = true, float = 3.2 },
	shark = { kind = "fish", scale = 1.15, len = 3.6, h = 1.0, main = C3(104, 122, 146), belly = C3(240, 244, 248), accent = C3(80, 96, 120), dark = C3(50, 62, 80), eye = BLACK, float = 3.0 },
	gorilla = { kind = "ape", scale = 1.2, h = 1.6, w = 1.5, main = C3(52, 54, 60), belly = C3(40, 40, 46), accent = C3(122, 124, 132), dark = C3(26, 26, 30), face = C3(36, 34, 36), eye = C3(90, 50, 30) },
}

--------------------------------------------------------------------------------
-- Rig helpers
--------------------------------------------------------------------------------
local function scaledCF(cf, s)
	return CF(cf.Position * s) * (cf - cf.Position)
end

local function newRig(def)
	local model = Instance.new("Model")
	model.Name = "Pet"
	local root = Instance.new("Part")
	root.Name = "Root"
	root.Size = V3(0.4, 0.4, 0.4)
	root.Transparency = 1
	root.Anchored = true
	root.CanCollide, root.CanQuery, root.CanTouch = false, false, false
	root.Parent = model
	model.PrimaryPart = root
	return { model = model, root = root, def = def, scale = def.scale, joints = {}, phase = 0, t = math.random() * 10, blink = 0 }
end

-- Adds a part welded to `parent` at offset `cf` (in the parent's space, before scaling).
local function add(rig, parent, name, shape, size, color, cf, extra)
	local class = (extra and extra.class) or "Part"
	local p = Instance.new(class)
	p.Name = name
	if class == "Part" then
		p.Shape = shape or BLOCK
	end
	p.Size = size * rig.scale
	p.Color = color
	p.Material = (extra and extra.material) or SP
	p.Anchored = false
	p.CanCollide, p.CanQuery, p.CanTouch, p.Massless, p.CastShadow = false, false, false, true, false
	p.TopSurface, p.BottomSurface = Enum.SurfaceType.Smooth, Enum.SurfaceType.Smooth
	if extra and extra.transparency then
		p.Transparency = extra.transparency
	end
	local weld = Instance.new("Weld")
	weld.Part0 = parent
	weld.Part1 = p
	weld.C0 = scaledCF(cf, rig.scale)
	weld.Parent = p
	p.Parent = rig.model
	return p
end

local function joint(rig, name, parent, cf)
	local p = add(rig, parent, name, BLOCK, V3(0.05, 0.05, 0.05), WHITE, cf, { transparency = 1 })
	rig.joints[name] = { weld = p:FindFirstChildOfClass("Weld"), base = p:FindFirstChildOfClass("Weld").C0, part = p }
	return p
end

local function pose(rig, name, delta)
	local j = rig.joints[name]
	if j then
		j.weld.C0 = j.base * delta
	end
end

local function eye(rig, parent, x, y, z, size, color, slit)
	-- eyeball, coloured iris, pupil and a highlight
	add(rig, parent, "Eye", BALL, V3(size, size * 0.9, size * 0.6), C3(236, 232, 226), CF(x, y, z))
	add(rig, parent, "Iris", BALL, V3(size * 0.78, size * 0.78, size * 0.4), color, CF(x, y, z - size * 0.18))
	if slit then
		add(rig, parent, "Pupil", BLOCK, V3(size * 0.16, size * 0.7, size * 0.1), BLACK, CF(x, y, z - size * 0.34))
	else
		add(rig, parent, "Pupil", BALL, V3(size * 0.4, size * 0.4, size * 0.2), BLACK, CF(x, y, z - size * 0.34))
	end
	add(rig, parent, "Glint", BALL, V3(size * 0.14, size * 0.14, size * 0.08), WHITE, CF(x + size * 0.14, y + size * 0.16, z - size * 0.4))
end

--------------------------------------------------------------------------------
-- Quadruped (cat, dog, wolf, fox, lion, bull, mouse, dragon, pegasus)
--------------------------------------------------------------------------------
local function tailChain(rig, def, parent, base)
	local kind = def.tail
	local segs = (kind == "thin" and 6) or (kind == "long" and 5) or (kind == "spiked" and 6) or (kind == "flow" and 5) or 4
	local len = def.tailLen
	local prev = parent
	local x, y, z = base.X, base.Y, base.Z
	for i = 1, segs do
		local t = (i - 1) / (segs - 1)
		local segLen = len / segs
		local j = joint(rig, "Tail" .. i, prev, i == 1 and CF(x, y, z) * ANG(math.rad(kind == "feather" and -25 or (kind == "long" and -35 or (kind == "bushy" and 15 or 10))), 0, 0) or CF(0, 0, segLen))
		local thick
		if kind == "thin" then
			thick = 0.07 * (1.2 - t * 0.5)
		elseif kind == "bushy" then
			thick = def.w * (0.28 + 0.38 * math.sin(t * math.pi * 0.85 + 0.2))
		elseif kind == "feather" or kind == "flow" then
			thick = def.w * (0.22 + 0.2 * math.sin(t * math.pi))
		elseif kind == "spiked" then
			thick = def.w * (0.34 - 0.26 * t)
		else
			thick = def.w * (kind == "tuft" and 0.14 or 0.2) * (1 - t * 0.35)
		end
		local color = def.main
		if i == segs and def.tailTip then
			color = def.tailTip
		elseif kind == "tuft" and i == segs then
			color = def.mane or def.dark
		elseif kind == "flow" then
			color = def.mane
		elseif def.pattern == "tabby" and i % 2 == 0 then
			color = def.dark
		elseif kind == "spiked" then
			color = i % 2 == 0 and def.accent or def.main
		end
		add(rig, j, "TailSeg", BALL, V3(thick, thick, segLen * 1.45 + (kind == "tuft" and i == segs and 0.2 or 0)), color, CF(0, 0, segLen * 0.5))
		if kind == "spiked" and i < segs then
			add(rig, j, "TailSpike", BLOCK, V3(0.08, thick * 1.2, 0.14), def.spikes, CF(0, thick * 0.55, segLen * 0.5), { class = "WedgePart" })
		end
		prev = j
	end
	if kind == "spiked" then
		add(rig, prev, "TailBlade", BLOCK, V3(0.1, 0.9, 0.7), def.spikes, CF(0, 0, 0.6) * ANG(0, 0, 0), { class = "WedgePart" })
	end
end

local function leg(rig, def, parent, name, x, y, z, front)
	local legH, t = def.legH, def.legT
	local hip = joint(rig, name, parent, CF(x, y, z))
	local uLen, lLen, pLen = legH * 0.5, legH * 0.42, legH * 0.1
	-- hind legs bend like a real animal's: thigh forward, hock back. Front legs are straighter.
	local a1 = front and 0.05 or 0.5
	local a2 = front and -0.05 or -0.9
	local thigh = joint(rig, name .. "Th", hip, CF(0, 0, 0) * ANG(a1, 0, 0))
	local tw = t * (front and 1.25 or 1.7)
	add(rig, thigh, "Thigh", BALL, V3(tw, uLen * 1.25, tw * 1.05), def.main, CF(0, -uLen * 0.46, 0))
	local shin = joint(rig, name .. "Sh", thigh, CF(0, -uLen * 0.9, 0) * ANG(a2, 0, 0))
	local shinColor = def.pattern == "socks" and def.accent or def.main
	add(rig, shin, "Shin", CYL, V3(lLen * 1.05, t * 0.8, t * 0.8), shinColor, CF(0, -lLen * 0.5, 0) * ANG(0, 0, math.pi / 2))
	add(rig, shin, "Knee", BALL, V3(t * 0.95, t * 0.95, t * 0.95), shinColor, CF(0, 0, 0))
	local foot = joint(rig, name .. "Pw", shin, CF(0, -lLen * 0.95, 0) * ANG(-(a1 + a2), 0, 0))
	if def.hooves then
		add(rig, foot, "Hoof", BLOCK, V3(t * 0.95, pLen * 1.4, t * 1.05), def.hooves, CF(0, -pLen * 0.6, -t * 0.05))
	else
		local pawColor = (def.pattern == "socks") and def.accent or def.belly
		add(rig, foot, "Paw", BALL, V3(t * 1.15, pLen * 1.3 + t * 0.3, t * 1.75), pawColor, CF(0, -pLen * 0.35, -t * 0.35))
		for i = -1, 1 do
			add(rig, foot, "Claw", BLOCK, V3(0.028, 0.028, 0.07), def.slit and def.horns or C3(232, 228, 216), CF(i * t * 0.3, -pLen * 0.5, -t * 1.2))
		end
	end
end

local function earShape(rig, def, headPart, side, hw, hh, hl)
	local s = def.earSize
	local kind = def.ears
	local name = side < 0 and "EarL" or "EarR"
	if kind == "point" or kind == "tall" then
		local h = s * (kind == "tall" and 1.15 or 1)
		local j = joint(rig, name, headPart, CF(side * hw * 0.3, hh * 0.38, hl * 0.06) * ANG(0, 0, side * -0.18))
		-- a wedge turned so its triangle faces forward; the tall edge is on the inner side
		add(rig, j, "Ear", BLOCK, V3(s * 0.2, h, s * 0.9), def.pattern == "socks" and def.accent or def.main, CF(0, h * 0.5, 0) * ANG(0, -side * math.pi / 2, 0), { class = "WedgePart" })
		add(rig, j, "EarIn", BLOCK, V3(s * 0.08, h * 0.72, s * 0.55), def.nose == BLACK and def.belly or def.nose, CF(0, h * 0.4, -s * 0.1) * ANG(0, -side * math.pi / 2, 0), { class = "WedgePart" })
	elseif kind == "floppy" then
		local j = joint(rig, name, headPart, CF(side * hw * 0.42, hh * 0.28, hl * 0.04))
		add(rig, j, "Ear", BALL, V3(s * 0.22, s * 1.25, s * 0.8), def.dark, CF(side * s * 0.14, -s * 0.5, 0) * ANG(0, 0, side * 0.25))
	elseif kind == "round" then
		local j = joint(rig, name, headPart, CF(side * hw * 0.34, hh * 0.42, hl * 0.05))
		add(rig, j, "Ear", CYL, V3(s * 0.12, s, s), def.main, CF(side * s * 0.2, s * 0.35, 0) * ANG(0, 0, 0))
		add(rig, j, "EarIn", CYL, V3(s * 0.08, s * 0.72, s * 0.72), def.accent, CF(side * s * 0.2, s * 0.35, -s * 0.07) * ANG(0, 0, 0))
	elseif kind == "side" then
		local j = joint(rig, name, headPart, CF(side * hw * 0.5, hh * 0.18, hl * 0.12))
		add(rig, j, "Ear", BALL, V3(s * 0.9, s * 0.26, s * 0.5), def.main, CF(side * s * 0.4, 0, 0) * ANG(0, 0, side * -0.25))
	end
end

local function quadruped(rig, def)
	local len, h, w = def.len, def.h, def.w
	local root = rig.root
	local legH = def.legH
	rig.ground = legH * 1.02 + h * 0.26 -- distance from the root down to the floor
	-- body: chest, belly, hindquarters (overlapping ellipsoids give a muscular shape)
	add(rig, root, "Chest", BALL, V3(w * 1.02, h * 1.05, len * 0.52), def.main, CF(0, h * 0.04, -len * 0.2))
	add(rig, root, "Hips", BALL, V3(w * 0.96, h * 0.98, len * 0.5), def.main, CF(0, 0, len * 0.22))
	add(rig, root, "Waist", CYL, V3(len * 0.5, h * 0.9, w * 0.88), def.main, CF(0, 0, 0) * ANG(0, math.pi / 2, math.pi / 2))
	add(rig, root, "Belly", BALL, V3(w * 0.74, h * 0.5, len * 0.78), def.belly, CF(0, -h * 0.3, 0))
	add(rig, root, "Back", BALL, V3(w * 0.72, h * 0.28, len * 0.7), def.main, CF(0, h * 0.28, 0.05))
	if def.pattern == "saddle" then
		add(rig, root, "Saddle", BALL, V3(w * 0.86, h * 0.5, len * 0.62), def.accent, CF(0, h * 0.14, 0.02))
	end
	if def.hump then
		add(rig, root, "Hump", BALL, V3(w * 0.95, h * 0.7, len * 0.3), def.main, CF(0, h * 0.5, -len * 0.26))
	end
	if def.mane and def.kind == "quad" and def.ears == "round" and def.tail == "tuft" then
		add(rig, root, "ChestFluff", BALL, V3(w * 1.12, h * 1.1, len * 0.36), def.mane, CF(0, h * 0.05, -len * 0.34))
	end
	-- markings
	if def.pattern == "tabby" then
		for i = 1, 6 do
			add(rig, root, "Stripe", BLOCK, V3(w * 0.86, h * 0.07, len * 0.045), def.dark, CF(0, h * 0.39, -len * 0.34 + i * len * 0.115) * ANG(0, 0, 0))
			add(rig, root, "FlankStripe", BLOCK, V3(w * 1.02, h * 0.38, len * 0.035), def.dark, CF(0, h * 0.04, -len * 0.3 + i * len * 0.11) * ANG(0, 0, 0), { transparency = 0.25 })
		end
	elseif def.pattern == "scales" then
		for i = 1, 7 do
			add(rig, root, "BellyPlate", BLOCK, V3(w * 0.5, h * 0.06, len * 0.08), def.belly, CF(0, -h * 0.52, -len * 0.38 + i * len * 0.1))
			add(rig, root, "ScalePatch", BALL, V3(w * 0.3, h * 0.16, len * 0.1), def.accent, CF((i % 2 == 0 and 1 or -1) * w * 0.32, h * 0.2, -len * 0.36 + i * len * 0.11))
		end
	end
	if def.nosePatch then
		add(rig, root, "ChestPatch", BALL, V3(w * 0.5, h * 0.4, len * 0.2), def.belly, CF(0, -h * 0.18, -len * 0.4))
	end
	if def.spikes then
		for i = 1, 8 do
			local sz = 0.34 - math.abs(i - 4) * 0.025
			add(rig, root, "BackSpike", BLOCK, V3(0.1, sz, 0.2), def.spikes, CF(0, h * 0.42 + sz * 0.3, -len * 0.4 + i * len * 0.1), { class = "WedgePart" })
		end
	end

	-- legs: front pair slightly forward, hind pair back (rear legs have big thighs)
	local fz, bz = -len * 0.3, len * 0.32
	local lx = w * 0.32
	local hindDrop = legH * 0.1 -- bent hind legs are shorter, so their hips sit lower
	leg(rig, def, root, "LegFL", -lx, -h * 0.26, fz, true)
	leg(rig, def, root, "LegFR", lx, -h * 0.26, fz, true)
	leg(rig, def, root, "LegBL", -lx, -h * 0.26 - hindDrop, bz, false)
	leg(rig, def, root, "LegBR", lx, -h * 0.26 - hindDrop, bz, false)

	-- neck and head: the neck leans forward and up, the head is levelled again at its end
	local neckLen = def.neck
	local pitch = math.rad(28 + neckLen * 22)
	local L = h * (0.38 + neckLen * 0.95)
	local neck = joint(rig, "Neck", root, CF(0, h * 0.3, -len * 0.38) * ANG(pitch, 0, 0))
	add(rig, neck, "NeckBody", CYL, V3(L * 1.15, w * 0.6, w * 0.6), def.main, CF(0, 0, -L * 0.5) * ANG(0, math.pi / 2, 0))
	add(rig, neck, "NeckBase", BALL, V3(w * 0.78, w * 0.8, w * 0.8), def.main, CF(0, -0.05, -L * 0.1))
	if def.mane and def.ears == "round" and def.tail == "tuft" then
		-- lion's mane: a thick ring of fur around the head and shoulders
		for i = 1, 12 do
			local a2 = (i / 12) * math.pi * 2
			add(rig, neck, "Mane", BALL, V3(0.7, 0.7, 0.7), i % 2 == 0 and def.mane or def.mane:Lerp(BLACK, 0.2), CF(math.cos(a2) * def.head.Y * 0.62, math.sin(a2) * def.head.Y * 0.62, -L - 0.1))
		end
		add(rig, neck, "ManeBack", BALL, V3(def.head.Y * 1.45, def.head.Y * 1.45, def.head.Z * 0.7), def.mane, CF(0, 0, -L + 0.1))
	elseif def.mane then
		-- flowing mane along the neck (pegasus)
		for i = 1, 6 do
			add(rig, neck, "Mane", BALL, V3(0.16, 0.5, 0.32), def.mane, CF(0, w * 0.32, -i * L * 0.15) * ANG(0.3, 0, 0))
		end
	end
	local hd = V3(def.head.X, def.head.Y, def.head.Z)
	local head = joint(rig, "Head", neck, CF(0, 0, -L) * ANG(-pitch * 0.85, 0, 0))
	local hw, hh, hl = hd.X, hd.Y, hd.Z
	add(rig, head, "Skull", BALL, V3(hw, hh, hl), def.main, CF(0, 0, 0))
	local sn = def.snout
	-- muzzle: upper snout, lower jaw, nose, mouth line
	add(rig, head, "Muzzle", BALL, V3(sn.X * 1.6, sn.Y * 1.5, sn.Z * 1.7), def.pattern == "scales" and def.main or def.belly == WHITE and def.main or (def.nosePatch and def.nosePatch) or (def.pattern == "none" and def.main) or def.belly, CF(0, -hh * 0.16, -hl * 0.38 - sn.Z * 0.2))
	add(rig, head, "Jaw", BALL, V3(sn.X * 1.3, sn.Y * 0.9, sn.Z * 1.5), def.belly, CF(0, -hh * 0.3, -hl * 0.34 - sn.Z * 0.1))
	local tipZ = -hl * 0.38 - sn.Z * 1.05
	add(rig, head, "Nose", BALL, V3(sn.X * 0.7, sn.Y * 0.55, sn.Y * 0.5), def.nose, CF(0, -hh * 0.08, tipZ))
	add(rig, head, "Mouth", BLOCK, V3(sn.X * 1.25, 0.03, sn.Z * 1.1), BLACK, CF(0, -hh * 0.27, tipZ + sn.Z * 0.55))
	if def.tongue then
		add(rig, head, "Tongue", BALL, V3(sn.X * 0.6, 0.06, sn.Z * 0.9), C3(240, 110, 130), CF(0, -hh * 0.3, tipZ + sn.Z * 0.45))
	end
	if def.buckTeeth then
		add(rig, head, "Teeth", BLOCK, V3(0.1, 0.12, 0.04), C3(250, 248, 238), CF(0, -hh * 0.32, tipZ + 0.02))
	end
	if def.pattern == "tabby" then
		for i = -1, 1 do
			add(rig, head, "ForeheadMark", BLOCK, V3(0.04, hh * 0.22, 0.03), def.dark, CF(i * hw * 0.13, hh * 0.3, -hl * 0.4))
		end
		for side = -1, 1, 2 do
			add(rig, head, "CheekStripe", BLOCK, V3(hw * 0.2, 0.035, 0.03), def.dark, CF(side * hw * 0.42, -hh * 0.08, -hl * 0.3) * ANG(0, 0, side * 0.2))
		end
	elseif def.pattern == "saddle" or def.pattern == "socks" then
		add(rig, head, "FaceMask", BALL, V3(hw * 0.7, hh * 0.5, hl * 0.4), def.belly, CF(0, -hh * 0.2, -hl * 0.34))
	end
	if def.nosePatch then
		add(rig, head, "NosePatch", BALL, V3(sn.X * 1.7, sn.Y * 1.5, sn.Z * 0.7), def.nosePatch, CF(0, -hh * 0.1, -hl * 0.38 - sn.Z * 0.6))
	end
	-- eyes + brow ridge
	for side = -1, 1, 2 do
		local ex = side * hw * 0.3
		local es = math.max(0.1, hw * 0.26)
		eye(rig, head, ex, hh * 0.12, -hl * 0.36, es, def.eye, def.slit)
		add(rig, head, "Brow", BLOCK, V3(es * 1.3, es * 0.22, es * 0.5), def.dark, CF(ex, hh * 0.12 + es * 0.55, -hl * 0.34) * ANG(0, 0, side * -0.25))
		earShape(rig, def, head, side, hw, hh, hl)
	end
	if def.horns then
		for side = -1, 1, 2 do
			if def.ears == "side" then
				-- bull horns: out, then up and forward
				local h1 = joint(rig, side < 0 and "HornL" or "HornR", head, CF(side * hw * 0.5, hh * 0.32, hl * 0.02))
				add(rig, h1, "HornBase", CYL, V3(0.5, 0.2, 0.2), def.horns, CF(side * 0.22, 0, 0))
				add(rig, h1, "HornMid", CYL, V3(0.55, 0.15, 0.15), def.horns, CF(side * 0.58, 0.14, 0) * ANG(0, 0, side * 0.6))
				add(rig, h1, "HornTip", CYL, V3(0.45, 0.1, 0.1), C3(60, 50, 44), CF(side * 0.8, 0.52, -0.05) * ANG(0, 0, side * 1.2))
			else
				-- dragon horns: swept back
				add(rig, head, "Horn", BLOCK, V3(0.14, 0.14, 0.7), def.horns, CF(side * hw * 0.3, hh * 0.5, hl * 0.2) * ANG(math.rad(-40), 0, 0), { class = "WedgePart" })
			end
		end
	end
	if def.fluff then
		for side = -1, 1, 2 do
			add(rig, head, "CheekFur", BALL, V3(hw * 0.4, hh * 0.5, hl * 0.4), def.belly, CF(side * hw * 0.38, -hh * 0.22, -hl * 0.08))
		end
	end
	if def.whiskers then
		for side = -1, 1, 2 do
			for i = -1, 1 do
				add(rig, head, "Whisker", BLOCK, V3(sn.X * 2.2, 0.012, 0.012), C3(244, 244, 244), CF(side * (sn.X * 1.7), -hh * 0.18 + i * 0.045, tipZ + sn.Z * 0.5) * ANG(0, 0, side * (0.12 - i * 0.09)))
			end
		end
	end

	-- wings (dragon, pegasus)
	if def.wings then
		for side = -1, 1, 2 do
			local name = side < 0 and "WingL" or "WingR"
			local wj = joint(rig, name, root, CF(side * w * 0.4, h * 0.42, -len * 0.14))
			local span = len * 0.9
			if def.pattern == "scales" then
				-- bat-style: arm bone with fingers and a membrane
				add(rig, wj, "WingArm", CYL, V3(span * 0.55, 0.14, 0.14), def.main, CF(side * span * 0.28, 0.1, 0))
				add(rig, wj, "WingMembrane", BLOCK, V3(span * 0.95, 0.04, len * 0.55), def.wings, CF(side * span * 0.5, 0, len * 0.2), { class = "Part", transparency = 0.1 })
				for i = 1, 3 do
					add(rig, wj, "WingFinger", BLOCK, V3(span * 0.8, 0.07, 0.07), def.main, CF(side * span * 0.5, 0.03, len * (0.04 + i * 0.12)) * ANG(0, side * -0.25 * i, 0))
				end
			else
				-- feathered wing: a row of long feathers fanning out
				for i = 1, 7 do
					local fl = span * (0.55 + 0.07 * (7 - i) * 0.5)
					add(rig, wj, "Feather", BALL, V3(fl, 0.07, 0.34), def.wings, CF(side * fl * 0.5, 0.02 * i, len * 0.04 * (i - 2)) * ANG(0, side * -0.14 * (i - 3), side * 0.18))
				end
				add(rig, wj, "WingBase", BALL, V3(span * 0.4, 0.2, 0.5), def.wings, CF(side * span * 0.16, 0.08, 0))
			end
			-- wings rest folded back by default (they open when flapping)
			rig.joints[name].base = rig.joints[name].weld.C0
		end
	end

	-- tail
	tailChain(rig, def, root, V3(0, h * 0.22, len * 0.47))
	rig.legs = { FL = "LegFL", FR = "LegFR", BL = "LegBL", BR = "LegBR" }
	rig.gaitAmp = math.clamp(0.45 + legH * 0.12, 0.5, 0.8)
end

--------------------------------------------------------------------------------
-- Birds (owl, phoenix)
--------------------------------------------------------------------------------
local function bird(rig, def)
	local h, w = def.h, def.w
	local root = rig.root
	rig.ground = h * 0.8 + def.float
	add(rig, root, "Body", BALL, V3(w, h, w * 0.85), def.main, CF(0, 0, 0))
	add(rig, root, "Breast", BALL, V3(w * 0.78, h * 0.8, w * 0.5), def.belly, CF(0, -h * 0.08, -w * 0.28))
	for i = 1, 7 do
		-- chest feather scallops
		add(rig, root, "Scallop", BALL, V3(w * 0.12, h * 0.07, 0.05), def.dark, CF(((i % 3) - 1) * w * 0.16, h * (0.18 - math.floor((i - 1) / 3) * 0.2), -w * 0.5), { transparency = 0.2 })
	end
	local head = joint(rig, "Head", root, CF(0, h * 0.5, -w * 0.1))
	add(rig, head, "Skull", BALL, V3(w * 0.88, w * 0.8, w * 0.8), def.main, CF(0, h * 0.1, 0))
	add(rig, head, "FaceDisc", BALL, V3(w * 0.78, w * 0.66, w * 0.2), def.face, CF(0, h * 0.1, -w * 0.32))
	for side = -1, 1, 2 do
		add(rig, head, "EyeSocket", BALL, V3(w * 0.3, w * 0.3, w * 0.12), def.dark, CF(side * w * 0.2, h * 0.14, -w * 0.4))
		eye(rig, head, side * w * 0.2, h * 0.14, -w * 0.44, w * 0.26, def.eye, false)
		if def.tufts then
			add(rig, head, "Tuft", BLOCK, V3(w * 0.14, w * 0.34, w * 0.14), def.accent, CF(side * w * 0.26, h * 0.1 + w * 0.4, -w * 0.05) * ANG(0, 0, side * -0.3), { class = "WedgePart" })
		end
	end
	add(rig, head, "Beak", BLOCK, V3(w * 0.14, w * 0.2, w * 0.24), def.beak, CF(0, h * 0.05, -w * 0.52) * ANG(math.rad(-10), 0, 0), { class = "WedgePart" })
	if def.crest then
		for i = 1, 4 do
			add(rig, head, "Crest", BLOCK, V3(0.08, w * (0.5 - i * 0.06), 0.16), i % 2 == 0 and def.accent or def.main, CF(0, h * 0.22 + w * 0.3, w * (i * 0.1 - 0.15)) * ANG(math.rad(i * 14), 0, 0), { class = "WedgePart" })
		end
	end
	-- wings: a row of feathers that flap
	for side = -1, 1, 2 do
		local name = side < 0 and "WingL" or "WingR"
		local wj = joint(rig, name, root, CF(side * w * 0.46, h * 0.18, 0))
		local span = h * 1.5
		for i = 1, 8 do
			local fl = span * (0.5 + 0.06 * (8 - i) * 0.5)
			local color = (def.fireTail and (i % 2 == 0 and def.accent or def.main)) or (i % 2 == 0 and def.accent or def.main)
			add(rig, wj, "Feather", BALL, V3(fl, 0.06, 0.3), color, CF(side * fl * 0.5, -0.03 * i, 0.12 * (i - 3)) * ANG(0, side * -0.1 * (i - 3), side * 0.1))
		end
		add(rig, wj, "WingBase", BALL, V3(span * 0.34, 0.2, 0.5), def.main, CF(side * span * 0.14, 0, 0))
	end
	-- legs + talons
	for side = -1, 1, 2 do
		local lj = joint(rig, side < 0 and "LegL" or "LegR", root, CF(side * w * 0.2, -h * 0.46, 0))
		add(rig, lj, "Leg", CYL, V3(h * 0.26, 0.07, 0.07), def.beak, CF(0, -h * 0.12, 0) * ANG(0, 0, math.pi / 2))
		for i = -1, 1 do
			add(rig, lj, "Talon", BLOCK, V3(0.04, 0.04, 0.2), def.beak, CF(i * 0.07, -h * 0.26, -0.1) * ANG(0, i * 0.3, 0))
		end
	end
	-- tail feathers
	local tailSegs = def.fireTail and 7 or 4
	for i = 1, tailSegs do
		local len = def.fireTail and (h * (0.9 + i * 0.2)) or h * 0.5
		local spread = (i - (tailSegs + 1) / 2) * (def.fireTail and 0.14 or 0.2)
		local j = joint(rig, "Tail" .. i, root, CF(0, -h * 0.28, w * 0.36) * ANG(math.rad(-10), spread, 0))
		local color = def.fireTail and ({ def.main, def.belly, def.accent })[(i % 3) + 1] or (i % 2 == 0 and def.dark or def.main)
		add(rig, j, "TailFeather", BALL, V3(0.2, 0.05, len), color, CF(0, 0, len * 0.5))
		if def.fireTail then
			add(rig, j, "TailFlame", BLOCK, V3(0.1, 0.05, len * 0.4), def.accent, CF(0, 0, len * 1.02), { class = "WedgePart" })
		end
	end
	rig.isBird = true
end

--------------------------------------------------------------------------------
-- Fish (shark)
--------------------------------------------------------------------------------
local function fish(rig, def)
	local len, h = def.len, def.h
	local root = rig.root
	rig.ground = def.float + h * 0.6
	local segs = 6
	local prev = root
	local zStep = len / segs
	for i = 1, segs do
		local t = (i - 1) / (segs - 1)
		-- thickest just behind the head, tapering to the tail
		local thick = h * (0.45 + 0.55 * math.sin(math.min(1, (t + 0.2) / 0.9) * math.pi * 0.8))
		if i == 1 then
			thick = h * 0.8
		end
		local j = joint(rig, "Body" .. i, prev, CF(0, 0, i == 1 and -len * 0.25 or zStep))
		add(rig, j, "Segment", BALL, V3(thick * 0.95, thick, zStep * 1.7), def.main, CF(0, 0, 0))
		add(rig, j, "Underside", BALL, V3(thick * 0.8, thick * 0.5, zStep * 1.5), def.belly, CF(0, -thick * 0.24, 0))
		prev = j
	end
	local head = rig.joints.Body1.part
	-- snout, eyes, mouth, gills, teeth
	add(rig, head, "Snout", BALL, V3(h * 0.7, h * 0.55, len * 0.3), def.main, CF(0, -h * 0.02, -len * 0.2))
	add(rig, head, "Jaw", BALL, V3(h * 0.6, h * 0.25, len * 0.28), def.belly, CF(0, -h * 0.26, -len * 0.14))
	add(rig, head, "Mouth", BLOCK, V3(h * 0.62, 0.03, len * 0.25), BLACK, CF(0, -h * 0.15, -len * 0.18))
	for i = -3, 3 do
		add(rig, head, "Tooth", BLOCK, V3(0.05, 0.1, 0.05), WHITE, CF(i * h * 0.085, -h * 0.17, -len * 0.3) * ANG(math.pi, 0, 0), { class = "WedgePart" })
	end
	for side = -1, 1, 2 do
		add(rig, head, "Eye", BALL, V3(0.18, 0.18, 0.12), BLACK, CF(side * h * 0.34, h * 0.14, -len * 0.18))
		add(rig, head, "Glint", BALL, V3(0.05, 0.05, 0.05), WHITE, CF(side * h * 0.36, h * 0.18, -len * 0.2))
		for i = 1, 3 do
			add(rig, head, "Gill", BLOCK, V3(0.02, h * 0.3, 0.03), def.dark, CF(side * h * 0.37, 0, -len * 0.05 + i * 0.12) * ANG(0, 0, side * 0.1))
		end
		local pj = joint(rig, side < 0 and "FinL" or "FinR", head, CF(side * h * 0.4, -h * 0.3, -len * 0.02))
		add(rig, pj, "PectoralFin", BLOCK, V3(h * 0.75, 0.05, len * 0.22), def.accent, CF(side * h * 0.34, -0.1, 0.1) * ANG(0, side * 0.3, side * -0.35), { class = "WedgePart" })
	end
	add(rig, head, "DorsalFin", BLOCK, V3(0.07, h * 0.95, len * 0.24), def.accent, CF(0, h * 0.8, len * 0.05) * ANG(0, math.pi, 0), { class = "WedgePart" })
	local tail = rig.joints["Body" .. segs].part
	add(rig, tail, "TailUpper", BLOCK, V3(0.07, h * 1.2, len * 0.2), def.main, CF(0, h * 0.5, zStep * 0.9) * ANG(math.rad(-22), math.pi, 0), { class = "WedgePart" })
	add(rig, tail, "TailLower", BLOCK, V3(0.07, h * 0.8, len * 0.16), def.main, CF(0, -h * 0.36, zStep * 0.85) * ANG(math.rad(25), 0, 0), { class = "WedgePart" })
	rig.segs = segs
end

--------------------------------------------------------------------------------
-- Ape (gorilla)
--------------------------------------------------------------------------------
local function ape(rig, def)
	local h, w = def.h, def.w
	local root = rig.root
	rig.ground = h * 0.95
	add(rig, root, "Torso", BALL, V3(w, h * 0.9, w * 0.8), def.main, CF(0, 0, 0))
	add(rig, root, "Back", BALL, V3(w * 0.8, h * 0.3, w * 0.4), def.accent, CF(0, h * 0.3, w * 0.22))
	add(rig, root, "Belly", BALL, V3(w * 0.7, h * 0.6, w * 0.6), def.belly, CF(0, -h * 0.2, -w * 0.12))
	add(rig, root, "Chest", BALL, V3(w * 0.5, h * 0.22, w * 0.3), def.face, CF(0, h * 0.12, -w * 0.34))
	for side = -1, 1, 2 do
		add(rig, root, "Pec", BALL, V3(w * 0.42, h * 0.3, w * 0.3), def.main, CF(side * w * 0.22, h * 0.26, -w * 0.32))
	end
	local head = joint(rig, "Head", root, CF(0, h * 0.44, -w * 0.32))
	add(rig, head, "Skull", BALL, V3(w * 0.52, w * 0.5, w * 0.55), def.main, CF(0, 0.05, 0))
	add(rig, head, "Crest", BALL, V3(w * 0.34, w * 0.22, w * 0.5), def.main, CF(0, w * 0.22, w * 0.04))
	add(rig, head, "Face", BALL, V3(w * 0.4, w * 0.36, w * 0.2), def.face, CF(0, -0.03, -w * 0.22))
	add(rig, head, "Muzzle", BALL, V3(w * 0.3, w * 0.2, w * 0.2), def.face:Lerp(def.accent, 0.3), CF(0, -w * 0.1, -w * 0.3))
	add(rig, head, "Brow", BLOCK, V3(w * 0.42, w * 0.08, w * 0.12), def.dark, CF(0, w * 0.1, -w * 0.28))
	add(rig, head, "Nostrils", BLOCK, V3(w * 0.1, 0.03, 0.03), BLACK, CF(0, -w * 0.08, -w * 0.4))
	add(rig, head, "Mouth", BLOCK, V3(w * 0.26, 0.03, 0.03), BLACK, CF(0, -w * 0.17, -w * 0.38))
	for side = -1, 1, 2 do
		eye(rig, head, side * w * 0.11, w * 0.03, -w * 0.31, w * 0.1, def.eye, false)
		add(rig, head, "Ear", BALL, V3(0.08, w * 0.14, w * 0.1), def.face, CF(side * w * 0.27, 0, 0))
	end
	-- long arms, short legs
	local fz = -w * 0.05
	for side = -1, 1, 2 do
		local name = side < 0 and "ArmL" or "ArmR"
		local aj = joint(rig, name, root, CF(side * w * 0.5, h * 0.3, fz))
		add(rig, aj, "Shoulder", BALL, V3(w * 0.4, w * 0.4, w * 0.4), def.main, CF(0, 0, 0))
		add(rig, aj, "UpperArm", CYL, V3(h * 0.5, w * 0.3, w * 0.3), def.main, CF(side * 0.04, -h * 0.28, 0) * ANG(0, 0, math.pi / 2))
		add(rig, aj, "ForeArm", CYL, V3(h * 0.5, w * 0.26, w * 0.26), def.main, CF(side * 0.04, -h * 0.72, -0.04) * ANG(0, 0, math.pi / 2))
		add(rig, aj, "Hand", BALL, V3(w * 0.3, w * 0.22, w * 0.36), def.face, CF(side * 0.04, -h * 1.0, -w * 0.08))
		local lj = joint(rig, side < 0 and "LegL" or "LegR", root, CF(side * w * 0.26, -h * 0.4, w * 0.12))
		add(rig, lj, "Thigh", BALL, V3(w * 0.34, h * 0.4, w * 0.36), def.main, CF(0, -h * 0.1, 0))
		add(rig, lj, "Shin", CYL, V3(h * 0.3, w * 0.22, w * 0.22), def.main, CF(0, -h * 0.34, 0) * ANG(0, 0, math.pi / 2))
		add(rig, lj, "Foot", BALL, V3(w * 0.3, w * 0.16, w * 0.4), def.face, CF(0, -h * 0.5, -w * 0.08))
	end
	rig.isApe = true
end

--------------------------------------------------------------------------------
-- Public API
--------------------------------------------------------------------------------
function Animals.build(speciesId)
	local def = Animals.Species[speciesId]
	if not def then
		return nil
	end
	local rig = newRig(def)
	rig.species = speciesId
	if def.kind == "quad" then
		quadruped(rig, def)
	elseif def.kind == "bird" then
		bird(rig, def)
	elseif def.kind == "fish" then
		fish(rig, def)
	else
		ape(rig, def)
	end
	rig.groundDrop = (rig.ground or 1) * rig.scale
	return rig
end

-- Poses the animal for this frame. speed = how fast it is moving (studs per second).
function Animals.animate(rig, dt, speed)
	local def = rig.def
	rig.t += dt
	local t = rig.t
	local moving = math.clamp(speed / 6, 0, 1)
	rig.phase += dt * (3 + speed * 1.3)
	local ph = rig.phase
	if def.kind == "quad" then
		local amp = rig.gaitAmp * moving
		pose(rig, "LegFL", ANG(math.sin(ph) * amp, 0, 0))
		pose(rig, "LegBR", ANG(math.sin(ph) * amp, 0, 0))
		pose(rig, "LegFR", ANG(math.sin(ph + math.pi) * amp, 0, 0))
		pose(rig, "LegBL", ANG(math.sin(ph + math.pi) * amp, 0, 0))
		-- head: look around when idle, bob when running
		pose(rig, "Neck", ANG(math.sin(ph * 2) * 0.04 * moving, math.sin(t * 0.7) * 0.18 * (1 - moving), 0))
		pose(rig, "Head", ANG(math.sin(t * 1.3) * 0.05, 0, 0))
		-- tails sway; faster and higher when moving
		local n = 0
		while rig.joints["Tail" .. (n + 1)] do
			n += 1
		end
		for i = 1, n do
			local sway = math.sin(t * (2 + moving * 3) - i * 0.7) * (0.12 + i * 0.05)
			pose(rig, "Tail" .. i, ANG(-0.05 * moving, sway, 0))
		end
		-- ears twitch now and then
		local twitch = math.max(0, math.sin(t * 1.9)) ^ 12 * 0.35
		pose(rig, "EarL", ANG(0, 0, twitch))
		pose(rig, "EarR", ANG(0, 0, -twitch))
		-- wings: folded at rest, flapping when moving
		-- (a left wing dips with a positive roll, a right wing with a negative one)
		local fold = (1 - moving) * (0.95 + math.sin(t * 1.4) * 0.05) + moving * (math.sin(t * 7) * 0.7 - 0.2)
		pose(rig, "WingL", ANG(0, 0, fold))
		pose(rig, "WingR", ANG(0, 0, -fold))
	elseif def.kind == "bird" then
		local fold = (1 - moving) * (1.2 + math.sin(t * 2.5) * 0.04) + moving * (math.sin(t * 9) * 0.7 - 0.2)
		pose(rig, "WingL", ANG(0, 0, fold))
		pose(rig, "WingR", ANG(0, 0, -fold))
		pose(rig, "Head", ANG(0, math.sin(t * 0.5) * 0.9 * (def.tufts and 1 or 0.3), 0))
		local i = 1
		while rig.joints["Tail" .. i] do
			pose(rig, "Tail" .. i, ANG(math.sin(t * 3 - i * 0.4) * 0.1, math.sin(t * 2 + i) * 0.1, 0))
			i += 1
		end
	elseif def.kind == "fish" then
		for i = 1, rig.segs do
			pose(rig, "Body" .. i, ANG(0, math.sin(t * (3 + moving * 3) - i * 0.8) * (0.05 + i * 0.03), 0))
		end
		pose(rig, "FinL", ANG(0, 0, math.sin(t * 2) * 0.15))
		pose(rig, "FinR", ANG(0, 0, -math.sin(t * 2) * 0.15))
	else
		-- ape: knuckle-walk, arms and legs in opposite pairs
		local amp = 0.55 * moving
		pose(rig, "ArmL", ANG(math.sin(ph) * amp, 0, 0))
		pose(rig, "ArmR", ANG(math.sin(ph + math.pi) * amp, 0, 0))
		pose(rig, "LegL", ANG(math.sin(ph + math.pi) * amp, 0, 0))
		pose(rig, "LegR", ANG(math.sin(ph) * amp, 0, 0))
		pose(rig, "Head", ANG(math.sin(t * 1.1) * 0.06, math.sin(t * 0.6) * 0.2 * (1 - moving), 0))
	end
	-- breathing: the whole body rises and falls a little (the caller adds this to the root height)
	return math.sin(t * 2.2) * 0.03 * rig.scale + math.abs(math.sin(ph)) * 0.06 * moving * rig.scale
end

return Animals
