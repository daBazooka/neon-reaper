'use strict';
/* =====================================================================
   ABYSS HOOK core: utilities, zones, species, rods, upgrades, bait,
   quests, achievements, levels, daily rewards, save.
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
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
function mix(h1, h2, t){ const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16); const r = lerp(a >> 16, b >> 16, t) | 0, g = lerp(a >> 8 & 255, b >> 8 & 255, t) | 0, bl = lerp(a & 255, b & 255, t) | 0; return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1); }
const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const yesterday = () => { const d = new Date(Date.now() - 864e5); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

/* ---------------- zones (depth in metres) ---------------- */
const ZONES = [
  { name:'Sunlit Shallows', top:0,    col:['#48c8f0', '#1e88c8'], dens:.34, key:62 },
  { name:'Coral Gardens',   top:50,   col:['#1e88c8', '#1768ac'], dens:.4,  key:65 },
  { name:'Kelp Forest',     top:120,  col:['#1768ac', '#0f4d86'], dens:.45, key:60 },
  { name:'Twilight Zone',   top:220,  col:['#0f4d86', '#0a2c5c'], dens:.5,  key:57 },
  { name:'Midnight Zone',   top:380,  col:['#0a2c5c', '#061a3a'], dens:.53, key:55 },
  { name:'The Abyss',       top:600,  col:['#061a3a', '#040c22'], dens:.56, key:53 },
  { name:'Sunken City',     top:900,  col:['#0c1a30', '#08101e'], dens:.58, key:58 },
  { name:'The Trench',      top:1300, col:['#0c0624', '#040210'], dens:.6,  key:50 },
];
function zoneAt(d){ let z = 0; for(let i = 0; i < ZONES.length; i++) if(d >= ZONES[i].top) z = i; return z; }

/* ---------------- species ---------------- */
// [zone, name, rarity, shape, body colour, accent colour, pattern, length in metres]
const ROWS = [
  [0, 'Sardine', 'C', 'fish', '#b8d0e4', '#6f8ca8', 'fade', .5],
  [0, 'Minnow', 'C', 'fish', '#c4d8a4', '#7e9a64', 'plain', .45],
  [0, 'Sunny Perch', 'C', 'fish', '#ffd35a', '#e89a2a', 'stripes', .6],
  [0, 'Clownfish', 'U', 'fish', '#ff8a2a', '#ffffff', 'stripes', .55],
  [0, 'Blue Tang', 'U', 'fish', '#2a6af0', '#ffd23a', 'fade', .65],
  [0, 'Pufferfish', 'R', 'round', '#f4dc7a', '#a88a3a', 'spots', .7],
  [0, 'Sea Turtle', 'R', 'turtle', '#5aa86a', '#2e6a3a', 'plain', 1.3],
  [0, 'Golden Koi', 'E', 'fish', '#ffd23a', '#ff7a2a', 'spots', .9],
  [0, 'Sunspear Marlin', 'L', 'shark', '#2a5ad0', '#8ad4ff', 'plain', 3.2],
  [1, 'Parrotfish', 'C', 'fish', '#4ad8b0', '#ff7ad0', 'fade', .7],
  [1, 'Butterflyfish', 'C', 'fish', '#fff4a0', '#1a1a2a', 'stripes', .5],
  [1, 'Damselfish', 'C', 'fish', '#4a8aff', '#ffd23a', 'plain', .45],
  [1, 'Lionfish', 'U', 'round', '#ff6a4a', '#fff0e0', 'stripes', .75],
  [1, 'Moorish Idol', 'U', 'fish', '#fff6d0', '#1a1a1a', 'stripes', .6],
  [1, 'Stingray', 'R', 'flat', '#8a9ab0', '#4a5a70', 'spots', 1.4],
  [1, 'Mandarinfish', 'R', 'fish', '#2a8aff', '#ff8a2a', 'spots', .55],
  [1, 'Rainbow Wrasse', 'E', 'fish', '#ff5ad0', '#5affd0', 'fade', .8],
  [1, 'Reef Emperor', 'L', 'round', '#ff5a8a', '#ffd23a', 'stripes', 2.6],
  [2, 'Kelp Bass', 'C', 'fish', '#8a9a5a', '#4a5a2a', 'spots', .75],
  [2, 'Rockfish', 'C', 'fish', '#d85a3a', '#8a2a1a', 'spots', .7],
  [2, 'Sheephead', 'C', 'fish', '#e87a5a', '#2a2a2a', 'fade', .8],
  [2, 'Leopard Shark', 'U', 'shark', '#c8b48a', '#4a3a2a', 'spots', 1.6],
  [2, 'Garibaldi', 'U', 'fish', '#ff8a1a', '#ffc04a', 'plain', .6],
  [2, 'Moray Eel', 'R', 'long', '#6a8a3a', '#2a3a1a', 'spots', 1.8],
  [2, 'Ocean Sunfish', 'R', 'round', '#b8c4d0', '#6a7a8a', 'fade', 1.9],
  [2, 'Giant Seabass', 'E', 'fish', '#3a4a5a', '#8a9aaa', 'spots', 1.9],
  [2, 'Kelp Leviathan', 'L', 'long', '#3a8a3a', '#b8ff6a', 'stripes', 5],
  [3, 'Lanternfish', 'C', 'fish', '#5a7aa8', '#8affff', 'glow', .4],
  [3, 'Hatchetfish', 'C', 'round', '#c8d8e8', '#6a8aa8', 'glow', .4],
  [3, 'Bristlemouth', 'C', 'long', '#3a4a6a', '#8ab4ff', 'glow', .5],
  [3, 'Glow Squid', 'U', 'squid', '#d86a8a', '#ffb0d0', 'glow', .9],
  [3, 'Swordfish', 'U', 'shark', '#4a5a8a', '#c8d8ff', 'fade', 2.4],
  [3, 'Oarfish', 'R', 'long', '#d8e0f0', '#ff4a5a', 'stripes', 3],
  [3, 'Barreleye', 'R', 'fish', '#7a8a9a', '#7affa0', 'glow', .5],
  [3, 'Firefly Squid', 'E', 'squid', '#3a4aa8', '#5af0ff', 'glow', .7],
  [3, 'Giant Squid', 'L', 'squid', '#c84a4a', '#ff9a8a', 'spots', 6],
  [4, 'Anglerfish', 'C', 'angler', '#3a2a3a', '#6affd0', 'glow', .6],
  [4, 'Viperfish', 'C', 'long', '#2a3a5a', '#8ab4ff', 'glow', .7],
  [4, 'Gulper Eel', 'C', 'long', '#1a1a2a', '#ff5a8a', 'glow', 1],
  [4, 'Dragonfish', 'U', 'long', '#1a2a1a', '#ffd23a', 'glow', .9],
  [4, 'Vampire Squid', 'U', 'squid', '#8a1a2a', '#5a8aff', 'glow', .8],
  [4, 'Frilled Shark', 'R', 'shark', '#5a4a4a', '#ffb0a0', 'plain', 2],
  [4, 'Coelacanth', 'R', 'fish', '#2a4a8a', '#d8e8ff', 'spots', 1.8],
  [4, 'Glass Octopus', 'E', 'squid', '#c8f0ff', '#8affff', 'glow', 1],
  [4, 'Abyssal Angler', 'L', 'angler', '#2a1a3a', '#ffd23a', 'glow', 4],
  [5, 'Tripod Fish', 'C', 'fish', '#8a8a9a', '#c8c8d8', 'plain', .8],
  [5, 'Fangtooth', 'C', 'angler', '#3a2a2a', '#ff8a5a', 'plain', .5],
  [5, 'Snailfish', 'C', 'long', '#e8c8d8', '#ff9ac0', 'glow', .6],
  [5, 'Chimera', 'U', 'long', '#8a9ab0', '#d0e0ff', 'fade', 1.4],
  [5, 'Dumbo Octopus', 'U', 'squid', '#ff9ab0', '#ffd0e0', 'plain', .7],
  [5, 'Goblin Shark', 'R', 'shark', '#e8a0a8', '#8a5a6a', 'plain', 3],
  [5, 'Black Swallower', 'R', 'round', '#1a1a2a', '#ff5a5a', 'glow', .9],
  [5, 'Ghost Shark', 'E', 'shark', '#e0f0ff', '#8affff', 'glow', 2.6],
  [5, 'Colossal Squid', 'L', 'squid', '#8a2a8a', '#ff8aff', 'glow', 7],
  [6, 'Rusty Carp', 'C', 'fish', '#b86a3a', '#6a3a1a', 'spots', .9],
  [6, 'Bonefish', 'C', 'fish', '#e8e0c8', '#8a8070', 'stripes', .8],
  [6, 'Coin Fish', 'C', 'round', '#ffd23a', '#c89a1a', 'spots', .6],
  [6, 'Crown Eel', 'U', 'long', '#8a5aff', '#ffd23a', 'stripes', 2],
  [6, 'Sea Dragon', 'U', 'long', '#5ad8a0', '#ffb04a', 'spots', 1.6],
  [6, 'Pharaoh Ray', 'R', 'flat', '#d8a83a', '#3a6ad8', 'stripes', 2.2],
  [6, 'Clockwork Fish', 'R', 'fish', '#c8963a', '#7a5a2a', 'spots', 1],
  [6, 'Atlantean Koi', 'E', 'fish', '#5af0ff', '#ffffff', 'glow', 1.2],
  [6, 'The Kraken', 'L', 'squid', '#5a2a6a', '#5affb0', 'spots', 8],
  [7, 'Void Eel', 'C', 'long', '#1a0a2a', '#b05aff', 'glow', 1.4],
  [7, 'Nebula Minnow', 'C', 'fish', '#5a3a8a', '#ff8aff', 'glow', .6],
  [7, 'Pressure Puffer', 'C', 'round', '#3a3a6a', '#8affff', 'spots', .9],
  [7, 'Obsidian Ray', 'U', 'flat', '#1a1a1a', '#ff5a2a', 'glow', 2.4],
  [7, 'Ember Angler', 'U', 'angler', '#5a1a0a', '#ff8a2a', 'glow', 1],
  [7, 'Prism Shark', 'R', 'shark', '#8ad8ff', '#ff8aff', 'fade', 3.2],
  [7, 'Starwhale', 'R', 'whale', '#1a2a5a', '#ffffff', 'spots', 6],
  [7, 'Time Turtle', 'E', 'turtle', '#3a2a6a', '#ffd23a', 'glow', 2],
  [7, 'Leviathan', 'L', 'whale', '#0a1a3a', '#5affff', 'glow', 12],
];
const RAR = {
  C:{ name:'Common',    col:'#c8d8e8', w:60, val:1,   xp:1 },
  U:{ name:'Uncommon',  col:'#6aff8a', w:26, val:2.2, xp:2 },
  R:{ name:'Rare',      col:'#4ab4ff', w:10, val:5,   xp:5 },
  E:{ name:'Epic',      col:'#c86aff', w:3,  val:12,  xp:12 },
  L:{ name:'Legendary', col:'#ffb020', w:0,  val:60,  xp:50 },
};
const ZVAL = [3, 6, 13, 26, 50, 95, 180, 340];
const SPEED = { fish:2.6, round:1.3, long:1.9, flat:2.1, squid:2.4, angler:.9, shark:3.4, turtle:1.3, whale:1.1 };
const SPECIES = ROWS.map(([z, name, r, shape, col, col2, pat, size]) => ({ id:name.toLowerCase().replace(/[^a-z]+/g, '_'), z, name, r, shape, col, col2, pat, size, spd:SPEED[shape] * (1 + z * .06), val:ZVAL[z] * RAR[r].val, xp:Math.round(RAR[r].xp * (1 + z * .4)) }));
SPECIES.forEach(s => { s.dl = clamp(.5 + s.size * .75, .75, 7.5); });   // drawn length in metres
const SP = Object.fromEntries(SPECIES.map(s => [s.id, s]));
const zoneSpecies = z => SPECIES.filter(s => s.z === z && s.r !== 'L');
const legendOf = z => SPECIES.find(s => s.z === z && s.r === 'L');

/* ---------------- rods ---------------- */
const RODS = [
  { id:'bamboo',  name:'Bamboo Rod',     cost:0,       lvl:1,  val:1,   cap:0,  luck:0,  mag:0,  shield:0, col:'#c8a060', desc:'Where every angler begins.' },
  { id:'fiber',   name:'Fiberglass Rod', cost:900,     lvl:3,  val:1.15,cap:0,  luck:0,  mag:0,  shield:0, col:'#e8e8f0', desc:'Fish are worth 15% more.' },
  { id:'carbon',  name:'Carbon Rod',     cost:5000,    lvl:6,  val:1.15,cap:3,  luck:0,  mag:0,  shield:0, col:'#3a3a4a', desc:'Holds 3 more fish.' },
  { id:'coral',   name:'Coral Rod',      cost:18000,   lvl:10, val:1.2, cap:3,  luck:.35,mag:0,  shield:0, col:'#ff7a8a', desc:'Rare fish bite 35% more often.' },
  { id:'golden',  name:'Golden Rod',     cost:60000,   lvl:15, val:1.5, cap:4,  luck:.35,mag:.1, shield:0, col:'#ffd23a', desc:'Fish are worth 50% more.' },
  { id:'abyssal', name:'Abyssal Rod',    cost:200000,  lvl:20, val:1.6, cap:6,  luck:.5, mag:.25,shield:2, col:'#5a3aff', desc:'Two free bumps and a wider catch.' },
  { id:'kraken',  name:'Kraken Rod',     cost:700000,  lvl:26, val:1.9, cap:9,  luck:.7, mag:.35,shield:2, col:'#5affb0', desc:'Tentacled power from the Sunken City.' },
  { id:'trident', name:'Trident',        cost:2500000, lvl:32, val:2.5, cap:14, luck:1,  mag:.5, shield:3, col:'#8affff', desc:'The ocean kneels.' },
];
const rodById = id => RODS.find(r => r.id === id) || RODS[0];

/* ---------------- upgrades ---------------- */
const UPG = [
  { id:'line',   icon:'🧵', name:'Longer Line',   base:60,  k:1.8,  max:25, eff:l => `Reaches ${fmt(lineDepth(l))} m` },
  { id:'hooks',  icon:'🪝', name:'More Hooks',    base:80,  k:1.7,  max:20, eff:l => `Holds ${hookCap(l)} fish` },
  { id:'magnet', icon:'🧲', name:'Wider Lure',    base:100, k:1.75, max:15, eff:l => `Catch radius ${catchR(l).toFixed(1)} m` },
  { id:'shield', icon:'🛡', name:'Bite Guard',    base:400, k:2.7,  max:6,  eff:l => l ? `${l} free bump${l > 1 ? 's' : ''} per dive` : 'No free bumps' },
  { id:'luck',   icon:'🍀', name:'Lucky Charm',   base:200, k:1.7,  max:20, eff:l => `Rare fish x${(1 + l * .1).toFixed(1)}` },
  { id:'value',  icon:'💰', name:'Fish Market',   base:250, k:1.65, max:30, eff:l => `Fish worth x${(1 + l * .12).toFixed(2)}` },
];
const lineDepth = l => Math.round(40 + 28 * l + 4 * l * l);
const hookCap = l => 4 + l * 2;
const catchR = l => .7 + l * .1;
const upCost = (u, l) => Math.ceil(u.base * Math.pow(u.k, l) / 10) * 10;

/* ---------------- bait (gems) ---------------- */
const BAITS = [
  { id:'golden', icon:'🪱', name:'Golden Worm',  cost:14, desc:'Every fish worth double this dive.' },
  { id:'glow',   icon:'✨', name:'Glow Bait',    cost:18, desc:'Rare fish x3 and shinies x3 this dive.' },
  { id:'sinker', icon:'⚓', name:'Heavy Sinker', cost:10, desc:'Plunge straight to 60% of your line.' },
  { id:'wide',   icon:'🌀', name:'Whirl Lure',   cost:12, desc:'Double catch radius this dive.' },
];

/* ---------------- levels ---------------- */
const xpNeed = l => Math.round(30 * Math.pow(1.3, l - 1));

/* ---------------- quests ---------------- */
const QTYPES = {
  catch:  { t:n => `Catch ${n} fish`, gems:5 },
  rare:   { t:n => `Catch ${n} rare or better fish`, gems:8 },
  depth:  { t:n => `Reach ${fmt(n)} m in one dive`, gems:6, run:true },
  snap:   { t:n => `Tap ${n} fish in the air`, gems:5 },
  coins:  { t:n => `Earn ${fmt(n)} coins in one dive`, gems:7, run:true },
  chest:  { t:n => `Open ${n} treasure chest${n > 1 ? 's' : ''}`, gems:6 },
  frenzy: { t:n => `Trigger ${n} Frenzy${n > 1 ? ' streaks' : ''}`, gems:7 },
  zone:   { t:(n, z) => `Catch ${n} fish in the ${ZONES[z].name}`, gems:8 },
};
function makeQuest(avoid){
  const lvl = save.lvl, deep = zoneAt(lineDepth(save.up.line));
  const keys = Object.keys(QTYPES).filter(k => !avoid.includes(k));
  const k = pick(keys); let n = 1, z = 0;
  switch(k){
    case 'catch': n = 15 + lvl * 4; break;
    case 'rare': n = 2 + (lvl / 4 | 0); break;
    case 'depth': n = Math.max(30, Math.round(lineDepth(save.up.line) * .85 / 10) * 10); break;
    case 'snap': n = 10 + lvl * 2; break;
    case 'coins': n = Math.round(ZVAL[deep] * (8 + lvl) * 1.5 / 10) * 10; break;
    case 'chest': n = 1 + (lvl / 8 | 0); break;
    case 'frenzy': n = 1 + (lvl / 10 | 0); break;
    case 'zone': z = deep; n = 6 + lvl; break;
  }
  return { k, n, z, p:0, done:false, claimed:false };
}
function fillQuests(){ save.quests = save.quests.filter(q => q && QTYPES[q.k] && !q.claimed); while(save.quests.length < 3) save.quests.push(makeQuest(save.quests.map(q => q.k))); }

/* ---------------- achievements ---------------- */
const ACH = [
  { id:'fish',    name:'Angler',        stat:'fish',      tiers:[10, 100, 500, 2000, 10000], t:n => `Catch ${fmt(n)} fish` },
  { id:'species', name:'Naturalist',    stat:'species',   tiers:[5, 15, 30, 50, 72], t:n => `Discover ${n} species` },
  { id:'deep',    name:'Deep Diver',    stat:'deepest',   tiers:[100, 300, 600, 1000, 1500], t:n => `Reach ${fmt(n)} m` },
  { id:'shiny',   name:'Shiny Hunter',  stat:'shinies',   tiers:[1, 5, 20, 60], t:n => `Catch ${n} shiny fish` },
  { id:'legend',  name:'Legend Tamer',  stat:'legends',   tiers:[1, 3, 6, 8], t:n => `Reel in ${n} legendary fish` },
  { id:'snap',    name:'Quick Draw',    stat:'snaps',     tiers:[25, 250, 1500, 8000], t:n => `Tap ${fmt(n)} fish in the air` },
  { id:'chest',   name:'Treasure Seeker', stat:'chests',  tiers:[5, 50, 250, 1000], t:n => `Open ${fmt(n)} chests` },
  { id:'frenzy',  name:'Frenzied',      stat:'frenzies',  tiers:[1, 20, 100, 500], t:n => `Trigger ${fmt(n)} Frenzies` },
  { id:'level',   name:'Old Salt',      stat:'lvl',       tiers:[5, 10, 20, 30, 40], t:n => `Reach level ${n}` },
  { id:'dives',   name:'Regular',       stat:'dives',     tiers:[10, 50, 200, 1000], t:n => `Make ${fmt(n)} dives` },
];
const achReward = tier => 4 + tier * 4;

/* ---------------- daily rewards ---------------- */
const DAILY = [
  { t:'coins', n:400 }, { t:'gems', n:5 }, { t:'bait', id:'golden', n:1 }, { t:'coins', n:1200 },
  { t:'gems', n:10 }, { t:'bait', id:'glow', n:2 }, { t:'gems', n:25 },
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'abysshook_save_v1';
let _saveT = 0;
function defSave(){
  return {
    v:1, coins:0, gems:0, xp:0, lvl:1, up:{ line:0, hooks:0, magnet:0, shield:0, luck:0, value:0 },
    rod:'bamboo', rods:{ bamboo:1 }, bait:{ golden:1, glow:0, sinker:1, wide:0 }, equip:'',
    dex:{}, quests:[], ach:{}, daily:{ last:'', streak:0 }, lastSeen:0,
    stats:{ dives:0, fish:0, deepest:0, shinies:0, legends:0, snaps:0, chests:0, frenzies:0, coins:0 },
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
function loadSave(){
  let raw = null; const d = SDK.data();
  try{ if(d) raw = d.getItem(SAVE_KEY); }catch(e){}
  if(!raw && !d){ try{ raw = localStorage.getItem(SAVE_KEY); }catch(e){} }
  if(raw){ try{ save = mergeInto(defSave(), JSON.parse(raw)); }catch(e){ save = defSave(); } }
  fillQuests();
}
function writeSave(){
  save.lastSeen = Date.now();
  const s = JSON.stringify(save), d = SDK.data();
  if(d){ try{ d.setItem(SAVE_KEY, s); }catch(e){} return; }
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
function persist(){ clearTimeout(_saveT); _saveT = setTimeout(writeSave, 300); }

/* ---------------- derived stats ---------------- */
const speciesFound = () => SPECIES.filter(s => save.dex[s.id]).length;
function zoneMastered(z){ return zoneSpecies(z).every(s => save.dex[s.id]); }
function masteryMul(){ let m = 1; for(let z = 0; z < ZONES.length; z++) if(zoneMastered(z)) m += .1; return m; }
function aquariumRate(){ let r = 0; for(const s of SPECIES){ const d = save.dex[s.id]; if(d) r += s.val * (d.shiny ? 3 : 1) * .06; } return r; } // coins per minute
