-- SUB 5 TO TRUE ADAM: crate opening. The server decides every roll; the client only plays the reveal.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)
local Cosmetics = require(script.Parent.Cosmetics)
local Quests = require(script.Parent.Quests)

local Crates = {}

local rng = Random.new()

local function rollRarity(crate, luck, onlyAtLeast)
	local minOrder = onlyAtLeast and Config.Rarities[onlyAtLeast].Order or 0
	local lowest = math.huge
	for name in crate.Odds do
		lowest = math.min(lowest, Config.Rarities[name].Order)
	end

	local total, weights = 0, {}
	for _, name in Config.RarityOrder do
		local base = crate.Odds[name]
		local order = Config.Rarities[name].Order
		if base and order >= minOrder then
			-- Luck boosts every drop above the crate's lowest tier.
			local w = order == lowest and base or base * luck
			weights[name] = w
			total += w
		end
	end

	local roll = rng:NextNumber() * total
	for _, name in Config.RarityOrder do
		local w = weights[name]
		if w then
			roll -= w
			if roll <= 0 then
				return name
			end
		end
	end
	return onlyAtLeast or Config.RarityOrder[1]
end

function Crates.open(p, crateId)
	local crate = Config.CrateById[crateId]
	local profile = Data.get(p)
	if not crate or not profile then
		return
	end

	if crateId == "street" and profile.FreeCrates > 0 then
		profile.FreeCrates -= 1
		p:SetAttribute("FreeCrates", profile.FreeCrates)
	elseif not Config.BuildingOwned(profile.Buildings, "crates") then
		Stats.toast(p, "Unlock the Crate Shop (walk up to it) to buy crates", "bad")
		return
	elseif not Stats.spend(p, crate.Cost) then
		Stats.toast(p, "Not enough Aura for a " .. crate.Name, "bad")
		return
	end

	local luck = Config.LuckMult(profile.Levels.Luck or 0)
	local pity = profile.Pity[crateId] or 0
	local forced = crate.PityAfter and pity + 1 >= crate.PityAfter
	local rarity = rollRarity(crate, luck, forced and crate.PityMin or nil)

	if crate.PityMin then
		if Config.Rarities[rarity].Order >= Config.Rarities[crate.PityMin].Order then
			profile.Pity[crateId] = 0
		else
			profile.Pity[crateId] = pity + 1
		end
	end

	if crate.PityAfter then
		p:SetAttribute("Pity_" .. crateId, profile.Pity[crateId] or 0)
	end

	local pool = Config.CosmeticsByRarity[rarity]
	local pick = pool[rng:NextInteger(1, #pool)]
	local status, stars = Cosmetics.grant(p, pick.Id)

	local refund = 0
	if status == "max" then
		refund = math.floor(crate.Cost * 0.3)
		Stats.addAura(p, refund, { raw = true })
	end

	profile.CratesOpened += 1
	Stats.addXP(p, 8)
	Quests.progress(p, "crate", 1)
	Stats.send(p, "crate", crateId, pick.Id, status, stars, refund)
end

return Crates
