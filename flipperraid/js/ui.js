'use strict';
/* Input, HUD, menus and boot. */
let playing = false;
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }

const UI = {
  touch: matchMedia('(pointer:coarse)').matches,
  tab: 'perk', choices: [],
  banner(a, b, col){
    const el = $('banner');
    el.querySelector('b').textContent = a; el.querySelector('b').style.color = col || '#fff';
    el.querySelector('small').textContent = b || '';
    el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden');
    clearTimeout(this.banT); this.banT = setTimeout(() => el.classList.add('hidden'), 1800);
  },
  tip(txt, ms){ const el = $('tip'); el.textContent = txt; el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden'); clearTimeout(this.tipT); this.tipT = setTimeout(() => el.classList.add('hidden'), ms || 4000); },
  toast(txt){ const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = txt; $('toasts').appendChild(d); setTimeout(() => d.remove(), 1900); },
  showPick(){
    endPlay();
    this.choices = rollCards();
    this.renderPick();
    $('pTitle').textContent = G.room % 5 === 0 ? '👑 BOSS LOOT: CHOOSE A POWER' : 'CHOOSE A POWER';
    show('pick');
  },
  renderPick(){
    const box = $('pCards'); box.innerHTML = '';
    for(const c of this.choices){
      const b = document.createElement('button'); b.className = 'r' + c.rar;
      const lv = G.cards[c.id] || 0;
      b.innerHTML = `<div class="ci">${c.icon}</div><div><div class="cn">${c.name}</div><div class="cd">${c.desc}</div>${lv ? `<div class="lv">LEVEL ${lv} ➜ ${lv + 1}</div>` : ''}</div>`;
      b.onclick = () => { AU.init(); addCard(c); this.renderCards(); nextRoom(); beginPlay(); };
      box.appendChild(b);
    }
    $('pReroll').classList.toggle('hidden', G.rerolls <= 0);
    $('pReroll').textContent = '🎲 REROLL (' + G.rerolls + ')';
  },
  hidePick(){ hide('pick'); },
  renderCards(){
    const counts = {};
    for(const c of G.cardList) counts[c.id] = (counts[c.id] || 0) + 1;
    $('cardRow').innerHTML = Object.keys(counts).map(id => { const c = CARDS.find(x => x.id === id); return `<span title="${c.name}">${c.icon}${counts[id] > 1 ? counts[id] : ''}</span>`; }).join('');
  },
  gameOver(){ gameOver(); }
};

const SCREENS = ['pick', 'over', 'shop', 'missions', 'settings', 'pause'];
function anyScreen(){ return SCREENS.some(id => !$(id).classList.contains('hidden')); }
function closeScreens(){ SCREENS.forEach(hide); }
let backTo = null;
function openScreen(id, from){ backTo = from || null; SCREENS.forEach(s => s !== id && hide(s)); show(id); }

/* ---------------- flow ---------------- */
function toTitle(){
  endPlay(); closeScreens();
  newRun(true);
  AU.setStyle('title');
  hide('hud'); hide('tip'); hide('banner'); hide('touchL'); hide('touchR'); show('title');
  refreshTitle();
}
function refreshTitle(){
  $('tGems').textContent = save.gems;
  $('tBest').textContent = save.best ? '🏆 Room ' + save.best : '⚔ First raid!';
  $('tHint').textContent = UI.touch ? 'Tap the LEFT or RIGHT side to flip' : '← / A and → / D flip · Space flips both · or click left / right';
  const can = PERKS.some(p => save.perk[p.id] < p.max && perkCost(p, save.perk[p.id]) <= save.gems);
  $('shopBadge').classList.toggle('hidden', !can);
  $('miBadge').classList.toggle('hidden', !save.missions.some(m => m.done && !m.claimed));
}
function play(){
  closeScreens(); hide('title');
  SDK.midgame(() => {
    G.inL = G.inR = false;
    newRun(false);
    AU.setStyle('play');
    show('hud'); UI.renderCards();
    if(UI.touch){ show('touchL'); show('touchR'); }
    beginPlay();
    if(!save.tut) UI.tip(UI.touch ? 'Tap LEFT / RIGHT to flip. Smash the monsters!' : 'Use ← → (or A / D) to flip. Smash the monsters!', 5000);
  });
}
function gameOver(){
  endPlay();
  hide('touchL'); hide('touchR');
  const gems = runGems();
  save.gems += gems; save.runs++;
  const newBest = G.room > save.best;
  if(newBest) save.best = G.room;
  save.bestScore = Math.max(save.bestScore, G.score);
  missionTick(G.room); if(!save.tut) save.tut = 1; persist();
  G.lastGems = gems;
  $('oTitle').textContent = newBest && save.runs > 1 ? '🏆 NEW BEST!' : 'RAID OVER';
  $('oRoom').textContent = 'ROOM ' + G.room;
  $('oBest').textContent = 'Best: room ' + save.best + ' · score ' + save.bestScore.toLocaleString();
  $('oStats').innerHTML = [['🏅 Score', G.score.toLocaleString()], ['💀 Monsters', G.run.kills], ['👑 Bosses', G.run.bosses], ['💰 Jackpots', G.run.jack], ['🎯 Crits', G.run.crits], ['⛓ Best combo', G.run.maxCombo]].map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join('');
  $('oGems').textContent = '+' + gems;
  $('oRevive').classList.toggle('hidden', !SDK.canRewarded() || G.revived);
  $('oDouble').classList.toggle('hidden', !SDK.canRewarded());
  $('oMiss').innerHTML = save.missions.map(m => `<div class="${m.done ? 'done' : ''}">${m.done ? '✅' : '🎯'} ${MISSION_POOL.find(p => p.id === m.id).txt(m.n)} <b>${Math.min(m.prog, m.n)}/${m.n}</b></div>`).join('');
  AU.over();
  openScreen('over');
}

/* ---------------- shop / missions / settings ---------------- */
function buildShop(){
  $('sGems').textContent = save.gems;
  const g = $('sGrid'); g.innerHTML = '';
  document.querySelectorAll('#shop .tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.tab));
  if(UI.tab === 'perk'){
    g.style.display = 'flex'; g.style.flexDirection = 'column'; g.style.gap = '8px';
    for(const p of PERKS){
      const l = save.perk[p.id], max = l >= p.max, cost = perkCost(p, l);
      const d = document.createElement('div'); d.className = 'row';
      d.innerHTML = `<div class="ic">${p.icon}</div><div class="tx">${p.name} <small>${p.desc} · level ${l}/${p.max}</small></div><button>${max ? 'MAX' : '💎 ' + cost}</button>`;
      const b = d.querySelector('button'); b.disabled = max || save.gems < cost;
      b.onclick = () => { if(max || save.gems < cost) return; save.gems -= cost; save.perk[p.id]++; persist(); AU.buy(); buildShop(); refreshTitle(); };
      g.appendChild(d);
    }
    return;
  }
  g.style.display = ''; g.style.flexDirection = ''; g.style.gap = '';
  for(const it of BALLS){
    const own = !!save.own[it.id], eq = save.ball === it.id;
    const b = document.createElement('button'); b.className = eq ? 'eq' : '';
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
    const gr = c.createRadialGradient(54, 54, 4, 64, 64, 40); gr.addColorStop(0, it.c1); gr.addColorStop(1, it.c2 === 'rainbow' ? '#ff7ad8' : it.c2);
    c.fillStyle = gr; c.strokeStyle = '#000'; c.lineWidth = 4; c.beginPath(); c.arc(64, 64, 40, 0, TAU); c.fill(); c.stroke();
    b.appendChild(cv);
    const n = document.createElement('div'); n.textContent = it.name; b.appendChild(n);
    const p = document.createElement('div'); p.className = own ? '' : 'price'; p.textContent = eq ? 'EQUIPPED' : own ? 'OWNED' : '💎 ' + it.price; b.appendChild(p);
    b.onclick = () => {
      if(!own){ if(save.gems < it.price){ AU.lose1(); UI.toast('Need more gems!'); return; } save.gems -= it.price; save.own[it.id] = 1; AU.buy(); }
      else AU.click();
      save.ball = it.id; persist(); buildShop(); refreshTitle();
    };
    g.appendChild(b);
  }
}
function buildMissions(){
  const l = $('mList'); l.innerHTML = '';
  for(const m of save.missions){
    const p = MISSION_POOL.find(x => x.id === m.id);
    const d = document.createElement('div'); d.className = 'row';
    d.innerHTML = `<div class="ic">🎯</div><div class="tx">${p.txt(m.n)}<div class="bar"><i style="width:${Math.min(100, m.prog / m.n * 100)}%"></i></div><small>${Math.min(m.prog, m.n)} / ${m.n}</small></div><button>${m.done ? 'CLAIM' : '💎 ' + m.rw}</button>`;
    const b = d.querySelector('button'); b.disabled = !m.done;
    b.onclick = () => { if(!m.done) return; m.claimed = true; save.gems += m.rw; AU.buy(); UI.toast('Mission complete! 💎 ' + m.rw); fillMissions(); persist(); buildMissions(); refreshTitle(); };
    l.appendChild(d);
  }
  $('mStats').textContent = `Best room: ${save.best} · Monsters: ${save.stats.kills} · Bosses: ${save.stats.bosses}`;
}
function buildSettings(){ document.querySelectorAll('.setRow').forEach(r => { const v = save.opt[r.dataset.opt], b = r.querySelector('b'); b.textContent = v ? 'ON' : 'OFF'; b.classList.toggle('off', !v); }); }

/* ---------------- pause ---------------- */
function pauseGame(){ if(G.state !== 'play') return; G.state = 'pause'; G.inL = G.inR = false; endPlay(); openScreen('pause'); }
function resumeGame(){ closeScreens(); if(G.state === 'pause'){ G.state = 'play'; beginPlay(); } }

/* ---------------- input ---------------- */
const ptrs = new Map();
function setFlip(side, on){
  if(G.state !== 'play') return;
  const was = side === 'L' ? G.inL : G.inR;
  if(side === 'L') G.inL = on; else G.inR = on;
  if(on && !was) AU.flip();
}
function syncPtrs(){
  let l = false, r = false;
  for(const s of ptrs.values()){ if(s === 'L') l = true; else r = true; }
  setFlip('L', l); setFlip('R', r);
}
function wire(){
  const cv = R.cv;
  cv.addEventListener('pointerdown', e => {
    AU.init();
    if(SDK.adBusy || anyScreen() || G.state !== 'play') return;
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    ptrs.set(e.pointerId, e.clientX < R.W / 2 ? 'L' : 'R'); syncPtrs();
  });
  const up = e => { ptrs.delete(e.pointerId); syncPtrs(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const K = {};
  const keySync = () => { setFlip('L', !!(K.ArrowLeft || K.KeyA || K.KeyZ || K.ShiftLeft || K.Space)); setFlip('R', !!(K.ArrowRight || K.KeyD || K.KeyM || K.Slash || K.ShiftRight || K.Space)); };
  addEventListener('keydown', e => {
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if(SDK.adBusy) return;
    AU.init();
    if(e.repeat) return;
    if(e.code === 'Escape' || e.code === 'KeyP'){ if(G.state === 'pause') resumeGame(); else if(G.state === 'play') pauseGame(); else if(anyScreen() && G.state === 'title') closeScreens(); return; }
    if(G.state === 'title' && !anyScreen() && (e.code === 'Space' || e.code === 'Enter')){ play(); return; }
    if(!$('over').classList.contains('hidden') && (e.code === 'Space' || e.code === 'Enter')){ $('oAgain').click(); return; }
    if(!$('pick').classList.contains('hidden') && /^Digit[123]$/.test(e.code)){ const b = $('pCards').children[+e.code.slice(5) - 1]; if(b) b.click(); return; }
    K[e.code] = true; keySync();
  });
  addEventListener('keyup', e => { K[e.code] = false; keySync(); });
  addEventListener('blur', () => { for(const k in K) K[k] = false; ptrs.clear(); G.inL = G.inR = false; });
  document.addEventListener('contextmenu', e => e.preventDefault());

  const tap = (id, fn) => $(id).addEventListener('click', e => { if(SDK.adBusy) return; AU.init(); AU.click(); fn(e); });
  tap('playBtn', play);
  tap('bShop', () => { buildShop(); openScreen('shop'); });
  tap('bMi', () => { buildMissions(); openScreen('missions'); });
  tap('bSet', () => { buildSettings(); openScreen('settings'); });
  tap('pauseBtn', pauseGame);
  tap('pResume', resumeGame);
  tap('pSet', () => { buildSettings(); openScreen('settings', 'pause'); });
  tap('pQuit', () => { closeScreens(); G.state = 'play'; G.lives = 0; gameOverNow(); });
  tap('pReroll', () => { if(G.rerolls <= 0) return; G.rerolls--; UI.choices = rollCards(); UI.renderPick(); });
  tap('oHome', toTitle);
  tap('oShop', () => { buildShop(); openScreen('shop', 'over'); });
  tap('oAgain', play);
  tap('oRevive', () => SDK.rewarded(ok => {
    if(!ok) return;
    save.gems -= G.lastGems; save.runs--; persist();
    G.revived = true; G.lives = 1; G.state = 'play'; closeScreens(); if(UI.touch){ show('touchL'); show('touchR'); }
    G.saveT = 5; launchBall(); beginPlay();
  }));
  tap('oDouble', () => { $('oDouble').disabled = true; SDK.rewarded(ok => { if(!ok) return; save.gems += G.lastGems; persist(); $('oGems').textContent = '+' + G.lastGems * 2; $('oDouble').classList.add('hidden'); AU.coin(); }); });
  document.querySelectorAll('#shop .tabs button').forEach(b => b.addEventListener('click', () => { AU.click(); UI.tab = b.dataset.tab; buildShop(); }));
  document.querySelectorAll('.back').forEach(b => b.addEventListener('click', () => { AU.click(); hide(b.closest('.screen').id); if(backTo){ show(backTo); backTo = null; } else refreshTitle(); }));
  document.querySelectorAll('.setRow').forEach(r => r.addEventListener('click', () => { const k = r.dataset.opt; save.opt[k] = !save.opt[k]; persist(); AU.apply(); AU.click(); buildSettings(); }));
  document.querySelectorAll('.screen, #hud button, #title button').forEach(el => el.addEventListener('pointerdown', e => e.stopPropagation()));
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ persist(); pauseGame(); } else AU.resume(); });
  SDK.onMute = m => AU.setPortalMute(m);
}

/* ---------------- HUD ---------------- */
function updateHUD(){
  if(G.state === 'title') return;
  $('scoreTxt').textContent = G.score.toLocaleString();
  $('roomTxt').textContent = (G.room % 5 === 0 ? '👑 ' : '⚔ ') + 'ROOM ' + G.room;
  $('ballsTxt').textContent = '●'.repeat(Math.max(0, G.lives));
  $('coinTxt').textContent = G.coins;
  $('comboTxt').classList.toggle('hidden', G.combo < 3);
  $('comboTxt').textContent = '⛓ ' + G.combo + ' COMBO';
}

/* ---------------- loop + boot ---------------- */
let last = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > 0.05) dt = 0.05;
  try{ update(dt); R.draw(); updateHUD(); }catch(err){ console.error(err); }
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
