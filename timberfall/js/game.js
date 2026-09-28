'use strict';
/* =====================================================================
   TIMBERFALL simulation
   Your axe swings by itself at whatever is in reach. Trees fall AWAY
   from you and crush everything in their path; a falling tree knocks
   over the trees it hits, so one good chop can start a domino chain.
   Felled trees leave log walls, stumps regrow, and wood chips level
   you up. Survive the night until dawn.
   ===================================================================== */
const G = {
  state:'menu', t:0, rt:0, biome:BIOMES[0], mod:null, daily:false,
  trees:[], tgrid:null, queue:[], falls:[], logs:[], foes:[], picks:[], fx:[], pops:[], clouds:[], bolts:[], owls:[], buddies:[], shots:[], roots:[],
  level:1, xp:0, need:10, up:{}, kills:0, crushKills:0, felled:0, chainN:{}, maxChain:0, goldRun:0, score:0,
  spawnT:0, hordeT:60, bossesSpawned:{}, boss:null, won:false, revived:false,
  shake:0, flash:0, slow:0, q:'high', dark:0, frenzyT:0, stormT:0, boltT:5,
  cam:{ x:CX, y:CY, z:1 }, tut:false, tutStep:0, nid:1,
};
let P = null;
const IN = { keys:{}, joy:null, mx:0, my:0 };

/* ---------------- stats from upgrades and gear ---------------- */
const U = id => G.up[id] || 0;
const axeDef = () => AXES.find(a => a.id === save.axe) || AXES[0];
function stats(){
  const a = axeDef(), c = save.camp;
  return {
    dmg:14 * a.dmg * (1 + .3 * U('sharp')) * (1 + .08 * c.dmg),
    cd:.52 * a.swing * Math.pow(.88, U('quick')) / (G.frenzyT > 0 ? 1.25 : 1),
    reach:64 * (1 + .18 * U('reach')), arc:Math.min(3.6, 2.1 * (1 + .18 * U('reach'))),
    chop:1 + U('heavy') + (a.chop || 0),
    crush:(1 + .4 * U('crush')) * (a.crush || 1) * (1 + .1 * c.crush),
    fallW:1 + .35 * U('wide'),
    magnet:85 * (1 + .5 * U('magnet')) * (1 + .15 * c.magnet),
    spd:195 * Math.pow(1.1, U('boots')) * (G.frenzyT > 0 ? 1.25 : 1),
    armor:Math.pow(.88, U('armor')),
    light:1 + .3 * U('lantern'),
    fire:U('fire') + (a.fire ? 1 : 0),
    gold:(a.gold || 1) * (1 + .12 * c.gold) * (G.mod && (G.mod.id === 'swarm') ? 1.5 : 1) * (G.mod && G.mod.id === 'glass' ? 2 : 1),
  };
}
let S = null;

/* ---------------- the forest ---------------- */
const TC = 128;
function gridKey(x, y){ return ((x / TC) | 0) * 1000 + ((y / TC) | 0); }
function addTree(tr){ const k = gridKey(tr.x, tr.y); (G.tgrid.get(k) || G.tgrid.set(k, []).get(k)).push(tr); G.trees.push(tr); }
function treesNear(x, y, r, out){
  out.length = 0;
  const x0 = ((x - r) / TC) | 0, x1 = ((x + r) / TC) | 0, y0 = ((y - r) / TC) | 0, y1 = ((y + r) / TC) | 0;
  for(let i = x0; i <= x1; i++) for(let j = y0; j <= y1; j++){ const c = G.tgrid.get(i * 1000 + j); if(c) for(const t of c) out.push(t); }
  return out;
}
function mkTree(type, x, y, grow){
  const d = TREES[type], giant = G.mod && G.mod.id === 'giant' ? 1.4 : 1, sz = rnd(.88, 1.12);
  return { id:G.nid++, type, x, y, h:d.h * sz * giant, w:d.w * sz, hp:d.hp, maxHp:d.hp, st:grow ? 'sapling' : 'stand', g:grow ? 0 : 1, regrow:0, shake:0, seed:(Math.random() * 1e9) | 0 };
}
function buildForest(seed){
  G.trees = []; G.tgrid = new Map();
  const rng = mulberry32(seed), B = G.biome, mix = Object.assign({}, B.mix);
  if(G.mod && G.mod.id === 'gold') mix.golden = 2;
  const types = Object.keys(mix), tot = types.reduce((s, k) => s + mix[k], 0);
  const pickType = () => { let r = rng() * tot; for(const k of types){ r -= mix[k]; if(r <= 0) return k; } return types[0]; };
  const sp = 104;
  for(let gx = 60; gx < WORLD - 60; gx += sp) for(let gy = 60; gy < WORLD - 60; gy += sp){
    const x = gx + (rng() - .5) * sp * .8, y = gy + (rng() - .5) * sp * .8, d = Math.hypot(x - CX, y - CY);
    if(d < CLEAR) continue;
    if(d < CLEAR + 120 && rng() < .5) continue;
    if(rng() < .12) continue;             // little glades
    const t = mkTree(pickType(), x, y);
    t.g = 1; addTree(t);
  }
}
const trunkR = t => t.w * .42 * Math.max(.3, t.g);

/* ---------------- run setup ---------------- */
function newRun(daily){
  const seedStr = daily ? 'timberfall:' + todayKey() : 'r' + Math.random();
  const seed = hashStr(seedStr);
  G.daily = daily;
  G.biome = daily ? BIOMES[seed % Math.min(BIOMES.length, 6)] : BIOMES[save.biome];
  G.mod = daily ? MODS[(seed >>> 3) % MODS.length] : null;
  Object.assign(G, { state:'play', t:0, falls:[], logs:[], foes:[], picks:[], fx:[], pops:[], clouds:[], bolts:[], owls:[], buddies:[], shots:[], roots:[],
    level:1, xp:0, need:10, up:{}, kills:0, crushKills:0, felled:0, chainN:{}, maxChain:0, goldRun:0, score:0,
    spawnT:0, hordeT:60, bossesSpawned:{}, boss:null, won:false, revived:false, dawned:false, endless:false, nextBossT:0, dawnT:0, dark:.45, queue:[], pendingCards:0, deathWhy:'', shake:0, flash:0, slow:0, frenzyT:0, stormT:3, boltT:5, nid:1 });
  buildForest(seed);
  S = stats();
  const maxHp = (100 + 12 * save.camp.hp) * (G.mod && G.mod.id === 'glass' ? .5 : 1);
  P = { x:CX, y:CY + 60, vx:0, vy:0, face:-Math.PI / 2, hp:maxHp, maxHp, iv:0, swingT:.3, swing:0, swingA:0, walk:0, hurtT:0 };
  G.cam.x = P.x; G.cam.y = P.y;
  G.tut = !save.tut; G.tutStep = 0;
  G.startCards = save.camp.start;
  AU.setMusic(1);
}
function ev(e, n){
  for(const m of save.missions){
    if(m.done || m.ev !== e) continue;
    if(m.kind === 'sum') m.p += n; else m.p = Math.max(m.p, n);
    if(m.p >= m.n){ m.done = true; m.fresh = true; save.missionsDone++; save.gold += m.reward; save.mNew = true; if(G.state === 'play') toast('MISSION COMPLETE', m.txt + ' · +' + m.reward + ' gold', '#ffd23a'); AU.mission(); }
  }
}

/* ---------------- felling ---------------- */
function fell(tr, a, chainId, by){
  if(tr.st !== 'stand') return;
  tr.st = 'falling';
  const f = { tr, a, t:0, dur:.55 + tr.h / 900, chain:chainId || G.nid++, by:by || 'axe' };
  G.falls.push(f);
  G.chainN[f.chain] = (G.chainN[f.chain] || 0) + 1;
  if(by !== 'foe'){ G.felled++; ev('fell', 1); save.stats.fell++; if(U('frenzy')) G.frenzyT = 3; }
  AU.creak(tr.h);
}
function impact(f){
  const tr = f.tr, a = f.a, ca = Math.cos(a), sa = Math.sin(a), L = tr.h, W = tr.w * 1.6 * S.fallW;
  const x1 = tr.x + ca * L, y1 = tr.y + sa * L;
  const dmg = (60 + tr.h * .55) * S.crush;
  // crush creatures under the trunk
  for(const e of G.foes){
    if(e.dead) continue;
    const d = distSeg(e.x, e.y, tr.x, tr.y, x1, y1);
    if(d < W / 2 + e.r){
      if(e.d.boss){ if(e.crushCd > 0) continue; e.crushCd = .35; }
      hurtFoe(e, dmg * (e.d.boss ? .6 : 1), 'crush', ca * 260, sa * 260);
    }
  }
  // a tree felled by a creature can land on you
  if(f.by === 'foe' && distSeg(P.x, P.y, tr.x, tr.y, x1, y1) < W / 2 + 14) hurtPlayer(26, 'A beaver felled a tree on you!');
  // dominoes: knock over the trees in the way
  const near = treesNear((tr.x + x1) / 2, (tr.y + y1) / 2, L / 2 + 60, tmpT), hits = [];
  for(const o of near){
    if(o === tr || o.st !== 'stand' || o.g < .6) continue;
    const d = distSeg(o.x, o.y, tr.x, tr.y, x1, y1);
    if(d < W / 2 + trunkR(o) + 4){ const along = (o.x - tr.x) * ca + (o.y - tr.y) * sa; if(along > 20) hits.push([o, along]); }
  }
  hits.sort((p, q) => p[1] - q[1]);
  const spread = U('domino'), maxHits = 1 + spread;
  if(G.chainN[f.chain] >= 40 + 10 * spread) hits.length = 0;     // even the wildest chain runs out of steam
  hits.slice(0, maxHits).forEach(([o], i) => {
    const off = Math.atan2(o.y - tr.y, o.x - tr.x), side = angDiff(off, a);
    const na = a + side * (.6 + spread * .5) + (i ? (i % 2 ? 1 : -1) * .35 * spread : 0) + rnd(-.1, .1);
    G.queue.push({ t:.09 + i * .06, fn:() => fell(o, na, f.chain, f.by === 'foe' ? 'foe' : 'chain') });
  });
  // chain celebration
  const n = G.chainN[f.chain];
  if(n >= 2 && f.by !== 'foe'){
    G.maxChain = Math.max(G.maxChain, n); save.stats.bestChain = Math.max(save.stats.bestChain, n); ev('chain', n);
    pop(`TIMBER! ×${n}`, x1, y1 - 30, n >= 6 ? '#ffd23a' : '#fff4d6', 20 + Math.min(18, n * 2));
    if(n >= 5) G.slow = Math.max(G.slow, .25);
  } else if(f.by !== 'foe') pop('TIMBER!', x1, y1 - 30, '#fff4d6', 18);
  // wood, logs, effects
  const d = TREES[tr.type], mul = G.mod && G.mod.id === 'giant' ? 1.3 : 1;
  const chips = Math.round(d.wood * mul);
  for(let i = 0; i < chips; i++){ const k = rnd(.15, 1); drop('wood', tr.x + ca * L * k + rnd(-12, 12), tr.y + sa * L * k + rnd(-12, 12), 1); }
  if(d.gold) for(let i = 0; i < Math.ceil(d.gold / 3); i++) drop('gold', x1 + rnd(-30, 30), y1 + rnd(-30, 30), Math.min(3, d.gold));
  const burn = S.fire;
  G.logs.push({ x1:tr.x + ca * 8, y1:tr.y + sa * 8, x2:x1, y2:y1, w:tr.w * .8, t:0, life:22, burn:burn ? 3 + burn * 1.5 : 0, bdmg:22 * burn, type:tr.type, roll:U('roll') ? 1 : 0, rv:0, rolled:new Set(), tr });
  for(let i = 0; i < 18; i++){ const k = Math.random(); G.fx.push({ k:'leaf', x:tr.x + ca * L * (.6 + k * .45), y:tr.y + sa * L * (.6 + k * .45), vx:rnd(-90, 90), vy:rnd(-90, 90), l:rnd(.6, 1.4), c:pick(G.biome.leaf[tr.type] || ['#4a8a3a']), s:rnd(3, 6), a:rnd(0, TAU), va:rnd(-6, 6) }); }
  for(let i = 0; i < 10; i++) G.fx.push({ k:'dust', x:tr.x + ca * L * Math.random(), y:tr.y + sa * L * Math.random(), vx:rnd(-40, 40), vy:rnd(-40, 40), l:rnd(.4, .9), c:'#c8b48a', s:rnd(8, 16) });
  if(U('splint')) for(let i = 0; i < 5 * U('splint'); i++){ const sa2 = a + rnd(-.9, .9); G.shots.push({ x:x1, y:y1, vx:Math.cos(sa2) * 420, vy:Math.sin(sa2) * 420, l:.45, dmg:22, r:6, k:'splinter', hit:new Set() }); }
  tr.st = 'stump'; tr.regrow = 40 / (1 + U('sprout')); tr.hp = tr.maxHp;
  G.shake = Math.max(G.shake, Math.min(14, 3 + tr.h / 40));
  AU.crash(tr.h, n);
}
const tmpT = [], tmpT2 = [];

/* ---------------- pickups ---------------- */
function drop(k, x, y, v){ G.picks.push({ k, x, y, v, t:0, vx:rnd(-60, 60), vy:rnd(-60, 60), mag:false }); }
function gainXp(v){
  G.xp += v;
  while(G.xp >= G.need){ G.xp -= G.need; G.level++; G.need = Math.round(8 + G.level * 4.5 + Math.pow(G.level, 1.5)); G.pendingCards = (G.pendingCards || 0) + 1; ev('level', G.level); }
}

/* ---------------- creatures ---------------- */
function spawnFoe(type, x, y){
  const d = FOES[type], hpMul = 1 + G.t / 170 + Math.pow(G.t / 320, 2);
  const e = { type, d, x, y, vx:0, vy:0, hp:d.hp * (d.boss ? 1 : hpMul), maxHp:0, r:d.r, t:0, hitT:0, slowT:0, cd:0, st:'walk', stT:0, id:G.nid++, face:0 };
  e.maxHp = e.hp;
  G.foes.push(e);
  if(d.boss){ G.boss = e; announce(d.name.toUpperCase(), '#ff8a5a', 'has woken!'); AU.bossRoar(); AU.setMusic(3); }
  return e;
}
function spawnRing(){
  for(let k = 0; k < 12; k++){
    const a = rnd(0, TAU), d = rnd(640, 820), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if(x < 40 || y < 40 || x > WORLD - 40 || y > WORLD - 40) continue;
    return [x, y];
  }
  return [clamp(P.x + rnd(-700, 700), 40, WORLD - 40), clamp(P.y + rnd(-700, 700), 40, WORLD - 40)];
}
function pickFoeType(){
  const pool = Object.keys(FOES).filter(k => !FOES[k].boss && !FOES[k].elite && G.t >= FOES[k].at);
  const w = { thorn:6, wisp:3, boar:2, wolf:1.4, beaver:1.3, spore:1.6, bark:1.2 };
  if(G.biome.id === 'taiga') w.wolf *= 2.5; if(G.biome.id === 'autumn') w.wisp *= 1.8; if(G.biome.id === 'haunt'){ w.wisp *= 2; w.spore *= 1.5; }
  let tot = 0; for(const k of pool) tot += w[k] || 1;
  let r = Math.random() * tot; for(const k of pool){ r -= w[k] || 1; if(r <= 0) return k; }
  return pool[0];
}
function director(dt){
  const swarm = G.mod && G.mod.id === 'swarm' ? 2 : 1;
  const m = G.t / 60, rate = (.8 + m * .75 + m * m * .06) * swarm * (G.boss ? .6 : 1);
  G.spawnT += dt * rate;
  while(G.spawnT >= 1 && G.foes.length < 280){
    G.spawnT -= 1;
    const type = pickFoeType(), p = spawnRing();
    if(FOES[type].pack){ for(let i = 0; i < FOES[type].pack; i++) spawnFoe(type, p[0] + rnd(-40, 40), p[1] + rnd(-40, 40)); }
    else spawnFoe(type, p[0], p[1]);
  }
  // hordes every minute, and an elite after four minutes
  G.hordeT -= dt;
  if(G.hordeT <= 0){
    G.hordeT = 60; const a = rnd(0, TAU), n = 14 + G.t / 20;
    for(let i = 0; i < n; i++){ const d = rnd(620, 760), aa = a + rnd(-.5, .5); spawnFoe(G.t > 200 && i % 5 === 0 ? 'wolf' : 'thorn', clamp(P.x + Math.cos(aa) * d, 40, WORLD - 40), clamp(P.y + Math.sin(aa) * d, 40, WORLD - 40)); }
    if(G.t > 300){ const p = spawnRing(); spawnFoe('owlbear', p[0], p[1]); }
    announce('A HORDE APPROACHES', '#ffb36b');
  }
  if(G.endless && !G.boss && G.t >= G.nextBossT){ G.nextBossT = G.t + 150; const p = spawnRing(), b = spawnFoe(Math.random() < .5 ? 'stump' : 'hollow', p[0], p[1]); b.hp = b.maxHp = b.maxHp * (1 + (G.t - RUN_LEN) / 300); }
  for(const k in BOSS_AT) if(!G.bossesSpawned[k] && G.t >= BOSS_AT[k]){ G.bossesSpawned[k] = 1; const p = spawnRing(); spawnFoe(k, p[0], p[1]); }
  if(G.mod && G.mod.id === 'storm'){ G.stormT -= dt; if(G.stormT <= 0){ G.stormT = rnd(2, 4); const ts = treesNear(P.x + rnd(-400, 400), P.y + rnd(-400, 400), 160, tmpT).filter(t => t.st === 'stand' && t.g >= 1); if(ts.length){ fell(pick(ts), rnd(0, TAU), 0, 'storm'); } } }
}
function hurtFoe(e, dmg, src, kx, ky){
  if(e.dead) return;
  if(src === 'axe' && e.d.armor) dmg *= e.d.armor;
  if(U('lantern') && Math.hypot(e.x - P.x, e.y - P.y) < 260 * S.light) dmg *= 1 + .15 * U('lantern');
  e.hp -= dmg; e.hitT = .12;
  if(kx !== undefined && !e.d.boss){ const m = e.d.elite ? .2 : 1; e.vx += kx * m; e.vy += ky * m; }
  if(src === 'axe' && axeDef().slow) e.slowT = 1.5;
  if(dmg >= 1 && G.q !== 'low' && Math.random() < .5) pop(Math.round(dmg), e.x + rnd(-8, 8), e.y - e.r - 6, src === 'crush' ? '#ffd23a' : '#ffffff', src === 'crush' ? 16 : 12, .5);
  if(e.hp <= 0) killFoe(e, src);
}
function killFoe(e, src){
  e.dead = true; G.kills++; save.stats.kills++; ev('kill', 1);
  if(src === 'crush'){ G.crushKills++; save.stats.crush++; ev('crush', 1); }
  const d = e.d;
  G.score += d.boss ? 2000 : d.elite ? 200 : 10 * d.xp;
  for(let i = 0; i < d.xp; i++) drop('wood', e.x + rnd(-10, 10), e.y + rnd(-10, 10), 1);
  const gg = d.gold; let gc = Math.floor(gg) + (Math.random() < gg % 1 ? 1 : 0);
  for(let i = 0; i < Math.min(gc, 12); i++) drop('gold', e.x + rnd(-14, 14), e.y + rnd(-14, 14), Math.max(1, Math.round(gc / Math.min(gc, 12))));
  for(let i = 0; i < (d.boss ? 60 : 10); i++) G.fx.push({ k:'puff', x:e.x, y:e.y, vx:rnd(-120, 120), vy:rnd(-120, 120), l:rnd(.3, .7), c:d.col, s:rnd(4, 9) * (d.boss ? 2 : 1) });
  if(d.burst) G.clouds.push({ x:e.x, y:e.y, r:74, t:0, l:3.2 });
  if(U('grove') && Math.random() < .1 * U('grove')){ const t = mkTree(pick(Object.keys(G.biome.mix).filter(k => k !== 'golden')), e.x, e.y, true); t.fast = 1; addTree(t); }
  if(d.boss){
    G.boss = null; save.stats.bosses++; ev('boss', 1); G.flash = 1; G.shake = 16; G.slow = 1;
    announce(d.name.toUpperCase(), '#ffd23a', 'is defeated!'); AU.bossDown(); SDK.happytime();
    if(e.type === 'hollow' && !G.dawned){ G.won = true; G.dawnT = 2.2; }
    else AU.setMusic(2);
  } else AU.kill(src === 'crush');
}
function hurtPlayer(dmg, why){
  if(P.iv > 0 || G.state !== 'play') return;
  P.hp -= dmg * S.armor; P.iv = .6; P.hurtT = .3; G.shake = Math.max(G.shake, 6);
  AU.hurt();
  if(P.hp <= 0){ P.hp = 0; G.state = 'dying'; G.deathT = 1.3; G.deathWhy = why || ''; AU.death(); }
}

/* ---------------- main update ---------------- */
function update(rdt){
  G.rt += rdt;
  if(G.slow > 0) G.slow -= rdt;
  const dt = rdt * (G.slow > 0 ? .4 : 1);
  if(G.state === 'dying'){ G.deathT -= rdt; stepWorld(dt * .3); if(G.deathT <= 0) onDeathDone(); return; }
  G.t += dt;
  if(G.pendingCards > 0 && !G.falls.length){ G.pendingCards--; openCards(); return; }
  if(G.startCards > 0 && G.t > .5){ G.startCards--; G.pendingCards = (G.pendingCards || 0) + 1; }
  S = stats();
  playerStep(dt);
  director(dt);
  stepWorld(dt);
  // darkness: dusk → deep night; sunrise once the Hollow King falls
  const t = G.t / RUN_LEN;
  const tgt = G.won || G.endless ? .12 : t < .15 ? .45 + t / .15 * .42 : .87 + Math.sin(G.t * .3) * .03;
  G.dark = lerp(G.dark, tgt, Math.min(1, rdt * .6));
  if(G.dawnT > 0){ G.dawnT -= rdt; if(G.dawnT <= 0){ dawnWin(); return; } }
  if(G.frenzyT > 0) G.frenzyT -= dt;
  G.score = Math.max(G.score, 0);
  ev('time', Math.floor(G.t));
  tutorialStep();
}
function playerStep(dt){
  let mx = 0, my = 0;
  const k = IN.keys;
  if(k.a || k.arrowleft) mx -= 1; if(k.d || k.arrowright) mx += 1; if(k.w || k.arrowup) my -= 1; if(k.s || k.arrowdown) my += 1;
  if(IN.joy && IN.joy.on){ const dx = IN.joy.x - IN.joy.ox, dy = IN.joy.y - IN.joy.oy, l = Math.hypot(dx, dy); if(l > 8){ mx = dx / Math.max(l, 44); my = dy / Math.max(l, 44); } }
  const ml = Math.hypot(mx, my); if(ml > 1){ mx /= ml; my /= ml; }
  const moving = ml > .05;
  P.vx = lerp(P.vx, mx * S.spd, Math.min(1, dt * 14)); P.vy = lerp(P.vy, my * S.spd, Math.min(1, dt * 14));
  P.x += P.vx * dt; P.y += P.vy * dt;
  // trunks block you (logs do not)
  for(const t of treesNear(P.x, P.y, 60, tmpT)){ if(t.st !== 'stand' && !(t.st === 'sapling' && t.g > .5)) continue; const r = trunkR(t) + 13, dx = P.x - t.x, dy = P.y - t.y, d = Math.hypot(dx, dy); if(d < r && d > .01){ P.x = t.x + dx / d * r; P.y = t.y + dy / d * r; } }
  P.x = clamp(P.x, 30, WORLD - 30); P.y = clamp(P.y, 30, WORLD - 30);
  if(moving){ P.face = Math.atan2(my, mx); P.walk += dt * 10; }
  else {
    // standing still: turn toward the nearest creature, else the nearest tree
    let best = null, bd = 170;
    for(const e of G.foes){ const d = Math.hypot(e.x - P.x, e.y - P.y) - e.r; if(d < bd){ bd = d; best = e; } }
    if(!best){ let td = S.reach + 30; for(const t of treesNear(P.x, P.y, td, tmpT)){ if(t.st !== 'stand') continue; const d = Math.hypot(t.x - P.x, t.y - P.y); if(d < td){ td = d; best = t; } } }
    if(best) P.face += angDiff(Math.atan2(best.y - P.y, best.x - P.x), P.face) * Math.min(1, dt * 12);
  }
  if(P.iv > 0) P.iv -= dt; if(P.hurtT > 0) P.hurtT -= dt;
  // heal by the campfire, and with pine tea
  if(Math.hypot(P.x - CX, P.y - CY) < 110) P.hp = Math.min(P.maxHp, P.hp + 5 * dt);
  if(U('regen')) P.hp = Math.min(P.maxHp, P.hp + U('regen') * dt);
  // the axe swings by itself at anything within reach
  P.swingT -= dt; if(P.swing > 0) P.swing -= dt * 4;
  if(P.swingT <= 0){
    const reach = S.reach, arc = S.arc / 2;
    const inArc = (x, y, r) => { const dx = x - P.x, dy = y - P.y, d = Math.hypot(dx, dy); return d - r < reach && Math.abs(angDiff(Math.atan2(dy, dx), P.face)) < arc + Math.atan2(r, Math.max(1, d)); };
    let hitFoe = false, tree = null, td = 1e9;
    for(const e of G.foes) if(!e.dead && inArc(e.x, e.y, e.r)){ hitFoe = true; }
    for(const t of treesNear(P.x, P.y, reach + 50, tmpT)){ if(t.st !== 'stand' || t.g < 1) continue; if(inArc(t.x, t.y, trunkR(t))){ const d = Math.hypot(t.x - P.x, t.y - P.y); if(d < td){ td = d; tree = t; } } }
    if(hitFoe || tree){
      P.swingT = S.cd; P.swing = 1; P.swingA = P.face;
      if(hitFoe) for(const e of G.foes) if(!e.dead && inArc(e.x, e.y, e.r)){ const a = Math.atan2(e.y - P.y, e.x - P.x); hurtFoe(e, S.dmg, 'axe', Math.cos(a) * 140, Math.sin(a) * 140); }
      if(tree){
        tree.hp -= S.chop; tree.shake = .25;
        for(let i = 0; i < 5; i++) G.fx.push({ k:'chip', x:tree.x + rnd(-6, 6), y:tree.y - 18, vx:rnd(-120, 120), vy:rnd(-160, -40), g:420, l:rnd(.3, .6), c:'#e8c89a', s:rnd(2, 4) });
        AU.chop(tree.hp <= 0);
        if(tree.hp <= 0) fell(tree, Math.atan2(tree.y - P.y, tree.x - P.x) + rnd(-.06, .06));
      } else AU.swish();
    }
  }
}
function stepWorld(dt){
  // delayed domino knocks
  for(const q of G.queue){ q.t -= dt; if(q.t <= 0){ q.done = true; q.fn(); } }
  G.queue = G.queue.filter(q => !q.done);
  // falling trees
  for(const f of G.falls){ f.t += dt; if(f.t >= f.dur && !f.done){ f.done = true; impact(f); } }
  G.falls = G.falls.filter(f => !f.done);
  // stumps regrow into saplings, saplings grow up
  G.regrowT = (G.regrowT || 0) + dt;
  if(G.regrowT > .5){
    const step = G.regrowT; G.regrowT = 0;
    for(const t of G.trees){
      if(t.st === 'stump'){ t.regrow -= step; if(t.regrow <= 0 && Math.hypot(t.x - P.x, t.y - P.y) > 60){ t.st = 'sapling'; t.g = 0; } }
      else if(t.st === 'sapling'){ t.g += step / (t.fast ? 6 : 10); if(t.g >= 1){ t.g = 1; t.st = 'stand'; t.hp = t.maxHp; } }
    }
  }
  for(const t of G.trees) if(t.shake > 0) t.shake -= dt;
  stepLogs(dt);
  stepFoes(dt);
  stepHelpers(dt);
  stepPicks(dt);
  // projectiles and splinters
  for(const s of G.shots){
    s.x += s.vx * dt; s.y += s.vy * dt; s.l -= dt;
    if(s.k === 'splinter'){ for(const e of G.foes){ if(e.dead || s.hit.has(e)) continue; if(Math.hypot(e.x - s.x, e.y - s.y) < e.r + s.r){ s.hit.add(e); hurtFoe(e, s.dmg, 'shot'); } } }
    else if(Math.hypot(P.x - s.x, P.y - s.y) < 14 + s.r){ hurtPlayer(s.dmg, 'Struck by the Hollow King'); s.l = 0; }
  }
  G.shots = G.shots.filter(s => s.l > 0);
  for(const c of G.clouds){ c.t += dt; if(c.t < c.l && Math.hypot(P.x - c.x, P.y - c.y) < c.r) hurtPlayer(7, 'Poisoned by a Puffcap'); }
  G.clouds = G.clouds.filter(c => c.t < c.l);
  for(const r of G.roots){ r.t += dt; if(r.t > r.warn && !r.hit){ r.hit = true; if(distSeg(P.x, P.y, r.x1, r.y1, r.x2, r.y2) < 26) hurtPlayer(22, 'Tangled by the Old Stump'); } }
  G.roots = G.roots.filter(r => r.t < r.warn + .5);
  for(const b of G.bolts) b.t += dt; G.bolts = G.bolts.filter(b => b.t < .4);
  for(const p of G.fx){ p.x += p.vx * dt; p.y += p.vy * dt; if(p.g) p.vy += p.g * dt; p.vx *= .94; p.vy *= p.g ? 1 : .94; if(p.va) p.a += p.va * dt; p.l -= dt; }
  G.fx = G.fx.filter(p => p.l > 0); if(G.fx.length > 900) G.fx.splice(0, G.fx.length - 900);
  for(const p of G.pops){ p.t += dt; p.y -= 30 * dt; } G.pops = G.pops.filter(p => p.t < p.d);
  G.shake *= Math.pow(.02, dt); if(G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2);
  G.foes = G.foes.filter(e => !e.dead);
}
function stepLogs(dt){
  for(const L of G.logs){
    L.t += dt;
    if(L.burn > 0){
      L.burn -= dt;
      for(const e of G.foes){ if(!e.dead && distSeg(e.x, e.y, L.x1, L.y1, L.x2, L.y2) < L.w / 2 + e.r + 6) hurtFoe(e, L.bdmg * dt, 'fire'); }
      if(Math.random() < .5) G.fx.push({ k:'ember', x:lerp(L.x1, L.x2, Math.random()), y:lerp(L.y1, L.y2, Math.random()), vx:rnd(-20, 20), vy:rnd(-80, -30), l:rnd(.4, .8), c:pick(['#ffb03a', '#ff6a1a', '#ffe08a']), s:rnd(2, 4) });
    }
    if(L.roll === 1 && L.t > .15){
      // roll sideways toward the nearest crowd
      const mx = (L.x1 + L.x2) / 2, my = (L.y1 + L.y2) / 2, ax = L.x2 - L.x1, ay = L.y2 - L.y1, al = Math.hypot(ax, ay) || 1, nx = -ay / al, ny = ax / al;
      let side = 0; for(const e of G.foes){ const d = (e.x - mx) * nx + (e.y - my) * ny; if(Math.abs(d) < 360 && distSeg(e.x, e.y, L.x1, L.y1, L.x2, L.y2) < 360) side += Math.sign(d); }
      L.rv = (side >= 0 ? 1 : -1) * (170 + 40 * U('roll')); L.roll = 2; L.rollT = 1.8;
    }
    if(L.roll === 2){
      L.rollT -= dt; const ax = L.x2 - L.x1, ay = L.y2 - L.y1, al = Math.hypot(ax, ay) || 1, nx = -ay / al * L.rv * dt, ny = ax / al * L.rv * dt;
      L.x1 += nx; L.y1 += ny; L.x2 += nx; L.y2 += ny; L.spin = (L.spin || 0) + L.rv * dt / 20;
      for(const e of G.foes){ if(e.dead || L.rolled.has(e)) continue; if(distSeg(e.x, e.y, L.x1, L.y1, L.x2, L.y2) < L.w / 2 + e.r){ L.rolled.add(e); hurtFoe(e, 45 * S.crush, 'crush', nx * 30, ny * 30); } }
      if(L.rollT <= 0) L.roll = 3;
    }
  }
  G.logs = G.logs.filter(L => L.t < L.life);
}
const tmpF = [];
function stepFoes(dt){
  // crude spatial hash for separation
  const hash = new Map(), HC = 64;
  for(const e of G.foes){ const k = ((e.x / HC) | 0) * 1000 + ((e.y / HC) | 0); (hash.get(k) || hash.set(k, []).get(k)).push(e); }
  for(const e of G.foes){
    if(e.dead) continue;
    const d = e.d; e.t += dt; if(e.hitT > 0) e.hitT -= dt; if(e.crushCd > 0) e.crushCd -= dt; if(e.slowT > 0) e.slowT -= dt; e.cd -= dt;
    const dx = P.x - e.x, dy = P.y - e.y, dist = Math.hypot(dx, dy) || 1;
    let spd = d.spd * (e.slowT > 0 ? .6 : 1) * (1 + G.t / 1200);
    let tx = dx / dist, ty = dy / dist;
    // beavers go after trees near you and fell them on you
    if(d.gnaw){
      if(!e.tree || e.tree.st !== 'stand'){ e.tree = null; let bt = null, bd = 1e9; for(const t of treesNear(P.x, P.y, 280, tmpT)){ if(t.st !== 'stand' || t.g < 1 || t.gnawed) continue; const dd = Math.hypot(t.x - P.x, t.y - P.y); if(dd > 90 && dd < t.h * .9){ const q = Math.hypot(t.x - e.x, t.y - e.y); if(q < bd){ bd = q; bt = t; } } } if(bt && dist < 700){ e.tree = bt; bt.gnawed = e.id; } }
      if(e.tree){ const t = e.tree, qx = t.x - e.x, qy = t.y - e.y, q = Math.hypot(qx, qy); if(q < trunkR(t) + e.r + 6){ spd = 0; e.gnaw = (e.gnaw || 0) + dt; t.shake = .1; e.gnawA = Math.atan2(P.y - t.y, P.x - t.x); if(e.gnaw > 2.4){ fell(t, e.gnawA, 0, 'foe'); e.gnaw = 0; t.gnawed = 0; e.tree = null; } } else { tx = qx / q; ty = qy / q; e.gnaw = 0; } }
    }
    // tuskers charge in straight lines
    if(d.charge){
      if(e.st === 'walk' && dist < 340 && e.cd <= 0){ e.st = 'wind'; e.stT = .6; e.ca = Math.atan2(dy, dx); }
      if(e.st === 'wind'){ spd = 0; e.stT -= dt; if(e.stT <= 0){ e.st = 'charge'; e.stT = .9; } }
      if(e.st === 'charge'){ spd = 330; tx = Math.cos(e.ca); ty = Math.sin(e.ca); e.stT -= dt; if(e.stT <= 0){ e.st = 'walk'; e.cd = 2.5; } }
    }
    // bosses
    if(d.boss) bossAI(e, dt, dist);
    e.face = Math.atan2(ty, tx);
    e.vx = lerp(e.vx, tx * spd, Math.min(1, dt * 6)); e.vy = lerp(e.vy, ty * spd, Math.min(1, dt * 6));
    e.x += e.vx * dt; e.y += e.vy * dt;
    // separation
    const k0x = (e.x / HC) | 0, k0y = (e.y / HC) | 0;
    for(let i = -1; i <= 1; i++) for(let j = -1; j <= 1; j++){ const c = hash.get((k0x + i) * 1000 + k0y + j); if(!c) continue; for(const o of c){ if(o === e) continue; const ox = e.x - o.x, oy = e.y - o.y, od = Math.hypot(ox, oy), rr = e.r + o.r; if(od < rr && od > .01){ const push = (rr - od) * .5 * (d.boss ? .1 : 1); e.x += ox / od * push; e.y += oy / od * push; } } }
    // trees and logs block walkers
    if(!d.fly){
      for(const t of treesNear(e.x, e.y, 60 + e.r, tmpT)){ if(t.st !== 'stand' && !(t.st === 'sapling' && t.g > .5)) continue; const r = trunkR(t) + e.r, ox = e.x - t.x, oy = e.y - t.y, od = Math.hypot(ox, oy); if(od < r && od > .01){ e.x = t.x + ox / od * r; e.y = t.y + oy / od * r; if(e.st === 'charge'){ e.st = 'walk'; e.cd = 2; e.slowT = 1.2; } } }
      if(!d.boss) for(const L of G.logs){ if(L.roll === 2) continue; const lx = L.x2 - L.x1, ly = L.y2 - L.y1, ll = lx * lx + ly * ly || 1, tt = clamp(((e.x - L.x1) * lx + (e.y - L.y1) * ly) / ll, 0, 1), px = L.x1 + lx * tt, py = L.y1 + ly * tt, ox = e.x - px, oy = e.y - py, od = Math.hypot(ox, oy), r = L.w / 2 + e.r; if(od < r && od > .01){ e.x = px + ox / od * r; e.y = py + oy / od * r; } }
    }
    e.x = clamp(e.x, 10, WORLD - 10); e.y = clamp(e.y, 10, WORLD - 10);
    // bite
    if(dist < e.r + 15 && e.cd <= 0 && !d.boss){ hurtPlayer(d.dmg * (1 + G.t / 500), 'Caught by a ' + d.name); e.cd = .9; }
    if(d.boss && dist < e.r + 18 && e.cd <= 0){ hurtPlayer(d.dmg, 'Crushed by ' + d.name); e.cd = 1.4; }
  }
}
function bossAI(e, dt, dist){
  e.skill = (e.skill || 3) - dt;
  if(e.type === 'stump' && e.skill <= 0){
    e.skill = 5.5;
    // roots burst toward you, telegraphed
    for(let i = -1; i <= 1; i++){ const a = Math.atan2(P.y - e.y, P.x - e.x) + i * .35; G.roots.push({ x1:e.x, y1:e.y, x2:e.x + Math.cos(a) * 520, y2:e.y + Math.sin(a) * 520, t:0, warn:.9 }); }
    for(let i = 0; i < 4; i++) spawnFoe('thorn', e.x + rnd(-60, 60), e.y + rnd(-60, 60));
    AU.roots();
  }
  if(e.type === 'hollow' && e.skill <= 0){
    e.skill = 4.2;
    const n = 14; for(let i = 0; i < n; i++){ const a = i / n * TAU + e.t; G.shots.push({ x:e.x, y:e.y, vx:Math.cos(a) * 170, vy:Math.sin(a) * 170, l:3.2, dmg:14, r:9, k:'ghost' }); }
    if(Math.random() < .5) for(let i = 0; i < 5; i++) spawnFoe('wisp', e.x + rnd(-80, 80), e.y + rnd(-80, 80));
    AU.ghostRing();
  }
}
function stepHelpers(dt){
  // owls
  while(G.owls.length < U('owl')) G.owls.push({ x:P.x, y:P.y - 60, t:0, cd:rnd(0, 1), tgt:null, a:rnd(0, TAU) });
  for(const o of G.owls){
    o.cd -= dt; o.a += dt * 2;
    if(o.tgt && (o.tgt.dead || o.dive <= 0)) o.tgt = null;
    if(!o.tgt && o.cd <= 0){ let b = null, bd = 320; for(const e of G.foes){ const d = Math.hypot(e.x - P.x, e.y - P.y); if(d < bd){ bd = d; b = e; } } if(b){ o.tgt = b; o.dive = 1; } else o.cd = .4; }
    let tx = P.x + Math.cos(o.a) * 50, ty = P.y - 40 + Math.sin(o.a) * 20;
    if(o.tgt){ tx = o.tgt.x; ty = o.tgt.y; o.dive -= dt; if(Math.hypot(o.x - tx, o.y - ty) < 16){ hurtFoe(o.tgt, 30, 'owl'); o.tgt = null; o.cd = 2.2; AU.owl(); } }
    o.x = lerp(o.x, tx, Math.min(1, dt * (o.tgt ? 7 : 3))); o.y = lerp(o.y, ty, Math.min(1, dt * (o.tgt ? 7 : 3)));
  }
  // beaver buddies fell trees onto crowds
  while(G.buddies.length < U('beaver')) G.buddies.push({ x:P.x, y:P.y, tree:null, gn:0 });
  for(const b of G.buddies){
    if(!b.tree || b.tree.st !== 'stand'){
      b.tree = null; b.gn = 0;
      let best = null, bs = 2;
      for(const t of treesNear(P.x, P.y, 360, tmpT)){
        if(t.st !== 'stand' || t.g < 1) continue;
        let n = 0; for(const e of G.foes){ const d = Math.hypot(e.x - t.x, e.y - t.y); if(d < t.h && d > 30) n++; }
        if(n > bs){ bs = n; best = t; }
      }
      b.tree = best;
    }
    const t = b.tree, tx = t ? t.x + 20 : P.x - 30, ty = t ? t.y + 10 : P.y + 20, d = Math.hypot(tx - b.x, ty - b.y);
    if(d > 8){ b.x += (tx - b.x) / d * Math.min(d, 230 * dt); b.y += (ty - b.y) / d * Math.min(d, 230 * dt); b.gn = 0; }
    else if(t){ b.gn += dt; t.shake = .1; if(b.gn > 1.2 - .3 * U('beaver')){ let cx = 0, cy = 0, n = 0; for(const e of G.foes){ if(Math.hypot(e.x - t.x, e.y - t.y) < t.h){ cx += e.x; cy += e.y; n++; } } if(n){ fell(t, Math.atan2(cy / n - t.y, cx / n - t.x), 0, 'buddy'); AU.beaver(); } b.tree = null; } }
  }
  // lightning rod
  if(U('bolt')){
    G.boltT -= dt;
    if(G.boltT <= 0){
      G.boltT = 7.5 - 1.6 * U('bolt');
      let best = null, bs = 0;
      for(const t of treesNear(P.x, P.y, 520, tmpT)){
        if(t.st !== 'stand' || t.g < 1) continue;
        let n = 0, cx = 0, cy = 0; for(const e of G.foes){ const d = Math.hypot(e.x - t.x, e.y - t.y); if(d < t.h && d > 30){ n++; cx += e.x; cy += e.y; } }
        if(n > bs){ bs = n; best = [t, cx / n, cy / n]; }
      }
      if(best){ const [t, cx, cy] = best; fell(t, Math.atan2(cy - t.y, cx - t.x), 0, 'bolt'); G.bolts.push({ x:t.x, y:t.y, t:0 }); G.flash = Math.max(G.flash, .35); AU.thunder(); }
    }
  }
}
function stepPicks(dt){
  const mag = S.magnet;
  for(const p of G.picks){
    p.t += dt;
    const dx = P.x - p.x, dy = P.y - p.y, d = Math.hypot(dx, dy);
    if(d < mag || p.mag){ p.mag = true; const s = 420 + p.t * 60; p.x += dx / (d || 1) * s * dt; p.y += dy / (d || 1) * s * dt; }
    else { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .9; p.vy *= .9; }
    if(d < 18){ p.got = true; if(p.k === 'wood'){ gainXp(p.v); AU.pickWood(); } else { const g = Math.round(p.v * S.gold); G.goldRun += g; AU.coin(); } }
  }
  G.picks = G.picks.filter(p => !p.got && p.t < 60);
}
function pop(txt, x, y, col, size, d){ G.pops.push({ txt, x, y, c:col, s:size || 16, t:0, d:d || 1 }); if(G.pops.length > 50) G.pops.shift(); }

/* ---------------- tutorial ---------------- */
function tutorialStep(){
  if(!G.tut) return;
  const touch = document.body.classList.contains('touch');
  if(G.tutStep === 0){ tip(touch ? 'Drag anywhere to <b>walk</b>. Walk up to a tree: your axe <b>chops by itself</b>.' : '<b>WASD</b> or arrow keys to walk. Walk up to a tree: your axe <b>chops by itself</b>.'); if(G.felled >= 1){ G.tutStep = 1; } }
  else if(G.tutStep === 1){ tip('Trees fall <b>AWAY</b> from you. Stand so they land on the creatures!'); if(G.crushKills >= 1 || G.t > 40){ G.tutStep = 2; } }
  else if(G.tutStep === 2){ tip('A falling tree knocks down the trees it hits: <b>DOMINO!</b> Collect wood to level up.'); if(G.level >= 2 || G.t > 55){ G.tutStep = 3; setTimeout(() => tip(null), 100); save.tut = true; persist(); G.tut = false; } }
}
