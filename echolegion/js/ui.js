'use strict';
const SCREENS = ['menu', 'cards', 'pause', 'revive', 'over', 'shop', 'missions', 'settings', 'confirm'];
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
function hideAll(){ SCREENS.forEach(hide); }
function onTap(id, fn){ const el = typeof id === 'string' ? $(id) : id; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }
const isTouch = () => matchMedia('(pointer:coarse)').matches;

/* ---------------- feedback ---------------- */
let annT = 0;
function announce(txt, col, sub){
  if(G.state !== 'play' && G.state !== 'cards') return;
  const a = $('announce');
  a.innerHTML = txt + (sub ? '<small>' + sub + '</small>' : '');
  a.style.color = '#fff';
  a.style.textShadow = `4px 0 0 ${col || '#fff'}, -4px 0 0 rgba(39,243,255,.7), 0 0 30px ${col || '#fff'}`;
  a.classList.remove('go'); void a.offsetWidth; a.classList.add('go');
  clearTimeout(annT); annT = setTimeout(() => a.classList.remove('go'), 1250);
}
function tip(html){ const t = $('tip'); if(!html){ t.classList.add('hidden'); return; } t.innerHTML = html; t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; }
function toast(title, body, col, dur){
  if(G.state !== 'play' && G.state !== 'over' && G.state !== 'cards') return;
  const host = $('toasts');
  while(host.children.length >= 3) host.firstChild.remove();
  const d = document.createElement('div'); d.className = 'toast';
  d.innerHTML = `<b style="color:${col || '#27f3ff'}">${title}</b>${body || ''}`;
  host.appendChild(d);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 320); }, dur || 2800);
}

/* ---------------- HUD ---------------- */
const hudC = {};
function setH(key, val, fn){ if(hudC[key] === val) return; hudC[key] = val; fn(val); }
function updateHUD(){
  setH('hp', P.hp + '/' + P.maxHp, () => { let h = ''; for(let i = 0; i < P.maxHp; i++) h += `<i class="${i < P.hp ? '' : 'e'}"></i>`; $('hHearts').innerHTML = h; $('hHearts').classList.toggle('pulse', P.hp === 1); });
  setH('score', fmt(G.score), v => $('hScore').textContent = v);
  setH('shards', Math.floor(G.shardsRun), v => $('hShards').lastElementChild.textContent = fmt(v));
  setH('wave', G.wave, v => $('hWave').textContent = 'WAVE ' + Math.max(1, v));
  setH('ech', G.EC.length + '/' + maxEchoes(), () => { let h = ''; for(let i = 0; i < maxEchoes(); i++) h += `<i class="${i < G.EC.length ? '' : 'e'}">${ROMAN[Math.min(7, i)]}</i>`; $('hEchoes').innerHTML = h; });
  setH('combo', G.combo, v => { const c = $('combo'); c.classList.toggle('on', v >= 5); c.classList.toggle('hot', v >= 40); c.firstElementChild.textContent = v; });
  setH('boss', G.boss ? 1 : 0, v => { $('bossBar').classList.toggle('hidden', !v); if(v) $('bossName').textContent = G.boss.name; });
  if(G.boss) setH('bhp', Math.round(G.boss.hp / G.boss.maxHp * 100), v => $('bossHp').firstElementChild.style.width = clamp(v, 0, 100) + '%');
  const u = Math.floor(G.ult);
  setH('ult', u, v => { $('ultBar').querySelector('i').style.width = v + '%'; $('ultBar').classList.toggle('ready', v >= 100); $('ultBtn').classList.toggle('ready', v >= 100); $('ultBtn').firstElementChild.style.transform = `scaleY(${v / 100})`; $('ultTxt').textContent = v >= 100 ? (isTouch() ? 'LEGION READY' : 'LEGION READY [E]') : 'LEGION'; });
  const sc = P.slamCd > 0 ? Math.round((1 - P.slamCd / slamCdMax()) * 20) : 20;
  setH('slam', sc, v => $('slamBtn').firstElementChild.style.transform = `scaleY(${v / 20})`);
}

/* ---------------- run flow ---------------- */
function startRun(daily){
  hideAll(); tip(null); $('toasts').innerHTML = '';
  for(const k in hudC) delete hudC[k];
  P = null;
  show('hud'); const t = isTouch(); $('slamBtn').classList.toggle('hidden', !t); $('ultBtn').classList.toggle('hidden', !t);
  newRun(daily);
  SDK.gameplayStart();
  AU.init(); AU.resume();
}
function releaseInput(){ IN.joy = null; IN.keys = {}; }
function pauseGame(){
  if(G.state !== 'play') return;
  G.state = 'pause'; SDK.gameplayStop(); releaseInput();
  const b = $('pauseBuild'); b.innerHTML = '';
  for(const u of PERKS){ const l = G.up[u.id]; if(l) b.insertAdjacentHTML('beforeend', `<span style="color:${RAR[u.rar].c}">${u.icon} ${u.name}${u.max > 1 ? ' ' + l : ''}</span>`); }
  if(!b.innerHTML) b.innerHTML = '<span style="color:var(--dim)">No powers yet</span>';
  show('pause');
}
function resumeGame(){ hide('pause'); G.state = 'play'; SDK.gameplayStart(); AU.resume(); }

let cardsGuard = 0;
function openCards(){
  const pool = PERKS.filter(u => (G.up[u.id] || 0) < u.max);
  if(!pool.length) return;
  G.state = 'cards'; SDK.gameplayStop(); releaseInput();
  $('cardsTitle').textContent = 'WAVE ' + G.wave + ' CLEARED';
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
  if(u.id === 'heart'){ P.maxHp++; P.hp = P.maxHp; }
  hide('cards'); G.state = 'play'; SDK.gameplayStart();
  toast(u.name.toUpperCase(), u.desc, RAR[u.rar].c, 1800);
}

/* ---------------- death / revive / over ---------------- */
const REVIVE_COST = 150;
let revIV = 0;
function onDeathDone(){
  const canPay = save.shards + G.shardsRun >= REVIVE_COST;
  if(!G.revived && G.wave >= 3 && (SDK.canRewarded() || canPay)) openRevive(); else gameOver();
}
function openRevive(){
  G.state = 'revive'; SDK.gameplayStop();
  $('revAdBtn').classList.toggle('hidden', !SDK.canRewarded());
  $('revPayBtn').classList.toggle('hidden', !(save.shards + G.shardsRun >= REVIVE_COST));
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
  P.hp = Math.min(P.maxHp, 3); P.inv = 2.5; P.vx = P.vy = 0;
  G.SH.length = 0; G.HZ = G.HZ.filter(h => h.kind === 'trail');
  for(const e of G.E){ const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1; if(d < 300 && !e.boss){ e.x = P.x + dx / d * 320; e.y = P.y + dy / d * 320; arenaClamp(e); } }
  slam(P.x, P.y, 0, 1);
  announce('REWOUND', '#27f3ff'); AU.ult();
  SDK.gameplayStart(); AU.setMusic(G.boss ? 3 : G.wave >= 4 ? 2 : 1);
}
const TIPS = [
  'Your echoes repeat <b>exactly</b> what you did. Circle the arena to make them sweep it for you.',
  'Hit a foe <b>together with an echo</b> for a SYNC STRIKE: up to triple damage.',
  'Dashing makes you <b>untouchable</b>. Dash straight through bolts and charges.',
  'Slashes <b>destroy enemy bolts</b>. Parry them!',
  'Echoes replay your <b>slams</b> too. Slam in busy spots.',
  'Kill <b>Echo Eaters</b> fast, or they will devour your legion.',
  '<b>LEGION</b> stops time, and every echo strikes with you. Save it for a crowd or a boss.',
  'Brutes glow orange before they charge. <b>Sidestep</b>, then punish.',
  'Shards unlock new blades and permanent upgrades in the <b>ARMORY</b>.',
];
function gameOver(){
  clearInterval(revIV);
  G.state = 'over'; SDK.gameplayStop(); tip(null); AU.setMusic(0); releaseInput();
  hide('hud'); hideAll(); $('toasts').innerHTML = '';
  commitMissions();
  let sh = Math.floor(G.shardsRun + G.score / 600 * shardMul()), extra = '';
  if(G.daily){
    const k = todayKey();
    if(save.daily.key !== k) save.daily = { key:k, best:0, bonus:false };
    save.daily.best = Math.max(save.daily.best, G.wave);
    if(!save.daily.bonus){ save.daily.bonus = true; sh += 50; extra = '<div class="oM"><span>Daily trial fought</span><b>+50 ◆</b></div>'; }
  }
  save.shards += sh; save.runs++;
  const newBest = G.score > save.best;
  save.best = Math.max(save.best, G.score); save.bestWave = Math.max(save.bestWave, G.wave);
  save.stats.kills += G.kills; save.stats.syncs += G.syncs;
  const xp0 = save.xp, lv0 = save.level;
  save.xp += Math.floor(G.score / 40 + G.kills * 2 + G.wave * 20);
  let lvls = 0;
  while(save.xp >= xpNeed(save.level)){ save.xp -= xpNeed(save.level); save.level++; lvls++; save.shards += 30; }
  writeSave();
  $('oTitle').textContent = G.daily ? 'DAILY: ' + G.mod.name : 'DEFEATED';
  $('oTag').classList.toggle('hidden', !newBest);
  $('oKills').textContent = fmt(G.kills); $('oCombo').textContent = fmt(G.maxCombo); $('oShards').textContent = '+' + fmt(sh);
  $('oLevel').textContent = save.level;
  const bar = $('oLvlBar'); bar.style.transition = 'none'; bar.style.width = (lvls ? 0 : xp0 / xpNeed(lv0) * 100) + '%'; void bar.offsetWidth;
  bar.style.transition = ''; setTimeout(() => bar.style.width = (save.xp / xpNeed(save.level) * 100) + '%', 60);
  let mh = extra;
  if(lvls) mh += `<div class="oM"><span>LEVEL UP! Now level ${save.level}</span><b>+${lvls * 30} ◆</b></div>`;
  for(const q of save.missions) if(q.fresh){ mh += `<div class="oM"><span>✔ ${q.txt}</span><b>+${q.reward} ◆</b></div>`; q.fresh = false; }
  $('oMissions').innerHTML = mh;
  $('oNext').innerHTML = newBest ? 'Your highest score ever!' : `Best: <b>wave ${save.bestWave}</b> · <b>${fmt(save.best)}</b> points`;
  $('oTip').innerHTML = 'TIP: ' + pick(TIPS);
  $('dblBtn').classList.toggle('hidden', !SDK.canRewarded() || sh <= 0); $('dblBtn').disabled = false;
  G.lastShards = sh;
  $('oWave').textContent = 'WAVE ' + G.wave;
  const el = $('oScore'), t0 = performance.now(), sc = G.score;
  (function tick(){ const k = Math.min(1, (performance.now() - t0) / 900); el.textContent = fmt(sc * (1 - Math.pow(1 - k, 3))); if(k < 1) requestAnimationFrame(tick); })();
  show('over');
  if(newBest){ SDK.happytime(); AU.clear(); }
}
function goMenu(){
  G.state = 'menu'; SDK.gameplayStop(); AU.setMusic(0);
  for(const k of ['E','EC','SH','CR','PT','SD','POP','FX','TM','RF','PK','HZ','DC']) G[k].length = 0;
  P = null; G.up = {}; G.mod = null; G.combo = 0; G.shake = 0; G.flash = 0; G.impact = 0; G.tut = false; G.boss = null; G.ultT = 0; G.slow = 0; G.timeScale = 1;
  hideAll(); hide('hud'); tip(null);
  rollMissions(); persist();
  refreshMenu(); show('menu');
}
function refreshMenu(){
  $('mShards').textContent = fmt(save.shards);
  $('mLevel').textContent = save.level;
  $('mLvlBar').style.width = (save.xp / xpNeed(save.level) * 100) + '%';
  $('mWave').textContent = save.bestWave; $('mBest').textContent = fmt(save.best); $('mKills').textContent = fmt(save.stats.kills);
  const seed = hashStr('echolegion:' + todayKey()), mod = MODS[seed % MODS.length], today = save.daily.key === todayKey();
  $('dailyMod').textContent = mod.name + ': ' + mod.desc + (today && save.daily.best ? ' · BEST WAVE ' + save.daily.best : !today || !save.daily.bonus ? ' · +50 ◆' : '');
  $('missDot').classList.toggle('hidden', !save.mNew);
}

/* ---------------- shop / missions / settings ---------------- */
let shopTab = 'up';
function renderShop(){
  $('sShards').textContent = fmt(save.shards);
  document.querySelectorAll('#shop .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === shopTab));
  const L = $('shopList'); L.innerHTML = '';
  const row = (icon, title, sub, extraHtml, btnHtml, disabled, onBuy) => {
    const it = document.createElement('div'); it.className = 'item';
    it.innerHTML = `<div class="ii">${icon}</div><div class="it"><b>${title}</b><span>${sub}</span>${extraHtml || ''}</div>`;
    const b = document.createElement('button'); b.className = 'btn'; b.innerHTML = btnHtml; b.disabled = !!disabled; if(onBuy) onTap(b, onBuy);
    it.appendChild(b); L.appendChild(it);
  };
  const buy = c => { if(save.shards < c) return false; save.shards -= c; AU.pick(); persist(); return true; };
  if(shopTab === 'up'){
    for(const m of META){
      const lv = save.meta[m.id] || 0, max = m.costs.length, cost = m.costs[lv];
      row(`<span style="color:#27f3ff">${m.icon}</span>`, m.name, m.desc, `<div class="pips">${Array.from({ length:max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>`,
        lv >= max ? 'MAX' : `<span class="gold">◆</span> ${fmt(cost)}`, lv >= max || save.shards < cost, () => { if(buy(cost)){ save.meta[m.id] = lv + 1; renderShop(); } });
    }
  } else {
    for(const s of SKINS){
      const own = save.skins.includes(s.id), eq = save.skin === s.id;
      const sw = s.c2 === 'glitch' ? 'background:linear-gradient(90deg,#ff2e4d,#ffd23c,#39ffb4,#27f3ff,#9b4bff)' : `background:linear-gradient(90deg,${s.c1},${s.c2});box-shadow:0 0 12px ${s.c2}`;
      row(`<i style="width:34px;height:8px;display:block;transform:skewX(-20deg);${sw}"></i>`, s.name, own ? (eq ? 'Equipped' : 'Owned') : 'New blade and echo colors', '',
        eq ? 'EQUIPPED' : own ? 'EQUIP' : `<span class="gold">◆</span> ${fmt(s.cost)}`, eq || (!own && save.shards < s.cost), () => { if(!own){ if(!buy(s.cost)) return; save.skins.push(s.id); } save.skin = s.id; persist(); renderShop(); });
    }
  }
}
function openMissions(){
  hideAll(); save.mNew = false; persist();
  $('missDone').textContent = save.missionsDone;
  const L = $('missList'); L.innerHTML = '';
  for(const m of save.missions){
    const pct = Math.min(100, m.p / m.n * 100);
    L.insertAdjacentHTML('beforeend', `<div class="item${m.done ? ' done' : ''}"><div class="ii" style="color:#39ffb4">${m.done ? '✔' : '⚔'}</div><div class="it"><b>${m.txt}</b><span>${m.done ? 'Complete' : fmt(m.p) + ' / ' + fmt(m.n)}</span><div class="mBar"><i style="width:${pct}%"></i></div></div><div class="pill"><span class="gold">◆</span> ${m.reward}</div></div>`);
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
  if(isTouch()) $('keysHint').textContent = 'Drag: move · Tap: dash-slash toward that spot · SLAM and LEGION buttons';
  onTap('playBtn', () => startRun(false));
  onTap('dailyBtn', () => startRun(true));
  onTap('shopBtn', () => { hideAll(); renderShop(); show('shop'); });
  onTap('missBtn', openMissions);
  onTap('setBtn', () => openSettings('menu'));
  onTap('pauseBtn', pauseGame);
  onTap('resumeBtn', resumeGame);
  onTap('pSetBtn', () => openSettings('pause'));
  onTap('quitBtn', () => askConfirm('End this run? You keep your shards.', () => { hide('pause'); gameOver(); }));
  onTap('revAdBtn', () => SDK.rewarded(ok => { if(ok) doRevive(); else toast('AD UNAVAILABLE', 'Try again in a moment.', '#ff2e4d'); }));
  onTap('revPayBtn', () => { const fr = Math.min(G.shardsRun, REVIVE_COST); G.shardsRun -= fr; save.shards -= REVIVE_COST - fr; doRevive(); });
  onTap('revNoBtn', () => { clearInterval(revIV); hide('revive'); gameOver(); });
  onTap('retryBtn', () => { const d = G.daily; SDK.midgame(() => startRun(d)); });
  onTap('oMenuBtn', () => SDK.midgame(goMenu));
  onTap('dblBtn', () => { $('dblBtn').disabled = true; SDK.rewarded(ok => { if(ok){ save.shards += G.lastShards; writeSave(); $('oShards').textContent = '+' + fmt(G.lastShards * 2); } else $('dblBtn').disabled = false; }); });
  document.querySelectorAll('.backBtn').forEach(b => onTap(b, () => {
    const inSettings = !$('settings').classList.contains('hidden');
    hideAll();
    if(inSettings && setBack === 'pause'){ show('pause'); return; }
    refreshMenu(); show('menu');
  }));
  document.querySelectorAll('#shop .tab').forEach(t => onTap(t, () => { shopTab = t.dataset.tab; renderShop(); }));
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.addEventListener('change', () => { save.opt[i.dataset.opt] = i.checked; AU.apply(); persist(); }));
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => onTap(b, () => { save.opt[s.dataset.opt] = b.dataset.v; persist(); syncSettings(); if(s.dataset.opt === 'quality') applyQuality(); })));
  onTap('replayTut', () => { save.tut = false; persist(); toast('TUTORIAL', 'It will play at the start of your next run.', '#27f3ff'); });

  const toWorld = (x, y) => [(x - W / 2) / G.camZ + G.camX, (y - H / 2) / G.camZ + G.camY];
  // mouse: steer toward the cursor, click to dash-slash, right click to slam.
  // touch: drag anywhere to move; a quick tap dash-slashes toward the tapped spot; buttons for SLAM and LEGION.
  cv.addEventListener('pointerdown', e => {
    AU.init(); AU.resume();
    if(G.state !== 'play') return;
    e.preventDefault();
    if(e.pointerType === 'mouse'){
      IN.mouse = true; IN.mx = e.clientX; IN.my = e.clientY;
      if(e.button === 2) trySlam(); else { const [x, y] = toWorld(e.clientX, e.clientY); tryDash(x, y); }
      return;
    }
    if(!IN.joy || !IN.joy.on){ IN.joy = { on:true, id:e.pointerId, ox:e.clientX, oy:e.clientY, x:e.clientX, y:e.clientY, moved:false, t0:performance.now() }; try{ cv.setPointerCapture(e.pointerId); }catch(_){} }
    else { const [x, y] = toWorld(e.clientX, e.clientY); tryDash(x, y); }
  });
  addEventListener('pointermove', e => {
    if(e.pointerType === 'mouse'){ IN.mouse = true; IN.mx = e.clientX; IN.my = e.clientY; return; }
    const j = IN.joy;
    if(j && j.on && e.pointerId === j.id){ j.x = e.clientX; j.y = e.clientY; if(!j.moved && Math.hypot(j.x - j.ox, j.y - j.oy) > 14) j.moved = true; }
  }, { passive:true });
  const up = e => {
    const j = IN.joy;
    if(j && e.pointerId === j.id){
      j.on = false;
      if(!j.moved && performance.now() - j.t0 < 300 && G.state === 'play'){ const [x, y] = toWorld(j.ox, j.oy); tryDash(x, y); }
    }
  };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  $('slamBtn').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); AU.init(); trySlam(); });
  $('ultBtn').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); AU.init(); tryUlt(); });
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
    if(G.state === 'play'){
      if(k === 'j'){ if(IN.mouse){ const [x, y] = aimWorld(); tryDash(x, y); } else tryDash(); }
      else if(k === ' ' || k === 'k') trySlam();
      else if(k === 'e' || k === 'l') tryUlt();
    }
    else if(G.state === 'cards' && ['1', '2', '3'].includes(k)) pickCard(+k - 1);
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
