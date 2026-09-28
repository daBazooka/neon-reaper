'use strict';
/* =====================================================================
   BO KATA — screens, HUD, progression and the main loop
   ===================================================================== */
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
const isHidden = id => $(id).classList.contains('hidden');
function onTap(el, fn){ el = typeof el === 'string' ? $(el) : el; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }
function vib(p){ if(save.opt.vib && navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)){ try{ navigator.vibrate(p); }catch(e){} } }
function toast(title, body, dur){
  const host = $('toasts'); while(host.children.length >= 3) host.firstChild.remove();
  const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = `<b>${title}</b>${body || ''}`; host.appendChild(d);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 320); }, dur || 2600);
}
let mode = 'battle', STATE = 'boot';

/* ---------------- daily systems ---------------- */
function rollDaily(){
  const d = dayNum();
  if(save.quests.day !== d){
    const rng = mulberry32(d * 7 + 3), pool = QUESTS.slice(), list = [];
    while(list.length < 3){ const q = pool.splice((rng() * pool.length) | 0, 1)[0]; const tier = Math.min(2, (rng() * (1 + Math.min(2, save.trophies / 500))) | 0); list.push({ id:q.id, n:q.v[tier], p:0, coins:q.coins[tier], done:false, claimed:false }); }
    save.quests = { day:d, list };
  }
  if(save.shop.day !== d){
    const rng = mulberry32(d * 13 + 5), pool = KITES.filter(k => !save.kites.includes(k.id)), items = [];
    while(items.length < 3 && pool.length){ items.push(pool.splice((rng() * pool.length) | 0, 1)[0].id); }
    save.shop = { day:d, items };
  }
  persist();
}
function questEv(id, n){
  if(!M || M.mode === 'menu') return;
  for(const q of save.quests.list){ if(q.id !== id || q.done) continue; q.p = Math.min(q.n, q.p + n); if(q.p >= q.n){ q.done = true; toast('QUEST COMPLETE!', QUESTS.find(x => x.id === id).n(q.n)); } }
  persist();
}
const kitePrice = k => [300, 800, 2000, 5000][k.r];
const GIFT = [50, 80, 120, 160, 220, 300, 500];
function giftReady(){ return save.gift.day !== dayNum(); }

/* ---------------- avatar ---------------- */
function avatarCanvas(look, px){
  const c = document.createElement('canvas'), d = Math.min(2, devicePixelRatio || 1); c.width = c.height = px * d; c.style.width = c.style.height = px + 'px';
  const g = c.getContext('2d'); g.scale(d * px / 40, d * px / 40);
  g.fillStyle = '#ffe0b8'; g.fillRect(0, 0, 40, 40);
  g.fillStyle = SHIRT[look.shirt % SHIRT.length]; g.beginPath(); g.ellipse(20, 42, 16, 12, 0, 0, TAU); g.fill();
  g.fillStyle = SKIN[look.skin % SKIN.length]; g.beginPath(); g.arc(20, 19, 10, 0, TAU); g.fill();
  g.fillStyle = '#1d1414'; g.beginPath(); g.arc(20, 16, 10.5, Math.PI * 1.05, -.05); g.fill();
  g.fillStyle = '#1d1414'; g.fillRect(15, 19, 2.4, 2.4); g.fillRect(23, 19, 2.4, 2.4);
  g.strokeStyle = '#6a2a2a'; g.lineWidth = 1.4; g.beginPath(); g.arc(20, 22, 4, .2, Math.PI - .2); g.stroke();
  return c;
}

/* ---------------- home ---------------- */
function goHome(){
  STATE = 'home';
  hide('hud'); hide('results'); hide('pause'); hide('panel'); $('pops').innerHTML = '';
  rollDaily();
  if(M && M.net) netClose();
  newMatch('menu'); ambienceInit(); camFollow(0, true); AU.setLevel(0); AU.style = M.arena.music || 'desi';
  refreshHome(); show('home');
}
function refreshHome(){
  const ar = arenaFor(save.trophies);
  $('hName').textContent = save.name || 'You'; $('hArena').textContent = ar.name;
  $('hTro').textContent = fmt(save.trophies); $('hCoins').textContent = fmt(save.coins);
  const av = $('avatar'); av.innerHTML = ''; av.appendChild(avatarCanvas(save.look, 36));
  const next = ROAD[save.road];
  if(next){
    const prev = save.road ? ROAD[save.road - 1].tr : 0;
    $('rNext').innerHTML = `Next: ${next.tr} 🏆 · ${next.rw.kite ? kiteById(next.rw.kite).n : next.rw.spool ? spoolById(next.rw.spool).n : next.rw.coins + ' coins'}`;
    $('rFill').style.width = clamp((save.trophies - prev) / (next.tr - prev) * 100, 0, 100) + '%';
  } else { $('rNext').textContent = 'Road complete!'; $('rFill').style.width = '100%'; }
  $('roadDot').classList.toggle('hidden', !(next && save.trophies >= next.tr));
  $('kDot').classList.toggle('hidden', !save.newKites.length);
  $('qDot').classList.toggle('hidden', !(giftReady() || save.quests.list.some(q => q.done && !q.claimed)));
  document.querySelectorAll('.mode').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
  $('onlineBtn').classList.toggle('on', !!save.opt.online); $('onlineSub').textContent = save.opt.online ? 'Real flyers + bots' : 'Offline vs bots';
}

/* ---------------- panels ---------------- */
let panelKind = '';
function openPanel(kind){
  panelKind = kind; hide('home'); show('panel');
  $('pTitle').textContent = { kites:'KITES', thread:'GEAR', quests:'QUESTS', road:'TROPHY ROAD', settings:'SETTINGS' }[kind];
  renderPanel();
}
function closePanel(){ hide('panel'); if(panelKind === 'kites'){ save.newKites = []; persist(); } panelKind = ''; refreshHome(); show('home'); }
function spend(c){ if(save.coins < c){ toast('NOT ENOUGH COINS', 'Fly more matches to earn coins!'); return false; } save.coins -= c; AU.coin(); persist(); return true; }
function kiteCard(d, opts){
  const own = save.kites.includes(d.id), el = document.createElement('div');
  el.className = 'kc' + (save.kite === d.id ? ' eq' : '') + (own || opts.shop ? '' : ' lock');
  el.appendChild(kiteIcon(d, 58));
  el.insertAdjacentHTML('beforeend', `<b>${own || opts.shop ? d.n : '???'}</b><small style="color:${RARITY[d.r].c}">${RARITY[d.r].n.toUpperCase()}</small>`);
  if(save.newKites.includes(d.id)) el.insertAdjacentHTML('beforeend', '<span class="new">NEW</span>');
  return el;
}
function renderPanel(){
  const B = $('pBody'); B.innerHTML = ''; $('pCoins').textContent = fmt(save.coins);
  const sec = t => B.insertAdjacentHTML('beforeend', `<div class="sec">${t}</div>`);
  if(panelKind === 'kites'){
    const eq = kiteById(save.kite);
    const top = document.createElement('div'); top.className = 'item';
    top.appendChild(Object.assign(document.createElement('div'), { className:'ii' })).appendChild(kiteIcon(eq, 40));
    top.insertAdjacentHTML('beforeend', `<div class="it"><b>${eq.n}</b><span style="color:${RARITY[eq.r].c}">${RARITY[eq.r].n}</span><div class="stats3"><span>SPEED ${Math.round(eq.spd * 100)}</span><span>AGILITY ${Math.round(eq.agi * 100)}</span><span>STEADY ${Math.round(eq.stab * 100)}</span></div></div>`);
    B.appendChild(top);
    sec("TODAY'S KITE BAZAAR");
    const shop = document.createElement('div'); shop.className = 'grid';
    for(const id of save.shop.items){
      const d = kiteById(id), own = save.kites.includes(id), el = kiteCard(d, { shop:true });
      const b = document.createElement('button'); b.className = 'btn sm' + (own ? '' : ' green'); b.style.marginTop = '6px';
      b.innerHTML = own ? 'OWNED' : `<i class="cIco" style="width:14px;height:14px;vertical-align:-2px"></i> ${fmt(kitePrice(d))}`; b.disabled = own;
      onTap(b, () => { if(!spend(kitePrice(d))) return; save.kites.push(id); save.kite = id; AU.unlock(); persist(); renderPanel(); });
      el.appendChild(b); shop.appendChild(el);
    }
    B.appendChild(shop);
    sec(`YOUR COLLECTION · ${save.kites.length}/${KITES.length}`);
    const grid = document.createElement('div'); grid.className = 'grid';
    for(const d of KITES){
      const el = kiteCard(d, {}); const own = save.kites.includes(d.id);
      onTap(el, () => { if(!own){ toast('NOT FOUND YET', 'Loot it from the sky, buy it in the bazaar or earn it on the Trophy Road.'); return; } save.kite = d.id; persist(); renderPanel(); });
      grid.appendChild(el);
    }
    B.appendChild(grid);
    B.insertAdjacentHTML('beforeend', '<div class="sec" style="opacity:.8;letter-spacing:0;font-weight:700">Loot falling kites in battle: a kite you do not own yet may join your collection!</div>');
  } else if(panelKind === 'thread'){
    sec('MANJA');
    for(const [k, nm, ic, ds] of [['sharp', 'Sharpness', '✂', 'Cuts rival threads faster'], ['str', 'Strength', '🛡', 'Your thread survives longer']]){
      const l = save.manja[k], cost = manjaCost(l);
      const it = document.createElement('div'); it.className = 'item';
      it.innerHTML = `<div class="ii">${ic}</div><div class="it"><b>${nm} · LV ${l}</b><span>${ds}</span><div class="pips">${Array.from({ length:MANJA_MAX }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div></div>`;
      const b = document.createElement('button'); b.className = 'btn sm green';
      b.innerHTML = l >= MANJA_MAX ? 'MAX' : `<i class="cIco" style="width:14px;height:14px;vertical-align:-2px"></i> ${fmt(cost)}`; b.disabled = l >= MANJA_MAX;
      onTap(b, () => { if(!spend(cost)) return; save.manja[k]++; persist(); renderPanel(); });
      it.appendChild(b); B.appendChild(it);
    }
    sec('CHARKHI · YOUR SPOOL');
    B.insertAdjacentHTML('beforeend', '<div class="sec" style="letter-spacing:0;font-weight:700;opacity:.9">Your friend on the roof holds the spool. A better spool holds more thread, pays out slack faster for a quick dheel and gives snappier pulls.</div>');
    for(const sp of SPOOLS){
      const own = save.spools.includes(sp.id), eq = save.spool === sp.id;
      const it = document.createElement('div'); it.className = 'item';
      it.innerHTML = `<div class="ii"><i class="sw" style="background:conic-gradient(${sp.c[0]} 0 25%, ${sp.c[1]} 0 50%, ${sp.c[0]} 0 75%, ${sp.c[1]} 0)"></i></div><div class="it"><b>${sp.n}</b><span>${sp.d}</span><div class="stats3"><span>THREAD +${Math.round((sp.line - 1) * 100)}%</span><span>PULL +${Math.round((sp.acc - 1) * 100)}%</span><span>SLACK +${Math.round((sp.pay - 1) * 100)}%</span></div></div>`;
      const b = document.createElement('button'); b.className = 'btn sm' + (own ? '' : ' green');
      b.innerHTML = eq ? 'USING' : own ? 'USE' : `<i class="cIco" style="width:14px;height:14px;vertical-align:-2px"></i> ${fmt(sp.cost)}`; b.disabled = eq;
      onTap(b, () => { if(!own){ if(!spend(sp.cost)) return; save.spools.push(sp.id); AU.unlock(); } save.spool = sp.id; persist(); renderPanel(); });
      it.appendChild(b); B.appendChild(it);
    }
    sec('THREAD COLOUR');
    for(const t of THREADS){
      const own = save.threads.includes(t.id), eq = save.thread === t.id;
      const it = document.createElement('div'); it.className = 'item';
      it.innerHTML = `<div class="ii"><i class="sw ${t.c === 'rainbow' ? 'rainbow' : ''}" style="${t.c === 'rainbow' ? '' : 'background:' + t.c}"></i></div><div class="it"><b>${t.n}</b><span>${eq ? 'In use' : own ? 'Owned' : 'Colour only: no stat change'}</span></div>`;
      const b = document.createElement('button'); b.className = 'btn sm' + (own ? '' : ' green');
      b.innerHTML = eq ? 'USING' : own ? 'USE' : `<i class="cIco" style="width:14px;height:14px;vertical-align:-2px"></i> ${fmt(t.cost)}`; b.disabled = eq;
      onTap(b, () => { if(!own){ if(!spend(t.cost)) return; save.threads.push(t.id); } save.thread = t.id; persist(); renderPanel(); });
      it.appendChild(b); B.appendChild(it);
    }
  } else if(panelKind === 'quests'){
    sec('DAILY GIFT');
    const ready = giftReady(), st = save.gift.day === dayNum() - 1 ? save.gift.streak : ready ? 0 : save.gift.streak - 1;
    const amt = GIFT[Math.min(GIFT.length - 1, Math.max(0, st))];
    const g = document.createElement('div'); g.className = 'item';
    g.innerHTML = `<div class="ii">🎁</div><div class="it"><b>${ready ? 'A gift is waiting!' : 'Come back tomorrow'}</b><span>Streak: ${save.gift.streak} day${save.gift.streak === 1 ? '' : 's'} · bigger gifts up to day 7</span></div>`;
    const gb = document.createElement('button'); gb.className = 'btn sm green'; gb.innerHTML = ready ? `+${amt}` : 'DONE'; gb.disabled = !ready;
    onTap(gb, () => { const d = dayNum(); save.gift.streak = save.gift.day === d - 1 ? save.gift.streak + 1 : 1; save.gift.day = d; const a = GIFT[Math.min(GIFT.length - 1, save.gift.streak - 1)]; save.coins += a; AU.unlock(); toast('DAILY GIFT', `+${a} coins`); persist(); renderPanel(); });
    g.appendChild(gb); B.appendChild(g);
    sec("TODAY'S QUESTS");
    for(const q of save.quests.list){
      const def = QUESTS.find(x => x.id === q.id), it = document.createElement('div'); it.className = 'item';
      it.innerHTML = `<div class="ii">${q.claimed ? '✔' : '★'}</div><div class="it"><b>${def.n(q.n)}</b><span>${q.p} / ${q.n}</span><div class="bar"><i style="width:${q.p / q.n * 100}%"></i></div></div>`;
      const b = document.createElement('button'); b.className = 'btn sm' + (q.done && !q.claimed ? ' green' : '');
      b.innerHTML = q.claimed ? 'DONE' : `+${q.coins}`; b.disabled = !q.done || q.claimed;
      onTap(b, () => { q.claimed = true; save.coins += q.coins; AU.coin(); persist(); renderPanel(); });
      it.appendChild(b); B.appendChild(it);
    }
    B.insertAdjacentHTML('beforeend', '<div class="sec" style="opacity:.8;letter-spacing:0;font-weight:700">New quests and a new kite bazaar every day.</div>');
  } else if(panelKind === 'road'){
    ROAD.forEach((r, i) => {
      const it = document.createElement('div'); it.className = 'item';
      const got = i < save.road, can = i === save.road && save.trophies >= r.tr, kd = r.rw.kite && kiteById(r.rw.kite), sd = r.rw.spool && spoolById(r.rw.spool);
      const ii = document.createElement('div'); ii.className = 'ii';
      if(kd) ii.appendChild(kiteIcon(kd, 38)); else if(sd) ii.innerHTML = `<i class="sw" style="width:34px;height:34px;background:conic-gradient(${sd.c[0]} 0 25%, ${sd.c[1]} 0 50%, ${sd.c[0]} 0 75%, ${sd.c[1]} 0)"></i>`; else ii.innerHTML = '<i class="cIco" style="width:30px;height:30px"></i>';
      it.appendChild(ii);
      it.insertAdjacentHTML('beforeend', `<div class="it"><b>🏆 ${r.tr} · ${kd ? kd.n : sd ? sd.n : r.rw.coins + ' coins'}</b><span>${kd ? RARITY[kd.r].n + ' kite' : sd ? 'Spool' : 'Coins'} · ${arenaFor(r.tr).name}</span></div>`);
      const b = document.createElement('button'); b.className = 'btn sm' + (can ? ' green' : '');
      b.textContent = got ? 'CLAIMED' : can ? 'CLAIM' : 'LOCKED'; b.disabled = !can;
      onTap(b, () => { if(kd){ if(!save.kites.includes(kd.id)){ save.kites.push(kd.id); save.newKites.push(kd.id); } } else if(sd){ if(!save.spools.includes(sd.id)) save.spools.push(sd.id); } else save.coins += r.rw.coins; save.road++; AU.unlock(); persist(); renderPanel(); });
      it.appendChild(b); B.appendChild(it);
    });
    B.insertAdjacentHTML('beforeend', `<div class="sec">SKIES</div>`);
    for(const a of ARENAS) B.insertAdjacentHTML('beforeend', `<div class="setRow"><span>${a.name}</span><span>${save.trophies >= a.tr ? '✔' : '🏆 ' + a.tr}</span></div>`);
  } else if(panelKind === 'settings'){
    const tg = (label, key) => { const r = document.createElement('div'); r.className = 'setRow'; r.innerHTML = `<span>${label}</span>`; const s = document.createElement('div'); s.className = 'seg'; for(const [v, t] of [[true, 'ON'], [false, 'OFF']]){ const b = document.createElement('button'); b.textContent = t; b.classList.toggle('on', save.opt[key] === v); onTap(b, () => { save.opt[key] = v; AU.apply(); persist(); renderPanel(); }); s.appendChild(b); } r.appendChild(s); B.appendChild(r); };
    const sg = (label, key, opts) => { const r = document.createElement('div'); r.className = 'setRow'; r.innerHTML = `<span>${label}</span>`; const s = document.createElement('div'); s.className = 'seg'; for(const [v, t] of opts){ const b = document.createElement('button'); b.textContent = t; b.classList.toggle('on', save.opt[key] === v); onTap(b, () => { save.opt[key] = v; persist(); if(key === 'quality') applyQuality(); renderPanel(); }); s.appendChild(b); } r.appendChild(s); B.appendChild(r); };
    tg('Music', 'music'); tg('Sound effects', 'sfx'); tg('Vibration', 'vib');
    sg('Controls', 'ctrl', [['point', 'POINT'], ['classic', 'CLASSIC']]);
    B.insertAdjacentHTML('beforeend', '<div class="sec" style="letter-spacing:0;font-weight:700;opacity:.9">POINT: hold and your kite flies toward your finger. CLASSIC: hold to pull, and the kite darts wherever its nose points, just like a real patang.</div>');
    sg('Graphics', 'quality', [['auto', 'AUTO'], ['low', 'LOW'], ['high', 'HIGH']]);
    { const r = document.createElement('div'); r.className = 'setRow'; r.innerHTML = '<span>Online server</span>'; const inp = document.createElement('input'); inp.className = 'srvIn'; inp.placeholder = serverURL() || 'wss://your-server/ws'; inp.value = save.opt.server; inp.addEventListener('change', () => { save.opt.server = inp.value.trim(); persist(); }); inp.addEventListener('keydown', e => e.stopPropagation()); r.appendChild(inp); B.appendChild(r); }
    const nb = document.createElement('button'); nb.className = 'btn ghost'; nb.textContent = 'CHANGE NAME & LOOK'; onTap(nb, () => { hide('panel'); openName(); }); B.appendChild(nb);
    const tb = document.createElement('button'); tb.className = 'btn ghost'; tb.textContent = 'REPLAY TUTORIAL'; onTap(tb, () => { save.tut = 0; persist(); toast('TUTORIAL', 'Your next match will be the practice duel.'); }); B.appendChild(tb);
    B.insertAdjacentHTML('beforeend', `<div class="sec" style="letter-spacing:0;font-weight:700;opacity:.85;text-align:center">BO KATA · all art and music made in code.<br>Fly safely in real life: never use glass-coated thread, it hurts birds and people.<br>Matches ${save.stats.matches} · Cuts ${save.stats.cuts} · Loots ${save.stats.loots}</div>`);
  }
}

/* ---------------- name ---------------- */
function openName(){
  STATE = 'name'; hide('home'); show('nameScr');
  $('nameIn').value = save.name;
  const S = $('shirts'); S.innerHTML = '';
  SHIRT.forEach((c, i) => { const b = document.createElement('button'); b.style.background = c; b.classList.toggle('on', save.look.shirt === i); onTap(b, () => { save.look.shirt = i; openName(); }); S.appendChild(b); });
}

/* ---------------- match flow ---------------- */
function startMatch(forceOffline){
  const tut = save.tut === 0;
  if(save.opt.online && !tut && !forceOffline){ hide('home'); hide('results'); STATE = 'mm'; netConnect(mode); return; }
  hide('home'); hide('results'); hide('panel'); $('pops').innerHTML = ''; $('feed').innerHTML = '';
  newMatch(tut ? 'duel' : mode);
  if(tut){ M.tut = true; M.tutStep = 0; M.tutT = 0; const o = M.flyers.find(F => !F.me); o.bot.skill = .12; o.name = 'Guddu'; M.me.sharp *= 1.8; o.str = .6; o.kitesLeft = 1; }
  ambienceInit(); camFollow(0, true);
  STATE = 'play'; show('hud'); for(const k in HC) delete HC[k];
  $('ctrlHint').textContent = save.opt.ctrl === 'point' ? 'HOLD: kite flies to your finger · LET GO: it spins' : 'HOLD to pull · LET GO to spin';
  AU.init(); AU.resume(); AU.setLevel(1);
  save.stats.matches++; questEv('play', 1); persist();
  matchAudio();
}
function matchAudio(){ AU.style = M.arena.music || 'desi'; AU.intro(); }
function startNetMatch(){
  hide('home'); hide('results'); hide('panel'); $('pops').innerHTML = ''; $('feed').innerHTML = '';
  ambienceInit(); camFollow(0, true);
  STATE = 'play'; show('hud'); for(const k in HC) delete HC[k];
  $('ctrlHint').textContent = 'ONLINE · ' + (save.opt.ctrl === 'point' ? 'HOLD: kite flies to your finger · LET GO: it spins' : 'HOLD to pull · LET GO to spin');
  AU.init(); AU.resume(); AU.setLevel(1);
  save.stats.matches++; questEv('play', 1); persist();
  matchAudio();
}
function pauseMatch(){ if(STATE !== 'play' || M.over) return; STATE = 'pause'; IN.down = false; show('pause'); $('pause').querySelector('h2').textContent = M.net ? 'ONLINE: THE SKY KEEPS FLYING' : 'PAUSED'; }
function resumeMatch(){ hide('pause'); STATE = 'play'; }

/* ---------------- HUD ---------------- */
const HC = {};
function setH(k, v, f){ if(HC[k] === v) return; HC[k] = v; f(v); }
let feedSeen = '';
function updateHUD(){
  const me = M.me, left = Math.max(0, Math.ceil(M.dur - M.t));
  setH('time', left, v => { $('hTime').textContent = Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0'); $('hTime').classList.toggle('low', v <= 20); });
  const alive = M.flyers.filter(F => !F.out).length;
  setH('alive', alive + (M.mode === 'duel' ? ':' + M.flyers.map(F => F.kitesLeft + (F.kite ? 1 : 0)).join('-') : ''), () => {
    if(M.mode === 'duel'){ const o = M.flyers.find(F => !F.me); $('hAlive').textContent = `${o.name}: ${o.kitesLeft + (o.kite ? 1 : 0)} kite${o.kitesLeft + (o.kite ? 1 : 0) === 1 ? '' : 's'} left`; }
    else $('hAlive').textContent = alive + ' flyers left';
  });
  const kl = me.kitesLeft + (me.kite ? 1 : 0);
  setH('kites', kl, v => { let h = ''; for(let i = 0; i < 3; i++) h += `<i class="${i < v ? '' : 'off'}"></i>`; $('hKites').innerHTML = h; });
  setH('cuts', me.cuts, v => $('hCuts').lastElementChild.textContent = v);
  setH('count', M.countdown > 0 ? Math.ceil(M.countdown) : 0, v => { $('count').classList.toggle('hidden', !v); $('count').textContent = v > 3 ? '' : v; if(v > 0 && v <= 3 && !M.net) AU.count(v); });
  // respawn / out
  const rs = !me.kite && !M.over && M.countdown <= 0 ? (me.kitesLeft > 0 ? 'NEXT KITE IN ' + Math.max(1, Math.ceil(me.respawnT)) + '…' : 'OUT OF KITES') : '';
  setH('resp', rs, v => { $('respawn').classList.toggle('hidden', !v); $('respawn').textContent = v; });
  // pench meter
  const p = myPench();
  if(p){
    const mine = p.a.me ? p.wb : p.wa, theirs = p.a.me ? p.wa : p.wb, R = p.a.me ? p.b : p.a;
    setH('pOn', 1, () => { show('pench'); $('pThem').textContent = R.name.toUpperCase(); });
    $('pMine').style.width = clamp(mine / 2, 0, 50) + '%'; $('pTheirs').style.width = clamp(theirs / 2, 0, 50) + '%';
    const hint = !me.kite ? '' : !me.kite.pull ? 'PULL! A SLACK THREAD LOSES' : R.kite && me.kite.y < R.kite.y - 25 ? 'ABOVE THEM: +30% CUT!' : 'KEEP FLYING FAST!';
    setH('pHint', hint, v => $('pHint').textContent = v);
  } else setH('pOn', 0, () => hide('pench'));
  // feed
  const fk = M.feed.map(f => f.txt).slice(-4).join('|');
  if(fk !== feedSeen){ feedSeen = fk; $('feed').innerHTML = M.feed.slice(-4).map(f => `<div>${f.txt}</div>`).join(''); }
  // pops
  for(const q of M.pops){
    if(q.shown) continue; q.shown = true;
    const d = document.createElement('div');
    if(q.k === 'bokata'){ d.className = 'pop bk'; d.innerHTML = `BO KATA!<small>✂ ${me.cuts} CUT${me.cuts === 1 ? '' : 'S'}</small>`; }
    else if(q.k === 'lost'){ d.className = 'pop lost'; d.innerHTML = `CUT!<small>${q.by} cut your kite</small>`; }
    else { d.className = 'pop loot'; d.innerHTML = `LOOTED! ${q.def.n}`; }
    $('pops').appendChild(d); setTimeout(() => d.remove(), 1600);
  }
  tutorial();
}

/* ---------------- first-flight tutorial ---------------- */
let tipTxt = '';
function tip(t){ if(t === tipTxt) return; tipTxt = t; const e = $('tip'); if(!t){ hide('tip'); return; } e.innerHTML = t; show('tip'); e.style.animation = 'none'; void e.offsetWidth; e.style.animation = ''; }
function tutorial(){
  if(!M.tut){ tip(''); return; }
  const k = M.me.kite, dt = 1 / 60;
  if(M.countdown > 0 || !k || k.launch > 0){ if(M.tutStep === 0) tip(''); return; }
  M.tutT += dt;
  const P = save.opt.ctrl === 'point';
  if(M.tutStep === 0){ tip(P ? '<em>HOLD</em> anywhere: your kite flies toward your finger.' : '<em>HOLD</em> to pull: the kite darts where its nose points.'); if(k.pull) M.pulled = (M.pulled || 0) + dt; if(M.pulled > 1.6){ M.tutStep = 1; M.tutT = 0; } }
  else if(M.tutStep === 1){ tip('Now <em>LET GO</em>: the kite spins and drifts on the wind. Pull again when it points where you want!'); if(!k.pull) M.slacked = (M.slacked || 0) + dt; if(M.slacked > 1.2){ M.tutStep = 2; M.tutT = 0; } }
  else if(M.tutStep === 2){ tip(`Fly across <em>${M.flyers.find(F => !F.me).name}'s thread</em> and keep moving fast. Come from above!`); if(myPench()){ M.tutStep = 3; } }
  else if(M.tutStep === 3){ tip('<em>PENCH!</em> Threads are rubbing. The faster thread cuts: keep pulling!'); if(M.me.cuts > 0){ M.tutStep = 4; M.tutT = 0; } else if(!myPench() && M.tutT > 2){ M.tutStep = 2; M.tutT = 0; } }
  else if(M.tutStep === 4){ tip('<em>BO KATA!</em> Cut their last kite to win. Loot falling kites to collect them!'); if(M.tutT > 4){ M.tutStep = 5; } }
  else tip('');
}

/* ---------------- results ---------------- */
const TRO_BATTLE = [30, 22, 16, 9, 5, 0, -3, -6, -9, -12, -14, -16];
const COIN_BATTLE = [90, 65, 50, 35, 25, 18, 12, 10, 8, 6, 4, 2];
function showResults(){
  if(STATE === 'home') return;
  STATE = 'results'; IN.down = false; tip('');
  const me = M.me, place = me.place, duel = M.mode === 'duel', won = duel ? place === 1 : place <= 3;
  let tro, coins;
  if(duel){ tro = M.tut ? 20 : won ? 28 : -14; coins = (won ? 70 : 20) + me.cuts * 15 + me.loots * 20; save.stats.duels++; if(won){ save.stats.duelWins++; questEv('duel', 1); } }
  else { tro = TRO_BATTLE[place - 1]; coins = COIN_BATTLE[place - 1] + me.cuts * 15 + me.loots * 20; if(won){ save.stats.wins++; questEv('win', 1); } }
  // you never drop out of a sky you have reached
  const floor = arenaFor(save.trophies).tr;
  const t0 = save.trophies; save.trophies = Math.max(floor, save.trophies + tro); tro = save.trophies - t0;
  save.best = Math.max(save.best, save.trophies);
  save.coins += coins;
  if(M.tut) save.tut = 1;
  // looted kites may join the collection
  const nk = [];
  for(const id of (M.lootKites || [])){ const d = kiteById(id); if(!save.kites.includes(id) && !nk.includes(id) && Math.random() < [.6, .35, .18, .08][d.r]){ nk.push(id); save.kites.push(id); save.newKites.push(id); } }
  const arenaUp = arenaFor(save.trophies).id !== arenaFor(t0).id;
  persist(); writeSave();
  $('rPlace').textContent = duel ? (won ? 'WIN!' : 'LOSS') : '#' + place;
  $('rTitle').textContent = duel ? (won ? 'The sky is yours!' : 'So close. One more?') : place === 1 ? 'SKY CHAMPION!' : place <= 3 ? 'Top 3! Brilliant flying!' : place <= 6 ? 'Good flying!' : 'Keep practising!';
  $('rCuts').textContent = me.cuts; $('rLoots').textContent = me.loots; $('rTro').textContent = (tro >= 0 ? '+' : '') + tro;
  $('rCoins').lastElementChild.textContent = '+' + coins;
  const R = $('rNew'); R.innerHTML = '';
  if(nk.length){ R.insertAdjacentHTML('beforeend', '<div class="sec" style="width:100%;color:#e2502b">NEW KITES FOR YOUR COLLECTION!</div>'); for(const id of nk) R.appendChild(kiteCard(kiteById(id), {})); }
  if(arenaUp) R.insertAdjacentHTML('beforeend', `<div class="sec" style="width:100%;color:#16b3a3">NEW SKY UNLOCKED: ${arenaFor(save.trophies).name.toUpperCase()}!</div>`);
  hide('hud'); show('results');
  if(won){ AU.win(); vib([40, 60, 40]); } else AU.lose();
  if(nk.length || arenaUp) setTimeout(() => AU.unlock(), 700);
  AU.setLevel(0);
}

/* ---------------- quality ---------------- */
function applyQuality(){ V.q = save.opt.quality === 'auto' ? (V.autoQ || 'high') : save.opt.quality; resize(); }

/* ---------------- wiring ---------------- */
function toWorld(){ IN.wx = V.x + (IN.sx - V.W / 2) / V.z; IN.wy = V.y + (IN.sy - V.H / 2) / V.z; }
function wire(){
  onTap('playBtn', () => startMatch());
  document.querySelectorAll('.mode').forEach(b => onTap(b, () => { mode = b.dataset.mode; refreshHome(); }));
  document.querySelectorAll('#nav button').forEach(b => onTap(b, () => openPanel(b.dataset.p)));
  onTap('roadBtn', () => openPanel('road'));
  onTap('profBtn', () => openName());
  onTap('pBack', closePanel);
  onTap('pauseBtn', pauseMatch);
  onTap('resumeBtn', resumeMatch);
  onTap('quitBtn', () => { hide('pause'); if(M.net){ netSend({ t:'leave' }); netClose(); M.over = true; M.order = M.flyers.slice().sort((a, b) => a.me - b.me); M.me.place = M.flyers.length; STATE = 'play'; showResults(); return; } M.me.out = true; M.me.kite = null; M.me.kitesLeft = 0; STATE = 'play'; endMatch(); });
  onTap('againBtn', () => startMatch());
  onTap('onlineBtn', () => { save.opt.online = !save.opt.online; persist(); refreshHome(); });
  onTap('mmCancel', () => { netClose(); mmHide(); goHome(); });
  onTap('homeBtn', goHome);
  onTap('nameGo', () => { const v = $('nameIn').value.trim().replace(/[<>&"]/g, '').slice(0, 12); save.name = v || 'Kite Kid'; persist(); hide('nameScr'); goHome(); });
  $('nameIn').addEventListener('keydown', e => { e.stopPropagation(); if(e.key === 'Enter') $('nameGo').click(); });
  // one thumb: hold to pull
  let pid = null;
  cv.addEventListener('pointerdown', e => {
    AU.init(); AU.resume();
    if(STATE !== 'play' || pid !== null) return;
    e.preventDefault(); pid = e.pointerId; try{ cv.setPointerCapture(pid); }catch(_){}
    IN.down = true; IN.sx = e.clientX; IN.sy = e.clientY; toWorld();
  });
  addEventListener('pointermove', e => { if(e.pointerId === pid || (pid === null && e.pointerType === 'mouse')){ IN.sx = e.clientX; IN.sy = e.clientY; } }, { passive:true });
  const up = e => { if(e.pointerId !== pid) return; pid = null; IN.down = false; };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  addEventListener('keydown', e => {
    AU.init(); AU.resume();
    if(e.key === ' ' && STATE === 'play'){ e.preventDefault(); IN.down = true; }
    if(e.key === 'Escape'){ if(STATE === 'play') pauseMatch(); else if(STATE === 'pause') resumeMatch(); else if(!isHidden('panel')) closePanel(); }
    if(e.key === 'Enter' && STATE === 'home' && isHidden('panel')) startMatch();
  });
  addEventListener('keyup', e => { if(e.key === ' ') IN.down = false; });
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 250));
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ writeSave(); if(STATE === 'play') pauseMatch(); } else AU.resume(); });
  addEventListener('pagehide', writeSave);
  // Android hardware back (Capacitor / Cordova)
  document.addEventListener('backbutton', e => { e.preventDefault(); if(STATE === 'play') pauseMatch(); else if(STATE === 'pause') resumeMatch(); else if(!isHidden('panel')) closePanel(); else if(STATE === 'results') goHome(); });
}

/* ---------------- loop ---------------- */
let last = 0, pfT = 0, pfN = 0, pfS = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > .05) dt = .05;
  if(save.opt.quality === 'auto' && STATE === 'play'){
    pfS += dt; pfN++; pfT += dt;
    if(pfT > 3){ const avg = pfS / pfN; pfT = pfS = pfN = 0; if(avg > 1 / 40 && V.q !== 'low'){ V.autoQ = 'low'; V.q = 'low'; resize(); } }
  }
  try{
    if(M){
      if(M.net){ if(STATE === 'play') toWorld(); stepNet(dt); stepAmbience(dt); camFollow(dt); }
      else if(STATE !== 'pause'){ if(STATE === 'play') toWorld(); stepMatch(dt); stepAmbience(dt); camFollow(dt); }
      const inMatch = (STATE === 'play' || STATE === 'pause') && M.mode !== 'menu' && !M.over && M.countdown <= 0, k = M.me && M.me.kite;
      AU.amb({ on:inMatch, menu:STATE === 'home', wind:Math.min(1, Math.abs(M.wind.x) / 60), speed:k ? Math.min(1, Math.hypot(k.vx, k.vy) / 440) : 0, pull:k && k.pull, hum:k ? ({ wau:1, layang:.55, pipa:.45, rokkaku:.4 }[M.me.def.shape] || .3) : 0, crowd:M.pench.size ? 1 : 0 });
      if(M.over && !M.endHorn && M.mode !== 'menu'){ M.endHorn = true; AU.endHorn(M.me && M.me.place <= (M.mode === 'duel' ? 1 : 3)); }
      render(ts / 1000);
      if(STATE === 'play') updateHUD();
      if(STATE === 'play' && M.mode !== 'menu') AU.setLevel(M.dur - M.t < 30 || myPench() ? 2 : 1);
    }
  }catch(err){ console.error(err); }
}
addEventListener('error', e => { try{ console.error(e.error || e.message); }catch(_){} });

(function boot(){
  loadSave();
  applyQuality();
  wire();
  rollDaily();
  newMatch('menu'); ambienceInit(); camFollow(0, true);
  requestAnimationFrame(frame);
  if(!save.name) openName(); else goHome();
  setTimeout(() => { $('boot').classList.add('gone'); setTimeout(() => $('boot').remove(), 500); }, 600);
})();
