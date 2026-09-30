'use strict';
/* =====================================================================
   Canvas renderer. The level lives in a 1600x900 world. On a portrait
   screen the world is rotated 90 degrees (physics doesn't care), and
   sprites are drawn upright so it reads naturally both ways.
   ===================================================================== */
const R = {
  cv: null, c: null, W: 0, H: 0, dpr: 1, V: { s: 1, ox: 0, oy: 0, port: false },
  bgCache: null, bgKey: '',

  init(){
    this.cv = document.getElementById('cv');
    this.c = this.cv.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },
  resize(){
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = window.innerWidth; this.H = window.innerHeight;
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    const port = this.H > this.W * 1.05, pad = 26;
    const top = port ? 118 : 64, bot = port ? 40 : 14, side = port ? 10 : 14;
    const aw = this.W - side * 2, ah = this.H - top - bot;
    const ww = (port ? LH : LW) + pad * 2, wh = (port ? LW : LH) + pad * 2;
    const s = Math.min(aw / ww, ah / wh);
    const V = this.V;
    V.s = s; V.port = port;
    V.ox = (this.W - (port ? LH : LW) * s) / 2;
    V.oy = top + (ah - (port ? LW : LH) * s) / 2;
    this.bgKey = '';
    if(typeof G !== 'undefined' && G.st === 'intro') this.draw();
  },
  worldTf(c){
    const V = this.V, d = this.dpr, s = V.s * d;
    if(V.port) c.setTransform(0, -s, s, 0, V.ox * d, (V.oy + LW * V.s) * d);
    else c.setTransform(s, 0, 0, s, V.ox * d, V.oy * d);
  },
  toScreen(x, y){
    const V = this.V;
    return V.port ? { x: V.ox + y * V.s, y: V.oy + (LW - x) * V.s } : { x: V.ox + x * V.s, y: V.oy + y * V.s };
  },
  vecToWorld(dx, dy){ return this.V.port ? { x: -dy, y: dx } : { x: dx, y: dy }; },
  upright(c){ if(this.V.port) c.rotate(Math.PI / 2); },
  /* direction from world into screen angle (for things drawn upright) */
  scrAng(a){ return this.V.port ? a - Math.PI / 2 : a; },

  /* ------------------------------------------------------------ */
  draw(){
    const c = this.c;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if(G.st === 'intro'){
      drawThumb(c, this.W, this.H, Math.max(0, G.introT - 0.9));
      this.irisMask(c, this.W * 0.27, this.H * 0.62);
      return;
    }
    const L = G.L;
    if(!L) return;
    this.background(c, L);
    c.save();
    const sh = G.shake;
    this.worldTf(c);
    if(sh > 0) c.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    this.arena(c, L);
    this.winds(c, L);
    this.walls(c, L);
    this.portals(c, L);
    this.bumpers(c, L);
    this.gems(c, L);
    this.spikes(c, L);
    if(G.hint && (G.st === 'aim')) this.hintPath(c, L);
    this.island(c, L);
    this.trail(c);
    this.roo(c, L);
    if(G.st === 'aim') this.aimPreview(c, L);
    if(G.b && G.st === 'fly') this.rang(c, G.b);
    this.particles(c);
    this.texts(c);
    c.restore();
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if(G.flash > 0){ c.globalAlpha = G.flash * 0.6; c.fillStyle = G.flashC; c.fillRect(0, 0, this.W, this.H); c.globalAlpha = 1; }
    if(G.st === 'aim' && S.lvl <= 1 && !S.tut && !G.aim) this.tutHand(c, L);
    const h = handOf(L), hs = this.toScreen(h.x, h.y);
    this.irisMask(c, hs.x, hs.y);
  },
  irisMask(c, x, y){
    if(G.iris >= 1) return;
    const e = G.iris * G.iris * (3 - 2 * G.iris);
    const r = e * Math.hypot(this.W, this.H);
    c.fillStyle = '#1b1440';
    c.beginPath(); c.rect(0, 0, this.W, this.H); c.arc(x, y, Math.max(0.1, r), 0, TAU, true); c.fill('evenodd');
  },

  /* ---------- backdrop (cached per world + size) ---------- */
  background(c, L){
    const key = L.w + ':' + (L.spec.treasure ? 1 : 0) + ':' + this.W + 'x' + this.H;
    if(this.bgKey !== key){
      this.bgKey = key;
      const cv = this.bgCache || (this.bgCache = document.createElement('canvas'));
      cv.width = this.cv.width; cv.height = this.cv.height;
      const b = cv.getContext('2d'); b.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      paintSky(b, this.W, this.H, WORLDS[L.w], L.spec.treasure, L.w * 17 + 3);
    }
    c.drawImage(this.bgCache, 0, 0, this.W, this.H);
    // drifting clouds
    const t = G.rt, wd = WORLDS[L.w];
    c.fillStyle = L.w === 7 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)';
    for(let i = 0; i < 5; i++){
      const sc = 0.6 + (i % 3) * 0.3, x = ((i * 397 + t * (10 + i * 4)) % (this.W + 300)) - 150, y = 40 + ((i * 131) % Math.max(60, this.H * 0.45));
      cloud(c, x, y, 60 * sc);
    }
    if(wd && L.w === 7){
      for(let i = 0; i < 40; i++){
        const x = (i * 211) % this.W, y = (i * 97) % (this.H * 0.8), tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
        c.fillStyle = `rgba(255,255,255,${0.3 + tw * 0.6})`; c.fillRect(x, y, 2, 2);
      }
    }
  },
  arena(c, L){
    c.fillStyle = 'rgba(255,255,255,0.13)';
    rrect(c, 0, 0, LW, LH, 36); c.fill();
    c.lineWidth = 6; c.strokeStyle = 'rgba(255,255,255,0.55)';
    c.setLineDash([22, 16]); c.lineDashOffset = -G.rt * 20;
    rrect(c, -3, -3, LW + 6, LH + 6, 38); c.stroke();
    c.setLineDash([]);
  },
  island(c, L){
    const x = L.roo.x, y = L.roo.y, col = WORLDS[L.w].island;
    c.fillStyle = 'rgba(0,0,0,0.15)';
    c.beginPath(); c.ellipse(x, y + 26, 92, 18, 0, 0, TAU); c.fill();
    c.fillStyle = shade(col, -0.35);
    c.save(); c.translate(x, y); this.upright(c); c.scale(1.35, 1.35);
    c.beginPath(); c.moveTo(-86, 6); c.quadraticCurveTo(-40, 70, 0, 78); c.quadraticCurveTo(40, 70, 86, 6); c.closePath(); c.fill();
    c.fillStyle = col;
    c.beginPath(); c.ellipse(0, 6, 88, 18, 0, 0, TAU); c.fill();
    c.fillStyle = shade(col, 0.25);
    c.beginPath(); c.ellipse(-10, 2, 60, 8, 0, 0, TAU); c.fill();
    c.restore();
  },
  roo(c, L){
    const x = L.roo.x, y = L.roo.y;
    let look = 0, arm = 0.9, holding = G.st === 'aim' || G.st === 'reset' && G.resetT < 0.2;
    const h = handOf(L);
    if(G.b && G.st === 'fly'){ look = Math.atan2(G.b.y - h.y, G.b.x - h.x); }
    let aimA = null;
    if(G.st === 'aim'){
      if(G.aim){ const a = aimFromDrag(G.aim); if(a.len > 10){ aimA = a.ang; } }
      else if(G.kAim) aimA = G.kAim.ang;
    }
    const pose = G.roo.pose, pt = G.roo.t;
    if(aimA != null){ arm = aimA + Math.PI * 0.85; look = aimA; }
    else if(pose === 'throw' && pt < 0.25){ arm = lerp(-2.2, -0.2, pt / 0.25); }
    else if(pose === 'catch' && pt < 0.4){ arm = -1.2; }
    else if(G.st === 'fly'){ arm = look - 0.3; }
    c.save(); c.translate(x, y); this.upright(c);
    const sa = this.scrAng(arm), sl = this.scrAng(look);
    let sq = 1;
    if(pose === 'catch' && pt < 0.3) sq = 1 - Math.sin(pt / 0.3 * Math.PI) * 0.12;
    if(pose === 'throw' && pt < 0.2) sq = 1 + Math.sin(pt / 0.2 * Math.PI) * 0.08;
    c.scale(1.4 * (2 - sq), 1.4 * sq);
    drawRoo(c, G.rt, S.hat, sl, sa, holding ? S.rang : null, G.st === 'clear');
    c.restore();
  },
  aimPreview(c, L){
    let ang, pow;
    if(G.aim){ const a = aimFromDrag(G.aim); if(a.len <= 22) return; ang = a.ang; pow = 0.12 + a.pow * 0.88; }
    else if(G.kAim){ ang = G.kAim.ang; pow = 0.12 + G.kAim.pow * 0.88; }
    else return;
    const b = makeRang(L, ang, pow), n = Math.round(L.spec.preview / DT);
    c.fillStyle = '#ffffff';
    for(let i = 0; i < n && !b.dead; i++){
      stepRang(L, b, false, G.gt, null);
      if(i % 7 === 0){ const k = 1 - i / n; c.globalAlpha = 0.25 + k * 0.75; c.beginPath(); c.arc(b.x, b.y, 6 + k * 8, 0, TAU); c.fill(); }
      if(b.caught) break;
    }
    c.globalAlpha = 1;
    // power ring around Roo
    const h = handOf(L);
    c.lineWidth = 11; c.lineCap = 'round';
    c.strokeStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.arc(h.x, h.y, 95, 0, TAU); c.stroke();
    c.strokeStyle = pow > 0.85 ? '#ff5a7a' : pow > 0.5 ? '#ffd24a' : '#7dffb0';
    c.beginPath(); c.arc(h.x, h.y, 95, ang - pow * Math.PI, ang + pow * Math.PI); c.stroke();
  },
  hintPath(c, L){
    if(!L.solPath) return;
    const p = L.solPath;
    c.lineCap = 'round';
    for(let i = 1; i < p.length; i += 3){
      const a = p[i - 1], b = p[i];
      c.strokeStyle = b.h ? 'rgba(255,90,160,0.8)' : 'rgba(255,225,77,0.75)';
      c.lineWidth = b.h ? 12 : 7;
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
    const h = handOf(L), ang = L.sol.ang, len = 90 + L.sol.pow * 120;
    c.strokeStyle = '#ffe14d'; c.lineWidth = 10;
    c.beginPath(); c.moveTo(h.x, h.y); c.lineTo(h.x + Math.cos(ang) * len, h.y + Math.sin(ang) * len); c.stroke();
    c.save(); c.translate(h.x + Math.cos(ang) * len, h.y + Math.sin(ang) * len); c.rotate(ang);
    c.fillStyle = '#ffe14d'; c.beginPath(); c.moveTo(18, 0); c.lineTo(-10, -16); c.lineTo(-10, 16); c.fill(); c.restore();
  },
  gems(c, L){
    const b = G.b, col = L.spec.treasure ? '#ffc93a' : WORLDS[L.w].gem, t = G.rt;
    for(let i = 0; i < L.gems.length; i++){
      if(b && b.gm[i] && G.st !== 'reset') continue;
      const g = L.gems[i];
      const pop = clamp((G.spawnT - i * 0.08) * 4, 0, 1), sc = pop < 1 ? easeBack(pop) : 1;
      c.save(); c.translate(g.x, g.y + Math.sin(t * 3 + i) * 4); this.upright(c); c.scale(sc * 1.3, sc * 1.3);
      drawGem(c, col, t + i);
      c.restore();
    }
    if(L.star && !(b && b.star && G.st !== 'reset')){
      c.save(); c.translate(L.star.x, L.star.y); this.upright(c); c.rotate(Math.sin(t * 2) * 0.2);
      const sc = clamp((G.spawnT - 0.3) * 4, 0, 1);
      c.scale(sc, sc);
      drawStar(c, 32, t);
      c.restore();
    }
  },
  spikes(c, L){
    for(const z of L.spikes){
      const p = sawPos(z, G.gt);
      if(z.saw){
        c.strokeStyle = 'rgba(40,30,60,0.25)'; c.lineWidth = 6; c.setLineDash([6, 12]);
        c.beginPath(); c.moveTo(z.x - z.mx, z.y - z.my); c.lineTo(z.x + z.mx, z.y + z.my); c.stroke(); c.setLineDash([]);
        c.save(); c.translate(p.x, p.y); c.rotate(G.gt * 9); drawSaw(c, z.r); c.restore();
      }else{
        c.save(); c.translate(p.x, p.y); this.upright(c); drawSpiky(c, z.r, G.rt); c.restore();
      }
    }
  },
  walls(c, L){
    const w = L.w;
    const dark = ['#5e4a3a', '#7a3f22', '#6d3d8a', '#5c7ea3', '#3b4a3a', '#4a5563', '#b35c8a', '#2a2560'][w];
    const mid = ['#a7937b', '#c46d3c', '#b889e6', '#c8dcf0', '#6f7f63', '#8793a3', '#ffc2e0', '#6b63c9'][w];
    c.lineCap = 'round';
    for(const s of L.walls){
      c.strokeStyle = dark; c.lineWidth = P.wallT * 2 + 8;
      c.beginPath(); c.moveTo(s.ax, s.ay); c.lineTo(s.bx, s.by); c.stroke();
      c.strokeStyle = mid; c.lineWidth = P.wallT * 2;
      c.beginPath(); c.moveTo(s.ax, s.ay); c.lineTo(s.bx, s.by); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(s.ax, s.ay - 4); c.lineTo(s.bx, s.by - 4); c.stroke();
    }
  },
  bumpers(c, L){
    for(const u of L.bumpers){
      const ht = G.bumpAnim.get(u), k = ht != null ? Math.max(0, 1 - (G.gt - ht) * 3) : 0;
      const sq = 1 + Math.sin((G.gt - (ht || 0)) * 30) * 0.18 * k;
      c.save(); c.translate(u.x, u.y); this.upright(c); c.scale(sq, 2 - sq);
      drawBumper(c, u.r, k);
      c.restore();
    }
  },
  portals(c, L){
    for(const p of L.portals){
      drawPortal(c, p.ax, p.ay, '#b690ff', G.rt);
      drawPortal(c, p.bx, p.by, '#6ee7ff', -G.rt);
    }
  },
  winds(c, L){
    for(const z of L.winds){
      c.fillStyle = 'rgba(255,255,255,0.12)';
      rrect(c, z.x, z.y, z.w, z.h, 26); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3; c.setLineDash([10, 10]);
      rrect(c, z.x, z.y, z.w, z.h, 26); c.stroke(); c.setLineDash([]);
      const a = Math.atan2(z.ay, z.ax), ux = Math.cos(a), uy = Math.sin(a);
      c.save(); rrect(c, z.x, z.y, z.w, z.h, 26); c.clip();
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 4; c.lineCap = 'round';
      const span = Math.hypot(z.w, z.h);
      for(let i = 0; i < 9; i++){
        const o = ((i * 0.37) % 1 - 0.5) * span, d = ((G.rt * 260 + i * 97) % (span + 120)) - span / 2 - 60;
        const cx = z.x + z.w / 2 + ux * d - uy * o, cy = z.y + z.h / 2 + uy * d + ux * o;
        c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx - ux * 50, cy - uy * 50); c.stroke();
      }
      c.restore();
      // arrow
      c.save(); c.translate(z.x + z.w / 2, z.y + z.h / 2); c.rotate(a);
      c.fillStyle = 'rgba(255,255,255,0.7)';
      for(let k = -1; k <= 1; k++){
        const o = k * 28 + ((G.rt * 40) % 28);
        c.beginPath(); c.moveTo(o + 12, 0); c.lineTo(o - 6, -14); c.lineTo(o - 1, 0); c.lineTo(o - 6, 14); c.fill();
      }
      c.restore();
    }
  },
  trail(c){
    const tr = G.trail;
    if(tr.length < 2) return;
    const sk = RANGS.find(r => r.id === S.rang) || RANGS[0];
    c.lineCap = 'round';
    for(let i = 1; i < tr.length; i++){
      const k = i / tr.length, a = tr[i - 1], b = tr[i];
      c.strokeStyle = sk.trail === 'rainbow' ? `hsl(${(i * 9 + G.rt * 300) % 360},95%,62%)` : (i % 2 ? sk.trail[0] : sk.trail[1]);
      c.globalAlpha = k * 0.85;
      c.lineWidth = 4 + k * (b.h ? 30 : 20);
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
    c.globalAlpha = 1;
  },
  rang(c, b){
    const sk = RANGS.find(r => r.id === S.rang) || RANGS[0];
    if(b.ghost){ c.globalAlpha = 0.55; }
    c.save(); c.translate(b.x, b.y); c.rotate(b.spin * 3);
    drawRang(c, sk, 1.7);
    c.restore();
    c.globalAlpha = 1;
    if(G.holding && b.ph === 0){
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 3;
      c.beginPath(); c.arc(b.x, b.y, 40 + Math.sin(G.rt * 30) * 3, 0, TAU); c.stroke();
    }
  },
  particles(c){
    for(const p of G.parts){
      const k = 1 - p.life / p.max;
      c.globalAlpha = Math.min(1, k * 1.5);
      c.fillStyle = p.c;
      if(p.k === 1){
        c.strokeStyle = p.c; c.lineWidth = 6 * k;
        c.beginPath(); c.arc(p.x, p.y, 20 + (1 - k) * 70, 0, TAU); c.stroke();
      }else if(p.k === 2 || p.k === 3){
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        c.fillRect(-p.sz, -p.sz / 2, p.sz * 2, p.sz);
        c.restore();
      }else{
        c.beginPath(); c.arc(p.x, p.y, p.sz * k, 0, TAU); c.fill();
      }
    }
    c.globalAlpha = 1;
  },
  texts(c){
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for(const t of G.texts){
      const k = t.life / t.max, pop = Math.min(1, t.life * 8), sc = t.size * (0.6 + easeBack(pop) * 0.4);
      c.save(); c.translate(t.x, t.y); this.upright(c); c.scale(sc, sc);
      c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      c.font = '900 50px ' + FONT;
      c.lineWidth = 9; c.strokeStyle = 'rgba(40,20,70,0.85)'; c.lineJoin = 'round';
      c.strokeText(t.txt, 0, 0);
      c.fillStyle = t.col; c.fillText(t.txt, 0, 0);
      c.restore();
    }
    c.globalAlpha = 1;
  },
  tutHand(c, L){
    const h = handOf(L), hs = this.toScreen(h.x, h.y);
    const t = (G.tutT % 2.2) / 2.2;
    const dir = this.V.port ? { x: -0.35, y: 1 } : { x: -1, y: 0.45 };
    const l = Math.hypot(dir.x, dir.y), d = Math.min(this.W, this.H) * 0.22 * clamp((t - 0.15) / 0.5, 0, 1);
    const x = hs.x + 30 + dir.x / l * d, y = hs.y + 40 + dir.y / l * d;
    const a = t > 0.8 ? 1 - (t - 0.8) / 0.2 : Math.min(1, t * 6);
    c.globalAlpha = a;
    c.fillStyle = '#ffffff'; c.strokeStyle = '#2b1d55'; c.lineWidth = 4;
    c.beginPath(); c.arc(x, y, t > 0.12 && t < 0.72 ? 16 : 22, 0, TAU); c.fill(); c.stroke();
    if(t > 0.15 && t < 0.72){
      c.setLineDash([6, 8]); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(hs.x + 30, hs.y + 40); c.lineTo(x, y); c.stroke(); c.setLineDash([]);
    }
    c.globalAlpha = 1;
  }
};

/* ============ shared drawing helpers (also used by the thumbnail) ============ */
const FONT = '"Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
function easeBack(t){ const s = 1.9; t -= 1; return t * t * ((s + 1) * t + s) + 1; }
function rrect(c, x, y, w, h, r){
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function shade(hex, k){
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  if(k < 0){ r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
function cloud(c, x, y, s){
  c.beginPath();
  c.ellipse(x, y, s, s * 0.45, 0, 0, TAU);
  c.ellipse(x - s * 0.5, y + s * 0.08, s * 0.5, s * 0.35, 0, 0, TAU);
  c.ellipse(x + s * 0.45, y + s * 0.05, s * 0.55, s * 0.38, 0, 0, TAU);
  c.ellipse(x - s * 0.1, y - s * 0.25, s * 0.5, s * 0.42, 0, 0, TAU);
  c.fill();
}
function paintSky(b, W, H, wd, gold, seed){
  const g = b.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, gold ? '#ffb13a' : wd.sky[0]); g.addColorStop(1, gold ? '#fff1b8' : wd.sky[1]);
  b.fillStyle = g; b.fillRect(0, 0, W, H);
  const sun = b.createRadialGradient(W * 0.82, H * 0.16, 0, W * 0.82, H * 0.16, Math.max(W, H) * 0.45);
  sun.addColorStop(0, 'rgba(255,255,230,0.75)'); sun.addColorStop(1, 'rgba(255,255,230,0)');
  b.fillStyle = sun; b.fillRect(0, 0, W, H);
  const hills = (base, amp, col, f, ph) => {
    b.fillStyle = col; b.beginPath(); b.moveTo(0, H);
    for(let x = 0; x <= W + 20; x += 20) b.lineTo(x, base + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.3 + ph * 2) * amp * 0.4);
    b.lineTo(W, H); b.fill();
  };
  hills(H * 0.74, H * 0.05, wd.hill[0], 0.006, seed);
  hills(H * 0.86, H * 0.035, wd.hill[1], 0.009, seed * 2);
}
function drawRoo(c, t, hat, look, arm, heldRang, cheer){
  const bob = Math.sin(t * 3) * 2 + (cheer ? -Math.abs(Math.sin(t * 9)) * 16 : 0);
  // tail
  c.fillStyle = '#d97c3b';
  c.beginPath(); c.moveTo(-18, -22 + bob); c.quadraticCurveTo(-70, -16, -84, 0); c.quadraticCurveTo(-58, 2, -14, -6 + bob); c.closePath(); c.fill();
  // feet
  c.fillStyle = '#b8622c';
  c.beginPath(); c.ellipse(-4, -5, 28, 9, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(20, -4, 22, 8, 0, 0, TAU); c.fill();
  // haunch + body
  c.fillStyle = '#e58a45';
  c.beginPath(); c.ellipse(-6, -28 + bob * 0.5, 25, 23, 0, 0, TAU); c.fill();
  c.fillStyle = '#f39c52';
  c.beginPath(); c.ellipse(4, -56 + bob, 29, 36, 0.08, 0, TAU); c.fill();
  c.fillStyle = '#ffe2b8';
  c.beginPath(); c.ellipse(12, -50 + bob, 16, 25, 0.1, 0, TAU); c.fill();
  // head
  const hx = 12, hy = -104 + bob;
  const ear = (x, y, r, rot) => {
    c.save(); c.translate(x, y); c.rotate(rot + Math.sin(t * 2.3 + x) * 0.05);
    c.fillStyle = '#e58a45'; c.beginPath(); c.ellipse(0, 0, 9, 24, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffb3a3'; c.beginPath(); c.ellipse(0, 3, 4.5, 16, 0, 0, TAU); c.fill();
    c.restore();
  };
  ear(hx - 14, hy - 30, 9, -0.35);
  ear(hx + 4, hy - 34, 9, 0.12);
  c.fillStyle = '#f39c52'; c.beginPath(); c.arc(hx, hy, 27, 0, TAU); c.fill();
  c.fillStyle = '#ffe2b8'; c.beginPath(); c.ellipse(hx + 19, hy + 9, 17, 12, 0, 0, TAU); c.fill();
  c.fillStyle = '#4a2a1a'; c.beginPath(); c.ellipse(hx + 33, hy + 4, 6.5, 5, 0, 0, TAU); c.fill();
  c.strokeStyle = '#4a2a1a'; c.lineWidth = 2.5; c.lineCap = 'round';
  c.beginPath(); c.arc(hx + 24, hy + 13, 7, 0.2, cheer ? 2.6 : 1.9); c.stroke();
  const lx = Math.cos(look) * 3, ly = Math.sin(look) * 3;
  const blink = (t % 3.7) > 3.55;
  for(const [ex, ey, rx, ry] of [[hx + 4, hy - 7, 8, 10], [hx + 20, hy - 8, 7, 9]]){
    c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(ex, ey, rx, blink ? 1.5 : ry, 0, 0, TAU); c.fill();
    if(!blink){
      c.fillStyle = '#2a1a12'; c.beginPath(); c.arc(ex + lx, ey + ly, 4.6, 0, TAU); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(ex + lx + 1.5, ey + ly - 1.8, 1.6, 0, TAU); c.fill();
    }
  }
  c.fillStyle = 'rgba(255,100,120,0.45)'; c.beginPath(); c.ellipse(hx + 6, hy + 11, 6, 3.6, 0, 0, TAU); c.fill();
  drawHat(c, hat, hx, hy, t);
  // arm
  const sx = 8, sy = -70 + bob, ex = sx + Math.cos(arm) * 32, ey = sy + Math.sin(arm) * 32;
  c.strokeStyle = '#e07f3c'; c.lineWidth = 12; c.lineCap = 'round';
  c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
  if(heldRang){
    c.save(); c.translate(ex, ey); c.rotate(arm + 1.2);
    drawRang(c, RANGS.find(r => r.id === heldRang) || RANGS[0], 1);
    c.restore();
  }
  c.fillStyle = '#f39c52'; c.beginPath(); c.arc(ex, ey, 7.5, 0, TAU); c.fill();
}
function drawHat(c, hat, hx, hy, t){
  c.save(); c.translate(hx, hy - 22);
  switch(hat){
    case 'cap':
      c.fillStyle = '#e8413a'; c.beginPath(); c.arc(0, 4, 22, Math.PI, 0); c.fill();
      c.fillRect(0, 0, 36, 7); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -16, 4, 0, TAU); c.fill(); break;
    case 'flower':
      for(let i = 0; i < 6; i++){ c.fillStyle = '#ff7fbf'; c.beginPath(); c.arc(Math.cos(i) * 9 - 12, Math.sin(i) * 9 - 2, 7, 0, TAU); c.fill(); }
      c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(-12, -2, 6, 0, TAU); c.fill(); break;
    case 'phones':
      c.strokeStyle = '#2b2b3a'; c.lineWidth = 6; c.beginPath(); c.arc(0, 18, 30, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      c.fillStyle = '#ff4f8b'; c.beginPath(); c.ellipse(-27, 16, 8, 12, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(27, 16, 8, 12, 0, 0, TAU); c.fill(); break;
    case 'pirate':
      c.fillStyle = '#23233a'; c.beginPath(); c.moveTo(-32, 6); c.quadraticCurveTo(0, -40, 32, 6); c.quadraticCurveTo(0, -4, -32, 6); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -8, 5, 0, TAU); c.fill(); break;
    case 'wizard':
      c.fillStyle = '#5a3fd8'; c.beginPath(); c.moveTo(-26, 6); c.lineTo(8, -54); c.lineTo(26, 6); c.closePath(); c.fill();
      c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(4, -20, 4, 0, TAU); c.arc(-8, -2, 3, 0, TAU); c.fill(); break;
    case 'crown':
      c.fillStyle = '#ffd23a'; c.beginPath(); c.moveTo(-20, 6); c.lineTo(-22, -18); c.lineTo(-10, -6); c.lineTo(0, -24); c.lineTo(10, -6); c.lineTo(22, -18); c.lineTo(20, 6); c.closePath(); c.fill();
      c.fillStyle = '#ff4f8b'; c.beginPath(); c.arc(0, -2, 4, 0, TAU); c.fill(); break;
    case 'halo':
      c.strokeStyle = '#ffe98a'; c.lineWidth = 5; c.beginPath(); c.ellipse(0, -18 + Math.sin(t * 3) * 3, 22, 7, 0, 0, TAU); c.stroke(); break;
  }
  c.restore();
}
function drawRang(c, sk, s){
  c.save(); c.scale(s, s);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const path = () => { c.beginPath(); c.moveTo(24, 5); c.lineTo(0, 0); c.lineTo(-8, 23); };
  c.strokeStyle = '#2f1d4a'; c.lineWidth = 15; path(); c.stroke();
  c.strokeStyle = sk.c1; c.lineWidth = 10; path(); c.stroke();
  c.strokeStyle = sk.c2; c.lineWidth = 3; path(); c.stroke();
  c.restore();
}
function drawGem(c, col, t){
  c.globalAlpha = 0.28; c.fillStyle = col;
  c.beginPath(); c.arc(0, 0, 34 + Math.sin(t * 4) * 3, 0, TAU); c.fill();
  c.globalAlpha = 1;
  const pts = [[-17, -8], [-8, -19], [8, -19], [17, -8], [0, 21]];
  c.fillStyle = col; c.strokeStyle = '#2f1d4a'; c.lineWidth = 4; c.lineJoin = 'round';
  c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.beginPath(); c.moveTo(-8, -19); c.lineTo(8, -19); c.lineTo(4, -8); c.lineTo(-4, -8); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.beginPath(); c.moveTo(4, -8); c.lineTo(17, -8); c.lineTo(0, 21); c.closePath(); c.fill();
  const tw = Math.max(0, Math.sin(t * 2.2)) ;
  if(tw > 0.6){
    c.fillStyle = '#fff'; c.save(); c.translate(-9, -12); c.scale(tw, tw);
    c.beginPath(); c.moveTo(0, -8); c.lineTo(2, -2); c.lineTo(8, 0); c.lineTo(2, 2); c.lineTo(0, 8); c.lineTo(-2, 2); c.lineTo(-8, 0); c.lineTo(-2, -2); c.fill();
    c.restore();
  }
}
function drawStar(c, r, t){
  c.globalAlpha = 0.3; c.fillStyle = '#ffe14d';
  c.beginPath(); c.arc(0, 0, r * 1.4 + Math.sin(t * 5) * 3, 0, TAU); c.fill(); c.globalAlpha = 1;
  c.fillStyle = '#ffd23a'; c.strokeStyle = '#8a4b00'; c.lineWidth = 4; c.lineJoin = 'round';
  c.beginPath();
  for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#2f1d4a';
  c.beginPath(); c.arc(-6, -2, 2.6, 0, TAU); c.arc(6, -2, 2.6, 0, TAU); c.fill();
}
function drawSpiky(c, r, t){
  const n = 10;
  c.fillStyle = '#5a2ea8';
  c.beginPath();
  for(let i = 0; i < n * 2; i++){ const a = i * Math.PI / n + t * 0.8, rr = i % 2 ? r * 0.82 : r * 1.3; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fill();
  c.fillStyle = '#8a4dff'; c.beginPath(); c.arc(0, 0, r * 0.86, 0, TAU); c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.ellipse(-r * 0.3, -r * 0.08, r * 0.2, r * 0.24, 0, 0, TAU); c.ellipse(r * 0.3, -r * 0.08, r * 0.2, r * 0.24, 0, 0, TAU); c.fill();
  c.fillStyle = '#1b0f33';
  c.beginPath(); c.arc(-r * 0.27, -r * 0.02, r * 0.1, 0, TAU); c.arc(r * 0.27, -r * 0.02, r * 0.1, 0, TAU); c.fill();
  c.strokeStyle = '#1b0f33'; c.lineWidth = Math.max(2, r * 0.1); c.lineCap = 'round';
  c.beginPath(); c.moveTo(-r * 0.5, -r * 0.4); c.lineTo(-r * 0.12, -r * 0.26); c.moveTo(r * 0.5, -r * 0.4); c.lineTo(r * 0.12, -r * 0.26); c.stroke();
}
function drawSaw(c, r){
  c.fillStyle = '#c9d3de'; c.strokeStyle = '#3a4250'; c.lineWidth = 3;
  c.beginPath();
  for(let i = 0; i < 24; i++){ const a = i * TAU / 24, rr = i % 2 ? r * 0.9 : r * 1.22; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#8994a3'; c.beginPath(); c.arc(0, 0, r * 0.55, 0, TAU); c.fill();
  c.fillStyle = '#ff4f5a'; c.beginPath(); c.arc(0, 0, r * 0.22, 0, TAU); c.fill();
}
function drawBumper(c, r, k){
  const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#ffd6f4'); g.addColorStop(1, k > 0.3 ? '#ff4fb8' : '#ff7ad0');
  c.fillStyle = g; c.strokeStyle = '#a2317c'; c.lineWidth = 5;
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(-r * 0.35, -r * 0.4, r * 0.25, r * 0.14, -0.6, 0, TAU); c.fill();
  c.strokeStyle = '#5a1646'; c.lineWidth = 4; c.lineCap = 'round';
  if(k > 0.3){ c.beginPath(); c.moveTo(-r * 0.4, -r * 0.1); c.lineTo(-r * 0.15, 0); c.moveTo(r * 0.4, -r * 0.1); c.lineTo(r * 0.15, 0); c.stroke(); }
  else{ c.beginPath(); c.arc(-r * 0.27, 0, r * 0.12, Math.PI, 0); c.moveTo(r * 0.39, 0); c.arc(r * 0.27, 0, r * 0.12, 0, Math.PI, true); c.stroke(); }
  c.beginPath(); c.arc(0, r * 0.22, r * 0.18, 0.1, Math.PI - 0.1); c.stroke();
}
function drawPortal(c, x, y, col, t){
  c.save(); c.translate(x, y);
  const g = c.createRadialGradient(0, 0, 4, 0, 0, P.portR);
  g.addColorStop(0, '#140a30'); g.addColorStop(0.7, '#2a1660'); g.addColorStop(1, col);
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, P.portR, 0, TAU); c.fill();
  c.strokeStyle = col; c.lineWidth = 5; c.lineCap = 'round';
  for(let i = 0; i < 3; i++){
    c.beginPath(); c.arc(0, 0, P.portR * (0.45 + i * 0.22), t * (2 + i) + i * 2, t * (2 + i) + i * 2 + 2.2); c.stroke();
  }
  c.restore();
}

/* ============ THE THUMBNAIL SCENE ============
   Drawn by the game itself so Poki's thumbnail, the animated thumbnail and
   the first frame of the game are the same picture. t=0 is the still.
   The animation loops seamlessly every 5 seconds. */
const THUMB_T = 5;
function drawThumb(c, W, H, t){
  const u = Math.min(W, H) / 1000, ox = (W - 1000 * u) / 2, oy = (H - 1000 * u) / 2;
  const w = TAU / THUMB_T;
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2aa9ff'); g.addColorStop(0.7, '#9fe4ff'); g.addColorStop(1, '#d9f7ff');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.translate(ox, oy); c.scale(u, u);
  const L0 = -ox / u, R0 = (W - ox) / u, B0 = (H - oy) / u, T0 = -oy / u;
  // glow behind the loop
  const cx = 560, cy = 420, R = 292;
  const gl = c.createRadialGradient(cx, cy, 40, cx, cy, 520);
  gl.addColorStop(0, 'rgba(255,255,220,0.95)'); gl.addColorStop(0.45, 'rgba(255,245,200,0.35)'); gl.addColorStop(1, 'rgba(255,245,200,0)');
  c.fillStyle = gl; c.fillRect(L0, T0, R0 - L0, B0 - T0);
  // sun rays
  c.save(); c.translate(cx, cy); c.rotate(t * w * 0.25);
  c.fillStyle = 'rgba(255,255,255,0.16)';
  for(let i = 0; i < 12; i++){ c.rotate(TAU / 12); c.beginPath(); c.moveTo(0, 0); c.lineTo(900, -70); c.lineTo(900, 70); c.fill(); }
  c.restore();
  // clouds
  c.fillStyle = 'rgba(255,255,255,0.9)';
  cloud(c, 130 + Math.sin(t * w) * 8, 150, 80);
  cloud(c, 900 + Math.sin(t * w + 2) * 10, 110, 60);
  cloud(c, L0 + 60, 330, 70); cloud(c, R0 - 40, 380, 90);
  // hills
  const hills = (base, amp, col, f, ph) => {
    c.fillStyle = col; c.beginPath(); c.moveTo(L0, B0 + 10);
    for(let x = L0; x <= R0 + 20; x += 20) c.lineTo(x, base + Math.sin(x * f + ph) * amp);
    c.lineTo(R0 + 20, B0 + 10); c.closePath(); c.fill();
  };
  hills(800, 30, '#8fdc62', 0.008, 1);
  hills(890, 22, '#5fbf4a', 0.012, 3);
  // spiky danger
  c.save(); c.translate(870, 170 + Math.sin(t * w * 2) * 10); drawSpiky(c, 44, t * w); c.restore();
  // Roo's island + Roo
  const rx = 265, ry = 830;
  c.save(); c.translate(rx, ry);
  c.fillStyle = '#3f9a38'; c.beginPath(); c.moveTo(-170, 10); c.quadraticCurveTo(-80, 150, 0, 160); c.quadraticCurveTo(80, 150, 170, 10); c.closePath(); c.fill();
  c.fillStyle = '#6fcf52'; c.beginPath(); c.ellipse(0, 10, 175, 34, 0, 0, TAU); c.fill();
  c.fillStyle = '#a5ec7c'; c.beginPath(); c.ellipse(-20, 2, 120, 14, 0, 0, TAU); c.fill();
  c.restore();
  // the loop
  const th0 = 5.62, hand = 2.48;                      // rang angle at t=0, angle where the loop meets Roo's paw
  const ph = th0 + t * w * 2;                         // two loops per 5 s
  const at = a => ({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R });
  // rainbow ribbon trail
  c.lineCap = 'round';
  const N = 46, span = 2.9;
  for(let i = 1; i <= N; i++){
    const k = i / N, a0 = ph - span * (1 - (i - 1) / N), a1 = ph - span * (1 - k);
    const p0 = at(a0), p1 = at(a1);
    c.strokeStyle = `hsl(${(i * 8 + 330) % 360},95%,60%)`; c.globalAlpha = 0.25 + k * 0.75;
    c.lineWidth = 8 + k * 34;
    c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.stroke();
  }
  c.globalAlpha = 1;
  // gems around the loop: collected as the rang passes, pop back in behind it
  const gemA = [0.3, 0.95, 1.55, 3.55, 4.25, 4.95], cols = ['#ff4f8b', '#3ad8ff', '#4dffb0', '#ffe14d', '#b98cff', '#ff8a3a'];
  gemA.forEach((ga, i) => {
    const since = ((ph - ga) % TAU + TAU) % TAU;
    const p = at(ga);
    if(since < 0.35){
      // just collected: sparkle burst
      const k = since / 0.35;
      c.strokeStyle = '#fff'; c.lineWidth = 8 * (1 - k); c.globalAlpha = 1 - k;
      c.beginPath(); c.arc(p.x, p.y, 20 + k * 70, 0, TAU); c.stroke(); c.globalAlpha = 1;
      return;
    }
    const sc = since < 1.6 ? 0 : since < 2.0 ? easeBack((since - 1.6) / 0.4) : 1;
    if(sc <= 0) return;
    c.save(); c.translate(p.x, p.y + Math.sin(t * w * 3 + i) * 5); c.scale(1.7 * sc, 1.7 * sc); drawGem(c, cols[i], t * w * 2 + i); c.restore();
  });
  // bonus star inside the loop
  c.save(); c.translate(560, 430 + Math.sin(t * w * 2) * 8); c.rotate(Math.sin(t * w * 2) * 0.15); drawStar(c, 52, t * w * 2); c.restore();
  // Roo (looks at the rang, flicks the paw when it passes)
  const r = at(ph), pass = Math.abs(angDiff(ph % TAU, hand));
  const look = Math.atan2(r.y - (ry - 260), r.x - rx);
  const arm = pass < 0.5 ? lerp(-2.4, -0.3, pass / 0.5) : look - 0.2;
  c.save(); c.translate(rx, ry); c.scale(2.75, 2.75);
  drawRoo(c, t * w * 2, 'none', look, arm, null, false);
  c.restore();
  // the boomerang itself, big, with speed lines
  c.save(); c.translate(r.x, r.y);
  c.globalAlpha = 0.6; c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(0, 0, 70, 0, TAU); c.fill(); c.globalAlpha = 1;
  c.rotate(t * w * 20); drawRang(c, RANGS[6], 3.3); c.restore();
  // sparkles
  for(let i = 0; i < 9; i++){
    const a = i * 0.7 + t * w, x = 180 + ((i * 263) % 700), y = 90 + ((i * 181) % 600), k = Math.max(0, Math.sin(a * 2));
    c.fillStyle = '#ffffff'; c.save(); c.translate(x, y); c.scale(k * 1.6, k * 1.6);
    c.beginPath(); c.moveTo(0, -10); c.lineTo(2.5, -2.5); c.lineTo(10, 0); c.lineTo(2.5, 2.5); c.lineTo(0, 10); c.lineTo(-2.5, 2.5); c.lineTo(-10, 0); c.lineTo(-2.5, -2.5); c.fill();
    c.restore();
  }
  c.restore();
}
