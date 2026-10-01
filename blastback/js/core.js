'use strict';
/* =====================================================================
   BLASTBACK: data, save, guns, cards, missions.
   Your gun is your jetpack: every shot kicks you the other way.
   ===================================================================== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const angDiff = (a, b) => { let d = (b - a) % TAU; if(d > Math.PI) d -= TAU; if(d < -Math.PI) d += TAU; return d; };
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');

/* ---------------- arenas (change every 5 waves) ---------------- */
const ARENAS = [
  { id: 'meadow', name: 'SUNNY MEADOW', sky1: '#7fd6ff', sky2: '#d9f4ff', hill: '#8fdc6a', hill2: '#6cc24f', top: '#7ee05a', dirt: '#b9784a', lava: '#ff7a1f' },
  { id: 'beach',  name: 'BEACH BAY',    sky1: '#5fc8ff', sky2: '#fff1c9', hill: '#ffd98a', hill2: '#f5c46a', top: '#ffe08a', dirt: '#d9a35a', lava: '#2fb8ff', water: true },
  { id: 'candy',  name: 'CANDY CLOUDS', sky1: '#ff9ad5', sky2: '#ffe3f4', hill: '#ffc0e6', hill2: '#ff9fd6', top: '#ffffff', dirt: '#ff7ab8', lava: '#a55cff' },
  { id: 'snow',   name: 'FROSTY PEAKS', sky1: '#8fb8ff', sky2: '#eef6ff', hill: '#ffffff', hill2: '#d8e8ff', top: '#ffffff', dirt: '#8aa8d8', lava: '#5ad2ff', water: true },
  { id: 'lava',   name: 'MAGMA FORGE',  sky1: '#ff9a5a', sky2: '#ffe0b0', hill: '#c06a4a', hill2: '#a0533a', top: '#ffb35a', dirt: '#7a3a2a', lava: '#ff4a1f' }
];

/* ---------------- guns (garage) ---------------- */
const GUNS = [
  { id: 'blaster', name: 'Blaster',     price: 0,    dmg: 12, rate: 0.2,  kick: 440, mag: 4,  spd: 950,  pellets: 1, spread: 0.02, col: '#ff5a5a' },
  { id: 'shotgun', name: 'Boomstick',   price: 300,  dmg: 7,  rate: 0.42, kick: 600, mag: 3,  spd: 850,  pellets: 5, spread: 0.32, col: '#ffb13a' },
  { id: 'smg',     name: 'Buzz SMG',    price: 500,  dmg: 6,  rate: 0.08, kick: 175, mag: 12, spd: 1000, pellets: 1, spread: 0.12, col: '#3fd17a' },
  { id: 'rocket',  name: 'Rocket Pop',  price: 900,  dmg: 34, rate: 0.6,  kick: 720, mag: 2,  spd: 620,  pellets: 1, spread: 0,    col: '#3fa9ff', boom: 85 },
  { id: 'laser',   name: 'Zap Laser',   price: 1400, dmg: 10, rate: 0.16, kick: 340, mag: 5,  spd: 1700, pellets: 1, spread: 0,    col: '#b06bff', pierce: true },
  { id: 'party',   name: 'Party Cannon', price: 2400, dmg: 10, rate: 0.3,  kick: 500, mag: 5,  spd: 800,  pellets: 3, spread: 0.2,  col: '#ff5ce1', bounce: 2 }
];
const SKINS = [
  { id: 'red',    name: 'Red',    price: 0,   c: '#ff5a5a' },
  { id: 'blue',   name: 'Blue',   price: 150, c: '#3fa9ff' },
  { id: 'green',  name: 'Green',  price: 150, c: '#3fd17a' },
  { id: 'gold',   name: 'Gold',   price: 400, c: '#ffcf33' },
  { id: 'purple', name: 'Purple', price: 400, c: '#b06bff' },
  { id: 'pink',   name: 'Pink',   price: 600, c: '#ff7ab8' }
];
const PERKS = [
  { id: 'hp',     icon: '❤️', name: 'Tough Shell',  desc: '+12 max HP per level',         base: 60,  mul: 1.55, max: 8 },
  { id: 'dmg',    icon: '💥', name: 'Hot Rounds',   desc: '+8% damage per level',         base: 70,  mul: 1.55, max: 8 },
  { id: 'mag',    icon: '🔋', name: 'Big Mag',      desc: '+1 shot per magazine',         base: 120, mul: 1.9,  max: 3 },
  { id: 'coin',   icon: '🪙', name: 'Treasure Nose', desc: '+10% coins per level',        base: 80,  mul: 1.6,  max: 6 },
  { id: 'reroll', icon: '🎲', name: 'Lucky Dice',   desc: '+1 card reroll per run',       base: 120, mul: 1.9,  max: 3 },
  { id: 'start',  icon: '🃏', name: 'Head Start',   desc: 'Start each run with a free card', base: 200, mul: 2.5, max: 2 }
];
function perkCost(p, l){ return Math.round(p.base * Math.pow(p.mul, l)); }

/* ---------------- in-run cards ---------------- */
const CARDS = [
  { id: 'spread', icon: '🔱', name: 'Triple Shot',   desc: '+2 bullets per shot',          max: 3 },
  { id: 'mag',    icon: '🔋', name: 'Extra Ammo',    desc: '+2 shots before you must land', max: 4 },
  { id: 'bounce', icon: '🏓', name: 'Bouncy Bullets', desc: 'Bullets bounce off walls',    max: 3 },
  { id: 'boom',   icon: '💣', name: 'Boom Rounds',   desc: 'Bullets explode on hit',        max: 3 },
  { id: 'pierce', icon: '🗡️', name: 'Piercing',      desc: 'Bullets go through enemies',    max: 1 },
  { id: 'rate',   icon: '⚡', name: 'Fast Trigger',  desc: '+20% fire rate',                max: 4 },
  { id: 'stomp',  icon: '🦶', name: 'Mega Stomp',    desc: 'Stomps hit harder + shockwave', max: 3 },
  { id: 'kick',   icon: '🚀', name: 'Super Kick',    desc: '+20% recoil: fly higher',       max: 3 },
  { id: 'dmg',    icon: '🔥', name: 'Big Damage',    desc: '+25% bullet damage',            max: 5 },
  { id: 'crit',   icon: '🎯', name: 'Lucky Crits',   desc: '20% chance for x2.5 damage',    max: 3 },
  { id: 'magnet', icon: '🧲', name: 'Coin Magnet',   desc: 'Coins fly to you',              max: 2 },
  { id: 'heal',   icon: '💖', name: 'Patch Up',      desc: 'Heal 50 HP',                    max: 99 }
];

/* ---------------- enemies ---------------- */
const FOES = {
  slime:   { r: 17, hp: 20, spd: 70,  dmg: 10, col: '#7ee05a', coins: 2, walk: true },
  hopper:  { r: 15, hp: 18, spd: 90,  dmg: 10, col: '#ffb13a', coins: 2, walk: true, hop: true },
  bat:     { r: 14, hp: 14, spd: 120, dmg: 8,  col: '#9b6bff', coins: 2, fly: true },
  turret:  { r: 18, hp: 30, spd: 60,  dmg: 8,  col: '#3fa9ff', coins: 3, fly: true, shoot: true },
  bomber:  { r: 14, hp: 12, spd: 150, dmg: 22, col: '#2b2b38', coins: 2, fly: true, bomb: true },
  brute:   { r: 27, hp: 90, spd: 50,  dmg: 18, col: '#ff6a5a', coins: 6, walk: true, heavy: true },
  shield:  { r: 18, hp: 40, spd: 80,  dmg: 10, col: '#c7ccd8', coins: 4, fly: true, shield: true }
};
const BOSSES = [
  { kind: 'king',  name: 'KING SLIME',   r: 52, hp: 700,  col: '#5fd14a', walk: true, hop: true },
  { kind: 'bot',   name: 'MEGA BOT',     r: 46, hp: 950,  col: '#3fa9ff', fly: true, shoot: true },
  { kind: 'bat',   name: 'BAT QUEEN',    r: 44, hp: 1150, col: '#9b6bff', fly: true },
  { kind: 'golem', name: 'LAVA GOLEM',   r: 56, hp: 1500, col: '#ff6a3a', walk: true, heavy: true }
];

/* ---------------- missions ---------------- */
const MISSION_POOL = [
  { id: 'kills',  txt: n => `Defeat ${n} enemies`,          n: [40, 150, 500, 1500] },
  { id: 'bosses', txt: n => n > 1 ? `Defeat ${n} bosses` : 'Defeat a boss', n: [1, 3, 8] },
  { id: 'stomps', txt: n => `Stomp ${n} enemies`,           n: [5, 25, 80] },
  { id: 'wave',   txt: n => `Reach wave ${n}`,              n: [5, 10, 15, 20], peak: true },
  { id: 'combo',  txt: n => `Get a ${n}x combo`,            n: [3, 5, 7, 9], peak: true },
  { id: 'coins',  txt: n => `Collect ${n} coins`,           n: [200, 800, 2500] },
  { id: 'vs',     txt: n => n > 1 ? `Play ${n} 2-player duels` : 'Play a 2-player duel', n: [1, 3, 8] }
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'blastback_save_v1';
function defSave(){
  return {
    v: 1, best: 0, coins: 0, runs: 0,
    gun: 'blaster', skin: 'red', ownGun: { blaster: 1 }, ownSkin: { red: 1 },
    perk: { hp: 0, dmg: 0, mag: 0, coin: 0, reroll: 0, start: 0 },
    opt: { sfx: true, music: true, shake: true },
    stats: { kills: 0, bosses: 0, stomps: 0, coins: 0, vs: 0 },
    missions: [], tut: 0, day: '', streak: 0
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
  let raw = null;
  const d = SDK.data();
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
    const tier = Math.min(p.n.length - 1, Math.floor(save.runs / 5));
    save.missions.push({ id: p.id, n: p.n[tier], at: p.peak ? 0 : (save.stats[p.id] || 0), prog: 0, done: false, claimed: false, rw: 60 + tier * 60 });
  }
}
function missionTick(peaks){
  for(const m of save.missions){
    if(m.done) continue;
    const p = MISSION_POOL.find(x => x.id === m.id);
    if(p.peak) m.prog = Math.max(m.prog, peaks[m.id] || 0);
    else m.prog = (save.stats[m.id] || 0) - m.at;
    if(m.prog >= m.n){ m.prog = m.n; m.done = true; }
  }
}
function dailyReward(){
  const today = new Date().toISOString().slice(0, 10);
  if(save.day === today) return 0;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  save.streak = save.day === y ? Math.min(7, save.streak + 1) : 1;
  save.day = today;
  const amt = 40 * save.streak;
  save.coins += amt; persist();
  return amt;
}
