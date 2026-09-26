'use strict';
/* ---------------- utils ---------------- */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const $ = id => document.getElementById(id);
const fmt = n => Math.floor(n).toLocaleString('en-US');
const angDiff = (a, b) => { let d = (a - b) % TAU; if(d > Math.PI) d -= TAU; if(d < -Math.PI) d += TAU; return d; };
function mulberry32(s){ return function(){ s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function todayKey(){ const d = new Date(); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); }
let grng = Math.random;
const gr = (a, b) => a + grng() * (b - a);
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
function mixHex(a, b, t){
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const c = s => Math.round(lerp(x >> s & 255, y >> s & 255, t));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}
// distance from point to segment, squared
function segD2(px, py, ax, ay, bx, by){
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = clamp(t, 0, 1);
  const x = ax + dx * t - px, y = ay + dy * t - py; return x * x + y * y;
}
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/* ---------------- arena ---------------- */
const ARENA_R = 760;
const ECHO_T = 5;           // seconds recorded per echo, and the sweep of the clock hand
const REC_HZ = 30;

/* ---------------- enemies (original glitch creatures) ---------------- */
const ET = {
  drone:    { r:15, hp:18,  spd:138, col:'#ff3860', cost:1, w:5,   at:1, name:'Shard' },
  caster:   { r:19, hp:34,  spd:92,  col:'#c04bff', cost:2, w:1.6, at:2, name:'Hexer', shoot:true,
              tip:'<em>HEXERS</em> shoot from range. Dash <b>through</b> their bolts: dashing makes you untouchable.' },
  brute:    { r:33, hp:115, spd:60,  col:'#ff7a1a', cost:4, w:1.2, at:3, name:'Brute', charge:true,
              tip:'<em>BRUTES</em> glow before they charge. <b>Sidestep</b>, then carve them up.' },
  leaper:   { r:18, hp:30,  spd:104, col:'#ffd000', cost:2, w:1.3, at:4, name:'Leaper', leap:true,
              tip:'<em>LEAPERS</em> jump at you. <b>Leave the circle</b> before they land.' },
  eater:    { r:20, hp:42,  spd:170, col:'#8a5cff', cost:3, w:1.1, at:6, name:'Echo Eater', eats:true,
              tip:'<em>ECHO EATERS</em> hunt your echoes. <b>Protect your legion!</b>' },
  splitter: { r:27, hp:56,  spd:86,  col:'#ff4fa0', cost:3, w:1,   at:7, name:'Splitter', split:true },
  warden:   { r:23, hp:52,  spd:76,  col:'#39d0ff', cost:3, w:.8,  at:8, name:'Warden', shields:true,
              tip:'<em>WARDENS</em> shield nearby enemies. <b>Kill them first.</b>' },
};
const BOSSES = [
  { id:'metronome', name:'THE METRONOME', hp:3000, r:72, col:'#ff3860' },
  { id:'king',      name:'THE HOLLOW KING', hp:2400, r:48, col:'#c04bff' },
];

/* ---------------- upgrades (one pick after every wave) ---------------- */
const RAR = [ { n:'COMMON', c:'#9ad0ff', w:10 }, { n:'RARE', c:'#39ffb4', w:5 }, { n:'EPIC', c:'#ff3cac', w:2.2 } ];
const PERKS = [
  { id:'edge',    name:'Razor Edge',     icon:'⟋', rar:0, max:4, desc:'+22% damage' },
  { id:'reach',   name:'Long Lunge',     icon:'➹', rar:0, max:3, desc:'+18% dash distance' },
  { id:'swift',   name:'Quickdraw',      icon:'»', rar:0, max:3, desc:'Dash recharges 15% faster' },
  { id:'heart',   name:'Iron Heart',     icon:'♥', rar:0, max:3, desc:'+1 max heart and heal fully' },
  { id:'crit',    name:'Killer Instinct',icon:'✸', rar:0, max:3, desc:'+10% critical hit chance' },
  { id:'slam',    name:'Earthsplitter',  icon:'◎', rar:0, max:3, desc:'Slam is 25% wider and recharges faster' },
  { id:'fury',    name:'Echo Fury',      icon:'⚔', rar:1, max:3, desc:'Your echoes deal +30% damage' },
  { id:'legion',  name:'Legion+',        icon:'✦', rar:1, max:3, desc:'+1 echo in your legion' },
  { id:'wave',    name:'Crescent Wave',  icon:'☾', rar:1, max:2, desc:'Every slash launches a flying crescent' },
  { id:'charge',  name:'Overclock',      icon:'⚡', rar:1, max:2, desc:'LEGION charges 30% faster' },
  { id:'vamp',    name:'Bloodless Feast',icon:'✚', rar:1, max:1, desc:'Every 20 kills restores a heart' },
  { id:'storm',   name:'Sync Storm',     icon:'ϟ', rar:2, max:1, desc:'Sync strikes chain lightning to 4 foes' },
  { id:'trail',   name:'Afterblade',     icon:'≋', rar:2, max:1, desc:'Your dash leaves a burning blade trail' },
  { id:'bomb',    name:'Phantom Blast',  icon:'✺', rar:2, max:1, desc:'Echoes explode when they are replaced or eaten' },
];

/* ---------------- meta ---------------- */
const META = [
  { id:'heart',  name:'Vitality',     icon:'♥', desc:'+1 starting heart',               costs:[120, 360] },
  { id:'power',  name:'Honed Steel',  icon:'⟋', desc:'+8% damage',                      costs:[80, 200, 420] },
  { id:'legion', name:'Legion Core',  icon:'✦', desc:'+1 echo in your legion',          costs:[400] },
  { id:'charge', name:'Chrono Coil',  icon:'⚡', desc:'LEGION charges 12% faster',       costs:[90, 240] },
  { id:'luck',   name:'Shard Hunter', icon:'◆', desc:'+15% chrono shards from every run', costs:[100, 260, 520] },
];
// blades: c1 core, c2 edge glow, e echo tint
const SKINS = [
  { id:'neon',    name:'Neon Ronin',   c1:'#ffffff', c2:'#27f3ff', e:'#27f3ff', cost:0 },
  { id:'crimson', name:'Crimson Oath', c1:'#ffe0e0', c2:'#ff2e4d', e:'#ff6b8a', cost:250 },
  { id:'solar',   name:'Solar Fang',   c1:'#fff6d0', c2:'#ffb020', e:'#ffd166', cost:450 },
  { id:'venom',   name:'Venom Edge',   c1:'#eaffd0', c2:'#7dff3a', e:'#b6ff7a', cost:700 },
  { id:'void',    name:'Voidwalker',   c1:'#efe0ff', c2:'#9b4bff', e:'#c49bff', cost:1000 },
  { id:'glitch',  name:'Glitch Saint', c1:'#ffffff', c2:'glitch',  e:'glitch',  cost:1600 },
  { id:'gold',    name:'Emperor',      c1:'#fffbe6', c2:'#ffd23c', e:'#fff08a', cost:2500 },
];
const MODS = [
  { id:'swarm',  name:'SWARM',        desc:'Twice the enemies. Shards x1.5.' },
  { id:'glass',  name:'ONE HEART',    desc:'A single heart. Shards x2.' },
  { id:'legion', name:'GRAND LEGION', desc:'+2 echoes from the start.' },
  { id:'rush',   name:'OVERDRIVE',    desc:'Everything is 25% faster. Shards x1.5.' },
  { id:'titan',  name:'TITANS',       desc:'Only Brutes, Splitters and bosses.' },
];
const MT = [
  { id:'kills',  ev:'kill',   kind:'sum', vals:[100,300,800,2000,5000], txt:n => `Defeat ${n} enemies` },
  { id:'wave',   ev:'wave',   kind:'max', vals:[5,8,12,16,20,25],       txt:n => `Reach wave ${n}` },
  { id:'sync',   ev:'sync',   kind:'sum', vals:[20,60,150,400],         txt:n => `Land ${n} sync strikes` },
  { id:'combo',  ev:'combo',  kind:'max', vals:[20,40,70,120],          txt:n => `Reach a ${n} hit combo` },
  { id:'boss',   ev:'boss',   kind:'sum', vals:[1,3,6],                 txt:n => `Defeat ${n} boss${n > 1 ? 'es' : ''}` },
  { id:'ult',    ev:'ult',    kind:'sum', vals:[3,10,25],               txt:n => `Unleash LEGION ${n} times` },
  { id:'multi',  ev:'multi',  kind:'max', vals:[5,8,12,16],             txt:n => `Kill ${n} enemies within one second` },
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'echolegion_save_v1';
function defSave(){
  return {
    v:1, shards:0, best:0, bestWave:0, xp:0, level:1, runs:0,
    meta:{ heart:0, power:0, legion:0, charge:0, luck:0 },
    skins:['neon'], skin:'neon',
    missions:[], mTier:{}, missionsDone:0, mNew:false,
    stats:{ kills:0, syncs:0 },
    seen:{}, tut:false,
    opt:{ sfx:true, music:true, shake:true, flash:true, quality:'auto' },
    daily:{ key:'', best:0, bonus:false },
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
let _saveT = 0;
function writeSave(){
  const s = JSON.stringify(save), d = SDK.data();
  if(d){ try{ d.setItem(SAVE_KEY, s); }catch(e){} return; }
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
function persist(){ clearTimeout(_saveT); _saveT = setTimeout(writeSave, 250); }
function xpNeed(lv){ return 400 + lv * 250; }
