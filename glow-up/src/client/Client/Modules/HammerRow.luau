-- SUB 5 TO TRUE ADAM: floating OWNED / EQUIPPED / price labels over every hammer pedestal.
-- They are different for each player, so they are drawn here instead of on the pedestal itself.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))

local HammerRow = {}

local player = Players.LocalPlayer
local C = UI.Colors
local tags = {} -- hammer id -> { frame, status, stroke }

local function ownedSet()
	local set = {}
	for n in string.gmatch(player:GetAttribute("HammersOwned") or "1", "%d+") do
		set[tonumber(n)] = true
	end
	return set
end

local function refresh()
	local set = ownedSet()
	local equipped = player:GetAttribute("Hammer") or 1
	local aura = player:GetAttribute("Aura") or 0
	for id, tag in tags do
		local hammer = Config.HammerById[id]
		if id == equipped then
			tag.status.Text = "EQUIPPED"
			tag.status.TextColor3 = C.Good
			tag.stroke.Color = C.Good
		elseif set[id] then
			tag.status.Text = "OWNED"
			tag.status.TextColor3 = C.Sky
			tag.stroke.Color = C.Sky
		else
			tag.status.Text = "🏆 " .. Util.fmt(hammer.Price)
			local affordable = aura >= hammer.Price
			tag.status.TextColor3 = affordable and C.Yellow or C.Danger
			tag.stroke.Color = affordable and C.Gold or C.Stroke
		end
	end
end

local function makeTag(pedestal, hammer)
	local gui = UI.new("BillboardGui", {
		Name = "HammerTag" .. hammer.Id,
		Adornee = pedestal,
		Size = UDim2.fromOffset(104, 60),
		StudsOffset = Vector3.new(0, 11.5, 0),
		AlwaysOnTop = false,
		MaxDistance = 42,
		LightInfluence = 0,
		ResetOnSpawn = false,
	}, player:WaitForChild("PlayerGui"))
	local frame = UI.panel(gui, { Size = UDim2.fromScale(1, 1), Radius = 10 })
	local stroke = frame:FindFirstChildOfClass("UIStroke")
	UI.label(frame, {
		Position = UDim2.fromOffset(4, 3),
		Size = UDim2.new(1, -8, 0, 14),
		Font = UI.Fonts.Bold,
		TextSize = 11,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = hammer.Name,
	})
	UI.label(frame, {
		Position = UDim2.fromOffset(4, 17),
		Size = UDim2.new(1, -8, 0, 30),
		Font = UI.Fonts.Title,
		TextSize = 26,
		TextColor3 = hammer.Head,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 0,
		Text = "x" .. hammer.Mult,
	})
	local status = UI.label(frame, {
		Position = UDim2.fromOffset(4, 48),
		Size = UDim2.new(1, -8, 0, 20),
		Font = UI.Fonts.Title,
		TextSize = 14,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		Text = "",
	})
	tags[hammer.Id] = { frame = frame, status = status, stroke = stroke }
end

function HammerRow.init()
	task.spawn(function()
		local world = workspace:WaitForChild("GlowWorld", 30)
		local row = world and world:WaitForChild("HammerRow", 30)
		if not row then
			return
		end
		for _, child in row:GetChildren() do
			local id = child:GetAttribute("HammerId")
			if id and Config.HammerById[id] then
				makeTag(child, Config.HammerById[id])
			end
		end
		refresh()
		for _, attr in { "Hammer", "HammersOwned" } do
			player:GetAttributeChangedSignal(attr):Connect(refresh)
		end
		-- Aura changes constantly; re-check which hammers are affordable a few times a second.
		while true do
			task.wait(0.4)
			refresh()
		end
	end)
end

return HammerRow
