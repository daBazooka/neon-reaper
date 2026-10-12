-- FIGURE ME OUT: the binoculars. Hold the right mouse button (or Z, or tap the 🔭 slot) to zoom far across the map and
-- read digits off a forehead. You walk slowly while looking through them, and a flashbang knocks them down.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))
local View = require(script.Parent:WaitForChild("View"))

local Scope = {}

local deps
local overlay, range, zoomText
local refs = {}
local on = false
local fov = Config.Scope.Fov
local normalSensitivity = 1

function Scope.isOn()
	return on
end

function Scope.init(gui, d)
	deps = d
	overlay = UI.new("Frame", { Name = "Scope", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Visible = false, ZIndex = 20 }, gui)
	-- black bars frame a centred square view (this works everywhere) ...
	refs.bars = {}
	for i = 1, 4 do
		refs.bars[i] = UI.new("Frame", { BackgroundColor3 = Color3.new(0, 0, 0), BorderSizePixel = 0, ZIndex = 20 }, overlay)
	end
	-- ... and a big circle with a very thick black outline rounds off the corners of the square
	refs.ring = UI.new("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(620, 620),
		BackgroundTransparency = 1,
		ZIndex = 20,
	}, overlay)
	refs.ringCorner = UI.corner(refs.ring, 310)
	UI.new("UIStroke", { Color = Color3.new(0, 0, 0), Thickness = 1400, ApplyStrokeMode = Enum.ApplyStrokeMode.Border }, refs.ring)
	UI.new("UIStroke", { Color = UI.Colors.Accent, Thickness = 3, ApplyStrokeMode = Enum.ApplyStrokeMode.Border, Transparency = 0.2 }, refs.ring)
	local function line(size, pos)
		UI.new("Frame", { AnchorPoint = Vector2.new(0.5, 0.5), Position = pos, Size = size, BackgroundColor3 = UI.Colors.Accent, BackgroundTransparency = 0.25, BorderSizePixel = 0, ZIndex = 21 }, overlay)
	end
	line(UDim2.fromOffset(2, 150), UDim2.fromScale(0.5, 0.5))
	line(UDim2.fromOffset(150, 2), UDim2.fromScale(0.5, 0.5))
	range = UI.label(overlay, {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0.5, 90),
		Size = UDim2.fromOffset(300, 30),
		Font = UI.Fonts.Title,
		TextSize = 22,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextColor3 = UI.Colors.Accent,
		Text = "",
		ZIndex = 22,
	})
	zoomText = UI.label(overlay, {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 0.5, -90),
		Size = UDim2.fromOffset(300, 24),
		Font = UI.Fonts.Bold,
		TextSize = 14,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextColor3 = UI.Colors.Muted,
		Text = "",
		ZIndex = 22,
	})
	task.spawn(function()
		while true do
			task.wait(0.1)
			if on then
				Scope.update()
			end
		end
	end)
end

-- Sizes the square view and the bars around it for the current screen.
local function layout()
	local camera = View.camera()
	local vp = camera and camera.ViewportSize
	if not vp or type(vp.X) ~= "number" then
		return
	end
	local side = math.floor(math.min(vp.X, vp.Y) * 0.92)
	local gapX, gapY = math.max(0, (vp.X - side) / 2), math.max(0, (vp.Y - side) / 2)
	refs.ring.Size = UDim2.fromOffset(side, side)
	refs.ringCorner.CornerRadius = UDim.new(0, side / 2)
	local bars = refs.bars
	bars[1].Position, bars[1].Size = UDim2.fromOffset(0, 0), UDim2.fromOffset(gapX + 1, vp.Y)
	bars[2].Position, bars[2].Size = UDim2.fromOffset(vp.X - gapX - 1, 0), UDim2.fromOffset(gapX + 1, vp.Y)
	bars[3].Position, bars[3].Size = UDim2.fromOffset(0, 0), UDim2.fromOffset(vp.X, gapY + 1)
	bars[4].Position, bars[4].Size = UDim2.fromOffset(0, vp.Y - gapY - 1), UDim2.fromOffset(vp.X, gapY + 1)
end

function Scope.update()
	if not View.amAlive() or View.phase() ~= "play" or (Players.LocalPlayer:GetAttribute("Stunned") == true) then
		Scope.set(false)
		return
	end
	local target, distance = View.aimed()
	if target then
		range.Text = target.icon .. " " .. target.code .. "  •  " .. math.floor(distance + 0.5) .. " m"
	else
		range.Text = ""
	end
	zoomText.Text = "ZOOM x" .. string.format("%.1f", Config.Scope.NormalFov / fov) .. "   (scroll to change)"
end

function Scope.set(value)
	value = value == true
	if value and (not View.amAlive() or View.phase() ~= "play" or deps.Alerts.isBlind()) then
		return
	end
	if value == on then
		return
	end
	on = value
	if on then
		layout()
	end
	overlay.Visible = on
	pcall(function()
		Players.LocalPlayer.CameraMode = on and Enum.CameraMode.LockFirstPerson or Enum.CameraMode.Classic
	end)
	deps.Fx.setBaseFov(on and fov or Config.Scope.NormalFov)
	pcall(function()
		if on then
			normalSensitivity = UserInputService.MouseDeltaSensitivity
			UserInputService.MouseDeltaSensitivity = normalSensitivity * math.clamp(fov / Config.Scope.NormalFov * 1.6, 0.2, 1)
		else
			UserInputService.MouseDeltaSensitivity = normalSensitivity
		end
	end)
	deps.send("Scope", on)
	if on then
		Audio.play("Click", 0.8, 0.5)
		Scope.update()
	end
end

function Scope.toggle()
	Scope.set(not on)
end

-- Mouse wheel: positive = zoom in.
function Scope.zoom(direction)
	if not on then
		return
	end
	fov = math.clamp(fov - direction * 2, Config.Scope.MinFov, Config.Scope.MaxFov)
	deps.Fx.setBaseFov(fov)
	Scope.update()
end

return Scope
