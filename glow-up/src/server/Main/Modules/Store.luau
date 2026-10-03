-- SUB 5 TO TRUE ADAM: real-money store (game passes + Aura packs). Nothing is charged until you paste real ids into
-- Config.Store; offers with id 0 are shown as "coming soon". The server grants everything, never the client.
local Players = game:GetService("Players")
local MarketplaceService = game:GetService("MarketplaceService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Store = {}

local passById = {}
for _, pass in Config.Store.Passes do
	passById[pass.PassId] = pass
end
local productById = {}
for _, product in Config.Store.Products do
	productById[product.ProductId] = product
end

local function grantPass(p, pass)
	local profile = Data.get(p)
	if not profile then
		return
	end
	profile.Passes[pass.Id] = true
	p:SetAttribute("Pass_" .. pass.Id, true)
	Stats.recompute(p)
	Stats.toast(p, pass.Name .. " unlocked. Thank you!", "gold")
end

-- Checks which passes the player already owns (call after the profile is loaded).
function Store.init(p)
	local profile = Data.get(p)
	for _, pass in Config.Store.Passes do
		p:SetAttribute("Pass_" .. pass.Id, profile.Passes[pass.Id] == true)
		if pass.PassId ~= 0 then
			task.spawn(function()
				local ok, owns = pcall(function()
					return MarketplaceService:UserOwnsGamePassAsync(p.UserId, pass.PassId)
				end)
				if ok and owns and Data.get(p) then
					grantPass(p, pass)
				end
			end)
		end
	end
end

function Store.start()
	MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(p, passId, purchased)
		local pass = passById[passId]
		if purchased and pass and p.Parent then
			grantPass(p, pass)
		end
	end)
	MarketplaceService.ProcessReceipt = function(info)
		local p = Players:GetPlayerByUserId(info.PlayerId)
		local product = productById[info.ProductId]
		local profile = p and Data.get(p)
		if not p or not product or not profile then
			return Enum.ProductPurchaseDecision.NotProcessedYet
		end
		Stats.addAura(p, Config.ProductAura(profile.Level, product.Size), { raw = true })
		if product.Crates and product.Crates > 0 then
			Stats.addFreeCrates(p, product.Crates)
		end
		Stats.toast(p, product.Name .. " received!", "gold")
		return Enum.ProductPurchaseDecision.PurchaseGranted
	end
end

return Store
