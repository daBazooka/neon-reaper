'use strict';
/* =====================================================================
   ABYSS HOOK renderer. Every fish is drawn in code from its species
   data (shape, colours, pattern) into a cached sprite.
   ===================================================================== */
const cv = $('cv'); let cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
const V = { s:30, top:0 };
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, save.opt.fx === 'low' ? 1 : 2);
  W = innerWidth; H = innerHeight; cv.width = W * DPR | 0; cv.height = H * DPR | 0;
  V.s = H / (W < H ? 21 : 17);
  G.WW = W / V.s;
}
const SX = x => x * V.s, SY = y => (y - V.top) * V.s;
const toWorld = (px, py) => [px / V.s, py / V.s + V.top];

/* ---------------- fish sprites ---------------- */
const SPR = {};
function fishSprite(sp, shiny){
  const k = sp.id + (shiny ? '*' : ''); if(SPR[k]) return SPR[k];
  const L = 200, Hh = sp.shape === 'flat' ? 140 : sp.shape === 'round' || sp.shape === 'angler' ? 170 : sp.shape === 'turtle' ? 150 : sp.shape === 'squid' ? 120 : 110;
  const c = document.createElement('canvas'); c.width = L + 20; c.height = Hh + 20; const g = c.getContext('2d');
  g.translate(c.width / 2, c.height / 2);
  drawShape(g, sp, L);
  if(shiny){ g.globalCompositeOperation = 'source-atop'; const gr = g.createLinearGradient(-L / 2, -Hh / 2, L / 2, Hh / 2); gr.addColorStop(0, 'rgba(255,240,150,.55)'); gr.addColorStop(.5, 'rgba(255,200,40,.25)'); gr.addColorStop(1, 'rgba(255,255,220,.55)'); g.fillStyle = gr; g.fillRect(-L, -Hh, L * 2, Hh * 2); g.globalCompositeOperation = 'source-over'; }
  SPR[k] = { c, L, h:c.height / c.width };
  return SPR[k];
}
function patternOn(g, sp, clip){
  g.save(); clip(); g.clip();
  const { pat, col2 } = sp;
  if(pat === 'stripes'){ g.fillStyle = col2; for(let x = -70; x <= 60; x += 34){ g.fillRect(x, -100, 11, 200); } }
  else if(pat === 'spots'){ g.fillStyle = rgba(col2, .85); for(let i = 0; i < 14; i++){ const a = i * 2.4, r = 10 + (i * 7) % 40; g.beginPath(); g.arc(Math.cos(a) * r * 1.5 - 10, Math.sin(a) * r * .6, 4 + (i % 3) * 2, 0, TAU); g.fill(); } }
  else if(pat === 'fade'){ const gr = g.createLinearGradient(0, -60, 0, 60); gr.addColorStop(0, rgba(col2, .7)); gr.addColorStop(.55, rgba(col2, 0)); gr.addColorStop(1, 'rgba(255,255,255,.35)'); g.fillStyle = gr; g.fillRect(-120, -100, 240, 200); }
  else if(pat === 'glow'){ g.fillStyle = col2; for(let i = 0; i < 6; i++){ g.beginPath(); g.arc(-50 + i * 18, 14, 3.5, 0, TAU); g.fill(); } }
  // belly shading
  const sh = g.createLinearGradient(0, -60, 0, 70); sh.addColorStop(0, 'rgba(255,255,255,.18)'); sh.addColorStop(.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = sh; g.fillRect(-120, -100, 240, 200);
  g.restore();
}
function eye(g, x, y, r, big){ g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = '#10131c'; g.beginPath(); g.arc(x + r * .2, y, r * (big ? .7 : .55), 0, TAU); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + r * .35, y - r * .3, r * .22, 0, TAU); g.fill(); }
function drawShape(g, sp, L){
  const col = sp.col, c2 = sp.col2, dark = mix(col, '#000000', .35);
  g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = rgba('#05081a', .55);
  switch(sp.shape){
    case 'fish': case 'shark': {
      const shark = sp.shape === 'shark', hl = L * .42, hh = shark ? 26 : 34;
      const body = () => { g.beginPath(); g.moveTo(hl + (shark ? 14 : 0), shark ? -2 : 0); g.bezierCurveTo(hl * .5, -hh * 1.25, -hl * .5, -hh * 1.1, -hl, 0); g.bezierCurveTo(-hl * .5, hh * 1.1, hl * .5, hh * 1.25, hl + (shark ? 14 : 0), shark ? 4 : 0); g.closePath(); };
      // tail
      g.fillStyle = dark; g.beginPath(); g.moveTo(-hl + 6, 0); g.lineTo(-hl - (shark ? 46 : 38), -(shark ? 42 : 34)); g.quadraticCurveTo(-hl - 20, 0, -hl - (shark ? 36 : 38), shark ? 26 : 34); g.closePath(); g.fill(); g.stroke();
      // fins
      g.fillStyle = shark ? col : c2; g.beginPath(); g.moveTo(shark ? 6 : 20, -hh + 4); g.lineTo(shark ? -18 : -10, -hh - (shark ? 36 : 20)); g.lineTo(shark ? -30 : -40, -hh + 8); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = col; body(); g.fill(); patternOn(g, sp, body); body(); g.stroke();
      g.fillStyle = rgba(dark, .8); g.beginPath(); g.moveTo(8, 10); g.lineTo(-14, 26); g.lineTo(-2, 10); g.fill();
      if(shark){ g.strokeStyle = rgba('#000000', .3); g.lineWidth = 3; for(let i = 0; i < 3; i++){ g.beginPath(); g.moveTo(34 - i * 7, -8); g.lineTo(30 - i * 7, 10); g.stroke(); } if(sp.name === 'Swordfish' || sp.name === 'Sunspear Marlin'){ g.fillStyle = c2; g.beginPath(); g.moveTo(hl + 10, -4); g.lineTo(hl + 60, 0); g.lineTo(hl + 10, 3); g.fill(); } }
      eye(g, hl * .62, -6, shark ? 7 : 10);
      if(!shark){ g.strokeStyle = rgba('#000000', .3); g.lineWidth = 3; g.beginPath(); g.arc(hl * .35, 0, 22, -1.1, 1.1); g.stroke(); }
      break;
    }
    case 'round': {
      const r = L * .34;
      g.fillStyle = dark; g.beginPath(); g.moveTo(-r + 4, 0); g.lineTo(-r - 34, -26); g.lineTo(-r - 30, 26); g.closePath(); g.fill(); g.stroke();
      if(sp.pat === 'spots' || sp.name === 'Lionfish'){ g.fillStyle = c2; for(let i = 0; i < 12; i++){ const a = i / 12 * TAU; g.beginPath(); g.moveTo(Math.cos(a - .12) * r, Math.sin(a - .12) * r); g.lineTo(Math.cos(a) * (r + (sp.name === 'Lionfish' ? 34 : 14)), Math.sin(a) * (r + (sp.name === 'Lionfish' ? 34 : 14))); g.lineTo(Math.cos(a + .12) * r, Math.sin(a + .12) * r); g.fill(); } }
      const body = () => { g.beginPath(); g.ellipse(0, 0, r * 1.05, r * .92, 0, 0, TAU); };
      g.fillStyle = col; body(); g.fill(); patternOn(g, sp, body); body(); g.stroke();
      g.fillStyle = c2; g.beginPath(); g.ellipse(-4, -r * .9, 20, 10, 0, 0, TAU); g.fill();
      eye(g, r * .5, -r * .2, 13, true); g.fillStyle = mix(col, '#000', .5); g.beginPath(); g.arc(r * .95, r * .15, 6, 0, TAU); g.fill();
      break;
    }
    case 'long': {
      const pts = []; for(let i = 0; i <= 24; i++){ const u = i / 24; pts.push([lerp(-L * .5, L * .48, u), Math.sin(u * TAU * 1.2) * 10, 20 * Math.sin(Math.min(1, u * 1.4 + .08) * Math.PI) + 4]); }
      const body = () => { g.beginPath(); pts.forEach(([x, y, w], i) => i ? g.lineTo(x, y - w) : g.moveTo(x, y - w)); for(let i = pts.length - 1; i >= 0; i--){ const [x, y, w] = pts[i]; g.lineTo(x, y + w); } g.closePath(); };
      g.fillStyle = c2; g.beginPath(); pts.forEach(([x, y, w], i) => i ? g.lineTo(x, y - w - 10) : g.moveTo(x, y - w)); g.lineTo(L * .3, -10); g.fill();
      g.fillStyle = col; body(); g.fill(); patternOn(g, sp, body); body(); g.stroke();
      eye(g, L * .38, pts[22][1] - 6, 8);
      if(sp.name === 'Viperfish' || sp.name === 'Gulper Eel' || sp.name === 'Dragonfish'){ g.fillStyle = '#ffffff'; for(let i = 0; i < 4; i++){ g.beginPath(); g.moveTo(L * .44 - i * 7, pts[23][1] + 4); g.lineTo(L * .42 - i * 7, pts[23][1] + 16); g.lineTo(L * .4 - i * 7, pts[23][1] + 4); g.fill(); } }
      break;
    }
    case 'flat': {
      const body = () => { g.beginPath(); g.moveTo(L * .3, 0); g.quadraticCurveTo(L * .05, -L * .34, -L * .2, -L * .3); g.quadraticCurveTo(-L * .18, 0, -L * .2, L * .3); g.quadraticCurveTo(L * .05, L * .34, L * .3, 0); g.closePath(); };
      g.strokeStyle = dark; g.lineWidth = 6; g.beginPath(); g.moveTo(-L * .18, 0); g.quadraticCurveTo(-L * .4, 10, -L * .5, -6); g.stroke();
      g.lineWidth = 4; g.strokeStyle = rgba('#05081a', .55);
      g.fillStyle = col; body(); g.fill(); patternOn(g, sp, body); body(); g.stroke();
      eye(g, L * .16, -14, 7); eye(g, L * .16, 14, 7);
      break;
    }
    case 'squid': {
      const ml = L * .55;
      g.strokeStyle = col; g.lineWidth = 9; g.lineCap = 'round';
      for(let i = 0; i < 6; i++){ const y0 = -24 + i * 10; g.beginPath(); g.moveTo(-ml * .35, y0 * .6); g.bezierCurveTo(-ml * .6, y0, -ml * .8, y0 * 1.6 + Math.sin(i) * 10, -ml * (.9 + (i % 2) * .15), y0 * 1.2); g.stroke(); }
      g.lineWidth = 4; g.strokeStyle = rgba('#05081a', .55); g.lineCap = 'butt';
      const body = () => { g.beginPath(); g.moveTo(ml * .75, 0); g.quadraticCurveTo(ml * .5, -40, -ml * .1, -34); g.quadraticCurveTo(-ml * .42, -30, -ml * .42, 0); g.quadraticCurveTo(-ml * .42, 30, -ml * .1, 34); g.quadraticCurveTo(ml * .5, 40, ml * .75, 0); g.closePath(); };
      g.fillStyle = col; body(); g.fill(); patternOn(g, sp, body); body(); g.stroke();
      g.fillStyle = c2; g.beginPath(); g.moveTo(ml * .75, 0); g.lineTo(ml * .5, -30); g.lineTo(ml * .45, 0); g.lineTo(ml * .5, 30); g.fill();
      eye(g, -ml * .25, -14, 11, true);
      break;
    }
    case 'angler': {
      const r = L * .32;
      g.strokeStyle = mix(col, '#ffffff', .2); g.lineWidth = 4; g.beginPath(); g.moveTo(r * .2, -r * .9); g.quadraticCurveTo(r * .9, -r * 1.9, r * 1.3, -r * 1.1); g.stroke();
      g.fillStyle = c2; g.beginPath(); g.arc(r * 1.3, -r * 1.05, 11, 0, TAU); g.fill();
      g.strokeStyle = rgba('#05081a', .55);
      g.fillStyle = dark; g.beginPath(); g.moveTo(-r + 6, 0); g.lineTo(-r - 34, -24); g.lineTo(-r - 34, 24); g.closePath(); g.fill(); g.stroke();
      const body = () => { g.beginPath(); g.ellipse(0, 0, r * 1.05, r * .92, 0, 0, TAU); };
      g.fillStyle = col; body(); g.fill(); patternOn(g, sp, body); body(); g.stroke();
      g.fillStyle = '#05050a'; g.beginPath(); g.moveTo(r * 1.05, -8); g.quadraticCurveTo(r * .3, 10, r * .9, r * .7); g.lineTo(r * 1.1, r * .2); g.closePath(); g.fill();
      g.fillStyle = '#f8f8ff'; for(let i = 0; i < 5; i++){ g.beginPath(); g.moveTo(r * .98 - i * 5, -4 + i * 7); g.lineTo(r * .78 - i * 5, 2 + i * 7); g.lineTo(r * .96 - i * 5, 6 + i * 7); g.fill(); }
      eye(g, r * .35, -r * .38, 9, true);
      break;
    }
    case 'turtle': {
      g.fillStyle = mix(col, '#e0d0a0', .5);
      for(const [x, y, a] of [[40, -44, -.6], [40, 44, .6], [-38, -34, -2.4], [-38, 34, 2.4]]){ g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(0, 0, 30, 12, 0, 0, TAU); g.fill(); g.stroke(); g.restore(); }
      g.beginPath(); g.ellipse(L * .38, 0, 24, 18, 0, 0, TAU); g.fill(); g.stroke(); eye(g, L * .42, -4, 5);
      const body = () => { g.beginPath(); g.ellipse(0, 0, L * .32, L * .27, 0, 0, TAU); };
      g.fillStyle = col; body(); g.fill();
      g.save(); body(); g.clip(); g.strokeStyle = rgba(c2, .9); g.lineWidth = 5; for(let i = -2; i <= 2; i++){ g.beginPath(); g.moveTo(i * 26, -60); g.lineTo(i * 26 + 10, 60); g.stroke(); } g.beginPath(); g.moveTo(-80, 0); g.lineTo(80, 0); g.stroke(); g.restore();
      g.strokeStyle = rgba('#05081a', .55); g.lineWidth = 4; body(); g.stroke();
      break;
    }
    case 'whale': {
      g.fillStyle = dark; g.beginPath(); g.moveTo(-L * .38, 0); g.lineTo(-L * .5, -28); g.quadraticCurveTo(-L * .44, 0, -L * .5, 28); g.closePath(); g.fill(); g.stroke();
      const body = () => { g.beginPath(); g.moveTo(L * .46, 4); g.bezierCurveTo(L * .46, -52, 0, -44, -L * .4, -6); g.lineTo(-L * .4, 6); g.bezierCurveTo(0, 44, L * .46, 40, L * .46, 4); g.closePath(); };
      g.fillStyle = col; body(); g.fill(); patternOn(g, sp, body);
      g.save(); body(); g.clip(); g.fillStyle = rgba('#ffffff', .25); g.fillRect(-L * .2, 16, L * .7, 30); g.strokeStyle = rgba('#000000', .2); g.lineWidth = 2; for(let i = 0; i < 6; i++){ g.beginPath(); g.moveTo(-L * .1, 20 + i * 5); g.lineTo(L * .4, 18 + i * 5); g.stroke(); } g.restore();
      g.strokeStyle = rgba('#05081a', .55); g.lineWidth = 4; body(); g.stroke();
      g.fillStyle = dark; g.beginPath(); g.ellipse(L * .05, 18, 22, 8, .5, 0, TAU); g.fill();
      eye(g, L * .3, 2, 6);
      break;
    }
  }
}
const glowC = {};
function glowSpr(c){ if(glowC[c]) return glowC[c]; const s = 64, cn = document.createElement('canvas'); cn.width = cn.height = s; const g = cn.getContext('2d'), gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, rgba(c, 1)); gr.addColorStop(.3, rgba(c, .35)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(0, 0, s, s); return glowC[c] = cn; }
function glow(x, y, r, c, a){ if(a <= 0) return; cx.globalAlpha = Math.min(1, a); cx.drawImage(glowSpr(c), x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1; }
// draw a fish (sp) with length len (px) centred at x,y facing dir, rotation rot
function drawFishAt(sp, shiny, x, y, len, dir, rot, alpha){
  const S = fishSprite(sp, shiny), w = len * (S.c.width / S.L), h = w * S.h;
  cx.save(); cx.translate(x, y); if(rot) cx.rotate(rot); cx.scale(dir < 0 ? -1 : 1, 1); if(alpha !== undefined) cx.globalAlpha = alpha;
  cx.drawImage(S.c, -w / 2, -h / 2, w, h); cx.restore();
}

/* ---------------- ocean ---------------- */
const SNOW = Array.from({ length:70 }, () => ({ x:Math.random(), y:Math.random(), s:Math.random() * 1.8 + .5, p:Math.random() }));
function waterCol(d){
  if(d < 0) return '#48c8f0';
  const z = zoneAt(d), Z = ZONES[z], next = ZONES[z + 1], k = next ? clamp((d - Z.top) / (next.top - Z.top), 0, 1) : clamp((d - Z.top) / 800, 0, 1);
  return mix(Z.col[0], Z.col[1], k);
}
function drawOcean(){
  const top = V.top, bot = V.top + H / V.s;
  // sky above the surface
  if(top < 0){ const sy = SY(0), g = cx.createLinearGradient(0, 0, 0, sy); g.addColorStop(0, '#6ac8ff'); g.addColorStop(1, '#d8f4ff'); cx.fillStyle = g; cx.fillRect(0, 0, W, Math.max(0, sy)); glow(W * .8, SY(-14), 90, '#fff4c0', .9); cx.fillStyle = '#fffbe0'; cx.beginPath(); cx.arc(W * .8, SY(-14), 26, 0, TAU); cx.fill(); for(let i = 0; i < 3; i++){ const x = ((i * 380 + G.rt * 10) % (W + 300)) - 150, y = SY(-18 + i * 3); cx.fillStyle = 'rgba(255,255,255,.85)'; for(const [dx, dy, r] of [[0, 0, 26], [28, -10, 22], [52, 0, 24]]){ cx.beginPath(); cx.arc(x + dx, y + dy, r, 0, TAU); cx.fill(); } } }
  const y0 = Math.max(0, SY(0)), g = cx.createLinearGradient(0, y0, 0, H);
  g.addColorStop(0, waterCol(Math.max(0, top))); g.addColorStop(1, waterCol(bot)); cx.fillStyle = g; cx.fillRect(0, y0, W, H - y0);
  // sun rays in the shallows
  if(top < 80){ cx.globalCompositeOperation = 'lighter'; for(let i = 0; i < 6; i++){ const x = ((i * 0.19 + G.rt * .01) % 1.2) * W - W * .1, a = .06 * clamp(1 - top / 80, 0, 1) * (.6 + .4 * Math.sin(G.rt + i)); const gr = cx.createLinearGradient(0, y0, 0, y0 + H * .8); gr.addColorStop(0, rgba('#ffffff', a)); gr.addColorStop(1, rgba('#ffffff', 0)); cx.fillStyle = gr; cx.beginPath(); cx.moveTo(x, y0); cx.lineTo(x + 50, y0); cx.lineTo(x + 170, y0 + H * .8); cx.lineTo(x + 70, y0 + H * .8); cx.fill(); } cx.globalCompositeOperation = 'source-over'; }
  drawDecor(top, bot);
  // marine snow
  const deep = clamp(top / 300, .2, 1);
  cx.fillStyle = rgba('#ffffff', .35 * deep);
  for(const p of SNOW){ const x = (p.x * W + Math.sin(G.rt * .3 + p.p * 9) * 12) % W, y = ((p.y * H - top * V.s * .6 * p.s * .5) % H + H) % H; if(y < y0) continue; cx.fillRect(x, y, p.s, p.s); }
}
function hash(n){ const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }
function drawDecor(top, bot){
  // side scenery per zone, anchored to depth so it scrolls with the world
  const step = 4, s = V.s;
  for(let d = Math.floor(Math.max(0, top) / step) * step; d < bot + step; d += step){
    const z = zoneAt(d), h = hash(d), y = SY(d);
    for(const side of [0, 1]){
      if(hash(d * 3.1 + side) > .45) continue;
      const x = side ? W - hash(d + 9) * s * 1.6 : hash(d + 5) * s * 1.6, dir = side ? -1 : 1;
      if(z === 1){ cx.strokeStyle = pick2(['#ff7a8a', '#ffb04a', '#c86aff'], d + side); cx.lineWidth = s * .22; cx.lineCap = 'round'; const br = (ax, ay, a, l, n) => { const bx = ax + Math.cos(a) * l, by = ay + Math.sin(a) * l; cx.beginPath(); cx.moveTo(ax, ay); cx.lineTo(bx, by); cx.stroke(); if(n > 0){ br(bx, by, a - .5, l * .7, n - 1); br(bx, by, a + .5, l * .7, n - 1); } }; br(side ? W : 0, y, side ? Math.PI + .3 : -.3, s * 1.2, 2); cx.lineCap = 'butt'; }
      else if(z === 2){ cx.strokeStyle = '#2a7a3a'; cx.lineWidth = s * .3; cx.beginPath(); cx.moveTo(x, y + s * 4); for(let i = 0; i < 6; i++) cx.lineTo(x + Math.sin(G.rt * 1.2 + i + d) * s * .4 * dir, y + s * 4 - i * s * .8); cx.stroke(); }
      else if(z === 6){ cx.fillStyle = rgba('#8a9aaa', .35); cx.fillRect(side ? W - s * 1.2 : 0, y, s * 1.2, s * 3.6); cx.fillStyle = rgba('#b8c4d0', .35); cx.fillRect(side ? W - s * 1.5 : 0, y, s * 1.5, s * .4); }
      else if(z >= 3){ if(h > .7) glow(x + dir * s * .5, y, s * .5, pick2(['#5affff', '#8a5aff', '#ff5ad0'], d), .4 + .3 * Math.sin(G.rt * 2 + d)); cx.fillStyle = rgba(z === 7 ? '#1a0a2a' : '#0a1428', .8); cx.beginPath(); cx.moveTo(side ? W : 0, y - s * 2); cx.lineTo(x + dir * s * (1 + h), y); cx.lineTo(side ? W : 0, y + s * 2); cx.fill(); }
      else if(h > .6){ cx.strokeStyle = rgba('#3aa86a', .7); cx.lineWidth = s * .12; for(let k = 0; k < 3; k++){ cx.beginPath(); cx.moveTo(side ? W - k * s * .25 : k * s * .25, y + s); cx.quadraticCurveTo((side ? W : 0) + dir * s * (.6 + k * .2) + Math.sin(G.rt + d + k) * s * .2, y, (side ? W : 0) + dir * s * .3 * k, y - s * (1 + k * .3)); cx.stroke(); } }
    }
  }
}
const pick2 = (a, seed) => a[Math.floor(hash(seed) * a.length)];

/* ---------------- things ---------------- */
function drawSurface(){
  const y = SY(0); if(y < -40 || y > H + 40) return;
  cx.fillStyle = rgba('#ffffff', .8); cx.beginPath(); cx.moveTo(0, y);
  for(let x = 0; x <= W + 10; x += 10) cx.lineTo(x, y + Math.sin(x * .03 + G.rt * 2) * 3);
  cx.lineTo(W, y + 3); cx.lineTo(0, y + 3); cx.fill();
  // the boat
  const bx = SX(G.state === 'title' || G.state === 'tally' ? G.WW * .5 : G.hx), by = y + Math.sin(G.rt * 1.5) * 2, s = Math.max(.8, V.s / 30);
  cx.save(); cx.translate(bx, by); cx.rotate(Math.sin(G.rt * 1.3) * .03); cx.scale(s, s);
  cx.fillStyle = '#c8502a'; cx.beginPath(); cx.moveTo(-70, -10); cx.lineTo(70, -10); cx.lineTo(52, 16); cx.lineTo(-52, 16); cx.closePath(); cx.fill();
  cx.fillStyle = '#fff4e0'; cx.fillRect(-70, -14, 140, 6);
  cx.fillStyle = '#ffd23a'; cx.beginPath(); cx.arc(-8, -34, 12, 0, TAU); cx.fill(); cx.fillRect(-18, -26, 20, 16);
  cx.fillStyle = '#ffe0c0'; cx.beginPath(); cx.arc(-8, -32, 7, 0, TAU); cx.fill();
  cx.strokeStyle = rod().col; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(-2, -22); cx.lineTo(40, -64); cx.stroke();
  cx.restore();
}
function drawHook(){
  if(G.state === 'title') return;
  const x = SX(G.hx), y = SY(G.depth), s = V.s;
  if(G.state === 'down' || G.state === 'up' || G.state === 'reel'){
    cx.strokeStyle = 'rgba(255,255,255,.55)'; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(x, Math.min(y, Math.max(0, SY(0)))); cx.lineTo(x, y); cx.stroke();
    // caught fish dangle in a bunch below the hook
    const n = Math.min(G.caught.length, 14);
    for(let i = 0; i < n; i++){ const c = G.caught[G.caught.length - 1 - i], a = Math.PI / 2 + Math.sin(G.rt * 3 + i) * .3 + (i % 2 ? .4 : -.4) * Math.min(1, i / 2), d = s * (.5 + (i % 4) * .22); drawFishAt(c.sp, c.shiny, x + Math.cos(a) * d * .8, y + s * .3 + Math.sin(a) * d, Math.min(s * 1.6, s * c.sp.dl * .8), 1, a, 1); }
    const R = G.S ? G.S.R * (G.frenzyT > 0 ? 2.2 : 1) : 1;
    if(G.state === 'up'){ cx.strokeStyle = G.frenzyT > 0 ? rgba('#ffd23a', .6) : 'rgba(255,255,255,.22)'; cx.lineWidth = 2; cx.setLineDash([5, 6]); cx.beginPath(); cx.arc(x, y, R * s, 0, TAU); cx.stroke(); cx.setLineDash([]); }
    glow(x, y, s * 1.4, G.frenzyT > 0 ? '#ffd23a' : '#fff6c0', .55 + clamp(G.depth / 400, 0, .4));
    cx.strokeStyle = '#dfe6f0'; cx.lineWidth = s * .12; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(x, y - s * .5); cx.lineTo(x, y + s * .15); cx.arc(x - s * .2, y + s * .15, s * .2, 0, Math.PI); cx.stroke(); cx.lineCap = 'butt';
    if(G.shield > 0 && G.state === 'down'){ cx.strokeStyle = rgba('#8affff', .5 + .2 * Math.sin(G.rt * 6)); cx.lineWidth = 2; cx.beginPath(); cx.arc(x, y, s * .7, 0, TAU); cx.stroke(); }
  }
}
function drawJelly(j){
  const x = SX(j.x), y = SY(j.y), s = V.s; if(y < -s * 3 || y > H + s * 3) return;
  glow(x, y, s * 1.3, '#ff5ad0', .5);
  cx.strokeStyle = rgba('#ffb0e0', .7); cx.lineWidth = 2;
  for(let i = 0; i < 5; i++){ const tx = x + (i - 2) * s * .15; cx.beginPath(); cx.moveTo(tx, y); for(let k = 1; k <= 5; k++) cx.lineTo(tx + Math.sin(G.rt * 3 + i + k) * s * .12, y + k * s * .22); cx.stroke(); }
  cx.fillStyle = rgba('#ff7ad0', .75); cx.beginPath(); cx.arc(x, y, s * .5, Math.PI, 0); cx.quadraticCurveTo(x, y + s * .15, x - s * .5, y); cx.fill();
  cx.fillStyle = rgba('#ffffff', .5); cx.beginPath(); cx.arc(x - s * .15, y - s * .25, s * .1, 0, TAU); cx.fill();
}
function drawItem(it){
  if(it.got) return; const x = SX(it.x), y = SY(it.y), s = V.s; if(y < -s * 2 || y > H + s * 2) return;
  if(it.k === 'pearl'){ glow(x, y, s * .5, '#dff8ff', .6); cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(x, y, s * .13, 0, TAU); cx.fill(); return; }
  const cols = [['#8a5a2a', '#d8a060'], ['#6a7a8a', '#dfe8f0'], ['#a8741a', '#ffd23a']][it.tier], w = s * .9, h = s * .65, bob = Math.sin(G.rt * 2 + it.x) * s * .1;
  glow(x, y + bob, s * 1.4, cols[1], .5);
  cx.fillStyle = cols[0]; cx.fillRect(x - w / 2, y - h / 2 + bob, w, h);
  cx.fillStyle = cols[1]; cx.fillRect(x - w / 2, y - h / 2 + bob, w, h * .28); cx.fillRect(x - w * .08, y - h / 2 + bob, w * .16, h);
  cx.strokeStyle = '#1a1208'; cx.lineWidth = 2; cx.strokeRect(x - w / 2, y - h / 2 + bob, w, h);
}

/* ---------------- frame ---------------- */
function render(){
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const vh = H / V.s;
  let want = V.top;
  if(G.state === 'title' || G.state === 'tally') want = -vh * .55;
  else if(G.state === 'down') want = G.depth - vh * .33;
  else if(G.state === 'up') want = G.depth - vh * .62;
  else if(G.state === 'reel') want = -vh * .5;
  else if(G.state === 'air') want = -vh * .72;
  V.top = lerp(V.top, want, G.state === 'down' && G.t < .3 ? .3 : .12);
  G.cam = V.top + vh * .5;
  const sh = G.shake * 14; cx.save(); cx.translate(rnd(-sh, sh), rnd(-sh, sh));
  drawOcean();
  for(const it of G.items) drawItem(it);
  for(const j of G.jelly) if(!j.gone) drawJelly(j);
  const s = V.s, top = V.top - 4, bot = V.top + vh + 4;
  for(const f of G.fish){
    if(f.hooked || f.gone || f.y < top || f.y > bot) continue;
    const x = SX(f.x), y = SY(f.y), len = f.sp.dl * s;
    if(f.sp.z >= 3 || f.sp.r === 'L') glow(x, y, len * .7, f.sp.col2, .35 + (f.sp.r === 'L' ? .3 : 0));
    if(f.shiny){ glow(x, y, len * .8, '#ffd23a', .5); if(Math.sin(G.rt * 8 + f.ph) > .8){ cx.fillStyle = '#fff6c0'; cx.fillRect(x + rnd(-len / 2, len / 2), y + rnd(-len / 4, len / 4), 3, 3); } }
    drawFishAt(f.sp, f.shiny, x, y + Math.sin(f.ph) * s * .08, len, f.dir, Math.sin(f.ph * .7) * .05);
  }
  drawSurface();
  drawHook();
  // flying catch
  for(const a of G.air){ if(a.wait > 0) continue; const x = SX(a.x), y = SY(a.y), len = Math.min(s * 4, a.c.sp.dl * s); if(a.c.snapped){ glow(x, y, len * .9, '#ffd23a', .7); } else if(!a.done) { cx.strokeStyle = rgba('#ffffff', .6 + .3 * Math.sin(G.rt * 10)); cx.lineWidth = 2; cx.beginPath(); cx.arc(x, y, Math.max(s * .9, len * .5), 0, TAU); cx.stroke(); } if(!a.done) drawFishAt(a.c.sp, a.c.shiny, x, y, len, a.vx >= 0 ? 1 : -1, a.rot * .3); }
  // particles and words
  for(const p of G.parts){ cx.globalAlpha = Math.min(1, p.l * 2); cx.fillStyle = p.c; const ps = Math.max(2, p.s * s); cx.fillRect(SX(p.x) - ps / 2, SY(p.y) - ps / 2, ps, ps); }
  cx.globalAlpha = 1;
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(const p of G.pops){ const k = p.t / p.d, sc = k < .12 ? .5 + k / .12 * .6 : 1.1 - (k - .12) * .1; cx.globalAlpha = k > .7 ? (1 - k) / .3 : 1; const sz = Math.round(p.s * clamp(Math.min(W, H) / 700, .85, 1.3) * sc); cx.font = `italic 900 ${sz}px system-ui,sans-serif`; cx.lineWidth = Math.max(3, sz * .18); cx.strokeStyle = 'rgba(5,15,35,.85)'; const px = clamp(SX(p.x), sz * 3, W - sz * 3); cx.strokeText(p.txt, px, SY(p.y)); cx.fillStyle = p.c; cx.fillText(p.txt, px, SY(p.y)); }
  cx.globalAlpha = 1;
  cx.restore();
  if(G.frenzyT > 0 && G.state === 'up'){ cx.fillStyle = `rgba(255,200,40,${.08 + .04 * Math.sin(G.rt * 10)})`; cx.fillRect(0, 0, W, H); }
  if(G.flash > 0){ cx.fillStyle = `rgba(255,255,255,${G.flash * .5})`; cx.fillRect(0, 0, W, H); }
  // darkness at depth, lit around the hook
  const dark = clamp((G.cam - 250) / 900, 0, .75);
  if(dark > 0 && G.state !== 'title'){ const hx = SX(G.hx), hy = SY(G.depth), g = cx.createRadialGradient(hx, hy, V.s * 3, hx, hy, Math.max(W, H) * .8); g.addColorStop(0, 'rgba(0,0,8,0)'); g.addColorStop(1, `rgba(0,0,8,${dark})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
}
