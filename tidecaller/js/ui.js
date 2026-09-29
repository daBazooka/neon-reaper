'use strict';
/* =====================================================================
   TIDECALLER UI: input, HUD, screens, boot.
   ===================================================================== */
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
const SCREENS = ['result', 'shop', 'missions', 'log', 'pause', 'settings'];
function onTap(el, fn){ el = typeof el === 'string' ? $(el) : el; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }

/* ---------------- HUD ---------------- */
const hc = {};
function setH(k, v, fn){ if(hc[k] === v) return; hc[k] = v; fn(v); }
function updateHUD(){
  if(G.state !== 'run' && G.state !== 'dying') return;
  setH('d', Math.floor(G.dist), v => $('dist').textContent = fmt(v) + ' m');
  setH('c', save.coins, v => $('coins').textContent = fmt(v));
  setH('h', G.hearts + '/' + G.maxHearts, () => { let s = ''; for(let i = 0; i < G.maxHearts; i++) s += `<span class="${i < G.hearts ? '' : 'off'}">❤</span>`; $('hearts').innerHTML = s; });
  setH('m', G.combo, v => { const c = $('combo'); if(v <= 1) c.classList.add('hidden'); else { c.classList.remove('hidden'); c.querySelector('b').textContent = '×' + v; c.style.animation = 'none'; void c.offsetWidth; c.style.animation = ''; } });
  if(G.combo > 1) $('combo').querySelector('i').style.transform = `scaleX(${Math.max(0, 1 - G.comboT / 8)})`;
}
let hintT = 0;
function showHint(txt, big){ const h = $('hint'); h.textContent = txt; h.className = big ? 'big' : ''; void h.offsetWidth; h.style.animation = 'none'; void h.offsetWidth; h.style.animation = ''; clearTimeout(hintT); hintT = setTimeout(() => hide('hint'), 2700); }
function showBanner(name){ const b = $('banner'); b.innerHTML = '<small>NOW SAILING</small>' + name; b.classList.remove('hidden'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; setTimeout(() => hide('banner'), 2900); }
function showToast(head, txt, gold){ const t = document.createElement('div'); t.className = 'toast' + (gold ? ' gold' : ''); t.innerHTML = `<b>${head}</b><span>${txt}</span>`; $('toasts').appendChild(t); setTimeout(() => t.remove(), 3500); }

/* ---------------- flow ---------------- */
let playing = false;
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }
function toTitle(){
  SCREENS.forEach(hide); hide('hud'); endPlay();
  resetWorld(); G.state = 'title'; G.ship = shipById(save.ship);
  G.biome = 0; G.biomeK = 1; prevBiome = curBiome = 0; AU.setBiome(0);
  $('title').classList.remove('hidden', 'gone');
  $('tBest').textContent = save.best ? `BEST ${fmt(save.best)} m  ·  ${rankName(save.rank)}` + (save.missions.every(m => m.done) ? '  ·  ⭐ RANK UP READY!' : '') : '';
}
function sail(){
  SCREENS.forEach(hide);
  if(G.state !== 'title'){ resetWorld(); G.biome = 0; G.biomeK = 1; prevBiome = curBiome = 0; AU.setBiome(0); }
  $('title').classList.add('gone'); setTimeout(() => $('title').classList.add('hidden'), 400);
  for(const k in hc) delete hc[k];
  startRun(); show('hud'); beginPlay();
}
function pauseGame(){ if(G.state !== 'run') return; G.state = 'pause'; endPlay(); show('pause'); }
function resumeGame(){ SCREENS.forEach(hide); if(G.state === 'pause'){ G.state = 'run'; beginPlay(); } }

/* ---------------- result ---------------- */
function misRow(m, isNew){
  const T = MTYPES[m.k], v = m.done ? m.n : Math.min(m.n, T.run ? 0 : m.p);
  const prog = T.run ? '' : `<div class="bar"><i style="width:${Math.min(100, v / m.n * 100)}%"></i></div><div class="mp">${fmt(v)} / ${fmt(m.n)}</div>`;
  return `<div class="mi${m.done ? ' done' : ''}${isNew ? ' new' : ''}"><div class="ck">${m.done ? '✓' : ''}</div><div class="mt">${T.t(m.n)}${m.done ? '' : prog}</div></div>`;
}
function showResult(){
  endPlay(); hide('hud');
  const r = G.result; if(!r) return;
  $('rTitle').textContent = r.best ? 'NEW BEST!' : 'SHIPWRECKED';
  $('rTitle').className = r.best ? 'best' : '';
  $('rBest').textContent = r.best ? `Previous best beaten` : `Best ${fmt(save.best)} m`;
  $('rRank').textContent = rankName(save.rank);
  $('rMis').innerHTML = save.missions.map(m => misRow(m, G.newMission.includes(m))).join('');
  $('rRankUp').classList.toggle('hidden', !r.allDone);
  if(r.letters.length){ const i = r.letters[r.letters.length - 1]; $('rLetter').innerHTML = `<b>MESSAGE IN A BOTTLE · ${i + 1} / ${LETTERS.length}</b>${LETTERS[i]}`; show('rLetter'); } else hide('rLetter');
  show('result');
  // count up the distance
  const el = $('rDist'), t0 = performance.now(), D = r.dist;
  const tick = () => { const k = Math.min(1, (performance.now() - t0) / 900); el.textContent = fmt(Math.round(D * (1 - Math.pow(1 - k, 3)))) + ' m'; if(k < 1){ AU.count(); requestAnimationFrame(tick); } else if(r.best) AU.best(); };
  tick();
  $('rCoins').textContent = '+' + fmt(r.coins) + ' coins';
}
function claimRank(){
  const was = rankName(save.rank), reward = rankUp();
  AU.rank();
  const unlocked = SHIPS.filter(s => s.rank === save.rank);
  showToast('RANK UP! ' + rankName(save.rank), `+${fmt(reward)} coins` + (unlocked.length ? ` · ${unlocked.map(s => s.name).join(', ')} unlocked in the Shipyard!` : ''), true);
  hide('rRankUp');
  $('rRank').textContent = rankName(save.rank);
  $('rMis').innerHTML = save.missions.map(m => misRow(m, true)).join('');
}

/* ---------------- shipyard ---------------- */
function drawShipPreview(c, sh){
  const g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5ec8f2'); gr.addColorStop(1, '#bdeefc'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1fa8c9'; g.fillRect(0, h * .66, w, h);
  const keep = cx; cx = g; g.save(); g.translate(w / 2, h * .66); g.scale(h / 70, h / 70); drawShip(sh, 0); g.restore(); cx = keep;
  g.fillStyle = 'rgba(31,168,201,.55)'; g.fillRect(0, h * .66, w, h);
}
let shopTab = 'ships';
function openShop(){
  SCREENS.forEach(hide); show('shop'); $('sCoins').textContent = fmt(save.coins);
  document.querySelectorAll('#shop .tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === shopTab));
  $('shipList').classList.toggle('hidden', shopTab !== 'ships'); $('upList').classList.toggle('hidden', shopTab !== 'ups');
  const L = $('shipList'); L.innerHTML = '';
  for(const sh of SHIPS){
    const own = save.owned[sh.id], sel = save.ship === sh.id, locked = save.rank < sh.rank;
    const d = document.createElement('div'); d.className = 'ship' + (sel ? ' sel' : '');
    d.innerHTML = `<canvas width="280" height="160"></canvas><b>${sh.name}</b><p>${sh.desc}</p><div class="st">❤ ${sh.hearts}${sh.coin > 1 ? ` · 🪙 x${sh.coin}` : ''}${sh.magnet ? ' · 🧲 +' + sh.magnet : ''}${sh.land > 1 ? ' · soft landings' : ''}</div>`;
    const btn = document.createElement('button'); btn.className = 'btn' + (own ? '' : ' primary');
    if(sel){ btn.textContent = 'SAILING'; btn.disabled = true; }
    else if(own) btn.textContent = 'SELECT';
    else if(locked){ btn.textContent = '🔒 ' + rankName(sh.rank); btn.disabled = true; }
    else { btn.textContent = '🪙 ' + fmt(sh.cost); btn.disabled = save.coins < sh.cost; }
    onTap(btn, () => { if(own){ save.ship = sh.id; } else if(save.coins >= sh.cost){ save.coins -= sh.cost; save.owned[sh.id] = 1; save.ship = sh.id; AU.buy(); showToast('NEW SHIP', sh.name + ' is ready to sail!', true); } else { AU.deny(); return; } G.ship = sh; persist(); openShop(); });
    d.appendChild(btn); L.appendChild(d); drawShipPreview(d.querySelector('canvas'), sh);
  }
  const U = $('upList'); U.innerHTML = '';
  for(const u of UPG){
    const l = save.up[u.id], max = l >= u.max, cost = upCost(u, l);
    const d = document.createElement('div'); d.className = 'up';
    d.innerHTML = `<div class="ic">${u.icon}</div><div class="ut"><b>${u.name}</b><span>${u.eff(l)}</span>${max ? '' : `<span class="nx">Next: ${u.eff(l + 1)}</span>`}<div class="pips">${Array.from({ length:u.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div></div>`;
    const btn = document.createElement('button'); btn.className = 'btn primary'; btn.textContent = max ? 'MAX' : '🪙 ' + fmt(cost); btn.disabled = max || save.coins < cost;
    onTap(btn, () => { if(save.coins < cost || max){ AU.deny(); return; } save.coins -= cost; save.up[u.id]++; AU.buy(); persist(); openShop(); });
    d.appendChild(btn); U.appendChild(d);
  }
}
function openMissions(){
  SCREENS.forEach(hide); show('missions');
  $('mRank').textContent = rankName(save.rank) + (save.rank < 30 ? `  ·  reward +${fmt(rankReward(save.rank))} coins` : '');
  $('mList').innerHTML = save.missions.map(m => misRow(m)).join('');
  $('mClaim').classList.toggle('hidden', !save.missions.every(m => m.done));
}
function openLog(){
  SCREENS.forEach(hide); show('log');
  const S = save.stats;
  $('logStats').innerHTML = [['Best voyage', fmt(save.best) + ' m'], ['Rank', rankName(save.rank)], ['Voyages', fmt(S.runs)], ['Sailed', fmt(S.dist) + ' m'], ['Flips', fmt(S.flips)], ['Perfect splashes', fmt(S.perfects)], ['Mines jumped', fmt(S.mines)], ['Krakens escaped', fmt(S.kraken)]].map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join('');
  $('logN').textContent = save.letters.length + ' / ' + LETTERS.length;
  $('logList').innerHTML = LETTERS.map((t, i) => save.letters.includes(i) ? `<div class="letter">${t}</div>` : `<div class="letter locked">Letter ${i + 1}: still somewhere out at sea...</div>`).join('');
}
function openSettings(){
  const back = G.state === 'pause' ? 'pause' : null; SCREENS.forEach(hide); show('settings'); $('settings').dataset.back = back || '';
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.checked = !!save.opt[i.dataset.opt]);
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === save.opt[s.dataset.opt])));
}
function closeScreens(){
  const wasSettings = !$('settings').classList.contains('hidden') && $('settings').dataset.back === 'pause';
  const fromResult = G.state === 'over';
  SCREENS.forEach(hide);
  if(wasSettings){ show('pause'); return; }
  if(fromResult){ show('result'); if(G.result && G.result.allDone && save.missions.some(m => !m.done)) hide('rRankUp'); return; }
}

/* ---------------- input: your hand is the tide ---------------- */
const PTR = { down:false, id:-1, lastY:0 };
function setTarget(py){ G.target = clamp(toWorldY(py), WORLD.SURF_MIN, WORLD.SURF_MAX); }
const keys = {};
function wire(){
  const cvs = $('cv');
  const start = e => {
    AU.init(); AU.resume();
    PTR.down = true; PTR.id = e.pointerId; setTarget(e.clientY);
    if(G.state === 'title'){ sail(); }
  };
  cvs.addEventListener('pointerdown', start);
  $('title').addEventListener('pointerdown', e => { if(e.target.closest('button')) return; start(e); });
  addEventListener('pointermove', e => { if(e.pointerType === 'mouse' ? G.state === 'run' || PTR.down : PTR.down && e.pointerId === PTR.id) setTarget(e.clientY); });
  addEventListener('pointerup', e => { if(e.pointerId === PTR.id) PTR.down = false; });
  addEventListener('pointercancel', () => PTR.down = false);
  addEventListener('keydown', e => {
    AU.init(); AU.resume();
    keys[e.key] = true;
    if(['ArrowUp', 'ArrowDown', ' ', 'w', 's', 'W', 'S'].includes(e.key)){ e.preventDefault(); if(G.state === 'title') sail(); }
    if(e.key === 'Escape' || e.key === 'p' || e.key === 'P'){ if(G.state === 'run') pauseGame(); else if(G.state === 'pause') resumeGame(); }
    if(e.key === 'Enter' && G.state === 'over' && !$('result').classList.contains('hidden')) sail();
  });
  addEventListener('keyup', e => { keys[e.key] = false; });
  onTap('pauseBtn', pauseGame); onTap('pResume', resumeGame); onTap('pSet', openSettings); onTap('pHome', () => { G.state = 'run'; G.hearts = 0; G.state = 'dying'; G.dieT = 1.5; SCREENS.forEach(hide); });
  onTap('tShop', openShop); onTap('tMis', openMissions); onTap('tLog', openLog); onTap('tSet', openSettings);
  onTap('rAgain', sail); onTap('rShop', openShop); onTap('rHome', toTitle); onTap('rRankUp', claimRank); onTap('mClaim', () => { claimRank(); openMissions(); });
  document.querySelectorAll('.closeBtn').forEach(b => onTap(b, closeScreens));
  document.querySelectorAll('#shop .tabs button').forEach(b => onTap(b, () => { shopTab = b.dataset.tab; openShop(); }));
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.addEventListener('change', () => { save.opt[i.dataset.opt] = i.checked; AU.apply(); persist(); }));
  document.querySelectorAll('#settings .seg button').forEach(b => onTap(b, () => { save.opt[b.parentElement.dataset.opt] = b.dataset.v; resize(); persist(); openSettings(); }));
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ writeSave(); pauseGame(); } else AU.resume(); });
  SDK.onMute = m => AU.setPortalMute(m);
}

/* ---------------- loop ---------------- */
let last = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > .05) dt = .05;
  try{
    // keyboard moves the tide too
    const up = keys.ArrowUp || keys.w || keys.W || keys[' '], dn = keys.ArrowDown || keys.s || keys.S;
    if(up) G.target = Math.max(WORLD.SURF_MIN, G.target - 1500 * dt);
    if(dn) G.target = Math.min(WORLD.SURF_MAX, G.target + 1100 * dt);
    if(G.state === 'title'){ G.target = 420 + Math.sin(G.rt * 1.2) * 30; }
    if(G.state !== 'pause') update(dt); else G.rt += dt;
    AU.tide(G.surfV, G.surf);
    render(); updateHUD();
  }catch(err){ console.error(err); }
}
addEventListener('error', e => { try{ console.error(e.error || e.message); }catch(_){} });

/* ---------------- boot ---------------- */
(async () => {
  resize();
  await SDK.init();
  SDK.loadingStart();
  loadSave();
  if(!save.owned[save.ship]) save.ship = 'dinghy';
  wire();
  toTitle();
  requestAnimationFrame(frame);
  SDK.loadingStop();
  const b = $('boot'); b.style.opacity = '0'; setTimeout(() => b.remove(), 450);
})();
