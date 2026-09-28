'use strict';
/* =====================================================================
   BO KATA — simulation
   A fighter kite (patang) has no motor: PULL the thread and it darts
   where its nose points; let the thread go SLACK and it drifts on the
   wind and spins. When two threads cross, a PENCH begins: the thread
   that moves faster saws through the other. Sharper thread, stronger
   thread and flying above your rival all help. Cut kites drift away
   on the wind; snag one with your kite or thread to loot it.
   ===================================================================== */
const ACC = 1050, VMAX = 440, TURN = 3.8, SPIN = 2.7, CUT_K = .05;
const IN = { down:false, wx:0, wy:0, sx:0, sy:0 };
let M = null;                                  // the current match

/* ---------------- skyline (shared by physics and art) ---------------- */
let SKY = null;                                // { roofs:[{x0,x1,y}], h:Float32Array per 8 units }
function buildSkyline(seed, anchors){
  const rng = mulberry32(seed), roofs = [];
  let x = -200;
  while(x < WW + 200){
    const w = 110 + rng() * 170, y = GROUND - (170 + rng() * 260);
    roofs.push({ x0:x, x1:x + w, y, style:(rng() * 6) | 0, col:(rng() * 6) | 0, seed:(rng() * 1e9) | 0, tank:rng() < .45, cloth:rng() < .35, dish:rng() < .3, dome:rng() < .12 });
    x += w + (rng() < .2 ? 20 + rng() * 40 : 0);
  }
  // every flyer stands on a roof of their own, a little taller than the neighbours
  for(const a of anchors){
    const r = roofs.find(q => a >= q.x0 && a < q.x1);
    if(r){ r.y = Math.min(r.y, GROUND - 390 - rng() * 60); r.flyer = true; r.dome = false; r.tank = rng() < .5; }
  }
  const h = new Float32Array(Math.ceil((WW + 400) / 8));
  for(let i = 0; i < h.length; i++){ const px = i * 8 - 200; const r = roofs.find(q => px >= q.x0 && px < q.x1); h[i] = r ? r.y : GROUND; }
  SKY = { roofs, h };
}
const roofAt = x => { if(!SKY) return GROUND; const i = clamp(((x + 200) / 8) | 0, 0, SKY.h.length - 1); return SKY.h[i]; };

/* ---------------- flyers & kites ---------------- */
function mkFlyer(o){
  return Object.assign({ id:0, name:'', me:false, bot:null, ax:0, ay:0, kitesLeft:3, cuts:0, loots:0, kite:null, respawnT:0,
    def:KITES[0], thread:'#e0303a', str:1, sharp:1, look:{ skin:2, shirt:0 }, out:false, outT:0, spinDir:1, place:0, arm:0, shout:0, penchUp:0 }, o);
}
function launchKite(F){
  const k = { x:F.ax + F.spinDir * 10, y:F.ay - 40, vx:F.spinDir * 30, vy:-260, a:-Math.PI / 2, pull:true, L:60, launch:1.1, tx:F.ax, ty:F.ay - 800, sway:rnd(0, TAU), hit:0, trail:[] };
  F.kite = k; F.kitesLeft--; F.respawnT = 0;
  if(F.me) AU.launch();
}
function flyerSpeed(F){ return F.def.spd; }

/* thread geometry: a quadratic curve from the hand to the kite that sags with slack */
function stringCtrl(F){
  const k = F.kite, dx = k.x - F.ax, dy = k.y - F.ay, d = Math.hypot(dx, dy);
  const slack = Math.sqrt(Math.max(0, k.L * k.L - d * d));
  const sag = Math.min(260, slack * .55 + d * .06);
  return [F.ax + dx * .5, F.ay + dy * .5 + sag];
}
function stringPts(F, n, out){
  const k = F.kite, c = stringCtrl(F); out = out || [];
  out.length = 0;
  for(let i = 0; i <= n; i++){
    const t = i / n, u = 1 - t;
    out.push(u * u * F.ax + 2 * u * t * c[0] + t * t * k.x, u * u * F.ay + 2 * u * t * c[1] + t * t * k.y);
  }
  return out;
}
function segX(ax, ay, bx, by, cx, cy, dx, dy){
  const r1 = bx - ax, r2 = by - ay, s1 = dx - cx, s2 = dy - cy, den = r1 * s2 - r2 * s1;
  if(Math.abs(den) < 1e-6) return null;
  const t = ((cx - ax) * s2 - (cy - ay) * s1) / den, u = ((cx - ax) * r2 - (cy - ay) * r1) / den;
  if(t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [ax + r1 * t, ay + r2 * t, t];
}

/* ---------------- kite physics ---------------- */
function stepKite(F, dt, pull, tx, ty, steer){
  const k = F.kite, def = F.def, W = M.wind;
  if(k.launch > 0){ k.launch -= dt; pull = true; tx = F.ax + F.spinDir * 120; ty = F.ay - 900; steer = true; }
  k.pull = pull;
  if(pull){
    if(steer){ const ta = Math.atan2(ty - k.y, tx - k.x), d = angDiff(ta, k.a), tr = TURN * def.agi * dt; k.a += clamp(d, -tr, tr); }
    const ca = Math.cos(k.a), sa = Math.sin(k.a), acc = ACC * def.spd;
    k.vx += ca * acc * dt; k.vy += sa * acc * dt;
    const sp = Math.hypot(k.vx, k.vy), vm = VMAX * def.spd;
    if(sp > vm){ k.vx *= vm / sp; k.vy *= vm / sp; }
    // the nose steadies when the thread is taut
    k.vx += (ca * sp - k.vx) * Math.min(1, 3 * dt); k.vy += (sa * sp - k.vy) * Math.min(1, 3 * dt);
  } else {
    // slack: the kite spins and rides the wind
    k.a += SPIN / def.stab * F.spinDir * dt;
    k.vx += (W.x - k.vx) * Math.min(1, 1.6 * dt);
    k.vy += (22 + Math.sin(k.sway) * 20 - k.vy) * Math.min(1, 1.6 * dt);
  }
  k.sway += dt * 3;
  k.x += k.vx * dt; k.y += k.vy * dt;
  // sky limits and rooftops
  if(k.y < CEIL){ k.y = CEIL; k.vy = Math.abs(k.vy) * .3; }
  const fl = roofAt(k.x) - 26;
  if(k.y > fl){ k.y = fl; k.vy = -Math.abs(k.vy) * .35; k.vx *= .7; if(!k.hit && F.me) AU.bump(); k.hit = .4; }
  if(k.hit > 0) k.hit -= dt;
  if(k.x < 30){ k.x = 30; k.vx = Math.abs(k.vx) * .4; }
  if(k.x > WW - 30){ k.x = WW - 30; k.vx = -Math.abs(k.vx) * .4; }
  // thread: pulling keeps it taut, slack pays it out
  const dx = k.x - F.ax, dy = k.y - F.ay, d = Math.hypot(dx, dy) || 1;
  if(pull) k.L = Math.max(d, Math.min(k.L, d + 6)); else k.L = Math.min(LINE_MAX, k.L + 95 * dt);
  if(d > k.L || d > LINE_MAX){
    const lim = Math.min(k.L, LINE_MAX), nx = dx / d, ny = dy / d;
    k.x = F.ax + nx * lim; k.y = F.ay + ny * lim;
    const rv = k.vx * nx + k.vy * ny; if(rv > 0){ k.vx -= nx * rv; k.vy -= ny * rv; }
    k.L = lim;
  }
  // a short fading trail for speed
  k.trail.push(k.x, k.y); if(k.trail.length > 14) k.trail.splice(0, 2);
}
const sawSpeed = k => Math.hypot(k.vx, k.vy) * (k.pull ? 1 : .2);

/* ---------------- match ---------------- */
function newMatch(mode){
  const ar = arenaFor(save.trophies), duel = mode === 'duel', menu = mode === 'menu';
  WW = mode === 'battle' ? 5000 : 3600;
  const n = menu ? 5 : duel ? 2 : 12;
  const anchorsX = [];
  if(menu){ for(let i = 0; i < 5; i++) anchorsX.push(WW / 2 + (i - 2) * 300 + rnd(-30, 30)); }
  else if(duel){ anchorsX.push(WW / 2 - 430, WW / 2 + 430); }
  else { for(let i = 0; i < n; i++) anchorsX.push(WW * (i + .5) / n + rnd(-60, 60)); }
  buildSkyline((Math.random() * 1e9) | 0, anchorsX);
  const me = menu ? 2 : duel ? 0 : 5 + ((Math.random() * 2) | 0);
  const flyers = [];
  const used = new Set([save.name || 'You']);
  const skill = menu ? .5 : clamp(.25 + save.trophies / 2600 + (duel ? .05 : 0), .25, .95);
  for(let i = 0; i < n; i++){
    const ax = anchorsX[i], ay = roofAt(ax) - 38, isMe = i === me;
    let name; do{ name = pick(NAMES); } while(used.has(name)); used.add(name);
    const pool = KITES.filter(k => k.r <= (skill > .7 ? 3 : skill > .45 ? 2 : 1));
    const F = mkFlyer({ id:i, me:isMe, ax, ay, name:isMe ? (save.name || 'You') : name, spinDir:Math.random() < .5 ? 1 : -1,
      def:isMe ? kiteById(save.kite) : pick(pool),
      thread:isMe ? threadColor(save.thread) : pick(THREADS.slice(0, 7)).c,
      str:isMe ? 1 + .09 * save.manja.str : 1 + .09 * Math.round(skill * 8 * rnd(.6, 1.1)),
      sharp:isMe ? 1 + .09 * save.manja.sharp : 1 + .09 * Math.round(skill * 8 * rnd(.6, 1.1)),
      look:isMe ? save.look : { skin:(Math.random() * SKIN.length) | 0, shirt:(Math.random() * SHIRT.length) | 0 },
      kitesLeft:menu ? 9999 : 3 });
    if(!isMe || menu) F.bot = mkBrain(F, clamp(skill + rnd(-.15, .15), .1, 1));
    flyers.push(F);
  }
  M = { mode, arena:ar, t:0, dur:duel ? 150 : 180, flyers, me:flyers[me], loose:[], falls:[], pench:new Map(), fx:[], pops:[], feed:[],
    wind:{ x:30, base:rnd(-1, 1) < 0 ? -1 : 1, ph:rnd(0, 100) }, over:false, slow:0, shake:0, elim:0, countdown:menu ? 0 : 3.2, pops0:0 };
  for(const F of flyers){ F.respawnT = .2 + rnd(0, .5); }
  return M;
}
function threadColor(id){ const t = THREADS.find(q => q.id === id); return t ? t.c : '#e0303a'; }

const tmpA = [], tmpB = [];
function stepMatch(rdt){
  if(!M || M.over) return;
  if(M.slow > 0) M.slow -= rdt;
  const dt = rdt * (M.slow > 0 ? .3 : 1);
  if(M.countdown > 0){ M.countdown -= rdt; if(M.countdown <= 0) AU.go(); }
  const live = M.countdown <= 0;
  if(live) M.t += dt;
  // wind: slow swings with gusts; the monsoon is restless
  const W = M.wind, gust = M.arena.mood === 'rain' ? 1.6 : 1;
  W.x = (38 * Math.sin(M.t * .045 + W.ph) * W.base + 22 * Math.sin(M.t * .17 + W.ph * 2) * gust + 12 * Math.sin(M.t * .9) * gust);
  for(const F of M.flyers){
    F.shout = Math.max(0, F.shout - rdt);
    if(!F.kite){
      if(!live || F.out) continue;
      if(F.kitesLeft > 0){ F.respawnT -= dt; if(F.respawnT <= 0) launchKite(F); }
      else if(!F.out){ F.out = true; F.outT = M.t; M.elim++; }
      continue;
    }
    let pull, tx, ty, steer;
    if(F.me && !F.bot){ pull = IN.down; tx = IN.wx; ty = IN.wy; steer = save.opt.ctrl === 'point'; }
    else { const o = botThink(F, dt); pull = o.pull; tx = o.tx; ty = o.ty; steer = true; }
    stepKite(F, dt, pull, tx, ty, steer);
    F.arm = lerp(F.arm, F.kite.pull ? 1 : 0, Math.min(1, dt * 10));
  }
  if(live) penches(dt);
  stepLoose(dt);
  // falling threads and effects
  for(const f of M.falls){ f.t += dt; for(let i = 1; i < f.p.length; i += 2) f.p[i] += (40 + f.t * 160) * dt * (i / f.p.length); }
  M.falls = M.falls.filter(f => f.t < 2.2);
  for(const p of M.fx){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.vx *= .985; p.a += p.va * dt; p.l -= dt; }
  M.fx = M.fx.filter(p => p.l > 0);
  for(const p of M.pops) p.t += rdt; M.pops = M.pops.filter(p => p.t < p.d);
  for(const f of M.feed) f.t += rdt; M.feed = M.feed.filter(f => f.t < 4);
  M.shake *= Math.pow(.02, rdt);
  // end conditions
  if(live && M.mode !== 'menu'){
    const alive = M.flyers.filter(F => !F.out);
    if(M.me.out || alive.length <= 1 || M.t >= M.dur) endMatch();
  }
}

/* ---------------- pench: crossing threads ---------------- */
function penches(dt){
  const fl = M.flyers.filter(F => F.kite && F.kite.launch <= 0);
  const seen = new Set();
  for(let i = 0; i < fl.length; i++){
    const A = fl[i];
    for(let j = i + 1; j < fl.length; j++){
      const B = fl[j]; if(!A.kite) break; if(!B.kite) continue;
      stringPts(A, 10, tmpA); stringPts(B, 10, tmpB);
      // cheap reject: bounding boxes
      let hit = null;
      for(let a = 0; a < 20 && !hit; a += 2){
        for(let b = 0; b < 20; b += 2){
          const h = segX(tmpA[a], tmpA[a + 1], tmpA[a + 2], tmpA[a + 3], tmpB[b], tmpB[b + 1], tmpB[b + 2], tmpB[b + 3]);
          if(h){ hit = h; break; }
        }
      }
      if(!hit) continue;
      const key = A.id < B.id ? A.id + ':' + B.id : B.id + ':' + A.id;
      seen.add(key);
      let p = M.pench.get(key);
      if(!p){ p = { a:A, b:B, wa:0, wb:0, t:0, gone:0, x:hit[0], y:hit[1] }; M.pench.set(key, p); if(A.me || B.me){ AU.penchStart(); vib(15); } }
      p.gone = 0; p.t += dt; p.x = hit[0]; p.y = hit[1];
      const ka = A.kite, kb = B.kite;
      const upA = ka.y < kb.y - 25 ? 1.3 : 1, upB = kb.y < ka.y - 25 ? 1.3 : 1;
      // the faster, sharper, higher thread wins: damage is how much harder you saw than they do
      const sa = sawSpeed(ka) * A.sharp * upA, sb = sawSpeed(kb) * B.sharp * upB;
      p.wb += Math.max(0, sa - sb * .55) / B.str * CUT_K * dt + 1.5 * dt;
      p.wa += Math.max(0, sb - sa * .55) / A.str * CUT_K * dt + 1.5 * dt;
      // sparks where the threads rub
      if(Math.random() < .6) M.fx.push({ x:p.x, y:p.y, vx:rnd(-120, 120), vy:rnd(-140, 40), g:300, l:rnd(.2, .45), a:0, va:0, k:'spark', c:Math.random() < .5 ? '#fff6c0' : '#ffb03a', s:rnd(1.5, 3) });
      if(A.me || B.me) AU.saw(Math.max(sawSpeed(ka), sawSpeed(kb)));
      if(p.wa >= 100 || p.wb >= 100){
        const loser = p.wa - p.wb > 0 ? A : B, winner = loser === A ? B : A;
        cut(winner, loser, p.x, p.y, (winner === A ? upA : upB) > 1);
        M.pench.delete(key);
      }
    }
  }
  for(const [k, p] of M.pench){ if(!seen.has(k)){ p.gone += dt; if(p.gone > .3 || !p.a.kite || !p.b.kite) M.pench.delete(k); } }
}
function myPench(){
  let best = null;
  for(const p of M.pench.values()) if((p.a.me || p.b.me) && p.gone <= 0) best = p;
  return best;
}

function cut(W, L, x, y, fromAbove){
  const k = L.kite;
  W.cuts++; W.shout = 1.6;
  if(fromAbove && W.me && M.mode !== 'menu'){ save.stats.penchWins++; questEv('pench', 1); }
  // the loose kite keeps a tail of thread down to the cut
  M.loose.push({ x:k.x, y:k.y, vx:k.vx * .4 + M.wind.x, vy:k.vy * .3 - 40, a:k.a, w:rnd(-2, 2), def:L.def, owner:L, t:0, tail:[x - k.x, y - k.y], thread:L.thread, landed:0 });
  // the rest of the thread falls from the cut back to the roof
  const pts = stringPts(L, 12, []); const fall = [];
  for(let i = 0; i < pts.length; i += 2){ const t = i / (pts.length - 2); if(Math.hypot(pts[i] - L.ax, pts[i + 1] - L.ay) <= Math.hypot(x - L.ax, y - L.ay) + 5) fall.push(pts[i], pts[i + 1]); }
  fall.push(x, y);
  M.falls.push({ p:fall, c:L.thread, t:0 });
  L.kite = null; L.respawnT = 2.6;
  for(let i = 0; i < 26; i++) M.fx.push({ x, y, vx:rnd(-220, 220), vy:rnd(-260, 60), g:420, l:rnd(.5, 1.1), a:rnd(0, TAU), va:rnd(-12, 12), k:'paper', c:pick([L.def.c[0], L.def.c[1] || '#fff', '#ffffff']), s:rnd(3, 7) });
  M.feed.push({ t:0, txt:`<b style="color:${W.me ? '#ffd23a' : '#fff'}">${W.name}</b> cut <b style="color:${L.me ? '#ff6b6b' : '#fff'}">${L.name}</b>` });
  if(M.mode === 'menu'){}
  else if(W.me){
    M.pops.push({ k:'bokata', t:0, d:1.6 }); M.slow = .45; M.shake = 10;
    save.stats.cuts++; questEv('cut', 1);
    AU.boKata(); vib([30, 40, 60]);
  } else if(L.me){
    M.pops.push({ k:'lost', t:0, d:1.6, by:W.name }); M.shake = 6;
    AU.lost(); vib(120);
  } else if(M.me.kite && Math.hypot(x - M.me.kite.x, y - M.me.kite.y) < 900) AU.farCut();
}

/* ---------------- loose kites: drifting loot ---------------- */
function stepLoose(dt){
  for(const q of M.loose){
    q.t += dt;
    if(q.landed){ q.landed += dt; continue; }
    q.vx += (M.wind.x * 1.2 - q.vx) * Math.min(1, dt * .8);
    q.vy += (48 + Math.sin(q.t * 2.3) * 40 - q.vy) * Math.min(1, dt * 1.2);
    q.w += (Math.sin(q.t * 1.7) * 3 - q.w) * dt;
    q.a += q.w * dt;
    q.x += q.vx * dt; q.y += q.vy * dt;
    q.tail[0] = lerp(q.tail[0], -q.vx * .15, dt * .6); q.tail[1] = lerp(q.tail[1], 90, dt * .4);
    if(q.y > roofAt(q.x) - 18 || q.x < -100 || q.x > WW + 100){ q.landed = .01; continue; }
    // any kite or thread that touches it takes it
    if(q.t < .6) continue;
    for(const F of M.flyers){
      if(!F.kite || F === q.owner) continue;
      const k = F.kite;
      let got = Math.hypot(k.x - q.x, k.y - q.y) < 60;
      if(!got){ const pts = stringPts(F, 8, tmpA); for(let i = 0; i < pts.length - 2 && !got; i += 2){ if(distSeg(q.x, q.y, pts[i], pts[i + 1], pts[i + 2], pts[i + 3]) < 16) got = true; } }
      if(got){ loot(F, q); break; }
    }
  }
  M.loose = M.loose.filter(q => !q.gone && q.landed < 1.2);
}
function distSeg(px, py, ax, ay, bx, by){
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1, t = clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1);
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}
function loot(F, q){
  q.gone = true; F.loots++;
  for(let i = 0; i < 14; i++) M.fx.push({ x:q.x, y:q.y, vx:rnd(-120, 120), vy:rnd(-160, 0), g:200, l:rnd(.4, .9), a:0, va:0, k:'spark', c:'#ffe27a', s:rnd(2, 4) });
  if(F.me && M.mode !== 'menu'){
    M.pops.push({ k:'loot', t:0, d:1.4, def:q.def });
    save.stats.loots++; questEv('loot', 1);
    M.lootKites = M.lootKites || []; M.lootKites.push(q.def.id);
    AU.loot(); vib(25);
  }
  M.feed.push({ t:0, txt:`<b>${F.name}</b> looted a <b style="color:${RARITY[q.def.r].c}">${q.def.n}</b>` });
}

/* ---------------- results ---------------- */
function endMatch(){
  if(M.over) return;
  M.over = true;
  // rank: still flying first, then kites left, then cuts, then who lasted longest
  const score = F => (F.out ? 0 : 1000) + (F.kitesLeft + (F.kite ? 1 : 0)) * 100 + F.cuts * 10 + (F.out ? F.outT / 1000 : 0);
  const order = M.flyers.slice().sort((a, b) => score(b) - score(a));
  order.forEach((F, i) => F.place = i + 1);
  M.order = order;
  setTimeout(() => showResults(), 900);
}
