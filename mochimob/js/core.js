'use strict';
/* =====================================================================
   MOCHI MOB: data, save, upgrades, missions and day layouts.
   ===================================================================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');

/* ---------------- flavors (skins) ---------------- */
const FLAVORS = [
  { id: 'milk',    name: 'Milky',      c: '#fff6f2', c2: '#ffd3df', price: 0 },
  { id: 'straw',   name: 'Strawberry', c: '#ffc2d4', c2: '#ff7ea6', price: 300 },
  { id: 'matcha',  name: 'Matcha',     c: '#d3f5b4', c2: '#8fd46a', price: 600 },
  { id: 'mango',   name: 'Mango',      c: '#ffe79a', c2: '#ffb44d', price: 1000 },
  { id: 'taro',    name: 'Taro',       c: '#e2cfff', c2: '#a98bff', price: 1500 },
  { id: 'soda',    name: 'Soda',       c: '#c4f0ff', c2: '#62cdff', price: 2200 },
  { id: 'choco',   name: 'Choco',      c: '#d6ab8a', c2: '#8a5a3c', price: 3000 },
  { id: 'rainbow', name: 'Rainbow',    c: 'rainbow', c2: '#ffffff', price: 5000 }
];

/* ---------------- upgrades ---------------- */
const UPG = [
  { id: 'size',     icon: '🍡', name: 'Bigger Mob',    desc: '+3 mochi at the start of every day', base: 50,  mul: 1.42, max: 30 },
  { id: 'speed',    icon: '💨', name: 'Zoomies',       desc: 'Your mob runs faster',               base: 70,  mul: 1.5,  max: 15 },
  { id: 'bite',     icon: '😤', name: 'Big Bites',     desc: 'Hit gobblers and crates harder',     base: 80,  mul: 1.5,  max: 20 },
  { id: 'strength', icon: '💪', name: 'Strong Arms',   desc: 'Each mochi lifts more treasure',     base: 90,  mul: 1.55, max: 15 },
  { id: 'hatch',    icon: '🥚', name: 'Lucky Eggs',    desc: 'Eggs hatch more mochi',              base: 100, mul: 1.55, max: 15 },
  { id: 'magnet',   icon: '🧲', name: 'Sweet Tooth',   desc: 'Grab fruit from further away',       base: 60,  mul: 1.45, max: 15 }
];
function upCost(u, lvl){ return Math.round(u.base * Math.pow(u.mul, lvl) / 5) * 5; }

/* ---------------- missions ---------------- */
const MISSION_POOL = [
  { id: 'hatch',   txt: n => `Hatch ${n} mochi`,            n: [40, 80, 150, 300],  rw: 1 },
  { id: 'eat',     txt: n => `Eat ${n} fruit`,               n: [150, 400, 900],     rw: 1 },
  { id: 'pop',     txt: n => `Pop ${n} gobblers`,            n: [5, 15, 40],         rw: 1.3 },
  { id: 'deliver', txt: n => `Carry ${n} treasures home`,    n: [3, 8, 20],          rw: 1.2 },
  { id: 'crates',  txt: n => `Smash ${n} crates`,            n: [8, 20, 50],         rw: 1 },
  { id: 'peak',    txt: n => `Grow a mob of ${n} in one day`, n: [60, 120, 220, 350], rw: 1.5, peak: true },
  { id: 'stars',   txt: n => `Clear ${n} days with 3 stars`, n: [1, 3, 8],           rw: 1.6 },
  { id: 'events',  txt: n => `Enjoy ${n} surprises`,         n: [5, 15, 40],         rw: 1 }
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'mochimob_save_v1';
function defSave(){
  return {
    v: 1, day: 1, best: 0, bestMob: 0, coins: 0,
    up: { size: 0, speed: 0, bite: 0, strength: 0, hatch: 0, magnet: 0 },
    flavor: 'milk', own: { milk: 1 },
    opt: { sfx: true, music: true, shake: true, fx: 'high' },
    stats: { hatch: 0, eat: 0, pop: 0, deliver: 0, crates: 0, stars: 0, events: 0, days: 0 },
    stars: {}, missions: [], tut: 0
  };
}
function mergeInto(base, src){
  if(!src || typeof src !== 'object') return base;
  for(const k in src){
    const b = base[k], v = src[k];
    if(b && typeof b === 'object' && !Array.isArray(b) && v && typeof v === 'object' && !Array.isArray(v)) mergeInto(b, v);
    else if(b === undefined || typeof b === typeof v) base[k] = v;
  }
  return base;
}
let save = defSave();
function loadSave(){
  let raw = null;
  const d = SDK.data();
  try{ raw = d ? d.getItem(SAVE_KEY) : null; }catch(e){}
  if(!raw){ try{ raw = localStorage.getItem(SAVE_KEY); }catch(e){} }
  try{ save = mergeInto(defSave(), JSON.parse(raw || '{}')); }catch(e){ save = defSave(); }
  fillMissions();
}
function persist(){
  const s = JSON.stringify(save), d = SDK.data();
  try{ if(d) d.setItem(SAVE_KEY, s); }catch(e){}
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
function fillMissions(){
  save.missions = save.missions.filter(m => !m.claimed);
  const have = new Set(save.missions.map(m => m.id));
  while(save.missions.length < 3){
    const pool = MISSION_POOL.filter(m => !have.has(m.id));
    const p = pick(pool); have.add(p.id);
    const tier = Math.min(p.n.length - 1, Math.floor((save.stats.days || 0) / 6));
    const n = p.n[tier];
    save.missions.push({ id: p.id, n, at: p.peak ? 0 : (save.stats[p.id] || 0), prog: 0, done: false, claimed: false, rw: Math.round((60 + n * 1.2) * p.rw / 10) * 10 });
  }
}
function missionTick(peakMob){
  let changed = false;
  for(const m of save.missions){
    if(m.done) continue;
    const p = MISSION_POOL.find(x => x.id === m.id);
    m.prog = p.peak ? Math.max(m.prog, peakMob || 0) : (save.stats[m.id] || 0) - m.at;
    if(m.prog >= m.n){ m.prog = m.n; m.done = true; changed = true; }
  }
  return changed;
}

/* ---------------- days ---------------- */
const BIOMES = [
  { name: 'Picnic Park',     g1: '#8fdc6a', g2: '#7ccf5a', dot: '#6bbd4c', edge: '#4f9a3a', flower: ['#fff', '#ffd23a', '#ff8ab8'] },
  { name: 'Candy Canyon',    g1: '#ffd0e4', g2: '#ffc0da', dot: '#ffa9cc', edge: '#e0679c', flower: ['#fff', '#8fe3ff', '#fff27a'] },
  { name: 'Sunset Beach',    g1: '#ffe2a8', g2: '#ffd690', dot: '#f5c673', edge: '#d69a3c', flower: ['#fff', '#ff9d6b', '#6fd6ff'] },
  { name: 'Frosty Fields',   g1: '#e4f4ff', g2: '#d3ecff', dot: '#bfe0fb', edge: '#8ab8e0', flower: ['#fff', '#b9a8ff', '#8fe3ff'] },
  { name: 'Moonlight Garden', g1: '#5d5aa8', g2: '#534f9c', dot: '#4a468f', edge: '#2f2c6e', flower: ['#fff9b0', '#8ffcff', '#ff9ef0'] }
];
function dayCfg(d){
  const k = Math.min(1, (d - 1) / 30);
  const W = Math.round(2000 + Math.min(d, 25) * 50), H = Math.round(W * 0.62);
  return {
    d, W, H, biome: BIOMES[Math.floor((d - 1) / 3) % BIOMES.length],
    time: 90,
    boss: d % 5 === 0,
    fruitClusters: 16 + Math.round(k * 10),
    eggs: 9 + Math.round(k * 6),
    bigEggs: 1 + Math.floor(d / 4),
    crates: 5 + Math.round(k * 8),
    treasures: d === 1 ? 2 : 3 + Math.min(3, Math.floor(d / 5)),
    trW: [6, 10 + Math.round(k * 16)],
    gobblers: d === 1 ? 1 : 2 + Math.round(k * 7),
    gobHP: 16 + d * 3,
    cacti: d < 3 ? 0 : Math.min(12, 2 + Math.floor(d / 2)),
    goal: 100
  };
}
