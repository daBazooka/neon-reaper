'use strict';
/* Renderer: a sky column (wraps left/right) centered on screen; sky,
   hills and stars fill the rest of the screen. */
const FONT = '"Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
const R = {
  cv:null, c:null, W:0, H:0, dpr:1, s:1, colX:0, stars:[], hills:[],
  init(){
    this.cv = $('cv'); this.c = this.cv.getContext('2d');
    for(let i = 0; i < 160; i++) this.stars.push({ x:Math.random(), y:Math.random(), r:rnd(.6, 1.8), tw:rnd(0, TAU) });
    this.resize(); addEventListener('resize', () => this.resize());
  },
  resize(){
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.W = innerWidth; this.H = innerHeight;
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    this.s = Math.min(this.W / WORLD_W, this.H / 820);
    this.colX = (this.W - WORLD_W * this.s) / 2;
  },
  // world -> screen
  sx(x){ return this.colX + x * this.s; },
  sy(y){ return (y - G.camY) * this.s + this.H * .62; },
  skyAt(m){
    let i = 0; for(let k = 0; k < ZONES.length; k++) if(m >= ZONES[k].at) i = k;
    const a = ZONES[i], b = ZONES[Math.min(ZONES.length - 1, i + 1)], t = b === a ? 0 : clamp((m - a.at) / (b.at - a.at), 0, 1);
    return [mix(a.sky[0], b.sky[0], t), mix(a.sky[1], b.sky[1], t)];
  },
  draw(dt){
    const c = this.c, d = this.dpr, s = this.s, t = G.rt;
    const camM = altM(G.camY);
    const sh = G.shake ? (Math.random() - .5) * G.shake : 0;
    c.setTransform(d, 0, 0, d, sh * d, sh * .6 * d);
    // sky
    const [top, bot] = this.skyAt(camM + 30);
    const g = c.createLinearGradient(0, 0, 0, this.H); g.addColorStop(0, top); g.addColorStop(1, bot);
    c.fillStyle = g; c.fillRect(-20, -20, this.W + 40, this.H + 40);
    // stars fade in from the stratosphere
    const sa = clamp((camM - 1500) / 2000, 0, 1);
    if(sa > 0){ c.fillStyle = '#ffffff'; for(const st of this.stars){ c.globalAlpha = sa * (.5 + .5 * Math.sin(t * 2 + st.tw)); c.beginPath(); c.arc(st.x * this.W, ((st.y * this.H + camM * .05) % this.H), st.r, 0, TAU); c.fill(); } c.globalAlpha = 1; }
    // the Moon: a goal you can see from the very first launch, growing as you climb
    { const k = clamp(camM / MOON, 0, 1), r = lerp(Math.min(this.W, this.H) * .05, Math.min(this.W, this.H) * .5, Math.pow(k, 2.2));
      const mx = this.W * .78, my = lerp(this.H * .14, this.H * .12, k) - (camM > MOON ? (camM - MOON) * 2 : 0);
      c.fillStyle = 'rgba(255,250,220,.25)'; c.beginPath(); c.arc(mx, my, r * 1.25, 0, TAU); c.fill();
      c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(mx, my, r, 0, TAU); c.fill();
      c.fillStyle = 'rgba(200,190,160,.55)'; for(const [ox, oy, rr] of [[-.3, -.2, .18], [.25, .1, .22], [-.05, .35, .12], [.35, -.3, .1]]){ c.beginPath(); c.arc(mx + ox * r, my + oy * r, rr * r, 0, TAU); c.fill(); } }
    // far hills near the ground
    const gy = this.sy(0);
    if(gy < this.H + 200){
      c.fillStyle = '#9adf7a'; c.beginPath(); c.moveTo(0, this.H + 300);
      for(let x = 0; x <= this.W + 20; x += 20) c.lineTo(x, gy - 90 - Math.sin(x * .006 + 1) * 40 + (gy - this.H * .62) * -.0); c.lineTo(this.W, this.H + 300); c.fill();
      c.fillStyle = '#7ccc5c'; c.beginPath(); c.moveTo(0, this.H + 300);
      for(let x = 0; x <= this.W + 20; x += 20) c.lineTo(x, gy - 40 - Math.sin(x * .011 + 4) * 24); c.lineTo(this.W, this.H + 300); c.fill();
      c.fillStyle = '#5fb84a'; c.fillRect(0, gy, this.W, this.H - gy + 400);
      c.fillStyle = '#4ea53c'; c.fillRect(0, gy, this.W, 8 * s);
    }
    // column edges: soft side panels so the play area reads clearly
    const cl = this.colX, cr = this.colX + WORLD_W * s;
    // world objects (clipped to the column)
    c.save(); c.beginPath(); c.rect(cl, -50, cr - cl, this.H + 100); c.clip();
    const vy0 = G.camY - this.H * .62 / s - 80, vy1 = G.camY + this.H * .38 / s + 80;
    for(const o of G.objs){ if(o.deco && !o.dead && o.y > vy0 && o.y < vy1) drawCloud(c, this.sx(o.x), this.sy(o.y), o.s * s, .7); }
    // best-altitude line
    if(save.best > 5){ const by = this.sy(-save.best * PX); if(by > -10 && by < this.H + 10){ c.strokeStyle = 'rgba(255,255,255,.75)'; c.setLineDash([10 * s, 8 * s]); c.lineWidth = 3 * s; c.beginPath(); c.moveTo(cl, by); c.lineTo(cr, by); c.stroke(); c.setLineDash([]); label(c, 'BEST ' + fmt(save.best) + ' m', cl + 8 * s, by - 10 * s, 14 * s, '#ffffff', 'left'); } }
    // ground props: garden table + toaster
    if(gy < this.H + 200) drawToaster(c, this.sx(WORLD_W / 2), gy, s, t);
    if(G.state === 'aim' && gy < this.H + 200){
      // power meter: tap when it's at the top for a PERFECT launch
      const mx = this.sx(WORLD_W / 2) + 66 * s, mh = 120 * s, mw = 22 * s, my = gy - 40 * s - mh;
      c.fillStyle = 'rgba(58,36,24,.85)'; rr(c, mx - 4 * s, my - 4 * s, mw + 8 * s, mh + 8 * s, 8 * s); c.fill();
      const gr = c.createLinearGradient(0, my + mh, 0, my); gr.addColorStop(0, '#7be05a'); gr.addColorStop(.6, '#ffd23a'); gr.addColorStop(.86, '#ff8a2a'); gr.addColorStop(.861, '#ff3d5a'); gr.addColorStop(1, '#ff3d5a');
      c.fillStyle = gr; rr(c, mx, my, mw, mh, 5 * s); c.fill();
      label(c, '★', mx + mw / 2, my + mh * .07, 14 * s, '#fff', 'center');
      const ay = my + mh * (1 - G.meter);
      c.fillStyle = '#ffffff'; c.strokeStyle = '#3a2418'; c.lineWidth = 2.5 * s;
      c.beginPath(); c.moveTo(mx - 14 * s, ay - 8 * s); c.lineTo(mx - 2 * s, ay); c.lineTo(mx - 14 * s, ay + 8 * s); c.closePath(); c.fill(); c.stroke();
    }
    for(const o of G.objs){
      if(o.dead || o.deco || o.y < vy0 || o.y > vy1) continue;
      for(const off of [0, -WORLD_W, WORLD_W]){ const x = o.x + off; if(x < -60 || x > WORLD_W + 60) continue; drawObj(c, o, this.sx(x), this.sy(o.y), s, t); }
    }
    // toast (+ wrapped copy at the edges)
    const T = G.T;
    if(T && G.state !== 'aim') for(const off of [0, -WORLD_W, WORLD_W]){ const x = T.x + off; if(x < -60 || x > WORLD_W + 60) continue; drawToast(c, this.sx(x), this.sy(T.y), s, t, T, G.jetOn); }
    // particles, rings, text
    for(const p of G.parts){ const k = 1 - p.life / p.max; c.globalAlpha = Math.min(1, k * 1.6); c.fillStyle = p.c; c.beginPath(); c.arc(this.sx(p.x), this.sy(p.y), (p.sz * k + .5) * s, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    for(const r of G.rings){ const k = r.life / r.max; c.globalAlpha = 1 - k; c.strokeStyle = r.col; c.lineWidth = 5 * (1 - k) * s + 1; c.beginPath(); c.arc(this.sx(r.x), this.sy(r.y), r.r * (.3 + k * .9) * s, 0, TAU); c.stroke(); }
    c.globalAlpha = 1;
    for(const tx of G.texts){ const k = tx.life / tx.max, pop = k < .15 ? .6 + k / .15 * .6 : 1.2 - Math.min(.2, k - .15); c.globalAlpha = k > .7 ? (1 - k) / .3 : 1; label(c, tx.txt, this.sx(tx.x), this.sy(tx.y), 22 * tx.size * pop * s, tx.col, 'center'); }
    c.globalAlpha = 1;
    c.restore();
    // column frame
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(cl - 3, 0, 3, this.H); c.fillRect(cr, 0, 3, this.H);
    if(G.flash > 0){ c.globalAlpha = Math.min(.55, G.flash * .5); c.fillStyle = G.flashC; c.fillRect(0, 0, this.W, this.H); c.globalAlpha = 1; }
  }
};
function mix(a, b, t){
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const ch = s => Math.round(lerp(x >> s & 255, y >> s & 255, t));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
function rr(c, x, y, w, h, r){ r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function label(c, txt, x, y, size, col, align){
  c.font = `900 ${Math.round(size)}px ${FONT}`; c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.lineWidth = Math.max(3, size * .22); c.strokeStyle = 'rgba(30,20,40,.9)'; c.strokeText(txt, x, y); c.fillStyle = col; c.fillText(txt, x, y);
}
function drawCloud(c, x, y, s, a){
  c.globalAlpha = a; c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(x, y, 34 * s, 0, TAU); c.arc(x + 36 * s, y - 14 * s, 40 * s, 0, TAU); c.arc(x + 78 * s, y, 32 * s, 0, TAU); c.arc(x + 40 * s, y + 12 * s, 34 * s, 0, TAU); c.fill();
  c.globalAlpha = 1;
}
/* the hero: a slice of toast with a face */
function drawToast(c, x, y, s, t, T, jet, bread){
  const B = bread || breadDef();
  const sq = (T && T.squash || 0) * .22, w = 40 * s, h = 42 * s;
  c.save(); c.translate(x, y); c.rotate(T ? Math.sin(T.rot) * .35 : 0); c.scale(1 + sq, 1 - sq);
  if(jet){ c.fillStyle = '#ff3d5a'; c.beginPath(); c.moveTo(-8 * s, h * .45); c.lineTo(0, h * .45 + rnd(22, 34) * s); c.lineTo(8 * s, h * .45); c.fill(); c.fillStyle = '#ffd23a'; c.beginPath(); c.moveTo(-4 * s, h * .45); c.lineTo(0, h * .45 + rnd(12, 18) * s); c.lineTo(4 * s, h * .45); c.fill(); }
  c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(4 * s, 5 * s, w * .55, h * .55, 0, 0, TAU); c.fill();
  // crust + crumb (bread slice silhouette: rounded top bumps)
  const shape = (k) => { c.beginPath(); c.moveTo(-w / 2 * k, h / 2 * k); c.lineTo(-w / 2 * k, -h * .1 * k); c.arc(-w * .22 * k, -h * .22 * k, w * .3 * k, Math.PI, Math.PI * 1.85); c.arc(w * .22 * k, -h * .22 * k, w * .3 * k, Math.PI * 1.15, 0); c.lineTo(w / 2 * k, h / 2 * k); c.closePath(); };
  if(B.ring){ c.fillStyle = B.c2; c.beginPath(); c.arc(0, 0, w * .55, 0, TAU); c.fill(); c.fillStyle = B.c1; c.beginPath(); c.arc(0, 0, w * .45, 0, TAU); c.fill(); c.fillStyle = B.c2; c.beginPath(); c.arc(0, h * .05, w * .13, 0, TAU); c.fill(); }
  else {
    c.fillStyle = B.c2; shape(1); c.fill(); c.strokeStyle = '#3a2418'; c.lineWidth = 2.5 * s; c.stroke();
    c.fillStyle = B.c1; shape(.8); c.fill();
    if(B.grid){ c.strokeStyle = B.c2; c.lineWidth = 2 * s; for(let i = -1; i <= 1; i++){ c.beginPath(); c.moveTo(i * w * .2, -h * .3); c.lineTo(i * w * .2, h * .38); c.stroke(); c.beginPath(); c.moveTo(-w * .35, i * h * .18 + h * .05); c.lineTo(w * .35, i * h * .18 + h * .05); c.stroke(); } }
  }
  // butter pat
  c.fillStyle = '#fff1a8'; rr(c, -w * .16, -h * .3, w * .32, h * .18, 3 * s); c.fill();
  // face looks the way you are flying
  const lx = T ? clamp(T.vx / 400, -1, 1) : 0, ly = T ? clamp(T.vy / 900, -1, 1) : -1;
  for(const sd of [-1, 1]){ c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(sd * w * .17, h * .05, w * .1, h * .11, 0, 0, TAU); c.fill(); c.fillStyle = '#2a1a22'; c.beginPath(); c.arc(sd * w * .17 + lx * w * .04, h * .05 + ly * h * .05, w * .055, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(255,110,140,.55)'; c.beginPath(); c.arc(-w * .3, h * .2, w * .06, 0, TAU); c.arc(w * .3, h * .2, w * .06, 0, TAU); c.fill();
  c.strokeStyle = '#2a1a22'; c.lineWidth = 2 * s; c.beginPath();
  if(T && T.vy < -500) c.arc(0, h * .2, w * .09, 0, Math.PI); else c.arc(0, h * .26, w * .07, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  c.restore();
}
function drawToaster(c, x, gy, s, t){
  // garden table
  c.fillStyle = '#b5703a'; c.fillRect(x - 70 * s, gy - 40 * s, 140 * s, 10 * s);
  c.fillRect(x - 60 * s, gy - 32 * s, 8 * s, 32 * s); c.fillRect(x + 52 * s, gy - 32 * s, 8 * s, 32 * s);
  // toaster
  const tw = 70 * s, th = 46 * s, ty = gy - 40 * s - th;
  const g = c.createLinearGradient(x - tw / 2, 0, x + tw / 2, 0); g.addColorStop(0, '#b9c2cc'); g.addColorStop(.5, '#f2f6fa'); g.addColorStop(1, '#9aa3ae');
  c.fillStyle = g; rr(c, x - tw / 2, ty, tw, th, 12 * s); c.fill(); c.strokeStyle = '#3a3a48'; c.lineWidth = 2.5 * s; c.stroke();
  c.fillStyle = '#3a3a48'; rr(c, x - 22 * s, ty - 2 * s, 44 * s, 7 * s, 3 * s); c.fill();
  c.fillStyle = '#e8413a'; rr(c, x + tw / 2 - 4 * s, ty + 12 * s, 10 * s, 6 * s, 2 * s); c.fill();
  // the toast waiting inside, peeking out
  if(G.state === 'aim'){ c.save(); c.beginPath(); c.rect(x - 60 * s, ty - 80 * s, 120 * s, 80 * s); c.clip(); drawToast(c, x, ty - 8 * s + Math.sin(t * 6) * 2 * s, s * .9, t, { vx:0, vy:-200, rot:0, squash:0 }, false); c.restore(); }
}
function drawObj(c, o, x, y, s, t){
  const k = o.k;
  if(k === 'coin'){ const w = Math.abs(Math.cos(t * 5 + o.ph)) * 10 * s + 1.5; c.fillStyle = '#ffcf33'; c.strokeStyle = '#a86a00'; c.lineWidth = 2 * s; c.beginPath(); c.ellipse(x, y, w, 11 * s, 0, 0, TAU); c.fill(); c.stroke(); return; }
  if(k === 'balloon'){ const bob = Math.sin(t * 2 + o.ph) * 4 * s; c.strokeStyle = 'rgba(60,40,40,.6)'; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(x, y + 26 * s + bob); c.quadraticCurveTo(x + 6 * s, y + 40 * s, x, y + 54 * s); c.stroke(); c.fillStyle = o.col; c.strokeStyle = '#2a1a22'; c.lineWidth = 2.5 * s; c.beginPath(); c.ellipse(x, y + bob, 21 * s, 26 * s, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(x - 7 * s, y - 9 * s + bob, 5 * s, 8 * s, -.4, 0, TAU); c.fill(); c.fillStyle = o.col; c.beginPath(); c.moveTo(x - 4 * s, y + 27 * s + bob); c.lineTo(x + 4 * s, y + 27 * s + bob); c.lineTo(x, y + 22 * s + bob); c.fill(); return; }
  if(k === 'bird'){ const dir = o.vx >= 0 ? 1 : -1, fl = Math.sin(t * 14 + o.ph); c.save(); c.translate(x, y); c.scale(dir, 1); c.fillStyle = '#5ac8ff'; c.strokeStyle = '#2a1a22'; c.lineWidth = 2.5 * s; c.beginPath(); c.ellipse(0, 0, 20 * s, 15 * s, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#3a9ad8'; c.beginPath(); c.moveTo(-4 * s, -2 * s); c.lineTo(-18 * s, -20 * s * fl - 4 * s); c.lineTo(6 * s, -4 * s); c.fill(); c.stroke(); c.fillStyle = '#ffb13a'; c.beginPath(); c.moveTo(18 * s, -2 * s); c.lineTo(28 * s, 2 * s); c.lineTo(18 * s, 6 * s); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(9 * s, -5 * s, 5 * s, 0, TAU); c.fill(); c.fillStyle = '#2a1a22'; c.beginPath(); c.arc(10.5 * s, -5 * s, 2.5 * s, 0, TAU); c.fill(); c.restore(); return; }
  if(k === 'jam'){ c.fillStyle = '#e8413a'; c.strokeStyle = '#2a1a22'; c.lineWidth = 2.5 * s; rr(c, x - 15 * s, y - 14 * s, 30 * s, 32 * s, 6 * s); c.fill(); c.stroke(); c.fillStyle = '#fff2d8'; rr(c, x - 17 * s, y - 22 * s, 34 * s, 10 * s, 3 * s); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x - 10 * s, y - 8 * s, 5 * s, 18 * s); return; }
  if(k === 'storm'){ c.fillStyle = '#5a5e78'; c.beginPath(); c.arc(x - 26 * s, y, 26 * s, 0, TAU); c.arc(x, y - 14 * s, 32 * s, 0, TAU); c.arc(x + 28 * s, y, 24 * s, 0, TAU); c.fill(); if(Math.sin(t * 9 + o.ph) > .6){ c.strokeStyle = '#fff36b'; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(x, y + 12 * s); c.lineTo(x - 8 * s, y + 30 * s); c.lineTo(x + 4 * s, y + 30 * s); c.lineTo(x - 6 * s, y + 50 * s); c.stroke(); } return; }
  if(k === 'plane'){ const dir = o.vx >= 0 ? 1 : -1; c.save(); c.translate(x, y); c.scale(dir, 1); c.fillStyle = '#f2f4f8'; c.strokeStyle = '#2a1a22'; c.lineWidth = 2.5 * s; rr(c, -36 * s, -9 * s, 72 * s, 18 * s, 9 * s); c.fill(); c.stroke(); c.fillStyle = '#e8413a'; c.beginPath(); c.moveTo(-10 * s, 0); c.lineTo(-24 * s, 22 * s); c.lineTo(4 * s, 0); c.fill(); c.beginPath(); c.moveTo(-30 * s, -6 * s); c.lineTo(-40 * s, -22 * s); c.lineTo(-24 * s, -6 * s); c.fill(); c.fillStyle = '#5ac8ff'; for(let i = 0; i < 4; i++){ c.beginPath(); c.arc(-14 * s + i * 10 * s, -2 * s, 2.5 * s, 0, TAU); c.fill(); } c.restore(); return; }
  if(k === 'sat'){ c.save(); c.translate(x, y); c.rotate(t * .6 + o.ph); c.fillStyle = '#3a6ad8'; c.strokeStyle = '#2a1a22'; c.lineWidth = 2 * s; c.fillRect(-38 * s, -8 * s, 22 * s, 16 * s); c.strokeRect(-38 * s, -8 * s, 22 * s, 16 * s); c.fillRect(16 * s, -8 * s, 22 * s, 16 * s); c.strokeRect(16 * s, -8 * s, 22 * s, 16 * s); c.fillStyle = '#d6d9e0'; rr(c, -14 * s, -12 * s, 28 * s, 24 * s, 4 * s); c.fill(); c.stroke(); c.restore(); return; }
  if(k === 'ufo'){ c.fillStyle = 'rgba(125,240,255,.35)'; c.beginPath(); c.moveTo(x - 14 * s, y + 6 * s); c.lineTo(x - 30 * s, y + 46 * s); c.lineTo(x + 30 * s, y + 46 * s); c.lineTo(x + 14 * s, y + 6 * s); c.fill(); c.fillStyle = '#9fe6ff'; c.beginPath(); c.ellipse(x, y - 6 * s, 14 * s, 12 * s, 0, Math.PI, 0); c.fill(); c.fillStyle = '#b06bff'; c.strokeStyle = '#2a1a22'; c.lineWidth = 2.5 * s; c.beginPath(); c.ellipse(x, y, 32 * s, 10 * s, 0, 0, TAU); c.fill(); c.stroke(); for(let i = -2; i <= 2; i++){ c.fillStyle = Math.floor(t * 6 + i) % 2 ? '#ffd23a' : '#ffffff'; c.beginPath(); c.arc(x + i * 11 * s, y + 2 * s, 2.5 * s, 0, TAU); c.fill(); } return; }
  if(k === 'meteor'){ c.fillStyle = 'rgba(255,140,40,.5)'; c.beginPath(); c.moveTo(x - 14 * s, y - 10 * s); c.lineTo(x - o.vx * .25 * s, y - 70 * s); c.lineTo(x + 14 * s, y - 10 * s); c.fill(); c.fillStyle = '#7a5a4a'; c.strokeStyle = '#2a1a22'; c.lineWidth = 2.5 * s; c.beginPath(); c.arc(x, y, 20 * s, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#5a4034'; c.beginPath(); c.arc(x - 6 * s, y - 4 * s, 5 * s, 0, TAU); c.arc(x + 7 * s, y + 6 * s, 4 * s, 0, TAU); c.fill(); return; }
}
