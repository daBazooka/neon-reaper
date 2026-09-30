-- Builds a dreamling Model out of plain parts: no meshes or uploaded assets needed.
-- The root part is the body; everything else is welded to it, so moving the root moves the dreamling.

local Config = require(script.Parent:WaitForChild("Config"))
local Logic = require(script.Parent:WaitForChild("Logic"))

local Builder = {}

local function rgb(t: {number}): Color3 return Color3.fromRGB(t[1], t[2], t[3]) end
Builder.rgb = rgb

local function part(parent: Instance, props: {[string]: any}): BasePart
	local p: BasePart = Instance.new(props.Class or "Part") :: BasePart
	p.Anchored = false
	p.CanCollide = false
	p.CanQuery = false
	p.CanTouch = false
	p.Massless = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = Enum.Material.SmoothPlastic
	for k, v in props do if k ~= "Class" and k ~= "Mesh" then (p :: any)[k] = v end end
	if props.Mesh then
		local m = Instance.new("SpecialMesh")
		m.MeshType = Enum.MeshType.Sphere
		m.Scale = props.Mesh
		m.Parent = p
	end
	p.Parent = parent
	return p
end

local function weld(a: BasePart, b: BasePart)
	local w = Instance.new("WeldConstraint")
	w.Part0 = a
	w.Part1 = b
	w.Parent = b
end

-- opts.anchored: anchor the root (world dreamlings and jar displays)
-- opts.label: add the floating name tag
-- opts.scale: extra scale on top of the mutation scale
function Builder.build(speciesId: string, mut: string?, opts: {anchored: boolean?, label: boolean?, scale: number?, star: number?}?): Model
	local o = opts or {}
	local sp = Config.SpeciesById[speciesId]
	local rar = Config.RarityById[sp.rarity]
	local model = Instance.new("Model")
	model.Name = sp.name
	local s = sp.size
	local col, col2 = rgb(sp.col), rgb(sp.col2)
	if mut == "golden" then col, col2 = Color3.fromRGB(255, 205, 60), Color3.fromRGB(255, 150, 30) end
	if mut == "galaxy" then col, col2 = Color3.fromRGB(40, 25, 90), Color3.fromRGB(170, 90, 255) end

	local root = part(model, { Name = "Root", Shape = if sp.feat == "square" then Enum.PartType.Block else Enum.PartType.Ball, Size = Vector3.new(s, s, s) * (if sp.feat == "square" then 0.9 else 1), Color = col, Anchored = o.anchored == true, Massless = false })
	if mut == "golden" then root.Material = Enum.Material.Foil end
	if mut == "galaxy" then root.Material = Enum.Material.Neon end
	model.PrimaryPart = root
	local cf = root.CFrame
	local function add(props: {[string]: any}, offset: CFrame): BasePart
		local p = part(model, props)
		p.CFrame = cf * offset
		weld(root, p)
		return p
	end

	-- belly shine and face (front is -Z)
	add({ Name = "Shine", Shape = Enum.PartType.Ball, Size = Vector3.one * s * 0.28, Color = Color3.new(1, 1, 1), Transparency = 0.45 }, CFrame.new(-s * 0.2, s * 0.28, -s * 0.3))
	for _, side in {-1, 1} do
		add({ Name = "Eye", Shape = Enum.PartType.Ball, Size = Vector3.one * s * 0.3, Color = Color3.new(1, 1, 1) }, CFrame.new(side * s * 0.2, s * 0.08, -s * 0.38))
		add({ Name = "Pupil", Shape = Enum.PartType.Ball, Size = Vector3.one * s * 0.16, Color = Color3.fromRGB(25, 15, 45) }, CFrame.new(side * s * 0.2, s * 0.06, -s * 0.5))
		add({ Name = "Glint", Shape = Enum.PartType.Ball, Size = Vector3.one * s * 0.06, Color = Color3.new(1, 1, 1), Material = Enum.Material.Neon }, CFrame.new(side * s * 0.2 + s * 0.04, s * 0.11, -s * 0.57))
		add({ Name = "Cheek", Color = Color3.fromRGB(255, 120, 160), Size = Vector3.new(s * 0.2, s * 0.1, s * 0.05), Mesh = Vector3.one, Transparency = 0.2 }, CFrame.new(side * s * 0.33, -s * 0.1, -s * 0.4))
	end
	add({ Name = "Mouth", Color = Color3.fromRGB(90, 20, 50), Size = Vector3.new(s * 0.16, s * 0.08, s * 0.05), Mesh = Vector3.one }, CFrame.new(0, -s * 0.12, -s * 0.47))

	local f = sp.feat
	local dark = col2
	if f == "leaf" or f == "sprout" then
		add({ Name = "Stem", Shape = Enum.PartType.Cylinder, Size = Vector3.new(s * 0.3, s * 0.07, s * 0.07), Color = Color3.fromRGB(70, 150, 60) }, CFrame.new(0, s * 0.55, 0) * CFrame.Angles(0, 0, math.pi / 2))
		local sides: {number} = if f == "leaf" then {1} else {-1, 1}
		for _, side in sides do
			add({ Name = "Leaf", Color = Color3.fromRGB(110, 220, 90), Size = Vector3.new(s * 0.45, s * 0.12, s * 0.25), Mesh = Vector3.one }, CFrame.new(side * s * 0.18, s * 0.72, 0) * CFrame.Angles(0, 0, side * 0.5))
		end
	elseif f == "antenna" then
		add({ Name = "Stalk", Shape = Enum.PartType.Cylinder, Size = Vector3.new(s * 0.5, s * 0.06, s * 0.06), Color = dark }, CFrame.new(0, s * 0.68, 0) * CFrame.Angles(0, 0, math.pi / 2))
		local bulb = add({ Name = "Bulb", Shape = Enum.PartType.Ball, Size = Vector3.one * s * 0.22, Color = Color3.fromRGB(255, 245, 150), Material = Enum.Material.Neon }, CFrame.new(0, s * 0.95, 0))
		local l = Instance.new("PointLight"); l.Color = bulb.Color; l.Range = 8; l.Brightness = 1.5; l.Parent = bulb
	elseif f == "bunny" then
		for _, side in {-1, 1} do
			add({ Name = "Ear", Color = col, Size = Vector3.new(s * 0.22, s * 0.7, s * 0.16), Mesh = Vector3.one }, CFrame.new(side * s * 0.2, s * 0.72, 0) * CFrame.Angles(0, 0, -side * 0.18))
			add({ Name = "EarIn", Color = Color3.fromRGB(255, 190, 220), Size = Vector3.new(s * 0.1, s * 0.5, s * 0.1), Mesh = Vector3.one }, CFrame.new(side * s * 0.2, s * 0.72, -s * 0.05) * CFrame.Angles(0, 0, -side * 0.18))
		end
	elseif f == "cat" then
		for _, side in {-1, 1} do
			add({ Class = "WedgePart", Name = "Ear", Color = dark, Size = Vector3.new(s * 0.08, s * 0.35, s * 0.3) }, CFrame.new(side * s * 0.28, s * 0.5, 0) * CFrame.Angles(0, math.pi / 2 * side, -side * 0.35))
		end
	elseif f == "horns" then
		for _, side in {-1, 1} do
			add({ Name = "Horn", Shape = Enum.PartType.Cylinder, Size = Vector3.new(s * 0.4, s * 0.1, s * 0.1), Color = Color3.fromRGB(255, 245, 225) }, CFrame.new(side * s * 0.28, s * 0.55, 0) * CFrame.Angles(0, 0, math.pi / 2 - side * 0.5))
		end
	elseif f == "spikes" then
		for i = 0, 5 do
			local a = i / 6 * math.pi * 2
			add({ Name = "Spike", Color = dark, Size = Vector3.one * s * 0.22, Material = Enum.Material.Glass, Transparency = 0.1 }, CFrame.new(math.cos(a) * s * 0.35, s * 0.4, math.sin(a) * s * 0.35) * CFrame.Angles(math.pi / 4, a, math.pi / 4))
		end
	elseif f == "drip" then
		for i, x in {-0.25, 0.05, 0.3} do
			add({ Name = "Drip", Shape = Enum.PartType.Ball, Size = Vector3.one * s * (0.16 + i * 0.03), Color = dark, Transparency = 0.15 }, CFrame.new(x * s, -s * 0.5, -s * 0.1))
		end
	elseif f == "cloud" then
		for i = 0, 5 do
			local a = i / 6 * math.pi * 2
			add({ Name = "Puff", Shape = Enum.PartType.Ball, Size = Vector3.one * s * 0.55, Color = col }, CFrame.new(math.cos(a) * s * 0.42, math.sin(i) * s * 0.1, math.sin(a) * s * 0.42))
		end
	elseif f == "wings" then
		for _, side in {-1, 1} do
			add({ Name = "Wing", Color = dark, Size = Vector3.new(s * 0.9, s * 0.1, s * 0.55), Mesh = Vector3.one, Material = Enum.Material.Neon, Transparency = 0.15 }, CFrame.new(side * s * 0.75, s * 0.15, s * 0.05) * CFrame.Angles(0, 0, side * 0.35))
		end
	elseif f == "halo" then
		for i = 0, 11 do
			local a = i / 12 * math.pi * 2
			add({ Name = "Halo", Shape = Enum.PartType.Ball, Size = Vector3.one * s * 0.1, Color = Color3.fromRGB(255, 240, 150), Material = Enum.Material.Neon }, CFrame.new(math.cos(a) * s * 0.36, s * 0.72, math.sin(a) * s * 0.36))
		end
	elseif f == "crown" then
		add({ Name = "Band", Shape = Enum.PartType.Cylinder, Size = Vector3.new(s * 0.14, s * 0.62, s * 0.62), Color = Color3.fromRGB(255, 200, 50), Material = Enum.Material.Foil }, CFrame.new(0, s * 0.48, 0) * CFrame.Angles(0, 0, math.pi / 2))
		for i = 0, 4 do
			local a = i / 5 * math.pi * 2
			add({ Name = "Point", Color = Color3.fromRGB(255, 210, 60), Size = Vector3.one * s * 0.14, Material = Enum.Material.Foil }, CFrame.new(math.cos(a) * s * 0.26, s * 0.62, math.sin(a) * s * 0.26) * CFrame.Angles(math.pi / 4, a, math.pi / 4))
		end
		add({ Name = "Gem", Shape = Enum.PartType.Ball, Size = Vector3.one * s * 0.12, Color = Color3.fromRGB(255, 60, 120), Material = Enum.Material.Neon }, CFrame.new(0, s * 0.5, -s * 0.31))
	end

	-- rarity glow and aura
	if rar.order >= 3 or mut then
		local light = Instance.new("PointLight")
		light.Color = if mut == "golden" then Color3.fromRGB(255, 210, 90) else rgb(rar.color)
		light.Range = 6 + rar.order * 2
		light.Brightness = 1 + rar.order * 0.3
		light.Parent = root
	end
	if rar.order >= 4 or mut == "rainbow" or mut == "galaxy" or mut == "disco" then
		local pe = Instance.new("ParticleEmitter")
		pe.Color = ColorSequence.new(rgb(rar.color), Color3.new(1, 1, 1))
		pe.LightEmission = 1
		pe.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, s * 0.18), NumberSequenceKeypoint.new(1, 0) })
		pe.Transparency = NumberSequence.new(0.2, 1)
		pe.Lifetime = NumberRange.new(0.8, 1.6)
		pe.Speed = NumberRange.new(1, 3)
		pe.SpreadAngle = Vector2.new(180, 180)
		pe.Rate = 4 + rar.order * 4
		if mut == "galaxy" then pe.Color = ColorSequence.new(Color3.fromRGB(200, 170, 255), Color3.new(1, 1, 1)); pe.Rate = 30 end
		pe.Parent = root
	end
	if mut == "golden" then
		local sp2 = Instance.new("Sparkles"); sp2.SparkleColor = Color3.fromRGB(255, 220, 90); sp2.Parent = root
	end
	if mut == "rainbow" then model:SetAttribute("Rainbow", true) end
	if mut == "disco" then
		model:SetAttribute("Disco", true)
		root.Material = Enum.Material.Neon
	end
	model:SetAttribute("Species", speciesId)
	model:SetAttribute("Mutation", mut or "")

	-- floating name tag
	if o.label then
		local bb = Instance.new("BillboardGui")
		bb.Name = "Tag"
		bb.Size = UDim2.fromOffset(220, 64)
		bb.StudsOffsetWorldSpace = Vector3.new(0, s * 0.85 + 1.8, 0)
		bb.MaxDistance = if rar.order >= 5 then 600 else 110
		bb.LightInfluence = 0
		bb.Adornee = root
		local function lbl(y: number, h: number, txt: string, color: Color3, bold: boolean)
			local t = Instance.new("TextLabel")
			t.BackgroundTransparency = 1
			t.Size = UDim2.new(1, 0, 0, h)
			t.Position = UDim2.fromOffset(0, y)
			t.Font = if bold then Enum.Font.FredokaOne else Enum.Font.GothamBold
			t.TextScaled = true
			t.Text = txt
			t.TextColor3 = color
			t.TextStrokeTransparency = 0.2
			t.TextStrokeColor3 = Color3.fromRGB(20, 10, 40)
			t.Parent = bb
			return t
		end
		local mutName = if mut then Config.MutationById[mut].name .. " " else ""
		lbl(0, 26, mutName .. sp.name, if mut == "golden" then Color3.fromRGB(255, 210, 70) else Color3.new(1, 1, 1), true)
		lbl(26, 18, string.upper(rar.name), rgb(rar.color), false).Name = "Rarity"
		lbl(44, 18, "+" .. Logic.fmt(Logic.jarIncome({ id = speciesId, mut = mut, star = 1 })) .. " /s", Color3.fromRGB(255, 240, 150), false)
		bb.Parent = root
	end

	local scale = (o.scale or 1) * (if mut == "giant" then 2 else if mut == "tiny" then 0.55 else 1)
	if scale ~= 1 then model:ScaleTo(scale) end
	return model
end

return Builder
