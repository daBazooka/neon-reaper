'use strict';
/* =====================================================================
   BO KATA — renderer. Everything is painted in code: festival skies,
   parallax skylines, rooftops with water tanks, clotheslines and dish
   antennas, eighteen hand-designed patangs, sagging threads, flyers
   and their spool-holding friends, pigeons, sky lanterns and rain.
   ===================================================================== */
const cv = $('c'), ctx = cv.getContext('2d');
const V = { W:0, H:0, dpr:1, z:.6, x:0, y:0, q:'high' };
let CITY = null, FAR = null, MID = null, SKYC = null, KSPR = {}, bakedFor = '';

function mk(w, h){ const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function resize(){
  V.W = innerWidth; V.H = innerHeight;
  V.dpr = Math.min(devicePixelRatio || 1, V.q === 'low' ? 1 : 2);
  cv.width = Math.round(V.W * V.dpr); cv.height = Math.round(V.H * V.dpr);
  cv.style.width = V.W + 'px'; cv.style.height = V.H + 'px';
  V.z = Math.min(V.H / 1280, V.W / 680);
  bakedFor = ''; KSPR = {};
}

/* ---------------- kite art ---------------- */
// the patang: a diamond with a bamboo spine and bow, and a little tail flap
const KW = 26, KT = 30, KB = 24;             // half width, top, bottom
const SHAPES = {
  patang:[0, -KT, KW, 0, 0, KB, -KW, 0],
  layang:[0, -32, 23, -2, 0, 26, -23, -2],
  wau:[0, -32, 7, -24, 35, -12, 27, -3, 8, 4, 25, 21, 13, 27, 0, 20, -13, 27, -25, 21, -8, 4, -27, -3, -35, -12, -7, -24],
  rokkaku:[-19, -29, 19, -29, 28, -7, 20, 26, -20, 26, -28, -7],
  pipa:[0, -31, 23, -12, 18, 11, 0, 25, -18, 11, -23, -12],
};
function kitePath(g, shape){ const p = SHAPES[shape || 'patang']; g.beginPath(); g.moveTo(p[0], p[1]); for(let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); }
function drawPattern(g, d){
  const c = d.c, P = d.pat;
  const fill = col => { g.fillStyle = col; g.fillRect(-40, -40, 80, 80); };
  const poly = (col, pts) => { g.fillStyle = col; g.beginPath(); g.moveTo(pts[0], pts[1]); for(let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); };
  const circ = (col, x, y, r) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  const star = (col, x, y, r, n) => { const pts = []; for(let i = 0; i < n * 2; i++){ const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * .45 : r; pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } poly(col, pts); };
  switch(P){
    case 'solid': fill(c[0]); poly(c[1], [0, -KT, 8, -KT + 10, 0, -KT + 20, -8, -KT + 10]); break;
    case 'moon': fill(c[0]); circ(c[1], -2, -2, 11); circ(c[0], 3, -5, 10); star(c[1], 8, -10, 5, 5); break;
    case 'split': fill(c[0]); g.fillStyle = c[1]; g.fillRect(0, -40, 40, 80); break;
    case 'quad': fill(c[1]); poly(c[0], [0, -40, -40, 0, 0, 0]); poly(c[0], [0, 0, 40, 0, 0, 40]); poly(c[2], [0, -9, 9, 0, 0, 9, -9, 0]); break;
    case 'band': fill(c[0]); g.fillStyle = c[1]; g.fillRect(-40, -6, 80, 12); g.fillRect(-2, -40, 4, 80); break;
    case 'eye': fill(c[0]); circ(c[1], 0, -2, 12); circ(c[2], 0, -2, 6); circ('#ffffff', 3, -5, 2.5); break;
    case 'chevron': fill(c[0]); for(let i = 0; i < 3; i++){ g.strokeStyle = i % 2 ? c[2] : c[1]; g.lineWidth = 5; g.beginPath(); g.moveTo(-30, -8 + i * 11); g.lineTo(0, -22 + i * 11); g.lineTo(30, -8 + i * 11); g.stroke(); } break;
    case 'star': fill(c[0]); star(c[1], 0, -3, 15, 5); break;
    case 'wave': fill(c[1]); for(let i = 0; i < 4; i++){ g.strokeStyle = i % 2 ? c[2] : c[0]; g.lineWidth = 5; g.beginPath(); for(let x = -30; x <= 30; x += 3) g.lineTo(x, -20 + i * 12 + Math.sin(x * .25) * 3); g.stroke(); } break;
    case 'dots': fill(c[1]); for(let y = -24; y < 24; y += 9) for(let x = -24; x < 24; x += 9) circ(c[0], x + ((y / 9) % 2 ? 4 : 0), y, 2.6); break;
    case 'sun': fill(c[0]); for(let i = 0; i < 12; i++){ const a = i / 12 * TAU; poly(c[2], [Math.cos(a - .12) * 9, -3 + Math.sin(a - .12) * 9, Math.cos(a) * 20, -3 + Math.sin(a) * 20, Math.cos(a + .12) * 9, -3 + Math.sin(a + .12) * 9]); } circ(c[1], 0, -3, 9); break;
    case 'lotus': fill(c[1]); for(let i = -2; i <= 2; i++){ g.save(); g.translate(0, 6); g.rotate(i * .42); g.fillStyle = c[0]; g.beginPath(); g.ellipse(0, -11, 5, 12, 0, 0, TAU); g.fill(); g.restore(); } poly(c[2], [-18, 12, 0, 8, 18, 12, 0, 16]); break;
    case 'tiger': fill(c[0]); g.strokeStyle = c[1]; g.lineWidth = 3.2; for(let i = -3; i <= 3; i++){ g.beginPath(); g.moveTo(-30, i * 8); g.quadraticCurveTo(-8, i * 8 + 5, -2, i * 8 - 2); g.moveTo(30, i * 8); g.quadraticCurveTo(8, i * 8 + 5, 2, i * 8 - 2); g.stroke(); } break;
    case 'peacock': fill(c[0]); g.fillStyle = c[1]; g.beginPath(); g.ellipse(0, -2, 13, 17, 0, 0, TAU); g.fill(); g.fillStyle = c[3]; g.beginPath(); g.ellipse(0, 0, 8, 11, 0, 0, TAU); g.fill(); g.fillStyle = c[2]; g.beginPath(); g.ellipse(0, 1, 4.5, 6, 0, 0, TAU); g.fill(); break;
    case 'rainbow': for(let i = 0; i < c.length; i++){ g.fillStyle = c[i]; g.fillRect(-40, -KT + i * (KT + KB) / c.length, 80, (KT + KB) / c.length + 1); } break;
    case 'flame': fill(c[0]); poly(c[1], [0, -24, 12, -2, 8, 14, 0, 18, -8, 14, -12, -2]); poly(c[2], [0, -10, 6, 2, 3, 12, -3, 12, -6, 2]); break;
    case 'bird': fill(c[0]); g.fillStyle = c[1]; g.beginPath(); g.moveTo(-22, -4); g.quadraticCurveTo(-8, -18, 0, -4); g.quadraticCurveTo(8, -18, 22, -4); g.quadraticCurveTo(8, -8, 0, 4); g.quadraticCurveTo(-8, -8, -22, -4); g.fill(); circ(c[2], 0, -3, 3); break;
    case 'leaf': fill(c[0]); g.fillStyle = c[1]; g.beginPath(); g.moveTo(0, -24); g.bezierCurveTo(20, -14, 16, 10, 0, 18); g.bezierCurveTo(-16, 10, -20, -14, 0, -24); g.fill(); g.strokeStyle = c[2]; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, -22); g.lineTo(0, 16); for(let i = -14; i < 12; i += 6){ g.moveTo(0, i); g.lineTo(8, i - 4); g.moveTo(0, i); g.lineTo(-8, i - 4); } g.stroke(); break;
    case 'spiral': fill(c[0]); g.strokeStyle = c[1]; g.lineWidth = 3.4; g.beginPath(); for(let a = 0; a < 18; a += .2){ const r = a * 1.35; g.lineTo(Math.cos(a) * r, -3 + Math.sin(a) * r); } g.stroke(); g.strokeStyle = c[2]; g.lineWidth = 1.8; g.beginPath(); for(let a = 0; a < 18; a += .2){ const r = a * 1.35; g.lineTo(Math.cos(a + Math.PI) * r, -3 + Math.sin(a + Math.PI) * r); } g.stroke(); break;
    case 'splash': fill(c[0]); { const rr = mulberry32(9); for(let i = 0; i < 14; i++) circ(c[1 + (i % (c.length - 1))], (rr() - .5) * 50, (rr() - .5) * 50, 3 + rr() * 8); } break;
    case 'diya': fill(c[0]); g.fillStyle = c[1]; g.beginPath(); g.ellipse(0, 8, 15, 7, 0, 0, Math.PI); g.fill(); g.fillRect(-15, 5, 30, 4); g.fillStyle = c[2]; g.beginPath(); g.moveTo(0, -16); g.quadraticCurveTo(7, -4, 0, 4); g.quadraticCurveTo(-7, -4, 0, -16); g.fill(); circ('rgba(255,230,120,.35)', 0, -6, 13); break;
    case 'mehendi': fill(c[0]); g.strokeStyle = c[1]; g.lineWidth = 1.3; for(let r = 5; r < 24; r += 5){ g.beginPath(); g.arc(0, -3, r, 0, TAU); g.stroke(); } for(let i = 0; i < 12; i++){ const a = i / 12 * TAU; circ(c[1], Math.cos(a) * 21, -3 + Math.sin(a) * 21, 2); } circ(c[1], 0, -3, 3); break;
    case 'checker': for(let y = -32; y < 32; y += 8) for(let x = -32; x < 32; x += 8){ g.fillStyle = ((x + y) / 8) % 2 ? c[0] : c[1]; g.fillRect(x, y, 8, 8); } break;
    case 'lantern': fill(c[0]); circ(rgba(c[1], .45), 0, -2, 18); g.fillStyle = c[1]; g.fillRect(-9, -14, 18, 24); g.fillStyle = c[2]; g.fillRect(-11, -16, 22, 4); g.fillRect(-11, 8, 22, 4); break;
    case 'floral': fill(c[0]); for(let i = 0; i < 8; i++){ const a = i / 8 * TAU; g.fillStyle = i % 2 ? c[1] : c[2]; g.beginPath(); g.ellipse(Math.cos(a) * 9, -4 + Math.sin(a) * 9, 7, 3.5, a, 0, TAU); g.fill(); } circ(c[3] || '#fff', 0, -4, 4); g.strokeStyle = c[1]; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-26, -8); g.quadraticCurveTo(-14, 4, 0, 14); g.quadraticCurveTo(14, 4, 26, -8); g.stroke(); break;
    case 'batik': fill(c[0]); g.strokeStyle = c[1]; g.lineWidth = 2; for(let y = -28; y < 30; y += 10) for(let x = -30; x < 32; x += 12){ g.beginPath(); g.arc(x + (y / 10 % 2 ? 6 : 0), y, 4, 0, TAU); g.stroke(); circ(c[2], x + (y / 10 % 2 ? 6 : 0), y, 1.4); } break;
    case 'dragon': fill(c[0]); g.strokeStyle = c[1]; g.lineWidth = 5; g.beginPath(); g.moveTo(-26, 16); g.bezierCurveTo(-20, -10, 0, 20, 8, -6); g.bezierCurveTo(14, -24, 24, -14, 20, -22); g.stroke(); circ(c[2], 20, -22, 3.5); g.fillStyle = c[1]; for(let i = 0; i < 5; i++) poly(c[2], [-22 + i * 7, 10 - i * 4, -18 + i * 7, 2 - i * 4, -15 + i * 7, 9 - i * 4]); break;
    case 'koi': fill(c[0]); g.fillStyle = c[1]; g.beginPath(); g.ellipse(0, -4, 8, 17, .3, 0, TAU); g.fill(); poly(c[1], [-4, 12, 4, 12, 9, 22, -9, 22]); circ(c[0], -5, -10, 3); circ(c[2], 3, -14, 2); circ(c[2], -4, 2, 2.5); break;
    case 'sakura': fill(c[0]); for(let k2 = 0; k2 < 3; k2++){ const cx = [-10, 10, 0][k2], cy = [-10, -2, 12][k2]; for(let i = 0; i < 5; i++){ const a = i / 5 * TAU - Math.PI / 2; g.fillStyle = c[1]; g.beginPath(); g.ellipse(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, 4.2, 2.6, a, 0, TAU); g.fill(); } circ(c[2], cx, cy, 1.6); } break;
    case 'crane': fill(c[0]); circ(c[2], 0, -18, 7); g.fillStyle = c[1]; g.beginPath(); g.moveTo(-26, 0); g.quadraticCurveTo(-10, -8, 0, 4); g.quadraticCurveTo(10, -8, 26, 0); g.quadraticCurveTo(10, 4, 2, 14); g.lineTo(-2, 14); g.quadraticCurveTo(-10, 4, -26, 0); g.fill(); break;
    case 'night': fill(c[0]); circ(c[1], 6, -8, 9); circ(c[0], 10, -11, 8); for(let i = 0; i < 7; i++) circ(c[1], -18 + (i * 37) % 30, -16 + (i * 23) % 26, 1.3); poly(c[2], [-26, 0, 0, 24, 26, 0, 0, 10]); break;
  }
}
function bakeKite(d, px){
  const S = Math.ceil(px * 1.35), c = mk(S, S), g = c.getContext('2d'), s = px / 64, sh = d.shape || 'patang';
  g.translate(S / 2, S / 2 - px * .02); g.scale(s, s);
  // tails: a paper flap for the patang, long ribbons for layang and pipa
  if(sh === 'patang'){ g.fillStyle = d.c[1] || d.c[0]; g.beginPath(); g.moveTo(0, KB - 2); g.lineTo(9, KB + 11); g.lineTo(-9, KB + 11); g.closePath(); g.fill(); }
  if(sh === 'layang' || sh === 'pipa'){ g.lineCap = 'round'; for(const [ox, col] of [[-3, d.c[0]], [3, d.c[1] || d.c[0]]]){ g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(ox, 22); for(let y = 22; y < 44; y += 3) g.lineTo(ox + Math.sin(y * .35 + ox) * 4, y); g.stroke(); } }
  g.save(); kitePath(g, sh); g.clip(); drawPattern(g, d);
  const gr = g.createLinearGradient(-KW, -KT, KW, KB); gr.addColorStop(0, 'rgba(255,255,255,.28)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.18)');
  g.fillStyle = gr; g.fillRect(-40, -40, 80, 80);
  g.restore();
  // bamboo frame
  g.strokeStyle = 'rgba(90,55,25,.8)'; g.lineWidth = 1.6;
  if(sh === 'rokkaku'){ g.beginPath(); g.moveTo(0, -29); g.lineTo(0, 26); g.moveTo(-28, -7); g.lineTo(28, -7); g.moveTo(-24, 12); g.lineTo(24, 12); g.stroke(); }
  else if(sh === 'wau'){ g.beginPath(); g.moveTo(0, -32); g.lineTo(0, 20); g.moveTo(-35, -12); g.quadraticCurveTo(0, -20, 35, -12); g.stroke();
    // the busur: the humming bow above the head
    g.strokeStyle = 'rgba(60,30,10,.85)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-30, -16); g.quadraticCurveTo(0, -44, 30, -16); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = .8; g.beginPath(); g.moveTo(-30, -16); g.lineTo(30, -16); g.stroke(); }
  else { g.beginPath(); g.moveTo(0, -KT); g.lineTo(0, KB); g.stroke(); g.beginPath(); g.moveTo(-KW, 0); g.quadraticCurveTo(0, -KT * .75, KW, 0); g.stroke(); }
  kitePath(g, sh); g.strokeStyle = 'rgba(40,20,10,.55)'; g.lineWidth = 1.2; g.stroke();
  return c;
}
function kiteSpr(d){
  const px = Math.max(40, 64 * 1.3 * V.z * V.dpr);
  const key = d.id + '@' + Math.round(px);
  return KSPR[key] || (KSPR[key] = bakeKite(d, px));
}
// a kite portrait for menus (CSS pixels)
function kiteIcon(d, size){ const c = bakeKite(d, size * Math.min(2, devicePixelRatio || 1)); c.style.width = c.style.height = size * 1.35 + 'px'; return c; }

/* ---------------- the city ---------------- */
function bakeCity(){
  const A = M.arena, key = A.id + '|' + V.z.toFixed(3) + '|' + V.dpr + '|' + SKY.roofs.length + '|' + SKY.roofs[0].x0;
  if(key === bakedFor) return; bakedFor = key;
  const s = V.z * V.dpr, top = GROUND - 760, H = GROUND - top + 40;
  CITY = { c:mk((WW + 400) * s, H * s), top, s };
  const g = CITY.c.getContext('2d'); g.scale(s, s); g.translate(200, -top);
  const night = A.mood === 'night', beach = A.mood === 'beach';
  for(const r of SKY.roofs){
    const rng = mulberry32(r.seed), w = r.x1 - r.x0, col = A.b[r.col];
    // walls
    const wg = g.createLinearGradient(0, r.y, 0, GROUND); wg.addColorStop(0, col); wg.addColorStop(1, mixHex(col, '#2a1a20', .45));
    g.fillStyle = wg; g.fillRect(r.x0, r.y, w, GROUND - r.y + 40);
    // side shade
    g.fillStyle = 'rgba(40,20,30,.12)'; g.fillRect(r.x1 - 10, r.y, 10, GROUND - r.y + 40);
    // windows
    const rows = Math.floor((GROUND - r.y - 30) / 70), cols = Math.max(1, Math.floor((w - 20) / 46));
    for(let i = 0; i < rows; i++) for(let j = 0; j < cols; j++){
      const wx = r.x0 + 14 + j * ((w - 28) / cols), wy = r.y + 34 + i * 70;
      const lit = night ? rng() < .55 : rng() < .08;
      g.fillStyle = lit ? (night ? pick(['#ffd27a', '#ffb85a', '#ffe7a8']) : '#fff1c8') : mixHex(col, '#1f2a3a', .55);
      g.fillRect(wx, wy, 20, 28);
      g.fillStyle = mixHex(col, '#ffffff', .25); g.fillRect(wx - 3, wy + 28, 26, 4);
      if(!night && rng() < .3){ g.fillStyle = pick(['#2f7a8a', '#8a4a3a', '#3a6a3a']); g.fillRect(wx - 2, wy - 4, 24, 5); }
    }
    if(beach){ g.strokeStyle = 'rgba(60,30,10,.18)'; g.lineWidth = 2; g.beginPath(); for(let x = r.x0 + 9; x < r.x1; x += 9){ g.moveTo(x, r.y); g.lineTo(x, GROUND); } g.stroke(); }
    // parapet
    g.fillStyle = mixHex(col, '#ffffff', .18); g.fillRect(r.x0 - 3, r.y - 12, w + 6, 12);
    g.fillStyle = A.trim; g.fillRect(r.x0 - 3, r.y - 14, w + 6, 3);
    if(r.style % 3 === 0) for(let x = r.x0 + 6; x < r.x1 - 6; x += 14){ g.fillStyle = mixHex(col, '#000000', .15); g.fillRect(x, r.y - 10, 6, 8); }
    // stair room (mumty)
    if(!r.flyer && w > 150 && rng() < .5){ const mx = r.x0 + w * rng() * .5 + 10, mw = 50; g.fillStyle = mixHex(col, '#ffffff', .1); g.fillRect(mx, r.y - 70, mw, 60); g.fillStyle = mixHex(col, '#000000', .35); g.fillRect(mx + 16, r.y - 50, 18, 40); g.fillStyle = A.trim; g.fillRect(mx - 4, r.y - 74, mw + 8, 6); }
    // dome (chhatri)
    if(r.dome){ const dx = r.x0 + w / 2; g.fillStyle = mixHex(col, '#ffffff', .15); g.fillRect(dx - 26, r.y - 50, 52, 40); g.beginPath(); g.arc(dx, r.y - 50, 30, Math.PI, 0); g.fill(); g.fillStyle = A.trim; g.fillRect(dx - 2, r.y - 92, 4, 14); }
    if(beach && !r.flyer && w > 120 && rng() < .6){ const hx = r.x0 + 14 + rng() * (w - 110), hw = 80; g.fillStyle = mixHex(col, '#fff4d8', .2); g.fillRect(hx, r.y - 44, hw, 32); g.fillStyle = '#8a4a22'; g.beginPath(); g.moveTo(hx - 14, r.y - 42); g.lineTo(hx + hw / 2, r.y - 80); g.lineTo(hx + hw + 14, r.y - 42); g.closePath(); g.fill(); g.strokeStyle = 'rgba(40,20,5,.3)'; g.lineWidth = 1.5; for(let k2 = 0; k2 < 5; k2++){ g.beginPath(); g.moveTo(hx - 10 + k2 * 4, r.y - 46 + k2 * .5); g.lineTo(hx + hw + 10 - k2 * 4, r.y - 46 + k2 * .5); g.stroke(); } r.tank = false; }
    // black water tank
    if(r.tank){ const tx = r.flyer ? r.x1 - 50 : r.x0 + 20 + rng() * (w - 70); g.fillStyle = '#26262c'; g.fillRect(tx, r.y - 58, 42, 46); g.beginPath(); g.ellipse(tx + 21, r.y - 58, 21, 6, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; for(let k2 = 0; k2 < 3; k2++){ g.beginPath(); g.moveTo(tx, r.y - 48 + k2 * 12); g.lineTo(tx + 42, r.y - 48 + k2 * 12); g.stroke(); } g.fillStyle = '#6a6a72'; g.fillRect(tx + 4, r.y - 12, 34, 4); }
    // dish antenna
    if(r.dish){ const dx = r.x0 + w * .7; g.strokeStyle = '#8a8a90'; g.lineWidth = 3; g.beginPath(); g.moveTo(dx, r.y - 12); g.lineTo(dx, r.y - 34); g.stroke(); g.fillStyle = '#d8d8dc'; g.beginPath(); g.ellipse(dx, r.y - 40, 14, 9, -.5, 0, TAU); g.fill(); }
    // clothesline with drying clothes
    if(r.cloth && w > 120){ const cx0 = r.x0 + 12, cx1 = r.x1 - 12, cy = r.y - 40; g.strokeStyle = 'rgba(60,50,50,.7)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(cx0, r.y - 12); g.lineTo(cx0, cy); g.quadraticCurveTo((cx0 + cx1) / 2, cy + 10, cx1, cy); g.lineTo(cx1, r.y - 12); g.stroke();
      for(let x = cx0 + 14; x < cx1 - 20; x += 22 + rng() * 14){ const t = (x - cx0) / (cx1 - cx0), yy = cy + Math.sin(t * Math.PI) * 9; g.fillStyle = pick(['#e23b3b', '#ffcf2e', '#2b59c3', '#ff7aa8', '#26b3a3', '#ffffff', '#7a4ad8']); g.fillRect(x, yy, 14 + rng() * 8, 16 + rng() * 10); } }
    // night: little string lights
    if(night && rng() < .5){ for(let x = r.x0 + 6; x < r.x1 - 6; x += 12){ g.fillStyle = pick(['#ffd27a', '#ff8a8a', '#8ad0ff', '#b8ff8a']); g.beginPath(); g.arc(x, r.y - 16 + Math.sin(x * .1) * 3, 2.2, 0, TAU); g.fill(); } }
  }
  if(beach){ const rp = mulberry32(77); for(let i = 0; i < 26; i++){ const px = rp() * WW, base = roofAt(px) + 60, h = 190 + rp() * 120; palm(g, px, Math.min(GROUND + 20, base + 200), h, rp); } }
  // street-level haze
  const hz = g.createLinearGradient(0, GROUND - 300, 0, GROUND + 40); hz.addColorStop(0, rgba(A.haze, 0)); hz.addColorStop(1, rgba(A.haze, .35));
  g.fillStyle = hz; g.fillRect(-200, GROUND - 300, WW + 400, 340);
  // parallax skylines
  const sil = (col, hmin, hmax, seed, win) => {
    const W2 = 2400, c = mk(W2 * s, 520 * s), q = c.getContext('2d'), rr = mulberry32(seed); q.scale(s, s);
    q.fillStyle = col; let x = 0;
    while(x < W2){ const w = 60 + rr() * 140, h = hmin + rr() * (hmax - hmin); q.fillRect(x, 520 - h, w + 1, h);
      if(rr() < .15){ q.beginPath(); q.arc(x + w / 2, 520 - h, Math.min(40, w / 2.2), Math.PI, 0); q.fill(); if(rr() < .5) q.fillRect(x + w / 2 - 2, 520 - h - 70, 4, 34); }
      if(win){ q.fillStyle = night ? 'rgba(255,210,130,.55)' : 'rgba(255,255,255,.12)'; for(let wy = 520 - h + 16; wy < 510; wy += 30) for(let wx = x + 8; wx < x + w - 10; wx += 22) if(rr() < (night ? .35 : .25)) q.fillRect(wx, wy, 7, 10); q.fillStyle = col; }
      x += w; }
    return c;
  };
  FAR = sil(A.far, 120, 300, 7, false); MID = sil(A.mid, 90, 250, 11, true);
  if(beach){ const q = MID.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, MID.width, MID.height); q.scale(s, s); const rp = mulberry32(5); for(let x = 30; x < 2400; x += 90 + rp() * 90){ q.globalAlpha = .9; palm(q, x, 520, 150 + rp() * 120, rp); } q.globalAlpha = 1;
    const f = FAR.getContext('2d'); f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, FAR.width, FAR.height); f.scale(s, s); f.fillStyle = A.far; let x = 0; const rr = mulberry32(8); while(x < 2400){ const w = 200 + rr() * 300, h = 60 + rr() * 110; f.beginPath(); f.moveTo(x, 520); f.quadraticCurveTo(x + w / 2, 520 - h * 2, x + w, 520); f.fill(); x += w * .7; } }
  // sky: gradient + sun + clouds, baked at screen size
  SKYC = mk(V.W * V.dpr, V.H * V.dpr);
  const sg = SKYC.getContext('2d'), SH = V.H * V.dpr, SW = V.W * V.dpr;
  const gr = sg.createLinearGradient(0, 0, 0, SH); gr.addColorStop(0, A.sky[0]); gr.addColorStop(.55, A.sky[1]); gr.addColorStop(1, A.sky[2]);
  sg.fillStyle = gr; sg.fillRect(0, 0, SW, SH);
  if(night){ const rs = mulberry32(3); for(let i = 0; i < 260; i++){ sg.fillStyle = `rgba(255,248,230,${.2 + rs() * .7})`; const r2 = rs() < .1 ? 1.6 : .9; sg.fillRect(rs() * SW, rs() * SH * .75, r2 * V.dpr, r2 * V.dpr); } }
  const sx = A.sun[1] * SW, sy = A.sun[2] * SH, sr = A.sun[3] * V.dpr * Math.max(.7, V.z * 1.4);
  const sgr = sg.createRadialGradient(sx, sy, 0, sx, sy, sr * 5); sgr.addColorStop(0, rgba(A.sun[0], .9)); sgr.addColorStop(.18, rgba(A.sun[0], .35)); sgr.addColorStop(1, rgba(A.sun[0], 0));
  sg.fillStyle = sgr; sg.fillRect(0, 0, SW, SH);
  sg.fillStyle = A.sun[0]; sg.beginPath(); sg.arc(sx, sy, sr, 0, TAU); sg.fill();
  if(night){ sg.fillStyle = A.sky[0]; sg.beginPath(); sg.arc(sx + sr * .45, sy - sr * .2, sr * .85, 0, TAU); sg.fill(); }
  if(A.mood === 'beach'){ const sy0 = SH * .7, sea = sg.createLinearGradient(0, sy0, 0, SH); sea.addColorStop(0, '#3fb0d0'); sea.addColorStop(1, '#1f6fa0'); sg.fillStyle = sea; sg.fillRect(0, sy0, SW, SH - sy0); const rs = mulberry32(4); sg.fillStyle = 'rgba(255,255,255,.5)'; for(let i = 0; i < 90; i++){ const y = sy0 + rs() * (SH - sy0); sg.fillRect(rs() * SW, y, (8 + rs() * 30) * V.dpr, 1.5 * V.dpr); } }
  const rc = mulberry32(21);
  for(let i = 0; i < 9 * A.clouds; i++){
    const cx = rc() * SW, cy = rc() * SH * .55, cw = (120 + rc() * 220) * V.dpr;
    sg.fillStyle = A.mood === 'rain' ? `rgba(120,135,150,${.35 + rc() * .3})` : night ? 'rgba(90,80,140,.25)' : `rgba(255,255,255,${.35 + rc() * .35})`;
    for(let k = 0; k < 6; k++){ sg.beginPath(); sg.ellipse(cx + (rc() - .5) * cw, cy + (rc() - .5) * cw * .15, cw * (.2 + rc() * .25), cw * (.1 + rc() * .1), 0, 0, TAU); sg.fill(); }
  }
}

function palm(g, x, y, h, rr){
  const lean = (rr() - .5) * 60;
  g.strokeStyle = '#6b4a2a'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * .3, y - h * .5, x + lean, y - h); g.stroke();
  const tx = x + lean, ty = y - h;
  for(let i = 0; i < 7; i++){ const a = -Math.PI / 2 + (i - 3) * .5 + (rr() - .5) * .2, L = 70 + rr() * 30; g.strokeStyle = i % 2 ? '#2f8a4a' : '#3fa35a'; g.lineWidth = 7; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * L * .6, ty + Math.sin(a) * L * .6 - 10, tx + Math.cos(a) * L, ty + Math.sin(a) * L + 30); g.stroke(); }
  g.fillStyle = '#6b4a2a'; g.beginPath(); g.arc(tx, ty + 6, 6, 0, TAU); g.fill();
}

/* ---------------- ambience ---------------- */
let BIRDS = [], LANTERNS = [], RAIN = [];
function ambienceInit(){
  BIRDS = []; for(let f = 0; f < 3; f++){ const cx = rnd(0, WW), cy = rnd(300, 900), d = Math.random() < .5 ? 1 : -1; for(let i = 0; i < 7; i++) BIRDS.push({ x:cx + i * 22 * -d + rnd(-10, 10), y:cy + Math.abs(i - 3) * 12 + rnd(-6, 6), d, ph:rnd(0, TAU), sp:rnd(80, 110) }); }
  LANTERNS = []; if(M.arena.mood === 'night') for(let i = 0; i < 40; i++) LANTERNS.push({ x:rnd(0, WW), y:rnd(200, GROUND), sp:rnd(12, 30), ph:rnd(0, TAU), s:rnd(.6, 1.2) });
  RAIN = []; if(M.arena.mood === 'rain') for(let i = 0; i < 160; i++) RAIN.push({ x:Math.random(), y:Math.random(), l:rnd(.5, 1) });
}
function stepAmbience(dt){
  for(const b of BIRDS){ b.x += b.d * b.sp * dt; b.ph += dt * 9; if(b.x < -300) b.x = WW + 300; if(b.x > WW + 300) b.x = -300; }
  for(const l of LANTERNS){ l.y -= l.sp * dt; l.x += Math.sin(l.ph + l.y * .01) * 6 * dt + M.wind.x * .15 * dt; if(l.y < -80){ l.y = GROUND - 200; l.x = rnd(0, WW); } }
}

/* ---------------- camera ---------------- */
function camFollow(dt, snap){
  const z = V.z, hw = V.W / 2 / z, hh = V.H / 2 / z;
  let tx, ty;
  const F = M.me, k = F && F.kite;
  if(M.mode === 'menu'){ tx = F.ax + 120; ty = F.ay - 380; }
  else if(k){ tx = k.x + k.vx * .25; ty = lerp(k.y, F.ay, .34) + k.vy * .15; }
  else { tx = F.ax; ty = F.ay - 380; }
  if(M.mode === 'duel' && M.over === false){ const o = M.flyers.find(q => !q.me); if(o && o.kite && k){ tx = lerp(tx, o.kite.x, .25); } }
  tx = clamp(tx, hw, WW - hw); ty = clamp(ty, CEIL - 120 + hh, GROUND + 80 - hh);
  if(snap){ V.x = tx; V.y = ty; } else { const f = Math.min(1, dt * 3.2); V.x += (tx - V.x) * f; V.y += (ty - V.y) * f; }
}

/* ---------------- draw ---------------- */
const tmpS = [];
function render(t){
  if(!M || !SKY) return;
  bakeCity();
  const g = ctx, d = V.dpr, z = V.z, A = M.arena;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(SKYC, 0, 0);
  let sx = 0, sy = 0; if(M.shake > .2){ sx = rnd(-1, 1) * M.shake; sy = rnd(-1, 1) * M.shake; }
  const ox = V.W / 2 - V.x * z + sx, oy = V.H / 2 - V.y * z + sy;
  // parallax skylines
  const par = (img, f, yoff) => {
    const iw = img.width / d, ih = img.height / d, x0 = ((-(V.x * z) * f) % iw + iw) % iw - iw, y = oy + (GROUND - yoff) * z - ih + (V.y * z - V.H / 2) * (1 - f) * .3;
    for(let x = x0; x < V.W; x += iw) g.drawImage(img, x * d, y * d, img.width, img.height);
  };
  g.setTransform(1, 0, 0, 1, 0, 0);
  par(FAR, .25, 330); par(MID, .5, 250);
  g.setTransform(d * z, 0, 0, d * z, d * ox, d * oy);
  const vx0 = V.x - V.W / 2 / z - 60, vx1 = V.x + V.W / 2 / z + 60;
  // lanterns behind everything
  if(LANTERNS.length){ for(const l of LANTERNS){ if(l.x < vx0 || l.x > vx1) continue; const fl = .8 + .2 * Math.sin(t * 7 + l.ph); const gr = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, 30 * l.s); gr.addColorStop(0, `rgba(255,200,110,${.55 * fl})`); gr.addColorStop(1, 'rgba(255,160,80,0)'); g.fillStyle = gr; g.fillRect(l.x - 30 * l.s, l.y - 30 * l.s, 60 * l.s, 60 * l.s); g.fillStyle = `rgba(255,${190 + 40 * fl | 0},120,.95)`; g.fillRect(l.x - 5 * l.s, l.y - 7 * l.s, 10 * l.s, 12 * l.s); } }
  // birds
  g.strokeStyle = A.mood === 'night' ? 'rgba(220,220,255,.5)' : 'rgba(40,40,60,.6)'; g.lineWidth = 2;
  for(const b of BIRDS){ if(b.x < vx0 || b.x > vx1) continue; const w = Math.sin(b.ph) * 5; g.beginPath(); g.moveTo(b.x - 8, b.y - w); g.lineTo(b.x, b.y); g.lineTo(b.x + 8, b.y - w); g.stroke(); }
  // city
  const cs = CITY.s;
  const sx0 = Math.max(0, (vx0 + 200) * cs), sx1 = Math.min(CITY.c.width, (vx1 + 200) * cs);
  if(sx1 > sx0) g.drawImage(CITY.c, sx0, 0, sx1 - sx0, CITY.c.height, sx0 / cs - 200, CITY.top, (sx1 - sx0) / cs, CITY.c.height / cs);
  // flyers on their roofs
  for(const F of M.flyers) if(F.ax > vx0 && F.ax < vx1) drawFlyer(g, F, t);
  // falling threads
  for(const f of M.falls){ g.strokeStyle = threadStroke(f.c, t, (1 - f.t / 2.2) * .9); g.lineWidth = 1.6 / z; g.beginPath(); g.moveTo(f.p[0], f.p[1]); for(let i = 2; i < f.p.length; i += 2) g.lineTo(f.p[i], f.p[i + 1]); g.stroke(); }
  // threads
  for(const F of M.flyers){
    if(!F.kite) continue;
    const c = stringCtrl(F), k = F.kite;
    if(F.me){ g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4.5 / z; g.beginPath(); g.moveTo(F.ax, F.ay); g.quadraticCurveTo(c[0], c[1], k.x, k.y); g.stroke(); }
    g.strokeStyle = threadStroke(F.thread, t, 1); g.lineWidth = (F.me ? 2.6 : 2) / z;
    g.beginPath(); g.moveTo(F.ax, F.ay); g.quadraticCurveTo(c[0], c[1], k.x, k.y); g.stroke();
  }
  // pench sparks glow
  for(const p of M.pench.values()){ if(p.gone > 0) continue; const r = 26 + Math.sin(t * 40) * 6, gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); gr.addColorStop(0, 'rgba(255,245,200,.9)'); gr.addColorStop(1, 'rgba(255,180,60,0)'); g.fillStyle = gr; g.fillRect(p.x - r, p.y - r, r * 2, r * 2); }
  // loose kites
  for(const q of M.loose){
    const a = q.landed ? 1 - q.landed : 1; g.globalAlpha = Math.max(0, a);
    g.strokeStyle = threadStroke(q.thread, t, .8); g.lineWidth = 1.4 / z; g.beginPath(); g.moveTo(q.x, q.y); g.quadraticCurveTo(q.x + q.tail[0] * .5 + Math.sin(q.t * 3) * 10, q.y + q.tail[1] * .6, q.x + q.tail[0], q.y + q.tail[1] + 40); g.stroke();
    drawKite(g, q.def, q.x, q.y, q.a);
    if(!q.landed && q.t > .6){ g.strokeStyle = `rgba(255,226,120,${.5 + .4 * Math.sin(t * 8)})`; g.lineWidth = 2.2 / z; g.setLineDash([6 / z, 6 / z]); g.beginPath(); g.arc(q.x, q.y, 56, 0, TAU); g.stroke(); g.setLineDash([]); }
    g.globalAlpha = 1;
  }
  // kites
  for(const F of M.flyers){
    const k = F.kite; if(!k) continue;
    if(k.pull && V.q !== 'low'){ g.strokeStyle = rgba('#ffffff', .25); g.lineWidth = 6 / z; g.lineCap = 'round'; g.beginPath(); for(let i = 0; i < k.trail.length; i += 2) i ? g.lineTo(k.trail[i], k.trail[i + 1]) : g.moveTo(k.trail[i], k.trail[i + 1]); g.stroke(); }
    drawKite(g, F.def, k.x, k.y, k.a);
    if(F.me && M.mode !== 'menu'){ g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2 / z; g.beginPath(); g.arc(k.x, k.y, 58 + Math.sin(t * 5) * 3, 0, TAU); g.stroke(); }
  }
  // effects
  for(const p of M.fx){
    const a = clamp(p.l * 2, 0, 1);
    if(p.k === 'spark'){ g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba(p.c, a); g.fillRect(p.x - p.s, p.y - p.s, p.s * 2, p.s * 2); g.globalCompositeOperation = 'source-over'; }
    else { g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.globalAlpha = a; g.fillStyle = p.c; g.fillRect(-p.s, -p.s * .6, p.s * 2, p.s * 1.2); g.restore(); g.globalAlpha = 1; }
  }
  // steering target for the player
  if(M.mode !== 'menu' && IN.down && save.opt.ctrl === 'point' && M.me.kite){ g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2 / z; g.beginPath(); g.arc(IN.wx, IN.wy, 16, 0, TAU); g.stroke(); }
  // rain
  if(RAIN.length){ g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = 'rgba(200,220,235,.45)'; g.lineWidth = 1.2 * d; g.beginPath(); for(const r of RAIN){ r.y += .016 * (1.2 + r.l); if(r.y > 1) { r.y -= 1; r.x = Math.random(); } const x = r.x * V.W * d, y = r.y * V.H * d; g.moveTo(x, y); g.lineTo(x - 8 * d, y + 22 * d * r.l); } g.stroke(); }
  // edge arrows toward rival kites and loot
  g.setTransform(d, 0, 0, d, 0, 0);
  if(M.mode !== 'menu') edgeArrows(g, ox, oy, t);
}
function threadStroke(c, t, a){
  if(c === 'rainbow') return `hsla(${(t * 90) % 360},90%,60%,${a})`;
  return a >= 1 ? c : rgba(c, a);
}
function drawKite(g, def, x, y, a){
  const s = kiteSpr(def);
  const size = 64 * 1.35 * 1.3;
  if(def.glow){ const gr = g.createRadialGradient(x, y, 0, x, y, 90); gr.addColorStop(0, 'rgba(255,200,110,.5)'); gr.addColorStop(1, 'rgba(255,160,80,0)'); g.fillStyle = gr; g.fillRect(x - 90, y - 90, 180, 180); }
  g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.drawImage(s, -size / 2, -size / 2, size, size); g.restore();
}
function drawFlyer(g, F, t){
  const x = F.ax, y = F.ay + 38, sk = SKIN[F.look.skin % SKIN.length], sh = SHIRT[F.look.shirt % SHIRT.length];
  const dir = F.kite ? Math.sign(F.kite.x - x) || 1 : F.spinDir;
  // spool holder friend (charkhi)
  const fx = x - dir * 30;
  g.fillStyle = '#3a2a30'; g.fillRect(fx - 5, y - 20, 4, 20); g.fillRect(fx + 1, y - 20, 4, 20);
  g.fillStyle = mixHex(sh, '#ffffff', .35); g.fillRect(fx - 7, y - 42, 14, 24);
  g.fillStyle = sk; g.beginPath(); g.arc(fx, y - 49, 7, 0, TAU); g.fill();
  g.fillStyle = '#1d1414'; g.beginPath(); g.arc(fx, y - 52, 7, Math.PI, 0); g.fill();
  // the spool
  const spin = F.kite && !F.kite.pull ? t * 14 : t * 2;
  const spc = F.spool ? F.spool.c : ['#c9923e', '#e8c07a']; g.save(); g.translate(fx + dir * 9, y - 30); g.rotate(spin); g.fillStyle = spc[0]; g.fillRect(-8, -2.5, 16, 5); g.fillRect(-2.5, -8, 5, 16); g.restore();
  g.fillStyle = spc[1]; g.beginPath(); g.arc(fx + dir * 9, y - 30, 4, 0, TAU); g.fill();
  // the flyer
  g.fillStyle = '#2b2b3a'; g.fillRect(x - 6, y - 24, 5, 24); g.fillRect(x + 1, y - 24, 5, 24);
  g.fillStyle = sh; g.fillRect(x - 9, y - 50, 18, 28);
  g.fillStyle = sk; g.beginPath(); g.arc(x, y - 58, 9, 0, TAU); g.fill();
  g.fillStyle = '#1d1414'; g.beginPath(); g.arc(x, y - 61, 9.2, Math.PI * 1.05, -.05); g.fill();
  // arm up toward the thread; tugs when pulling
  const ha = F.kite ? Math.atan2(F.kite.y - F.ay, F.kite.x - F.ax) : -Math.PI / 2 - .3 * dir;
  const tug = F.arm * Math.sin(t * 22) * 3;
  g.strokeStyle = sk; g.lineWidth = 5; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x + dir * 6, y - 46); g.lineTo(F.ax + Math.cos(ha) * (4 + tug), F.ay + Math.sin(ha) * (4 + tug)); g.stroke();
  g.beginPath(); g.moveTo(x - dir * 6, y - 46); g.lineTo(fx + dir * 6, y - 34); g.stroke();
  // shout bubble
  if(F.shout > 0){
    const a = Math.min(1, F.shout * 2);
    g.globalAlpha = a; g.fillStyle = '#ffffff'; g.font = '900 22px "Trebuchet MS", system-ui'; g.textAlign = 'center';
    const bx = x, by = y - 100 - (1.6 - F.shout) * 20;
    g.beginPath(); g.ellipse(bx, by, 62, 22, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(bx - 8, by + 18); g.lineTo(bx, by + 34); g.lineTo(bx + 6, by + 18); g.fill();
    g.fillStyle = '#d6282e'; g.fillText('BO KATA!', bx, by + 8); g.globalAlpha = 1;
  }
  // name tag
  if(M.mode !== 'menu'){
    g.font = `800 ${F.me ? 17 : 14}px "Trebuchet MS", system-ui`; g.textAlign = 'center';
    const nm = F.me || !F.human || save.opt.names ? F.name : 'Flyer ' + (F.id + 1);
    const ty = y - 84; g.lineWidth = 4; g.strokeStyle = 'rgba(20,10,20,.65)'; g.strokeText(nm, x, ty);
    g.fillStyle = F.me ? '#ffd23a' : F.out ? 'rgba(255,255,255,.4)' : '#ffffff'; g.fillText(nm, x, ty);
    // kites left
    const left = F.kitesLeft + (F.kite ? 1 : 0);
    for(let i = 0; i < 3; i++){ g.fillStyle = i < left ? (F.me ? '#ffd23a' : '#ffffff') : 'rgba(255,255,255,.2)'; g.save(); g.translate(x - 14 + i * 14, ty + 14); g.rotate(Math.PI / 4); g.fillRect(-4, -4, 8, 8); g.restore(); }
  }
}
function edgeArrows(g, ox, oy, t){
  const z = V.z, m = 26;
  const put = (wx, wy, col, big) => {
    const sx = ox + wx * z, sy = oy + wy * z;
    if(sx > 0 && sx < V.W && sy > 0 && sy < V.H) return;
    const cx = V.W / 2, cy = V.H / 2, dx = sx - cx, dy = sy - cy, k = Math.min((V.W / 2 - m) / Math.abs(dx || 1), (V.H / 2 - m) / Math.abs(dy || 1));
    const px = cx + dx * k, py = cy + dy * k, a = Math.atan2(dy, dx);
    g.save(); g.translate(px, py); g.rotate(a); g.fillStyle = col; g.globalAlpha = .85;
    g.beginPath(); g.moveTo(big ? 14 : 10, 0); g.lineTo(-8, big ? -9 : -7); g.lineTo(-8, big ? 9 : 7); g.closePath(); g.fill(); g.restore(); g.globalAlpha = 1;
  };
  for(const F of M.flyers) if(!F.me && F.kite) put(F.kite.x, F.kite.y, '#ffffff', false);
  for(const q of M.loose) if(!q.landed && !q.gone) put(q.x, q.y, '#ffd23a', true);
}
