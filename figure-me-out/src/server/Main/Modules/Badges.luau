-- FIGURE ME OUT: Roblox badges. Badges are little achievements shown on a player's profile, and chasing them is one of the best reasons
-- to come back. They have to be created on the Roblox website (Creator Hub > your game > Engagement > Badges: the art is in
-- docs/icons/badges); each one gets a number. Paste the numbers into Config.Badges. A badge whose number is 0 is simply skipped, so the
-- game works the same before you have made them.
local BadgeService = game:GetService("BadgeService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))

local Badges = {}

local given = {} -- "userId:key" -> true, so a badge is only asked for once per visit

-- Gives the badge `key` (a name from Config.Badges) to the player, if it has a number and they do not have it yet.
function Badges.award(p, key)
	local id = Config.Badges[key]
	if not p or type(id) ~= "number" or id <= 0 then
		return false
	end
	local tag = p.UserId .. ":" .. key
	if given[tag] then
		return false
	end
	given[tag] = true
	task.spawn(function()
		local ok, err = pcall(function()
			if not BadgeService:UserHasBadgeAsync(p.UserId, id) then
				BadgeService:AwardBadge(p.UserId, id)
			end
		end)
		if not ok then
			warn("[FigureMeOut] badge " .. key .. " failed:", err)
		end
	end)
	return true
end

return Badges
