-- FIGURE ME OUT: colour grading on your own screen. The look blends smoothly from one moment to the next (warm lobby, vivid
-- match, punchy last seconds, celebratory results; see Config.Look), because a screen that changes keeps people watching.
-- Switch it off in Settings > Effects (the "Fx" setting) and the match look stays.
local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local View = require(script.Parent:WaitForChild("View"))

local Grade = {}

local player = Players.LocalPlayer
local current -- the numbers on screen right now
local name = "play"
local effects = {}

local function copy(look)
	return {
		Clock = look.Clock, Brightness = look.Brightness, Saturation = look.Saturation, Contrast = look.Contrast,
		Shift = look.Shift, Bloom = look.Bloom, Tint = { look.Tint.R, look.Tint.G, look.Tint.B },
	}
end

local function find(class)
	local ok, e = pcall(function()
		return Lighting:FindFirstChildOfClass(class)
	end)
	if ok and typeof(e) == "Instance" then
		return e
	end
	return nil
end

-- The numbers shown right now (for the tests).
function Grade.current()
	return current, name
end

-- One frame of blending (dt seconds, t = a steady clock for the pulse).
function Grade.step(dt, t)
	if not current then
		current = copy(Config.Look.play)
	end
	local wantName = Rules.lookFor(View.phase(), View.timeLeft())
	if player:GetAttribute("Fx") == false then
		wantName = "play"
	end
	name = wantName
	local want = Config.Look[wantName]
	local k = 1 - math.exp(-Config.Look.Speed * dt)
	for _, key in { "Clock", "Brightness", "Saturation", "Contrast", "Shift", "Bloom" } do
		current[key] += (want[key] - current[key]) * k
	end
	current.Tint[1] += (want.Tint.R - current.Tint[1]) * k
	current.Tint[2] += (want.Tint.G - current.Tint[2]) * k
	current.Tint[3] += (want.Tint.B - current.Tint[3]) * k
	-- the last seconds throb a little, like a heartbeat
	local pulse = want.Pulse and (math.sin(t * 5) * 0.5 + 0.5) * want.Pulse or 0
	pcall(function()
		Lighting.ClockTime = current.Clock
		Lighting.Brightness = current.Brightness
		effects.cc = effects.cc or find("ColorCorrectionEffect")
		effects.bloom = effects.bloom or find("BloomEffect")
		if effects.cc then
			effects.cc.Saturation = current.Saturation
			effects.cc.Contrast = current.Contrast
			effects.cc.Brightness = current.Shift + pulse
			effects.cc.TintColor = Color3.new(current.Tint[1], current.Tint[2], current.Tint[3])
		end
		if effects.bloom then
			effects.bloom.Intensity = current.Bloom
		end
	end)
end

function Grade.init()
	current = copy(Config.Look.play)
	RunService.RenderStepped:Connect(function(dt)
		Grade.step(dt, os.clock())
	end)
end

return Grade
