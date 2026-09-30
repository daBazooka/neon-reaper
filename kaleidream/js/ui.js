'use strict';
/* =====================================================================
   KALEIDREAM UI: title, HUD, banners, results, capsule machine,
   wardrobe, missions, surprise book, daily gift, input and the loop.
   ===================================================================== */
const SCREENS = ['capsule', 'ward', 'miss', 'dex', 'sett'];
let playing = false;
function beginPlay(){ if(!playing){ playing = true; SDK.gameplayStart(); } }
function endPlay(){ if(playing){ playing = false; SDK.gameplayStop(); } }
function onTap(el, fn){ el = typeof el === 'string' ? $(el) : el; el.addEventListener('click', e => { e.stopPropagation(); AU.init(); AU.resume(); AU.ui(); fn(e); }); }
function toast(head, txt){ const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<b>${head}</b><span>${txt}</span>`; $('toasts').appendChild(t); while($('toasts').children.length > 3) $('toasts').firstChild.remove(); setTimeout(() => t.remove(), 3100); }
window.onMissionDone = m => { toast('MISSION COMPLETE!', mtxt(m)); AU.claim(); refreshBadges(); };
const RCOL = r => RARITY[r].col;

/* ---------------- flow ---------------- */
function toTitle(){
  SCREENS.forEach(hide); ['results', 'contBox', 'pause', 'hud', 'bossBar', 'pop'].forEach(hide);
  endPlay(); G.state = 'title'; G.items = []; G.titleInit = false; G.boss = null; G.twist = null; G.jack = null; G.friend = null; G.clone = null; G.kalei = null;
  G.mode = 'fly'; AU.style = 'title'; AU.twistId = ''; if(AU.ctx) AU.lp.frequency.setTargetAtTime(18000, AU.ctx.currentTime, .1);
  show('title'); refreshTitle();
}
function refreshTitle(){
  $('tDust').textContent = fmt(save.dust); $('tShards').textContent = fmt(save.shards); $('tGold').textContent = save.gold;
  $('tGold').classList.toggle('hidden', !save.gold);
  save.sel = clamp(save.sel, 1, save.lvl);
  $('lvNum').textContent = 'DREAM ' + save.sel; $('lvName').textContent = dreamName(save.sel);
  const st = save.stars[save.sel] || 0; $('lvStars').textContent = save.sel < save.lvl ? '★'.repeat(st) + '☆'.repeat(3 - st) : 'NEW!';
  $('lvPrev').disabled = save.sel <= 1; $('lvNext').disabled = save.sel >= save.lvl;
  refreshBadges();
}
function refreshBadges(){
  $('missBadge').classList.toggle('hidden', !save.missions.some(m => m.done && !m.claimed));
  $('capBadge').classList.toggle('hidden', !(save.dust >= CAPSULE_COST || save.gold > 0 || save.shards >= GOLD_COST));
}
function play(){
  SCREENS.forEach(hide); hide('title'); ['results', 'contBox', 'pop'].forEach(hide);
  AU.init(); AU.resume();
  G.shown = false; for(const k in hc) delete hc[k];
  startRun(save.sel);
  show('hud'); $('hDream').textContent = 'DREAM ' + G.lvl + ' · ' + dreamName(G.lvl).toUpperCase();
  persist();
}
function modeBanner(m, idx, n, isNew, fin){
  const b = $('modeBanner'), how = MODES[m].how, touch = matchMedia('(pointer:coarse)').matches;
  const howT = MODES[m].ctl === 'steer' ? (touch ? 'Drag · ' : 'Mouse · ') + how : (touch ? 'Tap · ' : 'Click / Space · ') + how;
  b.innerHTML = `<small class="${fin ? 'fin' : isNew ? 'new' : ''}">${fin ? '☠ FINAL NIGHTMARE ☠' : isNew ? '✦ NEW DREAM DISCOVERED ✦' : 'SHIFT ' + (idx + 1) + ' / ' + n}</small><b style="color:${hsl(rndi(0, 360), 95, 78)}">${MODES[m].name}</b><span>${howT}</span>`;
  show('modeBanner'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  clearTimeout(b._t); b._t = setTimeout(() => hide('modeBanner'), 1900);
  if(fin){ const B = bossFor(G.lvl); setTimeout(() => { if(G.boss){ $('bossName').textContent = B.name; show('bossBar'); } }, 1200); } else hide('bossBar');
  if(isNew) toast('NEW SURPRISE FOUND!', `${MODES[m].name} · ${seenCount()} / ${TWISTS.length + MODE_IDS.length} discovered`);
}
function twistBanner(t, isNew){
  const b = $('twistBanner');
  b.innerHTML = `${isNew ? '<em>NEW TWIST!</em><br>' : ''}<b style="color:${t.col}">${t.name}</b><span>${t.txt}</span>`;
  show('twistBanner'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
  clearTimeout(b._t); b._t = setTimeout(() => hide('twistBanner'), 2300);
}
function pauseGame(){ if(!['play', 'shift'].includes(G.state)) return; G.prev = G.state; G.state = 'pause'; endPlay(); show('pause'); }
function resumeGame(){ hide('pause'); if(G.state === 'pause'){ G.state = G.prev; if(G.state === 'play') beginPlay(); } }

/* ---------------- results ---------------- */
function showResults(win){
  endPlay(); hide('bossBar');
  if(!win && !G.cont && save.shards >= 3){ show('contBox'); return; }
  finishResults(win);
}
function finishResults(win){
  hide('contBox'); hide('hud');
  const rw = runRewards(win);
  $('rTitle').textContent = win ? pick(['DREAM CLEARED!', 'WHAT A DREAM!', 'SWEET DREAMS!', 'NIGHTMARE DEFEATED!']) : pick(['YOU WOKE UP!', 'BEEP BEEP BEEP...', 'ALARM CLOCK WINS', 'RUDELY AWAKENED']);
  $('rStars').innerHTML = win ? '<b>★</b>'.repeat(rw.stars) + '☆'.repeat(3 - rw.stars) : '';
  $('rScore').textContent = fmt(G.score);
  $('rSub').innerHTML = `Best combo x${G.bestCombo} · ${G.run.twists} twists survived${G.score >= save.stats.best && G.score > 0 ? ' · <b style="color:#ffe45a">NEW BEST!</b>' : ''}`;
  let h = `<div class="rw">+${fmt(rw.dust)} ✦<small>DREAM DUST</small></div>`;
  if(rw.shards) h += `<div class="rw" style="color:#8affff">+${rw.shards} ♦<small>CRYSTALS</small></div>`;
  if(rw.gold) h += `<div class="rw" style="color:#ffb02a">+1 ●<small>GOLDEN CAPSULE</small></div>`;
  $('rRewards').innerHTML = h;
  $('rFinds').innerHTML = rw.newFinds.length ? '✦ Discovered: ' + rw.newFinds.join(' · ') : '';
  $('rMiss').innerHTML = save.missions.map(m => `<div class="mm"><span>${m.done ? '✅' : '▫️'} ${mtxt(m)}</span><i><s style="width:${m.p / m.n * 100}%"></s></i></div>`).join('');
  $('rNext').textContent = win ? (save.sel > G.lvl ? 'NEXT DREAM ▶' : 'DREAM AGAIN ▶') : 'TRY AGAIN ▶';
  if(!win) save.sel = G.lvl;
  show('results');
  if(win){ AU.clear(); }
  persist();
}

/* ---------------- capsule machine ---------------- */
function openCapsules(){ SCREENS.forEach(hide); show('capsule'); hide('reveal'); $('machine').classList.remove('hidden'); refreshCaps(); }
function refreshCaps(){
  $('cDust').textContent = fmt(save.dust); $('cShards').textContent = fmt(save.shards); $('cGold').textContent = save.gold;
  $('spinN').disabled = save.dust < CAPSULE_COST; $('spinG').disabled = save.shards < GOLD_COST;
  $('spinF').classList.toggle('hidden', !save.gold);
  $('collTxt').textContent = `Collection ${ownedCount()} / ${totalItems()}`;
}
let capBusy = false;
function rollCapsule(golden){
  const w = golden ? { R:70, E:24, L:6 } : { C:RARITY.C.w, R:RARITY.R.w, E:RARITY.E.w, L:RARITY.L.w };
  let tot = 0; for(const k in w) tot += w[k]; let r = Math.random() * tot, rar = 'C'; for(const k in w){ r -= w[k]; if(r <= 0){ rar = k; break; } }
  const kinds = Object.keys(KINDS);
  const all = []; for(const k of kinds) for(const it of KINDS[k].list) if(it.r === rar && it.id !== 'none') all.push({ k, it });
  const fresh = all.filter(x => !save.own[x.k][x.it.id]);
  const pickFrom = fresh.length && Math.random() < .7 ? fresh : all;
  return pick(pickFrom);
}
function spin(type){
  if(capBusy) return;
  if(type === 'n'){ if(save.dust < CAPSULE_COST) return; save.dust -= CAPSULE_COST; }
  else if(type === 'g'){ if(save.shards < GOLD_COST) return; save.shards -= GOLD_COST; }
  else { if(save.gold < 1) return; save.gold--; }
  capBusy = true; AU.buy();
  const res = rollCapsule(type !== 'n');
  save.stats.capsules++; missionEvent('capsules', 1);
  const dup = !!save.own[res.k][res.it.id];
  let refund = 0;
  if(dup){ refund = { C:30, R:60, E:120, L:300 }[res.it.r]; save.dust += refund; } else save.own[res.k][res.it.id] = 1;
  persist(); refreshCaps();
  hide('reveal'); $('machine').classList.remove('hidden');
  const m = $('machine'), ball = $('ball');
  ball.style.setProperty('--bc', RCOL(res.it.r)); ball.className = '';
  m.classList.add('shake');
  let n = 0; const sh = setInterval(() => { AU.shake(); if(++n > 8) clearInterval(sh); }, 110);
  setTimeout(() => { m.classList.remove('shake'); void ball.offsetWidth; ball.className = 'drop'; AU.tone && AU.ctx && AU.tone(300, .2, 'sine', .08, 150); }, 1000);
  setTimeout(() => { ball.className = 'open'; AU.open(res.it.r); }, 1800);
  setTimeout(() => {
    m.classList.add('hidden'); show('reveal');
    drawPreview($('revC'), res.k, res.it.id, 1);
    $('revName').textContent = res.it.name; $('revName').style.color = RCOL(res.it.r);
    $('revInfo').innerHTML = `${RARITY[res.it.r].name} ${KINDS[res.k].name}${dup ? ` · already yours: <b style="color:#ffe45a">+${refund} ✦</b>` : ' · <b style="color:#ffe45a">NEW!</b> Equip it in the Wardrobe'}${res.k === 'c' ? '<br>' + res.it.desc : ''}`;
    if(res.it.r === 'L' || res.it.r === 'E'){ SDK.happytime(); }
    capBusy = false; refreshCaps();
  }, 2250);
}

/* ---------------- previews of dreamers and cosmetics ---------------- */
function drawPreview(c, k, id, big, face){
  const g = c.getContext('2d'), w = c.width, h = c.height, t = performance.now() / 1000;
  g.clearRect(0, 0, w, h);
  const ch = k === 'c' ? CHARS.find(x => x.id === id) : charById(save.char);
  const hat = k === 'h' ? id : k === 'c' ? 'none' : save.hat;
  const fc = k === 'e' ? id : face || 'happy';
  if(k === 't'){
    const tr = TRAILS.find(x => x.id === id);
    for(let i = 0; i < 9; i++){ const x = w * (.12 + i * .075), y = h * .55 + Math.sin(i + t * 3) * h * .06, s = w * (.02 + i * .004); g.globalAlpha = .3 + i * .07;
      const col = id === 'rainbow' ? hsl(i * 40, 95, 65) : id === 'fire' ? pick(['#ffe45a', '#ff8a2a']) : id === 'galaxy' ? ['#b08aff', '#5a6aff', '#ffffff'][i % 3] : id === 'hearts' ? '#ff7ab0' : id === 'confetti' ? hsl(i * 70, 95, 62) : id === 'notes' ? '#ffe45a' : '#ffffff';
      g.fillStyle = col; g.strokeStyle = col;
      if(id === 'hearts'){ heartPath(g, x, y, s * 1.6); g.fill(); } else if(id === 'sparkle' || id === 'galaxy'){ starPath(g, x, y, s * 2, 4, .4, i); g.fill(); } else if(id === 'bubbles'){ g.lineWidth = 2; g.beginPath(); g.arc(x, y, s * 1.4, 0, TAU); g.stroke(); } else if(id === 'notes'){ g.font = `900 ${s * 5}px system-ui`; g.fillText('♪', x, y); } else if(id === 'snow'){ g.font = `900 ${s * 4}px system-ui`; g.fillText('❄', x, y); } else { g.beginPath(); g.arc(x, y, s * 1.4, 0, TAU); g.fill(); } }
    g.globalAlpha = 1;
    drawDreamer(g, w * .78, h * .52, w * .17, ch, { t, face:'happy', hat:save.hat });
    return;
  }
  drawDreamer(g, w / 2, h * .57, w * (big ? .27 : .26), ch, { t, face:fc, hat });
}

/* ---------------- wardrobe ---------------- */
let wTab = 'c';
function openWard(){ SCREENS.forEach(hide); show('ward'); buildWard(); }
function buildWard(){
  document.querySelectorAll('#wTabs button').forEach(b => b.classList.toggle('on', b.dataset.k === wTab));
  const list = KINDS[wTab].list, cur = { c:save.char, h:save.hat, t:save.trail, e:save.emote }[wTab];
  const grid = $('wGrid'); grid.innerHTML = '';
  for(const it of list){
    const own = !!save.own[wTab][it.id];
    const d = document.createElement('div'); d.className = 'card' + (it.id === cur ? ' eq' : '') + (own ? '' : ' lock');
    const c = document.createElement('canvas'); c.width = c.height = 144; d.appendChild(c);
    d.insertAdjacentHTML('beforeend', `<em style="background:${RCOL(it.r)}">${it.r}</em>${own ? it.name : '???'}`);
    if(own) drawPreview(c, wTab, it.id); else { const g = c.getContext('2d'); g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(72, 78, 38, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.font = '900 42px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 72, 80); }
    d.onclick = () => { AU.init(); if(!own){ AU.miss(); $('wInfo').innerHTML = `<b>Locked</b>Find it in the Capsule machine`; return; } equip(wTab, it.id); };
    grid.appendChild(d);
  }
  wardInfo();
}
function equip(k, id){
  if(k === 'c') save.char = id; else if(k === 'h') save.hat = id; else if(k === 't') save.trail = id; else save.emote = id;
  AU.buy(); persist(); buildWard(); if(k === 'e') heroEmote(id);
}
function wardInfo(){ const ch = charById(save.char); $('wInfo').innerHTML = `<b style="color:${ch.col}">${ch.name}</b>${ch.desc}`; }

/* ---------------- missions / dex / settings ---------------- */
function openMiss(){ SCREENS.forEach(hide); show('miss'); buildMiss(); }
function buildMiss(){
  const L = $('mList'); L.innerHTML = '';
  for(const m of save.missions){
    const d = document.createElement('div'); d.className = 'mis' + (m.done ? ' done' : '');
    d.innerHTML = `<div><b>${mtxt(m)}</b><small>Reward: ${m.rw.dust} ✦ · ${m.rw.shards} ♦</small><i><s style="width:${m.p / m.n * 100}%"></s></i></div><button ${m.done ? '' : 'disabled'}>${m.done ? 'CLAIM' : Math.floor(m.p) + '/' + m.n}</button>`;
    d.querySelector('button').onclick = () => { if(!m.done) return; AU.claim(); save.dust += m.rw.dust; save.shards += m.rw.shards; m.claimed = true; fillMissions(); persist(); buildMiss(); refreshTitle(); toast('CLAIMED!', `+${m.rw.dust} ✦ · +${m.rw.shards} ♦`); };
    L.appendChild(d);
  }
  const s = save.stats;
  $('mStats').innerHTML = `Dreams cleared ${s.clears} · Nightmares defeated ${s.bosses}<br>Stars ${fmt(s.stars)} · Twists survived ${s.twists} · Best combo x${s.bestCombo}<br>Daily streak: day ${save.daily.streak || 0} — come back tomorrow for a bigger gift!`;
}
function openDex(){
  SCREENS.forEach(hide); show('dex');
  $('dexCount').textContent = `${seenCount()} / ${TWISTS.length + MODE_IDS.length} surprises discovered`;
  $('dexModes').innerHTML = MODE_IDS.map(m => save.seen.m[m] ? `<div class="dx" style="--c:#5ae8ff"><b style="color:${hsl(rndi(0, 360), 95, 78)}">${MODES[m].name}</b><span>${MODES[m].how}</span></div>` : `<div class="dx no"><b>???</b><span>${MODES[m].unlock > save.lvl ? 'Appears from Dream ' + MODES[m].unlock : 'Keep dreaming...'}</span></div>`).join('');
  $('dexTwists').innerHTML = TWISTS.map(t => save.seen.t[t.id] ? `<div class="dx" style="--c:${t.col}"><b style="color:${t.col}">${t.name}</b><span>${t.txt}</span></div>` : `<div class="dx no"><b>???</b><span>A surprise waits here</span></div>`).join('');
}
function openSett(){ SCREENS.forEach(hide); show('sett'); refreshSett(); }
function refreshSett(){
  const set = (id, on, txt) => { $(id).textContent = txt || (on ? 'ON' : 'OFF'); $(id).classList.toggle('off', !on); };
  set('oSfx', save.opt.sfx); set('oMus', save.opt.music); set('oFx', save.opt.fx === 'high', save.opt.fx === 'high' ? 'HIGH' : 'LOW');
}
function closeScreens(){ SCREENS.forEach(hide); if(G.state === 'title') refreshTitle(); }

/* ---------------- popups ---------------- */
function popup(art, t, p, btn, cb){ $('popArt').innerHTML = art; $('popT').textContent = t; $('popP').innerHTML = p; $('popBtn').textContent = btn || 'NICE!'; $('popBtn').onclick = () => { AU.init(); AU.claim(); hide('pop'); cb && cb(); }; show('pop'); }
function bootRewards(){
  const d = save.daily, td = today();
  if(d.last === td) return;
  d.streak = d.last === yesterday() ? d.streak + 1 : 1; d.last = td;
  const rw = DAILY[(d.streak - 1) % 7];
  save.dust += rw.dust || 0; save.shards += rw.shards || 0; save.gold += rw.gold || 0;
  persist();
  const parts = []; if(rw.dust) parts.push(`+${rw.dust} ✦ dust`); if(rw.shards) parts.push(`+${rw.shards} ♦ crystals`); if(rw.gold) parts.push('+1 golden capsule');
  popup('🎁', `DAY ${d.streak} GIFT!`, parts.join(' · ') + '<br><small>Come back tomorrow for more. Day 7 is huge!</small>', 'YAY!', refreshTitle);
  refreshTitle();
}

/* ---------------- title hero ---------------- */
const HERO_LINES = ['I HAD THE WEIRDEST DREAM', 'WHAT IF CLOUDS ARE SKY SHEEP?', 'IS THIS REAL?', 'FIVE MORE MINUTES...', 'I DREAMT I WAS A TOASTER', 'BOOP!', 'LET\'S GO!!', 'DO FISH DREAM?', 'I CAN TASTE COLOURS', 'HEHE'];
let heroFace = 'happy', heroFaceT = 0, heroSay = '', heroSayT = 0, heroJump = 0;
function heroEmote(f){ heroFace = f || save.emote; heroFaceT = 1.6; heroJump = 1; heroSay = pick(HERO_LINES); heroSayT = 2; }
function drawHero(dt){
  if(heroFaceT > 0 && (heroFaceT -= dt) <= 0) heroFace = 'happy';
  if(heroSayT > 0) heroSayT -= dt;
  heroJump = Math.max(0, heroJump - dt * 2.5);
  const t = performance.now() / 1000;
  for(const [id, sc] of [['hero', 1], ['wHero', 1]]){
    const c = $(id); if(!c || c.offsetParent === null) continue;
    const g = c.getContext('2d'), w = c.width, h = c.height; g.clearRect(0, 0, w, h);
    const jy = -Math.sin(heroJump * Math.PI) * h * .12 + Math.sin(t * 2) * h * .015;
    glow(g, w / 2, h * .6, w * .45, hsl(t * 40, 90, 75), .5);
    drawDreamer(g, w / 2, h * .6 + jy, w * .23 * sc, charById(save.char), { t, face:heroFace, hat:save.hat, sq:heroJump * .3, look:[Math.sin(t * .7), 0] });
    if(heroSayT > 0 && id === 'hero'){ g.font = '900 13px system-ui'; const tw = g.measureText(heroSay).width + 16; g.fillStyle = '#fff'; rrect(g, w / 2 - tw / 2, 6, tw, 26, 12); g.fill(); g.fillStyle = '#1a1030'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(heroSay, w / 2, 20); }
  }
}

/* ---------------- HUD ---------------- */
const hc = {};
function setH(k, v, fn){ if(hc[k] === v) return; hc[k] = v; fn(v); }
function updateHUD(){
  if(G.state === 'title') return;
  setH('hearts', G.hearts + '/' + G.maxHearts + '/' + G.shield, () => { let s = ''; for(let i = 0; i < Math.max(G.maxHearts, G.hearts); i++) s += i < G.hearts ? '♥' : '<span class="off">♥</span>'; if(G.shield) s += '<span class="sh"> ◈</span>'; $('hearts').innerHTML = s; });
  setH('score', G.score, v => $('hScore').textContent = fmt(v));
  setH('dust', Math.floor(G.dust), v => $('hDust').textContent = fmt(v));
  setH('dots', G.idx + '/' + G.seq.length, () => { $('hDots').innerHTML = G.seq.map((m, i) => `<i class="${i === G.seq.length - 1 ? 'boss ' : ''}${i < G.idx ? 'done' : i === G.idx ? 'now' : ''}"></i>`).join(''); });
  const cb = G.combo >= 3 ? 'x' + G.combo + ' COMBO' : '';
  setH('combo', cb, v => { $('hCombo').classList.toggle('hidden', !v); $('hCombo').querySelector('b').textContent = v; });
  if(G.combo >= 3) $('hCombo').querySelector('s').style.width = clamp(G.comboT / 2.4, 0, 1) * 100 + '%';
  if(G.boss) setH('boss', G.boss.hp, v => $('bossHp').firstElementChild.style.width = Math.max(0, v / G.boss.max * 100) + '%');
}

/* ---------------- input ---------------- */
const keys = {}; let drag = null;
function toWorld(px, py){ let x = px / V.s, y = py / V.s; if(tw('mirror')) x = V.ww - x; if(tw('flip')) y = V.hh - y; return [x, y]; }
function anyOverlay(){ return SCREENS.some(id => !$(id).classList.contains('hidden')) || ['results', 'contBox', 'pause', 'pop', 'title'].some(id => !$(id).classList.contains('hidden')); }
function wire(){
  addEventListener('resize', resize);
  cv.addEventListener('pointerdown', e => {
    AU.init(); AU.resume();
    if(anyOverlay()) return;
    if(G.state !== 'play' && G.state !== 'shift') return;
    press();
    if(e.pointerType === 'mouse'){ const [x, y] = toWorld(e.clientX, e.clientY); G.tx = x; G.ty = y; }
    else drag = { id:e.pointerId, x:e.clientX, y:e.clientY };
  });
  addEventListener('pointermove', e => {
    if(G.state !== 'play') return;
    if(e.pointerType === 'mouse'){ const [x, y] = toWorld(e.clientX, e.clientY); G.tx = x; G.ty = y; return; }
    if(!drag || drag.id !== e.pointerId) return;
    let dx = (e.clientX - drag.x) / V.s * 1.3, dy = (e.clientY - drag.y) / V.s * 1.3; drag.x = e.clientX; drag.y = e.clientY;
    if(tw('mirror')) dx = -dx; if(tw('flip')) dy = -dy;
    G.tx = clamp(G.tx + dx, 0, V.ww); G.ty = clamp(G.ty + dy, 0, V.hh);
  });
  const endDrag = e => { if(drag && drag.id === e.pointerId) drag = null; };
  addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
  addEventListener('keydown', e => {
    const k = e.key;
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(k)) e.preventDefault();
    if(e.repeat){ keys[k] = true; return; }
    keys[k] = true; AU.init(); AU.resume();
    if(k === 'Escape' || k === 'p' || k === 'P'){ if(G.state === 'pause') resumeGame(); else if(!$('pause').classList.contains('hidden')) resumeGame(); else if(anyOverlay() && G.state === 'title') closeScreens(); else pauseGame(); return; }
    if(k === ' ' || k === 'Enter' || k === 'ArrowUp' || k === 'w' || k === 'W'){
      if(G.state === 'play') { if(!(MODES[G.mode].ctl === 'steer' && (k === 'ArrowUp' || k === 'w' || k === 'W'))) press(); }
      else if(G.state === 'title' && !SCREENS.some(id => !$(id).classList.contains('hidden')) && $('pop').classList.contains('hidden') && (k === ' ' || k === 'Enter')) play();
    }
  });
  addEventListener('keyup', e => { keys[e.key] = false; });
  onTap('playBtn', play);
  onTap('lvPrev', () => { save.sel = Math.max(1, save.sel - 1); refreshTitle(); });
  onTap('lvNext', () => { save.sel = Math.min(save.lvl, save.sel + 1); refreshTitle(); });
  onTap('hero', () => { heroEmote(); AU.jump(1); });
  onTap('bCaps', openCapsules); onTap('bWard', openWard); onTap('bMiss', openMiss); onTap('bDex', openDex); onTap('bSet', openSett);
  document.querySelectorAll('.closeBtn').forEach(b => onTap(b, closeScreens));
  document.querySelectorAll('#wTabs button').forEach(b => onTap(b, () => { wTab = b.dataset.k; buildWard(); }));
  onTap('spinN', () => spin('n')); onTap('spinG', () => spin('g')); onTap('spinF', () => spin('f'));
  onTap('pauseBtn', pauseGame); onTap('resBtn', resumeGame); onTap('quitBtn', () => { hide('pause'); G.state = 'over'; G.endT = 9; G.shown = true; finishResults(false); });
  onTap('contYes', () => { if(save.shards < 3) return; save.shards -= 3; persist(); hide('contBox'); show('hud'); continueRun(); });
  onTap('contNo', () => finishResults(false));
  onTap('rNext', play); onTap('rHome', toTitle); onTap('rCaps', () => { hide('results'); toTitle(); openCapsules(); });
  onTap('oSfx', () => { save.opt.sfx = !save.opt.sfx; AU.apply(); persist(); refreshSett(); });
  onTap('oMus', () => { save.opt.music = !save.opt.music; AU.apply(); persist(); refreshSett(); });
  onTap('oFx', () => { save.opt.fx = save.opt.fx === 'high' ? 'low' : 'high'; resize(); persist(); refreshSett(); });
  document.addEventListener('visibilitychange', () => { AU.setHidden(document.hidden); if(document.hidden){ writeSave(); pauseGame(); } else AU.resume(); });
  SDK.onMute = m => AU.setPortalMute(m);
  setInterval(() => { if(G.state === 'title') writeSave(); }, 30000);
}
function keyTick(dt){
  if(G.state !== 'play' || MODES[G.mode].ctl !== 'steer') return;
  let dx = (keys.ArrowRight || keys.d || keys.D ? 1 : 0) - (keys.ArrowLeft || keys.a || keys.A ? 1 : 0), dy = (keys.ArrowDown || keys.s || keys.S ? 1 : 0) - (keys.ArrowUp || keys.w || keys.W ? 1 : 0);
  if(!dx && !dy) return;
  if(tw('mirror')) dx = -dx; if(tw('flip')) dy = -dy;
  G.tx = clamp(G.P.x + dx * 30, 0, V.ww); G.ty = clamp(G.P.y + dy * 30, 0, V.hh);
}

/* ---------------- loop ---------------- */
let last = 0;
function frame(ts){
  requestAnimationFrame(frame);
  let dt = last ? (ts - last) / 1000 : 1 / 60; last = ts;
  if(dt <= 0) return; if(dt > .05) dt = .05;
  try{
    if(G.state !== 'pause'){ keyTick(dt); update(dt); }
    render(); updateHUD(); drawHero(dt);
  }catch(err){ console.error(err); }
}
addEventListener('error', e => { try{ console.error(e.error || e.message); }catch(_){} });

/* ---------------- boot ---------------- */
(async () => {
  resize();
  await SDK.init();
  SDK.loadingStart();
  loadSave();
  resize();
  wire();
  toTitle();
  requestAnimationFrame(frame);
  SDK.loadingStop();
  const b = $('boot'); b.style.opacity = '0'; setTimeout(() => b.remove(), 450);
  bootRewards();
})();
