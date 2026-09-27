'use strict';
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
const isHidden = id => $(id).classList.contains('hidden');
function onTap(id, fn){ const el = typeof id === 'string' ? $(id) : id; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }
const isTouch = () => matchMedia('(pointer:coarse)').matches;

/* ---------------- feedback ---------------- */
function toast(title, body, col, dur){
  if(G.state !== 'play') return;
  const host = $('toasts');
  while(host.children.length >= 3) host.firstChild.remove();
  const d = document.createElement('div'); d.className = 'toast';
  d.innerHTML = `<b style="color:${col || '#ffd36b'}">${title}</b>${body || ''}`;
  host.appendChild(d);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 320); }, dur || 3000);
}
let tipT = 0, tipLock = false;
function tip(html, dur){
  const t = $('tip'); clearTimeout(tipT); if(!dur) G.hintKey = null;
  if(!html){ t.classList.add('hidden'); return; }
  t.innerHTML = html; t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  if(dur) tipT = setTimeout(() => { t.classList.add('hidden'); tipLock = false; tutShow(); }, dur);
}
function hint(key, html){
  if(G.state !== 'play' || save.hints[key] || save.tut < 4) return;
  save.hints[key] = 1; persist(); tipLock = true; G.hintKey = key; tip(html, 5500);
}

/* ---------------- tutorial ---------------- */
const TUT = [
  'Tap empty space to create <b>Stardust</b> ✦',
  'Drag a Stardust onto its <b>twin</b>. Two of a kind merge into something new!',
  'Bigger bodies earn more <b>Stardust</b> every second. Open <b>UPGRADES</b>!',
  'Tap the <b>Sun</b> to release a solar flare of Stardust ☀',
];
let tutN = 0;
function tutShow(){ if(G.state !== 'play' || tipLock) return; if(save.tut < TUT.length) tip(TUT[save.tut]); else tip(null); }
function tutEv(e){
  const s = save.tut;
  if(s === 0 && e === 'spawn' && ++tutN >= 2) adv();
  else if(s === 1 && e === 'merge') adv();
  else if(s === 2 && e === 'upgrades') adv();
  else if(s === 3 && e === 'sun') adv();
  function adv(){
    save.tut++; persist();
    if(save.tut >= TUT.length){ tip('You got it! <b>Drop</b> a body onto the Sun to feed it. Catch <b>golden comets</b>. Build a universe!', 6000); tipLock = true; }
    else tutShow();
  }
}

/* ---------------- HUD ---------------- */
const hudC = {};
function setH(key, val, fn){ if(hudC[key] === val) return; hudC[key] = val; fn(val); }
let nextT = -1;
function updateHUD(){
  setH('dust', big(save.dust), v => $('dust').textContent = v);
  setH('inc', big(G.inc), v => $('inc').textContent = '+' + v + ' /s');
  setH('sun', save.sunLvl, v => $('sunLvl').textContent = v);
  setH('sunb', Math.round(save.sunXp / sunNeed(save.sunLvl) * 50), v => $('sunBar').style.width = v * 2 + '%');
  const mc = maxCharges();
  setH('pips', save.charges + '/' + mc, () => { let h = ''; for(let i = 0; i < mc; i++) h += `<i class="${i < save.charges ? 'on' : ''}"></i>`; $('pips').innerHTML = h; });
  setH('ref', save.charges >= mc ? 100 : Math.round(G.chargeT / chargeTime() * 25) * 4, v => $('chRefill').firstElementChild.style.width = v + '%');
  const n = bodyCount(), cap = capacity();
  setH('cap', n + '/' + cap, v => { $('capN').textContent = v; });
  setH('capf', n >= cap ? 1 : 0, v => $('cap').classList.toggle('full', !!v));
  if(G.full > .9){ G.full = .89; const c = $('cap'); c.classList.remove('full'); void c.offsetWidth; c.classList.add('full'); }
  if(G.noCharge){ G.noCharge = 0; const c = $('charges'); c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); }
  setH('make', launchTier(), v => $('makeName').textContent = TIERS[v].n);
  // next discovery
  let nt = -1; for(let t = 0; t <= MAXT; t++){ if(!save.disc[t]){ nt = t; break; } }
  const newG = nt < 0 && save.topG < MAXT;
  if(nt < 0 && newG) nt = save.topG + 1;
  setH('next', nt + ':' + (save.disc[nt] ? 1 : 0), () => {
    if(nt < 0){ $('nextChip').classList.add('hidden'); return; }
    $('nextChip').classList.remove('hidden');
    const ic = $('nextIco'), g = ic.getContext('2d'); g.clearRect(0, 0, 64, 64);
    try{ g.drawImage(tierIcon(nt, 64, !save.disc[nt]), 0, 0, 64, 64); }catch(e){}
    $('nextName').textContent = save.disc[nt] ? TIERS[nt].n : '???';
    $('nextHow').textContent = nt > 0 ? 'Merge two ' + (save.disc[nt - 1] ? TIERS[nt - 1].n + 's' : '???') : '';
    $('nextChip').firstElementChild.nextElementSibling.firstElementChild.textContent = newG ? 'NEW IN THIS GALAXY' : 'NEXT DISCOVERY';
  });
  const bs = (G.rush > 0 ? Math.ceil(G.rush) : 0) + ':' + (G.storm > 0 ? Math.ceil(G.storm) : 0);
  setH('boost', bs, () => { let h = ''; if(G.rush > 0) h += `<span>STAR RUSH x3 · ${Math.ceil(G.rush)}s</span>`; if(G.storm > 0) h += `<span class="st">KINSHIP STORM · ${Math.ceil(G.storm)}s</span>`; $('boosts').innerHTML = h; });
  // dots
  setH('upd', UPS.some(u => upState(u) === 'ok' && save.dust >= upCost(u, save.up[u.id])) ? 1 : 0, v => $('upDot').classList.toggle('hidden', !v));
  setH('msd', save.mNew ? 1 : 0, v => $('missDot').classList.toggle('hidden', !v));
  setH('cos', save.cosmos ? 1 : 0, v => $('cosmosBtn').classList.toggle('hidden', !v));
  setH('cosd', essenceGain() >= 1 || PERKS.some(p => save.perks[p.id] < p.max && save.essence >= p.cost(save.perks[p.id])) ? 1 : 0, v => $('cosDot').classList.toggle('hidden', !v));
  if(!save.cosmos && essenceGain() >= 1){ save.cosmos = true; G.cosmosNew = true; persist(); }
  if(G.cosmosNew){ G.cosmosNew = false; toast('COSMOS UNLOCKED', 'Your universe is ready for a <b>Supernova</b>. Open COSMOS!', '#c9b8ff', 4500); }
}

/* ---------------- sheets ---------------- */
let sheetKind = null, buyMax = false, sheetRefs = [];
function openSheet(kind){
  if(sheetKind === kind){ closeSheet(); return; }
  sheetKind = kind; show('sheet'); document.body.classList.add('sheetOpen');
  $('sheetBody').scrollTop = 0;
  renderSheet();
  if(kind === 'up') tutEv('upgrades');
  if(kind === 'miss'){ save.mNew = false; persist(); }
}
function closeSheet(){ sheetKind = null; hide('sheet'); document.body.classList.remove('sheetOpen'); }
function upState(u){
  const l = save.up[u.id];
  if(l >= u.max || (u.id === 'forge' && launchTier() >= MAXT - 2)) return 'max';
  if(u.id === 'forge' && l >= forgeCap()) return 'cap';
  if(u.id === 'forge' && save.topG < l + 4) return 'lock';
  return 'ok';
}
function buyUp(u){
  let n = 0;
  do{
    if(upState(u) !== 'ok') break;
    const c = upCost(u, save.up[u.id]); if(save.dust < c) break;
    save.dust -= c; save.up[u.id]++; n++;
    if(u.id === 'mag') save.charges++;
  } while(buyMax && n < 200);
  if(n){ AU.buy(); persist(); const d = $('dust'); d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop'); renderSheet(); }
}
function renderSheet(){
  const B = $('sheetBody'), X = $('sheetExtra'); B.innerHTML = ''; X.innerHTML = ''; sheetRefs = [];
  if(sheetKind === 'up'){
    $('sheetTitle').textContent = 'UPGRADES';
    X.innerHTML = `<div class="seg2"><button data-m="0" class="${buyMax ? '' : 'on'}">x1</button><button data-m="1" class="${buyMax ? 'on' : ''}">MAX</button></div>`;
    X.querySelectorAll('button').forEach(b => onTap(b, () => { buyMax = b.dataset.m === '1'; renderSheet(); }));
    for(const u of UPS){
      const it = document.createElement('div'); it.className = 'item';
      it.innerHTML = `<div class="ii">${u.icon}</div><div class="it"><b></b><span></span><em></em></div>`;
      const btn = document.createElement('button'); btn.className = 'btn';
      onTap(btn, () => buyUp(u));
      it.appendChild(btn); B.appendChild(it);
      sheetRefs.push({ u, it, btn, nm:it.querySelector('b'), ds:it.querySelector('span'), lv:it.querySelector('em') });
    }
  } else if(sheetKind === 'miss'){
    $('sheetTitle').textContent = 'MISSIONS';
    X.innerHTML = `<div class="pill">DONE <b>${save.missionsDone}</b></div>`;
    for(const m of save.missions){
      const it = document.createElement('div'); it.className = 'item';
      it.innerHTML = `<div class="ii" style="color:#9fe3ff">★</div><div class="it"><b>${m.txt}</b><span></span><div class="mBar"><i></i></div></div><div class="pill">✦ <b></b></div>`;
      B.appendChild(it); sheetRefs.push({ m, it });
    }
    const today = save.daily.day === dayNum();
    B.insertAdjacentHTML('beforeend', `<div class="item"><div class="ii" style="color:#ff9ad5">❀</div><div class="it"><b>Cosmic Gift</b><span>${today ? 'Claimed today. A new gift arrives tomorrow.' : 'A gift is waiting for you!'} Streak: <b>${save.daily.streak}</b> day${save.daily.streak === 1 ? '' : 's'}</span></div></div>`);
    B.insertAdjacentHTML('beforeend', '<div class="hint">Missions complete by themselves as you play and are replaced by bigger ones. Rewards grow with your income.</div>');
  } else if(sheetKind === 'codex'){
    $('sheetTitle').textContent = 'CODEX';
    const found = save.disc.filter(Boolean).length;
    X.innerHTML = `<div class="pill">FOUND <b>${found}/${TIERS.length}</b></div>`;
    const grid = document.createElement('div'); grid.className = 'grid';
    TIERS.forEach((T, t) => {
      const d = document.createElement('div'); d.className = 'cx' + (t === save.topG ? ' cur' : '');
      const known = !!save.disc[t];
      d.appendChild(tierIcon(t, 64, !known));
      d.insertAdjacentHTML('beforeend', `<b>${known ? T.n : '???'}</b><span>${known ? '+' + big(tierInc(t) * incMul()) + ' /s' : 'Undiscovered'}</span>`);
      onTap(d, () => { if(known) toast(T.n.toUpperCase(), T.f, T.b, 3500); else toast('UNDISCOVERED', t > 0 && save.disc[t - 1] ? 'Merge two ' + TIERS[t - 1].n + 's to find it.' : 'Keep merging to find out!', '#c9b8ff'); });
      grid.appendChild(d);
    });
    B.appendChild(grid);
    const S = save.stats;
    B.insertAdjacentHTML('beforeend', `<div class="stats">
      <div><span>Merges</span><b>${big(S.merges)}</b></div><div><span>Best combo</span><b>x${S.maxCombo}</b></div>
      <div><span>Comets caught</span><b>${big(S.comets)}</b></div><div><span>Sun taps</span><b>${big(S.taps)}</b></div>
      <div><span>Supernovas</span><b>${S.novas}</b></div><div><span>Stardust ever</span><b>${big(save.earnedAll)}</b></div>
      <div><span>Galaxy</span><b>${GALAXIES[save.galaxy % GALAXIES.length]}</b></div><div><span>Time in space</span><b>${hms(S.play)}</b></div></div>`);
  } else if(sheetKind === 'cosmos'){
    $('sheetTitle').textContent = 'COSMOS';
    X.innerHTML = `<div class="pill" style="color:#c9b8ff">✧ <b id="essN">${big(save.essence)}</b></div>`;
    const gn = essenceGain(), next = Math.pow(gn + 1, 2) * NOVA_K;
    const nc = document.createElement('div'); nc.className = 'novaCard';
    nc.innerHTML = `<h3>SUPERNOVA</h3><p>Let your Sun explode and be reborn in a brand new galaxy. You lose Stardust, upgrades and bodies, but keep <b>Essence</b>, Cosmos perks and your Codex.</p>
      <p>Essence earned so far: <b style="color:#c9b8ff">+${gn} ✧</b><br><small>Next ✧ at ${big(next)} Stardust earned this galaxy (${big(save.earnedG)})</small></p>`;
    const nb = document.createElement('button'); nb.className = 'btn big primary'; nb.textContent = gn >= 1 ? `GO SUPERNOVA  +${gn} ✧` : 'NOT READY YET'; nb.disabled = gn < 1;
    onTap(nb, () => askNova()); nc.appendChild(nb); B.appendChild(nc);
    for(const p of PERKS){
      const it = document.createElement('div'); it.className = 'item';
      it.innerHTML = `<div class="ii" style="color:#c9b8ff">${p.icon}</div><div class="it"><b>${p.name}</b><span>${p.desc}</span><em></em></div>`;
      const btn = document.createElement('button'); btn.className = 'btn ess';
      onTap(btn, () => { const l = save.perks[p.id], c = p.cost(l); if(l >= p.max || save.essence < c) return; save.essence -= c; save.perks[p.id]++; AU.buy(); if(p.id === 'vast' || p.id === 'heart') G.inc = calcIncome(); persist(); renderSheet(); });
      it.appendChild(btn); B.appendChild(it); sheetRefs.push({ p, it, btn, lv:it.querySelector('em') });
    }
  }
  refreshSheet(true);
}
function refreshSheet(force){
  if(!sheetKind) return;
  if(sheetKind === 'up'){
    for(const r of sheetRefs){
      const u = r.u, l = save.up[u.id], st = upState(u), c = upCost(u, l);
      const key = st + '|' + l + '|' + (save.dust >= c);
      if(!force && r.key === key) continue; r.key = key;
      r.nm.textContent = u.name; r.ds.innerHTML = st === 'max' ? 'Fully upgraded' : u.desc(l);
      r.lv.textContent = 'LEVEL ' + l + (u.max < 60 ? ' / ' + (u.id === 'forge' ? forgeCap() : u.max) : '');
      if(st === 'max'){ r.btn.textContent = 'MAX'; r.btn.disabled = true; r.btn.classList.remove('can'); }
      else if(st === 'cap'){ r.ds.innerHTML = 'Galaxy limit reached. A <b>Supernova</b> unlocks 2 more levels.'; r.btn.innerHTML = '<small>NEXT<br>GALAXY</small>'; r.btn.disabled = true; r.btn.classList.remove('can'); }
      else if(st === 'lock'){ r.btn.innerHTML = '<small>MAKE A<br>' + TIERS[l + 4].n + '</small>'; r.btn.disabled = true; r.btn.classList.remove('can'); }
      else { r.btn.textContent = '✦ ' + big(c); r.btn.disabled = save.dust < c; r.btn.classList.toggle('can', save.dust >= c); }
    }
  } else if(sheetKind === 'miss'){
    for(const r of sheetRefs){
      const m = r.m, pct = Math.min(100, m.p / m.n * 100);
      r.it.querySelector('span').textContent = m.done ? 'Complete!' : big(m.p) + ' / ' + big(m.n);
      r.it.querySelector('.mBar i').style.width = pct + '%';
      r.it.querySelector('.pill b').textContent = big(Math.max(60, G.inc * m.secs));
    }
  } else if(sheetKind === 'cosmos'){
    for(const r of sheetRefs){
      const p = r.p, l = save.perks[p.id], c = p.cost(l);
      r.lv.textContent = 'LEVEL ' + l + ' / ' + p.max;
      if(l >= p.max){ r.btn.textContent = 'MAX'; r.btn.disabled = true; r.btn.classList.remove('can'); }
      else { r.btn.textContent = '✧ ' + c; r.btn.disabled = save.essence < c; r.btn.classList.toggle('can', save.essence >= c); }
    }
  }
}

/* ---------------- modals ---------------- */
const modalQ = [];
function modal(html, buttons){
  if(!isHidden('modal')){ modalQ.push([html, buttons]); return; }
  const c = $('modalCard'); c.innerHTML = html;
  const col = document.createElement('div'); col.className = 'col';
  for(const b of buttons){
    const el = document.createElement('button'); el.className = 'btn wide ' + (b.cls || 'primary'); el.innerHTML = b.t;
    onTap(el, () => { closeModal(); b.fn && b.fn(); });
    col.appendChild(el);
  }
  c.appendChild(col);
  c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
  show('modal'); syncGameplay();
}
function closeModal(){
  hide('modal');
  if(modalQ.length){ const m = modalQ.shift(); setTimeout(() => modal(m[0], m[1]), 150); }
  syncGameplay();
}
function showDiscovery(t){
  const T = TIERS[t], rw = tierInc(t) * 20 * incMul();
  gain(rw);
  if(t <= 2){ toast('NEW DISCOVERY: ' + T.n.toUpperCase(), `${T.f} <b>+${big(rw)} ✦</b>`, '#9fe3ff', 3800); AU.discovery(t); return; }
  AU.discovery(t); SDK.happytime(); G.slow = .6;
  modal(`<div class="tag">NEW DISCOVERY!</div><div class="rays"><canvas class="discIco" id="discC"></canvas></div><h2>${T.n.toUpperCase()}</h2><p>${T.f}</p>
    <p>Earns <b style="color:#ffd36b">+${big(tierInc(t) * incMul())} ✦</b> every second${t >= LIFE_T ? ' and can grow <b style="color:#8dffb0">life</b>' : ''}.</p><div class="big2">+${big(rw)} ✦</div>`,
    [{ t:t === MAXT ? 'THE END OF THE LADDER' : 'WONDERFUL!' }]);
  const c = $('discC'); if(c){ const ic = tierIcon(t, 170); c.width = ic.width; c.height = ic.height; c.getContext('2d').drawImage(ic, 0, 0); }
}
function askNova(){
  const gn = essenceGain();
  modal(`<div class="tag" style="color:#ffb08a">SUPERNOVA</div><h2>Explode your Sun?</h2><p>You will gain <b style="color:#c9b8ff">+${gn} Essence ✧</b> and wake up in <b>${GALAXIES[(save.galaxy + 1) % GALAXIES.length]}</b>.</p><p>Stardust, upgrades, bodies and your Sun level reset. Essence, Cosmos perks, missions progress and the Codex stay.</p>`,
    [{ t:'GO SUPERNOVA', fn:() => { closeSheet(); doNova(); setTimeout(() => { toast('WELCOME TO ' + GALAXIES[save.galaxy % GALAXIES.length].toUpperCase(), `You now have <b>${big(save.essence)} ✧</b>. Spend it in COSMOS.`, '#c9b8ff', 5000); for(const k in hudC) delete hudC[k]; }, 1200); } },
     { t:'NOT YET', cls:'ghost' }]);
}
function offerAway(){
  const a = G.away; G.away = null;
  if(!a || !(a.amt > 0)) return;
  modal(`<div class="tag">WELCOME BACK</div><h2>Your universe kept spinning</h2><p>You were away for <b>${hms(a.secs)}</b>${a.capped ? ' (limit reached)' : ''}. Your worlds gathered:</p><div class="big2">+${big(a.amt)} ✦</div><p style="font-size:12px">Away earnings: ${Math.round(awayRate() * 100)}% for up to ${Math.round(awayCap() / 3600)} h. Upgrade <b>Time Archive</b> for more.</p>`,
    [{ t:'COLLECT', fn:() => { gain(a.amt); AU.cometCatch(); } }]);
}
function offerDaily(){
  const d = dayNum();
  if(save.daily.day === d) return;
  if(save.tut < TUT.length){ save.daily.day = d; save.daily.streak = 1; persist(); return; }
  const streak = save.daily.day === d - 1 ? save.daily.streak + 1 : 1;
  const amt = Math.max(150, calcIncome() * 90 * Math.min(7, streak));
  modal(`<div class="tag" style="color:#ff9ad5">COSMIC GIFT</div><h2>Day ${streak}${streak > 1 ? ' streak!' : ''}</h2><p>A gift from the stars for visiting today. The bigger your streak, the bigger the gift (up to 7 days).</p><div class="big2">+${big(amt)} ✦</div><p style="font-size:12px">Plus a full set of charges.</p>`,
    [{ t:'CLAIM', fn:() => { save.daily.day = d; save.daily.streak = streak; gain(amt); save.charges = Math.max(save.charges, maxCharges()); AU.mission(); persist(); } }]);
}
function syncGameplay(){
  const busy = !isHidden('modal') || !isHidden('settings');
  if(G.state === 'play' && !busy && !document.hidden) SDK.gameplayStart(); else SDK.gameplayStop();
}

/* ---------------- flow ---------------- */
function computeAway(secs){
  G.inc = calcIncome();
  const eff = Math.min(secs, awayCap());
  return { secs, amt:G.inc * awayRate() * eff, capped:secs > awayCap() + 60 };
}
function startPlay(){
  hide('menu'); show('hud'); for(const k in hudC) delete hudC[k];
  G.state = 'play';
  if(G.demo){ G.demo = false; G.B = []; G.P = []; }
  if(!G.B.length){ for(let i = 0; i < 3; i++) seedBody(launchTier()); }
  rollMissions();
  offerAway(); offerDaily();
  tutShow();
  syncGameplay(); AU.init(); AU.resume();
  resize();
}
function refreshMenu(){
  const n = save.disc.filter(Boolean).length;
  $('menuSub').innerHTML = n ? `${GALAXIES[save.galaxy % GALAXIES.length]} · ${n}/${TIERS.length} discovered · ✦ ${big(save.dust)}` : 'Tap to create · Drag twins together · Watch your universe grow';
}
function openSettings(){ syncSettings(); show('settings'); syncGameplay(); }
function syncSettings(){
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.checked = !!save.opt[i.dataset.opt]);
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === save.opt[s.dataset.opt])));
}
function applyQuality(){ G.q = save.opt.quality === 'auto' ? (G.autoQ || 'high') : save.opt.quality; resize(); }

/* ---------------- wiring ---------------- */
function wire(){
  document.body.classList.toggle('touch', isTouch());
  if(isTouch()) $('keysHint').textContent = 'Tap empty space to create · Drag bodies onto their twins to merge · Flick to fling · Drop on the Sun to feed it · Tap the Sun for flares';
  onTap('playBtn', startPlay);
  onTap('setBtn', openSettings);
  onTap('resumeBtn', () => { hide('settings'); syncGameplay(); });
  onTap('replayTut', () => { save.tut = 0; tutN = 0; save.hints = {}; persist(); hide('settings'); syncGameplay(); tipLock = false; tutShow(); });
  onTap('upBtn', () => openSheet('up'));
  onTap('missBtn', () => openSheet('miss'));
  onTap('codexBtn', () => openSheet('codex'));
  onTap('cosmosBtn', () => openSheet('cosmos'));
  onTap('sheetX', closeSheet);
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.addEventListener('change', () => { save.opt[i.dataset.opt] = i.checked; AU.apply(); persist(); }));
  document.querySelectorAll('#settings .seg').forEach(s => s.querySelectorAll('button').forEach(b => onTap(b, () => { save.opt[s.dataset.opt] = b.dataset.v; persist(); syncSettings(); if(s.dataset.opt === 'quality') applyQuality(); })));
  // pointer: one finger (or mouse) at a time
  let pid = null, lastMv = 0;
  cv.addEventListener('pointerdown', e => {
    AU.init(); AU.resume();
    if(G.state !== 'play' || pid !== null) return;
    e.preventDefault();
    if(sheetKind){ closeSheet(); return; }
    pid = e.pointerId; lastMv = performance.now();
    try{ cv.setPointerCapture(e.pointerId); }catch(_){}
    pointerDown(e.clientX, e.clientY);
  });
  addEventListener('pointermove', e => {
    if(pid !== null && e.pointerId !== pid) return;
    const now = performance.now(); pointerMove(e.clientX, e.clientY, now - lastMv); lastMv = now;
  }, { passive:true });
  const up = e => { if(e.pointerId !== pid) return; pid = null; pointerUp(); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('pointerdown', () => { AU.init(); AU.resume(); }, { capture:true });
  addEventListener('keydown', e => {
    AU.init(); AU.resume();
    const k = e.key.toLowerCase();
    if([' ', 'tab'].includes(k)) e.preventDefault();
    if(e.repeat) return;
    if(G.state === 'menu' && (k === 'enter' || k === ' ')){ $('playBtn').click(); return; }
    if(G.state !== 'play') return;
    if(k === 'escape'){ if(!isHidden('settings')){ hide('settings'); syncGameplay(); } else if(sheetKind) closeSheet(); else openSettings(); }
    else if(k === 'u') openSheet('up'); else if(k === 'm') openSheet('miss'); else if(k === 'c') openSheet('codex');
  });
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 200));
  document.addEventListener('visibilitychange', () => {
    AU.setHidden(document.hidden);
    if(document.hidden){ G.hiddenAt = Date.now(); if(pid !== null){ pid = null; pointerUp(); } writeSave(); }
    else {
      AU.resume();
      if(G.hiddenAt && G.state === 'play'){
        const secs = (Date.now() - G.hiddenAt) / 1000;
        if(secs > 60){ G.away = computeAway(secs); offerAway(); } else if(secs > 1) gain(calcIncome() * secs);
      }
      G.hiddenAt = 0;
    }
    syncGameplay();
  });
  addEventListener('pagehide', () => writeSave());
}

/* ---------------- loop ---------------- */
let last = 0, pfT = 0, pfN = 0, pfSum = 0, shT = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > .05) dt = .05;
  if(save.opt.quality === 'auto' && G.state === 'play'){
    pfSum += dt; pfN++; pfT += dt;
    if(pfT > 3){ const avg = pfSum / pfN; pfT = pfSum = pfN = 0; if(avg > 1 / 40 && G.q !== 'low'){ G.autoQ = 'low'; G.q = 'low'; resize(); } }
  }
  try{
    if(G.state === 'play' || G.state === 'menu') update(dt);
    if(BG) render();
    if(G.state === 'play'){ updateHUD(); shT += dt; if(shT > .25){ shT = 0; refreshSheet(); } }
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
  unpackBodies();
  if(save.last > 0){ const secs = (Date.now() - save.last) / 1000; if(secs > 60) G.away = computeAway(secs); }
  save.charges = Math.min(save.charges, maxCharges());
  if(!G.B.length && !save.earnedAll){ G.demo = true; for(const t of [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]){ const b = seedBody(t); if(b) b.born = 0; } G.P = []; }
  newSky();
  wire();
  G.state = 'menu';
  refreshMenu(); show('menu');
  SDK.loadingStop();
  $('boot').classList.add('gone'); setTimeout(() => $('boot').remove(), 500);
})();
