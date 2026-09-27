'use strict';
/* =====================================================================
   Everything is painted in code: planets are baked into sprites once
   per size (craters, seas, continents, storm bands, lava cracks), then
   lit live by the Sun with a rotating shadow.
   ===================================================================== */
const cv = $('c'), cx2 = cv.getContext('2d');
let SPR = [], SHADOW = null, BG = null, SUNSPR = null, sunKey = '', TW = [];

function mk(w, h){ const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

function resize(){
  const W = innerWidth, H = innerHeight;
  G.dpr = Math.min(devicePixelRatio || 1, G.q === 'low' ? 1 : 2);
  G.W = W; G.H = H;
  cv.width = Math.round(W * G.dpr); cv.height = Math.round(H * G.dpr);
  cv.style.width = W + 'px'; cv.style.height = H + 'px';
  const shortL = H < 520 && W > H;
  document.body.classList.toggle('shortL', shortL);
  const top = shortL ? 8 : 70, bot = shortL ? 8 : W < 640 ? 118 : 96, avH = H - top - bot, avW = W - (shortL ? 330 : 12);
  const fit = (MAX_ORB + 26) * 2;
  G.sc = Math.max(.2, Math.min(avW / fit, avH / fit) * (W < 640 && H > W ? 1.07 : 1));
  G.cx = W / 2; G.cy = top + avH / 2;
  bakeSprites(); newSky(true);
  try{ const r = $('dustBox').getBoundingClientRect(); G.dustTX = r.left + 24; G.dustTY = r.top + r.height / 2; }catch(e){ G.dustTX = W / 2; G.dustTY = 30; }
}

/* ---------------- sprites ---------------- */
function bakeSprites(){
  SPR = [];
  const px = G.sc * G.dpr;
  for(let t = 0; t <= MAXT; t++){
    const R = Math.max(10, TIERS[t].r * BS * px) * (G.q === 'low' ? 1 : 1.25);
    const sp = bakeBody(t, R); sp.halo = bakeHalo(t, R); if(TIERS[t].k === 'ringed'){ sp.ringB = bakeRing(R, true); sp.ringF = bakeRing(R, false); } SPR.push(sp);
  }
  // shared terminator shadow (dark side faces +x, rotated at draw time)
  const R = 64; SHADOW = mk(R * 2, R * 2); const s = SHADOW.getContext('2d');
  s.beginPath(); s.arc(R, R, R, 0, TAU); s.clip();
  const g = s.createLinearGradient(0, 0, R * 2, 0);
  g.addColorStop(0, 'rgba(255,245,220,.28)'); g.addColorStop(.3, 'rgba(255,245,220,0)'); g.addColorStop(.52, 'rgba(8,4,26,.1)'); g.addColorStop(.7, 'rgba(8,4,26,.72)'); g.addColorStop(1, 'rgba(6,3,20,.9)');
  s.fillStyle = g; s.fillRect(0, 0, R * 2, R * 2);
  const rim = s.createRadialGradient(R, R, R * .8, R, R, R);
  rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(0,0,10,.35)');
  s.fillStyle = rim; s.fillRect(0, 0, R * 2, R * 2);
}
// soft glows and atmospheres, baked once per tier (k = size of the halo relative to the body)
function bakeHalo(t, R){
  const T = TIERS[t], k = T.k;
  let hk, c0, a0, inner;
  if(k === 'mote' || k === 'star' || k === 'neutron' || k === 'dwarf' || k === 'lava'){ hk = k === 'mote' ? 2.6 : k === 'star' ? 2.4 : k === 'neutron' ? 3 : 1.6; c0 = T.b; a0 = k === 'lava' || k === 'dwarf' ? .25 : .5; inner = .5; }
  else if(k === 'ocean' || k === 'garden' || k === 'ice' || k === 'gas' || k === 'ringed'){ hk = 1.22; c0 = k === 'gas' || k === 'ringed' ? '#ffd9a0' : '#8fd8ff'; a0 = .4; inner = .9; }
  else return null;
  const S = Math.ceil(R * hk * 2), c = mk(S, S), g = c.getContext('2d'), h = S / 2;
  const gg = g.createRadialGradient(h, h, R * inner, h, h, h); gg.addColorStop(0, rgba(c0, a0)); gg.addColorStop(1, rgba(c0, 0));
  g.fillStyle = gg; g.fillRect(0, 0, S, S);
  return { c, hk, add:inner < .9 };
}
function bakeBody(t, R){
  const T = TIERS[t], k = T.k, pad = Math.ceil(R * .12) + 2, S = R * 2 + pad * 2;
  const c = mk(S, S), g = c.getContext('2d'), o = pad + R, rng = mulberry32(t * 7919 + 13);
  const rr = (a, b) => a + rng() * (b - a);
  g.save(); g.translate(o, o);
  if(k === 'mote'){
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, R);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(.35, T.a); gr.addColorStop(.8, T.b); gr.addColorStop(1, rgba(T.b, .0));
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
    g.restore(); return { c, o, R };
  }
  if(k === 'hole'){
    g.fillStyle = '#05020c'; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
    g.restore(); return { c, o, R };
  }
  g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip();
  const base = g.createRadialGradient(-R * .35, -R * .35, R * .1, 0, 0, R * 1.1);
  base.addColorStop(0, T.a); base.addColorStop(1, T.b);
  g.fillStyle = base; g.fillRect(-R, -R, R * 2, R * 2);
  const blob = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  const crater = (x, y, r) => {
    blob(x, y, r, 'rgba(20,15,35,.28)');
    g.strokeStyle = 'rgba(255,250,240,.28)'; g.lineWidth = Math.max(1, r * .22);
    g.beginPath(); g.arc(x - r * .12, y - r * .12, r * .9, Math.PI * .9, Math.PI * 1.75); g.stroke();
  };
  if(k === 'rock'){
    for(let i = 0; i < 18; i++) blob(rr(-R, R), rr(-R, R), rr(.1, .35) * R, rng() < .5 ? 'rgba(40,25,20,.2)' : 'rgba(255,240,220,.16)');
    for(let i = 0; i < 4; i++) crater(rr(-R * .6, R * .6), rr(-R * .6, R * .6), rr(.1, .2) * R);
  } else if(k === 'crater'){
    for(let i = 0; i < 10; i++) blob(rr(-R, R), rr(-R, R), rr(.15, .4) * R, 'rgba(30,25,50,.15)');
    for(let i = 0; i < 9; i++) crater(rr(-R * .75, R * .75), rr(-R * .75, R * .75), rr(.08, .26) * R);
  } else if(k === 'moon'){
    for(let i = 0; i < 5; i++) blob(rr(-R * .7, R * .7), rr(-R * .7, R * .7), rr(.2, .45) * R, 'rgba(90,85,110,.2)');
    for(let i = 0; i < 12; i++) crater(rr(-R * .8, R * .8), rr(-R * .8, R * .8), rr(.05, .18) * R);
  } else if(k === 'lava'){
    g.lineCap = 'round';
    for(let i = 0; i < 9; i++){
      let x = rr(-R, R), y = rr(-R, R), a = rr(0, TAU);
      g.beginPath(); g.moveTo(x, y);
      for(let s = 0; s < 7; s++){ a += rr(-.9, .9); x += Math.cos(a) * R * .18; y += Math.sin(a) * R * .18; g.lineTo(x, y); }
      g.strokeStyle = 'rgba(255,120,40,.35)'; g.lineWidth = R * .12; g.stroke();
      g.strokeStyle = '#ffb35a'; g.lineWidth = R * .04; g.stroke();
    }
    for(let i = 0; i < 6; i++){ const x = rr(-R * .7, R * .7), y = rr(-R * .7, R * .7), r = rr(.06, .14) * R, gg = g.createRadialGradient(x, y, 0, x, y, r * 2.5); gg.addColorStop(0, '#fff0a0'); gg.addColorStop(.3, '#ff8a3a'); gg.addColorStop(1, 'rgba(255,90,40,0)'); g.fillStyle = gg; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); }
  } else if(k === 'ocean' || k === 'garden'){
    for(let i = 0; i < 8; i++) blob(rr(-R, R), rr(-R, R), rr(.2, .5) * R, 'rgba(10,40,120,.18)');
    const land = k === 'garden' ? 5 : 3, lsz = k === 'garden' ? 1 : .45;
    for(let L = 0; L < land; L++){
      let x = rr(-R * .7, R * .7), y = rr(-R * .7, R * .7);
      const pts = [];
      for(let s = 0; s < 14 * lsz + 3; s++){ x += rr(-.14, .14) * R; y += rr(-.14, .14) * R; pts.push([x, y, rr(.07, .17) * R * (k === 'garden' ? 1.2 : .8)]); }
      for(const p of pts) blob(p[0], p[1], p[2] * 1.35, 'rgba(240,225,170,.85)');
      for(const p of pts) blob(p[0], p[1], p[2], k === 'garden' ? mixHex('#4fae55', '#2e7d3a', rng()) : '#d9c98f');
      if(k === 'garden') for(const p of pts) if(rng() < .3) blob(p[0] + p[2] * .2, p[1], p[2] * .5, '#8b7a55');
    }
    if(k === 'garden'){ blob(0, -R * .95, R * .35, 'rgba(250,252,255,.9)'); blob(0, R * .97, R * .3, 'rgba(250,252,255,.9)'); }
    g.lineCap = 'round';
    for(let i = 0; i < 7; i++){ const y = rr(-R * .8, R * .8), x = rr(-R, R * .3); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = rr(.05, .1) * R; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + R * .4, y + rr(-.2, .2) * R, x + rr(.5, .9) * R, y + rr(-.1, .1) * R); g.stroke(); }
  } else if(k === 'gas' || k === 'ringed' || k === 'ice' || k === 'dwarf'){
    const cols = k === 'gas' ? ['#f3c88f', '#d98a5a', '#fbe3bd', '#b86c4c', '#e9a870'] : k === 'ringed' ? ['#f6e6bd', '#d9bf8a', '#fff3d8', '#c4a676'] :
      k === 'ice' ? ['#b8f2f6', '#7fcbe0', '#dffbff', '#5aaad0'] : ['#8a4436', '#c9603e', '#5e2a2a', '#ef8a52'];
    let y = -R;
    while(y < R){
      const h = rr(.07, .2) * R; g.fillStyle = cols[(rng() * cols.length) | 0];
      g.beginPath(); g.moveTo(-R, y);
      for(let x = -R; x <= R; x += R / 6) g.lineTo(x, y + Math.sin(x / R * 5 + rng() * 2) * h * .25);
      g.lineTo(R, y + h); g.lineTo(-R, y + h); g.fill(); y += h * .85;
    }
    g.globalAlpha = .35; for(let i = 0; i < 8; i++){ g.fillStyle = cols[(rng() * cols.length) | 0]; g.beginPath(); g.ellipse(rr(-R, R), rr(-R, R), rr(.2, .5) * R, rr(.03, .07) * R, 0, 0, TAU); g.fill(); } g.globalAlpha = 1;
    if(k === 'gas'){ g.fillStyle = '#c0553e'; g.beginPath(); g.ellipse(R * .3, R * .28, R * .22, R * .12, 0, 0, TAU); g.fill(); g.fillStyle = '#e88a64'; g.beginPath(); g.ellipse(R * .3, R * .28, R * .13, R * .06, 0, 0, TAU); g.fill(); }
    if(k === 'dwarf'){ const gg = g.createRadialGradient(0, 0, 0, 0, 0, R); gg.addColorStop(0, 'rgba(255,160,90,.35)'); gg.addColorStop(1, 'rgba(255,90,60,0)'); g.fillStyle = gg; g.fillRect(-R, -R, R * 2, R * 2); }
  } else if(k === 'star' || k === 'neutron'){
    const gg = g.createRadialGradient(0, 0, 0, 0, 0, R);
    gg.addColorStop(0, '#ffffff'); gg.addColorStop(k === 'neutron' ? .5 : .25, T.b); gg.addColorStop(1, T.a);
    g.fillStyle = gg; g.fillRect(-R, -R, R * 2, R * 2);
    for(let i = 0; i < 40; i++) blob(rr(-R, R), rr(-R, R), rr(.04, .1) * R, rng() < .5 ? 'rgba(255,255,255,.18)' : rgba(T.a, .25));
  }
  g.restore();
  return { c, o, R };
}

const DOTS = new Map();
function dotSpr(col){
  let d = DOTS.get(col); if(d) return d;
  d = mk(24, 24); const g = d.getContext('2d'), gg = g.createRadialGradient(12, 12, 0, 12, 12, 12);
  gg.addColorStop(0, '#ffffff'); gg.addColorStop(.25, rgba(col, .95)); gg.addColorStop(.6, rgba(col, .25)); gg.addColorStop(1, rgba(col, 0));
  g.fillStyle = gg; g.fillRect(0, 0, 24, 24); DOTS.set(col, d); return d;
}

/* ---------------- sky ---------------- */
function newSky(keepTw){
  const W = G.W, H = G.H, d = G.dpr, sk = SKIES[save.galaxy % SKIES.length], rng = mulberry32(save.galaxy * 101 + 7);
  BG = mk(W * d, H * d); const g = BG.getContext('2d');
  const lg = g.createLinearGradient(0, 0, 0, H * d); lg.addColorStop(0, sk[3]); lg.addColorStop(1, sk[4]);
  g.fillStyle = lg; g.fillRect(0, 0, W * d, H * d);
  g.globalCompositeOperation = 'lighter';
  const M = Math.max(W, H) * d;
  for(let i = 0; i < 14; i++){
    const x = rng() * W * d, y = rng() * H * d, r = (.15 + rng() * .35) * M, col = sk[i % 3];
    const gg = g.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, rgba(col, .16 + rng() * .1)); gg.addColorStop(.6, rgba(col, .05)); gg.addColorStop(1, rgba(col, 0));
    g.fillStyle = gg; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // a soft galactic band
  g.save(); g.translate(W * d / 2, H * d / 2); g.rotate(-.5 + rng() * .3);
  const bg = g.createLinearGradient(0, -M * .2, 0, M * .2); bg.addColorStop(0, 'rgba(255,255,255,0)'); bg.addColorStop(.5, 'rgba(255,240,230,.06)'); bg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = bg; g.fillRect(-M, -M * .2, M * 2, M * .4); g.restore();
  g.globalCompositeOperation = 'source-over';
  const n = Math.round(W * H / 900);
  for(let i = 0; i < n; i++){ const a = rng(); g.fillStyle = `rgba(255,${230 + (rng() * 25) | 0},${220 + (rng() * 35) | 0},${.15 + a * .6})`; const s = (a > .96 ? 1.8 : a > .8 ? 1.2 : .7) * d; g.fillRect(rng() * W * d, rng() * H * d, s, s); }
  TW = [];
  for(let i = 0; i < 70; i++) TW.push({ x:rng() * W, y:rng() * H, p:rng() * TAU, s:.6 + rng() * 1.6, f:.5 + rng() * 2 });
  sunKey = '';
}
function bakeSun(){
  const col = sunCol(), key = col + '|' + G.sc.toFixed(3) + '|' + G.dpr;
  if(key === sunKey) return; sunKey = key;
  const R = SUN_R * G.sc * G.dpr, S = R * 7;
  SUNSPR = { glow:mk(S, S), core:mk(R * 2.4, R * 2.4), R, S };
  let g = SUNSPR.glow.getContext('2d'), gg = g.createRadialGradient(S / 2, S / 2, R * .6, S / 2, S / 2, S / 2);
  gg.addColorStop(0, rgba(col, .55)); gg.addColorStop(.25, rgba(col, .18)); gg.addColorStop(.6, rgba(col, .05)); gg.addColorStop(1, rgba(col, 0));
  g.fillStyle = gg; g.fillRect(0, 0, S, S);
  g = SUNSPR.core.getContext('2d'); const c = R * 1.2;
  gg = g.createRadialGradient(c - R * .2, c - R * .2, 0, c, c, R);
  gg.addColorStop(0, '#ffffff'); gg.addColorStop(.45, mixHex(col, '#ffffff', .6)); gg.addColorStop(.85, col); gg.addColorStop(1, mixHex(col, '#ff5a2a', .35));
  g.fillStyle = gg; g.beginPath(); g.arc(c, c, R, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(c, c, R, 0, TAU); g.clip();
  const rng = mulberry32(5);
  for(let i = 0; i < 70; i++){ g.fillStyle = rng() < .5 ? 'rgba(255,255,255,.12)' : 'rgba(255,120,40,.1)'; g.beginPath(); g.arc(c + (rng() - .5) * 2 * R, c + (rng() - .5) * 2 * R, R * (.05 + rng() * .1), 0, TAU); g.fill(); }
  g.restore();
}

/* ---------------- draw ---------------- */
function W2S(x, y){ return [G.cx + x * G.sc, G.cy + y * G.sc]; }
function render(){
  const c = cx2, d = G.dpr, W = G.W, H = G.H, t = G.rt;
  c.setTransform(d, 0, 0, d, 0, 0);
  c.drawImage(BG, 0, 0, W, H);
  // twinkles
  for(const s of TW){ const a = .25 + .75 * Math.max(0, Math.sin(t * s.f + s.p)); c.fillStyle = `rgba(255,248,230,${a * .8})`; c.fillRect(s.x, s.y, s.s, s.s); if(a > .9 && s.s > 1.6){ c.fillRect(s.x - 2, s.y + s.s / 2 - .3, 4 + s.s, .6); c.fillRect(s.x + s.s / 2 - .3, s.y - 2, .6, 4 + s.s); } }
  // world transform
  let sx = 0, sy = 0; if(G.shake > .1){ sx = rnd(-1, 1) * G.shake; sy = rnd(-1, 1) * G.shake; }
  const z = 1 + G.bump;
  c.setTransform(d * G.sc * z, 0, 0, d * G.sc * z, d * (G.cx + sx), d * (G.cy + sy));
  const s = G.sc * z;
  // orbit guides
  c.lineWidth = 1 / s;
  c.strokeStyle = 'rgba(255,240,220,.07)'; c.setLineDash([4 / s, 10 / s]);
  c.beginPath(); c.arc(0, 0, MAX_ORB + 14, 0, TAU); c.stroke();
  c.beginPath(); c.arc(0, 0, MIN_ORB - 8, 0, TAU); c.stroke();
  c.setLineDash([]);
  for(let r = 150; r < MAX_ORB; r += 90){ c.strokeStyle = 'rgba(255,240,220,.025)'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); }
  drawSun(c, s);
  // trails
  if(G.q !== 'low'){
    c.lineCap = 'round';
    for(const b of G.B){
      const tr = b.trail; if(tr.length < 6) continue;
      c.strokeStyle = rgba(TIERS[b.t].b, b.wander ? .25 : .16); c.lineWidth = Math.max(1 / s, b.r * .35);
      c.beginPath(); c.moveTo(tr[0], tr[1]); for(let i = 2; i < tr.length; i += 2) c.lineTo(tr[i], tr[i + 1]); c.lineTo(b.x, b.y); c.stroke();
    }
  }
  if(G.comet) drawComet(c, s);
  const g = G.grab;
  for(const b of G.B) drawBody(c, b, s, g);
  // grab guidance: glow on every twin, feed hint over the Sun
  if(g){
    const pulse = .5 + .5 * Math.sin(t * 8);
    for(const b of G.B){ if(b === g || b.t !== g.t || b.wander) continue; c.strokeStyle = rgba('#ffffff', .35 + pulse * .45); c.lineWidth = 2.2 / s; c.beginPath(); c.arc(b.x, b.y, b.r + 5 + pulse * 3, 0, TAU); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2 / s; c.setLineDash([5 / s, 5 / s]); c.lineDashOffset = -t * 20 / s;
    c.beginPath(); c.arc(g.x, g.y, g.r + 6, 0, TAU); c.stroke(); c.setLineDash([]);
    const ds = Math.hypot(g.x, g.y);
    if(ds < SUN_R + 120){
      const k = clamp(1 - (ds - SUN_R) / 120, 0, 1);
      c.fillStyle = `rgba(255,240,200,${.15 * k})`; c.beginPath(); c.arc(0, 0, SUN_R + 12, 0, TAU); c.fill();
      text(c, 'FEED THE SUN  +' + big(bodyInc(g) * 20 * incMul()), 0, SUN_R + 30, 13 / s, `rgba(255,236,190,${k})`);
    }
  }
  // fx
  c.globalCompositeOperation = 'lighter';
  for(const f of G.FX){
    const k = f.t / f.d;
    if(f.k === 'ring'){ c.strokeStyle = rgba(f.c, (1 - k) * .8); c.lineWidth = f.w * (1 - k) / Math.max(.5, s) + .5 / s; c.beginPath(); c.arc(f.x, f.y, lerp(f.r0, f.r1, 1 - Math.pow(1 - k, 3)), 0, TAU); c.stroke(); }
    else if(f.k === 'flash'){ const r = f.r * (.5 + k * .8), gg = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, r); gg.addColorStop(0, rgba(f.c, (1 - k) * .9)); gg.addColorStop(1, rgba(f.c, 0)); c.fillStyle = gg; c.fillRect(f.x - r, f.y - r, r * 2, r * 2); }
    else if(f.k === 'beam'){ const e = Math.min(1, k * 2); c.strokeStyle = rgba(f.c, (1 - k) * .7); c.lineWidth = 3 / s; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(lerp(f.x, f.x1, e), lerp(f.y, f.y1, e)); c.stroke(); }
  }
  for(const p of G.P){ const a = clamp(p.l, 0, 1), r = p.s * (.6 + a * .8) / Math.max(.6, s); c.globalAlpha = a; c.drawImage(dotSpr(p.c), p.x - r * 2, p.y - r * 2, r * 4, r * 4); }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  for(const f of G.TX){ const k = f.t / f.d, a = k < .15 ? k / .15 : 1 - Math.max(0, (k - .6) / .4); text(c, f.s, f.x, f.y, f.sz / s * (k < .15 ? .7 + k * 2 : 1), rgba(f.c, a)); }
  // sparkles fly to the Stardust counter
  c.setTransform(d, 0, 0, d, 0, 0);
  if(G.state === 'play'){
    c.globalCompositeOperation = 'lighter';
    for(const p of G.SP){
      const st = W2S(p.x, p.y), e = p.t * p.t, x = lerp(st[0], G.dustTX, e), y = lerp(st[1], G.dustTY, e) - Math.sin(p.t * Math.PI) * 40, r = 2.6 * (1 - p.t * .4);
      c.fillStyle = rgba(p.c, .9 - p.t * .3); c.beginPath(); c.moveTo(x, y - r * 2); c.lineTo(x + r * .5, y - r * .5); c.lineTo(x + r * 2, y); c.lineTo(x + r * .5, y + r * .5); c.lineTo(x, y + r * 2); c.lineTo(x - r * .5, y + r * .5); c.lineTo(x - r * 2, y); c.lineTo(x - r * .5, y - r * .5); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  }
  if(G.rush > 0){ c.fillStyle = `rgba(255,210,110,${.05 + .03 * Math.sin(t * 6)})`; c.fillRect(0, 0, W, H); }
}
function text(c, s, x, y, size, col){
  c.font = `800 ${size}px Nunito, "Trebuchet MS", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = size * .28; c.strokeStyle = 'rgba(20,10,40,.7)'; c.lineJoin = 'round'; c.strokeText(s, x, y);
  c.fillStyle = col; c.fillText(s, x, y);
}
function drawSun(c, s){
  bakeSun();
  const sp = SUNSPR, u = 1 / (G.sc * G.dpr), t = G.rt, R = SUN_R * (1 + G.sunHit * .06 + Math.sin(t * 1.3) * .012);
  c.globalCompositeOperation = 'lighter';
  c.drawImage(sp.glow, -sp.S / 2 * u * (1 + G.sunHit * .15), -sp.S / 2 * u * (1 + G.sunHit * .15), sp.S * u * (1 + G.sunHit * .15), sp.S * u * (1 + G.sunHit * .15));
  // corona rays
  const col = sunCol();
  c.save(); c.rotate(t * .08);
  for(let i = 0; i < 14; i++){
    const a = i / 14 * TAU, L = R * (1.5 + .35 * Math.sin(t * 1.7 + i * 2.1) + G.sunHit * .4), w = .12;
    c.fillStyle = rgba(col, .16); c.beginPath(); c.moveTo(Math.cos(a - w) * R * .9, Math.sin(a - w) * R * .9); c.lineTo(Math.cos(a) * L, Math.sin(a) * L); c.lineTo(Math.cos(a + w) * R * .9, Math.sin(a + w) * R * .9); c.fill();
  }
  c.restore();
  c.globalCompositeOperation = 'source-over';
  c.save(); c.rotate(t * .05);
  c.drawImage(sp.core, -R * 1.2, -R * 1.2, R * 2.4, R * 2.4);
  c.restore();
  // flare meter: a thin arc around the Sun
  c.strokeStyle = rgba('#fff6d8', .25); c.lineWidth = 2 / s; c.beginPath(); c.arc(0, 0, R + 7, -Math.PI / 2, -Math.PI / 2 + TAU * G.flare); c.stroke();
}
function drawBody(c, b, s, g){
  const sp = SPR[b.t]; if(!sp) return;
  const T = TIERS[b.t], k = T.k, sc = b.born > 0 ? 1 - Math.pow(b.born, 2) * .8 : 1, r = b.r * sc * (1 + b.glow * .15);
  const u = r / sp.R, x = b.x, y = b.y;
  // halo / atmosphere
  const H = sp.halo;
  if(H){ const hr = r * H.hk; if(H.add) c.globalCompositeOperation = 'lighter'; c.drawImage(H.c, x - hr, y - hr, hr * 2, hr * 2); c.globalCompositeOperation = 'source-over'; }
  if(k === 'hole'){ drawHole(c, x, y, r, s); return; }
  const tilt = -.35, ringed = k === 'ringed';
  if(ringed){ const rs = r * 5 / 2; c.drawImage(sp.ringB, x - rs, y - rs, rs * 2, rs * 2); }
  c.save(); c.translate(x, y); c.rotate(b.spin);
  c.drawImage(sp.c, -sp.o * u, -sp.o * u, sp.c.width * u, sp.c.height * u);
  c.restore();
  // sunlight
  if(k !== 'mote' && k !== 'star' && k !== 'neutron'){
    const a = Math.atan2(y, x);
    c.save(); c.translate(x, y); c.rotate(a); c.globalAlpha = k === 'dwarf' ? .55 : 1;
    c.drawImage(SHADOW, -r, -r, r * 2, r * 2); c.restore(); c.globalAlpha = 1;
    // city lights twinkle on the night side
    if(b.life >= 4){
      if(!b.city){ const rng = mulberry32(b.id * 31); b.city = []; for(let i = 0; i < 12; i++) b.city.push(rng() * 1.6 - .8, Math.sqrt(rng()) * .85); }
      c.fillStyle = '#ffe28a'; const cs = 1.6 / s, ci = b.city;
      for(let i = 0; i < ci.length; i += 2){ if(Math.sin(G.rt * 3 + i) < -.6) continue; const aa = a + ci[i], dd = ci[i + 1] * r; c.fillRect(x + Math.cos(aa) * dd - cs / 2, y + Math.sin(aa) * dd - cs / 2, cs, cs); }
    }
  }
  if(ringed){ const rs = r * 5 / 2; c.drawImage(sp.ringF, x - rs, y - rs, rs * 2, rs * 2); }
  if(k === 'neutron'){
    c.save(); c.translate(x, y); c.rotate(G.rt * 4); c.globalCompositeOperation = 'lighter';
    for(const sgn of [1, -1]){ const gg = c.createLinearGradient(0, 0, 0, sgn * r * 5); gg.addColorStop(0, 'rgba(190,240,255,.7)'); gg.addColorStop(1, 'rgba(190,240,255,0)'); c.fillStyle = gg; c.beginPath(); c.moveTo(-r * .25, 0); c.lineTo(0, sgn * r * 5); c.lineTo(r * .25, 0); c.fill(); }
    c.restore(); c.globalCompositeOperation = 'source-over';
  }
  // life ring: progress toward the next stage
  if(b.t >= LIFE_T && !b.wander){
    const pr = b.life >= LIFE.length - 1 ? 1 : b.lp / lifeTime(b.life);
    c.strokeStyle = 'rgba(140,255,180,.18)'; c.lineWidth = 2 / s; c.beginPath(); c.arc(x, y, r + 5 / s + 2, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(140,255,180,.8)'; c.beginPath(); c.arc(x, y, r + 5 / s + 2, -Math.PI / 2, -Math.PI / 2 + TAU * pr); c.stroke();
    if(b.life >= 5){ const a2 = G.rt * 1.4 + b.id, sx2 = x + Math.cos(a2) * (r + 10), sy2 = y + Math.sin(a2) * (r + 10) * .6; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(sx2, sy2, 1.8 / s + .6, 0, TAU); c.fill(); }
  }
  if(b.glow > 0){ c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,255,255,${b.glow * .5})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; }
  if(b.hl > 0 && !g){ c.strokeStyle = `rgba(255,220,255,${b.hl * .25})`; c.lineWidth = 1.5 / s; c.beginPath(); c.arc(x, y, r + 3, 0, TAU); c.stroke(); }
  if(b.wander){
    c.strokeStyle = 'rgba(160,230,255,.9)'; c.lineWidth = 2 / s; c.setLineDash([6 / s, 6 / s]); c.lineDashOffset = G.rt * 30 / s;
    c.beginPath(); c.arc(x, y, r + 9, 0, TAU); c.stroke(); c.setLineDash([]);
    text(c, 'GRAB ME!', x, y - r - 18, 12 / s, 'rgba(180,235,255,.95)');
  }
}
function bakeRing(R, back){
  const S = Math.ceil(R * 5), c = mk(S, S), g = c.getContext('2d');
  g.translate(S / 2, S / 2); drawRing(g, 0, 0, R, -.35, back);
  return c;
}
function drawRing(c, x, y, r, tilt, back){
  c.save(); c.translate(x, y); c.rotate(tilt);
  c.beginPath(); c.rect(-r * 2.4, back ? -r * 2 : 0, r * 4.8, r * 2); c.clip();
  for(const [rr, w, a] of [[1.55, .18, .55], [1.85, .22, .4], [2.1, .08, .3]]){ c.strokeStyle = `rgba(245,225,185,${a})`; c.lineWidth = r * w; c.beginPath(); c.ellipse(0, 0, r * rr, r * rr * .3, 0, 0, TAU); c.stroke(); }
  c.restore();
}
function drawHole(c, x, y, r, s){
  const t = G.rt;
  c.globalCompositeOperation = 'lighter';
  const gg = c.createRadialGradient(x, y, r * .9, x, y, r * 2.6); gg.addColorStop(0, 'rgba(255,170,90,.55)'); gg.addColorStop(.4, 'rgba(200,90,255,.18)'); gg.addColorStop(1, 'rgba(120,60,255,0)');
  c.fillStyle = gg; c.fillRect(x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
  c.save(); c.translate(x, y); c.rotate(-.3);
  for(let i = 0; i < 3; i++){ c.strokeStyle = `rgba(255,${190 - i * 40},${120 + i * 40},${.6 - i * .15})`; c.lineWidth = r * (.22 - i * .05); c.beginPath(); c.ellipse(0, 0, r * (1.5 + i * .3), r * (.42 + i * .08), 0, t * (1 + i) % TAU, t * (1 + i) % TAU + Math.PI * 1.6); c.stroke(); }
  c.restore();
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#030108'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,200,140,.8)'; c.lineWidth = 1.5 / s; c.beginPath(); c.arc(x, y, r + 1, 0, TAU); c.stroke();
}
function drawComet(c, s){
  const m = G.comet, tr = m.trail;
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  for(let i = 2; i < tr.length; i += 2){ const k = i / tr.length; c.strokeStyle = `rgba(255,${200 + k * 50 | 0},${120 + k * 80 | 0},${k * .5})`; c.lineWidth = 12 * k; c.beginPath(); c.moveTo(tr[i - 2], tr[i - 1]); c.lineTo(tr[i], tr[i + 1]); c.stroke(); }
  const p = .8 + .2 * Math.sin(G.rt * 12), gg = c.createRadialGradient(m.x, m.y, 0, m.x, m.y, 40 * p);
  gg.addColorStop(0, 'rgba(255,255,230,1)'); gg.addColorStop(.25, 'rgba(255,215,110,.8)'); gg.addColorStop(1, 'rgba(255,180,60,0)');
  c.fillStyle = gg; c.fillRect(m.x - 40, m.y - 40, 80, 80);
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = 'rgba(255,230,160,.8)'; c.lineWidth = 2 / s; c.setLineDash([4 / s, 6 / s]); c.lineDashOffset = -G.rt * 40 / s;
  c.beginPath(); c.arc(m.x, m.y, 30, 0, TAU); c.stroke(); c.setLineDash([]);
}
/* a still portrait of a tier for the codex and discovery card */
function tierIcon(t, px, locked){
  const dpr = Math.min(2, devicePixelRatio || 1), S = px * dpr, c = mk(S, S), g = c.getContext('2d');
  const R = S * .3, sp = bakeBody(t, R * 1.3), u = R / sp.R;
  g.translate(S / 2, S / 2);
  const k = TIERS[t].k;
  if(k === 'hole'){ const gg = g.createRadialGradient(0, 0, R * .9, 0, 0, R * 1.7); gg.addColorStop(0, 'rgba(255,170,90,.8)'); gg.addColorStop(1, 'rgba(160,80,255,0)'); g.fillStyle = gg; g.fillRect(-S / 2, -S / 2, S, S); g.fillStyle = '#030108'; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
    if(locked){ g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgba(120,100,190,.55)'; g.fillRect(0, 0, S, S); } return c; }
  if(k === 'mote' || k === 'star' || k === 'neutron' || k === 'dwarf' || k === 'lava'){ const gg = g.createRadialGradient(0, 0, R * .5, 0, 0, R * 1.65); gg.addColorStop(0, rgba(TIERS[t].b, .5)); gg.addColorStop(1, rgba(TIERS[t].b, 0)); g.fillStyle = gg; g.fillRect(-S / 2, -S / 2, S, S); }
  if(k === 'ringed'){ g.save(); g.rotate(-.35); g.strokeStyle = 'rgba(245,225,185,.6)'; g.lineWidth = R * .2; g.beginPath(); g.ellipse(0, 0, R * 1.5, R * .45, 0, Math.PI, TAU); g.stroke(); g.restore(); }
  g.drawImage(sp.c, -sp.o * u, -sp.o * u, sp.c.width * u, sp.c.height * u);
  if(k !== 'mote' && k !== 'star' && k !== 'neutron'){ g.save(); g.rotate(.7); g.globalAlpha = .8; g.drawImage(SHADOW, -R, -R, R * 2, R * 2); g.restore(); }
  if(k === 'ringed'){ g.save(); g.rotate(-.35); g.strokeStyle = 'rgba(245,225,185,.7)'; g.lineWidth = R * .2; g.beginPath(); g.ellipse(0, 0, R * 1.5, R * .45, 0, 0, Math.PI); g.stroke(); g.restore(); }
  if(locked){ g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgba(120,100,190,.55)'; g.fillRect(0, 0, S, S); }
  return c;
}
