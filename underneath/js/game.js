'use strict';
/* =====================================================================
   UNDERNEATH simulation.
   A painting sits under layers of dust, grime and stone. Every cell you
   scrub away pays out; treasure, creatures and a keyhole hide in the
   picture. Tap the keyhole to dive INTO the painting, into the world
   painted beneath it. Hidden gestures and secrets are never explained,
   only hinted at by riddles.
   ===================================================================== */
const G = {
  state:'title', C:null, t:0, rt:0,
  parts:[], pops:[], fly:[], moths:[], whirls:[], bolts:[], drops:[],
  streakT:0, lastScrub:-9, mult:1, frameCleared:0, chimeAcc:0, chimeT:0,
  ptr:{ down:false, id:-1, sx:0, sy:0, wx:0, wy:0, lwx:0, lwy:0, stillT:0, moved:0, path:[] },
  sonar:null, sonarT:4, eye:null, eyeT:45, goldT:0, rainT:0, blastC:0, blastArmed:false,
  cd:{ whirl:0, zig:0, drill:0, rain:0 }, dive:null, rate:0, rateAcc:0, rateT:0, shake:0, flash:0,
  view:{ x:0, y:0, s:1 },
};
let C = null;          // the canvas being restored

const depthMult = d => Math.pow(1.45, d - 1);
function relicCount(){ let n = 0; for(const k in save.relics) if(save.relics[k] === 15) n++; return n; }
function baseVal(){
  const kindM = C.kind === 'daily' ? 3 : C.kind === 'vault' ? 4 : C.kind === 'mini' ? 2.5 : 1;
  return .012 * depthMult(C.depth) * Math.pow(1.25, save.up.value) * (1 + relicCount() * .25) * kindM * (G.goldT > 0 ? 5 : 1);
}
function gain(v){ save.dust += v; save.earned += v; G.rateAcc += v; }

/* ---------------- canvas generation ---------------- */
const TAPPABLE = { critter:1, key:1, exit:1, glyph:1, mini:1, sign:1 };
const GLYPHS = ['◆', '●', '▲', '★', '☾', '✚'];
function genCanvas(seed, depth, kind){
  const R = mulberry32(seed), bi = (depth - 1) % 8;
  const B = kind === 'vault' ? BIOMES[7] : kind === 'mini' ? BIOMES[(R() * 8) | 0] : BIOMES[bi];
  const c = { hm:kind === 'vault' || kind === 'mini' ? hpMul(depth) * .6 : hpMul(depth), seed, depth, kind, B, bi:BIOMES.indexOf(B), finds:[], cleared:0, total:GN * GN, master:false, glyphTaps:[], drills:0 };
  c.base = mkCanvas(PW); const g = c.base.getContext('2d');
  (kind === 'vault' ? PAINT.vault : PAINT[B.id])(g, R);
  // grime
  c.cover = mkCanvas(PW); const cg = c.cover.getContext('2d');
  const tex = coverTextures(B);
  c.hp = new Float32Array(GN * GN); c.lay = new Uint8Array(GN * GN); c.cellFind = new Int16Array(GN * GN).fill(-1);
  const n1 = noise2(R, 10), n2 = noise2(R, 36);
  const stone = kind === 'vault' ? 0 : clamp(.06 + (depth - 1) * .045, .06, .5), grime = kind === 'vault' ? .2 : .38;
  cg.drawImage(tex[0], 0, 0);
  for(let y = 0; y < GN; y++) for(let x = 0; x < GN; x++){
    const i = y * GN + x, v = n1(x / GN * 10, y / GN * 10) * .72 + n2(x / GN * 36, y / GN * 36) * .28;
    const L = v > 1 - stone * 1.35 ? 2 : v > 1 - stone * 1.35 - grime ? 1 : 0;
    c.lay[i] = L; c.hp[i] = [4, 8, 16][L] * c.hm;
    if(L) cg.drawImage(tex[L], x * CS, y * CS, CS, CS, x * CS, y * CS, CS, CS);
  }
  // treasure
  const place = (type, r, extra) => {
    for(let k = 0; k < 80; k++){
      const x = r + 18 + R() * (PW - 2 * r - 36), y = r + 18 + R() * (PW - 2 * r - 36);
      if(c.finds.some(f => Math.hypot(f.x - x, f.y - y) < f.r + r + 6)) continue;
      const f = Object.assign({ id:c.finds.length, type, x, y, r, st:0, rev:0, n:0 }, extra || {});
      c.finds.push(f); return f;
    }
    return null;
  };
  const luck = save.up.luck;
  const sign = { id:0, type:'sign', x:PW - 64, y:PW - 30, r:26, st:0, rev:0, n:0, taps:0 }; c.finds.push(sign);
  g.save(); g.font = 'italic 700 22px Georgia, serif'; g.fillStyle = rgba('#2a1a0a', .75); g.textAlign = 'center'; g.fillText('~ Vesna', sign.x, sign.y + 7); g.restore();
  if(kind === 'main' || kind === 'daily'){
    place(kind === 'daily' ? 'exit' : 'key', 30);
    const B0 = BIOMES[bi], nCr = kind === 'daily' ? 3 : 2;
    for(let k = 0; k < nCr; k++){ const cr = B0.critters[(R() * 4) | 0]; const shiny = (kind === 'daily' && k === 0) || R() < .03 * (1 + luck * .25); place('critter', 24, { cid:cr[0], e:cr[1], name:cr[2], shiny }); }
    const have = save.relics[bi] || 0;
    if(have !== 15 && R() < .6 + luck * .02){ let p = 0; while(have & (1 << p)) p++; place('relic', 20, { piece:p, bi }); }
    if(depth >= 2 && R() < .45){
      const syms = GLYPHS.slice().sort(() => R() - .5).slice(0, 3), order = syms.slice().sort(() => R() - .5);
      const fr = place('frieze', 66);
      if(fr){
        c.order = order;
        g.save(); g.translate(fr.x, fr.y);
        g.fillStyle = '#8a8272'; g.fillRect(-64, -26, 128, 52); g.strokeStyle = '#4a4438'; g.lineWidth = 4; g.strokeRect(-64, -26, 128, 52);
        g.fillStyle = '#2a261e'; g.font = '900 28px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        order.forEach((s, i) => g.fillText(s, -40 + i * 40, 2));
        g.restore();
        syms.forEach(s => place('glyph', 20, { sym:s }));
      }
    }
    if(R() < .14 + luck * .01) place('mini', 22);
    const nG = 8 + luck, nC = 40 + luck * 2;
    for(let k = 0; k < nG; k++) place('gem', 15, { col:['#ff4a6a', '#4ad8ff', '#8aff5a', '#c86aff', '#ffd23a'][(R() * 5) | 0] });
    for(let k = 0; k < nC; k++) place('coin', 13);
  } else {
    place('exit', 30);
    if(kind === 'mini') for(let k = 0; k < 2; k++){ const cr = c.B.critters[(R() * 4) | 0]; place('critter', 24, { cid:cr[0], e:cr[1], name:cr[2], shiny:R() < .2 }); }
    const nG = kind === 'vault' ? 26 : 14, nC = kind === 'vault' ? 110 : 55;
    for(let k = 0; k < nG; k++) place('gem', 15, { col:['#ff4a6a', '#4ad8ff', '#8aff5a', '#c86aff', '#ffd23a'][(R() * 5) | 0] });
    for(let k = 0; k < nC; k++) place('coin', 13);
  }
  // map cells to treasure
  for(const f of c.finds){
    const x0 = Math.max(0, ((f.x - f.r) / CS) | 0), x1 = Math.min(GN - 1, ((f.x + f.r) / CS) | 0), y0 = Math.max(0, ((f.y - f.r) / CS) | 0), y1 = Math.min(GN - 1, ((f.y + f.r) / CS) | 0);
    for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){ if(Math.hypot(x * CS + CS / 2 - f.x, y * CS + CS / 2 - f.y) <= f.r){ const i = y * GN + x; if(c.cellFind[i] < 0){ c.cellFind[i] = f.id; f.n++; } } }
    f.th = Math.max(1, Math.ceil(f.n * (TAPPABLE[f.type] ? .5 : .55)));
  }
  return c;
}

/* ---------------- save / restore the canvas in progress ---------------- */
let mainSnap = null;
function snapCanvas(){
  if(!C || C.kind !== 'main') return;
  const bits = new Uint8Array(Math.ceil(GN * GN / 8));
  for(let i = 0; i < GN * GN; i++) if(C.hp[i] <= 0) bits[i >> 3] |= 1 << (i & 7);
  let s = ''; for(let i = 0; i < bits.length; i += 4096) s += String.fromCharCode.apply(null, bits.subarray(i, i + 4096));
  save.canvas = { seed:C.seed, depth:C.depth, bits:btoa(s), got:C.finds.filter(f => f.st === 2).map(f => f.id), master:C.master };
}
function restoreCanvas(sc){
  const c = genCanvas(sc.seed, sc.depth, 'main');
  let bits = null; try{ const s = atob(sc.bits || ''); bits = new Uint8Array(s.length); for(let i = 0; i < s.length; i++) bits[i] = s.charCodeAt(i); }catch(e){}
  const cg = c.cover.getContext('2d');
  if(bits) for(let i = 0; i < GN * GN; i++) if(bits[i >> 3] & (1 << (i & 7))){ c.hp[i] = 0; c.cleared++; cg.clearRect((i % GN) * CS, ((i / GN) | 0) * CS, CS, CS); const f = c.cellFind[i]; if(f >= 0) c.finds[f].rev++; }
  const got = new Set(sc.got || []);
  for(const f of c.finds){ if(got.has(f.id)) f.st = 2; else if(f.rev >= f.th){ f.st = TAPPABLE[f.type] ? 1 : 2; f.t0 = 0; } }
  c.master = !!sc.master;
  return c;
}
function newMainCanvas(){
  C = genCanvas((Math.random() * 4294967296) >>> 0, save.depth, 'main');
  G.C = C; snapCanvas();
}

/* ---------------- scrubbing ---------------- */
function brushAt(x, y, r, dmg, src){
  const x0 = Math.max(0, ((x - r) / CS) | 0), x1 = Math.min(GN - 1, ((x + r) / CS) | 0), y0 = Math.max(0, ((y - r) / CS) | 0), y1 = Math.min(GN - 1, ((y + r) / CS) | 0), r2 = r * r;
  for(let cy = y0; cy <= y1; cy++){ const dy = cy * CS + CS / 2 - y; for(let cx = x0; cx <= x1; cx++){ const dx = cx * CS + CS / 2 - x; if(dx * dx + dy * dy <= r2) hitCell(cy * GN + cx, dmg, src); } }
}
let _cg = null, _tex = null;
function hitCell(i, dmg, src){
  const hp = C.hp;
  if(hp[i] <= 0) return;
  hp[i] -= dmg;
  if(hp[i] <= 0){ clearCell(i, src); return; }
  const L = hp[i] > 8 * C.hm ? 2 : hp[i] > 4 * C.hm ? 1 : 0;
  if(L !== C.lay[i]){ C.lay[i] = L; const x = (i % GN) * CS, y = ((i / GN) | 0) * CS; _cg.clearRect(x, y, CS, CS); _cg.drawImage(_tex[L], x, y, CS, CS, x, y, CS, CS); }
}
function clearCell(i, src){
  const L = C.lay[i];
  C.hp[i] = 0; C.cleared++; save.stats.cells++;
  const x = (i % GN) * CS, y = ((i / GN) | 0) * CS;
  _cg.clearRect(x, y, CS, CS);
  gain(baseVal() * (src === 'moth' ? 1 : G.mult));
  G.frameCleared++;
  if(G.parts.length < (save.opt.fx === 'low' ? 120 : 420) && Math.random() < (src === 'moth' ? .05 : .22)) G.parts.push({ x:x + 2, y:y + 2, vx:rnd(-60, 60), vy:rnd(-90, 10), g:260, l:rnd(.3, .7), c:C.B.cover[L], s:rnd(1.5, 3.5) });
  const f = C.cellFind[i];
  if(f >= 0){ const F = C.finds[f]; F.rev++; if(F.st === 0 && F.rev >= F.th) reveal(F); }
}
function scrubSeg(x0, y0, x1, y1, r, P){
  const d = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.ceil(d / (r * .35)));
  const dmg = P * Math.min(2.2, (d / steps) / (r * .5));
  for(let k = 1; k <= steps; k++) brushAt(lerp(x0, x1, k / steps), lerp(y0, y1, k / steps), r, dmg, 'brush');
}

/* ---------------- finds ---------------- */
function findVal(F){
  const v = baseVal() * (1 + save.up.luck * .08);
  switch(F.type){
    case 'coin': return v * (140 + (F.id * 37 % 120));
    case 'gem': return v * (900 + (F.id * 53 % 700));
    case 'relic': return v * 3000;
    case 'fossil': return v * 4000;
    case 'critter': return v * (F.shiny ? 15000 : 1500);
    case 'sign': return v * 5000;
  }
  return 0;
}
function reveal(F){
  if(F.type === 'frieze'){ F.st = 2; return; }
  if(TAPPABLE[F.type]){
    F.st = 1; F.t0 = G.t;
    if(F.type === 'critter'){ AU.critter(F.shiny); pop(F.shiny ? 'SHINY!' : 'TAP IT!', F.x, F.y - 34, F.shiny ? '#ffd23a' : '#ffffff', 18, 1.2); if(F.shiny) burst(F.x, F.y, '#ffd23a', 30); }
    else if(F.type === 'key' || F.type === 'exit'){ AU.keyhole(); burst(F.x, F.y, '#ffe8a0', 40); G.flash = .25; onKeyRevealed(F); }
    else if(F.type === 'mini'){ AU.gem(); burst(F.x, F.y, '#ffffff', 16); }
    else AU.coin(1);
    return;
  }
  collect(F);
}
function collect(F){
  F.st = 2; save.stats.finds++;
  const v = findVal(F); gain(v);
  const col = F.type === 'coin' ? '#ffd23a' : F.type === 'gem' ? F.col : F.type === 'relic' ? '#ffb86a' : '#fff4d6';
  pop('+' + fmt(v), F.x, F.y - 20, col, F.type === 'coin' ? 15 : 20, .9);
  burst(F.x, F.y, col, F.type === 'coin' ? 10 : 22);
  flyTo(F.x, F.y, col);
  if(F.type === 'coin') AU.coin(0); else if(F.type === 'gem') AU.gem(); else AU.relic();
  if(F.type === 'relic'){
    save.relics[F.bi] = (save.relics[F.bi] || 0) | (1 << F.piece);
    const n = [0, 1, 2, 3].filter(p => save.relics[F.bi] & (1 << p)).length;
    if(save.relics[F.bi] === 15){ banner('RELIC RESTORED', BIOMES[F.bi].relic[0] + ' · everything worth +25% forever', '#ffb86a'); SDK.happytime(); AU.secret(); }
    else toast('RELIC PIECE ' + n + '/4', BIOMES[F.bi].relic[0], '#ffb86a');
    codexNew();
  }
  persist();
}
function tapFind(F){
  switch(F.type){
    case 'critter': {
      F.st = 2; const first = !save.critters[F.cid];
      save.critters[F.cid] = (save.critters[F.cid] || 0) + 1;
      const v = findVal(F); gain(v); pop('+' + fmt(v), F.x, F.y - 26, '#ffffff', 20, 1); flyTo(F.x, F.y, '#ffffff');
      burst(F.x, F.y, F.shiny ? '#ffd23a' : '#ffffff', 26); AU.catch(F.shiny);
      if(F.shiny){ save.shiny[F.cid] = 1; discover('shiny'); }
      if(first) banner('NEW CREATURE!', F.e + ' ' + F.name, '#8fe06a');
      codexNew(); persist(); break;
    }
    case 'key': if(keyLocked()){ AU.deny(); F.shake = G.t; toast('THE KEYHOLE IS STUCK', 'Restore ' + Math.round(KEY_AT * 100) + '% of the painting to open it', '#ffe8a0', 2200); break; } startDive(F.x, F.y, 'next'); break;
    case 'exit': startDive(F.x, F.y, 'back'); break;
    case 'mini': F.st = 2; discover('mini'); startDive(F.x, F.y, 'mini'); break;
    case 'glyph': {
      if(!C.order){ AU.deny(); break; }
      C.glyphTaps.push(F.sym); F.lit = G.t; AU.glyph(C.glyphTaps.length);
      const k = C.glyphTaps.length - 1;
      if(C.glyphTaps[k] !== C.order[k]){ C.glyphTaps = []; AU.deny(); G.shake = 6; for(const f of C.finds) if(f.type === 'glyph') f.bad = G.t; break; }
      if(C.glyphTaps.length === 3){ for(const f of C.finds) if(f.type === 'glyph') f.st = 2; discover('vault'); save.stats.vaults++; startDive(F.x, F.y, 'vault'); }
      break;
    }
    case 'sign': {
      if(G.t - (F.lastTap || -9) > 1.2) F.taps = 0;
      F.taps++; F.lastTap = G.t; AU.knock(F.taps);
      if(F.taps >= 3){
        F.st = 2; const v = findVal(F); gain(v); pop('+' + fmt(v), F.x, F.y - 30, '#ffd23a', 20, 1.2); flyTo(F.x, F.y, '#ffd23a');
        discover('sign');
        if(save.lore.length < LORE.length){ save.lore.push(save.lore.length); banner('A NOTE FROM THE PAINTER', '“' + LORE[save.lore.length - 1] + '”', '#ffe8c0', 5200); codexNew(); }
      }
      break;
    }
  }
}
function finishMaster(){
  C.master = true; save.stats.masters++;
  const v = baseVal() * C.total * .5; gain(v);
  const cg = C.cover.getContext('2d');
  for(let i = 0; i < GN * GN; i++) if(C.hp[i] > 0){ C.hp[i] = 0; C.cleared++; const x = (i % GN) * CS, y = ((i / GN) | 0) * CS; cg.clearRect(x, y, CS, CS); const f = C.cellFind[i]; if(f >= 0){ const F = C.finds[f]; F.rev++; if(F.st === 0 && F.rev >= F.th) reveal(F); } }
  for(let k = 0; k < 80; k++) G.parts.push({ x:rnd(0, PW), y:rnd(0, PW), vx:rnd(-40, 40), vy:rnd(-120, -30), g:60, l:rnd(.8, 1.6), c:pick(['#ffd23a', '#ffffff', '#ffe8a0']), s:rnd(2, 4), k:'star' });
  banner('MASTERPIECE!', '+' + fmt(v) + ' dust', '#ffd23a'); AU.master(); SDK.happytime();
  discover('master'); persist();
}

/* ---------------- secrets ---------------- */
function discover(id){
  if(save.secrets[id]) return false;
  save.secrets[id] = 1;
  const s = SECRETS.find(s => s.id === id);
  G.flash = .5; AU.secret(); SDK.happytime();
  banner('SECRET FOUND! ' + Object.keys(save.secrets).length + '/' + SECRETS.length, s.name + ' · ' + s.how, '#c8a8ff', 4200);
  codexNew(); persist(); refreshSkills();
  return true;
}

/* ---------------- skills that the secrets unlock ---------------- */
function doWhirl(x, y){ G.cd.whirl = 11; G.whirls.push({ x, y, t:0 }); AU.whirl(); discover('whirl'); }
function doBolt(x, y){
  G.cd.zig = 9; const pts = [], a = rnd(0, TAU), L = 460;
  for(let k = 0; k <= 12; k++){ const t = k / 12 - .5; pts.push([x + Math.cos(a) * L * t + rnd(-26, 26), y + Math.sin(a) * L * t + rnd(-26, 26)]); }
  for(let k = 1; k < pts.length; k++){ const [ax, ay] = pts[k - 1], [bx, by] = pts[k], d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 8); for(let s = 0; s <= n; s++) brushAt(lerp(ax, bx, s / n), lerp(ay, by, s / n), 18, 20 * brushP(save.up.power), 'bolt'); }
  G.bolts.push({ pts, t:0 }); G.flash = Math.max(G.flash, .35); G.shake = 8; AU.thunder(); discover('zig');
}
function doDrill(x, y){
  G.cd.drill = 7; brushAt(x, y, 36, 40 * brushP(save.up.power), 'drill'); G.shake = 5; AU.drill();
  if(C.drills < 3){ C.drills++; const F = { id:-1, type:'fossil', x, y, r:18, st:0 }; collect(F); pop('FOSSIL!', x, y - 44, '#fff4d6', 20, 1.2); }
  for(let k = 0; k < 30; k++) G.parts.push({ x, y, vx:rnd(-160, 160), vy:rnd(-220, -40), g:500, l:rnd(.4, .9), c:pick(C.B.cover), s:rnd(2, 5) });
  discover('drill');
}
function doRain(){ G.cd.rain = 60; G.rainT = 6; AU.rain(); discover('rain'); }
function doBlast(x, y){
  G.blastC = 0; G.blastArmed = false; brushAt(x, y, 95, 40 * brushP(save.up.power), 'blast'); G.shake = 12; G.flash = .3; AU.blast();
  for(let k = 0; k < 60; k++){ const a = rnd(0, TAU), s = rnd(80, 420); G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s, g:200, l:rnd(.3, .8), c:pick(['#ffd23a', '#ff8a3a', '#ffffff', C.B.cover[1]]), s:rnd(2, 5) }); }
  refreshSkills();
}
function randomCovered(){ for(let k = 0; k < 60; k++){ const i = (Math.random() * GN * GN) | 0; if(C.hp[i] > 0) return [(i % GN) * CS + 2, ((i / GN) | 0) * CS + 2]; } return [PW / 2, PW / 2]; }

/* gestures: a circle summons a whirlwind, a fast zigzag calls lightning */
function gestures(){
  const p = G.ptr.path; if(p.length < 12) return;
  if(G.cd.whirl <= 0){
    let cx = 0, cy = 0; for(const q of p){ cx += q.x; cy += q.y; } cx /= p.length; cy /= p.length;
    let sum = 0, mr = 0, prev = null;
    for(const q of p){ const a = Math.atan2(q.y - cy, q.x - cx); mr += Math.hypot(q.x - cx, q.y - cy); if(prev !== null){ let d = a - prev; if(d > Math.PI) d -= TAU; if(d < -Math.PI) d += TAU; sum += d; } prev = a; }
    mr /= p.length;
    if(Math.abs(sum) > TAU * 1.05 && mr > 34 && mr < 260){ doWhirl(cx, cy); G.ptr.path = []; return; }
  }
  if(G.cd.zig <= 0){
    const now = G.rt, q = p.filter(o => now - o.t < 1);
    let rev = 0, dir = 0, run = 0, cx = 0, cy = 0;
    for(let k = 1; k < q.length; k++){
      const dx = q[k].x - q[k - 1].x; if(Math.abs(dx) < .5) continue;
      const d = Math.sign(dx);
      if(d === dir) run += Math.abs(dx); else { if(dir !== 0 && run > 36) rev++; dir = d; run = Math.abs(dx); }
      cx += q[k].x; cy += q[k].y;
    }
    if(rev >= 7){ doBolt(cx / (q.length - 1), cy / (q.length - 1)); G.ptr.path = []; }
  }
}

/* ---------------- diving into the painting ---------------- */
const KEY_AT = .6;
const keyLocked = () => C.kind === 'main' && C.cleared < C.total * KEY_AT;
let wasLocked = true;
function onKeyRevealed(F){ if(F.type === 'key') toast('A KEYHOLE!', 'Tap it to dive into the world beneath', '#ffe8a0', 3200); refreshDive(); }
function startDive(x, y, target){
  if(G.dive) return;
  G.dive = { t:0, x, y, target, swapped:false };
  G.state = 'dive'; G.ptr.down = false; AU.dive();
}
function stepDive(dt){
  const D = G.dive; D.t += dt;
  if(D.t >= .75 && !D.swapped){
    D.swapped = true;
    const from = C;
    if(D.target === 'next'){
      const wasCore = from.bi === 7;
      save.depth++; save.stats.dives++;
      const newDeep = save.depth > save.maxDepth; save.maxDepth = Math.max(save.maxDepth, save.depth);
      newMainCanvas();
      if(save.depth === 8) discover('core');
      if(wasCore) discover('loop');
      setTimeout(() => banner('DEPTH ' + save.depth, C.B.name + (newDeep ? ' · NEW WORLD' : ''), '#ffe8a0', 2600), 500);
      SDK.happytime();
    } else if(D.target === 'back'){
      C = restoreCanvas(save.canvas); G.C = C;
      setTimeout(() => banner('BACK TO DEPTH ' + C.depth, C.B.name, '#ffe8a0', 2000), 500);
    } else {
      snapCanvas();
      const kind = D.target === 'vault' ? 'vault' : D.target === 'mini' ? 'mini' : 'daily';
      const seed = kind === 'daily' ? hashStr('underneath:' + todayKey()) : (Math.random() * 4294967296) >>> 0;
      C = genCanvas(seed, save.depth, kind); G.C = C;
      setTimeout(() => banner(kind === 'vault' ? 'THE GLYPH VAULT' : kind === 'mini' ? 'INSIDE THE MINIATURE' : 'DAILY PAINTING', kind === 'daily' ? 'Everything worth x3 · a shiny waits' : 'Treasure worth x' + (kind === 'vault' ? 4 : 2.5), '#ffd23a', 2400), 500);
    }
    _cg = C.cover.getContext('2d'); _tex = coverTextures(C.B);
    G.moths.forEach(m => { m.tx = null; }); G.whirls = []; G.bolts = []; G.drops = []; G.eye = null; G.sonar = null;
    AU.setBiome(C.bi); refreshDive(); persist();
  }
  if(D.t >= 1.55){ G.dive = null; G.state = 'play'; }
}

/* ---------------- effects helpers ---------------- */
function pop(txt, x, y, c, s, d){ G.pops.push({ txt, x, y, c, s:s || 16, t:0, d:d || 1 }); if(G.pops.length > 40) G.pops.shift(); }
function burst(x, y, c, n){ for(let k = 0; k < n; k++){ const a = rnd(0, TAU), s = rnd(40, 220); G.parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s - 40, g:220, l:rnd(.4, .9), c, s:rnd(1.5, 4), k:'star' }); } }
function flyTo(x, y, c){ G.fly.push({ x, y, t:0, c }); }

/* ---------------- main update ---------------- */
function update(dt){
  G.t += dt; G.rt += dt;
  if(G.state === 'dive'){ stepDive(dt); stepFx(dt); return; }
  if(!C) return;
  const P = G.ptr, up = save.up;
  const R = brushR(up.brush) * (G.goldT > 0 ? 1.8 : 1), PWR = brushP(up.power) * (G.goldT > 0 ? 2 : 1);
  G.frameCleared = 0;
  // the player's brush
  let scrubbing = false;
  if(P.down && !G.blastArmed){
    const d = Math.hypot(P.wx - P.lwx, P.wy - P.lwy);
    if(d > 1.2){ scrubSeg(P.lwx, P.lwy, P.wx, P.wy, R, PWR); scrubbing = true; P.stillT = 0; }
    else { P.stillT += dt; brushAt(P.wx, P.wy, R * .6, PWR * 1.4 * dt, 'brush'); if(P.stillT >= 3 && G.cd.drill <= 0){ doDrill(P.wx, P.wy); P.stillT = -1; } }
    AU.scrub(Math.min(1, d / dt / 900), C.lay[clamp(((P.wy / CS) | 0), 0, GN - 1) * GN + clamp(((P.wx / CS) | 0), 0, GN - 1)]);
    P.lwx = P.wx; P.lwy = P.wy;
  } else AU.scrub(0, 0);
  // streak
  if(scrubbing){ G.streakT += dt; G.lastScrub = G.rt; }
  else if(G.rt - G.lastScrub > .5) G.streakT = Math.max(0, G.streakT - dt * 8);
  const lvl = Math.min(8, Math.floor(G.streakT / 3));
  const nm = 1 + lvl * .5; if(nm > G.mult && nm >= 2) AU.streakUp(lvl); G.mult = nm;
  save.stats.bestStreak = Math.max(save.stats.bestStreak, G.streakT);
  if(G.streakT >= 30 && G.cd.rain <= 0) doRain();
  // moths
  const nM = up.moth, mP = 2 * mothP(up.queen);
  while(G.moths.length < nM) G.moths.push({ x:rnd(0, PW), y:rnd(0, PW), tx:null, ty:0, ph:rnd(0, TAU) });
  for(const m of G.moths){
    if(m.tx === null || Math.hypot(m.tx - m.x, m.ty - m.y) < 10 || C.hp[clamp((m.ty / CS) | 0, 0, GN - 1) * GN + clamp((m.tx / CS) | 0, 0, GN - 1)] <= 0){ const [x, y] = randomCovered(); m.tx = x; m.ty = y; }
    const dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy) || 1, sp = 70;
    m.x += dx / d * sp * dt + Math.sin(G.t * 3 + m.ph) * 20 * dt; m.y += dy / d * sp * dt + Math.cos(G.t * 2.4 + m.ph) * 20 * dt; m.ph += dt * 14;
    brushAt(m.x, m.y, 15, mP * dt, 'moth');
  }
  // skills in flight
  for(const w of G.whirls){ w.t += dt; const r = Math.min(135, 30 + w.t * 110); brushAt(w.x, w.y, r, 30 * brushP(save.up.power) * dt, 'whirl'); if(Math.random() < .8){ const a = rnd(0, TAU); G.parts.push({ x:w.x + Math.cos(a) * r, y:w.y + Math.sin(a) * r, vx:-Math.sin(a) * 200, vy:Math.cos(a) * 200, g:0, l:.4, c:'#ffffff', s:2.5 }); } }
  G.whirls = G.whirls.filter(w => w.t < 1.6);
  for(const b of G.bolts) b.t += dt; G.bolts = G.bolts.filter(b => b.t < .4);
  if(G.rainT > 0){ G.rainT -= dt; G.rainAcc = (G.rainAcc || 0) + dt * 14; while(G.rainAcc >= 1){ G.rainAcc--; G.drops.push({ x:rnd(0, PW), y:-10, v:rnd(380, 520) }); } }
  for(const d of G.drops){ d.y += d.v * dt; brushAt(d.x, d.y, 11, 1.5 * brushP(save.up.power), 'rain'); } G.drops = G.drops.filter(d => d.y < PW + 10);
  for(const k in G.cd) if(G.cd[k] > 0) G.cd[k] -= dt;
  if(G.goldT > 0) G.goldT -= dt;
  // sonar
  if(up.lens > 0){
    G.sonarT -= dt;
    if(G.sonarT <= 0){ G.sonarT = lensT(up.lens); G.sonar = { t:0 }; AU.ping(); }
    if(G.sonar){ G.sonar.t += dt; const r = G.sonar.t * 650; for(const f of C.finds) if(f.st === 0 && f.type !== 'frieze' && f.type !== 'sign' && Math.abs(Math.hypot(f.x - PW / 2, f.y - PW / 2) - r) < 24) f.ping = 1.6; if(r > PW) G.sonar = null; }
  }
  for(const f of C.finds){ if(f.ping > 0) f.ping -= dt; if(f.st === 1 && f.type === 'critter' && G.t - f.t0 > 9){ f.st = 2; burst(f.x, f.y, '#ffffff', 10); pop('It got away!', f.x, f.y - 20, '#c8c0b0', 14, 1); } }
  // the golden eye
  G.eyeT -= dt;
  if(G.eyeT <= 0 && !G.eye && C.cleared < C.total * .95){ const [x, y] = randomCovered(); G.eye = { x, y, t:0 }; G.eyeT = rnd(70, 120); AU.eye(); }
  if(G.eye){ G.eye.t += dt; if(G.eye.t > 5) G.eye = null; }
  // firecrackers charge
  if(up.blast > 0 && G.blastC < blastT(up.blast)){ G.blastC += dt; if(G.blastC >= blastT(up.blast)){ refreshSkills(); AU.ready(); } }
  // chimes follow the cleared cells
  G.chimeAcc += G.frameCleared; G.chimeT -= dt;
  if(G.chimeT <= 0 && G.chimeAcc >= 5){ AU.chime(lvl); G.chimeAcc = 0; G.chimeT = .085; }
  // the keyhole clicks open
  const lk = keyLocked(); if(wasLocked && !lk && C.finds.some(f => f.type === 'key' && f.st === 1)){ AU.keyhole(); toast('CLICK!', 'The keyhole is open. Dive deeper!', '#ffe8a0', 2600); G.flash = .2; refreshDive(); } wasLocked = lk;
  // masterpiece
  if(!C.master && C.cleared >= C.total * .985) finishMaster();
  // dust per second readout
  G.rateT += dt; if(G.rateT >= .5){ G.rate = lerp(G.rate, G.rateAcc / G.rateT, .5); G.rateAcc = 0; G.rateT = 0; }
  stepFx(dt);
  tutorial();
}
function stepFx(dt){
  for(const p of G.parts){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.vx *= .97; p.l -= dt; }
  G.parts = G.parts.filter(p => p.l > 0);
  for(const p of G.pops){ p.t += dt; p.y -= 26 * dt; } G.pops = G.pops.filter(p => p.t < p.d);
  for(const f of G.fly) f.t += dt * 1.6; G.fly = G.fly.filter(f => { if(f.t >= 1){ bumpDust(); return false; } return true; });
  G.shake *= Math.pow(.02, dt); if(G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
}

/* ---------------- tutorial ---------------- */
function tutorial(){
  if(save.tut >= 4) return;
  if(save.tut === 0){ tip('<b>Scrub</b> the painting to uncover what\'s <b>underneath</b>.'); if(C.cleared > 400){ save.tut = 1; tip(null); } }
  else if(save.tut === 1){ if(save.stats.finds >= 3){ tip('Everything you uncover is yours. Spend <b>dust</b> on upgrades.'); save.tut = 2; setTimeout(() => { if(save.tut === 2) tip(null); }, 5000); } }
  else if(save.tut === 2){ if(C.finds.some(f => f.type === 'key' && f.st === 1)){ tip('A <b>keyhole</b>! Tap it to dive <b>into</b> the painting.'); save.tut = 3; } }
  else if(save.tut === 3){ if(save.depth >= 2){ tip('Every picture hides another. Some things here are <b>secret</b>...'); save.tut = 4; setTimeout(() => tip(null), 5000); persist(); } }
}
