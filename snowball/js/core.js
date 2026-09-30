'use strict';
/* =====================================================================
   SNOWBALL EFFECT core: utilities, tiers, objects, upgrades, missions, save.
   Start as a snowflake. End as an ice planet.
   ===================================================================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const $ = id => document.getElementById(id);
function fmt(n){
  n = Math.floor(n);
  if(n < 10000) return n.toLocaleString('en-US');
  const u = ['K', 'M', 'B', 'T']; let i = -1;
  while(n >= 1000 && i < u.length - 1){ n /= 1000; i++; }
  return (n < 100 ? n.toFixed(1).replace(/\.0$/, '') : Math.floor(n)) + u[i];
}
// world unit = 1 cm; the ball's size is shown as its diameter
function fmtSize(r){
  const d = r * 2;
  if(d < 100) return d.toFixed(d < 10 ? 1 : 0) + ' cm';
  if(d < 100000) return (d / 100).toFixed(d < 1000 ? 2 : d < 10000 ? 1 : 0) + ' m';
  return (d / 100000).toFixed(d < 1e6 ? 2 : 1) + ' km';
}
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
function mix(h1, h2, t){ const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16); const r = lerp(a >> 16, b >> 16, t) | 0, g = lerp(a >> 8 & 255, b >> 8 & 255, t) | 0, bl = lerp(a & 255, b & 255, t) | 0; return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1); }

/* ---------------- tiers (by radius) ---------------- */
const TIERS = [
  { at:0,     name:'Snowflake',      sky:['#8fd4ff', '#e8f7ff'], hill:'#b8d8f0', far:'#d6ecff' },
  { at:7,     name:'Snowball',       sky:['#7ccaff', '#e0f4ff'], hill:'#a8cdea', far:'#cfe6fa' },
  { at:18,    name:'Big Snowball',   sky:['#6cc0ff', '#d8f0ff'], hill:'#98c2e4', far:'#c6e0f6' },
  { at:45,    name:'Boulder',        sky:['#5ab4fa', '#cfeaff'], hill:'#88b6dc', far:'#bcd8f2' },
  { at:120,   name:'Avalanche',      sky:['#4aa6f2', '#c4e2fb'], hill:'#7aa8d2', far:'#b0cfec' },
  { at:320,   name:'Glacier',        sky:['#3d94e6', '#b4d8f6'], hill:'#6c98c6', far:'#a2c4e4' },
  { at:900,   name:'Mountain Eater', sky:['#2f7ed6', '#a0c8ee'], hill:'#5e88b8', far:'#94b8dc' },
  { at:2600,  name:'Sky Swallower',  sky:['#1e5aa8', '#7fb0e6'], hill:'#4c74a4', far:'#86a8d0' },
  { at:8000,  name:'Ice Planet',     sky:['#0a1a44', '#2a4a8a'], hill:'#3a5a8a', far:'#50709e' },
  { at:24000, name:'Cosmic Snowball',sky:['#02040f', '#10183a'], hill:'#2a3a64', far:'#34466e' },
];
function tierOf(r){ let t = 0; for(let i = 0; i < TIERS.length; i++) if(r >= TIERS[i].at) t = i; return t; }

/* ---------------- things to swallow (emoji are system glyphs) ---------------- */
// s: typical height in world units (cm). sky: floats above the slope.
const THINGS = [
  { id:'pebble',  e:'🪨', name:'Pebble',        s:2.2 },
  { id:'mitten',  e:'🧤', name:'Mitten',        s:2.8 },
  { id:'carrot',  e:'🥕', name:'Carrot',        s:3.2 },
  { id:'acorn',   e:'🌰', name:'Chestnut',      s:2 },
  { id:'scarf',   e:'🧣', name:'Scarf',         s:3.8 },
  { id:'bucket',  e:'🪣', name:'Bucket',        s:4.5 },
  { id:'gift',    e:'🎁', name:'Present',       s:5.5 },
  { id:'lantern', e:'🏮', name:'Lantern',       s:6 },
  { id:'sled',    e:'🛷', name:'Sled',          s:7 },
  { id:'skis',    e:'🎿', name:'Skis',          s:9 },
  { id:'snowman', e:'⛄', name:'Snowman',       s:12 },
  { id:'wood',    e:'🪵', name:'Log',           s:10 },
  { id:'xmas',    e:'🎄', name:'Festive Tree',  s:17 },
  { id:'tent',    e:'⛺', name:'Tent',          s:20 },
  { id:'pine',    e:'🌲', name:'Pine Tree',     s:28 },
  { id:'car',     e:'🚗', name:'Car',           s:24 },
  { id:'truck',   e:'🛻', name:'Pickup',        s:30 },
  { id:'hut',     e:'🛖', name:'Hut',           s:40 },
  { id:'bus',     e:'🚌', name:'Bus',           s:48 },
  { id:'house',   e:'🏠', name:'House',         s:62 },
  { id:'cottage', e:'🏡', name:'Cottage',       s:75 },
  { id:'gondola', e:'🚠', name:'Cable Car',     s:70, sky:1 },
  { id:'church',  e:'⛪', name:'Chapel',        s:120 },
  { id:'school',  e:'🏫', name:'School',        s:150 },
  { id:'hotel',   e:'🏨', name:'Ski Hotel',     s:190 },
  { id:'factory', e:'🏭', name:'Factory',       s:240 },
  { id:'castle',  e:'🏰', name:'Castle',        s:320 },
  { id:'wheel',   e:'🎡', name:'Ferris Wheel',  s:380 },
  { id:'stadium', e:'🏟️', name:'Stadium',       s:470 },
  { id:'balloon', e:'🎈', name:'Balloon',       s:420, sky:1 },
  { id:'tower',   e:'🗼', name:'Tower',         s:650 },
  { id:'hill',    e:'⛰️', name:'Hill',          s:1000 },
  { id:'heli',    e:'🚁', name:'Helicopter',    s:900, sky:1 },
  { id:'peak',    e:'🏔', name:'Snowy Peak',    s:1700 },
  { id:'plane',   e:'✈️', name:'Airliner',      s:2000, sky:1 },
  { id:'cloud',   e:'☁️', name:'Cloud',         s:2800, sky:1 },
  { id:'volcano', e:'🌋', name:'Volcano',       s:3400 },
  { id:'fuji',    e:'🗻', name:'Great Mountain',s:5200 },
  { id:'storm',   e:'⛈️', name:'Storm Cloud',   s:6500, sky:1 },
  { id:'ufo',     e:'🛸', name:'UFO',           s:8000, sky:1 },
  { id:'sat',     e:'🛰️', name:'Satellite',     s:11000, sky:1 },
  { id:'rocket',  e:'🚀', name:'Rocket',        s:15000, sky:1 },
  { id:'comet',   e:'☄️', name:'Comet',         s:26000, sky:1 },
  { id:'moon',    e:'🌕', name:'The Moon',      s:42000, sky:1 },
  { id:'saturn',  e:'🪐', name:'Ringed Planet', s:90000, sky:1 },
];
const THING = Object.fromEntries(THINGS.map(t => [t.id, t]));

/* ---------------- upgrades ---------------- */
const UPG = [
  { id:'start',  icon:'❄', name:'Bigger Start',  base:60,  k:1.7,  max:15, eff:l => `Start at ${fmtSize(startR(l))}` },
  { id:'frost',  icon:'🧊', name:'Frost Coat',    base:80,  k:1.75, max:15, eff:l => `Melt ${Math.round(meltMul(l) * 100)}% as fast` },
  { id:'grow',   icon:'⬆', name:'Sticky Snow',   base:120, k:1.8,  max:15, eff:l => `Swallowing grows you ${Math.round(growMul(l) * 100)}%` },
  { id:'aval',   icon:'🌪', name:'Avalanche Fuel',base:150, k:1.85, max:10, eff:l => `Avalanche meter fills in ${avalNeed(l)}` },
  { id:'magnet', icon:'🧲', name:'Crystal Magnet',base:100, k:1.7,  max:10, eff:l => `Pulls crystals ${(2 + l * .6).toFixed(1)} balls away` },
  { id:'value',  icon:'💎', name:'Crystal Value', base:200, k:1.9,  max:15, eff:l => `Crystals worth x${(1 + l * .25).toFixed(2)}` },
];
const startR = l => 4 * Math.pow(1.12, l);
const meltMul = l => Math.pow(.93, l);
const growMul = l => 1 + l * .06;
const avalNeed = l => Math.max(30, 60 - l * 3);
const upCost = (u, l) => Math.ceil(u.base * Math.pow(u.k, l) / 10) * 10;

/* ---------------- missions ---------------- */
const MTYPES = {
  size:   { t:n => `Grow to ${fmtSize(n)} in one run`, run:true },
  eat:    { t:n => `Swallow ${n} things in one run`, run:true },
  hop:    { t:n => `Jump over ${n} big things`, run:false },
  aval:   { t:n => n > 1 ? `Start ${n} Avalanches` : 'Start an Avalanche', run:false },
  cry:    { t:n => `Collect ${n} crystals in one run`, run:true },
  combo:  { t:n => `Reach a x${n} swallow streak`, run:true },
  slam:   { t:n => `Slam-land ${n} times`, run:false },
  thing:  { t:n => `Swallow a ${THINGS[n].name} ${THINGS[n].e}`, run:false },
};
function makeMission(rank, avoid){
  const keys = Object.keys(MTYPES).filter(k => !avoid.includes(k));
  const k = pick(keys);
  let n;
  switch(k){
    case 'size': n = 10 * Math.pow(1.55, rank); break;
    case 'eat': n = Math.round((30 + rank * 14) / 5) * 5; break;
    case 'hop': n = 3 + Math.round(rank * 1.3); break;
    case 'aval': n = 1 + Math.floor(rank / 3); break;
    case 'cry': n = Math.round((25 + rank * 18) / 5) * 5; break;
    case 'combo': n = Math.min(40, 8 + rank * 3); break;
    case 'slam': n = 2 + rank; break;
    case 'thing': { const r = 6 * Math.pow(1.5, rank) * 1.3; let best = 0; THINGS.forEach((t, i) => { if(!t.sky && t.s < r && t.s > THINGS[best].s) best = i; }); n = best; break; }
  }
  return { k, n, p:0, done:false };
}
const rankReward = r => Math.round(120 * Math.pow(1.35, r) / 10) * 10;
const RANKS = ['Snowflake', 'Flurry', 'Drift', 'Blizzard', 'Avalanche', 'Glacier', 'Ice Age', 'Frost Giant', 'Winter King', 'Absolute Zero'];
const rankName = r => RANKS[Math.min(RANKS.length - 1, (r / 3) | 0)] + ' ' + ['I', 'II', 'III'][r % 3];

/* ---------------- save ---------------- */
const SAVE_KEY = 'snowballeffect_save_v1';
let _saveT = 0;
function defSave(){
  return {
    v:1, cry:0, best:0, bestTier:0, up:{ start:0, frost:0, grow:0, aval:0, magnet:0, value:0 },
    rank:0, missions:[], globe:{}, stats:{ runs:0, eaten:0, hops:0, avals:0, slams:0, cry:0 },
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
function fillMissions(){
  save.missions = save.missions.filter(m => m && MTYPES[m.k]);
  while(save.missions.length < 3) save.missions.push(makeMission(save.rank, save.missions.map(m => m.k)));
}
function loadSave(){
  let raw = null; const d = SDK.data();
  try{ if(d) raw = d.getItem(SAVE_KEY); }catch(e){}
  if(!raw && !d){ try{ raw = localStorage.getItem(SAVE_KEY); }catch(e){} }
  if(raw){ try{ save = mergeInto(defSave(), JSON.parse(raw)); }catch(e){ save = defSave(); } }
  fillMissions();
}
function writeSave(){
  const s = JSON.stringify(save), d = SDK.data();
  if(d){ try{ d.setItem(SAVE_KEY, s); }catch(e){} return; }
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
function persist(){ clearTimeout(_saveT); _saveT = setTimeout(writeSave, 300); }
