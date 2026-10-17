'use strict';
/* =====================================================================
   WOBBLE BOW: screens, input, flow, boot.
   ===================================================================== */
let playing = false, backTo = null, pausedFrom = null, duoScore = [0, 0];
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }
const anyScreen = () => !!document.querySelector('.screen:not(.hidden)');
function openScreen(id){ document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); show(id); }
function closeScreens(){ document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden')); }

const UI = {
  idx:0,
  toast(msg){ const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; $('toasts').appendChild(d); setTimeout(() => d.remove(), 2500); },
  banner(big, small){ const b = $('banner'); b.querySelector('b').textContent = big; b.querySelector('small').textContent = small || ''; b.classList.add('hidden'); void b.offsetWidth; b.classList.remove('hidden'); clearTimeout(this.bt); this.bt = setTimeout(() => b.classList.add('hidden'), 2400); },

  /* ---------- fights ---------- */
  play(mode, idx, carry){
    G.demo = false; closeScreens(); hide('menu'); show('hud');
    this.mode = mode; this.idx = idx;
    if(mode === 'arena' && !carry) this.arenaCoins = 0;
    startBattle(mode, idx, carry);
    $('duoHelp').classList.toggle('hidden', mode !== 'duo');
    if(mode === 'duo') setTimeout(() => hide('duoHelp'), 6000);
    const L = G.lv;
    $('lvTxt').innerHTML = mode === 'campaign' ? `LEVEL ${idx + 1}<small>${WORLDS[L.w].name}</small>` : mode === 'arena' ? `WAVE ${idx + 1}<small>ARENA</small>` : '2 PLAYERS';
    $('hCoins').textContent = fmt(save.coins);
    if(mode === 'campaign' && L.boss) this.banner('BOSS FIGHT!', G.fighters.slice(1).map(f => f.name).join(' + '));
    else if(mode === 'campaign' && idx > 0) this.banner('LEVEL ' + (idx + 1), G.fighters.length > 2 ? 'Two archers!' : '');
    else if(mode === 'arena') this.banner('WAVE ' + (idx + 1), idx === 0 ? 'How long can you last?' : '');
    else if(mode === 'duo') this.banner('FIGHT!', 'First to knock out the other wins');
    AU.setStyle('play'); beginPlay();
  },
  fightOver(res){
    if(G.mode === 'duo'){
      endPlay(); duoScore[res === 'p1' ? 0 : 1]++;
      $('dTitle').textContent = (res === 'p1' ? 'PLAYER 1' : 'PLAYER 2') + ' WINS!';
      $('dScore').textContent = duoScore[0] + ' : ' + duoScore[1];
      AU.win(); openScreen('duoRes'); return;
    }
    const S = G.stats, me = G.fighters[0], win = res === 'win';
    save.stats.heads += S.heads; save.stats.hits += S.hits; save.stats.ringouts += S.ringouts; save.stats.orbs += S.orbs; save.stats.shots += S.shots;
    const loot = 1 + .1 * save.up.loot;
    if(G.mode === 'arena'){
      const waveCoins = Math.round((20 + 9 * this.idx) * loot) + S.heads * 4 + S.ringouts * 12;
      if(win){
        save.stats.wins++; this.arenaCoins += waveCoins; save.coins += waveCoins;
        save.arena = Math.max(save.arena, this.idx + 1); missionTick(); persist();
        floatText('+' + fmt(waveCoins), me.body.pts[0].x, me.body.pts[0].y - 60, '#ffd23a', 1.2); AU.coin();
        const hp = Math.min(me.maxHp, me.hp + me.maxHp * .3);
        setTimeout(() => { if(this.mode === 'arena' && G.state === 'end') this.play('arena', this.idx + 1, { hp }); }, 400);
        return;
      }
      endPlay(); save.duels++; missionTick(); persist();
      this.showResult({ title:'WAVE ' + (this.idx + 1), stars:-1, coins:this.arenaCoins, stats:`You survived ${this.idx} wave${this.idx === 1 ? '' : 's'} · best ${save.arena}`, next:'AGAIN ▶', win:false });
      return;
    }
    endPlay();
    const L = G.lv, i = this.idx;
    save.duels++;
    let coins, stars = 0;
    if(win){
      const k = me.hp / me.maxHp; stars = k >= .7 ? 3 : k >= .35 ? 2 : 1;
      const prev = save.stars[i] || 0, first = save.lvl <= i;
      coins = Math.round(L.coins * loot * (first ? 1 : .6)) + S.heads * 5 + S.ringouts * 15 + Math.max(0, stars - prev) * 20;
      save.stars[i] = Math.max(prev, stars);
      save.lvl = Math.min(LEVELS, Math.max(save.lvl, i + 1));
      save.stats.wins++; if(!G.hitTaken) save.stats.flawless++;
      if(stars === 3 || L.boss) SDK.happytime();
    } else coins = Math.round(L.coins * loot * .3) + S.heads * 5;
    save.coins += coins; missionTick(); persist();
    $('hCoins').textContent = fmt(save.coins);
    const st = `🎯 ${S.hits} hit${S.hits === 1 ? '' : 's'} · 💀 ${S.heads} headshot${S.heads === 1 ? '' : 's'}${S.ringouts ? ' · 🌀 ' + S.ringouts + ' ring-out' : ''}`;
    this.showResult({ title:win ? (L.boss ? 'BOSS DEFEATED!' : 'VICTORY!') : 'DEFEATED', stars:win ? stars : 0, coins, stats:st, win,
      next:win ? (i + 1 >= LEVELS ? 'MENU' : 'NEXT ▶') : 'TRY AGAIN ▶' });
  },
  showResult(o){
    $('rTitle').textContent = o.title; $('rTitle').style.color = o.win ? '#2a9a3a' : o.stars === -1 ? '#ff8a2a' : '#d8403a';
    $('rStats').textContent = o.stats;
    $('rCoins').textContent = '+' + fmt(o.coins);
    $('rStars').classList.toggle('hidden', o.stars < 0);
    const ss = $('rStars').children; for(let k = 0; k < 3; k++) ss[k].classList.remove('on');
    if(o.stars > 0) for(let k = 0; k < o.stars; k++) setTimeout(() => { ss[k].classList.add('on'); AU.star(k); }, 300 + k * 280);
    $('rNext').textContent = o.next;
    $('rRetry').classList.toggle('hidden', !o.win || this.mode !== 'campaign');
    renderUps($('rUps'), true);
    const mm = $('rMiss'); mm.innerHTML = '';
    for(const m of save.missions){ const p = MISSION_POOL.find(x => x.id === m.id); mm.insertAdjacentHTML('beforeend', `<div class="${m.done ? 'done' : ''}"><span>${m.done ? '✅' : '🎯'} ${p.txt(m.n)}</span><b>${fmt(Math.min(m.prog, m.n))}/${fmt(m.n)}</b></div>`); }
    if(o.win) AU.win(); else AU.lose();
    openScreen('result');
  },
  next(){
    if(this.mode === 'arena'){ SDK.midgame(() => this.play('arena', 0)); return; }
    const win = G.result === 'win';
    if(win && this.idx + 1 >= LEVELS){ toMenu(); return; }
    SDK.midgame(() => this.play('campaign', win ? this.idx + 1 : this.idx));
  },
};

/* ---------------- menu with a live demo duel behind it ---------------- */
function toMenu(){
  endPlay(); closeScreens(); hide('hud'); hide('duoHelp'); show('menu');
  G.demo = true; startBattle('campaign', Math.floor(Math.random() * Math.min(40, Math.max(6, save.lvl))));
  AU.setStyle('title'); refreshMenu();
}
function refreshMenu(){
  $('mCoins').textContent = fmt(save.coins);
  $('mStars').textContent = '★ ' + totalStars();
  const nx = Math.min(LEVELS - 1, save.lvl);
  $('playLv').textContent = save.lvl >= LEVELS ? 'ALL LEVELS CLEARED' : 'LEVEL ' + (nx + 1) + (nx % 10 === 9 ? ' · BOSS' : '');
  $('arenaBtn').disabled = save.lvl < 5;
  $('arenaTxt').textContent = save.lvl < 5 ? 'clear level 5' : save.arena ? 'best wave ' + save.arena : '';
  $('upBadge').classList.toggle('hidden', !UPS.some(u => save.up[u.id] < u.max && save.coins >= upCost(u, save.up[u.id])));
  $('miBadge').classList.toggle('hidden', !save.missions.some(m => m.done));
}

/* ---------------- shop, hats, map, missions ---------------- */
function renderUps(box, compact){
  box.innerHTML = '';
  for(const u of UPS){
    const l = save.up[u.id], max = l >= u.max, cost = upCost(u, l);
    const d = document.createElement('div'); d.className = 'row2';
    const pips = compact ? '' : `<div class="lv">${Array.from({ length:u.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div>`;
    d.innerHTML = `<div class="ic">${u.icon}</div><div class="tx">${u.name} <small>${u.desc(l)}${max ? '' : ' → ' + u.desc(l + 1).split(' ')[0]} · LV ${l}${max ? ' MAX' : ''}</small>${pips}</div><button>${max ? 'MAX' : '🪙 ' + fmt(cost)}</button>`;
    const b = d.querySelector('button'); b.disabled = max || save.coins < cost;
    b.onclick = e => { e.stopPropagation(); if(max || save.coins < cost) return; save.coins -= cost; save.up[u.id]++; persist(); AU.buy(); renderUps(box, compact); $('sCoins').textContent = fmt(save.coins); $('hCoins').textContent = fmt(save.coins); refreshMenu(); };
    box.appendChild(d);
  }
}
function hatIcon(id){
  const cv = document.createElement('canvas'); cv.width = 160; cv.height = 144; const c = cv.getContext('2d');
  c.fillStyle = '#ffd9b0'; c.strokeStyle = '#2a1d2e'; c.lineWidth = 5; c.beginPath(); c.arc(80, 92, 34, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = '#2a1d2e'; c.beginPath(); c.arc(68, 88, 4.5, 0, TAU); c.arc(94, 88, 4.5, 0, TAU); c.fill();
  c.lineWidth = 4; c.beginPath(); c.arc(80, 100, 9, .2, Math.PI - .2); c.stroke();
  try{ R.hat(c, id, 80, 92, 34, 0, { face:1 }); }catch(e){}
  return cv;
}
function renderHats(){
  $('hatCoins').textContent = fmt(save.coins);
  const g = $('hatGrid'); g.innerHTML = ''; const st = totalStars();
  for(const h of HATS){
    const own = !!save.own[h.id], eq = save.hat === h.id, canStar = h.stars && st >= h.stars;
    if(canStar && !own){ save.own[h.id] = 1; }
    const b = document.createElement('button'); b.className = (eq ? 'eq' : '') + (!save.own[h.id] ? ' lock' : '');
    b.appendChild(hatIcon(h.id));
    b.insertAdjacentHTML('beforeend', `<b>${h.name}</b><small>${eq ? 'WEARING' : save.own[h.id] ? 'WEAR' : h.stars ? '★ ' + h.stars + ' stars' : '🪙 ' + fmt(h.cost)}</small>`);
    b.onclick = e => {
      e.stopPropagation();
      if(!save.own[h.id]){ if(h.stars || save.coins < h.cost){ AU.notReady(); UI.toast(h.stars ? `Earn ${h.stars} stars to unlock` : 'Not enough coins yet'); return; } save.coins -= h.cost; save.own[h.id] = 1; AU.buy(); }
      else AU.click();
      save.hat = h.id; persist(); renderHats(); refreshMenu();
      const me = G.fighters[0]; if(me && G.demo) me.hat = h.id;
    };
    g.appendChild(b);
  }
}
let mapW = 0;
function renderMap(){
  $('mapStars').textContent = '★ ' + totalStars() + ' / ' + LEVELS * 3;
  const tabs = $('mapTabs'); tabs.innerHTML = '';
  WORLDS.forEach((w, i) => { const b = document.createElement('button'); b.textContent = w.name; b.className = i === mapW ? 'on' : ''; b.disabled = save.lvl < i * 10; b.onclick = e => { e.stopPropagation(); AU.click(); mapW = i; renderMap(); }; tabs.appendChild(b); });
  const g = $('mapGrid'); g.innerHTML = '';
  for(let k = 0; k < 10; k++){
    const i = mapW * 10 + k, b = document.createElement('button'), s = save.stars[i] || 0;
    b.className = (k === 9 ? 'boss' : '') + (i === save.lvl ? ' cur' : '');
    b.innerHTML = (k === 9 ? '👑' : i + 1) + `<small>${'★'.repeat(s)}${'☆'.repeat(i < save.lvl ? 3 - s : 0)}</small>`;
    b.disabled = i > save.lvl;
    b.onclick = e => { e.stopPropagation(); AU.init(); AU.click(); UI.play('campaign', i); };
    g.appendChild(b);
  }
}
function renderMissions(){
  const L = $('miList'); L.innerHTML = '';
  for(const m of save.missions){
    const p = MISSION_POOL.find(x => x.id === m.id), d = document.createElement('div'); d.className = 'row2' + (m.done ? ' done' : '');
    d.innerHTML = `<div class="ic">🎯</div><div class="tx">${p.txt(m.n)}<div class="bar"><i style="width:${Math.min(100, m.prog / m.n * 100)}%"></i></div><small>${fmt(Math.min(m.prog, m.n))} / ${fmt(m.n)}</small></div><button>${m.done ? 'CLAIM' : '🪙 ' + fmt(m.rw)}</button>`;
    const b = d.querySelector('button'); b.disabled = !m.done;
    b.onclick = e => { e.stopPropagation(); if(!m.done) return; m.claimed = true; save.coins += m.rw; AU.buy(); UI.toast('Mission complete! 🪙 ' + fmt(m.rw)); fillMissions(); missionTick(); persist(); renderMissions(); refreshMenu(); };
    L.appendChild(d);
  }
}
function renderSettings(){ document.querySelectorAll('.setRow').forEach(r => { const v = save.opt[r.dataset.opt], b = r.querySelector('b'); b.textContent = v ? 'ON' : 'OFF'; b.classList.toggle('off', !v); }); }

/* ---------------- daily reward ---------------- */
function checkLogin(){
  const k = todayKey(); if(save.login.key === k) return false;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  G.loginDay = save.login.key === y ? (save.login.day % 7) + 1 : 1;
  const row = $('loginRow'); row.innerHTML = '';
  LOGIN.forEach((v, i) => row.insertAdjacentHTML('beforeend', `<div class="${i + 1 < G.loginDay ? 'got' : i + 1 === G.loginDay ? 'today' : ''}"><small>DAY ${i + 1}</small>🪙${fmt(v)}</div>`));
  openScreen('login'); return true;
}
function claimLogin(){ const v = LOGIN[G.loginDay - 1]; save.login = { key:todayKey(), day:G.loginDay }; save.coins += v; persist(); AU.buy(); closeScreens(); refreshMenu(); UI.toast('Daily reward: 🪙 ' + fmt(v)); }

/* ---------------- pause ---------------- */
function pauseGame(){ if(G.demo || (G.state !== 'fight' && G.state !== 'end') || anyScreen()) return; pausedFrom = G.state; G.state = 'paused'; G.pin = {}; endPlay(); openScreen('pause'); }
function resumeGame(){ closeScreens(); if(G.state === 'paused'){ G.state = pausedFrom; beginPlay(); } }

/* ---------------- input ---------------- */
function pinFor(clientX){ return G.mode === 'duo' && clientX > innerWidth / 2 ? 'p2' : 'p1'; }
function wire(){
  const cv = R.cv;
  cv.addEventListener('pointerdown', e => {
    AU.init();
    if(SDK.adBusy || anyScreen() || G.demo || G.state !== 'fight') return;
    const id = pinFor(e.clientX);
    if(G.pin[id]) return;
    G.pin[id] = { pid:e.pointerId, sx:e.clientX, sy:e.clientY, cx:e.clientX, cy:e.clientY, power:0 };
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
  });
  addEventListener('pointermove', e => { for(const k in G.pin){ const p = G.pin[k]; if(p.pid === e.pointerId){ p.cx = e.clientX; p.cy = e.clientY; } } });
  const up = e => { for(const k in G.pin){ if(G.pin[k].pid === e.pointerId) humanRelease(k); } };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  const keyPin = code => code === 'KeyW' || code === 'Space' ? 'p1' : code === 'ArrowUp' ? (G.mode === 'duo' ? 'p2' : 'p1') : null;
  addEventListener('keydown', e => {
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if(SDK.adBusy || e.repeat) return;
    AU.init();
    // Escape is reserved by the browser (it exits fullscreen), so pause is on P
    if(e.code === 'KeyP'){ if(G.state === 'paused') resumeGame(); else pauseGame(); return; }
    if(!$('result').classList.contains('hidden') && (e.code === 'Space' || e.code === 'Enter')){ $('rNext').click(); return; }
    if(!$('menu').classList.contains('hidden') && !anyScreen() && (e.code === 'Space' || e.code === 'Enter')){ $('playBtn').click(); return; }
    const id = keyPin(e.code);
    if(id && G.state === 'fight' && !G.demo && !anyScreen() && !G.pin[id]) G.pin[id] = { key:true, sw:0, power:.9 };
  });
  addEventListener('keyup', e => { const id = keyPin(e.code); if(id && G.pin[id] && G.pin[id].key) humanRelease(id); });
  addEventListener('blur', () => { G.pin = {}; pauseGame(); });
  document.addEventListener('contextmenu', e => e.preventDefault());

  const tap = (id, fn) => $(id).addEventListener('click', e => { e.stopPropagation(); if(SDK.adBusy) return; AU.init(); AU.click(); fn(e); });
  tap('playBtn', () => UI.play('campaign', Math.min(LEVELS - 1, save.lvl)));
  tap('mapBtn', () => { mapW = Math.min(5, Math.floor(Math.min(LEVELS - 1, save.lvl) / 10)); renderMap(); openScreen('map'); });
  tap('upBtn', () => { $('sCoins').textContent = fmt(save.coins); renderUps($('sList'), false); openScreen('shop'); });
  tap('hatBtn', () => { renderHats(); openScreen('hats'); });
  tap('miBtn', () => { renderMissions(); openScreen('missions'); });
  tap('setBtn', () => { renderSettings(); openScreen('settings'); });
  tap('arenaBtn', () => UI.play('arena', 0));
  tap('duoBtn', () => { duoScore = [0, 0]; UI.play('duo', 0); });
  tap('rNext', () => UI.next());
  tap('rRetry', () => SDK.midgame(() => UI.play('campaign', UI.idx)));
  tap('rMenu', toMenu);
  tap('dAgain', () => UI.play('duo', 0));
  tap('dMenu', toMenu);
  tap('loginBtn', claimLogin);
  tap('pauseBtn', pauseGame);
  tap('pResume', resumeGame);
  tap('pRetry', () => { closeScreens(); UI.play(UI.mode, UI.mode === 'arena' ? 0 : UI.idx); });
  tap('pQuit', toMenu);
  document.querySelectorAll('.back').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); AU.click(); hide(b.closest('.screen').id); refreshMenu(); }));
  document.querySelectorAll('.setRow').forEach(r => r.addEventListener('click', e => { e.stopPropagation(); const k = r.dataset.opt; save.opt[k] = !save.opt[k]; persist(); AU.apply(); AU.click(); renderSettings(); }));
  document.querySelectorAll('.screen, #menu button, #hud button').forEach(el => el.addEventListener('pointerdown', e => e.stopPropagation()));
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ persist(); pauseGame(); } else AU.resume(); });
  addEventListener('resize', () => { if(G.lv) computeCam(); });
  SDK.onMute = m => AU.setPortalMute(m);
}

/* ---------------- loop + boot ---------------- */
let last = 0, tt = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > .05) dt = .05;
  tt += dt;
  try{ if(G.state !== 'paused') update(dt); R.draw(tt); }catch(err){ console.error(err); }
}
(async () => {
  R.init();
  await SDK.init();
  SDK.loadingStart();
  loadSave();
  wire();
  requestAnimationFrame(frame);
  // first visit: straight into level 1 (the controls are taught in the fight); returning: menu
  SDK.loadingStop();
  if(save.duels === 0 && save.lvl === 0){ save.login = { key:todayKey(), day:1 }; persist(); UI.play('campaign', 0); }
  else toMenu();
  const b = $('boot'); b.style.opacity = '0'; setTimeout(() => b.remove(), 450);
  if(save.duels > 0) setTimeout(checkLogin, 500);
})();
