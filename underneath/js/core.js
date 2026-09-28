'use strict';
/* ---------------- utils ---------------- */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const $ = id => document.getElementById(id);
const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
function fmt(n){
  n = Math.floor(n);
  if(n < 100000) return n.toLocaleString('en-US');
  let i = 0; while(n >= 1000 && i < SUF.length - 1){ n /= 1000; i++; }
  return (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)) + SUF[i];
}
function mulberry32(s){ return function(){ s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s){ let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function todayKey(){ const d = new Date(); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); }
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
function mixHex(a, b, t){
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const c = s => Math.round(lerp(x >> s & 255, y >> s & 255, t));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}

/* ---------------- the painting grid ---------------- */
const PW = 720, CS = 4, GN = PW / CS;       // 180 x 180 cells of grime

/* ---------------- the eight worlds, one inside the next ---------------- */
const BIOMES = [
  { id:'meadow', name:'Sunny Meadow',     cover:['#d8cfbd', '#9c8a6c', '#6b6258'], root:60, mode:[0, 2, 4, 7, 9],
    critters:[['butterfly', '🦋', 'Butterfly'], ['ladybug', '🐞', 'Ladybug'], ['bee', '🐝', 'Honey Bee'], ['snail', '🐌', 'Snail']], relic:['Sun Medallion', '🌻'] },
  { id:'sea',    name:'Coral Deep',       cover:['#c9d6cf', '#6f8a80', '#4a5a58'], root:57, mode:[0, 3, 5, 7, 10],
    critters:[['clown', '🐠', 'Clownfish'], ['crab', '🦀', 'Crab'], ['octo', '🐙', 'Octopus'], ['puffer', '🐡', 'Pufferfish']], relic:['Pearl Crown', '🐚'] },
  { id:'jungle', name:'Jungle Ruins',     cover:['#b9c49a', '#6e7a4a', '#4e5238'], root:62, mode:[0, 2, 5, 7, 9],
    critters:[['frog', '🐸', 'Tree Frog'], ['parrot', '🦜', 'Parrot'], ['monkey', '🐒', 'Monkey'], ['snake', '🐍', 'Jade Snake']], relic:['Jade Idol', '🗿'] },
  { id:'desert', name:'Glass Desert',     cover:['#e4c9a0', '#b08a5a', '#7a5a3a'], root:58, mode:[0, 1, 4, 5, 7],
    critters:[['scorpion', '🦂', 'Scorpion'], ['lizard', '🦎', 'Lizard'], ['camel', '🐪', 'Camel'], ['eagle', '🦅', 'Sand Eagle']], relic:['Glass Scarab', '🔮'] },
  { id:'city',   name:'Clockwork City',   cover:['#c8bfb8', '#7e726c', '#4e4644'], root:55, mode:[0, 3, 5, 6, 10],
    critters:[['owl', '🦉', 'Brass Owl'], ['mouse', '🐭', 'Gear Mouse'], ['cat', '🐈', 'Rooftop Cat'], ['robot', '🤖', 'Tin Robot']], relic:['Golden Cog', '⚙️'] },
  { id:'aurora', name:'Aurora Peaks',     cover:['#e6eef2', '#9aaab8', '#5e6a78'], root:64, mode:[0, 2, 4, 7, 11],
    critters:[['penguin', '🐧', 'Penguin'], ['fox', '🦊', 'Snow Fox'], ['wolf', '🐺', 'Ice Wolf'], ['hare', '🐇', 'Snow Hare']], relic:['Frost Star', '❄️'] },
  { id:'cosmos', name:'Cosmos',           cover:['#a9a4c4', '#5e5a80', '#34304e'], root:53, mode:[0, 2, 3, 7, 8],
    critters:[['whale', '🐋', 'Star Whale'], ['alien', '👾', 'Space Blob'], ['unicorn', '🦄', 'Nebula Unicorn'], ['ufo', '🛸', 'Lost Saucer']], relic:['Comet Heart', '☄️'] },
  { id:'core',   name:'The Core',         cover:['#e8d8a8', '#b8964a', '#7a5a22'], root:67, mode:[0, 4, 7, 9, 11],
    critters:[['dragon', '🐉', 'Gold Dragon'], ['peacock', '🦚', 'Peacock'], ['turtle', '🐢', 'World Turtle'], ['swan', '🦢', 'Swan']], relic:['The First Brush', '🖌️'] },
];
const CRITTERS = []; BIOMES.forEach((b, bi) => b.critters.forEach(([id, e, name]) => CRITTERS.push({ id, e, name, bi })));

/* ---------------- upgrades ---------------- */
const UPG = [
  { id:'brush',  icon:'🖌️', name:'Wider Brush',    base:18,   k:1.6,  max:20, eff:l => `Brush size ${Math.round(brushR(l))}` },
  { id:'power',  icon:'💪', name:'Stiff Bristles', base:30,   k:1.33, max:999, eff:l => `Scrub power x${fmtX(brushP(l))}` },
  { id:'moth',   icon:'🦋', name:'Dust Moths',     base:75,   k:1.9,  max:20, eff:l => `${l} moth${l === 1 ? '' : 's'} scrub for you` },
  { id:'value',  icon:'💰', name:'Appraiser',      base:120,  k:2.1,  max:300, eff:l => `Everything worth x${Math.pow(1.25, l).toFixed(2)}` },
  { id:'lens',   icon:'🔍', name:'Sonar Lens',     base:260,  k:1.75, max:10, eff:l => l ? `Pings hidden treasure every ${lensT(l)}s` : 'Pings hidden treasure' },
  { id:'blast',  icon:'💥', name:'Firecrackers',   base:420,  k:1.8,  max:12, eff:l => l ? `A firecracker every ${blastT(l)}s` : 'Blast away big patches' },
  { id:'luck',   icon:'🍀', name:'Lucky Charm',    base:700,  k:1.85, max:15, eff:l => `+${l * 8}% treasure · shiny x${(1 + l * .25).toFixed(2)}` },
  { id:'queen',  icon:'👑', name:'Moth Queen',     base:900,  k:1.4,  max:999, eff:l => `Moths scrub x${fmtX(mothP(l))}` },
];
const brushR = l => 24 + l * 1.8;
const brushP = l => 1 + .22 * l;
const mothP = l => 1 + .3 * l;
const hpMul = d => 1 + .55 * (d - 1);
const fmtX = v => v < 100 ? v.toFixed(2) : fmt(v);
const lensT = l => Math.max(3, 13 - l);
const blastT = l => Math.max(8, 40 - l * 3);
const upCost = (u, l) => Math.ceil(u.base * Math.pow(u.k, l));

/* ---------------- secrets: only riddles are shown ---------------- */
const SECRETS = [
  { id:'whirl',  name:'Whirlwind',        riddle:'Round and round, the dust will spin.',        how:'Draw a circle while scrubbing to summon a whirlwind.' },
  { id:'zig',    name:'Lightning Scrub',  riddle:'Strike back and forth like a storm.',         how:'Scrub in a fast zigzag to call lightning.' },
  { id:'drill',  name:'The Drill',        riddle:'Patience digs deepest.',                      how:'Hold your brush still for 3 seconds to drill for fossils.' },
  { id:'rain',   name:'Rainfall',         riddle:'Never stop, and the sky will help.',          how:'Keep a scrubbing streak going for 30 seconds.' },
  { id:'eye',    name:'The Golden Eye',   riddle:'Something is watching. Look back.',           how:'Tap the golden eye when it opens for a golden brush.' },
  { id:'vault',  name:'The Glyph Vault',  riddle:'Three stones remember what the wall says.',   how:'Tap the glyph stones in the order carved on the plaque.' },
  { id:'mini',   name:'Miniature',        riddle:'Some paintings hide inside paintings.',       how:'Tap a tiny framed painting to enter it.' },
  { id:'sign',   name:'The Artist\'s Mark', riddle:'Every artist signs their work. Knock three times.', how:'Tap the painter\'s signature three times.' },
  { id:'shiny',  name:'Shiny!',           riddle:'Not every creature is ordinary.',             how:'Catch a golden shiny creature.' },
  { id:'master', name:'Masterpiece',      riddle:'Leave nothing hidden.',                       how:'Restore a painting completely.' },
  { id:'core',   name:'The Core',         riddle:'Go as deep as deep goes.',                    how:'Reach The Core, depth 8.' },
  { id:'loop',   name:'All The Way Down', riddle:'What lies beneath the Core?',                 how:'Dive through the Core and start again, richer.' },
];
const LORE = [
  'I started painting over my paintings when I ran out of canvas. Then I could not stop.',
  'Under the meadow there is a sea. I painted it first. I think.',
  'Every keyhole I paint opens onto the one before. Or the one after. I lose track.',
  'The creatures keep moving between layers. I did not paint them there.',
  'The clocks in the city run backwards whenever someone is scrubbing.',
  'I hid a golden eye in every painting, so I could watch whoever finds them.',
  'The stars in the Cosmos layer are just specks of the meadow sun, very far down.',
  'Beneath the Core is the first painting I ever made. You have already seen it.',
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'underneath_save_v1';
function defSave(){
  return {
    v:1, dust:0, earned:0, depth:1, maxDepth:1,
    up:{ brush:0, power:0, moth:0, value:0, lens:0, blast:0, luck:0, queen:0 },
    critters:{}, shiny:{}, relics:{}, secrets:{}, lore:[],
    canvas:null, lastT:0,
    stats:{ cells:0, finds:0, dives:0, masters:0, vaults:0, bestStreak:0 },
    daily:{ key:'' }, tut:0,
    opt:{ sfx:true, music:true, fx:'high' },
  };
}
let save = defSave();
function mergeInto(base, src){
  for(const k in src){
    if(!(k in base)){ base[k] = src[k]; continue; }
    const b = base[k], s = src[k];
    if(b && typeof b === 'object' && !Array.isArray(b) && s && typeof s === 'object' && !Array.isArray(s)) mergeInto(b, s);
    else if(s !== undefined && (b === null || (typeof s === typeof b && Array.isArray(s) === Array.isArray(b)))) base[k] = s;
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
function writeSave(){
  save.lastT = Date.now();
  if(typeof snapCanvas === 'function') snapCanvas();
  const s = JSON.stringify(save), d = SDK.data();
  if(d){ try{ d.setItem(SAVE_KEY, s); }catch(e){} return; }
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
let _saveT = 0;
function persist(){ clearTimeout(_saveT); _saveT = setTimeout(writeSave, 400); }
