'use strict';
/* =====================================================================
   WITCHLIGHT: simulation. Move the witch, spells cast themselves.
   Every banished shadow leaves a glowing flower: the dark world blooms.
   ===================================================================== */
const G = {
  state: 'title', t: 0, rt: 0, ts: 1, slowT: 0, demo: false,
  P: null, spells: {}, fus: {}, pas: {}, cd: {},
  foes: [], shots: [], ebul: [], motes: [], drops: [], flowers: [], pools: [], plants: [], geysers: [], meteors: [],
  parts: [], texts: [], rings: [], bolts: [],
  spawnAcc: 0, nextElite: 45, nextSwarm: 60, bossIdx: 0, boss: null, pendingLv: 0, choices: [],
  beamA: 0, beamT: 0, prismT: 0, blizT: 0, run: null, shake: 0, flash: 0, flashC: '#fff', moteN: 0, rerolls: 0, revived: false,
  inX: 0, inY: 0, dawnT: 0
};
const grid = { cell: 64, map: new Map() };
function gk(x, y){ return ((x / 64) | 0) * 1000 + ((y / 64) | 0); }
function buildGrid(){
  for(const a of grid.map.values()) a.length = 0;
  for(const f of G.foes){ if(f.dead) continue; const k = gk(f.x, f.y); let a = grid.map.get(k); if(!a){ a = []; grid.map.set(k, a); } a.push(f); }
}
function foesNear(x, y, r, fn){
  const x0 = ((x - r) / 64) | 0, x1 = ((x + r) / 64) | 0, y0 = ((y - r) / 64) | 0, y1 = ((y + r) / 64) | 0;
  for(let gx = x0; gx <= x1; gx++) for(let gy = y0; gy <= y1; gy++){
    const a = grid.map.get(gx * 1000 + gy); if(!a) continue;
    for(const f of a){ if(f.dead) continue; const dx = f.x - x, dy = f.y - y, rr = r + f.r; if(dx * dx + dy * dy < rr * rr && fn(f) === false) return; }
  }
}
function nearestFoes(x, y, n, maxD){
  const out = [];
  for(const f of G.foes){ if(f.dead) continue; const d = (f.x - x) ** 2 + (f.y - y) ** 2; if(d > maxD * maxD) continue; out.push([d, f]); }
  out.sort((a, b) => a[0] - b[0]);
  return out.slice(0, n).map(a => a[1]);
}

/* ---------------- run ---------------- */
function newRun(demo){
  G.demo = !!demo;
  const maxHp = 120 + (demo ? 0 : save.perk.hp * 15);
  G.P = { x: AW / 2, y: AH / 2, vx: 0, vy: 0, r: 15, hp: maxHp, max: maxHp, inv: 0, face: 1, lvl: 1, xp: 0, need: xpNeed(1), walk: 0 };
  Object.assign(G, { t: 0, ts: 1, slowT: 0, spells: {}, fus: {}, pas: {}, cd: {}, foes: [], shots: [], ebul: [], motes: [], drops: [], flowers: [], pools: [], plants: [], geysers: [], meteors: [],
    parts: [], texts: [], rings: [], bolts: [], spawnAcc: 0, nextElite: 45, nextSwarm: 60, bossIdx: 0, boss: null, pendingLv: 0, beamA: 0, beamT: 0, prismT: 0, blizT: 0, moteN: 0, revived: false, dawnT: 0 });
  G.rerolls = demo ? 0 : save.perk.reroll;
  G.run = { kills: 0, fusions: 0, bosses: 0, flowers: 0, level: 1, time: 0, stones: 0 };
  if(demo){ G.spells = { fire: 3, frost: 2, storm: 2 }; G.state = 'title'; }
  else{ G.state = 'level'; G.choices = startChoices(); }
}
function xpNeed(l){ return Math.round(2 + l * 2.5 + Math.pow(l, 1.5)); }
function dmgMul(){ return (1 + (G.pas.power || 0) * 0.12) * (1 + (G.demo ? 0 : save.perk.dmg) * 0.06); }
function cdMul(){ return 1 - (G.pas.focus || 0) * 0.08; }
function spdMul(){ return (1 + (G.pas.boots || 0) * 0.1) * (1 + (G.demo ? 0 : save.perk.spd) * 0.04); }
function pickR(){ return 115 * (1 + (G.pas.lantern || 0) * 0.25) * (1 + (G.demo ? 0 : save.perk.magnet) * 0.15); }
function lightR(){ return 230 + (G.pas.lantern || 0) * 40; }

/* ---------------- level-up choices ---------------- */
function startChoices(){
  return Object.keys(ELEMENTS).sort(() => Math.random() - 0.5).slice(0, 3).map(id => ({ kind: 'el', id }));
}
function rollChoices(){
  const opts = [], fusOk = [];
  for(const id in FUSIONS){ const f = FUSIONS[id]; if(!G.fus[id] && (G.spells[f.a] || 0) >= 3 && (G.spells[f.b] || 0) >= 3) fusOk.push({ kind: 'fus', id }); }
  const nSpells = Object.keys(G.spells).length;
  for(const id in ELEMENTS){ const l = G.spells[id] || 0; if(l ? l < MAX_SPELL : nSpells < 4) opts.push({ kind: 'el', id }); }
  for(const id in PASSIVES){ if((G.pas[id] || 0) < PASSIVES[id].max) opts.push({ kind: 'pas', id }); }
  const out = [];
  if(fusOk.length) out.push(pick(fusOk));
  // upgrades of spells you already own come up more often
  const w = opts.map(o => o.kind === 'el' && G.spells[o.id] ? 3 : o.kind === 'el' ? 1.6 : 1);
  while(out.length < 3 && opts.length){
    let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0;
    while(r > w[i]){ r -= w[i]; i++; }
    out.push(opts[i]); opts.splice(i, 1); w.splice(i, 1);
  }
  if(!out.length) out.push({ kind: 'heal' });
  return out;
}
function choose(c){
  if(c.kind === 'el'){ G.spells[c.id] = (G.spells[c.id] || 0) + 1; }
  else if(c.kind === 'pas'){ G.pas[c.id] = (G.pas[c.id] || 0) + 1; if(c.id === 'heart'){ G.P.max += 25; G.P.hp = Math.min(G.P.max, G.P.hp + 25); } }
  else if(c.kind === 'fus'){
    G.fus[c.id] = true; G.run.fusions++; if(!G.demo){ save.stats.fusions++; save.seen[c.id] = 1; }
    G.slowT = 1.2; G.flash = 0.8; G.flashC = FUSIONS[c.id].col;
    if(!G.demo){ AU.fusion(); UI.banner('✨ FUSION! ' + FUSIONS[c.id].icon + ' ' + FUSIONS[c.id].name.toUpperCase(), FUSIONS[c.id].desc, FUSIONS[c.id].col); SDK.happytime(); }
    ring(G.P.x, G.P.y, FUSIONS[c.id].col, 400); burst(G.P.x, G.P.y, 60, FUSIONS[c.id].col, 600, 6);
  }else if(c.kind === 'heal'){ G.P.hp = G.P.max; }
  if(!G.demo) AU.pickCard();
  G.pendingLv = Math.max(0, G.pendingLv - 1);
  if(G.pendingLv > 0){ G.choices = rollChoices(); if(!G.demo) UI.showLevel(); }
  else{ G.state = G.demo ? 'title' : 'play'; if(!G.demo) UI.hideLevel(); }
}
function gainXp(v){
  const P = G.P;
  P.xp += v;
  while(P.xp >= P.need){
    P.xp -= P.need; P.lvl++; P.need = xpNeed(P.lvl); G.run.level = P.lvl;
    G.pendingLv++;
    if(!G.demo){ AU.level(); }
    ring(P.x, P.y, '#ffe9a8', 160);
  }
  if(G.pendingLv > 0 && G.state === 'play'){ G.state = 'level'; G.choices = rollChoices(); UI.showLevel(); }
  if(G.pendingLv > 0 && G.state === 'title'){ while(G.pendingLv > 0) choose(autoChoice(rollChoices())); }
}
function autoChoice(cs){ return cs.find(c => c.kind === 'fus') || (Object.keys(G.spells).length < 3 && cs.find(c => c.kind === 'el' && !G.spells[c.id])) || cs.find(c => c.kind === 'el' && G.spells[c.id]) || cs.find(c => c.kind === 'el') || cs[0]; }

/* ---------------- spawning ---------------- */
function spawnFoe(kind, x, y, hpMul){
  const d = FOES[kind], k = (1 + G.t / 100 + Math.pow(G.t / 240, 2)) * (hpMul || 1);
  const f = { kind, x, y, r: d.r, hp: d.hp * k, max: d.hp * k, spd: d.spd * rnd(0.9, 1.1), dmg: d.dmg * (1 + G.t / 420), xp: d.xp, col: d.col, slow: 0, frostT: 0, beamT: 0, hit: 0, ph: Math.random() * TAU, shootT: rnd(1, 3), elite: d.elite, ranged: d.ranged, zig: d.zig };
  G.foes.push(f);
  return f;
}
function edgeSpawn(){
  const vw = R.W / R.s / 2 + 60, vh = R.H / R.s / 2 + 60, a = Math.random() * TAU;
  const d = Math.hypot(vw, vh) * rnd(0.85, 1);
  return { x: G.P.x + Math.cos(a) * d, y: G.P.y + Math.sin(a) * d };
}
function spawning(dt){
  if(G.foes.length > 360) return;
  const t = G.t, boss = G.boss && !G.boss.dead;
  const rate = Math.min(11, 1.1 + t / 42) * (boss ? 0.5 : 1);
  G.spawnAcc += rate * dt;
  const pool = ['wisp', 'blob', 'wisp'];
  if(t > 40) pool.push('bat', 'bat'); if(t > 110) pool.push('brute'); if(t > 150) pool.push('caster'); if(t > 200) pool.push('blob', 'brute');
  while(G.spawnAcc >= 1){ G.spawnAcc--; const p = edgeSpawn(); spawnFoe(pick(pool), p.x, p.y); }
  if(t >= G.nextElite){ G.nextElite += 45; const p = edgeSpawn(); spawnFoe('elite', p.x, p.y); if(!G.demo) UI.toast('⭐ A glowing elite appeared!'); }
  if(t >= G.nextSwarm){
    G.nextSwarm += 60;
    const n = 18 + Math.floor(t / 20);
    for(let i = 0; i < n; i++){ const a = i / n * TAU, d = 520; spawnFoe('wisp', G.P.x + Math.cos(a) * d, G.P.y + Math.sin(a) * d); }
    if(!G.demo) UI.banner('🌑 SHADOW SWARM!', 'They surround you!', '#b98cff');
  }
  if(G.bossIdx < BOSSES.length && t >= BOSSES[G.bossIdx].at){
    const B = BOSSES[G.bossIdx++], p = edgeSpawn();
    const f = spawnFoe('blob', p.x, p.y, 1);
    Object.assign(f, { kind: 'boss', bk: B.kind, name: B.name, r: B.r, hp: B.hp, max: B.hp, spd: B.spd, dmg: { wolf: 16, moth: 20, hydra: 24, king: 28 }[B.kind], xp: 60, col: B.col, boss: true, final: !!B.final, atkT: 3 });
    G.boss = f;
    if(!G.demo){ AU.bossIn(); UI.banner('👑 ' + B.name, B.final ? 'Defeat him to bring the dawn!' : 'A boss rises from the dark!', '#ff9ef0'); }
    G.shake = 12;
  }
}

/* ---------------- update ---------------- */
function update(rdt){
  G.rt += rdt;
  if(G.state === 'dawn'){ G.dawnT += rdt; G.shake = Math.max(0, G.shake - rdt * 30); G.flash = Math.max(0, G.flash - rdt * 1.6); updateFx(rdt); return; }
  if(G.state !== 'play' && G.state !== 'title') return;
  if(G.slowT > 0){ G.slowT -= rdt; G.ts = lerp(G.ts, 0.25, Math.min(1, rdt * 12)); } else G.ts = lerp(G.ts, 1, Math.min(1, rdt * 5));
  const dt = rdt * G.ts;
  G.t += dt; G.run.time = G.t;
  G.shake = Math.max(0, G.shake - rdt * 30); G.flash = Math.max(0, G.flash - rdt * 1.6);
  if(G.demo) autopilot(dt);
  movePlayer(dt);
  spawning(dt);
  buildGrid();
  castSpells(dt);
  updateShots(dt);
  updateFoes(dt);
  updatePickups(dt);
  updateFx(dt);
  const P = G.P;
  if((G.pas.regen || 0) > 0) P.hp = Math.min(P.max, P.hp + G.pas.regen * dt);
  if(P.hp <= 0 && G.state === 'play') playerDown();
}
function movePlayer(dt){
  const P = G.P;
  let ix = G.inX, iy = G.inY; const l = Math.hypot(ix, iy); if(l > 1){ ix /= l; iy /= l; }
  const sp = 210 * spdMul();
  P.vx = lerp(P.vx, ix * sp, Math.min(1, dt * 12)); P.vy = lerp(P.vy, iy * sp, Math.min(1, dt * 12));
  P.x += P.vx * dt; P.y += P.vy * dt;
  if(Math.abs(P.vx) > 10) P.face = P.vx > 0 ? 1 : -1;
  P.walk += Math.hypot(P.vx, P.vy) * dt * 0.05;
  if(P.inv > 0) P.inv -= dt;
}

/* ---------------- spells ---------------- */
function cool(id, base, dt){ G.cd[id] = (G.cd[id] || 0) - dt; if(G.cd[id] > 0) return false; G.cd[id] = base * cdMul(); return true; }
function castSpells(dt){
  const P = G.P, dm = dmgMul(), S = G.spells;
  if(S.fire){ const L = S.fire; if(cool('fire', Math.max(0.4, 1.05 - 0.08 * L), dt)){
    const ts = nearestFoes(P.x, P.y, 1 + Math.floor((L - 1) / 3), 560);
    for(const f of ts){ const a = Math.atan2(f.y - P.y, f.x - P.x); G.shots.push({ k: 'fire', x: P.x, y: P.y - 10, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, life: 1.4, dmg: (16 + 7 * L) * dm, rad: 55 + 8 * L, r: 9 }); }
    if(ts.length && !G.demo) AU.cast('fire');
  } }
  if(S.frost){ const L = S.frost, n = Math.min(7, 3 + Math.floor(L / 2)), rad = 95 + 5 * L, t = G.t * 2.6;
    for(let i = 0; i < n; i++){ const a = t + i / n * TAU, x = P.x + Math.cos(a) * rad, y = P.y + Math.sin(a) * rad;
      foesNear(x, y, 14, f => { if(f.frostT > 0) return; f.frostT = 0.35; f.slow = 1.2; damage(f, (10 + 4 * L) * dm, 'frost'); }); }
  }
  if(S.storm){ const L = S.storm; if(cool('storm', Math.max(0.6, 1.7 - 0.1 * L), dt)){
    const first = nearestFoes(P.x, P.y, 1, 440)[0];
    if(first){ const pts = [{ x: P.x, y: P.y - 20 }], hit = new Set(); let cur = first;
      for(let j = 0; j < 2 + L && cur; j++){ hit.add(cur); pts.push({ x: cur.x, y: cur.y }); damage(cur, (13 + 6 * L) * dm, 'storm');
        let nx = null, bd = 175 * 175; for(const f of G.foes){ if(f.dead || hit.has(f)) continue; const d = (f.x - cur.x) ** 2 + (f.y - cur.y) ** 2; if(d < bd){ bd = d; nx = f; } } cur = nx; }
      G.bolts.push({ pts, life: 0, max: 0.25, col: '#fff36b' }); if(!G.demo) AU.cast('storm'); }
  } }
  if(S.nature){ const L = S.nature; if(cool('nature', Math.max(0.8, 1.8 - 0.1 * L), dt)){
    const R0 = 130 + 16 * L; ring(P.x, P.y, '#7dff8a', R0);
    foesNear(P.x, P.y, R0, f => { damage(f, (13 + 5 * L) * dm, 'nature'); const a = Math.atan2(f.y - P.y, f.x - P.x); f.kx = Math.cos(a) * 260; f.ky = Math.sin(a) * 260; });
    if(!G.demo) AU.cast('nature');
  } }
  if(S.arcane){ const L = S.arcane; if(cool('arcane', Math.max(0.35, 1.0 - 0.07 * L), dt)){
    const ts = nearestFoes(P.x, P.y, 6, 600); const n = 1 + Math.floor(L / 2);
    for(let i = 0; i < n && ts.length; i++){ const f = ts[i % ts.length], a = rnd(0, TAU); G.shots.push({ k: 'arc', x: P.x, y: P.y - 10, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: 3, dmg: (9 + 4 * L) * dm, tgt: f, r: 7 }); }
    if(ts.length && !G.demo) AU.cast('arcane');
  } }
  if(S.light){ const L = S.light; G.beamA += dt * 1.8; G.beamT -= dt;
    if(G.beamT <= 0){ G.beamT = 0.18; beamHit(G.beamA, 210 + 22 * L, (5 + 3 * L) * dm, 'light'); } }
  // fusions
  const F = G.fus;
  if(F.plasma && cool('plasma', 2.4, dt)){
    const vis = G.foes.filter(f => !f.dead && Math.abs(f.x - P.x) < 600 && Math.abs(f.y - P.y) < 420);
    for(let i = 0; i < 5 && vis.length; i++){ const f = vis.splice(Math.floor(Math.random() * vis.length), 1)[0];
      G.bolts.push({ pts: [{ x: f.x + rnd(-30, 30), y: f.y - 500 }, { x: f.x + rnd(-20, 20), y: f.y - 250 }, { x: f.x, y: f.y }], life: 0, max: 0.35, col: '#ff9ef0', w: 7 });
      damage(f, 90 * dm, 'plasma'); G.pools.push({ x: f.x, y: f.y, r: 60, life: 2.5, t: 0, col: '#ff6a3a' }); }
    if(!G.demo) AU.cast('plasma'); G.shake = Math.max(G.shake, 5);
  }
  if(F.steam && cool('steam', 1.8, dt)){
    const ts = nearestFoes(P.x, P.y, 12, 520).sort(() => Math.random() - 0.5).slice(0, 4);
    for(const f of ts) G.geysers.push({ x: f.x, y: f.y, t: 0 });
  }
  if(F.blizzard){ G.blizT -= dt; if(G.blizT <= 0){ G.blizT = 0.3; foesNear(P.x, P.y, 175, f => { damage(f, 12 * dm, 'blizzard', true); f.slow = 0.6; }); }
    for(let i = 0; i < 2; i++){ const a = Math.random() * TAU, d = Math.random() * 175; G.parts.push({ x: P.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d, vx: 160, vy: 60, life: 0, max: 0.6, c: '#ffffff', sz: 2.5 }); } }
  if(F.meteor && cool('meteor', 2.8, dt)){
    let best = null, bn = 0;
    for(let i = 0; i < 14; i++){ const f = G.foes[Math.floor(Math.random() * G.foes.length)]; if(!f || f.dead || Math.abs(f.x - P.x) > 650 || Math.abs(f.y - P.y) > 450) continue; let n = 0; foesNear(f.x, f.y, 120, () => { n++; }); if(n > bn){ bn = n; best = f; } }
    if(best) G.meteors.push({ x: best.x, y: best.y, t: 0 });
  }
  if(F.prism){ G.prismT -= dt; if(G.prismT <= 0){ G.prismT = 0.2; for(let i = 0; i < 6; i++) beamHit(-G.beamA * 1.3 + i / 6 * TAU, 270, 9 * dm, 'prism'); } if(!S.light) G.beamA += dt * 1.8; }
  if(F.sunflower && cool('sunflower', 3.5, dt)){
    G.plants.push({ x: P.x + rnd(-50, 50), y: P.y + rnd(-50, 50), life: 14, t: 0, shootT: 0 });
    if(G.plants.length > 5) G.plants.shift();
  }
}
function beamHit(a, len, dmg, el){
  const P = G.P, ux = Math.cos(a), uy = Math.sin(a);
  foesNear(P.x + ux * len / 2, P.y + uy * len / 2, len / 2 + 20, f => {
    const dx = f.x - P.x, dy = f.y - P.y, along = dx * ux + dy * uy, perp = Math.abs(dx * -uy + dy * ux);
    if(along > 0 && along < len && perp < 22 + f.r) damage(f, dmg, el, true);
  });
}
function updateShots(dt){
  const dm = dmgMul();
  for(const s of G.shots){
    s.life -= dt;
    if(s.k === 'arc'){
      if(!s.tgt || s.tgt.dead){ s.tgt = nearestFoes(s.x, s.y, 1, 500)[0]; }
      if(s.tgt){ const want = Math.atan2(s.tgt.y - s.y, s.tgt.x - s.x), cur = Math.atan2(s.vy, s.vx); let d = want - cur; while(d > Math.PI) d -= TAU; while(d < -Math.PI) d += TAU; const na = cur + clamp(d, -7 * dt, 7 * dt), sp = Math.min(560, Math.hypot(s.vx, s.vy) + 600 * dt); s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp; }
    }
    if(s.k === 'seed' || s.k === 'fire' || s.k === 'arc'){ s.x += s.vx * dt; s.y += s.vy * dt; }
    let hitF = null; foesNear(s.x, s.y, s.r, f => { hitF = f; return false; });
    if(hitF || s.life <= 0){
      s.dead = true;
      if(s.k === 'fire'){ ring(s.x, s.y, '#ff7a2e', s.rad); burst(s.x, s.y, 10, '#ffb13a', 220, 4); foesNear(s.x, s.y, s.rad, f => damage(f, s.dmg, 'fire', true)); if(hitF) damage(hitF, s.dmg * 0.5, 'fire'); }
      else if(hitF) damage(hitF, s.dmg, s.k === 'seed' ? 'sunflower' : 'arcane');
    }
    if(s.k === 'arc' && Math.random() < 0.5) G.parts.push({ x: s.x, y: s.y, vx: 0, vy: 0, life: 0, max: 0.3, c: '#c58bff', sz: 3 });
  }
  G.shots = G.shots.filter(s => !s.dead);
  // fusion effects with lifetimes
  for(const p of G.pools){ p.life -= dt; p.t -= dt; if(p.t <= 0){ p.t = 0.3; foesNear(p.x, p.y, p.r, f => damage(f, 10 * dm, 'plasma', true)); } }
  G.pools = G.pools.filter(p => p.life > 0);
  for(const g of G.geysers){ g.t += dt; if(g.t >= 0.4 && !g.done){ g.done = true; ring(g.x, g.y, '#e8f6ff', 80); burst(g.x, g.y, 18, '#ffffff', 300, 5); foesNear(g.x, g.y, 70, f => { damage(f, 70 * dm, 'steam'); f.kx = rnd(-200, 200); f.ky = rnd(-200, 200); }); if(!G.demo) AU.cast('steam'); } }
  G.geysers = G.geysers.filter(g => g.t < 0.9);
  for(const m of G.meteors){ m.t += dt; if(m.t >= 0.6 && !m.done){ m.done = true; ring(m.x, m.y, '#ffb13a', 140); burst(m.x, m.y, 40, '#ff7a2e', 500, 7); G.shake = Math.max(G.shake, 10); foesNear(m.x, m.y, 130, f => damage(f, 150 * dm, 'meteor')); if(!G.demo) AU.cast('meteor'); G.pools.push({ x: m.x, y: m.y, r: 70, life: 1.5, t: 0, col: '#ff8a3a' }); } }
  G.meteors = G.meteors.filter(m => m.t < 1.1);
  for(const pl of G.plants){ pl.life -= dt; pl.t += dt; pl.shootT -= dt; if(pl.shootT <= 0){ const f = nearestFoes(pl.x, pl.y, 1, 400)[0]; if(f){ pl.shootT = 0.5; const a = Math.atan2(f.y - pl.y, f.x - pl.x); G.shots.push({ k: 'seed', x: pl.x, y: pl.y - 30, vx: Math.cos(a) * 480, vy: Math.sin(a) * 480, life: 1.2, dmg: 18 * dm, r: 6 }); } } }
  G.plants = G.plants.filter(p => p.life > 0);
}

/* ---------------- foes ---------------- */
function updateFoes(dt){
  const P = G.P;
  for(const f of G.foes){
    if(f.dead) continue;
    f.ph += dt; f.hit = Math.max(0, f.hit - dt * 5); if(f.frostT > 0) f.frostT -= dt; if(f.slow > 0) f.slow -= dt;
    const dx = P.x - f.x, dy = P.y - f.y, d = Math.hypot(dx, dy) || 1;
    let sp = f.spd * (f.slow > 0 ? 0.5 : 1);
    let mx = dx / d, my = dy / d;
    if(f.zig){ const s = Math.sin(f.ph * 6) * 0.7; const tx = -my, ty = mx; mx += tx * s; my += ty * s; }
    if(f.ranged && d < 280){ mx = -mx * 0.4; my = -my * 0.4; }
    if(f.boss) bossAI(f, dt, d);
    if(f.wind > 0){ f.wind -= dt; sp = 0; if(f.wind <= 0){ f.dash = 0.55; if(!G.demo) AU.bossIn(); } }
    if(f.dash > 0){ f.dash -= dt; sp = 560; mx = f.dx; my = f.dy; }
    f.x += (mx * sp + (f.kx || 0)) * dt; f.y += (my * sp + (f.ky || 0)) * dt;
    if(f.kx){ f.kx *= 0.88; f.ky *= 0.88; if(Math.abs(f.kx) < 5) f.kx = f.ky = 0; }
    if(f.ranged){ f.shootT -= dt; if(f.shootT <= 0 && d < 520){ f.shootT = 2.6; G.ebul.push({ x: f.x, y: f.y, vx: dx / d * 200, vy: dy / d * 200, life: 4, r: 8, dmg: 8 }); } }
    // contact damage
    if(d < f.r + P.r && P.inv <= 0 && !G.demo){ hurtPlayer(f.dmg); const a = Math.atan2(-dy, -dx); f.kx = Math.cos(a) * 200; f.ky = Math.sin(a) * 200; }
    else if(G.demo && d < f.r + P.r) P.hp = Math.min(P.max, P.hp);
  }
  // light separation so crowds read as crowds, not one blob
  for(const f of G.foes){
    if(f.dead || f.boss) continue;
    foesNear(f.x, f.y, f.r * 0.8, o => { if(o === f || o.boss) return; const dx = f.x - o.x, dy = f.y - o.y, d = Math.hypot(dx, dy) || 1, ov = (f.r + o.r) * 0.8 - d; if(ov > 0){ f.x += dx / d * ov * 0.25; f.y += dy / d * ov * 0.25; } });
  }
  for(const b of G.ebul){
    b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if(Math.hypot(b.x - P.x, b.y - P.y) < b.r + P.r - 3 && P.inv <= 0 && !G.demo){ hurtPlayer(b.dmg); b.life = 0; }
  }
  G.ebul = G.ebul.filter(b => b.life > 0);
  if(Math.floor(G.t * 2) !== Math.floor((G.t - dt) * 2)){
    G.foes = G.foes.filter(f => !f.dead);
    // shadows left far behind slip through the dark and re-emerge ahead of you
    for(const f of G.foes){ if(Math.abs(f.x - P.x) > 1300 || Math.abs(f.y - P.y) > 1100){ const q = edgeSpawn(); f.x = q.x; f.y = q.y; if(f.boss && !G.demo) floatText('👑', f.x, f.y, '#ff9ef0', 1.5); } }
  }
}
function bossAI(f, dt, d){
  const P = G.P;
  f.atkT -= dt;
  if(f.atkT > 0) return;
  if(f.bk === 'wolf'){ f.atkT = 3.8; f.wind = 0.8; const a = Math.atan2(P.y - f.y, P.x - f.x); f.dx = Math.cos(a); f.dy = Math.sin(a); }
  else if(f.bk === 'moth'){ f.atkT = 3; for(let i = 0; i < 12; i++){ const a = i / 12 * TAU + f.ph; G.ebul.push({ x: f.x, y: f.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, life: 5, r: 9, dmg: 10 }); } if(Math.random() < 0.5) for(let i = 0; i < 4; i++) spawnFoe('bat', f.x + rnd(-60, 60), f.y + rnd(-60, 60)); }
  else if(f.bk === 'hydra'){ f.atkT = 2.2; const a0 = Math.atan2(P.y - f.y, P.x - f.x); for(let i = -2; i <= 2; i++){ const a = a0 + i * 0.22; G.ebul.push({ x: f.x, y: f.y, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, life: 4, r: 9, dmg: 12 }); } }
  else if(f.bk === 'king'){ f.atkT = 2.6; f.spin = (f.spin || 0) + 0.4; for(let i = 0; i < 18; i++){ const a = i / 18 * TAU + f.spin; G.ebul.push({ x: f.x, y: f.y, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, life: 5, r: 9, dmg: 12 }); } if(Math.random() < 0.4){ for(let i = 0; i < 10; i++){ const a = i / 10 * TAU; spawnFoe('wisp', f.x + Math.cos(a) * 120, f.y + Math.sin(a) * 120); } } }
}
function damage(f, dmg, el, quiet){
  if(f.dead) return;
  f.hp -= dmg; if(f.hit < 0.3) f.hit = 1;
  if(!G.demo && (!quiet || dmg > 30) && Math.random() < (f.boss ? 0.5 : 0.35)) floatText(Math.round(dmg), f.x + rnd(-10, 10), f.y - f.r - 6, el === 'fire' || el === 'meteor' ? '#ffb13a' : '#ffffff', dmg > 60 ? 1.2 : 0.75);
  if(f.hp <= 0) kill(f, el);
}
const EL_COL = { fire: '#ff7a2e', frost: '#7fe3ff', storm: '#fff36b', nature: '#7dff8a', arcane: '#c58bff', light: '#ffe9a8', plasma: '#ff9ef0', steam: '#e8f6ff', blizzard: '#bfefff', meteor: '#ffb13a', prism: '#ffffff', sunflower: '#ffd23a' };
function kill(f, el){
  f.dead = true;
  G.run.kills++; if(!G.demo) save.stats.kills++;
  const col = EL_COL[el] || '#ffffff';
  burst(f.x, f.y, f.boss ? 60 : f.elite ? 24 : 7, col, f.boss ? 500 : 200, f.boss ? 6 : 3.5);
  if(!G.demo) AU.pop();
  // the dark world blooms where shadows fall
  {
    const n = f.boss ? 40 : f.elite ? 8 : 1;
    for(let i = 0; i < n; i++){ const a = Math.random() * TAU, d = f.boss ? Math.random() * 140 : f.elite ? Math.random() * 50 : 0; G.flowers.push({ x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d, c: f.boss ? pick(Object.values(EL_COL)) : col, s: rnd(0.7, 1.3), ph: Math.random() * TAU, born: G.rt, k: Math.floor(Math.random() * 3) }); }
    G.run.flowers += n; if(!G.demo) save.stats.flowers += n;
    if(G.flowers.length > 2200) G.flowers.splice(0, G.flowers.length - 2200);
  }
  const v = f.xp;
  G.motes.push({ x: f.x, y: f.y, v, big: v >= 6, vx: 0, vy: 0 });
  if(Math.random() < 0.012 && !f.boss) G.drops.push({ x: f.x, y: f.y, k: pick(['heal', 'heal', 'magnet', 'moon']) });
  if(f.elite){ G.drops.push({ x: f.x, y: f.y, k: 'chest' }); }
  if(f.boss){
    G.run.bosses++; if(!G.demo){ save.stats.bosses++; AU.bossDie(); SDK.happytime(); }
    G.shake = 24; G.flash = 0.8; G.flashC = '#ffffff'; G.slowT = 1;
    G.drops.push({ x: f.x, y: f.y, k: 'chest' });
    if(G.boss === f) G.boss = null;
    if(f.final && !G.demo) dawn();
    else if(!G.demo) UI.banner('👑 ' + f.name + ' BANISHED!', 'The garden grows brighter...', '#ffe9a8');
  }
}
function hurtPlayer(d){
  const P = G.P;
  P.hp -= d; P.inv = 0.5;
  G.shake = Math.max(G.shake, 6); G.flash = 0.25; G.flashC = '#ff2a4a';
  AU.hurt();
}
function playerDown(){
  if(!G.revived && save.perk.revive > 0){
    G.revived = true; G.P.hp = G.P.max; G.P.inv = 2;
    moonBurst(); UI.banner('🪽 PHOENIX FEATHER!', 'Back from the shadows!', '#ffb13a');
    return;
  }
  G.state = 'over';
  setTimeout(() => UI.gameOver(false), 900);
}
function dawn(){
  G.state = 'dawn'; G.dawnT = 0; G.pools = []; G.geysers = []; G.meteors = []; G.ebul = [];
  save.stats.dawns++;
  AU.dawn();
  for(const f of G.foes) if(!f.dead){ f.dead = true; burst(f.x, f.y, 6, '#ffe9a8', 200, 4); }
  setTimeout(() => UI.gameOver(true), 4200);
}
function moonBurst(){
  const P = G.P;
  ring(P.x, P.y, '#ffffff', 900); G.flash = 0.7; G.flashC = '#e8f0ff'; G.shake = 18;
  if(!G.demo) AU.bomb();
  for(const f of G.foes){ if(f.dead) continue; if(Math.abs(f.x - P.x) < 700 && Math.abs(f.y - P.y) < 480) damage(f, f.boss ? 300 : 9999, 'light', true); }
  G.ebul = [];
}

/* ---------------- pickups ---------------- */
function updatePickups(dt){
  const P = G.P, pr = pickR();
  for(const m of G.motes){
    const dx = P.x - m.x, dy = P.y - m.y, d = Math.hypot(dx, dy) || 1;
    if(d < pr || m.pull){ const sp = Math.min(900, 300 + (m.pull ? 600 : 0) + (pr - d) * 4); m.x += dx / d * sp * dt; m.y += dy / d * sp * dt; }
    if(d < P.r + 10){ m.dead = true; G.moteN++; gainXp(m.v); if(!G.demo) AU.mote(G.moteN % 12); }
  }
  G.motes = G.motes.filter(m => !m.dead);
  if(G.motes.length > 600){ const extra = G.motes.splice(0, G.motes.length - 600); let v = 0; for(const m of extra) v += m.v; G.motes.push({ x: extra[0].x, y: extra[0].y, v, big: true }); }
  for(const it of G.drops){
    if(Math.hypot(P.x - it.x, P.y - it.y) > P.r + 24) continue;
    it.dead = true;
    if(it.k === 'heal'){ P.hp = Math.min(P.max, P.hp + 30); if(!G.demo){ AU.heal(); floatText('+30 ❤', P.x, P.y - 40, '#ff7ab8', 1); } }
    else if(it.k === 'magnet'){ for(const m of G.motes) m.pull = true; if(!G.demo){ AU.heal(); UI.banner('🧲 STAR MAGNET!', 'Every mote flies to you', '#7df0ff'); } }
    else if(it.k === 'moon'){ moonBurst(); if(!G.demo) UI.banner('🌕 MOONBURST!', '', '#e8f0ff'); }
    else if(it.k === 'chest'){ if(!G.demo){ AU.chest(); UI.banner('🎁 TREASURE!', 'Free power-up', '#ffd23a'); } G.pendingLv++; if(G.state === 'play'){ G.state = 'level'; G.choices = rollChoices(); if(!G.demo) UI.showLevel(); } }
  }
  G.drops = G.drops.filter(d => !d.dead);
}

/* ---------------- autopilot (title demo + tests + trailer) ---------------- */
function autopilot(){
  const P = G.P;
  let ax = 0, ay = 0;
  for(const f of G.foes){ if(f.dead) continue; const dx = P.x - f.x, dy = P.y - f.y, d2 = dx * dx + dy * dy; if(d2 < 260 * 260){ const w = (f.boss ? 4 : 1) / Math.max(400, d2); ax += dx * w; ay += dy * w; } }
  for(const b of G.ebul){ const dx = P.x - b.x, dy = P.y - b.y, d2 = dx * dx + dy * dy; if(d2 < 160 * 160){ const w = 2 / Math.max(300, d2); ax += dx * w; ay += dy * w; } }
  const goal = G.drops[0] || G.motes.reduce((b, m) => { const d = (m.x - P.x) ** 2 + (m.y - P.y) ** 2; return !b || d < b.d ? { m, d } : b; }, null);
  const g = goal && (goal.m || goal);
  if(g){ const dx = g.x - P.x, dy = g.y - P.y, d = Math.hypot(dx, dy) || 1; ax += dx / d * 0.004; ay += dy / d * 0.004; }
  const l = Math.hypot(ax, ay);
  G.inX = l > 1e-6 ? ax / l : 0; G.inY = l > 1e-6 ? ay / l : 0;
}

/* ---------------- effects ---------------- */
function updateFx(dt){
  for(let i = G.parts.length - 1; i >= 0; i--){ const p = G.parts[i]; p.life += dt; if(p.life >= p.max){ G.parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; }
  for(let i = G.texts.length - 1; i >= 0; i--){ const t = G.texts[i]; t.life += dt; t.y -= dt * 40; if(t.life > t.max) G.texts.splice(i, 1); }
  for(let i = G.rings.length - 1; i >= 0; i--){ const r = G.rings[i]; r.life += dt; if(r.life > r.max) G.rings.splice(i, 1); }
  for(let i = G.bolts.length - 1; i >= 0; i--){ const b = G.bolts[i]; b.life += dt; if(b.life > b.max) G.bolts.splice(i, 1); }
  if(G.parts.length > 900) G.parts.splice(0, G.parts.length - 900);
}
function burst(x, y, n, col, sp, sz){ for(let i = 0; i < n; i++){ const a = Math.random() * TAU, v = sp * (0.3 + Math.random() * 0.7); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.3 + Math.random() * 0.4, c: col, sz: sz * (0.6 + Math.random() * 0.8) }); } }
function ring(x, y, col, r){ G.rings.push({ x, y, col, r, life: 0, max: 0.45 }); }
function floatText(txt, x, y, col, size){ if(G.demo) return; if(G.texts.length > 40) G.texts.shift(); G.texts.push({ txt: String(txt), x, y, col, size: size || 1, life: 0, max: 0.7 }); }
