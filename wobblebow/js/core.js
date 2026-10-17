'use strict';
/* =====================================================================
   WOBBLE BOW: data, levels, upgrades, hats, missions, save.
   A physics archery duel between wobbly ragdolls on stone pillars.
   Win by draining their health or by knocking them off their pillar.
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
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const GRAV = 1100;

/* ---------------- worlds: 6 x 10 levels, level 10 of each is a boss ---------------- */
const WORLDS = [
  { name:'GREEN HILLS',   sky:['#7ec8ff', '#d4f1ff'], hill:['#7cc46b', '#5aa857'], rock:'#9a8f86', cap:'#6cc45a', pit:'#3d8fd6', pitK:'water', sun:'#fff3b0' },
  { name:'DUSTY CANYON',  sky:['#ffb36b', '#ffe2b0'], hill:['#e09a5a', '#c47a44'], rock:'#c98a5a', cap:'#e8b46a', pit:'#7a3d22', pitK:'canyon', sun:'#fff0c0' },
  { name:'FROST PEAKS',   sky:['#9fd2ff', '#eef8ff'], hill:['#dceefa', '#b8d6ec'], rock:'#8fa6bd', cap:'#ffffff', pit:'#4fa3d8', pitK:'ice', sun:'#ffffff' },
  { name:'MUSHROOM WOODS',sky:['#b48cff', '#f0d4ff'], hill:['#7d5cc4', '#5e44a0'], rock:'#8a6f9a', cap:'#ff6fae', pit:'#3a2a66', pitK:'swamp', sun:'#ffe6ff' },
  { name:'LAVA KEEP',     sky:['#5a1f2e', '#ff8a4a'], hill:['#4a2228', '#341820'], rock:'#5e4a4a', cap:'#8a6a5a', pit:'#ff5a1f', pitK:'lava', sun:'#ffd27a' },
  { name:'SKY CASTLE',    sky:['#ff9ec4', '#ffe9b8'], hill:['#ffffff', '#ffe6f0'], rock:'#d8c4a8', cap:'#ffd86a', pit:'#ffffff', pitK:'clouds', sun:'#fff8e0' },
];
const LEVELS = 60;

/* enemy archetypes: multipliers on the level's base stats */
const ETYPES = {
  basic:  { name:'ARCHER',  hp:1,   dmg:1,   rel:1,   sc:1,    shirt:'#e8504a', pants:'#5a4a7a', grip:0 },
  quick:  { name:'QUICK',   hp:.75, dmg:.6,  rel:.5,  sc:.9,   shirt:'#3ac0a0', pants:'#2a5a6a', grip:0 },
  heavy:  { name:'BRUTE',   hp:1.9, dmg:1.25,rel:1.3, sc:1.25, shirt:'#8a5a3a', pants:'#4a3a2a', grip:.45 },
  shield: { name:'GUARD',   hp:1.2, dmg:.9,  rel:1.1, sc:1,    shirt:'#4a7ad8', pants:'#3a3a5a', grip:.2, shield:true },
  bomber: { name:'BOMBER',  hp:1,   dmg:.8,  rel:1.4, sc:1,    shirt:'#2a2a2a', pants:'#5a5a5a', grip:0, bomb:true },
  medic:  { name:'MEDIC',   hp:1.1, dmg:.8,  rel:1,   sc:1,    shirt:'#f4f4f4', pants:'#4aa86a', grip:0, regen:.025 },
  giant:  { name:'GIANT',   hp:3.2,   dmg:1.5, rel:1.5, sc:1.7,  shirt:'#7a3ab0', pants:'#3a2a5a', grip:.7, boss:true },
  king:   { name:'KING',    hp:2.8, dmg:1.3, rel:1.1, sc:1.3,  shirt:'#d8a830', pants:'#7a2a3a', grip:.6, shield:true, helmet:true, boss:true },
};
const BOSSES = [
  [{ t:'giant' }],
  [{ t:'heavy', hp:1.1 }, { t:'quick', hp:1.2 }],
  [{ t:'king' }],
  [{ t:'giant', bomb:true }],
  [{ t:'medic', hp:.95 }, { t:'heavy', hp:.8 }],
  [{ t:'king', hp:1.1, bomb:true }],
];
const POOLS = [['basic', 'basic', 'quick'], ['basic', 'quick', 'heavy'], ['basic', 'heavy', 'shield'], ['quick', 'shield', 'bomber'], ['heavy', 'bomber', 'medic'], ['quick', 'shield', 'bomber', 'medic', 'heavy']];

/* Builds level i (0-based). Deterministic per level, so a replay is the same fight. */
function levelDef(i, portrait){
  const R = mulberry32(1000 + i * 7919), w = Math.floor(i / 10), k = i % 10, r = (a, b) => a + R() * (b - a);
  const boss = k === 9;
  let dist = 640 + Math.min(420, i * 8) + r(-50, 50);
  if(portrait) dist *= .78;
  const base = { hp:75 * Math.pow(1.05, i), dmg:8 * Math.pow(1.04, i), rel:Math.max(1.3, 2.3 - .016 * i), err:Math.max(.032, .09 - .001 * i) };
  let roster;
  if(boss) roster = BOSSES[w];
  else if(w >= 1 && k === 6) roster = [{ t:POOLS[w][Math.floor(R() * POOLS[w].length)], hp:.7 }, { t:'basic', hp:.7 }];
  else roster = [{ t:POOLS[w][Math.floor(R() * POOLS[w].length)] }];
  if(i === 0) roster = [{ t:'basic', hp:.6, dmg:.7 }];
  else if(i < 3) roster = [{ t:'basic', hp:.8, dmg:.8 }];
  const enemies = roster.map((e, j) => {
    const T = ETYPES[e.t];
    return { t:e.t, hp:Math.round(base.hp * T.hp * (e.hp || 1)), dmg:base.dmg * T.dmg * (e.dmg || 1), rel:base.rel * T.rel, err:base.err, bomb:!!(T.bomb || e.bomb),
      dx:dist + j * r(170, 230) * (portrait ? .8 : 1), dy:r(-170, 150), half:boss ? 66 : r(44, 60) };
  });
  if(enemies.length > 1) enemies[1].dy = Math.min(enemies[1].dy, enemies[0].dy - r(90, 140));
  const obst = [];
  if(w >= 1 && (k % 3 === 2 || (boss && w >= 3))) obst.push({ k:'wall', x:dist * r(.42, .58), y:r(-120, 40), w:34, h:r(150, 230), mv:0 });
  if(w >= 3 && k % 4 === 1) obst.push({ k:'cloud', x:dist * .5, y:r(-260, -140), w:150, h:46, mv:r(70, 110) });
  if(w === 5 && k % 2 === 0) obst.push({ k:'cloud', x:dist * .45, y:r(-60, 40), w:130, h:42, mv:-r(60, 90) });
  return { i, w, k, boss, enemies, obst, py:0, phalf:72, coins:Math.round(22 * Math.pow(1.046, i) * (boss ? 2.5 : 1)) };
}

/* ---------------- upgrades ---------------- */
const UPS = [
  { id:'hp',    name:'HEALTH',     icon:'❤️', base:40, mul:1.18, max:40, desc:lv => `${fmt(pHP(lv))} health` },
  { id:'dmg',   name:'POWER',      icon:'🏹', base:50, mul:1.18, max:40, desc:lv => `${fmt(pDmg(lv))} damage per arrow` },
  { id:'draw',  name:'QUICK DRAW', icon:'⚡', base:70, mul:1.36, max:15, desc:lv => `${pRel(lv).toFixed(2)} s reload` },
  { id:'scope', name:'SCOPE',      icon:'🎯', base:45, mul:1.45, max:10, desc:lv => `${Math.round(pScope(lv) * 100)}% aim line` },
  { id:'grip',  name:'GRIP',       icon:'🦶', base:55, mul:1.38, max:10, desc:lv => `${Math.round((1 - pGrip(lv)) * 100)}% less knockback` },
  { id:'loot',  name:'LOOT',       icon:'💰', base:90, mul:1.34, max:15, desc:lv => `+${lv * 10}% coins` },
];
const upCost = (u, lv) => Math.round(u.base * Math.pow(u.mul, lv) / 5) * 5;
const pHP = lv => Math.round(100 * Math.pow(1.12, lv));
const pDmg = lv => Math.round(22 * Math.pow(1.12, lv));
const pRel = lv => 1.05 * Math.pow(.93, lv);
const pScope = lv => .24 + .055 * lv;
const pGrip = lv => 1 - .065 * lv;

/* ---------------- hats (cosmetic collection) ---------------- */
const HATS = [
  { id:'none',    name:'No Hat',     cost:0 },
  { id:'cap',     name:'Cap',        cost:150 },
  { id:'band',    name:'Headband',   cost:300 },
  { id:'cowboy',  name:'Cowboy',     cost:600 },
  { id:'viking',  name:'Viking',     cost:1000 },
  { id:'chef',    name:'Chef',       cost:1600 },
  { id:'pirate',  name:'Pirate',     cost:2400 },
  { id:'wizard',  name:'Wizard',     cost:3500 },
  { id:'tophat',  name:'Top Hat',    cost:5000 },
  { id:'crown',   name:'Crown',      cost:8000 },
  { id:'pumpkin', name:'Pumpkin',    stars:30 },
  { id:'halo',    name:'Halo',       stars:75 },
  { id:'astro',   name:'Space Helmet', stars:120 },
  { id:'gold',    name:'Golden Crown', stars:180 },
];

/* ---------------- missions ---------------- */
const MISSION_POOL = [
  { id:'wins',     txt:n => `Win ${n} duel${n === 1 ? '' : 's'}`,                n:[3, 8, 20, 40] },
  { id:'heads',    txt:n => `Land ${n} headshots`,           n:[5, 15, 40, 100] },
  { id:'ringouts', txt:n => `Knock ${n} archer${n === 1 ? '' : 's'} off their pillar`, n:[1, 3, 8, 20] },
  { id:'orbs',     txt:n => `Shoot ${n} power orbs`,         n:[3, 10, 25, 60] },
  { id:'hits',     txt:n => `Hit enemies ${n} times`,        n:[25, 80, 200, 500] },
  { id:'flawless', txt:n => `Win ${n} duel${n === 1 ? '' : 's'} without getting hit`, n:[1, 3, 8, 15] },
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'wobblebow_save_v1';
function defSave(){
  return {
    v:1, coins:0, lvl:0, stars:[], hat:'none', own:{ none:1 },
    up:{ hp:0, dmg:0, draw:0, scope:0, grip:0, loot:0 },
    stats:{ wins:0, heads:0, ringouts:0, orbs:0, hits:0, flawless:0, shots:0 },
    arena:0, missions:[], tut:0, login:{ key:'', day:0 }, duels:0,
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
  if(!Array.isArray(save.stars)) save.stars = [];
  fillMissions();
}
function persist(){
  const s = JSON.stringify(save), d = SDK.data();
  try{ if(d) d.setItem(SAVE_KEY, s); }catch(e){}
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
const totalStars = () => save.stars.reduce((a, b) => a + (b || 0), 0);
function fillMissions(){
  save.missions = save.missions.filter(m => !m.claimed);
  const have = new Set(save.missions.map(m => m.id));
  while(save.missions.length < 3){
    const p = pick(MISSION_POOL.filter(m => !have.has(m.id))); have.add(p.id);
    const tier = Math.min(p.n.length - 1, Math.floor(save.duels / 15));
    save.missions.push({ id:p.id, n:p.n[tier], at:save.stats[p.id] || 0, prog:0, done:false, claimed:false, rw:Math.round(100 * Math.pow(2.3, tier)) });
  }
}
function missionTick(){
  for(const m of save.missions){
    if(m.done) continue;
    m.prog = (save.stats[m.id] || 0) - m.at;
    if(m.prog >= m.n){ m.prog = m.n; m.done = true; }
  }
}
/* ---------------- daily reward ---------------- */
const LOGIN = [100, 200, 300, 500, 800, 1200, 3000];
const todayKey = () => new Date().toISOString().slice(0, 10);
const hatDef = id => HATS.find(h => h.id === id) || HATS[0];
