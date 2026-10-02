-- SUB 5 TO TRUE ADAM: crates tab. The server rolls; this plays the reveal (a spinning reel that slows
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
