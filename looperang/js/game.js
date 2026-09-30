'use strict';
/* =====================================================================
   Game state, input and flow.
   intro -> aim -> fly -> (clear | reset -> aim)
   ===================================================================== */
const G = {
  st: 'intro', L: null, n: 1, daily: false,
  b: null, holding: false, acc: 0, gt: 0, rt: 0, ts: 1, slowT: 0,
  aim: null, kAim: null, fails: 0, hint: false, trail: [],
  parts: [], texts: [], shake: 0, flash: 0, flashC: '#fff',
  introT: 0, iris: 1, irisDir: 0, irisCb: null,
  roo: { pose: 'idle', t: 0 }, spawnT: 0, resetT: 0,
  combo: 0, lastGemT: -9, tricks: 0, bumpAnim: new Map(), warpFx: [],
  paused: false, tutT: 0, clearInfo: null
};

/* ---------------- level flow ---------------- */
function startLevel(n, opts = {}){
  G.daily = !!opts.daily;
  G.n = n;
  G.L = G.daily ? dailyLevel() : getLevel(n);
  G.fails = 0; G.hint = false; G.spawnT = 0;
  G.bumpAnim.clear();
  if(!G.daily){ S.cur = n; persist(); }
  AU.setWorld(G.L.w);
  toAim();
  UI.hud();
  const w = G.L.w;
  if(!G.daily && n <= MAIN_LEVELS && (n - 1) % LEVELS_PER_WORLD === 0 && S.seenWorld < w + 1){
    S.seenWorld = w + 1; persist();
    if(w > 0) UI.banner('WORLD ' + (w + 1), WORLDS[w].name, WORLDS[w].tip);
  }else if(G.daily){
    UI.banner('DAILY', 'Challenge', 'One level a day. Keep your streak!');
  }else if(G.L.spec.grand){
    UI.banner('LEVEL ' + n, 'Grand finale', 'Clear it to open a treasure chest!');
  }else if(G.L.spec.treasure){
    UI.banner('LEVEL ' + n, 'Treasure level', 'Golden gems: triple coins!');
  }
}
function toAim(){
  G.st = 'aim'; G.b = null; G.trail = []; G.aim = null; G.holding = false;
  G.roo.pose = 'idle'; G.tutT = 0;
  AU.whirrStop();
  UI.hud();
}
function throwRang(ang, pow){
  G.b = makeRang(G.L, ang, pow);
  G.st = 'fly'; G.acc = 0; G.trail = []; G.combo = 0; G.lastGemT = -9; G.tricks = 0;
  G.roo.pose = 'throw'; G.roo.t = 0;
  G.aim = null;
  S.st.throws++;
  AU.throw(pow); AU.whirrStart();
  SDK.gameplayStart();
  UI.tutorialThrown();
}
function onEvent(type, a, b, c, d){
  const L = G.L, bm = G.b;
  switch(type){
    case 'edge': AU.edge(); burst(a, b, 6, '#ffffff', 160, 3); G.shake = Math.max(G.shake, 3); break;
    case 'wall': AU.wall(); burst(a, b, 10, '#fff2d0', 220, 4); G.shake = Math.max(G.shake, 5); trick('RICOCHET!', a, b, '#ffd24a'); break;
    case 'bump': AU.bump(); G.bumpAnim.set(c, G.gt); burst(a, b, 14, '#ff9fe0', 320, 5); G.shake = Math.max(G.shake, 6); trick('BOING!', a, b, '#ff7ad8'); break;
    case 'warp': AU.warp(); burst(a, b, 16, '#b690ff', 260, 4); burst(c, d, 16, '#6ee7ff', 260, 4); trick('WARP!', c, d, '#8cf2ff'); break;
    case 'near': AU.near(); trick('CLOSE CALL!', bm.x, bm.y - 30, '#ff8a5c'); G.slowT = Math.max(G.slowT, 0.12); break;
    case 'gem': {
      const g = L.gems[a];
      G.combo = G.gt - G.lastGemT < 0.45 ? G.combo + 1 : 0; G.lastGemT = G.gt;
      const lastOne = bm.got === L.gems.length;
      AU.gem(bm.got - 1 + G.combo);
      burst(b, c, 22, L.spec.treasure ? '#ffd24a' : WORLDS[L.w].gem, 380, 6);
      ring(b, c, L.spec.treasure ? '#ffd24a' : '#ffffff');
      if(G.combo) trick('DOUBLE!', b, c - 40, '#7dffea');
      S.st.gems++;
      if(lastOne){
        AU.last(); G.slowT = 0.55; G.flash = 0.5; G.flashC = '#ffffff';
        floatText('ALL GEMS!', b, c - 50, '#ffffff', 1.4);
        G.shake = 10;
      }
      UI.pips();
      break;
    }
    case 'star': AU.star(); burst(a, b, 26, '#ffe14d', 420, 7); ring(a, b, '#ffe14d'); floatText('★ BONUS STAR', a, b - 44, '#ffe14d', 1.1); break;
    case 'die': AU.die(); AU.whirrStop(); shatter(a, b); G.shake = 14; break;
    case 'lost': AU.miss(); AU.whirrStop(); break;
    case 'ghost': break;
    case 'catch': AU.catch(); AU.whirrStop(); G.roo.pose = 'catch'; G.roo.t = 0; break;
  }
}
function trick(txt, x, y, col){
  G.tricks++; S.st.tricks++;
  floatText(txt, x, y - 36, col, 0.9);
}
function flightEnded(){
  const b = G.b, L = G.L;
  if(b.caught && b.got === L.gems.length){ levelClear(); return; }
  G.fails++;
  let msg;
  if(b.dead && !b.caught){ msg = b.t > P.tMax ? 'LOST IT!' : 'OUCH!'; }
  else{ const left = L.gems.length - b.got; msg = left === 1 ? '1 GEM LEFT!' : left + ' GEMS LEFT'; AU.miss(); }
  const h = handOf(L);
  floatText(msg, h.x + 120, h.y - 70, '#ffffff', 1);
  G.st = 'reset'; G.resetT = b.caught ? 0.45 : 0.7;
  UI.failCount();
}
function levelClear(){
  const b = G.b, L = G.L, n = G.n;
  G.st = 'clear';
  const stars = 1 + (b.star ? 1 : 0) + (b.t <= L.par ? 1 : 0);
  let coins = 20 + stars * 10 + G.tricks * 3;
  if(L.spec.treasure) coins *= 3;
  if(G.daily) coins += 100;
  const first = !G.daily && !S.stars[n];
  const prev = G.daily ? 0 : (S.stars[n] || 0);
  if(!G.daily){
    S.stars[n] = Math.max(prev, stars);
    if(stars === 3 && prev < 3) S.st.stars3++;
    if(n >= S.lvl) S.lvl = n + 1;
    S.cur = n + 1;
  }else{
    const d = dayNum();
    if(S.daily.day !== d){
      S.daily.streak = S.daily.day === d - 1 ? S.daily.streak + 1 : 1;
      S.daily.day = d; S.daily.done = 1;
      coins += Math.min(10, S.daily.streak) * 20;
    }
  }
  S.coins += coins; S.st.clears++;
  let chest = null;
  if(!G.daily && L.spec.grand && first && !S.chests[n]){
    S.chests[n] = 1;
    chest = grantChest();
  }
  persist();
  G.clearInfo = { stars, coins, star: b.star, fast: b.t <= L.par, time: b.t, par: L.par, tricks: G.tricks, chest, prevStars: prev };
  AU.clear();
  confetti();
  setTimeout(() => { SDK.gameplayStop(); UI.showClear(G.clearInfo); }, 900);
  if(!G.daily) setTimeout(() => getLevel(n + 1), 1300);
}
/* a free cosmetic the player doesn't own yet (cheapest first) */
function grantChest(){
  const pool = [...RANGS.map(r => ({ kind: 'rang', it: r })), ...HATS.map(h => ({ kind: 'hat', it: h }))]
    .filter(o => !S.own[o.it.id]).sort((a, b) => a.it.price - b.it.price);
  if(!pool.length){ S.coins += 500; return { kind: 'coins', amount: 500 }; }
  const pick = pool[0];
  S.own[pick.it.id] = 1;
  if(pick.kind === 'rang') S.rang = pick.it.id; else S.hat = pick.it.id;
  return pick;
}
function nextLevel(){
  const target = G.daily ? Math.min(S.cur || 1, S.lvl) : G.n + 1;
  const go = () => startLevel(target);
  irisOut(() => SDK.commercial(() => { go(); irisIn(); }));
}
function restartLevel(){ if(G.st === 'fly' || G.st === 'reset' || G.st === 'aim'){ G.fails++; toAim(); UI.failCount(); } }

/* ---------------- iris transitions ---------------- */
function irisOut(cb){ G.irisDir = -1; G.irisCb = cb; }
function irisIn(){ G.irisDir = 1; G.iris = 0; }

/* ---------------- effects ---------------- */
function burst(x, y, n, col, sp, sz){
  if(UI.lowFx) n = Math.ceil(n / 2);
  for(let i = 0; i < n; i++){
    const a = Math.random() * TAU, v = sp * (0.3 + Math.random() * 0.7);
    G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.4 + Math.random() * 0.4, c: col, sz: sz * (0.6 + Math.random() * 0.8), k: 0 });
  }
}
function ring(x, y, col){ G.parts.push({ x, y, vx: 0, vy: 0, life: 0, max: 0.45, c: col, sz: 10, k: 1 }); }
function shatter(x, y){
  const sk = RANGS.find(r => r.id === S.rang) || RANGS[0];
  for(let i = 0; i < 14; i++){
    const a = Math.random() * TAU, v = 150 + Math.random() * 350;
    G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.8, c: i % 2 ? sk.c1 : sk.c2, sz: 8, k: 2, rot: Math.random() * TAU });
  }
  burst(x, y, 20, '#ffffff', 300, 4);
}
function confetti(){
  const cols = ['#ff4f8b', '#ffd24a', '#4dffb0', '#5a8cff', '#ff8a3a', '#b98cff'];
  const h = handOf(G.L);
  for(let i = 0; i < (UI.lowFx ? 40 : 90); i++){
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 400 + Math.random() * 700;
    G.parts.push({ x: h.x, y: h.y, vx: Math.cos(a) * v + 200, vy: Math.sin(a) * v, life: 0, max: 1.6 + Math.random(), c: cols[i % cols.length], sz: 7, k: 3, rot: Math.random() * TAU, g: 700 });
  }
}
function floatText(txt, x, y, col, size){ G.texts.push({ txt, x, y, col, size: size || 1, life: 0, max: 1.1 }); }

/* ---------------- update ---------------- */
function update(rdt){
  G.rt += rdt;
  if(G.irisDir){
    G.iris = clamp(G.iris + G.irisDir * rdt * 2.6, 0, 1);
    if(G.irisDir < 0 && G.iris <= 0){ G.irisDir = 0; const cb = G.irisCb; G.irisCb = null; cb && cb(); }
    else if(G.irisDir > 0 && G.iris >= 1) G.irisDir = 0;
  }
  if(G.st === 'intro'){ G.introT += rdt; if(G.introT > 2.4 && !G.irisDir && G.iris > 0.99) endIntro(); return; }
  if(G.paused || SDK.adBusy) return;
  if(G.slowT > 0){ G.slowT -= rdt; G.ts = lerp(G.ts, 0.22, Math.min(1, rdt * 20)); }
  else G.ts = lerp(G.ts, 1, Math.min(1, rdt * 6));
  const dt = rdt * G.ts;
  G.gt += dt; G.spawnT += rdt; G.roo.t += dt; G.tutT += rdt;
  G.shake = Math.max(0, G.shake - rdt * 40);
  G.flash = Math.max(0, G.flash - rdt * 2.5);

  if(G.st === 'fly'){
    G.acc += dt;
    let steps = 0;
    while(G.acc >= DT && G.st === 'fly' && steps < 12){
      G.acc -= DT; steps++;
      stepRang(G.L, G.b, G.holding && G.b.ph === 0, G.gt, onEvent);
      G.trail.push({ x: G.b.x, y: G.b.y, h: G.holding && G.b.ph === 0 });
      if(G.trail.length > 70) G.trail.shift();
      if(G.b.caught || G.b.dead) flightEnded();
    }
    if(G.b) AU.whirrSet(G.b.s, G.holding && G.b.ph === 0);
  }else if(G.st === 'reset'){
    G.resetT -= rdt;
    if(G.trail.length) G.trail.shift();
    if(G.resetT <= 0) toAim();
  }else if(G.st === 'clear'){
    if(G.trail.length) G.trail.shift();
  }
  if(G.st === 'aim' && G.kAim){ keyAimUpdate(rdt); }

  for(let i = G.parts.length - 1; i >= 0; i--){
    const p = G.parts[i];
    p.life += dt;
    if(p.life >= p.max){ G.parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if(p.g) p.vy += p.g * dt;
    const drag = p.k === 3 ? 0.985 : 0.93;
    p.vx *= drag; p.vy *= p.k === 3 ? 1 : drag;
    if(p.rot != null) p.rot += dt * 8;
  }
  for(let i = G.texts.length - 1; i >= 0; i--){
    const t = G.texts[i]; t.life += rdt; t.y -= rdt * 40;
    if(t.life > t.max) G.texts.splice(i, 1);
  }
}

/* ---------------- intro: the thumbnail comes alive ---------------- */
function endIntro(){
  if(G.st !== 'intro') return;
  irisOut(() => {
    G.st = 'aim';
    startLevel(Math.min(S.cur || 1, S.lvl));
    irisIn();
    UI.showHud(true);
    UI.tutorialStart();
  });
}

/* ---------------- input ---------------- */
function aimFromDrag(a){
  const dx = a.x0 - a.x, dy = a.y0 - a.y;
  const len = Math.hypot(dx, dy);
  const w = R.vecToWorld(dx, dy);
  const range = Math.min(R.W, R.H) * 0.32;
  return { ang: Math.atan2(w.y, w.x), pow: clamp((len - 14) / range, 0, 1), len };
}
function pointerDown(e){
  AU.unlock();
  if(SDK.adBusy || G.paused || UI.modalOpen()) return;
  if(G.st === 'intro'){ if(G.introT > 0.6) G.introT = 99; return; }
  if(G.irisDir) return;
  if(G.st === 'aim'){
    G.aim = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, id: e.pointerId };
    G.kAim = null;
    SDK.gameplayStart();
  }else if(G.st === 'fly'){ G.holding = true; }
}
function pointerMove(e){
  if(!G.aim || e.pointerId !== G.aim.id) return;
  const before = aimFromDrag(G.aim).pow;
  G.aim.x = e.clientX; G.aim.y = e.clientY;
  const p = aimFromDrag(G.aim).pow;
  if(Math.floor(p * 8) !== Math.floor(before * 8)) AU.aimTick(p);
}
function pointerUp(e){
  G.holding = false;
  if(SDK.adBusy || !G.aim || e.pointerId !== G.aim.id) return;
  const a = aimFromDrag(G.aim);
  G.aim = null;
  if(G.st === 'aim' && a.len > 22 && a.pow > 0.02) throwRang(a.ang, 0.12 + a.pow * 0.88);
}
/* keyboard: arrows aim, space throws, hold space to curve tighter */
function keyAimUpdate(rdt){
  const k = G.kAim;
  if(K.ArrowLeft || K.KeyA) k.ang -= rdt * 1.6;
  if(K.ArrowRight || K.KeyD) k.ang += rdt * 1.6;
  if(K.ArrowUp || K.KeyW) k.pow = clamp(k.pow + rdt * 0.8, 0.05, 1);
  if(K.ArrowDown || K.KeyS) k.pow = clamp(k.pow - rdt * 0.8, 0.05, 1);
}
const K = {};
function keyDown(e){
  const c = e.code;
  if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c)) e.preventDefault();
  if(SDK.adBusy) return;
  AU.unlock();
  if(c === 'Escape' || c === 'KeyP'){ UI.togglePause(); return; }
  if(G.paused || UI.modalOpen()){ if(c === 'Enter' || c === 'Space') UI.primaryAction(); return; }
  if(G.st === 'intro'){ if(G.introT > 0.6) G.introT = 99; return; }
  if(K[c]) return;
  K[c] = true;
  if(G.st === 'aim' && /^Arrow|Key[WASD]$/.test(c) && !G.kAim){ G.kAim = { ang: -0.4, pow: 0.6 }; SDK.gameplayStart(); }
  if(c === 'Space' || c === 'Enter'){
    if(G.st === 'aim'){
      if(!G.kAim) G.kAim = { ang: -0.4, pow: 0.6 };
      else{ const k = G.kAim; G.kAim = null; throwRang(k.ang, 0.12 + k.pow * 0.88); }
      SDK.gameplayStart();
    }else if(G.st === 'fly') G.holding = true;
  }
  if(c === 'KeyR') restartLevel();
}
function keyUp(e){
  K[e.code] = false;
  if(e.code === 'Space' || e.code === 'Enter') G.holding = false;
}

/* ---------------- boot ---------------- */
function loop(now){
  const rdt = Math.min(0.05, (now - loop.last) / 1000 || 0);
  loop.last = now;
  try{ update(rdt); R.draw(); }catch(e){ SDK.error(e); console.error(e); }
  requestAnimationFrame(loop);
}
function boot(){
  R.init();
  UI.init();
  R.draw();                                  // first frame = the Poki thumbnail
  const cv = R.cv;
  cv.addEventListener('pointerdown', e => { try{ cv.setPointerCapture(e.pointerId); }catch(_){} pointerDown(e); });
  cv.addEventListener('pointermove', pointerMove);
  cv.addEventListener('pointerup', pointerUp);
  cv.addEventListener('pointercancel', pointerUp);
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', () => { for(const k in K) K[k] = false; G.holding = false; G.aim = null; });
  document.addEventListener('visibilitychange', () => AU.setHidden(document.hidden));
  document.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('wheel', e => { if(e.ctrlKey) e.preventDefault(); }, { passive: false });
  requestAnimationFrame(t => { loop.last = t; loop(t); });
  SDK.init().then(() => SDK.loadingFinished());
}
