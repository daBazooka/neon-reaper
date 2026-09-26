'use strict';
const cv = $('c'), cx = cv.getContext('2d', { alpha:false });
let W = 0, H = 0, DPR = 1, vign = null;
const glowC = new Map();
function glowSpr(col){
  let c = glowC.get(col); if(c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(col, .9)); gr.addColorStop(.3, rgba(col, .35)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); if(glowC.size > 60) glowC.clear(); glowC.set(col, c); return c;
}
function glow(x, y, r, col, a){ cx.globalAlpha = a; cx.drawImage(glowSpr(col), x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1; }
function resize(){
  W = innerWidth; H = innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, G.q === 'low' ? 1 : 2);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  const c = document.createElement('canvas'); c.width = Math.max(1, W >> 1); c.height = Math.max(1, H >> 1);
  const g = c.getContext('2d'), gr = g.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * .35, c.width / 2, c.height / 2, Math.hypot(c.width, c.height) / 2);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  vign = c;
}
const sx = x => (x - G.camX) * G.camZ + W / 2, sy = y => (y - G.camY) * G.camZ + H / 2;

/* ---------------- background ---------------- */
function drawBg(){
  cx.fillStyle = '#171a2b'; cx.fillRect(0, 0, W, H);
  const Z = G.camZ;
  // adaptive grid: keep squares 50–100 px on screen whatever the zoom
  let s = 80; while(s * Z < 50) s *= 2; while(s * Z > 100) s /= 2;
  const x0 = Math.floor((G.camX - W / 2 / Z) / s) * s, y0 = Math.floor((G.camY - H / 2 / Z) / s) * s;
  for(let x = x0, i = Math.round(x0 / s); x < G.camX + W / 2 / Z + s; x += s, i++){
    for(let y = y0, j = Math.round(y0 / s); y < G.camY + H / 2 / Z + s; y += s, j++){
      if(((i + j) & 1) === 0){ cx.fillStyle = 'rgba(255,255,255,.022)'; cx.fillRect(sx(x), sy(y), s * Z + 1, s * Z + 1); }
    }
  }
  cx.strokeStyle = 'rgba(140,160,255,.06)'; cx.lineWidth = 1; cx.beginPath();
  for(let x = x0; x < G.camX + W / 2 / Z + s; x += s){ cx.moveTo(sx(x), 0); cx.lineTo(sx(x), H); }
  for(let y = y0; y < G.camY + H / 2 / Z + s; y += s){ cx.moveTo(0, sy(y)); cx.lineTo(W, sy(y)); }
  cx.stroke();
}

/* ---------------- enemies ---------------- */
function polyPath(pts){ cx.beginPath(); pts.forEach((p, i) => i ? cx.lineTo(sx(p[0]), sy(p[1])) : cx.moveTo(sx(p[0]), sy(p[1]))); cx.closePath(); }
function drawEnemy(e){
  const wv = worldVerts(e), col = e.boss ? '#7a64d6' : e.d.col, Z = G.camZ;
  if(G.q !== 'low') glow(sx(e.x), sy(e.y), e.R * Z * 1.6, e.boss ? '#b18cff' : col, e.boss ? .45 : .22);
  polyPath(wv);
  cx.fillStyle = col; cx.fill();
  cx.lineWidth = Math.max(2, 3 * Math.min(1.4, Z * 1.5)); cx.strokeStyle = e.boss ? '#e6d8ff' : shade(col, .55); cx.lineJoin = 'round'; cx.stroke();
  // soft top highlight
  cx.save(); cx.clip();
  cx.fillStyle = 'rgba(255,255,255,.14)'; cx.fillRect(sx(e.x - e.R), sy(e.y - e.R), e.R * 2 * Z, e.R * .8 * Z);
  if(e.d.metal){ cx.strokeStyle = 'rgba(255,255,255,.55)'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(sx(e.x - e.R * .6), sy(e.y - e.R * .2)); cx.lineTo(sx(e.x - e.R * .1), sy(e.y - e.R * .6)); cx.stroke(); }
  if(e.boss){ cx.strokeStyle = `rgba(190,150,255,${.5 + .3 * Math.sin(G.rt * 4)})`; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(sx(e.x - e.R * .5), sy(e.y)); cx.lineTo(sx(e.x), sy(e.y - e.R * .3)); cx.lineTo(sx(e.x + e.R * .4), sy(e.y + e.R * .2)); cx.stroke(); }
  if(e.touch > .05){ cx.fillStyle = `rgba(255,40,60,${Math.min(.6, e.touch / .35 * .6)})`; cx.fillRect(sx(e.x - e.R), sy(e.y - e.R), e.R * 2 * Z, e.R * 2 * Z); }
  if(e.flash > 0){ cx.fillStyle = `rgba(255,255,255,${e.flash / .12 * .7})`; cx.fillRect(sx(e.x - e.R), sy(e.y - e.R), e.R * 2 * Z, e.R * 2 * Z); }
  if(e.burn > 0){ cx.fillStyle = `rgba(255,120,30,${.25 + .15 * Math.sin(G.rt * 20)})`; cx.fillRect(sx(e.x - e.R), sy(e.y - e.R), e.R * 2 * Z, e.R * 2 * Z); }
  cx.restore();
  // freshly cut edge glows
  if(e.cutT > 0 && e.cut){
    const c = Math.cos(e.ang), s = Math.sin(e.ang), w = p => [e.x + p[0] * c - p[1] * s, e.y + p[0] * s + p[1] * c];
    const a = w(e.cut[0]), b = w(e.cut[1]);
    cx.strokeStyle = `rgba(255,255,255,${e.cutT / .35})`; cx.lineWidth = 4; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(sx(a[0]), sy(a[1])); cx.lineTo(sx(b[0]), sy(b[1])); cx.stroke(); cx.lineCap = 'butt';
  }
  // eyes that watch you
  const eq = Math.sqrt(e.area / Math.PI) * Z;
  if(eq > 9){
    const c = polyCentroid(e.v), ca = Math.cos(e.ang), sa = Math.sin(e.ang);
    const ex = e.x + c[0] * ca - c[1] * sa, ey = e.y + c[0] * sa + c[1] * ca;
    const dx = P ? P.x - ex : 1, dy = P ? P.y - ey : 0, dl = Math.hypot(dx, dy) || 1, lx = dx / dl, ly = dy / dl;
    const er = clamp(eq * .2, 3, 26), gap = er * 1.25;
    for(const sg of [-1, 1]){
      const px = sx(ex) + (-ly * gap * sg) + lx * er * .5, py = sy(ey) + (lx * gap * sg) + ly * er * .5 - er * .3;
      cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(px, py, er, 0, TAU); cx.fill();
      cx.fillStyle = e.boss ? '#b18cff' : '#1a1a24'; cx.beginPath(); cx.arc(px + lx * er * .4, py + ly * er * .4, er * .5, 0, TAU); cx.fill();
    }
    if(e.d.dash && e.st === 'aim'){ cx.strokeStyle = `rgba(255,176,32,${.3 + .4 * Math.abs(Math.sin(G.rt * 30))})`; cx.setLineDash([8, 8]); cx.lineWidth = 2; cx.beginPath(); cx.moveTo(sx(ex), sy(ey)); cx.lineTo(sx(ex + lx * 400 * sizeScale()), sy(ey + ly * 400 * sizeScale())); cx.stroke(); cx.setLineDash([]); }
  }
}

/* ---------------- blade & player ---------------- */
function bladeCols(){
  const s = skin();
  if(s.c2 === 'prism'){ const h = (G.rt * 120) % 360 | 0; return { c1:'#ffffff', c2:`hsl(${h},90%,60%)`, glow:`hsl(${(h / 15 | 0) * 15},90%,65%)` }; }
  return s;
}
function drawBlade(ang, L, trail){
  const Z = G.camZ, bc = bladeCols();
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const hx = P.x + dx * P.r * .6, hy = P.y + dy * P.r * .6;
  const wb = clamp(L * .11, 10, 90);
  // slash trail (swept area of the last frames)
  if(trail && trail.length > 1 && Math.abs(BL.w) > 3){
    cx.globalCompositeOperation = 'lighter';
    for(let i = 1; i < trail.length; i++){
      const a = trail[i - 1], b = trail[i], off = ang - BL.ang;
      const k = i / trail.length;
      const pa = [a.hx + Math.cos(a.ang + off) * a.L, a.hy + Math.sin(a.ang + off) * a.L], pb = [b.hx + Math.cos(b.ang + off) * b.L, b.hy + Math.sin(b.ang + off) * b.L];
      const ma = [a.hx + Math.cos(a.ang + off) * a.L * .35, a.hy + Math.sin(a.ang + off) * a.L * .35], mb = [b.hx + Math.cos(b.ang + off) * b.L * .35, b.hy + Math.sin(b.ang + off) * b.L * .35];
      cx.fillStyle = bc.glow.startsWith('#') ? rgba(bc.glow, .16 * k) : bc.glow.replace('hsl(', 'hsla(').replace(')', `,${.16 * k})`);
      cx.beginPath(); cx.moveTo(sx(ma[0]), sy(ma[1])); cx.lineTo(sx(pa[0]), sy(pa[1])); cx.lineTo(sx(pb[0]), sy(pb[1])); cx.lineTo(sx(mb[0]), sy(mb[1])); cx.closePath(); cx.fill();
    }
    cx.globalCompositeOperation = 'source-over';
  }
  const pts = [
    [hx + nx * wb / 2, hy + ny * wb / 2], [hx + dx * L * .86 + nx * wb * .42, hy + dy * L * .86 + ny * wb * .42],
    [hx + dx * L, hy + dy * L],
    [hx + dx * L * .86 - nx * wb * .42, hy + dy * L * .86 - ny * wb * .42], [hx - nx * wb / 2, hy - ny * wb / 2],
  ];
  // glow
  if(G.q !== 'low'){
    cx.globalCompositeOperation = 'lighter';
    cx.strokeStyle = bc.glow.startsWith('#') ? rgba(bc.glow, .25) : bc.glow.replace('hsl(', 'hsla(').replace(')', ',.25)');
    cx.lineWidth = Math.max(6, wb * Z * 1.1); cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(sx(hx), sy(hy)); cx.lineTo(sx(hx + dx * L), sy(hy + dy * L)); cx.stroke(); cx.lineCap = 'butt';
    cx.globalCompositeOperation = 'source-over';
  }
  const gr = cx.createLinearGradient(sx(hx + nx * wb / 2), sy(hy + ny * wb / 2), sx(hx - nx * wb / 2), sy(hy - ny * wb / 2));
  gr.addColorStop(0, bc.c1); gr.addColorStop(.5, bc.c1); gr.addColorStop(.52, bc.c2); gr.addColorStop(1, bc.c2);
  polyPath(pts); cx.fillStyle = gr; cx.fill();
  cx.strokeStyle = 'rgba(0,0,0,.45)'; cx.lineWidth = Math.max(1.5, 2 * Z); cx.stroke();
  // fuller
  cx.strokeStyle = 'rgba(0,0,0,.18)'; cx.lineWidth = Math.max(1, wb * Z * .12);
  cx.beginPath(); cx.moveTo(sx(hx + dx * wb), sy(hy + dy * wb)); cx.lineTo(sx(hx + dx * L * .78), sy(hy + dy * L * .78)); cx.stroke();
  // guard
  const gw = Math.max(wb * 1.3, P.r * 1.4), gt = Math.max(wb * .35, 5);
  const g = [[hx + nx * gw - dx * gt / 2, hy + ny * gw - dy * gt / 2], [hx + nx * gw + dx * gt / 2, hy + ny * gw + dy * gt / 2], [hx - nx * gw + dx * gt / 2, hy - ny * gw + dy * gt / 2], [hx - nx * gw - dx * gt / 2, hy - ny * gw - dy * gt / 2]];
  polyPath(g); cx.fillStyle = '#c99a3a'; cx.fill(); cx.strokeStyle = 'rgba(0,0,0,.5)'; cx.lineWidth = 2; cx.stroke();
}
function drawPlayer(){
  if(!P || G.state === 'dying' || (G.state === 'over' && P.hp <= 0)) return;
  const Z = G.camZ, x = sx(P.x), y = sy(P.y), r = P.r * Z;
  if(P.inv > 0 && ((G.rt * 14) | 0) % 2 === 0 && G.state === 'play') cx.globalAlpha = .35;
  if(G.up.twin) drawBlade(BL.ang + Math.PI, G.L * .85, BL.trail);
  drawBlade(BL.ang, G.L, BL.trail);
  // body
  cx.fillStyle = 'rgba(0,0,0,.3)'; cx.beginPath(); cx.ellipse(x, y + r * .9, r * 1.1, r * .45, 0, 0, TAU); cx.fill();
  cx.fillStyle = '#c9d3e6'; cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.fill();
  cx.strokeStyle = '#2a2f45'; cx.lineWidth = Math.max(2, 3 * Z); cx.stroke();
  const f = P.face, vx = Math.cos(f), vy = Math.sin(f);
  cx.fillStyle = '#2a2f45'; cx.save(); cx.translate(x + vx * r * .35, y + vy * r * .35); cx.rotate(f); cx.fillRect(-r * .18, -r * .55, r * .36, r * 1.1); cx.restore();
  cx.fillStyle = '#ff3b5c'; cx.beginPath(); cx.arc(x - vx * r * .7, y - vy * r * .7 - r * .2, r * .38, 0, TAU); cx.fill();
  cx.globalAlpha = 1;
  // dash readiness ring
  if(P.dashCd > 0){ cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 3; cx.beginPath(); cx.arc(x, y, r + 7, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - P.dashCd / 2.1)); cx.stroke(); }
}

/* ---------------- main ---------------- */
function render(){
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const sh = save.opt.shake ? G.shake : 0;
  cx.save(); cx.translate((Math.random() * 2 - 1) * sh, (Math.random() * 2 - 1) * sh);
  drawBg();
  const Z = G.camZ;
  // gems
  for(const g of G.GM){
    const r = clamp((5 + Math.sqrt(g.v) * 4) * Math.sqrt(sizeScale()) * Z, 3, 16), x = sx(g.x), y = sy(g.y);
    if(x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;
    if(g.life < 2 && ((G.rt * 10) | 0) % 2) continue;
    if(G.q !== 'low') glow(x, y, r * 3, '#3ff0ff', .5);
    cx.fillStyle = g.big ? '#ffd23c' : '#bffcff'; cx.beginPath(); cx.moveTo(x, y - r); cx.lineTo(x + r * .75, y); cx.lineTo(x, y + r); cx.lineTo(x - r * .75, y); cx.closePath(); cx.fill();
  }
  // debris
  for(const b of G.DB){
    const k = b.life / b.max, c = Math.cos(b.ang), s = Math.sin(b.ang), sc = .6 + .4 * k;
    cx.globalAlpha = k; cx.beginPath();
    b.v.forEach((p, i) => { const px = sx(b.x + (p[0] * c - p[1] * s) * sc), py = sy(b.y + (p[0] * s + p[1] * c) * sc); i ? cx.lineTo(px, py) : cx.moveTo(px, py); });
    cx.closePath(); cx.fillStyle = b.col; cx.fill(); cx.globalAlpha = 1;
  }
  for(const e of G.E) if(!e.dead){ const x = sx(e.x), y = sy(e.y), r = e.R * Z; if(x > -r && y > -r && x < W + r && y < H + r) drawEnemy(e); }
  // orbs
  for(const o of G.O){
    const x = sx(o.x), y = sy(o.y), r = Math.max(4, o.r * Z);
    glow(x, y, r * 3, o.friendly ? '#8ff0ff' : '#3ddc84', .8);
    cx.fillStyle = o.friendly ? '#ffffff' : '#c6ffd9'; cx.beginPath(); cx.arc(x, y, r * .7, 0, TAU); cx.fill();
  }
  drawPlayer();
  // particles
  cx.globalCompositeOperation = 'lighter';
  for(const p of G.PT){ const k = p.life / p.max; cx.globalAlpha = k; cx.fillStyle = p.c; const s = p.s * (.5 + k * .5); cx.fillRect(sx(p.x) - s / 2, sy(p.y) - s / 2, s, s); }
  cx.globalAlpha = 1;
  for(const f of G.FX){
    if(f.ring){ cx.strokeStyle = rgba(f.c, f.life / .35); cx.lineWidth = 5; cx.beginPath(); cx.arc(sx(f.x), sy(f.y), f.r * Z, 0, TAU); cx.stroke(); continue; }
    const k = f.life / f.max; cx.strokeStyle = rgba(f.c, k); cx.lineWidth = 2 + 6 * k; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(sx(f.x1), sy(f.y1)); cx.lineTo(sx(f.x2), sy(f.y2)); cx.stroke(); cx.lineCap = 'butt';
  }
  cx.globalCompositeOperation = 'source-over';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(const p of G.POP){
    const k = Math.min(1, p.life / .3), sc = p.life > .85 ? 1 + (p.life - .85) * 3 : 1;
    cx.globalAlpha = k; cx.font = `900 ${Math.round(p.size * sc)}px system-ui,sans-serif`;
    cx.lineWidth = 4; cx.strokeStyle = 'rgba(0,0,0,.7)'; cx.strokeText(p.txt, sx(p.x), sy(p.y)); cx.fillStyle = p.c; cx.fillText(p.txt, sx(p.x), sy(p.y));
  }
  cx.globalAlpha = 1; cx.textBaseline = 'alphabetic';
  cx.restore();
  cx.drawImage(vign, 0, 0, W, H);
  if(P && P.hp === 1 && G.state === 'play'){ cx.fillStyle = `rgba(255,40,70,${.08 + .06 * Math.sin(G.rt * 6)})`; cx.fillRect(0, 0, W, H); }
  if(G.flash > 0){ cx.fillStyle = rgba(G.flashCol, Math.min(.4, G.flash * .35)); cx.fillRect(0, 0, W, H); }
  // virtual joystick
  if(IN.joy && IN.joy.on && G.state === 'play'){
    cx.strokeStyle = 'rgba(255,255,255,.25)'; cx.lineWidth = 3; cx.beginPath(); cx.arc(IN.joy.ox, IN.joy.oy, 56, 0, TAU); cx.stroke();
    const dx = IN.joy.x - IN.joy.ox, dy = IN.joy.y - IN.joy.oy, l = Math.hypot(dx, dy), m = Math.min(l, 56) / (l || 1);
    cx.fillStyle = 'rgba(255,255,255,.4)'; cx.beginPath(); cx.arc(IN.joy.ox + dx * m, IN.joy.oy + dy * m, 24, 0, TAU); cx.fill();
  }
}

/* menu backdrop: a blade idly swinging through drifting shapes */
function menuTick(dt){
  if(!P){ P = { x:0, y:0, vx:0, vy:0, r:18, hp:3, maxHp:3, inv:0, dashCd:0, dashT:0, face:0 }; BL = { ang:0, w:3, trail:[], swishT:9 }; }
  G.rt += dt;
  const t = G.rt;
  const tx = Math.cos(t * .7) * 140, ty = Math.sin(t * 1.1) * 90;
  const mdx = tx - P.x, mdy = ty - P.y, ml = Math.hypot(mdx, mdy) || 1; G.menuIn = [mdx / ml * Math.min(1, ml / 60), mdy / ml * Math.min(1, ml / 60)];
  G.L = 150; G.camZ = targetZoom(); G.camX = 0; G.camY = 0;
  if(G.E.length < 9){ const a = rnd(0, TAU), d = rnd(250, 420); const e = spawnEnemy(pick(['blob', 'hexa', 'dart', 'bomber', 'armor', 'shooter']), Math.cos(a) * d, Math.sin(a) * d, rnd(.9, 1.4)); e.imm = .6; }
  G.state = 'menuplay';
  updPlayer(dt);
  for(const e of G.E){ e.vx = lerp(e.vx, (P.x - e.x) * .15, dt); e.vy = lerp(e.vy, (P.y - e.y) * .15, dt); e.x += e.vx * dt; e.y += e.vy * dt; e.ang += e.av * dt; if(e.imm > 0) e.imm -= dt; if(e.cutT > 0) e.cutT -= dt; if(e.flash > 0) e.flash -= dt; }
  G.E = G.E.filter(e => !e.dead);
  G.GM.length = 0; G.state = 'menu';
  tickFx(dt);
}
