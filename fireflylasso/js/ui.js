'use strict';
/* =====================================================================
   FIREFLY LASSO UI: HUD, flow, screens, input, boot.
   ===================================================================== */
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
const SCREENS = ['menu', 'nights', 'codex', 'shop', 'settings'];
function onTap(el, fn){ el = typeof el === 'string' ? $(el) : el; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }
function showToast(head, txt){ const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<b>${head}</b><span>${txt}</span>`; $('toasts').appendChild(t); setTimeout(() => t.remove(), 3500); }
let tipT = 0;
function tip(html, ms){ const t = $('tip'); clearTimeout(tipT); if(!html){ hide('tip'); return; } t.innerHTML = html; show('tip'); if(ms) tipT = setTimeout(() => hide('tip'), ms); }

/* ---------------- HUD ---------------- */
const hc = {};
function setH(k, v, fn){ if(hc[k] === v) return; hc[k] = v; fn(v); }
function updateHUD(){
  if(G.state !== 'play' && G.state !== 'done') return;
  const hunt = G.mode === 'hunt', sp = G.spec;
  setH('n', G.mode + sp.n, () => { $('nTxt').textContent = hunt ? 'MIDNIGHT HUNT' : (sp.boss ? '👑 NIGHT ' : 'NIGHT ') + sp.n; $('pTxt').textContent = hunt ? 'Keep your lantern lit' : PLACES[sp.place].name; $('bar').classList.toggle('hidden', hunt); $('lanternBar').classList.toggle('hidden', !hunt); $('goalTxt').textContent = hunt ? 'light' : '/ ' + fmt(sp.goal); });
  setH('l', Math.round(G.shown), v => { $('lightTxt').textContent = fmt(v); });
  if(!hunt){
    const g = sp.goal, max = g * 3, p = Math.min(1, G.shown / max);
    setH('b', Math.round(p * 400), () => { $('bar').firstElementChild.style.width = p * 100 + '%'; const st = starsFor(G.shown, g); document.querySelectorAll('#bar .st').forEach((e, i) => { e.style.left = ([1 / 3, .6, 1][i] * 100) + '%'; e.classList.toggle('on', st > i); }); });
    setH('j', Math.round(Math.min(1, G.shown / g) * 50), v => { $('jar').firstElementChild.style.height = v * 2 + '%'; });
    setH('t', Math.ceil(G.timeLeft), v => { const e = $('timeTxt'); e.textContent = v; e.classList.toggle('low', v <= 5); });
  } else {
    setH('lt', Math.round(G.lantern * 200), () => { $('lanternBar').firstElementChild.style.width = G.lantern * 100 + '%'; });
    setH('t', Math.floor(G.t), v => { $('timeTxt').textContent = v + 's'; $('timeTxt').classList.remove('low'); });
    setH('j', Math.round(G.lantern * 50), v => { $('jar').firstElementChild.style.height = v * 2 + '%'; });
  }
  setH('c', G.streak > 1 ? G.streak : 0, v => { const c = $('chain'); if(!v) c.classList.add('hidden'); else { c.classList.remove('hidden'); c.querySelector('b').textContent = 'x' + Math.min(3, 1 + (v - 1) * .25).toFixed(2).replace(/\.?0+$/, ''); c.style.animation = 'none'; void c.offsetWidth; c.style.animation = ''; } });
  setH('bo', save.up.bottle > 0 && !G.bottleUsed && G.state === 'play', v => $('bottleBtn').classList.toggle('hidden', !v));
  setH('cf', G.caughtFx.length ? G.catches : -1, v => { if(v >= 0){ const j = $('jar'); j.classList.remove('bump'); void j.offsetWidth; j.classList.add('bump'); } });
}

/* ---------------- flow ---------------- */
let playing = false, firstTouch = true;
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }
function titleScene(){
  // the title floats over a live meadow; the first stroke starts the night
  resetRound(); G.mode = 'night'; G.spec = nightSpec(save.night); G.state = 'title';
  for(let i = 0; i < 26; i++) spawnFly();
  bgCache = null; AU.setPlace(G.spec.place);
  $('tInfo').textContent = save.maxNight > 1 ? `Night ${save.night}  ·  ${Object.keys(save.codex).length} / ${SP_IDS.length} fireflies found` : '';
}
function goNight(n){
  hide('result'); SCREENS.forEach(hide); for(const k in hc) delete hc[k];
  startNight(n); bgCache = null; AU.setPlace(G.spec.place);
  show('hud'); beginPlay();
  const t = save.tut;
  if(n === 1 && t < 1) tip('Draw a <b>circle</b> around the fireflies to catch them!');
  else if(n === 2 && t < 2){ tip(TIPS[0], 5000); save.tut = 2; }
  else if(n === 3 && t < 3){ tip(TIPS[1], 5000); save.tut = 3; }
  else if(n === 4 && t < 4){ tip(TIPS[3], 5500); save.tut = 4; }
  else if(G.spec.boss) tip('👑 <b>The Firefly Queen</b> visits tonight. Loop her before she flies away!', 5000);
  else if(G.spec.place === 1 && n === 11) tip('<b>Bats</b> swoop through the woods. Watch for the <b>!</b> warning.', 5000);
  else if(G.spec.place === 2 && n === 21) tip('<b>Spider webs</b> tangle your lasso. Draw around them.', 5000);
  else if(G.spec.place === 3 && n === 31) tip('Wind blows through the <b>Starfall Peaks</b>. Fireflies drift with it.', 5000);
  else tip(null);
}
function goHunt(){ hide('result'); SCREENS.forEach(hide); for(const k in hc) delete hc[k]; startHunt(); bgCache = null; AU.setPlace(0); show('hud'); beginPlay(); tip('Your lantern fades. <b>Catch light to keep it burning!</b>', 4000); }

/* ---------------- result ---------------- */
function showResult(){
  endPlay(); tip(null);
  const r = G.result; if(!r) return;
  show('result'); G.state = 'result';
  const stars = $('rStars').children;
  if(r.mode === 'hunt'){
    $('rTitle').textContent = r.best ? 'NEW BEST HUNT!' : 'THE LANTERN WENT OUT'; $('rTitle').className = r.best ? '' : 'fail';
    for(const s of stars) s.style.display = 'none';
    countUp($('rLight'), r.score, ' light');
    $('rStat').innerHTML = `Lasted <b>${r.t}s</b> · Best loop <b>${r.bestLoop}</b> · +<b>${fmt(r.glow)}</b> glow`;
    $('rNext').textContent = 'HUNT AGAIN ▶'; $('rRetry').classList.add('hidden');
  } else {
    $('rTitle').textContent = r.win ? (r.st === 3 ? 'PERFECT NIGHT!' : 'NIGHT COMPLETE') : 'NOT ENOUGH LIGHT'; $('rTitle').className = r.win ? '' : 'fail';
    [...stars].forEach((s, i) => { s.style.display = ''; s.classList.toggle('on', i < r.st); s.style.animationDelay = (.3 + i * .25) + 's'; if(i < r.st) setTimeout(() => AU.star(i), 300 + i * 250); });
    countUp($('rLight'), r.light, ' light');
    $('rStat').innerHTML = `Goal <b>${fmt(r.goal)}</b> · Caught <b>${r.caught}</b> in <b>${r.loops}</b> loops · Best loop <b>${r.bestLoop}</b>${r.queen ? ' · 👑 <b>Queen caught!</b>' : ''}<br>Your glow: <b>${fmt(save.glow)}</b>`;
    $('rNext').textContent = r.win ? 'NEXT NIGHT ▶' : 'TRY AGAIN ▶'; $('rRetry').classList.toggle('hidden', !r.win);
  }
  if(r.newSpecies.length){ $('rNew').innerHTML = '📖 New in your Codex: <b>' + r.newSpecies.map(k => SPECIES[k].name).join(', ') + '</b>'; show('rNew'); } else hide('rNew');
  buildUpRow();
}
function countUp(el, v, suffix){ const t0 = performance.now(); const f = () => { const k = Math.min(1, (performance.now() - t0) / 900); el.textContent = '+' + fmt(Math.round(v * (1 - Math.pow(1 - k, 3)))) + suffix; if(k < 1){ AU.count(); requestAnimationFrame(f); } }; f(); }
function buildUpRow(){
  const row = $('upRow'); row.innerHTML = '';
  for(const u of UPG){
    const l = save.up[u.id], max = l >= u.max, c = upCost(u, l), can = !max && save.glow >= c;
    const d = document.createElement('div'); d.className = 'up' + (can ? ' can' : '') + (max ? ' max' : '');
    d.innerHTML = `<div class="ic">${u.icon}</div><b>${u.name}</b><span>${u.eff(l)}</span><div class="c">${max ? 'MAX' : '✦ ' + fmt(c)}</div>`;
    d.addEventListener('click', e => { e.stopPropagation(); AU.init(); if(!can){ AU.deny(); return; } save.glow -= c; save.up[u.id]++; AU.buy(); persist(); buildUpRow(); if($('rStat')) $('rStat').innerHTML = $('rStat').innerHTML.replace(/Your glow: <b>[^<]*<\/b>/, `Your glow: <b>${fmt(save.glow)}</b>`); });
    row.appendChild(d);
  }
}
function nextFromResult(){ const r = G.result; if(!r) return; if(r.mode === 'hunt') goHunt(); else goNight(r.win ? save.night : r.n); }

/* ---------------- menus ---------------- */
function openMenu(){
  if(G.state === 'play'){ G.prevState = 'play'; G.state = 'pause'; }
  endPlay(); SCREENS.forEach(hide);
  $('hLock').textContent = save.maxNight >= 5 ? (save.best.hunt ? '· BEST ' + fmt(save.best.hunt) : '') : '· NIGHT 5';
  $('mHunt').disabled = save.maxNight < 5;
  $('mStats').innerHTML = `Night <b>${save.night}</b> · Glow <b>${fmt(save.glow)}</b> · Fireflies caught <b>${fmt(save.stats.caught)}</b> · Biggest loop <b>${save.best.loop}</b>`;
  show('menu');
}
function closeMenus(){
  SCREENS.forEach(hide);
  if(G.state === 'pause'){ G.state = 'play'; beginPlay(); }
  if(G.state === 'result') show('result');
}
function openNights(){
  SCREENS.forEach(hide); const g = $('nGrid'); g.innerHTML = '';
  for(let n = 1; n <= save.maxNight; n++){
    const st = save.stars[n] || 0, boss = n % 10 === 0, b = document.createElement('button');
    b.className = 'nB' + (boss ? ' boss' : '') + (n === save.night ? ' cur' : '');
    b.innerHTML = `<b>${boss ? '👑' : n}</b><span>${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></span>`;
    onTap(b, () => { hideTitle(); goNight(n); });
    g.appendChild(b);
  }
  show('nights');
}
function iconCanvas(k, found){
  const c = document.createElement('canvas'); c.width = c.height = 92; const g = c.getContext('2d'), S = SPECIES[k];
  const gr = g.createRadialGradient(46, 46, 0, 46, 46, 44); gr.addColorStop(0, rgba(found ? S.col : '#445', .9)); gr.addColorStop(.3, rgba(found ? S.col : '#445', .35)); gr.addColorStop(1, rgba('#000000', 0));
  g.fillStyle = gr; g.fillRect(0, 0, 92, 92); g.fillStyle = found ? '#fff' : '#667'; g.beginPath(); g.arc(46, 46, S.boss ? 12 : 7, 0, TAU); g.fill();
  if(!found){ g.fillStyle = '#aab'; g.font = '900 26px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 46, 48); }
  return c;
}
function openCodex(){
  SCREENS.forEach(hide); const L = $('cxList'); L.innerHTML = '';
  let n = 0;
  for(const k of SP_IDS){
    const S = SPECIES[k], cnt = save.codex[k] || 0; if(cnt) n++;
    const d = document.createElement('div'); d.className = 'item' + (cnt ? '' : ' locked');
    const hint = S.secret ? 'Secret: ' + S.secret : S.boss ? 'Appears on every tenth night.' : `First seen around night ${S.from}.`;
    d.appendChild(iconCanvas(k, cnt));
    d.insertAdjacentHTML('beforeend', `<div class="it"><b>${cnt ? S.name : '???'}</b><span>${cnt ? S.desc + ' · worth ' + S.val : hint}</span></div><div class="n">${cnt ? '×' + fmt(cnt) : ''}</div>`);
    L.appendChild(d);
  }
  $('cxN').textContent = n + ' / ' + SP_IDS.length;
  show('codex');
}
function openShop(){
  SCREENS.forEach(hide); const L = $('shopList'); L.innerHTML = ''; $('sGlow').textContent = '✦ ' + fmt(save.glow);
  for(const u of UPG){
    const l = save.up[u.id], max = l >= u.max, c = upCost(u, l);
    const d = document.createElement('div'); d.className = 'item';
    d.innerHTML = `<div style="font-size:26px;width:40px;text-align:center">${u.icon}</div><div class="it"><b>${u.name}</b><span>${u.eff(l)}${max ? '' : ' → ' + u.eff(l + 1)}</span><div class="pips">${Array.from({ length:u.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div></div>`;
    const b = document.createElement('button'); b.className = 'btn primary'; b.textContent = max ? 'MAX' : '✦ ' + fmt(c); b.disabled = max || save.glow < c;
    onTap(b, () => { if(save.glow < c || max){ AU.deny(); return; } save.glow -= c; save.up[u.id]++; AU.buy(); persist(); openShop(); });
    d.appendChild(b); L.appendChild(d);
  }
  show('shop');
}
function openSettings(){
  SCREENS.forEach(hide); show('settings');
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.checked = !!save.opt[i.dataset.opt]);
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === save.opt[s.dataset.opt])));
}
function hideTitle(){ if(!firstTouch) return; firstTouch = false; $('title').classList.add('gone'); setTimeout(() => hide('title'), 500); }

/* ---------------- input ---------------- */
function inArena(px, py){ return py > V.TOP * .6; }
function wire(){
  const c = $('cv');
  const down = e => {
    AU.init(); AU.resume();
    if(!SCREENS.every(id => $(id).classList.contains('hidden'))) return;
    if(G.state === 'result') return;
    PTR.down = true; PTR.id = e.pointerId; PTR.x = e.clientX; PTR.y = e.clientY; [PTR.wx, PTR.wy] = toWorld(PTR.x, PTR.y);
    if(G.state === 'title'){ hideTitle(); goNight(save.night); }
    G.trail = []; G.trailLen = 0; trailAdd(PTR.wx, PTR.wy);
  };
  c.addEventListener('pointerdown', down);
  $('title').addEventListener('pointerdown', down);
  addEventListener('pointermove', e => {
    if(!PTR.down || e.pointerId !== PTR.id) return;
    let evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null; if(!evs || !evs.length) evs = [e];
    for(const ev of evs){ PTR.x = ev.clientX; PTR.y = ev.clientY; [PTR.wx, PTR.wy] = toWorld(PTR.x, PTR.y); trailAdd(PTR.wx, PTR.wy); }
  });
  const up = e => { if(e.pointerId === PTR.id) PTR.down = false; };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  addEventListener('keydown', e => {
    AU.init(); AU.resume();
    if(e.key === 'Escape'){ if(!$('menu').classList.contains('hidden')) closeMenus(); else if(G.state === 'play') openMenu(); }
    else if((e.key === 'Enter' || e.key === ' ') && G.state === 'result'){ e.preventDefault(); nextFromResult(); }
    else if((e.key === 'b' || e.key === 'B') && G.state === 'play') useBottle();
  });
  onTap('menuBtn', openMenu); onTap('bottleBtn', useBottle);
  onTap('mPlay', () => { if(G.state === 'pause' || G.state === 'result') closeMenus(); else { hideTitle(); goNight(save.night); } });
  onTap('mNights', openNights); onTap('mCodex', openCodex); onTap('mShop', openShop); onTap('mSet', openSettings);
  onTap('mHunt', () => { hideTitle(); goHunt(); });
  onTap('rNext', nextFromResult); onTap('rRetry', () => goNight(G.result.n)); onTap('rMenu', () => { hide('result'); openMenu(); });
  document.querySelectorAll('.closeBtn').forEach(b => onTap(b, () => { const inSub = !$('menu').classList.contains('hidden') ? false : ['nights', 'codex', 'shop', 'settings'].some(id => !$(id).classList.contains('hidden')); if(inSub && G.state !== 'title') openMenu(); else closeMenus(); }));
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.addEventListener('change', () => { save.opt[i.dataset.opt] = i.checked; AU.apply(); persist(); }));
  document.querySelectorAll('#settings .seg button').forEach(b => onTap(b, () => { save.opt[b.parentElement.dataset.opt] = b.dataset.v; resize(); persist(); openSettings(); }));
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ writeSave(); if(G.state === 'play') openMenu(); } else AU.resume(); });
  SDK.onMute = m => AU.setPortalMute(m);
}
function useBottle(){ if(save.up.bottle < 1 || G.bottleUsed || G.state !== 'play') return; G.bottleUsed = true; G.slowT = 2 + save.up.bottle; AU.bottle(); pop('TIME SLOWS...', G.W / 2, G.H * .3, '#c8a8ff', 24, 1.6); }

/* ---------------- tutorial ghost ---------------- */
function tutorialTick(){
  G.ghost = null;
  if(G.state !== 'play' || G.mode !== 'night' || G.spec.n !== 1 || save.tut >= 1) return;
  if(G.catches > 0){ save.tut = 1; persist(); tip('Wonderful! <b>Bigger loops</b> catch more, and every extra firefly multiplies the rest.', 4500); return; }
  if(PTR.down) return;
  // the densest little group
  let best = null, bn = 0; for(const f of G.flies){ let n = 0; for(const o of G.flies) if(Math.hypot(o.x - f.x, o.y - f.y) < 70) n++; if(n > bn){ bn = n; best = f; } }
  if(best) G.ghost = { x:best.x, y:best.y, r:75 };
}

/* ---------------- loop ---------------- */
let last = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > .05) dt = .05;
  try{
    if(G.state !== 'pause') update(dt); else G.rt += dt;
    tutorialTick();
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
  wire();
  titleScene();
  resize();
  requestAnimationFrame(frame);
  SDK.loadingStop();
  const b = $('boot'); b.style.opacity = '0'; setTimeout(() => b.remove(), 450);
})();
