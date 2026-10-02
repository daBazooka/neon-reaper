-- SUB 5 TO TRUE ADAM: your character's body changes as you level. Level 1 is a short, wide,
-- big-headed gag character; by level 1000 you're tall and athletic. It's all cartoon-style
-- body scaling, no skin or face changes.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)

local Appearance = {}

local onChanged -- set by Main so accessories can be rebuilt at the new size

function Appearance.setHook(fn)
	onChanged = fn
end

local SCALE_VALUES = { "BodyHeightScale", "BodyWidthScale", "BodyDepthScale", "HeadScale", "BodyTypeScale", "BodyProportionScale" }

-- Scale numbers accessories should use for this player (so hats and wings fit the body).
function Appearance.accessoryScales(p)
	local profile = Data.get(p)
	local level = profile and profile.Level or 1
	local s = Config.AppearanceScales(level)
	local hum = p.Character and p.Character:FindFirstChildOfClass("Humanoid")
	if hum and hum.RigType == Enum.HumanoidRigType.R15 then
		return s.HeadScale, (s.BodyHeightScale + s.BodyWidthScale) / 2
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
	local target = Config.AppearanceScales(profile.Level)

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
