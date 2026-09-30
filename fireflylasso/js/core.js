'use strict';
/* =====================================================================
   FIREFLY LASSO core: utilities, species, places, nights, upgrades, save.
   Draw a loop. Catch the light.
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
  const u = ['K', 'M', 'B', 'T', 'Qa']; let i = -1;
  while(n >= 1000 && i < u.length - 1){ n /= 1000; i++; }
  return (n < 100 ? n.toFixed(1).replace(/\.0$/, '') : Math.floor(n)) + u[i];
}
function mulberry32(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
function mix(h1, h2, t){ const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16); const r = lerp(a >> 16, b >> 16, t) | 0, g = lerp(a >> 8 & 255, b >> 8 & 255, t) | 0, bl = lerp(a & 255, b & 255, t) | 0; return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1); }

/* ---------------- firefly species ---------------- */
// hue: colour family used for PURE / RAINBOW bonuses
const SPECIES = {
  glow:   { name:'Glowbug',   col:'#ffe25a', hue:'gold',   val:1,   r:5,   spd:38,  from:1,  desc:'The friendliest light in the meadow.' },
  mint:   { name:'Mintfly',   col:'#7dff9a', hue:'green',  val:1,   r:5,   spd:26,  from:2,  desc:'Slow and sociable. Mintflies love a crowd.' },
  blue:   { name:'Bluewing',  col:'#6ad0ff', hue:'blue',   val:2,   r:5,   spd:70,  from:3,  desc:'Quick as a thought. Worth two.' },
  rose:   { name:'Rosepair',  col:'#ff7ad0', hue:'pink',   val:2,   r:5,   spd:40,  from:5,  desc:'Always in pairs. Catch both together for a heart bonus.' },
  gold:   { name:'Goldie',    col:'#ffb020', hue:'gold',   val:10,  r:6,   spd:90,  from:4,  desc:'Rare, shy and darting. Worth ten.', shy:1 },
  blink:  { name:'Blinker',   col:'#f4f0ff', hue:'white',  val:4,   r:5,   spd:45,  from:8,  desc:'Vanishes every other second. Only catchable while shining.' },
  ember:  { name:'Emberfly',  col:'#ff7a3a', hue:'orange', val:3,   r:5,   spd:50,  from:21, desc:'Found in the Misty Marsh. Leaves a warm trail.' },
  frost:  { name:'Frostfly',  col:'#bff4ff', hue:'blue',   val:3,   r:5,   spd:34,  from:31, desc:'Lives up in Starfall Peaks. Cold, calm, bright.' },
  star:   { name:'Starling',  col:'#ffffff', hue:'rainbow',val:5,   r:6,   spd:55,  from:12, desc:'Shimmers every colour. Counts as any colour for a Rainbow.', rare:1 },
  moth:   { name:'Moonmoth',  col:'#c8a8ff', hue:'purple', val:15,  r:8,   spd:30,  from:0,  desc:'A secret. It only comes when your loops are on fire.', secret:'Reach a x4 chain.' },
  shadow: { name:'Shadowfly', col:'#8a5aff', hue:'purple', val:20,  r:6,   spd:60,  from:0,  desc:'A secret of the deepest midnight.', secret:'Survive 90 seconds of Midnight Hunt.' },
  queen:  { name:'Firefly Queen', col:'#ffd6a0', hue:'gold', val:120, r:22, spd:60,  from:0,  desc:'The heart of every tenth night. Loop her to crown the night.', boss:1 },
};
const SP_IDS = Object.keys(SPECIES);

/* ---------------- places (10 nights each) ---------------- */
const PLACES = [
  { id:'meadow', name:'Moonlit Meadow',   sky:['#0b1640', '#1f2d6a'], hill:['#0d1a2e', '#12243a'], grass:'#16324a', moon:'#fff6d6', fog:0,   key:62 },
  { id:'woods',  name:'Whispering Woods', sky:['#080f24', '#1a2250'], hill:['#081420', '#0c1c2c'], grass:'#10283a', moon:'#e8f0ff', fog:0,   key:57, trees:1 },
  { id:'marsh',  name:'Misty Marsh',      sky:['#0d1424', '#253044'], hill:['#0c1a1a', '#10241f'], grass:'#153428', moon:'#ffe8c0', fog:.35, key:60, water:1 },
  { id:'peaks',  name:'Starfall Peaks',   sky:['#05051a', '#241a4a'], hill:['#0c0c24', '#161634'], grass:'#1c1c40', moon:'#ffffff', fog:0,   key:65, snow:1 },
];

/* ---------------- nights ---------------- */
// the goal is how much light fills the jar; stars at goal, x1.8 and x3
function nightSpec(n){
  const place = ((n - 1) / 10 | 0) % PLACES.length, boss = n % 10 === 0, loop = (n - 1) / 40 | 0;
  const d = Math.min(1, (n - 1) / 45);
  const pool = SP_IDS.filter(k => SPECIES[k].from > 0 && SPECIES[k].from <= n && !SPECIES[k].secret && !SPECIES[k].boss && (k !== 'ember' || place === 2 || n > 40) && (k !== 'frost' || place === 3 || n > 40));
  return {
    n, place, boss, pool, time:45,
    pop:Math.round((16 + d * 14) * (typeof G !== 'undefined' && G.W && G.H ? clamp(G.W * G.H / 576000, .85, 1.5) : 1)),
    goal:Math.round((480 + 132 * (n - 1)) * (place === 2 ? .68 : 1) * (1 + loop * .5) / 10) * 10,
    wasps:n < 4 ? 0 : Math.min(5, 1 + (n - 4) / 7 | 0),
    bats:place === 1 || n > 40 ? Math.min(3, 1 + (n - 11) / 5 | 0) : 0,
    webs:place === 2 || n > 40 ? Math.min(4, 1 + (n - 21) / 4 | 0) : 0,
    wind:place === 3 || n > 40 ? .5 + (n % 10) * .06 : 0,
    rain:place === 3 && n % 3 === 0,
    seed:hashStr('ffl-night-' + n),
  };
}

/* ---------------- upgrades ---------------- */
const UPG = [
  { id:'rope',  icon:'〰', name:'Longer Lasso',  base:500,  k:1.55, max:12, eff:l => `Lasso ${Math.round(ropeLen(l))} long` },
  { id:'lure',  icon:'✨', name:'Firefly Lure',  base:700,  k:1.6,  max:10, eff:l => `+${l * 10}% fireflies` },
  { id:'value', icon:'💡', name:'Brighter Light',base:900,  k:1.5,  max:30, eff:l => `Light x${lightMul(l).toFixed(2)}` },
  { id:'time',  icon:'🌙', name:'Longer Nights', base:2500, k:1.9,  max:6,  eff:l => `Nights last ${45 + l * 3}s` },
  { id:'luck',  icon:'🍀', name:'Lucky Charm',   base:3000, k:1.8,  max:8,  eff:l => `Rare fireflies x${(1 + l * .2).toFixed(1)}` },
  { id:'bottle',icon:'⏳', name:'Time Bottle',   base:2000, k:2.2,  max:5,  eff:l => l ? `Slow time for ${2 + l}s once a night` : 'Unlock slow-motion once a night' },
];
const ropeLen = l => 760 + l * 85;
const lightMul = l => 1 + l * .2;
const upCost = (u, l) => Math.ceil(u.base * Math.pow(u.k, l) / 5) * 5;

const TIPS = [
  'Every firefly in a loop multiplies the others. <b>Big loops pay big.</b>',
  'Loop <b>one colour only</b> for a PURE x1.5 bonus, or <b>three colours</b> for a RAINBOW x2.',
  'Loop again within 2 seconds to build a <b>chain</b>.',
  '<b>Wasps</b> snap your lasso. Loop a wasp to shoo it away.',
  'Fireflies gather into <b>swarms</b>. Wait for one, then loop it.',
  'Your glow is kept even when you miss the goal. <b>Every night makes you brighter.</b>',
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'fireflylasso_save_v1';
let _saveT = 0;
function defSave(){
  return {
    v:1, glow:0, earned:0, night:1, maxNight:1, stars:{}, up:{ rope:0, lure:0, value:0, time:0, luck:0, bottle:0 },
    codex:{}, best:{ loop:0, hunt:0, huntT:0 }, stats:{ caught:0, loops:0, nights:0, rainbows:0, queens:0 },
    tut:0, opt:{ sfx:true, music:true, fx:'high' },
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
function persist(){ clearTimeout(_saveT); _saveT = setTimeout(writeSave, 300); }
