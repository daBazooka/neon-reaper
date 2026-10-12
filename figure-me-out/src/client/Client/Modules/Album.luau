-- FIGURE ME OUT: the photo notebook. Every photo fills in the digits you could read; several blurry photos of the same
-- person add up to a full number. When a number is complete you can fire straight from the notebook.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local UI = require(Shared:WaitForChild("UI"))
local Audio = require(Shared:WaitForChild("Audio"))
local View = require(script.Parent:WaitForChild("View"))

local Album = {}

local C = UI.Colors
local deps
local gui
local panel, list, empty
local popup
local notebook = {} -- id -> { id, code, icon, digits, seen, count }

function Album.reset()
	notebook = {}
	if panel and panel.Visible then
		Album.refresh()
	end
end

function Album.isOpen()
	return panel ~= nil and panel.Visible
end

function Album.entry(id)
	return notebook[id]
end

-- The notebook entry as a 3-character string like "4?2".
function Album.text(id)
	local n = notebook[id]
	return n and table.concat(n.digits) or nil
end

function Album.complete(id)
	local n = notebook[id]
	return n ~= nil and not table.find(n.digits, "?")
end

function Album.init(screen, d)
	deps = d
	gui = screen
	panel = UI.panel(gui, {
		Name = "Notebook",
		AnchorPoint = Vector2.new(1, 0.5),
		Position = UDim2.new(1, -14, 0.5, 0),
		Size = UDim2.fromOffset(340, 430),
		Visible = false,
		ZIndex = 25,
	})
	UI.label(panel, {
		Position = UDim2.fromOffset(14, 8),
		Size = UDim2.new(1, -60, 0, 28),
		Font = UI.Fonts.Title,
		TextSize = 20,
		Text = "📒 NOTEBOOK",
		ZIndex = 26,
	})
	local close = UI.button(panel, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -10, 0, 8),
		Size = UDim2.fromOffset(34, 28),
		Text = "✕",
		TextSize = 16,
		BackgroundColor3 = C.Danger,
		ZIndex = 26,
	})
	close.MouseButton1Click:Connect(Album.close)
	local share = UI.button(panel, {
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -52, 0, 8),
		Size = UDim2.fromOffset(110, 28),
		Text = "🤝 SHARE",
		TextSize = 13,
		BackgroundColor3 = C.Accent2,
		ZIndex = 26,
	})
	share.MouseButton1Click:Connect(function()
		Album.share()
	end)
	UI.label(panel, {
		Position = UDim2.fromOffset(14, 38),
		Size = UDim2.new(1, -28, 0, 30),
		Font = UI.Fonts.Body,
		TextSize = 12,
		TextColor3 = C.Muted,
		Text = "Photos fill in digits. Take several photos of the same person to read the whole number.",
		ZIndex = 26,
	})
	list = UI.new("ScrollingFrame", {
		Position = UDim2.fromOffset(10, 74),
		Size = UDim2.new(1, -20, 1, -84),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		ScrollBarThickness = 5,
		CanvasSize = UDim2.new(),
		AutomaticCanvasSize = Enum.AutomaticSize.Y,
		ZIndex = 26,
	}, panel)
	UI.new("UIListLayout", { SortOrder = Enum.SortOrder.LayoutOrder, Padding = UDim.new(0, 6) }, list)
	empty = UI.label(panel, {
		Position = UDim2.fromOffset(20, 150),
		Size = UDim2.new(1, -40, 0, 80),
		Font = UI.Fonts.Bold,
		TextSize = 15,
		TextColor3 = C.Muted,
		TextXAlignment = Enum.TextXAlignment.Center,
		Text = "No photos yet.\nClick (or press F) to take one!",
		ZIndex = 26,
	})
	task.spawn(function()
		while true do
			task.wait(1)
			if panel.Visible then
				Album.refresh()
			end
		end
	end)
end

-- What your notebook says about each person (only entries with at least one known digit): { { id, "4?7" } }.
function Album.rows()
	local rows = {}
	for id, n in notebook do
		local text = table.concat(n.digits)
		if text ~= "???" then
			table.insert(rows, { id, text })
		end
	end
	return rows
end

-- Sends your notes to your ally. They get them as photos; you may of course lie.
function Album.share()
	if (Players.LocalPlayer:GetAttribute("Ally") or 0) == 0 then
		deps.Toasts.push("You have no ally. Aim at a player and press T", "bad")
		return
	end
	local rows = Album.rows()
	if #rows == 0 then
		deps.Toasts.push("Nothing to share yet: take some photos", "bad")
		return
	end
	deps.send("Share", rows)
	deps.Toasts.push("Shared " .. #rows .. " notes with your ally", "good")
end

function Album.refresh()
	if not list then
		return
	end
	for _, child in list:GetChildren() do
		if child:IsA("Frame") then
			child:Destroy()
		end
	end
	local rows = {}
	for _, n in notebook do
		table.insert(rows, n)
	end
	table.sort(rows, function(a, b)
		return a.seen > b.seen
	end)
	empty.Visible = #rows == 0
	local now = View.now()
	for i, n in rows do
		if i > Config.Photo.Album then
			break
		end
		local e = View.byId(n.id)
		local out = e == nil or not e.alive
		local card = UI.new("Frame", {
			LayoutOrder = out and 1000 + i or i,
			Size = UDim2.new(1, -6, 0, 58),
			BackgroundColor3 = C.Card,
			BorderSizePixel = 0,
			ZIndex = 27,
		}, list)
		UI.corner(card, 10)
		UI.stroke(card, C.Stroke, 2)
		UI.label(card, {
			Position = UDim2.fromOffset(10, 6),
			Size = UDim2.new(0.55, 0, 0, 20),
			Font = UI.Fonts.Bold,
			TextSize = 14,
			TextWrapped = false,
			Text = n.icon .. " " .. n.code,
			ZIndex = 28,
		})
		UI.label(card, {
			Position = UDim2.fromOffset(10, 32),
			Size = UDim2.new(0.55, 0, 0, 18),
			Font = UI.Fonts.Body,
			TextSize = 11,
			TextColor3 = C.Muted,
			Text = (out and "OUT / gone" or "seen " .. math.max(0, math.floor(now - n.seen)) .. "s ago") .. (n.count > 1 and ("  •  " .. n.count .. " photos") or ""),
			ZIndex = 28,
		})
		for k = 1, Config.Number.Digits do
			local ch = n.digits[k]
			local box = UI.new("Frame", {
				Position = UDim2.new(0.55, (k - 1) * 30, 0, 12),
				Size = UDim2.fromOffset(26, 34),
				BackgroundColor3 = C.Bg,
				BorderSizePixel = 0,
				ZIndex = 28,
			}, card)
			UI.corner(box, 6)
			UI.label(box, {
				Size = UDim2.fromScale(1, 1),
				Font = UI.Fonts.Title,
				TextSize = 22,
				TextXAlignment = Enum.TextXAlignment.Center,
				TextColor3 = ch == "?" and C.Muted or C.Gold,
				Text = ch,
				ZIndex = 29,
			})
		end
		if not out and not table.find(n.digits, "?") then
			local fire = UI.button(card, {
				AnchorPoint = Vector2.new(1, 0.5),
				Position = UDim2.new(1, -8, 0.5, 0),
				Size = UDim2.fromOffset(52, 34),
				Text = "FIRE",
				TextSize = 14,
				BackgroundColor3 = C.Accent2,
				ZIndex = 29,
			})
			fire.MouseButton1Click:Connect(function()
				deps.Controls.fireFromNotebook(n.id, table.concat(n.digits), n)
			end)
		end
		if out then
			card.BackgroundTransparency = 0.5
		end
	end
end

function Album.open()
	if panel then
		panel.Visible = true
		Album.refresh()
		Audio.click()
	end
end

function Album.close()
	if panel then
		panel.Visible = false
	end
end

function Album.toggle()
	if Album.isOpen() then
		Album.close()
	else
		Album.open()
	end
end

-- A little photo card slides in after every shot.
local function showPopup(entries)
	if popup then
		popup:Destroy()
	end
	local height = 34 + math.max(1, #entries) * 22
	popup = UI.panel(gui, {
		AnchorPoint = Vector2.new(1, 1),
		Position = UDim2.new(1, -14, 1, -90),
		Size = UDim2.fromOffset(250, height),
		ZIndex = 24,
	})
	UI.label(popup, {
		Position = UDim2.fromOffset(10, 4),
		Size = UDim2.new(1, -20, 0, 22),
		Font = UI.Fonts.Title,
		TextSize = 15,
		TextColor3 = C.Accent,
		Text = "📷 PHOTO",
		ZIndex = 25,
	})
	if #entries == 0 then
		UI.label(popup, {
			Position = UDim2.fromOffset(10, 28),
			Size = UDim2.new(1, -20, 0, 20),
			Font = UI.Fonts.Body,
			TextSize = 13,
			TextColor3 = C.Muted,
			Text = "Nobody in frame",
			ZIndex = 25,
		})
	end
	for i, e in entries do
		UI.label(popup, {
			Position = UDim2.fromOffset(10, 6 + i * 22),
			Size = UDim2.new(1, -20, 0, 20),
			Font = UI.Fonts.Bold,
			TextSize = 13,
			TextXAlignment = Enum.TextXAlignment.Left,
			TextWrapped = false,
			Text = e[3] .. " " .. e[2] .. "   " .. e[4] .. "   " .. e[5] .. "m",
			ZIndex = 25,
		})
	end
	local mine = popup
	task.delay(4.5, function()
		if popup == mine then
			popup:Destroy()
			popup = nil
		end
	end)
end

-- entries: { { id, code, icon, text, distance } }
function Album.add(entries)
	if type(entries) ~= "table" then
		return
	end
	local now = View.now()
	for _, e in entries do
		local id, code, icon, text = e[1], e[2], e[3], e[4]
		local n = notebook[id]
		if not n then
			n = { id = id, code = code, icon = icon, digits = { "?", "?", "?" }, seen = now, count = 0 }
			notebook[id] = n
		end
		n.count += 1
		n.seen = now
		for i = 1, Config.Number.Digits do
			local ch = string.sub(text, i, i)
			if ch ~= "?" and ch ~= "" then
				n.digits[i] = ch
			end
		end
	end
	showPopup(entries)
	if panel and panel.Visible then
		Album.refresh()
	end
end

return Album
