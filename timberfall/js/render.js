'use strict';
/* =====================================================================
   Renderer: a 3/4 top-down forest. Trees are pre-rendered sprites that
   are rotated and stretched along the trunk, so a falling tree swings
   from standing up to lying flat in the direction it falls.
   Night is a darkness layer with light cut out around your lantern,
   the campfire, burning logs, wisps and golden trees.
   ===================================================================== */
const cv = document.getElementById('cv'), cx = cv.getContext('2d');
const dk = document.createElement('canvas'), dkx = dk.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, G.q === 'low' ? 1 : 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W * DPR | 0; cv.height = H * DPR | 0;
  dk.width = Math.ceil(W / 2); dk.height = Math.ceil(H / 2);
  G.cam.z = clamp(Math.min(W, H) / 680, .5, 1.3);
}
window.addEventListener('resize', resize);

/* ---------------- sprites ---------------- */
const SPR = {}; let sprBiome = '';
const SPR_H = 1.0;           // sprites are built for the base tree height
function mkCanvas(w, h){ const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
function buildSprites(B){
  if(sprBiome === B.id) return; sprBiome = B.id;
  for(const k in TREES){
    const d = TREES[k], lc = (B.leaf && B.leaf[k]) || (k === 'golden' ? ['#e7b43a', '#ffd86a'] : ['#3f7f35', '#5aa044']);
    const sh = d.h * .62, cw = Math.max(80, d.w * 3.4), pad = 20;
    const c = mkCanvas(cw + pad * 2, sh + pad * 2), g = c.getContext('2d');
    const bx = c.width / 2, by = sh + pad; // base
    const bark = d.bark || (k === 'golden' ? '#8a6a3a' : B.bark);
    // trunk
    const tw = d.w * .5;
    g.fillStyle = bark; g.beginPath(); g.moveTo(bx - tw, by); g.lineTo(bx - tw * .45, by - sh * .92); g.lineTo(bx + tw * .45, by - sh * .92); g.lineTo(bx + tw, by); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(bx + tw * .15, by - sh * .9, tw * .5, sh * .9);
    if(k === 'birch'){ g.fillStyle = '#2a2a2a'; for(let i = 0; i < 8; i++){ const y = by - sh * (.08 + i * .1); g.fillRect(bx - tw * .6 + (i % 2) * tw * .4, y, tw * .5, 2.5); } }
    const blob = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
    const [c1, c2] = lc;
    switch(d.crown){
      case 'cone': {
        for(let i = 0; i < 4; i++){
          const y0 = by - sh * (.25 + i * .19), wdt = cw * .5 * (1 - i * .2);
          g.fillStyle = c1; g.beginPath(); g.moveTo(bx - wdt, y0); g.lineTo(bx, y0 - sh * .3); g.lineTo(bx + wdt, y0); g.closePath(); g.fill();
          g.fillStyle = c2; g.beginPath(); g.moveTo(bx - wdt * .1, y0 - sh * .02); g.lineTo(bx, y0 - sh * .3); g.lineTo(bx + wdt * .7, y0 - sh * .02); g.closePath(); g.fill();
        }
        break;
      }
      case 'tall': {
        for(let i = 0; i < 6; i++){ const y = by - sh * (.35 + i * .11), r = cw * (.24 - i * .025); blob(bx - r * .3, y, r, c1); blob(bx + r * .35, y - r * .3, r * .7, c2); }
        break;
      }
      case 'bamboo': {
        g.clearRect(0, 0, c.width, c.height);
        for(let s = -1; s <= 1; s++){
          const x = bx + s * tw * 1.1, top = sh * (.85 + s * .06);
          g.fillStyle = s ? '#7aa84a' : '#8ac05a'; g.fillRect(x - tw * .45, by - top, tw * .9, top);
          g.fillStyle = '#5a7a30'; for(let y = by - 12; y > by - top; y -= 22) g.fillRect(x - tw * .5, y, tw, 2.5);
          g.fillStyle = s ? c1 : c2; for(let i = 0; i < 5; i++){ const y = by - top + i * 16; g.beginPath(); g.ellipse(x + (i % 2 ? 12 : -12), y, 14, 4, (i % 2 ? .4 : -.4), 0, TAU); g.fill(); }
        }
        break;
      }
      case 'dead': {
        g.strokeStyle = bark; g.lineCap = 'round';
        const br = (x, y, a, l, w, n) => { if(n <= 0) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); br(x2, y2, a - .5, l * .7, w * .65, n - 1); br(x2, y2, a + .45, l * .65, w * .65, n - 1); };
        br(bx, by - sh * .55, -Math.PI / 2 - .5, sh * .25, tw * .8, 3); br(bx, by - sh * .75, -Math.PI / 2 + .5, sh * .22, tw * .7, 3); br(bx, by - sh * .9, -Math.PI / 2, sh * .15, tw * .6, 2);
        blob(bx - cw * .2, by - sh * .8, 6, c1); blob(bx + cw * .25, by - sh * .7, 5, c2);
        break;
      }
      case 'oval': {
        for(let i = 0; i < 7; i++){ const a = i / 7 * TAU; blob(bx + Math.cos(a) * cw * .2, by - sh * .72 + Math.sin(a) * sh * .2, cw * .2, c1); }
        blob(bx, by - sh * .75, cw * .24, c1); blob(bx - cw * .08, by - sh * .82, cw * .16, c2); blob(bx + cw * .12, by - sh * .66, cw * .11, c2);
        break;
      }
      default: { // round
        const cy = by - sh * .68, R = cw * .42;
        for(let i = 0; i < 8; i++){ const a = i / 8 * TAU; blob(bx + Math.cos(a) * R * .55, cy + Math.sin(a) * R * .45, R * .5, c1); }
        blob(bx, cy, R * .6, c1); blob(bx - R * .25, cy - R * .3, R * .38, c2); blob(bx + R * .3, cy - R * .1, R * .26, c2);
        if(k === 'golden'){ g.fillStyle = '#fff6b0'; for(let i = 0; i < 9; i++){ g.beginPath(); g.arc(bx + rnd(-R * .8, R * .8), cy + rnd(-R * .6, R * .5), 2.5, 0, TAU); g.fill(); } }
      }
    }
    SPR[k] = { c, bx, by, sh };
  }
  // ground tile
  const T = mkCanvas(256, 256), g = T.getContext('2d'), gc = B.ground, r = mulberry32(hashStr(B.id));
  g.fillStyle = gc[0]; g.fillRect(0, 0, 256, 256);
  for(let i = 0; i < 26; i++){ g.fillStyle = rgba(gc[r() < .5 ? 1 : 2], .55); g.beginPath(); g.ellipse(r() * 256, r() * 256, 20 + r() * 40, 12 + r() * 26, r() * 3, 0, TAU); g.fill(); }
  for(let i = 0; i < 140; i++){ const x = r() * 256, y = r() * 256; g.strokeStyle = rgba(r() < .5 ? gc[1] : gc[2], .9); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y - 5); g.moveTo(x, y); g.lineTo(x + 2, y - 6); g.stroke(); }
  if(B.id === 'autumn' || B.id === 'haunt') for(let i = 0; i < 40; i++){ g.fillStyle = pick(B.id === 'autumn' ? ['#c8561e', '#e8b23a', '#a0401a'] : ['#5a4a60', '#3a3040']); g.beginPath(); g.ellipse(r() * 256, r() * 256, 3, 1.6, r() * 3, 0, TAU); g.fill(); }
  if(B.id === 'taiga') for(let i = 0; i < 40; i++){ g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(r() * 256, r() * 256, 1 + r() * 2, 0, TAU); g.fill(); }
  SPR.ground = cx.createPattern(T, 'repeat');
}

/* ---------------- tree drawing ---------------- */
function drawTreeAt(tr, bx, by, tx, ty, alpha){
  const s = SPR[tr.type]; if(!s) return;
  const vx = tx - bx, vy = ty - by, len = Math.hypot(vx, vy); if(len < 1) return;
  const ang = Math.atan2(vy, vx) + Math.PI / 2, k = tr.h / TREES[tr.type].h;
  cx.save(); cx.translate(bx, by); cx.rotate(ang); cx.scale(k * (tr.w / TREES[tr.type].w * .5 + .5), len / s.sh);
  if(alpha < 1) cx.globalAlpha = alpha;
  cx.drawImage(s.c, -s.bx, -s.by);
  cx.restore();
}
function treeTopStanding(tr){ return tr.h * .62 * Math.max(.05, tr.g); }

/* ---------------- entities ---------------- */
function drawShadow(x, y, rx, ry, a){ cx.fillStyle = `rgba(0,0,0,${a || .25})`; cx.beginPath(); cx.ellipse(x, y, rx, ry, 0, 0, TAU); cx.fill(); }
function drawPlayer(){
  const o = OUTFITS.find(o => o.id === save.outfit) || OUTFITS[0], x = P.x, y = P.y, bob = Math.sin(P.walk) * 2;
  drawShadow(x, y + 4, 15, 6);
  if(P.iv > 0 && (G.rt * 20 | 0) % 2) cx.globalAlpha = .5;
  // legs
  cx.fillStyle = '#2a3a5a'; cx.fillRect(x - 8, y - 10 + Math.max(0, bob), 6, 12); cx.fillRect(x + 2, y - 10 - Math.min(0, bob), 6, 12);
  // body (flannel)
  cx.fillStyle = o.shirt; cx.beginPath(); cx.roundRect(x - 12, y - 32 + bob * .3, 24, 24, 7); cx.fill();
  cx.fillStyle = o.check; cx.fillRect(x - 12, y - 24 + bob * .3, 24, 3); cx.fillRect(x - 4, y - 32 + bob * .3, 3, 24); cx.fillRect(x + 5, y - 32 + bob * .3, 3, 24);
  // head, beard, hat
  cx.fillStyle = '#f0c8a0'; cx.beginPath(); cx.arc(x, y - 40 + bob * .3, 9, 0, TAU); cx.fill();
  cx.fillStyle = '#8a4a22'; cx.beginPath(); cx.arc(x, y - 36 + bob * .3, 8, .1, Math.PI - .1); cx.fill();
  cx.fillStyle = o.hat; cx.beginPath(); cx.arc(x, y - 44 + bob * .3, 9.5, Math.PI, 0); cx.fill(); cx.fillRect(x - 11, y - 45 + bob * .3, 22, 3);
  cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(x, y - 53 + bob * .3, 3, 0, TAU); cx.fill();
  // axe
  const a = axeDef(), sw = P.swing > 0 ? P.swing : 0, aa = P.face + (sw > 0 ? (sw - .5) * 2.4 : -.9);
  cx.save(); cx.translate(x, y - 22); cx.rotate(aa);
  cx.fillStyle = a.col[1]; cx.fillRect(4, -2, 30, 4);
  cx.fillStyle = a.col[0]; cx.beginPath(); cx.moveTo(26, -3); cx.lineTo(38, -10); cx.lineTo(40, 6); cx.lineTo(26, 3); cx.fill();
  if(a.id === 'double'){ cx.beginPath(); cx.moveTo(26, -3); cx.lineTo(16, -9); cx.lineTo(15, 6); cx.lineTo(26, 3); cx.fill(); }
  cx.restore();
  if(sw > .3){ cx.strokeStyle = `rgba(255,255,255,${(sw - .3) * .6})`; cx.lineWidth = 6; cx.beginPath(); cx.arc(x, y - 16, S.reach * .8, P.swingA - S.arc / 2, P.swingA + S.arc / 2); cx.stroke(); }
  cx.globalAlpha = 1;
}
function eyes(x, y, s, col){ cx.fillStyle = col || '#ffec6a'; cx.beginPath(); cx.arc(x - s, y, s * .6, 0, TAU); cx.arc(x + s, y, s * .6, 0, TAU); cx.fill(); }
function drawFoe(e){
  const d = e.d, r = e.r, x = e.x, y = e.y, t = e.t, hit = e.hitT > 0, dir = Math.cos(e.face) < 0 ? -1 : 1;
  if(!d.fly) drawShadow(x, y + 2, r, r * .4);
  cx.save(); cx.translate(x, y);
  const col = hit ? '#ffffff' : d.col;
  switch(e.type){
    case 'thorn': {
      const hop = Math.abs(Math.sin(t * 8)) * 4;
      cx.fillStyle = col; cx.beginPath();
      for(let i = 0; i < 16; i++){ const a = i / 16 * TAU, rr = i % 2 ? r : r * .7; cx.lineTo(Math.cos(a) * rr, -r - hop + Math.sin(a) * rr); }
      cx.fill(); eyes(0, -r - hop - 2, 3.5, '#ffe86a'); break;
    }
    case 'wisp': {
      const fy = -26 + Math.sin(t * 4) * 5;
      drawShadow(0, 0, 8, 3, .15);
      cx.fillStyle = rgba('#9fe8ff', .3); cx.beginPath(); cx.arc(0, fy, r * 1.8, 0, TAU); cx.fill();
      cx.fillStyle = hit ? '#fff' : '#d8f8ff'; cx.beginPath(); cx.arc(0, fy, r, 0, TAU); cx.fill();
      cx.beginPath(); cx.moveTo(-r * .7, fy + 3); cx.quadraticCurveTo(-dir * 6, fy + 22, -dir * 14, fy + 18 + Math.sin(t * 9) * 3); cx.lineTo(r * .7, fy + 3); cx.fill();
      eyes(0, fy, 3, '#1a4a6a'); break;
    }
    case 'boar': {
      cx.scale(dir, 1); const wind = e.st === 'wind' ? Math.sin(t * 50) * 2 : 0;
      cx.fillStyle = col; cx.beginPath(); cx.ellipse(wind, -r * .8, r * 1.2, r * .8, 0, 0, TAU); cx.fill();
      cx.fillStyle = '#4a2a1a'; cx.beginPath(); cx.ellipse(r * .9 + wind, -r * .9, r * .5, r * .45, 0, 0, TAU); cx.fill();
      cx.fillStyle = '#f5ecd8'; cx.beginPath(); cx.moveTo(r * 1.2, -r * .7); cx.lineTo(r * 1.6, -r * 1.2); cx.lineTo(r * 1.3, -r * .6); cx.fill();
      eyes(r * .95, -r * 1.1, 2.5, e.st === 'charge' || e.st === 'wind' ? '#ff4a2a' : '#ffec6a'); break;
    }
    case 'wolf': {
      cx.scale(dir, 1); const leg = Math.sin(t * 14) * 4;
      cx.fillStyle = hit ? '#fff' : '#4a4a5a'; cx.fillRect(-r * .8, -r * .6, 4, r * .6 + leg); cx.fillRect(r * .5, -r * .6, 4, r * .6 - leg);
      cx.fillStyle = col; cx.beginPath(); cx.ellipse(0, -r * .9, r * 1.1, r * .55, 0, 0, TAU); cx.fill();
      cx.beginPath(); cx.moveTo(r * .7, -r * 1.3); cx.lineTo(r * 1.6, -r * .95); cx.lineTo(r * .8, -r * .6); cx.fill();
      cx.beginPath(); cx.moveTo(r * .8, -r * 1.3); cx.lineTo(r * .95, -r * 1.8); cx.lineTo(r * 1.1, -r * 1.25); cx.fill();
      cx.beginPath(); cx.moveTo(-r * 1, -r * 1); cx.lineTo(-r * 1.7, -r * 1.3); cx.lineTo(-r * 1, -r * .8); cx.fill();
      eyes(r * 1.1, -r * 1.1, 2, '#ff5a3a'); break;
    }
    case 'beaver': {
      cx.scale(dir, 1);
      cx.fillStyle = hit ? '#fff' : '#4a3020'; cx.beginPath(); cx.ellipse(-r * 1.1, -r * .3, r * .7, r * .3, .3, 0, TAU); cx.fill();
      cx.fillStyle = col; cx.beginPath(); cx.ellipse(0, -r * .8, r * .9, r * .8, 0, 0, TAU); cx.fill();
      cx.fillStyle = '#2a1a10'; cx.fillRect(-r * .8, -r * 1.2, r * 1.6, 4);      // bandit mask
      cx.fillStyle = '#fff'; cx.fillRect(r * .5, -r * .55, 5, 6);
      eyes(r * .2, -r * 1.1, 2, '#fff'); break;
    }
    case 'spore': {
      const pul = 1 + Math.sin(t * 5) * .06;
      cx.fillStyle = '#f0e0c8'; cx.fillRect(-r * .35, -r * .9, r * .7, r * .9);
      cx.fillStyle = col; cx.beginPath(); cx.ellipse(0, -r * .9, r * pul, r * .75 * pul, 0, Math.PI, 0); cx.fill();
      cx.fillStyle = '#fff4f8'; [[-.5, -1.2], [.3, -1.4], [.55, -1]].forEach(([a, b]) => { cx.beginPath(); cx.arc(a * r, b * r, 3, 0, TAU); cx.fill(); });
      eyes(0, -r * .5, 2.2, '#2a1a2a'); break;
    }
    case 'bark': {
      const sway = Math.sin(t * 3) * 3;
      cx.fillStyle = col; cx.beginPath(); cx.roundRect(-r * .8, -r * 2.1, r * 1.6, r * 2.1, 6); cx.fill();
      cx.strokeStyle = hit ? '#fff' : '#3a2a1a'; cx.lineWidth = 2; for(let i = -1; i <= 1; i++){ cx.beginPath(); cx.moveTo(i * r * .4, -r * 2); cx.lineTo(i * r * .45, -r * .1); cx.stroke(); }
      cx.fillStyle = '#4a7a30'; cx.beginPath(); cx.arc(sway, -r * 2.2, r * .6, 0, TAU); cx.fill();
      eyes(0, -r * 1.4, 3.5, '#ff9a3a'); break;
    }
    case 'owlbear': {
      cx.scale(dir, 1); const b = Math.sin(t * 6) * 2;
      cx.fillStyle = col; cx.beginPath(); cx.ellipse(0, -r + b, r, r * .95, 0, 0, TAU); cx.fill();
      cx.fillStyle = hit ? '#fff' : '#c8a878'; cx.beginPath(); cx.ellipse(0, -r * .8 + b, r * .55, r * .6, 0, 0, TAU); cx.fill();
      cx.fillStyle = col; cx.beginPath(); cx.arc(r * .3, -r * 1.7 + b, r * .55, 0, TAU); cx.fill();
      cx.beginPath(); cx.moveTo(0, -r * 2.1); cx.lineTo(r * .1, -r * 2.5); cx.lineTo(r * .3, -r * 2.15); cx.moveTo(r * .5, -r * 2.15); cx.lineTo(r * .7, -r * 2.5); cx.lineTo(r * .75, -r * 2); cx.fill();
      cx.fillStyle = '#ffec6a'; cx.beginPath(); cx.arc(r * .15, -r * 1.75 + b, 5, 0, TAU); cx.arc(r * .55, -r * 1.75 + b, 5, 0, TAU); cx.fill();
      cx.fillStyle = '#e8a030'; cx.beginPath(); cx.moveTo(r * .3, -r * 1.6 + b); cx.lineTo(r * .45, -r * 1.3 + b); cx.lineTo(r * .6, -r * 1.6 + b); cx.fill(); break;
    }
    case 'stump': {
      cx.fillStyle = '#3a2412'; for(let i = 0; i < 6; i++){ const a = i / 6 * TAU + Math.sin(t + i) * .1; cx.beginPath(); cx.ellipse(Math.cos(a) * r * .9, Math.sin(a) * r * .35, r * .5, r * .15, a, 0, TAU); cx.fill(); }
      cx.fillStyle = col; cx.beginPath(); cx.roundRect(-r * .9, -r * 1.5, r * 1.8, r * 1.5, 10); cx.fill();
      cx.fillStyle = hit ? '#fff' : '#c89a6a'; cx.beginPath(); cx.ellipse(0, -r * 1.5, r * .9, r * .3, 0, 0, TAU); cx.fill();
      cx.strokeStyle = '#8a6a42'; cx.lineWidth = 2; for(let i = 1; i < 4; i++){ cx.beginPath(); cx.ellipse(0, -r * 1.5, r * .22 * i, r * .075 * i, 0, 0, TAU); cx.stroke(); }
      eyes(0, -r * .9, 7, '#ff6a2a');
      cx.fillStyle = '#1a0e06'; cx.beginPath(); cx.ellipse(0, -r * .45, r * .4, 7 + Math.sin(t * 3) * 4, 0, 0, TAU); cx.fill(); break;
    }
    case 'hollow': {
      const fl = Math.sin(t * 2) * 6;
      cx.fillStyle = 'rgba(40,20,70,.35)'; cx.beginPath(); cx.arc(0, -r * 1.3 + fl, r * 1.6, 0, TAU); cx.fill();
      cx.fillStyle = col; cx.beginPath(); cx.moveTo(-r, 0); cx.quadraticCurveTo(-r * 1.1, -r * 1.6 + fl, -r * .5, -r * 2.2 + fl); cx.lineTo(r * .5, -r * 2.2 + fl); cx.quadraticCurveTo(r * 1.1, -r * 1.6 + fl, r, 0); cx.closePath(); cx.fill();
      cx.strokeStyle = hit ? '#fff' : '#3a2a50'; cx.lineWidth = 7; cx.lineCap = 'round';
      [[-.5, -2.1, -1.4, -3], [.5, -2.1, 1.4, -3.1], [0, -2.2, .1, -3.3]].forEach(([a, b, c2, d2]) => { cx.beginPath(); cx.moveTo(a * r, b * r + fl); cx.lineTo(c2 * r, d2 * r + fl); cx.stroke(); });
      cx.fillStyle = '#ffd23a'; cx.beginPath(); for(let i = 0; i < 5; i++){ cx.lineTo(-r * .5 + i * r * .25, -r * 2.2 + fl - (i % 2 ? 6 : 22)); } cx.lineTo(r * .5, -r * 2.2 + fl); cx.lineTo(-r * .5, -r * 2.2 + fl); cx.fill();
      cx.fillStyle = '#b8f0ff'; cx.shadowColor = '#9fe8ff'; cx.shadowBlur = 16; eyes(0, -r * 1.5 + fl, 8, '#b8f0ff'); cx.shadowBlur = 0; break;
    }
  }
  cx.restore();
  if(d.elite || (e.hp < e.maxHp && !d.boss && e.maxHp > 40)){ const w = r * 2; cx.fillStyle = 'rgba(0,0,0,.5)'; cx.fillRect(x - w / 2, y + 6, w, 4); cx.fillStyle = d.elite ? '#ff8a3a' : '#e84a3a'; cx.fillRect(x - w / 2, y + 6, w * clamp(e.hp / e.maxHp, 0, 1), 4); }
  if(e.type === 'beaver' && e.gnaw > 0){ cx.fillStyle = '#ffd23a'; cx.fillRect(x - 12, y - r * 2.4, 24 * e.gnaw / 2.4, 3); }
}

/* ---------------- frame ---------------- */
const drawList = [];
function render(){
  const z = G.cam.z;
  if(G.state !== 'menu' && P){
    G.cam.x = lerp(G.cam.x, P.x, .12); G.cam.y = lerp(G.cam.y, P.y - 20, .12);
  } else { G.cam.x = CX + Math.sin(G.rt * .05) * 300; G.cam.y = CY + Math.cos(G.rt * .04) * 300; }
  const sh = save.opt.shake ? G.shake : 0, ox = rnd(-sh, sh), oy = rnd(-sh, sh);
  const vw = W / z, vh = H / z, L = G.cam.x - vw / 2, T = G.cam.y - vh / 2;
  cx.setTransform(DPR * z, 0, 0, DPR * z, DPR * (-L * z + ox), DPR * (-T * z + oy));
  // ground
  cx.fillStyle = SPR.ground || '#4e7a33'; cx.fillRect(L - 20, T - 20, vw + 40, vh + 40);
  // world edge
  cx.fillStyle = 'rgba(10,20,10,.55)';
  if(L < 0) cx.fillRect(L - 20, T - 20, -L + 20, vh + 40); if(T < 0) cx.fillRect(L - 20, T - 20, vw + 40, -T + 20);
  if(L + vw > WORLD) cx.fillRect(WORLD, T - 20, L + vw - WORLD + 20, vh + 40); if(T + vh > WORLD) cx.fillRect(L - 20, WORLD, vw + 40, T + vh - WORLD + 20);
  // camp clearing
  if(Math.abs(CX - G.cam.x) < vw && Math.abs(CY - G.cam.y) < vh) drawCamp();
  // roots (boss telegraphs)
  for(const r of G.roots){ const k = r.t / r.warn; cx.strokeStyle = r.hit ? '#5a3a22' : `rgba(255,80,40,${.25 + .35 * Math.sin(r.t * 20) ** 2})`; cx.lineWidth = r.hit ? 18 : 26 * Math.min(1, k); cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(r.x1, r.y1); cx.lineTo(lerp(r.x1, r.x2, r.hit ? 1 : Math.min(1, k * 1.2)), lerp(r.y1, r.y2, r.hit ? 1 : Math.min(1, k * 1.2))); cx.stroke(); }
  // poison clouds
  for(const c of G.clouds){ const a = Math.min(1, (c.l - c.t) * 2) * .35; cx.fillStyle = `rgba(200,90,160,${a})`; for(let i = 0; i < 5; i++){ cx.beginPath(); cx.arc(c.x + Math.cos(i * 1.3 + c.t) * c.r * .4, c.y + Math.sin(i * 1.7 + c.t) * c.r * .3, c.r * .6, 0, TAU); cx.fill(); } }
  // stumps and logs lie on the ground
  const inView = (x, y, m) => x > L - m && x < L + vw + m && y > T - m && y < T + vh + m;
  for(const t of G.trees){
    if(t.st === 'stump' && inView(t.x, t.y, 40)){ cx.fillStyle = G.biome.bark; cx.beginPath(); cx.ellipse(t.x, t.y, t.w * .55, t.w * .3, 0, 0, TAU); cx.fill(); cx.fillStyle = '#d8b88a'; cx.beginPath(); cx.ellipse(t.x, t.y - 4, t.w * .5, t.w * .26, 0, 0, TAU); cx.fill(); cx.strokeStyle = '#a8845a'; cx.lineWidth = 1.5; cx.beginPath(); cx.ellipse(t.x, t.y - 4, t.w * .25, t.w * .13, 0, 0, TAU); cx.stroke(); }
  }
  for(const Lg of G.logs){
    if(!inView((Lg.x1 + Lg.x2) / 2, (Lg.y1 + Lg.y2) / 2, 300)) continue;
    const fade = Math.min(1, (Lg.life - Lg.t) / 2); cx.globalAlpha = fade;
    cx.lineCap = 'round'; cx.strokeStyle = TREES[Lg.type].bark || G.biome.bark; cx.lineWidth = Lg.w; cx.beginPath(); cx.moveTo(Lg.x1, Lg.y1); cx.lineTo(Lg.x2, Lg.y2); cx.stroke();
    cx.strokeStyle = 'rgba(0,0,0,.18)'; cx.lineWidth = Lg.w * .35; cx.beginPath(); cx.moveTo(Lg.x1, Lg.y1 + Lg.w * .2); cx.lineTo(Lg.x2, Lg.y2 + Lg.w * .2); cx.stroke();
    cx.fillStyle = '#d8b88a'; cx.beginPath(); cx.arc(Lg.x1, Lg.y1, Lg.w * .42, 0, TAU); cx.fill();
    if(Lg.burn > 0){ cx.strokeStyle = `rgba(255,${120 + Math.sin(G.rt * 20) * 40 | 0},30,.55)`; cx.lineWidth = Lg.w * .7; cx.beginPath(); cx.moveTo(Lg.x1, Lg.y1); cx.lineTo(Lg.x2, Lg.y2); cx.stroke(); }
    cx.globalAlpha = 1;
  }
  // pickups
  for(const p of G.picks){ if(!inView(p.x, p.y, 20)) continue; const b = Math.sin(p.t * 6 + p.x) * 2; if(p.k === 'wood'){ cx.fillStyle = '#e8c89a'; cx.save(); cx.translate(p.x, p.y + b); cx.rotate(p.x); cx.fillRect(-5, -2.5, 10, 5); cx.fillStyle = '#a8845a'; cx.fillRect(-5, -2.5, 3, 5); cx.restore(); } else { cx.fillStyle = '#ffd23a'; cx.beginPath(); cx.arc(p.x, p.y + b - 3, 5.5, 0, TAU); cx.fill(); cx.fillStyle = '#fff6b0'; cx.beginPath(); cx.arc(p.x - 1.5, p.y + b - 4.5, 2, 0, TAU); cx.fill(); } }
  // y-sorted: trees, falling trees, creatures, player, helpers
  drawList.length = 0;
  for(const t of G.trees){ if((t.st === 'stand' || t.st === 'sapling' || t.st === 'falling') && inView(t.x, t.y - 60, 300)) drawList.push(t.y, 0, t); }
  for(const e of G.foes) if(inView(e.x, e.y, 120)) drawList.push(e.y, 1, e);
  if(P && G.state !== 'menu') drawList.push(P.y, 2, P);
  for(const b of G.buddies) drawList.push(b.y, 3, b);
  const idx = []; for(let i = 0; i < drawList.length; i += 3) idx.push(i); idx.sort((a, b) => drawList[a] - drawList[b]);
  const falling = new Map(); for(const f of G.falls) falling.set(f.tr, f);
  for(const i of idx){
    const k = drawList[i + 1], o = drawList[i + 2];
    if(k === 0){
      const f = falling.get(o);
      if(f){
        const p = Math.pow(Math.min(1, f.t / f.dur), 2.2), th = p * Math.PI / 2, L2 = o.h;
        const tx = o.x + Math.cos(f.a) * L2 * Math.sin(th), ty = o.y + Math.sin(f.a) * L2 * Math.sin(th) - o.h * .62 * Math.cos(th);
        // landing shadow warns of the fall path
        cx.strokeStyle = 'rgba(0,0,0,.18)'; cx.lineWidth = o.w * 1.6 * S.fallW; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(o.x, o.y); cx.lineTo(o.x + Math.cos(f.a) * L2, o.y + Math.sin(f.a) * L2); cx.stroke();
        drawTreeAt(o, o.x, o.y, tx, ty, 1);
      } else {
        const g = o.g, top = treeTopStanding(o), sk = o.shake > 0 ? Math.sin(G.rt * 60) * 3 : 0;
        drawShadow(o.x + 10, o.y + 2, o.w * 1.3 * g + 4, o.w * .5 * g + 2, .22);
        let alpha = 1;
        if(P && G.state !== 'menu' && P.y < o.y && P.y > o.y - top && Math.abs(P.x - o.x) < o.w * 1.6 + 20) alpha = .45;
        if(o.st === 'sapling'){ drawTreeAt(o, o.x, o.y, o.x + sk, o.y - Math.max(8, top), alpha); }
        else drawTreeAt(o, o.x, o.y, o.x + sk, o.y - top, alpha);
        if(o.hp < o.maxHp && o.st === 'stand'){ cx.fillStyle = '#fff4d6'; for(let n = 0; n < o.maxHp - o.hp; n++){ cx.beginPath(); cx.moveTo(o.x - o.w * .3, o.y - 14 - n * 3); cx.lineTo(o.x + o.w * .2, o.y - 12 - n * 3); cx.lineTo(o.x - o.w * .3, o.y - 10 - n * 3); cx.fill(); } }
        if(o.type === 'golden' && o.st === 'stand' && G.rt % 1 < .5){ cx.fillStyle = '#fff6b0'; cx.beginPath(); cx.arc(o.x + rnd(-20, 20), o.y - top * rnd(.5, 1), 2, 0, TAU); cx.fill(); }
      }
    } else if(k === 1) drawFoe(o);
    else if(k === 2) drawPlayer();
    else { cx.fillStyle = '#8a5a32'; drawShadow(o.x, o.y + 2, 10, 4); cx.beginPath(); cx.ellipse(o.x, o.y - 9, 10, 9, 0, 0, TAU); cx.fill(); cx.fillStyle = '#4a3020'; cx.beginPath(); cx.ellipse(o.x - 10, o.y - 3, 7, 3, .3, 0, TAU); cx.fill(); cx.fillStyle = '#c0392b'; cx.fillRect(o.x - 8, o.y - 13, 16, 3); eyes(o.x + 2, o.y - 12, 1.6, '#fff'); }
  }
  // owls
  for(const o of G.owls){ drawShadow(o.x, o.y + 40, 8, 3, .12); cx.fillStyle = '#9a7a5a'; cx.beginPath(); cx.ellipse(o.x, o.y, 9, 11, 0, 0, TAU); cx.fill(); const fl = Math.sin(G.rt * 18) * 8; cx.beginPath(); cx.ellipse(o.x - 10, o.y - 2, 10, 4, fl * .06, 0, TAU); cx.ellipse(o.x + 10, o.y - 2, 10, 4, -fl * .06, 0, TAU); cx.fill(); eyes(o.x, o.y - 4, 2.6, '#ffe86a'); }
  // projectiles
  for(const s of G.shots){ if(s.k === 'splinter'){ cx.strokeStyle = '#e8c89a'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(s.x, s.y); cx.lineTo(s.x - s.vx * .03, s.y - s.vy * .03); cx.stroke(); } else { cx.fillStyle = 'rgba(160,230,255,.3)'; cx.beginPath(); cx.arc(s.x, s.y - 16, s.r * 1.8, 0, TAU); cx.fill(); cx.fillStyle = '#d8f8ff'; cx.beginPath(); cx.arc(s.x, s.y - 16, s.r, 0, TAU); cx.fill(); } }
  // particles
  for(const p of G.fx){
    const a = clamp(p.l * 2, 0, 1); cx.globalAlpha = p.k === 'dust' ? a * .35 : a; cx.fillStyle = p.c;
    if(p.k === 'leaf'){ cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore(); }
    else { cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, TAU); cx.fill(); }
  }
  cx.globalAlpha = 1;
  // lightning
  for(const b of G.bolts){ cx.strokeStyle = `rgba(230,240,255,${1 - b.t / .4})`; cx.lineWidth = 4; cx.beginPath(); let x = b.x + rnd(-10, 10), y = b.y - 600; cx.moveTo(x, y); while(y < b.y - 20){ y += 50; x += rnd(-25, 25); cx.lineTo(x, y); } cx.lineTo(b.x, b.y - 40); cx.stroke(); }
  // night
  if(G.state !== 'menu') drawDark(L, T, z);
  // floating text in screen space
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.textAlign = 'center'; cx.font = '800 16px Nunito, system-ui, sans-serif';
  for(const p of G.pops){
    const sx = (p.x - L) * z + ox * z, sy = (p.y - T) * z + oy * z, k = p.t / p.d, sc = k < .15 ? .6 + k / .15 * .5 : 1.1 - (k - .15) * .15;
    cx.globalAlpha = k > .7 ? (1 - k) / .3 : 1;
    cx.font = `900 ${Math.round(p.s * sc * Math.max(.8, z))}px Nunito, system-ui, sans-serif`;
    cx.lineWidth = 4; cx.strokeStyle = 'rgba(30,18,8,.85)'; cx.strokeText(p.txt, sx, sy); cx.fillStyle = p.c; cx.fillText(p.txt, sx, sy);
  }
  cx.globalAlpha = 1;
  // boss direction arrow
  if(G.boss && G.state === 'play'){ const b = G.boss, sx = (b.x - L) * z, sy = (b.y - T) * z; if(sx < 0 || sy < 0 || sx > W || sy > H){ const a = Math.atan2(sy - H / 2, sx - W / 2), ex = clamp(W / 2 + Math.cos(a) * W, 30, W - 30), ey = clamp(H / 2 + Math.sin(a) * H, 90, H - 30); cx.save(); cx.translate(ex, ey); cx.rotate(a); cx.fillStyle = '#ff6a3a'; cx.beginPath(); cx.moveTo(16, 0); cx.lineTo(-8, -11); cx.lineTo(-8, 11); cx.fill(); cx.restore(); } }
  if(G.flash > 0){ cx.fillStyle = `rgba(255,250,230,${G.flash * .6})`; cx.fillRect(0, 0, W, H); }
  if(P && P.hurtT > 0){ const g = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .7); g.addColorStop(0, 'rgba(200,0,0,0)'); g.addColorStop(1, `rgba(200,20,10,${P.hurtT})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
}
function drawCamp(){
  cx.fillStyle = 'rgba(120,90,50,.35)'; cx.beginPath(); cx.ellipse(CX, CY, 130, 90, 0, 0, TAU); cx.fill();
  // cabin
  cx.fillStyle = '#6a4428'; cx.fillRect(CX - 170, CY - 160, 120, 80); cx.fillStyle = '#4a2a18'; for(let i = 0; i < 5; i++) cx.fillRect(CX - 170, CY - 150 + i * 16, 120, 3);
  cx.fillStyle = '#8a2a1a'; cx.beginPath(); cx.moveTo(CX - 182, CY - 158); cx.lineTo(CX - 110, CY - 205); cx.lineTo(CX - 38, CY - 158); cx.fill();
  cx.fillStyle = '#ffd88a'; cx.fillRect(CX - 130, CY - 140, 22, 18);
  // woodpile
  cx.fillStyle = '#8a5a32'; for(let i = 0; i < 6; i++){ cx.beginPath(); cx.arc(CX + 80 + (i % 3) * 14 + (i > 2 ? 7 : 0), CY - 110 - (i > 2 ? 12 : 0), 7, 0, TAU); cx.fill(); }
  // campfire
  cx.fillStyle = '#5a5a5a'; for(let i = 0; i < 8; i++){ const a = i / 8 * TAU; cx.beginPath(); cx.arc(CX + Math.cos(a) * 20, CY + Math.sin(a) * 10, 6, 0, TAU); cx.fill(); }
  const f = Math.sin(G.rt * 12) * 3;
  cx.fillStyle = '#ff6a1a'; cx.beginPath(); cx.moveTo(CX - 14, CY); cx.quadraticCurveTo(CX - 10, CY - 30 - f, CX, CY - 40 + f); cx.quadraticCurveTo(CX + 10, CY - 30 + f, CX + 14, CY); cx.fill();
  cx.fillStyle = '#ffd24a'; cx.beginPath(); cx.moveTo(CX - 7, CY); cx.quadraticCurveTo(CX - 4, CY - 16, CX, CY - 24 - f); cx.quadraticCurveTo(CX + 4, CY - 16, CX + 7, CY); cx.fill();
  if(Math.random() < .3) G.fx.push({ k:'ember', x:CX + rnd(-8, 8), y:CY - 20, vx:rnd(-15, 15), vy:rnd(-70, -40), l:rnd(.5, 1), c:'#ffb03a', s:rnd(1.5, 2.5) });
}
function drawDark(L, T, z){
  const a = G.dark; if(a <= .02) return;
  const s = .5, w = dk.width, h = dk.height;
  dkx.globalCompositeOperation = 'source-over'; dkx.clearRect(0, 0, w, h);
  dkx.fillStyle = rgba(G.biome.fog, a); dkx.fillRect(0, 0, w, h);
  dkx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, k) => { const sx = (x - L) * z * s, sy = (y - T) * z * s, sr = r * z * s; if(sx < -sr || sy < -sr || sx > w + sr || sy > h + sr) return; const g = dkx.createRadialGradient(sx, sy, sr * .15, sx, sy, sr); g.addColorStop(0, `rgba(0,0,0,${k})`); g.addColorStop(1, 'rgba(0,0,0,0)'); dkx.fillStyle = g; dkx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2); };
  hole(P.x, P.y - 20, 250 * S.light + Math.sin(G.rt * 7) * 4, 1); hole(P.x, P.y - 20, 110, .9);
  hole(CX, CY - 10, 260, 1);
  for(const Lg of G.logs) if(Lg.burn > 0){ hole(lerp(Lg.x1, Lg.x2, .3), lerp(Lg.y1, Lg.y2, .3), 120, .8); hole(lerp(Lg.x1, Lg.x2, .75), lerp(Lg.y1, Lg.y2, .75), 120, .8); }
  for(const e of G.foes){ if(e.type === 'wisp') hole(e.x, e.y - 26, 60, .6); else if(e.type === 'hollow') hole(e.x, e.y - 80, 180, .6); }
  for(const t of G.trees) if(t.type === 'golden' && t.st === 'stand') hole(t.x, t.y - 60, 110, .6);
  for(const b of G.bolts) hole(b.x, b.y, 500, 1 - b.t / .4);
  for(const s2 of G.shots) if(s2.k === 'ghost') hole(s2.x, s2.y - 16, 40, .5);
  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.drawImage(dk, 0, 0, cv.width, cv.height);
}
