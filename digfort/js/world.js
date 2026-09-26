'use strict';
/* =====================================================================
   Voxel island: terrain, textures, isometric projection, rendering.
   A cell (x,y) holds a column of blocks COL[x][y][z], z = 0 at the bottom.
   Screen: +x goes right-down, +y goes left-down, +z goes up.
   ===================================================================== */
const MAXS = 17, C = 8;
const TW = 64, TH = 32, BH = 36;
let COL = [], TWR = [], ISLE_R = 5;
let Z = 1, OX = 0, OY = 0;                 // zoom and origin (CSS px)

const inIsle = (x, y) => x >= 0 && y >= 0 && x < MAXS && y < MAXS && Math.max(Math.abs(x - C), Math.abs(y - C)) <= ISLE_R;
const colH = (x, y) => COL[x][y].length;
const topId = (x, y) => { const c = COL[x][y]; return c[c.length - 1]; };
const isHeart = (x, y) => x === C && y === C;
const isMagma = (x, y) => topId(x, y) === B.MAGMA;
// height the monsters have to deal with: towers count as a 2-block obstacle
const effH = (x, y) => colH(x, y) + (TWR[x][y] ? 2 : 0);

/* ---------------- terrain ---------------- */
function valueNoise(seedR){
  const g = []; for(let i = 0; i < 8; i++){ g.push([]); for(let j = 0; j < 8; j++) g[i].push(seedR()); }
  const sm = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = g[xi & 7][yi & 7], b = g[(xi + 1) & 7][yi & 7], c = g[xi & 7][(yi + 1) & 7], d = g[(xi + 1) & 7][(yi + 1) & 7];
    return lerp(lerp(a, b, xf), lerp(c, d, xf), yf);
  };
}
function genWorld(opts){
  opts = opts || {};
  const n1 = valueNoise(grng), n2 = valueNoise(grng);
  const oreMul = (1 + .2 * (save.meta.luck || 0)) * (opts.rich ? 2 : 1);
  COL = []; TWR = [];
  for(let x = 0; x < MAXS; x++){
    COL.push([]); TWR.push([]);
    for(let y = 0; y < MAXS; y++){
      TWR[x].push(null);
      const d = Math.max(Math.abs(x - C), Math.abs(y - C));
      let h = opts.flat ? 5 : Math.round(3.4 + n1(x * .38, y * .38) * 2.6 + n2(x * .9, y * .9) * .8);
      if(d <= 1) h = 5;
      if(d === 2) h = clamp(h, 4, 6);
      h = clamp(h, 3, 7);
      const col = [];
      for(let z = 0; z < h; z++){
        let id;
        if(z === 0) id = d >= 3 && grng() < .09 ? B.MAGMA : B.BEDROCK;
        else if(z === h - 1) id = B.GRASS;
        else if(z === h - 2) id = B.DIRT;
        else if(z === h - 3 && grng() < .5) id = B.DIRT;
        else {
          id = B.STONE;
          const r = grng() / oreMul;
          if(z <= 1){ if(r < .045) id = B.CRYSTAL; else if(r < .12) id = B.GOLD; else if(r < .24) id = B.IRON; else if(r < .3) id = B.COAL; }
          else if(z === 2){ if(r < .04) id = B.GOLD; else if(r < .15) id = B.IRON; else if(r < .27) id = B.COAL; }
          else { if(r < .07) id = B.IRON; else if(r < .2) id = B.COAL; }
        }
        col.push(id);
      }
      COL[x].push(col);
    }
  }
}

/* ---------------- procedural textures (8x8 pixel art) ---------------- */
function theme(){ return THEMES.find(t => t.id === save.theme) || THEMES[0]; }
function texCanvas(){ const c = document.createElement('canvas'); c.width = c.height = 8; return c; }
function makeTex(id, face){
  const c = texCanvas(), g = c.getContext('2d'), th = theme();
  const r = mulberry32(id * 7919 + (face === 'top' ? 11 : 23) + hashStr(th.id));
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const noise = pal => { for(let y = 0; y < 8; y++) for(let x = 0; x < 8; x++){ const v = r(); px(x, y, v < .55 ? pal[0] : v < .8 ? pal[1] : pal[2]); } };
  const ore = (col, n, hi) => { for(let i = 0; i < n; i++){ const x = 1 + (r() * 6) | 0, y = 1 + (r() * 6) | 0; px(x, y, col); if(r() < .7) px(x + (r() < .5 ? 1 : -1), y, col); if(hi && r() < .6) px(x, y - 1, hi); } };
  switch(id){
    case B.GRASS:
      if(face === 'top') noise(th.grass);
      else { noise(th.dirt); for(let x = 0; x < 8; x++){ px(x, 0, th.grass[0]); if(r() < .65) px(x, 1, th.grass[1]); if(r() < .2) px(x, 2, th.grass[1]); } }
      break;
    case B.DIRT: noise(th.dirt); break;
    case B.STONE: noise(th.stone); for(let i = 0; i < 3; i++) px((r() * 8) | 0, (r() * 8) | 0, th.stone[1]); break;
    case B.COAL: noise(th.stone); ore('#1b1b22', 5, '#3a3a44'); break;
    case B.IRON: noise(th.stone); ore('#e8b98e', 4, '#fff0dc'); break;
    case B.GOLD: noise(th.stone); ore('#ffcf2a', 4, '#fff7b0'); break;
    case B.CRYSTAL: noise(th.stone); ore('#27e6ff', 4, '#e6ffff'); ore('#6af7ff', 2); break;
    case B.BEDROCK: noise(['#3a3a44', '#2a2a33', '#4b4b57']); break;
    case B.MAGMA: noise(['#ff6a1a', '#d9420f', '#ffb03a']); for(let i = 0; i < 6; i++) px((r() * 8) | 0, (r() * 8) | 0, '#5a1a0a'); break;
    case B.BRICK: {
      g.fillStyle = th.stone[1]; g.fillRect(0, 0, 8, 8);
      for(let row = 0; row < 4; row++){
        const off = row % 2 ? 2 : 0;
        for(let bx = -1; bx < 3; bx++){
          const x0 = bx * 4 + off;
          for(let y = row * 2; y < row * 2 + 1; y++) for(let x = x0; x < x0 + 3; x++) if(x >= 0 && x < 8) px(x, y, r() < .7 ? th.stone[2] : th.stone[0]);
        }
      }
      break;
    }
  }
  return c;
}
function crackTex(stage){
  const c = texCanvas(), g = c.getContext('2d'), r = mulberry32(99);
  g.fillStyle = 'rgba(0,0,0,.6)';
  const pts = [[3,3],[4,4],[2,5],[5,2],[1,6],[6,1],[4,6],[6,5],[1,2],[2,1],[5,6],[6,7],[0,4],[7,3],[3,0],[4,7]];
  for(let i = 0; i < stage * 4; i++){ const p = pts[i % pts.length]; g.fillRect(p[0], p[1], 1, 1); if(r() < .5) g.fillRect(p[0] + 1, p[1], 1, 1); }
  return c;
}

/* ---------------- cube sprites (rebuilt when zoom changes) ---------------- */
const SPR = { blocks:{}, cracks:[], scale:0 };
function cubeSprite(texTop, texSide, s, tint){
  const tw = TW * s, th = TH * s, bh = BH * s;
  const c = document.createElement('canvas'); c.width = Math.ceil(tw) + 1; c.height = Math.ceil(th + bh) + 1;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const face = (pts, tex, m, shade) => {
    g.save(); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip();
    if(tex){ g.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); g.drawImage(tex, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0); }
    if(shade){ g.fillStyle = shade; g.fill(); }
    g.restore();
  };
  const T = [tw / 2, 0], R = [tw, th / 2], Bm = [tw / 2, th], L = [0, th / 2];
  const R0 = [tw, th / 2 + bh], B0 = [tw / 2, th + bh], L0 = [0, th / 2 + bh];
  if(texSide){ g.fillStyle = '#000'; g.beginPath(); [T, R, R0, B0, L0, L].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); }
  face([T, R, Bm, L], texTop, [tw / 16, th / 16, -tw / 16, th / 16, tw / 2, 0], tint ? tint[0] : null);
  if(texSide){
    face([L, Bm, B0, L0], texSide, [tw / 16, th / 16, 0, bh / 8, 0, th / 2], tint ? tint[1] : 'rgba(0,0,0,.2)');
    face([Bm, R, R0, B0], texSide, [tw / 16, -th / 16, 0, bh / 8, tw / 2, th], tint ? tint[2] : 'rgba(0,0,0,.38)');
    g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = Math.max(1, s);
    g.beginPath(); g.moveTo(...L); g.lineTo(...Bm); g.lineTo(...R); g.moveTo(...Bm); g.lineTo(...B0); g.stroke();
  }
  return c;
}
function buildSprites(){
  const s = Z * DPR;
  SPR.scale = s; SPR.blocks = {}; SPR.cracks = [];
  for(const id of Object.values(B)){
    SPR.blocks[id] = cubeSprite(makeTex(id, 'top'), makeTex(id, 'side'), s);
  }
  for(let k = 1; k <= 4; k++){ const t = crackTex(k); SPR.cracks.push(cubeSprite(t, t, s, ['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)'])); }
}
// small icons (hotbar, resources): independent of zoom
function iconFor(id, px){
  const s = px / TW;
  return cubeSprite(makeTex(id, 'top'), makeTex(id, 'side'), s).toDataURL();
}

/* ---------------- projection ---------------- */
function iso(x, y, e){ return [OX + (x - y) * TW / 2 * Z, OY + (x + y) * TH / 2 * Z - e * BH * Z]; }
const CAM = { z:1, px:0, py:0 };          // player zoom/pan on top of the auto fit
function fitCamera(){
  const R = ISLE_R, short = H < 520, top = short ? 58 : 118, bottom = short ? 70 : 96;
  const iw = (2 * R + 1) * TW, ih = (2 * R + 1) * TH + 6 * BH;
  const availW = W - 16, availH = H - top - bottom;
  const z0 = clamp(Math.min(availW / iw, availH / ih), .25, 2);
  const midY = top + availH / 2;
  const oy0 = midY - (2 * C) * TH / 2 * z0 + 3.2 * BH * z0 + TH * z0 * .5;
  CAM.z = clamp(CAM.z, 1, 2.6);
  const lim = (CAM.z - 1) * .5 + .15;
  CAM.px = clamp(CAM.px, -W * lim, W * lim); CAM.py = clamp(CAM.py, -H * lim, H * lim);
  Z = z0 * CAM.z;
  OX = W / 2 + CAM.px;
  OY = midY + (oy0 - midY) * CAM.z + CAM.py;
  if(!SPR.scale) buildSprites();
}
let _sprT = 0;
// rebuilding sprites mid-pinch would stutter, so it waits until zooming settles
let _sprWant = 0;
function sprCheck(){
  const want = Z * DPR;
  if(Math.abs(SPR.scale - want) < .001){ _sprWant = 0; return; }
  if(Math.abs(_sprWant - want) < .001) return;          // already scheduled for this zoom
  _sprWant = want; clearTimeout(_sprT); _sprT = setTimeout(() => { _sprWant = 0; buildSprites(); }, 140);
}

/* point -> column (frontmost silhouette hit) */
function pickColumn(px, py){
  for(let s = 2 * (MAXS - 1); s >= 0; s--){
    for(let x = Math.min(MAXS - 1, s); x >= Math.max(0, s - (MAXS - 1)); x--){
      const y = s - x;
      if(!inIsle(x, y)) continue;
      const e = colH(x, y) + (TWR[x][y] ? .8 : 0);
      const [cx, cy] = iso(x, y, e), hw = TW / 2 * Z, hh = TH / 2 * Z, dh = e * BH * Z;
      const poly = [[cx, cy - hh], [cx + hw, cy], [cx + hw, cy + dh], [cx, cy + hh + dh], [cx - hw, cy + dh], [cx - hw, cy]];
      if(inPoly(px, py, poly)) return { x, y };
    }
  }
  return null;
}
function inPoly(px, py, pts){
  let inside = false;
  for(let i = 0, j = pts.length - 1; i < pts.length; j = i++){
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/* ---------------- iso box helper (towers, monsters) ---------------- */
function isoBox(x, y, e, hs, hz, top, left, right, outline){
  const p = (dx, dy, dz) => iso(x + dx, y + dy, e + dz);
  const tp = [p(-hs, -hs, hz), p(hs, -hs, hz), p(hs, hs, hz), p(-hs, hs, hz)];
  const rf = [p(hs, -hs, hz), p(hs, hs, hz), p(hs, hs, 0), p(hs, -hs, 0)];
  const lf = [p(-hs, hs, hz), p(hs, hs, hz), p(hs, hs, 0), p(-hs, hs, 0)];
  const poly = (pts, col) => { cx.beginPath(); pts.forEach((q, i) => i ? cx.lineTo(q[0], q[1]) : cx.moveTo(q[0], q[1])); cx.closePath(); cx.fillStyle = col; cx.fill(); if(outline){ cx.strokeStyle = outline; cx.lineWidth = 1; cx.stroke(); } };
  poly(lf, left); poly(rf, right); poly(tp, top);
  return { tp, rf, lf };
}
function shadeHex(hex, f){
  const n = parseInt(hex.slice(1), 16); let r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
  r = clamp(Math.round(r * f), 0, 255); g = clamp(Math.round(g * f), 0, 255); b = clamp(Math.round(b * f), 0, 255);
  return `rgb(${r},${g},${b})`;
}
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
