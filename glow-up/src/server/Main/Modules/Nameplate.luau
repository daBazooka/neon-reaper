-- SUB 5 TO TRUE ADAM: the tag above every player. It says what they are (their looks tier)
-- and their level, so everyone can see who's a Sub 5 and who's a True Adam.
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
	gui.Size = UDim2.fromOffset(320, 66)
	gui.StudsOffset = Vector3.new(0, 3.4, 0)
	gui.AlwaysOnTop = false
	gui.MaxDistance = 110
	gui.LightInfluence = 0
	gui.Parent = head

	local tier = Instance.new("TextLabel")
	tier.Name = "Rank"
	tier.Size = UDim2.new(1, 0, 0, 36)
	tier.BackgroundTransparency = 1
	tier.Font = Enum.Font.GothamBlack
	tier.TextScaled = true
	tier.TextStrokeTransparency = 0
	tier.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
	tier.Parent = gui

	local name = Instance.new("TextLabel")
	name.Name = "Name"
	name.Position = UDim2.fromOffset(0, 36)
	name.Size = UDim2.new(1, 0, 0, 22)
	name.BackgroundTransparency = 1
	name.Font = Enum.Font.GothamBold
	name.TextSize = 17
	name.TextColor3 = Color3.new(1, 1, 1)
	name.TextStrokeTransparency = 0.2
	name.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
	name.Parent = gui
end

local function refresh(p)
	local head = p.Character and p.Character:FindFirstChild("Head")
	local gui = head and head:FindFirstChild("GlowPlate")
	if not gui then
		return
	end
	local rank = Config.Ranks[p:GetAttribute("Rank") or 1]
	local stars = p:GetAttribute("Rebirths") or 0
	gui.Rank.Text = (stars > 0 and ("★" .. stars .. " ") or "") .. rank.Full:upper()
	gui.Rank.TextColor3 = rank.Color
	gui.Name.Text = string.format("%s  ·  Lv %s", p.DisplayName, Util.fmt(p:GetAttribute("Level") or 1))
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
	for _, attr in { "Rank", "Level", "Rebirths" } do
		p:GetAttributeChangedSignal(attr):Connect(function()
			refresh(p)
		end)
	end
end

return Nameplate
