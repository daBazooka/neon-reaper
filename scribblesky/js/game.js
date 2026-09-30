'use strict';
/* =====================================================================
   SCRIBBLE SKY: simulation.
   Gravity pulls the marble down; the player draws ink lines under it that
   launch it upward once and snap. Climb as high as you can: hazards kill,
   stars score, and an ink flood rises from below. Up is -y.
   ===================================================================== */
const GRAV = 1500, BR = 21;
const G = {
  state: 'title', t: 0, ts: 1, balls: [], strokes: [], cur: null, items: [], haz: [], solids: [], pegs: [],
  parts: [], texts: [], rings: [], camY: 0, viewH: 1200, startY: 0, doom: 0, genY: 0,
  ink: 500, run: null, pw: {}, cards: {}, combo: 0, comboT: 0, shake: 0, flash: 0, flashC: '#fff',
  nextMile: 100, bestShown: false, nextCard: 400, nextPeg: 800, revived: false, overT: 0, demo: false, pegN: 0, warnT: 0
};

/* ---------------- helpers ---------------- */
function mainBall(){ let b = null; for(const x of G.balls) if(!x.dead && (!b || x.y < b.y)) b = x; return b; }
function depthM(){ const b = mainBall(); return b ? Math.max(0, (G.startY - b.y) / M) : G.run ? G.run.depth : 0; }
function inkMax(){ return 520 * (1 + save.perk.ink * 0.08) * (1 + (G.cards.long || 0) * 0.3); }
function inkRegen(){ return 250 * (1 + save.perk.regen * 0.1) * (1 + (G.cards.quick || 0) * 0.4); }
function pwDur(k){ return POWERS[k].dur * (1 + (G.cards.power || 0) * 0.4); }
function comboMult(){ return 1 + Math.floor(G.combo / 5) * 0.5; }
function newBall(x, y, vx = 0, vy = 0){ return { x, y, vx, vy, r: BR, dead: false, shield: false, inv: 0, spin: 0, trail: [] }; }
function segDist(px, py, ax, ay, bx, by){
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1), qx = ax + dx * t, qy = ay + dy * t;
  return { d: Math.hypot(px - qx, py - qy), qx, qy };
}

/* ---------------- run setup ---------------- */
function newRun(demo){
  G.demo = !!demo;
  G.t = 0; G.ts = 1; G.balls = []; G.strokes = []; G.cur = null; G.items = []; G.haz = []; G.solids = []; G.pegs = [];
  G.parts = []; G.texts = []; G.rings = []; G.pw = {}; G.cards = {}; G.combo = 0; G.comboT = 0;
  G.startY = 0; G.camY = -G.viewH * 0.7; G.doom = 650; G.genY = -300;
  G.nextMile = 100; G.bestShown = false; G.nextCard = 150; G.nextPeg = 300; G.revived = false; G.pegN = 0;
  G.run = { depth: 0, score: 0, stars: 0, coins: 0, bounce: 0, maxCombo: 0, cards: 0, powers: 0, smash: 0, pegs: 0 };
  const b = newBall(WW / 2, -60, 0, 0);
  if(!demo && save.perk.shield) b.shield = true;
  G.balls.push(b);
  G.ink = inkMax();
  // the notebook's bottom edge is a trampoline for the first jump, with stars above it
  G.solids.push({ pad: true, ax: 90, ay: 40, bx: WW - 90, by: 40, floor: true });
  for(let i = 0; i < 5; i++) G.items.push({ k: 'star', x: WW / 2 + Math.sin(i * 0.9) * 110, y: -160 - i * 80, r: 16 });
  genTo(-2400);
  if(!demo && save.perk.rocket){ startPower('rocket', b, save.perk.rocket * 150 * M / 1600 + 0.5); }
}

/* ---------------- world generation ---------------- */
function genTo(y){ while(G.genY > y) genChunk(); }
function genChunk(){
  // chunks are built bottom-up: y0 is the bottom edge, the chunk spans y0-H .. y0
  const Y = G.genY, m = -Y / M, d = Math.min(1, m / 2600);
  // card gates and bonus peg rooms at fixed depths
  if(m >= G.nextCard){ genCards(Y - 420); G.nextCard += 300; G.genY -= 420; return; }
  if(m >= G.nextPeg){ genPegRoom(Y - 1000); G.nextPeg += 700; G.genY -= 1000; return; }
  const H = 560, y0 = Y - H;
  const safe = m < 60;
  const pool = safe ? ['stars', 'coins', 'funnel', 'stars', 'pads'] :
    m < 150 ? ['stars', 'coins', 'spikes', 'blobs', 'funnel', 'stars', 'pads', 'saws', 'coins'] :
    m < 400 ? ['stars', 'coins', 'spikes', 'blobs', 'laser', 'funnel', 'stars', 'pads', 'saws'] :
      ['stars', 'coins', 'spikes', 'blobs', 'laser', 'saws', 'funnel', 'bombs', 'mixed', 'laser', 'blobs', 'saws', 'pads'];
  const kind = pick(pool);
  const hzN = 1 + Math.floor(d * 2.5);
  // stars start at cy and climb upward
  const addStars = (cx, cy, n, spread) => { for(let i = 0; i < n; i++) G.items.push({ k: 'star', x: clamp(cx + Math.sin(i * 0.8 + cy) * spread, 40, WW - 40), y: cy - i * 55, r: 16 }); };
  const power = cy => {
    if(Math.random() < 0.2 + save.perk.luck * 0.03 + (m < 100 ? 0.1 : 0)){
      const keys = Object.keys(POWERS).filter(k => k !== 'shield' || Math.random() < 0.5);
      G.items.push({ k: 'power', p: pick(keys), x: rnd(90, WW - 90), y: cy, r: 24, bob: Math.random() * TAU });
    }
  };
  if(kind === 'stars') addStars(rnd(160, WW - 160), y0 + H - 80, 6 + Math.floor(Math.random() * 4), rnd(60, 180));
  else if(kind === 'coins'){
    const cx = rnd(140, WW - 140), cy = y0 + 250;
    for(let i = 0; i < 10; i++){ const a = i / 10 * TAU; G.items.push({ k: 'coin', x: cx + Math.cos(a) * 90, y: cy + Math.sin(a) * 90, r: 14 }); }
    if(Math.random() < 0.3) G.items.push({ k: 'gem', x: cx, y: cy, r: 16 });
  }
  else if(kind === 'spikes'){
    const left = Math.random() < 0.5, len = rnd(260, 480);
    G.haz.push({ k: 'spike', left, y0: y0 + 40, y1: y0 + 40 + len });
    addStars(left ? WW * 0.66 : WW * 0.34, y0 + H - 60, 5, 60);
  }
  else if(kind === 'saws'){
    for(let i = 0; i < Math.min(2, hzN); i++){ const r = rnd(32, 44); G.haz.push({ k: 'saw', x: rnd(160, WW - 160), y: y0 + 140 + i * 230, r, amp: rnd(120, 230), sp: rnd(0.9, 1.8) * (Math.random() < 0.5 ? 1 : -1), ph: Math.random() * TAU, bx: 0 }); }
    for(const h of G.haz.slice(-2)) h.bx = h.x;
    addStars(WW / 2, y0 + H - 40, 4, 200);
  }
  else if(kind === 'blobs'){
    const n = 2 + Math.floor(d * 3) + Math.floor(Math.random() * 2);
    const placed = [];
    for(let t = 0; t < 40 && placed.length < n; t++){
      const x = rnd(70, WW - 70), y = y0 + rnd(60, H - 60), r = rnd(26, 38);
      if(placed.some(p => Math.hypot(p.x - x, p.y - y) < p.r + r + 170)) continue;
      placed.push({ x, y, r });
    }
    for(const p of placed) G.haz.push({ k: 'blob', x: p.x, y: p.y, r: p.r, ph: Math.random() * TAU, bx: p.x });
    addStars(rnd(120, WW - 120), y0 + H - 30, 3, 80);
  }
  else if(kind === 'laser' || kind === 'mixed'){
    const gap = lerp(340, 230, d), gx = rnd(gap / 2 + 30, WW - gap / 2 - 30), y = y0 + 260;
    const blink = m > 500 && Math.random() < 0.4;
    G.haz.push({ k: 'laser', y, a0: 0, a1: gx - gap / 2, blink, ph: Math.random() * 3 });
    G.haz.push({ k: 'laser', y, a0: gx + gap / 2, a1: WW, blink, ph: 0 });
    G.haz[G.haz.length - 1].ph = G.haz[G.haz.length - 2].ph;
    addStars(gx, y + 180, 3, 0);
    G.items.push({ k: 'star', x: gx, y: y - 60, r: 16 });
    if(kind === 'mixed'){ const r = 34; G.haz.push({ k: 'saw', x: WW / 2, y: y - 200, r, amp: 200, sp: 1.3, ph: 0, bx: WW / 2 }); }
  }
  else if(kind === 'funnel'){
    const cx = rnd(220, WW - 220), y = y0 + 150, open = 150;
    G.solids.push({ ax: cx - open / 2 - 200, ay: y + 150, bx: cx - open / 2, by: y });
    G.solids.push({ ax: cx + open / 2 + 200, ay: y + 150, bx: cx + open / 2, by: y });
    addStars(cx, y - 30, 5, 0);
  }
  else if(kind === 'pads'){
    for(let i = 0; i < 2; i++) G.solids.push({ pad: true, ax: rnd(80, WW - 240), ay: y0 + 200 + i * 220, bx: 0, by: 0 });
    for(const s of G.solids.slice(-2)){ s.bx = s.ax + 150; s.by = s.ay; }
    addStars(rnd(150, WW - 150), y0 + H - 40, 5, 120);
  }
  else if(kind === 'bombs'){
    for(let i = 0; i < 2; i++) G.haz.push({ k: 'bomb', x: rnd(120, WW - 120), y: y0 + 150 + i * 230, r: 26 });
    for(let i = 0; i < 2; i++) G.haz.push({ k: 'blob', x: rnd(70, WW - 70), y: y0 + 260 + i * 160, r: 28, ph: Math.random() * TAU, bx: 0 });
    for(const h of G.haz.slice(-2)) h.bx = h.x;
  }
  power(y0 + 80);
  G.genY -= H;
}
function genCards(y0){
  const ids = CARDS.map(c => c.id).sort(() => Math.random() - 0.5).slice(0, 3);
  const grp = { taken: false };
  ids.forEach((id, i) => G.items.push({ k: 'card', c: CARDS.find(c => c.id === id), x: 140 + i * 220, y: y0 + 200, r: 52, grp }));
  G.texts.push({ txt: 'PICK A CARD!', x: WW / 2, y: y0 + 310, col: '#ffffff', size: 1.3, life: 0, max: 99, world: true, stay: true });
}
function genPegRoom(y0){
  G.texts.push({ txt: '★ BONUS PEGS ★', x: WW / 2, y: y0 + 960, col: '#ffe14d', size: 1.3, life: 0, max: 99, stay: true });
  const cols = 7, rows = 9;
  for(let r = 0; r < rows; r++) for(let c = 0; c < cols - (r % 2); c++){
    const x = 70 + c * 96 + (r % 2 ? 48 : 0), y = y0 + 130 + r * 90;
    G.pegs.push({ x, y, r: 12, hit: 0, gold: Math.random() < 0.12, hue: (c * 40 + r * 25) % 360 });
  }
  for(let i = 0; i < 6; i++) G.items.push({ k: 'coin', x: rnd(80, WW - 80), y: y0 + 180 + i * 130, r: 14 });
}

/* ---------------- drawing ---------------- */
function strokeStart(x, y){
  if(G.state !== 'play' && G.state !== 'title') return;
  if(G.ink < 20){ if(!G.demo) floatText('OUT OF INK!', x, y - 30, '#ff6b6b', 0.8); return; }
  const live = G.strokes.filter(s => s.live);
  if(live.length >= 7) breakStroke(live[0], true);
  G.cur = { pts: [{ x, y }], len: 0, live: true, drawing: true, breakT: 0, hue: Math.random() * 360, rainbow: !!G.pw.rainbow };
  G.strokes.push(G.cur);
}
function strokeMove(x, y){
  const s = G.cur; if(!s || !s.drawing) return;
  const p = s.pts[s.pts.length - 1], d = Math.hypot(x - p.x, y - p.y);
  if(d < 12) return;
  const room = Math.min(G.ink, 420 - s.len);
  if(room <= 2){ strokeEnd(); return; }
  const k = Math.min(1, room / d);
  s.pts.push({ x: p.x + (x - p.x) * k, y: p.y + (y - p.y) * k });
  s.len += d * k; G.ink -= d * k;
  if(!G.demo) AU.scribble(true, d * 60);
  if(k < 1) strokeEnd();
}
function strokeEnd(){
  const s = G.cur; if(!s) return;
  s.drawing = false; G.cur = null;
  AU.scribble(false, 0);
  if(s.pts.length < 2){ s.live = false; G.strokes = G.strokes.filter(x => x !== s); }
}
function breakStroke(s, quiet){
  if(!s.live) return;
  s.live = false; s.breakT = 0; s.drawing = false;
  if(G.cur === s) G.cur = null;
  const col = inkCol(s);
  for(let i = 0; i < s.pts.length; i += 2){ const p = s.pts[i]; for(let k = 0; k < 2; k++) G.parts.push({ x: p.x, y: p.y, vx: rnd(-120, 120), vy: rnd(-200, 60), life: 0, max: 0.6, c: col, sz: rnd(3, 6), g: 900 }); }
  if(!quiet) AU.snap();
}
function inkCol(s){
  const ink = INKS.find(i => i.id === save.ink) || INKS[0];
  if(s && s.rainbow) return `hsl(${(s.hue + G.t * 200) % 360},90%,55%)`;
  if(ink.c === 'rainbow') return `hsl(${s ? s.hue : 0},85%,55%)`;
  return ink.c || worldAt(depthM()).ink;
}

/* ---------------- powers & cards ---------------- */
function startPower(k, b, dur){
  const p = POWERS[k];
  G.run.powers++; if(!G.demo) save.stats.powers++;
  if(!G.demo) AU.power();
  flashText(p.icon + ' ' + p.name, p.col);
  if(k === 'multi'){
    for(const s of [-1, 1]){ const nb = newBall(b.x, b.y, b.vx + s * 420, Math.min(b.vy, 0) - 300); G.balls.push(nb); }
    return;
  }
  if(k === 'shield'){ b.shield = true; return; }
  G.pw[k] = dur != null ? dur : pwDur(k);
  if(k === 'rainbow') for(const s of G.strokes) if(s.live) s.rainbow = true;
}
function takeCard(it){
  const c = it.c;
  it.grp.taken = true;
  G.cards[c.id] = (G.cards[c.id] || 0) + 1;
  G.run.cards++; if(!G.demo) save.stats.cards++;
  if(!G.demo) AU.card();
  flashText(c.icon + ' ' + c.name.toUpperCase(), '#ffe14d', c.desc);
  const b = mainBall();
  if(c.id === 'shield' && b) b.shield = true;
  if(c.id === 'multi' && b) startPower('multi', b);
  if(c.id === 'fire' && b) startPower('fire', b);
  if(c.id === 'long') G.ink = Math.min(inkMax(), G.ink + 150);
  for(const o of G.items) if(o.k === 'card' && o.grp === it.grp && o !== it){ o.dead = true; burst(o.x, o.y, 10, '#ffffff', 200, 4); }
  for(const t of G.texts) if(t.txt === 'PICK A CARD!' && Math.abs(t.y - it.y) < 200) t.max = t.life + 0.3;
  confetti(it.x, it.y, 40);
  SDK.happytime();
}

/* ---------------- update ---------------- */
function update(rdt){
  const live = G.state === 'play' || G.state === 'title';
  if(!live && G.state !== 'over') return;
  // slow-mo slows the world, never your pen
  const slow = G.pw.slow > 0 ? 0.5 : 1;
  G.ts = lerp(G.ts, slow, Math.min(1, rdt * 6));
  const dt = rdt * G.ts;
  G.t += dt;
  G.shake = Math.max(0, G.shake - rdt * 30); G.flash = Math.max(0, G.flash - rdt * 2.4);
  for(const k in G.pw){ if(G.pw[k] > 0){ G.pw[k] -= dt; if(G.pw[k] <= 0) delete G.pw[k]; } }
  G.ink = Math.min(inkMax(), G.ink + inkRegen() * rdt * (G.cur ? 0.25 : 1));
  if(G.comboT > 0){ G.comboT -= dt; if(G.comboT <= 0) G.combo = 0; }
  if(G.demo && G.state === 'title') autopilot(rdt);

  if(live){
    for(const b of G.balls) if(!b.dead) stepBall(b, dt);
    if(G.state === 'play' && G.balls.every(b => b.dead)) allDead();
  }
  // moving hazards
  for(const h of G.haz){
    if(h.k === 'saw') h.x = h.bx + Math.sin(G.t * h.sp + h.ph) * h.amp, h.x = clamp(h.x, h.r, WW - h.r);
    if(h.k === 'blob') h.x = h.bx + Math.sin(G.t * 1.3 + h.ph) * 24;
  }
  // magnet pulls stars and coins
  const mb = mainBall();
  const mag = (G.pw.magnet ? 300 : 0) + (G.cards.magnet ? 110 * G.cards.magnet : 0);
  if(mag && mb){
    for(const it of G.items){
      if(it.dead || (it.k !== 'star' && it.k !== 'coin' && it.k !== 'gem')) continue;
      const dx = mb.x - it.x, dy = mb.y - it.y, d = Math.hypot(dx, dy);
      if(d < mag && d > 1){ const v = 700 * dt * (1.4 - d / mag); it.x += dx / d * v; it.y += dy / d * v; }
    }
  }
  // the ink flood
  if(mb && live){
    const m = depthM();
    // gentle at first, then steadily hungrier
    const sp = (m < 80 ? 70 : Math.min(400, 95 + m * 0.11)) * (1 - (G.cards.calm || 0) * 0.15) * (G.t < 2.5 ? 0 : 1);
    G.doom -= sp * dt;
    G.doom = Math.min(G.doom, mb.y + 1250);
    if(G.pw.rocket) G.doom = Math.max(G.doom, mb.y + 700);
    const gap = G.doom - mb.y;
    if(gap < 380 && G.state === 'play'){ G.warnT -= rdt; if(G.warnT <= 0){ AU.beat(); G.warnT = gap < 220 ? 0.3 : 0.55; } }
  }
  // camera
  if(mb){ const ty = mb.y - G.viewH * 0.62; G.camY = lerp(G.camY, ty, Math.min(1, rdt * (G.pw.rocket ? 9 : 5))); }
  genTo(G.camY - 1400);
  // milestones
  if(G.state === 'play' && mb){
    const m = depthM(); G.run.depth = Math.max(G.run.depth, m);
    if(m >= G.nextMile){ AU.mile(); floatText(G.nextMile + ' m!', WW / 2, mb.y - 90, '#ffffff', 1.3); G.run.score += 50; G.nextMile = (Math.floor(m / 100) + 1) * 100; }
    if(save.best > 50 && !G.bestShown && m > save.best){ G.bestShown = true; AU.best(); flashText('🏆 NEW BEST!', '#ffe14d'); confetti(mb.x, mb.y, 50); SDK.happytime(); }
  }
  // effects
  for(let i = G.parts.length - 1; i >= 0; i--){
    const p = G.parts[i]; p.life += dt;
    if(p.life >= p.max){ G.parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; if(p.g) p.vy += p.g * dt; else { p.vx *= 0.93; p.vy *= 0.93; }
  }
  for(let i = G.texts.length - 1; i >= 0; i--){ const t = G.texts[i]; t.life += rdt; if(!t.stay) t.y -= rdt * 40; if(t.life > t.max) G.texts.splice(i, 1); }
  for(let i = G.rings.length - 1; i >= 0; i--){ const r = G.rings[i]; r.life += dt; if(r.life > r.max) G.rings.splice(i, 1); }
  for(const s of G.strokes) if(!s.live) s.breakT += dt;
  // cleanup far above
  const cut = Math.max(G.camY + G.viewH, G.doom) + 500;
  if(Math.floor(G.t * 2) !== Math.floor((G.t - dt) * 2)){
    G.items = G.items.filter(o => !o.dead && o.y < cut);
    G.haz = G.haz.filter(h => !h.dead && (h.y0 != null ? h.y0 : h.y) < cut);
    G.solids = G.solids.filter(s => Math.min(s.ay, s.by) < cut);
    G.pegs = G.pegs.filter(p => p.y < cut && !(p.hit > 1));
    G.strokes = G.strokes.filter(s => s.live ? Math.min(...s.pts.map(p => p.y)) < cut : s.breakT < 0.6);
    G.balls = G.balls.filter(b => !b.dead || G.balls.length === 1);
  }
  for(const p of G.pegs) if(p.hit > 0) p.hit += dt * 2;
}

function stepBall(b, dt){
  const n = Math.min(8, Math.max(1, Math.ceil(Math.hypot(b.vx, b.vy) * dt / 8)));
  const h = dt / n;
  const tr = G.pw.giant ? 36 : BR;
  b.r = lerp(b.r, tr, Math.min(1, dt * 8));
  if(b.inv > 0) b.inv -= dt;
  for(let i = 0; i < n && !b.dead; i++) sub(b, h);
  b.spin += b.vx * dt * 0.05;
  b.trail.push({ x: b.x, y: b.y }); if(b.trail.length > 14) b.trail.shift();
}
function sub(b, h){
  const r = b.r;
  if(G.pw.rocket){ b.vy = lerp(b.vy, -1700, 0.2); b.vx *= 0.9; }
  else{ b.vy = Math.min(b.vy + GRAV * h, 950); b.vx *= 1 - 0.5 * h; }
  const sp = Math.hypot(b.vx, b.vy); if(sp > 1900){ b.vx *= 1900 / sp; b.vy *= 1900 / sp; }
  b.x += b.vx * h; b.y += b.vy * h;
  // side walls
  if(b.x < r){ b.x = r; b.vx = Math.abs(b.vx) * 0.85; if(Math.abs(b.vx) > 120) AU.wall(); }
  if(b.x > WW - r){ b.x = WW - r; b.vx = -Math.abs(b.vx) * 0.85; if(Math.abs(b.vx) > 120) AU.wall(); }
  const smash = G.pw.fire || G.pw.giant || G.pw.rocket;
  // ink lines
  for(const s of G.strokes){
    if(!s.live) continue;
    let hit = null;
    for(let i = 1; i < s.pts.length; i++){
      const a = s.pts[i - 1], c = s.pts[i], q = segDist(b.x, b.y, a.x, a.y, c.x, c.y);
      if(q.d < r + 5 && (!hit || q.d < hit.d)) hit = q;
    }
    if(!hit) continue;
    let nx = (b.x - hit.qx) / (hit.d || 1), ny = (b.y - hit.qy) / (hit.d || 1);
    if(hit.d < 0.01){ nx = 0; ny = -1; }
    const vn = b.vx * nx + b.vy * ny;
    if(vn < 0){
      const e = 0.95 * (1 + (G.cards.spring || 0) * 0.12);
      b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
      const out = b.vx * nx + b.vy * ny, minOut = 1040 * (1 + (G.cards.spring || 0) * 0.08);
      if(out < minOut){ b.vx += (minOut - out) * nx; b.vy += (minOut - out) * ny; }
      b.vx = clamp(b.vx, -560, 560);
      if(b.vy > -700 && ny < -0.2) b.vy = -700;
      b.x = hit.qx + nx * (r + 5.5); b.y = hit.qy + ny * (r + 5.5);
      onBounce(b, s);
    }
  }
  // solid walls and pads (never break)
  for(const s of G.solids){
    const q = segDist(b.x, b.y, s.ax, s.ay, s.bx, s.by);
    if(q.d >= r + 7) continue;
    let nx = (b.x - q.qx) / (q.d || 1), ny = (b.y - q.qy) / (q.d || 1);
    const vn = b.vx * nx + b.vy * ny;
    if(vn < 0){
      if(s.pad && ny < 0){ b.vy = -1250; b.vx *= 0.8; if(!G.demo) AU.pad(); s.boing = 1; burst(b.x, b.y + r, 8, '#7dff8a', 200, 4); bumpCombo(); }
      else{ b.vx -= 1.8 * vn * nx; b.vy -= 1.8 * vn * ny; AU.wall(); }
    }
    b.x = q.qx + nx * (r + 7.5); b.y = q.qy + ny * (r + 7.5);
  }
  // bonus pegs
  for(const p of G.pegs){
    if(p.hit) continue;
    const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy);
    if(d < r + p.r){
      const nx = dx / (d || 1), ny = dy / (d || 1), vn = b.vx * nx + b.vy * ny;
      if(vn < 0){ b.vx -= 1.85 * vn * nx; b.vy -= 1.85 * vn * ny; }
      b.x = p.x + nx * (r + p.r + 0.5); b.y = p.y + ny * (r + p.r + 0.5);
      p.hit = 0.01;
      G.pegN++; G.run.pegs++; if(!G.demo) save.stats.pegs++;
      const v = p.gold ? 50 : 10;
      addScore(v, p.x, p.y, p.gold ? '#ffe14d' : `hsl(${p.hue},90%,65%)`);
      if(p.gold){ G.run.coins += 5; }
      if(!G.demo) AU.peg(G.pegN);
      bumpCombo();
      burst(p.x, p.y, 8, p.gold ? '#ffe14d' : `hsl(${p.hue},90%,60%)`, 180, 4);
    }
  }
  // hazards
  for(const hz of G.haz){
    if(hz.dead) continue;
    let touch = false;
    if(hz.k === 'spike'){ touch = b.y > hz.y0 && b.y < hz.y1 && (hz.left ? b.x < r + 26 : b.x > WW - r - 26); }
    else if(hz.k === 'laser'){
      const on = !hz.blink || ((G.t + hz.ph) % 3) < 2;
      touch = on && Math.abs(b.y - hz.y) < r + 8 && b.x > hz.a0 - r && b.x < hz.a1 + r;
    }
    else touch = Math.hypot(b.x - hz.x, b.y - hz.y) < r + hz.r - 4;
    if(!touch){
      if(hz.k !== 'spike' && hz.k !== 'laser' && !hz.near && Math.hypot(b.x - hz.x, b.y - hz.y) < r + hz.r + 24){ hz.near = true; if(!G.demo){ AU.near(); floatText('CLOSE!', b.x, b.y - 40, '#ff9d6b', 0.8); } G.run.score += 15; }
      continue;
    }
    if(hz.k === 'bomb'){ explode(hz, b); continue; }
    if(smash && hz.k !== 'spike' && hz.k !== 'laser' || (smash && hz.k === 'laser')){
      hz.dead = true; G.run.smash++; if(!G.demo) save.stats.smash++;
      if(!G.demo) AU.smash(); G.shake = Math.max(G.shake, 8);
      burst(hz.x || b.x, hz.y || b.y, 22, hz.k === 'blob' ? '#2b2a4a' : '#ff8a3a', 380, 6);
      addScore(40, b.x, b.y - 30, '#ff8a3a', 'SMASH! ');
      continue;
    }
    if(hz.k === 'spike' && smash){ b.vx = hz.left ? 600 : -600; continue; }
    hurt(b);
    if(b.dead) return;
  }
  // pickups
  for(const it of G.items){
    if(it.dead) continue;
    if(Math.hypot(b.x - it.x, b.y - it.y) > r + it.r) continue;
    if(it.k === 'card'){ if(!it.grp.taken) takeCard(it); it.dead = true; continue; }
    it.dead = true;
    if(it.k === 'star'){
      G.run.stars++; if(!G.demo) save.stats.stars++;
      const v = Math.round(10 * (1 + (G.cards.stars || 0) * 0.5) * comboMult());
      addScore(v, it.x, it.y, '#ffe14d');
      if(!G.demo) AU.star(G.run.stars);
      burst(it.x, it.y, 8, '#ffe14d', 160, 4);
    }else if(it.k === 'coin' || it.k === 'gem'){
      const v = Math.round((it.k === 'gem' ? 25 : 1) * (1 + (G.cards.coins || 0) * 0.5));
      G.run.coins += v; if(!G.demo) AU.coin();
      floatText('+' + v + ' 🪙', it.x, it.y, '#ffd23a', 0.7);
      burst(it.x, it.y, 6, '#ffd23a', 140, 3);
    }else if(it.k === 'power'){ startPower(it.p, b); ring(it.x, it.y, POWERS[it.p].col, 90); }
  }
  // the flood
  if(b.y + r > G.doom && !G.pw.rocket){ b.shield = false; b.inv = 0; hurt(b, true); }
}
function onBounce(b, s){
  G.run.bounce++; if(!G.demo) save.stats.bounce++;
  bumpCombo();
  if(!G.demo) AU.bounce(G.combo);
  if(!(G.pw.rainbow || s.rainbow)) breakStroke(s, true);
  ring(b.x, b.y, inkCol(s), 40);
  if(G.combo >= 5 && G.combo % 5 === 0) floatText('x' + comboMult().toFixed(1).replace('.0', '') + ' COMBO!', b.x, b.y - 50, '#7dffea', 1);
  G.run.score += 2;
}
function bumpCombo(){
  G.combo++; G.comboT = 2.6 * (1 + (G.cards.combo || 0));
  G.run.maxCombo = Math.max(G.run.maxCombo, G.combo);
}
function addScore(v, x, y, col, pre){ G.run.score += v; floatText((pre || '+') + v, x, y, col, 0.7); }
function explode(hz, b){
  hz.dead = true;
  if(!G.demo) AU.smash(); G.shake = 14; G.flash = 0.35; G.flashC = '#fff2c4';
  burst(hz.x, hz.y, 40, '#ff8a3a', 520, 7); ring(hz.x, hz.y, '#ffb13a', 200);
  for(const h of G.haz) if(!h.dead && h.k !== 'spike' && h.k !== 'laser' && Math.hypot(h.x - hz.x, h.y - hz.y) < 220){ h.dead = true; G.run.smash++; if(!G.demo) save.stats.smash++; burst(h.x, h.y, 14, '#2b2a4a', 300, 5); }
  const dx = b.x - hz.x, dy = b.y - hz.y, d = Math.hypot(dx, dy) || 1;
  b.vx = dx / d * 700; b.vy = Math.min(-300, dy / d * 700);
  addScore(60, hz.x, hz.y - 40, '#ffb13a', 'BOOM! ');
}
function hurt(b, flood){
  if(b.inv > 0) return;
  if(b.shield && !flood){
    b.shield = false; b.inv = 1.2; b.vy = -600;
    if(!G.demo) AU.pop(); ring(b.x, b.y, '#9fe6ff', 90); floatText('BUBBLE SAVED YOU!', b.x, b.y - 50, '#9fe6ff', 0.9);
    return;
  }
  b.dead = true;
  if(!G.demo){ AU.hit(); }
  G.shake = 16;
  burst(b.x, b.y, 30, '#2b2a4a', 420, 6); burst(b.x, b.y, 16, '#ff6b6b', 300, 5);
  if(G.balls.some(x => !x.dead)) floatText('-1 BALL', b.x, b.y - 30, '#ff6b6b', 0.8);
}
function allDead(){
  if(G.state !== 'play') return;
  G.state = 'over'; G.overT = 0;
  AU.scribble(false, 0);
  setTimeout(() => UI.gameOver(), 700);
}
function revive(){
  const y = G.camY + G.viewH * 0.55;
  const b = newBall(WW / 2, y, 0, 0); b.shield = true; b.inv = 1.5;
  G.balls = [b];
  G.doom = y + 900;
  G.solids.push({ pad: true, ax: 120, ay: y + 120, bx: WW - 120, by: y + 120 });
  for(const h of G.haz) if(Math.abs((h.y != null ? h.y : h.y0) - y) < 500) h.dead = true;
  G.state = 'play'; G.revived = true;
  ring(b.x, b.y, '#ff7ab8', 140); AU.power();
  flashText('💖 BACK IN!', '#ff7ab8');
}
/* coins earned by a run */
function runCoins(){ const r = G.run; return r.coins + Math.floor(r.stars / 3) + Math.floor(r.depth / 10); }

/* ---------------- autopilot (title demo + tests + trailer) ---------------- */
const AP = { cd: 0 };
function autopilot(dt){
  AP.cd -= dt;
  const b = mainBall(); if(!b || AP.cd > 0 || b.vy < 150) return;
  const below = G.strokes.some(s => s.live && s.pts.some(p => p.y > b.y && p.y < b.y + 260 && Math.abs(p.x - (b.x + b.vx * 0.15)) < 110));
  if(below) return;
  // look ahead: where would a straight fall hit trouble, and where are the goodies?
  const look0 = b.y - 700, look1 = b.y - 40;
  const danger = x => {
    let s = 0;
    for(const h of G.haz){
      if(h.dead) continue;
      if(h.k === 'laser'){ if(h.y > look0 && h.y < look1 && x > h.a0 - 40 && x < h.a1 + 40 && !(h.blink && ((G.t + h.ph) % 3) >= 2)) s += 3; }
      else if(h.k === 'spike'){ if(h.y1 > look0 && h.y0 < look1 && (h.left ? x < 110 : x > WW - 110)) s += 2; }
      else if(h.y > look0 && h.y < look1 && Math.abs(h.x - x) < h.r + 60) s += h.k === 'bomb' ? -0.5 : 3;
    }
    return s;
  };
  const good = x => { let s = 0; for(const it of G.items) if(!it.dead && it.y > look0 && it.y < look1 && Math.abs(it.x - x) < 70) s += it.k === 'power' ? 3 : it.k === 'card' ? 4 : it.k === 'star' ? 1 : 0.5; return s; };
  let best = b.x, bs = -1e9;
  for(let i = 0; i <= 10; i++){
    const x = 50 + i * (WW - 100) / 10;
    const s = good(x) - danger(x) * 3 - Math.abs(x - b.x) / 400;
    if(s > bs){ bs = s; best = x; }
  }
  const straightBad = danger(b.x) > 0;
  const gap = b.y - G.doom;
  if(!straightBad && Math.abs(best - b.x) < 60 && gap > 500 && Math.random() < 0.6){ AP.cd = 0.25; return; }
  const ly = b.y + 70 + b.vy * 0.1;
  // aim where the ball will be when it reaches the line, not where it is now
  const th = (ly - b.y) / Math.max(200, b.vy);
  let px = b.x + b.vx * th;
  if(px < BR) px = 2 * BR - px; if(px > WW - BR) px = 2 * (WW - BR) - px;
  px = clamp(px, 40, WW - 40);
  const tilt = -clamp((best - px) / 320 + b.vx / 2400, -0.75, 0.75);
  const a = tilt, half = 85;
  const x0 = px - Math.cos(a) * half, y0 = ly - Math.sin(a) * half, x1 = px + Math.cos(a) * half, y1 = ly + Math.sin(a) * half;
  strokeStart(x0, y0);
  for(let k = 1; k <= 8; k++) strokeMove(lerp(x0, x1, k / 8), lerp(y0, y1, k / 8));
  strokeEnd();
  AP.cd = 0.3;
}

/* ---------------- effects ---------------- */
function burst(x, y, n, col, sp, sz){
  for(let i = 0; i < n; i++){ const a = Math.random() * TAU, v = sp * (0.3 + Math.random() * 0.7); G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.35 + Math.random() * 0.35, c: col, sz: sz * (0.6 + Math.random() * 0.8) }); }
}
function ring(x, y, col, r){ G.rings.push({ x, y, col, r, life: 0, max: 0.4 }); }
function confetti(x, y, n){
  const cols = ['#ff4f8b', '#ffd24a', '#4dffb0', '#5a8cff', '#ff8a3a', '#b98cff'];
  for(let i = 0; i < n; i++){ const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 300 + Math.random() * 500; G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 1.2 + Math.random(), c: cols[i % cols.length], sz: 5, g: 900, sq: true }); }
}
function floatText(txt, x, y, col, size){ if(G.demo) return; if(G.texts.length > 30) G.texts.splice(G.texts.findIndex(t => !t.stay), 1); G.texts.push({ txt, x, y, col, size: size || 1, life: 0, max: 1 }); }
function flashText(txt, col, sub){ if(G.demo) return; UI.banner(txt, sub || '', col); }
