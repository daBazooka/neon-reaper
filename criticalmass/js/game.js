'use strict';
/* =====================================================================
   CRITICAL MASS simulation.
   Atoms drift in a chamber. You get one tap (more with upgrades). Your
   blast pops the atoms it touches; every popped atom blasts too. One
   good tap can wipe the whole screen.
   ===================================================================== */
const G = {
  state:'title', mode:'level', spec:null, W:960, H:600,
  atoms:[], blasts:[], shards:[], zaps:[], parts:[], pops:[], rings:[], pend:[], core:null,
  taps:1, tapsLeft:1, chain:0, popped:0, total:0, goal:0, energyRun:0, t:0, rt:0,
  slowT:0, shake:0, flash:0, bid:1, endT:0, milestone:0, lastPopT:0,
  // endless
  meter:0, spawnAcc:0, charge:0, score:0,
};
const tmp = [];

const lvlVal = lv => Math.pow(1.075, lv - 1);
const valMul = () => Math.pow(1.22, save.up.value);
function popValue(type){ return ATOMS[type].val * lvlVal(G.spec ? G.spec.lv : 1) * valMul() * (G.mode === 'daily' ? 3 : 1); }

/* ---------------- round setup ---------------- */
function mkAtom(type, x, y, spd){
  const d = ATOMS[type], a = rnd(0, TAU), s = spd * rnd(.6, 1.2);
  return { type, x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, r:d.r, hp:d.hp || 1, alive:true, ph:rnd(0, TAU), immune:0, pull:null };
}
function startLevel(lv, mode){
  const spec = levelSpec(lv), R = mulberry32(spec.seed ^ (mode === 'daily' ? hashStr(todayKey()) : 0));
  resetRound(); G.mode = mode || 'level'; G.spec = spec;
  const luck = 1 + save.up.luck * .1, m = 60;
  const pickType = () => {
    const r = R();
    if(r < .02 * luck && lv >= ATOMS.gold.from) return 'gold';
    if(r < .028 * luck && lv >= ATOMS.nuke.from) return 'nuke';
    if(spec.pool.length && r < .3 * luck) return spec.pool[(R() * spec.pool.length) | 0];
    return 'basic';
  };
  // later levels group atoms into islands with empty space between them
  const cen = spec.boss ? [{ x:G.W / 2, y:G.H / 2 }] : [];
  for(let k = 0; k < spec.clusters; k++){ let best = null, bd = -1; for(let tries = 0; tries < 12; tries++){ const c = { x:m + 40 + R() * (G.W - m * 2 - 80), y:m + 40 + R() * (G.H - m * 2 - 80) }; const d = cen.length ? Math.min(...cen.map(o => Math.hypot(o.x - c.x, o.y - c.y))) : 1e9; if(d > bd){ bd = d; best = c; } } cen.push(best); }
  for(let i = 0; i < spec.count; i++){
    const t = pickType(); let x, y;
    if(spec.boss && R() < .4){ const an = R() * TAU, rr = 78 + R() * 70; x = G.W / 2 + Math.cos(an) * rr; y = G.H / 2 + Math.sin(an) * rr; }
    else if(cen.length && R() < spec.spread){ const c = cen[(R() * cen.length) | 0], an = R() * TAU, rr = Math.sqrt(R()) * 75; x = clamp(c.x + Math.cos(an) * rr, m * .5, G.W - m * .5); y = clamp(c.y + Math.sin(an) * rr, m * .5, G.H - m * .5); }
    else { x = m + R() * (G.W - m * 2); y = m + R() * (G.H - m * 2); }
    G.atoms.push(mkAtom(t, x, y, spec.speed));
  }
  for(let i = 0; i < spec.voids; i++) G.atoms.push(mkAtom('void', m + R() * (G.W - m * 2), m + R() * (G.H - m * 2), spec.speed * .5));
  if(spec.boss) G.core = { x:G.W / 2, y:G.H / 2, r:58, hp:spec.coreHp, max:spec.coreHp, hitBy:new Set(), hurt:0, dead:false };
  G.total = G.atoms.filter(a => a.type !== 'void').length;
  // a losing streak on one level lowers its goal a little each time
  G.mercy = G.mode === 'level' && save.streak.lv === lv ? Math.min(8, save.streak.n) : 0;
  G.goal = Math.ceil(spec.goal * (1 - .06 * G.mercy));
  G.taps = G.tapsLeft = 1 + save.up.extra;
  G.state = 'aim';
  for(const a of G.atoms) if(!save.seen[a.type]){ save.seen[a.type] = 1; G.newAtom = a.type; }
}
function startEndless(){
  resetRound(); G.mode = 'endless'; G.spec = { lv:Math.max(5, save.maxLevel), world:4, boss:false, pool:ATOM_IDS.filter(k => ATOMS[k].from <= Math.max(5, save.maxLevel) && !['basic', 'gold', 'nuke', 'void'].includes(k)), speed:40, react:.72 };
  for(let i = 0; i < 40; i++) spawnEndless();
  G.taps = 3; G.tapsLeft = 3; G.charge = 0; G.meter = 0; G.score = 0; G.state = 'run';
}
function spawnEndless(){
  const sp = G.spec, r = Math.random(), vo = Math.min(.2, Math.max(0, G.t - 20) / 500);
  const t = r < vo ? 'void' : r < vo + .03 ? 'gold' : r < vo + .045 ? 'nuke' : r < vo + .3 && sp.pool.length ? pick(sp.pool) : 'basic';
  const side = (Math.random() * 4) | 0, x = side === 0 ? 20 : side === 1 ? G.W - 20 : rnd(20, G.W - 20), y = side === 2 ? 20 : side === 3 ? G.H - 20 : rnd(20, G.H - 20);
  const a = mkAtom(t, x, y, sp.speed * (t === 'void' ? .5 : 1)); a.born = .4; G.atoms.push(a);
}
function resetRound(){
  Object.assign(G, { atoms:[], blasts:[], shards:[], zaps:[], parts:[], pops:[], rings:[], pend:[], core:null, chain:0, popped:0, energyRun:0, t:0, slowT:0, endT:0, milestone:0, newAtom:null, result:null, coreHits:0 });
}

/* ---------------- blasts ---------------- */
function addBlast(x, y, R, col, src, gen){
  const b = { id:G.bid++, x, y, r:0, R, col, t:0, grow:.2, hold:holdT(save.up.time) * (src === 'tap' ? 1.25 : 1) + (G.slowT > 0 ? .4 : 0), fade:.3, src, gen:gen || 0 };
  G.blasts.push(b);
  G.rings.push({ x, y, r:R * .3, R:R * 1.4, t:0, col });
  return b;
}
function tap(x, y){
  if(G.tapsLeft <= 0) return false;
  if(G.state !== 'aim' && G.state !== 'run') return false;
  G.tapsLeft--; G.state = 'run'; G.endT = 0;
  addBlast(x, y, tapR(save.up.tap), '#ffffff', 'tap', 0);
  AU.tap(); G.shake = Math.max(G.shake, 4);
  for(let i = 0; i < 18; i++){ const a = rnd(0, TAU), s = rnd(80, 300); G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, l:rnd(.3, .6), c:'#ffffff', s:rnd(2, 4) }); }
  return true;
}
function popAtom(a, via){
  if(!a.alive) return;
  if(a.type === 'void' && via !== 'zap') return;
  if(a.hp > 1){ a.hp--; a.immune = .35; a.crack = 1; AU.crack(); burst(a.x, a.y, '#ffffff', 8); return; }
  a.alive = false;
  const d = ATOMS[a.type];
  if(a.type !== 'void') G.popped++; G.chain++; G.lastPopT = G.t; save.stats.pops++;
  const endless = G.mode === 'endless', v = popValue(a.type) * (1 + Math.min(G.chain, endless ? 40 : 300) * .01) * (endless ? .12 : 1);
  G.energyRun += v; if(endless) G.score += Math.round(10 * (1 + Math.min(G.chain, 100) * .05));
  AU.pop(G.chain, a.type);
  burst(a.x, a.y, d.col, a.type === 'nuke' ? 40 : 12);
  if(a.type === 'gold'){ pop('+' + fmt(v), a.x, a.y - 16, '#ffd23c', 18); for(let i = 0; i < 16; i++) G.parts.push({ x:a.x, y:a.y, vx:rnd(-80, 80), vy:rnd(-200, -60), g:300, l:rnd(.6, 1), c:'#ffd23c', s:rnd(2, 4), k:'star' }); }
  // milestones
  const ms = [10, 25, 50, 100, 150, 200, 300];
  for(const m of ms) if(G.chain === m){ G.milestone = m; milestoneFx(m); }
  // the atom's own reaction, a heartbeat later
  const crit = Math.random() < save.up.crit * .015;
  if(d.blast > 0) G.pend.push({ t:.05, fn:() => { const b = addBlast(a.x, a.y, 56 * (G.spec.react || 1) * d.blast * blastMul(save.up.size) * (crit ? 2 : 1), d.col, a.type, 1); if(crit) pop('CRIT!', a.x, a.y - 20, '#ffffff', 14); } });
  switch(a.type){
    case 'split': for(let k = 0; k < 3; k++){ const an = rnd(0, TAU) + k * TAU / 3; G.shards.push({ x:a.x, y:a.y, vx:Math.cos(an) * 300, vy:Math.sin(an) * 300, t:0, col:d.col }); } break;
    case 'magnet': for(const o of G.atoms){ if(!o.alive || o === a) continue; const dx = a.x - o.x, dy = a.y - o.y, dd = Math.hypot(dx, dy); if(dd < 170 && dd > 1) o.pull = { x:a.x, y:a.y, t:.55 }; } G.rings.push({ x:a.x, y:a.y, r:170, R:10, t:0, col:d.col, inward:1 }); break;
    case 'zap': {
      const near = G.atoms.filter(o => o.alive && o !== a).map(o => [o, Math.hypot(o.x - a.x, o.y - a.y)]).filter(p => p[1] < 280).sort((p, q) => p[1] - q[1]).slice(0, 3);
      for(const [o] of near){ G.zaps.push({ x1:a.x, y1:a.y, x2:o.x, y2:o.y, t:0 }); G.pend.push({ t:.08, fn:() => { if(o.hp > 1) o.hp = 1; popAtom(o, 'zap'); } }); }
      if(near.length) AU.zap();
      break;
    }
    case 'time': G.slowT = 1.8; for(const b of G.blasts) b.hold += .5; AU.slow(); pop('SLOW-MO', a.x, a.y - 18, '#8ab4ff', 16); break;
    case 'nuke': G.shake = 14; G.flash = .5; AU.nuke(); break;
  }
}
function milestoneFx(m){
  G.shake = Math.max(G.shake, 6 + Math.min(12, m / 12)); G.flash = Math.max(G.flash, .18);
  AU.milestone(m);
  G.bigText = { txt:m >= 100 ? 'MELTDOWN ×' + m : m >= 50 ? 'CRITICAL ×' + m : 'CHAIN ×' + m, t:0 };
  if(m >= 50) G.slowT = Math.max(G.slowT, .6);
}
function burst(x, y, c, n){ const lim = save.opt.fx === 'low' ? 200 : 480; for(let i = 0; i < n && G.parts.length < lim; i++){ const a = rnd(0, TAU), s = rnd(60, 260); G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, l:rnd(.25, .6), c, s:rnd(1.5, 3.5) }); } }
function pop(txt, x, y, c, s){ G.pops.push({ txt, x, y, c, s:s || 16, t:0, d:.9 }); if(G.pops.length > 40) G.pops.shift(); }

/* ---------------- update ---------------- */
function update(rdt){
  G.rt += rdt;
  if(G.slowT > 0) G.slowT -= rdt;
  const dt = rdt * (G.slowT > 0 ? .42 : 1);
  G.t += dt;
  if(G.bigText){ G.bigText.t += rdt; if(G.bigText.t > 1.3) G.bigText = null; }
  // atoms drift and bounce
  for(const a of G.atoms){
    if(!a.alive) continue;
    if(a.born > 0) a.born -= dt;
    if(a.immune > 0) a.immune -= dt;
    if(a.pull){ a.pull.t -= dt; const dx = a.pull.x - a.x, dy = a.pull.y - a.y, d = Math.hypot(dx, dy) || 1; a.x += dx / d * 220 * dt; a.y += dy / d * 220 * dt; if(a.pull.t <= 0) a.pull = null; }
    a.x += a.vx * dt; a.y += a.vy * dt; a.ph += dt * 3;
    if(a.x < a.r){ a.x = a.r; a.vx = Math.abs(a.vx); } if(a.x > G.W - a.r){ a.x = G.W - a.r; a.vx = -Math.abs(a.vx); }
    if(a.y < a.r){ a.y = a.r; a.vy = Math.abs(a.vy); } if(a.y > G.H - a.r){ a.y = G.H - a.r; a.vy = -Math.abs(a.vy); }
    if(G.core && !G.core.dead){ const c = G.core, dx = a.x - c.x, dy = a.y - c.y, d = Math.hypot(dx, dy); if(d < c.r + a.r && d > .1){ a.x = c.x + dx / d * (c.r + a.r); a.y = c.y + dy / d * (c.r + a.r); const dot = a.vx * dx / d + a.vy * dy / d; a.vx -= 2 * dot * dx / d; a.vy -= 2 * dot * dy / d; } }
  }
  // pending reactions
  for(const p of G.pend){ p.t -= dt; if(p.t <= 0){ p.done = true; p.fn(); } }
  G.pend = G.pend.filter(p => !p.done);
  // blasts grow, hold, fade, and catch atoms
  for(const b of G.blasts){
    b.t += dt;
    const T = b.t; b.r = T < b.grow ? b.R * Math.sin(T / b.grow * Math.PI / 2) : T < b.grow + b.hold ? b.R : b.R * Math.max(0, 1 - (T - b.grow - b.hold) / b.fade);
    if(b.r <= 0 && T > b.grow){ b.done = true; continue; }
    for(const a of G.atoms){
      if(!a.alive || a.immune > 0 || a.born > 0) continue;
      const dx = a.x - b.x, dy = a.y - b.y, rr = b.r + a.r;
      if(dx * dx + dy * dy < rr * rr){
        if(a.type === 'void'){ if(!b.eaten){ b.eaten = true; b.t = Math.max(b.t, b.grow + b.hold); b.fade = .12; G.rings.push({ x:a.x, y:a.y, r:a.r * 3, R:a.r, t:0, col:'#ff2e6a', inward:1 }); AU.swallow(); } continue; }
        popAtom(a, 'blast');
      }
    }
    if(G.core && !G.core.dead && !G.core.hitBy.has(b.id)){ const c = G.core, d = Math.hypot(c.x - b.x, c.y - b.y); if(d < b.r + c.r){ c.hitBy.add(b.id); G.coreHits = (G.coreHits || 0) + 1; hitCore(1, b.x, b.y); } }
  }
  G.blasts = G.blasts.filter(b => !b.done);
  // shards
  for(const s of G.shards){
    s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
    if(s.x < 0 || s.x > G.W) s.vx *= -1; if(s.y < 0 || s.y > G.H) s.vy *= -1;
    let hit = s.t > .5;
    if(!hit) for(const a of G.atoms){ if(a.alive && a.type !== 'void' && Math.hypot(a.x - s.x, a.y - s.y) < a.r + 6){ hit = true; break; } }
    if(hit){ s.done = true; addBlast(s.x, s.y, 30 * (G.spec.react || 1) * blastMul(save.up.size), s.col, 'shard', 2); }
  }
  G.shards = G.shards.filter(s => !s.done);
  for(const z of G.zaps) z.t += rdt; G.zaps = G.zaps.filter(z => z.t < .25);
  for(const r of G.rings) r.t += rdt; G.rings = G.rings.filter(r => r.t < .45);
  for(const p of G.parts){ p.x += p.vx * dt; p.y += p.vy * dt; if(p.g) p.vy += p.g * dt; p.vx *= .96; p.vy *= p.g ? 1 : .96; p.l -= dt; }
  G.parts = G.parts.filter(p => p.l > 0);
  for(const p of G.pops){ p.t += rdt; p.y -= 30 * rdt; } G.pops = G.pops.filter(p => p.t < p.d);
  if(G.core && G.core.hurt > 0) G.core.hurt -= dt;
  G.atoms = G.atoms.filter(a => a.alive);
  G.shake *= Math.pow(.015, rdt); if(G.flash > 0) G.flash = Math.max(0, G.flash - rdt * 2);
  // endless: atoms keep flooding in; taps recharge
  if(G.mode === 'endless' && G.state === 'run'){
    G.spawnAcc += dt * (1.4 + G.t / 25); while(G.spawnAcc >= 1){ G.spawnAcc--; spawnEndless(); }
    if(G.tapsLeft < 3){ G.charge += dt / 3.2; if(G.charge >= 1){ G.charge = 0; G.tapsLeft++; AU.charge(); } }
    const cap = 150;
    const load = G.atoms.length + G.atoms.filter(a => a.type === 'void').length * 2; G.load = load / cap;
    G.meter = clamp(G.meter + (load > cap * .75 ? (load / cap - .75) * dt * 1.2 : -dt * .08), 0, 1);
    if(G.meter >= 1){ G.state = 'done'; G.endT = 0; finishEndless(); }
    if(G.blasts.length === 0 && G.pend.length === 0 && G.shards.length === 0) G.chain = 0;
    return;
  }
  // level rounds end when everything is quiet
  if(G.state === 'run'){
    const active = G.blasts.length || G.pend.length || G.shards.length;
    const cleared = G.atoms.every(a => a.type === 'void') && (!G.core || G.core.dead);
    if(!active){
      G.endT += rdt;
      if(cleared || (G.tapsLeft <= 0 && G.endT > .5) || (G.core && G.core.dead && G.endT > .6)){ G.state = 'done'; finishLevel(); }
      else if(G.tapsLeft > 0 && G.endT > .25){ G.state = 'aim'; G.chain = 0; }
    } else G.endT = 0;
  }
}
function hitCore(n, x, y){
  const c = G.core; c.hp -= n; c.hurt = .15; AU.coreHit(); burst(x + (c.x - x) * .5, y + (c.y - y) * .5, '#ff5ad9', 6);
  if(c.hp <= 0 && !c.dead){
    c.dead = true; G.flash = .8; G.shake = 18; G.slowT = 1; AU.coreDown();
    G.bigText = { txt:'CORE DESTROYED!', t:0 };
    addBlast(c.x, c.y, 260, '#ff5ad9', 'core', 1);
    for(let i = 0; i < 80; i++){ const a = rnd(0, TAU), s = rnd(100, 500); G.parts.push({ x:c.x, y:c.y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, l:rnd(.5, 1.2), c:pick(['#ff5ad9', '#ffffff', '#ffd23c']), s:rnd(2, 5) }); }
    save.stats.bosses++;
  }
}

/* ---------------- results ---------------- */
function starsFor(){
  if(G.core) return !G.core.dead ? 0 : 1 + (G.popped >= G.total * .6 ? 1 : 0) + (G.popped >= G.total ? 1 : 0);
  if(G.popped < G.goal) return 0;
  return 1 + (G.popped >= G.goal + (G.total - G.goal) * .5 ? 1 : 0) + (G.popped >= G.total ? 1 : 0);
}
function finishLevel(){
  const st = starsFor(), lv = G.spec.lv, win = st > 0;
  const bonus = st * 12 * lvlVal(lv) * valMul() * (G.mode === 'daily' ? 3 : 1);
  const total = G.energyRun + bonus;
  save.energy += total; save.earned += total; save.stats.rounds++;
  if(G.popped >= G.total && !G.core) save.stats.melts++;
  const newBest = G.chain > save.best.chain; save.best.chain = Math.max(save.best.chain, G.popped);
  const prevStars = save.stars[lv] || 0;
  if(G.mode === 'level'){
    if(win) save.streak = { lv:0, n:0 }; else save.streak = { lv, n:save.streak.lv === lv ? save.streak.n + 1 : 1 };
    if(win){ save.stars[lv] = Math.max(prevStars, st); if(lv === save.level){ save.level++; save.maxLevel = Math.max(save.maxLevel, save.level); } }
  } else if(G.mode === 'daily'){ save.daily.done = true; }
  G.result = { win, st, energy:total, runE:G.energyRun, bonus, popped:G.popped, total:G.total, goal:G.goal, chain:G.popped, melt:G.popped >= G.total && !G.core, newStar:win && st > prevStars, boss:!!G.core };
  if(st === 3 || (G.core && G.core.dead) || (G.result.melt)) SDK.happytime();
  persist();
  setTimeout(() => showResult(), G.result.melt ? 900 : 650);
}
function finishEndless(){
  const e = G.energyRun; save.energy += e; save.earned += e;
  const best = G.score > save.best.endless; save.best.endless = Math.max(save.best.endless, G.score);
  G.result = { endless:true, score:G.score, best, energy:e };
  if(best) SDK.happytime();
  persist(); AU.overload();
  setTimeout(() => showResult(), 900);
}
