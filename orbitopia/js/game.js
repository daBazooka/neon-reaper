'use strict';
/* =====================================================================
   ORBITOPIA simulation
   - Bodies orbit the Sun. An "orbit assist" gently rounds every orbit
     so the system is calm, but a flung body flies free for a moment.
   - Two bodies of the same tier that touch merge into the next tier.
   - Every body earns Stardust every second. Life grows on big worlds.
   ===================================================================== */
const BS = 1.15;                         // body size scale
const G = {
  state:'boot', t:0, rt:0, B:[], P:[], FX:[], SP:[], TX:[],
  inc:0, combo:0, comboT:0, rush:0, storm:0, flare:1,
  grab:null, ptr:{ x:0, y:0, wx:0, wy:0, vx:0, vy:0, down:false, t:0, moved:0 },
  chargeT:0, droneT:0, starT:0, cometT:40, wandT:150, comet:null,
  shake:0, bump:0, slow:0, q:'high', sc:1, cx:0, cy:0, W:0, H:0, dpr:1, nid:1,
  away:null, lastSave:0, sunHit:0, full:0,
};

/* ---------------- economy ---------------- */
const tierInc = t => Math.pow(3, t);
const bodyInc = b => tierInc(b.t) * (b.t >= LIFE_T ? LIFE[b.life].m : 1);
function incMul(){
  return (1 + .25 * save.up.lens) * (1 + .5 * save.perks.heart) * (1 + .1 * save.sunLvl) * (G.rush > 0 ? 3 : 1);
}
function calcIncome(){ let s = 0; for(const b of G.B) if(!b.wander) s += bodyInc(b); return s * incMul(); }
const capacity = () => 12 + save.up.slots + 3 * save.perks.vast;
const maxCharges = () => 5 + save.up.mag;
const chargeTime = () => 4 * Math.pow(.93, save.up.reactor);
const launchTier = () => Math.min(save.up.forge, MAXT - 2);
const forgeCap = () => Math.min(9, 3 + 2 * save.galaxy);
const kinPow = () => (save.up.kin ? 3 + 3 * save.up.kin : 0) * (1 + .5 * save.perks.reson) + (G.storm > 0 ? 40 : 0);
const droneEvery = () => save.up.drone ? 20 * Math.pow(.88, save.up.drone - 1) : Infinity;
const cometEvery = () => 80 * Math.pow(.9, save.up.comet) / (1 + .4 * save.perks.tamer);
const awayRate = () => Math.min(1, .25 + .08 * save.up.archive + .15 * save.perks.deep);
const awayCap = () => (2 + save.up.archive + 2 * save.perks.deep) * 3600;
const sunNeed = l => Math.ceil(12 * Math.pow(1.6, l));
const NOVA_K = 2e11;
const essenceGain = () => Math.floor(Math.sqrt(save.earnedG / NOVA_K));
const bodyCount = () => { let n = 0; for(const b of G.B) if(!b.wander) n++; return n; };

function gain(n, x, y, show){
  if(!(n > 0)) return;
  save.dust += n; save.earnedG += n; save.earnedAll += n;
  if(show && x !== undefined) floatText('+' + big(n), x, y, '#ffe39a');
}

/* ---------------- bodies ---------------- */
function mkBody(t, x, y, vx, vy){
  const r = TIERS[t].r * BS;
  return { id:G.nid++, t, x, y, vx:vx || 0, vy:vy || 0, r, spin:rnd(0, TAU), spd:rnd(-.6, .6) / (1 + t * .15), free:0,
    life:0, lp:0, trail:[], trT:0, emitT:rnd(0, 3), born:0, glow:0, wander:false, hl:0 };
}
function circVel(x, y){
  const r = Math.max(1, Math.hypot(x, y)), v = Math.sqrt(GM / r);
  return [-y / r * v, x / r * v];       // counter-clockwise on screen
}
function clampOrbit(x, y, pad){
  const r = Math.hypot(x, y) || 1, rr = clamp(r, MIN_ORB + pad, MAX_ORB);
  return [x / r * rr, y / r * rr];
}
function addBody(t, x, y, circ){
  const b = mkBody(t, x, y);
  if(circ){ const v = circVel(x, y); b.vx = v[0]; b.vy = v[1]; }
  G.B.push(b); return b;
}
function randomOrbitPos(t){
  const r = TIERS[t].r * BS;
  for(let k = 0; k < 20; k++){
    const a = rnd(0, TAU), d = rnd(MIN_ORB + r + 6, MAX_ORB - r), x = Math.cos(a) * d, y = Math.sin(a) * d;
    let ok = true; for(const o of G.B) if(Math.hypot(o.x - x, o.y - y) < o.r + r + 8){ ok = false; break; }
    if(ok) return [x, y];
  }
  const a = rnd(0, TAU), d = rnd(MIN_ORB + 20, MAX_ORB - 10); return [Math.cos(a) * d, Math.sin(a) * d];
}
function seedBody(t, fromX, fromY){
  if(bodyCount() >= capacity()) return null;
  const p = randomOrbitPos(t), b = addBody(t, p[0], p[1], true);
  b.born = 1;
  if(fromX !== undefined) beam(fromX, fromY, b.x, b.y, TIERS[t].b);
  burst(b.x, b.y, TIERS[t].a, 10, 90);
  return b;
}
function packBodies(){
  if(G.state === 'boot' || G.demo) return;
  save.bodies = G.B.filter(b => !b.wander).map(b => [b.t, Math.round(b.x), Math.round(b.y), Math.round(b.vx), Math.round(b.vy), b.life, Math.round(b.lp)]);
}
function unpackBodies(){
  G.B = [];
  for(const a of save.bodies){
    if(!Array.isArray(a) || !(a[0] >= 0 && a[0] <= MAXT)) continue;
    const p = clampOrbit(+a[1] || 100, +a[2] || 0, 4), b = addBody(a[0] | 0, p[0], p[1], true);
    b.life = clamp(a[5] | 0, 0, LIFE.length - 1); b.lp = +a[6] || 0;
  }
}

/* ---------------- feedback helpers ---------------- */
function burst(x, y, col, n, sp, big2){
  if(G.q === 'low') n = Math.ceil(n / 2);
  for(let i = 0; i < n; i++){
    const a = rnd(0, TAU), s = rnd(.2, 1) * sp;
    G.P.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, l:rnd(.5, 1.1) * (big2 ? 1.6 : 1), l0:1, c:col, s:rnd(1.5, 3.5) * (big2 ? 1.5 : 1) });
  }
  if(G.P.length > 700) G.P.splice(0, G.P.length - 700);
}
function ring(x, y, col, r0, r1, d, w){ G.FX.push({ k:'ring', x, y, c:col, r0, r1, t:0, d, w:w || 3 }); }
function flash(x, y, col, r, d){ G.FX.push({ k:'flash', x, y, c:col, r, t:0, d }); }
function beam(x0, y0, x1, y1, col){ G.FX.push({ k:'beam', x:x0, y:y0, x1, y1, c:col, t:0, d:.45 }); }
function floatText(s, x, y, col, size){ if(!save.opt.nums && !size) return; G.TX.push({ s, x, y, c:col, t:0, d:1.1, sz:size || 13 }); if(G.TX.length > 40) G.TX.shift(); }
function shake(k){ if(save.opt.shake) G.shake = Math.min(14, G.shake + k); }

/* ---------------- merging ---------------- */
function merge(a, b){
  const t = a.t + 1, ma = a.r * a.r, mb = b.r * b.r, m = ma + mb;
  let x = (a.x * ma + b.x * mb) / m, y = (a.y * ma + b.y * mb) / m;
  const grabbed = G.grab === a || G.grab === b;
  if(grabbed){ const g = G.grab; x = g.x; y = g.y; }
  const n = mkBody(t, x, y, (a.vx * ma + b.vx * mb) / m, (a.vy * ma + b.vy * mb) / m);
  n.life = Math.max(a.life, b.life); n.lp = Math.max(a.lp, b.lp); n.free = Math.max(a.free, b.free);
  n.glow = 1; n.born = .35;
  a.dead = b.dead = true;
  G.B.push(n);
  if(grabbed) G.grab = n;
  if(a.wander || b.wander){ save.stats.wanders++; ev('wander', 1); toast('WANDERER CAUGHT', 'A free ' + TIERS[a.t].n + ' joined your system!', '#9fe3ff'); }
  // combo
  G.combo = G.comboT > 0 ? G.combo + 1 : 1; G.comboT = 1.6;
  save.stats.merges++; save.stats.maxCombo = Math.max(save.stats.maxCombo, G.combo);
  const reward = tierInc(t) * 3 * incMul() * (1 + .25 * (G.combo - 1));
  gain(reward, x, y - n.r - 6, true);
  if(G.combo >= 2) floatText('COMBO x' + G.combo, x, y + n.r + 16, G.combo >= 5 ? '#ff9ad5' : '#9fe3ff', 16 + Math.min(10, G.combo));
  ev('merge', 1); ev('make', t); ev('combo', G.combo); tutEv('merge');
  // juice
  const col = TIERS[t].b;
  flash(x, y, '#ffffff', n.r * 2.4, .35);
  ring(x, y, col, n.r, n.r * 4 + t * 4, .6, 3 + t * .3);
  burst(x, y, TIERS[t].a, 14 + t * 2, 80 + t * 12);
  burst(x, y, '#ffffff', 6, 140);
  shake(1.5 + t * .35); G.bump = Math.min(.035, G.bump + .006 + t * .0015);
  AU.merge(t, G.combo);
  // discovery
  if(!save.disc[t]){ save.disc[t] = true; G.discQ = t; }
  if(t > save.topG){
    save.topG = t;
    if(save.disc[t] && G.discQ !== t) toast('NEW IN THIS GALAXY', TIERS[t].n, TIERS[t].b);
  }
  persist();
}

/* ---------------- physics ---------------- */
function physics(dt){
  const B = G.B, kin = kinPow(), g = G.grab, P = G.ptr;
  for(const b of B){
    if(b.dead) continue;
    b.spin += b.spd * dt; if(b.born > 0) b.born = Math.max(0, b.born - dt * 2.2); if(b.glow > 0) b.glow = Math.max(0, b.glow - dt * 1.5);
    if(b === g){
      const tx = P.wx, ty = P.wy;
      b.vx = clamp((tx - b.x) * 22, -2200, 2200); b.vy = clamp((ty - b.y) * 22, -2200, 2200);
      b.x += b.vx * dt; b.y += b.vy * dt; continue;
    }
    if(b.wander){ b.x += b.vx * dt; b.y += b.vy * dt; continue; }
    const r = Math.hypot(b.x, b.y) || 1, ux = b.x / r, uy = b.y / r;
    // gravity
    const a = GM / (r * r); b.vx -= ux * a * dt; b.vy -= uy * a * dt;
    // orbit assist: ease toward a round orbit (flung bodies fly free for a moment)
    if(b.free > 0) b.free -= dt;
    const vc = Math.sqrt(GM / r), k = Math.min(1, (b.free > 0 ? .1 : 1.1) * dt);
    b.vx += (-uy * vc - b.vx) * k; b.vy += (ux * vc - b.vy) * k;
    // the Sun's warm breath keeps bodies out; the outer rim pulls them back
    const lo = MIN_ORB + b.r * .4;
    if(r < lo){ const p = (lo - r) * 14 * dt; b.vx += ux * p * 20; b.vy += uy * p * 20; b.x += ux * p; b.y += uy * p; }
    if(r > MAX_ORB){ const p = (r - MAX_ORB) * 6 * dt; b.vx -= ux * p * 12; b.vy -= uy * p * 12; b.x -= ux * p; b.y -= uy * p; }
    b.x += b.vx * dt; b.y += b.vy * dt;
  }
  // kinship: twins drift toward each other
  if(kin > 0){
    for(let i = 0; i < B.length; i++){
      const a = B[i]; if(a.dead || a.wander || a.t >= MAXT) continue;
      for(let j = i + 1; j < B.length; j++){
        const b = B[j]; if(b.dead || b.t !== a.t || b.wander) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        const f = kin * dt / d * Math.min(1, 260 / d + .25);
        if(a !== g){ a.vx += dx * f; a.vy += dy * f; a.hl = Math.max(a.hl, .5); }
        if(b !== g){ b.vx -= dx * f; b.vy -= dy * f; b.hl = Math.max(b.hl, .5); }
      }
    }
  }
  // collisions
  for(let i = 0; i < B.length; i++){
    const a = B[i]; if(a.dead) continue;
    for(let j = i + 1; j < B.length; j++){
      const b = B[j]; if(b.dead) continue;
      const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
      if(d2 >= rr * rr) continue;
      if(a.t === b.t && a.t < MAXT && !(a.wander && b.wander) && G.state === 'play'){ merge(a, b); break; }
      const d = Math.sqrt(d2) || .01, nx = dx / d, ny = dy / d, over = rr - d;
      const ma = a === g ? 1e9 : a.r * a.r, mb = b === g ? 1e9 : b.r * b.r, im = 1 / ma + 1 / mb;
      a.x -= nx * over * (1 / ma) / im; a.y -= ny * over * (1 / ma) / im;
      b.x += nx * over * (1 / mb) / im; b.y += ny * over * (1 / mb) / im;
      const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if(rv < 0){
        const jj = -(1.5 * rv) / im;
        a.vx -= jj * nx / ma; a.vy -= jj * ny / ma; b.vx += jj * nx / mb; b.vy += jj * ny / mb;
        if(-rv > 60){ AU.bonk(Math.min(1, -rv / 400), Math.min(a.t, b.t)); burst(a.x + nx * a.r, a.y + ny * a.r, '#ffffff', 3, 60); }
        if(a.wander && b === g){ a.vx *= .5; a.vy *= .5; }
      }
    }
  }
  if(B.some(b => b.dead)) G.B = B.filter(b => !b.dead);
}

/* ---------------- main update ---------------- */
function update(rdt){
  G.rt += rdt;
  if(G.slow > 0) G.slow -= rdt;
  const dt = rdt * (G.slow > 0 ? .35 : 1);
  G.t += dt;
  // two physics sub-steps keep fast flings honest
  physics(dt / 2); physics(dt / 2);
  G.inc = calcIncome();
  if(G.state === 'play'){
    gain(G.inc * rdt);
    save.stats.play += rdt;
    // charges
    const mc = maxCharges();
    if(save.charges < mc){ G.chargeT += rdt; const ct = chargeTime(); if(G.chargeT >= ct){ G.chargeT -= ct; save.charges++; } } else G.chargeT = 0;
    // drones
    G.droneT += rdt;
    if(G.droneT >= droneEvery()){ G.droneT = 0; if(bodyCount() < capacity()){ const a = rnd(0, TAU); const b = seedBody(launchTier(), Math.cos(a) * (MAX_ORB + 60), Math.sin(a) * (MAX_ORB + 60)); if(b) AU.seed(); } }
    // starfarers send gifts
    let sf = 0; for(const b of G.B) if(b.life >= 5) sf++;
    if(sf){ G.starT += rdt * sf; if(G.starT >= 25){ G.starT = 0; const src = G.B.find(b => b.life >= 5); if(src && seedBody(launchTier(), src.x, src.y)){ AU.seed(); floatText('A GIFT FROM YOUR STARFARERS', src.x, src.y - src.r - 18, '#9fffc8', 12); } } }
    // life
    const gen = 1 + .6 * save.perks.genesis;
    for(const b of G.B){
      if(b.t < LIFE_T || b.wander || b.life >= LIFE.length - 1) continue;
      b.lp += rdt * gen;
      if(b.lp >= lifeTime(b.life)){
        b.lp = 0; b.life++; ev('life', b.life);
        toast('LIFE EVOLVED', `<b>${LIFE[b.life].n}</b> on your ${TIERS[b.t].n}. Income x${LIFE[b.life].m}`, '#8dffb0');
        burst(b.x, b.y, '#8dffb0', 16, 90); ring(b.x, b.y, '#8dffb0', b.r, b.r * 3, .7); AU.life(b.life);
      }
    }
    // combo, boosts, flare
    if(G.comboT > 0){ G.comboT -= rdt; if(G.comboT <= 0) G.combo = 0; }
    if(G.rush > 0) G.rush -= rdt;
    if(G.storm > 0) G.storm -= rdt;
    G.flare = Math.min(1, G.flare + rdt * .2);
    // events
    G.cometT -= rdt; if(G.cometT <= 0 && !G.comet){ spawnComet(); G.cometT = cometEvery() * rnd(.75, 1.3); }
    G.wandT -= rdt; if(G.wandT <= 0){ G.wandT = rnd(140, 220); spawnWanderer(); }
    updComet(rdt);
    // autosave
    G.lastSave += rdt; if(G.lastSave > 8){ G.lastSave = 0; writeSave(); }
    if(G.discQ !== undefined && G.discQ !== null){ const t = G.discQ; G.discQ = null; showDiscovery(t); }
  }
  // wanderers leave if not caught
  for(const b of G.B) if(b.wander && Math.hypot(b.x, b.y) > MAX_ORB + 400) b.dead = true;
  // trails, emits
  for(const b of G.B){
    b.hl = Math.max(0, b.hl - rdt * 2);
    b.trT += rdt;
    if(b.trT > .06){ b.trT = 0; b.trail.push(b.x, b.y); if(b.trail.length > 36) b.trail.splice(0, 2); }
    if(G.state === 'play' && !b.wander){ b.emitT -= rdt; if(b.emitT <= 0){ b.emitT = 2.2 + Math.random(); G.SP.push({ x:b.x, y:b.y, t:0, c:TIERS[b.t].a }); } }
  }
  if(G.SP.length > 60) G.SP.splice(0, G.SP.length - 60);
  // particles & fx
  for(const p of G.P){ p.x += p.vx * rdt; p.y += p.vy * rdt; p.vx *= .96; p.vy *= .96; p.l -= rdt; }
  G.P = G.P.filter(p => p.l > 0);
  for(const f of G.FX) f.t += rdt; G.FX = G.FX.filter(f => f.t < f.d);
  for(const f of G.TX){ f.t += rdt; f.y -= 26 * rdt; } G.TX = G.TX.filter(f => f.t < f.d);
  for(const s of G.SP) s.t += rdt * 1.4; G.SP = G.SP.filter(s => s.t < 1);
  G.shake *= Math.pow(.02, rdt); G.bump *= Math.pow(.01, rdt); G.sunHit = Math.max(0, G.sunHit - rdt * 3);
  if(G.full > 0) G.full -= rdt;
}

/* ---------------- sun, feeding ---------------- */
function tapSun(){
  const k = G.flare; G.flare = Math.max(.1, G.flare - .15);
  const n = Math.max(1, G.inc * (.5 + .2 * save.up.tap)) * (.25 + .75 * k);
  gain(n, rnd(-20, 20), -SUN_R - 10, true);
  save.stats.taps++; ev('tap', 1);
  G.sunHit = 1; burst(rnd(-20, 20), rnd(-20, 20), sunCol(), 8, 160); ring(0, 0, sunCol(), SUN_R, SUN_R * 1.9, .45, 2);
  AU.sunTap(k);
}
function feedSun(b){
  b.dead = true; G.B = G.B.filter(o => !o.dead);
  const n = bodyInc(b) * 20 * incMul();
  gain(n, 0, -SUN_R - 20, true);
  save.sunXp += Math.pow(2, b.t); save.stats.feeds++; ev('feed', 1);
  let up = 0;
  while(save.sunXp >= sunNeed(save.sunLvl)){ save.sunXp -= sunNeed(save.sunLvl); save.sunLvl++; up++; }
  flash(0, 0, '#ffffff', SUN_R * 2, .4); ring(0, 0, sunCol(), SUN_R, SUN_R * 3.2, .8, 4); burst(0, 0, TIERS[b.t].a, 20, 150);
  shake(3); AU.feed(b.t);
  if(up){ toast('THE SUN GROWS', `Sun level <b>${save.sunLvl}</b>: +${save.sunLvl * 10}% Stardust`, '#ffd36b'); AU.sunUp(); ring(0, 0, '#ffe7a0', SUN_R, SUN_R * 6, 1.2, 6); }
  persist();
}
function sunCol(){ const s = SKIES[save.galaxy % SKIES.length][5]; return mixHex(s, '#ffffff', Math.min(.6, save.sunLvl * .03)); }

/* ---------------- comets & wanderers ---------------- */
const COMET_KIND = [
  { id:'dust',  w:4, n:'STARDUST SHOWER', d:'A fortune in Stardust!' },
  { id:'rush',  w:3, n:'STAR RUSH',       d:'Triple Stardust for 30 s!' },
  { id:'seed',  w:2, n:'METEOR GIFT',     d:'Free bodies and full charges!' },
  { id:'storm', w:2, n:'KINSHIP STORM',   d:'Twins rush together for 20 s!' },
];
function spawnComet(){
  const a = rnd(0, TAU), R = MAX_ORB + 160, x = Math.cos(a) * R, y = Math.sin(a) * R;
  const ta = a + Math.PI + rnd(-.5, .5), sp = rnd(95, 125);
  G.comet = { x, y, vx:Math.cos(ta) * sp, vy:Math.sin(ta) * sp, t:0, trail:[] };
  AU.comet();
  hint('comet', 'A <b>golden comet</b>! Tap it before it flies away.');
}
function updComet(dt){
  const c = G.comet; if(!c) return;
  c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt;
  c.trail.push(c.x, c.y); if(c.trail.length > 60) c.trail.splice(0, 2);
  if(Math.random() < .5) G.P.push({ x:c.x, y:c.y, vx:rnd(-20, 20), vy:rnd(-20, 20), l:.8, l0:1, c:'#ffe08a', s:rnd(1.5, 3) });
  if(c.t > 9 || Math.hypot(c.x, c.y) > MAX_ORB + 400) G.comet = null;
}
function catchComet(){
  const c = G.comet; if(!c) return;
  G.comet = null;
  const tot = COMET_KIND.reduce((s, k) => s + k.w, 0); let r = Math.random() * tot, k = COMET_KIND[0];
  for(const q of COMET_KIND){ r -= q.w; if(r <= 0){ k = q; break; } }
  if(k.id === 'dust') gain(Math.max(50, G.inc * rnd(30, 60)), c.x, c.y, true);
  if(k.id === 'rush') G.rush = 30;
  if(k.id === 'storm') G.storm = 20;
  if(k.id === 'seed'){ save.charges = maxCharges(); for(let i = 0; i < 3; i++) seedBody(Math.min(MAXT - 1, launchTier() + 1), c.x, c.y); }
  save.stats.comets++; ev('comet', 1);
  flash(c.x, c.y, '#fff3c0', 90, .4); ring(c.x, c.y, '#ffd36b', 10, 140, .6, 4); burst(c.x, c.y, '#ffe08a', 30, 200, true);
  toast(k.n, k.d, '#ffd36b'); AU.cometCatch(); shake(4);
  if(G.hintKey === 'comet'){ tipLock = false; tip(null); tutShow(); }
}
function spawnWanderer(){
  if(G.state !== 'play') return;
  let top = 0; for(const b of G.B) if(!b.wander) top = Math.max(top, b.t);
  const t = clamp(top - 4, launchTier() + 1, MAXT - 1);
  const a = rnd(0, TAU), R = MAX_ORB + 200, b = mkBody(t, Math.cos(a) * R, Math.sin(a) * R);
  const ta = a + Math.PI + rnd(-.35, .35), sp = rnd(38, 52);
  b.vx = Math.cos(ta) * sp; b.vy = Math.sin(ta) * sp; b.wander = true;
  G.B.push(b);
  toast('A WANDERER APPROACHES', `A lone <b>${TIERS[t].n}</b>. Grab it before it drifts away!`, '#9fe3ff');
  AU.wander();
}

/* ---------------- input ---------------- */
function toWorld(sx, sy){ return [(sx - G.cx) / G.sc, (sy - G.cy) / G.sc]; }
function pointerDown(sx, sy){
  if(G.state !== 'play') return;
  const P = G.ptr, w = toWorld(sx, sy);
  P.down = true; P.x = sx; P.y = sy; P.wx = w[0]; P.wy = w[1]; P.vx = P.vy = 0; P.t = performance.now(); P.moved = 0;
  const pad = 16 / G.sc;
  // comet first: it is the most fleeting thing on screen
  if(G.comet && Math.hypot(G.comet.x - w[0], G.comet.y - w[1]) < 34 + pad){ catchComet(); P.down = false; return; }
  let best = null, bd = 1e9;
  for(const b of G.B){ const d = Math.hypot(b.x - w[0], b.y - w[1]) - b.r; if(d < pad && d < bd){ bd = d; best = b; } }
  if(best){
    if(best.wander){ best.wander = false; best.free = 1; save.stats.wanders++; ev('wander', 1); toast('WANDERER CAUGHT', 'A free ' + TIERS[best.t].n + '!', '#9fe3ff'); AU.catchW(); }
    G.grab = best; AU.grab(best.t); tutEv('grab'); return;
  }
  if(Math.hypot(w[0], w[1]) < SUN_R + 8){ tapSun(); P.down = false; tutEv('sun'); return; }
  if(bodyCount() >= capacity()){ G.full = 1; AU.nope(); hint('full', 'Your orbits are <b>full</b>. Merge twins to make room, or buy <b>Orbit Slots</b>.'); P.down = false; return; }
  if(save.charges < 1){ G.noCharge = 1; AU.nope(); P.down = false; return; }
  save.charges--;
  const p = clampOrbit(w[0], w[1], 10), b = addBody(launchTier(), p[0], p[1], true);
  b.born = 1; G.grab = b;
  burst(b.x, b.y, TIERS[b.t].a, 8, 70); AU.spawn(b.t); tutEv('spawn');
}
function pointerMove(sx, sy, dtms){
  const P = G.ptr, w = toWorld(sx, sy);
  if(P.down && dtms > 0){
    const vx = (w[0] - P.wx) / (dtms / 1000), vy = (w[1] - P.wy) / (dtms / 1000);
    P.vx = lerp(P.vx, vx, .5); P.vy = lerp(P.vy, vy, .5);
    P.moved += Math.hypot(sx - P.x, sy - P.y); P.lastMove = performance.now();
  }
  P.x = sx; P.y = sy; P.wx = w[0]; P.wy = w[1];
}
function pointerUp(){
  const P = G.ptr, b = G.grab; P.down = false; G.grab = null;
  if(!b || b.dead) return;
  if(performance.now() - P.t > 60 && P.moved > 0 && performance.now() - (P.lastMove || 0) > 90){ P.vx *= .3; P.vy *= .3; }
  if(Math.hypot(b.x, b.y) < SUN_R + b.r * .6){ feedSun(b); tutEv('feed'); return; }
  const sp = Math.hypot(P.vx, P.vy);
  if(sp > 170){ const k = Math.min(1, 650 / sp); b.vx = P.vx * k; b.vy = P.vy * k; b.free = 1.8; AU.fling(); }
  else { const p = clampOrbit(b.x, b.y, 4); b.x = p[0]; b.y = p[1]; const v = circVel(b.x, b.y); b.vx = v[0]; b.vy = v[1]; b.free = 0; AU.drop(); }
}

/* ---------------- missions ---------------- */
function rollMissions(){
  save.missions = save.missions.filter(m => !m.done);
  let guard = 0;
  while(save.missions.length < 3 && guard++ < 40){
    const pool = MT.filter(t => !save.missions.some(m => m.id === t.id));
    if(!pool.length) break;
    const tp = pick(pool); let tier = save.mTier[tp.id] || 0;
    if(tp.id === 'make'){ while(tier < tp.vals.length && tp.vals[tier] <= save.topG) tier++; }
    if(tp.id === 'life' && save.topG < LIFE_T) continue;
    if(tier >= tp.vals.length) continue;
    const n = tp.vals[tier];
    save.missions.push({ id:tp.id, ev:tp.ev, kind:tp.kind, n, p:0, tier, txt:tp.txt(n), secs:30 + tier * 20, done:false });
  }
}
function ev(e, n){
  if(G.state !== 'play') return;
  let any = false;
  for(const m of save.missions){
    if(m.done || m.ev !== e) continue;
    if(m.kind === 'sum') m.p += n; else m.p = Math.max(m.p, n);
    if(m.p >= m.n){
      m.done = true; any = true;
      const rw = Math.max(60, G.inc * m.secs);
      gain(rw); save.missionsDone++; save.mTier[m.id] = m.tier + 1; save.mNew = true;
      toast('MISSION COMPLETE', `${m.txt} · <b>+${big(rw)} ✦</b>`, '#ffd36b');
      AU.mission();
    }
  }
  if(any){ rollMissions(); persist(); }
}

/* ---------------- supernova (prestige) ---------------- */
function doNova(){
  const gain2 = essenceGain(); if(gain2 < 1) return;
  let keep = null;
  if(save.perks.remnant){ for(const b of G.B) if(!b.wander && (!keep || b.t > keep.t)) keep = b; }
  save.essence += gain2; save.essenceAll += gain2; save.stats.novas++;
  save.galaxy++;
  const d = defSave();
  save.up = d.up; save.up.forge = Math.min(forgeCap(), 2 * save.perks.qforge); if(save.perks.eternal) save.up.drone = 3;
  save.dust = [0, 500, 5e3, 5e4, 5e5, 5e6][save.perks.bang] || 0;
  save.earnedG = 0; save.sunLvl = 0; save.sunXp = 0; save.topG = 0; save.charges = maxCharges();
  G.B = []; G.comet = null; G.rush = G.storm = 0;
  if(keep){ const b = addBody(keep.t, 0, 220, true); b.life = keep.life; b.lp = keep.lp; b.x = 220; b.y = 0; const v = circVel(220, 0); b.vx = v[0]; b.vy = v[1]; save.topG = keep.t; }
  for(let i = 0; i < 3; i++) seedBody(launchTier());
  save.missions = []; rollMissions();
  newSky();
  flash(0, 0, '#ffffff', 2000, 1.4); ring(0, 0, '#ffffff', SUN_R, 1400, 1.6, 12); burst(0, 0, '#ffe7c0', 80, 600, true);
  shake(14); G.slow = 1.2; AU.nova();
  writeSave();
}
