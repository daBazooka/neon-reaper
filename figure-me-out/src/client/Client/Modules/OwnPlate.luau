-- FIGURE ME OUT: you must never see your own number (forehead plate or the floating one). The plate is hidden on your screen only; everybody else
-- still sees it.
local Players = game:GetService("Players")

local OwnPlate = {}

local player = Players.LocalPlayer
local conn

local function hide(inst)
	if inst.Name == "NumberPlate" or inst.Name == "PlateRim" then
		inst.Transparency = 1
	elseif inst.Name == "PlateGui" or inst.Name == "NumberTag" then
		inst.Enabled = false
	end
end

local function watch(char)
	if conn then
		conn:Disconnect()
	end
	for _, d in char:GetDescendants() do
		hide(d)
	end
	conn = char.DescendantAdded:Connect(hide)
end

function OwnPlate.init()
	if player.Character then
		watch(player.Character)
	end
	player.CharacterAdded:Connect(watch)
end

return OwnPlate
