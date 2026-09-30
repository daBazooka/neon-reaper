'use strict';
/* =====================================================================
   KALEIDREAM core: helpers, game data (dream modes, twists, dreamers,
   cosmetics, missions) and the save.
   ===================================================================== */
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const TAU = Math.PI * 2;
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'K' : String(Math.floor(n));
// hues are snapped to 6° steps so cached glow sprites get reused
const hsl = (h, s, l, a) => { h = ((Math.round(h / 6) * 6) % 360 + 360) % 360; return a === undefined ? `hsl(${h},${s}%,${l}%)` : `hsla(${h},${s}%,${l}%,${a})`; };
const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const yesterday = () => { const d = new Date(Date.now() - 864e5); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

/* ---------------- dream modes: the game becomes a new game every shift ---------------- */
const MODES = {
  fly:   { name:'FLY!',        how:'Tap to flap',                  ctl:'tap',   unlock:1, dur:9 },
  dodge: { name:'DODGE!',      how:'Move to dodge the rain',       ctl:'steer', unlock:1, dur:9 },
  run:   { name:'RUN!',        how:'Tap to jump · double jump',    ctl:'tap',   unlock:1, dur:9 },
  orbit: { name:'ORBIT!',      how:'Tap to switch rings',          ctl:'tap',   unlock:2, dur:9 },
  smash: { name:'GIANT MODE!', how:'Move to smash the tiny town',  ctl:'steer', unlock:3, dur:6.5 },
  dive:  { name:'DIVE!',       how:'Move left and right',          ctl:'steer', unlock:4, dur:9 },
  beat:  { name:'DANCE!',      how:'Tap when the notes hit you',   ctl:'tap',   unlock:5, dur:8.5 },
  paint: { name:'PAINT!',      how:'Colour the grey bubbles',      ctl:'steer', unlock:6, dur:8 },
  grow:  { name:'GROW!',       how:'Eat smaller, flee bigger',     ctl:'steer', unlock:7, dur:9 },
};
const MODE_IDS = Object.keys(MODES);
const modesFor = lvl => MODE_IDS.filter(m => MODES[m].unlock <= lvl);

/* ---------------- twists: something unexpected every few seconds ---------------- */
// in: which dream modes it can appear in ('*' = all)
const TWISTS = [
  { id:'disco',   name:'DISCO DREAM!',        txt:'Stars worth x2',            col:'#ff5ad0', in:'*' },
  { id:'candy',   name:'CANDY RAIN!',         txt:'Sweets fall from the sky',  col:'#ff9ad8', in:['dodge', 'dive', 'paint', 'grow', 'smash', 'fly', 'run'] },
  { id:'tiny',    name:'TINY ME!',            txt:'You shrink',                col:'#8affff', in:['fly', 'dodge', 'dive', 'run', 'orbit', 'paint'] },
  { id:'mega',    name:'MEGA ME!',            txt:'Crush everything',          col:'#ffb02a', in:['fly', 'dodge', 'dive', 'run', 'paint', 'orbit'] },
  { id:'slowmo',  name:'SLOW MOTION...',      txt:'Time gets sleepy',          col:'#9a8aff', in:'*' },
  { id:'flip',    name:'UPSIDE DOWN!',        txt:'The world flips over',      col:'#5affb0', in:['fly', 'dodge', 'dive', 'run', 'smash', 'paint', 'grow'] },
  { id:'mirror',  name:'MIRROR WORLD!',       txt:'Left is right',             col:'#8ad8ff', in:['fly', 'dodge', 'dive', 'run', 'orbit', 'smash', 'paint', 'grow'] },
  { id:'ghost',   name:'GHOST MODE!',         txt:'Nothing can hurt you',      col:'#e0e8ff', in:'*' },
  { id:'critter', name:'FRIENDLY NIGHTMARES!',txt:'Monsters want hugs',        col:'#ff9ab0', in:['fly', 'dodge', 'dive', 'run', 'orbit', 'paint'] },
  { id:'rainbow', name:'RAINBOW ROAD!',       txt:'Everything scores x2',      col:'#ffe45a', in:'*' },
  { id:'dark',    name:'LIGHTS OUT!',         txt:'Only you glow',             col:'#6a6aff', in:['fly', 'dodge', 'dive', 'run', 'orbit', 'grow'] },
  { id:'magnet',  name:'STAR MAGNET!',        txt:'Stars fly to you',          col:'#ffd23a', in:['fly', 'dodge', 'dive', 'run', 'orbit', 'paint'] },
  { id:'party',   name:'SURPRISE PARTY!',     txt:'Pop the balloons',          col:'#ff7a5a', in:['dodge', 'dive', 'paint', 'grow'] },
  { id:'meteor',  name:'METEOR SHOWER!',      txt:'Dodge the rocks, grab the gems', col:'#ff8a3a', in:['dodge', 'dive', 'paint'] },
  { id:'twin',    name:'DOUBLE TROUBLE!',     txt:'A clone helps you',         col:'#5ad8ff', in:['fly', 'dodge', 'dive', 'run', 'orbit', 'paint', 'grow'] },
  { id:'freeze',  name:'TIME FREEZE!',        txt:'Monsters turn to ice',      col:'#bff4ff', in:['fly', 'dodge', 'dive', 'run', 'orbit', 'paint'] },
  { id:'jackpot', name:'JACKPOT!',            txt:'Spinning the dream slots',  col:'#ffd23a', in:'*' },
  { id:'friend',  name:'A FRIEND APPEARS!',   txt:'They brought a gift',       col:'#7aef9a', in:'*' },
  { id:'jelly',   name:'JELLY WORLD!',        txt:'Everything wobbles',        col:'#ff6ab0', in:'*' },
  { id:'portal',  name:'PORTAL!',             txt:'Skipping ahead!',           col:'#b05aff', in:'*' },
  { id:'turbo',   name:'TURBO!',              txt:'Double speed, double stars', col:'#ff5a5a', in:['fly', 'dodge', 'dive', 'run', 'orbit', 'smash'] },
  { id:'storm',   name:'STAR STORM!',         txt:'Stars everywhere',          col:'#fff4a0', in:'*' },
  { id:'splash',  name:'COLOUR SPLASH!',      txt:'The dream repaints itself', col:'#5affd0', in:'*' },
  { id:'bighead', name:'BIG HEAD MODE!',      txt:'Why is your head so big?',  col:'#ffb07a', in:['fly', 'dodge', 'dive', 'orbit', 'paint', 'smash'] },
];
const TW = {}; for(const t of TWISTS) TW[t.id] = t;
const twistsFor = mode => TWISTS.filter(t => t.in === '*' || t.in.includes(mode));

/* ---------------- dreamers (characters) ---------------- */
// perk keys: hearts, mag, dust, shield, luck, slow, score, twist
const CHARS = [
  { id:'pip',    name:'Pip',    r:'C', col:'#7ad8ff', col2:'#3a8aff', feat:'none',    perk:{},                      desc:'Just happy to be here.' },
  { id:'zap',    name:'Zap',    r:'C', col:'#ffe45a', col2:'#ff9a2a', feat:'antenna', perk:{ mag:1 },               desc:'Stars drift towards Zap.' },
  { id:'fern',   name:'Fern',   r:'C', col:'#7aef9a', col2:'#2aa86a', feat:'leaf',    perk:{ dust:.2 },             desc:'+20% dream dust.' },
  { id:'mochi',  name:'Mochi',  r:'R', col:'#ffb0e0', col2:'#ff5aa8', feat:'bunny',   perk:{ hearts:1 },            desc:'+1 heart every dream.' },
  { id:'ember',  name:'Ember',  r:'R', col:'#ff8a4a', col2:'#e83a2a', feat:'horns',   perk:{ score:.25 },           desc:'+25% score.' },
  { id:'luna',   name:'Luna',   r:'R', col:'#b08aff', col2:'#6a4ae8', feat:'cat',     perk:{ luck:1 },              desc:'Finds more crystals.' },
  { id:'nimbus', name:'Nimbus', r:'E', col:'#f4f8ff', col2:'#a8b8e8', feat:'cloud',   perk:{ shield:1 },            desc:'Ignores the first hit of every dream.' },
  { id:'gummy',  name:'Gummy',  r:'E', col:'#4af0d0', col2:'#1a9a9a', feat:'drip',    perk:{ slow:.1 },             desc:'The dream moves 10% slower.' },
  { id:'pixel',  name:'Pixel',  r:'E', col:'#ff5a6a', col2:'#a82a4a', feat:'square',  perk:{ twist:.4 },            desc:'Good twists last 40% longer.' },
  { id:'cosmo',  name:'Cosmo',  r:'E', col:'#4a6aff', col2:'#2a1a8a', feat:'halo',    perk:{ mag:1, score:.15 },    desc:'Star magnet and +15% score.' },
  { id:'peach',  name:'Peach',  r:'L', col:'#ffc08a', col2:'#ff7a6a', feat:'sprout',  perk:{ hearts:1, dust:.3 },   desc:'+1 heart and +30% dust.' },
  { id:'glitch', name:'Glitch', r:'L', col:'#ffffff', col2:'#ff5ad0', feat:'crown',   perk:{ hearts:1, mag:1, score:.3, luck:1 }, desc:'Shifts colour. A bit of everything.' },
];
const HATS = [
  { id:'none', name:'No hat', r:'C' },
  { id:'party', name:'Party Hat', r:'C' }, { id:'bow', name:'Big Bow', r:'C' }, { id:'beanie', name:'Beanie', r:'C' },
  { id:'flower', name:'Flower', r:'C' }, { id:'tophat', name:'Top Hat', r:'R' }, { id:'phones', name:'Headphones', r:'R' },
  { id:'chef', name:'Chef Hat', r:'R' }, { id:'propeller', name:'Propeller Cap', r:'R' }, { id:'duck', name:'Rubber Duck', r:'E' },
  { id:'wizard', name:'Wizard Hat', r:'E' }, { id:'viking', name:'Viking Helmet', r:'E' }, { id:'ufo', name:'Tiny UFO', r:'L' },
  { id:'crown', name:'Royal Crown', r:'L' }, { id:'halo', name:'Halo', r:'L' },
];
const TRAILS = [
  { id:'sparkle', name:'Sparkles', r:'C' }, { id:'bubbles', name:'Bubbles', r:'C' }, { id:'hearts', name:'Hearts', r:'R' },
  { id:'notes', name:'Music Notes', r:'R' }, { id:'snow', name:'Snowflakes', r:'R' }, { id:'fire', name:'Fire', r:'E' },
  { id:'confetti', name:'Confetti', r:'E' }, { id:'rainbow', name:'Rainbow', r:'L' }, { id:'galaxy', name:'Galaxy', r:'L' },
];
const EMOTES = [
  { id:'happy', name:'Happy', r:'C' }, { id:'wink', name:'Wink', r:'C' }, { id:'silly', name:'Silly', r:'C' },
  { id:'wow', name:'Wow!', r:'R' }, { id:'laugh', name:'LOL', r:'R' }, { id:'love', name:'In Love', r:'R' },
  { id:'cool', name:'Too Cool', r:'E' }, { id:'angry', name:'Grr!', r:'E' }, { id:'sleepy', name:'Sleepy', r:'E' },
  { id:'starry', name:'Starstruck', r:'L' }, { id:'dizzy', name:'Dizzy', r:'L' },
];
const RARITY = { C:{ name:'Common', col:'#bfe0ff', w:60 }, R:{ name:'Rare', col:'#5ad8ff', w:28 }, E:{ name:'Epic', col:'#c07aff', w:10 }, L:{ name:'Legendary', col:'#ffd23a', w:2.5 } };
const KINDS = { c:{ list:CHARS, name:'Dreamer' }, h:{ list:HATS, name:'Hat' }, t:{ list:TRAILS, name:'Trail' }, e:{ list:EMOTES, name:'Emote' } };
const charById = id => CHARS.find(c => c.id === id) || CHARS[0];
const CAPSULE_COST = 150, GOLD_COST = 12;

/* ---------------- dreams (levels) ---------------- */
const ADJ = ['Jelly', 'Velvet', 'Upside', 'Marshmallow', 'Neon', 'Sleepy', 'Bubble', 'Cosmic', 'Candy', 'Whisper', 'Glitter', 'Moonlit', 'Fizzy', 'Wobbly', 'Crystal', 'Honey', 'Paper', 'Echo', 'Lava', 'Cloud', 'Pickle', 'Disco', 'Secret', 'Rubber'];
const NOUN = ['Moon', 'Circus', 'Ocean', 'Garden', 'Clockwork', 'Castle', 'Kitchen', 'Carnival', 'Library', 'Volcano', 'Aquarium', 'Express', 'Forest', 'Planet', 'Theatre', 'Playground', 'Desert', 'Lighthouse', 'Bakery', 'Museum', 'Galaxy'];
const dreamName = l => ADJ[(l * 7 + 3) % ADJ.length] + ' ' + NOUN[(l * 5 + 1) % NOUN.length];
const dreamHue = l => (l * 67 + 200) % 360;
const shiftsFor = l => Math.min(4 + Math.floor((l - 1) / 2), 9);
const speedFor = l => 1 + Math.min(.75, (l - 1) * .035);
const BOSSES = [
  { name:'THE ALARM CLOCK', look:'clock', col:'#ff5a5a' }, { name:'GRUMBLECLOUD', look:'cloud', col:'#6a6a9a' },
  { name:'SIR SPIKES-A-LOT', look:'spiky', col:'#9a4aff' }, { name:'THE SOCK GOBLIN', look:'sock', col:'#5aa86a' },
  { name:'MOTH OF MONDAYS', look:'moth', col:'#a88a5a' }, { name:'CAPTAIN NOPE', look:'spiky', col:'#ff8a2a' },
  { name:'THE BROCCOLI KING', look:'cloud', col:'#3a9a4a' }, { name:'MR. HOMEWORK', look:'clock', col:'#4a7aff' },
  { name:'COUNT DUSTBUNNY', look:'sock', col:'#b0a8c0' }, { name:'LORD HICCUP', look:'moth', col:'#ff5ad0' },
];
const bossFor = l => BOSSES[(l - 1) % BOSSES.length];
const bossHP = l => 8 + Math.round(l * 1.7);

/* things the dreamer says when the dream changes */
const SAY = {
  fly:['WAIT, I CAN FLY?!', 'WHEEE!', 'NO WINGS NEEDED'], dodge:['IS IT RAINING SPIKES?', 'NOPE NOPE NOPE', 'DODGE DODGE DODGE'],
  run:['LEGS! I HAVE LEGS!', 'GOTTA GO FAST', 'PARKOUR!'], orbit:['I AM A MOON NOW', 'SPACE!!', 'ROUND AND ROUND'],
  smash:['I AM ENORMOUS', 'SORRY TINY TOWN', 'STOMP TIME'], dive:['DOWN THE RABBIT HOLE', 'FALLIIIING', 'SO DEEP'],
  beat:['DANCE BATTLE!', 'I HEAR MUSIC', 'FEEL THE BEAT'], paint:['EVERYTHING IS GREY?!', 'ART TIME', 'MORE COLOUR!'],
  grow:['I AM HUNGRY', 'NOM NOM NOM', 'BIGGER. BIGGER.'],
  hit:['OUCH!', 'RUDE!', 'MY DREAM!', 'OOF'], twist:['WHAT?!', 'WAIT WHAT', 'HUH?!', 'OH NO', 'OH YES', 'WEIRD...', 'I LOVE IT'],
};

/* ---------------- missions ---------------- */
const MTYPES = [
  { t:'stars',   txt:n => `Collect ${n} stars`,              n:l => 120 + l * 20 },
  { t:'twists',  txt:n => `Live through ${n} twists`,         n:() => 10 },
  { t:'clears',  txt:n => `Clear ${n} dreams`,                n:() => 3 },
  { t:'combo',   txt:n => `Reach a x${n} combo`,              n:l => Math.min(40, 12 + l * 2), best:1 },
  { t:'bosses',  txt:n => `Defeat ${n} nightmares`,           n:() => 2 },
  { t:'smashed', txt:n => `Smash ${n} tiny houses`,           n:() => 40, lvl:3 },
  { t:'perfects',txt:n => `Hit ${n} PERFECT dance notes`,     n:() => 15, lvl:5 },
  { t:'painted', txt:n => `Paint ${n} grey bubbles`,          n:() => 30, lvl:6 },
  { t:'eaten',   txt:n => `Eat ${n} critters in GROW`,        n:() => 25, lvl:7 },
  { t:'nohit',   txt:n => `Finish ${n} shifts without a hit`, n:() => 8 },
  { t:'capsules',txt:n => `Open ${n} capsules`,               n:() => 2 },
  { t:'new',     txt:n => `Discover ${n} new surprises`,      n:() => 2 },
];
function makeMission(){
  const have = save.missions.map(m => m.t);
  const pool = MTYPES.filter(m => !have.includes(m.t) && (m.lvl || 1) <= save.lvl && !(m.t === 'new' && seenCount() >= TWISTS.length + MODE_IDS.length));
  const m = pick(pool.length ? pool : MTYPES);
  return { t:m.t, n:m.n(save.lvl), p:0, done:false, rw:{ dust:60 + save.lvl * 12, shards:Math.random() < .5 ? 2 : 1 } };
}
function fillMissions(){ save.missions = save.missions.filter(m => !m.claimed); while(save.missions.length < 3) save.missions.push(makeMission()); }
function missionEvent(t, v, best){
  for(const m of save.missions){
    if(m.done || m.t !== t) continue;
    m.p = best ? Math.max(m.p, v) : m.p + v;
    if(m.p >= m.n){ m.p = m.n; m.done = true; if(window.onMissionDone) onMissionDone(m); }
  }
}
const mtxt = m => MTYPES.find(x => x.t === m.t).txt(m.n);

/* ---------------- daily gift ---------------- */
const DAILY = [{ dust:80 }, { dust:120 }, { shards:3 }, { dust:200 }, { shards:5 }, { dust:300 }, { gold:1, shards:8 }];

/* ---------------- save ---------------- */
const SAVE_KEY = 'kaleidream_save_v1';
let save, _saveT = 0;
function defSave(){
  return {
    v:1, dust:0, shards:0, gold:0, lvl:1, sel:1, stars:{},
    char:'pip', hat:'none', trail:'sparkle', emote:'happy',
    own:{ c:{ pip:1 }, h:{ none:1 }, t:{ sparkle:1 }, e:{ happy:1 } },
    missions:[], seen:{ m:{}, t:{} }, daily:{ last:'', streak:0 },
    stats:{ runs:0, clears:0, stars:0, twists:0, bosses:0, bestCombo:0, hits:0, smashed:0, perfects:0, painted:0, eaten:0, capsules:0, best:0 },
    tut:0, opt:{ sfx:true, music:true, fx:'high' }, lastSeen:0,
  };
}
save = defSave();
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
  fillMissions();
}
function writeSave(){
  save.lastSeen = Date.now();
  const s = JSON.stringify(save), d = SDK.data();
  if(d){ try{ d.setItem(SAVE_KEY, s); }catch(e){} return; }
  try{ localStorage.setItem(SAVE_KEY, s); }catch(e){}
}
function persist(){ clearTimeout(_saveT); _saveT = setTimeout(writeSave, 300); }

/* ---------------- derived ---------------- */
const seenCount = () => Object.keys(save.seen.t).length + Object.keys(save.seen.m).length;
const ownedCount = () => ['c', 'h', 't', 'e'].reduce((a, k) => a + Object.keys(save.own[k]).length, 0);
const totalItems = () => CHARS.length + HATS.length + TRAILS.length + EMOTES.length;
function perk(){ const p = { hearts:0, mag:0, dust:0, shield:0, luck:0, slow:0, score:0, twist:0 }; Object.assign(p, charById(save.char).perk); return p; }
