'use strict';
const cv = $('c'), cx = cv.getContext('2d', { alpha:false });
let W = 0, H = 0, DPR = 1, bgC = null, starC = null;
const sx = x => (x - G.camX) * G.camZ + W / 2, sy = y => (y - G.camY) * G.camZ + H / 2;

const glowC = new Map();
function glowSpr(col){
  let c = glowC.get(col); if(c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(col, .9)); gr.addColorStop(.25, rgba(col, .38)); gr.addColorStop(.6, rgba(col, .08)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); if(glowC.size > 80) glowC.clear(); glowC.set(col, c); return c;
}
function glow(x, y, r, col, a){ if(a <= 0 || r <= 0 || col[0] !== '#') return; cx.globalAlpha = Math.min(1, a); cx.drawImage(glowSpr(col), x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1; }

function resize(){
  W = innerWidth; H = innerHeight;
  DPR = Math.min(window.devicePixelRatio || 1, G.q === 'low' ? 1 : 2);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  // the void: a cached backdrop with nebula glows
  bgC = document.createElement('canvas'); bgC.width = Math.max(2, W >> 1); bgC.height = Math.max(2, H >> 1);
  const g = bgC.getContext('2d'), w = bgC.width, h = bgC.height;
  g.fillStyle = '#05040c'; g.fillRect(0, 0, w, h);
  const neb = (x, y, r, c) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
  neb(w * .15, h * .2, Math.max(w, h) * .6, 'rgba(120,20,70,.35)');
  neb(w * .9, h * .85, Math.max(w, h) * .6, 'rgba(20,40,140,.35)');
  neb(w * .6, h * .1, Math.max(w, h) * .4, 'rgba(60,20,120,.25)');
  if(!starC){
    starC = document.createElement('canvas'); starC.width = starC.height = 512;
    const s = starC.getContext('2d'), r = mulberry32(3);
    for(let i = 0; i < 160; i++){ s.fillStyle = `rgba(${200 + r() * 55 | 0},${200 + r() * 55 | 0},255,${.2 + r() * .7})`; const z = r() < .1 ? 2 : 1; s.fillRect(r() * 512, r() * 512, z, z); }
  }
}

/* ---------------- background & arena ---------------- */
function drawBg(){
  cx.drawImage(bgC, 0, 0, W, H);
  // stars (slow parallax)
  const ox = -(G.camX * .15 % 512) - 512, oy = -(G.camY * .15 % 512) - 512;
  for(let x = ox; x < W; x += 512) for(let y = oy; y < H; y += 512) cx.drawImage(starC, x, y);
  const Z = G.camZ, mx = sx(0), my = sy(0), R = ARENA_R * Z;
  // colossal clock rings turning in the void behind the arena
  cx.lineCap = 'butt';
  const rings = [[1.28, .05, 22, .08, '#ff3cac'], [1.55, -.03, 60, .06, '#27f3ff'], [1.9, .018, 12, .05, '#9b4bff']];
  for(const [k, sp, seg, a, c] of rings){
    cx.strokeStyle = rgba(c, a * 2); cx.lineWidth = Math.max(2, 10 * Z);
    const rr = R * k, rot = G.rt * sp;
    cx.beginPath();
    for(let i = 0; i < seg; i++){ const a0 = rot + i / seg * TAU, a1 = a0 + TAU / seg * .6; cx.moveTo(mx + Math.cos(a0) * rr, my + Math.sin(a0) * rr); cx.arc(mx, my, rr, a0, a1); }
    cx.stroke();
  }
  // roman hours far outside the arena
  cx.fillStyle = 'rgba(255,255,255,.07)'; cx.font = `900 ${Math.round(70 * Z)}px Georgia,serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  const HR = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
  for(let i = 0; i < 12; i++){ const a = -Math.PI / 2 + i / 12 * TAU - G.rt * .01; cx.fillText(HR[i], mx + Math.cos(a) * R * 1.42, my + Math.sin(a) * R * 1.42); }
  // arena floor
  const fg = cx.createRadialGradient(mx, my, R * .1, mx, my, R);
  fg.addColorStop(0, '#141029'); fg.addColorStop(1, '#0a0816');
  cx.fillStyle = fg; cx.beginPath(); cx.arc(mx, my, R, 0, TAU); cx.fill();
  drawGrid();
  // edge + hour ticks
  cx.strokeStyle = 'rgba(39,243,255,.12)'; cx.lineWidth = 26 * Z; cx.beginPath(); cx.arc(mx, my, R, 0, TAU); cx.stroke();
  cx.strokeStyle = 'rgba(160,220,255,.7)'; cx.lineWidth = Math.max(2, 3 * Z); cx.stroke();
  for(let i = 0; i < 60; i++){
    const a = -Math.PI / 2 + i / 60 * TAU, big = i % 5 === 0, l = (big ? 34 : 14) * Z;
    const lit = (i / 60) <= G.clock / ECHO_T;
    cx.strokeStyle = lit ? (big ? '#ffffff' : 'rgba(39,243,255,.9)') : (big ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.12)');
    cx.lineWidth = big ? Math.max(2, 5 * Z) : Math.max(1, 2 * Z);
    cx.beginPath(); cx.moveTo(mx + Math.cos(a) * (R - 6 * Z), my + Math.sin(a) * (R - 6 * Z)); cx.lineTo(mx + Math.cos(a) * (R - 6 * Z - l), my + Math.sin(a) * (R - 6 * Z - l)); cx.stroke();
  }
  // the sweeping clock hand: when it reaches the top, a new echo is born
  const k = G.clock / ECHO_T, ha = -Math.PI / 2 + k * TAU;
  cx.globalCompositeOperation = 'lighter';
  for(let i = 0; i < 14; i++){
    const a0 = ha - (i + 1) * .045, a1 = ha - i * .045;
    cx.fillStyle = rgba(echoColHex(), .16 * (1 - i / 14) * (.5 + k * .5));
    cx.beginPath(); cx.moveTo(mx, my); cx.arc(mx, my, R - 8 * Z, a0, a1); cx.closePath(); cx.fill();
  }
  cx.strokeStyle = rgba(echoColHex(), .28); cx.lineWidth = Math.max(1.5, 2 * Z);
  cx.beginPath(); cx.moveTo(mx, my); cx.lineTo(mx + Math.cos(ha) * (R - 8 * Z), my + Math.sin(ha) * (R - 8 * Z)); cx.stroke();
  glow(mx + Math.cos(ha) * (R - 8 * Z), my + Math.sin(ha) * (R - 8 * Z), 40 * Z, echoColHex(), .9);
  if(k > .9) glow(mx, my - R, (60 + 200 * (k - .9) * 10) * Z, echoColHex(), (k - .9) * 8);
  cx.globalCompositeOperation = 'source-over';
  cx.fillStyle = '#0a0816'; cx.beginPath(); cx.arc(mx, my, 16 * Z, 0, TAU); cx.fill();
  cx.strokeStyle = rgba(echoColHex(), .9); cx.lineWidth = 3; cx.stroke();
}
function echoColHex(){ const s = skin(); return s.e === 'glitch' ? '#b8f6ff' : s.e; }
function drawGrid(){
  const Z = G.camZ, R2 = (ARENA_R - 4) ** 2;
  const vx0 = G.camX - W / 2 / Z - GS, vx1 = G.camX + W / 2 / Z + GS, vy0 = G.camY - H / 2 / Z - GS, vy1 = G.camY + H / 2 / Z + GS;
  const i0 = Math.max(0, Math.floor((vx0 + ARENA_R) / GS)), i1 = Math.min(GN - 1, Math.ceil((vx1 + ARENA_R) / GS));
  const j0 = Math.max(0, Math.floor((vy0 + ARENA_R) / GS)), j1 = Math.min(GN - 1, Math.ceil((vy1 + ARENA_R) / GS));
  cx.strokeStyle = 'rgba(70,120,255,.2)'; cx.lineWidth = Math.max(1, 1.4 * Z);
  cx.beginPath();
  const pt = (i, j) => { const k = j * GN + i, x = -ARENA_R + i * GS, y = -ARENA_R + j * GS; return [x + grid.ox[k], y + grid.oy[k], x * x + y * y < R2]; };
  for(let j = j0; j <= j1; j++){ let on = false; for(let i = i0; i <= i1; i++){ const [x, y, ok] = pt(i, j); if(!ok){ on = false; continue; } if(on) cx.lineTo(sx(x), sy(y)); else { cx.moveTo(sx(x), sy(y)); on = true; } } }
  for(let i = i0; i <= i1; i++){ let on = false; for(let j = j0; j <= j1; j++){ const [x, y, ok] = pt(i, j); if(!ok){ on = false; continue; } if(on) cx.lineTo(sx(x), sy(y)); else { cx.moveTo(sx(x), sy(y)); on = true; } } }
  cx.stroke();
  // bright nodes where the floor is disturbed
  cx.globalCompositeOperation = 'lighter'; cx.fillStyle = 'rgba(120,200,255,.8)';
  for(let j = j0; j <= j1; j++) for(let i = i0; i <= i1; i++){ const k = j * GN + i, d = Math.abs(grid.ox[k]) + Math.abs(grid.oy[k]); if(d < 4) continue; const x = -ARENA_R + i * GS, y = -ARENA_R + j * GS; if(x * x + y * y > R2) continue; const s = Math.min(4, d / 6) * Z + 1; cx.globalAlpha = Math.min(1, d / 30); cx.fillRect(sx(x + grid.ox[k]) - s / 2, sy(y + grid.oy[k]) - s / 2, s, s); }
  cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
}

/* ---------------- characters ---------------- */
// the ronin glyph: a sharp diamond body with a trailing blade
function drawGlyph(x, y, a, s, c1, c2, alpha, dashing){
  cx.save(); cx.translate(x, y); cx.rotate(a); cx.globalAlpha = alpha;
  cx.fillStyle = '#0a0816'; cx.strokeStyle = c2; cx.lineWidth = Math.max(1.5, 2.5 * s / 15); cx.lineJoin = 'round';
  cx.beginPath(); cx.moveTo(s * 1.35, 0); cx.lineTo(0, s * .8); cx.lineTo(-s * .9, s * .35); cx.lineTo(-s * .55, 0); cx.lineTo(-s * .9, -s * .35); cx.lineTo(0, -s * .8); cx.closePath(); cx.fill(); cx.stroke();
  cx.fillStyle = c1; cx.beginPath(); cx.moveTo(s * .7, 0); cx.lineTo(s * .1, s * .25); cx.lineTo(s * .1, -s * .25); cx.closePath(); cx.fill();
  // blade
  cx.strokeStyle = c1; cx.lineWidth = Math.max(1.5, 2.2 * s / 15); cx.lineCap = 'round';
  const bl = dashing ? s * 2.6 : s * 1.9, ba = dashing ? 0 : .9;
  cx.beginPath(); cx.moveTo(s * .2, s * .5); cx.lineTo(s * .2 + Math.cos(ba) * bl, s * .5 + Math.sin(ba) * bl); cx.stroke();
  cx.restore(); cx.globalAlpha = 1;
}
function drawPlayer(){
  const Z = G.camZ, s = skin(), c2 = skinCol(), x = sx(P.x), y = sy(P.y), sz = P.r * Z * 1.2;
  if(G.state === 'dying') return;
  // afterimages
  if(P.trail.length > 1){ cx.globalCompositeOperation = 'lighter'; cx.strokeStyle = c2; cx.lineCap = 'round'; for(let i = 1; i < P.trail.length; i++){ const a = P.trail[i - 1], b = P.trail[i]; cx.globalAlpha = b.life / .22 * .7; cx.lineWidth = 14 * Z * b.life / .22 + 1; cx.beginPath(); cx.moveTo(sx(a.x), sy(a.y)); cx.lineTo(sx(b.x), sy(b.y)); cx.stroke(); } cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over'; }
  for(const t of P.trail){ drawGlyph(sx(t.x), sy(t.y), t.a, sz, c2, c2, t.life / .22 * .45, true); }
  if(P.inv > 0 && P.dashT <= 0 && G.ultT <= 0 && ((G.rt * 16) | 0) % 2) return;
  cx.globalCompositeOperation = 'lighter'; glow(x, y, 60 * Z, c2[0] === '#' ? c2 : '#ffffff', .55); cx.globalCompositeOperation = 'source-over';
  drawGlyph(x, y, P.ang, sz, s.c1, c2, 1, P.dashT > 0);
  // echo timer: a ring that closes every 5 s, when your past self joins
  if(G.state === 'play'){
    const k = G.clock / ECHO_T, rr = sz * 2.6, ec = echoColHex();
    cx.strokeStyle = 'rgba(255,255,255,.08)'; cx.lineWidth = 3; cx.beginPath(); cx.arc(x, y, rr, 0, TAU); cx.stroke();
    cx.strokeStyle = rgba(ec, .5 + .5 * k); cx.lineWidth = k > .85 ? 4 : 3; cx.beginPath(); cx.arc(x, y, rr, -Math.PI / 2, -Math.PI / 2 + TAU * k); cx.stroke();
    if(k > .85){ cx.globalCompositeOperation = 'lighter'; glow(x, y - rr, 16, ec, (k - .85) * 6); cx.globalCompositeOperation = 'source-over'; }
  }
  // cooldown pips under the player
  if(P.slamCd > 0){ cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 3; cx.beginPath(); cx.arc(x, y, sz * 3.1, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - P.slamCd / slamCdMax())); cx.stroke(); }
}
function drawEchoes(){
  const Z = G.camZ, c = echoColHex(), sz = 17 * Z * 1.2;
  G.EC.forEach((e, i) => {
    const x = sx(e.x), y = sy(e.y), a = e.born > 0 ? 1 - e.born / .5 : 1;
    cx.globalCompositeOperation = 'lighter'; glow(x, y, 46 * Z, c, .35 * a); cx.globalCompositeOperation = 'source-over';
    if(e.glitch > 0){ drawGlyph(x - 5, y, e.a, sz, '#ff2e4d', '#ff2e4d', .5, e.d); drawGlyph(x + 5, y, e.a, sz, '#27f3ff', '#27f3ff', .5, e.d); }
    const flick = .55 + .12 * Math.sin(G.rt * 30 + i);
    drawGlyph(x, y, e.a, sz, c, c, flick * a, e.d);
    cx.fillStyle = rgba(c, .9 * a); cx.font = `900 ${Math.round(Math.max(10, 12 * Z))}px system-ui,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText(ROMAN[Math.min(7, i)], x, y - sz * 2.2);
  });
}
function enemyPath(e, r){
  const t = e.type, a = Math.atan2(e.vy, e.vx);
  cx.beginPath();
  if(t === 'drone'){ cx.moveTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4); cx.lineTo(Math.cos(a + 2.4) * r, Math.sin(a + 2.4) * r); cx.lineTo(Math.cos(a + Math.PI) * r * .4, Math.sin(a + Math.PI) * r * .4); cx.lineTo(Math.cos(a - 2.4) * r, Math.sin(a - 2.4) * r); }
  else if(t === 'brute' || e.boss === 'metronome'){ for(let i = 0; i < 6; i++){ const b = i / 6 * TAU + e.t * .3; const rr = r * (i % 2 ? .92 : 1.08); i ? cx.lineTo(Math.cos(b) * rr, Math.sin(b) * rr) : cx.moveTo(Math.cos(b) * rr, Math.sin(b) * rr); } }
  else if(t === 'caster'){ cx.moveTo(0, -r * 1.3); cx.lineTo(r * .9, 0); cx.lineTo(0, r * 1.3); cx.lineTo(-r * .9, 0); }
  else if(t === 'leaper'){ const b = a; cx.moveTo(Math.cos(b) * r * 1.3, Math.sin(b) * r * 1.3); cx.lineTo(Math.cos(b + 2) * r * 1.1, Math.sin(b + 2) * r * 1.1); cx.lineTo(Math.cos(b + Math.PI) * r * .2, Math.sin(b + Math.PI) * r * .2); cx.lineTo(Math.cos(b - 2) * r * 1.1, Math.sin(b - 2) * r * 1.1); }
  else if(t === 'eater'){ const m = .6 + .4 * Math.abs(Math.sin(e.t * 8)); cx.arc(0, 0, r, a + m * .6, a - m * .6 + TAU); cx.lineTo(0, 0); }
  else if(t === 'splitter'){ for(let i = 0; i < 3; i++){ const b = i / 3 * TAU + e.t; cx.moveTo(Math.cos(b) * r * .45 + r * .55, Math.sin(b) * r * .45); cx.arc(Math.cos(b) * r * .45, Math.sin(b) * r * .45, r * .55, 0, TAU); } }
  else if(t === 'warden'){ cx.rect(-r * .8, -r * .8, r * 1.6, r * 1.6); }
  else { for(let i = 0; i < 4; i++){ const b = i / 4 * TAU + Math.PI / 4; const rr = r * 1.1; i ? cx.lineTo(Math.cos(b) * rr, Math.sin(b) * rr) : cx.moveTo(Math.cos(b) * rr, Math.sin(b) * rr); } }
  cx.closePath();
}
function drawEnemy(e){
  const Z = G.camZ, x = sx(e.x), y = sy(e.y), born = e.born > 0 ? 1 - e.born / .45 : 1;
  const lift = e.air ? Math.sin((1 - e.stT / .95) * Math.PI) * 60 : 0;
  const r = e.r * Z * (e.air ? 1 + lift / 120 : 1), col = e.d.col;
  if(e.air){ cx.fillStyle = 'rgba(0,0,0,.4)'; cx.beginPath(); cx.ellipse(x, y, r, r * .5, 0, 0, TAU); cx.fill(); }
  const yy = y - lift * Z;
  cx.globalCompositeOperation = 'lighter'; glow(x, yy, r * 2.6, col, .45 * born); cx.globalCompositeOperation = 'source-over';
  cx.save(); cx.translate(x, yy); cx.scale(born, born);
  if(e.boss === 'king'){
    cx.rotate(e.st === 'dash' || e.st === 'wind' ? e.ca + Math.PI / 2 : Math.sin(e.t) * .1);
    cx.beginPath(); cx.moveTo(0, -r * 1.5); cx.lineTo(r, 0); cx.lineTo(0, r * 1.3); cx.lineTo(-r, 0); cx.closePath();
  } else enemyPath(e, r);
  if(e.flash > 0){ cx.fillStyle = '#ffffff'; cx.fill(); }
  else {
    const fg = cx.createRadialGradient(-r * .3, -r * .3, r * .1, 0, 0, r * 1.3);
    fg.addColorStop(0, mixHex(col, '#ffffff', .35)); fg.addColorStop(.5, col); fg.addColorStop(1, mixHex(col, '#000000', .55));
    cx.fillStyle = fg; cx.fill();
  }
  cx.lineJoin = 'round';
  cx.globalCompositeOperation = 'lighter'; cx.strokeStyle = rgba(col, .35); cx.lineWidth = Math.max(5, (e.boss ? 14 : 8) * Z); cx.stroke(); cx.globalCompositeOperation = 'source-over';
  cx.strokeStyle = e.flash > 0 ? '#ffffff' : mixHex(col, '#ffffff', .35); cx.lineWidth = Math.max(2, (e.boss ? 4 : 2.2) * Z); cx.stroke();
  // eye
  const ea = Math.atan2(P.y - e.y, P.x - e.x);
  cx.fillStyle = '#12061a'; cx.fillRect(Math.cos(ea) * r * .3 - r * .3, Math.sin(ea) * r * .3 - r * .13, r * .6, r * .26); cx.fillStyle = '#ffffff';
  cx.fillRect(Math.cos(ea) * r * .3 - r * .22, Math.sin(ea) * r * .3 - r * .07, r * .44, r * .14);
  if(e.boss === 'king'){ cx.fillStyle = col; for(let i = -1; i <= 1; i++){ cx.beginPath(); cx.moveTo(i * r * .4 - r * .15, -r * 1.35); cx.lineTo(i * r * .4, -r * 1.9); cx.lineTo(i * r * .4 + r * .15, -r * 1.35); cx.fill(); } }
  cx.restore();
  // metronome pendulum
  if(e.boss === 'metronome'){
    const pa = Math.PI / 2 + (e.swing || 0), L = r * 1.9;
    cx.strokeStyle = col; cx.lineWidth = Math.max(3, 6 * Z); cx.beginPath(); cx.moveTo(x, yy); cx.lineTo(x + Math.cos(pa) * L, yy + Math.sin(pa) * L); cx.stroke();
    cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(x + Math.cos(pa) * L, yy + Math.sin(pa) * L, r * .28, 0, TAU); cx.fill();
  }
  if(e.mark > 0){ const c = echoColHex(); cx.strokeStyle = rgba(c, Math.min(1, e.mark * 1.5)); cx.lineWidth = Math.max(2, 3 * Z); cx.setLineDash([6 * Z, 5 * Z]); cx.lineDashOffset = -G.rt * 40; cx.beginPath(); cx.arc(x, yy, r * 1.55, 0, TAU); cx.stroke(); cx.setLineDash([]); cx.globalCompositeOperation = 'lighter'; glow(x, yy, r * 2.4, c, .35 * e.mark); cx.globalCompositeOperation = 'source-over'; }
  if(e.shield > 0){ cx.strokeStyle = 'rgba(57,208,255,.8)'; cx.lineWidth = 2; cx.beginPath(); for(let i = 0; i <= 6; i++){ const b = i / 6 * TAU + e.t; const px = x + Math.cos(b) * r * 1.6, py = yy + Math.sin(b) * r * 1.6; i ? cx.lineTo(px, py) : cx.moveTo(px, py); } cx.stroke(); cx.fillStyle = 'rgba(57,208,255,.1)'; cx.fill(); }
  // telegraphs
  if(e.st === 'wind' && e.d.charge && !e.boss){ const L = 320 * Z; cx.fillStyle = `rgba(255,122,26,${.15 + .2 * Math.sin(G.rt * 30)})`; cx.save(); cx.translate(x, y); cx.rotate(e.ca); cx.fillRect(0, -r, L, r * 2); cx.restore(); }
  if(e.st === 'wind' && e.boss === 'king'){ cx.strokeStyle = 'rgba(192,75,255,.7)'; cx.setLineDash([10, 8]); cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + Math.cos(e.ca) * 510 * Z, y + Math.sin(e.ca) * 510 * Z); cx.stroke(); cx.setLineDash([]); }
  if(e.st === 'wind' && e.d.shoot){ cx.globalCompositeOperation = 'lighter'; glow(x, y, r * (1 + (1 - e.stT / .55) * 2), col, .9); cx.globalCompositeOperation = 'source-over'; }
  if(e.air){ const tx = sx(e.jx), ty = sy(e.jy), k = 1 - e.stT / .95; cx.strokeStyle = `rgba(255,208,0,${.4 + .5 * k})`; cx.lineWidth = 2.5; cx.beginPath(); cx.arc(tx, ty, 70 * Z, 0, TAU); cx.stroke(); cx.fillStyle = `rgba(255,208,0,${.12 * k})`; cx.beginPath(); cx.arc(tx, ty, 70 * Z * k, 0, TAU); cx.fill(); }
  // hp bar for big ones
  if(!e.boss && e.maxHp > 60 && e.hp < e.maxHp){ const w = r * 2.2; cx.fillStyle = 'rgba(0,0,0,.6)'; cx.fillRect(x - w / 2, yy - r - 12, w, 4); cx.fillStyle = col; cx.fillRect(x - w / 2, yy - r - 12, w * Math.max(0, e.hp / e.maxHp), 4); }
}
function drawHazards(){
  const Z = G.camZ;
  for(const h of G.HZ){
    if(h.kind === 'trail'){ const k = h.life / 1.1; cx.globalCompositeOperation = 'lighter'; cx.strokeStyle = rgba('#ff7a1a', .6 * k); cx.lineWidth = 12 * Z * k + 2; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(sx(h.x1), sy(h.y1)); cx.lineTo(sx(h.x2), sy(h.y2)); cx.stroke(); cx.globalCompositeOperation = 'source-over'; }
    else if(h.kind === 'blade'){
      const x = sx(h.x), y = sy(h.y), L = h.len * Z;
      if(h.t < h.tel){ const k = h.t / h.tel; cx.fillStyle = `rgba(255,56,96,${.08 + .14 * k})`; cx.beginPath(); cx.moveTo(x, y); cx.arc(x, y, L, Math.min(h.a0, h.a0 + h.sw), Math.max(h.a0, h.a0 + h.sw)); cx.closePath(); cx.fill(); cx.strokeStyle = `rgba(255,56,96,${.5 + .5 * Math.sin(G.rt * 40)})`; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + Math.cos(h.a0) * L, y + Math.sin(h.a0) * L); cx.stroke(); }
      else { cx.globalCompositeOperation = 'lighter'; for(let i = 0; i < 6; i++){ const a = h.a - Math.sign(h.sw) * i * .05; cx.strokeStyle = rgba('#ff3860', .7 - i * .11); cx.lineWidth = (26 - i * 3) * Z; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); cx.stroke(); } cx.strokeStyle = '#ffffff'; cx.lineWidth = 4 * Z; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + Math.cos(h.a) * L, y + Math.sin(h.a) * L); cx.stroke(); cx.globalCompositeOperation = 'source-over'; }
    } else if(h.kind === 'pulse'){ cx.strokeStyle = 'rgba(255,56,96,.7)'; cx.lineWidth = 14 * Z; cx.beginPath(); cx.arc(sx(h.x), sy(h.y), h.r * Z, 0, TAU); cx.stroke(); cx.strokeStyle = '#ffffff'; cx.lineWidth = 2; cx.stroke(); }
    else if(h.kind === 'kdash'){
      if(h.t < h.tel){ cx.strokeStyle = `rgba(192,75,255,${.2 + .3 * (h.t / h.tel)})`; cx.setLineDash([6, 10]); cx.lineWidth = 3; cx.beginPath(); cx.moveTo(sx(h.x1), sy(h.y1)); cx.lineTo(sx(h.x2), sy(h.y2)); cx.stroke(); cx.setLineDash([]); }
      else { cx.globalCompositeOperation = 'lighter'; glow(sx(h.cx), sy(h.cy), 70 * Z, '#c04bff', .9); cx.globalCompositeOperation = 'source-over'; cx.fillStyle = 'rgba(192,75,255,.6)'; cx.beginPath(); cx.arc(sx(h.cx), sy(h.cy), 30 * Z, 0, TAU); cx.fill(); }
    }
  }
}
function drawRifts(){
  const Z = G.camZ;
  for(const f of G.RF){
    if(f.t < 0) continue;
    const k = f.t / f.dur, x = sx(f.x), y = sy(f.y), col = f.type === 'boss' ? f.boss.col : ET[f.type].col, r = (f.type === 'boss' ? 90 : 26) * Z;
    cx.save(); cx.translate(x, y); cx.rotate(G.rt * 6);
    cx.strokeStyle = rgba(col, .5 + .5 * k); cx.lineWidth = 2;
    cx.strokeRect(-r * (1.4 - k * .6), -r * (1.4 - k * .6), r * 2 * (1.4 - k * .6), r * 2 * (1.4 - k * .6));
    cx.rotate(-G.rt * 10); cx.strokeRect(-r * k, -r * k, r * 2 * k, r * 2 * k);
    cx.restore();
    cx.globalCompositeOperation = 'lighter'; glow(x, y, r * 2 * k, col, .8); cx.globalCompositeOperation = 'source-over';
  }
}

/* ---------------- floor: kill cracks + dynamic light ---------------- */
function drawFloorFx(){
  const Z = G.camZ;
  cx.globalCompositeOperation = 'lighter';
  if(P && G.state !== 'menu'){ const c = skinCol(); glow(sx(P.x), sy(P.y), 300 * Z, c[0] === '#' ? c : '#ffffff', .16); }
  for(const e of G.EC) glow(sx(e.x), sy(e.y), 180 * Z, echoColHex(), .08);
  for(const e of G.E) if(e.boss) glow(sx(e.x), sy(e.y), 420 * Z, e.d.col, .2);
  for(const d of G.DC){
    const k = Math.min(1, d.life / 2), x = sx(d.x), y = sy(d.y), r = d.r * Z, rng = mulberry32(d.seed);
    glow(x, y, r * 1.2, d.c, .35 * k);
    cx.strokeStyle = rgba(d.c, .75 * k); cx.lineWidth = Math.max(1, 2 * Z); cx.beginPath();
    for(let b = 0; b < 7; b++){
      let a = rng() * TAU, px = x, py = y; cx.moveTo(px, py);
      const n = 3 + (rng() * 3 | 0), seg = r / n * (.7 + rng() * .8);
      for(let i = 0; i < n; i++){ a += (rng() - .5) * 1.1; px += Math.cos(a) * seg; py += Math.sin(a) * seg; cx.lineTo(px, py); }
    }
    cx.stroke();
  }
  cx.globalCompositeOperation = 'source-over';
}

/* ---------------- main render ---------------- */
function render(){
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const sh = save.opt.shake ? G.shake : 0;
  cx.save(); cx.translate((Math.random() * 2 - 1) * sh, (Math.random() * 2 - 1) * sh);
  drawBg();
  const Z = G.camZ;
  drawFloorFx();
  drawRifts();
  drawHazards();
  // pickups
  for(const p of G.PK){ const x = sx(p.x), y = sy(p.y); if(p.kind === 'heart'){ cx.globalCompositeOperation = 'lighter'; glow(x, y, 26, '#ff3cac', .9); cx.globalCompositeOperation = 'source-over'; cx.fillStyle = '#ff5ab8'; cx.font = `900 ${Math.round(20 * Math.max(.8, Z))}px system-ui`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('♥', x, y); } else { cx.globalCompositeOperation = 'lighter'; glow(x, y, 14, '#27f3ff', .8); cx.globalCompositeOperation = 'source-over'; cx.fillStyle = '#e8feff'; cx.beginPath(); cx.moveTo(x, y - 5); cx.lineTo(x + 4, y); cx.lineTo(x, y + 5); cx.lineTo(x - 4, y); cx.fill(); } }
  for(const e of G.E){ const x = sx(e.x), y = sy(e.y), r = e.r * Z * 3; if(x > -r && y > -r && x < W + r && y < H + r) drawEnemy(e); }
  drawEchoes();
  if(P) drawPlayer();
  cx.globalCompositeOperation = 'lighter';
  // enemy bolts
  for(const s of G.SH){ const x = sx(s.x), y = sy(s.y); glow(x, y, 22 * Z + 6, '#ff3cac', .9); cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(x, y, Math.max(3, s.r * Z * .6), 0, TAU); cx.fill(); }
  // flying crescents
  for(const c of G.CR){ const x = sx(c.x), y = sy(c.y), r = 34 * Z; cx.strokeStyle = rgba(c.src ? echoColHex() : (skinCol()[0] === '#' ? skinCol() : '#ffffff'), Math.min(1, c.life * 4)); cx.lineWidth = 5 * Z + 1; cx.beginPath(); cx.arc(x, y, r, c.a - 1.1, c.a + 1.1); cx.stroke(); }
  // slash arcs
  for(const f of G.FX){
    if(!f.arc) continue;
    const k = f.life / f.max0, x = sx(f.x), y = sy(f.y), R = f.r * Z, col = f.src ? echoColHex() : (skinCol()[0] === '#' ? skinCol() : '#ffffff');
    const sw = 1.3, a0 = f.a - sw, a1 = f.a + sw * (1 - k * .3);
    cx.fillStyle = rgba(col, .55 * k);
    cx.beginPath(); cx.arc(x, y, R, a0, a1); cx.arc(x + Math.cos(f.a) * R * .28, y + Math.sin(f.a) * R * .28, R * .72, a1, a0, true); cx.closePath(); cx.fill();
    cx.strokeStyle = `rgba(255,255,255,${k})`; cx.lineWidth = 3 * Z + 1; cx.beginPath(); cx.arc(x, y, R, a0, a1); cx.stroke();
  }
  // shards
  for(const s of G.SD){ const k = s.life / s.max, x = sx(s.x), y = sy(s.y), z = s.s * Z; cx.globalAlpha = Math.min(1, k * 1.5); cx.fillStyle = s.c; cx.save(); cx.translate(x, y); cx.rotate(s.a); cx.beginPath(); cx.moveTo(z, 0); cx.lineTo(-z * .6, z * .5); cx.lineTo(-z * .4, -z * .6); cx.closePath(); cx.fill(); cx.restore(); }
  cx.globalAlpha = 1;
  // particles
  for(const p of G.PT){ const k = p.life / p.max; cx.globalAlpha = k; cx.fillStyle = p.c[0] === '#' || p.c[0] === 'h' ? p.c : '#fff'; const s = p.s * (.5 + k * .5); cx.fillRect(sx(p.x) - s / 2, sy(p.y) - s / 2, s, s); }
  cx.globalAlpha = 1;
  for(const f of G.FX){
    if(f.ring){ const k = f.life / f.max0; cx.strokeStyle = rgba(f.c[0] === '#' ? f.c : '#ffffff', k); cx.lineWidth = (f.thick || 4) * k + 1; cx.beginPath(); cx.arc(sx(f.x), sy(f.y), f.r * Z, 0, TAU); cx.stroke(); }
    else if(f.cut){
      const k = f.life / f.max0, L = f.l * Z * (1.4 - k * .4), x = sx(f.x), y = sy(f.y), ca = Math.cos(f.a), sa = Math.sin(f.a);
      cx.strokeStyle = `rgba(255,255,255,${k})`; cx.lineWidth = 7 * k * Z + 1; cx.lineCap = 'round';
      cx.beginPath(); cx.moveTo(x - ca * L, y - sa * L); cx.lineTo(x + ca * L, y + sa * L); cx.stroke();
      cx.strokeStyle = `rgba(255,60,172,${k * .6})`; cx.lineWidth = 16 * k * Z + 1; cx.stroke();
    }
    else if(f.spark){
      const k = f.life / f.max0, x = sx(f.x), y = sy(f.y), L = 26 * f.s * Z * (1.5 - k);
      cx.fillStyle = `rgba(255,255,255,${k})`;
      cx.beginPath(); cx.moveTo(x - L, y); cx.lineTo(x, y - L * .18); cx.lineTo(x + L, y); cx.lineTo(x, y + L * .18); cx.closePath(); cx.fill();
      cx.beginPath(); cx.moveTo(x, y - L * .7); cx.lineTo(x + L * .14, y); cx.lineTo(x, y + L * .7); cx.lineTo(x - L * .14, y); cx.closePath(); cx.fill();
      glow(x, y, L * 1.2, '#ffffff', k * .8);
    }
    else if(f.bolt){
      const k = f.life / f.max0, c = f.c && f.c[0] === '#' ? f.c : '#b8f6ff';
      cx.strokeStyle = rgba(c, k); cx.lineWidth = (f.slash ? 6 : 3) * k + 1;
      cx.beginPath(); cx.moveTo(sx(f.x1), sy(f.y1));
      if(f.slash) cx.lineTo(sx(f.x2), sy(f.y2));
      else { const n = 6; for(let i = 1; i < n; i++){ const t = i / n; cx.lineTo(sx(lerp(f.x1, f.x2, t)) + rnd(-10, 10), sy(lerp(f.y1, f.y2, t)) + rnd(-10, 10)); } cx.lineTo(sx(f.x2), sy(f.y2)); }
      cx.stroke();
      if(f.slash){ cx.strokeStyle = `rgba(255,255,255,${k})`; cx.lineWidth = 2; cx.stroke(); }
    }
  }
  cx.globalCompositeOperation = 'source-over';
  // popups
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(const p of G.POP){
    const k = Math.min(1, p.life / .25), sc = p.life > .75 ? 1 + (p.life - .75) * 3 : 1;
    cx.globalAlpha = k; cx.font = `italic 900 ${Math.round(p.size * sc)}px system-ui,'Segoe UI',sans-serif`;
    cx.lineWidth = 4; cx.strokeStyle = 'rgba(0,0,0,.8)'; cx.lineJoin = 'round'; cx.strokeText(p.txt, sx(p.x), sy(p.y)); cx.fillStyle = p.c; cx.fillText(p.txt, sx(p.x), sy(p.y));
  }
  cx.globalAlpha = 1; cx.textBaseline = 'alphabetic';
  cx.restore();
  // time stop / slow motion
  if(G.ultT > 0){
    cx.fillStyle = 'rgba(10,0,30,.35)'; cx.fillRect(0, 0, W, H);
    cx.strokeStyle = 'rgba(255,255,255,.15)'; cx.lineWidth = 2;
    for(let i = 0; i < 18; i++){ const a = rnd(0, TAU), r0 = Math.hypot(W, H) * rnd(.3, .45); cx.beginPath(); cx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); cx.lineTo(W / 2 + Math.cos(a) * r0 * 1.6, H / 2 + Math.sin(a) * r0 * 1.6); cx.stroke(); }
  } else if(G.timeScale < .6 && G.state === 'play'){
    cx.strokeStyle = `rgba(255,255,255,${(.6 - G.timeScale) * .3})`; cx.lineWidth = 2;
    for(let i = 0; i < 14; i++){ const a = rnd(0, TAU), r0 = Math.hypot(W, H) * rnd(.38, .5); cx.beginPath(); cx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); cx.lineTo(W / 2 + Math.cos(a) * r0 * 1.5, H / 2 + Math.sin(a) * r0 * 1.5); cx.stroke(); }
  }
  if(P && P.hp === 1 && G.state === 'play'){ cx.fillStyle = `rgba(255,30,60,${.1 + .07 * Math.sin(G.rt * 7)})`; cx.fillRect(0, 0, W, H); }
  if(G.flash > 0){ cx.fillStyle = rgba(G.flashCol, Math.min(.35, G.flash * .3)); cx.fillRect(0, 0, W, H); }
  // impact frame: a split-second color inversion on the biggest hits
  if(G.impact > 0 && save.opt.flash){ cx.globalCompositeOperation = 'difference'; cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, W, H); cx.globalCompositeOperation = 'source-over'; }
  if(IN.joy && IN.joy.on && IN.joy.moved && G.state === 'play'){
    cx.strokeStyle = 'rgba(255,255,255,.25)'; cx.lineWidth = 3; cx.beginPath(); cx.arc(IN.joy.ox, IN.joy.oy, 56, 0, TAU); cx.stroke();
    const dx = IN.joy.x - IN.joy.ox, dy = IN.joy.y - IN.joy.oy, l = Math.hypot(dx, dy), m = Math.min(l, 56) / (l || 1);
    cx.fillStyle = 'rgba(255,255,255,.4)'; cx.beginPath(); cx.arc(IN.joy.ox + dx * m, IN.joy.oy + dy * m, 24, 0, TAU); cx.fill();
  }
}

/* ---------------- menu backdrop: phantom echoes dueling across the clock ---------------- */
function menuTick(dt){
  if(!P){ P = { x:0, y:0, vx:0, vy:0, r:15, hp:5, maxHp:5, inv:0, ang:0, dashT:0, dashCd:0, dv:[0, 0], slamCd:0, trail:[] }; G.EC.length = 0; G.E.length = 0; gridReset(); }
  G.rt += dt;
  G.clock = (G.clock + dt) % ECHO_T;
  G.camZ = targetZoom() * .75; G.camX = 0; G.camY = 0;
  const t = G.rt;
  P.x = Math.cos(t * .9) * 230; P.y = Math.sin(t * 1.3) * 160; P.ang = Math.atan2(Math.cos(t * 1.3) * 1.3 * 160, -Math.sin(t * .9) * .9 * 230);
  P.trail.push({ x:P.x, y:P.y, a:P.ang, life:.22 }); for(let i = P.trail.length - 1; i >= 0; i--){ P.trail[i].life -= dt; if(P.trail[i].life <= 0) P.trail.splice(i, 1); }
  while(G.EC.length < 4) G.EC.push({ id:G.EC.length + 1, x:0, y:0, a:0, born:0, glitch:0, d:0, ph:G.EC.length * 1.6 });
  G.EC.forEach((e, i) => { const tt = t - (i + 1) * .9; e.x = Math.cos(tt * .9 + e.ph) * (260 + i * 50); e.y = Math.sin(tt * 1.3 + e.ph) * (180 + i * 30); e.a = Math.atan2(Math.cos(tt * 1.3 + e.ph), -Math.sin(tt * .9 + e.ph)); });
  // the floor pulses on the beat
  G.menuBeat = (G.menuBeat || 0) - dt;
  if(G.menuBeat <= 0){ G.menuBeat = 60 / 112; gridImpulse(rnd(-400, 400), rnd(-300, 300), 260, 420); }
  gridTick(dt);
  tickFx(dt);
}
