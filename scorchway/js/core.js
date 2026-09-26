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
function hash2(i, j, s){ let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s || 1, 2246822519); h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; }
function todayKey(){ const d = new Date(); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); }
let grng = Math.random;
const gr = (a, b) => a + grng() * (b - a);
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
function mixHex(a, b, t){
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const c = s => Math.round(lerp(x >> s & 255, y >> s & 255, t));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}
const KMH = .36;            // world units per second -> displayed km/h

/* ---------------- cars ----------------
   spd: top speed, acc: acceleration, grip: tire grip, hp: armor, fire: burn time multiplier */
const CARS = [
  { id:'rustler',  name:'Rustler',     kind:'muscle', body:'#d9572b', stripe:'#f6e7c8', roof:'#b8431f', spd:560, acc:420, grip:4.2, hp:125, fire:1,   cost:0,    desc:'An old muscle car. Balanced and loud.' },
  { id:'hopper',   name:'Dune Hopper', kind:'buggy',  body:'#f2b134', stripe:'#3a2418', roof:'#3a2418', spd:590, acc:480, grip:4.8, hp:105,  fire:.9,  cost:300,  desc:'A light buggy. Turns on a dime.' },
  { id:'longhorn', name:'Longhorn',    kind:'pickup', body:'#b3262d', stripe:'#f4ecdc', roof:'#8e1d23', spd:530, acc:380, grip:4.0, hp:175, fire:1,   cost:600,  desc:'A heavy pickup. Takes a beating.' },
  { id:'mirage',   name:'Mirage',      kind:'wagon',   body:'#e9dfb8', stripe:'#8a5a2b', roof:'#c9bd92', spd:545, acc:400, grip:3.9, hp:140, fire:1.35, cost:900, desc:'A wood-panel wagon. Its fire lasts longer.' },
  { id:'coyote',   name:'Coyote GT',   kind:'coupe',   body:'#2a9d8f', stripe:'#f6f1e4', roof:'#1f7a6f', spd:620, acc:460, grip:4.3, hp:120,  fire:1,   cost:1300, desc:'A sports coupe. Very fast.' },
  { id:'sandstorm',name:'Sandstorm',   kind:'rally',   body:'#f4f1ea', stripe:'#2f6db5', roof:'#dcd6ca', spd:590, acc:470, grip:3.5, hp:130, fire:1.15, cost:1900, desc:'A rally hatch. Drifts forever.' },
  { id:'diablo',   name:'El Diablo',   kind:'hotrod',  body:'#1d1a1c', stripe:'#ff6a1a', roof:'#2c2729', spd:640, acc:520, grip:4.1, hp:135, fire:1.3, cost:3000, desc:'A hot rod. The legend of the desert.' },
];

/* ---------------- pursuers ---------------- */
const ET = {
  buggy:  { name:'Bandit Buggy', spd:520, acc:520, grip:6,  hp:1,   burn:.12, len:40, wid:23, col:'#c9a227', dmg:6, mass:.7, at:1, w:4,   cash:6 },
  cop:    { name:'Sheriff',      spd:560, acc:480, grip:6.5,hp:1,   burn:.18, len:52, wid:26, col:'#1b1b1f', dmg:9, mass:1,  at:2, w:3,   cash:10, siren:true },
  bike:   { name:'Outrider',     spd:610, acc:600, grip:7,  hp:1,   burn:.08, len:30, wid:14, col:'#6b4f9e', dmg:4,  mass:.45,at:3, w:2,   cash:8 },
  truck:  { name:'Rig',          spd:470, acc:300, grip:5,  hp:2,   burn:.5,  len:70, wid:32, col:'#5e7d8a', dmg:16, mass:2.2,at:4, w:1.4, cash:18,
            tip:'<b>RIGS</b> are tough. Keep them in your fire for longer.' },
  heli:   { name:'Chopper',      spd:360, acc:260, grip:3,  hp:99,  burn:99,  len:60, wid:60, col:'#2d3e2f', dmg:0,  mass:0,  at:5, w:.6,  cash:40, air:true,
            tip:'<b>CHOPPERS</b> drop bombs. Lead the bombs onto your chasers!' },
};
const HEAT_T = 38;          // seconds per heat level

/* ---------------- pit stop mods (picked at each new heat level) ---------------- */
const RAR = [ { n:'COMMON', c:'#2a9d8f', w:10 }, { n:'RARE', c:'#e2582b', w:5 }, { n:'LEGENDARY', c:'#b8860b', w:2.2 } ];
const PERKS = [
  { id:'flame',  name:'Wide Flames',     icon:'♨', rar:0, max:3, desc:'Fire trail is 25% wider' },
  { id:'burn',   name:'Slow Burn',       icon:'◷', rar:0, max:3, desc:'Fire burns 30% longer' },
  { id:'armor',  name:'Steel Plating',   icon:'▣', rar:0, max:3, desc:'+25 max armor and repair fully' },
  { id:'nitro',  name:'Nitro Injector',  icon:'⚡', rar:0, max:3, desc:'Nitro charges 30% faster' },
  { id:'engine', name:'Big Block V8',    icon:'⚙', rar:0, max:3, desc:'+7% top speed' },
  { id:'grip',   name:'Racing Slicks',   icon:'◎', rar:0, max:2, desc:'Sharper steering' },
  { id:'spike',  name:'Spiked Bumper',   icon:'✷', rar:1, max:2, desc:'Ramming wrecks small cars' },
  { id:'magnet', name:'Cash Magnet',     icon:'$', rar:1, max:2, desc:'Pull cash and pickups from far away' },
  { id:'napalm', name:'Napalm Mix',      icon:'☄', rar:1, max:2, desc:'Burning cars explode bigger' },
  { id:'twin',   name:'Twin Exhaust',    icon:'⇉', rar:2, max:1, desc:'Nitro also leaves a trail of fire' },
  { id:'mines',  name:'Tumble Mines',    icon:'✺', rar:2, max:1, desc:'Every 6 s a mine drops behind you' },
  { id:'phoenix',name:'Phoenix Engine',  icon:'✦', rar:2, max:1, desc:'Survive one wreck with half armor' },
];

/* ---------------- meta ---------------- */
const META = [
  { id:'engine', name:'Engine Tune',   icon:'⚙', desc:'+4% top speed',                    costs:[120, 300, 600] },
  { id:'armor',  name:'Roll Cage',     icon:'▣', desc:'+15 armor',                        costs:[100, 260, 520] },
  { id:'fuel',   name:'Fuel Mix',      icon:'♨', desc:'Fire burns 15% longer',            costs:[90, 240, 480] },
  { id:'nitro',  name:'Bigger Bottle', icon:'⚡', desc:'Start every run with 50% nitro',   costs:[150] },
  { id:'cash',   name:'Fence Deals',   icon:'$', desc:'+15% cash from every run',         costs:[110, 280, 560] },
];
const MODS = [
  { id:'night',   name:'MIDNIGHT RUN',  desc:'It is always night. Cash x1.5.' },
  { id:'swarm',   name:'BANDIT RALLY',  desc:'Twice the buggies.' },
  { id:'glass',   name:'PAPER CAR',     desc:'Armor is halved. Cash x2.' },
  { id:'inferno', name:'INFERNO',       desc:'Fire burns twice as long.' },
  { id:'heat',    name:'MOST WANTED',   desc:'Start at heat 3. Cash x1.5.' },
];
const MT = [
  { id:'burn',   ev:'kill',   kind:'sum', vals:[25,80,200,500,1200], txt:n => `Torch ${n} pursuers` },
  { id:'heat',   ev:'heat',   kind:'max', vals:[3,4,5,6,8],          txt:n => `Reach heat level ${n}` },
  { id:'time',   ev:'time',   kind:'max', vals:[90,150,240,360],     txt:n => `Survive ${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}` },
  { id:'chain',  ev:'chain',  kind:'max', vals:[3,5,8,12],           txt:n => `Burn ${n} cars in one chain` },
  { id:'drift',  ev:'drift',  kind:'sum', vals:[2000,6000,15000,40000], txt:n => `Drift ${fmt(n)} m` },
  { id:'near',   ev:'near',   kind:'sum', vals:[15,50,120,300],      txt:n => `Make ${n} near misses` },
  { id:'boss',   ev:'boss',   kind:'sum', vals:[1,3,6],              txt:n => `Wreck ${n} Juggernaut${n > 1 ? 's' : ''}` },
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'scorchway_save_v1';
function defSave(){
  return {
    v:1, cash:0, best:0, bestTime:0, bestHeat:0, xp:0, level:1, runs:0,
    meta:{ engine:0, armor:0, fuel:0, nitro:0, cash:0 },
    cars:['rustler'], car:'rustler',
    missions:[], mTier:{}, missionsDone:0, mNew:false,
    stats:{ kills:0, drift:0 },
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
