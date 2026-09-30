'use strict';
/* =====================================================================
   SNOWBALL EFFECT UI: HUD, flow, screens, input, boot.
   ===================================================================== */
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
const SCREENS = ['globe', 'shop', 'missions', 'pause', 'settings'];
function onTap(el, fn){ el = typeof el === 'string' ? $(el) : el; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }
function showToast(head, txt, gold){ const t = document.createElement('div'); t.className = 'toast' + (gold ? ' gold' : ''); t.innerHTML = `<b>${head}</b><span>${txt}</span>`; $('toasts').appendChild(t); while($('toasts').children.length > 2) $('toasts').firstChild.remove(); setTimeout(() => t.remove(), 3100); }
let hintT = 0;
function showHint(txt){ const h = $('hint'); h.textContent = txt; show('hint'); h.style.animation = 'none'; void h.offsetWidth; h.style.animation = ''; clearTimeout(hintT); hintT = setTimeout(() => hide('hint'), 2900); }
function showBanner(small, big){ const b = $('banner'); b.innerHTML = `<small>${small}</small>${big}`; show('banner'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; setTimeout(() => hide('banner'), 2700); }

/* ---------------- HUD ---------------- */
const hc = {};
function setH(k, v, fn){ if(hc[k] === v) return; hc[k] = v; fn(v); }
function updateHUD(){
  if(G.state !== 'run' && G.state !== 'dying') return;
  setH('s', fmtSize(G.R), v => { const e = $('size'); if(hc.sR && G.R > hc.sR * 1.02){ e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); setTimeout(() => e.classList.remove('bump'), 150); } hc.sR = G.R; e.textContent = v; });
  const t = tierOf(G.R), nx = TIERS[t + 1];
  setH('t', t, () => { $('tierTxt').textContent = TIERS[t].name.toUpperCase(); $('nextTxt').textContent = nx ? (innerWidth < 520 ? '→ ' : 'NEXT: ') + nx.name.toUpperCase() : 'MAX TIER'; });
  // bar spans this tier in log scale; the best mark shows your record inside it
  const lo = Math.max(1, TIERS[t].at || 3), hi = nx ? nx.at : lo * 3, k = clamp(Math.log(G.R / lo) / Math.log(hi / lo), 0, 1);
  setH('tb', Math.round(k * 300), () => { const i = $('tierBar').firstElementChild; i.style.width = k * 100 + '%'; });
  const danger = G.R < G.peak * .55;
  setH('dg', danger, v => $('tierBar').firstElementChild.classList.toggle('danger', v));
  const br = save.best / 2, bk = br > lo && br < hi ? Math.log(br / lo) / Math.log(hi / lo) : -1;
  setH('bm', Math.round(bk * 300), () => { const m = $('bestMark'); if(bk < 0) m.style.display = 'none'; else { m.style.display = 'block'; m.style.left = bk * 100 + '%'; } });
  const av = G.avalT > 0 ? G.avalT / (5 + save.up.aval * .2) : G.meter / avalNeed(save.up.aval);
  setH('av', Math.round(av * 100) + (G.avalT > 0 ? 'a' : ''), () => { $('avalBar').firstElementChild.style.width = Math.min(100, av * 100) + '%'; $('avalBar').classList.toggle('on', G.avalT > 0); });
  setH('c', Math.floor(save.cry), v => $('cry').textContent = fmt(v));
  setH('k', G.combo >= 5 ? G.combo : 0, v => { const s = $('streak'); if(!v) s.classList.add('hidden'); else { s.classList.remove('hidden'); s.querySelector('b').textContent = 'x' + v; s.style.animation = 'none'; void s.offsetWidth; s.style.animation = ''; } });
}

/* ---------------- flow ---------------- */
let playing = false;
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }
function toTitle(){
  SCREENS.forEach(hide); hide('result'); hide('hud'); endPlay();
  resetWorld(startR(save.up.start)); G.state = 'title';
  $('title').classList.remove('hidden', 'gone');
  const found = Object.keys(save.globe).length;
  $('tInfo').innerHTML = save.best ? `BEST ${fmtSize(save.best / 2)} · ${TIERS[save.bestTier].name}<br>${found} / ${THINGS.length} in your Snow Globe · ${rankName(save.rank)}` + (save.missions.every(m => m.done) ? '<br>⭐ RANK UP READY!' : '') : '';
}
function roll(){
  SCREENS.forEach(hide); hide('result');
  $('title').classList.add('gone'); setTimeout(() => $('title').classList.add('hidden'), 400);
  for(const k in hc) delete hc[k];
  startRun(); show('hud'); beginPlay(); V.skyT = G.tier;
  if(save.tut < 1) showHint('ROLL INTO SMALLER THINGS TO GROW!');
}
function pauseGame(){ if(G.state !== 'run') return; G.state = 'pause'; endPlay(); SCREENS.forEach(hide); show('pause'); }
function resumeGame(){ SCREENS.forEach(hide); if(G.state === 'pause'){ G.state = 'run'; beginPlay(); } }

/* ---------------- result ---------------- */
function misRow(m, isNew){
  const T = MTYPES[m.k]; let prog = '';
  if(!m.done && !T.run && m.k !== 'thing'){ const v = Math.min(m.n, m.p); prog = `<div class="bar"><i style="width:${v / m.n * 100}%"></i></div><div class="mp">${fmt(v)} / ${fmt(m.n)}</div>`; }
  return `<div class="mi${m.done ? ' done' : ''}${isNew ? ' new' : ''}"><div class="ck">${m.done ? '✓' : ''}</div><div class="mt">${T.t(m.n)}${prog}</div></div>`;
}
function showResult(){
  endPlay(); hide('hud'); hide('hint');
  const r = G.result; if(!r) return;
  G.state = 'over';
  $('rTitle').textContent = r.best ? 'NEW RECORD!' : 'MELTED!'; $('rTitle').className = r.best ? 'best' : '';
  $('rTier').textContent = TIERS[r.tier].name.toUpperCase();
  $('rBest').textContent = r.best ? (r.prevBest ? 'Beat your record of ' + fmtSize(r.prevBest / 2) : 'Your first record!') : 'Best ' + fmtSize(save.best / 2);
  $('rCry').textContent = '+' + fmt(r.cry) + ' ❄  ·  ' + r.eaten + ' swallowed';
  if(r.newFound.length){ $('rNew').innerHTML = '🔮 New in your Snow Globe: ' + r.newFound.map(id => THING[id].e).join(' '); show('rNew'); } else hide('rNew');
  $('rRank').textContent = rankName(save.rank);
  $('rMis').innerHTML = save.missions.map(m => misRow(m, m.done)).join('');
  $('rRankUp').classList.toggle('hidden', !r.allDone);
  buildUpRow();
  show('result');
  const el = $('rSize'), t0 = performance.now(), D = r.size / 2;
  const tick = () => { const k = Math.min(1, (performance.now() - t0) / 900); el.textContent = fmtSize(D * (1 - Math.pow(1 - k, 3)) + .01); if(k < 1){ AU.count(); requestAnimationFrame(tick); } else if(r.best) AU.best(); };
  tick();
}
function buildUpRow(){
  const row = $('upRow'); row.innerHTML = '';
  const list = UPG.map(u => ({ u, l:save.up[u.id] })).sort((a, b) => (a.l >= a.u.max) - (b.l >= b.u.max) || upCost(a.u, a.l) - upCost(b.u, b.l));
  for(const { u, l } of list){
    const max = l >= u.max, c = upCost(u, l), can = !max && save.cry >= c;
    const d = document.createElement('div'); d.className = 'up' + (can ? ' can' : '') + (max ? ' max' : '');
    d.innerHTML = `<div class="ic">${u.icon}</div><b>${u.name}</b><span>${u.eff(l)}</span><div class="c">${max ? 'MAX' : '❄ ' + fmt(c)}</div>`;
    d.addEventListener('click', e => { e.stopPropagation(); AU.init(); if(!can){ AU.deny(); return; } save.cry -= c; save.up[u.id]++; AU.buy(); persist(); buildUpRow(); });
    row.appendChild(d);
  }
}
function claimRank(){
  const reward = rankUp(); AU.rank();
  showToast('RANK UP! ' + rankName(save.rank), '+' + fmt(reward) + ' ❄ crystals', true);
  hide('rRankUp'); $('rRank').textContent = rankName(save.rank);
  $('rMis').innerHTML = save.missions.map(m => misRow(m, true)).join('');
  buildUpRow();
}

/* ---------------- screens ---------------- */
function iconCanvas(e, dark){ const c = document.createElement('canvas'); c.width = c.height = 88; c.getContext('2d').drawImage(emoSpr(e, dark), 0, 0, 88, 88); return c; }
function openGlobe(){
  SCREENS.forEach(hide); const g = $('gGrid'); g.innerHTML = ''; let n = 0;
  for(const T of THINGS){
    const cnt = save.globe[T.id] || 0; if(cnt) n++;
    const d = document.createElement('div'); d.className = 'gi' + (cnt ? '' : ' no');
    d.appendChild(iconCanvas(T.e, !cnt));
    d.insertAdjacentHTML('beforeend', `<b>${cnt ? T.name : '???'}</b><span>${cnt ? '×' + fmt(cnt) : fmtSize(T.s / 2)}</span>`);
    g.appendChild(d);
  }
  $('gN').textContent = n + ' / ' + THINGS.length;
  show('globe');
}
function openShop(){
  SCREENS.forEach(hide); const L = $('shopList'); L.innerHTML = ''; $('sCry').textContent = '❄ ' + fmt(save.cry);
  for(const u of UPG){
    const l = save.up[u.id], max = l >= u.max, c = upCost(u, l);
    const d = document.createElement('div'); d.className = 'item';
    d.innerHTML = `<div class="ic">${u.icon}</div><div class="it"><b>${u.name}</b><span>${u.eff(l)}${max ? '' : ' → ' + u.eff(l + 1)}</span><div class="pips">${Array.from({ length:u.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div></div>`;
    const b = document.createElement('button'); b.className = 'btn primary'; b.textContent = max ? 'MAX' : '❄ ' + fmt(c); b.disabled = max || save.cry < c;
    onTap(b, () => { if(save.cry < c || max){ AU.deny(); return; } save.cry -= c; save.up[u.id]++; AU.buy(); persist(); openShop(); });
    d.appendChild(b); L.appendChild(d);
  }
  show('shop');
}
function openMissions(){
  SCREENS.forEach(hide); show('missions');
  $('mRank').textContent = rankName(save.rank) + '  ·  reward ❄ ' + fmt(rankReward(save.rank));
  $('mList').innerHTML = save.missions.map(m => misRow(m)).join('');
  $('mClaim').classList.toggle('hidden', !save.missions.every(m => m.done));
}
function openSettings(){
  const back = G.state === 'pause'; SCREENS.forEach(hide); show('settings'); $('settings').dataset.back = back ? 'pause' : '';
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.checked = !!save.opt[i.dataset.opt]);
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === save.opt[s.dataset.opt])));
}
function closeScreens(){
  const toPause = !$('settings').classList.contains('hidden') && $('settings').dataset.back === 'pause';
  SCREENS.forEach(hide);
  if(toPause) show('pause');
  else if(G.state === 'over'){ show('result'); buildUpRow(); }
}

/* ---------------- input: one button ---------------- */
function anyScreen(){ return SCREENS.some(id => !$(id).classList.contains('hidden')) || !$('result').classList.contains('hidden'); }
function wire(){
  const down = e => {
    AU.init(); AU.resume();
    if(e.target.closest && e.target.closest('button')) return;
    if(anyScreen()) return;
    if(G.state === 'title'){ roll(); return; }
    press();
  };
  $('cv').addEventListener('pointerdown', down);
  $('title').addEventListener('pointerdown', down);
  addEventListener('keydown', e => {
    AU.init(); AU.resume();
    if(e.repeat) return;
    if(e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W'){
      e.preventDefault();
      if(G.state === 'title' && !anyScreen()) roll();
      else if(G.state === 'over' && !$('result').classList.contains('hidden')) roll();
      else press();
    }
    if(e.key === 'Enter' && G.state === 'over' && !$('result').classList.contains('hidden')) roll();
    if(e.key === 'Escape' || e.key === 'p' || e.key === 'P'){ if(G.state === 'run') pauseGame(); else if(G.state === 'pause') resumeGame(); }
  });
  onTap('pauseBtn', pauseGame); onTap('pResume', resumeGame); onTap('pSet', openSettings); onTap('pEnd', () => { SCREENS.forEach(hide); G.state = 'run'; endRun(); });
  onTap('tGlobe', openGlobe); onTap('tShop', openShop); onTap('tMis', openMissions); onTap('tSet', openSettings);
  onTap('rAgain', roll); onTap('rHome', toTitle); onTap('rGlobe', () => { hide('result'); openGlobe(); }); onTap('rRankUp', claimRank);
  onTap('mClaim', () => { claimRank(); openMissions(); });
  document.querySelectorAll('.closeBtn').forEach(b => onTap(b, closeScreens));
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
    if(G.state !== 'pause' && G.state !== 'over') update(dt); else G.rt += dt;
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
  for(const T of THINGS){ emoSpr(T.e); emoSpr(T.e, true); }   // draw every emoji once while loading, so the run never stutters
  wire();
  toTitle();
  requestAnimationFrame(frame);
  SDK.loadingStop();
  const b = $('boot'); b.style.opacity = '0'; setTimeout(() => b.remove(), 450);
})();
