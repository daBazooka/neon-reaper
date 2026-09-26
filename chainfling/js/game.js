'use strict';
/* =====================================================================
   CHAINFLING — simulation
   Core loop: drag to aim (time slows), release to fling your core.
   Fast = lethal & invulnerable. Slow = vulnerable. Every kill while
   airborne refunds a fling, so great players never touch the ground.
   ===================================================================== */
const A = { x0:0, y0:0, x1:800, y1:600 };   // arena, world units
let AW = 800, AH = 600, SC = 1;              // world size & world->px scale
let P = null, ST = null;

const G = {
  state:'boot', t:0, rt:0, wave:0, score:0, mult:1, streak:0, chain:0, air:false, airHits:0, bounces:0,
  maxChain:0, kills:0, runShards:0, revived:false, daily:false, mod:null, scoreMul:1, spdMul:1, up:{},
  timeScale:1, hitstop:0, slowmo:0, shake:0, flash:0, flashCol:'#fff',
  E:[], B:[], PT:[], POP:[], SH:[], PK:[], SP:[], FL:[], ZP:[], TM:[], EC:[],
  queue:[], spawnT:0, burst:0, waveTotal:0, waveDone:0, clearT:0, boss:null,
  tut:false, tutStep:0, tutT:0, vampN:0, rerolls:0, runEv:{}, dieT:0, orbA:0, wallFx:[0,0,0,0],
  aiming:false, aimId:null, aimO:{x:0,y:0}, aimP:{x:0,y:0}, pendingCards:false, flameT:0, lastLandMsg:0,
};

/* ---------------- stats ---------------- */
function calcStats(){
  const u = G.up, m = save.meta, mod = G.mod ? G.mod.id : '';
  ST = {
    dmg: 1 + .25 * (u.dmg || 0),
    launch: 1500 * (1 + .12 * (u.speed || 0)),
    wallKeep: Math.min(.96, .8 + .055 * (u.rubber || 0)),
    radius: 15 * (1 + .18 * (u.size || 0)) * (mod === 'titan' ? 1.7 : 1),
    maxCh: Math.max(1, 2 + m.cap + (u.charge || 0) - (mod === 'titan' ? 1 : 0)),
    focus: (mod === 'blitz' ? .45 : 2.2) * (1 + .2 * m.focus) * (1 + .35 * (u.focus || 0)),
    magnet: 80 + 35 * m.magnet + 75 * (u.magnet || 0),
    vuln: 360 * (1 - .13 * (u.overdrive || 0)),
    over: 1120 * (1 - .07 * (u.overdrive || 0)),
    greed: 1 + .15 * m.greed,
    streakGain: .1 * (1 + .5 * (u.combo || 0)),
  };
  if(P) P.r = ST.radius;
}

function resizeArena(){
  const top = 58 / SC;
  A.x0 = 10; A.y0 = Math.max(10, top); A.x1 = AW - 10; A.y1 = AH - 10;
  if(P){ P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r); }
  for(const e of G.E){ e.x = clamp(e.x, A.x0 + e.r, A.x1 - e.r); e.y = clamp(e.y, A.y0 + e.r, A.y1 - e.r); }
}

/* ---------------- run lifecycle ---------------- */
function newRun(daily){
  G.daily = !!daily;
  if(daily){ const seed = hashStr('chainfling:' + todayKey()); grng = mulberry32(seed); G.mod = MODS[seed % MODS.length]; }
  else { grng = Math.random; G.mod = null; }
  G.scoreMul = G.mod ? G.mod.score : 1;
  G.spdMul = G.mod && G.mod.id === 'hyper' ? 1.3 : 1;
  for(const k of ['E','B','PT','POP','SH','PK','SP','FL','ZP','TM','EC']) G[k].length = 0;
  Object.assign(G, { t:0, wave:0, score:0, mult:1, streak:0, chain:0, air:false, airHits:0, bounces:0, maxChain:0,
    kills:0, runShards:0, revived:false, up:{}, timeScale:1, hitstop:0, slowmo:0, shake:0, flash:0, queue:[],
    spawnT:0, burst:0, waveTotal:0, waveDone:0, clearT:0, boss:null, vampN:0, rerolls:0, runEv:{}, dieT:0,
    aiming:false, aimId:null, pendingCards:false, wallFx:[0,0,0,0] });
  calcStats();
  const hp = G.mod && G.mod.id === 'glass' ? 1 : 3 + save.meta.hull;
  P = { x:(A.x0 + A.x1) / 2, y:(A.y0 + A.y1) * .62, vx:0, vy:0, r:ST.radius, hp, maxHp:hp, ch:ST.maxCh,
        regen:0, inv:1, focus:ST.focus, trail:[], spin:0 };
  G.tut = !save.tut; G.tutStep = 0; G.tutT = 0;
  G.state = 'play';
  if(G.tut) startTutorial();
  else if(save.meta.head) { G.pendingCards = 'start'; }
  else startWave(1);
}

function startWave(n){
  G.wave = n;
  G.queue = buildWave(n);
  G.waveTotal = G.queue.length; G.waveDone = 0;
  G.spawnT = .5; G.burst = Math.min(5, 2 + (n >> 1)); G.clearT = 0;
  const boss = n % 5 === 0;
  if(boss) announce(BOSSES[(n / 5 - 1) % 3].name, '#ff3b5c', 'WAVE ' + n);
  else announce('WAVE ' + n, '#27f3ff', n === 1 ? 'GO!' : '');
  AU.setMusic(boss ? 3 : n >= 8 ? 3 : 2, boss);
  ev('wave', n);
}

function buildWave(n){
  const q = [];
  const swarm = G.mod && G.mod.id === 'swarm', keg = G.mod && G.mod.id === 'keg';
  if(n % 5 === 0){
    q.push('BOSS');
    const esc = Math.floor(n / 5) * 2;
    for(let i = 0; i < esc; i++) q.push(i % 3 === 2 && n >= 10 ? 'bomber' : 'drifter');
    return q;
  }
  let budget = (4 + n * 2.2) * (swarm ? 2 : 1);
  const types = Object.keys(ET).filter(k => ET[k].at <= n && ET[k].w > 0);
  const newest = types.filter(k => ET[k].at === n);
  for(const t of newest){ q.push(t, t); budget -= ET[t].cost * 2; }
  const wOf = k => ET[k].w * (keg && k === 'bomber' ? 5 : 1);
  const tot = types.reduce((s, k) => s + wOf(k), 0);
  while(budget > 0){
    let r = grng() * tot, t = types[0];
    for(const k of types){ r -= wOf(k); if(r <= 0){ t = k; break; } }
    q.push(t); budget -= ET[t].cost;
  }
  for(let i = q.length - 1; i > 0; i--){ const j = (grng() * (i + 1)) | 0; [q[i], q[j]] = [q[j], q[i]]; }
  return q;
}

function aliveWave(){ let n = 0; for(const e of G.E) if(!e.dead && e.wave) n++; return n; }

function spawnPos(minD){
  let x = 0, y = 0;
  for(let i = 0; i < 20; i++){
    x = gr(A.x0 + 40, A.x1 - 40); y = gr(A.y0 + 40, A.y1 - 40);
    if(!P || Math.hypot(x - P.x, y - P.y) > minD) break;
  }
  return { x, y };
}

function tickSpawns(dt){
  if(G.tut) return;
  const n = G.wave;
  const maxAlive = Math.floor(Math.min(6 + n * .9, 26) * (G.mod && G.mod.id === 'swarm' ? 1.6 : 1));
  G.spawnT -= dt;
  if(G.spawnT <= 0 && G.queue.length && aliveWave() + G.SP.length < maxAlive){
    const type = G.queue.shift();
    if(type === 'BOSS'){
      G.SP.push({ x:(A.x0 + A.x1) / 2, y:A.y0 + (A.y1 - A.y0) * .3, type, t:0, dur:1.4, r:60 });
    } else {
      const p = type === 'turret'
        ? { x: grng() < .5 ? gr(A.x0 + 40, A.x0 + 120) : gr(A.x1 - 120, A.x1 - 40), y: gr(A.y0 + 40, A.y1 - 40) }
        : spawnPos(230);
      G.SP.push({ x:p.x, y:p.y, type, t:0, dur:.75, r:ET[type].r });
    }
    G.spawnT = G.burst > 0 ? (G.burst--, .12) : Math.max(.2, .75 - n * .02);
  }
  for(let i = G.SP.length - 1; i >= 0; i--){
    const s = G.SP[i]; s.t += dt;
    if(s.t >= s.dur){
      G.SP.splice(i, 1);
      if(s.type === 'BOSS') spawnBoss(s.x, s.y);
      else { mkEnemy(s.type, s.x, s.y, true); introType(s.type); }
    }
  }
  // wave clear
  if(G.clearT === 0 && !G.queue.length && !G.SP.length && aliveWave() === 0 && G.wave > 0){
    G.clearT = 1.5; G.slowmo = .9;
    AU.waveClear();
    announce('WAVE CLEAR', '#b6ff3c', '+' + fmt(250 * G.wave) + ' BONUS');
    addScore(250 * G.wave);
    for(const e of G.E) if(!e.dead && !e.wave && !e.boss) killEnemy(e, 'clear');
  }
}

function introType(type){
  const d = ET[type];
  if(!d || !d.tip || save.seen[type]) return;
  save.seen[type] = 1; persist();
  toast('NEW ENEMY', d.tip, d.col, 5200);
}

function mkEnemy(type, x, y, wave){
  const d = ET[type];
  const hpMul = (1 + Math.max(0, G.wave - 8) * .05) * (G.mod && G.mod.id === 'swarm' ? .5 : 1);
  const e = { type, x, y, vx:0, vy:0, r:d.r, hp:d.hp * hpMul, maxHp:d.hp * hpMul, score:d.score, col:d.col,
    t:Math.random() * 10, hitCd:0, flash:0, burnCd:0, orbCd:0, wave:!!wave, dead:false, face:0, cd:gr(1, 2.4),
    st:'walk', stT:gr(1.2, 2.6), dx:0, dy:0, phased:false, born:0 };
  if(P) e.face = Math.atan2(P.y - y, P.x - x);
  if(type === 'spiker'){ const a = gr(0, TAU); e.vx = Math.cos(a) * d.spd; e.vy = Math.sin(a) * d.spd; }
  G.E.push(e);
  return e;
}

/* ---------------- bosses ---------------- */
function spawnBoss(x, y){
  const idx = (G.wave / 5 - 1) % 3, cyc = Math.floor((G.wave / 5 - 1) / 3);
  const def = BOSSES[idx];
  const hm = 1 + cyc * .8 + (G.wave / 5 - 1) * .12;
  const e = mkEnemy('drifter', x, y, true);
  Object.assign(e, { type:'boss', boss:def.id, name:def.name, col:def.col, score:5000 * (1 + cyc), r:48, rot:0, cd:2.2, pulse:0, spawnCd:2.5 });
  if(def.id === 'prism'){ e.hp = e.maxHp = 16 * hm; }
  if(def.id === 'hive'){ e.hp = e.maxHp = 22 * hm; e.r = 54; }
  if(def.id === 'serpent'){
    const n = 12 + cyc * 3; e.r = 20; e.segs = [];
    for(let i = 0; i < n; i++) e.segs.push({ x, y:y - i * 24, hp:1.1 * hm, max:1.1 * hm, r:i === 0 ? 24 : 18 - Math.min(6, i * .35) });
    e.hp = e.maxHp = e.segs.reduce((s, g) => s + g.hp, 0);
    e.ang = Math.PI / 2; e.headHp = 4 * hm;
  }
  G.boss = e;
  shock(x, y, 260, def.col, 6); shakeIt(14); AU.boom(true);
  toast(def.name, bossTip(def.id), def.col, 4800);
}
function bossTip(id){
  return id === 'prism' ? 'Its mirrored plates <b>deflect</b> you. Slip between them to hit the core.'
    : id === 'hive' ? 'Spawns swarms and pulses a shockwave — be <b>fast</b> when it pulses.'
    : 'Only the glowing <b>tail</b> can be cut. The body is a bumper — use it!';
}

function updBoss(e, dt){
  const toP = Math.atan2(P.y - e.y, P.x - e.x);
  const rage = e.hp < e.maxHp * .5;
  if(e.boss === 'prism'){
    e.rot += (rage ? 1.5 : .9) * dt;
    const cxA = (A.x0 + A.x1) / 2, cyA = (A.y0 + A.y1) / 2;
    const tx = cxA + Math.cos(G.t * .35) * (A.x1 - A.x0) * .22, ty = cyA + Math.sin(G.t * .5) * (A.y1 - A.y0) * .18;
    e.vx = lerp(e.vx, (tx - e.x) * .8, dt * 2); e.vy = lerp(e.vy, (ty - e.y) * .8, dt * 2);
    e.cd -= dt;
    if(e.cd <= 0){
      e.cd = rage ? 2 : 2.7;
      const n = rage ? 16 : 11, off = gr(0, TAU);
      for(let i = 0; i < n; i++){ const a = off + i / n * TAU; G.B.push({ x:e.x + Math.cos(a) * e.r, y:e.y + Math.sin(a) * e.r, vx:Math.cos(a) * 165 * G.spdMul, vy:Math.sin(a) * 165 * G.spdMul, r:7, c:e.col }); }
      AU.tone(300, .2, 'sawtooth', .07, 600);
    }
  } else if(e.boss === 'hive'){
    e.vx = lerp(e.vx, Math.cos(toP) * 42 * G.spdMul, dt * 1.5); e.vy = lerp(e.vy, Math.sin(toP) * 42 * G.spdMul, dt * 1.5);
    e.spawnCd -= dt;
    let minis = 0; for(const m of G.E) if(m.type === 'mini' && !m.dead) minis++;
    if(e.spawnCd <= 0 && minis < 12){
      e.spawnCd = rage ? 1.9 : 2.8;
      for(let i = 0; i < 2; i++){ const a = gr(0, TAU); const m = mkEnemy('mini', e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r, false); m.vx = Math.cos(a) * 200; m.vy = Math.sin(a) * 200; }
    }
    e.cd -= dt;
    if(e.pulse > 0){
      e.pulse -= dt;
      if(e.pulse <= 0){
        shock(e.x, e.y, 270, '#ffb020', 8); AU.boom(true); shakeIt(10);
        if(Math.hypot(P.x - e.x, P.y - e.y) < 270 + P.r && !isFast()) hurtPlayer(e);
      }
    } else if(e.cd <= 0){ e.cd = rage ? 5 : 6.5; e.pulse = 1.25; AU.tone(200, 1.2, 'sine', .08, 700); }
  } else if(e.boss === 'serpent'){
    const segs = e.segs, head = segs[0];
    const frac = segs.length / (12 + 3 * Math.floor((G.wave / 5 - 1) / 3));
    const spd = (165 + (1 - frac) * 140) * G.spdMul;
    const want = toP + Math.sin(G.t * 2.2) * .9;
    e.ang += clamp(angDiff(want, e.ang), -1.9 * dt, 1.9 * dt);
    head.x += Math.cos(e.ang) * spd * dt; head.y += Math.sin(e.ang) * spd * dt;
    if(head.x < A.x0 + head.r){ head.x = A.x0 + head.r; e.ang = Math.PI - e.ang; }
    if(head.x > A.x1 - head.r){ head.x = A.x1 - head.r; e.ang = Math.PI - e.ang; }
    if(head.y < A.y0 + head.r){ head.y = A.y0 + head.r; e.ang = -e.ang; }
    if(head.y > A.y1 - head.r){ head.y = A.y1 - head.r; e.ang = -e.ang; }
    for(let i = 1; i < segs.length; i++){
      const a = segs[i - 1], b = segs[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, sp = (a.r + b.r) * .62;
      if(d > sp){ b.x = a.x + dx / d * sp; b.y = a.y + dy / d * sp; }
    }
    e.x = head.x; e.y = head.y; e.vx = 0; e.vy = 0;
    e.cd -= dt;
    if(e.cd <= 0){
      e.cd = rage ? 1.6 : 2.3;
      for(let k = -1; k <= 1; k++){ const a = toP + k * .22; G.B.push({ x:head.x, y:head.y, vx:Math.cos(a) * 190 * G.spdMul, vy:Math.sin(a) * 190 * G.spdMul, r:7, c:e.col }); }
      AU.tone(420, .15, 'square', .05, 250);
    }
  }
}

/* ---------------- tutorial ---------------- */
function startTutorial(){
  G.tutStep = 0; G.tutT = 0; G.wave = 0;
  const cy = A.y0 + (A.y1 - A.y0) * .3, cx = (A.x0 + A.x1) / 2, sp = Math.min(90, (A.x1 - A.x0) * .16);
  for(let i = -1; i <= 1; i++){ const e = mkEnemy('drifter', cx + i * sp, cy - Math.abs(i) * 20, false); e.type = 'dummy'; e.col = ET.drifter.col; }
  tip('<b>DRAG</b> anywhere, then <b>RELEASE</b> to fling your core!');
}
function tickTutorial(dt){
  if(!G.tut) return;
  G.tutT += dt;
  const dummies = G.E.filter(e => e.type === 'dummy' && !e.dead).length;
  if(G.tutStep === 1 && dummies === 0){
    G.tutStep = 2; G.tutT = 0;
    tip('Kills <b>refund</b> your flings. <em>Slow = vulnerable!</em><br>Chain kills to stay fast.');
  }
  if(G.tutStep === 2 && G.tutT > 3.6){
    G.tut = false; save.tut = true; persist(); tip(null);
    if(save.meta.head) G.pendingCards = 'start'; else startWave(1);
  }
}

/* ---------------- input → fling ---------------- */
function aimStart(x, y, id){
  if(G.state !== 'play' || G.aiming) return;
  G.aiming = true; G.aimId = id; G.aimO.x = G.aimP.x = x; G.aimO.y = G.aimP.y = y;
  if(P.ch > 0){ AU.setSlow(true); AU.aim(); } else AU.empty();
}
function aimMove(x, y, id){ if(G.aiming && id === G.aimId){ G.aimP.x = x; G.aimP.y = y; } }
function aimVec(){
  const dx = G.aimP.x - G.aimO.x, dy = G.aimP.y - G.aimO.y, len = Math.hypot(dx, dy);
  const full = Math.min(innerWidth, innerHeight) * .17;
  if(len < 14) return null;
  const s = save.opt.aim === 'push' ? 1 : -1;
  return { x: s * dx / len, y: s * dy / len, pow: clamp(.35 + .65 * len / full, .35, 1) };
}
function aimEnd(id){
  if(!G.aiming || id !== G.aimId) return;
  G.aiming = false; AU.setSlow(false);
  if(G.state !== 'play') return;
  const v = aimVec();
  if(!v) return;
  if(P.ch <= 0){ AU.empty(); pop(P.x, P.y - 30, 'NO CHARGE', '#ff3b5c', 16); return; }
  launch(v.x, v.y, v.pow);
}
function aimCancel(){ if(G.aiming){ G.aiming = false; AU.setSlow(false); } }

function launch(dx, dy, pow){
  P.ch--; save.stats.flings++;
  const s = ST.launch * pow;
  P.vx = dx * s; P.vy = dy * s; G.air = true; G.bounces = 0;
  AU.launch(pow); shakeIt(2);
  for(let i = 0; i < 14; i++){ const a = Math.atan2(-dy, -dx) + rnd(-.6, .6); part(P.x, P.y, Math.cos(a) * rnd(100, 380), Math.sin(a) * rnd(100, 380), rnd(.25, .5), skinCol(), rnd(2, 4)); }
  shock(P.x, P.y, 60, skinCol(), 2);
  if(G.up.echo){
    for(let k = 0; k < G.up.echo; k++){
      const off = (k % 2 ? -1 : 1) * (.32 + k * .1), c = Math.cos(off), sn = Math.sin(off);
      G.EC.push({ x:P.x, y:P.y, vx:(dx * c - dy * sn) * s * .9, vy:(dx * sn + dy * c) * s * .9, r:ST.radius * .6, life:1.3, hit:new Set() });
    }
  }
  if(G.tut && G.tutStep === 0){ G.tutStep = 1; tip('Kills <b>refund</b> flings — re-aim mid-air to <b>chain</b> them all!'); }
}

function isFast(){ return P && Math.hypot(P.vx, P.vy) >= ST.vuln; }

function endAir(){
  G.air = false;
  if(G.chain > 0 || G.airHits > 0){
    G.streak++;
    if(G.chain >= 3) pop(P.x, P.y - 34, G.chain + ' CHAIN', '#ffb020', 20);
  } else {
    if(G.streak >= 3){ pop(P.x, P.y - 34, 'STREAK LOST', '#ff3b5c', 18); AU.streakLost(); }
    G.streak = 0;
  }
  G.mult = Math.min(8, 1 + G.streak * ST.streakGain);
  ev('mult', G.mult); ev('chain', G.chain);
  G.chain = 0; G.airHits = 0;
}

/* ---------------- main update ---------------- */
function update(dt){
  G.rt += dt;
  // time scale: aim slow-mo (limited by focus), cinematic slow-mo, normal
  const aimSlow = G.aiming && P.ch > 0 && P.focus > 0 && G.state === 'play';
  const target = G.state === 'dying' ? .22 : aimSlow ? .07 : G.slowmo > 0 ? .3 : 1;
  G.timeScale = lerp(G.timeScale, target, Math.min(1, dt * (target < G.timeScale ? 18 : 7)));
  if(G.slowmo > 0) G.slowmo -= dt;
  if(aimSlow) P.focus = Math.max(0, P.focus - dt);
  else if(!G.aiming) P.focus = Math.min(ST.focus, P.focus + dt * .5);
  if(G.aiming && P.focus <= 0 && P.ch > 0) AU.setSlow(false);

  G.shake = Math.max(0, G.shake - dt * 30);
  if(G.chainPulse > 0) G.chainPulse = Math.max(0, G.chainPulse - dt * 5);
  G.flash = Math.max(0, G.flash - dt * 3);
  for(let i = 0; i < 4; i++) G.wallFx[i] = Math.max(0, G.wallFx[i] - dt * 3);
  if(G.hitstop > 0){ G.hitstop -= dt; tickFx(dt * .15); return; }

  const gdt = dt * G.timeScale;
  G.t += gdt;

  if(G.state === 'dying'){
    G.dieT -= dt; tickFx(gdt);
    for(const e of G.E) if(!e.dead) { e.x += e.vx * gdt; e.y += e.vy * gdt; }
    if(G.dieT <= 0) onDeathDone();
    return;
  }

  updPlayer(gdt);
  updEnemies(gdt);
  updBullets(gdt);
  updEcho(gdt);
  updPickups(gdt);
  updFlames(gdt);
  updOrbit(gdt);
  for(let i = G.TM.length - 1; i >= 0; i--){ const t = G.TM[i]; t.t -= gdt; if(t.t <= 0){ G.TM.splice(i, 1); t.f(); } }
  tickSpawns(gdt);
  tickTutorial(dt);
  tickFx(gdt);

  if(G.clearT > 0){
    G.clearT -= dt;
    if(G.clearT <= 0){ G.clearT = -1; G.pendingCards = 'wave'; }
  }
  if(G.pendingCards && !G.aiming){ const k = G.pendingCards; G.pendingCards = false; openCards(k); }
}

function updPlayer(dt){
  let sp = Math.hypot(P.vx, P.vy);
  const steps = Math.min(12, Math.max(1, Math.ceil(sp * dt / (P.r * .5))));
  const sdt = dt / steps;
  for(let s = 0; s < steps; s++){
    P.x += P.vx * sdt; P.y += P.vy * sdt;
    let b = -1;
    if(P.x < A.x0 + P.r){ P.x = A.x0 + P.r; P.vx = Math.abs(P.vx); b = 0; }
    else if(P.x > A.x1 - P.r){ P.x = A.x1 - P.r; P.vx = -Math.abs(P.vx); b = 1; }
    if(P.y < A.y0 + P.r){ P.y = A.y0 + P.r; P.vy = Math.abs(P.vy); b = 2; }
    else if(P.y > A.y1 - P.r){ P.y = A.y1 - P.r; P.vy = -Math.abs(P.vy); b = 3; }
    if(b >= 0) onBounce(b);
    collidePlayer();
    if(G.state !== 'play') return;
  }
  const f = Math.exp(-1.0 * dt);
  P.vx *= f; P.vy *= f;
  sp = Math.hypot(P.vx, P.vy);
  if(sp < 6){ P.vx = P.vy = 0; sp = 0; }
  if(G.air && sp < ST.vuln) endAir();
  // passive recharge, only while grounded (slow)
  if(P.ch < ST.maxCh && !G.air){
    P.regen += dt;
    if(P.regen >= 1.05){ P.regen = 0; P.ch++; AU.charge(); }
  } else P.regen = 0;
  if(P.inv > 0) P.inv -= dt;
  P.spin += dt * (2 + sp / 90);
  if(sp > 40){ P.trail.push({ x:P.x, y:P.y, a:0, s:sp }); }
  for(const t of P.trail) t.a += dt;
  while(P.trail.length && (P.trail[0].a > .28 || P.trail.length > 40)) P.trail.shift();
  // plasma trail
  if(G.up.trail && sp > ST.vuln){
    G.flameT -= dt;
    if(G.flameT <= 0){ G.flameT = .025; G.FL.push({ x:P.x, y:P.y, life:.5 + .25 * G.up.trail, max:.5 + .25 * G.up.trail }); }
  }
}

function onBounce(side){
  G.bounces++; G.wallFx[side] = 1;
  const sp = Math.hypot(P.vx, P.vy);
  P.vx *= ST.wallKeep; P.vy *= ST.wallKeep;
  if(sp > 150){ AU.bounce(); shakeIt(Math.min(5, sp / 400)); }
  for(let i = 0; i < 6; i++) part(P.x, P.y, rnd(-200, 200), rnd(-200, 200), .3, '#ffffff', 2);
  if(G.up.nova && sp > ST.vuln){
    const r = 70 + 25 * G.up.nova;
    shock(P.x, P.y, r, '#27f3ff', 3);
    for(const e of G.E) if(!e.dead && !e.phased && Math.hypot(e.x - P.x, e.y - P.y) < r + e.r) dmgEnemy(e, .5 + .35 * G.up.nova, 'nova');
  }
}

function reflectOff(nx, ny, keep){
  const dot = P.vx * nx + P.vy * ny;
  if(dot < 0){ P.vx -= 2 * dot * nx; P.vy -= 2 * dot * ny; }
  P.vx *= keep; P.vy *= keep;
}

function collidePlayer(){
  const sp = Math.hypot(P.vx, P.vy), fast = sp >= ST.vuln;
  for(const e of G.E){
    if(e.dead || e.phased) continue;
    if(e.type === 'boss'){ collideBoss(e, sp, fast); if(G.state !== 'play') return; continue; }
    const dx = P.x - e.x, dy = P.y - e.y, rr = e.r + P.r, d2 = dx * dx + dy * dy;
    if(d2 > rr * rr) continue;
    const d = Math.sqrt(d2) || 1, nx = dx / d, ny = dy / d;
    if(e.type === 'dummy'){ if(fast || G.tut) { if(e.hitCd <= 0) hitEnemy(e, sp, nx, ny); } continue; }
    if(fast){ hitEnemy(e, sp, nx, ny); }
    else {
      P.x = e.x + nx * rr; P.y = e.y + ny * rr;
      hurtPlayer(e);
      if(G.state !== 'play') return;
    }
  }
}

function hitEnemy(e, sp, nx, ny){
  if(e.hitCd > 0) return;
  e.hitCd = .14;
  const pierce = !!G.up.pierce;
  if(e.type === 'shield' && !pierce){
    const a = Math.atan2(ny, nx);
    if(Math.abs(angDiff(a, e.face)) < 1.1){
      reflectOff(nx, ny, .92); P.x = e.x + nx * (e.r + P.r + 1); P.y = e.y + ny * (e.r + P.r + 1);
      e.vx -= nx * 160; e.vy -= ny * 160; AU.clang(); sparks(e.x + nx * e.r, e.y + ny * e.r, '#9fd0ff');
      pop(e.x, e.y - 24, 'BLOCKED', '#4da3ff', 14);
      return;
    }
    e.backstab = true; ev('back', 1);
  }
  if(e.type === 'spiker' && sp < ST.over && !pierce){
    reflectOff(nx, ny, .85); P.x = e.x + nx * (e.r + P.r + 1); P.y = e.y + ny * (e.r + P.r + 1);
    AU.clang(); sparks(e.x + nx * e.r, e.y + ny * e.r, '#ffffff');
    pop(e.x, e.y - 24, 'TOO SLOW', '#e6e9ff', 14);
    return;
  }
  const dmg = ST.dmg * (.55 + .75 * Math.min(1.2, sp / 1500));
  const heavy = ET[e.type] && ET[e.type].heavy;
  P.vx *= heavy ? .82 : .95; P.vy *= heavy ? .82 : .95;
  e.vx -= nx * 220; e.vy -= ny * 220;
  dmgEnemy(e, e.type === 'dummy' ? 9 : dmg, 'hit');
  if(!e.dead){ AU.thud(); sparks(e.x, e.y, e.col); pop(e.x, e.y - 20, '-' + dmg.toFixed(1), '#ffffff', 12); }
}

function collideBoss(e, sp, fast){
  if(e.boss === 'serpent'){
    const segs = e.segs;
    for(let i = 0; i < segs.length; i++){
      const g = segs[i], dx = P.x - g.x, dy = P.y - g.y, rr = g.r + P.r, d2 = dx * dx + dy * dy;
      if(d2 > rr * rr) continue;
      const d = Math.sqrt(d2) || 1, nx = dx / d, ny = dy / d;
      const vuln = i === segs.length - 1;
      P.x = g.x + nx * (rr + 1); P.y = g.y + ny * (rr + 1);
      if(fast){
        if(e.hitCd > 0){ reflectOff(nx, ny, .95); return; }
        e.hitCd = .16;
        if(vuln){
          const dmg = ST.dmg * (.55 + .75 * Math.min(1.2, sp / 1500));
          const tgt = segs.length === 1 ? 'head' : 'seg';
          g.hp -= dmg * (tgt === 'head' ? 1.1 / e.headHp * g.max : 1);
          bossHitFx(e, g.x, g.y, dmg);
          reflectOff(nx, ny, .93);
          if(g.hp <= 0){
            segs.pop();
            burst(g.x, g.y, 22, e.col, 380); AU.boom(false); shakeIt(6);
            G.airHits++; addKillScore(250, g.x, g.y, e.col);
            if(G.air){ G.chain++; if(G.chain > G.maxChain) G.maxChain = G.chain; if(P.ch < ST.maxCh) P.ch++; AU.hit(G.chain); }
            if(!segs.length){ killEnemy(e, 'hit'); }
          }
          e.hp = segs.reduce((s, q) => s + Math.max(0, q.hp), 0);
        } else {
          reflectOff(nx, ny, 1.02); AU.clang(); sparks(g.x, g.y, e.col); addScore(15);
        }
      } else {
        reflectOff(nx, ny, 1); hurtPlayer(g);
      }
      return;
    }
    return;
  }
  const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
  const plateR = e.boss === 'prism' ? e.r + 14 : e.r;
  if(d > plateR + P.r) return;
  if(e.boss === 'prism'){
    const a = Math.atan2(ny, nx);
    for(let k = 0; k < 3; k++){
      if(Math.abs(angDiff(a, e.rot + k * TAU / 3)) < .5){
        P.x = e.x + nx * (plateR + P.r + 1); P.y = e.y + ny * (plateR + P.r + 1);
        reflectOff(nx, ny, 1); AU.clang(); sparks(e.x + nx * plateR, e.y + ny * plateR, '#dff8ff');
        return;
      }
    }
    if(d > e.r + P.r) return;
  }
  P.x = e.x + nx * (e.r + P.r + 1); P.y = e.y + ny * (e.r + P.r + 1);
  if(fast){
    if(e.hitCd > 0){ reflectOff(nx, ny, .95); return; }
    e.hitCd = .16;
    const dmg = ST.dmg * (.55 + .75 * Math.min(1.2, sp / 1500));
    reflectOff(nx, ny, .93);
    bossHitFx(e, P.x - nx * P.r, P.y - ny * P.r, dmg);
    G.airHits++; if(P.ch < ST.maxCh) P.ch++;
    e.hp -= dmg;
    if(e.hp <= 0) killEnemy(e, 'hit');
  } else {
    reflectOff(nx, ny, 1); P.vx += nx * 200; P.vy += ny * 200; hurtPlayer(e);
  }
}
function bossHitFx(e, x, y, dmg){
  e.flash = .1; AU.thud(); AU.tone(200 + Math.random() * 60, .12, 'square', .08, 90);
  sparks(x, y, e.col); shakeIt(4); G.hitstop = Math.max(G.hitstop, .03);
  pop(x, y - 16, '-' + dmg.toFixed(1), '#ffffff', 14);
  addScore(40);
}

function dmgEnemy(e, dmg, src){
  if(e.dead) return;
  if(e.type === 'boss'){
    if(e.boss === 'serpent'){
      const tail = e.segs[e.segs.length - 1]; if(!tail) return;
      tail.hp -= dmg * .5; e.flash = .08;
      if(tail.hp <= 0){ e.segs.pop(); burst(tail.x, tail.y, 16, e.col, 300); if(!e.segs.length) killEnemy(e, src); }
      e.hp = e.segs.reduce((s, q) => s + Math.max(0, q.hp), 0);
      return;
    }
    e.hp -= dmg * .5; e.flash = .08;
    if(e.hp <= 0) killEnemy(e, src);
    return;
  }
  e.hp -= dmg; e.flash = .1;
  if(e.hp <= 0) killEnemy(e, src);
}

function addScore(v){ G.score += Math.round(v * G.scoreMul); ev('score', G.score); }
function addKillScore(base, x, y, col){
  const ch = G.air ? Math.max(1, G.chain) : 1;
  const pts = Math.round(base * ch * G.mult * G.scoreMul);
  G.score += pts; ev('score', G.score);
  // long chains would bury the arena in numbers; the chain counter over the core carries it
  if(ch <= 3 || ch % 5 === 0) pop(x, y, '+' + fmt(pts), col, 13 + Math.min(14, ch * 1.2));
  G.chainPulse = 1;
}

const CALLS = { 3:['TRIPLE!','#ffb020'], 5:['CHAIN x5','#ff3fb4'], 8:['FRENZY!','#b46bff'], 12:['RAMPAGE!','#27f3ff'],
  16:['UNSTOPPABLE!','#b6ff3c'], 20:['OVERLOAD!','#ff3b5c'], 30:['ANNIHILATION!','#ffd23c'], 50:['TRANSCENDENT!','#ffffff'], 75:['BEYOND!','#ff3fb4'], 100:['CHAINFLING!!','#27f3ff'] };

function killEnemy(e, src){
  if(e.dead) return;
  e.dead = true;
  const d = ET[e.type] || ET.drifter;
  if(e.wave) G.waveDone++;
  if(src === 'clear'){ burst(e.x, e.y, 10, e.col, 200); return; }
  G.kills++; save.stats.kills++; ev('kill', 1);
  if(src === 'boom') ev('bomb', 1);
  if(G.air){
    G.chain++;
    if(G.chain > G.maxChain) G.maxChain = G.chain;
    if(P.ch < ST.maxCh){ P.ch++; }
    const c = CALLS[G.chain]; if(c){ announce(c[0], c[1]); AU.announce(); }
    if(G.up.nuke && G.chain % 10 === 0) G.TM.push({ t:.05, f:() => singularity() });
  }
  const bank = src === 'hit' && G.air && G.bounces > 0 ? Math.min(G.bounces, 3) : 0;
  if(bank){ ev('bank', 1); if(G.chain <= 2 || Math.random() < .3) pop(e.x, e.y - 34, bank > 1 ? 'BANK x' + bank + '!' : 'BANK SHOT!', '#27f3ff', 15); }
  if(e.backstab) pop(e.x, e.y - 34, 'BACKSTAB!', '#4da3ff', 15);
  const base = e.score * (1 + bank * .5) * (e.backstab ? 1.5 : 1);
  addKillScore(base, e.x, e.y - 10, e.col);
  AU.hit(G.air ? G.chain : 1);
  G.hitstop = Math.max(G.hitstop, Math.min(.07, .022 + (G.air ? G.chain : 1) * .004));
  shakeIt(3 + Math.min(G.chain, 12) * .5);
  burst(e.x, e.y, e.type === 'boss' ? 80 : 16 + Math.min(16, G.chain), e.col, e.type === 'boss' ? 700 : 360);
  shock(e.x, e.y, e.type === 'boss' ? 400 : 55 + e.r * 2, e.col, e.type === 'boss' ? 8 : 3);
  // drops
  let n = d.shards || 0; if(e.type === 'boss') n = 30;
  n = Math.floor(n + (Math.random() < (n % 1) ? 1 : 0));
  for(let i = 0; i < n; i++){ const a = rnd(0, TAU), s = rnd(60, 220); G.PK.push({ x:e.x, y:e.y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, life:9, v:1 }); }
  // type effects
  if(e.type === 'bomber'){
    const big = G.mod && G.mod.id === 'keg';
    G.TM.push({ t:.07, f:() => explode(e.x, e.y, big ? 160 : 115, 2.4, true) });
  }
  if(e.type === 'splitter'){
    for(let k = 0; k < 2; k++){ const a = rnd(0, TAU); const m = mkEnemy('mini', e.x, e.y, false); m.vx = Math.cos(a) * 260; m.vy = Math.sin(a) * 260; m.hitCd = .12; }
  }
  if(e.type === 'boss') onBossDown(e);
  // upgrades
  if(G.up.zap && src !== 'zap' && Math.random() < .2 + .15 * G.up.zap){
    const t = nearestEnemy(e.x, e.y, 230, e);
    if(t){ G.ZP.push({ x1:e.x, y1:e.y, x2:t.x, y2:t.y, life:.18 }); AU.zap(); G.TM.push({ t:.06, f:() => dmgEnemy(t, 1.2 + .3 * G.up.zap, 'zap') }); }
  }
  if(G.up.shock && src !== 'shock' && src !== 'boom'){
    const r = 45 + 15 * G.up.shock;
    G.TM.push({ t:.05, f:() => { shock(e.x, e.y, r, '#ffffff', 2); for(const o of G.E) if(!o.dead && !o.phased && o !== e && Math.hypot(o.x - e.x, o.y - e.y) < r + o.r) dmgEnemy(o, .45 * G.up.shock, 'shock'); } });
  }
  if(G.up.vamp){
    G.vampN++;
    const need = G.up.vamp >= 2 ? 20 : 30;
    if(G.vampN >= need){ G.vampN = 0; if(P.hp < P.maxHp){ P.hp++; pop(P.x, P.y - 30, '+1 ♥', '#ff3fb4', 18); AU.charge(); } }
  }
}

function onBossDown(e){
  G.boss = null; G.slowmo = 1.4; G.flash = 1; G.flashCol = e.col;
  save.stats.bosses++; ev('boss', 1); AU.boom(true); shakeIt(20);
  for(let i = 0; i < 4; i++) G.TM.push({ t:.1 + i * .12, f:() => { burst(e.x + rnd(-60, 60), e.y + rnd(-60, 60), 30, pick([e.col, '#ffffff', '#ffb020']), 500); AU.boom(false); } });
  if(P.hp < P.maxHp){ P.hp++; pop(P.x, P.y - 30, '+1 ♥', '#ff3fb4', 18); }
  announce('BOSS DOWN', e.col, '+1 HEART');
  for(const m of G.E) if(!m.dead && !m.wave) killEnemy(m, 'clear');
  G.B.length = 0;
  SDK.happytime();
}

function singularity(){
  G.flash = .8; G.flashCol = '#ffffff'; AU.boom(true); shakeIt(18);
  shock(P.x, P.y, Math.max(AW, AH), '#ffffff', 10);
  announce('SINGULARITY', '#ffffff');
  for(const e of G.E) if(!e.dead) dmgEnemy(e, 3, 'nuke');
}

function explode(x, y, r, dmg, hurts){
  shock(x, y, r, '#ffb020', 6); burst(x, y, 34, '#ffb020', 420); burst(x, y, 14, '#ffffff', 260);
  AU.boom(false); shakeIt(8); G.flash = Math.max(G.flash, .25); G.flashCol = '#ffb020';
  for(const e of G.E) if(!e.dead && !e.phased && Math.hypot(e.x - x, e.y - y) < r + e.r) dmgEnemy(e, dmg, 'boom');
  if(hurts && Math.hypot(P.x - x, P.y - y) < r * .8 + P.r && !isFast()) hurtPlayer({ x, y });
}

function nearestEnemy(x, y, maxD, skip){
  let best = null, bd = maxD;
  for(const e of G.E){ if(e.dead || e === skip || e.phased) continue; const d = Math.hypot(e.x - x, e.y - y); if(d < bd){ bd = d; best = e; } }
  return best;
}

function hurtPlayer(src){
  if(P.inv > 0 || G.state !== 'play' || G.tut) return;
  P.hp--; P.inv = 1.4;
  const a = Math.atan2(P.y - src.y, P.x - src.x);
  P.vx = Math.cos(a) * 280; P.vy = Math.sin(a) * 280;
  G.air = false; G.chain = 0; G.airHits = 0;
  if(G.streak >= 3) pop(P.x, P.y - 50, 'STREAK LOST', '#ff3b5c', 18);
  G.streak = 0; G.mult = 1;
  AU.hurt(); shakeIt(16); G.flash = .7; G.flashCol = '#ff3b5c'; G.slowmo = .45;
  burst(P.x, P.y, 26, '#ff3b5c', 380);
  if(P.hp <= 0) die();
}

function die(){
  G.state = 'dying'; G.dieT = 1.3; aimCancel();
  AU.death(); shakeIt(22); G.flash = 1; G.flashCol = '#ff3b5c';
  burst(P.x, P.y, 90, skinCol(), 600); burst(P.x, P.y, 40, '#ffffff', 400);
  shock(P.x, P.y, 300, '#ff3b5c', 8);
  AU.setMusic(1, false);
}

/* ---------------- enemies ---------------- */
function updEnemies(dt){
  for(const e of G.E){
    if(e.dead) continue;
    e.t += dt; e.born += dt;
    if(e.hitCd > 0) e.hitCd -= dt;
    if(e.flash > 0) e.flash -= dt;
    if(e.burnCd > 0) e.burnCd -= dt;
    if(e.orbCd > 0) e.orbCd -= dt;
    if(e.type === 'boss'){ updBoss(e, dt); if(e.boss !== 'serpent'){ e.x += e.vx * dt; e.y += e.vy * dt; clampE(e); } continue; }
    const d0 = ET[e.type] || ET.drifter;
    const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
    const spd = d0.spd * G.spdMul * (1 + Math.min(G.wave, 30) * .015);
    const seek = (s, k) => { e.vx = lerp(e.vx, nx * s, Math.min(1, dt * k)); e.vy = lerp(e.vy, ny * s, Math.min(1, dt * k)); };
    switch(e.type){
      case 'dummy': e.vx *= .9; e.vy *= .9; e.y += Math.sin(e.t * 2) * .2; break;
      case 'shield': seek(spd, 2); e.face += clamp(angDiff(Math.atan2(dy, dx), e.face), -1.5 * dt, 1.5 * dt); break;
      case 'turret':
        e.vx *= .9; e.vy *= .9; e.face = Math.atan2(dy, dx); e.cd -= dt;
        if(e.cd <= 0){ e.cd = 2.5; G.B.push({ x:e.x + nx * e.r, y:e.y + ny * e.r, vx:nx * 175 * G.spdMul, vy:ny * 175 * G.spdMul, r:6, c:e.col }); AU.tone(700, .08, 'square', .04, 350); }
        break;
      case 'dasher':
        e.stT -= dt;
        if(e.st === 'walk'){ seek(spd, 2); if(e.stT <= 0){ e.st = 'aim'; e.stT = .7; e.dx = nx; e.dy = ny; } }
        else if(e.st === 'aim'){ e.vx *= .85; e.vy *= .85; e.face = Math.atan2(e.dy, e.dx); if(e.stT <= 0){ e.st = 'dash'; e.stT = .45; e.vx = e.dx * 640 * G.spdMul; e.vy = e.dy * 640 * G.spdMul; } }
        else { if(e.stT <= 0){ e.st = 'walk'; e.stT = gr(1.8, 2.8); } }
        break;
      case 'spiker': {
        const s = Math.hypot(e.vx, e.vy) || 1; e.vx = e.vx / s * spd; e.vy = e.vy / s * spd;
        e.vx += nx * 30 * dt; e.vy += ny * 30 * dt; break;
      }
      case 'ghost': {
        const cyc = (e.t % 3.4); const was = e.phased; e.phased = cyc > 2.0;
        if(was !== e.phased && !e.phased) e.flash = .1;
        seek(spd * (e.phased ? 1.4 : 1), 2); break;
      }
      case 'mini': seek(spd, 1.6); break;
      default: seek(spd, 2.2);
    }
    if(e.type !== 'shield' && e.type !== 'turret' && e.type !== 'dasher' && e.type !== 'dummy') e.face = Math.atan2(e.vy, e.vx);
    e.x += e.vx * dt; e.y += e.vy * dt;
    clampE(e);
  }
  // separation
  const E = G.E, n = E.length;
  for(let i = 0; i < n; i++){
    const a = E[i]; if(a.dead || a.type === 'boss') continue;
    for(let j = i + 1; j < n; j++){
      const b = E[j]; if(b.dead || b.type === 'boss') continue;
      const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
      if(d2 < rr * rr && d2 > .01){ const d = Math.sqrt(d2), o = (rr - d) * .5 / d; a.x -= dx * o; a.y -= dy * o; b.x += dx * o; b.y += dy * o; }
    }
  }
  if(G.E.some(e => e.dead)) G.E = G.E.filter(e => !e.dead);
}
function clampE(e){
  if(e.x < A.x0 + e.r){ e.x = A.x0 + e.r; e.vx = Math.abs(e.vx); }
  if(e.x > A.x1 - e.r){ e.x = A.x1 - e.r; e.vx = -Math.abs(e.vx); }
  if(e.y < A.y0 + e.r){ e.y = A.y0 + e.r; e.vy = Math.abs(e.vy); }
  if(e.y > A.y1 - e.r){ e.y = A.y1 - e.r; e.vy = -Math.abs(e.vy); }
}

function updBullets(dt){
  const fast = isFast();
  for(let i = G.B.length - 1; i >= 0; i--){
    const b = G.B[i];
    b.x += b.vx * dt; b.y += b.vy * dt;
    if(b.x < A.x0 || b.x > A.x1 || b.y < A.y0 || b.y > A.y1){ G.B.splice(i, 1); continue; }
    if(Math.hypot(b.x - P.x, b.y - P.y) < b.r + P.r){
      G.B.splice(i, 1);
      if(fast){ AU.parry(); sparks(b.x, b.y, b.c); addScore(25); ev('parry', 1); if(Math.random() < .5) pop(b.x, b.y - 14, 'SHATTER', '#3dffb0', 12); }
      else hurtPlayer(b);
      if(G.state !== 'play') return;
    }
  }
}

function updEcho(dt){
  for(let i = G.EC.length - 1; i >= 0; i--){
    const s = G.EC[i];
    s.life -= dt;
    const f = Math.exp(-1.2 * dt); s.vx *= f; s.vy *= f;
    s.x += s.vx * dt; s.y += s.vy * dt;
    if(s.x < A.x0 + s.r || s.x > A.x1 - s.r){ s.vx = -s.vx; s.x = clamp(s.x, A.x0 + s.r, A.x1 - s.r); }
    if(s.y < A.y0 + s.r || s.y > A.y1 - s.r){ s.vy = -s.vy; s.y = clamp(s.y, A.y0 + s.r, A.y1 - s.r); }
    if(s.life <= 0 || Math.hypot(s.vx, s.vy) < ST.vuln * .8){ burst(s.x, s.y, 6, skinCol(), 120); G.EC.splice(i, 1); continue; }
    for(const e of G.E){
      if(e.dead || e.phased || e.type === 'boss' || s.hit.has(e)) continue;
      if(Math.hypot(e.x - s.x, e.y - s.y) < e.r + s.r){
        s.hit.add(e);
        if(e.type === 'shield' || e.type === 'spiker'){ sparks(e.x, e.y, '#ffffff'); continue; }
        dmgEnemy(e, ST.dmg * .9, 'echo');
      }
    }
  }
}

function updPickups(dt){
  const mag = ST.magnet, all = G.clearT !== 0 || G.state !== 'play';
  for(let i = G.PK.length - 1; i >= 0; i--){
    const k = G.PK[i];
    k.life -= dt;
    const dx = P.x - k.x, dy = P.y - k.y, d = Math.hypot(dx, dy) || 1;
    if(all || d < mag){ const s = all ? 900 : 500 + (mag - d) * 4; k.vx = lerp(k.vx, dx / d * s, Math.min(1, dt * 8)); k.vy = lerp(k.vy, dy / d * s, Math.min(1, dt * 8)); }
    else { const f = Math.exp(-3 * dt); k.vx *= f; k.vy *= f; }
    k.x += k.vx * dt; k.y += k.vy * dt;
    if(d < P.r + 10){
      G.PK.splice(i, 1);
      const v = k.v * ST.greed; G.runShards += v; ev('shard', v); AU.pickup();
      continue;
    }
    if(k.life <= 0) G.PK.splice(i, 1);
  }
}

function updFlames(dt){
  if(!G.FL.length) return;
  const lvl = G.up.trail || 1;
  for(let i = G.FL.length - 1; i >= 0; i--){ const f = G.FL[i]; f.life -= dt; if(f.life <= 0) G.FL.splice(i, 1); }
  for(const e of G.E){
    if(e.dead || e.phased || e.burnCd > 0) continue;
    for(const f of G.FL){
      if(Math.abs(f.x - e.x) < e.r + 12 && Math.abs(f.y - e.y) < e.r + 12){ e.burnCd = .3; dmgEnemy(e, .3 * lvl, 'trail'); break; }
    }
  }
}

function updOrbit(dt){
  const n = G.up.orbit || 0; if(!n) return;
  G.orbA += dt * 4.5;
  const R = P.r + 30;
  for(let k = 0; k < n; k++){
    const a = G.orbA + k * TAU / n, bx = P.x + Math.cos(a) * R, by = P.y + Math.sin(a) * R;
    for(const e of G.E){
      if(e.dead || e.phased || e.orbCd > 0 || e.type === 'dummy') continue;
      if(Math.hypot(e.x - bx, e.y - by) < e.r + 9){
        e.orbCd = .35; e.vx += (e.x - P.x) * 3; e.vy += (e.y - P.y) * 3;
        sparks(bx, by, skinCol()); dmgEnemy(e, .6, 'orbit');
      }
    }
  }
}

/* ---------------- fx ---------------- */
function partCap(){ return G.q === 'low' ? 220 : 650; }
function part(x, y, vx, vy, life, c, s){ if(G.PT.length < partCap()) G.PT.push({ x, y, vx, vy, life, max:life, c, s }); }
function burst(x, y, n, c, spd){ if(G.q === 'low') n = Math.ceil(n * .45); for(let i = 0; i < n; i++){ const a = rnd(0, TAU), s = rnd(.2, 1) * spd; part(x, y, Math.cos(a) * s, Math.sin(a) * s, rnd(.3, .75), c, rnd(1.5, 4)); } }
function sparks(x, y, c){ burst(x, y, 8, c, 300); }
function shock(x, y, r, c, w){ if(G.SH.length < 24) G.SH.push({ x, y, r:4, max:r, life:.45, ml:.45, c, w }); }
function pop(x, y, txt, c, size){ if(G.POP.length > 18) G.POP.shift(); G.POP.push({ x, y, txt, c, size:size || 14, life:.95, vy:-60 }); }
function shakeIt(v){ if(save.opt.shake) G.shake = Math.min(24, G.shake + v); }
function tickFx(dt){
  for(let i = G.PT.length - 1; i >= 0; i--){ const p = G.PT[i]; p.life -= dt; if(p.life <= 0){ G.PT.splice(i, 1); continue; } const f = Math.exp(-3.2 * dt); p.vx *= f; p.vy *= f; p.x += p.vx * dt; p.y += p.vy * dt; }
  for(let i = G.SH.length - 1; i >= 0; i--){ const s = G.SH[i]; s.life -= dt; s.r = s.max * (1 - Math.pow(s.life / s.ml, 2.2)); if(s.life <= 0) G.SH.splice(i, 1); }
  for(let i = G.POP.length - 1; i >= 0; i--){ const p = G.POP[i]; p.life -= dt * (G.timeScale < .5 ? 2.2 : 1); p.y += p.vy * dt; p.vy *= .95; if(p.life <= 0) G.POP.splice(i, 1); }
  for(let i = G.ZP.length - 1; i >= 0; i--){ G.ZP[i].life -= dt; if(G.ZP[i].life <= 0) G.ZP.splice(i, 1); }
}

function skinCol(){
  const s = SKINS.find(k => k.id === save.skin) || SKINS[0];
  return s.col === 'prism' ? 'hsl(' + (((G.rt * 120) % 360 / 15 | 0) * 15) + ',100%,62%)' : s.col;
}

/* ---------------- trajectory preview ---------------- */
function predictPath(v){
  const pts = [], bnc = [];
  let x = P.x, y = P.y, vx = v.x * ST.launch * v.pow, vy = v.y * ST.launch * v.pow;
  const dt = 1 / 60;
  for(let i = 0; i < 80; i++){
    x += vx * dt; y += vy * dt;
    let b = false;
    if(x < A.x0 + P.r){ x = A.x0 + P.r; vx = Math.abs(vx); b = true; }
    else if(x > A.x1 - P.r){ x = A.x1 - P.r; vx = -Math.abs(vx); b = true; }
    if(y < A.y0 + P.r){ y = A.y0 + P.r; vy = Math.abs(vy); b = true; }
    else if(y > A.y1 - P.r){ y = A.y1 - P.r; vy = -Math.abs(vy); b = true; }
    if(b){ vx *= ST.wallKeep; vy *= ST.wallKeep; bnc.push({ x, y }); }
    const f = Math.exp(-dt); vx *= f; vy *= f;
    pts.push({ x, y });
    if(Math.hypot(vx, vy) < ST.vuln) break;
  }
  return { pts, bnc };
}

/* ---------------- missions / events ---------------- */
function ev(type, v){
  const r = G.runEv;
  const mt = MT.find(m => m.ev === type);
  if(!mt) return;
  if(mt.kind === 'sum') r[type] = (r[type] || 0) + v;
  else r[type] = Math.max(r[type] || 0, v);
  for(const m of save.missions){
    if(m.done || m.ev !== type) continue;
    const prog = mt.kind === 'sum' ? m.p + r[type] : Math.max(m.p, r[type]);
    if(prog >= m.n){
      m.done = true; m.p = m.n; m.fresh = true;
      save.shards += m.reward; save.missionsDone++;
      save.mTier[m.id] = (save.mTier[m.id] || 0) + 1;
      toast('MISSION COMPLETE', m.txt + '  <b class="gem">+' + m.reward + ' ◈</b>', '#b6ff3c', 3600);
      AU.levelUp(); persist();
    }
  }
}
function commitMissions(){
  for(const m of save.missions){
    if(m.done) continue;
    const mt = MT.find(t => t.id === m.id), r = G.runEv[m.ev] || 0;
    m.p = mt.kind === 'sum' ? m.p + r : Math.max(m.p, r);
  }
}
function rollMissions(){
  save.missions = save.missions.filter(m => !m.done);
  const have = new Set(save.missions.map(m => m.id));
  let guard = 0;
  while(save.missions.length < 3 && guard++ < 50){
    const t = pick(MT); if(have.has(t.id)) continue;
    const tier = save.mTier[t.id] || 0;
    const n = t.vals[Math.min(tier, t.vals.length - 1)] * (tier >= t.vals.length ? 1 + (tier - t.vals.length + 1) * .5 : 1);
    const nn = t.kind === 'max' && t.id === 'mult' ? Math.round(n * 10) / 10 : Math.round(n);
    save.missions.push({ id:t.id, ev:t.ev, n:nn, p:0, done:false, txt:t.txt(nn), reward:40 + tier * 35 });
    have.add(t.id); save.mNew = true;
  }
}
