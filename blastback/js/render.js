'use strict';
/* Canvas renderer: the arena is fit to the screen; sky, hills and lava fill the rest. */
const FONT = '"Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
const R = {
  cv: null, c: null, W: 0, H: 0, dpr: 1, s: 1, ox: 0, oy: 0, glow: {}, mouse: null, clouds: [],
  init(){
    this.cv = $('cv'); this.c = this.cv.getContext('2d');
    this.resize(); addEventListener('resize', () => this.resize());
    for(let i = 0; i < 7; i++) this.clouds.push({ x: Math.random(), y: rnd(0.05, 0.4), s: rnd(0.6, 1.3), v: rnd(0.004, 0.012) });
  },
  resize(){
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.W = innerWidth; this.H = innerHeight;
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    // switch the arena shape when the screen flips orientation (only outside a run)
    const port = this.H > this.W * 1.1;
    if(typeof G !== 'undefined' && G.portrait !== port && (G.mode === 'demo' || G.state === 'title')) setArena(G.arenaIdx < 0 ? 0 : G.arenaIdx);
  },
  fit(){
    const topPad = 0;
    this.s = Math.min(this.W / G.W, (this.H - topPad) / G.H);
    this.ox = (this.W - G.W * this.s) / 2; this.oy = (this.H - G.H * this.s) / 2 + topPad / 2;
  },
  toWorld(x, y){ return { x: (x - this.ox) / this.s, y: (y - this.oy) / this.s }; },
  glowSprite(col){
    if(this.glow[col]) return this.glow[col];
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const c = cv.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, col); g.addColorStop(0.4, col + '88'); g.addColorStop(1, col + '00');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    return (this.glow[col] = cv);
  },
  buildBg(){},
  draw(dt){
    const c = this.c, d = this.dpr, A = G.arena, t = G.rt;
    if(!G.players.length) return;
    this.fit();
    const s = this.s, sh = save.opt.shake ? G.shake : 0;
    const ox = this.ox + (Math.random() - 0.5) * sh, oy = this.oy + (Math.random() - 0.5) * sh;
    // sky
    c.setTransform(d, 0, 0, d, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, this.H); g.addColorStop(0, A.sky1); g.addColorStop(1, A.sky2);
    c.fillStyle = g; c.fillRect(0, 0, this.W, this.H);
    // sun + clouds
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(this.W * 0.82, this.H * 0.16, Math.min(this.W, this.H) * 0.07, 0, TAU); c.fill();
    for(const cl of this.clouds){
      cl.x = (cl.x + cl.v * (dt || 0.016)) % 1.2;
      const x = cl.x * (this.W + 200) - 100, y = cl.y * this.H, r = 26 * cl.s * Math.max(1, this.W / 900);
      c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r, y - r * 0.4, r * 1.2, 0, TAU); c.arc(x + r * 2.2, y, r, 0, TAU); c.fill();
    }
    // hills (screen-wide)
    const base = oy + G.lavaY * s;
    for(const [col, amp, f, off] of [[A.hill2, 0.22, 0.004, 0.3], [A.hill, 0.13, 0.007, 1.7]]){
      c.fillStyle = col; c.beginPath(); c.moveTo(0, this.H);
      for(let x = 0; x <= this.W + 10; x += 10) c.lineTo(x, base - this.H * amp - Math.sin(x * f + off) * this.H * 0.05);
      c.lineTo(this.W, this.H); c.closePath(); c.fill();
    }
    c.setTransform(s * d, 0, 0, s * d, ox * d, oy * d);
    // portals
    for(const p of G.portals){
      c.save(); c.translate(p.x, p.y); c.rotate(t * 2);
      c.strokeStyle = p.flash > 0 ? '#ffffff' : 'rgba(150,90,255,0.6)'; c.lineWidth = 5;
      for(let i = 0; i < 3; i++){ c.beginPath(); c.arc(0, 0, 18 + i * 6, i * 2, i * 2 + 4); c.stroke(); }
      c.restore();
    }
    // platforms
    for(const pl of G.plats){
      c.fillStyle = 'rgba(0,0,0,0.15)'; rr(c, pl.x + 6, pl.y + 8, pl.w, pl.h, 10); c.fill();
      c.fillStyle = A.dirt; rr(c, pl.x, pl.y, pl.w, pl.h, 10); c.fill();
      c.strokeStyle = '#2b1d26'; c.lineWidth = 3; c.stroke();
      c.fillStyle = A.top; rr(c, pl.x - 2, pl.y - 3, pl.w + 4, Math.min(14, pl.h * 0.6), 7); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(pl.x + 8, pl.y, pl.w - 16, 3);
    }
    // coins
    for(const k of G.coins){
      if(k.heart){ c.font = `22px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('💖', k.x, k.y); continue; }
      const w = Math.abs(Math.cos(t * 6 + k.x)) * 8 + 1;
      c.fillStyle = '#ffcf33'; c.strokeStyle = '#a86a00'; c.lineWidth = 2; c.beginPath(); c.ellipse(k.x, k.y, w, 9, 0, 0, TAU); c.fill(); c.stroke();
    }
    // foes
    for(const f of G.foes) if(!f.dead) drawFoe(c, f, t);
    // bullets
    for(const b of G.bullets){
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8;
      c.drawImage(this.glowSprite(b.col), b.x - b.r * 3, b.y - b.r * 3, b.r * 6, b.r * 6);
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      c.strokeStyle = b.col; c.lineWidth = b.r * 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(b.x - b.vx * 0.018, b.y - b.vy * 0.018); c.lineTo(b.x, b.y); c.stroke();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(b.x, b.y, b.r * 0.7, 0, TAU); c.fill();
    }
    // players
    for(const p of G.players) if(!p.dead) drawPlayer(c, p, t);
    // lava (screen-wide)
    c.setTransform(d, 0, 0, d, 0, 0);
    const ly = oy + G.lavaY * s;
    c.fillStyle = A.lava; c.beginPath(); c.moveTo(0, this.H);
    for(let x = 0; x <= this.W + 10; x += 12) c.lineTo(x, ly + Math.sin(x * 0.03 + t * 3) * 4);
    c.lineTo(this.W, this.H); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    for(let x = 0; x <= this.W; x += 60){ const yy = ly + 8 + Math.sin(x * 0.05 + t * 2) * 3; c.beginPath(); c.ellipse(x + (t * 30) % 60, yy, 14, 3, 0, 0, TAU); c.fill(); }
    c.setTransform(s * d, 0, 0, s * d, ox * d, oy * d);
    // fx
    for(const p of G.parts){
      const k = 1 - p.life / p.max;
      if(p.smoke){ c.globalAlpha = k * 0.6; c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.sz * (1.5 - k * 0.5), 0, TAU); c.fill(); }
      else if(p.shell){ c.globalAlpha = 1; c.fillStyle = p.c; c.fillRect(p.x - 2, p.y - 1, 5, 3); }
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'lighter';
    for(const p of G.parts){ if(p.smoke || p.shell) continue; const k = 1 - p.life / p.max; c.globalAlpha = Math.min(1, k * 1.6); c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.sz * k + 0.5, 0, TAU); c.fill(); }
    for(const b of G.booms){ const k = b.t / 0.45, r = 60 * b.k * (0.5 + k); c.globalAlpha = (1 - k) * 0.9; c.drawImage(this.glowSprite('#ffb13a'), b.x - r * 2, b.y - r * 2, r * 4, r * 4); }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    for(const r of G.rings){ const k = r.life / r.max; c.globalAlpha = 1 - k; c.strokeStyle = r.col; c.lineWidth = 6 * (1 - k) + 1; c.beginPath(); c.arc(r.x, r.y, r.r * (0.3 + k * 0.9), 0, TAU); c.stroke(); }
    c.globalAlpha = 1;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    for(const tx of G.texts){ const k = tx.life / tx.max; const pop = k < 0.15 ? 0.6 + k / 0.15 * 0.6 : 1.2 - Math.min(0.2, k - 0.15); c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; c.font = `900 ${Math.round(20 * tx.size * pop)}px ${FONT}`; c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,0.85)'; c.strokeText(tx.txt, tx.x, tx.y); c.fillStyle = tx.col; c.fillText(tx.txt, tx.x, tx.y); }
    c.globalAlpha = 1;
    // crosshair at the mouse
    if(this.mouse && G.mode === 'cup' && G.state === 'play'){ const m = this.mouse; c.strokeStyle = '#1b1426'; c.lineWidth = 3; c.beginPath(); c.arc(m.x, m.y, 11, 0, TAU); c.moveTo(m.x - 17, m.y); c.lineTo(m.x - 6, m.y); c.moveTo(m.x + 6, m.y); c.lineTo(m.x + 17, m.y); c.moveTo(m.x, m.y - 17); c.lineTo(m.x, m.y - 6); c.moveTo(m.x, m.y + 6); c.lineTo(m.x, m.y + 17); c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.stroke(); }
    // screen space
    c.setTransform(d, 0, 0, d, 0, 0);
    const p = G.players[0];
    if(G.mode === 'cup' && p && !p.dead && p.hp < p.max * 0.3){ const a = 0.22 + Math.sin(G.rt * 8) * 0.08; const gg = c.createRadialGradient(this.W / 2, this.H / 2, Math.min(this.W, this.H) * 0.3, this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.7); gg.addColorStop(0, 'rgba(255,0,60,0)'); gg.addColorStop(1, `rgba(255,0,60,${a})`); c.fillStyle = gg; c.fillRect(0, 0, this.W, this.H); }
    if(G.flash > 0){ c.globalAlpha = Math.min(0.5, G.flash * 0.5); c.fillStyle = G.flashC; c.fillRect(0, 0, this.W, this.H); c.globalAlpha = 1; }
  }
};
function rr(c, x, y, w, h, r){ r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function eyes(c, r, lx, ly, angry){
  for(const s of [-1, 1]){
    const ex = s * r * 0.32, ey = -r * 0.12;
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(ex, ey, r * 0.24, r * 0.28, 0, 0, TAU); c.fill();
    c.fillStyle = '#1b1426'; c.beginPath(); c.arc(ex + lx * r * 0.1, ey + ly * r * 0.1, r * 0.13, 0, TAU); c.fill();
    if(angry){ c.strokeStyle = '#1b1426'; c.lineWidth = r * 0.1; c.beginPath(); c.moveTo(ex - s * r * 0.22, ey - r * 0.36); c.lineTo(ex + s * r * 0.18, ey - r * 0.22); c.stroke(); }
  }
}
function drawPlayer(c, p, t){
  if(p.inv > 0 && Math.floor(t * 16) % 2 && G.mode !== 'demo') return;
  const r = p.r, sq = p.squash * 0.25;
  c.save(); c.translate(p.x, p.y);
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(0, r + 3, r * 0.9, 4, 0, 0, TAU); c.fill();
  // gun (behind the body when aiming back)
  const drawGun = () => { c.save(); c.rotate(p.aim); const L = 26 + (p.gun.id === 'rocket' ? 6 : 0); c.fillStyle = '#2b2b38'; rr(c, 4, -6, L, 12, 4); c.fill(); c.fillStyle = p.gun.col; rr(c, 6, -4, L - 6, 8, 3); c.fill(); if(p.flash > 0){ c.fillStyle = '#fff3a0'; c.beginPath(); c.moveTo(L + 4, -9 * p.flash); c.lineTo(L + 20 * p.flash, 0); c.lineTo(L + 4, 9 * p.flash); c.fill(); } c.restore(); };
  if(Math.sin(p.aim) < -0.3) drawGun();
  c.scale(1 + sq, 1 - sq);
  c.fillStyle = p.flash > 0.6 && p.inv > 0 ? '#ffffff' : p.col; c.strokeStyle = '#1b1426'; c.lineWidth = 3;
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(-r * 0.35, -r * 0.4, r * 0.28, 0, TAU); c.fill();
  eyes(c, r, Math.cos(p.aim), Math.sin(p.aim), false);
  c.scale(1 / (1 + sq), 1 / (1 - sq));
  if(Math.sin(p.aim) >= -0.3) drawGun();
  c.restore();
  // ammo pips
  const m = magSize(p), w = Math.min(7, 60 / m);
  for(let i = 0; i < m; i++){ c.fillStyle = i < p.ammo ? '#ffd23a' : 'rgba(0,0,0,0.35)'; c.strokeStyle = '#1b1426'; c.lineWidth = 1.5; c.beginPath(); c.arc(p.x - (m - 1) * w / 2 + i * w, p.y - r - 12, w * 0.38, 0, TAU); c.fill(); c.stroke(); }
  if(G.mode === 'vs'){ c.font = `900 15px ${FONT}`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#000'; c.strokeText('P' + (p.pl + 1), p.x, p.y - r - 28); c.fillStyle = p.col; c.fillText('P' + (p.pl + 1), p.x, p.y - r - 28); const k = clamp(p.hp / p.max, 0, 1); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(p.x - 20, p.y + r + 8, 40, 5); c.fillStyle = p.col; c.fillRect(p.x - 20, p.y + r + 8, 40 * k, 5); }
}
function drawFoe(c, f, t){
  const d = f.def, r = f.r, T = nearestPlayer(f);
  const lx = T ? clamp((T.x - f.x) / 200, -1, 1) : 0, ly = T ? clamp((T.y - f.y) / 200, -1, 1) : 0;
  c.save(); c.translate(f.x, f.y);
  const col = f.flash > 0.5 ? '#ffffff' : d.col;
  c.fillStyle = col; c.strokeStyle = '#1b1426'; c.lineWidth = 3;
  if(f.kind === 'bat' || (f.boss && f.bk === 'bat')){ const fl = Math.sin(t * 18 + f.ph) * 0.5; c.fillStyle = shade(d.col, -0.2); for(const s of [-1, 1]){ c.beginPath(); c.moveTo(s * r * 0.6, 0); c.quadraticCurveTo(s * r * 1.8, -r * (0.9 + fl), s * r * 2, r * 0.3); c.quadraticCurveTo(s * r * 1.2, r * 0.1, s * r * 0.6, r * 0.4); c.fill(); c.stroke(); } c.fillStyle = col; }
  if(f.kind === 'turret' || (f.boss && f.bk === 'bot')){ c.strokeStyle = '#1b1426'; c.beginPath(); c.moveTo(0, -r); c.lineTo(0, -r - 8); c.stroke(); c.fillStyle = '#c7ccd8'; c.fillRect(-r * 0.9 * Math.abs(Math.cos(t * 25)), -r - 11, r * 1.8 * Math.abs(Math.cos(t * 25)), 4); c.fillStyle = col; }
  if(f.kind === 'hopper'){ c.fillStyle = shade(d.col, -0.2); c.beginPath(); c.ellipse(-r * 0.6, r * 0.7, r * 0.4, r * 0.25, 0, 0, TAU); c.ellipse(r * 0.6, r * 0.7, r * 0.4, r * 0.25, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = col; }
  if(d.walk && f.kind !== 'hopper'){
    const sq = f.ground ? Math.sin(t * 8 + f.ph) * 0.06 : -0.08;
    c.scale(1 + sq, 1 - sq);
    c.beginPath(); c.moveTo(-r, r * 0.6); c.quadraticCurveTo(-r * 1.05, -r, 0, -r); c.quadraticCurveTo(r * 1.05, -r, r, r * 0.6); c.quadraticCurveTo(0, r * 1.05, -r, r * 0.6); c.closePath(); c.fill(); c.stroke();
  } else { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke(); }
  if(f.kind === 'brute' || (f.boss && f.bk === 'golem')){ c.fillStyle = '#fff3e0'; for(const s of [-1, 1]){ c.beginPath(); c.moveTo(s * r * 0.5, -r * 0.8); c.lineTo(s * r * 0.75, -r * 1.35); c.lineTo(s * r * 0.95, -r * 0.6); c.fill(); c.stroke(); } }
  if(f.kind === 'bomber'){ c.strokeStyle = '#8a6a3a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(r * 0.4, -r * 1.4, r * 0.2, -r * 1.6); c.stroke(); if(Math.floor(t * 12) % 2){ c.fillStyle = '#ffb13a'; c.beginPath(); c.arc(r * 0.2, -r * 1.6, 4, 0, TAU); c.fill(); } }
  c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.arc(-r * 0.35, -r * 0.45, r * 0.22, 0, TAU); c.fill();
  eyes(c, r, lx, ly, true);
  if(d.shield && T){ const a = Math.atan2(T.y - f.y, T.x - f.x); c.strokeStyle = '#7fd6ff'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, r + 7, a - 1.1, a + 1.1); c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.stroke(); }
  if(f.boss){ c.font = `${Math.round(r * 0.8)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('👑', 0, -r - r * 0.25); }
  c.restore();
  if(f.hp < f.max && !f.boss){ const w = r * 2, k = clamp(f.hp / f.max, 0, 1); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(f.x - w / 2, f.y - r - 12, w, 5); c.fillStyle = k > 0.5 ? '#7dff6a' : '#ffd23a'; c.fillRect(f.x - w / 2, f.y - r - 12, w * k, 5); }
}
function shade(hex, k){
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if(k < 0){ r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
