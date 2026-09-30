'use strict';
/* =====================================================================
   MOCHI MOB: simulation. The mob is a flock of up to MAX_MOB mochi that
   forms a disc around the player's target point. Hold = squish into a
   dense ball (smashes crates, rams gobblers), release = burst outward.
   ===================================================================== */
const MAX_MOB = 400, MR = 12;
const G = {
  state: 'title', day: 1, cfg: null, t: 0, left: 90, meter: 0,
  mob: [], wild: [], fruits: [], eggs: [], crates: [], treasures: [], gobs: [], cacti: [],
  parts: [], texts: [], rings: [], warns: [], nest: null,
  tx: 0, ty: 0, squish: false, squishT: 0, cx: 0, cy: 0, csp: 0,
  cam: { x: 0, y: 0, z: 1 }, shake: 0, flash: 0, flashC: '#fff',
  ev: null, nextEv: 12, lastEv: '', frenzy: 0, magnet: 0, melon: null, pinata: null,
  chain: 0, chainT: 0, run: null, result: null, endT: 0, tipT: 0, tips: {}, startMob: 0
};
const grid = { cell: 40, map: new Map() };
function gkey(x, y){ return ((x / grid.cell) | 0) * 100000 + ((y / grid.cell) | 0); }
function buildGrid(){
  // arrays are reused between frames so a 400-mochi mob doesn't churn memory
  for(const a of grid.map.values()) a.length = 0;
  for(const m of G.mob){
    const k = gkey(m.x, m.y);
    let a = grid.map.get(k); if(!a){ a = []; grid.map.set(k, a); } a.push(m);
  }
  if(grid.map.size > 4000) grid.map.clear();
}
function near(x, y, r, fn){
  const c = grid.cell, x0 = ((x - r) / c) | 0, x1 = ((x + r) / c) | 0, y0 = ((y - r) / c) | 0, y1 = ((y + r) / c) | 0, r2 = r * r;
  for(let gx = x0; gx <= x1; gx++) for(let gy = y0; gy <= y1; gy++){
    const a = grid.map.get(gx * 100000 + gy); if(!a) continue;
    for(const m of a){ if(m.dead) continue; const dx = m.x - x, dy = m.y - y; if(dx * dx + dy * dy < r2 && fn(m) === false) return; }
  }
}
function countNear(x, y, r, squishOnly){ let n = 0; near(x, y, r, m => { if(m.st === 0 && (!squishOnly || G.squish)) n++; }); return n; }

/* ---------------- mochi ---------------- */
function newMochi(x, y, vx = 0, vy = 0){
  const a = Math.random() * TAU, d = Math.sqrt(Math.random());
  return { x, y, vx, vy, ox: Math.cos(a) * d, oy: Math.sin(a) * d, st: 0, tr: null, slot: 0, bob: Math.random() * TAU, born: G.t, dead: false, sq: 1, hue: Math.random() * 360 };
}
function addMochi(n, x, y, spd = 260){
  let added = 0;
  for(let i = 0; i < n; i++){
    if(G.mob.length >= MAX_MOB){ const c = n - added; if(c > 0){ gainCoins(c * 2, x, y - 30); floatText('MOB FULL! +' + c * 2, x, y - 60, '#ffe14d'); } break; }
    const a = Math.random() * TAU, v = spd * (0.4 + Math.random() * 0.6);
    G.mob.push(newMochi(x + Math.cos(a) * 6, y + Math.sin(a) * 6, Math.cos(a) * v, Math.sin(a) * v));
    added++;
  }
  G.run.peak = Math.max(G.run.peak, G.mob.length);
  return added;
}
function killMochi(m, why){
  if(m.dead) return;
  m.dead = true;
  if(m.tr){ m.tr.carriers = m.tr.carriers.filter(c => c !== m); m.tr = null; }
  burst(m.x, m.y, 6, flavorCol(m), 160, 4);
  G.run.lost++;
  if(why) AU.lose1();
}
function freeCount(){ let n = 0; for(const m of G.mob) if(m.st === 0) n++; return n; }

/* ---------------- day setup ---------------- */
function setupWorld(cfg, title){
  const W = cfg.W, H = cfg.H;
  Object.assign(G, { cfg, t: 0, left: cfg.time, meter: 0, mob: [], wild: [], fruits: [], eggs: [], crates: [], treasures: [], gobs: [], cacti: [], parts: [], texts: [], rings: [], warns: [],
    ev: null, nextEv: title ? 1e9 : 11, lastEv: '', frenzy: 0, magnet: 0, melon: null, pinata: null, chain: 0, squish: false, squishT: 0, result: null, endT: 0, tips: {} });
  G.run = { coins: 0, hatch: 0, eat: 0, pop: 0, deliver: 0, crates: 0, peak: 0, events: 0, lost: 0 };
  G.nest = { x: W / 2, y: H - 190, r: 95, bounce: 0 };
  const taken = [];
  const free = (x, y, r) => {
    if(Math.hypot(x - G.nest.x, y - G.nest.y) < r + 170) return false;
    for(const t of taken) if(Math.hypot(x - t.x, y - t.y) < r + t.r + 30) return false;
    return x > r + 40 && x < W - r - 40 && y > r + 40 && y < H - r - 40;
  };
  const place = (r, tries = 60) => { for(let i = 0; i < tries; i++){ const x = rnd(0, W), y = rnd(0, H); if(free(x, y, r)){ taken.push({ x, y, r }); return { x, y }; } } return null; };
  // fruit clusters
  for(let i = 0; i < cfg.fruitClusters; i++){
    const p = place(70); if(!p) continue;
    const n = 8 + Math.floor(Math.random() * 9), k = pick(['berry', 'cherry', 'grape', 'orange']);
    for(let j = 0; j < n; j++){ const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * 62; G.fruits.push(newFruit(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, k)); }
  }
  for(let i = 0; i < cfg.eggs; i++){ const p = place(20); if(p) G.eggs.push({ x: p.x, y: p.y, r: 17, big: false, wob: Math.random() * TAU }); }
  for(let i = 0; i < cfg.bigEggs; i++){ const p = place(30); if(p) G.eggs.push({ x: p.x, y: p.y, r: 27, big: true, wob: Math.random() * TAU }); }
  for(let i = 0; i < cfg.crates; i++){ const p = place(34); if(p){ const hp = 9 + cfg.d * 0.6; G.crates.push({ x: p.x, y: p.y, r: 30, hp, max: hp, hit: 0 }); } }
  const kinds = ['cake', 'donut', 'crystal', 'cookie'];
  for(let i = 0; i < cfg.treasures; i++){
    const W0 = Math.round(rnd(cfg.trW[0], cfg.trW[1])), r = 26 + W0 * 1.2;
    const p = place(r + 20); if(p) G.treasures.push(newTreasure(p.x, p.y, W0, kinds[i % kinds.length]));
  }
  for(let i = 0; i < cfg.cacti; i++){ const p = place(34); if(p) G.cacti.push({ x: p.x, y: p.y, r: 22 }); }
  for(let i = 0; i < cfg.gobblers; i++){
    // never right next to the fresh mob at the nest
    let p = null;
    for(let k = 0; k < 20 && !p; k++){ const q = place(40); if(q && Math.hypot(q.x - G.nest.x, q.y - G.nest.y) > 650) p = q; }
    if(p) G.gobs.push(newGob(p.x, p.y, cfg.gobHP, false));
  }
  if(cfg.boss){ const p = { x: W / 2, y: 260 }; G.gobs.push(newGob(p.x, p.y, 1600 + cfg.d * 160, true)); }
  // the mob starts at the nest
  const n0 = title ? 46 : 12 + save.up.size * 3;
  G.startMob = n0;
  for(let i = 0; i < n0; i++){ const m = newMochi(G.nest.x + rnd(-60, 60), G.nest.y - 120 + rnd(-40, 40)); G.mob.push(m); }
  G.run.peak = n0;
  G.tx = G.nest.x; G.ty = G.nest.y - 160;
  G.cx = G.tx; G.cy = G.ty;
  G.cam.x = G.cx; G.cam.y = G.cy; G.cam.z = camZoom();
}
function newFruit(x, y, k, val = 1, z = 0){ return { x, y, r: 10, k, val, z, vz: 0, dead: false, bob: Math.random() * TAU }; }
function newTreasure(x, y, W, kind){ return { x, y, r: 26 + W * 1.2, W, kind, carriers: [], moving: false, waitT: 0, dead: false, bob: 0 }; }
function newGob(x, y, hp, boss){ return { x, y, r: boss ? 78 : 30, hp, max: hp, boss, vx: 0, vy: 0, eatCD: 0, chomp: 0, hit: 0, dead: false, wander: Math.random() * TAU, face: 1 }; }

/* ---------------- run control ---------------- */
function startDay(d){
  G.day = d;
  setupWorld(dayCfg(d), false);
  G.state = 'play';
  AU.setStyle('play');
  save.tut = save.tut || 0;
}
function gainCoins(n, x, y){
  if(G.frenzy > 0) n *= 2;
  G.run.coins += n;
}
function stat(k, n){ if(G.state === 'play') save.stats[k] = (save.stats[k] || 0) + n; }
function addMeter(v, raw){ if(G.state !== 'play') return; const k = raw ? 1 : (G.day === 1 ? 0.8 : G.day === 2 ? 0.68 : 0.6) / (1 + (G.day - 1) * 0.04); G.meter = Math.min(G.cfg.goal, G.meter + v * k); }

/* ---------------- events ---------------- */
const EVENTS = {
  rain:      { name: 'CANDY RAIN!',   sub: 'Grab them all!',             col: '#ff7ab8' },
  mochirain: { name: 'MOCHI RAIN!',   sub: 'Run over them to join!',     col: '#ffffff' },
  golden:    { name: 'GOLDEN EGG!',   sub: 'Carry it home to hatch a crowd', col: '#ffd23a' },
  frenzy:    { name: 'SUGAR RUSH!',   sub: 'Super speed · double coins', col: '#ff5ad0' },
  magnet:    { name: 'SWEET MAGNET!', sub: 'All the fruit comes to you', col: '#6fd0ff' },
  melon:     { name: 'WATERMELON!',   sub: 'HOLD to squish-ram it!',     col: '#5fd06a' },
  pinata:    { name: 'PIÑATA!',       sub: 'HOLD and ram it to bust it', col: '#ffb13a' },
  invasion:  { name: 'GOBBLER RAID!', sub: 'Mob them together!',         col: '#b56bff' }
};
function nextEvent(){
  let pool = Object.keys(EVENTS).filter(k => k !== G.lastEv);
  if(G.day === 1) pool = pool.filter(k => !['invasion', 'melon'].includes(k));
  if(G.day === 1 && !G.lastEv) pool = ['rain'];
  const id = pick(pool);
  G.lastEv = id; G.run.events++; stat('events', 1);
  startEvent(id);
  G.nextEv = G.t + rnd(12, 16);
}
function startEvent(id){
  const e = EVENTS[id];
  G.ev = { id, t: 0 };
  UI.banner(e.name, e.sub, e.col);
  AU.event();
  const W = G.cfg.W, H = G.cfg.H, cx = G.cx, cy = G.cy;
  const inW = (x, m = 60) => clamp(x, m, W - m), inH = (y, m = 60) => clamp(y, m, H - m);
  if(id === 'rain'){
    for(let i = 0; i < 70; i++){ const a = Math.random() * TAU, d = 80 + Math.random() * 560; const f = newFruit(inW(cx + Math.cos(a) * d), inH(cy + Math.sin(a) * d), 'candy', 2, 500 + Math.random() * 900); G.fruits.push(f); }
  }else if(id === 'mochirain'){
    const n = 14 + Math.min(20, G.day);
    for(let i = 0; i < n; i++){ const a = Math.random() * TAU, d = 150 + Math.random() * 450; G.wild.push({ x: inW(cx + Math.cos(a) * d), y: inH(cy + Math.sin(a) * d), z: 600 + Math.random() * 800, vz: 0, bob: Math.random() * TAU }); }
  }else if(id === 'golden'){
    let best = null;
    for(let i = 0; i < 20; i++){ const x = rnd(150, W - 150), y = rnd(150, H - 350), d = Math.hypot(x - cx, y - cy); if(d > 300 && d < 800 && (!best || Math.random() < 0.5)) best = { x, y }; }
    if(!best) best = { x: inW(cx + 400), y: inH(cy - 200) };
    const tr = newTreasure(best.x, best.y, 12 + Math.round(G.day * 1.2), 'golden');
    G.treasures.push(tr);
    G.warns.push({ x: tr.x, y: tr.y, t: 0, dur: 6, col: '#ffd23a', icon: '🥚' });
  }else if(id === 'frenzy'){ G.frenzy = 8; AU.fast = true; }
  else if(id === 'magnet'){ G.magnet = 6; }
  else if(id === 'melon'){
    const fromL = cx > W / 2, y = inH(cy, 120);
    G.melon = { x: fromL ? -120 : W + 120, y, vx: fromL ? 300 : -300, r: 72, rot: 0, hp: 1, warn: 1.6, squashT: 0 };
    G.warns.push({ x: fromL ? 80 : W - 80, y, t: 0, dur: 1.8, col: '#5fd06a', icon: '🍉' });
    AU.warn();
  }else if(id === 'pinata'){
    const a = Math.random() * TAU;
    G.pinata = { x: inW(cx + Math.cos(a) * 320, 150), y: inH(cy + Math.sin(a) * 260, 150), r: 46, hp: 18 + G.day * 1.5, max: 18 + G.day * 1.5, hit: 0, sw: 0 };
  }else if(id === 'invasion'){
    const n = 3 + Math.floor(G.day / 3);
    for(let i = 0; i < n; i++){
      const side = i % 4, x = side === 0 ? 60 : side === 1 ? W - 60 : rnd(100, W - 100), y = side === 2 ? 60 : side === 3 ? H - 60 : rnd(100, H - 100);
      const g = newGob(x, y, G.cfg.gobHP * 0.8, false); g.raid = true; G.gobs.push(g);
      G.warns.push({ x, y, t: 0, dur: 2, col: '#b56bff', icon: '😈' });
    }
    AU.warn();
  }
}

/* ---------------- update ---------------- */
function update(dt){
  if(G.state !== 'play' && G.state !== 'title' && G.state !== 'over') return;
  const play = G.state === 'play';
  G.t += dt;
  const W = G.cfg.W, H = G.cfg.H;
  if(play){
    G.left -= dt;
    if(G.t >= G.nextEv) nextEvent();
    if(G.ev){ G.ev.t += dt; if(G.ev.t > 8) G.ev = null; }
    if(G.frenzy > 0){ G.frenzy -= dt; if(G.frenzy <= 0) AU.fast = false; }
    if(G.magnet > 0) G.magnet -= dt;
    if(G.left <= 10 && Math.ceil(G.left) !== Math.ceil(G.left + dt) && G.left > 0) AU.tick();
    tutorialTick();
  }
  if(G.squish) G.squishT += dt;
  G.chainT -= dt; if(G.chainT <= 0) G.chain = 0;
  G.shake = Math.max(0, G.shake - dt * 30);
  G.flash = Math.max(0, G.flash - dt * 2);

  // keyboard steering
  keySteer(dt);
  G.tx = clamp(G.tx, 30, W - 30); G.ty = clamp(G.ty, 30, H - 30);

  buildGrid();
  // centroid of the free mob
  let sx = 0, sy = 0, n = 0, sv = 0;
  for(const m of G.mob) if(m.st === 0 && !m.dead){ sx += m.x; sy += m.y; sv += Math.hypot(m.vx, m.vy); n++; }
  if(n){ G.cx = sx / n; G.cy = sy / n; G.csp = sv / n; }

  // mob movement
  const spdMul = (1 + save.up.speed * 0.06) * (G.frenzy > 0 ? 1.5 : 1) * (G.squish ? 1.3 : 1);
  const maxV = 250 * spdMul;
  const R = MR * Math.sqrt(Math.max(1, n)) * (G.squish ? 0.62 : 1.08) + (G.squish ? 4 : 10);
  const acc = Math.min(1, 7 * dt);
  for(const m of G.mob){
    if(m.dead) continue;
    let gx, gy, mv = maxV;
    if(m.st === 1 && m.tr){
      const tr = m.tr; gx = tr.x + Math.cos(m.slot) * (tr.r + 6); gy = tr.y + Math.sin(m.slot) * (tr.r + 6); mv = 600;
    }else{ gx = G.tx + m.ox * R; gy = G.ty + m.oy * R; }
    const dx = gx - m.x, dy = gy - m.y, d = Math.hypot(dx, dy) || 1;
    const want = Math.min(mv, d * 5);
    m.vx += (dx / d * want - m.vx) * acc; m.vy += (dy / d * want - m.vy) * acc;
  }
  // separation (keeps the blob jiggly instead of stacked)
  const sep = MR * (G.squish ? 1.55 : 1.9);
  for(const m of G.mob){
    if(m.dead || m.st === 1) continue;
    near(m.x, m.y, sep, o => {
      if(o === m || o.st === 1) return;
      const dx = m.x - o.x, dy = m.y - o.y, d = Math.hypot(dx, dy) || 0.01, push = (sep - d) * 0.5;
      m.x += dx / d * push * 0.5; m.y += dy / d * push * 0.5;
    });
  }
  for(const m of G.mob){
    if(m.dead) continue;
    m.x += m.vx * dt; m.y += m.vy * dt;
    if(m.x < 14){ m.x = 14; m.vx = Math.abs(m.vx) * 0.5; } if(m.x > W - 14){ m.x = W - 14; m.vx = -Math.abs(m.vx) * 0.5; }
    if(m.y < 14){ m.y = 14; m.vy = Math.abs(m.vy) * 0.5; } if(m.y > H - 14){ m.y = H - 14; m.vy = -Math.abs(m.vy) * 0.5; }
    const sp = Math.hypot(m.vx, m.vy);
    m.sq = lerp(m.sq, 1 + Math.min(0.16, sp / 1800), Math.min(1, dt * 10));
    m.bob += dt * (6 + sp / 60);
  }

  // cacti
  for(const c of G.cacti) near(c.x, c.y, c.r + MR - 2, m => { if(m.st === 0){ killMochi(m, 'cactus'); floatText('-1', m.x, m.y - 14, '#ff6b6b', 0.7); } });

  // fruit
  const reach = MR + 12 + save.up.magnet * 3.5 + (G.frenzy > 0 ? 12 : 0);
  for(const f of G.fruits){
    if(f.dead) continue;
    if(f.z > 0){ f.vz -= 1600 * dt; f.z = Math.max(0, f.z + f.vz * dt); if(f.z === 0) f.vz = 0; continue; }
    if(G.magnet > 0){
      const dx = G.cx - f.x, dy = G.cy - f.y, d = Math.hypot(dx, dy);
      if(d < 1100 && d > 5){ const v = Math.min(900, 250 + (1100 - d)); f.x += dx / d * v * dt; f.y += dy / d * v * dt; }
    }
    let got = null;
    near(f.x, f.y, reach, m => { got = m; return false; });
    if(got) eatFruit(f, got);
  }
  if(G.fruits.length > 600 || G.t % 2 < dt) G.fruits = G.fruits.filter(f => !f.dead);

  // wild mochi (mochi rain)
  for(const w of G.wild){
    if(w.z > 0){ w.vz -= 1400 * dt; w.z = Math.max(0, w.z + w.vz * dt); if(w.z === 0) burst(w.x, w.y, 5, '#ffffff', 120, 3); continue; }
    w.bob += dt * 3;
    let hit = false;
    near(w.x, w.y, MR * 2.4, () => { hit = true; return false; });
    if(hit){ w.dead = true; if(addMochi(1, w.x, w.y, 80)){ AU.join(); floatText('+1', w.x, w.y - 16, '#ffffff', 0.7); } }
  }
  G.wild = G.wild.filter(w => !w.dead);

  // eggs
  for(const e of G.eggs){
    if(e.dead) continue;
    e.wob += dt * 2;
    let hit = false;
    near(e.x, e.y, e.r + MR, () => { hit = true; return false; });
    if(hit) hatchEgg(e);
  }
  G.eggs = G.eggs.filter(e => !e.dead);

  // crates
  const bite = 0.75 + save.up.bite * 0.14;
  for(const c of G.crates){
    if(c.dead) continue;
    const k = countNear(c.x, c.y, c.r + MR + 4);
    if(k){
      c.hp -= k * dt * bite * (G.squish ? 5 : 0.9);
      c.hit = 0.12;
      if(G.squish && k > 4 && Math.random() < dt * 8){ AU.thud(); G.shake = Math.max(G.shake, 3); }
      if(c.hp <= 0) breakCrate(c);
    }
    c.hit = Math.max(0, c.hit - dt);
  }
  G.crates = G.crates.filter(c => !c.dead);

  // treasures
  const power = 1 + save.up.strength * 0.12;
  for(const tr of G.treasures){
    if(tr.dead) continue;
    tr.bob += dt;
    const need = Math.ceil(tr.W / power);
    if(!G.squish && tr.carriers.length < need + 2){
      near(tr.x, tr.y, tr.r + MR + 10, m => {
        if(m.st !== 0 || tr.carriers.length >= need + 2) return;
        m.st = 1; m.tr = tr; m.slot = Math.random() * TAU; tr.carriers.push(m);
      });
    }
    tr.carriers = tr.carriers.filter(m => !m.dead);
    const lift = tr.carriers.length * power;
    if(lift >= tr.W){
      if(!tr.moving){ tr.moving = true; AU.lift(); floatText('HEAVE HO!', tr.x, tr.y - tr.r - 20, '#ffffff', 0.9); }
      const dx = G.nest.x - tr.x, dy = G.nest.y - tr.y, d = Math.hypot(dx, dy) || 1;
      const v = (60 + 110 * Math.min(1, (lift / tr.W - 1) * 2.5)) * (1 + save.up.speed * 0.04) * (G.frenzy > 0 ? 1.4 : 1);
      tr.x += dx / d * v * dt; tr.y += dy / d * v * dt;
      tr.waitT = 0;
      if(d < G.nest.r) deliver(tr);
    }else{
      tr.moving = false;
      if(tr.carriers.length){ tr.waitT += dt; if(tr.waitT > 5){ for(const m of tr.carriers){ m.st = 0; m.tr = null; } tr.carriers = []; tr.waitT = 0; } }
    }
  }
  G.treasures = G.treasures.filter(t => !t.dead);

  // gobblers
  updateGobs(dt, bite);
  if(G.melon) updateMelon(dt);
  if(G.pinata) updatePinata(dt, bite);

  // effects
  for(let i = G.parts.length - 1; i >= 0; i--){
    const p = G.parts[i]; p.life += dt;
    if(p.life >= p.max){ G.parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92;
    if(p.g){ p.vy += p.g * dt; p.vx /= 0.92; p.vx *= 0.99; p.vy /= 0.92; }
  }
  for(let i = G.texts.length - 1; i >= 0; i--){ const t = G.texts[i]; t.life += dt; t.y -= dt * 38; if(t.life > t.max) G.texts.splice(i, 1); }
  for(let i = G.rings.length - 1; i >= 0; i--){ const r = G.rings[i]; r.life += dt; if(r.life > r.max) G.rings.splice(i, 1); }
  for(let i = G.warns.length - 1; i >= 0; i--){ const w = G.warns[i]; w.t += dt; if(w.t > w.dur) G.warns.splice(i, 1); }
  G.nest.bounce = Math.max(0, G.nest.bounce - dt * 2);
  G.mob = G.mob.filter(m => !m.dead);

  // camera
  const tz = camZoom();
  G.cam.z = lerp(G.cam.z, tz, Math.min(1, dt * 1.5));
  const fx = n ? lerp(G.cx, G.tx, 0.3) : G.tx, fy = n ? lerp(G.cy, G.ty, 0.3) : G.ty;
  G.cam.x = lerp(G.cam.x, fx, Math.min(1, dt * 4)); G.cam.y = lerp(G.cam.y, fy, Math.min(1, dt * 4));

  if(play){
    save.bestMob = Math.max(save.bestMob, G.mob.length);
    if(G.meter >= G.cfg.goal) endDay(true);
    else if(G.left <= 0) endDay(false, 'time');
    else if(!G.mob.length) endDay(false, 'eaten');
  }else if(G.state === 'over'){ G.endT += dt; }
}
function camZoom(){
  const n = Math.max(1, G.mob.length);
  return clamp(1.18 - Math.sqrt(n) * 0.03, 0.5, 1.12);
}

/* ---------------- interactions ---------------- */
function eatFruit(f, m){
  f.dead = true;
  G.chain = G.chainT > 0 ? G.chain + 1 : 0; G.chainT = 0.4;
  AU.nom(G.chain);
  m.sq = 1.28;
  const v = f.val;
  gainCoins(v, f.x, f.y);
  G.run.eat++; stat('eat', 1);
  addMeter(0.13 * v);
  burst(f.x, f.y, 3, FRUIT_COL[f.k] || '#ff5a7a', 90, 3);
  if(Math.random() < 0.15 || v > 2) floatText('+' + (G.frenzy > 0 ? v * 2 : v), f.x, f.y - 10, '#ffe14d', 0.55);
  if(G.chain > 0 && G.chain % 15 === 0){ floatText('YUM x' + G.chain + '!', G.cx, G.cy - 80, '#ff7ab8', 1.1); gainCoins(G.chain / 5 | 0, G.cx, G.cy); }
}
const FRUIT_COL = { berry: '#ff4f7a', cherry: '#e8233c', grape: '#9b5bff', orange: '#ff9a2e', candy: '#ff7ab8', melon: '#ff5a6e' };
function hatchEgg(e){
  e.dead = true;
  const n = e.big ? 10 + save.up.hatch * 2 + Math.floor(G.day / 3) : 3 + Math.floor(save.up.hatch * 0.6) + Math.floor(Math.random() * 3);
  const got = addMochi(n, e.x, e.y, e.big ? 380 : 260);
  G.run.hatch += got; stat('hatch', got);
  AU.hatch(n);
  burst(e.x, e.y, e.big ? 26 : 14, e.big ? '#8fe3ff' : '#fff3c4', e.big ? 380 : 260, 5);
  ring(e.x, e.y, '#ffffff', e.big ? 120 : 70);
  floatText('+' + got, e.x, e.y - 24, '#ffffff', e.big ? 1.5 : 1);
  addMeter(e.big ? 5 : 1.6);
  if(e.big){ G.shake = 6; }
}
function breakCrate(c){
  c.dead = true;
  AU.crate(); G.shake = Math.max(G.shake, 8);
  G.run.crates++; stat('crates', 1);
  const n = 9 + Math.floor(Math.random() * 7);
  for(let i = 0; i < n; i++){ const a = Math.random() * TAU, d = 20 + Math.random() * 70; G.fruits.push(newFruit(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, pick(['berry', 'orange', 'candy']), Math.random() < 0.3 ? 3 : 1, 60 + Math.random() * 120)); }
  if(Math.random() < 0.35) G.eggs.push({ x: c.x, y: c.y, r: 17, big: false, wob: 0 });
  for(let i = 0; i < 12; i++){ const a = Math.random() * TAU, v = 200 + Math.random() * 300; G.parts.push({ x: c.x, y: c.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.6, c: '#c8894f', sz: 7, k: 2, rot: Math.random() * TAU }); }
  gainCoins(5, c.x, c.y); floatText('SMASH! +5', c.x, c.y - 30, '#ffb13a', 1.1);
  addMeter(2.5);
}
function deliver(tr){
  tr.dead = true;
  for(const m of tr.carriers){ m.st = 0; m.tr = null; m.vx = rnd(-200, 200); m.vy = rnd(-300, -100); }
  tr.carriers = [];
  G.nest.bounce = 1;
  G.run.deliver++; stat('deliver', 1);
  AU.deliver(); G.flash = 0.35; G.flashC = '#fff6c8';
  confetti(G.nest.x, G.nest.y - 40, 60);
  if(tr.kind === 'golden'){
    const n = 22 + G.day * 2 + save.up.hatch * 2, got = addMochi(n, G.nest.x, G.nest.y - 60, 420);
    G.run.hatch += got; stat('hatch', got);
    floatText('GOLDEN HATCH! +' + got, G.nest.x, G.nest.y - 140, '#ffd23a', 1.6);
    addMeter(10);
  }else{
    const c = tr.W * 5, bonus = Math.max(2, Math.round(tr.W / 3));
    gainCoins(c, G.nest.x, G.nest.y);
    addMochi(bonus, G.nest.x, G.nest.y - 60, 300);
    floatText('DELIVERED! +' + (G.frenzy > 0 ? c * 2 : c), G.nest.x, G.nest.y - 140, '#ffe14d', 1.5);
    floatText('+' + bonus + ' mochi', G.nest.x, G.nest.y - 100, '#ffffff', 1);
    addMeter(tr.W * 1.9);
  }
  SDK.happytime();
}
function updateGobs(dt, bite){
  for(const g of G.gobs){
    if(g.dead) continue;
    g.eatCD -= dt; g.chomp = Math.max(0, g.chomp - dt * 3); g.hit = Math.max(0, g.hit - dt * 4);
    // chase the nearest mochi it can see
    let tx = null, ty = null, bd = g.boss ? 1e9 : 380 * 380;
    const samples = Math.min(G.mob.length, 24);
    for(let i = 0; i < samples; i++){
      const m = G.mob[(Math.random() * G.mob.length) | 0]; if(!m || m.dead) continue;
      const d = (m.x - g.x) ** 2 + (m.y - g.y) ** 2; if(d < bd){ bd = d; tx = m.x; ty = m.y; }
    }
    const spd = (g.boss ? 62 : 78 + Math.min(40, G.day * 2)) * (g.hit > 0 ? 0.3 : 1);
    if(tx == null){ g.wander += (Math.random() - 0.5) * dt * 3; tx = g.x + Math.cos(g.wander) * 100; ty = g.y + Math.sin(g.wander) * 100; }
    const dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy) || 1;
    g.vx += (dx / d * spd - g.vx) * Math.min(1, dt * 3); g.vy += (dy / d * spd - g.vy) * Math.min(1, dt * 3);
    g.x = clamp(g.x + g.vx * dt, g.r, G.cfg.W - g.r); g.y = clamp(g.y + g.vy * dt, g.r, G.cfg.H - g.r);
    if(Math.abs(g.vx) > 5) g.face = g.vx > 0 ? 1 : -1;
    // eat one mochi at a time
    if(g.eatCD <= 0){
      let victim = null;
      near(g.x, g.y, g.r + MR * 0.6, m => { victim = m; return false; });
      if(victim){ killMochi(victim); AU.gulp(); g.chomp = 1; g.eatCD = g.boss ? 0.32 : 0.75; floatText('-1', victim.x, victim.y - 12, '#ff6b6b', 0.7); }
    }
    // the mob bites back
    const k = countNear(g.x, g.y, g.r + MR + 6);
    if(k){
      const dmg = Math.min(k, g.boss ? 45 : 99) * dt * bite * (G.squish ? (g.boss ? 2 : 3.2) : 1);
      g.hp -= dmg; g.hit = 0.3;
      if(G.squish && k > 5){
        const ax = g.x - G.cx, ay = g.y - G.cy, ad = Math.hypot(ax, ay) || 1, kb = g.boss ? 60 : 260;
        g.vx += ax / ad * kb * dt * 10; g.vy += ay / ad * kb * dt * 10;
        if(Math.random() < dt * 6){ AU.thud(); G.shake = Math.max(G.shake, 4); }
      }
      if(G.cfg.boss && g.boss) addMeter(dmg / g.max * 55, true);
      if(g.hp <= 0) popGob(g);
    }
  }
  G.gobs = G.gobs.filter(g => !g.dead);
}
function popGob(g){
  g.dead = true;
  AU.pop(); G.shake = Math.max(G.shake, g.boss ? 20 : 9);
  G.run.pop++; stat('pop', 1);
  burst(g.x, g.y, g.boss ? 60 : 26, '#b56bff', g.boss ? 600 : 360, 7);
  ring(g.x, g.y, '#ffffff', g.boss ? 260 : 110);
  const nf = g.boss ? 50 : 12;
  for(let i = 0; i < nf; i++){ const a = Math.random() * TAU, d = 20 + Math.random() * (g.boss ? 200 : 70); G.fruits.push(newFruit(g.x + Math.cos(a) * d, g.y + Math.sin(a) * d, pick(['candy', 'grape', 'berry']), 2, 80 + Math.random() * 200)); }
  if(g.boss || Math.random() < 0.6) G.eggs.push({ x: g.x, y: g.y, r: g.boss ? 27 : 17, big: !!g.boss, wob: 0 });
  const c = g.boss ? 150 + G.day * 10 : 15;
  gainCoins(c, g.x, g.y);
  floatText((g.boss ? 'BOSS POPPED! +' : 'POP! +') + c, g.x, g.y - g.r - 20, '#d9b8ff', g.boss ? 1.8 : 1.2);
  if(g.boss){ G.meter = G.cfg.goal; G.flash = 0.6; G.flashC = '#e8d4ff'; confetti(g.x, g.y, 80); }
  else addMeter(6);
  SDK.happytime();
}
function updateMelon(dt){
  const w = G.melon;
  if(w.warn > 0){ w.warn -= dt; return; }
  w.x += w.vx * dt; w.rot += w.vx * dt / w.r;
  const k = countNear(w.x, w.y, w.r + MR);
  if(G.squish && k >= 8){
    // squish-ram: it bursts into fruit
    AU.melon(); G.shake = 16; G.flash = 0.3; G.flashC = '#ffd6de';
    for(let i = 0; i < 45; i++){ const a = Math.random() * TAU, d = 20 + Math.random() * 140; G.fruits.push(newFruit(clamp(w.x + Math.cos(a) * d, 20, G.cfg.W - 20), w.y + Math.sin(a) * d, 'melon', 2, 100 + Math.random() * 300)); }
    for(let i = 0; i < 3; i++) G.eggs.push({ x: w.x + rnd(-60, 60), y: w.y + rnd(-60, 60), r: 17, big: false, wob: 0 });
    burst(w.x, w.y, 40, '#ff5a6e', 500, 7); burst(w.x, w.y, 20, '#5fd06a', 400, 6);
    floatText('MELON SMASH!', w.x, w.y - 90, '#7dff8a', 1.6);
    gainCoins(30, w.x, w.y); addMeter(6);
    G.melon = null; return;
  }
  // otherwise it squashes whoever is in the way
  w.squashT -= dt;
  if(k && w.squashT <= 0){
    let n = 0;
    near(w.x, w.y, w.r + MR - 4, m => { if(m.st === 0 && n < 3){ killMochi(m, 'melon'); n++; } });
    if(n){ w.squashT = 0.25; floatText('SQUASH!', w.x, w.y - w.r - 10, '#ff6b6b', 0.8); }
  }
  if(w.x < -200 || w.x > G.cfg.W + 200) G.melon = null;
}
function updatePinata(dt, bite){
  const p = G.pinata;
  p.sw += dt * 2; p.hit = Math.max(0, p.hit - dt * 4);
  const k = countNear(p.x, p.y, p.r + MR + 6);
  if(k){
    p.hp -= k * dt * bite * (G.squish ? 4 : 0.5); p.hit = 0.3;
    if(G.squish && Math.random() < dt * 6) AU.thud();
    if(p.hp <= 0){
      AU.crate(); AU.pop(); G.shake = 12;
      for(let i = 0; i < 40; i++){ const a = Math.random() * TAU, d = 20 + Math.random() * 160; G.fruits.push(newFruit(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 'candy', 3, 150 + Math.random() * 300)); }
      for(let i = 0; i < 4; i++) G.eggs.push({ x: p.x + rnd(-70, 70), y: p.y + rnd(-70, 70), r: 17, big: i === 0, wob: 0 });
      confetti(p.x, p.y, 70);
      gainCoins(50, p.x, p.y); floatText('PIÑATA! +50', p.x, p.y - 70, '#ffb13a', 1.6);
      addMeter(6);
      G.pinata = null;
    }
  }
}

/* ---------------- squish / burst ---------------- */
function squishOn(){
  if(G.squish || (G.state !== 'play' && G.state !== 'title')) return;
  G.squish = true; G.squishT = 0; AU.squish();
}
function squishOff(){
  if(!G.squish) return;
  G.squish = false;
  if(G.squishT > 0.3){
    // BURST: the mob splashes outward
    for(const m of G.mob){ if(m.st !== 0) continue; const dx = m.x - G.cx, dy = m.y - G.cy, d = Math.hypot(dx, dy) || 1; m.vx += dx / d * 480; m.vy += dy / d * 480; }
    AU.burst(); ring(G.cx, G.cy, '#ffffff', 160 + Math.sqrt(G.mob.length) * 12);
    for(const g of G.gobs){ const dx = g.x - G.cx, dy = g.y - G.cy, d = Math.hypot(dx, dy); if(d < 260 && !g.boss){ g.vx += dx / d * 500; g.vy += dy / d * 500; g.hit = 0.5; } }
  }
  G.squishT = 0;
}

/* ---------------- end of day ---------------- */
function endDay(win, why){
  if(G.state !== 'play') return;
  G.state = 'over'; G.endT = 0;
  G.squish = false; AU.fast = false;
  const r = G.run;
  const mobEnd = G.mob.length;
  const stars = win ? 1 + (G.left >= 25 ? 1 : 0) + (mobEnd >= G.startMob * 3 ? 1 : 0) : 0;
  const bonus = win ? 40 + G.day * 12 : 0;
  r.coins += bonus;
  save.coins += r.coins;
  save.stats.days++;
  if(win){
    const prev = save.stars[G.day] || 0;
    save.stars[G.day] = Math.max(prev, stars);
    if(stars === 3) save.stats.stars++;
    if(G.day >= save.day) save.day = G.day + 1;
    save.best = Math.max(save.best, G.day);
  }
  missionTick(r.peak);
  persist();
  G.result = { win, why, stars, bonus, mobEnd };
  if(win){ AU.win(); confetti(G.cx, G.cy, 90); } else AU.lose();
  setTimeout(() => UI.showResults(), win ? 1300 : 900);
}

/* ---------------- tutorial (day 1) ---------------- */
function tutorialTick(){
  if(G.day !== 1 || save.tut >= 1) return;
  const T = G.tips, t = G.t;
  const tip = (k, txt, when) => { if(!T[k] && when){ T[k] = t; UI.tip(txt); } };
  tip('move', UI.touch ? 'Drag to lead your mochi mob!' : 'Move the mouse to lead your mochi mob!', t > 0.5);
  tip('egg', 'Walk into eggs 🥚 to hatch more mochi!', t > 6);
  tip('crate', UI.touch ? 'HOLD the SQUISH button to smash crates!' : 'HOLD the mouse (or Space) to squish and smash crates!', t > 16);
  tip('carry', 'Bring enough mochi to lift a treasure: they carry it home!', t > 28);
  tip('meter', 'Fill the NEST meter before time runs out!', t > 42);
  if(t > 50){ save.tut = 1; persist(); }
}

/* ---------------- effects ---------------- */
function burst(x, y, n, col, sp, sz){
  if(save.opt.fx === 'low') n = Math.ceil(n / 2);
  for(let i = 0; i < n; i++){ const a = Math.random() * TAU, v = sp * (0.3 + Math.random() * 0.7); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.35 + Math.random() * 0.35, c: col, sz: sz * (0.6 + Math.random() * 0.8), k: 0 }); }
}
function ring(x, y, col, r){ G.rings.push({ x, y, col, r, life: 0, max: 0.45 }); }
function confetti(x, y, n){
  const cols = ['#ff4f8b', '#ffd24a', '#4dffb0', '#5a8cff', '#ff8a3a', '#b98cff'];
  for(let i = 0; i < n; i++){ const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 300 + Math.random() * 600; G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 1.4 + Math.random(), c: cols[i % cols.length], sz: 7, k: 2, rot: Math.random() * TAU, g: 700 }); }
}
function floatText(txt, x, y, col, size){ if(G.texts.length > 40) G.texts.shift(); G.texts.push({ txt, x, y, col, size: size || 1, life: 0, max: 1 }); }
function flavorCol(m){ const f = FLAVORS.find(f => f.id === save.flavor) || FLAVORS[0]; return f.c === 'rainbow' ? `hsl(${m.hue},90%,78%)` : f.c; }
