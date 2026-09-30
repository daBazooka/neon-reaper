'use strict';
/* =====================================================================
   SNOWBALL EFFECT renderer. The camera zooms out as the ball grows, so
   the ball stays the same size on screen while the world shrinks away.
   ===================================================================== */
const cv = $('cv'); let cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
const V = { z:1, camX:0, camY:0, skyT:0 };
function resize(){ DPR = Math.min(window.devicePixelRatio || 1, save.opt.fx === 'low' ? 1 : 2); W = innerWidth; H = innerHeight; cv.width = W * DPR | 0; cv.height = H * DPR | 0; }
const SX = x => (x - V.camX) * V.z, SY = y => (y - V.camY) * V.z + H * .5;
const ballPx = () => W < H ? Math.min(W * .085, H * .05) : Math.min(W * .062, H * .058);

/* ---------------- sprites ---------------- */
const emoC = {};
function emoSpr(e, dark){
  const k = e + (dark ? '#' : ''); if(emoC[k]) return emoC[k];
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.font = '104px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(e, 64, 70);
  if(dark){ g.globalCompositeOperation = 'source-in'; g.fillStyle = '#1a2a44'; g.fillRect(0, 0, 128, 128); }
  return emoC[k] = c;
}
const glowC = {};
function glowSpr(c){ if(glowC[c]) return glowC[c]; const s = 64, cn = document.createElement('canvas'); cn.width = cn.height = s; const g = cn.getContext('2d'), gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, rgba(c, 1)); gr.addColorStop(.3, rgba(c, .4)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(0, 0, s, s); return glowC[c] = cn; }
function glow(x, y, r, c, a){ if(a <= 0) return; cx.globalAlpha = Math.min(1, a); cx.drawImage(glowSpr(c), x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1; }

/* ---------------- sky and far mountains (screen space) ---------------- */
const STARS = Array.from({ length:140 }, () => ({ x:Math.random(), y:Math.random(), s:Math.random() * 1.6 + .4, p:Math.random() * TAU }));
const FLAKES = Array.from({ length:70 }, () => ({ x:Math.random(), y:Math.random(), s:Math.random() * 1.2 + .5, p:Math.random() * TAU }));
function drawSky(){
  V.skyT += (G.tier - V.skyT) * .03;
  const t0 = Math.floor(V.skyT), t1 = Math.min(TIERS.length - 1, t0 + 1), k = V.skyT - t0, A = TIERS[t0], B = TIERS[t1];
  const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, mix(A.sky[0], B.sky[0], k)); g.addColorStop(1, mix(A.sky[1], B.sky[1], k));
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  const night = clamp(V.skyT - 6.8, 0, 1.5);
  if(night > 0){ for(const s of STARS){ cx.globalAlpha = night * .6 * (.6 + .4 * Math.sin(G.rt * 2 + s.p)); cx.fillStyle = '#fff'; cx.fillRect(s.x * W, s.y * H * .8, s.s, s.s); } cx.globalAlpha = 1; }
  // the sun: it grows hotter as the run goes on
  const heat = G.state === 'run' ? clamp(G.t / 120, 0, 1) : 0, sx = W * .82, sy = H * .14, sr = Math.min(W, H) * (.05 + heat * .03);
  const space = clamp(V.skyT - 7, 0, 1);
  glow(sx, sy, sr * (4 + heat * 3) * (1 - space * .5), space > .5 ? '#c8d8ff' : heat > .5 ? '#ffb040' : '#fff4c0', (.55 + heat * .3) * (1 - space * .4));
  cx.fillStyle = mix(mix('#fffbe0', '#ffc040', heat), '#ffd890', space); cx.beginPath(); cx.arc(sx, sy, sr * (1 - space * .3), 0, TAU); cx.fill();
  // far peaks drift slowly
  const far = mix(A.far, B.far, k), hill = mix(A.hill, B.hill, k), off = G.rt * 6;
  for(const [col, base, amp, sp, seed] of [[far, .52, .2, .5, 1], [hill, .66, .12, 1, 3]]){
    cx.fillStyle = col; cx.beginPath(); cx.moveTo(0, H);
    for(let x = 0; x <= W + 20; x += 20){ const u = (x + off * sp) * .004; const y = H * (base - amp * Math.abs(Math.sin(u + seed) * Math.sin(u * 1.7 + seed * 2))); cx.lineTo(x, y); }
    cx.lineTo(W, H); cx.fill();
    if(sp < 1){ cx.fillStyle = rgba('#ffffff', .55); for(let x = 0; x <= W + 20; x += 20){ const u = (x + off * sp) * .004, v = Math.abs(Math.sin(u + seed) * Math.sin(u * 1.7 + seed * 2)); if(v > .75){ const y = H * (base - amp * v); cx.fillRect(x - 6, y, 12, 4); } } }
  }
}

/* ---------------- world ---------------- */
function drawSlope(){
  const x0 = V.camX - 20 / V.z, x1 = V.camX + (W + 40) / V.z, P = G.pts;
  let i = 0; while(i < P.length - 1 && P[i + 1].x < x0) i++;
  const g = cx.createLinearGradient(0, H * .3, 0, H); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfe6f8');
  cx.fillStyle = g; cx.beginPath(); cx.moveTo(SX(P[i].x), H + 10);
  for(let j = i; j < P.length && P[j].x <= x1 + 200 / V.z; j++) cx.lineTo(SX(P[j].x), SY(P[j].y));
  cx.lineTo(W + 20, H + 10); cx.closePath(); cx.fill();
  // blue shadow band and a crisp edge
  cx.strokeStyle = 'rgba(140,190,230,.55)'; cx.lineWidth = Math.max(2, ballPx() * .12); cx.beginPath();
  for(let j = i; j < P.length && P[j].x <= x1 + 200 / V.z; j++){ const X = SX(P[j].x), Y = SY(P[j].y) + cx.lineWidth * .8; if(j === i) cx.moveTo(X, Y); else cx.lineTo(X, Y); }
  cx.stroke();
  cx.strokeStyle = '#ffffff'; cx.lineWidth = 2; cx.beginPath();
  for(let j = i; j < P.length && P[j].x <= x1 + 200 / V.z; j++){ const X = SX(P[j].x), Y = SY(P[j].y); if(j === i) cx.moveTo(X, Y); else cx.lineTo(X, Y); }
  cx.stroke();
}
function drawThing(o){
  const x = SX(o.x), s = o.s * V.z; if(x < -s || x > W + s || o.gone) return;
  const bob = o.sky ? Math.sin(G.rt * 2 + o.ph) * o.s * .06 : 0, y = SY(o.y + bob);
  if(s < 2) return;
  // too big to swallow: a red warning ring
  const big = o.s > G.R * .95 && !(G.avalT > 0 && o.s <= G.R * 3.2);
  if(big && G.state === 'run'){ glow(x, y, s * .9, '#ff5a4a', .35 + .15 * Math.sin(G.rt * 8)); }
  if(!o.sky){ cx.fillStyle = 'rgba(80,120,170,.18)'; cx.beginPath(); cx.ellipse(x, y + s * .48, s * .45, s * .08, 0, 0, TAU); cx.fill(); }
  cx.drawImage(emoSpr(o.e), x - s * .5, y - s * .55, s, s);
}
function drawCrystals(){
  for(const c of G.cry){
    if(c.got && c.gt > .3) continue;
    const x = SX(c.x), y = SY(c.y), r = G.R * .32 * V.z * (c.got ? 1 + c.gt * 3 : 1); if(x < -20 || x > W + 20) continue;
    cx.globalAlpha = c.got ? 1 - c.gt / .3 : 1;
    glow(x, y, r * 3, '#7df0ff', .6);
    cx.fillStyle = '#bff6ff'; cx.beginPath(); cx.moveTo(x, y - r); cx.lineTo(x + r * .7, y); cx.lineTo(x, y + r); cx.lineTo(x - r * .7, y); cx.fill();
    cx.fillStyle = '#ffffff'; cx.beginPath(); cx.moveTo(x, y - r); cx.lineTo(x + r * .25, y); cx.lineTo(x, y + r * .3); cx.lineTo(x - r * .25, y); cx.fill();
    cx.globalAlpha = 1;
  }
}
function drawBall(){
  const x = SX(G.x), y = SY(G.y), r = G.R * V.z;
  if(G.inv > 0 && Math.sin(G.rt * 40) > .3 && G.state === 'run') cx.globalAlpha = .5;
  // the avalanche wave behind the ball
  if(G.avalT > 0){
    // a curling wave of snow chasing the ball, fading out behind it
    const k = Math.min(1, G.avalT), h = r * (2.6 + Math.sin(G.rt * 6) * .2), back = r * 10;
    const wg = cx.createLinearGradient(x - back, 0, x + r, 0); wg.addColorStop(0, rgba('#ffffff', 0)); wg.addColorStop(.55, rgba('#f4fbff', .75 * k)); wg.addColorStop(1, rgba('#ffffff', .95 * k));
    cx.fillStyle = wg; cx.beginPath(); cx.moveTo(x - back, y + r);
    for(let i = 0; i <= 24; i++){ const u = i / 24; cx.lineTo(x - back + u * (back + r * .2), y + r - Math.pow(u, 2.2) * h - Math.sin(u * 16 + G.rt * 12) * r * .12 * u); }
    cx.quadraticCurveTo(x + r * 1.2, y + r - h * 1.05, x + r * .9, y + r - h * .55);
    cx.lineTo(x + r * .6, y + r); cx.closePath(); cx.fill();
    cx.strokeStyle = rgba('#9ad4f4', .6 * k); cx.lineWidth = Math.max(2, r * .05); cx.stroke();
    glow(x, y, r * 3, '#7df0ff', .45);
  }
  // shadow
  const gy = SY(groundAt(G.x)); cx.fillStyle = 'rgba(70,110,160,.2)'; cx.beginPath(); cx.ellipse(x, gy, r * .9, r * .18, 0, 0, TAU); cx.fill();
  // body
  const g = cx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(.6, '#e6f2fc'); g.addColorStop(1, '#9cc4e6');
  cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.fill();
  // snow texture turns with the ball
  cx.fillStyle = 'rgba(160,200,235,.35)';
  for(let i = 0; i < 7; i++){ const a = G.rot + i * 2.4, d = r * (.35 + (i % 3) * .2); cx.beginPath(); cx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * .09, 0, TAU); cx.fill(); }
  // everything you've swallowed sticks out of the surface
  for(const s of G.stuck){
    const a = s.a + G.rot, sz = Math.min(s.s, G.R * .9) * V.z * .9, d = r * .86;
    if(sz < 3) continue;
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    cx.save(); cx.translate(px, py); cx.rotate(a + Math.PI / 2); cx.drawImage(emoSpr(s.e), -sz / 2, -sz / 2, sz, sz); cx.restore();
  }
  cx.strokeStyle = 'rgba(18,48,90,.6)'; cx.lineWidth = Math.max(2, r * .055); cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.stroke();
  cx.globalAlpha = 1;
}

/* ---------------- frame ---------------- */
function render(){
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // camera: the ball stays the same size on screen; the world zooms out as it grows
  const zt = ballPx() / G.R;
  V.z = V.z === 1 && !V.init ? zt : V.z * Math.pow(zt / V.z, .08); V.init = 1;
  V.camX = G.x - W * (W < H ? .28 : .3) / V.z;
  const lookY = groundAt(G.x + W * .25 / V.z) - G.R * 3.5, want = Math.min(G.y, lookY + G.R) - G.R * .5;
  V.camY = V.camY ? lerp(V.camY, want, .12) : want;
  drawSky();
  const sh = G.shake * ballPx() * .3; cx.save(); cx.translate(rnd(-sh, sh), rnd(-sh, sh));
  drawSlope();
  for(const o of G.things) drawThing(o);
  drawCrystals();
  // particles
  for(const p of G.parts){ cx.globalAlpha = Math.min(1, p.l * 2.5); cx.fillStyle = p.c; const s = Math.max(1.5, p.s * V.z); cx.fillRect(SX(p.x) - s / 2, SY(p.y) - s / 2, s, s); }
  cx.globalAlpha = 1;
  for(const r of G.rings){ const k = r.t / .5; cx.strokeStyle = rgba('#ffffff', .8 * (1 - k)); cx.lineWidth = 4; cx.beginPath(); cx.ellipse(SX(r.x), SY(r.y), lerp(r.r, r.R, k) * V.z, lerp(r.r, r.R, k) * V.z * .3, 0, 0, TAU); cx.stroke(); }
  if(G.state !== 'title' || true) drawBall();
  // floating words
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(const p of G.pops){ const k = p.t / p.d, sc = k < .12 ? .5 + k / .12 * .6 : 1.1 - (k - .12) * .1; cx.globalAlpha = k > .7 ? (1 - k) / .3 : 1; const sz = Math.round(p.s * Math.max(.9, Math.min(W, H) / 700) * sc); cx.font = `italic 900 ${sz}px system-ui,sans-serif`; cx.lineWidth = Math.max(3, sz * .18); cx.strokeStyle = 'rgba(20,40,80,.85)'; cx.strokeText(p.txt, SX(p.x), SY(p.y)); cx.fillStyle = p.c; cx.fillText(p.txt, SX(p.x), SY(p.y)); }
  cx.globalAlpha = 1;
  cx.restore();
  // falling snow in front
  cx.fillStyle = 'rgba(255,255,255,.75)';
  for(const f of FLAKES){ const x = ((f.x * W - G.rt * 40 * f.s + Math.sin(G.rt + f.p) * 20) % W + W) % W, y = (f.y * H + G.rt * 50 * f.s) % H; cx.beginPath(); cx.arc(x, y, f.s * 1.4, 0, TAU); cx.fill(); }
  if(G.flash > 0){ cx.fillStyle = `rgba(255,255,255,${G.flash * .6})`; cx.fillRect(0, 0, W, H); }
  if(G.slowT > 0){ cx.fillStyle = `rgba(160,220,255,${Math.min(.12, G.slowT * .15)})`; cx.fillRect(0, 0, W, H); }
  // melting danger: warm edges
  if(G.state === 'run'){ const danger = clamp(1 - (G.R / G.peak - .38) / .3, 0, 1); if(danger > 0){ const g = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .7); g.addColorStop(0, 'rgba(255,120,40,0)'); g.addColorStop(1, `rgba(255,110,30,${danger * (.25 + .08 * Math.sin(G.rt * 6))})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); } }
}
