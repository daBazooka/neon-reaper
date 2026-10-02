-- SUB 5 TO TRUE ADAM: the aura around your character grows with every level. More sparks, then flames, a glowing
-- ring on the ground, a light and finally a halo. Colour follows your looks tier. Everyone can see it.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)

local Aura = {}

local TAG = "GlowAuraFx"
local SPARKS = "rbxasset://textures/particles/sparkles_main.dds"
local FIRE = "rbxasset://textures/particles/fire_main.dds"

local function clear(char)
	for _, child in char:GetDescendants() do
		if child.Name == TAG then
			child:Destroy()
		end
	end
end

local function emitter(parent, props)
	local e = Instance.new("ParticleEmitter")
	e.Name = TAG
	e.Speed = NumberRange.new(1, 3)
	e.SpreadAngle = Vector2.new(180, 180)
	e.Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.2), NumberSequenceKeypoint.new(1, 1) })
	for k, v in props do
		e[k] = v
	end
	e.Parent = parent
	return e
end

function Aura.apply(p)
	local char = p.Character
	local profile = Data.get(p)
	local root = char and char:FindFirstChild("HumanoidRootPart")
	if not char or not profile or not root then
		return
	end
	clear(char)
	local level = profile.Level
	local tier = Config.RankFor(level)
	local color = Config.Ranks[tier].Color
	local bright = color:Lerp(Color3.new(1, 1, 1), 0.35)

	-- Layer 1: sparks that rise around you (always on, denser every level)
	emitter(root, {
		Texture = SPARKS,
		Color = ColorSequence.new(bright, color),
		LightEmission = 0.5,
		Rate = math.min(3 + level * 0.1, 70),
		Lifetime = NumberRange.new(1, 1.6),
		Acceleration = Vector3.new(0, 3, 0),
		Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.5 + math.min(level / 100, 2)), NumberSequenceKeypoint.new(1, 0) }),
	})
	-- Layer 2: flames from tier 6 up
	if tier >= 6 then
		emitter(root, {
			Texture = FIRE,
			Color = ColorSequence.new(color, color:Lerp(Color3.new(0, 0, 0), 0.4)),
			LightEmission = 0.7,
			Rate = math.min(4 + (tier - 5) * 2.5, 50),
			Lifetime = NumberRange.new(0.6, 1),
			Speed = NumberRange.new(2, 5),
			SpreadAngle = Vector2.new(25, 25),
			Acceleration = Vector3.new(0, 6, 0),
			Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 1.5 + tier * 0.1), NumberSequenceKeypoint.new(1, 0) }),
		})
	end
	-- Light that gets brighter with the tier
	local light = Instance.new("PointLight")
	light.Name = TAG
	light.Color = color
	light.Brightness = 0.3 + tier * 0.06
	light.Range = 10 + tier * 0.8
	light.Parent = root
	-- Layer 3: a glowing ring on the ground from tier 10 up
	if tier >= 10 then
		local ring = Instance.new("Part")
		ring.Name = TAG
		ring.Shape = Enum.PartType.Cylinder
		ring.Size = Vector3.new(0.2, 5 + tier * 0.25, 5 + tier * 0.25)
		ring.Color = color
		ring.Material = Enum.Material.SmoothPlastic
		ring.Transparency = 0.55
		ring.CanCollide, ring.CanQuery, ring.CanTouch, ring.Massless = false, false, false, true
		ring.CFrame = root.CFrame * CFrame.new(0, -2.9, 0) * CFrame.Angles(0, 0, math.pi / 2)
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = root
		weld.Part1 = ring
		weld.Parent = ring
		ring.Parent = char
	end
	-- Layer 4: a halo above the head from tier 20 up
	local head = char:FindFirstChild("Head")
	if tier >= 20 and head then
		local halo = Instance.new("Part")
		halo.Name = TAG
		halo.Shape = Enum.PartType.Cylinder
		halo.Size = Vector3.new(0.25, 3.2, 3.2)
		halo.Color = Color3.fromRGB(255, 236, 140)
		halo.Material = Enum.Material.SmoothPlastic
		halo.Transparency = 0.15
		halo.CanCollide, halo.CanQuery, halo.CanTouch, halo.Massless = false, false, false, true
		halo.CFrame = head.CFrame * CFrame.new(0, head.Size.Y * 0.5 + 1.4, 0) * CFrame.Angles(0, 0, math.pi / 2)
		local weld = Instance.new("WeldConstraint")
		weld.Part0 = head
		weld.Part1 = halo
		weld.Parent = halo
		halo.Parent = char
	end
end

return Aura
