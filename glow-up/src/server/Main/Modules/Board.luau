-- GLOW UP: the "Hall of Icons" screen: the highest Glow Scores on this server.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Config"))
local Util = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("Util"))

local Board = {}

function Board.init(label)
	if not label then
		return
	end
	task.spawn(function()
		while true do
			local list = Players:GetPlayers()
			table.sort(list, function(x, y)
				return (x:GetAttribute("GlowScore") or 0) > (y:GetAttribute("GlowScore") or 0)
			end)
			local lines = {}
			for i = 1, math.min(8, #list) do
				local p = list[i]
				local rank = Config.Ranks[p:GetAttribute("Rank") or 1]
				table.insert(lines, string.format("%d.  %s   —   %s  (%s)", i, p.DisplayName, Util.fmt(p:GetAttribute("GlowScore") or 0), rank.Name))
			end
			label.Text = #lines > 0 and table.concat(lines, "\n") or "Be the first Icon."
			task.wait(8)
		end
	end)
end

return Board
