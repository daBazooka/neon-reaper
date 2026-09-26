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
function shade(hex, f){ const n = parseInt(hex.slice(1), 16); const c = v => clamp(Math.round(v * f), 0, 255); return `rgb(${c(n >> 16 & 255)},${c(n >> 8 & 255)},${c(n & 255)})`; }
const M_PER_UNIT = 1 / 40;                           // display: blade length in meters

/* ---------------- blade tiers ---------------- */
const TIERS = [
  { n:'DAGGER',       L:0 },
  { n:'SHORTSWORD',   L:95 },
  { n:'LONGSWORD',    L:140 },
  { n:'GREATSWORD',   L:205 },
  { n:'CLAYMORE',     L:290 },
  { n:'COLOSSUS',     L:400 },
  { n:'TITAN BLADE',  L:560 },
  { n:'SKYCUTTER',    L:780 },
  { n:'WORLDCLEAVER', L:1080 },
  { n:'STARSPLITTER', L:1500 },
];
const tierOf = L => { let i = 0; for(let k = 0; k < TIERS.length; k++) if(L >= TIERS[k].L) i = k; return i; };

/* ---------------- enemies (original shapes) ----------------
   sides: polygon sides, r: radius as a fraction of "scale", hard: min blade speed to cut */
const ET = {
  blob:    { sides:4,  r:1,    spd:95,  col:'#ff5a7a', hard:180,  at:0,   w:4,   name:'Blob' },
  dart:    { sides:3,  r:.8,   spd:175, col:'#ffb020', hard:180,  at:20,  w:2,   name:'Dart', dash:true },
  hexa:    { sides:6,  r:1.9,  spd:62,  col:'#9b6bff', hard:180,  at:40,  w:1.4, name:'Hexa' },
  shooter: { sides:5,  r:1.1,  spd:80,  col:'#3ddc84', hard:180,  at:60,  w:1.1, name:'Spitter', shoot:true,
             tip:'<em>SPITTER</em> — fires orbs. Swing through them to <b>deflect</b> them back!' },
  armor:   { sides:8,  r:1.25, spd:70,  col:'#9aa7bd', hard:820,  at:90,  w:1,   name:'Ironclad', metal:true,
             tip:'<em>IRONCLAD</em> — only the fast <b>tip</b> of a hard swing cuts steel.' },
  bomber:  { sides:10, r:1.05, spd:85,  col:'#ff7a2e', hard:180,  at:120, w:1,   name:'Boomer', boom:true,
             tip:'<em>BOOMER</em> — explodes when cut, shredding everything nearby.' },
};

/* ---------------- perks (picked at every new blade tier) ---------------- */
const RAR = [ { n:'COMMON', c:'#a9c1ff', w:10 }, { n:'RARE', c:'#3ff0ff', w:5.5 }, { n:'EPIC', c:'#ff5ad9', w:2.4 } ];
const PERKS = [
  { id:'edge',   name:'Keen Edge',      icon:'◢', rar:0, max:3, desc:'Cut at lower swing speed' },
  { id:'swift',  name:'Swift Feet',     icon:'➤', rar:0, max:3, desc:'+12% move speed' },
  { id:'magnet', name:'Gem Magnet',     icon:'⊕', rar:0, max:3, desc:'Pull gems from much further' },
  { id:'grow',   name:'Hungry Steel',   icon:'▲', rar:0, max:3, desc:'+25% blade growth from gems' },
  { id:'dash',   name:'Quick Dash',     icon:'»', rar:0, max:3, desc:'Dash recharges 30% faster' },
  { id:'heart',  name:'Second Wind',    icon:'♥', rar:1, max:3, desc:'+1 max heart and heal', },
  { id:'spin',   name:'Heavy Pommel',   icon:'◉', rar:1, max:3, desc:'+15% blade spin speed' },
  { id:'shards', name:'Shatter',        icon:'✦', rar:1, max:3, desc:'Killing cuts spray blade shards' },
  { id:'parry',  name:'Parry Wave',     icon:'≋', rar:1, max:2, desc:'Deflected orbs home in on enemies' },
  { id:'twin',   name:'Twin Blade',     icon:'⇆', rar:2, max:1, desc:'A second blade on the other end!' },
  { id:'fire',   name:'Ember Edge',     icon:'♨', rar:2, max:2, desc:'Cut pieces burst into flames' },
  { id:'vamp',   name:'Bloodsteel',     icon:'♡', rar:2, max:1, desc:'Every 40 slices restores a heart' },
];

/* ---------------- meta ---------------- */
const META = [
  { id:'start',  name:'Forged Start',   icon:'▲', desc:'Begin every run with a longer blade', costs:[80, 200, 420] },
  { id:'heart',  name:'Iron Heart',     icon:'♥', desc:'+1 starting heart',                  costs:[150, 450] },
  { id:'magnet', name:'Lodestone',      icon:'⊕', desc:'Bigger gem pickup radius',            costs:[60, 160, 320] },
  { id:'dash',   name:'Windstep',       icon:'»', desc:'Dash recharges faster',               costs:[90, 240] },
  { id:'gold',   name:'Gilded Hilt',    icon:'◆', desc:'+15% gold from every run',            costs:[120, 300, 600] },
];
const SKINS = [
  { id:'steel',   name:'Steel',    c1:'#e9eef7', c2:'#9aa7bd', glow:'#cfe3ff', cost:0 },
  { id:'ember',   name:'Ember',    c1:'#ffd08a', c2:'#ff6a1a', glow:'#ff9a3c', cost:250 },
  { id:'frost',   name:'Frost',    c1:'#e6fbff', c2:'#5fd0ff', glow:'#8ff0ff', cost:450 },
  { id:'venom',   name:'Venom',    c1:'#e8ffb0', c2:'#5fd13b', glow:'#b6ff3c', cost:700 },
  { id:'void',    name:'Void',     c1:'#d9c8ff', c2:'#6b3ad9', glow:'#b18cff', cost:1000 },
  { id:'royal',   name:'Royal',    c1:'#fff4c0', c2:'#e0a820', glow:'#ffd23c', cost:1500 },
  { id:'prism',   name:'Prism',    c1:'#ffffff', c2:'prism',   glow:'#ffffff', cost:2500 },
];
const MODS = [
  { id:'giants', name:'GIANTS',      desc:'Everything is huge. Gold x1.5.' },
  { id:'swarm',  name:'THE SWARM',   desc:'Double the enemies, half the size.' },
  { id:'glass',  name:'ONE HEART',   desc:'A single heart. Gold x2.' },
  { id:'rush',   name:'RUSH',        desc:'Everything moves 30% faster. Gold x1.5.' },
  { id:'steel',  name:'STEEL STORM', desc:'Ironclads everywhere.' },
];
const MT = [
  { id:'len',    ev:'len',    kind:'max', vals:[3,5,8,12,18,25,35], txt:n => `Grow your blade to ${n} m` },
  { id:'slice',  ev:'slice',  kind:'sum', vals:[100,300,700,1500,3000], txt:n => `Slice ${n} times` },
  { id:'perfect',ev:'perfect',kind:'sum', vals:[5,15,40,100], txt:n => `Cut ${n} perfect halves` },
  { id:'combo',  ev:'combo',  kind:'max', vals:[10,20,35,50,80], txt:n => `Reach a ${n}x slice combo` },
  { id:'parry',  ev:'parry',  kind:'sum', vals:[10,30,80], txt:n => `Deflect ${n} orbs` },
  { id:'boss',   ev:'boss',   kind:'sum', vals:[1,3,6], txt:n => `Shatter ${n} Monolith${n > 1 ? 's' : ''}` },
  { id:'time',   ev:'time',   kind:'max', vals:[120,240,420,600], txt:n => `Survive ${Math.round(n / 60)} minutes` },
  { id:'steel',  ev:'steel',  kind:'sum', vals:[10,30,70], txt:n => `Cut ${n} Ironclads` },
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'growblade_save_v1';
function defSave(){
  return {
    v:1, gold:0, best:0, bestLen:0, xp:0, level:1, runs:0,
    meta:{ start:0, heart:0, magnet:0, dash:0, gold:0 },
    skins:['steel'], skin:'steel',
    missions:[], mTier:{}, missionsDone:0, mNew:false,
    stats:{ slices:0, perfect:0 },
    seen:{}, tut:false,
    opt:{ sfx:true, music:true, shake:true, quality:'auto' },
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
