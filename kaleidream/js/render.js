'use strict';
/* =====================================================================
   KALEIDREAM renderer. Everything is drawn in code: the dreamers and
   their faces, hats and trails, every monster, the backgrounds of each
   dream mode, and the kaleidoscope that folds one game into the next.
   ===================================================================== */
const cv = $('cv'); const cx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
const V = { s:10, ww:100, hh:100 };
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, save.opt.fx === 'low' ? 1 : 2);
  W = innerWidth; H = innerHeight; cv.width = W * DPR | 0; cv.height = H * DPR | 0;
  V.s = Math.min(W, H) / 88; V.ww = W / V.s; V.hh = H / V.s;
}
const S = v => v * V.s;

/* ---------------- small drawing kit ---------------- */
const glowC = {};
function glowSpr(c){ if(glowC[c]) return glowC[c]; const s = 64, cn = document.createElement('canvas'); cn.width = cn.height = s; const g = cn.getContext('2d'), gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, c); gr.addColorStop(.35, c.replace(/hsl\((.*)\)/, 'hsla($1,.35)').replace(/^#([0-9a-f]{6})$/i, (m, h) => `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},.35)`)); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); if(Object.keys(glowC).length > 300) for(const k in glowC) delete glowC[k]; return glowC[c] = cn; }
function glow(g, x, y, r, c, a){ if(a <= 0) return; g.globalAlpha = Math.min(1, a); g.drawImage(glowSpr(c), x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; }
function starPath(g, x, y, r, n, inner, rot){ n = n || 5; inner = inner || .45; g.beginPath(); for(let i = 0; i < n * 2; i++){ const a = rot + i * Math.PI / n - Math.PI / 2, rr = i % 2 ? r * inner : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
function heartPath(g, x, y, r){ g.beginPath(); g.moveTo(x, y + r * .9); g.bezierCurveTo(x - r * 1.6, y - r * .1, x - r * .7, y - r * 1.3, x, y - r * .45); g.bezierCurveTo(x + r * .7, y - r * 1.3, x + r * 1.6, y - r * .1, x, y + r * .9); g.closePath(); }
function rrect(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const INK = 'rgba(24,10,48,.9)';

/* ---------------- dreamers ---------------- */
// draws a dreamer centred at (x,y) with radius R (pixels) on any context
function drawDreamer(g, x, y, R, ch, o){
  o = o || {}; const t = o.t || 0, sq = o.sq || 0, look = o.look || [0, 0];
  let col = ch.col, col2 = ch.col2;
  if(ch.id === 'glitch'){ const h = (t * 90) % 360; col = hsl(h, 95, 75); col2 = hsl(h + 120, 90, 55); }
  g.save(); g.translate(x, y); g.scale(1 + sq * .35, 1 - sq * .3);
  const lw = Math.max(1.5, R * .09);
  g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round';
  const f = ch.feat;
  // features behind the body
  if(f === 'bunny'){ for(const s of [-1, 1]){ g.save(); g.translate(s * R * .38, -R * .8); g.rotate(s * .18 + Math.sin(t * 3 + s) * .06); g.fillStyle = col; g.beginPath(); g.ellipse(0, -R * .45, R * .2, R * .55, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#ffd8ec'; g.beginPath(); g.ellipse(0, -R * .45, R * .09, R * .38, 0, 0, TAU); g.fill(); g.restore(); } }
  if(f === 'cat'){ for(const s of [-1, 1]){ g.fillStyle = col2; g.beginPath(); g.moveTo(s * R * .75, -R * .45); g.lineTo(s * R * .62, -R * 1.12); g.lineTo(s * R * .2, -R * .82); g.closePath(); g.fill(); g.stroke(); } }
  if(f === 'horns'){ for(const s of [-1, 1]){ g.fillStyle = '#fff4e0'; g.beginPath(); g.moveTo(s * R * .5, -R * .7); g.quadraticCurveTo(s * R * .95, -R * 1.05, s * R * .78, -R * 1.35); g.quadraticCurveTo(s * R * .55, -R * 1, s * R * .22, -R * .85); g.closePath(); g.fill(); g.stroke(); } }
  if(f === 'antenna'){ g.beginPath(); g.moveTo(0, -R * .9); g.quadraticCurveTo(R * .25, -R * 1.3, R * .1, -R * 1.55); g.stroke(); glow(g, R * .1, -R * 1.6, R * .5, '#fff4a0', .8 + .2 * Math.sin(t * 6)); g.fillStyle = '#fff4a0'; g.beginPath(); g.arc(R * .1, -R * 1.6, R * .16, 0, TAU); g.fill(); g.stroke(); }
  // body
  const gr = g.createRadialGradient(-R * .35, -R * .45, R * .1, 0, 0, R * 1.1); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.18, col); gr.addColorStop(1, col2);
  g.fillStyle = gr;
  if(f === 'square') rrect(g, -R * .95, -R * .95, R * 1.9, R * 1.9, R * .35);
  else if(f === 'cloud'){ g.beginPath(); for(let i = 0; i < 9; i++){ const a = i / 9 * TAU; g.arc(Math.cos(a) * R * .72, Math.sin(a) * R * .72, R * .38, a - 1.6, a + 1.6); } g.closePath(); }
  else { g.beginPath(); g.ellipse(0, R * .04, R, R * .96, 0, 0, TAU); }
  g.fill(); g.stroke();
  if(f === 'drip'){ g.fillStyle = col2; for(const dx of [-.45, .2, .55]){ g.beginPath(); g.ellipse(R * dx, R * .92 + Math.sin(t * 2 + dx * 5) * R * .05, R * .1, R * .2, 0, 0, TAU); g.fill(); } }
  // belly shine
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-R * .38, -R * .5, R * .22, R * .12, -.6, 0, TAU); g.fill();
  drawFace(g, R, o.face || 'happy', t, look);
  // features on top
  if(f === 'leaf' || f === 'sprout'){ g.save(); g.translate(0, -R * .92); g.rotate(Math.sin(t * 2.5) * .2); g.strokeStyle = INK; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -R * .3); g.stroke(); g.fillStyle = f === 'leaf' ? '#3ad06a' : '#8aef5a'; for(const s of f === 'leaf' ? [1] : [-1, 1]){ g.beginPath(); g.ellipse(s * R * .22, -R * .38, R * .25, R * .11, s * -.5, 0, TAU); g.fill(); g.stroke(); } g.restore(); }
  if(f === 'halo'){ g.strokeStyle = '#ffe45a'; g.lineWidth = R * .12; g.beginPath(); g.ellipse(0, -R * 1.15 + Math.sin(t * 3) * R * .05, R * .55, R * .16, 0, 0, TAU); g.stroke(); }
  if(f === 'crown' && o.hat !== 'crown') drawHat(g, R, 'crown', t);
  if(o.hat && o.hat !== 'none') drawHat(g, R, o.hat, t);
  g.restore();
}
function drawFace(g, R, fc, t, look){
  const ex = R * .33, ey = -R * .08, er = R * .25, lx = clamp(look[0], -1, 1) * er * .3, ly = clamp(look[1], -1, 1) * er * .3;
  g.lineWidth = Math.max(1.3, R * .08); g.strokeStyle = INK; g.lineCap = 'round';
  // cheeks
  g.fillStyle = 'rgba(255,90,140,.35)'; for(const s of [-1, 1]){ g.beginPath(); g.ellipse(s * R * .55, R * .2, R * .15, R * .09, 0, 0, TAU); g.fill(); }
  const blink = Math.sin(t * 1.3) > .985;
  const eyeOpen = (s, big) => { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(s * ex, ey, er * (big ? 1.15 : 1), er * (big ? 1.25 : 1.1), 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#1a1030'; g.beginPath(); g.arc(s * ex + lx, ey + ly, er * (big ? .38 : .55), 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(s * ex + lx + er * .2, ey + ly - er * .22, er * .18, 0, TAU); g.fill(); };
  const closed = (s, up) => { g.beginPath(); if(up) g.arc(s * ex, ey + er * .3, er * .6, Math.PI * 1.15, Math.PI * 1.85); else g.arc(s * ex, ey - er * .2, er * .6, Math.PI * .15, Math.PI * .85); g.stroke(); };
  const mouth = (kind) => {
    g.fillStyle = '#5a1030';
    if(kind === 'smile'){ g.beginPath(); g.arc(0, R * .22, R * .2, .15 * Math.PI, .85 * Math.PI); g.stroke(); }
    else if(kind === 'open'){ g.beginPath(); g.moveTo(-R * .25, R * .2); g.quadraticCurveTo(0, R * .62, R * .25, R * .2); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#ff7a9a'; g.beginPath(); g.ellipse(0, R * .38, R * .1, R * .06, 0, 0, TAU); g.fill(); }
    else if(kind === 'o'){ g.beginPath(); g.ellipse(0, R * .35, R * .11, R * .15, 0, 0, TAU); g.fill(); g.stroke(); }
    else if(kind === 'wave'){ g.beginPath(); for(let i = 0; i <= 8; i++) g.lineTo(-R * .25 + i * R * .0625, R * .32 + Math.sin(i * 1.6 + t * 8) * R * .04); g.stroke(); }
    else if(kind === 'smirk'){ g.beginPath(); g.moveTo(-R * .15, R * .32); g.quadraticCurveTo(R * .1, R * .4, R * .25, R * .22); g.stroke(); }
    else if(kind === 'frown'){ g.beginPath(); g.arc(0, R * .48, R * .18, 1.2 * Math.PI, 1.8 * Math.PI); g.stroke(); }
    else if(kind === 'tongue'){ g.beginPath(); g.arc(0, R * .2, R * .2, .1 * Math.PI, .9 * Math.PI); g.stroke(); g.fillStyle = '#ff6a9a'; g.beginPath(); g.ellipse(R * .06, R * .44, R * .1, R * .13, 0, 0, TAU); g.fill(); g.stroke(); }
  };
  if(blink && ['happy', 'silly', 'angry'].includes(fc)){ closed(-1); closed(1); mouth(fc === 'silly' ? 'tongue' : 'smile'); return; }
  switch(fc){
    case 'wink': eyeOpen(-1); closed(1, true); mouth('smile'); break;
    case 'silly': eyeOpen(-1); eyeOpen(1); g.fillStyle = '#1a1030'; mouth('tongue'); break;
    case 'wow': eyeOpen(-1, true); eyeOpen(1, true); mouth('o'); break;
    case 'laugh': closed(-1, true); closed(1, true); mouth('open'); break;
    case 'love': for(const s of [-1, 1]){ g.fillStyle = '#ff3a7a'; heartPath(g, s * ex, ey, er * 1.05 * (1 + .1 * Math.sin(t * 10))); g.fill(); g.stroke(); } mouth('open'); break;
    case 'cool': g.fillStyle = '#1a1030'; rrect(g, -R * .72, ey - er * .75, R * 1.44, er * 1.35, er * .4); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-R * .55, ey - er * .5, R * .2, er * .25); mouth('smirk'); break;
    case 'angry': eyeOpen(-1); eyeOpen(1); g.beginPath(); g.moveTo(-ex - er, ey - er * 1.5); g.lineTo(-ex + er * .8, ey - er * .9); g.moveTo(ex + er, ey - er * 1.5); g.lineTo(ex - er * .8, ey - er * .9); g.stroke(); mouth('frown'); break;
    case 'sleepy': closed(-1); closed(1); mouth('o'); g.fillStyle = '#ffffff'; g.font = `900 ${R * .5}px system-ui,sans-serif`; g.fillText('z', R * .8, -R * .6 - (t * 10 % 10)); break;
    case 'starry': for(const s of [-1, 1]){ g.fillStyle = '#ffe45a'; starPath(g, s * ex, ey, er * 1.25, 5, .45, t * 2); g.fill(); g.stroke(); } mouth('open'); break;
    case 'dizzy': for(const s of [-1, 1]){ g.beginPath(); for(let i = 0; i < 26; i++){ const a = i * .5 + t * 8 * s, rr = i / 26 * er; g.lineTo(s * ex + Math.cos(a) * rr, ey + Math.sin(a) * rr); } g.stroke(); } mouth('wave'); break;
    case 'cry': closed(-1); closed(1); mouth('wave'); g.fillStyle = '#8ad8ff'; for(const s of [-1, 1]){ const k = (t * 2 + (s > 0 ? .5 : 0)) % 1; g.beginPath(); g.ellipse(s * ex, ey + er * .6 + k * R * .6, R * .07, R * .11, 0, 0, TAU); g.fill(); } break;
    default: eyeOpen(-1); eyeOpen(1); mouth('smile');
  }
}
function drawHat(g, R, id, t){
  g.save(); g.translate(0, -R * .82); g.lineWidth = Math.max(1.3, R * .08); g.strokeStyle = INK;
  const fillS = c => { g.fillStyle = c; g.fill(); g.stroke(); };
  switch(id){
    case 'party': g.beginPath(); g.moveTo(-R * .4, 0); g.lineTo(R * .05, -R * 1.05); g.lineTo(R * .45, 0); g.closePath(); fillS('#ff5ad0'); g.strokeStyle = '#ffe45a'; g.beginPath(); g.moveTo(-R * .22, -R * .35); g.lineTo(R * .3, -R * .3); g.stroke(); g.strokeStyle = INK; g.beginPath(); g.arc(R * .05, -R * 1.1, R * .14, 0, TAU); fillS('#ffe45a'); break;
    case 'bow': for(const s of [-1, 1]){ g.beginPath(); g.moveTo(0, -R * .1); g.lineTo(s * R * .55, -R * .45); g.lineTo(s * R * .55, R * .2); g.closePath(); fillS('#ff4a7a'); } g.beginPath(); g.arc(0, -R * .12, R * .14, 0, TAU); fillS('#ff8ab0'); break;
    case 'beanie': g.beginPath(); g.arc(0, R * .1, R * .7, Math.PI, 0); g.closePath(); fillS('#4a8aff'); g.fillStyle = '#ffffff'; rrect(g, -R * .75, -R * .05, R * 1.5, R * .28, R * .1); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -R * .65, R * .2, 0, TAU); fillS('#ffffff'); break;
    case 'flower': g.save(); g.translate(R * .35, -R * .1); g.rotate(t); for(let i = 0; i < 6; i++){ g.beginPath(); g.ellipse(Math.cos(i / 6 * TAU) * R * .2, Math.sin(i / 6 * TAU) * R * .2, R * .14, R * .14, 0, 0, TAU); fillS('#ffb0e0'); } g.beginPath(); g.arc(0, 0, R * .13, 0, TAU); fillS('#ffe45a'); g.restore(); break;
    case 'tophat': rrect(g, -R * .65, -R * .08, R * 1.3, R * .18, R * .06); fillS('#2a2240'); rrect(g, -R * .4, -R * .9, R * .8, R * .85, R * .06); fillS('#2a2240'); g.fillStyle = '#ff4a6a'; g.fillRect(-R * .4, -R * .28, R * .8, R * .14); break;
    case 'phones': g.lineWidth = R * .14; g.beginPath(); g.arc(0, R * .45, R * .95, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.lineWidth = Math.max(1.3, R * .08); for(const s of [-1, 1]){ rrect(g, s * R * .95 - R * .2, R * .15, R * .4, R * .6, R * .15); fillS('#ff5a8a'); } break;
    case 'chef': rrect(g, -R * .45, -R * .4, R * .9, R * .45, R * .08); fillS('#ffffff'); for(const [dx, dy] of [[-.3, -.55], [0, -.72], [.3, -.55]]){ g.beginPath(); g.arc(R * dx, R * dy, R * .3, 0, TAU); fillS('#ffffff'); } break;
    case 'propeller': g.beginPath(); g.arc(0, R * .05, R * .6, Math.PI, 0); g.closePath(); fillS('#ff5a5a'); g.fillStyle = '#ffe45a'; g.beginPath(); g.arc(0, R * .05, R * .6, Math.PI, Math.PI * 1.33); g.lineTo(0, R * .05); g.fill(); g.save(); g.translate(0, -R * .62); g.scale(Math.cos(t * 25), 1); g.fillStyle = '#4ad8ff'; g.fillRect(-R * .7, -R * .08, R * 1.4, R * .16); g.restore(); g.beginPath(); g.arc(0, -R * .6, R * .08, 0, TAU); fillS('#ffffff'); break;
    case 'duck': g.save(); g.translate(0, -R * .1 + Math.sin(t * 4) * R * .04); g.beginPath(); g.ellipse(0, 0, R * .5, R * .3, 0, 0, TAU); fillS('#ffe45a'); g.beginPath(); g.arc(R * .25, -R * .35, R * .24, 0, TAU); fillS('#ffe45a'); g.beginPath(); g.moveTo(R * .45, -R * .38); g.lineTo(R * .7, -R * .3); g.lineTo(R * .45, -R * .25); fillS('#ff8a2a'); g.fillStyle = '#1a1030'; g.beginPath(); g.arc(R * .3, -R * .42, R * .05, 0, TAU); g.fill(); g.restore(); break;
    case 'wizard': g.beginPath(); g.moveTo(-R * .75, R * .05); g.quadraticCurveTo(0, -R * .2, R * .75, R * .05); g.lineTo(R * .4, -R * .1); g.lineTo(R * .3, -R * 1.2); g.lineTo(-R * .4, -R * .1); g.closePath(); fillS('#5a3aff'); g.fillStyle = '#ffe45a'; starPath(g, 0, -R * .45, R * .16, 5, .45, 0); g.fill(); break;
    case 'viking': g.beginPath(); g.arc(0, R * .1, R * .62, Math.PI, 0); g.closePath(); fillS('#b8c0d0'); for(const s of [-1, 1]){ g.beginPath(); g.moveTo(s * R * .5, -R * .15); g.quadraticCurveTo(s * R * 1.05, -R * .3, s * R * .95, -R * .85); g.quadraticCurveTo(s * R * .8, -R * .4, s * R * .35, -R * .35); g.closePath(); fillS('#fff4e0'); } break;
    case 'ufo': { const hy = -R * .75 + Math.sin(t * 3) * R * .12; g.globalAlpha = .35; g.fillStyle = '#8affc0'; g.beginPath(); g.moveTo(-R * .2, hy); g.lineTo(R * .2, hy); g.lineTo(R * .45, R * .2); g.lineTo(-R * .45, R * .2); g.fill(); g.globalAlpha = 1; g.beginPath(); g.arc(0, hy - R * .1, R * .25, Math.PI, 0); fillS('#bff4ff'); g.beginPath(); g.ellipse(0, hy, R * .6, R * .16, 0, 0, TAU); fillS('#9aa8c0'); for(let i = -1; i <= 1; i++){ g.fillStyle = Math.sin(t * 8 + i) > 0 ? '#ffe45a' : '#ff5a8a'; g.beginPath(); g.arc(i * R * .3, hy, R * .05, 0, TAU); g.fill(); } break; }
    case 'crown': g.beginPath(); g.moveTo(-R * .5, 0); g.lineTo(-R * .55, -R * .55); g.lineTo(-R * .25, -R * .3); g.lineTo(0, -R * .65); g.lineTo(R * .25, -R * .3); g.lineTo(R * .55, -R * .55); g.lineTo(R * .5, 0); g.closePath(); fillS('#ffd23a'); g.fillStyle = '#ff4a7a'; g.beginPath(); g.arc(0, -R * .2, R * .09, 0, TAU); g.fill(); break;
    case 'halo': glow(g, 0, -R * .4, R * .9, '#fff4a0', .6); g.strokeStyle = '#ffe45a'; g.lineWidth = R * .12; g.beginPath(); g.ellipse(0, -R * .4 + Math.sin(t * 3) * R * .05, R * .55, R * .16, 0, 0, TAU); g.stroke(); break;
  }
  g.restore();
}

/* ---------------- things in the dream ---------------- */
function drawItem(it){
  const x = S(it.x), y = S(it.y), r = S(it.r), t = G.rt, hue = hueNow();
  if(it.k === 'star'){ const s = r * (1 + .12 * Math.sin(it.ph * 2)); glow(cx, x, y, s * 2.6, hsl(hue + 40, 100, 75), .6); cx.fillStyle = tw('disco') ? hsl(it.ph * 60, 100, 70) : '#ffe45a'; starPath(cx, x, y, s * 1.25, 5, .5, it.ph * .3); cx.fill(); cx.lineWidth = Math.max(1, s * .16); cx.strokeStyle = '#ff9a2a'; cx.stroke(); cx.fillStyle = 'rgba(255,255,255,.7)'; cx.beginPath(); cx.arc(x - s * .25, y - s * .3, s * .22, 0, TAU); cx.fill(); return; }
  if(it.k === 'candy'){ cx.save(); cx.translate(x, y); cx.rotate(it.ph); cx.fillStyle = hsl(it.hue, 90, 65); for(const s of [-1, 1]){ cx.beginPath(); cx.moveTo(s * r * .8, 0); cx.lineTo(s * r * 1.6, -r * .6); cx.lineTo(s * r * 1.6, r * .6); cx.fill(); } cx.beginPath(); cx.arc(0, 0, r, 0, TAU); cx.fill(); cx.strokeStyle = '#ffffff'; cx.lineWidth = r * .25; cx.beginPath(); cx.arc(0, 0, r * .55, 0, 4); cx.stroke(); cx.restore(); return; }
  if(it.k === 'balloon'){ cx.strokeStyle = 'rgba(255,255,255,.7)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(x, y + r * 1.2); cx.quadraticCurveTo(x + Math.sin(it.ph) * r * .5, y + r * 2, x, y + r * 3); cx.stroke(); cx.fillStyle = hsl(it.hue, 90, 62); cx.beginPath(); cx.ellipse(x, y, r, r * 1.2, 0, 0, TAU); cx.fill(); cx.fillStyle = 'rgba(255,255,255,.5)'; cx.beginPath(); cx.ellipse(x - r * .35, y - r * .4, r * .2, r * .32, -.4, 0, TAU); cx.fill(); return; }
  if(it.k === 'gem'){ glow(cx, x, y, r * 3, '#8affff', .7); cx.fillStyle = '#5ae8ff'; cx.beginPath(); cx.moveTo(x, y - r * 1.3); cx.lineTo(x + r, y - r * .2); cx.lineTo(x, y + r * 1.3); cx.lineTo(x - r, y - r * .2); cx.closePath(); cx.fill(); cx.strokeStyle = '#ffffff'; cx.lineWidth = 1.5; cx.stroke(); return; }
  if(it.k === 'gift'){ glow(cx, x, y, r * 3, '#ffe45a', .7); cx.fillStyle = it.g === 'heart' ? '#ff5a8a' : it.g === 'shard' ? '#4ad8ff' : '#ffb02a'; cx.fillRect(x - r, y - r * .8, r * 2, r * 1.7); cx.fillStyle = '#ffffff'; cx.fillRect(x - r * .18, y - r * .8, r * .36, r * 1.7); cx.fillRect(x - r, y - r * .1, r * 2, r * .3); cx.beginPath(); cx.ellipse(x - r * .35, y - r * .95, r * .35, r * .2, .5, 0, TAU); cx.ellipse(x + r * .35, y - r * .95, r * .35, r * .2, -.5, 0, TAU); cx.fill(); return; }
  if(it.k === 'haz') return drawHaz(it, x, y, r, t);
  if(it.k === 'bld') return drawBld(it, x, y, r);
  if(it.k === 'grey'){ if(it.painted){ const k = 1 - it.life / .5; glow(cx, x, y, r * (2 + k * 2), hsl(it.hue, 95, 65), 1 - k); cx.strokeStyle = hsl(it.hue, 95, 70); cx.lineWidth = 3; cx.beginPath(); cx.arc(x, y, r * (1 + k * 1.5), 0, TAU); cx.stroke(); return; } cx.fillStyle = 'rgba(150,150,160,.55)'; cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.fill(); cx.strokeStyle = 'rgba(220,220,230,.7)'; cx.lineWidth = 1.5; cx.stroke(); cx.fillStyle = 'rgba(40,40,50,.6)'; for(const s of [-1, 1]){ cx.beginPath(); cx.arc(x + s * r * .3, y - r * .1, r * .1, 0, TAU); cx.fill(); } cx.strokeStyle = 'rgba(40,40,50,.6)'; cx.beginPath(); cx.moveTo(x - r * .2, y + r * .3); cx.lineTo(x + r * .2, y + r * .3); cx.stroke(); return; }
  if(it.k === 'dot'){ const big = it.r >= G.P.r * .92, c = big ? hsl(350, 80, 60) : hsl(it.hue, 80, 65); if(big) glow(cx, x, y, r * 2, '#ff3a5a', .35); cx.fillStyle = c; cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.fill(); cx.strokeStyle = big ? '#5a0a1a' : INK; cx.lineWidth = Math.max(1, r * .1); cx.stroke(); const er = Math.max(1, r * .22); for(const s of [-1, 1]){ cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(x + s * r * .35, y - r * .15, er, 0, TAU); cx.fill(); cx.fillStyle = '#1a1030'; cx.beginPath(); cx.arc(x + s * r * .35 + Math.sign(G.P.x - it.x) * er * .3, y - r * .15, er * .55, 0, TAU); cx.fill(); } if(big){ cx.strokeStyle = '#1a1030'; cx.beginPath(); cx.moveTo(x - r * .6, y - r * .5); cx.lineTo(x - r * .15, y - r * .35); cx.moveTo(x + r * .6, y - r * .5); cx.lineTo(x + r * .15, y - r * .35); cx.stroke(); } return; }
  if(it.k === 'note'){ const k = (it.hitAt - G.t) / 1.4, s = r * (1 + (1 - k) * .3); if(it.bad){ cx.fillStyle = '#2a1040'; starPath(cx, x, y, s * 1.4, 8, .6, it.ph * .5); cx.fill(); cx.strokeStyle = '#ff5a8a'; cx.lineWidth = 2; cx.stroke(); cx.fillStyle = '#ff5a8a'; cx.font = `900 ${s * 1.2}px system-ui,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('✕', x, y + 1); return; } glow(cx, x, y, s * 2.5, hsl(it.hue, 100, 70), .6); cx.fillStyle = hsl(it.hue, 90, 62); cx.beginPath(); cx.arc(x, y, s, 0, TAU); cx.fill(); cx.strokeStyle = '#ffffff'; cx.lineWidth = 2.5; cx.stroke(); cx.fillStyle = '#ffffff'; cx.font = `900 ${s * 1.3}px system-ui,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('♪', x, y + 1); return; }
}
function drawHaz(it, x, y, r, t){
  if(it.k2 === 'critter'){ cx.fillStyle = '#ffb0d0'; cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.fill(); cx.strokeStyle = INK; cx.lineWidth = 2; cx.stroke(); for(const s of [-1, 1]){ cx.beginPath(); cx.arc(x + s * r * .35, y - r * .1, r * .18, Math.PI * 1.1, Math.PI * 1.9); cx.stroke(); } cx.beginPath(); cx.arc(x, y + r * .15, r * .3, .1 * Math.PI, .9 * Math.PI); cx.stroke(); cx.fillStyle = '#ff3a7a'; heartPath(cx, x + r * .9, y - r * .9, r * .35); cx.fill(); return; }
  if(it.k2 === 'freeze'){ cx.fillStyle = 'rgba(200,240,255,.75)'; rrect(cx, x - r * 1.1, y - r * 1.1, r * 2.2, r * 2.2, r * .3); cx.fill(); cx.strokeStyle = '#ffffff'; cx.lineWidth = 2; cx.stroke(); cx.fillStyle = 'rgba(80,100,160,.5)'; cx.beginPath(); cx.arc(x, y, r * .6, 0, TAU); cx.fill(); cx.fillStyle = '#ffffff'; cx.fillRect(x - r * .8, y - r * .8, r * .25, r * .6); return; }
  const angryEyes = (ox, oy, s) => { for(const d of [-1, 1]){ cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(ox + d * s * .9, oy, s * .55, 0, TAU); cx.fill(); cx.fillStyle = '#ff2a5a'; cx.beginPath(); cx.arc(ox + d * s * .9, oy + s * .1, s * .28, 0, TAU); cx.fill(); } cx.strokeStyle = '#ffffff'; cx.lineWidth = Math.max(1, s * .25); cx.beginPath(); cx.moveTo(ox - s * 1.5, oy - s * .9); cx.lineTo(ox - s * .4, oy - s * .5); cx.moveTo(ox + s * 1.5, oy - s * .9); cx.lineTo(ox + s * .4, oy - s * .5); cx.stroke(); };
  const dark = hsl(hueNow() + 200, 45, 16);
  switch(it.look){
    case 'cloud': glow(cx, x, y, r * 2, '#8a2aff', .35); cx.fillStyle = dark; starPath(cx, x, y, r * 1.2, 9, .72, it.ph * .2); cx.fill(); cx.strokeStyle = '#b05aff'; cx.lineWidth = 2; cx.stroke(); angryEyes(x, y, r * .28); break;
    case 'spike': cx.fillStyle = dark; cx.beginPath(); cx.moveTo(x - r * 1.2, y + r); for(let i = 0; i < 3; i++){ cx.lineTo(x - r * 1.2 + (i + .5) * r * .8, y - r * 1.2 + (i === 1 ? -r * .4 : 0)); cx.lineTo(x - r * 1.2 + (i + 1) * r * .8, y + r * .2); } cx.lineTo(x + r * 1.2, y + r); cx.closePath(); cx.fill(); cx.strokeStyle = '#ff5a8a'; cx.lineWidth = 2; cx.stroke(); angryEyes(x, y + r * .35, r * .22); break;
    case 'bat': { const fl = Math.sin(it.ph * 3) * r * .6; cx.fillStyle = dark; for(const s of [-1, 1]){ cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + s * r * 2, y - fl); cx.lineTo(x + s * r * 1.4, y + r * .4); cx.lineTo(x + s * r * .8, y + r * .1); cx.closePath(); cx.fill(); } cx.beginPath(); cx.arc(x, y, r * .8, 0, TAU); cx.fill(); cx.strokeStyle = '#ff5a8a'; cx.lineWidth = 1.5; cx.stroke(); angryEyes(x, y - r * .1, r * .22); break; }
    case 'urchin': glow(cx, x, y, r * 2, '#ff2a6a', .3); cx.fillStyle = dark; starPath(cx, x, y, r * 1.35, 12, .6, it.ph * .5); cx.fill(); cx.strokeStyle = '#ff5a8a'; cx.lineWidth = 2; cx.stroke(); angryEyes(x, y, r * .25); break;
    case 'drop': cx.fillStyle = dark; cx.beginPath(); cx.moveTo(x, y - r * 1.8); cx.quadraticCurveTo(x + r * 1.2, y, x, y + r); cx.quadraticCurveTo(x - r * 1.2, y, x, y - r * 1.8); cx.fill(); cx.strokeStyle = '#b05aff'; cx.lineWidth = 1.5; cx.stroke(); angryEyes(x, y - r * .1, r * .24); break;
    case 'ink': cx.fillStyle = '#12101c'; cx.beginPath(); for(let i = 0; i < 10; i++){ const a = i / 10 * TAU, rr = r * (1 + .25 * Math.sin(i * 3 + it.ph)); cx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } cx.closePath(); cx.fill(); angryEyes(x, y, r * .24); break;
    case 'meteor': { const a = Math.atan2(it.vy, it.vx); for(let i = 1; i < 6; i++) glow(cx, x - Math.cos(a) * r * i * .9, y - Math.sin(a) * r * i * .9, r * (1.6 - i * .2), '#ff8a2a', .5 - i * .07); cx.fillStyle = '#5a3a2a'; cx.beginPath(); cx.arc(x, y, r, 0, TAU); cx.fill(); cx.strokeStyle = '#ffb02a'; cx.lineWidth = 2; cx.stroke(); angryEyes(x, y, r * .22); break; }
  }
}
function drawBld(it, x, y, r){
  const c = it.gold ? '#ffd23a' : ['#ff8a8a', '#8ad8ff', '#b0ff8a', '#ffd08a'][it.look], roof = it.gold ? '#ff9a2a' : ['#c83a5a', '#3a6ac8', '#3a9a4a', '#c8703a'][it.look];
  if(it.gold) glow(cx, x, y, r * 2.4, '#ffe45a', .6);
  cx.strokeStyle = INK; cx.lineWidth = Math.max(1, r * .1);
  if(it.look === 2){ cx.fillStyle = '#8a5a3a'; cx.fillRect(x - r * .15, y, r * .3, r); cx.fillStyle = c; cx.beginPath(); cx.arc(x, y - r * .2, r * .8, 0, TAU); cx.fill(); cx.stroke(); return; }
  if(it.look === 3){ cx.fillStyle = c; rrect(cx, x - r, y - r * .2, r * 2, r * .7, r * .2); cx.fill(); cx.stroke(); rrect(cx, x - r * .5, y - r * .6, r, r * .5, r * .15); cx.fill(); cx.stroke(); cx.fillStyle = '#1a1030'; for(const s of [-1, 1]){ cx.beginPath(); cx.arc(x + s * r * .55, y + r * .5, r * .22, 0, TAU); cx.fill(); } return; }
  const hh = it.look === 1 ? r * 2 : r * 1.2;
  cx.fillStyle = c; cx.fillRect(x - r * .8, y - hh / 2 + r * .3, r * 1.6, hh); cx.strokeRect(x - r * .8, y - hh / 2 + r * .3, r * 1.6, hh);
  cx.fillStyle = roof; cx.beginPath(); cx.moveTo(x - r, y - hh / 2 + r * .3); cx.lineTo(x, y - hh / 2 - r * .5); cx.lineTo(x + r, y - hh / 2 + r * .3); cx.closePath(); cx.fill(); cx.stroke();
  cx.fillStyle = '#fff4b0'; cx.fillRect(x - r * .3, y - r * .1, r * .6, r * .5);
}

/* ---------------- bosses ---------------- */
function drawBoss(B){
  const x = S(B.x), y = S(B.y), R = S(15), t = G.rt;
  cx.save(); cx.translate(x + (B.hurt ? rnd(-4, 4) : 0), y); if(B.dead){ cx.rotate(B.dead * 3); cx.globalAlpha = Math.max(0, 1 - B.dead / 2); cx.scale(1 + B.dead * .3, 1 + B.dead * .3); }
  glow(cx, 0, 0, R * 2.2, B.col, .5);
  const col = B.hurt > .5 ? '#ffffff' : B.col;
  cx.lineWidth = R * .07; cx.strokeStyle = INK; cx.fillStyle = col;
  if(B.look === 'clock'){
    for(const s of [-1, 1]){ cx.beginPath(); cx.arc(s * R * .6, -R * .85, R * .3, Math.PI, 0); cx.fill(); cx.stroke(); }
    cx.beginPath(); cx.arc(0, 0, R, 0, TAU); cx.fill(); cx.stroke(); cx.fillStyle = '#fff8e8'; cx.beginPath(); cx.arc(0, 0, R * .78, 0, TAU); cx.fill(); cx.stroke();
    cx.strokeStyle = INK; cx.lineWidth = R * .06; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(Math.cos(t * 3) * R * .55, Math.sin(t * 3) * R * .55); cx.moveTo(0, 0); cx.lineTo(Math.cos(t * .5) * R * .35, Math.sin(t * .5) * R * .35); cx.stroke();
    if(Math.sin(t * 20) > 0 && !B.dead){ cx.strokeStyle = '#ffe45a'; cx.lineWidth = 3; for(const s of [-1, 1]){ cx.beginPath(); cx.arc(s * R * 1.25, -R * .9, R * .25, 0, TAU); cx.stroke(); } }
  } else if(B.look === 'cloud'){
    cx.beginPath(); for(let i = 0; i < 8; i++){ const a = i / 8 * TAU; cx.arc(Math.cos(a) * R * .75, Math.sin(a) * R * .55, R * .42, a - 1.7, a + 1.7); } cx.closePath(); cx.fill(); cx.stroke();
    if(Math.sin(t * 5) > .7){ cx.strokeStyle = '#ffe45a'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(-R * .2, R * .6); cx.lineTo(0, R * 1.1); cx.lineTo(-R * .1, R * 1.1); cx.lineTo(R * .1, R * 1.6); cx.stroke(); }
  } else if(B.look === 'spiky'){ starPath(cx, 0, 0, R * 1.2, 14, .72, t * .6); cx.fill(); cx.stroke(); }
  else if(B.look === 'sock'){ rrect(cx, -R * .6, -R * 1.1, R * 1.2, R * 1.6, R * .3); cx.fill(); cx.stroke(); cx.beginPath(); cx.ellipse(R * .2, R * .55, R * .85, R * .45, 0, 0, TAU); cx.fill(); cx.stroke(); cx.fillStyle = 'rgba(255,255,255,.6)'; for(let i = 0; i < 3; i++) cx.fillRect(-R * .6, -R * .9 + i * R * .35, R * 1.2, R * .12); }
  else { for(const s of [-1, 1]){ cx.save(); cx.scale(s, 1); cx.rotate(Math.sin(t * 8) * .25); cx.fillStyle = col; cx.beginPath(); cx.ellipse(R * .9, -R * .2, R * .9, R * .6, -.3, 0, TAU); cx.fill(); cx.stroke(); cx.fillStyle = 'rgba(255,255,255,.45)'; cx.beginPath(); cx.arc(R * 1, -R * .25, R * .3, 0, TAU); cx.fill(); cx.restore(); } cx.fillStyle = col; cx.beginPath(); cx.ellipse(0, 0, R * .45, R * .9, 0, 0, TAU); cx.fill(); cx.stroke(); }
  // face
  const ey = B.look === 'sock' ? -R * .5 : -R * .1;
  for(const s of [-1, 1]){ cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(s * R * .32, ey, R * .2, 0, TAU); cx.fill(); cx.strokeStyle = INK; cx.lineWidth = R * .05; cx.stroke(); cx.fillStyle = '#1a1030'; const lx = clamp((G.P.x - B.x) / 60, -1, 1) * R * .07, ly = clamp((G.P.y - B.y) / 60, -1, 1) * R * .07; cx.beginPath(); cx.arc(s * R * .32 + lx, ey + ly, R * .09, 0, TAU); cx.fill(); cx.beginPath(); cx.moveTo(s * R * .6, ey - R * .3); cx.lineTo(s * R * .12, ey - R * .18); cx.stroke(); }
  cx.fillStyle = '#3a0a1a'; cx.beginPath(); if(B.hurt > .3 || B.dead){ cx.ellipse(0, ey + R * .42, R * .15, R * .18, 0, 0, TAU); } else { cx.moveTo(-R * .3, ey + R * .4); for(let i = 0; i <= 6; i++) cx.lineTo(-R * .3 + i * R * .1, ey + R * (i % 2 ? .3 : .45)); cx.lineTo(R * .3, ey + R * .55); cx.lineTo(-R * .3, ey + R * .55); } cx.fill();
  cx.restore();
  if(B.sayT > 0) bubble(x, y - R * 1.5, B.say, '#ffdddd', '#5a0a1a');
}
function bubble(x, y, txt, bg, fg){
  const fs = Math.round(clamp(S(3.6), 12, 22)); cx.font = `900 ${fs}px system-ui,sans-serif`; const w = cx.measureText(txt).width + fs * 1.2, h = fs * 1.8;
  const bx = clamp(x - w / 2, 6, W - w - 6), by = clamp(y - h, 6, H - h - 6);
  cx.fillStyle = bg || '#ffffff'; rrect(cx, bx, by, w, h, h * .45); cx.fill(); cx.strokeStyle = INK; cx.lineWidth = 2.5; cx.stroke();
  cx.beginPath(); cx.moveTo(clamp(x, bx + 10, bx + w - 20), by + h - 1); cx.lineTo(clamp(x, bx + 10, bx + w - 20) + 10, by + h - 1); cx.lineTo(clamp(x, bx + 10, bx + w - 20) + 2, by + h + 9); cx.closePath(); cx.fill();
  cx.fillStyle = fg || '#1a1030'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(txt, bx + w / 2, by + h / 2 + 1);
}

/* ---------------- backgrounds ---------------- */
const BOKEH = Array.from({ length:26 }, (_, i) => ({ x:Math.random(), y:Math.random(), r:rnd(.02, .08), d:rnd(.2, 1), h:rndi(0, 120) }));
function drawBG(){
  const h = hueNow(), m = G.state === 'title' ? 'title' : G.mode, t = G.rt;
  const paintK = m === 'paint' ? clamp((G.paintedShift || 0) / 20, 0, 1) : 1;
  const sat = m === 'paint' ? 10 + paintK * 60 : 70;
  const g = cx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, hsl(h, sat, m === 'orbit' || m === 'dive' ? 10 : 24)); g.addColorStop(.6, hsl(h + 40, sat, m === 'orbit' ? 18 : 38)); g.addColorStop(1, hsl(h + 80, sat + 5, m === 'orbit' ? 26 : 55));
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  // a slow mandala: the kaleidoscope is always turning somewhere
  cx.save(); cx.translate(W / 2, H / 2); cx.rotate(t * .05); cx.strokeStyle = hsl(h + 180, 90, 80, .07); cx.lineWidth = 2;
  for(let k = 0; k < 3; k++){ starPath(cx, 0, 0, Math.max(W, H) * (.25 + k * .2), 12 - k * 2, .55, k * .3); cx.stroke(); }
  cx.restore();
  // floating dream bokeh
  for(const b of BOKEH){ const x = ((b.x * W - t * 12 * b.d) % W + W) % W, y = (b.y * H + Math.sin(t * .5 + b.x * 9) * 12); glow(cx, x, y, b.r * Math.min(W, H) * 1.5, hsl(h + b.h, 90, 70), .18 * b.d * paintK); }
  const w = W, hh = H, s = V.s;
  if(m === 'fly' || m === 'title'){ cx.fillStyle = 'rgba(255,255,255,.14)'; for(let i = 0; i < 6; i++){ const x = ((i * 0.23 * w - t * (20 + i * 6) * s * .3) % (w + 300) + w + 300) % (w + 300) - 150, y = hh * (.15 + (i % 3) * .28); for(const [dx, dy, r] of [[0, 0, 30], [32, -12, 26], [60, 0, 28]]){ cx.beginPath(); cx.arc(x + dx * s / 5, y + dy * s / 5, r * s / 5, 0, TAU); cx.fill(); } } }
  if(m === 'run'){ const gy = S(V.hh * .8); cx.fillStyle = hsl(h + 60, 50, 30, .6); cx.beginPath(); cx.moveTo(0, gy); for(let x = 0; x <= w + 20; x += 20) cx.lineTo(x, gy - S(12) - Math.sin((x + t * 40 * s * .5) * .01) * S(8)); cx.lineTo(w, gy); cx.fill(); cx.fillStyle = hsl(h + 120, 70, 60); cx.fillRect(0, gy, w, hh - gy); const off = (t * 50 * G.spd * s) % (S(8)); cx.fillStyle = hsl(h + 120, 80, 75); for(let x = -off; x < w; x += S(8)) cx.fillRect(x, gy, S(4), S(2)); cx.fillStyle = 'rgba(255,255,255,.6)'; cx.fillRect(0, gy, w, 3); }
  if(m === 'orbit'){ const c = [w / 2, hh / 2], mm = Math.min(V.ww, V.hh); glow(cx, c[0], c[1], S(mm * .16), hsl(h + 180, 90, 60), .8); cx.fillStyle = hsl(h + 180, 70, 55); cx.beginPath(); cx.arc(c[0], c[1], S(mm * .09), 0, TAU); cx.fill(); cx.strokeStyle = hsl(h + 180, 80, 80, .7); cx.lineWidth = 3; cx.beginPath(); cx.ellipse(c[0], c[1], S(mm * .14), S(mm * .04), -.3, 0, TAU); cx.stroke(); cx.setLineDash([6, 10]); cx.strokeStyle = 'rgba(255,255,255,.25)'; cx.lineWidth = 2; for(const R of [.2, .36]){ cx.beginPath(); cx.arc(c[0], c[1], S(mm * R), 0, TAU); cx.stroke(); } cx.setLineDash([]); for(let i = 0; i < 40; i++){ const x = hash(i) * w, y = hash(i + 50) * hh; cx.fillStyle = `rgba(255,255,255,${.3 + .5 * Math.abs(Math.sin(t + i))})`; cx.fillRect(x, y, 2, 2); } }
  if(m === 'dive'){ cx.strokeStyle = hsl(h + 180, 90, 75, .25); cx.lineWidth = 3; for(let i = 0; i < 8; i++){ const k = ((i / 8 + t * .35 * G.spd) % 1); cx.globalAlpha = 1 - k; cx.beginPath(); cx.ellipse(w / 2, hh * (1.1 - k * 1.3), w * (.1 + k * .6), hh * .05 * (1 + k), 0, 0, TAU); cx.stroke(); } cx.globalAlpha = 1; }
  if(m === 'dodge'){ cx.strokeStyle = 'rgba(255,255,255,.12)'; cx.lineWidth = 1.5; for(let i = 0; i < 30; i++){ const x = hash(i) * w, y = ((hash(i + 9) * hh + t * 300) % hh); cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x - 4, y + 18); cx.stroke(); } cx.fillStyle = hsl(h + 200, 30, 20, .7); for(let i = 0; i < 8; i++){ const x = i / 7 * w; cx.beginPath(); cx.arc(x, 0, S(12), 0, TAU); cx.fill(); } }
  if(m === 'smash'){ cx.fillStyle = hsl(h + 80, 50, 60, .35); for(let i = 0; i < 12; i++){ const x = ((i * w / 10 - t * 30 * s * .4) % (w + 100) + w + 100) % (w + 100) - 50; cx.fillRect(x, hh * .85 - S(5 + (i % 4) * 3), S(5), S(5 + (i % 4) * 3)); } cx.fillStyle = hsl(h + 100, 60, 50); cx.fillRect(0, hh * .85, w, hh * .15); }
  if(m === 'beat'){ const bi = .5, k = (G.t % bi) / bi; cx.strokeStyle = hsl(h + 200, 90, 75, .5 * (1 - k)); cx.lineWidth = 6 * (1 - k) + 1; cx.beginPath(); cx.arc(w / 2, hh / 2, S(10 + k * 60), 0, TAU); cx.stroke(); const n = 24; for(let i = 0; i < n; i++){ const bh = S(4 + Math.abs(Math.sin(t * 7 + i * 1.3)) * 14 * (1 - k * .5)); cx.fillStyle = hsl(h + i * 12, 90, 65, .45); cx.fillRect(i / n * w + 2, hh - bh, w / n - 4, bh); } cx.strokeStyle = 'rgba(255,255,255,.7)'; cx.lineWidth = 3; cx.beginPath(); cx.arc(w / 2, hh / 2, S(7), 0, TAU); cx.stroke(); }
  if(m === 'paint'){ cx.globalAlpha = .6; for(const p of G.paintLine){ glow(cx, S(p.x), S(p.y), S(4), hsl(p.h, 95, 65), .5); } cx.globalAlpha = 1; }
  if(m === 'grow'){ cx.strokeStyle = 'rgba(255,255,255,.12)'; cx.lineWidth = 2; for(let i = 0; i < 14; i++){ const x = hash(i + 3) * w, y = hash(i + 7) * hh; cx.beginPath(); cx.arc(x + Math.sin(t + i) * 8, y, S(2 + hash(i) * 5), 0, TAU); cx.stroke(); } }
}
function hash(n){ const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

/* ---------------- frame ---------------- */
let snapC = null, kalC = null;
// the kaleidoscope pattern is composed once per shift; each frame only spins and zooms it
function takeSnap(){
  if(!snapC){ snapC = document.createElement('canvas'); kalC = document.createElement('canvas'); }
  const q = 2.5; snapC.width = Math.max(2, W / q | 0); snapC.height = Math.max(2, H / q | 0);
  snapC.getContext('2d').drawImage(cv, 0, 0, snapC.width, snapC.height);
  const D = Math.ceil(Math.hypot(snapC.width, snapC.height)); kalC.width = kalC.height = D;
  const g = kalC.getContext('2d'), n = 10, seg = TAU / n, px = S(G.P.x) / q, py = S(G.P.y) / q;
  for(let i = 0; i < n; i++){
    g.save(); g.translate(D / 2, D / 2); g.rotate(i * seg); if(i % 2) g.scale(1, -1);
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, D * .72, 0, seg + .01); g.closePath(); g.clip();
    g.drawImage(snapC, -px, -py); g.restore();
  }
}
function kaleido(k, alpha){
  if(!kalC) return;
  const R = Math.hypot(W, H), c = [W / 2, H / 2], zoom = (1 + k * 1.6) * R / kalC.width * 1.02;
  cx.save(); cx.globalAlpha = alpha; cx.translate(c[0], c[1]); cx.rotate(k * 2.2); cx.scale(zoom, zoom);
  cx.drawImage(kalC, -kalC.width / 2, -kalC.height / 2); cx.restore();
  cx.save(); cx.globalAlpha = alpha;
  const g = cx.createRadialGradient(c[0], c[1], 0, c[0], c[1], R * .6); g.addColorStop(0, hsl(hueNow() + k * 200, 100, 85, .6 * Math.sin(k * Math.PI))); g.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);
  cx.restore();
}
function render(){
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const K = G.kalei;
  if(K && !K.snap){ K.snap = true; takeSnap(); }
  if(K && !K.switched){ cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H); kaleido(K.t / (K.d * .45), 1); return; }
  const sh = G.shake * 16; cx.save(); cx.translate(rnd(-sh, sh), rnd(-sh, sh));
  drawBG();
  // world transform for the twists that bend space
  cx.save();
  if(tw('mirror')){ cx.translate(W, 0); cx.scale(-1, 1); }
  if(tw('flip')){ cx.translate(0, H); cx.scale(1, -1); }
  if(tw('jelly')){ const k = Math.sin(G.rt * 6) * .06; cx.translate(W / 2, H / 2); cx.transform(1, k, -k, 1, 0, 0); cx.scale(1 + Math.sin(G.rt * 5) * .04, 1 - Math.sin(G.rt * 5) * .04); cx.translate(-W / 2, -H / 2); }
  if(G.mode === 'beat' && G.state === 'play'){ cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 2; cx.beginPath(); cx.arc(S(G.P.x), S(G.P.y), S(G.P.r + 5), 0, TAU); cx.stroke(); }
  for(const it of G.items) drawItem(it);
  // trail and particles
  for(const p of G.parts){ const a = Math.min(1, p.l / p.ml * 1.5), x = S(p.x), y = S(p.y), s = S(p.s); cx.globalAlpha = a; cx.fillStyle = p.c; cx.strokeStyle = p.c;
    if(p.sh === 'star'){ starPath(cx, x, y, s * 1.2, 4, .4, p.rot); cx.fill(); } else if(p.sh === 'heart'){ heartPath(cx, x, y, s); cx.fill(); } else if(p.sh === 'ring'){ cx.lineWidth = 1.5; cx.beginPath(); cx.arc(x, y, s, 0, TAU); cx.stroke(); } else if(p.sh === 'note'){ cx.font = `900 ${s * 3}px system-ui,sans-serif`; cx.fillText('♪', x, y); } else if(p.sh === 'snow'){ cx.lineWidth = 1.5; for(let i = 0; i < 3; i++){ const a = p.rot + i * Math.PI / 3; cx.beginPath(); cx.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s); cx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); cx.stroke(); } } else if(p.sh === 'conf'){ cx.save(); cx.translate(x, y); cx.rotate(p.rot); cx.fillRect(-s, -s * .45, s * 2, s * .9); cx.restore(); } else { cx.beginPath(); cx.arc(x, y, s, 0, TAU); cx.fill(); } }
  cx.globalAlpha = 1;
  // bolts to the boss
  for(const b of G.bolts){ if(b.cx === undefined) continue; glow(cx, S(b.cx), S(b.cy), S(4), b.c, .9); cx.fillStyle = '#ffffff'; starPath(cx, S(b.cx), S(b.cy), S(1.6), 4, .4, G.rt * 8); cx.fill(); }
  if(G.boss) drawBoss(G.boss);
  // portal
  if(tw('portal')){ const k = G.twist.t / G.twist.dur, x = S(G.P.x), y = S(G.P.y); cx.save(); cx.translate(x, y); cx.rotate(G.rt * 6); for(let i = 0; i < 5; i++){ cx.strokeStyle = hsl(270 + i * 20, 90, 70, .8); cx.lineWidth = 4; cx.beginPath(); cx.arc(0, 0, S(6 + i * 4) * k * 1.5, i, i + 4); cx.stroke(); } cx.restore(); glow(cx, x, y, S(20) * k, '#d8a0ff', k); }
  // the clone and the friend
  if(G.clone){ cx.globalAlpha = .55; drawDreamer(cx, S(G.clone.x), S(G.clone.y), S(G.P.r), charById(save.char), { t:G.rt, face:'wink', hat:save.hat }); cx.globalAlpha = 1; }
  if(G.friend){ const F = G.friend; drawDreamer(cx, S(F.x), S(F.y), S(3.6), F.c, { t:G.rt, face:F.face, look:[-F.side, 0] }); if(F.t < 2) bubble(S(F.x), S(F.y - 5), F.line, '#ffffff'); }
  // the player
  const P = G.P;
  if(G.state !== 'title'){
    const flick = G.inv > 0 && Math.sin(G.rt * 30) > 0;
    if(!flick){ cx.globalAlpha = tw('ghost') ? .5 : 1; const lk = [clamp((P.vx || 0) / 30 + (G.tx - P.x) / 20, -1, 1), clamp(P.vy / 60, -1, 1)]; const R = S(P.r) * (tw('bighead') ? 1.35 : 1); glow(cx, S(P.x), S(P.y), R * 2.4, hsl(hueNow() + 180, 100, 80), .45); drawDreamer(cx, S(P.x), S(P.y), R, charById(save.char), { t:G.rt, sq:P.sq, face:P.face, hat:save.hat, look:lk }); cx.globalAlpha = 1; }
  }
  // pops
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(const p of G.pops){ const k = p.t / p.d, sc = k < .12 ? .5 + k / .12 * .6 : 1.1 - (k - .12) * .1; cx.globalAlpha = k > .7 ? (1 - k) / .3 : 1; const sz = Math.round(p.s * clamp(Math.min(W, H) / 650, .8, 1.4) * sc); cx.font = `italic 900 ${sz}px system-ui,sans-serif`; cx.lineWidth = Math.max(3, sz * .2); cx.strokeStyle = INK; const px = clamp(S(p.x), sz * 3, W - sz * 3), py = clamp(S(p.y), sz, H - sz);
    if(tw('mirror') || tw('flip')){ cx.save(); cx.translate(px, py); cx.scale(tw('mirror') ? -1 : 1, tw('flip') ? -1 : 1); cx.strokeText(p.txt, 0, 0); cx.fillStyle = p.c; cx.fillText(p.txt, 0, 0); cx.restore(); } else { cx.strokeText(p.txt, px, py); cx.fillStyle = p.c; cx.fillText(p.txt, px, py); } }
  cx.globalAlpha = 1;
  cx.restore(); // world transform
  if(P.sayT > 0 && G.state !== 'title'){ let bx = S(P.x), by = S(P.y - P.r - 3); if(tw('mirror')) bx = W - bx; if(tw('flip')) by = H - by - S(P.r * 2 + 6); bubble(bx, by, P.say); }
  // twist overlays
  if(tw('disco')){ cx.globalCompositeOperation = 'lighter'; for(let i = 0; i < 6; i++){ const a = G.rt * 1.5 + i * TAU / 6; cx.fillStyle = hsl(i * 60 + G.rt * 100, 100, 60, .12); cx.beginPath(); cx.moveTo(W / 2, 0); cx.lineTo(W / 2 + Math.cos(a) * W, H); cx.lineTo(W / 2 + Math.cos(a + .25) * W, H); cx.fill(); } cx.globalCompositeOperation = 'source-over'; const r = Math.min(W, H) * .05; cx.fillStyle = '#c8d0e0'; cx.beginPath(); cx.arc(W / 2, r * 1.2, r, 0, TAU); cx.fill(); for(let i = 0; i < 16; i++){ cx.fillStyle = hsl(i * 40 + G.rt * 200, 90, 80); cx.fillRect(W / 2 + Math.cos(i * 2.4 + G.rt) * r * .6 - 3, r * 1.2 + Math.sin(i * 1.7) * r * .6 - 3, 6, 6); } }
  if(tw('dark')){ const x = S(tw('mirror') ? V.ww - P.x : P.x), y = S(P.y), g = cx.createRadialGradient(x, y, S(10), x, y, S(34)); g.addColorStop(0, 'rgba(4,0,16,0)'); g.addColorStop(1, 'rgba(4,0,16,.93)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
  if(tw('slowmo')){ cx.fillStyle = 'rgba(80,60,200,.12)'; cx.fillRect(0, 0, W, H); }
  if(tw('turbo')){ cx.strokeStyle = 'rgba(255,255,255,.35)'; cx.lineWidth = 2; for(let i = 0; i < 14; i++){ const y = hash(i + Math.floor(G.rt * 20)) * H, x = hash(i * 3 + Math.floor(G.rt * 20)) * W; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x - 80, y); cx.stroke(); } }
  if(G.jack) drawJackpot(G.jack);
  cx.restore(); // shake
  if(G.flash > 0){ cx.globalAlpha = G.flash * .55; cx.fillStyle = G.flashC; cx.fillRect(0, 0, W, H); cx.globalAlpha = 1; }
  if(K && K.switched){ kaleido(1 - (K.t - K.d * .45) / (K.d * .55), 1 - (K.t - K.d * .45) / (K.d * .55)); }
}
function drawJackpot(J){
  const syms = ['★', '♥', '♦', '7', '☾'], cols = { '★':'#ffe45a', '♥':'#ff5a8a', '♦':'#5ae8ff', '7':'#ff4a4a', '☾':'#d8c8ff' };
  const bw = Math.min(W * .7, 340), bh = bw * .38, x = W / 2 - bw / 2, y = Math.max(H * .2, 175);
  cx.fillStyle = '#2a1050'; rrect(cx, x - 8, y - 8, bw + 16, bh + 16, 18); cx.fill(); cx.strokeStyle = '#ffd23a'; cx.lineWidth = 4; cx.stroke();
  for(let i = 0; i < 16; i++){ cx.fillStyle = Math.sin(G.rt * 12 + i) > 0 ? '#ffe45a' : '#ff5ad0'; cx.beginPath(); cx.arc(x - 8 + i / 15 * (bw + 16), y - 8, 3.5, 0, TAU); cx.fill(); cx.beginPath(); cx.arc(x - 8 + i / 15 * (bw + 16), y + bh + 8, 3.5, 0, TAU); cx.fill(); }
  const rw = bw / 3;
  cx.font = `900 ${bh * .62}px system-ui,sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  for(let i = 0; i < 3; i++){
    cx.fillStyle = '#fff8e8'; rrect(cx, x + i * rw + 5, y + 4, rw - 10, bh - 8, 10); cx.fill();
    const s = J['s' + i] ? J.res[i] : syms[Math.floor(J.t * 22 + i * 2) % syms.length];
    cx.fillStyle = cols[s]; cx.fillText(s, x + i * rw + rw / 2, y + bh / 2 + (J['s' + i] ? 0 : Math.sin(J.t * 40) * 3));
  }
}
