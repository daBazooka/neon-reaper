'use strict';
/* =====================================================================
   SCRIBBLE SKY: data, save, shop, cards, missions and world chapters.
   ===================================================================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');

const WW = 720;          // world width (world units)
const M = 20;            // world units per meter

/* ---------------- worlds (every 1000 m) ---------------- */
const WORLDS = [
  { name: 'Notebook',    bg: '#fbf7ec', rule: '#b9d3f0', margin: '#f2a0a0', ink: '#2b2a4a', hz: '#e8413a', grid: 'lines' },
  { name: 'Graph Paper', bg: '#f1f8ff', rule: '#9fc6ee', margin: '#9fc6ee', ink: '#1d3f8a', hz: '#ff5a2e', grid: 'grid' },
  { name: 'Chalkboard',  bg: '#2f4a3c', rule: '#3d5c4b', margin: '#56806a', ink: '#f7f7ee', hz: '#ffd166', grid: 'none', dark: true },
  { name: 'Candy Pad',   bg: '#fff0f6', rule: '#ffc4dc', margin: '#ff8ab8', ink: '#6a2a5a', hz: '#ff3f7f', grid: 'dots' },
  { name: 'Neon Night',  bg: '#14112b', rule: '#241f4a', margin: '#ff3ad8', ink: '#3affd8', hz: '#ff3a6e', grid: 'grid', dark: true, glow: true },
  { name: 'Deep Space',  bg: '#0b0d22', rule: '#161a3d', margin: '#6f7cff', ink: '#ffe14d', hz: '#ff6b5a', grid: 'stars', dark: true, glow: true }
];
function worldAt(m){ return WORLDS[Math.floor(m / 1000) % WORLDS.length]; }

/* ---------------- skins ---------------- */
const BALLS = [
  { id: 'marble',  name: 'Marble',     price: 0 },
  { id: 'eye',     name: 'Eyeball',    price: 250 },
  { id: 'hoop',    name: 'Basketball', price: 500 },
  { id: 'donut',   name: 'Donut',      price: 800 },
  { id: 'smile',   name: 'Smiley',     price: 1200 },
  { id: 'planet',  name: 'Planet',     price: 1800 },
  { id: 'pearl',   name: 'Pearl',      price: 2600 },
  { id: 'galaxy',  name: 'Galaxy',     price: 4000 }
];
const INKS = [
  { id: 'world',   name: 'Classic',  price: 0,    c: null },
  { id: 'blue',    name: 'Blue Pen', price: 200,  c: '#1f5fe0' },
  { id: 'red',     name: 'Red Pen',  price: 400,  c: '#e0283a' },
  { id: 'green',   name: 'Marker',   price: 700,  c: '#16a34a' },
  { id: 'gold',    name: 'Gold',     price: 1500, c: '#e9b31a' },
  { id: 'rainbow', name: 'Rainbow',  price: 3000, c: 'rainbow' }
];
const PERKS = [
  { id: 'ink',    icon: '✒️', name: 'Bigger Inkpot',  desc: '+8% ink per level',                   base: 80,  mul: 1.5,  max: 12 },
  { id: 'regen',  icon: '💧', name: 'Fast Refill',    desc: 'Ink refills faster',                  base: 90,  mul: 1.5,  max: 12 },
  { id: 'luck',   icon: '🍀', name: 'Lucky Pencil',   desc: 'More power-ups appear',               base: 120, mul: 1.55, max: 10 },
  { id: 'shield', icon: '🫧', name: 'Bubble Start',   desc: 'Start every run with a bubble shield', base: 400, mul: 3,    max: 2 },
  { id: 'rocket', icon: '🚀', name: 'Head Start',     desc: 'Rocket down 150 m per level at start', base: 300, mul: 2,    max: 4 },
  { id: 'revive', icon: '💖', name: 'Second Chance',  desc: 'One free revive per run',              base: 900, mul: 3,    max: 1 }
];
function perkCost(p, l){ return Math.round(p.base * Math.pow(p.mul, l) / 10) * 10; }

/* ---------------- run cards (picked by bouncing into them) ---------------- */
const CARDS = [
  { id: 'spring', icon: '🌀', name: 'Springy Ink',  desc: 'Bounces +12% stronger' },
  { id: 'long',   icon: '📏', name: 'Long Lines',   desc: '+30% ink' },
  { id: 'quick',  icon: '⚡', name: 'Quick Ink',    desc: 'Ink refills 40% faster' },
  { id: 'stars',  icon: '⭐', name: 'Star Power',   desc: 'Stars worth +50%' },
  { id: 'magnet', icon: '🧲', name: 'Mini Magnet',  desc: 'Pull in nearby stars' },
  { id: 'shield', icon: '🫧', name: 'Bubble',       desc: 'Get a bubble shield now' },
  { id: 'power',  icon: '⏳', name: 'Long Powers',  desc: 'Power-ups last 40% longer' },
  { id: 'coins',  icon: '🪙', name: 'Coin Rain',    desc: 'Coins worth +50%' },
  { id: 'multi',  icon: '🔮', name: 'Triple Ball',  desc: 'MULTIBALL right now' },
  { id: 'calm',   icon: '🐌', name: 'Lazy Flood',   desc: 'The ink flood is 15% slower' },
  { id: 'fire',   icon: '🔥', name: 'Hot Start',    desc: 'FIREBALL right now' },
  { id: 'combo',  icon: '🎵', name: 'Encore',       desc: 'Combos last twice as long' }
];
const POWERS = {
  multi:   { icon: '🔮', name: 'MULTIBALL!',   col: '#b56bff', dur: 0 },
  fire:    { icon: '🔥', name: 'FIREBALL!',    col: '#ff6a2e', dur: 6 },
  giant:   { icon: '🏐', name: 'GIANT BALL!',  col: '#ffb13a', dur: 6 },
  slow:    { icon: '🐢', name: 'SLOW-MO!',     col: '#4dd0ff', dur: 4 },
  magnet:  { icon: '🧲', name: 'MAGNET!',      col: '#ff4f7a', dur: 8 },
  rainbow: { icon: '🌈', name: 'RAINBOW INK!', col: '#ff7ab8', dur: 7 },
  rocket:  { icon: '🚀', name: 'ROCKET!',      col: '#ffe14d', dur: 2.6 },
  shield:  { icon: '🫧', name: 'BUBBLE!',      col: '#9fe6ff', dur: 0 }
};

/* ---------------- missions ---------------- */
const MISSION_POOL = [
  { id: 'depth',  txt: n => `Fall ${n} m in one run`,     n: [200, 500, 1000, 2000, 3500], peak: true },
  { id: 'stars',  txt: n => `Collect ${n} stars`,         n: [100, 300, 800, 2000] },
  { id: 'bounce', txt: n => `Bounce ${n} times`,          n: [80, 250, 600, 1500] },
  { id: 'combo',  txt: n => `Reach a x${n} combo`,        n: [10, 20, 35, 60], peak: true },
  { id: 'cards',  txt: n => `Pick ${n} cards`,            n: [5, 15, 40] },
  { id: 'powers', txt: n => `Grab ${n} power-ups`,        n: [5, 15, 40] },
  { id: 'smash',  txt: n => `Smash ${n} hazards`,         n: [10, 40, 100] },
  { id: 'pegs',   txt: n => `Pop ${n} bonus pegs`,        n: [30, 100, 300] }
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'scribblesky_save_v1';
function defSave(){
  return {
    v: 1, best: 0, coins: 0, runs: 0,
    ball: 'marble', ink: 'world', own: { marble: 1, world: 1 },
    perk: { ink: 0, regen: 0, luck: 0, shield: 0, rocket: 0, revive: 0 },
    opt: { sfx: true, music: true, shake: true },
    stats: { stars: 0, bounce: 0, cards: 0, powers: 0, smash: 0, pegs: 0 },
    missions: [], tut: 0
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
    const p = pick(MISSION_POOL.filter(m => !have.has(m.id))); have.add(p.id);
    const tier = Math.min(p.n.length - 1, Math.floor(save.runs / 8));
    const n = p.n[tier];
    save.missions.push({ id: p.id, n, at: p.peak ? 0 : (save.stats[p.id] || 0), prog: 0, done: false, claimed: false, rw: 60 + tier * 60 });
  }
}
function missionTick(run){
  for(const m of save.missions){
    if(m.done) continue;
    const p = MISSION_POOL.find(x => x.id === m.id);
    m.prog = p.peak ? Math.max(m.prog, m.id === 'depth' ? Math.floor(run.depth) : run.maxCombo) : (save.stats[m.id] || 0) - m.at;
    if(m.prog >= m.n){ m.prog = m.n; m.done = true; }
  }
}
