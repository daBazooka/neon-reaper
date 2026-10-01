'use strict';
/* =====================================================================
   BLASTBACK: simulation. Every shot kicks you the opposite way; land on
   a platform (or stomp an enemy) to reload. Don't touch the lava.
   ===================================================================== */
const G = {
  mode: 'demo', state: 'title', t: 0, rt: 0, ts: 1, slowT: 0, hitStop: 0,
  W: 1080, H: 660, arena: ARENAS[0], arenaIdx: -1, plats: [], portals: [], lavaY: 640,
  players: [], foes: [], bullets: [], coins: [], parts: [], texts: [], rings: [], booms: [],
  wave: 0, queue: [], spawnT: 0, clearT: 0, cards: {}, cardList: [], rerolls: 0, combo: 0, comboT: 0,
  run: null, boss: null, shake: 0, flash: 0, flashC: '#fff', vs: null, inputs: [{}, {}], overT: 0, portrait: false
};
const GRAV = 950, PR = 16;

/* ---------------- arena ---------------- */
const LAYOUTS = {
  land: [
    [[0.38, 0.70, 0.24], [0.08, 0.47, 0.2], [0.72, 0.47, 0.2], [0.40, 0.27, 0.2]],
    [[0.16, 0.66, 0.18], [0.66, 0.66, 0.18], [0.41, 0.48, 0.18], [0.10, 0.29, 0.16], [0.74, 0.29, 0.16]],
    [[0.30, 0.62, 0.40], [0.06, 0.40, 0.18], [0.76, 0.40, 0.18], [0.36, 0.22, 0.28]]
  ],
  port: [
    [[0.30, 0.74, 0.40], [0.00, 0.56, 0.34], [0.66, 0.56, 0.34], [0.30, 0.38, 0.40], [0.04, 0.20, 0.30], [0.66, 0.20, 0.30]],
    [[0.10, 0.72, 0.32], [0.58, 0.64, 0.32], [0.20, 0.47, 0.32], [0.62, 0.32, 0.32], [0.08, 0.20, 0.30]]
  ]
};
function setArena(i){
  G.arenaIdx = i; G.arena = ARENAS[i % ARENAS.length];
  G.portrait = typeof R !== 'undefined' && R.H > R.W * 1.1;
  G.W = G.portrait ? 520 : 880; G.H = G.portrait ? Math.round(clamp(520 * R.H / R.W * 0.97, 760, 1060)) : 540;
  const W = G.W, H = G.H, Ls = LAYOUTS[G.portrait ? 'port' : 'land'], L = Ls[i % Ls.length];
  G.lavaY = H - 22;
  G.plats = [{ x: 0, y: H - 70, w: W * 0.26, h: 48, ground: true }, { x: W * 0.74, y: H - 70, w: W * 0.26, h: 48, ground: true }, { x: W * 0.4, y: H - 58, w: W * 0.2, h: 36, ground: true }];
  for(const [fx, fy, fw] of L) G.plats.push({ x: fx * W, y: fy * H, w: fw * W, h: 22 });
  G.portals = [{ x: W * 0.14, y: H * 0.1 }, { x: W * 0.86, y: H * 0.1 }, { x: W * 0.5, y: H * 0.07 }].map(p => ({ ...p, flash: 0 }));
  if(typeof R !== 'undefined') R.buildBg();
}

/* ---------------- entities ---------------- */
function gunDef(id){ return GUNS.find(g => g.id === id) || GUNS[0]; }
function makePlayer(pl, x, y, gunId, col){
  const cup = G.mode === 'cup', g = gunDef(gunId);
  const max = 100 + (cup ? save.perk.hp * 12 : 0);
  return { pl, x, y, vx: 0, vy: 0, r: PR, aim: pl === 1 ? Math.PI * 1.25 : -Math.PI / 4, ammo: 0, cd: 0, hp: max, max, inv: 1, ground: false, groundT: 0, col, gun: g, dead: false, respawn: 0, squash: 0, flash: 0, face: 1, ai: { t: 0 } };
}
function magSize(p){ return p.gun.mag + (G.mode === 'cup' ? save.perk.mag + (G.cards.mag || 0) * 2 : 0); }
function spawnFoe(kind, x, y){
  const d = FOES[kind], k = 1 + 0.12 * Math.max(0, G.wave - 1);
  const f = { kind, def: d, x, y, vx: 0, vy: 0, r: d.r, hp: d.hp * k, max: d.hp * k, dmg: d.dmg * (1 + G.wave * 0.025), spd: d.spd * (1 + Math.min(0.4, G.wave * 0.02)), dir: Math.random() < 0.5 ? -1 : 1, t: Math.random() * 3, cd: rnd(1.5, 3), ground: false, flash: 0, dead: false, ph: Math.random() * TAU };
  G.foes.push(f);
  return f;
}
function spawnBoss(B, loop, x, y){
  const k = 1 + loop * 0.8 + G.wave * 0.02;
  const f = { kind: 'boss', bk: B.kind, def: B, name: B.name, x, y, vx: 0, vy: 0, r: B.r, hp: B.hp * k, max: B.hp * k, dmg: 20, spd: 70, dir: 1, t: 0, cd: 2.5, ground: false, flash: 0, dead: false, boss: true, ph: 0, hops: 0 };
  G.foes.push(f); G.boss = f;
  return f;
}

/* ---------------- runs ---------------- */
function resetWorld(){
  Object.assign(G, { t: 0, ts: 1, slowT: 0, hitStop: 0, foes: [], bullets: [], coins: [], parts: [], texts: [], rings: [], booms: [], queue: [], spawnT: 0, clearT: 0, combo: 0, comboT: 0, boss: null, shake: 0, flash: 0, overT: 0 });
}
function islandSpot(side){ const p = G.plats[side]; return { x: p.x + p.w / 2, y: p.y - PR - 2 }; }
function startDemo(){
  G.mode = 'demo'; G.state = 'title'; G.cards = {}; G.wave = 3;
  resetWorld(); setArena(0);
  const s = islandSpot(0), p = makePlayer(0, s.x, s.y, save.gun, (SKINS.find(k => k.id === save.skin) || SKINS[0]).c);
  p.hp = p.max = 1e9; G.players = [p];
}
function startCup(){
  G.mode = 'cup'; G.cards = {}; G.cardList = []; G.wave = 0; G.rerolls = save.perk.reroll;
  G.run = { kills: 0, coins: 0, bosses: 0, stomps: 0, maxCombo: 0, shots: 0 };
  resetWorld(); setArena(0);
  const c = G.plats[2], p = makePlayer(0, c.x + c.w / 2, c.y - PR - 2, save.gun, (SKINS.find(k => k.id === save.skin) || SKINS[0]).c);
  p.ammo = magSize(p); G.players = [p];
  G.freeCards = save.perk.start;
  nextWave();
}
function startVs(){
  G.mode = 'vs'; G.cards = {}; G.wave = 0;
  G.vs = { score: [0, 0], to: 5, winner: -1, shown: false };
  resetWorld(); setArena(Math.floor(Math.random() * ARENAS.length));
  const a = islandSpot(0), b = islandSpot(1);
  G.players = [makePlayer(0, a.x, a.y, 'blaster', '#ff5a5a'), makePlayer(1, b.x, b.y, 'blaster', '#3fa9ff')];
  for(const p of G.players) p.ammo = magSize(p);
  G.state = 'play';
}
function wavePlan(n){
  const q = [];
  if(n % 5 === 0){
    q.push({ boss: BOSSES[(n / 5 - 1) % BOSSES.length], loop: Math.floor((n / 5 - 1) / BOSSES.length) });
    for(let i = 0; i < 2 + n / 5; i++) q.push(pick(['slime', 'bat']));
    return q;
  }
  const pool = ['slime', 'slime'];
  if(n >= 2) pool.push('bat'); if(n >= 3) pool.push('hopper'); if(n >= 4) pool.push('turret');
  if(n >= 6) pool.push('bomber'); if(n >= 7) pool.push('shield'); if(n >= 8) pool.push('brute', 'turret');
  const cnt = 4 + Math.floor(n * 1.5);
  for(let i = 0; i < cnt; i++) q.push(i < 2 && n === 1 ? 'slime' : pick(pool));
  return q;
}
function nextWave(){
  G.wave++;
  const ai = Math.floor((G.wave - 1) / 5) % ARENAS.length;
  if(ai !== G.arenaIdx){
    setArena(ai);
    const p = G.players[0], c = G.plats[2];
    Object.assign(p, { x: c.x + c.w / 2, y: c.y - PR - 2, vx: 0, vy: 0, inv: 1 });
    if(G.wave > 1 && typeof UI !== 'undefined') UI.banner(G.arena.name, 'New arena!', '#ffffff');
  }
  G.queue = wavePlan(G.wave); G.spawnT = 0.8; G.state = 'play'; G.coins = [];
  const p = G.players[0]; p.ammo = magSize(p);
  if(typeof UI !== 'undefined'){
    const boss = G.wave % 5 === 0;
    UI.banner(boss ? '👑 BOSS WAVE' : 'WAVE ' + G.wave, boss ? G.queue[0].boss.name + ' is coming!' : 'Clear the arena!', boss ? '#ff5aa0' : '#ffd23a');
    if(boss) AU.horn();
  }
}
function maxAlive(){ return Math.min(9, 2 + Math.floor(G.wave / 2)); }
function spawning(dt){
  for(const p of G.portals) p.flash = Math.max(0, p.flash - dt * 1.5);
  if(G.mode === 'demo'){
    if(G.foes.length < 4){ G.spawnT -= dt; if(G.spawnT <= 0){ G.spawnT = 1.2; const pt = pick(G.portals); pt.flash = 1; spawnFoe(pick(['slime', 'bat', 'hopper', 'slime']), pt.x, pt.y); } }
    return;
  }
  if(G.mode !== 'cup' || !G.queue.length || G.state !== 'play') return;
  G.spawnT -= dt;
  if(G.spawnT > 0 || G.foes.filter(f => !f.dead).length >= maxAlive()) return;
  G.spawnT = rnd(0.6, 1.2);
  const it = G.queue.shift(), p = G.players[0];
  const pts = G.portals.slice().sort((a, b) => Math.hypot(b.x - p.x, b.y - p.y) - Math.hypot(a.x - p.x, a.y - p.y));
  const pt = pts[Math.floor(Math.random() * 2)];
  pt.flash = 1; ring(pt.x, pt.y, '#ffffff', 50);
  if(it.boss){ spawnBoss(it.boss, it.loop, G.W / 2, G.H * 0.15); G.spawnT = 3; G.shake = 12; }
  else spawnFoe(it, pt.x + rnd(-20, 20), pt.y);
}

/* ---------------- update ---------------- */
function update(rdt){
  G.rt += rdt;
  if(G.hitStop > 0){ G.hitStop -= rdt; return; }
  const live = G.state === 'play' || G.state === 'title' || G.state === 'clear' || G.state === 'dead' || G.state === 'vsend';
  if(!live){ updateFx(rdt); return; }
  if(G.slowT > 0){ G.slowT -= rdt; G.ts = lerp(G.ts, 0.3, Math.min(1, rdt * 12)); } else G.ts = lerp(G.ts, 1, Math.min(1, rdt * 6));
  const dt = rdt * G.ts;
  G.t += dt;
  G.shake = Math.max(0, G.shake - rdt * 40); G.flash = Math.max(0, G.flash - rdt * 2);
  if(G.comboT > 0){ G.comboT -= dt; if(G.comboT <= 0) G.combo = 0; }
  const N = 2, sdt = dt / N;
  for(let s = 0; s < N; s++){
    for(const p of G.players) if(!p.dead) stepPlayer(p, sdt, s === 0);
    for(const f of G.foes) if(!f.dead) stepFoe(f, sdt);
    stepBullets(sdt);
    contacts();
  }
  spawning(dt);
  updateCoins(dt);
  updateFx(dt);
  G.foes = G.foes.filter(f => !f.dead);
  if(G.mode === 'cup') cupFlow(dt);
  if(G.mode === 'vs') vsFlow(dt);
}
function cupFlow(dt){
  const p = G.players[0];
  if(G.state === 'play'){
    if(p.dead){ G.state = 'dead'; G.overT = 0; G.slowT = 1.4; }
    else if(!G.queue.length && !G.foes.length){
      G.state = 'clear'; G.clearT = 0; G.slowT = 0.7;
      G.bullets = G.bullets.filter(b => !b.foe);
      p.hp = Math.min(p.max, p.hp + 15);
      if(typeof UI !== 'undefined'){ UI.banner(G.wave % 5 === 0 ? '👑 BOSS DEFEATED!' : 'WAVE CLEAR!', '+15 HP', '#7dffb0'); AU.clear(); }
    }
  } else if(G.state === 'clear'){
    G.clearT += dt;
    if(G.clearT > 1.5 && !G.coins.length){ G.state = 'pick'; if(typeof UI !== 'undefined') UI.showPick(); }
  } else if(G.state === 'dead'){
    G.overT += dt;
    if(G.overT > 1.3){ G.state = 'over'; if(typeof UI !== 'undefined') UI.gameOver(); }
  }
}
function vsFlow(dt){
  const V = G.vs;
  if(G.state === 'vsend'){ G.overT += dt; if(G.overT > 1.5 && !V.shown){ V.shown = true; if(typeof UI !== 'undefined') UI.vsOver(); } return; }
  for(const p of G.players){
    if(!p.dead) continue;
    p.respawn -= dt;
    if(p.respawn <= 0){ const s = islandSpot(p.pl); Object.assign(p, { dead: false, x: s.x, y: s.y, vx: 0, vy: 0, hp: p.max, inv: 2, ammo: magSize(p) }); ring(p.x, p.y, p.col, 60); }
  }
}

/* ---------------- player ---------------- */
function stepPlayer(p, dt, first){
  const I = G.mode === 'demo' || p.bot ? autopilot(p, dt) : (G.inputs[p.pl] || {});
  if(I.aim !== undefined) p.aim = I.aim;
  else if(I.rot) p.aim += I.rot * 3.4 * dt;
  if(first){ if(p.cd > 0) p.cd -= dt * 2; if(p.inv > 0) p.inv -= dt * 2; if(p.flash > 0) p.flash -= dt * 10; }
  if(I.fire && p.cd <= 0 && p.ammo > 0 && G.state !== 'clear') shoot(p);
  p.vy += GRAV * dt;
  p.vx *= 1 - 0.35 * dt;
  if(p.ground){ p.vx *= 1 - 9 * dt; }
  p.x += p.vx * dt; p.y += p.vy * dt;
  const wasGround = p.ground; p.ground = false;
  solidCollide(p, 0.15);
  if(p.ground){
    p.groundT += dt;
    if(!wasGround){ p.squash = 1; if(typeof AU !== 'undefined' && p.vyLand > 300) AU.land(); }
    if(p.ammo < magSize(p)){ p.ammo = magSize(p); if(typeof AU !== 'undefined' && G.mode !== 'demo') AU.reload(); }
  } else {
    p.groundT = 0;
    // slow trickle reload in the air so you are never helpless
    p.air = (p.air || 0) + dt;
    if(p.air > 1.1 && p.ammo < magSize(p)){ p.air = 0; p.ammo++; }
  }
  if(p.ground) p.air = 0;
  p.squash = Math.max(0, p.squash - dt * 5);
  if(p.y + p.r > G.lavaY){
    p.y = G.lavaY - p.r; p.vy = -1000; p.ammo = magSize(p);
    burst(p.x, G.lavaY, 18, G.arena.lava, 300, 5);
    if(typeof AU !== 'undefined') AU.splash();
    if(p.inv <= 0) hurtPlayer(p, G.mode === 'vs' ? 15 : 10 + Math.min(10, G.wave * 0.5), null);
  }
  p.face = Math.cos(p.aim) >= 0 ? 1 : -1;
}
function solidCollide(o, bounce){
  const r = o.r;
  if(o.x < r){ o.x = r; o.vx = Math.abs(o.vx) * 0.5; } else if(o.x > G.W - r){ o.x = G.W - r; o.vx = -Math.abs(o.vx) * 0.5; }
  if(o.y < r){ o.y = r; o.vy = Math.abs(o.vy) * 0.4; }
  for(const pl of G.plats){
    const cx = clamp(o.x, pl.x, pl.x + pl.w), cy = clamp(o.y, pl.y, pl.y + pl.h);
    const dx = o.x - cx, dy = o.y - cy, d2 = dx * dx + dy * dy;
    if(d2 >= r * r) continue;
    let nx, ny, d = Math.sqrt(d2);
    if(d < 1e-4){ nx = 0; ny = -1; d = 0; } else { nx = dx / d; ny = dy / d; }
    const ov = r - d; o.x += nx * ov; o.y += ny * ov;
    const vn = o.vx * nx + o.vy * ny;
    if(vn < 0){ o.vyLand = o.vy; o.vx -= nx * vn * (1 + bounce); o.vy -= ny * vn * (1 + bounce); }
    if(ny < -0.6){ o.ground = true; if(o.vy > 0) o.vy = 0; }
  }
}
function shoot(p){
  const g = p.gun, k = G.cards, cup = G.mode === 'cup';
  const n = g.pellets + (cup ? (k.spread || 0) * 2 : 0);
  const dmg = g.dmg * (cup ? (1 + (k.dmg || 0) * 0.25) * (1 + save.perk.dmg * 0.08) : 1);
  const spread = g.spread + (n > 1 ? 0.12 * (n - 1) / 2 : 0);
  for(let i = 0; i < n; i++){
    const a = p.aim + (n > 1 ? (i / (n - 1) - 0.5) * spread * 2 : 0) + rnd(-g.spread, g.spread) * 0.5;
    const mx = p.x + Math.cos(p.aim) * 26, my = p.y + Math.sin(p.aim) * 26;
    G.bullets.push({ x: mx, y: my, vx: Math.cos(a) * g.spd, vy: Math.sin(a) * g.spd, r: g.boom ? 7 : 5, dmg, owner: p, life: 1.4, bounce: (g.bounce || 0) + (cup ? k.bounce || 0 : 0), pierce: g.pierce || (cup && k.pierce), boom: g.boom || (cup && k.boom ? 45 + 15 * k.boom : 0), hit: new Set(), col: g.col, trail: [] });
  }
  // recoil: kill the velocity that fights the kick, then kick
  const ux = -Math.cos(p.aim), uy = -Math.sin(p.aim), kick = g.kick * (cup ? 1 + (k.kick || 0) * 0.2 : 1);
  const along = p.vx * ux + p.vy * uy;
  if(along < 0){ p.vx -= ux * along; p.vy -= uy * along; }
  p.vx += ux * kick; p.vy += uy * kick;
  const sp = Math.hypot(p.vx, p.vy); if(sp > 1050){ p.vx *= 1050 / sp; p.vy *= 1050 / sp; }
  p.ammo--; p.cd = g.rate / (cup ? 1 + (k.rate || 0) * 0.2 : 1); p.flash = 1;
  if(p.ground){ p.ground = false; p.y -= 2; }
  if(G.run && G.mode === 'cup') G.run.shots++;
  G.shake = Math.max(G.shake, 2 + g.kick / 250);
  const mx = p.x + Math.cos(p.aim) * 28, my = p.y + Math.sin(p.aim) * 28;
  burst(mx, my, 5, '#fff3c4', 160, 3, true);
  G.parts.push({ x: p.x, y: p.y, vx: -Math.sin(p.aim) * 120 * p.face + rnd(-30, 30), vy: -180, life: 0, max: 0.6, c: '#ffcf33', sz: 3, shell: true, g: 900 });
  for(let i = 0; i < 3; i++) G.parts.push({ x: p.x - Math.cos(p.aim) * 12, y: p.y - Math.sin(p.aim) * 12, vx: ux * 120 + rnd(-30, 30), vy: uy * 120 + rnd(-30, 30), life: 0, max: 0.45, c: 'rgba(255,255,255,0.8)', sz: rnd(5, 8), smoke: true });
  if(typeof AU !== 'undefined' && G.mode !== 'demo') AU.shot(g.id);
}
function hurtPlayer(p, dmg, src){
  if(p.dead || G.mode === 'demo') return;
  p.hp -= dmg; p.inv = 0.8; p.flash = 1;
  floatText('-' + Math.round(dmg), p.x, p.y - 30, '#ff5a6a', 0.9);
  if(G.mode === 'cup'){ G.flash = Math.max(G.flash, 0.25); G.flashC = '#ff2a4a'; }
  G.shake = Math.max(G.shake, 8);
  if(typeof AU !== 'undefined') AU.ouch();
  if(p.hp <= 0) killPlayer(p, src);
}
function killPlayer(p, src){
  p.dead = true;
  explodeFx(p.x, p.y, 1, p.col);
  if(G.mode === 'vs'){
    const o = G.players[1 - p.pl]; G.vs.score[o.pl]++; p.respawn = 1.6; G.slowT = 0.5;
    if(typeof UI !== 'undefined') UI.vsKO(o.pl);
    if(G.vs.score[o.pl] >= G.vs.to){ G.vs.winner = o.pl; G.state = 'vsend'; G.overT = 0; G.slowT = 2; }
  }
}

/* ---------------- enemies ---------------- */
function nearestPlayer(f){ let b = null, bd = 1e18; for(const p of G.players){ if(p.dead) continue; const d = (p.x - f.x) ** 2 + (p.y - f.y) ** 2; if(d < bd){ bd = d; b = p; } } return b; }
function groundAhead(f, dir){
  const x = f.x + dir * (f.r + 4), y = f.y + f.r + 6;
  return G.plats.some(p => x > p.x && x < p.x + p.w && y > p.y - 2 && y < p.y + p.h + 4);
}
function stepFoe(f, dt){
  const d = f.def, T = nearestPlayer(f);
  f.t += dt; f.ph += dt; if(f.flash > 0) f.flash -= dt * 8;
  if(d.fly){
    let tx = T ? T.x : G.W / 2, ty = T ? T.y : G.H / 3;
    if(d.shoot && T){ const a = Math.atan2(f.y - T.y, f.x - T.x) + 0.4 * Math.sin(f.t * 0.7); tx = T.x + Math.cos(a) * 230; ty = T.y + Math.sin(a) * 200 - 60; }
    if(f.kind === 'bat') ty += Math.sin(f.t * 5) * 50;
    if(f.boss && f.bk === 'bat'){ if(f.cd < 0.6){ tx = T ? T.x : tx; ty = T ? T.y : ty; } else { tx = G.W / 2 + Math.cos(f.t * 0.8) * G.W * 0.35; ty = G.H * 0.25 + Math.sin(f.t * 1.6) * 60; } }
    if(f.boss && f.bk === 'bot'){ tx = G.W / 2 + Math.cos(f.t * 0.5) * G.W * 0.3; ty = G.H * 0.22; }
    const dx = tx - f.x, dy = ty - f.y, dd = Math.hypot(dx, dy) || 1, sp = (f.boss ? (f.bk === 'bat' && f.cd < 0.6 ? 420 : 160) : f.spd);
    f.vx = lerp(f.vx, dx / dd * sp, Math.min(1, dt * 2.5)); f.vy = lerp(f.vy, dy / dd * sp, Math.min(1, dt * 2.5));
    f.x += f.vx * dt; f.y += f.vy * dt;
    f.x = clamp(f.x, f.r, G.W - f.r); f.y = clamp(f.y, f.r, G.lavaY - f.r - 10);
  } else {
    f.vy += GRAV * dt;
    if(f.ground){
      if(!groundAhead(f, f.dir) && Math.random() < 0.97) f.dir = -f.dir;
      f.vx = lerp(f.vx, f.dir * f.spd, Math.min(1, dt * 6));
      if(!d.hop && !f.boss && T && f.t > f.cd && Math.abs(T.x - f.x) < 260){ f.t = 0; f.cd = rnd(1.8, 3.2); f.vy = -460; f.vx = Math.sign(T.x - f.x) * 160; f.dir = Math.sign(f.vx) || 1; }
      if((d.hop || f.boss && f.bk === 'king') && f.t > f.cd && T){
        f.t = 0; f.cd = f.boss ? 2.4 : rnd(1.6, 2.8);
        f.vy = f.boss ? -820 : -620; f.vx = clamp((T.x - f.x) * 1.2, -260, 260); f.dir = Math.sign(f.vx) || 1;
      }
    }
    f.x += f.vx * dt; f.y += f.vy * dt;
    const was = f.ground; f.ground = false;
    solidCollide(f, 0);
    if(f.x <= f.r + 1 || f.x >= G.W - f.r - 1) f.dir = -f.dir;
    if(f.ground && !was && f.boss){ landSlam(f); }
    if(f.y + f.r > G.lavaY){ if(f.boss){ f.y = G.lavaY - f.r; f.vy = -900; } else { burst(f.x, G.lavaY, 12, G.arena.lava, 260, 4); killFoe(f, null, true); return; } }
  }
  // attacks
  if(T && (d.shoot || f.boss)){
    f.cd -= dt;
    if(f.cd <= 0){
      if(f.boss) bossAttack(f, T);
      else { f.cd = rnd(2.2, 3); const a = Math.atan2(T.y - f.y, T.x - f.x); foeShot(f.x, f.y, a, 240); }
    }
  }
}
function foeShot(x, y, a, sp, grav){ G.bullets.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 7, dmg: 10, foe: true, life: 4, grav: grav || 0, hit: new Set(), col: '#ff3d8a', trail: [] }); if(typeof AU !== 'undefined') AU.pew(); }
function bossAttack(f, T){
  if(f.bk === 'bot'){ f.cd = 2.6; const n = 10; for(let i = 0; i < n; i++) foeShot(f.x, f.y, i / n * TAU + f.t, 210); }
  else if(f.bk === 'bat'){ f.cd = 3.2; if(G.foes.length < 8) for(let i = 0; i < 2; i++) spawnFoe('bat', f.x + rnd(-30, 30), f.y); }
  else if(f.bk === 'golem'){ f.cd = 2.3; for(let i = -1; i <= 1; i++){ const a = Math.atan2(T.y - f.y, T.x - f.x) - 0.5 + i * 0.25; foeShot(f.x, f.y - f.r, a, 420, 600); } }
  else if(f.bk === 'king'){ f.cd = 99; }
}
function landSlam(f){
  ring(f.x, f.y + f.r, '#ffffff', 140); G.shake = Math.max(G.shake, 12);
  if(typeof AU !== 'undefined') AU.boom(0.8);
  for(const p of G.players){ if(p.dead) continue; const d = Math.hypot(p.x - f.x, p.y - f.y); if(d < 150 && p.ground && p.inv <= 0) hurtPlayer(p, 14, f); }
  f.hops = (f.hops || 0) + 1;
  if(f.bk === 'king' && f.hops % 2 === 0 && G.foes.length < 8) for(let i = 0; i < 2; i++){ const s = spawnFoe('slime', f.x + (i ? 40 : -40), f.y - 20); s.vy = -400; s.vx = i ? 200 : -200; }
}

/* ---------------- bullets ---------------- */
function stepBullets(dt){
  for(const b of G.bullets){
    if(b.dead) continue;
    b.life -= dt; if(b.life <= 0){ b.dead = true; continue; }
    if(b.grav) b.vy += b.grav * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    let hitWall = false;
    if(b.x < 0 || b.x > G.W){ if(b.bounce > 0){ b.vx = -b.vx; b.bounce--; b.x = clamp(b.x, 0, G.W); } else hitWall = true; }
    if(b.y < 0){ if(b.bounce > 0){ b.vy = -b.vy; b.bounce--; b.y = 0; } else hitWall = true; }
    if(b.y > G.lavaY){ hitWall = true; }
    for(const pl of G.plats){
      if(b.x > pl.x && b.x < pl.x + pl.w && b.y > pl.y && b.y < pl.y + pl.h){
        if(b.bounce > 0){
          const pen = [b.x - pl.x, pl.x + pl.w - b.x, b.y - pl.y, pl.y + pl.h - b.y], m = Math.min(...pen);
          if(m === pen[0] || m === pen[1]){ b.vx = -b.vx; b.x += Math.sign(b.vx) * (m + 1); } else { b.vy = -b.vy; b.y += Math.sign(b.vy) * (m + 1); }
          b.bounce--;
        } else hitWall = true;
        break;
      }
    }
    if(hitWall){ b.dead = true; burst(b.x, b.y, 4, '#fff3c4', 120, 2.5); if(b.boom) explode(b.x, b.y, b.boom, b.dmg, b.owner); }
  }
  G.bullets = G.bullets.filter(b => !b.dead);
}
function contacts(){
  // bullets vs targets
  for(const b of G.bullets){
    if(b.dead) continue;
    if(!b.foe){
      for(const f of G.foes){
        if(f.dead || b.hit.has(f)) continue;
        if((f.x - b.x) ** 2 + (f.y - b.y) ** 2 > (f.r + b.r) ** 2) continue;
        b.hit.add(f);
        if(f.def.shield && !f.boss){ const T = b.owner; const fx = T.x - f.x, fy = T.y - f.y, fl = Math.hypot(fx, fy) || 1; if((b.vx * fx + b.vy * fy) / (Math.hypot(b.vx, b.vy) * fl) < -0.35){ b.vx = -b.vx * 0.6; b.vy = -b.vy * 0.6; b.foe = true; b.dmg *= 0.5; floatText('BLOCK', f.x, f.y - f.r - 10, '#cfe6ff', 0.8); if(typeof AU !== 'undefined') AU.clank(); break; } }
        let dmg = b.dmg; const crit = G.mode === 'cup' && G.cards.crit && Math.random() < 0.2 * G.cards.crit;
        if(crit) dmg *= 2.5;
        hurtFoe(f, dmg, b.owner, crit);
        f.vx += b.vx * 0.05; f.vy += b.vy * 0.05;
        if(b.boom) explode(b.x, b.y, b.boom, b.dmg * 0.6, b.owner);
        if(!b.pierce){ b.dead = true; break; }
      }
      if(G.mode === 'vs' && !b.dead){
        for(const p of G.players){
          if(p === b.owner || p.dead || p.inv > 0) continue;
          if((p.x - b.x) ** 2 + (p.y - b.y) ** 2 > (p.r + b.r) ** 2) continue;
          hurtPlayer(p, b.dmg * 0.7, b.owner); p.vx += b.vx * 0.25; p.vy += b.vy * 0.25; b.dead = true;
          burst(b.x, b.y, 8, '#ffffff', 200, 3);
          break;
        }
      }
    } else {
      for(const p of G.players){
        if(p.dead || p.inv > 0) continue;
        if((p.x - b.x) ** 2 + (p.y - b.y) ** 2 > (p.r + b.r) ** 2) continue;
        hurtPlayer(p, b.dmg * (1 + G.wave * 0.02), null); b.dead = true; break;
      }
    }
  }
  // bodies: stomp or get hurt
  for(const p of G.players){
    if(p.dead) continue;
    for(const f of G.foes){
      if(f.dead) continue;
      const dx = f.x - p.x, dy = f.y - p.y, rr = f.r + p.r;
      if(dx * dx + dy * dy > rr * rr) continue;
      if(p.vy > 150 && p.y < f.y - f.r * 0.25){
        const k = G.mode === 'cup' ? G.cards.stomp || 0 : 0;
        hurtFoe(f, (28 + 6 * G.wave * 0.3) * (1 + 0.6 * k), p, false, true);
        p.vy = -620; p.ammo = magSize(p);
        if(G.run && G.mode === 'cup'){ G.run.stomps++; save.stats.stomps++; }
        floatText('STOMP!', f.x, f.y - f.r - 16, '#ffd23a', 1.1);
        if(k) { ring(f.x, f.y, '#ffd23a', 70 + 20 * k); for(const o of G.foes) if(o !== f && !o.dead && Math.hypot(o.x - f.x, o.y - f.y) < 80 + 20 * k) hurtFoe(o, 15 * k, p); }
        if(typeof AU !== 'undefined') AU.stomp();
      } else if(p.inv <= 0){
        if(f.def.bomb){ explode(f.x, f.y, 75, f.dmg, null); killFoe(f, null, true); continue; }
        hurtPlayer(p, f.dmg, f);
        const d = Math.hypot(dx, dy) || 1; p.vx -= dx / d * 380; p.vy -= dy / d * 380 + 120;
      }
    }
  }
  // versus: stomp the other player
  if(G.mode === 'vs'){
    const [a, b] = G.players;
    if(!a.dead && !b.dead){
      const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
      if(dx * dx + dy * dy < rr * rr){
        const top = dy > 0 ? a : b, bot = top === a ? b : a;
        if(top.vy > 150 && bot.inv <= 0){ hurtPlayer(bot, 30, top); top.vy = -620; top.ammo = magSize(top); floatText('STOMP!', bot.x, bot.y - 30, '#ffd23a', 1.1); if(typeof AU !== 'undefined') AU.stomp(); }
        else { const d = Math.sqrt(dx * dx + dy * dy) || 1, nx = dx / d, ny = dy / d; a.vx -= nx * 200; a.vy -= ny * 200; b.vx += nx * 200; b.vy += ny * 200; }
      }
    }
  }
}
function hurtFoe(f, dmg, src, crit, quiet){
  if(f.dead) return;
  f.hp -= dmg; f.flash = 1;
  floatText(Math.round(dmg) + (crit ? '!' : ''), f.x + rnd(-8, 8), f.y - f.r - 8, crit ? '#ffd23a' : '#ffffff', crit ? 1.3 : 0.85);
  burst(f.x, f.y, 4, f.def.col, 150, 3);
  if(typeof AU !== 'undefined' && G.mode !== 'demo') AU.hit();
  if(f.hp <= 0) killFoe(f, src);
}
function killFoe(f, src, silent){
  if(f.dead) return;
  f.dead = true;
  explodeFx(f.x, f.y, f.boss ? 2.2 : 0.8, f.def.col);
  if(f.def.bomb && !silent) explode(f.x, f.y, 70, 16, src);
  if(G.mode !== 'cup') return;
  const n = (f.boss ? 30 : f.def.coins) + Math.floor(G.wave / 4);
  for(let i = 0; i < n; i++) dropCoin(f.x, f.y);
  if(Math.random() < 0.06) G.coins.push({ x: f.x, y: f.y, vx: 0, vy: -60, t: 0, heart: true });
  G.run.kills++; save.stats.kills++;
  G.combo = G.comboT > 0 ? G.combo + 1 : 1; G.comboT = 2.2; G.run.maxCombo = Math.max(G.run.maxCombo, G.combo);
  if(G.combo >= 3){ floatText(G.combo + 'x COMBO!', f.x, f.y - 46, pick(['#ffd23a', '#ff5ce1', '#3fd1ff']), 1.3); if(typeof AU !== 'undefined') AU.combo(G.combo); }
  G.hitStop = Math.max(G.hitStop, f.boss ? 0.15 : 0.03);
  if(f.boss){
    G.run.bosses++; save.stats.bosses++; G.slowT = 1.5; G.flash = 0.7; G.flashC = '#ffffff'; G.shake = 22;
    for(const o of G.foes) if(!o.dead && o !== f) killFoe(o, src);
    if(typeof SDK !== 'undefined') SDK.happytime();
  }
}
function explode(x, y, R, dmg, src){
  explodeFx(x, y, R / 80, '#ffb13a');
  G.shake = Math.max(G.shake, 10);
  for(const f of G.foes){ if(f.dead) continue; const d = Math.hypot(f.x - x, f.y - y); if(d < R + f.r) hurtFoe(f, dmg * (1 - d / (R + f.r) * 0.5), src); }
  for(const p of G.players){ if(p.dead || p === src || p.inv > 0) continue; const d = Math.hypot(p.x - x, p.y - y); if(d < R + p.r && (src == null || G.mode === 'vs')) hurtPlayer(p, dmg * 0.6, src); }
}
function explodeFx(x, y, k, col){
  ring(x, y, '#ffffff', 60 * k); burst(x, y, Math.round(18 * k) + 6, col, 320 * Math.sqrt(k), 5, false, true);
  burst(x, y, 10, '#ffd36b', 260, 4, false, true);
  for(let i = 0; i < 5 * k + 2; i++) G.parts.push({ x: x + rnd(-8, 8), y: y + rnd(-8, 8), vx: rnd(-60, 60), vy: rnd(-90, -10), life: 0, max: rnd(0.6, 1), c: 'rgba(255,255,255,0.75)', sz: rnd(8, 14) * Math.sqrt(k), smoke: true });
  G.booms.push({ x, y, t: 0, k });
  if(typeof AU !== 'undefined' && G.mode !== 'demo') AU.boom(Math.min(1.6, k));
}

/* ---------------- coins ---------------- */
function dropCoin(x, y){ const a = Math.random() * TAU, s = rnd(60, 220); G.coins.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, t: 0 }); }
function updateCoins(dt){
  const p = G.players[0];
  if(!p || G.mode !== 'cup'){ G.coins = []; return; }
  const mag = 60 + (G.cards.magnet || 0) * 160;
  for(const c of G.coins){
    if(G.state === 'clear') c.pull = true;
    c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= 1 - 3 * dt; c.vy *= 1 - 3 * dt;
    c.x = clamp(c.x, 10, G.W - 10); c.y = clamp(c.y, 10, G.lavaY - 12);
    const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy) || 1;
    if((d < mag && c.t > 0.3) || c.pull){ const sp = c.pull ? 900 : 500; c.vx = dx / d * sp; c.vy = dy / d * sp; }
    if(d < p.r + 14 && !p.dead){
      c.dead = true;
      if(c.heart){ p.hp = Math.min(p.max, p.hp + 20); floatText('+20 ❤', p.x, p.y - 34, '#ff7ab8', 1); if(typeof AU !== 'undefined') AU.heal(); }
      else { G.run.coins += 1 + save.perk.coin * 0.1; if(typeof AU !== 'undefined') AU.coin(); }
    }
    if(c.t > 12 && !c.pull) c.dead = true;
  }
  G.coins = G.coins.filter(c => !c.dead);
}

/* ---------------- cards ---------------- */
function rollCards(){
  const opts = CARDS.filter(c => (G.cards[c.id] || 0) < c.max && c.id !== 'heal');
  const out = [], p = G.players[0];
  if(p && p.hp < p.max * 0.5) out.push(CARDS.find(c => c.id === 'heal'));
  while(out.length < 3 && opts.length) out.push(opts.splice(Math.floor(Math.random() * opts.length), 1)[0]);
  while(out.length < 3) out.push(CARDS.find(c => c.id === 'heal'));
  return out;
}
function addCard(c){
  const p = G.players[0];
  if(c.id === 'heal'){ p.hp = Math.min(p.max, p.hp + 50); return; }
  G.cards[c.id] = (G.cards[c.id] || 0) + 1; G.cardList.push(c.id);
  p.ammo = magSize(p);
}

/* ---------------- autopilot (title demo, tests, video) ---------------- */
function autopilot(p, dt){
  const A = p.ai; A.t += dt;
  let tgt = null, bd = 1e18;
  for(const f of G.foes){ if(f.dead) continue; const d = (f.x - p.x) ** 2 + (f.y - p.y) ** 2; if(d < bd){ bd = d; tgt = f; } }
  if(G.mode === 'vs'){ const o = G.players[1 - p.pl]; if(!o.dead){ tgt = o; bd = (o.x - p.x) ** 2 + (o.y - p.y) ** 2; } }
  const low = p.y > G.H * 0.6 && !p.ground;
  let aim, fire = false;
  if(low && p.vy > -150){ aim = Math.PI / 2 + clamp((p.x - G.W / 2) / G.W, -0.5, 0.5); fire = p.ammo > 0; }
  else if(tgt){
    const dx = tgt.x - p.x, dy = tgt.y - p.y, far = Math.abs(dx) > 330 || dy < -260;
    if(far && p.ammo > 1){
      // travel: shoot down and away so the recoil carries us toward the target
      aim = Math.PI / 2 + (dx > 0 ? 0.75 : -0.75) * (dy < -200 ? 0.6 : 1); fire = p.vy > -350;
    } else {
      aim = Math.atan2(dy, dx) + rnd(-0.05, 0.05);
      fire = p.ammo > 0 && bd < 600 * 600;
    }
  } else { aim = Math.PI / 2; fire = p.ground && Math.random() < dt * 1.5; }
  return { aim, fire };
}

/* ---------------- effects ---------------- */
function updateFx(dt){
  for(let i = G.parts.length - 1; i >= 0; i--){ const p = G.parts[i]; p.life += dt; if(p.life >= p.max){ G.parts.splice(i, 1); continue; } if(p.g) p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; const k = p.smoke ? 0.95 : 0.92; p.vx *= k; if(!p.g) p.vy *= k; }
  if(G.parts.length > 700) G.parts.splice(0, G.parts.length - 700);
  for(let i = G.texts.length - 1; i >= 0; i--){ const t = G.texts[i]; t.life += dt; t.y -= dt * 40; if(t.life > t.max) G.texts.splice(i, 1); }
  for(let i = G.rings.length - 1; i >= 0; i--){ const r = G.rings[i]; r.life += dt; if(r.life > r.max) G.rings.splice(i, 1); }
  for(const b of G.booms) b.t += dt; G.booms = G.booms.filter(b => b.t < 0.45);
}
function burst(x, y, n, col, sp, sz, small, add){
  for(let i = 0; i < n; i++){ const a = Math.random() * TAU, s = rnd(0.2, 1) * sp; G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: rnd(0.25, 0.6), c: col, sz: rnd(sz * 0.5, sz), add }); }
}
function ring(x, y, col, r){ G.rings.push({ x, y, col, r, life: 0, max: 0.4 }); }
function floatText(txt, x, y, col, size){ G.texts.push({ txt: String(txt), x, y, col, size: size || 1, life: 0, max: 0.85 }); if(G.texts.length > 40) G.texts.shift(); }
