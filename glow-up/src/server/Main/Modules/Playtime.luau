-- SUB 5 TO TRUE ADAM: play-time gifts. Stay in the server and gifts arrive on their own (Aura + crates),
-- each one bigger than the last. The HUD shows a countdown to the next one.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Data = require(script.Parent.Data)
local Stats = require(script.Parent.Stats)

local Playtime = {}

local sessions = {} -- player -> { joined = os.clock(), claimed = number }

function Playtime.init(p)
	sessions[p] = { joined = os.clock(), claimed = 0 }
	p:SetAttribute("GiftAt", workspace:GetServerTimeNow() + Config.Gifts[1].Time)
	p:SetAttribute("GiftsClaimed", 0)
end

function Playtime.release(p)
	sessions[p] = nil
end

-- Called once a second for every player.
function Playtime.tick(p)
	local session = sessions[p]
	local profile = Data.get(p)
	if not session or not profile then
		return
	end
	local elapsed = os.clock() - session.joined
	local nextGift = Config.Gifts[session.claimed + 1]
	if nextGift and elapsed >= nextGift.Time then
		session.claimed += 1
		p:SetAttribute("GiftsClaimed", session.claimed)
		local aura = Config.GiftAura(profile.Level, nextGift.Size)
		Stats.addAura(p, aura, { raw = true })
		if nextGift.Crates > 0 then
			Stats.addFreeCrates(p, nextGift.Crates)
		end
		local following = Config.Gifts[session.claimed + 1]
		p:SetAttribute("GiftAt", following and (workspace:GetServerTimeNow() + following.Time - elapsed) or 0)
		Stats.send(p, "gift", aura, nextGift.Crates, session.claimed, #Config.Gifts)
	end
end

return Playtime
