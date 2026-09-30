'use strict';
/* Canvas renderer: everything looks drawn with markers on paper. */
const R = {
  cv: null, c: null, W: 0, H: 0, dpr: 1, s: 1, ox: 0,
  init(){ this.cv = $('cv'); this.c = this.cv.getContext('2d'); this.resize(); addEventListener('resize', () => this.resize()); },
  resize(){
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.W = innerWidth; this.H = innerHeight;
    this.cv.width = Math.round(this.W * this.dpr); this.cv.height = Math.round(this.H * this.dpr);
    this.s = Math.min(this.W / (WW + 30), this.H / 840);
    this.ox = (this.W - WW * this.s) / 2;
    G.viewH = this.H / this.s;
  },
  toWorld(sx, sy){ return { x: (sx - this.ox) / this.s, y: G.camY + sy / this.s }; },

  draw(){
    const c = this.c, d = this.dpr, s = this.s, W = this.W, H = this.H;
    const wd = worldAt(depthM());
    c.setTransform(d, 0, 0, d, 0, 0);
    // desk around the page
    c.fillStyle = wd.dark ? '#07060f' : '#d9cdb4'; c.fillRect(0, 0, W, H);
    const sh = save.opt.shake ? G.shake : 0, jx = (Math.random() - 0.5) * sh, jy = (Math.random() - 0.5) * sh;
    c.setTransform(s * d, 0, 0, s * d, (this.ox + jx) * d, (-G.camY * s + jy) * d);
    const y0 = G.camY - 40, y1 = G.camY + G.viewH + 40;
    this.page(c, wd, y0, y1);
    this.solids(c, wd);
    this.pegs(c);
    this.items(c);
    this.hazards(c, wd);
    this.strokes(c);
    this.balls(c);
    this.fx(c);
    this.flood(c, wd);
    c.setTransform(d, 0, 0, d, 0, 0);
    // flood warning + power tints
    const mb = mainBall();
    if(mb && G.state === 'play'){
      const gap = G.doom - mb.y;
      if(gap < 400){ const a = (1 - gap / 400) * (0.35 + Math.sin(G.t * 12) * 0.12); const g = c.createLinearGradient(0, H, 0, H * 0.5); g.addColorStop(0, `rgba(255,40,60,${a})`); g.addColorStop(1, 'rgba(255,40,60,0)'); c.fillStyle = g; c.fillRect(0, H * 0.5, W, H * 0.5); }
    }
    if(G.pw.slow){ c.fillStyle = 'rgba(77,208,255,0.12)'; c.fillRect(0, 0, W, H); }
    if(G.pw.rocket){ c.fillStyle = `rgba(255,225,77,${0.1 + Math.sin(G.t * 30) * 0.05})`; c.fillRect(0, 0, W, H); }
    if(G.flash > 0){ c.globalAlpha = G.flash * 0.6; c.fillStyle = G.flashC; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  },
  page(c, wd, y0, y1){
    c.fillStyle = wd.bg; c.fillRect(-2000, y0, WW + 4000, y1 - y0);
    // a darker "outside the page" area
    c.fillStyle = wd.dark ? 'rgba(0,0,0,0.35)' : 'rgba(120,90,50,0.12)';
    c.fillRect(-2000, y0, 2000, y1 - y0); c.fillRect(WW, y0, 2000, y1 - y0);
    c.lineWidth = 2; c.strokeStyle = wd.rule;
    const st = Math.floor(y0 / 50) * 50;
    if(wd.grid === 'lines' || wd.grid === 'grid'){ c.beginPath(); for(let y = st; y < y1; y += 50){ c.moveTo(0, y); c.lineTo(WW, y); } c.stroke(); }
    if(wd.grid === 'grid'){ c.beginPath(); for(let x = 0; x <= WW; x += 50){ c.moveTo(x, y0); c.lineTo(x, y1); } c.stroke(); }
    if(wd.grid === 'dots'){ c.fillStyle = wd.rule; for(let y = st; y < y1; y += 40) for(let x = 20; x < WW; x += 40){ c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); } }
    if(wd.grid === 'stars'){ for(let y = st; y < y1; y += 50){ for(let k = 0; k < 3; k++){ const x = ((y * 13 + k * 271) % WW + WW) % WW, tw = 0.4 + 0.6 * Math.abs(Math.sin(y * 0.1 + k + G.t)); c.fillStyle = `rgba(255,255,255,${tw})`; c.fillRect(x, y + k * 13, 3, 3); } } }
    this.sideDoodles(c, wd, y0, y1);
    c.strokeStyle = wd.margin; c.lineWidth = 3;
    c.beginPath(); c.moveTo(70, y0); c.lineTo(70, y1); c.stroke();
    if(wd.name === 'Notebook'){ c.fillStyle = '#d9cdb4'; for(let y = Math.floor(y0 / 160) * 160; y < y1; y += 160){ c.beginPath(); c.arc(28, y + 80, 11, 0, TAU); c.fill(); } }
    // depth ruler on the right edge
    c.fillStyle = wd.dark ? 'rgba(255,255,255,0.45)' : 'rgba(40,40,80,0.4)'; c.font = '900 20px ' + FONT; c.textAlign = 'right';
    const mst = Math.floor(y0 / (M * 50)) * M * 50;
    for(let y = mst; y < y1; y += M * 50){ if(y < 0){ c.fillText(Math.round(-y / M) + 'm', WW - 10, y - 4); c.fillRect(WW - 40, y, 36, 3); } }
    // best line
    if(save.best > 20 && G.state !== 'title'){
      const by = G.startY - save.best * M;
      if(by > y0 && by < y1){
        c.strokeStyle = '#ffb13a'; c.lineWidth = 5; c.setLineDash([18, 12]);
        c.beginPath(); c.moveTo(0, by); c.lineTo(WW, by); c.stroke(); c.setLineDash([]);
        c.fillStyle = '#ffb13a'; c.textAlign = 'left'; c.fillText('🏆 BEST ' + Math.round(save.best) + 'm', 84, by - 8);
      }
    }
  },
  /* big faint doodles on the desk beside the page, with a little parallax */
  sideDoodles(c, wd, y0, y1){
    const side = (this.W / this.s - WW) / 2;
    if(side < 80) return;
    const par = 0.6, cy = G.camY * (1 - par);
    c.save(); c.translate(0, cy);
    c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
    const col = wd.dark ? 'rgba(255,255,255,0.14)' : 'rgba(43,42,74,0.14)';
    c.strokeStyle = col; c.fillStyle = col;
    const a0 = Math.floor((y0 - cy) / 260) - 1, a1 = Math.ceil((y1 - cy) / 260) + 1;
    for(let k = a0; k <= a1; k++){
      for(const left of [true, false]){
        const h = Math.abs(Math.sin(k * 12.9898 + (left ? 1 : 7)) * 43758.5453) % 1;
        const x = left ? -side * (0.25 + h * 0.5) : WW + side * (0.25 + h * 0.5), y = k * 260 + h * 120, sz = 30 + h * 30;
        const kind = Math.floor(h * 7);
        c.save(); c.translate(x, y); c.rotate((h - 0.5) * 0.8);
        c.beginPath();
        if(kind === 0){ for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? sz * 0.45 : sz; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); }
        else if(kind === 1){ for(let a = 0; a < 14; a += 0.3) c.lineTo(Math.cos(a) * a * sz / 14, Math.sin(a) * a * sz / 14); }
        else if(kind === 2){ c.moveTo(0, sz * 0.6); c.bezierCurveTo(-sz * 1.2, -sz * 0.2, -sz * 0.4, -sz, 0, -sz * 0.3); c.bezierCurveTo(sz * 0.4, -sz, sz * 1.2, -sz * 0.2, 0, sz * 0.6); }
        else if(kind === 3){ c.moveTo(-sz, 0); c.lineTo(sz, 0); c.moveTo(sz * 0.4, -sz * 0.5); c.lineTo(sz, 0); c.lineTo(sz * 0.4, sz * 0.5); }
        else if(kind === 4){ c.ellipse(0, 0, sz, sz * 0.55, 0, 0, TAU); c.moveTo(sz * 0.3, -sz * 0.9); c.arc(0, -sz * 0.9, sz * 0.3, 0, TAU); }
        else if(kind === 5){ c.moveTo(-sz, sz * 0.3); for(let i = 0; i < 6; i++) c.quadraticCurveTo(-sz + (i + 0.5) * sz / 3, sz * (i % 2 ? 0.9 : -0.3), -sz + (i + 1) * sz / 3, sz * 0.3); }
        else { c.moveTo(0, -sz); c.lineTo(sz * 0.35, sz * 0.6); c.lineTo(0, sz * 0.35); c.lineTo(-sz * 0.35, sz * 0.6); c.closePath(); c.moveTo(-sz * 0.2, sz * 0.75); c.lineTo(0, sz * 1.2); c.lineTo(sz * 0.2, sz * 0.75); }
        c.stroke();
        c.restore();
      }
    }
    c.restore();
  },
  solids(c, wd){
    c.lineCap = 'round';
    for(const s of G.solids){
      if(s.pad){
        const k = s.boing ? (s.boing = Math.max(0, s.boing - 0.05)) : 0;
        c.strokeStyle = '#1f9a4a'; c.lineWidth = 16; c.beginPath(); c.moveTo(s.ax, s.ay + k * 10); c.lineTo(s.bx, s.by + k * 10); c.stroke();
        c.strokeStyle = '#7dff8a'; c.lineWidth = 8; c.beginPath(); c.moveTo(s.ax, s.ay + k * 10); c.lineTo(s.bx, s.by + k * 10); c.stroke();
        c.fillStyle = '#1f9a4a'; c.fillRect(s.ax + 8, s.ay + 8, 8, 26); c.fillRect(s.bx - 16, s.by + 8, 8, 26);
      }else{
        c.strokeStyle = wd.dark ? '#8a86c8' : '#6a5a48'; c.lineWidth = 14;
        c.beginPath(); c.moveTo(s.ax, s.ay); c.lineTo(s.bx, s.by); c.stroke();
        c.strokeStyle = wd.dark ? '#c8c4ff' : '#b99a78'; c.lineWidth = 6;
        c.beginPath(); c.moveTo(s.ax, s.ay); c.lineTo(s.bx, s.by); c.stroke();
      }
    }
  },
  pegs(c){
    for(const p of G.pegs){
      const k = p.hit ? Math.min(1, p.hit) : 0;
      c.globalAlpha = 1 - k;
      const col = p.gold ? '#ffd23a' : `hsl(${p.hue},85%,62%)`;
      c.fillStyle = col; c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 3;
      c.beginPath(); c.arc(p.x, p.y, p.r * (1 + k * 1.5), 0, TAU); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(p.x - 4, p.y - 4, 3.5, 0, TAU); c.fill();
    }
    c.globalAlpha = 1;
  },
  items(c){
    const t = G.t;
    for(const it of G.items){
      if(it.dead) continue;
      if(it.y < G.camY - 80 || it.y > G.camY + G.viewH + 80) continue;
      if(it.k === 'star') drawStar(c, it.x, it.y + Math.sin(t * 3 + it.x) * 3, 17, t);
      else if(it.k === 'coin'){ const w = Math.abs(Math.cos(t * 3 + it.x)); c.fillStyle = '#ffc21a'; c.strokeStyle = '#8a5a00'; c.lineWidth = 3; c.beginPath(); c.ellipse(it.x, it.y, 13 * Math.max(0.25, w), 13, 0, 0, TAU); c.fill(); c.stroke(); }
      else if(it.k === 'gem'){ c.fillStyle = '#5ad2ff'; c.strokeStyle = '#1d5a8a'; c.lineWidth = 3; c.beginPath(); c.moveTo(it.x, it.y - 18); c.lineTo(it.x + 15, it.y - 4); c.lineTo(it.x, it.y + 18); c.lineTo(it.x - 15, it.y - 4); c.closePath(); c.fill(); c.stroke(); }
      else if(it.k === 'power'){
        const p = POWERS[it.p], y = it.y + Math.sin(t * 3 + it.bob) * 6;
        c.fillStyle = p.col; c.globalAlpha = 0.3; c.beginPath(); c.arc(it.x, y, 36 + Math.sin(t * 6) * 4, 0, TAU); c.fill(); c.globalAlpha = 1;
        c.fillStyle = '#ffffff'; c.strokeStyle = p.col; c.lineWidth = 5; c.beginPath(); c.arc(it.x, y, 25, 0, TAU); c.fill(); c.stroke();
        c.font = '28px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.icon, it.x, y + 1);
      }
      else if(it.k === 'card'){
        if(it.grp.taken) continue;
        const y = it.y + Math.sin(t * 2 + it.x) * 6, w = 150, h = 120;
        c.save(); c.translate(it.x, y); c.rotate(Math.sin(t * 1.5 + it.x) * 0.05);
        c.fillStyle = 'rgba(0,0,0,0.2)'; rrect(c, -w / 2 + 5, -h / 2 + 7, w, h, 16); c.fill();
        const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#fff7c2'); g.addColorStop(1, '#ffd24a');
        c.fillStyle = g; c.strokeStyle = '#8a5a00'; c.lineWidth = 4; rrect(c, -w / 2, -h / 2, w, h, 16); c.fill(); c.stroke();
        c.font = '40px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(it.c.icon, 0, -20);
        c.fillStyle = '#4a2a00'; c.font = '900 17px ' + FONT; c.fillText(it.c.name.toUpperCase(), 0, 26);
        c.font = '700 11px ' + FONT; c.fillText(it.c.desc, 0, 45);
        c.restore();
      }
    }
  },
  hazards(c, wd){
    const t = G.t;
    for(const h of G.haz){
      if(h.dead) continue;
      if(h.k === 'spike'){
        if(h.y1 < G.camY - 50 || h.y0 > G.camY + G.viewH + 50) continue;
        c.fillStyle = wd.hz; c.strokeStyle = wd.dark ? '#ffffff' : '#5a1010'; c.lineWidth = 3;
        const x0 = h.left ? 0 : WW, dir = h.left ? 1 : -1;
        c.beginPath(); c.moveTo(x0, h.y0);
        for(let y = h.y0; y < h.y1; y += 30){ c.lineTo(x0 + dir * 30, y + 15); c.lineTo(x0, y + 30); }
        c.closePath(); c.fill(); c.stroke();
        continue;
      }
      if(h.k === 'laser'){
        const on = !h.blink || ((t + h.ph) % 3) < 2, warn = h.blink && ((t + h.ph) % 3) > 2.6;
        c.lineCap = 'round';
        if(on){
          c.strokeStyle = wd.hz; c.lineWidth = 18; c.globalAlpha = 0.35; c.beginPath(); c.moveTo(h.a0, h.y); c.lineTo(h.a1, h.y); c.stroke();
          c.globalAlpha = 1; c.lineWidth = 8; c.setLineDash([22, 8]); c.lineDashOffset = -t * 80;
          c.beginPath(); c.moveTo(h.a0, h.y); c.lineTo(h.a1, h.y); c.stroke(); c.setLineDash([]);
        }else{
          c.strokeStyle = warn ? wd.hz : 'rgba(128,128,128,0.35)'; c.lineWidth = 3; c.setLineDash([6, 10]);
          c.beginPath(); c.moveTo(h.a0, h.y); c.lineTo(h.a1, h.y); c.stroke(); c.setLineDash([]);
        }
        continue;
      }
      if(h.y < G.camY - 100 || h.y > G.camY + G.viewH + 100) continue;
      if(h.k === 'saw'){
        c.strokeStyle = 'rgba(128,128,128,0.35)'; c.lineWidth = 3; c.setLineDash([8, 10]);
        c.beginPath(); c.moveTo(clamp(h.bx - h.amp, h.r, WW - h.r), h.y); c.lineTo(clamp(h.bx + h.amp, h.r, WW - h.r), h.y); c.stroke(); c.setLineDash([]);
        c.save(); c.translate(h.x, h.y); c.rotate(t * 8);
        c.fillStyle = wd.dark ? '#c8d3e0' : '#b8c2cc'; c.strokeStyle = wd.dark ? '#fff' : '#2b2a4a'; c.lineWidth = 3;
        c.beginPath(); for(let i = 0; i < 20; i++){ const a = i / 20 * TAU, r = i % 2 ? h.r * 0.82 : h.r * 1.12; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke();
        c.fillStyle = wd.hz; c.beginPath(); c.arc(0, 0, h.r * 0.28, 0, TAU); c.fill();
        c.restore();
      }else if(h.k === 'blob'){
        drawBlob(c, h, t, wd);
      }else if(h.k === 'bomb'){
        c.fillStyle = '#2b2a4a'; c.beginPath(); c.arc(h.x, h.y, h.r, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(h.x - 8, h.y - 8, 7, 0, TAU); c.fill();
        c.strokeStyle = '#8a5a3c'; c.lineWidth = 4; c.beginPath(); c.moveTo(h.x + 12, h.y - 20); c.quadraticCurveTo(h.x + 22, h.y - 34, h.x + 30, h.y - 30); c.stroke();
        c.fillStyle = Math.sin(t * 20) > 0 ? '#ffe14d' : '#ff6a2e'; c.beginPath(); c.arc(h.x + 30, h.y - 30, 5 + Math.random() * 2, 0, TAU); c.fill();
        c.fillStyle = '#ffe14d'; c.font = '900 14px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BOOM', h.x, h.y + 2);
      }
    }
  },
  strokes(c){
    c.lineCap = 'round'; c.lineJoin = 'round';
    for(const s of G.strokes){
      if(s.pts.length < 2) continue;
      const k = s.live ? 0 : Math.min(1, s.breakT / 0.25);
      if(k >= 1) continue;
      c.globalAlpha = 1 - k;
      const col = inkCol(s);
      c.strokeStyle = col; c.lineWidth = s.live ? 9 : 9 * (1 - k);
      if(s.rainbow || (worldAt(depthM()).glow)){ c.shadowColor = col; c.shadowBlur = 14; }
      c.beginPath(); c.moveTo(s.pts[0].x, s.pts[0].y);
      for(let i = 1; i < s.pts.length; i++) c.lineTo(s.pts[i].x, s.pts[i].y);
      c.stroke();
      c.shadowBlur = 0;
      // sketchy second pass
      c.lineWidth = 2; c.globalAlpha = (1 - k) * 0.5; c.strokeStyle = '#ffffff';
      c.beginPath(); c.moveTo(s.pts[0].x + 1, s.pts[0].y - 2);
      for(let i = 1; i < s.pts.length; i++) c.lineTo(s.pts[i].x + 1, s.pts[i].y - 2);
      c.stroke();
    }
    c.globalAlpha = 1;
  },
  balls(c){
    for(const b of G.balls){
      if(b.dead) continue;
      // trail
      const fire = G.pw.fire || G.pw.rocket;
      for(let i = 0; i < b.trail.length; i++){
        const p = b.trail[i], k = i / b.trail.length;
        c.globalAlpha = k * 0.35; c.fillStyle = fire ? (i % 2 ? '#ff6a2e' : '#ffe14d') : worldAt(depthM()).ink;
        c.beginPath(); c.arc(p.x, p.y, b.r * k * (fire ? 1.2 : 0.8), 0, TAU); c.fill();
      }
      c.globalAlpha = b.inv > 0 && Math.floor(G.t * 16) % 2 ? 0.4 : 1;
      drawBall(c, save.ball, b.x, b.y, b.r, b.spin, G.t);
      if(fire){ c.strokeStyle = '#ff6a2e'; c.lineWidth = 4; c.beginPath(); c.arc(b.x, b.y, b.r + 5 + Math.sin(G.t * 30) * 2, 0, TAU); c.stroke(); }
      if(b.shield){ c.strokeStyle = 'rgba(159,230,255,0.9)'; c.fillStyle = 'rgba(159,230,255,0.18)'; c.lineWidth = 3; c.beginPath(); c.arc(b.x, b.y, b.r + 12, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(b.x - b.r * 0.6, b.y - b.r * 0.7, 4, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
    }
  },
  fx(c){
    for(const r of G.rings){ const k = r.life / r.max; c.globalAlpha = 1 - k; c.strokeStyle = r.col; c.lineWidth = 6 * (1 - k); c.beginPath(); c.arc(r.x, r.y, r.r * (0.4 + k), 0, TAU); c.stroke(); }
    for(const p of G.parts){ const k = 1 - p.life / p.max; c.globalAlpha = Math.min(1, k * 1.5); c.fillStyle = p.c; if(p.sq) c.fillRect(p.x - p.sz, p.y - p.sz / 2, p.sz * 2, p.sz); else { c.beginPath(); c.arc(p.x, p.y, p.sz * k, 0, TAU); c.fill(); } }
    c.globalAlpha = 1;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    for(const t of G.texts){
      const k = t.life / t.max, pop = Math.min(1, t.life * 9), sc = t.size * (0.6 + easeBack(pop) * 0.4);
      c.save(); c.translate(t.x, t.y); c.scale(sc, sc);
      c.globalAlpha = t.stay ? 1 : k > 0.7 ? (1 - k) / 0.3 : 1;
      c.font = '900 30px ' + FONT; c.lineWidth = 7; c.strokeStyle = 'rgba(30,20,50,0.85)';
      c.strokeText(t.txt, 0, 0); c.fillStyle = t.col; c.fillText(t.txt, 0, 0);
      c.restore();
    }
    c.globalAlpha = 1;
  },
  flood(c, wd){
    // the ink flood rises from below
    const y = G.doom, t = G.t, bot = G.camY + G.viewH + 100;
    if(y > bot) return;
    const ink = wd.dark ? '#000000' : '#1c1638';
    c.fillStyle = ink;
    c.beginPath(); c.moveTo(-200, bot); c.lineTo(WW + 200, bot);
    for(let x = WW + 200; x >= -200; x -= 30) c.lineTo(x, y + Math.sin(x * 0.03 + t * 3) * 14 + Math.sin(x * 0.011 - t * 2) * 10);
    c.closePath(); c.fill();
    // splashes jumping off the surface + angry eyes
    for(let i = 0; i < 7; i++){ const x = (i * 113 + 40) % WW, k = ((t * 0.9 + i * 0.37) % 1), h = Math.sin(k * Math.PI) * 50; c.beginPath(); c.arc(x, y - h, 6 + (1 - k) * 4, 0, TAU); c.fill(); }
    for(let i = 0; i < 3; i++){
      const ex = 140 + i * 220 + Math.sin(t + i) * 30, ey = y + 60;
      if(ey > bot) continue;
      c.fillStyle = '#ff3a5a'; c.beginPath(); c.ellipse(ex - 14, ey, 9, 6, 0.3, 0, TAU); c.ellipse(ex + 14, ey, 9, 6, -0.3, 0, TAU); c.fill();
    }
  }
};

/* ============ drawing helpers ============ */
const FONT = '"Comic Sans MS","Chalkboard SE","Marker Felt","Arial Rounded MT Bold","Trebuchet MS",system-ui,sans-serif';
function easeBack(t){ const s = 1.9; t -= 1; return t * t * ((s + 1) * t + s) + 1; }
function rrect(c, x, y, w, h, r){ c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function drawStar(c, x, y, r, t){
  c.fillStyle = 'rgba(255,225,77,0.35)'; c.beginPath(); c.arc(x, y, r * 1.5, 0, TAU); c.fill();
  c.fillStyle = '#ffd23a'; c.strokeStyle = '#8a5a00'; c.lineWidth = 3; c.lineJoin = 'round';
  c.beginPath();
  for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5 + Math.sin(t * 2 + x) * 0.1, rr = i % 2 ? r * 0.48 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fill(); c.stroke();
}
function drawBlob(c, h, t, wd){
  const r = h.r, w = Math.sin(t * 4 + h.ph);
  c.save(); c.translate(h.x, h.y);
  c.fillStyle = wd.dark ? '#ff3a8a' : '#2b2a4a';
  c.beginPath();
  for(let i = 0; i <= 16; i++){ const a = i / 16 * TAU, rr = r * (1 + Math.sin(a * 3 + t * 5 + h.ph) * 0.1); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * (1 + w * 0.05)); }
  c.closePath(); c.fill();
  for(let i = 0; i < 3; i++){ c.beginPath(); c.ellipse(-r * 0.5 + i * r * 0.5, r * 0.9 + Math.sin(t * 3 + i) * 3, 5, 9, 0, 0, TAU); c.fill(); }
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-r * 0.32, -r * 0.15, r * 0.24, 0, TAU); c.arc(r * 0.32, -r * 0.15, r * 0.24, 0, TAU); c.fill();
  c.fillStyle = '#1b0f33'; c.beginPath(); c.arc(-r * 0.3, -r * 0.1, r * 0.11, 0, TAU); c.arc(r * 0.34, -r * 0.1, r * 0.11, 0, TAU); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(-r * 0.3, r * 0.35); c.lineTo(-r * 0.1, r * 0.25); c.lineTo(r * 0.1, r * 0.35); c.lineTo(r * 0.3, r * 0.25); c.stroke();
  c.restore();
}
function drawBall(c, id, x, y, r, spin, t){
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(0,0,0,0.15)'; c.beginPath(); c.ellipse(3, r * 0.9, r * 0.8, r * 0.25, 0, 0, TAU); c.fill();
  c.rotate(spin);
  const circ = (fill, stroke) => { c.fillStyle = fill; c.strokeStyle = stroke || '#2b2a4a'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke(); };
  if(id === 'marble'){
    const g = c.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#7fd8ff'); g.addColorStop(1, '#2a6fd8');
    circ(g); c.strokeStyle = '#ff5aa0'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, r * 0.55, 0.5, 2.6); c.stroke();
  }else if(id === 'eye'){
    circ('#ffffff'); c.fillStyle = '#3aa0ff'; c.beginPath(); c.arc(r * 0.2, 0, r * 0.5, 0, TAU); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(r * 0.25, 0, r * 0.25, 0, TAU); c.fill();
    c.strokeStyle = '#ff6b6b'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-r * 0.8, -r * 0.3); c.lineTo(-r * 0.4, -r * 0.1); c.moveTo(-r * 0.7, r * 0.4); c.lineTo(-r * 0.35, r * 0.15); c.stroke();
  }else if(id === 'hoop'){
    circ('#ff8a2e'); c.strokeStyle = '#2b2a4a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.moveTo(0, -r); c.lineTo(0, r); c.arc(-r * 1.3, 0, r, -0.7, 0.7); c.moveTo(r * 0.3 + r, -r * 0.7); c.arc(r * 1.3, 0, r, Math.PI - 0.7, Math.PI + 0.7); c.stroke();
  }else if(id === 'donut'){
    circ('#e0a060'); c.fillStyle = '#ff7ab8'; c.beginPath(); c.arc(0, 0, r * 0.82, 0, TAU); c.fill(); c.fillStyle = '#d9cdb4'; c.beginPath(); c.arc(0, 0, r * 0.3, 0, TAU); c.fill();
    const sp = ['#fff', '#5ad2ff', '#ffe14d']; for(let i = 0; i < 7; i++){ const a = i * 0.9; c.fillStyle = sp[i % 3]; c.fillRect(Math.cos(a) * r * 0.55 - 2, Math.sin(a) * r * 0.55 - 1, 5, 2.5); }
  }else if(id === 'smile'){
    circ('#ffd23a'); c.rotate(-spin); c.fillStyle = '#2b2a4a'; c.beginPath(); c.arc(-r * 0.35, -r * 0.2, r * 0.13, 0, TAU); c.arc(r * 0.35, -r * 0.2, r * 0.13, 0, TAU); c.fill();
    c.strokeStyle = '#2b2a4a'; c.lineWidth = 3; c.beginPath(); c.arc(0, r * 0.05, r * 0.5, 0.3, Math.PI - 0.3); c.stroke();
  }else if(id === 'planet'){
    circ('#b98cff'); c.fillStyle = '#8a5ae8'; c.beginPath(); c.arc(-r * 0.3, r * 0.2, r * 0.25, 0, TAU); c.arc(r * 0.35, -r * 0.3, r * 0.15, 0, TAU); c.fill();
    c.rotate(-spin); c.strokeStyle = '#ffe14d'; c.lineWidth = 4; c.beginPath(); c.ellipse(0, 0, r * 1.5, r * 0.4, -0.3, 0.2, Math.PI - 0.2); c.stroke();
  }else if(id === 'pearl'){
    const g = c.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#f3e8ff'); g.addColorStop(1, '#c8b6e8'); circ(g, '#8a7ab0');
  }else{
    const g = c.createRadialGradient(0, 0, 2, 0, 0, r); g.addColorStop(0, '#ff9ef0'); g.addColorStop(0.5, '#5a3fd8'); g.addColorStop(1, '#140f40'); circ(g, '#ffe14d');
    c.fillStyle = '#fff'; for(let i = 0; i < 6; i++){ const a = i * 1.1 + t, d = r * (0.3 + (i % 3) * 0.2); c.fillRect(Math.cos(a) * d, Math.sin(a) * d, 2.5, 2.5); }
  }
  c.restore();
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.4, r * 0.18, 0, TAU); c.fill();
}
