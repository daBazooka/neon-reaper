-- Builds the whole world in code when the server starts: dreamy lighting, the floating Dream Meadow,
-- eight floating home islands with jars, rainbow bridges and sky decorations.

local Lighting = game:GetService("Lighting")
local Config = require(game:GetService("ReplicatedStorage"):WaitForChild("Shared"):WaitForChild("Config"))

local World = {}

local rng = Random.new(20260930)
local function part(parent: Instance, props: {[string]: any}): BasePart
	local p: BasePart = Instance.new(props.Class or "Part") :: BasePart
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = Enum.Material.SmoothPlastic
	for k, v in props do if k ~= "Class" then (p :: any)[k] = v end end
	p.Parent = parent
	return p
end
World.part = part

local function hsv(h: number, s: number, v: number): Color3 return Color3.fromHSV(h % 1, s, v) end

local function setupLighting()
	Lighting.ClockTime = 14.5
	Lighting.Brightness = 2.2
	Lighting.Ambient = Color3.fromRGB(120, 100, 160)
	Lighting.OutdoorAmbient = Color3.fromRGB(175, 150, 205)
	Lighting.EnvironmentDiffuseScale = 0.5
	Lighting.EnvironmentSpecularScale = 0.6
	Lighting.GlobalShadows = true
	for _, c in Lighting:GetChildren() do c:Destroy() end
	local atm = Instance.new("Atmosphere")
	atm.Density = 0.28; atm.Offset = 0.1; atm.Color = Color3.fromRGB(255, 205, 240); atm.Decay = Color3.fromRGB(150, 110, 255); atm.Glare = 0.3; atm.Haze = 1.4
	atm.Parent = Lighting
	local bloom = Instance.new("BloomEffect"); bloom.Intensity = 0.7; bloom.Size = 30; bloom.Threshold = 1.3; bloom.Parent = Lighting
	local cc = Instance.new("ColorCorrectionEffect"); cc.Name = "DreamColor"; cc.Saturation = 0.18; cc.Contrast = 0.06; cc.TintColor = Color3.fromRGB(255, 245, 255); cc.Parent = Lighting
	local rays = Instance.new("SunRaysEffect"); rays.Intensity = 0.08; rays.Spread = 0.8; rays.Parent = Lighting
	local sky = Instance.new("Sky"); sky.CelestialBodiesShown = true; sky.StarCount = 3000; sky.Parent = Lighting
	local clouds = workspace.Terrain:FindFirstChildOfClass("Clouds") or Instance.new("Clouds")
	clouds.Cover = 0.5; clouds.Density = 0.55; clouds.Color = Color3.fromRGB(255, 225, 250)
	clouds.Parent = workspace.Terrain
end

-- a floating island: a grassy disc with rocky layers hanging underneath
local function island(parent: Instance, center: Vector3, radius: number, top: Color3, rock: Color3)
	part(parent, { Name = "Top", Shape = Enum.PartType.Cylinder, Size = Vector3.new(6, radius * 2, radius * 2), CFrame = CFrame.new(center - Vector3.new(0, 3, 0)) * CFrame.Angles(0, 0, math.pi / 2), Color = top, Material = Enum.Material.Grass })
	local r, y = radius * 0.92, -6
	for i = 1, 5 do
		part(parent, { Name = "Rock", Shape = Enum.PartType.Cylinder, Size = Vector3.new(7, r * 2, r * 2), CFrame = CFrame.new(center + Vector3.new(0, y - 3.5, 0)) * CFrame.Angles(0, 0, math.pi / 2), Color = rock:Lerp(Color3.new(0, 0, 0), i * 0.06), Material = Enum.Material.Slate, CanCollide = i == 1 })
		y -= 7; r *= 0.72
	end
	local tip = part(parent, { Name = "Crystal", Size = Vector3.new(3, 9, 3), CFrame = CFrame.new(center + Vector3.new(0, y - 2, 0)) * CFrame.Angles(0, math.pi / 4, 0), Color = hsv(rng:NextNumber(), 0.5, 1), Material = Enum.Material.Neon, CanCollide = false })
	local l = Instance.new("PointLight"); l.Color = tip.Color; l.Range = 18; l.Brightness = 2; l.Parent = tip
end

local function candyTree(parent: Instance, pos: Vector3, h: number, hue: number)
	part(parent, { Name = "Trunk", Shape = Enum.PartType.Cylinder, Size = Vector3.new(h, 1.6, 1.6), CFrame = CFrame.new(pos + Vector3.new(0, h / 2, 0)) * CFrame.Angles(0, 0, math.pi / 2), Color = Color3.fromRGB(255, 240, 230), Material = Enum.Material.SmoothPlastic })
	for i = 1, 3 do
		local off = Vector3.new(rng:NextNumber(-2, 2), h + (i - 1) * 2.2, rng:NextNumber(-2, 2))
		part(parent, { Name = "Fluff", Shape = Enum.PartType.Ball, Size = Vector3.one * (7 - i * 1.3), CFrame = CFrame.new(pos + off), Color = hsv(hue + i * 0.03, 0.35, 1), CanCollide = false })
	end
end

local function flowers(parent: Instance, center: Vector3, radius: number, n: number, avoid: number)
	for _ = 1, n do
		local a, d = rng:NextNumber(0, math.pi * 2), rng:NextNumber(avoid, radius)
		local p = center + Vector3.new(math.cos(a) * d, 0.35, math.sin(a) * d)
		part(parent, { Name = "Flower", Shape = Enum.PartType.Ball, Size = Vector3.one * rng:NextNumber(0.6, 1.2), CFrame = CFrame.new(p), Color = hsv(rng:NextNumber(), 0.55, 1), Material = Enum.Material.Neon, CanCollide = false, CastShadow = false })
	end
end

local function signGui(p: BasePart, text: string, color: Color3): TextLabel
	local sg = Instance.new("SurfaceGui")
	sg.Face = Enum.NormalId.Front
	sg.CanvasSize = Vector2.new(600, 200)
	sg.LightInfluence = 0
	sg.Parent = p
	local t = Instance.new("TextLabel")
	t.Size = UDim2.fromScale(1, 1)
	t.BackgroundTransparency = 1
	t.Font = Enum.Font.FredokaOne
	t.TextScaled = true
	t.Text = text
	t.TextColor3 = color
	t.TextStrokeTransparency = 0
	t.TextStrokeColor3 = Color3.fromRGB(40, 20, 70)
	t.Parent = sg
	return t
end

export type Plot = { index: number, center: Vector3, cf: CFrame, slots: {CFrame}, slotParts: {BasePart}, pad: BasePart, sign: TextLabel, income: TextLabel, folder: Folder, jarFolder: Folder, color: Color3 }

function World.build(): {Plot}
	setupLighting()
	local map = Instance.new("Folder"); map.Name = "DreamWorld"; map.Parent = workspace

	-- Dream Meadow
	local R = Config.MeadowRadius
	island(map, Vector3.zero, R + 15, Color3.fromRGB(165, 235, 180), Color3.fromRGB(150, 120, 200))
	flowers(map, Vector3.zero, R + 10, 260, 18)
	for i = 1, 26 do
		local a, d = rng:NextNumber(0, math.pi * 2), rng:NextNumber(35, R + 5)
		candyTree(map, Vector3.new(math.cos(a) * d, 0, math.sin(a) * d), rng:NextNumber(6, 11), rng:NextNumber())
	end
	-- the Dream Tree in the middle
	part(map, { Name = "DreamTrunk", Shape = Enum.PartType.Cylinder, Size = Vector3.new(26, 7, 7), CFrame = CFrame.new(0, 13, 0) * CFrame.Angles(0, 0, math.pi / 2), Color = Color3.fromRGB(200, 170, 255) })
	for i = 1, 7 do
		local a = i / 7 * math.pi * 2
		part(map, { Name = "DreamLeaves", Shape = Enum.PartType.Ball, Size = Vector3.one * rng:NextNumber(12, 17), CFrame = CFrame.new(math.cos(a) * 8, 27 + rng:NextNumber(-2, 4), math.sin(a) * 8), Color = hsv(0.85 + i * 0.03, 0.35, 1), CanCollide = false })
	end
	for i = 1, 30 do
		local a = rng:NextNumber(0, math.pi * 2)
		local b = part(map, { Name = "FairyLight", Shape = Enum.PartType.Ball, Size = Vector3.one * 0.9, CFrame = CFrame.new(math.cos(a) * rng:NextNumber(9, 15), rng:NextNumber(20, 34), math.sin(a) * rng:NextNumber(9, 15)), Color = hsv(i / 30, 0.4, 1), Material = Enum.Material.Neon, CanCollide = false, CastShadow = false })
		if i % 5 == 0 then local l = Instance.new("PointLight"); l.Color = b.Color; l.Range = 14; l.Parent = b end
	end
	local spawn = Instance.new("SpawnLocation")
	spawn.Anchored = true; spawn.Size = Vector3.new(12, 1, 12); spawn.CFrame = CFrame.new(0, 0.5, 22); spawn.Neutral = true
	spawn.Material = Enum.Material.Neon; spawn.Color = Color3.fromRGB(255, 200, 240); spawn.Transparency = 0.3; spawn.Duration = 0
	spawn.Parent = map

	-- sky decorations
	local sky = Instance.new("Folder"); sky.Name = "Sky"; sky.Parent = map
	for i = 1, 14 do
		local a = i / 14 * math.pi * 2 + rng:NextNumber(-0.2, 0.2)
		local d = rng:NextNumber(420, 700)
		island(sky, Vector3.new(math.cos(a) * d, rng:NextNumber(-60, 160), math.sin(a) * d), rng:NextNumber(18, 40), hsv(rng:NextNumber(), 0.3, 1), hsv(rng:NextNumber(), 0.3, 0.7))
	end
	local moon = part(sky, { Name = "DreamMoon", Shape = Enum.PartType.Ball, Size = Vector3.one * 160, CFrame = CFrame.new(-600, 420, -900), Color = Color3.fromRGB(255, 225, 250), Material = Enum.Material.Neon, CanCollide = false, CastShadow = false })
	local ml = Instance.new("PointLight"); ml.Range = 60; ml.Brightness = 0.5; ml.Parent = moon
	for i = 1, 5 do
		part(sky, { Name = "Ring", Shape = Enum.PartType.Cylinder, Size = Vector3.new(1.5, 240 + i * 50, 240 + i * 50), CFrame = CFrame.new(-600, 420, -900) * CFrame.Angles(0.4, 0.2, math.pi / 2 + 0.3), Color = hsv(i / 5, 0.5, 1), Material = Enum.Material.Neon, Transparency = 0.82, CanCollide = false, CastShadow = false })
	end

	-- home islands
	local plots: {Plot} = {}
	local PR = Config.PlotRadius
	local plotFolder = Instance.new("Folder"); plotFolder.Name = "Plots"; plotFolder.Parent = workspace
	for i = 1, Config.PlotCount do
		local a = (i - 1) / Config.PlotCount * math.pi * 2
		local center = Vector3.new(math.cos(a) * PR, 0, math.sin(a) * PR)
		local cf = CFrame.lookAt(center, Vector3.new(0, 0, 0))
		local hue = (i - 1) / Config.PlotCount
		local color = hsv(hue, 0.45, 1)
		local folder = Instance.new("Folder"); folder.Name = "Plot" .. i; folder.Parent = plotFolder
		island(folder, center, 30, hsv(hue, 0.22, 0.98), hsv(hue, 0.35, 0.75))
		-- rainbow bridge to the meadow
		local from = center + (Vector3.zero - center).Unit * 29
		local to = (center).Unit * (R + 12)
		local seg = 7
		for k = 0, seg - 1 do
			local p0 = from:Lerp(to, k / seg)
			local p1 = from:Lerp(to, (k + 1) / seg)
			local mid = (p0 + p1) / 2
			part(folder, { Name = "Bridge", Size = Vector3.new(10, 1.2, (p1 - p0).Magnitude + 0.2), CFrame = CFrame.lookAt(mid - Vector3.new(0, 0.6, 0), p1 - Vector3.new(0, 0.6, 0)), Color = hsv(k / seg, 0.55, 1), Material = Enum.Material.Neon, Transparency = 0.15 })
		end
		-- jar slots: a 4 x 4 grid behind the collect pad
		local slots: {CFrame} = {}
		local slotParts: {BasePart} = {}
		local n = 0
		for row = 0, 3 do
			for colI = 0, 3 do
				n += 1
				-- cf looks at the meadow (-Z points toward it), so +Z is the far side where the jars sit
				local scf = cf * CFrame.new((colI - 1.5) * 10, 0, -6 + row * 8.5)
				table.insert(slots, scf + Vector3.new(0, 1, 0))
				local ped = part(folder, { Name = "Pedestal" .. n, Shape = Enum.PartType.Cylinder, Size = Vector3.new(1, 7, 7), CFrame = CFrame.new(scf.Position + Vector3.new(0, 0.5, 0)) * CFrame.Angles(0, 0, math.pi / 2), Color = Color3.fromRGB(255, 255, 255), Material = Enum.Material.Marble })
				table.insert(slotParts, ped)
			end
		end
		-- collect pad near the bridge
		local padPos = (cf * CFrame.new(0, 0.2, -18)).Position
		local pad = part(folder, { Name = "CollectPad", Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.6, 9, 9), CFrame = CFrame.new(padPos) * CFrame.Angles(0, 0, math.pi / 2), Color = Color3.fromRGB(255, 225, 90), Material = Enum.Material.Neon })
		local pl = Instance.new("PointLight"); pl.Color = pad.Color; pl.Range = 14; pl.Brightness = 2; pl.Parent = pad
		local bb = Instance.new("BillboardGui"); bb.Size = UDim2.fromOffset(200, 60); bb.StudsOffset = Vector3.new(0, 4, 0); bb.MaxDistance = 90; bb.LightInfluence = 0; bb.Parent = pad
		local income = Instance.new("TextLabel"); income.Size = UDim2.fromScale(1, 1); income.BackgroundTransparency = 1; income.Font = Enum.Font.FredokaOne; income.TextScaled = true
		income.TextColor3 = Color3.fromRGB(255, 240, 150); income.TextStrokeTransparency = 0; income.Text = "COLLECT"; income.Parent = bb
		-- name sign at the back
		local back = cf * CFrame.new(0, 7, 27)
		local board = part(folder, { Name = "Sign", Size = Vector3.new(22, 7, 1), CFrame = CFrame.lookAt(back.Position, center + Vector3.new(0, 7, 0)), Color = color, Material = Enum.Material.SmoothPlastic })
		part(folder, { Name = "Post", Size = Vector3.new(1.2, 7, 1.2), CFrame = CFrame.new(back.Position - Vector3.new(0, 6, 0)), Color = Color3.fromRGB(255, 255, 255) })
		local sign = signGui(board, "Empty island", Color3.new(1, 1, 1))
		local jarFolder = Instance.new("Folder"); jarFolder.Name = "Jars"; jarFolder.Parent = folder
		table.insert(plots, { index = i, center = center, cf = cf, slots = slots, slotParts = slotParts, pad = pad, sign = sign, income = income, folder = folder, jarFolder = jarFolder, color = color })
	end

	-- the leaderboard stand in the meadow
	local lb = part(map, { Name = "Leaderboard", Size = Vector3.new(18, 22, 1), CFrame = CFrame.lookAt(Vector3.new(-30, 11, 30), Vector3.new(0, 11, 0)), Color = Color3.fromRGB(60, 30, 110), Material = Enum.Material.SmoothPlastic })
	lb:SetAttribute("IsLeaderboard", true)
	return plots
end

-- a random point on the meadow for a new dreamling (keeps clear of the Dream Tree)
function World.randomMeadowPoint(): Vector3
	local a = rng:NextNumber(0, math.pi * 2)
	local d = math.sqrt(rng:NextNumber(0.03, 1)) * (Config.MeadowRadius - 6) + 6
	if d < 18 then d = 18 end
	return Vector3.new(math.cos(a) * d, 0, math.sin(a) * d)
end

return World
