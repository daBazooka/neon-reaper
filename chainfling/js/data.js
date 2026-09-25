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
// gameplay RNG: seeded during the daily challenge so everyone gets the same waves
let grng = Math.random;
const gr = (a, b) => a + grng() * (b - a);

/* ---------------- content ---------------- */
// at: first wave the type can appear; cost: wave budget cost
const ET = {
  drifter:  { r:13, hp:1,   spd:88,  score:100, shards:1, col:'#ff3b6b', at:1,  cost:1,   w:3,   name:'DRIFTER' },
  mini:     { r:9,  hp:.5,  spd:150, score:50,  shards:0, col:'#ff6b9b', at:99, cost:.5,  w:0,   name:'MINI' },
  bomber:   { r:16, hp:1,   spd:48,  score:150, shards:1, col:'#ffb020', at:2,  cost:1.4, w:1.3, name:'BOMBER',
              tip:'<em>BOMBER</em> — explodes when destroyed. Use it to wipe out whole crowds!' },
  shield:   { r:15, hp:1,   spd:62,  score:250, shards:2, col:'#4da3ff', at:3,  cost:2,   w:1.2, name:'WARDEN',
              tip:'<em>WARDEN</em> — immune from the front. Bank off a wall and hit it from <b>behind</b>!' },
  splitter: { r:17, hp:1,   spd:58,  score:150, shards:1, col:'#b46bff', at:4,  cost:1.8, w:1.1, name:'SPLITTER',
              tip:'<em>SPLITTER</em> — breaks into two fast minis. Perfect chain fuel.' },
  turret:   { r:16, hp:1.5, spd:0,   score:200, shards:2, col:'#3dffb0', at:5,  cost:2.2, w:.8,  name:'TURRET',
              tip:'<em>TURRET</em> — fires bolts. Fly through bolts at speed to <b>shatter</b> them.' },
  dasher:   { r:13, hp:1,   spd:42,  score:200, shards:1, col:'#ff5ad9', at:7,  cost:1.8, w:1,   name:'LANCER',
              tip:'<em>LANCER</em> — telegraphs, then charges. Stay fast when it lunges.' },
  tank:     { r:24, hp:3.2, spd:36,  score:450, shards:3, col:'#ff7a3b', at:8,  cost:3.4, w:.8,  name:'BRUTE', heavy:true,
              tip:'<em>BRUTE</em> — takes several hits. Faster hits deal more damage.' },
  spiker:   { r:15, hp:1,   spd:92,  score:350, shards:2, col:'#e6e9ff', at:9,  cost:2.8, w:.8,  name:'SPIKER',
              tip:'<em>SPIKER</em> — only breaks at <b>OVERDRIVE</b> speed (fresh, full-power flings).' },
  ghost:    { r:14, hp:1,   spd:72,  score:300, shards:2, col:'#9ef0ff', at:11, cost:2.3, w:1,   name:'PHANTOM',
              tip:'<em>PHANTOM</em> — phases in and out. Only solid ones can be hit.' },
};

const BOSSES = [
  { id:'prism',   name:'THE PRISM',  col:'#4dd8ff' },
  { id:'hive',    name:'THE HIVE',   col:'#ffb020' },
  { id:'serpent', name:'THE SERPENT',col:'#b6ff3c' },
];

// rar: 0 common 1 rare 2 epic 3 legendary
const RAR = [
  { n:'COMMON',    c:'#9fb4ff', w:10 },
  { n:'RARE',      c:'#27f3ff', w:6 },
  { n:'EPIC',      c:'#ff3fb4', w:3 },
  { n:'LEGENDARY', c:'#ffb020', w:1.3 },
];
const UPS = [
  { id:'dmg',       name:'Heavy Core',   icon:'◆', rar:0, max:5, desc:'+25% impact damage' },
  { id:'speed',     name:'Thrusters',    icon:'➤', rar:0, max:3, desc:'+12% fling speed' },
  { id:'rubber',    name:'Rubber Walls', icon:'⟲', rar:0, max:3, desc:'Keep far more speed on wall bounces' },
  { id:'magnet',    name:'Tractor Field',icon:'⊕', rar:0, max:3, desc:'Pull shards from much further away' },
  { id:'focus',     name:'Chrono Lens',  icon:'⧗', rar:0, max:3, desc:'+35% slow-motion focus time' },
  { id:'size',      name:'Mass Core',    icon:'●', rar:0, max:3, desc:'+18% core size — easier hits' },
  { id:'heal',      name:'Patch Up',     icon:'✚', rar:0, max:99, desc:'Restore 1 heart', cond:() => P && P.hp < P.maxHp },
  { id:'charge',    name:'Capacitor',    icon:'⚡', rar:1, max:3, desc:'+1 max fling charge' },
  { id:'nova',      name:'Wall Nova',    icon:'✺', rar:1, max:3, desc:'Wall bounces blast nearby enemies' },
  { id:'trail',     name:'Plasma Trail', icon:'☄', rar:1, max:3, desc:'Leave a burning trail at high speed' },
  { id:'orbit',     name:'Satellite',    icon:'◎', rar:1, max:3, desc:'A blade orbits your core — even when slow' },
  { id:'zap',       name:'Arc Chain',    icon:'ϟ', rar:1, max:3, desc:'Kills can zap a nearby enemy' },
  { id:'shock',     name:'Aftershock',   icon:'✹', rar:1, max:3, desc:'Kills burst, damaging neighbours' },
  { id:'overdrive', name:'Overclock',    icon:'⏫', rar:1, max:3, desc:'Stay lethal at lower speeds' },
  { id:'heart',     name:'Reinforce',    icon:'♥', rar:2, max:3, desc:'+1 max heart and full heal' },
  { id:'combo',     name:'Hot Streak',   icon:'✦', rar:2, max:3, desc:'Streak multiplier grows 50% faster' },
  { id:'vamp',      name:'Siphon',       icon:'♡', rar:2, max:2, desc:'Every 30 kills restore a heart (20 at Lv2)' },
  { id:'echo',      name:'Echo Shard',   icon:'⧉', rar:2, max:2, desc:'Each fling also fires a ghost shard' },
  { id:'pierce',    name:'Phase Edge',   icon:'✧', rar:3, max:1, desc:'Slice through Warden shields and Spikers' },
  { id:'nuke',      name:'Singularity',  icon:'✴', rar:3, max:1, desc:'Every 10-chain detonates the whole screen' },
];

const META = [
  { id:'hull',   name:'Hull Plating',   icon:'♥', desc:'+1 starting heart',              costs:[250, 700] },
  { id:'cap',    name:'Deep Capacitor', icon:'⚡', desc:'+1 starting fling charge',       costs:[180, 500] },
  { id:'focus',  name:'Focus Lens',     icon:'⧗', desc:'+20% slow-motion focus',         costs:[80, 180, 360] },
  { id:'magnet', name:'Magnet Coil',    icon:'⊕', desc:'Bigger shard pickup radius',     costs:[60, 150, 300] },
  { id:'greed',  name:'Shard Greed',    icon:'◈', desc:'+15% shards from every run',     costs:[120, 280, 550] },
  { id:'head',   name:'Head Start',     icon:'★', desc:'Pick a free power before wave 1', costs:[350] },
];

const SKINS = [
  { id:'cyan',  name:'Neon',   col:'#27f3ff', col2:'#c6ffff', cost:0 },
  { id:'ember', name:'Ember',  col:'#ff7a2e', col2:'#ffe08a', cost:300 },
  { id:'toxic', name:'Toxic',  col:'#9dff3c', col2:'#eeffc0', cost:600 },
  { id:'royal', name:'Royal',  col:'#b46bff', col2:'#f0dcff', cost:1000 },
  { id:'rose',  name:'Rose',   col:'#ff4fa7', col2:'#ffd4ec', cost:1600 },
  { id:'aurum', name:'Aurum',  col:'#ffd23c', col2:'#fff7cc', cost:2600 },
  { id:'prism', name:'Prism',  col:'prism',   col2:'#ffffff', cost:4200 },
];

const MODS = [
  { id:'glass', name:'GLASS CORE', desc:'1 heart only. Score x2.', score:2 },
  { id:'keg',   name:'POWDER KEG', desc:'Bombers everywhere. Blasts are huge.', score:1.2 },
  { id:'hyper', name:'HYPERDRIVE', desc:'Everything is 30% faster. Score x1.5.', score:1.5 },
  { id:'titan', name:'TITAN CORE', desc:'Giant core, one less charge.', score:1.2 },
  { id:'swarm', name:'THE SWARM',  desc:'Double enemies, half health.', score:1.3 },
  { id:'blitz', name:'NO TIME',    desc:'Barely any slow-mo. Score x1.6.', score:1.6 },
];

// missions: sum = accumulates across runs, max = best single value
const MT = [
  { id:'chain', ev:'chain', kind:'max', vals:[4,6,8,10,13,16,20], txt:n => `Chain ${n} kills without slowing down` },
  { id:'wave',  ev:'wave',  kind:'max', vals:[4,6,8,10,12,15,20,25], txt:n => `Reach wave ${n}` },
  { id:'kills', ev:'kill',  kind:'sum', vals:[60,150,300,600,1200], txt:n => `Destroy ${n} enemies` },
  { id:'bomb',  ev:'bomb',  kind:'sum', vals:[10,25,50,100], txt:n => `Destroy ${n} enemies with explosions` },
  { id:'back',  ev:'back',  kind:'sum', vals:[5,12,25,50], txt:n => `Hit ${n} Wardens from behind` },
  { id:'parry', ev:'parry', kind:'sum', vals:[10,25,50,100], txt:n => `Shatter ${n} enemy bolts` },
  { id:'mult',  ev:'mult',  kind:'max', vals:[2,2.5,3,4,5], txt:n => `Reach a x${n} multiplier` },
  { id:'boss',  ev:'boss',  kind:'sum', vals:[1,2,4,8], txt:n => `Defeat ${n} boss${n > 1 ? 'es' : ''}` },
  { id:'score', ev:'score', kind:'max', vals:[10000,25000,60000,120000,250000,500000], txt:n => `Score ${fmt(n)} in one run` },
  { id:'bank',  ev:'bank',  kind:'sum', vals:[10,30,60,120], txt:n => `Land ${n} bank shots (kill after a wall bounce)` },
  { id:'shard', ev:'shard', kind:'sum', vals:[100,300,700,1500], txt:n => `Collect ${n} shards` },
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'chainfling_save_v1';
function defSave(){
  return {
    v:1, shards:0, best:0, bestWave:0, bestChain:0, xp:0, level:1, runs:0,
    meta:{ hull:0, cap:0, focus:0, magnet:0, greed:0, head:0 },
    skins:['cyan'], skin:'cyan',
    missions:[], mTier:{}, missionsDone:0, mNew:false,
    stats:{ kills:0, bosses:0, flings:0 },
    seen:{}, tut:false,
    opt:{ sfx:true, music:true, shake:true, aim:'pull', quality:'auto' },
    daily:{ key:'', best:0, bonus:false },
  };
}
let save = defSave();
function mergeInto(base, src){
  for(const k in src){
    if(!(k in base)) { base[k] = src[k]; continue; }
    const b = base[k], s = src[k];
    if(b && typeof b === 'object' && !Array.isArray(b) && s && typeof s === 'object' && !Array.isArray(s)) mergeInto(b, s);
    else if(s !== undefined && s !== null && typeof s === typeof b) base[k] = s;
  }
  return base;
}
function loadSave(){
  let raw = null;
  try{ const d = SDK.data(); if(d) raw = d.getItem(SAVE_KEY); }catch(e){}
  if(!raw){ try{ raw = localStorage.getItem(SAVE_KEY); }catch(e){} }
  if(raw){ try{ save = mergeInto(defSave(), JSON.parse(raw)); }catch(e){ save = defSave(); } }
}
let _saveT = 0;
function writeSave(){
  const s = JSON.stringify(save);
  try{ const d = SDK.data(); if(d) d.setItem(SAVE_KEY, s); }catch(e){}
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
function persist(){ clearTimeout(_saveT); _saveT = setTimeout(writeSave, 200); }

function xpNeed(lv){ return 400 + lv * 250; }
