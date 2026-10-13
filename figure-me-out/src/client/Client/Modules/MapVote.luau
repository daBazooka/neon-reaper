-- FIGURE ME OUT: the map vote. Six cards along the bottom of the screen while the vote is open (from the results screen until
-- the next match starts): tap a map to vote for it, tap another to change your mind. The number on a card is how many votes it
-- has; the leading map glows gold. The map with the most votes is played, and a tie is settled by a random pick among the tied.
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Maps = require(Shared:WaitForChild("Maps"))
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))
local View = require(script.Parent:WaitForChild("View"))

local MapVote = {}

local player = Players.LocalPlayer
local C = UI.Colors
local deps
local panel, title, cards
local lastAt = -100
local picked -- the vote I just cast (shown at once, before the server's answer arrives)

local function visible()
	return Config.Vote.Enabled and workspace:GetAttribute("VoteOpen") == true and (View.phase() == "lobby" or View.phase() == "results")
end

function MapVote.isOpen()
	return panel ~= nil and panel.Visible
end

-- Votes for a map (returns false when the vote is closed or it was too soon after the last one).
function MapVote.vote(id)
	if not visible() or not Maps.List[id] then
		return false
	end
	local now = os.clock()
	if now - lastAt < Config.Vote.MinGap then
		return false
	end
	lastAt = now
	picked = id
	deps.send("Vote", id)
	Audio.click()
	MapVote.update()
	return true
end

function MapVote.init(gui, d)
	deps = d
	panel = UI.panel(gui, {
		Name = "MapVote",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -12),
		Size = UDim2.new(0.94, 0, 0, 142),
		Visible = false,
		ZIndex = 40,
	})
	UI.new("UISizeConstraint", { MaxSize = Vector2.new(820, 142), MinSize = Vector2.new(300, 142) }, panel)
	title = UI.label(panel, {
		Position = UDim2.fromOffset(12, 6),
		Size = UDim2.new(1, -24, 0, 22),
		Font = UI.Fonts.Title,
		TextSize = 17,
		TextColor3 = C.Gold,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "🗳 VOTE FOR THE NEXT MAP",
		ZIndex = 41,
	})
	local row = UI.new("Frame", { Name = "Cards", Position = UDim2.fromOffset(8, 32), Size = UDim2.new(1, -16, 1, -40), BackgroundTransparency = 1, ZIndex = 41 }, panel)
	UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder, HorizontalAlignment = Enum.HorizontalAlignment.Center }, row)
	cards = {}
	for i, id in Maps.Order do
		local m = Maps.List[id]
		local card = UI.button(row, { LayoutOrder = i, Size = UDim2.new(1 / #Maps.Order, -6, 1, 0), Text = "", BackgroundColor3 = m.Card, ZIndex = 42 }, "card")
		local icon = UI.label(card, { Position = UDim2.fromOffset(0, 4), Size = UDim2.new(1, 0, 0.5, 0), Font = UI.Fonts.Title, TextSize = 30, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = m.Icon, ZIndex = 43 })
		local name = UI.label(card, { Position = UDim2.new(0, 2, 0.5, 0), Size = UDim2.new(1, -4, 0.32, 0), Font = UI.Fonts.Bold, TextSize = 12, TextXAlignment = Enum.TextXAlignment.Center, Text = m.Name, ZIndex = 43 })
		local count = UI.label(card, { AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -3, 0, 3), Size = UDim2.fromOffset(26, 20), Font = UI.Fonts.Title, TextSize = 14, TextColor3 = C.Gold, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "", ZIndex = 44 })
		local mine = UI.label(card, { Position = UDim2.new(0, 0, 0.82, 0), Size = UDim2.new(1, 0, 0.16, 0), Font = UI.Fonts.Bold, TextSize = 11, TextColor3 = C.Mint, TextXAlignment = Enum.TextXAlignment.Center, TextWrapped = false, Text = "", ZIndex = 43 })
		card.MouseButton1Click:Connect(function()
			MapVote.vote(id)
		end)
		cards[id] = { card = card, count = count, mine = mine, stroke = card:FindFirstChildOfClass("UIStroke") }
	end
	local last = 0
	RunService.RenderStepped:Connect(function()
		local now = os.clock()
		if now - last >= 0.2 then
			last = now
			MapVote.update()
		end
	end)
end

function MapVote.update()
	if not panel then
		return
	end
	local show = visible()
	panel.Visible = show
	if not show then
		picked = nil
		return
	end
	local counts = Maps.decode(workspace:GetAttribute("VoteCounts"))
	local mine = player:GetAttribute("MyVote")
	if type(mine) ~= "string" or mine == "" then
		mine = picked
	end
	local lead = workspace:GetAttribute("VoteLead")
	local best = 0
	for _, id in Maps.Order do
		best = math.max(best, counts[id])
	end
	for _, id in Maps.Order do
		local c = cards[id]
		local n = counts[id]
		c.count.Text = n > 0 and tostring(n) or ""
		c.mine.Text = id == mine and "✓ YOUR VOTE" or ""
		if c.stroke then
			c.stroke.Color = (best > 0 and n == best) and C.Gold or (id == mine and Color3.new(1, 1, 1) or C.Stroke)
			c.stroke.Thickness = (best > 0 and n == best) and 4 or (id == mine and 3.5 or 2.5)
		end
	end
	local left = math.ceil(View.timeLeft())
	if View.phase() == "lobby" then
		title.Text = "🗳 VOTE FOR THE NEXT MAP  •  most votes wins  •  tie = random pick"
	else
		title.Text = "🗳 VOTE FOR THE NEXT MAP  •  tap a map"
	end
end

return MapVote
