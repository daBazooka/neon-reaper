'use strict';
/* =====================================================================
   BO KATA — core: utils, game data, save
   ===================================================================== */
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
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
function mixHex(a, b, t){
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const c = s => Math.round(lerp(x >> s & 255, y >> s & 255, t));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}
function dayNum(){ return Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5); }

/* ---------------- world ---------------- */
let WW = 3600;              // world width (set per match)
const GROUND = 1900;        // street level (y grows downward)
const CEIL = 60;            // top of the sky
const LINE_MAX = 1350;      // how much thread the spool holds

/* ---------------- arenas: the trophy road through six festival skies ----------------
   sky: [top, mid, horizon], sun: [color, x 0..1, y 0..1, size], b: building palette */
const ARENAS = [
  { id:'gully',   name:'Gully Rooftops', tr:0,    sky:['#5fb7e8', '#9fd6f0', '#ffe7c2'], sun:['#fff4c8', .78, .22, 70],  haze:'#ffe2b8', b:['#e9c9a3', '#d8a47f', '#c98f6f', '#f0dcc0', '#b9d3c8', '#e6b8b8'], trim:'#8a5a44', far:'#b7cfe0', mid:'#9fb8cf', clouds:.7, mood:'day' },
  { id:'pink',    name:'Pink City',      tr:150,  sky:['#6a8fd6', '#e9a6c0', '#ffd2a1'], sun:['#ffe0a8', .25, .3, 90],  haze:'#ffc9a8', b:['#e89a86', '#d97f73', '#f0b49a', '#c96f68', '#f3c7a8', '#e3a28a'], trim:'#8f3f3a', far:'#d9a3b8', mid:'#c98ea5', clouds:.5, mood:'dusk' },
  { id:'ghats',   name:'River Ghats',    tr:400,  sky:['#3f79c2', '#f2b36f', '#ffcf86'], sun:['#fff0b0', .62, .42, 110], haze:'#ffc27a', b:['#e8c48a', '#d9a86a', '#c98d5a', '#f0d6a4', '#b87f58', '#e0b27a'], trim:'#7a4a2a', far:'#e0a877', mid:'#c98a5e', clouds:.4, mood:'gold' },
  { id:'fort',    name:'Desert Fort',    tr:800,  sky:['#2d4d8f', '#e0785a', '#ffb070'], sun:['#ffd08a', .82, .5, 120], haze:'#ff9f6a', b:['#d9955e', '#c47a48', '#e8b07a', '#b8683c', '#d08a56', '#a95c34'], trim:'#5e2f18', far:'#b86a50', mid:'#9c5540', clouds:.3, mood:'dusk' },
  { id:'monsoon', name:'Monsoon Sky',    tr:1300, sky:['#5a6f88', '#8fa6b8', '#d2dccf'], sun:['#fffbe8', .3, .18, 60],  haze:'#cfd8cc', b:['#9fb59a', '#c9c2a8', '#8ea8a0', '#d6cdb4', '#a7b8b8', '#b8a88f'], trim:'#4d5a52', far:'#8ea2ae', mid:'#788d98', clouds:1,  mood:'rain' },
  { id:'pantai',  name:'Pantai Layang',  tr:1650, sky:['#2f8fd8', '#7fd0f0', '#ffe9b8'], sun:['#fff6d0', .7, .2, 80],  haze:'#bfeaf0', b:['#b8804f', '#c99461', '#a36f42', '#d8a870', '#8f5f38', '#c08650'], trim:'#5a3418', far:'#5fb8c8', mid:'#3f9fb0', clouds:.6, mood:'beach', music:'gamelan' },
  { id:'lantern', name:'Lantern Night',  tr:2100, sky:['#0c1030', '#2a2358', '#6b3a6e'], sun:['#fff6d8', .8, .16, 46],  haze:'#6b3a6e', b:['#3a3358', '#453c63', '#2f2a4a', '#51466e', '#3d3560', '#2a2545'], trim:'#1a1630', far:'#2a2550', mid:'#221e44', clouds:.2, mood:'night' },
];
const arenaFor = tr => { let a = ARENAS[0]; for(const x of ARENAS) if(tr >= x.tr) a = x; return a; };

/* ---------------- kites (patang) ----------------
   pat: panel pattern · c: colors · spd / agi / stab: flight feel (1 = average) */
const RARITY = [
  { n:'Common',    c:'#8fb7c9' },
  { n:'Rare',      c:'#4fa3ff' },
  { n:'Epic',      c:'#b56bff' },
  { n:'Legendary', c:'#ffb52e' },
];
const KITES = [
  { id:'lal',     n:'Laal Patang',    r:0, pat:'solid',   c:['#e23b3b', '#fff1d6'],            spd:1,    agi:1,    stab:1 },
  { id:'chand',   n:'Chand Tara',     r:0, pat:'moon',    c:['#1f7a5a', '#fff4d0'],            spd:1,    agi:1.03, stab:1 },
  { id:'adha',    n:'Aadha Aadha',    r:0, pat:'split',   c:['#ffcf2e', '#2b59c3'],            spd:1.03, agi:1,    stab:1 },
  { id:'chauk',   n:'Chaukada',       r:0, pat:'quad',    c:['#ff7aa8', '#ffffff', '#3a3a7a'], spd:1,    agi:1.02, stab:1.02 },
  { id:'patti',   n:'Patti',          r:0, pat:'band',    c:['#ff8a1e', '#1b1b3a'],            spd:1.02, agi:1,    stab:1.02 },
  { id:'aankh',   n:'Aankh',          r:1, pat:'eye',     c:['#ffffff', '#111133', '#e23b3b'], spd:1.04, agi:1.06, stab:1 },
  { id:'teer',    n:'Teer',           r:1, pat:'chevron', c:['#26b3a3', '#ffe9c0', '#133b49'], spd:1.07, agi:1.03, stab:1 },
  { id:'sitara',  n:'Sitara',         r:1, pat:'star',    c:['#2b2b7a', '#ffd23a'],            spd:1.03, agi:1.05, stab:1.03 },
  { id:'lehar',   n:'Lehar',          r:1, pat:'wave',    c:['#3fa9f5', '#e6f7ff', '#1b5fa0'], spd:1.05, agi:1.04, stab:1.02 },
  { id:'bindi',   n:'Bindi',          r:1, pat:'dots',    c:['#ff5f8f', '#ffe6ef'],            spd:1.02, agi:1.07, stab:1.03 },
  { id:'suraj',   n:'Suraj',          r:2, pat:'sun',     c:['#ff9f1a', '#ffe36e', '#c2410c'], spd:1.08, agi:1.07, stab:1.04 },
  { id:'kamal',   n:'Kamal',          r:2, pat:'lotus',   c:['#ff8ab8', '#ffffff', '#2f7a4a'], spd:1.06, agi:1.09, stab:1.05 },
  { id:'sher',    n:'Sher',           r:2, pat:'tiger',   c:['#ff9d2e', '#1d1208'],            spd:1.1,  agi:1.05, stab:1.04 },
  { id:'mor',     n:'Mor Pankh',      r:2, pat:'peacock', c:['#0f6d7a', '#39c3a6', '#2b3fa0', '#ffd23a'], spd:1.07, agi:1.1, stab:1.05 },
  { id:'indra',   n:'Indradhanush',   r:3, pat:'rainbow', c:['#e23b3b', '#ff9d2e', '#ffd23a', '#3fbf5f', '#3fa9f5', '#7a4ad8'], spd:1.12, agi:1.1, stab:1.08 },
  { id:'agni',    n:'Agni',           r:3, pat:'flame',   c:['#2a0a0a', '#ff4a1a', '#ffc23a'], spd:1.15, agi:1.08, stab:1.06 },
  { id:'nilkanth',n:'Neelkanth',      r:3, pat:'bird',    c:['#1b3a8f', '#6fd0ff', '#ffe28a'], spd:1.1,  agi:1.14, stab:1.08 },
  { id:'raat',    n:'Chandni Raat',   r:3, pat:'night',   c:['#0c1030', '#ffe8a8', '#6b5bd6'], spd:1.12, agi:1.12, stab:1.1 },
  // more patangs
  { id:'paan',    n:'Paan Patta',     r:0, pat:'leaf',    c:['#fff1d6', '#2f9a4a', '#1d6b30'], spd:1.01, agi:1.02, stab:1.01 },
  { id:'chakri',  n:'Chakri',         r:1, pat:'spiral',  c:['#ffe36e', '#e23b3b', '#2b59c3'], spd:1.04, agi:1.06, stab:1.02 },
  { id:'holi',    n:'Holi Rang',      r:1, pat:'splash',  c:['#ffffff', '#ff3d7f', '#ffd23a', '#26b3a3', '#7a4ad8'], spd:1.05, agi:1.05, stab:1.03 },
  { id:'diya',    n:'Diya',           r:2, pat:'diya',    c:['#3a1a4a', '#ff9d2e', '#ffe36e'], spd:1.07, agi:1.06, stab:1.06 },
  { id:'mehendi', n:'Mehendi',        r:2, pat:'mehendi', c:['#f3d7a8', '#8a3a12'], spd:1.06, agi:1.09, stab:1.05 },
  { id:'shatranj',n:'Shatranj',       r:1, pat:'checker', c:['#111122', '#fff4e0'], spd:1.05, agi:1.04, stab:1.04 },
  { id:'tukkal',  n:'Tukkal',         r:3, pat:'lantern', c:['#2a1030', '#ffcf6e', '#ff6a3a'], spd:1.12, agi:1.1, stab:1.12, glow:1 },
  // Malaysian wau: the moon kite with its crescent tail
  { id:'waubulan',n:'Wau Bulan',      r:2, shape:'wau', pat:'floral',  c:['#1d4fa8', '#ffd23a', '#e23b3b', '#ffffff'], spd:1.06, agi:1.08, stab:1.1 },
  { id:'waukucing',n:'Wau Kucing',    r:1, shape:'wau', pat:'split',   c:['#ff8a1e', '#fff1d6'], spd:1.03, agi:1.05, stab:1.08 },
  { id:'waumerak',n:'Wau Merak',      r:2, shape:'wau', pat:'peacock', c:['#0f6d7a', '#39c3a6', '#2b3fa0', '#ffd23a'], spd:1.07, agi:1.07, stab:1.1 },
  { id:'wauhelang',n:'Wau Helang',    r:2, shape:'wau', pat:'bird',    c:['#6a3a1a', '#f3d7a8', '#ffd23a'], spd:1.09, agi:1.05, stab:1.09 },
  { id:'jalabudi',n:'Wau Jala Budi',  r:3, shape:'wau', pat:'floral',  c:['#7a1030', '#ffd23a', '#26b3a3', '#fff6d8'], spd:1.12, agi:1.1, stab:1.14 },
  // layang-layang: Indonesian and Malaysian fighting kites with long tails
  { id:'aduan',   n:'Layang Aduan',   r:0, shape:'layang', pat:'band',  c:['#e23b3b', '#ffffff'], spd:1.03, agi:1.03, stab:1 },
  { id:'pelangi', n:'Layang Pelangi', r:1, shape:'layang', pat:'rainbow', c:['#e23b3b', '#ff9d2e', '#ffd23a', '#3fbf5f', '#3fa9f5', '#7a4ad8'], spd:1.05, agi:1.05, stab:1.03 },
  { id:'batik',   n:'Layang Batik',   r:2, shape:'layang', pat:'batik', c:['#5a2a10', '#e8b25a', '#fff1d0'], spd:1.08, agi:1.07, stab:1.05 },
  { id:'naga',    n:'Layang Naga',    r:3, shape:'layang', pat:'dragon', c:['#0e5a3a', '#ffd23a', '#e23b3b'], spd:1.14, agi:1.1, stab:1.07 },
  { id:'pantai',  n:'Layang Pantai',  r:1, shape:'layang', pat:'wave',  c:['#3fa9f5', '#fff4d6', '#1b5fa0'], spd:1.05, agi:1.04, stab:1.04 },
  // Japanese rokkaku fighting kites
  { id:'koi',     n:'Rokkaku Koi',    r:2, shape:'rokkaku', pat:'koi',    c:['#fff4e0', '#ff5a1e', '#1b1b2a'], spd:1.06, agi:1.04, stab:1.12 },
  { id:'sakura',  n:'Rokkaku Sakura', r:1, shape:'rokkaku', pat:'sakura', c:['#ffe3ec', '#ff7aa8', '#6a2a3a'], spd:1.03, agi:1.03, stab:1.1 },
  { id:'tsuru',   n:'Rokkaku Tsuru',  r:3, shape:'rokkaku', pat:'crane',  c:['#fff8ec', '#1b1b2a', '#e23b3b'], spd:1.1, agi:1.1, stab:1.15 },
  { id:'nami',    n:'Rokkaku Nami',   r:2, shape:'rokkaku', pat:'wave',   c:['#e6f3ff', '#1b5fa0', '#3fa9f5'], spd:1.07, agi:1.05, stab:1.12 },
  // Brazilian pipa
  { id:'pipa',    n:'Pipa Carioca',   r:1, shape:'pipa', pat:'chevron', c:['#3fbf5f', '#ffd23a', '#2b59c3'], spd:1.06, agi:1.08, stab:1 },
  { id:'arraia',  n:'Arraia',         r:2, shape:'pipa', pat:'quad',    c:['#ff3d7f', '#ffffff', '#111133'], spd:1.09, agi:1.09, stab:1.02 },
  { id:'sol',     n:'Pipa do Sol',    r:3, shape:'pipa', pat:'sun',     c:['#ff9f1a', '#ffe36e', '#c2410c'], spd:1.14, agi:1.12, stab:1.05 },
];

/* ---------------- spools (charkhi / firki / gelendong): the friend's reel ----------------
   line: thread length · acc: pull power · pay: how fast slack pays out */
const SPOOLS = [
  { id:'bamboo',  n:'Bamboo Charkhi',     c:['#c9923e', '#e8c07a'], line:1,    acc:1,    pay:1,    cost:0,     d:'Light and trusty, made by hand.' },
  { id:'neem',    n:'Neem Wood Firki',    c:['#8a5a2a', '#d8b27a'], line:1.05, acc:1,    pay:1.12, cost:700,   d:'Lets slack out quickly for a dheel.' },
  { id:'lacquer', n:'Lacquer Charkhi',    c:['#c0262e', '#2f9a4a'], line:1.04, acc:1.05, pay:1.08, cost:1600,  d:'Bright lac-turned wood. Snappier pulls.' },
  { id:'brass',   n:'Brass Charkhi',      c:['#c89b2a', '#ffe08a'], line:1.1,  acc:1.03, pay:1.1,  cost:3000,  d:'Holds far more thread.' },
  { id:'gelendong',n:'Kelantan Gelendong',c:['#1d4fa8', '#ffd23a'], line:1.08, acc:1.06, pay:1.18, cost:5000,  d:'The wau flyer\'s reel from the east coast.' },
  { id:'silver',  n:'Silver Charkhi',     c:['#b8c0cc', '#ffffff'], line:1.12, acc:1.07, pay:1.18, cost:8000,  d:'Smooth as moonlight.' },
  { id:'golden',  n:'Golden Charkhi',     c:['#d99a0a', '#fff0a0'], line:1.15, acc:1.08, pay:1.22, cost:12000, d:'For the legends of the rooftops.' },
];
const spoolById = id => SPOOLS.find(s => s.id === id) || SPOOLS[0];
const kiteById = id => KITES.find(k => k.id === id) || KITES[0];

/* ---------------- thread (manja): strength resists cuts, sharpness cuts faster ---------------- */
const THREADS = [
  { id:'red',    n:'Laal',     c:'#e0303a', cost:0 },
  { id:'pink',   n:'Gulabi',   c:'#ff5fa2', cost:300 },
  { id:'gold',   n:'Sunehri',  c:'#ffc02e', cost:600 },
  { id:'green',  n:'Hara',     c:'#2fbf5a', cost:600 },
  { id:'blue',   n:'Neela',    c:'#2f8fff', cost:900 },
  { id:'white',  n:'Safed',    c:'#f4f1e8', cost:1200 },
  { id:'black',  n:'Kaala',    c:'#1b1b22', cost:1500 },
  { id:'rainbow',n:'Satrangi', c:'rainbow', cost:4000 },
];
const MANJA_MAX = 12;
const manjaCost = l => Math.round(80 * Math.pow(1.55, l));

/* ---------------- flyers ---------------- */
const NAMES = ['Chintu', 'Pappu', 'Guddu', 'Bittu', 'Laddoo', 'Raju', 'Sonu', 'Monu', 'Pinky', 'Tinku', 'Zoya', 'Aarav', 'Kabir', 'Meher', 'Ishaan', 'Noor', 'Rohan', 'Anaya', 'Faiz', 'Tara', 'Veer', 'Riya', 'Ayaan', 'Jugnu', 'Babloo', 'Chhotu', 'Munna', 'Golu', 'Rani', 'Sufi', 'Arjun', 'Laila', 'Kiki', 'Dev', 'Maya', 'Raza'];
const SKIN = ['#8d5a3b', '#a86b45', '#c58a5c', '#e0ab7d', '#6f4430'];
const SHIRT = ['#e23b3b', '#2b59c3', '#ffcf2e', '#26b3a3', '#ff7aa8', '#7a4ad8', '#ff8a1e', '#3fbf5f', '#ffffff'];

/* ---------------- trophy road ---------------- */
const ROAD = [
  { tr:30,   rw:{ coins:150 } },
  { tr:80,   rw:{ kite:'aankh' } },
  { tr:150,  rw:{ coins:300 } },
  { tr:250,  rw:{ kite:'teer' } },
  { tr:400,  rw:{ coins:500 } },
  { tr:550,  rw:{ kite:'suraj' } },
  { tr:800,  rw:{ coins:800 } },
  { tr:1050, rw:{ kite:'kamal' } },
  { tr:1200, rw:{ spool:'neem' } },
  { tr:1300, rw:{ coins:1200 } },
  { tr:1650, rw:{ kite:'mor' } },
  { tr:2000, rw:{ coins:2000 } },
  { tr:1850, rw:{ kite:'waubulan' } },
  { tr:2200, rw:{ spool:'brass' } },
  { tr:2500, rw:{ kite:'indra' } },
  { tr:2900, rw:{ kite:'naga' } },
  { tr:3200, rw:{ kite:'raat' } },
  { tr:3600, rw:{ spool:'golden' } },
];

/* ---------------- daily quests ---------------- */
const QUESTS = [
  { id:'cut',   n:c => `Cut ${c} kites`,               v:[5, 8, 12],  coins:[120, 180, 260] },
  { id:'loot',  n:c => `Loot ${c} falling kites`,      v:[2, 4, 6],   coins:[120, 180, 260] },
  { id:'win',   n:c => `Finish top 3 in ${c} Sky Battle${c > 1 ? 's' : ''}`, v:[1, 2, 3], coins:[150, 220, 300] },
  { id:'duel',  n:c => `Win ${c} Duel${c > 1 ? 's' : ''}`, v:[1, 2, 3],   coins:[150, 220, 300] },
  { id:'pench', n:c => `Win ${c} penches from above`,  v:[2, 4, 6],   coins:[120, 180, 240] },
  { id:'play',  n:c => `Play ${c} matches`,            v:[2, 3, 5],   coins:[100, 150, 220] },
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'bokata_save_v1';
function defSave(){
  return {
    v:1, name:'', coins:200, trophies:0, best:0,
    kites:['lal', 'chand', 'adha', 'aduan'], kite:'lal', newKites:[], thread:'red', threads:['red'], spool:'bamboo', spools:['bamboo'],
    manja:{ str:0, sharp:0 }, road:0, look:{ skin:2, shirt:0 },
    stats:{ cuts:0, loots:0, matches:0, wins:0, duels:0, duelWins:0, best:0, penchWins:0 },
    quests:{ day:0, list:[] }, gift:{ day:0, streak:0 },
    shop:{ day:0, items:[] }, tut:0, seen:{},
    opt:{ sfx:true, music:true, vib:true, ctrl:'point', quality:'auto', left:false, online:false, server:'', names:true },
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
// On CrazyGames the SDK Data Module is the only store; LocalStorage is used everywhere else.
function loadSave(){
  let raw = null; const d = typeof SDK !== 'undefined' ? SDK.data() : null;
  try{ if(d) raw = d.getItem(SAVE_KEY); }catch(e){}
  if(!raw && !d){ try{ raw = localStorage.getItem(SAVE_KEY); }catch(e){} }
  if(raw){ try{ save = mergeInto(defSave(), JSON.parse(raw)); }catch(e){ save = defSave(); } }
}
let _saveT = 0;
function writeSave(){
  const s = JSON.stringify(save), d = typeof SDK !== 'undefined' ? SDK.data() : null;
  if(d){ try{ d.setItem(SAVE_KEY, s); }catch(e){} return; }
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
function persist(){ clearTimeout(_saveT); _saveT = setTimeout(writeSave, 250); }
