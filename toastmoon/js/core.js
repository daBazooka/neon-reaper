'use strict';
/* =====================================================================
   TOAST TO THE MOON: data, upgrades, breads, missions, save.
   Pop a slice of toast out of the toaster, bounce it off balloons and
   birds, buy upgrades, go higher every time. Goal: the Moon.
   ===================================================================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
const fmt = n => Math.floor(n).toLocaleString('en-US');
const PX = 10;                       // world units per meter
const WORLD_W = 540;                 // the sky column wraps left/right
const MOON = 8000;                   // meters

/* ---------------- altitude zones ---------------- */
const ZONES = [
  { at:0,    name:'BACK GARDEN',   sky:['#8fd8ff', '#d8f3ff'] },
  { at:60,   name:'ROOFTOPS',      sky:['#7fcfff', '#cdeeff'] },
  { at:250,  name:'CLOUD TOWN',    sky:['#6cc0ff', '#bfe6ff'] },
  { at:700,  name:'SKY HIGH',      sky:['#4a9df0', '#9fd2ff'] },
  { at:1800, name:'STRATOSPHERE',  sky:['#2b5fc0', '#5e9be6'] },
  { at:4000, name:'SPACE',         sky:['#0b0f2e', '#1d2a66'] },
  { at:MOON, name:'THE MOON',      sky:['#05061a', '#141a48'] },
];
const zoneAt = m => { let z = 0; for(let i = 0; i < ZONES.length; i++) if(m >= ZONES[i].at) z = i; return z; };

/* ---------------- permanent upgrades ---------------- */
const UPS = [
  { id:'toaster', icon:'🔥', name:'Toaster Power', desc:'Launch faster',                 base:20, mul:1.32, max:30 },
  { id:'jam',     icon:'🍓', name:'Jam Jets',      desc:'More rocket fuel (hold to fly)', base:30, mul:1.34, max:25 },
  { id:'bounce',  icon:'🎈', name:'Springy Crust', desc:'Bigger boosts from balloons and birds', base:40, mul:1.36, max:25 },
  { id:'butter',  icon:'🧈', name:'Butter Glide',  desc:'Steer better and fall slower',   base:35, mul:1.38, max:20 },
  { id:'crumbs',  icon:'🪙', name:'Lucky Crumbs',  desc:'+15% coins',                     base:50, mul:1.4,  max:20 },
  { id:'magnet',  icon:'🧲', name:'Fork Magnet',   desc:'Pull coins from farther away',   base:60, mul:1.45, max:10 },
];
const upCost = (u, lv) => Math.round(u.base * Math.pow(u.mul, lv) / 5) * 5;

/* ---------------- breads (collect, wear, small bonus) ---------------- */
const BREADS = [
  { id:'white',   name:'White Toast',   c1:'#f6d79b', c2:'#c9893f', price:0,     bonus:'',                            stat:{} },
  { id:'rye',     name:'Rye',           c1:'#c99a63', c2:'#7a4f2a', price:400,   bonus:'+5% launch',                  stat:{ launch:.05 } },
  { id:'bagel',   name:'Bagel',         c1:'#e8b46a', c2:'#a8662a', price:1200,  bonus:'+10% boosts',                 stat:{ boost:.1 }, ring:true },
  { id:'waffle',  name:'Waffle',        c1:'#f2c46a', c2:'#b97b28', price:3000,  bonus:'+20% coins',                  stat:{ coins:.2 }, grid:true },
  { id:'croissant', name:'Croissant',   c1:'#f0be6e', c2:'#b4702c', price:7000,  bonus:'+1s jam fuel',                stat:{ fuel:1 } },
  { id:'pancake', name:'Pancake Stack', c1:'#f5cf8c', c2:'#c48a3e', price:15000, bonus:'+10% launch, +10% boosts',    stat:{ launch:.1, boost:.1 } },
  { id:'garlic',  name:'Garlic Bread',  c1:'#f3dc9a', c2:'#6fa84a', price:30000, bonus:'+30% coins, +10% boosts',     stat:{ coins:.3, boost:.1 } },
  { id:'golden',  name:'Golden Toast',  c1:'#ffe27a', c2:'#d49a12', price:60000, bonus:'+15% everything',             stat:{ launch:.15, boost:.15, coins:.15, fuel:1 } },
];

/* ---------------- missions ---------------- */
const MISSION_POOL = [
  { id:'alt',     txt:n => `Reach ${fmt(n)} m`,                n:[100, 300, 800, 2000, 4500], peak:true },
  { id:'balloons',txt:n => `Bounce off ${n} balloons`,         n:[20, 80, 250, 700] },
  { id:'birds',   txt:n => `Bounce off ${n} birds`,            n:[10, 40, 120, 350] },
  { id:'coins',   txt:n => `Collect ${fmt(n)} coins`,          n:[300, 1500, 6000, 20000] },
  { id:'perfect', txt:n => `Get ${n} PERFECT launches`,        n:[3, 10, 30] },
  { id:'runs',    txt:n => `Launch ${n} times`,                n:[10, 30, 80] },
  { id:'chain',   txt:n => `Bounce ${n} times without falling`, n:[8, 15, 25, 40], peak:true },
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'toastmoon_save_v1';
function defSave(){
  return {
    v:1, coins:0, best:0, runs:0, moon:0,
    up:{ toaster:0, jam:0, bounce:0, butter:0, crumbs:0, magnet:0 },
    bread:'white', own:{ white:1 },
    stats:{ balloons:0, birds:0, coins:0, perfect:0, runs:0 },
    missions:[], tut:0, login:{ key:'', day:0 }, bakeT:0,
    opt:{ sfx:true, music:true },
  };
}
function mergeInto(base, src){
  if(!src || typeof src !== 'object') return base;
  for(const k in src){
    const b = base[k], v = src[k];
    if(b && typeof b === 'object' && !Array.isArray(b) && v && typeof v === 'object' && !Array.isArray(v)) mergeInto(b, v);
    else if(b === undefined || typeof b === typeof v) base[k] = v;
  }
  return base;
}
let save = defSave();
function loadSave(){
  let raw = null; const d = SDK.data();
  try{ raw = d ? d.getItem(SAVE_KEY) : null; }catch(e){}
  if(!raw){ try{ raw = localStorage.getItem(SAVE_KEY); }catch(e){} }
  try{ save = mergeInto(defSave(), JSON.parse(raw || '{}')); }catch(e){ save = defSave(); }
  fillMissions();
}
function persist(){
  const s = JSON.stringify(save), d = SDK.data();
  try{ if(d) d.setItem(SAVE_KEY, s); }catch(e){}
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
function fillMissions(){
  save.missions = save.missions.filter(m => !m.claimed);
  const have = new Set(save.missions.map(m => m.id));
  while(save.missions.length < 3){
    const p = pick(MISSION_POOL.filter(m => !have.has(m.id))); have.add(p.id);
    const tier = Math.min(p.n.length - 1, Math.floor(save.runs / 12));
    save.missions.push({ id:p.id, n:p.n[tier], at:p.peak ? 0 : (save.stats[p.id] || 0), prog:0, done:false, claimed:false, rw:Math.round(80 * Math.pow(2.2, tier)) });
  }
}
function missionTick(peaks){
  for(const m of save.missions){
    if(m.done) continue;
    const p = MISSION_POOL.find(x => x.id === m.id);
    m.prog = p.peak ? Math.max(m.prog, peaks[m.id] || 0) : (save.stats[m.id] || 0) - m.at;
    if(m.prog >= m.n){ m.prog = m.n; m.done = true; }
  }
}
/* ---------------- daily reward + bakery (reasons to come back) ---------------- */
const LOGIN = [100, 200, 300, 500, 800, 1200, 3000];
const todayKey = () => new Date().toISOString().slice(0, 10);
const BAKE_CAP_H = 8;
const bakeRate = () => Math.round(20 + Math.pow(Math.max(0, save.best), .82) * .9);   // coins per hour
function bakeValue(){ const h = Math.min(BAKE_CAP_H, Math.max(0, (Date.now() - (save.bakeT || Date.now())) / 36e5)); return Math.floor(h * bakeRate()); }
const hhmm = ms => { const m = Math.max(0, Math.ceil(ms / 6e4)); return Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm'; };
const breadDef = () => BREADS.find(b => b.id === save.bread) || BREADS[0];
const bstat = k => (breadDef().stat[k] || 0);
