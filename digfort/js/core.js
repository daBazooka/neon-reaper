'use strict';
/* ---------------- utils ---------------- */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const $ = id => document.getElementById(id);
const fmt = n => Math.floor(n).toLocaleString('en-US');
function mulberry32(s){ return function(){ s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function todayKey(){ const d = new Date(); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); }
let grng = Math.random;                         // world RNG (seeded for the daily)
const gr = (a, b) => a + grng() * (b - a);

/* ---------------- blocks ----------------
   hard: seconds to mine with a base pickaxe.  drop: resource key. */
const B = { GRASS:1, DIRT:2, STONE:3, COAL:4, IRON:5, GOLD:6, CRYSTAL:7, BEDROCK:8, MAGMA:9, BRICK:10 };
const BT = {
  1:  { name:'Grass',   hard:.45, drop:'soil' },
  2:  { name:'Dirt',    hard:.4,  drop:'soil' },
  3:  { name:'Stone',   hard:1.1, drop:'stone' },
  4:  { name:'Coal Ore',hard:1.3, drop:'coal',    ore:'#1b1b22' },
  5:  { name:'Iron Ore',hard:1.6, drop:'iron',    ore:'#e8b98e' },
  6:  { name:'Gold Ore',hard:2.0, drop:'gold',    ore:'#ffd23c' },
  7:  { name:'Crystal', hard:2.6, drop:'crystal', ore:'#3ff0ff' },
  8:  { name:'Bedrock', hard:1e9, drop:null },
  9:  { name:'Magma',   hard:1e9, drop:null },
  10: { name:'Stone Brick', hard:1.4, drop:'stone' },
};
const RES = ['soil', 'stone', 'coal', 'iron', 'gold', 'crystal'];
const RES_NAME = { soil:'Soil', stone:'Stone', coal:'Coal', iron:'Iron', gold:'Gold', crystal:'Crystal' };
const RES_BLOCK = { soil:B.DIRT, stone:B.STONE, coal:B.COAL, iron:B.IRON, gold:B.GOLD, crystal:B.CRYSTAL };
const RES_COL = { soil:'#b07a4a', stone:'#b9bcc4', coal:'#6d6d7a', iron:'#e8b98e', gold:'#ffd23c', crystal:'#3ff0ff' };

/* palettes: grass top / grass side fringe / dirt / stone / brick */
const THEMES = [
  { id:'meadow', name:'Meadow', cost:0,   grass:['#5fb33b','#4c9a2e','#78c850'], dirt:['#8a5a36','#7a4c2c','#9c6a42'], stone:['#8d8f96','#7b7d85','#a0a2aa'], sky:['#7ec8ff','#cdeaff'] },
  { id:'autumn', name:'Autumn', cost:150, grass:['#d9832b','#c46a1c','#eaa041'], dirt:['#7e5236','#6d452c','#915f40'], stone:['#8f8a86','#7d7874','#a29d98'], sky:['#ffb98a','#ffe3c8'] },
  { id:'frost',  name:'Frost',  cost:300, grass:['#eef6ff','#d6e6f7','#ffffff'], dirt:['#6d6a7c','#5d5a6b','#7f7c8f'], stone:['#8497b0','#72849c','#97a9c2'], sky:['#9fc4ec','#e6f2ff'] },
  { id:'dune',   name:'Dune',   cost:450, grass:['#e8cf7e','#d9bc62','#f4de96'], dirt:['#c99d5c','#b88b4c','#d9ad6c'], stone:['#b39a7a','#9f876a','#c4ab8b'], sky:['#ffcf7a','#fff0cf'] },
  { id:'fungal', name:'Fungal', cost:800, grass:['#b25ad9','#9a45c2','#c878ea'], dirt:['#5a4a6a','#4c3e5b','#6a587c'], stone:['#6f6a82','#5f5a71','#807b94'], sky:['#6b4fa8','#c8b0ff'] },
];

/* ---------------- tools (hotbar) ---------------- */
const TOOLS = [
  { id:'pick',  key:'1', name:'Pickaxe',       desc:'Hold on a block to mine it. Tap monsters to hit them.' },
  { id:'dirt',  key:'2', name:'Dirt Block',    desc:'Cheap wall. Monsters dig through it fast.', cost:{ soil:1 }, block:B.DIRT },
  { id:'brick', key:'3', name:'Stone Brick',   desc:'Tough wall. Monsters can only climb one block.', cost:{ stone:1 }, block:B.BRICK },
  { id:'bow',   key:'4', name:'Bow Tower',     desc:'Shoots the monster closest to your Heart. Tap again to upgrade.', cost:{ stone:3, iron:1 }, tower:true },
  { id:'blast', key:'5', name:'Blast Crate',   desc:'Explodes when monsters come close and blows a crater.', cost:{ stone:1, coal:1 }, tower:true, unlock:'blast' },
  { id:'fire',  key:'6', name:'Brazier',       desc:'Burns every monster around it. Tap again to upgrade.', cost:{ stone:2, coal:2 }, tower:true, unlock:'fire' },
  { id:'spire', key:'7', name:'Crystal Spire', desc:'Beams up to three monsters at once. Tap again to upgrade.', cost:{ gold:2, crystal:1 }, tower:true, unlock:'spire' },
];
const TOOL = {}; TOOLS.forEach(t => TOOL[t.id] = t);

/* ---------------- monsters (original designs) ---------------- */
const MOBS = {
  grub:    { name:'Grub',     hp:28,  spd:1.15, climb:1, dmg:1, dig:1,   size:.46, col:'#8fd14f', eye:'#1a2a10', gem:.25, score:10 },
  stomper: { name:'Stomper',  hp:95,  spd:.72,  climb:2, dmg:3, dig:1.4, size:.64,  col:'#8a6be0', eye:'#fff2a8', gem:.5,  score:30, fallRes:.5 },
  flitter: { name:'Flitter',  hp:16,  spd:1.7,  fly:true,dmg:1, dig:0,   size:.4, col:'#ff6fae', eye:'#2a0a18', gem:.3,  score:15 },
  mole:    { name:'Burrower', hp:44,  spd:.95,  climb:1, dmg:2, dig:4.5, size:.5, col:'#c08a5a', eye:'#ff3b3b', gem:.4,  score:20 },
  bug:     { name:'Blastbug', hp:34,  spd:1.0,  climb:1, dmg:4, dig:1,   size:.48, col:'#ff8a1f', eye:'#2b1200', gem:.4,  score:25, boom:true },
  golem:   { name:'Stone Warden', hp:460, spd:.45, climb:2, dmg:6, dig:3, size:1.05, col:'#9aa3b5', eye:'#ff5a2a', gem:8, score:400, boss:true, fallRes:.35 },
};

/* ---------------- dawn cards (roguelite powers) ---------------- */
const RAR = [ { n:'COMMON', c:'#a9c1ff', w:10 }, { n:'RARE', c:'#3ff0ff', w:6 }, { n:'EPIC', c:'#ff5ad9', w:2.6 } ];
const CARDS = [
  { id:'arrowDmg', name:'Sharp Arrows', icon:'➶', rar:0, max:5, desc:'+35% Bow Tower damage' },
  { id:'arrowRate',name:'Quick Draw',   icon:'»', rar:1, max:3, desc:'+25% Bow Tower fire rate' },
  { id:'range',    name:'Eagle Eye',    icon:'◎', rar:1, max:2, desc:'All towers reach +0.8 blocks further' },
  { id:'pick',     name:'Honed Pick',   icon:'⛏', rar:0, max:5, desc:'Mine 35% faster' },
  { id:'luck',     name:'Deep Pockets', icon:'✦', rar:1, max:3, desc:'30% chance for double drops' },
  { id:'fall',     name:'Heavy World',  icon:'⇩', rar:1, max:3, desc:'Monsters take +60% fall damage' },
  { id:'heart',    name:'Heart Stone',  icon:'♥', rar:2, max:3, desc:'+6 max Heart HP and full heal' },
  { id:'mend',     name:'Mend',         icon:'✚', rar:0, max:99, desc:'Heal the Heart by 8', cond:() => G.heartHp < G.heartMax },
  { id:'blastUp',  name:'Bigger Boom',  icon:'✺', rar:1, max:3, desc:'Blast Crates hit 30% harder and wider', cond:() => save.unlock.blast },
  { id:'fireUp',   name:'Hot Coals',    icon:'♨', rar:1, max:3, desc:'+40% Brazier damage', cond:() => save.unlock.fire },
  { id:'spireUp',  name:'Prism Focus',  icon:'◇', rar:1, max:3, desc:'+40% Crystal Spire damage', cond:() => save.unlock.spire },
  { id:'mason',    name:'Mason',        icon:'▦', rar:0, max:2, desc:'Monsters take twice as long to dig', },
  { id:'arm',      name:'Strong Arm',   icon:'✊', rar:0, max:3, desc:'Tapping monsters deals double damage' },
  { id:'supply',   name:'Supply Drop',  icon:'▣', rar:0, max:99, desc:'Get 8 stone, 3 iron and 2 coal now' },
  { id:'sentinel', name:'Sentinel',     icon:'✧', rar:2, max:2, desc:'The Heart zaps monsters that reach it' },
  { id:'bounty',   name:'Bounty',       icon:'◆', rar:2, max:2, desc:'Monsters drop 50% more gems' },
];

/* ---------------- meta progression ---------------- */
const META = [
  { id:'pick',  name:'Better Pickaxe', icon:'⛏', desc:'Mine every block faster', costs:[60, 160, 320, 640] },
  { id:'heart', name:'Heart Plating',  icon:'♥', desc:'+5 max Heart HP',        costs:[80, 220, 480] },
  { id:'kit',   name:'Starter Kit',    icon:'▣', desc:'Start with more stone, iron and coal', costs:[50, 150, 350] },
  { id:'luck',  name:'Rich Veins',     icon:'✦', desc:'Islands spawn 20% more ore', costs:[120, 320] },
];
const PICK_POWER = [1, 1.4, 1.9, 2.5, 3.2];
const UNLOCKS = [
  { id:'blast', tool:'blast', cost:100 },
  { id:'fire',  tool:'fire',  cost:240 },
  { id:'spire', tool:'spire', cost:520 },
];
const MODS = [
  { id:'rich',   name:'RICH VEINS',  desc:'Twice the ore. Twice the monsters.' },
  { id:'glass',  name:'GLASS HEART', desc:'The Heart has 8 HP. Gems x2.' },
  { id:'swarm',  name:'THE SWARM',   desc:'+60% monsters, but they are weaker.' },
  { id:'short',  name:'SHORT DAYS',  desc:'Days last half as long. Gems x1.5.' },
  { id:'flat',   name:'FLATLANDS',   desc:'A flat island with deep ore.' },
];

const MT = [
  { id:'nights', ev:'night',  kind:'max', vals:[2,3,5,7,10,13,16,20], txt:n => `Survive ${n} nights` },
  { id:'kills',  ev:'kill',   kind:'sum', vals:[40,100,250,500,1000], txt:n => `Defeat ${n} monsters` },
  { id:'mined',  ev:'mine',   kind:'sum', vals:[60,150,400,800,1600], txt:n => `Mine ${n} blocks` },
  { id:'fall',   ev:'fallkill',kind:'sum',vals:[5,15,40,100], txt:n => `Defeat ${n} monsters with a fall` },
  { id:'magma',  ev:'magma',  kind:'sum', vals:[3,10,25], txt:n => `Burn ${n} monsters in magma` },
  { id:'crystal',ev:'crystal',kind:'sum', vals:[3,8,20,40], txt:n => `Mine ${n} crystals` },
  { id:'towers', ev:'tower',  kind:'sum', vals:[5,15,40], txt:n => `Build ${n} towers` },
  { id:'boss',   ev:'boss',   kind:'sum', vals:[1,3,6], txt:n => `Defeat ${n} Stone Warden${n > 1 ? 's' : ''}` },
  { id:'blastk', ev:'blastkill',kind:'sum',vals:[10,30,80], txt:n => `Defeat ${n} monsters with explosions` },
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'digfort_save_v1';
function defSave(){
  return {
    v:1, gems:0, best:0, bestNight:0, xp:0, level:1, runs:0,
    meta:{ pick:0, heart:0, kit:0, luck:0 },
    unlock:{ blast:false, fire:false, spire:false },
    themes:['meadow'], theme:'meadow',
    missions:[], mTier:{}, missionsDone:0, mNew:false,
    stats:{ kills:0, mined:0, nights:0 },
    tut:false,
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
function loadSave(){
  let raw = null;
  const d = SDK.data();
  try{ if(d) raw = d.getItem(SAVE_KEY); }catch(e){}
  if(!raw && !d){ try{ raw = localStorage.getItem(SAVE_KEY); }catch(e){} }
  if(raw){ try{ save = mergeInto(defSave(), JSON.parse(raw)); }catch(e){ save = defSave(); } }
}
let _saveT = 0;
// On CrazyGames the SDK Data Module is the only store; LocalStorage is the off-portal fallback.
function writeSave(){
  const s = JSON.stringify(save), d = SDK.data();
  if(d){ try{ d.setItem(SAVE_KEY, s); }catch(e){} return; }
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
function persist(){ clearTimeout(_saveT); _saveT = setTimeout(writeSave, 250); }
function xpNeed(lv){ return 500 + lv * 300; }
