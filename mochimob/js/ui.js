'use strict';
/* Input, HUD, menus and boot. */
let playing = false;
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }

const UI = {
  touch: matchMedia('(pointer:coarse)').matches,
  lastMob: 0,
  banner(a, b, col){
    const el = $('banner');
    el.querySelector('b').textContent = a; el.querySelector('b').style.color = col || '#fff';
    el.querySelector('small').textContent = b;
    el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden');
    clearTimeout(this.banT); this.banT = setTimeout(() => el.classList.add('hidden'), 2500);
  },
  tip(txt){
    const el = $('tip'); el.textContent = txt;
    el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden');
    clearTimeout(this.tipT); this.tipT = setTimeout(() => el.classList.add('hidden'), 5500);
  },
  toast(txt){ const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = txt; $('toasts').appendChild(d); setTimeout(() => d.remove(), 1900); },
  showResults(){ showResults(); }
};

/* ---------------- screens ---------------- */
const SCREENS = ['results', 'upgrades', 'flavors', 'missions', 'settings', 'pause'];
function anyScreen(){ return SCREENS.some(id => !$(id).classList.contains('hidden')); }
function closeScreens(){ SCREENS.forEach(hide); }
let backTo = null;
function openScreen(id, from){ backTo = from || null; SCREENS.forEach(s => s !== id && hide(s)); show(id); }

function titleWorld(){
  const cfg = Object.assign(dayCfg(1), { W: 1500, H: 950, gobblers: 0, cacti: 0, treasures: 1, crates: 2, eggs: 5, bigEggs: 0, boss: false, fruitClusters: 10 });
  setupWorld(cfg, true);
  G.state = 'title';
}
function toTitle(){
  endPlay(); closeScreens();
  titleWorld();
  AU.setStyle('title'); AU.fast = false;
  hide('hud'); hide('sqBtn'); hide('tip'); hide('banner');
  show('title');
  refreshTitle();
}
function refreshTitle(){
  $('tCoins').textContent = save.coins;
  $('tBest').textContent = save.best ? '🏆 Day ' + save.best : '🍡 New mob!';
  $('playDay').textContent = 'DAY ' + save.day;
  const canUp = UPG.some(u => save.up[u.id] < u.max && upCost(u, save.up[u.id]) <= save.coins);
  $('upBadge').classList.toggle('hidden', !canUp);
  $('miBadge').classList.toggle('hidden', !save.missions.some(m => m.done && !m.claimed));
  $('tHint').textContent = UI.touch ? 'Drag to lead · hold SQUISH to smash' : 'Move the mouse to lead · hold click or Space to squish';
}
function play(day){
  closeScreens(); hide('title');
  const d = day || save.day;
  SDK.midgame(() => {
    startDay(d);
    show('hud'); $('sqBtn').classList.toggle('hidden', !UI.touch);
    $('dayTxt').textContent = 'DAY ' + d + ' · ' + G.cfg.biome.name.toUpperCase() + (G.cfg.boss ? ' · BOSS!' : '');
    UI.banner('DAY ' + d, G.cfg.boss ? 'The Gobbler King is here!' : 'Fill the nest!', G.cfg.boss ? '#d9b8ff' : '#fff');
    beginPlay();
  });
}
function showResults(){
  endPlay();
  const r = G.result, run = G.run;
  hide('sqBtn'); hide('tip');
  $('rTitle').textContent = r.win ? (G.cfg.boss ? 'BOSS POPPED!' : 'DAY COMPLETE!') : r.why === 'eaten' ? 'MOB GOBBLED!' : "TIME'S UP!";
  const st = $('rStars').children;
  [...st].forEach(s => s.classList.remove('on'));
  for(let i = 0; i < r.stars; i++) setTimeout(() => { st[i].classList.add('on'); AU.star(i); }, 300 + i * 260);
  $('rStars').classList.toggle('hidden', !r.win);
  $('rStarTxt').textContent = r.win ? '★ clear   ★ 25s left   ★ triple your mob' : 'Nest ' + Math.floor(G.meter) + '% full. Upgrade and try again!';
  $('rStats').innerHTML = [
    ['🍡 Peak mob', run.peak], ['🥚 Hatched', run.hatch], ['🍓 Eaten', run.eat],
    ['🎂 Delivered', run.deliver], ['😈 Popped', run.pop], ['📦 Smashed', run.crates]
  ].map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join('');
  $('rCoins').textContent = '+' + run.coins;
  $('rNext').textContent = r.win ? 'NEXT DAY ▶' : 'TRY AGAIN ▶';
  $('rDouble').classList.toggle('hidden', !SDK.canRewarded());
  $('rDouble').disabled = false;
  $('rMiss').innerHTML = save.missions.map(m => `<div class="${m.done ? 'done' : ''}">${m.done ? '✅' : '🎯'} ${MISSION_POOL.find(p => p.id === m.id).txt(m.n)} <b>${Math.min(m.prog, m.n)}/${m.n}</b></div>`).join('');
  openScreen('results');
}

/* ---------------- upgrades / flavors / missions / settings ---------------- */
function buildUpgrades(){
  $('uCoins').textContent = save.coins;
  $('uList').innerHTML = '';
  for(const u of UPG){
    const lvl = save.up[u.id], max = lvl >= u.max, cost = upCost(u, lvl);
    const d = document.createElement('div'); d.className = 'row';
    d.innerHTML = `<div class="ic">${u.icon}</div><div class="tx">${u.name} <small>${u.desc}</small><div class="lv">${Array.from({ length: Math.min(u.max, 15) }, (_, i) => `<i class="${i < Math.round(lvl / u.max * Math.min(u.max, 15)) ? 'on' : ''}"></i>`).join('')}</div></div><button>${max ? 'MAX' : '<span class="coin">' + cost + '</span>'}</button>`;
    const b = d.querySelector('button'); b.disabled = max || save.coins < cost;
    b.onclick = () => { if(save.coins < cost || max) return; save.coins -= cost; save.up[u.id]++; persist(); AU.buy(); buildUpgrades(); refreshTitle(); };
    $('uList').appendChild(d);
  }
}
function flavorPreview(f){
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  const col = f.c === 'rainbow' ? '#ffb3e6' : f.c, col2 = f.c === 'rainbow' ? '#8fd0ff' : f.c2;
  c.drawImage(R.mochiSprite(col, col2), 8, 8, 112, 112);
  faceEyes(c, 64, 70, 3.4, 0, 0, false);
  return cv;
}
function buildFlavors(){
  $('fCoins').textContent = save.coins;
  const g = $('fGrid'); g.innerHTML = '';
  for(const f of FLAVORS){
    const own = !!save.own[f.id], eq = save.flavor === f.id;
    const b = document.createElement('button'); b.className = eq ? 'eq' : '';
    b.appendChild(flavorPreview(f));
    const n = document.createElement('div'); n.textContent = f.name; b.appendChild(n);
    const p = document.createElement('div'); p.className = own ? '' : 'price coin'; p.textContent = eq ? 'EQUIPPED' : own ? 'OWNED' : f.price; b.appendChild(p);
    b.onclick = () => {
      if(!own){ if(save.coins < f.price){ AU.lose1(); UI.toast('Need more coins!'); return; } save.coins -= f.price; save.own[f.id] = 1; AU.buy(); }
      else AU.click();
      save.flavor = f.id; persist(); buildFlavors(); refreshTitle();
    };
    g.appendChild(b);
  }
}
function buildMissions(){
  missionTick(0);
  const l = $('mList'); l.innerHTML = '';
  for(const m of save.missions){
    const p = MISSION_POOL.find(x => x.id === m.id);
    const d = document.createElement('div'); d.className = 'row';
    d.innerHTML = `<div class="ic">🎯</div><div class="tx">${p.txt(m.n)}<div class="bar"><i style="width:${Math.min(100, m.prog / m.n * 100)}%"></i></div><small>${Math.min(m.prog, m.n)} / ${m.n}</small></div><button>${m.done ? 'CLAIM' : '<span class="coin">' + m.rw + '</span>'}</button>`;
    const b = d.querySelector('button'); b.disabled = !m.done;
    b.onclick = () => { if(!m.done) return; m.claimed = true; save.coins += m.rw; AU.buy(); UI.toast(`Mission complete! <span class="coin">${m.rw}</span>`); fillMissions(); persist(); buildMissions(); refreshTitle(); };
    l.appendChild(d);
  }
  $('mStats').textContent = `Biggest mob ever: ${save.bestMob} · Hatched: ${save.stats.hatch} · Popped: ${save.stats.pop}`;
}
function buildSettings(){
  document.querySelectorAll('.setRow').forEach(r => {
    const k = r.dataset.opt, v = save.opt[k], b = r.querySelector('b');
    b.textContent = k === 'fx' ? (v === 'low' ? 'FAST' : 'PRETTY') : v ? 'ON' : 'OFF';
    b.classList.toggle('off', k !== 'fx' && !v);
  });
}

/* ---------------- pause ---------------- */
function pauseGame(){ if(G.state !== 'play') return; G.state = 'pause'; G.squish = false; endPlay(); openScreen('pause'); }
function resumeGame(){ closeScreens(); if(G.state === 'pause'){ G.state = 'play'; beginPlay(); } }

/* ---------------- input ---------------- */
const keys = {};
let ptr = null;
function setTarget(e){
  if(G.state !== 'play' && G.state !== 'title') return;
  const w = R.toWorld(e.clientX, e.clientY); G.tx = w.x; G.ty = w.y;
}
function keySteer(dt){
  const dx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
  const dy = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0);
  if(!dx && !dy) return;
  const l = Math.hypot(dx, dy); G.tx = G.cx + dx / l * 230; G.ty = G.cy + dy / l * 230;
}
function wire(){
  const cv = R.cv;
  cv.addEventListener('pointerdown', e => {
    AU.init();
    if(SDK.adBusy || anyScreen()) return;
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    if(e.pointerType === 'mouse'){ setTarget(e); if(e.button === 0) squishOn(); }
    else{ ptr = e.pointerId; setTarget(e); }
  });
  cv.addEventListener('pointermove', e => { if(SDK.adBusy) return; if(e.pointerType === 'mouse' || e.pointerId === ptr) setTarget(e); });
  const up = e => { if(e.pointerType === 'mouse') squishOff(); else if(e.pointerId === ptr) ptr = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const sq = $('sqBtn');
  sq.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); AU.init(); squishOn(); sq.classList.add('on'); });
  const sqUp = e => { e.preventDefault(); squishOff(); sq.classList.remove('on'); };
  sq.addEventListener('pointerup', sqUp); sq.addEventListener('pointercancel', sqUp); sq.addEventListener('pointerleave', sqUp);
  addEventListener('keydown', e => {
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if(SDK.adBusy) return;
    AU.init();
    if(e.repeat) return;
    keys[e.code] = true;
    if(e.code === 'Escape' || e.code === 'KeyP'){ if(G.state === 'pause') resumeGame(); else if(G.state === 'play') pauseGame(); else if(anyScreen() && G.state === 'title') closeScreens(); return; }
    if(e.code === 'Space'){
      if(G.state === 'title' && !anyScreen()){ play(); return; }
      if(!$('results').classList.contains('hidden')){ $('rNext').click(); return; }
      squishOn();
    }
    if(e.code === 'Enter'){ if(G.state === 'title' && !anyScreen()) play(); else if(!$('results').classList.contains('hidden')) $('rNext').click(); }
  });
  addEventListener('keyup', e => { keys[e.code] = false; if(e.code === 'Space') squishOff(); });
  addEventListener('blur', () => { for(const k in keys) keys[k] = false; squishOff(); });
  document.addEventListener('contextmenu', e => e.preventDefault());

  const tap = (id, fn) => $(id).addEventListener('click', e => { if(SDK.adBusy) return; AU.init(); AU.click(); fn(e); });
  tap('playBtn', () => play());
  tap('bUp', () => { buildUpgrades(); openScreen('upgrades'); });
  tap('bFl', () => { buildFlavors(); openScreen('flavors'); });
  tap('bMi', () => { buildMissions(); openScreen('missions'); });
  tap('bSet', () => { buildSettings(); openScreen('settings'); });
  tap('pauseBtn', pauseGame);
  tap('pResume', resumeGame);
  tap('pSet', () => { buildSettings(); openScreen('settings', 'pause'); });
  tap('pQuit', () => { closeScreens(); G.state = 'play'; endDay(false, 'time'); });
  tap('rHome', toTitle);
  tap('rUp', () => { buildUpgrades(); openScreen('upgrades', 'results'); });
  tap('rNext', () => play(G.result && G.result.win ? save.day : G.day));
  tap('rDouble', () => {
    $('rDouble').disabled = true;
    SDK.rewarded(ok => { if(!ok) return; save.coins += G.run.coins; persist(); $('rCoins').textContent = '+' + G.run.coins * 2; $('rDouble').classList.add('hidden'); AU.coin(); });
  });
  document.querySelectorAll('.back').forEach(b => b.addEventListener('click', () => {
    AU.click(); const id = b.closest('.screen').id; hide(id);
    if(backTo){ show(backTo); if(backTo === 'results') $('rNext').focus(); backTo = null; }
    else refreshTitle();
  }));
  document.querySelectorAll('.setRow').forEach(r => r.addEventListener('click', () => {
    const k = r.dataset.opt;
    save.opt[k] = k === 'fx' ? (save.opt.fx === 'low' ? 'high' : 'low') : !save.opt[k];
    if(k === 'fx') R.resize();
    persist(); AU.apply(); AU.click(); buildSettings();
  }));
  document.querySelectorAll('.screen, #hud button, #title button').forEach(el => el.addEventListener('pointerdown', e => e.stopPropagation()));
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ persist(); pauseGame(); } else AU.resume(); });
  SDK.onMute = m => AU.setPortalMute(m);
}

/* ---------------- HUD ---------------- */
function updateHUD(){
  if(G.state !== 'play' && G.state !== 'over') return;
  const s = Math.max(0, Math.ceil(G.left));
  $('timer').textContent = '⏱ ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  $('timer').classList.toggle('low', s <= 10 && G.state === 'play');
  const p = Math.floor(G.meter / G.cfg.goal * 100);
  $('meter').firstElementChild.style.width = p + '%';
  $('meterTxt').textContent = 'NEST ' + p + '%';
  const n = G.mob.length;
  if(n !== UI.lastMob){
    $('mobTxt').textContent = '🍡 ' + n;
    if(n > UI.lastMob){ const el = $('mobTxt'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    UI.lastMob = n;
  }
  $('coinTxt').textContent = G.run.coins;
}

/* ---------------- loop + boot ---------------- */
let last = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > 0.05) dt = 0.05;
  try{
    if(G.state === 'title'){
      // keep the demo mob busy on the title screen
      if(G.fruits.filter(f => !f.dead).length < 50){ for(let i = 0; i < 12; i++) G.fruits.push(newFruit(rnd(80, G.cfg.W - 80), rnd(80, G.cfg.H - 80), pick(['berry', 'cherry', 'grape', 'orange']))); }
      if(G.eggs.length < 3) G.eggs.push({ x: rnd(100, G.cfg.W - 100), y: rnd(100, G.cfg.H - 100), r: 17, big: false, wob: 0 });
      if(G.mob.length > 120) G.mob.length = 120;
    }
    update(dt); R.draw(); updateHUD();
  }catch(err){ console.error(err); }
}
(async () => {
  R.init();
  await SDK.init();
  SDK.loadingStart();
  loadSave();
  R.resize();
  wire();
  if(UI.touch) document.body.classList.add('touch');
  toTitle();
  requestAnimationFrame(frame);
  SDK.loadingStop();
  const b = $('boot'); b.style.opacity = '0'; setTimeout(() => b.remove(), 450);
})();
