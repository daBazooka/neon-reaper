-- SUB 5 TO TRUE ADAM: floating signs over every building and treadmill that show what it costs, what it gives and
-- whether you own it. They are different for each player, so they are drawn here instead of in the world.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Util = require(Shared:WaitForChild("Util"))

local WorldTags = {}

local player = Players.LocalPlayer
local C = UI.Colors
local anchors = {} -- kept so the signs have something to attach to
local buildingTags = {} -- id -> { status, stroke }
local treadTags = {} -- id -> { status, stroke }

local function owned(attr, fallback)
	local set = {}
	for key in string.gmatch(player:GetAttribute(attr) or fallback, "[%w_]+") do
		set[tonumber(key) or key] = true
	end
	return set
end

local function anchorAt(position)
	local part = UI.new("Part", {
		Name = "TagAnchor",
		Size = Vector3.one,
		Position = position,
		Transparency = 1,
		Anchored = true,
		CanCollide = false,
		CanQuery = false,
		CanTouch = false,
	}, workspace)
	table.insert(anchors, part)
	return part
end

local function makeTag(adornee, offset, width, height, maxDistance)
	local gui = UI.new("BillboardGui", {
		Adornee = adornee,
		Size = UDim2.fromOffset(width, height),
		StudsOffset = offset,
		AlwaysOnTop = true,
		MaxDistance = maxDistance,
		LightInfluence = 0,
		ResetOnSpawn = false,
	}, player:WaitForChild("PlayerGui"))
	local frame = UI.panel(gui, { Size = UDim2.fromScale(1, 1), Radius = 10 })
	return frame, frame:FindFirstChildOfClass("UIStroke")
end

local function line(frame, y, h, size, color, text, font)
	return UI.label(frame, {
		Position = UDim2.fromOffset(4, y),
		Size = UDim2.new(1, -8, 0, h),
		Font = font or UI.Fonts.Title,
		TextSize = size,
		TextColor3 = color,
		TextXAlignment = Enum.TextXAlignment.Center,
		TextWrapped = false,
		TextStrokeTransparency = 0.3,
		Text = text,
	})
end

local function buildBuildingTags()
	for _, id in Config.BuildingOrder do
		local def = Config.Buildings[id]
		local at = Config.BuildingPos[id]()
		local height = (id == "stage" or id == "battle") and 40 or (id == "treadmills" and 28 or 22)
		local frame, stroke = makeTag(anchorAt(at + Vector3.new(0, height, 0)), Vector3.zero, 190, 62, 190)
		line(frame, 3, 18, 13, def.Main:Lerp(Color3.new(1, 1, 1), 0.4), def.Name:upper())
		line(frame, 21, 14, 10, C.Muted, "Aura: " .. def.Aura, UI.Fonts.Bold)
		local status = line(frame, 37, 20, 15, C.Yellow, "")
		buildingTags[id] = { status = status, stroke = stroke, def = def }
	end
end

local function buildTreadTags(row)
	for _, t in Config.Treadmills do
		local frame, stroke = makeTag(anchorAt(Config.TreadPos(t.Id) + Vector3.new(0, 12.5, 0)), Vector3.zero, 118, 58, 80)
		line(frame, 3, 14, 11, t.Color, (t.Name:gsub(" Treadmill", "")):upper() .. " TREADMILL")
		line(frame, 17, 22, 18, t.Color, "+" .. Util.fmt(t.Rate) .. "/s")
		local status = line(frame, 39, 16, 12, C.Yellow, "")
		treadTags[t.Id] = { status = status, stroke = stroke, def = t }
	end
end

local function refresh()
	local aura = player:GetAttribute("Aura") or 0
	local own = owned("Own", "gym")
	for id, tag in buildingTags do
		if own[id] then
			tag.status.Text = tag.def.Cost == 0 and "FREE" or "UNLOCKED"
			tag.status.TextColor3 = C.Good
			tag.stroke.Color = tag.def.Main
		else
			tag.status.Text = "🔒 🏆 " .. Util.fmt(tag.def.Cost)
			local can = aura >= tag.def.Cost
			tag.status.TextColor3 = can and C.Yellow or C.Danger
			tag.stroke.Color = can and C.Gold or C.Stroke
		end
	end
	local treads = owned("Treads", "1")
	local running = player:GetAttribute("Running") or 0
	for id, tag in treadTags do
		if running == id then
			tag.status.Text = "RUNNING"
			tag.status.TextColor3 = C.Mint
			tag.stroke.Color = C.Mint
		elseif treads[id] then
			tag.status.Text = "OWNED"
			tag.status.TextColor3 = C.Sky
			tag.stroke.Color = tag.def.Color
		else
			tag.status.Text = "🔒 🏆 " .. Util.fmt(tag.def.Price)
			local can = aura >= tag.def.Price
			tag.status.TextColor3 = can and C.Yellow or C.Danger
			tag.stroke.Color = can and C.Gold or C.Stroke
		end
	end
end

function WorldTags.init()
	buildBuildingTags()
	buildTreadTags()
	refresh()
	task.spawn(function()
		while true do
			task.wait(0.4)
			refresh()
		end
	end)
end

return WorldTags
