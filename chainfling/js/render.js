'use strict';
/* =====================================================================
   Rendering: everything is procedural canvas. Glows are cached radial
   sprites (no shadowBlur) so it stays fast on low-end phones.
   ===================================================================== */
const cv = $('c'), cx = cv.getContext('2d', { alpha:false });
let W = 0, H = 0, DPR = 1, vignette = null, slowVig = null, hurtVig = null;

function rgba(col, a){
  if(col[0] === '#'){
    const n = parseInt(col.length === 4 ? col[1] + col[1] + col[2] + col[2] + col[3] + col[3] : col.slice(1), 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
  }
  if(col.startsWith('hsl(')) return col.replace('hsl(', 'hsla(').replace(')', ',' + a + ')');
  return col;
}
const glowCache = new Map();
function glowSpr(col){
  let c = glowCache.get(col);
  if(c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(col, .9)); gr.addColorStop(.22, rgba(col, .45)); gr.addColorStop(.55, rgba(col, .12)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  if(glowCache.size > 80) glowCache.clear();
  glowCache.set(col, c);
  return c;
}
function glow(x, y, r, col, a){ cx.globalAlpha = a == null ? 1 : a; cx.drawImage(glowSpr(col), x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1; }

function resize(){
  W = innerWidth; H = innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, G.q === 'low' ? 1 : G.q === 'mid' ? 1.5 : 2);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  SC = Math.min(W, H) / 540;
  AW = W / SC; AH = H / SC;
  resizeArena();
  const mk = (inner, col, a) => {
    const c = document.createElement('canvas'); c.width = Math.max(1, W >> 1); c.height = Math.max(1, H >> 1);
    const g = c.getContext('2d'), gr = g.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * inner, c.width / 2, c.height / 2, Math.hypot(c.width, c.height) / 2);
    gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(1, rgba(col, a)); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    return c;
  };
  vignette = mk(.35, '#000000', .75);
  slowVig = mk(.2, '#27f3ff', .5);
  hurtVig = mk(.3, '#ff3b5c', .7);
}

/* ---------------- grid ---------------- */
function gridDisp(x, y){
  let dx = 0, dy = 0;
  for(const s of G.SH){
    const ex = x - s.x, ey = y - s.y, d = Math.hypot(ex, ey) || 1, diff = Math.abs(d - s.r);
    if(diff < 60){ const a = (1 - diff / 60) * s.w * 3.2 * (s.life / s.ml); dx += ex / d * a; dy += ey / d * a; }
  }
  if(P && (G.state === 'play' || G.state === 'dying')){
    const ex = P.x - x, ey = P.y - y, d = Math.hypot(ex, ey);
    if(d < 140 && d > 1){ const a = (1 - d / 140) * 14; dx += ex / d * a; dy += ey / d * a; }
  }
  return [dx, dy];
}
function drawGrid(){
  const sp = 44, beat = AU.ctx ? Math.exp(-Math.max(0, AU.ctx.currentTime - AU.kickAt) * 7) : 0;
  cx.strokeStyle = `rgba(70,110,230,${.1 + beat * .07})`; cx.lineWidth = 1;
  const warp = G.q !== 'low';
  const x0 = A.x0, x1 = A.x1, y0 = A.y0, y1 = A.y1;
  cx.beginPath();
  for(let x = x0 + sp; x < x1; x += sp){
    for(let y = y0, first = true; y <= y1 + .1; y += sp / 2){
      const yy = Math.min(y, y1); let px = x, py = yy;
      if(warp){ const d = gridDisp(x, yy); px += d[0]; py += d[1]; }
      if(first){ cx.moveTo(px, py); first = false; } else cx.lineTo(px, py);
    }
  }
  for(let y = y0 + sp; y < y1; y += sp){
    for(let x = x0, first = true; x <= x1 + .1; x += sp / 2){
      const xx = Math.min(x, x1); let px = xx, py = y;
      if(warp){ const d = gridDisp(xx, y); px += d[0]; py += d[1]; }
      if(first){ cx.moveTo(px, py); first = false; } else cx.lineTo(px, py);
    }
  }
  cx.stroke();
}
function drawArena(){
  const base = G.boss ? '#ff3b5c' : '#27f3ff';
  cx.lineWidth = 3;
  const sides = [[A.x0, A.y0, A.x0, A.y1], [A.x1, A.y0, A.x1, A.y1], [A.x0, A.y0, A.x1, A.y0], [A.x0, A.y1, A.x1, A.y1]];
  for(let i = 0; i < 4; i++){
    const s = sides[i], f = G.wallFx[i];
    cx.strokeStyle = f > 0 ? rgba('#ffffff', .35 + f * .65) : rgba(base, .45);
    cx.lineWidth = 3 + f * 4;
    cx.beginPath(); cx.moveTo(s[0], s[1]); cx.lineTo(s[2], s[3]); cx.stroke();
  }
}

/* ---------------- shapes ---------------- */
function polyPath(x, y, r, n, rot){ cx.beginPath(); for(let i = 0; i < n; i++){ const a = rot + i / n * TAU; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? cx.lineTo(px, py) : cx.moveTo(px, py); } cx.closePath(); }
function starPath(x, y, r, n, rot){ cx.beginPath(); for(let i = 0; i < n * 2; i++){ const a = rot + i / (n * 2) * TAU, rr = i % 2 ? r * .5 : r; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? cx.lineTo(px, py) : cx.moveTo(px, py); } cx.closePath(); }
function neon(col, fillA){ cx.fillStyle = rgba(col, fillA == null ? .18 : fillA); cx.fill(); cx.strokeStyle = col; cx.lineWidth = 2.5; cx.stroke(); }

function drawEnemy(e){
  const x = e.x, y = e.y, r = e.r, t = e.t;
  const born = Math.min(1, e.born / .25), s = r * (born < 1 ? .4 + .6 * born : 1);
  let col = e.flash > 0 ? '#ffffff' : e.col;
  if(e.type === 'ghost' && e.phased){ cx.globalAlpha = .22; }
  if(G.q !== 'low') glow(x, y, s * 3, e.col, e.type === 'ghost' && e.phased ? .15 : .55);
  switch(e.type){
    case 'drifter': case 'mini': case 'dummy':
      polyPath(x, y, s * 1.15, 3, e.face); neon(col); break;
    case 'bomber': {
      const near = P ? clamp(1 - Math.hypot(P.x - x, P.y - y) / 300, 0, 1) : 0;
      const pl = .5 + .5 * Math.sin(t * (6 + near * 14));
      cx.beginPath(); cx.arc(x, y, s, 0, TAU); neon(col, .15 + pl * .25);
      cx.beginPath(); cx.arc(x, y, s * .45, 0, TAU); cx.fillStyle = rgba(col, .5 + pl * .5); cx.fill();
      cx.strokeStyle = rgba(col, .35); cx.lineWidth = 1.5; cx.beginPath(); cx.arc(x, y, s + 6 + pl * 4, 0, TAU); cx.stroke();
      break;
    }
    case 'shield':
      cx.beginPath(); cx.arc(x, y, s * .85, 0, TAU); neon(col);
      cx.lineWidth = 6; cx.strokeStyle = e.flash > 0 ? '#fff' : '#bfe0ff'; cx.lineCap = 'round';
      cx.beginPath(); cx.arc(x, y, s + 5, e.face - 1.1, e.face + 1.1); cx.stroke(); cx.lineCap = 'butt';
      cx.fillStyle = '#ff3b5c'; cx.beginPath(); cx.arc(x - Math.cos(e.face) * s * .5, y - Math.sin(e.face) * s * .5, 3.2, 0, TAU); cx.fill();
      break;
    case 'splitter':
      polyPath(x, y, s * 1.2, 4, t * .8); neon(col);
      cx.strokeStyle = rgba(col, .8); cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(x - s * .6, y); cx.lineTo(x + s * .6, y); cx.stroke();
      break;
    case 'turret':
      polyPath(x, y, s * 1.1, 4, Math.PI / 4); neon(col);
      cx.strokeStyle = col; cx.lineWidth = 5; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + Math.cos(e.face) * s * 1.5, y + Math.sin(e.face) * s * 1.5); cx.stroke();
      if(e.cd < .5){ glow(x + Math.cos(e.face) * s * 1.5, y + Math.sin(e.face) * s * 1.5, 14, '#ffffff', 1 - e.cd * 2); }
      break;
    case 'dasher': {
      if(e.st === 'aim'){
        cx.strokeStyle = rgba(e.col, .25 + .35 * Math.abs(Math.sin(t * 30))); cx.lineWidth = 2; cx.setLineDash([8, 8]);
        cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + e.dx * 320, y + e.dy * 320); cx.stroke(); cx.setLineDash([]);
      }
      const a = e.face, c = Math.cos(a), sn = Math.sin(a);
      cx.beginPath(); cx.moveTo(x + c * s * 1.4, y + sn * s * 1.4);
      cx.lineTo(x - c * s + -sn * s, y - sn * s + c * s); cx.lineTo(x - c * s * .3, y - sn * s * .3); cx.lineTo(x - c * s - -sn * s, y - sn * s - c * s); cx.closePath();
      neon(col, e.st === 'dash' ? .6 : .18);
      break;
    }
    case 'tank':
      polyPath(x, y, s, 8, t * .3); neon(col, .22);
      cx.strokeStyle = rgba('#ffffff', .8); cx.lineWidth = 3;
      cx.beginPath(); cx.arc(x, y, s * .55, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(e.hp / e.maxHp, 0, 1)); cx.stroke();
      break;
    case 'spiker':
      starPath(x, y, s * 1.3, 8, t * 3); neon(col, .3);
      if(P && Math.hypot(P.vx, P.vy) >= ST.over){ cx.strokeStyle = rgba('#b6ff3c', .7); cx.lineWidth = 2; cx.beginPath(); cx.arc(x, y, s * 1.6, 0, TAU); cx.stroke(); }
      break;
    case 'ghost': {
      cx.beginPath(); cx.arc(x, y - s * .15, s, Math.PI, 0);
      for(let i = 0; i <= 4; i++){ const px = x + s - i * s / 2, py = y + s * .7 + (i % 2 ? -4 : 3) * Math.sin(t * 6); cx.lineTo(px, py); }
      cx.closePath(); neon(col, .25);
      cx.fillStyle = '#06070f'; cx.beginPath(); cx.arc(x - s * .35, y - s * .2, 2.8, 0, TAU); cx.arc(x + s * .35, y - s * .2, 2.8, 0, TAU); cx.fill();
      break;
    }
  }
  cx.globalAlpha = 1;
  if(e.hp < e.maxHp && e.type !== 'tank' && e.maxHp > 1.01){
    cx.strokeStyle = rgba('#ffffff', .7); cx.lineWidth = 2; cx.beginPath(); cx.arc(x, y, r + 7, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(e.hp / e.maxHp, 0, 1)); cx.stroke();
  }
}

function drawBoss(e){
  const x = e.x, y = e.y, t = G.t, col = e.flash > 0 ? '#ffffff' : e.col;
  if(e.boss === 'prism'){
    glow(x, y, e.r * 3.5, e.col, .6);
    polyPath(x, y, e.r, 6, t * .4); neon(col, .25);
    polyPath(x, y, e.r * .55, 6, -t * .8); neon(col, .5);
    cx.lineCap = 'round';
    for(let k = 0; k < 3; k++){
      const a = e.rot + k * TAU / 3;
      cx.strokeStyle = '#e6fbff'; cx.lineWidth = 10;
      cx.beginPath(); cx.arc(x, y, e.r + 12, a - .5, a + .5); cx.stroke();
      cx.strokeStyle = rgba(e.col, .8); cx.lineWidth = 3;
      cx.beginPath(); cx.arc(x, y, e.r + 20, a - .5, a + .5); cx.stroke();
    }
    cx.lineCap = 'butt';
  } else if(e.boss === 'hive'){
    const pl = 1 + Math.sin(t * 3) * .04;
    glow(x, y, e.r * 3.4, e.col, .55);
    cx.beginPath(); cx.arc(x, y, e.r * pl, 0, TAU); neon(col, .22);
    for(let i = 0; i < 6; i++){ const a = i / 6 * TAU + t * .3; polyPath(x + Math.cos(a) * e.r * .55, y + Math.sin(a) * e.r * .55, e.r * .24, 6, 0); neon(col, .35); }
    polyPath(x, y, e.r * .24, 6, 0); neon('#ffffff', .4);
    if(e.pulse > 0){
      const k = 1 - e.pulse / 1.25;
      cx.strokeStyle = rgba('#ffb020', .3 + k * .6); cx.lineWidth = 2 + k * 4; cx.setLineDash([12, 10]);
      cx.beginPath(); cx.arc(x, y, 270, 0, TAU); cx.stroke(); cx.setLineDash([]);
      cx.fillStyle = rgba('#ffb020', k * .12); cx.beginPath(); cx.arc(x, y, 270 * k, 0, TAU); cx.fill();
    }
  } else if(e.boss === 'serpent'){
    const segs = e.segs;
    for(let i = segs.length - 1; i >= 0; i--){
      const g = segs[i], tail = i === segs.length - 1;
      if(tail){
        const pl = .5 + .5 * Math.sin(t * 10);
        glow(g.x, g.y, g.r * 4, '#ffffff', .5 + pl * .4);
        cx.strokeStyle = rgba('#ffffff', .6 + pl * .4); cx.lineWidth = 2; cx.setLineDash([4, 4]);
        cx.beginPath(); cx.arc(g.x, g.y, g.r + 9 + pl * 3, 0, TAU); cx.stroke(); cx.setLineDash([]);
      } else if(G.q !== 'low') glow(g.x, g.y, g.r * 2.4, e.col, .35);
      cx.beginPath(); cx.arc(g.x, g.y, g.r, 0, TAU); neon(tail ? '#ffffff' : col, tail ? .55 : .2);
    }
    const h = segs[0];
    if(h){
      const a = e.ang, c = Math.cos(a), s = Math.sin(a);
      cx.fillStyle = '#ff3b5c';
      cx.beginPath(); cx.arc(h.x + c * 8 - s * 8, h.y + s * 8 + c * 8, 4, 0, TAU); cx.arc(h.x + c * 8 + s * 8, h.y + s * 8 - c * 8, 4, 0, TAU); cx.fill();
    }
  }
}

function drawPlayer(){
  const col = skinCol(), sk = SKINS.find(k => k.id === save.skin) || SKINS[0];
  const sp = Math.hypot(P.vx, P.vy), fast = sp >= ST.vuln, over = sp >= ST.over;
  // trail
  cx.globalCompositeOperation = 'lighter';
  const tr = P.trail;
  for(let i = 1; i < tr.length; i++){
    const a = tr[i - 1], b = tr[i], k = i / tr.length;
    cx.strokeStyle = rgba(col, .5 * k * (1 - b.a / .28));
    cx.lineWidth = P.r * 1.7 * k; cx.lineCap = 'round';
    cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
  }
  cx.lineCap = 'butt';
  glow(P.x, P.y, P.r * (fast ? 5 : 3), col, fast ? .9 : .5);
  if(over) glow(P.x, P.y, P.r * 7, '#ffffff', .25);
  cx.globalCompositeOperation = 'source-over';
  const blink = P.inv > 0 && G.state === 'play' && ((G.rt * 14) | 0) % 2 === 0;
  if(!blink){
    cx.beginPath(); cx.arc(P.x, P.y, P.r, 0, TAU);
    cx.fillStyle = fast ? '#ffffff' : rgba(col, .35); cx.fill();
    cx.strokeStyle = fast ? sk.col2 : col; cx.lineWidth = 3; cx.stroke();
    // spinning inner blades
    cx.strokeStyle = fast ? col : rgba('#ffffff', .8); cx.lineWidth = 2;
    for(let k = 0; k < 3; k++){ const a = P.spin + k * TAU / 3; cx.beginPath(); cx.moveTo(P.x, P.y); cx.lineTo(P.x + Math.cos(a) * P.r * .8, P.y + Math.sin(a) * P.r * .8); cx.stroke(); }
  }
  // vulnerable warning ring
  if(!fast && G.state === 'play' && !G.tut){
    const pl = .5 + .5 * Math.sin(G.rt * 8);
    cx.strokeStyle = rgba('#ff3b5c', .25 + pl * .35); cx.lineWidth = 1.5; cx.setLineDash([3, 5]);
    cx.beginPath(); cx.arc(P.x, P.y, P.r + 5, G.rt, G.rt + TAU); cx.stroke(); cx.setLineDash([]);
  }
  // charge pips
  const n = ST.maxCh, R = P.r + 11;
  for(let i = 0; i < n; i++){
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * .42;
    const px = P.x + Math.cos(a) * R, py = P.y + Math.sin(a) * R;
    cx.beginPath(); cx.arc(px, py, 3.6, 0, TAU);
    if(i < P.ch){ cx.fillStyle = '#ffffff'; cx.fill(); }
    else { cx.strokeStyle = rgba('#ffffff', .35); cx.lineWidth = 1.2; cx.stroke();
      if(i === P.ch && P.regen > 0){ cx.strokeStyle = col; cx.lineWidth = 2; cx.beginPath(); cx.arc(px, py, 3.6, -Math.PI / 2, -Math.PI / 2 + TAU * P.regen / 1.05); cx.stroke(); } }
  }
  // focus arc while aiming
  if(G.aiming && P.ch > 0){
    cx.strokeStyle = rgba('#27f3ff', .8); cx.lineWidth = 3;
    cx.beginPath(); cx.arc(P.x, P.y, P.r + 20, Math.PI / 2 - Math.PI * P.focus / ST.focus * .5, Math.PI / 2 + Math.PI * P.focus / ST.focus * .5); cx.stroke();
  }
  // orbit blades
  const ob = G.up.orbit || 0;
  for(let k = 0; k < ob; k++){
    const a = G.orbA + k * TAU / ob, bx = P.x + Math.cos(a) * (P.r + 30), by = P.y + Math.sin(a) * (P.r + 30);
    glow(bx, by, 22, col, .7);
    starPath(bx, by, 9, 4, a * 2); cx.fillStyle = '#ffffff'; cx.fill();
  }
}

function drawAim(){
  if(!G.aiming || G.state !== 'play') return;
  const v = aimVec();
  if(!v) return;
  const col = P.ch > 0 ? skinCol() : '#ff3b5c';
  const path = predictPath(v);
  for(let i = 2; i < path.pts.length; i += 3){
    const p = path.pts[i], k = 1 - i / path.pts.length;
    cx.fillStyle = rgba(col, .25 + .6 * k);
    cx.beginPath(); cx.arc(p.x, p.y, 2 + 2.2 * k, 0, TAU); cx.fill();
  }
  for(const b of path.bnc){ cx.strokeStyle = rgba('#ffffff', .8); cx.lineWidth = 2; cx.beginPath(); cx.arc(b.x, b.y, 8, 0, TAU); cx.stroke(); }
  const e = path.pts[path.pts.length - 1];
  if(e){ cx.strokeStyle = rgba('#ff3b5c', .7); cx.lineWidth = 2; cx.beginPath(); cx.moveTo(e.x - 6, e.y - 6); cx.lineTo(e.x + 6, e.y + 6); cx.moveTo(e.x + 6, e.y - 6); cx.lineTo(e.x - 6, e.y + 6); cx.stroke(); }
}
function drawAimGizmo(){
  if(!G.aiming || G.state !== 'play') return;
  const o = G.aimO, p = G.aimP, v = aimVec();
  cx.strokeStyle = 'rgba(255,255,255,.28)'; cx.lineWidth = 2;
  cx.beginPath(); cx.arc(o.x, o.y, 34, 0, TAU); cx.stroke();
  cx.strokeStyle = 'rgba(255,255,255,.55)'; cx.beginPath(); cx.moveTo(o.x, o.y); cx.lineTo(p.x, p.y); cx.stroke();
  cx.fillStyle = P.ch > 0 ? 'rgba(39,243,255,.9)' : 'rgba(255,59,92,.9)';
  cx.beginPath(); cx.arc(p.x, p.y, 10, 0, TAU); cx.fill();
  if(v){
    cx.font = '800 12px system-ui,sans-serif'; cx.textAlign = 'center'; cx.fillStyle = '#fff';
    cx.fillText(P.ch > 0 ? Math.round(v.pow * 100) + '%' : 'NO CHARGE', o.x, o.y - 44);
  }
}

function drawTutHand(){
  if(!G.tut || G.tutStep !== 0 || G.aiming) return;
  const k = (G.rt % 1.8) / 1.8, down = Math.min(1, k / .6);
  const sx = P.x, sy = P.y + 70, ey = sy + 90 * down;
  const pull = save.opt.aim !== 'push';
  const hy = pull ? ey : sy - 90 * down;
  cx.globalAlpha = k > .85 ? (1 - k) / .15 : 1;
  cx.strokeStyle = 'rgba(255,255,255,.5)'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(sx, hy); cx.stroke();
  cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(sx, hy, 14, 0, TAU); cx.fill();
  cx.fillStyle = 'rgba(39,243,255,.8)'; cx.beginPath(); cx.moveTo(P.x, P.y - 60); cx.lineTo(P.x - 12, P.y - 40); cx.lineTo(P.x + 12, P.y - 40); cx.closePath(); cx.fill();
  cx.globalAlpha = 1;
}

/* ---------------- menu attract demo ---------------- */
const MD = { core:{ x:300, y:300, vx:0, vy:0 }, foes:[], t:0, next:.6, trail:[] };
function menuDemo(dt){
  MD.t += dt;
  const types = ['drifter', 'bomber', 'shield', 'splitter', 'spiker', 'tank'];
  while(MD.foes.length < 9){ MD.foes.push({ x:rnd(A.x0 + 40, A.x1 - 40), y:rnd(A.y0 + 40, A.y1 - 40), type:pick(types), t:rnd(0, 9), born:0, face:rnd(0, TAU) }); }
  const c = MD.core;
  MD.next -= dt;
  if(MD.next <= 0){
    const f = pick(MD.foes), d = Math.hypot(f.x - c.x, f.y - c.y) || 1;
    c.vx = (f.x - c.x) / d * 1100; c.vy = (f.y - c.y) / d * 1100; MD.next = rnd(.7, 1.3);
    shock(c.x, c.y, 50, '#27f3ff', 2);
  }
  c.x += c.vx * dt; c.y += c.vy * dt;
  if(c.x < A.x0 + 15 || c.x > A.x1 - 15){ c.vx *= -1; c.x = clamp(c.x, A.x0 + 15, A.x1 - 15); }
  if(c.y < A.y0 + 15 || c.y > A.y1 - 15){ c.vy *= -1; c.y = clamp(c.y, A.y0 + 15, A.y1 - 15); }
  const f = Math.exp(-1.1 * dt); c.vx *= f; c.vy *= f;
  const sp = Math.hypot(c.vx, c.vy);
  for(let i = MD.foes.length - 1; i >= 0; i--){
    const o = MD.foes[i]; o.t += dt; o.born += dt;
    if(sp > 300 && Math.hypot(o.x - c.x, o.y - c.y) < 30){ burst(o.x, o.y, 16, ET[o.type].col, 320); shock(o.x, o.y, 70, ET[o.type].col, 3); MD.foes.splice(i, 1); }
  }
  MD.trail.push({ x:c.x, y:c.y }); if(MD.trail.length > 12) MD.trail.shift();
  tickFx(dt);
}
function drawMenuDemo(){
  for(const o of MD.foes){ const d = ET[o.type]; drawEnemy({ x:o.x, y:o.y, r:d.r, t:o.t, born:o.born, type:o.type, col:d.col, face:o.face, flash:0, hp:1, maxHp:1, st:'walk', cd:1, phased:false }); }
  cx.globalCompositeOperation = 'lighter';
  const tr = MD.trail;
  for(let i = 1; i < tr.length; i++){ cx.strokeStyle = rgba('#27f3ff', .45 * i / tr.length); cx.lineWidth = 24 * i / tr.length; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(tr[i - 1].x, tr[i - 1].y); cx.lineTo(tr[i].x, tr[i].y); cx.stroke(); }
  glow(MD.core.x, MD.core.y, 70, '#27f3ff', .9);
  cx.globalCompositeOperation = 'source-over';
  cx.beginPath(); cx.arc(MD.core.x, MD.core.y, 15, 0, TAU); cx.fillStyle = '#fff'; cx.fill();
}

/* ---------------- main render ---------------- */
function render(){
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.fillStyle = '#06070f'; cx.fillRect(0, 0, W, H);
  const sh = save.opt.shake ? G.shake : 0;
  const ox = (Math.random() * 2 - 1) * sh, oy = (Math.random() * 2 - 1) * sh;
  cx.save(); cx.translate(ox, oy); cx.scale(SC, SC);
  drawGrid();
  const inRun = P && G.state !== 'menu' && G.state !== 'boot';
  if(!inRun){
    drawMenuDemo(); drawFx(); cx.restore();
    cx.drawImage(vignette, 0, 0, W, H);
    return;
  }
  drawArena();
  // flames
  if(G.FL.length){
    cx.globalCompositeOperation = 'lighter';
    for(const f of G.FL) glow(f.x, f.y, 22, '#ff7a2e', f.life / f.max * .7);
    cx.globalCompositeOperation = 'source-over';
  }
  // pickups
  for(const k of G.PK){
    if(k.life < 2 && ((G.rt * 10) | 0) % 2) continue;
    if(G.q !== 'low') glow(k.x, k.y, 14, '#27f3ff', .6);
    polyPath(k.x, k.y, 5.5, 4, G.rt * 3); cx.fillStyle = '#bffcff'; cx.fill();
  }
  // spawn telegraphs
  for(const s of G.SP){
    const k = s.t / s.dur, col = s.type === 'BOSS' ? '#ff3b5c' : ET[s.type].col;
    cx.strokeStyle = rgba(col, .3 + .5 * k); cx.lineWidth = 2;
    cx.beginPath(); cx.arc(s.x, s.y, s.r * (2.6 - 1.6 * k), 0, TAU); cx.stroke();
    cx.beginPath(); cx.moveTo(s.x - 6, s.y); cx.lineTo(s.x + 6, s.y); cx.moveTo(s.x, s.y - 6); cx.lineTo(s.x, s.y + 6); cx.stroke();
  }
  for(const e of G.E){ if(e.dead) continue; if(e.type === 'boss') drawBoss(e); else drawEnemy(e); }
  // bullets
  cx.globalCompositeOperation = 'lighter';
  for(const b of G.B){ glow(b.x, b.y, b.r * 3.2, b.c, .9); }
  cx.globalCompositeOperation = 'source-over';
  for(const b of G.B){ cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(b.x, b.y, b.r * .6, 0, TAU); cx.fill(); }
  // echo shards
  for(const s of G.EC){ glow(s.x, s.y, s.r * 4, skinCol(), .6); cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, TAU); cx.strokeStyle = '#ffffff'; cx.lineWidth = 2; cx.stroke(); }
  drawAim();
  if(G.state !== 'dying' && P.hp > 0) drawPlayer();
  // zaps
  for(const z of G.ZP){
    cx.strokeStyle = rgba('#c9f6ff', z.life / .18); cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(z.x1, z.y1);
    for(let i = 1; i < 6; i++){ const k = i / 6; cx.lineTo(lerp(z.x1, z.x2, k) + rnd(-10, 10), lerp(z.y1, z.y2, k) + rnd(-10, 10)); }
    cx.lineTo(z.x2, z.y2); cx.stroke();
  }
  drawFx();
  drawTutHand();
  cx.restore();

  // screen-space overlays
  cx.drawImage(vignette, 0, 0, W, H);
  if(G.timeScale < .6){ cx.globalAlpha = (1 - G.timeScale / .6) * .75; cx.drawImage(slowVig, 0, 0, W, H); cx.globalAlpha = 1; }
  if(P.hp === 1 && G.state === 'play'){ cx.globalAlpha = .45 + .35 * Math.sin(G.rt * 6); cx.drawImage(hurtVig, 0, 0, W, H); cx.globalAlpha = 1; }
  if(G.flash > 0){ cx.fillStyle = rgba(G.flashCol, Math.min(.45, G.flash * .35)); cx.fillRect(0, 0, W, H); }
  drawAimGizmo();
}

function drawFx(){
  cx.globalCompositeOperation = 'lighter';
  for(const p of G.PT){
    const k = p.life / p.max; cx.fillStyle = rgba(p.c, k);
    const s = p.s * (.5 + k);
    cx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
  for(const s of G.SH){ cx.strokeStyle = rgba(s.c, s.life / s.ml * .8); cx.lineWidth = s.w * (s.life / s.ml) + .5; cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, TAU); cx.stroke(); }
  cx.globalCompositeOperation = 'source-over';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(const p of G.POP){
    const k = Math.min(1, p.life / .3), sc = p.life > .8 ? 1 + (p.life - .8) * 3 : 1;
    cx.globalAlpha = k;
    cx.font = `900 ${Math.round(p.size * sc)}px system-ui,sans-serif`;
    cx.lineWidth = 3.5; cx.strokeStyle = 'rgba(0,0,0,.75)'; cx.strokeText(p.txt, p.x, p.y);
    cx.fillStyle = p.c; cx.fillText(p.txt, p.x, p.y);
  }
  cx.globalAlpha = 1; cx.textBaseline = 'alphabetic';
}
