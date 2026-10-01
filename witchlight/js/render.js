'use strict';
/* Renderer. The world is drawn, then a darkness layer is laid over it with
   light carved out by the lantern, spells, motes and every flower grown. */
const R = {
  cv: null, c: null, W: 0, H: 0, dpr: 1, s: 1, dk: null, dc: null, light: null, pat: null,
  init(){
    this.cv = $('cv'); this.c = this.cv.getContext('2d');
    this.dk = document.createElement('canvas'); this.dc = this.dk.getContext('2d');
    // a soft light blob, reused for every light source
    this.light = document.createElement('canvas'); this.light.width = this.light.height = 128;
    const l = this.light.getContext('2d'), g = l.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = g; l.fillRect(0, 0, 128, 128);
    this.glow = {};
    this.resize(); addEventListener('resize', () => this.resize());
  },
  glowSprite(col){
    if(this.glow[col]) return this.glow[col];
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const c = cv.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, col); g.addColorStop(0.35, col + '88'); g.addColorStop(1, col + '00');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    return (this.glow[col] = cv);
  },
  resize(){
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.W = innerWidth; this.H = innerHeight;
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    this.s = Math.max(this.W, this.H) / 1150;
    this.dk.width = Math.ceil(this.W / 3); this.dk.height = Math.ceil(this.H / 3);
  },
  ground(){
    if(this.pat) return this.pat;
    const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const c = cv.getContext('2d');
    c.fillStyle = '#1a2340'; c.fillRect(0, 0, S, S);
    let s = 11; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for(let i = 0; i < 60; i++){ c.fillStyle = r() < 0.5 ? '#202b4c' : '#161e38'; c.beginPath(); c.ellipse(r() * S, r() * S, 6 + r() * 16, 4 + r() * 10, r() * 3, 0, TAU); c.fill(); }
    c.strokeStyle = '#2a3a5e'; c.lineWidth = 2;
    for(let i = 0; i < 40; i++){ const x = r() * S, y = r() * S; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3 + r() * 6, y - 8 - r() * 6); c.stroke(); }
    this.pat = this.c.createPattern(cv, 'repeat');
    return this.pat;
  },
  draw(){
    const c = this.c, d = this.dpr, s = this.s, P = G.P;
    if(!P) return;
    const cx = P.x + (this.cdx || 0), cy = P.y + (this.cdy || 0), sh = save.opt.shake ? G.shake : 0;
    const ox = this.W / 2 - cx * s + (Math.random() - 0.5) * sh, oy = this.H / 2 - cy * s + (Math.random() - 0.5) * sh;
    const vx0 = cx - this.W / 2 / s - 80, vx1 = cx + this.W / 2 / s + 80, vy0 = cy - this.H / 2 / s - 80, vy1 = cy + this.H / 2 / s + 80;
    const inV = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
    c.setTransform(d, 0, 0, d, 0, 0); c.fillStyle = '#05060f'; c.fillRect(0, 0, this.W, this.H);
    c.setTransform(s * d, 0, 0, s * d, ox * d, oy * d);
    c.fillStyle = this.ground(); c.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
    // flowers
    const t = G.rt;
    for(const f of G.flowers){ if(inV(f.x, f.y)) drawFlower(c, f, t); }
    // fire pools, plants, geysers
    for(const p of G.pools){ c.globalAlpha = Math.min(1, p.life) * 0.5; c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r * (0.9 + Math.sin(t * 12) * 0.05), 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    for(const pl of G.plants) drawSunflower(c, pl, t);
    // foes (bodies; eyes are drawn above the darkness)
    for(const f of G.foes){ if(!f.dead && inV(f.x, f.y)) drawFoe(c, f, t); }
    // player
    drawWitch(c, P, t);
    // darkness with carved light
    const night = 1;
    if(night > 0.01) this.dark(c, d, s, ox, oy, inV, night);
    c.setTransform(s * d, 0, 0, s * d, ox * d, oy * d);
    // glowing things on top of the dark
    c.globalCompositeOperation = 'lighter';
    for(const f of G.foes){ if(f.dead || !inV(f.x, f.y)) continue; drawEyes(c, f, t); }
    for(const f of G.foes){ if(f.dead || !(f.wind > 0)) continue; const k = 1 - f.wind / 0.8; c.globalAlpha = 0.25 + k * 0.5; c.strokeStyle = '#ff3a6a'; c.lineWidth = f.r * 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x + f.dx * 320, f.y + f.dy * 320); c.stroke(); c.globalAlpha = 1; }
    c.globalAlpha = 0.45; for(const f of G.flowers){ if(!inV(f.x, f.y)) continue; const z = 26 * f.s * (0.85 + Math.sin(t * 2.2 + f.ph) * 0.15); c.drawImage(this.glowSprite(f.c), f.x - z, f.y - z, z * 2, z * 2); } c.globalAlpha = 1;
    for(const m of G.motes){ if(!inV(m.x, m.y)) continue; const g = this.glowSprite(m.big ? '#7df0ff' : '#9fd8ff'), z = m.big ? 30 : 18; c.drawImage(g, m.x - z, m.y - z, z * 2, z * 2); }
    this.spells(c, t);
    for(const p of G.parts){ const k = 1 - p.life / p.max; c.globalAlpha = Math.min(1, k * 1.5); c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.sz * k + 0.5, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    for(const r of G.rings){ const k = r.life / r.max; c.globalAlpha = 1 - k; c.strokeStyle = r.col; c.lineWidth = 6 * (1 - k) + 1; c.beginPath(); c.arc(r.x, r.y, r.r * (0.3 + k * 0.8), 0, TAU); c.stroke(); }
    c.globalAlpha = 1;
    for(const b of G.ebul){ const g = this.glowSprite('#ff3a8a'); c.drawImage(g, b.x - 18, b.y - 18, 36, 36); c.fillStyle = '#ffd0e8'; c.beginPath(); c.arc(b.x, b.y, 4, 0, TAU); c.fill(); }
    c.globalCompositeOperation = 'source-over';
    for(const it of G.drops) drawDrop(c, it, t);
    for(const f of G.foes){ if(f.dead || !f.boss) continue; const w = f.r * 2.2, k = Math.max(0, f.hp / f.max); c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(f.x - w / 2, f.y - f.r - 26, w, 8); c.fillStyle = '#ff5aa0'; c.fillRect(f.x - w / 2, f.y - f.r - 26, w * k, 8); }
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    for(const tx of G.texts){ const k = tx.life / tx.max; c.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1; c.font = `900 ${Math.round(20 * tx.size)}px ${FONT}`; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,0.85)'; c.strokeText(tx.txt, tx.x, tx.y); c.fillStyle = tx.col; c.fillText(tx.txt, tx.x, tx.y); }
    c.globalAlpha = 1;
    // screen space
    c.setTransform(d, 0, 0, d, 0, 0);
    if(G.state === 'dawn'){ const k = Math.min(1, G.dawnT / 3); const g = c.createLinearGradient(0, 0, 0, this.H); g.addColorStop(0, `rgba(255,170,120,${0.3 * k})`); g.addColorStop(1, `rgba(255,220,180,${0.06 * k})`); c.fillStyle = g; c.fillRect(0, 0, this.W, this.H); }
    if(G.P.hp < G.P.max * 0.3 && G.state === 'play'){ const a = 0.25 + Math.sin(G.rt * 8) * 0.1; const g = c.createRadialGradient(this.W / 2, this.H / 2, Math.min(this.W, this.H) * 0.3, this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.7); g.addColorStop(0, 'rgba(255,0,60,0)'); g.addColorStop(1, `rgba(255,0,60,${a})`); c.fillStyle = g; c.fillRect(0, 0, this.W, this.H); }
    if(G.flash > 0){ c.globalAlpha = Math.min(0.6, G.flash * 0.5); c.fillStyle = G.flashC; c.fillRect(0, 0, this.W, this.H); c.globalAlpha = 1; }
  },
  dark(c, d, s, ox, oy, inV, night){
    const dc = this.dc, k = 1 / 3;
    dc.setTransform(1, 0, 0, 1, 0, 0); dc.globalCompositeOperation = 'source-over';
    dc.clearRect(0, 0, this.dk.width, this.dk.height);
    const dk = G.state === 'dawn' ? Math.min(1, G.dawnT / 3) : 0;
    dc.fillStyle = `rgba(${6 + 64 * dk | 0},${6 + 16 * dk | 0},${26 + 34 * dk | 0},${0.9 - 0.32 * dk})`; dc.fillRect(0, 0, this.dk.width, this.dk.height);
    dc.globalCompositeOperation = 'destination-out';
    dc.setTransform(s * k, 0, 0, s * k, ox * k, oy * k);
    const L = this.light, lit = (x, y, r, a) => { dc.globalAlpha = a == null ? 1 : a; dc.drawImage(L, x - r, y - r, r * 2, r * 2); };
    const P = G.P, lr = lightR() * (1 + Math.sin(G.rt * 3) * 0.03);
    lit(P.x, P.y - 10, lr * 1.25);
    for(const f of G.flowers) if(inV(f.x, f.y)) lit(f.x, f.y, 44 * f.s, 0.6);
    for(const sh of G.shots) lit(sh.x, sh.y, sh.k === 'fire' ? 90 : 50, 0.9);
    for(const p of G.pools) lit(p.x, p.y, p.r * 2, 0.8);
    for(const m of G.motes) if(inV(m.x, m.y)) lit(m.x, m.y, m.big ? 50 : 26, 0.6);
    for(const r of G.rings) lit(r.x, r.y, r.r * 1.2, 0.5 * (1 - r.life / r.max));
    for(const b of G.bolts) for(const p of b.pts) lit(p.x, p.y, 110, 0.8 * (1 - b.life / b.max));
    for(const pl of G.plants) lit(pl.x, pl.y, 120, 0.8);
    for(const m of G.meteors) lit(m.x, m.y, 200, Math.min(1, m.t * 2));
    for(const it of G.drops) lit(it.x, it.y, 70, 0.8);
    if(G.spells.light || G.fus.prism) lit(P.x, P.y, 320, 0.5);
    dc.globalAlpha = 1;
    c.setTransform(d, 0, 0, d, 0, 0);
    c.drawImage(this.dk, 0, 0, this.W, this.H);
  },
  spells(c, t){
    const P = G.P, S = G.spells;
    if(S.frost){ const L = S.frost, n = Math.min(6, 2 + Math.floor(L / 2)), rad = 82 + 4 * L, a0 = G.t * 2.6;
      for(let i = 0; i < n; i++){ const a = a0 + i / n * TAU, x = P.x + Math.cos(a) * rad, y = P.y + Math.sin(a) * rad;
        c.drawImage(this.glowSprite('#7fe3ff'), x - 22, y - 22, 44, 44);
        c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.fillStyle = '#e8fbff'; c.beginPath(); c.moveTo(0, -12); c.lineTo(5, 0); c.lineTo(0, 12); c.lineTo(-5, 0); c.closePath(); c.fill(); c.restore(); } }
    if(S.light){ drawBeam(c, P, G.beamA, 210 + 22 * S.light, '#ffe9a8', 16); }
    if(G.fus.prism){ for(let i = 0; i < 6; i++) drawBeam(c, P, -G.beamA * 1.3 + i / 6 * TAU, 270, `hsl(${i * 60 + t * 60},100%,70%)`, 10); }
    if(G.fus.blizzard){ c.strokeStyle = 'rgba(191,239,255,0.35)'; c.lineWidth = 3; c.setLineDash([12, 14]); c.lineDashOffset = -t * 80; c.beginPath(); c.arc(P.x, P.y, 175, 0, TAU); c.stroke(); c.setLineDash([]); }
    for(const s of G.shots){
      const col = s.k === 'fire' ? '#ff7a2e' : s.k === 'seed' ? '#ffd23a' : '#c58bff';
      c.drawImage(this.glowSprite(col), s.x - 26, s.y - 26, 52, 52);
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(s.x, s.y, s.k === 'fire' ? 6 : 4, 0, TAU); c.fill();
      if(s.k === 'fire' && Math.random() < 0.6) G.parts.push({ x: s.x, y: s.y, vx: rnd(-30, 30), vy: rnd(-30, 30), life: 0, max: 0.35, c: '#ffb13a', sz: 4 });
    }
    c.lineCap = 'round'; c.lineJoin = 'round';
    for(const b of G.bolts){ const k = 1 - b.life / b.max; c.globalAlpha = k; c.strokeStyle = b.col; c.lineWidth = (b.w || 4) * k + 1;
      c.beginPath(); c.moveTo(b.pts[0].x, b.pts[0].y); for(let i = 1; i < b.pts.length; i++){ const p0 = b.pts[i - 1], p1 = b.pts[i]; for(let j = 1; j <= 3; j++){ const q = j / 3; c.lineTo(lerp(p0.x, p1.x, q) + (j < 3 ? rnd(-12, 12) : 0), lerp(p0.y, p1.y, q) + (j < 3 ? rnd(-12, 12) : 0)); } } c.stroke(); }
    c.globalAlpha = 1;
    for(const g of G.geysers){ if(g.t < 0.4){ c.strokeStyle = 'rgba(232,246,255,0.7)'; c.lineWidth = 3; c.beginPath(); c.arc(g.x, g.y, 70 * g.t / 0.4, 0, TAU); c.stroke(); } else { const k = (g.t - 0.4) / 0.5; c.globalAlpha = 1 - k; c.drawImage(this.glowSprite('#e8f6ff'), g.x - 60, g.y - 140 * (1 - k * 0.3), 120, 160); c.globalAlpha = 1; } }
    for(const m of G.meteors){ if(m.t < 0.6){ const k = m.t / 0.6, x = m.x + (1 - k) * 260, y = m.y - (1 - k) * 520; c.drawImage(this.glowSprite('#ffb13a'), x - 50, y - 50, 100, 100); c.fillStyle = '#fff2c8'; c.beginPath(); c.arc(x, y, 14, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,177,58,0.5)'; c.lineWidth = 2; c.beginPath(); c.arc(m.x, m.y, 130 * (0.4 + k * 0.6), 0, TAU); c.stroke(); } }
  }
};

const FONT = '"Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
function drawBeam(c, P, a, len, col, w){
  const x1 = P.x + Math.cos(a) * len, y1 = P.y + Math.sin(a) * len;
  c.lineCap = 'round';
  c.strokeStyle = col; c.globalAlpha = 0.25; c.lineWidth = w * 3; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(x1, y1); c.stroke();
  c.globalAlpha = 0.9; c.lineWidth = w * 0.6; c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(x1, y1); c.stroke();
  c.globalAlpha = 1;
}
const flowerCache = {};
function flowerSprite(col, k, rot){
  const key = col + k + rot;
  if(flowerCache[key]) return flowerCache[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = 96;
  const c = cv.getContext('2d');
  c.translate(48, 48); c.scale(3, 3); c.rotate(rot * TAU / 20);
  c.fillStyle = col;
  if(k === 0){ for(let i = 0; i < 5; i++){ const a = i / 5 * TAU; c.beginPath(); c.ellipse(Math.cos(a) * 6, Math.sin(a) * 6, 5, 3, a, 0, TAU); c.fill(); } }
  else if(k === 1){ for(let i = 0; i < 4; i++){ const a = i / 4 * TAU; c.beginPath(); c.ellipse(Math.cos(a) * 5, Math.sin(a) * 5, 6, 2.5, a, 0, TAU); c.fill(); } }
  else { c.beginPath(); c.moveTo(0, -8); c.quadraticCurveTo(6, 0, 0, 8); c.quadraticCurveTo(-6, 0, 0, -8); c.fill(); c.fillStyle = '#3fae5a'; c.fillRect(-0.8, 6, 1.6, 7); }
  c.fillStyle = '#fff8d0'; c.beginPath(); c.arc(0, 0, 2.6, 0, TAU); c.fill();
  return (flowerCache[key] = cv);
}
function drawFlower(c, f, t){
  const age = Math.min(1, (t - f.born) * 2.5), s = 1.7 * f.s * (age < 1 ? age * (1 + Math.sin(age * Math.PI) * 0.6) : 1) * (1 + Math.sin(t * 2 + f.ph) * 0.06);
  if(s <= 0.02) return;
  const z = 16 * s;
  c.drawImage(flowerSprite(f.c, f.k, (f.ph * 3.18 | 0) % 5), f.x - z, f.y - z, z * 2, z * 2);
}
function drawSunflower(c, pl, t){
  const k = Math.min(1, pl.t * 3), w = Math.sin(t * 3 + pl.x) * 0.1;
  c.save(); c.translate(pl.x, pl.y); c.scale(k, k);
  c.strokeStyle = '#3fae5a'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -30); c.stroke();
  c.translate(0, -34); c.rotate(w);
  c.fillStyle = '#ffd23a'; for(let i = 0; i < 10; i++){ const a = i / 10 * TAU + t; c.beginPath(); c.ellipse(Math.cos(a) * 11, Math.sin(a) * 11, 7, 3.5, a, 0, TAU); c.fill(); }
  c.fillStyle = '#7a4a1a'; c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fill();
  c.restore();
}
function drawFoe(c, f, t){
  const r = f.r * (1 + f.hit * 0.15), wob = Math.sin(t * 5 + f.ph) * 0.06;
  c.save(); c.translate(f.x, f.y);
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(0, r * 0.9, r * 0.9, r * 0.25, 0, 0, TAU); c.fill();
  c.scale(1 + wob, 1 - wob);
  c.fillStyle = f.hit > 0.5 ? '#ffffff' : f.col;
  if(f.kind === 'bat'){ const fl = Math.sin(t * 20 + f.ph) * 0.6; for(const s of [-1, 1]){ c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * r * 1.6, -r * (0.8 + fl), s * r * 1.7, r * 0.3); c.quadraticCurveTo(s * r * 0.9, 0, 0, r * 0.4); c.fill(); } }
  if(f.boss){
    // crown of shadow spikes
    c.beginPath(); for(let i = 0; i < 9; i++){ const a = -Math.PI + i / 8 * Math.PI, rr = i % 2 ? r * 1.05 : r * 1.45; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.fill();
  }
  c.beginPath();
  for(let i = 0; i <= 18; i++){ const a = i / 18 * TAU, rr = r * (1 + Math.sin(a * 4 + t * 6 + f.ph) * (f.kind === 'wisp' ? 0.18 : 0.08)); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * (a > 0 && a < Math.PI ? 1.15 : 1)); }
  c.closePath(); c.fill();
  if(f.elite){ c.strokeStyle = '#d9a0ff'; c.lineWidth = 3; c.stroke(); }
  c.restore();
}
function drawEyes(c, f, t){
  const r = f.r, blink = ((t + f.ph) % 4) < 0.12;
  const col = f.boss ? '#ff4f8a' : f.elite ? '#e0a8ff' : f.ranged ? '#ff7ad8' : '#ffd23a';
  const ey = f.y - r * 0.2, sp = r * 0.32, sz = f.boss ? 7 : Math.max(2.5, r * 0.16);
  c.fillStyle = col;
  if(blink){ c.fillRect(f.x - sp - sz, ey, sz * 2, 1.5); c.fillRect(f.x + sp - sz, ey, sz * 2, 1.5); return; }
  c.drawImage(R.glowSprite(col), f.x - sp - sz * 3, ey - sz * 3, sz * 6, sz * 6);
  c.drawImage(R.glowSprite(col), f.x + sp - sz * 3, ey - sz * 3, sz * 6, sz * 6);
  c.beginPath(); c.ellipse(f.x - sp, ey, sz, sz * 0.7, 0.3, 0, TAU); c.ellipse(f.x + sp, ey, sz, sz * 0.7, -0.3, 0, TAU); c.fill();
}
function drawWitch(c, P, t, noGlow){
  const hat = HATS.find(h => h.id === save.hat) || HATS[0];
  const bob = Math.sin(P.walk * 2) * 2, flick = P.inv > 0 && Math.floor(t * 20) % 2;
  if(flick) return;
  c.save(); c.translate(P.x, P.y + bob); c.scale(P.face * 1.3, 1.3);
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(0, 18, 16, 5, 0, 0, TAU); c.fill();
  // cloak
  c.fillStyle = hat.c1; c.beginPath(); c.moveTo(-14, 16); c.quadraticCurveTo(-10, -6, 0, -8); c.quadraticCurveTo(10, -6, 14, 16); c.closePath(); c.fill();
  // face
  c.fillStyle = '#ffe2c8'; c.beginPath(); c.arc(0, -14, 10, 0, TAU); c.fill();
  c.fillStyle = '#2a1a22'; c.beginPath(); c.arc(4, -15, 1.8, 0, TAU); c.arc(-2, -15, 1.8, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,110,140,0.5)'; c.beginPath(); c.arc(6, -11, 2.5, 0, TAU); c.fill();
  // hat
  c.fillStyle = hat.c1; c.beginPath(); c.ellipse(0, -21, 17, 4.5, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(-9, -22); c.quadraticCurveTo(-2, -36, -8 - Math.sin(t * 3) * 3, -48); c.quadraticCurveTo(4, -38, 9, -22); c.closePath(); c.fill();
  c.fillStyle = hat.c2 === 'rainbow' ? `hsl(${(t * 120) % 360},90%,70%)` : hat.c2; c.fillRect(-9, -25, 18, 3);
  // lantern
  const lx = 16, ly = -2 + Math.sin(t * 4) * 1.5;
  c.strokeStyle = '#8a6a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(8, -4); c.lineTo(lx, ly - 7); c.stroke();
  c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(lx, ly, 6, 0, TAU); c.fill();
  c.restore();
  if(noGlow) return;
  c.globalCompositeOperation = 'lighter';
  c.drawImage(R.glowSprite('#ffd27a'), P.x + 16 * P.face - 30, P.y - 32 + bob, 60, 60);
  c.globalCompositeOperation = 'source-over';
}
function drawDrop(c, it, t){
  const y = it.y + Math.sin(t * 4 + it.x) * 4;
  c.drawImage(R.glowSprite(it.k === 'chest' ? '#ffd23a' : it.k === 'heal' ? '#ff7ab8' : '#7df0ff'), it.x - 34, y - 34, 68, 68);
  c.font = '26px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(it.k === 'chest' ? '🎁' : it.k === 'heal' ? '💖' : it.k === 'magnet' ? '🧲' : '🌕', it.x, y);
}
