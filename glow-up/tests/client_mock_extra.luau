-- client-specific mock overrides (appended after the shared prelude)
local attrsP = {}
local localPlayer = {
	Name = "Me", DisplayName = "Me", UserId = 1,
	SetAttribute = function(_, k, v) attrsP[k] = v end,
	GetAttribute = function(_, k) return attrsP[k] end,
	GetAttributeChangedSignal = function(_, k) return signal("attr_" .. k) end,
	WaitForChild = function() return U("PlayerGui") end,
	Character = {FindFirstChildOfClass = function() return {CameraOffset = Vector3.zero, FindFirstChildOfClass = function() return nil end} end, FindFirstChild = function() return {Position = Vector3.new(0, 3, 0)} end},
}
Players.LocalPlayer = localPlayer
local camera = {ViewportSize = {X = 1920, Y = 1080}, GetPropertyChangedSignal = function() return signal("vp") end, FieldOfView = 70}
local wsMeta = getmetatable(workspace)
rawset(workspace, "WaitForChild", function(_, n) if n == "Camera" then return camera end return U(n) end)
RaycastParams = { new = function() return { FilterType = nil, FilterDescendantsInstances = {} } end }
rawset(workspace, "Raycast", function() return nil end)
local CollectionService = {GetInstanceAddedSignal = function() return signal("ia") end, GetInstanceRemovedSignal = function() return signal("ir") end, GetTagged = function() return {} end}
local game_old = game
game = {GetService = function(self, n)
	if n == "CollectionService" then return CollectionService end
	if n == "UserInputService" then return {InputBegan = signal("input"), InputEnded = signal("inputEnd"), KeyboardEnabled = true} end
	return game_old.GetService(self, n)
end, BindToClose = function() end}
