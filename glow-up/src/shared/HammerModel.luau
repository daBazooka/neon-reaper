-- SUB 5 TO TRUE ADAM: builds the 3D model of a hammer from simple parts (nothing to import).
-- Used for the pedestals in the shop and for the hammer in your hand.
local HammerModel = {}

-- opts.scale shrinks/grows it; opts.anchored for display pieces; the handle is the PrimaryPart.
function HammerModel.build(hammer, cf, parent, opts)
	opts = opts or {}
	local s = opts.scale or 1
	local model = Instance.new("Model")
	model.Name = "Hammer_" .. hammer.Id
	local mat = Enum.Material[hammer.Material] or Enum.Material.Metal
	local function piece(name, size, at, color, material, shape)
		local p = Instance.new("Part")
		p.Name = name
		p.Size = size * s
		p.CFrame = cf * CFrame.new(at.Position * s) * (at - at.Position)
		p.Color = color
		p.Material = material
		if shape then
			p.Shape = shape
		end
		p.Anchored = opts.anchored == true
		p.CanCollide = false
		p.CanQuery = false
		p.CanTouch = false
		p.Massless = true
		p.TopSurface = Enum.SurfaceType.Smooth
		p.BottomSurface = Enum.SurfaceType.Smooth
		p.Parent = model
		return p
	end
	local handle = piece("Handle", Vector3.new(0.7, 6, 0.7), CFrame.new(), hammer.Handle, Enum.Material.Wood)
	local top = CFrame.new(0, 3, 0)
	if hammer.Style == "mallet" then
		piece("Head", Vector3.new(4, 2.4, 2.4), top * CFrame.Angles(0, 0, math.pi / 2), hammer.Head, mat, Enum.PartType.Cylinder)
	elseif hammer.Style == "chisel" then
		piece("Head", Vector3.new(0.9, 3.4, 2.2), top * CFrame.new(0, 1, 0), hammer.Head, mat)
		piece("Tip", Vector3.new(0.9, 1.4, 1.4), top * CFrame.new(0, 3, 0) * CFrame.Angles(0, 0, math.pi / 4), hammer.Head, mat)
	elseif hammer.Style == "spiked" then
		piece("Head", Vector3.new(3.6, 2.4, 2.4), top, hammer.Head, mat)
		for side = -1, 1, 2 do
			piece("Spike", Vector3.new(1.2, 1.2, 1.2), top * CFrame.new(side * 2.2, 0, 0) * CFrame.Angles(0, 0, math.pi / 4), hammer.Head, mat)
		end
	else
		piece("Head", Vector3.new(3.4, 2.2, 2.2), top, hammer.Head, mat)
		piece("Band", Vector3.new(3.6, 0.5, 2.4), top * CFrame.new(0, -0.9, 0), hammer.Handle, Enum.Material.SmoothPlastic)
	end
	model.PrimaryPart = handle
	model.Parent = parent
	return model
end

return HammerModel
