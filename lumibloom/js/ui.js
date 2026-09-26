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
  a.style.color = col || '#fff';
  a.style.textShadow = `0 0 26px ${col || '#fff'}, 0 4px 0 rgba(30,10,60,.55)`;
  a.classList.remove('go'); void a.offsetWidth; a.classList.add('go');
  clearTimeout(annT); annT = setTimeout(() => a.classList.remove('go'), 1650);
}
function tip(html){ const t = $('tip'); if(!html){ t.classList.add('hidden'); return; } t.innerHTML = html; t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; }
function toast(title, body, col, dur){
  if(G.state !== 'play' && G.state !== 'over' && G.state !== 'cards') return;
  const host = $('toasts');
  while(host.children.length >= 3) host.firstChild.remove();
  const d = document.createElement('div'); d.className = 'toast';
  d.innerHTML = `<b style="color:${col || '#fff38a'}">${title}</b>${body || ''}`;
  host.appendChild(d);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 320); }, dur || 2800);
}

/* ---------------- HUD ---------------- */
const hudC = {};
function setH(key, val, fn){ if(hudC[key] === val) return; hudC[key] = val; fn(val); }
function updateHUD(){
  const lp = Math.round(G.light / G.maxLight * 100);
  setH('light', lp, v => $('hLight').firstElementChild.style.width = clamp(v, 0, 100) + '%');
  setH('low', lp < 25 ? 1 : 0, v => $('hLight').classList.toggle('low', !!v));
  setH('hour', G.hour, h => $('hHour').textContent = 'HOUR ' + h + ' · ' + hourPal(h).n);
  setH('score', fmt(G.score), v => $('hScore').textContent = v);
  setH('dust', Math.floor(G.dust), v => $('hDust').lastElementChild.textContent = fmt(v));
  setH('lvl', G.lvl, v => $('hGarden').querySelector('b').textContent = v);
  setH('gx', Math.round(G.gx / gardenNeed(G.lvl) * 100), v => $('hGarden').querySelector('i').style.width = clamp(v, 0, 100) + '%');
  setH('paint', paintPct().toFixed(1), v => $('hPaint').textContent = v + '%');
  setH('combo', G.chain, v => { const c = $('combo'); c.classList.toggle('on', v >= 2); c.classList.toggle('hot', v >= 8); c.firstElementChild.textContent = 'x' + v; });
  setH('boss', G.boss && G.boss.hp > 0 ? 1 : 0, v => $('bossBar').classList.toggle('hidden', !v));
  if(G.boss) setH('bhp', G.boss.hp, v => $('bossHp').firstElementChild.style.width = (v / 3 * 100) + '%');
  setH('boost', P.boost ? 1 : 0, v => $('boostBtn').classList.toggle('on', !!v));
}

/* ---------------- run flow ---------------- */
function startRun(daily){
  hideAll(); tip(null); $('toasts').innerHTML = '';
  for(const k in hudC) delete hudC[k];
  P = null;
  show('hud'); $('boostBtn').classList.toggle('hidden', !isTouch());
  newRun(daily);
  SDK.gameplayStart();
  AU.init(); AU.resume();
}
function releaseInput(){ IN.touch = null; IN.boost = false; IN.boostKey = false; IN.hasT = false; IN.keys = {}; }
function pauseGame(){
  if(G.state !== 'play') return;
  G.state = 'pause'; SDK.gameplayStop(); releaseInput();
  const b = $('pauseBuild'); b.innerHTML = '';
  for(const u of PERKS){ const l = G.up[u.id]; if(l) b.insertAdjacentHTML('beforeend', `<span style="color:${RAR[u.rar].c}">${u.icon} ${u.name}${u.max > 1 ? ' ' + l : ''}</span>`); }
  if(!b.innerHTML) b.innerHTML = '<span style="color:var(--dim)">No blessings yet</span>';
  show('pause');
}
function resumeGame(){ hide('pause'); G.state = 'play'; SDK.gameplayStart(); AU.resume(); }

let cardsGuard = 0;
function openCards(){
  const pool = PERKS.filter(u => (G.up[u.id] || 0) < u.max);
  if(!pool.length) return;
  G.state = 'cards'; SDK.gameplayStop(); releaseInput();
  $('cardsTitle').textContent = 'GARDEN LV ' + G.lvl;
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
  AU.init(); AU.levelUp();
  G.up[u.id] = (G.up[u.id] || 0) + 1;
  if(u.id === 'heart'){ G.maxLight += 25; G.light = G.maxLight; }
  hide('cards'); G.state = 'play'; SDK.gameplayStart();
  toast(u.name.toUpperCase(), u.desc, RAR[u.rar].c, 1800);
}

/* ---------------- death / revive / over ---------------- */
const REVIVE_COST = 100;
let revIV = 0;
function onDeathDone(){
  const canPay = save.dust + G.dust >= REVIVE_COST;
  if(!G.revived && G.t > 45 && (SDK.canRewarded() || canPay)) openRevive(); else gameOver();
}
function openRevive(){
  G.state = 'revive'; SDK.gameplayStop();
  $('revAdBtn').classList.toggle('hidden', !SDK.canRewarded());
  $('revPayBtn').classList.toggle('hidden', !(save.dust + G.dust >= REVIVE_COST));
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
  G.light = G.maxLight * .7; P.inv = 2.5; P.vx = P.vy = 0;
  G.T.length = 0;
  for(const e of G.E){ const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1; if(d < 320 && !e.boss){ e.x = P.x + dx / d * 340; e.y = P.y + dy / d * 340; } }
  G.FX.push({ ring:true, x:P.x, y:P.y, r:0, max:320, life:.5, max0:.5, c:'#ffd98a' });
  AU.levelUp(); announce('REKINDLED', '#ffd98a');
  SDK.gameplayStart(); AU.setMusic(G.boss ? 3 : G.hour >= 3 ? 2 : 1);
}
const TIPS = [
  'Loop <b>many buds at once</b> for HARMONY: more light, more points.',
  'Keep looping quickly to build a <b>glow chain</b>. Each link raises the melody.',
  'Glooms only drift near you. <b>Circle around them</b> to set them free as butterflies.',
  '<b>Butterflies</b> you free will fly off and bloom buds for you.',
  'Snippers and Broods <b>snap your ribbon</b>. Close your loop before they touch it!',
  'Every garden level lets you <b>choose a blessing</b>.',
  'Hold the mouse button, SPACE or the BOOST button to <b>fly faster</b> (it uses light).',
  'Big loops <b>paint more of the meadow</b>. Every 10% painted gives stardust.',
  'The <b>Hush</b> rises every 5th hour. Loop around it three times to free it.',
  'Stardust unlocks new <b>spirits</b> and upgrades in the SHOP.',
];
function gameOver(){
  clearInterval(revIV);
  G.state = 'over'; SDK.gameplayStop(); tip(null); AU.setMusic(0); releaseInput();
  hide('hud'); hideAll(); $('toasts').innerHTML = '';
  commitMissions();
  let dust = Math.floor(G.dust + G.score / 500 * dustMul()), extra = '';
  const pct = +paintPct().toFixed(1);
  if(G.daily){
    const k = todayKey();
    if(save.daily.key !== k) save.daily = { key:k, best:0, bonus:false };
    save.daily.best = Math.max(save.daily.best, G.score);
    if(!save.daily.bonus){ save.daily.bonus = true; dust += 40; extra = '<div class="oM"><span>Daily meadow played</span><b>+40 ✦</b></div>'; }
  }
  save.dust += dust; save.runs++;
  const newBest = G.score > save.best;
  save.best = Math.max(save.best, G.score); save.bestBlooms = Math.max(save.bestBlooms, G.blooms);
  save.bestPaint = Math.max(save.bestPaint, pct); save.bestHour = Math.max(save.bestHour, G.hour);
  save.stats.blooms += G.blooms; save.stats.purified += G.purified;
  const xp0 = save.xp, lv0 = save.level;
  save.xp += Math.floor(G.score / 40 + G.blooms * 2 + G.t);
  let lvls = 0;
  while(save.xp >= xpNeed(save.level)){ save.xp -= xpNeed(save.level); save.level++; lvls++; save.dust += 30; }
  writeSave();
  $('oTitle').textContent = G.daily ? 'DAILY: ' + G.mod.name : 'THE NIGHT RESTS';
  $('oTag').classList.toggle('hidden', !newBest);
  $('oSub').textContent = pct + '% PAINTED · HOUR ' + G.hour;
  $('oBlooms').textContent = fmt(G.blooms); $('oFreed').textContent = fmt(G.purified); $('oHarm').textContent = 'x' + G.bestHarm; $('oDust').textContent = '+' + fmt(dust);
  $('oLevel').textContent = save.level;
  const bar = $('oLvlBar'); bar.style.transition = 'none'; bar.style.width = (lvls ? 0 : xp0 / xpNeed(lv0) * 100) + '%'; void bar.offsetWidth;
  bar.style.transition = ''; setTimeout(() => bar.style.width = (save.xp / xpNeed(save.level) * 100) + '%', 60);
  let mh = extra;
  if(lvls) mh += `<div class="oM"><span>LEVEL UP! Now level ${save.level}</span><b>+${lvls * 30} ✦</b></div>`;
  for(const q of save.missions) if(q.fresh){ mh += `<div class="oM"><span>✔ ${q.txt}</span><b>+${q.reward} ✦</b></div>`; q.fresh = false; }
  $('oMissions').innerHTML = mh;
  $('oNext').innerHTML = newBest ? 'Your most beautiful night yet!' : `Best: <b>${fmt(save.best)}</b>. Only <b>${fmt(save.best - G.score)}</b> to go`;
  $('oTip').innerHTML = 'TIP: ' + pick(TIPS);
  $('dblBtn').classList.toggle('hidden', !SDK.canRewarded() || dust <= 0); $('dblBtn').disabled = false;
  G.lastDust = dust;
  try{ drawMeadowSnap($('oSnap')); }catch(e){}
  const el = $('oScore'), t0 = performance.now(), sc = G.score;
  (function tick(){ const k = Math.min(1, (performance.now() - t0) / 900); el.textContent = fmt(sc * (1 - Math.pow(1 - k, 3))); if(k < 1) requestAnimationFrame(tick); })();
  show('over');
  if(newBest){ SDK.happytime(); AU.levelUp(); }
}
function goMenu(){
  G.state = 'menu'; SDK.gameplayStop(); AU.setMusic(0); AU.setKey(0);
  P = null; G.up = {}; G.mod = null; G.chain = 0; G.shake = 0; G.flash = 0; G.tut = false; G.boss = null;
  hideAll(); hide('hud'); tip(null);
  rollMissions(); persist();
  refreshMenu(); show('menu');
}
function refreshMenu(){
  $('mDust').textContent = fmt(save.dust);
  $('mLevel').textContent = save.level;
  $('mLvlBar').style.width = (save.xp / xpNeed(save.level) * 100) + '%';
  $('mBest').textContent = fmt(save.best); $('mBlooms').textContent = fmt(save.stats.blooms); $('mPaint').textContent = save.bestPaint + '%';
  const seed = hashStr('lumibloom:' + todayKey()), mod = MODS[seed % MODS.length], today = save.daily.key === todayKey();
  $('dailyMod').textContent = mod.name + ': ' + mod.desc + (today && save.daily.best ? ' · BEST ' + fmt(save.daily.best) : !today || !save.daily.bonus ? ' · +40 ✦' : '');
  $('missDot').classList.toggle('hidden', !save.mNew);
}

/* ---------------- shop / missions / settings ---------------- */
let shopTab = 'up';
function renderShop(){
  $('sDust').textContent = fmt(save.dust);
  document.querySelectorAll('#shop .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === shopTab));
  const L = $('shopList'); L.innerHTML = '';
  const row = (icon, title, sub, extraHtml, btnHtml, disabled, onBuy) => {
    const it = document.createElement('div'); it.className = 'item';
    it.innerHTML = `<div class="ii">${icon}</div><div class="it"><b>${title}</b><span>${sub}</span>${extraHtml || ''}</div>`;
    const b = document.createElement('button'); b.className = 'btn'; b.innerHTML = btnHtml; b.disabled = !!disabled; if(onBuy) onTap(b, onBuy);
    it.appendChild(b); L.appendChild(it);
  };
  const buy = c => { if(save.dust < c) return false; save.dust -= c; AU.levelUp(); persist(); return true; };
  if(shopTab === 'up'){
    for(const m of META){
      const lv = save.meta[m.id] || 0, max = m.costs.length, cost = m.costs[lv];
      row(`<span style="color:#ffd98a">${m.icon}</span>`, m.name, m.desc, `<div class="pips">${Array.from({ length:max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>`,
        lv >= max ? 'MAX' : `<span class="gold">✦</span> ${fmt(cost)}`, lv >= max || save.dust < cost, () => { if(buy(cost)){ save.meta[m.id] = lv + 1; renderShop(); } });
    }
  } else {
    for(const s of SKINS){
      const own = save.skins.includes(s.id), eq = save.skin === s.id;
      const sw = s.c2 === 'aurora' ? 'background:conic-gradient(#ff8fc8,#fff38a,#7dffc9,#8fd8ff,#c8a8ff,#ff8fc8)' : `background:radial-gradient(circle at 40% 40%,#fff,${s.c1} 30%,${s.c2} 70%);box-shadow:0 0 14px ${s.c2}`;
      row(`<i style="width:26px;height:26px;display:block;border-radius:50%;${sw}"></i>`, s.name, own ? (eq ? 'Equipped' : 'Owned') : 'A new spirit and ribbon color', '',
        eq ? 'EQUIPPED' : own ? 'EQUIP' : `<span class="gold">✦</span> ${fmt(s.cost)}`, eq || (!own && save.dust < s.cost), () => { if(!own){ if(!buy(s.cost)) return; save.skins.push(s.id); } save.skin = s.id; persist(); renderShop(); });
    }
  }
}
function openMissions(){
  hideAll(); save.mNew = false; persist();
  $('missDone').textContent = save.missionsDone;
  const L = $('missList'); L.innerHTML = '';
  for(const m of save.missions){
    const pct = Math.min(100, m.p / m.n * 100);
    L.insertAdjacentHTML('beforeend', `<div class="item${m.done ? ' done' : ''}"><div class="ii" style="color:#7dffc9">${m.done ? '✔' : '❀'}</div><div class="it"><b>${m.txt}</b><span>${m.done ? 'Complete' : fmt(m.p) + ' / ' + fmt(m.n)}</span><div class="mBar"><i style="width:${pct}%"></i></div></div><div class="pill"><span class="gold">✦</span> ${m.reward}</div></div>`);
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
  onTap('playBtn', () => startRun(false));
  onTap('dailyBtn', () => startRun(true));
  onTap('shopBtn', () => { hideAll(); renderShop(); show('shop'); });
  onTap('missBtn', openMissions);
  onTap('setBtn', () => openSettings('menu'));
  onTap('pauseBtn', pauseGame);
  onTap('resumeBtn', resumeGame);
  onTap('pSetBtn', () => openSettings('pause'));
  onTap('quitBtn', () => askConfirm('End this run? You keep your stardust.', () => { hide('pause'); gameOver(); }));
  onTap('revAdBtn', () => SDK.rewarded(ok => { if(ok) doRevive(); else toast('AD UNAVAILABLE', 'Try again in a moment.', '#ff8fc8'); }));
  onTap('revPayBtn', () => { const fr = Math.min(G.dust, REVIVE_COST); G.dust -= fr; save.dust -= REVIVE_COST - fr; doRevive(); });
  onTap('revNoBtn', () => { clearInterval(revIV); hide('revive'); gameOver(); });
  onTap('retryBtn', () => { const d = G.daily; SDK.midgame(() => startRun(d)); });
  onTap('oMenuBtn', () => SDK.midgame(goMenu));
  onTap('dblBtn', () => { $('dblBtn').disabled = true; SDK.rewarded(ok => { if(ok){ save.dust += G.lastDust; writeSave(); $('oDust').textContent = '+' + fmt(G.lastDust * 2); } else $('dblBtn').disabled = false; }); });
  document.querySelectorAll('.backBtn').forEach(b => onTap(b, () => {
    const inSettings = !$('settings').classList.contains('hidden');
    hideAll();
    if(inSettings && setBack === 'pause'){ show('pause'); return; }
    refreshMenu(); show('menu');
  }));
  document.querySelectorAll('#shop .tab').forEach(t => onTap(t, () => { shopTab = t.dataset.tab; renderShop(); }));
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.addEventListener('change', () => { save.opt[i.dataset.opt] = i.checked; AU.apply(); persist(); }));
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => onTap(b, () => { save.opt[s.dataset.opt] = b.dataset.v; persist(); syncSettings(); if(s.dataset.opt === 'quality') applyQuality(); })));
  onTap('replayTut', () => { save.tut = false; persist(); toast('TUTORIAL', 'It will play at the start of your next run.', '#fff38a'); });

  // mouse: the spirit follows the cursor, hold a button to boost.
  // touch: drag anywhere like a trackpad (the spirit copies your finger's path); a second finger or BOOST boosts.
  cv.addEventListener('pointerdown', e => {
    AU.init(); AU.resume();
    if(G.state !== 'play') return;
    e.preventDefault();
    if(e.pointerType === 'mouse'){ IN.mouse = true; IN.mx = e.clientX; IN.my = e.clientY; IN.boost = true; return; }
    if(!IN.touch){
      IN.touch = { id:e.pointerId, x:e.clientX, y:e.clientY };
      if(!IN.hasT){ IN.tx = P.x; IN.ty = P.y; }
      IN.hasT = true;
      try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    } else { IN.boost = true; IN.boostId = e.pointerId; }
  });
  addEventListener('pointermove', e => {
    if(e.pointerType === 'mouse'){ IN.mouse = true; IN.mx = e.clientX; IN.my = e.clientY; return; }
    if(IN.touch && e.pointerId === IN.touch.id && P){
      const k = 1.7 / G.camZ;
      IN.tx += (e.clientX - IN.touch.x) * k; IN.ty += (e.clientY - IN.touch.y) * k;
      IN.touch.x = e.clientX; IN.touch.y = e.clientY;
      // keep the target on a short leash so the spirit never lags far behind your finger
      const dx = IN.tx - P.x, dy = IN.ty - P.y, l = Math.hypot(dx, dy), max = 150;
      if(l > max){ IN.tx = P.x + dx / l * max; IN.ty = P.y + dy / l * max; }
    }
  }, { passive:true });
  const up = e => {
    if(e.pointerType === 'mouse'){ IN.boost = false; return; }
    if(IN.touch && e.pointerId === IN.touch.id){ IN.touch = null; if(P){ IN.tx = P.x + P.vx * .12; IN.ty = P.y + P.vy * .12; } }
    if(e.pointerId === IN.boostId){ IN.boost = false; IN.boostId = null; }
  };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  const bb = $('boostBtn');
  bb.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); AU.init(); IN.boost = true; IN.boostId = e.pointerId; });
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('pointerdown', () => { AU.init(); AU.resume(); }, { capture:true });
  addEventListener('keydown', e => {
    AU.init(); AU.resume();
    const k = e.key.toLowerCase();
    if([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(k)) e.preventDefault();
    IN.keys[k] = true;
    if(k === ' ' || k === 'shift') IN.boostKey = true;
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
  addEventListener('keyup', e => { const k = e.key.toLowerCase(); IN.keys[k] = false; if(k === ' ' || k === 'shift') IN.boostKey = false; });
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
    tickAmbient(dt);
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
  $('boot').classList.add('gone'); setTimeout(() => $('boot').remove(), 600);
})();
