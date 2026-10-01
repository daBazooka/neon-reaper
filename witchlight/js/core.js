'use strict';
/* =====================================================================
   WITCHLIGHT: data, save, spells, fusions, upgrades, missions.
   ===================================================================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');

const AW = 3200, AH = 3200;     // arena size
const RUN_TIME = 480;           // 8 minutes until dawn

/* ---------------- elements (base spells) ---------------- */
const ELEMENTS = {
  fire:   { icon: '🔥', name: 'Fireball',      el: 'Fire',   col: '#ff7a2e', desc: 'Exploding fireballs at the nearest shadows' },
  frost:  { icon: '❄️', name: 'Frost Orbit',   el: 'Frost',  col: '#7fe3ff', desc: 'Ice shards circle you and chill enemies' },
  storm:  { icon: '⚡', name: 'Chain Lightning', el: 'Storm', col: '#fff36b', desc: 'Lightning that jumps between enemies' },
  nature: { icon: '🌿', name: 'Thorn Pulse',   el: 'Nature', col: '#7dff8a', desc: 'Waves of thorns push shadows away' },
  arcane: { icon: '🔮', name: 'Magic Missiles', el: 'Arcane', col: '#c58bff', desc: 'Homing stars that never miss' },
  light:  { icon: '☀️', name: 'Sun Beam',      el: 'Light',  col: '#ffe9a8', desc: 'A sweeping beam of sunlight' }
};
const MAX_SPELL = 8;
/* ---------------- fusions (two elements at level 3+) ---------------- */
const FUSIONS = {
  plasma:  { icon: '🌩️', name: 'Plasma Storm',  a: 'fire',   b: 'storm', col: '#ff9ef0', desc: 'Giant bolts strike and set the ground ablaze' },
  steam:   { icon: '♨️', name: 'Steam Geysers', a: 'fire',   b: 'frost', col: '#e8f6ff', desc: 'Scalding geysers erupt under enemies' },
  blizzard:{ icon: '🌨️', name: 'Blizzard',      a: 'frost',  b: 'storm', col: '#bfefff', desc: 'A freezing storm rages around you' },
  meteor:  { icon: '☄️', name: 'Meteor Shower', a: 'arcane', b: 'fire',  col: '#ffb13a', desc: 'Meteors crash into the biggest crowds' },
  prism:   { icon: '🌈', name: 'Prism Lasers',  a: 'arcane', b: 'light', col: '#ffffff', desc: 'Six rainbow lasers spin around you' },
  sunflower:{ icon: '🌻', name: 'Sunflower Grove', a: 'nature', b: 'light', col: '#ffd23a', desc: 'Magic sunflowers sprout and fire seeds' }
};
/* ---------------- passive upgrades ---------------- */
const PASSIVES = {
  boots:   { icon: '👢', name: 'Swift Boots',  desc: '+10% move speed',          max: 5 },
  heart:   { icon: '💖', name: 'Big Heart',    desc: '+25 max HP and heal 25',   max: 5 },
  lantern: { icon: '🏮', name: 'Bright Lantern', desc: 'Bigger light and pickup range', max: 5 },
  focus:   { icon: '⏳', name: 'Focus',        desc: 'Spells recharge 8% faster', max: 5 },
  power:   { icon: '✨', name: 'Moon Power',   desc: '+12% spell damage',        max: 5 },
  regen:   { icon: '🍀', name: 'Clover',       desc: 'Heal 1 HP per second',     max: 5 }
};

/* ---------------- enemies ---------------- */
const FOES = {
  wisp:   { r: 12, hp: 8,   spd: 120, dmg: 6,  xp: 1, col: '#5b5bd6' },
  blob:   { r: 17, hp: 18,  spd: 80,  dmg: 8,  xp: 2, col: '#3a2f7a' },
  bat:    { r: 14, hp: 14,  spd: 150, dmg: 8,  xp: 2, col: '#4a2a6a', zig: true },
  brute:  { r: 30, hp: 90,  spd: 55,  dmg: 13, xp: 6, col: '#2a1f55' },
  caster: { r: 18, hp: 30,  spd: 70,  dmg: 8,  xp: 4, col: '#6a2a8a', ranged: true },
  elite:  { r: 26, hp: 260, spd: 85,  dmg: 16, xp: 20, col: '#8a2ad6', elite: true }
};
const BOSSES = [
  { name: 'SHADOW WOLF',  r: 46, hp: 1200,  spd: 110, col: '#3a3a8a', at: 120, kind: 'wolf' },
  { name: 'MOTHMOON',     r: 50, hp: 4200,  spd: 80,  col: '#6a3aa8', at: 240, kind: 'moth' },
  { name: 'GLOOM HYDRA',  r: 56, hp: 8000,  spd: 70,  col: '#2a5a6a', at: 360, kind: 'hydra' },
  { name: 'THE NIGHT KING', r: 64, hp: 12000, spd: 75, col: '#1a1040', at: 480, kind: 'king', final: true }
];

/* ---------------- meta perks (moonstones) ---------------- */
const PERKS = [
  { id: 'hp',     icon: '💖', name: 'Sturdy Cloak',   desc: '+15 max HP per level',          base: 20, mul: 1.5, max: 8 },
  { id: 'dmg',    icon: '✨', name: 'Moon Blessing',  desc: '+6% spell damage per level',    base: 25, mul: 1.5, max: 10 },
  { id: 'spd',    icon: '👢', name: 'Fairy Steps',    desc: '+4% move speed per level',      base: 20, mul: 1.5, max: 6 },
  { id: 'magnet', icon: '🧲', name: 'Mote Magnet',    desc: '+15% pickup range per level',   base: 15, mul: 1.5, max: 6 },
  { id: 'reroll', icon: '🎲', name: 'Fortune Cards',  desc: '+1 reroll per run',             base: 40, mul: 1.8, max: 3 },
  { id: 'revive', icon: '🪽', name: 'Phoenix Feather', desc: 'Revive once per run',          base: 150, mul: 3, max: 1 }
];
function perkCost(p, l){ return Math.round(p.base * Math.pow(p.mul, l)); }
const HATS = [
  { id: 'violet', name: 'Violet', price: 0,   c1: '#6a3ad8', c2: '#ffd23a' },
  { id: 'rose',   name: 'Rose',   price: 40,  c1: '#e0457a', c2: '#ffe9f2' },
  { id: 'mint',   name: 'Mint',   price: 60,  c1: '#2fb88a', c2: '#ffffff' },
  { id: 'night',  name: 'Night',  price: 90,  c1: '#1a1a40', c2: '#7df0ff' },
  { id: 'ember',  name: 'Ember',  price: 120, c1: '#d8501a', c2: '#ffe14d' },
  { id: 'star',   name: 'Starlit', price: 200, c1: '#0e1a4a', c2: 'rainbow' }
];

/* ---------------- missions ---------------- */
const MISSION_POOL = [
  { id: 'kills',   txt: n => `Banish ${n} shadows`,           n: [300, 1000, 3000, 8000] },
  { id: 'fusions', txt: n => n > 1 ? `Cast ${n} fusion spells` : 'Cast a fusion spell',       n: [1, 4, 10] },
  { id: 'bosses',  txt: n => n > 1 ? `Defeat ${n} bosses` : 'Defeat a boss',            n: [1, 4, 10] },
  { id: 'flowers', txt: n => `Grow ${n} glowing flowers`,     n: [200, 800, 2500] },
  { id: 'time',    txt: n => `Survive ${n} minutes in a run`, n: [2, 4, 6, 8], peak: true },
  { id: 'level',   txt: n => `Reach level ${n} in a run`,     n: [10, 20, 30, 40], peak: true },
  { id: 'dawns',   txt: n => n > 1 ? `See the dawn ${n} times` : 'Survive until dawn',       n: [1, 3, 8] }
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'witchlight_save_v1';
function defSave(){
  return {
    v: 1, best: 0, bestKills: 0, stones: 0, runs: 0,
    perk: { hp: 0, dmg: 0, spd: 0, magnet: 0, reroll: 0, revive: 0 },
    hat: 'violet', own: { violet: 1 }, seen: {},
    opt: { sfx: true, music: true, shake: true },
    stats: { kills: 0, fusions: 0, bosses: 0, flowers: 0, dawns: 0 },
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
    const tier = Math.min(p.n.length - 1, Math.floor(save.runs / 5));
    const n = p.n[tier];
    save.missions.push({ id: p.id, n, at: p.peak ? 0 : (save.stats[p.id] || 0), prog: 0, done: false, claimed: false, rw: 15 + tier * 15 });
  }
}
function missionTick(run){
  for(const m of save.missions){
    if(m.done) continue;
    const p = MISSION_POOL.find(x => x.id === m.id);
    if(p.peak) m.prog = Math.max(m.prog, m.id === 'time' ? Math.floor(run.time / 60) : run.level);
    else m.prog = (save.stats[m.id] || 0) - m.at;
    if(m.prog >= m.n){ m.prog = m.n; m.done = true; }
  }
}
