-- SUB 5 TO TRUE ADAM: the "Top Moggers" screen: the highest levels on this server.
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
				local lx, ly = x:GetAttribute("Level") or 1, y:GetAttribute("Level") or 1
				if lx ~= ly then
					return lx > ly
				end
				return (x:GetAttribute("GlowScore") or 0) > (y:GetAttribute("GlowScore") or 0)
			end)
			local lines = {}
			for i = 1, math.min(8, #list) do
				local p = list[i]
				local rank = Config.Ranks[p:GetAttribute("Rank") or 1]
				table.insert(lines, string.format("%d.  %s   —   Lv %s   (%s)", i, p.DisplayName, Util.fmt(p:GetAttribute("Level") or 1), rank.Name))
			end
			label.Text = #lines > 0 and table.concat(lines, "\n") or "Nobody here yet."
			task.wait(8)
		end
	end)
end

return Board
