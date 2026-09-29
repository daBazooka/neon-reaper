'use strict';
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
const SCREENS = ['menu', 'levels', 'atoms', 'settings', 'newAtom'];
function onTap(id, fn){ const el = typeof id === 'string' ? $(id) : id; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }
let tipHtml = null;
function tip(html){ if(html === tipHtml) return; tipHtml = html; const t = $('tip'); if(!html){ t.classList.add('hidden'); return; } t.innerHTML = html; t.classList.remove('hidden'); }

/* ---------------- HUD ---------------- */
const hudC = {};
function setH(k, v, fn){ if(hudC[k] === v) return; hudC[k] = v; fn(v); }
function updateHUD(){
  if(!G.spec && G.mode !== 'endless') return;
  const endless = G.mode === 'endless', sp = G.spec;
  setH('lv', G.mode + (sp ? sp.lv : 0), () => { $('lvTxt').textContent = endless ? 'OVERLOAD' : G.mode === 'daily' ? 'DAILY REACTOR' : (sp.boss ? 'BOSS ' : 'LEVEL ') + sp.lv; $('wTxt').textContent = endless ? 'Survive the flood' : WORLDS[sp.world].name; });
  setH('energy', fmt(save.energy + (G.state !== 'result' ? 0 : 0)), v => $('energy').textContent = v);
  if(endless){
    setH('goal', 'S' + G.score, () => $('goalTxt').textContent = 'SCORE ' + fmt(G.score));
    $('goalBar').classList.add('hidden'); $('meterBar').classList.remove('hidden');
    $('meterBar').firstElementChild.style.width = (G.meter * 100) + '%';
  } else {
    $('goalBar').classList.remove('hidden'); $('meterBar').classList.add('hidden');
    const tot = G.total || 1, boss = !!G.core;
    setH('goal', G.popped + '/' + G.goal + (boss ? 'b' + G.core.hp : ''), () => {
      $('goalTxt').textContent = boss ? (G.core.dead ? 'CORE DESTROYED' : 'BREAK THE CORE · ' + G.popped) : G.popped + ' / ' + G.goal + (G.popped >= G.goal ? ' ✓' : '');
      $('goalBar').firstElementChild.style.width = Math.min(100, G.popped / tot * 100) + '%';
      const g1 = boss ? 0 : G.goal / tot, g2 = boss ? .6 : (G.goal + (tot - G.goal) * .5) / tot;
      const st = starsFor();
      document.querySelectorAll('#goalBar .st').forEach((e, i) => { e.style.left = ([g1, g2, 1][i] * 100) + '%'; e.classList.toggle('on', st > i); e.style.display = boss && i === 0 ? 'none' : ''; });
    });
  }
  setH('taps', G.tapsLeft + '/' + G.taps + (endless ? Math.round(G.charge * 10) : ''), () => { let h = ''; for(let i = 0; i < G.taps; i++) h += `<i class="${i < G.tapsLeft ? 'on' : ''}"></i>`; $('tapDots').innerHTML = h; });
}

/* ---------------- flow ---------------- */
let firstTap = true, playing = false;
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }
function goLevel(lv, mode){
  hide('result'); SCREENS.forEach(hide);
  for(const k in hudC) delete hudC[k];
  if(mode === 'endless') startEndless(); else startLevel(lv, mode);
  AU.setWorld(G.spec.world); AU.resetSong(); bgCache = null;
  if(G.newAtom) introAtom(G.newAtom);
  else if(!firstTap) beginPlay();
  tutorialTip();
}
function tutorialTip(){
  if(G.mode === 'level' && G.spec.lv === 1 && save.tut < 1) tip(null);
  else if(G.mode === 'level' && G.spec.lv === 2 && save.tut < 2){ tip('Pop the <b>goal number</b> of atoms to clear a level. Pop them <b>all</b> for three stars!'); save.tut = 2; }
  else if(G.mode === 'level' && G.mercy) tip('Reactor unstable! Goal lowered to <b>' + G.goal + '</b>. You\'ve got this.');
  else if(G.mode === 'endless') tip('Atoms keep flooding in. Taps <b>recharge</b>. Don\'t let the chamber <b>overload</b>!');
  else tip(null);
}
function introAtom(type){
  G.state = 'intro'; endPlay();
  const c = $('naCv'), g = c.getContext('2d'); g.clearRect(0, 0, 160, 160);
  const d = ATOMS[type]; g.save(); g.translate(80, 80);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 70); gr.addColorStop(0, rgba(d.col, .8)); gr.addColorStop(1, rgba(d.col, 0)); g.fillStyle = gr; g.fillRect(-80, -80, 160, 160);
  g.fillStyle = type === 'void' ? '#05010a' : d.col; g.beginPath(); g.arc(0, 0, 34, 0, TAU); g.fill();
  if(type === 'void'){ g.strokeStyle = d.col; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 34, 0, TAU * .75); g.stroke(); }
  else { g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(-10, -10, 12, 0, TAU); g.fill(); }
  if(SYM[type]){ g.fillStyle = type === 'void' ? d.col : 'rgba(10,6,20,.85)'; g.font = '900 40px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(SYM[type], 0, 2); }
  g.restore();
  $('naName').textContent = d.name; $('naName').style.color = d.col; $('naDesc').textContent = d.desc;
  show('newAtom'); AU.win();
}

/* ---------------- results ---------------- */
function showResult(){
  const r = G.result; if(!r) return;
  G.state = 'result'; endPlay(); tip(null);
  const el = $('result');
  if(r.endless){
    $('rTitle').textContent = r.best ? 'NEW RECORD!' : 'OVERLOAD!'; $('rTitle').className = r.best ? 'gold' : 'bad';
    $('rStars').style.display = 'none';
    $('rStat').innerHTML = `Score <b>${fmt(r.score)}</b> · Best <b>${fmt(save.best.endless)}</b>`;
    $('rNext').textContent = '↻ AGAIN'; $('rRetry').style.display = 'none';
  } else {
    $('rStars').style.display = '';
    $('rTitle').textContent = r.melt ? 'TOTAL MELTDOWN!' : r.boss && r.win ? 'CORE DESTROYED!' : r.win ? (G.mode === 'daily' ? 'DAILY COMPLETE!' : 'LEVEL COMPLETE') : 'SO CLOSE!';
    $('rTitle').className = r.melt ? 'melt' : r.win ? 'good' : 'bad';
    [...$('rStars').children].forEach((s, i) => { s.className = ''; if(i < r.st) setTimeout(() => { s.className = 'on'; AU.star(i); }, 250 + i * 260); });
    $('rStat').innerHTML = r.boss ? `Popped <b>${r.popped}</b> of ${r.total}` : `Popped <b>${r.popped}</b> of ${r.total} · Goal ${r.goal}`;
    const canNext = r.win && G.mode === 'level';
    $('rNext').textContent = canNext ? 'NEXT ▶' : G.mode === 'daily' ? 'CONTINUE ▶' : '↻ TRY AGAIN';
    $('rRetry').style.display = canNext ? '' : 'none';
    if(r.melt) AU.melt(); else if(r.win) AU.win(); else AU.lose();
  }
  // count the energy up
  const target = r.energy, t0 = performance.now(), dur = 700;
  (function tick(){ const k = Math.min(1, (performance.now() - t0) / dur); $('rEnergy').textContent = '+' + fmt(target * (1 - Math.pow(1 - k, 3))) + ' ⚡'; if(k < 1){ AU.count(); requestAnimationFrame(tick); } })();
  buildUpgrades();
  el.classList.remove('hidden'); el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
  for(const k in hudC) delete hudC[k];
}
function nextFromResult(){
  const r = G.result; AU.init();
  if(r && r.endless) return goLevel(0, 'endless');
  if(G.mode === 'daily') return goLevel(save.level, 'level');
  if(r && r.win && G.mode === 'level') goLevel(save.level, 'level'); else goLevel(G.spec.lv, 'level');
}
function buildUpgrades(){
  const row = $('upRow'); row.innerHTML = '';
  for(const u of UPG){
    const l = save.up[u.id], max = l >= u.max, cost = upCost(u, l), can = !max && save.energy >= cost;
    const b = document.createElement('button'); b.className = 'up' + (can ? ' can' : '') + (max ? ' max' : '');
    b.innerHTML = `<span class="ui">${u.icon}</span><b>${u.name}</b><small>${u.eff(l)}</small><em>${max ? 'MAX' : '⚡ ' + fmt(cost)}</em>${l ? `<i class="lv">${l}</i>` : ''}`;
    b.addEventListener('click', e => { e.stopPropagation(); AU.init(); if(max || save.energy < cost){ AU.deny(); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return; } save.energy -= cost; save.up[u.id]++; AU.buy(); persist(); buildUpgrades(); for(const k in hudC) delete hudC[k]; });
    row.appendChild(b);
  }
}

/* ---------------- menus ---------------- */
function openMenu(){
  if(G.state === 'aim' || G.state === 'run'){ G.prevState = G.state; G.state = 'pause'; }
  endPlay();
  $('eLock').textContent = save.maxLevel >= 8 ? (save.best.endless ? 'BEST ' + fmt(save.best.endless) : '') : '· LEVEL 8';
  $('mEndless').disabled = save.maxLevel < 8;
  const today = save.daily.key === todayKey() && save.daily.done;
  $('dLock').textContent = save.maxLevel < 5 ? '· LEVEL 5' : today ? '✓ DONE TODAY' : '· ENERGY x3';
  $('mDaily').disabled = save.maxLevel < 5 || today;
  $('mStats').innerHTML = `Level <b>${save.level}</b> · Best chain <b>${save.best.chain}</b> · Atoms popped <b>${fmt(save.stats.pops)}</b> · Meltdowns <b>${save.stats.melts}</b>`;
  show('menu');
}
function closeMenus(){
  SCREENS.forEach(hide);
  if(G.state === 'pause'){ G.state = G.prevState || 'aim'; if(!firstTap) beginPlay(); }
}
function openLevels(){
  SCREENS.forEach(hide); const g = $('lvGrid'); g.innerHTML = '';
  for(let lv = 1; lv <= save.maxLevel; lv++){
    const st = save.stars[lv] || 0, b = document.createElement('button'), boss = lv % 10 === 0;
    b.className = 'lvB' + (boss ? ' boss' : '') + (lv === save.level ? ' cur' : '');
    b.style.setProperty('--c', WORLDS[((lv - 1) / 10 | 0) % WORLDS.length].accent);
    b.innerHTML = `<b>${boss ? '☢' : lv}</b><span>${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></span>`;
    onTap(b, () => { firstTap = false; hideLogo(); goLevel(lv, 'level'); });
    g.appendChild(b);
  }
  show('levels');
}
function openAtoms(){
  SCREENS.forEach(hide); const L = $('atomList'); L.innerHTML = '';
  for(const id of ATOM_IDS){ const d = ATOMS[id], seen = save.seen[id]; L.insertAdjacentHTML('beforeend', `<div class="item${seen ? '' : ' locked'}"><div class="ii" style="background:${seen ? d.col : '#222'};color:#0a0614">${seen ? (SYM[id] || '') : '?'}</div><div class="it"><b style="color:${seen ? d.col : '#888'}">${seen ? d.name : '???'}</b><span>${seen ? d.desc : 'Appears from level ' + d.from}</span></div></div>`); }
  show('atoms');
}
function syncSettings(){
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.checked = !!save.opt[i.dataset.opt]);
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === save.opt[s.dataset.opt])));
}
function hideLogo(){ $('logoOv').classList.add('gone'); }

/* ---------------- input: press to aim, release to fire ---------------- */
const PTR = { x:0, y:0, in:false, down:false, id:-1 };
function inArena(px, py){ const [x, y] = toWorld(px, py); return x >= 0 && y >= 0 && x <= G.W && y <= G.H; }
function wire(){
  onTap('menuBtn', openMenu);
  onTap('mPlay', closeMenus);
  onTap('mLevels', openLevels);
  onTap('mAtoms', openAtoms);
  onTap('mSet', () => { hide('menu'); syncSettings(); show('settings'); });
  onTap('mEndless', () => { firstTap = false; hideLogo(); goLevel(0, 'endless'); });
  onTap('mDaily', () => { firstTap = false; hideLogo(); save.daily = { key:todayKey(), done:false }; goLevel(save.maxLevel + 2, 'daily'); });
  document.querySelectorAll('.closeBtn').forEach(b => onTap(b, () => { const inSub = ['levels', 'atoms', 'settings'].some(id => !$(id).classList.contains('hidden')); SCREENS.forEach(hide); if(inSub && G.state === 'pause') openMenu(); else closeMenus(); }));
  onTap('naOk', () => { hide('newAtom'); G.state = 'aim'; if(!firstTap) beginPlay(); });
  onTap('rNext', nextFromResult);
  onTap('rRetry', () => goLevel(G.spec.lv, 'level'));
  onTap('rMenu', () => { hide('result'); goLevel(save.level, 'level'); openMenu(); });
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.addEventListener('change', () => { save.opt[i.dataset.opt] = i.checked; AU.apply(); persist(); }));
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => onTap(b, () => { save.opt[s.dataset.opt] = b.dataset.v; persist(); syncSettings(); resize(); })));

  cv.addEventListener('pointermove', e => { PTR.x = e.clientX; PTR.y = e.clientY; if(e.pointerType === 'mouse') PTR.in = inArena(PTR.x, PTR.y); else if(PTR.down) PTR.in = inArena(PTR.x, PTR.y); });
  cv.addEventListener('pointerleave', e => { if(e.pointerType === 'mouse') PTR.in = false; });
  cv.addEventListener('pointerdown', e => {
    AU.init(); AU.resume(); e.preventDefault();
    PTR.x = e.clientX; PTR.y = e.clientY; PTR.down = true; PTR.id = e.pointerId; PTR.in = inArena(PTR.x, PTR.y);
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
  });
  const release = e => {
    if(!PTR.down || e.pointerId !== PTR.id) return;
    PTR.down = false; PTR.x = e.clientX; PTR.y = e.clientY;
    if(e.pointerType !== 'mouse') setTimeout(() => { if(!PTR.down) PTR.in = false; }, 60);
    if(!inArena(PTR.x, PTR.y)) return;
    if(G.state === 'aim' || (G.mode === 'endless' && G.state === 'run')){
      const [x, y] = toWorld(PTR.x, PTR.y);
      if(tap(x, y)){ if(firstTap){ firstTap = false; hideLogo(); } beginPlay(); if(save.tut < 1){ save.tut = 1; persist(); } }
      else if(G.mode === 'endless') AU.deny();
    }
  };
  addEventListener('pointerup', release); addEventListener('pointercancel', e => { PTR.down = false; });
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('keydown', e => {
    AU.init(); AU.resume();
    if(e.key === 'Escape'){ if(!$('menu').classList.contains('hidden')) closeMenus(); else if(G.state === 'aim' || G.state === 'run') openMenu(); }
    else if((e.key === 'Enter' || e.key === ' ') && G.state === 'result'){ e.preventDefault(); nextFromResult(); }
    else if(e.key === ' ' && G.state === 'intro'){ e.preventDefault(); $('naOk').click(); }
  });
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ writeSave(); if(G.state === 'aim' || G.state === 'run') openMenu(); } else AU.resume(); });
  addEventListener('pagehide', () => writeSave());
}

/* ---------------- loop ---------------- */
let last = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > .05) dt = .05;
  try{
    if(G.state === 'aim' || G.state === 'run' || G.state === 'done' || G.state === 'result') update(dt);
    else G.rt += dt;
    render();
    updateHUD();
  }catch(err){ console.error(err); }
}
addEventListener('error', e => { try{ console.error(e.error || e.message); }catch(_){} });
addEventListener('unhandledrejection', e => { try{ e.preventDefault(); console.error(e.reason); }catch(_){} });

/* ---------------- boot ---------------- */
(async function boot(){
  resize();
  requestAnimationFrame(frame);
  SDK.onMute = m => AU.setPortalMute(m);
  await SDK.init();              // must resolve before the save is read (SDK Data Module)
  SDK.loadingStart();
  loadSave();
  resize();
  wire();
  goLevel(save.level, 'level');
  if(save.level > 1){ $('logoOv').querySelector('.tapHint').innerHTML = `LEVEL ${save.level} · TAP TO <b>REACT</b>`; }
  SDK.loadingStop();
  $('boot').classList.add('gone'); setTimeout(() => { if($('boot')) $('boot').remove(); }, 450);
})();
