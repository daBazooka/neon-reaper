-- SUB 5 TO TRUE ADAM: real-looking buildings. A proper shell with a foundation and entrance step, a tiled floor, walls with
-- real windows (frame, mullions, glass, sill, lintel), a framed doorway with fluted columns and a keystone arch, corner
-- quoins, a stepped cornice with dentils, a parapet, and a ceiling with exposed beams and recessed lights.
local Architecture = {}

local M = Enum.Material
local C3 = Color3.fromRGB
local STONE = C3(196, 192, 184)
local DARKSTONE = C3(150, 146, 140)
local FRAME = C3(52, 54, 62)

local function block(parent, name, size, cf, color, material, extra)
	local p = Instance.new("Part")
	p.Name = name
	p.Anchored = true
	p.Size = size
	p.CFrame = cf
	p.Color = color
	p.Material = material or M.SmoothPlastic
	p.TopSurface, p.BottomSurface = Enum.SurfaceType.Smooth, Enum.SurfaceType.Smooth
	if extra then
		for k, v in extra do
			p[k] = v
		end
	end
	p.Parent = parent
	return p
end

local function cylinder(parent, name, length, diameter, cf, color, material)
	-- an upright cylinder centred at cf
	return block(parent, name, Vector3.new(length, diameter, diameter), cf * CFrame.Angles(0, 0, math.pi / 2), color, material, { Shape = Enum.PartType.Cylinder })
end

-- A window set into a wall: frame, mullion cross, glass, sill and lintel. cf is the window centre, looking out of the wall.
local function window(parent, cf, ww, wh, thick, pal)
	local bar = 0.28
	block(parent, "WindowFrameL", Vector3.new(bar, wh, thick * 0.9), cf * CFrame.new(-ww / 2 + bar / 2, 0, 0), FRAME, M.Metal)
	block(parent, "WindowFrameR", Vector3.new(bar, wh, thick * 0.9), cf * CFrame.new(ww / 2 - bar / 2, 0, 0), FRAME, M.Metal)
	block(parent, "WindowFrameT", Vector3.new(ww, bar, thick * 0.9), cf * CFrame.new(0, wh / 2 - bar / 2, 0), FRAME, M.Metal)
	block(parent, "WindowFrameB", Vector3.new(ww, bar, thick * 0.9), cf * CFrame.new(0, -wh / 2 + bar / 2, 0), FRAME, M.Metal)
	block(parent, "MullionV", Vector3.new(0.16, wh - bar, thick * 0.5), cf, FRAME, M.Metal)
	block(parent, "MullionH", Vector3.new(ww - bar, 0.16, thick * 0.5), cf * CFrame.new(0, wh * 0.12, 0), FRAME, M.Metal)
	block(parent, "Glass", Vector3.new(ww - bar, wh - bar, 0.12), cf, C3(170, 210, 235), M.Glass, { Transparency = 0.5, CanCollide = false })
	block(parent, "Sill", Vector3.new(ww + 0.9, 0.34, thick + 0.8), cf * CFrame.new(0, -wh / 2 - 0.1, -0.35), STONE, M.Concrete)
	block(parent, "Lintel", Vector3.new(ww + 0.9, 0.55, thick + 0.4), cf * CFrame.new(0, wh / 2 + 0.28, -0.2), STONE, M.Concrete)
	block(parent, "Keystone", Vector3.new(0.7, 0.8, thick + 0.55), cf * CFrame.new(0, wh / 2 + 0.34, -0.25), DARKSTONE, M.Concrete)
	-- shutters in the building's accent colour
	for side = -1, 1, 2 do
		block(parent, "Shutter", Vector3.new(0.9, wh, 0.2), cf * CFrame.new(side * (ww / 2 + 0.7), 0, -thick * 0.45), pal.accent, M.Wood, { CanCollide = false })
	end
end

-- A wall along local X with a row of windows. cf is the wall's bottom centre, the outside faces local -Z.
local function wall(parent, cf, length, height, thick, pal, windows, ww, sill, wh)
	local lowH = windows and sill or height
	block(parent, "WallLow", Vector3.new(length, lowH, thick), cf * CFrame.new(0, lowH / 2, 0), pal.wall, pal.wallMat)
	-- a stone base course
	block(parent, "BaseCourse", Vector3.new(length + 0.4, 1.1, thick + 0.4), cf * CFrame.new(0, 0.55, -0.1), DARKSTONE, M.Concrete)
	if not windows then
		return
	end
	local highH = height - sill - wh
	block(parent, "WallHigh", Vector3.new(length, highH, thick), cf * CFrame.new(0, sill + wh + highH / 2, 0), pal.wall, pal.wallMat)
	local edge = -length / 2
	for _, x in windows do
		local pier = (x - ww / 2) - edge
		if pier > 0.05 then
			block(parent, "Pier", Vector3.new(pier, wh, thick), cf * CFrame.new(edge + pier / 2, sill + wh / 2, 0), pal.wall, pal.wallMat)
		end
		edge = x + ww / 2
		window(parent, cf * CFrame.new(x, sill + wh / 2, 0), ww, wh, thick, pal)
	end
	local last = length / 2 - edge
	if last > 0.05 then
		block(parent, "Pier", Vector3.new(last, wh, thick), cf * CFrame.new(edge + last / 2, sill + wh / 2, 0), pal.wall, pal.wallMat)
	end
end

local function column(parent, cf, height, pal)
	block(parent, "ColumnPlinth", Vector3.new(2.6, 0.7, 2.6), cf * CFrame.new(0, 0.35, 0), STONE, M.Concrete)
	block(parent, "ColumnBase", Vector3.new(2.2, 0.5, 2.2), cf * CFrame.new(0, 0.95, 0), DARKSTONE, M.Concrete)
	cylinder(parent, "ColumnShaft", height - 2.2, 1.6, cf * CFrame.new(0, 1.2 + (height - 2.2) / 2, 0), C3(236, 234, 228), M.Marble)
	-- flutes: thin ribs around the shaft
	for i = 1, 8 do
		local a = (i / 8) * math.pi * 2
		block(parent, "Flute", Vector3.new(0.12, height - 2.6, 0.12), cf * CFrame.new(math.cos(a) * 0.82, 1.2 + (height - 2.2) / 2, math.sin(a) * 0.82), C3(214, 212, 206), M.Marble, { CanCollide = false })
	end
	block(parent, "CapitalNeck", Vector3.new(1.9, 0.4, 1.9), cf * CFrame.new(0, height - 0.95, 0), DARKSTONE, M.Concrete)
	block(parent, "Capital", Vector3.new(2.7, 0.5, 2.7), cf * CFrame.new(0, height - 0.55, 0), STONE, M.Concrete)
	block(parent, "CapitalTop", Vector3.new(3.1, 0.35, 3.1), cf * CFrame.new(0, height - 0.15, 0), pal.accent, M.SmoothPlastic)
	for side = -1, 1, 2 do
		local scroll = block(parent, "Scroll", Vector3.new(0.7, 0.7, 0.7), cf * CFrame.new(side * 1.25, height - 0.7, 0), STONE, M.Concrete, { Shape = Enum.PartType.Ball })
		scroll.CanCollide = false
	end
end

-- cf: the building frame (floor top at y = 0.9, entrance toward local -Z). pal: wall, wallMat, accent, floorA, floorB, floorMat, roof.
function Architecture.pavilion(parent, cf, pal)
	local W, D = 32, 30 -- footprint
	local H = 12.3 -- wall height above the floor
	local folder = Instance.new("Folder")
	folder.Name = "Shell"
	folder.Parent = parent
	local floorY = 0.9

	-- foundation, floor slab, tiled floor, entrance step
	block(folder, "Foundation", Vector3.new(W + 3, 0.6, D + 3), cf * CFrame.new(0, 0.1, 0), DARKSTONE, M.Concrete)
	block(folder, "Floor", Vector3.new(W, 0.8, D), cf * CFrame.new(0, 0.5, 0), pal.floorB, pal.floorMat)
	for ix = 0, 7 do
		for iz = 0, 6 do
			if (ix + iz) % 2 == 0 then
				block(folder, "Tile", Vector3.new(W / 8 - 0.05, 0.05, D / 7 - 0.05), cf * CFrame.new(-W / 2 + (ix + 0.5) * W / 8, floorY + 0.03, -D / 2 + (iz + 0.5) * D / 7), pal.floorA, pal.floorMat, { CanCollide = false })
			end
		end
	end
	block(folder, "EntryStep", Vector3.new(15, 0.3, 2.4), cf * CFrame.new(0, 0.6, -D / 2 - 1.6), STONE, M.Concrete)

	-- walls: back (plain), sides (3 windows each), front (two shop windows either side of a wide doorway)
	local backCF = cf * CFrame.new(0, floorY, D / 2 + 0.4) * CFrame.Angles(0, math.pi, 0)
	wall(folder, backCF, W + 1.6, H, 0.9, pal, nil)
	for side = -1, 1, 2 do
		local sideCF = cf * CFrame.new(side * (W / 2 + 0.4), floorY, 0) * CFrame.Angles(0, -side * math.pi / 2, 0)
		wall(folder, sideCF, D, H, 0.9, pal, { -9, 0, 9 }, 5.2, 3.4, 5.2)
	end
	local frontZ = -D / 2 - 0.4
	for side = -1, 1, 2 do
		-- front wall segment beside the doorway, with a big shop window
		local segCF = cf * CFrame.new(side * 11.6, floorY, frontZ)
		wall(folder, segCF, 8.8, H, 0.9, pal, { 0 }, 5.4, 3.0, 5.6)
	end
	-- header above the doorway
	block(folder, "DoorHeader", Vector3.new(14.4, H - 8.6, 0.9), cf * CFrame.new(0, floorY + 8.6 + (H - 8.6) / 2, frontZ), pal.wall, pal.wallMat)
	block(folder, "DoorLintel", Vector3.new(15.2, 0.7, 1.3), cf * CFrame.new(0, floorY + 8.6, frontZ - 0.15), STONE, M.Concrete)
	block(folder, "DoorKeystone", Vector3.new(1.4, 1.3, 1.5), cf * CFrame.new(0, floorY + 8.9, frontZ - 0.2), DARKSTONE, M.Concrete)
	-- door posts and the two fluted columns that frame the entrance
	for side = -1, 1, 2 do
		column(folder, cf * CFrame.new(side * 7.6, floorY, frontZ - 1.2), 11.2, pal)
	end

	-- corner quoins (alternating stone blocks up each outside corner)
	for sx = -1, 1, 2 do
		for _, sz in { -1, 1 } do
			for i = 0, 7 do
				local long = i % 2 == 0
				block(folder, "Quoin", Vector3.new(long and 2.2 or 1.6, 1.4, long and 1.6 or 2.2), cf * CFrame.new(sx * (W / 2 + 0.55), floorY + 1.6 + i * 1.45, sz * (D / 2 + 0.55)), STONE, M.Concrete)
			end
		end
	end

	-- stepped cornice with dentils, then the roof, parapet and ceiling
	block(folder, "CorniceLow", Vector3.new(W + 3.4, 0.45, D + 3.4), cf * CFrame.new(0, floorY + H - 0.1, 0), STONE, M.Concrete)
	block(folder, "CorniceHigh", Vector3.new(W + 4.4, 0.4, D + 4.4), cf * CFrame.new(0, floorY + H + 0.3, 0), DARKSTONE, M.Concrete)
	for i = 0, 15 do
		local t = -W / 2 + (i + 0.5) * W / 16
		block(folder, "Dentil", Vector3.new(0.7, 0.45, 0.7), cf * CFrame.new(t, floorY + H - 0.55, -D / 2 - 1.5), STONE, M.Concrete, { CanCollide = false })
		block(folder, "Dentil", Vector3.new(0.7, 0.45, 0.7), cf * CFrame.new(t, floorY + H - 0.55, D / 2 + 1.5), STONE, M.Concrete, { CanCollide = false })
	end
	-- the roof must not make the camera zoom in: it is not collidable (nobody can reach it anyway)
	block(folder, "Roof", Vector3.new(W + 4.6, 1.4, D + 4.6), cf * CFrame.new(0, floorY + H + 1.2, 0), pal.roof, M.Metal, { CanCollide = false })
	for _, edge in { { 0, -(D + 4.6) / 2, W + 4.6, 0.7 }, { 0, (D + 4.6) / 2, W + 4.6, 0.7 } } do
		block(folder, "Parapet", Vector3.new(edge[3], 0.9, edge[4]), cf * CFrame.new(edge[1], floorY + H + 2.3, edge[2]), STONE, M.Concrete, { CanCollide = false })
	end
	for side = -1, 1, 2 do
		block(folder, "Parapet", Vector3.new(0.7, 0.9, D + 4.6), cf * CFrame.new(side * (W + 4.6) / 2, floorY + H + 2.3, 0), STONE, M.Concrete, { CanCollide = false })
	end
	-- ceiling with exposed beams and recessed lights
	block(folder, "Ceiling", Vector3.new(W, 0.4, D), cf * CFrame.new(0, floorY + H - 0.7, 0), C3(236, 232, 224), M.SmoothPlastic, { CanCollide = false })
	for i = -2, 2 do
		block(folder, "Beam", Vector3.new(0.9, 0.9, D), cf * CFrame.new(i * 7, floorY + H - 1.4, 0), C3(98, 70, 50), M.Wood, { CanCollide = false })
	end
	for _, z in { -8, 0, 8 } do
		for _, x in { -10.5, 0, 10.5 } do
			local panel = block(folder, "CeilingLight", Vector3.new(3.2, 0.12, 3.2), cf * CFrame.new(x, floorY + H - 0.95, z), C3(255, 248, 226), M.SmoothPlastic, { CanCollide = false })
			if (x == 0) or (z == 0) then
				local light = Instance.new("PointLight")
				light.Range = 26
				light.Brightness = 0.7
				light.Color = C3(255, 238, 205)
				light.Parent = panel
			end
		end
	end
	return folder
end

return Architecture
