'use strict';
/* =====================================================================
   WOBBLE BOW: the duel. Fixed 120 Hz simulation.
   ===================================================================== */
const DT = 1 / 120;
const G = {
  state:'idle', mode:'campaign', lv:null, t:0, fighters:[], arrows:[], stuck:[], orbs:[], obst:[], pillars:[],
  parts:[], texts:[], rings:[], booms:[], shake:0, flash:0, flashC:'#fff', slow:1, slowT:0, zoom:null,
  endT:0, result:null, orbT:6, wave:0, tut:false, firstShot:false, stats:null, hitTaken:false, demo:false,
  pin:{}, keys:{}, cam:null,
};
const MAXV = 1500, MINV = 420;

function makeFighter(o){
  const sc = o.sc || 1, f = {
    side:o.side, human:o.human || null, name:o.name || '', type:o.type || 'basic', px0:o.x, ax:o.x, avx:0, top:o.top, half:o.half,
    alive:true, falling:false, hp:o.hp, maxHp:o.hp, dmg:o.dmg, rel:o.rel, relT:o.side === 0 ? .2 : 1.6 + Math.random() * .6, draw:0, drawing:false,
    aim:o.side === 0 ? -.35 : Math.PI + .35, aimTo:0, vTo:0, face:o.side === 0 ? 1 : -1, grip:o.grip || 0, shield:!!o.shield, helmet:o.helmet ? 3 : 0,
    bomb:!!o.bomb, regen:o.regen || 0, err:o.err || .05, shots:0, buff:null, sticks:[], hat:o.hat || 'none', shirt:o.shirt, pants:o.pants,
    skin:o.skin || '#ffd9b0', hitT:0, lean:0, boss:!!o.boss, koT:0,
  };
  f.body = makeBody(f.ax, f.top, f.face, sc);
  return f;
}

/* ---------------- setting up a fight ---------------- */
function playerStats(){
  const u = save.up;
  return { hp:pHP(u.hp), dmg:pDmg(u.dmg), rel:pRel(u.draw), grip:1 - pGrip(u.grip) };
}
function startBattle(mode, idx, carry){
  const portrait = innerWidth < innerHeight;
  G.mode = mode; G.state = 'fight'; G.t = 0; G.endT = 0; G.result = null; G.arrows = []; G.stuck = []; G.orbs = []; G.parts = []; G.texts = []; G.rings = []; G.booms = [];
  G.slow = 1; G.slowT = 0; G.zoom = null; G.flash = 0; G.orbT = 5; G.hitTaken = false; G.pin = {};
  G.stats = { heads:0, hits:0, ringouts:0, orbs:0, shots:0 };
  let lv;
  if(mode === 'campaign') lv = levelDef(idx, portrait);
  else if(mode === 'arena'){ G.wave = idx; lv = levelDef(Math.min(59, Math.floor(idx * 1.6) + (idx % 10 === 9 ? 0 : 0)), portrait); lv = arenaTweak(lv, idx); }
  else { lv = levelDef(10 * Math.floor(Math.random() * 6) + 2 + Math.floor(Math.random() * 6), portrait); lv.enemies = lv.enemies.slice(0, 1); }
  G.lv = lv;
  const ps = playerStats();
  const fs = [];
  if(mode === 'duo'){
    fs.push(makeFighter({ side:0, human:'p1', name:'P1', x:0, top:0, half:70, hp:220, dmg:26, rel:.85, shirt:'#ff7a2a', pants:'#3a4a7a', hat:'band' }));
    const e = lv.enemies[0];
    fs.push(makeFighter({ side:1, human:'p2', name:'P2', x:e.dx, top:e.dy, half:70, hp:220, dmg:26, rel:.85, shirt:'#3aa0ff', pants:'#4a3a2a', hat:'cap', skin:'#e8b88a' }));
  } else {
    fs.push(makeFighter({ side:0, human:'p1', name:'YOU', x:0, top:0, half:lv.phalf, hp:carry ? carry.hp : ps.hp, dmg:ps.dmg, rel:ps.rel, grip:ps.grip, shirt:'#ff7a2a', pants:'#3a4a7a', hat:save.hat }));
    if(carry) fs[0].maxHp = ps.hp;
    for(const e of lv.enemies){
      const T = ETYPES[e.t];
      fs.push(makeFighter({ side:1, name:T.name, type:e.t, x:e.dx, top:e.dy, half:e.half, hp:e.hp, dmg:e.dmg, rel:e.rel, err:e.err, sc:T.sc, grip:T.grip, shield:T.shield, helmet:T.helmet, bomb:e.bomb, regen:T.regen, shirt:T.shirt, pants:T.pants, boss:T.boss,
        hat:{ giant:'viking', king:'crown', medic:'band', bomber:'cap', heavy:'none', shield:'none', quick:'band', basic:pick(['none', 'cap', 'none']) }[e.t], skin:pick(['#ffd9b0', '#e8b88a', '#c68a5a', '#ffe0c4']) }));
    }
  }
  G.fighters = fs;
  G.pillars = fs.map(f => ({ x0:f.px0 - f.half, x1:f.px0 + f.half, y0:f.top }));
  G.obst = lv.obst.map(o => Object.assign({ x0:o.x }, o));
  G.tut = !G.demo && mode === 'campaign' && idx === 0 && save.tut < 1;
  G.firstShot = false;
  // settle the bodies
  for(const f of fs) for(let i = 0; i < 30; i++) stepBody(f, DT, G.pillars);
  computeCam();
}
function arenaTweak(lv, wave){
  lv.enemies = lv.enemies.slice(0, wave % 5 === 4 ? 2 : 1).map(e => Object.assign(e, { hp:Math.round(e.hp * (.8 + wave * .03)) }));
  if(wave % 10 === 9) lv.enemies = [Object.assign(lv.enemies[0], { t:pick(['giant', 'king']), hp:lv.enemies[0].hp * 3.5 })];
  return lv;
}
function computeCam(){
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for(const f of G.fighters){ x0 = Math.min(x0, f.px0); x1 = Math.max(x1, f.px0); y0 = Math.min(y0, f.top); y1 = Math.max(y1, f.top); }
  for(const o of G.obst){ y0 = Math.min(y0, o.y - 20); }
  const m = innerWidth < innerHeight ? 105 : 190;
  G.cam = { x0:x0 - m, x1:x1 + m, y0:y0 - 300, y1:y1 + 170 };
}

/* ---------------- shooting ---------------- */
function bowPos(f){ const p = f.body.pts[8]; return [p.x, p.y]; }
function fire(f, aim, v){
  const [x, y] = bowPos(f);
  const b = f.buff;
  const spreads = b && b.k === 'triple' ? [-.06, 0, .06] : [0];
  for(const s of spreads){
    const a = aim + s;
    G.arrows.push({ x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v, own:f, dmg:f.dmg, kind:b && (b.k === 'fire' || b.k === 'heavy') ? b.k : (f.bomb ? 'bomb' : 'n'), t:0 });
  }
  if(b){ b.n--; if(b.n <= 0) f.buff = null; }
  f.draw = 0; f.drawing = false; f.relT = f.rel * (f.human ? 1 : rnd(.85, 1.2)); f.shots++;
  kick(f.body, 10, -Math.cos(aim) * 120, -Math.sin(aim) * 120, DT);
  if(f.human === 'p1' && G.mode !== 'duo'){ G.stats.shots++; if(!G.firstShot){ G.firstShot = true; if(G.tut){ G.tut = false; save.tut = 1; persist(); } } }
  if(typeof AU !== 'undefined') AU.twang(v / MAXV);
}
const speedFor = p => MINV + (MAXV - MINV) * p;
function clampAim(f, a){
  const c = Math.cos(a), s = Math.sin(a);
  if(c * f.face < .08) return Math.atan2(s < 0 ? -1 : 1, .08 * f.face);
  return a;
}

/* ballistic solve: angle to hit (tx,ty) from (ox,oy) at speed v. hi: lob. null if out of range */
function solve(ox, oy, tx, ty, v, hi){
  const X = Math.abs(tx - ox), Y = oy - ty, g = GRAV, sgn = Math.sign(tx - ox) || 1;
  const disc = v ** 4 - g * (g * X * X + 2 * Y * v * v);
  if(disc < 0) return null;
  const th = Math.atan((v * v + (hi ? 1 : -1) * Math.sqrt(disc)) / (g * X));
  return Math.atan2(-Math.sin(th), Math.cos(th) * sgn);
}
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / .5;
/* would an arrow fired now hit an obstacle or a pillar before reaching x = tx? (moving clouds are predicted) */
function pathClear(ox, oy, a, v, tx){
  let x = ox, y = oy, vx = Math.cos(a) * v, vy = Math.sin(a) * v, t = 0;
  const dir = Math.sign(tx - ox), dt = 1 / 60;
  while(t < 4 && (tx - x) * dir > 14){
    vy += GRAV * dt; x += vx * dt; y += vy * dt; t += dt;
    for(const o of G.obst){ const ox2 = o.mv ? o.x0 + Math.sin((G.t + t) * o.mv / 120) * 120 : o.x; if(x > ox2 - o.w / 2 - 6 && x < ox2 + o.w / 2 + 6 && y > o.y - 6 && y < o.y + o.h + 6) return false; }
    for(const p of G.pillars) if(x > p.x0 && x < p.x1 && y > p.y0 - 4 && (tx - p.x1) * dir > 60 && (p.x0 - ox) * dir > 60) return false;
    if(y > 1200) return false;
  }
  return true;
}
function aiPlan(f, tgt, skill, head){
  const hd = head || tgt.shield, c = tgt.body.pts[hd ? 0 : 1], [ox, oy] = bowPos(f);
  const tx = c.x + rnd(-6, 6), ty = c.y + (hd ? rnd(-6, 2) : rnd(-14, 10));
  const X = Math.abs(tx - ox), Y = oy - ty, minV = Math.sqrt(GRAV * (Y + Math.hypot(X, Y)));
  let best = null;
  for(const [k, hi] of [[1.3, false], [1.12, false], [1.55, false], [1.04, true], [1.25, true]]){
    const v = clamp(minV * k, MINV, MAXV), a = solve(ox, oy, tx, ty, v, hi);
    if(a === null) continue;
    if(!best) best = { a, v, clear:false };
    if(pathClear(ox, oy, a, v, tx)){ best = { a, v, clear:true }; break; }
  }
  if(!best) best = { a:f.face > 0 ? -.8 : Math.PI + .8, v:MAXV, clear:false };
  const e = skill === undefined ? Math.max(f.err, .16 * Math.pow(.62, f.shots)) : skill;
  return { a:best.a + e * gauss(), v:best.v * (1 + e * .35 * gauss()), clear:best.clear };
}
function aiUpdate(f, dt){
  const tgt = G.fighters.find(o => o.side !== f.side && o.alive);
  if(!tgt) return;
  if(G.tut && !G.firstShot && G.t < 7){ f.relT = Math.max(f.relT, .5); }
  if(!f.drawing){
    if(f.relT <= 0){ const p = aiPlan(f, tgt); if(!p.clear && Math.random() < .8){ f.relT = .25; return; } f.aimTo = p.a; f.vTo = p.v; f.drawing = true; f.draw = 0; }
  } else {
    f.draw = Math.min(1, f.draw + dt / .55);
    f.aim += (f.aimTo - f.aim) * Math.min(1, dt * 10);
    if(f.draw >= 1) fire(f, f.aimTo, f.vTo);
  }
}

/* ---------------- human input (pointer drag or held key) ---------------- */
function humanUpdate(f, dt){
  const p = G.pin[f.human];
  if(!p) { f.drawing = false; f.draw = Math.max(0, f.draw - dt * 4); return; }
  if(p.key){
    p.sw = (p.sw || 0) + dt * 1.3;
    const lo = -1.25, hi = .3, u = (Math.sin(p.sw - Math.PI / 2) + 1) / 2, el = lerp(hi, lo, u);
    f.aim = f.face > 0 ? el : Math.PI - el;
    p.power = .9;
  } else {
    const dx = p.sx - p.cx, dy = p.sy - p.cy, d = Math.hypot(dx, dy);
    p.power = clamp(d / (Math.min(innerWidth, innerHeight) * .32), 0, 1);
    if(d > 6) f.aim = clampAim(f, Math.atan2(dy, dx));
  }
  f.drawing = true;
  f.draw = f.relT > 0 ? Math.min(f.draw, .15) : lerp(f.draw, p.power, Math.min(1, dt * 14));
}
function humanRelease(id){
  const p = G.pin[id]; delete G.pin[id];
  const f = G.fighters.find(x => x.human === id);
  if(!p || !f || !f.alive || G.state !== 'fight') return;
  if(f.relT > 0 || p.power < .12){ f.drawing = false; f.draw = 0; if(f.relT > 0 && typeof AU !== 'undefined') AU.notReady(); return; }
  fire(f, f.aim, speedFor(p.power));
}

/* ---------------- main step ---------------- */
function update(rdt){
  if(G.state === 'idle') return;
  G.slowT = Math.max(0, G.slowT - rdt);
  const target = G.slowT > 0 ? .28 : 1;
  G.slow += (target - G.slow) * Math.min(1, rdt * 8);
  G.acc = (G.acc || 0) + Math.min(.05, rdt) * G.slow;
  while(G.acc >= DT){ G.acc -= DT; step(DT); }
  G.shake = Math.max(0, G.shake - rdt * 30); G.flash = Math.max(0, G.flash - rdt * 2.5);
  updateFx(rdt);
}
function step(dt){
  G.t += dt;
  for(const f of G.fighters){
    if(f.alive){
      f.relT -= dt; f.hitT = Math.max(0, f.hitT - dt);
      if(f.regen && f.hp < f.maxHp && f.hitT <= 0 && G.t - (f.lastHit || -9) > 2.5) f.hp = Math.min(f.maxHp, f.hp + f.maxHp * f.regen * dt);
      if(G.state === 'fight'){
        if(f.human && !G.demo) humanUpdate(f, dt);
        else if(f.human && G.demo) aiUpdate(f, dt);
        else aiUpdate(f, dt);
      }
      // knockback slides the feet; walking back to the middle is slow
      f.ax += f.avx * dt; f.avx *= Math.exp(-5 * dt);
      if(Math.abs(f.avx) < 15){ const d = f.px0 - f.ax; f.ax += Math.sign(d) * Math.min(Math.abs(d), 7 * dt); }
      f.lean = clamp(f.avx * .25, -16, 16);
      if(Math.abs(f.ax - f.px0) > f.half + 3) ringOut(f);
    }
    stepBody(f, dt, G.pillars);
  }
  // obstacles
  for(const o of G.obst) if(o.mv){ o.x = o.x0 + Math.sin(G.t * o.mv / 120) * 120; }
  // orbs
  if(G.state === 'fight'){
    G.orbT -= dt;
    if(G.orbT <= 0 && G.orbs.length < 1){
      G.orbT = rnd(6, 9);
      const a = G.fighters[0], b = G.fighters[G.fighters.length > 1 ? 1 : 0];
      G.orbs.push({ x:lerp(a.px0, b.px0, rnd(.35, .65)), y:Math.min(a.top, b.top) - rnd(150, 300), k:pick(['heal', 'triple', 'fire', 'heavy']), t:0, r:24, bx:0 });
      G.orbs[G.orbs.length - 1].bx = G.orbs[G.orbs.length - 1].x;
    }
  }
  for(const o of G.orbs){ o.t += dt; o.x = o.bx + Math.sin(o.t * 1.3) * 40; }
  // arrows
  for(let i = G.arrows.length - 1; i >= 0; i--){
    const A = G.arrows[i];
    A.t += dt;
    const hx = A.x, hy = A.y;
    A.vy += GRAV * dt; A.x += A.vx * dt; A.y += A.vy * dt;
    if(A.kind === 'fire' && Math.random() < .5) G.parts.push({ x:A.x, y:A.y, vx:rnd(-30, 30), vy:rnd(-60, -10), life:0, max:.35, c:pick(['#ffb13a', '#ff5a2a', '#ffe07a']), sz:rnd(3, 6) });
    if(arrowHits(A, hx, hy)){ G.arrows.splice(i, 1); continue; }
    if(A.y > 1600 || A.t > 6) G.arrows.splice(i, 1);
  }
  // end of the fight
  if(G.state === 'fight'){
    const me = G.fighters.filter(f => f.side === 0), them = G.fighters.filter(f => f.side === 1);
    if(!me.some(f => f.alive)) endFight(G.mode === 'duo' ? 'p2' : 'lose');
    else if(!them.some(f => f.alive)) endFight(G.mode === 'duo' ? 'p1' : 'win');
  } else if(G.state === 'end'){
    G.endT += dt;
    if(G.endT > 1.7 && !G.endCalled){ G.endCalled = true; if(typeof UI !== 'undefined' && !G.demo) UI.fightOver(G.result); else if(G.demo) setTimeout(() => G.demo && startBattle('campaign', Math.floor(Math.random() * 30)), 300); }
  }
  for(const f of G.fighters) if(!f.alive && f.body.pts[1].y > 2400) f.gone = true;
}
function endFight(res){
  G.state = 'end'; G.result = res; G.endT = 0; G.endCalled = false;
  for(const f of G.fighters){ f.drawing = false; }
  G.pin = {};
}

/* returns true when the arrow is used up */
function arrowHits(A, hx, hy){
  const sub = 3;
  for(let s = 1; s <= sub; s++){
    const x = lerp(hx, A.x, s / sub), y = lerp(hy, A.y, s / sub);
    // power orbs
    for(let j = G.orbs.length - 1; j >= 0; j--){
      const o = G.orbs[j];
      if(Math.hypot(x - o.x, y - o.y) < o.r + 4){ G.orbs.splice(j, 1); takeOrb(A.own, o); }
    }
    // obstacles
    for(const o of G.obst){
      if(x > o.x - o.w / 2 && x < o.x + o.w / 2 && y > o.y && y < o.y + o.h){
        if(A.kind === 'bomb'){ boom(x, y, A); return true; }
        G.stuck.push({ x, y, a:Math.atan2(A.vy, A.vx), ob:o, ox:x - o.x, life:0, kind:A.kind }); trimStuck();
        burst(x, y, 6, o.k === 'cloud' ? '#ffffff' : '#a8784a', 120, 3);
        if(typeof AU !== 'undefined') AU.thunk(); return true;
      }
    }
    // fighters
    for(const f of G.fighters){
      if(f.side === A.own.side || f.gone || !f.alive) continue;
      if(f.shield && f.alive){
        const P = f.body.pts, sx = P[1].x + f.face * 24 * f.body.sc, sy0 = f.top - 92 * f.body.sc, sy1 = f.top - 28 * f.body.sc;
        if(Math.abs(x - sx) < 7 * f.body.sc && y > sy0 && y < sy1){
          if(A.kind === 'bomb'){ boom(x, y, A); return true; }
          f.sticks.push({ shield:true, ox:x - P[1].x, oy:y - P[1].y, a:Math.atan2(A.vy, A.vx) }); if(f.sticks.length > 18) f.sticks.shift();
          floatText('BLOCK', x, y - 20, '#cfe0ff', .9); burst(x, y, 8, '#cfe0ff', 160, 3); f.avx += Math.sign(A.vx) * 12 * (1 - f.grip);
          if(typeof AU !== 'undefined') AU.clang(); return true;
        }
      }
      const h = hitTest(f, x, y);
      if(h){ if(A.kind === 'bomb'){ boom(x, y, A); return true; } hitFighter(f, A, h, x, y); return true; }
    }
    // pillars and the ground
    for(const p of G.pillars){
      if(x > p.x0 && x < p.x1 && y > p.y0){
        if(A.kind === 'bomb'){ boom(x, p.y0, A); return true; }
        G.stuck.push({ x, y, a:Math.atan2(A.vy, A.vx), life:0, kind:A.kind }); trimStuck();
        burst(x, y, 5, '#b8a898', 100, 3); if(typeof AU !== 'undefined') AU.thunk(); return true;
      }
    }
  }
  return false;
}
function trimStuck(){ if(G.stuck.length > 50) G.stuck.shift(); }
function takeOrb(f, o){
  const lbl = { heal:'+HEALTH', triple:'TRIPLE SHOT', fire:'FIRE ARROWS', heavy:'MEGA ARROW' }[o.k];
  if(o.k === 'heal') f.hp = Math.min(f.maxHp, f.hp + f.maxHp * .3);
  else f.buff = { k:o.k, n:o.k === 'heavy' ? 1 : 3 };
  floatText(lbl, o.x, o.y - 30, ORB_COL[o.k], 1.2); burst(o.x, o.y, 22, ORB_COL[o.k], 300, 5); ring(o.x, o.y, ORB_COL[o.k], 60);
  if(f.side === 0 && f.human === 'p1' && G.mode !== 'duo') G.stats.orbs++;
  if(typeof AU !== 'undefined') AU.orb();
}
const ORB_COL = { heal:'#4ade6a', triple:'#3aa0ff', fire:'#ff7a2a', heavy:'#b46aff' };

function hitFighter(f, A, h, x, y){
  const P = f.body.pts, sh = SHAPES[h.s];
  let mult = { head:2.2, body:1, leg:.6, arm:.7 }[h.part];
  if(h.part === 'head' && f.helmet > 0){ f.helmet--; mult = 1.2; floatText('CLANG!', x, y - 26, '#ffe07a', 1); if(typeof AU !== 'undefined') AU.clang(); }
  if(A.kind === 'fire') mult *= 1.5;
  if(A.kind === 'heavy') mult *= 2.2;
  const spd = Math.hypot(A.vx, A.vy), dmg = Math.round(A.dmg * mult * (.75 + .25 * spd / MAXV));
  // stick the arrow in the bone it hit
  const ia = sh[0] === sh[1] ? 1 : sh[0], ib = sh[0] === sh[1] ? 0 : sh[1];
  const bx = P[ib].x - P[ia].x, by = P[ib].y - P[ia].y, ba = Math.atan2(by, bx), bl = Math.hypot(bx, by) || 1;
  const rx = x - P[ia].x, ry = y - P[ia].y, cs = Math.cos(-ba), sn = Math.sin(-ba);
  f.sticks.push({ ia, ib, u:(rx * cs - ry * sn) / bl, v:rx * sn + ry * cs, a:Math.atan2(A.vy, A.vx) - ba, fire:A.kind === 'fire' });
  if(f.sticks.length > 18) f.sticks.shift();
  // wobble: kick the body where it was hit
  const kx = A.vx * .32 * (A.kind === 'heavy' ? 2.5 : 1), ky = A.vy * .32;
  kick(f.body, sh[0], kx, ky, DT); if(sh[1] !== sh[0]) kick(f.body, sh[1], kx * .7, ky * .7, DT);
  kick(f.body, 1, kx * .4, ky * .3, DT);
  if(!f.alive){ burst(x, y, 6, '#ffffff', 120, 3); if(typeof AU !== 'undefined') AU.hit(0); return; }
  f.hp -= dmg; f.hitT = .25; f.lastHit = G.t;
  f.avx += Math.sign(A.vx) * (A.kind === 'heavy' ? 230 : 34) * (1 - f.grip);
  if(f.drawing && !f.human){ f.draw = Math.max(0, f.draw - .4); }
  const head = h.part === 'head' && mult >= 2.2;
  const byMe = A.own.side === 0 && G.mode !== 'duo';
  if(byMe){ G.stats.hits++; if(head) G.stats.heads++; }
  if(f.side === 0 && G.mode !== 'duo') G.hitTaken = true;
  floatText(head ? 'HEADSHOT!' : String(dmg), x, y - 24, head ? '#ffd23a' : '#ffffff', head ? 1.3 : .95);
  if(head) floatText(String(dmg), x, y - 2, '#ffffff', .8);
  burst(x, y, head ? 18 : 10, head ? '#ffd23a' : '#ffffff', head ? 260 : 180, 4); ring(x, y, '#ffffff', head ? 50 : 30);
  G.shake = Math.max(G.shake, head ? 9 : 5);
  if(A.kind === 'fire') burst(x, y, 14, '#ff7a2a', 200, 5);
  if(typeof AU !== 'undefined') AU.hit(head ? 2 : 1, f.side === 0);
  if(f.hp <= 0) ko(f, head ? 'head' : 'hp');
}
function boom(x, y, A){
  G.booms.push({ x, y, life:0 }); G.shake = 12; G.flash = .25; G.flashC = '#ffd27a';
  burst(x, y, 30, '#ffb13a', 360, 6); burst(x, y, 16, '#5a5a5a', 200, 8); ring(x, y, '#ffe0a0', 90);
  if(typeof AU !== 'undefined') AU.boom();
  for(const f of G.fighters){
    if(f.side === A.own.side || !f.alive) continue;
    const c = f.body.pts[1], d = Math.hypot(c.x - x, c.y - y);
    if(d > 110) continue;
    const k = 1 - d / 110, dmg = Math.round(A.dmg * 1.4 * k + A.dmg * .3);
    f.hp -= dmg; f.hitT = .25; f.avx += Math.sign(c.x - x || A.vx) * 160 * k * (1 - f.grip);
    for(let i = 0; i < 11; i++) kick(f.body, i, (f.body.pts[i].x - x) * 4 * k, -260 * k, DT);
    floatText(String(dmg), c.x, c.y - 40, '#ffb13a', 1);
    if(f.side === 0 && G.mode !== 'duo') G.hitTaken = true;
    if(f.hp <= 0) ko(f, 'hp');
  }
}
function ko(f, how){
  if(!f.alive) return;
  f.alive = false; f.hp = Math.max(0, f.hp); f.drawing = false; f.draw = 0;
  const c = f.body.pts[1];
  if(f.side === 1 && !G.fighters.some(o => o.side === 1 && o.alive)){ G.slowT = 1.1; G.zoom = { x:c.x, y:c.y - 40, t:0 }; }
  if(f.side === 0 && G.mode !== 'duo'){ G.slowT = .8; }
  floatText(how === 'ring' ? 'RING OUT!' : 'K.O.!', c.x, c.y - 70, how === 'ring' ? '#7df0ff' : '#ff5a6a', 1.6);
  if(typeof AU !== 'undefined') AU.ko(f.side === 0 && G.mode !== 'duo');
  for(let i = 0; i < 11; i++) kick(f.body, i, rnd(-80, 80), rnd(-200, -60), DT);
}
function ringOut(f){
  f.falling = true;
  if(f.side === 1 && G.mode !== 'duo') G.stats.ringouts++;
  kick(f.body, 1, Math.sign(f.ax - f.px0) * 200, -120, DT);
  ko(f, 'ring');
}

/* ---------------- effects ---------------- */
function updateFx(dt){
  for(let i = G.parts.length - 1; i >= 0; i--){ const p = G.parts[i]; p.life += dt; if(p.life >= p.max){ G.parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.vx *= .96; }
  if(G.parts.length > 600) G.parts.splice(0, G.parts.length - 600);
  for(let i = G.texts.length - 1; i >= 0; i--){ const t = G.texts[i]; t.life += dt; t.y -= dt * 40; if(t.life > t.max) G.texts.splice(i, 1); }
  for(let i = G.rings.length - 1; i >= 0; i--){ const r = G.rings[i]; r.life += dt; if(r.life > r.max) G.rings.splice(i, 1); }
  for(let i = G.booms.length - 1; i >= 0; i--){ const b = G.booms[i]; b.life += dt; if(b.life > .5) G.booms.splice(i, 1); }
  for(const s of G.stuck) s.life += dt;
  if(G.zoom) G.zoom.t += dt;
}
function burst(x, y, n, col, sp, sz){ for(let i = 0; i < n; i++){ const a = Math.random() * TAU, s = rnd(.2, 1) * sp; G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s - 60, life:0, max:rnd(.3, .7), c:col, sz:rnd(sz * .5, sz) }); } }
function ring(x, y, col, r){ G.rings.push({ x, y, col, r, life:0, max:.35 }); }
function floatText(txt, x, y, col, size){ G.texts.push({ txt, x, y, col, size:size || 1, life:0, max:1 }); if(G.texts.length > 20) G.texts.shift(); }
