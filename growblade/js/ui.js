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
  a.style.textShadow = `0 0 24px ${col || '#fff'}, 0 4px 0 rgba(0,0,0,.5)`;
  a.classList.remove('go'); void a.offsetWidth; a.classList.add('go');
  clearTimeout(annT); annT = setTimeout(() => a.classList.remove('go'), 1150);
}
function tip(html){ const t = $('tip'); if(!html){ t.classList.add('hidden'); return; } t.innerHTML = html; t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; }
function toast(title, body, col, dur){
  if(G.state !== 'play' && G.state !== 'over' && G.state !== 'cards') return;
  const host = $('toasts');
  while(host.children.length >= 3) host.firstChild.remove();
  const d = document.createElement('div'); d.className = 'toast';
  d.innerHTML = `<b style="color:${col || '#ffd23c'}">${title}</b>${body || ''}`;
  host.appendChild(d);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 320); }, dur || 2800);
}

/* ---------------- HUD ---------------- */
const hudC = {};
function setH(key, val, fn){ if(hudC[key] === val) return; hudC[key] = val; fn(val); }
function updateHUD(){
  const m = (G.L * M_PER_UNIT).toFixed(1);
  setH('len', m, v => { const el = $('hLen'); el.firstElementChild.textContent = v; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); });
  setH('tier', G.tier, t => $('hTier').textContent = TIERS[t].n);
  const nx = TIERS[G.tier + 1], pc = nx ? Math.round((G.L - TIERS[G.tier].L) / (nx.L - TIERS[G.tier].L) * 100) : 100;
  setH('tbar', pc, v => $('hTierBar').firstElementChild.style.width = clamp(v, 0, 100) + '%');
  setH('hp', P.hp + '/' + P.maxHp, () => { let h = ''; for(let i = 0; i < P.maxHp; i++) h += `<span class="h${i < P.hp ? '' : ' e'}">♥</span>`; $('hHearts').innerHTML = h; $('hHearts').classList.toggle('pulse', P.hp === 1); });
  const tm = Math.floor(G.t); setH('time', tm, v => $('hTime').textContent = Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0'));
  setH('score', fmt(G.score), v => $('hScore').textContent = v);
  setH('gold', Math.floor(G.gold), v => $('hGold').lastElementChild.textContent = fmt(v));
  setH('combo', G.combo, v => { const c = $('combo'); c.classList.toggle('on', v >= 3); c.classList.toggle('hot', v >= 15); c.firstElementChild.textContent = 'x' + v; });
  const bossAlive = G.E.filter(e => e.boss && !e.dead);
  setH('boss', bossAlive.length ? 1 : 0, v => $('bossBar').classList.toggle('hidden', !v));
  if(bossAlive.length){ const a = bossAlive.reduce((s, e) => s + e.area, 0); setH('bhp', Math.round(a / G.bossArea * 100), v => $('bossHp').firstElementChild.style.width = clamp(v, 0, 100) + '%'); }
  setH('dash', P.dashCd > 0 ? 1 : 0, v => $('dashBtn').classList.toggle('cd', !!v));
}

/* ---------------- run flow ---------------- */
function startRun(daily){
  hideAll(); tip(null); $('toasts').innerHTML = '';
  for(const k in hudC) delete hudC[k];
  G.E.length = 0;
  show('hud'); $('dashBtn').classList.toggle('hidden', !isTouch());
  newRun(daily);
  SDK.gameplayStart();
  AU.init(); AU.resume(); AU.setMusic(2);
}
function pauseGame(){
  if(G.state !== 'play') return;
  G.state = 'pause'; SDK.gameplayStop(); if(IN.joy) IN.joy.on = false;
  const b = $('pauseBuild'); b.innerHTML = '';
  for(const u of PERKS){ const l = G.up[u.id]; if(l) b.insertAdjacentHTML('beforeend', `<span style="color:${RAR[u.rar].c}">${u.icon} ${u.name}${u.max > 1 ? ' ' + l : ''}</span>`); }
  if(!b.innerHTML) b.innerHTML = '<span style="color:var(--dim)">No perks yet</span>';
  show('pause');
}
function resumeGame(){ hide('pause'); G.state = 'play'; SDK.gameplayStart(); AU.resume(); }

let cardsGuard = 0;
function openCards(){
  const pool = PERKS.filter(u => (G.up[u.id] || 0) < u.max);
  if(!pool.length) return;
  G.state = 'cards'; SDK.gameplayStop(); if(IN.joy) IN.joy.on = false;
  $('cardsTitle').textContent = TIERS[G.tier].n;
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
    const d = document.createElement('div'); d.className = 'card'; d.style.setProperty('--c', rc.c); d.style.animationDelay = (i * .07) + 's';
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
  AU.init(); AU.tierUp();
  G.up[u.id] = (G.up[u.id] || 0) + 1;
  if(u.id === 'heart'){ P.maxHp++; P.hp = P.maxHp; }
  hide('cards'); G.state = 'play'; SDK.gameplayStart();
  toast(u.name.toUpperCase(), u.desc, RAR[u.rar].c, 1800);
}

/* ---------------- death / revive / over ---------------- */
const REVIVE_COST = 100;
let revIV = 0;
function onDeathDone(){
  const canPay = save.gold + G.gold >= REVIVE_COST;
  if(!G.revived && G.t > 45 && (SDK.canRewarded() || canPay)) openRevive(); else gameOver();
}
function openRevive(){
  G.state = 'revive'; SDK.gameplayStop();
  $('revAdBtn').classList.toggle('hidden', !SDK.canRewarded());
  $('revPayBtn').classList.toggle('hidden', !(save.gold + G.gold >= REVIVE_COST));
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
  P.hp = Math.min(P.maxHp, 2); P.inv = 2.5; P.vx = P.vy = 0;
  G.O.length = 0;
  for(const e of G.E){ const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1; if(d < viewR() * .6 && !e.boss){ e.vx = dx / d * 900; e.vy = dy / d * 900; } }
  G.FX.push({ ring:true, x:P.x, y:P.y, r:0, max:viewR() * .6, life:.35, c:'#ffd23c' });
  AU.tierUp(); announce('REVIVED', '#ffd23c');
  SDK.gameplayStart();
}
const TIPS = [
  'Cut a shape <b>right through the middle</b> for a PERFECT HALF — double gems.',
  'Walk <b>against</b> the spin direction for faster, deadlier slashes.',
  'The <b>tip</b> of the blade moves fastest — it is the only part that cuts steel.',
  '<b>Dash</b> to whip your blade into a huge spinning slash.',
  'Swing through green orbs to <b>deflect</b> them into enemies.',
  'Cut a <b>Boomer</b> next to a crowd to shred them all.',
  'Getting hit <b>chips your blade</b> — grab the fallen gems back fast!',
  'Every new blade size lets you <b>choose a perk</b>.',
  'The <b>Twin Blade</b> perk adds a second edge on the other end.',
  'Gold unlocks new blades and permanent upgrades in the <b>SHOP</b>.',
];
function gameOver(){
  clearInterval(revIV);
  G.state = 'over'; SDK.gameplayStop(); tip(null); AU.setMusic(0);
  hide('hud'); hideAll(); $('toasts').innerHTML = '';
  commitMissions();
  let gold = Math.floor(G.gold), extra = '';
  const m = +(G.maxL * M_PER_UNIT).toFixed(1);
  if(G.daily){
    const k = todayKey();
    if(save.daily.key !== k) save.daily = { key:k, best:0, bonus:false };
    save.daily.best = Math.max(save.daily.best, m);
    if(!save.daily.bonus){ save.daily.bonus = true; gold += 40; extra = '<div class="oM"><span>Daily run played</span><b>+40 ◆</b></div>'; }
  }
  save.gold += gold; save.runs++;
  const newBest = m > save.bestLen;
  save.bestLen = Math.max(save.bestLen, m); save.best = Math.max(save.best, G.score);
  const xp0 = save.xp, lv0 = save.level;
  save.xp += Math.floor(G.score / 40 + G.slices * 2 + G.t);
  let lvls = 0;
  while(save.xp >= xpNeed(save.level)){ save.xp -= xpNeed(save.level); save.level++; lvls++; save.gold += 30; }
  writeSave();
  $('oTitle').textContent = G.daily ? 'DAILY: ' + G.mod.name : 'RUN OVER';
  $('oTag').classList.toggle('hidden', !newBest);
  $('oTierName').textContent = TIERS[tierOf(G.maxL)].n;
  $('oScoreG').textContent = fmt(G.score); $('oSlices').textContent = fmt(G.slices); $('oPerfect').textContent = fmt(G.perfects); $('oGold').textContent = '+' + fmt(gold);
  $('oLevel').textContent = save.level;
  const bar = $('oLvlBar'); bar.style.transition = 'none'; bar.style.width = (lvls ? 0 : xp0 / xpNeed(lv0) * 100) + '%'; void bar.offsetWidth;
  bar.style.transition = ''; setTimeout(() => bar.style.width = (save.xp / xpNeed(save.level) * 100) + '%', 60);
  let mh = extra;
  if(lvls) mh += `<div class="oM"><span>LEVEL UP! Now level ${save.level}</span><b>+${lvls * 30} ◆</b></div>`;
  for(const q of save.missions) if(q.fresh){ mh += `<div class="oM"><span>✔ ${q.txt}</span><b>+${q.reward} ◆</b></div>`; q.fresh = false; }
  $('oMissions').innerHTML = mh;
  $('oNext').innerHTML = newBest ? 'Your longest blade ever!' : `Record: <b>${save.bestLen} m</b> — only <b>${(save.bestLen - m).toFixed(1)} m</b> to go`;
  $('oTip').innerHTML = 'TIP: ' + pick(TIPS);
  $('dblBtn').classList.toggle('hidden', !SDK.canRewarded() || gold <= 0); $('dblBtn').disabled = false;
  G.lastGold = gold;
  const el = $('oLen'), t0 = performance.now();
  (function tick(){ const k = Math.min(1, (performance.now() - t0) / 900); el.textContent = (m * (1 - Math.pow(1 - k, 3))).toFixed(1) + ' m'; if(k < 1) requestAnimationFrame(tick); })();
  show('over');
  if(newBest){ SDK.happytime(); AU.tierUp(); }
}
function goMenu(){
  G.state = 'menu'; SDK.gameplayStop(); AU.setMusic(0);
  for(const k of ['E','O','GM','PT','POP','DB','FX','TM']) G[k].length = 0;
  P = null; G.up = {}; G.mod = null; G.combo = 0; G.shake = 0; G.flash = 0; G.timeScale = 1; G.tut = false;
  hideAll(); hide('hud'); tip(null);
  rollMissions(); persist();
  refreshMenu(); show('menu');
}
function refreshMenu(){
  $('mGold').textContent = fmt(save.gold);
  $('mLevel').textContent = save.level;
  $('mLvlBar').style.width = (save.xp / xpNeed(save.level) * 100) + '%';
  $('mBestLen').textContent = save.bestLen + ' m'; $('mBest').textContent = fmt(save.best); $('mSlices').textContent = fmt(save.stats.slices);
  const seed = hashStr('growblade:' + todayKey()), mod = MODS[seed % MODS.length], today = save.daily.key === todayKey();
  $('dailyMod').textContent = mod.name + ' — ' + mod.desc + (today && save.daily.best ? ' · BEST ' + save.daily.best + ' m' : !today || !save.daily.bonus ? ' · +40 ◆' : '');
  $('missDot').classList.toggle('hidden', !save.mNew);
}

/* ---------------- shop / missions / settings ---------------- */
let shopTab = 'up';
function renderShop(){
  $('sGold').textContent = fmt(save.gold);
  document.querySelectorAll('#shop .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === shopTab));
  const L = $('shopList'); L.innerHTML = '';
  const row = (icon, title, sub, extraHtml, btnHtml, disabled, onBuy) => {
    const it = document.createElement('div'); it.className = 'item';
    it.innerHTML = `<div class="ii">${icon}</div><div class="it"><b>${title}</b><span>${sub}</span>${extraHtml || ''}</div>`;
    const b = document.createElement('button'); b.className = 'btn'; b.innerHTML = btnHtml; b.disabled = !!disabled; if(onBuy) onTap(b, onBuy);
    it.appendChild(b); L.appendChild(it);
  };
  const buy = c => { if(save.gold < c) return false; save.gold -= c; AU.tierUp(); persist(); return true; };
  if(shopTab === 'up'){
    for(const m of META){
      const lv = save.meta[m.id] || 0, max = m.costs.length, cost = m.costs[lv];
      row(`<span style="color:#ffd23c">${m.icon}</span>`, m.name, m.desc, `<div class="pips">${Array.from({ length:max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>`,
        lv >= max ? 'MAX' : `<span class="gold">◆</span> ${fmt(cost)}`, lv >= max || save.gold < cost, () => { if(buy(cost)){ save.meta[m.id] = lv + 1; renderShop(); } });
    }
  } else {
    for(const s of SKINS){
      const own = save.skins.includes(s.id), eq = save.skin === s.id;
      const sw = s.c2 === 'prism' ? 'background:linear-gradient(90deg,#ff3b5c,#ffb020,#b6ff3c,#27f3ff,#b46bff)' : `background:linear-gradient(90deg,${s.c1} 50%,${s.c2} 50%);box-shadow:0 0 12px ${s.glow}`;
      row(`<i style="width:34px;height:10px;display:block;border-radius:0 6px 6px 0;${sw}"></i>`, s.name + ' Blade', own ? (eq ? 'Equipped' : 'Owned') : 'A new look for your sword', '',
        eq ? 'EQUIPPED' : own ? 'EQUIP' : `<span class="gold">◆</span> ${fmt(s.cost)}`, eq || (!own && save.gold < s.cost), () => { if(!own){ if(!buy(s.cost)) return; save.skins.push(s.id); } save.skin = s.id; persist(); renderShop(); });
    }
  }
}
function openMissions(){
  hideAll(); save.mNew = false; persist();
  $('missDone').textContent = save.missionsDone;
  const L = $('missList'); L.innerHTML = '';
  for(const m of save.missions){
    const pct = Math.min(100, m.p / m.n * 100);
    L.insertAdjacentHTML('beforeend', `<div class="item${m.done ? ' done' : ''}"><div class="ii" style="color:#3ddc84">${m.done ? '✔' : '◎'}</div><div class="it"><b>${m.txt}</b><span>${m.done ? 'Complete' : fmt(m.p) + ' / ' + fmt(m.n)}</span><div class="mBar"><i style="width:${pct}%"></i></div></div><div class="pill"><span class="gold">◆</span> ${m.reward}</div></div>`);
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
  onTap('quitBtn', () => askConfirm('End this run? You keep your gold.', () => { hide('pause'); gameOver(); }));
  onTap('revAdBtn', () => SDK.rewarded(ok => { if(ok) doRevive(); else toast('AD UNAVAILABLE', 'Try again in a moment.', '#ff3b5c'); }));
  onTap('revPayBtn', () => { const fr = Math.min(G.gold, REVIVE_COST); G.gold -= fr; save.gold -= REVIVE_COST - fr; doRevive(); });
  onTap('revNoBtn', () => { clearInterval(revIV); hide('revive'); gameOver(); });
  onTap('retryBtn', () => { const d = G.daily; SDK.midgame(() => startRun(d)); });
  onTap('oMenuBtn', () => SDK.midgame(goMenu));
  onTap('dblBtn', () => { $('dblBtn').disabled = true; SDK.rewarded(ok => { if(ok){ save.gold += G.lastGold; writeSave(); $('oGold').textContent = '+' + fmt(G.lastGold * 2); } else $('dblBtn').disabled = false; }); });
  document.querySelectorAll('.backBtn').forEach(b => onTap(b, () => {
    const inSettings = !$('settings').classList.contains('hidden');
    hideAll();
    if(inSettings && setBack === 'pause'){ show('pause'); return; }
    refreshMenu(); show('menu');
  }));
  document.querySelectorAll('#shop .tab').forEach(t => onTap(t, () => { shopTab = t.dataset.tab; renderShop(); }));
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.addEventListener('change', () => { save.opt[i.dataset.opt] = i.checked; AU.apply(); persist(); }));
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => onTap(b, () => { save.opt[s.dataset.opt] = b.dataset.v; persist(); syncSettings(); if(s.dataset.opt === 'quality') applyQuality(); })));
  onTap('replayTut', () => { save.tut = false; persist(); toast('TUTORIAL', 'It will play at the start of your next run.', '#ffd23c'); });

  // mouse steers toward the cursor; touch uses a floating joystick; click / SPACE dashes
  cv.addEventListener('pointerdown', e => {
    AU.init(); AU.resume();
    if(G.state !== 'play') return;
    e.preventDefault();
    if(e.pointerType === 'mouse'){ IN.mouse = true; IN.mx = e.clientX; IN.my = e.clientY; tryDash(); return; }
    if(!IN.joy || !IN.joy.on){ IN.joy = { on:true, id:e.pointerId, ox:e.clientX, oy:e.clientY, x:e.clientX, y:e.clientY }; try{ cv.setPointerCapture(e.pointerId); }catch(_){} }
    else tryDash();                       // a second finger dashes
  });
  addEventListener('pointermove', e => {
    if(e.pointerType === 'mouse'){ IN.mouse = true; IN.mx = e.clientX; IN.my = e.clientY; return; }
    if(IN.joy && IN.joy.on && e.pointerId === IN.joy.id){ IN.joy.x = e.clientX; IN.joy.y = e.clientY; }
  }, { passive:true });
  const up = e => { if(IN.joy && e.pointerId === IN.joy.id) IN.joy.on = false; };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  $('dashBtn').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); AU.init(); tryDash(); });
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
    if(G.state === 'play' && (k === ' ' || k === 'shift')) tryDash();
    else if(G.state === 'cards' && ['1', '2', '3'].includes(k)) pickCard(+k - 1);
    else if(G.state === 'over' && k === 'enter') $('retryBtn').click();
    else if(G.state === 'menu' && !$('menu').classList.contains('hidden') && (k === 'enter' || k === ' ')) $('playBtn').click();
  });
  addEventListener('keyup', e => { IN.keys[e.key.toLowerCase()] = false; });
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 200));
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ if(G.state === 'play') pauseGame(); } else AU.resume(); });
  addEventListener('blur', () => { IN.keys = {}; if(G.state === 'play') pauseGame(); });
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
    if(P) render(); else { cx.setTransform(DPR, 0, 0, DPR, 0, 0); drawBg(); }
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
