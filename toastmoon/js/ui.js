'use strict';
/* Input, HUD, screens, flow and boot. */
let playing = false;
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }

const UI = {
  touch: matchMedia('(pointer:coarse)').matches,
  tab: 'up',
  banner(a, b, col){
    const el = $('banner'); el.querySelector('b').textContent = a; el.querySelector('b').style.color = col || '#fff';
    el.querySelector('small').textContent = b || '';
    el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden');
    clearTimeout(this.banT); this.banT = setTimeout(() => el.classList.add('hidden'), 2300);
  },
  toast(txt){ const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = txt; $('toasts').appendChild(d); setTimeout(() => d.remove(), 2400); },
  onLaunch(){
    hide('aimUi'); hideTut(); show('hud'); beginPlay(); AU.setStyle('play');
    if(this.touch) show('jetBtn');
    if(save.tut < 2) setTimeout(() => { if(G.state === 'fly') showTut('fly'); }, 500);
  },
  zone(z){ AU.zone(); this.banner(ZONES[z].name, z === 5 ? 'Look, stars!' : fmt(ZONES[z].at) + ' m', '#ffe9b0'); },
  moon(){
    AU.moon(); SDK.happytime();
    save.moon++; const prize = save.moon === 1 ? 5000 : 1500;
    save.coins += prize;
    if(save.moon === 1){ save.own.golden = 1; }
    persist();
    $('moonPrize').textContent = '+' + fmt(prize) + (save.moon === 1 ? ' + GOLDEN TOAST' : '');
    endPlay(); G.statePrev = G.state; G.state = 'pausedMoon'; show('moonWin');
  },
  runOver(){ runOver(); }
};
const SCREENS = ['results', 'shop', 'missions', 'settings', 'pause', 'login', 'moonWin'];
function anyScreen(){ return SCREENS.some(id => !$(id).classList.contains('hidden')); }
function closeScreens(){ SCREENS.forEach(hide); }
let backTo = null;
function openScreen(id, from){ backTo = from || null; SCREENS.forEach(s => s !== id && hide(s)); show(id); }

/* ---------------- tutorial (in gameplay, visual, skippable) ---------------- */
function showTut(kind){
  const el = $('tut');
  el.innerHTML = kind === 'aim'
    ? `<span class="hand">${UI.touch ? '👆' : '🖱️'}</span>TAP when the arrow is at the <b style="color:#ffd23a">★ TOP</b><br>for a PERFECT launch!<br><button id="tutX">SKIP ✕</button>`
    : `<span class="hand">${UI.touch ? '👆' : '🖱️'}</span>${UI.touch ? 'DRAG' : 'MOVE THE MOUSE'} to steer into <b style="color:#ff8ad8">balloons</b> and <b style="color:#5ac8ff">birds</b><br>${UI.touch ? 'Hold 🍓' : 'HOLD the button or SPACE'} to fire <b style="color:#ff5a6a">jam jets</b><br><button id="tutX">SKIP ✕</button>`;
  $('tutX').addEventListener('pointerdown', e => { e.stopPropagation(); hideTut(); save.tut = 2; persist(); });
  show('tut');
  clearTimeout(showTut.t); if(kind === 'fly') showTut.t = setTimeout(hideTut, 6000);
}
function hideTut(){ hide('tut'); }

/* ---------------- flow ---------------- */
function toAimScreen(){
  closeScreens(); endPlay();
  toAim();
  hide('hud'); hide('jetBtn'); show('aimUi');
  AU.setStyle('title');
  refreshAim();
  if(save.tut < 1) showTut('aim');
}
function refreshAim(){
  $('aCoins').textContent = fmt(save.coins);
  $('aBest').textContent = save.best ? 'BEST ' + fmt(save.best) + ' m' : 'FIRST FLIGHT!';
  const bv = bakeValue();
  $('bakeBtn').classList.toggle('hidden', !save.runs);
  $('bakeVal').textContent = bv ? '+' + fmt(bv) : 'baking… ' + hhmm(36e5 / bakeRate() * 10);
  $('bakeBtn').disabled = bv < 1;
  $('upBadge').classList.toggle('hidden', !UPS.some(u => save.up[u.id] < u.max && upCost(u, save.up[u.id]) <= save.coins));
  $('miBadge').classList.toggle('hidden', !save.missions.some(m => m.done && !m.claimed));
}
function runOver(){
  endPlay(); hide('jetBtn'); hideTut();
  const R = G.run, earn = runEarnings();
  const prevBest = save.best, newBest = R.peak > prevBest + .5;
  save.coins += earn; save.runs++;
  save.stats.runs++; save.stats.balloons += R.balloons; save.stats.birds += R.birds; save.stats.coins += earn;
  if(newBest) save.best = Math.floor(R.peak);
  if(!save.bakeT) save.bakeT = Date.now();
  if(save.tut < 2) save.tut = 2;
  missionTick({ alt:Math.floor(R.peak), chain:R.hits });
  persist();
  G.lastEarn = earn;
  $('rBest').classList.toggle('hidden', !newBest || prevBest < 1);
  $('rAlt').textContent = fmt(R.peak) + ' m';
  const z = zoneAt(R.peak), nz = ZONES[z + 1];
  $('rZone').textContent = ZONES[z].name + (nz ? ' · next: ' + nz.name + ' at ' + fmt(nz.at) + ' m' : '');
  const pct = Math.min(100, save.best / MOON * 100);
  $('rMoonTxt').textContent = save.moon ? `You've reached the Moon ${save.moon}×! Best ${fmt(save.best)} m` : `${pct < 1 ? pct.toFixed(1) : Math.floor(pct)}% of the way to the Moon`;
  setTimeout(() => $('rMoon').querySelector('i').style.width = pct + '%', 50);
  $('rCoins').textContent = '+' + fmt(earn);
  $('rDouble').classList.toggle('hidden', !SDK.canRewarded()); $('rDouble').disabled = false;
  renderUps($('rUps'), true);
  $('rMiss').innerHTML = save.missions.map(m => `<div class="${m.done ? 'done' : ''}"><span>${m.done ? '✅' : '🎯'} ${MISSION_POOL.find(p => p.id === m.id).txt(m.n)}</span><b>${fmt(Math.min(m.prog, m.n))}/${fmt(m.n)}</b></div>`).join('');
  newBest && prevBest >= 1 ? AU.record() : AU.over();
  if(newBest && prevBest >= 1) SDK.happytime();
  openScreen('results');
}

/* ---------------- upgrades, breads, missions ---------------- */
function renderUps(box, compact){
  box.innerHTML = '';
  for(const u of UPS){
    const l = save.up[u.id], max = l >= u.max, cost = upCost(u, l);
    const d = document.createElement('div'); d.className = 'row2';
    const pips = compact ? '' : `<div class="lv">${Array.from({ length:u.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div>`;
    d.innerHTML = `<div class="ic">${u.icon}</div><div class="tx">${u.name} <small>${u.desc} · LV ${l}${max ? ' MAX' : ''}</small>${pips}</div><button>${max ? 'MAX' : '🪙 ' + fmt(cost)}</button>`;
    const b = d.querySelector('button'); b.disabled = max || save.coins < cost;
    b.onclick = e => { e.stopPropagation(); if(max || save.coins < cost) return; save.coins -= cost; save.up[u.id]++; persist(); AU.buy(); burstUi(b); renderUps(box, compact); if(box.id === 'sList') $('sCoins').textContent = fmt(save.coins); };
    box.appendChild(d);
  }
}
function burstUi(el){ el.animate([{ transform:'scale(1.25)' }, { transform:'scale(1)' }], { duration:220 }); }
function breadIcon(b){
  const cv = document.createElement('canvas'); cv.width = cv.height = 92; const c = cv.getContext('2d');
  try{ drawToast(c, 46, 50, 1.25, 0, { vx:0, vy:-200, rot:0, squash:0 }, false, b); }catch(e){}
  return cv;
}
function renderShop(){
  $('sCoins').textContent = fmt(save.coins);
  document.querySelectorAll('#shop .tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.tab));
  const L = $('sList');
  if(UI.tab === 'up'){ renderUps(L, false); return; }
  L.innerHTML = '';
  for(const b of BREADS){
    const own = !!save.own[b.id], eq = save.bread === b.id;
    const d = document.createElement('div'); d.className = 'row2';
    const ic = document.createElement('div'); ic.className = 'ic'; ic.appendChild(breadIcon(b)); d.appendChild(ic);
    const tx = document.createElement('div'); tx.className = 'tx'; tx.innerHTML = `${b.name}<small>${b.bonus || 'The classic.'}${b.id === 'golden' && !own ? ' · or reach the Moon' : ''}</small>`; d.appendChild(tx);
    const bt = document.createElement('button'); bt.textContent = eq ? 'WEARING' : own ? 'WEAR' : '🪙 ' + fmt(b.price); if(eq) bt.className = 'eq';
    bt.disabled = eq || (!own && save.coins < b.price);
    bt.onclick = e => { e.stopPropagation(); if(!own){ if(save.coins < b.price) return; save.coins -= b.price; save.own[b.id] = 1; AU.buy(); } else AU.click(); save.bread = b.id; persist(); renderShop(); };
    d.appendChild(bt); L.appendChild(d);
  }
}
function renderMissions(){
  const L = $('mList'); L.innerHTML = '';
  for(const m of save.missions){
    const p = MISSION_POOL.find(x => x.id === m.id), d = document.createElement('div'); d.className = 'row2' + (m.done ? ' done' : '');
    d.innerHTML = `<div class="ic">🎯</div><div class="tx">${p.txt(m.n)}<div class="bar"><i style="width:${Math.min(100, m.prog / m.n * 100)}%"></i></div><small>${fmt(Math.min(m.prog, m.n))} / ${fmt(m.n)}</small></div><button>${m.done ? 'CLAIM' : '🪙 ' + fmt(m.rw)}</button>`;
    const b = d.querySelector('button'); b.disabled = !m.done;
    b.onclick = e => { e.stopPropagation(); if(!m.done) return; m.claimed = true; save.coins += m.rw; AU.buy(); UI.toast('Mission complete! 🪙 ' + fmt(m.rw)); fillMissions(); persist(); renderMissions(); refreshAim(); };
    L.appendChild(d);
  }
}
function renderSettings(){ document.querySelectorAll('.setRow').forEach(r => { const v = save.opt[r.dataset.opt], b = r.querySelector('b'); b.textContent = v ? 'ON' : 'OFF'; b.classList.toggle('off', !v); }); }

/* ---------------- daily reward + bakery ---------------- */
function checkLogin(){
  const k = todayKey(); if(save.login.key === k) return false;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  G.loginDay = save.login.key === y ? (save.login.day % 7) + 1 : 1;
  const row = $('loginRow'); row.innerHTML = '';
  LOGIN.forEach((v, i) => row.insertAdjacentHTML('beforeend', `<div class="${i + 1 < G.loginDay ? 'got' : i + 1 === G.loginDay ? 'today' : ''}"><small>DAY ${i + 1}</small>🪙${fmt(v)}</div>`));
  openScreen('login'); return true;
}
function claimLogin(){ const v = LOGIN[G.loginDay - 1]; save.login = { key:todayKey(), day:G.loginDay }; save.coins += v; persist(); AU.buy(); closeScreens(); refreshAim(); UI.toast('Daily reward: 🪙 ' + fmt(v)); }
function claimBake(){ const v = bakeValue(); if(v < 1) return; save.coins += v; save.bakeT = Date.now(); persist(); AU.buy(); refreshAim(); UI.toast('🥐 The bakery earned 🪙 ' + fmt(v) + ' while you were away'); }

/* ---------------- pause ---------------- */
function pauseGame(){ if(G.state !== 'fly') return; G.state = 'paused'; G.jet = false; endPlay(); openScreen('pause'); }
function resumeGame(){ closeScreens(); if(G.state === 'paused'){ G.state = 'fly'; beginPlay(); } }

/* ---------------- input ---------------- */
const K = {};
let touchId = null;
function worldX(clientX){ return ((clientX - R.colX) / R.s); }
function syncKeys(){
  G.inX = ((K.ArrowRight || K.KeyD) ? 1 : 0) - ((K.ArrowLeft || K.KeyA) ? 1 : 0);
  if(G.inX) G.steerX = null;
  G.jet = !!(K.Space || K.ArrowUp || K.KeyW) || G.mouseJet || G.btnJet;
}
function wire(){
  const cv = R.cv;
  cv.addEventListener('pointerdown', e => {
    AU.init();
    if(SDK.adBusy || anyScreen()) return;
    if(G.state === 'aim'){ launch(); return; }
    if(G.state !== 'fly') return;
    if(e.pointerType === 'mouse'){ G.mouseJet = true; syncKeys(); return; }
    touchId = e.pointerId; try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    G.steerX = worldX(e.clientX);
  });
  addEventListener('pointermove', e => {
    if(G.state !== 'fly') return;
    if(e.pointerType === 'mouse' || e.pointerId === touchId){ const wx = worldX(e.clientX); G.steerX = ((wx % WORLD_W) + WORLD_W) % WORLD_W; }
  });
  const up = e => { if(e.pointerType === 'mouse'){ G.mouseJet = false; syncKeys(); } if(e.pointerId === touchId){ touchId = null; G.steerX = null; } };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  const jb = $('jetBtn');
  jb.addEventListener('pointerdown', e => { e.stopPropagation(); G.btnJet = true; jb.classList.add('on'); syncKeys(); });
  const jup = () => { G.btnJet = false; jb.classList.remove('on'); syncKeys(); };
  jb.addEventListener('pointerup', jup); jb.addEventListener('pointercancel', jup); jb.addEventListener('pointerleave', jup);
  addEventListener('keydown', e => {
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if(SDK.adBusy) return;
    AU.init();
    if(e.repeat){ K[e.code] = true; return; }
    // Escape is reserved by the browser (it exits fullscreen), so pause is on P
    if(e.code === 'KeyP'){ if(G.state === 'paused') resumeGame(); else pauseGame(); return; }
    if(!$('results').classList.contains('hidden') && (e.code === 'Space' || e.code === 'Enter')){ $('rLaunch').click(); return; }
    if(G.state === 'aim' && !anyScreen() && (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp' || e.code === 'KeyW')){ launch(); return; }
    K[e.code] = true; syncKeys();
  });
  addEventListener('keyup', e => { K[e.code] = false; syncKeys(); });
  addEventListener('blur', () => { for(const k in K) K[k] = false; G.mouseJet = G.btnJet = false; syncKeys(); pauseGame(); });
  document.addEventListener('contextmenu', e => e.preventDefault());

  const tap = (id, fn) => $(id).addEventListener('click', e => { e.stopPropagation(); if(SDK.adBusy) return; AU.init(); AU.click(); fn(e); });
  tap('rLaunch', () => SDK.midgame(toAimScreen));
  tap('rDouble', () => { $('rDouble').disabled = true; SDK.rewarded(ok => { if(!ok){ $('rDouble').disabled = false; return; } save.coins += G.lastEarn; persist(); $('rCoins').textContent = '+' + fmt(G.lastEarn * 2); $('rDouble').classList.add('hidden'); renderUps($('rUps'), true); }); });
  tap('upBtn', () => { UI.tab = 'up'; renderShop(); openScreen('shop'); });
  tap('breadBtn', () => { UI.tab = 'bread'; renderShop(); openScreen('shop'); });
  tap('miBtn', () => { renderMissions(); openScreen('missions'); });
  tap('setBtn', () => { renderSettings(); openScreen('settings'); });
  tap('bakeBtn', claimBake);
  tap('loginBtn', claimLogin);
  tap('pauseBtn', pauseGame);
  tap('pResume', resumeGame);
  tap('pQuit', () => { closeScreens(); if(G.state === 'paused'){ G.state = 'done'; runOver(); } });
  tap('moonOk', () => { hide('moonWin'); G.state = 'fly'; beginPlay(); });
  document.querySelectorAll('#shop .tabs button').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); AU.click(); UI.tab = b.dataset.tab; renderShop(); }));
  document.querySelectorAll('.back').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); AU.click(); hide(b.closest('.screen').id); if(backTo){ show(backTo); backTo = null; } refreshAim(); }));
  document.querySelectorAll('.setRow').forEach(r => r.addEventListener('click', e => { e.stopPropagation(); const k = r.dataset.opt; save.opt[k] = !save.opt[k]; persist(); AU.apply(); AU.click(); renderSettings(); }));
  document.querySelectorAll('.screen, #aimUi button, #hud button').forEach(el => el.addEventListener('pointerdown', e => e.stopPropagation()));
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ persist(); pauseGame(); } else AU.resume(); });
  SDK.onMute = m => AU.setPortalMute(m);
}

/* ---------------- HUD ---------------- */
let hudK = '';
function updateHUD(){
  if(G.state !== 'fly' && G.state !== 'land') return;
  const T = G.T, m = altM(T.y), z = zoneAt(m);
  const k = [Math.floor(m), z, Math.floor(G.run.coins), Math.round(G.fuel / G.fuelMax * 50)].join();
  if(k === hudK) return; hudK = k;
  $('altTxt').textContent = fmt(m) + ' m';
  $('zoneTxt').textContent = ZONES[z].name;
  $('runCoins').textContent = fmt(G.run.coins);
  $('fuelBar').firstElementChild.style.width = (G.fuel / G.fuelMax * 100) + '%';
  const f = Math.min(1, m / MOON), bf = Math.min(1, save.best / MOON);
  $('moonBar').querySelector('i').style.height = (Math.sqrt(f) * 100) + '%';
  $('moonBar').querySelector('b').style.bottom = (Math.sqrt(bf) * 100) + '%';
}

/* ---------------- loop + boot ---------------- */
let last = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > .05) dt = .05;
  try{ if(G.state !== 'paused' && G.state !== 'pausedMoon') update(dt); R.draw(dt); updateHUD(); }catch(err){ console.error(err); }
}
(async () => {
  R.init();
  await SDK.init();
  SDK.loadingStart();
  loadSave();
  wire();
  if(!save.bakeT && save.runs) save.bakeT = Date.now();
  toAimScreen();
  requestAnimationFrame(frame);
  SDK.loadingStop();
  const b = $('boot'); b.style.opacity = '0'; setTimeout(() => b.remove(), 450);
  if(save.runs) setTimeout(checkLogin, 500); else { save.login = { key:todayKey(), day:1 }; persist(); }
})();
