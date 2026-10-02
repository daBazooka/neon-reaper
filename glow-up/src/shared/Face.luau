-- SUB 5 TO TRUE ADAM: builds a player's custom face (eyes, brows, nose, mouth, jaw, ears, marks, facial hair) on a
-- head part from their Genome. `w` is how goofy it still is (1 = full gag, 0 = chiselled). Used by Quirks.
local Face = {}

local function bit(props)
	local part = Instance.new("Part")
	part.Anchored = false
	part.CanCollide = false
	part.CanTouch = false
	part.CanQuery = false
	part.Massless = true
	part.CastShadow = false
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.Material = Enum.Material.SmoothPlastic
	for k, v in props do
		part[k] = v
	end
	return part
end

local function stick(part, base, offset, folder)
	part.CFrame = base.CFrame * offset
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = base
	weld.Part1 = part
	weld.Parent = part
	part.Parent = folder
	return part
end

local function ball(size, color)
	local s = type(size) == "number" and Vector3.one * size or size
	return bit({ Shape = Enum.PartType.Ball, Size = s, Color = color })
end

local function wedge(size, color)
	local part = Instance.new("WedgePart")
	part.Anchored = false
	part.CanCollide, part.CanTouch, part.CanQuery, part.Massless, part.CastShadow = false, false, false, true, false
	part.Material = Enum.Material.SmoothPlastic
	part.Size = size
	part.Color = color
	return part
end

local function mix(a, b, t)
	return a + (b - a) * t
end

--------------------------------------------------------------------------------
-- The face
--------------------------------------------------------------------------------
function Face.build(head, folder, dims, g, w, skin)
	local W, H, D = dims.X, dims.Y, dims.Z
	local z = -D * 0.5
	local dark = skin:Lerp(Color3.new(0, 0, 0), 0.45)
	local brow = g.hairColor:Lerp(Color3.new(0, 0, 0), 0.25)
	local sharp = 1 - w -- 0 = goofy, 1 = chiselled

	-- Eyes. Goofy: one big, one small, one higher, pupils crossed. Chiselled: matched, hooded, hunter-like.
	local baseEye = W * 0.24 * g.eyeSize
	for _, side in { -1, 1 } do
		local big = side == -1
		local goofy = mix(1, big and 1.7 or 0.8, w)
		local eyeW = baseEye * goofy
		local x = side * W * 0.21 * g.eyeSpacing
		local y = H * 0.1 + (big and 0 or H * 0.1 * w) + side * g.eyeTilt * H * 0.1 * sharp
		stick(ball(Vector3.new(eyeW, eyeW * 0.78, eyeW * 0.5), Color3.new(1, 1, 1)), head, CFrame.new(x, y, z), folder)
		local cross = -side * W * 0.05 * w
		stick(ball(eyeW * 0.62, g.eyeColor), head, CFrame.new(x + cross, y, z - eyeW * 0.2), folder)
		stick(ball(eyeW * mix(0.3, 0.2, w), Color3.new(0, 0, 0)), head, CFrame.new(x + cross, y, z - eyeW * 0.3), folder)
		stick(ball(eyeW * 0.1, Color3.new(1, 1, 1)), head, CFrame.new(x + cross + eyeW * 0.12, y + eyeW * 0.14, z - eyeW * 0.36), folder)
		-- upper lid: covers more of the eye as the face gets sharper (hooded hunter eyes)
		stick(bit({ Size = Vector3.new(eyeW * 1.1, eyeW * (0.12 + 0.2 * sharp), eyeW * 0.55), Color = skin }), head, CFrame.new(x, y + eyeW * 0.3, z - eyeW * 0.02) * CFrame.Angles(0, 0, side * g.eyeTilt), folder)
		-- brow
		local browAngle = g.browAngle * sharp * side * -1
		if not (w > 0.6) then
			stick(bit({ Size = Vector3.new(W * 0.3, H * 0.07 * g.browThick * (1 + 0.7 * w), D * 0.08), Color = brow }), head, CFrame.new(x, y + eyeW * 0.65, z - D * 0.01) * CFrame.Angles(0, 0, browAngle), folder)
		end
	end
	if w > 0.6 then
		-- one big hairy unibrow
		stick(bit({ Size = Vector3.new(W * 0.8, H * 0.13 * (0.5 + 0.5 * w), D * 0.12), Color = brow }), head, CFrame.new(0, H * 0.34, z) * CFrame.Angles(0, 0, 0.12), folder)
	end

	-- Nose: bridge + tip + nostrils. Bigger and rounder when goofy.
	local noseTip = W * 0.15 * g.noseSize * (1 + 0.9 * w)
	stick(bit({ Size = Vector3.new(W * 0.09 * g.noseWidth, H * 0.3, D * 0.13), Color = skin }), head, CFrame.new(0, -H * 0.02, z - D * 0.02), folder)
	stick(ball(Vector3.new(noseTip * g.noseWidth, noseTip, noseTip), skin), head, CFrame.new(0, -H * 0.15, z - D * 0.1), folder)
	if w > 0.25 then
		for _, side in { -1, 1 } do
			stick(ball(W * 0.05, dark), head, CFrame.new(side * noseTip * 0.3, -H * 0.18, z - D * 0.2), folder)
		end
	end

	-- Mouth: upper lip, lower lip. Goofy: crooked with buck teeth. Chiselled: a confident, slight smile.
	local mouthW = W * 0.34 * g.mouthWidth
	local lipColor = skin:Lerp(Color3.fromRGB(176, 70, 76), 0.3 * g.lip)
	local crook = 0.16 * w
	stick(bit({ Size = Vector3.new(mouthW, H * 0.045 * g.lip, D * 0.06), Color = lipColor }), head, CFrame.new(W * 0.03 * w, -H * 0.31, z) * CFrame.Angles(0, 0, crook), folder)
	stick(bit({ Size = Vector3.new(mouthW * 0.85, H * 0.06 * g.lip, D * 0.06), Color = lipColor }), head, CFrame.new(W * 0.03 * w, -H * 0.36, z) * CFrame.Angles(0, 0, crook), folder)
	if w <= 0.5 then
		for _, side in { -1, 1 } do
			stick(bit({ Size = Vector3.new(W * 0.05, H * 0.04, D * 0.05), Color = lipColor }), head, CFrame.new(side * mouthW * 0.52, -H * 0.29, z) * CFrame.Angles(0, 0, side * 0.5), folder)
		end
	end
	if w > 0.45 then
		for _, side in { -1, 1 } do
			stick(bit({ Size = Vector3.new(W * 0.11, H * 0.17, D * 0.06), Color = Color3.fromRGB(250, 248, 235) }), head, CFrame.new(W * 0.04 * w + side * W * 0.065, -H * 0.41, z - D * 0.02), folder)
		end
	end

	-- Jaw and chin: the jawline gets more defined with every level.
	local jaw = g.jaw * sharp
	if sharp > 0.15 then
		stick(bit({ Size = Vector3.new(W * (0.34 + 0.24 * jaw), H * 0.16, D * 0.14), Color = skin }), head, CFrame.new(0, -H * 0.46, z + D * 0.02), folder)
	end
	-- Cheekbones
	if w < 0.6 then
		for _, side in { -1, 1 } do
			stick(ball(Vector3.new(W * 0.17 * g.cheek, H * 0.1, D * 0.1) * sharp, skin:Lerp(Color3.new(1, 1, 1), 0.08)), head, CFrame.new(side * W * 0.32, -H * 0.08, z + D * 0.04), folder)
		end
	end
	-- Ears
	for _, side in { -1, 1 } do
		stick(ball(Vector3.new(D * 0.12, W * 0.2 * g.ear, D * 0.2), skin), head, CFrame.new(side * W * 0.5, -H * 0.02, D * 0.02), folder)
	end

	-- Marks that make this face theirs
	if g.mole ~= 0 then
		stick(ball(W * 0.03, Color3.fromRGB(60, 36, 28)), head, CFrame.new(g.mole * W * 0.2, -H * 0.24, z - D * 0.02), folder)
	end
	if g.scar ~= 0 and sharp > 0.3 then
		stick(bit({ Size = Vector3.new(W * 0.02, H * 0.3, D * 0.03), Color = skin:Lerp(Color3.new(1, 1, 1), 0.3) }), head, CFrame.new(g.scar * W * 0.27, H * 0.08, z - D * 0.01) * CFrame.Angles(0, 0, 0.25 * g.scar), folder)
	end
	if g.freckles then
		local rng = Random.new(13)
		for _ = 1, 10 do
			stick(ball(W * 0.016, skin:Lerp(Color3.fromRGB(120, 70, 40), 0.5)), head, CFrame.new((rng:NextNumber() - 0.5) * W * 0.5, -H * (0.02 + rng:NextNumber() * 0.12), z - D * 0.03), folder)
		end
	end

	-- Facial hair (only once the face has sharpened; the gag mustache covers the early levels)
	if w < 0.55 and g.beard ~= "none" then
		local hair = g.hairColor
		if g.beard == "stubble" then
			local rng = Random.new(29)
			for _ = 1, 26 do
				local x = (rng:NextNumber() - 0.5) * W * 0.8
				stick(ball(W * 0.025, hair), head, CFrame.new(x, -H * (0.3 + rng:NextNumber() * 0.2), z - D * 0.01 + (math.abs(x) / W) * D * 0.15), folder)
			end
		elseif g.beard == "goatee" then
			stick(bit({ Size = Vector3.new(W * 0.2, H * 0.2, D * 0.1), Color = hair }), head, CFrame.new(0, -H * 0.47, z - D * 0.02), folder)
			stick(bit({ Size = Vector3.new(W * 0.34, H * 0.05, D * 0.07), Color = hair }), head, CFrame.new(0, -H * 0.27, z - D * 0.03), folder)
		else
			stick(bit({ Size = Vector3.new(W * 0.74, H * 0.3, D * 0.14), Color = hair }), head, CFrame.new(0, -H * 0.42, z + D * 0.04), folder)
			stick(bit({ Size = Vector3.new(W * 0.36, H * 0.06, D * 0.08), Color = hair }), head, CFrame.new(0, -H * 0.27, z - D * 0.03), folder)
			for _, side in { -1, 1 } do
				stick(bit({ Size = Vector3.new(D * 0.1, H * 0.4, D * 0.4), Color = hair }), head, CFrame.new(side * W * 0.46, -H * 0.2, z + D * 0.3), folder)
			end
		end
	end

	-- Goofy mustache
	if w > 0.3 then
		for side = -1, 1, 2 do
			stick(bit({ Size = Vector3.new(W * 0.3, H * 0.12, D * 0.1), Color = brow }), head, CFrame.new(side * W * 0.16, -H * 0.24, z - D * 0.04) * CFrame.Angles(0, 0, -side * 0.18), folder)
		end
	end
end


Face.bit, Face.ball, Face.wedge, Face.stick = bit, ball, wedge, stick

return Face
