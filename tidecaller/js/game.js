'use strict';
/* =====================================================================
   TIDECALLER simulation.
   The boat sails by itself. The player moves the whole sea: raise the
   tide over reefs, lower it under sea caves, and throw the water up to
   launch the boat into the air. Land it level for a Perfect Splash.
   ===================================================================== */
const STEP = 20;
const G = {
  state:'title', t:0, rt:0,
  x:0, x0:0, speed:260, boost:0, slowT:0,
  surf:420, surfV:0, target:420,
  b:{ y:420, vy:0, ang:0, av:0, air:false, airT:0, rot:0, ground:false, sink:0 },
  hearts:3, maxHearts:3, inv:0, shake:0, flash:0,
  bed:{}, genX:0, ceil:[], mines:[], tent:[], items:[], deco:[],
  parts:[], pops:[], rings:[], hints:[], banner:null,
  dist:0, coinsRun:0, combo:1, comboT:0, perfects:0, perfRow:0, bestFlip:0, minesRun:0, cavesRun:0, bottlesRun:0, maxCombo:1, maxAir:0, nohitFrom:0, nohitBest:0,
  biome:0, biomeK:0, kraken:null, nextKraken:1800, lastHeartM:0, rain:[], bolt:0,
  newMission:[], result:null,
};

/* ---------------- terrain ---------------- */
function bedAt(x){
  const f = x / STEP, i = Math.floor(f), k = f - i;
  const a = G.bed[i] ?? WORLD.BED, b = G.bed[i + 1] ?? WORLD.BED;
  return a + (b - a) * k;
}
function raiseBed(x0, x1, fn){ // fn(t in 0..1) -> bed y; keeps the higher (smaller y) of old and new
  for(let i = Math.floor(x0 / STEP); i <= Math.ceil(x1 / STEP); i++){
    const x = i * STEP; if(x < x0 || x > x1) continue;
    const y = fn((x - x0) / (x1 - x0)); G.bed[i] = Math.min(G.bed[i] ?? WORLD.BED, y);
  }
}
function baseBed(x0, x1){ for(let i = Math.floor(x0 / STEP); i <= Math.ceil(x1 / STEP); i++){ const x = i * STEP; G.bed[i] = Math.min(G.bed[i] ?? 999, WORLD.BED - 18 + Math.sin(x * .004) * 12 + Math.sin(x * .011 + 1) * 6); } }
function ceilAt(x){ let y = -1e9; for(const c of G.ceil) if(x >= c.x0 && x <= c.x1) y = Math.max(y, c.y); return y; }

/* ---------------- generation ---------------- */
// room to swing the tide between hazards, scaled by how fast you'll be sailing there
const gapU = k => (255 + Math.min(265, (G.genX - G.x0) / 10 * .055)) * (k || .55);
const diff = () => clamp((G.genX - G.x0) / 10 / 4500, 0, 1);   // 0 at start, 1 at 4.5 km
function coinLine(x0, x1, y0, y1, n, kind){ for(let i = 0; i < n; i++){ const t = n === 1 ? .5 : i / (n - 1); G.items.push({ x:lerp(x0, x1, t), y:lerp(y0, y1, t), k:kind || 'coin', got:false, ph:Math.random() * TAU }); } }
function coinArc(xc, w, yBase, h, n, kind){ for(let i = 0; i < n; i++){ const t = i / (n - 1); G.items.push({ x:xc - w / 2 + w * t, y:yBase - Math.sin(t * Math.PI) * h, k:kind || 'coin', got:false, ph:Math.random() * TAU }); } }
function maybeBottle(x, y){ const p = .05 * (1 + save.up.luck * .25); if(Math.random() < p) G.items.push({ x, y, k:'bottle', got:false, ph:0 }); }
const PAT = {
  open(x, d){
    const L = rnd(500, 900) - d * 200; baseBed(x, x + L);
    const y = rnd(340, 470); coinLine(x + 120, x + L - 120, y, y + rnd(-60, 60), 6 + (Math.random() * 5 | 0));
    if(Math.random() < .5) G.deco.push({ x:x + rnd(100, L - 100), k:pick(['weed', 'shell', 'star', 'weed']) });
    maybeBottle(x + L * .5, rnd(250, 330));
    return L;
  },
  reef(x, d){
    const L = rnd(280, 520), peak = clamp(lerp(405, 300, d) + rnd(-25, 25), 280, 430); baseBed(x, x + L + 80);
    raiseBed(x, x + L, t => lerp(WORLD.BED, peak, Math.pow(Math.sin(t * Math.PI), .7)));
    coinArc(x + L / 2, L * .7, peak - 60, 30, 5);
    G.deco.push({ x:x + L / 2, k:'coral' }, { x:x + L * .3, k:'coral' });
    return L + gapU();
  },
  spikes(x, d){
    const n = 1 + (Math.random() * (1 + d * 2.5) | 0); let cx = x + 60; baseBed(x, x + 60 + n * 260);
    for(let i = 0; i < n; i++){ const w = rnd(70, 110), p = clamp(lerp(410, 310, d) + rnd(-25, 25), 285, 430); raiseBed(cx, cx + w, t => lerp(WORLD.BED - 10, p, 1 - Math.abs(t * 2 - 1))); G.items.push({ x:cx + w / 2, y:p - 50, k:'coin', got:false, ph:0 }); cx += w + rnd(140, 260); }
    return cx - x + gapU();
  },
  cave(x, d){
    const L = rnd(300, 620) + d * 200, y = clamp(lerp(400, 452, d) + rnd(-15, 15), 385, 465); baseBed(x, x + L + 60);
    G.ceil.push({ x0:x, x1:x + L, y, k:'rock', passed:false, seed:Math.random() * 1000 });
    coinLine(x + 60, x + L - 60, y + WORLD.TOP + 22, y + WORLD.TOP + 22, Math.max(3, L / 90 | 0));
    return L + gapU();
  },
  channel(x, d){
    const L = rnd(360, 640), gap = lerp(125, 78, d) + rnd(-6, 10), peak = clamp(lerp(510, 420, d) + rnd(-25, 25), 380, 540), y = peak - gap;
    baseBed(x - 40, x + L + 80);
    raiseBed(x - 60, x + L + 60, t => lerp(WORLD.BED, peak, clamp(Math.sin(t * Math.PI) * 1.6, 0, 1)));
    G.ceil.push({ x0:x, x1:x + L, y, k:'rock', passed:false, seed:Math.random() * 1000 });
    const mid = (y + WORLD.TOP + peak - WORLD.DRAFT) / 2 - 16; coinLine(x + 60, x + L - 60, mid, mid, Math.max(3, L / 80 | 0));
    return L + gapU(.7);
  },
  zigzag(x, d){
    let L = 0; L += PAT.reef(x, d * .8) - gapU() + gapU(.42); L += PAT.cave(x + L, d * .8) - gapU() + gapU(.42); if(Math.random() < .5 + d * .4) L += PAT.reef(x + L, d * .8);
    return L;
  },
  mines(x, d){
    const n = 1 + (Math.random() * (1 + d * 2.2) | 0), sp = rnd(420, 560) - d * 60; baseBed(x, x + n * sp + 200);
    for(let i = 0; i < n; i++){ const mx = x + 200 + i * sp; G.mines.push({ x:mx, hit:false, hop:false }); coinArc(mx, 220, 300, 110, 5); }
    return n * sp + 200;
  },
  sky(x, d){
    const L = 700; baseBed(x, x + L);
    coinArc(x + L / 2, 520, 330, 170 + d * 40, 9); G.items.push({ x:x + L / 2, y:120 - d * 20, k:'gem', got:false, ph:0 });
    maybeBottle(x + L / 2 + 60, 150);
    return L;
  },
  cavemine(x, d){ // a mine right after a cave: jump out of the dark
    let L = PAT.cave(x, d); L += 60; L += PAT.mines(x + L, d * .6); return L;
  },
};
const PAT_W = d => [
  ['open', 1.6 - d], ['reef', 1.4], ['cave', 1.3], ['spikes', .3 + d * .9], ['zigzag', d * 1.6], ['channel', d * 1.4],
  ['mines', d < .08 ? 0 : .5 + d * .9], ['sky', .55], ['cavemine', d < .3 ? 0 : d * .7],
];
function pickPat(d){ const W = PAT_W(d); let s = 0; for(const w of W) s += Math.max(0, w[1]); let r = Math.random() * s; for(const w of W){ r -= Math.max(0, w[1]); if(r <= 0) return w[0]; } return 'open'; }
const TUT = [['open', 0], ['reef', 0, 'RAISE THE TIDE ↑', 'reef'], ['open', 0], ['cave', 0, 'LOWER THE TIDE ↓', 'cave'], ['open', 0], ['sky', 0, 'FLICK UP FAST TO LAUNCH!', 'sky'], ['open', 0, 'PULL THE SEA DOWN TO CATCH IT SOFTLY!', 'flip'], ['sky', .2], ['open', 0], ['mines', .05, 'JUMP OVER THE MINE!', 'mine'], ['open', 0]];
function generate(){
  while(G.genX < G.x + 2600){
    const d = diff(), m = (G.genX - G.x0) / 10;
    // the Kraken rises every 2 km
    if(m >= G.nextKraken){ G.genX += krakenSection(G.genX, d); G.nextKraken += 2000; continue; }
    let L;
    if(G.tutQ && G.tutQ.length){ const [p, dd, hint, key] = G.tutQ.shift(); if(hint) G.hints.push({ x:G.genX + (p === 'mines' ? 0 : -60), txt:hint, key }); L = PAT[p](G.genX, dd); }
    else L = PAT[pickPat(d)](G.genX, d);
    // a spare heart now and then when you are hurt
    if(m - G.lastHeartM > 1400 && Math.random() < .35){ G.items.push({ x:G.genX + L * .5, y:rnd(260, 330), k:'heart', got:false, ph:0 }); G.lastHeartM = m; }
    G.genX += L;
  }
}
function krakenSection(x, d){
  const n = 6 + (d * 3 | 0), sp = (255 + Math.min(265, (x - G.x0) / 10 * .055)) * rnd(2.3, 2.6); baseBed(x, x + n * sp + 600);
  G.hints.push({ x:x - 500, txt:'THE KRAKEN RISES!', key:'kraken', big:true });
  for(let i = 0; i < n; i++){ const tx = x + 400 + i * sp; G.tent.push({ x:tx, h:rnd(120, 170) + d * 40, rise:0, hit:false, passed:false, ph:Math.random() * TAU, last:i === n - 1 }); coinArc(tx, 240, 260, 90, 4); }
  G.items.push({ x:x + 400 + n * sp + 120, y:200, k:'gem', got:false, ph:0 });
  return n * sp + 700;
}

/* ---------------- round ---------------- */
function resetWorld(){
  Object.assign(G, { bed:{}, ceil:[], mines:[], tent:[], items:[], deco:[], parts:[], pops:[], rings:[], hints:[], banner:null, kraken:null });
  G.x = 0; G.x0 = 0; G.genX = -600; baseBed(-800, 1200); G.genX = 900;
  G.surf = G.target = 420; G.surfV = 0;
  Object.assign(G.b, { y:420, vy:0, ang:0, av:0, air:false, airT:0, rot:0, ground:false, sink:0 });
  G.tutQ = save.tut < 1 ? TUT.map(t => t.slice()) : null;
  G.nextKraken = 1800; G.lastHeartM = 0;
  generate();
}
function startRun(){
  const sh = shipById(save.ship);
  G.ship = sh; G.maxHearts = sh.hearts + save.up.hull; G.hearts = G.maxHearts;
  Object.assign(G, { state:'run', t:0, speed:260, boost:0, slowT:0, inv:0, dist:0, coinsRun:0, combo:1, comboT:0, perfects:0, perfRow:0, bestFlip:0, minesRun:0, cavesRun:0, bottlesRun:0, maxCombo:1, maxAir:0, nohitFrom:0, nohitBest:0, newMission:[], result:null, runLetters:[] });
  save.stats.runs++;
}

/* ---------------- effects ---------------- */
function pop(txt, x, y, c, s, d){ G.pops.push({ txt, x, y, c, s:s || 18, t:0, d:d || 1 }); if(G.pops.length > 30) G.pops.shift(); }
function splash(x, y, n, pow){ const lim = save.opt.fx === 'low' ? 160 : 420; for(let i = 0; i < n && G.parts.length < lim; i++){ const a = -Math.PI / 2 + rnd(-1.1, 1.1); const s = rnd(120, 420) * pow; G.parts.push({ x:x + rnd(-24, 24), y, vx:Math.cos(a) * s - G.speed * .3, vy:Math.sin(a) * s, g:1100, l:rnd(.4, .9), c:pick(['#ffffff', '#dff8ff', '#bdefff']), s:rnd(2, 5) }); } }
function burst(x, y, n, cols, sp){ const lim = save.opt.fx === 'low' ? 160 : 420; for(let i = 0; i < n && G.parts.length < lim; i++){ const a = rnd(0, TAU), s = rnd(60, sp || 300); G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, g:200, l:rnd(.3, .8), c:pick(cols), s:rnd(2, 4.5) }); } }
function addCombo(n, why){ const was = G.combo; G.combo = Math.min(10, G.combo + n); G.comboT = 0; G.maxCombo = Math.max(G.maxCombo, G.combo); if(G.combo > was){ AU.combo(G.combo); if(G.combo >= 5 && was < 5) SDK.happytime(); } missionTick(); }

/* ---------------- damage ---------------- */
function crash(why, x, y){
  if(G.inv > 0 || G.state !== 'run') return;
  G.hearts--; G.inv = 1.7; G.shake = 16; G.flash = .35;
  G.combo = 1; G.comboT = 0; G.perfRow = 0;
  G.nohitBest = Math.max(G.nohitBest, G.dist - G.nohitFrom); G.nohitFrom = G.dist;
  G.speed *= .55; G.boost = 0;
  const b = G.b; b.vy = Math.min(b.vy, -380); b.air = true; b.av = rnd(-7, -4); b.airT = 0; b.rot = 0; b.hurt = true;
  burst(x ?? G.x, y ?? b.y - 10, 30, ['#ffffff', '#ffb070', '#ff5a3c', '#8a6a4a'], 360);
  AU.crash(why);
  pop(why === 'mine' ? 'BOOM!' : why === 'tent' ? 'WHACK!' : 'CRUNCH!', G.x, b.y - 70, '#ff5a3c', 26);
  if(G.hearts <= 0){ G.state = 'dying'; G.dieT = 0; AU.sink(); }
}

/* ---------------- landing ---------------- */
function land(){
  const b = G.b, sh = G.ship, flips = Math.round(Math.abs(b.rot) / TAU), rel = b.vy - G.surfV;
  splash(G.x, G.surf, rel > 700 ? 26 : 12, rel > 700 ? 1.2 : .7);
  G.rings.push({ x:G.x, y:G.surf, r:10, R:rel > 700 ? 120 : 70, t:0 });
  b.air = false; b.ang = angNorm(b.ang) * .5; b.av = 0; b.rot = 0;
  if(b.hurt){ b.hurt = false; b.ang = 0; AU.splash(.6); return; }
  if(b.airT > G.maxAir) G.maxAir = b.airT;
  if(b.airT < .5){ AU.splash(.4); missionTick(); return; }
  if(flips){ G.bestFlip = Math.max(G.bestFlip, flips); save.stats.flips += flips; }
  const label = flips >= 3 ? 'TRIPLE FLIP!' : flips === 2 ? 'DOUBLE FLIP!' : flips === 1 ? 'FLIP!' : '';
  if(rel < Math.max(420, b.vy * .55) * sh.land){
    // PERFECT CATCH: the sea met the boat softly
    G.perfects++; G.perfRow++; save.stats.perfects++;
    G.boost = 240; G.flash = .12;
    addCombo(1 + flips);
    pop(label || 'PERFECT CATCH!', G.x, b.y - 80, label ? '#ffd23a' : '#7dff9a', label ? 30 : 24, 1.2);
    if(label) pop('PERFECT CATCH', G.x, b.y - 48, '#7dff9a', 16, 1.2);
    AU.perfect(flips);
    burst(G.x, G.surf - 10, 24, ['#ffffff', '#7dff9a', '#ffd23a'], 320);
  } else if(rel < 1380){
    G.perfRow = 0;
    if(flips){ addCombo(flips); pop(label, G.x, b.y - 70, '#ffd23a', 24); } else pop('SPLASH', G.x, b.y - 60, '#bdefff', 16);
    AU.splash(1);
  } else {
    // belly flop: costs the combo, not a heart
    G.perfRow = 0; G.combo = 1; G.comboT = 0; G.shake = 8;
    pop(flips ? label + ' BELLY FLOP!' : 'BELLY FLOP!', G.x, b.y - 80, '#ff9a5a', 22, 1.1);
    AU.splash(1.4); AU.scrape();
  }
  missionTick();
}

/* ---------------- missions ---------------- */
function missionVal(m){
  switch(m.k){
    case 'dist': return G.dist; case 'coins': return G.coinsRun; case 'perfect': return G.perfects; case 'flip': return G.bestFlip;
    case 'combo': return G.maxCombo; case 'nohit': return Math.max(G.nohitBest, G.dist - G.nohitFrom); case 'air': return Math.floor(G.maxAir * 10) / 10;
    default: return m.p;
  }
}
function missionAdd(k, n){ for(const m of save.missions) if(!m.done && m.k === k) m.p += n; missionTick(); }
function missionTick(){
  if(G.state !== 'run') return;
  for(const m of save.missions){
    if(m.done) continue;
    if(missionVal(m) >= m.n){ m.done = true; G.newMission.push(m); AU.mission(); showToast('MISSION COMPLETE', MTYPES[m.k].t(m.n)); persist(); }
  }
}

/* ---------------- update ---------------- */
function update(rdt){
  G.rt += rdt;
  const dt = rdt * (G.slowT > 0 ? .5 : 1); if(G.slowT > 0) G.slowT -= rdt;
  G.t += dt;
  const b = G.b, run = G.state === 'run', dying = G.state === 'dying';
  // --- the tide follows your hand ---
  const tmax = tidePow(save.up.tide);
  const want = clamp((G.target - G.surf) * 16, -tmax, tmax);
  const acc = 14000 * dt; G.surfV += clamp(want - G.surfV, -acc, acc);
  G.surf += G.surfV * dt;
  // how far the sea has travelled upward in this one motion: a real flick is a long, fast stroke
  if(G.surfV < -150){ G.stroke = (G.stroke || 0) - G.surfV * dt; G.peakV = Math.min(G.peakV || 0, G.surfV); }
  else if(G.surfV > -40){ G.stroke = Math.max(0, (G.stroke || 0) - 1200 * dt); if(!G.stroke) G.peakV = 0; }
  if(G.surf < WORLD.SURF_MIN){ G.surf = WORLD.SURF_MIN; G.surfV = Math.max(0, G.surfV); }
  if(G.surf > WORLD.SURF_MAX){ G.surf = WORLD.SURF_MAX; G.surfV = Math.min(0, G.surfV); }
  // --- sailing ---
  if(run || G.state === 'title'){
    const base = run ? 255 + Math.min(265, G.dist * .055) : 45;
    G.speed = lerp(G.speed, base + G.boost, 1 - Math.exp(-dt * 1.4));
    G.boost = Math.max(0, G.boost - dt * 160);
  } else if(dying) G.speed *= Math.exp(-dt * 2);
  G.x += G.speed * dt;
  if(run){ G.dist = (G.x - G.x0) / 10; generate(); }
  // --- the boat ---
  const bed = bedAt(G.x);
  if(!b.air){
    const tv = G.surfV - (b.y - G.surf) * 11;
    b.vy += (tv - b.vy) * Math.min(1, dt * 12);
    // the water stops rising but the boat keeps going: LAUNCH (only after a real flick)
    if(!dying && G.stroke > 150 && G.peakV < -650 && G.surfV > -260 && b.y < G.surf + 30){
      const h = Math.min(G.stroke * 1.05, 440) * (G.ship ? G.ship.lift : 1) * (tidePow(save.up.tide) / tidePow(0));
      b.air = true; b.airT = 0; b.rot = 0; b.spun = false; b.vy = -Math.sqrt(2 * WORLD.G * h); G.stroke = 0; G.peakV = 0;
      b.av = -Math.max(0, -b.vy - 450) / 95; b.apex = false;
      AU.launch(-b.vy);
      splash(G.x, G.surf, 14, .9);
    }
    // waves tilt the hull
    const slope = (waveY(G.x + 20) - waveY(G.x - 20)) / 40;
    b.ang = lerp(b.ang, Math.atan(slope) * .8 + Math.sin(G.t * 2.4) * .04 - clamp(G.surfV / 3000, -.25, .25), 1 - Math.exp(-dt * 8));
  } else {
    b.vy += WORLD.G * dt; b.airT += dt;
    if(!b.hurt){
      // at the top of the jump, pace the spin so the boat comes down the right way up
      if(!b.apex && b.vy >= 0){
        b.apex = true;
        const tf = Math.max(.15, Math.sqrt(Math.max(0, 2 * (G.surf - b.y) / WORLD.G)));
        if(Math.abs(b.av) > .5){ const k = Math.round((b.rot + b.av * tf) / TAU), goal = (k === 0 ? Math.sign(b.av) : k) * TAU; b.av = (goal - b.rot) / tf; }
      }
      if(Math.abs(b.av) < .5 && Math.abs(b.rot) < .5){ b.av = 0; b.ang = lerp(b.ang, -.2 + clamp(b.vy / 1600, -.25, .45), 1 - Math.exp(-dt * 4)); }
      else if(b.apex && G.surf - b.y < 60){ const goal = Math.round(b.rot / TAU) * TAU; b.av = (goal - b.rot) * 14; }
    }
    const d = b.av * dt; b.ang += d; b.rot += d;
    if(b.y >= G.surf - 1 && (b.vy > 0 || b.airT > .2)) land();
  }
  b.y += b.vy * dt;
  if(!b.air && b.y < G.surf - 60) b.y = G.surf - 60;
  // resting on the sea floor
  b.ground = false;
  if(b.y + WORLD.DRAFT > bed){ b.y = bed - WORLD.DRAFT; if(b.vy > 0) b.vy = 0; b.ground = true; if(b.air && !dying){ b.air = false; b.hurt = false; b.rot = 0; b.av = 0; } }
  if(dying){ G.dieT += rdt; b.sink += rdt; b.ang = lerp(b.ang, .9, dt * 2); if(G.dieT > 1.6) gameOver(); }
  if(G.inv > 0) G.inv -= rdt;
  // --- hazards ---
  if(run){
    const top = b.y - WORLD.TOP * Math.max(.4, Math.cos(b.ang)), bot = b.y + WORLD.DRAFT;
    // sea floor rock faces
    const front = bedAt(G.x + WORLD.HALF - 4);
    if(front < b.y + WORLD.DRAFT - 12) crash('rock', G.x + WORLD.HALF, front);
    if(b.ground && !b.air){ G.speed = Math.max(90, G.speed - 260 * dt); if(G.combo > 1 && G.rt - (G.scrapeT || 0) > .6){ G.scrapeT = G.rt; G.combo = Math.max(1, G.combo - 1); pop('SCRAPE', G.x, b.y - 50, '#ffb070', 14); AU.scrape(); } }
    // cave ceilings
    for(const c of G.ceil){
      if(c.x0 > G.x + WORLD.HALF || c.x1 < G.x - WORLD.HALF){ if(!c.passed && c.x1 < G.x - WORLD.HALF){ c.passed = true; if(!c.hit){ G.cavesRun++; save.stats.caves++; missionAdd('caves', 1); if(c.close){ pop('CLOSE SHAVE!', G.x, b.y - 60, '#7dd8ff', 18); addCombo(1); } } } continue; }
      if(top < c.y){ c.hit = true; crash('ceil', G.x, c.y); }
      else if(top - c.y < 16) c.close = true;
    }
    // floating mines
    for(const m of G.mines){
      if(m.hit || m.hop) continue;
      const my = waveY(m.x) - 6;
      if(Math.hypot(m.x - G.x, my - (b.y - 10)) < 36){ m.hit = true; crash('mine', m.x, my); G.rings.push({ x:m.x, y:my, r:10, R:140, t:0, c:'#ff8a3a' }); }
      else if(m.x < G.x - 30){ m.hop = true; if(b.air){ G.minesRun++; save.stats.mines++; missionAdd('mines', 1); addCombo(1); pop('MINE HOP!', G.x, b.y - 70, '#ffd23a', 22); AU.hop(); } }
    }
    // kraken tentacles
    for(const t of G.tent){
      if(t.x - G.x < 780) t.rise = Math.min(1, t.rise + dt * 2.2);
      if(t.hit || t.passed) continue;
      const ty = G.surf - t.h * t.rise;
      if(Math.abs(t.x - G.x) < 26 + WORLD.HALF * .6 && bot > ty + 8 && t.rise > .3){ t.hit = true; crash('tent', t.x, b.y); }
      else if(t.x < G.x - 40){ t.passed = true; addCombo(1); pop('DODGED!', G.x, b.y - 70, '#c07aff', 20); AU.hop(); if(t.last){ const bonus = Math.round(300 * coinMul(save.up.value)); G.coinsRun += bonus; save.coins += bonus; save.stats.kraken++; pop('KRAKEN ESCAPED! +' + bonus, G.x, b.y - 120, '#c07aff', 26, 2); AU.kraken(); SDK.happytime(); } }
    }
    // pickups
    const mr = magR(save.up.magnet, G.ship.magnet);
    for(const it of G.items){
      if(it.got) continue;
      const dx = it.x - G.x, dy = it.y - (b.y - 16), d = Math.hypot(dx, dy);
      if(d < mr && it.k !== 'bottle'){ it.x -= dx / d * 900 * dt; it.y -= dy / d * 900 * dt; }
      if(d < 30) collect(it);
    }
    // hints
    for(const h of G.hints){ if(!h.shown && h.x - G.x < 520){ h.shown = true; showHint(h.txt, h.big); if(h.key === 'mine') G.slowT = Math.max(G.slowT, .9); } }
    // combo cools off if you stop doing tricks
    G.comboT += dt; if(G.combo > 1 && G.comboT > 8){ G.combo--; G.comboT = 4; }
    // biome
    const bi = biomeAt(G.dist); if(bi !== G.biome){ G.biome = bi; G.biomeK = 0; showBanner(BIOMES[bi].name); AU.setBiome(bi); }
    missionTickSlow(dt);
  }
  G.biomeK = Math.min(1, G.biomeK + dt / 2.5);
  // particles and text
  for(const p of G.parts){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.l -= dt; }
  G.parts = G.parts.filter(p => p.l > 0);
  for(const p of G.pops){ p.t += rdt; p.y -= 34 * rdt; } G.pops = G.pops.filter(p => p.t < p.d);
  for(const r of G.rings){ r.t += dt; } G.rings = G.rings.filter(r => r.t < .6);
  G.shake *= Math.pow(.01, rdt); if(G.flash > 0) G.flash = Math.max(0, G.flash - rdt * 2);
  // forget what is far behind
  if((G.rt * 60 | 0) % 30 === 0){
    const cut = G.x - 1400, ci = Math.floor(cut / STEP);
    for(const k in G.bed) if(+k < ci) delete G.bed[k];
    G.ceil = G.ceil.filter(c => c.x1 > cut); G.mines = G.mines.filter(m => m.x > cut); G.tent = G.tent.filter(t => t.x > cut);
    G.items = G.items.filter(i => i.x > cut && !(i.got && i.gt > 1)); G.deco = G.deco.filter(d => d.x > cut); G.hints = G.hints.filter(h => h.x > cut);
  }
  for(const it of G.items) if(it.got) it.gt = (it.gt || 0) + rdt;
}
let _mt = 0;
function missionTickSlow(dt){ _mt += dt; if(_mt > .25){ _mt = 0; missionTick(); } }
function collect(it){
  it.got = true; it.gt = 0;
  const sh = G.ship, mul = coinMul(save.up.value) * sh.coin;
  if(it.k === 'coin'){ const v = Math.max(1, Math.round(G.combo * mul)); G.coinsRun += v; save.coins += v; AU.coin(G.combo); if(v > 1) pop('+' + v, it.x, it.y - 10, '#ffd23a', 14, .6); }
  else if(it.k === 'gem'){ const v = Math.round(25 * G.combo * mul); G.coinsRun += v; save.coins += v; AU.gem(); pop('+' + v, it.x, it.y - 14, '#7df0ff', 22); burst(it.x, it.y, 18, ['#7df0ff', '#ffffff', '#c07aff'], 260); }
  else if(it.k === 'heart'){ if(G.hearts < G.maxHearts){ G.hearts++; pop('+1 ❤', it.x, it.y - 14, '#ff5a7a', 22); } else { const v = Math.round(20 * mul); G.coinsRun += v; save.coins += v; pop('+' + v, it.x, it.y, '#ffd23a', 18); } AU.heart(); }
  else if(it.k === 'bottle'){
    G.bottlesRun++; save.stats.bottles++; missionAdd('bottles', 1); AU.bottle();
    const nx = LETTERS.findIndex((_, i) => !save.letters.includes(i));
    if(nx >= 0 && Math.random() < .7){ save.letters.push(nx); G.runLetters.push(nx); pop('MESSAGE IN A BOTTLE!', it.x, it.y - 20, '#fff0c0', 22, 1.6); showToast('MESSAGE IN A BOTTLE', 'Letter ' + (nx + 1) + ' of ' + LETTERS.length + ' found. Read it in the Logbook.'); }
    else { const v = Math.round(rnd(60, 160) * mul); G.coinsRun += v; save.coins += v; pop('TREASURE! +' + v, it.x, it.y - 20, '#ffd23a', 22, 1.4); }
    burst(it.x, it.y, 20, ['#fff0c0', '#ffd23a', '#ffffff'], 240);
  }
}
function waveY(x){
  const bi = BIOMES[G.biome], amp = bi.id === 'storm' ? 1.8 : 1;
  return G.surf + (Math.sin(x * .012 + G.t * 2.1) * 4 + Math.sin(x * .031 - G.t * 3.3) * 2.2) * amp;
}
function gameOver(){
  if(G.state === 'over') return;
  G.state = 'over';
  const d = Math.floor(G.dist), best = d > save.best;
  G.nohitBest = Math.max(G.nohitBest, G.dist - G.nohitFrom);
  save.best = Math.max(save.best, d); save.stats.dist += d; save.stats.coins += G.coinsRun; save.stats.bestCombo = Math.max(save.stats.bestCombo, G.maxCombo);
  if(save.tut < 1) save.tut = 1;
  const allDone = save.missions.every(m => m.done);
  G.result = { dist:d, best, coins:G.coinsRun, allDone, letters:G.runLetters.slice() };
  if(best) SDK.happytime();
  persist();
  setTimeout(() => showResult(), 400);
}
function rankUp(){
  const reward = rankReward(save.rank);
  save.coins += reward; save.rank++;
  save.missions = []; fillMissions();
  persist(); SDK.happytime();
  return reward;
}
