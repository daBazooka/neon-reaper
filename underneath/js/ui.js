'use strict';
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
function onTap(id, fn){ const el = typeof id === 'string' ? $(id) : id; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }

/* ---------------- feedback ---------------- */
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
let banT = 0;
function banner(title, sub, col, dur){
  const b = $('banner');
  b.innerHTML = `<b style="color:${col || '#ffd23a'}">${title}</b>${sub ? '<span>' + sub + '</span>' : ''}`;
  b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
  b.style.animationDuration = (dur || 2800) + 'ms';
  clearTimeout(banT); banT = setTimeout(() => b.classList.remove('go'), dur || 2800);
}
function codexNew(){ $('codexDot').classList.remove('hidden'); }
let _dt = [0, 0];
function dustTarget(){ return _dt; }
function measure(){ const r = $('dust').getBoundingClientRect(); _dt = [r.left + r.width / 2, r.top + r.height / 2]; }
function bumpDust(){ const d = $('dust'); d.classList.remove('bump'); void d.offsetWidth; d.classList.add('bump'); }

/* ---------------- HUD ---------------- */
const hudC = {};
function setH(key, val, fn){ if(hudC[key] === val) return; hudC[key] = val; fn(val); }
let upT = 0;
function updateHUD(dt){
  setH('dust', fmt(save.dust), v => $('dust').textContent = v);
  setH('rate', fmt(G.rate), v => $('rate').textContent = '+' + v + '/s');
  setH('depth', C.kind + C.depth, () => { $('depthTxt').textContent = C.kind === 'main' ? 'DEPTH ' + C.depth : C.kind === 'vault' ? 'GLYPH VAULT' : C.kind === 'mini' ? 'MINIATURE' : 'DAILY'; $('bioTxt').textContent = C.kind === 'vault' ? 'A hidden treasure room' : C.kind === 'mini' ? 'A painting inside the painting' : C.kind === 'daily' ? 'Today\'s painting' : C.B.name + (C.depth > 8 ? ' · cycle ' + (1 + ((C.depth - 1) / 8 | 0)) : ''); });
  setH('rest', Math.floor(C.cleared / C.total * 100), v => $('restBar').style.width = v + '%');
  setH('streak', G.mult > 1 ? G.mult : 0, v => { $('streak').classList.toggle('hidden', !v); $('streak').classList.toggle('hot', v >= 3); if(v) $('streakTxt').textContent = 'STREAK x' + v; });
  if(G.mult > 1) $('streakBar').style.width = ((G.streakT % 3) / 3 * 100) + '%';
  setH('secN', Object.keys(save.secrets).length, v => $('secretN').textContent = v + '/' + SECRETS.length);
  setH('daily', save.daily.key !== todayKey() && C.kind === 'main' && G.state === 'play', v => $('dailyBtn').classList.toggle('hidden', !v));
  upT -= dt; if(upT <= 0){ upT = .2; refreshUpgrades(); refreshSkillCds(); if(!$('diveBtn').classList.contains('hidden')) refreshDive(); }
}
function buildUpgrades(){
  const L = $('upList'); L.innerHTML = '';
  for(const u of UPG){
    const b = document.createElement('button'); b.className = 'up'; b.id = 'up_' + u.id;
    b.innerHTML = `<span class="ui">${u.icon}</span><span class="ut"><b>${u.name} <em></em></b><small></small></span><span class="uc"></span>`;
    b.addEventListener('click', e => { e.stopPropagation(); AU.init(); buyUp(u); });
    L.appendChild(b);
  }
  refreshUpgrades(true);
}
function buyUp(u){
  const l = save.up[u.id], cost = upCost(u, l);
  if(l >= u.max || save.dust < cost){ AU.deny(); return; }
  save.dust -= cost; save.up[u.id] = l + 1; AU.buy();
  const el = $('up_' + u.id); el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
  if(u.id === 'blast' && l === 0) G.blastC = blastT(1);
  refreshUpgrades(true); refreshSkills(); persist();
}
function refreshUpgrades(force){
  for(const u of UPG){
    const el = $('up_' + u.id); if(!el) continue;
    const l = save.up[u.id], cost = upCost(u, l), max = l >= u.max, can = !max && save.dust >= cost;
    const key = l + '|' + can + '|' + max;
    if(!force && el.dataset.k === key) continue;
    el.dataset.k = key;
    el.querySelector('em').textContent = l ? 'LV ' + l : '';
    el.querySelector('small').textContent = u.eff(max ? l : Math.max(l, u.id === 'lens' || u.id === 'blast' || u.id === 'moth' ? l + (l ? 0 : 1) : l));
    el.querySelector('.uc').innerHTML = max ? 'MAX' : '✦ ' + fmt(cost);
    el.classList.toggle('can', can); el.classList.toggle('max', max);
  }
}
/* skills unlocked by secrets, plus firecrackers */
const SKILLS = [
  { id:'blast', icon:'💥', has:() => save.up.blast > 0, ready:() => G.blastC >= blastT(save.up.blast), frac:() => G.blastC / blastT(save.up.blast), go:() => { G.blastArmed = !G.blastArmed; toast(G.blastArmed ? 'FIRECRACKER READY' : 'CANCELLED', G.blastArmed ? 'Tap the painting to blast' : '', '#ff8a3a', 1400); } },
  { id:'whirl', icon:'🌀', has:() => save.secrets.whirl, ready:() => G.cd.whirl <= 0, frac:() => 1 - G.cd.whirl / 11, go:() => { const [x, y] = randomCovered(); doWhirl(x, y); } },
  { id:'zig',   icon:'⚡', has:() => save.secrets.zig, ready:() => G.cd.zig <= 0, frac:() => 1 - G.cd.zig / 9, go:() => { const [x, y] = randomCovered(); doBolt(x, y); } },
  { id:'drill', icon:'⛏️', has:() => save.secrets.drill, ready:() => G.cd.drill <= 0, frac:() => 1 - G.cd.drill / 7, go:() => { const [x, y] = randomCovered(); doDrill(x, y); } },
  { id:'rain',  icon:'🌧️', has:() => save.secrets.rain, ready:() => G.cd.rain <= 0, frac:() => 1 - G.cd.rain / 60, go:() => doRain() },
];
function refreshSkills(){
  const host = $('skills'); if(!host) return;
  const ids = SKILLS.filter(s => s.has()).map(s => s.id).join(',');
  if(host.dataset.ids !== ids){
    host.dataset.ids = ids; host.innerHTML = '';
    for(const s of SKILLS) if(s.has()){ const b = document.createElement('button'); b.className = 'sk'; b.id = 'sk_' + s.id; b.innerHTML = `<i></i><span>${s.icon}</span>`; b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); AU.init(); if(G.state !== 'play' || !s.ready()){ AU.deny(); return; } s.go(); refreshSkillCds(); }); host.appendChild(b); }
  }
  refreshSkillCds();
}
function refreshSkillCds(){
  for(const s of SKILLS){ const b = $('sk_' + s.id); if(!b) continue; const r = s.ready(); b.classList.toggle('ready', r); b.classList.toggle('armed', s.id === 'blast' && G.blastArmed); b.firstChild.style.height = (r ? 0 : (1 - clamp(s.frac(), 0, 1)) * 100) + '%'; }
}
function refreshDive(){ const k = C && C.finds.find(f => (f.type === 'key' || f.type === 'exit') && f.st === 1); $('diveBtn').classList.toggle('hidden', !k); if(k){ const lk = k.type === 'key' && keyLocked(); $('diveBtn').textContent = k.type === 'exit' ? 'RETURN ▲' : lk ? '🔒 ' + Math.floor(C.cleared / C.total * 100) + '% / ' + Math.round(KEY_AT * 100) + '%' : 'DIVE ▼'; $('diveBtn').classList.toggle('locked', lk); } }

/* ---------------- codex ---------------- */
let codexTab = 'secrets';
function openCodex(){ pauseFor('codex'); $('codexDot').classList.add('hidden'); renderCodex(); show('codex'); }
function renderCodex(){
  document.querySelectorAll('#codex .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === codexTab));
  const L = $('codexBody'); let h = '';
  if(codexTab === 'secrets'){
    for(const s of SECRETS){ const f = save.secrets[s.id]; h += `<div class="item${f ? '' : ' locked'}"><div class="ii">${f ? '✦' : '?'}</div><div class="it"><b>${f ? s.name : '???'}</b><span>${f ? s.how : '“' + s.riddle + '”'}</span></div></div>`; }
  } else if(codexTab === 'critters'){
    h += '<div class="grid">';
    for(const c of CRITTERS){ const n = save.critters[c.id] || 0, sh = save.shiny[c.id]; h += `<div class="cell${n ? '' : ' unk'}${sh ? ' shiny' : ''}" title="${n ? c.name : '???'}"><span>${n ? c.e : '?'}</span><small>${n ? c.name : BIOMES[c.bi].name}</small>${n > 1 ? '<em>x' + n + '</em>' : ''}</div>`; }
    h += '</div>';
  } else if(codexTab === 'relics'){
    BIOMES.forEach((b, i) => { const m = save.relics[i] || 0, done = m === 15; h += `<div class="item${m ? '' : ' locked'}"><div class="ii">${m ? b.relic[1] : '?'}</div><div class="it"><b>${m ? b.relic[0] : '???'}</b><span>${done ? 'Restored · everything worth +25%' : 'Hidden in ' + (save.maxDepth > i ? b.name : 'an undiscovered world')}</span><div class="pips">${[0, 1, 2, 3].map(p => `<i class="${m & (1 << p) ? 'on' : ''}"></i>`).join('')}</div></div></div>`; });
  } else {
    if(!save.lore.length) h = '<div class="hint">The painter left notes somewhere in every painting. Look closely at the corners.</div>';
    for(const i of save.lore) h += `<div class="item"><div class="ii">✒️</div><div class="it"><span class="lore">“${LORE[i]}”</span></div></div>`;
  }
  L.innerHTML = h;
  const st = save.stats;
  $('codexStats').innerHTML = `Deepest <b>${save.maxDepth}</b> · Dives <b>${st.dives}</b> · Masterpieces <b>${st.masters}</b> · Treasure <b>${fmt(st.finds)}</b> · Best streak <b>${Math.floor(st.bestStreak)}s</b> · Earned <b>${fmt(save.earned)}</b>`;
}

/* ---------------- flow ---------------- */
let pausedBy = null;
function pauseFor(what){ if(G.state === 'play'){ G.state = 'pause'; pausedBy = what; G.ptr.down = false; SDK.gameplayStop(); AU.scrub(0, 0); } }
function resumePlay(){ if(G.state === 'pause'){ G.state = 'play'; pausedBy = null; SDK.gameplayStart(); AU.resume(); } }
function startGame(){
  hide('title'); show('hud'); show('panel'); layout(); measure();
  G.state = 'play'; SDK.gameplayStart(); AU.init(); AU.resume(); AU.setBiome(C.bi);
  buildUpgrades(); refreshSkills(); refreshDive();
  if(offlineGain > 0){ pauseFor('offline'); $('offDust').textContent = '+' + fmt(offlineGain); show('offline'); }
}
let offlineGain = 0;
function computeOffline(){
  if(!save.lastT || !save.up.moth) return;
  const secs = Math.min(8 * 3600, (Date.now() - save.lastT) / 1000);
  if(secs < 60) return;
  offlineGain = secs * save.up.moth * (1 + save.up.queen * .5) * 5 * baseVal() * .5;
}

/* ---------------- input ---------------- */
function wire(){
  onTap('playBtn', startGame);
  onTap('codexBtn', openCodex);
  onTap('setBtn', () => { pauseFor('settings'); syncSettings(); show('settings'); });
  onTap('diveBtn', () => { const k = C.finds.find(f => (f.type === 'key' || f.type === 'exit') && f.st === 1); if(k && G.state === 'play') tapFind(k); });
  onTap('dailyBtn', () => { if(G.state !== 'play' || C.kind !== 'main') return; save.daily.key = todayKey(); persist(); startDive(PW / 2, PW / 2, 'daily'); });
  onTap('offBtn', () => { gain(offlineGain); offlineGain = 0; hide('offline'); AU.gold(); bumpDust(); resumePlay(); persist(); });
  document.querySelectorAll('.closeBtn').forEach(b => onTap(b, () => { hide('codex'); hide('settings'); resumePlay(); }));
  document.querySelectorAll('#codex .tab').forEach(t => onTap(t, () => { codexTab = t.dataset.tab; renderCodex(); }));
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.addEventListener('change', () => { save.opt[i.dataset.opt] = i.checked; AU.apply(); persist(); }));
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => onTap(b, () => { save.opt[s.dataset.opt] = b.dataset.v; persist(); syncSettings(); resize(); })));
  onTap('replayTut', () => { save.tut = 0; persist(); toast('HINTS ON', 'They will show again as you play.', '#ffd23a'); });

  const P = G.ptr;
  const setW = e => { const [x, y] = toWorld(e.clientX, e.clientY); P.wx = x; P.wy = y; };
  cv.addEventListener('pointerdown', e => {
    AU.init(); AU.resume();
    if(G.state !== 'play' || P.down) return;
    e.preventDefault();
    setW(e);
    if(P.wx < -20 || P.wy < -20 || P.wx > PW + 20 || P.wy > PW + 20) return;
    if(G.blastArmed){ doBlast(P.wx, P.wy); return; }
    if(G.eye && G.eye.t > .2 && Math.hypot(G.eye.x - P.wx, G.eye.y - P.wy) < 48){ G.eye = null; G.goldT = 12; AU.gold(); banner('GOLDEN BRUSH', 'Everything x5 for 12 seconds', '#ffd23a', 2000); discover('eye'); return; }
    const tapR = 14 / Math.max(.4, G.view.s);
    let best = null, bd = 1e9;
    for(const f of C.finds){ if(f.st !== 1 || !TAPPABLE[f.type]) continue; const d = Math.hypot(f.x - P.wx, f.y - P.wy); if(d < f.r + tapR && d < bd){ bd = d; best = f; } }
    if(best){ tapFind(best); return; }
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    P.down = true; P.id = e.pointerId; P.lwx = P.wx; P.lwy = P.wy; P.stillT = 0; P.path = [];
  });
  addEventListener('pointermove', e => {
    if(e.pointerType === 'mouse') P.hover = true;
    if(P.down && e.pointerId !== P.id) return;
    setW(e);
    if(P.down && G.state === 'play'){ P.path.push({ x:P.wx, y:P.wy, t:G.rt }); while(P.path.length && G.rt - P.path[0].t > 1.3) P.path.shift(); gestures(); }
  }, { passive:true });
  const up = e => { if(P.down && e.pointerId === P.id){ P.down = false; P.path = []; } };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', e => { if(e.pointerType === 'mouse') P.hover = false; });
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('pointerdown', () => { AU.init(); AU.resume(); }, { capture:true });
  addEventListener('keydown', e => {
    AU.init(); AU.resume();
    if(e.key === 'Escape'){ if(G.state === 'pause'){ hide('codex'); hide('settings'); if(pausedBy !== 'offline') resumePlay(); } else if(G.state === 'play'){ pauseFor('settings'); syncSettings(); show('settings'); } }
    else if(e.key === 'Enter' && G.state === 'title') startGame();
    else if(G.state === 'play'){ const n = +e.key; if(n >= 1 && n <= UPG.length) buyUp(UPG[n - 1]); if(e.key === ' '){ e.preventDefault(); $('diveBtn').click(); } }
  });
  addEventListener('resize', () => setTimeout(measure, 50));
  addEventListener('orientationchange', () => setTimeout(() => { resize(); measure(); }, 200));
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ writeSave(); if(G.state === 'play') pauseFor('hidden'); } else { AU.resume(); if(pausedBy === 'hidden') resumePlay(); } });
  addEventListener('pagehide', () => writeSave());
}
function syncSettings(){
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.checked = !!save.opt[i.dataset.opt]);
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === save.opt[s.dataset.opt])));
}

/* ---------------- loop ---------------- */
let last = 0, saveT = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > .05) dt = .05;
  try{
    if(G.state === 'play' || G.state === 'dive') update(dt);
    else { G.t += dt; G.rt += dt; stepFx(dt); }
    render();
    if(G.state !== 'title' && C) updateHUD(dt);
    saveT += dt; if(saveT > 10 && G.state === 'play'){ saveT = 0; writeSave(); }
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
  if(save.canvas && save.canvas.seed !== undefined){ try{ C = restoreCanvas(save.canvas); }catch(e){ C = null; } }
  if(!C){ C = genCanvas((Math.random() * 4294967296) >>> 0, save.depth, 'main'); }
  G.C = C; _cg = C.cover.getContext('2d'); _tex = coverTextures(C.B);
  computeOffline();
  wire();
  $('titleInfo').innerHTML = save.earned > 0 ? `Depth <b>${save.depth}</b> · ${C.B.name} · Secrets <b>${Object.keys(save.secrets).length}/${SECRETS.length}</b>` : 'Scrub. Uncover. <b>Dive deeper.</b>';
  SDK.loadingStop();
  $('boot').classList.add('gone'); setTimeout(() => { if($('boot')) $('boot').remove(); }, 500);
})();
