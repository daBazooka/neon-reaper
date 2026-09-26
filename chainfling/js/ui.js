'use strict';
/* =====================================================================
   UI, flow, input, main loop, boot.
   ===================================================================== */
const SCREENS = ['menu', 'cards', 'pause', 'revive', 'over', 'shop', 'missions', 'settings', 'confirm'];
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
function hideAll(){ SCREENS.forEach(hide); }
function onTap(id, fn){ const el = typeof id === 'string' ? $(id) : id; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }

/* ---------------- feedback widgets ---------------- */
let annT = 0;
function announce(txt, col, sub){
  const a = $('announce');
  a.innerHTML = txt + (sub ? '<small>' + sub + '</small>' : '');
  a.style.color = col || '#fff';
  a.style.textShadow = `0 0 24px ${col || '#fff'}, 0 0 60px ${rgba(col || '#ffffff', .5)}`;
  a.classList.remove('go'); void a.offsetWidth; a.classList.add('go');
  clearTimeout(annT); annT = setTimeout(() => a.classList.remove('go'), 1150);
}
function tip(html){ const t = $('tip'); if(!html){ t.classList.add('hidden'); return; } t.innerHTML = html; t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; }
function toast(title, body, col, dur){
  const host = $('toasts');
  while(host.children.length >= 3) host.firstChild.remove();
  const d = document.createElement('div'); d.className = 'toast';
  d.innerHTML = `<b style="color:${col || '#27f3ff'}">${title}</b>${body || ''}`;
  host.appendChild(d);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 320); }, dur || 2800);
}

/* ---------------- HUD ---------------- */
const hudC = {};
function setH(id, key, val, fn){ if(hudC[key] === val) return; hudC[key] = val; fn($(id), val); }
function updateHUD(){
  setH('hScore', 'score', fmt(G.score), (el, v) => el.textContent = v);
  setH('hMult', 'mult', G.mult.toFixed(1) + '|' + G.streak, (el) => { el.firstElementChild.textContent = 'x' + G.mult.toFixed(1); el.classList.toggle('hot', G.mult >= 3); });
  setH('hStreak', 'streak', G.streak, (el, v) => el.textContent = 'STREAK ' + v);
  setH('hWave', 'wave', G.tut ? 'TRAINING' : 'WAVE ' + G.wave, (el, v) => el.textContent = v);
  const wp = G.waveTotal ? Math.round(G.waveDone / G.waveTotal * 100) : 0;
  setH('hWaveBar', 'wp', wp, (el, v) => el.firstElementChild.style.width = v + '%');
  setH('hHearts', 'hp', P.hp + '/' + P.maxHp, (el) => {
    let h = '';
    if(P.maxHp > 8) h = `<span class="h">♥</span> ${P.hp}/${P.maxHp}`;
    else for(let i = 0; i < P.maxHp; i++) h += `<span class="h${i < P.hp ? '' : ' e'}">♥</span>`;
    el.innerHTML = h; el.classList.toggle('pulse', P.hp === 1);
  });
  setH('hShards', 'sh', Math.floor(G.runShards), (el, v) => el.lastElementChild.textContent = fmt(v));
  const b = G.boss && !G.boss.dead ? G.boss : null;
  setH('bossBar', 'boss', b ? b.name : '', (el, v) => { el.classList.toggle('hidden', !v); $('bossName').textContent = v; });
  if(b) setH('bossHp', 'bhp', Math.round(clamp(b.hp / b.maxHp, 0, 1) * 100), (el, v) => el.firstElementChild.style.width = v + '%');
}

/* ---------------- run flow ---------------- */
function startRun(daily){
  hideAll(); tip(null); $('toasts').innerHTML = '';
  for(const k in hudC) delete hudC[k];
  show('hud');
  newRun(daily);
  SDK.gameplayStart();
  AU.init(); AU.resume();
  if(G.tut) AU.setMusic(1, false);
}

function pauseGame(){
  if(G.state !== 'play') return;
  aimCancel(); G.state = 'pause'; SDK.gameplayStop();
  const b = $('pauseBuild'); b.innerHTML = '';
  for(const u of UPS){ const l = G.up[u.id]; if(l && u.id !== 'heal') b.insertAdjacentHTML('beforeend', `<span style="color:${RAR[u.rar].c}">${u.icon} ${u.name}${u.max > 1 ? ' ' + l : ''}</span>`); }
  if(!b.innerHTML) b.innerHTML = '<span style="color:var(--dim)">No powers yet</span>';
  show('pause');
}
function resumeGame(){ hide('pause'); G.state = 'play'; SDK.gameplayStart(); AU.resume(); }

let cardsGuard = 0;
function openCards(kind){
  G.state = 'cards'; G.cardKind = kind; aimCancel(); SDK.gameplayStop(); tip(null);
  $('cardsTitle').textContent = kind === 'start' ? 'STARTING POWER' : 'WAVE ' + G.wave + ' CLEARED';
  G.offers = buildOffers(3); renderCards();
  show('cards'); AU.card(); AU.setMusic(1, false);
  cardsGuard = performance.now() + 380;
}
function buildOffers(n){
  const pool = UPS.filter(u => (G.up[u.id] || 0) < u.max && (!u.cond || u.cond()));
  const out = [];
  while(out.length < n && pool.length){
    const tot = pool.reduce((s, u) => s + RAR[u.rar].w, 0);
    let r = grng() * tot, i = 0;
    for(; i < pool.length; i++){ r -= RAR[pool[i].rar].w; if(r <= 0) break; }
    out.push(pool.splice(Math.min(i, pool.length - 1), 1)[0]);
  }
  return out;
}
function rerollCost(){ return 20 + G.rerolls * 15; }
function renderCards(){
  const row = $('cardRow'); row.innerHTML = '';
  G.offers.forEach((u, i) => {
    const lv = G.up[u.id] || 0, rc = RAR[u.rar];
    const d = document.createElement('div'); d.className = 'card'; d.style.setProperty('--c', rc.c); d.style.animationDelay = (i * .07) + 's';
    d.innerHTML = `<div class="ci">${u.icon}</div><div class="cr">${rc.n}</div><div class="cn">${u.name}</div><div class="cd">${u.desc}</div>` +
      (u.max > 1 && u.max < 99 ? `<div class="cl">LV ${lv} → ${lv + 1}</div>` : '<div class="cl">&nbsp;</div>') + `<div class="ck">${i + 1}</div>`;
    d.addEventListener('click', e => { e.stopPropagation(); pickCard(i); });
    row.appendChild(d);
  });
  const c = rerollCost();
  $('rerollCost').textContent = c;
  $('rerollBtn').disabled = G.runShards < c;
}
function pickCard(i){
  if(G.state !== 'cards' || performance.now() < cardsGuard) return;
  const u = G.offers[i]; if(!u) return;
  AU.init(); AU.levelUp();
  G.up[u.id] = (G.up[u.id] || 0) + 1;
  if(u.id === 'heal') P.hp = Math.min(P.maxHp, P.hp + 1);
  if(u.id === 'heart'){ P.maxHp++; P.hp = P.maxHp; }
  calcStats();
  if(u.id === 'charge') P.ch = Math.min(ST.maxCh, P.ch + 1);
  P.focus = ST.focus;
  hide('cards'); G.state = 'play'; SDK.gameplayStart();
  toast(u.name.toUpperCase(), u.desc, RAR[u.rar].c, 1800);
  if(G.cardKind === 'start') startWave(1); else startWave(G.wave + 1);
}

/* ---------------- death / revive / over ---------------- */
const REVIVE_COST = 150;
const TIPS = [
  'Kill after a wall bounce for a <b>BANK SHOT</b> — up to +150% score.',
  'Every kill while airborne <b>refunds a fling</b>. Re-aim mid-flight to keep the chain alive.',
  'Landing a fling with zero kills <b>resets your streak</b> multiplier.',
  'Wardens only block from the front — <b>bank off a wall</b> and hit them from behind.',
  'Bombers chain-react. Lure a crowd, then pop one for a <b>huge chain</b>.',
  'Flying through enemy bolts at speed <b>shatters</b> them for points.',
  'A short drag = a soft fling. Soft flings are great for precise hits.',
  'Spikers only break at <b>OVERDRIVE</b> — the first split-second of a full-power fling.',
  'Shards buy permanent upgrades and new cores in the <b>SHOP</b>.',
  'The <b>Daily Challenge</b> is the same for everyone today. Can you top it?',
];
let revIV = 0;
function onDeathDone(){
  const canPay = save.shards + G.runShards >= REVIVE_COST;
  if(!G.revived && G.wave >= 2 && (SDK.canRewarded() || canPay)) openRevive();
  else gameOver();
}
function openRevive(){
  G.state = 'revive'; SDK.gameplayStop();
  $('revAdBtn').classList.toggle('hidden', !SDK.canRewarded());
  const canPay = save.shards + G.runShards >= REVIVE_COST;
  $('revPayBtn').classList.toggle('hidden', !canPay);
  $('revCost').textContent = REVIVE_COST;
  let left = 6; $('revNum').textContent = left; $('revArc').style.transition = 'none'; $('revArc').style.strokeDashoffset = '0';
  void $('revArc').offsetWidth; $('revArc').style.transition = 'stroke-dashoffset 6s linear'; $('revArc').style.strokeDashoffset = '276.5';
  show('revive');
  clearInterval(revIV);
  revIV = setInterval(() => { if(SDK.adBusy) return; left--; $('revNum').textContent = Math.max(0, left); if(left <= 0){ clearInterval(revIV); hide('revive'); gameOver(); } }, 1000);
}
function doRevive(){
  clearInterval(revIV); hide('revive');
  G.revived = true; G.state = 'play';
  P.hp = Math.min(P.maxHp, 2); P.inv = 2.5; P.vx = P.vy = 0; P.ch = ST.maxCh; P.focus = ST.focus;
  G.B.length = 0;
  for(const e of G.E){ const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1; if(d < 260){ e.vx = dx / d * 600; e.vy = dy / d * 600; } }
  shock(P.x, P.y, 320, '#27f3ff', 8); burst(P.x, P.y, 50, '#27f3ff', 500); AU.levelUp();
  announce('REVIVED', '#27f3ff');
  AU.setMusic(G.boss ? 3 : 2, !!G.boss);
  SDK.gameplayStart();
}

function gameOver(){
  clearInterval(revIV);
  G.state = 'over'; aimCancel(); SDK.gameplayStop(); tip(null); AU.setMusic(0, false);
  hide('hud'); hideAll(); $('toasts').innerHTML = '';
  commitMissions();
  const shards = Math.round(G.runShards);
  save.shards += shards; save.runs++;
  const newBest = G.score > save.best;
  if(newBest) save.best = G.score;
  save.bestWave = Math.max(save.bestWave, G.wave);
  save.bestChain = Math.max(save.bestChain, G.maxChain);
  let extra = '';
  if(G.daily){
    const k = todayKey();
    if(save.daily.key !== k) save.daily = { key:k, best:0, bonus:false };
    save.daily.best = Math.max(save.daily.best, G.score);
    if(!save.daily.bonus){ save.daily.bonus = true; save.shards += 75; extra = `<div class="oM"><span>Daily challenge played</span><b>+75 ◈</b></div>`; }
  }
  // xp & level
  const xp0 = save.xp, lv0 = save.level;
  save.xp += Math.floor(G.score / 25 + G.wave * 25 + G.kills * 2);
  let lvls = 0;
  while(save.xp >= xpNeed(save.level)){ save.xp -= xpNeed(save.level); save.level++; lvls++; save.shards += 40; }
  writeSave();

  $('oTitle').textContent = G.daily ? 'DAILY: ' + G.mod.name : 'RUN OVER';
  $('oTag').classList.toggle('hidden', !(newBest && G.score > 0));
  $('oWave').textContent = G.wave; $('oChain').textContent = G.maxChain; $('oKills').textContent = fmt(G.kills); $('oShards').textContent = '+' + fmt(shards);
  $('oLevel').textContent = save.level;
  const bar = $('oLvlBar');
  bar.style.transition = 'none'; bar.style.width = (lvls ? 0 : xp0 / xpNeed(lv0) * 100) + '%'; void bar.offsetWidth;
  bar.style.transition = ''; setTimeout(() => bar.style.width = (save.xp / xpNeed(save.level) * 100) + '%', 60);
  let mh = extra;
  if(lvls) mh += `<div class="oM"><span>LEVEL UP! Now level ${save.level}</span><b>+${lvls * 40} ◈</b></div>`;
  for(const m of save.missions) if(m.fresh){ mh += `<div class="oM"><span>✔ ${m.txt}</span><b>+${m.reward} ◈</b></div>`; m.fresh = false; }
  $('oMissions').innerHTML = mh;
  $('oNext').innerHTML = save.best <= 0 ? '' : newBest ? 'You beat your record!' : `Best <b>${fmt(save.best)}</b> — only <b>${fmt(save.best - G.score + 1)}</b> more to beat it`;
  $('oTip').innerHTML = 'TIP: ' + pick(TIPS);
  $('dblBtn').classList.toggle('hidden', !SDK.canRewarded() || shards <= 0); $('dblBtn').disabled = false;
  G.lastShards = shards;
  // count-up
  const el = $('oScore'), target = G.score, t0 = performance.now();
  (function tick(){ const k = Math.min(1, (performance.now() - t0) / 900); el.textContent = fmt(target * (1 - Math.pow(1 - k, 3))); if(k < 1) requestAnimationFrame(tick); })();
  show('over');
  if(newBest && G.score > 0){ SDK.happytime(); AU.levelUp(); }
}

function goMenu(){
  G.state = 'menu'; P = null; SDK.gameplayStop(); AU.setMusic(0, false);
  for(const k of ['E','B','PT','POP','SH','PK','SP','FL','ZP','TM','EC']) G[k].length = 0;
  G.boss = null; G.shake = 0; G.flash = 0; G.timeScale = 1;
  hideAll(); hide('hud'); tip(null);
  rollMissions(); persist();
  refreshMenu(); show('menu');
}
function refreshMenu(){
  $('mShards').textContent = fmt(save.shards);
  $('mLevel').textContent = save.level;
  $('mLvlBar').style.width = (save.xp / xpNeed(save.level) * 100) + '%';
  $('mBest').textContent = fmt(save.best); $('mBestWave').textContent = save.bestWave; $('mBestChain').textContent = save.bestChain;
  const seed = hashStr('chainfling:' + todayKey()), mod = MODS[seed % MODS.length];
  const today = save.daily.key === todayKey();
  $('dailyMod').textContent = mod.name + ' — ' + mod.desc + (today && save.daily.best ? '  ·  BEST ' + fmt(save.daily.best) : !today || !save.daily.bonus ? '  ·  +75 ◈ BONUS' : '');
  $('missDot').classList.toggle('hidden', !save.mNew);
}

/* ---------------- shop ---------------- */
let shopTab = 'up';
function openShop(){ hideAll(); renderShop(); show('shop'); }
function renderShop(){
  $('sShards').textContent = fmt(save.shards);
  document.querySelectorAll('#shop .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === shopTab));
  const L = $('shopList'); L.innerHTML = '';
  if(shopTab === 'up'){
    for(const m of META){
      const lv = save.meta[m.id] || 0, max = m.costs.length, cost = m.costs[lv];
      const it = document.createElement('div'); it.className = 'item';
      it.innerHTML = `<div class="ii" style="color:var(--cy)">${m.icon}</div><div class="it"><b>${m.name}</b><span>${m.desc}</span><div class="pips">${Array.from({ length:max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>`;
      const b = document.createElement('button'); b.className = 'btn';
      if(lv >= max){ b.textContent = 'MAX'; b.disabled = true; }
      else { b.innerHTML = `<span class="gem">◈</span> ${fmt(cost)}`; b.disabled = save.shards < cost; onTap(b, () => { if(save.shards < cost) return; save.shards -= cost; save.meta[m.id] = lv + 1; AU.levelUp(); persist(); renderShop(); }); }
      it.appendChild(b); L.appendChild(it);
    }
  } else {
    for(const s of SKINS){
      const own = save.skins.includes(s.id), eq = save.skin === s.id;
      const sw = s.col === 'prism' ? 'background:conic-gradient(#ff3b5c,#ffb020,#b6ff3c,#27f3ff,#b46bff,#ff3b5c)' : `background:${s.col};box-shadow:0 0 16px ${s.col}`;
      const it = document.createElement('div'); it.className = 'item';
      it.innerHTML = `<div class="ii"><i style="width:22px;height:22px;border-radius:50%;display:block;${sw}"></i></div><div class="it"><b>${s.name} Core</b><span>${own ? (eq ? 'Equipped' : 'Owned') : 'Cosmetic core & trail'}</span></div>`;
      const b = document.createElement('button'); b.className = 'btn';
      if(eq){ b.textContent = 'EQUIPPED'; b.disabled = true; }
      else if(own){ b.textContent = 'EQUIP'; onTap(b, () => { save.skin = s.id; persist(); renderShop(); }); }
      else { b.innerHTML = `<span class="gem">◈</span> ${fmt(s.cost)}`; b.disabled = save.shards < s.cost; onTap(b, () => { if(save.shards < s.cost) return; save.shards -= s.cost; save.skins.push(s.id); save.skin = s.id; AU.levelUp(); persist(); renderShop(); }); }
      it.appendChild(b); L.appendChild(it);
    }
  }
}

/* ---------------- missions ---------------- */
function openMissions(){
  hideAll(); save.mNew = false; persist();
  $('missDone').textContent = save.missionsDone;
  const L = $('missList'); L.innerHTML = '';
  for(const m of save.missions){
    const pct = Math.min(100, m.p / m.n * 100);
    L.insertAdjacentHTML('beforeend', `<div class="item${m.done ? ' done' : ''}"><div class="ii" style="color:var(--li)">${m.done ? '✔' : '◎'}</div><div class="it"><b>${m.txt}</b><span>${m.done ? 'Complete' : fmt(m.p) + ' / ' + fmt(m.n)}</span><div class="mBar"><i style="width:${pct}%"></i></div></div><div class="pill"><span class="gem">◈</span> ${m.reward}</div></div>`);
  }
  show('missions');
}

/* ---------------- settings ---------------- */
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
  onTap('playBtn', () => startRun(false));
  onTap('dailyBtn', () => startRun(true));
  onTap('shopBtn', openShop);
  onTap('missBtn', openMissions);
  onTap('setBtn', () => openSettings('menu'));
  onTap('pauseBtn', pauseGame);
  onTap('resumeBtn', resumeGame);
  onTap('pSetBtn', () => openSettings('pause'));
  onTap('quitBtn', () => askConfirm('End this run? You keep your shards.', () => { hide('pause'); gameOver(); }));
  onTap('rerollBtn', () => { const c = rerollCost(); if(G.runShards < c) return; G.runShards -= c; G.rerolls++; G.offers = buildOffers(3); renderCards(); cardsGuard = performance.now() + 200; });
  onTap('revAdBtn', () => SDK.rewarded(ok => { if(ok) doRevive(); else toast('AD UNAVAILABLE', 'Try again in a moment.', '#ff3b5c'); }));
  onTap('revPayBtn', () => { const fromRun = Math.min(G.runShards, REVIVE_COST); G.runShards -= fromRun; save.shards -= REVIVE_COST - fromRun; doRevive(); });
  onTap('revNoBtn', () => { clearInterval(revIV); hide('revive'); gameOver(); });
  onTap('retryBtn', () => { const d = G.daily; SDK.midgame(() => startRun(d)); });
  onTap('oMenuBtn', () => SDK.midgame(goMenu));
  onTap('dblBtn', () => { $('dblBtn').disabled = true; SDK.rewarded(ok => { if(ok){ save.shards += G.lastShards; writeSave(); $('oShards').textContent = '+' + fmt(G.lastShards * 2); toast('SHARDS DOUBLED', '+' + G.lastShards + ' ◈', '#27f3ff'); } else $('dblBtn').disabled = false; }); });
  document.querySelectorAll('.backBtn').forEach(b => onTap(b, () => {
    const inSettings = !$('settings').classList.contains('hidden');
    hideAll();
    if(inSettings && setBack === 'pause'){ show('pause'); return; }
    refreshMenu(); show('menu');
  }));
  document.querySelectorAll('#shop .tab').forEach(t => onTap(t, () => { shopTab = t.dataset.tab; renderShop(); }));
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.addEventListener('change', () => { save.opt[i.dataset.opt] = i.checked; AU.apply(); persist(); }));
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => onTap(b, () => {
    save.opt[s.dataset.opt] = b.dataset.v; persist(); syncSettings();
    if(s.dataset.opt === 'quality') applyQuality();
  })));
  onTap('replayTut', () => { save.tut = false; persist(); toast('TUTORIAL', 'It will play at the start of your next run.', '#27f3ff'); });

  // gameplay input: drag anywhere on the canvas
  cv.addEventListener('pointerdown', e => {
    AU.init(); AU.resume();
    if(G.state !== 'play') return;
    e.preventDefault();
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    aimStart(e.clientX, e.clientY, e.pointerId);
  });
  addEventListener('pointermove', e => aimMove(e.clientX, e.clientY, e.pointerId), { passive:true });
  addEventListener('pointerup', e => aimEnd(e.pointerId));
  addEventListener('pointercancel', () => aimCancel());
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('pointerdown', () => { AU.init(); AU.resume(); }, { capture:true });

  addEventListener('keydown', e => {
    AU.init(); AU.resume();
    const k = e.key;
    if([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(k)) e.preventDefault();
    if(e.repeat) return;
    if(k === 'Escape' || k === 'p' || k === 'P'){
      if(G.state === 'play') pauseGame();
      else if(G.state === 'pause' && $('settings').classList.contains('hidden') && $('confirm').classList.contains('hidden')) resumeGame();
      return;
    }
    if(G.state === 'cards' && ['1', '2', '3'].includes(k)) pickCard(+k - 1);
    else if(G.state === 'over' && (k === 'Enter' || k === ' ')) $('retryBtn').click();
    else if(G.state === 'menu' && !$('menu').classList.contains('hidden') && (k === 'Enter' || k === ' ')) $('playBtn').click();
  });

  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 200));
  document.addEventListener('visibilitychange', () => {
    AU.setHidden(document.hidden);
    if(document.hidden){ if(G.state === 'play') pauseGame(); }
    else AU.resume();
  });
  addEventListener('blur', () => { if(G.state === 'play') pauseGame(); });
}

/* ---------------- loop ---------------- */
let last = 0, pfT = 0, pfN = 0, pfSum = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return;
  if(dt > .05) dt = .05;
  // adaptive quality (auto only)
  if(save.opt.quality === 'auto' && (G.state === 'play' || G.state === 'menu')){
    pfSum += dt; pfN++; pfT += dt;
    if(pfT > 2.5){
      const avg = pfSum / pfN; pfT = pfSum = pfN = 0;
      if(avg > 1 / 42 && G.q !== 'low'){ G.autoQ = G.q === 'high' ? 'mid' : 'low'; G.q = G.autoQ; resize(); }
    }
  }
  try{
    if(G.state === 'play' || G.state === 'dying') update(dt);
    else if(G.state === 'menu') menuDemo(dt);
    render();
    if(P && (G.state === 'play' || G.state === 'dying')) updateHUD();
  }catch(err){ console.error(err); }
}

/* errors outside the loop must never surface as uncaught exceptions in the portal iframe */
addEventListener('error', e => { try{ console.error(e.error || e.message); }catch(_){} });
addEventListener('unhandledrejection', e => { try{ e.preventDefault(); console.error(e.reason); }catch(_){} });

/* ---------------- boot ---------------- */
(async function boot(){
  G.q = 'high';
  resize();
  requestAnimationFrame(frame);
  SDK.onMute = m => AU.setPortalMute(m);
  await SDK.init();            // must resolve before the save is read (SDK data module)
  SDK.loadingStart();
  loadSave();
  applyQuality();
  wire();
  if(!save.missions.length) save.mNew = true;
  goMenu();
  SDK.loadingStop();
  $('boot').classList.add('gone');
  setTimeout(() => $('boot').remove(), 500);
  // test/debug hook (harmless in production)
  window.__cf = { G, get P(){ return P; }, save:() => save, startRun, launch, openCards, pickCard };
})();
