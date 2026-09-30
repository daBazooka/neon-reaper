'use strict';
/* Input, HUD, menus and boot. */
let playing = false;
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }

const UI = {
  touch: matchMedia('(pointer:coarse)').matches,
  shopTab: 'ball', lastCombo: 0,
  banner(a, b, col){
    const el = $('banner');
    el.querySelector('b').textContent = a; el.querySelector('b').style.color = col || '#fff';
    el.querySelector('small').textContent = b || '';
    el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden');
    clearTimeout(this.banT); this.banT = setTimeout(() => el.classList.add('hidden'), 1900);
  },
  tip(txt, ms){
    const el = $('tip'); el.textContent = txt;
    el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden');
    clearTimeout(this.tipT); this.tipT = setTimeout(() => el.classList.add('hidden'), ms || 4000);
  },
  toast(txt){ const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = txt; $('toasts').appendChild(d); setTimeout(() => d.remove(), 1900); },
  gameOver(){ gameOver(); }
};

const SCREENS = ['over', 'shop', 'missions', 'settings', 'pause'];
function anyScreen(){ return SCREENS.some(id => !$(id).classList.contains('hidden')); }
function closeScreens(){ SCREENS.forEach(hide); }
let backTo = null;
function openScreen(id, from){ backTo = from || null; SCREENS.forEach(s => s !== id && hide(s)); show(id); }

/* ---------------- flow ---------------- */
function toTitle(){
  endPlay(); closeScreens();
  newRun(true); G.state = 'title';
  AU.setStyle('title');
  hide('hud'); hide('tip'); hide('banner'); show('title');
  refreshTitle();
}
function refreshTitle(){
  $('tCoins').textContent = save.coins;
  $('tBest').textContent = save.best ? '🏆 ' + Math.floor(save.best) + ' m' : '✏️ First climb!';
  $('tHint').textContent = UI.touch ? 'Draw with your finger to bounce the ball' : 'Draw with the mouse · or ← ↓ → for quick lines';
  const can = PERKS.some(p => save.perk[p.id] < p.max && perkCost(p, save.perk[p.id]) <= save.coins) || BALLS.some(b => !save.own[b.id] && b.price <= save.coins);
  $('shopBadge').classList.toggle('hidden', !can);
  $('miBadge').classList.toggle('hidden', !save.missions.some(m => m.done && !m.claimed));
}
function play(){
  closeScreens(); hide('title');
  SDK.midgame(() => {
    newRun(false); G.state = 'play';
    AU.setStyle('play');
    show('hud');
    beginPlay();
    if(!save.tut){ UI.tip(UI.touch ? '✏️ Draw a line under the ball to bounce it!' : '✏️ Draw a line under the ball to bounce it!', 5000); }
    else UI.banner('CLIMB!', 'The ink flood is rising!', '#3aa0ff');
  });
}
function gameOver(){
  endPlay();
  const r = G.run, coins = runCoins();
  save.coins += coins; save.runs++;
  const newBest = r.depth > save.best;
  if(newBest) save.best = r.depth;
  missionTick(r); persist();
  $('oTitle').textContent = newBest && save.runs > 1 ? '🏆 NEW BEST!' : pick(['INKED!', 'SPLAT!', 'SCRIBBLED OUT!', 'OOPS!']);
  $('oDepth').textContent = Math.floor(r.depth) + ' m';
  $('oBest').textContent = 'Best: ' + Math.floor(save.best) + ' m';
  $('oStats').innerHTML = [['⭐ Stars', r.stars], ['🏅 Score', r.score], ['🎵 Best combo', 'x' + r.maxCombo], ['🔁 Bounces', r.bounce], ['🃏 Cards', r.cards], ['💥 Smashed', r.smash]].map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join('');
  $('oCoins').textContent = '+' + coins;
  G.lastCoins = coins;
  const canRev = !G.revived && (save.perk.revive > 0 || SDK.canRewarded());
  $('oRevive').classList.toggle('hidden', !canRev);
  $('oRevive').textContent = save.perk.revive > 0 ? '💖 REVIVE (free)' : '▶ REVIVE';
  $('oDouble').classList.toggle('hidden', !SDK.canRewarded());
  $('oMiss').innerHTML = save.missions.map(m => `<div class="${m.done ? 'done' : ''}">${m.done ? '✅' : '🎯'} ${MISSION_POOL.find(p => p.id === m.id).txt(m.n)} <b>${Math.min(m.prog, m.n)}/${m.n}</b></div>`).join('');
  if(!save.tut){ save.tut = 1; persist(); }
  AU.over();
  openScreen('over');
}
function doRevive(){
  const go = () => {
    // the coins of this run were already banked; take them back so the run can finish properly
    save.coins -= G.lastCoins; save.runs--; persist();
    closeScreens(); revive(); beginPlay();
  };
  if(save.perk.revive > 0){ go(); return; }
  SDK.rewarded(ok => { if(ok) go(); });
}

/* ---------------- shop / missions / settings ---------------- */
function buildShop(){
  $('sCoins').textContent = save.coins;
  const g = $('sGrid'); g.innerHTML = '';
  document.querySelectorAll('#shop .tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.shopTab));
  if(UI.shopTab === 'perk'){
    g.style.display = 'flex'; g.style.flexDirection = 'column'; g.style.gap = '8px';
    for(const p of PERKS){
      const l = save.perk[p.id], max = l >= p.max, cost = perkCost(p, l);
      const d = document.createElement('div'); d.className = 'row';
      d.innerHTML = `<div class="ic">${p.icon}</div><div class="tx">${p.name} <small>${p.desc} · level ${l}/${p.max}</small></div><button>${max ? 'MAX' : '<span class="coin">' + cost + '</span>'}</button>`;
      const b = d.querySelector('button'); b.disabled = max || save.coins < cost;
      b.onclick = () => { if(max || save.coins < cost) return; save.coins -= cost; save.perk[p.id]++; persist(); AU.buy(); buildShop(); refreshTitle(); };
      g.appendChild(d);
    }
    return;
  }
  g.style.display = ''; g.style.flexDirection = ''; g.style.gap = '';
  const list = UI.shopTab === 'ball' ? BALLS : INKS;
  for(const it of list){
    const own = !!save.own[it.id], eq = (UI.shopTab === 'ball' ? save.ball : save.ink) === it.id;
    const b = document.createElement('button'); b.className = eq ? 'eq' : '';
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
    if(UI.shopTab === 'ball') drawBall(c, it.id, 64, 60, 38, 0.4, 1);
    else{ c.lineCap = 'round'; c.lineWidth = 16; c.strokeStyle = it.c === 'rainbow' ? (() => { const gr = c.createLinearGradient(10, 0, 118, 0); ['#ff4f5a', '#ffd23a', '#4dffb0', '#3aa0ff', '#b56bff'].forEach((col, i) => gr.addColorStop(i / 4, col)); return gr; })() : (it.c || '#2b2a4a'); c.beginPath(); c.moveTo(16, 84); c.quadraticCurveTo(64, 20, 112, 70); c.stroke(); }
    b.appendChild(cv);
    const n = document.createElement('div'); n.textContent = it.name; b.appendChild(n);
    const p = document.createElement('div'); p.className = own ? '' : 'price coin'; p.textContent = eq ? 'EQUIPPED' : own ? 'OWNED' : it.price; b.appendChild(p);
    b.onclick = () => {
      if(!own){ if(save.coins < it.price){ AU.lose1(); UI.toast('Need more coins!'); return; } save.coins -= it.price; save.own[it.id] = 1; AU.buy(); }
      else AU.click();
      if(UI.shopTab === 'ball') save.ball = it.id; else save.ink = it.id;
      persist(); buildShop(); refreshTitle();
    };
    g.appendChild(b);
  }
}
function buildMissions(){
  const l = $('mList'); l.innerHTML = '';
  for(const m of save.missions){
    const p = MISSION_POOL.find(x => x.id === m.id);
    const d = document.createElement('div'); d.className = 'row';
    d.innerHTML = `<div class="ic">🎯</div><div class="tx">${p.txt(m.n)}<div class="bar"><i style="width:${Math.min(100, m.prog / m.n * 100)}%"></i></div><small>${Math.min(m.prog, m.n)} / ${m.n}</small></div><button>${m.done ? 'CLAIM' : '<span class="coin">' + m.rw + '</span>'}</button>`;
    const b = d.querySelector('button'); b.disabled = !m.done;
    b.onclick = () => { if(!m.done) return; m.claimed = true; save.coins += m.rw; AU.buy(); UI.toast(`Mission complete! <span class="coin">${m.rw}</span>`); fillMissions(); persist(); buildMissions(); refreshTitle(); };
    l.appendChild(d);
  }
  $('mStats').textContent = `Best: ${Math.floor(save.best)} m · Stars: ${save.stats.stars} · Bounces: ${save.stats.bounce}`;
}
function buildSettings(){
  document.querySelectorAll('.setRow').forEach(r => { const v = save.opt[r.dataset.opt], b = r.querySelector('b'); b.textContent = v ? 'ON' : 'OFF'; b.classList.toggle('off', !v); });
}

/* ---------------- pause ---------------- */
function pauseGame(){ if(G.state !== 'play') return; G.state = 'pause'; strokeEnd(); endPlay(); openScreen('pause'); }
function resumeGame(){ closeScreens(); if(G.state === 'pause'){ G.state = 'play'; beginPlay(); } }

/* ---------------- input ---------------- */
let ptr = null;
function quickLine(dir){
  if(G.state !== 'play') return;
  const b = mainBall(); if(!b) return;
  const a = dir * 0.55, half = 80, ly = b.y + 70 + Math.max(0, b.vy) * 0.1;
  strokeStart(b.x - Math.cos(a) * half, ly - Math.sin(a) * half);
  for(let k = 1; k <= 8; k++) strokeMove(b.x - Math.cos(a) * half + Math.cos(a) * half * 2 * k / 8, ly - Math.sin(a) * half + Math.sin(a) * half * 2 * k / 8);
  strokeEnd();
}
function wire(){
  const cv = R.cv;
  cv.addEventListener('pointerdown', e => {
    AU.init();
    if(SDK.adBusy || anyScreen() || G.state !== 'play' || ptr !== null) return;
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    ptr = e.pointerId;
    const w = R.toWorld(e.clientX, e.clientY); strokeStart(w.x, w.y);
  });
  cv.addEventListener('pointermove', e => {
    if(e.pointerId !== ptr || SDK.adBusy) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for(const ev of evs){ const w = R.toWorld(ev.clientX, ev.clientY); strokeMove(w.x, w.y); }
  });
  const up = e => { if(e.pointerId !== ptr) return; ptr = null; strokeEnd(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  addEventListener('keydown', e => {
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if(SDK.adBusy) return;
    AU.init();
    if(e.repeat) return;
    if(e.code === 'Escape' || e.code === 'KeyP'){ if(G.state === 'pause') resumeGame(); else if(G.state === 'play') pauseGame(); else if(anyScreen() && G.state === 'title') closeScreens(); return; }
    if(G.state === 'title' && !anyScreen() && (e.code === 'Space' || e.code === 'Enter')){ play(); return; }
    if(!$('over').classList.contains('hidden') && (e.code === 'Space' || e.code === 'Enter')){ $('oAgain').click(); return; }
    if(e.code === 'ArrowLeft' || e.code === 'KeyA') quickLine(1);
    if(e.code === 'ArrowRight' || e.code === 'KeyD') quickLine(-1);
    if(e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'Space') quickLine(0);
  });
  document.addEventListener('contextmenu', e => e.preventDefault());

  const tap = (id, fn) => $(id).addEventListener('click', e => { if(SDK.adBusy) return; AU.init(); AU.click(); fn(e); });
  tap('playBtn', play);
  tap('bShop', () => { buildShop(); openScreen('shop'); });
  tap('bMi', () => { buildMissions(); openScreen('missions'); });
  tap('bSet', () => { buildSettings(); openScreen('settings'); });
  tap('pauseBtn', pauseGame);
  tap('pResume', resumeGame);
  tap('pSet', () => { buildSettings(); openScreen('settings', 'pause'); });
  tap('pQuit', () => { closeScreens(); G.state = 'play'; for(const b of G.balls) b.dead = true; allDead(); });
  tap('oHome', toTitle);
  tap('oShop', () => { buildShop(); openScreen('shop', 'over'); });
  tap('oAgain', play);
  tap('oRevive', doRevive);
  tap('oDouble', () => { $('oDouble').disabled = true; SDK.rewarded(ok => { if(!ok) return; save.coins += G.lastCoins; persist(); $('oCoins').textContent = '+' + G.lastCoins * 2; $('oDouble').classList.add('hidden'); AU.coin(); }); });
  document.querySelectorAll('#shop .tabs button').forEach(b => b.addEventListener('click', () => { AU.click(); UI.shopTab = b.dataset.tab; buildShop(); }));
  document.querySelectorAll('.back').forEach(b => b.addEventListener('click', () => {
    AU.click(); hide(b.closest('.screen').id);
    if(backTo){ show(backTo); backTo = null; } else refreshTitle();
  }));
  document.querySelectorAll('.setRow').forEach(r => r.addEventListener('click', () => { const k = r.dataset.opt; save.opt[k] = !save.opt[k]; persist(); AU.apply(); AU.click(); buildSettings(); }));
  document.querySelectorAll('.screen, #hud button, #title button').forEach(el => el.addEventListener('pointerdown', e => e.stopPropagation()));
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ persist(); pauseGame(); } else AU.resume(); });
  SDK.onMute = m => AU.setPortalMute(m);
}

/* ---------------- HUD ---------------- */
function updateHUD(){
  if(G.state !== 'play' && G.state !== 'over') return;
  $('depthTxt').textContent = Math.floor(depthM()) + ' m';
  $('scoreTxt').textContent = '🏅 ' + G.run.score;
  $('coinTxt').textContent = G.run.coins;
  const cm = comboMult();
  $('comboTxt').classList.toggle('hidden', G.combo < 3);
  $('comboTxt').textContent = '🎵 ' + G.combo + (cm > 1 ? ' · x' + cm : '');
  const k = G.ink / inkMax();
  $('inkBar').firstElementChild.style.width = (k * 100) + '%';
  $('inkBar').classList.toggle('low', k < 0.2);
  const pw = Object.keys(G.pw).map(p => `<span>${POWERS[p].icon} ${Math.ceil(G.pw[p])}</span>`).join('');
  if(pw !== UI.lastPw){ $('powers').innerHTML = pw; UI.lastPw = pw; }
}

/* ---------------- loop + boot ---------------- */
let last = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > 0.05) dt = 0.05;
  try{
    if(G.state === 'title' && G.balls.every(b => b.dead)) newRun(true);
    if(G.state === 'title' && depthM() > 1500) newRun(true);
    update(dt); R.draw(); updateHUD();
  }catch(err){ console.error(err); }
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
})();
