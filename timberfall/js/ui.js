'use strict';
const SCREENS = ['menu', 'cards', 'pause', 'revive', 'over', 'dawn', 'shop', 'missions', 'settings', 'confirm'];
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
function hideAll(){ SCREENS.forEach(hide); }
function onTap(id, fn){ const el = typeof id === 'string' ? $(id) : id; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }

/* ---------------- feedback ---------------- */
let annT = 0;
function announce(txt, col, sub){
  const a = $('announce');
  a.innerHTML = txt + (sub ? '<small>' + sub + '</small>' : '');
  a.style.color = col || '#fff';
  a.classList.remove('go'); void a.offsetWidth; a.classList.add('go');
  clearTimeout(annT); annT = setTimeout(() => a.classList.remove('go'), 1850);
}
let tipHtml = null;
function tip(html){ if(html === tipHtml) return; tipHtml = html; const t = $('tip'); if(!html){ t.classList.add('hidden'); return; } t.innerHTML = html; t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; }
function toast(title, body, col, dur){
  const host = $('toasts');
  while(host.children.length >= 3) host.firstChild.remove();
  const d = document.createElement('div'); d.className = 'toast';
  d.innerHTML = `<b style="color:${col || '#ffd23a'}">${title}</b>${body || ''}`;
  host.appendChild(d);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 320); }, dur || 2600);
}

/* ---------------- HUD ---------------- */
const hudC = {};
function setH(key, val, fn){ if(hudC[key] === val) return; hudC[key] = val; fn(val); }
function updateHUD(){
  setH('hp', Math.ceil(P.hp) + '/' + Math.round(P.maxHp), () => { $('hpTxt').textContent = Math.ceil(P.hp); $('hpBar').firstElementChild.style.width = clamp(P.hp / P.maxHp * 100, 0, 100) + '%'; $('hpBar').classList.toggle('low', P.hp / P.maxHp < .3); });
  setH('lv', G.level, v => $('lvTxt').textContent = v);
  setH('xp', Math.round(G.xp / G.need * 100), v => $('xpBar').firstElementChild.style.width = v + '%');
  const tsec = Math.floor(G.t);
  setH('time', tsec, v => {
    const endless = G.endless;
    $('clock').textContent = endless ? 'DAWN +' + mmss(Math.max(0, v - RUN_LEN)) : mmss(v);
    $('clockIco').textContent = endless || G.won ? '☀' : '☾';
    $('nightBar').firstElementChild.style.width = Math.min(100, v / RUN_LEN * 100) + '%';
  });
  setH('gold', G.goldRun, v => $('hGold').textContent = fmt(v));
  setH('kills', G.kills, v => $('hKills').textContent = fmt(v));
  setH('trees', G.felled, v => $('hTrees').textContent = fmt(v));
  const b = G.boss;
  setH('boss', b ? b.type : '', v => { $('bossBar').classList.toggle('hidden', !v); if(v) $('bossName').textContent = b.d.name.toUpperCase(); });
  if(b) setH('bossHp', Math.round(b.hp / b.maxHp * 200), v => $('bossBar').querySelector('i').style.width = v / 2 + '%');
}
function buildNightMarks(){
  const m = $('nightMarks'); m.innerHTML = '';
  for(const k in BOSS_AT) m.insertAdjacentHTML('beforeend', `<i style="left:${BOSS_AT[k] / RUN_LEN * 100}%" title="${FOES[k].name}"></i>`);
}

/* ---------------- run flow ---------------- */
function startRun(daily){
  hideAll(); tip(null); $('toasts').innerHTML = '';
  for(const k in hudC) delete hudC[k];
  newRun(daily);
  buildSprites(G.biome); buildNightMarks();
  show('hud');
  IN.keys = {}; joyEnd();
  SDK.gameplayStart();
  AU.init(); AU.resume();
  announce(G.daily ? G.mod.name : G.biome.name.toUpperCase(), '#ffd88a', G.daily ? G.mod.desc : 'Survive until dawn');
}
function pauseGame(){
  if(G.state !== 'play') return;
  G.state = 'pause'; joyEnd(); IN.keys = {}; SDK.gameplayStop();
  const b = $('pauseBuild'); b.innerHTML = '';
  for(const c of CARDS){ const l = G.up[c.id]; if(l) b.insertAdjacentHTML('beforeend', `<span style="color:${RAR[c.rar].c}">${c.icon} ${c.name} ${l}</span>`); }
  if(!b.innerHTML) b.innerHTML = '<span style="color:var(--dim)">No cards yet</span>';
  $('pauseInfo').textContent = mmss(G.t) + ' · level ' + G.level + ' · ' + G.felled + ' trees';
  show('pause');
}
function resumeGame(){ hide('pause'); G.state = 'play'; SDK.gameplayStart(); AU.resume(); }

let cardsGuard = 0;
function openCards(){
  G.state = 'cards'; joyEnd(); IN.keys = {};
  $('cardsTitle').textContent = 'LEVEL ' + G.level;
  const pool = CARDS.filter(c => (G.up[c.id] || 0) < c.max);
  const offers = [];
  while(offers.length < 3 && pool.length){
    const tot = pool.reduce((s, c) => s + RAR[c.rar].w, 0);
    let r = Math.random() * tot, i = 0;
    for(; i < pool.length; i++){ r -= RAR[pool[i].rar].w; if(r <= 0) break; }
    offers.push(pool.splice(Math.min(i, pool.length - 1), 1)[0]);
  }
  if(!offers.length){ P.hp = Math.min(P.maxHp, P.hp + 30); G.goldRun += 10; G.state = 'play'; return; }
  G.offers = offers;
  const row = $('cardRow'); row.innerHTML = '';
  offers.forEach((c, i) => {
    const lv = G.up[c.id] || 0, rc = RAR[c.rar];
    const d = document.createElement('div'); d.className = 'card'; d.style.setProperty('--c', rc.c); d.style.animationDelay = (i * .07) + 's';
    d.innerHTML = `<div class="ci">${c.icon}</div><div class="cr">${rc.n}${c.max > 1 ? ' · LV ' + lv + ' → ' + (lv + 1) : ''}</div><div class="cn">${c.name}</div><div class="cd">${c.desc}</div><div class="ck">${i + 1}</div>`;
    d.addEventListener('click', e => { e.stopPropagation(); pickCard(i); });
    row.appendChild(d);
  });
  show('cards'); AU.levelUp();
  cardsGuard = performance.now() + 450;
}
function pickCard(i){
  if(G.state !== 'cards' || performance.now() < cardsGuard) return;
  const c = G.offers[i]; if(!c) return;
  AU.init(); AU.card();
  G.up[c.id] = (G.up[c.id] || 0) + 1;
  if(c.id === 'stew'){ P.maxHp += 25; P.hp = P.maxHp; }
  hide('cards'); G.state = 'play';
  toast(c.name.toUpperCase(), c.desc, RAR[c.rar].c, 1600);
  S = stats();
}

/* ---------------- death / revive / dawn / over ---------------- */
let revIV = 0;
function onDeathDone(){
  if(!G.revived && save.camp.revive > 0) openRevive(); else gameOver();
}
function openRevive(){
  G.state = 'revive'; SDK.gameplayStop();
  let left = 6; $('revNum').textContent = left;
  const arc = $('revArc'); arc.style.transition = 'none'; arc.style.strokeDashoffset = '0'; void arc.offsetWidth; arc.style.transition = 'stroke-dashoffset 6s linear'; arc.style.strokeDashoffset = '276.5';
  show('revive');
  clearInterval(revIV);
  revIV = setInterval(() => { left--; $('revNum').textContent = Math.max(0, left); if(left <= 0){ clearInterval(revIV); hide('revive'); gameOver(); } }, 1000);
}
function doRevive(){
  clearInterval(revIV); hide('revive');
  G.revived = true; G.state = 'play';
  P.hp = P.maxHp * .6; P.iv = 2.5;
  for(const e of G.foes){ if(!e.d.boss && Math.hypot(e.x - P.x, e.y - P.y) < 300){ const a = Math.atan2(e.y - P.y, e.x - P.x); e.vx = Math.cos(a) * 600; e.vy = Math.sin(a) * 600; e.hp -= 60; if(e.hp <= 0) killFoe(e, 'axe'); } }
  G.flash = .8; AU.dawn(); announce('SECOND WIND', '#8fe06a');
  SDK.gameplayStart();
}
function nextBiomeUnlock(){
  const i = G.daily ? -1 : save.biome;
  if(i >= 0 && i + 1 < BIOMES.length && save.unlocked <= i + 1){ save.unlocked = i + 2; return BIOMES[i + 1]; }
  return null;
}
function dawnWin(){
  if(G.dawned) return;
  G.dawned = true; G.state = 'dawn'; joyEnd(); SDK.gameplayStop();
  save.dawns++;
  const nb = nextBiomeUnlock();
  G.dawnBonus = 250 + BIOMES.indexOf(G.biome) * 100; G.goldRun += G.dawnBonus;
  writeSave();
  AU.dawn(); AU.setMusic(4); SDK.happytime();
  $('dwTime').textContent = mmss(G.t);
  $('dwBonus').textContent = '+' + fmt(G.dawnBonus);
  $('dwUnlock').innerHTML = nb ? `New forest unlocked: <b>${nb.name}</b>` : '';
  show('dawn');
}
function keepChopping(){
  hide('dawn'); G.state = 'play'; G.endless = true; G.won = false; G.nextBossT = G.t + 90;
  AU.setMusic(2); SDK.gameplayStart();
  announce('ENDLESS', '#ffd88a', 'How long can you last?');
}
const TIPS = [
  'Trees always fall <b>away from you</b>. Walk around a tree to aim it.',
  'A falling tree knocks over the trees it hits. Line them up for a <b>huge domino chain</b>.',
  'Logs are <b>walls</b> for a while. Wisps fly right over them.',
  'Watch out for <b>Bandit Beavers</b>: they gnaw trees down on top of you.',
  'Standing by the <b>campfire</b> slowly heals you.',
  'Tuskers charge in a straight line. A <b>tree trunk</b> stops them cold.',
  '<b>Golden trees</b> drop piles of gold. Fell them onto a crowd!',
  'Stumps <b>regrow</b> into saplings, then full trees. The forest never runs out.',
  'Survive until <b>dawn</b> to unlock a new forest.',
  'Spend gold at the <b>Camp</b> on permanent upgrades between runs.',
];
function gameOver(){
  clearInterval(revIV);
  G.state = 'over'; joyEnd(); SDK.gameplayStop(); tip(null); AU.setMusic(0);
  hide('hud'); hideAll(); $('toasts').innerHTML = '';
  const time = Math.floor(G.t);
  let gold = G.goldRun + Math.floor(time / 10) + G.felled, extra = '';
  if(G.daily){
    const k = todayKey();
    if(save.daily.key !== k) save.daily = { key:k, best:0, bonus:false };
    save.daily.best = Math.max(save.daily.best, time);
    if(!save.daily.bonus){ save.daily.bonus = true; gold += 100; extra = '<div class="oM"><span>Daily forest played</span><b>+100 🪙</b></div>'; }
  }
  save.gold += gold; save.runs++;
  const newBest = time > save.bestTime;
  save.bestTime = Math.max(save.bestTime, time); save.best = Math.max(save.best, G.score);
  const xp0 = save.xp, lv0 = save.level;
  save.xp += time + G.kills + G.felled * 2;
  let lvls = 0;
  while(save.xp >= xpNeed(save.level)){ save.xp -= xpNeed(save.level); save.level++; lvls++; save.gold += 50; }
  rollMissions();
  writeSave();

  $('oTitle').textContent = G.dawned ? 'A LEGENDARY NIGHT' : G.daily ? 'DAILY: ' + G.mod.name : 'THE FOREST TOOK YOU';
  $('oWhy').textContent = G.dawned ? 'You saw the sunrise.' : (G.deathWhy || '');
  $('oTag').classList.toggle('hidden', !newBest);
  $('oTimeN').textContent = mmss(time);
  $('oTrees').textContent = fmt(G.felled); $('oKills').textContent = fmt(G.kills); $('oCrush').textContent = fmt(G.crushKills); $('oChain').textContent = 'x' + G.maxChain; $('oGold').textContent = '+' + fmt(gold);
  $('oLevel').textContent = save.level;
  const bar = $('oLvlBar'); bar.style.transition = 'none'; bar.style.width = (lvls ? 0 : xp0 / xpNeed(lv0) * 100) + '%'; void bar.offsetWidth;
  bar.style.transition = ''; setTimeout(() => bar.style.width = (save.xp / xpNeed(save.level) * 100) + '%', 60);
  let mh = extra;
  if(lvls) mh += `<div class="oM"><span>LUMBERJACK LEVEL ${save.level}!</span><b>+${lvls * 50} 🪙</b></div>`;
  for(const m of save.missions.concat(G.doneMissions || [])) if(m.fresh){ mh += `<div class="oM"><span>✔ ${m.txt}</span><b>+${m.reward} 🪙</b></div>`; m.fresh = false; }
  $('oMissions').innerHTML = mh;
  $('oNext').innerHTML = nextGoal(time);
  $('oTip').innerHTML = 'TIP: ' + pick(TIPS);
  show('over');
  if(newBest && time > 60){ SDK.happytime(); AU.levelUp(); }
}
function nextGoal(time){
  const nextAxe = AXES.find(a => !save.axes.includes(a.id));
  if(nextAxe && save.gold >= nextAxe.cost) return `You can buy the <b>${nextAxe.name}</b> at camp!`;
  const nextCamp = CAMP.map(c => ({ c, cost:c.costs[save.camp[c.id]] })).filter(x => x.cost !== undefined).sort((a, b) => a.cost - b.cost)[0];
  if(nextCamp && save.gold >= nextCamp.cost) return `You can upgrade <b>${nextCamp.c.name}</b> at camp!`;
  if(time < BOSS_AT.stump) return `<b>The Old Stump</b> wakes at ${mmss(BOSS_AT.stump)}. Can you reach it?`;
  if(time < RUN_LEN) return `Dawn breaks at <b>10:00</b>. You were ${mmss(RUN_LEN - time)} away!`;
  return nextAxe ? `<b>${fmt(nextAxe.cost - save.gold)} 🪙</b> more for the <b>${nextAxe.name}</b>` : '';
}
function rollMissions(){
  G.doneMissions = save.missions.filter(m => m.done);
  for(const m of G.doneMissions) save.mTier[m.id] = (save.mTier[m.id] || 0) + 1;
  save.missions = save.missions.filter(m => !m.done);
  const have = new Set(save.missions.map(m => m.id));
  let guard = 0;
  while(save.missions.length < 3 && guard++ < 60){
    const t = pick(MT); if(have.has(t.id)) continue;
    const tier = save.mTier[t.id] || 0;
    const n = Math.round(t.vals[Math.min(tier, t.vals.length - 1)] * (tier >= t.vals.length ? 1 + (tier - t.vals.length + 1) * .5 : 1));
    save.missions.push({ id:t.id, ev:t.ev, kind:t.kind, n, p:0, done:false, txt:t.txt(n), reward:60 + tier * 50 });
    have.add(t.id); save.mNew = true;
  }
}

function goMenu(){
  G.state = 'menu'; SDK.gameplayStop(); AU.setMusic(0); joyEnd();
  hideAll(); hide('hud'); tip(null);
  menuForest();
  rollMissions(); persist();
  refreshMenu(); show('menu');
}
function menuForest(){
  G.biome = BIOMES[save.biome]; G.mod = null;
  Object.assign(G, { queue:[], falls:[], logs:[], foes:[], picks:[], fx:[], pops:[], clouds:[], bolts:[], owls:[], buddies:[], shots:[], roots:[], boss:null, dark:0, flash:0, shake:0 });
  buildForest(hashStr('menu' + save.biome)); buildSprites(G.biome);
}
function refreshMenu(){
  $('mGold').textContent = fmt(save.gold);
  $('mLevel').textContent = save.level;
  $('mLvlBar').style.width = (save.xp / xpNeed(save.level) * 100) + '%';
  $('mBestTime').textContent = mmss(save.bestTime); $('mDawns').textContent = save.dawns; $('mChain').textContent = 'x' + save.stats.bestChain;
  const B = BIOMES[save.biome], locked = save.biome >= save.unlocked;
  $('bName').textContent = B.name; $('bNote').textContent = locked ? 'Reach dawn in ' + BIOMES[save.biome - 1].name + ' to unlock' : B.note;
  $('biome').classList.toggle('locked', locked);
  $('bPrev').disabled = save.biome === 0; $('bNext').disabled = save.biome === BIOMES.length - 1;
  $('bDots').innerHTML = BIOMES.map((b, i) => `<i class="${i === save.biome ? 'on' : ''} ${i >= save.unlocked ? 'lk' : ''}"></i>`).join('');
  $('playBtn').disabled = locked;
  const seed = hashStr('timberfall:' + todayKey()), mod = MODS[(seed >>> 3) % MODS.length], db = BIOMES[seed % 6];
  const today = save.daily.key === todayKey();
  $('dailyMod').textContent = mod.name + ' in ' + db.name + (today && save.daily.best ? ' · BEST ' + mmss(save.daily.best) : !today || !save.daily.bonus ? ' · +100 🪙' : '');
  $('missDot').classList.toggle('hidden', !save.mNew);
  const nextAxe = AXES.find(a => !save.axes.includes(a.id));
  $('shopDot').classList.toggle('hidden', !(nextAxe && save.gold >= nextAxe.cost) && !CAMP.some(c => save.gold >= (c.costs[save.camp[c.id]] ?? 1e9)));
}
function changeBiome(d){
  const n = clamp(save.biome + d, 0, BIOMES.length - 1); if(n === save.biome) return;
  save.biome = n; persist(); menuForest(); refreshMenu();
}

/* ---------------- shop ---------------- */
let shopTab = 'camp';
function renderShop(){
  $('sGold').textContent = fmt(save.gold);
  document.querySelectorAll('#shop .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === shopTab));
  const L = $('shopList'); L.innerHTML = '';
  const row = (icon, title, sub, extraHtml, btnHtml, disabled, onBuy) => {
    const it = document.createElement('div'); it.className = 'item';
    it.innerHTML = `<div class="ii">${icon}</div><div class="it"><b>${title}</b><span>${sub}</span>${extraHtml || ''}</div>`;
    const b = document.createElement('button'); b.className = 'btn'; b.innerHTML = btnHtml; b.disabled = !!disabled;
    if(onBuy) onTap(b, onBuy);
    it.appendChild(b); L.appendChild(it);
  };
  const buy = cost => { if(save.gold < cost) return false; save.gold -= cost; AU.buy(); persist(); return true; };
  if(shopTab === 'camp'){
    for(const m of CAMP){
      const lv = save.camp[m.id] || 0, max = m.costs.length, cost = m.costs[lv];
      const pips = `<div class="pips">${Array.from({ length:max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>`;
      row(m.icon, m.name, m.desc, pips, lv >= max ? 'MAX' : `🪙 ${fmt(cost)}`, lv >= max || save.gold < cost, () => { if(buy(cost)){ save.camp[m.id] = lv + 1; renderShop(); } });
    }
  } else if(shopTab === 'axes'){
    for(const a of AXES){
      const own = save.axes.includes(a.id), eq = save.axe === a.id;
      row(axeIcon(a), a.name, a.desc, '', eq ? 'EQUIPPED' : own ? 'EQUIP' : `🪙 ${fmt(a.cost)}`, eq || (!own && save.gold < a.cost), () => {
        if(!own){ if(!buy(a.cost)) return; save.axes.push(a.id); toast('NEW AXE', a.name, '#ffd23a'); }
        save.axe = a.id; persist(); renderShop();
      });
    }
  } else {
    for(const o of OUTFITS){
      const own = save.outfits.includes(o.id), eq = save.outfit === o.id;
      const sw = `<i class="sw2" style="background:repeating-linear-gradient(90deg,${o.shirt} 0 7px,${o.check} 7px 10px);border-top:10px solid ${o.hat}"></i>`;
      row(sw, o.name, own ? (eq ? 'Wearing' : 'Owned') : 'A new flannel for your lumberjack', '', eq ? 'WEARING' : own ? 'WEAR' : `🪙 ${fmt(o.cost)}`, eq || (!own && save.gold < o.cost), () => {
        if(!own){ if(!buy(o.cost)) return; save.outfits.push(o.id); }
        save.outfit = o.id; persist(); renderShop();
      });
    }
  }
}
function axeIcon(a){
  return `<svg viewBox="0 0 40 40" width="38" height="38"><rect x="17" y="6" width="5" height="30" rx="2" fill="${a.col[1]}" transform="rotate(20 20 20)"/><path d="M14 6 L30 2 L32 16 L16 14 Z" fill="${a.col[0]}" stroke="#1a1208" stroke-width="2" transform="rotate(20 20 20)"/></svg>`;
}
function openMissions(){
  hideAll(); save.mNew = false; persist();
  $('missDone').textContent = save.missionsDone;
  const L = $('missList'); L.innerHTML = '';
  for(const m of save.missions){
    const pct = Math.min(100, m.p / m.n * 100), isTime = m.id === 'time';
    L.insertAdjacentHTML('beforeend', `<div class="item${m.done ? ' done' : ''}"><div class="ii" style="color:#8fe06a">${m.done ? '✔' : '◎'}</div><div class="it"><b>${m.txt}</b><span>${m.done ? 'Complete' : (isTime ? mmss(m.p) + ' / ' + mmss(m.n) : fmt(m.p) + ' / ' + fmt(m.n))}</span><div class="mBar"><i style="width:${pct}%"></i></div></div><div class="pill">🪙 ${m.reward}</div></div>`);
  }
  const st = save.stats;
  $('missStats').innerHTML = `Trees felled <b>${fmt(st.fell)}</b> · Creatures <b>${fmt(st.kills)}</b> · Crushed <b>${fmt(st.crush)}</b> · Bosses <b>${fmt(st.bosses)}</b> · Runs <b>${fmt(save.runs)}</b>`;
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

/* ---------------- input: floating joystick + keys ---------------- */
function joyEnd(){ if(IN.joy) IN.joy.on = false; $('joy').classList.add('hidden'); }
function wire(){
  onTap('playBtn', () => startRun(false));
  onTap('dailyBtn', () => startRun(true));
  onTap('bPrev', () => changeBiome(-1));
  onTap('bNext', () => changeBiome(1));
  onTap('shopBtn', () => { hideAll(); renderShop(); show('shop'); });
  onTap('missBtn', openMissions);
  onTap('setBtn', () => openSettings('menu'));
  onTap('pauseBtn', pauseGame);
  onTap('resumeBtn', resumeGame);
  onTap('pSetBtn', () => openSettings('pause'));
  onTap('quitBtn', () => askConfirm('End this run? You keep the gold you collected.', () => { hide('pause'); gameOver(); }));
  onTap('revYesBtn', doRevive);
  onTap('revNoBtn', () => { clearInterval(revIV); hide('revive'); gameOver(); });
  onTap('dwKeepBtn', keepChopping);
  onTap('dwCashBtn', () => { hide('dawn'); gameOver(); });
  onTap('retryBtn', () => { const d = G.daily; SDK.midgame(() => startRun(d)); });
  onTap('oMenuBtn', () => SDK.midgame(goMenu));
  document.querySelectorAll('.backBtn').forEach(b => onTap(b, () => {
    const inSettings = !$('settings').classList.contains('hidden');
    hideAll();
    if(inSettings && setBack === 'pause'){ show('pause'); return; }
    refreshMenu(); show('menu');
  }));
  document.querySelectorAll('#shop .tab').forEach(t => onTap(t, () => { shopTab = t.dataset.tab; renderShop(); }));
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.addEventListener('change', () => { save.opt[i.dataset.opt] = i.checked; AU.apply(); persist(); }));
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => onTap(b, () => { save.opt[s.dataset.opt] = b.dataset.v; persist(); syncSettings(); if(s.dataset.opt === 'quality') applyQuality(); })));
  onTap('replayTut', () => { save.tut = false; persist(); toast('TUTORIAL', 'It will play at the start of your next run.', '#ffd23a'); });

  IN.joy = { on:false, id:-1, ox:0, oy:0, x:0, y:0 };
  const J = IN.joy, knob = $('joyKnob'), base = $('joy');
  const place = () => { base.style.left = J.ox + 'px'; base.style.top = J.oy + 'px'; const dx = J.x - J.ox, dy = J.y - J.oy, l = Math.hypot(dx, dy), m = Math.min(l, 44) / (l || 1); knob.style.transform = `translate(${dx * m}px,${dy * m}px)`; };
  cv.addEventListener('pointerdown', e => {
    AU.init(); AU.resume();
    if(G.state !== 'play' || J.on) return;
    e.preventDefault();
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    Object.assign(J, { on:true, id:e.pointerId, ox:e.clientX, oy:e.clientY, x:e.clientX, y:e.clientY });
    base.classList.remove('hidden'); place();
  });
  addEventListener('pointermove', e => { if(!J.on || e.pointerId !== J.id) return; J.x = e.clientX; J.y = e.clientY; const dx = J.x - J.ox, dy = J.y - J.oy, l = Math.hypot(dx, dy); if(l > 70){ J.ox = J.x - dx / l * 70; J.oy = J.y - dy / l * 70; } place(); }, { passive:true });
  const up = e => { if(J.on && e.pointerId === J.id) joyEnd(); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('pointerdown', e => { AU.init(); AU.resume(); if(e.pointerType === 'touch') document.body.classList.add('touch'); }, { capture:true });

  addEventListener('keydown', e => {
    AU.init(); AU.resume();
    const k = e.key;
    if([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(k)) e.preventDefault();
    IN.keys[k.toLowerCase()] = true;
    if(e.repeat) return;
    if(k === 'Escape' || k === 'p' || k === 'P'){
      if(G.state === 'play') pauseGame();
      else if(G.state === 'pause' && $('settings').classList.contains('hidden') && $('confirm').classList.contains('hidden')) resumeGame();
      return;
    }
    if(G.state === 'cards' && ['1', '2', '3'].includes(k)) pickCard(+k - 1);
    else if(G.state === 'over' && k === 'Enter') $('retryBtn').click();
    else if(G.state === 'menu' && !$('menu').classList.contains('hidden')){ if(k === 'Enter') $('playBtn').click(); else if(k === 'ArrowLeft') changeBiome(-1); else if(k === 'ArrowRight') changeBiome(1); }
  });
  addEventListener('keyup', e => { IN.keys[e.key.toLowerCase()] = false; });
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
    if(G.state === 'play' || G.state === 'dying'){ update(dt); AU.ambient(dt); }
    else if(G.state === 'menu'){ G.rt += dt; for(const p of G.fx){ p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; } G.fx = G.fx.filter(p => p.l > 0); }
    else G.rt += dt;
    render();
    if(G.state === 'play' || G.state === 'dying') updateHUD();
  }catch(err){ console.error(err); }
}
addEventListener('error', e => { try{ console.error(e.error || e.message); }catch(_){} });
addEventListener('unhandledrejection', e => { try{ e.preventDefault(); console.error(e.reason); }catch(_){} });

/* ---------------- boot ---------------- */
(async function boot(){
  G.q = 'high';
  if(matchMedia('(pointer:coarse)').matches) document.body.classList.add('touch');
  resize();
  S = stats();
  menuForest();
  requestAnimationFrame(frame);
  SDK.onMute = m => AU.setPortalMute(m);
  await SDK.init();              // must resolve before the save is read (SDK Data Module)
  SDK.loadingStart();
  loadSave();
  S = stats();
  applyQuality();
  wire();
  goMenu();
  SDK.loadingStop();
  $('boot').classList.add('gone'); setTimeout(() => { if($('boot')) $('boot').remove(); }, 500);
})();
