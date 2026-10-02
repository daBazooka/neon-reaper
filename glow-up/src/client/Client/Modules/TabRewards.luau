-- GLOW UP: daily streak rewards and the current server event.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))

local player = Players.LocalPlayer
local C = UI.Colors

local TabRewards = {}

function TabRewards.build(parent, Action)
	UI.label(parent, {
		Size = UDim2.new(1, 0, 0, 26),
		Font = UI.Fonts.Title,
		TextSize = 20,
		TextWrapped = false,
		Text = "📅  Daily Rewards",
	})
	local streakLabel = UI.label(parent, {
		Position = UDim2.fromOffset(0, 28),
		Size = UDim2.new(1, 0, 0, 20),
		Font = UI.Fonts.Body,
		TextSize = 13,
		TextColor3 = C.Muted,
		TextWrapped = false,
		Text = "",
	})

	local grid = UI.new("Frame", {
		Position = UDim2.fromOffset(0, 58),
		Size = UDim2.new(1, -8, 0, 190),
		BackgroundTransparency = 1,
	}, parent)
	UI.new("UIGridLayout", {
		CellSize = UDim2.fromOffset(136, 90),
		CellPadding = UDim2.fromOffset(10, 10),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, grid)
	local cells = {}
	for day, reward in Config.Daily do
		local cell = UI.panel(grid, { LayoutOrder = day, BackgroundColor3 = C.Card, Radius = 12 })
		UI.label(cell, {
			Position = UDim2.fromOffset(0, 6),
			Size = UDim2.new(1, 0, 0, 18),
			Font = UI.Fonts.Title,
			TextSize = 12,
			TextColor3 = C.Muted,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = "DAY " .. day,
		})
		local text = "✦ " .. Util.fmt(reward.Aura)
		if reward.Crates then
			text ..= "\n🎁 x" .. reward.Crates
		end
		UI.label(cell, {
			Position = UDim2.fromOffset(0, 26),
			Size = UDim2.new(1, 0, 1, -30),
			Font = UI.Fonts.Bold,
			TextSize = 16,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextYAlignment = Enum.TextYAlignment.Top,
			Text = text,
		})
		cells[day] = cell
	end

	local claim = UI.button(parent, {
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 0, 1, -56),
		Size = UDim2.new(1, -8, 0, 46),
		Text = "CLAIM",
		TextSize = 18,
	}, "primary")
	claim.Activated:Connect(function()
		Audio.click()
		Action:FireServer("Claim")
	end)

	local eventLabel = UI.label(parent, {
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 0, 1, 0),
		Size = UDim2.new(1, -8, 0, 44),
		Font = UI.Fonts.Bold,
		TextSize = 14,
		TextColor3 = C.Muted,
		Text = "",
	})

	local function refresh()
		local ready = player:GetAttribute("DailyReady") == true
		local day = player:GetAttribute("DailyDay") or 1
		streakLabel.Text = "Come back every day to keep your streak. Current streak: " .. (player:GetAttribute("DailyStreak") or 0)
		for d, cell in cells do
			local isNext = d == day
			cell.BackgroundColor3 = isNext and (ready and Color3.fromRGB(86, 62, 150) or C.CardHover) or C.Card
			cell:FindFirstChildOfClass("UIStroke").Color = isNext and C.Gold or C.Stroke
			cell:FindFirstChildOfClass("UIStroke").Transparency = isNext and 0.1 or 0.55
		end
		claim.Text = ready and ("CLAIM DAY " .. day) or "COME BACK TOMORROW"
		claim.BackgroundTransparency = ready and 0 or 0.55

		local id = workspace:GetAttribute("Event")
		local ev = id and id ~= "" and Config.EventById[id]
		local left = (workspace:GetAttribute("EventEnd") or 0) - workspace:GetServerTimeNow()
		if ev and left > 0 then
			eventLabel.Text = string.format("%s %s is live (%s left): %s", ev.Icon, ev.Name, Util.clock(left), ev.Desc)
		else
			eventLabel.Text = "No event right now. Golden Hour, Shard Storm, Duel Frenzy and Runway Night roll in every few minutes."
		end
	end
	return { refresh = refresh }
end

return TabRewards
