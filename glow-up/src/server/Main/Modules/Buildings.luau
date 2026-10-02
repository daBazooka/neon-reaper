-- SUB 5 TO TRUE ADAM: building unlocks. Every building costs Aura; the price tells you how strong you need to be.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Buildings = {}

function Buildings.owned(p, id)
	local profile = Data.get(p)
	return profile ~= nil and Config.BuildingOwned(profile.Buildings, id)
end

-- Returns true when the player already owns the building (or has just bought it, which uses their press).
function Buildings.unlock(p, id)
	local profile = Data.get(p)
	local def = Config.Buildings[id]
	if not profile or not def or Config.BuildingOwned(profile.Buildings, id) then
		return false
	end
	if not Stats.spend(p, def.Cost) then
		Stats.toast(p, string.format("%s costs %s Aura", def.Name, require(ReplicatedStorage.Shared.Util).fmt(def.Cost)), "bad")
		return false
	end
	profile.Buildings[id] = true
	Stats.recompute(p)
	Stats.send(p, "building", id)
	return true
end

return Buildings
