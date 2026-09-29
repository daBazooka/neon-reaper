'use strict';
/* ---------------- utils ---------------- */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const $ = id => document.getElementById(id);
const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
function fmt(n){
  n = Math.floor(n);
  if(n < 100000) return n.toLocaleString('en-US');
  let i = 0; while(n >= 1000 && i < SUF.length - 1){ n /= 1000; i++; }
  return (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)) + SUF[i];
}
function mulberry32(s){ return function(){ s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function todayKey(){ const d = new Date(); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); }
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }

/* ---------------- atoms ----------------
   r: body radius · blast: blast radius multiplier · val: energy multiplier · from: first level it can appear */
const ATOMS = {
  basic:  { name:'Atom',      col:'#3ff0ff', r:11, blast:1,    val:1,  from:1,  desc:'Pops and blasts everything it touches.' },
  big:    { name:'Heavy',     col:'#ffb020', r:15, blast:1.55, val:2,  from:4,  desc:'A heavy atom with a much bigger blast.' },
  split:  { name:'Splitter',  col:'#7dff5a', r:12, blast:.7,   val:2,  from:7,  desc:'Bursts into three shards that fly out and blast.' },
  magnet: { name:'Magnet',    col:'#c07aff', r:12, blast:1.1,  val:2,  from:11, desc:'Pulls nearby atoms into its blast.' },
  zap:    { name:'Lightning', col:'#fff35a', r:11, blast:.8,   val:2,  from:14, desc:'Zaps the three nearest atoms instantly.' },
  armor:  { name:'Armored',   col:'#dfe6f0', r:13, blast:1,    val:3,  from:17, desc:'Needs two hits to crack.', hp:2 },
  time:   { name:'Chrono',    col:'#5a8cff', r:12, blast:1,    val:2,  from:21, desc:'Slows time and makes every blast last longer.' },
  gold:   { name:'Golden',    col:'#ffd23c', r:12, blast:1.2,  val:12, from:3,  desc:'Worth twelve times more energy.' },
  void:   { name:'Void',      col:'#ff2e6a', r:14, blast:0,    val:0,  from:25, desc:'Swallows any blast that touches it. Only lightning breaks it.' },
  nuke:   { name:'Nova',      col:'#ff5ad9', r:14, blast:3.1,  val:5,  from:9,  desc:'A rare atom with an enormous blast.' },
};
const ATOM_IDS = Object.keys(ATOMS);

/* ---------------- worlds (10 levels each, then they cycle and grow) ---------------- */
const WORLDS = [
  { name:'The Lab',       bg:['#0b0d24', '#1c1446'], grid:'#3ff0ff', accent:'#3ff0ff' },
  { name:'Solar Furnace', bg:['#1e0c0a', '#48160e'], grid:'#ff8a3a', accent:'#ffb020' },
  { name:'Toxic Vats',    bg:['#07180e', '#123a1c'], grid:'#7dff5a', accent:'#7dff5a' },
  { name:'Cryo Chamber',  bg:['#061426', '#0c2e4e'], grid:'#8ad8ff', accent:'#8ad8ff' },
  { name:'The Void',      bg:['#14061c', '#2e0c38'], grid:'#ff5ad9', accent:'#ff5ad9' },
];

/* ---------------- upgrades ---------------- */
const UPG = [
  { id:'size',  icon:'◎', name:'Blast Size',   base:25,   k:1.45, max:40, eff:l => `Blasts ${Math.round(blastMul(l) * 100)}% size` },
  { id:'time',  icon:'⏱', name:'Blast Time',   base:40,   k:1.55, max:25, eff:l => `Blasts last ${holdT(l).toFixed(2)}s` },
  { id:'tap',   icon:'☝', name:'Tap Power',    base:60,   k:1.6,  max:20, eff:l => `Your tap blast ${Math.round(tapR(l))} wide` },
  { id:'value', icon:'⚡', name:'Energy Value', base:90,   k:2,    max:40, eff:l => `Energy x${Math.pow(1.22, l).toFixed(2)}` },
  { id:'crit',  icon:'✸', name:'Overcharge',   base:200,  k:1.75, max:20, eff:l => `${(l * 1.5).toFixed(1).replace('.0', '')}% of pops blast double` },
  { id:'luck',  icon:'★', name:'Rare Atoms',   base:350,  k:1.85, max:15, eff:l => `+${l * 10}% special atoms` },
  { id:'extra', icon:'✚', name:'Extra Tap',    base:25000, k:20,  max:2,  eff:l => `${1 + l} tap${l ? 's' : ''} per round` },
];
const blastMul = l => 1 + .04 * l;
const holdT = l => .9 + .05 * l;
const tapR = l => 70 * (1 + .09 * l);
const upCost = (u, l) => Math.ceil(u.base * Math.pow(u.k, l));

/* ---------------- levels ---------------- */
function levelSpec(lv){
  const R = mulberry32(hashStr('cm-level-' + lv)), world = ((lv - 1) / 10 | 0) % WORLDS.length, boss = lv % 10 === 0;
  const count = Math.min(130, Math.round(34 + lv * 1.3 + (lv > 30 ? (lv - 30) * .4 : 0)));
  const clusters = lv <= 3 ? 1 : lv < 8 ? 0 : Math.min(7, 2 + (lv / 8 | 0)), spread = lv <= 3 ? .45 : lv < 8 ? 0 : clamp(.3 + lv * .011, .3, .8);
  const goalFrac = clamp(.2 + lv * .011, .2, .85);
  const pool = ATOM_IDS.filter(k => ATOMS[k].from <= lv && k !== 'basic' && k !== 'gold' && k !== 'nuke' && k !== 'void');
  const speed = 24 + Math.min(40, lv * .8);
  return { lv, world, boss, count, goal:boss ? 0 : Math.ceil(count * goalFrac), pool, speed, seed:(R() * 4294967296) >>> 0, voids:lv >= 25 ? Math.min(9, 2 + (lv - 25) / 5 | 0) : 0, clusters, spread, coreHp:boss ? Math.max(5, Math.round(count * (lv <= 10 ? .12 : .16))) : 0, react:1 / (1 + .022 * (lv - 1)) };
}
const TIPS = [
  'Tap where the atoms are <b>thickest</b>. One good tap is worth a hundred bad ones.',
  'Wait a moment before tapping. Atoms drift into <b>better clusters</b>.',
  '<b>Splitters</b> fling shards across gaps. Great for reaching lonely atoms.',
  'Energy is kept even when you fail. <b>Every try makes you stronger.</b>',
  '<b>Chrono</b> atoms slow time and stretch every blast.',
  'Only <b>lightning</b> can break a Void atom.',
  'Pop <b>every</b> atom for a TOTAL MELTDOWN and three stars.',
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'criticalmass_save_v1';
function defSave(){
  return {
    v:1, energy:0, earned:0, level:1, maxLevel:1, stars:{}, up:{ size:0, time:0, tap:0, value:0, crit:0, luck:0, extra:0 },
    seen:{ basic:1 }, best:{ chain:0, endless:0 }, stats:{ pops:0, rounds:0, melts:0, bosses:0 },
    daily:{ key:'', done:false }, streak:{ lv:0, n:0 }, tut:0, opt:{ sfx:true, music:true, fx:'high' },
  };
}
let save = defSave();
function mergeInto(base, src){
  for(const k in src){
    if(!(k in base)){ base[k] = src[k]; continue; }
    const b = base[k], s = src[k];
    if(b && typeof b === 'object' && !Array.isArray(b) && s && typeof s === 'object' && !Array.isArray(s)) mergeInto(b, s);
    else if(s !== undefined && s !== null && typeof s === typeof b) base[k] = s;
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
function writeSave(){
  const s = JSON.stringify(save), d = SDK.data();
  if(d){ try{ d.setItem(SAVE_KEY, s); }catch(e){} return; }
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
let _saveT = 0;
function persist(){ clearTimeout(_saveT); _saveT = setTimeout(writeSave, 300); }
