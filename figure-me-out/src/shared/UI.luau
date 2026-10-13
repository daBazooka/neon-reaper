-- FIGURE ME OUT: the client design system. One place for colours, fonts and reusable components
-- so every screen looks like it belongs to the same game.
local TweenService = game:GetService("TweenService")

local Config = require(script.Parent:WaitForChild("Config"))
local Util = require(script.Parent:WaitForChild("Util"))

local UI = {}

-- Frutiger Aero: glossy aqua glass with white text, fresh green and sunny yellow accents.
UI.Colors = {
	Bg = Color3.fromRGB(10, 52, 92),
	Panel = Color3.fromRGB(30, 118, 178),
	Card = Color3.fromRGB(52, 150, 205),
	CardHover = Color3.fromRGB(86, 186, 235),
	Stroke = Color3.fromRGB(10, 56, 104),
	Text = Color3.fromRGB(255, 255, 255),
	Muted = Color3.fromRGB(205, 232, 250),
	Accent = Color3.fromRGB(130, 245, 255),
	Accent2 = Color3.fromRGB(70, 200, 90),
	Good = Color3.fromRGB(90, 214, 96),
	Gold = Color3.fromRGB(255, 226, 90),
	Cyan = Color3.fromRGB(110, 235, 255),
	Danger = Color3.fromRGB(255, 96, 96),
	Disabled = Color3.fromRGB(110, 150, 180),
	Pink = Color3.fromRGB(255, 130, 190),
	Orange = Color3.fromRGB(255, 170, 70),
	Mint = Color3.fromRGB(140, 250, 210),
	Purple = Color3.fromRGB(180, 150, 255),
	Sky = Color3.fromRGB(150, 210, 255),
	Yellow = Color3.fromRGB(255, 232, 100),
}

UI.Fonts = {
	Title = Enum.Font.FredokaOne,
	Bold = Enum.Font.FredokaOne,
	Body = Enum.Font.GothamMedium,
}

UI.fmt = Util.fmt

function UI.new(class, props, parent)
	local inst = Instance.new(class)
	for k, v in props do
		inst[k] = v
	end
	inst.Parent = parent
	return inst
end

function UI.corner(inst, radius)
	return UI.new("UICorner", { CornerRadius = UDim.new(0, radius or 12) }, inst)
end

function UI.stroke(inst, color, thickness, transparency)
	return UI.new("UIStroke", {
		Color = color or UI.Colors.Stroke,
		Thickness = thickness or 2.5,
		Transparency = transparency or 0,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
	}, inst)
end

function UI.gradient(inst, c1, c2, rotation)
	return UI.new("UIGradient", {
		Color = ColorSequence.new(c1, c2),
		Rotation = rotation or 90,
	}, inst)
end

function UI.padding(inst, all)
	return UI.new("UIPadding", {
		PaddingTop = UDim.new(0, all),
		PaddingBottom = UDim.new(0, all),
		PaddingLeft = UDim.new(0, all),
		PaddingRight = UDim.new(0, all),
	}, inst)
end

function UI.tween(inst, seconds, props, style, direction)
	local t = TweenService:Create(
		inst,
		TweenInfo.new(seconds, style or Enum.EasingStyle.Quad, direction or Enum.EasingDirection.Out),
		props
	)
	t:Play()
	return t
end

-- Squash-and-stretch on a UIScale.
function UI.pop(scaleObj, amount)
	scaleObj.Scale = amount or 1.12
	UI.tween(scaleObj, 0.28, { Scale = 1 }, Enum.EasingStyle.Back)
end

function UI.label(parent, props)
	local base = {
		BackgroundTransparency = 1,
		Font = UI.Fonts.Body,
		TextSize = 16,
		TextColor3 = UI.Colors.Text,
		TextXAlignment = Enum.TextXAlignment.Left,
		TextWrapped = true,
		RichText = false,
		TextStrokeColor3 = Color3.new(0, 0, 0),
		TextStrokeTransparency = 0.6,
	}
	for k, v in props do
		base[k] = v
	end
	return UI.new("TextLabel", base, parent)
end

-- A rounded glass panel.
function UI.panel(parent, props)
	local base = {
		BackgroundColor3 = UI.Colors.Panel,
		BackgroundTransparency = 0,
		BorderSizePixel = 0,
	}
	local radius = props.Radius or 14
	for k, v in props do
		if k ~= "Radius" then
			base[k] = v
		end
	end
	base.BackgroundTransparency = props.BackgroundTransparency or 0.12
	local frame = UI.new("Frame", base, parent)
	UI.corner(frame, radius)
	UI.stroke(frame, Color3.fromRGB(255, 255, 255), 1.5, 0.35)
	UI.gradient(frame, Color3.new(1, 1, 1), Color3.fromRGB(160, 205, 235), 90)
	-- the shiny top half of aero glass
	local gloss = UI.new("Frame", {
		Name = "Gloss",
		Size = UDim2.new(1, 0, 0.5, 0),
		BackgroundColor3 = Color3.new(1, 1, 1),
		BackgroundTransparency = 0.86,
		BorderSizePixel = 0,
		Active = false,
	}, frame)
	UI.corner(gloss, radius)
	return frame
end

-- Button with hover/press feedback. style: "primary" (gradient) | "card" | "ghost".
function UI.button(parent, props, style)
	style = style or "primary"
	local base = {
		AutoButtonColor = false,
		BorderSizePixel = 0,
		Font = UI.Fonts.Title,
		TextSize = 16,
		TextColor3 = UI.Colors.Text,
		Text = "",
		BackgroundColor3 = style == "card" and UI.Colors.Card or UI.Colors.Good,
		TextStrokeColor3 = Color3.new(0, 0, 0),
		TextStrokeTransparency = 0.3,
	}
	local radius = props.Radius or 12
	for k, v in props do
		if k ~= "Radius" then
			base[k] = v
		end
	end
	local btn = UI.new("TextButton", base, parent)
	UI.corner(btn, radius)
	local scale = UI.new("UIScale", {}, btn)
	UI.stroke(btn, UI.Colors.Stroke, 2.5, 0)
	local grad = UI.gradient(btn, Color3.new(1, 1, 1), Color3.fromRGB(150, 200, 235), 90)
	local baseColor = base.BackgroundColor3
	btn.MouseEnter:Connect(function()
		UI.tween(scale, 0.12, { Scale = 1.04 })
		if style == "card" then
			UI.tween(btn, 0.12, { BackgroundColor3 = UI.Colors.CardHover })
		end
	end)
	btn.MouseLeave:Connect(function()
		UI.tween(scale, 0.12, { Scale = 1 })
		if style == "card" then
			UI.tween(btn, 0.12, { BackgroundColor3 = baseColor })
		end
	end)
	btn.MouseButton1Down:Connect(function()
		UI.tween(scale, 0.06, { Scale = 0.95 })
	end)
	btn.MouseButton1Up:Connect(function()
		UI.tween(scale, 0.1, { Scale = 1.04 })
	end)
	return btn, scale, grad
end

-- Frees the mouse while this window is visible. In first person Roblox locks the cursor to the middle of the screen; a visible
-- button with Modal = true is the supported way to get the cursor back so the window's buttons can be clicked.
function UI.modal(window)
	return UI.new("TextButton", {
		Name = "Modal",
		Modal = true,
		Size = UDim2.fromOffset(1, 1),
		BackgroundTransparency = 1,
		Text = "",
		AutoButtonColor = false,
		ZIndex = 1,
	}, window)
end

-- Horizontal progress bar. Returns an object with :set(alpha) and .fill / .back.
function UI.bar(parent, props, fillColor)
	local back = UI.new("Frame", {
		BackgroundColor3 = Color3.fromRGB(14, 11, 32),
		BorderSizePixel = 0,
		Size = props.Size or UDim2.new(1, 0, 0, 10),
		Position = props.Position or UDim2.new(),
		AnchorPoint = props.AnchorPoint or Vector2.zero,
	}, parent)
	UI.corner(back, 99)
	UI.stroke(back, UI.Colors.Stroke, 2, 0)
	local fill = UI.new("Frame", {
		BackgroundColor3 = fillColor or UI.Colors.Accent,
		BorderSizePixel = 0,
		Size = UDim2.fromScale(0, 1),
	}, back)
	UI.corner(fill, 99)
	UI.gradient(fill, Color3.new(1, 1, 1), Color3.fromRGB(170, 176, 190), 90)
	local self = { back = back, fill = fill }
	function self.set(alpha)
		fill.Size = UDim2.fromScale(math.clamp(alpha, 0, 1), 1)
	end
	return self
end


return UI
