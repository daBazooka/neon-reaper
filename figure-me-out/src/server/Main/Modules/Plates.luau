-- FIGURE ME OUT: everything on a player's body for the game. The number plate on the forehead (only visible from the
-- front), the codename tag above the head, the plain coloured outfit, and the "exposed" number that floats above the
-- head of someone who covered their number or when THE REVEAL begins.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local Plates = {}

local PLATE_NAME = "NumberPlate"

local function weld(a, b)
	local w = Instance.new("WeldConstraint")
	w.Part0 = a
	w.Part1 = b
	w.Parent = b
end

local function label(parent, props)
	local l = Instance.new("TextLabel")
	l.BackgroundTransparency = 1
	l.Size = UDim2.fromScale(1, 1)
	l.Font = Enum.Font.GothamBlack
	l.TextScaled = true
	for k, v in props do
		l[k] = v
	end
	l.Parent = parent
	return l
end

-- Puts the plate on the forehead and returns { part, label }. The plate is flat and faces forward, so you can only
-- read it when you can see the front of the head.
function Plates.attachPlate(char, style, text)
	local head = char:FindFirstChild("Head")
	if not head then
		return nil
	end
	local old = head:FindFirstChild(PLATE_NAME)
	if old then
		old:Destroy()
	end
	local size = head.Size
	local w = size.X * 1.5 -- a bold headband: wider than the head so the digits can be read from a distance
	local h = w * 0.5
	local y = size.Y * 0.2
	local z = -(size.Z / 2) - 0.05
	local plate = Instance.new("Part")
	plate.Name = PLATE_NAME
	plate.Size = Vector3.new(w, h, 0.1)
	plate.Color = style.Back
	plate.Material = Enum.Material.SmoothPlastic
	plate.CanCollide = false
	plate.CanQuery = false
	plate.CanTouch = false
	plate.Massless = true
	plate.CFrame = head.CFrame * CFrame.new(0, y, z)
	plate.Parent = head
	weld(head, plate)
	local rim = Instance.new("Part")
	rim.Name = "PlateRim"
	rim.Size = Vector3.new(w + 0.12, h + 0.12, 0.08)
	rim.Color = style.Rim
	rim.Material = Enum.Material.Neon
	rim.CanCollide = false
	rim.CanQuery = false
	rim.CanTouch = false
	rim.Massless = true
	rim.CFrame = head.CFrame * CFrame.new(0, y, z + 0.03)
	rim.Parent = head
	weld(head, rim)
	local gui = Instance.new("SurfaceGui")
	gui.Name = "PlateGui"
	gui.Face = Enum.NormalId.Front
	gui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
	gui.CanvasSize = Vector2.new(330, 175)
	gui.LightInfluence = 0
	gui.Brightness = 1.4
	gui.MaxDistance = 500
	gui.Parent = plate
	local text3 = label(gui, { Text = text, TextColor3 = style.Text, Name = "Digits" })
	local glow = Instance.new("PointLight")
	glow.Range = 10
	glow.Brightness = 2
	glow.Color = Color3.fromRGB(255, 70, 70)
	glow.Enabled = false
	glow.Parent = plate
	return { part = plate, rim = rim, light = glow, label = text3, gui = gui }
end

function Plates.setText(e, text)
	e.shown = text
	local plate = e.plate
	if plate and plate.label then
		plate.label.Text = text
	end
	if e.numberTag and e.numberTag.label then
		e.numberTag.label.Text = text
	end
end

-- The codename tag that floats above the head ("🦊 Red Fox").
function Plates.attachTag(char, text, color)
	local head = char:FindFirstChild("Head")
	if not head then
		return nil
	end
	local old = head:FindFirstChild("CodeTag")
	if old then
		old:Destroy()
	end
	local gui = Instance.new("BillboardGui")
	gui.Name = "CodeTag"
	gui.Size = UDim2.fromOffset(190, 30)
	gui.StudsOffset = Vector3.new(0, 2.4, 0)
	gui.MaxDistance = 130
	gui.AlwaysOnTop = false
	gui.LightInfluence = 0
	gui.Adornee = head
	gui.Parent = head
	label(gui, { Text = text, TextColor3 = color, TextStrokeTransparency = 0.3, TextScaled = false, TextSize = 18 })
	return gui
end

-- The big number that floats above the head (everybody but you sees it; OwnPlate hides it on your own screen). It is drawn
-- in the world, so walls hide it, and it only shows within Config.Number.TagRange studs.
function Plates.attachNumberTag(char, text)
	local head = char:FindFirstChild("Head")
	if not head then
		return nil
	end
	local old = head:FindFirstChild("NumberTag")
	if old then
		old:Destroy()
	end
	local gui = Instance.new("BillboardGui")
	gui.Name = "NumberTag"
	gui.Size = UDim2.fromOffset(120, 46)
	gui.StudsOffset = Vector3.new(0, 3.6, 0)
	gui.MaxDistance = Config.Number.TagRange
	gui.AlwaysOnTop = false
	gui.LightInfluence = 0
	gui.Adornee = head
	gui.Parent = head
	local text3 = label(gui, { Name = "TagDigits", Text = text, TextColor3 = Color3.fromRGB(255, 232, 90), TextStrokeColor3 = Color3.fromRGB(20, 40, 90), TextStrokeTransparency = 0, Font = Enum.Font.FredokaOne })
	return { gui = gui, label = text3 }
end

-- A small eye marker above the head of an exposed player (no digits: the number is only ever on the forehead).
function Plates.attachReveal(char)
	local head = char:FindFirstChild("Head")
	if not head then
		return nil
	end
	local old = head:FindFirstChild("RevealTag")
	if old then
		old:Destroy()
	end
	local gui = Instance.new("BillboardGui")
	gui.Name = "RevealTag"
	gui.Size = UDim2.fromOffset(80, 28)
	gui.StudsOffset = Vector3.new(0, 4.2, 0)
	gui.AlwaysOnTop = true
	gui.LightInfluence = 0
	gui.Enabled = false
	gui.Adornee = head
	gui.Parent = head
	local text = label(gui, { Text = "👁 SEEN", TextColor3 = Color3.fromRGB(255, 90, 90), TextStrokeTransparency = 0.2, TextScaled = false, TextSize = 16 })
	return { gui = gui, label = text }
end

-- The rim is red when you are exposed (or in the final stretch), otherwise the plate's own colour.
function Plates.refreshRim(e)
	local plate = e.plate
	if not plate or not plate.rim then
		return
	end
	local now = workspace:GetServerTimeNow()
	local color = e.styleDef.Rim
	local lit = false
	if e.revealed then
		color, lit = Color3.fromRGB(255, 60, 60), true
	end
	plate.rim.Color = color
	plate.light.Color = color
	plate.light.Enabled = lit
end

-- Makes the forehead plate glow (red rim and light) and, with `marker`, shows the eye marker above the head.
function Plates.showReveal(e, on, marker)
	e.revealed = on
	local reveal = e.reveal
	if reveal and reveal.gui then
		reveal.gui.Enabled = on and marker == true
	end
	Plates.refreshRim(e)
end

-- Takes the number off a player who is out of the match.
function Plates.hide(e)
	local plate = e.plate
	if plate and plate.part then
		plate.part.Transparency = 1
		plate.rim.Transparency = 1
		plate.gui.Enabled = false
		plate.light.Enabled = false
	end
	if e.numberTag and e.numberTag.gui then
		e.numberTag.gui.Enabled = false
	end
	if e.reveal and e.reveal.gui then
		e.reveal.gui.Enabled = false
	end
	if e.bountyTag and e.bountyTag.gui then
		e.bountyTag.gui.Enabled = false
	end
	if e.flagTag and e.flagTag.gui then
		e.flagTag.gui.Enabled = false
	end
end

-- A small tag over the head of the bounty target: it names the prize, never the number.
function Plates.attachBounty(char)
	local head = char:FindFirstChild("Head")
	if not head then
		return nil
	end
	local old = head:FindFirstChild("BountyTag")
	if old then
		old:Destroy()
	end
	local gui = Instance.new("BillboardGui")
	gui.Name = "BountyTag"
	gui.Size = UDim2.fromOffset(120, 28)
	gui.StudsOffset = Vector3.new(0, 5.4, 0)
	gui.AlwaysOnTop = true
	gui.LightInfluence = 0
	gui.Enabled = false
	gui.Adornee = head
	gui.Parent = head
	local text = label(gui, { Text = "", TextColor3 = Color3.fromRGB(255, 226, 90), TextStrokeTransparency = 0.2, TextScaled = false, TextSize = 16 })
	return { gui = gui, label = text }
end

function Plates.showBounty(e, on, reward)
	local tag = e.bountyTag
	if tag and tag.gui then
		tag.gui.Enabled = on
		tag.label.Text = on and ("🎯 BOUNTY +" .. reward) or ""
	end
end

-- The flag carrier's tag: everybody can see who has a flag.
function Plates.attachFlagTag(char)
	local head = char:FindFirstChild("Head")
	if not head then
		return nil
	end
	local old = head:FindFirstChild("FlagTag")
	if old then
		old:Destroy()
	end
	local gui = Instance.new("BillboardGui")
	gui.Name = "FlagTag"
	gui.Size = UDim2.fromOffset(150, 28)
	gui.StudsOffset = Vector3.new(0, 6.6, 0)
	gui.AlwaysOnTop = true
	gui.LightInfluence = 0
	gui.Enabled = false
	gui.Adornee = head
	gui.Parent = head
	local text = label(gui, { Text = "", TextColor3 = Color3.new(1, 1, 1), TextStrokeTransparency = 0.2, TextScaled = false, TextSize = 16 })
	return { gui = gui, label = text }
end

function Plates.showFlag(e, on, teamDef)
	local tag = e.flagTag
	if tag and tag.gui then
		tag.gui.Enabled = on
		tag.label.Text = on and ("🚩 " .. teamDef.Name .. " FLAG") or ""
		tag.label.TextColor3 = on and teamDef.Color or Color3.new(1, 1, 1)
	end
end

-- A short emoji bubble above the head (emotes).
function Plates.bubble(char, icon, seconds)
	local head = char and char:FindFirstChild("Head")
	if not head then
		return
	end
	local old = head:FindFirstChild("EmoteBubble")
	if old then
		old:Destroy()
	end
	local gui = Instance.new("BillboardGui")
	gui.Name = "EmoteBubble"
	gui.Size = UDim2.fromOffset(60, 60)
	gui.StudsOffset = Vector3.new(0, 3.2, 0)
	gui.LightInfluence = 0
	gui.Adornee = head
	gui.Parent = head
	label(gui, { Text = icon, TextColor3 = Color3.new(1, 1, 1), TextStrokeTransparency = 1 })
	task.delay(seconds, function()
		gui:Destroy()
	end)
end

-- A coloured trail behind the character (cosmetic).
function Plates.attachTrail(char, trailDef)
	local root = char:FindFirstChild("HumanoidRootPart")
	local old = root and root:FindFirstChild("CosmeticTrail")
	if old then
		old:Destroy()
	end
	if not root or not trailDef or trailDef.Id == "none" then
		return nil
	end
	local a0, a1 = Instance.new("Attachment"), Instance.new("Attachment")
	a0.Position = Vector3.new(0, 0.9, 0)
	a1.Position = Vector3.new(0, -0.9, 0)
	a0.Parent, a1.Parent = root, root
	local trail = Instance.new("Trail")
	trail.Name = "CosmeticTrail"
	trail.Attachment0, trail.Attachment1 = a0, a1
	trail.Color = ColorSequence.new(trailDef.Color)
	trail.Lifetime = 0.7
	trail.LightEmission = 0.6
	trail.Transparency = NumberSequence.new(0.2, 1)
	trail.Parent = root
	return trail
end

-- Plain coloured clothes and no accessories, so nobody can hide their forehead under a hat.
function Plates.dress(char, color)
	for _, name in { "Shirt", "Pants", "ShirtGraphic" } do
		local item = char:FindFirstChildOfClass(name)
		if item then
			item:Destroy()
		end
	end
	local humanoid = char:FindFirstChildOfClass("Humanoid")
	if humanoid then
		pcall(function()
			humanoid:RemoveAccessories()
		end)
		-- the codename is the only name: no username or health bar over anybody's head
		humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
		humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.AlwaysOff
	end
	local colors = char:FindFirstChildOfClass("BodyColors")
	if not colors then
		colors = Instance.new("BodyColors")
		colors.Parent = char
	end
	colors.TorsoColor3 = color
	colors.LeftArmColor3 = color
	colors.RightArmColor3 = color
	colors.LeftLegColor3 = color:Lerp(Color3.new(0, 0, 0), 0.25)
	colors.RightLegColor3 = color:Lerp(Color3.new(0, 0, 0), 0.25)
end

-- Everything for one entity. e needs char, code, icon, color, number and style.
function Plates.setup(e)
	local char = e.char
	if not char then
		return false
	end
	e.styleDef = Config.PlateStyleById[e.style or "classic"] or Config.PlateStyles[1]
	Plates.dress(char, e.color)
	e.plate = Plates.attachPlate(char, e.styleDef, e.number)
	e.tag = Plates.attachTag(char, e.icon .. " " .. e.code, e.color)
	e.numberTag = Plates.attachNumberTag(char, e.number)
	e.reveal = Plates.attachReveal(char)
	e.bountyTag = Plates.attachBounty(char)
	e.flagTag = Plates.attachFlagTag(char)
	e.trail = Plates.attachTrail(char, e.trailDef)
	e.shown = e.number
	return e.plate ~= nil
end

return Plates
