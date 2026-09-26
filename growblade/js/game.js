'use strict';
/* =====================================================================
   GROWBLADE — simulation
   The blade is a rigid rod pivoting in your hand. Moving the hand
   (accelerating, turning) swings it, like real inertia. Enemies are
   convex polygons that split EXACTLY along the blade's line.
   Every gem grows the blade; getting hit shrinks it.
   ===================================================================== */
const G = {
  state:'boot', t:0, rt:0, score:0, slices:0, perfects:0, kills:0, combo:0, comboT:0, maxCombo:0,
  E:[], O:[], GM:[], PT:[], POP:[], DB:[], TR:[], TM:[], FX:[],
  spawnT:0, bossT:75, boss:null, bossArea:0, growth:0, L:70, L0:70, tier:0, maxL:70,
  up:{}, gold:0, revived:false, daily:false, mod:null, hitstop:0, slow:0, timeScale:1, shake:0, flash:0, flashCol:'#fff',
  camX:0, camY:0, camZ:1, tut:false, tutStep:0, tutT:0, vampN:0, runEv:{}, dieT:0, q:'high', pendingCards:false,
};
let P = null, BL = null;

/* ---------------- tuning helpers ---------------- */
const sizeScale = () => Math.pow(G.L / 70, .85);            // how big enemies are right now
const unitS = () => 22 * sizeScale();
const killR = () => Math.max(9, unitS() * .6);                // pieces smaller than this shatter
const cutMul = () => 1 - .2 * (G.up.edge || 0);
const moveSpd = () => 250 * Math.pow(G.L / 70, .38) * (1 + .12 * (G.up.swift || 0)) * (G.mod && G.mod.id === 'rush' ? 1.15 : 1);
const growthMul = () => 1 + .25 * (G.up.grow || 0);
const goldMul = () => (1 + .15 * (save.meta.gold || 0)) * (G.mod ? ({ giants:1.5, glass:2, rush:1.5 })[G.mod.id] || 1 : 1);
const bladeLenFor = g => G.L0 + 22 * Math.sqrt(Math.max(0, g));

/* ---------------- run lifecycle ---------------- */
function newRun(daily){
  G.daily = !!daily;
  if(daily){ const seed = hashStr('growblade:' + todayKey()); grng = mulberry32(seed); G.mod = MODS[seed % MODS.length]; }
  else { grng = Math.random; G.mod = null; }
  for(const k of ['E','O','GM','PT','POP','DB','TR','TM','FX']) G[k].length = 0;
  Object.assign(G, { t:0, score:0, slices:0, perfects:0, kills:0, combo:0, comboT:0, maxCombo:0, spawnT:1.2, bossT:75, boss:null,
    growth:0, up:{}, gold:0, revived:false, hitstop:0, slow:0, timeScale:1, shake:0, flash:0, vampN:0, runEv:{}, dieT:0, pendingCards:false });
  G.L0 = 70 + 12 * (save.meta.start || 0);
  G.L = G.L0; G.maxL = G.L; G.tier = tierOf(G.L);
  const hp = G.mod && G.mod.id === 'glass' ? 1 : 3 + (save.meta.heart || 0);
  P = { x:0, y:0, vx:0, vy:0, r:18, hp, maxHp:hp, inv:1, dashCd:0, dashT:0, face:0, ax:0, ay:0 };
  BL = { ang:-Math.PI / 2, w:0, trail:[], trail2:[], swishT:0 };
  G.camX = 0; G.camY = 0; G.camZ = targetZoom();
  G.tut = !save.tut; G.tutStep = 0; G.tutT = 0;
  G.state = 'play';
  // instant hook: a ring of fat blobs right away
  for(let i = 0; i < 5; i++){ const a = i / 5 * TAU + .3, d = 280 + i * 45; const e = spawnEnemy('blob', Math.cos(a) * d, Math.sin(a) * d, 1.3); e.imm = .8; }
  if(G.tut) tip('Your sword <b>spins</b>. <b>MOVE</b> into shapes to slice them!');
  AU.setMusic(1);
}
function targetZoom(){ return Math.min(W, H) / (G.L * 3.3 + 300); }

/* ---------------- geometry ---------------- */
function regularPoly(n, r, jit){
  const v = [], off = gr(0, TAU);
  for(let i = 0; i < n; i++){ const a = off + i / n * TAU, rr = r * (1 + gr(-jit, jit)); v.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  return v;
}
function polyArea(v){ let s = 0; for(let i = 0; i < v.length; i++){ const a = v[i], b = v[(i + 1) % v.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }
function polyCentroid(v){
  let cx = 0, cy = 0, A = 0;
  for(let i = 0; i < v.length; i++){ const a = v[i], b = v[(i + 1) % v.length], c = a[0] * b[1] - b[0] * a[1]; A += c; cx += (a[0] + b[0]) * c; cy += (a[1] + b[1]) * c; }
  if(Math.abs(A) < 1e-6) return [v[0][0], v[0][1]];
  return [cx / (3 * A), cy / (3 * A)];
}
function worldVerts(e){
  const c = Math.cos(e.ang), s = Math.sin(e.ang);
  return e.v.map(p => [e.x + p[0] * c - p[1] * s, e.y + p[0] * s + p[1] * c]);
}
function splitPoly(v, px, py, dx, dy){
  const nx = -dy, ny = dx, A = [], Bv = [];
  for(let i = 0; i < v.length; i++){
    const a = v[i], b = v[(i + 1) % v.length];
    const da = (a[0] - px) * nx + (a[1] - py) * ny, db = (b[0] - px) * nx + (b[1] - py) * ny;
    if(da >= 0) A.push(a);
    if(da <= 0) Bv.push(a);
    if((da > 0 && db < 0) || (da < 0 && db > 0)){ const t = da / (da - db), q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; A.push(q); Bv.push(q); }
  }
  if(A.length < 3 || Bv.length < 3) return null;
  return [A, Bv];
}
function pointInConvex(v, x, y){
  let sgn = 0;
  for(let i = 0; i < v.length; i++){
    const a = v[i], b = v[(i + 1) % v.length], c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    if(c !== 0){ const s = c > 0 ? 1 : -1; if(sgn && s !== sgn) return false; sgn = s; }
  }
  return true;
}
// blade segment h->t vs polygon: returns [u0,u1] (fractions along the blade) or null
function segPoly(v, hx, hy, tx, ty){
  const dx = tx - hx, dy = ty - hy; let u0 = 2, u1 = -1, hit = false;
  for(let i = 0; i < v.length; i++){
    const a = v[i], b = v[(i + 1) % v.length], ex = b[0] - a[0], ey = b[1] - a[1];
    const den = dx * ey - dy * ex; if(Math.abs(den) < 1e-9) continue;
    const u = ((a[0] - hx) * ey - (a[1] - hy) * ex) / den, w = ((a[0] - hx) * dy - (a[1] - hy) * dx) / den;
    if(u >= 0 && u <= 1 && w >= 0 && w <= 1){ hit = true; u0 = Math.min(u0, u); u1 = Math.max(u1, u); }
  }
  if(pointInConvex(v, hx, hy)){ hit = true; u0 = 0; u1 = Math.max(u1, 0); }
  if(pointInConvex(v, tx, ty)){ hit = true; u1 = 1; u0 = Math.min(u0, 1); }
  return hit ? [u0, u1] : null;
}

/* ---------------- enemies ---------------- */
function spawnEnemy(type, x, y, scaleMul, boss){
  const d = ET[type], s = unitS() * (scaleMul || 1) * (G.mod && G.mod.id === 'giants' ? 1.45 : G.mod && G.mod.id === 'swarm' ? .7 : 1);
  const r = boss ? Math.max(170, G.L * 1.7) : s * d.r * gr(.85, 1.15);
  const v = boss ? regularPoly(7, r, .22) : regularPoly(d.sides, r, d.sides <= 4 ? .06 : .1);
  const e = { type, d, x, y, vx:0, vy:0, ang:gr(0, TAU), av:gr(-.6, .6), v, R:r * 1.3, area:polyArea(v), imm:.2, flash:0, t:gr(0, 9),
    cd:gr(1.5, 3), dead:false, boss:!!boss, burn:0, born:0, cut:null, st:'walk', stT:gr(1.5, 3) };
  e.origArea = e.area;
  G.E.push(e);
  return e;
}
function makePiece(parent, wv, cutA, cutB){
  const c = polyCentroid(wv), ca = Math.cos(-parent.ang), sa = Math.sin(-parent.ang);
  const local = wv.map(p => { const x = p[0] - c[0], y = p[1] - c[1]; return [x * ca - y * sa, x * sa + y * ca]; });
  let R = 0; for(const p of local) R = Math.max(R, Math.hypot(p[0], p[1]));
  const loc = p => { const x = p[0] - c[0], y = p[1] - c[1]; return [x * ca - y * sa, x * sa + y * ca]; };
  return { type:parent.type, d:parent.d, x:c[0], y:c[1], vx:parent.vx, vy:parent.vy, ang:parent.ang, av:parent.av, v:local, R, area:polyArea(local),
    imm:.16, flash:.12, t:parent.t, cd:parent.cd, dead:false, boss:parent.boss, burn:parent.burn, born:1, cut:[loc(cutA), loc(cutB)], cutT:.35,
    origArea:parent.origArea, st:'walk', stT:gr(1, 2) };
}

/* the cut: split e along the blade line through (px,py) with direction (dx,dy) */
function cutEnemy(e, px, py, dx, dy, speed, src){
  const wv = worldVerts(e), parts = splitPoly(wv, px, py, dx, dy);
  if(!parts) return false;
  const a1 = polyArea(parts[0]), a2 = polyArea(parts[1]);
  if(Math.min(a1, a2) < e.area * .03) return false;          // grazing the corner: no cut
  e.dead = true;
  const ratio = Math.min(a1, a2) / Math.max(a1, a2);
  // the new edge (for the glowing cut line)
  const on = parts[0].filter(p => Math.abs((p[0] - px) * -dy + (p[1] - py) * dx) < 1e-3);
  const cA = on[0] || [px, py], cB = on[on.length - 1] || [px + dx, py + dy];
  const nx = -dy, ny = dx, kick = 90 + Math.min(260, speed * .12);
  const live = G.state === 'play';           // the menu backdrop swings too, but never counts
  if(live){ G.slices++; save.stats.slices++; ev('slice', 1); }
  G.combo++; G.comboT = 1.3; if(G.combo > G.maxCombo){ G.maxCombo = G.combo; } if(live) ev('combo', G.combo);
  if(e.d.metal && live) ev('steel', 1);
  let perfect = false;
  if(ratio >= .88 && src === 'blade'){ perfect = true; if(live){ G.perfects++; save.stats.perfect++; ev('perfect', 1); } }
  const pieces = [];
  [parts[0], parts[1]].forEach((pv, i) => {
    const p = makePiece(e, pv, cA, cB), sg = i === 0 ? 1 : -1;
    p.vx += nx * kick * sg + e.vx * .2; p.vy += ny * kick * sg + e.vy * .2; p.av += sg * gr(1.5, 4);
    // fresh pieces are knocked away from you and can't hurt you for a moment (no unfair hits from your own cut)
    const rx = p.x - P.x, ry = p.y - P.y, rl = Math.hypot(rx, ry) || 1;
    p.vx += rx / rl * (150 + kick * .5); p.vy += ry / rl * (150 + kick * .5); p.harm = .6;
    pieces.push(p);
  });
  // flash line
  G.FX.push({ x1:cA[0] - dx * 30, y1:cA[1] - dy * 30, x2:cB[0] + dx * 30, y2:cB[1] + dy * 30, life:.22, max:.22, c:perfect ? '#ffd23c' : '#ffffff' });
  const kr = killR();
  let died = 0;
  for(const p of pieces){
    const eq = Math.sqrt(p.area / Math.PI);
    if(eq < kr * (p.boss ? .7 : 1) || (G.up.fire && eq < kr * 1.5 && !p.boss)) { shatter(p, perfect); died++; }
    else { p.cutT = .35; G.E.push(p); if(G.up.fire) p.burn = 1.4; }
  }
  // feedback
  const sz = Math.sqrt(e.area);
  AU.slice(sz / unitS(), perfect, G.combo);
  G.hitstop = Math.min(.09, G.hitstop + (perfect ? .06 : .018));
  shakeIt(Math.min(10, 2 + sz / unitS() * 1.4));
  for(let i = 0; i < 10; i++){ const s = rnd(-1, 1); part(lerp(cA[0], cB[0], rnd(0, 1)), lerp(cA[1], cB[1], rnd(0, 1)), nx * s * rnd(80, 300), ny * s * rnd(80, 300), rnd(.2, .45), i % 2 ? '#ffffff' : e.d.col, rnd(2, 5)); }
  const mx = (cA[0] + cB[0]) / 2, my = (cA[1] + cB[1]) / 2;
  // labels are throttled so huge blades mowing crowds don't bury the screen in text
  if(perfect){ G.score += 150 * G.combo; if(G.rt - (G.lastPerfPop || -9) > .35){ G.lastPerfPop = G.rt; pop(mx, my - 20, 'PERFECT HALF!', '#ffd23c', 22); } }
  else if(ratio > .7 && Math.random() < .35 && G.rt - (G.lastCleanPop || -9) > .5){ G.lastCleanPop = G.rt; pop(mx, my - 20, 'CLEAN CUT', '#ffffff', 16); }
  G.score += Math.round(sz * .6 * (1 + G.combo * .1));
  if(G.combo >= 5 && G.combo % 5 === 0){ const c = G.combo >= 40 ? ['GODSLICE!', '#ff5ad9'] : G.combo >= 25 ? ['BLADESTORM!', '#b18cff'] : G.combo >= 15 ? ['MASSACRE!', '#ff5a3c'] : ['x' + G.combo + ' COMBO', '#ffd23c']; announce(c[0], c[1]); AU.announce(); }
  if(e.d.boom && !e.boom){ e.boom = 1; G.TM.push({ t:.05, f:() => explode(e.x, e.y, e.R * 2.2) }); }
  if(G.tut && G.tutStep === 0){ G.tutStep = 1; tip('Big shapes <b>split</b> in two. Small pieces <b>shatter</b> into gems!'); }
  if(G.up.vamp){ G.vampN++; if(G.vampN >= 40){ G.vampN = 0; if(P.hp < P.maxHp){ P.hp++; pop(P.x, P.y - 40, '+1 ♥', '#ff5ad9', 20); } } }
  return true;
}
function shatter(p, perfect){
  p.dead = true; G.kills++;
  G.DB.push({ v:p.v, x:p.x, y:p.y, vx:p.vx * 1.2, vy:p.vy * 1.2, ang:p.ang, av:p.av * 1.5, col:p.d.col, life:.35, max:.35, boss:p.boss });
  const norm = p.area / (unitS() * unitS());
  const val = Math.max(.35, norm) * (perfect ? 2 : 1) * (p.boss ? 1.6 : 1);
  const n = clamp(Math.round(val * 1.2), 1, p.boss ? 10 : 5);
  for(let i = 0; i < n; i++){ const a = rnd(0, TAU), s = rnd(60, 220); G.GM.push({ x:p.x, y:p.y, vx:Math.cos(a) * s + p.vx * .3, vy:Math.sin(a) * s + p.vy * .3, v:val / n, life:14, big:val / n > 1.2 }); }
  for(let i = 0; i < 8; i++){ const a = rnd(0, TAU), s = rnd(50, 260); part(p.x, p.y, Math.cos(a) * s, Math.sin(a) * s, rnd(.3, .6), p.d.col, rnd(3, 6)); }
  if(G.up.shards){ for(let k = 0; k < 2 + G.up.shards; k++){ const a = rnd(0, TAU); G.O.push({ x:p.x, y:p.y, vx:Math.cos(a) * 520, vy:Math.sin(a) * 520, r:6 * Math.sqrt(sizeScale()), friendly:true, life:.7, shard:true }); } }
  if(p.boss && !G.E.some(e => !e.dead && e.boss)) bossDown();
}
function explode(x, y, r){
  AU.boom(); shakeIt(14); G.flash = .35; G.flashCol = '#ff7a2e';
  G.FX.push({ ring:true, x, y, r:0, max:r, life:.35, c:'#ffb020' });
  for(let i = 0; i < 30; i++){ const a = rnd(0, TAU), s = rnd(80, 500); part(x, y, Math.cos(a) * s, Math.sin(a) * s, rnd(.3, .7), pick(['#ffb020', '#ff5a3c', '#ffe08a']), rnd(3, 7)); }
  for(const e of G.E){
    if(e.dead || Math.hypot(e.x - x, e.y - y) > r + e.R * .5) continue;
    const a = rnd(0, TAU); e.imm = 0;
    cutEnemy(e, e.x, e.y, Math.cos(a), Math.sin(a), 300, 'boom');
  }
  if(Math.hypot(P.x - x, P.y - y) < r * .55 + P.r) hurt(x, y);
}

/* ---------------- boss ---------------- */
function spawnBoss(){
  const a = rnd(0, TAU), d = viewR() * 1.1;
  const e = spawnEnemy('hexa', P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, 1, true);
  e.d = { ...ET.hexa, col:'#7a64d6', spd:48, hard:220, name:'Monolith' };
  G.boss = e; G.bossArea = e.area;
  announce('MONOLITH', '#b18cff', 'A GIANT APPROACHES'); AU.bossHorn(); AU.setMusic(3, true);
  toast('THE MONOLITH', 'Carve it apart piece by piece. Every chunk still fights!', '#b18cff', 4000);
}
function bossDown(){
  G.boss = null; G.slow = 1.2; G.flash = .8; G.flashCol = '#b18cff';
  announce('MONOLITH SHATTERED', '#ffd23c', '+' + Math.round(40 * goldMul()) + ' GOLD');
  G.gold += 40 * goldMul(); ev('boss', 1); SDK.happytime(); AU.tierUp(); AU.setMusic(2);
  if(P.hp < P.maxHp){ P.hp++; pop(P.x, P.y - 40, '+1 ♥', '#ff5ad9', 20); }
}

/* ---------------- spawning ---------------- */
function viewR(){ return Math.hypot(W, H) / 2 / G.camZ; }
function tickSpawns(dt){
  if(G.tut && G.tutStep < 2) return;
  G.bossT -= dt;
  if(G.bossT <= 0 && !G.boss){ spawnBoss(); G.bossT = 100; }
  const alive = G.E.length, maxAlive = Math.min(70, 20 + G.tier * 5 + G.t * .04) * (G.mod && G.mod.id === 'swarm' ? 1.6 : 1);
  G.spawnT -= dt;
  if(G.spawnT > 0 || alive >= maxAlive) return;
  const rate = Math.min(4.5, .75 + G.t * .01 + G.tier * .18) * (G.mod && G.mod.id === 'swarm' ? 1.8 : 1);
  G.spawnT = 1 / rate * gr(.6, 1.4);
  const types = Object.keys(ET).filter(k => ET[k].at <= G.t);
  let tot = 0; const wOf = k => ET[k].w * (G.mod && G.mod.id === 'steel' && k === 'armor' ? 6 : 1);
  for(const k of types) tot += wOf(k);
  let r = grng() * tot, type = 'blob';
  for(const k of types){ r -= wOf(k); if(r <= 0){ type = k; break; } }
  const a = gr(0, TAU), d = viewR() * gr(1.02, 1.25), cx = P.x + Math.cos(a) * d, cy = P.y + Math.sin(a) * d;
  const group = type === 'blob' ? 2 + ((grng() * 4) | 0) : type === 'dart' ? 2 + ((grng() * 2) | 0) : 1;
  for(let i = 0; i < group; i++) spawnEnemy(type, cx + gr(-80, 80) * sizeScale(), cy + gr(-80, 80) * sizeScale(), gr(.8, 1.35));
  if(!save.seen[type] && ET[type].tip){ save.seen[type] = 1; persist(); toast('NEW ENEMY', ET[type].tip, ET[type].col, 4200); }
}

/* ---------------- input ---------------- */
const IN = { mx:0, my:0, mouse:false, keys:{}, joy:null, dash:false };
function inputVec(){
  if(G.state === 'menuplay') return G.menuIn || [0, 0];
  let x = 0, y = 0;
  const k = IN.keys;
  if(k.a || k.arrowleft) x -= 1; if(k.d || k.arrowright) x += 1; if(k.w || k.arrowup) y -= 1; if(k.s || k.arrowdown) y += 1;
  if(x || y){ const l = Math.hypot(x, y); return [x / l, y / l]; }
  if(IN.joy && IN.joy.on){ const dx = IN.joy.x - IN.joy.ox, dy = IN.joy.y - IN.joy.oy, l = Math.hypot(dx, dy); if(l < 6) return [0, 0]; const m = Math.min(1, l / 60); return [dx / l * m, dy / l * m]; }
  if(IN.mouse){
    const wx = (IN.mx - W / 2) / G.camZ + G.camX, wy = (IN.my - H / 2) / G.camZ + G.camY;
    const dx = wx - P.x, dy = wy - P.y, l = Math.hypot(dx, dy), dead = P.r * 1.2;
    if(l < dead) return [0, 0];
    const m = Math.min(1, (l - dead) / (90 / G.camZ));
    return [dx / l * m, dy / l * m];
  }
  return [0, 0];
}
function tryDash(){
  if(G.state !== 'play' || P.dashCd > 0) return;
  let [ix, iy] = inputVec(); let l = Math.hypot(ix, iy);
  if(l < .1){ const s = Math.hypot(P.vx, P.vy); if(s > 10){ ix = P.vx / s; iy = P.vy / s; } else { ix = Math.cos(P.face); iy = Math.sin(P.face); } l = 1; }
  ix /= l; iy /= l;
  const sp = moveSpd();
  P.vx += ix * sp * 2.6; P.vy += iy * sp * 2.6;
  // a dash also whips the blade: spin it the way it is already turning (or across the dash)
  const d = [Math.cos(BL.ang), Math.sin(BL.ang)], cr = d[0] * iy - d[1] * ix;
  const dir = Math.abs(BL.w) > 2 ? Math.sign(BL.w) : (cr >= 0 ? -1 : 1);
  BL.w = dir * Math.max(Math.abs(BL.w), 8.2 * Math.pow(70 / G.L, .4)) * 2.3; BL.dir = dir;
  P.dashCd = 2.1 * (1 - .3 * (G.up.dash || 0)) * (1 - .18 * (save.meta.dash || 0));
  P.dashT = .22; P.inv = Math.max(P.inv, .25);
  AU.dash();
  for(let i = 0; i < 12; i++) part(P.x, P.y, -ix * rnd(100, 300) + rnd(-60, 60), -iy * rnd(100, 300) + rnd(-60, 60), rnd(.2, .4), '#ffffff', rnd(2, 4));
}

/* ---------------- main update ---------------- */
function update(dt){
  G.rt += dt;
  G.shake = Math.max(0, G.shake - dt * 30); G.flash = Math.max(0, G.flash - dt * 2.5);
  if(G.hitstop > 0){ G.hitstop -= dt; return; }
  const target = G.state === 'dying' ? .25 : G.slow > 0 ? .3 : 1;
  G.timeScale = lerp(G.timeScale, target, Math.min(1, dt * 8));
  if(G.slow > 0) G.slow -= dt;
  const gdt = dt * G.timeScale;
  if(G.state === 'dying'){ G.dieT -= dt; tickFx(gdt); updEnemies(gdt); if(G.dieT <= 0) onDeathDone(); return; }
  G.t += gdt;
  updPlayer(gdt);
  updEnemies(gdt);
  updOrbs(gdt);
  updGems(gdt);
  tickSpawns(gdt);
  for(let i = G.TM.length - 1; i >= 0; i--){ const t = G.TM[i]; t.t -= gdt; if(t.t <= 0){ G.TM.splice(i, 1); t.f(); } }
  tickFx(gdt);
  if(G.comboT > 0){ G.comboT -= gdt; if(G.comboT <= 0) G.combo = 0; }
  ev('time', G.t);
  // camera
  G.camZ = lerp(G.camZ, targetZoom(), Math.min(1, dt * 1.5));
  G.camX = lerp(G.camX, P.x + P.vx * .12, Math.min(1, dt * 6)); G.camY = lerp(G.camY, P.y + P.vy * .12, Math.min(1, dt * 6));
  // tutorial
  if(G.tut){
    G.tutT += dt;
    if(G.tutStep === 1 && G.growth > 0){ G.tutStep = 2; G.tutT = 0; tip('Gems <b>grow your blade</b>. Tap / click / SPACE to <em>DASH-SPIN</em>!'); }
    if(G.tutStep === 2 && G.tutT > 5){ G.tut = false; save.tut = true; persist(); tip(null); }
  }
  if(G.pendingCards){ G.pendingCards = false; openCards(); }
}

function updPlayer(dt){
  const [ix, iy] = inputVec(), sp = moveSpd();
  const ovx = P.vx, ovy = P.vy;
  const k = P.dashT > 0 ? 2.5 : 9;
  P.vx = lerp(P.vx, ix * sp, Math.min(1, dt * k)); P.vy = lerp(P.vy, iy * sp, Math.min(1, dt * k));
  if(P.dashT > 0) P.dashT -= dt;
  if(P.dashCd > 0) P.dashCd -= dt;
  if(P.inv > 0) P.inv -= dt;
  const ax = (P.vx - ovx) / Math.max(dt, 1e-4), ay = (P.vy - ovy) / Math.max(dt, 1e-4);
  if(Math.hypot(P.vx, P.vy) > 20) P.face = Math.atan2(P.vy, P.vx);
  // blade physics in substeps so fast swings never skip over an enemy
  const L = G.L;
  const steps = clamp(Math.ceil(Math.max(Math.abs(BL.w) * dt / .045, Math.hypot(P.vx, P.vy) * dt / Math.max(6, unitS() * .4))), 1, 10);
  const sdt = dt / steps;
  // the blade is motorised: it always spins at a base rate, your movement and dashes whip it faster
  const spinBase = 8.2 * Math.pow(70 / L, .4) * (1 + .15 * (G.up.spin || 0));
  const maxW = 24 * Math.pow(70 / L, .25);
  if(!BL.dir) BL.dir = 1;
  for(let s = 0; s < steps; s++){
    P.x += P.vx * sdt; P.y += P.vy * sdt;
    const dx = Math.cos(BL.ang), dy = Math.sin(BL.ang);
    // rigid rod pivoting at an accelerating hand: alpha = 3/(2L) * (d x -a)
    let alpha = 1.5 / L * (dy * ax - dx * ay) * .6;
    BL.w += alpha * sdt;
    if(Math.abs(BL.w) > .5) BL.dir = Math.sign(BL.w);
    BL.w = lerp(BL.w, BL.dir * spinBase, Math.min(1, sdt * 1.4));
    BL.w = clamp(BL.w, -maxW, maxW);
    BL.ang += BL.w * sdt;
    bladeCollide(BL.ang, L);
    if(G.up.twin) bladeCollide(BL.ang + Math.PI, L * .85);
  }
  // swoosh sound as the tip speeds past a threshold
  const tipSpd = Math.abs(BL.w) * L;
  BL.swishT -= dt;
  if(tipSpd > 700 && BL.swishT <= 0){ AU.swish(Math.min(1, tipSpd / 2000)); BL.swishT = .28; }
  // trails
  const hx = P.x, hy = P.y;
  BL.trail.push({ hx, hy, ang:BL.ang, L, a:0 });
  if(BL.trail.length > 9) BL.trail.shift();
  for(const t of BL.trail) t.a += dt;
  // body contact
  for(const e of G.E){
    if(e.dead || e.imm > 0 || e.harm > 0) continue;
    const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1, rr = P.r + e.R * .5;
    if(d < rr){
      // bumping is safe for a moment: shapes only bite if they stay on you (charging darts and bosses bite at once)
      const push = (rr - d) * .5;
      e.x += dx / d * push; e.y += dy / d * push; P.x -= dx / d * push * .6; P.y -= dy / d * push * .6;
      e.touch = (e.touch || 0) + dt;
      if(e.touch >= .35 || e.st === 'dash' || e.boss){ e.touch = 0; hurt(e.x, e.y); if(G.state !== 'play') return; }
    } else if(e.touch > 0) e.touch = Math.max(0, e.touch - dt * 2);
  }
}

function bladeCollide(ang, L){
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const hx = P.x + dx * P.r * .6, hy = P.y + dy * P.r * .6, tx = P.x + dx * (L + P.r * .6), ty = P.y + dy * (L + P.r * .6);
  const vperp = P.vx * nx + P.vy * ny;
  const n = G.E.length;
  for(let i = 0; i < n; i++){
    const e = G.E[i];
    if(e.dead || e.imm > 0) continue;
    // quick reject: distance from center to segment
    const px = e.x - hx, py = e.y - hy, proj = clamp(px * dx + py * dy, 0, L), qx = hx + dx * proj - e.x, qy = hy + dy * proj - e.y;
    if(qx * qx + qy * qy > e.R * e.R) continue;
    const wv = worldVerts(e), hit = segPoly(wv, hx, hy, tx, ty);
    if(!hit) continue;
    const sMid = (hit[0] + hit[1]) / 2 * L;
    const spd = Math.abs(BL.w * sMid + vperp);
    const need = e.d.hard * cutMul() * Math.pow(sizeScale(), .35);
    if(spd >= need){
      if(cutEnemy(e, hx, hy, dx, dy, spd, 'blade')) BL.w *= e.d.metal ? .8 : .985;
    } else {
      // blocked: shove it off the blade, the blade loses momentum
      const side = Math.sign((e.x - hx) * nx + (e.y - hy) * ny) || 1;
      e.vx += nx * side * 160; e.vy += ny * side * 160; e.x += nx * side * 3; e.y += ny * side * 3;
      BL.w *= .8; e.imm = .1;
      if(e.d.metal && spd > 150){ AU.clang(); pop(e.x, e.y - e.R, 'TOO SLOW', '#cfd8ea', 14); for(let k = 0; k < 6; k++) part(e.x - nx * side * e.R * .5, e.y - ny * side * e.R * .5, rnd(-200, 200), rnd(-200, 200), .3, '#ffffff', 3); }
      else if(spd > 60) AU.thud();
    }
  }
  // orbs: deflect with any real swing
  for(const o of G.O){
    if(o.friendly || o.dead) continue;
    const px = o.x - hx, py = o.y - hy, proj = px * dx + py * dy;
    if(proj < 0 || proj > L) continue;
    const dist = Math.abs(px * nx + py * ny);
    if(dist > o.r + 6) continue;
    const spd = Math.abs(BL.w * proj + vperp);
    if(spd < 120) continue;
    const sg = Math.sign(BL.w * proj + vperp) || 1, sp = 560;
    o.vx = nx * sg * sp + dx * sp * .3; o.vy = ny * sg * sp + dy * sp * .3; o.friendly = true; o.life = 2;
    AU.parry(); ev('parry', 1); pop(o.x, o.y - 18, 'PARRY!', '#3ddc84', 15);
  }
}

function hurt(x, y){
  if(P.inv > 0 || G.state !== 'play') return;
  P.hp--; P.inv = 1.7;
  for(const e of G.E){ const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1; if(d < viewR() * .4 && !e.boss){ e.vx = dx / d * 520; e.vy = dy / d * 520; } }
  const lost = G.growth * .2;
  G.growth -= lost; setLen();
  const a = Math.atan2(P.y - y, P.x - x);
  P.vx = Math.cos(a) * 520; P.vy = Math.sin(a) * 520;
  for(let i = 0; i < Math.min(8, Math.ceil(lost)); i++){ const b = rnd(0, TAU), s = rnd(150, 320); G.GM.push({ x:P.x, y:P.y, vx:Math.cos(b) * s, vy:Math.sin(b) * s, v:lost * .35 / Math.min(8, Math.ceil(lost)), life:10, dropped:.8 }); }
  G.combo = 0; AU.hurt(); shakeIt(16); G.flash = .7; G.flashCol = '#ff3b5c'; G.slow = .35;
  pop(P.x, P.y - 40, lost > .5 ? 'BLADE CHIPPED!' : 'OUCH!', '#ff3b5c', 18);
  for(let i = 0; i < 20; i++) part(P.x, P.y, rnd(-300, 300), rnd(-300, 300), rnd(.3, .6), '#ff3b5c', rnd(3, 5));
  if(P.hp <= 0) die();
}
function die(){
  G.state = 'dying'; G.dieT = 1.4; AU.death(); shakeIt(22); G.flash = 1; G.flashCol = '#ff3b5c';
  for(let i = 0; i < 60; i++) part(P.x, P.y, rnd(-500, 500), rnd(-500, 500), rnd(.4, 1), pick(['#ffffff', '#ff3b5c', '#cfe3ff']), rnd(3, 7));
  AU.setMusic(0);
}
function setLen(){
  G.L = bladeLenFor(G.growth);
  G.maxL = Math.max(G.maxL, G.L);
  ev('len', +(G.L * M_PER_UNIT).toFixed(1));
  const t = tierOf(G.L);
  if(t > G.tier){
    G.tier = t;
    announce(TIERS[t].n, '#ffd23c', 'BLADE ' + (G.L * M_PER_UNIT).toFixed(1) + ' m');
    AU.tierUp(); shakeIt(8); G.flash = .5; G.flashCol = '#ffd23c'; G.slow = .5;
    for(let i = 0; i < 40; i++){ const a = rnd(0, TAU), s = rnd(200, 600); part(P.x, P.y, Math.cos(a) * s, Math.sin(a) * s, rnd(.4, .8), pick(['#ffd23c', '#ffffff', skin().glow]), rnd(3, 6)); }
    if(P.hp < P.maxHp){ P.hp++; pop(P.x, P.y - 50, '+1 ♥', '#ff5ad9', 20); }
    G.pendingCards = true;
  } else if(t < G.tier) G.tier = t;
}

/* ---------------- enemies ---------------- */
function updEnemies(dt){
  // warm-up: the first 20 seconds are gentler so new players can learn the swing
  const sp0 = (G.mod && G.mod.id === 'rush' ? 1.3 : 1) * Math.min(1, .42 + G.t / 45) * (1 + Math.max(0, G.t - 120) / 360), ss = Math.pow(sizeScale(), .75);
  for(const e of G.E){
    if(e.dead) continue;
    e.t += dt; if(e.imm > 0) e.imm -= dt; if(e.harm > 0) e.harm -= dt; if(e.flash > 0) e.flash -= dt; if(e.cutT > 0) e.cutT -= dt;
    const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
    const sizeK = Math.pow(e.origArea / Math.max(e.area, 1), .12);        // smaller pieces are a bit faster
    let spd = e.d.spd * sp0 * ss * sizeK * (e.boss ? 1 : 1);
    if(e.d.dash){
      e.stT -= dt;
      if(e.st === 'walk' && e.stT <= 0 && d < viewR() * .8){ e.st = 'aim'; e.stT = .5; }
      else if(e.st === 'aim'){ spd *= .1; if(e.stT <= 0){ e.st = 'dash'; e.stT = .45; e.vx = nx * spd * 5; e.vy = ny * spd * 5; } }
      else if(e.st === 'dash'){ if(e.stT <= 0){ e.st = 'walk'; e.stT = gr(1.5, 2.6); } }
    }
    if(e.d.shoot){
      const want = 330 * ss;
      const k = d > want ? 1 : -.6;
      e.vx = lerp(e.vx, nx * spd * k, Math.min(1, dt * 2)); e.vy = lerp(e.vy, ny * spd * k, Math.min(1, dt * 2));
      e.cd -= dt;
      if(e.cd <= 0 && d < viewR()){ e.cd = gr(2, 2.8); const os = 230 * sp0 * ss; G.O.push({ x:e.x + nx * e.R * .6, y:e.y + ny * e.R * .6, vx:nx * os, vy:ny * os, r:8 * Math.sqrt(sizeScale()), friendly:false, life:6 }); AU.spit(); }
    } else if(e.st !== 'dash' && !(e.harm > 0)){
      e.vx = lerp(e.vx, nx * spd, Math.min(1, dt * 1.6)); e.vy = lerp(e.vy, ny * spd, Math.min(1, dt * 1.6));
    }
    e.x += e.vx * dt; e.y += e.vy * dt;
    e.ang += e.av * dt; e.av *= Math.exp(-1.5 * dt);
    if(e.burn > 0){ e.burn -= dt; if(Math.random() < dt * 20) part(e.x + rnd(-e.R, e.R) * .5, e.y + rnd(-e.R, e.R) * .5, rnd(-30, 30), rnd(-120, -40), .4, pick(['#ff6a1a', '#ffb03a']), 4); if(e.burn <= 0){ const eq = Math.sqrt(e.area / Math.PI); if(eq < killR() * 1.8 && !e.boss) shatter(e, false); } }
  }
  // separation (cheap O(n^2) for the small counts we keep)
  const E = G.E, n = E.length;
  for(let i = 0; i < n; i++){
    const a = E[i]; if(a.dead) continue;
    for(let j = i + 1; j < n; j++){
      const b = E[j]; if(b.dead) continue;
      const dx = b.x - a.x, dy = b.y - a.y, rr = (a.R + b.R) * .55, d2 = dx * dx + dy * dy;
      if(d2 < rr * rr && d2 > .01){ const d = Math.sqrt(d2), o = (rr - d) / d * .25, wa = b.area / (a.area + b.area); a.x -= dx * o * wa; a.y -= dy * o * wa; b.x += dx * o * (1 - wa); b.y += dy * o * (1 - wa); }
    }
  }
  // despawn far stragglers (not bosses)
  const far = viewR() * 2.6;
  for(const e of E) if(!e.dead && !e.boss && Math.hypot(e.x - P.x, e.y - P.y) > far) e.dead = true;
  if(E.some(e => e.dead)) G.E = E.filter(e => !e.dead);
}
function updOrbs(dt){
  for(let i = G.O.length - 1; i >= 0; i--){
    const o = G.O[i];
    o.life -= dt;
    if(o.friendly && G.up.parry && !o.shard){
      let best = null, bd = 1e9;
      for(const e of G.E){ if(e.dead) continue; const d = Math.hypot(e.x - o.x, e.y - o.y); if(d < bd){ bd = d; best = e; } }
      if(best){ const sp = Math.hypot(o.vx, o.vy), tx = (best.x - o.x) / bd, ty = (best.y - o.y) / bd; o.vx = lerp(o.vx, tx * sp, Math.min(1, dt * 3 * G.up.parry)); o.vy = lerp(o.vy, ty * sp, Math.min(1, dt * 3 * G.up.parry)); }
    }
    o.x += o.vx * dt; o.y += o.vy * dt;
    if(o.life <= 0 || o.dead){ G.O.splice(i, 1); continue; }
    if(o.friendly){
      for(const e of G.E){
        if(e.dead || e.imm > 0) continue;
        if(Math.hypot(e.x - o.x, e.y - o.y) < e.R * .7 + o.r){
          const a = Math.atan2(o.vy, o.vx) + Math.PI / 2;
          cutEnemy(e, e.x, e.y, Math.cos(a), Math.sin(a), 400, 'orb'); o.dead = true; break;
        }
      }
    } else if(Math.hypot(P.x - o.x, P.y - o.y) < P.r + o.r){ o.dead = true; hurt(o.x, o.y); }
  }
}
function updGems(dt){
  const mag = (90 + 45 * (G.up.magnet || 0) + 25 * (save.meta.magnet || 0)) * Math.pow(G.L / 70, .6);
  for(let i = G.GM.length - 1; i >= 0; i--){
    const g = G.GM[i];
    g.life -= dt; if(g.dropped > 0) g.dropped -= dt;
    const dx = P.x - g.x, dy = P.y - g.y, d = Math.hypot(dx, dy) || 1;
    if(d < mag && !(g.dropped > 0)){ const s = 450 * Math.pow(G.L / 70, .5) + (mag - d) * 6; g.vx = lerp(g.vx, dx / d * s, Math.min(1, dt * 7)); g.vy = lerp(g.vy, dy / d * s, Math.min(1, dt * 7)); }
    else { const f = Math.exp(-2.5 * dt); g.vx *= f; g.vy *= f; }
    g.x += g.vx * dt; g.y += g.vy * dt;
    if(d < P.r + 12 * Math.sqrt(sizeScale()) && !(g.dropped > 0)){
      G.GM.splice(i, 1);
      G.growth += g.v * growthMul(); G.gold += g.v * .35 * goldMul(); setLen(); AU.gem();
      continue;
    }
    if(g.life <= 0) G.GM.splice(i, 1);
  }
}

/* ---------------- fx ---------------- */
function partCap(){ return G.q === 'low' ? 250 : 700; }
function part(x, y, vx, vy, life, c, s){ if(G.PT.length < partCap()) G.PT.push({ x, y, vx, vy, life, max:life, c, s }); }
function pop(x, y, txt, c, size){ if(G.POP.length > 16) G.POP.shift(); G.POP.push({ x, y, txt, c, size:size || 14, life:1 }); }
function shakeIt(v){ if(save.opt.shake) G.shake = Math.min(24, G.shake + v); }
function tickFx(dt){
  for(let i = G.PT.length - 1; i >= 0; i--){ const p = G.PT[i]; p.life -= dt; if(p.life <= 0){ G.PT.splice(i, 1); continue; } const f = Math.exp(-3 * dt); p.vx *= f; p.vy *= f; p.x += p.vx * dt; p.y += p.vy * dt; }
  for(let i = G.POP.length - 1; i >= 0; i--){ const p = G.POP[i]; p.life -= dt; p.y -= 40 * dt / G.camZ; if(p.life <= 0) G.POP.splice(i, 1); }
  for(let i = G.DB.length - 1; i >= 0; i--){ const b = G.DB[i]; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.ang += b.av * dt; if(b.life <= 0) G.DB.splice(i, 1); }
  for(let i = G.FX.length - 1; i >= 0; i--){ const f = G.FX[i]; f.life -= dt; if(f.ring) f.r = f.max * (1 - f.life / .35); if(f.life <= 0) G.FX.splice(i, 1); }
}
function skin(){ return SKINS.find(s => s.id === save.skin) || SKINS[0]; }

/* ---------------- missions ---------------- */
function ev(type, v){
  const r = G.runEv, mt = MT.find(m => m.ev === type);
  if(!mt) return;
  r[type] = mt.kind === 'sum' ? (r[type] || 0) + v : Math.max(r[type] || 0, v);
  for(const m of save.missions){
    if(m.done || m.ev !== type) continue;
    const prog = mt.kind === 'sum' ? m.p + r[type] : Math.max(m.p, r[type]);
    if(prog >= m.n){
      m.done = true; m.p = m.n; m.fresh = true;
      save.gold += m.reward; save.missionsDone++;
      save.mTier[m.id] = (save.mTier[m.id] || 0) + 1;
      toast('MISSION COMPLETE', m.txt + '  <b class="gold">+' + m.reward + ' ◆</b>', '#3ddc84', 3400);
      AU.tierUp(); persist();
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
