-- GLOW UP: simple toggles. Settings are saved on the server so they follow the player.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))

local player = Players.LocalPlayer
local C = UI.Colors

local TabSettings = {}

local OPTIONS = {
	{ key = "Music", name = "Music", desc = "Ambient background music" },
	{ key = "Sfx", name = "Sound effects", desc = "Pickups, crates and fanfares" },
	{ key = "Fx", name = "Screen effects", desc = "Camera punch, shake, flashes and floating numbers" },
	{ key = "Duels", name = "Duels", desc = "Allow duel matchmaking (turn off to stay out of fights)" },
}

-- Apply the saved settings to the live game (audio mostly).
function TabSettings.apply()
	Audio.setMusic(player:GetAttribute("Set_Music") ~= false)
	Audio.setSfx(player:GetAttribute("Set_Sfx") ~= false)
end

function TabSettings.build(parent, Action)
	UI.label(parent, {
		Size = UDim2.new(1, 0, 0, 26),
		Font = UI.Fonts.Title,
		TextSize = 20,
		TextWrapped = false,
		Text = "⚙️  Settings",
	})
	local list = UI.new("Frame", {
		Position = UDim2.fromOffset(0, 36),
		Size = UDim2.new(1, -8, 1, -36),
		BackgroundTransparency = 1,
	}, parent)
	UI.new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, list)

	local toggles = {}
	for i, opt in OPTIONS do
		local row = UI.panel(list, { LayoutOrder = i, Size = UDim2.new(1, 0, 0, 62), BackgroundColor3 = C.Card, Radius = 14 })
		UI.label(row, {
			Position = UDim2.fromOffset(16, 8),
			Size = UDim2.new(1, -130, 0, 22),
			Font = UI.Fonts.Bold,
			TextSize = 16,
			TextWrapped = false,
			Text = opt.name,
		})
		UI.label(row, {
			Position = UDim2.fromOffset(16, 32),
			Size = UDim2.new(1, -130, 0, 22),
			Font = UI.Fonts.Body,
			TextSize = 12,
			TextColor3 = C.Muted,
			TextWrapped = false,
			Text = opt.desc,
		})
		local track = UI.button(row, {
			AnchorPoint = Vector2.new(1, 0.5),
			Position = UDim2.new(1, -16, 0.5, 0),
			Size = UDim2.fromOffset(64, 32),
			Text = "",
			Radius = 16,
		}, "card")
		local knob = UI.new("Frame", {
			AnchorPoint = Vector2.new(0, 0.5),
			Position = UDim2.new(0, 4, 0.5, 0),
			Size = UDim2.fromOffset(24, 24),
			BackgroundColor3 = Color3.new(1, 1, 1),
			ZIndex = 3,
		}, track)
		UI.corner(knob, 12)
		track.Activated:Connect(function()
			Audio.click()
			local value = not (player:GetAttribute("Set_" .. opt.key) ~= false)
			player:SetAttribute("Set_" .. opt.key, value) -- instant local feedback; the server saves it
			Action:FireServer("Setting", opt.key, value)
			TabSettings.apply()
		end)
		toggles[opt.key] = { track = track, knob = knob }
	end

	local function refresh()
		for key, t in toggles do
			local on = player:GetAttribute("Set_" .. key) ~= false
			UI.tween(t.track, 0.15, { BackgroundColor3 = on and C.Good or C.Disabled })
			UI.tween(t.knob, 0.15, { Position = on and UDim2.new(1, -28, 0.5, 0) or UDim2.new(0, 4, 0.5, 0) })
		end
	end
	return { refresh = refresh }
end

return TabSettings
