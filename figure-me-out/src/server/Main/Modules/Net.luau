-- FIGURE ME OUT: the server's way of talking to players.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Net = {}

local function notify()
	return ReplicatedStorage:WaitForChild("Net"):WaitForChild("Notify")
end

function Net.send(p, ...)
	if p then
		notify():FireClient(p, ...)
	end
end

function Net.sendAll(...)
	notify():FireAllClients(...)
end

-- kind: "info" | "good" | "bad" | "gold"
function Net.toast(p, text, kind)
	if p then
		notify():FireClient(p, "toast", text, kind or "info")
	end
end

return Net
