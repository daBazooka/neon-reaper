-- FIGURE ME OUT: the scoreboard at the end of every match.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))
local View = require(script.Parent:WaitForChild("View"))

local Results = {}

local player = Players.LocalPlayer
local C = UI.Colors
local deps
local panel, heading, sub, rowsFrame, footer, rewardsLabel
local pendingRewards

local MEDALS = { "🥇", "🥈", "🥉" }

function Results.init(gui, d)
	deps = d
	panel = UI.panel(gui, {
		Name = "Results",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(560, 520),
		Visible = false,
		ZIndex = 55,
	})
	heading = UI.label(panel, {
		Position = UDim2.fromOffset(0, 12),
		Size = UDim2.new(1, 0, 0, 40),
		Font = UI.Fonts.Title,
		TextSize = 30,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextColor3 = C.Gold,
		Text = "",
		ZIndex = 56,
	})
	sub = UI.label(panel, {
		Position = UDim2.fromOffset(0, 54),
		Size = UDim2.new(1, 0, 0, 22),
		Font = UI.Fonts.Bold,
		TextSize = 15,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextColor3 = C.Muted,
		Text = "",
		ZIndex = 56,
	})
	rewardsLabel = UI.label(panel, {
		Position = UDim2.fromOffset(0, 78),
		Size = UDim2.new(1, 0, 0, 24),
		Font = UI.Fonts.Title,
		TextSize = 17,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextColor3 = C.Good,
		Text = "",
		ZIndex = 56,
	})
	rowsFrame = UI.new("ScrollingFrame", {
		Position = UDim2.fromOffset(14, 108),
		Size = UDim2.new(1, -28, 1, -150),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 5,
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		CanvasSize = UDim2.new(),
		ZIndex = 56,
	}, panel)
	UI.new("UIListLayout", { SortOrder = Enum.SortOrder.LayoutOrder, Padding = UDim.new(0, 4) }, rowsFrame)
	footer = UI.label(panel, {
		AnchorPoint = Vector2.new(0, 1),
		Position = UDim2.new(0, 0, 1, -10),
		Size = UDim2.new(1, 0, 0, 24),
		Font = UI.Fonts.Bold,
		TextSize = 14,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextColor3 = C.Muted,
		Text = "",
		ZIndex = 56,
	})
	task.spawn(function()
		while true do
			task.wait(0.25)
			if panel.Visible then
				if View.phase() ~= "results" then
					panel.Visible = false
				else
					footer.Text = "Next match in " .. math.ceil(View.timeLeft() + Config.Match.Intermission) .. "s"
				end
			end
		end
	end)
end

-- The server tells us what this match paid (it arrives just before the results table).
function Results.setRewards(coins, xp, level, leveledUp)
	pendingRewards = { coins = coins, xp = xp, level = level, up = leveledUp }
	if panel and panel.Visible then
		rewardsLabel.Text = "+" .. coins .. " 🪙   +" .. xp .. " XP" .. (leveledUp and ("   ⬆ LEVEL " .. level .. "!") or "")
	end
end

function Results.isOpen()
	return panel ~= nil and panel.Visible
end

-- rows: { { id, rank, label, who, kills, score, lives, survived, alive } }
function Results.show(rows, winnerId, winnerTeam, modeId, scores)
	if type(rows) ~= "table" then
		return
	end
	for _, c in rowsFrame:GetChildren() do
		if c:IsA("Frame") then
			c:Destroy()
		end
	end
	local myId = player:GetAttribute("EntityId") or player.UserId
	local mine
	for _, r in rows do
		if r.id == myId then
			mine = r
		end
	end
	local winner = rows[1]
	local teamMode = modeId == "team" or modeId == "ctf"
	heading.TextColor3 = C.Text
	if teamMode then
		local t = Config.Teams[winnerTeam]
		local s1, s2 = (scores or {})[1] or 0, (scores or {})[2] or 0
		local myTeam = mine and mine.team
		if not t then
			heading.Text = "🤝 DRAW"
		elseif myTeam == winnerTeam then
			heading.Text = "🏆 " .. t.Name .. " TEAM WINS - YOU WIN!"
		else
			heading.Text = "🏆 " .. t.Name .. " TEAM WINS"
		end
		heading.TextColor3 = t and t.Color or C.Text
		sub.Text = Config.Teams[1].Icon .. " " .. s1 .. "  -  " .. s2 .. " " .. Config.Teams[2].Icon .. (mine and ("   •   you: " .. mine.kills .. " hits  ⭐ " .. (mine.score or 0)) or "")
	elseif winnerId == 0 or not winner then
		heading.Text = "NO WINNER"
	elseif winner.id == myId then
		heading.Text = "🏆 YOU WIN!"
	else
		heading.Text = "🏆 " .. winner.label .. " WINS"
	end
	if teamMode then
		-- (the line above already says how it ended)
	elseif mine then
		sub.Text = "You finished #" .. mine.rank .. " of " .. #rows .. "  •  " .. mine.kills .. " hits  •  ⭐ " .. (mine.score or 0)
	else
		sub.Text = "Spectating"
	end
	for _, r in rows do
		local isMe = r.id == myId
		local row = UI.new("Frame", {
			LayoutOrder = r.rank,
			Size = UDim2.new(1, -6, 0, 34),
			BackgroundColor3 = isMe and Color3.fromRGB(34, 84, 100) or C.Card,
			BorderSizePixel = 0,
			ZIndex = 57,
		}, rowsFrame)
		UI.corner(row, 8)
		UI.label(row, {
			Position = UDim2.fromOffset(8, 0),
			Size = UDim2.fromOffset(40, 34),
			Font = UI.Fonts.Title,
			TextSize = 18,
			Text = MEDALS[r.rank] or ("#" .. r.rank),
			ZIndex = 58,
		})
		UI.label(row, {
			Position = UDim2.fromOffset(52, 0),
			Size = UDim2.new(0.42, -50, 1, 0),
			Font = UI.Fonts.Bold,
			TextSize = 14,
			TextWrapped = false,
			Text = (teamMode and Config.Teams[r.team] and (Config.Teams[r.team].Icon .. " ") or "") .. r.label .. (r.who ~= "Bot" and ("  (" .. r.who .. ")") or ""),
			ZIndex = 58,
		})
		UI.label(row, {
			Position = UDim2.new(0.42, 0, 0, 0),
			Size = UDim2.new(0.18, 0, 1, 0),
			Font = UI.Fonts.Bold,
			TextSize = 13,
			TextColor3 = C.Danger,
			TextXAlignment = Enum.TextXAlignment.Center,
			Text = teamMode and "" or ((r.lives or 0) > 0 and string.rep("❤", r.lives) or "💀"),
			ZIndex = 58,
		})
		UI.label(row, {
			Position = UDim2.new(0.6, 0, 0, 0),
			Size = UDim2.new(0.2, 0, 1, 0),
			Font = UI.Fonts.Title,
			TextSize = 14,
			TextColor3 = C.Gold,
			TextXAlignment = Enum.TextXAlignment.Center,
			Text = "⭐ " .. (r.score or 0),
			ZIndex = 58,
		})
		UI.label(row, {
			AnchorPoint = Vector2.new(1, 0),
			Position = UDim2.new(1, -8, 0, 0),
			Size = UDim2.new(0.2, 0, 1, 0),
			Font = UI.Fonts.Bold,
			TextSize = 12,
			TextColor3 = C.Muted,
			TextXAlignment = Enum.TextXAlignment.Right,
			Text = r.kills .. " hits • " .. Util.clock(r.survived or 0),
			ZIndex = 58,
		})
	end
	rewardsLabel.Text = ""
	if pendingRewards then
		rewardsLabel.Text = "+" .. pendingRewards.coins .. " 🪙   +" .. pendingRewards.xp .. " XP" .. (pendingRewards.up and ("   ⬆ LEVEL " .. pendingRewards.level .. "!") or "")
		pendingRewards = nil
	end
	panel.Visible = true
	if winner and winner.id == myId and winnerId ~= 0 then
		Audio.win()
		deps.Fx.announce("VICTORY!", "Last one standing", C.Gold, 0.18)
	end
end

return Results
