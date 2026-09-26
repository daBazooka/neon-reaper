'use strict';
/* =====================================================================
   ECHO LEGION: simulation
   A giant clock hand sweeps the arena every 5 seconds. Each sweep, the
   last 5 seconds of your moves (dashes, slashes, slams) become an ECHO
   that replays them forever. Hit a foe together with an echo = SYNC.
   ===================================================================== */
const G = {
  state:'boot', t:0, rt:0, score:0, kills:0, syncs:0, combo:0, comboT:0, maxCombo:0, bestSync:0,
  E:[], EC:[], SH:[], CR:[], PT:[], SD:[], POP:[], FX:[], TM:[], RF:[], PK:[], HZ:[], KE:[], DC:[],
  wave:0, budget:0, spawnT:0, waveState:'intro', stateT:0,
  rec:[], recAcc:0, clock:0, echoId:0,
  ult:0, ultT:0, ultQ:null, hitstop:0, slow:0, timeScale:1, shake:0, flash:0, flashCol:'#fff', impact:0,
  up:{}, shardsRun:0, revived:false, daily:false, mod:null, camX:0, camY:0, camZ:1,
  tut:false, tutStep:0, tutT:0, runEv:{}, dieT:0, q:'high', multiT:0, multiN:0, vampN:0, dashId:0, boss:null, pendingCards:false,
};
let P = null;

/* ---------------- tuning ---------------- */
const modId = () => G.mod ? G.mod.id : '';
const spdMul = () => modId() === 'rush' ? 1.25 : 1;
const dmgMul = () => (1 + .22 * (G.up.edge || 0)) * (1 + .08 * (save.meta.power || 0));
const echoMul = () => .7 * (1 + .3 * (G.up.fury || 0));
const dashDist = () => 175 * (1 + .18 * (G.up.reach || 0));
const DASH_TIME = .13;
const dashCdMax = () => .34 * (1 - .15 * (G.up.swift || 0));
const slamCdMax = () => 4.6 * (1 - .18 * (G.up.slam || 0));
const slamR = () => 150 * (1 + .25 * (G.up.slam || 0));
const critCh = () => .08 + .1 * (G.up.crit || 0);
const maxEchoes = () => 3 + (G.up.legion || 0) + (save.meta.legion || 0) + (modId() === 'legion' ? 2 : 0);
const ultMul = () => (1 + .3 * (G.up.charge || 0)) * (1 + .12 * (save.meta.charge || 0));
const shardMul = () => (1 + .15 * (save.meta.luck || 0)) * (({ swarm:1.5, glass:2, rush:1.5 })[modId()] || 1);
function targetZoom(){ return clamp(Math.sqrt(W * H) / 720, .72, 1.6); }
function viewR(){ return Math.hypot(W, H) / 2 / G.camZ; }

/* ---------------- warp grid (the arena floor ripples with every blow) ---------------- */
const GS = 44, GN = Math.ceil(ARENA_R * 2 / GS) + 1;
const grid = { ox:new Float32Array(GN * GN), oy:new Float32Array(GN * GN), vx:new Float32Array(GN * GN), vy:new Float32Array(GN * GN) };
function gridReset(){ grid.ox.fill(0); grid.oy.fill(0); grid.vx.fill(0); grid.vy.fill(0); }
function gridImpulse(x, y, rad, f){
  const i0 = Math.max(0, Math.floor((x - rad + ARENA_R) / GS)), i1 = Math.min(GN - 1, Math.ceil((x + rad + ARENA_R) / GS));
  const j0 = Math.max(0, Math.floor((y - rad + ARENA_R) / GS)), j1 = Math.min(GN - 1, Math.ceil((y + rad + ARENA_R) / GS));
  for(let j = j0; j <= j1; j++) for(let i = i0; i <= i1; i++){
    const k = j * GN + i, px = -ARENA_R + i * GS, py = -ARENA_R + j * GS, dx = px - x, dy = py - y, d = Math.hypot(dx, dy) || 1;
    if(d > rad) continue;
    const s = f * (1 - d / rad); grid.vx[k] += dx / d * s; grid.vy[k] += dy / d * s;
  }
}
function gridTick(dt){
  const n = GN * GN, k = 55, damp = Math.exp(-6 * dt);
  for(let i = 0; i < n; i++){
    grid.vx[i] = (grid.vx[i] - grid.ox[i] * k * dt) * damp; grid.vy[i] = (grid.vy[i] - grid.oy[i] * k * dt) * damp;
    grid.ox[i] += grid.vx[i] * dt; grid.oy[i] += grid.vy[i] * dt;
  }
}

/* ---------------- run lifecycle ---------------- */
function newRun(daily){
  G.daily = !!daily;
  if(daily){ const seed = hashStr('echolegion:' + todayKey()); grng = mulberry32(seed); G.mod = MODS[seed % MODS.length]; }
  else { grng = Math.random; G.mod = null; }
  for(const k of ['E','EC','SH','CR','PT','SD','POP','FX','TM','RF','PK','HZ','KE','DC','rec']) G[k].length = 0;
  Object.assign(G, { t:0, score:0, kills:0, syncs:0, combo:0, comboT:0, maxCombo:0, bestSync:0, wave:0, budget:0, spawnT:0, waveState:'intro', stateT:1.2,
    recAcc:0, clock:0, echoId:0, ult:0, ultT:0, ultQ:null, hitstop:0, slow:0, timeScale:1, shake:0, flash:0, impact:0,
    up:{}, shardsRun:0, revived:false, runEv:{}, dieT:0, multiT:0, multiN:0, vampN:0, dashId:0, boss:null, pendingCards:false });
  const hp = modId() === 'glass' ? 1 : 5 + (save.meta.heart || 0);
  P = { x:0, y:120, vx:0, vy:0, r:17, hp, maxHp:hp, inv:1, ang:-Math.PI / 2, dashT:0, dashCd:0, dv:[0, 0], dashHit:null, slamCd:0, trail:[], pendEv:null };
  G.camX = P.x; G.camY = P.y; G.camZ = targetZoom();
  gridReset();
  G.tut = !save.tut; G.tutStep = 0; G.tutT = 0;
  G.state = 'play';
  if(G.tut) tip(isTouch() ? '<b>TAP</b> where you want to strike: you <em>DASH-SLASH</em> there. Drag to move.' : '<b>CLICK</b> to <em>DASH-SLASH</em> toward the cursor. The mouse or WASD moves you.');
  AU.setMusic(1);
}

/* ---------------- input ---------------- */
const IN = { mx:0, my:0, mouse:false, keys:{}, joy:null };
function inputVec(){
  if(G.state === 'menuplay') return G.menuIn || [0, 0];
  let x = 0, y = 0; const k = IN.keys;
  if(k.a || k.arrowleft) x -= 1; if(k.d || k.arrowright) x += 1; if(k.w || k.arrowup) y -= 1; if(k.s || k.arrowdown) y += 1;
  if(x || y){ const l = Math.hypot(x, y); return [x / l, y / l]; }
  if(IN.joy && IN.joy.on && IN.joy.moved){ const dx = IN.joy.x - IN.joy.ox, dy = IN.joy.y - IN.joy.oy, l = Math.hypot(dx, dy); if(l < 8) return [0, 0]; const m = Math.min(1, l / 60); return [dx / l * m, dy / l * m]; }
  if(IN.mouse){
    const wx = (IN.mx - W / 2) / G.camZ + G.camX, wy = (IN.my - H / 2) / G.camZ + G.camY;
    const dx = wx - P.x, dy = wy - P.y, l = Math.hypot(dx, dy), dead = 34 / G.camZ;
    if(l < dead) return [0, 0];
    const m = Math.min(1, (l - dead) / (110 / G.camZ)); return [dx / l * m, dy / l * m];
  }
  return [0, 0];
}
function aimWorld(){ return [(IN.mx - W / 2) / G.camZ + G.camX, (IN.my - H / 2) / G.camZ + G.camY]; }
// dash-slash toward a world point (or straight ahead)
function tryDash(tx, ty){
  if(G.state !== 'play' || G.ultT > 0 || P.dashCd > 0 || P.dashT > 0) return;
  let dx, dy;
  if(tx !== undefined){ dx = tx - P.x; dy = ty - P.y; } else { dx = Math.cos(P.ang); dy = Math.sin(P.ang); }
  const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
  const dist = Math.min(dashDist(), Math.max(90, l + 30));
  P.dv = [dx * dist / DASH_TIME, dy * dist / DASH_TIME]; P.ang = Math.atan2(dy, dx);
  P.dashT = DASH_TIME; P.dashCd = dashCdMax(); P.inv = Math.max(P.inv, DASH_TIME + .06);
  P.dashHit = new Set(); G.dashId++;
  AU.dash();
  gridImpulse(P.x, P.y, 110, 260);
}
function trySlam(){
  if(G.state !== 'play' || G.ultT > 0 || P.slamCd > 0) return;
  P.slamCd = slamCdMax(); P.pendEv = 'm';
  slam(P.x, P.y, 0, 1);
  if(G.tut && G.tutStep === 3){ G.tutStep = 4; G.tutT = 0; tip(null); }
}

/* ---------------- main update ---------------- */
function update(dt){
  G.rt += dt;
  G.shake = Math.max(0, G.shake - dt * 40); G.flash = Math.max(0, G.flash - dt * 3); if(G.impact > 0) G.impact -= dt;
  if(G.hitstop > 0){ G.hitstop -= dt; tickFx(dt * .15); return; }
  const target = G.state === 'dying' ? .2 : G.slow > 0 ? .28 : 1;
  G.timeScale = lerp(G.timeScale, target, Math.min(1, dt * 10));
  if(G.slow > 0) G.slow -= dt;
  const gdt = dt * G.timeScale * spdMul();
  gridTick(dt);
  if(G.state === 'dying'){ G.dieT -= dt; tickFx(gdt); updEnemies(gdt); if(G.dieT <= 0) onDeathDone(); return; }
  if(G.ultT > 0){ updUlt(dt); tickFx(dt); updCamera(dt); return; }
  G.t += gdt;
  updPlayer(gdt);
  record(gdt);
  updEchoes(gdt);
  updEnemies(gdt);
  updShots(gdt);
  updHazards(gdt);
  updPickups(gdt);
  updWave(gdt);
  for(let i = G.TM.length - 1; i >= 0; i--){ const t = G.TM[i]; t.t -= gdt; if(t.t <= 0){ G.TM.splice(i, 1); t.f(); } }
  tickFx(gdt);
  if(G.comboT > 0){ G.comboT -= gdt; if(G.comboT <= 0) G.combo = 0; }
  if(G.multiT > 0){ G.multiT -= gdt; if(G.multiT <= 0) G.multiN = 0; }
  updCamera(dt);
  // tutorial
  if(G.tut){
    G.tutT += dt;
    if(G.tutStep === 0 && G.kills >= 3){ G.tutStep = 1; G.tutT = 0; tip('Watch the <b>clock hand</b>. When it hits the top, your past self joins as an <em>ECHO</em>!'); }
    else if(G.tutStep === 1 && G.EC.length > 0){ G.tutStep = 2; G.tutT = 0; tip('Your echo <b>repeats your last 5 seconds</b>. Hit a foe together with it for a <em>SYNC STRIKE</em>!'); }
    else if(G.tutStep === 2 && (G.syncs > 0 || G.tutT > 9)){ G.tutStep = 3; G.tutT = 0; tip(isTouch() ? 'Tap <b>SLAM</b> to smash everything around you.' : '<b>RIGHT CLICK</b> or <b>SPACE</b> to <em>SLAM</em> everything around you.'); }
    else if(G.tutStep === 3 && G.tutT > 8){ G.tutStep = 4; tip(null); }
    else if(G.tutStep === 4 && G.ult >= 100){ G.tutStep = 5; tip('<em>LEGION</em> is ready! ' + (isTouch() ? 'Tap the <b>LEGION</b> button.' : 'Press <b>E</b> or <b>SHIFT</b>.')); }
    else if(G.tutStep === 5 && G.runEv.ult){ G.tut = false; save.tut = true; persist(); tip(null); }
  }
}
function updCamera(dt){
  G.camZ = lerp(G.camZ, targetZoom() * (G.boss ? .9 : 1), Math.min(1, dt * 2));
  let lx = 0, ly = 0;
  if(IN.mouse && G.state === 'play'){ const [ax, ay] = aimWorld(); lx = clamp((ax - P.x) * .12, -80, 80); ly = clamp((ay - P.y) * .12, -80, 80); }
  G.camX = lerp(G.camX, P.x + lx, Math.min(1, dt * 6)); G.camY = lerp(G.camY, P.y + ly, Math.min(1, dt * 6));
}

function updPlayer(dt){
  if(P.inv > 0) P.inv -= dt;
  if(P.dashCd > 0) P.dashCd -= dt;
  if(P.slamCd > 0) P.slamCd -= dt;
  if(P.dashT > 0){
    const ox = P.x, oy = P.y, step = Math.min(dt, P.dashT);
    P.x += P.dv[0] * step; P.y += P.dv[1] * step; P.dashT -= dt;
    arenaClamp(P);
    dashSweep(ox, oy, P.x, P.y, 0, 1, P.dashHit);
    if(G.up.trail) G.HZ.push({ kind:'trail', x1:ox, y1:oy, x2:P.x, y2:P.y, life:1.1 });
    P.trail.push({ x:P.x, y:P.y, a:P.ang, life:.22 });
    if(P.dashT <= 0){ P.vx = P.dv[0] * .12; P.vy = P.dv[1] * .12; P.pendEv = 's'; slashArc(P.x, P.y, P.ang, 0, 1); }
  } else {
    const [ix, iy] = inputVec(), sp = 300;
    P.vx = lerp(P.vx, ix * sp, Math.min(1, dt * 12)); P.vy = lerp(P.vy, iy * sp, Math.min(1, dt * 12));
    P.x += P.vx * dt; P.y += P.vy * dt; arenaClamp(P);
    if(Math.hypot(P.vx, P.vy) > 30) P.ang = Math.atan2(P.vy, P.vx);
    if(IN.mouse && G.state === 'play'){ const [ax, ay] = aimWorld(); P.ang = Math.atan2(ay - P.y, ax - P.x); }
  }
  for(let i = P.trail.length - 1; i >= 0; i--){ P.trail[i].life -= dt; if(P.trail[i].life <= 0) P.trail.splice(i, 1); }
}
function arenaClamp(o){ const l = Math.hypot(o.x, o.y), lim = ARENA_R - (o.r || 15); if(l > lim){ o.x *= lim / l; o.y *= lim / l; } }

/* ---------------- recording & echoes ---------------- */
function record(dt){
  G.recAcc += dt;
  while(G.recAcc >= 1 / REC_HZ){
    G.recAcc -= 1 / REC_HZ;
    G.rec.push({ x:P.x, y:P.y, a:P.ang, d:P.dashT > 0 ? 1 : 0, ev:P.pendEv }); P.pendEv = null;
    if(G.rec.length > ECHO_T * REC_HZ) G.rec.shift();
  }
  G.clock += dt;
  if(G.clock >= ECHO_T){ G.clock -= ECHO_T; spawnEcho(); }
}
function spawnEcho(){
  if(G.rec.length < REC_HZ * 2) return;
  const clip = G.rec.slice(), f = clip[0];
  if(G.EC.length >= maxEchoes()){ const old = G.EC.shift(); echoGone(old, false); }
  const e = { id:++G.echoId, clip, i:0, acc:0, x:f.x, y:f.y, px:f.x, py:f.y, a:f.a, born:.5, hit:new Set(), glitch:.3 };
  G.EC.push(e);
  AU.echo(); gridImpulse(0, 0, ARENA_R * 1.1, 160);
  G.FX.push({ ring:true, x:f.x, y:f.y, r:0, max:90, life:.4, max0:.4, c:echoCol() });
  pop(f.x, f.y - 40, 'ECHO ' + ROMAN[Math.min(7, G.EC.length - 1)], echoCol(), 16);
}
function echoGone(e, eaten){
  for(let k = 0; k < 16; k++) part(e.x, e.y, rnd(-260, 260), rnd(-260, 260), rnd(.3, .7), echoCol(), rnd(2, 5));
  if(G.up.bomb) slam(e.x, e.y, e.id, 1.1);
  if(eaten){ AU.glass(); pop(e.x, e.y - 30, 'ECHO LOST', '#8a5cff', 16); shakeIt(6); }
}
function updEchoes(dt){
  const mul = echoMul(), step = 1 / REC_HZ;
  for(const e of G.EC){
    if(e.born > 0) e.born -= dt; if(e.glitch > 0) e.glitch -= dt;
    e.acc += dt;
    while(e.acc >= step){
      e.acc -= step;
      const prev = e.clip[e.i];
      e.i = (e.i + 1) % e.clip.length;
      const f = e.clip[e.i];
      if(e.i === 0){ e.glitch = .2; e.hit = new Set(); continue; }   // loop: it rewinds to the start of its clip
      if(f.d && !prev.d) e.hit = new Set();
      if(f.d) dashSweep(prev.x, prev.y, f.x, f.y, e.id, mul, e.hit);
      if(f.ev === 's') slashArc(f.x, f.y, f.a, e.id, mul);
      else if(f.ev === 'm') slam(f.x, f.y, e.id, mul);
    }
    const a = e.clip[e.i], b = e.clip[(e.i + 1) % e.clip.length], k = e.acc * REC_HZ;
    if(e.i === e.clip.length - 1){ e.x = a.x; e.y = a.y; } else { e.x = lerp(a.x, b.x, k); e.y = lerp(a.y, b.y, k); }
    e.a = a.a; e.d = a.d;
  }
}

/* ---------------- attacks ---------------- */
function dashSweep(x1, y1, x2, y2, src, mul, hitSet){
  for(const e of G.E){
    if(e.dead || e.born > 0 || e.air || (hitSet && hitSet.has(e))) continue;
    const rr = e.r + 20;
    if(segD2(e.x, e.y, x1, y1, x2, y2) < rr * rr){
      if(hitSet) hitSet.add(e);
      const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
      damage(e, 24 * mul * dmgMul(), src, dx / l, dy / l);
    }
  }
}
function slashArc(x, y, ang, src, mul){
  const R = 82, spread = 1.25;
  G.FX.push({ arc:true, x, y, a:ang, r:R, life:.2, max0:.2, src });
  for(const e of G.E){
    if(e.dead || e.born > 0 || e.air) continue;
    const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy);
    if(d > R + e.r || Math.abs(angDiff(Math.atan2(dy, dx), ang)) > spread) continue;
    damage(e, 20 * mul * dmgMul(), src, dx / (d || 1), dy / (d || 1));
  }
  // slashes parry enemy bolts
  for(const s of G.SH){ const dx = s.x - x, dy = s.y - y, d = Math.hypot(dx, dy); if(d < R + 10 && Math.abs(angDiff(Math.atan2(dy, dx), ang)) < spread){ s.dead = true; for(let k = 0; k < 6; k++) part(s.x, s.y, rnd(-200, 200), rnd(-200, 200), .3, '#ffffff', 3); if(src === 0){ AU.parry(); pop(s.x, s.y - 16, 'PARRY', '#ffffff', 13); } } }
  if(G.up.wave) G.CR.push({ x, y, vx:Math.cos(ang) * 720, vy:Math.sin(ang) * 720, a:ang, life:.45 * (1 + .3 * (G.up.wave - 1)), src, mul, hit:new Set() });
  if(src === 0) AU.slash();
}
function slam(x, y, src, mul){
  const R = slamR();
  G.FX.push({ ring:true, x, y, r:0, max:R, life:.35, max0:.35, c:src ? echoCol() : '#ffffff', thick:10 });
  G.FX.push({ ring:true, x, y, r:0, max:R * .6, life:.25, max0:.25, c:src ? echoCol() : skinCol() });
  gridImpulse(x, y, R * 1.6, 700);
  for(let k = 0; k < 24; k++){ const a = rnd(0, TAU), s = rnd(200, 520); part(x, y, Math.cos(a) * s, Math.sin(a) * s, rnd(.25, .5), src ? echoCol() : '#ffffff', rnd(2, 5)); }
  for(const e of G.E){
    if(e.dead || e.born > 0 || e.air) continue;
    const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy);
    if(d > R + e.r) continue;
    damage(e, 38 * mul * dmgMul(), src, dx / (d || 1), dy / (d || 1), 2.2);
  }
  shakeIt(src ? 4 : 10); AU.slam(!!src);
}
function damage(e, amt, src, kx, ky, kb, noSync){
  if(e.dead) return;
  if(e.shield > 0){ e.shield--; e.flash = .1; G.FX.push({ ring:true, x:e.x, y:e.y, r:0, max:e.r * 1.8, life:.25, max0:.25, c:'#39d0ff' }); AU.clang(); return; }
  const now = G.t;
  let sync = 0;
  if(!noSync){
    e.hits = (e.hits || []).filter(h => now - h.t < 1.2);
    const others = new Set(e.hits.filter(h => h.s !== src).map(h => h.s));
    sync = others.size;
    e.hits.push({ s:src, t:now }); if(src > 0) e.mark = 1.2;
  }
  const crit = Math.random() < critCh();
  if(crit) amt *= 2;
  if(sync){
    amt *= 1.5 + .5 * sync; G.syncs++; ev('sync', 1); G.bestSync = Math.max(G.bestSync, sync + 1);
    G.score += 25 * sync;
    const lbl = sync >= 3 ? 'LEGION SYNC!' : sync === 2 ? 'TRIPLE SYNC!' : 'SYNC!';
    pop(e.x, e.y - e.r - 26, lbl, sync >= 2 ? '#ff3cac' : '#39ffb4', 18 + sync * 4);
    AU.sync(sync);
    G.FX.push({ ring:true, x:e.x, y:e.y, r:0, max:90 + 30 * sync, life:.3, max0:.3, c:'#39ffb4', thick:6 });
    gridImpulse(e.x, e.y, 200, 500);
    if(sync >= 2){ G.slow = Math.max(G.slow, .25); shakeIt(8); }
    if(sync >= 3 && save.opt.flash) G.impact = .05;
    if(G.up.storm) chainLightning(e, 4);
    if(G.tut && G.tutStep === 2){ G.tutStep = 3; G.tutT = 0; tip(isTouch() ? 'Tap <b>SLAM</b> to smash everything around you.' : '<b>RIGHT CLICK</b> or <b>SPACE</b> to <em>SLAM</em> everything around you.'); }
  }
  e.hp -= amt; e.flash = .09; e.lastA = Math.atan2(ky, kx);
  G.FX.push({ spark:true, x:e.x - kx * e.r * .6, y:e.y - ky * e.r * .6, life:.12, max0:.12, s:crit || sync ? 1.8 : 1 });
  const kbm = (kb || 1) * (e.boss ? .08 : e.type === 'brute' ? .35 : 1);
  e.vx += kx * 320 * kbm; e.vy += ky * 320 * kbm;
  if(!e.boss && e.st !== 'charge'){ e.x += kx * 6 * kbm; e.y += ky * 6 * kbm; }
  G.combo++; G.comboT = 2.4; G.maxCombo = Math.max(G.maxCombo, G.combo); ev('combo', G.combo);
  G.ult = Math.min(100, G.ult + amt * .045 * ultMul() * (src ? .6 : 1));
  if(src === 0 || sync) G.hitstop = Math.max(G.hitstop, crit || sync ? .06 : .03);
  pop(e.x + rnd(-10, 10), e.y - e.r - 8, Math.round(amt) + (crit ? '!' : ''), crit ? '#ffd23c' : sync ? '#39ffb4' : '#ffffff', crit ? 20 : 14);
  for(let k = 0; k < (crit ? 10 : 5); k++) part(e.x, e.y, kx * rnd(150, 450) + rnd(-120, 120), ky * rnd(150, 450) + rnd(-120, 120), rnd(.15, .35), pick(['#ffffff', e.d.col]), rnd(2, 4));
  if(src === 0) AU.hit(crit);
  if(e.hp <= 0) kill(e, src);
}
function chainLightning(from, n){
  let cur = from; const hit = new Set([from]);
  for(let i = 0; i < n; i++){
    let best = null, bd = 260 * 260;
    for(const e of G.E){ if(e.dead || hit.has(e)) continue; const d = (e.x - cur.x) ** 2 + (e.y - cur.y) ** 2; if(d < bd){ bd = d; best = e; } }
    if(!best) break;
    G.FX.push({ bolt:true, x1:cur.x, y1:cur.y, x2:best.x, y2:best.y, life:.2, max0:.2 });
    hit.add(best); damage(best, 18 * dmgMul(), -1, 0, 0, 0, true); cur = best;
  }
  AU.zap();
}
function kill(e, src){
  e.dead = true;
  const big = e.boss || e.type === 'brute';
  G.kills++; ev('kill', 1);
  G.multiN++; G.multiT = 1; ev('multi', G.multiN);
  const MK = { 3:'TRIPLE KILL', 5:'RAMPAGE', 8:'MASSACRE', 12:'ANNIHILATION', 16:'GODLIKE', 24:'LEGENDARY' };
  if(MK[G.multiN]){ announce(MK[G.multiN], G.multiN >= 12 ? '#ff3cac' : G.multiN >= 8 ? '#ff3860' : '#ffd23c'); AU.announce(G.multiN); if(G.multiN >= 8) SDK.happytime(); }
  G.score += Math.round((e.boss ? 3000 : e.d.cost * 12) * (1 + G.combo * .02));
  // shatter into glowing shards
  const n = e.boss ? 60 : big ? 26 : 14;
  for(let k = 0; k < n; k++){ const a = rnd(0, TAU), s = rnd(120, e.boss ? 700 : 420); G.SD.push({ x:e.x, y:e.y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, a:rnd(0, TAU), va:rnd(-14, 14), s:rnd(4, big ? 13 : 8), life:rnd(.5, 1.1), max:1.1, c:Math.random() < .3 ? '#ffffff' : e.d.col }); }
  if(G.SD.length > 500) G.SD.splice(0, G.SD.length - 500);
  G.FX.push({ ring:true, x:e.x, y:e.y, r:0, max:e.r * 3.5, life:.3, max0:.3, c:e.d.col, thick:5 });
  const ca = e.lastA !== undefined ? e.lastA : rnd(0, TAU);
  G.FX.push({ cut:true, x:e.x, y:e.y, a:ca + rnd(-.3, .3), l:e.r * 4.5, life:.28, max0:.28 });
  G.DC.push({ x:e.x, y:e.y, r:e.r * (big ? 2.4 : 1.8), life:7, c:e.d.col, seed:(Math.random() * 1e9) | 0 }); if(G.DC.length > 50) G.DC.shift();
  gridImpulse(e.x, e.y, big ? 260 : 150, big ? 900 : 420);
  shakeIt(big ? 10 : 3);
  AU.kill(big);
  // drops
  const shards = e.boss ? 40 : e.d.cost;
  for(let k = 0; k < Math.min(8, shards); k++) G.PK.push({ x:e.x, y:e.y, vx:rnd(-160, 160), vy:rnd(-160, 160), kind:'shard', v:shards / Math.min(8, shards), t:0 });
  if(!e.boss && P.hp < P.maxHp && Math.random() < .035 && !G.PK.some(p => p.kind === 'heart')) G.PK.push({ x:e.x, y:e.y, vx:0, vy:0, kind:'heart', v:1, t:0 });
  if(e.d.split) for(let k = 0; k < 3; k++){ const a = k / 3 * TAU; const c = spawnEnemy('drone', e.x + Math.cos(a) * 20, e.y + Math.sin(a) * 20); c.born = 0; c.vx = Math.cos(a) * 260; c.vy = Math.sin(a) * 260; }
  if(G.up.vamp){ G.vampN++; if(G.vampN >= 20){ G.vampN = 0; if(P.hp < P.maxHp){ P.hp++; pop(P.x, P.y - 40, '+1 ♥', '#ff3cac', 18); } } }
  if(e.boss) bossDown(e);
}

/* ---------------- enemies ---------------- */
function spawnEnemy(type, x, y){
  const d = ET[type], hpk = 1 + .13 * (G.wave - 1);
  const e = { type, d, x, y, vx:0, vy:0, r:d.r, hp:d.hp * hpk, maxHp:d.hp * hpk, t:0, cd:gr(1, 2.5), st:'walk', stT:0, born:.45, flash:0, shield:0, ph:grng() * TAU };
  G.E.push(e);
  if(d.tip && !save.seen[type] && G.state === 'play'){ save.seen[type] = true; persist(); G.TM.push({ t:.8, f:() => { if(G.state === 'play') tip(d.tip); G.TM.push({ t:5.5, f:() => { if(!G.tut) tip(null); } }); } }); }
  return e;
}
function nearestEcho(x, y){ let best = null, bd = 1e12; for(const c of G.EC){ const d = (c.x - x) ** 2 + (c.y - y) ** 2; if(d < bd){ bd = d; best = c; } } return best; }
function updEnemies(dt){
  const frozen = G.ultT > 0;
  for(const e of G.E){
    if(e.dead) continue;
    e.t += dt; if(e.flash > 0) e.flash -= dt;
    if(e.born > 0){ e.born -= dt; continue; }
    if(frozen) continue;
    if(e.boss){ updBoss(e, dt); continue; }
    let tx = P.x, ty = P.y;
    if(e.d.eats){ const c = nearestEcho(e.x, e.y); if(c){ tx = c.x; ty = c.y; if(Math.hypot(c.x - e.x, c.y - e.y) < e.r + 14){ G.EC.splice(G.EC.indexOf(c), 1); echoGone(c, true); } } }
    const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
    let spd = e.d.spd * Math.min(1, .6 + G.t / 40);
    e.cd -= dt;
    if(e.d.shoot){
      const want = 290, k = d > want + 40 ? 1 : d < want - 40 ? -.8 : 0;
      e.vx = lerp(e.vx, (nx * k - ny * .4) * spd, Math.min(1, dt * 2)); e.vy = lerp(e.vy, (ny * k + nx * .4) * spd, Math.min(1, dt * 2));
      if(e.st === 'walk' && e.cd <= 0 && d < 620){ e.st = 'wind'; e.stT = .55; }
      if(e.st === 'wind'){ e.vx *= .9; e.vy *= .9; e.stT -= dt; if(e.stT <= 0){ e.st = 'walk'; e.cd = gr(2.2, 3); const a = Math.atan2(ny, nx); for(let k2 = -1; k2 <= 1; k2++) G.SH.push({ x:e.x, y:e.y, vx:Math.cos(a + k2 * .26) * 250, vy:Math.sin(a + k2 * .26) * 250, r:8, life:4 }); AU.bolt(); } }
    } else if(e.d.charge){
      if(e.st === 'walk'){ e.vx = lerp(e.vx, nx * spd, Math.min(1, dt * 2)); e.vy = lerp(e.vy, ny * spd, Math.min(1, dt * 2)); if(e.cd <= 0 && d < 360){ e.st = 'wind'; e.stT = .7; e.ca = Math.atan2(ny, nx); } }
      else if(e.st === 'wind'){ e.vx *= .85; e.vy *= .85; e.ca = Math.atan2(ny, nx) * .15 + e.ca * .85; e.stT -= dt; if(e.stT <= 0){ e.st = 'charge'; e.stT = .55; e.vx = Math.cos(e.ca) * 560; e.vy = Math.sin(e.ca) * 560; AU.charge(); } }
      else if(e.st === 'charge'){ e.stT -= dt; if(Math.random() < dt * 40) part(e.x, e.y, rnd(-40, 40), rnd(-40, 40), .3, '#ff7a1a', 4); if(e.stT <= 0){ e.st = 'walk'; e.cd = gr(2, 3); } }
    } else if(e.d.leap){
      if(e.st === 'walk'){ e.vx = lerp(e.vx, nx * spd, Math.min(1, dt * 2)); e.vy = lerp(e.vy, ny * spd, Math.min(1, dt * 2)); if(e.cd <= 0 && d < 400){ e.st = 'air'; e.stT = .95; e.air = true; e.jx0 = e.x; e.jy0 = e.y; e.jx = P.x + P.vx * .5; e.jy = P.y + P.vy * .5; const l = Math.hypot(e.jx, e.jy); if(l > ARENA_R - 30){ e.jx *= (ARENA_R - 30) / l; e.jy *= (ARENA_R - 30) / l; } } }
      else if(e.st === 'air'){
        e.stT -= dt; const k = 1 - e.stT / .95; e.x = lerp(e.jx0, e.jx, k); e.y = lerp(e.jy0, e.jy, k); e.vx = e.vy = 0;
        if(e.stT <= 0){ e.st = 'walk'; e.air = false; e.cd = gr(2.2, 3.2); G.FX.push({ ring:true, x:e.x, y:e.y, r:0, max:70, life:.3, max0:.3, c:'#ffd000', thick:6 }); gridImpulse(e.x, e.y, 150, 500); AU.land(); if(Math.hypot(P.x - e.x, P.y - e.y) < 70 + P.r) hurt(1, e.x, e.y); }
        continue;
      }
    } else if(e.d.shields){
      const want = 230, k = d > want + 30 ? 1 : d < want - 30 ? -.7 : 0;
      e.vx = lerp(e.vx, nx * k * spd, Math.min(1, dt * 2)); e.vy = lerp(e.vy, ny * k * spd, Math.min(1, dt * 2));
      if(e.cd <= 0){ e.cd = 3.2; let n = 0; for(const o of G.E){ if(o === e || o.dead || o.boss || o.shield > 0 || n >= 3) continue; if(Math.hypot(o.x - e.x, o.y - e.y) < 260){ o.shield = 1; n++; G.FX.push({ bolt:true, x1:e.x, y1:e.y, x2:o.x, y2:o.y, life:.25, max0:.25, c:'#39d0ff' }); } } }
    } else {
      const wob = e.type === 'drone' ? Math.sin(e.t * 3 + e.ph) * .35 : 0;
      e.vx = lerp(e.vx, (nx - ny * wob) * spd, Math.min(1, dt * 2.5)); e.vy = lerp(e.vy, (ny + nx * wob) * spd, Math.min(1, dt * 2.5));
    }
    e.x += e.vx * dt; e.y += e.vy * dt;
    if(e.st !== 'charge'){ const f = Math.exp(-1.5 * dt); if(Math.hypot(e.vx, e.vy) > spd * 1.3){ e.vx *= f; e.vy *= f; } }
    arenaClamp(e);
    // contact bites need a moment of touching (charges hit at once), so grazes are forgivable
    if(G.state === 'play' && Math.hypot(P.x - e.x, P.y - e.y) < e.r + P.r * .75){ e.touch = (e.touch || 0) + dt; if(e.st === 'charge' || e.touch > .14){ e.touch = 0; hurt(e.st === 'charge' ? 2 : 1, e.x, e.y); } }
    else if(e.touch) e.touch = Math.max(0, e.touch - dt);
  }
  // separation
  const E = G.E, n = E.length;
  for(let i = 0; i < n; i++){
    const a = E[i]; if(a.dead || a.air) continue;
    for(let j = i + 1; j < n; j++){
      const b = E[j]; if(b.dead || b.air) continue;
      const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
      if(d2 < rr * rr && d2 > .01){ const d = Math.sqrt(d2), o = (rr - d) / d * .3, wa = a.boss ? 0 : b.boss ? 1 : b.r / (a.r + b.r); a.x -= dx * o * wa; a.y -= dy * o * wa; b.x += dx * o * (1 - wa); b.y += dy * o * (1 - wa); }
    }
  }
  if(E.some(e => e.dead)) G.E = E.filter(e => !e.dead);
}
function updShots(dt){
  for(let i = G.SH.length - 1; i >= 0; i--){
    const s = G.SH[i];
    if(G.ultT <= 0){ s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; }
    if(s.dead || s.life <= 0 || s.x * s.x + s.y * s.y > (ARENA_R + 40) ** 2){ G.SH.splice(i, 1); continue; }
    if(G.state === 'play' && (s.x - P.x) ** 2 + (s.y - P.y) ** 2 < (s.r + P.r * .8) ** 2){ if(P.inv <= 0){ G.SH.splice(i, 1); hurt(1, s.x, s.y); } }
  }
  for(let i = G.CR.length - 1; i >= 0; i--){
    const c = G.CR[i];
    c.x += c.vx * dt; c.y += c.vy * dt; c.life -= dt;
    if(c.life <= 0){ G.CR.splice(i, 1); continue; }
    for(const e of G.E){ if(e.dead || e.born > 0 || e.air || c.hit.has(e)) continue; if((e.x - c.x) ** 2 + (e.y - c.y) ** 2 < (e.r + 30) ** 2){ c.hit.add(e); damage(e, 16 * c.mul * dmgMul(), c.src, c.vx / 720, c.vy / 720, .6); } }
  }
}
function updHazards(dt){
  for(let i = G.HZ.length - 1; i >= 0; i--){
    const h = G.HZ[i];
    h.life -= dt;
    if(h.kind === 'trail'){
      for(const e of G.E){ if(e.dead || e.born > 0 || e.air || (e.trailT || 0) > G.t) continue; if(segD2(e.x, e.y, h.x1, h.y1, h.x2, h.y2) < (e.r + 10) ** 2){ e.trailT = G.t + .35; damage(e, 7 * dmgMul(), -2, 0, 0, 0, true); } }
    } else if(h.kind === 'blade'){
      // the Metronome's pendulum: telegraph, then a sweeping line
      h.t += dt;
      if(h.t > h.tel){ const k = Math.min(1, (h.t - h.tel) / h.dur); h.a = h.a0 + h.sw * k; const x2 = h.x + Math.cos(h.a) * h.len, y2 = h.y + Math.sin(h.a) * h.len; if(G.state === 'play' && segD2(P.x, P.y, h.x, h.y, x2, y2) < (P.r + 16) ** 2) hurt(2, h.x, h.y); if(!h.snd){ h.snd = true; AU.sweep(); } }
      if(h.t > h.tel + h.dur + .15) h.life = 0;
    } else if(h.kind === 'pulse'){
      h.r += h.spd * dt;
      const d = Math.hypot(P.x - h.x, P.y - h.y);
      if(!h.hitP && G.state === 'play' && Math.abs(d - h.r) < 16 + P.r * .5 && P.inv <= 0){ h.hitP = true; hurt(1, h.x, h.y); }
      if(h.r > ARENA_R * 2) h.life = 0;
    } else if(h.kind === 'kdash'){
      // the Hollow King's own echoes replaying its charges
      h.t += dt;
      if(h.t > h.tel){ const k = Math.min(1, (h.t - h.tel) / .28); h.cx = lerp(h.x1, h.x2, k); h.cy = lerp(h.y1, h.y2, k); if(G.state === 'play' && (P.x - h.cx) ** 2 + (P.y - h.cy) ** 2 < (P.r + 34) ** 2) hurt(1, h.cx, h.cy); if(!h.snd){ h.snd = true; AU.charge(); } }
      if(h.t > h.tel + .45) h.life = 0;
    }
    if(h.life <= 0) G.HZ.splice(i, 1);
  }
}
function updPickups(dt){
  for(let i = G.PK.length - 1; i >= 0; i--){
    const p = G.PK[i];
    p.t += dt;
    const dx = P.x - p.x, dy = P.y - p.y, d = Math.hypot(dx, dy) || 1;
    if(p.t > .4 && (d < 170 || G.waveState === 'clear')){ const s = 500 + p.t * 300; p.vx = lerp(p.vx, dx / d * s, Math.min(1, dt * 6)); p.vy = lerp(p.vy, dy / d * s, Math.min(1, dt * 6)); }
    else { const f = Math.exp(-4 * dt); p.vx *= f; p.vy *= f; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if(d < P.r + 12){
      G.PK.splice(i, 1);
      if(p.kind === 'heart'){ if(P.hp < P.maxHp){ P.hp++; pop(P.x, P.y - 40, '+1 ♥', '#ff3cac', 18); } AU.heal(); }
      else { G.shardsRun += p.v * shardMul(); AU.shard(); }
    }
  }
}

/* ---------------- waves ---------------- */
function startWave(n){
  G.wave = n; ev('wave', n);
  G.budget = (12 + n * 6) * (modId() === 'swarm' ? 2 : 1);
  G.spawnT = .6; G.waveState = 'fight';
  const boss = n % 5 === 0;
  if(boss){
    const b = BOSSES[((n / 5) - 1) % BOSSES.length];
    G.RF.push({ x:0, y:-200, type:'boss', boss:b, t:0, dur:1.6 });
    G.budget *= .45;
    announce(b.name, b.col, 'WAVE ' + n); AU.bossHorn(); AU.setMusic(3);
  } else { announce('WAVE ' + n, '#27f3ff', n === 1 ? 'SURVIVE' : ''); AU.setMusic(n >= 4 ? 2 : 1); AU.announce(0); }
}
function unlockedTypes(){
  if(modId() === 'titan') return ['brute', 'splitter', 'drone'].filter(k => G.wave >= ET[k].at || k === 'drone');
  return Object.keys(ET).filter(k => G.wave >= ET[k].at);
}
function updWave(dt){
  if(G.waveState === 'intro'){ G.stateT -= dt; if(G.stateT <= 0) startWave(G.wave + 1); return; }
  if(G.waveState === 'fight'){
    const alive = G.E.length + G.RF.length, cap = Math.min(48, 14 + G.wave * 3);
    G.spawnT -= dt;
    if(G.budget > 0 && G.spawnT <= 0 && alive < cap){
      G.spawnT = gr(.55, 1.1) * (G.wave <= 1 ? 1.4 : 1);
      const pool = unlockedTypes(), tot = pool.reduce((s, k) => s + ET[k].w, 0);
      let r = grng() * tot, type = pool[0];
      for(const k of pool){ r -= ET[k].w; if(r <= 0){ type = k; break; } }
      const n = type === 'drone' ? 3 + ((grng() * 3) | 0) : grng() < .3 ? 2 : 1;
      const a = grng() * TAU, d = gr(260, ARENA_R - 80);
      let cx0 = Math.cos(a) * d, cy0 = Math.sin(a) * d;
      if(Math.hypot(cx0 - P.x, cy0 - P.y) < 220){ cx0 = -cx0; cy0 = -cy0; }
      for(let i = 0; i < n; i++){ G.RF.push({ x:cx0 + gr(-40, 40), y:cy0 + gr(-40, 40), type, t:-i * .12, dur:.8 }); G.budget -= ET[type].cost; }
    }
    for(let i = G.RF.length - 1; i >= 0; i--){
      const f = G.RF[i]; f.t += dt;
      if(f.t >= f.dur){ G.RF.splice(i, 1); if(f.type === 'boss') spawnBoss(f.boss, f.x, f.y); else spawnEnemy(f.type, f.x, f.y); AU.spawn(); }
    }
    if(G.budget <= 0 && !G.E.length && !G.RF.length){
      G.waveState = 'clear'; G.stateT = 1.4; G.slow = .5;
      G.score += 200 * G.wave; G.shardsRun += 2 * shardMul();
      if(P.hp < P.maxHp){ P.hp++; pop(P.x, P.y - 44, '+1 ♥', '#ff3cac', 18); }
      announce('WAVE CLEAR', '#39ffb4'); AU.clear(); AU.setMusic(1);
    }
    return;
  }
  if(G.waveState === 'clear'){ G.stateT -= dt; if(G.stateT <= 0){ G.waveState = 'intro'; G.stateT = 1.4; openCards(); } }
}

/* ---------------- bosses ---------------- */
function spawnBoss(b, x, y){
  const cyc = Math.floor((G.wave - 1) / 10);
  const e = spawnEnemy('brute', x, y);
  Object.assign(e, { boss:b.id, name:b.name, r:b.r, hp:b.hp * (1 + .45 * cyc), maxHp:b.hp * (1 + .45 * cyc), cd:2.2, cd2:5, cd3:4, st:'walk', born:.8 });
  e.d = Object.assign({}, ET.brute, { col:b.col });
  G.boss = e; shakeIt(14); gridImpulse(x, y, 500, 1400);
}
function updBoss(e, dt){
  const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d, rage = e.hp < e.maxHp * .5 ? 1.3 : 1;
  e.cd -= dt * rage; e.cd2 -= dt * rage; e.cd3 -= dt * rage;
  if(e.boss === 'metronome'){
    const want = 200;
    e.vx = lerp(e.vx, nx * (d > want ? 42 : -20), Math.min(1, dt)); e.vy = lerp(e.vy, ny * (d > want ? 42 : -20), Math.min(1, dt));
    e.x += e.vx * dt; e.y += e.vy * dt; arenaClamp(e);
    e.swing = Math.sin(G.t * 2.4) * .5;
    if(e.cd <= 0){ e.cd = 3.1; const dir = Math.random() < .5 ? 1 : -1, a = Math.atan2(ny, nx); G.HZ.push({ kind:'blade', x:e.x, y:e.y, a0:a - dir * 1.3, a:a - dir * 1.3, sw:dir * 2.6, len:640, tel:.85, dur:.75, t:0, life:9 }); AU.tick(); }
    if(e.cd2 <= 0){ e.cd2 = 7; for(let k = 0; k < 4; k++){ const a = k / 4 * TAU + G.t; G.RF.push({ x:e.x + Math.cos(a) * 130, y:e.y + Math.sin(a) * 130, type:'drone', t:0, dur:.8 }); } }
    if(e.cd3 <= 0){ e.cd3 = 4.4; G.HZ.push({ kind:'pulse', x:e.x, y:e.y, r:e.r, spd:330, life:9 }); AU.tick(); }
  } else {
    // the Hollow King dashes, and its own echoes repeat each dash moments later
    if(e.st === 'walk'){
      e.vx = lerp(e.vx, nx * 105, Math.min(1, dt * 2)); e.vy = lerp(e.vy, ny * 105, Math.min(1, dt * 2)); e.x += e.vx * dt; e.y += e.vy * dt; arenaClamp(e);
      if(e.cd <= 0){ e.st = 'wind'; e.stT = .6; e.ca = Math.atan2(ny, nx); }
    } else if(e.st === 'wind'){ e.stT -= dt; e.ca = e.ca * .9 + Math.atan2(ny, nx) * .1; if(e.stT <= 0){ e.st = 'dash'; e.stT = .3; e.dx0 = e.x; e.dy0 = e.y; AU.charge(); } }
    else if(e.st === 'dash'){
      e.stT -= dt; e.x += Math.cos(e.ca) * 1700 * dt; e.y += Math.sin(e.ca) * 1700 * dt; arenaClamp(e);
      if(G.state === 'play' && Math.hypot(P.x - e.x, P.y - e.y) < e.r + P.r) hurt(1, e.x, e.y);
      if(e.stT <= 0){
        e.st = 'walk'; e.cd = gr(1.6, 2.4);
        const reps = e.hp < e.maxHp * .5 ? 3 : 2;
        for(let k = 1; k <= reps; k++) G.HZ.push({ kind:'kdash', x1:e.dx0, y1:e.dy0, x2:e.x, y2:e.y, cx:e.dx0, cy:e.dy0, tel:.9 * k, t:0, life:9 });
      }
    }
    if(e.cd2 <= 0){ e.cd2 = 4.5; const n = 10, o = rnd(0, TAU); for(let k = 0; k < n; k++){ const a = o + k / n * TAU; G.SH.push({ x:e.x, y:e.y, vx:Math.cos(a) * 210, vy:Math.sin(a) * 210, r:9, life:5 }); } AU.bolt(); }
  }
  if(G.state === 'play' && d < e.r + P.r * .7) hurt(1, e.x, e.y);
}
function bossDown(e){
  G.boss = null; ev('boss', 1);
  G.slow = 1.2; if(save.opt.flash) G.impact = .09; shakeIt(24); G.flash = 1; G.flashCol = '#ffffff';
  G.HZ = G.HZ.filter(h => h.kind === 'trail');
  G.SH.length = 0;
  for(const o of G.E) if(!o.dead) G.TM.push({ t:rnd(.1, .5), f:() => { if(!o.dead) kill(o, 0); } });
  announce(e.name + ' FALLS', '#ffd23c', 'BOSS DEFEATED'); AU.bossDown(); SDK.happytime();
}

/* ---------------- LEGION: time stops, your whole army strikes ---------------- */
function tryUlt(){
  if(G.state !== 'play' || G.ult < 100 || G.ultT > 0 || !G.E.length) return;
  G.ult = 0; ev('ult', 1);
  const actors = [{ me:true }].concat(G.EC.map(e => ({ e })));
  const strikes = Math.min(40, 6 + actors.length * 4);
  G.ultQ = { actors, left:strikes, k:0, t:.35, x0:P.x, y0:P.y };
  G.ultT = 1;
  P.inv = 99;
  AU.ult(); G.flash = .6; G.flashCol = '#ffffff'; shakeIt(8);
  announce('LEGION', skinCol() === 'glitch' ? '#ffffff' : skinCol(), 'TIME STOPS');
}
function updUlt(dt){
  const q = G.ultQ;
  q.t -= dt;
  if(q.t <= 0 && q.left > 0){
    q.t = .065;
    const alive = G.E.filter(e => !e.dead && e.born <= 0);
    if(!alive.length) q.left = 0;
    else {
      const actor = q.actors[q.k % q.actors.length]; q.k++; q.left--;
      const tgt = alive[(q.k * 7) % alive.length];
      const from = actor.me ? P : actor.e;
      const a = rnd(0, TAU), tx = tgt.x + Math.cos(a) * (tgt.r + 22), ty = tgt.y + Math.sin(a) * (tgt.r + 22);
      G.FX.push({ bolt:true, slash:true, x1:from.x, y1:from.y, x2:tx - Math.cos(a) * 60, y2:ty - Math.sin(a) * 60, life:.35, max0:.35, c:actor.me ? skinCol() : echoCol() });
      from.x = tx; from.y = ty; if(actor.e){ actor.e.ux = tx; actor.e.uy = ty; }
      G.FX.push({ arc:true, x:tgt.x, y:tgt.y, a:a + Math.PI, r:tgt.r + 50, life:.2, max0:.2, src:actor.me ? 0 : 1 });
      damage(tgt, 55 * dmgMul(), actor.me ? 0 : actor.e.id, -Math.cos(a), -Math.sin(a), .2, true);
      AU.ultHit(q.k);
    }
  }
  if(q.left <= 0 && q.t <= -.25){
    G.ultT = 0; P.inv = .6;
    P.x = q.x0; P.y = q.y0;
    for(const a of q.actors) if(a.e){ a.e.ux = null; }
    slam(P.x, P.y, 0, 1.4);
    if(save.opt.flash) G.impact = .07; G.slow = .5; shakeIt(18);
    AU.ultEnd();
  }
}

/* ---------------- hurt / death ---------------- */
function hurt(n, x, y){
  if(P.inv > 0 || G.state !== 'play' || G.ultT > 0) return;
  P.hp -= n; P.inv = 1.4;
  const a = Math.atan2(P.y - y, P.x - x); P.vx = Math.cos(a) * 520; P.vy = Math.sin(a) * 520;
  G.combo = 0; G.hitstop = .09; shakeIt(16); G.flash = .8; G.flashCol = '#ff2e4d';
  AU.hurt(); gridImpulse(P.x, P.y, 200, 800);
  pop(P.x, P.y - 40, '-' + n + ' ♥', '#ff2e4d', 20);
  for(let i = 0; i < 20; i++) part(P.x, P.y, rnd(-320, 320), rnd(-320, 320), rnd(.3, .6), pick(['#ff2e4d', '#ffffff']), rnd(2, 5));
  if(P.hp <= 0) die();
}
function die(){
  G.state = 'dying'; G.dieT = 1.6; AU.death(); shakeIt(24); G.flash = 1; G.flashCol = '#ff2e4d';
  for(let i = 0; i < 70; i++){ const a = rnd(0, TAU), s = rnd(100, 600); G.SD.push({ x:P.x, y:P.y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, a:rnd(0, TAU), va:rnd(-12, 12), s:rnd(4, 10), life:rnd(.6, 1.4), max:1.4, c:pick([skinCol() === 'glitch' ? '#ffffff' : skinCol(), '#ffffff']) }); }
  for(const e of G.EC) echoGone(e, false);
  G.EC.length = 0;
  AU.setMusic(0);
}

/* ---------------- fx ---------------- */
function partCap(){ return G.q === 'low' ? 260 : 800; }
function part(x, y, vx, vy, life, c, s){ if(G.PT.length < partCap()) G.PT.push({ x, y, vx, vy, life, max:life, c, s }); }
function pop(x, y, txt, c, size){ if(G.POP.length > 22) G.POP.shift(); G.POP.push({ x, y, txt, c, size:size || 14, life:.9 }); }
function shakeIt(v){ if(save.opt.shake) G.shake = Math.min(26, G.shake + v); }
function tickFx(dt){
  for(let i = G.PT.length - 1; i >= 0; i--){ const p = G.PT[i]; p.life -= dt; if(p.life <= 0){ G.PT.splice(i, 1); continue; } const f = Math.exp(-3.5 * dt); p.vx *= f; p.vy *= f; p.x += p.vx * dt; p.y += p.vy * dt; }
  for(let i = G.SD.length - 1; i >= 0; i--){ const s = G.SD[i]; s.life -= dt; if(s.life <= 0){ G.SD.splice(i, 1); continue; } const f = Math.exp(-2.6 * dt); s.vx *= f; s.vy *= f; s.x += s.vx * dt; s.y += s.vy * dt; s.a += s.va * dt; }
  for(let i = G.POP.length - 1; i >= 0; i--){ const p = G.POP[i]; p.life -= dt; p.y -= 50 * dt / G.camZ; if(p.life <= 0) G.POP.splice(i, 1); }
  for(let i = G.DC.length - 1; i >= 0; i--){ G.DC[i].life -= dt; if(G.DC[i].life <= 0) G.DC.splice(i, 1); }
  for(const e of G.E) if(e.mark > 0) e.mark -= dt;
  for(let i = G.FX.length - 1; i >= 0; i--){ const f = G.FX[i]; f.life -= dt; if(f.ring) f.r = f.max * (1 - Math.pow(f.life / f.max0, 2.2)); if(f.life <= 0) G.FX.splice(i, 1); }
}
function skin(){ return SKINS.find(s => s.id === save.skin) || SKINS[0]; }
function skinCol(){ const s = skin(); return s.c2 === 'glitch' ? `hsl(${(G.rt * 240) % 360},100%,60%)` : s.c2; }
function echoCol(){ const s = skin(); return s.e === 'glitch' ? '#b8f6ff' : s.e; }

/* ---------------- missions ---------------- */
function ev(type, v){
  if(G.state !== 'play' && G.state !== 'dying') return;
  const r = G.runEv, mt = MT.find(m => m.ev === type);
  if(!mt){ r[type] = (r[type] || 0) + v; return; }
  r[type] = mt.kind === 'sum' ? (r[type] || 0) + v : Math.max(r[type] || 0, v);
  for(const m of save.missions){
    if(m.done || m.ev !== type) continue;
    const prog = mt.kind === 'sum' ? m.p + r[type] : Math.max(m.p, r[type]);
    if(prog >= m.n){
      m.done = true; m.p = m.n; m.fresh = true;
      save.shards += m.reward; save.missionsDone++;
      save.mTier[m.id] = (save.mTier[m.id] || 0) + 1;
      toast('MISSION COMPLETE', m.txt + '  <b class="gold">+' + m.reward + ' ◆</b>', '#39ffb4', 3400);
      persist();
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
  while(save.missions.length < 3 && guard++ < 60){
    const t = pick(MT); if(have.has(t.id)) continue;
    const tier = save.mTier[t.id] || 0;
    const n = Math.round(t.vals[Math.min(tier, t.vals.length - 1)] * (tier >= t.vals.length ? 1 + (tier - t.vals.length + 1) * .5 : 1));
    save.missions.push({ id:t.id, ev:t.ev, n, p:0, done:false, txt:t.txt(n), reward:30 + tier * 25 });
    have.add(t.id); save.mNew = true;
  }
}
