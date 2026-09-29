'use strict';
/* =====================================================================
   TIDECALLER renderer: a side view of the sea, all drawn in code.
   ===================================================================== */
const cv = $('cv'); let cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
const V = { s:1, ox:0, oy:0, camX:0 };
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, save.opt.fx === 'low' ? 1 : 2);
  W = innerWidth; H = innerHeight; cv.width = W * DPR | 0; cv.height = H * DPR | 0;
  V.s = Math.min(H / 640, W / 470);
}
const SX = x => (x - V.camX) * V.s, SY = y => V.oy + y * V.s;
// input maps against the resting camera, so a jump never moves the tide under your finger
const toWorldY = py => (py - (H / 2 - 330 * V.s)) / V.s;

// biome colours blend while you sail from one to the next
let prevBiome = 0, curBiome = 0;
function col(key, i){
  const a = BIOMES[prevBiome], b = BIOMES[curBiome], k = G.biomeK;
  const va = i === undefined ? a[key] : a[key][i], vb = i === undefined ? b[key] : b[key][i];
  if(!va || !vb) return vb || va;
  return k >= 1 ? vb : mix(va, vb, k);
}

const glowC = {};
function glowSpr(c){ if(glowC[c]) return glowC[c]; const s = 64, cn = document.createElement('canvas'); cn.width = cn.height = s; const g = cn.getContext('2d'), gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, rgba(c, 1)); gr.addColorStop(.35, rgba(c, .4)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(0, 0, s, s); return glowC[c] = cn; }
function glow(x, y, r, c, a){ cx.globalAlpha = a; cx.drawImage(glowSpr(c), x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1; }

/* ---------------- background ---------------- */
const CLOUDS = Array.from({ length:9 }, (_, i) => ({ x:i * 420 + Math.random() * 200, y:rnd(-120, 170), s:rnd(.7, 1.5), p:rnd(.08, .22) }));
const STARS = Array.from({ length:80 }, () => ({ x:Math.random(), y:Math.random() * .7, s:rnd(.5, 1.8), p:Math.random() * TAU }));
function drawSky(){
  const g = cx.createLinearGradient(0, 0, 0, SY(G.surf)); g.addColorStop(0, col('sky', 0)); g.addColorStop(1, col('sky', 1));
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  const B = BIOMES[curBiome];
  if(B.glow || BIOMES[prevBiome].glow){ const a = B.glow ? G.biomeK : 1 - G.biomeK; for(const s of STARS){ cx.globalAlpha = a * (.5 + .5 * Math.sin(G.rt * 2 + s.p)); cx.fillStyle = '#fff'; cx.fillRect(s.x * W, s.y * SY(G.surf), s.s, s.s); } cx.globalAlpha = 1; }
  const sun = col('sun');
  if(sun){ const x = W * .78, y = SY(40); glow(x, y, 150 * V.s, sun, .55); cx.fillStyle = sun; cx.beginPath(); cx.arc(x, y, 34 * V.s, 0, TAU); cx.fill(); }
  // clouds
  const cc = col('cloud');
  for(const c of CLOUDS){
    const span = 3800, x = ((c.x - G.x * c.p) % span + span) % span - 300, sx = x * V.s * .6, sy = SY(c.y);
    cx.fillStyle = rgba(cc, curBiome === 2 ? .85 : .75);
    for(const [dx, dy, r] of [[0, 0, 34], [36, -14, 30], [70, 0, 32], [34, 10, 32]]){ cx.beginPath(); cx.arc(sx + dx * c.s * V.s, sy + dy * c.s * V.s, r * c.s * V.s, 0, TAU); cx.fill(); }
  }
  // far islands sit on the waterline
  const fc = col('far'), sy = SY(G.surf);
  cx.fillStyle = fc;
  for(let k = 0; k < 2; k++){
    const p = .12 + k * .1, span = 2600;
    for(let i = -1; i < 3; i++){
      const base = Math.floor(G.x * p / span) + i, x = (base * span - G.x * p) * V.s + W * .1, h = (60 + ((base * 37 + k * 11) % 5) * 22) * V.s * (1 - k * .25), w = (360 + ((base * 53) % 4) * 90) * V.s;
      cx.globalAlpha = .45 + k * .25; cx.beginPath(); cx.moveTo(x, sy + 2);
      cx.quadraticCurveTo(x + w * .3, sy - h * 1.4, x + w * .5, sy - h); cx.quadraticCurveTo(x + w * .75, sy - h * .6, x + w, sy + 2); cx.fill();
      if(B.lava && k === 1){ glow(x + w * .5, sy - h, 30 * V.s, '#ff6a2a', .8); }
    }
  }
  cx.globalAlpha = 1;
}

/* ---------------- terrain ---------------- */
function drawBed(){
  const x0 = V.camX - 40, x1 = V.camX + W / V.s + 40, bot = H + 10;
  const g = cx.createLinearGradient(0, SY(300), 0, SY(640)); g.addColorStop(0, col('bed')); g.addColorStop(1, col('bed2'));
  cx.fillStyle = g; cx.beginPath(); cx.moveTo(SX(x0), bot);
  for(let x = Math.floor(x0 / STEP) * STEP; x <= x1; x += STEP) cx.lineTo(SX(x), SY(bedAt(x)));
  cx.lineTo(SX(x1), bot); cx.closePath(); cx.fill();
  // sand ripples and rocks on high ground
  cx.strokeStyle = rgba('#ffffff', .18); cx.lineWidth = 2 * V.s; cx.beginPath();
  for(let x = Math.floor(x0 / STEP) * STEP; x <= x1; x += STEP) { const y = SY(bedAt(x)); if(x === Math.floor(x0 / STEP) * STEP) cx.moveTo(SX(x), y + 3); else cx.lineTo(SX(x), y + 3); }
  cx.stroke();
  const rc = col('rock');
  for(let x = Math.floor(x0 / 60) * 60; x <= x1; x += 60){
    const y = bedAt(x); if(y > 540) continue;
    const h = (Math.sin(x * 12.9898) * 43758.5453 % 1 + 1) % 1;
    cx.fillStyle = rc; cx.beginPath(); cx.ellipse(SX(x + h * 30), SY(y + 6), (10 + h * 16) * V.s, (7 + h * 8) * V.s, 0, 0, TAU); cx.fill();
  }
  for(const d of G.deco) drawDeco(d);
}
function drawDeco(d){
  const y = bedAt(d.x), x = SX(d.x), sy = SY(y), s = V.s, t = G.t;
  if(x < -80 || x > W + 80) return;
  if(d.k === 'weed'){ cx.strokeStyle = '#2f9a5a'; cx.lineWidth = 4 * s; for(let k = 0; k < 3; k++){ cx.beginPath(); cx.moveTo(x + k * 8 * s, sy); for(let j = 1; j <= 5; j++) cx.lineTo(x + k * 8 * s + Math.sin(t * 1.5 + j * .8 + k) * 6 * s, sy - j * 12 * s); cx.stroke(); } }
  else if(d.k === 'coral'){ const cc = curBiome === 3 ? '#9ad8f0' : curBiome >= 4 ? '#7a4aa0' : '#ff6a8a'; cx.strokeStyle = cc; cx.lineCap = 'round'; cx.lineWidth = 7 * s; const br = (a, l, x0, y0, n) => { const x1 = x0 + Math.sin(a) * l, y1 = y0 - Math.cos(a) * l; cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y1); cx.stroke(); if(n > 0){ br(a - .5, l * .7, x1, y1, n - 1); br(a + .5, l * .7, x1, y1, n - 1); } }; br(0, 22 * s, x, sy + 4, 2); cx.lineCap = 'butt'; if(BIOMES[curBiome].glow) glow(x, sy - 20 * s, 40 * s, '#c07aff', .5); }
  else if(d.k === 'shell'){ cx.fillStyle = '#ffd6c0'; cx.beginPath(); cx.arc(x, sy, 9 * s, Math.PI, 0); cx.fill(); cx.strokeStyle = '#e0a090'; cx.lineWidth = 1.5 * s; for(let k = -2; k <= 2; k++){ cx.beginPath(); cx.moveTo(x, sy); cx.lineTo(x + k * 4 * s, sy - 8 * s); cx.stroke(); } }
  else if(d.k === 'star'){ cx.fillStyle = '#ff8a4a'; cx.beginPath(); for(let k = 0; k < 10; k++){ const a = k / 10 * TAU - Math.PI / 2, r = (k % 2 ? 4 : 10) * s; cx.lineTo(x + Math.cos(a) * r, sy - 6 * s + Math.sin(a) * r); } cx.fill(); }
}
function drawCeil(c){
  const x0 = SX(c.x0), x1 = SX(c.x1); if(x1 < -60 || x0 > W + 60) return;
  const ice = curBiome === 3, base = col('ceil'), s = V.s, y = SY(c.y), n = Math.max(3, (c.x1 - c.x0) / 34 | 0);
  const g = cx.createLinearGradient(0, y - 260 * s, 0, y); g.addColorStop(0, mix(base, '#000000', .25)); g.addColorStop(1, mix(base, '#ffffff', ice ? .35 : .12));
  cx.fillStyle = g; cx.beginPath(); cx.moveTo(x0 - 50 * s, -20);
  // cliff shoulders, then a jagged underside whose lowest tips sit exactly on c.y (the hitbox)
  cx.bezierCurveTo(x0 - 50 * s, y - 120 * s, x0 - 30 * s, y - 40 * s, x0, y - 16 * s);
  for(let i = 0; i <= n; i++){ const x = lerp(x0, x1, i / n), hs = Math.sin(c.seed + i * 7.1) * .5 + .5; cx.lineTo(x - 9 * s, y - (12 + hs * 10) * s); cx.lineTo(x, y - (hs > .5 ? 0 : 5 * s)); cx.lineTo(x + 9 * s, y - (12 + hs * 8) * s); }
  cx.bezierCurveTo(x1 + 30 * s, y - 40 * s, x1 + 50 * s, y - 120 * s, x1 + 50 * s, -20); cx.closePath(); cx.fill();
  // strata and speckles
  cx.strokeStyle = rgba('#000000', .12); cx.lineWidth = 3 * s;
  for(let k = 1; k < 4; k++){ const yy = y - (40 + k * 55) * s; cx.beginPath(); cx.moveTo(x0 - 20 * s, yy); for(let i = 0; i <= n; i++) cx.lineTo(lerp(x0, x1, i / n), yy + Math.sin(c.seed + i * 2.3 + k) * 6 * s); cx.lineTo(x1 + 20 * s, yy); cx.stroke(); }
  cx.fillStyle = rgba('#ffffff', ice ? .45 : .1);
  for(let i = 0; i < n * 2; i++){ const h = Math.sin(c.seed * 3 + i * 12.7) * .5 + .5, h2 = Math.sin(c.seed + i * 5.3) * .5 + .5; cx.beginPath(); cx.arc(lerp(x0, x1, h), y - (30 + h2 * 200) * s, (2 + h * 4) * s, 0, TAU); cx.fill(); }
  // moss or icicles hanging off the tips
  if(ice){ cx.fillStyle = rgba('#ffffff', .75); for(let i = 0; i < n; i++){ const x = lerp(x0, x1, (i + .5) / n); cx.beginPath(); cx.moveTo(x - 4 * s, y - 14 * s); cx.lineTo(x + 4 * s, y - 14 * s); cx.lineTo(x, y - 3 * s); cx.fill(); } }
  else { cx.fillStyle = rgba(curBiome === 5 ? '#ff6a2a' : '#5ac86a', .7); for(let i = 0; i < n; i += 2){ const x = lerp(x0, x1, (i + .25) / n); cx.beginPath(); cx.ellipse(x, y - 13 * s, 8 * s, 3 * s, 0, 0, TAU); cx.fill(); } }
  if(BIOMES[curBiome].glow){ for(let i = 0; i < n; i += 2){ const x = lerp(x0, x1, (i + .5) / n); glow(x, y - 8 * s, 14 * s, '#7df0ff', .6 + .3 * Math.sin(G.rt * 3 + i)); } }
}

/* ---------------- water ---------------- */
function drawWater(){
  const s = V.s, x0 = -10, step = 14;
  const top = SY(G.surf - 10), g = cx.createLinearGradient(0, top, 0, SY(640));
  g.addColorStop(0, rgba(col('sea', 0), .62)); g.addColorStop(1, rgba(col('sea', 1), .9));
  cx.fillStyle = g; cx.beginPath(); cx.moveTo(x0, H + 10);
  for(let px = x0; px <= W + step; px += step){ const wx = V.camX + px / s; cx.lineTo(px, SY(waveY(wx))); }
  cx.lineTo(W + step, H + 10); cx.closePath(); cx.fill();
  // light rays
  cx.globalCompositeOperation = 'lighter';
  for(let i = 0; i < 5; i++){
    const wx = ((i * 330 - G.x * .3) % 1650 + 1650) % 1650, px = wx * s * .7, a = .05 + .03 * Math.sin(G.rt + i);
    const gr = cx.createLinearGradient(0, SY(G.surf), 0, SY(G.surf + 260)); gr.addColorStop(0, rgba('#ffffff', a)); gr.addColorStop(1, rgba('#ffffff', 0));
    cx.fillStyle = gr; cx.beginPath(); cx.moveTo(px, SY(G.surf)); cx.lineTo(px + 50 * s, SY(G.surf)); cx.lineTo(px + 130 * s, SY(G.surf + 260)); cx.lineTo(px + 40 * s, SY(G.surf + 260)); cx.fill();
  }
  cx.globalCompositeOperation = 'source-over';
  // bright surface line and foam
  cx.strokeStyle = rgba('#ffffff', .75); cx.lineWidth = 3 * s; cx.beginPath();
  for(let px = x0; px <= W + step; px += step){ const wx = V.camX + px / s; const y = SY(waveY(wx)); if(px === x0) cx.moveTo(px, y); else cx.lineTo(px, y); }
  cx.stroke();
  cx.fillStyle = rgba('#ffffff', .5);
  for(let i = 0; i < 26; i++){ const wx = Math.floor(V.camX / 90) * 90 + i * 90 + ((i * 37) % 40); const px = SX(wx); cx.beginPath(); cx.ellipse(px, SY(waveY(wx)) + 3 * s, (6 + (i % 3) * 3) * s, 2 * s, 0, 0, TAU); cx.fill(); }
  // where the water meets land, foam
  for(let wx = Math.floor(V.camX / STEP) * STEP; wx < V.camX + W / s; wx += STEP){ const by = bedAt(wx); if(Math.abs(by - G.surf) < 10){ cx.fillStyle = rgba('#ffffff', .8); cx.beginPath(); cx.arc(SX(wx), SY(G.surf), 5 * s, 0, TAU); cx.fill(); } }
}

/* ---------------- things ---------------- */
function drawMine(m){
  if(m.hit) return; const x = SX(m.x), y = SY(waveY(m.x) - 6), s = V.s; if(x < -40 || x > W + 40) return;
  cx.fillStyle = '#2a2a32'; cx.strokeStyle = '#2a2a32'; cx.lineWidth = 4 * s;
  for(let k = 0; k < 8; k++){ const a = k / 8 * TAU + .2; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + Math.cos(a) * 24 * s, y + Math.sin(a) * 24 * s); cx.stroke(); cx.beginPath(); cx.arc(x + Math.cos(a) * 24 * s, y + Math.sin(a) * 24 * s, 3.5 * s, 0, TAU); cx.fill(); }
  cx.beginPath(); cx.arc(x, y, 17 * s, 0, TAU); cx.fill();
  cx.fillStyle = rgba('#ffffff', .2); cx.beginPath(); cx.arc(x - 5 * s, y - 6 * s, 6 * s, 0, TAU); cx.fill();
  const on = Math.sin(G.rt * 9) > 0; cx.fillStyle = on ? '#ff3a3a' : '#6a1a1a'; cx.beginPath(); cx.arc(x, y - 17 * s, 4 * s, 0, TAU); cx.fill(); if(on) glow(x, y - 17 * s, 20 * s, '#ff3a3a', .9);
}
function drawTent(t){
  const x = SX(t.x), s = V.s; if(x < -80 || x > W + 80) return;
  const base = SY(G.surf + 20);
  if(t.rise < .05){ // bubbles warn you
    if(t.x - G.x < 1300){ cx.fillStyle = rgba('#ffffff', .6); for(let k = 0; k < 6; k++){ const ph = (G.rt * 1.5 + k * .37 + t.ph) % 1; cx.beginPath(); cx.arc(x + Math.sin(k * 3 + G.rt * 4) * 18 * s, SY(G.surf + 40 - ph * 40), (3 + k % 3) * s, 0, TAU); cx.fill(); } }
    return;
  }
  const h = t.h * t.rise * s, sway = Math.sin(G.rt * 2 + t.ph) * 14 * s;
  cx.fillStyle = '#8a3aa8'; cx.beginPath(); cx.moveTo(x - 24 * s, base);
  cx.quadraticCurveTo(x - 26 * s + sway * .5, base - h * .5, x + sway - 6 * s, base - h);
  cx.quadraticCurveTo(x + sway + 12 * s, base - h - 14 * s, x + sway + 8 * s, base - h + 10 * s);
  cx.quadraticCurveTo(x + 22 * s + sway * .5, base - h * .5, x + 24 * s, base); cx.fill();
  cx.fillStyle = '#e8a8ff'; for(let k = 1; k < 6; k++){ const f = k / 6; cx.beginPath(); cx.arc(x + sway * f + 6 * s, base - h * f, (7 - k * .8) * s, 0, TAU); cx.fill(); }
}
function drawItem(it){
  if(it.got && it.gt > .35) return;
  const x = SX(it.x), s = V.s, bob = Math.sin(G.rt * 3 + it.ph) * 3, y = SY(it.y + bob); if(x < -30 || x > W + 30) return;
  if(it.got){ const k = it.gt / .35; cx.globalAlpha = 1 - k; cx.fillStyle = '#fff6c0'; cx.beginPath(); cx.arc(x, y - k * 20 * s, (10 + k * 8) * s, 0, TAU); cx.fill(); cx.globalAlpha = 1; return; }
  if(it.k === 'coin'){
    const w = Math.abs(Math.cos(G.rt * 4 + it.ph)); glow(x, y, 22 * s, '#ffd23a', .45);
    cx.fillStyle = '#e8a21a'; cx.beginPath(); cx.ellipse(x, y, 10 * s * Math.max(.2, w), 10 * s, 0, 0, TAU); cx.fill();
    cx.fillStyle = '#ffd84a'; cx.beginPath(); cx.ellipse(x, y, 7.5 * s * Math.max(.15, w), 7.5 * s, 0, 0, TAU); cx.fill();
    cx.fillStyle = rgba('#ffffff', .8); cx.fillRect(x - 1.5 * s * w, y - 5 * s, 3 * s * w, 4 * s);
  } else if(it.k === 'gem'){
    glow(x, y, 34 * s, '#7df0ff', .7); cx.fillStyle = '#4ad8ff'; cx.beginPath(); cx.moveTo(x, y - 16 * s); cx.lineTo(x + 13 * s, y - 4 * s); cx.lineTo(x, y + 16 * s); cx.lineTo(x - 13 * s, y - 4 * s); cx.fill();
    cx.fillStyle = '#c8f8ff'; cx.beginPath(); cx.moveTo(x, y - 16 * s); cx.lineTo(x + 5 * s, y - 4 * s); cx.lineTo(x, y + 6 * s); cx.lineTo(x - 5 * s, y - 4 * s); cx.fill();
  } else if(it.k === 'heart'){
    glow(x, y, 30 * s, '#ff5a7a', .6); cx.fillStyle = '#ff3a5a'; cx.beginPath(); cx.moveTo(x, y + 12 * s); cx.bezierCurveTo(x - 20 * s, y - 2 * s, x - 10 * s, y - 16 * s, x, y - 6 * s); cx.bezierCurveTo(x + 10 * s, y - 16 * s, x + 20 * s, y - 2 * s, x, y + 12 * s); cx.fill();
  } else if(it.k === 'bottle'){
    glow(x, y, 34 * s, '#fff0c0', .6); cx.save(); cx.translate(x, y); cx.rotate(Math.sin(G.rt * 2) * .4 + .6);
    cx.fillStyle = rgba('#9ae8c0', .85); cx.beginPath(); cx.roundRect(-14 * s, -6 * s, 22 * s, 12 * s, 4 * s); cx.fill(); cx.fillRect(8 * s, -3 * s, 8 * s, 6 * s);
    cx.fillStyle = '#b07a4a'; cx.fillRect(15 * s, -3 * s, 3 * s, 6 * s); cx.fillStyle = '#fff4d8'; cx.fillRect(-10 * s, -3 * s, 13 * s, 6 * s); cx.restore();
  }
}

/* ---------------- the boat ---------------- */
function drawBoat(){
  const b = G.b, sh = G.ship || shipById(save.ship), s = V.s, x = SX(G.x), y = SY(b.y + b.sink * 60);
  if(G.inv > 0 && Math.sin(G.rt * 40) > 0 && G.state === 'run') return;
  cx.save(); cx.translate(x, y); cx.rotate(b.ang); cx.scale(s, s);
  drawShip(sh, G.rt);
  cx.restore();
}
function drawShip(sh, t){
  const H1 = sh.hull, T = sh.trim;
  if(sh.id === 'duck'){
    cx.fillStyle = H1; cx.beginPath(); cx.ellipse(-2, -6, 30, 17, 0, 0, TAU); cx.fill();
    cx.beginPath(); cx.arc(16, -26, 13, 0, TAU); cx.fill();
    cx.fillStyle = T; cx.beginPath(); cx.moveTo(26, -28); cx.quadraticCurveTo(40, -24, 27, -20); cx.fill();
    cx.fillStyle = '#1a1a1a'; cx.beginPath(); cx.arc(20, -30, 2.4, 0, TAU); cx.fill();
    cx.fillStyle = '#ffe68a'; cx.beginPath(); cx.ellipse(-8, -10, 14, 6, -.3, 0, TAU); cx.fill();
    return;
  }
  const L = sh.id === 'galleon' ? 36 : sh.id === 'yacht' ? 34 : 30;
  // mast and sail
  if(sh.sail){
    cx.fillStyle = '#6a4a2a'; cx.fillRect(-2, -46, 3.5, 40);
    const fl = Math.sin(t * 5) * 3;
    cx.fillStyle = sh.sail; cx.beginPath(); cx.moveTo(2, -44); cx.quadraticCurveTo(22 + fl, -28, 2, -10); cx.closePath(); cx.fill();
    if(sh.id === 'galleon' || sh.id === 'junk'){ cx.beginPath(); cx.moveTo(-3, -42); cx.quadraticCurveTo(-24 + fl, -26, -3, -12); cx.closePath(); cx.fill(); }
    if(sh.id === 'galleon'){ cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(10, -28, 4, 0, TAU); cx.fill(); }
    cx.fillStyle = sh.id === 'galleon' ? '#1d1d24' : T; cx.beginPath(); cx.moveTo(-1, -46); cx.lineTo(-14 + Math.sin(t * 8) * 2, -43); cx.lineTo(-1, -40); cx.fill();
  } else {
    // cabin and funnel
    cx.fillStyle = T; cx.fillRect(-14, -24, 20, 16);
    cx.fillStyle = '#bfe8ff'; cx.fillRect(-10, -20, 6, 6); cx.fillRect(-1, -20, 5, 6);
    cx.fillStyle = sh.id === 'tug' ? '#e8553c' : '#2a6fd6'; cx.fillRect(-20, -36, 7, 14);
    cx.fillStyle = '#1a1a1a'; cx.fillRect(-20, -38, 7, 3);
  }
  // hull
  cx.fillStyle = H1; cx.beginPath(); cx.moveTo(-L, -9); cx.lineTo(L + 4, -11); cx.quadraticCurveTo(L - 2, 10, L - 12, 12); cx.lineTo(-L + 6, 12); cx.quadraticCurveTo(-L - 2, 6, -L, -9); cx.fill();
  cx.fillStyle = T; cx.fillRect(-L, -11, 2 * L + 4, 4);
  cx.fillStyle = rgba('#000000', .15); cx.fillRect(-L + 6, 4, 2 * L - 18, 8);
  if(sh.id === 'yacht' || sh.id === 'junk'){ cx.fillStyle = '#ffd23a'; for(let i = -2; i <= 2; i++){ cx.beginPath(); cx.arc(i * 10, -1, 2.2, 0, TAU); cx.fill(); } }
}

/* ---------------- weather ---------------- */
const WX = Array.from({ length:90 }, () => ({ x:Math.random(), y:Math.random(), s:rnd(.6, 1.4) }));
function drawWeather(){
  const B = BIOMES[curBiome], a = G.biomeK;
  if(B.id === 'storm'){
    cx.strokeStyle = rgba('#cfe0ff', .45 * a); cx.lineWidth = 1.5;
    for(const p of WX){ const x = ((p.x * W - G.rt * 180 * p.s) % W + W) % W, y = (p.y * H + G.rt * 900 * p.s) % H; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x - 6, y + 18); cx.stroke(); }
    if(Math.sin(G.rt * .7) > .995){ cx.fillStyle = rgba('#ffffff', .25); cx.fillRect(0, 0, W, H); }
  } else if(B.id === 'arctic'){
    cx.fillStyle = rgba('#ffffff', .8 * a);
    for(const p of WX){ const x = ((p.x * W - G.rt * 40 * p.s + Math.sin(G.rt + p.y * 9) * 20) % W + W) % W, y = (p.y * H + G.rt * 60 * p.s) % H; cx.beginPath(); cx.arc(x, y, 2 * p.s, 0, TAU); cx.fill(); }
  } else if(B.id === 'night'){
    for(let i = 0; i < 24; i++){ const p = WX[i], x = ((p.x * W - G.x * .2 * p.s) % W + W) % W, y = SY(G.surf + 40 + p.y * 400); glow(x, y, 10, '#7df0ff', a * (.4 + .4 * Math.sin(G.rt * 2 + i))); }
  } else if(B.id === 'volcano'){
    for(let i = 0; i < 40; i++){ const p = WX[i], x = ((p.x * W - G.rt * 50) % W + W) % W, y = H - ((p.y * H + G.rt * 70 * p.s) % H); cx.fillStyle = rgba('#ff8a3a', .8 * a); cx.fillRect(x, y, 2.5, 2.5); }
  }
}

/* ---------------- frame ---------------- */
function render(){
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if(G.biome !== curBiome){ prevBiome = curBiome; curBiome = G.biome; }
  const sh = G.shake;
  V.camX = G.x - (W / V.s) * (V.camFrac || (W < H ? .24 : .3));
  // the camera rises with big jumps so the boat never leaves the screen
  const halfH = H / 2 / V.s, want = Math.min(330, G.b.y - 150 + halfH);
  V.cy = V.lockCy !== undefined ? V.lockCy : V.cy === undefined ? want : lerp(V.cy, want, Math.min(1, (G.rt - (V.lt || G.rt)) * (want < V.cy ? 7 : 3))); V.lt = G.rt;
  V.oy = H / 2 - V.cy * V.s;
  drawSky();
  cx.save(); cx.translate(rnd(-sh, sh), rnd(-sh, sh));
  for(const c of G.ceil) drawCeil(c);
  drawBed();
  for(const t of G.tent) drawTent(t);
  for(const m of G.mines) drawMine(m);
  drawBoat();
  drawWater();
  for(const it of G.items) drawItem(it);
  // particles
  for(const p of G.parts){ cx.globalAlpha = Math.min(1, p.l * 2.5); cx.fillStyle = p.c; const ps = p.s * V.s; cx.fillRect(SX(p.x) - ps / 2, SY(p.y) - ps / 2, ps, ps); }
  cx.globalAlpha = 1;
  for(const r of G.rings){ const k = r.t / .6; cx.strokeStyle = rgba(r.c || '#ffffff', .7 * (1 - k)); cx.lineWidth = 3 * V.s; cx.beginPath(); cx.ellipse(SX(r.x), SY(r.y), lerp(r.r, r.R, k) * V.s, lerp(r.r, r.R, k) * V.s * .3, 0, 0, TAU); cx.stroke(); }
  // floating words
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(const p of G.pops){ const k = p.t / p.d, sc = k < .15 ? .6 + k / .15 * .5 : 1.1 - (k - .15) * .1; cx.globalAlpha = k > .7 ? (1 - k) / .3 : 1; const sz = Math.round(p.s * Math.max(.85, V.s) * sc); cx.font = `italic 900 ${sz}px system-ui,sans-serif`; cx.lineWidth = Math.max(3, sz * .18); cx.strokeStyle = 'rgba(10,20,40,.85)'; cx.strokeText(p.txt, SX(p.x), SY(p.y)); cx.fillStyle = p.c; cx.fillText(p.txt, SX(p.x), SY(p.y)); }
  cx.globalAlpha = 1;
  cx.restore();
  drawWeather();
  // the tide marker on the right edge: where your hand is
  if(G.state === 'run' || G.state === 'title'){
    const y = H / 2 + (G.target - 330) * V.s, x = W - 14;
    cx.fillStyle = rgba('#ffffff', .75); cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x - 14, y - 9); cx.lineTo(x - 14, y + 9); cx.fill();
    cx.strokeStyle = rgba('#ffffff', .25); cx.lineWidth = 2; cx.setLineDash([6, 6]); cx.beginPath(); cx.moveTo(x - 16, y); cx.lineTo(x - 80, y); cx.stroke(); cx.setLineDash([]);
  }
  if(G.flash > 0){ cx.fillStyle = `rgba(255,255,255,${G.flash * .6})`; cx.fillRect(0, 0, W, H); }
  if(G.state === 'run' && G.hearts === 1){ const g = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .7); g.addColorStop(0, 'rgba(255,0,40,0)'); g.addColorStop(1, `rgba(255,0,40,${.18 + .08 * Math.sin(G.rt * 5)})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
}
