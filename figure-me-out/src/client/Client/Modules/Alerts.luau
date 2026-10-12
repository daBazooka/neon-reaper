-- FIGURE ME OUT: everything the game shouts at you: flashbang blindness, stun, the "don't hide your number" warning,
-- the arrow that points at someone who just guessed you, thick smoke when you stand inside it, and getting eliminated.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))
local View = require(script.Parent:WaitForChild("View"))

local Alerts = {}

local C = UI.Colors
local deps
local refs = {}
local blindUntil, stunUntil = 0, 0
local snitch -- { pos, until }

function Alerts.isBlind()
	return View.now() < blindUntil
end

function Alerts.isStunned()
	return View.now() < stunUntil
end

function Alerts.init(gui, d)
	deps = d
	refs.white = UI.new("Frame", { Name = "Blind", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 1, BorderSizePixel = 0, ZIndex = 80 }, gui)
	refs.smoke = UI.new("Frame", { Name = "SmokeFog", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(190, 194, 205), BackgroundTransparency = 1, BorderSizePixel = 0, ZIndex = 70 }, gui)
	refs.stunTint = UI.new("Frame", { Name = "StunTint", Size = UDim2.fromScale(1, 1), BackgroundColor3 = C.Sky, BackgroundTransparency = 1, BorderSizePixel = 0, ZIndex = 40 }, gui)
	refs.stunLabel = UI.label(gui, {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.62),
		Size = UDim2.fromOffset(360, 60),
		Font = UI.Fonts.Title,
		TextSize = 34,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextColor3 = C.Sky,
		Text = "",
		Visible = false,
		ZIndex = 41,
	})
	refs.cover = UI.panel(gui, {
		Name = "CoverWarning",
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 86),
		Size = UDim2.fromOffset(420, 58),
		BackgroundColor3 = Color3.fromRGB(70, 14, 22),
		Visible = false,
		ZIndex = 45,
	})
	refs.coverTitle = UI.label(refs.cover, {
		Position = UDim2.fromOffset(0, 5),
		Size = UDim2.new(1, 0, 0, 26),
		Font = UI.Fonts.Title,
		TextSize = 20,
		TextColor3 = C.Danger,
		TextXAlignment = Enum.TextXAlignment.Center,
		Text = "",
		ZIndex = 46,
	})
	refs.coverSub = UI.label(refs.cover, {
		Position = UDim2.fromOffset(0, 32),
		Size = UDim2.new(1, 0, 0, 20),
		Font = UI.Fonts.Bold,
		TextSize = 13,
		TextXAlignment = Enum.TextXAlignment.Center,
		Text = "",
		ZIndex = 46,
	})
	refs.arrowHolder = UI.new("Frame", { Name = "Snitch", Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, Visible = false, ZIndex = 50 }, gui)
	refs.arrow = UI.label(refs.arrowHolder, {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Size = UDim2.fromOffset(70, 70),
		Font = UI.Fonts.Title,
		TextSize = 60,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextColor3 = C.Danger,
		Text = "▲",
		ZIndex = 51,
	})
	refs.arrowText = UI.label(refs.arrowHolder, {
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0.5, 120),
		Size = UDim2.fromOffset(360, 24),
		Font = UI.Fonts.Title,
		TextSize = 16,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextColor3 = C.Danger,
		Text = "SOMEONE JUST GUESSED YOU",
		ZIndex = 51,
	})
	RunService.RenderStepped:Connect(function()
		Alerts.update()
	end)
end

function Alerts.flash(seconds)
	local now = View.now()
	blindUntil = math.max(blindUntil, now + seconds)
	refs.white.BackgroundTransparency = 0
	local hold = math.min(1.2, seconds * 0.35)
	task.delay(hold, function()
		UI.tween(refs.white, math.max(0.2, seconds - hold), { BackgroundTransparency = 1 }, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
	end)
	Audio.ring()
	deps.Scope.set(false)
	deps.Fx.shake(0.4, 0.3)
end

function Alerts.stun(seconds)
	stunUntil = math.max(stunUntil, View.now() + seconds)
	refs.stunTint.BackgroundTransparency = 0.82
	refs.stunLabel.Visible = true
	Audio.stun()
	deps.Fx.shake(0.5, 0.25)
	deps.Scope.set(false)
	deps.Keypad.close()
end

-- stage: "warn" | "ok" | "exposed"
function Alerts.cover(stage, value)
	if stage == "warn" then
		refs.cover.Visible = true
		refs.coverTitle.Text = "⚠ DON'T HIDE YOUR NUMBER"
		refs.coverSub.Text = "Turn away from the wall or be exposed in " .. string.format("%.1f", value) .. "s"
		if (refs.lastWarnBeep or 0) + 0.8 < os.clock() then
			refs.lastWarnBeep = os.clock()
			Audio.warn()
		end
	elseif stage == "ok" then
		refs.cover.Visible = false
	else
		refs.cover.Visible = false
		Audio.siren()
		deps.Fx.flash(C.Danger, 0.5, 0.6)
		deps.Fx.announce("YOU'RE EXPOSED!", "Everyone can see your number for " .. value .. "s", C.Danger, 0.28)
	end
end

function Alerts.snitch(pos, seconds)
	snitch = { pos = pos, untilT = View.now() + seconds }
	refs.arrowHolder.Visible = true
	Audio.snitch()
	deps.Fx.shake(0.6, 0.3)
	deps.Toasts.push("Someone just guessed your number!", "bad")
end

function Alerts.update()
	local now = View.now()
	-- stun countdown
	if now < stunUntil then
		refs.stunLabel.Text = "FROZEN  " .. string.format("%.1f", stunUntil - now)
	elseif refs.stunLabel.Visible then
		refs.stunLabel.Visible = false
		UI.tween(refs.stunTint, 0.3, { BackgroundTransparency = 1 })
	end
	-- arrow towards whoever guessed me
	if snitch then
		local camera = View.camera()
		if now > snitch.untilT or not camera then
			snitch = nil
			refs.arrowHolder.Visible = false
		else
			local cf = camera.CFrame
			local look = Vector3.new(cf.LookVector.X, 0, cf.LookVector.Z)
			local right = Vector3.new(cf.RightVector.X, 0, cf.RightVector.Z)
			local dir = Vector3.new(snitch.pos.X - cf.Position.X, 0, snitch.pos.Z - cf.Position.Z)
			if dir.Magnitude > 0.1 and look.Magnitude > 0.01 then
				local angle = math.atan2(dir.Unit:Dot(right.Unit), dir.Unit:Dot(look.Unit))
				refs.arrow.Rotation = math.deg(angle)
				refs.arrow.Position = UDim2.new(0.5, math.sin(angle) * 150, 0.5, -math.cos(angle) * 150)
			end
		end
	end
	-- standing inside a smoke cloud
	local camera = View.camera()
	local smoke = workspace:FindFirstChild("Smoke")
	local inside = false
	if smoke and camera then
		for _, s in smoke:GetChildren() do
			local center, radius = View.cloudOf(s)
			if (center - camera.CFrame.Position).Magnitude < radius * 0.9 then
				inside = true
				break
			end
		end
	end
	local want = inside and 0.12 or 1
	refs.smoke.BackgroundTransparency += (want - refs.smoke.BackgroundTransparency) * 0.2
	-- the cover warning goes away when the game is not running
	if View.phase() ~= "play" and refs.cover.Visible then
		refs.cover.Visible = false
	end
end

return Alerts
