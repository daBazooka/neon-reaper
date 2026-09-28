'use strict';
/* =====================================================================
   BO KATA — online client
   The server owns the truth (every pench, cut and loot). The client:
   - flies YOUR kite instantly with local prediction, gently corrected
     toward the server so it never feels laggy;
   - smooths everyone else from 20 Hz snapshots;
   - replays server events (cuts, loots) with the full effects and sounds.
   ===================================================================== */
// Put your deployed server here for the store apps, e.g. 'wss://bokata.example.com/ws'
const DEFAULT_SERVER = '';
const NET = { ws:null, state:'idle', you:-1, rtt:.1, sendT:0, pingT:0, snapAt:0, cd:0, lastCd:4, mode:'battle', err:'' };

function serverURL(){
  if(save.opt.server) return save.opt.server;
  // inside the store apps (capacitor://localhost or https://localhost) use the configured server
  const app = location.protocol === 'capacitor:' || (location.hostname === 'localhost' && !location.port);
  if(!app && (location.protocol === 'http:' || location.protocol === 'https:')) return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  return DEFAULT_SERVER;
}
function netConnect(mode){
  const url = serverURL();
  if(!url){ netFail('No online server is set. Add its address in Settings.'); return; }
  netClose();
  NET.state = 'connecting'; NET.mode = mode; NET.err = '';
  mmShow('Connecting to the sky…');
  let ws;
  try{ ws = new WebSocket(url); }catch(e){ netFail('Could not reach the server.'); return; }
  NET.ws = ws;
  const to = setTimeout(() => { if(NET.state === 'connecting') netFail('The server did not answer.'); }, 8000);
  ws.onopen = () => {
    clearTimeout(to); NET.state = 'queue';
    ws.send(JSON.stringify({ t:'hello', mode, name:save.name, kite:save.kite, thread:threadColor(save.thread), look:save.look, manja:save.manja, spool:save.spool, trophies:save.trophies }));
  };
  ws.onmessage = ev => { let m; try{ m = JSON.parse(ev.data); }catch(e){ return; } netMsg(m); };
  ws.onclose = () => { clearTimeout(to); if(NET.state === 'queue' || NET.state === 'connecting') netFail('Connection closed.'); else if(NET.state === 'play' && M && !M.over){ toast('CONNECTION LOST', 'Your match ended.'); M.over = true; M.order = M.flyers.slice(); M.me.place = M.flyers.length; setTimeout(showResults, 400); } NET.state = 'idle'; };
  ws.onerror = () => {};
}
function netClose(){ if(NET.ws){ try{ NET.ws.onclose = null; NET.ws.close(); }catch(e){} } NET.ws = null; NET.state = 'idle'; }
function netSend(o){ if(NET.ws && NET.ws.readyState === 1) NET.ws.send(JSON.stringify(o)); }
function netFail(msg){ netClose(); mmHide(); toast('OFFLINE', msg + ' Playing against bots instead.', 3200); startMatch(true); }

function netMsg(m){
  if(m.t === 'queue'){ mmShow(`Finding flyers… <b>${m.n}</b> / ${m.need}`, m.wait ? `Bots join in ${m.wait}s` : 'Starting…'); }
  else if(m.t === 'start'){
    NET.state = 'play'; NET.you = m.you; NET.lastCd = 4;
    newNetMatch(m.cfg, m.you);
    for(const F of M.flyers) F.bot = null;           // the server thinks for bots
    mmHide(); startNetMatch();
  }
  else if(m.t === 's' && M && M.net) applySnap(m);
  else if(m.t === 'end' && M && M.net){
    const by = new Map(M.flyers.map(F => [F.id, F]));
    for(const s of m.stats){ const F = by.get(s[0]); if(F){ F.cuts = s[1]; F.loots = s[2]; F.place = s[3]; } }
    M.order = m.order.map(id => by.get(id)); M.over = true; NET.state = 'done';
    setTimeout(() => { netClose(); showResults(); }, 900);
  }
  else if(m.t === 'pong'){ NET.rtt = lerp(NET.rtt, (performance.now() - m.c) / 1000, .3); }
}

/* ---------------- snapshots ---------------- */
function applySnap(s){
  const by = NET.by || (NET.by = new Map()); by.clear(); for(const F of M.flyers) by.set(F.id, F);
  NET.snapAt = performance.now();
  // events first: a cut needs the thread that is about to vanish
  if(s.e) for(const e of s.e){
    if(e.k === 'cut'){ const W = by.get(e.w), L = by.get(e.l); if(W && L){ cutFx(W, L, e.x, e.y, !!e.up); L.kite = null; } }
    else if(e.k === 'loot'){ const F = by.get(e.f); if(F) lootFx(F, kiteById(e.d), e.x, e.y); }
  }
  M.t = s.tm; NET.cd = s.cd; M.countdown = s.cd; M.wind.x = s.w;
  for(const a of s.f){
    const F = by.get(a[0]); if(!F) continue;
    if(a[1]){
      const [, , x, y, vx, vy, ang, pull, L, left, cuts, loots, out, launch] = a;
      F.kitesLeft = left; F.cuts = cuts; F.loots = loots; F.out = !!out;
      let k = F.kite;
      if(!k){ k = F.kite = { x, y, vx, vy, a:ang, pull:!!pull, L, launch, tx:x, ty:y, sway:0, hit:0, trail:[] }; if(F.me) AU.launch(); }
      if(F.me){
        // prediction: blend toward where the server says we are (plus the time it took to get here)
        const ex = x + vx * NET.rtt * .5, ey = y + vy * NET.rtt * .5, err = Math.hypot(ex - k.x, ey - k.y);
        const b = err > 160 ? .6 : err > 40 ? .12 : .04;
        k.x += (ex - k.x) * b; k.y += (ey - k.y) * b; k.vx += (vx - k.vx) * b; k.vy += (vy - k.vy) * b;
        if(err > 160) k.a = ang;
        k.launch = Math.min(k.launch, launch); if(err > 160) k.L = L;
      } else { k.sx = x; k.sy = y; k.svx = vx; k.svy = vy; k.sa = ang; k.pull = !!pull; k.L = L; k.launch = launch; }
    } else {
      const [, , left, cuts, loots, out, resp] = a;
      F.kite = null; F.kitesLeft = left; F.cuts = cuts; F.loots = loots; F.respawnT = resp;
      if(out && !F.out){ F.out = true; }
    }
  }
  // loose kites
  const lb = new Map(M.loose.map(q => [q.id, q])), keep = [];
  for(const a of s.l){
    const [id, x, y, ang, def, t0, t1, landed, t, owner, vx, vy] = a;
    let q = lb.get(id);
    if(!q){ q = { id, x, y, a:ang, def:kiteById(def), tail:[t0, t1], t, landed:0, thread:(by.get(owner) || {}).thread || '#e0303a', owner:by.get(owner), vx, vy }; }
    q.sx = x; q.sy = y; q.sa = ang; q.tail[0] = t0; q.tail[1] = t1; q.t = t; q.vx = vx; q.vy = vy;
    if(landed && !q.landed) q.landed = .01;
    keep.push(q);
  }
  M.loose = keep;
  // penches
  const had = !!myPench();
  M.pench = new Map();
  for(const [a, b, x, y, wa, wb] of s.p){ const A = by.get(a), B = by.get(b); if(A && B && A.kite && B.kite) M.pench.set(a + ':' + b, { a:A, b:B, x, y, wa, wb, gone:0, t:0 }); }
  const mine = myPench();
  if(mine && !had){ AU.penchStart(); vib(15); }
  if(mine && M.me.kite) AU.saw(Math.max(Math.hypot(M.me.kite.vx, M.me.kite.vy), 200));
}

/* ---------------- per-frame client step ---------------- */
function stepNet(dt){
  if(!M || !M.net) return;
  const me = M.me;
  // countdown ticks
  if(!M.over){ const since = (performance.now() - NET.snapAt) / 1000, cd = Math.max(0, NET.cd - since); M.countdown = cd;
    const n = Math.ceil(cd); if(n < NET.lastCd){ NET.lastCd = n; if(n > 0 && n <= 3) AU.count(n); else if(n === 0) AU.go(); } }
  if(M.countdown <= 0 && !M.over) M.t += dt;
  for(const F of M.flyers){
    F.shout = Math.max(0, F.shout - dt);
    const k = F.kite; if(!k) continue;
    if(F.me){ stepKite(F, dt, IN.down, IN.wx, IN.wy, save.opt.ctrl === 'point'); }
    else if(k.sx !== undefined){
      // smooth toward the extrapolated server state
      const age = Math.min(.25, (performance.now() - NET.snapAt) / 1000), px = k.sx + k.svx * age, py = k.sy + k.svy * age, f = Math.min(1, dt * 14);
      k.x += (px - k.x) * f; k.y += (py - k.y) * f; k.vx = k.svx; k.vy = k.svy; k.a += angDiff(k.sa, k.a) * f;
      k.trail.push(k.x, k.y); if(k.trail.length > 14) k.trail.splice(0, 2);
    }
    F.arm = lerp(F.arm, k.pull ? 1 : 0, Math.min(1, dt * 10));
  }
  for(const q of M.loose){ if(q.sx === undefined) continue; const f = Math.min(1, dt * 10); q.x += (q.sx - q.x) * f; q.y += (q.sy - q.y) * f; q.a += angDiff(q.sa, q.a) * f; if(q.landed) q.landed += dt; }
  for(const f of M.falls){ f.t += dt; for(let i = 1; i < f.p.length; i += 2) f.p[i] += (40 + f.t * 160) * dt * (i / f.p.length); }
  M.falls = M.falls.filter(f => f.t < 2.2);
  for(const p of M.fx){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.vx *= .985; p.a += p.va * dt; p.l -= dt; }
  M.fx = M.fx.filter(p => p.l > 0);
  for(const p of M.pops) p.t += dt; M.pops = M.pops.filter(p => p.t < p.d);
  for(const f of M.feed) f.t += dt; M.feed = M.feed.filter(f => f.t < 4);
  M.shake *= Math.pow(.02, dt);
  // send input ~20 times a second
  NET.sendT -= dt; NET.pingT -= dt;
  if(NET.sendT <= 0 || IN.down !== NET.lastDown){ NET.sendT = .05; NET.lastDown = IN.down; netSend({ t:'in', d:IN.down, x:Math.round(IN.wx), y:Math.round(IN.wy), s:save.opt.ctrl === 'point' }); }
  if(NET.pingT <= 0){ NET.pingT = 2; netSend({ t:'ping', c:performance.now() }); }
}

/* ---------------- matchmaking overlay ---------------- */
function mmShow(title, sub){ $('mmTitle').innerHTML = title; $('mmSub').textContent = sub || ''; show('mm'); }
function mmHide(){ hide('mm'); }
