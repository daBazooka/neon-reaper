'use strict';
/* =====================================================================
   BO KATA — authoritative multiplayer server
   - Serves the game (../www) over HTTP and speaks WebSocket on /ws.
   - Every room runs the game's own core.js + sim.js + bots.js inside an
     isolated VM context, so online matches follow exactly the same
     physics and rules as offline play. The server decides every pench,
     cut and loot; clients only send their input.
   - Matchmaking by mode. Empty seats are filled with bot flyers after a
     short wait, so a match always starts.
   Protocol (JSON):
     C→S  hello {mode, name, kite, thread, look, manja:{str,sharp}, spool, trophies}
          in {d, x, y, s}          ping {c}          leave {}
     S→C  queue {n, need, wait}    start {cfg, you}   s {snapshot}
          end {order, stats}       pong {c}           err {msg}
   ===================================================================== */
const http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
const { WebSocketServer } = require('ws');

const PORT = +process.env.PORT || 8787;
const WEB = path.resolve(__dirname, process.env.WEB_DIR || '../www');
const JS = f => fs.readFileSync(path.join(WEB, 'js', f), 'utf8');
const SRC = { core:JS('core.js'), sim:JS('sim.js'), bots:JS('bots.js') };
const TICK = 1 / 60, SNAP_EVERY = 3;              // 60 Hz simulation, 20 Hz snapshots
const LW = +process.env.LOBBY_WAIT || 0;
const MODES = { battle:{ seats:12, wait:LW || 12 }, duel:{ seats:2, wait:LW || 8 } };

/* ---------------- a sandboxed copy of the game rules ---------------- */
const noop = () => {};
const AU_STUB = new Proxy({}, { get:() => noop });
const HELPERS = `
  M_ = () => M;
  function roomStart(cfg){ newNetMatch(cfg, -1); M.server = true; M.events = []; return M; }
  function roomStep(dt){ stepMatch(dt); const e = M.events; M.events = []; return e; }
  function r1(v){ return Math.round(v * 10) / 10; }
  function roomSnap(){
    const f = M.flyers.map(F => F.kite
      ? [F.id, 1, Math.round(F.kite.x), Math.round(F.kite.y), Math.round(F.kite.vx), Math.round(F.kite.vy), Math.round(F.kite.a * 100) / 100, F.kite.pull ? 1 : 0, Math.round(F.kite.L), F.kitesLeft, F.cuts, F.loots, F.out ? 1 : 0, r1(Math.max(0, F.kite.launch))]
      : [F.id, 0, F.kitesLeft, F.cuts, F.loots, F.out ? 1 : 0, r1(F.respawnT)]);
    const l = M.loose.map(q => [q.id, Math.round(q.x), Math.round(q.y), Math.round(q.a * 100) / 100, q.def.id, Math.round(q.tail[0]), Math.round(q.tail[1]), q.landed ? 1 : 0, r1(q.t), q.owner.id, Math.round(q.vx), Math.round(q.vy)]);
    const p = []; for(const x of M.pench.values()) if(x.gone <= 0) p.push([x.a.id, x.b.id, Math.round(x.x), Math.round(x.y), Math.round(x.wa), Math.round(x.wb)]);
    return { t:'s', tm:Math.round(M.t * 100) / 100, cd:Math.round(M.countdown * 100) / 100, w:r1(M.wind.x), f, l, p };
  }`;
function makeRules(){
  const ctx = {
    Math, JSON, Date, Array, Object, Number, String, Map, Set, Float32Array, Infinity, NaN, isFinite, parseInt, parseFloat, Proxy,
    console, setTimeout, clearTimeout,
    AU:AU_STUB, vib:noop, questEv:noop, showResults:noop,
    document:{ getElementById:() => null }, localStorage:null, navigator:{}, window:{},
  };
  vm.createContext(ctx);
  for(const k of ['core', 'sim', 'bots']) vm.runInContext(SRC[k], ctx, { filename:k + '.js' });
  vm.runInContext(HELPERS, ctx, { filename:'helpers.js' });
  return ctx;
}
const RULES = makeRules();                        // for data lookups (kites, arenas...)
const D = vm.runInContext('({ KITES, THREADS, SPOOLS, ARENAS, NAMES, SKIN, SHIRT, arenaFor })', RULES);

/* ---------------- validation of what a client may bring ---------------- */
// nicknames are visible to other players: strip markup and block offensive words
// fragments that are offensive anywhere in a name
const BAD = ['fuck', 'fuk', 'shit', 'bitch', 'cunt', 'cock', 'pussy', 'slut', 'whore', 'nigg', 'faggot', 'rapist', 'nazi', 'hitler', 'porn', 'penis', 'vagina', 'bastard', 'asshole',
  'chutiya', 'chutia', 'madarchod', 'behenchod', 'bhenchod', 'bhosdi', 'gandu', 'randi', 'haramzada', 'kontol', 'memek', 'bangsat'];
// short words that are only offensive on their own (so "Sussex" or "Sialkot" stay fine)
const WORDS = ['sex', 'dick', 'fag', 'rape', 'mc', 'bc', 'lund', 'lauda', 'loda', 'harami', 'kutta', 'kamina', 'saala', 'kanjar', 'babi', 'puki', 'pantat', 'sial', 'bodoh', 'anjing'];
const LEET = { '0':'o', '1':'i', '3':'e', '4':'a', '5':'s', '7':'t', '@':'a', '$':'s', '!':'i' };
function isBad(n){
  const low = n.toLowerCase().replace(/[013457@$!]/g, c => LEET[c]);
  const flat = low.replace(/[^a-z]/g, ''), words = low.split(/[^a-z]+/).filter(Boolean);
  return BAD.some(w => flat.includes(w)) || WORDS.some(w => flat === w || words.includes(w));
}
const clean = s => { const n = String(s || '').replace(/[<>&"\\\u0000-\u001f]/g, '').trim().slice(0, 12); return !n ? 'Flyer' : isBad(n) ? 'Flyer' + (100 + Math.floor(Math.random() * 900)) : n; };
const intIn = (v, a, b, d) => { v = Math.round(+v); return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };
function loadout(h){
  const kite = D.KITES.some(k => k.id === h.kite) ? h.kite : 'lal';
  const th = D.THREADS.find(t => t.c === h.thread || t.id === h.thread);
  const spool = D.SPOOLS.some(s => s.id === h.spool) ? h.spool : 'bamboo';
  const m = h.manja || {};
  return {
    name:clean(h.name), def:kite, thread:th ? th.c : '#e0303a', spool,
    look:{ skin:intIn(h.look && h.look.skin, 0, 9, 2), shirt:intIn(h.look && h.look.shirt, 0, 9, 0) },
    str:1 + .09 * intIn(m.str, 0, 12, 0), sharp:1 + .09 * intIn(m.sharp, 0, 12, 0), trophies:intIn(h.trophies, 0, 99999, 0),
  };
}

/* ---------------- rooms ---------------- */
let nextRoom = 1;
const rooms = new Set();
const lobbies = { battle:null, duel:null };

function newRoom(mode){
  const r = { id:nextRoom++, mode, seats:MODES[mode].seats, players:[], state:'lobby', t0:Date.now(), wait:MODES[mode].wait, ctx:null, tick:0, endT:0 };
  rooms.add(r); lobbies[mode] = r;
  return r;
}
function send(ws, o){ if(ws.readyState === 1) ws.send(JSON.stringify(o)); }
function broadcast(r, o){ const s = JSON.stringify(o); for(const p of r.players) if(p.ws && p.ws.readyState === 1) p.ws.send(s); }
function lobbyInfo(r){ broadcast(r, { t:'queue', n:r.players.length, need:r.seats, wait:Math.max(0, Math.ceil(r.wait - (Date.now() - r.t0) / 1000)) }); }

function join(ws, h){
  const mode = MODES[h.mode] ? h.mode : 'battle';
  let r = lobbies[mode];
  if(!r || r.state !== 'lobby' || r.players.length >= r.seats) r = newRoom(mode);
  const p = { ws, lo:loadout(h), room:r, id:-1, inp:{ d:false, x:0, y:0, s:true }, msgs:0 };
  ws.player = p; r.players.push(p);
  lobbyInfo(r);
  if(r.players.length >= r.seats) startRoom(r);
}

function startRoom(r){
  if(r.state !== 'lobby') return;
  r.state = 'play'; if(lobbies[r.mode] === r) lobbies[r.mode] = null;
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[(Math.random() * a.length) | 0];
  const duel = r.mode === 'duel', n = r.seats, WW = duel ? 3600 : 5000;
  const anchors = []; if(duel) anchors.push(WW / 2 - 430, WW / 2 + 430); else for(let i = 0; i < n; i++) anchors.push(WW * (i + .5) / n + rnd(-60, 60));
  const humans = r.players.filter(p => p.ws);
  const avgTro = humans.reduce((s, p) => s + p.lo.trophies, 0) / Math.max(1, humans.length);
  const skill = Math.max(.25, Math.min(.95, .25 + avgTro / 2600 + (duel ? .05 : 0)));
  // humans get random seats, bots take the rest
  const seats = [...Array(n).keys()].sort(() => Math.random() - .5);
  const used = new Set(humans.map(p => p.lo.name));
  const flyers = new Array(n);
  humans.forEach((p, i) => { const id = seats[i]; p.id = id; flyers[id] = { id, name:p.lo.name, def:p.lo.def, thread:p.lo.thread, look:p.lo.look, str:p.lo.str, sharp:p.lo.sharp, spool:p.lo.spool, spin:Math.random() < .5 ? 1 : -1, bot:0 }; });
  const pool = D.KITES.filter(k => k.r <= (skill > .7 ? 3 : skill > .45 ? 2 : 1));
  for(let id = 0; id < n; id++){
    if(flyers[id]) continue;
    let name; do{ name = pick(D.NAMES); } while(used.has(name)); used.add(name);
    const lvl = () => 1 + .09 * Math.round(skill * 8 * rnd(.6, 1.1));
    flyers[id] = { id, name, def:pick(pool).id, thread:pick(D.THREADS.slice(0, 7)).c, look:{ skin:(Math.random() * D.SKIN.length) | 0, shirt:(Math.random() * D.SHIRT.length) | 0 },
      str:lvl(), sharp:lvl(), spool:pick(D.SPOOLS.slice(0, 1 + Math.round(skill * 4))).id, spin:Math.random() < .5 ? 1 : -1, bot:Math.max(.1, Math.min(1, skill + rnd(-.15, .15))) };
  }
  const cfg = { mode:r.mode, seed:(Math.random() * 1e9) | 0, WW, anchors, arena:D.arenaFor(avgTro).id, dur:+process.env.MATCH_SECONDS || (duel ? 150 : 180), wind:{ base:Math.random() < .5 ? -1 : 1, ph:rnd(0, 100) }, flyers };
  r.ctx = makeRules();
  r.ctx.roomStart(cfg);
  r.players = humans;
  for(const p of humans) send(p.ws, { t:'start', cfg, you:p.id });
  log(`room ${r.id} ${r.mode} started: ${humans.length} human(s), ${n - humans.length} bot(s)`);
}

function stepRoom(r){
  const M = r.ctx.M_();
  // feed each human's latest input to their flyer
  for(const p of r.players){ const F = M.flyers[p.id]; if(F && p.ws && !F.bot) F.inp = p.inp; }
  const ev = r.ctx.roomStep(TICK);
  if(ev.length) r.pending = (r.pending || []).concat(ev);
  if(++r.tick % SNAP_EVERY === 0){
    const s = r.ctx.roomSnap(); if(r.pending){ s.e = r.pending; r.pending = null; }
    broadcast(r, s);
  }
  if(M.over && !r.endT){
    r.endT = Date.now();
    const s = r.ctx.roomSnap(); if(r.pending){ s.e = r.pending; r.pending = null; } broadcast(r, s);
    broadcast(r, { t:'end', order:M.order.map(F => F.id), stats:M.flyers.map(F => [F.id, F.cuts, F.loots, F.place]) });
    log(`room ${r.id} ended after ${M.t.toFixed(0)}s`);
  }
}

function leave(ws){
  const p = ws.player; if(!p) return; ws.player = null;
  const r = p.room; p.ws = null;
  if(r.state === 'lobby'){ r.players = r.players.filter(q => q !== p); if(!r.players.length){ rooms.delete(r); if(lobbies[r.mode] === r) lobbies[r.mode] = null; } else lobbyInfo(r); return; }
  // mid-match: a bot takes over the kite so nobody's fight disappears
  const M = r.ctx && r.ctx.M_();
  if(M && M.flyers[p.id]){ const F = M.flyers[p.id]; F.inp = null; F.human = false; F.bot = r.ctx.mkBrain(F, .5); }
}

/* ---------------- main loop ---------------- */
let acc = 0, lastT = process.hrtime.bigint();
setInterval(() => {
  const now = process.hrtime.bigint(); acc += Number(now - lastT) / 1e9; lastT = now;
  if(acc > .25) acc = .25;
  // lobbies that waited long enough start with bots
  for(const r of rooms) if(r.state === 'lobby'){ if((Date.now() - r.t0) / 1000 >= r.wait) startRoom(r); else if(r.tick++ % 60 === 0) lobbyInfo(r); }
  while(acc >= TICK){
    acc -= TICK;
    for(const r of rooms){
      if(r.state !== 'play') continue;
      try{ stepRoom(r); }catch(e){ log('room ' + r.id + ' error: ' + (e && e.stack || e)); r.endT = r.endT || Date.now(); }
      if(r.endT && Date.now() - r.endT > 3000){ rooms.delete(r); }
      if(!r.endT && !r.players.some(p => p.ws)){ rooms.delete(r); log(`room ${r.id} abandoned`); }
    }
  }
}, 8);

/* ---------------- HTTP (serves the game) + WebSocket ---------------- */
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.json':'application/json', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.ico':'image/x-icon' };
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if(u === '/health'){ res.writeHead(200, { 'content-type':'application/json' }); res.end(JSON.stringify({ ok:true, rooms:rooms.size, players:[...rooms].reduce((s, r) => s + r.players.filter(p => p.ws).length, 0) })); return; }
  if(u.endsWith('/')) u += 'index.html';
  const f = path.resolve(WEB, '.' + u);
  if(!f.startsWith(WEB)){ res.writeHead(403); res.end(); return; }
  fs.readFile(f, (err, data) => {
    if(err){ res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type':TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control':'no-cache' });
    res.end(data);
  });
});
const wss = new WebSocketServer({ server, path:'/ws', maxPayload:4096 });
wss.on('connection', ws => {
  ws.isAlive = true; ws.on('pong', () => ws.isAlive = true);
  let win = Date.now(), count = 0;
  ws.on('message', buf => {
    // simple flood guard
    if(Date.now() - win > 1000){ win = Date.now(); count = 0; } if(++count > 90) return;
    let m; try{ m = JSON.parse(buf); }catch(e){ return; }
    if(!m || typeof m !== 'object') return;
    if(m.t === 'hello' && !ws.player) join(ws, m);
    else if(m.t === 'in' && ws.player){ const i = ws.player.inp; i.d = !!m.d; if(Number.isFinite(+m.x)) i.x = Math.max(-500, Math.min(6000, +m.x)); if(Number.isFinite(+m.y)) i.y = Math.max(-500, Math.min(3000, +m.y)); i.s = m.s !== false; }
    else if(m.t === 'ping') send(ws, { t:'pong', c:m.c });
    else if(m.t === 'leave') leave(ws);
  });
  ws.on('close', () => leave(ws));
  ws.on('error', () => leave(ws));
});
// drop dead connections
setInterval(() => { for(const ws of wss.clients){ if(!ws.isAlive){ ws.terminate(); continue; } ws.isAlive = false; try{ ws.ping(); }catch(e){} } }, 15000);

function log(s){ console.log(new Date().toISOString().slice(11, 19), s); }
server.listen(PORT, () => log(`BO KATA server on http://localhost:${PORT}  (WebSocket /ws, game from ${WEB})`));
