'use strict';
/* =====================================================================
   SCORCHWAY: simulation
   Top-down arcade car physics. Drifting sets the ground on fire behind
   your rear wheels; pursuers that drive through it ignite and explode,
   and explosions set off chain reactions. Heat rises, the chase grows.
   ===================================================================== */
const G = {
  state:'boot', t:0, rt:0, score:0, kills:0, cashRun:0, heat:1, heatT:0, chain:0, chainT:0, maxChain:0, nearN:0, driftDist:0,
  E:[], F:[], PT:[], SM:[], DB:[], POP:[], FX:[], TM:[], PK:[], BM:[], MK:[], SC:[], MN:[],
  nitro:0, up:{}, mod:null, daily:false, revived:false, camX:0, camY:0, camZ:1, tod:.2,
  hitstop:0, slow:0, timeScale:1, shake:0, flash:0, flashCol:'#fff', runEv:{}, dieT:0, q:'high',
  tut:false, tutStep:0, tutT:0, spawnT:0, pickT:6, boss:null, pendingCards:false, heliT:0,
};
let P = null;

/* ---------------- tuning ---------------- */
const modId = () => G.mod ? G.mod.id : '';
const carDef = () => CARS.find(c => c.id === save.car) || CARS[0];
const topSpd = () => P.car.spd * (1 + .07 * (G.up.engine || 0)) * (1 + .04 * (save.meta.engine || 0));
const fireLife = () => 2.7 * (1 + .3 * (G.up.burn || 0)) * (1 + .15 * (save.meta.fuel || 0)) * P.car.fire * (modId() === 'inferno' ? 2 : 1);
const fireR = () => 17 * (1 + .25 * (G.up.flame || 0));
const cashMul = () => (1 + .15 * (save.meta.cash || 0)) * (({ night:1.5, glass:2, heat:1.5 })[modId()] || 1);
function targetZoom(){ const sp = P ? Math.hypot(P.vx, P.vy) : 0; return clamp(Math.sqrt(W * H) / 760, .6, 1.3) * (1 - .22 * clamp(sp / 650, 0, 1)); }
function viewR(){ return Math.hypot(W, H) / 2 / G.camZ; }

/* ---------------- the desert: props generated per cell, forever ---------------- */
const CELL = 230, ROAD_GAP = 2400, ROAD_W = 120;
const propCache = new Map(), destroyed = new Set();
function cellProp(i, j){
  const key = i + ',' + j;
  if(propCache.has(key)) return propCache.get(key);
  let p = null;
  const r = hash2(i, j, 11), ox = hash2(i, j, 12), oy = hash2(i, j, 13), cx0 = (i + .2 + ox * .6) * CELL, cy0 = (j + .2 + oy * .6) * CELL;
  const nearStart = Math.abs(cx0) < 500 && Math.abs(cy0) < 500;
  if(!nearStart && !onRoad(cx0, cy0, 60)){
    if(r < .15) p = { type:'cactus', r:12, h:34 + hash2(i, j, 14) * 30, arms:(hash2(i, j, 15) * 3) | 0 };
    else if(r < .23) p = { type:'rock', r:22 + hash2(i, j, 16) * 22, solid:true };
    else if(r < .31) p = { type:'bush', r:14 };
    else if(r < .335) p = { type:'barrel', r:12 };
    else if(r < .35) p = { type:'skull', r:10 };
    else if(r < .362 && Math.hypot(cx0, cy0) > 900) p = { type:'mesa', r:120 + hash2(i, j, 17) * 90, solid:true };
  }
  if(p){
    p.key = key; p.x = cx0; p.y = cy0; p.seed = (hash2(i, j, 18) * 1e9) | 0;
    if(p.type === 'mesa' || p.type === 'rock'){ const rr = mulberry32(p.seed), n = p.type === 'mesa' ? 14 : 8; p.pts = []; for(let k = 0; k < n; k++){ const a = k / n * TAU, q = p.r * (.78 + rr() * .3); p.pts.push([Math.cos(a) * q, Math.sin(a) * q]); } }
  }
  if(propCache.size > 6000) propCache.clear();
  propCache.set(key, p);
  return p;
}
function propsNear(x, y, rad, out){
  out = out || []; out.length = 0;
  const i0 = Math.floor((x - rad - 250) / CELL), i1 = Math.floor((x + rad + 250) / CELL), j0 = Math.floor((y - rad - 250) / CELL), j1 = Math.floor((y + rad + 250) / CELL);
  for(let i = i0; i <= i1; i++) for(let j = j0; j <= j1; j++){ const p = cellProp(i, j); if(p && !destroyed.has(p.key)) out.push(p); }
  return out;
}
function onRoad(x, y, pad){
  const w = ROAD_W / 2 + (pad || 0);
  const mx = ((x % ROAD_GAP) + ROAD_GAP) % ROAD_GAP, my = (((y - ROAD_GAP / 2) % ROAD_GAP) + ROAD_GAP) % ROAD_GAP;
  return mx < w || mx > ROAD_GAP - w || my < w || my > ROAD_GAP - w;
}

/* ---------------- run lifecycle ---------------- */
function newRun(daily){
  G.daily = !!daily;
  if(daily){ const seed = hashStr('scorchway:' + todayKey()); grng = mulberry32(seed); G.mod = MODS[seed % MODS.length]; }
  else { grng = Math.random; G.mod = null; }
  for(const k of ['E','F','PT','SM','DB','POP','FX','TM','PK','BM','MK','SC','MN']) G[k].length = 0;
  destroyed.clear();
  Object.assign(G, { t:0, score:0, kills:0, cashRun:0, heat:modId() === 'heat' ? 3 : 1, heatT:0, chain:0, chainT:0, maxChain:0, nearN:0, driftDist:0,
    nitro:save.meta.nitro ? 50 : 0, up:{}, revived:false, hitstop:0, slow:0, timeScale:1, shake:0, flash:0, runEv:{}, dieT:0,
    spawnT:3, pickT:6, boss:null, pendingCards:false, heliT:40, tod:modId() === 'night' ? .7 : .12 });
  const c = carDef();
  const hp = (c.hp + 15 * (save.meta.armor || 0)) * (modId() === 'glass' ? .5 : 1);
  P = { x:0, y:0, h:-Math.PI / 2, vx:0, vy:-80, steer:0, hp, maxHp:hp, inv:1, drift:false, slip:0, nitroOn:false, car:c, fireAcc:0, mineT:6, phoenix:false, wheels:null, len:54, wid:27, hurtT:0 };
  G.camX = 0; G.camY = 0; G.camZ = targetZoom();
  G.tut = !save.tut; G.tutStep = 0; G.tutT = 0;
  G.state = 'play';
  if(G.tut) tip(isTouch() ? '<b>Drag</b> to steer. Turn <em>HARD</em> to drift: drifting sets the ground <em>ON FIRE</em>!' : 'Your car steers toward the <b>mouse</b> (or A / D). Turn <em>HARD</em> to drift: it sets the ground <em>ON FIRE</em>!');
  AU.setMusic(1);
}

/* ---------------- input ---------------- */
const IN = { mx:0, my:0, mouse:false, keys:{}, joy:null, nitro:false, brake:false };
function steerInput(){
  if(G.state === 'menuplay') return G.menuSteer || [0, false];
  const k = IN.keys;
  let s = 0;
  if(k.a || k.arrowleft) s -= 1; if(k.d || k.arrowright) s += 1;
  if(s) return [s, !!(k[' '] || k.s || k.arrowdown || IN.brake)];
  let want = null;
  if(IN.joy && IN.joy.on){ const dx = IN.joy.x - IN.joy.ox, dy = IN.joy.y - IN.joy.oy; if(Math.hypot(dx, dy) > 12) want = Math.atan2(dy, dx); }
  else if(IN.mouse){ const wx = (IN.mx - W / 2) / G.camZ + G.camX, wy = (IN.my - H / 2) / G.camZ + G.camY; if(Math.hypot(wx - P.x, wy - P.y) > 40) want = Math.atan2(wy - P.y, wx - P.x); }
  if(want === null) return [0, !!(k[' '] || IN.brake)];
  const d = angDiff(want, P.h);
  // turning hard at speed pulls the handbrake automatically: that is the drift
  return [clamp(d * 2.4, -1, 1), Math.abs(d) > .8 || !!(k[' '] || IN.brake)];
}
const nitroHeld = () => G.state === 'menuplay' ? G.menuNitro : (IN.nitro || IN.keys.shift || IN.keys.w || IN.keys.arrowup);

/* ---------------- main update ---------------- */
function update(dt){
  G.rt += dt;
  G.shake = Math.max(0, G.shake - dt * 30); G.flash = Math.max(0, G.flash - dt * 2.5);
  if(G.hitstop > 0){ G.hitstop -= dt; return; }
  const target = G.state === 'dying' ? .25 : G.slow > 0 ? .35 : 1;
  G.timeScale = lerp(G.timeScale, target, Math.min(1, dt * 8));
  if(G.slow > 0) G.slow -= dt;
  const gdt = dt * G.timeScale;
  if(G.state === 'dying'){ G.dieT -= dt; carPhysics(P, gdt, 0, true, false, 0); tickWorld(gdt); if(G.dieT <= 0) onDeathDone(); updCamera(dt); return; }
  G.t += gdt;
  if(modId() !== 'night') G.tod = (.12 + G.t / 300) % 1;
  updPlayer(gdt);
  updEnemies(gdt);
  tickWorld(gdt);
  updHeat(gdt);
  spawnTick(gdt);
  for(let i = G.TM.length - 1; i >= 0; i--){ const t = G.TM[i]; t.t -= gdt; if(t.t <= 0){ G.TM.splice(i, 1); t.f(); } }
  if(G.chainT > 0){ G.chainT -= gdt; if(G.chainT <= 0) G.chain = 0; }
  ev('time', Math.floor(G.t));
  G.score += gdt * 10;
  updCamera(dt);
  if(G.tut){
    G.tutT += dt;
    if(G.tutStep === 0 && G.F.length > 20){ G.tutStep = 1; G.tutT = 0; tip('Now <b>lure the chasers</b> through your fire!'); }
    else if(G.tutStep === 1 && G.kills > 0){ G.tutStep = 2; G.tutT = 0; tip('Drifts and near misses charge <em>NITRO</em>. ' + (isTouch() ? 'Hold <b>NITRO</b>' : 'Hold the <b>left mouse button</b> or <b>SHIFT</b>') + ' to boost and ram!'); }
    else if(G.tutStep === 2 && G.tutT > 7){ G.tut = false; save.tut = true; persist(); tip(null); }
  }
  if(G.pendingCards){ G.pendingCards = false; openCards(); }
}
function updCamera(dt){
  G.camZ = lerp(G.camZ, targetZoom(), Math.min(1, dt * 1.5));
  const lead = .45;
  G.camX = lerp(G.camX, P.x + P.vx * lead, Math.min(1, dt * 3.5)); G.camY = lerp(G.camY, P.y + P.vy * lead, Math.min(1, dt * 3.5));
}

/* ---------------- car physics (shared by you and the pursuers) ---------------- */
function carPhysics(c, dt, steer, brake, nitro, gripK){
  const fx = Math.cos(c.h), fy = Math.sin(c.h), rx = -fy, ry = fx;
  let vf = c.vx * fx + c.vy * fy, vr = c.vx * rx + c.vy * ry;
  const road = onRoad(c.x, c.y);
  const top = c.top * (nitro ? 1.45 : 1) * (road ? 1.08 : 1), acc = c.acc * (nitro ? 2.3 : 1);
  if(c.dead) { vf *= Math.exp(-1.2 * dt); }
  else if(vf < top) vf += acc * (1 - Math.max(0, vf) / top) * dt; else vf = lerp(vf, top, Math.min(1, dt * 2));
  // steering: faster turning at speed, a little looser while drifting
  c.steer = lerp(c.steer, steer, Math.min(1, dt * 10));
  const sp = Math.hypot(c.vx, c.vy), turn = c.turn * clamp(sp / 180, 0, 1) * (brake ? 1.35 : 1);
  if(!c.dead) c.h += c.steer * turn * dt * (vf < 0 ? -1 : 1);
  // grip: lateral velocity bleeds away; the handbrake lets the tail slide
  const grip = (brake ? 1.0 : c.grip) * (gripK || 1) * (road ? 1.2 : 1);
  vr *= Math.exp(-grip * dt);
  if(brake) vf *= Math.exp(-.35 * dt);
  vf -= vf * .05 * dt;
  const nfx = Math.cos(c.h), nfy = Math.sin(c.h), nrx = -nfy, nry = nfx;
  c.vx = nfx * vf + nrx * vr; c.vy = nfy * vf + nry * vr;
  c.x += c.vx * dt; c.y += c.vy * dt;
  c.slip = sp > 60 ? Math.abs(vr) / sp : 0;
  c.drift = c.slip > .14 && sp > 150;
  return sp;
}

function updPlayer(dt){
  if(P.inv > 0) P.inv -= dt;
  if(P.hurtT > 0) P.hurtT -= dt;
  // the engine patches itself up if you stay out of trouble
  P.calm = (P.calm || 0) + dt; if(P.calm > 4 && P.hp < P.maxHp) P.hp = Math.min(P.maxHp, P.hp + 3 * dt);
  const [s, brake] = steerInput();
  const wantN = nitroHeld() && G.nitro > 0;
  P.nitroOn = wantN;
  if(wantN){ G.nitro = Math.max(0, G.nitro - 26 * dt); }
  P.top = topSpd(); P.acc = P.car.acc; P.turn = 3.1 * (1 + .12 * (G.up.grip || 0)); P.grip = P.car.grip * (1 + .15 * (G.up.grip || 0));
  const ox = P.x, oy = P.y;
  const sp = carPhysics(P, dt, s, brake, wantN);
  collideProps(P, true);
  const moved = Math.hypot(P.x - ox, P.y - oy);
  // drifting: fire from the rear wheels, tire marks, nitro charge
  const fx = Math.cos(P.h), fy = Math.sin(P.h), rx = -fy, ry = fx, back = -P.len * .36, half = P.wid * .45;
  const wl = [P.x + fx * back + rx * half, P.y + fy * back + ry * half], wr = [P.x + fx * back - rx * half, P.y + fy * back - ry * half];
  if(P.slip > .12 && sp > 120){
    if(P.wheels) addMark(P.wheels, wl, wr, clamp(P.slip * 1.6, .15, .5));
    if(Math.random() < dt * 30 * P.slip * 2) smoke(wl[0], wl[1], .9, '#e8dcc4');
  }
  P.wheels = [wl, wr];
  if(P.drift){
    P.fireAcc += moved;
    G.driftDist += moved / 10; ev('drift', moved / 10);
    G.nitro = Math.min(100, G.nitro + 13 * dt * (1 + .3 * (G.up.nitro || 0)));
    while(P.fireAcc > 13){ P.fireAcc -= 13; addFire(wl[0], wl[1]); addFire(wr[0], wr[1]); }
    AU.drift(true);
  } else { P.fireAcc = 0; AU.drift(false); }
  if(wantN){
    if(Math.random() < dt * 60){ const ex = P.x - fx * P.len * .55, ey = P.y - fy * P.len * .55; part(ex, ey, -fx * 300 + rnd(-40, 40), -fy * 300 + rnd(-40, 40), .25, pick(['#fff3b0', '#ffb347', '#ff6a1a']), rnd(4, 8)); }
    if(G.up.twin){ P.twinAcc = (P.twinAcc || 0) + moved; while(P.twinAcc > 18){ P.twinAcc -= 18; addFire(P.x - fx * P.len * .6, P.y - fy * P.len * .6); } }
  }
  if(G.up.mines){ P.mineT -= dt; if(P.mineT <= 0){ P.mineT = 6; G.MN.push({ x:P.x - fx * P.len, y:P.y - fy * P.len, arm:.8, t:0 }); AU.ui(); } }
  AU.engine(sp / P.top, wantN, P.slip);
  // pickups
  const mag = 60 + 120 * (G.up.magnet || 0);
  for(let i = G.PK.length - 1; i >= 0; i--){
    const p = G.PK[i]; p.t += dt;
    const dx = P.x - p.x, dy = P.y - p.y, d = Math.hypot(dx, dy) || 1;
    if(d < mag && p.t > .3){ p.x += dx / d * Math.min(d, 900 * dt); p.y += dy / d * Math.min(d, 900 * dt); }
    if(d < 34){
      G.PK.splice(i, 1);
      if(p.kind === 'cash'){ G.cashRun += p.v * cashMul(); AU.cash(); pop(P.x, P.y - 40, '+$' + Math.round(p.v * cashMul()), '#2e7d32', 16); }
      else if(p.kind === 'wrench'){ P.hp = Math.min(P.maxHp, P.hp + 30); AU.repair(); pop(P.x, P.y - 40, '+30 ARMOR', '#2a9d8f', 18); }
      else { G.nitro = Math.min(100, G.nitro + 35); AU.pickup(); pop(P.x, P.y - 40, '+NITRO', '#e2582b', 18); }
    } else if(p.t > 25) G.PK.splice(i, 1);
  }
}
function addFire(x, y){
  if(G.F.length > 520) G.F.splice(0, G.F.length - 520);
  const l = fireLife() * rnd(.85, 1.15);
  G.F.push({ x:x + rnd(-3, 3), y:y + rnd(-3, 3), r:fireR() * rnd(.85, 1.15), life:l, max:l, ph:Math.random() * TAU });
}
function addMark(prev, wl, wr, a){
  G.MK.push({ x1:prev[0][0], y1:prev[0][1], x2:wl[0], y2:wl[1], a, life:12 }, { x1:prev[1][0], y1:prev[1][1], x2:wr[0], y2:wr[1], a, life:12 });
  if(G.MK.length > 1400) G.MK.splice(0, G.MK.length - 1400);
}

/* ---------------- collisions with the world ---------------- */
const _near = [];
function collideProps(c, isPlayer){
  const R = c.len * .42;
  propsNear(c.x, c.y, R, _near);
  for(const p of _near){
    const dx = c.x - p.x, dy = c.y - p.y, d = Math.hypot(dx, dy) || 1, rr = R + p.r * (p.type === 'mesa' ? .92 : 1);
    if(d >= rr) continue;
    const sp = Math.hypot(c.vx, c.vy);
    if(p.type === 'cactus' || p.type === 'bush' || p.type === 'skull'){
      if(sp > 80){
        destroyed.add(p.key);
        for(let k = 0; k < (p.type === 'cactus' ? 14 : 8); k++) part(p.x, p.y, rnd(-180, 180), rnd(-180, 180), rnd(.4, .8), p.type === 'cactus' ? pick(['#4f7a3a', '#6b9a4a', '#3d5f2d']) : pick(['#a8864f', '#c9a76b']), rnd(3, 6));
        if(p.type === 'cactus'){ c.vx *= .95; c.vy *= .95; if(isPlayer){ AU.crunch(); G.score += 5; } }
      }
      continue;
    }
    if(p.type === 'barrel'){ destroyed.add(p.key); explode(p.x, p.y, 1, isPlayer ? 'player' : 'env'); continue; }
    // solid: push out and bounce
    const nx = dx / d, ny = dy / d, vn = c.vx * nx + c.vy * ny;
    c.x = p.x + nx * rr; c.y = p.y + ny * rr;
    if(vn < 0){ c.vx -= nx * vn * 1.4; c.vy -= ny * vn * 1.4; c.vx *= .75; c.vy *= .75; }
    const impact = -vn;
    if(isPlayer){ if(impact > 200){ damagePlayer((impact - 180) / 16, p.x, p.y); AU.crash(impact / 600); } }
    else if(impact > 220 && !c.dead){ c.hp -= impact > 380 ? 2 : 1; if(c.hp <= 0) wreck(c, 'rock'); }
  }
}

/* ---------------- pursuers ---------------- */
function spawnEnemy(type, x, y){
  const d = ET[type], sk = Math.min(1.15, .8 + .05 * (G.heat - 1));
  const e = { type, d, x, y, h:Math.atan2(P.y - y, P.x - x), vx:0, vy:0, steer:0, top:d.spd * sk, acc:d.acc, grip:d.grip, turn:3.2, hp:d.hp, burnT:0, fuse:0, len:d.len, wid:d.wid, slip:0, t:0, near:0, hitT:0, ph:grng() * TAU };
  if(type === 'heli'){ e.alt = 1; e.bombT = 3; e.life = 26; }
  G.E.push(e);
  if(d.tip && !save.seen[type] && G.state === 'play'){ save.seen[type] = true; persist(); G.TM.push({ t:.6, f:() => { if(G.state === 'play'){ tip(d.tip); G.TM.push({ t:5, f:() => { if(!G.tut) tip(null); } }); } } }); }
  return e;
}
function spawnBoss(){
  const a = Math.atan2(P.vy, P.vx) + Math.PI + rnd(-.6, .6), d = viewR() + 200;
  const e = spawnEnemy('truck', P.x + Math.cos(a) * d, P.y + Math.sin(a) * d);
  Object.assign(e, { boss:true, name:'THE JUGGERNAUT', hp:100, maxHp:100, len:112, wid:46, top:500 * (1 + .05 * (G.heat - 5)), acc:340, grip:5, spawnT:6 });
  e.d = Object.assign({}, ET.truck, { dmg:22, mass:4, col:'#7a3a1c', cash:150 });
  G.boss = e;
  announce('THE JUGGERNAUT', '#e2582b', 'BURN IT DOWN'); AU.bossHorn(); AU.setMusic(3); shakeIt(10);
}
const _ne = [];
function updEnemies(dt){
  for(const e of G.E){
    if(e.gone) continue;
    e.t += dt; if(e.hitT > 0) e.hitT -= dt; if(e.near > 0) e.near -= dt;
    if(e.type === 'heli'){ updHeli(e, dt); continue; }
    const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1;
    // aim a little ahead of you; bikes weave; burning cars lose control
    const lead = Math.min(1, d / 600);
    let tx = P.x + P.vx * lead * .9, ty = P.y + P.vy * lead * .9;
    if(e.type === 'bike'){ tx += Math.sin(e.t * 2 + e.ph) * 90; ty += Math.cos(e.t * 2 + e.ph) * 90; }
    let want = Math.atan2(ty - e.y, tx - e.x);
    // avoid big rocks and mesas ahead
    propsNear(e.x + Math.cos(e.h) * 90, e.y + Math.sin(e.h) * 90, 60, _ne);
    for(const p of _ne){ if(!p.solid) continue; const ax = p.x - e.x, ay = p.y - e.y, ad = Math.hypot(ax, ay); if(ad < p.r + 150){ const side = angDiff(Math.atan2(ay, ax), e.h) > 0 ? -1 : 1; want += side * .9 * (1 - ad / (p.r + 150)); } }
    let steer = e.fuse > 0 ? Math.sin(e.t * 18) : clamp(angDiff(want, e.h) * 2.2, -1, 1);
    const catchUp = d > 900 ? 1.3 : 1;
    const top0 = e.top; e.top *= catchUp * (e.fuse > 0 ? .7 : 1);
    carPhysics(e, dt, steer, false, false, e.fuse > 0 ? .3 : 1);
    e.top = top0;
    collideProps(e, false);
    if(d > 2800 && !e.boss) e.gone = true;
    // standing in fire
    if(e.fuse <= 0){
      let inF = false;
      const er = e.len * .4;
      for(const f of G.F){ const fx = f.x - e.x, fy = f.y - e.y; if(fx * fx + fy * fy < (f.r + er) * (f.r + er)){ inF = true; break; } }
      if(inF){
        if(e.boss){ e.hp -= 22 * dt; e.burnFx = .2; if(e.hp <= 0) wreck(e, 'fire'); }
        else { e.burnT += dt; if(e.burnT >= e.d.burn * Math.max(1, e.hp)) ignite(e); }
      } else e.burnT = Math.max(0, e.burnT - dt * .5);
    } else {
      e.fuse -= dt;
      if(Math.random() < dt * 40) part(e.x + rnd(-10, 10), e.y + rnd(-10, 10), rnd(-40, 40), rnd(-40, 40), .4, pick(['#ffcf5a', '#ff7b2a', '#e2582b']), rnd(5, 9));
      if(Math.random() < dt * 14) smoke(e.x, e.y, 1.2, '#3a3431');
      if(e.fuse <= 0) wreck(e, 'fire');
    }
    if(e.boss){ e.spawnT -= dt; if(e.spawnT <= 0){ e.spawnT = 7; for(let k = 0; k < 2; k++){ const b = spawnEnemy('buggy', e.x - Math.cos(e.h) * 80 + rnd(-30, 30), e.y - Math.sin(e.h) * 80 + rnd(-30, 30)); b.h = e.h; b.vx = e.vx; b.vy = e.vy; } } }
    // siren sound + near misses
    if(G.state === 'play' && !e.near && d < e.len * .5 + P.len * .5 + 26 && d > e.len * .4 + P.len * .4){
      const rv = Math.hypot(P.vx - e.vx, P.vy - e.vy);
      if(rv > 260){ e.near = 1.5; G.nearN++; ev('near', 1); G.nitro = Math.min(100, G.nitro + 8); G.score += 25; pop(P.x, P.y - 46, 'NEAR MISS', '#b8860b', 15); AU.whoosh(); }
    }
  }
  // car-car collisions
  const all = G.E.filter(e => !e.gone && e.type !== 'heli');
  for(let i = 0; i < all.length; i++){
    const a = all[i];
    carHit(P, a, true);
    for(let j = i + 1; j < all.length; j++) carHit(a, all[j], false);
  }
  if(G.E.some(e => e.gone)) G.E = G.E.filter(e => !e.gone);
  for(let i = G.MN.length - 1; i >= 0; i--){
    const m = G.MN[i]; m.t += dt;
    if(m.t < m.arm) continue;
    if(G.E.some(e => e.type !== 'heli' && !e.gone && (e.x - m.x) ** 2 + (e.y - m.y) ** 2 < 36 * 36)){ G.MN.splice(i, 1); explode(m.x, m.y, 1.1, 'player'); }
    else if(m.t > 30) G.MN.splice(i, 1);
  }
}
function carHit(a, b, isP){
  if(a.gone || b.gone) return;
  const ra = a.len * .42, rb = b.len * .42, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, rr = ra + rb * .9;
  if(d >= rr) return;
  const nx = dx / d, ny = dy / d, ma = isP ? 1 : a.d.mass, mb = b.d.mass;
  const push = (rr - d), wa = mb / (ma + mb);
  a.x -= nx * push * wa; a.y -= ny * push * wa; b.x += nx * push * (1 - wa); b.y += ny * push * (1 - wa);
  const rvn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if(rvn <= 0) return;
  const j = rvn * 1.3;
  a.vx -= nx * j * wa; a.vy -= ny * j * wa; b.vx += nx * j * (1 - wa); b.vy += ny * j * (1 - wa);
  for(let k = 0; k < 6; k++) part((a.x + b.x) / 2, (a.y + b.y) / 2, rnd(-200, 200), rnd(-200, 200), .3, pick(['#fff3b0', '#ffcf5a', '#d9d4c7']), rnd(2, 4));
  if(isP){
    AU.crash(rvn / 500);
    const rams = P.nitroOn || (G.up.spike && b.d.mass <= (G.up.spike >= 2 ? 2.2 : 1));
    if(rams && rvn > 120 && !b.boss){ wreck(b, 'ram'); G.score += 50; pop(b.x, b.y - 30, 'RAMMED!', '#e2582b', 18); G.hitstop = .05; shakeIt(8); }
    else if(b.boss && P.nitroOn && rvn > 200){ b.hp -= 12; b.hitT = .3; damagePlayer(6, b.x, b.y); shakeIt(10); }
    else if(rvn > 110 && b.hitT <= 0){ b.hitT = 1; damagePlayer(b.d.dmg * clamp(rvn / 450, .25, 1.2) * (P.drift ? .5 : 1), b.x, b.y); if(P.drift) pop(P.x, P.y - 60, 'DRIFT ARMOR', '#2a9d8f', 12); }
  } else if(rvn > 260){
    // pursuers smashing into each other wreck the lighter one
    const lighter = a.d.mass <= b.d.mass ? a : b;
    if(!lighter.boss && lighter.fuse <= 0){ lighter.hp--; if(lighter.hp <= 0) wreck(lighter, 'crash'); }
  }
}
function ignite(e){ if(e.fuse > 0 || e.gone) return; e.fuse = .45; AU.ignite(); }
function wreck(e, how){
  if(e.gone) return;
  e.gone = true;
  if(e.boss){ bossDown(e); return; }
  explode(e.x, e.y, e.type === 'truck' ? 1.4 : e.type === 'bike' ? .8 : 1.1, 'kill');
  for(let k = 0; k < 7; k++) G.DB.push({ x:e.x, y:e.y, vx:rnd(-340, 340), vy:rnd(-340, 340), a:rnd(0, TAU), va:rnd(-12, 12), w:rnd(6, 14), h:rnd(4, 9), c:pick([e.d.col, '#2a2522', '#6b6158']), life:rnd(1, 1.8), max:1.8, z:0, vz:rnd(150, 380) });
  G.kills++; ev('kill', 1);
  G.chain = G.chainT > 0 ? G.chain + 1 : 1; G.chainT = 3; G.maxChain = Math.max(G.maxChain, G.chain); ev('chain', G.chain);
  G.score += 100 * Math.min(10, G.chain); G.nitro = Math.min(100, G.nitro + 6);
  const W2 = { 2:'DOUBLE BURN', 3:'TRIPLE BURN', 5:'INFERNO', 8:'WILDFIRE', 12:'APOCALYPSE', 18:'SCORCHED EARTH' };
  if(W2[G.chain]){ announce(W2[G.chain], G.chain >= 8 ? '#b3262d' : '#e2582b', '+' + fmt(100 * G.chain)); AU.stinger(G.chain); if(G.chain >= 8 && G.state === 'play') SDK.happytime(); }
  const n = Math.max(1, Math.round(e.d.cash / 6));
  for(let k = 0; k < n; k++) G.PK.push({ x:e.x + rnd(-20, 20), y:e.y + rnd(-20, 20), kind:'cash', v:e.d.cash / n, t:0 });
  if(Math.random() < .06) G.PK.push({ x:e.x, y:e.y, kind:Math.random() < .5 ? 'wrench' : 'nitro', v:1, t:0 });
  if(G.tut && G.tutStep === 1){ G.tutStep = 2; G.tutT = 0; tip('Drifts and near misses charge <em>NITRO</em>. ' + (isTouch() ? 'Hold <b>NITRO</b>' : 'Hold the <b>left mouse button</b> or <b>SHIFT</b>') + ' to boost and ram!'); }
}
function explode(x, y, size, src){
  const R = 115 * size * (1 + .3 * (G.up.napalm || 0));
  G.FX.push({ boom:true, x, y, r:R, life:.55, max0:.55 });
  G.SC.push({ x, y, r:R * .55, life:30, seed:(Math.random() * 1e9) | 0 }); if(G.SC.length > 60) G.SC.shift();
  for(let k = 0; k < 18; k++){ const a = rnd(0, TAU), s = rnd(120, 420) * size; part(x, y, Math.cos(a) * s, Math.sin(a) * s, rnd(.3, .7), pick(['#fff3b0', '#ffcf5a', '#ff7b2a', '#e2582b']), rnd(4, 10)); }
  for(let k = 0; k < 7; k++) smoke(x + rnd(-30, 30), y + rnd(-30, 30), 1.6 * size, pick(['#3a3431', '#5a514b', '#2a2522']));
  for(let k = 0; k < 6; k++){ const a = k / 6 * TAU + rnd(-.3, .3), d = R * rnd(.2, .5); G.F.push({ x:x + Math.cos(a) * d, y:y + Math.sin(a) * d, r:fireR() * 1.2, life:1.6, max:1.6, ph:Math.random() * TAU }); }
  shakeIt(9 * size); AU.boom(size);
  // chain reaction: nearby cars ignite; the boss takes a hit; you get singed if too close
  for(const e of G.E){
    if(e.gone || e.type === 'heli') continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if(d > R + e.len * .3) continue;
    if(e.boss){ e.hp -= 9 * size; e.hitT = .2; if(e.hp <= 0) wreck(e, 'boom'); }
    else { if(e.fuse <= 0) e.fuse = .18 + d / R * .25; }
    e.vx += (e.x - x) / (d || 1) * 300; e.vy += (e.y - y) / (d || 1) * 300;
  }
  if(G.state === 'play'){ const d = Math.hypot(P.x - x, P.y - y); if(d < R * .6) damagePlayer(src === 'bomb' ? 16 : 4, x, y); }
  for(const p of propsNear(x, y, R, _near)) if((p.type === 'cactus' || p.type === 'bush') && Math.hypot(p.x - x, p.y - y) < R){ destroyed.add(p.key); for(let k = 0; k < 6; k++) part(p.x, p.y, rnd(-120, 120), rnd(-120, 120), .6, '#3d5f2d', 4); }
}
function updHeli(e, dt){
  e.life -= dt;
  const fx = Math.cos(P.h), fy = Math.sin(P.h);
  const leaving = e.life <= 0;
  const tx = leaving ? e.x + (e.x - P.x) : P.x - fx * 180 + Math.sin(e.t * .7) * 160, ty = leaving ? e.y + (e.y - P.y) : P.y - fy * 180 + Math.cos(e.t * .6) * 160;
  const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1, sp = Math.min(leaving ? 500 : 720, d * 2.2);
  e.vx = lerp(e.vx, dx / d * sp, Math.min(1, dt * 1.6)); e.vy = lerp(e.vy, dy / d * sp, Math.min(1, dt * 1.6));
  e.x += e.vx * dt; e.y += e.vy * dt; e.h = Math.atan2(e.vy, e.vx);
  if(leaving){ if(Math.hypot(e.x - P.x, e.y - P.y) > viewR() * 1.6) e.gone = true; return; }
  e.bombT -= dt;
  if(e.bombT <= 0){ e.bombT = 2.6; G.BM.push({ x:P.x + P.vx * 1.15 + rnd(-40, 40), y:P.y + P.vy * 1.15 + rnd(-40, 40), t:0, dur:1.25, r:95 }); AU.bombDrop(); }
}
function bossDown(e){
  G.boss = null; ev('boss', 1);
  for(let k = 0; k < 4; k++) G.TM.push({ t:k * .18, f:() => explode(e.x + rnd(-50, 50), e.y + rnd(-50, 50), 1.6, 'kill') });
  G.slow = 1.2; G.flash = 1; G.flashCol = '#fff3b0'; shakeIt(24);
  for(let k = 0; k < 25; k++) G.PK.push({ x:e.x + rnd(-80, 80), y:e.y + rnd(-80, 80), kind:'cash', v:6, t:0 });
  G.PK.push({ x:e.x, y:e.y, kind:'wrench', v:1, t:0 });
  G.kills++; G.score += 5000; ev('kill', 1);
  announce('JUGGERNAUT WRECKED', '#b8860b', '+5,000'); SDK.happytime(); AU.setMusic(2);
}

/* ---------------- world tick: fire, bombs, fx ---------------- */
function tickWorld(dt){
  for(let i = G.F.length - 1; i >= 0; i--){ const f = G.F[i]; f.life -= dt; if(f.life <= 0){ G.F.splice(i, 1); if(Math.random() < .3) smoke(f.x, f.y, .8, '#4a423d'); } }
  for(let i = G.BM.length - 1; i >= 0; i--){ const b = G.BM[i]; b.t += dt; if(b.t >= b.dur){ G.BM.splice(i, 1); explode(b.x, b.y, 1.1, 'bomb'); } }
  for(let i = G.MK.length - 1; i >= 0; i--){ G.MK[i].life -= dt; if(G.MK[i].life <= 0) G.MK.splice(i, 1); }
  for(let i = G.SC.length - 1; i >= 0; i--){ G.SC[i].life -= dt; if(G.SC[i].life <= 0) G.SC.splice(i, 1); }
  for(let i = G.PT.length - 1; i >= 0; i--){ const p = G.PT[i]; p.life -= dt; if(p.life <= 0){ G.PT.splice(i, 1); continue; } const f = Math.exp(-3 * dt); p.vx *= f; p.vy *= f; p.x += p.vx * dt; p.y += p.vy * dt; }
  for(let i = G.SM.length - 1; i >= 0; i--){ const s = G.SM[i]; s.life -= dt; if(s.life <= 0){ G.SM.splice(i, 1); continue; } s.x += s.vx * dt; s.y += s.vy * dt; s.r += s.gr * dt; }
  for(let i = G.DB.length - 1; i >= 0; i--){ const b = G.DB[i]; b.life -= dt; if(b.life <= 0){ G.DB.splice(i, 1); continue; } const f = Math.exp(-2 * dt); b.vx *= f; b.vy *= f; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt; b.vz -= 900 * dt; b.z = Math.max(0, b.z + b.vz * dt); if(b.z === 0){ b.vz *= -.3; b.va *= .6; } }
  for(let i = G.POP.length - 1; i >= 0; i--){ const p = G.POP[i]; p.life -= dt; p.y -= 40 * dt / G.camZ; if(p.life <= 0) G.POP.splice(i, 1); }
  for(let i = G.FX.length - 1; i >= 0; i--){ const f = G.FX[i]; f.life -= dt; if(f.life <= 0) G.FX.splice(i, 1); }
}

/* ---------------- heat & spawning ---------------- */
function updHeat(dt){
  G.heatT += dt;
  if(G.heatT >= HEAT_T){
    G.heatT = 0; G.heat++; ev('heat', G.heat);
    announce('HEAT ' + G.heat, '#b3262d', G.heat % 4 === 1 ? 'JUGGERNAUT INCOMING' : 'MORE OF THEM');
    AU.siren1(); G.score += 500 * G.heat;
    if(G.heat % 4 === 1 && !G.boss) G.TM.push({ t:2.5, f:() => { if(G.state === 'play') spawnBoss(); } });
    if(!G.boss) AU.setMusic(G.heat >= 3 ? 2 : 1);
    G.TM.push({ t:1.4, f:() => { if(G.state === 'play') G.pendingCards = true; } });
  }
}
function spawnTick(dt){
  G.spawnT -= dt;
  const cap = Math.min(26, 2 + G.heat * 2.2) * (modId() === 'swarm' ? 1.6 : 1), alive = G.E.filter(e => e.type !== 'heli').length;
  if(G.spawnT <= 0 && alive < cap && G.t > 2.5){
    G.spawnT = Math.max(.55, 1.8 - .12 * G.heat);
    const pool = Object.keys(ET).filter(k => k !== 'heli' && ET[k].at <= G.heat);
    const tot = pool.reduce((s, k) => s + ET[k].w * (k === 'buggy' && modId() === 'swarm' ? 2 : 1), 0);
    let r = grng() * tot, type = pool[0];
    for(const k of pool){ r -= ET[k].w * (k === 'buggy' && modId() === 'swarm' ? 2 : 1); if(r <= 0){ type = k; break; } }
    const back = Math.atan2(P.vy, P.vx) + Math.PI, a = back + gr(-1.6, 1.6), d = viewR() + gr(80, 260);
    const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if(!propsNear(x, y, 0, _near).some(p => p.solid && Math.hypot(p.x - x, p.y - y) < p.r + 40)){
      const e = spawnEnemy(type, x, y); const sp = Math.hypot(P.vx, P.vy) * .8; e.vx = Math.cos(e.h) * sp; e.vy = Math.sin(e.h) * sp;
    }
  }
  G.heliT -= dt;
  if(G.heat >= ET.heli.at && G.heliT <= 0 && !G.E.some(e => e.type === 'heli')){ G.heliT = 45; const a = rnd(0, TAU), e = spawnEnemy('heli', P.x + Math.cos(a) * viewR(), P.y + Math.sin(a) * viewR()); AU.heliIn(); void e; }
  G.pickT -= dt;
  if(G.pickT <= 0){ G.pickT = gr(7, 11); const a = Math.atan2(P.vy, P.vx) + gr(-.7, .7), d = gr(500, 800); G.PK.push({ x:P.x + Math.cos(a) * d, y:P.y + Math.sin(a) * d, kind:P.hp < P.maxHp * .6 ? 'wrench' : pick(['nitro', 'wrench', 'cash']), v:15, t:0 }); }
}

/* ---------------- hurt / death ---------------- */
function damagePlayer(n, x, y){
  if(G.state !== 'play' || P.inv > 0 || n <= 0) return;
  P.hp -= n; P.hurtT = .3; P.inv = Math.max(P.inv, n >= 5 ? .7 : .25); P.calm = 0;
  G.flash = Math.min(1, .25 + n / 40); G.flashCol = '#b3262d'; shakeIt(4 + n * .5);
  if(n >= 6) pop(P.x, P.y - 44, '-' + Math.round(n), '#b3262d', 16);
  if(n > 12) G.hitstop = .05;
  if(P.hp <= 0){
    if(G.up.phoenix && !P.phoenix){ P.phoenix = true; P.hp = P.maxHp * .5; P.inv = 2; explode(P.x, P.y, 1.6, 'player'); announce('PHOENIX', '#e2582b', 'BACK FROM THE ASHES'); return; }
    P.hp = 0; die();
  }
}
function die(){
  G.state = 'dying'; G.dieT = 1.8; G.slow = 2;
  explode(P.x, P.y, 1.8, 'env'); AU.wreck();
  for(let k = 0; k < 10; k++) G.DB.push({ x:P.x, y:P.y, vx:rnd(-380, 380), vy:rnd(-380, 380), a:rnd(0, TAU), va:rnd(-12, 12), w:rnd(6, 16), h:rnd(4, 10), c:pick([P.car.body, P.car.stripe, '#2a2522']), life:rnd(1.2, 2), max:2, z:0, vz:rnd(200, 420) });
  P.dead = true; AU.setMusic(0); AU.engineOff();
}

/* ---------------- fx helpers ---------------- */
function partCap(){ return G.q === 'low' ? 250 : 700; }
function part(x, y, vx, vy, life, c, s){ if(G.PT.length < partCap()) G.PT.push({ x, y, vx, vy, life, max:life, c, s }); }
function smoke(x, y, k, c){ if(G.SM.length > (G.q === 'low' ? 80 : 200)) return; G.SM.push({ x, y, vx:rnd(-20, 20) + 10, vy:rnd(-30, -5), r:8 * k, gr:26 * k, life:rnd(.8, 1.5) * k, max:1.5 * k, c }); }
function pop(x, y, txt, c, size){ if(G.POP.length > 14) G.POP.shift(); G.POP.push({ x, y, txt, c, size:size || 14, life:1 }); }
function shakeIt(v){ if(save.opt.shake) G.shake = Math.min(22, G.shake + v); }

/* ---------------- missions ---------------- */
function ev(type, v){
  if(G.state !== 'play') return;
  const r = G.runEv, mt = MT.find(m => m.ev === type);
  if(!mt) return;
  r[type] = mt.kind === 'sum' ? (r[type] || 0) + v : Math.max(r[type] || 0, v);
  for(const m of save.missions){
    if(m.done || m.ev !== type) continue;
    const prog = mt.kind === 'sum' ? m.p + r[type] : Math.max(m.p, r[type]);
    if(prog >= m.n){
      m.done = true; m.p = m.n; m.fresh = true;
      save.cash += m.reward; save.missionsDone++;
      save.mTier[m.id] = (save.mTier[m.id] || 0) + 1;
      toast('MISSION COMPLETE', m.txt + '  <b class="gold">+$' + m.reward + '</b>', '#2a9d8f', 3400);
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
    save.missions.push({ id:t.id, ev:t.ev, n, p:0, done:false, txt:t.txt(n), reward:40 + tier * 30 });
    have.add(t.id); save.mNew = true;
  }
}
