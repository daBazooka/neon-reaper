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
let grng = Math.random;
const gr = (a, b) => a + grng() * (b - a);
function rgba(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
function mixHex(a, b, t){
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const c = s => Math.round(lerp(x >> s & 255, y >> s & 255, t));
  return '#' + ((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1);
}

/* ---------------- geometry ---------------- */
function polyArea(p){ let s = 0; for(let i = 0, n = p.length; i < n; i++){ const a = p[i], b = p[(i + 1) % n]; s += a.x * b.y - b.x * a.y; } return Math.abs(s) / 2; }
function polyCentroid(p){ let x = 0, y = 0; for(const q of p){ x += q.x; y += q.y; } return { x:x / p.length, y:y / p.length }; }
function polyBox(p){ let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for(const q of p){ if(q.x < x0) x0 = q.x; if(q.x > x1) x1 = q.x; if(q.y < y0) y0 = q.y; if(q.y > y1) y1 = q.y; } return { x0, y0, x1, y1 }; }
function inPoly(p, x, y){
  let c = false;
  for(let i = 0, j = p.length - 1; i < p.length; j = i++){
    const a = p[i], b = p[j];
    if((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}
function segX(a, b, c, d){
  const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y, den = rx * sy - ry * sx;
  if(Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / den, u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x:a.x + rx * t, y:a.y + ry * t } : null;
}
function segDist2(px, py, a, b){
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
  let t = l ? ((px - a.x) * dx + (py - a.y) * dy) / l : 0; t = clamp(t, 0, 1);
  const x = a.x + dx * t - px, y = a.y + dy * t - py; return x * x + y * y;
}

/* ---------------- world ---------------- */
const WORLD_R = 1600;
const BUD_COLS = ['#ff8fc8', '#b89cff', '#8fd8ff', '#ffb38a', '#7dffc9', '#fff38a', '#ff9aa8', '#c8a8ff'];
// the night drifts through five skies; every fifth hour the Hush rises
const HOURS = [
  { n:'DUSK',      g:'#241a44', lake:'#1a1030', tint:'#ff9ac8', mus:0 },
  { n:'TWILIGHT',  g:'#1c1c4a', lake:'#11123a', tint:'#b89cff', mus:5 },
  { n:'MIDNIGHT',  g:'#141a40', lake:'#0a0e2c', tint:'#8fd8ff', mus:-3 },
  { n:'AURORA',    g:'#0f2238', lake:'#07182a', tint:'#7dffc9', mus:2 },
  { n:'STARFALL',  g:'#221440', lake:'#140a2c', tint:'#fff38a', mus:-5 },
];
const HOUR_LEN = 40;
const hourPal = h => HOURS[(h - 1) % HOURS.length];

/* ---------------- glooms (gentle shadow critters you free with loops) ---------------- */
const GT = {
  mote:   { r:17, spd:52,  at:10,  w:4,   cut:false, name:'Mote' },
  snip:   { r:11, spd:215, at:38,  w:1.6, cut:true,  name:'Snipper',
            tip:'<em>SNIPPERS</em> dart in straight lines and <b>snap your ribbon</b>. Loop them fast!' },
  chaser: { r:16, spd:118, at:75,  w:1.4, cut:false, name:'Chaser',
            tip:'<em>CHASERS</em> follow you. Lead them in a circle and <b>loop them</b>!' },
  weeper: { r:22, spd:26,  at:110, w:.8,  cut:false, name:'Weeper', tears:true,
            tip:'<em>WEEPERS</em> cry dark tears that <b>snap ribbons</b>. Free them to stop the rain.' },
  brood:  { r:44, spd:36,  at:140, w:.7,  cut:true,  name:'Brood', big:true, kids:4,
            tip:'<em>BROODS</em> are big. Draw a <b>wide loop</b> all the way around them!' },
};

/* ---------------- blessings (picked at every garden level) ---------------- */
const RAR = [ { n:'COMMON', c:'#a9d4ff', w:10 }, { n:'RARE', c:'#7dffc9', w:5.5 }, { n:'EPIC', c:'#ff8fc8', w:2.4 } ];
const PERKS = [
  { id:'ribbon', name:'Long Ribbon',    icon:'〰', rar:0, max:4, desc:'+22% ribbon length. Bigger loops!' },
  { id:'swift',  name:'Swift Wings',    icon:'➤', rar:0, max:3, desc:'+10% flying speed' },
  { id:'heart',  name:'Bright Heart',   icon:'☀', rar:0, max:3, desc:'+25 max light and refill' },
  { id:'roots',  name:'Deep Roots',     icon:'♣', rar:0, max:3, desc:'Your light fades 12% slower' },
  { id:'pollen', name:'Pollen Pull',    icon:'⊛', rar:0, max:3, desc:'Motes fly to you from further, +15% light' },
  { id:'kin',    name:'Butterfly Kin',  icon:'ʚɞ', rar:1, max:2, desc:'Butterflies live longer and bloom faster' },
  { id:'echo',   name:'Echo Bloom',     icon:'◎', rar:1, max:2, desc:'Loops also bloom buds just outside them' },
  { id:'calm',   name:'Lullaby',        icon:'♪', rar:1, max:2, desc:'Glooms drift 15% slower' },
  { id:'well',   name:'Moonwell',       icon:'☾', rar:1, max:2, desc:'Loops of 4+ restore extra light' },
  { id:'star',   name:'Wishing Star',   icon:'✦', rar:2, max:1, desc:'Every 5th glow chain drops a star that blooms everything nearby' },
  { id:'halo',   name:'Halo',           icon:'◯', rar:2, max:1, desc:'A shield that blocks one hit, recharging in 18 s' },
  { id:'twin',   name:'Twin Spark',     icon:'✧', rar:2, max:1, desc:'A little spark follows you and blooms buds it touches' },
];

/* ---------------- meta ---------------- */
const META = [
  { id:'ribbon', name:'Silk Ribbon',   icon:'〰', desc:'Start every run with a longer ribbon', costs:[70, 180, 380] },
  { id:'glow',   name:'Inner Glow',    icon:'☀', desc:'+15 max light',                         costs:[120, 360] },
  { id:'breath', name:'Soft Breath',   icon:'♣', desc:'Your light fades 8% slower',            costs:[90, 240, 480] },
  { id:'nectar', name:'Nectar',        icon:'⊛', desc:'Light motes give +12% light',           costs:[80, 220] },
  { id:'luck',   name:'Star Luck',     icon:'✦', desc:'+15% stardust from every run',          costs:[110, 280, 560] },
];
// spirits: c1 body, c2 ribbon, c3 ribbon tail
const SKINS = [
  { id:'firefly', name:'Firefly',   c1:'#ffe7a0', c2:'#ffd98a', c3:'#ff8fc8', cost:0 },
  { id:'moth',    name:'Moonmoth',  c1:'#f1e6ff', c2:'#c8a8ff', c3:'#8fd8ff', cost:250 },
  { id:'koi',     name:'Koi Spark', c1:'#ffe0d0', c2:'#ffb38a', c3:'#ff6f91', cost:450 },
  { id:'sprout',  name:'Sprout',    c1:'#e8ffe0', c2:'#7dffc9', c3:'#fff38a', cost:700 },
  { id:'frost',   name:'Frostwing', c1:'#eefcff', c2:'#8fd8ff', c3:'#b89cff', cost:1000 },
  { id:'rose',    name:'Rosebud',   c1:'#ffe6f2', c2:'#ff8fc8', c3:'#fff38a', cost:1500 },
  { id:'aurora',  name:'Aurora',    c1:'#ffffff', c2:'aurora',  c3:'aurora',  cost:2500 },
];
const MODS = [
  { id:'blossom', name:'BLOSSOM STORM', desc:'Twice the buds.' },
  { id:'windy',   name:'WINDY NIGHT',   desc:'Everything is 25% faster. Dust x1.5.' },
  { id:'short',   name:'SHORT RIBBON',  desc:'A 30% shorter ribbon. Dust x2.' },
  { id:'moonless',name:'MOONLESS',      desc:'Light fades 25% faster. Dust x1.5.' },
  { id:'flutter', name:'BUTTERFLY DAY', desc:'Start with 6 butterfly friends.' },
];
const MT = [
  { id:'bloom',  ev:'bloom',  kind:'sum', vals:[60,200,500,1200,2500], txt:n => `Bloom ${n} flowers` },
  { id:'purify', ev:'purify', kind:'sum', vals:[10,30,80,200],         txt:n => `Free ${n} glooms` },
  { id:'harm',   ev:'harm',   kind:'max', vals:[5,8,12,16,22],          txt:n => `Catch ${n} things in one loop` },
  { id:'chain',  ev:'chain',  kind:'max', vals:[5,10,16,24,32],         txt:n => `Reach a ${n}x glow chain` },
  { id:'hour',   ev:'hour',   kind:'max', vals:[3,5,7,10,13],           txt:n => `Reach hour ${n}` },
  { id:'paint',  ev:'paint',  kind:'max', vals:[10,20,35,50,70],        txt:n => `Paint ${n}% of the meadow` },
  { id:'hush',   ev:'hush',   kind:'sum', vals:[1,3,6],                 txt:n => `Free ${n} Hush${n > 1 ? 'es' : ''}` },
  { id:'loops',  ev:'loops',  kind:'sum', vals:[40,120,300,700],        txt:n => `Draw ${n} loops` },
];
const gardenNeed = lv => 8 + lv * 5;

/* ---------------- save ---------------- */
const SAVE_KEY = 'lumibloom_save_v1';
function defSave(){
  return {
    v:1, dust:0, best:0, bestBlooms:0, bestPaint:0, bestHour:0, xp:0, level:1, runs:0,
    meta:{ ribbon:0, glow:0, breath:0, nectar:0, luck:0 },
    skins:['firefly'], skin:'firefly',
    missions:[], mTier:{}, missionsDone:0, mNew:false,
    stats:{ blooms:0, purified:0 },
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
