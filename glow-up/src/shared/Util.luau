-- GLOW UP: small shared helpers.
local Util = {}

-- 1234 -> "1,234", 15300 -> "15.3K", 4.2e6 -> "4.20M" ...
function Util.fmt(n)
	n = math.floor(n + 0.5)
	if n >= 1e15 then
		return string.format("%.2fQ", n / 1e15)
	elseif n >= 1e12 then
		return string.format("%.2fT", n / 1e12)
	elseif n >= 1e9 then
		return string.format("%.2fB", n / 1e9)
	elseif n >= 1e6 then
		return string.format("%.2fM", n / 1e6)
	elseif n >= 1e4 then
		return string.format("%.1fK", n / 1e3)
	elseif n >= 1000 then
		local s = tostring(n)
		return s:sub(1, #s - 3) .. "," .. s:sub(-3)
	end
	return tostring(n)
end

-- Triangle wave 0..1..0 with period 2 (used for the training bar so client and server agree).
function Util.tri(x)
	return 1 - math.abs(x % 2 - 1)
end

function Util.lerp(a, b, t)
	return a + (b - a) * t
end

-- Seconds -> "1:05"
function Util.clock(seconds)
	seconds = math.max(0, math.floor(seconds))
	return string.format("%d:%02d", seconds // 60, seconds % 60)
end

-- Parses "id:stars,id:stars" (the replicated inventory string).
function Util.parseInventory(text)
	local inv = {}
	for id, stars in string.gmatch(text or "", "([%w_]+):(%d+)") do
		inv[id] = tonumber(stars)
	end
	return inv
end

return Util
