'use strict';
/* =====================================================================
   LUMIBLOOM: simulation
   You are a little spirit of light. Everywhere you fly you leave a
   ribbon. Cross your own ribbon to close a LOOP: everything inside it
   wakes up. Buds bloom (feeding your light), gloom critters are freed
   and turn into butterflies, and the meadow is painted in color.
   Your light slowly fades, so keep looping.
   ===================================================================== */
const G = {
  state:'boot', t:0, rt:0, score:0, blooms:0, purified:0, bestHarm:0, chain:0, chainT:0, maxChain:0, loops:0,
  B:[], F:[], E:[], BF:[], MO:[], T:[], PT:[], POP:[], FX:[], LP:[], TM:[], AMB:[],
  TR:[], trLen:0, preview:null,
  light:100, maxLight:100, hour:1, lvl:1, gx:0, up:{}, dust:0, revived:false, pbb:null, daily:false, mod:null,
  shake:0, flash:0, flashCol:'#fff', camX:0, camY:0, camZ:1, tut:false, tutStep:0, tutT:0, runEv:{}, dieT:0, q:'high',
  boss:null, painted:0, paintMile:0, spawnT:0, budT:0, pendingCards:0, haloT:0, starN:0, beatT:0, snapT:0, twin:null,
};
let P = null;

/* ---------------- tuning helpers ---------------- */
const modId = () => G.mod ? G.mod.id : '';
const flySpd = () => 330 * (1 + .1 * (G.up.swift || 0)) * (modId() === 'windy' ? 1.12 : 1);
const trailMax = () => 980 * (1 + .12 * (save.meta.ribbon || 0)) * (1 + .22 * (G.up.ribbon || 0)) * (modId() === 'short' ? .7 : 1);
const lightMul = () => (1 + .12 * (save.meta.nectar || 0)) * (1 + .15 * (G.up.pollen || 0));
const dustMul = () => (1 + .15 * (save.meta.luck || 0)) * (({ windy:1.5, short:2, moonless:1.5 })[modId()] || 1);
const drainRate = () => {
  const base = Math.min(4.3, 1.5 + .3 * (G.hour - 1));
  return base * (1 - .12 * (G.up.roots || 0)) * (1 - .08 * (save.meta.breath || 0)) * (modId() === 'moonless' ? 1.25 : 1) * (P && P.boost ? 1.9 : 1);
};
const gloomSpd = () => (modId() === 'windy' ? 1.25 : 1) * (1 - .15 * (G.up.calm || 0)) * Math.min(1, .55 + G.t / 60) * (1 + Math.max(0, G.t - 200) / 500);
const MIN_AREA = 1800, SNAP_R = 24, PT_GAP = 7;
function targetZoom(){ return clamp(Math.sqrt(W * H) / 980, .5, 1.25); }
function viewR(){ return Math.hypot(W, H) / 2 / G.camZ; }

/* ---------------- run lifecycle ---------------- */
function newRun(daily){
  G.daily = !!daily;
  if(daily){ const seed = hashStr('lumibloom:' + todayKey()); grng = mulberry32(seed); G.mod = MODS[seed % MODS.length]; }
  else { grng = Math.random; G.mod = null; }
  for(const k of ['B','F','E','BF','MO','T','PT','POP','FX','LP','TM','TR']) G[k].length = 0;
  Object.assign(G, { t:0, score:0, blooms:0, purified:0, bestHarm:0, chain:0, chainT:0, maxChain:0, loops:0, trLen:0, preview:null,
    hour:1, lvl:1, gx:0, up:{}, dust:0, revived:false, pbb:null, shake:0, flash:0, runEv:{}, dieT:0, boss:null, painted:0, paintMile:0,
    spawnT:6, budT:0, pendingCards:0, haloT:0, starN:0, beatT:0, snapT:0, twin:null });
  G.maxLight = 100 + 15 * (save.meta.glow || 0); G.light = G.maxLight;
  P = { x:0, y:0, vx:0, vy:0, r:12, inv:1, ang:-Math.PI / 2, boost:false, hit:0 };
  G.camX = 0; G.camY = 0; G.camZ = targetZoom();
  IN.tx = 0; IN.ty = -1; IN.hasT = false;
  resetPaint();
  G.tut = !save.tut; G.tutStep = 0; G.tutT = 0;
  G.state = 'play';
  // instant hook: sleepy buds all around you, begging to be looped
  budCluster(0, -170, 6, 60); budCluster(190, 60, 5, 55); budCluster(-190, 70, 5, 55);
  if(modId() === 'flutter') for(let i = 0; i < 6; i++) addButterfly(rnd(-60, 60), rnd(-60, 60), 3);
  G.tutRing = G.tut ? { x:0, y:-170, r:105 } : null;
  if(G.tut) tip('<b>Fly</b> in a circle around the sleeping buds. Cross your ribbon to <em>close the loop</em>!');
  AU.setKey(hourPal(1).mus); AU.setMusic(1);
}

/* ---------------- spawning ---------------- */
function inMeadow(x, y, pad){ return x * x + y * y < (WORLD_R - (pad || 0)) ** 2; }
function mkBud(x, y, kind){
  const k = kind || (grng() < .06 ? 'lotus' : grng() < .06 ? 'gold' : 'bud');
  const b = { x, y, kind:k, r:k === 'lotus' ? 21 : 13, v:k === 'lotus' ? 3 : 1, col:k === 'gold' ? '#ffd24a' : BUD_COLS[(grng() * BUD_COLS.length) | 0],
    grow:0, life:gr(28, 36), ph:grng() * TAU, pet:5 + ((grng() * 3) | 0) };
  G.B.push(b); return b;
}
function budCluster(cx, cy, n, spread){
  for(let i = 0; i < n; i++){
    const a = grng() * TAU, d = Math.sqrt(grng()) * spread, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    if(!inMeadow(x, y, 40)) continue;
    if(G.B.some(b => (b.x - x) ** 2 + (b.y - y) ** 2 < 26 * 26)) continue;
    mkBud(x, y);
  }
}
function budTarget(){ return (modId() === 'blossom' ? 64 : 36) + Math.min(10, G.hour * 2); }
function tickBuds(dt){
  G.budT -= dt;
  if(G.budT <= 0 && G.B.length < budTarget()){
    G.budT = .35;
    const vr = viewR();
    for(let tries = 0; tries < 8; tries++){
      const a = grng() * TAU, d = gr(260, vr * .95 + 200), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
      if(!inMeadow(x, y, 80)) continue;
      budCluster(x, y, 3 + ((grng() * 5) | 0), gr(40, 80)); break;
    }
  }
  for(let i = G.B.length - 1; i >= 0; i--){
    const b = G.B[i];
    if(b.grow < 1) b.grow = Math.min(1, b.grow + dt * 1.8);
    b.life -= dt;
    const far = Math.hypot(b.x - P.x, b.y - P.y) > viewR() * 2.4;
    if(b.life <= 0 || far){ G.B.splice(i, 1); if(!far) for(let k = 0; k < 4; k++) part(b.x, b.y, rnd(-30, 30), rnd(-50, -10), .8, '#6b6a9a', 3); }
  }
}
function spawnGloom(type, x, y, boss){
  const d = GT[type] || GT.mote;
  const e = { type, d, x, y, vx:0, vy:0, r:boss ? 104 : d.r * gr(.9, 1.15), t:0, ph:grng() * TAU, hd:grng() * TAU, cd:gr(2, 3.5), boss:!!boss, hp:boss ? 3 : 1, flash:0, born:.6, dead:false };
  if(boss){ e.cut = true; e.big = true; }
  else { e.cut = d.cut; e.big = !!d.big; }
  if(type === 'snip'){
    const tx = P.x + P.vx * .5 + gr(-160, 160), ty = P.y + P.vy * .5 + gr(-160, 160), l = Math.hypot(tx - x, ty - y) || 1;
    e.vx = (tx - x) / l; e.vy = (ty - y) / l;
  }
  G.E.push(e);
  if(d.tip && !save.seen[type] && !boss){ save.seen[type] = true; persist(); G.TM.push({ t:1.2, f:() => { if(G.state === 'play') tip(d.tip); G.TM.push({ t:6, f:() => tip(null) }); } }); }
  return e;
}
function tickGlooms(dt){
  if(G.t < 10 || G.boss && G.boss.hp > 0 && G.E.length > 6) return;
  G.spawnT -= dt;
  const cap = Math.min(24, 3 + G.hour * 2.2);
  if(G.spawnT > 0 || G.E.filter(e => !e.boss).length >= cap) return;
  G.spawnT = Math.max(1, 4 - .32 * G.hour) * gr(.8, 1.2);
  const pool = Object.keys(GT).filter(k => G.t >= GT[k].at);
  const tot = pool.reduce((s, k) => s + GT[k].w, 0);
  let r = grng() * tot, type = pool[0];
  for(const k of pool){ r -= GT[k].w; if(r <= 0){ type = k; break; } }
  const vr = viewR();
  for(let tries = 0; tries < 10; tries++){
    const a = grng() * TAU, d = vr * gr(.62, .8), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if(!inMeadow(x, y, 30)) continue;
    spawnGloom(type, x, y);
    if(type === 'mote' && G.hour >= 3 && grng() < .5) spawnGloom('mote', x + gr(-40, 40), y + gr(-40, 40));
    break;
  }
}
function spawnBoss(){
  const a = Math.atan2(-P.y, -P.x) + gr(-.6, .6), d = Math.min(W, H) / 2 / G.camZ * .7 + 60;
  let x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
  const l = Math.hypot(x, y); if(l > WORLD_R - 200){ x *= (WORLD_R - 200) / l; y *= (WORLD_R - 200) / l; }
  G.boss = spawnGloom('mote', x, y, true); G.boss.type = 'hush';
  announce('THE HUSH', '#c8a8ff', 'LOOP ALL THE WAY AROUND IT');
  if(!save.seen.hush){ save.seen.hush = true; persist(); tip('Circle the <em>HUSH</em> right after its tears fly past. <b>Three loops</b> set it free!'); G.TM.push({ t:7, f:() => tip(null) }); }
  AU.bossHorn(); AU.setMusic(3); shakeIt(10);
  addLight(35);
}

/* ---------------- input ---------------- */
const IN = { mx:0, my:0, mouse:false, keys:{}, touch:null, tx:0, ty:0, hasT:false, boost:false, boostKey:false };
function desiredVel(){
  if(G.state === 'menuplay'){ const [dx, dy] = G.menuT; return steerTo(dx, dy, 300); }
  const sp = flySpd() * (P.boost ? 1.45 : 1), k = IN.keys;
  let x = 0, y = 0;
  if(k.a || k.arrowleft) x -= 1; if(k.d || k.arrowright) x += 1; if(k.w || k.arrowup) y -= 1; if(k.s || k.arrowdown) y += 1;
  if(x || y){ const l = Math.hypot(x, y); IN.hasT = false; return [x / l * sp, y / l * sp]; }
  if(IN.mouse){ const wx = (IN.mx - W / 2) / G.camZ + G.camX, wy = (IN.my - H / 2) / G.camZ + G.camY; return steerTo(wx, wy, sp); }
  if(IN.hasT) return steerTo(IN.tx, IN.ty, sp);
  return [0, 0];
}
function steerTo(tx, ty, sp){
  const dx = tx - P.x, dy = ty - P.y, l = Math.hypot(dx, dy);
  if(l < 4) return [0, 0];
  const s = Math.min(sp, l * 7);
  return [dx / l * s, dy / l * s];
}

/* ---------------- main update ---------------- */
function update(dt){
  G.rt += dt;
  G.shake = Math.max(0, G.shake - dt * 30); G.flash = Math.max(0, G.flash - dt * 2.2);
  const gdt = G.state === 'dying' ? dt * .3 : dt;
  if(G.state === 'dying'){ G.dieT -= dt; tickFx(gdt); updGlooms(gdt); if(G.dieT <= 0) onDeathDone(); return; }
  G.t += dt;
  const h = 1 + Math.floor(G.t / HOUR_LEN);
  if(h !== G.hour) newHour(h);
  P.boost = IN.boost || IN.boostKey;
  updPlayer(dt);
  tickBuds(dt);
  tickGlooms(dt);
  updGlooms(dt);
  updTears(dt);
  updButterflies(dt);
  updMotes(dt);
  updTwin(dt);
  for(let i = G.TM.length - 1; i >= 0; i--){ const t = G.TM[i]; t.t -= dt; if(t.t <= 0){ G.TM.splice(i, 1); t.f(); } }
  tickFx(dt);
  if(G.chainT > 0){ G.chainT -= dt; if(G.chainT <= 0) G.chain = 0; }
  if(G.haloT > 0) G.haloT -= dt;
  // light slowly fades (not during the first seconds)
  if(G.t > 6 && !(G.tut && G.tutStep === 0)) G.light -= drainRate() * dt;
  if(G.light < 25){ G.beatT -= dt; if(G.beatT <= 0){ AU.beat(); G.beatT = .55 + G.light / 30; } }
  if(G.light <= 0){ G.light = 0; die(); return; }
  ev('hour', G.hour);
  // camera: gently lead the flight direction
  G.camZ = lerp(G.camZ, targetZoom() * (G.boss && G.boss.hp > 0 ? .86 : 1), Math.min(1, dt * 1.5));
  G.camX = lerp(G.camX, P.x + P.vx * .18, Math.min(1, dt * 4)); G.camY = lerp(G.camY, P.y + P.vy * .18, Math.min(1, dt * 4));
  // tutorial
  if(G.tut){
    G.tutT += dt;
    if(G.tutStep === 1 && G.tutT > 4.5){ G.tutStep = 2; G.tutT = 0; tip('Blooms feed your <b>light</b>. Loop <b>many at once</b> for HARMONY!'); }
    else if(G.tutStep === 2 && G.tutT > 5){ G.tutStep = 3; G.tutT = 0; tip('Don\'t touch the <em>glooms</em>. <b>Loop them</b> to set them free!'); }
    else if(G.tutStep === 3 && G.tutT > 6){ G.tut = false; save.tut = true; persist(); tip(null); }
  }
  if(G.pendingCards > 0 && !G.LP.length){ G.pendingCards--; openCards(); }
}
function newHour(h){
  G.hour = h;
  const p = hourPal(h);
  AU.setKey(p.mus); AU.hour();
  if(h % 5 === 0){ G.TM.push({ t:1.4, f:() => { if(G.state === 'play') spawnBoss(); } }); announce('HOUR ' + h, p.tint, p.n + ' · SOMETHING STIRS'); }
  else { announce('HOUR ' + h, p.tint, p.n); if(!G.boss || G.boss.hp <= 0) AU.setMusic(h >= 3 ? 2 : 1); }
  G.score += 250 * (h - 1);
  const d = Math.round(2 * dustMul()); G.dust += d;
}

function updPlayer(dt){
  const [vx, vy] = desiredVel();
  P.vx = lerp(P.vx, vx, Math.min(1, dt * 9)); P.vy = lerp(P.vy, vy, Math.min(1, dt * 9));
  P.x += P.vx * dt; P.y += P.vy * dt;
  // the meadow shore gently pushes you back
  const l = Math.hypot(P.x, P.y), lim = WORLD_R - 30;
  if(l > lim){ P.x *= lim / l; P.y *= lim / l; const n = [P.x / l, P.y / l], dot = P.vx * n[0] + P.vy * n[1]; if(dot > 0){ P.vx -= n[0] * dot; P.vy -= n[1] * dot; } }
  if(P.inv > 0) P.inv -= dt;
  if(P.hit > 0) P.hit -= dt;
  const s = Math.hypot(P.vx, P.vy);
  if(s > 20) P.ang = Math.atan2(P.vy, P.vx);
  // ribbon
  const last = G.TR[G.TR.length - 1];
  if(!last) G.TR.push({ x:P.x, y:P.y });
  else { const d = Math.hypot(P.x - last.x, P.y - last.y); if(d >= PT_GAP) addTrailPoint(P.x, P.y); }
  computePreview();
  if(P.boost && s > 100 && Math.random() < dt * 30) part(P.x, P.y, -P.vx * .3 + rnd(-40, 40), -P.vy * .3 + rnd(-40, 40), .4, skin().c2 === 'aurora' ? pick(BUD_COLS) : skin().c2, 3);
}

/* ---------------- the ribbon & loops ---------------- */
function addTrailPoint(x, y){
  const TR = G.TR, n = TR.length, p = { x, y };
  if(n >= 4){
    const a = TR[n - 1];
    // 1) crossing the ribbon closes the biggest loop it makes
    for(let i = 0; i <= n - 4; i++){
      const X = segX(a, p, TR[i], TR[i + 1]);
      if(!X) continue;
      const poly = [X]; for(let k = i + 1; k < n; k++) poly.push(TR[k]);
      if(poly.length >= 4 && polyArea(poly) >= MIN_AREA){ closeLoop(poly); G.TR.length = 0; G.TR.push(p); G.trLen = 0; return; }
    }
    // 2) forgiving snap: flying back next to an older part also closes it
    for(let i = 0; i <= n - 14; i++){
      const q = TR[i];
      if((q.x - x) ** 2 + (q.y - y) ** 2 > SNAP_R * SNAP_R) continue;
      const poly = TR.slice(i); poly.push(p);
      if(polyArea(poly) >= MIN_AREA){ closeLoop(poly); G.TR.length = 0; G.TR.push(p); G.trLen = 0; return; }
      break;
    }
  }
  if(n) G.trLen += Math.hypot(x - TR[n - 1].x, y - TR[n - 1].y);
  TR.push(p);
  const max = trailMax();
  while(G.trLen > max && TR.length > 2){ G.trLen -= Math.hypot(TR[1].x - TR[0].x, TR[1].y - TR[0].y); TR.shift(); }
}
function computePreview(){
  G.preview = null;
  const TR = G.TR, n = TR.length;
  if(n < 16) return;
  let bi = -1, bd = 72 * 72;
  for(let i = 0; i <= n - 16; i++){ const d = (TR[i].x - P.x) ** 2 + (TR[i].y - P.y) ** 2; if(d < bd){ bd = d; bi = i; } }
  if(bi < 0) return;
  const poly = TR.slice(bi); poly.push({ x:P.x, y:P.y });
  if(polyArea(poly) < MIN_AREA) return;
  const bb = polyBox(poly); let c = 0;
  for(const b of G.B) if(b.x > bb.x0 && b.x < bb.x1 && b.y > bb.y0 && b.y < bb.y1 && inPoly(poly, b.x, b.y)) c++;
  for(const e of G.E) if(!e.dead && e.born <= 0 && e.x > bb.x0 && e.x < bb.x1 && e.y > bb.y0 && e.y < bb.y1 && encloses(poly, e)) c++;
  G.preview = { i:bi, poly, n:c, k:1 - Math.sqrt(bd) / 72 };
}
function encloses(poly, e){
  if(!inPoly(poly, e.x, e.y)) return false;
  if(!e.big) return true;
  const rr = e.r * .7;
  for(let k = 0; k < 8; k++){ const a = k / 8 * TAU; if(!inPoly(poly, e.x + Math.cos(a) * rr, e.y + Math.sin(a) * rr)) return false; }
  return true;
}
const HARM_WORDS = [[16, 'HEAVENLY!', '#ffffff'], [12, 'BREATHTAKING!', '#fff38a'], [8, 'RADIANT!', '#ff8fc8'], [5, 'LOVELY!', '#7dffc9'], [3, 'SWEET!', '#8fd8ff']];
function closeLoop(poly){
  const bb = polyBox(poly), area = polyArea(poly), cen = polyCentroid(poly);
  const buds = [], glooms = [];
  for(const b of G.B) if(b.x > bb.x0 && b.x < bb.x1 && b.y > bb.y0 && b.y < bb.y1 && inPoly(poly, b.x, b.y)) buds.push(b);
  for(const e of G.E) if(!e.dead && e.born <= 0 && e.x > bb.x0 - e.r && e.x < bb.x1 + e.r && e.y > bb.y0 - e.r && e.y < bb.y1 + e.r && encloses(poly, e)) glooms.push(e);
  // Echo Bloom: buds just outside the loop ring along
  if(G.up.echo){
    const reach = 30 + 30 * G.up.echo;
    for(const b of G.B){
      if(buds.includes(b) || b.x < bb.x0 - reach || b.x > bb.x1 + reach || b.y < bb.y0 - reach || b.y > bb.y1 + reach) continue;
      for(let k = 0; k < poly.length; k += 2) if((poly[k].x - b.x) ** 2 + (poly[k].y - b.y) ** 2 < reach * reach){ buds.push(b); break; }
    }
  }
  const harm = buds.length + glooms.length;
  const col = harm ? (buds.length ? buds[(buds.length / 2) | 0].col : '#c8a8ff') : '#8a8fd0';
  G.LP.push({ poly, life:.9, max:.9, c:col, cx:cen.x, cy:cen.y, harm });
  paintLoop(poly, harm ? col : '#6d74b8', harm ? .36 : .14);
  G.loops++; ev('loops', 1);
  if(!harm){ AU.emptyLoop(); return; }
  G.chain = G.chainT > 0 ? G.chain + 1 : 1; G.chainT = 3.2; G.maxChain = Math.max(G.maxChain, G.chain);
  ev('chain', G.chain); ev('harm', harm);
  G.bestHarm = Math.max(G.bestHarm, harm);
  if(G.tut && G.tutStep === 0){ G.tutStep = 1; G.tutT = 0; tip('<b>Beautiful!</b> Every loop wakes up what is inside it.'); G.tutRing = null; }
  const chainMul = 1 + .1 * (G.chain - 1);
  // bloom in order around the loop so the notes strum like a harp
  buds.sort((a, b) => Math.atan2(a.y - cen.y, a.x - cen.x) - Math.atan2(b.y - cen.y, b.x - cen.x));
  const base = Math.min(7, G.chain - 1);
  buds.forEach((b, i) => { const idx = base + i; b.caught = true; G.TM.push({ t:i * .045, f:() => bloom(b, idx, harm * chainMul) }); });
  glooms.forEach((e, i) => { e.caught = true; G.TM.push({ t:.1 + i * .06, f:() => purify(e, harm * chainMul) }); });
  // harmony light bonus: loops of many things pay back more than the sum of their parts
  const bonus = (.6 * Math.pow(harm, 1.3) + (G.up.well && harm >= 4 ? 4 * G.up.well : 0)) * lightMul();
  addLight(bonus);
  G.score += Math.round(area / 400);
  AU.loop(harm, G.chain);
  for(const [n, w, c] of HARM_WORDS) if(harm >= n){ pop(cen.x, cen.y, w, c, 20 + Math.min(14, harm)); if(harm >= 8){ shakeIt(4); G.flash = .35; G.flashCol = c; } if(harm >= 12 && G.state === 'play') SDK.happytime(); break; }
  if(harm >= 3 && G.chain >= 2) pop(cen.x, cen.y + 30, 'x' + harm + ' HARMONY', '#ffffff', 13);
  // Wishing Star: every 5th chain link calls down a star
  if(G.up.star && G.chain > 0 && G.chain % 5 === 0) wishStar(P.x + P.vx * .4, P.y + P.vy * .4);
  if(harm >= 3) for(let k = 0; k < poly.length; k += 3) part(poly[k].x, poly[k].y, (poly[k].x - cen.x) * .8, (poly[k].y - cen.y) * .8, rnd(.5, .9), pick([col, '#ffffff']), rnd(2, 4));
}
function bloom(b, idx, mult){
  const i = G.B.indexOf(b); if(i < 0) return;
  G.B.splice(i, 1);
  G.F.push({ x:b.x, y:b.y, col:b.col, pet:b.pet, sz:b.r * (b.kind === 'lotus' ? 1.2 : 1.25), t:0, rot:rnd(0, TAU), ph:rnd(0, TAU), kind:b.kind });
  if(G.F.length > (G.q === 'low' ? 160 : 320)) stampFlower(G.F.shift());
  const n = b.v * 3;
  for(let k = 0; k < n; k++){ const a = rnd(0, TAU), s = rnd(60, 160); G.MO.push({ x:b.x, y:b.y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, t:0, kind:'light', v:.85 * lightMul(), c:b.col }); }
  if(b.kind === 'gold') for(let k = 0; k < 3; k++){ const a = rnd(0, TAU), s = rnd(60, 140); G.MO.push({ x:b.x, y:b.y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, t:0, kind:'dust', v:1, c:'#fff38a' }); }
  for(let k = 0; k < 10; k++){ const a = rnd(0, TAU), s = rnd(60, 200); part(b.x, b.y, Math.cos(a) * s, Math.sin(a) * s, rnd(.4, .9), pick([b.col, '#ffffff', b.col]), rnd(2, 5)); }
  G.FX.push({ ring:true, x:b.x, y:b.y, r:0, max:b.r * 3.2, life:.45, max0:.45, c:b.col });
  G.score += Math.round(10 * b.v * Math.max(1, mult));
  G.blooms++; ev('bloom', 1);
  AU.bloom(idx);
  gardenXp(b.v);
}
function purify(e, mult){
  if(e.dead) return;
  if(e.boss){ bossHit(e); return; }
  e.dead = true;
  G.purified++; ev('purify', 1);
  const kids = e.d.kids || 1;
  for(let k = 0; k < kids; k++) addButterfly(e.x + rnd(-10, 10), e.y + rnd(-10, 10));
  addLight((e.big ? 12 : 5) * lightMul());
  G.score += Math.round((e.big ? 200 : 60) * Math.max(1, mult));
  G.MO.push({ x:e.x, y:e.y, vx:rnd(-80, 80), vy:rnd(-80, 80), t:0, kind:'dust', v:e.big ? 3 : 1, c:'#fff38a' });
  for(let k = 0; k < 18; k++){ const a = rnd(0, TAU), s = rnd(80, 260); part(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, rnd(.4, .9), pick(['#ffffff', '#c8a8ff', '#fff38a']), rnd(2, 5)); }
  G.FX.push({ ring:true, x:e.x, y:e.y, r:0, max:e.r * 3, life:.5, max0:.5, c:'#ffffff' });
  pop(e.x, e.y - e.r - 8, e.big ? 'FREED ALL!' : 'FREED!', '#fff38a', e.big ? 20 : 14);
  AU.purify(e.big);
  gardenXp(e.big ? 3 : 1);
}
function bossHit(e){
  e.hp--; e.flash = .5;
  G.FX.push({ ring:true, x:e.x, y:e.y, r:0, max:e.r * 4, life:.7, max0:.7, c:'#ffffff' });
  for(let k = 0; k < 40; k++){ const a = rnd(0, TAU), s = rnd(120, 420); part(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, rnd(.5, 1.1), pick(['#ffffff', '#c8a8ff', '#ff8fc8', '#fff38a']), rnd(3, 6)); }
  for(let k = 0; k < 3; k++) addButterfly(e.x + rnd(-40, 40), e.y + rnd(-40, 40));
  addLight(20 * lightMul()); G.score += 1000; shakeIt(12); G.flash = .6; G.flashCol = '#ffffff';
  AU.bossHit();
  if(e.hp <= 0){
    e.dead = true; G.boss = null;
    for(let k = 0; k < 6; k++) addButterfly(e.x + rnd(-60, 60), e.y + rnd(-60, 60), 1.5);
    for(let k = 0; k < 8; k++) G.MO.push({ x:e.x, y:e.y, vx:rnd(-200, 200), vy:rnd(-200, 200), t:0, kind:'dust', v:3, c:'#fff38a' });
    // the whole visible meadow bursts into bloom
    const vr = viewR();
    const near = G.B.filter(b => Math.hypot(b.x - P.x, b.y - P.y) < vr);
    near.forEach((b, i) => { b.caught = true; G.TM.push({ t:.3 + i * .03, f:() => bloom(b, i % 12, 3) }); });
    G.purified++; ev('purify', 1); ev('hush', 1); G.score += 3000;
    announce('THE HUSH IS FREE', '#fff38a', 'THE MEADOW SINGS');
    SDK.happytime(); AU.setMusic(G.hour >= 3 ? 2 : 1);
    gardenXp(10);
  } else {
    e.r *= .78;
    pop(e.x, e.y - e.r - 20, e.hp === 1 ? 'ONE MORE LOOP!' : 'IT\'S SHRINKING!', '#fff38a', 20);
  }
}
function wishStar(x, y){
  G.FX.push({ star:true, x, y, life:.6, max0:.6 });
  G.TM.push({ t:.55, f:() => {
    const R = 170; AU.bossHit(); shakeIt(6);
    G.FX.push({ ring:true, x, y, r:0, max:R, life:.5, max0:.5, c:'#fff38a' });
    const hit = G.B.filter(b => !b.caught && (b.x - x) ** 2 + (b.y - y) ** 2 < R * R);
    hit.forEach((b, i) => { b.caught = true; G.TM.push({ t:i * .04, f:() => bloom(b, 5 + i, 2) }); });
    for(const e of G.E) if(!e.dead && !e.boss && !e.big && (e.x - x) ** 2 + (e.y - y) ** 2 < R * R) purify(e, 2);
  } });
}
function addLight(v){ G.light = Math.min(G.maxLight, G.light + v); }
function gardenXp(v){
  if(G.state !== 'play') return;
  G.gx += v;
  while(G.gx >= gardenNeed(G.lvl)){
    G.gx -= gardenNeed(G.lvl); G.lvl++;
    addLight(25);
    announce('GARDEN LV ' + G.lvl, '#7dffc9', 'CHOOSE A BLESSING');
    AU.levelUp();
    G.pendingCards++;
  }
}

/* ---------------- paint: the meadow remembers every loop ---------------- */
const PAINT_S = .25, PCELL = 50, PGRID = Math.ceil(WORLD_R * 2 / PCELL);
let paintC = null, paintX = null, cellMark = null, cellTotal = 0;
function resetPaint(){
  if(!paintC){ paintC = document.createElement('canvas'); paintC.width = paintC.height = Math.round(WORLD_R * 2 * PAINT_S); paintX = paintC.getContext('2d'); }
  paintX.clearRect(0, 0, paintC.width, paintC.height);
  cellMark = new Uint8Array(PGRID * PGRID); cellTotal = 0;
  for(let j = 0; j < PGRID; j++) for(let i = 0; i < PGRID; i++){ const x = -WORLD_R + (i + .5) * PCELL, y = -WORLD_R + (j + .5) * PCELL; if(x * x + y * y < WORLD_R * WORLD_R) cellTotal++; else cellMark[j * PGRID + i] = 2; }
}
function paintLoop(poly, col, a){
  const g = paintX, s = PAINT_S, o = WORLD_R;
  g.save();
  g.globalAlpha = a; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 10;
  g.beginPath(); poly.forEach((p, i) => i ? g.lineTo((p.x + o) * s, (p.y + o) * s) : g.moveTo((p.x + o) * s, (p.y + o) * s)); g.closePath(); g.fill();
  g.shadowBlur = 0; g.globalAlpha = Math.min(1, a * 2);
  const bb = polyBox(poly), n = Math.min(40, Math.round(polyArea(poly) / 1500));
  for(let k = 0; k < n; k++){ const x = rnd(bb.x0, bb.x1), y = rnd(bb.y0, bb.y1); if(!inPoly(poly, x, y)) continue; g.fillStyle = pick(BUD_COLS); g.beginPath(); g.arc((x + o) * s, (y + o) * s, rnd(.6, 1.6), 0, TAU); g.fill(); }
  g.restore();
  // coverage
  const pb = G.pbb || (G.pbb = { x0:1e9, y0:1e9, x1:-1e9, y1:-1e9 });
  pb.x0 = Math.min(pb.x0, bb.x0); pb.y0 = Math.min(pb.y0, bb.y0); pb.x1 = Math.max(pb.x1, bb.x1); pb.y1 = Math.max(pb.y1, bb.y1);
  let added = 0;
  const i0 = Math.max(0, Math.floor((bb.x0 + o) / PCELL)), i1 = Math.min(PGRID - 1, Math.floor((bb.x1 + o) / PCELL));
  const j0 = Math.max(0, Math.floor((bb.y0 + o) / PCELL)), j1 = Math.min(PGRID - 1, Math.floor((bb.y1 + o) / PCELL));
  for(let j = j0; j <= j1; j++) for(let i = i0; i <= i1; i++){
    const id = j * PGRID + i; if(cellMark[id]) continue;
    if(inPoly(poly, -o + (i + .5) * PCELL, -o + (j + .5) * PCELL)){ cellMark[id] = 1; added++; }
  }
  if(added){
    G.painted += added;
    const pct = G.painted / cellTotal * 100;
    ev('paint', Math.floor(pct));
    const mile = Math.floor(pct / 10);
    if(mile > G.paintMile){ G.paintMile = mile; const d = Math.round(4 * dustMul()); G.dust += d; toast('MEADOW ' + mile * 10 + '% PAINTED', 'The meadow glows brighter  <b class="gold">+' + d + ' ✦</b>', '#7dffc9', 2600); AU.levelUp(); }
  }
}
function stampFlower(f){
  const g = paintX, s = PAINT_S, o = WORLD_R;
  g.globalAlpha = .8; g.fillStyle = f.col;
  g.beginPath(); g.arc((f.x + o) * s, (f.y + o) * s, Math.max(1.2, f.sz * s * .9), 0, TAU); g.fill();
  g.globalAlpha = 1;
}
const paintPct = () => cellTotal ? G.painted / cellTotal * 100 : 0;

/* ---------------- glooms ---------------- */
function updGlooms(dt){
  const sp0 = gloomSpd();
  for(const e of G.E){
    if(e.dead) continue;
    e.t += dt; if(e.flash > 0) e.flash -= dt; if(e.born > 0) e.born -= dt;
    if(e.caught) continue;
    const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
    let spd = (e.boss ? 46 : e.d.spd) * sp0;
    if(e.type === 'snip'){
      e.x += e.vx * spd * dt; e.y += e.vy * spd * dt;
      if(d > viewR() * 1.5 || !inMeadow(e.x, e.y, -80)) e.dead = true;
    } else {
      let tx = nx, ty = ny;
      if(e.type === 'mote' || e.type === 'weeper'){
        e.hd += Math.sin(e.t * .7 + e.ph) * dt * 1.2;
        tx = Math.cos(e.hd) * .65 + nx * .35; ty = Math.sin(e.hd) * .65 + ny * .35;
      }
      e.vx = lerp(e.vx, tx * spd, Math.min(1, dt * 1.5)); e.vy = lerp(e.vy, ty * spd, Math.min(1, dt * 1.5));
      e.x += e.vx * dt; e.y += e.vy * dt;
      const l = Math.hypot(e.x, e.y); if(l > WORLD_R - e.r){ e.x *= (WORLD_R - e.r) / l; e.y *= (WORLD_R - e.r) / l; e.hd += Math.PI; }
      if(!e.boss && d > viewR() * 2.2) e.dead = true;
    }
    if(e.d.tears || e.boss){
      e.cd -= dt; e.warn = e.cd < .7;
      if(e.cd <= 0 && d < viewR() * 1.1){
        const n = e.boss ? 10 : 6, off = rnd(0, TAU);
        e.cd = e.boss ? 3.6 : gr(3.2, 4.2);
        for(let k = 0; k < n; k++){ const a = off + k / n * TAU; G.T.push({ x:e.x + Math.cos(a) * e.r, y:e.y + Math.sin(a) * e.r, vx:Math.cos(a) * 95 * sp0, vy:Math.sin(a) * 95 * sp0, life:5.5, r:7 }); }
        AU.tear();
      }
    }
    if(G.state !== 'play') continue;
    // touching you dims your light
    if(e.born <= 0 && d < e.r * .85 + P.r) hurt(e.x, e.y);
    // big and sharp glooms snap the ribbon they touch
    if(e.cut) cutTrailAt(e.x, e.y, e.r * .9);
  }
  // soft separation
  const E = G.E, n = E.length;
  for(let i = 0; i < n; i++){
    const a = E[i]; if(a.dead || a.type === 'snip') continue;
    for(let j = i + 1; j < n; j++){
      const b = E[j]; if(b.dead || b.type === 'snip') continue;
      const dx = b.x - a.x, dy = b.y - a.y, rr = (a.r + b.r) * .9, d2 = dx * dx + dy * dy;
      if(d2 < rr * rr && d2 > .01){ const d = Math.sqrt(d2), o = (rr - d) / d * .25, wa = a.boss ? 0 : b.boss ? 1 : .5; a.x -= dx * o * wa; a.y -= dy * o * wa; b.x += dx * o * (1 - wa); b.y += dy * o * (1 - wa); }
    }
  }
  if(E.some(e => e.dead)) G.E = E.filter(e => !e.dead);
}
function updTears(dt){
  for(let i = G.T.length - 1; i >= 0; i--){
    const t = G.T[i];
    t.life -= dt; t.x += t.vx * dt; t.y += t.vy * dt;
    if(t.life <= 0){ G.T.splice(i, 1); continue; }
    if(G.state !== 'play') continue;
    if(cutTrailAt(t.x, t.y, t.r)){ G.T.splice(i, 1); continue; }
    if((t.x - P.x) ** 2 + (t.y - P.y) ** 2 < (t.r + P.r) ** 2){ G.T.splice(i, 1); hurt(t.x, t.y, .4); }
  }
}
function cutTrailAt(x, y, r){
  const TR = G.TR, n = TR.length;
  if(n < 3) return false;
  const r2 = r * r;
  // skip the segment at your own head: that one is you
  for(let k = n - 3; k >= 0; k--){
    const a = TR[k], b = TR[k + 1];
    if(Math.abs(a.x - x) > r + 12 || Math.abs(a.y - y) > r + 12) continue;
    if(segDist2(x, y, a, b) < r2){
      for(let q = 0; q <= k; q += 2) part(TR[q].x, TR[q].y, rnd(-30, 30), rnd(-30, 30), rnd(.3, .6), '#9a8fd0', 2);
      TR.splice(0, k + 1);
      G.trLen = 0; for(let q = 1; q < TR.length; q++) G.trLen += Math.hypot(TR[q].x - TR[q - 1].x, TR[q].y - TR[q - 1].y);
      for(let q = 0; q < 8; q++) part(x, y, rnd(-160, 160), rnd(-160, 160), .4, '#ffffff', 3);
      if(G.rt - G.snapT > .15){ G.snapT = G.rt; AU.snap(); }
      return true;
    }
  }
  return false;
}
function hurt(x, y, k){
  if(P.inv > 0 || G.state !== 'play') return;
  P.inv = 1.3; P.hit = .5;
  const a = Math.atan2(P.y - y, P.x - x);
  P.vx = Math.cos(a) * 420; P.vy = Math.sin(a) * 420;
  if(G.up.halo && G.haloT <= 0){
    G.haloT = 18; AU.parry(); pop(P.x, P.y - 34, 'HALO!', '#ffffff', 16);
    G.FX.push({ ring:true, x:P.x, y:P.y, r:0, max:90, life:.4, max0:.4, c:'#ffffff' });
    return;
  }
  const loss = 20 * (k || 1);
  G.light -= loss; G.chain = 0; G.chainT = 0;
  G.TR.length = 0; G.trLen = 0;
  AU.hurt(); shakeIt(12); G.flash = .6; G.flashCol = '#6a4fb0';
  pop(P.x, P.y - 34, '-' + loss + ' LIGHT', '#c8a8ff', 16);
  for(let i = 0; i < 16; i++) part(P.x, P.y, rnd(-260, 260), rnd(-260, 260), rnd(.3, .6), pick(['#c8a8ff', '#ffffff']), rnd(2, 4));
  if(G.light <= 0){ G.light = 0; die(); }
}
function die(){
  if(G.state !== 'play') return;
  G.state = 'dying'; G.dieT = 1.8; AU.death(); G.flash = .8; G.flashCol = '#241a44';
  G.TR.length = 0;
  for(let i = 0; i < 50; i++){ const a = rnd(0, TAU), s = rnd(40, 260); part(P.x, P.y, Math.cos(a) * s, Math.sin(a) * s, rnd(.8, 1.6), pick([skin().c1, '#ffffff', '#ffd98a']), rnd(2, 5)); }
  AU.setMusic(0);
}

/* ---------------- friends ---------------- */
function addButterfly(x, y, lifeMul){
  if(G.BF.length >= 12) G.BF.shift();
  G.BF.push({ x, y, vx:rnd(-60, 60), vy:rnd(-90, -30), life:(16 + 8 * (G.up.kin || 0)) * (lifeMul || 1), ph:rnd(0, TAU), col:pick(BUD_COLS), tgt:null, cd:.8 });
}
function updButterflies(dt){
  const spd = 190 * (1 + .25 * (G.up.kin || 0));
  for(let i = G.BF.length - 1; i >= 0; i--){
    const f = G.BF[i];
    f.life -= dt; f.ph += dt * 14; if(f.cd > 0) f.cd -= dt;
    if(f.life <= 0){ G.BF.splice(i, 1); for(let k = 0; k < 6; k++) part(f.x, f.y, rnd(-40, 40), rnd(-60, 0), .6, f.col, 2); continue; }
    if(f.tgt && (f.tgt.caught || !G.B.includes(f.tgt))) f.tgt = null;
    if(!f.tgt && f.cd <= 0){
      let best = null, bd = 300 * 300;
      for(const b of G.B){ if(b.caught || b.grow < 1) continue; const d = (b.x - P.x) ** 2 + (b.y - P.y) ** 2; if(d < bd && !G.BF.some(o => o.tgt === b)){ bd = d; best = b; } }
      f.tgt = best;
    }
    let tx, ty;
    if(f.tgt){ tx = f.tgt.x; ty = f.tgt.y; }
    else { const a = G.rt * .9 + i * 1.3; tx = P.x + Math.cos(a) * 70; ty = P.y + Math.sin(a) * 50 - 20; }
    const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy) || 1;
    f.vx = lerp(f.vx, dx / d * spd + Math.sin(f.ph * .3) * 60, Math.min(1, dt * 3)); f.vy = lerp(f.vy, dy / d * spd + Math.cos(f.ph * .27) * 60, Math.min(1, dt * 3));
    f.x += f.vx * dt; f.y += f.vy * dt;
    if(f.tgt && d < f.tgt.r + 8 && G.state === 'play'){ const b = f.tgt; f.tgt = null; f.cd = 1.4 / (1 + .5 * (G.up.kin || 0)); b.caught = true; bloom(b, 4 + ((Math.random() * 5) | 0), 1); }
  }
}
function updTwin(dt){
  if(!G.up.twin){ G.twin = null; return; }
  if(!G.twin) G.twin = { x:P.x, y:P.y, a:0 };
  const t = G.twin; t.a += dt * 2.6;
  const tx = P.x + Math.cos(t.a) * 58, ty = P.y + Math.sin(t.a) * 58;
  t.x = lerp(t.x, tx, Math.min(1, dt * 10)); t.y = lerp(t.y, ty, Math.min(1, dt * 10));
  for(const b of G.B) if(!b.caught && b.grow >= 1 && (b.x - t.x) ** 2 + (b.y - t.y) ** 2 < (b.r + 10) ** 2){ b.caught = true; bloom(b, 6, 1); break; }
}
function updMotes(dt){
  const mag = 110 + 70 * (G.up.pollen || 0);
  for(let i = G.MO.length - 1; i >= 0; i--){
    const m = G.MO[i];
    m.t += dt;
    const dx = P.x - m.x, dy = P.y - m.y, d = Math.hypot(dx, dy) || 1;
    if(m.t > .35 || d < mag){
      const s = 380 + m.t * 500;
      m.vx = lerp(m.vx, dx / d * s, Math.min(1, dt * 5)); m.vy = lerp(m.vy, dy / d * s, Math.min(1, dt * 5));
    } else { const f = Math.exp(-3 * dt); m.vx *= f; m.vy *= f; }
    m.x += m.vx * dt; m.y += m.vy * dt;
    if(d < P.r + 10){
      G.MO.splice(i, 1);
      if(G.state !== 'play') continue;
      if(m.kind === 'dust'){ const v = m.v * dustMul(); G.dust += v; AU.dust(); pop(P.x + rnd(-14, 14), P.y - 26, '+' + Math.round(v) + ' ✦', '#fff38a', 13); }
      else { addLight(m.v); AU.mote(); }
      continue;
    }
    if(m.t > 6) G.MO.splice(i, 1);
  }
}

/* ---------------- fx ---------------- */
function partCap(){ return G.q === 'low' ? 260 : 800; }
function part(x, y, vx, vy, life, c, s){ if(G.PT.length < partCap()) G.PT.push({ x, y, vx, vy, life, max:life, c, s }); }
function pop(x, y, txt, c, size){ if(G.POP.length > 10) G.POP.shift(); G.POP.push({ x, y, txt, c, size:size || 14, life:1.1 }); }
function shakeIt(v){ if(save.opt.shake) G.shake = Math.min(18, G.shake + v); }
function tickFx(dt){
  for(let i = G.PT.length - 1; i >= 0; i--){ const p = G.PT[i]; p.life -= dt; if(p.life <= 0){ G.PT.splice(i, 1); continue; } const f = Math.exp(-2.6 * dt); p.vx *= f; p.vy *= f; p.x += p.vx * dt; p.y += p.vy * dt; }
  for(let i = G.POP.length - 1; i >= 0; i--){ const p = G.POP[i]; p.life -= dt; p.y -= 34 * dt / G.camZ; if(p.life <= 0) G.POP.splice(i, 1); }
  for(let i = G.FX.length - 1; i >= 0; i--){ const f = G.FX[i]; f.life -= dt; if(f.ring) f.r = f.max * (1 - Math.pow(f.life / f.max0, 2)); if(f.life <= 0) G.FX.splice(i, 1); }
  for(let i = G.LP.length - 1; i >= 0; i--){ const l = G.LP[i]; l.life -= dt; if(l.life <= 0) G.LP.splice(i, 1); }
  for(const f of G.F) f.t += dt;
}
function skin(){ return SKINS.find(s => s.id === save.skin) || SKINS[0]; }

/* ---------------- missions ---------------- */
function ev(type, v){
  if(G.state !== 'play') return;
  const r = G.runEv, mt = MT.find(m => m.ev === type);
  if(!mt) return;
  r[type] = mt.kind === 'sum' ? (r[type] || 0) + v : Math.max(r[type] || 0, v);
  for(const m of save.missions){
    if(m.done || m.ev !== type) continue;
    const prog = mt.kind === 'sum' ? m.p + r[type] : Math.max(m.p, r[type]);
    if(prog >= m.n){
      m.done = true; m.p = m.n; m.fresh = true;
      save.dust += m.reward; save.missionsDone++;
      save.mTier[m.id] = (save.mTier[m.id] || 0) + 1;
      toast('MISSION COMPLETE', m.txt + '  <b class="gold">+' + m.reward + ' ✦</b>', '#7dffc9', 3400);
      AU.levelUp(); persist();
    }
  }
}
function commitMissions(){
  for(const m of save.missions){
    if(m.done) continue;
    const mt = MT.find(t => t.id === m.id), r = G.runEv[m.ev] || 0;
    m.p = mt.kind === 'sum' ? m.p + r : Math.max(m.p, r);
  }
}
function rollMissions(){
  save.missions = save.missions.filter(m => !m.done);
  const have = new Set(save.missions.map(m => m.id));
  let guard = 0;
  while(save.missions.length < 3 && guard++ < 60){
    const t = pick(MT); if(have.has(t.id)) continue;
    const tier = save.mTier[t.id] || 0;
    const n = Math.round(t.vals[Math.min(tier, t.vals.length - 1)] * (tier >= t.vals.length ? 1 + (tier - t.vals.length + 1) * .5 : 1));
    save.missions.push({ id:t.id, ev:t.ev, n, p:0, done:false, txt:t.txt(n), reward:30 + tier * 25 });
    have.add(t.id); save.mNew = true;
  }
}
