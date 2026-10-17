'use strict';
/* =====================================================================
   TOAST TO THE MOON: simulation. Side view; y grows downward, the ground
   is y = 0, altitude in meters = -y / PX. The sky column wraps left/right.
   ===================================================================== */
const GRAV = 900;
const G = {
  state:'aim', t:0, rt:0, ts:1, slowT:0, shake:0, flash:0, flashC:'#fff',
  T:null, objs:[], parts:[], texts:[], rings:[], bands:0, meter:0, meterDir:1, perfect:false,
  run:null, camY:0, camX:WORLD_W / 2, inX:0, steerX:null, jet:false, fuel:0, fuelMax:1, endT:0, demo:false, moonHit:false
};

/* ---------------- upgrade math ---------------- */
const U = id => save.up[id] || 0;
const launchV = () => (900 + 110 * U('toaster')) * (1 + bstat('launch'));
const boostV = () => 760 * (1 + .07 * U('bounce')) * (1 + bstat('boost'));
const fuelMax = () => .5 + .14 * U('jam') + bstat('fuel');
const steerA = () => 1500 + 140 * U('butter');
const glideK = () => Math.max(.55, 1 - .022 * U('butter'));
const coinMul = () => (1 + .15 * U('crumbs')) * (1 + bstat('coins'));
const magnetR = () => 40 + 22 * U('magnet');
const altM = y => Math.max(0, -y / PX);
const wrapDx = (a, b) => { let d = (a - b) % WORLD_W; if(d > WORLD_W / 2) d -= WORLD_W; if(d < -WORLD_W / 2) d += WORLD_W; return d; };

/* ---------------- the sky: generated in 100 m bands as you climb ---------------- */
function boostDensity(m){ return clamp(7 - 1.35 * Math.log2(1 + m / 60), 1.5, 7); }
function genBand(b){
  const m0 = b * 100, y0 = -m0 * PX;
  const R = () => Math.random();
  const add = (k, m, extra) => G.objs.push(Object.assign({ k, x:R() * WORLD_W, y:-(m * PX), r:22, hit:0, ph:R() * TAU, dead:false }, extra || {}));
  let n = boostDensity(m0 + 50); n = Math.floor(n) + (R() < n % 1 ? 1 : 0);
  for(let i = 0; i < n; i++){
    const m = m0 + (i + R()) * 100 / n;
    if(m < 12) continue;
    let k = 'balloon';
    if(m > 60 && m < 2500 && R() < .38) k = 'bird';
    if(m > 1800 && R() < .45) k = 'sat';
    if(m > 4000 && R() < .35) k = 'ufo';
    if(m > 4000 && k === 'balloon') k = R() < .5 ? 'sat' : 'ufo';
    add(k, m, { r:k === 'bird' ? 20 : k === 'ufo' ? 26 : 22, vx:k === 'bird' ? (R() < .5 ? -1 : 1) * rnd(40, 90) : k === 'ufo' ? rnd(-60, 60) : 0, col:pick(['#ff5a6a', '#ffd23a', '#5ac8ff', '#7be05a', '#c58bff', '#ff8ad8']) });
  }
  // coins: little arcs of crumbs
  const nc = m0 < 4000 ? 2 : 1;
  for(let i = 0; i < nc; i++){ const m = m0 + R() * 100, x = R() * WORLD_W; if(m < 8) continue; for(let j = 0; j < 5; j++) G.objs.push({ k:'coin', x:(x + j * 26) % WORLD_W, y:-(m + Math.sin(j / 4 * Math.PI) * 4) * PX, r:12, dead:false, ph:j }); }
  // jam jars refill fuel
  if(m0 > 80 && R() < .45) add('jam', m0 + R() * 100, { r:18 });
  // hazards
  if(m0 >= 700 && m0 < 4000 && R() < .55) add('storm', m0 + R() * 100, { r:46 });
  if(m0 >= 700 && m0 < 4000 && R() < .4) add('plane', m0 + R() * 100, { r:30, vx:(R() < .5 ? -1 : 1) * rnd(120, 200) });
  if(m0 >= 4000 && R() < .5) add('meteor', m0 + R() * 100, { r:22, vx:rnd(-80, 80) });
  // decorative clouds
  if(m0 >= 150 && m0 < 4000) for(let i = 0; i < 2; i++) G.objs.push({ k:'cloud', x:R() * WORLD_W, y:-(m0 + R() * 100) * PX, r:0, s:rnd(.7, 1.4), dead:false, deco:true });
}
function ensureBands(topY){
  const need = Math.ceil(altM(topY) / 100) + 2;
  while(G.bands < need){ genBand(G.bands); G.bands++; }
}

/* ---------------- run lifecycle ---------------- */
function resetSky(){
  Object.assign(G, { t:0, ts:1, slowT:0, shake:0, flash:0, objs:[], parts:[], texts:[], rings:[], bands:0, endT:0, moonHit:false, jet:false });
  G.T = { x:WORLD_W / 2, y:-24, vx:0, vy:0, rot:0, vr:0, squash:0, hitT:0, stunT:0 };
  G.camY = -260; G.camX = WORLD_W / 2;
  G.fuelMax = fuelMax(); G.fuel = G.fuelMax;
  ensureBands(-4000);
}
function toAim(){
  resetSky();
  G.state = 'aim'; G.meter = 0; G.meterDir = 1;
  G.run = { peak:0, coins:0, balloons:0, birds:0, hits:0, perfect:false, t:0 };
}
function launch(){
  if(G.state !== 'aim') return;
  const p = G.meter, perfect = p > .86;
  G.perfect = perfect;
  const v = launchV() * (.72 + .28 * p) * (perfect ? 1.12 : 1);
  G.T.vy = -v; G.T.vx = rnd(-30, 30); G.T.vr = rnd(-4, 4);
  G.state = 'fly'; G.run.perfect = perfect;
  burst(G.T.x, -10, 22, '#fff3c4', 260, 5);
  ring(G.T.x, -10, '#ffffff', 60);
  G.shake = 8;
  if(perfect){ floatText('PERFECT!', G.T.x, -80, '#ffd23a', 1.6); G.slowT = .35; if(!G.demo){ save.stats.perfect++; } }
  if(typeof AU !== 'undefined' && !G.demo){ AU.pop(perfect); }
  if(typeof UI !== 'undefined' && !G.demo) UI.onLaunch();
}

/* ---------------- update ---------------- */
function update(rdt){
  G.rt += rdt;
  if(G.slowT > 0){ G.slowT -= rdt; G.ts = lerp(G.ts, .35, Math.min(1, rdt * 14)); } else G.ts = lerp(G.ts, 1, Math.min(1, rdt * 6));
  const dt = rdt * G.ts;
  G.shake = Math.max(0, G.shake - rdt * 30); G.flash = Math.max(0, G.flash - rdt * 2);
  if(G.state === 'aim'){
    G.meter += G.meterDir * rdt * 1.25; if(G.meter > 1){ G.meter = 1; G.meterDir = -1; } if(G.meter < 0){ G.meter = 0; G.meterDir = 1; }
    if(G.demo && G.meter > .9 && Math.random() < .2) launch();
    updateFx(dt); camera(rdt); return;
  }
  if(G.state === 'fly' || G.state === 'land') fly(dt);
  updateFx(dt); camera(rdt);
}
function fly(dt){
  const T = G.T, R = G.run;
  G.t += dt; R.t += dt;
  // steering toward the pointer (or keys)
  let s = G.inX;
  if(G.steerX != null) s = clamp(wrapDx(G.steerX, T.x) / 90, -1, 1);
  if(G.demo) s = demoSteer();
  if(T.stunT > 0){ T.stunT -= dt; s *= .2; }
  T.vx += s * steerA() * dt; T.vx *= Math.exp(-3.2 * dt); T.vx = clamp(T.vx, -520, 520);
  // jam jets
  const jetting = (G.jet || (G.demo && demoJet())) && G.fuel > 0 && G.state === 'fly';
  if(jetting){ G.fuel = Math.max(0, G.fuel - dt); T.vy -= 1500 * dt; if(Math.random() < dt * 60) G.parts.push({ x:T.x + rnd(-6, 6), y:T.y + 22, vx:rnd(-40, 40), vy:rnd(160, 260), life:0, max:.4, c:pick(['#ff3d5a', '#ff7a4a', '#ffd23a']), sz:rnd(4, 8) }); }
  G.jetOn = jetting;
  T.vy += GRAV * (T.vy > 0 ? glideK() : 1) * dt;
  T.vy = clamp(T.vy, -3800, 900);
  T.x = ((T.x + T.vx * dt) % WORLD_W + WORLD_W) % WORLD_W; T.y += T.vy * dt;
  T.rot += T.vr * dt; T.vr *= Math.exp(-1.2 * dt);
  T.squash = Math.max(0, T.squash - dt * 4);
  const m = altM(T.y);
  if(m > R.peak){
    const z0 = zoneAt(R.peak), z1 = zoneAt(m);
    R.peak = m;
    if(z1 > z0 && !G.demo && typeof UI !== 'undefined') UI.zone(z1);
    if(m >= MOON && !G.moonHit){ G.moonHit = true; G.slowT = 1.6; G.flash = .8; G.flashC = '#fffbe0'; if(!G.demo && typeof UI !== 'undefined') UI.moon(); }
  }
  ensureBands(T.y - 3000);
  // collisions
  for(const o of G.objs){
    if(o.dead || o.deco) continue;
    if(o.vx){ o.x = ((o.x + o.vx * dt) % WORLD_W + WORLD_W) % WORLD_W; }
    if(o.k === 'meteor') o.y += 160 * dt;
    if(o.hit > 0) o.hit -= dt;
    const dx = wrapDx(o.x, T.x), dy = o.y - T.y;
    if(o.k === 'coin'){ const d = Math.hypot(dx, dy); if(d < magnetR() + 16){ o.x = ((o.x - dx * Math.min(1, dt * 9)) % WORLD_W + WORLD_W) % WORLD_W; o.y -= dy * Math.min(1, dt * 9); } if(d < 26){ o.dead = true; R.coins += coinMul(); if(!G.demo){ save.stats.coins += 0; if(typeof AU !== 'undefined') AU.coin(); } } continue; }
    if(dx * dx + dy * dy > (o.r + 20) * (o.r + 20) || o.hit > 0) continue;
    hitObj(o);
  }
  if(G.objs.length > 600) G.objs = G.objs.filter(o => !o.dead && o.y < T.y + 1400);
  // end of the run: falling well below your peak, or back on the grass
  if(G.state === 'fly'){
    const fallLim = Math.max(25, R.peak * .22);
    if((T.vy > 0 && m < R.peak - fallLim) || (T.vy > 0 && T.y >= -12)){ G.state = 'land'; G.endT = 0; }
  } else {
    G.endT += dt;
    if(G.endT > 1.1 && G.state === 'land'){ G.state = 'done'; if(typeof UI !== 'undefined' && !G.demo) UI.runOver(); else if(G.demo) setTimeout(() => { if(G.demo) toAim(); }, 600); }
  }
  if(T.y > -12){ T.y = -12; T.vy = 0; }
}
function hitObj(o){
  const T = G.T, R = G.run;
  o.hit = .35;
  const boost = (mul, label) => {
    const v = boostV() * mul;
    T.vy = Math.min(T.vy * .3, -v); T.squash = 1; T.vr = rnd(-8, 8);
    R.hits++; burst(o.x, o.y, 14, o.col || '#ffffff', 260, 4); ring(o.x, o.y, '#ffffff', 46);
    if(label) floatText(label, o.x, o.y - 30, '#ffffff', 1);
    G.shake = Math.max(G.shake, 4);
    if(R.hits % 10 === 0){ floatText(R.hits + ' BOUNCES!', T.x, T.y - 70, '#ffd23a', 1.4); if(typeof AU !== 'undefined' && !G.demo) AU.combo(R.hits / 10); }
  };
  if(o.k === 'balloon'){ o.dead = true; R.balloons++; boost(1, 'POP!'); if(typeof AU !== 'undefined' && !G.demo) AU.balloon(R.hits); }
  else if(o.k === 'bird'){ R.birds++; boost(1.2, 'BOING!'); o.vx = -o.vx * 1.5; if(typeof AU !== 'undefined' && !G.demo) AU.bird(); }
  else if(o.k === 'sat'){ boost(1.3, 'CLANG!'); o.dead = true; if(typeof AU !== 'undefined' && !G.demo) AU.clang(); }
  else if(o.k === 'ufo'){ boost(1.6, 'ZOOM!'); o.dead = true; G.flash = .3; G.flashC = '#7df0ff'; if(typeof AU !== 'undefined' && !G.demo) AU.ufo(); }
  else if(o.k === 'jam'){ o.dead = true; G.fuel = G.fuelMax; floatText('JAM REFILL!', o.x, o.y - 30, '#ff3d5a', 1); burst(o.x, o.y, 12, '#ff3d5a', 200, 4); if(typeof AU !== 'undefined' && !G.demo) AU.jam(); }
  else if(o.k === 'storm'){ T.vy = Math.max(T.vy * .45, T.vy + 260); T.stunT = .6; floatText('ZAP!', o.x, o.y - 40, '#fff36b', 1.1); G.flash = .25; G.flashC = '#fff36b'; G.shake = 10; if(typeof AU !== 'undefined' && !G.demo) AU.zap(); }
  else if(o.k === 'plane' || o.k === 'meteor'){ T.vy = Math.max(T.vy, 260); T.vx += Math.sign(wrapDx(T.x, o.x)) * 260; T.stunT = .5; o.dead = o.k === 'meteor'; floatText('OUCH!', T.x, T.y - 40, '#ff5a6a', 1.1); G.shake = 12; burst(T.x, T.y, 16, '#ffb13a', 260, 5); if(typeof AU !== 'undefined' && !G.demo) AU.ouch(); }
}
function camera(rdt){
  const T = G.T;
  const aimY = typeof R !== 'undefined' && R.s ? -.2 * R.H / R.s : -260;
  const ty = G.state === 'aim' ? aimY : Math.min(aimY, T.y - 40);
  G.camY = lerp(G.camY, ty, Math.min(1, rdt * (G.state === 'fly' ? 7 : 3)));
  G.camX = T.x;
}

/* ---------------- demo / test pilot ---------------- */
function demoTarget(){
  const T = G.T, reach = (T.vy < 0 ? T.vy * T.vy / (2 * GRAV) : 0) + 60;
  let best = null, bs = 1e9;
  for(const o of G.objs){
    if(o.dead || o.deco || o.k === 'coin' || o.k === 'storm' || o.k === 'plane' || o.k === 'meteor') continue;
    const dy = T.y - o.y; if(dy < 10 || dy > reach + (G.fuel > 0 ? 300 : 0)) continue;
    const dx = Math.abs(wrapDx(o.x, T.x)), sc = dx * 1.4 + dy * .3 + (o.k === 'jam' && G.fuel > .3 * G.fuelMax ? 400 : 0);
    if(sc < bs){ bs = sc; best = o; }
  }
  return best;
}
function demoSteer(){ const o = demoTarget(); if(!o) return 0; return clamp(wrapDx(o.x, G.T.x) / 60, -1, 1); }
function demoJet(){ const T = G.T; if(T.vy < -250) return false; const o = demoTarget(); if(!o) return true; const reach = T.vy < 0 ? T.vy * T.vy / (2 * GRAV) : 0; return reach < T.y - o.y + 20; }

/* ---------------- effects ---------------- */
function updateFx(dt){
  for(let i = G.parts.length - 1; i >= 0; i--){ const p = G.parts[i]; p.life += dt; if(p.life >= p.max){ G.parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .93; p.vy *= .93; }
  if(G.parts.length > 500) G.parts.splice(0, G.parts.length - 500);
  for(let i = G.texts.length - 1; i >= 0; i--){ const t = G.texts[i]; t.life += dt; t.y -= dt * 50; if(t.life > t.max) G.texts.splice(i, 1); }
  for(let i = G.rings.length - 1; i >= 0; i--){ const r = G.rings[i]; r.life += dt; if(r.life > r.max) G.rings.splice(i, 1); }
}
function burst(x, y, n, col, sp, sz){ for(let i = 0; i < n; i++){ const a = Math.random() * TAU, s = rnd(.2, 1) * sp; G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, life:0, max:rnd(.3, .7), c:col, sz:rnd(sz * .5, sz) }); } }
function ring(x, y, col, r){ G.rings.push({ x, y, col, r, life:0, max:.4 }); }
function floatText(txt, x, y, col, size){ G.texts.push({ txt, x, y, col, size:size || 1, life:0, max:.9 }); if(G.texts.length > 24) G.texts.shift(); }
function runEarnings(){ const R = G.run; return Math.round(R.coins + R.peak * .5 * coinMul()); }
