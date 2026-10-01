'use strict';
/* Canvas renderer: bright top-down arena; skid marks and scorch marks are
   painted permanently into the ground texture. */
const FONT = '"Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
const R = {
  cv: null, c: null, W: 0, H: 0, dpr: 1, s: 1, glow: {}, cam: { x: AW / 2, y: AH / 2, s: 1 }, gc: null, gx: null,
  init(){
    this.cv = $('cv'); this.c = this.cv.getContext('2d');
    this.resize(); addEventListener('resize', () => this.resize());
  },
  resize(){
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.W = innerWidth; this.H = innerHeight;
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    this.s = Math.max(this.W, this.H) / 1000;
    if(Math.min(this.W, this.H) / this.s < 480) this.s = Math.min(this.W, this.H) / 480;
  },
  glowSprite(col){
    if(this.glow[col]) return this.glow[col];
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const c = cv.getContext('2d'), g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, col); g.addColorStop(0.4, col + '88'); g.addColorStop(1, col + '00');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    return (this.glow[col] = cv);
  },
  buildGround(){
    const A = G.arena;
    if(!this.gc){ this.gc = document.createElement('canvas'); this.gc.width = AW; this.gc.height = AH; this.gx = this.gc.getContext('2d'); }
    const c = this.gx;
    let seed = 7 + G.arenaIdx * 13; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    c.fillStyle = A.g1; c.fillRect(0, 0, AW, AH);
    const T = 150;
    c.fillStyle = A.g2;
    for(let x = 0; x < AW; x += T) for(let y = 0; y < AH; y += T) if(((x + y) / T) % 2 === 0) c.fillRect(x, y, T, T);
    c.globalAlpha = 0.18;
    for(let i = 0; i < 260; i++){ c.fillStyle = r() < 0.5 ? '#ffffff' : '#000000'; c.beginPath(); c.ellipse(r() * AW, r() * AH, 6 + r() * 26, 3 + r() * 12, r() * 3, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    if(A.id === 'lava'){
      c.strokeStyle = '#ff7a1f'; c.lineWidth = 5; c.shadowColor = '#ffb13a'; c.shadowBlur = 14;
      for(let i = 0; i < 18; i++){ let x = r() * AW, y = r() * AH; c.beginPath(); c.moveTo(x, y); for(let k = 0; k < 5; k++){ x += (r() - 0.5) * 140; y += (r() - 0.5) * 140; c.lineTo(x, y); } c.stroke(); }
      c.shadowBlur = 0;
    }
    if(A.id === 'city'){ c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 6; c.setLineDash([40, 30]); for(let y = 250; y < AH; y += 375){ c.beginPath(); c.moveTo(0, y); c.lineTo(AW, y); c.stroke(); } c.setLineDash([]); }
    if(A.id === 'snow'){ c.strokeStyle = 'rgba(120,170,220,0.25)'; c.lineWidth = 2; for(let i = 0; i < 80; i++){ const x = r() * AW, y = r() * AH, a = r() * TAU, l = 40 + r() * 120; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); } }
    // arena markings
    c.strokeStyle = A.line; c.globalAlpha = 0.55; c.lineWidth = 10;
    c.beginPath(); c.arc(AW / 2, AH / 2, 190, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(AW / 2, 0); c.lineTo(AW / 2, AH / 2 - 190); c.moveTo(AW / 2, AH / 2 + 190); c.lineTo(AW / 2, AH); c.stroke();
    c.strokeRect(40, 40, AW - 80, AH - 80);
    for(const [x, y] of [[0, 0], [AW, 0], [0, AH], [AW, AH]]){ c.beginPath(); c.arc(x, y, 160, 0, TAU); c.stroke(); }
    c.globalAlpha = 1;
    // big painted X marks the center
    c.fillStyle = A.line; c.globalAlpha = 0.35; c.font = `900 120px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('★', AW / 2, AH / 2); c.globalAlpha = 1;
  },
  paintDecals(){
    if(!G.decals.length || !this.gx) return;
    const c = this.gx, snow = G.arena.id === 'snow';
    c.lineCap = 'round';
    for(const d of G.decals){
      if(d.t === 'skid'){ c.strokeStyle = snow ? 'rgba(90,140,190,0.22)' : 'rgba(30,20,20,0.16)'; c.lineWidth = d.w; c.beginPath(); c.moveTo(d.x0, d.y0); c.lineTo(d.x1, d.y1); c.stroke(); }
      else if(d.t === 'scorch'){ const g = c.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r); g.addColorStop(0, 'rgba(20,10,10,0.55)'); g.addColorStop(0.6, 'rgba(30,20,20,0.25)'); g.addColorStop(1, 'rgba(30,20,20,0)'); c.fillStyle = g; c.beginPath(); c.arc(d.x, d.y, d.r, 0, TAU); c.fill(); }
      else if(d.t === 'splinter'){ c.fillStyle = 'rgba(150,95,40,0.7)'; for(let i = 0; i < 6; i++){ c.save(); c.translate(d.x + rnd(-20, 20), d.y + rnd(-20, 20)); c.rotate(rnd(0, TAU)); c.fillRect(-6, -1.5, 12, 3); c.restore(); } }
    }
    G.decals.length = 0;
  },
  camera(dt){
    const P = G.players.filter(p => !p.dead);
    let tx, ty, s = this.s;
    if(G.mode === 'vs' && G.players.length === 2){
      const a = G.players[0], b = G.players[1];
      tx = (a.x + b.x) / 2; ty = (a.y + b.y) / 2;
      const need = Math.max((Math.abs(a.x - b.x) + 420) / this.W, (Math.abs(a.y - b.y) + 420) / this.H);
      s = clamp(1 / need, Math.min(this.W / (AW + 120), this.H / (AH + 120)), this.s * 1.05);
    } else {
      const p = P[0] || G.players[0];
      if(!p) return;
      tx = p.x + p.vx * 0.28; ty = p.y + p.vy * 0.28;
    }
    const k = Math.min(1, dt * 5);
    this.cam.s = lerp(this.cam.s || s, s, Math.min(1, dt * 3));
    this.cam.x = lerp(this.cam.x, tx, k); this.cam.y = lerp(this.cam.y, ty, k);
    const vw = this.W / this.cam.s / 2, vh = this.H / this.cam.s / 2, m = G.mode === 'vs' ? 110 : 70;
    this.cam.x = vw * 2 > AW + m * 2 ? AW / 2 : clamp(this.cam.x, vw - m, AW - vw + m);
    this.cam.y = vh * 2 > AH + m * 2 ? AH / 2 : clamp(this.cam.y, vh - m, AH - vh + m);
  },
  draw(dt){
    const c = this.c, d = this.dpr;
    if(!G.players.length) return;
    this.camera(dt || 1 / 60);
    this.paintDecals();
    const s = this.cam.s, sh = save.opt.shake ? G.shake : 0;
    const ox = this.W / 2 - this.cam.x * s + (Math.random() - 0.5) * sh, oy = this.H / 2 - this.cam.y * s + (Math.random() - 0.5) * sh;
    const t = G.rt, A = G.arena;
    c.setTransform(d, 0, 0, d, 0, 0); c.fillStyle = A.wall2; c.fillRect(0, 0, this.W, this.H);
    c.setTransform(s * d, 0, 0, s * d, ox * d, oy * d);
    c.drawImage(this.gc, 0, 0);
    // walls: hazard-striped barrier
    const WB = 30;
    c.fillStyle = A.wall2; c.fillRect(-WB, -WB, AW + WB * 2, WB); c.fillRect(-WB, AH, AW + WB * 2, WB); c.fillRect(-WB, 0, WB, AH); c.fillRect(AW, 0, WB, AH);
    c.save(); c.beginPath(); c.rect(-WB, -WB, AW + WB * 2, WB); c.rect(-WB, AH, AW + WB * 2, WB); c.rect(-WB, 0, WB, AH); c.rect(AW, 0, WB, AH); c.clip();
    c.strokeStyle = A.wall; c.lineWidth = 22;
    for(let k = -AH - 200; k < AW + AH + 200; k += 60){ c.beginPath(); c.moveTo(k, -WB - 10); c.lineTo(k + AH + 2 * WB + 20, AH + WB + 10); c.stroke(); }
    c.restore();
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 4; c.strokeRect(0, 0, AW, AH);
    // gates
    for(const g of G.gates){
      const rc = g.y < 100 ? [g.x - 70, -WB, 140, WB] : g.y > AH - 100 ? [g.x - 70, AH, 140, WB] : g.x < 100 ? [-WB, g.y - 70, WB, 140] : [AW, g.y - 70, WB, 140];
      c.fillStyle = g.flash > 0 ? `rgb(255,${Math.round(80 + 170 * (1 - g.flash))},80)` : '#1b1426';
      c.fillRect(rc[0], rc[1], rc[2], rc[3]);
      if(g.flash > 0){ c.globalAlpha = g.flash; c.fillStyle = 'rgba(255,80,80,0.35)'; c.beginPath(); c.arc(g.x, g.y, 90, 0, TAU); c.fill(); c.globalAlpha = 1; }
    }
    // pillars
    for(const p of G.pillars){
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.arc(p.x + 8, p.y + 10, p.r, 0, TAU); c.fill();
      c.fillStyle = A.pillar; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 5; c.stroke();
      c.strokeStyle = A.wall; c.lineWidth = 8; c.beginPath(); c.arc(p.x, p.y, p.r * 0.7, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.arc(p.x - p.r * 0.3, p.y - p.r * 0.35, p.r * 0.3, 0, TAU); c.fill();
    }
    // props
    for(const p of G.props) if(!p.dead) drawProp(c, p, t);
    // coins
    for(const k of G.coins){
      if(k.wrench){ c.font = `24px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🔧', k.x, k.y); continue; }
      const w = Math.abs(Math.cos(t * 6 + k.x)) * 8 + 1;
      c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(k.x + 3, k.y + 4, 8, 4, 0, 0, TAU); c.fill();
      c.fillStyle = '#ffcf33'; c.strokeStyle = '#a86a00'; c.lineWidth = 2; c.beginPath(); c.ellipse(k.x, k.y, w, 9, 0, 0, TAU); c.fill(); c.stroke();
    }
    // telegraphs
    for(const o of G.cars){
      if(o.dead || !o.boss) continue;
      if(o.ai.rev > 0){ c.globalAlpha = 0.35 + Math.sin(t * 30) * 0.15; c.strokeStyle = '#ff2a4a'; c.lineWidth = o.r * 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x + Math.cos(o.a) * 380, o.y + Math.sin(o.a) * 380); c.stroke(); c.globalAlpha = 1; }
      if(o.ai.air > 0){ c.strokeStyle = '#ff2a4a'; c.lineWidth = 6; c.globalAlpha = 0.6 + Math.sin(t * 25) * 0.3; c.beginPath(); c.arc(o.ai.jx, o.ai.jy, 170 * (0.6 + 0.4 * (1 - o.ai.air / 0.95)), 0, TAU); c.stroke(); c.globalAlpha = 1; }
    }
    // shadows
    c.fillStyle = 'rgba(0,0,0,0.22)';
    for(const o of G.cars){ if(o.dead) continue; c.beginPath(); c.ellipse(o.x + 6, o.y + 8, o.r * 1.15, o.r * 0.95, o.a, 0, TAU); c.fill(); for(const ch of o.chains){ const B = ch.pts[ch.pts.length - 1]; c.beginPath(); c.arc(B.x + 6, B.y + 8, ch.ball.r, 0, TAU); c.fill(); } }
    // chains + balls
    for(const o of G.cars){ if(o.dead) continue; for(const ch of o.chains) drawChain(c, ch, t); }
    // cars
    for(const o of G.cars){ if(!o.dead) drawCar(c, o, t); }
    // fx
    for(const p of G.parts){
      const k = 1 - p.life / p.max;
      if(p.smoke){ c.globalAlpha = k * 0.5; c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.sz * (1.6 - k * 0.6), 0, TAU); c.fill(); }
      else if(p.debris){ c.globalAlpha = Math.min(1, k * 2); c.fillStyle = p.c; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillRect(-p.sz / 2, -p.sz / 4, p.sz, p.sz / 2); c.restore(); }
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'lighter';
    for(const p of G.parts){ if(p.smoke || p.debris) continue; const k = 1 - p.life / p.max; c.globalAlpha = Math.min(1, k * 1.6); c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.sz * k + 0.5, 0, TAU); c.fill(); }
    for(const b of G.booms){ const k = b.t / 0.5, r = 70 * b.k * (0.5 + k); c.globalAlpha = (1 - k) * 0.9; c.drawImage(this.glowSprite('#ffb13a'), b.x - r * 2, b.y - r * 2, r * 4, r * 4); }
    c.globalAlpha = 1;
    for(const b of G.bolts){ c.strokeStyle = '#9fe6ff'; c.lineWidth = 4 * (1 - b.life / b.max) + 1; c.beginPath(); c.moveTo(b.x0, b.y0); for(let i = 1; i < 6; i++){ const k = i / 6; c.lineTo(lerp(b.x0, b.x1, k) + rnd(-14, 14), lerp(b.y0, b.y1, k) + rnd(-14, 14)); } c.lineTo(b.x1, b.y1); c.stroke(); }
    c.globalCompositeOperation = 'source-over';
    for(const r of G.rings){ const k = r.life / r.max; c.globalAlpha = 1 - k; c.strokeStyle = r.col; c.lineWidth = 8 * (1 - k) + 1; c.beginPath(); c.arc(r.x, r.y, r.r * (0.3 + k * 0.9), 0, TAU); c.stroke(); }
    c.globalAlpha = 1;
    // health bars
    for(const o of G.cars){
      if(o.dead || o.pl >= 0 && G.mode !== 'vs' || o.hp >= o.max && !o.boss) continue;
      const w = o.r * 2.2, k = clamp(o.hp / o.max, 0, 1), y = o.y - o.r - 16 - o.z;
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(o.x - w / 2 - 2, y - 2, w + 4, 9);
      c.fillStyle = o.pl >= 0 ? o.col : k > 0.5 ? '#7dff6a' : k > 0.25 ? '#ffd23a' : '#ff4d4d'; c.fillRect(o.x - w / 2, y, w * k, 5);
    }
    // player tags in versus
    if(G.mode === 'vs') for(const p of G.players){ if(p.dead) continue; c.font = `900 18px ${FONT}`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#000'; c.strokeText('P' + (p.pl + 1), p.x, p.y - p.r - 30); c.fillStyle = p.col; c.fillText('P' + (p.pl + 1), p.x, p.y - p.r - 30); }
    // floating text
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    for(const tx of G.texts){ const k = tx.life / tx.max; const pop = k < 0.15 ? 0.6 + k / 0.15 * 0.6 : 1.2 - Math.min(0.2, (k - 0.15)); c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; c.font = `900 ${Math.round(22 * tx.size * pop)}px ${FONT}`; c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,0.85)'; c.strokeText(tx.txt, tx.x, tx.y); c.fillStyle = tx.col; c.fillText(tx.txt, tx.x, tx.y); }
    c.globalAlpha = 1;
    // screen space
    c.setTransform(d, 0, 0, d, 0, 0);
    if(G.mode === 'cup' && G.state === 'play') this.arrows(c, ox, oy, s);
    const p = G.players[0];
    if(G.mode === 'cup' && p && !p.dead && p.hp < p.max * 0.3){ const a = 0.25 + Math.sin(G.rt * 8) * 0.1; const g = c.createRadialGradient(this.W / 2, this.H / 2, Math.min(this.W, this.H) * 0.3, this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.7); g.addColorStop(0, 'rgba(255,0,60,0)'); g.addColorStop(1, `rgba(255,0,60,${a})`); c.fillStyle = g; c.fillRect(0, 0, this.W, this.H); }
    if(G.flash > 0){ c.globalAlpha = Math.min(0.5, G.flash * 0.5); c.fillStyle = G.flashC; c.fillRect(0, 0, this.W, this.H); c.globalAlpha = 1; }
  },
  /* arrows at the screen edge point at enemies you can't see */
  arrows(c, ox, oy, s){
    const m = 34;
    for(const o of G.cars){
      if(o.dead || o.pl >= 0) continue;
      const sx = o.x * s + ox, sy = o.y * s + oy;
      if(sx > 0 && sx < this.W && sy > 0 && sy < this.H) continue;
      const cx = this.W / 2, cy = this.H / 2, a = Math.atan2(sy - cy, sx - cx);
      const k = Math.min((this.W / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (this.H / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
      const x = cx + Math.cos(a) * k, y = cy + Math.sin(a) * k;
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = o.boss ? '#ff3d6e' : o.col; c.strokeStyle = '#000'; c.lineWidth = 3;
      const z = o.boss ? 1.6 : 1;
      c.beginPath(); c.moveTo(14 * z, 0); c.lineTo(-8 * z, -10 * z); c.lineTo(-8 * z, 10 * z); c.closePath(); c.fill(); c.stroke();
      c.restore();
    }
  }
};

function rr(c, x, y, w, h, r){ c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function shade(hex, k){
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if(k < 0){ r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
function drawCar(c, o, t){
  const r = o.r, L = r * 2.3, Wd = r * 1.5;
  if(o.pl >= 0 && o.inv > 0 && Math.floor(t * 16) % 2 && G.mode !== 'demo') return;
  c.save(); c.translate(o.x, o.y - o.z); c.rotate(o.a);
  const sc = 1 + o.z / 160; c.scale(sc, sc);
  // wheels
  c.fillStyle = '#1d1d26';
  const st = clamp(o.inp.steer, -1, 1) * 0.45;
  for(const [wx, wy, front] of [[L * 0.3, -Wd * 0.52, 1], [L * 0.3, Wd * 0.52, 1], [-L * 0.3, -Wd * 0.52, 0], [-L * 0.3, Wd * 0.52, 0]]){
    c.save(); c.translate(wx, wy); if(front) c.rotate(st); c.fillRect(-r * 0.32, -r * 0.17, r * 0.64, r * 0.34); c.restore();
  }
  // body
  const col = o.hitFlash > 0.5 ? '#ffffff' : o.col;
  c.fillStyle = col; c.strokeStyle = '#1b1426'; c.lineWidth = 3;
  rr(c, -L / 2, -Wd / 2, L, Wd, r * 0.45); c.fill(); c.stroke();
  // side shading
  c.fillStyle = shade(o.col, -0.25); rr(c, -L / 2 + 3, Wd / 2 - r * 0.38, L - 6, r * 0.32, r * 0.15); c.fill();
  if(o.gold){ c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-L * 0.4, -Wd * 0.4, L * 0.15, Wd * 0.8); }
  if(o.kind === 'truck'){ c.fillStyle = shade(o.col, -0.35); rr(c, -L / 2 + 4, -Wd / 2 + 4, L * 0.52, Wd - 8, 4); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; for(let i = 1; i < 4; i++){ c.beginPath(); c.moveTo(-L / 2 + 4 + i * L * 0.13, -Wd / 2 + 6); c.lineTo(-L / 2 + 4 + i * L * 0.13, Wd / 2 - 6); c.stroke(); } }
  // roof + windshield
  c.fillStyle = shade(o.col, 0.25); rr(c, -L * 0.22, -Wd * 0.34, L * 0.42, Wd * 0.68, r * 0.25); c.fill();
  c.fillStyle = '#bfe9ff'; rr(c, L * 0.12, -Wd * 0.32, L * 0.16, Wd * 0.64, r * 0.12); c.fill();
  // faces: angry enemy eyes, happy player eyes
  c.fillStyle = '#1b1426';
  if(o.pl < 0){ c.save(); c.translate(L * 0.2, 0); c.beginPath(); c.moveTo(-r * 0.02, -Wd * 0.26); c.lineTo(r * 0.2, -Wd * 0.06); c.lineTo(-r * 0.06, -Wd * 0.08); c.fill(); c.beginPath(); c.moveTo(-r * 0.02, Wd * 0.26); c.lineTo(r * 0.2, Wd * 0.06); c.lineTo(-r * 0.06, Wd * 0.08); c.fill(); c.restore(); }
  else { c.beginPath(); c.arc(L * 0.2, -Wd * 0.14, r * 0.09, 0, TAU); c.arc(L * 0.2, Wd * 0.14, r * 0.09, 0, TAU); c.fill(); }
  // headlights
  c.fillStyle = '#fff6c2'; c.beginPath(); c.arc(L / 2 - 3, -Wd * 0.32, r * 0.14, 0, TAU); c.arc(L / 2 - 3, Wd * 0.32, r * 0.14, 0, TAU); c.fill();
  // extras
  if(o.siren){ c.fillStyle = Math.floor(t * 8) % 2 ? '#ff2a4a' : '#2f6bff'; c.fillRect(-r * 0.1, -Wd * 0.3, r * 0.3, Wd * 0.25); c.fillStyle = Math.floor(t * 8) % 2 ? '#2f6bff' : '#ff2a4a'; c.fillRect(-r * 0.1, Wd * 0.05, r * 0.3, Wd * 0.25); }
  if(o.spike || (o.pl >= 0 && G.cards.spikes && G.mode === 'cup')){ c.fillStyle = '#d6d9e0'; c.strokeStyle = '#1b1426'; c.lineWidth = 2; for(let i = -2; i <= 2; i++){ c.beginPath(); c.moveTo(L / 2, i * Wd * 0.18 - 4); c.lineTo(L / 2 + r * 0.45, i * Wd * 0.18); c.lineTo(L / 2, i * Wd * 0.18 + 4); c.closePath(); c.fill(); c.stroke(); } }
  if(o.bomb){ c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(-L * 0.2, 0, r * 0.25, 0, TAU); c.fill(); if(Math.floor(t * 10) % 2){ c.fillStyle = '#ff3a2a'; c.beginPath(); c.arc(-L * 0.2, 0, r * 0.13, 0, TAU); c.fill(); } }
  if(o.blade){ c.fillStyle = '#ffd23a'; c.strokeStyle = '#1b1426'; c.lineWidth = 3; c.beginPath(); c.moveTo(L / 2 + 2, -Wd * 0.75); c.quadraticCurveTo(L / 2 + r * 0.7, 0, L / 2 + 2, Wd * 0.75); c.lineTo(L / 2 - 6, Wd * 0.75); c.lineTo(L / 2 - 6, -Wd * 0.75); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = '#1b1426'; c.lineWidth = 2; for(let i = -2; i <= 2; i++){ c.beginPath(); c.moveTo(L / 2, i * Wd * 0.28); c.lineTo(L / 2 + r * 0.35, i * Wd * 0.28); c.stroke(); } }
  if(o.boss){ c.font = `${Math.round(r * 0.9)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.rotate(Math.PI / 2); c.fillText('👑', 0, 0); }
  if(o.boost > 0){ c.fillStyle = '#7df0ff'; c.globalAlpha = 0.8; c.beginPath(); c.moveTo(-L / 2, -Wd * 0.25); c.lineTo(-L / 2 - r * (0.8 + Math.random() * 0.6), 0); c.lineTo(-L / 2, Wd * 0.25); c.fill(); c.globalAlpha = 1; }
  c.restore();
  if(o.pl >= 0 && G.mode === 'cup' && o.dCharge > 0.45){ c.strokeStyle = '#7df0ff'; c.lineWidth = 3; c.beginPath(); c.arc(o.x, o.y, o.r + 12, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, o.dCharge / 1.5)); c.stroke(); }
}
function drawChain(c, ch, t){
  const P = ch.pts, n = P.length, B = P[n - 1], b = ch.ball, r = b.r;
  // motion trail when the ball is flying
  ch.trail.push({ x: B.x, y: B.y }); if(ch.trail.length > 8) ch.trail.shift();
  if(ch.spd > 420){ c.strokeStyle = b.fire || G.cards.fire ? 'rgba(255,140,40,0.35)' : 'rgba(255,255,255,0.35)'; c.lineCap = 'round'; c.lineWidth = r * 1.4; c.beginPath(); c.moveTo(ch.trail[0].x, ch.trail[0].y); for(const p of ch.trail) c.lineTo(p.x, p.y); c.stroke(); }
  c.strokeStyle = '#3a3a48'; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(P[0].x, P[0].y); for(let i = 1; i < n; i++) c.lineTo(P[i].x, P[i].y); c.stroke();
  c.fillStyle = '#9aa0b0';
  for(let i = 1; i < n - 1; i++){ c.beginPath(); c.arc(P[i].x, P[i].y, 3.6, 0, TAU); c.fill(); }
  // ball
  if(b.fire || (G.cards.fire && G.mode === 'cup' && b.id !== 'foe')){ c.globalAlpha = 0.85; c.drawImage(R.glowSprite('#ff5a1f'), B.x - r * 2.1, B.y - r * 2.1, r * 4.2, r * 4.2); c.globalAlpha = 1; for(let i = 0; i < 6; i++){ const a = t * 9 + i / 6 * TAU; c.fillStyle = i % 2 ? '#ffd23a' : '#ff5a1f'; c.beginPath(); c.arc(B.x + Math.cos(a) * r * 1.05, B.y + Math.sin(a) * r * 1.05, r * 0.32, 0, TAU); c.fill(); } }
  const g = c.createRadialGradient(B.x - r * 0.35, B.y - r * 0.4, r * 0.1, B.x, B.y, r);
  let c1 = b.c1, c2 = b.c2;
  if(b.disco){ c1 = `hsl(${(t * 200) % 360},90%,80%)`; c2 = `hsl(${(t * 200 + 120) % 360},70%,45%)`; }
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  if(b.spikes){ c.fillStyle = '#b8bdc9'; c.strokeStyle = '#1b1426'; c.lineWidth = 2; const sa = t * 2; for(let i = 0; i < 8; i++){ const a = sa + i / 8 * TAU; c.beginPath(); c.moveTo(B.x + Math.cos(a - 0.25) * r * 0.9, B.y + Math.sin(a - 0.25) * r * 0.9); c.lineTo(B.x + Math.cos(a) * r * 1.45, B.y + Math.sin(a) * r * 1.45); c.lineTo(B.x + Math.cos(a + 0.25) * r * 0.9, B.y + Math.sin(a + 0.25) * r * 0.9); c.fill(); c.stroke(); } }
  c.fillStyle = g; c.strokeStyle = '#1b1426'; c.lineWidth = 3; c.beginPath(); c.arc(B.x, B.y, r, 0, TAU); c.fill(); c.stroke();
  if(b.disco){ c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.5; for(let i = -2; i <= 2; i++){ c.beginPath(); c.moveTo(B.x - r, B.y + i * r * 0.35); c.lineTo(B.x + r, B.y + i * r * 0.35); c.stroke(); } }
  if(b.planet){ c.strokeStyle = 'rgba(255,240,200,0.8)'; c.lineWidth = 3; c.beginPath(); c.ellipse(B.x, B.y, r * 1.5, r * 0.45, -0.4, 0, TAU); c.stroke(); }
  if(b.id === 'bowling'){ c.fillStyle = '#2a0a2a'; for(const [dx, dy] of [[-0.25, -0.3], [0.1, -0.35], [-0.05, 0]]){ c.beginPath(); c.arc(B.x + dx * r, B.y + dy * r, r * 0.13, 0, TAU); c.fill(); } }
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(B.x - r * 0.35, B.y - r * 0.38, r * 0.22, 0, TAU); c.fill();
}
function drawProp(c, p, t){
  c.save(); c.translate(p.x, p.y);
  c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.arc(5, 7, p.r, 0, TAU); c.fill();
  c.rotate(p.a); c.strokeStyle = '#1b1426'; c.lineWidth = 3;
  if(p.k === 'crate'){ c.fillStyle = '#d99a4e'; c.fillRect(-p.r, -p.r, p.r * 2, p.r * 2); c.strokeRect(-p.r, -p.r, p.r * 2, p.r * 2); c.strokeStyle = '#8a5520'; c.lineWidth = 3; c.beginPath(); c.moveTo(-p.r, -p.r); c.lineTo(p.r, p.r); c.moveTo(p.r, -p.r); c.lineTo(-p.r, p.r); c.stroke(); }
  else if(p.k === 'barrel'){ const fl = p.fuse > 0 && Math.floor(t * 30) % 2; c.fillStyle = fl ? '#ffffff' : '#ff3a2a'; c.beginPath(); c.arc(0, 0, p.r, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(0, 0, p.r * 0.55, 0, TAU); c.fill(); c.fillStyle = '#1b1426'; c.font = `900 ${Math.round(p.r)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 0, 1); }
  else if(p.k === 'cone'){ c.fillStyle = '#ff7a1f'; c.beginPath(); c.arc(0, 0, p.r, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, 0, p.r * 0.5, 0, TAU); c.fill(); }
  else if(p.k === 'tire'){ c.fillStyle = '#2b2b38'; c.beginPath(); c.arc(0, 0, p.r, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#55556a'; c.beginPath(); c.arc(0, 0, p.r * 0.5, 0, TAU); c.fill(); c.strokeStyle = '#ffd23a'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, p.r * 0.75, 0, TAU); c.stroke(); }
  c.restore();
}
