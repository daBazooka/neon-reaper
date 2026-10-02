-- SUB 5 TO TRUE ADAM: your character's body changes as you level. Level 1 is a short, wide,
-- big-headed gag character; by level 1000 you're tall and athletic. It's all cartoon-style
-- body scaling, no skin or face changes.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Genome = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Genome"))

local Appearance = {}

local onChanged -- set by Main so accessories can be rebuilt at the new size

-- The scale numbers for this player: the level's look, nudged by their personal body genome.
function Appearance.scalesFor(p)
	local profile = Data.get(p)
	local level = profile and profile.Level or 1
	local s = Config.AppearanceScales(level)
	local g = Genome.get(p.UserId)
	return {
		BodyHeightScale = s.BodyHeightScale * g.height,
		BodyWidthScale = s.BodyWidthScale * g.width,
		BodyDepthScale = s.BodyDepthScale * g.depth,
		HeadScale = s.HeadScale * g.head,
		BodyTypeScale = s.BodyTypeScale,
		BodyProportionScale = s.BodyProportionScale,
	}
end

function Appearance.setHook(fn)
	onChanged = fn
end

local SCALE_VALUES = { "BodyHeightScale", "BodyWidthScale", "BodyDepthScale", "HeadScale", "BodyTypeScale", "BodyProportionScale" }

-- The head's unscaled ("nominal") size, so accessories fit no matter how big the head currently is.
local function nominalHead(char)
	local head = char and char:FindFirstChild("Head")
	if not head then
		return Vector3.new(2, 1, 1)
	end
	local hum = char:FindFirstChildOfClass("Humanoid")
	local scaleValue = hum and hum:FindFirstChild("HeadScale")
	local current = (scaleValue and scaleValue:IsA("NumberValue") and scaleValue.Value) or 1
	if current <= 0 then
		current = 1
	end
	return head.Size / current
end

-- Target head size (after the level's scaling). Used to place face features.
function Appearance.headDims(p)
	local hum = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
	if hum and hum.RigType == Enum.HumanoidRigType.R15 then
		return nominalHead(p.Character) * Appearance.scalesFor(p).HeadScale
	end
	local head = p.Character and p.Character:FindFirstChild("Head")
	return head and head.Size or Vector3.new(2, 1, 1)
end

-- Target torso size (R15 upper torso is about 2 x 1.6 x 1 before scaling).
function Appearance.torsoDims(p)
	local hum = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
	if hum and hum.RigType == Enum.HumanoidRigType.R15 then
		local s = Appearance.scalesFor(p)
		return Vector3.new(2 * s.BodyWidthScale, 1.6 * s.BodyHeightScale, 1 * s.BodyDepthScale)
	end
	local torso = p.Character and p.Character:FindFirstChild("Torso")
	return torso and torso.Size or Vector3.new(2, 2, 1)
end

-- Scale numbers accessories should use for this player (so hats and wings fit the body).
-- Accessories are designed for a head about 2 studs wide.
function Appearance.accessoryScales(p)
	local s = Appearance.scalesFor(p)
	local hum = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
	if hum and hum.RigType == Enum.HumanoidRigType.R15 then
		local nominal = nominalHead(p.Character)
		return s.HeadScale * nominal.X / 2, (s.BodyHeightScale + s.BodyWidthScale) / 2
	end
	local scale = p.Character and p.Character:GetScale() or 1
	return scale, scale
end

function Appearance.update(p, instant)
	local profile = Data.get(p)
	local char = p.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	if not profile or not hum then
		return
	end
	local target = Appearance.scalesFor(p)

	-- Skin tone also improves with every level.
	local colors = char:FindFirstChildOfClass("BodyColors")
	if colors then
		local tone = Genome.skin(Config.SkinTone(profile.Level), Genome.get(p.UserId))
		colors.HeadColor3 = tone
		colors.TorsoColor3 = tone
		colors.LeftArmColor3 = tone
		colors.RightArmColor3 = tone
	end

	if hum.RigType == Enum.HumanoidRigType.R15 then
		for _, name in SCALE_VALUES do
			local value = hum:FindFirstChild(name)
			if value and value:IsA("NumberValue") then
				if instant then
					value.Value = target[name]
				else
					TweenService:Create(value, TweenInfo.new(0.9, Enum.EasingStyle.Quad), { Value = target[name] }):Play()
				end
			end
		end
	else
		-- R6 characters can only be scaled evenly.
		local uniform = (target.BodyHeightScale + target.BodyWidthScale) / 2
		pcall(function()
			char:ScaleTo(uniform)
		end)
	end
	if onChanged then
		onChanged(p)
	end
end

function Appearance.onCharacter(p)
	local char = p.Character
	local hum = char and char:WaitForChild("Humanoid", 5)
	if hum and hum.RigType == Enum.HumanoidRigType.R15 then
		-- Wait for the scale values to exist before setting them.
		for _, name in SCALE_VALUES do
			hum:WaitForChild(name, 3)
		end
	end
	Appearance.update(p, true)
end

return Appearance
