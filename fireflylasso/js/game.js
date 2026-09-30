'use strict';
/* =====================================================================
   FIREFLY LASSO simulation.
   Your finger leaves a glowing rope. When the rope crosses itself it
   closes a loop, and every firefly inside is caught. Each firefly in a
   loop multiplies the others, so bigger loops are worth far more.
   ===================================================================== */
const G = {
  state:'title', mode:'night', spec:null, W:960, H:600, t:0, rt:0, time:45, timeLeft:45,
  light:0, shown:0, flies:[], wasps:[], bats:[], webs:[], trail:[], trailLen:0, drawing:false,
  snapT:0, streak:0, streakT:0, bestLoop:0, loops:0, caughtN:0, pops:[], parts:[], rings:[], fx:[], shards:[],
  slowT:0, bottleUsed:false, swarmT:6, batT:5, gust:0, windPh:0, lantern:1, queen:null, queenDone:false,
  newSpecies:[], result:null, mothDone:false, shadowDone:false, catches:0,
};
const PTR = { x:0, y:0, wx:0, wy:0, down:false, id:-1, in:false };

/* ---------------- spawning ---------------- */
function pickSpecies(){
  const sp = G.spec, luck = 1 + save.up.luck * .2;
  const w = sp.pool.map(k => [k, k === 'gold' ? .05 * luck : k === 'star' ? .035 * luck : k === 'glow' ? 1.2 : k === 'mint' ? .7 : k === 'rose' ? .35 : .45]);
  let s = 0; for(const [, v] of w) s += v; let r = Math.random() * s;
  for(const [k, v] of w){ r -= v; if(r <= 0) return k; } return 'glow';
}
function mkFly(k, x, y){
  const S = SPECIES[k], a = rnd(0, TAU);
  const f = { sp:k, x, y, vx:Math.cos(a) * S.spd, vy:Math.sin(a) * S.spd, wa:a, ph:rnd(0, TAU), fade:0, alive:true, vis:1, age:0 };
  G.flies.push(f); return f;
}
function spawnFly(near){
  const k = pickSpecies(); let x, y, g = 0;
  do { x = rnd(40, G.W - 40); y = rnd(40, G.H - 40); g++; } while(g < 12 && (Math.hypot(x - PTR.wx, y - PTR.wy) < 160 || G.webs.some(w => Math.hypot(x - w.x, y - w.y) < w.r + 20)));
  if(near){ x = near.x + rnd(-40, 40); y = near.y + rnd(-40, 40); }
  const f = mkFly(k, x, y);
  if(k === 'rose'){ const m = mkFly('rose', x + 12, y); f.mate = m; m.mate = f; }
  return f;
}
function spawnSwarm(){
  const cx = rnd(140, G.W - 140), cy = rnd(120, G.H - 120), n = 10 + (Math.random() * 7 | 0) + (G.spec.n > 10 ? 3 : 0);
  const mono = Math.random() < .5 ? pickSpecies() : null;
  const sw = { x:cx, y:cy, t:7 };
  for(let i = 0; i < n; i++){ const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 55; const f = mkFly(mono || pickSpecies(), cx + Math.cos(a) * r, cy + Math.sin(a) * r); f.swarm = sw; }
  G.rings.push({ x:cx, y:cy, r:140, R:40, t:0, col:'#fff6c0', inward:1 });
  pop('SWARM!', cx, cy - 70, '#fff6c0', 22); AU.swarm();
}

/* ---------------- rounds ---------------- */
function resetRound(){
  Object.assign(G, { flies:[], wasps:[], bats:[], webs:[], trail:[], trailLen:0, pops:[], parts:[], rings:[], fx:[], shards:[], light:0, shown:0, t:0, snapT:0, streak:0, streakT:0, bestLoop:0, loops:0, caughtN:0, slowT:0, bottleUsed:false, queen:null, queenDone:false, newSpecies:[], result:null, mothDone:false, shadowDone:false, catches:0, lantern:1, gust:0, caughtFx:[], ghost:null });
}
function startNight(n){
  resetRound();
  G.mode = 'night'; G.spec = nightSpec(n);
  const R = mulberry32(G.spec.seed);
  G.time = G.timeLeft = G.spec.time + save.up.time * 3;
  for(let i = 0; i < G.spec.webs; i++) G.webs.push({ x:lerp(160, G.W - 160, R()), y:lerp(130, G.H - 130, R()), r:38 + R() * 22, rot:R() * TAU });
  for(let i = 0; i < popTarget(); i++) spawnFly();
  for(let i = 0; i < G.spec.wasps; i++) spawnWasp(true);
  G.swarmT = 5; G.batT = 6;
  G.state = 'play';
}
function startHunt(){
  resetRound();
  G.mode = 'hunt'; G.spec = nightSpec(Math.max(12, save.maxNight)); G.spec.webs = 0; G.spec.bats = 1; G.spec.wind = 0; G.spec.place = 0;
  G.spec.pool = SP_IDS.filter(k => SPECIES[k].from > 0 && SPECIES[k].from <= 40 && !SPECIES[k].secret && !SPECIES[k].boss);
  G.time = G.timeLeft = 1e9;
  for(let i = 0; i < popTarget(); i++) spawnFly();
  G.swarmT = 4; G.batT = 12; G.lantern = 1;
  G.state = 'play';
}
const popTarget = () => Math.round(G.spec.pop * (1 + save.up.lure * .1));
function spawnWasp(first){
  const side = Math.random() < .5, x = first ? rnd(80, G.W - 80) : side ? -30 : G.W + 30, y = rnd(60, G.H - 60);
  G.wasps.push({ x, y, vx:0, vy:0, tx:rnd(60, G.W - 60), ty:rnd(60, G.H - 60), r:13, ph:rnd(0, TAU), gone:0, spd:70 + Math.min(60, G.spec.n * 1.5) });
}

/* ---------------- geometry ---------------- */
function segX(a, b, c, d){ // intersection point of segments ab and cd, or null
  const r1 = b.x - a.x, r2 = b.y - a.y, s1 = d.x - c.x, s2 = d.y - c.y, den = r1 * s2 - r2 * s1;
  if(Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * s2 - (c.y - a.y) * s1) / den, u = ((c.x - a.x) * r2 - (c.y - a.y) * r1) / den;
  return t > 0 && t < 1 && u > 0 && u < 1 ? { x:a.x + r1 * t, y:a.y + r2 * t } : null;
}
function inPoly(x, y, P){ let c = false; for(let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; }
function polyArea(P){ let s = 0; for(let i = 0, j = P.length - 1; i < P.length; j = i++) s += (P[j].x + P[i].x) * (P[j].y - P[i].y); return Math.abs(s / 2); }
function segDist(px, py, a, b){ const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy; let t = l ? ((px - a.x) * dx + (py - a.y) * dy) / l : 0; t = clamp(t, 0, 1); return Math.hypot(px - a.x - dx * t, py - a.y - dy * t); }
function polyEdgeDist(x, y, P){ let m = 1e9; for(let i = 0, j = P.length - 1; i < P.length; j = i++) m = Math.min(m, segDist(x, y, P[j], P[i])); return m; }

/* ---------------- the lasso ---------------- */
function trailAdd(x, y){
  if(G.state !== 'play') return;
  if(G.snapT > 0) return;
  const T = G.trail, last = T[T.length - 1];
  if(last && Math.hypot(x - last.x, y - last.y) < 7) return;
  const p = { x, y, t:G.rt };
  if(last){
    // did this new piece of rope cross an older piece? then a loop just closed
    for(let i = T.length - 3; i >= 1; i--){
      const I = segX(T[i - 1], T[i], last, p);
      if(I){ closeLoop([I].concat(T.slice(i, T.length)), I); G.trail = [I, p]; G.trailLen = Math.hypot(p.x - I.x, p.y - I.y); return; }
    }
    // forgiving: coming back close to an older part of the rope also closes the loop
    for(let i = 0; i < T.length - 12; i++){
      if(Math.hypot(p.x - T[i].x, p.y - T[i].y) < 22){ const P = T.slice(i).concat([p]); closeLoop(P, T[i]); G.trail = [p]; G.trailLen = 0; return; }
    }
    G.trailLen += Math.hypot(p.x - last.x, p.y - last.y);
  }
  T.push(p);
  // the rope has a fixed length: the tail is pulled in as you draw
  const L = ropeLen(save.up.rope);
  while(G.trailLen > L && T.length > 2){ G.trailLen -= Math.hypot(T[1].x - T[0].x, T[1].y - T[0].y); T.shift(); }
  AU.draw();
}
function snap(x, y, why){
  if(G.trail.length < 2) return;
  for(let i = 1; i < G.trail.length; i += 2){ const a = G.trail[i - 1], b = G.trail[i]; G.shards.push({ x1:a.x, y1:a.y, x2:b.x, y2:b.y, vx:rnd(-40, 40), vy:rnd(-60, 20), t:0 }); }
  G.trail = []; G.trailLen = 0; G.snapT = .35;
  if(G.streak > 1) pop('CHAIN LOST', x, y - 30, '#ff8a8a', 14);
  G.streak = 0;
  pop(why === 'web' ? 'TANGLED!' : why === 'bat' ? 'SWOOSH!' : 'SNAP!', x, y, '#ff5a5a', 20); AU.snap(); G.shake = 6;
}
function closeLoop(P, I){
  const area = polyArea(P);
  G.fx.push({ P:P.map(p => ({ x:p.x, y:p.y })), t:0, ok:false });
  if(area < 700) return;
  const got = [];
  for(const f of G.flies){ if(f.alive && f.fade > .5 && f.vis > .5 && inPoly(f.x, f.y, P)) got.push(f); }
  let shoo = 0;
  for(const w of G.wasps){ if(!w.gone && inPoly(w.x, w.y, P)){ w.gone = 1; w.vx = (w.x - I.x) * 3; w.vy = -260; shoo++; } }
  let queen = false;
  const q = G.queen; if(q && !q.caught && inPoly(q.x, q.y, P) && polyEdgeDist(q.x, q.y, P) > SPECIES.queen.r * .6){ queen = true; q.caught = true; }
  G.fx[G.fx.length - 1].ok = got.length > 0 || shoo > 0 || queen;
  let cx = 0, cy = 0; for(const p of P){ cx += p.x; cy += p.y; } cx /= P.length; cy /= P.length;
  if(shoo){ const v = 8 * shoo * lightMul(save.up.value); addLight(v); pop(shoo > 1 ? `SHOO x${shoo}! +${fmt(v)}` : `SHOO! +${fmt(v)}`, cx, cy + 26, '#ffb070', 16); AU.shoo(); }
  if(!got.length && !queen) return;
  // --- score the loop ---
  const n = got.length + (queen ? 1 : 0);
  let base = 0; const hues = new Set(); let wild = 0;
  for(const f of got){ const S = SPECIES[f.sp]; base += S.val; if(S.hue === 'rainbow') wild++; else hues.add(S.hue); }
  if(queen) base += SPECIES.queen.val;
  const distinct = hues.size + wild;
  const rainbow = distinct >= 3, pure = !rainbow && n >= 3 && hues.size <= 1;
  let pairs = 0; for(const f of got) if(f.sp === 'rose' && f.mate && got.includes(f.mate)) pairs++;
  pairs = pairs / 2 | 0;
  // chain: loops that land quickly after each other
  if(G.rt - G.streakT < 2.2) G.streak = Math.min(9, G.streak + 1); else G.streak = 1;
  G.streakT = G.rt;
  const sizeM = 1 + .25 * (Math.min(n, 21) - 1), chainM = Math.min(3, 1 + (G.streak - 1) * .25);
  const mult = sizeM * (rainbow ? 2 : pure ? 1.5 : 1) * (pairs ? 1 + pairs * .5 : 1) * chainM;
  const v = Math.max(1, Math.round(base * mult * lightMul(save.up.value)));
  addLight(v);
  // catch them: they fly to the jar
  got.forEach((f, i) => { f.alive = false; G.caughtFx.push({ x:f.x, y:f.y, col:SPECIES[f.sp].col, t:-i * .03, sp:f.sp }); discover(f.sp); });
  if(queen){ discover('queen'); G.queenDone = true; save.stats.queens++; G.flash = .6; G.slowT = Math.max(G.slowT, .8); pop('QUEEN CAUGHT!', q.x, q.y - 50, '#ffd6a0', 30, 2); burst(q.x, q.y, 70, ['#ffd6a0', '#ffffff', '#ffe25a'], 380); AU.queen(); SDK.happytime(); }
  G.loops++; G.catches++; G.caughtN += n; G.bestLoop = Math.max(G.bestLoop, n); save.stats.loops++; save.stats.caught += n;
  if(rainbow) save.stats.rainbows++;
  // words
  const label = n >= 20 ? 'LEGENDARY LOOP!' : n >= 12 ? 'MEGA LOOP!' : n >= 7 ? 'GREAT LOOP!' : n >= 4 ? 'NICE LOOP!' : '';
  let y = cy - 10;
  pop('+' + fmt(v), cx, y, '#fff6c0', 20 + Math.min(22, n * 1.4), 1.3); y -= 30;
  if(n > 1) { pop('x' + sizeM.toFixed(2).replace(/\.?0+$/, ''), cx + 40 + n, y + 30, '#ffe25a', 16); }
  if(label){ pop(label, cx, y, '#ffffff', 18 + Math.min(10, n)); y -= 24; }
  if(rainbow){ pop('RAINBOW x2', cx, y, '#ff7ad0', 18, 1.3); y -= 22; }
  else if(pure){ pop('PURE x1.5', cx, y, SPECIES[got[0].sp].col, 17, 1.3); y -= 22; }
  if(pairs) { pop('LOVE ♥ x' + (1 + pairs * .5).toFixed(1), cx, y, '#ff7ad0', 16, 1.2); y -= 22; }
  if(G.streak > 1){ pop('CHAIN x' + chainM.toFixed(2).replace(/\.?0+$/, ''), cx, y, '#7df0ff', 16, 1.2); }
  if(n >= 7){ G.shake = Math.max(G.shake, 4 + Math.min(8, n / 3)); G.flash = Math.max(G.flash, .08 + Math.min(.2, n / 80)); }
  if(n >= 12) SDK.happytime();
  AU.catch(n, rainbow, pure);
  // secrets
  if(G.streak >= 4 && !G.mothDone){ G.mothDone = true; const m = mkFly('moth', rnd(120, G.W - 120), rnd(100, G.H - 100)); m.fade = 0; pop('A MOONMOTH APPEARS...', m.x, m.y - 30, '#c8a8ff', 16, 2); AU.discover(); }
}
function addLight(v){
  G.light += v;
  if(G.mode === 'hunt') G.lantern = Math.min(1, G.lantern + Math.min(.35, v / (40 + G.t * 1.2)));
}
function discover(k){
  const first = !save.codex[k];
  save.codex[k] = (save.codex[k] || 0) + 1;
  if(first){ G.newSpecies.push(k); showToast('NEW FIREFLY!', SPECIES[k].name + ' added to your Codex'); AU.discover(); }
}
G.caughtFx = [];

/* ---------------- effects ---------------- */
function pop(txt, x, y, c, s, d){ G.pops.push({ txt, x, y, c, s:s || 16, t:0, d:d || 1 }); if(G.pops.length > 40) G.pops.shift(); }
function burst(x, y, n, cols, sp){ const lim = save.opt.fx === 'low' ? 180 : 500; for(let i = 0; i < n && G.parts.length < lim; i++){ const a = rnd(0, TAU), s = rnd(40, sp || 240); G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, l:rnd(.4, .9), c:pick(cols), s:rnd(1.5, 3.5) }); } }

/* ---------------- update ---------------- */
function update(rdt){
  G.rt += rdt;
  if(G.slowT > 0) G.slowT -= rdt;
  const dt = rdt * (G.slowT > 0 ? .35 : 1);
  const play = G.state === 'play';
  if(play) G.t += rdt;
  if(G.snapT > 0) G.snapT -= rdt;
  // --- the clock ---
  if(play && G.mode === 'night'){
    const was = Math.ceil(G.timeLeft);
    G.timeLeft -= rdt;
    if(Math.ceil(G.timeLeft) !== was && G.timeLeft < 5.5 && G.timeLeft > 0) AU.tick();
    if(G.timeLeft <= 0){ G.timeLeft = 0; finishNight(); }
  }
  if(play && G.mode === 'hunt'){
    G.lantern -= rdt * (.045 + G.t * .0006);
    if(G.t > 90 && !G.shadowDone){ G.shadowDone = true; const s = mkFly('shadow', rnd(100, G.W - 100), rnd(100, G.H - 100)); pop('SOMETHING DARK FLUTTERS...', s.x, s.y - 30, '#8a5aff', 16, 2); AU.discover(); }
    if(G.lantern <= 0){ G.lantern = 0; finishHunt(); }
  }
  // --- wind ---
  G.windPh += dt * .35; G.gust = G.spec && G.spec.wind ? Math.sin(G.windPh) * Math.sin(G.windPh * 2.3 + 1) * 60 * G.spec.wind : 0;
  // --- fireflies ---
  const pw = PTR.down && play;
  for(const f of G.flies){
    if(!f.alive) continue;
    const S = SPECIES[f.sp];
    f.age += dt; f.fade = Math.min(1, f.fade + dt * 1.6); f.ph += dt * 3;
    if(f.sp === 'blink') f.vis = Math.sin(f.age * 3.1 + f.ph * .1) > -.1 ? 1 : 0;
    // wander
    f.wa += rnd(-2.2, 2.2) * dt * (S.shy ? 2 : 1);
    let ax = Math.cos(f.wa) * S.spd, ay = Math.sin(f.wa) * S.spd;
    // gather with their own kind (this is what makes big loops possible)
    if(f.swarm && f.swarm.t > 0){ ax += (f.swarm.x - f.x) * .9; ay += (f.swarm.y - f.y) * .9; }
    else if(S.hue !== 'rainbow'){
      let cxs = 0, cys = 0, cn = 0;
      for(const o of G.flies){ if(o === f || !o.alive || o.sp !== f.sp) continue; const dx = o.x - f.x, dy = o.y - f.y, d2 = dx * dx + dy * dy; if(d2 < 9000){ cxs += o.x; cys += o.y; cn++; if(d2 < 200){ ax -= dx * 1.5; ay -= dy * 1.5; } } }
      if(cn){ ax += (cxs / cn - f.x) * .35; ay += (cys / cn - f.y) * .35; }
    }
    if(f.mate && f.mate.alive){ const dx = f.mate.x - f.x, dy = f.mate.y - f.y; ax += dx * 1.2 - dy * .8; ay += dy * 1.2 + dx * .8; }
    // shy ones dart away from your finger
    if(S.shy && pw){ const dx = f.x - PTR.wx, dy = f.y - PTR.wy, d = Math.hypot(dx, dy); if(d < 120 && d > 1){ ax += dx / d * 260; ay += dy / d * 260; } }
    // avoid webs, stay on screen
    for(const w of G.webs){ const dx = f.x - w.x, dy = f.y - w.y, d = Math.hypot(dx, dy); if(d < w.r + 30 && d > 1){ ax += dx / d * 200; ay += dy / d * 200; } }
    const m = 40; if(f.x < m) ax += (m - f.x) * 6; if(f.x > G.W - m) ax -= (f.x - G.W + m) * 6; if(f.y < m) ay += (m - f.y) * 6; if(f.y > G.H - m) ay -= (f.y - G.H + m) * 6;
    ax += G.gust;
    const k = Math.min(1, dt * 2.2); f.vx += (ax - f.vx) * k; f.vy += (ay - f.vy) * k;
    const sp = Math.hypot(f.vx, f.vy), mx = S.spd * (S.shy && pw ? 2.6 : 1.6) + Math.abs(G.gust); if(sp > mx){ f.vx *= mx / sp; f.vy *= mx / sp; }
    f.x += f.vx * dt; f.y += f.vy * dt;
  }
  G.flies = G.flies.filter(f => f.alive);
  for(const sw of new Set(G.flies.map(f => f.swarm).filter(Boolean))) sw.t -= dt;
  if(play){
    // keep the meadow full
    const cnt = G.flies.filter(f => !SPECIES[f.sp].secret && !SPECIES[f.sp].boss).length;
    G.refill = (G.refill || 0) + dt * 1.3 * (1 + save.up.lure * .1); if(cnt < popTarget() && G.refill >= 1){ G.refill = 0; spawnFly(); } else if(G.refill > 1) G.refill = 1;
    G.swarmT -= dt; if(G.swarmT <= 0){ G.swarmT = rnd(7, 11); spawnSwarm(); }
    // the Queen visits boss nights
    if(G.mode === 'night' && G.spec.boss && !G.queen && G.t > 8){ G.queen = { x:-40, y:G.H * .4, vx:60, vy:0, ph:0, caught:false, t:0 }; pop('THE FIREFLY QUEEN!', G.W / 2, 80, '#ffd6a0', 26, 2.2); AU.queenIn(); for(let i = 0; i < 10; i++){ const f = mkFly('glow', -20 - i * 8, G.H * .4 + rnd(-30, 30)); f.guard = true; } }
  }
  // queen
  const q = G.queen;
  if(q){
    if(q.caught){ q.t += dt; }
    else {
      q.ph += dt; const tx = G.W / 2 + Math.cos(q.ph * .45) * G.W * .34, ty = G.H / 2 + Math.sin(q.ph * .9) * G.H * .28;
      let ax = (tx - q.x) * 1.4, ay = (ty - q.y) * 1.4;
      // she dodges your rope if it gets close
      for(let i = 0; i < G.trail.length; i += 3){ const p = G.trail[i], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); if(d < 70 && d > 1){ ax += dx / d * 120; ay += dy / d * 120; } }
      q.vx += (ax - q.vx) * Math.min(1, dt * 2); q.vy += (ay - q.vy) * Math.min(1, dt * 2);
      q.x += q.vx * dt; q.y += q.vy * dt;
      for(const f of G.flies) if(f.guard){ f.swarm = { x:q.x, y:q.y, t:1 }; }
    }
  }
  // --- wasps ---
  for(const w of G.wasps){
    w.ph += dt * 30;
    if(w.gone){ w.gone += dt; w.x += w.vx * dt; w.y += w.vy * dt; w.vy -= 200 * dt; continue; }
    const dx = w.tx - w.x, dy = w.ty - w.y, d = Math.hypot(dx, dy);
    if(d < 30){ w.tx = rnd(60, G.W - 60); w.ty = rnd(60, G.H - 60); }
    w.vx += (dx / (d || 1) * w.spd - w.vx) * Math.min(1, dt * 1.5); w.vy += (dy / (d || 1) * w.spd - w.vy) * Math.min(1, dt * 1.5);
    w.x += w.vx * dt + Math.sin(w.ph * .13) * .6; w.y += w.vy * dt + Math.cos(w.ph * .11) * .6;
    // it snaps the rope it touches
    if(play && G.trail.length > 1){ for(let i = 1; i < G.trail.length; i++){ if(segDist(w.x, w.y, G.trail[i - 1], G.trail[i]) < w.r + 2){ snap(w.x, w.y, 'wasp'); break; } } }
  }
  const gone = G.wasps.filter(w => w.gone > 2.5).length;
  G.wasps = G.wasps.filter(w => w.gone <= 2.5);
  for(let i = 0; i < gone; i++) setTimeout(() => { if(G.state === 'play') spawnWasp(false); }, 5000);
  // --- bats swoop across ---
  if(play && G.spec.bats){
    G.batT -= dt;
    if(G.batT <= 0){ G.batT = rnd(6, 10) / Math.max(1, G.spec.bats * .7); const l = Math.random() < .5, y0 = rnd(80, G.H - 80); G.bats.push({ x:l ? -60 : G.W + 60, y:y0, vx:l ? 420 : -420, y0, amp:rnd(40, 120), t:0, warn:.8 }); AU.bat(); }
  }
  for(const b of G.bats){
    if(b.warn > 0){ b.warn -= dt; continue; }
    b.t += dt; b.x += b.vx * dt; b.y = b.y0 + Math.sin(b.t * 3) * b.amp;
    for(const f of G.flies){ if(f.alive && !SPECIES[f.sp].boss && Math.hypot(f.x - b.x, f.y - b.y) < 26){ f.alive = false; burst(f.x, f.y, 6, [SPECIES[f.sp].col], 80); } }
    if(play && G.trail.length > 1){ for(let i = 1; i < G.trail.length; i++){ if(segDist(b.x, b.y, G.trail[i - 1], G.trail[i]) < 24){ snap(b.x, b.y, 'bat'); break; } } }
  }
  G.bats = G.bats.filter(b => b.x > -120 && b.x < G.W + 120);
  // --- webs tangle the rope ---
  if(play && G.webs.length && G.trail.length > 1){
    const p = G.trail[G.trail.length - 1];
    for(const w of G.webs) if(Math.hypot(p.x - w.x, p.y - w.y) < w.r){ snap(p.x, p.y, 'web'); break; }
  }
  // the rope fades away when you let go
  if(!PTR.down && G.trail.length){ const cut = G.rt - .25; while(G.trail.length && G.trail[0].t < cut) G.trail.shift(); if(G.trail.length < 2){ G.trail = []; G.trailLen = 0; } }
  if(G.streak > 0 && G.rt - G.streakT > 2.2){ G.streak = 0; }
  // --- effects ---
  for(const c of G.caughtFx) c.t += rdt; G.caughtFx = G.caughtFx.filter(c => c.t < .9);
  for(const e of G.fx) e.t += rdt; G.fx = G.fx.filter(e => e.t < .7);
  for(const s of G.shards){ s.t += rdt; s.vy += 300 * rdt; s.x1 += s.vx * rdt; s.x2 += s.vx * rdt; s.y1 += s.vy * rdt; s.y2 += s.vy * rdt; } G.shards = G.shards.filter(s => s.t < .6);
  for(const p of G.parts){ p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .95; p.vy *= .95; p.l -= dt; } G.parts = G.parts.filter(p => p.l > 0);
  for(const p of G.pops){ p.t += rdt; p.y -= 28 * rdt; } G.pops = G.pops.filter(p => p.t < p.d);
  for(const r of G.rings) r.t += rdt; G.rings = G.rings.filter(r => r.t < .6);
  G.shake = (G.shake || 0) * Math.pow(.01, rdt); if(G.flash > 0) G.flash = Math.max(0, G.flash - rdt * 2);
  G.shown += (G.light - G.shown) * Math.min(1, rdt * 8);
}

/* ---------------- results ---------------- */
function starsFor(light, goal){ return light >= goal * 3 ? 3 : light >= goal * 1.8 ? 2 : light >= goal ? 1 : 0; }
function finishNight(){
  if(G.state !== 'play') return;
  G.state = 'done'; G.trail = [];
  const n = G.spec.n, st = starsFor(G.light, G.spec.goal), win = st > 0, prev = save.stars[n] || 0;
  const glow = Math.round(G.light);
  save.glow += glow; save.earned += glow; save.stats.nights++;
  save.best.loop = Math.max(save.best.loop, G.bestLoop);
  if(win){ save.stars[n] = Math.max(prev, st); if(n === save.night){ save.night++; save.maxNight = Math.max(save.maxNight, save.night); } }
  G.result = { mode:'night', n, win, st, prev, light:glow, goal:G.spec.goal, bestLoop:G.bestLoop, caught:G.caughtN, loops:G.loops, queen:G.queenDone, newSpecies:G.newSpecies.slice() };
  if(st === 3 || (win && G.spec.boss)) SDK.happytime();
  persist(); AU[win ? 'win' : 'lose']();
  setTimeout(() => showResult(), 700);
}
function finishHunt(){
  if(G.state !== 'play') return;
  G.state = 'done'; G.trail = [];
  const score = Math.round(G.light), best = score > save.best.hunt, glow = Math.round(Math.min(score * .2, nightSpec(save.maxNight).goal * 1.5));
  save.best.hunt = Math.max(save.best.hunt, score); save.best.huntT = Math.max(save.best.huntT, Math.round(G.t));
  save.glow += glow; save.earned += glow; save.best.loop = Math.max(save.best.loop, G.bestLoop);
  G.result = { mode:'hunt', score, best, glow, t:Math.round(G.t), bestLoop:G.bestLoop, caught:G.caughtN, newSpecies:G.newSpecies.slice() };
  if(best) SDK.happytime();
  persist(); AU.lose();
  setTimeout(() => showResult(), 700);
}
