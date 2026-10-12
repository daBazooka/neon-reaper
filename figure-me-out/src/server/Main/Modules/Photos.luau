-- FIGURE ME OUT: the camera. The server works out who is in the picture and which digits you could actually read, so
-- the album can't be cheated and smoke, walls and turned backs all matter. A clear photo of a whole number earns a few
-- points, and an assist if somebody else then gets that player. Close up, the person photographed may notice the flash.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local Config = require(Shared:WaitForChild("Config"))
local Rules = require(Shared:WaitForChild("Rules"))
local State = require(script.Parent.State)
local Net = require(script.Parent.Net)
local Vision = require(script.Parent.Vision)

local Photos = {}

local rng = Random.new()

-- Everything the camera at `origin` pointing along `look` can see. Returns a list of
-- { id, code, icon, text, distance, complete } sorted nearest first.
function Photos.shotsFrom(origin, look, exceptId)
	local out = {}
	for _, other in State.aliveList() do
		if other.id ~= exceptId then
			local head = Vision.head(other)
			if head then
				local inside, distance = Rules.inCone(origin, look, head.Position, Config.Photo.HalfAngle, Config.Photo.MaxDistance)
				if inside and not Vision.blocked(origin, head.Position, true) then
					local toCamera = (origin - head.Position).Unit
					local facing = head.CFrame.LookVector:Dot(toCamera)
					local readable = Rules.photoReadable(distance, facing, { rng:NextNumber(), rng:NextNumber(), rng:NextNumber() })
					local shown = other.shown or other.number
					local text = Rules.photoText(shown, readable)
					table.insert(out, {
						id = other.id,
						code = other.code,
						icon = other.icon,
						text = text,
						distance = distance,
						-- only a photo of the REAL number counts as intel (a scrambled or masked plate shows something else)
						complete = not string.find(text, "?", 1, true) and shown == other.number,
					})
				end
			end
		end
	end
	table.sort(out, function(a, b)
		return a.distance < b.distance
	end)
	return out
end

function Photos.snap(p, origin, look)
	local e = State.byPlayer(p)
	if not e or State.phase ~= "play" or not e.alive then
		return
	end
	if typeof(origin) ~= "Vector3" or typeof(look) ~= "Vector3" or look.Magnitude < 0.1 then
		return
	end
	local now = State.now()
	if (e.blindUntil or 0) > now or (e.stunUntil or 0) > now or now - (e.lastSnap or -100) < Config.Photo.Cooldown then
		return
	end
	local head = Vision.head(e)
	if not head or (origin - head.Position).Magnitude > 20 then
		return
	end
	e.lastSnap = now
	local shots = Photos.shotsFrom(origin, look.Unit, e.id)
	local list = {}
	e.intelAt = e.intelAt or {}
	for i, s in shots do
		local target = State.entities[s.id]
		if s.complete and target then
			target.seenBy = target.seenBy or {}
			target.seenBy[e.id] = now
			-- a little reward the first time per target (and not again for a while, so it can't be farmed)
			if now - (e.intelAt[s.id] or -1000) > 30 then
				e.intelAt[s.id] = now
				e.score = (e.score or 0) + Config.Score.Intel
				State.writeEntity(e)
			end
		end
		-- close up, the person may notice the flash
		if target and target.player and s.distance <= Config.Photo.NoticeDistance and rng:NextNumber() < Config.Photo.NoticeChance then
			Net.send(target.player, "noticed", head.Position)
		end
		if i <= 8 then
			list[i] = { s.id, s.code, s.icon, s.text, math.floor(s.distance + 0.5) }
		end
	end
	Net.send(p, "photo", list, now)
	return list
end

return Photos
