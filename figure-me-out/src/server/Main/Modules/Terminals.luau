-- FIGURE ME OUT: information terminals. Hack one to learn something TRUE about your own number (greater than, even or odd,
-- between...). It is risky: your position is shown to everyone for a few seconds. Each player gets a few uses per match, with a
-- pause between them, and the clues can never contradict each other.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Vision = require(script.Parent.Vision)
local Cover = require(script.Parent.Cover)

local Terminals = {}

local rng = Random.new()
local parts = {}

-- Builds the terminal props under `parent` (each one gets a ProximityPrompt).
function Terminals.build(parent)
	parts = {}
	for i, pos in Config.Map.Terminals do
		local base = Instance.new("Part")
		base.Name = "Terminal" .. i
		base.Size = Vector3.new(3, 5, 1.6)
		base.Position = pos + Vector3.new(0, 0.5, 0)
		base.Anchored = true
		base.Color = Color3.fromRGB(40, 110, 170)
		base.Material = Enum.Material.SmoothPlastic
		base.Parent = parent
		local screen = Instance.new("Part")
		screen.Name = "Screen"
		screen.Size = Vector3.new(2.4, 2.4, 0.2)
		screen.Position = pos + Vector3.new(0, 1.6, -0.85)
		screen.Anchored = true
		screen.CanCollide = false
		screen.CanQuery = false
		screen.Color = Color3.fromRGB(120, 245, 255)
		screen.Material = Enum.Material.Neon
		screen.Parent = parent
		local gui = Instance.new("BillboardGui")
		gui.Size = UDim2.fromOffset(110, 34)
		gui.StudsOffset = Vector3.new(0, 4.4, 0)
		gui.MaxDistance = 70
		gui.Adornee = base
		gui.Parent = base
		local text = Instance.new("TextLabel")
		text.Size = UDim2.fromScale(1, 1)
		text.BackgroundTransparency = 1
		text.Font = Enum.Font.GothamBold
		text.TextSize = 16
		text.TextColor3 = Color3.fromRGB(255, 255, 255)
		text.TextStrokeTransparency = 0.3
		text.Text = "🔐 CLUE"
		text.Parent = gui
		local prompt = Instance.new("ProximityPrompt")
		prompt.ActionText = "Hack for a clue (risky)"
		prompt.ObjectText = "Information terminal"
		prompt.HoldDuration = 0.8
		prompt.MaxActivationDistance = Config.Terminal.Range
		prompt.RequiresLineOfSight = false
		prompt.Parent = base
		prompt.Triggered:Connect(function(player)
			Terminals.use(State.byPlayer(player), i)
		end)
		table.insert(parts, base)
	end
	return parts
end

function Terminals.reset(e)
	e.clues = nil
	e.clueUses = 0
	e.terminalAt = {}
end

-- Returns the clue text on success, or nil and the reason.
function Terminals.use(e, index)
	if not e or not e.alive or not e.player or State.phase ~= "play" then
		return nil, "closed"
	end
	local now = State.now()
	local part = parts[index]
	local head = Vision.head(e)
	if part and head and (part.Position - head.Position).Magnitude > Config.Terminal.Range + 6 then
		return nil, "far"
	end
	if (e.clueUses or 0) >= Config.Terminal.Uses then
		Net.toast(e.player, "No terminal uses left this match", "bad")
		return nil, "empty"
	end
	if now - ((e.terminalAt or {})[index] or -1000) < Config.Terminal.Cooldown then
		Net.toast(e.player, "That terminal is still cooling down", "bad")
		return nil, "cooldown"
	end
	if not e.clues then
		e.clues = Rules.clues(tonumber(e.number), Config.Terminal.Uses, function()
			return rng:NextNumber()
		end)
	end
	e.clueUses = (e.clueUses or 0) + 1
	e.terminalAt = e.terminalAt or {}
	e.terminalAt[index] = now
	local clue = e.clues[e.clueUses] or e.clues[#e.clues]
	Net.send(e.player, "clue", clue.text, e.clueUses, Config.Terminal.Uses)
	Cover.expose(e, Config.Terminal.Reveal) -- the risk: everybody sees where you are for a moment
	return clue.text
end

return Terminals
