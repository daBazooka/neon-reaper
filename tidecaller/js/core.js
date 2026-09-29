'use strict';
/* =====================================================================
   TIDECALLER core: utilities, ships, upgrades, biomes, missions, save.
   You don't steer the boat. You are the ocean.
   ===================================================================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const $ = id => document.getElementById(id);
const angNorm = a => { a %= TAU; if(a > Math.PI) a -= TAU; if(a < -Math.PI) a += TAU; return a; };
function fmt(n){
  n = Math.floor(n);
  if(n < 10000) return n.toLocaleString('en-US');
  const u = ['K', 'M', 'B', 'T']; let i = -1;
  while(n >= 1000 && i < u.length - 1){ n /= 1000; i++; }
  return (n < 100 ? n.toFixed(1).replace(/\.0$/, '') : Math.floor(n)) + u[i];
}
function mulberry32(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
function mix(h1, h2, t){ const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16); const r = lerp(a >> 16, b >> 16, t) | 0, g = lerp(a >> 8 & 255, b >> 8 & 255, t) | 0, bl = lerp(a & 255, b & 255, t) | 0; return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1); }

/* ---------------- world constants (world units; 10 units = 1 metre) ---------------- */
const WORLD = {
  SURF_MIN: 150,     // highest the tide can go (y grows downward)
  SURF_MAX: 545,     // lowest the tide can go
  BED: 600,          // default sea floor
  G: 1500,           // gravity
  DRAFT: 13,         // hull below the waterline
  TOP: 44,           // boat height above the waterline (mast tip)
  HALF: 30,          // half the hull length
};

/* ---------------- ships ---------------- */
const SHIPS = [
  { id:'dinghy', name:'Dinghy',        hearts:3, magnet:0,  coin:1,   land:1,    lift:1,    cost:0,     rank:0,  hull:'#e8553c', trim:'#fff2dc', sail:'#fff8ec', desc:'A brave little boat. Where it all begins.' },
  { id:'sloop',  name:'Sloop',         hearts:3, magnet:45, coin:1,   land:1,    lift:1,    cost:1500,  rank:0,  hull:'#2f7fd0', trim:'#f4f8ff', sail:'#ffffff', desc:'Big sails pull coins in from further away.' },
  { id:'duck',   name:'Rubber Duck',   hearts:3, magnet:0,  coin:1,   land:1.45, lift:1.05, cost:3500,  rank:3,  hull:'#ffd23a', trim:'#ff8a1f', sail:null,      desc:'Always lands the right way up. Mostly. Quack.' },
  { id:'tug',    name:'Tugboat',       hearts:4, magnet:0,  coin:1,   land:1,    lift:.95,  cost:6000,  rank:5,  hull:'#3a3f4a', trim:'#e8553c', sail:null,      desc:'Tough as nails. One extra heart.' },
  { id:'junk',   name:'Golden Junk',   hearts:3, magnet:20, coin:1.5, land:1,    lift:1,    cost:12000, rank:8,  hull:'#b8322a', trim:'#ffd23a', sail:'#e8a23a', desc:'Every coin is worth 50% more.' },
  { id:'galleon',name:'Pirate Galleon',hearts:5, magnet:30, coin:1.2, land:1.1,  lift:.9,   cost:25000, rank:12, hull:'#5a3a22', trim:'#d9b56a', sail:'#1d1d24', desc:'Five hearts and a skull flag. Heavy, so it jumps lower.' },
  { id:'yacht',  name:'Royal Yacht',   hearts:4, magnet:60, coin:2,   land:1.25, lift:1.1,  cost:60000, rank:18, hull:'#f6f2ea', trim:'#2a6fd6', sail:'#ffd23a', desc:'The finest ship on any sea. Double coins.' },
];
const shipById = id => SHIPS.find(s => s.id === id) || SHIPS[0];

/* ---------------- upgrades ---------------- */
const UPG = [
  { id:'tide',   icon:'🌊', name:'Tide Power',   base:120, k:1.75, max:8, eff:l => `Launch power ${Math.round(tidePow(l) / tidePow(0) * 100)}%` },
  { id:'magnet', icon:'🧲', name:'Coin Magnet',  base:150, k:1.7,  max:8, eff:l => `Pulls coins from ${Math.round(magR(l, 0))} away` },
  { id:'value',  icon:'🪙', name:'Coin Value',   base:250, k:1.8,  max:8, eff:l => `Coins worth x${coinMul(l).toFixed(2)}` },
  { id:'hull',   icon:'❤', name:'Hull Plating', base:900, k:3.2,  max:2, eff:l => `+${l} extra heart${l === 1 ? '' : 's'}` },
  { id:'luck',   icon:'🍾', name:'Lucky Bottles',base:400, k:1.9,  max:6, eff:l => `Bottles ${Math.round((1 + l * .25) * 100)}% as common` },
];
const tidePow = l => 1050 + l * 70;          // max tide speed (units/s) = launch power
const magR = (l, ship) => 34 + l * 14 + ship;
const coinMul = l => 1 + l * .25;
const upCost = (u, l) => Math.ceil(u.base * Math.pow(u.k, l) / 10) * 10;

/* ---------------- biomes (by distance, in metres) ---------------- */
const BIOMES = [
  { id:'lagoon',  name:'Sunny Lagoon',  at:0,    sky:['#5ec8f2', '#bdeefc'], sea:['#1fc4c9', '#0a6f9a'], bed:'#f2d49a', bed2:'#d9b06a', rock:'#8a7a6a', ceil:'#7c6a5a', sun:'#fff6c8', cloud:'#ffffff', far:'#68b890', key:62 },
  { id:'reef',    name:'Coral Reef',    at:500,  sky:['#ff9e6a', '#ffd9a0'], sea:['#1ab0c6', '#085a8a'], bed:'#f0c890', bed2:'#e07a6a', rock:'#b85a6a', ceil:'#8a4a5a', sun:'#fff0b0', cloud:'#ffe6d0', far:'#b06a7a', key:65 },
  { id:'storm',   name:'Stormy Sea',    at:1300, sky:['#3a4a64', '#7a8aa4'], sea:['#2a7a96', '#0a2a4a'], bed:'#8a8a7a', bed2:'#5a5a52', rock:'#4a4e56', ceil:'#3a3e46', sun:null,      cloud:'#9aa6b8', far:'#2a3a4a', key:57 },
  { id:'arctic',  name:'Frozen North',  at:2300, sky:['#8ac8f0', '#e6f6ff'], sea:['#4ab0d8', '#0a4a7a'], bed:'#e6f0f6', bed2:'#a8c8dc', rock:'#b8d8ec', ceil:'#d8f0ff', sun:'#ffffff', cloud:'#ffffff', far:'#c8e0f0', key:60 },
  { id:'night',   name:'Moonlit Deep',  at:3500, sky:['#0a0a2a', '#2a2a5a'], sea:['#0a3a6a', '#020a2a'], bed:'#2a3a5a', bed2:'#1a2440', rock:'#2a2a4a', ceil:'#1a1a36', sun:'#e8ecff', cloud:'#3a3a6a', far:'#14143a', key:58, glow:1 },
  { id:'volcano', name:'Volcano Isles', at:5000, sky:['#3a1414', '#a84a2a'], sea:['#1f7a8a', '#0a2a3a'], bed:'#3a2a2a', bed2:'#1a1010', rock:'#2a1a1a', ceil:'#2a1414', sun:'#ff8a3a', cloud:'#5a2a2a', far:'#2a0a0a', key:55, lava:1 },
];
function biomeAt(m){ let b = 0; const L = BIOMES.length, span = 6500, mm = m % span; for(let i = 0; i < L; i++) if(mm >= BIOMES[i].at) b = i; return b; }

/* ---------------- missions ---------------- */
// each type: text(target), stat key it reads, scaling by rank
const MTYPES = {
  dist:    { t:n => `Sail ${fmt(n)} m in one run`,               base:300,  step:220, run:true },
  coins:   { t:n => `Collect ${fmt(n)} coins in one run`,         base:60,   step:45,  run:true },
  perfect: { t:n => `Make ${n} Perfect Catch${n > 1 ? 'es' : ''} in one run`, base:1, step:1, run:true },
  flip:    { t:n => n === 1 ? 'Do a flip' : `Do a ${['', '', 'double', 'triple', 'quadruple'][Math.min(4, n)]} flip`, base:1, step:.35, max:4, run:true },
  mines:   { t:n => `Jump over ${n} mines`,                       base:2,    step:1.3 },
  caves:   { t:n => `Sail under ${n} sea caves`,                  base:3,    step:1.6 },
  combo:   { t:n => `Reach a x${n} combo`,                        base:3,    step:.6,  max:10, run:true },
  nohit:   { t:n => `Sail ${fmt(n)} m without crashing`,          base:250,  step:160, run:true },
  bottles: { t:n => `Find ${n} message${n > 1 ? 's' : ''} in a bottle`, base:1, step:.5 },
  air:     { t:n => `Stay in the air for ${n} seconds (one jump)`, base:1.2, step:.18, max:3.2, run:true, dec:1 },
};
const MKEYS = Object.keys(MTYPES);
function makeMission(rank, avoid){
  let k; for(let g = 0; g < 30; g++){ k = MKEYS[(Math.random() * MKEYS.length) | 0]; if(!avoid.includes(k)) break; }
  const T = MTYPES[k]; let n = T.base + T.step * rank;
  if(T.max) n = Math.min(T.max, n);
  n = T.dec ? Math.round(n * 10) / 10 : Math.max(1, Math.round(n));
  if(k === 'dist' || k === 'nohit') n = Math.round(n / 50) * 50;
  if(k === 'coins') n = Math.round(n / 10) * 10;
  return { k, n, p:0, done:false };
}
const rankReward = r => 150 + r * 120;
const RANKS = ['Deckhand', 'Sailor', 'Bosun', 'Navigator', 'First Mate', 'Captain', 'Commodore', 'Admiral', 'Sea Lord', 'Tidecaller'];
const rankName = r => RANKS[Math.min(RANKS.length - 1, (r / 3) | 0)] + ' ' + ['I', 'II', 'III'][r % 3];

/* ---------------- letters found in bottles ---------------- */
const LETTERS = [
  'Day 1. The sea listens to me. When I lift my hand, the tide rises. Nobody believes me.',
  'The reefs cut boats like paper. Lift the water and they pass over like birds.',
  'Under the cliffs the caves are low. Let the sea sink and slip beneath.',
  'Throw the water up hard and the boat will fly. Catch it level, and the sea will thank you.',
  'Black iron floats in the storm. Mines. Do not touch them. Jump.',
  'The ice in the north hangs low like teeth. Patience, and a quiet sea.',
  'At night the water glows. I saw a whale made of stars.',
  'Something enormous lives beneath. Its arms rise from the water. Fly over them.',
  'The volcano isles burn. Even the sea is warm there.',
  'My grandfather called me a Tidecaller. I thought it was a story.',
  'If you are reading this, the sea listens to you too.',
  'Keep sailing. The ocean has no end, and neither do you.',
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'tidecaller_save_v1';
let _saveT = 0;
function defSave(){
  return {
    v:1, coins:0, best:0, ship:'dinghy', owned:{ dinghy:1 }, up:{ tide:0, magnet:0, value:0, hull:0, luck:0 },
    rank:0, missions:[], letters:[], stats:{ runs:0, dist:0, coins:0, flips:0, perfects:0, mines:0, caves:0, bottles:0, kraken:0, bestCombo:0 },
    tut:0, opt:{ sfx:true, music:true, fx:'high' },
  };
}
let save = defSave();
function mergeInto(base, src){
  for(const k in src){
    if(!(k in base)){ base[k] = src[k]; continue; }
    const b = base[k], s = src[k];
    if(b && typeof b === 'object' && !Array.isArray(b) && s && typeof s === 'object' && !Array.isArray(s)) mergeInto(b, s);
    else if(s !== undefined && s !== null && typeof s === typeof b && Array.isArray(b) === Array.isArray(s)) base[k] = s;
  }
  return base;
}
function loadSave(){
  let raw = null; const d = SDK.data();
  try{ if(d) raw = d.getItem(SAVE_KEY); }catch(e){}
  if(!raw && !d){ try{ raw = localStorage.getItem(SAVE_KEY); }catch(e){} }
  if(raw){ try{ save = mergeInto(defSave(), JSON.parse(raw)); }catch(e){ save = defSave(); } }
  fillMissions();
}
function fillMissions(){
  save.missions = save.missions.filter(m => m && MTYPES[m.k]);
  while(save.missions.length < 3) save.missions.push(makeMission(save.rank, save.missions.map(m => m.k)));
}
function writeSave(){
  const s = JSON.stringify(save), d = SDK.data();
  if(d){ try{ d.setItem(SAVE_KEY, s); }catch(e){} return; }
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
function persist(){ clearTimeout(_saveT); _saveT = setTimeout(writeSave, 300); }
