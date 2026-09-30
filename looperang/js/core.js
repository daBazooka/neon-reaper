'use strict';
/* =====================================================================
   LOOPERANG: data, save, flight simulation and level generator.
   stepRang() is the only physics in the game. The level generator runs
   the exact same function with a recorded throw, so every level ships
   with a throw that is proven to clear it (it also powers the hint).
   ===================================================================== */
const LW = 1600, LH = 900, DT = 1 / 120, TAU = Math.PI * 2;
const P = {
  rr: 20, gemR: 38, starR: 36, catchR: 86, handDY: -56,
  om: 2.25, omHold: 5.4, turnBack: Math.PI * 1.75, tOut: 3.6,
  homeRate: 7.5, spdRet: 1250, ghostAfter: 2.2, tMax: 11,
  spMin: 640, spMax: 1280, bumpMul: 1.18, spCap: 1750, wallT: 13, portR: 54
};

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
function angDiff(a, b){ let d = (b - a) % TAU; if(d > Math.PI) d -= TAU; if(d < -Math.PI) d += TAU; return d; }
function mulberry(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function segDist(px, py, s){
  const dx = s.bx - s.ax, dy = s.by - s.ay, l2 = dx * dx + dy * dy || 1;
  const t = clamp(((px - s.ax) * dx + (py - s.ay) * dy) / l2, 0, 1);
  const qx = s.ax + dx * t, qy = s.ay + dy * t;
  return { d: Math.hypot(px - qx, py - qy), qx, qy };
}

/* ---------------- worlds ---------------- */
const WORLDS = [
  { name: 'Sunny Meadow',  sky: ['#48b8ff', '#c9f1ff'], hill: ['#8fdc62', '#5fbf4a'], island: '#6fcf52', gem: '#ff4f8b', feat: [], tip: 'Loop through every gem, then catch it!' },
  { name: 'Rocky Canyon',  sky: ['#ff9d5c', '#ffe0b0'], hill: ['#e0955a', '#bd6c3c'], island: '#d98a4e', gem: '#3ad8ff', feat: ['walls'], tip: 'Rocks bounce your boomerang. Use them!' },
  { name: 'Bouncy Castle', sky: ['#b58bff', '#ffd3f1'], hill: ['#ff9fd6', '#d879c9'], island: '#ffa6dc', gem: '#4dffb0', feat: ['bumpers'], tip: 'Jelly bumpers bounce it back even faster!' },
  { name: 'Windy Peaks',   sky: ['#77b9ff', '#eef7ff'], hill: ['#d7e8f7', '#a9c4e0'], island: '#e9f3fb', gem: '#ff7a3a', feat: ['wind'], tip: 'Wind pushes your boomerang. Ride the breeze!' },
  { name: 'Warp Woods',    sky: ['#1f5f55', '#8fe0b4'], hill: ['#2f8a5c', '#1d6645'], island: '#3ea56c', gem: '#ffe14d', feat: ['portals'], tip: 'Fly into a portal, pop out of its twin!' },
  { name: 'Saw Mill',      sky: ['#5b7899', '#cddded'], hill: ['#8aa0b8', '#62798f'], island: '#9bb0c4', gem: '#ff5ad0', feat: ['saws'], tip: 'Saws move. Time your throw!' },
  { name: 'Candy Cosmos',  sky: ['#ff7fc1', '#ffe6a3'], hill: ['#ffb870', '#ff8fa8'], island: '#fff0f7', gem: '#5a8cff', feat: ['walls', 'bumpers', 'wind'], tip: 'Everything at once. Sweet chaos!' },
  { name: 'Starry Summit', sky: ['#141a46', '#5b3a95'], hill: ['#2c2f6e', '#1c1d4d'], island: '#6b6fd8', gem: '#7dffea', feat: ['walls', 'bumpers', 'wind', 'portals', 'saws'], tip: 'The final climb. Show them your best loops!' }
];
const LEVELS_PER_WORLD = 10, MAIN_LEVELS = WORLDS.length * LEVELS_PER_WORLD;
function worldOf(n){ return Math.min(WORLDS.length - 1, Math.floor((n - 1) / LEVELS_PER_WORLD)); }

/* ---------------- cosmetics ---------------- */
const RANGS = [
  { id: 'wood',    name: 'Classic',  price: 0,    c1: '#e3a15a', c2: '#a8642c', trail: ['#ffd36b', '#ff9a3c'] },
  { id: 'candy',   name: 'Candy',    price: 150,  c1: '#ff7fbf', c2: '#ffffff', trail: ['#ff7fbf', '#fff0f8'] },
  { id: 'leaf',    name: 'Leafy',    price: 300,  c1: '#6fdc52', c2: '#2f9a3a', trail: ['#b6ff7a', '#4fd06a'] },
  { id: 'ice',     name: 'Frosty',   price: 500,  c1: '#bff3ff', c2: '#46b6e8', trail: ['#e8fdff', '#72d8ff'] },
  { id: 'fire',    name: 'Blaze',    price: 800,  c1: '#ffb13a', c2: '#e8411f', trail: ['#fff06b', '#ff5a1f'] },
  { id: 'neon',    name: 'Neon',     price: 1100, c1: '#3affd8', c2: '#ff3ad8', trail: ['#3affd8', '#ff3ad8'] },
  { id: 'rainbow', name: 'Rainbow',  price: 1600, c1: '#ff5a5a', c2: '#5a8cff', trail: 'rainbow' },
  { id: 'galaxy',  name: 'Galaxy',   price: 2500, c1: '#2a1b6e', c2: '#ffe14d', trail: ['#b98cff', '#3a2a9e'] }
];
const HATS = [
  { id: 'none',   name: 'No hat',     price: 0 },
  { id: 'cap',    name: 'Cap',        price: 200 },
  { id: 'flower', name: 'Flower',     price: 350 },
  { id: 'phones', name: 'Headphones', price: 550 },
  { id: 'pirate', name: 'Pirate',     price: 700 },
  { id: 'wizard', name: 'Wizard',     price: 900 },
  { id: 'crown',  name: 'Crown',      price: 1300 },
  { id: 'halo',   name: 'Halo',       price: 2000 }
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'looperang_save_v1';
function defSave(){
  return {
    v: 1, lvl: 1, cur: 1, stars: {}, coins: 0,
    rang: 'wood', hat: 'none', own: { wood: 1, none: 1 },
    sfx: 1, music: 1,
    daily: { day: 0, streak: 0, done: 0 },
    st: { throws: 0, gems: 0, clears: 0, tricks: 0, stars3: 0 },
    tut: 0, holdTut: 0, seenWorld: 0, chests: {}
  };
}
function mergeInto(base, src){
  if(!src || typeof src !== 'object') return base;
  for(const k in src){
    const b = base[k], v = src[k];
    if(b && typeof b === 'object' && !Array.isArray(b) && v && typeof v === 'object') mergeInto(b, v);
    else if(b === undefined || typeof b === typeof v) base[k] = v;
  }
  return base;
}
let S = defSave();
try{ S = mergeInto(defSave(), JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); }catch(e){}
function persist(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(S)); }catch(e){} }
function totalStars(){ let t = 0; for(const k in S.stars) t += S.stars[k]; return t; }
function dayNum(){ const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000); }

/* ---------------- flight simulation ---------------- */
function handOf(L){ return { x: L.roo.x, y: L.roo.y + P.handDY }; }
function makeRang(L, ang, pow){
  const h = handOf(L);
  return {
    x: h.x + Math.cos(ang) * 30, y: h.y + Math.sin(ang) * 30, a: ang,
    s: P.spMin + (P.spMax - P.spMin) * clamp(pow, 0, 1),
    t: 0, turned: 0, ph: 0, homeT: 0, ghost: false, pc: 0,
    got: 0, gm: [], star: false, bounces: 0, wallHits: 0, bumps: 0, warps: 0, windT: 0,
    near: [], dead: false, caught: false, spin: 0
  };
}
function sawPos(z, gt){
  const k = z.sp ? Math.sin(z.sp * gt + z.ph) : 0;
  return { x: z.x + z.mx * k, y: z.y + z.my * k };
}
/* one fixed step; ev(type, ...) reports what happened (sound, particles, tricks) */
function stepRang(L, b, hold, gt, ev){
  b.t += DT; b.spin += b.s * DT * 0.05;
  if(b.pc > 0) b.pc -= DT;
  const h = handOf(L);
  if(b.ph === 0){
    const w = hold ? P.omHold : P.om;
    b.a += w * DT; b.turned += w * DT;
    if(b.turned >= P.turnBack || b.t >= P.tOut){ b.ph = 1; ev && ev('turn'); }
  }else{
    b.homeT += DT;
    const want = Math.atan2(h.y - b.y, h.x - b.x);
    const m = P.homeRate * DT * (1 + b.homeT * 0.8);
    b.a += clamp(angDiff(b.a, want), -m, m);
    b.s += (P.spdRet - b.s) * Math.min(1, 2.5 * DT);
    if(!b.ghost && b.homeT > P.ghostAfter){ b.ghost = true; ev && ev('ghost'); }
  }
  let vx = Math.cos(b.a) * b.s, vy = Math.sin(b.a) * b.s;
  if(!b.ghost){
    for(const z of L.winds){
      if(b.x > z.x && b.x < z.x + z.w && b.y > z.y && b.y < z.y + z.h){
        vx += z.ax * DT; vy += z.ay * DT; b.windT += DT;
        const l = Math.hypot(vx, vy); vx *= b.s / l; vy *= b.s / l;
      }
    }
  }
  b.x += vx * DT; b.y += vy * DT;
  const rr = P.rr;
  if(!b.ghost){
    let hit = false;
    if(b.x < rr){ b.x = rr; vx = Math.abs(vx); hit = true; }
    if(b.x > LW - rr){ b.x = LW - rr; vx = -Math.abs(vx); hit = true; }
    if(b.y < rr){ b.y = rr; vy = Math.abs(vy); hit = true; }
    if(b.y > LH - rr){ b.y = LH - rr; vy = -Math.abs(vy); hit = true; }
    if(hit){ b.bounces++; ev && ev('edge', b.x, b.y); }
    for(const s of L.walls){
      const q = segDist(b.x, b.y, s);
      if(q.d < rr + P.wallT){
        const nx = (b.x - q.qx) / (q.d || 1), ny = (b.y - q.qy) / (q.d || 1);
        const dot = vx * nx + vy * ny;
        if(dot < 0){ vx -= 2 * dot * nx; vy -= 2 * dot * ny; b.bounces++; b.wallHits++; ev && ev('wall', b.x, b.y, s); }
        b.x = q.qx + nx * (rr + P.wallT + 0.5); b.y = q.qy + ny * (rr + P.wallT + 0.5);
      }
    }
    for(const u of L.bumpers){
      const d = dist(b.x, b.y, u.x, u.y);
      if(d < rr + u.r){
        const nx = (b.x - u.x) / (d || 1), ny = (b.y - u.y) / (d || 1);
        const dot = vx * nx + vy * ny;
        if(dot < 0){
          vx -= 2 * dot * nx; vy -= 2 * dot * ny;
          b.s = Math.min(P.spCap, b.s * P.bumpMul); b.bumps++; b.bounces++;
          ev && ev('bump', b.x, b.y, u);
        }
        b.x = u.x + nx * (rr + u.r + 0.5); b.y = u.y + ny * (rr + u.r + 0.5);
      }
    }
    if(b.pc <= 0){
      for(const pt of L.portals){
        for(let k = 0; k < 2; k++){
          const ax = k ? pt.bx : pt.ax, ay = k ? pt.by : pt.ay, bx = k ? pt.ax : pt.bx, by = k ? pt.ay : pt.by;
          if(dist(b.x, b.y, ax, ay) < P.portR * 0.7){
            const fx = b.x, fy = b.y;
            b.x = bx + (b.x - ax); b.y = by + (b.y - ay);
            b.pc = 0.4; b.warps++; ev && ev('warp', fx, fy, b.x, b.y);
            break;
          }
        }
        if(b.pc > 0) break;
      }
    }
  }
  b.a = Math.atan2(vy, vx);
  for(let i = 0; i < L.gems.length; i++){
    if(b.gm[i]) continue;
    const g = L.gems[i];
    if(dist(b.x, b.y, g.x, g.y) < P.gemR + rr){ b.gm[i] = 1; b.got++; ev && ev('gem', i, g.x, g.y); }
  }
  if(L.star && !b.star && dist(b.x, b.y, L.star.x, L.star.y) < P.starR + rr){ b.star = true; ev && ev('star', L.star.x, L.star.y); }
  if(!b.ghost){
    for(let i = 0; i < L.spikes.length; i++){
      const z = L.spikes[i], p = sawPos(z, gt);
      const d = dist(b.x, b.y, p.x, p.y);
      if(d < z.r + rr - 4){ b.dead = true; ev && ev('die', b.x, b.y); return; }
      if(d < z.r + rr + 26 && !b.near[i]){ b.near[i] = 1; ev && ev('near', p.x, p.y); }
    }
  }
  if(b.ph === 1 && dist(b.x, b.y, h.x, h.y) < P.catchR){ b.caught = true; ev && ev('catch'); return; }
  if(b.t > P.tMax){ b.dead = true; ev && ev('lost', b.x, b.y); }
}
/* run a whole throw; holds = [[fromStep, toStep], ...] */
function simulate(L, ang, pow, holds){
  const b = makeRang(L, ang, pow), path = [];
  let i = 0;
  while(!b.caught && !b.dead){
    let hold = false;
    for(const hh of holds) if(i >= hh[0] && i < hh[1]) hold = true;
    stepRang(L, b, hold, b.t, null);
    if(i % 2 === 0) path.push({ x: b.x, y: b.y, h: hold ? 1 : 0, ph: b.ph });
    i++;
  }
  b.path = path; b.steps = i;
  return b;
}

/* ---------------- level generator ---------------- */
function levelSpec(n){
  const w = worldOf(n), i = (n - 1) % LEVELS_PER_WORLD, r = mulberry(n * 7919 + 13);
  const feats = new Set(WORLDS[w].feat);
  if(n > MAIN_LEVELS){
    const all = ['walls', 'bumpers', 'wind', 'portals', 'saws'];
    feats.clear();
    const k = 2 + Math.floor(r() * 2);
    while(feats.size < k) feats.add(all[Math.floor(r() * all.length)]);
  }else if(w >= 2 && w <= 5 && i >= 4){
    const prev = ['walls', 'bumpers', 'wind', 'portals'].slice(0, w - 1);
    feats.add(prev[Math.floor(r() * prev.length)]);
  }
  const extra = n > MAIN_LEVELS ? 1 : 0;
  return {
    n, w, i, feats,
    gems: Math.min(7, 2 + Math.floor(i / 3) + (w >= 1 ? 1 : 0) + (n > 40 ? 1 : 0) + extra),
    spikes: w === 0 ? (i >= 5 ? 1 + Math.floor((i - 5) / 2) : 0) : Math.min(6, 1 + Math.floor(i / 4) + Math.floor(w / 2) + extra),
    holdP: n < 6 ? 0 : n === 6 ? 1 : 0.35 + 0.35 * Math.min(1, n / 80),
    treasure: i === 4,
    grand: i === 9,
    preview: Math.max(0.3, 1.25 - (n - 1) * 0.1)
  };
}

function genLevel(n, seed){
  const spec = levelSpec(n);
  const r = mulberry(seed != null ? seed : n * 104729 + 7);
  const rr = (a, b) => a + r() * (b - a);
  for(let at = 0; at < 80; at++){
    const relax = at >= 40;
    const f = spec.feats;
    const L = {
      n, w: spec.w, spec, roo: spec.n <= 5 ? { x: rr(200, 260), y: rr(470, 560) } : { x: rr(170, 250), y: rr(380, 660) },
      walls: [], bumpers: [], winds: [], portals: [], spikes: [], gems: [], star: null,
      sol: null, par: 0, solPath: null
    };
    const h = handOf(L);
    const farRoo = (x, y, d) => dist(x, y, L.roo.x, L.roo.y) > d;
    const clearOf = (x, y, d) => {
      for(const s of L.walls) if(segDist(x, y, s).d < d) return false;
      for(const u of L.bumpers) if(dist(x, y, u.x, u.y) < d + u.r) return false;
      for(const p of L.portals) if(dist(x, y, p.ax, p.ay) < d + P.portR || dist(x, y, p.bx, p.by) < d + P.portR) return false;
      return true;
    };
    if(f.has('walls')){
      const k = 1 + Math.floor(r() * (spec.n > 15 ? 3 : 2));
      for(let t = 0; t < 40 && L.walls.length < k; t++){
        const cx = rr(500, 1420), cy = rr(150, 750), len = rr(170, 340), a = r() * Math.PI;
        const s = { ax: cx - Math.cos(a) * len / 2, ay: cy - Math.sin(a) * len / 2, bx: cx + Math.cos(a) * len / 2, by: cy + Math.sin(a) * len / 2 };
        if(Math.min(s.ax, s.bx) < 60 || Math.max(s.ax, s.bx) > LW - 60 || Math.min(s.ay, s.by) < 60 || Math.max(s.ay, s.by) > LH - 60) continue;
        if(segDist(L.roo.x, L.roo.y, s).d < 280 || !clearOf(cx, cy, 110)) continue;
        L.walls.push(s);
      }
    }
    if(f.has('bumpers')){
      const k = 1 + Math.floor(r() * 3);
      for(let t = 0; t < 40 && L.bumpers.length < k; t++){
        const x = rr(480, 1450), y = rr(130, 770), rad = rr(48, 70);
        if(!farRoo(x, y, 300) || !clearOf(x, y, rad + 60)) continue;
        L.bumpers.push({ x, y, r: rad });
      }
    }
    if(f.has('portals')){
      for(let t = 0; t < 60 && !L.portals.length; t++){
        const ax = rr(480, 1400), ay = rr(130, 770), bx = rr(420, 1460), by = rr(120, 780);
        if(dist(ax, ay, bx, by) < 480 || !farRoo(ax, ay, 300) || !farRoo(bx, by, 260)) continue;
        if(!clearOf(ax, ay, 110) || !clearOf(bx, by, 110)) continue;
        L.portals.push({ ax, ay, bx, by });
      }
    }
    if(f.has('wind')){
      const k = spec.n > 50 && r() < 0.5 ? 2 : 1;
      for(let t = 0; t < 30 && L.winds.length < k; t++){
        const w = rr(260, 420), hh = rr(200, 340), x = rr(420, LW - w - 60), y = rr(50, LH - hh - 50);
        if(L.winds.some(z => x < z.x + z.w && x + w > z.x && y < z.y + z.h && y + hh > z.y)) continue;
        const a = r() * TAU, st = rr(900, 1250);
        L.winds.push({ x, y, w, h: hh, ax: Math.cos(a) * st, ay: Math.sin(a) * st });
      }
    }
    // find a good throw through this layout
    let best = null, bs = -1e9;
    for(let k = 0; k < 70; k++){
      const ang = (r() * 2 - 1) * 1.75, pow = rr(0.3, 1);
      const holds = [];
      if(r() < spec.holdP){ const s0 = Math.floor(rr(0.15, 1.3) / DT); holds.push([s0, s0 + Math.floor(rr(0.25, 0.8) / DT)]); }
      const res = simulate(L, ang, pow, holds);
      if(!res.caught || res.ghost) continue;
      if(!relax){
        if(f.has('walls') && L.walls.length && res.wallHits < 1) continue;
        if(f.has('bumpers') && L.bumpers.length && res.bumps < 1) continue;
        if(f.has('portals') && L.portals.length && res.warps < 1) continue;
        if(f.has('wind') && L.winds.length && res.windT < 0.2) continue;
      }
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for(const p of res.path){ x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
      if(!relax && x1 - x0 < 380) continue;
      const sc = (x1 - x0) * (y1 - y0) / (LW * LH) * 1.5 + Math.min(3, res.wallHits) * 0.25 + Math.min(2, res.bumps) * 0.3 +
        res.warps * 0.5 + Math.min(1, res.windT) * 0.6 + (holds.length ? 0.4 : 0) + r() * 0.35 - (res.t > 6 ? 0.6 : 0) -
        (res.bounces - res.wallHits - res.bumps) * (spec.n <= 5 ? 0.8 : spec.n <= 12 ? 0.3 : 0.08);
      if(sc > bs){ bs = sc; best = { ang, pow, holds, res }; }
    }
    if(!best) continue;
    // usable path: away from Roo's hand, with arc length
    const U = [];
    let arc = 0, px = h.x, py = h.y;
    for(const p of best.res.path){
      arc += dist(p.x, p.y, px, py); px = p.x; py = p.y;
      if(dist(p.x, p.y, h.x, h.y) > 190 && p.x > 50 && p.x < LW - 50 && p.y > 50 && p.y < LH - 50) U.push({ x: p.x, y: p.y, arc });
    }
    if(U.length < 20) continue;
    // "human hands": slightly-off copies of the throw. Gems only go where most of them also pass,
    // so a level forgives a little aiming error (less and less as levels go on).
    const jit = (sol, q) => ({
      ang: sol.ang + (q() * 2 - 1) * 0.04, pow: clamp(sol.pow + (q() * 2 - 1) * 0.04, 0, 1),
      holds: sol.holds.map(hh => { const sh = Math.round((q() * 2 - 1) * 6); return [hh[0] + sh, hh[1] + sh + Math.round((q() * 2 - 1) * 6)]; })
    });
    const robMin = Math.max(0.2, 0.62 - spec.n * 0.0055), covMin = Math.min(0.9, robMin + 0.22);
    const jp = [];
    for(let k = 0; k < 12; k++){
      const j = jit(best, r), v = simulate(L, j.ang, j.pow, j.holds);
      if(v.caught) jp.push(v.path);
    }
    const reach = (P.gemR + P.rr) * 0.8, reach2 = reach * reach;
    const cov = U.map(u => {
      let n = 0;
      for(const pth of jp){ for(const q of pth){ if((q.x - u.x) * (q.x - u.x) + (q.y - u.y) * (q.y - u.y) < reach2){ n++; break; } } }
      return n / 12;
    });
    const a0 = U[0].arc, span = U[U.length - 1].arc - a0;
    const pointAt = u => { const target = a0 + u * span; let lo = 0; while(lo < U.length - 1 && U[lo].arc < target) lo++; return lo; };
    const perp = (j, off) => {
      const p = U[j], q = U[Math.min(U.length - 1, j + 1)], o = U[Math.max(0, j - 1)];
      const dx = q.x - o.x, dy = q.y - o.y, l = Math.hypot(dx, dy) || 1;
      return { x: p.x - dy / l * off, y: p.y + dx / l * off };
    };
    const tooClose = (x, y, d) => L.gems.some(g => dist(x, y, g.x, g.y) < d);
    for(let j = 0; j < spec.gems; j++){
      for(let t = 0; t < 12; t++){
        const u = clamp(0.06 + 0.88 * (j + 0.5) / spec.gems + (r() - 0.5) * (0.05 + t * 0.03), 0, 1);
        const pi = pointAt(u);
        if(cov[pi] < covMin) continue;
        const g = perp(pi, (r() * 2 - 1) * 8);
        if(tooClose(g.x, g.y, 120)) continue;
        L.gems.push({ x: g.x, y: g.y });
        break;
      }
    }
    if(L.gems.length < Math.max(2, spec.gems - 1)) continue;
    for(let t = 0; t < 30 && !L.star; t++){
      const si = Math.floor(r() * U.length);
      if(cov[si] < covMin * 0.8) continue;
      const s = perp(si, (r() * 2 - 1) * 8);
      if(!tooClose(s.x, s.y, 130)) L.star = { x: s.x, y: s.y };
    }
    if(!L.star) continue;
    // hazards: never on the proven path, often scarily close to it
    const path = best.res.path;
    const pathMin = (x, y) => { let m = 1e9; for(const p of path){ const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y); if(d < m) m = d; } return Math.sqrt(m); };
    const nSpk = spec.spikes;
    for(let t = 0; t < 160 && L.spikes.length < nSpk; t++){
      const sr = rr(25, 31 + spec.w * 1.5);
      let x, y;
      if(r() < 0.65){
        const p = path[Math.floor(r() * path.length)], q = path[Math.min(path.length - 1, path.indexOf(p) + 1)];
        const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1, off = (P.rr + sr + 34 + r() * 70) * (r() < 0.5 ? -1 : 1);
        x = p.x - dy / l * off; y = p.y + dx / l * off;
      }else{ x = rr(380, LW - 60); y = rr(60, LH - 60); }
      if(x < 60 || x > LW - 60 || y < 60 || y > LH - 60) continue;
      const z = { x, y, r: sr, mx: 0, my: 0, sp: 0, ph: 0, saw: false };
      if(f.has('saws') && r() < 0.7){
        const a = r() * TAU, amp = rr(90, 190);
        z.mx = Math.cos(a) * amp; z.my = Math.sin(a) * amp; z.sp = rr(1.2, 2.3); z.ph = r() * TAU; z.saw = true;
      }
      let ok = true;
      for(let q = 0; q <= 12 && ok; q++){
        const k = z.sp ? Math.sin(q / 12 * TAU) : 0, sx = x + z.mx * k, sy = y + z.my * k;
        if(sx < 40 || sx > LW - 40 || sy < 40 || sy > LH - 40) ok = false;
        else if(pathMin(sx, sy) < P.rr + sr + 26) ok = false;
        else if(!farRoo(sx, sy, 190) || tooClose(sx, sy, sr + 58)) ok = false;
        else if(dist(sx, sy, L.star.x, L.star.y) < sr + 50) ok = false;
        else if(!clearOf(sx, sy, sr + 34)) ok = false;
        else if(L.spikes.some(o => dist(sx, sy, o.x, o.y) < sr + o.r + 40 + Math.hypot(o.mx, o.my))) ok = false;
      }
      if(ok) L.spikes.push(z);
    }
    if(L.spikes.length < nSpk && !relax) continue;
    // prove it: replay the recorded throw against the finished level
    L.sol = { ang: best.ang, pow: best.pow, holds: best.holds };
    const v = simulate(L, best.ang, best.pow, best.holds);
    if(!v.caught || v.dead || v.got < L.gems.length || !v.star) continue;
    let wins = 0;
    for(let k = 0; k < 16; k++){
      const j = jit(best, r), w = simulate(L, j.ang, j.pow, j.holds);
      if(w.caught && !w.dead && w.got === L.gems.length) wins++;
    }
    if(wins / 16 < robMin && at < 70) continue;
    L.par = Math.round((v.t * 1.2 + 0.5) * 10) / 10;
    L.solPath = v.path;
    return L;
  }
  // should never happen: a plain loop with two gems
  const L = { n, w: spec.w, spec, roo: { x: 200, y: 500 }, walls: [], bumpers: [], winds: [], portals: [], spikes: [], gems: [], star: null, sol: { ang: -0.5, pow: 0.7, holds: [] }, par: 5, solPath: null };
  const v = simulate(L, -0.5, 0.7, []);
  const pts = v.path.filter(p => dist(p.x, p.y, 200, 460) > 200);
  L.gems = [pts[Math.floor(pts.length * 0.25)], pts[Math.floor(pts.length * 0.6)]].map(p => ({ x: p.x, y: p.y }));
  L.star = { x: pts[Math.floor(pts.length * 0.42)].x, y: pts[Math.floor(pts.length * 0.42)].y };
  L.solPath = v.path;
  return L;
}
/* levels are pure functions of their number: cache them, and build the next one during the win screen */
const LCACHE = new Map();
function getLevel(n){
  if(!LCACHE.has(n)){ LCACHE.set(n, genLevel(n)); if(LCACHE.size > 6) LCACHE.delete(LCACHE.keys().next().value); }
  return LCACHE.get(n);
}
function dailyLevel(){
  const d = dayNum();
  const n = 22 + (d * 37) % 55;
  const L = genLevel(n, d * 9973 + 1234567);
  L.daily = true;
  return L;
}
