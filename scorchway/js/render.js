'use strict';
const cv = $('c');
let cx = cv.getContext('2d', { alpha:false });
// older browsers: roundRect polyfill
if(!CanvasRenderingContext2D.prototype.roundRect) CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r){ r = Math.min(Math.abs(r) || 0, Math.abs(w) / 2, Math.abs(h) / 2); this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); };
let W = 0, H = 0, DPR = 1, sandTile = null, flameSpr = null, lightC = null, lx = null;
const sx = x => (x - G.camX) * G.camZ + W / 2, sy = y => (y - G.camY) * G.camZ + H / 2;

function resize(){
  W = innerWidth; H = innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, G.q === 'low' ? 1 : 2);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  lightC = document.createElement('canvas'); lightC.width = Math.max(2, W >> 1); lightC.height = Math.max(2, H >> 1); lx = lightC.getContext('2d');
  if(!sandTile) makeTextures();
}
function makeTextures(){
  const r = mulberry32(21), S = 256;
  sandTile = document.createElement('canvas'); sandTile.width = sandTile.height = S;
  const g = sandTile.getContext('2d');
  g.fillStyle = '#e2b47a'; g.fillRect(0, 0, S, S);
  // wind ripples
  g.lineCap = 'round';
  for(let i = 0; i < 26; i++){
    const y = r() * S, x = r() * S, w = 40 + r() * 70, c = r() < .5 ? 'rgba(255,236,200,.35)' : 'rgba(170,110,60,.18)';
    g.strokeStyle = c; g.lineWidth = 1.5 + r() * 1.5; g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x, y - 6 - r() * 6, x + w / 2, y); g.stroke();
  }
  for(let i = 0; i < 500; i++){ g.fillStyle = r() < .5 ? `rgba(150,95,50,${.1 + r() * .2})` : `rgba(255,240,210,${.15 + r() * .25})`; g.fillRect(r() * S, r() * S, 1 + r() * 1.5, 1 + r() * 1.5); }
  for(let i = 0; i < 16; i++){ g.fillStyle = `rgba(120,85,60,${.35 + r() * .3})`; g.beginPath(); g.ellipse(4 + r() * (S - 8), 4 + r() * (S - 8), 1.5 + r() * 2.5, 1 + r() * 2, r() * 3, 0, TAU); g.fill(); }
  flameSpr = document.createElement('canvas'); flameSpr.width = flameSpr.height = 64;
  const f = flameSpr.getContext('2d'), gr = f.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,250,210,1)'); gr.addColorStop(.25, 'rgba(255,205,90,.95)'); gr.addColorStop(.55, 'rgba(255,110,30,.6)'); gr.addColorStop(1, 'rgba(200,40,10,0)');
  f.fillStyle = gr; f.fillRect(0, 0, 64, 64);
}
const tileScaled = { c:null, px:0 };
function drawSand(){
  const px = Math.max(24, Math.round(256 * G.camZ));
  if(tileScaled.px !== px){ const c = tileScaled.c || document.createElement('canvas'); c.width = c.height = px; c.getContext('2d').drawImage(sandTile, 0, 0, px, px); tileScaled.c = c; tileScaled.px = px; }
  const t = tileScaled.c, s = px, Z = s / 256, ox = W / 2 - G.camX * Z, oy = H / 2 - G.camY * Z;
  const x0 = Math.floor(-ox / s), y0 = Math.floor(-oy / s), x1 = Math.floor((W - ox) / s), y1 = Math.floor((H - oy) / s);
  for(let i = x0; i <= x1; i++) for(let j = y0; j <= y1; j++) cx.drawImage(t, Math.round(ox + i * s), Math.round(oy + j * s));
}

/* ---------------- light & time of day ---------------- */
function darkness(){ const t = G.tod; if(t < .4) return 0; if(t < .52) return (t - .4) / .12 * .8; if(t < .82) return .8; if(t < .95) return .8 * (1 - (t - .82) / .13); return 0; }
function sunsetK(){ const t = G.tod; return t > .3 && t < .52 ? Math.sin((t - .3) / .22 * Math.PI) : t > .82 && t < .98 ? Math.sin((t - .82) / .16 * Math.PI) * .6 : 0; }
function shadowOff(){ const k = 1 + sunsetK() * 1.2; return [11 * k * G.camZ, 8 * k * G.camZ]; }

/* ---------------- roads ---------------- */
function drawRoads(){
  const Z = G.camZ, vx0 = G.camX - W / 2 / Z, vx1 = G.camX + W / 2 / Z, vy0 = G.camY - H / 2 / Z, vy1 = G.camY + H / 2 / Z, w = ROAD_W;
  const road = (x, y, ww, hh, vert) => {
    cx.fillStyle = '#c7955d'; cx.fillRect(sx(x) - (vert ? 8 * Z : 0), sy(y) - (vert ? 0 : 8 * Z), ww * Z + (vert ? 16 * Z : 0), hh * Z + (vert ? 0 : 16 * Z));
    cx.fillStyle = '#4b4540'; cx.fillRect(sx(x), sy(y), ww * Z, hh * Z);
    cx.fillStyle = '#e9dcc0';
    if(vert){ cx.fillRect(sx(x) + 6 * Z, sy(y), 3 * Z, hh * Z); cx.fillRect(sx(x + ww) - 9 * Z, sy(y), 3 * Z, hh * Z); }
    else { cx.fillRect(sx(x), sy(y) + 6 * Z, ww * Z, 3 * Z); cx.fillRect(sx(x), sy(y + hh) - 9 * Z, ww * Z, 3 * Z); }
  };
  const dash = (x, y, len, vert) => { cx.fillStyle = '#f2b134'; const st = 70, d0 = Math.floor((vert ? vy0 : vx0) / st) * st; for(let d = d0; d < (vert ? vy1 : vx1); d += st){ if(vert) cx.fillRect(sx(x) - 2.5 * Z, sy(d), 5 * Z, 36 * Z); else cx.fillRect(sx(d), sy(y) - 2.5 * Z, 36 * Z, 5 * Z); } };
  for(let k = Math.floor((vx0 - w) / ROAD_GAP); k <= Math.ceil((vx1 + w) / ROAD_GAP); k++){ const x = k * ROAD_GAP; if(x + w / 2 < vx0 || x - w / 2 > vx1) continue; road(x - w / 2, vy0, w, vy1 - vy0, true); dash(x, 0, 0, true); }
  for(let k = Math.floor((vy0 - w - ROAD_GAP / 2) / ROAD_GAP); k <= Math.ceil((vy1 + w) / ROAD_GAP); k++){ const y = k * ROAD_GAP + ROAD_GAP / 2; if(y + w / 2 < vy0 || y - w / 2 > vy1) continue; road(vx0, y - w / 2, vx1 - vx0, w, false); dash(0, y, 0, false); }
}

/* ---------------- props ---------------- */
const _vis = [];
function drawProps(layer){
  const Z = G.camZ, [shx, shy] = shadowOff();
  propsNear(G.camX, G.camY, Math.max(W, H) / Z * .6, _vis);
  if(layer === 0){
    for(const p of _vis){
      const x = sx(p.x), y = sy(p.y), r = p.r * Z;
      if(x < -r * 3 || y < -r * 3 || x > W + r * 3 || y > H + r * 3) continue;
      if(p.type === 'mesa' || p.type === 'rock'){
        const lift = (p.type === 'mesa' ? 34 : 10) * Z, pts = p.pts;
        const path = (ox, oy, sc) => { cx.beginPath(); pts.forEach((q, i) => { const px = x + q[0] * Z * sc + ox, py = y + q[1] * Z * sc + oy; i ? cx.lineTo(px, py) : cx.moveTo(px, py); }); cx.closePath(); };
        cx.fillStyle = 'rgba(90,45,20,.28)'; path(shx * (p.type === 'mesa' ? 3 : 1.4), shy * (p.type === 'mesa' ? 3 : 1.4), 1); cx.fill();
        cx.fillStyle = p.type === 'mesa' ? '#a8552f' : '#7d6452'; path(0, 0, 1); cx.fill();
        cx.fillStyle = p.type === 'mesa' ? '#8a4324' : '#6a5242'; path(0, lift * .5, .98); cx.fill();
        const tg = cx.createLinearGradient(x, y - r - lift, x, y + r - lift);
        tg.addColorStop(0, p.type === 'mesa' ? '#e8a36a' : '#b8987c'); tg.addColorStop(1, p.type === 'mesa' ? '#c9774a' : '#95785f');
        cx.fillStyle = tg; path(0, -lift, .94); cx.fill();
        if(p.type === 'mesa'){ cx.strokeStyle = 'rgba(255,220,180,.35)'; cx.lineWidth = 2 * Z; path(0, -lift, .94); cx.stroke(); cx.strokeStyle = 'rgba(120,55,25,.35)'; cx.lineWidth = 1.5 * Z; for(let k = 1; k <= 2; k++){ path(0, -lift * (1 - k * .3), .96); cx.stroke(); } }
      } else if(p.type === 'skull'){
        cx.fillStyle = '#f3ead8'; cx.beginPath(); cx.ellipse(x, y, 7 * Z, 5 * Z, 0, 0, TAU); cx.fill();
        cx.strokeStyle = '#f3ead8'; cx.lineWidth = 2.5 * Z; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(x - 6 * Z, y - 3 * Z); cx.quadraticCurveTo(x - 14 * Z, y - 6 * Z, x - 13 * Z, y - 12 * Z); cx.moveTo(x + 6 * Z, y - 3 * Z); cx.quadraticCurveTo(x + 14 * Z, y - 6 * Z, x + 13 * Z, y - 12 * Z); cx.stroke();
        cx.fillStyle = '#5a4030'; cx.fillRect(x - 4 * Z, y - 1 * Z, 2.5 * Z, 2.5 * Z); cx.fillRect(x + 1.5 * Z, y - 1 * Z, 2.5 * Z, 2.5 * Z);
      } else if(p.type === 'bush'){
        cx.fillStyle = 'rgba(90,45,20,.22)'; cx.beginPath(); cx.ellipse(x + shx * .8, y + shy * .8, r, r * .8, 0, 0, TAU); cx.fill();
        cx.strokeStyle = '#9c7a45'; cx.lineWidth = 1.5 * Z; const rr = mulberry32(p.seed);
        cx.beginPath(); for(let k = 0; k < 9; k++){ const a = rr() * TAU, b = rr() * TAU; cx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r * .85); cx.quadraticCurveTo(x, y, x + Math.cos(b) * r, y + Math.sin(b) * r * .85); } cx.stroke();
      } else if(p.type === 'barrel'){
        cx.fillStyle = 'rgba(90,45,20,.3)'; cx.beginPath(); cx.ellipse(x + shx, y + shy, r, r * .8, 0, 0, TAU); cx.fill();
        cx.fillStyle = '#b3262d'; cx.fillRect(x - r * .8, y - r * 1.5, r * 1.6, r * 1.5);
        cx.fillStyle = '#d6453a'; cx.beginPath(); cx.ellipse(x, y - r * 1.5, r * .8, r * .4, 0, 0, TAU); cx.fill();
        cx.fillStyle = '#f2b134'; cx.fillRect(x - r * .8, y - r * .9, r * 1.6, r * .25);
      }
    }
  } else {
    // cacti stand up out of the ground, so they are drawn after the cars
    for(const p of _vis){
      if(p.type !== 'cactus') continue;
      const x = sx(p.x), y = sy(p.y), h = p.h * Z, w = 9 * Z;
      if(x < -80 || y < -80 || x > W + 80 || y > H + h + 80) continue;
      cx.fillStyle = 'rgba(90,45,20,.26)'; cx.beginPath(); cx.moveTo(x - w, y); cx.lineTo(x + shx * 3.2 - w * .6, y + shy * 3.2); cx.lineTo(x + shx * 3.2 + w * .6, y + shy * 3.2); cx.lineTo(x + w, y); cx.fill();
      const body = (bx, by, bw, bh) => { cx.fillStyle = '#4c7a38'; cx.beginPath(); cx.roundRect(bx - bw / 2, by - bh, bw, bh, bw / 2); cx.fill(); cx.fillStyle = '#6b9a4a'; cx.fillRect(bx - bw * .15, by - bh + bw * .4, bw * .18, bh - bw * .6); };
      body(x, y, w * 2, h);
      if(p.arms >= 1){ cx.fillStyle = '#4c7a38'; cx.beginPath(); cx.roundRect(x - w * 2.6, y - h * .55, w * 1.8, w * 1.2, w * .6); cx.fill(); body(x - w * 2, y - h * .5, w * 1.4, h * .38); }
      if(p.arms >= 2){ cx.fillStyle = '#4c7a38'; cx.beginPath(); cx.roundRect(x + w * .8, y - h * .4, w * 1.8, w * 1.2, w * .6); cx.fill(); body(x + w * 2, y - h * .35, w * 1.4, h * .32); }
    }
  }
}

/* ---------------- cars ---------------- */
function rr(x, y, w, h, r){ cx.beginPath(); cx.roundRect(x, y, w, h, r); }
function drawCar(c, look, Z){
  const x = sx(c.x), y = sy(c.y), L = c.len * Z, Wd = c.wid * Z, [shx, shy] = shadowOff();
  if(x < -L * 2 || y < -L * 2 || x > W + L * 2 || y > H + L * 2) return;
  // shadow
  cx.save(); cx.translate(x + shx * .8, y + shy * .8); cx.rotate(c.h); cx.fillStyle = 'rgba(70,35,15,.32)'; rr(-L / 2, -Wd / 2, L, Wd, Wd * .3); cx.fill(); cx.restore();
  cx.save(); cx.translate(x, y); cx.rotate(c.h);
  const hurt = c.hurtT > 0 || c.hitT > .3;
  const kind = look.kind;
  // wheels
  cx.fillStyle = '#1e1a18';
  const wl = L * .2, ww = Wd * .26, fa = (c.steer || 0) * .45;
  const wheel = (px, py, rot, big) => { cx.save(); cx.translate(px, py); cx.rotate(rot); cx.fillRect(-wl * (big ? .65 : .5), -ww * (big ? .65 : .5), wl * (big ? 1.3 : 1), ww * (big ? 1.3 : 1)); cx.restore(); };
  if(kind === 'bike'){ wheel(L * .35, 0, fa, false); wheel(-L * .35, 0, 0, false); }
  else { const ox = L * .3, oy = Wd * .47; wheel(ox, oy, fa); wheel(ox, -oy, fa); wheel(-ox, oy, 0, kind === 'hotrod' || kind === 'buggy'); wheel(-ox, -oy, 0, kind === 'hotrod' || kind === 'buggy'); }
  const bodyG = (col) => { const g = cx.createLinearGradient(0, -Wd / 2, 0, Wd / 2); g.addColorStop(0, mixHex(col, '#000000', .18)); g.addColorStop(.5, mixHex(col, '#ffffff', .12)); g.addColorStop(1, mixHex(col, '#000000', .25)); return g; };
  const glass = (x0, y0, w0, h0) => { const g = cx.createLinearGradient(x0, 0, x0 + w0, 0); g.addColorStop(0, '#2c3a47'); g.addColorStop(1, '#5d7384'); cx.fillStyle = g; rr(x0, y0, w0, h0, 2 * Z); cx.fill(); };
  if(kind === 'bike'){
    cx.fillStyle = look.body; rr(-L * .35, -Wd * .22, L * .7, Wd * .44, 3 * Z); cx.fill();
    cx.fillStyle = '#2a2522'; cx.beginPath(); cx.arc(-L * .05, 0, Wd * .42, 0, TAU); cx.fill();
    cx.fillStyle = '#c9a227'; cx.beginPath(); cx.arc(-L * .02, 0, Wd * .3, 0, TAU); cx.fill();
  } else if(kind === 'truck'){
    cx.fillStyle = bodyG(look.body); rr(L * .18, -Wd / 2, L * .32, Wd, 5 * Z); cx.fill();
    glass(L * .32, -Wd * .38, L * .1, Wd * .76);
    cx.fillStyle = bodyG(look.trailer || '#d8d2c4'); rr(-L / 2, -Wd * .52, L * .66, Wd * 1.04, 3 * Z); cx.fill();
    cx.strokeStyle = 'rgba(0,0,0,.15)'; cx.lineWidth = 1; for(let k = 1; k < 6; k++){ cx.beginPath(); cx.moveTo(-L / 2 + k * L * .11, -Wd * .5); cx.lineTo(-L / 2 + k * L * .11, Wd * .5); cx.stroke(); }
    if(look.boss){ cx.fillStyle = '#f2b134'; for(let k = 0; k < 5; k++){ cx.save(); cx.translate(-L * .45 + k * L * .13, 0); cx.rotate(.6); cx.fillRect(-2 * Z, -Wd * .5, 4 * Z, Wd); cx.restore(); } cx.fillStyle = '#9aa0a6'; for(const s of [-1, 1]){ cx.beginPath(); cx.moveTo(L * .5, s * Wd * .3); cx.lineTo(L * .62, s * Wd * .15); cx.lineTo(L * .5, 0); cx.fill(); } }
  } else if(kind === 'heli'){
    // drawn by drawHeli
  } else {
    cx.fillStyle = bodyG(look.body); rr(-L / 2, -Wd / 2, L, Wd, Wd * (kind === 'buggy' ? .2 : .32)); cx.fill();
    if(kind === 'buggy'){
      cx.strokeStyle = '#2a2522'; cx.lineWidth = 2.5 * Z; rr(-L * .25, -Wd * .36, L * .42, Wd * .72, 3 * Z); cx.stroke();
      cx.beginPath(); cx.moveTo(-L * .25, 0); cx.lineTo(L * .17, 0); cx.stroke();
      cx.fillStyle = '#7a3a1c'; cx.beginPath(); cx.arc(-L * .05, 0, Wd * .2, 0, TAU); cx.fill();
    } else {
      // stripes / livery
      if(kind === 'muscle' || kind === 'rally' || kind === 'coupe'){ cx.fillStyle = look.stripe; cx.fillRect(-L / 2, -Wd * .14, L, Wd * .09); cx.fillRect(-L / 2, Wd * .05, L, Wd * .09); }
      if(kind === 'hotrod'){ cx.fillStyle = look.stripe; for(let k = 0; k < 3; k++){ cx.beginPath(); cx.moveTo(L * .35, (k - 1) * Wd * .25); cx.quadraticCurveTo(L * .1, (k - 1) * Wd * .32, -L * .05 - k * 4 * Z, (k - 1) * Wd * .2); cx.lineTo(L * .35, (k - 1) * Wd * .25 + 4 * Z); cx.fill(); } cx.fillStyle = '#c9c9c9'; rr(L * .24, -Wd * .2, L * .2, Wd * .4, 2 * Z); cx.fill(); }
      if(kind === 'wagon'){ cx.fillStyle = look.stripe; cx.fillRect(-L * .45, -Wd * .5, L * .78, Wd * .12); cx.fillRect(-L * .45, Wd * .38, L * .78, Wd * .12); }
      if(look.cop){ cx.fillStyle = '#f4f1ea'; cx.fillRect(-L * .18, -Wd / 2, L * .38, Wd); }
      // cabin
      const cabF = kind === 'pickup' ? L * .12 : kind === 'wagon' ? L * .12 : L * .1, cabB = kind === 'pickup' ? -L * .06 : kind === 'wagon' ? -L * .42 : -L * .26;
      glass(cabF, -Wd * .36, L * .1, Wd * .72);
      cx.fillStyle = look.roof; rr(cabB, -Wd * .38, cabF - cabB, Wd * .76, 3 * Z); cx.fill();
      glass(cabB - L * .06, -Wd * .3, L * .06, Wd * .6);
      if(kind === 'pickup'){ cx.fillStyle = mixHex(look.body, '#000000', .4); rr(-L * .47, -Wd * .4, L * .38, Wd * .8, 2 * Z); cx.fill(); }
      if(kind === 'rally'){ cx.fillStyle = look.stripe; cx.fillRect(cabB + 3 * Z, -Wd * .05, cabF - cabB - 6 * Z, Wd * .1); }
      if(look.cop){
        const on = ((G.rt * 6) | 0) % 2;
        cx.fillStyle = on ? '#ff3b30' : '#6b1a16'; cx.fillRect(-L * .1, -Wd * .34, L * .08, Wd * .3);
        cx.fillStyle = on ? '#1a3fa0' : '#3a8bff'; cx.fillRect(-L * .1, Wd * .04, L * .08, Wd * .3);
      }
    }
    // lights
    cx.fillStyle = '#fff4c8'; cx.fillRect(L * .44, -Wd * .42, L * .06, Wd * .18); cx.fillRect(L * .44, Wd * .24, L * .06, Wd * .18);
    cx.fillStyle = '#c0231c'; cx.fillRect(-L * .5, -Wd * .42, L * .04, Wd * .16); cx.fillRect(-L * .5, Wd * .26, L * .04, Wd * .16);
  }
  if(hurt){ cx.fillStyle = 'rgba(255,255,255,.35)'; rr(-L / 2, -Wd / 2, L, Wd, Wd * .3); cx.fill(); }
  if(c.fuse > 0 || c.burnFx > 0){ cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = .8; cx.drawImage(flameSpr, -L * .6, -Wd, L * 1.2, Wd * 2); cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over'; }
  cx.restore();
  if(c.burnFx > 0) c.burnFx -= 1 / 60;
}
function drawHeli(e, Z){
  const alt = 110 * Z, x = sx(e.x), y = sy(e.y), [shx, shy] = shadowOff();
  cx.save(); cx.translate(x + shx * 5, y + shy * 5 + 20 * Z); cx.rotate(e.h); cx.fillStyle = 'rgba(60,30,10,.25)'; cx.beginPath(); cx.ellipse(0, 0, 34 * Z, 13 * Z, 0, 0, TAU); cx.fill(); cx.fillRect(-60 * Z, -3 * Z, 40 * Z, 6 * Z); cx.restore();
  cx.save(); cx.translate(x, y - alt); cx.rotate(e.h);
  cx.fillStyle = '#3f5541'; cx.beginPath(); cx.ellipse(0, 0, 32 * Z, 14 * Z, 0, 0, TAU); cx.fill();
  cx.fillRect(-64 * Z, -3 * Z, 40 * Z, 6 * Z); cx.fillRect(-66 * Z, -10 * Z, 6 * Z, 20 * Z);
  cx.fillStyle = '#9bb4c4'; cx.beginPath(); cx.ellipse(18 * Z, 0, 11 * Z, 9 * Z, 0, 0, TAU); cx.fill();
  cx.strokeStyle = 'rgba(30,30,30,.55)'; cx.lineWidth = 3 * Z; const ra = G.rt * 38;
  cx.beginPath(); for(let k = 0; k < 2; k++){ const a = ra + k * Math.PI / 2; cx.moveTo(Math.cos(a) * 52 * Z, Math.sin(a) * 52 * Z); cx.lineTo(-Math.cos(a) * 52 * Z, -Math.sin(a) * 52 * Z); } cx.stroke();
  cx.fillStyle = 'rgba(40,40,40,.12)'; cx.beginPath(); cx.arc(0, 0, 52 * Z, 0, TAU); cx.fill();
  cx.restore();
}
function lookOf(e){
  if(e.type === 'cop') return { kind:'muscle', body:'#1b1b1f', stripe:'#1b1b1f', roof:'#f4f1ea', cop:true };
  if(e.type === 'buggy') return { kind:'buggy', body:'#c9a227', stripe:'#3a2418', roof:'#3a2418' };
  if(e.type === 'bike') return { kind:'bike', body:'#6b4f9e' };
  if(e.type === 'truck') return e.boss ? { kind:'truck', body:'#7a3a1c', trailer:'#6e6a63', boss:true } : { kind:'truck', body:'#5e7d8a', trailer:'#d8d2c4' };
  return { kind:'muscle', body:'#888', stripe:'#fff', roof:'#666' };
}

/* ---------------- fire, smoke, fx ---------------- */
function drawFire(){
  const Z = G.camZ;
  // scorched ground under the flames
  cx.fillStyle = 'rgba(60,30,15,.16)';
  for(const f of G.F){ const x = sx(f.x), y = sy(f.y); if(x < -50 || y < -50 || x > W + 50 || y > H + 50) continue; cx.beginPath(); cx.arc(x, y, f.r * Z * 1.1, 0, TAU); cx.fill(); }
  cx.globalCompositeOperation = 'lighter';
  for(const f of G.F){
    const x = sx(f.x), y = sy(f.y); if(x < -60 || y < -60 || x > W + 60 || y > H + 60) continue;
    const k = Math.min(1, f.life / f.max * 2.5) * Math.min(1, (f.max - f.life) * 8 + .3), fl = 1 + .22 * Math.sin(G.rt * 14 + f.ph);
    const r = f.r * Z * 1.7 * fl * (.5 + .5 * k);
    cx.globalAlpha = .85 * k; cx.drawImage(flameSpr, x - r, y - r * 1.25, r * 2, r * 2);
  }
  cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
}
function drawFx(){
  const Z = G.camZ;
  for(const f of G.FX){
    if(!f.boom) continue;
    const k = 1 - f.life / f.max0, x = sx(f.x), y = sy(f.y), R = f.r * Z * (.35 + .75 * Math.pow(k, .5));
    const g = cx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, `rgba(255,250,220,${1 - k})`); g.addColorStop(.35, `rgba(255,190,80,${.9 * (1 - k)})`); g.addColorStop(.7, `rgba(230,90,30,${.6 * (1 - k)})`); g.addColorStop(1, 'rgba(120,40,10,0)');
    cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, R, 0, TAU); cx.fill();
    cx.strokeStyle = `rgba(255,245,220,${.5 * (1 - k)})`; cx.lineWidth = 4 * (1 - k) + 1; cx.beginPath(); cx.arc(x, y, f.r * Z * (.4 + 1.2 * k), 0, TAU); cx.stroke();
  }
}

/* ---------------- main render ---------------- */
function render(){
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const sh = save.opt.shake ? G.shake : 0;
  cx.save(); cx.translate((Math.random() * 2 - 1) * sh, (Math.random() * 2 - 1) * sh);
  const Z = G.camZ;
  drawSand();
  drawRoads();
  // scorch decals and tire marks
  for(const s of G.SC){ const x = sx(s.x), y = sy(s.y), r = s.r * Z, k = Math.min(1, s.life / 6); const g = cx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(40,22,12,${.5 * k})`); g.addColorStop(1, 'rgba(40,22,12,0)'); cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.fill(); }
  cx.lineCap = 'round'; cx.lineWidth = Math.max(2, 5 * Z);
  for(const m of G.MK){ cx.strokeStyle = `rgba(70,40,25,${m.a * Math.min(1, m.life / 4)})`; cx.beginPath(); cx.moveTo(sx(m.x1), sy(m.y1)); cx.lineTo(sx(m.x2), sy(m.y2)); cx.stroke(); }
  drawProps(0);
  drawFire();
  // bombs: falling shadows with target rings
  for(const b of G.BM){ const k = b.t / b.dur, x = sx(b.x), y = sy(b.y), r = b.r * Z; cx.strokeStyle = `rgba(179,38,45,${.5 + .5 * Math.sin(G.rt * 20)})`; cx.lineWidth = 3; cx.setLineDash([10, 8]); cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.stroke(); cx.setLineDash([]); cx.fillStyle = `rgba(179,38,45,${.12 + .2 * k})`; cx.beginPath(); cx.arc(x, y, r * k, 0, TAU); cx.fill(); cx.fillStyle = 'rgba(40,20,10,.5)'; cx.beginPath(); cx.arc(x, y, 8 * Z * k + 2, 0, TAU); cx.fill(); }
  for(const m of G.MN){ const x = sx(m.x), y = sy(m.y); cx.fillStyle = '#3a3431'; cx.beginPath(); cx.arc(x, y, 9 * Z, 0, TAU); cx.fill(); cx.fillStyle = m.t > m.arm && ((G.rt * 4) | 0) % 2 ? '#ff3b30' : '#6b1a16'; cx.beginPath(); cx.arc(x, y, 3.5 * Z, 0, TAU); cx.fill(); }
  // pickups
  for(const p of G.PK){
    const x = sx(p.x), y = sy(p.y) - Math.sin(G.rt * 4 + p.x) * 3 * Z, s = Z;
    cx.fillStyle = 'rgba(70,35,15,.25)'; cx.beginPath(); cx.ellipse(x + 4 * s, sy(p.y) + 8 * s, 12 * s, 5 * s, 0, 0, TAU); cx.fill();
    if(p.kind === 'cash'){ cx.fillStyle = '#3d7a3a'; rr(x - 11 * s, y - 7 * s, 22 * s, 14 * s, 2 * s); cx.fill(); cx.fillStyle = '#a8d49a'; rr(x - 9 * s, y - 5 * s, 18 * s, 10 * s, 2 * s); cx.fill(); cx.fillStyle = '#2e5e2c'; cx.font = `900 ${Math.round(10 * s)}px Arial Black,Arial,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('$', x, y + .5 * s); }
    else if(p.kind === 'wrench'){ cx.fillStyle = '#f4ecdc'; cx.beginPath(); cx.arc(x, y, 14 * s, 0, TAU); cx.fill(); cx.strokeStyle = '#2a9d8f'; cx.lineWidth = 3 * s; cx.stroke(); cx.fillStyle = '#2a9d8f'; cx.font = `900 ${Math.round(15 * s)}px Arial Black,Arial,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('✚', x, y + s); }
    else { cx.fillStyle = '#b3262d'; rr(x - 8 * s, y - 12 * s, 16 * s, 22 * s, 3 * s); cx.fill(); cx.fillStyle = '#f2b134'; cx.fillRect(x - 8 * s, y - 3 * s, 16 * s, 5 * s); cx.fillStyle = '#3a3431'; cx.fillRect(x - 3 * s, y - 16 * s, 6 * s, 5 * s); }
  }
  // debris on the ground
  for(const b of G.DB){ const k = Math.min(1, b.life / .5); cx.globalAlpha = k; cx.save(); cx.translate(sx(b.x), sy(b.y) - b.z * Z * .5); cx.rotate(b.a); cx.fillStyle = b.c; cx.fillRect(-b.w * Z / 2, -b.h * Z / 2, b.w * Z, b.h * Z); cx.restore(); }
  cx.globalAlpha = 1;
  // cars
  for(const e of G.E) if(e.type !== 'heli') drawCar(e, lookOf(e), Z);
  if(P && !P.dead){
    if(P.nitroOn){ const fx = Math.cos(P.h), fy = Math.sin(P.h); cx.globalCompositeOperation = 'lighter'; for(let k = 0; k < 3; k++){ const d = P.len * (.55 + k * .22), r = (14 - k * 3) * Z * (1 + .2 * Math.sin(G.rt * 40 + k)); cx.drawImage(flameSpr, sx(P.x - fx * d) - r, sy(P.y - fy * d) - r, r * 2, r * 2); } cx.globalCompositeOperation = 'source-over'; }
    drawCar(P, P.car, Z);
  }
  drawProps(1);
  drawFx();
  // smoke
  for(const s of G.SM){ const k = s.life / s.max; cx.fillStyle = rgba(s.c, .35 * k); cx.beginPath(); cx.arc(sx(s.x), sy(s.y), s.r * Z, 0, TAU); cx.fill(); }
  // particles
  for(const p of G.PT){ const k = p.life / p.max; cx.globalAlpha = k; cx.fillStyle = p.c; const s = p.s * Z * (.5 + k * .5); cx.fillRect(sx(p.x) - s / 2, sy(p.y) - s / 2, s, s); }
  cx.globalAlpha = 1;
  for(const e of G.E) if(e.type === 'heli') drawHeli(e, Z);
  // popups
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(const p of G.POP){
    const k = Math.min(1, p.life / .3), sc = p.life > .85 ? 1 + (p.life - .85) * 2 : 1;
    cx.globalAlpha = k; cx.font = `900 ${Math.round(p.size * sc)}px 'Arial Black',Impact,system-ui,sans-serif`;
    cx.lineWidth = 5; cx.strokeStyle = '#fff3dc'; cx.lineJoin = 'round'; cx.strokeText(p.txt, sx(p.x), sy(p.y)); cx.fillStyle = p.c; cx.fillText(p.txt, sx(p.x), sy(p.y));
  }
  cx.globalAlpha = 1; cx.textBaseline = 'alphabetic';
  cx.restore();
  drawLighting();
  if(P && P.nitroOn && G.state === 'play'){ cx.strokeStyle = 'rgba(255,245,220,.35)'; cx.lineWidth = 2; for(let i = 0; i < 12; i++){ const a = rnd(0, TAU), r0 = Math.hypot(W, H) * rnd(.36, .5); cx.beginPath(); cx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); cx.lineTo(W / 2 + Math.cos(a) * r0 * 1.4, H / 2 + Math.sin(a) * r0 * 1.4); cx.stroke(); } }
  if(P && G.state === 'play' && P.hp < P.maxHp * .25){ cx.fillStyle = `rgba(179,38,45,${.1 + .06 * Math.sin(G.rt * 7)})`; cx.fillRect(0, 0, W, H); }
  if(G.flash > 0){ cx.fillStyle = rgba(G.flashCol, Math.min(.35, G.flash * .3)); cx.fillRect(0, 0, W, H); }
  if(IN.joy && IN.joy.on && G.state === 'play'){
    cx.strokeStyle = 'rgba(58,36,24,.4)'; cx.lineWidth = 3; cx.beginPath(); cx.arc(IN.joy.ox, IN.joy.oy, 56, 0, TAU); cx.stroke();
    const dx = IN.joy.x - IN.joy.ox, dy = IN.joy.y - IN.joy.oy, l = Math.hypot(dx, dy), m = Math.min(l, 56) / (l || 1);
    cx.fillStyle = 'rgba(255,243,220,.6)'; cx.beginPath(); cx.arc(IN.joy.ox + dx * m, IN.joy.oy + dy * m, 24, 0, TAU); cx.fill();
  }
}
// sunset glow and night: headlights, fires and explosions cut through the dark
function drawLighting(){
  const sk = sunsetK(), dk = darkness(), Z = G.camZ;
  if(sk > 0){ const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(255,120,60,${.22 * sk})`); g.addColorStop(1, `rgba(200,60,90,${.18 * sk})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
  if(dk <= 0) return;
  const k = .5, lw = lightC.width, lh = lightC.height;
  lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, lw, lh);
  lx.fillStyle = `rgba(14,16,44,${dk})`; lx.fillRect(0, 0, lw, lh);
  lx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a) => { const g = lx.createRadialGradient(x * k, y * k, 0, x * k, y * k, r * k); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); lx.fillStyle = g; lx.fillRect(x * k - r * k, y * k - r * k, r * 2 * k, r * 2 * k); };
  const beam = (c, len, a) => {
    const x = sx(c.x), y = sy(c.y), fx = Math.cos(c.h), fy = Math.sin(c.h);
    lx.save(); lx.translate((x + fx * len * .55 * Z) * k, (y + fy * len * .55 * Z) * k); lx.rotate(c.h); lx.scale(1.9, 1);
    const R = len * .5 * Z * k, g = lx.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    lx.fillStyle = g; lx.fillRect(-R, -R, R * 2, R * 2); lx.restore();
  };
  if(P && !P.dead){ beam(P, 420, .95); hole(sx(P.x), sy(P.y), 90 * Z, .8); }
  for(const e of G.E){ if(e.type === 'heli'){ hole(sx(e.x), sy(e.y), 120 * Z, .5); continue; } beam(e, 220, .6); }
  for(let i = 0; i < G.F.length; i += 2){ const f = G.F[i]; hole(sx(f.x), sy(f.y), 70 * Z, .7 * Math.min(1, f.life / f.max * 2)); }
  for(const f of G.FX) if(f.boom) hole(sx(f.x), sy(f.y), f.r * 2.2 * Z, f.life / f.max0);
  for(const p of G.PK) hole(sx(p.x), sy(p.y), 30 * Z, .6);
  cx.drawImage(lightC, 0, 0, W, H);
  // glowing cores on top of the dark
  cx.globalCompositeOperation = 'lighter';
  for(const e of G.E){ if(e.type !== 'cop') continue; const on = ((G.rt * 6) | 0) % 2, r = 60 * Z; const g = cx.createRadialGradient(sx(e.x), sy(e.y), 0, sx(e.x), sy(e.y), r); g.addColorStop(0, on ? 'rgba(255,60,50,.5)' : 'rgba(60,110,255,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = g; cx.fillRect(sx(e.x) - r, sy(e.y) - r, r * 2, r * 2); }
  cx.globalAlpha = .5 * dk;
  for(let i = 0; i < G.F.length; i += 3){ const f = G.F[i], r = 40 * Z; cx.drawImage(flameSpr, sx(f.x) - r, sy(f.y) - r, r * 2, r * 2); }
  cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
}

/* ---------------- menu backdrop: a car drifting circles in fire ---------------- */
function menuTick(dt){
  if(!P){
    const c = carDef();
    P = { x:0, y:0, h:0, vx:200, vy:0, steer:0, hp:100, maxHp:100, inv:0, drift:false, slip:0, nitroOn:false, car:c, fireAcc:0, mineT:9, len:54, wid:27, hurtT:0, top:c.spd * .9, acc:c.acc, turn:3.1, grip:c.grip };
    for(const k of ['E','F','PT','SM','DB','POP','FX','TM','PK','BM','MK','SC','MN']) G[k].length = 0;
    G.menuT0 = G.rt; G.up = {}; G.heat = 1; G.t = 0;
  }
  G.rt += dt; G.tod = .2;
  const t = G.rt - G.menuT0;
  G.menuSteer = [Math.sin(t * .35) > -.2 ? .95 : -.2, Math.sin(t * .35) > -.2];
  G.menuNitro = Math.sin(t * .35) < -.6;
  G.state = 'menuplay';
  updPlayer(dt);
  if(G.E.length < 5 && Math.random() < dt){ const a = rnd(0, TAU), d = 600; const e = spawnEnemy(pick(['buggy', 'cop', 'buggy', 'bike']), P.x + Math.cos(a) * d, P.y + Math.sin(a) * d); e.top *= .8; }
  updEnemies(dt);
  tickWorld(dt);
  G.state = 'menu';
  G.camZ = targetZoom() * .95; G.camX = lerp(G.camX, P.x, Math.min(1, dt * 2)); G.camY = lerp(G.camY, P.y, Math.min(1, dt * 2));
}

/* ---------------- garage preview: the real car drawing on a tiny canvas ---------------- */
function carPreview(def){
  const c = document.createElement('canvas'); c.width = 144; c.height = 90;
  const saved = [cx, G.camX, G.camY, G.camZ, W, H, G.tod];
  cx = c.getContext('2d'); W = 144; H = 90; G.camX = 0; G.camY = 0; G.camZ = 2.2; G.tod = .2;
  try{ drawCar({ x:0, y:-2, h:-.35, len:48, wid:24, steer:.4, hurtT:0 }, def, 2.2); }catch(e){}
  [cx, G.camX, G.camY, G.camZ, W, H, G.tod] = saved;
  return c;
}
