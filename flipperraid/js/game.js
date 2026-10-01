'use strict';
/* =====================================================================
   FLIPPER RAID: pinball physics, dungeon rooms, monsters and cards.
   World: a 600 x 1000 table, y down. Physics runs in substeps so a fast
   ball never tunnels through a flipper.
   ===================================================================== */
const BR = 12, GRAV = 980, VMAX = 2500, SUB = 14, FLEN = 110;
const LP = { x: 176, y: 885 }, RP = { x: 424, y: 885 };
const G = {
  state: 'title', t: 0, ts: 1, room: 1, theme: THEMES[0], lives: 3, score: 0, coins: 0, mult: 1,
  balls: [], mons: [], bumpers: [], targets: [], orbs: [], walls: [], lanes: [false, false, false],
  parts: [], texts: [], rings: [], bolts: [],
  inL: false, inR: false, fl: null, combo: 0, bumps: 0, hits: 0, saveT: 0, angelUsed: false,
  cards: {}, cardList: [], pending: 0, clearT: 0, shake: 0, flash: 0, flashC: '#fff',
  run: null, demo: false, launchQ: 0, rerolls: 0
};

/* ---------------- geometry ---------------- */
function buildTable(){
  const W = [];
  const seg = (ax, ay, bx, by, kind) => W.push({ ax, ay, bx, by, r: 8, kind: kind || 'wall' });
  // dome
  const cx = 300, cy = 300, R = 270, n = 14;
  let px = cx - R, py = cy;
  for(let i = 1; i <= n; i++){ const a = Math.PI + i / n * Math.PI, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R; seg(px, py, x, y); px = x; py = y; }
  seg(30, 300, 30, 760); seg(570, 300, 570, 760);
  // inlane guides into the flippers
  seg(30, 760, LP.x - 12, LP.y - 8); seg(570, 760, RP.x + 12, RP.y - 8);
  // slingshots (closed triangles; the inner face kicks)
  // sealed to the side walls so the ball can never wedge behind them
  seg(78, 680, 140, 790, 'sling'); seg(140, 790, 30, 790); seg(30, 672, 78, 680);
  seg(522, 680, 460, 790, 'sling'); seg(460, 790, 570, 790); seg(570, 672, 522, 680);
  // lane dividers at the top
  for(const x of [255, 345]) W.push({ ax: x, ay: 92, bx: x, by: 132, r: 6, kind: 'wall' });
  G.walls = W;
}
function flipper(side){
  const left = side === 'L', P = left ? LP : RP, f = G.fl[side];
  const len = FLEN * (1 + (G.cards.big || 0) * 0.15);
  const a = f.a;
  return { px: P.x, py: P.y, tx: P.x + Math.cos(a) * len, ty: P.y + Math.sin(a) * len, len };
}
function resetFlippers(){
  G.fl = { L: { a: 0.45, w: 0, rest: 0.45, up: -0.45 }, R: { a: Math.PI - 0.45, w: 0, rest: Math.PI - 0.45, up: Math.PI + 0.45 } };
}

/* ---------------- run / rooms ---------------- */
function newRun(demo){
  G.demo = !!demo;
  G.room = 1; G.score = 0; G.coins = 0; G.mult = 1; G.cards = {}; G.cardList = [];
  G.lives = 3 + (demo ? 0 : save.perk.balls);
  G.rerolls = demo ? 0 : save.perk.reroll;
  G.run = { rooms: 0, kills: 0, bosses: 0, bumps: 0, jack: 0, crits: 0, maxCombo: 0 };
  if(!demo) for(let i = 0; i < save.perk.start; i++){ const c = pick(CARDS.filter(c => c.id !== 'life')); addCard(c, true); }
  buildTable(); resetFlippers();
  startRoom(1);
}
function startRoom(n){
  G.room = n; G.theme = THEMES[Math.floor((n - 1) / 5) % THEMES.length];
  G.mons = []; G.bumpers = []; G.targets = []; G.orbs = []; G.balls = []; G.bolts = [];
  G.parts = []; G.texts = []; G.rings = []; G.lanes = [false, false, false];
  G.combo = 0; G.angelUsed = false; G.clearT = 0; G.ts = 1; G.pending = 0;
  const boss = n % 5 === 0, k = 1 + (n - 1) * 0.2;
  const taken = [];
  const free = (x, y, r) => taken.every(t => Math.hypot(x - t.x, y - t.y) > r + t.r + 34);
  const place = (r, y0, y1) => { for(let i = 0; i < 80; i++){ const x = rnd(70 + r, 530 - r), y = rnd(y0, y1); if(free(x, y, r)){ taken.push({ x, y, r }); return { x, y }; } } return null; };
  if(boss){
    const B = BOSSES[Math.floor(n / 5 - 1) % BOSSES.length];
    const hp = Math.round(420 * k);
    const m = { k: 'boss', x: 300, y: 270, hx: 300, hy: 270, r: B.r, hp, max: hp, col: B.col, name: B.name, pts: 5000, hit: 0, burn: 0, ph: 0, boss: true };
    G.mons.push(m); taken.push({ x: 300, y: 270, r: B.r + 70 });
    const no = 2 + Math.min(2, Math.floor(n / 10));
    for(let i = 0; i < no; i++) G.orbs.push({ a: i / no * TAU, r: 20, dist: B.r + 48, x: 0, y: 0 });
    for(let i = 0; i < 2; i++){ const p = place(26, 480, 620); if(p) G.bumpers.push({ x: p.x, y: p.y, r: 28, hit: 0 }); }
    for(let i = 0; i < 2; i++){ const p = place(20, 450, 640); if(p) addMon('mini', p.x, p.y, k); }
    if(!G.demo){ AU.bossIn(); UI.banner('👑 ' + B.name, 'BOSS ROOM', B.col); }
  }else{
    const nb = 2 + (Math.random() < 0.5 ? 1 : 0);
    for(let i = 0; i < nb; i++){ const p = place(28, 240, 600); if(p) G.bumpers.push({ x: p.x, y: p.y, r: 28, hit: 0 }); }
    if(n >= 2 && Math.random() < 0.55){
      const y = rnd(430, 560), x0 = rnd(150, 270);
      for(let i = 0; i < 4; i++) G.targets.push({ x: x0 + i * 46, y, w: 36, up: true, hit: 0 });
      taken.push({ x: x0 + 70, y, r: 100 });
    }
    const pool = ['slime'];
    if(n >= 2) pool.push('bat'); if(n >= 3) pool.push('knight'); if(n >= 4) pool.push('bomb'); if(n >= 6) pool.push('split'); if(n >= 8) pool.push('ghost');
    const nm = Math.min(9, 3 + Math.floor(n / 2));
    for(let i = 0; i < nm; i++){
      const kind = i === 0 ? 'slime' : pick(pool), r = MONSTERS[kind].r;
      const p = place(r, 170, 640); if(p) addMon(kind, p.x, p.y, k);
    }
    if(!G.demo) UI.banner('ROOM ' + n, n === 1 ? 'Smash the monsters with your ball!' : G.theme.name, G.theme.glow);
  }
  const nb = 1 + ((G.cards.multi || 0) ? 1 : 0);
  for(let i = 0; i < nb; i++) queueLaunch(i * 0.5);
  G.saveT = 4 + (G.demo ? 0 : save.perk.saver * 1.5);
  G.state = G.demo ? 'title' : 'play';
}
function addMon(kind, x, y, k){
  const d = MONSTERS[kind], hp = Math.round(d.hp * k);
  G.mons.push({ k: kind, x, y, hx: x, hy: y, r: d.r, hp, max: hp, col: d.col, pts: d.pts, hit: 0, burn: 0, ph: Math.random() * TAU });
}
// balls waiting in the launch chute count as alive, so the room never thinks it drained
function queueLaunch(delay){ G.pending++; setTimeout(() => { G.pending = Math.max(0, G.pending - 1); launchBall(); }, delay * 1000 + 450); }
function launchBall(x){
  if(G.state !== 'play' && G.state !== 'title') return;
  const b = { x: x || 300, y: 50, vx: rnd(-160, 160), vy: 120, trail: [], slow: 0, ghostN: 0, id: Math.random() };
  G.balls.push(b);
  if(!G.demo) AU.launch();
  ring(b.x, b.y, G.theme.glow, 50);
}
function addCard(c, silent){
  G.cards[c.id] = (G.cards[c.id] || 0) + 1;
  G.cardList.push(c);
  if(c.id === 'life') G.lives++;
  if(!silent && !G.demo) AU.card();
}

/* ---------------- update ---------------- */
function update(rdt){
  if(G.state !== 'play' && G.state !== 'title' && G.state !== 'clear') return;
  G.ts = lerp(G.ts, G.state === 'clear' ? 0.25 : 1, Math.min(1, rdt * 8));
  const dt = rdt * G.ts;
  G.t += dt;
  G.shake = Math.max(0, G.shake - rdt * 30); G.flash = Math.max(0, G.flash - rdt * 2.4);
  if(G.saveT > 0) G.saveT -= dt;
  if(G.demo) autopilot();
  // flippers
  const h = dt / SUB;
  for(let s = 0; s < SUB; s++){
    for(const side of ['L', 'R']){
      const f = G.fl[side], on = side === 'L' ? G.inL : G.inR;
      const target = on ? f.up : f.rest, sp = (on ? 30 : 16) * h;
      const old = f.a;
      if(Math.abs(target - f.a) <= sp) f.a = target; else f.a += Math.sign(target - f.a) * sp;
      f.w = (f.a - old) / h;
    }
    for(const b of G.balls) if(!b.dead) stepBall(b, h);
    ballBall();
  }
  // monsters
  for(const m of G.mons){
    if(m.dead) continue;
    m.ph += dt; m.hit = Math.max(0, m.hit - dt * 4);
    if(m.k === 'bat'){ m.x = m.hx + Math.sin(m.ph * 1.3) * 70; m.y = m.hy + Math.sin(m.ph * 2.1) * 30; }
    if(m.k === 'boss'){ m.x = 300 + Math.sin(m.ph * 0.6) * 140; m.y = m.hy + Math.sin(m.ph * 1.1) * 18; }
    if(m.k === 'ghost') m.gone = (m.ph % 4) > 2.8;
    if(m.burn > 0){ m.burn -= dt; m.burnT = (m.burnT || 0) + dt; if(m.burnT > 0.5){ m.burnT = 0; damage(m, 4 * dmgMult(), null, true); } }
  }
  for(const o of G.orbs){ const bm = G.mons.find(m => m.boss && !m.dead); if(!bm){ o.dead = true; continue; } o.a += dt * 1.6; o.x = bm.x + Math.cos(o.a) * o.dist; o.y = bm.y + Math.sin(o.a) * o.dist; }
  for(const bp of G.bumpers) bp.hit = Math.max(0, bp.hit - dt * 4);
  for(const tg of G.targets) tg.hit = Math.max(0, tg.hit - dt * 3);
  // drains
  for(const b of G.balls){
    if(b.dead || b.y < TH + 20) continue;
    if(G.saveT > 0 || (!G.demo && G.cards.saver && !G.angelUsed)){
      if(G.saveT <= 0) G.angelUsed = true;
      b.dead = true; launchBall();
      if(!G.demo){ AU.save(); floatText(G.saveT > 0 ? 'BALL SAVED!' : '😇 ANGEL SAVE!', 300, 840, '#9fe6ff', 1.2); }
      continue;
    }
    b.dead = true;
  }
  G.balls = G.balls.filter(b => !b.dead);
  if(!G.balls.length && !G.pending && (G.state === 'play' || G.state === 'title') && !G.mons.every(m => m.dead)) lostBall();
  // room clear
  if(G.state === 'play' && G.mons.length && G.mons.every(m => m.dead)) roomClear();
  if(G.state === 'title' && G.mons.every(m => m.dead)) startRoom(G.room % 9 + 1);
  if(G.state === 'clear'){ G.clearT += rdt; if(G.clearT > 1.3 && !G.pickShown){ G.pickShown = true; UI.showPick(); } }
  // effects
  for(let i = G.parts.length - 1; i >= 0; i--){ const p = G.parts[i]; p.life += dt; if(p.life >= p.max){ G.parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; if(p.g) p.vy += p.g * dt; else { p.vx *= 0.93; p.vy *= 0.93; } }
  for(let i = G.texts.length - 1; i >= 0; i--){ const t = G.texts[i]; t.life += rdt; t.y -= rdt * 45; if(t.life > t.max) G.texts.splice(i, 1); }
  for(let i = G.rings.length - 1; i >= 0; i--){ const r = G.rings[i]; r.life += dt; if(r.life > r.max) G.rings.splice(i, 1); }
  for(let i = G.bolts.length - 1; i >= 0; i--){ const r = G.bolts[i]; r.life += rdt; if(r.life > 0.35) G.bolts.splice(i, 1); }
}

/* ---------------- ball physics ---------------- */
function stepBall(b, h){
  b.vy += GRAV * h;
  // drain magnet nudges a falling ball toward the flippers
  if(G.cards.magnet && b.y > 860 && Math.abs(b.x - 300) < 46 && b.vy > 0){ b.vx += (b.x < 300 ? -1 : 1) * 2600 * h * G.cards.magnet; }
  const sp = Math.hypot(b.vx, b.vy); if(sp > VMAX){ b.vx *= VMAX / sp; b.vy *= VMAX / sp; }
  b.x += b.vx * h; b.y += b.vy * h;
  // walls + slingshots
  for(const w of G.walls) collideSeg(b, w);
  // drop targets
  for(const tg of G.targets){
    if(!tg.up) continue;
    const w = { ax: tg.x - tg.w / 2, ay: tg.y, bx: tg.x + tg.w / 2, by: tg.y, r: 7, kind: 'target', tg };
    collideSeg(b, w);
  }
  // flippers
  for(const side of ['L', 'R']){
    const f = flipper(side), fs = G.fl[side];
    const q = closest(b.x, b.y, f.px, f.py, f.tx, f.ty);
    const rad = lerp(13, 8, q.t);
    // which side of the flipper blade the ball is on; a fast ball must never be pushed through it
    const ux = (f.tx - f.px) / f.len, uy = (f.ty - f.py) / f.len;
    const sd = (b.x - f.px) * -uy + (b.y - f.py) * ux;
    const key = 'side' + side;
    if(q.d >= BR + rad){ if(Math.abs(sd) > 3) b[key] = Math.sign(sd); continue; }
    let nx = (b.x - q.x) / (q.d || 1), ny = (b.y - q.y) / (q.d || 1);
    if(b[key] && q.t > 0.02 && q.t < 0.98 && Math.sign(sd) !== b[key]){ nx = -uy * b[key]; ny = ux * b[key]; }
    const svx = -fs.w * (q.y - f.py), svy = fs.w * (q.x - f.px);
    let rvx = b.vx - svx, rvy = b.vy - svy;
    const vn = rvx * nx + rvy * ny;
    if(vn < 0){
      const e = 0.25 + (Math.abs(fs.w) > 1 ? 0.25 + (G.cards.sharp || 0) * 0.15 : 0);
      rvx -= (1 + e) * vn * nx; rvy -= (1 + e) * vn * ny;
      b.vx = rvx + svx; b.vy = rvy + svy;
      if(Math.abs(fs.w) > 1){ G.combo = 0; }
    }
    b.x = q.x + nx * (BR + rad + 0.3); b.y = q.y + ny * (BR + rad + 0.3);
  }
  // bumpers
  for(const bp of G.bumpers){
    const dx = b.x - bp.x, dy = b.y - bp.y, d = Math.hypot(dx, dy);
    if(d >= BR + bp.r) continue;
    const nx = dx / (d || 1), ny = dy / (d || 1), vn = b.vx * nx + b.vy * ny;
    b.x = bp.x + nx * (BR + bp.r + 0.5); b.y = bp.y + ny * (BR + bp.r + 0.5);
    if(vn < 60){
      b.vx -= vn * nx; b.vy -= vn * ny;
      const kick = 880 * (1 + (G.cards.bounce || 0) * 0.15);
      b.vx += nx * kick; b.vy += ny * kick;
      bumperHit(bp, b);
    }
  }
  // boss shield orbs
  for(const o of G.orbs){
    if(o.dead) continue;
    const dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy);
    if(d >= BR + o.r) continue;
    const nx = dx / (d || 1), ny = dy / (d || 1), vn = b.vx * nx + b.vy * ny;
    if(vn < 0){ b.vx -= 1.9 * vn * nx; b.vy -= 1.9 * vn * ny; if(!G.demo) AU.shield(); ring(o.x, o.y, '#ffffff', 30); }
    b.x = o.x + nx * (BR + o.r + 0.5); b.y = o.y + ny * (BR + o.r + 0.5);
  }
  // monsters
  for(const m of G.mons){
    if(m.dead || m.gone) continue;
    const dx = b.x - m.x, dy = b.y - m.y, d = Math.hypot(dx, dy);
    if(d >= BR + m.r) continue;
    const nx = dx / (d || 1), ny = dy / (d || 1), vn = b.vx * nx + b.vy * ny;
    if(vn >= 0){ b.x = m.x + nx * (BR + m.r + 0.5); b.y = m.y + ny * (BR + m.r + 0.5); continue; }
    const speed = Math.hypot(b.vx, b.vy);
    // shield knights block hits from below
    if(m.k === 'knight' && ny > 0.45){
      b.vx -= 1.9 * vn * nx; b.vy -= 1.9 * vn * ny;
      b.x = m.x + nx * (BR + m.r + 0.5); b.y = m.y + ny * (BR + m.r + 0.5);
      if(!G.demo){ AU.shield(); floatText('BLOCK!', m.x, m.y - m.r - 10, '#cfe0f0', 0.7); }
      continue;
    }
    b.ghostN = (b.ghostN || 0) + 1;
    const pierce = G.cards.ghost && b.ghostN % 3 === 0;
    if(!pierce){
      b.vx -= 1.85 * vn * nx; b.vy -= 1.85 * vn * ny;
      b.x = m.x + nx * (BR + m.r + 0.5); b.y = m.y + ny * (BR + m.r + 0.5);
    }else if(!G.demo) floatText('PIERCE!', m.x, m.y - m.r - 20, '#e8f0ff', 0.6);
    G.combo++; G.run.maxCombo = Math.max(G.run.maxCombo, G.combo);
    const base = 10 * dmgMult() * (0.55 + Math.min(1.6, speed / 1100)) * (1 + (G.cards.chain || 0) * 0.1 * Math.min(10, G.combo));
    damage(m, base, b);
    if(G.cards.fire) m.burn = 3;
  }
  // rollover lanes
  if(b.y > 96 && b.y < 128){
    const xs = [210, 300, 390];
    for(let i = 0; i < 3; i++) if(Math.abs(b.x - xs[i]) < 26 && !G.lanes[i]){
      G.lanes[i] = true; if(!G.demo) AU.lane(i); addScore(100, xs[i], 112);
      if(G.lanes.every(x => x)){ G.lanes = [false, false, false]; G.mult = Math.min(9, G.mult + 1); if(!G.demo){ AU.mult(); UI.banner('MULTIPLIER x' + G.mult + '!', '', G.theme.acc); } }
    }
  }
  b.trail.push({ x: b.x, y: b.y }); if(b.trail.length > 10) b.trail.shift();
}
function closest(px, py, ax, ay, bx, by){
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1), x = ax + dx * t, y = ay + dy * t;
  return { x, y, t, d: Math.hypot(px - x, py - y) };
}
function collideSeg(b, w){
  const q = closest(b.x, b.y, w.ax, w.ay, w.bx, w.by);
  if(q.d >= BR + w.r) return;
  const nx = (b.x - q.x) / (q.d || 1), ny = (b.y - q.y) / (q.d || 1), vn = b.vx * nx + b.vy * ny;
  b.x = q.x + nx * (BR + w.r + 0.3); b.y = q.y + ny * (BR + w.r + 0.3);
  if(vn >= 0) return;
  if(w.kind === 'sling' && vn < -120){
    b.vx -= 2 * vn * nx; b.vy -= 2 * vn * ny; b.vx += nx * 520; b.vy += ny * 520;
    w.hit = 1; if(!G.demo) AU.sling(); addScore(30, b.x, b.y); return;
  }
  if(w.kind === 'target'){
    b.vx -= 1.6 * vn * nx; b.vy -= 1.6 * vn * ny;
    w.tg.up = false; w.tg.hit = 1;
    if(!G.demo) AU.target(); addScore(250, w.tg.x, w.tg.y);
    burst(w.tg.x, w.tg.y, 8, G.theme.acc, 160, 3);
    if(G.targets.every(t => !t.up)) jackpot();
    return;
  }
  b.vx -= 1.45 * vn * nx; b.vy -= 1.45 * vn * ny;
  if(!G.demo) AU.wall(-vn);
}
function ballBall(){
  const B = G.balls;
  for(let i = 0; i < B.length; i++) for(let j = i + 1; j < B.length; j++){
    const a = B[i], c = B[j], dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy);
    if(d >= BR * 2 || d === 0) continue;
    const nx = dx / d, ny = dy / d, rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
    const o = (BR * 2 - d) / 2; a.x -= nx * o; a.y -= ny * o; c.x += nx * o; c.y += ny * o;
    if(rel < 0){ a.vx += rel * nx; a.vy += rel * ny; c.vx -= rel * nx; c.vy -= rel * ny; }
  }
}

/* ---------------- scoring & combat ---------------- */
function dmgMult(){ return (1 + (G.cards.heavy || 0) * 0.35) * (1 + (G.demo ? 0 : save.perk.dmg) * 0.08); }
function addScore(v, x, y){ const s = Math.round(v * G.mult); G.score += s; return s; }
function damage(m, dmg, b, quiet){
  if(m.dead) return;
  const crit = !quiet && Math.random() < 0.05 + (G.cards.crit || 0) * 0.15;
  if(crit){ dmg *= 3; G.run.crits++; if(!G.demo) save.stats.crits++; }
  dmg = Math.max(1, Math.round(dmg));
  m.hp -= dmg; m.hit = 1;
  G.hits++;
  if(!G.demo){
    floatText((crit ? 'CRIT ' : '') + dmg, m.x + rnd(-12, 12), m.y - m.r - 6, crit ? '#ffe14d' : quiet ? '#ff9d4a' : '#ffffff', crit ? 1.4 : quiet ? 0.6 : 0.95);
    if(!quiet) AU.hit(G.combo, crit);
  }
  if(!quiet){ burst(b ? b.x : m.x, b ? b.y : m.y, crit ? 14 : 7, m.col, crit ? 320 : 200, crit ? 5 : 4); G.shake = Math.max(G.shake, crit ? 8 : 3); }
  addScore(dmg * 5, m.x, m.y);
  if(m.hp <= 0) killMon(m);
}
function killMon(m){
  m.dead = true;
  G.run.kills++; if(!G.demo) save.stats.kills++;
  if(!G.demo){ AU.kill(); }
  G.shake = Math.max(G.shake, m.boss ? 22 : 8);
  burst(m.x, m.y, m.boss ? 70 : 24, m.col, m.boss ? 600 : 380, m.boss ? 8 : 6);
  ring(m.x, m.y, '#ffffff', m.boss ? 220 : 80);
  const pts = addScore(m.pts, m.x, m.y);
  if(!G.demo) floatText('+' + pts, m.x, m.y - 30, G.theme.acc, m.boss ? 2 : 1.1);
  const c = Math.round((m.boss ? 40 : 3 + Math.floor(Math.random() * 3)) * (1 + (G.cards.coins || 0) * 0.5) * (1 + (G.demo ? 0 : save.perk.gold) * 0.1));
  G.coins += c;
  for(let i = 0; i < Math.min(14, c); i++){ const a = Math.random() * TAU, v = 150 + Math.random() * 250; G.parts.push({ x: m.x, y: m.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, life: 0, max: 0.9, c: '#ffd23a', sz: 5, g: 900, coin: true }); }
  if(!G.demo) setTimeout(() => AU.coin(), 120);
  if(m.k === 'bomb'){
    if(!G.demo) AU.boom(); G.flash = 0.3; G.flashC = '#ffb13a';
    ring(m.x, m.y, '#ff8a3a', 160); burst(m.x, m.y, 30, '#ff8a3a', 500, 6);
    for(const o of G.mons) if(!o.dead && o !== m && Math.hypot(o.x - m.x, o.y - m.y) < 170) damage(o, 40 * dmgMult(), null, true);
  }
  if(m.k === 'split'){ const k = 1 + (G.room - 1) * 0.2; addMon('mini', m.x - 30, m.y, k); addMon('mini', m.x + 30, m.y, k); }
  if(m.boss){ G.run.bosses++; G.lives++; if(!G.demo){ save.stats.bosses++; SDK.happytime(); floatText('+1 BALL!', m.x, m.y - 70, '#7dffb0', 1.5); } G.flash = 0.6; G.flashC = '#ffffff'; }
}
function bumperHit(bp, b){
  bp.hit = 1;
  G.bumps++; G.run.bumps++; if(!G.demo) save.stats.bumps++;
  G.combo++;
  if(!G.demo) AU.bump(G.bumps);
  addScore(50 * (G.cards.bounce ? 2 : 1), bp.x, bp.y);
  ring(bp.x, bp.y, G.theme.glow, 50);
  if(G.cards.boom) for(const m of G.mons) if(!m.dead && Math.hypot(m.x - bp.x, m.y - bp.y) < 150){ damage(m, 8 * G.cards.boom * dmgMult(), null, true); G.bolts.push({ x0: bp.x, y0: bp.y, x1: m.x, y1: m.y, life: 0, col: '#ff8a3a' }); }
  if(G.cards.split && G.balls.length < 4 && Math.random() < 0.12 * G.cards.split){
    G.balls.push({ x: bp.x, y: bp.y - bp.r - BR - 2, vx: rnd(-400, 400), vy: -600, trail: [], ghostN: 0, id: Math.random() });
    if(!G.demo){ AU.multi(); floatText('MULTIBALL!', bp.x, bp.y - 50, '#b98cff', 1.2); }
  }
  if(G.cards.zap && G.bumps % 10 === 0){
    if(!G.demo) AU.zap(); G.flash = 0.25; G.flashC = '#cfe8ff';
    for(const m of G.mons) if(!m.dead){ G.bolts.push({ x0: m.x + rnd(-40, 40), y0: 0, x1: m.x, y1: m.y, life: 0, col: '#9fe6ff' }); damage(m, 20 * G.cards.zap * dmgMult(), null, true); }
    if(!G.demo) floatText('⚡ LIGHTNING!', 300, 400, '#9fe6ff', 1.3);
  }
}
function jackpot(){
  G.run.jack++; if(!G.demo) save.stats.jack++;
  const v = addScore(5000, 300, 480);
  G.coins += 15;
  if(!G.demo){ AU.jackpot(); UI.banner('💰 JACKPOT! +' + v, 'Bonus multiball!', '#ffe14d'); SDK.happytime(); }
  G.flash = 0.5; G.flashC = '#fff2a8';
  confetti(300, 480, 70);
  setTimeout(() => { if(G.state === 'play' || G.state === 'title'){ for(const t of G.targets){ t.up = true; } launchBall(); } }, 1500);
}
function lostBall(){
  if(G.demo){ launchBall(); return; }
  G.lives--;
  AU.drain();
  if(G.lives <= 0){ gameOverNow(); return; }
  UI.banner('BALL LOST', G.lives + (G.lives === 1 ? ' ball left' : ' balls left'), '#ff6b6b');
  G.saveT = 3 + save.perk.saver;
  queueLaunch(0.6);
}
function roomClear(){
  G.state = 'clear'; G.clearT = 0; G.pickShown = false;
  G.run.rooms++; save.stats.rooms++;
  const bonus = addScore(1000 * G.room, 300, 400);
  G.coins += 5 + G.room;
  AU.clear(); G.flash = 0.4; G.flashC = '#ffffff';
  confetti(300, 420, 90);
  UI.banner(G.room % 5 === 0 ? '👑 BOSS DEFEATED!' : 'ROOM CLEAR!', '+' + bonus, G.theme.acc);
  missionTick(G.room); persist();
}
function nextRoom(){
  UI.hidePick();
  G.balls = [];
  startRoom(G.room + 1);
}
function gameOverNow(){
  G.state = 'over';
  setTimeout(() => UI.gameOver(), 600);
}
function runGems(){ return Math.floor(G.coins / 6) + G.run.rooms * 2 + G.run.bosses * 10; }

/* ---------------- card choice ---------------- */
function rollCards(){
  const pool = CARDS.filter(c => !(c.id === 'multi' && G.cards.multi) && !(c.id === 'saver' && G.cards.saver));
  const out = [];
  while(out.length < 3){
    const w = pool.map(c => c.rar === 3 ? 1 : c.rar === 2 ? 2.5 : 4);
    let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0;
    while(r > w[i]){ r -= w[i]; i++; }
    if(!out.includes(pool[i])) out.push(pool[i]);
  }
  return out;
}

/* ---------------- autopilot (title demo + tests + trailer) ---------------- */
function autopilot(){
  // flip when a ball is about to touch a resting flipper, hold briefly, then let go
  const AP = G.ap || (G.ap = { L: 0, R: 0 });
  for(const side of ['L', 'R']){
    if(AP[side] > 0){ AP[side] -= 1 / 60; continue; }
    const fs = G.fl[side], len = FLEN * (1 + (G.cards.big || 0) * 0.15), P = side === 'L' ? LP : RP;
    const tx = P.x + Math.cos(fs.rest) * len, ty = P.y + Math.sin(fs.rest) * len;
    for(const b of G.balls){
      if(b.vy < -50) continue;
      const fx = b.x + b.vx * 0.03, fy = b.y + b.vy * 0.03;
      const q = closest(fx, fy, P.x, P.y, tx, ty);
      if(q.d < BR + 26 && q.t > 0.15){ AP[side] = 0.22; break; }
    }
  }
  G.inL = AP.L > 0.02; G.inR = AP.R > 0.02;
}

/* ---------------- effects ---------------- */
function burst(x, y, n, col, sp, sz){ for(let i = 0; i < n; i++){ const a = Math.random() * TAU, v = sp * (0.3 + Math.random() * 0.7); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.3 + Math.random() * 0.35, c: col, sz: sz * (0.6 + Math.random() * 0.8) }); } }
function ring(x, y, col, r){ G.rings.push({ x, y, col, r, life: 0, max: 0.4 }); }
function confetti(x, y, n){ const cols = ['#ff4f8b', '#ffd24a', '#4dffb0', '#5a8cff', '#ff8a3a', '#b98cff']; for(let i = 0; i < n; i++){ const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, v = 300 + Math.random() * 600; G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 1.4 + Math.random(), c: cols[i % cols.length], sz: 5, g: 900, sq: true }); } }
function floatText(txt, x, y, col, size){ if(G.demo) return; if(G.texts.length > 30) G.texts.shift(); G.texts.push({ txt, x, y, col, size: size || 1, life: 0, max: 0.9 }); }
