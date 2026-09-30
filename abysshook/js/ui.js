'use strict';
/* =====================================================================
   ABYSS HOOK UI: HUD, flow, tally, reward pop-ups, shop, Fishdex,
   quests, daily rewards, offline aquarium earnings, input, boot.
   ===================================================================== */
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
const SCREENS = ['dex', 'shop', 'quests', 'pause', 'settings'];
function onTap(el, fn){ el = typeof el === 'string' ? $(el) : el; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }
function showToast(head, txt){ const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<b>${head}</b><span>${txt}</span>`; $('toasts').appendChild(t); while($('toasts').children.length > 3) $('toasts').firstChild.remove(); setTimeout(() => t.remove(), 3100); }
let hintT = 0;
function showHint(txt){ const h = $('hint'); h.innerHTML = txt; show('hint'); h.style.animation = 'none'; void h.offsetWidth; h.style.animation = ''; clearTimeout(hintT); hintT = setTimeout(() => hide('hint'), 3300); }
function showZone(z){ const b = $('zoneBanner'); b.innerHTML = `<small>ENTERING</small>${ZONES[z].name}`; show('zoneBanner'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; setTimeout(() => hide('zoneBanner'), 2700); if(z > 0 && !save.stats['zone' + z]){ save.stats['zone' + z] = 1; b.innerHTML = `<small>NEW ZONE DISCOVERED!</small>${ZONES[z].name}`; AU.discover(); } }
function fishCanvas(sp, shiny, w, h, dark){
  const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d'), S = fishSprite(sp, shiny);
  const sc = Math.min(c.width * .92 / S.c.width, c.height * .92 / S.c.height);
  g.drawImage(S.c, (c.width - S.c.width * sc) / 2, (c.height - S.c.height * sc) / 2, S.c.width * sc, S.c.height * sc);
  if(dark){ g.globalCompositeOperation = 'source-in'; g.fillStyle = '#061a3a'; g.fillRect(0, 0, c.width, c.height); }
  return c;
}

/* ---------------- HUD ---------------- */
const hc = {};
function setH(k, v, fn){ if(hc[k] === v) return; hc[k] = v; fn(v); }
function updateHUD(){
  if(!['down', 'up', 'reel', 'air'].includes(G.state)) return;
  setH('d', Math.round(G.depth), v => $('depth').textContent = fmt(v) + ' m');
  setH('z', G.zone, z => $('zoneTxt').textContent = ZONES[z].name);
  setH('lb', Math.round(G.depth / G.maxD * 100), v => $('lineBar').firstElementChild.style.width = v + '%');
  setH('c', G.caught.length + '/' + G.cap, () => { const e = $('catchTxt'); e.textContent = '🐟 ' + G.caught.length + ' / ' + G.cap; e.classList.toggle('full', G.caught.length >= G.cap); });
  setH('f', G.frenzyT > 0, v => $('frenzy').classList.toggle('hidden', !v));
  setH('sh', G.state === 'down' ? G.shield : -1, v => $('shieldTxt').textContent = v > 0 ? '🛡'.repeat(Math.min(v, 6)) : '');
  setH('co', save.coins, v => $('coins').textContent = fmt(v));
}

/* ---------------- flow ---------------- */
let playing = false;
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }
function toTitle(){
  SCREENS.forEach(hide); hide('tally'); hide('hud'); hide('reel'); endPlay();
  G.state = 'title'; G.caught = []; G.air = []; G.depth = 0; G.fish = []; G.jelly = []; G.items = []; G.zone = 0; AU.setZone(0);
  // a few fish swim below the boat on the title screen
  G.S = diveStats(); G.genD = 2; generate(18);
  $('title').classList.remove('hidden', 'gone');
  refreshTitle();
}
function refreshTitle(){
  $('tCoins').textContent = fmt(save.coins); $('tGems').textContent = fmt(save.gems);
  $('tLvl').textContent = 'LV ' + save.lvl + ' · ' + rodById(save.rod).name;
  const b = save.equip && save.bait[save.equip] > 0 ? BAITS.find(x => x.id === save.equip) : null;
  $('baitChip').textContent = b ? `${b.icon} ${b.name} ×${save.bait[b.id]}` : '🪱 Choose bait (' + BAITS.reduce((a, x) => a + (save.bait[x.id] || 0), 0) + ')';
  $('baitChip').classList.toggle('on', !!b);
  const found = speciesFound();
  $('tInfo').innerHTML = save.stats.dives ? `Deepest ${fmt(save.stats.deepest)} m · Line ${fmt(lineDepth(save.up.line))} m · ${found}/${SPECIES.length} species<br>Aquarium earns ${fmt(aquariumRate())} coins / min` : 'Steer with your finger or mouse';
  $('qBadge').classList.toggle('hidden', !save.quests.some(q => q.done && !q.claimed));
}
function cast(){
  SCREENS.forEach(hide); hide('tally'); hide('pop');
  $('title').classList.add('gone'); setTimeout(() => $('title').classList.add('hidden'), 350);
  for(const k in hc) delete hc[k];
  startDive(); show('hud'); beginPlay(); AU.setZone(0);
  if(save.tut < 1) setTimeout(() => showHint('DODGE THE FISH ON THE WAY <b style="color:#ffd23a">DOWN</b>!'), 300);
  else if(save.tut < 2) setTimeout(() => showHint('Longer dives = deeper, rarer fish'), 300);
}
function pauseGame(){ if(!['down', 'up'].includes(G.state)) return; G.prev = G.state; G.state = 'pause'; endPlay(); SCREENS.forEach(hide); show('pause'); }
function resumeGame(){ SCREENS.forEach(hide); if(G.state === 'pause'){ G.state = G.prev; beginPlay(); } }
let upHintShown = false;
function phaseHints(){
  if(save.tut >= 1) return;
  if(G.state === 'up' && !upHintShown){ upHintShown = true; showHint('NOW GRAB EVERY FISH ON THE WAY <b style="color:#ffd23a">UP</b>!'); }
  if(G.state === 'air' && upHintShown !== 2){ upHintShown = 2; showHint('TAP THE FLYING FISH FOR <b style="color:#ffd23a">DOUBLE</b> COINS!'); }
}

/* ---------------- reel ---------------- */
function showReel(sp){ $('reelName').textContent = sp.name.toUpperCase() + ' IS FIGHTING BACK!'; show('reel'); updateReel(); }
function updateReel(){ if(!G.reel) return; $('reelBar').firstElementChild.style.width = G.reel.p * 100 + '%'; $('reelTime').textContent = Math.max(0, G.reel.t).toFixed(1) + 's'; }
function hideReel(){ hide('reel'); }

/* ---------------- tally ---------------- */
function showTally(){
  endPlay(); hide('hud'); hide('hint');
  const r = G.result; if(!r) return;
  if(save.tut < 2){ save.tut++; }
  $('tTitle').textContent = r.lines.some(l => l.sp.r === 'L') ? 'LEGENDARY CATCH!' : r.lines.length >= G.cap ? 'FULL HAUL!' : r.lines.length ? 'NICE CATCH!' : 'EMPTY HOOK...';
  $('tDepth').textContent = `Reached ${fmt(r.deepest)} m of ${fmt(r.maxD)} m · ${r.lines.length} fish` + (r.bait ? ' · ' + BAITS.find(b => b.id === r.bait).name : '');
  const F = $('tFish'); F.innerHTML = '';
  const lines = r.lines.slice().sort((a, b) => b.v - a.v);
  lines.slice(0, 24).forEach((l, i) => {
    const d = document.createElement('div'); d.className = 'fc'; d.style.animationDelay = (i * .04) + 's'; d.style.borderColor = RAR[l.sp.r].col;
    d.appendChild(fishCanvas(l.sp, l.shiny, 64, 40));
    d.insertAdjacentHTML('beforeend', `<b>${l.sp.name}</b><span>${fmt(l.v)}${l.snapped ? ' ✦' : ''}</span>${l.isNew ? '<i class="tg">NEW</i>' : ''}${l.shiny ? '<i class="tg sh">SHINY</i>' : ''}`);
    F.appendChild(d);
  });
  if(lines.length > 24) F.insertAdjacentHTML('beforeend', `<div class="fc"><b>+${lines.length - 24} more</b></div>`);
  if(!lines.length) F.innerHTML = '<div class="hint2">Dodge on the way down so the line goes deeper!</div>';
  // count the coins up
  const el = $('tCoinsWon'), t0 = performance.now(), C = r.coins;
  const tick = () => { const k = Math.min(1, (performance.now() - t0) / 1000); el.textContent = '+' + fmt(Math.round(C * (1 - Math.pow(1 - k, 3)))); if(k < 1){ AU.coin(); requestAnimationFrame(tick); } };
  tick();
  $('xpLvl').textContent = 'LV ' + save.lvl; $('xpTxt').textContent = fmt(save.xp) + ' / ' + fmt(xpNeed(save.lvl)) + ' XP';
  $('xpBar').firstElementChild.style.width = '0%'; setTimeout(() => $('xpBar').firstElementChild.style.width = (save.xp / xpNeed(save.lvl) * 100) + '%', 100);
  $('tQuests').innerHTML = save.quests.map(q => `<div class="qm${q.done ? ' done' : ''}">${q.done ? '✓' : '○'} <span style="flex:1">${QTYPES[q.k].t(q.n, q.z)}</span><i><b style="width:${Math.min(100, q.p / q.n * 100)}%"></b></i></div>`).join('');
  buildUpRow();
  show('tally'); G.state = 'tally';
  // queue the rewards: level ups, new species, chests, achievements
  const Q = [];
  for(const u of r.lvlUps) Q.push({ tag:'LEVEL UP!', art:'⭐', title:'LEVEL ' + u.lvl, text:`+<b>${u.gems} gems</b>` + (u.rods.length ? `<br>New rod available: <b>${u.rods.map(x => x.name).join(', ')}</b>` : ''), snd:'level' });
  for(const sp of r.newSpecies) Q.push({ tag:'NEW SPECIES!', fish:sp, title:sp.name, text:`<span style="color:${RAR[sp.r].col}">${RAR[sp.r].name}</span> · ${ZONES[sp.z].name}<br>Now earns coins in your aquarium`, snd:'discover', rarity:sp.r });
  for(const t of r.chests) Q.push({ chest:t });
  for(const a of r.achNew) Q.push({ tag:'ACHIEVEMENT!', art:'🏆', title:a.a.name + ' ' + ['I', 'II', 'III', 'IV', 'V'][a.tier], text:a.a.t(a.a.tiers[a.tier]) + `<br>+<b>${achReward(a.tier)} gems</b>`, snd:'claim' });
  if(r.escaped) Q.unshift({ tag:'SO CLOSE!', fish:r.escaped.sp, title:r.escaped.sp.name + ' escaped', text:'Tap faster next time to reel in a legendary!', snd:'escape' });
  for(const z of [...new Set(r.lines.map(l => l.sp.z))]) if(zoneMastered(z) && !save.stats['mast' + z]){ save.stats['mast' + z] = 1; Q.push({ tag:'ZONE MASTERED!', art:'👑', title:ZONES[z].name, text:'Every species found!<br>All fish now worth <b>+10%</b> forever', snd:'level' }); }
  popQueue = Q; setTimeout(nextPop, 900);
  persist();
}
let popQueue = [];
function nextPop(){
  const p = popQueue.shift(); if(!p){ hide('pop'); return; }
  const art = $('popArt'); art.innerHTML = ''; art.classList.remove('shake');
  if(p.chest !== undefined){
    const names = ['Treasure Chest', 'Silver Chest', 'Golden Chest'], icons = ['🧰', '🪙', '👑'];
    $('popTag').textContent = 'TAP TO OPEN'; art.textContent = icons[p.chest]; art.classList.add('shake'); $('popTitle').textContent = names[p.chest]; $('popText').textContent = 'Found on the ocean floor...'; $('popOk').textContent = 'OPEN!';
    AU.chest();
    popAct = () => { const rw = chestReward(p.chest); grant(rw); save.stats.chests++; for(const q of save.quests){ if(!q.done && q.k === 'chest'){ q.p++; if(q.p >= q.n) q.done = true; } } AU.open(); art.classList.remove('shake');
      art.textContent = rw.t === 'coins' ? '💰' : rw.t === 'gems' ? '💎' : BAITS.find(b => b.id === rw.id).icon;
      $('popTag').textContent = 'YOU GOT'; $('popTitle').textContent = rw.t === 'bait' ? rw.n + '× ' + BAITS.find(b => b.id === rw.id).name : '+' + fmt(rw.n) + (rw.t === 'coins' ? ' coins' : ' gems'); $('popText').textContent = ''; $('popOk').textContent = 'NICE!'; popAct = nextPop; refreshAfter(); };
  } else {
    $('popTag').textContent = p.tag;
    if(p.fish){ art.appendChild(fishCanvas(p.fish, false, 220, 130)); $('popTag').style.color = RAR[p.fish.r].col; } else { art.textContent = p.art; $('popTag').style.color = ''; }
    $('popTitle').textContent = p.title; $('popText').innerHTML = p.text; $('popOk').textContent = 'NICE!';
    if(p.snd) AU[p.snd]();
    popAct = nextPop;
  }
  show('pop');
}
let popAct = nextPop;
function refreshAfter(){ if(G.state === 'tally') buildUpRow(); if(G.state === 'title') refreshTitle(); }
function buildUpRow(){
  const row = $('upRow'); row.innerHTML = '';
  const list = UPG.map(u => ({ u, l:save.up[u.id] })).sort((a, b) => (a.l >= a.u.max) - (b.l >= b.u.max) || upCost(a.u, a.l) - upCost(b.u, b.l));
  for(const { u, l } of list){
    const max = l >= u.max, c = upCost(u, l), can = !max && save.coins >= c;
    const d = document.createElement('div'); d.className = 'up' + (can ? ' can' : '') + (max ? ' max' : '');
    d.innerHTML = `<div class="ic">${u.icon}</div><b>${u.name}</b><span>${u.eff(l)}</span><div class="c">${max ? 'MAX' : '🪙 ' + fmt(c)}</div>`;
    d.addEventListener('click', e => { e.stopPropagation(); AU.init(); if(!can){ AU.deny(); return; } save.coins -= c; save.up[u.id]++; AU.buy(); showToast('UPGRADED!', u.name + ': ' + u.eff(l + 1)); persist(); buildUpRow(); });
    row.appendChild(d);
  }
}

/* ---------------- shop ---------------- */
let shopTab = 'up';
function openShop(){
  SCREENS.forEach(hide); show('shop');
  $('sCoins').textContent = fmt(save.coins); $('sGems').textContent = fmt(save.gems);
  document.querySelectorAll('#shop .tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === shopTab));
  const L = $('shopList'); L.innerHTML = '';
  const row = (ic, title, sub, btn, fn, extra, sel) => { const d = document.createElement('div'); d.className = 'item' + (sel ? ' sel' : ''); if(typeof ic === 'string') d.insertAdjacentHTML('beforeend', `<div class="ic">${ic}</div>`); else d.appendChild(ic); d.insertAdjacentHTML('beforeend', `<div class="it"><b>${title}</b><span>${sub}</span>${extra || ''}</div>`); const b = document.createElement('button'); b.className = 'btn ' + btn.cls; b.textContent = btn.txt; b.disabled = !!btn.dis; onTap(b, fn); d.appendChild(b); L.appendChild(d); };
  if(shopTab === 'up'){
    for(const u of UPG){ const l = save.up[u.id], max = l >= u.max, c = upCost(u, l);
      row(u.icon, u.name, u.eff(l) + (max ? '' : ' → ' + u.eff(l + 1)), { cls:'primary', txt:max ? 'MAX' : '🪙 ' + fmt(c), dis:max || save.coins < c }, () => { if(save.coins < c || max) return AU.deny(); save.coins -= c; save.up[u.id]++; AU.buy(); persist(); openShop(); }, `<div class="pips">${Array.from({ length:u.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div>`); }
  } else if(shopTab === 'rods'){
    for(const r of RODS){ const own = save.rods[r.id], sel = save.rod === r.id, locked = save.lvl < r.lvl;
      const perks = [r.val > 1 ? `value x${r.val}` : '', r.cap ? `+${r.cap} hooks` : '', r.luck ? `+${Math.round(r.luck * 100)}% luck` : '', r.mag ? `+${r.mag} m lure` : '', r.shield ? `+${r.shield} bumps` : ''].filter(Boolean).join(' · ');
      const ic = document.createElement('canvas'); ic.width = 160; ic.height = 68; const g = ic.getContext('2d'); g.strokeStyle = r.col; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(14, 58); g.lineTo(146, 10); g.stroke(); g.fillStyle = '#333'; g.beginPath(); g.arc(40, 48, 9, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(146, 10); g.lineTo(150, 60); g.stroke();
      row(ic, r.name, r.desc + (perks ? '<br>' + perks : ''), sel ? { cls:'', txt:'EQUIPPED', dis:true } : own ? { cls:'aqua', txt:'EQUIP' } : locked ? { cls:'', txt:'🔒 LV ' + r.lvl, dis:true } : { cls:'primary', txt:'🪙 ' + fmt(r.cost), dis:save.coins < r.cost }, () => { if(own){ save.rod = r.id; } else { if(save.coins < r.cost) return AU.deny(); save.coins -= r.cost; save.rods[r.id] = 1; save.rod = r.id; showToast('NEW ROD!', r.name); } AU.buy(); persist(); openShop(); }, '', sel);
    }
  } else {
    for(const b of BAITS){ const n = save.bait[b.id] || 0, eq = save.equip === b.id;
      row(b.icon, b.name + (n ? ' ×' + n : ''), b.desc, { cls:'primary', txt:'💎 ' + b.cost, dis:save.gems < b.cost }, () => { if(save.gems < b.cost) return AU.deny(); save.gems -= b.cost; save.bait[b.id] = n + 1; if(!save.equip) save.equip = b.id; AU.buy(); persist(); openShop(); }, n ? `<button class="chip" data-eq="${b.id}" style="margin-top:6px">${eq ? '✓ EQUIPPED' : 'USE NEXT DIVE'}</button>` : '', eq);
    }
    L.querySelectorAll('[data-eq]').forEach(c => onTap(c, () => { save.equip = save.equip === c.dataset.eq ? '' : c.dataset.eq; persist(); openShop(); }));
  }
}

/* ---------------- Fishdex ---------------- */
let dexZone = 0;
function openDex(){
  SCREENS.forEach(hide); show('dex');
  $('dexN').textContent = speciesFound() + ' / ' + SPECIES.length;
  $('aqua').innerHTML = `🐠 Your aquarium earns <b>${fmt(aquariumRate())} coins / min</b>, even while you're away · Mastery bonus <b>x${masteryMul().toFixed(1)}</b>`;
  const T = $('dexTabs'); T.innerHTML = '';
  ZONES.forEach((Z, z) => { const b = document.createElement('button'); b.textContent = Z.name; b.className = (z === dexZone ? 'on' : '') + (zoneMastered(z) ? ' mast' : ''); onTap(b, () => { dexZone = z; openDex(); }); T.appendChild(b); });
  const list = SPECIES.filter(s => s.z === dexZone), found = zoneSpecies(dexZone).filter(s => save.dex[s.id]).length;
  $('dexZone').innerHTML = `${ZONES[dexZone].name} · from ${ZONES[dexZone].top} m · ${found}/8 found` + (zoneMastered(dexZone) ? ' · <b>MASTERED ★ +10% value</b>' : ' · find all 8 to master it');
  const Gd = $('dexGrid'); Gd.innerHTML = '';
  for(const s of list){ const d = save.dex[s.id], el = document.createElement('div'); el.className = 'dx'; el.style.borderColor = d ? RAR[s.r].col : 'transparent';
    el.appendChild(fishCanvas(s, d && d.shiny > 0, 90, 52, !d));
    el.insertAdjacentHTML('beforeend', `<b>${d ? s.name : '???'}</b><span style="color:${RAR[s.r].col}">${RAR[s.r].name}</span><span>${d ? '×' + fmt(d.n) + ' · 🪙' + fmt(s.val) : s.r === 'L' ? 'Lurks deep in this zone' : '&nbsp;'}</span>${d && d.shiny ? `<span class="sh">✦ ${d.shiny} shiny</span>` : ''}`);
    Gd.appendChild(el); }
}

/* ---------------- quests and achievements ---------------- */
function openQuests(){
  SCREENS.forEach(hide); show('quests');
  for(const g of checkAch()){ showToast('ACHIEVEMENT! +' + achReward(g.tier) + ' 💎', g.a.name + ' ' + ['I', 'II', 'III', 'IV', 'V'][g.tier]); AU.claim(); persist(); }
  const L = $('qList'); L.innerHTML = '';
  for(const q of save.quests){
    const d = document.createElement('div'); d.className = 'item' + (q.done ? ' done' : '');
    d.innerHTML = `<div class="ic">🎯</div><div class="it"><b>${QTYPES[q.k].t(q.n, q.z)}</b><span>${fmt(Math.min(q.p, q.n))} / ${fmt(q.n)}</span><div class="bar"><i style="width:${Math.min(100, q.p / q.n * 100)}%"></i></div></div>`;
    const b = document.createElement('button'); b.className = 'btn ' + (q.done ? 'primary' : ''); b.textContent = q.done ? 'CLAIM 💎' + QTYPES[q.k].gems : '💎 ' + QTYPES[q.k].gems; b.disabled = !q.done;
    onTap(b, () => { if(!q.done) return; q.claimed = true; save.gems += QTYPES[q.k].gems; AU.claim(); showToast('QUEST COMPLETE!', '+' + QTYPES[q.k].gems + ' gems'); fillQuests(); persist(); openQuests(); });
    d.appendChild(b); L.appendChild(d);
  }
  const A = $('aList'); A.innerHTML = '';
  const statOf = s => s === 'species' ? speciesFound() : s === 'lvl' ? save.lvl : save.stats[s] || 0;
  for(const a of ACH){ const t = save.ach[a.id] || 0, next = a.tiers[t], v = statOf(a.stat);
    A.insertAdjacentHTML('beforeend', `<div class="item${next === undefined ? ' done' : ''}"><div class="ic">🏆</div><div class="it"><b>${a.name} <span class="stars" style="display:inline">${'★'.repeat(t)}<i>${'★'.repeat(a.tiers.length - t)}</i></span></b><span>${next === undefined ? 'Complete!' : a.t(next) + ' · ' + fmt(Math.min(v, next)) + ' / ' + fmt(next) + ' · 💎' + achReward(t)}</span>${next === undefined ? '' : `<div class="bar"><i style="width:${Math.min(100, v / next * 100)}%"></i></div>`}</div></div>`); }
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
  else if(G.state === 'tally'){ show('tally'); buildUpRow(); }
  else if(G.state === 'title') refreshTitle();
}
function cycleBait(){
  const owned = BAITS.filter(b => save.bait[b.id] > 0);
  if(!owned.length){ shopTab = 'bait'; openShop(); return; }
  const i = owned.findIndex(b => b.id === save.equip);
  save.equip = i < 0 ? owned[0].id : i + 1 < owned.length ? owned[i + 1].id : '';
  persist(); refreshTitle();
}

/* ---------------- daily reward and welcome back ---------------- */
function bootRewards(){
  const Q = [];
  // offline aquarium income
  if(save.lastSeen && aquariumRate() > 0){
    const mins = Math.min(480, (Date.now() - save.lastSeen) / 60000);
    const earned = Math.round(aquariumRate() * mins);
    if(mins >= 2 && earned > 0){ save.coins += earned; Q.push({ tag:'WELCOME BACK!', art:'🐠', title:'+' + fmt(earned) + ' coins', text:`Your aquarium kept earning for <b>${mins >= 60 ? (mins / 60).toFixed(1) + ' hours' : Math.round(mins) + ' minutes'}</b>.<br>Catch new species to earn more!`, snd:'claim' }); }
  }
  // daily streak
  const t = today();
  if(save.daily.last !== t){
    save.daily.streak = save.daily.last === yesterday() ? save.daily.streak % 7 + 1 : 1;
    save.daily.last = t;
    const D = DAILY[save.daily.streak - 1], rw = D.t === 'coins' ? { t:'coins', n:Math.round(D.n * (1 + save.lvl * .25)) } : D.t === 'gems' ? { t:'gems', n:D.n } : { t:'bait', id:D.id, n:D.n };
    grant(rw);
    const days = DAILY.map((d, i) => i < save.daily.streak ? '🟡' : '⚪').join(' ');
    Q.push({ tag:'DAILY REWARD · DAY ' + save.daily.streak, art:save.daily.streak === 7 ? '👑' : '🎁', title:rw.t === 'bait' ? rw.n + '× ' + BAITS.find(b => b.id === rw.id).name : '+' + fmt(rw.n) + (rw.t === 'coins' ? ' coins' : ' gems'), text:days + '<br>Come back tomorrow for day ' + (save.daily.streak % 7 + 1) + '!', snd:'claim' });
  }
  persist();
  if(Q.length){ popQueue = Q; setTimeout(nextPop, 600); }
}

/* ---------------- input ---------------- */
function anyScreen(){ return SCREENS.some(id => !$(id).classList.contains('hidden')) || !$('pop').classList.contains('hidden') || !$('tally').classList.contains('hidden'); }
function wire(){
  const pointer = e => { const [wx] = toWorld(e.clientX, e.clientY); G.tx = clamp(wx, .4, G.WW - .4); };
  const down = e => {
    AU.init(); AU.resume();
    if(e.target.closest && e.target.closest('button')) return;
    if(anyScreen()) return;
    if(G.state === 'title'){ cast(); pointer(e); return; }
    if(G.state === 'reel'){ reelTap(); return; }
    if(G.state === 'air'){ const [wx, wy] = toWorld(e.clientX, e.clientY); snapAt(wx, wy); return; }
    pointer(e);
  };
  $('cv').addEventListener('pointerdown', down);
  $('title').addEventListener('pointerdown', down);
  addEventListener('pointermove', e => { if(G.state === 'down' || G.state === 'up') pointer(e); });
  const keys = {};
  addEventListener('keydown', e => {
    AU.init(); AU.resume(); keys[e.key] = true;
    if(e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); if(!$('pop').classList.contains('hidden')) popAct(); else if(G.state === 'title' && !anyScreen()) cast(); else if(G.state === 'tally' && !SCREENS.some(id => !$(id).classList.contains('hidden'))) cast(); else if(G.state === 'reel') reelTap(); else if(G.state === 'air'){ const a = G.air.find(a => !a.done && a.wait <= 0 && !a.c.snapped); if(a) snapAt(a.x, a.y); } }
    if(e.key === 'Escape' || e.key === 'p' || e.key === 'P'){ if(G.state === 'down' || G.state === 'up') pauseGame(); else if(G.state === 'pause') resumeGame(); }
  });
  addEventListener('keyup', e => { keys[e.key] = false; });
  window.keyTick = dt => { const l = keys.ArrowLeft || keys.a || keys.A, r = keys.ArrowRight || keys.d || keys.D; if(l) G.tx = Math.max(.4, G.tx - 16 * dt); if(r) G.tx = Math.min(G.WW - .4, G.tx + 16 * dt); };
  onTap('pauseBtn', pauseGame); onTap('pResume', resumeGame); onTap('pSet', openSettings);
  onTap('tDex', openDex); onTap('tShop', () => { shopTab = 'up'; openShop(); }); onTap('tQuest', openQuests); onTap('tSet', openSettings); onTap('baitChip', cycleBait);
  onTap('tAgain', cast); onTap('tHome', toTitle); onTap('tShop2', () => { hide('tally'); shopTab = 'up'; openShop(); });
  onTap('popOk', () => popAct());
  document.querySelectorAll('.closeBtn').forEach(b => onTap(b, closeScreens));
  document.querySelectorAll('#shop .tabs button').forEach(b => onTap(b, () => { shopTab = b.dataset.tab; openShop(); }));
  document.querySelectorAll('#settings input[data-opt]').forEach(i => i.addEventListener('change', () => { save.opt[i.dataset.opt] = i.checked; AU.apply(); persist(); }));
  document.querySelectorAll('#settings .seg button').forEach(b => onTap(b, () => { save.opt[b.parentElement.dataset.opt] = b.dataset.v; resize(); persist(); openSettings(); }));
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ writeSave(); pauseGame(); } else AU.resume(); });
  SDK.onMute = m => AU.setPortalMute(m);
  setInterval(() => { if(G.state === 'title' || G.state === 'tally') writeSave(); }, 30000);
}

/* ---------------- loop ---------------- */
let last = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > .05) dt = .05;
  try{
    if(G.state !== 'pause'){ keyTick(dt); update(dt); } else G.rt += dt;
    if(G.state === 'reel') updateReel();
    phaseHints();
    AU.depthFilter(G.depth);
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
  for(const s of SPECIES){ fishSprite(s, false); }
  wire();
  toTitle();
  requestAnimationFrame(frame);
  SDK.loadingStop();
  const b = $('boot'); b.style.opacity = '0'; setTimeout(() => b.remove(), 450);
  bootRewards();
})();
