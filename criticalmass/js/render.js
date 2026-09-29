'use strict';
const cv = $('cv'), cx = cv.getContext('2d', { alpha:false });
let W = 0, H = 0, DPR = 1;
const V = { s:1, x:0, y:0 };
const TOP = 70, BOT = 12;
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, save.opt.fx === 'low' ? 1 : 2);
  W = innerWidth; H = innerHeight; cv.width = W * DPR | 0; cv.height = H * DPR | 0;
  const aw = W - 16, ah = H - TOP - BOT, s = Math.min(aw, ah) / 600;
  const nW = aw / s, nH = ah / s;
  if(G.atoms.length && G.W && (Math.abs(nW - G.W) > 1 || Math.abs(nH - G.H) > 1)){ const kx = nW / G.W, ky = nH / G.H; for(const a of G.atoms){ a.x *= kx; a.y *= ky; } if(G.core){ G.core.x *= kx; G.core.y *= ky; } }
  G.W = nW; G.H = nH; V.s = s; V.x = 8; V.y = TOP;
  bgCache = null;
}
addEventListener('resize', resize);
const toWorld = (px, py) => [(px - V.x) / V.s, (py - V.y) / V.s];

const glowC = new Map();
function glowSpr(col){
  let c = glowC.get(col); if(c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(col, .95)); gr.addColorStop(.3, rgba(col, .4)); gr.addColorStop(.65, rgba(col, .1)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); glowC.set(col, c); return c;
}
function glow(x, y, r, col, a){ cx.globalAlpha = Math.min(1, a); cx.drawImage(glowSpr(col), x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1; }

let bgCache = null, bgWorld = -1;
function drawBg(){
  const w = G.spec ? G.spec.world : 0, Wd = WORLDS[w];
  if(!bgCache || bgWorld !== w){
    bgWorld = w; bgCache = document.createElement('canvas'); bgCache.width = W * DPR; bgCache.height = H * DPR;
    const g = bgCache.getContext('2d'); g.scale(DPR, DPR);
    const gr = g.createRadialGradient(W / 2, H * .45, 30, W / 2, H / 2, Math.max(W, H) * .8); gr.addColorStop(0, Wd.bg[1]); gr.addColorStop(1, Wd.bg[0]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // chamber
    const x0 = V.x, y0 = V.y, x1 = V.x + G.W * V.s, y1 = V.y + G.H * V.s, step = 40 * V.s;
    g.strokeStyle = rgba(Wd.grid, .07); g.lineWidth = 1;
    for(let x = x0; x <= x1; x += step){ g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
    for(let y = y0; y <= y1; y += step){ g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
    g.strokeStyle = rgba(Wd.grid, .35); g.lineWidth = 2; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
    g.fillStyle = rgba(Wd.grid, .5); for(const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]){ g.fillRect(x - 5, y - 5, 10, 10); }
  }
  cx.drawImage(bgCache, 0, 0, W, H);
}

const SYM = { big:'●', split:'✦', magnet:'◉', zap:'ϟ', armor:'⬢', time:'◷', gold:'$', void:'✕', nuke:'✸' };
function drawAtom(a){
  const d = ATOMS[a.type], s = V.s, x = V.x + a.x * s, y = V.y + a.y * s, r = a.r * s * (1 + Math.sin(a.ph) * .06) * (a.born > 0 ? 1 - a.born / .4 : 1);
  if(r <= 0) return;
  if(a.type === 'void'){
    cx.fillStyle = '#05010a'; cx.beginPath(); cx.arc(x, y, r * 1.1, 0, TAU); cx.fill();
    cx.strokeStyle = d.col; cx.lineWidth = 2.5; cx.beginPath(); cx.arc(x, y, r * 1.1, a.ph, a.ph + TAU * .75); cx.stroke();
    cx.strokeStyle = rgba(d.col, .4); cx.beginPath(); cx.arc(x, y, r * 1.6, -a.ph, -a.ph + TAU * .5); cx.stroke();
    return;
  }
  cx.globalCompositeOperation = 'lighter'; glow(x, y, r * 3.2, d.col, a.type === 'gold' || a.type === 'nuke' ? .9 : .55); cx.globalCompositeOperation = 'source-over';
  const k = r * 1.5; cx.drawImage(atomSpr(a.type, a.crack), x - k, y - k, k * 2, k * 2);
}
// atom bodies are drawn once per type into a sprite (the symbol text is the slow part)
const atomSprC = {};
function atomSpr(type, crack){
  const key = type + (crack ? 'c' : '');
  if(atomSprC[key]) return atomSprC[key];
  const S = 96, h = S / 2, r = S / 3, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), d = ATOMS[type];
  g.fillStyle = d.col; g.beginPath(); g.arc(h, h, r, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(h - r * .3, h - r * .3, r * .38, 0, TAU); g.fill();
  if(type === 'armor'){ g.strokeStyle = crack ? '#ff5a5a' : '#7a8898'; g.lineWidth = 6; g.beginPath(); g.arc(h, h, r + 4, 0, TAU); g.stroke(); if(crack){ g.beginPath(); g.moveTo(h - r * .6, h - r * .2); g.lineTo(h, h + r * .1); g.lineTo(h + r * .5, h - r * .5); g.stroke(); } }
  const sym = SYM[type];
  if(sym){ g.fillStyle = 'rgba(10,6,20,.8)'; g.font = `900 ${Math.round(r * 1.2)}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sym, h, h + 2); }
  return atomSprC[key] = c;
}
function drawCore(c){
  const s = V.s, x = V.x + c.x * s, y = V.y + c.y * s, r = c.r * s, t = G.rt;
  if(c.dead) return;
  cx.globalCompositeOperation = 'lighter'; glow(x, y, r * 2.6, '#ff5ad9', .7 + Math.sin(t * 4) * .15); cx.globalCompositeOperation = 'source-over';
  cx.save(); cx.translate(x, y); cx.rotate(t * .4);
  for(let k = 0; k < 3; k++){ cx.strokeStyle = rgba(['#ff5ad9', '#3ff0ff', '#ffd23c'][k], .7); cx.lineWidth = 3; cx.beginPath(); cx.ellipse(0, 0, r * 1.25, r * .45, k * TAU / 3 + t, 0, TAU); cx.stroke(); }
  cx.restore();
  const g = cx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, c.hurt > 0 ? '#ffffff' : '#ffc8f0'); g.addColorStop(.5, '#ff5ad9'); g.addColorStop(1, '#6a1050');
  cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.fill();
  // health ring
  cx.strokeStyle = 'rgba(0,0,0,.5)'; cx.lineWidth = 8; cx.beginPath(); cx.arc(x, y, r + 14, 0, TAU); cx.stroke();
  cx.strokeStyle = '#ffd23c'; cx.lineWidth = 6; cx.beginPath(); cx.arc(x, y, r + 14, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0, c.hp / c.max)); cx.stroke();
  cx.fillStyle = '#fff'; cx.font = `900 ${Math.round(r * .5)}px system-ui,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(Math.max(0, c.hp), x, y + 2);
}

// a blast is a soft disc with a bright rim, drawn once per colour and scaled
const blastSprC = {};
function blastSpr(col){
  if(blastSprC[col]) return blastSprC[col];
  const S = 160, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), h = S / 2;
  const gr = g.createRadialGradient(h, h, 0, h, h, h); gr.addColorStop(0, rgba(col, .08)); gr.addColorStop(.75, rgba(col, .22)); gr.addColorStop(.97, rgba(col, .55)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.strokeStyle = rgba(col, .85); g.lineWidth = 3; g.beginPath(); g.arc(h, h, h - 2.5, 0, TAU); g.stroke();
  return blastSprC[col] = c;
}
function render(){
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const sh = G.shake, ox = rnd(-sh, sh), oy = rnd(-sh, sh);
  drawBg();
  cx.save(); cx.translate(ox, oy);
  const s = V.s, X = x => V.x + x * s, Y = y => V.y + y * s;
  // blasts: soft fill + bright rim
  cx.globalCompositeOperation = 'lighter';
  for(const b of G.blasts){
    if(b.r <= 0) continue;
    const x = X(b.x), y = Y(b.y), r = b.r * s, fade = b.t > b.grow + b.hold ? Math.max(0, b.r / b.R) : 1;
    cx.globalAlpha = fade; cx.drawImage(blastSpr(b.col), x - r, y - r, r * 2, r * 2);
    if(r > 60){ cx.strokeStyle = rgba(b.col, .85 * fade); cx.lineWidth = 2.5; cx.beginPath(); cx.arc(x, y, r - 1, 0, TAU); cx.stroke(); }
  }
  for(const r of G.rings){ const k = r.t / .45, rr = lerp(r.r, r.R, r.inward ? k : 1 - Math.pow(1 - k, 3)) * s; cx.strokeStyle = rgba(r.col, .6 * (1 - k)); cx.lineWidth = 3 * (1 - k) + 1; cx.beginPath(); cx.arc(X(r.x), Y(r.y), Math.max(1, rr), 0, TAU); cx.stroke(); }
  cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
  if(G.core) drawCore(G.core);
  for(const a of G.atoms) drawAtom(a);
  // shards and lightning
  cx.globalCompositeOperation = 'lighter';
  for(const sd of G.shards){ const x = X(sd.x), y = Y(sd.y); glow(x, y, 16, sd.col, .9); cx.strokeStyle = sd.col; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x - sd.vx * .04 * s, y - sd.vy * .04 * s); cx.stroke(); }
  for(const z of G.zaps){ cx.strokeStyle = rgba('#fff35a', 1 - z.t / .25); cx.lineWidth = 3; cx.beginPath(); cx.moveTo(X(z.x1), Y(z.y1)); for(let k = 1; k < 6; k++){ const t = k / 6; cx.lineTo(X(lerp(z.x1, z.x2, t)) + rnd(-8, 8), Y(lerp(z.y1, z.y2, t)) + rnd(-8, 8)); } cx.lineTo(X(z.x2), Y(z.y2)); cx.stroke(); }
  for(const p of G.parts){ cx.globalAlpha = Math.min(1, p.l * 3); cx.fillStyle = p.c; const x = X(p.x), y = Y(p.y), ps = p.s * Math.max(.7, s); if(p.k === 'star'){ cx.fillRect(x - ps / 2, y - ps * 1.5, ps, ps * 3); cx.fillRect(x - ps * 1.5, y - ps / 2, ps * 3, ps); } else cx.fillRect(x - ps / 2, y - ps / 2, ps, ps); }
  cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
  // aiming ring
  const P = PTR;
  if((G.state === 'aim' || (G.mode === 'endless' && G.state === 'run')) && G.tapsLeft > 0 && P.in){
    const r = tapR(save.up.tap) * s, t = G.rt;
    cx.strokeStyle = 'rgba(255,255,255,.55)'; cx.lineWidth = 2; cx.setLineDash([8, 7]); cx.lineDashOffset = -t * 30; cx.beginPath(); cx.arc(P.x, P.y, r, 0, TAU); cx.stroke(); cx.setLineDash([]);
    cx.fillStyle = 'rgba(255,255,255,.06)'; cx.beginPath(); cx.arc(P.x, P.y, r, 0, TAU); cx.fill();
  }
  // floating text
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(const p of G.pops){ const k = p.t / p.d; cx.globalAlpha = k > .6 ? (1 - k) / .4 : 1; cx.font = `900 ${Math.round(p.s * Math.max(.9, s))}px system-ui,sans-serif`; cx.lineWidth = 4; cx.strokeStyle = 'rgba(5,3,14,.85)'; cx.strokeText(p.txt, X(p.x), Y(p.y)); cx.fillStyle = p.c; cx.fillText(p.txt, X(p.x), Y(p.y)); }
  cx.globalAlpha = 1;
  cx.restore();
  // the live chain counter
  if(G.chain >= 3 && (G.state === 'run' || G.state === 'done')){
    const k = Math.min(1, G.chain / 120), sz = Math.round(Math.min(W, H) * (.07 + k * .06)), pulse = 1 + Math.max(0, .25 - (G.t - G.lastPopT)) * 1.2;
    cx.save(); cx.translate(W / 2, V.y + Math.min(W, H) * .16); cx.scale(pulse, pulse);
    cx.font = `italic 900 ${sz}px system-ui,sans-serif`; cx.lineWidth = Math.max(4, sz * .12); cx.strokeStyle = 'rgba(5,3,14,.85)';
    const col = G.chain >= 100 ? '#ff5ad9' : G.chain >= 50 ? '#ffd23c' : G.chain >= 25 ? '#7dff5a' : '#3ff0ff';
    cx.globalAlpha = .92; cx.strokeText('×' + G.chain, 0, 0); cx.fillStyle = col; cx.fillText('×' + G.chain, 0, 0); cx.restore(); cx.globalAlpha = 1;
  }
  if(G.bigText){
    const k = G.bigText.t / 1.3, sc = k < .12 ? .5 + k / .12 * .6 : 1.1 - (k - .12) * .1, sz = Math.round(Math.min(W, H) * .085);
    cx.font = `italic 900 ${sz}px system-ui,sans-serif`; const fit = Math.min(1, W * .82 / (cx.measureText(G.bigText.txt).width * 1.12));
    cx.save(); cx.translate(W / 2, H * .5); cx.scale(sc * fit, sc * fit); cx.rotate(-.05); cx.globalAlpha = k > .75 ? (1 - k) / .25 : 1;
    cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineWidth = sz * .14; cx.strokeStyle = 'rgba(5,3,14,.9)'; cx.strokeText(G.bigText.txt, 0, 0);
    const g = cx.createLinearGradient(0, -sz / 2, 0, sz / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffd23c'); cx.fillStyle = g; cx.fillText(G.bigText.txt, 0, 0);
    cx.restore(); cx.globalAlpha = 1;
  }
  if(G.flash > 0){ cx.fillStyle = `rgba(255,255,255,${G.flash * .5})`; cx.fillRect(0, 0, W, H); }
  if(G.slowT > 0){ cx.fillStyle = `rgba(90,140,255,${Math.min(.12, G.slowT * .1)})`; cx.fillRect(0, 0, W, H); }
}
