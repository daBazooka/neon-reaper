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
  { id:'rustler',  name:'Rustler',     kind:'muscle', body:'#d9572b', stripe:'#f6e7c8', roof:'#b8431f', spd:560, acc:420, grip:4.2, hp:125, fire:1,   stars:0, cost:0,    desc:'An old muscle car. Balanced and loud.' },
  { id:'hopper',   name:'Dune Hopper', kind:'buggy',  body:'#f2b134', stripe:'#3a2418', roof:'#3a2418', spd:590, acc:480, grip:4.8, hp:105,  fire:.9,  stars:6, cost:300,  desc:'A light buggy. Turns on a dime.' },
  { id:'longhorn', name:'Longhorn',    kind:'pickup', body:'#b3262d', stripe:'#f4ecdc', roof:'#8e1d23', spd:530, acc:380, grip:4.0, hp:175, fire:1,   stars:14, cost:600,  desc:'A heavy pickup. Takes a beating.' },
  { id:'mirage',   name:'Mirage',      kind:'wagon',   body:'#e9dfb8', stripe:'#8a5a2b', roof:'#c9bd92', spd:545, acc:400, grip:3.9, hp:140, fire:1.35, stars:24, cost:900, desc:'A wood-panel wagon. Its fire lasts longer.' },
  { id:'coyote',   name:'Coyote GT',   kind:'coupe',   body:'#2a9d8f', stripe:'#f6f1e4', roof:'#1f7a6f', spd:620, acc:460, grip:4.3, hp:120,  fire:1,   stars:36, cost:1300, desc:'A sports coupe. Very fast.' },
  { id:'sandstorm',name:'Sandstorm',   kind:'rally',   body:'#f4f1ea', stripe:'#2f6db5', roof:'#dcd6ca', spd:590, acc:470, grip:3.5, hp:130, fire:1.15, stars:50, cost:1900, desc:'A rally hatch. Drifts forever.' },
  { id:'diablo',   name:'El Diablo',   kind:'hotrod',  body:'#1d1a1c', stripe:'#ff6a1a', roof:'#2c2729', spd:640, acc:520, grip:4.1, hp:135, fire:1.3, stars:70, cost:3000, desc:'A hot rod. The legend of the desert.' },
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
const costs = (base, n, k) => Array.from({ length:n }, (_, i) => Math.round(base * Math.pow(k || 1.45, i) / 10) * 10);
const META = [
  { id:'engine', name:'Engine Tune',   icon:'⚙', desc:'+2.5% top speed per level',          costs:costs(120, 10) },
  { id:'armor',  name:'Roll Cage',     icon:'▣', desc:'+10 armor per level',                costs:costs(100, 10) },
  { id:'fuel',   name:'Fuel Mix',      icon:'♨', desc:'Fire burns 8% longer per level',      costs:costs(90, 10) },
  { id:'nitro',  name:'Bigger Bottle', icon:'⚡', desc:'Start with +20% nitro per level',     costs:costs(150, 5, 1.6) },
  { id:'cash',   name:'Fence Deals',   icon:'$', desc:'+8% cash per level',                 costs:costs(110, 10) },
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

/* ---------------- bounty career ----------------
   50 short bounties in 5 regions. Each has one goal; finishing it fast (or
   torching more chasers while you survive) earns up to 3 stars. Stars open
   new regions and cars. */
const REGIONS = [
  { id:'flats',  name:'DUSTY FLATS',   sand:'#e2b47a', tod:.15, need:0 },
  { id:'canyon', name:'RED CANYON',    sand:'#d99468', tod:.36, need:14 },
  { id:'salt',   name:'SALT LAKE',     sand:'#eee5d3', tod:.12, need:34 },
  { id:'night',  name:'MIDNIGHT MESA', sand:'#caa276', tod:.64, need:56 },
  { id:'ash',    name:'ASH VALLEY',    sand:'#a59383', tod:.44, need:80 },
];
const BOUNTY_SLOTS = ['kills', 'drift', 'chain', 'survive', 'kills', 'near', 'chain', 'survive', 'kills', 'boss'];
const BOUNTIES = [];
REGIONS.forEach((rg, r) => BOUNTY_SLOTS.forEach((type, k) => {
  const i = r * 10 + k, step = i / 49;
  const b = { i, r, k, type, heat:Math.min(6, 1 + r + (k >= 6 ? 1 : 0)), limit:0, n:0, s2:0, s3:0 };
  if(type === 'kills'){ b.n = Math.round(4 + step * 22 + (k === 8 ? 6 : 0)); b.t3 = Math.round(6 + b.n * 1.15); b.t2 = Math.round(12 + b.n * 1.8); b.limit = Math.round(35 + b.n * 4); }
  if(type === 'drift'){ b.n = Math.round(60 + step * 160); b.t3 = Math.round(4 + b.n / 4.2); b.t2 = Math.round(8 + b.n / 3.2); b.limit = Math.round(30 + b.n / 1.8); }
  if(type === 'chain'){ b.n = Math.round(3 + step * 7); b.t3 = Math.round(16 + b.n * 2); b.t2 = Math.round(28 + b.n * 3.5); b.limit = Math.round(60 + b.n * 6); }
  if(type === 'near'){ b.n = Math.round(4 + step * 12); b.t3 = Math.round(8 + b.n * 2); b.t2 = Math.round(14 + b.n * 3.2); b.limit = Math.round(40 + b.n * 5); }
  if(type === 'survive'){ b.heat = Math.max(1, b.heat - 1); b.n = Math.round(40 + step * 50); b.limit = b.n; b.s2 = Math.round(4 + step * 12); b.s3 = Math.round(8 + step * 22); }
  if(type === 'boss'){ b.n = 1; b.t3 = 25; b.t2 = 45; b.limit = Math.round(120 + r * 20); }
  b.cash = Math.round(70 + i * 12);
  BOUNTIES.push(b);
}));
function bountyText(b){
  return ({ kills:`Torch ${b.n} chasers`, drift:`Drift ${fmt(b.n)} m`, chain:`Burn ${b.n} cars in one chain`, survive:`Survive ${b.n} seconds`, near:`Make ${b.n} near misses`, boss:'Wreck the Juggernaut' })[b.type];
}
function starText(b){
  if(b.type === 'survive') return [`Survive`, `Torch ${b.s2}`, `Torch ${b.s3}`];
  return [`Finish in ${b.limit}s`, `Under ${b.t2}s`, `Under ${b.t3}s`];
}
const totalStars = () => (save.career.stars || []).reduce((a, b) => a + (b || 0), 0);
const regionOpen = r => totalStars() >= REGIONS[r].need;
const bountyOpen = i => i === 0 || (save.career.stars[i - 1] || 0) > 0 || (i % 10 === 0 && regionOpen(i / 10) && (save.career.stars[i - 1] || 0) > 0);
function nextBounty(){ for(let i = 0; i < BOUNTIES.length; i++) if(!(save.career.stars[i] > 0)) return regionOpen(BOUNTIES[i].r) ? i : -1; return -1; }

/* ---------------- daily login + garage stash (reasons to come back) ---------------- */
const LOGIN = [100, 150, 200, 300, 400, 500, 1000];
const STASH_CAP_H = 8;
const stashRate = () => 30 + totalStars() * 3;           // $ per hour, fills while you're away
function stashValue(){ const h = Math.min(STASH_CAP_H, Math.max(0, (Date.now() - (save.stashT || Date.now())) / 36e5)); return Math.floor(h * stashRate()); }
function msToNextDay(){ const d = new Date(), n = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1); return n - d.getTime(); }
const hhmm = ms => { const m = Math.max(0, Math.ceil(ms / 6e4)); return Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm'; };

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
    career:{ stars:[], best:[] }, login:{ key:'', day:0 }, stashT:0, first:true,
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
