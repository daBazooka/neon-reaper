-- SUB 5 TO TRUE ADAM: "use" button for every place and hammer. Stand near something and a big button
-- appears at the bottom of the screen (or press E). It looks at where your CHARACTER is, never at the camera,
-- so it works the same from any camera angle, zoom or screen size.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))
local Audio = require(Shared:WaitForChild("Audio"))

local Interact = {}

local player = Players.LocalPlayer
local camera = workspace:WaitForChild("Camera")
local C = UI.Colors

local button, label, scale
local current -- { id, text, color }
local actionFn
local menu

local function flat(a, b)
	local d = a - b
	return Vector3.new(d.X, 0, d.Z).Magnitude
end

local function owned(id)
	for n in string.gmatch(player:GetAttribute("HammersOwned") or "1", "%d+") do
		if tonumber(n) == id then
			return true
		end
	end
	return false
end

local function ownedBuilding(id)
	for b in string.gmatch(player:GetAttribute("Own") or "gym", "%w+") do
		if b == id then
			return true
		end
	end
	return false
end

local function ownedTread(id)
	for n in string.gmatch(player:GetAttribute("Treads") or "1", "%d+") do
		if tonumber(n) == id then
			return true
		end
	end
	return false
end

local function treadText(t)
	local running = player:GetAttribute("Running") or 0
	if running == t.Id then
		return "Stop running", C.Danger
	elseif ownedTread(t.Id) then
		return string.format("Run on %s  ·  +%s/s", t.Name, Util.fmt(t.Rate)), C.Good
	end
	local canBuy = (player:GetAttribute("Aura") or 0) >= t.Price
	return string.format("Buy %s  ·  🏆 %s", t.Name, Util.fmt(t.Price)), canBuy and C.Gold or C.Danger
end

local function hammerText(hammer)
	if (player:GetAttribute("Hammer") or 1) == hammer.Id then
		return hammer.Name .. " (equipped)", C.Disabled
	elseif owned(hammer.Id) then
		return "Equip " .. hammer.Name, C.Mint
	end
	local price = Util.fmt(hammer.Price)
	local canBuy = (player:GetAttribute("Aura") or 0) >= hammer.Price
	return string.format("Buy %s  ·  🏆 %s", hammer.Name, price), canBuy and C.Gold or C.Danger
end

-- Picks the closest thing in range of the character.
local function scan()
	local char = player.Character
	local root = char and char:FindFirstChild("HumanoidRootPart")
	if not root or menu.isOpen() or player:GetAttribute("Training") or player:GetAttribute("InDuel") then
		return nil
	end
	-- While running on a treadmill the only thing you can do is step off.
	if (player:GetAttribute("Running") or 0) > 0 then
		return { id = "TreadStop", text = "Stop running", color = C.Danger }
	end
	local best, bestScore
	local pos = root.Position
	for _, hammer in Config.Hammers do
		local d = flat(pos, Config.HammerPos(hammer.Id))
		if d <= Config.HammerRadius and (not bestScore or d / Config.HammerRadius < bestScore) then
			local text, color = hammerText(hammer)
			best, bestScore = { id = "Hammer:" .. hammer.Id, text = text, color = color }, d / Config.HammerRadius
		end
	end
	for _, t in Config.Treadmills do
		local d = flat(pos, Config.TreadPos(t.Id))
		local r = Config.TreadRadius
		if d <= r and (not bestScore or d / r < bestScore) then
			local text, color = treadText(t)
			best, bestScore = { id = "Tread:" .. t.Id, text = text, color = color }, d / r
		end
	end
	for _, entry in Config.Interactables do
		local d = flat(pos, Config.InteractPos(entry))
		if d <= entry.Radius and (not bestScore or d / entry.Radius < bestScore) then
			local text = entry.Action
			if entry.Id == "Battle" then
				local stage = math.min((player:GetAttribute("Stage") or 0) + 1, Config.Battle.Count)
				text = string.format("Stage %d battle: %s", stage, Config.Battle.Stages[stage].Name)
			end
			local color = C.Good
			if entry.Building and not ownedBuilding(entry.Building) then
				local def = Config.Buildings[entry.Building]
				text = string.format("🔒 Unlock %s  ·  🏆 %s", def.Name, Util.fmt(def.Cost))
				color = (player:GetAttribute("Aura") or 0) >= def.Cost and C.Gold or C.Danger
			end
			best, bestScore = { id = entry.Id, text = text, color = color }, d / entry.Radius
		end
	end
	return best
end

local function trigger()
	if current then
		Audio.click()
		actionFn(current.id)
	end
end

function Interact.init(gui, Action, Menu)
	menu = Menu
	actionFn = function(id)
		if id == "TreadStop" then
			Action:FireServer("TreadStop")
		else
			Action:FireServer("Interact", id)
		end
	end
	button = UI.button(gui, {
		Name = "InteractButton",
		AnchorPoint = Vector2.new(0.5, 1),
		Position = UDim2.new(0.5, 0, 1, -112),
		Size = UDim2.fromOffset(320, 48),
		Visible = false,
		ZIndex = 30,
		Text = "",
	})
	scale = UI.new("UIScale", {}, button)
	label = UI.label(button, {
		Size = UDim2.fromScale(1, 1),
		Font = UI.Fonts.Title,
		TextSize = 17,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 0,
		ZIndex = 31,
		Text = "",
	})
	button.Activated:Connect(trigger)

	UserInputService.InputBegan:Connect(function(input, processed)
		if not processed and input.KeyCode == Enum.KeyCode.E then
			trigger()
		end
	end)

	local last = 0
	RunService.Heartbeat:Connect(function()
		local now = os.clock()
		if now - last < 0.1 then
			return
		end
		last = now
		local found = scan()
		local changed = (found == nil) ~= (current == nil) or (found and current and found.id ~= current.id)
		current = found
		if not found then
			button.Visible = false
			return
		end
		if changed then
			button.Visible = true
			UI.pop(scale, 1.08)
		end
		local keyHint = UserInputService.KeyboardEnabled and "[E]  " or ""
		label.Text = keyHint .. found.text
		button.BackgroundColor3 = found.color
		-- keep the button above the bottom bar on every screen size
		local v = camera.ViewportSize
		scale.Scale = math.clamp(math.min(v.X / 900, v.Y / 520), 0.7, 1)
	end)
end

return Interact
