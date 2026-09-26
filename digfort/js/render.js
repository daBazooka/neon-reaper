'use strict';
const cv = $('c'), cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
const glowC = new Map();
function glowSpr(col){
  let c = glowC.get(col); if(c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(col, .85)); gr.addColorStop(.3, rgba(col, .35)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); glowC.set(col, c); return c;
}
function glow(x, y, r, col, a){ cx.globalAlpha = a; cx.drawImage(glowSpr(col), x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1; }

function resize(){
  W = innerWidth; H = innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, G.q === 'low' ? 1 : 2);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  SPR.scale = 0;
  fitCamera(); buildSprites();
}

/* ---------------- sky ---------------- */
const STARS = Array.from({ length:80 }, () => [Math.random(), Math.random() * .7, Math.random() * 1.5 + .5]);
const CLOUDS = Array.from({ length:7 }, (_, i) => ({ x:Math.random(), y:.15 + Math.random() * .7, s:.6 + Math.random() * .9, v:.004 + Math.random() * .006 }));
function mixCol(a, b, t){
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16 & 255, pb >> 16 & 255, t)), g = Math.round(lerp(pa >> 8 & 255, pb >> 8 & 255, t)), bb = Math.round(lerp(pa & 255, pb & 255, t));
  return `rgb(${r},${g},${bb})`;
}
function drawSky(){
  const L = G.light, th = theme();
  const gr = cx.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, mixCol('#0a0e2a', th.sky[0], L));
  gr.addColorStop(1, mixCol('#232a5a', th.sky[1], L));
  cx.fillStyle = gr; cx.fillRect(0, 0, W, H);
  if(L < .95){
    cx.fillStyle = '#ffffff';
    for(const [sx, sy, s] of STARS){ cx.globalAlpha = (1 - L) * (.4 + .6 * Math.abs(Math.sin(G.rt * s + sx * 40))); cx.fillRect(sx * W, sy * H, s, s); }
    cx.globalAlpha = 1;
  }
  // sun / moon
  const mx = W * .82, my = H * .2;
  if(L > .05) glow(mx, my, 90, '#fff2b0', L * .9);
  if(L < .95){ glow(W * .16, H * .18, 70, '#c8d4ff', (1 - L) * .6); cx.fillStyle = `rgba(230,236,255,${1 - L})`; cx.beginPath(); cx.arc(W * .16, H * .18, 16, 0, TAU); cx.fill(); }
  for(const c of CLOUDS){
    c.x += c.v * .016; if(c.x > 1.2) c.x = -.2;
    const x = c.x * W, y = c.y * H, s = c.s * 60;
    cx.fillStyle = `rgba(255,255,255,${.1 + .35 * L})`;
    cx.fillRect(x, y, s * 2.2, s * .35); cx.fillRect(x + s * .4, y - s * .25, s * 1.2, s * .3);
  }
}

/* ---------------- island ---------------- */
function hidden(x, y, z, h){
  if(z >= h - 1) return false;
  return inIsle(x + 1, y) && colH(x + 1, y) > z && inIsle(x, y + 1) && colH(x, y + 1) > z;
}
function riseOffset(x, y){
  if(!G.rise) return 0;
  const d = Math.max(Math.abs(x - C), Math.abs(y - C));
  if(d !== G.rise.r) return 0;
  const k = clamp(G.rise.t / 1.4, 0, 1);
  return (1 - (1 - Math.pow(1 - k, 3))) * 260;
}
function drawColumn(x, y){
  const col = COL[x][y], h = col.length, ro = riseOffset(x, y);
  const sw = (TW * Z), sp = SPR.blocks, k = Z * DPR / SPR.scale;
  for(let z = 0; z < h; z++){
    if(hidden(x, y, z, h)) continue;
    const s = sp[col[z]]; if(!s) continue;
    const [px, py] = iso(x, y, z + 1);
    cx.drawImage(s, Math.round((px - sw / 2) * DPR) / DPR, Math.round((py - TH * Z / 2 + ro) * DPR) / DPR, s.width * k / DPR, s.height * k / DPR);
  }
  // mining cracks
  if(G.mine.x === x && G.mine.y === y && G.mine.prog > .02 && !TWR[x][y] && h > 1){
    const st = SPR.cracks[clamp((G.mine.prog * 4) | 0, 0, 3)], [px, py] = iso(x, y, h);
    cx.drawImage(st, (px - sw / 2), (py - TH * Z / 2), st.width * k / DPR, st.height * k / DPR);
  }
  if(col[0] === B.MAGMA && h === 1){ const [px, py] = iso(x, y, 1); glow(px, py, 40 * Z, '#ff6a1a', .45 + .15 * Math.sin(G.rt * 3 + x)); }
  if(TWR[x][y]) drawTower(x, y, TWR[x][y], h);
}
function drawIsland(){
  const buckets = new Map(), fliers = [];
  for(const m of G.mobs){ if(m.dead) continue; if(m.fly){ fliers.push(m); continue; } const k = Math.ceil(m.x + m.y - 1e-6); if(!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(m); }
  for(let s = 0; s <= 2 * (MAXS - 1); s++){
    for(let x = Math.max(0, s - (MAXS - 1)); x <= Math.min(MAXS - 1, s); x++){
      const y = s - x;
      if(inIsle(x, y)) drawColumn(x, y);
    }
    if(s === 2 * C) drawHeart();
    const b = buckets.get(s); if(b) for(const m of b) drawMob(m);
  }
  drawHover();
  for(const m of fliers) drawMob(m);
}
function topRhombus(x, y, e){
  const [px, py] = iso(x, y, e), hw = TW / 2 * Z, hh = TH / 2 * Z;
  cx.beginPath(); cx.moveTo(px, py - hh); cx.lineTo(px + hw, py); cx.lineTo(px, py + hh); cx.lineTo(px - hw, py); cx.closePath();
}
function drawHover(){
  const hv = G.hover; if(!hv || G.state !== 'play' || !inIsle(hv.x, hv.y)) return;
  const e = colH(hv.x, hv.y) + (TWR[hv.x][hv.y] ? 1 : 0);
  const t = TOOL[G.tool];
  if(t && t.block && !TWR[hv.x][hv.y] && !isHeart(hv.x, hv.y)){
    const s = SPR.blocks[t.block], [px, py] = iso(hv.x, hv.y, colH(hv.x, hv.y) + 1), k = Z * DPR / SPR.scale;
    cx.globalAlpha = .45; cx.drawImage(s, px - TW * Z / 2, py - TH * Z / 2, s.width * k / DPR, s.height * k / DPR); cx.globalAlpha = 1;
  }
  topRhombus(hv.x, hv.y, e);
  const ok = !isHeart(hv.x, hv.y) && (!t.cost || canAfford(t.cost, TWR[hv.x][hv.y] ? TWR[hv.x][hv.y].lvl + 1 : 1));
  cx.strokeStyle = ok ? 'rgba(255,255,255,.9)' : 'rgba(255,80,80,.9)'; cx.lineWidth = 2; cx.stroke();
}

/* ---------------- towers ---------------- */
function lvlPips(x, y, e, lv, col){
  for(let i = 0; i < lv; i++){ const [px, py] = iso(x, y, e); cx.fillStyle = col; cx.fillRect(px - 9 * Z + i * 7 * Z, py - 6 * Z, 5 * Z, 5 * Z); }
}
function drawTower(x, y, tw, e){
  const t = G.rt;
  if(tw.type === 'bow'){
    isoBox(x, y, e, .14, .95, '#b98348', '#8e5f31', '#6d4523');
    isoBox(x, y, e + .95, .32, .16, '#d49a5c', '#a8723e', '#80552c');
    const [px, py] = iso(x, y, e + 1.35);
    cx.strokeStyle = '#3b2412'; cx.lineWidth = 3 * Z; cx.beginPath(); cx.arc(px, py, 10 * Z, -2.3, -.8); cx.stroke();
    cx.strokeStyle = '#eee'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(px + Math.cos(-2.3) * 10 * Z, py + Math.sin(-2.3) * 10 * Z); cx.lineTo(px + Math.cos(-.8) * 10 * Z, py + Math.sin(-.8) * 10 * Z); cx.stroke();
    lvlPips(x, y, e + 1.12, tw.lvl, '#ffd23c');
  } else if(tw.type === 'blast'){
    const armed = tw.fuse >= 0 && ((t * 16) | 0) % 2 === 0;
    isoBox(x, y, e, .34, .62, armed ? '#ffffff' : '#d8433a', armed ? '#eeeeee' : '#a83128', armed ? '#dddddd' : '#7d2119');
    isoBox(x, y, e + .22, .355, .16, '#2b2b2b', '#ffd23c', '#e0b420');
    const [px, py] = iso(x, y, e + .7); cx.fillStyle = '#222'; cx.fillRect(px - 2 * Z, py - 8 * Z, 4 * Z, 8 * Z);
    if(tw.fuse >= 0) glow(px, py - 8 * Z, 18 * Z, '#ffd23c', .9);
  } else if(tw.type === 'fire'){
    const th = theme();
    isoBox(x, y, e, .32, .38, th.stone[2], th.stone[0], th.stone[1]);
    isoBox(x, y, e + .38, .24, .03, '#ffb03a', '#ff6a1a', '#d9420f');
    const [px, py] = iso(x, y, e + .6);
    glow(px, py, (26 + Math.sin(t * 9) * 4) * Z, '#ff8a1f', .9);
    lvlPips(x, y, e + .1, tw.lvl, '#ffb03a');
  } else if(tw.type === 'spire'){
    isoBox(x, y, e, .26, .2, '#7d879c', '#5f6a80', '#4b5467');
    const b = Math.sin(t * 2 + x) * .05;
    isoBox(x, y, e + .3 + b, .12, 1.05, '#e6ffff', '#6af7ff', '#1fb6d0');
    const [px, py] = iso(x, y, e + 1.35 + b); glow(px, py, 26 * Z, '#3ff0ff', .7);
    lvlPips(x, y, e + .22, tw.lvl, '#3ff0ff');
  }
}

/* ---------------- monsters ---------------- */
function drawMob(m){
  const d = m.d, hs = d.size / 2, hz = d.size * (d.fly ? .7 : .9);
  const bob = m.tx >= 0 ? Math.abs(Math.sin(m.t * 10)) * .08 : 0;
  const shake = m.digT > 0 ? Math.sin(m.t * 40) * .03 : 0;
  const x = m.x + shake, y = m.y, e = m.z + bob;
  if(!d.fly){ const [sx, sy] = iso(m.x, m.y, colH(m.cx, m.cy)); cx.fillStyle = 'rgba(0,0,0,.25)'; cx.beginPath(); cx.ellipse(sx, sy, hs * TW * Z * .9, hs * TH * Z * .9, 0, 0, TAU); cx.fill(); }
  const fl = m.flash > 0, col = fl ? '#ffffff' : d.col;
  if(d.fly){
    const [wx, wy] = iso(x, y, e + hz * .5), f = Math.sin(m.t * 22) * 8 * Z;
    cx.fillStyle = fl ? '#fff' : shadeHex(d.col, .8);
    cx.beginPath(); cx.moveTo(wx, wy); cx.lineTo(wx - 18 * Z, wy - 6 * Z - f); cx.lineTo(wx - 8 * Z, wy + 4 * Z); cx.fill();
    cx.beginPath(); cx.moveTo(wx, wy); cx.lineTo(wx + 18 * Z, wy - 6 * Z - f); cx.lineTo(wx + 8 * Z, wy + 4 * Z); cx.fill();
  }
  const bx = isoBox(x, y, e, hs, hz, fl ? '#fff' : shadeHex(d.col, 1.12), fl ? '#eee' : col, fl ? '#ddd' : shadeHex(d.col, .72));
  if(m.type === 'stomper'){ isoBox(x - hs * .5, y - hs * .5, e + hz, .06, .16, '#fff2a8', '#e6d890', '#c9bc70'); isoBox(x + hs * .5, y + hs * .5 - .1, e + hz, .06, .16, '#fff2a8', '#e6d890', '#c9bc70'); }
  if(m.type === 'mole'){ isoBox(x + m.dirx * hs, y + m.diry * hs, e + hz * .25, .09, .14, '#ffb3a0', '#e8907c', '#c46f5c'); }
  if(m.type === 'bug'){ const [px, py] = iso(x, y, e + hz); cx.fillStyle = '#2b1200'; cx.fillRect(px - 5 * Z, py - 2 * Z, 4 * Z, 4 * Z); cx.fillRect(px + 2 * Z, py - 1 * Z, 3 * Z, 3 * Z); if(((m.t * 4) | 0) % 2) glow(px, py, 12 * Z, '#ffb020', .6); }
  if(m.type === 'golem'){ const [px, py] = iso(x, y, e + hz * .55); cx.strokeStyle = 'rgba(40,40,50,.7)'; cx.lineWidth = 2 * Z; cx.beginPath(); cx.moveTo(px - 12 * Z, py - 10 * Z); cx.lineTo(px - 4 * Z, py); cx.lineTo(px - 8 * Z, py + 10 * Z); cx.stroke(); }
  // eyes on the face it is walking toward (facing away: you see its back)
  const eyes = (face, sgn) => {
    const ez = e + hz * .62, es = Math.max(2, 4 * Z * d.size / .4);
    for(const o of [-.42, .42]){
      const [px, py] = face === 'x' ? iso(x + hs, y + o * hs, ez) : iso(x + o * hs, y + hs, ez);
      cx.fillStyle = d.eye; cx.fillRect(px - es / 2, py - es / 2, es, es);
      if(m.type === 'golem') glow(px, py, es * 3, '#ff5a2a', .7);
    }
  };
  if(m.dirx > 0) eyes('x'); else if(m.diry > 0) eyes('y'); else if(d.fly) eyes('x');
  if(m.stun > 0){ const [px, py] = iso(x, y, e + hz + .25); for(let i = 0; i < 3; i++){ const a = G.rt * 6 + i * 2.1; cx.fillStyle = '#ffd23c'; cx.fillRect(px + Math.cos(a) * 9 * Z - 2, py + Math.sin(a) * 4 * Z - 2, 4, 4); } }
  if(m.hp < m.maxHp){
    const [px, py] = iso(x, y, e + hz + .35), w = Math.max(18, 34 * Z * d.size / .4);
    cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillRect(px - w / 2 - 1, py - 1, w + 2, 5);
    cx.fillStyle = m.hp / m.maxHp > .5 ? '#8fd14f' : m.hp / m.maxHp > .25 ? '#ffd23c' : '#ff3b5c'; cx.fillRect(px - w / 2, py, w * clamp(m.hp / m.maxHp, 0, 1), 3);
  }
}

/* ---------------- the Heart ---------------- */
function drawHeart(){
  if(G.state === 'dying' || (G.state === 'over' && G.heartHp <= 0)) return;
  const e = colH(C, C) + 1.15 + Math.sin(G.rt * 2) * .12, a = G.rt * .9;
  const [px, py] = iso(C, C, e);
  const pulse = 1 + (G.heartHp / G.heartMax < .3 ? Math.sin(G.rt * 10) * .08 : 0);
  glow(px, py, 70 * Z * pulse, G.heartFlash > 0 ? '#ff3b5c' : '#ff5ad9', .7);
  const r = .36 * pulse, top = iso(C, C, e + .55 * pulse), bot = iso(C, C, e - .55 * pulse);
  const ring = [0, 1, 2, 3].map(k => iso(C + Math.cos(a + k * Math.PI / 2) * r, C + Math.sin(a + k * Math.PI / 2) * r, e));
  const cols = ['#ffc2ec', '#ff5ad9', '#d12fa8', '#ff8ae3'];
  const faces = [];
  for(let k = 0; k < 4; k++){ const p1 = ring[k], p2 = ring[(k + 1) % 4]; const depth = (p1[1] + p2[1]) / 2; faces.push([bot, p1, p2, cols[(k + 2) % 4], depth - 1000]); faces.push([top, p1, p2, cols[k], depth]); }
  faces.sort((f1, f2) => f1[4] - f2[4]);
  for(const f of faces){ cx.beginPath(); cx.moveTo(...f[0]); cx.lineTo(...f[1]); cx.lineTo(...f[2]); cx.closePath(); cx.fillStyle = G.heartFlash > .5 ? '#ffffff' : f[3]; cx.fill(); cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 1; cx.stroke(); }
}

/* ---------------- effects ---------------- */
function drawFx(){
  for(const s of G.shots){
    const [a, b] = iso(s.x, s.y, s.z), [c0, d0] = iso(s.px == null ? s.x : s.px, s.py == null ? s.y : s.py, s.pz == null ? s.z : s.pz);
    cx.strokeStyle = '#fff3d0'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(c0 + (c0 - a) * 1.5, d0 + (d0 - b) * 1.5); cx.lineTo(a, b); cx.stroke();
  }
  cx.globalCompositeOperation = 'lighter';
  for(const bm of G.beams){
    const [a, b] = iso(bm.x1, bm.y1, bm.z1), [c0, d0] = iso(bm.x2, bm.y2, bm.z2);
    cx.strokeStyle = rgba(bm.c, .9); cx.lineWidth = 3; cx.beginPath(); cx.moveTo(a, b); cx.lineTo(c0, d0); cx.stroke();
    cx.strokeStyle = 'rgba(255,255,255,.8)'; cx.lineWidth = 1; cx.stroke();
  }
  cx.globalCompositeOperation = 'source-over';
  for(const p of G.parts){
    const [a, b] = iso(p.x, p.y, p.z), k = p.life / p.max, s = p.s * Z * (.6 + .4 * k) * 1.4;
    cx.globalAlpha = Math.min(1, k * 2); cx.fillStyle = p.c; cx.fillRect(a - s / 2, b - s / 2, s, s);
  }
  cx.globalAlpha = 1;
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(const p of G.pops){
    if(p.ring){ const [a, b] = iso(p.x, p.y, p.z), rx = p.r * TW * Z * .72; cx.strokeStyle = `rgba(255,220,140,${p.life / .4})`; cx.lineWidth = 4; cx.beginPath(); cx.ellipse(a, b, rx, rx / 2, 0, 0, TAU); cx.stroke(); continue; }
    const [a, b] = iso(p.x, p.y, p.z);
    cx.globalAlpha = Math.min(1, p.life / .35);
    cx.font = `900 ${Math.round(p.size * clamp(Z * 1.4, .8, 1.3))}px system-ui,sans-serif`;
    cx.lineWidth = 3.5; cx.strokeStyle = 'rgba(0,0,0,.75)'; cx.strokeText(p.txt, a, b); cx.fillStyle = p.c; cx.fillText(p.txt, a, b);
  }
  cx.globalAlpha = 1; cx.textBaseline = 'alphabetic';
}
function drawNightLight(){
  const dark = 1 - G.light; if(dark < .02) return;
  cx.fillStyle = `rgba(8,12,40,${.42 * dark})`; cx.fillRect(-50, -50, W + 100, H + 100);
  cx.globalCompositeOperation = 'lighter';
  const [hx, hy] = iso(C, C, colH(C, C) + 1.2); glow(hx, hy, 180 * Z, '#ff5ad9', .35 * dark);
  for(let x = 0; x < MAXS; x++) for(let y = 0; y < MAXS; y++){
    if(!inIsle(x, y)) continue;
    const tw = TWR[x][y];
    if(tw && tw.type === 'fire'){ const [a, b] = iso(x, y, colH(x, y) + .6); glow(a, b, 150 * Z, '#ff8a1f', .45 * dark); }
    if(tw && tw.type === 'spire'){ const [a, b] = iso(x, y, colH(x, y) + 1.2); glow(a, b, 110 * Z, '#3ff0ff', .35 * dark); }
    if(colH(x, y) === 1 && COL[x][y][0] === B.MAGMA){ const [a, b] = iso(x, y, 1); glow(a, b, 110 * Z, '#ff6a1a', .45 * dark); }
  }
  cx.globalCompositeOperation = 'source-over';
}
function drawTutHint(){
  if(!G.tut || G.state !== 'play' || G.tutStep !== 0) return;
  const tx = C + 2, ty = C;
  if(!inIsle(tx, ty)) return;
  const e = colH(tx, ty), [px, py] = iso(tx, ty, e), b = Math.abs(Math.sin(G.rt * 4)) * 10 * Z;
  topRhombus(tx, ty, e); cx.strokeStyle = `rgba(255,255,255,${.5 + .5 * Math.sin(G.rt * 6)})`; cx.lineWidth = 3; cx.stroke();
  cx.fillStyle = '#ffffff'; cx.beginPath(); cx.moveTo(px, py - 14 * Z - b); cx.lineTo(px - 11 * Z, py - 34 * Z - b); cx.lineTo(px + 11 * Z, py - 34 * Z - b); cx.closePath(); cx.fill();
}

function render(){
  sprCheck();
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.imageSmoothingEnabled = false;
  drawSky();
  const sh = save.opt.shake ? G.shake : 0;
  cx.save(); cx.translate((Math.random() * 2 - 1) * sh, (Math.random() * 2 - 1) * sh);
  drawIsland();
  drawFx();
  drawTutHint();
  drawNightLight();
  cx.restore();
  if(G.flash > 0){ cx.fillStyle = rgba(G.flashCol, Math.min(.4, G.flash * .35)); cx.fillRect(0, 0, W, H); }
}
