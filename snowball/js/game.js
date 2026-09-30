'use strict';
/* =====================================================================
   SNOWBALL EFFECT simulation.
   The ball rolls down an endless slope. Anything smaller than you sticks
   and makes you bigger; anything bigger knocks you back. Tap to jump,
   tap again in the air to slam. The sun melts you, faster and faster.
   Everything scales with the ball, so physics feel the same at 8 cm
   and at 800 m, while the camera zooms out and the world grows.
   ===================================================================== */
const PHYS = { SPD:11, G:55, JUMP:23, SLAM:48, GROW:.13 };
const G = {
  state:'title', t:0, rt:0, x:0, y:0, vx:0, vy:0, R:4, R0:4, peak:4, rot:0, air:false, coyote:0, slam:false, inv:0,
  pts:[], genX:0, things:[], cry:[], stuck:[], parts:[], pops:[], rings:[],
  combo:0, comboT:0, maxCombo:0, meter:0, avalT:0, tier:0, tierRun:0, recordShown:false,
  eatenRun:0, cryRun:0, hopsRun:0, slamsRun:0, avalsRun:0, newFound:[], result:null, shake:0, flash:0, slowT:0, hintDone:{},
};

/* ---------------- terrain ---------------- */
function groundAt(x){
  const P = G.pts; if(!P.length) return 0;
  if(x <= P[0].x) return P[0].y;
  let lo = 0, hi = P.length - 1;
  if(x >= P[hi].x) return P[hi].y + (x - P[hi].x) * .3;
  while(hi - lo > 1){ const m = (lo + hi) >> 1; if(P[m].x <= x) lo = m; else hi = m; }
  const a = P[lo], b = P[hi], k = (x - a.x) / (b.x - a.x);
  return a.y + (b.y - a.y) * k;
}
const lastPt = () => G.pts[G.pts.length - 1];
function slopeTo(len, slope, step, bump){
  const s = lastPt(), n = Math.max(1, Math.ceil(len / step));
  for(let i = 1; i <= n; i++){ const x = s.x + len * i / n; G.pts.push({ x, y:s.y + slope * (x - s.x) + (bump ? Math.sin(i * 1.3 + x * .001) * bump : 0) }); }
}
function pickThing(target, sky){
  let cand = THINGS.filter(t => !!t.sky === !!sky && t.s > target / 2.3 && t.s < target * 2.3);
  if(!cand.length){ let best = null, bd = 1e9; for(const t of THINGS){ if(!!t.sky !== !!sky) continue; const d = Math.abs(Math.log(t.s / target)); if(d < bd){ bd = d; best = t; } } cand = best ? [best] : []; }
  return cand.length ? pick(cand) : null;
}
function placeThing(x, target, sky, lift){
  const T = pickThing(target, sky); if(!T) return;
  const gy = groundAt(x), s = target;
  G.things.push({ id:T.id, e:T.e, x, y:gy - s * .5 - (sky ? lift : 0), s, sky:!!sky, gone:false, hop:false, ph:Math.random() * TAU });
}
function crystalArc(x0, x1, h, n, Rg){ for(let i = 0; i < n; i++){ const k = n === 1 ? .5 : i / (n - 1), x = lerp(x0, x1, k); G.cry.push({ x, y:groundAt(x) - Rg * 1.2 - Math.sin(k * Math.PI) * h, got:false, gt:0 }); } }
const SEG = {
  field(Rg){
    const x0 = lastPt().x, L = rnd(14, 22) * Rg; slopeTo(L, rnd(.26, .38), Rg * 1.4, Rg * .18);
    for(let x = x0 + 3 * Rg; x < x0 + L - Rg; x += rnd(.9, 1.6) * Rg) placeThing(x, Rg * (Math.random() < .2 ? rnd(.55, .85) : rnd(.2, .5)));
    if(Math.random() < .5) crystalArc(x0 + L * .3, x0 + L * .6, Rg, 4, Rg);
  },
  mixed(Rg){
    const x0 = lastPt().x, L = rnd(18, 26) * Rg; slopeTo(L, rnd(.28, .36), Rg * 1.4, Rg * .12);
    let bigDone = false;
    for(let x = x0 + 4 * Rg; x < x0 + L - 2 * Rg; x += rnd(2.4, 4) * Rg){
      if(!bigDone && Math.random() < .35){ placeThing(x, Rg * rnd(1.15, 1.7)); crystalArc(x - 2 * Rg, x + 2 * Rg, 3 * Rg, 3, Rg); bigDone = true; x += 3 * Rg; }
      else placeThing(x, Rg * rnd(.45, .9));
    }
  },
  big(Rg){
    const x0 = lastPt().x, L = 18 * Rg; slopeTo(L, .26, Rg * 1.4);
    for(let x = x0 + 2 * Rg; x < x0 + 8 * Rg; x += rnd(1, 1.6) * Rg) placeThing(x, Rg * rnd(.25, .5));
    const bx = x0 + 11 * Rg; placeThing(bx, Rg * rnd(1.4, 2.4)); crystalArc(bx - 3 * Rg, bx + 3 * Rg, 3.8 * Rg, 5, Rg);
  },
  kicker(Rg){
    slopeTo(4 * Rg, .3, Rg * 1.2); const x0 = lastPt().x;
    slopeTo(3.5 * Rg, -.42, Rg * .8); slopeTo(7 * Rg, .95, Rg * 1.2); slopeTo(5 * Rg, .32, Rg * 1.4);
    crystalArc(x0 + 3 * Rg, x0 + 12 * Rg, 3.5 * Rg, 6, Rg);
    for(let x = x0 + 12 * Rg; x < x0 + 19 * Rg; x += 1.3 * Rg) placeThing(x, Rg * rnd(.25, .55));
  },
  sky(Rg){
    const x0 = lastPt().x, L = 20 * Rg; slopeTo(L, .3, Rg * 1.4, Rg * .1);
    for(let x = x0 + 4 * Rg; x < x0 + L - 2 * Rg; x += rnd(3.5, 5) * Rg){ if(pickThing(Rg * .6, true) && Math.random() < .8) placeThing(x, Rg * rnd(.45, .85), true, rnd(2.5, 4.2) * Rg); else placeThing(x, Rg * rnd(.3, .6)); }
    crystalArc(x0 + 5 * Rg, x0 + 15 * Rg, 3 * Rg, 5, Rg);
  },
};
const SEG_W = [['field', 3], ['mixed', 3.2], ['big', 1.3], ['kicker', 1.5], ['sky', 1.1]];
function generate(){
  while(G.genX < G.x + G.R * 80){
    const Rg = Math.max(G.R, G.peak * .6);
    const sw = tierOf(Rg) >= 7 ? 3.5 : 1.1, WS = SEG_W.map(w => w[0] === 'sky' ? ['sky', sw] : w);
    let s = 0; for(const w of WS) s += w[1]; let r = Math.random() * s, seg = 'field';
    for(const w of WS){ r -= w[1]; if(r <= 0){ seg = w[0]; break; } }
    if(G.t < 4 && seg === 'big') seg = 'field';
    SEG[seg](Rg);
    G.genX = lastPt().x;
  }
}

/* ---------------- run ---------------- */
function resetWorld(r0){
  Object.assign(G, { pts:[{ x:-400 * r0, y:-120 * r0 }], things:[], cry:[], stuck:[], parts:[], pops:[], rings:[], t:0, combo:0, comboT:0, maxCombo:0, meter:0, avalT:0, inv:0, slam:false, shake:0, flash:0, slowT:0 });
  G.R = G.R0 = G.peak = r0; G.x = 0; G.vx = r0 * PHYS.SPD; G.vy = 0; G.air = false; G.rot = 0;
  slopeTo(400 * r0 + 12 * r0, .3, r0 * 1.4);
  G.genX = lastPt().x;
  generate();
  G.y = groundAt(G.x) - G.R;
  G.tier = G.tierRun = tierOf(G.R);
}
function startRun(){
  resetWorld(startR(save.up.start));
  Object.assign(G, { state:'run', eatenRun:0, cryRun:0, hopsRun:0, slamsRun:0, avalsRun:0, newFound:[], result:null, recordShown:false, hintDone:{} });
  save.stats.runs++;
}

/* ---------------- effects ---------------- */
function pop(txt, x, y, c, s, d){ G.pops.push({ txt, x, y, c, s:s || 18, t:0, d:d || 1 }); if(G.pops.length > 26) G.pops.shift(); }
function burst(x, y, n, cols, sp, g){ const lim = save.opt.fx === 'low' ? 150 : 400; for(let i = 0; i < n && G.parts.length < lim; i++){ const a = rnd(0, TAU), s = rnd(.3, 1) * sp; G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s - sp * .3, g:g ?? G.R * 30, l:rnd(.35, .8), c:pick(cols), s:rnd(.08, .2) * G.R }); } }

/* ---------------- controls ---------------- */
function press(){
  if(G.state !== 'run') return;
  if(!G.air || G.coyote > 0){ G.vy = -G.R * PHYS.JUMP; G.air = true; G.coyote = 0; G.slam = false; AU.jump(); burst(G.x, G.y + G.R, 8, ['#ffffff', '#dff2ff'], G.R * 8); }
  else if(!G.slam){ G.slam = true; G.vy = Math.max(G.vy, G.R * PHYS.SLAM); AU.slamDown(); }
}

/* ---------------- swallowing ---------------- */
function eat(o){
  o.gone = true;
  const T = THING[o.id];
  const g = PHYS.GROW * growMul(save.up.grow) * (G.avalT > 0 ? 1.2 : 1);
  G.R = Math.sqrt(G.R * G.R + g * o.s * o.s);
  G.combo++; G.comboT = 0; G.maxCombo = Math.max(G.maxCombo, G.combo); G.eatenRun++; save.stats.eaten++;
  if(G.avalT <= 0){ G.meter += o.s > G.R * .5 ? 2 : 1; if(G.meter >= avalNeed(save.up.aval)) startAval(); }
  // it sticks to the ball where it touched
  G.stuck.push({ e:o.e, a:Math.atan2(o.y - G.y, o.x - G.x) - G.rot, s:o.s });
  if(G.stuck.length > 40) G.stuck.shift();
  burst(o.x, o.y, o.s > G.R * .4 ? 14 : 6, ['#ffffff', '#e8f6ff', '#bfe4ff'], G.R * 9);
  AU.eat(G.combo, o.s / G.R);
  if(o.s > G.R * .45) pop('+' + T.name.toUpperCase(), o.x, o.y - o.s * .8, '#ffffff', 17);
  if(!save.globe[o.id]){ save.globe[o.id] = 1; G.newFound.push(o.id); showToast('NEW IN YOUR SNOW GLOBE!', T.e + ' ' + T.name); AU.discover(); } else save.globe[o.id]++;
  if(G.combo > 0 && G.combo % 10 === 0){ pop('STREAK x' + G.combo + '!', G.x, G.y - G.R * 2.6, '#ffd23a', 22, 1.2); AU.streak(G.combo); }
  missionThing(o.id);
}
function crash(o){
  if(G.inv > 0 || G.state !== 'run') return;
  G.R *= .84; G.vx *= .25; G.vy = -G.R * 9; G.air = true; G.inv = 1; G.shake = 1.1; G.flash = .25;
  G.combo = 0; G.meter = Math.max(0, G.meter - 4);
  o.gone = true; o.smashed = true;
  burst(o.x, o.y, 26, ['#ffffff', '#a0b4c8', '#ffb070', '#8a6a4a'], G.R * 14);
  pop('CRASH!', G.x, G.y - G.R * 2.2, '#ff6a5a', 24);
  AU.crash();
}
function startAval(){
  G.avalT = 5 + save.up.aval * .2; G.meter = 0; G.avalsRun++; save.stats.avals++; missionAdd('aval', 1);
  G.flash = .5; G.shake = 1.2; G.slowT = .35;
  pop('AVALANCHE!', G.x + G.R * 3, G.y - G.R * 3, '#7df0ff', 34, 1.6);
  AU.avalanche(); SDK.happytime();
}

/* ---------------- missions ---------------- */
function missionVal(m){
  switch(m.k){ case 'size': return G.peak; case 'eat': return G.eatenRun; case 'cry': return G.cryRun; case 'combo': return G.maxCombo; default: return m.p; }
}
function missionAdd(k, n){ for(const m of save.missions) if(!m.done && m.k === k) m.p += n; missionTick(); }
function missionThing(id){ for(const m of save.missions) if(!m.done && m.k === 'thing' && THINGS[m.n].id === id) m.p = 1; }
function missionTick(){
  if(G.state !== 'run') return;
  for(const m of save.missions){
    if(m.done) continue;
    const v = m.k === 'thing' ? m.p : missionVal(m), need = m.k === 'thing' ? 1 : m.n;
    if(v >= need){ m.done = true; AU.mission(); showToast('MISSION COMPLETE ✓', MTYPES[m.k].t(m.n)); persist(); }
  }
}

/* ---------------- update ---------------- */
function update(rdt){
  G.rt += rdt;
  if(G.slowT > 0) G.slowT -= rdt;
  const dt = rdt * (G.slowT > 0 ? .4 : 1);
  const run = G.state === 'run', title = G.state === 'title', dying = G.state === 'dying';
  if(run) G.t += dt;
  const R = G.R;
  // --- rolling ---
  const aval = G.avalT > 0;
  const want = (title ? R * 7 : R * PHYS.SPD * (aval ? 1.45 : 1)) * (dying ? .2 : 1);
  G.vx += (want - G.vx) * Math.min(1, dt * (G.vx < want * .5 ? 1.2 : 2.2));
  G.x += G.vx * dt;
  G.rot += G.vx * dt / R;
  const gy = groundAt(G.x) - R;
  if(!G.air){
    const ny = G.y + G.vy * dt + R * PHYS.G * dt * dt;
    if(gy > ny + R * .05 && G.vy < R * 12){ G.air = true; G.coyote = .12; }
    else { G.vy = (gy - G.y) / dt; G.vy = clamp(G.vy, -R * 40, R * 40); G.y = gy; }
  }
  if(G.air){
    if(G.coyote > 0) G.coyote -= dt;
    G.vy += R * PHYS.G * dt; G.y += G.vy * dt;
    if(G.y >= gy){
      G.y = gy; G.air = false;
      const hard = G.vy > R * 30;
      if(G.slam){ G.slam = false; G.slamsRun++; save.stats.slams++; missionAdd('slam', 1); G.shake = Math.max(G.shake, .8); G.rings.push({ x:G.x, y:G.y + R, r:R, R:R * 5, t:0 });
        for(const o of G.things) if(!o.gone && o.s <= R * (aval ? 3.2 : .95) && Math.abs(o.x - G.x) < R * 4.5 && Math.abs(o.y - G.y) < R * 4) eat(o);
        pop('SLAM!', G.x, G.y - R * 2, '#bfe4ff', 22); AU.slam(); }
      else if(hard) AU.land();
      burst(G.x, G.y + R, hard ? 16 : 6, ['#ffffff', '#dff2ff'], R * 10);
      G.vy = 0;
    }
  }
  if(run){
    // --- sun melts you; the Avalanche doesn't care ---
    if(!aval){ const m = (.012 + G.t * .0009) * meltMul(save.up.frost) * (1 + G.tierRun * .16); G.R *= 1 - m * dt; }
    else { G.avalT -= dt; if(G.avalT <= 0) AU.avalEnd(); }
    if(G.inv > 0) G.inv -= dt;
    G.comboT += dt; if(G.comboT > 1.8) G.combo = 0;
    // --- collisions ---
    const Rn = G.R;
    for(const o of G.things){
      if(o.gone) continue;
      const dx = o.x - G.x; if(dx > Rn + o.s) break;
      if(dx < -Rn - o.s * 2){ if(!o.hop && o.s > Rn * .95 && !o.gone){ o.hop = true; if(o.sawAir){ G.hopsRun++; save.stats.hops++; missionAdd('hop', 1); G.meter += 2; pop('JUMPED!', G.x, G.y - Rn * 2, '#ffd23a', 20); AU.hop(); } } continue; }
      if(G.air && Math.abs(dx) < Rn + o.s * .5) o.sawAir = true;
      const d = Math.hypot(dx, o.y - G.y);
      if(d < Rn + o.s * .42){ if(o.s <= Rn * .95 || (aval && o.s <= Rn * 3.2)) eat(o); else crash(o); }
    }
    // crystals
    const mag = Rn * (2 + save.up.magnet * .6);
    for(const c of G.cry){
      if(c.got){ c.gt += rdt; continue; }
      const dx = c.x - G.x, dy = c.y - G.y, d = Math.hypot(dx, dy);
      if(d < mag){ c.x -= dx / d * Rn * 30 * dt; c.y -= dy / d * Rn * 30 * dt; }
      if(d < Rn * 1.1){ c.got = true; const v = 1 + save.up.value * .25; G.cryRun += v; save.cry += v; save.stats.cry += v; AU.crystal(); }
    }
    // tiers and records
    if(G.R > G.peak) G.peak = G.R;
    const tr = tierOf(G.R);
    if(tr > G.tierRun){ G.tierRun = tr; G.flash = .35; G.slowT = Math.max(G.slowT, .5); showBanner('TIER UP!', TIERS[tr].name); AU.tier(tr); if(tr >= 3) SDK.happytime(); }
    if(save.best > 0 && !G.recordShown && G.R * 2 > save.best){ G.recordShown = true; pop('NEW RECORD!', G.x, G.y - G.R * 3.2, '#ffd23a', 28, 1.6); AU.record(); }
    // tutorial nudges
    if(save.tut < 1){
      const big = G.things.find(o => !o.gone && o.s > G.R * .95 && o.x > G.x && o.x - G.x < G.R * 9);
      if(big && !G.hintDone.jump){ G.hintDone.jump = 1; showHint('TAP TO JUMP OVER BIG THINGS!'); G.slowT = 1.1; }
      if(G.hopsRun > 0 && !G.hintDone.slam){ G.hintDone.slam = 1; showHint('TAP AGAIN IN THE AIR TO SLAM!'); }
    }
    // melted away?
    if(G.t > 2.5 && (G.R < G.peak * .38 || G.R < G.R0 * .72)) endRun();
    missionTickSlow(dt);
  }
  if(dying){ G.dieT += rdt; G.R *= 1 - rdt * 1.2; if(G.dieT > 1.3) finishRun(); }
  // world upkeep
  generate();
  if((G.rt * 60 | 0) % 20 === 0){
    const cut = G.x - G.R * 40;
    let i = 0; while(i < G.pts.length - 2 && G.pts[i + 1].x < cut) i++; if(i) G.pts.splice(0, i);
    G.things = G.things.filter(o => o.x > cut && !(o.gone && o.x < G.x - G.R * 8));
    G.cry = G.cry.filter(c => c.x > cut && !(c.got && c.gt > .5));
  }
  G.stuck = G.stuck.filter(s => s.s > G.R * .07);
  for(const p of G.parts){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.l -= dt; } G.parts = G.parts.filter(p => p.l > 0);
  for(const p of G.pops){ p.t += rdt; p.y -= G.R * 1.5 * rdt; } G.pops = G.pops.filter(p => p.t < p.d);
  for(const r of G.rings) r.t += rdt; G.rings = G.rings.filter(r => r.t < .5);
  G.shake *= Math.pow(.02, rdt); if(G.flash > 0) G.flash = Math.max(0, G.flash - rdt * 2);
  G.tier = tierOf(G.R);
}
let _mt = 0;
function missionTickSlow(dt){ _mt += dt; if(_mt > .3){ _mt = 0; missionTick(); } }
function endRun(){ if(G.state !== 'run') return; G.state = 'dying'; G.dieT = 0; AU.melt(); pop('MELTED!', G.x, G.y - G.R * 2.5, '#ff9a5a', 26, 1.4); }
function finishRun(){
  if(G.state === 'over') return;
  G.state = 'over';
  const size = G.peak * 2, best = size > save.best, prevBest = save.best;
  save.best = Math.max(save.best, size); save.bestTier = Math.max(save.bestTier, G.tierRun);
  if(save.tut < 1) save.tut = 1;
  G.result = { size, best, prevBest, tier:G.tierRun, cry:Math.round(G.cryRun), eaten:G.eatenRun, newFound:G.newFound.slice(), allDone:save.missions.every(m => m.done) };
  if(best) SDK.happytime();
  persist();
  setTimeout(() => showResult(), 250);
}
function rankUp(){ const reward = rankReward(save.rank); save.cry += reward; save.rank++; save.missions = []; fillMissions(); persist(); SDK.happytime(); return reward; }
