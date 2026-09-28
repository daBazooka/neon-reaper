'use strict';
const cv = document.getElementById('cv'), cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, save.opt.fx === 'low' ? 1 : 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W * DPR | 0; cv.height = H * DPR | 0;
  layout();
}
window.addEventListener('resize', resize);
/* the painting sits in whatever room the HUD and the upgrade panel leave */
function layout(){
  const land = W > H * 1.05;
  document.body.classList.toggle('land', land);
  const pan = $('panel'), top = 64, pr = pan ? pan.getBoundingClientRect() : { width:0, height:0 };
  let ax = 0, ay = top, aw = W, ah = H - top;
  if(land){ aw = W - pr.width; } else { ah = H - top - pr.height; }
  const s = Math.max(.2, Math.min(aw, ah) * .94 / (PW + 36));
  G.view.s = s; G.view.x = ax + aw / 2 - PW * s / 2; G.view.y = ay + ah / 2 - PW * s / 2;
}
const toWorld = (sx, sy) => [(sx - G.view.x) / G.view.s, (sy - G.view.y) / G.view.s];
const toScreen = (x, y) => [G.view.x + x * G.view.s, G.view.y + y * G.view.s];

function drawFrame(){
  const s = G.view.s, x = G.view.x, y = G.view.y, w = PW * s, b = 18 * s + 4;
  cx.fillStyle = 'rgba(0,0,0,.45)'; cx.fillRect(x - b + 8, y - b + 12, w + b * 2, w + b * 2);
  const gr = cx.createLinearGradient(x - b, y - b, x + w + b, y + w + b);
  gr.addColorStop(0, '#f5d27a'); gr.addColorStop(.35, '#b8862e'); gr.addColorStop(.6, '#ffe7a0'); gr.addColorStop(1, '#8a5a1a');
  cx.fillStyle = gr; cx.fillRect(x - b, y - b, w + b * 2, w + b * 2);
  cx.strokeStyle = 'rgba(60,30,0,.6)'; cx.lineWidth = 2; cx.strokeRect(x - b + 4, y - b + 4, w + b * 2 - 8, w + b * 2 - 8); cx.strokeRect(x - 3, y - 3, w + 6, w + 6);
}
function drawFind(f, t){
  const x = f.x, y = f.y, r = f.r;
  switch(f.type){
    case 'coin': { const sq = Math.abs(Math.cos(t * 2 + f.id)); cx.fillStyle = '#b8861a'; cx.beginPath(); cx.ellipse(x, y + 1.5, r * sq + 1, r, 0, 0, TAU); cx.fill(); cx.fillStyle = '#ffd23a'; cx.beginPath(); cx.ellipse(x, y, r * sq, r, 0, 0, TAU); cx.fill(); cx.fillStyle = '#fff4b0'; cx.fillRect(x - r * .5 * sq, y - r * .6, r * .3 * sq, r * .9); break; }
    case 'gem': { cx.fillStyle = f.col; cx.beginPath(); cx.moveTo(x, y - r); cx.lineTo(x + r * .8, y - r * .2); cx.lineTo(x, y + r); cx.lineTo(x - r * .8, y - r * .2); cx.closePath(); cx.fill(); cx.fillStyle = 'rgba(255,255,255,.55)'; cx.beginPath(); cx.moveTo(x, y - r); cx.lineTo(x + r * .35, y - r * .2); cx.lineTo(x, y + r * .2); cx.lineTo(x - r * .35, y - r * .2); cx.fill(); break; }
    case 'relic': { cx.fillStyle = '#c8783a'; cx.beginPath(); cx.moveTo(x, y); cx.arc(x, y, r, -Math.PI / 2 + f.piece * Math.PI / 2, f.piece * Math.PI / 2); cx.fill(); cx.strokeStyle = '#ffd88a'; cx.lineWidth = 2; cx.stroke(); cx.font = `${r}px sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(BIOMES[f.bi].relic[1], x, y); break; }
    case 'critter': {
      const bob = f.st === 1 ? Math.sin(t * 8) * 4 : 0, sc = f.st === 1 ? 1 + Math.sin(t * 5) * .06 : 1;
      if(f.shiny){ cx.fillStyle = rgba('#ffd23a', .35 + Math.sin(t * 6) * .15); cx.beginPath(); cx.arc(x, y, r * 1.3, 0, TAU); cx.fill(); }
      cx.save(); cx.translate(x, y + bob); cx.scale(sc, sc); cx.font = `${r * 1.7}px sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      if(f.shiny) cx.filter = 'sepia(1) saturate(4) hue-rotate(-10deg) brightness(1.2)';
      cx.fillText(f.e, 0, 0); cx.filter = 'none'; cx.restore();
      if(f.st === 1){ const k = (G.t - f.t0) / 9; cx.strokeStyle = rgba('#ffffff', .8); cx.lineWidth = 3; cx.beginPath(); cx.arc(x, y, r * 1.45, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - k)); cx.stroke(); }
      break;
    }
    case 'key': case 'exit': {
      const glow = f.st === 1 ? .6 + Math.sin(t * 4) * .3 : .2;
      const g = cx.createRadialGradient(x, y, r * .3, x, y, r * 2.2); g.addColorStop(0, rgba(f.type === 'exit' ? '#9fe8ff' : '#ffe8a0', glow)); g.addColorStop(1, 'rgba(255,230,160,0)'); cx.fillStyle = g; cx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
      cx.fillStyle = '#c8962e'; cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.fill(); cx.fillStyle = '#ffe08a'; cx.beginPath(); cx.arc(x, y, r * .82, 0, TAU); cx.fill();
      cx.fillStyle = '#1a0e04'; cx.beginPath(); cx.arc(x, y - r * .18, r * .26, 0, TAU); cx.fill(); cx.beginPath(); cx.moveTo(x - r * .14, y - r * .1); cx.lineTo(x + r * .14, y - r * .1); cx.lineTo(x + r * .24, y + r * .5); cx.lineTo(x - r * .24, y + r * .5); cx.fill();
      if(f.type === 'key' && f.st === 1 && keyLocked()){ const k = C.cleared / C.total / KEY_AT; cx.strokeStyle = 'rgba(0,0,0,.5)'; cx.lineWidth = 7; cx.beginPath(); cx.arc(x, y, r + 9, 0, TAU); cx.stroke(); cx.strokeStyle = '#ffd23a'; cx.lineWidth = 5; cx.beginPath(); cx.arc(x, y, r + 9, -Math.PI / 2, -Math.PI / 2 + TAU * k); cx.stroke(); cx.font = `${r * .8}px sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('🔒', x + r * .75, y + r * .75); }
      if(f.type === 'exit'){ cx.fillStyle = '#9fe8ff'; cx.font = `900 ${r * .5}px system-ui`; cx.textAlign = 'center'; cx.fillText('EXIT', x, y + r * 1.5); }
      break;
    }
    case 'glyph': {
      const lit = G.t - (f.lit || -9) < .5, bad = G.t - (f.bad || -9) < .5;
      cx.fillStyle = '#6a665e'; cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.fill(); cx.strokeStyle = bad ? '#ff4a4a' : lit || (C.glyphTaps.includes(f.sym)) ? '#9fe8ff' : '#3a3630'; cx.lineWidth = 3; cx.stroke();
      cx.fillStyle = bad ? '#ff6a6a' : C.glyphTaps.includes(f.sym) ? '#9fe8ff' : '#f0e8d8'; cx.font = `900 ${r * 1.1}px system-ui`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(f.sym, x, y + 1);
      break;
    }
    case 'mini': { cx.fillStyle = '#c8962e'; cx.fillRect(x - r, y - r * .8, r * 2, r * 1.6); const g = cx.createLinearGradient(x, y - r * .6, x, y + r * .6); g.addColorStop(0, '#6ec2ff'); g.addColorStop(.6, '#fff1c4'); g.addColorStop(.61, '#58a043'); g.addColorStop(1, '#3f8a35'); cx.fillStyle = g; cx.fillRect(x - r * .8, y - r * .6, r * 1.6, r * 1.2); if(f.st === 1){ cx.strokeStyle = rgba('#ffffff', .5 + Math.sin(t * 5) * .4); cx.lineWidth = 2; cx.strokeRect(x - r - 4, y - r * .8 - 4, r * 2 + 8, r * 1.6 + 8); } break; }
    case 'sign': { if(f.st === 1 && f.taps){ cx.strokeStyle = rgba('#ffd23a', .6); cx.lineWidth = 2; cx.beginPath(); cx.arc(x, y, r + f.taps * 4, 0, TAU); cx.stroke(); } break; }
  }
}
function drawMoth(m){
  const f = Math.abs(Math.sin(m.ph)) * .8 + .2;
  cx.fillStyle = 'rgba(0,0,0,.18)'; cx.beginPath(); cx.ellipse(m.x + 6, m.y + 10, 8, 3, 0, 0, TAU); cx.fill();
  cx.fillStyle = '#fff8ea'; cx.beginPath(); cx.ellipse(m.x - 6 * f, m.y, 7 * f, 5, -.3, 0, TAU); cx.ellipse(m.x + 6 * f, m.y, 7 * f, 5, .3, 0, TAU); cx.fill();
  cx.fillStyle = '#8a7a5a'; cx.fillRect(m.x - 1.2, m.y - 5, 2.4, 10);
}
function drawEye(e){
  const open = Math.min(1, e.t * 3) * Math.min(1, (5 - e.t) * 3), x = e.x, y = e.y, r = 30;
  const g = cx.createRadialGradient(x, y, 4, x, y, r * 2.4); g.addColorStop(0, rgba('#ffd23a', .55 * open)); g.addColorStop(1, 'rgba(255,210,58,0)'); cx.fillStyle = g; cx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
  cx.fillStyle = '#fff6d8'; cx.beginPath(); cx.moveTo(x - r, y); cx.quadraticCurveTo(x, y - r * 1.1 * open, x + r, y); cx.quadraticCurveTo(x, y + r * 1.1 * open, x - r, y); cx.fill();
  cx.strokeStyle = '#c8962e'; cx.lineWidth = 3; cx.stroke();
  if(open > .3){ const [px, py] = G.ptr.down ? [G.ptr.wx, G.ptr.wy] : [x, y + 20]; const a = Math.atan2(py - y, px - x); cx.fillStyle = '#c8962e'; cx.beginPath(); cx.arc(x + Math.cos(a) * 8, y + Math.sin(a) * 5, r * .38 * open, 0, TAU); cx.fill(); cx.fillStyle = '#1a0e04'; cx.beginPath(); cx.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 6, r * .18 * open, 0, TAU); cx.fill(); }
}

function render(){
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // the gallery wall
  const B = C ? C.B : BIOMES[0];
  const wg = cx.createRadialGradient(W / 2, H * .45, 50, W / 2, H / 2, Math.max(W, H) * .8);
  wg.addColorStop(0, mixHex(B.cover[2], '#2a1e16', .55)); wg.addColorStop(1, '#120c08');
  cx.fillStyle = wg; cx.fillRect(0, 0, W, H);
  if(!C) return;
  const s = G.view.s;
  let zoom = 1, fx = PW / 2, fy = PW / 2, fade = 0;
  if(G.dive){ const D = G.dive; if(D.t < .75){ const k = D.t / .75; zoom = Math.pow(7, k * k); fx = D.x; fy = D.y; fade = Math.max(0, (k - .55) / .45); } else { const k = Math.min(1, (D.t - .75) / .8); zoom = lerp(.3, 1, 1 - Math.pow(1 - k, 3)); fade = Math.max(0, 1 - k * 2); } }
  const sh = G.shake, ox = rnd(-sh, sh), oy = rnd(-sh, sh);
  cx.save();
  cx.translate(ox, oy);
  if(zoom !== 1){ const [sx, sy] = toScreen(fx, fy); cx.translate(sx, sy); cx.scale(zoom, zoom); cx.translate(-sx, -sy); }
  drawFrame();
  cx.save(); cx.translate(G.view.x, G.view.y); cx.scale(s, s);
  cx.beginPath(); cx.rect(0, 0, PW, PW); cx.clip();
  cx.drawImage(C.base, 0, 0);
  const t = G.t;
  for(const f of C.finds) if(f.st !== 2) drawFind(f, t);
  cx.drawImage(C.cover, 0, 0);
  // above the grime: things that call for attention
  for(const f of C.finds){
    if(f.st === 1 && TAPPABLE[f.type] && f.type !== 'sign'){ cx.strokeStyle = rgba('#ffffff', .35 + Math.sin(t * 6) * .25); cx.lineWidth = 2; cx.setLineDash([5, 5]); cx.beginPath(); cx.arc(f.x, f.y, f.r + 10 + Math.sin(t * 4) * 3, 0, TAU); cx.stroke(); cx.setLineDash([]); }
    if(f.ping > 0 && f.st === 0){ const a = Math.min(1, f.ping / 1.6); cx.strokeStyle = rgba(f.type === 'key' ? '#ffd23a' : f.type === 'critter' ? '#8fe06a' : '#9fe8ff', a * .9); cx.lineWidth = f.type === 'key' ? 4 : 2.5; cx.setLineDash([6, 5]); cx.beginPath(); cx.arc(f.x, f.y, f.r + 6, 0, TAU); cx.stroke(); cx.setLineDash([]); }
  }
  if(G.sonar){ const r = G.sonar.t * 650; cx.strokeStyle = rgba('#9fe8ff', Math.max(0, .5 - r / PW * .5)); cx.lineWidth = 6; cx.beginPath(); cx.arc(PW / 2, PW / 2, r, 0, TAU); cx.stroke(); }
  for(const d of G.drops){ cx.strokeStyle = 'rgba(190,230,255,.75)'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(d.x, d.y); cx.lineTo(d.x - 3, d.y - 16); cx.stroke(); }
  for(const w of G.whirls){ const r = Math.min(135, 30 + w.t * 110); cx.strokeStyle = rgba('#ffffff', .5 * (1 - w.t / 1.6)); cx.lineWidth = 4; for(let k = 0; k < 3; k++){ cx.beginPath(); cx.arc(w.x, w.y, r * (.4 + k * .3), w.t * 8 + k, w.t * 8 + k + 2.4); cx.stroke(); } }
  for(const b of G.bolts){ cx.strokeStyle = rgba('#e8f4ff', 1 - b.t / .4); cx.lineWidth = 5; cx.shadowColor = '#8ac8ff'; cx.shadowBlur = 16; cx.beginPath(); b.pts.forEach(([x, y], i) => i ? cx.lineTo(x, y) : cx.moveTo(x, y)); cx.stroke(); cx.shadowBlur = 0; }
  for(const m of G.moths) drawMoth(m);
  if(G.eye) drawEye(G.eye);
  for(const p of G.parts){ cx.globalAlpha = Math.min(1, p.l * 2.5); cx.fillStyle = p.c; if(p.k === 'star'){ cx.fillRect(p.x - p.s / 2, p.y - p.s * 1.5, p.s, p.s * 3); cx.fillRect(p.x - p.s * 1.5, p.y - p.s / 2, p.s * 3, p.s); } else cx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
  cx.globalAlpha = 1;
  // brush ring
  const P = G.ptr;
  if((P.down || P.hover) && G.state === 'play'){
    const R = brushR(save.up.brush) * (G.goldT > 0 ? 1.8 : 1);
    cx.strokeStyle = G.blastArmed ? rgba('#ff8a3a', .9) : G.goldT > 0 ? rgba('#ffd23a', .9) : G.mult >= 3 ? rgba('#ffb86a', .8) : 'rgba(255,255,255,.55)';
    cx.lineWidth = 3; cx.beginPath(); cx.arc(P.wx, P.wy, G.blastArmed ? 95 : R, 0, TAU); cx.stroke();
    if(P.down && P.stillT > .6 && !save.secrets.drill){ cx.strokeStyle = rgba('#ffd23a', .6); cx.beginPath(); cx.arc(P.wx, P.wy, R * .5, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, P.stillT / 3)); cx.stroke(); }
  }
  if(G.goldT > 0){ cx.fillStyle = rgba('#ffd23a', .08 + Math.sin(t * 6) * .04); cx.fillRect(0, 0, PW, PW); }
  cx.restore();
  // floating numbers in screen space
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(const p of G.pops){
    const [sx, sy] = toScreen(p.x, p.y), k = p.t / p.d, sc = k < .15 ? .6 + k / .15 * .5 : 1.1 - (k - .15) * .15;
    cx.globalAlpha = k > .7 ? (1 - k) / .3 : 1;
    cx.font = `900 ${Math.round(p.s * sc * Math.max(.85, s * 1.2))}px system-ui, sans-serif`;
    cx.lineWidth = 4; cx.strokeStyle = 'rgba(30,18,8,.85)'; cx.strokeText(p.txt, sx, sy); cx.fillStyle = p.c; cx.fillText(p.txt, sx, sy);
  }
  cx.globalAlpha = 1;
  cx.restore();
  // treasure flying to the counter
  const tgt = dustTarget();
  for(const f of G.fly){ const [sx, sy] = toScreen(f.x, f.y), k = f.t * f.t, x = lerp(sx, tgt[0], k), y = lerp(sy, tgt[1], k) - Math.sin(f.t * Math.PI) * 60; cx.fillStyle = f.c; cx.beginPath(); cx.arc(x, y, 6, 0, TAU); cx.fill(); cx.strokeStyle = 'rgba(0,0,0,.4)'; cx.lineWidth = 2; cx.stroke(); }
  if(fade > 0 || G.flash > 0){ cx.fillStyle = `rgba(255,248,225,${Math.max(fade, G.flash * .5)})`; cx.fillRect(0, 0, W, H); }
}
