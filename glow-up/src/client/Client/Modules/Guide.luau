-- SUB 5 TO TRUE ADAM: the welcome guide. Shown once on a player's very first visit (and again from the ? button):
-- four short pages that explain the goal, how to earn Aura, how to spend it, and what every button is for.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))

local Guide = {}

local player = Players.LocalPlayer
local C = UI.Colors

local PAGES = {
	{
		icon = "👑",
		title = "WELCOME!",
		color = C.Yellow,
		lines = {
			"You start as a SUB 5: short, round and a bit weird.",
			"Level up to become TRUE ADAM.",
			"Your face, body and aura change with every level. Everyone gets their own face!",
		},
	},
	{
		icon = "🏆",
		title = "EARN AURA",
		color = C.Gold,
		lines = {
			"🔨 Click or tap anywhere to swing your hammer. Hold to keep swinging.",
			"🏃 Run on treadmills to earn Aura every second.",
			"🐾 Pets earn Aura for you and make every swing stronger.",
		},
	},
	{
		icon = "🛒",
		title = "SPEND AURA",
		color = C.Mint,
		lines = {
			"Buy bigger hammers at the Hammer Shop (the glowing pedestals).",
			"Hatch pets, unlock treadmills and open new buildings.",
			"Walk up to anything and press the big button at the bottom (or E).",
		},
	},
	{
		icon = "🎮",
		title = "THE BUTTONS",
		color = C.Sky,
		lines = {
			"LEFT: 🛒 Shop · 🔄 Rebirth · 🎁 Rewards · 🐾 Pets · 👗 Outfit",
			"RIGHT: 📍 Places (jump anywhere) · 📦 Crates",
			"TOP: 💎 Store · ⚙️ Settings · ❓ this guide",
			"Follow the yellow tutorial card and the arrow to get started!",
		},
	},
}

local window, iconLabel, titleLabel, bodyLabel, dots, backButton, nextButton
local page = 1
local Action

local function render()
	local p = PAGES[page]
	iconLabel.Text = p.icon
	titleLabel.Text = p.title
	titleLabel.TextColor3 = p.color
	window:FindFirstChildOfClass("UIStroke").Color = p.color
	bodyLabel.Text = table.concat(p.lines, "\n\n")
	backButton.Visible = page > 1
	nextButton.Text = page < #PAGES and "NEXT ▶" or "LET'S GO!"
	nextButton.BackgroundColor3 = page < #PAGES and C.Accent or C.Good
	for i, dot in dots do
		dot.BackgroundColor3 = i == page and p.color or C.Disabled
	end
end

function Guide.close()
	window.Visible = false
	if player:GetAttribute("GuideSeen") ~= true then
		Action:FireServer("GuideSeen")
	end
end

function Guide.open()
	page = 1
	render()
	window.Visible = true
	Audio.quest()
end

function Guide.init(gui, action)
	Action = action
	window = UI.panel(gui, {
		Name = "Guide",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(460, 330),
		Visible = false,
		ZIndex = 40,
		Radius = 16,
	})
	UI.new("UIScale", {}, window)
	local function fit()
		local v = workspace:WaitForChild("Camera").ViewportSize
		window:FindFirstChildOfClass("UIScale").Scale = math.clamp(math.min(v.X / 520, v.Y / 380), 0.6, 1)
	end
	fit()
	iconLabel = UI.label(window, {
		Position = UDim2.fromOffset(18, 14),
		Size = UDim2.fromOffset(60, 60),
		Font = UI.Fonts.Bold,
		TextSize = 44,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 1,
		ZIndex = 41,
		Text = "",
	})
	titleLabel = UI.label(window, {
		Position = UDim2.fromOffset(86, 22),
		Size = UDim2.new(1, -110, 0, 44),
		Font = UI.Fonts.Title,
		TextSize = 30,
		TextWrapped = false,
		ZIndex = 41,
		Text = "",
	})
	bodyLabel = UI.label(window, {
		Position = UDim2.fromOffset(24, 84),
		Size = UDim2.new(1, -48, 0, 170),
		Font = UI.Fonts.Bold,
		TextSize = 16,
		TextColor3 = Color3.new(1, 1, 1),
		TextYAlignment = Enum.TextYAlignment.Top,
		ZIndex = 41,
		Text = "",
	})
	dots = {}
	local dotRow = UI.new("Frame", { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.new(0.5, 0, 1, -62), Size = UDim2.fromOffset(#PAGES * 18, 10), BackgroundTransparency = 1, ZIndex = 41 }, window)
	UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, dotRow)
	for i = 1, #PAGES do
		local dot = UI.new("Frame", { LayoutOrder = i, Size = UDim2.fromOffset(10, 10), BackgroundColor3 = C.Disabled, BorderSizePixel = 0, ZIndex = 42 }, dotRow)
		UI.corner(dot, 5)
		dots[i] = dot
	end
	backButton = UI.button(window, {
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 18, 1, -14),
		Size = UDim2.fromOffset(110, 42),
		BackgroundColor3 = C.Disabled,
		Text = "◀ BACK",
		TextSize = 15,
		ZIndex = 42,
	}, "card")
	nextButton = UI.button(window, {
		AnchorPoint = Vector2.new(1, 1),
		Position = UDim2.new(1, -18, 1, -14),
		Size = UDim2.fromOffset(150, 42),
		Text = "NEXT ▶",
		TextSize = 16,
		ZIndex = 42,
	})
	local skip = UI.button(window, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -12, 0, 10),
		Size = UDim2.fromOffset(56, 22),
		BackgroundColor3 = C.Disabled,
		Text = "SKIP",
		TextSize = 11,
		ZIndex = 42,
		Radius = 7,
	}, "card")
	backButton.Activated:Connect(function()
		Audio.click()
		page = math.max(1, page - 1)
		render()
	end)
	nextButton.Activated:Connect(function()
		Audio.click()
		if page < #PAGES then
			page += 1
			render()
		else
			Guide.close()
		end
	end)
	skip.Activated:Connect(function()
		Audio.click()
		Guide.close()
	end)

	-- First visit: show it once everything has loaded.
	task.spawn(function()
		task.wait(1.2)
		if player:GetAttribute("GuideSeen") ~= true then
			Guide.open()
		end
	end)
end

return Guide
