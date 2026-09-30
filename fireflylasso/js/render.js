'use strict';
/* =====================================================================
   FIREFLY LASSO renderer. A night scene drawn in code, lit by fireflies.
   ===================================================================== */
const cv = $('cv'); let cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
const V = { s:1, x:0, y:0, TOP:62, jx:0, jy:0 };
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, save.opt.fx === 'low' ? 1 : 2);
  W = innerWidth; H = innerHeight; cv.width = W * DPR | 0; cv.height = H * DPR | 0;
  const aw = W, ah = H - V.TOP, s = Math.min(aw, ah) / 600;
  const nW = aw / s, nH = ah / s;
  if(G.flies.length && G.W && (Math.abs(nW - G.W) > 1 || Math.abs(nH - G.H) > 1)){ const kx = nW / G.W, ky = nH / G.H; for(const f of G.flies){ f.x *= kx; f.y *= ky; } for(const w of G.webs){ w.x *= kx; w.y *= ky; } for(const w of G.wasps){ w.x *= kx; w.y *= ky; } }
  G.W = nW; G.H = nH; V.s = s; V.x = 0; V.y = V.TOP;
  bgCache = null;
  const j = $('jar'); if(j){ const r = j.getBoundingClientRect(); V.jx = r.left + r.width / 2; V.jy = r.top + r.height / 2; }
}
const SX = x => V.x + x * V.s, SY = y => V.y + y * V.s;
const toWorld = (px, py) => [(px - V.x) / V.s, (py - V.y) / V.s];

const glowC = {};
function glowSpr(c){ if(glowC[c]) return glowC[c]; const s = 64, cn = document.createElement('canvas'); cn.width = cn.height = s; const g = cn.getContext('2d'), gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, rgba(c, 1)); gr.addColorStop(.25, rgba(c, .45)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(0, 0, s, s); return glowC[c] = cn; }
function glow(x, y, r, c, a){ if(a <= 0) return; cx.globalAlpha = Math.min(1, a); cx.drawImage(glowSpr(c), x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1; }

/* ---------------- the painted night (cached) ---------------- */
let bgCache = null, bgKey = '';
function placeIdx(){ return G.spec ? G.spec.place : 0; }
function drawBg(){
  const pi = placeIdx(), P = PLACES[pi], key = pi + ':' + W + 'x' + H;
  if(!bgCache || bgKey !== key){
    bgKey = key; bgCache = document.createElement('canvas'); bgCache.width = W * DPR | 0; bgCache.height = H * DPR | 0;
    const g = bgCache.getContext('2d'); g.scale(DPR, DPR);
    const R = mulberry32(99 + pi * 7);
    const sk = g.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, P.sky[0]); sk.addColorStop(1, P.sky[1]); g.fillStyle = sk; g.fillRect(0, 0, W, H);
    // stars
    for(let i = 0; i < 160; i++){ const x = R() * W, y = R() * H * .7, s = R() * 1.6 + .3; g.fillStyle = rgba('#ffffff', .3 + R() * .6); g.fillRect(x, y, s, s); }
    if(pi === 3){ // a band of galaxy over the peaks
      for(let i = 0; i < 400; i++){ const t = R(), x = t * W, y = H * .12 + Math.sin(t * 3) * H * .08 + (R() - .5) * 60; g.fillStyle = rgba(pick(['#ffffff', '#c8a8ff', '#8ad8ff']), R() * .5); g.fillRect(x, y, 1.2, 1.2); }
    }
    // the moon
    const mx = W * .8, my = H * .18, mr = Math.min(W, H) * .06;
    const halo = g.createRadialGradient(mx, my, mr, mx, my, mr * 5); halo.addColorStop(0, rgba(P.moon, .3)); halo.addColorStop(1, rgba(P.moon, 0)); g.fillStyle = halo; g.fillRect(0, 0, W, H);
    g.fillStyle = P.moon; g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.fill();
    g.fillStyle = rgba('#000000', .08); for(const [dx, dy, r] of [[-.3, -.2, .22], [.25, .15, .16], [-.05, .35, .12]]){ g.beginPath(); g.arc(mx + dx * mr, my + dy * mr, r * mr, 0, TAU); g.fill(); }
    // far hills and near hills
    const hill = (base, amp, col, seed) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for(let x = 0; x <= W + 10; x += 10){ const y = base + Math.sin(x * .004 + seed) * amp + Math.sin(x * .011 + seed * 2) * amp * .4; g.lineTo(x, y); } g.lineTo(W, H); g.closePath(); g.fill(); };
    if(pi === 3){
      g.fillStyle = P.hill[0]; g.beginPath(); g.moveTo(0, H); let x = 0; while(x < W + 100){ const w = 120 + R() * 160, h = H * (.25 + R() * .25); g.lineTo(x + w / 2, H * .82 - h); g.lineTo(x + w, H * .82); x += w * .7; } g.lineTo(W, H); g.fill();
      g.fillStyle = rgba('#ffffff', .5); x = 0; const R2 = mulberry32(99 + pi * 7);
    } else hill(H * .72, H * .05, P.hill[0], 1 + pi);
    hill(H * .84, H * .035, P.hill[1], 4 + pi);
    // woods: tree silhouettes
    if(P.trees){ for(let i = 0; i < 14; i++){ const x = R() * W, h = H * (.25 + R() * .3), w = 30 + R() * 50, b = H * .86; g.fillStyle = mix(P.hill[1], '#000000', .3); g.fillRect(x - 3, b - h * .3, 6, h * .3); g.beginPath(); g.moveTo(x - w, b - h * .25); g.lineTo(x, b - h); g.lineTo(x + w, b - h * .25); g.fill(); g.beginPath(); g.moveTo(x - w * .8, b - h * .5); g.lineTo(x, b - h * 1.1); g.lineTo(x + w * .8, b - h * .5); g.fill(); } }
    // marsh: still water with the moon's reflection
    if(P.water){ const wy = H * .86; const wg = g.createLinearGradient(0, wy, 0, H); wg.addColorStop(0, '#1a3040'); wg.addColorStop(1, '#0a1620'); g.fillStyle = wg; g.fillRect(0, wy, W, H - wy); g.fillStyle = rgba(P.moon, .25); for(let i = 0; i < 8; i++) g.fillRect(mx - 30 + R() * 20, wy + 6 + i * 7, 40 + R() * 30, 2); for(let i = 0; i < 20; i++){ const x = R() * W; g.strokeStyle = '#0f2a22'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, wy + 4); g.quadraticCurveTo(x + 6, wy - 30, x + 2, wy - 50 - R() * 30); g.stroke(); g.fillStyle = '#3a2a1a'; g.fillRect(x, wy - 60 - R() * 20, 4, 14); } }
    if(P.snow){ g.fillStyle = rgba('#ffffff', .12); g.fillRect(0, H * .88, W, H * .12); }
  }
  cx.drawImage(bgCache, 0, 0, W, H);
  // twinkling stars on top of the cache
  for(let i = 0; i < 24; i++){ const x = (i * 97.3 % 1) * W + (i * 37 % W), y = (i * 53 % 100) / 100 * H * .6, a = .5 + .5 * Math.sin(G.rt * (1.5 + i % 3) + i); cx.fillStyle = rgba('#ffffff', a * .8); cx.fillRect(x % W, y, 1.8, 1.8); }
}
function drawGrass(){
  const P = PLACES[placeIdx()], base = H + 4, n = Math.ceil(W / 9), t = G.rt;
  cx.fillStyle = P.grass;
  cx.beginPath(); cx.moveTo(0, base);
  for(let i = 0; i <= n; i++){ const x = i * 9, h = 22 + (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * 34, sway = Math.sin(t * 1.3 + i * .4) * 5 + (G.gust || 0) * .08; cx.lineTo(x - 3, base - 4); cx.lineTo(x + sway, base - h); cx.lineTo(x + 4, base - 4); }
  cx.lineTo(W, base); cx.closePath(); cx.fill();
}

/* ---------------- creatures ---------------- */
const HUECOL = ['#ff5a5a', '#ffb020', '#ffe25a', '#7dff9a', '#6ad0ff', '#c8a8ff', '#ff7ad0'];
function flyCol(f){ return f.sp === 'star' ? HUECOL[((G.rt * 4 + f.ph) | 0) % HUECOL.length] : SPECIES[f.sp].col; }
function drawFly(f){
  const S = SPECIES[f.sp], s = V.s, x = SX(f.x), y = SY(f.y), c = flyCol(f);
  const pulse = .75 + .25 * Math.sin(f.ph * 1.7), a = f.fade * (f.sp === 'blink' ? (f.vis ? 1 : .12) : 1);
  const r = S.r * s * 1.25 * (f.sp === 'moth' || f.sp === 'shadow' ? 1.2 : 1);
  glow(x, y, (S.boss ? 90 : f.sp === 'gold' || f.sp === 'moth' ? 40 : 30) * s * pulse, c, a);
  if(f.sp === 'moth' || f.sp === 'shadow'){
    const fl = Math.sin(G.rt * 18 + f.ph) * .5 + .5; cx.globalAlpha = a * .8; cx.fillStyle = c;
    cx.beginPath(); cx.ellipse(x - 6 * s, y, 9 * s, (4 + fl * 5) * s, -.5, 0, TAU); cx.fill(); cx.beginPath(); cx.ellipse(x + 6 * s, y, 9 * s, (4 + fl * 5) * s, .5, 0, TAU); cx.fill(); cx.globalAlpha = 1;
  }
  cx.globalAlpha = a; cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(x, y, r * .55 * pulse + .8, 0, TAU); cx.fill();
  cx.fillStyle = c; cx.globalAlpha = a * .7; cx.beginPath(); cx.arc(x, y, r * pulse, 0, TAU); cx.fill(); cx.globalAlpha = 1;
}
function drawQueen(q){
  const s = V.s, x = SX(q.x), y = SY(q.y), c = SPECIES.queen.col, k = q.caught ? Math.max(0, 1 - q.t / .8) : 1;
  if(k <= 0) return;
  const pulse = .85 + .15 * Math.sin(G.rt * 3);
  glow(x, y, 120 * s * pulse * (q.caught ? 1 + q.t * 2 : 1), c, .9 * k);
  cx.globalAlpha = k;
  const fl = Math.sin(G.rt * 12) * .5 + .5;
  cx.fillStyle = rgba('#fff6e0', .55); cx.beginPath(); cx.ellipse(x - 16 * s, y - 6 * s, 20 * s, (8 + fl * 8) * s, -.6, 0, TAU); cx.fill(); cx.beginPath(); cx.ellipse(x + 16 * s, y - 6 * s, 20 * s, (8 + fl * 8) * s, .6, 0, TAU); cx.fill();
  cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(x, y, 11 * s, 0, TAU); cx.fill(); cx.fillStyle = c; cx.beginPath(); cx.ellipse(x, y + 12 * s, 9 * s, 14 * s, 0, 0, TAU); cx.fill();
  // crown
  cx.fillStyle = '#ffd23a'; cx.beginPath(); cx.moveTo(x - 10 * s, y - 10 * s); for(let i = 0; i <= 4; i++){ cx.lineTo(x - 10 * s + i * 5 * s, y - (i % 2 ? 14 : 22) * s); } cx.lineTo(x + 10 * s, y - 10 * s); cx.fill();
  cx.globalAlpha = 1;
}
function drawWasp(w){
  const s = V.s, x = SX(w.x), y = SY(w.y), dir = w.vx >= 0 ? 1 : -1, a = w.gone ? Math.max(0, 1 - w.gone / 2.5) : 1;
  cx.save(); cx.translate(x, y); cx.scale(dir * s, s); cx.globalAlpha = a;
  const fl = Math.sin(w.ph) > 0;
  cx.fillStyle = 'rgba(220,235,255,.55)'; cx.beginPath(); cx.ellipse(-2, -10, 8, fl ? 12 : 4, fl ? -.3 : -.8, 0, TAU); cx.fill(); cx.beginPath(); cx.ellipse(4, -9, 7, fl ? 10 : 3, fl ? .2 : .6, 0, TAU); cx.fill();
  cx.fillStyle = '#ffb020'; cx.beginPath(); cx.ellipse(-6, 2, 12, 8, 0, 0, TAU); cx.fill();
  cx.fillStyle = '#1a1a1a'; for(const sx of [-10, -3]) cx.fillRect(sx, -6, 3, 16);
  cx.beginPath(); cx.moveTo(-18, 2); cx.lineTo(-24, 4); cx.lineTo(-17, 5); cx.fill();
  cx.fillStyle = '#ffb020'; cx.beginPath(); cx.arc(9, 0, 6, 0, TAU); cx.fill();
  cx.fillStyle = '#ff3a3a'; cx.beginPath(); cx.arc(12, -2, 2.2, 0, TAU); cx.fill();
  cx.restore(); cx.globalAlpha = 1;
  if(!w.gone) glow(x, y, 26 * s, '#ff5a3a', .25);
}
function drawBat(b){
  const s = V.s;
  if(b.warn > 0){ const x = b.vx > 0 ? 18 : W - 18, y = SY(b.y0); cx.fillStyle = rgba('#ff5a5a', .5 + .5 * Math.sin(G.rt * 20)); cx.font = `900 ${Math.round(28 * s)}px system-ui,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('!', x, y); return; }
  const x = SX(b.x), y = SY(b.y), fl = Math.sin(b.t * 22);
  cx.save(); cx.translate(x, y); cx.scale((b.vx > 0 ? 1 : -1) * s * 1.3, s * 1.3); cx.fillStyle = '#05050c';
  cx.beginPath(); cx.moveTo(0, 0); cx.quadraticCurveTo(-14, -14 * fl - 4, -28, -6 * fl); cx.quadraticCurveTo(-18, 2, -8, 4); cx.quadraticCurveTo(0, 8, 8, 4); cx.quadraticCurveTo(18, 2, 28, -6 * fl); cx.quadraticCurveTo(14, -14 * fl - 4, 0, 0); cx.fill();
  cx.beginPath(); cx.arc(0, 0, 6, 0, TAU); cx.fill(); cx.beginPath(); cx.moveTo(-4, -4); cx.lineTo(-3, -10); cx.lineTo(0, -5); cx.lineTo(3, -10); cx.lineTo(4, -4); cx.fill();
  cx.fillStyle = '#ff4a4a'; cx.fillRect(1, -2, 2, 2); cx.restore();
}
function drawWeb(w){
  const s = V.s, x = SX(w.x), y = SY(w.y), r = w.r * s;
  cx.strokeStyle = 'rgba(220,230,255,.35)'; cx.lineWidth = 1.2;
  for(let k = 0; k < 8; k++){ const a = w.rot + k / 8 * TAU; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); cx.stroke(); }
  for(let ring = 1; ring <= 4; ring++){ const rr = r * ring / 4.3; cx.beginPath(); for(let k = 0; k <= 8; k++){ const a = w.rot + k / 8 * TAU, px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if(k === 0) cx.moveTo(px, py); else cx.quadraticCurveTo(x + Math.cos(a - TAU / 16) * rr * .85, y + Math.sin(a - TAU / 16) * rr * .85, px, py); } cx.stroke(); }
  cx.fillStyle = '#1a1420'; cx.beginPath(); cx.arc(x + r * .1, y - r * .1, 5 * s, 0, TAU); cx.fill();
  for(let k = 0; k < 6; k++){ const a = w.rot + k * 1.1; cx.fillStyle = rgba('#dff0ff', .5 + .4 * Math.sin(G.rt * 2 + k)); cx.fillRect(x + Math.cos(a) * r * .6, y + Math.sin(a) * r * .6, 2, 2); }
}

/* ---------------- the lasso ---------------- */
function drawTrail(){
  const T = G.trail; if(T.length < 2) return;
  const s = V.s, hot = G.streak >= 2, col = G.streak >= 4 ? '#ff9ae0' : hot ? '#9af0ff' : '#fff0a8';
  cx.globalCompositeOperation = 'lighter'; cx.lineCap = 'round'; cx.lineJoin = 'round';
  for(const [w, a] of [[14, .08], [7, .22], [2.5, .95]]){
    cx.strokeStyle = rgba(col, a); cx.lineWidth = w * s;
    cx.beginPath(); cx.moveTo(SX(T[0].x), SY(T[0].y)); for(let i = 1; i < T.length; i++) cx.lineTo(SX(T[i].x), SY(T[i].y)); cx.stroke();
  }
  // sparkles dance along the rope
  for(let i = 0; i < T.length; i += 4){ const p = T[i], k = i / T.length; if(Math.sin(G.rt * 9 + i) > .3){ cx.fillStyle = rgba('#ffffff', .8 * k); cx.fillRect(SX(p.x) - 1, SY(p.y) - 1, 2, 2); } }
  // the tip
  const tp = T[T.length - 1]; glow(SX(tp.x), SY(tp.y), 22 * s, col, .9);
  cx.globalCompositeOperation = 'source-over'; cx.lineCap = 'butt';
}
function drawLoopFx(){
  for(const e of G.fx){
    const k = e.t / .7, P = e.P; if(P.length < 3) continue;
    cx.globalCompositeOperation = 'lighter';
    cx.fillStyle = rgba(e.ok ? '#fff0a8' : '#8aa0c0', (e.ok ? .35 : .08) * (1 - k));
    cx.beginPath(); cx.moveTo(SX(P[0].x), SY(P[0].y)); for(const p of P) cx.lineTo(SX(p.x), SY(p.y)); cx.closePath(); cx.fill();
    if(e.ok){ cx.strokeStyle = rgba('#ffffff', .8 * (1 - k)); cx.lineWidth = (3 + k * 6) * V.s; cx.stroke(); }
    cx.globalCompositeOperation = 'source-over';
  }
  for(const sh of G.shards){ const k = sh.t / .6; cx.strokeStyle = rgba('#fff0a8', .8 * (1 - k)); cx.lineWidth = 2 * V.s; cx.beginPath(); cx.moveTo(SX(sh.x1), SY(sh.y1)); cx.lineTo(SX(sh.x2), SY(sh.y2)); cx.stroke(); }
}
function drawCaught(){
  for(const c of G.caughtFx){
    if(c.t < 0) continue;
    const k = Math.min(1, c.t / .75), e = k * k * (3 - 2 * k), x0 = SX(c.x), y0 = SY(c.y);
    const x = lerp(x0, V.jx, e) + Math.sin(k * Math.PI) * 40, y = lerp(y0, V.jy, e) - Math.sin(k * Math.PI) * 80;
    glow(x, y, 20 * (1 - k * .5) * V.s, c.col, 1); cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(x, y, 2.5, 0, TAU); cx.fill();
  }
}

/* ---------------- weather ---------------- */
const WX = Array.from({ length:110 }, () => ({ x:Math.random(), y:Math.random(), s:rnd(.6, 1.4) }));
function drawWeather(){
  const P = PLACES[placeIdx()];
  if(G.spec && G.spec.rain){ cx.strokeStyle = 'rgba(180,200,255,.35)'; cx.lineWidth = 1; for(const p of WX){ const x = ((p.x * W + G.rt * 60) % W), y = (p.y * H + G.rt * 700 * p.s) % H; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x - 3, y + 14); cx.stroke(); } }
  else if(P.snow){ cx.fillStyle = 'rgba(255,255,255,.6)'; for(const p of WX){ const x = ((p.x * W + G.rt * 20 * p.s + Math.sin(G.rt + p.y * 9) * 18 + (G.gust || 0) * G.rt * .02) % W + W) % W, y = (p.y * H + G.rt * 30 * p.s) % H; cx.fillRect(x, y, 1.8 * p.s, 1.8 * p.s); } }
  if(P.fog){ for(let i = 0; i < 4; i++){ const x = ((i * .31 + G.rt * .012 * (i + 1)) % 1.4 - .2) * W, y = H * (.45 + i * .12); const g = cx.createRadialGradient(x, y, 0, x, y, W * .35); g.addColorStop(0, rgba('#c8d8e8', P.fog * .35)); g.addColorStop(1, rgba('#c8d8e8', 0)); cx.fillStyle = g; cx.fillRect(0, 0, W, H); } }
}

/* ---------------- frame ---------------- */
function render(){
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawBg();
  const sh = G.shake || 0; cx.save(); cx.translate(rnd(-sh, sh), rnd(-sh, sh));
  for(const w of G.webs) drawWeb(w);
  drawLoopFx();
  cx.globalCompositeOperation = 'lighter';
  for(const f of G.flies) drawFly(f);
  cx.globalCompositeOperation = 'source-over';
  if(G.queen) drawQueen(G.queen);
  for(const w of G.wasps) drawWasp(w);
  for(const b of G.bats) drawBat(b);
  drawTrail();
  // sparks
  cx.globalCompositeOperation = 'lighter';
  for(const p of G.parts){ cx.globalAlpha = Math.min(1, p.l * 2); cx.fillStyle = p.c; cx.fillRect(SX(p.x) - p.s / 2, SY(p.y) - p.s / 2, p.s, p.s); }
  cx.globalAlpha = 1;
  for(const r of G.rings){ const k = r.t / .6, rr = lerp(r.r, r.R, r.inward ? k : 1 - Math.pow(1 - k, 3)) * V.s; cx.strokeStyle = rgba(r.col || '#ffffff', .5 * (1 - k)); cx.lineWidth = 2; cx.beginPath(); cx.arc(SX(r.x), SY(r.y), rr, 0, TAU); cx.stroke(); }
  cx.globalCompositeOperation = 'source-over';
  // tutorial: a ghost finger draws a loop around the nearest group
  if(G.ghost){ const g = G.ghost, k = (G.rt % 2.4) / 2.4; if(k < .8){ const a = k / .8 * TAU * 1.08, x = SX(g.x + Math.cos(a) * g.r), y = SY(g.y + Math.sin(a) * g.r); cx.strokeStyle = rgba('#ffffff', .35); cx.lineWidth = 4; cx.setLineDash([2, 10]); cx.beginPath(); for(let i = 0; i <= 40; i++){ const aa = i / 40 * a; const px = SX(g.x + Math.cos(aa) * g.r), py = SY(g.y + Math.sin(aa) * g.r); if(i === 0) cx.moveTo(px, py); else cx.lineTo(px, py); } cx.stroke(); cx.setLineDash([]); cx.font = `${Math.round(34 * V.s)}px system-ui,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('☝', x + 6, y + 18); } }
  // floating words
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(const p of G.pops){ const k = p.t / p.d, sc = k < .12 ? .5 + k / .12 * .6 : 1.1 - (k - .12) * .1; cx.globalAlpha = k > .7 ? (1 - k) / .3 : 1; const sz = Math.round(p.s * Math.max(.85, V.s) * sc); cx.font = `italic 900 ${sz}px system-ui,sans-serif`; cx.lineWidth = Math.max(3, sz * .16); cx.strokeStyle = 'rgba(5,6,24,.85)'; cx.strokeText(p.txt, SX(p.x), SY(p.y)); cx.fillStyle = p.c; cx.fillText(p.txt, SX(p.x), SY(p.y)); }
  cx.globalAlpha = 1;
  cx.restore();
  drawCaught();
  drawGrass();
  drawWeather();
  if(G.slowT > 0){ cx.fillStyle = `rgba(140,120,255,${Math.min(.16, G.slowT * .1)})`; cx.fillRect(0, 0, W, H); }
  if(G.flash > 0){ cx.fillStyle = `rgba(255,248,220,${G.flash * .5})`; cx.fillRect(0, 0, W, H); }
  if(G.mode === 'hunt' && G.state === 'play' && G.lantern < .3){ const g = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .7); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,10,${(.3 - G.lantern) * 2.4})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
}
