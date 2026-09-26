'use strict';
/* =====================================================================
   DIGFORT — simulation.
   Day: mine the island for stone and ore, build walls and towers.
   Night: monsters path to the Heart. Dig under them and they fall;
   deep pits hurt, magma burns, walls get chewed through.
   ===================================================================== */
const G = {
  state:'boot', phase:'day', day:1, dayT:0, dayLen:35, t:0, rt:0,
  heartHp:20, heartMax:20, heartFlash:0, res:{}, tool:'pick',
  mobs:[], shots:[], parts:[], pops:[], beams:[], TM:[], rise:null,
  spawnQ:[], spawnT:0, spawnSide:0, groupLeft:0,
  kills:0, mined:0, gems:0, score:0, up:{}, daily:false, mod:null,
  flow1:null, flow2:null, flowDirty:true,
  mine:{ x:-1, y:-1, prog:0, tick:0 }, hover:null,
  ptr:{ down:false, x:0, y:0, id:null, sx:0, sy:0, moved:false },
  tut:false, tutStep:0, tutT:0, tutMined:0,
  shake:0, flash:0, flashCol:'#fff', light:1, runEv:{}, oreCombo:0, oreT:0, dieT:0, q:'high',
};
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/* ---------------- stats ---------------- */
const pickPower = () => PICK_POWER[save.meta.pick || 0] * (1 + .35 * (G.up.pick || 0));
const fallMul = () => 1 + .6 * (G.up.fall || 0);
const rangeBonus = () => .8 * (G.up.range || 0);
const gemMul = () => (G.mod && G.mod.id === 'glass' ? 2 : G.mod && G.mod.id === 'short' ? 1.5 : 1);

/* ---------------- run lifecycle ---------------- */
function newRun(daily){
  G.daily = !!daily;
  if(daily){ const seed = hashStr('digfort:' + todayKey()); grng = mulberry32(seed); G.mod = MODS[seed % MODS.length]; }
  else { grng = Math.random; G.mod = null; }
  ISLE_R = 5;
  genWorld({ rich:G.mod && G.mod.id === 'rich', flat:G.mod && G.mod.id === 'flat' });
  const k = save.meta.kit || 0;
  Object.assign(G, { phase:'day', day:1, t:0, kills:0, mined:0, gems:0, score:0, up:{}, mobs:[], shots:[], parts:[], pops:[], beams:[], TM:[],
    spawnQ:[], spawnT:0, flowDirty:true, tool:'pick', revived:false, shake:0, flash:0, light:1, runEv:{}, oreCombo:0, dieT:0, rise:null,
    res:{ soil:4, stone:6 + k * 3, coal:1 + k, iron:2 + k, gold:0, crystal:0 } });
  G.heartMax = G.mod && G.mod.id === 'glass' ? 8 : 25 + 5 * (save.meta.heart || 0);
  G.heartHp = G.heartMax;
  G.mine = { x:-1, y:-1, prog:0, tick:0 };
  G.tut = !save.tut; G.tutStep = 0; G.tutT = 0; G.tutMined = 0;
  G.state = 'play';
  fitCamera();
  startDay(true);
}

function startDay(first){
  G.phase = 'day';
  G.dayLen = (G.mod && G.mod.id === 'short' ? 18 : 35) + (first ? 10 : 0);
  G.dayT = G.tut ? Infinity : G.dayLen;
  AU.setMusic(0);
  if(!first) announce('DAY ' + G.day, '#ffd23c', 'Mine. Build. Prepare.');
  if(G.tut) tip('<b>HOLD</b> on a block to <b>MINE</b> it ⛏');
}

function startNight(){
  if(G.phase !== 'day') return;
  const early = isFinite(G.dayT) ? Math.max(0, G.dayT) : 0;
  if(early > 3){ const b = Math.round(early / 6); if(b > 0){ G.gems += b; pop3(C, C, colH(C, C) + 2, '+' + b + ' ◆ early', '#3ff0ff', 16); } }
  G.phase = 'night'; G.dayT = 0;
  G.spawnQ = buildNight(G.day); G.spawnT = 1.2; G.groupLeft = 0;
  const boss = G.spawnQ.includes('golem');
  announce('NIGHT ' + G.day, boss ? '#ff5a2a' : '#b18cff', boss ? 'A STONE WARDEN RISES' : G.spawnQ.length + ' monsters are coming');
  AU.horn(); AU.setMusic(boss ? 3 : 2, boss);
  if(G.tut){ tip('<b>DIG UNDER</b> monsters to drop them into pits! Tap them to hit them.'); G.tutStep = 4; }
}

function buildNight(n){
  const q = [];
  let count = Math.round((3 + n * 2.4 + n * n * .08) * (G.mod && G.mod.id === 'swarm' ? 1.6 : 1) * (G.mod && G.mod.id === 'rich' ? 1.35 : 1));
  const pool = [['grub', 4]];
  if(n >= 2) pool.push(['stomper', 1.4]);
  if(n >= 3) pool.push(['flitter', 1.4]);
  if(n >= 4) pool.push(['mole', 1.3]);
  if(n >= 5) pool.push(['bug', 1.2]);
  const tot = pool.reduce((s, p) => s + p[1], 0);
  for(let i = 0; i < count; i++){
    let r = grng() * tot, t = 'grub';
    for(const [k, w] of pool){ r -= w; if(r <= 0){ t = k; break; } }
    q.push(t);
  }
  if(n % 5 === 0) q.splice(Math.floor(q.length / 3), 0, 'golem');
  return q;
}

function endNight(){
  G.phase = 'dawn';
  const g = Math.round((4 + G.day) * gemMul());
  G.gems += g; G.score += 500 * G.day;
  save.stats.nights++; ev('night', G.day);
  announce('DAWN', '#ffd23c', 'NIGHT ' + G.day + ' SURVIVED  ·  +' + g + ' ◆');
  AU.dawn(); AU.setMusic(0);
  G.heartHp = Math.min(G.heartMax, G.heartHp + 4);
  if(G.tut){ G.tut = false; save.tut = true; persist(); tip(null); }
  G.TM.push({ t:1.8, f:() => { if(G.state === 'play') openCards(); } });
}

function afterCards(){
  G.day++;
  if((G.day === 3 || G.day === 5 || G.day === 7) && ISLE_R < 8){
    ISLE_R++; G.rise = { r:ISLE_R, t:0 }; G.flowDirty = true;
    fitCamera();
    toast('THE ISLAND GROWS', 'New land rose from below, full of fresh ore.', '#8fd14f', 3200);
    AU.rise();
  }
  startDay(false);
}

/* ---------------- flow field (Dijkstra toward the Heart) ---------------- */
const idx = (x, y) => x * MAXS + y;
function digCost(x, y){ if(TWR[x][y]) return 3; const t = BT[topId(x, y)]; return t ? Math.min(t.hard * 2, 6) : 1; }
function stepCost(ax, ay, bx, by, climb){
  let c = 1;
  const ha = colH(ax, ay), hb = effH(bx, by);
  if(isMagma(bx, by)) c += 400;
  const up = hb - ha; if(up > climb) c += (up - climb) * digCost(bx, by) * 2.5;
  const dn = ha - hb; if(dn >= 2) c += dn * 1.6;
  return c;
}
function computeFlow(climb){
  const N = MAXS * MAXS, dist = new Float32Array(N).fill(1e9), done = new Uint8Array(N);
  for(const [dx, dy] of DIRS){ const x = C + dx, y = C + dy; if(inIsle(x, y)) dist[idx(x, y)] = 0; }
  for(;;){
    let b = -1, bd = 1e9;
    for(let i = 0; i < N; i++) if(!done[i] && dist[i] < bd){ bd = dist[i]; b = i; }
    if(b < 0) break;
    done[b] = 1;
    const bx = (b / MAXS) | 0, by = b % MAXS;
    for(const [dx, dy] of DIRS){
      const ax = bx + dx, ay = by + dy;
      if(!inIsle(ax, ay) || isHeart(ax, ay)) continue;
      const nd = bd + stepCost(ax, ay, bx, by, climb);
      if(nd < dist[idx(ax, ay)]) dist[idx(ax, ay)] = nd;
    }
  }
  return dist;
}

/* ---------------- main update ---------------- */
function update(dt){
  G.rt += dt;
  G.shake = Math.max(0, G.shake - dt * 28);
  G.flash = Math.max(0, G.flash - dt * 2.5);
  G.heartFlash = Math.max(0, G.heartFlash - dt * 3);
  const target = G.phase === 'night' ? 0 : 1;
  G.light = lerp(G.light, target, Math.min(1, dt * 1.5));
  if(G.rise){ G.rise.t += dt; if(G.rise.t > 1.4) G.rise = null; }
  tickFx(dt);
  if(G.state === 'dying'){ G.dieT -= dt; if(G.dieT <= 0) onDeathDone(); return; }
  if(G.state !== 'play') return;
  G.t += dt;
  if(G.flowDirty){ G.flow1 = computeFlow(1); G.flow2 = computeFlow(2); G.flowDirty = false; }

  if(G.phase === 'day'){
    if(isFinite(G.dayT)){ G.dayT -= dt; if(G.dayT <= 0) startNight(); }
  } else if(G.phase === 'night'){
    tickSpawns(dt);
    if(!G.spawnQ.length && !G.mobs.some(m => !m.dead)) endNight();
  }
  updMining(dt);
  for(const m of G.mobs) if(!m.dead) updMob(m, dt);
  G.mobs = G.mobs.filter(m => !m.dead);
  updTowers(dt);
  updShots(dt);
  for(let i = G.TM.length - 1; i >= 0; i--){ const t = G.TM[i]; t.t -= dt; if(t.t <= 0){ G.TM.splice(i, 1); t.f(); } }
  if(G.oreT > 0){ G.oreT -= dt; if(G.oreT <= 0) G.oreCombo = 0; }
  tickTutorial(dt);
}

/* ---------------- mining & building ---------------- */
function updMining(dt){
  const P = G.ptr;
  if(!P.down || G.tool !== 'pick' || P.mobHit){ G.mine.prog = Math.max(0, G.mine.prog - dt * 2); return; }
  const c = pickColumn(P.x, P.y);
  if(!c){ G.mine.prog = 0; return; }
  if(c.x !== G.mine.x || c.y !== G.mine.y){ G.mine.x = c.x; G.mine.y = c.y; G.mine.prog = 0; G.mine.denied = false; }
  if(isHeart(c.x, c.y)){ if(!G.mine.denied){ G.mine.denied = true; AU.deny(); pop3(c.x, c.y, colH(c.x, c.y) + 1.5, 'Protect the Heart!', '#ff5ad9', 14); } return; }
  const tw = TWR[c.x][c.y];
  if(tw && tw.type === 'blast'){ if(tw.fuse < 0){ tw.fuse = .12; AU.fuse(); } return; }
  const hard = tw ? .35 : BT[topId(c.x, c.y)].hard;
  if(hard >= 1e8 || colH(c.x, c.y) <= 1 && !tw){ if(!G.mine.denied){ G.mine.denied = true; AU.deny(); pop3(c.x, c.y, colH(c.x, c.y) + .8, isMagma(c.x, c.y) ? 'Magma — monsters burn here' : 'Bedrock', '#ffb020', 13); } return; }
  G.mine.prog += dt * pickPower() / hard;
  G.mine.tick -= dt;
  if(G.mine.tick <= 0){ G.mine.tick = .16; AU.mineTick(tw ? B.DIRT : topId(c.x, c.y)); chips(c.x, c.y, colH(c.x, c.y), tw ? '#b08050' : blockCol(topId(c.x, c.y)), 3); }
  if(G.mine.prog >= 1){ G.mine.prog = 0; playerBreak(c.x, c.y); }
}

function blockCol(id){
  const th = theme();
  return id === B.GRASS ? th.grass[0] : id === B.DIRT ? th.dirt[0] : id === B.BRICK || id === B.STONE ? th.stone[0] : BT[id] && BT[id].ore ? BT[id].ore : '#888888';
}

function playerBreak(x, y){
  const tw = TWR[x][y];
  if(tw){
    TWR[x][y] = null; G.flowDirty = true;
    const cost = TOOL[tw.type].cost; for(const k in cost) G.res[k] += Math.floor(cost[k] * tw.lvl / 2);
    chips(x, y, colH(x, y) + .5, '#b08050', 14); AU.breakBlock(B.DIRT);
    pop3(x, y, colH(x, y) + 1.2, 'Tower removed (50% back)', '#ffd23c', 12);
    return;
  }
  const id = removeTop(x, y, 'player');
  if(!id) return;
  G.mined++; save.stats.mined++; ev('mine', 1);
  const drop = BT[id].drop;
  if(drop){
    let n = 1; if(G.up.luck && Math.random() < .3 * G.up.luck) n = 2;
    G.res[drop] += n;
    const isOre = id >= B.COAL && id <= B.CRYSTAL;
    if(isOre){ G.oreCombo++; G.oreT = 4; AU.ore(G.oreCombo, id); if(id === B.CRYSTAL) ev('crystal', n); G.score += 15 * (id - 3); }
    else AU.breakBlock(id);
    pop3(x, y, colH(x, y) + .6, '+' + n + ' ' + RES_NAME[drop], RES_COL[drop], isOre ? 17 : 12);
  }
  if(G.tut){ G.tutMined++; }
}

function removeTop(x, y, src){
  if(TWR[x][y]){ TWR[x][y] = null; G.flowDirty = true; chips(x, y, colH(x, y) + .5, '#b08050', 12); return 'tower'; }
  const col = COL[x][y];
  if(col.length <= 1) return null;
  const id = col[col.length - 1];
  if(id === B.BEDROCK || id === B.MAGMA) return null;
  col.pop(); G.flowDirty = true;
  chips(x, y, col.length + .5, blockCol(id), src === 'player' ? 12 : 7);
  if(col.length === 1 && col[0] === B.MAGMA && src === 'player'){ pop3(x, y, 1.6, 'MAGMA POCKET!', '#ff6a1a', 18); AU.magma(); }
  if(G.mine.x === x && G.mine.y === y && src !== 'player') G.mine.prog = 0;
  return id;
}

function cellHasMob(x, y){ return G.mobs.some(m => !m.dead && !m.fly && m.cx === x && m.cy === y); }
function canAfford(cost, mul){ for(const k in cost) if(G.res[k] < cost[k] * mul) return false; return true; }
function pay(cost, mul){ for(const k in cost) G.res[k] -= cost[k] * mul; }

function placeAt(x, y){
  const t = TOOL[G.tool]; if(!t || !t.cost) return;
  if(isHeart(x, y)){ AU.deny(); return; }
  const tw = TWR[x][y];
  if(t.tower){
    if(tw){
      if(tw.type !== t.id || t.id === 'blast'){ AU.deny(); pop3(x, y, colH(x, y) + 1.4, 'Occupied', '#ff5a5a', 12); return; }
      if(tw.lvl >= 3){ pop3(x, y, colH(x, y) + 1.4, 'Max level', '#ffd23c', 12); AU.deny(); return; }
      if(!canAfford(t.cost, tw.lvl + 1)){ AU.deny(); flashRes(t.cost); return; }
      pay(t.cost, tw.lvl + 1); tw.lvl++;
      AU.place(); AU.levelUp(); pop3(x, y, colH(x, y) + 1.6, t.name + ' Lv ' + tw.lvl, '#3ff0ff', 14);
      chips(x, y, colH(x, y) + 1, '#3ff0ff', 10);
      return;
    }
    if(colH(x, y) <= 1 || isMagma(x, y) || cellHasMob(x, y)){ AU.deny(); return; }
    if(!canAfford(t.cost, 1)){ AU.deny(); flashRes(t.cost); return; }
    pay(t.cost, 1);
    TWR[x][y] = { type:t.id, lvl:1, cd:.3, fuse:-1, t:0 };
    G.flowDirty = true; AU.place(); ev('tower', 1);
    chips(x, y, colH(x, y) + .6, '#ffffff', 10);
    if(G.tut && G.tutStep === 2){ G.tutStep = 3; G.dayT = 25; tip('Night brings monsters for your <b>HEART</b>. Build more, or press <b>START NIGHT</b>.'); }
    return;
  }
  if(tw || colH(x, y) >= 8 || isMagma(x, y)){ AU.deny(); return; }
  if(cellHasMob(x, y)){ AU.deny(); pop3(x, y, colH(x, y) + 1.2, 'A monster is there', '#ff5a5a', 12); return; }
  if(!canAfford(t.cost, 1)){ AU.deny(); flashRes(t.cost); return; }
  pay(t.cost, 1);
  COL[x][y].push(t.block); G.flowDirty = true; AU.place();
  chips(x, y, colH(x, y), blockCol(t.block), 6);
}

/* ---------------- monsters ---------------- */
function edgeCell(side){
  const R = ISLE_R;
  for(let i = 0; i < 20; i++){
    const k = Math.round(gr(-R, R));
    const [x, y] = side === 0 ? [C - R, C + k] : side === 1 ? [C + R, C + k] : side === 2 ? [C + k, C - R] : [C + k, C + R];
    if(inIsle(x, y) && !isMagma(x, y) && !TWR[x][y]) return [x, y];
  }
  return [C - R, C];
}
function tickSpawns(dt){
  if(!G.spawnQ.length) return;
  G.spawnT -= dt;
  if(G.spawnT > 0) return;
  if(G.groupLeft <= 0){ G.groupLeft = 2 + ((grng() * 3) | 0); G.spawnSide = (grng() * 4) | 0; }
  const type = G.spawnQ.shift();
  const [x, y] = edgeCell(G.spawnSide);
  spawnMob(type, x, y);
  G.groupLeft--;
  G.spawnT = G.groupLeft > 0 ? .35 : Math.max(.9, 3.2 - G.day * .12);
}
function spawnMob(type, x, y){
  const d = MOBS[type], n = G.day;
  const hpScale = (1 + .12 * (n - 1) + .016 * (n - 1) * (n - 1)) * (G.mod && G.mod.id === 'swarm' ? .7 : 1);
  const m = { type, d, x, y, cx:x, cy:y, tx:-1, ty:-1, z:colH(x, y) + (d.fly ? 5 : 3), vz:0, fallFrom:0, noFall:true,
    hp:d.hp * hpScale, maxHp:d.hp * hpScale, stun:0, digT:0, atkT:.6, flash:0, t:Math.random() * 9, dirx:1, diry:0, dead:false,
    mz0:0, mz1:0, mp:0 };
  G.mobs.push(m);
  poof(x, y, colH(x, y) + 1, '#b18cff');
  if(d.boss){ G.shake = 14; AU.boom(true); toast('STONE WARDEN', 'A huge boss that climbs two blocks and smashes walls.', '#ff5a2a', 4200); }
  return m;
}

function updMob(m, dt){
  const d = m.d;
  m.t += dt; if(m.flash > 0) m.flash -= dt;
  if(d.fly){
    const tz = colH(C, C) + 1.4;
    const dx = C - m.x, dy = C - m.y, dist = Math.hypot(dx, dy);
    if(dist > .8){ m.x += dx / dist * d.spd * dt; m.y += dy / dist * d.spd * dt; m.dirx = dx; m.diry = dy; }
    m.z = lerp(m.z, dist > 2 ? Math.max(tz, 7.5) : tz, Math.min(1, dt * 2));
    m.cx = Math.round(m.x); m.cy = Math.round(m.y);
    if(dist <= .8) attackHeart(m, dt);
    return;
  }
  const ground = colH(m.cx, m.cy);
  // falling
  if(m.tx < 0 && m.z > ground + .001){
    if(m.vz === 0) m.fallFrom = m.z;
    m.vz -= 24 * dt; m.z += m.vz * dt;
    if(m.z <= ground) land(m, ground);
    return;
  }
  if(isMagma(m.cx, m.cy) && m.z <= ground + .05){ burn(m); return; }
  if(m.stun > 0){ m.stun -= dt; return; }
  if(m.tx >= 0){
    const dx = m.tx - m.x, dy = m.ty - m.y, dist = Math.hypot(dx, dy), step = d.spd * dt;
    m.mp = Math.min(1, m.mp + step);
    if(m.mz1 > m.mz0) m.z = lerp(m.mz0, m.mz1, Math.min(1, m.mp * 1.6)) + Math.sin(m.mp * Math.PI) * .25;
    if(dist <= step){ m.x = m.tx; m.y = m.ty; m.cx = m.tx; m.cy = m.ty; m.tx = -1; m.walked = m.z > colH(m.cx, m.cy) + .001; if(m.z < colH(m.cx, m.cy)) m.z = colH(m.cx, m.cy); }
    else { m.x += dx / dist * step; m.y += dy / dist * step; }
    return;
  }
  // at the Heart?
  if(Math.abs(m.cx - C) + Math.abs(m.cy - C) === 1){ attackHeart(m, dt); return; }
  // choose next cell
  const flow = d.climb >= 2 ? G.flow2 : G.flow1;
  let best = null, bs = 1e12;
  for(const [dx, dy] of DIRS){
    const nx = m.cx + dx, ny = m.cy + dy;
    if(!inIsle(nx, ny) || isHeart(nx, ny)) continue;
    const s = flow[idx(nx, ny)] + stepCost(m.cx, m.cy, nx, ny, d.climb) + Math.random() * .01;
    if(s < bs){ bs = s; best = [nx, ny]; }
  }
  if(!best) return;
  const [nx, ny] = best;
  m.dirx = nx - m.cx; m.diry = ny - m.cy;
  const up = effH(nx, ny) - ground;
  if(up > d.climb){
    m.digT += dt * d.dig / (1 + (G.up.mason || 0));
    const need = TWR[nx][ny] ? 2.4 : Math.min(BT[topId(nx, ny)].hard * 1.3, 5);
    if(((m.t * 6) | 0) % 2 === 0 && Math.random() < .15) chips(nx, ny, colH(nx, ny), TWR[nx][ny] ? '#b08050' : blockCol(topId(nx, ny)), 1);
    if(m.digT >= need){ m.digT = 0; removeTop(nx, ny, 'mob'); AU.mobDig(); }
    return;
  }
  m.digT = 0;
  m.tx = nx; m.ty = ny; m.mp = 0; m.mz0 = m.z; m.mz1 = colH(nx, ny);
}

function land(m, ground){
  const dz = m.fallFrom - ground;
  m.z = ground; m.vz = 0;
  // a normal one-block step down while walking is free; drops you cause (or 2+ blocks) hurt
  if(!m.noFall && dz >= (m.walked ? 1.5 : .9)){
    const dmg = m.maxHp * (.12 * dz + .22 * Math.max(0, dz - 1)) * fallMul() * (m.d.fallRes || 1);
    m.stun = .35 + .3 * dz;
    AU.fall(dz);
    dust(m.x, m.y, ground, 6 + dz * 3);
    pop3(m.x, m.y, ground + 1, dz >= 2 ? 'FALL! -' + Math.round(dmg) : '-' + Math.round(dmg), '#ffffff', 11 + dz * 2);
    damageMob(m, dmg, 'fall');
  }
  m.noFall = false; m.walked = false;
  if(!m.dead && isMagma(m.cx, m.cy)) burn(m);
}
function burn(m){ AU.sizzle(); for(let i = 0; i < 14; i++) part3(m.x, m.y, m.z + .2, rnd(-1.5, 1.5), rnd(-1.5, 1.5), rnd(2, 5), pick(['#ff6a1a', '#ffb03a', '#ffe08a']), rnd(.4, .8), 3); killMob(m, 'magma'); }

function attackHeart(m, dt){
  m.atkT -= dt;
  if(m.atkT > 0) return;
  m.atkT = 1.3;
  if(m.d.boom){ heartHit(m.d.dmg); explode(m.x, m.y, 1.3, 40, 'bug', true); killMob(m, 'self'); return; }
  heartHit(m.d.dmg);
  if(G.up.sentinel){ damageMob(m, 25 * G.up.sentinel, 'zap'); G.beams.push({ x1:C, y1:C, z1:colH(C, C) + 1.4, x2:m.x, y2:m.y, z2:m.z + m.d.size * .5, life:.15, c:'#ff5ad9' }); }
}
function heartHit(dmg){
  if(G.state !== 'play') return;
  G.heartHp = Math.max(0, G.heartHp - dmg);
  G.heartFlash = 1; G.shake = Math.min(20, G.shake + 5 + dmg); G.flash = .45; G.flashCol = '#ff3b5c';
  AU.heartHit();
  if(G.heartHp <= 0) heartDie();
}
function heartDie(){
  G.state = 'dying'; G.dieT = 1.8;
  AU.boom(true); AU.shatter(); G.shake = 24; G.flash = 1; G.flashCol = '#ffffff';
  const e = colH(C, C) + 1.3;
  for(let i = 0; i < 70; i++) part3(C, C, e, rnd(-6, 6), rnd(-6, 6), rnd(1, 9), pick(['#ff5ad9', '#3ff0ff', '#ffffff']), rnd(.6, 1.4), rnd(3, 6));
  AU.setMusic(0);
}

function damageMob(m, dmg, src){
  if(m.dead) return;
  m.hp -= dmg; m.flash = .12;
  if(m.hp <= 0) killMob(m, src);
}
function killMob(m, src){
  if(m.dead) return;
  m.dead = true;
  const d = m.d;
  G.kills++; save.stats.kills++; ev('kill', 1);
  if(src === 'fall') ev('fallkill', 1);
  if(src === 'magma') ev('magma', 1);
  if(src === 'blast' || src === 'bug') ev('blastkill', 1);
  G.score += d.score * G.day;
  G.gems += d.gem * (1 + .5 * (G.up.bounty || 0)) * gemMul();
  AU.mobDie(d.boss);
  for(let i = 0; i < (d.boss ? 60 : 14); i++) part3(m.x, m.y, m.z + d.size * .5, rnd(-3, 3), rnd(-3, 3), rnd(1, 6), i % 3 ? d.col : '#ffffff', rnd(.35, .8), rnd(2, 4));
  if(src === 'fall') pop3(m.x, m.y, m.z + 1.2, pick(['SPLAT!', 'CRUNCH!', 'DOWN!']), '#ffd23c', 16);
  if(d.boss){ ev('boss', 1); SDK.happytime(); G.shake = 20; G.flash = .8; G.flashCol = '#ffd23c'; announce('WARDEN DEFEATED', '#ffd23c', '+' + Math.round(d.gem) + ' ◆'); }
  if(d.boom && src !== 'self') G.TM.push({ t:.06, f:() => explode(m.x, m.y, 1.4, 45, 'bug', true) });
}

/* ---------------- towers ---------------- */
function towerTop(x, y){ return colH(x, y) + 1; }
function mobsNear(x, y, r, ground){
  const out = [];
  for(const m of G.mobs){ if(m.dead || (ground && m.fly)) continue; const d = Math.hypot(m.x - x, m.y - y); if(d <= r) out.push([m, d]); }
  return out;
}
function priority(m){ return m.fly ? Math.hypot(m.x - C, m.y - C) : (m.d.climb >= 2 ? G.flow2 : G.flow1)[idx(m.cx, m.cy)]; }
function updTowers(dt){
  G.beams = G.beams.filter(b => (b.life -= dt) > 0);
  for(let x = 0; x < MAXS; x++) for(let y = 0; y < MAXS; y++){
    const tw = TWR[x][y]; if(!tw) continue;
    tw.t += dt; tw.cd -= dt;
    const hb = Math.max(0, colH(x, y) - 5) * .3, lv = tw.lvl;
    if(tw.type === 'bow'){
      if(tw.cd > 0) continue;
      const r = 3.3 + rangeBonus() + hb;
      const c = mobsNear(x, y, r, false);
      if(!c.length) continue;
      c.sort((a, b) => priority(a[0]) - priority(b[0]));
      const m = c[0][0];
      const dmg = 10 * (1 + .35 * (G.up.arrowDmg || 0)) * (1 + .6 * (lv - 1));
      G.shots.push({ x, y, z:towerTop(x, y) + .3, m, dmg, spd:12, life:1.5 });
      tw.cd = 1.05 / (1 + .25 * (G.up.arrowRate || 0)) / (1 + .2 * (lv - 1));
      AU.twang();
    } else if(tw.type === 'fire'){
      if(Math.random() < dt * 10) part3(x + rnd(-.2, .2), y + rnd(-.2, .2), towerTop(x, y) - .2, rnd(-.2, .2), rnd(-.2, .2), rnd(1.5, 3), pick(['#ff6a1a', '#ffb03a', '#ffe08a']), rnd(.3, .6), 3, -2);
      if(tw.cd > 0) continue;
      tw.cd = .3;
      const r = 1.6 + rangeBonus() * .5;
      const dmg = 4.5 * (1 + .4 * (G.up.fireUp || 0)) * (1 + .6 * (lv - 1));
      for(const [m] of mobsNear(x, y, r, false)){ if(m.fly && m.z > colH(x, y) + 3) continue; damageMob(m, dmg, 'fire'); if(Math.random() < .5) part3(m.x, m.y, m.z + .3, 0, 0, 2, '#ff8a1f', .3, 2); }
    } else if(tw.type === 'spire'){
      if(tw.cd > 0) continue;
      tw.cd = .2;
      const r = 3 + rangeBonus() + hb;
      const c = mobsNear(x, y, r, false).sort((a, b) => a[1] - b[1]).slice(0, 3);
      const dmg = 3.4 * (1 + .4 * (G.up.spireUp || 0)) * (1 + .6 * (lv - 1));
      for(const [m] of c){ damageMob(m, dmg, 'spire'); G.beams.push({ x1:x, y1:y, z1:towerTop(x, y) + .5, x2:m.x, y2:m.y, z2:m.z + m.d.size * .5, life:.2, c:'#3ff0ff' }); }
      if(c.length && Math.random() < .3) AU.zap();
    } else if(tw.type === 'blast'){
      if(tw.fuse < 0){
        if(mobsNear(x, y, 1.15, true).length) { tw.fuse = .45; AU.fuse(); }
      } else {
        tw.fuse -= dt;
        if(tw.fuse <= 0){
          TWR[x][y] = null; G.flowDirty = true;
          const k = 1 + .3 * (G.up.blastUp || 0);
          explode(x, y, 1.7 * k, 70 * k, 'blast', true);
        }
      }
    }
  }
}
function updShots(dt){
  for(let i = G.shots.length - 1; i >= 0; i--){
    const s = G.shots[i];
    s.life -= dt;
    const m = s.m, tz = m.z + m.d.size * .5;
    const dx = m.x - s.x, dy = m.y - s.y, dz = tz - s.z, dist = Math.hypot(dx, dy, dz), step = s.spd * dt;
    if(m.dead || s.life <= 0){ G.shots.splice(i, 1); continue; }
    if(dist <= step + .1){ damageMob(m, s.dmg, 'arrow'); AU.hit(); part3(m.x, m.y, tz, 0, 0, 1, '#ffffff', .2, 2); G.shots.splice(i, 1); continue; }
    s.px = s.x; s.py = s.y; s.pz = s.z;
    s.x += dx / dist * step; s.y += dy / dist * step; s.z += dz / dist * step;
  }
}

function explode(x, y, r, dmg, src, crater){
  AU.boom(false); G.shake = Math.min(24, G.shake + 12); G.flash = Math.max(G.flash, .35); G.flashCol = '#ffb020';
  const e = colH(Math.round(x), Math.round(y)) + .5;
  for(let i = 0; i < 40; i++) part3(x, y, e, rnd(-5, 5), rnd(-5, 5), rnd(2, 8), pick(['#ffb020', '#ff6a1a', '#ffe08a', '#555560']), rnd(.4, 1), rnd(3, 6));
  G.pops.push({ ring:true, x, y, z:e, r:0, max:r, life:.4 });
  for(const m of G.mobs){ if(m.dead) continue; const d = Math.hypot(m.x - x, m.y - y); if(d <= r){ m.stun = Math.max(m.stun, .3); damageMob(m, dmg * (1 - d / r * .5), src === 'bug' ? 'blast' : src); } }
  if(!crater) return;
  const R = Math.ceil(r);
  for(let cx0 = Math.round(x) - R; cx0 <= Math.round(x) + R; cx0++) for(let cy0 = Math.round(y) - R; cy0 <= Math.round(y) + R; cy0++){
    if(!inIsle(cx0, cy0) || isHeart(cx0, cy0)) continue;
    const d = Math.hypot(cx0 - x, cy0 - y); if(d > r) continue;
    const depth = d < r * .45 ? 2 : 1;
    for(let k = 0; k < depth; k++) if(colH(cx0, cy0) > 2 || TWR[cx0][cy0]) removeTop(cx0, cy0, 'boom');
  }
}

/* ---------------- tutorial ---------------- */
function tickTutorial(dt){
  if(!G.tut) return;
  G.tutT += dt;
  if(G.tutStep === 0 && G.tutMined >= 1){ G.tutStep = 1; G.tutT = 0; tip('Keep digging! Stone hides <em>ORE</em> — iron builds towers.'); }
  if(G.tutStep === 1 && (G.tutMined >= 5 || G.tutT > 14) && !G.ptr.down){ G.tutStep = 2; G.tutT = 0; selectTool('bow'); tip('Tap a block to build a <b>BOW TOWER</b> on it.'); }
}

/* ---------------- fx ---------------- */
function partCap(){ return G.q === 'low' ? 250 : 700; }
function part3(x, y, z, vx, vy, vz, c, life, s, g){ if(G.parts.length < partCap()) G.parts.push({ x, y, z, vx, vy, vz, c, life, max:life, s, g:g == null ? 14 : g }); }
function chips(x, y, z, c, n){ for(let i = 0; i < n; i++) part3(x + rnd(-.3, .3), y + rnd(-.3, .3), z, rnd(-2.2, 2.2), rnd(-2.2, 2.2), rnd(2, 5), i % 3 ? c : shadeHex(c, .7), rnd(.35, .7), rnd(2, 4)); }
function dust(x, y, z, n){ for(let i = 0; i < n; i++) part3(x, y, z + .05, rnd(-2.5, 2.5), rnd(-2.5, 2.5), rnd(.5, 1.5), '#d8d0c0', rnd(.3, .6), rnd(2, 4), 3); }
function poof(x, y, z, c){ for(let i = 0; i < 16; i++) part3(x, y, z, rnd(-1.5, 1.5), rnd(-1.5, 1.5), rnd(0, 3), c, rnd(.4, .8), rnd(3, 5), 2); }
function pop3(x, y, z, txt, c, size){ if(G.pops.length > 24) G.pops.shift(); G.pops.push({ x, y, z, txt, c, size:size || 13, life:1.1 }); }
function tickFx(dt){
  for(let i = G.parts.length - 1; i >= 0; i--){
    const p = G.parts[i]; p.life -= dt;
    if(p.life <= 0){ G.parts.splice(i, 1); continue; }
    p.vz -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    const cx0 = Math.round(p.x), cy0 = Math.round(p.y);
    if(inIsle(cx0, cy0) && p.z < colH(cx0, cy0) && p.vz < 0){ p.z = colH(cx0, cy0); p.vz *= -.3; p.vx *= .6; p.vy *= .6; }
  }
  for(let i = G.pops.length - 1; i >= 0; i--){
    const p = G.pops[i]; p.life -= dt;
    if(p.ring) p.r = p.max * (1 - p.life / .4);
    else p.z += dt * .8;
    if(p.life <= 0) G.pops.splice(i, 1);
  }
}

/* ---------------- missions / events ---------------- */
function ev(type, v){
  const r = G.runEv, mt = MT.find(m => m.ev === type);
  if(!mt) return;
  r[type] = mt.kind === 'sum' ? (r[type] || 0) + v : Math.max(r[type] || 0, v);
  for(const m of save.missions){
    if(m.done || m.ev !== type) continue;
    const prog = mt.kind === 'sum' ? m.p + r[type] : Math.max(m.p, r[type]);
    if(prog >= m.n){
      m.done = true; m.p = m.n; m.fresh = true;
      save.gems += m.reward; save.missionsDone++;
      save.mTier[m.id] = (save.mTier[m.id] || 0) + 1;
      toast('MISSION COMPLETE', m.txt + '  <b class="gem">+' + m.reward + ' ◆</b>', '#8fd14f', 3600);
      AU.levelUp(); persist();
    }
  }
}
function commitMissions(){
  for(const m of save.missions){
    if(m.done) continue;
    const mt = MT.find(t => t.id === m.id), r = G.runEv[m.ev] || 0;
    m.p = mt.kind === 'sum' ? m.p + r : Math.max(m.p, r);
  }
}
function rollMissions(){
  save.missions = save.missions.filter(m => !m.done);
  const have = new Set(save.missions.map(m => m.id));
  let guard = 0;
  while(save.missions.length < 3 && guard++ < 60){
    const t = pick(MT); if(have.has(t.id)) continue;
    const tier = save.mTier[t.id] || 0;
    const n = Math.round(t.vals[Math.min(tier, t.vals.length - 1)] * (tier >= t.vals.length ? 1 + (tier - t.vals.length + 1) * .5 : 1));
    save.missions.push({ id:t.id, ev:t.ev, n, p:0, done:false, txt:t.txt(n), reward:30 + tier * 25 });
    have.add(t.id); save.mNew = true;
  }
}
