'use strict';
/* =====================================================================
   WRECKING DRIFT: data, save, cars, balls, upgrades, missions.
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

const AW = 1800, AH = 1250;    // arena size

/* ---------------- arenas (change every 5 rounds) ---------------- */
const ARENAS = [
  { id: 'junk',   name: 'JUNKYARD',    g1: '#f0c86a', g2: '#e2b450', line: '#fff3c4', wall: '#ffcc33', wall2: '#2b2b38', grip: 1,    pillar: '#8a8fa3' },
  { id: 'beach',  name: 'BEACH BOWL',  g1: '#ffe0a3', g2: '#f6cf86', line: '#ffffff', wall: '#3fd0ff', wall2: '#ffffff', grip: 0.9,  pillar: '#ff8a5c' },
  { id: 'snow',   name: 'ICE RINK',    g1: '#dff4ff', g2: '#c6e8fb', line: '#7fc8ff', wall: '#ff4d6d', wall2: '#ffffff', grip: 0.55, pillar: '#9bd2f0' },
  { id: 'city',   name: 'NEON PLAZA',  g1: '#5a5f7a', g2: '#4e5370', line: '#ff5ce1', wall: '#5cf2ff', wall2: '#2a2440', grip: 1,    pillar: '#ff5ce1' },
  { id: 'lava',   name: 'VOLCANO PIT', g1: '#7a4a3a', g2: '#6a3e30', line: '#ffb03a', wall: '#ff5a1f', wall2: '#2a1410', grip: 1,    pillar: '#3a2a26' }
];

/* ---------------- garage ---------------- */
const CARS = [
  { id: 'rookie',  name: 'Rookie',   price: 0,    col: '#ff4d4d', acc: 520, top: 430, turn: 3.1, grip: 9,  hp: 100, mass: 1.0, r: 20 },
  { id: 'drifter', name: 'Drifter',  price: 250,  col: '#ffd23a', acc: 560, top: 460, turn: 3.6, grip: 6,  hp: 90,  mass: 0.9, r: 19 },
  { id: 'tank',    name: 'Bruiser',  price: 450,  col: '#4caf50', acc: 430, top: 380, turn: 2.7, grip: 11, hp: 160, mass: 1.6, r: 24 },
  { id: 'rocket',  name: 'Rocket',   price: 700,  col: '#3fa9ff', acc: 680, top: 540, turn: 3.2, grip: 8,  hp: 95,  mass: 0.95, r: 20 },
  { id: 'monster', name: 'Monster',  price: 1100, col: '#b06bff', acc: 500, top: 440, turn: 2.9, grip: 10, hp: 190, mass: 2.0, r: 27 },
  { id: 'gold',    name: 'Gold Rush', price: 2000, col: '#ffcf33', acc: 640, top: 520, turn: 3.5, grip: 8,  hp: 150, mass: 1.4, r: 22, gold: true }
];
const BALLS = [
  { id: 'iron',    name: 'Iron Ball',    price: 0,    r: 20, mass: 3.0, dmg: 1.0, c1: '#c7ccd8', c2: '#5d6475' },
  { id: 'spiked',  name: 'Spike Ball',   price: 300,  r: 20, mass: 3.0, dmg: 1.25, c1: '#d0d4de', c2: '#555b6a', spikes: true },
  { id: 'bowling', name: 'Bowling Ball', price: 400,  r: 19, mass: 3.4, dmg: 1.1, c1: '#ff6ad5', c2: '#7a1f6a', bouncy: true },
  { id: 'magma',   name: 'Magma Ball',   price: 800,  r: 21, mass: 3.2, dmg: 1.2, c1: '#ffd36b', c2: '#d8401a', fire: true },
  { id: 'disco',   name: 'Disco Ball',   price: 1200, r: 21, mass: 3.1, dmg: 1.3, c1: '#ffffff', c2: '#7f8cff', disco: true },
  { id: 'planet',  name: 'Tiny Planet',  price: 2500, r: 25, mass: 4.2, dmg: 1.5, c1: '#7dffb0', c2: '#2a6aff', planet: true }
];
/* permanent upgrades (coins) */
const PERKS = [
  { id: 'hp',     icon: '🛡️', name: 'Armor Plating', desc: '+12 max HP per level',          base: 60,  mul: 1.55, max: 8 },
  { id: 'dmg',    icon: '💥', name: 'Heavier Iron',  desc: '+8% ball damage per level',     base: 70,  mul: 1.55, max: 8 },
  { id: 'chain',  icon: '⛓️', name: 'Chain Links',   desc: '+1 chain link per level',       base: 90,  mul: 1.7,  max: 4 },
  { id: 'coin',   icon: '🪙', name: 'Scrap Dealer',  desc: '+10% coins per level',          base: 80,  mul: 1.6,  max: 6 },
  { id: 'reroll', icon: '🎲', name: 'Lucky Dice',    desc: '+1 card reroll per run',        base: 120, mul: 1.9,  max: 3 },
  { id: 'start',  icon: '🃏', name: 'Head Start',    desc: 'Start each cup with a free card', base: 200, mul: 2.5, max: 2 }
];
function perkCost(p, l){ return Math.round(p.base * Math.pow(p.mul, l)); }

/* ---------------- in-run power cards ---------------- */
const CARDS = [
  { id: 'heavy',  icon: '🏋️', name: 'Heavy Ball',   desc: '+30% ball damage, bigger ball', max: 5 },
  { id: 'chain',  icon: '⛓️', name: 'Long Chain',   desc: '+2 links: wider, faster swings', max: 4 },
  { id: 'twin',   icon: '⚫', name: 'Twin Balls',   desc: 'A second wrecking ball',        max: 1 },
  { id: 'fire',   icon: '🔥', name: 'Fire Ball',    desc: 'Hits set cars on fire',         max: 3 },
  { id: 'shock',  icon: '⚡', name: 'Shock Ball',   desc: 'Hits zap 2 nearby cars',        max: 3 },
  { id: 'boom',   icon: '💣', name: 'Boom Ball',    desc: 'Big hits explode',              max: 3 },
  { id: 'nitro',  icon: '🚀', name: 'Drift Nitro',  desc: 'Drifting charges a speed boost', max: 3 },
  { id: 'armor',  icon: '🛡️', name: 'Armor',        desc: '+30 max HP',                    max: 5 },
  { id: 'spikes', icon: '🦔', name: 'Spiked Bumper', desc: 'Ramming hurts them, not you',  max: 3 },
  { id: 'magnet', icon: '🧲', name: 'Coin Magnet',  desc: 'Pull coins from far away',      max: 3 },
  { id: 'repair', icon: '🔧', name: 'Repair',       desc: 'Heal 60 HP',                    max: 99 }
];

/* ---------------- enemies ---------------- */
const FOES = {
  bumper:  { r: 17, hp: 34,  acc: 380, top: 300, turn: 2.8, mass: 0.8, dmg: 9,  col: '#ff9f1c', coins: 2, name: 'Bumper' },
  cop:     { r: 18, hp: 42,  acc: 470, top: 390, turn: 3.2, mass: 0.9, dmg: 10, col: '#2f6bff', coins: 3, name: 'Cop', siren: true },
  spiker:  { r: 19, hp: 55,  acc: 400, top: 330, turn: 2.8, mass: 1.0, dmg: 18, col: '#7a7f8c', coins: 3, name: 'Spiker', spike: true },
  truck:   { r: 27, hp: 140, acc: 300, top: 250, turn: 2.0, mass: 2.4, dmg: 16, col: '#35b26b', coins: 6, name: 'Truck' },
  bomb:    { r: 15, hp: 18,  acc: 520, top: 370, turn: 3.4, mass: 0.6, dmg: 0,  col: '#2b2b2b', coins: 2, name: 'Bomb Buggy', bomb: true },
  baller:  { r: 19, hp: 60,  acc: 420, top: 340, turn: 3.0, mass: 1.0, dmg: 8,  col: '#e04bff', coins: 5, name: 'Baller', ball: true }
};
const BOSSES = [
  { kind: 'dozer',   name: 'BIG DOZER',     r: 38, hp: 700,  acc: 300, top: 230, turn: 1.6, mass: 5, dmg: 24, col: '#ffb000', blade: true },
  { kind: 'monster', name: 'MONSTER JUMPER', r: 36, hp: 1200, acc: 360, top: 280, turn: 2.0, mass: 4, dmg: 22, col: '#ff3d6e', jump: true },
  { kind: 'mega',    name: 'MEGA BALLER',   r: 34, hp: 1500, acc: 360, top: 270, turn: 2.2, mass: 4, dmg: 18, col: '#9b4dff', ball: true, megaBall: true },
  { kind: 'king',    name: 'KING CRUSHER',  r: 42, hp: 2200, acc: 330, top: 260, turn: 1.8, mass: 6, dmg: 28, col: '#1f1f2e', blade: true, minions: true }
];

/* ---------------- missions ---------------- */
const MISSION_POOL = [
  { id: 'wrecks',  txt: n => `Wreck ${n} cars`,               n: [30, 120, 400, 1200] },
  { id: 'bosses',  txt: n => n > 1 ? `Wreck ${n} bosses` : 'Wreck a boss', n: [1, 3, 8] },
  { id: 'combo',   txt: n => `Get a ${n}x wreck combo`,       n: [3, 4, 5, 6], peak: true },
  { id: 'round',   txt: n => `Reach round ${n} in the cup`,   n: [5, 10, 15, 20], peak: true },
  { id: 'barrels', txt: n => `Blow up ${n} barrels`,          n: [10, 40, 120] },
  { id: 'coins',   txt: n => `Collect ${n} coins`,            n: [200, 800, 2500] },
  { id: 'vs',      txt: n => n > 1 ? `Play ${n} 2-player matches` : 'Play a 2-player match', n: [1, 3, 8] }
];

/* ---------------- save ---------------- */
const SAVE_KEY = 'wreckdrift_save_v1';
function defSave(){
  return {
    v: 1, best: 0, coins: 0, runs: 0,
    car: 'rookie', ball: 'iron', ownCar: { rookie: 1 }, ownBall: { iron: 1 },
    perk: { hp: 0, dmg: 0, chain: 0, coin: 0, reroll: 0, start: 0 },
    opt: { sfx: true, music: true, shake: true },
    stats: { wrecks: 0, bosses: 0, barrels: 0, coins: 0, vs: 0 },
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
/* daily reward: come back tomorrow for more */
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
