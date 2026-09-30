'use strict';
/* =====================================================================
   ABYSS HOOK simulation (world units are metres; y grows downward).
   DOWN: the hook sinks; steer to dodge fish. A bite (or a jellyfish)
         ends the descent early. Reaching the end of the line turns it.
   UP:   every fish the hook touches is caught, until the hooks are full.
   REEL: a legendary on the line has to be reeled in by tapping.
   AIR:  the catch flies out of the water; tap fish to double them.
   ===================================================================== */
const G = {
  state:'title', t:0, rt:0, WW:20, depth:0, hx:10, tx:10, speed:12, maxD:40, deepest:0,
  fish:[], jelly:[], items:[], caught:[], air:[], parts:[], pops:[], rings:[], bubbles:[],
  cap:4, shield:0, genD:0, frenzyT:0, hookTimes:[], legendZones:{}, bait:'', sinkT:0,
  reel:null, runStats:null, result:null, shake:0, flash:0, cam:0, zone:0, snaps:0, combo:0,
};

/* ---------------- dive setup ---------------- */
const rod = () => rodById(save.rod);
function diveStats(){
  const r = rod(), b = G.bait;
  return {
    maxD:lineDepth(save.up.line), cap:hookCap(save.up.hooks) + r.cap,
    R:(catchR(save.up.magnet) + r.mag) * (b === 'wide' ? 2 : 1),
    shield:save.up.shield + r.shield,
    luck:(1 + save.up.luck * .1 + r.luck) * (b === 'glow' ? 3 : 1),
    val:(1 + save.up.value * .12) * r.val * masteryMul() * (b === 'golden' ? 2 : 1),
  };
}
function startDive(){
  const bait = save.equip && save.bait[save.equip] > 0 ? save.equip : '';
  if(bait){ save.bait[bait]--; if(save.bait[bait] <= 0) save.equip = ''; }
  G.bait = bait;
  const S = diveStats();
  Object.assign(G, { state:'down', t:0, depth:0, maxD:S.maxD, cap:S.cap, shield:S.shield, S, fish:[], jelly:[], items:[], caught:[], air:[], parts:[], pops:[], rings:[], genD:4, frenzyT:0, hookTimes:[], legendZones:{}, reel:null, result:null, deepest:0, snaps:0, combo:0, sinkT:bait === 'sinker' ? 1 : 0 });
  G.hx = G.tx = G.WW / 2;
  G.speed = Math.min(24, 10 + G.maxD * .014);
  G.runStats = { chests:[], frenzies:0, stung:0, bites:0 };
  generate(Math.min(G.maxD + 10, 60));
  save.stats.dives++;
  AU.splash(1); splashFx(G.hx, 0, 24);
  persist();
}

/* ---------------- world generation ---------------- */
function pickSpecies(z, luck){
  const list = zoneSpecies(z); let s = 0;
  const w = list.map(sp => { const v = RAR[sp.r].w * (sp.r === 'C' ? 1 : luck); s += v; return v; });
  let r = Math.random() * s; for(let i = 0; i < list.length; i++){ r -= w[i]; if(r <= 0) return list[i]; } return list[0];
}
function mkFish(sp, y){
  const dir = Math.random() < .5 ? -1 : 1, shinyP = 1 / 160 * (G.bait === 'glow' ? 3 : 1) * (1 + save.up.luck * .03);
  G.fish.push({ sp, x:rnd(-1, G.WW + 1), y, dir, v:sp.spd * rnd(.75, 1.25), ph:rnd(0, TAU), shiny:Math.random() < shinyP, hooked:false, gone:false, r:Math.min(1.8, sp.dl * .27), bumped:0 });
}
function generate(to){
  while(G.genD < to){
    const z = zoneAt(G.genD), Z = ZONES[z], per = Z.dens * G.WW / 20;
    G.genD += rnd(.6, 1.4) / per;
    mkFish(pickSpecies(z, G.S.luck), G.genD);
    if(z >= 1 && Math.random() < .06 + z * .01) G.jelly.push({ x:rnd(1, G.WW - 1), y:G.genD + rnd(-1, 1), vx:rnd(-.5, .5), ph:rnd(0, TAU), r:.55, gone:false });
    if(Math.random() < .018) G.items.push({ k:'chest', x:rnd(1.5, G.WW - 1.5), y:G.genD, tier:Math.random() < .08 + z * .02 ? 2 : Math.random() < .3 ? 1 : 0, got:false });
    if(Math.random() < .12){ const x0 = rnd(2, G.WW - 2); for(let i = 0; i < 5; i++) G.items.push({ k:'pearl', x:x0 + Math.sin(i) * .8, y:G.genD + i * .8, got:false }); }
    // legendaries lurk in the deeper half of each zone, once per dive
    const L = legendOf(z), next = ZONES[z + 1] ? ZONES[z + 1].top : Z.top + 800;
    if(!G.legendZones[z] && G.genD > lerp(Z.top, next, .5)){ G.legendZones[z] = 1; if(save.stats.dives > 3 && Math.random() < .3 + save.up.luck * .01) mkFish(L, G.genD + 2); }
  }
}

/* ---------------- effects ---------------- */
function pop(txt, x, y, c, s, d){ for(const q of G.pops) if(q.t < .5 && Math.abs(q.y - y) < 1 && Math.abs(q.x - x) < 5) y = q.y - 1.1; G.pops.push({ txt, x, y, c, s:s || 18, t:0, d:d || 1 }); if(G.pops.length > 30) G.pops.shift(); }
function burst(x, y, n, cols, sp){ const lim = save.opt.fx === 'low' ? 150 : 400; for(let i = 0; i < n && G.parts.length < lim; i++){ const a = rnd(0, TAU), s = rnd(.3, 1) * (sp || 6); G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, g:0, l:rnd(.4, .9), c:pick(cols), s:rnd(.06, .16) }); } }
function splashFx(x, y, n){ for(let i = 0; i < n; i++){ const a = -Math.PI / 2 + rnd(-.9, .9), s = rnd(4, 11); G.parts.push({ x:x + rnd(-.5, .5), y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, g:22, l:rnd(.5, 1), c:pick(['#ffffff', '#cfefff', '#9adcff']), s:rnd(.08, .2) }); } }

/* ---------------- value ---------------- */
function fishValue(c){ return Math.round(c.sp.val * (c.shiny ? 5 : 1) * G.S.val * (c.frenzy ? 1.5 : 1) * (c.snapped ? 2 : 1)); }

/* ---------------- phases ---------------- */
function turnUp(why){
  G.state = 'up'; G.deepest = Math.max(G.deepest, G.depth);
  if(why) pop(why, G.hx, G.depth - 1.4, why === 'MAX DEPTH' ? '#8affff' : '#ff8a6a', 20);
  AU.turn();
  missionEvent('depth', G.depth);
}
function hook(f){
  if(G.caught.length >= G.cap) return false;
  f.hooked = true;
  const c = { sp:f.sp, shiny:f.shiny, frenzy:G.frenzyT > 0, snapped:false, depth:G.depth };
  G.caught.push(c);
  G.hookTimes.push(G.rt); G.hookTimes = G.hookTimes.filter(t => G.rt - t < 1.3);
  if(G.frenzyT <= 0 && G.hookTimes.length >= 4){ G.frenzyT = 3.5; G.runStats.frenzies++; pop('FRENZY!', G.hx, G.depth - 2, '#ffd23a', 28, 1.4); AU.frenzy(); G.flash = .2; }
  const R = RAR[f.sp.r];
  AU.catchFish(G.caught.length, f.sp.r);
  burst(f.x, f.y, f.sp.r === 'C' ? 8 : 16, [f.sp.col, '#ffffff', f.shiny ? '#ffd23a' : f.sp.col2]);
  if(f.shiny) pop('✦ SHINY ' + f.sp.name.toUpperCase() + '!', f.x, f.y - 1, '#ffd23a', 20, 1.6);
  else if(f.sp.r === 'L') pop('LEGENDARY: ' + f.sp.name.toUpperCase() + '!', f.x, f.y - 1.5, '#ffb020', 24, 2);
  else if(f.sp.r !== 'C') pop(R.name.toUpperCase() + '!', f.x, f.y - .8, R.col, 16);
  if(!save.dex[f.sp.id]) pop('NEW!', f.x, f.y - 1.6, '#ffffff', 18, 1.2);
  if(G.caught.length === G.cap) pop('HOOKS FULL!', G.hx, G.depth - 2, '#8affff', 20);
  return true;
}
function update(rdt){
  G.rt += rdt;
  const dt = rdt;
  if(G.state === 'down' || G.state === 'up') G.t += dt;
  const S = G.S;
  // steering: the hook chases your finger, but not instantly
  if(G.state === 'down' || G.state === 'up'){ const mx = 16 * dt; G.hx += clamp(G.tx - G.hx, -mx, mx); G.hx = clamp(G.hx, .4, G.WW - .4); }
  if(G.state === 'down'){
    let sp = G.speed; if(G.sinkT > 0){ sp *= 5; if(G.depth > G.maxD * .6) G.sinkT = 0; }
    G.depth += sp * dt;
    generate(G.depth + 45);
    if(G.depth >= G.maxD){ G.depth = G.maxD; turnUp('MAX DEPTH'); }
    const z = zoneAt(G.depth); if(z !== G.zone){ G.zone = z; showZone(z); AU.setZone(z); }
    if(G.sinkT <= 0){
      for(const f of G.fish){
        if(f.hooked || f.gone || Math.abs(f.y - G.depth) > 4) continue;
        if(Math.hypot(f.x - G.hx, (f.y - G.depth) * 1.2) < f.r + .3){
          if(G.shield > 0){ G.shield--; f.bumped = .6; f.dir = f.x < G.hx ? -1 : 1; f.v *= 2.2; pop('BLOCKED!', G.hx, G.depth - 1, '#8affff', 18); AU.block(); burst(G.hx, G.depth, 10, ['#8affff', '#ffffff']); }
          else { G.runStats.bites++; hook(f); turnUp('BITE!'); G.shake = .4; break; }
        }
      }
      for(const j of G.jelly){ if(!j.gone && Math.hypot(j.x - G.hx, j.y - G.depth) < j.r + .3){ j.gone = true; G.runStats.stung++; AU.sting(); G.shake = .5; burst(j.x, j.y, 14, ['#ff7ad0', '#ffffff']); turnUp('STUNG!'); break; } }
    }
  } else if(G.state === 'up'){
    const full = G.caught.length >= G.cap;
    G.depth -= G.speed * 1.05 * (full ? 2 : 1) * dt;
    const z = zoneAt(Math.max(0, G.depth)); if(z !== G.zone){ G.zone = z; AU.setZone(z); }
    const R = S.R * (G.frenzyT > 0 ? 2.2 : 1);
    if(!full) for(const f of G.fish){
      if(f.hooked || f.gone || Math.abs(f.y - G.depth) > R + 4) continue;
      if(Math.hypot(f.x - G.hx, f.y - G.depth) < f.r + R){ if(!hook(f)) break; }
    }
    for(const j of G.jelly){
      if(!j.gone && Math.hypot(j.x - G.hx, j.y - G.depth) < j.r + .35){
        j.gone = true; G.runStats.stung++; AU.sting(); G.shake = .4; burst(j.x, j.y, 14, ['#ff7ad0', '#ffffff']);
        const lost = G.caught.pop(); if(lost){ const f = G.fish.find(q => q.hooked && q.sp === lost.sp && !q.gone); if(f){ f.hooked = false; f.gone = true; } pop('STUNG! -' + lost.sp.name, G.hx, G.depth - 1, '#ff7ad0', 16); } else pop('STUNG!', G.hx, G.depth - 1, '#ff7ad0', 16);
      }
    }
    if(G.depth <= 0){ G.depth = 0; surface(); }
  }
  // treasure on either leg
  if(G.state === 'down' || G.state === 'up'){
    for(const it of G.items){
      if(it.got) continue;
      const d = Math.hypot(it.x - G.hx, it.y - G.depth), rr = it.k === 'chest' ? 1 : .6;
      if(it.k === 'pearl' && d < S.R * 1.6){ it.x += (G.hx - it.x) * .2; it.y += (G.depth - it.y) * .2; }
      if(d < rr){ it.got = true; if(it.k === 'chest'){ G.runStats.chests.push(it.tier); pop(['CHEST!', 'SILVER CHEST!', 'GOLDEN CHEST!'][it.tier], it.x, it.y - 1, ['#d8a060', '#dfe8f0', '#ffd23a'][it.tier], 20); AU.chest(); burst(it.x, it.y, 20, ['#ffd23a', '#ffffff']); } else { const v = Math.max(1, Math.round(ZVAL[zoneAt(it.y)] * .3 * S.val)); G.pearls = (G.pearls || 0) + v; AU.pearl(); } }
    }
    if(G.frenzyT > 0) G.frenzyT -= dt;
  }
  if(G.state === 'reel'){
    const r = G.reel; r.t -= dt;
    if(r.p >= .999){ G.state = 'air'; pop('LANDED!', G.hx, -3, '#ffb020', 30, 1.6); AU.legend(); G.flash = .6; SDK.happytime(); hideReel(); launchAir(); }
    else { r.p = Math.max(0, r.p - dt * r.decay); }
    if(G.state === 'reel' && r.t <= 0){ const i = G.caught.findIndex(c => c.sp.r === 'L'); const c = G.caught.splice(i, 1)[0]; pop('IT GOT AWAY...', G.hx, -3, '#ff8a6a', 24, 1.6); AU.escape(); hideReel(); G.state = 'air'; G.escaped = c; launchAir(); }
  }
  if(G.state === 'air'){
    G.t += dt; let flying = 0;
    for(const a of G.air){
      if(a.wait > 0){ a.wait -= dt; flying++; if(a.wait <= 0){ AU.whoosh(); splashFx(a.x, 0, 6); } continue; }
      if(a.done) continue;
      a.vy += 18 * dt; a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vr * dt;
      if(a.y > .4 && a.vy > 0){ a.done = true; splashFx(a.x, 0, 5); } else flying++;
    }
    if(!flying && G.t > .6) finishDive();
  }
  // world motion
  const camY = G.cam;
  for(const f of G.fish){
    if(f.hooked || f.gone) continue;
    if(Math.abs(f.y - camY) > 60) continue;
    f.ph += dt * (3 + f.v);
    let v = f.v * (f.sp.shape === 'squid' ? (Math.sin(f.ph * .5) > .3 ? 2 : .4) : 1);
    if(f.bumped > 0){ f.bumped -= dt; } else f.v = Math.min(f.v, f.sp.spd * 1.3);
    f.x += f.dir * v * dt;
    if(f.x < -2.5) f.x = G.WW + 2.5; if(f.x > G.WW + 2.5) f.x = -2.5;
  }
  for(const j of G.jelly){ if(j.gone) continue; j.ph += dt; j.x += j.vx * dt; j.y += Math.sin(j.ph * 1.5) * .3 * dt; if(j.x < .5 || j.x > G.WW - .5) j.vx *= -1; }
  for(const p of G.parts){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.vx *= .97; p.l -= dt; } G.parts = G.parts.filter(p => p.l > 0);
  for(const p of G.pops){ p.t += rdt; p.y -= 1.2 * rdt; } G.pops = G.pops.filter(p => p.t < p.d);
  for(const r of G.rings) r.t += rdt; G.rings = G.rings.filter(r => r.t < .5);
  G.shake *= Math.pow(.02, rdt); if(G.flash > 0) G.flash = Math.max(0, G.flash - rdt * 2);
}
function surface(){
  AU.splash(1.4); splashFx(G.hx, 0, 30); G.shake = .3;
  if(!G.caught.length){ G.state = 'air'; G.t = 0; G.air = []; return; }
  if(G.caught.some(c => c.sp.r === 'L')){ G.state = 'reel'; const Lz = G.caught.find(c => c.sp.r === 'L').sp.z; G.reel = { t:5, p:.15, need:.075 - Lz * .005, decay:.06 + Lz * .03 }; showReel(G.caught.find(c => c.sp.r === 'L').sp); AU.legendHook(); return; }
  G.state = 'air'; launchAir();
}
function launchAir(){
  G.t = 0;
  const x0 = lerp(G.hx, G.WW / 2, .55); G.air = G.caught.map((c, i) => ({ c, x:x0 + rnd(-1, 1), y:0, vx:rnd(-4.5, 4.5), vy:-rnd(15, 21), wait:i * Math.max(.05, .9 / G.caught.length), rot:0, vr:rnd(-4, 4), done:false }));
}
function reelTap(){ if(G.state !== 'reel') return; G.reel.p = Math.min(1, G.reel.p + G.reel.need); AU.reelTap(); G.shake = Math.max(G.shake, .12); updateReel(); }
function snapAt(wx, wy){
  if(G.state !== 'air') return;
  let best = null, bd = 1e9;
  for(const a of G.air){ if(a.done || a.wait > 0 || a.c.snapped) continue; const d = Math.hypot(a.x - wx, a.y - wy); const lim = Math.max(1.4, a.c.sp.dl * .5); if(d < lim && d < bd){ bd = d; best = a; } }
  if(!best) return;
  best.c.snapped = true; G.snaps++; G.combo++;
  pop('+' + fmt(fishValue(best.c)) + (G.combo > 2 ? '  x' + G.combo : ''), best.x, best.y - 1, '#ffd23a', 20);
  burst(best.x, best.y, 16, ['#ffd23a', '#ffffff', best.c.sp.col], 8);
  AU.snap(G.combo);
}

/* ---------------- results ---------------- */
function missionEvent(){}
function finishDive(){
  if(G.state === 'tally') return;
  G.state = 'tally';
  const R = G.runStats, fish = G.caught;
  let coins = G.pearls || 0; G.pearls = 0;
  const lines = [], newIds = [];
  for(const c of fish){
    const v = fishValue(c); coins += v;
    const d = save.dex[c.sp.id] || (save.dex[c.sp.id] = { n:0, shiny:0, first:0 });
    if(!d.n && !newIds.includes(c.sp.id)) newIds.push(c.sp.id);
    d.n++; if(c.shiny){ d.shiny++; save.stats.shinies++; }
    if(c.sp.r === 'L') save.stats.legends++;
    lines.push({ sp:c.sp, v, shiny:c.shiny, snapped:c.snapped, isNew:false });
  }
  for(const l of lines) if(newIds.includes(l.sp.id)){ l.isNew = true; newIds.splice(newIds.indexOf(l.sp.id), 1, '*'); }
  const newSpecies = lines.filter(l => l.isNew).map(l => l.sp);
  const xp = fish.reduce((a, c) => a + c.sp.xp * (c.shiny ? 3 : 1), 0) + Math.round(G.deepest / 20);
  save.coins += coins; save.stats.coins += coins; save.stats.fish += fish.length; save.stats.snaps += G.snaps; save.stats.frenzies += R.frenzies;
  save.stats.deepest = Math.max(save.stats.deepest, Math.round(G.deepest));
  // levels
  const lvl0 = save.lvl; save.xp += xp; const lvlUps = [];
  while(save.xp >= xpNeed(save.lvl)){ save.xp -= xpNeed(save.lvl); save.lvl++; const g = 3 + (save.lvl / 3 | 0); save.gems += g; lvlUps.push({ lvl:save.lvl, gems:g, rods:RODS.filter(r => r.lvl === save.lvl) }); }
  // quests
  for(const q of save.quests){
    if(q.done) continue;
    switch(q.k){
      case 'catch': q.p += fish.length; break;
      case 'rare': q.p += fish.filter(c => 'REL'.includes(c.sp.r)).length; break;
      case 'depth': q.p = Math.max(q.p, G.deepest); break;
      case 'snap': q.p += G.snaps; break;
      case 'coins': q.p = Math.max(q.p, coins); break;
      case 'chest': q.p += R.chests.length; break;
      case 'frenzy': q.p += R.frenzies; break;
      case 'zone': q.p += fish.filter(c => c.sp.z === q.z).length; break;
    }
    if(q.p >= q.n) q.done = true;
  }
  const achNew = checkAch();
  G.result = { coins, lines, newSpecies, xp, lvlUps, deepest:Math.round(G.deepest), chests:R.chests.slice(), achNew, escaped:G.escaped || null, bait:G.bait, maxD:G.maxD };
  G.escaped = null;
  if(newSpecies.length || lvlUps.length || fish.some(c => c.shiny || c.sp.r === 'L')) SDK.happytime();
  persist();
  setTimeout(() => showTally(), 200);
}
function checkAch(){
  const got = [];
  const statOf = s => s === 'species' ? speciesFound() : s === 'lvl' ? save.lvl : save.stats[s] || 0;
  for(const a of ACH){
    const cur = save.ach[a.id] || 0, v = statOf(a.stat);
    let t = cur; while(t < a.tiers.length && v >= a.tiers[t]) t++;
    if(t > cur){ for(let i = cur; i < t; i++) got.push({ a, tier:i }); save.ach[a.id] = t; }
  }
  for(const g of got) save.gems += achReward(g.tier);
  return got;
}
function chestReward(tier){
  const deep = zoneAt(lineDepth(save.up.line));
  const r = Math.random();
  if(tier === 2){ if(r < .4) return { t:'gems', n:8 + (Math.random() * 8 | 0) }; if(r < .75){ const b = pick(BAITS); return { t:'bait', id:b.id, n:2 }; } return { t:'coins', n:Math.round(ZVAL[deep] * 60 * (1 + Math.random())) }; }
  if(tier === 1){ if(r < .35) return { t:'gems', n:3 + (Math.random() * 4 | 0) }; if(r < .55){ const b = pick(BAITS); return { t:'bait', id:b.id, n:1 }; } return { t:'coins', n:Math.round(ZVAL[deep] * 25 * (1 + Math.random())) }; }
  if(r < .12) return { t:'gems', n:1 + (Math.random() * 2 | 0) };
  return { t:'coins', n:Math.round(ZVAL[deep] * 10 * (1 + Math.random())) };
}
function grant(rw){
  if(rw.t === 'coins') save.coins += rw.n;
  else if(rw.t === 'gems') save.gems += rw.n;
  else if(rw.t === 'bait') save.bait[rw.id] = (save.bait[rw.id] || 0) + rw.n;
  persist();
}
