-- SUB 5 TO TRUE ADAM: the Ranked Arena (1v1 duels). A red-and-pink fighting platform with a white rim stands on a dark
-- pillar in the middle of a pit full of spikes. The pit is walled in by stepped, green-topped voxel cliffs with trees,
-- fences and torches, a "RANKED • 1v1" sign hangs on the back wall, and a stone bridge with a staircase and a gate
-- leads in from the plaza. Everything is plain parts (LEGO-style studs). The spikes are decoration only; if someone does
-- fall off the platform, `rescue()` puts them back at the gate.
--
-- Local frame: x = right, y = up, z = toward the back wall; the entrance (and the plaza) is at -z. Ground is y = 0.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Island = require(script.Parent.Island)

local RankedArena = {}

local M = Enum.Material
local C3 = Color3.fromRGB

local PIT = 30 -- half size of the spike pit
local PLAT = 16 -- half size of the fighting platform
local DECK = 5.6 -- top of the platform
local CELL = 6
local STEP = 7 -- height of one cliff terrace

local NAVY, NAVY_L = C3(30, 36, 66), C3(52, 62, 110)
local PINK_A, PINK_B = C3(238, 66, 108), C3(214, 50, 92)
local WHITE, YELLOW = C3(246, 246, 250), C3(255, 224, 60)
local STONE, STONE_D = C3(204, 208, 218), C3(168, 172, 184)
local GOLD = C3(240, 192, 56)
local GRASS_A, GRASS_B = C3(94, 178, 74), C3(80, 160, 62)
local DIRT_A, DIRT_B = C3(158, 96, 58), C3(134, 80, 48)
local WOOD = C3(124, 88, 62)

local rng = Random.new(77)
local zone -- { pos, look, right } for rescue()

local function brick(parent, name, size, cf, color, studs, extra)
	local p = Instance.new("Part")
	p.Name = name
	p.Anchored = true
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = M.Plastic
	p.TopSurface = studs and Enum.SurfaceType.Studs or Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	if extra then
		for k, v in extra do
			p[k] = v
		end
	end
	p.Parent = parent
	return p
end

local function deco(extra)
	extra = extra or {}
	extra.CanCollide = false
	extra.CanQuery = false
	extra.CanTouch = false
	return extra
end

local function glow(part, color, range, brightness)
	local l = Instance.new("PointLight")
	l.Color = color
	l.Range = range
	l.Brightness = brightness
	l.Parent = part
end

local function signBoard(parent, cf, size, text, boardColor, textColor)
	local board = brick(parent, "ArenaSign", size, cf, boardColor, false, { CanCollide = false })
	brick(parent, "ArenaSignFrame", size + Vector3.new(0.8, 0.8, 0), cf * CFrame.new(0, 0, 0.2), GOLD, false, { CanCollide = false })
	local gui = Instance.new("SurfaceGui")
	gui.Face = Enum.NormalId.Front
	gui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
	gui.CanvasSize = Vector2.new(size.X * 40, size.Y * 40)
	gui.LightInfluence = 0.15
	gui.Parent = board
	local label = Instance.new("TextLabel")
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBlack
	label.TextScaled = true
	label.TextColor3 = textColor
	label.TextStrokeTransparency = 0.4
	label.Text = text
	label.Parent = gui
	return board
end

--------------------------------------------------------------------------------
-- The spike pit
--------------------------------------------------------------------------------
local function spike(parent, x, z, scale, cf)
	local w = 2.1 * scale
	local h = 1.0 * scale
	local base, tip = C3(142, 154, 190), C3(222, 230, 246)
	local yaw = rng:NextNumber() * math.pi
	local y = 0.5
	for i, ratio in { 1, 0.72, 0.46, 0.22 } do
		brick(parent, "Spike", Vector3.new(w * ratio, h, w * ratio), cf * CFrame.new(x, y + h / 2, z) * CFrame.Angles(0, yaw, 0), base:Lerp(tip, (i - 1) / 3), false, deco({ Material = M.SmoothPlastic }))
		y += h
	end
end

local function pit(parent, cf)
	brick(parent, "PitFloor", Vector3.new(PIT * 2, 1, PIT * 2), cf * CFrame.new(0, 0, 0), C3(34, 42, 82), true)
	-- a darker square under the platform so the pillar looks planted
	local count = 0
	local step = 3.6
	local n = math.floor(PIT * 2 / step)
	for ix = 0, n - 1 do
		for iz = 0, n - 1 do
			local x = -PIT + (ix + 0.5) * step + (rng:NextNumber() - 0.5) * 1.1
			local z = -PIT + (iz + 0.5) * step + (rng:NextNumber() - 0.5) * 1.1
			local underPlatform = math.abs(x) < PLAT + 2.2 and math.abs(z) < PLAT + 2.2
			local underBridge = math.abs(x) < 7 and z < -PLAT
			if not underPlatform and not underBridge then
				spike(parent, x, z, 0.85 + rng:NextNumber() * 0.5, cf)
				count += 1
			end
		end
	end
	-- warning stripes around the inside edge of the pit
	for _, s in { -1, 1 } do
		brick(parent, "PitStripe", Vector3.new(PIT * 2, 0.06, 1.4), cf * CFrame.new(0, 0.53, s * (PIT - 0.8)), YELLOW, false, deco())
		brick(parent, "PitStripe", Vector3.new(1.4, 0.06, PIT * 2), cf * CFrame.new(s * (PIT - 0.8), 0.53, 0), YELLOW, false, deco())
	end
	return count
end

--------------------------------------------------------------------------------
-- The fighting platform
--------------------------------------------------------------------------------
local function platform(parent, cf)
	local size = PLAT * 2 + 1
	brick(parent, "PlatformBase", Vector3.new(size, DECK - 0.4, size), cf * CFrame.new(0, (DECK - 0.4) / 2, 0), NAVY, false)
	brick(parent, "PlatformFoot", Vector3.new(size + 1.6, 0.9, size + 1.6), cf * CFrame.new(0, 0.95, 0), NAVY_L, false)
	brick(parent, "PlatformBand", Vector3.new(size + 0.3, 0.5, size + 0.3), cf * CFrame.new(0, 3.4, 0), NAVY_L, false)
	-- checkered pink deck
	local tile = (PLAT * 2) / 4
	for ix = 0, 3 do
		for iz = 0, 3 do
			brick(parent, "DeckTile", Vector3.new(tile, 0.4, tile), cf * CFrame.new(-PLAT + (ix + 0.5) * tile, DECK - 0.2, -PLAT + (iz + 0.5) * tile), (ix + iz) % 2 == 0 and PINK_A or PINK_B, true)
		end
	end
	-- white rim
	for _, s in { -1, 1 } do
		brick(parent, "DeckRim", Vector3.new(size + 0.2, 0.6, 1.2), cf * CFrame.new(0, DECK - 0.1, s * (PLAT + 0.1)), WHITE, true)
		brick(parent, "DeckRim", Vector3.new(1.2, 0.6, size + 0.2), cf * CFrame.new(s * (PLAT + 0.1), DECK - 0.1, 0), WHITE, true)
	end
	-- centre line and the two starting pads
	brick(parent, "CenterLine", Vector3.new(0.3, 0.06, PLAT * 2), cf * CFrame.new(0, DECK + 0.03, 0), WHITE, false, deco())
	for side, color in { [-1] = C3(60, 214, 176), [1] = C3(255, 128, 150) } do
		local c = cf * CFrame.new(side * 9, DECK + 0.05, 0)
		brick(parent, "StartPad", Vector3.new(9, 0.08, 6), c, color, false, deco({ Material = M.Neon }))
		for _, s in { -1, 1 } do
			brick(parent, "StartPadLine", Vector3.new(9.6, 0.1, 0.3), c * CFrame.new(0, 0.02, s * 3.15), WHITE, false, deco())
			brick(parent, "StartPadLine", Vector3.new(0.3, 0.1, 6.6), c * CFrame.new(s * 4.65, 0.02, 0), WHITE, false, deco())
		end
	end
	-- yellow marker lights on the four sides of the pillar
	for _, s in { -1, 1 } do
		local a = brick(parent, "SideLamp", Vector3.new(1.0, 1.4, 4.6), cf * CFrame.new(s * (PLAT + 1.0), 4.4, 0), YELLOW, false, { Material = M.Neon, CanCollide = false })
		glow(a, YELLOW, 20, 0.9)
		local b = brick(parent, "SideLamp", Vector3.new(4.6, 1.4, 1.0), cf * CFrame.new(0, 4.4, s * (PLAT + 1.0)), YELLOW, false, { Material = M.Neon, CanCollide = false })
		glow(b, YELLOW, 20, 0.9)
	end
	-- corner pylons with glowing tops
	for sx = -1, 1, 2 do
		for sz = -1, 1, 2 do
			local x, z = sx * (PLAT + 1.6), sz * (PLAT + 1.6)
			brick(parent, "Pylon", Vector3.new(1.8, DECK + 2.5, 1.8), cf * CFrame.new(x, (DECK + 2.5) / 2, z), NAVY_L, true)
			brick(parent, "PylonCap", Vector3.new(2.4, 0.7, 2.4), cf * CFrame.new(x, DECK + 2.85, z), GOLD, false)
			local orb = brick(parent, "PylonOrb", Vector3.new(1.6, 1.6, 1.6), cf * CFrame.new(x, DECK + 3.9, z), C3(120, 220, 255), false, { Material = M.Neon, CanCollide = false })
			glow(orb, C3(120, 220, 255), 26, 1.0)
		end
	end
end

--------------------------------------------------------------------------------
-- The way in: gate, staircase, bridge
--------------------------------------------------------------------------------
local function entrance(parent, cf)
	local steps = 8
	local run = 1.6
	local startZ = -PIT - steps * run - 0.2
	for i = 1, steps do
		brick(parent, "Stair", Vector3.new(10, 0.7 * i, run), cf * CFrame.new(0, 0.35 * i, startZ + run * (i - 0.5)), i % 2 == 0 and STONE or STONE_D, true)
		for _, s in { -1, 1 } do
			brick(parent, "StairCurb", Vector3.new(0.9, 0.7 * i + 1.1, run), cf * CFrame.new(s * 5.45, (0.7 * i + 1.1) / 2, startZ + run * (i - 0.5)), NAVY_L, false)
		end
	end
	-- the bridge deck over the spikes
	local z1, z2 = -PIT - 0.1, -PLAT
	local length = z2 - z1
	local mid = (z1 + z2) / 2
	brick(parent, "BridgeDeck", Vector3.new(10, 0.7, math.abs(length)), cf * CFrame.new(0, DECK - 0.35, mid), STONE, true)
	for _, s in { -1, 1 } do
		brick(parent, "BridgeEdge", Vector3.new(0.9, 0.5, math.abs(length)), cf * CFrame.new(s * 5.45, DECK - 0.1, mid), GOLD, false, { CanCollide = false })
		brick(parent, "BridgeRail", Vector3.new(0.4, 0.4, math.abs(length)), cf * CFrame.new(s * 5.45, DECK + 2.2, mid), WHITE, false)
		for z = z1 + 1, z2 - 0.5, 3 do
			brick(parent, "BridgePost", Vector3.new(0.6, 2.4, 0.6), cf * CFrame.new(s * 5.45, DECK + 1.0, z), NAVY_L, false)
		end
	end
	for _, z in { mid - 4, mid + 4 } do
		brick(parent, "BridgePier", Vector3.new(9, DECK - 0.6, 1.8), cf * CFrame.new(0, (DECK - 0.6 + 0.5) / 2, z), NAVY, false)
	end
	-- stone gate with a banner
	local gateZ = startZ - 1.6
	for _, s in { -1, 1 } do
		brick(parent, "GatePillar", Vector3.new(2.4, 10, 2.4), cf * CFrame.new(s * 7.4, 5, gateZ), STONE, true)
		brick(parent, "GateBand", Vector3.new(3, 0.8, 3), cf * CFrame.new(s * 7.4, 2.4, gateZ), NAVY_L, false)
		brick(parent, "GateCap", Vector3.new(3.2, 0.9, 3.2), cf * CFrame.new(s * 7.4, 10.4, gateZ), GOLD, true)
		local flame = brick(parent, "GateTorch", Vector3.new(1.2, 1.6, 1.2), cf * CFrame.new(s * 7.4, 11.7, gateZ), C3(255, 150, 40), false, { Material = M.Neon, CanCollide = false })
		glow(flame, C3(255, 170, 70), 30, 1.1)
	end
	signBoard(parent, cf * CFrame.new(0, 10.6, gateZ), Vector3.new(12.4, 2.6, 0.6), "⚔  RANKED ARENA", NAVY, YELLOW)
	for _, s in { -1, 1 } do
		brick(parent, "GateRope", Vector3.new(0.2, 3, 0.2), cf * CFrame.new(s * 5.4, 9.0, gateZ), C3(80, 80, 90), false, deco())
	end
end

--------------------------------------------------------------------------------
-- Stepped voxel cliffs around the pit (left, right and back), with trees, fences and torches
--------------------------------------------------------------------------------
local function fenceSection(parent, cf, x, y, z, along)
	-- along: "x" runs the rail along x, "z" along z
	local len = 5.4
	local rail = along == "x" and Vector3.new(len, 0.35, 0.35) or Vector3.new(0.35, 0.35, len)
	for _, h in { 1.0, 2.0 } do
		brick(parent, "FenceRail", rail, cf * CFrame.new(x, y + h, z), WOOD, false, deco())
	end
	for _, o in { -len / 2 + 0.3, len / 2 - 0.3 } do
		local px, pz = along == "x" and x + o or x, along == "z" and z + o or z
		brick(parent, "FencePost", Vector3.new(0.6, 2.6, 0.6), cf * CFrame.new(px, y + 1.3, pz), C3(110, 76, 52), false, deco())
	end
end

local function cliffs(parent, cf)
	local count = 0
	local trees = 0
	local coords = {}
	for c = -45, 45, CELL do
		table.insert(coords, c)
	end
	local zs = {}
	for c = -27, 45, CELL do
		table.insert(zs, c)
	end
	for _, x in coords do
		for _, z in zs do
			local outsideX, outsideZ = math.abs(x) > PIT, z > PIT
			if outsideX or outsideZ then
				local dx = outsideX and (math.abs(x) - PIT) / CELL + 0.5 or 0
				local dz = outsideZ and (z - PIT) / CELL + 0.5 or 0
				local d = math.max(dx, dz)
				local level = math.floor(d + 0.5)
				if rng:NextNumber() < 0.24 then
					level += rng:NextNumber() < 0.5 and -1 or 1
				end
				level = math.clamp(level, 1, 4)
				-- keep the wall flat and low behind the sign and banners
				if outsideZ and not outsideX and dz < 1.1 and math.abs(x) <= 21 then
					level = 1
				end
				local h = level * STEP
				local dirt = ((math.floor(x / CELL) + math.floor(z / CELL)) % 2 == 0) and DIRT_A or DIRT_B
				brick(parent, "CliffDirt", Vector3.new(CELL, h - 0.6, CELL), cf * CFrame.new(x, (h - 0.6) / 2, z), dirt, false)
				for band = 1, level - 1 do
					brick(parent, "CliffStrata", Vector3.new(CELL + 0.1, 0.5, CELL + 0.1), cf * CFrame.new(x, band * STEP - 0.4, z), DIRT_B:Lerp(Color3.new(0, 0, 0), 0.18), false, deco())
				end
				brick(parent, "CliffGrass", Vector3.new(CELL + 0.3, 1.2, CELL + 0.3), cf * CFrame.new(x, h - 0.6, z), ((math.floor(x / CELL) * 3 + math.floor(z / CELL)) % 3 == 0) and GRASS_B or GRASS_A, true)
				count += 1
				if level >= 2 then
					local roll = rng:NextNumber()
					local at = cf * CFrame.new(x + (rng:NextNumber() - 0.5) * 2.5, h, z + (rng:NextNumber() - 0.5) * 2.5)
					if roll < 0.2 then
						Island.voxelTree(parent, at.Position, 0.8 + rng:NextNumber() * 0.5)
						trees += 1
					elseif roll < 0.4 then
						Island.pineTree(parent, at.Position, 0.8 + rng:NextNumber() * 0.5)
						trees += 1
					elseif roll < 0.52 then
						fenceSection(parent, cf, x, h, z, rng:NextNumber() < 0.5 and "x" or "z")
					elseif roll < 0.6 then
						Island.rock(parent, at.Position)
					elseif roll < 0.72 then
						Island.flowers(parent, at.Position)
					end
				end
			end
		end
	end
	return count, trees
end

-- Torches high on the cliff faces and the big "RANKED • 1v1" sign on the back wall.
local function wallDetails(parent, cf)
	local board = signBoard(parent, cf * CFrame.new(0, 11, PIT + CELL - 0.35), Vector3.new(24, 3.6, 0.6), "RANKED  •  1v1", NAVY, WHITE)
	glow(board, C3(200, 220, 255), 24, 0.6)
	for _, s in { -1, 1 } do
		-- hanging banners beside the sign
		brick(parent, "WallBanner", Vector3.new(3.2, 8, 0.4), cf * CFrame.new(s * 17, 10.5, PIT + CELL - 0.3), s < 0 and C3(60, 150, 230) or C3(236, 70, 90), false, deco({ Material = M.Fabric }))
		brick(parent, "WallBannerTrim", Vector3.new(3.6, 0.5, 0.5), cf * CFrame.new(s * 17, 14.7, PIT + CELL - 0.3), GOLD, false, deco())
		brick(parent, "WallBannerIcon", Vector3.new(1.6, 1.6, 0.5), cf * CFrame.new(s * 17, 10.5, PIT + CELL - 0.55) * CFrame.Angles(0, 0, math.pi / 4), WHITE, false, deco())
		-- torches on the side walls
		for _, z in { -12, 6, 22 } do
			local x = s * (PIT - 0.4)
			brick(parent, "TorchStick", Vector3.new(0.5, 2.4, 0.5), cf * CFrame.new(x, 4.4, z), C3(90, 62, 44), false, deco())
			local flame = brick(parent, "TorchFlame", Vector3.new(1.1, 1.4, 1.1), cf * CFrame.new(x, 6.0, z), C3(255, 150, 40), false, { Material = M.Neon, CanCollide = false })
			glow(flame, C3(255, 170, 70), 24, 0.9)
		end
	end
end

-- Thin glowing lines high above the cliffs, like the walls of an invisible arena.
local function skyLines(parent, cf)
	local half = PIT + 3 * CELL
	local y = 4 * STEP + 8
	local color = C3(230, 244, 255)
	for _, s in { -1, 1 } do
		brick(parent, "SkyLine", Vector3.new(half * 2, 0.35, 0.35), cf * CFrame.new(0, y, s * half), color, false, deco({ Material = M.Neon, Transparency = 0.35 }))
		brick(parent, "SkyLine", Vector3.new(0.35, 0.35, half * 2), cf * CFrame.new(s * half, y, 0), color, false, deco({ Material = M.Neon, Transparency = 0.35 }))
	end
end

--------------------------------------------------------------------------------
-- Public
--------------------------------------------------------------------------------
-- Remembers where the arena stands (used to rescue players who fall into the pit; also handy for tests).
function RankedArena.setZone(position, look)
	zone = { pos = position, look = Vector3.new(look.X, 0, look.Z), right = Vector3.new(-look.Z, 0, look.X) }
end

-- Builds the arena in the frame `cf` (floor at y = 0, entrance toward -z). Returns the duel info Duels expects.
function RankedArena.build(parent, cf)
	local folder = Instance.new("Folder")
	folder.Name = "RankedArena"
	folder.Parent = parent
	local pos = cf.Position
	RankedArena.setZone(pos, cf.LookVector)
	for _, step in { pit, platform, entrance, cliffs, wallDetails, skyLines } do
		local ok, err = pcall(step, folder, cf)
		if not ok then
			warn("[TrueAdam] ranked arena piece failed:", err)
		end
	end
	return {
		padA = cf * CFrame.new(-9, DECK + 0.1, 0),
		padB = cf * CFrame.new(9, DECK + 0.1, 0),
		center = pos + Vector3.new(0, DECK + 0.1, 0),
	}
end

-- Where players are put back if they fall off the platform into the pit (in front of the gate).
function RankedArena.exitPosition()
	if not zone then
		return nil
	end
	return zone.pos + zone.look * 58 + Vector3.new(0, 3.5, 0)
end

-- True when a position is down in the spike pit (below the platform, inside the walls).
function RankedArena.inPit(position)
	if not zone then
		return false
	end
	local dx, dz = position.X - zone.pos.X, position.Z - zone.pos.Z
	local lx = dx * zone.right.X + dz * zone.right.Z
	local lz = -(dx * zone.look.X + dz * zone.look.Z)
	return math.abs(lx) < PIT + 1.5 and lz > -(PIT + 1.5) and lz < PIT + 1.5 and position.Y < 4.5
end

-- Puts anyone who fell into the pit back at the gate. Returns how many players were moved.
function RankedArena.rescue()
	local moved = 0
	for _, p in Players:GetPlayers() do
		local char = p.Character
		local root = char and char:FindFirstChild("HumanoidRootPart")
		if root and RankedArena.inPit(root.Position) and not p:GetAttribute("InDuel") then
			local exit = RankedArena.exitPosition()
			root.AssemblyLinearVelocity = Vector3.zero
			root.CFrame = CFrame.lookAt(exit, exit + zone.look)
			moved += 1
		end
	end
	return moved
end

return RankedArena
