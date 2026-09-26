'use strict';
const SCREENS = ['menu', 'cards', 'pause', 'revive', 'over', 'shop', 'missions', 'settings', 'confirm'];
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
function hideAll(){ SCREENS.forEach(hide); }
function onTap(id, fn){ const el = typeof id === 'string' ? $(id) : id; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }
const isTouch = () => matchMedia('(pointer:coarse)').matches;
const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

/* ---------------- feedback ---------------- */
let annT = 0;
function announce(txt, col, sub){
  if(G.state !== 'play' && G.state !== 'cards') return;
  const a = $('announce');
  a.innerHTML = txt + (sub ? '<small>' + sub + '</small>' : '');
  a.style.color = col || '#f2b134';
  a.style.webkitTextStroke = '2.5px #3a2418';
  a.style.textShadow = '5px 5px 0 #3a2418';
  a.classList.remove('go'); void a.offsetWidth; a.classList.add('go');
  clearTimeout(annT); annT = setTimeout(() => a.classList.remove('go'), 1350);
}
function tip(html){ const t = $('tip'); if(!html){ t.classList.add('hidden'); return; } t.innerHTML = html; t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; }
function toast(title, body, col, dur){
  if(G.state !== 'play' && G.state !== 'over' && G.state !== 'cards') return;
  const host = $('toasts');
  while(host.children.length >= 3) host.firstChild.remove();
  const d = document.createElement('div'); d.className = 'toast';
  d.innerHTML = `<b style="color:${col || '#e2582b'}">${title}</b>${body || ''}`;
  host.appendChild(d);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 320); }, dur || 2800);
}

/* ---------------- HUD ---------------- */
const hudC = {};
function setH(key, val, fn){ if(hudC[key] === val) return; hudC[key] = val; fn(val); }
function updateHUD(){
  setH('score', fmt(G.score), v => $('hScore').textContent = v);
  setH('cash', Math.floor(G.cashRun), v => $('hCash').lastElementChild.textContent = fmt(v));
  setH('heat', G.heat, h => { let s = ''; for(let i = 1; i <= 5; i++) s += `<i class="${i <= h ? 'on' : ''}${i <= h && h >= 4 ? ' hot' : ''}">★</i>`; if(h > 5) s += `<em>×${h}</em>`; $('hHeat').innerHTML = s; });
  setH('time', Math.floor(G.t), v => $('hTime').textContent = mmss(v));
  setH('chain', G.chain, v => { const c = $('chain'); c.classList.toggle('on', v >= 2); c.classList.toggle('hot', v >= 5); c.firstElementChild.textContent = 'x' + v; });
  setH('boss', G.boss ? 1 : 0, v => $('bossBar').classList.toggle('hidden', !v));
  if(G.boss) setH('bhp', Math.round(G.boss.hp), v => $('bossHp').firstElementChild.style.width = clamp(v, 0, 100) + '%');
  const sp = Math.hypot(P.vx, P.vy);
  setH('spd', Math.round(sp * KMH / 2) * 2, v => { $('spd').firstElementChild.textContent = v; const k = clamp(v / 320, 0, 1); $('needle').style.transform = `rotate(${-90 + k * 180}deg)`; $('sArc').style.strokeDashoffset = 151 * (1 - k); });
  const hp = Math.round(P.hp / P.maxHp * 100);
  setH('hp', hp, v => { $('hpBar').firstElementChild.style.width = clamp(v, 0, 100) + '%'; $('hpBar').classList.toggle('low', v < 25); });
  const n = Math.round(G.nitro);
  setH('n', n, v => { $('nBar').firstElementChild.style.width = v + '%'; $('nBar').classList.toggle('full', v >= 100); $('nitroBtn').classList.toggle('empty', v <= 0); });
  setH('non', P.nitroOn ? 1 : 0, v => $('nitroBtn').classList.toggle('on', !!v));
}

/* ---------------- run flow ---------------- */
function startRun(daily){
  hideAll(); tip(null); $('toasts').innerHTML = '';
  for(const k in hudC) delete hudC[k];
  P = null;
  show('hud'); const t = isTouch(); $('nitroBtn').classList.toggle('hidden', !t); $('driftBtn').classList.toggle('hidden', !t);
  newRun(daily);
  SDK.gameplayStart();
  AU.init(); AU.resume();
}
function releaseInput(){ IN.joy = null; IN.keys = {}; IN.nitro = false; IN.brake = false; }
function pauseGame(){
  if(G.state !== 'play') return;
  G.state = 'pause'; SDK.gameplayStop(); releaseInput(); AU.engineOff();
  const b = $('pauseBuild'); b.innerHTML = '';
  for(const u of PERKS){ const l = G.up[u.id]; if(l) b.insertAdjacentHTML('beforeend', `<span>${u.icon} ${u.name}${u.max > 1 ? ' ' + l : ''}</span>`); }
  if(!b.innerHTML) b.innerHTML = '<span>No mods yet</span>';
  show('pause');
}
function resumeGame(){ hide('pause'); G.state = 'play'; SDK.gameplayStart(); AU.resume(); }

let cardsGuard = 0;
function openCards(){
  const pool = PERKS.filter(u => (G.up[u.id] || 0) < u.max);
  if(!pool.length) return;
  G.state = 'cards'; SDK.gameplayStop(); releaseInput(); AU.engineOff();
  $('cardsTitle').textContent = 'PIT STOP · HEAT ' + G.heat;
  const offers = [];
  while(offers.length < 3 && pool.length){
    const tot = pool.reduce((s, u) => s + RAR[u.rar].w, 0);
    let r = grng() * tot, i = 0;
    for(; i < pool.length; i++){ r -= RAR[pool[i].rar].w; if(r <= 0) break; }
    offers.push(pool.splice(Math.min(i, pool.length - 1), 1)[0]);
  }
  G.offers = offers;
  const row = $('cardRow'); row.innerHTML = '';
  offers.forEach((u, i) => {
    const lv = G.up[u.id] || 0, rc = RAR[u.rar];
    const d = document.createElement('div'); d.className = 'card'; d.style.setProperty('--c', rc.c); d.style.animationDelay = (i * .08) + 's';
    d.innerHTML = `<div class="ci">${u.icon}</div><div class="cr">${rc.n}</div><div class="cn">${u.name}</div><div class="cd">${u.desc}</div>` +
      (u.max > 1 ? `<div class="cl">LV ${lv} → ${lv + 1}</div>` : '<div class="cl">&nbsp;</div>') + `<div class="ck">${i + 1}</div>`;
    d.addEventListener('click', e => { e.stopPropagation(); pickCard(i); });
    row.appendChild(d);
  });
  show('cards'); AU.card();
  cardsGuard = performance.now() + 450;
}
function pickCard(i){
  if(G.state !== 'cards' || performance.now() < cardsGuard) return;
  const u = G.offers[i]; if(!u) return;
  AU.init(); AU.pick();
  G.up[u.id] = (G.up[u.id] || 0) + 1;
  if(u.id === 'armor'){ P.maxHp += 25; P.hp = P.maxHp; }
  hide('cards'); G.state = 'play'; SDK.gameplayStart();
  P.inv = Math.max(P.inv, 1);
  toast(u.name.toUpperCase(), u.desc, RAR[u.rar].c, 1800);
}

/* ---------------- death / revive / over ---------------- */
const REVIVE_COST = 150;
let revIV = 0;
function onDeathDone(){
  const canPay = save.cash + G.cashRun >= REVIVE_COST;
  if(!G.revived && G.t > 40 && (SDK.canRewarded() || canPay)) openRevive(); else gameOver();
}
function openRevive(){
  G.state = 'revive'; SDK.gameplayStop();
  $('revAdBtn').classList.toggle('hidden', !SDK.canRewarded());
  $('revPayBtn').classList.toggle('hidden', !(save.cash + G.cashRun >= REVIVE_COST));
  $('revCost').textContent = REVIVE_COST;
  let left = 6; $('revNum').textContent = left;
  const arc = $('revArc'); arc.style.transition = 'none'; arc.style.strokeDashoffset = '0'; void arc.offsetWidth; arc.style.transition = 'stroke-dashoffset 6s linear'; arc.style.strokeDashoffset = '276.5';
  show('revive');
  clearInterval(revIV);
  revIV = setInterval(() => { if(SDK.adBusy) return; left--; $('revNum').textContent = Math.max(0, left); if(left <= 0){ clearInterval(revIV); hide('revive'); gameOver(); } }, 1000);
}
function doRevive(){
  clearInterval(revIV); hide('revive');
  G.revived = true; G.state = 'play';
  P.dead = false; P.hp = P.maxHp * .6; P.inv = 2.5;
  G.BM.length = 0;
  for(const e of G.E){ const d = Math.hypot(e.x - P.x, e.y - P.y); if(d < 500 && !e.boss && e.type !== 'heli') e.gone = true; }
  explode(P.x, P.y, 1.2, 'env');
  announce('BACK ON THE ROAD', '#2a9d8f'); AU.repair();
  SDK.gameplayStart(); AU.setMusic(G.boss ? 3 : G.heat >= 3 ? 2 : 1);
}
const TIPS = [
  'Turn <b>hard</b> to drift: the harder you drift, the more fire you leave.',
  'Drive in a <b>circle</b> around a pack of chasers to trap them in a ring of fire.',
  'Explosions <b>set off</b> nearby cars. Lure the crowd together!',
  '<b>Nitro</b> lets you ram cars into scrap. Drifts and near misses refill it.',
  'Lead <b>chopper bombs</b> onto your chasers.',
  'Asphalt roads give you <b>more grip</b> and speed.',
  'Red <b>barrels</b> explode. Drag the chasers past them.',
  'Pursuers that slam into <b>rocks and mesas</b> wreck themselves.',
  'Spend your cash in the <b>GARAGE</b> on new cars and upgrades.',
];
function gameOver(){
  clearInterval(revIV);
  G.state = 'over'; SDK.gameplayStop(); tip(null); AU.setMusic(0); AU.engineOff(); releaseInput();
  hide('hud'); hideAll(); $('toasts').innerHTML = '';
  commitMissions();
  let cash = Math.floor(G.cashRun + G.score / 400 * cashMul()), extra = '';
  if(G.daily){
    const k = todayKey();
    if(save.daily.key !== k) save.daily = { key:k, best:0, bonus:false };
    save.daily.best = Math.max(save.daily.best, Math.floor(G.score));
    if(!save.daily.bonus){ save.daily.bonus = true; cash += 60; extra = '<div class="oM"><span>Daily run driven</span><b>+$60</b></div>'; }
  }
  save.cash += cash; save.runs++;
  const newBest = G.score > save.best;
  save.best = Math.max(save.best, Math.floor(G.score)); save.bestTime = Math.max(save.bestTime, Math.floor(G.t)); save.bestHeat = Math.max(save.bestHeat, G.heat);
  save.stats.kills += G.kills; save.stats.drift += Math.floor(G.driftDist);
  const xp0 = save.xp, lv0 = save.level;
  save.xp += Math.floor(G.score / 40 + G.kills * 3 + G.t);
  let lvls = 0;
  while(save.xp >= xpNeed(save.level)){ save.xp -= xpNeed(save.level); save.level++; lvls++; save.cash += 40; }
  writeSave();
  $('oTitle').textContent = G.daily ? 'DAILY: ' + G.mod.name : 'WRECKED';
  $('oTag').classList.toggle('hidden', !newBest);
  $('oTime').textContent = mmss(G.t); $('oKills').textContent = fmt(G.kills); $('oChain').textContent = 'x' + G.maxChain; $('oCash').textContent = '+$' + fmt(cash);
  $('oLevel').textContent = save.level;
  const bar = $('oLvlBar'); bar.style.transition = 'none'; bar.style.width = (lvls ? 0 : xp0 / xpNeed(lv0) * 100) + '%'; void bar.offsetWidth;
  bar.style.transition = ''; setTimeout(() => bar.style.width = (save.xp / xpNeed(save.level) * 100) + '%', 60);
  let mh = extra;
  if(lvls) mh += `<div class="oM"><span>LEVEL UP! Now level ${save.level}</span><b>+$${lvls * 40}</b></div>`;
  for(const q of save.missions) if(q.fresh){ mh += `<div class="oM"><span>✔ ${q.txt}</span><b>+$${q.reward}</b></div>`; q.fresh = false; }
  $('oMissions').innerHTML = mh;
  $('oNext').innerHTML = newBest ? 'The desert will remember this one!' : `Best: <b>${fmt(save.best)}</b> · Longest run <b>${mmss(save.bestTime)}</b>`;
  $('oTip').innerHTML = 'TIP: ' + pick(TIPS);
  $('dblBtn').classList.toggle('hidden', !SDK.canRewarded() || cash <= 0); $('dblBtn').disabled = false;
  G.lastCash = cash;
  const el = $('oScore'), t0 = performance.now(), sc = Math.floor(G.score);
  (function tick(){ const k = Math.min(1, (performance.now() - t0) / 900); el.textContent = fmt(sc * (1 - Math.pow(1 - k, 3))); if(k < 1) requestAnimationFrame(tick); })();
  show('over');
  if(newBest){ SDK.happytime(); AU.stinger(5); }
}
function goMenu(){
  G.state = 'menu'; SDK.gameplayStop(); AU.setMusic(0);
  P = null; G.up = {}; G.mod = null; G.chain = 0; G.shake = 0; G.flash = 0; G.tut = false; G.boss = null; G.slow = 0; G.timeScale = 1;
  hideAll(); hide('hud'); tip(null);
  rollMissions(); persist();
  refreshMenu(); show('menu');
}
function refreshMenu(){
  $('mCash').textContent = fmt(save.cash);
  $('mLevel').textContent = save.level;
  $('mLvlBar').style.width = (save.xp / xpNeed(save.level) * 100) + '%';
  $('mBest').textContent = fmt(save.best); $('mTime').textContent = mmss(save.bestTime); $('mKills').textContent = fmt(save.stats.kills);
  const seed = hashStr('scorchway:' + todayKey()), mod = MODS[seed % MODS.length], today = save.daily.key === todayKey();
  $('dailyMod').textContent = mod.name + ': ' + mod.desc + (today && save.daily.best ? ' · BEST ' + fmt(save.daily.best) : !today || !save.daily.bonus ? ' · +$60' : '');
  $('missDot').classList.toggle('hidden', !save.mNew);
}

/* ---------------- garage / missions / settings ---------------- */
let shopTab = 'car';
function renderShop(){
  $('sCash').textContent = fmt(save.cash);
  document.querySelectorAll('#shop .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === shopTab));
  const L = $('shopList'); L.innerHTML = '';
  const buy = c => { if(save.cash < c) return false; save.cash -= c; AU.pick(); persist(); return true; };
  if(shopTab === 'car'){
    for(const c of CARS){
      const own = save.cars.includes(c.id), eq = save.car === c.id;
      const it = document.createElement('div'); it.className = 'item carItem';
      const ii = document.createElement('div'); ii.className = 'ii'; ii.appendChild(carPreview(c)); it.appendChild(ii);
      const t = document.createElement('div'); t.className = 'it';
      t.innerHTML = `<b>${c.name}</b><span>${c.desc}</span><div class="stats"><i>SPD ${Math.round(c.spd * KMH)}</i><i>ARMOR ${c.hp}</i><i>GRIP ${c.grip}</i><i>FIRE ${Math.round(c.fire * 100)}%</i></div>`;
      it.appendChild(t);
      const b = document.createElement('button'); b.className = 'btn'; b.innerHTML = eq ? 'IN USE' : own ? 'DRIVE' : '$' + fmt(c.cost); b.disabled = eq || (!own && save.cash < c.cost);
      onTap(b, () => { if(!own){ if(!buy(c.cost)) return; save.cars.push(c.id); } save.car = c.id; persist(); renderShop(); });
      it.appendChild(b); L.appendChild(it);
    }
  } else {
    for(const m of META){
      const lv = save.meta[m.id] || 0, max = m.costs.length, cost = m.costs[lv];
      const it = document.createElement('div'); it.className = 'item';
      it.innerHTML = `<div class="ii" style="color:#e2582b">${m.icon}</div><div class="it"><b>${m.name}</b><span>${m.desc}</span><div class="pips">${Array.from({ length:max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>`;
      const b = document.createElement('button'); b.className = 'btn'; b.innerHTML = lv >= max ? 'MAX' : '$' + fmt(cost); b.disabled = lv >= max || save.cash < cost;
      onTap(b, () => { if(buy(cost)){ save.meta[m.id] = lv + 1; renderShop(); } });
      it.appendChild(b); L.appendChild(it);
    }
  }
}
function openMissions(){
  hideAll(); save.mNew = false; persist();
  $('missDone').textContent = save.missionsDone;
  const L = $('missList'); L.innerHTML = '';
  for(const m of save.missions){
    const pct = Math.min(100, m.p / m.n * 100);
    L.insertAdjacentHTML('beforeend', `<div class="item${m.done ? ' done' : ''}"><div class="ii" style="color:#2a9d8f">${m.done ? '✔' : '★'}</div><div class="it"><b>${m.txt}</b><span>${m.done ? 'Complete' : fmt(m.p) + ' / ' + fmt(m.n)}</span><div class="mBar"><i style="width:${pct}%"></i></div></div><div class="pill">$<b>${m.reward}</b></div></div>`);
  }
  show('missions');
}
let setBack = 'menu';
function openSettings(from){ setBack = from; hideAll(); syncSettings(); show('settings'); }
function syncSettings(){
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.checked = !!save.opt[i.dataset.opt]);
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === save.opt[s.dataset.opt])));
}
function applyQuality(){ G.q = save.opt.quality === 'auto' ? (G.autoQ || 'high') : save.opt.quality; resize(); }
function askConfirm(msg, yes){
  $('cfMsg').textContent = msg; show('confirm');
  $('cfYes').onclick = e => { e.stopPropagation(); hide('confirm'); yes(); };
  $('cfNo').onclick = e => { e.stopPropagation(); hide('confirm'); };
}

/* ---------------- wiring ---------------- */
function wire(){
  document.body.classList.toggle('touch', isTouch());
  if(isTouch()) $('keysHint').textContent = 'Drag anywhere to steer (turn hard to drift) · Hold NITRO to boost · Hold DRIFT to slide';
  onTap('playBtn', () => startRun(false));
  onTap('dailyBtn', () => startRun(true));
  onTap('shopBtn', () => { hideAll(); renderShop(); show('shop'); });
  onTap('missBtn', openMissions);
  onTap('setBtn', () => openSettings('menu'));
  onTap('pauseBtn', pauseGame);
  onTap('resumeBtn', resumeGame);
  onTap('pSetBtn', () => openSettings('pause'));
  onTap('quitBtn', () => askConfirm('End this run? You keep your cash.', () => { hide('pause'); gameOver(); }));
  onTap('revAdBtn', () => SDK.rewarded(ok => { if(ok) doRevive(); else toast('AD UNAVAILABLE', 'Try again in a moment.', '#b3262d'); }));
  onTap('revPayBtn', () => { const fr = Math.min(G.cashRun, REVIVE_COST); G.cashRun -= fr; save.cash -= REVIVE_COST - fr; doRevive(); });
  onTap('revNoBtn', () => { clearInterval(revIV); hide('revive'); gameOver(); });
  onTap('retryBtn', () => { const d = G.daily; SDK.midgame(() => startRun(d)); });
  onTap('oMenuBtn', () => SDK.midgame(goMenu));
  onTap('dblBtn', () => { $('dblBtn').disabled = true; SDK.rewarded(ok => { if(ok){ save.cash += G.lastCash; writeSave(); $('oCash').textContent = '+$' + fmt(G.lastCash * 2); } else $('dblBtn').disabled = false; }); });
  document.querySelectorAll('.backBtn').forEach(b => onTap(b, () => {
    const inSettings = !$('settings').classList.contains('hidden');
    hideAll();
    if(inSettings && setBack === 'pause'){ show('pause'); return; }
    refreshMenu(); show('menu');
  }));
  document.querySelectorAll('#shop .tab').forEach(t => onTap(t, () => { shopTab = t.dataset.tab; renderShop(); }));
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.addEventListener('change', () => { save.opt[i.dataset.opt] = i.checked; AU.apply(); persist(); }));
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => onTap(b, () => { save.opt[s.dataset.opt] = b.dataset.v; persist(); syncSettings(); if(s.dataset.opt === 'quality') applyQuality(); })));
  onTap('replayTut', () => { save.tut = false; persist(); toast('TUTORIAL', 'It will play at the start of your next run.', '#2a9d8f'); });

  // mouse: steer toward the cursor, hold left = nitro, hold right = handbrake.
  // touch: drag anywhere = steering direction; NITRO and DRIFT buttons.
  cv.addEventListener('pointerdown', e => {
    AU.init(); AU.resume();
    if(G.state !== 'play') return;
    e.preventDefault();
    if(e.pointerType === 'mouse'){ IN.mouse = true; IN.mx = e.clientX; IN.my = e.clientY; if(e.button === 2) IN.brake = true; else IN.nitro = true; return; }
    if(!IN.joy || !IN.joy.on){ IN.joy = { on:true, id:e.pointerId, ox:e.clientX, oy:e.clientY, x:e.clientX, y:e.clientY }; try{ cv.setPointerCapture(e.pointerId); }catch(_){} }
  });
  addEventListener('pointermove', e => {
    if(e.pointerType === 'mouse'){ IN.mouse = true; IN.mx = e.clientX; IN.my = e.clientY; return; }
    const j = IN.joy;
    if(j && j.on && e.pointerId === j.id){
      j.x = e.clientX; j.y = e.clientY;
      // the stick follows your thumb so it never runs out of room
      const dx = j.x - j.ox, dy = j.y - j.oy, l = Math.hypot(dx, dy);
      if(l > 70){ j.ox = j.x - dx / l * 70; j.oy = j.y - dy / l * 70; }
    }
  }, { passive:true });
  const up = e => {
    if(e.pointerType === 'mouse'){ if(e.button === 2) IN.brake = false; else IN.nitro = false; return; }
    if(IN.joy && e.pointerId === IN.joy.id) IN.joy.on = false;
    if(e.pointerId === IN.nitroId){ IN.nitro = false; IN.nitroId = null; }
    if(e.pointerId === IN.brakeId){ IN.brake = false; IN.brakeId = null; }
  };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  $('nitroBtn').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); AU.init(); IN.nitro = true; IN.nitroId = e.pointerId; });
  $('driftBtn').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); AU.init(); IN.brake = true; IN.brakeId = e.pointerId; });
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('pointerdown', () => { AU.init(); AU.resume(); }, { capture:true });
  addEventListener('keydown', e => {
    AU.init(); AU.resume();
    const k = e.key.toLowerCase();
    if([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(k)) e.preventDefault();
    IN.keys[k] = true;
    if(e.repeat) return;
    if(k === 'escape' || k === 'p'){
      if(G.state === 'play') pauseGame();
      else if(G.state === 'pause' && $('settings').classList.contains('hidden') && $('confirm').classList.contains('hidden')) resumeGame();
      return;
    }
    if(G.state === 'cards' && ['1', '2', '3'].includes(k)) pickCard(+k - 1);
    else if(G.state === 'over' && k === 'enter') $('retryBtn').click();
    else if(G.state === 'menu' && !$('menu').classList.contains('hidden') && (k === 'enter' || k === ' ')) $('playBtn').click();
  });
  addEventListener('keyup', e => { IN.keys[e.key.toLowerCase()] = false; });
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 200));
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ if(G.state === 'play') pauseGame(); } else AU.resume(); });
  addEventListener('blur', () => { releaseInput(); if(G.state === 'play') pauseGame(); });
}

/* ---------------- loop ---------------- */
let last = 0, pfT = 0, pfN = 0, pfSum = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > .05) dt = .05;
  if(save.opt.quality === 'auto' && G.state === 'play'){
    pfSum += dt; pfN++; pfT += dt;
    if(pfT > 3){ const avg = pfSum / pfN; pfT = pfSum = pfN = 0; if(avg > 1 / 40 && G.q !== 'low'){ G.autoQ = 'low'; G.q = 'low'; resize(); } }
  }
  try{
    if(G.state === 'play' || G.state === 'dying') update(dt);
    else if(G.state === 'menu') menuTick(dt);
    else G.rt += dt;
    if(P) render();
    if(G.state === 'play' || G.state === 'dying') updateHUD();
  }catch(err){ console.error(err); }
}
addEventListener('error', e => { try{ console.error(e.error || e.message); }catch(_){} });
addEventListener('unhandledrejection', e => { try{ e.preventDefault(); console.error(e.reason); }catch(_){} });

(async function boot(){
  G.q = 'high';
  resize();
  requestAnimationFrame(frame);
  SDK.onMute = m => AU.setPortalMute(m);
  await SDK.init();              // must resolve before the save is read (SDK Data Module)
  SDK.loadingStart();
  loadSave();
  applyQuality();
  wire();
  goMenu();
  SDK.loadingStop();
  $('boot').classList.add('gone'); setTimeout(() => $('boot').remove(), 500);
})();
