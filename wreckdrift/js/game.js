'use strict';
/* =====================================================================
   WRECKING DRIFT: simulation. Your car drags a wrecking ball on a chain.
   Drift to swing it; the faster the ball, the harder it wrecks.
   ===================================================================== */
const G = {
  mode: 'demo', state: 'title', t: 0, rt: 0, ts: 1, slowT: 0, hitStop: 0,
  cars: [], props: [], coins: [], parts: [], texts: [], rings: [], bolts: [], decals: [], booms: [], gates: [],
  arena: ARENAS[0], arenaIdx: -1, pillars: [], round: 0, queue: [], alive: 0, spawnT: 0, clearT: 0,
  cards: {}, cardList: [], rerolls: 0, combo: 0, comboT: 0, run: null, boss: null,
  shake: 0, flash: 0, flashC: '#fff', vs: null, players: [], inputs: [{}, {}], overT: 0
};
const LINK = 15;

/* ---------------- arena ---------------- */
function setArena(i){
  G.arenaIdx = i; G.arena = ARENAS[i % ARENAS.length];
  const W = AW, H = AH;
  if(G.arena.id === 'city') G.pillars = [{ x: W / 2, y: H / 2, r: 80 }];
  else if(G.arena.id === 'snow') G.pillars = [{ x: W * 0.3, y: H / 2, r: 46 }, { x: W * 0.7, y: H / 2, r: 46 }];
  else G.pillars = [{ x: W * 0.26, y: H * 0.3, r: 42 }, { x: W * 0.74, y: H * 0.3, r: 42 }, { x: W * 0.26, y: H * 0.7, r: 42 }, { x: W * 0.74, y: H * 0.7, r: 42 }];
  G.gates = [{ x: W / 2, y: 40, a: Math.PI / 2 }, { x: W / 2, y: H - 40, a: -Math.PI / 2 }, { x: 40, y: H / 2, a: 0 }, { x: W - 40, y: H / 2, a: Math.PI }].map(g => ({ ...g, flash: 0 }));
  G.decals = []; G.props = [];
  if(typeof R !== 'undefined') R.buildGround();
  placeProps();
}
function freeSpot(r, avoidCenter){
  for(let k = 0; k < 40; k++){
    const x = rnd(120, AW - 120), y = rnd(120, AH - 120);
    if(avoidCenter && Math.hypot(x - AW / 2, y - AH / 2) < 220) continue;
    if(G.pillars.some(p => Math.hypot(p.x - x, p.y - y) < p.r + r + 30)) continue;
    if(G.props.some(p => Math.hypot(p.x - x, p.y - y) < p.r + r + 14)) continue;
    return { x, y };
  }
  return { x: rnd(120, AW - 120), y: rnd(120, AH - 120) };
}
function addProp(k, x, y){
  const r = { crate: 17, barrel: 15, cone: 9, tire: 20 }[k];
  G.props.push({ k, x, y, r, vx: 0, vy: 0, a: Math.random() * TAU, va: 0, dead: false, fuse: 0 });
}
function placeProps(){
  G.props = G.props.filter(p => !p.dead && p.k !== 'cone');
  const want = { crate: 7, barrel: 5, cone: 10, tire: 2 };
  for(const p of G.props) want[p.k]--;
  for(const k in want) for(let i = 0; i < want[k]; i++){
    const s = freeSpot(20, true);
    if(k === 'barrel' && Math.random() < 0.5){ addProp(k, s.x, s.y); addProp(k, s.x + 34, s.y + rnd(-8, 8)); i++; }
    else if(k === 'cone'){ for(let j = 0; j < 3 && i < want[k]; j++, i++) addProp(k, s.x + j * 26, s.y + (j % 2) * 14); i--; }
    else addProp(k, s.x, s.y);
  }
}

/* ---------------- cars + chains ---------------- */
function makeChain(car, links, ball, side){
  const pts = [], f = { x: Math.cos(car.a), y: Math.sin(car.a) };
  for(let i = 0; i <= links; i++){
    const x = car.x - f.x * (car.r + i * LINK), y = car.y - f.y * (car.r + i * LINK);
    pts.push({ x, y, px: x, py: y, m: i === links ? ball.mass : 0.3 });
  }
  return { pts, ball, side: side || 0, hit: new Map(), boomCd: 0, trail: [], spd: 0 };
}
function newCar(o){
  const c = Object.assign({
    x: AW / 2, y: AH / 2, a: 0, vx: 0, vy: 0, hp: 100, max: 100, inv: 0, dead: false, burn: 0, burnSrc: null,
    chains: [], inp: { thr: 0, steer: 0, drift: false }, drifting: false, dCharge: 0, boost: 0, slip: 0,
    ai: { back: 0, stuck: 0, t: Math.random() * 10, orbit: Math.random() < 0.5 ? 1 : -1, atk: 3 }, z: 0, hitFlash: 0, wheel: 0
  }, o);
  return c;
}
function ballDef(id, mult){
  const b = BALLS.find(x => x.id === id) || BALLS[0], m = mult || {};
  return { ...b, r: b.r + (m.r || 0), mass: b.mass + (m.mass || 0), dmg: b.dmg * (m.dmg || 1) };
}
function playerCar(idx, carId, ballId, x, y, a){
  const d = CARS.find(c => c.id === carId) || CARS[0];
  const cup = G.mode === 'cup';
  const max = d.hp + (cup ? save.perk.hp * 12 : 0);
  const c = newCar({ pl: idx, def: d, x, y, a, r: d.r, mass: d.mass, acc: d.acc, top: d.top, turn: d.turn, grip: d.grip, hp: max, max, col: idx === 1 ? '#3fa9ff' : d.col, gold: d.gold });
  if(G.mode === 'vs') c.col = idx === 0 ? '#ff4d4d' : '#3fa9ff';
  rebuildChains(c, ballId);
  return c;
}
function rebuildChains(c, ballId){
  const k = G.cards, cup = G.mode === 'cup';
  const links = 7 + (cup ? save.perk.chain : 0) + (k.chain || 0) * 2;
  const b = ballDef(ballId, { r: (k.heavy || 0) * 2, mass: (k.heavy || 0) * 0.4, dmg: (1 + (k.heavy || 0) * 0.3) * (1 + (cup ? save.perk.dmg * 0.08 : 0)) });
  c.ballId = ballId;
  c.chains = [makeChain(c, links, b, 0)];
  if(k.twin) c.chains.push(makeChain(c, links - 1, { ...b, r: b.r - 2 }, 1));
  if(k.twin){ c.chains[0].side = -1; c.chains[1].side = 1; }
}
function foeCar(kind, x, y, a){
  const d = FOES[kind], k = 1 + 0.13 * Math.max(0, G.round - 1);
  const c = newCar({ pl: -1, kind, def: d, x, y, a, r: d.r, mass: d.mass, acc: d.acc, top: d.top * (1 + Math.min(0.25, G.round * 0.012)), turn: d.turn, grip: 9, hp: d.hp * k, max: d.hp * k, col: d.col, dmg: d.dmg * (1 + G.round * 0.03), coins: d.coins, bomb: d.bomb, spike: d.spike, siren: d.siren });
  if(d.ball) c.chains = [makeChain(c, 6, { r: 15, mass: 2.2, dmg: 0.55, c1: '#ff9cf0', c2: '#8a1f8a', id: 'foe' })];
  G.cars.push(c);
  return c;
}
function bossCar(B, loop, x, y, a){
  const k = 1 + loop * 0.7 + G.round * 0.02;
  const c = newCar({ pl: -1, kind: 'boss', bk: B.kind, def: B, name: B.name, x, y, a, r: B.r, mass: B.mass, acc: B.acc, top: B.top, turn: B.turn, grip: 10, hp: B.hp * k, max: B.hp * k, col: B.col, dmg: B.dmg, coins: 40, boss: true, blade: B.blade });
  if(B.ball) c.chains = [makeChain(c, 8, { r: B.megaBall ? 32 : 18, mass: B.megaBall ? 7 : 3, dmg: 0.8, c1: '#d6a2ff', c2: '#4a1a8a', id: 'foe', spikes: true })];
  c.ai.atk = 2.5;
  G.cars.push(c); G.boss = c;
  return c;
}

/* ---------------- runs ---------------- */
function resetWorld(){
  Object.assign(G, { t: 0, ts: 1, slowT: 0, hitStop: 0, cars: [], coins: [], parts: [], texts: [], rings: [], bolts: [], booms: [], queue: [], alive: 0, spawnT: 0, clearT: 0, combo: 0, comboT: 0, boss: null, shake: 0, flash: 0, overT: 0 });
}
function startDemo(){
  G.mode = 'demo'; G.state = 'title'; G.cards = {}; G.round = 3;
  resetWorld(); setArena(0);
  const p = playerCar(0, save.car, save.ball, AW / 2, AH / 2, 0); p.hp = p.max = 1e9;
  G.cars.push(p); G.players = [p];
}
function startCup(){
  G.mode = 'cup'; G.cards = {}; G.cardList = []; G.round = 0; G.rerolls = save.perk.reroll;
  G.run = { wrecks: 0, coins: 0, bosses: 0, barrels: 0, maxCombo: 0, score: 0 };
  resetWorld(); setArena(0);
  const p = playerCar(0, save.car, save.ball, AW / 2, AH / 2 + 80, -Math.PI / 2);
  G.cars.push(p); G.players = [p];
  if(typeof R !== 'undefined'){ R.cam.x = p.x; R.cam.y = p.y; }
  if(save.perk.start > 0){ G.freeCards = save.perk.start; }
  else G.freeCards = 0;
  nextRound();
}
function startVs(){
  G.mode = 'vs'; G.cards = {}; G.round = 0;
  G.vs = { score: [0, 0], to: 5, winner: -1, propT: 20 };
  resetWorld(); setArena(Math.floor(Math.random() * ARENAS.length));
  const a = playerCar(0, 'rookie', save.ball, AW * 0.22, AH / 2, 0);
  const b = playerCar(1, 'rookie', save.ball === 'iron' ? 'bowling' : 'iron', AW * 0.78, AH / 2, Math.PI);
  G.cars.push(a, b); G.players = [a, b];
  G.state = 'play';
}
function roundPlan(n){
  const q = [];
  if(n % 5 === 0){
    const loop = Math.floor((n / 5 - 1) / BOSSES.length);
    q.push({ boss: BOSSES[(n / 5 - 1) % BOSSES.length], loop });
    for(let i = 0; i < 3 + n / 5; i++) q.push(pick(['bumper', 'bumper', 'cop']));
    return q;
  }
  const pool = ['bumper', 'bumper'];
  if(n >= 2) pool.push('cop'); if(n >= 4) pool.push('bomb'); if(n >= 5) pool.push('spiker');
  if(n >= 6) pool.push('truck'); if(n >= 7) pool.push('baller', 'cop'); if(n >= 11) pool.push('truck', 'baller', 'spiker');
  const cnt = 4 + Math.floor(n * 1.4);
  for(let i = 0; i < cnt; i++) q.push(i === 0 && n === 1 ? 'bumper' : pick(pool));
  return q;
}
function nextRound(){
  G.round++;
  const ai = Math.floor((G.round - 1) / 5) % ARENAS.length;
  if(ai !== G.arenaIdx){
    setArena(ai);
    const p = G.players[0];
    Object.assign(p, { x: AW / 2, y: AH / 2 + 80, vx: 0, vy: 0, a: -Math.PI / 2 }); rebuildChains(p, p.ballId);
    if(G.round > 1 && typeof UI !== 'undefined') UI.banner('🏟️ ' + G.arena.name, G.arena.id === 'snow' ? 'Slippery ice!' : 'New arena!', G.arena.wall);
  } else placeProps();
  G.queue = roundPlan(G.round); G.spawnT = 0.6; G.state = 'play';
  G.coins = [];
  if(typeof UI !== 'undefined'){
    const boss = G.round % 5 === 0;
    UI.banner(boss ? '👑 BOSS ROUND' : 'ROUND ' + G.round, boss ? G.queue[0].boss.name + ' is coming!' : G.round === 1 ? 'Drift to swing your wrecking ball!' : 'Wreck them all!', boss ? '#ff5aa0' : '#ffd23a');
    if(boss) AU.horn();
  }
}
function maxAlive(){ return Math.min(10, 2 + Math.floor(G.round / 2)); }
function spawning(dt){
  if(G.mode !== 'cup' && G.mode !== 'demo') return;
  if(G.mode === 'demo'){
    if(G.cars.length < 7){ G.spawnT -= dt; if(G.spawnT <= 0){ G.spawnT = 0.8; const g = pick(G.gates); foeCar(pick(['bumper', 'bumper', 'cop', 'truck', 'spiker']), g.x, g.y, g.a); g.flash = 1; } }
    return;
  }
  if(!G.queue.length) return;
  G.spawnT -= dt;
  const alive = G.cars.filter(c => c.pl < 0 && !c.dead).length;
  if(G.spawnT > 0 || alive >= maxAlive()) return;
  G.spawnT = rnd(0.7, 1.3);
  const it = G.queue.shift(), p = G.players[0];
  const gs = G.gates.slice().sort((a, b) => Math.hypot(b.x - p.x, b.y - p.y) - Math.hypot(a.x - p.x, a.y - p.y));
  const g = gs[Math.floor(Math.random() * 2)];
  g.flash = 1;
  if(it.boss){ bossCar(it.boss, it.loop, g.x, g.y, g.a); G.spawnT = 3; G.shake = 14; }
  else foeCar(it, g.x + rnd(-30, 30), g.y + rnd(-30, 30), g.a);
}

/* ---------------- update ---------------- */
function update(rdt){
  G.rt += rdt;
  if(G.hitStop > 0){ G.hitStop -= rdt; return; }
  if(G.state !== 'play' && G.state !== 'title' && G.state !== 'clear' && G.state !== 'dead' && G.state !== 'vsend') { updateFx(rdt); return; }
  if(G.slowT > 0){ G.slowT -= rdt; G.ts = lerp(G.ts, 0.3, Math.min(1, rdt * 12)); } else G.ts = lerp(G.ts, 1, Math.min(1, rdt * 6));
  const dt = rdt * G.ts;
  G.t += dt;
  G.shake = Math.max(0, G.shake - rdt * 40); G.flash = Math.max(0, G.flash - rdt * 2);
  if(G.comboT > 0){ G.comboT -= dt; if(G.comboT <= 0) G.combo = 0; }
  for(const g of G.gates) g.flash = Math.max(0, g.flash - dt * 1.5);
  for(const c of G.cars) if(!c.dead) think(c, dt);
  const N = 3, sdt = dt / N;
  for(let s = 0; s < N; s++){
    for(const c of G.cars) if(!c.dead) drive(c, sdt);
    for(const c of G.cars) if(!c.dead) for(const ch of c.chains) stepChain(c, ch, sdt);
    collide(sdt);
  }
  for(const c of G.cars) if(!c.dead) carMisc(c, dt);
  spawning(dt);
  updateProps(dt);
  updateCoins(dt);
  updateBooms(dt);
  updateFx(dt);
  G.cars = G.cars.filter(c => !c.dead || c.pl >= 0);
  if(G.mode === 'cup') cupFlow(dt);
  if(G.mode === 'vs') vsFlow(dt);
}
function cupFlow(dt){
  const p = G.players[0];
  if(G.state === 'play'){
    if(p.dead){ G.state = 'dead'; G.overT = 0; G.slowT = 1.5; }
    else if(!G.queue.length && !G.cars.some(c => c.pl < 0 && !c.dead)){
      G.state = 'clear'; G.clearT = 0; G.slowT = 0.8;
      for(const c of G.coins) c.pull = true;
      if(typeof UI !== 'undefined'){ UI.banner(G.round % 5 === 0 ? '👑 BOSS WRECKED!' : 'ROUND CLEAR!', '+25 HP repaired', '#7dffb0'); AU.clear(); }
      p.hp = Math.min(p.max, p.hp + 25);
    }
  } else if(G.state === 'clear'){
    G.clearT += dt;
    if(G.clearT > 1.7 && !G.coins.length){ G.state = 'pick'; if(typeof UI !== 'undefined') UI.showPick(); }
  } else if(G.state === 'dead'){
    G.overT += dt;
    if(G.overT > 1.4){ G.state = 'over'; if(typeof UI !== 'undefined') UI.gameOver(); }
  }
}
function vsFlow(dt){
  const V = G.vs;
  if(G.state === 'vsend'){ G.overT += dt; if(G.overT > 1.6 && V.winner >= 0 && !V.shown){ V.shown = true; if(typeof UI !== 'undefined') UI.vsOver(); } return; }
  V.propT -= dt; if(V.propT <= 0){ V.propT = 20; placeProps(); }
  for(const p of G.players){
    if(!p.dead) continue;
    p.respawn -= dt;
    if(p.respawn <= 0){
      const o = G.players[1 - p.pl];
      const spots = [[200, 200], [AW - 200, 200], [200, AH - 200], [AW - 200, AH - 200]].sort((a, b) => Math.hypot(b[0] - o.x, b[1] - o.y) - Math.hypot(a[0] - o.x, a[1] - o.y));
      const s = spots[0];
      Object.assign(p, { dead: false, x: s[0], y: s[1], vx: 0, vy: 0, a: Math.atan2(AH / 2 - s[1], AW / 2 - s[0]), hp: p.max, inv: 2, burn: 0 });
      rebuildChains(p, p.ballId); ring(p.x, p.y, p.col, 90);
    }
  }
}

/* ---------------- input / AI ---------------- */
function think(c, dt){
  if(c.pl >= 0 && G.mode !== 'demo'){ const I = G.inputs[c.pl]; c.inp.thr = I.thr || 0; c.inp.steer = I.steer || 0; c.inp.drift = !!I.drift; return; }
  if(c.pl >= 0){ autopilot(c, dt); return; }
  const A = c.ai; A.t += dt;
  const T = nearestPlayer(c);
  if(!T){ c.inp.thr = 0; return; }
  let tx = T.x + T.vx * 0.35, ty = T.y + T.vy * 0.35;
  const d = Math.hypot(T.x - c.x, T.y - c.y);
  if(c.chains.length && !c.boss){ const a = Math.atan2(c.y - T.y, c.x - T.x) + A.orbit * 1.1; tx = T.x + Math.cos(a) * 170; ty = T.y + Math.sin(a) * 170; }
  if(c.boss && c.def.ball){ const a = Math.atan2(c.y - T.y, c.x - T.x) + A.orbit * 0.9; tx = T.x + Math.cos(a) * 200; ty = T.y + Math.sin(a) * 200; }
  let want = Math.atan2(ty - c.y, tx - c.x), diff = angDiff(c.a, want);
  c.inp.thr = 1; c.inp.steer = clamp(diff * 2.4, -1, 1); c.inp.drift = Math.abs(diff) > 1.3 && Math.hypot(c.vx, c.vy) > 220;
  if(A.back > 0){ A.back -= dt; c.inp.thr = -1; c.inp.steer = -c.inp.steer; c.inp.drift = false; }
  const sp = Math.hypot(c.vx, c.vy);
  if(sp < 35 && A.back <= 0){ A.stuck += dt; if(A.stuck > 0.9){ A.stuck = 0; A.back = 0.6; } } else A.stuck = 0;
  if(c.boss) bossAI(c, T, dt, d);
}
function nearestPlayer(c){
  let best = null, bd = 1e18;
  for(const p of G.players){ if(p.dead) continue; const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2; if(d < bd){ bd = d; best = p; } }
  return best;
}
function bossAI(c, T, dt, d){
  const A = c.ai; A.atk -= dt;
  if(c.bk === 'dozer' || c.bk === 'king'){
    if(A.rev > 0){ A.rev -= dt; c.inp.thr = 0; c.vx *= 0.9; c.vy *= 0.9; c.inp.steer = clamp(angDiff(c.a, Math.atan2(T.y - c.y, T.x - c.x)) * 3, -1, 1); if(A.rev <= 0){ A.charge = 1.3; if(typeof AU !== 'undefined') AU.horn(); } }
    else if(A.charge > 0){ A.charge -= dt; c.boost = 0.2; c.inp.thr = 1; c.inp.drift = false; c.inp.steer *= 0.25; }
    else if(A.atk <= 0){ A.atk = c.bk === 'king' ? 4.5 : 4; A.rev = 0.9; }
    if(c.bk === 'king'){ A.min = (A.min || 6) - dt; if(A.min <= 0 && G.cars.length < 12){ A.min = 7; for(let i = 0; i < 2; i++){ const g = pick(G.gates); foeCar(pick(['bumper', 'bomb']), g.x, g.y, g.a); g.flash = 1; } } }
  } else if(c.bk === 'monster'){
    if(c.z > 0 || A.air > 0){
      A.air -= dt; const k = 1 - A.air / 0.95; c.z = Math.sin(k * Math.PI) * 90;
      c.x = lerp(A.jx0, A.jx, k); c.y = lerp(A.jy0, A.jy, k); c.vx = c.vy = 0; c.inp.thr = 0;
      if(A.air <= 0){ c.z = 0; slam(c); }
    } else if(A.atk <= 0 && d < 520){
      A.atk = 4.2; A.air = 0.95; A.jx0 = c.x; A.jy0 = c.y; A.jx = clamp(T.x + T.vx * 0.4, 80, AW - 80); A.jy = clamp(T.y + T.vy * 0.4, 80, AH - 80);
    }
  }
}
function slam(c){
  ring(c.x, c.y, '#ff3d6e', 170); G.shake = Math.max(G.shake, 16);
  if(typeof AU !== 'undefined') AU.boom(1);
  for(const o of G.cars){ if(o === c || o.dead) continue; const dx = o.x - c.x, dy = o.y - c.y, d = Math.hypot(dx, dy) || 1; if(d < 170){ hurt(o, c.dmg * (1 - d / 220), c, 'slam'); o.vx += dx / d * 420; o.vy += dy / d * 420; } }
  for(const p of G.props) if(!p.dead && Math.hypot(p.x - c.x, p.y - c.y) < 170) breakProp(p, c);
  burst(c.x, c.y, 30, '#c9a27a', 300, 5);
}
/* bot driver for the title demo, tests and the trailer */
function autopilot(c, dt){
  const A = c.ai; A.t += dt;
  let tgt = null, bd = 1e18;
  for(const o of G.cars){ if(o === c || o.dead || o.pl === c.pl) continue; const d = (o.x - c.x) ** 2 + (o.y - c.y) ** 2; if(d < bd){ bd = d; tgt = o; } }
  let tx = AW / 2 + Math.cos(A.t * 0.6) * 400, ty = AH / 2 + Math.sin(A.t * 0.6) * 300;
  if(tgt){ const a = Math.atan2(tgt.y - c.y, tgt.x - c.x) + A.orbit * 1.25; tx = tgt.x - Math.cos(a) * 140; ty = tgt.y - Math.sin(a) * 140; }
  const m = 140; tx = clamp(tx, m, AW - m); ty = clamp(ty, m, AH - m);
  for(const p of G.pillars){ const d = Math.hypot(c.x - p.x, c.y - p.y); if(d < p.r + 90){ tx += (c.x - p.x) / d * 200; ty += (c.y - p.y) / d * 200; } }
  const want = Math.atan2(ty - c.y, tx - c.x), diff = angDiff(c.a, want);
  c.inp.thr = 1; c.inp.steer = clamp(diff * 2.6, -1, 1); c.inp.drift = Math.abs(diff) > 0.9;
  if(A.back > 0){ A.back -= dt; c.inp.thr = -1; c.inp.steer = -c.inp.steer; c.inp.drift = false; }
  if(Math.hypot(c.vx, c.vy) < 40){ A.stuck += dt; if(A.stuck > 0.8){ A.stuck = 0; A.back = 0.5; } } else A.stuck = 0;
  if(Math.random() < dt * 0.25) A.orbit = -A.orbit;
}

/* ---------------- driving ---------------- */
function drive(c, dt){
  if(c.z > 0) return;
  const I = c.inp, ar = G.arena.grip;
  let fx = Math.cos(c.a), fy = Math.sin(c.a);
  let vf = c.vx * fx + c.vy * fy, vl = -c.vx * fy + c.vy * fx;
  const top = c.top * (c.boost > 0 ? 1.5 : 1), acc = c.acc * (c.boost > 0 ? 1.6 : 1);
  if(I.thr > 0){ if(vf < top) vf += acc * I.thr * dt; }
  else if(I.thr < 0){ vf -= (vf > 20 ? acc * 1.7 : acc * 0.7) * -I.thr * dt; vf = Math.max(vf, -top * 0.45); }
  else vf *= 1 - 1.1 * dt;
  if(vf > top) vf -= (vf - top) * 3 * dt;
  const drift = I.drift && Math.abs(vf) > 120;
  vl *= Math.exp(-c.grip * ar * (drift ? 0.16 : 1) * dt);
  const tk = clamp(vf / 150, -1, 1);
  c.a += I.steer * c.turn * (drift ? 1.4 : 1) * tk * dt;
  fx = Math.cos(c.a); fy = Math.sin(c.a);
  c.vx = fx * vf - fy * vl; c.vy = fy * vf + fx * vl;
  c.x += c.vx * dt; c.y += c.vy * dt;
  c.slip = vl; c.drifting = drift || Math.abs(vl) > 110;
  c.wheel += vf * dt;
  // arena walls
  const r = c.r;
  if(c.x < r){ c.x = r; wallHit(c, 'x'); } else if(c.x > AW - r){ c.x = AW - r; wallHit(c, 'x'); }
  if(c.y < r){ c.y = r; wallHit(c, 'y'); } else if(c.y > AH - r){ c.y = AH - r; wallHit(c, 'y'); }
  for(const p of G.pillars){ const dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy) || 1, ov = p.r + r - d; if(ov > 0){ const nx = dx / d, ny = dy / d; c.x += nx * ov; c.y += ny * ov; const vn = c.vx * nx + c.vy * ny; if(vn < 0){ c.vx -= nx * vn * 1.4; c.vy -= ny * vn * 1.4; if(-vn > 260) bump(c, -vn); } } }
}
function wallHit(c, ax){
  const v = ax === 'x' ? c.vx : c.vy;
  if(ax === 'x') c.vx = -c.vx * 0.4; else c.vy = -c.vy * 0.4;
  if(Math.abs(v) > 260) bump(c, Math.abs(v));
  if(c.pl < 0) c.ai.back = Math.max(c.ai.back, 0.35);
}
function bump(c, v){
  burst(c.x, c.y, 6, '#ffe9a0', 160, 3);
  if(typeof AU !== 'undefined' && c.pl >= 0) AU.thud(Math.min(1, v / 600));
}
function carMisc(c, dt){
  if(c.inv > 0) c.inv -= dt;
  if(c.hitFlash > 0) c.hitFlash -= dt * 5;
  if(c.burn > 0){ c.burn -= dt; hurt(c, 10 * (G.cards.fire || 1) * dt, c.burnSrc, 'fire', true); if(Math.random() < dt * 30) G.parts.push({ x: c.x + rnd(-10, 10), y: c.y + rnd(-10, 10), vx: rnd(-30, 30), vy: rnd(-80, -30), life: 0, max: 0.5, c: pick(['#ffb13a', '#ff5a1f', '#ffe14d']), sz: rnd(3, 6), add: true }); }
  if(c.boost > 0){ c.boost -= dt; if(Math.random() < dt * 60){ const fx = Math.cos(c.a), fy = Math.sin(c.a); G.parts.push({ x: c.x - fx * c.r, y: c.y - fy * c.r, vx: -fx * 200 + rnd(-40, 40), vy: -fy * 200 + rnd(-40, 40), life: 0, max: 0.3, c: pick(['#7df0ff', '#ffffff', '#3fa9ff']), sz: rnd(3, 6), add: true }); } }
  // drift nitro
  if(c.pl >= 0 && G.cards.nitro && G.mode === 'cup'){
    if(c.drifting && Math.hypot(c.vx, c.vy) > 160){ c.dCharge = Math.min(1.5, c.dCharge + dt); }
    else if(c.dCharge > 0.45){ c.boost = 0.35 + 0.25 * G.cards.nitro + c.dCharge * 0.3; c.dCharge = 0; if(typeof AU !== 'undefined') AU.nitro(); ring(c.x, c.y, '#7df0ff', 60); }
    else c.dCharge = Math.max(0, c.dCharge - dt * 2);
  }
  // skid marks + smoke
  const sp = Math.hypot(c.vx, c.vy);
  if(c.drifting && sp > 100 && c.z <= 0){
    const fx = Math.cos(c.a), fy = Math.sin(c.a), rx = c.x - fx * c.r * 0.6, ry = c.y - fy * c.r * 0.6;
    for(const s of [-1, 1]){ const wx = rx - fy * c.r * 0.6 * s, wy = ry + fx * c.r * 0.6 * s; const k = 'w' + s; if(c[k]) G.decals.push({ t: 'skid', x0: c[k].x, y0: c[k].y, x1: wx, y1: wy, w: c.r * 0.32 }); c[k] = { x: wx, y: wy }; }
    if(Math.random() < dt * 22) G.parts.push({ x: rx + rnd(-6, 6), y: ry + rnd(-6, 6), vx: rnd(-20, 20), vy: rnd(-20, 20), life: 0, max: 0.7, c: G.arena.id === 'snow' ? '#ffffff' : 'rgba(255,255,255,0.6)', sz: rnd(6, 11), smoke: true });
    if(c.pl >= 0 && typeof AU !== 'undefined') AU.skid(dt);
  } else { c.wm1 = c.w1 = null; c['w-1'] = null; }
  for(const ch of c.chains){ if(ch.boomCd > 0) ch.boomCd -= dt; }
}

/* ---------------- chain (verlet rope) ---------------- */
function hitch(c, ch){
  const fx = Math.cos(c.a), fy = Math.sin(c.a), s = ch.side * c.r * 0.55;
  return { x: c.x - fx * c.r * 0.95 - fy * s, y: c.y - fy * c.r * 0.95 + fx * s };
}
function stepChain(c, ch, dt){
  const P = ch.pts, h = hitch(c, ch), n = P.length;
  P[0].x = P[0].px = h.x; P[0].y = P[0].py = h.y;
  for(let i = 1; i < n; i++){
    const p = P[i], last = i === n - 1, damp = last ? (ch.ball.bouncy ? 0.9985 : 0.997) : 0.985;
    const vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp;
    p.px = p.x; p.py = p.y; p.x += vx; p.y += vy;
  }
  for(let it = 0; it < 8; it++){
    for(let i = 0; i < n - 1; i++){
      const a = P[i], b = P[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if(d <= LINK) continue;
      const wa = i === 0 ? 0 : 1 / a.m, wb = 1 / b.m, k = (d - LINK) / d / (wa + wb);
      a.x += dx * k * wa; a.y += dy * k * wa; b.x -= dx * k * wb; b.y -= dy * k * wb;
    }
  }
  // the ball tugs the car when the chain is taut
  const B = P[n - 1], dx = B.x - h.x, dy = B.y - h.y, d = Math.hypot(dx, dy) || 1, full = LINK * (n - 1);
  if(d > full * 0.97){
    const ux = dx / d, uy = dy / d, bvx = (B.x - B.px) / dt, bvy = (B.y - B.py) / dt;
    const rel = (bvx - c.vx) * ux + (bvy - c.vy) * uy;
    if(rel > 0){ const k = rel * ch.ball.mass / (ch.ball.mass + c.mass * 4) * 0.12; c.vx += ux * k; c.vy += uy * k; }
  }
  // ball vs walls and pillars
  const r = ch.ball.r, e = ch.ball.bouncy ? 0.85 : 0.55;
  if(B.x < r){ const v = B.x - B.px; B.x = r; B.px = B.x + v * e; if(-v / dt > 300) clank(B.x, B.y, -v / dt); }
  else if(B.x > AW - r){ const v = B.x - B.px; B.x = AW - r; B.px = B.x + v * e; if(v / dt > 300) clank(B.x, B.y, v / dt); }
  if(B.y < r){ const v = B.y - B.py; B.y = r; B.py = B.y + v * e; if(-v / dt > 300) clank(B.x, B.y, -v / dt); }
  else if(B.y > AH - r){ const v = B.y - B.py; B.y = AH - r; B.py = B.y + v * e; if(v / dt > 300) clank(B.x, B.y, v / dt); }
  for(const p of G.pillars){
    const px = B.x - p.x, py = B.y - p.y, pd = Math.hypot(px, py) || 1, ov = p.r + r - pd;
    if(ov > 0){ const nx = px / pd, ny = py / pd, vx = B.x - B.px, vy = B.y - B.py, vn = vx * nx + vy * ny; B.x += nx * ov; B.y += ny * ov; if(vn < 0){ B.px = B.x - (vx - nx * vn * (1 + e)); B.py = B.y - (vy - ny * vn * (1 + e)); if(-vn / dt > 300) clank(B.x, B.y, -vn / dt); } }
  }
  ch.spd = Math.hypot(B.x - B.px, B.y - B.py) / dt;
}
function clank(x, y, v){
  burst(x, y, 5, '#fff3c4', 220, 2.5);
  if(typeof AU !== 'undefined') AU.clank(Math.min(1, v / 900));
}

/* ---------------- collisions ---------------- */
function collide(dt){
  const cs = G.cars;
  for(let i = 0; i < cs.length; i++){
    const a = cs[i]; if(a.dead || a.z > 20) continue;
    for(let j = i + 1; j < cs.length; j++){
      const b = cs[j]; if(b.dead || b.z > 20) continue;
      const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
      if(d2 >= rr * rr) continue;
      const d = Math.sqrt(d2) || 1, nx = dx / d, ny = dy / d, ov = rr - d, ma = a.mass, mb = b.mass;
      a.x -= nx * ov * mb / (ma + mb); a.y -= ny * ov * mb / (ma + mb); b.x += nx * ov * ma / (ma + mb); b.y += ny * ov * ma / (ma + mb);
      const vrel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if(vrel >= 0) continue;
      const jimp = -(1.5) * vrel / (1 / ma + 1 / mb);
      a.vx -= nx * jimp / ma; a.vy -= ny * jimp / ma; b.vx += nx * jimp / mb; b.vy += ny * jimp / mb;
      ram(a, b, -vrel, nx, ny); ram(b, a, -vrel, -nx, -ny);
    }
  }
  // balls vs cars
  for(const c of cs){
    if(c.dead) continue;
    for(const ch of c.chains){
      const B = ch.pts[ch.pts.length - 1], r = ch.ball.r;
      const bvx = (B.x - B.px) / dt, bvy = (B.y - B.py) / dt;
      for(const o of cs){
        if(o === c || o.dead || o.z > 20) continue;
        if(G.mode === 'cup' && c.pl < 0 && o.pl < 0 && !c.boss) continue;
        const dx = o.x - B.x, dy = o.y - B.y, rr = r + o.r, d2 = dx * dx + dy * dy;
        if(d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 1, nx = dx / d, ny = dy / d, ov = rr - d;
        const vrel = (bvx - o.vx) * nx + (bvy - o.vy) * ny;
        const mb = ch.ball.mass, mo = o.mass;
        B.x -= nx * ov * mo / (mb + mo); B.y -= ny * ov * mo / (mb + mo);
        o.x += nx * ov * mb / (mb + mo); o.y += ny * ov * mb / (mb + mo);
        if(vrel <= 0) continue;
        const j = 1.45 * vrel / (1 / mb + 1 / mo);
        o.vx += nx * j / mo; o.vy += ny * j / mo;
        const nbx = bvx - nx * j / mb, nby = bvy - ny * j / mb;
        B.px = B.x - nbx * dt; B.py = B.y - nby * dt;
        const last = ch.hit.get(o) || -9;
        if(G.t - last < 0.18 || vrel < 70) continue;
        ch.hit.set(o, G.t);
        ballHit(c, ch, o, vrel, B.x + nx * r, B.y + ny * r, nx, ny);
      }
    }
  }
  // ball vs ball (clang!)
  const balls = [];
  for(const c of cs) if(!c.dead) for(const ch of c.chains) balls.push([c, ch]);
  for(let i = 0; i < balls.length; i++) for(let j = i + 1; j < balls.length; j++){
    if(balls[i][0] === balls[j][0]) continue;
    const A = balls[i][1], Bc = balls[j][1], a = A.pts[A.pts.length - 1], b = Bc.pts[Bc.pts.length - 1];
    const dx = b.x - a.x, dy = b.y - a.y, rr = A.ball.r + Bc.ball.r, d2 = dx * dx + dy * dy;
    if(d2 >= rr * rr) continue;
    const d = Math.sqrt(d2) || 1, nx = dx / d, ny = dy / d, ov = rr - d;
    a.x -= nx * ov / 2; a.y -= ny * ov / 2; b.x += nx * ov / 2; b.y += ny * ov / 2;
    const avx = a.x - a.px, avy = a.y - a.py, bvx = b.x - b.px, bvy = b.y - b.py, vrel = (avx - bvx) * nx + (avy - bvy) * ny;
    if(vrel <= 0) continue;
    const ma = A.ball.mass, mb = Bc.ball.mass, jj = 1.8 * vrel / (1 / ma + 1 / mb);
    a.px = a.x - (avx - nx * jj / ma); a.py = a.y - (avy - ny * jj / ma);
    b.px = b.x - (bvx + nx * jj / mb); b.py = b.y - (bvy + ny * jj / mb);
    if(vrel / dt > 250){ burst((a.x + b.x) / 2, (a.y + b.y) / 2, 14, '#fff3c4', 380, 3); floatText('CLANG!', (a.x + b.x) / 2, (a.y + b.y) / 2 - 20, '#fff3c4', 1); if(typeof AU !== 'undefined') AU.clank(1); G.shake = Math.max(G.shake, 6); }
  }
  // props
  for(const p of G.props){
    if(p.dead) continue;
    for(const c of cs){
      if(c.dead || c.z > 20) continue;
      const dx = p.x - c.x, dy = p.y - c.y, rr = p.r + c.r, d2 = dx * dx + dy * dy;
      if(d2 < rr * rr){ const d = Math.sqrt(d2) || 1, nx = dx / d, ny = dy / d, vn = c.vx * nx + c.vy * ny; propHit(p, c, nx, ny, vn, rr - d, c.mass, false); }
      for(const ch of c.chains){
        const B = ch.pts[ch.pts.length - 1], bx = p.x - B.x, by = p.y - B.y, br = p.r + ch.ball.r, bd2 = bx * bx + by * by;
        if(bd2 < br * br){ const d = Math.sqrt(bd2) || 1, nx = bx / d, ny = by / d, vn = ((B.x - B.px) * nx + (B.y - B.py) * ny) / dt; propHit(p, c, nx, ny, vn, br - d, ch.ball.mass, true); }
      }
    }
  }
}
function propHit(p, src, nx, ny, vn, ov, m, isBall){
  if(p.k === 'tire'){ if(!isBall){ src.x -= nx * ov; src.y -= ny * ov; if(vn > 0){ src.vx -= nx * vn * 1.6; src.vy -= ny * vn * 1.6; } } return; }
  if(vn <= 0){ p.x += nx * ov; p.y += ny * ov; return; }
  if(p.k === 'cone'){ p.vx += nx * vn * 1.3 + rnd(-40, 40); p.vy += ny * vn * 1.3 + rnd(-40, 40); p.va = rnd(-14, 14); p.x += nx * ov; p.y += ny * ov; if(!p.hitT || G.t - p.hitT > 0.3){ p.hitT = G.t; if(typeof AU !== 'undefined' && src.pl >= 0) AU.cone(); } return; }
  const need = p.k === 'barrel' ? (isBall ? 90 : 170) : (isBall ? 70 : 200);
  if(vn > need) breakProp(p, src);
  else { p.x += nx * ov; p.y += ny * ov; p.vx += nx * vn * 0.6; p.vy += ny * vn * 0.6; }
}
function breakProp(p, src){
  if(p.dead) return;
  p.dead = true;
  if(p.k === 'barrel'){
    p.dead = false; p.fuse = p.fuse || 0.05; p.src = src;
    return;
  }
  if(p.k === 'crate'){
    burst(p.x, p.y, 14, '#c8873a', 320, 5, true);
    for(let i = 0; i < 2 + (Math.random() < 0.4 ? 2 : 0); i++) dropCoin(p.x, p.y);
    if(Math.random() < 0.25 && G.mode === 'cup') G.coins.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 0, wrench: true });
    if(typeof AU !== 'undefined') AU.crate();
    G.decals.push({ t: 'splinter', x: p.x, y: p.y });
  }
}
function ram(att, vic, impact, nx, ny){
  if(impact < 120) return;
  if(att.bomb && vic.pl >= 0){ explode(att.x, att.y, 100, 18, att); kill(att, null, true); return; }
  if(vic.pl >= 0 && att.pl < 0){
    if(vic.inv > 0) return;
    const sp = G.cards.spikes || 0;
    hurt(vic, att.dmg * 0.7 * (0.45 + impact / 450) * Math.pow(0.6, sp), att, 'ram');
    vic.inv = 0.8; att.ai.back = 0.9;
  } else if(att.pl >= 0 && vic.pl < 0){
    const sp = G.cards.spikes || 0;
    const fx = Math.cos(att.a), fy = Math.sin(att.a);
    const front = fx * nx + fy * ny > 0.3;
    hurt(vic, impact * (0.035 + sp * 0.04) * (front ? 1.3 : 1), att, 'ram');
  } else if(att.pl >= 0 && vic.pl >= 0){
    if(vic.inv <= 0 && impact > 260) hurt(vic, impact * 0.025, att, 'ram');
  } else if(impact > 220) hurt(vic, impact * 0.02, att, 'ram', true);
  if(impact > 220){ const x = (att.x + vic.x) / 2, y = (att.y + vic.y) / 2; burst(x, y, 8, '#ffe9a0', 250, 3); if(typeof AU !== 'undefined' && (att.pl >= 0 || vic.pl >= 0)) AU.thud(Math.min(1, impact / 600)); }
}
function ballHit(owner, ch, o, vrel, hx, hy, nx, ny){
  let dmg = Math.pow(vrel / 100, 1.25) * 9 * ch.ball.dmg;
  if(owner.pl < 0) dmg *= o.pl >= 0 ? 0.6 : 0.4;
  if(o.pl >= 0 && o.inv > 0) dmg = 0;
  let blocked = false;
  if(o.blade){ const fx = Math.cos(o.a), fy = Math.sin(o.a); if(-(fx * nx + fy * ny) > 0.55){ dmg *= 0.15; blocked = true; } }
  const big = dmg > 45;
  if(dmg > 0) hurt(o, dmg, owner, 'ball');
  if(o.pl >= 0 && dmg > 0) o.inv = 0.35;
  burst(hx, hy, big ? 22 : 10, blocked ? '#9fd8ff' : '#fff3c4', big ? 480 : 300, big ? 4 : 3);
  if(blocked) floatText('BLOCKED', hx, hy - 30, '#9fd8ff', 0.9);
  G.shake = Math.max(G.shake, Math.min(16, 3 + dmg * 0.12));
  if(big && owner.pl >= 0) G.hitStop = Math.max(G.hitStop, 0.035);
  if(typeof AU !== 'undefined') AU.hit(Math.min(1, dmg / 80), blocked);
  ring(hx, hy, '#ffffff', big ? 70 : 40);
  if(owner.pl >= 0 && G.mode === 'cup'){
    const k = G.cards;
    if(k.fire){ o.burn = 1.6 + k.fire * 0.6; o.burnSrc = owner; }
    if(k.shock){ const ts = G.cars.filter(c => c !== o && c.pl < 0 && !c.dead).sort((a, b) => Math.hypot(a.x - o.x, a.y - o.y) - Math.hypot(b.x - o.x, b.y - o.y)).slice(0, 1 + k.shock).filter(c => Math.hypot(c.x - o.x, c.y - o.y) < 260);
      for(const t of ts){ G.bolts.push({ x0: o.x, y0: o.y, x1: t.x, y1: t.y, life: 0, max: 0.25 }); hurt(t, dmg * (0.3 + 0.12 * k.shock) + 6, owner, 'shock'); } if(ts.length && typeof AU !== 'undefined') AU.zap(); }
    if(k.boom && dmg > 30 && ch.boomCd <= 0){ ch.boomCd = 1.3 - k.boom * 0.2; explode(hx, hy, 80 + 20 * k.boom, 20 + 14 * k.boom, owner); }
  }
  if(ch.ball.fire && owner.pl >= 0){ o.burn = Math.max(o.burn, 1.2); o.burnSrc = owner; }
}
function hurt(c, dmg, src, kind, quiet){
  if(c.dead || dmg <= 0) return;
  if(G.mode === 'demo' && c.pl >= 0) return;
  c.hp -= dmg; c.hitFlash = 1;
  if(!quiet && dmg >= 3) floatText(Math.round(dmg), c.x + rnd(-8, 8), c.y - c.r - 10, c.pl >= 0 ? '#ff5a6a' : dmg > 45 ? '#ffd23a' : '#ffffff', dmg > 45 ? 1.35 : 0.85);
  if(c.pl >= 0 && !quiet){ G.flash = Math.max(G.flash, 0.2); G.flashC = '#ff2a4a'; if(typeof AU !== 'undefined') AU.ouch(); }
  if(c.hp <= 0) kill(c, src);
}
function kill(c, src, silent){
  if(c.dead) return;
  c.dead = true;
  explodeFx(c.x, c.y, c.boss ? 2.2 : 1, c.col);
  G.decals.push({ t: 'scorch', x: c.x, y: c.y, r: c.r * (c.boss ? 3 : 2.2) });
  for(let i = 0; i < 6; i++) G.parts.push({ x: c.x, y: c.y, vx: rnd(-300, 300), vy: rnd(-300, 300), life: 0, max: rnd(0.7, 1.2), c: i < 3 ? c.col : '#333', sz: rnd(5, 9), debris: true, rot: rnd(0, TAU), vr: rnd(-12, 12) });
  if(c.pl >= 0){
    if(G.mode === 'vs'){ const o = G.players[1 - c.pl]; G.vs.score[o.pl]++; c.respawn = 1.8; G.slowT = 0.6; if(typeof UI !== 'undefined') UI.vsKO(o.pl); if(G.vs.score[o.pl] >= G.vs.to){ G.vs.winner = o.pl; G.state = 'vsend'; G.overT = 0; G.slowT = 2; } }
    return;
  }
  const byPlayer = src && src.pl >= 0;
  if(G.mode === 'cup'){
    const n = c.coins + Math.floor(G.round / 3);
    for(let i = 0; i < n; i++) dropCoin(c.x, c.y);
    if(Math.random() < 0.08 && G.mode === 'cup') G.coins.push({ x: c.x, y: c.y, vx: rnd(-100, 100), vy: rnd(-100, 100), t: 0, wrench: true });
    if(byPlayer || src == null){
      G.run.wrecks++; save.stats.wrecks++;
      G.combo = G.comboT > 0 ? G.combo + 1 : 1; G.comboT = 2.4;
      G.run.maxCombo = Math.max(G.run.maxCombo, G.combo);
      G.run.score += 100 * G.combo;
      if(G.combo >= 2){ const names = ['', '', 'DOUBLE WRECK!', 'TRIPLE WRECK!', 'MEGA WRECK!', 'ULTRA WRECK!', 'MONSTER WRECK!', 'GODLIKE!']; floatText(names[Math.min(7, G.combo)] || 'GODLIKE!', c.x, c.y - 50, pick(['#ffd23a', '#ff5ce1', '#7df0ff']), 1.6); for(let i = 0; i < G.combo; i++) dropCoin(c.x, c.y); if(typeof AU !== 'undefined') AU.combo(G.combo); }
    }
    if(c.boss){
      G.run.bosses++; save.stats.bosses++; G.slowT = 1.6; G.flash = 0.8; G.flashC = '#ffffff'; G.shake = 26;
      for(let i = 0; i < 30; i++) dropCoin(c.x, c.y);
      for(const o of G.cars) if(o.pl < 0 && !o.dead && o !== c) kill(o, src);
      if(typeof SDK !== 'undefined') SDK.happytime();
    }
  }
  if(c.bomb && !silent) explode(c.x, c.y, 100, 26, src && src.pl >= 0 ? src : c);
  if(G.mode !== 'demo' || true) G.hitStop = Math.max(G.hitStop, c.boss ? 0.15 : 0.05);
  if(typeof AU !== 'undefined') AU.boom(c.boss ? 1.6 : 1);
}
function explode(x, y, R, dmg, src){
  explodeFx(x, y, R / 110, '#ff8a3a');
  G.decals.push({ t: 'scorch', x, y, r: R * 0.7 });
  if(typeof AU !== 'undefined') AU.boom(1);
  G.shake = Math.max(G.shake, 14);
  for(const c of G.cars){
    if(c.dead || c === src && src.pl >= 0) continue;
    const dx = c.x - x, dy = c.y - y, d = Math.hypot(dx, dy) || 1;
    if(d > R + c.r) continue;
    const k = 1 - Math.min(1, d / (R + c.r)) * 0.6;
    if(!(G.mode === 'demo' && c.pl >= 0)) hurt(c, dmg * k * (c.pl >= 0 && src && src.pl >= 0 ? 0.4 : 1), src, 'boom');
    c.vx += dx / d * 520 * k / c.mass; c.vy += dy / d * 520 * k / c.mass;
  }
  for(const p of G.props){ if(p.dead) continue; const d = Math.hypot(p.x - x, p.y - y); if(d < R + p.r){ if(p.k === 'barrel'){ if(!p.fuse){ p.fuse = 0.14; p.src = src; } } else if(p.k === 'cone' || p.k === 'tire'){ const a = Math.atan2(p.y - y, p.x - x); p.vx += Math.cos(a) * 500; p.vy += Math.sin(a) * 500; p.va = rnd(-15, 15); } else breakProp(p, src); } }
  for(const c of G.cars) for(const ch of c.chains){ const B = ch.pts[ch.pts.length - 1], dx = B.x - x, dy = B.y - y, d = Math.hypot(dx, dy) || 1; if(d < R * 1.3){ B.px -= dx / d * 8; B.py -= dy / d * 8; } }
}
function explodeFx(x, y, k, col){
  ring(x, y, '#ffffff', 90 * k); ring(x, y, '#ffb13a', 140 * k);
  burst(x, y, Math.round(26 * k), '#ffb13a', 420 * k, 6 * Math.sqrt(k), false, true);
  burst(x, y, Math.round(14 * k), col, 320 * k, 5, false, true);
  for(let i = 0; i < 10 * k; i++) G.parts.push({ x: x + rnd(-14, 14), y: y + rnd(-14, 14), vx: rnd(-90, 90), vy: rnd(-90, 90), life: 0, max: rnd(0.8, 1.4), c: 'rgba(60,50,60,0.55)', sz: rnd(10, 20) * Math.sqrt(k), smoke: true });
  G.booms.push({ x, y, t: 0, k });
}
function updateProps(dt){
  for(const p of G.props){
    if(p.dead) continue;
    if(p.fuse > 0){ p.fuse -= dt; if(p.fuse <= 0){ p.dead = true; if(G.mode === 'cup' && p.src && p.src.pl >= 0){ G.run.barrels++; save.stats.barrels++; } explode(p.x, p.y, 125, 40, p.src); } continue; }
    if(p.vx || p.vy){
      p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
      p.vx *= 1 - 3 * dt; p.vy *= 1 - 3 * dt; p.va *= 1 - 3 * dt;
      if(Math.abs(p.vx) < 3 && Math.abs(p.vy) < 3) p.vx = p.vy = 0;
      if(p.x < p.r || p.x > AW - p.r) p.vx = -p.vx; if(p.y < p.r || p.y > AH - p.r) p.vy = -p.vy;
      p.x = clamp(p.x, p.r, AW - p.r); p.y = clamp(p.y, p.r, AH - p.r);
    }
  }
  if(G.props.length > 80) G.props = G.props.filter(p => !p.dead);
}

/* ---------------- coins ---------------- */
function dropCoin(x, y){
  const a = Math.random() * TAU, s = rnd(80, 260);
  G.coins.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0 });
}
function updateCoins(dt){
  const p = G.players[0];
  if(!p || G.mode !== 'cup'){ G.coins = []; return; }
  const mag = 70 + (G.cards.magnet || 0) * 110;
  for(const c of G.coins){
    if(G.state === 'clear') c.pull = true;
    c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= 1 - 4 * dt; c.vy *= 1 - 4 * dt;
    const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy) || 1;
    if((d < mag && c.t > 0.3) || c.pull){ const sp = c.pull ? 900 : 520; c.vx = dx / d * sp; c.vy = dy / d * sp; }
    if(d < p.r + 14 && !p.dead){
      c.dead = true;
      if(c.wrench){ p.hp = Math.min(p.max, p.hp + 25); floatText('+25 🔧', p.x, p.y - 40, '#7dffb0', 1); if(typeof AU !== 'undefined') AU.heal(); }
      else { const v = 1 + save.perk.coin * 0.1; G.run.coins += v; if(typeof AU !== 'undefined') AU.coin(); }
    }
    if(c.t > 14 && !c.pull) c.dead = true;
  }
  G.coins = G.coins.filter(c => !c.dead);
}

/* ---------------- cards ---------------- */
function rollCards(){
  const opts = CARDS.filter(c => (G.cards[c.id] || 0) < c.max && c.id !== 'repair');
  const out = [];
  const p = G.players[0];
  if(p && p.hp < p.max * 0.5) out.push(CARDS.find(c => c.id === 'repair'));
  while(out.length < 3 && opts.length){ out.push(opts.splice(Math.floor(Math.random() * opts.length), 1)[0]); }
  while(out.length < 3) out.push(CARDS.find(c => c.id === 'repair'));
  return out;
}
function addCard(c){
  const p = G.players[0];
  G.cards[c.id] = (G.cards[c.id] || 0) + 1; G.cardList.push(c.id);
  if(c.id === 'armor'){ p.max += 30; p.hp += 30; }
  if(c.id === 'repair'){ p.hp = Math.min(p.max, p.hp + 60); G.cards.repair = 0; }
  if(['heavy', 'chain', 'twin'].includes(c.id)) rebuildChains(p, p.ballId);
}

/* ---------------- effects ---------------- */
function updateBooms(dt){ for(const b of G.booms) b.t += dt; G.booms = G.booms.filter(b => b.t < 0.5); }
function updateFx(dt){
  for(let i = G.parts.length - 1; i >= 0; i--){ const p = G.parts[i]; p.life += dt; if(p.life >= p.max){ G.parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; const k = p.smoke ? 0.96 : 0.9; p.vx *= k; p.vy *= k; if(p.rot !== undefined) p.rot += p.vr * dt; }
  if(G.parts.length > 900) G.parts.splice(0, G.parts.length - 900);
  for(let i = G.texts.length - 1; i >= 0; i--){ const t = G.texts[i]; t.life += dt; t.y -= dt * 40; if(t.life > t.max) G.texts.splice(i, 1); }
  for(let i = G.rings.length - 1; i >= 0; i--){ const r = G.rings[i]; r.life += dt; if(r.life > r.max) G.rings.splice(i, 1); }
  for(let i = G.bolts.length - 1; i >= 0; i--){ const b = G.bolts[i]; b.life += dt; if(b.life > b.max) G.bolts.splice(i, 1); }
}
function burst(x, y, n, col, sp, sz, wood, add){
  for(let i = 0; i < n; i++){ const a = Math.random() * TAU, s = rnd(0.2, 1) * sp; G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: rnd(0.3, 0.7), c: col, sz: rnd(sz * 0.5, sz), add, rot: wood ? rnd(0, TAU) : undefined, vr: wood ? rnd(-10, 10) : 0, debris: wood }); }
}
function ring(x, y, col, r){ G.rings.push({ x, y, col, r, life: 0, max: 0.45 }); }
function floatText(txt, x, y, col, size){ G.texts.push({ txt: String(txt), x, y, col, size: size || 1, life: 0, max: 0.9 }); if(G.texts.length > 40) G.texts.shift(); }
