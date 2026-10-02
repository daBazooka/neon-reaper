-- SUB 5 TO TRUE ADAM: game-feel effects. Camera punch/shake, floating text, particle bursts and the big
-- centred callouts. Everything respects the "Effects" setting so players can tone it down.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Debris = game:GetService("Debris")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local UI = require(Shared:WaitForChild("UI"))

local Fx = {}

local player = Players.LocalPlayer
local camera = workspace:WaitForChild("Camera")
local gui
local BASE_FOV = 70
local fovKick = 0
local shakeMag, shakeTime = 0, 0
local flashFrame

local function effectsOn()
	return player:GetAttribute("Set_Fx") ~= false
end

function Fx.init(screenGui)
	gui = screenGui
	flashFrame = UI.new("Frame", {
		Name = "Flash",
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = Color3.new(1, 1, 1),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ZIndex = 90,
		Active = false,
	}, gui)

	RunService.RenderStepped:Connect(function(dt)
		fovKick = fovKick * (1 - math.min(1, dt * 12))
		camera.FieldOfView = BASE_FOV + fovKick
		local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
		if hum then
			if shakeTime > 0 and effectsOn() then
				shakeTime -= dt
				local m = shakeMag * math.clamp(shakeTime / 0.3, 0, 1)
				hum.CameraOffset = Vector3.new((math.random() - 0.5) * m, (math.random() - 0.5) * m, 0)
			else
				shakeMag = 0
				shakeTime = 0
				hum.CameraOffset = Vector3.zero
			end
		end
	end)
end

function Fx.punch(amount)
	if effectsOn() then
		fovKick = math.max(fovKick, amount)
	end
end

function Fx.shake(mag, dur)
	if effectsOn() then
		shakeMag = math.max(shakeMag, mag)
		shakeTime = math.max(shakeTime, dur)
	end
end

function Fx.flash(color, strength, dur)
	if not effectsOn() or not flashFrame then
		return
	end
	flashFrame.BackgroundColor3 = color
	flashFrame.BackgroundTransparency = 1 - strength
	UI.tween(flashFrame, dur or 0.5, { BackgroundTransparency = 1 })
end

local function anchorAt(pos, lifetime)
	local anchor = UI.new("Part", {
		Anchored = true,
		CanCollide = false,
		CanTouch = false,
		CanQuery = false,
		Transparency = 1,
		Size = Vector3.one * 0.1,
		Position = pos,
	}, workspace)
	Debris:AddItem(anchor, lifetime)
	return anchor
end

-- Rising number in the world. Only used for notable pickups so the screen stays calm.
function Fx.floatText(pos, text, color, size)
	if not effectsOn() then
		return
	end
	local anchor = anchorAt(pos + Vector3.new((math.random() - 0.5) * 2, 0, (math.random() - 0.5) * 2), 1.3)
	local bb = UI.new("BillboardGui", {
		Adornee = anchor,
		AlwaysOnTop = true,
		Size = UDim2.fromOffset(300, size + 12),
	}, anchor)
	local label = UI.label(bb, {
		Size = UDim2.fromScale(1, 1),
		Font = UI.Fonts.Title,
		TextSize = size,
		TextColor3 = color,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextStrokeTransparency = 0.25,
		TextStrokeColor3 = Color3.fromRGB(18, 10, 44),
		Text = text,
		TextWrapped = false,
	})
	local grow = UI.new("UIScale", { Scale = 0.4 }, label)
	UI.tween(grow, 0.18, { Scale = 1 }, Enum.EasingStyle.Back)
	UI.tween(bb, 1.1, { StudsOffset = Vector3.new(0, 6, 0) })
	UI.tween(label, 1.1, { TextTransparency = 1, TextStrokeTransparency = 1 }, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
end

function Fx.burst(pos, color, count)
	if not effectsOn() then
		return
	end
	local anchor = anchorAt(pos, 1.5)
	local e = UI.new("ParticleEmitter", {
		Color = ColorSequence.new(color),
		LightEmission = 1,
		Rate = 0,
		Lifetime = NumberRange.new(0.4, 0.8),
		Speed = NumberRange.new(10, 22),
		SpreadAngle = Vector2.new(180, 180),
		Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.7), NumberSequenceKeypoint.new(1, 0) }),
		Transparency = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(1, 1) }),
	}, anchor)
	e:Emit(count)
end

-- Big centred callout. Reserved for moments that deserve it (rank ups, rebirths, combos).
function Fx.announce(title, sub, color, y)
	if not gui then
		return
	end
	local holder = UI.new("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(0.5, 0, y or 0.28, 0),
		Size = UDim2.fromOffset(700, 120),
		BackgroundTransparency = 1,
		ZIndex = 60,
	}, gui)
	local scale = UI.new("UIScale", { Scale = 0.3 }, holder)
	local t = UI.label(holder, {
		Size = UDim2.new(1, 0, 0, 66),
		Font = UI.Fonts.Title,
		TextSize = 56,
		TextColor3 = color,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextStrokeTransparency = 0.1,
		TextStrokeColor3 = Color3.fromRGB(18, 10, 44),
		Text = title,
		ZIndex = 60,
	})
	local s = UI.label(holder, {
		Position = UDim2.fromOffset(0, 68),
		Size = UDim2.new(1, 0, 0, 36),
		Font = UI.Fonts.Bold,
		TextSize = 24,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextStrokeTransparency = 0.3,
		TextStrokeColor3 = Color3.fromRGB(18, 10, 44),
		Text = sub or "",
		ZIndex = 60,
	})
	UI.tween(scale, 0.32, { Scale = 1 }, Enum.EasingStyle.Back)
	task.delay(1.9, function()
		UI.tween(t, 0.5, { TextTransparency = 1, TextStrokeTransparency = 1 })
		UI.tween(s, 0.5, { TextTransparency = 1, TextStrokeTransparency = 1 })
		task.wait(0.6)
		holder:Destroy()
	end)
end

return Fx
