'use strict';
/* Input, HUD, menus and boot. */
let playing = false;
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }

const UI = {
  touch: matchMedia('(pointer:coarse)').matches,
  tab: 'gun', choices: [],
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
    $('pTitle').textContent = G.wave % 5 === 0 ? '👑 BOSS LOOT: CHOOSE A POWER' : 'WAVE ' + G.wave + ' CLEAR: CHOOSE A POWER';
    show('pick');
  },
  renderPick(){
    const box = $('pCards'); box.innerHTML = '';
    for(const c of this.choices){
      const b = document.createElement('button');
      const lv = G.cards[c.id] || 0;
      b.innerHTML = `<div class="ci">${c.icon}</div><div><div class="cn">${c.name}</div><div class="cd">${c.desc}</div>${lv && c.id !== 'heal' ? `<div class="lv">LEVEL ${lv} ➜ ${lv + 1}</div>` : ''}</div>`;
      b.onclick = () => { if(G.state !== 'pick') return; AU.init(); AU.pickCard(); addCard(c); renderCards(); hide('pick'); nextWave(); beginPlay(); };
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
function hideTouch(){ hideTut(); }

/* ---------------- flow ---------------- */
function toTitle(){
  endPlay(); closeScreens(); clearInput(); hideTouch(); hideTut();
  startDemo();
  AU.setStyle('title');
  hide('hud'); hide('vsHud'); hide('tip'); hide('banner'); show('title'); R.mouse = null;
  refreshTitle();
}
function refreshTitle(){
  $('tCoins').textContent = save.coins;
  $('tBest').textContent = save.best ? '🏆 Best: wave ' + save.best : '🏆 First run!';
  $('tHint').textContent = UI.touch ? 'Tap where to shoot · the recoil throws you the other way' : 'Aim with the mouse · click to shoot · the recoil throws you the other way';
  const can = PERKS.some(p => save.perk[p.id] < p.max && perkCost(p, save.perk[p.id]) <= save.coins) || GUNS.some(c => !save.ownGun[c.id] && c.price <= save.coins);
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
    beginPlay();
    if(G.freeCards > 0){ G.state = 'pick'; UI.showPick(); $('pTitle').textContent = '🃏 HEAD START: CHOOSE A POWER'; G.wave--; }
    if(save.tut < 2) setTimeout(() => { if(G.mode === 'cup' && G.state === 'play') showTut(); }, 2300);
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
    UI.banner('DUEL!', 'First to 5 wins', '#ffd23a'); AU.horn();
  });
}
function runCoins(){ return Math.round(G.run.coins); }
function gameOver(){
  endPlay(); clearInput(); hideTouch();
  const coins = runCoins();
  save.coins += coins; save.stats.coins += coins; save.runs++;
  const newBest = G.wave > save.best;
  if(newBest) save.best = G.wave;
  missionTick({ wave: G.wave, combo: G.run.maxCombo });
  hideTut(); save.tut = Math.min(2, save.tut + 1); persist();
  G.lastCoins = coins;
  $('oTitle').textContent = newBest && save.runs > 1 ? '🏆 NEW BEST!' : 'GAME OVER';
  $('oRound').textContent = 'WAVE ' + G.wave;
  $('oBest').textContent = 'Best: wave ' + save.best;
  $('oStats').innerHTML = [['💥 Enemies', G.run.kills], ['👑 Bosses', G.run.bosses], ['⛓ Best combo', G.run.maxCombo + 'x'], ['🦶 Stomps', G.run.stomps]].map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join('');
  $('oCoins').textContent = '+' + coins;
  $('oRevive').classList.toggle('hidden', !SDK.canRewarded() || G.revived);
  $('oDouble').classList.toggle('hidden', !SDK.canRewarded()); $('oDouble').disabled = false;
  $('oMiss').innerHTML = save.missions.map(m => `<div class="${m.done ? 'done' : ''}">${m.done ? '✅' : '🎯'} ${MISSION_POOL.find(p => p.id === m.id).txt(m.n)} <b>${Math.min(m.prog, m.n)}/${m.n}</b></div>`).join('');
  AU.over();
  openScreen('over');
}

/* ---------------- garage / missions / settings ---------------- */
function gunPreview(gun, skin){
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  c.translate(56, 70); c.scale(2.2, 2.2);
  const p = { pl: 0, x: 0, y: 0, r: 16, aim: -0.45, gun, col: skin, inv: 0, flash: 0, squash: 0, hp: 1, max: 1, ammo: gun.mag };
  const sv = G.mode; G.mode = 'menu';
  try{ drawPlayer(c, p, 0); }catch(e){}
  G.mode = sv;
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
  const isGun = UI.tab === 'gun', list = isGun ? GUNS : SKINS, own = isGun ? save.ownGun : save.ownSkin;
  const skinCol = (SKINS.find(k => k.id === save.skin) || SKINS[0]).c;
  for(const it of list){
    const has = !!own[it.id], eq = (isGun ? save.gun : save.skin) === it.id;
    const b = document.createElement('button'); b.className = eq ? 'eq' : '';
    b.appendChild(isGun ? gunPreview(it, skinCol) : gunPreview(gunDef(save.gun), it.c));
    const n = document.createElement('div'); n.textContent = it.name; b.appendChild(n);
    if(isGun){ const st = document.createElement('div'); st.className = 'small'; st.style.fontSize = '11px'; st.textContent = `💥${it.dmg}${it.pellets > 1 ? '×' + it.pellets : ''} 🔋${it.mag} 🚀${it.kick}`; b.appendChild(st); }
    const p = document.createElement('div'); p.className = has ? '' : 'price'; p.textContent = eq ? 'EQUIPPED' : has ? 'OWNED' : '🪙 ' + it.price; b.appendChild(p);
    b.onclick = () => {
      if(!has){ if(save.coins < it.price){ AU.lose1(); UI.toast('Need more coins!'); return; } save.coins -= it.price; own[it.id] = 1; AU.buy(); }
      else AU.click();
      if(isGun) save.gun = it.id; else save.skin = it.id;
      persist(); buildShop(); refreshTitle();
      if(G.mode === 'demo'){ const pc = G.players[0]; pc.gun = gunDef(save.gun); pc.col = (SKINS.find(k => k.id === save.skin) || SKINS[0]).c; }
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
  $('mStats').textContent = `Best wave: ${save.best} · Enemies: ${save.stats.kills} · Bosses: ${save.stats.bosses} · Daily streak: ${save.streak}`;
}
function buildSettings(){ document.querySelectorAll('.setRow').forEach(r => { const v = save.opt[r.dataset.opt], b = r.querySelector('b'); b.textContent = v ? 'ON' : 'OFF'; b.classList.toggle('off', !v); }); }

/* ---------------- pause ---------------- */
let pausedFrom = null;
function pauseGame(){ if(G.state !== 'play' || G.mode === 'demo') return; pausedFrom = G.state; G.state = 'pause'; clearInput(); endPlay(); openScreen('pause'); }
function resumeGame(){ closeScreens(); if(G.state === 'pause'){ G.state = pausedFrom || 'play'; beginPlay(); } }

/* ---------------- input ---------------- */
const K = {};
const ptr = { down: false, x: 0, y: 0, id: null, mouse: false, used: false };
const half = [false, false];
let keyAim = false;
function clearInput(){ for(const k in K) K[k] = false; ptr.down = false; ptr.id = null; half[0] = half[1] = false; G.inputs = [{}, {}]; }
function pollInput(){
  if(G.mode === 'cup'){
    const p = G.players[0]; if(!p) return;
    const rot = ((K.ArrowRight || K.KeyD) ? 1 : 0) - ((K.ArrowLeft || K.KeyA) ? 1 : 0);
    if(rot) keyAim = true;
    const I = { fire: ptr.down || !!(K.Space || K.ArrowUp || K.KeyW) };
    if(ptr.used && !keyAim){ const w = R.toWorld(ptr.x, ptr.y); I.aim = Math.atan2(w.y - p.y, w.x - p.x); R.mouse = ptr.mouse ? w : null; }
    else { I.rot = rot; R.mouse = null; }
    G.inputs[0] = I;
  } else if(G.mode === 'vs'){
    const auto = UI.touch;
    G.inputs[0] = { rot: auto ? 0.55 : ((K.KeyD ? 1 : 0) - (K.KeyA ? 1 : 0)), fire: !!(K.KeyW || K.Space || K.KeyS) || half[0] };
    G.inputs[1] = { rot: auto ? -0.55 : ((K.ArrowRight ? 1 : 0) - (K.ArrowLeft ? 1 : 0)), fire: !!(K.ArrowUp || K.Enter || K.ArrowDown || K.NumpadEnter) || half[1] };
  }
}
function wire(){
  const cv = R.cv;
  const setPtr = e => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.mouse = e.pointerType === 'mouse'; ptr.used = true; };
  cv.addEventListener('pointerdown', e => {
    AU.init();
    if(SDK.adBusy || anyScreen() || G.state !== 'play' || G.mode === 'demo') return;
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    if(G.mode === 'vs'){ half[e.clientX < R.W / 2 ? 0 : 1] = true; ptr['h' + e.pointerId] = e.clientX < R.W / 2 ? 0 : 1; return; }
    setPtr(e); keyAim = false; ptr.down = true; ptr.id = e.pointerId;
  });
  addEventListener('pointermove', e => { if(G.mode === 'cup' && (e.pointerType === 'mouse' || e.pointerId === ptr.id)){ setPtr(e); if(e.pointerType === 'mouse') keyAim = false; } });
  const up = e => { if(G.mode === 'vs'){ const h = ptr['h' + e.pointerId]; if(h !== undefined){ half[h] = false; delete ptr['h' + e.pointerId]; } return; } if(e.pointerId === ptr.id){ ptr.down = false; ptr.id = null; } };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  addEventListener('keydown', e => {
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if(SDK.adBusy) return;
    AU.init();
    if(e.repeat){ K[e.code] = true; return; }
    // Escape is reserved by the browser (exits fullscreen), so pause is on P only
    if(e.code === 'KeyP'){ if(G.state === 'pause') resumeGame(); else if(G.state === 'play' && G.mode !== 'demo') pauseGame(); return; }
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
    const p = G.players[0], c = G.plats[2];
    G.revived = true; Object.assign(p, { dead: false, hp: p.max, inv: 3, x: c.x + c.w / 2, y: c.y - PR - 2, vx: 0, vy: 0, ammo: magSize(p) }); G.state = 'play'; closeScreens();
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

/* ---------------- onboarding (in gameplay, visual, skippable) ---------------- */
const tut = { on: false, drive: 0, drift: 0, t: 0 };
function showTut(){
  const el = $('tut'); el.classList.toggle('touch', UI.touch);
  el.innerHTML = UI.touch
    ? '<div class="tRow"><span class="hand">👆</span><b>TAP WHERE TO SHOOT</b></div><div class="tRow"><span class="kc wide">💨</span><b>RECOIL PUSHES YOU · LAND TO RELOAD</b></div><button id="tutSkip">SKIP ✕</button>'
    : '<div class="tRow"><span class="kc wide">🖱 AIM + CLICK</span><b>SHOOT</b></div><div class="tRow"><span class="kc wide">💨</span><b>RECOIL PUSHES YOU · LAND TO RELOAD</b></div><button id="tutSkip">SKIP ✕</button>';
  $('tutSkip').addEventListener('pointerdown', e => { e.stopPropagation(); hideTut(); });
  Object.assign(tut, { on: true, drive: 0, drift: 0, t: 0 });
  show('tut');
}
function hideTut(){ tut.on = false; hide('tut'); }
function tickTut(dt){
  if(!tut.on || G.mode !== 'cup' || G.state !== 'play') return;
  tut.t += dt;
  $('tut').classList.toggle('done1', G.run.shots >= 3);
  if((G.run.shots >= 3 && G.run.kills >= 2) || tut.t > 20) hideTut();
}

/* ---------------- HUD ---------------- */
function renderCards(){
  const h = [];
  for(const id in G.cards){ if(!G.cards[id]) continue; const c = CARDS.find(x => x.id === id); h.push(`<span>${c.icon}${G.cards[id] > 1 ? `<small>${G.cards[id]}</small>` : ''}</span>`); }
  $('cardRow').innerHTML = h.join('');
}
function updateVsHud(){ $('vs1').textContent = G.vs.score[0]; $('vs2').textContent = G.vs.score[1]; }
let hudK = '';
function updateHUD(){
  if(G.mode === 'vs'){ updateVsHud(); return; }
  if(G.mode !== 'cup') return;
  const p = G.players[0];
  const left = G.queue.length + G.foes.length;
  const b = G.boss && !G.boss.dead ? G.boss : null;
  const k = [Math.ceil(p.hp), p.max, G.wave, left, Math.floor(G.run.coins), G.combo, b ? Math.ceil(b.hp) : -1].join();
  if(k === hudK) return; hudK = k;
  $('hpBar').firstElementChild.style.width = clamp(p.hp / p.max * 100, 0, 100) + '%';
  $('hpBar').classList.toggle('low', p.hp < p.max * 0.3);
  $('hpTxt').textContent = Math.max(0, Math.ceil(p.hp)) + ' / ' + p.max;
  $('roundTxt').textContent = (G.wave % 5 === 0 ? '👑 ' : '') + 'WAVE ' + G.wave;
  $('leftTxt').textContent = left ? '👾 ' + left + ' left' : '✅ clear';
  $('coinTxt').textContent = Math.floor(G.run.coins);
  $('comboTxt').classList.toggle('hidden', G.combo < 3);
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
  try{ pollInput(); update(dt); R.draw(dt); updateHUD(); tickTut(dt); }catch(err){ console.error(err); }
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
