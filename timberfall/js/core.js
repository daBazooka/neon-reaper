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
const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
function mulberry32(s){ return function(){ s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function todayKey(){ const d = new Date(); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); }
let grng = Math.random;
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
function mixHex(a, b, t){
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const c = s => Math.round(lerp(x >> s & 255, y >> s & 255, t));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}
function distSeg(px, py, ax, ay, bx, by){
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1, t = clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1);
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}

/* ---------------- the forest ---------------- */
const WORLD = 3200, CX = WORLD / 2, CY = WORLD / 2, CLEAR = 250;
const RUN_LEN = 600;          // seconds from dusk to dawn

/* h: height (fall length) · w: trunk width (fall width) · hp: chops to fell · wood: chips */
const TREES = {
  pine:    { name:'Pine',     hp:3, h:200, w:24, wood:5,  crown:'cone' },
  oak:     { name:'Oak',      hp:5, h:170, w:36, wood:6,  crown:'round' },
  birch:   { name:'Birch',    hp:2, h:160, w:20, wood:4,  crown:'oval', bark:'#e9e4d8' },
  redwood: { name:'Redwood',  hp:9, h:360, w:46, wood:10, crown:'tall' },
  bamboo:  { name:'Bamboo',   hp:1, h:150, w:14, wood:3,  crown:'bamboo' },
  dead:    { name:'Deadwood', hp:2, h:170, w:22, wood:4,  crown:'dead', gold:2 },
  golden:  { name:'Golden Tree', hp:6, h:190, w:34, wood:14, crown:'round', gold:25, glow:1 },
};

/* the six forests, unlocked by surviving until dawn */
const BIOMES = [
  { id:'pine',    name:'Pine Hollow',      mix:{ pine:6, oak:3, birch:2, golden:.15 }, ground:['#5b8a3c', '#4e7a33', '#6a9a45'], leaf:{ pine:['#2f6b3a', '#3f8a48'], oak:['#3f7f35', '#5aa044'], birch:['#6fae4a', '#9ccf5c'], golden:['#e7b43a', '#ffd86a'] }, bark:'#6b4428', fog:'#1b2b3a', note:'A gentle first night.' },
  { id:'autumn',  name:'Autumn Birchwood', mix:{ birch:5, oak:4, pine:1, golden:.2 },  ground:['#8a7a3c', '#7a6a33', '#9a8a45'], leaf:{ pine:['#3a6a3a', '#4c8048'], oak:['#c8561e', '#e58a2e'], birch:['#e8b23a', '#ffd35a'], golden:['#e7b43a', '#ffd86a'] }, bark:'#6b4428', fog:'#2a1e24', note:'Falling leaves, quicker creatures.' },
  { id:'taiga',   name:'Snowy Taiga',      mix:{ pine:6, redwood:1, birch:1, golden:.2 }, ground:['#dfe8ee', '#cdd9e2', '#eef4f7'], leaf:{ pine:['#2c5a48', '#e8f2f5'], redwood:['#2a5040', '#e2eef2'], birch:['#9fb8a8', '#eef4f7'], golden:['#e7b43a', '#ffd86a'] }, bark:'#5a3a24', fog:'#1a2436', note:'Wolves hunt in packs here.' },
  { id:'bamboo',  name:'Bamboo Grove',     mix:{ bamboo:7, oak:1, golden:.2 },         ground:['#7aa04a', '#6a9040', '#8ab058'], leaf:{ bamboo:['#6fbf4a', '#a6e06a'], oak:['#3f7f35', '#5aa044'], golden:['#e7b43a', '#ffd86a'] }, bark:'#7a8a3a', fog:'#16261e', note:'Fast to fell, fast to regrow.' },
  { id:'redwood', name:'Redwood Giants',   mix:{ redwood:4, pine:3, golden:.25 },      ground:['#5a6a34', '#4a5a2c', '#6a7a40'], leaf:{ redwood:['#2f5a2a', '#46803a'], pine:['#2f6b3a', '#3f8a48'], golden:['#e7b43a', '#ffd86a'] }, bark:'#8a3a22', fog:'#1e2418', note:'Enormous trees, enormous crashes.' },
  { id:'haunt',   name:'Haunted Wood',     mix:{ dead:5, oak:2, pine:2, golden:.3 },   ground:['#4a4a5a', '#3e3e4e', '#56566a'], leaf:{ oak:['#4a3a6a', '#6a5a9a'], pine:['#2a3a4a', '#45566a'], dead:['#3a3040', '#5a4a60'], golden:['#b88af0', '#e2c8ff'] }, bark:'#3a3040', fog:'#140e22', note:'The dead trees are full of treasure.' },
];

/* ---------------- creatures of the night ----------------
   armor: axe damage multiplier · crush: tree damage multiplier */
const FOES = {
  thorn:  { name:'Thornling',   hp:18,  spd:62,  dmg:8,  r:15, xp:1, gold:.35, col:'#6a8a3a', at:0 },
  wisp:   { name:'Wisp',        hp:10,  spd:112, dmg:6,  r:11, xp:1, gold:.3,  col:'#9fe8ff', fly:1, at:40 },
  boar:   { name:'Tusker',      hp:48,  spd:70,  dmg:16, r:21, xp:3, gold:1,   col:'#7a4a32', charge:1, at:80 },
  wolf:   { name:'Rotwolf',     hp:30,  spd:128, dmg:10, r:17, xp:2, gold:.6,  col:'#6a6a7a', pack:4, at:140 },
  beaver: { name:'Bandit Beaver', hp:34, spd:92, dmg:7,  r:15, xp:2, gold:1.5, col:'#8a5a32', gnaw:1, at:110 },
  spore:  { name:'Puffcap',     hp:24,  spd:55,  dmg:6,  r:17, xp:2, gold:.6,  col:'#c45a8a', burst:1, at:190 },
  bark:   { name:'Barkling',    hp:120, spd:46,  dmg:14, r:23, xp:5, gold:2,   col:'#5a4430', armor:.3, at:230 },
  owlbear:{ name:'Owlbear',     hp:420, spd:74,  dmg:24, r:32, xp:20, gold:12, col:'#7a5a3a', elite:1, at:320 },
  stump:  { name:'The Old Stump', hp:5200, spd:36, dmg:30, r:62, xp:60, gold:80, col:'#5a3a22', boss:1, armor:.3 },
  hollow: { name:'The Hollow King', hp:12000, spd:58, dmg:34, r:56, xp:120, gold:200, col:'#2a2238', boss:1, armor:.45 },
};
const BOSS_AT = { stump:270, hollow:540 };

/* ---------------- level-up cards ---------------- */
const RAR = [ { n:'COMMON', c:'#7fc36a', w:10 }, { n:'RARE', c:'#5aa8ff', w:5 }, { n:'EPIC', c:'#c07aff', w:2.2 } ];
const CARDS = [
  { id:'sharp',   name:'Sharp Edge',     icon:'🪓', rar:0, max:5, desc:'+30% axe damage' },
  { id:'quick',   name:'Quick Swing',    icon:'⚡', rar:0, max:5, desc:'Swing 12% faster' },
  { id:'reach',   name:'Long Handle',    icon:'↔', rar:0, max:3, desc:'+18% axe reach and arc' },
  { id:'crush',   name:'Heavy Timber',   icon:'🌲', rar:0, max:4, desc:'Falling trees crush 40% harder' },
  { id:'wide',    name:'Wide Fall',      icon:'⟷', rar:0, max:3, desc:'Falling trees hit a 35% wider path' },
  { id:'magnet',  name:'Wood Magnet',    icon:'🧲', rar:0, max:3, desc:'Pull wood chips from 50% farther' },
  { id:'stew',    name:'Hearty Stew',    icon:'🍲', rar:0, max:4, desc:'+25 max health and heal fully' },
  { id:'boots',   name:'Trail Boots',    icon:'👢', rar:0, max:3, desc:'Move 10% faster' },
  { id:'armor',   name:'Bark Armor',     icon:'🛡', rar:0, max:3, desc:'Take 12% less damage' },
  { id:'sprout',  name:'Seed Pouch',     icon:'🌱', rar:0, max:2, desc:'Stumps regrow into trees twice as fast' },
  { id:'heavy',   name:'Heavy Chop',     icon:'💪', rar:1, max:2, desc:'Each swing counts as one more chop on trees' },
  { id:'domino',  name:'Domino Master',  icon:'🁢', rar:1, max:2, desc:'Toppling trees fan out and knock over more trees' },
  { id:'regen',   name:'Pine Tea',       icon:'🍵', rar:1, max:3, desc:'Recover 1 health per second' },
  { id:'owl',     name:'Night Owl',      icon:'🦉', rar:1, max:3, desc:'An owl swoops on nearby creatures' },
  { id:'splint',  name:'Splinter Burst', icon:'✴', rar:1, max:3, desc:'Tree impacts spray razor splinters' },
  { id:'grove',   name:'Wild Grove',     icon:'🌳', rar:1, max:3, desc:'Fallen creatures may sprout a sapling' },
  { id:'lantern', name:'Bright Lantern', icon:'🏮', rar:1, max:2, desc:'Wider light. Creatures in your light take +15% damage' },
  { id:'fire',    name:'Firebrand Axe',  icon:'🔥', rar:2, max:3, desc:'Felled trees become burning logs' },
  { id:'bolt',    name:'Lightning Rod',  icon:'🌩', rar:2, max:3, desc:'Lightning fells a tree by the biggest crowd every few seconds' },
  { id:'beaver',  name:'Beaver Buddy',   icon:'🦫', rar:2, max:2, desc:'A friendly beaver chops trees onto creatures' },
  { id:'roll',    name:'Log Roller',     icon:'🪵', rar:2, max:2, desc:'Fallen logs roll toward creatures, crushing them' },
  { id:'frenzy',  name:'Timber Frenzy',  icon:'🌀', rar:2, max:2, desc:'Every felled tree: +25% speed and swing for 3 s' },
];

/* ---------------- meta: axes, camp, outfits ---------------- */
const AXES = [
  { id:'hatchet', name:'Trusty Hatchet', cost:0,    desc:'Reliable and light.', dmg:1, swing:1, chop:0, col:['#c9ced8', '#7a4a2a'] },
  { id:'double',  name:'Double Bit',     cost:600,  desc:'Swings 20% faster.', dmg:1, swing:.8, chop:0, col:['#dfe4ec', '#8a5a32'] },
  { id:'maul',    name:'Splitting Maul', cost:1200, desc:'+45% damage and +25% crush, swings slower.', dmg:1.45, swing:1.2, chop:0, crush:1.25, col:['#9aa0aa', '#5a3a22'] },
  { id:'frost',   name:'Frostbite Axe',  cost:2000, desc:'Hits slow creatures by 40%.', dmg:1.05, swing:1, chop:0, slow:1, col:['#9fe8ff', '#4a6a8a'] },
  { id:'saw',     name:'Crosscut Saw',   cost:2800, desc:'+1 chop on every tree, -15% damage.', dmg:.85, swing:.95, chop:1, col:['#e0e4ea', '#a0602a'] },
  { id:'ember',   name:'Ember Axe',      cost:4000, desc:'Every felled tree burns.', dmg:1.1, swing:1, chop:0, fire:1, col:['#ff8a3a', '#5a2a1a'] },
  { id:'gold',    name:'Golden Axe',     cost:6500, desc:'+60% gold from everything.', dmg:1.15, swing:.95, chop:0, gold:1.6, col:['#ffd23a', '#7a4a1a'] },
];
const CAMP = [
  { id:'hp',     name:'Warm Cabin',     icon:'❤', desc:'+12 max health',              costs:[120, 260, 480, 800, 1300] },
  { id:'dmg',    name:'Whetstone',      icon:'🪓', desc:'+8% axe damage',              costs:[150, 320, 600, 1000, 1600] },
  { id:'crush',  name:'Lumber Lore',    icon:'🌲', desc:'+10% tree crush damage',      costs:[150, 320, 600, 1000] },
  { id:'magnet', name:'Wood Sled',      icon:'🧲', desc:'+15% wood pickup range',      costs:[100, 240, 480] },
  { id:'gold',   name:'Trading Post',   icon:'🪙', desc:'+12% gold',                   costs:[180, 400, 750, 1200] },
  { id:'start',  name:'Morning Coffee', icon:'☕', desc:'Start each run with a free card', costs:[500, 1400] },
  { id:'revive', name:'Second Wind',    icon:'✚', desc:'Get back up once per run',     costs:[900] },
];
const OUTFITS = [
  { id:'red',    name:'Red Flannel',   cost:0,    shirt:'#c0392b', check:'#7a1e18', hat:'#3a2a1a' },
  { id:'blue',   name:'Lake Blue',     cost:300,  shirt:'#2e6fb5', check:'#173e6a', hat:'#2a2a2a' },
  { id:'green',  name:'Ranger Green',  cost:500,  shirt:'#3f8a48', check:'#1f4a24', hat:'#5a3a1a' },
  { id:'bee',    name:'Bumblebee',     cost:800,  shirt:'#f2c12e', check:'#2a2a2a', hat:'#2a2a2a' },
  { id:'plum',   name:'Night Plum',    cost:1200, shirt:'#7a4aa8', check:'#3a1f5a', hat:'#1a1a2a' },
  { id:'snow',   name:'Snowcap',       cost:1600, shirt:'#e8eef2', check:'#9aa8b8', hat:'#c0392b' },
  { id:'legend', name:'Golden Legend', cost:5000, shirt:'#ffd23a', check:'#c08a1a', hat:'#7a4a1a' },
];
const MODS = [
  { id:'storm', name:'WINDSTORM',     desc:'Gusts knock trees down all by themselves.' },
  { id:'giant', name:'GIANT FOREST',  desc:'Every tree is 40% taller.' },
  { id:'swarm', name:'SWARM NIGHT',   desc:'Twice the creatures. Gold x1.5.' },
  { id:'glass', name:'GLASS CABIN',   desc:'Half health. Gold x2.' },
  { id:'gold',  name:'GOLD RUSH',     desc:'Golden trees everywhere.' },
];
const MT = [
  { id:'fell',  ev:'fell',  kind:'sum', vals:[40, 120, 300, 700, 1500], txt:n => `Fell ${n} trees` },
  { id:'chain', ev:'chain', kind:'max', vals:[4, 6, 9, 13, 18],         txt:n => `Topple ${n} trees in one chain` },
  { id:'kill',  ev:'kill',  kind:'sum', vals:[150, 500, 1500, 4000],    txt:n => `Defeat ${n} creatures` },
  { id:'crush', ev:'crush', kind:'sum', vals:[60, 200, 600, 1500],      txt:n => `Crush ${n} creatures under trees` },
  { id:'time',  ev:'time',  kind:'max', vals:[120, 240, 360, 480, 600], txt:n => `Survive until ${mmss(n)}` },
  { id:'boss',  ev:'boss',  kind:'sum', vals:[1, 3, 8],                 txt:n => `Defeat ${n} boss${n > 1 ? 'es' : ''}` },
  { id:'level', ev:'level', kind:'max', vals:[8, 12, 16, 20, 25],       txt:n => `Reach level ${n} in one run` },
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'timberfall_save_v1';
function defSave(){
  return {
    v:1, gold:0, xp:0, level:1, runs:0, best:0, bestTime:0, dawns:0,
    camp:{ hp:0, dmg:0, crush:0, magnet:0, gold:0, start:0, revive:0 },
    axes:['hatchet'], axe:'hatchet', outfits:['red'], outfit:'red', biome:0, unlocked:1,
    missions:[], mTier:{}, missionsDone:0, mNew:false,
    stats:{ fell:0, kills:0, crush:0, bestChain:0, bosses:0 },
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
    else if(s !== undefined && s !== null && typeof s === typeof b && Array.isArray(s) === Array.isArray(b)) base[k] = s;
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
