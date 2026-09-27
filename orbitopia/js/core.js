'use strict';
/* ---------------- utils ---------------- */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const $ = id => document.getElementById(id);
function todayKey(){ const d = new Date(); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); }
function dayNum(){ return Math.floor(Date.now() / 864e5); }
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
function mixHex(a, b, t){
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const c = s => Math.round(lerp(x >> s & 255, y >> s & 255, t));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}
function mulberry32(s){ return function(){ s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* big numbers: 1.23K, 45.6M, 789B ... then 1.2e45 */
const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc'];
function big(n){
  if(!isFinite(n)) return '∞';
  if(n < 0) return '-' + big(-n);
  if(n < 1000) return n < 10 && n % 1 ? n.toFixed(1).replace(/\.0$/, '') : Math.floor(n).toString();
  const e = Math.floor(Math.log10(n) / 3);
  if(e >= SUF.length) return n.toExponential(2).replace('+', '');
  const v = n / Math.pow(1000, e);
  return (v >= 100 ? Math.floor(v) : v >= 10 ? Math.floor(v * 10) / 10 : Math.floor(v * 100) / 100) + SUF[e];
}
const hms = s => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + 'h ' + m + 'm' : m ? m + 'm ' + (s % 60) + 's' : s + 's'; };

/* ---------------- the ladder of creation ----------------
   Two of a kind merge into the next. r = radius in world units. */
const TIERS = [
  { n:'Stardust',     r:9,  k:'mote',    a:'#fff6dc', b:'#ffcf8a', f:'A warm speck of light. Everything starts here.' },
  { n:'Pebble',       r:10.5,k:'rock',   a:'#c9b8aa', b:'#7a6a62', f:'A little stone that learned to fall in circles.' },
  { n:'Boulder',      r:12, k:'rock',    a:'#b6a597', b:'#5f4f48', f:'Heavy, patient and proud of it.' },
  { n:'Asteroid',     r:14, k:'crater',  a:'#a3a3b8', b:'#4e4d63', f:'Pockmarked by a million tiny collisions.' },
  { n:'Moonlet',      r:16, k:'moon',    a:'#dcd9ea', b:'#8a87a6', f:'Small enough to hold, bright enough to wish on.' },
  { n:'Moon',         r:18.5,k:'moon',   a:'#f3ecdc', b:'#a89d88', f:'Tides everywhere will thank you.' },
  { n:'Lava World',   r:20.5,k:'lava',   a:'#43222f', b:'#ff7b3a', f:'A molten heart, still cooling into something great.' },
  { n:'Ocean World',  r:23, k:'ocean',   a:'#2b6fe0', b:'#62d6ff', f:'Endless blue seas. Life stirs in the deep.' },
  { n:'Garden World', r:25.5,k:'garden', a:'#2f84dd', b:'#6bc96c', f:'Forests, rivers and a sky full of birds.' },
  { n:'Gas Giant',    r:29, k:'gas',     a:'#f0bb82', b:'#b86c4c', f:'Storms bigger than whole worlds swirl in its bands.' },
  { n:'Ringed Giant', r:31, k:'ringed',  a:'#f3dcaa', b:'#b99a69', f:'It wears a crown of ice and dust.' },
  { n:'Ice Giant',    r:33, k:'ice',     a:'#a6ecf2', b:'#4e9ecb', f:'Diamond rain falls through its frozen blue sky.' },
  { n:'Brown Dwarf',  r:35, k:'dwarf',   a:'#7d3e36', b:'#ec8350', f:'Almost a star. It glows with a secret warmth.' },
  { n:'Red Star',     r:37, k:'star',    a:'#ff6b4c', b:'#ffc39a', f:'You made a sun. A small, fierce, beautiful sun.' },
  { n:'White Star',   r:39, k:'star',    a:'#e4ecff', b:'#9ebaff', f:'Blinding, brilliant and burning for billions of years.' },
  { n:'Neutron Star', r:33, k:'neutron', a:'#c7f4ff', b:'#6bd9ff', f:'A city-sized star that spins a thousand times a second.' },
  { n:'Black Hole',   r:42, k:'hole',    a:'#12091f', b:'#ffb36b', f:'The end of the ladder. Even light bows to you now.' },
];
const MAXT = TIERS.length - 1;
const LIFE_T = 7;              // tiers >= this grow life
const LIFE = [
  { n:'Barren',     m:1 },
  { n:'Microbes',   m:1.5 },
  { n:'Forests',    m:2.2 },
  { n:'Creatures',  m:3.2 },
  { n:'Cities',     m:5 },
  { n:'Starfarers', m:8 },
];
const lifeTime = st => 30 * Math.pow(2, st);   // seconds to reach the next stage

/* ---------------- world ---------------- */
const GM = 900000;             // sun gravity: v = sqrt(GM / r)
const SUN_R = 50, MIN_ORB = 88, MAX_ORB = 410;

/* ---------------- upgrades (bought with Stardust) ---------------- */
const UPS = [
  { id:'forge',  name:'Stellar Forge',  icon:'✦', max:9,  base:300,  mul:14,  desc:l => `Create <b>${TIERS[l + 1] ? TIERS[l + 1].n : ''}</b> instead of ${TIERS[l].n}` },
  { id:'slots',  name:'Orbit Slots',    icon:'◎', max:18, base:50,   mul:2.6, desc:() => '+1 body in orbit' },
  { id:'reactor',name:'Nebula Reactor', icon:'↻', max:10, base:40,   mul:3.4, desc:() => 'Charges refill 7% faster' },
  { id:'mag',    name:'Deep Pockets',   icon:'▤', max:6,  base:80,   mul:4,   desc:() => '+1 max charge' },
  { id:'lens',   name:'Solar Lens',     icon:'☀', max:100,base:200,  mul:2.1, desc:() => '+25% Stardust from everything' },
  { id:'kin',    name:'Kinship',        icon:'∞', max:10, base:800,  mul:3.6, desc:() => 'Twins drift together and merge by themselves' },
  { id:'drone',  name:'Seeder Drones',  icon:'⌖', max:10, base:2000, mul:4,   desc:l => l ? 'Drones seed bodies faster' : 'A drone seeds new bodies for you' },
  { id:'tap',    name:'Solar Flare',    icon:'✺', max:20, base:100,  mul:3,   desc:() => 'Sun taps give +0.2 s more Stardust' },
  { id:'comet',  name:'Comet Lure',     icon:'☄', max:8,  base:1500, mul:4,   desc:() => 'Golden comets appear 10% more often' },
  { id:'archive',name:'Time Archive',   icon:'⌛', max:10, base:1000, mul:3.5, desc:() => 'Earn more while away (+8%, +1 h cap)' },
];
const upCost = (u, l) => Math.ceil(u.base * Math.pow(u.mul, l));

/* ---------------- cosmos perks (bought with Essence, never reset) ---------------- */
const PERKS = [
  { id:'heart',  name:'Stellar Heart',   icon:'♥', max:30, cost:l => Math.ceil(Math.pow(1.45, l)), desc:'+50% Stardust forever' },
  { id:'bang',   name:'Big Bang',        icon:'✸', max:5,  cost:l => 2 * Math.pow(2, l),  desc:'Start each galaxy with more Stardust' },
  { id:'qforge', name:'Quantum Forge',   icon:'✦', max:3,  cost:l => 3 * Math.pow(3, l),  desc:'Start with +2 Stellar Forge levels' },
  { id:'vast',   name:'Vast Orbits',     icon:'◎', max:5,  cost:l => 2 * Math.pow(2, l),  desc:'+3 orbit slots' },
  { id:'deep',   name:'Deep Time',       icon:'⌛', max:4,  cost:l => 2 * Math.pow(2, l),  desc:'+15% away earnings, +2 h cap' },
  { id:'tamer',  name:'Comet Tamer',     icon:'☄', max:3,  cost:l => 3 * Math.pow(2, l),  desc:'Comets appear 40% more often' },
  { id:'reson',  name:'Resonance',       icon:'∞', max:3,  cost:l => 3 * Math.pow(2, l),  desc:'Kinship is 50% stronger' },
  { id:'genesis',name:'Genesis',         icon:'❀', max:3,  cost:l => 2 * Math.pow(2, l),  desc:'Life evolves 60% faster' },
  { id:'eternal',name:'Eternal Drones',  icon:'⌖', max:1,  cost:() => 6,                  desc:'Start every galaxy with 3 Seeder Drones' },
  { id:'remnant',name:'Remnant',         icon:'●', max:1,  cost:() => 8,                  desc:'Keep your biggest body through a Supernova' },
];

const GALAXIES = ['Milky Cradle', 'Andromeda Bloom', 'Whirlpool Hush', 'Sombrero Dream', 'Pinwheel Glow', 'Cartwheel Tide', 'Sunflower Drift', 'Tadpole Song', 'Cigar Ember', 'Black Eye Veil'];
// each galaxy has its own sky: [nebula a, nebula b, nebula c, sky top, sky bottom, sun hue]
const SKIES = [
  ['#6a3fa0', '#2f6fb5', '#c0508f', '#0b0820', '#150c2e', '#ffc86b'],
  ['#2f7f9f', '#3fa08a', '#7a4fb0', '#061420', '#0b1a2a', '#ffe08a'],
  ['#9f3f6a', '#c06a3f', '#503fa0', '#170812', '#1e0d1a', '#ffab6b'],
  ['#3f4fa0', '#6a9fd0', '#a04f9f', '#070a1e', '#0d1030', '#fff0c8'],
  ['#2f9f6a', '#4f7fb0', '#b0a04f', '#06140f', '#0a1a18', '#ffd87a'],
];

/* ---------------- missions ---------------- */
const MT = [
  { id:'merge', ev:'merge', kind:'sum', vals:[8, 25, 60, 150, 400, 1000, 2500],  txt:n => `Merge ${n} times` },
  { id:'make',  ev:'make',  kind:'max', vals:[3, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], txt:n => `Create a ${TIERS[n].n}` },
  { id:'tap',   ev:'tap',   kind:'sum', vals:[15, 40, 100, 250, 600],            txt:n => `Tap the Sun ${n} times` },
  { id:'comet', ev:'comet', kind:'sum', vals:[1, 3, 6, 12, 25],                  txt:n => `Catch ${n} golden comet${n > 1 ? 's' : ''}` },
  { id:'feed',  ev:'feed',  kind:'sum', vals:[3, 10, 25, 60, 150],               txt:n => `Feed ${n} bodies to the Sun` },
  { id:'combo', ev:'combo', kind:'max', vals:[3, 4, 5, 6, 8, 10],                txt:n => `Make a x${n} merge combo` },
  { id:'life',  ev:'life',  kind:'max', vals:[1, 2, 3, 4, 5],                    txt:n => `Evolve ${LIFE[n].n.toLowerCase()} on a world` },
  { id:'wander',ev:'wander',kind:'sum', vals:[1, 3, 6, 12],                      txt:n => `Catch ${n} wandering bod${n > 1 ? 'ies' : 'y'}` },
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'orbitopia_save_v1';
function defSave(){
  return {
    v:1, dust:0, earnedG:0, earnedAll:0, essence:0, essenceAll:0, galaxy:0,
    up:{ forge:0, slots:0, reactor:0, mag:0, lens:0, kin:0, drone:0, tap:0, comet:0, archive:0 },
    perks:{ heart:0, bang:0, qforge:0, vast:0, deep:0, tamer:0, reson:0, genesis:0, eternal:0, remnant:0 },
    bodies:[], charges:5, sunLvl:0, sunXp:0,
    disc:[true], topG:0, cosmos:false,
    missions:[], mTier:{}, missionsDone:0, mNew:false,
    stats:{ merges:0, taps:0, comets:0, feeds:0, wanders:0, maxCombo:0, play:0, novas:0 },
    daily:{ day:0, streak:0 }, last:0, tut:0, hints:{},
    opt:{ sfx:true, music:true, shake:true, quality:'auto', nums:true },
  };
}
let save = defSave();
function mergeInto(base, src){
  for(const k in src){
    if(!(k in base)){ base[k] = src[k]; continue; }
    const b = base[k], s = src[k];
    if(b && typeof b === 'object' && !Array.isArray(b) && s && typeof s === 'object' && !Array.isArray(s)) mergeInto(b, s);
    else if(s !== undefined && s !== null && typeof s === typeof b && Array.isArray(s) === Array.isArray(b)) base[k] = s;
  }
  return base;
}
// On CrazyGames the SDK Data Module is the only store; LocalStorage is the off-portal fallback.
function loadSave(){
  let raw = null; const d = SDK.data();
  try{ if(d) raw = d.getItem(SAVE_KEY); }catch(e){}
  if(!raw && !d){ try{ raw = localStorage.getItem(SAVE_KEY); }catch(e){} }
  if(raw){ try{ save = mergeInto(defSave(), JSON.parse(raw)); }catch(e){ save = defSave(); } }
}
let _saveT = 0;
function writeSave(){
  try{ packBodies(); }catch(e){}
  save.last = Date.now();
  const s = JSON.stringify(save), d = SDK.data();
  if(d){ try{ d.setItem(SAVE_KEY, s); }catch(e){} return; }
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
function persist(){ clearTimeout(_saveT); _saveT = setTimeout(writeSave, 300); }
