'use strict';
const cv = $('c'), cx = cv.getContext('2d', { alpha:false });
let W = 0, H = 0, DPR = 1, vign = null, grassPat = null, lakePat = null, shX = 0, shY = 0;
const sx = x => (x - G.camX) * G.camZ + W / 2, sy = y => (y - G.camY) * G.camZ + H / 2;

/* ---------------- cached sprites ---------------- */
const glowC = new Map();
function glowSpr(col){
  let c = glowC.get(col); if(c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(col, .85)); gr.addColorStop(.22, rgba(col, .4)); gr.addColorStop(.55, rgba(col, .1)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); if(glowC.size > 80) glowC.clear(); glowC.set(col, c); return c;
}
function glow(x, y, r, col, a){ if(a <= 0 || r <= 0) return; cx.globalAlpha = Math.min(1, a); cx.drawImage(glowSpr(col), x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1; }
const sprC = new Map();
// a blooming flower with a tiny happy face
function flowerSpr(col, pet, kind){
  const key = 'f' + col + pet + kind; let c = sprC.get(key); if(c) return c;
  const S = 96; c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); g.translate(S / 2, S / 2);
  const n = kind === 'lotus' ? 10 : pet, L = kind === 'lotus' ? 40 : 38, Wd = kind === 'lotus' ? 12 : 15;
  for(let layer = 0; layer < (kind === 'lotus' ? 2 : 1); layer++){
    for(let i = 0; i < n; i++){
      g.save(); g.rotate(i / n * TAU + layer * Math.PI / n);
      const gr = g.createLinearGradient(0, 0, 0, -L * (1 - layer * .3));
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(.35, mixHex(col, '#ffffff', .35)); gr.addColorStop(1, col);
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(0, -L * (1 - layer * .3) * .52, Wd * (1 - layer * .25) * .62, L * (1 - layer * .3) * .5, 0, 0, TAU); g.fill();
      g.strokeStyle = rgba('#ffffff', .35); g.lineWidth = 1.2; g.stroke();
      g.restore();
    }
  }
  const cr = 12;
  const cg = g.createRadialGradient(-3, -3, 1, 0, 0, cr);
  cg.addColorStop(0, '#fffbe0'); cg.addColorStop(1, kind === 'gold' ? '#ffb020' : '#ffd86a');
  g.fillStyle = cg; g.beginPath(); g.arc(0, 0, cr, 0, TAU); g.fill();
  // face
  g.fillStyle = '#3a2440'; g.beginPath(); g.arc(-4.2, -1.5, 1.8, 0, TAU); g.arc(4.2, -1.5, 1.8, 0, TAU); g.fill();
  g.strokeStyle = '#3a2440'; g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); g.arc(0, 1.5, 3.2, .2, Math.PI - .2); g.stroke();
  g.fillStyle = 'rgba(255,120,150,.55)'; g.beginPath(); g.arc(-7.5, 2.5, 2, 0, TAU); g.arc(7.5, 2.5, 2, 0, TAU); g.fill();
  sprC.set(key, c); return c;
}
// a sleeping bud (closed eyes, tiny leaves)
function budSpr(col, kind){
  const key = 'b' + col + kind; let c = sprC.get(key); if(c) return c;
  const S = 64; c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); g.translate(S / 2, S / 2 + 6);
  g.fillStyle = '#3fae7a';
  g.beginPath(); g.ellipse(-9, 8, 9, 4, -.5, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(9, 8, 9, 4, .5, 0, TAU); g.fill();
  const gr = g.createRadialGradient(-4, -10, 2, 0, -4, 20);
  gr.addColorStop(0, mixHex(col, '#ffffff', .6)); gr.addColorStop(1, col);
  g.fillStyle = gr;
  g.beginPath(); g.moveTo(0, -24); g.bezierCurveTo(14, -16, 16, 6, 0, 8); g.bezierCurveTo(-16, 6, -14, -16, 0, -24); g.fill();
  g.strokeStyle = rgba('#ffffff', .4); g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -22); g.quadraticCurveTo(-3, -8, 0, 6); g.stroke();
  // sleepy face
  g.strokeStyle = '#3a2440'; g.lineWidth = 1.6; g.lineCap = 'round';
  g.beginPath(); g.arc(-4.5, -6, 2.4, .15 * Math.PI, .85 * Math.PI); g.stroke();
  g.beginPath(); g.arc(4.5, -6, 2.4, .15 * Math.PI, .85 * Math.PI); g.stroke();
  g.fillStyle = 'rgba(255,120,150,.45)'; g.beginPath(); g.arc(-7.5, -2, 1.8, 0, TAU); g.arc(7.5, -2, 1.8, 0, TAU); g.fill();
  if(kind === 'gold'){ g.fillStyle = '#fff'; g.beginPath(); g.arc(8, -20, 2, 0, TAU); g.fill(); }
  sprC.set(key, c); return c;
}

/* ---------------- resize / textures ---------------- */
function resize(){
  W = innerWidth; H = innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, G.q === 'low' ? 1 : 2);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  const c = document.createElement('canvas'); c.width = Math.max(1, W >> 1); c.height = Math.max(1, H >> 1);
  const g = c.getContext('2d'), gr = g.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * .3, c.width / 2, c.height / 2, Math.hypot(c.width, c.height) / 2);
  gr.addColorStop(0, 'rgba(5,3,20,0)'); gr.addColorStop(1, 'rgba(5,3,20,.62)'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  vign = c;
  if(!grassPat) makeTextures();
}
// ground and lake are drawn from small opaque tiles (fast everywhere); the tiles are
// re-tinted only while the sky palette is changing between hours
let grassTile = null, lakeTile = null, tileKey = '';
const TILE = 256;
function makeTextures(){ grassPat = lakePat = true; }
function buildTiles(pal){
  const key = pal.g + pal.lake; if(key === tileKey) return; tileKey = key;
  const r = mulberry32(7);
  grassTile = grassTile || document.createElement('canvas'); grassTile.width = grassTile.height = TILE;
  const g = grassTile.getContext('2d'); g.lineCap = 'round';
  g.fillStyle = pal.g; g.fillRect(0, 0, TILE, TILE);
  for(let i = 0; i < 90; i++){
    const x = r() * TILE, y = 14 + r() * (TILE - 14), h = 5 + r() * 9, a = .05 + r() * .09;
    g.strokeStyle = `rgba(170,190,255,${a})`; g.lineWidth = 1.2;
    for(let k = -1; k <= 1; k++){ g.beginPath(); g.moveTo(x + k * 2, y); g.quadraticCurveTo(x + k * 3, y - h * .6, x + k * 5, y - h); g.stroke(); }
  }
  for(let i = 0; i < 40; i++){ g.fillStyle = `rgba(200,210,255,${.05 + r() * .08})`; g.beginPath(); g.arc(4 + r() * (TILE - 8), 4 + r() * (TILE - 8), .8 + r() * 1.4, 0, TAU); g.fill(); }
  for(let i = 0; i < 6; i++){ const x = 8 + r() * (TILE - 16), y = 8 + r() * (TILE - 16); g.fillStyle = 'rgba(255,200,230,.1)'; for(let k = 0; k < 4; k++){ g.beginPath(); g.arc(x + Math.cos(k * 1.57) * 2.5, y + Math.sin(k * 1.57) * 2.5, 2, 0, TAU); g.fill(); } }
  lakeTile = lakeTile || document.createElement('canvas'); lakeTile.width = lakeTile.height = TILE;
  const h = lakeTile.getContext('2d');
  h.fillStyle = pal.lake; h.fillRect(0, 0, TILE, TILE);
  for(let i = 0; i < 26; i++){ const a = .15 + r() * .5; h.fillStyle = `rgba(220,230,255,${a})`; h.beginPath(); h.arc(3 + r() * (TILE - 6), 3 + r() * (TILE - 6), .5 + r() * 1.3, 0, TAU); h.fill(); }
  for(let i = 0; i < 5; i++){ h.strokeStyle = 'rgba(180,200,255,.05)'; h.lineWidth = 1; const x = 60 + r() * (TILE - 120), y = 4 + r() * (TILE - 8), w = 20 + r() * 40; h.beginPath(); h.moveTo(x - w, y); h.lineTo(x + w, y); h.stroke(); }
}
// tiles are pre-scaled to the current zoom so drawing them is a plain 1:1 copy
const tileScaled = new Map();
function scaledTile(img, name){
  const px = Math.max(16, Math.round(TILE * G.camZ));
  const key = name + px + tileKey; let c = tileScaled.get(name);
  if(c && c.key === key) return c;
  c = c || document.createElement('canvas'); c.width = c.height = px; c.key = key;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.drawImage(img, 0, 0, px, px);
  tileScaled.set(name, c); return c;
}
function tileFill(img, name){
  const t = scaledTile(img, name), s = t.width, Z = s / TILE;
  const ox = W / 2 - G.camX * Z, oy = H / 2 - G.camY * Z;
  const x0 = Math.floor(-ox / s), y0 = Math.floor(-oy / s), x1 = Math.floor((W - ox) / s), y1 = Math.floor((H - oy) / s);
  for(let i = x0; i <= x1; i++) for(let j = y0; j <= y1; j++) cx.drawImage(t, Math.round(ox + i * s), Math.round(oy + j * s));
}

/* ---------------- palette over time ---------------- */
function curPal(){
  const h = G.hour || 1, p = hourPal(h), q = hourPal(Math.max(1, h - 1));
  let k = h === 1 ? 1 : clamp((G.t - (h - 1) * HOUR_LEN) / 4, 0, 1);
  k = Math.round(k * 8) / 8;   // quantized so the tiles are rebuilt only a few times per transition
  return { g:mixHex(q.g, p.g, k), lake:mixHex(q.lake, p.lake, k), tint:mixHex(q.tint, p.tint, k) };
}

/* ---------------- background: starry lake + meadow island ---------------- */
function drawBg(){
  const pal = curPal(), Z = G.camZ;
  buildTiles(pal);
  const mx = sx(0), my = sy(0), mr = WORLD_R * Z;
  // is the whole screen inside the meadow? then there is no lake to draw and no clipping needed
  const far = Math.max(Math.hypot(-mx, -my), Math.hypot(W - mx, -my), Math.hypot(-mx, H - my), Math.hypot(W - mx, H - my));
  const inside = far < mr;
  if(!inside){
    tileFill(lakeTile, 'lake');
    // twinkling reflections
    const cs = 240, x0 = Math.floor((G.camX - W / 2 / Z) / cs), x1 = Math.ceil((G.camX + W / 2 / Z) / cs);
    const y0 = Math.floor((G.camY - H / 2 / Z) / cs), y1 = Math.ceil((G.camY + H / 2 / Z) / cs);
    cx.globalCompositeOperation = 'lighter';
    for(let i = x0; i <= x1; i++) for(let j = y0; j <= y1; j++){
      const hsh = (Math.imul(i, 73856093) ^ Math.imul(j, 19349663)) >>> 0, wx = i * cs + (hsh % cs), wy = j * cs + ((hsh >> 8) % cs);
      if(wx * wx + wy * wy < (WORLD_R + 40) ** 2) continue;
      const tw = .5 + .5 * Math.sin(G.rt * (1 + (hsh % 7) * .3) + hsh);
      glow(sx(wx), sy(wy), (6 + (hsh % 5)) * Z * (.6 + tw * .6), '#cfe0ff', .35 + tw * .4);
    }
    cx.globalCompositeOperation = 'source-over';
    cx.save(); cx.beginPath(); cx.arc(mx, my, mr, 0, TAU); cx.clip();
    tileFill(grassTile, 'grass');
    cx.restore();
  } else tileFill(grassTile, 'grass');
  // everything you have ever looped stays painted (only the visible part of the paint layer is drawn)
  if(paintC){
    const s = PAINT_S, pw = paintC.width;
    const vx0 = G.camX - W / 2 / Z, vy0 = G.camY - H / 2 / Z;
    let u0 = (vx0 + WORLD_R) * s, v0 = (vy0 + WORLD_R) * s, u1 = u0 + W / Z * s, v1 = v0 + H / Z * s;
    const cu0 = clamp(u0, 0, pw), cv0 = clamp(v0, 0, pw), cu1 = clamp(u1, 0, pw), cv1 = clamp(v1, 0, pw);
    if(cu1 > cu0 + 1 && cv1 > cv0 + 1){
      const k = Z / s;
      cx.imageSmoothingEnabled = true;
      cx.drawImage(paintC, cu0, cv0, cu1 - cu0, cv1 - cv0, (cu0 - u0) * k, (cv0 - v0) * k, (cu1 - cu0) * k, (cv1 - cv0) * k);
    }
  }
  // shore glow
  if(!inside){
    cx.strokeStyle = rgba(pal.tint, .1); cx.lineWidth = 34 * Z; cx.beginPath(); cx.arc(mx, my, mr, 0, TAU); cx.stroke();
    cx.strokeStyle = rgba(pal.tint, .35); cx.lineWidth = Math.max(1.5, 3 * Z); cx.stroke();
  }
}

/* ---------------- world objects ---------------- */
const easeBack = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function onScreen(x, y, r){ return x > -r && y > -r && x < W + r && y < H + r; }
// flower + its soft glow baked into one sprite: a single draw per flower
function flowerGlowSpr(col, pet, kind){
  const key = 'g' + col + pet + kind; let c = sprC.get(key); if(c) return c;
  const S = 128; c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, rgba(col, .42)); gr.addColorStop(.45, rgba(col, .16)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.drawImage(flowerSpr(col, pet, kind), 16, 16, 96, 96);
  sprC.set(key, c); return c;
}
function drawFlowers(){
  const Z = G.camZ;
  cx.globalCompositeOperation = 'lighter';
  for(const f of G.F){ if(f.t >= 1) continue; const x = sx(f.x), y = sy(f.y), r = f.sz * 2.6 * Z; if(!onScreen(x, y, r)) continue; glow(x, y, r, f.col, (1 - f.t) * .7); }
  cx.globalCompositeOperation = 'source-over';
  for(const f of G.F){
    const x = sx(f.x), y = sy(f.y), r = f.sz * Z; if(!onScreen(x, y, r * 3)) continue;
    const s = f.t < .5 ? Math.max(0, easeBack(f.t / .5)) : 1;
    const a = Math.sin(G.rt * 1.4 + f.ph) * .12 + (f.t < .5 ? (1 - f.t / .5) * 1.2 : 0), c = Math.cos(a) * s * DPR, sn = Math.sin(a) * s * DPR;
    cx.setTransform(c, sn, -sn, c, x * DPR + shX, y * DPR + shY);
    const d = r * 2.8;
    cx.drawImage(flowerGlowSpr(f.col, f.pet, f.kind), -d, -d, d * 2, d * 2);
  }
  cx.setTransform(DPR, 0, 0, DPR, shX, shY);
}
function budGlowSpr(col, kind){
  const key = 'bg' + col + kind; let c = sprC.get(key); if(c) return c;
  const S = 128; c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  const a = kind === 'gold' ? .6 : .34;
  gr.addColorStop(0, rgba(col, a)); gr.addColorStop(.4, rgba(col, a * .35)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.drawImage(budSpr(col, kind), 32, 32, 64, 64);
  sprC.set(key, c); return c;
}
function drawBuds(){
  const Z = G.camZ;
  for(const b of G.B){
    const x = sx(b.x), y = sy(b.y), r = b.r * Z; if(!onScreen(x, y, r * 5)) continue;
    let al = 1; if(b.life < 3) al = .35 + .65 * Math.abs(Math.sin(b.life * 5));
    const s = easeBack(Math.min(1, b.grow)) * (1 + .05 * Math.sin(G.rt * 2.2 + b.ph));
    const a = Math.sin(G.rt * 1.1 + b.ph) * .1, c = Math.cos(a) * s * DPR, sn = Math.sin(a) * s * DPR;
    cx.globalAlpha = al;
    cx.setTransform(c, sn, -sn, c, x * DPR + shX, y * DPR + shY);
    const d = r * (b.kind === 'lotus' ? 2.3 : 2.4) * 2;
    cx.drawImage(budGlowSpr(b.col, b.kind), -d, -d, d * 2, d * 2);
  }
  cx.globalAlpha = 1;
  cx.setTransform(DPR, 0, 0, DPR, shX, shY);
}
function trailCol(t){
  const s = skin();
  if(s.c2 === 'aurora'){ const h = (G.rt * 60 + t * 240) % 360; return `hsl(${h},100%,75%)`; }
  return mixHex(s.c3, s.c2, t);
}
function drawTrail(){
  const TR = G.TR, n = TR.length; if(n < 2) return;
  const Z = G.camZ, pts = TR.concat([{ x:P.x, y:P.y }]), N = pts.length;
  const full = G.trLen / trailMax();
  // preview of the loop you are about to close
  const pv = G.preview;
  if(pv){
    cx.globalCompositeOperation = 'lighter';
    cx.fillStyle = rgba(skin().c2 === 'aurora' ? '#c8a8ff' : skin().c2, .05 + .1 * pv.k);
    cx.beginPath(); pv.poly.forEach((p, i) => i ? cx.lineTo(sx(p.x), sy(p.y)) : cx.moveTo(sx(p.x), sy(p.y))); cx.closePath(); cx.fill();
    cx.globalCompositeOperation = 'source-over';
    const q = TR[pv.i];
    cx.setLineDash([4, 6]); cx.strokeStyle = `rgba(255,255,255,${.3 + .5 * pv.k})`; cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(sx(P.x), sy(P.y)); cx.lineTo(sx(q.x), sy(q.y)); cx.stroke(); cx.setLineDash([]);
    glow(sx(q.x), sy(q.y), 16 + 10 * Math.sin(G.rt * 12), '#ffffff', .6 * pv.k + .2);
  }
  cx.lineCap = 'round'; cx.lineJoin = 'round';
  cx.globalCompositeOperation = 'lighter';
  const chunks = Math.min(10, Math.max(1, (N / 8) | 0));
  for(let c = 0; c < chunks; c++){
    const i0 = Math.floor(c / chunks * (N - 1)), i1 = Math.floor((c + 1) / chunks * (N - 1));
    const t = (c + 1) / chunks, col = trailCol(t);
    const fade = (.25 + .75 * t) * (full > .85 && c === 0 ? .5 : 1);
    const path = () => { cx.beginPath(); cx.moveTo(sx(pts[i0].x), sy(pts[i0].y)); for(let i = i0 + 1; i <= i1; i++) cx.lineTo(sx(pts[i].x), sy(pts[i].y)); };
    path();
    if(G.q !== 'low'){ cx.strokeStyle = col; cx.globalAlpha = .14 * fade; cx.lineWidth = Math.max(10, 24 * Z); cx.stroke(); }
    cx.globalAlpha = .5 * fade; cx.lineWidth = Math.max(4, 9 * Z); cx.strokeStyle = col; cx.stroke();
    cx.globalAlpha = .9 * fade; cx.lineWidth = Math.max(1.6, 3.2 * Z); cx.strokeStyle = '#ffffff'; cx.stroke();
  }
  cx.globalAlpha = 1;
  // sparkles along the ribbon
  for(let i = 0; i < N; i += 5){ const tw = Math.sin(G.rt * 8 + i * 1.7); if(tw > .6) glow(sx(pts[i].x), sy(pts[i].y), 7 * Z + 3, '#ffffff', (tw - .6) * 2); }
  cx.globalCompositeOperation = 'source-over';
}
function drawLoops(){
  const Z = G.camZ;
  cx.globalCompositeOperation = 'lighter';
  for(const l of G.LP){
    const k = l.life / l.max, s = 1 + (1 - k) * .1;
    cx.beginPath();
    l.poly.forEach((p, i) => { const x = sx(l.cx + (p.x - l.cx) * s), y = sy(l.cy + (p.y - l.cy) * s); i ? cx.lineTo(x, y) : cx.moveTo(x, y); });
    cx.closePath();
    cx.fillStyle = rgba(l.c, (l.harm ? .4 : .15) * k * k); cx.fill();
    cx.strokeStyle = rgba('#ffffff', .9 * k); cx.lineWidth = Math.max(2, 5 * Z * k); cx.lineJoin = 'round'; cx.stroke();
    cx.strokeStyle = rgba(l.c, .5 * k); cx.lineWidth = Math.max(6, 18 * Z * k); cx.stroke();
  }
  cx.globalCompositeOperation = 'source-over';
}
function blobPath(x, y, r, t, wob, n){
  n = n || 14; cx.beginPath();
  for(let i = 0; i <= n; i++){ const a = i / n * TAU, rr = r * (1 + wob * Math.sin(t * 3 + i * 1.9) * .5 + wob * Math.sin(t * 5.3 + i * 3.1) * .3); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? cx.lineTo(px, py) : cx.moveTo(px, py); }
  cx.closePath();
}
function drawGloom(e){
  const Z = G.camZ, x = sx(e.x), y = sy(e.y), born = e.born > 0 ? 1 - e.born / .6 : 1;
  const r = e.r * Z * (e.caught ? 1.1 : 1) * born;
  if(r <= .5) return;
  // soft shadow halo + a faint colored aura so they read on the dark meadow
  cx.fillStyle = 'rgba(8,4,24,.35)'; cx.beginPath(); cx.arc(x, y + r * .15, r * 1.35, 0, TAU); cx.fill();
  const aura = e.boss ? '#c8a8ff' : e.type === 'snip' ? '#ff8fc8' : e.type === 'chaser' ? '#ffb38a' : e.type === 'weeper' ? '#8fd8ff' : '#a89cff';
  cx.globalCompositeOperation = 'lighter'; glow(x, y, r * 2.1, aura, (e.warn ? .45 + .35 * Math.sin(G.rt * 30) : .22)); cx.globalCompositeOperation = 'source-over';
  const bodyCol = e.boss ? '#2a1850' : e.type === 'snip' ? '#3a1d5a' : e.type === 'chaser' ? '#2c2058' : e.type === 'brood' ? '#251a4a' : e.type === 'weeper' ? '#1e2450' : '#2e2456';
  const rim = e.boss ? '#c8a8ff' : e.type === 'snip' ? '#ff8fc8' : e.type === 'chaser' ? '#ffb38a' : e.type === 'weeper' ? '#8fd8ff' : '#a89cff';
  cx.save(); cx.translate(x, y);
  if(e.type === 'snip'){ cx.rotate(Math.atan2(e.vy, e.vx)); cx.scale(1.35, .8); }
  const gr = cx.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r * 1.1);
  gr.addColorStop(0, mixHex(bodyCol, '#8a78d0', .55)); gr.addColorStop(1, bodyCol);
  blobPath(0, 0, r, e.t + e.ph, e.boss ? .12 : .09, e.boss ? 22 : 14);
  cx.fillStyle = e.flash > 0 ? '#ffffff' : gr; cx.fill();
  cx.strokeStyle = rgba(rim, .85); cx.lineWidth = Math.max(2, 3 * Z * (e.boss ? 2 : 1)); cx.stroke();
  cx.restore();
  if(e.caught){ glow(x, y, r * 2.5, '#ffffff', .8); return; }
  // eyes: big, droopy and a little sad, looking at you
  const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1, lx = dx / d, ly = dy / d;
  const er = r * (e.boss ? .16 : e.type === 'brood' ? .17 : .3), ex = r * (e.boss ? .3 : .36), ey = -r * .12;
  const blink = Math.sin(e.t * 1.3 + e.ph * 5) > .97;
  for(const s of [-1, 1]){
    const px = x + s * ex, py = y + ey;
    cx.fillStyle = '#f4efff'; cx.beginPath(); cx.ellipse(px, py, er, blink ? er * .15 : er * 1.1, 0, 0, TAU); cx.fill();
    if(!blink){ cx.fillStyle = '#1a0f2e'; cx.beginPath(); cx.arc(px + lx * er * .4, py + ly * er * .4 + er * .15, er * .5, 0, TAU); cx.fill();
      cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(px + lx * er * .4 - er * .18, py + ly * er * .4 - er * .05, er * .16, 0, TAU); cx.fill(); }
    // droopy lid
    cx.fillStyle = bodyCol; cx.beginPath(); cx.ellipse(px, py - er * .75, er * 1.25, er * .6, s * (e.type === 'snip' ? -.5 : .35), 0, TAU); cx.fill();
  }
  if(e.type === 'weeper' || e.boss){ cx.fillStyle = 'rgba(143,216,255,.8)'; const tt = (e.t * .8) % 1; for(const s of [-1, 1]){ cx.beginPath(); cx.arc(x + s * ex, y + ey + er + tt * r * .6, Math.max(1.2, er * .25 * (1 - tt)), 0, TAU); cx.fill(); } }
  if(e.type === 'brood'){ for(let k = 0; k < 3; k++){ const a = e.t * .8 + k * 2.1, bx = x + Math.cos(a) * r * .55, by = y + r * .35 + Math.sin(a) * r * .15; cx.fillStyle = '#f4efff'; cx.beginPath(); cx.arc(bx, by, r * .07, 0, TAU); cx.fill(); cx.fillStyle = '#1a0f2e'; cx.beginPath(); cx.arc(bx, by, r * .035, 0, TAU); cx.fill(); } }
  if(e.boss){
    for(let k = 0; k < e.hp; k++){ const a = G.rt * .8 + k / 3 * TAU; glow(x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25, 14, '#c8a8ff', .9); }
  }
}
function drawButterfly(f){
  const Z = G.camZ, x = sx(f.x), y = sy(f.y), s = Math.max(.6, Z) * 1.1, w = Math.abs(Math.sin(f.ph)) * .8 + .2;
  const a = f.life < 2 ? f.life / 2 : 1;
  cx.globalCompositeOperation = 'lighter'; glow(x, y, 26 * s, f.col, .5 * a); cx.globalCompositeOperation = 'source-over';
  cx.save(); cx.translate(x, y); cx.rotate(Math.atan2(f.vy, f.vx) + Math.PI / 2); cx.globalAlpha = a;
  for(const side of [-1, 1]){
    cx.save(); cx.scale(side * w, 1);
    cx.fillStyle = f.col; cx.strokeStyle = 'rgba(255,255,255,.8)'; cx.lineWidth = 1;
    cx.beginPath(); cx.ellipse(6 * s, -4 * s, 7 * s, 5.5 * s, -.5, 0, TAU); cx.fill(); cx.stroke();
    cx.fillStyle = mixHex(f.col, '#ffffff', .4);
    cx.beginPath(); cx.ellipse(5 * s, 5 * s, 4.5 * s, 3.5 * s, .5, 0, TAU); cx.fill(); cx.stroke();
    cx.restore();
  }
  cx.fillStyle = '#3a2440'; cx.beginPath(); cx.ellipse(0, 0, 1.6 * s, 6 * s, 0, 0, TAU); cx.fill();
  cx.restore(); cx.globalAlpha = 1;
}
function drawPlayer(){
  if(!P) return;
  const Z = G.camZ, x = sx(P.x), y = sy(P.y), s = skin(), lk = G.light / G.maxLight;
  const c2 = s.c2 === 'aurora' ? `hsl(${(G.rt * 80) % 360},100%,72%)` : s.c2;
  const gcol = s.c2 === 'aurora' ? '#ffffff' : s.c2;
  if(G.state === 'dying'){ const k = Math.max(0, G.dieT / 1.8); glow(x, y, 70 * k * Z + 10, gcol, k); return; }
  if(P.inv > 0 && P.hit <= 0 && ((G.rt * 14) | 0) % 2) return;
  cx.globalCompositeOperation = 'lighter';
  glow(x, y, (60 + 90 * lk) * Math.max(.6, Z), gcol, .45 + .25 * Math.sin(G.rt * 3));
  glow(x, y, 26 * Math.max(.7, Z), '#ffffff', .8);
  cx.globalCompositeOperation = 'source-over';
  const r = P.r * 1.25 * Math.max(.8, Z);
  cx.save(); cx.translate(x, y); cx.rotate(P.ang + Math.PI / 2);
  const fl = Math.sin(G.rt * 40) * .35 + .65;
  cx.fillStyle = 'rgba(235,245,255,.55)'; cx.strokeStyle = 'rgba(255,255,255,.8)'; cx.lineWidth = 1;
  for(const sd of [-1, 1]){ cx.beginPath(); cx.ellipse(sd * r * .95, -r * .2, r * .95 * fl, r * .45, sd * .5, 0, TAU); cx.fill(); cx.stroke(); }
  const bg = cx.createRadialGradient(0, r * .2, 1, 0, 0, r * 1.2);
  bg.addColorStop(0, '#ffffff'); bg.addColorStop(.5, s.c1); bg.addColorStop(1, c2);
  cx.fillStyle = bg; cx.beginPath(); cx.ellipse(0, 0, r * .72, r, 0, 0, TAU); cx.fill();
  cx.fillStyle = '#3a2440'; cx.beginPath(); cx.arc(-r * .28, -r * .45, r * .12, 0, TAU); cx.arc(r * .28, -r * .45, r * .12, 0, TAU); cx.fill();
  cx.restore();
  if(G.up.halo && G.haloT <= 0){ cx.strokeStyle = `rgba(255,255,255,${.5 + .3 * Math.sin(G.rt * 4)})`; cx.lineWidth = 2; cx.beginPath(); cx.arc(x, y, r * 2.2, 0, TAU); cx.stroke(); }
  if(G.twin){ cx.globalCompositeOperation = 'lighter'; glow(sx(G.twin.x), sy(G.twin.y), 22 * Math.max(.7, Z), gcol, .9); glow(sx(G.twin.x), sy(G.twin.y), 7, '#ffffff', 1); cx.globalCompositeOperation = 'source-over'; }
}

/* ---------------- ambient fireflies ---------------- */
function tickAmbient(dt){
  const vr = viewR();
  while(G.AMB.length < (G.q === 'low' ? 10 : 26)) G.AMB.push({ x:G.camX + rnd(-vr, vr), y:G.camY + rnd(-vr, vr), ph:rnd(0, TAU), sp:rnd(.5, 1.5) });
  for(const a of G.AMB){
    a.ph += dt * a.sp; a.x += Math.cos(a.ph * .7) * 14 * dt; a.y += Math.sin(a.ph) * 10 * dt;
    if(Math.abs(a.x - G.camX) > vr * 1.1 || Math.abs(a.y - G.camY) > vr * 1.1){ a.x = G.camX + rnd(-vr, vr); a.y = G.camY + rnd(-vr, vr); }
  }
}

/* ---------------- main render ---------------- */
function render(){
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const sh = save.opt.shake ? G.shake : 0;
  shX = (Math.random() * 2 - 1) * sh * DPR; shY = (Math.random() * 2 - 1) * sh * DPR;
  cx.save(); cx.translate(shX / DPR, shY / DPR);
  drawBg();
  const Z = G.camZ;
  drawFlowers();
  drawBuds();
  drawLoops();
  if(G.tutRing && G.state === 'play'){
    // tutorial: a dotted guide circle with a ghost spirit showing the motion
    const g = G.tutRing, x = sx(g.x), y = sy(g.y), r = g.r * Z, a = G.rt * 2.4;
    cx.setLineDash([6, 10]); cx.lineDashOffset = -G.rt * 30; cx.strokeStyle = `rgba(255,243,200,${.45 + .2 * Math.sin(G.rt * 4)})`; cx.lineWidth = 3;
    cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.stroke(); cx.setLineDash([]);
    cx.globalCompositeOperation = 'lighter'; glow(x + Math.cos(a) * r, y + Math.sin(a) * r, 22, '#ffd98a', .9); cx.globalCompositeOperation = 'source-over';
  }
  drawTrail();
  // tears
  for(const t of G.T){ const x = sx(t.x), y = sy(t.y), r = Math.max(3, t.r * Z); if(!onScreen(x, y, 20)) continue; cx.fillStyle = '#241a50'; cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.fill(); cx.strokeStyle = 'rgba(143,216,255,.8)'; cx.lineWidth = 1.5; cx.stroke(); }
  for(const e of G.E){ const x = sx(e.x), y = sy(e.y), r = e.r * Z * 1.6; if(onScreen(x, y, r)) drawGloom(e); }
  for(const f of G.BF) if(onScreen(sx(f.x), sy(f.y), 40)) drawButterfly(f);
  drawPlayer();
  cx.globalCompositeOperation = 'lighter';
  // ambient fireflies
  for(const a of G.AMB){ const tw = .5 + .5 * Math.sin(a.ph * 3); glow(sx(a.x), sy(a.y), 9 * Math.max(.7, Z), '#e8ff9a', .25 + tw * .5); }
  // light motes
  for(const m of G.MO){ const x = sx(m.x), y = sy(m.y); if(!onScreen(x, y, 30)) continue; if(m.kind === 'dust'){ glow(x, y, 18, '#fff38a', .9); cx.fillStyle = '#ffffff'; cx.fillRect(x - 1.5, y - 1.5, 3, 3); } else { glow(x, y, 12, m.c, .9); glow(x, y, 4, '#ffffff', 1); } }
  // particles
  for(const p of G.PT){ const k = p.life / p.max; cx.globalAlpha = k; cx.fillStyle = p.c; const s = p.s * (.4 + k * .6) * Math.max(.7, Z); cx.beginPath(); cx.arc(sx(p.x), sy(p.y), s * .6, 0, TAU); cx.fill(); }
  cx.globalAlpha = 1;
  for(const f of G.FX){
    if(f.ring){ const k = f.life / f.max0; cx.strokeStyle = rgba(f.c, k); cx.lineWidth = 2 + 5 * k; cx.beginPath(); cx.arc(sx(f.x), sy(f.y), f.r * Z, 0, TAU); cx.stroke(); }
    else if(f.star){ const k = 1 - f.life / f.max0, x = sx(f.x), y = sy(f.y), fx = x + (1 - k) * 260, fy = y - (1 - k) * 420; cx.strokeStyle = 'rgba(255,243,138,.8)'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(fx, fy); cx.lineTo(fx + 60, fy - 95); cx.stroke(); glow(fx, fy, 40, '#fff38a', 1); }
  }
  cx.globalCompositeOperation = 'source-over';
  // popups
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(const p of G.POP){
    const k = Math.min(1, p.life / .3), sc = p.life > .95 ? 1 + (p.life - .95) * 2.5 : 1;
    cx.globalAlpha = k; cx.font = `900 ${Math.round(p.size * sc)}px ui-rounded,"Nunito","Segoe UI",system-ui,sans-serif`;
    cx.lineWidth = 5; cx.strokeStyle = 'rgba(20,10,40,.75)'; cx.lineJoin = 'round'; cx.strokeText(p.txt, sx(p.x), sy(p.y)); cx.fillStyle = p.c; cx.fillText(p.txt, sx(p.x), sy(p.y));
  }
  cx.globalAlpha = 1; cx.textBaseline = 'alphabetic';
  cx.restore();
  // the dark creeps in as your light fades
  if(P && (G.state === 'play' || G.state === 'dying')){
    const lk = G.light / G.maxLight, dk = G.state === 'dying' ? 1 - Math.max(0, G.dieT / 1.8) : clamp((.4 - lk) / .4, 0, 1);
    if(dk > 0){
      const x = sx(P.x), y = sy(P.y), R = Math.hypot(W, H) * .6;
      const g = cx.createRadialGradient(x, y, R * (.12 + .5 * (1 - dk)), x, y, R);
      g.addColorStop(0, 'rgba(6,3,20,0)'); g.addColorStop(1, `rgba(6,3,20,${.8 * dk})`);
      cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    }
  }
  if(G.flash > 0){ cx.fillStyle = rgba(G.flashCol, Math.min(.35, G.flash * .3)); cx.fillRect(0, 0, W, H); }
}

/* ---------------- meadow snapshot for the results screen ---------------- */
// frames the part of the meadow you painted, so even a short run makes a pretty picture
function drawMeadowSnap(c){
  const g = c.getContext('2d'), S = c.width;
  let b = G.pbb ? Object.assign({}, G.pbb) : { x0:-300, y0:-300, x1:300, y1:300 };
  for(const f of G.F){ b.x0 = Math.min(b.x0, f.x); b.y0 = Math.min(b.y0, f.y); b.x1 = Math.max(b.x1, f.x); b.y1 = Math.max(b.y1, f.y); }
  const cxw = (b.x0 + b.x1) / 2, cyw = (b.y0 + b.y1) / 2, half = clamp(Math.max(b.x1 - b.x0, b.y1 - b.y0) / 2 + 60, 260, WORLD_R);
  const k = S / (half * 2), tx = w => (w - cxw + half) * k, ty = w => (w - cyw + half) * k;
  g.clearRect(0, 0, S, S);
  g.save(); g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 2, 0, TAU); g.clip();
  g.fillStyle = hourPal(1).lake; g.fillRect(0, 0, S, S);
  g.fillStyle = hourPal(G.hour || 1).g; g.beginPath(); g.arc(tx(0), ty(0), WORLD_R * k, 0, TAU); g.fill();
  if(paintC){
    const sz = WORLD_R * 2 * k;
    g.drawImage(paintC, tx(-WORLD_R), ty(-WORLD_R), sz, sz);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = .45; g.drawImage(paintC, tx(-WORLD_R), ty(-WORLD_R), sz, sz); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  for(const f of G.F){
    const x = tx(f.x), y = ty(f.y), r = Math.max(2.2, f.sz * k * 1.6);
    if(r > 5){ const spr = flowerSpr(f.col, f.pet, f.kind); g.drawImage(spr, x - r * 2, y - r * 2, r * 4, r * 4); }
    else { g.fillStyle = f.col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(x, y, r * .4, 0, TAU); g.fill(); }
  }
  g.restore();
  g.strokeStyle = 'rgba(200,180,255,.6)'; g.lineWidth = 2; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 2, 0, TAU); g.stroke();
}

/* ---------------- menu backdrop: a spirit idly looping a meadow ---------------- */
let menuBot = null;
function menuTick(dt){
  if(!P){
    P = { x:0, y:0, vx:0, vy:0, r:11, inv:0, ang:0, boost:false, hit:0 };
    for(const k of ['B','F','E','BF','MO','T','PT','POP','FX','LP','TM','TR']) G[k].length = 0;
    G.trLen = 0; G.hour = 1; G.t = 0; G.up = {}; G.light = G.maxLight = 100;
    resetPaint(); menuBot = null;
    for(let i = 0; i < 4; i++) budCluster(rnd(-300, 300), rnd(-220, 220), 5, 60);
  }
  G.rt += dt;
  G.camZ = targetZoom() * .9; G.camX = lerp(G.camX, P.x, Math.min(1, dt * 1.5)); G.camY = lerp(G.camY, P.y, Math.min(1, dt * 1.5));
  // bot: pick a cluster, circle it once
  if(!menuBot || menuBot.a > TAU + .6){
    let best = null, bd = 1e12;
    for(const b of G.B){ if(b.caught) continue; const d = (b.x - P.x) ** 2 + (b.y - P.y) ** 2; if(d < bd && d > 60 * 60){ bd = d; best = b; } }
    const c = best || { x:rnd(-200, 200), y:rnd(-200, 200) };
    const a0 = Math.atan2(P.y - c.y, P.x - c.x);
    menuBot = { x:c.x, y:c.y, a0, a:0, r:90 + Math.random() * 30, dir:Math.random() < .5 ? 1 : -1 };
  }
  menuBot.a += dt * 3.1;
  const a = menuBot.a0 + menuBot.a * menuBot.dir;
  G.menuT = [menuBot.x + Math.cos(a) * menuBot.r, menuBot.y + Math.sin(a) * menuBot.r];
  G.state = 'menuplay';
  updPlayer(dt);
  if(G.B.length < 26 && Math.random() < dt * 3){ const a2 = rnd(0, TAU), d = rnd(200, 420); budCluster(P.x + Math.cos(a2) * d, P.y + Math.sin(a2) * d, 5, 60); }
  for(const b of G.B) if(b.grow < 1) b.grow = Math.min(1, b.grow + dt * 1.8);
  for(let i = G.TM.length - 1; i >= 0; i--){ const t = G.TM[i]; t.t -= dt; if(t.t <= 0){ G.TM.splice(i, 1); t.f(); } }
  updMotes(dt); updButterflies(dt); tickFx(dt);
  if(G.F.length > 140) G.F.shift();
  G.state = 'menu';
}
