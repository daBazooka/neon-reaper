'use strict';
/* =====================================================================
   KALEIDREAM engine. A dream is a chain of "shifts": every shift the
   game turns into a different game (fly, run, orbit, dance...), and
   twists land on top every few seconds. The last shift is a nightmare
   boss that you hurt by collecting things.
   World units: 1u = min(W,H)/100 px, so the short side is always 100u.
   ===================================================================== */
const G = {
  state:'title', lvl:1, mode:'fly', seq:[], idx:0, finale:false, t:0, rt:0, dur:9,
  spd:1, dens:1, hearts:3, maxHearts:3, inv:0, shield:0, cont:false,
  score:0, combo:0, comboT:0, bestCombo:0, dust:0, shards:0, collected:0, lastMile:0,
  P:{ x:50, y:50, vx:0, vy:0, baseR:4, r:4, sc:1, ring:0, rr:20, ang:0, jumps:0, face:'happy', faceT:0, say:'', sayT:0, sq:0 },
  items:[], parts:[], pops:[], trail:[], bolts:[], paintLine:[],
  twist:null, twistCD:3, lastTwist:'', boss:null, kalei:null, clone:null, jack:null, friend:null,
  hueOff:0, flash:0, flashC:'#fff', shake:0, spawnT:0, spawnT2:0, nextNote:0, hitShift:false,
  tx:50, ty:50, run:null, endT:0, noteT:0,
};
const WW = () => V.ww, HH = () => V.hh;

/* ---------------- run flow ---------------- */
function buildSeq(lvl){
  const pool = modesFor(lvl), n = shiftsFor(lvl), seq = [];
  const fresh = pool.filter(m => !save.seen.m[m]);
  for(let i = 0; i < n - 1; i++){
    let m;
    if(i === 1 && fresh.length) m = fresh.shift();
    else { const c = pool.filter(x => x !== seq[i - 1] && (fresh.length === 0 || !fresh.includes(x) || i > 1)); m = pick(c.length ? c : pool); }
    seq.push(m);
  }
  const fin = pool.filter(m => m !== 'beat' && m !== seq[seq.length - 1]);
  seq.push(pick(fin.length ? fin : ['fly']));
  // the very first dream eases in: fly, dodge, run, then the boss
  if(save.stats.runs === 0 && lvl === 1) return ['fly', 'dodge', 'run', 'fly'];
  return seq;
}
function startRun(lvl){
  const pk = perk();
  Object.assign(G, { lvl, seq:buildSeq(lvl), idx:-1, finale:false, spd:speedFor(lvl), dens:.8 + Math.min(1, (lvl - 1) * .06),
    maxHearts:3 + pk.hearts, hearts:3 + pk.hearts, shield:pk.shield, inv:0, cont:false,
    score:0, combo:0, comboT:0, bestCombo:0, dust:0, shards:0, collected:0, lastMile:0,
    items:[], parts:[], pops:[], bolts:[], trail:[], paintLine:[], twist:null, boss:null, clone:null, jack:null, friend:null,
    hueOff:0, flash:0, shake:0, endT:0, shown:false, run:{ twists:0, newFinds:[], nohit:0 } });
  G.P.sc = 1; G.P.face = 'happy';
  save.stats.runs++;
  nextShift();
}
function nextShift(){
  if(G.idx >= 0 && !G.hitShift) { G.run.nohit++; missionEvent('nohit', 1); }
  G.idx++;
  const m = G.seq[G.idx];
  G.finale = G.idx === G.seq.length - 1;
  G.state = 'shift'; G.kalei = { t:0, d:1.15, next:m, snap:false, switched:false };
  G.twist = null; G.jack = null; G.friend = null; G.clone = null;
  AU.shift();
  const isNew = !save.seen.m[m];
  if(isNew){ save.seen.m[m] = 1; G.run.newFinds.push(MODES[m].name); missionEvent('new', 1); }
  modeBanner(m, G.idx, G.seq.length, isNew, G.finale);
}
function enterMode(m){
  const P = G.P, w = WW(), h = HH();
  G.mode = m; G.t = 0; G.dur = MODES[m].dur; G.hitShift = false; G.paintedShift = 0;
  G.items = G.items.filter(it => it.k === 'gift'); G.paintLine = [];
  G.spawnT = .9; G.spawnT2 = 1.2; G.twistCD = G.lvl === 1 && save.stats.clears === 0 ? rnd(3.5, 4.5) : rnd(2.2, 3.4);
  P.vx = P.vy = 0; P.baseR = 4; P.jumps = 0; P.sq = 0;
  if(m === 'fly'){ P.x = w * .28; P.y = h * .45; }
  else if(m === 'run'){ P.x = w * .25; P.y = h * .8 - P.baseR; }
  else if(m === 'orbit'){ P.ang = -Math.PI / 2; P.ring = 0; const mm = Math.min(w, h); P.rr = mm * .2; }
  else if(m === 'dive'){ P.x = w / 2; P.y = h * .28; }
  else if(m === 'dodge'){ P.x = w / 2; P.y = h * .7; }
  else if(m === 'smash'){ P.baseR = 12; P.x = w * .26; P.y = h * .55; }
  else if(m === 'beat'){ P.x = w / 2; P.y = h / 2; G.nextNote = 1.6; G.noteT = 0; }
  else if(m === 'paint'){ P.x = w / 2; P.y = h / 2; }
  else if(m === 'grow'){ P.x = w / 2; P.y = h / 2; P.baseR = 3; }
  G.tx = P.x; G.ty = P.y;
  if(['fly', 'run', 'dive', 'dodge', 'smash'].includes(m)) prewarm(m === 'dodge' ? 1.6 : 2.6);
  AU.setMode(m);
  say(pick(SAY[m]));
  if(G.finale) startBoss();
}
function startBoss(){
  const b = bossFor(G.lvl), hp = bossHP(G.lvl);
  G.boss = { ...b, hp, max:hp, x:WW() + 30, y:HH() * .2, t:0, hurt:0, atk:2.5, mood:'angry', dead:0 };
  G.dur = 999;
  AU.boss();
}

/* ---------------- helpers ---------------- */
function say(txt){ G.P.say = txt; G.P.sayT = 1.7; }
function face(f, t){ G.P.face = f; G.P.faceT = t || 1.2; }
function pop(txt, x, y, c, s, d){ for(const q of G.pops) if(q.t < .4 && Math.abs(q.y - y) < 4 && Math.abs(q.x - x) < 20) y = q.y - 5; G.pops.push({ txt, x, y, c:c || '#fff', s:s || 20, t:0, d:d || 1.1 }); if(G.pops.length > 24) G.pops.shift(); }
function burst(x, y, n, cols, sp, shape){ const lim = save.opt.fx === 'low' ? 160 : 450; for(let i = 0; i < n && G.parts.length < lim; i++){ const a = rnd(0, TAU), s = rnd(.3, 1) * (sp || 40); G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, l:rnd(.4, .9), ml:.9, c:pick(cols), s:rnd(.6, 1.6), sh:shape || 'dot', rot:rnd(0, TAU), g:0 }); } }
function confetti(n){ for(let i = 0; i < n; i++) G.parts.push({ x:rnd(0, WW()), y:rnd(-10, -2), vx:rnd(-10, 10), vy:rnd(10, 40), l:rnd(1.5, 2.6), ml:2.6, c:hsl(rndi(0, 360), 95, 62), s:rnd(1, 1.8), sh:'conf', rot:rnd(0, TAU), g:15 }); }
function add(k, x, y, vx, vy, o){ const it = Object.assign({ k, x, y, vx:vx || 0, vy:vy || 0, r:k === 'star' ? 2.4 : 3, life:99, ph:rnd(0, TAU) }, o || {}); G.items.push(it); return it; }
const tw = id => G.twist && G.twist.id === id;
function tf(){ let f = 1; if(tw('slowmo')) f *= .5; if(tw('turbo')) f *= 1.55; return f * (1 - perk().slow); }
function hueNow(){ return dreamHue(G.lvl) + MODE_IDS.indexOf(G.mode) * 38 + G.hueOff; }

/* ---------------- spawning per dream mode ---------------- */
function spawnStar(m){
  const w = WW(), h = HH(), s = G.spd;
  if(m === 'fly'){ const y0 = rnd(h * .2, h * .8); for(let i = 0; i < 5; i++) add('star', w + 6 + i * 6, clamp(y0 + Math.sin(i * .8) * 8, 6, h - 6), -38 * s, 0); }
  else if(m === 'run'){ const gy = h * .8; for(let i = 0; i < 4; i++) add('star', w + 6 + i * 6, gy - 4, -50 * s, 0); }
  else if(m === 'orbit'){ const it = add('star', 0, 0, 0, 0, { ang:G.P.ang + 2.3, ring:rndi(0, 1), life:4.5 }); orbPos(it); }
  else if(m === 'dive'){ const x = rnd(8, w - 8); for(let i = 0; i < 3; i++) add('star', x, h + 6 + i * 6, 0, -40 * s); }
  else if(m === 'dodge'){ add('star', rnd(6, w - 6), -4, 0, rnd(25, 40) * s); }
  else if(m === 'smash'){ add('bld', w + 8, rnd(14, h - 8), -60 * s, 0, { r:rnd(3.5, 5), gold:true, look:rndi(0, 3) }); }
  else if(m === 'paint'){ add('grey', rnd(10, w - 10), rnd(12, h - 10), rnd(-8, 8), rnd(-8, 8), { r:rnd(3.5, 5.5) }); }
  else if(m === 'grow'){ spawnDot(true); }
  else if(m === 'beat'){ /* notes are their own thing */ }
}
function spawnDot(small){
  const w = WW(), h = HH(), P = G.P, sm = small || Math.random() < .78;
  const r = clamp(P.baseR * (sm ? rnd(.3, .8) : rnd(1.15, 2)), .9, 26);
  let x, y, n = 0; do { x = rnd(4, w - 4); y = rnd(8, h - 4); n++; } while(Math.hypot(x - P.x, y - P.y) < 22 + r && n < 20);
  const sp = sm ? 12 : 7; add('dot', x, y, rnd(-sp, sp), rnd(-sp, sp), { r, hue:rndi(0, 360) });
}
function orbPos(it){ const mm = Math.min(WW(), HH()), R = it.ring ? mm * .36 : mm * .2; it.x = WW() / 2 + Math.cos(it.ang) * R; it.y = HH() / 2 + Math.sin(it.ang) * R; }
function spawnMode(){
  const m = G.mode, w = WW(), h = HH(), s = G.spd, fin = G.finale, D = G.dens * (fin ? 1.15 : 1);
  if(m === 'fly'){
    if(Math.random() < (fin ? .62 : .5)) spawnStar('fly');
    else { add('haz', w + 6, rnd(h * .1, h * .9), -38 * s * rnd(.9, 1.2), 0, { r:4.6, look:'cloud' }); if(Math.random() < .25 * D) add('haz', w + 14, rnd(h * .1, h * .9), -38 * s, 0, { r:5, look:'cloud' }); }
    G.spawnT = rnd(.5, .75) / D;
  } else if(m === 'run'){
    const gy = h * .8, r = Math.random();
    if(r < .5){ add('haz', w + 6, gy - 3.5, -50 * s, 0, { r:3.5, look:'spike' }); for(let i = 0; i < 3; i++) add('star', w + 6 + (i - 1) * 6, gy - 11 - (i === 1 ? 6 : 0), -50 * s, 0); }
    else if(r < .75 && G.lvl >= 2){ add('haz', w + 6, gy - 21, -56 * s, 0, { r:3.6, look:'bat' }); for(let i = 0; i < 3; i++) add('star', w + 2 + i * 6, gy - 4, -56 * s, 0); }
    else spawnStar('run');
    G.spawnT = rnd(.85, 1.15) / D;
  } else if(m === 'orbit'){
    const ang = G.P.ang + 2.3, k = rndi(0, 1);
    if(Math.random() < .5 / (fin ? 1.3 : 1)){ orbPos(add('haz', 0, 0, 0, 0, { ang, ring:k, life:4.5, r:3.2, look:'spike' })); orbPos(add('star', 0, 0, 0, 0, { ang, ring:1 - k, life:4.5 })); }
    else { orbPos(add('star', 0, 0, 0, 0, { ang, ring:k, life:4.5 })); if(Math.random() < .4) orbPos(add('star', 0, 0, 0, 0, { ang:ang + .25, ring:k, life:4.5 })); }
    G.spawnT = rnd(.5, .7) / D;
  } else if(m === 'dive'){
    if(Math.random() < .55) spawnStar('dive'); else add('haz', rnd(5, w - 5), h + 6, rnd(-4, 4), -40 * s * rnd(.9, 1.1), { r:4, look:'urchin' });
    G.spawnT = rnd(.42, .56) / D * (w > h ? 1 : 1.3);
  } else if(m === 'dodge'){
    add('haz', rnd(3, w - 3), -4, 0, rnd(30, 46) * s, { r:2.6, look:'drop' });
    G.spawnT = rnd(.38, .52) / D * (w > h ? 1 : 1.4);
    if((G.spawnT2 -= .3) <= 0){ spawnStar('dodge'); G.spawnT2 = fin ? .3 : .45; }
  } else if(m === 'smash'){
    add('bld', w + 8, rnd(14, h - 8), -60 * s * rnd(.9, 1.1), 0, { r:rnd(3, 6), gold:Math.random() < .08, look:rndi(0, 3) });
    G.spawnT = rnd(.17, .26);
  } else if(m === 'paint'){
    if(G.items.filter(i => i.k === 'grey').length < 12) spawnStar('paint');
    const ink = G.items.filter(i => i.k === 'haz').length, maxInk = Math.min(5, 1 + Math.floor(G.lvl / 3));
    if(ink < maxInk && G.t > 1) { const e = rndi(0, 3), x = e === 0 ? -4 : e === 1 ? w + 4 : rnd(0, w), y = e < 2 ? rnd(10, h - 10) : e === 2 ? -4 : h + 4; add('haz', x, y, (w / 2 - x) * .1 + rnd(-5, 5), (h / 2 - y) * .1 + rnd(-5, 5), { r:4, look:'ink', bounce:true }); }
    G.spawnT = .35;
  } else if(m === 'grow'){
    if(G.items.filter(i => i.k === 'dot').length < 15) spawnDot();
    G.spawnT = .25;
  }
}

// fill the screen so a new dream never starts empty
function prewarm(sec){
  const P = G.P;
  for(let t = 0; t < sec; t += .05){
    if((G.spawnT -= .05) <= 0) spawnMode();
    for(const it of G.items){ if(it.ang === undefined && it.k !== 'gift'){ it.x += it.vx * .05; it.y += it.vy * .05; } }
  }
  G.items = G.items.filter(it => it.k !== 'haz' || Math.hypot(it.x - P.x, it.y - P.y) > 22);
  G.spawnT = .2;
}

/* ---------------- input ---------------- */
function press(){
  if(G.state !== 'play') return;
  const P = G.P, m = G.mode;
  if(m === 'fly'){ P.vy = -58; P.sq = .25; AU.flap(); for(let i = 0; i < 3; i++) G.parts.push({ x:P.x - 2, y:P.y + 3, vx:rnd(-12, -4), vy:rnd(5, 18), l:.4, ml:.4, c:'#ffffff', s:1, sh:'dot', g:0 }); }
  else if(m === 'run'){ if(P.jumps < 2){ P.vy = P.jumps ? -82 : -96; P.jumps++; P.sq = .3; AU.jump(P.jumps); if(P.jumps === 2) burst(P.x, P.y + 3, 8, ['#ffffff', hsl(hueNow(), 90, 80)], 25); } }
  else if(m === 'orbit'){ P.ring = 1 - P.ring; AU.swap(P.ring); P.sq = .25; }
  else if(m === 'beat') beatTap();
}
function beatTap(){
  let best = null, bd = 9;
  for(const it of G.items){ if(it.k !== 'note' || it.done) continue; const d = Math.abs(it.hitAt - G.t); if(d < bd){ bd = d; best = it; } }
  const P = G.P;
  if(!best || bd > .24){ AU.miss(); return; }
  best.done = true;
  if(best.bad){ hit(); pop('NOT THAT ONE!', P.x, P.y - 12, '#ff5a8a', 20); return; }
  if(bd < .1){ gain(best, 'perfect'); save.stats.perfects++; missionEvent('perfects', 1); }
  else gain(best, 'good');
  G.P.sq = .3;
}

/* ---------------- scoring ---------------- */
const MILES = [[10, 'NICE!'], [20, 'DREAMY!'], [35, 'MAGICAL!'], [50, 'UNREAL!'], [75, 'LEGENDARY!'], [100, 'KALEIDREAMY!!'], [150, 'BEYOND DREAMS!!'], [200, 'ARE YOU EVEN AWAKE?!']];
function gain(it, how){
  const P = G.P, pk = perk();
  let base = { star:10, candy:12, balloon:25, gem:40, hug:30, ice:25, bld:15, grey:20, dot:10, perfect:40, good:20, heart:20, crush:30 }[how || it.k] || 10;
  if(it.k === 'bld' && it.gold) base = 60;
  if(it.k === 'dot') base = 10 + Math.round(it.r * 4);
  let mul = 1;
  if(tw('disco') && (it.k === 'star' || it.k === 'candy')) mul *= 2;
  if(tw('rainbow')) mul *= 2; if(tw('turbo') && it.k === 'star') mul *= 2; if(tw('jelly')) mul *= 1.5; if(tw('splash') && it.k === 'star') mul *= 2;
  G.combo++; G.comboT = 2.4; G.bestCombo = Math.max(G.bestCombo, G.combo);
  const cm = 1 + Math.min(5, Math.floor(G.combo / 5) * .5);
  const v = Math.round(base * mul * cm * (1 + pk.score));
  G.score += v; G.collected++;
  G.dust += (it.k === 'gem' ? 3 : 1) * (1 + pk.dust);
  if(it.k === 'star' || it.k === 'candy'){ save.stats.stars++; missionEvent('stars', 1); }
  const x = it.x, y = it.y, col = how === 'perfect' ? '#ffe45a' : it.k === 'gem' ? '#8affff' : hsl(hueNow() + G.combo * 12, 95, 72);
  burst(x, y, it.k === 'bld' || how === 'perfect' ? 14 : 8, [col, '#ffffff', hsl(hueNow() + 120, 90, 70)], it.k === 'bld' ? 55 : 35, it.k === 'star' ? 'star' : 'dot');
  if(how === 'perfect') pop('PERFECT!', x, y - 8, '#ffe45a', 24); else if(how === 'good') pop('GOOD', x, y - 8, '#8affff', 18);
  else if(v >= 40 || G.combo % 5 === 0) pop('+' + v, x, y - 5, col, 16, .8);
  AU.collect(G.combo, it.k, how);
  // combo milestones: a big word, a flash and your emote
  const mi = MILES.findIndex(q => q[0] === G.combo);
  if(mi >= 0){ pop(MILES[mi][1], P.x, P.y - 16, hsl(hueNow() + 180, 100, 70), 30 + mi * 2, 1.5); G.flash = .35; G.flashC = '#ffffff'; face(save.emote, 1.5); AU.milestone(mi); if(mi >= 2) confetti(30); }
  missionEvent('combo', G.combo, true);
  if(G.boss && !G.boss.dead) G.bolts.push({ x, y, t:0, c:col });
}
function hit(){
  const P = G.P;
  if(G.inv > 0 || tw('ghost')) return;
  if(G.shield > 0){ G.shield--; G.inv = 1; pop('SHIELD!', P.x, P.y - 10, '#bff4ff', 22); AU.shield(); burst(P.x, P.y, 16, ['#ffffff', '#bff4ff']); return; }
  G.hearts--; G.inv = 1.6; G.combo = 0; G.hitShift = true; G.shake = .5; G.flash = .4; G.flashC = '#ff3a6a';
  save.stats.hits++;
  face('cry', 1.4); say(pick(SAY.hit)); AU.hit();
  burst(P.x, P.y, 18, ['#ff5a8a', '#ffffff', '#ffb0c8'], 50, 'heart');
  if(G.hearts <= 0) gameOver();
}
function gameOver(){ G.state = 'over'; G.endT = 0; face('dizzy', 9); AU.over(); endPlay(); }

/* ---------------- twists ---------------- */
function startTwist(force){
  let list = force ? [TW[force]] : twistsFor(G.mode).filter(t => t.id !== G.lastTwist);
  if(G.finale) list = list.filter(t => t.id !== 'portal');
  if(G.dur - G.t < 4) list = list.filter(t => t.id !== 'portal');
  if(G.hearts >= G.maxHearts) list = list.filter(t => t.id !== 'friend' || Math.random() < .5);
  const unseen = list.filter(t => !save.seen.t[t.id]);
  const t = force ? TW[force] : unseen.length && Math.random() < .45 ? pick(unseen) : pick(list);
  if(!t) return;
  const long = ['disco', 'rainbow', 'ghost', 'magnet', 'twin', 'turbo', 'storm', 'mega'].includes(t.id) ? 1 + perk().twist : 1;
  const dur = { jackpot:2.8, portal:1.8, friend:3, splash:4, freeze:4 }[t.id] || 4.5 * long;
  G.twist = { id:t.id, t:0, dur }; G.lastTwist = t.id; G.run.twists++;
  save.stats.twists++; missionEvent('twists', 1);
  const isNew = !save.seen.t[t.id];
  if(isNew){ save.seen.t[t.id] = 1; G.run.newFinds.push(t.name); missionEvent('new', 1); }
  twistBanner(t, isNew);
  AU.twist(t.id);
  face(['flip', 'mirror', 'jelly'].includes(t.id) ? 'dizzy' : t.id === 'friend' ? 'love' : 'wow', 1.3);
  if(Math.random() < .5) say(pick(SAY.twist));
  const P = G.P, w = WW(), h = HH();
  if(t.id === 'jackpot'){ const syms = ['★', '♥', '♦', '7', '☾']; const r = Math.random(); let res; if(r < .3){ const s = pick(syms); res = [s, s, s]; } else if(r < .78){ const s = pick(syms), o = pick(syms.filter(x => x !== s)); res = [s, s, o]; res.sort(() => Math.random() - .5); } else { res = syms.slice().sort(() => Math.random() - .5).slice(0, 3); } G.jack = { res, t:0, stop:[.9, 1.45, 2], paid:false }; AU.jackSpin(); }
  else if(t.id === 'friend'){ const c = pick(CHARS.filter(c => c.id !== save.char)); const side = Math.random() < .5 ? -1 : 1; G.friend = { c, x:side < 0 ? -12 : w + 12, y:rnd(h * .2, h * .5), side, t:0, gave:false, face:pick(['love', 'happy', 'wink', 'laugh']), line:pick(['HI!!', 'CATCH!', 'FOR YOU!', 'I MADE THIS', 'YOU DROPPED THIS', 'SURPRISE!']) }; }
  else if(t.id === 'splash'){ G.hueOff += rndi(90, 200); for(let i = 0; i < 10; i++) burst(rnd(0, w), rnd(0, h), 10, [hsl(hueNow(), 95, 60), hsl(hueNow() + 60, 95, 65)], 60); G.flash = .3; G.flashC = hsl(hueNow(), 90, 70); }
  else if(t.id === 'party') confetti(80);
  else if(t.id === 'twin') G.clone = { x:P.x, y:P.y };
  else if(t.id === 'critter' || t.id === 'freeze') for(const it of G.items) if(it.k === 'haz') it.k2 = t.id;
  else if(t.id === 'portal') AU.portal();
}
function endTwist(){
  const t = G.twist; if(!t) return;
  if(t.id === 'critter' || t.id === 'freeze') for(const it of G.items) if(it.k === 'haz') it.k2 = null;
  if(t.id === 'twin') G.clone = null;
  G.twist = null; G.jack = null; G.friend = null;
  G.twistCD = rnd(1.4, 3.2) * (G.lvl <= 2 ? 1.3 : 1);
}
function updateTwist(dt){
  const T = G.twist, P = G.P, w = WW(), h = HH();
  if(!T){ if(G.t > 1 && (G.twistCD -= dt) <= 0) startTwist(); return; }
  T.t += dt;
  const id = T.id;
  if(id === 'candy' && Math.random() < dt * 9) add('candy', rnd(4, w - 4), -4, rnd(-4, 4), rnd(28, 45), { r:2.4, hue:rndi(0, 360) });
  if(id === 'party' && Math.random() < dt * 4) add('balloon', rnd(8, w - 8), h + 8, rnd(-3, 3), -rnd(16, 24), { r:3.6, hue:rndi(0, 360) });
  if(id === 'meteor' && Math.random() < dt * 2.6){ const x = rnd(w * .1, w * 1.1); add('haz', x, -8, -rnd(12, 22), rnd(55, 70), { r:4.4, look:'meteor' }); if(Math.random() < .4) add('gem', rnd(8, w - 8), -4, 0, rnd(22, 30), { r:2.6 }); }
  if(id === 'storm' && Math.random() < dt * 7) spawnStar(G.mode === 'beat' ? 'dodge' : G.mode);
  if(id === 'magnet') for(const it of G.items) if(['star', 'candy', 'gem'].includes(it.k)){ const dx = P.x - it.x, dy = P.y - it.y, d = Math.hypot(dx, dy); if(d < 40 && d > .1){ it.x += dx / d * 70 * dt; it.y += dy / d * 70 * dt; if(G.mode === 'orbit') it.pulled = true; } }
  if(id === 'twin' && G.clone){ const c = G.clone; if(['fly', 'run', 'smash'].includes(G.mode)){ c.x = P.x + 14; c.y = h - P.y; } else if(G.mode === 'orbit'){ const mm = Math.min(w, h), R = P.ring ? mm * .2 : mm * .36; c.x = w / 2 + Math.cos(P.ang) * R; c.y = h / 2 + Math.sin(P.ang) * R; } else { c.x = w - P.x; c.y = P.y; } }
  if(id === 'jackpot' && G.jack){ const J = G.jack; J.t += dt; for(let i = 0; i < 3; i++) if(!J['s' + i] && J.t >= J.stop[i]){ J['s' + i] = 1; AU.reelStop(i); } if(!J.paid && J.t >= 2.1){ J.paid = true; payJackpot(J.res); } }
  if(id === 'friend' && G.friend){ const F = G.friend; F.t += dt; const tx = P.x - F.side * 12, ty = P.y - 14; F.x = lerp(F.x, F.t < 2 ? tx : F.x + F.side * -80, dt * (F.t < 2 ? 4 : 1)); F.y = lerp(F.y, ty, dt * 4);
    if(!F.gave && F.t > 1.1){ F.gave = true; const g = G.hearts < G.maxHearts ? 'heart' : Math.random() < .6 ? 'dust' : 'shard'; add('gift', F.x, F.y, 0, 0, { g, r:3, home:true }); AU.gift(); } }
  if(id === 'portal' && T.t >= T.dur){ G.score += 150; G.dust += 20; pop('SHORTCUT! +150', P.x, P.y - 12, '#d8a0ff', 26, 1.4); G.flash = .6; G.flashC = '#d8a0ff'; endTwist(); G.t = G.dur; return; }
  if(T.t >= T.dur) endTwist();
}
function payJackpot(r){
  const P = G.P; let txt, c = '#ffd23a';
  if(r[0] === r[1] && r[1] === r[2]){
    const s = r[0];
    if(s === '7'){ G.score += 777; G.dust += 77; txt = 'JACKPOT!! +777'; }
    else if(s === '♦'){ G.shards += 3; txt = '+3 CRYSTALS!'; c = '#8affff'; }
    else if(s === '♥'){ G.hearts = Math.min(G.maxHearts + 1, G.hearts + 1); G.maxHearts = Math.max(G.maxHearts, G.hearts); txt = '+1 HEART!'; c = '#ff7ab0'; }
    else if(s === '★'){ G.dust += 60; G.score += 300; txt = 'STAR TRIPLE! +60 DUST'; }
    else { G.inv = 3.5; G.dust += 40; txt = 'MOON LUCK! +40 DUST'; c = '#d8c8ff'; }
    confetti(90); G.flash = .5; G.flashC = '#fff4b0'; face('starry', 2); AU.jackWin(2); SDK.happytime();
  } else if(r[0] === r[1] || r[1] === r[2] || r[0] === r[2]){ G.dust += 25; G.score += 100; txt = 'PAIR! +25 DUST'; AU.jackWin(1); face('cool', 1.4); }
  else { G.dust += 8; txt = 'SO CLOSE! +8 DUST'; c = '#bfe0ff'; AU.jackWin(0); }
  pop(txt, P.x, P.y - 14, c, 24, 1.6);
}

/* ---------------- boss ---------------- */
function updateBoss(dt){
  const B = G.boss; if(!B) return;
  const w = WW(), h = HH();
  B.t += dt; B.hurt = Math.max(0, B.hurt - dt * 3);
  const port = w < h, hx = port ? w * .5 : w * .8, hy = port ? h * .13 : h * .22;
  if(B.dead){ B.dead += dt; B.y -= dt * 4; if(B.dead > 2.2 && G.state === 'play'){ G.state = 'clear'; G.endT = 0; } return; }
  B.x = lerp(B.x, hx + Math.sin(B.t * .9) * (port ? w * .25 : 10), dt * 2); B.y = lerp(B.y, hy + Math.cos(B.t * 1.3) * 4, dt * 2);
  // the nightmare throws its own trouble into the dream
  if((B.atk -= dt) <= 0 && G.state === 'play'){
    B.atk = rnd(1.8, 2.8) / (1 + G.lvl * .02); B.mood = 'angry';
    const m = G.mode, s = G.spd;
    if(m === 'fly' || m === 'smash') add(m === 'smash' ? 'bld' : 'haz', w + 5, G.P.y + rnd(-6, 6), -45 * s, 0, m === 'smash' ? { r:4, look:1 } : { r:5, look:'cloud' });
    else if(m === 'run') add('haz', w + 5, h * .8 - 3.5, -58 * s, 0, { r:3.5, look:'spike' });
    else if(m === 'orbit') orbPos(add('haz', 0, 0, 0, 0, { ang:G.P.ang + 2, ring:G.P.ring, life:4, r:3.2, look:'spike' }));
    else if(m === 'dive') add('haz', G.P.x + rnd(-10, 10), h + 5, 0, -50 * s, { r:4, look:'urchin' });
    else { const a = Math.atan2(G.P.y - B.y, G.P.x - B.x); for(let k = -1; k <= 1; k++) add('haz', B.x, B.y, Math.cos(a + k * .35) * 34, Math.sin(a + k * .35) * 34, { r:2.6, look:'drop', life:6 }); }
    if(Math.random() < .35) bossTalk();
  }
  for(const b of G.bolts){
    b.t += dt * 1.6; const k = Math.min(1, b.t);
    b.cx = lerp(b.x, B.x, k * k); b.cy = lerp(b.y, B.y, k) - Math.sin(k * Math.PI) * 18;
    if(b.t >= 1 && !b.hit){ b.hit = true; B.hp--; B.hurt = 1; AU.bossHit(); burst(B.x + rnd(-6, 6), B.y + rnd(-6, 6), 6, [b.c, '#ffffff'], 40, 'star');
      if(B.hp <= 0 && !B.dead){ B.dead = .01; bossDown(); } }
  }
  G.bolts = G.bolts.filter(b => !b.hit);
}
function bossTalk(){ const B = G.boss; B.say = pick(['WAKE UP!', 'BEEP BEEP BEEP', 'MONDAY IS COMING', 'NO MORE DREAMING!', 'YOU FORGOT YOUR HOMEWORK', 'I AM SO SCARY', 'BOO?', 'GRRR']); B.sayT = 1.6; }
function bossDown(){
  const B = G.boss; B.say = pick(['NOOOOO!', 'FINE. SLEEP IN.', 'I WILL BE BACK... TOMORROW']); B.sayT = 2;
  for(let i = 0; i < 5; i++) burst(B.x + rnd(-10, 10), B.y + rnd(-10, 10), 25, [B.col, '#ffffff', '#ffe45a', '#ff5ad0'], 80, 'star');
  confetti(140); G.flash = .8; G.flashC = '#ffffff'; G.shake = .6; face('starry', 4);
  G.items = G.items.filter(i => i.k !== 'haz');
  save.stats.bosses++; missionEvent('bosses', 1); AU.bossDie(); SDK.happytime();
}

/* ---------------- main update ---------------- */
function update(dt){
  G.rt += dt;
  for(const p of G.parts){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.vx *= .985; p.l -= dt; p.rot += dt * 3; }
  G.parts = G.parts.filter(p => p.l > 0);
  for(const p of G.pops){ p.t += dt; p.y -= 8 * dt; } G.pops = G.pops.filter(p => p.t < p.d);
  G.shake *= Math.pow(.03, dt); if(G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.6);
  const P = G.P;
  if(P.faceT > 0 && (P.faceT -= dt) <= 0) P.face = 'happy';
  if(P.sayT > 0) P.sayT -= dt;
  if(G.boss && G.boss.sayT > 0) G.boss.sayT -= dt;
  if(G.state === 'title'){
    // the title floats in a dream: sweets, stars and balloons drift by
    const w = WW(), h = HH();
    while(G.items.length < 16){ const k = pick(['star', 'star', 'candy', 'balloon', 'gem', 'note2']); G.items.push({ k:k === 'note2' ? 'star' : k, x:rnd(0, w), y:G.items.length < 15 && !G.titleInit ? rnd(0, h) : h + 8, vx:rnd(-3, 3), vy:-rnd(4, 10), r:rnd(2, 3.4), ph:rnd(0, TAU), hue:rndi(0, 360), life:99 }); }
    G.titleInit = true;
    for(const it of G.items){ it.x += it.vx * dt; it.y += it.vy * dt; it.ph += dt * 2; }
    G.items = G.items.filter(it => it.y > -10);
    return;
  }
  if(G.state === 'shift'){
    const K = G.kalei; K.t += dt;
    if(!K.switched && K.t >= K.d * .45){ K.switched = true; enterMode(K.next); }
    if(K.t >= K.d){ G.state = 'play'; G.kalei = null; beginPlay(); }
    return;
  }
  if(G.state === 'clear' || G.state === 'over'){
    G.endT += dt;
    if(G.state === 'over'){ P.y += dt * 20; P.sc = Math.max(.3, P.sc - dt * .3); }
    if(G.state === 'clear' && Math.random() < dt * 6) confetti(4);
    if(G.endT > (G.state === 'clear' ? 1.6 : 1.4) && !G.shown){ G.shown = true; showResults(G.state === 'clear'); }
    return;
  }
  if(G.state !== 'play') return;
  const dtW = dt * tf(), w = WW(), h = HH(), m = G.mode;
  G.t += dt;
  if(G.inv > 0) G.inv -= dt;
  if(G.comboT > 0 && (G.comboT -= dt) <= 0) G.combo = 0;
  updateTwist(dt);
  if(G.state !== 'play') return;
  // player size: tiny / mega / big head, and grow mode keeps its own size
  const scT = tw('tiny') ? .55 : tw('mega') ? 1.8 : 1;
  P.sc = lerp(P.sc, scT, dt * 6); P.r = P.baseR * P.sc * (tw('bighead') ? 1.25 : 1);
  P.sq = Math.max(0, P.sq - dt * 2);
  // steering target from the pointer / keys
  const steer = (maxV, xOnly, yOnly) => { const mx = maxV * dt; if(!yOnly) P.x += clamp(G.tx - P.x, -mx, mx); if(!xOnly) P.y += clamp(G.ty - P.y, -mx, mx); P.x = clamp(P.x, P.r, w - P.r); P.y = clamp(P.y, P.r + 4, h - P.r); };
  if(m === 'fly'){
    P.vy = Math.min(80, P.vy + 150 * dtW); P.y += P.vy * dtW;
    if(P.y < P.r + 3){ P.y = P.r + 3; P.vy = 0; } if(P.y > h - P.r){ P.y = h - P.r; P.vy = -45; AU.boing(); }
  } else if(m === 'run'){
    const gy = h * .8; P.vy += 300 * dtW; P.y += P.vy * dtW;
    if(P.y >= gy - P.r){ if(P.vy > 60) { P.sq = .2; } P.y = gy - P.r; P.vy = 0; P.jumps = 0; }
  } else if(m === 'orbit'){
    const mm = Math.min(w, h); P.ang += 1.5 * G.spd * dtW; P.rr = lerp(P.rr, P.ring ? mm * .36 : mm * .2, dt * 12);
    P.x = w / 2 + Math.cos(P.ang) * P.rr; P.y = h / 2 + Math.sin(P.ang) * P.rr;
  } else if(m === 'dive'){ steer(170, true); P.y = lerp(P.y, h * .28, dt * 3); }
  else if(m === 'smash'){ steer(150, false, true); P.x = lerp(P.x, w * .26, dt * 3); }
  else if(m === 'beat'){ P.x = w / 2; P.y = h / 2; }
  else steer(m === 'grow' ? 120 : 150);
  // spawns
  if(m === 'beat') beatSpawn();
  else if((G.spawnT -= dtW) <= 0) spawnMode();
  // item motion
  const frozen = tw('freeze');
  for(const it of G.items){
    it.ph += dt * 4;
    if(it.life < 99) it.life -= dtW;
    if(it.k === 'haz' && frozen) continue;
    if(it.ang !== undefined && !it.pulled){ orbPos(it); continue; }
    if(it.k === 'note'){ const k = (it.hitAt - G.t) / 1.4; it.x = w / 2 + Math.cos(it.dir) * k * Math.min(w, h) * .55; it.y = h / 2 + Math.sin(it.dir) * k * Math.min(w, h) * .55; continue; }
    if(it.k === 'gift' && it.home){ const dx = P.x - it.x, dy = P.y - it.y, d = Math.hypot(dx, dy) || 1; it.x += dx / d * 55 * dt; it.y += dy / d * 55 * dt; continue; }
    it.x += it.vx * dtW; it.y += it.vy * dtW;
    if(it.k === 'grey' || it.k === 'dot' || it.bounce){ if(it.x < it.r || it.x > w - it.r) { it.vx = -it.vx; it.x = clamp(it.x, it.r, w - it.r); } if(it.y < it.r + 6 || it.y > h - it.r){ it.vy = -it.vy; it.y = clamp(it.y, it.r + 6, h - it.r); } if(it.k === 'dot' && Math.random() < dt * .5){ const sp = it.r >= P.r * .92 ? 7 : 12; it.vx = rnd(-sp, sp); it.vy = rnd(-sp, sp); } }
    if(it.look === 'bat') it.y += Math.sin(it.ph * .8) * 6 * dtW;
  }
  // collisions
  const hits = (it, x, y, r) => Math.hypot(it.x - x, it.y - y) < r * (it.k === 'haz' ? .8 : 1) + it.r * (it.k === 'haz' ? .68 : .9);
  for(const it of G.items){
    if(it.gone || it.k === 'note') continue;
    const touch = hits(it, P.x, P.y, P.r);
    const ct = G.clone && hits(it, G.clone.x, G.clone.y, P.r) && ['star', 'candy', 'balloon', 'gem'].includes(it.k);
    if(!touch && !ct) continue;
    if(it.k === 'haz'){
      if(!touch) continue;
      if(it.k2 === 'critter'){ it.gone = true; gain(it, 'hug'); pop('HUG!', it.x, it.y - 6, '#ff9ab0', 18); burst(it.x, it.y, 10, ['#ff9ab0', '#ffffff'], 30, 'heart'); }
      else if(it.k2 === 'freeze'){ it.gone = true; gain(it, 'ice'); burst(it.x, it.y, 12, ['#dff8ff', '#ffffff', '#8ad8ff'], 45); AU.ice(); }
      else if(tw('mega')){ it.gone = true; gain(it, 'crush'); G.shake = .25; AU.smash(); }
      else if(G.inv <= 0 && !tw('ghost')){ it.gone = true; hit(); }
    } else if(it.k === 'bld'){ it.gone = true; gain(it); save.stats.smashed++; missionEvent('smashed', 1); G.shake = Math.max(G.shake, .18); AU.smash(); for(let i = 0; i < 6; i++) G.parts.push({ x:it.x, y:it.y, vx:rnd(-30, 30), vy:rnd(-40, -10), l:.8, ml:.8, c:pick(['#ff8a6a', '#ffe45a', '#8ad8ff', '#ffffff']), s:rnd(1, 2), sh:'dot', g:90, rot:0 }); }
    else if(it.k === 'grey'){ if(!it.painted){ it.painted = true; it.life = .5; it.hue = hueNow() + rndi(0, 200); G.paintedShift++; gain(it); save.stats.painted++; missionEvent('painted', 1); AU.paint(); } }
    else if(it.k === 'dot'){
      if(!touch) continue;
      if(it.r < P.r * .92){ it.gone = true; gain(it); P.baseR = Math.min(15, P.baseR + it.r * .09); save.stats.eaten++; missionEvent('eaten', 1); AU.eat(it.r); P.sq = .25; }
      else if(G.inv <= 0 && !tw('ghost')){ const dx = it.x - P.x, dy = it.y - P.y, d = Math.hypot(dx, dy) || 1; it.vx = dx / d * 40; it.vy = dy / d * 40; hit(); }
    }
    else if(it.k === 'gift'){ it.gone = true; if(it.g === 'heart'){ G.hearts = Math.min(G.maxHearts, G.hearts + 1); pop('+1 HEART', P.x, P.y - 12, '#ff7ab0', 22); AU.heart(); } else if(it.g === 'dust'){ const d = rndi(40, 80); G.dust += d; pop('+' + d + ' DUST', P.x, P.y - 12, '#ffe45a', 22); AU.jackWin(1); } else { const s = rndi(1, 2); G.shards += s; pop('+' + s + ' CRYSTAL' + (s > 1 ? 'S' : ''), P.x, P.y - 12, '#8affff', 22); AU.jackWin(1); } burst(P.x, P.y, 20, ['#ffffff', '#ffe45a', '#ff9ad8'], 50, 'heart'); }
    else { it.gone = true; if(it.k === 'gem'){ G.shards += perk().luck ? 2 : 1; pop('CRYSTAL!', it.x, it.y - 6, '#8affff', 18); } gain(it); }
  }
  // beat notes that were missed
  if(m === 'beat') for(const it of G.items){ if(it.k === 'note' && !it.done && G.t - it.hitAt > .24){ it.done = true; if(!it.bad){ G.combo = 0; pop('MISS', w / 2, h / 2 - 12, '#8a9ab0', 16, .6); } } }
  // tidy up
  G.items = G.items.filter(it => !it.gone && !(it.k === 'note' && it.done) && it.life > 0 && it.x > -30 && it.x < w + 40 && it.y > -40 && it.y < h + 40);
  updateBoss(dt);
  // trail
  if((G.trailT = (G.trailT || 0) - dt) <= 0){ G.trailT = .035; trailParticle(); }
  if(m === 'paint'){ G.paintLine.push({ x:P.x, y:P.y, h:hueNow() + G.rt * 200 }); if(G.paintLine.length > 70) G.paintLine.shift(); }
  if(G.t >= G.dur && !G.finale){ endTwist(); nextShift(); }
}
function beatSpawn(){
  const bi = .5 / (1 + (G.spd - 1) * .45);
  while(G.nextNote - 1.4 <= G.t){
    const at = G.nextNote;
    if(at < G.dur - .3){
      const bad = G.lvl >= 7 && Math.random() < .15;
      add('note', -99, -99, 0, 0, { hitAt:at, dir:rndi(0, 7) * TAU / 8, bad, r:3.2, hue:rndi(0, 360) });
    }
    G.nextNote += bi * (Math.random() < .2 + Math.min(.25, G.lvl * .02) ? .5 : Math.random() < .25 ? 2 : 1);
  }
  // a soft click as each note arrives keeps the groove audible
  for(const it of G.items) if(it.k === 'note' && !it.clicked && G.t >= it.hitAt){ it.clicked = true; AU.tick(it.bad); }
}
function trailParticle(){
  const P = G.P, tr = save.trail, h = hueNow();
  if(G.state !== 'play') return;
  const p = { x:P.x + rnd(-1, 1), y:P.y + rnd(-1, 1), vx:rnd(-6, 6), vy:rnd(-6, 6), l:.7, ml:.7, s:rnd(.8, 1.4), rot:0, g:0, sh:'dot', c:'#fff' };
  if(G.mode === 'fly' || G.mode === 'run' || G.mode === 'smash'){ p.vx -= 30; }
  if(G.mode === 'dive') p.vy -= 30;
  if(tw('rainbow') || tr === 'rainbow'){ p.c = hsl(G.rt * 400, 95, 65); p.s = 2.2; p.l = p.ml = .5; }
  else if(tr === 'sparkle'){ p.c = pick(['#ffffff', hsl(h, 90, 80)]); p.sh = 'star'; }
  else if(tr === 'bubbles'){ p.c = '#dff8ff'; p.sh = 'ring'; p.vy -= 10; }
  else if(tr === 'hearts'){ p.c = pick(['#ff7ab0', '#ffb0d0']); p.sh = 'heart'; }
  else if(tr === 'notes'){ p.c = pick(['#ffffff', '#ffe45a', '#8affff']); p.sh = 'note'; p.l = p.ml = .9; }
  else if(tr === 'snow'){ p.c = '#ffffff'; p.sh = 'snow'; }
  else if(tr === 'fire'){ p.c = pick(['#ffe45a', '#ff8a2a', '#ff4a2a']); p.vy -= 18; p.s = 1.8; }
  else if(tr === 'confetti'){ p.c = hsl(rndi(0, 360), 95, 62); p.sh = 'conf'; }
  else if(tr === 'galaxy'){ p.c = pick(['#b08aff', '#5a6aff', '#ffffff', '#ff8ae0']); p.sh = pick(['star', 'dot']); p.s = 1.5; }
  G.parts.push(p);
}

/* ---------------- rewards ---------------- */
function runRewards(win){
  const pk = perk(), first = win && G.lvl >= save.lvl;
  let dust = Math.round(G.dust), shards = G.shards, gold = 0;
  let bonus = 0;
  if(win){ bonus = 30 + G.lvl * 8; dust += bonus; if(first){ shards += 2; if(G.lvl % 3 === 0) gold = 1; } }
  const lost = G.maxHearts - G.hearts, stars = win ? (lost === 0 ? 3 : lost === 1 ? 2 : 1) : 0;
  save.dust += dust; save.shards += shards; save.gold += gold;
  if(win){
    save.stats.clears++; missionEvent('clears', 1);
    save.stars[G.lvl] = Math.max(save.stars[G.lvl] || 0, stars);
    if(G.lvl >= save.lvl){ save.lvl = G.lvl + 1; }
    save.sel = Math.min(save.lvl, G.lvl + 1);
  }
  save.stats.bestCombo = Math.max(save.stats.bestCombo, G.bestCombo);
  save.stats.best = Math.max(save.stats.best, G.score);
  persist();
  return { dust, shards, gold, bonus, stars, first, newFinds:G.run.newFinds.slice() };
}
function continueRun(){
  G.cont = true; G.hearts = Math.max(2, Math.ceil(G.maxHearts / 2)); G.inv = 2.5; G.state = 'play'; G.shown = false;
  G.P.sc = 1; G.P.face = 'cool'; G.items = G.items.filter(i => i.k !== 'haz');
  if(G.mode === 'fly') G.P.y = HH() * .45; if(G.mode === 'run') G.P.y = HH() * .8 - G.P.r;
  if(G.mode === 'dodge' || G.mode === 'paint' || G.mode === 'grow') { G.P.y = clamp(G.P.y, 10, HH() - 10); }
  G.P.vy = 0; say('ONE MORE TRY!');
  beginPlay();
}
