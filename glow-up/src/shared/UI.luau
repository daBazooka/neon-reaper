-- GLOW UP: the client design system. One place for colours, fonts and reusable components
-- so every screen looks like it belongs to the same game.
local TweenService = game:GetService("TweenService")

local Config = require(script.Parent:WaitForChild("Config"))
local Util = require(script.Parent:WaitForChild("Util"))

local UI = {}

UI.Colors = {
	Bg = Color3.fromRGB(13, 10, 28),
	Panel = Color3.fromRGB(22, 17, 46),
	Card = Color3.fromRGB(34, 27, 68),
	CardHover = Color3.fromRGB(46, 37, 90),
	Stroke = Color3.fromRGB(120, 96, 220),
	Text = Color3.fromRGB(244, 240, 255),
	Muted = Color3.fromRGB(167, 158, 206),
	Accent = Color3.fromRGB(150, 92, 255),
	Accent2 = Color3.fromRGB(255, 92, 190),
	Good = Color3.fromRGB(64, 214, 128),
	Gold = Color3.fromRGB(255, 204, 84),
	Cyan = Color3.fromRGB(90, 214, 255),
	Danger = Color3.fromRGB(255, 92, 110),
	Disabled = Color3.fromRGB(70, 64, 104),
}

UI.Fonts = {
	Title = Enum.Font.GothamBlack,
	Bold = Enum.Font.GothamBold,
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
		Thickness = thickness or 1.5,
		Transparency = transparency or 0.55,
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
		BackgroundTransparency = 0.08,
		BorderSizePixel = 0,
	}
	local radius = props.Radius or 16
	for k, v in props do
		if k ~= "Radius" then
			base[k] = v
		end
	end
	local frame = UI.new("Frame", base, parent)
	UI.corner(frame, radius)
	UI.stroke(frame)
	return frame
end

-- Button with hover/press feedback. style: "primary" (gradient) | "card" | "ghost".
function UI.button(parent, props, style)
	style = style or "primary"
	local base = {
		AutoButtonColor = false,
		BorderSizePixel = 0,
		Font = UI.Fonts.Bold,
		TextSize = 16,
		TextColor3 = UI.Colors.Text,
		Text = "",
		BackgroundColor3 = style == "card" and UI.Colors.Card or UI.Colors.Accent,
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
	local grad
	if style == "primary" then
		grad = UI.gradient(btn, UI.Colors.Accent, UI.Colors.Accent2, 35)
	end
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
	local fill = UI.new("Frame", {
		BackgroundColor3 = fillColor or UI.Colors.Accent,
		BorderSizePixel = 0,
		Size = UDim2.fromScale(0, 1),
	}, back)
	UI.corner(fill, 99)
	local self = { back = back, fill = fill }
	function self.set(alpha)
		fill.Size = UDim2.fromScale(math.clamp(alpha, 0, 1), 1)
	end
	return self
end

function UI.rarityColor(rarity)
	return Config.Rarities[rarity].Color
end

return UI
