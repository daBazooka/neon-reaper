'use strict';
/* =====================================================================
   WOBBLE BOW: drawing. Everything is drawn in code.
   ===================================================================== */
const R = {
  cv:null, c:null, W:0, H:0, dpr:1, s:1, ox:0, oy:0, clouds:[],
  init(){
    this.cv = $('c'); this.c = this.cv.getContext('2d');
    this.resize(); addEventListener('resize', () => this.resize());
    for(let i = 0; i < 7; i++) this.clouds.push({ x:Math.random(), y:rnd(.06, .4), s:rnd(.6, 1.3), v:rnd(.004, .012) });
  },
  resize(){
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.W = innerWidth; this.H = innerHeight;
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
  },
  X(x){ return (x - this.ox) * this.s; }, Y(y){ return (y - this.oy) * this.s; },
  camera(){
    const C = G.cam || { x0:-300, x1:900, y0:-400, y1:200 }, W = this.W, H = this.H;
    const topPad = 70, botPad = 30;
    let s = Math.min(W / (C.x1 - C.x0), (H - topPad - botPad) / (C.y1 - C.y0));
    let cx = (C.x0 + C.x1) / 2, cy = (C.y0 + C.y1) / 2;
    if(G.zoom){ const k = Math.min(1, G.zoom.t / .6), e = k * k * (3 - 2 * k); s *= 1 + .35 * e; cx = lerp(cx, G.zoom.x, e * .7); cy = lerp(cy, G.zoom.y, e * .7); }
    this.s = s; this.ox = cx - W / 2 / s; this.oy = cy - (H + topPad - botPad) / 2 / s;
    if(G.shake > 0){ this.ox += rnd(-1, 1) * G.shake / s; this.oy += rnd(-1, 1) * G.shake / s; }
  },

  draw(t){
    const c = this.c, W = this.W, H = this.H;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const wd = WORLDS[G.lv ? G.lv.w : 0];
    this.camera();
    this.sky(c, wd, t);
    if(G.lv){
      this.pit(c, wd, t);
      for(const p of G.pillars) this.pillar(c, p, wd);
      for(const o of G.obst) this.obstacle(c, o);
      for(const s of G.stuck) this.arrow(c, s.ob ? s.ob.x + s.ox : s.x, s.y, s.a, s.kind, 1 - clamp((s.life - 8) / 2, 0, 1));
      for(const o of G.orbs) this.orb(c, o, t);
      for(const f of G.fighters) if(!f.gone) this.fighter(c, f, t);
      for(const a of G.arrows) this.arrow(c, a.x, a.y, Math.atan2(a.vy, a.vx), a.kind, 1);
      this.aimLines(c);
      this.fx(c);
      this.bars(c);
      if(G.tut && !G.firstShot && G.state === 'fight') this.tutHand(c, t);
    }
    if(G.flash > 0){ c.globalAlpha = G.flash * .5; c.fillStyle = G.flashC; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  },

  sky(c, wd, t){
    const W = this.W, H = this.H, g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, wd.sky[0]); g.addColorStop(1, wd.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // sun
    const sx = W * .82, sy = H * .2, sr = Math.min(W, H) * .09;
    const sg = c.createRadialGradient(sx, sy, sr * .4, sx, sy, sr * 3); sg.addColorStop(0, wd.sun); sg.addColorStop(1, 'rgba(255,255,255,0)');
    c.globalAlpha = .5; c.fillStyle = sg; c.fillRect(sx - sr * 3, sy - sr * 3, sr * 6, sr * 6); c.globalAlpha = 1;
    c.fillStyle = wd.sun; c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.fill();
    // drifting clouds
    c.fillStyle = 'rgba(255,255,255,.75)';
    for(const cl of this.clouds){ const x = ((cl.x + t * cl.v) % 1.3 - .15) * W, y = cl.y * H, r = 26 * cl.s * Math.max(.7, W / 1200); this.puff(c, x, y, r); }
    // two layers of hills, slightly parallaxed
    const par = this.ox * this.s;
    for(let L = 0; L < 2; L++){
      c.fillStyle = wd.hill[L]; c.beginPath(); c.moveTo(0, H);
      const base = H * (L ? .74 : .62), amp = H * (L ? .06 : .1), k = L ? .35 : .18;
      for(let x = 0; x <= W + 20; x += 20){ const wx = x + par * k; c.lineTo(x, base - amp * (Math.sin(wx * .004 + L * 2) * .6 + Math.sin(wx * .011 + L) * .3 + Math.sin(wx * .023) * .1)); }
      c.lineTo(W, H); c.closePath(); c.fill();
    }
  },
  puff(c, x, y, r){ c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r * .9, y + r * .2, r * .75, 0, TAU); c.arc(x - r * .9, y + r * .25, r * .65, 0, TAU); c.arc(x + r * .3, y - r * .45, r * .7, 0, TAU); c.fill(); },
  pit(c, wd, t){
    let maxTop = -1e9; for(const p of G.pillars) maxTop = Math.max(maxTop, p.y0);
    const y = this.Y(maxTop + 230), W = this.W, H = this.H;
    if(y > H) return;
    if(wd.pitK === 'clouds'){ c.fillStyle = '#ffffff'; for(let x = -40; x < W + 60; x += 60) this.puff(c, x, y + 20 + Math.sin(x * .05 + t) * 6, 40); c.fillRect(0, y + 30, W, H); return; }
    const g = c.createLinearGradient(0, y, 0, H);
    if(wd.pitK === 'lava'){ g.addColorStop(0, '#ffd23a'); g.addColorStop(.15, '#ff5a1f'); g.addColorStop(1, '#8a1a10'); }
    else { g.addColorStop(0, wd.pit); g.addColorStop(1, this.shade(wd.pit, -.45)); }
    c.fillStyle = g; c.beginPath(); c.moveTo(0, H);
    for(let x = 0; x <= W + 20; x += 20) c.lineTo(x, y + Math.sin(x * .03 + t * 2) * 4 + Math.sin(x * .011 - t) * 3);
    c.lineTo(W, H); c.closePath(); c.fill();
    if(wd.pitK === 'water' || wd.pitK === 'ice'){ c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; for(let i = 0; i < 6; i++){ const x = ((i * 173 + t * 30) % (W + 100)) - 50, yy = y + 18 + (i % 3) * 16; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + 30, yy); c.stroke(); } }
  },
  shade(hex, k){ const n = parseInt(hex.slice(1), 16), f = v => clamp(Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k), 0, 255); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; },
  pillar(c, p, wd){
    const x0 = this.X(p.x0), x1 = this.X(p.x1), y0 = this.Y(p.y0), H = this.H, s = this.s;
    c.fillStyle = this.shade(wd.rock, -.25); c.fillRect(x0 + 6 * s, y0, x1 - x0 - 12 * s, H - y0);
    const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, this.shade(wd.rock, .12)); g.addColorStop(.6, wd.rock); g.addColorStop(1, this.shade(wd.rock, -.2));
    c.fillStyle = g; c.fillRect(x0 + 8 * s, y0, x1 - x0 - 16 * s, H - y0);
    c.strokeStyle = this.shade(wd.rock, -.3); c.lineWidth = 2;
    for(let yy = y0 + 40 * s; yy < H; yy += 46 * s){ c.beginPath(); c.moveTo(x0 + 8 * s, yy); c.lineTo(x1 - 8 * s, yy); c.stroke(); }
    c.fillStyle = wd.cap; this.rr(c, x0, y0 - 4 * s, x1 - x0, 16 * s, 7 * s); c.fill();
    c.fillStyle = 'rgba(255,255,255,.3)'; this.rr(c, x0 + 4 * s, y0 - 2 * s, x1 - x0 - 8 * s, 5 * s, 3 * s); c.fill();
  },
  obstacle(c, o){
    const s = this.s, x = this.X(o.x - o.w / 2), y = this.Y(o.y), w = o.w * s, h = o.h * s;
    if(o.k === 'cloud'){ c.fillStyle = '#ffffff'; c.strokeStyle = 'rgba(80,90,140,.25)'; c.lineWidth = 3; const cx = x + w / 2, cy = y + h / 2; c.beginPath(); this.puffPath(c, cx, cy, h * .55, w); c.fill(); return; }
    c.fillStyle = '#8a5a34'; this.rr(c, x, y, w, h, 5 * s); c.fill();
    c.strokeStyle = '#5e3a20'; c.lineWidth = 2;
    for(let yy = y + 28 * s; yy < y + h; yy += 28 * s){ c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); }
    c.strokeRect(x, y, w, h);
  },
  puffPath(c, cx, cy, r, w){ const n = Math.max(2, Math.round(w / (r * 1.3))); for(let i = 0; i < n; i++){ const x = cx - w / 2 + r + i * (w - 2 * r) / Math.max(1, n - 1); c.moveTo(x + r, cy); c.arc(x, cy, r * (i % 2 ? .85 : 1), 0, TAU); } },
  orb(c, o, t){
    const x = this.X(o.x), y = this.Y(o.y), r = o.r * this.s, col = ORB_COL[o.k];
    const g = c.createRadialGradient(x, y, r * .2, x, y, r * 2); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.globalAlpha = .45 + .15 * Math.sin(t * 6); c.fillStyle = g; c.fillRect(x - r * 2, y - r * 2, r * 4, r * 4); c.globalAlpha = 1;
    c.fillStyle = col; c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x - r * .3, y - r * .35, r * .35, 0, TAU); c.fill();
    c.font = `${Math.round(r * 1.05)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText({ heal:'❤️', triple:'🔱', fire:'🔥', heavy:'💥' }[o.k], x, y + 1);
  },

  limb(c, P, a, b, w, col){ c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(this.X(P[a].x), this.Y(P[a].y)); c.lineTo(this.X(P[b].x), this.Y(P[b].y)); c.stroke(); },
  fighter(c, f, t){
    const P = f.body.pts, s = this.s, sc = f.body.sc, ink = '#2a1d2e';
    c.lineCap = 'round'; c.lineJoin = 'round';
    const L = (a, b, w, col) => { this.limb(c, P, a, b, (w + 5) * s * sc, ink); };
    const F = (a, b, w, col) => { this.limb(c, P, a, b, w * s * sc, col); };
    // back arm + legs, torso, front arm
    const parts = [[1, 9, 7, f.shirt], [9, 10, 7, f.skin], [2, 3, 9, f.pants], [3, 4, 9, f.pants], [2, 5, 9, f.pants], [5, 6, 9, f.pants], [1, 2, 19, f.shirt], [1, 7, 7, f.shirt], [7, 8, 7, f.skin]];
    for(const [a, b, w] of parts) L(a, b, w);
    for(const [a, b, w, col] of parts) F(a, b, w, col);
    // feet
    c.fillStyle = ink; for(const i of [4, 6]){ c.beginPath(); c.ellipse(this.X(P[i].x) + 3 * s * sc * f.face, this.Y(P[i].y) - 2 * s * sc, 7 * s * sc, 4 * s * sc, 0, 0, TAU); c.fill(); }
    // belt
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(this.X(P[2].x), this.Y(P[2].y), 8 * s * sc, 0, TAU); c.fill();
    // stuck arrows (behind the head so the head stays readable)
    for(const k of f.sticks) this.stuckOn(c, f, k);
    // head
    const hx = this.X(P[0].x), hy = this.Y(P[0].y), hr = 13 * s * sc, ang = Math.atan2(P[0].y - P[1].y, P[0].x - P[1].x) + Math.PI / 2;
    c.fillStyle = f.hitT > 0 ? '#ffffff' : f.skin; c.strokeStyle = ink; c.lineWidth = 3 * s * sc;
    c.beginPath(); c.arc(hx, hy, hr, 0, TAU); c.fill(); c.stroke();
    // face
    const lx = Math.cos(f.aim) * hr * .35, ly = Math.sin(f.aim) * hr * .3;
    c.save(); c.translate(hx, hy); c.rotate(ang * .5);
    if(!f.alive){ c.strokeStyle = ink; c.lineWidth = 2.2 * s * sc; for(const ex of [-.38, .38]){ const x = ex * hr + lx * .5, y = -hr * .15, e = hr * .17; c.beginPath(); c.moveTo(x - e, y - e); c.lineTo(x + e, y + e); c.moveTo(x + e, y - e); c.lineTo(x - e, y + e); c.stroke(); } }
    else { c.fillStyle = ink; for(const ex of [-.36, .36]){ c.beginPath(); c.arc(ex * hr + lx, -hr * .12 + ly, hr * .13, 0, TAU); c.fill(); } }
    c.strokeStyle = ink; c.lineWidth = 2 * s * sc; c.beginPath();
    if(f.hitT > 0 || !f.alive){ c.arc(lx * .6, hr * .42, hr * .16, 0, TAU); }
    else if(f.drawing){ c.moveTo(lx * .6 - hr * .2, hr * .45); c.lineTo(lx * .6 + hr * .2, hr * .45); }
    else { c.arc(lx * .6, hr * .3, hr * .22, .2, Math.PI - .2); }
    c.stroke(); c.restore();
    this.hat(c, f.hat, hx, hy, hr, ang, f);
    // bow
    if(f.alive || f.falling) this.bow(c, f);
    if(f.shield && f.alive) this.shield(c, f);
  },
  bow(c, f){
    const P = f.body.pts, s = this.s, sc = f.body.sc, a = f.alive ? f.aim : Math.atan2(P[8].y - P[7].y, P[8].x - P[7].x);
    const hx = P[8].x, hy = P[8].y, R0 = 30 * sc, cx = hx - Math.cos(a) * 14 * sc, cy = hy - Math.sin(a) * 14 * sc;
    const t1 = [cx + Math.cos(a - 1.05) * R0, cy + Math.sin(a - 1.05) * R0], t2 = [cx + Math.cos(a + 1.05) * R0, cy + Math.sin(a + 1.05) * R0];
    c.strokeStyle = '#f4ead8'; c.lineWidth = 1.5 * s;
    c.beginPath(); c.moveTo(this.X(t1[0]), this.Y(t1[1]));
    if(f.drawing && f.alive){ c.lineTo(this.X(P[10].x), this.Y(P[10].y)); }
    c.lineTo(this.X(t2[0]), this.Y(t2[1])); c.stroke();
    c.strokeStyle = '#2a1d2e'; c.lineWidth = 7 * s * sc; c.beginPath(); c.arc(this.X(cx), this.Y(cy), R0 * s, a - 1.05, a + 1.05); c.stroke();
    c.strokeStyle = f.side === 0 ? '#b8743a' : '#7a4a2a'; c.lineWidth = 4 * s * sc; c.beginPath(); c.arc(this.X(cx), this.Y(cy), R0 * s, a - 1.05, a + 1.05); c.stroke();
    // nocked arrow
    if(f.alive && (f.drawing || f.relT <= 0) && G.state === 'fight'){
      const nx = f.drawing ? P[10].x : hx - Math.cos(a) * 20 * sc, ny = f.drawing ? P[10].y : hy - Math.sin(a) * 20 * sc;
      const kind = f.buff && (f.buff.k === 'fire' || f.buff.k === 'heavy') ? f.buff.k : (f.bomb ? 'bomb' : 'n');
      this.arrow(c, nx + Math.cos(a) * 46, ny + Math.sin(a) * 46, a, kind, 1);
    }
  },
  shield(c, f){
    const P = f.body.pts, s = this.s, sc = f.body.sc, x = this.X(P[1].x + f.face * 24 * sc), y0 = this.Y(f.top - 92 * sc), y1 = this.Y(f.top - 28 * sc), w = 13 * s * sc;
    c.fillStyle = '#2a1d2e'; this.rr(c, x - w / 2 - 2, y0 - 2, w + 4, y1 - y0 + 4, w / 2); c.fill();
    const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, '#dfe8f4'); g.addColorStop(1, '#8fa0b8');
    c.fillStyle = g; this.rr(c, x - w / 2, y0, w, y1 - y0, w / 2); c.fill();
    c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(x, (y0 + y1) / 2, w * .3, 0, TAU); c.fill();
  },
  stuckOn(c, f, k){
    const P = f.body.pts;
    if(k.shield){ const x = P[1].x + k.ox, y = P[1].y + k.oy; this.arrow(c, x + Math.cos(k.a) * 10, y + Math.sin(k.a) * 10, k.a, 'n', 1); return; }
    const A = P[k.ia], B = P[k.ib], bx = B.x - A.x, by = B.y - A.y, ba = Math.atan2(by, bx), bl = Math.hypot(bx, by);
    const cs = Math.cos(ba), sn = Math.sin(ba), ux = k.u * bl, x = A.x + ux * cs - k.v * sn, y = A.y + ux * sn + k.v * cs, a = ba + k.a;
    this.arrow(c, x + Math.cos(a) * 8, y + Math.sin(a) * 8, a, k.fire ? 'fire' : 'n', 1);
  },
  /* arrow with its tip at (x, y) */
  arrow(c, x, y, a, kind, alpha){
    if(alpha <= 0) return;
    const s = this.s * (this.as || 1), L = (kind === 'heavy' ? 58 : 46) * s, tx = this.X(x), ty = this.Y(y), dx = Math.cos(a), dy = Math.sin(a);
    c.globalAlpha = alpha;
    if(kind === 'fire'){ c.fillStyle = 'rgba(255,140,40,.35)'; c.beginPath(); c.arc(tx, ty, 9 * s, 0, TAU); c.fill(); }
    if(kind === 'heavy'){ c.fillStyle = 'rgba(180,106,255,.35)'; c.beginPath(); c.arc(tx - dx * L * .3, ty - dy * L * .3, 16 * s, 0, TAU); c.fill(); }
    c.strokeStyle = kind === 'heavy' ? '#5a2a8a' : '#7a4a26'; c.lineWidth = (kind === 'heavy' ? 4.5 : 3) * s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx - dx * L, ty - dy * L); c.stroke();
    // fletching
    const fx = tx - dx * L, fy = ty - dy * L, nx = -dy, ny = dx;
    c.fillStyle = kind === 'fire' ? '#ffb13a' : kind === 'heavy' ? '#b46aff' : '#ff5a6a';
    c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + dx * 11 * s + nx * 5 * s, fy + dy * 11 * s + ny * 5 * s); c.lineTo(fx + dx * 13 * s, fy + dy * 13 * s); c.lineTo(fx + dx * 11 * s - nx * 5 * s, fy + dy * 11 * s - ny * 5 * s); c.closePath(); c.fill();
    if(kind === 'bomb'){ c.fillStyle = '#2a2a2a'; c.beginPath(); c.arc(tx, ty, 6 * s, 0, TAU); c.fill(); c.fillStyle = Math.random() < .5 ? '#ffd23a' : '#ff5a2a'; c.beginPath(); c.arc(tx - nx * 6 * s, ty - ny * 6 * s, 2.5 * s, 0, TAU); c.fill(); }
    else { c.fillStyle = kind === 'fire' ? '#ff7a2a' : '#c8ccd4'; c.beginPath(); c.moveTo(tx + dx * 4 * s, ty + dy * 4 * s); c.lineTo(tx - dx * 8 * s + nx * 4.5 * s, ty - dy * 8 * s + ny * 4.5 * s); c.lineTo(tx - dx * 8 * s - nx * 4.5 * s, ty - dy * 8 * s - ny * 4.5 * s); c.closePath(); c.fill(); }
    c.globalAlpha = 1;
  },
  hat(c, id, x, y, r, ang, f){
    if(!id || id === 'none') return;
    c.save(); c.translate(x, y); c.rotate(ang * .6);
    const ink = '#2a1d2e', lw = Math.max(1.5, r * .16);
    c.lineWidth = lw; c.strokeStyle = ink;
    const P = (fill, fn) => { c.fillStyle = fill; c.beginPath(); fn(); c.fill(); c.stroke(); };
    const fc = f ? f.face : 1;
    switch(id){
      case 'cap': P('#e8403a', () => { c.arc(0, -r * .35, r * .95, Math.PI, 0); c.closePath(); }); P('#e8403a', () => { c.rect(fc > 0 ? 0 : -r * 1.6, -r * .45, r * 1.6, r * .25); }); break;
      case 'band': P('#e8403a', () => c.rect(-r, -r * .62, r * 2, r * .32)); c.fillStyle = '#e8403a'; c.beginPath(); c.moveTo(-r * fc, -r * .5); c.lineTo(-r * 1.7 * fc, -r * .2); c.lineTo(-r * 1.6 * fc, -r * .7); c.fill(); break;
      case 'cowboy': P('#a8743a', () => c.ellipse(0, -r * .7, r * 1.7, r * .3, 0, 0, TAU)); P('#a8743a', () => { c.moveTo(-r * .8, -r * .75); c.lineTo(-r * .7, -r * 1.6); c.quadraticCurveTo(0, -r * 1.3, r * .7, -r * 1.6); c.lineTo(r * .8, -r * .75); c.closePath(); }); break;
      case 'viking': P('#f4ead8', () => { c.moveTo(-r * .8, -r * .6); c.quadraticCurveTo(-r * 1.6, -r * 1, -r * 1.5, -r * 1.8); c.quadraticCurveTo(-r * 1.1, -r * 1.1, -r * .5, -r * .9); c.closePath(); }); P('#f4ead8', () => { c.moveTo(r * .8, -r * .6); c.quadraticCurveTo(r * 1.6, -r * 1, r * 1.5, -r * 1.8); c.quadraticCurveTo(r * 1.1, -r * 1.1, r * .5, -r * .9); c.closePath(); }); P('#9aa4b4', () => { c.arc(0, -r * .3, r * 1.02, Math.PI, 0); c.closePath(); }); break;
      case 'chef': P('#ffffff', () => { c.rect(-r * .75, -r * 1.3, r * 1.5, r * .8); }); P('#ffffff', () => { c.arc(-r * .4, -r * 1.45, r * .5, 0, TAU); }); P('#ffffff', () => { c.arc(r * .4, -r * 1.45, r * .5, 0, TAU); }); P('#ffffff', () => { c.arc(0, -r * 1.7, r * .55, 0, TAU); }); break;
      case 'pirate': P('#2a2a3a', () => { c.moveTo(-r * 1.5, -r * .55); c.quadraticCurveTo(0, -r * 2.1, r * 1.5, -r * .55); c.quadraticCurveTo(0, -r * .9, -r * 1.5, -r * .55); }); c.fillStyle = '#ffffff'; c.font = `${r * .6}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('☠', 0, -r * 1.1); break;
      case 'wizard': P('#5a3ab0', () => { c.moveTo(-r * 1.2, -r * .6); c.lineTo(r * .2 * -fc, -r * 2.6); c.lineTo(r * 1.2, -r * .6); c.closePath(); }); c.fillStyle = '#ffd23a'; c.font = `${r * .55}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★', 0, -r * 1.2); break;
      case 'tophat': P('#2a2a2a', () => c.ellipse(0, -r * .72, r * 1.35, r * .25, 0, 0, TAU)); P('#2a2a2a', () => c.rect(-r * .75, -r * 2, r * 1.5, r * 1.3)); c.fillStyle = '#e8403a'; c.fillRect(-r * .75, -r * 1.05, r * 1.5, r * .25); break;
      case 'crown': case 'gold': P(id === 'gold' ? '#ffe14a' : '#ffc43a', () => { c.moveTo(-r * .9, -r * .6); c.lineTo(-r * .9, -r * 1.45); c.lineTo(-r * .45, -r * 1); c.lineTo(0, -r * 1.6); c.lineTo(r * .45, -r * 1); c.lineTo(r * .9, -r * 1.45); c.lineTo(r * .9, -r * .6); c.closePath(); });
        c.fillStyle = '#e8403a'; c.beginPath(); c.arc(0, -r * .85, r * .15, 0, TAU); c.fill(); if(id === 'gold'){ c.fillStyle = 'rgba(255,240,150,.5)'; c.beginPath(); c.arc(0, -r * 1.1, r * 1.3, 0, TAU); c.fill(); } break;
      case 'pumpkin': P('#ff8a2a', () => c.ellipse(0, -r * .45, r * 1.15, r * .85, 0, Math.PI, 0)); c.fillStyle = '#4a8a3a'; c.fillRect(-r * .1, -r * 1.55, r * .2, r * .3); break;
      case 'halo': c.strokeStyle = '#ffe14a'; c.lineWidth = r * .22; c.beginPath(); c.ellipse(0, -r * 1.55, r * .85, r * .25, 0, 0, TAU); c.stroke(); break;
      case 'astro': c.fillStyle = 'rgba(190,230,255,.35)'; c.strokeStyle = '#e8eef8'; c.lineWidth = r * .22; c.beginPath(); c.arc(0, 0, r * 1.35, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(-r * .5, -r * .6, r * .25, 0, TAU); c.fill(); break;
    }
    c.restore();
  },
  aimLines(c){
    for(const f of G.fighters){
      if(!f.human || !f.alive || !f.drawing || f.relT > 0 || G.state !== 'fight' || G.demo) continue;
      const p = G.pin[f.human]; if(!p || p.power < .12) continue;
      const v = speedFor(p.power), [x0, y0] = bowPos(f);
      let x = x0, y = y0, vx = Math.cos(f.aim) * v, vy = Math.sin(f.aim) * v, len = 0;
      const maxL = (G.mode === 'duo' ? .45 : pScope(save.up.scope)) * 1400, dt = 1 / 90;
      c.fillStyle = '#ffffff';
      let i = 0;
      while(len < maxL && i < 400){
        const nx = x + vx * dt, ny = y + vy * dt; vy += GRAV * dt; len += Math.hypot(nx - x, ny - y); x = nx; y = ny; i++;
        if(i % 3 === 0){ c.globalAlpha = .85 * (1 - len / maxL); c.beginPath(); c.arc(this.X(x), this.Y(y), Math.max(2, 3.2 * this.s), 0, TAU); c.fill(); }
      }
      c.globalAlpha = 1;
    }
  },
  fx(c){
    const s = this.s;
    for(const b of G.booms){ const k = b.life / .5, r = (30 + 90 * k) * s; c.globalAlpha = 1 - k; c.fillStyle = '#ffd27a'; c.beginPath(); c.arc(this.X(b.x), this.Y(b.y), r, 0, TAU); c.fill(); c.fillStyle = '#ff7a2a'; c.beginPath(); c.arc(this.X(b.x), this.Y(b.y), r * .6, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    for(const p of G.parts){ c.globalAlpha = 1 - p.life / p.max; c.fillStyle = p.c; const z = p.sz * Math.max(.6, s); c.fillRect(this.X(p.x) - z / 2, this.Y(p.y) - z / 2, z, z); }
    c.globalAlpha = 1;
    for(const r of G.rings){ const k = r.life / r.max; c.globalAlpha = 1 - k; c.strokeStyle = r.col; c.lineWidth = 3; c.beginPath(); c.arc(this.X(r.x), this.Y(r.y), r.r * (.4 + k) * s, 0, TAU); c.stroke(); }
    c.globalAlpha = 1;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for(const t of G.texts){
      const k = t.life / t.max, sz = Math.round(22 * t.size * Math.max(.8, Math.min(1.4, s * 1.4)) * (k < .12 ? .6 + k * 3.3 : 1));
      c.globalAlpha = k > .7 ? (1 - k) / .3 : 1;
      c.font = `900 ${sz}px "Arial Black", "Trebuchet MS", sans-serif`; c.lineWidth = Math.max(3, sz * .2); c.strokeStyle = '#2a1d2e';
      c.strokeText(t.txt, this.X(t.x), this.Y(t.y)); c.fillStyle = t.col; c.fillText(t.txt, this.X(t.x), this.Y(t.y));
    }
    c.globalAlpha = 1;
  },
  bars(c){
    for(const f of G.fighters){
      if(!f.alive || f.gone) continue;
      const P = f.body.pts, w = f.boss ? 110 : 76, h = f.boss ? 12 : 10, x = this.X(P[0].x) - w / 2, y = this.Y(f.top - 128 * f.body.sc) - 18;
      const k = clamp(f.hp / f.maxHp, 0, 1);
      c.fillStyle = 'rgba(42,29,46,.85)'; this.rr(c, x - 3, y - 3, w + 6, h + 6, 6); c.fill();
      c.fillStyle = k > .5 ? '#4ade6a' : k > .25 ? '#ffc43a' : '#ff5a5a'; this.rr(c, x, y, w * k, h, 4); c.fill();
      c.font = '900 11px "Trebuchet MS", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'bottom';
      c.lineWidth = 3; c.strokeStyle = '#2a1d2e'; const lbl = f.side === 0 && G.mode !== 'duo' ? fmt(f.hp) : f.name + '  ' + fmt(f.hp);
      c.strokeText(lbl, x + w / 2, y - 4); c.fillStyle = '#ffffff'; c.fillText(lbl, x + w / 2, y - 4);
      if(f.buff){ c.font = '15px sans-serif'; c.textBaseline = 'middle'; c.fillText({ triple:'🔱', fire:'🔥', heavy:'💥' }[f.buff.k] + (f.buff.n > 1 ? '×' + f.buff.n : ''), x + w + 22, y + h / 2); }
      // reload ring for human archers
      if(f.human && f.relT > 0 && G.state === 'fight'){
        const hx = this.X(P[8].x), hy = this.Y(P[8].y), k2 = 1 - f.relT / f.rel;
        c.strokeStyle = 'rgba(42,29,46,.6)'; c.lineWidth = 5; c.beginPath(); c.arc(hx, hy, 16, 0, TAU); c.stroke();
        c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.arc(hx, hy, 16, -Math.PI / 2, -Math.PI / 2 + TAU * k2); c.stroke();
      }
    }
  },
  tutHand(c, t){
    const f = G.fighters[0], P = f.body.pts, bx = this.X(P[1].x) + 60, by = this.Y(P[1].y) - 10;
    const k = (t % 1.8) / 1.8, e = Math.min(1, k / .7), x = bx - 110 * e, y = by + 70 * e;
    c.globalAlpha = k > .85 ? (1 - k) / .15 : 1;
    c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.setLineDash([8, 8]); c.beginPath(); c.moveTo(bx, by); c.lineTo(x, y); c.stroke(); c.setLineDash([]);
    c.font = '46px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('👆', x + 6, y + 22);
    c.globalAlpha = 1;
    const fs = Math.round(clamp(this.W / 22, 20, 34));
    c.font = `900 ${fs}px "Arial Black", "Trebuchet MS", sans-serif`; c.lineWidth = fs * .22; c.strokeStyle = '#2a1d2e';
    const ty = this.H * .3;
    c.strokeText('DRAG BACK, AIM, RELEASE!', this.W / 2, ty); c.fillStyle = '#ffffff'; c.fillText('DRAG BACK, AIM, RELEASE!', this.W / 2, ty);
    c.font = `800 ${Math.round(fs * .55)}px "Trebuchet MS", sans-serif`; c.lineWidth = 4;
    const t2 = 'Headshots hit 2x harder';
    c.strokeText(t2, this.W / 2, ty + fs * 1.1); c.fillStyle = '#ffe07a'; c.fillText(t2, this.W / 2, ty + fs * 1.1);
  },
  rr(c, x, y, w, h, r){ r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); },
};
