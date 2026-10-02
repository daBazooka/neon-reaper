-- GLOW UP installer 6 of 7 (client).
-- HOW TO USE: stop any running test, paste this WHOLE script into the Command Bar
-- (the bar at the bottom of Studio) and press Enter. Then run the next installer.
local RS = game:GetService("ReplicatedStorage")
local SSS = game:GetService("ServerScriptService")
local SPS = game:GetService("StarterPlayer"):WaitForChild("StarterPlayerScripts")

local function remove(parent, name)
	for _, child in parent:GetChildren() do
		if child.Name == name then
			child:Destroy()
		end
	end
end

local function getOrMake(class, name, parent)
	local existing = parent:FindFirstChild(name)
	if existing and existing.ClassName == class then
		return existing
	end
	if existing then
		existing:Destroy()
	end
	local inst = Instance.new(class)
	inst.Name = name
	inst.Parent = parent
	return inst
end

local created = 0
local function put(class, name, parent, source)
	local inst = getOrMake(class, name, parent)
	inst.Source = source
	created += 1
	return inst
end

local modules = getOrMake("Folder", "Modules", SPS:WaitForChild("Client"))
put("ModuleScript", "TabCrates", modules, [=====[
-- GLOW UP: crates tab. The server rolls; this plays the reveal (a spinning reel that slows
-- down, then a rarity-coloured card) so every opening feels like an event.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))
local Fx = require(script.Parent.Fx)

local player = Players.LocalPlayer
local C = UI.Colors

local TabCrates = {}

local overlay, reel, reelName, reelSub, reelButtons, reelScale
local busy = false
local busyToken = 0
local pending -- last result waiting to be revealed
local equipAction

local function setBusy(flag)
	busy = flag
	busyToken += 1
	if flag then
		local token = busyToken
		task.delay(4, function()
			if busyToken == token then
				busy = false
			end
		end)
	end
end

function TabCrates.build(parent, Action)
	equipAction = Action

	local header = UI.label(parent, {
		Size = UDim2.new(1, 0, 0, 24),
		Font = UI.Fonts.Bold,
		TextSize = 15,
		TextColor3 = C.Muted,
		TextWrapped = false,
		Text = "",
	})

	local row = UI.new("Frame", {
		Position = UDim2.fromOffset(0, 34),
		Size = UDim2.new(1, 0, 1, -34),
		BackgroundTransparency = 1,
	}, parent)
	UI.new("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		Padding = UDim.new(0, 12),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, row)

	local cardRefs = {}
	for i, crate in Config.Crates do
		local card = UI.panel(row, {
			LayoutOrder = i,
			Size = UDim2.new(1 / #Config.Crates, -8, 1, -8),
			BackgroundColor3 = C.Card,
			Radius = 16,
		})
		local stroke = card:FindFirstChildOfClass("UIStroke")
		stroke.Color = crate.Color
		stroke.Transparency = 0.35

		UI.label(card, {
			Position = UDim2.fromOffset(0, 14),
			Size = UDim2.new(1, 0, 0, 70),
			Font = UI.Fonts.Bold,
			TextSize = 58,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = crate.Icon,
		})
		UI.label(card, {
			Position = UDim2.fromOffset(0, 90),
			Size = UDim2.new(1, 0, 0, 24),
			Font = UI.Fonts.Title,
			TextSize = 19,
			TextColor3 = crate.Color,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = crate.Name,
		})
		-- Odds list, one rarity per line
		local lines = {}
		for _, rarity in Config.RarityOrder do
			local odds = crate.Odds[rarity]
			if odds then
				table.insert(lines, string.format("%s  %d%%", rarity, odds))
			end
		end
		UI.label(card, {
			Position = UDim2.fromOffset(10, 120),
			Size = UDim2.new(1, -20, 0, 60),
			Font = UI.Fonts.Body,
			TextSize = 13,
			TextColor3 = C.Muted,
			TextXAlignment = Enum.TextXAlignment.Center,
			Text = table.concat(lines, "\n"),
		})
		local pity = UI.label(card, {
			Position = UDim2.fromOffset(10, 184),
			Size = UDim2.new(1, -20, 0, 34),
			Font = UI.Fonts.Bold,
			TextSize = 12,
			TextColor3 = C.Gold,
			TextXAlignment = Enum.TextXAlignment.Center,
			Text = "",
		})
		local open = UI.button(card, {
			AnchorPoint = Vector2.new(0.5, 1),
			Position = UDim2.new(0.5, 0, 1, -14),
			Size = UDim2.new(1, -28, 0, 44),
			Text = "",
			TextSize = 17,
		}, "primary")
		open.Activated:Connect(function()
			if busy then
				return
			end
			Audio.click()
			setBusy(true)
			Action:FireServer("OpenCrate", crate.Id)
		end)
		cardRefs[crate.Id] = { open = open, pity = pity, crate = crate }
	end

	-- Reveal overlay (hidden until a result arrives)
	overlay = UI.new("Frame", {
		Size = UDim2.fromScale(1, 1),
		BackgroundColor3 = Color3.fromRGB(8, 6, 20),
		BackgroundTransparency = 0.05,
		Visible = false,
		ZIndex = 40,
		Active = true,
	}, parent)
	UI.corner(overlay, 16)
	reel = UI.label(overlay, {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.4),
		Size = UDim2.fromOffset(200, 130),
		Font = UI.Fonts.Bold,
		TextSize = 100,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "🎁",
		ZIndex = 41,
	})
	reelScale = UI.new("UIScale", {}, reel)
	reelName = UI.label(overlay, {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.62),
		Size = UDim2.new(1, -40, 0, 44),
		Font = UI.Fonts.Title,
		TextSize = 34,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextTransparency = 1,
		Text = "",
		ZIndex = 41,
	})
	reelSub = UI.label(overlay, {
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.72),
		Size = UDim2.new(1, -40, 0, 30),
		Font = UI.Fonts.Bold,
		TextSize = 18,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextTransparency = 1,
		Text = "",
		ZIndex = 41,
	})
	reelButtons = UI.new("Frame", {
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -22),
		Size = UDim2.fromOffset(360, 46),
		BackgroundTransparency = 1,
		Visible = false,
		ZIndex = 42,
	}, overlay)
	UI.new("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		Padding = UDim.new(0, 12),
	}, reelButtons)
	local wear = UI.button(reelButtons, { Size = UDim2.fromOffset(170, 44), Text = "WEAR IT", ZIndex = 43 }, "primary")
	local done = UI.button(reelButtons, { Size = UDim2.fromOffset(170, 44), Text = "CONTINUE", ZIndex = 43 }, "card")
	wear.Activated:Connect(function()
		Audio.click()
		if pending then
			Action:FireServer("Equip", pending.cosmeticId)
		end
		overlay.Visible = false
	end)
	done.Activated:Connect(function()
		Audio.click()
		overlay.Visible = false
	end)

	local function refresh()
		local free = player:GetAttribute("FreeCrates") or 0
		local aura = player:GetAttribute("Aura") or 0
		header.Text = string.format("Free crates: %d   ·   Duplicates level an item up (max %d★)", free, Config.MaxStars)
		for id, ref in cardRefs do
			local crate = ref.crate
			if id == "street" and free > 0 then
				ref.open.Text = "OPEN FREE (" .. free .. ")"
			else
				ref.open.Text = "✦ " .. Util.fmt(crate.Cost)
			end
			local canOpen = (id == "street" and free > 0) or aura >= crate.Cost
			ref.open.BackgroundTransparency = canOpen and 0 or 0.45
			if crate.PityAfter then
				local left = crate.PityAfter - (player:GetAttribute("Pity_" .. id) or 0)
				ref.pity.Text = string.format("%s+ guaranteed in %d", crate.PityMin, math.max(1, left))
			else
				ref.pity.Text = "Great for starting your look"
			end
		end
	end
	return { refresh = refresh }
end

local function pickIcon()
	local list = Config.Cosmetics
	return list[math.random(1, #list)].Icon
end

-- Plays the reel, then shows the result.
function TabCrates.reveal(crateId, cosmeticId, status, stars, refund)
	if not overlay then
		return
	end
	local c = Config.CosmeticById[cosmeticId]
	if not c then
		setBusy(false)
		return
	end
	pending = { cosmeticId = cosmeticId }
	overlay.Visible = true
	reelButtons.Visible = false
	reelName.TextTransparency = 1
	reelSub.TextTransparency = 1
	reelScale.Scale = 1

	task.spawn(function()
		local delay = 0.05
		for i = 1, 22 do
			reel.Text = pickIcon()
			Audio.crateTick(i)
			task.wait(delay)
			delay += 0.011
		end
		local rarity = Config.Rarities[c.Rarity]
		reel.Text = c.Icon
		UI.pop(reelScale, 1.5)
		reelName.Text = c.Name
		reelName.TextColor3 = rarity.Color
		reelSub.Text = c.Rarity:upper() .. " " .. string.lower(Config.SlotIcons[c.Slot] and c.Slot or "")
		UI.tween(reelName, 0.3, { TextTransparency = 0 })
		UI.tween(reelSub, 0.3, { TextTransparency = 0 })

		local note
		if status == "new" then
			note = "NEW!"
		elseif status == "star" then
			note = "LEVEL UP!  " .. string.rep("★", stars)
		else
			note = "MAXED — refunded ✦" .. Util.fmt(refund or 0)
		end
		reelSub.Text = reelSub.Text .. "   ·   " .. note
		reelSub.TextColor3 = status == "max" and C.Muted or (status == "new" and C.Good or C.Gold)

		Audio.reveal(rarity.Order + 1)
		if rarity.Order >= 4 then
			Fx.flash(rarity.Color, 0.5, 0.9)
			Fx.shake(0.35, 0.5)
		end
		task.wait(0.4)
		reelButtons.Visible = true
		setBusy(false)
	end)
end

return TabCrates
]=====])
put("ModuleScript", "TabProfile", modules, [=====[
-- GLOW UP: your character sheet: rank, stats, duel record and the current quest.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))

local player = Players.LocalPlayer
local C = UI.Colors

local TabProfile = {}

function TabProfile.build(parent)
	local hero = UI.panel(parent, {
		Size = UDim2.new(1, -8, 0, 110),
		BackgroundColor3 = C.Card,
		Radius = 16,
	})
	local rankLabel = UI.label(hero, {
		Position = UDim2.fromOffset(20, 12),
		Size = UDim2.new(1, -40, 0, 38),
		Font = UI.Fonts.Title,
		TextSize = 32,
		TextWrapped = false,
		Text = "",
	})
	local scoreLabel = UI.label(hero, {
		Position = UDim2.fromOffset(20, 52),
		Size = UDim2.new(1, -40, 0, 20),
		Font = UI.Fonts.Bold,
		TextSize = 15,
		TextColor3 = C.Muted,
		TextWrapped = false,
		Text = "",
	})
	local rankBar = UI.bar(hero, { Position = UDim2.new(0, 20, 1, -26), Size = UDim2.new(1, -40, 0, 10) }, C.Accent)
	local rankHint = UI.label(hero, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -20, 0, 14),
		Size = UDim2.fromOffset(200, 18),
		Font = UI.Fonts.Bold,
		TextSize = 12,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Right,
		TextWrapped = false,
		Text = "",
	})

	-- Stat cards
	local statRow = UI.new("Frame", {
		Position = UDim2.fromOffset(0, 122),
		Size = UDim2.new(1, -8, 0, 110),
		BackgroundTransparency = 1,
	}, parent)
	UI.new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 10) }, statRow)
	local statRefs = {}
	for _, id in Config.StatOrder do
		local def = Config.Stats[id]
		local card = UI.panel(statRow, { Size = UDim2.new(1 / 3, -7, 1, 0), BackgroundColor3 = C.Card, Radius = 14 })
		card:FindFirstChildOfClass("UIStroke").Color = def.Color
		UI.label(card, {
			Position = UDim2.fromOffset(0, 8),
			Size = UDim2.new(1, 0, 0, 34),
			Font = UI.Fonts.Bold,
			TextSize = 28,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = def.Icon,
		})
		statRefs[id] = UI.label(card, {
			Position = UDim2.fromOffset(0, 42),
			Size = UDim2.new(1, 0, 0, 30),
			Font = UI.Fonts.Title,
			TextSize = 24,
			TextColor3 = def.Color,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = "0",
		})
		UI.label(card, {
			Position = UDim2.fromOffset(0, 76),
			Size = UDim2.new(1, 0, 0, 20),
			Font = UI.Fonts.Bold,
			TextSize = 12,
			TextColor3 = C.Muted,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = def.Name:upper() .. "  ·  " .. def.Station,
		})
	end

	local record = UI.label(parent, {
		Position = UDim2.fromOffset(0, 244),
		Size = UDim2.new(1, -8, 0, 22),
		Font = UI.Fonts.Bold,
		TextSize = 15,
		TextColor3 = C.Text,
		TextWrapped = false,
		Text = "",
	})
	local questTitle = UI.label(parent, {
		Position = UDim2.fromOffset(0, 276),
		Size = UDim2.new(1, -8, 0, 20),
		Font = UI.Fonts.Title,
		TextSize = 14,
		TextColor3 = C.Muted,
		TextWrapped = false,
		Text = "CURRENT QUEST",
	})
	local questCard = UI.panel(parent, {
		Position = UDim2.fromOffset(0, 300),
		Size = UDim2.new(1, -8, 0, 70),
		BackgroundColor3 = C.Card,
		Radius = 14,
	})
	local questText = UI.label(questCard, {
		Position = UDim2.fromOffset(16, 8),
		Size = UDim2.new(1, -32, 0, 22),
		Font = UI.Fonts.Bold,
		TextSize = 16,
		TextWrapped = false,
		Text = "",
	})
	local questBar = UI.bar(questCard, { Position = UDim2.new(0, 16, 1, -22), Size = UDim2.new(1, -32, 0, 10) }, C.Good)
	local questReward = UI.label(questCard, {
		Position = UDim2.fromOffset(16, 32),
		Size = UDim2.new(1, -32, 0, 16),
		Font = UI.Fonts.Body,
		TextSize = 12,
		TextColor3 = C.Muted,
		TextWrapped = false,
		Text = "",
	})

	local function refresh()
		local rankIndex = player:GetAttribute("Rank") or 1
		local rank = Config.Ranks[rankIndex]
		local nextRank = Config.Ranks[rankIndex + 1]
		local score = player:GetAttribute("GlowScore") or 0
		local rebirths = player:GetAttribute("Rebirths") or 0
		rankLabel.Text = (rebirths > 0 and ("★" .. rebirths .. "  ") or "") .. rank.Name:upper()
		rankLabel.TextColor3 = rank.Color
		scoreLabel.Text = string.format("Glow Score %s   ·   Rebirths %d", Util.fmt(score), rebirths)
		rankBar.fill.BackgroundColor3 = rank.Color
		if nextRank then
			rankBar.set((score - rank.Score) / (nextRank.Score - rank.Score))
			rankHint.Text = string.format("Next: %s at %s", nextRank.Name, Util.fmt(nextRank.Score))
		else
			rankBar.set(1)
			rankHint.Text = "Highest rank reached"
		end
		for id, label in statRefs do
			label.Text = Util.fmt(player:GetAttribute(id) or 0)
		end
		record.Text = string.format(
			"⚔️  Duel wins %d     🔥 Win streak %d",
			player:GetAttribute("Wins") or 0,
			player:GetAttribute("DuelStreak") or 0
		)
		local kind = player:GetAttribute("QuestKind")
		if kind then
			local goal = player:GetAttribute("QuestGoal") or 1
			local progress = player:GetAttribute("QuestProgress") or 0
			questText.Text = "🎯 " .. Config.QuestText(kind, goal)
			questBar.set(progress / goal)
			questReward.Text = string.format("%d / %d   ·   Reward ✦ %s", progress, goal, Util.fmt(player:GetAttribute("QuestReward") or 0))
		end
	end
	return { refresh = refresh }
end

return TabProfile
]=====])
put("ModuleScript", "TabRewards", modules, [=====[
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
]=====])
put("ModuleScript", "TabSettings", modules, [=====[
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
]=====])
put("ModuleScript", "TabUpgrades", modules, [=====[
-- GLOW UP: upgrades (bought with Aura) and the rebirth button.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))

local player = Players.LocalPlayer
local C = UI.Colors

local TabUpgrades = {}

function TabUpgrades.build(parent, Action)
	local list = UI.new("ScrollingFrame", {
		Size = UDim2.fromScale(1, 1),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 4,
		ScrollBarImageColor3 = C.Accent,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
	}, parent)
	UI.new("UIListLayout", { Padding = UDim.new(0, 8), SortOrder = Enum.SortOrder.LayoutOrder }, list)
	UI.new("UIPadding", { PaddingRight = UDim.new(0, 8), PaddingBottom = UDim.new(0, 8) }, list)

	local function row(order, height)
		local r = UI.panel(list, {
			LayoutOrder = order,
			Size = UDim2.new(1, 0, 0, height or 68),
			BackgroundColor3 = C.Card,
			Radius = 14,
		})
		return r
	end

	local refs = {}
	for i, def in Config.Upgrades do
		local r = row(i)
		UI.label(r, {
			Position = UDim2.fromOffset(14, 0),
			Size = UDim2.fromOffset(46, 68),
			Font = UI.Fonts.Bold,
			TextSize = 34,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = def.Icon,
		})
		local name = UI.label(r, {
			Position = UDim2.fromOffset(70, 10),
			Size = UDim2.new(1, -210, 0, 22),
			Font = UI.Fonts.Bold,
			TextSize = 17,
			TextWrapped = false,
			Text = def.Name,
		})
		UI.label(r, {
			Position = UDim2.fromOffset(70, 34),
			Size = UDim2.new(1, -210, 0, 20),
			Font = UI.Fonts.Body,
			TextSize = 13,
			TextColor3 = C.Muted,
			TextWrapped = false,
			Text = def.Desc,
		})
		local levelBar = UI.bar(r, { Position = UDim2.fromOffset(70, 56), Size = UDim2.new(1, -210, 0, 5) }, C.Accent)
		local buy = UI.button(r, {
			AnchorPoint = Vector2.new(1, 0.5),
			Position = UDim2.new(1, -12, 0.5, 0),
			Size = UDim2.fromOffset(110, 46),
			Text = "",
			TextSize = 16,
		}, "primary")
		buy.Activated:Connect(function()
			Audio.click()
			Action:FireServer("Buy", def.Id)
		end)
		refs[def.Id] = { name = name, buy = buy, bar = levelBar, def = def }
	end

	-- Rebirth
	local reb = row(100, 96)
	local rebStroke = reb:FindFirstChildOfClass("UIStroke")
	rebStroke.Color = C.Gold
	rebStroke.Transparency = 0.3
	UI.label(reb, {
		Position = UDim2.fromOffset(14, 0),
		Size = UDim2.fromOffset(46, 96),
		Font = UI.Fonts.Bold,
		TextSize = 38,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "🌟",
	})
	UI.label(reb, {
		Position = UDim2.fromOffset(70, 10),
		Size = UDim2.new(1, -210, 0, 24),
		Font = UI.Fonts.Title,
		TextSize = 19,
		TextColor3 = C.Gold,
		TextWrapped = false,
		Text = "REBIRTH",
	})
	local rebDesc = UI.label(reb, {
		Position = UDim2.fromOffset(70, 36),
		Size = UDim2.new(1, -210, 0, 50),
		Font = UI.Fonts.Body,
		TextSize = 13,
		TextColor3 = C.Muted,
		Text = "",
	})
	local rebButton = UI.button(reb, {
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -12, 0.5, 0),
		Size = UDim2.fromOffset(110, 46),
		Text = "REBIRTH",
		TextSize = 15,
	}, "primary")
	rebButton.Activated:Connect(function()
		Audio.click()
		Action:FireServer("Rebirth")
	end)

	local function refresh()
		local aura = player:GetAttribute("Aura") or 0
		for id, ref in refs do
			local lvl = player:GetAttribute("Lv_" .. id) or 0
			ref.name.Text = string.format("%s   Lv %d", ref.def.Name, lvl)
			ref.bar.set(lvl / ref.def.Max)
			if lvl >= ref.def.Max then
				ref.buy.Text = "MAX"
				ref.buy.BackgroundTransparency = 0.5
			else
				local cost = Config.UpgradeCost(ref.def, lvl)
				ref.buy.Text = "✦ " .. Util.fmt(cost)
				ref.buy.BackgroundTransparency = aura >= cost and 0 or 0.5
			end
		end
		local rebirths = player:GetAttribute("Rebirths") or 0
		local need = Config.RebirthRequirement(rebirths)
		local score = player:GetAttribute("GlowScore") or 0
		rebDesc.Text = string.format(
			"Reset Aura, stats and upgrades. Keep every cosmetic, gain +25%% Aura and Glow forever, and a free pair of crates.\nNeeds Glow Score %s  (you have %s)",
			Util.fmt(need),
			Util.fmt(score)
		)
		rebButton.BackgroundTransparency = score >= need and 0 or 0.5
	end
	return { refresh = refresh }
end

return TabUpgrades
]=====])
put("ModuleScript", "TabWardrobe", modules, [=====[
-- GLOW UP: the wardrobe. A collection grid: owned items can be worn, unowned ones show as locked
-- silhouettes so players can see what they're chasing.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))

local player = Players.LocalPlayer
local C = UI.Colors

local TabWardrobe = {}

function TabWardrobe.build(parent, Action)
	local filter = "All"
	local cards = {} -- cosmetic id -> card refs

	-- Header: collection counter and totals
	local summary = UI.label(parent, {
		Size = UDim2.new(1, -4, 0, 22),
		Font = UI.Fonts.Bold,
		TextSize = 15,
		TextColor3 = C.Muted,
		TextWrapped = false,
		Text = "",
	})

	-- Slot filter
	local bar = UI.new("Frame", {
		Position = UDim2.fromOffset(0, 28),
		Size = UDim2.new(1, 0, 0, 34),
		BackgroundTransparency = 1,
	}, parent)
	UI.new("UIListLayout", {
		FillDirection = Enum.FillDirection.Horizontal,
		Padding = UDim.new(0, 6),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, bar)
	local filterButtons = {}
	local names = { "All" }
	for _, slot in Config.Slots do
		table.insert(names, slot)
	end

	local scroller = UI.new("ScrollingFrame", {
		Position = UDim2.fromOffset(0, 70),
		Size = UDim2.new(1, 0, 1, -70),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 4,
		ScrollBarImageColor3 = C.Accent,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
	}, parent)
	UI.new("UIGridLayout", {
		CellSize = UDim2.fromOffset(136, 150),
		CellPadding = UDim2.fromOffset(10, 10),
		SortOrder = Enum.SortOrder.LayoutOrder,
	}, scroller)
	UI.new("UIPadding", { PaddingBottom = UDim.new(0, 10), PaddingRight = UDim.new(0, 8) }, scroller)

	local function applyFilter()
		for id, card in cards do
			local c = Config.CosmeticById[id]
			card.frame.Visible = filter == "All" or c.Slot == filter
		end
		for name, b in filterButtons do
			UI.tween(b, 0.12, { BackgroundColor3 = name == filter and C.Accent or C.Card })
		end
	end

	for i, name in names do
		local label = name == "All" and "All" or (Config.SlotIcons[name] .. " " .. name)
		local b = UI.button(bar, {
			LayoutOrder = i,
			Size = UDim2.fromOffset(name == "All" and 52 or 92, 30),
			Text = label,
			TextSize = 13,
			Radius = 15,
		}, "card")
		filterButtons[name] = b
		b.Activated:Connect(function()
			Audio.click()
			filter = name
			applyFilter()
		end)
	end

	-- Cards, ordered by slot then rarity
	local ordered = table.clone(Config.Cosmetics)
	table.sort(ordered, function(a, b)
		if a.Slot ~= b.Slot then
			return table.find(Config.Slots, a.Slot) < table.find(Config.Slots, b.Slot)
		end
		return Config.Rarities[a.Rarity].Order < Config.Rarities[b.Rarity].Order
	end)

	for i, c in ordered do
		local rarityColor = Config.Rarities[c.Rarity].Color
		local frame = UI.button(scroller, { LayoutOrder = i, Text = "" }, "card")
		local stroke = UI.stroke(frame, rarityColor, 2, 0.4)
		local icon = UI.label(frame, {
			Position = UDim2.fromOffset(0, 8),
			Size = UDim2.new(1, 0, 0, 52),
			Font = UI.Fonts.Bold,
			TextSize = 40,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = c.Icon,
		})
		local name = UI.label(frame, {
			Position = UDim2.fromOffset(6, 62),
			Size = UDim2.new(1, -12, 0, 18),
			Font = UI.Fonts.Bold,
			TextSize = 13,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = c.Name,
		})
		local rarity = UI.label(frame, {
			Position = UDim2.fromOffset(6, 80),
			Size = UDim2.new(1, -12, 0, 14),
			Font = UI.Fonts.Bold,
			TextSize = 11,
			TextColor3 = rarityColor,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = c.Rarity:upper(),
		})
		local stars = UI.label(frame, {
			Position = UDim2.fromOffset(6, 96),
			Size = UDim2.new(1, -12, 0, 16),
			Font = UI.Fonts.Bold,
			TextSize = 13,
			TextColor3 = C.Gold,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = "",
		})
		local stat = UI.label(frame, {
			Position = UDim2.fromOffset(6, 114),
			Size = UDim2.new(1, -12, 0, 14),
			Font = UI.Fonts.Body,
			TextSize = 11,
			TextColor3 = C.Muted,
			TextXAlignment = Enum.TextXAlignment.Center,
			TextWrapped = false,
			Text = "",
		})
		local tag = UI.label(frame, {
			AnchorPoint = Vector2.new(1, 0),
			Position = UDim2.new(1, -6, 0, 6),
			Size = UDim2.fromOffset(70, 16),
			Font = UI.Fonts.Title,
			TextSize = 10,
			TextColor3 = C.Good,
			TextXAlignment = Enum.TextXAlignment.Right,
			TextWrapped = false,
			Text = "",
		})
		frame.Activated:Connect(function()
			local inv = Util.parseInventory(player:GetAttribute("Inv"))
			if not inv[c.Id] then
				Audio.error()
				return
			end
			Audio.equip()
			if player:GetAttribute("Eq_" .. c.Slot) == c.Id then
				Action:FireServer("Unequip", c.Slot)
			else
				Action:FireServer("Equip", c.Id)
			end
		end)
		cards[c.Id] = { frame = frame, icon = icon, name = name, stars = stars, stat = stat, tag = tag, stroke = stroke, c = c }
	end

	local function refresh()
		local inv = Util.parseInventory(player:GetAttribute("Inv"))
		local owned = 0
		for id, card in cards do
			local c = card.c
			local stars = inv[id]
			if stars then
				owned += 1
				card.icon.TextTransparency = 0
				card.name.Text = c.Name
				card.name.TextColor3 = C.Text
				card.stars.Text = string.rep("★", stars) .. string.rep("☆", Config.MaxStars - stars)
				card.stat.Text = string.format("+%s Glow · %s/s", Util.fmt(Config.CosmeticPower(c, stars)), Util.fmt(Config.CosmeticAps(c, stars)))
				local equipped = player:GetAttribute("Eq_" .. c.Slot) == id
				card.tag.Text = equipped and "WORN" or ""
				card.stroke.Transparency = equipped and 0 or 0.4
				card.stroke.Thickness = equipped and 3 or 2
			else
				card.icon.TextTransparency = 0.82
				card.name.Text = "???"
				card.name.TextColor3 = C.Muted
				card.stars.Text = ""
				card.stat.Text = "Find in crates"
				card.tag.Text = ""
				card.stroke.Transparency = 0.8
				card.stroke.Thickness = 1
			end
		end
		summary.Text = string.format(
			"Collection %d/%d   ·   Glow Score %s   ·   +%s Aura/s",
			owned,
			#Config.Cosmetics,
			Util.fmt(player:GetAttribute("GlowScore") or 0),
			Util.fmt(player:GetAttribute("AuraRate") or 0)
		)
	end

	applyFilter()
	return { refresh = refresh }
end

return TabWardrobe
]=====])
put("ModuleScript", "Toasts", modules, [=====[
-- GLOW UP: small, calm notifications. Max three at once, identical messages merge into "x2",
-- and they sit above the dock so they never cover the action.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local UI = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("UI"))

local Toasts = {}

local holder
local active = {} -- list of { frame, text, count, label, token }

local KIND_COLOR = {
	info = UI.Colors.Cyan,
	good = UI.Colors.Good,
	gold = UI.Colors.Gold,
	bad = UI.Colors.Danger,
}

function Toasts.init(gui)
	holder = UI.new("Frame", {
		Name = "Toasts",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -104),
		Size = UDim2.fromOffset(420, 160),
		BackgroundTransparency = 1,
	}, gui)
	UI.new("UIListLayout", {
		SortOrder = Enum.SortOrder.LayoutOrder,
		VerticalAlignment = Enum.VerticalAlignment.Bottom,
		HorizontalAlignment = Enum.HorizontalAlignment.Center,
		Padding = UDim.new(0, 6),
	}, holder)
end

local order = 0

local function remove(entry)
	local i = table.find(active, entry)
	if i then
		table.remove(active, i)
	end
	UI.tween(entry.frame, 0.25, { BackgroundTransparency = 1 })
	UI.tween(entry.label, 0.25, { TextTransparency = 1 })
	task.delay(0.3, function()
		entry.frame:Destroy()
	end)
end

function Toasts.push(text, kind)
	if not holder then
		return
	end
	local color = KIND_COLOR[kind or "info"] or UI.Colors.Cyan

	for _, entry in active do
		if entry.text == text then
			entry.count += 1
			entry.label.Text = text .. "  x" .. entry.count
			entry.token += 1
			local token = entry.token
			task.delay(2.8, function()
				if entry.token == token and table.find(active, entry) then
					remove(entry)
				end
			end)
			return
		end
	end

	if #active >= 3 then
		remove(active[1])
	end

	order += 1
	local frame = UI.new("Frame", {
		LayoutOrder = order,
		Size = UDim2.fromOffset(10, 34),
		AutomaticSize = Enum.AutomaticSize.X,
		BackgroundColor3 = UI.Colors.Panel,
		BackgroundTransparency = 0.12,
		BorderSizePixel = 0,
	}, holder)
	UI.corner(frame, 17)
	UI.stroke(frame, color, 1.5, 0.35)
	UI.new("UIPadding", { PaddingLeft = UDim.new(0, 16), PaddingRight = UDim.new(0, 16) }, frame)
	local label = UI.label(frame, {
		Size = UDim2.fromOffset(10, 34),
		AutomaticSize = Enum.AutomaticSize.X,
		Font = UI.Fonts.Bold,
		TextSize = 15,
		TextWrapped = false,
		TextColor3 = UI.Colors.Text,
		Text = text,
	})
	local entry = { frame = frame, text = text, count = 1, label = label, token = 0 }
	table.insert(active, entry)
	task.delay(2.8, function()
		if entry.token == 0 and table.find(active, entry) then
			remove(entry)
		end
	end)
end

return Toasts
]=====])
print("GLOW UP installer 6/7 done (" .. created .. " scripts). Now run installer 7.")
