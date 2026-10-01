'use strict';
/* Canvas renderer: a glowing dungeon pinball table. */
const R = {
  cv: null, c: null, W: 0, H: 0, dpr: 1, s: 1, ox: 0, oy: 0, bg: null, bgKey: '',
  init(){ this.cv = $('cv'); this.c = this.cv.getContext('2d'); this.resize(); addEventListener('resize', () => this.resize()); },
  resize(){
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.W = innerWidth; this.H = innerHeight;
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    const port = this.H > this.W;
    const top = port ? 64 : 10, bot = port ? 10 : 10;
    this.s = Math.min(this.W / (TW + 20), (this.H - top - bot) / (TH + 10));
    this.ox = (this.W - TW * this.s) / 2; this.oy = top + (this.H - top - bot - TH * this.s) / 2;
    this.bgKey = '';
  },
  draw(){
    const c = this.c, d = this.dpr, s = this.s, th = G.theme;
    c.setTransform(d, 0, 0, d, 0, 0);
    const g = c.createRadialGradient(this.W / 2, this.H / 2, 50, this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.7);
    g.addColorStop(0, th.bg1); g.addColorStop(1, '#05060c'); c.fillStyle = g; c.fillRect(0, 0, this.W, this.H);
    this.torches(c, th);
    const sh = save.opt.shake ? G.shake : 0;
    c.setTransform(s * d, 0, 0, s * d, (this.ox + (Math.random() - 0.5) * sh) * d, (this.oy + (Math.random() - 0.5) * sh) * d);
    this.table(c, th);
    this.lanes(c, th);
    this.targets(c, th);
    this.bumpers(c, th);
    this.mons(c, th);
    this.orbs(c);
    this.flippers(c, th);
    this.balls(c);
    this.fx(c, th);
    c.setTransform(d, 0, 0, d, 0, 0);
    if(G.flash > 0){ c.globalAlpha = G.flash * 0.5; c.fillStyle = G.flashC; c.fillRect(0, 0, this.W, this.H); c.globalAlpha = 1; }
    if(G.saveT > 0 && G.state === 'play'){
      const p = this.toS(300, 950);
      c.fillStyle = `rgba(159,230,255,${0.5 + Math.sin(G.t * 10) * 0.3})`; c.font = `900 ${Math.round(16 * s)}px ${FONT}`; c.textAlign = 'center';
      c.fillText('🛟 BALL SAVER', p.x, p.y);
    }
  },
  /* flickering wall torches beside the table on wide screens */
  torches(c, th){
    const side = this.ox;
    if(side < 140) return;
    for(const x of [side * 0.5, this.W - side * 0.5]){
      for(const yk of [0.3, 0.72]){
        const y = this.H * yk, f = Math.sin(G.t * 13 + x + yk * 9) * 0.15 + Math.sin(G.t * 7.3 + x) * 0.1;
        const gl = c.createRadialGradient(x, y - 30, 4, x, y - 30, 140); gl.addColorStop(0, `rgba(255,170,60,${0.32 + f * 0.3})`); gl.addColorStop(1, 'rgba(255,170,60,0)');
        c.fillStyle = gl; c.fillRect(x - 140, y - 170, 280, 280);
        c.fillStyle = '#3a2a1a'; c.fillRect(x - 6, y - 16, 12, 46); c.fillStyle = '#5a4a3a'; c.fillRect(x - 12, y - 18, 24, 8);
        c.fillStyle = '#ff8a2e'; c.beginPath(); c.ellipse(x, y - 34, 10 + f * 8, 20 + f * 12, 0, 0, TAU); c.fill();
        c.fillStyle = '#ffe14d'; c.beginPath(); c.ellipse(x, y - 30, 5 + f * 4, 11 + f * 6, 0, 0, TAU); c.fill();
      }
    }
  },
  toS(x, y){ return { x: this.ox + x * this.s, y: this.oy + y * this.s }; },
  table(c, th){
    // playfield (cached)
    const key = th.name + this.s;
    if(this.bgKey !== key){
      this.bgKey = key;
      const cv = this.bg || (this.bg = document.createElement('canvas'));
      cv.width = TW; cv.height = TH + 40;
      const b = cv.getContext('2d');
      b.save();
      b.beginPath(); b.arc(300, 300, 270, Math.PI, 0); b.lineTo(570, 760); b.lineTo(RP.x + 12, RP.y); b.lineTo(RP.x + 12, TH + 40); b.lineTo(LP.x - 12, TH + 40); b.lineTo(LP.x - 12, LP.y); b.lineTo(30, 760); b.closePath();
      const gg = b.createLinearGradient(0, 0, 0, TH); gg.addColorStop(0, th.bg1); gg.addColorStop(1, th.bg2);
      b.fillStyle = gg; b.fill(); b.clip();
      b.globalAlpha = 0.18; b.strokeStyle = th.wall; b.lineWidth = 1.5;
      for(let y = 0; y < TH; y += 40){ const o = (y / 40) % 2 ? 30 : 0; for(let x = -o; x < TW; x += 60){ b.strokeRect(x, y, 60, 40); } }
      b.globalAlpha = 0.12; b.fillStyle = th.glow; b.font = '900 46px ' + FONT; b.textAlign = 'center';
      b.fillText('⚔', 300, 690);
      b.restore();
      // apron at the bottom
      b.fillStyle = '#05060c'; b.fillRect(0, TH - 6, TW, 46);
    }
    c.drawImage(this.bg, 0, 0, TW, TH + 40);
    // walls glow
    c.lineCap = 'round';
    for(const pass of [0, 1]){
      c.strokeStyle = pass ? th.wall : th.glow; c.globalAlpha = pass ? 1 : 0.25; c.lineWidth = pass ? 8 : 18;
      c.beginPath();
      for(const w of G.walls){ if(w.kind === 'sling') continue; c.moveTo(w.ax, w.ay); c.lineTo(w.bx, w.by); }
      c.stroke();
    }
    c.globalAlpha = 1;
    // slingshots
    for(const w of G.walls){
      if(w.kind !== 'sling') continue;
      const k = w.hit || 0; if(w.hit) w.hit = Math.max(0, w.hit - 0.06);
      c.strokeStyle = k > 0 ? '#ffffff' : th.acc; c.lineWidth = 10 + k * 6;
      c.beginPath(); c.moveTo(w.ax, w.ay); c.lineTo(w.bx, w.by); c.stroke();
    }
    // drain glow + launch chute
    c.fillStyle = 'rgba(255,60,80,0.25)'; c.fillRect(LP.x + 20, TH - 20, RP.x - LP.x - 40, 14);
    c.fillStyle = th.wall; c.globalAlpha = 0.6; c.fillRect(280, 14, 40, 10); c.globalAlpha = 1;
  },
  lanes(c, th){
    const xs = [210, 300, 390];
    for(let i = 0; i < 3; i++){
      const on = G.lanes[i];
      c.fillStyle = on ? th.acc : 'rgba(255,255,255,0.15)';
      if(on){ c.shadowColor = th.acc; c.shadowBlur = 14; }
      c.beginPath(); c.arc(xs[i], 112, 9, 0, TAU); c.fill(); c.shadowBlur = 0;
    }
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = '900 16px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('x' + G.mult, 300, 150);
  },
  targets(c, th){
    for(const t of G.targets){
      if(!t.up){ c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(t.x - t.w / 2, t.y - 2, t.w, 4); continue; }
      c.fillStyle = t.hit > 0 ? '#ffffff' : th.acc; c.strokeStyle = '#000'; c.lineWidth = 2;
      c.fillRect(t.x - t.w / 2, t.y - 7, t.w, 14); c.strokeRect(t.x - t.w / 2, t.y - 7, t.w, 14);
    }
    if(G.targets.length && G.targets.some(t => t.up)){ c.fillStyle = 'rgba(255,255,255,0.5)'; c.font = '900 12px ' + FONT; c.textAlign = 'center'; c.fillText('JACKPOT', G.targets[0].x + 69, G.targets[0].y + 24); }
  },
  bumpers(c, th){
    for(const b of G.bumpers){
      const k = b.hit, r = b.r * (1 + k * 0.15);
      c.fillStyle = th.glow; c.globalAlpha = 0.25 + k * 0.5; c.beginPath(); c.arc(b.x, b.y, r + 10, 0, TAU); c.fill(); c.globalAlpha = 1;
      c.fillStyle = k > 0.3 ? '#ffffff' : th.acc; c.strokeStyle = '#000'; c.lineWidth = 3;
      c.beginPath(); c.arc(b.x, b.y, r, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = th.bg2; c.beginPath(); c.arc(b.x, b.y, r * 0.55, 0, TAU); c.fill();
      c.fillStyle = th.glow; c.beginPath(); c.arc(b.x, b.y, r * 0.3, 0, TAU); c.fill();
    }
  },
  orbs(c){
    for(const o of G.orbs){ if(o.dead) continue; c.fillStyle = '#e8f0ff'; c.strokeStyle = '#5a6a8a'; c.lineWidth = 3; c.beginPath(); c.arc(o.x, o.y, o.r, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#9fb4c8'; c.beginPath(); c.arc(o.x, o.y, o.r * 0.5, 0, TAU); c.fill(); }
  },
  mons(c, th){
    for(const m of G.mons){
      if(m.dead) continue;
      c.save(); c.translate(m.x, m.y);
      if(m.gone) c.globalAlpha = 0.25;
      const sq = 1 + m.hit * 0.18, wob = Math.sin(m.ph * 4) * 0.04;
      c.scale(sq + wob, 1 / sq - wob);
      drawMonster(c, m, G.t);
      c.restore();
      c.globalAlpha = 1;
      if(m.hp < m.max){
        const w = m.r * 1.8, k = Math.max(0, m.hp / m.max), y = m.y - m.r - (m.boss ? 22 : 14);
        c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(m.x - w / 2, y, w, 7);
        c.fillStyle = k > 0.5 ? '#5fe08a' : k > 0.25 ? '#ffd23a' : '#ff4f5a'; c.fillRect(m.x - w / 2, y, w * k, 7);
      }
      if(m.burn > 0){ for(let i = 0; i < 2; i++){ const a = Math.random() * TAU; G.parts.push({ x: m.x + Math.cos(a) * m.r * 0.7, y: m.y + Math.sin(a) * m.r * 0.7, vx: 0, vy: -60, life: 0, max: 0.4, c: Math.random() < 0.5 ? '#ffb13a' : '#ff4f3a', sz: 4 }); } }
    }
  },
  flippers(c, th){
    for(const side of ['L', 'R']){
      const f = flipper(side), on = side === 'L' ? G.inL : G.inR;
      c.lineCap = 'round';
      c.strokeStyle = th.glow; c.globalAlpha = on ? 0.5 : 0.2; c.lineWidth = 34;
      c.beginPath(); c.moveTo(f.px, f.py); c.lineTo(f.tx, f.ty); c.stroke(); c.globalAlpha = 1;
      const g = c.createLinearGradient(f.px, f.py, f.tx, f.ty); g.addColorStop(0, '#ffffff'); g.addColorStop(1, th.acc);
      c.strokeStyle = '#000'; c.lineWidth = 26; c.beginPath(); c.moveTo(f.px, f.py); c.lineTo(f.tx, f.ty); c.stroke();
      c.strokeStyle = g; c.lineWidth = 20; c.beginPath(); c.moveTo(f.px, f.py); c.lineTo(f.tx, f.ty); c.stroke();
      c.fillStyle = '#000'; c.beginPath(); c.arc(f.px, f.py, 5, 0, TAU); c.fill();
    }
  },
  balls(c){
    const sk = BALLS.find(b => b.id === save.ball) || BALLS[0];
    for(const b of G.balls){
      for(let i = 0; i < b.trail.length; i++){ const p = b.trail[i], k = i / b.trail.length; c.globalAlpha = k * 0.4; c.fillStyle = G.cards.fire ? '#ff8a3a' : G.theme.glow; c.beginPath(); c.arc(p.x, p.y, BR * k, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
      const g = c.createRadialGradient(b.x - 4, b.y - 4, 1, b.x, b.y, BR);
      g.addColorStop(0, sk.c1); g.addColorStop(1, sk.c2 === 'rainbow' ? `hsl(${(G.t * 200) % 360},90%,60%)` : sk.c2);
      c.fillStyle = g; c.strokeStyle = '#000'; c.lineWidth = 2;
      c.beginPath(); c.arc(b.x, b.y, BR, 0, TAU); c.fill(); c.stroke();
      if(G.cards.fire){ c.strokeStyle = '#ff8a3a'; c.lineWidth = 3; c.beginPath(); c.arc(b.x, b.y, BR + 3 + Math.sin(G.t * 30) * 1.5, 0, TAU); c.stroke(); }
    }
  },
  fx(c, th){
    c.lineCap = 'round';
    for(const bo of G.bolts){
      c.strokeStyle = bo.col; c.globalAlpha = 1 - bo.life / 0.35; c.lineWidth = 4;
      c.beginPath(); c.moveTo(bo.x0, bo.y0);
      for(let i = 1; i < 6; i++){ const k = i / 6; c.lineTo(lerp(bo.x0, bo.x1, k) + rnd(-14, 14), lerp(bo.y0, bo.y1, k) + rnd(-10, 10)); }
      c.lineTo(bo.x1, bo.y1); c.stroke();
    }
    c.globalAlpha = 1;
    for(const r of G.rings){ const k = r.life / r.max; c.globalAlpha = 1 - k; c.strokeStyle = r.col; c.lineWidth = 6 * (1 - k); c.beginPath(); c.arc(r.x, r.y, r.r * (0.4 + k), 0, TAU); c.stroke(); }
    for(const p of G.parts){ const k = 1 - p.life / p.max; c.globalAlpha = Math.min(1, k * 1.5); c.fillStyle = p.c; if(p.sq) c.fillRect(p.x - p.sz, p.y - p.sz / 2, p.sz * 2, p.sz); else { c.beginPath(); c.arc(p.x, p.y, p.sz * (p.coin ? 1 : k), 0, TAU); c.fill(); } }
    c.globalAlpha = 1;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    for(const t of G.texts){
      const k = t.life / t.max, pop = Math.min(1, t.life * 10), sc = t.size * (0.6 + easeBack(pop) * 0.4);
      c.save(); c.translate(t.x, t.y); c.scale(sc, sc); c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      c.font = '900 24px ' + FONT; c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,0.9)'; c.strokeText(t.txt, 0, 0); c.fillStyle = t.col; c.fillText(t.txt, 0, 0);
      c.restore();
    }
    c.globalAlpha = 1;
  }
};

const FONT = '"Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
function easeBack(t){ const s = 1.9; t -= 1; return t * t * ((s + 1) * t + s) + 1; }
function drawMonster(c, m, t){
  const r = m.r, col = m.hit > 0.5 ? '#ffffff' : m.col;
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, r * 0.95, r * 0.9, r * 0.25, 0, 0, TAU); c.fill();
  c.strokeStyle = '#0a0a14'; c.lineWidth = 3;
  if(m.k === 'bat'){
    const f = Math.sin(t * 18) * 0.5;
    c.fillStyle = col;
    for(const s of [-1, 1]){ c.beginPath(); c.moveTo(s * r * 0.4, -r * 0.1); c.quadraticCurveTo(s * r * 1.6, -r * (0.9 + f), s * r * 1.5, r * 0.2); c.quadraticCurveTo(s * r, 0, s * r * 0.4, r * 0.3); c.fill(); c.stroke(); }
  }
  if(m.k === 'knight'){
    // shield underneath
    c.fillStyle = '#c8d3e0'; c.beginPath(); c.moveTo(-r * 0.9, r * 0.3); c.lineTo(r * 0.9, r * 0.3); c.lineTo(r * 0.6, r * 1.1); c.lineTo(0, r * 1.3); c.lineTo(-r * 0.6, r * 1.1); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ffd23a'; c.fillRect(-3, r * 0.45, 6, r * 0.6);
  }
  if(m.k === 'boss'){
    c.fillStyle = '#ffd23a';
    c.beginPath(); c.moveTo(-r * 0.6, -r * 0.75); c.lineTo(-r * 0.7, -r * 1.25); c.lineTo(-r * 0.3, -r * 1.0); c.lineTo(0, -r * 1.4); c.lineTo(r * 0.3, -r * 1.0); c.lineTo(r * 0.7, -r * 1.25); c.lineTo(r * 0.6, -r * 0.75); c.closePath(); c.fill(); c.stroke();
  }
  // body
  c.fillStyle = col;
  c.beginPath();
  if(m.k === 'slime' || m.k === 'mini' || m.k === 'split'){ c.moveTo(-r, r * 0.6); c.bezierCurveTo(-r * 1.1, -r * 0.9, r * 1.1, -r * 0.9, r, r * 0.6); c.quadraticCurveTo(0, r * 0.9, -r, r * 0.6); }
  else if(m.k === 'ghost'){ c.moveTo(-r, r * 0.8); c.lineTo(-r, -r * 0.1); c.arc(0, -r * 0.1, r, Math.PI, 0); c.lineTo(r, r * 0.8); for(let i = 0; i < 4; i++) c.lineTo(r - (i + 0.5) * r / 2, r * (i % 2 ? 0.8 : 0.5)); }
  else c.arc(0, 0, r, 0, TAU);
  c.closePath(); c.fill(); c.stroke();
  if(m.k === 'bomb'){ c.strokeStyle = '#8a5a3c'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(8, -r - 14, 16, -r - 10); c.stroke(); c.fillStyle = Math.sin(t * 20) > 0 ? '#ffe14d' : '#ff4f3a'; c.beginPath(); c.arc(16, -r - 10, 5, 0, TAU); c.fill(); }
  if(m.k === 'split'){ c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -r * 0.7); c.lineTo(0, r * 0.7); c.stroke(); }
  // face
  c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(-r * 0.35, -r * 0.4, r * 0.18, r * 0.1, -0.5, 0, TAU); c.fill();
  const ey = m.k === 'slime' || m.k === 'mini' || m.k === 'split' ? -r * 0.05 : -r * 0.15;
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-r * 0.3, ey, r * 0.2, 0, TAU); c.arc(r * 0.3, ey, r * 0.2, 0, TAU); c.fill();
  c.fillStyle = '#0a0a14'; c.beginPath(); c.arc(-r * 0.28, ey + 2, r * 0.1, 0, TAU); c.arc(r * 0.32, ey + 2, r * 0.1, 0, TAU); c.fill();
  c.strokeStyle = '#0a0a14'; c.lineWidth = Math.max(2, r * 0.08); c.lineCap = 'round';
  c.beginPath(); c.moveTo(-r * 0.5, ey - r * 0.3); c.lineTo(-r * 0.15, ey - r * 0.18); c.moveTo(r * 0.5, ey - r * 0.3); c.lineTo(r * 0.15, ey - r * 0.18); c.stroke();
  if(m.hit > 0.3){ c.beginPath(); c.arc(0, ey + r * 0.45, r * 0.15, 0, TAU); c.stroke(); }
  else{ c.beginPath(); c.moveTo(-r * 0.25, ey + r * 0.42); c.quadraticCurveTo(0, ey + r * 0.3, r * 0.25, ey + r * 0.42); c.stroke(); }
}
