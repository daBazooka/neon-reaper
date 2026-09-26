'use strict';
const SCREENS = ['menu', 'cards', 'pause', 'revive', 'over', 'shop', 'missions', 'settings', 'confirm'];
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
function hideAll(){ SCREENS.forEach(hide); }
function onTap(id, fn){ const el = typeof id === 'string' ? $(id) : id; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }

/* ---------------- pixel icons ---------------- */
const PIX = {
  pick:  { p:{ s:'#b9bcc4', S:'#8d8f96', h:'#8a5a2e' }, r:['..ssssss..','.sSs..sSs.','sS..hh..Ss','s...hh...s','....hh....','...hh.....','...hh.....','..hh......','..hh......','.hh.......'] },
  bow:   { p:{ r:'#5a3818', w:'#c89058', b:'#3b2412', l:'#eeeeee' }, r:['..rrrrrr..','.rrrrrrrr.','..wwwwww..','..wbllbw..','...wwww...','....ww....','....ww....','....ww....','...wwww...','..wwwwww..'] },
  blast: { p:{ r:'#a83128', R:'#d8433a', y:'#ffd23c', k:'#2b2b2b', f:'#222222' }, r:['....ff....','.rrrrrrrr.','.rRRRRRRr.','.rRRRRRRr.','.yyyyyyyy.','.ykykykyk.','.yyyyyyyy.','.rRRRRRRr.','.rRRRRRRr.','.rrrrrrrr.'] },
  fire:  { p:{ o:'#ff6a1a', y:'#ffd23c', s:'#6f727a', S:'#9a9da6' }, r:['....o.....','...oyo..o.','..oyyo.oo.','..oyyyoyo.','.ssssssss.','.sSSSSSSs.','.sSSSSSSs.','..sSSSSs..','..ssssss..','..........'] },
  spire: { p:{ c:'#1fb6d0', C:'#6af7ff', w:'#e6ffff', g:'#4b5467', G:'#7d879c' }, r:['....cc....','...cCCc...','...cCwc...','...cCwc...','...cCCc...','...cCCc...','...cCCc...','....cc....','..gggggg..','.gGGGGGGg.'] },
};
function pixIcon(key){
  const d = PIX[key], c = document.createElement('canvas'); c.width = c.height = 10;
  const g = c.getContext('2d');
  d.r.forEach((row, y) => [...row].forEach((ch, x) => { if(d.p[ch]){ g.fillStyle = d.p[ch]; g.fillRect(x, y, 1, 1); } }));
  return c.toDataURL();
}
const ICONS = {};
function buildIcons(){
  ICONS.pick = pixIcon('pick'); ICONS.bow = pixIcon('bow'); ICONS.blast = pixIcon('blast'); ICONS.fire = pixIcon('fire'); ICONS.spire = pixIcon('spire');
  ICONS.dirt = iconFor(B.DIRT, 48); ICONS.brick = iconFor(B.BRICK, 48);
  for(const r of RES) ICONS['r_' + r] = iconFor(RES_BLOCK[r], 40);
}

/* ---------------- feedback ---------------- */
let annT = 0;
function announce(txt, col, sub){
  const a = $('announce');
  a.innerHTML = txt + (sub ? '<small>' + sub + '</small>' : '');
  a.style.color = col || '#fff';
  a.classList.remove('go'); void a.offsetWidth; a.classList.add('go');
  clearTimeout(annT); annT = setTimeout(() => a.classList.remove('go'), 1850);
}
function tip(html){ const t = $('tip'); if(!html){ t.classList.add('hidden'); return; } t.innerHTML = html; t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; }
function toast(title, body, col, dur){
  const host = $('toasts');
  while(host.children.length >= 3) host.firstChild.remove();
  const d = document.createElement('div'); d.className = 'toast';
  d.innerHTML = `<b style="color:${col || '#ffd23c'}">${title}</b>${body || ''}`;
  host.appendChild(d);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 320); }, dur || 2800);
}
function flashRes(cost){
  for(const k in cost){ if(G.res[k] < cost[k]){ const el = $('res_' + k); if(el){ el.classList.remove('short'); void el.offsetWidth; el.classList.add('short'); } } }
}

/* ---------------- HUD ---------------- */
function costTxt(cost, mul){ return cost ? Object.keys(cost).map(k => cost[k] * (mul || 1) + ' ' + RES_NAME[k]).join(' + ') : ''; }
function costIcons(cost){ return Object.keys(cost).map(k => `<i class="ci">${cost[k]}<img src="${ICONS['r_' + k]}" alt=""></i>`).join(''); }
function buildHud(){
  const rb = $('resBar'); rb.innerHTML = '';
  for(const r of RES) rb.insertAdjacentHTML('beforeend', `<div class="res" id="res_${r}"><img src="${ICONS['r_' + r]}" alt=""><b>0</b></div>`);
  const hb = $('hotbar'); hb.innerHTML = '';
  for(const t of TOOLS){
    const el = document.createElement('div'); el.className = 'slot'; el.id = 'slot_' + t.id;
    el.innerHTML = `<span class="k">${t.key}</span><img src="${ICONS[t.id]}" alt=""><span class="cst">${t.cost ? costIcons(t.cost) : 'MINE'}</span>`;
    el.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); AU.init(); AU.resume(); selectTool(t.id); });
    hb.appendChild(el);
  }
}
function selectTool(id){
  const t = TOOL[id];
  if(t.unlock && !save.unlock[t.unlock]){ AU.deny(); toast('LOCKED', `Unlock the ${t.name} in the Shop.`, '#ffd23c', 2200); return; }
  G.tool = id; AU.ui();
  document.querySelectorAll('.slot').forEach(s => s.classList.toggle('on', s.id === 'slot_' + id));
  $('toolInfo').innerHTML = `<b>${t.name}</b>${t.cost ? ' (' + costTxt(t.cost) + ')' : ''} — ${t.desc}`;
}
const hudC = {};
function setH(key, val, fn){ if(hudC[key] === val) return; hudC[key] = val; fn(val); }
function updateHUD(){
  const night = G.phase === 'night';
  setH('phase', G.phase + G.day, () => { $('phase').classList.toggle('night', night); $('phaseIco').textContent = night ? '☾' : '☀'; $('phaseTxt').textContent = G.phase === 'dawn' ? 'DAWN' : (night ? 'NIGHT ' : 'DAY ') + G.day; });
  const pk = night ? 1 - Math.min(1, G.mobs.length / Math.max(1, G.mobs.length + G.spawnQ.length)) : isFinite(G.dayT) ? G.dayT / G.dayLen : 1;
  setH('pbar', Math.round(pk * 100), v => $('phaseBar').firstElementChild.style.width = v + '%');
  setH('nbtn', G.phase === 'day' && G.state === 'play' ? (G.tut && G.tutStep < 3 ? 'h' : 's') : 'h', v => { $('nightBtn').classList.toggle('hidden', v === 'h'); $('nightBtn').classList.toggle('pulse', G.tut); });
  setH('hp', Math.ceil(G.heartHp) + '/' + G.heartMax, () => { $('heartTxt').textContent = Math.ceil(G.heartHp) + ' / ' + G.heartMax; $('heartBar').firstElementChild.style.width = (G.heartHp / G.heartMax * 100) + '%'; $('heartBar').classList.toggle('low', G.heartHp / G.heartMax < .3); });
  const left = G.mobs.length + G.spawnQ.length;
  setH('foes', night ? left : -1, v => { $('foes').classList.toggle('hidden', v < 0); $('foes').textContent = v + ' MONSTER' + (v === 1 ? '' : 'S') + ' LEFT'; });
  setH('gems', Math.floor(G.gems), v => $('hGems').textContent = fmt(v));
  for(const r of RES) setH('r' + r, G.res[r], v => { const el = $('res_' + r); el.lastElementChild.textContent = v; el.classList.toggle('zero', v === 0); });
  const aff = TOOLS.map(t => t.cost ? (canAfford(t.cost, 1) ? 1 : 0) : 1).join('') + TOOLS.map(t => t.unlock && !save.unlock[t.unlock] ? 1 : 0).join('');
  setH('aff', aff, () => { for(const t of TOOLS){ const el = $('slot_' + t.id); el.classList.toggle('cant', !!t.cost && !canAfford(t.cost, 1)); el.classList.toggle('lock', !!(t.unlock && !save.unlock[t.unlock])); } });
}

/* ---------------- run flow ---------------- */
function startRun(daily){
  hideAll(); tip(null); $('toasts').innerHTML = '';
  for(const k in hudC) delete hudC[k];
  CAM.z = 1; CAM.px = CAM.py = 0;
  newRun(daily);
  show('hud'); buildHud(); selectTool('pick');
  SDK.gameplayStart();
  AU.init(); AU.resume();
}
function pauseGame(){
  if(G.state !== 'play') return;
  G.state = 'pause'; G.ptr.down = false; SDK.gameplayStop();
  const b = $('pauseBuild'); b.innerHTML = '';
  for(const c of CARDS){ const l = G.up[c.id]; if(l && c.max < 99) b.insertAdjacentHTML('beforeend', `<span style="color:${RAR[c.rar].c}">${c.icon} ${c.name} ${l}</span>`); }
  if(!b.innerHTML) b.innerHTML = '<span style="color:var(--dim)">No blessings yet</span>';
  show('pause');
}
function resumeGame(){ hide('pause'); G.state = 'play'; SDK.gameplayStart(); AU.resume(); }

let cardsGuard = 0;
function openCards(){
  G.state = 'cards'; G.ptr.down = false; SDK.gameplayStop();
  $('cardsTitle').textContent = 'DAWN ' + (G.day + 1);
  const pool = CARDS.filter(c => (G.up[c.id] || 0) < c.max && (!c.cond || c.cond()));
  const offers = [];
  while(offers.length < 3 && pool.length){
    const tot = pool.reduce((s, c) => s + RAR[c.rar].w, 0);
    let r = grng() * tot, i = 0;
    for(; i < pool.length; i++){ r -= RAR[pool[i].rar].w; if(r <= 0) break; }
    offers.push(pool.splice(Math.min(i, pool.length - 1), 1)[0]);
  }
  G.offers = offers;
  const row = $('cardRow'); row.innerHTML = '';
  offers.forEach((c, i) => {
    const lv = G.up[c.id] || 0, rc = RAR[c.rar];
    const d = document.createElement('div'); d.className = 'card'; d.style.setProperty('--c', rc.c); d.style.animationDelay = (i * .07) + 's';
    d.innerHTML = `<div class="ci">${c.icon}</div><div class="cr">${rc.n}${c.max > 1 && c.max < 99 ? ' · LV ' + lv + ' → ' + (lv + 1) : ''}</div><div class="cn">${c.name}</div><div class="cd">${c.desc}</div><div class="ck">${i + 1}</div>`;
    d.addEventListener('click', e => { e.stopPropagation(); pickCard(i); });
    row.appendChild(d);
  });
  show('cards'); AU.card();
  cardsGuard = performance.now() + 400;
}
function pickCard(i){
  if(G.state !== 'cards' || performance.now() < cardsGuard) return;
  const c = G.offers[i]; if(!c) return;
  AU.init(); AU.levelUp();
  G.up[c.id] = (G.up[c.id] || 0) + 1;
  if(c.id === 'heart'){ G.heartMax += 6; G.heartHp = G.heartMax; }
  if(c.id === 'mend') G.heartHp = Math.min(G.heartMax, G.heartHp + 8);
  if(c.id === 'supply'){ G.res.stone += 8; G.res.iron += 3; G.res.coal += 2; }
  hide('cards'); G.state = 'play'; SDK.gameplayStart();
  toast(c.name.toUpperCase(), c.desc, RAR[c.rar].c, 1800);
  afterCards();
}

/* ---------------- death / revive / over ---------------- */
const REVIVE_COST = 60;
let revIV = 0;
function onDeathDone(){
  const canPay = save.gems + G.gems >= REVIVE_COST;
  if(!G.revived && G.day >= 3 && (SDK.canRewarded() || canPay)) openRevive(); else gameOver();
}
function openRevive(){
  G.state = 'revive'; SDK.gameplayStop();
  $('revAdBtn').classList.toggle('hidden', !SDK.canRewarded());
  $('revPayBtn').classList.toggle('hidden', !(save.gems + G.gems >= REVIVE_COST));
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
  G.heartHp = Math.ceil(G.heartMax * .5);
  for(const m of G.mobs){ if(!m.dead && Math.hypot(m.x - C, m.y - C) < 3.2 && !m.d.boss){ m.dead = true; poof(m.x, m.y, m.z + .3, '#ff5ad9'); } }
  G.mobs = G.mobs.filter(m => !m.dead);
  G.pops.push({ ring:true, x:C, y:C, z:colH(C, C) + 1, r:0, max:3.2, life:.4 });
  AU.dawn(); announce('HEART REBUILT', '#ff5ad9');
  AU.setMusic(2, G.mobs.some(m => m.d.boss));
  SDK.gameplayStart();
}

const TIPS = [
  'Mine the block a monster is standing on — it <b>falls</b> and takes damage.',
  'Pits <b>2+ blocks deep</b> hurt a lot. 4 deep is usually lethal.',
  'Dig down to a <b>magma pocket</b> and monsters that step in burn instantly.',
  'Monsters can climb <b>one</b> block. Walls two high force them to dig.',
  'Towers on <b>high ground</b> shoot further.',
  'Tap a tower with its own tool again to <b>upgrade</b> it.',
  'Tap a <b>Blast Crate</b> with the pickaxe to detonate it yourself.',
  'Starting the night early gives <b>bonus gems</b>.',
  'The island <b>grows</b> after nights 2, 4 and 6 — with fresh ore.',
  'Gems unlock new towers and upgrades in the <b>SHOP</b>.',
];
function gameOver(){
  clearInterval(revIV);
  G.state = 'over'; G.ptr.down = false; SDK.gameplayStop(); tip(null); AU.setMusic(0);
  hide('hud'); hideAll(); $('toasts').innerHTML = '';
  commitMissions();
  const nights = Math.max(0, G.day - 1);
  let gems = Math.floor(G.gems);
  let extra = '';
  if(G.daily){
    const k = todayKey();
    if(save.daily.key !== k) save.daily = { key:k, best:0, bonus:false };
    save.daily.best = Math.max(save.daily.best, nights);
    if(!save.daily.bonus){ save.daily.bonus = true; gems += 30; extra = '<div class="oM"><span>Daily island played</span><b>+30 ◆</b></div>'; }
  }
  save.gems += gems; save.runs++;
  const newBest = nights > save.bestNight || (nights === save.bestNight && G.score > save.best);
  save.bestNight = Math.max(save.bestNight, nights); save.best = Math.max(save.best, G.score);
  const xp0 = save.xp, lv0 = save.level;
  save.xp += nights * 120 + G.kills * 3 + G.mined;
  let lvls = 0;
  while(save.xp >= xpNeed(save.level)){ save.xp -= xpNeed(save.level); save.level++; lvls++; save.gems += 25; }
  writeSave();

  $('oTitle').textContent = G.daily ? 'DAILY: ' + G.mod.name : 'THE FORT HAS FALLEN';
  $('oTag').classList.toggle('hidden', !(newBest && nights > 0));
  $('oNightsN').textContent = nights;
  $('oScore').textContent = fmt(G.score); $('oKills').textContent = fmt(G.kills); $('oMined').textContent = fmt(G.mined); $('oGems').textContent = '+' + fmt(gems);
  $('oLevel').textContent = save.level;
  const bar = $('oLvlBar'); bar.style.transition = 'none'; bar.style.width = (lvls ? 0 : xp0 / xpNeed(lv0) * 100) + '%'; void bar.offsetWidth;
  bar.style.transition = ''; setTimeout(() => bar.style.width = (save.xp / xpNeed(save.level) * 100) + '%', 60);
  let mh = extra;
  if(lvls) mh += `<div class="oM"><span>LEVEL UP! Now level ${save.level}</span><b>+${lvls * 25} ◆</b></div>`;
  for(const m of save.missions) if(m.fresh){ mh += `<div class="oM"><span>✔ ${m.txt}</span><b>+${m.reward} ◆</b></div>`; m.fresh = false; }
  $('oMissions').innerHTML = mh;
  const nextUnlock = UNLOCKS.find(u => !save.unlock[u.id]);
  $('oNext').innerHTML = nextUnlock ? (save.gems >= nextUnlock.cost ? `You can unlock the <b>${TOOL[nextUnlock.tool].name}</b> in the Shop!` : `<b>${nextUnlock.cost - save.gems} ◆</b> more to unlock the <b>${TOOL[nextUnlock.tool].name}</b>`) : save.bestNight > nights ? `Your record is <b>${save.bestNight}</b> nights` : '';
  $('oTip').innerHTML = 'TIP: ' + pick(TIPS);
  $('dblBtn').classList.toggle('hidden', !SDK.canRewarded() || gems <= 0); $('dblBtn').disabled = false;
  G.lastGems = gems;
  show('over');
  if(newBest && nights > 0){ SDK.happytime(); AU.levelUp(); }
}

function goMenu(){
  G.state = 'menu'; SDK.gameplayStop(); AU.setMusic(0);
  hideAll(); hide('hud'); tip(null);
  // a fresh backdrop island
  CAM.z = 1; CAM.px = CAM.py = 0;
  grng = Math.random; ISLE_R = 5; genWorld({}); G.mobs = []; G.parts = []; G.pops = []; G.shots = []; G.beams = []; G.light = 1; G.phase = 'day'; G.heartHp = G.heartMax = 20; G.tut = false; G.rise = null;
  fitCamera();
  rollMissions(); persist();
  refreshMenu(); show('menu');
}
function refreshMenu(){
  $('mGems').textContent = fmt(save.gems);
  $('mLevel').textContent = save.level;
  $('mLvlBar').style.width = (save.xp / xpNeed(save.level) * 100) + '%';
  $('mBestNight').textContent = save.bestNight; $('mBest').textContent = fmt(save.best); $('mKills').textContent = fmt(save.stats.kills);
  const seed = hashStr('digfort:' + todayKey()), mod = MODS[seed % MODS.length];
  const today = save.daily.key === todayKey();
  $('dailyMod').textContent = mod.name + ' — ' + mod.desc + (today && save.daily.best ? ' · BEST ' + save.daily.best + ' NIGHTS' : !today || !save.daily.bonus ? ' · +30 ◆' : '');
  $('missDot').classList.toggle('hidden', !save.mNew);
}

/* ---------------- shop ---------------- */
let shopTab = 'up';
function renderShop(){
  $('sGems').textContent = fmt(save.gems);
  document.querySelectorAll('#shop .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === shopTab));
  const L = $('shopList'); L.innerHTML = '';
  const row = (icon, title, sub, extraHtml, btnHtml, disabled, onBuy) => {
    const it = document.createElement('div'); it.className = 'item';
    it.innerHTML = `<div class="ii">${icon}</div><div class="it"><b>${title}</b><span>${sub}</span>${extraHtml || ''}</div>`;
    const b = document.createElement('button'); b.className = 'btn'; b.innerHTML = btnHtml; b.disabled = !!disabled;
    if(onBuy) onTap(b, onBuy);
    it.appendChild(b); L.appendChild(it);
  };
  const buy = cost => { if(save.gems < cost) return false; save.gems -= cost; AU.levelUp(); persist(); return true; };
  if(shopTab === 'up'){
    for(const m of META){
      const lv = save.meta[m.id] || 0, max = m.costs.length, cost = m.costs[lv];
      const pips = `<div class="pips">${Array.from({ length:max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>`;
      row(m.icon, m.name, m.desc, pips, lv >= max ? 'MAX' : `<span class="gem">◆</span> ${fmt(cost)}`, lv >= max || save.gems < cost, () => { if(buy(cost)){ save.meta[m.id] = lv + 1; renderShop(); } });
    }
  } else if(shopTab === 'unlock'){
    for(const u of UNLOCKS){
      const t = TOOL[u.tool], own = save.unlock[u.id];
      row(`<img src="${ICONS[t.id]}" alt="">`, t.name, t.desc + ' Cost: ' + costTxt(t.cost), '', own ? 'OWNED' : `<span class="gem">◆</span> ${fmt(u.cost)}`, own || save.gems < u.cost, () => { if(buy(u.cost)){ save.unlock[u.id] = true; toast('UNLOCKED', t.name + ' is now in your hotbar.', '#8fd14f'); renderShop(); } });
    }
  } else {
    for(const th of THEMES){
      const own = save.themes.includes(th.id), eq = save.theme === th.id;
      const sw = `<i style="width:30px;height:30px;display:block;border:3px solid #000;background:linear-gradient(${th.grass[0]} 40%,${th.dirt[0]} 40%)"></i>`;
      row(sw, th.name + ' World', own ? (eq ? 'Active' : 'Owned') : 'A new look for every block', '', eq ? 'ACTIVE' : own ? 'USE' : `<span class="gem">◆</span> ${fmt(th.cost)}`, eq || (!own && save.gems < th.cost), () => {
        if(!own){ if(!buy(th.cost)) return; save.themes.push(th.id); }
        save.theme = th.id; persist(); buildSprites(); buildIcons(); renderShop();
      });
    }
  }
}
function openMissions(){
  hideAll(); save.mNew = false; persist();
  $('missDone').textContent = save.missionsDone;
  const L = $('missList'); L.innerHTML = '';
  for(const m of save.missions){
    const pct = Math.min(100, m.p / m.n * 100);
    L.insertAdjacentHTML('beforeend', `<div class="item${m.done ? ' done' : ''}"><div class="ii" style="color:#8fd14f">${m.done ? '✔' : '◎'}</div><div class="it"><b>${m.txt}</b><span>${m.done ? 'Complete' : fmt(m.p) + ' / ' + fmt(m.n)}</span><div class="mBar"><i style="width:${pct}%"></i></div></div><div class="pill"><span class="gem">◆</span> ${m.reward}</div></div>`);
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

/* ---------------- input ---------------- */
function mobAt(px, py){
  let best = null, bd = 1e9;
  for(const m of G.mobs){
    if(m.dead) continue;
    const [sx, sy] = iso(m.x, m.y, m.z + m.d.size * .5), r = Math.max(22, m.d.size * TW * Z * .75), d = Math.hypot(px - sx, py - sy);
    if(d < r && d < bd){ bd = d; best = m; }
  }
  return best;
}
function wire(){
  onTap('playBtn', () => startRun(false));
  onTap('dailyBtn', () => startRun(true));
  onTap('shopBtn', () => { hideAll(); renderShop(); show('shop'); });
  onTap('missBtn', openMissions);
  onTap('setBtn', () => openSettings('menu'));
  onTap('pauseBtn', pauseGame);
  onTap('nightBtn', () => startNight());
  onTap('resumeBtn', resumeGame);
  onTap('pSetBtn', () => openSettings('pause'));
  onTap('quitBtn', () => askConfirm('End this run? You keep your gems.', () => { hide('pause'); gameOver(); }));
  onTap('revAdBtn', () => SDK.rewarded(ok => { if(ok) doRevive(); else toast('AD UNAVAILABLE', 'Try again in a moment.', '#ff3b5c'); }));
  onTap('revPayBtn', () => { const fromRun = Math.min(G.gems, REVIVE_COST); G.gems -= fromRun; save.gems -= REVIVE_COST - fromRun; doRevive(); });
  onTap('revNoBtn', () => { clearInterval(revIV); hide('revive'); gameOver(); });
  onTap('retryBtn', () => { const d = G.daily; SDK.midgame(() => startRun(d)); });
  onTap('oMenuBtn', () => SDK.midgame(goMenu));
  onTap('dblBtn', () => { $('dblBtn').disabled = true; SDK.rewarded(ok => { if(ok){ save.gems += G.lastGems; writeSave(); $('oGems').textContent = '+' + fmt(G.lastGems * 2); } else $('dblBtn').disabled = false; }); });
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

  const P = G.ptr, touches = new Map();
  let pinch = null;
  const pinchInfo = () => { const [a, b] = [...touches.values()]; return { d:Math.hypot(a.x - b.x, a.y - b.y) || 1, mx:(a.x + b.x) / 2, my:(a.y + b.y) / 2 }; };
  cv.addEventListener('wheel', e => { if(G.state !== 'play') return; e.preventDefault(); CAM.z *= Math.exp(-e.deltaY * .0015); fitCamera(); }, { passive:false });
  cv.addEventListener('pointerdown', e => {
    AU.init(); AU.resume();
    if(G.state !== 'play') return;
    e.preventDefault();
    if(e.pointerType !== 'mouse'){
      touches.set(e.pointerId, { x:e.clientX, y:e.clientY });
      if(touches.size === 2){
        // second finger: switch from mining to pinch-zoom / pan
        P.down = false; P.moved = true; G.mine.prog = 0;
        const pi = pinchInfo(); pinch = { d0:pi.d, z0:CAM.z, mx:pi.mx, my:pi.my, px:CAM.px, py:CAM.py };
        return;
      }
      if(touches.size > 2) return;
    }
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    Object.assign(P, { down:true, id:e.pointerId, x:e.clientX, y:e.clientY, sx:e.clientX, sy:e.clientY, moved:false, mobHit:false, tool:G.tool });
    G.hover = pickColumn(P.x, P.y);
    if(G.tool === 'pick'){
      const m = mobAt(P.x, P.y);
      if(m){
        P.mobHit = true;
        const dmg = 8 * pickPower() * (1 + (G.up.arm || 0));
        m.stun = Math.max(m.stun, .12); AU.swat();
        for(let i = 0; i < 6; i++) part3(m.x, m.y, m.z + m.d.size * .5, rnd(-2, 2), rnd(-2, 2), rnd(1, 3), '#ffffff', .3, 3);
        pop3(m.x, m.y, m.z + m.d.size + .3, '-' + Math.round(dmg), '#ffffff', 13);
        damageMob(m, dmg, 'tap');
      }
    }
  });
  addEventListener('pointermove', e => {
    if(touches.has(e.pointerId)) touches.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if(pinch && touches.size >= 2){
      const pi = pinchInfo();
      CAM.z = pinch.z0 * pi.d / pinch.d0; CAM.px = pinch.px + (pi.mx - pinch.mx); CAM.py = pinch.py + (pi.my - pinch.my);
      fitCamera(); return;
    }
    if(P.down && e.pointerId !== P.id) return;
    P.x = e.clientX; P.y = e.clientY;
    if(Math.hypot(P.x - P.sx, P.y - P.sy) > 10) P.moved = true;
    if(G.state === 'play' && (e.pointerType === 'mouse' || P.down)) G.hover = pickColumn(P.x, P.y);
  }, { passive:true });
  const up = e => {
    if(e) touches.delete(e.pointerId);
    if(pinch){ if(touches.size < 2) pinch = null; P.down = false; return; }
    if(!P.down || (e && e.pointerId !== P.id)) return;
    P.down = false;
    if(G.state === 'play' && G.tool !== 'pick' && P.tool === G.tool && !P.moved){ const c = pickColumn(P.x, P.y); if(c) placeAt(c.x, c.y); }
    if(e && e.pointerType !== 'mouse') G.hover = null;
  };
  addEventListener('pointerup', up);
  addEventListener('pointercancel', e => { touches.delete(e.pointerId); if(touches.size < 2) pinch = null; P.down = false; });
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
    if(G.state === 'play'){
      const t = TOOLS.find(t => t.key === k); if(t) selectTool(t.id);
      if((k === ' ' || k === 'n' || k === 'N') && G.phase === 'day' && !(G.tut && G.tutStep < 3)) startNight();
    }
    else if(G.state === 'cards' && ['1', '2', '3'].includes(k)) pickCard(+k - 1);
    else if(G.state === 'over' && k === 'Enter') $('retryBtn').click();
    else if(G.state === 'menu' && !$('menu').classList.contains('hidden') && k === 'Enter') $('playBtn').click();
  });
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 200));
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ if(G.state === 'play') pauseGame(); } else AU.resume(); });
  addEventListener('blur', () => { if(G.state === 'play') pauseGame(); });
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
    else if(G.state === 'menu'){ G.rt += dt; tickFx(dt); }
    render();
    if(G.state === 'play' || G.state === 'dying') updateHUD();
  }catch(err){ console.error(err); }
}
addEventListener('error', e => { try{ console.error(e.error || e.message); }catch(_){} });
addEventListener('unhandledrejection', e => { try{ e.preventDefault(); console.error(e.reason); }catch(_){} });

/* ---------------- boot ---------------- */
(async function boot(){
  G.q = 'high';
  genWorld({});
  resize();
  requestAnimationFrame(frame);
  SDK.onMute = m => AU.setPortalMute(m);
  await SDK.init();              // must resolve before the save is read (SDK Data Module)
  SDK.loadingStart();
  loadSave();
  applyQuality(); buildSprites(); buildIcons();
  wire();
  goMenu();
  SDK.loadingStop();
  $('boot').classList.add('gone'); setTimeout(() => $('boot').remove(), 500);
})();
