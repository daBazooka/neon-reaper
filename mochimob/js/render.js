'use strict';
/* Canvas renderer. World units; the camera follows the mob and zooms out as it grows. */
const R = {
  cv: null, c: null, W: 0, H: 0, dpr: 1, s: 1, sprites: {}, patKey: '', pat: null, low: false,

  init(){
    this.cv = $('cv'); this.c = this.cv.getContext('2d');
    this.resize();
    addEventListener('resize', () => this.resize());
  },
  resize(){
    this.dpr = Math.min(save.opt.fx === 'low' ? 1 : 2, devicePixelRatio || 1);
    this.W = innerWidth; this.H = innerHeight;
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
  },
  base(){ return Math.min(this.W, this.H) / 600; },
  scale(){ return G.cam.z * this.base(); },
  toWorld(sx, sy){ const s = this.scale(); return { x: G.cam.x + (sx - this.W / 2) / s, y: G.cam.y + (sy - this.H / 2) / s }; },
  toScreen(x, y){ const s = this.scale(); return { x: (x - G.cam.x) * s + this.W / 2, y: (y - G.cam.y) * s + this.H / 2 }; },

  /* ---------- sprites ---------- */
  mochiSprite(col, col2){
    const key = col + col2;
    if(this.sprites[key]) return this.sprites[key];
    const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const c = cv.getContext('2d');
    c.translate(S / 2, S / 2 + 3);
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(0, 20, 22, 7, 0, 0, TAU); c.fill();
    const g = c.createRadialGradient(-8, -10, 4, 0, 0, 28);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, col); g.addColorStop(1, col2);
    c.fillStyle = g; c.strokeStyle = 'rgba(90,40,70,0.55)'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-25, 12); c.bezierCurveTo(-28, -14, -14, -24, 0, -24); c.bezierCurveTo(14, -24, 28, -14, 25, 12); c.quadraticCurveTo(0, 22, -25, 12); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(-9, -13, 7, 4, -0.5, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,110,140,0.45)'; c.beginPath(); c.ellipse(-12, 3, 5, 3, 0, 0, TAU); c.ellipse(12, 3, 5, 3, 0, 0, TAU); c.fill();
    this.sprites[key] = cv;
    return cv;
  },
  flavorSprite(m){
    const f = FLAVORS.find(f => f.id === save.flavor) || FLAVORS[0];
    if(f.c === 'rainbow'){ const h = Math.round(((m.hue + G.t * 60) % 360) / 30) * 30; return this.mochiSprite(`hsl(${h},95%,80%)`, `hsl(${h},85%,62%)`); }
    return this.mochiSprite(f.c, f.c2);
  },
  ground(b){
    const key = b.name;
    if(this.patKey === key) return this.pat;
    const S = 240, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const c = cv.getContext('2d');
    c.fillStyle = b.g1; c.fillRect(0, 0, S, S);
    c.fillStyle = b.g2; for(let i = 0; i < 2; i++) for(let j = 0; j < 2; j++) if((i + j) % 2) c.fillRect(i * 120, j * 120, 120, 120);
    let s = 7;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for(let i = 0; i < 26; i++){ c.fillStyle = b.dot; c.beginPath(); c.ellipse(r() * S, r() * S, 3 + r() * 5, 2 + r() * 3, 0, 0, TAU); c.fill(); }
    for(let i = 0; i < 7; i++){
      const x = r() * S, y = r() * S, col = b.flower[i % b.flower.length];
      c.fillStyle = col; for(let k = 0; k < 5; k++){ c.beginPath(); c.arc(x + Math.cos(k * 1.26) * 4, y + Math.sin(k * 1.26) * 4, 3, 0, TAU); c.fill(); }
      c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(x, y, 2.2, 0, TAU); c.fill();
    }
    this.pat = this.c.createPattern(cv, 'repeat'); this.patKey = key;
    return this.pat;
  },

  /* ---------- frame ---------- */
  draw(){
    const c = this.c, W = this.W, H = this.H, d = this.dpr;
    if(!G.cfg) return;
    const b = G.cfg.biome, s = this.scale();
    c.setTransform(d, 0, 0, d, 0, 0);
    c.fillStyle = b.edge; c.fillRect(0, 0, W, H);
    const sh = save.opt.shake ? G.shake : 0;
    const ox = W / 2 - G.cam.x * s + (Math.random() - 0.5) * sh, oy = H / 2 - G.cam.y * s + (Math.random() - 0.5) * sh;
    c.setTransform(s * d, 0, 0, s * d, ox * d, oy * d);
    // view rect in world units (for culling)
    const vx0 = G.cam.x - W / 2 / s - 80, vx1 = G.cam.x + W / 2 / s + 80, vy0 = G.cam.y - H / 2 / s - 80, vy1 = G.cam.y + H / 2 / s + 80;
    const vis = (x, y, r = 0) => x + r > vx0 && x - r < vx1 && y + r > vy0 && y - r < vy1;
    this.vis = vis;
    // ground + hedge border
    c.fillStyle = this.ground(b); c.fillRect(0, 0, G.cfg.W, G.cfg.H);
    c.strokeStyle = shade(b.edge, 0.15); c.lineWidth = 34; c.strokeRect(-17, -17, G.cfg.W + 34, G.cfg.H + 34);
    c.fillStyle = shade(b.edge, 0.3);
    for(let x = 0; x < G.cfg.W; x += 70){ c.beginPath(); c.arc(x + 35, -22, 30, 0, TAU); c.arc(x + 35, G.cfg.H + 22, 30, 0, TAU); c.fill(); }
    for(let y = 0; y < G.cfg.H; y += 70){ c.beginPath(); c.arc(-22, y + 35, 30, 0, TAU); c.arc(G.cfg.W + 22, y + 35, 30, 0, TAU); c.fill(); }

    this.nest(c);
    for(const cc of G.cacti) if(vis(cc.x, cc.y, 40)) drawCactus(c, cc.x, cc.y, cc.r);
    for(const e of G.eggs) if(vis(e.x, e.y, 40)) drawEgg(c, e);
    for(const f of G.fruits) if(!f.dead && vis(f.x, f.y, 20)) drawFruit(c, f, G.t);
    for(const cr of G.crates) if(vis(cr.x, cr.y, 50)) drawCrate(c, cr);
    for(const tr of G.treasures) if(!tr.moving && vis(tr.x, tr.y, tr.r + 40)) this.treasure(c, tr);
    if(G.pinata) drawPinata(c, G.pinata, G.t);
    for(const w of G.wild) if(vis(w.x, w.y, 30)) this.wildMochi(c, w);
    this.mob(c, vis);
    for(const tr of G.treasures) if(tr.moving && vis(tr.x, tr.y, tr.r + 40)) this.treasure(c, tr);
    for(const g of G.gobs) if(vis(g.x, g.y, g.r + 30)) drawGob(c, g, G.t);
    if(G.melon && G.melon.warn <= 0) drawMelon(c, G.melon);
    this.effects(c);
    // target marker
    if(G.state === 'play' || G.state === 'title'){
      c.globalAlpha = 0.5; c.strokeStyle = '#ffffff'; c.lineWidth = 4;
      c.beginPath(); c.arc(G.tx, G.ty, 16 + Math.sin(G.t * 6) * 3, 0, TAU); c.stroke(); c.globalAlpha = 1;
    }
    // screen space overlays
    c.setTransform(d, 0, 0, d, 0, 0);
    this.warnArrows(c);
    if(G.frenzy > 0){
      const a = 0.18 + Math.sin(G.t * 10) * 0.06;
      const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, 'rgba(255,90,208,0)'); g.addColorStop(1, `hsla(${(G.t * 200) % 360},100%,65%,${a * 2})`);
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
    if(G.magnet > 0){ c.fillStyle = `rgba(111,208,255,${0.08 + Math.sin(G.t * 8) * 0.04})`; c.fillRect(0, 0, W, H); }
    if(G.flash > 0){ c.globalAlpha = G.flash * 0.6; c.fillStyle = G.flashC; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  },
  nest(c){
    const n = G.nest, bo = Math.sin(n.bounce * 12) * n.bounce * 10;
    c.save(); c.translate(n.x, n.y);
    c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(0, 40, n.r * 1.25, 26, 0, 0, TAU); c.fill();
    // glowing drop zone
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 5; c.setLineDash([14, 12]); c.lineDashOffset = -G.t * 30;
    c.beginPath(); c.ellipse(0, 10, n.r * 1.35, n.r * 0.75, 0, 0, TAU); c.stroke(); c.setLineDash([]);
    // basket
    c.fillStyle = '#c98a4b'; c.strokeStyle = '#7a4a22'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(-n.r, -4); c.quadraticCurveTo(-n.r * 0.9, 46, 0, 50); c.quadraticCurveTo(n.r * 0.9, 46, n.r, -4); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(122,74,34,0.5)'; c.lineWidth = 3;
    for(let i = -3; i <= 3; i++){ c.beginPath(); c.moveTo(i * 26, 0); c.lineTo(i * 20, 44); c.stroke(); }
    // mama mochi
    c.save(); c.translate(0, -26 - bo); c.scale(1 + n.bounce * 0.15, 1 - n.bounce * 0.1);
    const sp = this.mochiSprite('#fff6f2', '#ffc6d6');
    c.drawImage(sp, -70, -74, 140, 140);
    faceEyes(c, 0, -10, 3.6, 0, 0, n.bounce > 0.3);
    c.restore();
    c.fillStyle = '#ff7ab8'; c.beginPath(); c.moveTo(-10, -96 - bo); c.lineTo(10, -96 - bo); c.lineTo(0, -84 - bo); c.fill();
    c.beginPath(); c.arc(-12, -96 - bo, 9, 0, TAU); c.arc(12, -96 - bo, 9, 0, TAU); c.fill();
    c.restore();
  },
  mob(c, vis){
    const z = MR * 3;
    for(const m of G.mob){
      if(!vis(m.x, m.y, 20)) continue;
      const sp = this.flavorSprite(m);
      const v = Math.hypot(m.vx, m.vy), sq = G.squish && m.st === 0 ? 0.86 : 1;
      const ax = m.sq * sq, ay = (2 - m.sq) * sq * (G.squish && m.st === 0 ? 0.9 : 1) + Math.sin(m.bob) * 0.06;
      const w = z * ax, h = z * ay;
      c.drawImage(sp, m.x - w / 2, m.y - h * 0.62, w, h);
      const lx = v > 20 ? m.vx / v : 0, ly = v > 20 ? m.vy / v : 0.2;
      c.fillStyle = '#2b1a22';
      c.beginPath(); c.arc(m.x - 5 + lx * 2.5, m.y - 3 + ly * 2, 2.6, 0, TAU); c.arc(m.x + 5 + lx * 2.5, m.y - 3 + ly * 2, 2.6, 0, TAU); c.fill();
      if(m.st === 1){ c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(m.x - 1, m.y - 16, 2, 5); }
    }
  },
  wildMochi(c, w){
    const sp = this.mochiSprite('#ffffff', '#d8e8ff');
    if(w.z > 0){ c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(w.x, w.y + 8, 12, 4, 0, 0, TAU); c.fill(); }
    const y = w.y - w.z, z = MR * 3;
    c.drawImage(sp, w.x - z / 2, y - z * 0.62, z, z);
    c.fillStyle = '#2b1a22'; c.fillRect(w.x - 5, y - 3, 3, 1.5); c.fillRect(w.x + 2, y - 3, 3, 1.5);
    if(w.z === 0){ c.fillStyle = '#ffffff'; c.font = '900 12px ' + FONT; c.textAlign = 'center'; c.fillText('z', w.x + 10, y - 16 - Math.sin(w.bob) * 3); }
  },
  treasure(c, tr){
    const bob = tr.moving ? Math.sin(G.t * 14) * 2 : 0;
    c.save(); c.translate(tr.x, tr.y + bob);
    c.fillStyle = 'rgba(0,0,0,0.16)'; c.beginPath(); c.ellipse(0, tr.r * 0.55, tr.r * 1.05, tr.r * 0.3, 0, 0, TAU); c.fill();
    drawTreasure(c, tr.kind, tr.r, G.t);
    c.restore();
    // progress label
    const power = 1 + save.up.strength * 0.12, lift = Math.floor(tr.carriers.length * power);
    const txt = lift + '/' + tr.W;
    c.font = '900 26px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
    const y = tr.y - tr.r - 26;
    const tw = c.measureText(txt).width + 22;
    c.fillStyle = lift >= tr.W ? 'rgba(40,160,80,0.9)' : 'rgba(43,29,85,0.8)';
    rrect(c, tr.x - tw / 2, y - 16, tw, 32, 14); c.fill();
    c.fillStyle = '#fff'; c.fillText(txt, tr.x, y + 1);
    if(tr.kind === 'golden'){ c.font = '900 16px ' + FONT; c.fillStyle = '#ffe14d'; c.fillText('🥚 GOLDEN', tr.x, y - 26); }
  },
  effects(c){
    for(const r of G.rings){
      const k = r.life / r.max;
      c.globalAlpha = 1 - k; c.strokeStyle = r.col; c.lineWidth = 8 * (1 - k);
      c.beginPath(); c.arc(r.x, r.y, r.r * (0.3 + k * 0.9), 0, TAU); c.stroke();
    }
    for(const p of G.parts){
      const k = 1 - p.life / p.max;
      c.globalAlpha = Math.min(1, k * 1.6); c.fillStyle = p.c;
      if(p.k === 2){ c.save(); c.translate(p.x, p.y); c.rotate((p.rot || 0) + p.life * 8); c.fillRect(-p.sz, -p.sz / 2, p.sz * 2, p.sz); c.restore(); }
      else{ c.beginPath(); c.arc(p.x, p.y, p.sz * k, 0, TAU); c.fill(); }
    }
    c.globalAlpha = 1;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    const inv = 1 / G.cam.z;
    for(const t of G.texts){
      const k = t.life / t.max, pop = Math.min(1, t.life * 9), sc = t.size * (0.6 + easeBack(pop) * 0.4) * Math.min(1.8, inv);
      c.save(); c.translate(t.x, t.y); c.scale(sc, sc);
      c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      c.font = '900 28px ' + FONT; c.lineWidth = 7; c.strokeStyle = 'rgba(50,20,60,0.85)';
      c.strokeText(t.txt, 0, 0); c.fillStyle = t.col; c.fillText(t.txt, 0, 0);
      c.restore();
    }
    c.globalAlpha = 1;
    for(const w of G.warns){
      const a = 0.5 + Math.sin(w.t * 12) * 0.5;
      c.globalAlpha = a; c.strokeStyle = w.col; c.lineWidth = 6;
      c.beginPath(); c.arc(w.x, w.y, 50 + Math.sin(w.t * 8) * 8, 0, TAU); c.stroke();
      c.globalAlpha = 1;
    }
  },
  warnArrows(c){
    const list = G.warns.slice();
    for(const tr of G.treasures) if(tr.kind === 'golden') list.push({ x: tr.x, y: tr.y, col: '#ffd23a', icon: '🥚' });
    if(G.pinata) list.push({ x: G.pinata.x, y: G.pinata.y, col: '#ffb13a', icon: '🪅' });
    for(const w of list){
      const p = this.toScreen(w.x, w.y), m = 44;
      if(p.x > m && p.x < this.W - m && p.y > m + 50 && p.y < this.H - m) continue;
      const cx = this.W / 2, cy = this.H / 2, dx = p.x - cx, dy = p.y - cy;
      const k = Math.min((this.W / 2 - m) / Math.abs(dx || 1), (this.H / 2 - m - 30) / Math.abs(dy || 1));
      const x = cx + dx * k, y = cy + dy * k + 15, a = Math.atan2(dy, dx);
      c.save(); c.translate(x, y);
      c.fillStyle = w.col; c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.fill();
      c.rotate(a); c.beginPath(); c.moveTo(34, 0); c.lineTo(20, -10); c.lineTo(20, 10); c.fill();
      c.restore();
      c.font = '20px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(w.icon, x, y + 1);
    }
  }
};

/* ============ shared drawing helpers ============ */
const FONT = '"Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
function easeBack(t){ const s = 1.9; t -= 1; return t * t * ((s + 1) * t + s) + 1; }
function rrect(c, x, y, w, h, r){ c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function shade(hex, k){
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  if(k < 0){ r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
function faceEyes(c, x, y, s, lx, ly, happy){
  c.fillStyle = '#2b1a22'; c.strokeStyle = '#2b1a22'; c.lineWidth = s * 0.9; c.lineCap = 'round';
  if(happy){ c.beginPath(); c.arc(x - s * 3.4, y, s * 1.3, Math.PI, 0); c.moveTo(x + s * 4.7, y); c.arc(x + s * 3.4, y, s * 1.3, Math.PI, 0); c.stroke(); }
  else{ c.beginPath(); c.arc(x - s * 3.4 + lx, y + ly, s, 0, TAU); c.arc(x + s * 3.4 + lx, y + ly, s, 0, TAU); c.fill(); }
  c.beginPath(); c.arc(x, y + s * 2.2, s * 1.1, 0.2, Math.PI - 0.2); c.stroke();
}
function drawFruit(c, f, t){
  const y = f.y - f.z;
  if(f.z > 0){ c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(f.x, f.y + 6, 9, 3, 0, 0, TAU); c.fill(); }
  const col = FRUIT_COL[f.k] || '#ff4f7a';
  if(f.k === 'candy'){
    c.save(); c.translate(f.x, y); c.rotate(Math.sin(f.bob + t * 2) * 0.3);
    c.fillStyle = col; c.beginPath(); c.moveTo(-8, 0); c.lineTo(-15, -6); c.lineTo(-15, 6); c.closePath(); c.moveTo(8, 0); c.lineTo(15, -6); c.lineTo(15, 6); c.closePath(); c.fill();
    c.beginPath(); c.arc(0, 0, 8.5, 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, 4.5, 0, 4); c.stroke();
    c.restore();
    return;
  }
  if(f.k === 'melon'){
    c.fillStyle = '#4fbf5a'; c.beginPath(); c.arc(f.x, y, 9, 0, Math.PI); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(f.x, y - 1, 7.5, 0, Math.PI); c.fill(); return;
  }
  c.fillStyle = col; c.strokeStyle = 'rgba(60,20,40,0.35)'; c.lineWidth = 2;
  if(f.k === 'grape'){ for(const [dx, dy] of [[-4, -3], [4, -3], [0, 3], [-4, 5], [4, 5]]){ c.beginPath(); c.arc(f.x + dx, y + dy, 4.4, 0, TAU); c.fill(); } }
  else{ c.beginPath(); c.arc(f.x, y, f.k === 'orange' ? 9.5 : 8, 0, TAU); c.fill(); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(f.x - 3, y - 3, 2.4, 0, TAU); c.fill();
  c.fillStyle = '#4fbf5a'; c.beginPath(); c.ellipse(f.x + 3, y - 9, 4.5, 2.2, -0.5, 0, TAU); c.fill();
}
function drawEgg(c, e){
  const w = Math.sin(e.wob * 3) * 0.12, r = e.r;
  c.save(); c.translate(e.x, e.y); c.rotate(w);
  c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(0, r * 1.05, r * 0.9, r * 0.3, 0, 0, TAU); c.fill();
  c.fillStyle = e.big ? '#9fe6ff' : '#fff3d6'; c.strokeStyle = e.big ? '#3a8fc0' : '#c9a06a'; c.lineWidth = 3;
  c.beginPath(); c.ellipse(0, 0, r * 0.82, r * 1.05, 0, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = e.big ? '#ffffff' : '#ff9ec2';
  for(const [dx, dy] of [[-0.3, -0.3], [0.35, 0.1], [-0.1, 0.5]]){ c.beginPath(); c.arc(dx * r, dy * r, r * 0.16, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(-r * 0.3, -r * 0.55, r * 0.18, r * 0.28, -0.4, 0, TAU); c.fill();
  c.restore();
}
function drawCrate(c, cr){
  const sh = cr.hit > 0 ? (Math.random() - 0.5) * 6 : 0, r = cr.r;
  c.save(); c.translate(cr.x + sh, cr.y);
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(-r + 4, r - 6, r * 2, 10);
  c.fillStyle = '#d99a5b'; c.strokeStyle = '#7a4a22'; c.lineWidth = 5;
  rrect(c, -r, -r, r * 2, r * 2, 6); c.fill(); c.stroke();
  c.strokeStyle = '#a8703c'; c.lineWidth = 6;
  c.beginPath(); c.moveTo(-r + 6, -r + 6); c.lineTo(r - 6, r - 6); c.moveTo(r - 6, -r + 6); c.lineTo(-r + 6, r - 6); c.stroke();
  const k = 1 - cr.hp / cr.max;
  if(k > 0.3){ c.strokeStyle = '#4a2a10'; c.lineWidth = 3; c.beginPath(); c.moveTo(-r * 0.5, -r); c.lineTo(-r * 0.2, -r * 0.4); c.lineTo(-r * 0.4, 0); if(k > 0.6){ c.moveTo(r, r * 0.2); c.lineTo(r * 0.4, r * 0.3); c.lineTo(r * 0.5, r * 0.8); } c.stroke(); }
  c.fillStyle = '#ffe14d'; c.font = '900 20px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 0, 1);
  c.restore();
}
function drawCactus(c, x, y, r){
  c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(x, y + r, r, r * 0.3, 0, 0, TAU); c.fill();
  c.fillStyle = '#3fae5a'; c.strokeStyle = '#1f6b34'; c.lineWidth = 3;
  c.beginPath(); c.ellipse(x, y - 4, r * 0.62, r * 1.15, 0, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(x - r * 0.75, y, r * 0.3, r * 0.55, -0.3, 0, TAU); c.ellipse(x + r * 0.75, y - 6, r * 0.3, r * 0.55, 0.3, 0, TAU); c.fill(); c.stroke();
  c.strokeStyle = '#fff'; c.lineWidth = 2;
  for(let i = 0; i < 10; i++){ const a = i / 10 * TAU, px = x + Math.cos(a) * r * 0.62, py = y - 4 + Math.sin(a) * r * 1.15; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * 6, py + Math.sin(a) * 6); c.stroke(); }
  c.fillStyle = '#ff7ab8'; c.beginPath(); c.arc(x, y - r * 1.2, 5, 0, TAU); c.fill();
}
function drawTreasure(c, kind, r, t){
  c.lineJoin = 'round';
  if(kind === 'cake'){
    c.fillStyle = '#ffe3c2'; c.strokeStyle = '#8a5a3c'; c.lineWidth = 5;
    rrect(c, -r, -r * 0.35, r * 2, r * 0.9, 12); c.fill(); c.stroke();
    c.fillStyle = '#ff9ec2'; rrect(c, -r * 0.7, -r * 0.9, r * 1.4, r * 0.62, 10); c.fill(); c.stroke();
    c.fillStyle = '#ffffff'; for(let i = -3; i <= 3; i++){ c.beginPath(); c.arc(i * r * 0.28, -r * 0.35, r * 0.12, 0, Math.PI); c.fill(); }
    c.fillStyle = '#e8233c'; c.beginPath(); c.arc(0, -r * 1.02, r * 0.16, 0, TAU); c.fill();
  }else if(kind === 'donut'){
    c.fillStyle = '#e0a060'; c.strokeStyle = '#8a5a3c'; c.lineWidth = 5;
    c.beginPath(); c.ellipse(0, 0, r, r * 0.8, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#ff7ab8'; c.beginPath(); c.ellipse(0, -r * 0.08, r * 0.86, r * 0.64, 0, 0, TAU); c.fill();
    const sp = ['#fff', '#5ad2ff', '#ffe14d', '#7dff8a'];
    for(let i = 0; i < 14; i++){ const a = i * 2.4, d = r * (0.45 + (i % 3) * 0.12); c.fillStyle = sp[i % 4]; c.save(); c.translate(Math.cos(a) * d, -r * 0.08 + Math.sin(a) * d * 0.75); c.rotate(a); c.fillRect(-4, -1.5, 8, 3); c.restore(); }
    c.fillStyle = shade('#8fdc6a', -0.1); c.beginPath(); c.ellipse(0, -r * 0.05, r * 0.28, r * 0.2, 0, 0, TAU); c.fill();
  }else if(kind === 'crystal'){
    c.fillStyle = '#7fe0ff'; c.strokeStyle = '#2a6f9e'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(0, -r * 1.1); c.lineTo(r * 0.8, -r * 0.2); c.lineTo(r * 0.45, r * 0.7); c.lineTo(-r * 0.45, r * 0.7); c.lineTo(-r * 0.8, -r * 0.2); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.moveTo(0, -r * 1.1); c.lineTo(r * 0.2, -r * 0.2); c.lineTo(-r * 0.3, -r * 0.1); c.closePath(); c.fill();
    const tw = Math.max(0, Math.sin(t * 3)); if(tw > 0.7){ c.fillStyle = '#fff'; c.beginPath(); c.arc(-r * 0.3, -r * 0.5, 4 * tw, 0, TAU); c.fill(); }
  }else if(kind === 'cookie'){
    c.fillStyle = '#e8b06a'; c.strokeStyle = '#8a5a3c'; c.lineWidth = 5;
    c.beginPath(); c.ellipse(0, 0, r, r * 0.85, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#5a3218'; for(let i = 0; i < 9; i++){ const a = i * 2.1, d = r * (0.2 + (i % 3) * 0.22); c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d * 0.8, r * 0.1, 0, TAU); c.fill(); }
  }else{ // golden egg
    const g = c.createRadialGradient(-r * 0.3, -r * 0.4, 4, 0, 0, r * 1.1);
    g.addColorStop(0, '#fffbd0'); g.addColorStop(0.5, '#ffd23a'); g.addColorStop(1, '#c98a00');
    c.fillStyle = 'rgba(255,225,77,0.3)'; c.beginPath(); c.arc(0, 0, r * 1.4 + Math.sin(t * 5) * 4, 0, TAU); c.fill();
    c.fillStyle = g; c.strokeStyle = '#8a5a00'; c.lineWidth = 5;
    c.beginPath(); c.ellipse(0, 0, r * 0.8, r * 1.02, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#fff6b0'; c.beginPath(); c.ellipse(-r * 0.28, -r * 0.5, r * 0.14, r * 0.26, -0.4, 0, TAU); c.fill();
  }
}
function drawGob(c, g, t){
  const r = g.r, hurt = g.hit > 0;
  c.save(); c.translate(g.x, g.y);
  c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(0, r * 0.85, r, r * 0.3, 0, 0, TAU); c.fill();
  const wob = Math.sin(t * 8 + g.x) * 0.05;
  c.scale(g.face * (1 + wob), 1 - wob);
  c.fillStyle = hurt ? '#e0b0ff' : g.boss ? '#7a3fd8' : '#9b5bff'; c.strokeStyle = '#3a1670'; c.lineWidth = g.boss ? 7 : 4;
  c.beginPath(); c.ellipse(0, 0, r, r * 0.88, 0, 0, TAU); c.fill(); c.stroke();
  // horns
  c.fillStyle = '#ffd6f4';
  c.beginPath(); c.moveTo(-r * 0.55, -r * 0.62); c.lineTo(-r * 0.4, -r * 1.05); c.lineTo(-r * 0.2, -r * 0.75); c.fill();
  c.beginPath(); c.moveTo(r * 0.55, -r * 0.62); c.lineTo(r * 0.4, -r * 1.05); c.lineTo(r * 0.2, -r * 0.75); c.fill();
  // mouth
  const open = 0.15 + g.chomp * 0.5 + Math.max(0, Math.sin(t * 7)) * 0.12;
  c.fillStyle = '#3a0f3a'; c.beginPath(); c.ellipse(r * 0.28, r * 0.25, r * 0.45, r * open, 0, 0, TAU); c.fill();
  c.fillStyle = '#fff'; for(let i = -2; i <= 2; i++){ c.beginPath(); c.moveTo(r * 0.28 + i * r * 0.16 - 5, r * 0.25 - r * open + 1); c.lineTo(r * 0.28 + i * r * 0.16 + 5, r * 0.25 - r * open + 1); c.lineTo(r * 0.28 + i * r * 0.16, r * 0.25 - r * open + 9); c.fill(); }
  // eyes
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-r * 0.05, -r * 0.3, r * 0.2, 0, TAU); c.arc(r * 0.45, -r * 0.3, r * 0.2, 0, TAU); c.fill();
  c.fillStyle = '#1b0f33'; c.beginPath(); c.arc(0, -r * 0.27, r * 0.09, 0, TAU); c.arc(r * 0.5, -r * 0.27, r * 0.09, 0, TAU); c.fill();
  c.strokeStyle = '#1b0f33'; c.lineWidth = Math.max(3, r * 0.08); c.lineCap = 'round';
  c.beginPath(); c.moveTo(-r * 0.25, -r * 0.6); c.lineTo(r * 0.12, -r * 0.45); c.moveTo(r * 0.7, -r * 0.6); c.lineTo(r * 0.35, -r * 0.45); c.stroke();
  if(g.boss){
    c.fillStyle = '#ffd23a'; c.strokeStyle = '#8a5a00'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(-r * 0.4, -r * 0.8); c.lineTo(-r * 0.45, -r * 1.25); c.lineTo(-r * 0.2, -r * 1.05); c.lineTo(0, -r * 1.35); c.lineTo(r * 0.2, -r * 1.05); c.lineTo(r * 0.45, -r * 1.25); c.lineTo(r * 0.4, -r * 0.8); c.closePath(); c.fill(); c.stroke();
  }
  c.restore();
  if(g.hp < g.max){
    const w = r * 1.6, k = Math.max(0, g.hp / g.max);
    c.fillStyle = 'rgba(0,0,0,0.4)'; rrect(c, g.x - w / 2, g.y - r - (g.boss ? 60 : 26), w, 10, 5); c.fill();
    c.fillStyle = '#ff5a8a'; rrect(c, g.x - w / 2, g.y - r - (g.boss ? 60 : 26), w * k, 10, 5); c.fill();
  }
}
function drawMelon(c, w){
  c.save(); c.translate(w.x, w.y);
  c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(0, w.r * 0.9, w.r, w.r * 0.25, 0, 0, TAU); c.fill();
  c.rotate(w.rot);
  c.fillStyle = '#3f9a3a'; c.strokeStyle = '#1f5a1f'; c.lineWidth = 6;
  c.beginPath(); c.arc(0, 0, w.r, 0, TAU); c.fill(); c.stroke();
  c.strokeStyle = '#8fdc6a'; c.lineWidth = 9;
  for(let i = 0; i < 5; i++){ c.beginPath(); c.arc(0, 0, w.r * 0.95, i * 1.26, i * 1.26 + 0.5); c.stroke(); }
  c.restore();
  c.fillStyle = '#fff'; c.font = '900 22px ' + FONT; c.textAlign = 'center'; c.fillText('HOLD!', w.x, w.y - w.r - 18);
}
function drawPinata(c, p, t){
  c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x, p.y - 400); c.lineTo(p.x + Math.sin(p.sw) * 10, p.y - p.r); c.stroke();
  c.save(); c.translate(p.x + (p.hit > 0 ? (Math.random() - 0.5) * 8 : 0), p.y); c.rotate(Math.sin(p.sw) * 0.2);
  const cols = ['#ff5a8a', '#ffd23a', '#4dd0ff', '#7dff8a', '#b98cff'];
  for(let i = 0; i < 5; i++){ c.fillStyle = cols[i]; c.fillRect(-p.r, -p.r * 0.6 + i * p.r * 0.24, p.r * 1.6, p.r * 0.25); }
  c.fillStyle = cols[0]; c.beginPath(); c.moveTo(p.r * 0.6, -p.r * 0.6); c.lineTo(p.r * 1.2, -p.r * 1.1); c.lineTo(p.r * 1.3, -p.r * 0.3); c.lineTo(p.r * 0.6, 0); c.fill();
  c.fillStyle = '#2b1a22'; c.beginPath(); c.arc(p.r * 0.95, -p.r * 0.6, 4, 0, TAU); c.fill();
  c.fillStyle = cols[3]; for(let i = 0; i < 4; i++) c.fillRect(-p.r * 0.8 + i * p.r * 0.45, p.r * 0.6, p.r * 0.15, p.r * 0.45);
  c.restore();
  const w = p.r * 2, k = Math.max(0, p.hp / p.max);
  c.fillStyle = 'rgba(0,0,0,0.4)'; rrect(c, p.x - w / 2, p.y + p.r + 30, w, 10, 5); c.fill();
  c.fillStyle = '#ffb13a'; rrect(c, p.x - w / 2, p.y + p.r + 30, w * k, 10, 5); c.fill();
}
