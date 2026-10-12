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
	local w = size.X * 1.25 -- a bold headband: wider than the head so the digits can be read from a distance
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
	return { part = plate, label = text3, gui = gui }
end

function Plates.setText(e, text)
	e.shown = text
	local plate = e.plate
	if plate and plate.label then
		plate.label.Text = text
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

-- The big number above the head that everybody can see through walls (exposed players and THE REVEAL).
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
	gui.Size = UDim2.fromOffset(150, 66)
	gui.StudsOffset = Vector3.new(0, 4.4, 0)
	gui.AlwaysOnTop = true
	gui.LightInfluence = 0
	gui.Enabled = false
	gui.Adornee = head
	gui.Parent = head
	local text = label(gui, { Text = "", TextColor3 = Color3.fromRGB(255, 80, 90), TextStrokeTransparency = 0 })
	return { gui = gui, label = text }
end

function Plates.showReveal(e, on)
	local reveal = e.reveal
	if reveal and reveal.gui then
		reveal.gui.Enabled = on
		if on then
			reveal.label.Text = e.number
		end
	end
	if e.plate and e.plate.part then
		e.plate.part.Color = on and Color3.fromRGB(200, 30, 40) or e.styleDef.Back
	end
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
	e.reveal = Plates.attachReveal(char)
	e.shown = e.number
	return e.plate ~= nil
end

return Plates
