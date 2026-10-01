'use strict';
/* =====================================================================
   FLIPPER RAID: data, save, cards, perks, skins, missions.
   ===================================================================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');

const TW = 600, TH = 1000;   // table size in world units

/* ---------------- dungeon floors (themes change every 5 rooms) ---------------- */
const THEMES = [
  { name: 'Mossy Dungeon', bg1: '#1d2a3a', bg2: '#0f1724', wall: '#6b8aa8', glow: '#7dffb0', acc: '#ffd23a' },
  { name: 'Crystal Cave',  bg1: '#24164a', bg2: '#120a2a', wall: '#a98bff', glow: '#7df0ff', acc: '#ff7ad8' },
  { name: 'Lava Forge',    bg1: '#3a1410', bg2: '#1a0806', wall: '#ff8a3a', glow: '#ffd23a', acc: '#ff4f3a' },
  { name: 'Frost Keep',    bg1: '#123248', bg2: '#081a28', wall: '#9fe6ff', glow: '#ffffff', acc: '#5ad2ff' },
  { name: 'Star Vault',    bg1: '#0c0f2e', bg2: '#04051a', wall: '#ffe14d', glow: '#ff7ab8', acc: '#7dffea' }
];

/* ---------------- monsters ---------------- */
const MONSTERS = {
  slime:  { name: 'Slime',        r: 26, hp: 30, col: '#5fe08a', pts: 100 },
  bat:    { name: 'Bat',          r: 22, hp: 22, col: '#b07dff', pts: 150, move: 'fly' },
  knight: { name: 'Shield Knight', r: 30, hp: 55, col: '#9fb4c8', pts: 250, shield: true },
  bomb:   { name: 'Bomb Bug',     r: 24, hp: 25, col: '#ff6a3a', pts: 200, boom: true },
  split:  { name: 'Splitter',     r: 32, hp: 45, col: '#5ad2ff', pts: 200, split: true },
  ghost:  { name: 'Ghost',        r: 26, hp: 35, col: '#e8f0ff', pts: 250, blink: true },
  mini:   { name: 'Mini Slime',   r: 17, hp: 14, col: '#7dffea', pts: 60 }
};
const BOSSES = [
  { name: 'KING SLIME',     col: '#5fe08a', r: 70 },
  { name: 'CRYSTAL GOLEM',  col: '#a98bff', r: 72 },
  { name: 'FORGE DRAGON',   col: '#ff6a3a', r: 74 },
  { name: 'FROST WITCH',    col: '#9fe6ff', r: 68 },
  { name: 'THE VOID EYE',   col: '#ffe14d', r: 76 }
];

/* ---------------- run cards ---------------- */
const CARDS = [
  { id: 'heavy',   icon: '🔨', name: 'Heavy Ball',     desc: '+35% damage', rar: 1 },
  { id: 'fire',    icon: '🔥', name: 'Fire Ball',      desc: 'Hits set monsters on fire', rar: 1 },
  { id: 'split',   icon: '🔮', name: 'Bumper Split',   desc: 'Bumpers can spawn an extra ball', rar: 2 },
  { id: 'zap',     icon: '⚡', name: 'Lightning',      desc: 'Every 10 bumps, zap ALL monsters', rar: 2 },
  { id: 'sharp',   icon: '🗡️', name: 'Sharp Flippers', desc: 'Flipper hits launch harder', rar: 1 },
  { id: 'big',     icon: '📏', name: 'Long Flippers',  desc: 'Flippers 15% longer', rar: 1 },
  { id: 'saver',   icon: '😇', name: 'Angel Save',     desc: 'Once per room, rescue a draining ball', rar: 2 },
  { id: 'crit',    icon: '🎯', name: 'Lucky Crit',     desc: '+15% chance for x3 damage', rar: 1 },
  { id: 'ghost',   icon: '👻', name: 'Ghost Ball',     desc: 'Every 3rd hit pierces straight through', rar: 2 },
  { id: 'boom',    icon: '💣', name: 'Bumper Bombs',   desc: 'Bumpers blast nearby monsters', rar: 2 },
  { id: 'coins',   icon: '🪙', name: 'Gold Rush',      desc: '+50% coins', rar: 1 },
  { id: 'multi',   icon: '🎱', name: 'Twin Start',     desc: 'Start each room with 2 balls', rar: 3 },
  { id: 'life',    icon: '❤️', name: 'Extra Ball',     desc: '+1 ball right now', rar: 2 },
  { id: 'bounce',  icon: '🌀', name: 'Super Bumpers',  desc: 'Bumpers kick harder and score x2', rar: 1 },
  { id: 'chain',   icon: '⛓️', name: 'Chain Hits',     desc: 'Combo hits deal +10% each', rar: 2 },
  { id: 'magnet',  icon: '🧲', name: 'Drain Magnet',   desc: 'Ball is pulled away from the drain', rar: 2 }
];

/* ---------------- permanent perks (gems) ---------------- */
const PERKS = [
  { id: 'dmg',    icon: '💪', name: 'Power Training', desc: '+8% damage per level',      base: 20, mul: 1.5,  max: 10 },
  { id: 'balls',  icon: '🎱', name: 'Spare Balls',    desc: '+1 ball per run',            base: 60, mul: 2.2,  max: 2 },
  { id: 'saver',  icon: '🛟', name: 'Ball Saver',     desc: 'Longer drain protection',    base: 25, mul: 1.6,  max: 6 },
  { id: 'reroll', icon: '🎲', name: 'Card Reroll',    desc: '+1 reroll per run',          base: 40, mul: 1.8,  max: 3 },
  { id: 'start',  icon: '🃏', name: 'Head Start',     desc: 'Start the run with a card',  base: 80, mul: 2.5,  max: 2 },
  { id: 'gold',   icon: '💰', name: 'Treasure Nose',  desc: '+10% coins per level',       base: 20, mul: 1.5,  max: 8 }
];
function perkCost(p, l){ return Math.round(p.base * Math.pow(p.mul, l)); }
const BALLS = [
  { id: 'steel',  name: 'Steel',     price: 0,   c1: '#ffffff', c2: '#8a96a8' },
  { id: 'gold',   name: 'Gold',      price: 30,  c1: '#fff6b0', c2: '#d9a000' },
  { id: 'ruby',   name: 'Ruby',      price: 50,  c1: '#ffc2c8', c2: '#e0283a' },
  { id: 'jade',   name: 'Jade',      price: 70,  c1: '#d4ffe0', c2: '#16a34a' },
  { id: 'ice',    name: 'Ice',       price: 90,  c1: '#ffffff', c2: '#5ad2ff' },
  { id: 'void',   name: 'Void',      price: 140, c1: '#b98cff', c2: '#1b0f40' },
  { id: 'rainbow',name: 'Prism',     price: 220, c1: '#ffffff', c2: 'rainbow' }
];

/* ---------------- missions ---------------- */
const MISSION_POOL = [
  { id: 'rooms',   txt: n => `Clear ${n} rooms`,           n: [5, 15, 40, 100] },
  { id: 'kills',   txt: n => `Defeat ${n} monsters`,       n: [30, 100, 300, 800] },
  { id: 'bosses',  txt: n => `Beat ${n} bosses`,           n: [1, 3, 8] },
  { id: 'bumps',   txt: n => `Hit bumpers ${n} times`,     n: [100, 400, 1200] },
  { id: 'jack',    txt: n => `Score ${n} jackpots`,        n: [2, 8, 20] },
  { id: 'best',    txt: n => `Reach room ${n} in one run`, n: [5, 10, 16, 25], peak: true },
  { id: 'crits',   txt: n => `Land ${n} critical hits`,    n: [20, 80, 250] }
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'flipperraid_save_v1';
function defSave(){
  return {
    v: 1, best: 0, bestScore: 0, gems: 0, runs: 0,
    perk: { dmg: 0, balls: 0, saver: 0, reroll: 0, start: 0, gold: 0 },
    ball: 'steel', own: { steel: 1 },
    opt: { sfx: true, music: true, shake: true, haptic: true },
    stats: { rooms: 0, kills: 0, bosses: 0, bumps: 0, jack: 0, crits: 0 },
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
    const tier = Math.min(p.n.length - 1, Math.floor(save.runs / 6));
    const n = p.n[tier];
    save.missions.push({ id: p.id, n, at: p.peak ? 0 : (save.stats[p.id] || 0), prog: 0, done: false, claimed: false, rw: 10 + tier * 10 });
  }
}
function missionTick(room){
  for(const m of save.missions){
    if(m.done) continue;
    const p = MISSION_POOL.find(x => x.id === m.id);
    m.prog = p.peak ? Math.max(m.prog, room) : (save.stats[m.id] || 0) - m.at;
    if(m.prog >= m.n){ m.prog = m.n; m.done = true; }
  }
}
