-- GLOW UP: the rank tag floating above every player. Looks matter, so it's always visible.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Util = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Util"))

local Nameplate = {}

local function build(p, head)
	local old = head:FindFirstChild("GlowPlate")
	if old then
		old:Destroy()
	end
	local gui = Instance.new("BillboardGui")
	gui.Name = "GlowPlate"
	gui.Size = UDim2.fromOffset(240, 62)
	gui.StudsOffset = Vector3.new(0, 3.1, 0)
	gui.AlwaysOnTop = false
	gui.MaxDistance = 90
	gui.LightInfluence = 0
	gui.Parent = head

	local rank = Instance.new("TextLabel")
	rank.Name = "Rank"
	rank.Size = UDim2.new(1, 0, 0, 30)
	rank.BackgroundTransparency = 1
	rank.Font = Enum.Font.GothamBlack
	rank.TextSize = 24
	rank.TextStrokeTransparency = 0.35
	rank.TextStrokeColor3 = Color3.fromRGB(12, 8, 30)
	rank.Parent = gui

	local name = Instance.new("TextLabel")
	name.Name = "Name"
	name.Position = UDim2.fromOffset(0, 30)
	name.Size = UDim2.new(1, 0, 0, 22)
	name.BackgroundTransparency = 1
	name.Font = Enum.Font.GothamBold
	name.TextSize = 16
	name.TextColor3 = Color3.new(1, 1, 1)
	name.TextStrokeTransparency = 0.5
	name.TextStrokeColor3 = Color3.fromRGB(12, 8, 30)
	name.Text = p.DisplayName
	name.Parent = gui
end

local function refresh(p)
	local head = p.Character and p.Character:FindFirstChild("Head")
	local gui = head and head:FindFirstChild("GlowPlate")
	if not gui then
		return
	end
	local rankIndex = p:GetAttribute("Rank") or 1
	local rank = Config.Ranks[rankIndex]
	local stars = p:GetAttribute("Rebirths") or 0
	gui.Rank.Text = (stars > 0 and ("★" .. stars .. " ") or "") .. rank.Name:upper() .. "  " .. Util.fmt(p:GetAttribute("GlowScore") or 0)
	gui.Rank.TextColor3 = rank.Color
end

function Nameplate.onCharacter(p)
	local char = p.Character
	local head = char and char:WaitForChild("Head", 5)
	if not head then
		return
	end
	local hum = char:FindFirstChildOfClass("Humanoid")
	if hum then
		hum.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	end
	build(p, head)
	refresh(p)
end

function Nameplate.init(p)
	for _, attr in { "Rank", "GlowScore", "Rebirths" } do
		p:GetAttributeChangedSignal(attr):Connect(function()
			refresh(p)
		end)
	end
end

return Nameplate
