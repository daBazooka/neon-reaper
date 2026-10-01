'use strict';
/* Input, HUD, menus and boot. */
let playing = false;
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }

const UI = {
  touch: matchMedia('(pointer:coarse)').matches,
  tab: 'car', choices: [],
  banner(a, b, col){
    const el = $('banner');
    el.querySelector('b').textContent = a; el.querySelector('b').style.color = col || '#fff';
    el.querySelector('small').textContent = b || '';
    el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden');
    clearTimeout(this.banT); this.banT = setTimeout(() => el.classList.add('hidden'), 2200);
  },
  tip(txt, ms){ const el = $('tip'); el.textContent = txt; el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden'); clearTimeout(this.tipT); this.tipT = setTimeout(() => el.classList.add('hidden'), ms || 4000); },
  toast(txt){ const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = txt; $('toasts').appendChild(d); setTimeout(() => d.remove(), 2400); },
  showPick(){
    endPlay(); clearInput();
    this.choices = rollCards();
    this.renderPick();
    $('pTitle').textContent = G.round % 5 === 0 ? '👑 BOSS LOOT: CHOOSE AN UPGRADE' : 'ROUND ' + G.round + ' CLEAR: CHOOSE AN UPGRADE';
    show('pick');
  },
  renderPick(){
    const box = $('pCards'); box.innerHTML = '';
    for(const c of this.choices){
      const b = document.createElement('button');
      const lv = G.cards[c.id] || 0;
      b.innerHTML = `<div class="ci">${c.icon}</div><div><div class="cn">${c.name}</div><div class="cd">${c.desc}</div>${lv && c.id !== 'repair' ? `<div class="lv">LEVEL ${lv} ➜ ${lv + 1}</div>` : ''}</div>`;
      b.onclick = () => { if(G.state !== 'pick') return; AU.init(); AU.pickCard(); addCard(c); renderCards(); hide('pick'); nextRound(); beginPlay(); };
      box.appendChild(b);
    }
    $('pReroll').classList.toggle('hidden', G.rerolls <= 0);
    $('pReroll').textContent = '🎲 REROLL (' + G.rerolls + ')';
  },
  gameOver(){ gameOver(); },
  vsKO(pl){ AU.ko(); this.banner(['🔴', '🔵'][pl] + ' PLAYER ' + (pl + 1) + ' SCORES!', G.vs.score[0] + ' : ' + G.vs.score[1], pl ? '#4fb4ff' : '#ff5a5a'); },
  vsOver(){
    endPlay(); clearInput(); hideTouch();
    const w = G.vs.winner;
    save.stats.vs++; missionTick({}); persist();
    $('vTitle').textContent = 'PLAYER ' + (w + 1) + ' WINS!'; $('vTitle').className = 'ttl ' + (w ? 'p2' : 'p1');
    $('vScore').innerHTML = `<span class="p1">${G.vs.score[0]}</span> : <span class="p2">${G.vs.score[1]}</span>`;
    AU.win(); SDK.happytime();
    openScreen('vsOver');
  }
};

const SCREENS = ['pick', 'over', 'vsOver', 'vsHelp', 'shop', 'missions', 'settings', 'pause'];
function anyScreen(){ return SCREENS.some(id => !$(id).classList.contains('hidden')); }
function closeScreens(){ SCREENS.forEach(hide); }
let backTo = null;
function openScreen(id, from){ backTo = from || null; SCREENS.forEach(s => s !== id && hide(s)); show(id); }
function hideTouch(){ hide('stick'); hide('stick2'); hide('driftBtn'); }

/* ---------------- flow ---------------- */
function toTitle(){
  endPlay(); closeScreens(); clearInput(); hideTouch();
  startDemo();
  AU.setStyle('title'); AU.eng = 0;
  hide('hud'); hide('vsHud'); hide('tip'); hide('banner'); show('title');
  refreshTitle();
}
function refreshTitle(){
  $('tCoins').textContent = save.coins;
  $('tBest').textContent = save.best ? '🏆 Best: round ' + save.best : '🏆 First cup!';
  $('tHint').textContent = UI.touch ? 'Drag to steer · auto-drift on sharp turns · DRIFT button for more swing' : 'Arrows / WASD to drive · SPACE to drift and swing the ball';
  const can = PERKS.some(p => save.perk[p.id] < p.max && perkCost(p, save.perk[p.id]) <= save.coins) || CARS.some(c => !save.ownCar[c.id] && c.price <= save.coins);
  $('shopBadge').classList.toggle('hidden', !can);
  $('miBadge').classList.toggle('hidden', !save.missions.some(m => m.done && !m.claimed));
}
function play(){
  closeScreens(); hide('title');
  SDK.midgame(() => {
    clearInput();
    startCup();
    AU.setStyle('play');
    show('hud'); hide('vsHud'); renderCards();
    if(UI.touch) show('driftBtn');
    beginPlay();
    if(G.freeCards > 0){ G.state = 'pick'; UI.showPick(); $('pTitle').textContent = '🃏 HEAD START: CHOOSE AN UPGRADE'; G.round--; }
    if(!save.tut) setTimeout(() => UI.tip(UI.touch ? 'Drag to steer. Turn hard to drift and swing your ball into cars!' : 'Drive with arrows / WASD. Hold SPACE to drift and swing your ball into cars!', 6000), 2400);
  });
}
function playVs(){
  closeScreens(); hide('title');
  SDK.midgame(() => {
    clearInput();
    startVs();
    AU.setStyle('play');
    hide('hud'); show('vsHud'); updateVsHud();
    beginPlay();
    UI.banner('FIGHT!', 'First to 5 wrecks wins', '#ffd23a'); AU.horn();
  });
}
function runCoins(){ return Math.round(G.run.coins); }
function gameOver(){
  endPlay(); clearInput(); hideTouch();
  const coins = runCoins();
  save.coins += coins; save.stats.coins += coins; save.runs++;
  const newBest = G.round > save.best;
  if(newBest) save.best = G.round;
  missionTick({ round: G.round, combo: G.run.maxCombo });
  if(!save.tut) save.tut = 1; persist();
  G.lastCoins = coins;
  $('oTitle').textContent = newBest && save.runs > 1 ? '🏆 NEW BEST!' : 'WRECKED!';
  $('oRound').textContent = 'ROUND ' + G.round;
  $('oBest').textContent = 'Best: round ' + save.best;
  $('oStats').innerHTML = [['💥 Cars wrecked', G.run.wrecks], ['👑 Bosses', G.run.bosses], ['⛓ Best combo', G.run.maxCombo + 'x'], ['🛢 Barrels', G.run.barrels]].map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join('');
  $('oCoins').textContent = '+' + coins;
  $('oRevive').classList.toggle('hidden', !SDK.canRewarded() || G.revived);
  $('oDouble').classList.toggle('hidden', !SDK.canRewarded()); $('oDouble').disabled = false;
  $('oMiss').innerHTML = save.missions.map(m => `<div class="${m.done ? 'done' : ''}">${m.done ? '✅' : '🎯'} ${MISSION_POOL.find(p => p.id === m.id).txt(m.n)} <b>${Math.min(m.prog, m.n)}/${m.n}</b></div>`).join('');
  AU.over(); AU.eng = 0;
  openScreen('over');
}

/* ---------------- garage / missions / settings ---------------- */
function carPreview(def, ballId){
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  const o = newCar({ pl: 0, def, x: 0, y: 0, a: -0.5, r: def.r, col: def.col, gold: def.gold, inp: { steer: 0.4 } });
  c.translate(74, 54); c.scale(1.5, 1.5);
  const b = BALLS.find(x => x.id === ballId) || BALLS[0];
  const ch = { pts: [{ x: -14, y: 12 }, { x: -20, y: 18 }, { x: -26, y: 22 }], ball: b, trail: [{ x: -26, y: 22 }], spd: 0 };
  ch.pts[2].x = -24; ch.pts[2].y = 24;
  const sv = G.cards; G.cards = {};
  try{ drawChain(c, ch, 0); drawCar(c, o, 0); }catch(e){}
  G.cards = sv;
  return cv;
}
function ballPreview(b){
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  c.translate(64, 64); c.scale(2, 2);
  const ch = { pts: [{ x: -20, y: -20 }, { x: -8, y: -8 }, { x: 0, y: 0 }], ball: b, trail: [{ x: 0, y: 0 }], spd: 0 };
  const sv = G.cards; G.cards = {};
  try{ drawChain(c, ch, 0); }catch(e){}
  G.cards = sv;
  return cv;
}
function buildShop(){
  $('sCoins').textContent = save.coins;
  const g = $('sGrid'); g.innerHTML = '';
  document.querySelectorAll('#shop .tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.tab));
  if(UI.tab === 'perk'){
    g.style.display = 'flex'; g.style.flexDirection = 'column'; g.style.gap = '8px';
    for(const p of PERKS){
      const l = save.perk[p.id], max = l >= p.max, cost = perkCost(p, l);
      const d = document.createElement('div'); d.className = 'row';
      d.innerHTML = `<div class="ic">${p.icon}</div><div class="tx">${p.name} <small>${p.desc} · level ${l}/${p.max}</small></div><button>${max ? 'MAX' : '🪙 ' + cost}</button>`;
      const b = d.querySelector('button'); b.disabled = max || save.coins < cost;
      b.onclick = () => { if(max || save.coins < cost) return; save.coins -= cost; save.perk[p.id]++; persist(); AU.buy(); buildShop(); refreshTitle(); };
      g.appendChild(d);
    }
    return;
  }
  g.style.display = ''; g.style.flexDirection = ''; g.style.gap = '';
  const isCar = UI.tab === 'car', list = isCar ? CARS : BALLS, own = isCar ? save.ownCar : save.ownBall;
  for(const it of list){
    const has = !!own[it.id], eq = (isCar ? save.car : save.ball) === it.id;
    const b = document.createElement('button'); b.className = eq ? 'eq' : '';
    b.appendChild(isCar ? carPreview(it, save.ball) : ballPreview(it));
    const n = document.createElement('div'); n.textContent = it.name; b.appendChild(n);
    if(isCar){ const st = document.createElement('div'); st.className = 'small'; st.style.fontSize = '11px'; st.textContent = `❤${it.hp} ⚡${it.top} ↺${it.turn}`; b.appendChild(st); }
    const p = document.createElement('div'); p.className = has ? '' : 'price'; p.textContent = eq ? 'EQUIPPED' : has ? 'OWNED' : '🪙 ' + it.price; b.appendChild(p);
    b.onclick = () => {
      if(!has){ if(save.coins < it.price){ AU.lose1(); UI.toast('Need more coins!'); return; } save.coins -= it.price; own[it.id] = 1; AU.buy(); }
      else AU.click();
      if(isCar) save.car = it.id; else save.ball = it.id;
      persist(); buildShop(); refreshTitle();
      if(G.mode === 'demo'){ const pc = G.players[0]; const n = playerCar(0, save.car, save.ball, pc.x, pc.y, pc.a); n.hp = n.max = 1e9; G.cars[G.cars.indexOf(pc)] = n; G.players[0] = n; }
    };
    g.appendChild(b);
  }
}
function buildMissions(){
  const l = $('mList'); l.innerHTML = '';
  for(const m of save.missions){
    const p = MISSION_POOL.find(x => x.id === m.id);
    const d = document.createElement('div'); d.className = 'row';
    d.innerHTML = `<div class="ic">🎯</div><div class="tx">${p.txt(m.n)}<div class="bar"><i style="width:${Math.min(100, m.prog / m.n * 100)}%"></i></div><small>${Math.min(m.prog, m.n)} / ${m.n}</small></div><button>${m.done ? 'CLAIM' : '🪙 ' + m.rw}</button>`;
    const b = d.querySelector('button'); b.disabled = !m.done;
    b.onclick = () => { if(!m.done) return; m.claimed = true; save.coins += m.rw; AU.buy(); UI.toast('Mission complete! 🪙 ' + m.rw); fillMissions(); persist(); buildMissions(); refreshTitle(); };
    l.appendChild(d);
  }
  $('mStats').textContent = `Best round: ${save.best} · Cars wrecked: ${save.stats.wrecks} · Bosses: ${save.stats.bosses} · Daily streak: ${save.streak}`;
}
function buildSettings(){ document.querySelectorAll('.setRow').forEach(r => { const v = save.opt[r.dataset.opt], b = r.querySelector('b'); b.textContent = v ? 'ON' : 'OFF'; b.classList.toggle('off', !v); }); }

/* ---------------- pause ---------------- */
let pausedFrom = null;
function pauseGame(){ if(G.state !== 'play' || G.mode === 'demo') return; pausedFrom = G.state; G.state = 'pause'; clearInput(); endPlay(); AU.eng = 0; openScreen('pause'); }
function resumeGame(){ closeScreens(); if(G.state === 'pause'){ G.state = pausedFrom || 'play'; beginPlay(); } }

/* ---------------- input ---------------- */
const K = {};
const sticks = [{ id: null, x: 0, y: 0, dx: 0, dy: 0, el: 'stick' }, { id: null, x: 0, y: 0, dx: 0, dy: 0, el: 'stick2' }];
let driftHeld = false;
function clearInput(){ for(const k in K) K[k] = false; for(const s of sticks){ s.id = null; s.dx = s.dy = 0; hide(s.el); } driftHeld = false; $('driftBtn').classList.remove('on'); G.inputs = [{}, {}]; }
function keyInput(up, down, left, right, drift){
  return { thr: (K[up] ? 1 : 0) - (K[down] ? 1 : 0), steer: (K[right] ? 1 : 0) - (K[left] ? 1 : 0), drift: drift.some(k => K[k]) };
}
/* turns a stick direction into gas + steering for that car (point-to-steer, auto-drift on hard turns) */
function stickInput(s, car){
  const m = Math.hypot(s.dx, s.dy);
  if(m < 0.2 || !car) return null;
  const want = Math.atan2(s.dy, s.dx), diff = angDiff(car.a, want), sp = Math.hypot(car.vx, car.vy);
  return { thr: 1, steer: clamp(diff * 2.6, -1, 1), drift: Math.abs(diff) > 1.05 && sp > 150 };
}
function pollInput(){
  if(G.mode === 'demo') return;
  if(G.mode === 'cup'){
    const a = keyInput('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ['Space', 'ShiftLeft', 'ShiftRight']), b = keyInput('KeyW', 'KeyS', 'KeyA', 'KeyD', []);
    let I = { thr: clamp(a.thr + b.thr, -1, 1), steer: clamp(a.steer + b.steer, -1, 1), drift: a.drift };
    const st = stickInput(sticks[0], G.players[0]); if(st) I = st;
    if(driftHeld) I.drift = true;
    G.inputs[0] = I;
  } else if(G.mode === 'vs'){
    let a = keyInput('KeyW', 'KeyS', 'KeyA', 'KeyD', ['Space', 'ShiftLeft', 'KeyF']);
    let b = keyInput('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ['Enter', 'ShiftRight', 'Slash', 'Period', 'NumpadEnter', 'Numpad0']);
    const s0 = stickInput(sticks[0], G.players[0]), s1 = stickInput(sticks[1], G.players[1]);
    G.inputs[0] = s0 || a; G.inputs[1] = s1 || b;
  }
  const p = G.players[0];
  AU.eng = p && !p.dead && G.state === 'play' ? clamp(Math.hypot(p.vx, p.vy) / 500, 0, 1) * (Math.abs(G.inputs[0].thr || 0) > 0 ? 1 : 0.5) : 0;
}
function wire(){
  const cv = R.cv;
  cv.addEventListener('pointerdown', e => {
    AU.init();
    if(SDK.adBusy || anyScreen() || G.state !== 'play' || G.mode === 'demo') return;
    let si = 0;
    if(G.mode === 'vs') si = e.clientX < R.W / 2 ? 0 : 1;
    const s = sticks[si]; if(s.id !== null) return;
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    s.id = e.pointerId; s.x = e.clientX; s.y = e.clientY; s.dx = s.dy = 0;
    const el = $(s.el); el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px'; el.firstElementChild.style.transform = ''; show(s.el);
  });
  cv.addEventListener('pointermove', e => {
    const s = sticks.find(s => s.id === e.pointerId); if(!s) return;
    let dx = e.clientX - s.x, dy = e.clientY - s.y; const l = Math.hypot(dx, dy), m = 50;
    if(l > m){ dx *= m / l; dy *= m / l; }
    s.dx = l > 8 ? dx / m : 0; s.dy = l > 8 ? dy / m : 0;
    $(s.el).firstElementChild.style.transform = `translate(${dx}px,${dy}px)`;
  });
  const up = e => { const s = sticks.find(s => s.id === e.pointerId); if(!s) return; s.id = null; s.dx = s.dy = 0; hide(s.el); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const db = $('driftBtn');
  db.addEventListener('pointerdown', e => { e.stopPropagation(); driftHeld = true; db.classList.add('on'); });
  const dbUp = () => { driftHeld = false; db.classList.remove('on'); };
  db.addEventListener('pointerup', dbUp); db.addEventListener('pointercancel', dbUp); db.addEventListener('pointerleave', dbUp);
  addEventListener('keydown', e => {
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if(SDK.adBusy) return;
    AU.init();
    if(e.repeat){ K[e.code] = true; return; }
    if(e.code === 'Escape' || e.code === 'KeyP'){ if(G.state === 'pause') resumeGame(); else if(G.state === 'play' && G.mode !== 'demo') pauseGame(); else if(anyScreen() && G.mode === 'demo') { closeScreens(); refreshTitle(); } return; }
    if(G.mode === 'demo' && !anyScreen() && (e.code === 'Space' || e.code === 'Enter')){ play(); return; }
    if(!$('over').classList.contains('hidden') && (e.code === 'Space' || e.code === 'Enter')){ $('oAgain').click(); return; }
    if(!$('vsOver').classList.contains('hidden') && (e.code === 'Space' || e.code === 'Enter')){ $('vAgain').click(); return; }
    if(!$('pick').classList.contains('hidden') && /^Digit[123]$/.test(e.code)){ const b = $('pCards').children[+e.code.slice(5) - 1]; if(b) b.click(); return; }
    K[e.code] = true;
  });
  addEventListener('keyup', e => { K[e.code] = false; });
  addEventListener('blur', clearInput);
  document.addEventListener('contextmenu', e => e.preventDefault());

  const tap = (id, fn) => $(id).addEventListener('click', e => { if(SDK.adBusy) return; AU.init(); AU.click(); fn(e); });
  tap('playBtn', play);
  tap('vsBtn', () => openScreen('vsHelp'));
  tap('vsGo', playVs);
  tap('bShop', () => { buildShop(); openScreen('shop'); });
  tap('bMi', () => { buildMissions(); openScreen('missions'); });
  tap('bSet', () => { buildSettings(); openScreen('settings'); });
  tap('pauseBtn', pauseGame);
  tap('pResume', resumeGame);
  tap('pSet', () => { buildSettings(); openScreen('settings', 'pause'); });
  tap('pQuit', () => { closeScreens(); if(G.mode === 'cup'){ G.state = 'over'; gameOver(); } else toTitle(); });
  tap('pReroll', () => { if(G.rerolls <= 0) return; G.rerolls--; UI.choices = rollCards(); UI.renderPick(); });
  tap('oHome', toTitle);
  tap('oShop', () => { buildShop(); openScreen('shop', 'over'); });
  tap('oAgain', play);
  tap('vHome', toTitle);
  tap('vAgain', playVs);
  tap('oRevive', () => SDK.rewarded(ok => {
    if(!ok) return;
    save.coins -= G.lastCoins; save.runs--; persist();
    const p = G.players[0];
    G.revived = true; p.dead = false; p.hp = p.max; p.inv = 3; G.state = 'play'; closeScreens(); rebuildChains(p, p.ballId);
    for(const c of G.cars) if(c.pl < 0 && Math.hypot(c.x - p.x, c.y - p.y) < 300){ const a = Math.atan2(c.y - p.y, c.x - p.x); c.vx += Math.cos(a) * 600; c.vy += Math.sin(a) * 600; }
    if(UI.touch) show('driftBtn');
    beginPlay();
  }));
  tap('oDouble', () => { $('oDouble').disabled = true; SDK.rewarded(ok => { if(!ok){ $('oDouble').disabled = false; return; } save.coins += G.lastCoins; persist(); $('oCoins').textContent = '+' + G.lastCoins * 2; $('oDouble').classList.add('hidden'); AU.coin(); }); });
  document.querySelectorAll('#shop .tabs button').forEach(b => b.addEventListener('click', () => { AU.click(); UI.tab = b.dataset.tab; buildShop(); }));
  document.querySelectorAll('.back').forEach(b => b.addEventListener('click', () => { AU.click(); hide(b.closest('.screen').id); if(backTo){ show(backTo); backTo = null; } else refreshTitle(); }));
  document.querySelectorAll('.setRow').forEach(r => r.addEventListener('click', () => { const k = r.dataset.opt; save.opt[k] = !save.opt[k]; persist(); AU.apply(); AU.click(); buildSettings(); }));
  document.querySelectorAll('.screen, #hud button, #title button').forEach(el => el.addEventListener('pointerdown', e => e.stopPropagation()));
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ persist(); pauseGame(); } else AU.resume(); });
  SDK.onMute = m => AU.setPortalMute(m);
}

/* ---------------- HUD ---------------- */
function renderCards(){
  const h = [];
  for(const id in G.cards){ if(!G.cards[id] || id === 'repair') continue; const c = CARDS.find(x => x.id === id); h.push(`<span>${c.icon}${G.cards[id] > 1 ? `<small>${G.cards[id]}</small>` : ''}</span>`); }
  $('cardRow').innerHTML = h.join('');
}
function updateVsHud(){ $('vs1').textContent = G.vs.score[0]; $('vs2').textContent = G.vs.score[1]; }
let hudK = '';
function updateHUD(){
  if(G.mode === 'vs'){ updateVsHud(); return; }
  if(G.mode !== 'cup') return;
  const p = G.players[0];
  const left = G.queue.length + G.cars.filter(c => c.pl < 0 && !c.dead).length;
  const b = G.boss && !G.boss.dead ? G.boss : null;
  const k = [Math.ceil(p.hp), p.max, G.round, left, Math.floor(G.run.coins), G.combo, b ? Math.ceil(b.hp) : -1].join();
  if(k === hudK) return; hudK = k;
  $('hpBar').firstElementChild.style.width = clamp(p.hp / p.max * 100, 0, 100) + '%';
  $('hpBar').classList.toggle('low', p.hp < p.max * 0.3);
  $('hpTxt').textContent = Math.max(0, Math.ceil(p.hp)) + ' / ' + p.max;
  $('roundTxt').textContent = (G.round % 5 === 0 ? '👑 ' : '') + 'ROUND ' + G.round;
  $('leftTxt').textContent = left ? '🚗 ' + left + ' left' : '✅ clear';
  $('coinTxt').textContent = Math.floor(G.run.coins);
  $('comboTxt').classList.toggle('hidden', G.combo < 2);
  $('comboTxt').textContent = G.combo + 'x COMBO';
  $('bossBar').classList.toggle('hidden', !b);
  if(b){ $('bossName').textContent = '👑 ' + b.name; $('bossBar').querySelector('i').style.width = clamp(b.hp / b.max * 100, 0, 100) + '%'; }
}

/* ---------------- loop + boot ---------------- */
let last = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > 0.05) dt = 0.05;
  try{ pollInput(); update(dt); R.draw(dt); updateHUD(); }catch(err){ console.error(err); }
}
(async () => {
  R.init();
  await SDK.init();
  SDK.loadingStart();
  loadSave();
  wire();
  toTitle();
  requestAnimationFrame(frame);
  SDK.loadingStop();
  const b = $('boot'); b.style.opacity = '0'; setTimeout(() => b.remove(), 450);
  const gift = dailyReward();
  if(gift) setTimeout(() => { UI.toast(`🎁 Daily reward: 🪙 ${gift}` + (save.streak > 1 ? ` · ${save.streak}-day streak!` : '')); refreshTitle(); }, 900);
})();
