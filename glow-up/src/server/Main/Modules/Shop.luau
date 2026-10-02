-- SUB 5 TO TRUE ADAM: upgrades and rebirth.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Shop = {}

local upgradeById = {}
for _, def in Config.Upgrades do
	upgradeById[def.Id] = def
end

function Shop.buy(p, id)
	local def = upgradeById[id]
	local profile = Data.get(p)
	if not def or not profile then
		return
	end
	local level = profile.Levels[id] or 0
	if level >= def.Max then
		return
	end
	if not Stats.spend(p, Config.UpgradeCost(def, level)) then
		Stats.toast(p, "Not enough Aura", "bad")
		return
	end
	profile.Levels[id] = level + 1
	p:SetAttribute("Lv_" .. id, level + 1)
	Stats.applyMovement(p)
	Stats.recompute(p)
	Stats.send(p, "upgrade", id, level + 1)
end

function Shop.rebirth(p)
	local profile = Data.get(p)
	if not profile then
		return
	end
	if Stats.score(p) < Config.RebirthRequirement(profile.Rebirths) then
		Stats.toast(p, "Reach a higher Glow Score to rebirth", "bad")
		return
	end
	profile.Rebirths += 1
	profile.Power, profile.Style, profile.Charm = 0, 0, 0
	profile.Levels = {}
	for _, def in Config.Upgrades do
		p:SetAttribute("Lv_" .. def.Id, 0)
	end
	Stats.setAura(p, 0)
	Stats.addFreeCrates(p, 2)
	Stats.applyMovement(p)
	Stats.recompute(p)
	Stats.send(p, "rebirth", profile.Rebirths)
end

function Shop.handle(p, kind, a)
	if kind == "Buy" and type(a) == "string" then
		Shop.buy(p, a)
	elseif kind == "Rebirth" then
		Shop.rebirth(p)
	end
end

return Shop
