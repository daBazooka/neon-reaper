'use strict';
/* Input, HUD, menus and boot. */
let playing = false;
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }
const fmtT = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

const UI = {
  touch: matchMedia('(pointer:coarse)').matches,
  tab: 'perk',
  banner(a, b, col){
    const el = $('banner');
    el.querySelector('b').textContent = a; el.querySelector('b').style.color = col || '#fff';
    el.querySelector('small').textContent = b || '';
    el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden');
    clearTimeout(this.banT); this.banT = setTimeout(() => el.classList.add('hidden'), 2000);
  },
  tip(txt, ms){ const el = $('tip'); el.textContent = txt; el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden'); clearTimeout(this.tipT); this.tipT = setTimeout(() => el.classList.add('hidden'), ms || 4000); },
  toast(txt){ const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = txt; $('toasts').appendChild(d); setTimeout(() => d.remove(), 1900); },
  cardInfo(c){
    if(c.kind === 'el'){ const e = ELEMENTS[c.id], l = G.spells[c.id] || 0; return { icon: e.icon, name: e.name, desc: l ? 'Stronger, faster, more' : e.desc, lv: l ? `${e.el.toUpperCase()} LV ${l} ➜ ${l + 1}` : 'NEW ' + e.el.toUpperCase() + ' SPELL', col: e.col }; }
    if(c.kind === 'pas'){ const p = PASSIVES[c.id], l = G.pas[c.id] || 0; return { icon: p.icon, name: p.name, desc: p.desc, lv: l ? `LV ${l} ➜ ${l + 1}` : 'NEW CHARM', col: '#ffe9a8' }; }
    if(c.kind === 'fus'){ const f = FUSIONS[c.id]; return { icon: f.icon, name: f.name, desc: f.desc, lv: `✨ FUSION ${ELEMENTS[f.a].icon}+${ELEMENTS[f.b].icon}`, col: f.col }; }
    return { icon: '💖', name: 'Full Heal', desc: 'Restore all HP', lv: 'EVERYTHING MAXED!', col: '#ff8ab0' };
  },
  showLevel(){
    endPlay(); clearInput();
    const start = G.P.lvl === 1 && !Object.keys(G.spells).length;
    $('lvTitle').textContent = start ? 'CHOOSE YOUR FIRST SPELL' : G.choices.some(c => c.kind === 'fus') ? '✨ A FUSION AWAITS! ✨' : 'LEVEL ' + G.P.lvl + '!';
    const box = $('lvCards'); box.innerHTML = '';
    G.choices.forEach((c, i) => {
      const n = this.cardInfo(c), b = document.createElement('button');
      if(c.kind === 'fus') b.className = 'fus';
      b.style.borderColor = c.kind === 'fus' ? '' : n.col;
      b.innerHTML = `<div class="ci">${n.icon}</div><div><div class="cn" style="color:${n.col}">${n.name}</div><div class="lv">${n.lv}</div><div class="cd">${n.desc}</div></div>`;
      b.onclick = () => { if(G.state !== 'level') return; AU.init(); choose(c); renderSpells(); if(G.state === 'play'){ beginPlay(); if(!save.tut && start) UI.tip(UI.touch ? 'Drag anywhere to move. Spells cast themselves!' : 'Move with WASD or arrows (or drag). Spells cast themselves!', 5000); } };
      box.appendChild(b);
    });
    $('lvReroll').classList.toggle('hidden', G.rerolls <= 0 || start);
    $('lvReroll').textContent = '🎲 REROLL (' + G.rerolls + ')';
    show('level');
  },
  hideLevel(){ hide('level'); renderSpells(); },
  gameOver(win){ gameOver(win); }
};

const SCREENS = ['level', 'over', 'shop', 'book', 'missions', 'settings', 'pause'];
function anyScreen(){ return SCREENS.some(id => !$(id).classList.contains('hidden')); }
function closeScreens(){ SCREENS.forEach(hide); }
let backTo = null;
function openScreen(id, from){ backTo = from || null; SCREENS.forEach(s => s !== id && hide(s)); show(id); }

/* ---------------- flow ---------------- */
function toTitle(){
  endPlay(); closeScreens(); clearInput();
  newRun(true);
  AU.setStyle('title');
  hide('hud'); hide('tip'); hide('banner'); hide('stick'); show('title');
  refreshTitle();
}
function refreshTitle(){
  $('tStones').textContent = save.stones;
  $('tBest').textContent = save.stats.dawns ? '🌅 Dawns: ' + save.stats.dawns : save.best ? '🏆 Best ' + fmtT(save.best) : '🏮 First night!';
  $('tHint').textContent = UI.touch ? 'Drag anywhere to move · spells cast themselves' : 'WASD / arrows to move · spells cast themselves';
  const can = PERKS.some(p => save.perk[p.id] < p.max && perkCost(p, save.perk[p.id]) <= save.stones);
  $('shopBadge').classList.toggle('hidden', !can);
  $('miBadge').classList.toggle('hidden', !save.missions.some(m => m.done && !m.claimed));
}
function play(){
  closeScreens(); hide('title');
  SDK.midgame(() => {
    clearInput();
    newRun(false);
    AU.setStyle('play');
    show('hud'); renderSpells();
    UI.showLevel();
  });
}
function runStones(win){
  const r = G.run;
  return Math.floor(r.kills / 40) + Math.floor(r.time / 60) * 3 + r.bosses * 10 + (win ? 50 : 0);
}
function gameOver(win){
  endPlay(); clearInput(); hide('stick');
  const st = runStones(win);
  save.stones += st; save.runs++;
  const t = Math.min(RUN_TIME, G.run.time);
  const newBest = t > save.best;
  if(newBest) save.best = t;
  save.bestKills = Math.max(save.bestKills, G.run.kills);
  missionTick(G.run); if(!save.tut) save.tut = 1; persist();
  G.lastStones = st;
  $('oTitle').textContent = win ? '🌅 DAWN HAS COME!' : newBest && save.runs > 1 ? '🏆 NEW BEST!' : 'THE SHADOWS WON';
  $('oTime').textContent = win ? 'YOU SURVIVED!' : fmtT(t);
  $('oBest').textContent = win ? 'The Night King is banished and the world is a garden of light.' : 'Best: ' + fmtT(save.best) + ' · dawn comes at 8:00';
  $('oStats').innerHTML = [['👻 Shadows banished', G.run.kills], ['🌸 Flowers grown', G.run.flowers], ['⭐ Level', G.run.level], ['✨ Fusions', G.run.fusions], ['👑 Bosses', G.run.bosses]].map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join('');
  $('oStones').textContent = '+' + st;
  $('oRevive').classList.toggle('hidden', win || !SDK.canRewarded() || G.adRevived);
  $('oDouble').classList.toggle('hidden', !SDK.canRewarded()); $('oDouble').disabled = false;
  $('oMiss').innerHTML = save.missions.map(m => `<div class="${m.done ? 'done' : ''}">${m.done ? '✅' : '🎯'} ${MISSION_POOL.find(p => p.id === m.id).txt(m.n)} <b>${Math.min(m.prog, m.n)}/${m.n}</b></div>`).join('');
  if(!win) AU.over();
  openScreen('over');
}

/* ---------------- shop / book / missions / settings ---------------- */
function buildShop(){
  $('sStones').textContent = save.stones;
  const g = $('sGrid'); g.innerHTML = '';
  document.querySelectorAll('#shop .tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.tab));
  if(UI.tab === 'perk'){
    g.style.display = 'flex'; g.style.flexDirection = 'column'; g.style.gap = '8px';
    for(const p of PERKS){
      const l = save.perk[p.id], max = l >= p.max, cost = perkCost(p, l);
      const d = document.createElement('div'); d.className = 'row';
      d.innerHTML = `<div class="ic">${p.icon}</div><div class="tx">${p.name} <small>${p.desc} · level ${l}/${p.max}</small></div><button>${max ? 'MAX' : '🌙 ' + cost}</button>`;
      const b = d.querySelector('button'); b.disabled = max || save.stones < cost;
      b.onclick = () => { if(max || save.stones < cost) return; save.stones -= cost; save.perk[p.id]++; persist(); AU.buy(); buildShop(); refreshTitle(); };
      g.appendChild(d);
    }
    return;
  }
  g.style.display = ''; g.style.flexDirection = ''; g.style.gap = '';
  for(const it of HATS){
    const own = !!save.own[it.id], eq = save.hat === it.id;
    const b = document.createElement('button'); b.className = eq ? 'eq' : '';
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
    const saved = save.hat; save.hat = it.id;
    c.translate(60, 90); c.scale(2, 2);
    try{ drawWitch(c, { x: 0, y: 0, face: 1, walk: 0, inv: 0, vx: 0, vy: 0, r: 15 }, 0, true); }catch(e){}
    save.hat = saved;
    b.appendChild(cv);
    const n = document.createElement('div'); n.textContent = it.name; b.appendChild(n);
    const p = document.createElement('div'); p.className = own ? '' : 'price'; p.textContent = eq ? 'WEARING' : own ? 'OWNED' : '🌙 ' + it.price; b.appendChild(p);
    b.onclick = () => {
      if(!own){ if(save.stones < it.price){ AU.click(); UI.toast('Need more moonstones!'); return; } save.stones -= it.price; save.own[it.id] = 1; AU.buy(); }
      else AU.click();
      save.hat = it.id; persist(); buildShop(); refreshTitle();
    };
    g.appendChild(b);
  }
}
function buildBook(){
  const l = $('bkList'); l.innerHTML = '';
  const row = (icon, name, desc, extra) => { const d = document.createElement('div'); d.className = 'row'; d.innerHTML = `<div class="ic">${icon}</div><div class="tx">${name} <small>${desc}</small></div>${extra || ''}`; l.appendChild(d); };
  for(const id in ELEMENTS){ const e = ELEMENTS[id]; row(e.icon, `<span style="color:${e.col}">${e.name}</span>`, e.desc); }
  for(const id in FUSIONS){
    const f = FUSIONS[id], seen = save.seen[id];
    row(seen ? f.icon : '❔', seen ? `<span style="color:${f.col}">${f.name}</span>` : '???', (seen ? f.desc + ' · ' : 'Undiscovered fusion · ') + ELEMENTS[f.a].icon + ' + ' + ELEMENTS[f.b].icon);
  }
}
function buildMissions(){
  const l = $('mList'); l.innerHTML = '';
  for(const m of save.missions){
    const p = MISSION_POOL.find(x => x.id === m.id);
    const d = document.createElement('div'); d.className = 'row';
    d.innerHTML = `<div class="ic">🎯</div><div class="tx">${p.txt(m.n)}<div class="bar"><i style="width:${Math.min(100, m.prog / m.n * 100)}%"></i></div><small>${Math.min(m.prog, m.n)} / ${m.n}</small></div><button>${m.done ? 'CLAIM' : '🌙 ' + m.rw}</button>`;
    const b = d.querySelector('button'); b.disabled = !m.done;
    b.onclick = () => { if(!m.done) return; m.claimed = true; save.stones += m.rw; AU.buy(); UI.toast('Mission complete! 🌙 ' + m.rw); fillMissions(); persist(); buildMissions(); refreshTitle(); };
    l.appendChild(d);
  }
  $('mStats').textContent = `Best: ${fmtT(save.best)} · Shadows: ${save.stats.kills} · Bosses: ${save.stats.bosses} · Dawns: ${save.stats.dawns}`;
}
function buildSettings(){ document.querySelectorAll('.setRow').forEach(r => { const v = save.opt[r.dataset.opt], b = r.querySelector('b'); b.textContent = v ? 'ON' : 'OFF'; b.classList.toggle('off', !v); }); }

/* ---------------- pause ---------------- */
function pauseGame(){ if(G.state !== 'play') return; G.state = 'pause'; clearInput(); endPlay(); openScreen('pause'); }
function resumeGame(){ closeScreens(); if(G.state === 'pause'){ G.state = 'play'; beginPlay(); } }

/* ---------------- input ---------------- */
const K = {};
const stick = { id: null, x: 0, y: 0, dx: 0, dy: 0 };
function clearInput(){ for(const k in K) K[k] = false; stick.id = null; stick.dx = stick.dy = 0; G.inX = G.inY = 0; hide('stick'); }
function syncInput(){
  if(G.demo) return;
  let x = (K.ArrowRight || K.KeyD ? 1 : 0) - (K.ArrowLeft || K.KeyA ? 1 : 0);
  let y = (K.ArrowDown || K.KeyS ? 1 : 0) - (K.ArrowUp || K.KeyW ? 1 : 0);
  if(stick.id !== null){ x = stick.dx; y = stick.dy; }
  const l = Math.hypot(x, y); if(l > 1){ x /= l; y /= l; }
  G.inX = x; G.inY = y;
}
function wire(){
  const cv = R.cv;
  cv.addEventListener('pointerdown', e => {
    AU.init();
    if(SDK.adBusy || anyScreen() || G.state !== 'play' || stick.id !== null) return;
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    stick.id = e.pointerId; stick.x = e.clientX; stick.y = e.clientY; stick.dx = stick.dy = 0;
    const s = $('stick'); s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px'; s.firstElementChild.style.transform = ''; show('stick');
    syncInput();
  });
  cv.addEventListener('pointermove', e => {
    if(e.pointerId !== stick.id) return;
    let dx = e.clientX - stick.x, dy = e.clientY - stick.y; const l = Math.hypot(dx, dy), m = 50;
    if(l > m){ dx *= m / l; dy *= m / l; }
    stick.dx = l > 6 ? dx / m : 0; stick.dy = l > 6 ? dy / m : 0;
    $('stick').firstElementChild.style.transform = `translate(${dx}px,${dy}px)`;
    syncInput();
  });
  const up = e => { if(e.pointerId !== stick.id) return; stick.id = null; stick.dx = stick.dy = 0; hide('stick'); syncInput(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  addEventListener('keydown', e => {
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if(SDK.adBusy) return;
    AU.init();
    if(e.repeat) return;
    if(e.code === 'Escape' || e.code === 'KeyP'){ if(G.state === 'pause') resumeGame(); else if(G.state === 'play') pauseGame(); else if(anyScreen() && G.state === 'title') closeScreens(); return; }
    if(G.state === 'title' && !anyScreen() && (e.code === 'Space' || e.code === 'Enter')){ play(); return; }
    if(!$('over').classList.contains('hidden') && (e.code === 'Space' || e.code === 'Enter')){ $('oAgain').click(); return; }
    if(!$('level').classList.contains('hidden') && /^Digit[123]$/.test(e.code)){ const b = $('lvCards').children[+e.code.slice(5) - 1]; if(b) b.click(); return; }
    K[e.code] = true; syncInput();
  });
  addEventListener('keyup', e => { K[e.code] = false; syncInput(); });
  addEventListener('blur', clearInput);
  document.addEventListener('contextmenu', e => e.preventDefault());

  const tap = (id, fn) => $(id).addEventListener('click', e => { if(SDK.adBusy) return; AU.init(); AU.click(); fn(e); });
  tap('playBtn', play);
  tap('bShop', () => { buildShop(); openScreen('shop'); });
  tap('bBook', () => { buildBook(); openScreen('book'); });
  tap('bMi', () => { buildMissions(); openScreen('missions'); });
  tap('bSet', () => { buildSettings(); openScreen('settings'); });
  tap('pauseBtn', pauseGame);
  tap('pResume', resumeGame);
  tap('pSet', () => { buildSettings(); openScreen('settings', 'pause'); });
  tap('pQuit', () => { closeScreens(); G.state = 'over'; gameOver(false); });
  tap('lvReroll', () => { if(G.rerolls <= 0) return; G.rerolls--; G.choices = rollChoices(); UI.showLevel(); });
  tap('oHome', toTitle);
  tap('oShop', () => { buildShop(); openScreen('shop', 'over'); });
  tap('oAgain', play);
  tap('oRevive', () => SDK.rewarded(ok => {
    if(!ok) return;
    save.stones -= G.lastStones; save.runs--; persist();
    G.adRevived = true; G.P.hp = G.P.max; G.P.inv = 3; G.state = 'play'; closeScreens();
    moonBurst(); beginPlay();
  }));
  tap('oDouble', () => { $('oDouble').disabled = true; SDK.rewarded(ok => { if(!ok){ $('oDouble').disabled = false; return; } save.stones += G.lastStones; persist(); $('oStones').textContent = '+' + G.lastStones * 2; $('oDouble').classList.add('hidden'); AU.coin(); }); });
  document.querySelectorAll('#shop .tabs button').forEach(b => b.addEventListener('click', () => { AU.click(); UI.tab = b.dataset.tab; buildShop(); }));
  document.querySelectorAll('.back').forEach(b => b.addEventListener('click', () => { AU.click(); hide(b.closest('.screen').id); if(backTo){ show(backTo); backTo = null; } else refreshTitle(); }));
  document.querySelectorAll('.setRow').forEach(r => r.addEventListener('click', () => { const k = r.dataset.opt; save.opt[k] = !save.opt[k]; persist(); AU.apply(); AU.click(); buildSettings(); }));
  document.querySelectorAll('.screen, #hud button, #title button').forEach(el => el.addEventListener('pointerdown', e => e.stopPropagation()));
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ persist(); pauseGame(); } else AU.resume(); });
  SDK.onMute = m => AU.setPortalMute(m);
}

/* ---------------- HUD ---------------- */
function renderSpells(){
  const h = [];
  for(const id in G.fus) h.push(`<span class="fu">${FUSIONS[id].icon}</span>`);
  for(const id in G.spells) h.push(`<span>${ELEMENTS[id].icon}<small>${G.spells[id]}</small></span>`);
  for(const id in G.pas) h.push(`<span>${PASSIVES[id].icon}<small>${G.pas[id]}</small></span>`);
  $('spellRow').innerHTML = h.join('');
}
let hudK = '';
function updateHUD(){
  if(G.state === 'title' || !G.P) return;
  const P = G.P, left = RUN_TIME - G.t;
  const k = [Math.ceil(P.hp), P.max, P.lvl, Math.floor(P.xp), Math.ceil(left), G.state, G.run.kills, G.run.flowers, G.boss && !G.boss.dead ? Math.ceil(G.boss.hp) : -1].join();
  if(k === hudK) return; hudK = k;
  $('hpBar').firstElementChild.style.width = clamp(P.hp / P.max * 100, 0, 100) + '%';
  $('hpTxt').textContent = Math.max(0, Math.ceil(P.hp)) + ' / ' + P.max;
  $('xpBar').firstElementChild.style.width = clamp(P.xp / P.need * 100, 0, 100) + '%';
  $('lvTxt').textContent = 'LV ' + P.lvl;
  const fin = G.bossIdx >= BOSSES.length && G.boss && !G.boss.dead && G.boss.final;
  const dn = G.state === 'dawn';
  $('timeTxt').textContent = dn ? '🌅' : fin ? '🌑' : fmtT(left);
  $('dawnTxt').textContent = dn ? 'dawn has come' : fin ? 'banish him for dawn' : 'until dawn';
  $('killTxt').textContent = '👻 ' + G.run.kills;
  $('flowerTxt').textContent = '🌸 ' + G.run.flowers;
  const b = G.boss && !G.boss.dead ? G.boss : null;
  $('bossBar').classList.toggle('hidden', !b);
  if(b){ $('bossName').textContent = '👑 ' + b.name; $('bossBar').querySelector('i').style.width = clamp(b.hp / b.max * 100, 0, 100) + '%'; }
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
