'use strict';
/* =====================================================================
   Procedural paintings. Each world is painted in code from a seed, so
   every canvas is different and nothing is loaded from files.
   ===================================================================== */
function mkCanvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
function lgrad(g, x0, y0, x1, y1, stops){ const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; }
function rgrad(g, x, y, r0, r1, stops){ const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); return gr; }
function circ(g, x, y, r, col){ g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
function hills(g, R, base, amp, col, n){
  g.fillStyle = col; g.beginPath(); g.moveTo(0, PW);
  const ph = R() * 10, f1 = 1 + R() * 2, f2 = 3 + R() * 3;
  for(let x = 0; x <= PW; x += 8) g.lineTo(x, base - amp * (Math.sin(x / PW * f1 * TAU / 2 + ph) * .6 + Math.sin(x / PW * f2 * TAU / 2 + ph * 2) * .3));
  g.lineTo(PW, PW); g.closePath(); g.fill();
}
function cloud(g, x, y, s, col){ g.fillStyle = col; for(let i = 0; i < 5; i++){ g.beginPath(); g.ellipse(x + (i - 2) * 18 * s, y - (i % 2) * 10 * s, 26 * s, 18 * s, 0, 0, TAU); g.fill(); } }
function brushStrokes(g, R, n, cols, a){
  g.globalAlpha = a;
  for(let i = 0; i < n; i++){ g.strokeStyle = cols[(R() * cols.length) | 0]; g.lineWidth = 2 + R() * 5; g.lineCap = 'round'; const x = R() * PW, y = R() * PW, l = 10 + R() * 30, an = R() * TAU; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(an + .5) * l * .6, y + Math.sin(an + .5) * l * .6, x + Math.cos(an) * l, y + Math.sin(an) * l); g.stroke(); }
  g.globalAlpha = 1;
}

const PAINT = {
  meadow(g, R){
    g.fillStyle = lgrad(g, 0, 0, 0, PW * .6, ['#6ec2ff', '#a9dcff', '#fff1c4']); g.fillRect(0, 0, PW, PW);
    const sx = 120 + R() * 480; g.fillStyle = rgrad(g, sx, 120, 10, 170, ['rgba(255,250,200,1)', 'rgba(255,230,120,.5)', 'rgba(255,230,120,0)']); g.fillRect(0, 0, PW, 400); circ(g, sx, 120, 46, '#fff4b0');
    for(let i = 0; i < 4; i++) cloud(g, R() * PW, 60 + R() * 160, .7 + R() * .8, 'rgba(255,255,255,.85)');
    hills(g, R, 330, 60, '#8fc4a8', 1); hills(g, R, 400, 50, '#6fb35a', 1); hills(g, R, 470, 40, '#58a043', 1);
    g.fillStyle = lgrad(g, 0, 470, 0, PW, ['#58a043', '#3f8a35']); g.fillRect(0, 500, PW, PW);
    // winding path
    g.strokeStyle = '#e8d49a'; g.lineWidth = 30; g.lineCap = 'round'; g.beginPath(); g.moveTo(PW * .5, PW); g.bezierCurveTo(PW * .2, PW * .85, PW * .8, PW * .72, PW * .55, PW * .6); g.stroke();
    // tree
    const tx = R() < .5 ? 110 + R() * 90 : 540 + R() * 90;
    g.fillStyle = '#7a4a2a'; g.fillRect(tx - 12, 380, 24, 130);
    [[0, 360, 70], [-50, 400, 50], [50, 400, 52], [0, 320, 50]].forEach(([dx, y, r]) => circ(g, tx + dx, y, r, '#3f8a35')); circ(g, tx - 20, 330, 30, '#5aa848');
    // fence
    g.fillStyle = '#f2e6cc'; for(let x = 20; x < PW; x += 46){ g.fillRect(x, 520 + Math.sin(x) * 4, 8, 44); } g.fillRect(0, 532, PW, 6); g.fillRect(0, 550, PW, 6);
    // flowers
    for(let i = 0; i < 260; i++){ const x = R() * PW, y = 560 + R() * 160; circ(g, x, y, 2 + R() * 3, ['#ff6fa8', '#ffd23a', '#ffffff', '#b98cff', '#ff8a3a'][(R() * 5) | 0]); }
    brushStrokes(g, R, 400, ['#4e9a3a', '#6fb35a', '#8fd06a'], .35);
  },
  sea(g, R){
    g.fillStyle = lgrad(g, 0, 0, 0, PW, ['#3fc7d8', '#1f7ea8', '#0e3a66']); g.fillRect(0, 0, PW, PW);
    g.globalAlpha = .18; for(let i = 0; i < 7; i++){ g.fillStyle = '#eaffff'; const x = R() * PW; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 40, 0); g.lineTo(x + 160 + R() * 80, PW * .8); g.lineTo(x + 60, PW * .8); g.fill(); } g.globalAlpha = 1;
    hills(g, R, 600, 30, '#e6cf96', 1); g.fillStyle = '#d8bd80'; g.fillRect(0, 640, PW, 80);
    for(let i = 0; i < 9; i++){ // coral
      const x = R() * PW, y = 610 + R() * 60, col = ['#ff6f8f', '#ff9a5a', '#c86aff', '#ffd23a'][(R() * 4) | 0];
      g.strokeStyle = col; g.lineCap = 'round';
      const br = (x, y, a, l, w, n) => { if(n <= 0) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); br(x2, y2, a - .45, l * .75, w * .75, n - 1); br(x2, y2, a + .4, l * .7, w * .75, n - 1); };
      br(x, y, -Math.PI / 2, 40 + R() * 30, 12, 4);
    }
    for(let i = 0; i < 12; i++){ const x = R() * PW; g.strokeStyle = R() < .5 ? '#2f9a5a' : '#4fbf6a'; g.lineWidth = 7; g.beginPath(); g.moveTo(x, 700); for(let y = 700; y > 440 + R() * 100; y -= 20) g.lineTo(x + Math.sin(y / 25 + i) * 14, y); g.stroke(); }
    for(let i = 0; i < 6; i++){ const x = R() * PW; g.fillStyle = '#6a7a8a'; g.beginPath(); g.ellipse(x, 690, 40 + R() * 40, 26 + R() * 14, 0, Math.PI, 0); g.fill(); }
    for(let i = 0; i < 60; i++){ g.strokeStyle = 'rgba(220,255,255,.6)'; g.lineWidth = 1.5; g.beginPath(); g.arc(R() * PW, R() * PW * .8, 2 + R() * 6, 0, TAU); g.stroke(); }
    brushStrokes(g, R, 300, ['#2a8ab8', '#3fa8c8', '#1a5a88'], .3);
  },
  jungle(g, R){
    g.fillStyle = lgrad(g, 0, 0, 0, PW, ['#bfe8a0', '#5aa04a', '#1f4a2a']); g.fillRect(0, 0, PW, PW);
    // temple
    const cx = 200 + R() * 320; g.fillStyle = '#8a8a78';
    for(let i = 0; i < 6; i++){ const w = 360 - i * 50, y = 560 - i * 50; g.fillStyle = i % 2 ? '#9a9a86' : '#86866f'; g.fillRect(cx - w / 2, y, w, 50); }
    g.fillStyle = '#2a2a22'; g.fillRect(cx - 22, 280, 44, 60);
    g.fillStyle = '#6a6a58'; for(let i = 0; i < 6; i++) g.fillRect(cx - 12, 560 - i * 50 + 10, 24, 40);
    // waterfall
    const wx = cx > 360 ? 70 : 600; g.fillStyle = lgrad(g, wx, 0, wx + 50, 0, ['#bfefff', '#ffffff', '#9fdfff']); g.fillRect(wx, 120, 50, 520); g.fillStyle = 'rgba(255,255,255,.7)'; for(let i = 0; i < 16; i++) circ(g, wx + 25 + (R() - .5) * 80, 640 + R() * 20, 10 + R() * 14, 'rgba(255,255,255,.6)');
    // big leaves
    for(let i = 0; i < 26; i++){ const x = R() * PW, y = R() < .5 ? R() * 160 : 560 + R() * 160, a = R() * TAU; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = ['#2f7a3a', '#3f9a44', '#1f5a2a'][(R() * 3) | 0]; g.beginPath(); g.ellipse(0, 0, 70 + R() * 40, 22 + R() * 10, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(200,255,180,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-70, 0); g.lineTo(70, 0); g.stroke(); g.restore(); }
    // vines
    for(let i = 0; i < 10; i++){ const x = R() * PW; g.strokeStyle = '#2a6a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, 0); for(let y = 0; y < 200 + R() * 300; y += 18) g.lineTo(x + Math.sin(y / 30 + i) * 12, y); g.stroke(); }
    brushStrokes(g, R, 350, ['#3f9a44', '#6fbf5a', '#2a6a2a'], .3);
  },
  desert(g, R){
    g.fillStyle = lgrad(g, 0, 0, 0, PW * .55, ['#ff9a7a', '#ffc98a', '#ffe8b0']); g.fillRect(0, 0, PW, PW);
    circ(g, 140 + R() * 440, 140, 60, 'rgba(255,255,230,.9)');
    // pyramids
    for(let i = 0; i < 3; i++){ const x = 120 + i * 220 + R() * 60, s = 120 + R() * 80, y = 440; g.fillStyle = '#d9a25a'; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x, y - s * 1.1); g.lineTo(x + s, y); g.fill(); g.fillStyle = '#b8823a'; g.beginPath(); g.moveTo(x, y - s * 1.1); g.lineTo(x + s, y); g.lineTo(x + s * .15, y); g.fill(); }
    hills(g, R, 470, 30, '#f0c078', 1); hills(g, R, 540, 40, '#e8b060', 1); hills(g, R, 620, 30, '#d89a4a', 1);
    // glass crystals
    for(let i = 0; i < 14; i++){ const x = R() * PW, y = 560 + R() * 150, h = 30 + R() * 60, col = ['#9fe8ff', '#c8a8ff', '#a8ffd8'][(R() * 3) | 0]; g.fillStyle = col; g.globalAlpha = .85; g.beginPath(); g.moveTo(x - 12, y); g.lineTo(x - 4, y - h); g.lineTo(x + 8, y - h * .8); g.lineTo(x + 14, y); g.fill(); g.fillStyle = '#ffffff'; g.globalAlpha = .6; g.fillRect(x - 4, y - h * .9, 4, h * .6); g.globalAlpha = 1; }
    // cacti
    for(let i = 0; i < 5; i++){ const x = R() * PW, y = 600 + R() * 100; g.fillStyle = '#4a8a4a'; g.fillRect(x - 8, y - 60, 16, 60); g.fillRect(x - 26, y - 44, 10, 26); g.fillRect(x + 16, y - 50, 10, 30); }
    brushStrokes(g, R, 350, ['#e8b060', '#f0c890', '#c88a4a'], .3);
  },
  city(g, R){
    g.fillStyle = lgrad(g, 0, 0, 0, PW, ['#3a2a6a', '#8a4a8a', '#ff9a6a']); g.fillRect(0, 0, PW, PW);
    // giant clock
    const cx = 160 + R() * 400, cy = 170; circ(g, cx, cy, 110, '#e8d8a8'); circ(g, cx, cy, 96, '#fff6dc');
    g.strokeStyle = '#4a3a2a'; g.lineWidth = 4; for(let i = 0; i < 12; i++){ const a = i / 12 * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * 80, cy + Math.sin(a) * 80); g.lineTo(cx + Math.cos(a) * 92, cy + Math.sin(a) * 92); g.stroke(); }
    g.lineWidth = 7; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 40, cy - 40); g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - 10, cy + 70); g.stroke();
    // buildings
    for(let layer = 0; layer < 3; layer++){
      let x = -20; const col = ['#5a3a6a', '#3a2a4a', '#221830'][layer], base = 420 + layer * 110;
      while(x < PW){ const w = 50 + R() * 80, h = 120 + R() * 180 - layer * 20; g.fillStyle = col; g.fillRect(x, base - h, w, PW); if(R() < .4){ g.beginPath(); g.moveTo(x, base - h); g.lineTo(x + w / 2, base - h - 40); g.lineTo(x + w, base - h); g.fill(); }
        g.fillStyle = 'rgba(255,210,120,.85)'; for(let wy = base - h + 14; wy < PW; wy += 26) for(let wx = x + 8; wx < x + w - 10; wx += 18) if(R() < .45) g.fillRect(wx, wy, 8, 12);
        g.fillStyle = col; x += w + 4; }
    }
    // gears
    const gear = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); for(let i = 0; i < 24; i++){ const a = i / 24 * TAU, rr = i % 2 ? r : r * 1.18; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); circ(g, x, y, r * .35, '#3a2a4a'); };
    for(let i = 0; i < 5; i++) gear(R() * PW, 560 + R() * 160, 20 + R() * 30, ['#c8a04a', '#a8783a', '#e8c86a'][(R() * 3) | 0]);
    brushStrokes(g, R, 250, ['#8a4a8a', '#5a3a6a', '#ff9a6a'], .25);
  },
  aurora(g, R){
    g.fillStyle = lgrad(g, 0, 0, 0, PW, ['#0a1030', '#1a2a5a', '#3a5a8a']); g.fillRect(0, 0, PW, PW);
    for(let i = 0; i < 160; i++) circ(g, R() * PW, R() * PW * .6, R() * 1.8, 'rgba(255,255,255,.9)');
    for(let k = 0; k < 3; k++){ const y0 = 120 + k * 50 + R() * 40; g.lineWidth = 40 + R() * 30; g.strokeStyle = [rgba('#5affb0', .35), rgba('#8a6aff', .3), rgba('#5ad8ff', .3)][k]; g.beginPath(); for(let x = -20; x <= PW + 20; x += 20) g.lineTo(x, y0 + Math.sin(x / 90 + k * 2) * 40); g.stroke(); }
    // mountains
    for(let layer = 0; layer < 2; layer++){ g.fillStyle = layer ? '#c8d8e8' : '#8aa0c0'; g.beginPath(); g.moveTo(0, PW); let x = 0; while(x < PW + 100){ const w = 120 + R() * 140, h = 180 + R() * 160 - layer * 60; g.lineTo(x + w / 2, 520 - h + layer * 60); g.lineTo(x + w, 520 + layer * 40); x += w * .8; } g.lineTo(PW, PW); g.fill(); }
    g.fillStyle = '#eef6ff'; g.fillRect(0, 580, PW, 140);
    g.fillStyle = 'rgba(160,210,255,.5)'; g.beginPath(); g.ellipse(PW / 2, 650, 260, 40, 0, 0, TAU); g.fill();
    for(let i = 0; i < 16; i++){ const x = R() * PW, y = 590 + R() * 120, h = 50 + R() * 50; g.fillStyle = '#1f4a3a'; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x - h * .35, y); g.lineTo(x + h * .35, y); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x, y - h); g.lineTo(x - h * .15, y - h * .6); g.lineTo(x + h * .15, y - h * .6); g.fill(); }
    brushStrokes(g, R, 200, ['#c8d8e8', '#8aa0c0', '#ffffff'], .2);
  },
  cosmos(g, R){
    g.fillStyle = '#0a0618'; g.fillRect(0, 0, PW, PW);
    for(let i = 0; i < 8; i++){ const x = R() * PW, y = R() * PW, r = 100 + R() * 180; g.fillStyle = rgrad(g, x, y, 0, r, [rgba(['#ff5ad9', '#5a8aff', '#8a4aff', '#ff8a5a'][(R() * 4) | 0], .35), 'rgba(0,0,0,0)']); g.fillRect(x - r, y - r, r * 2, r * 2); }
    for(let i = 0; i < 400; i++) circ(g, R() * PW, R() * PW, R() * 1.6, `rgba(255,255,255,${.4 + R() * .6})`);
    // spiral galaxy
    const gx = 150 + R() * 420, gy = 150 + R() * 420;
    for(let i = 0; i < 700; i++){ const t = R() * 4 * Math.PI, arm = (R() < .5 ? 0 : Math.PI), rr = t * 14 + R() * 12; circ(g, gx + Math.cos(t + arm) * rr, gy + Math.sin(t + arm) * rr * .6, R() * 2, `rgba(255,240,220,${R() * .8})`); }
    circ(g, gx, gy, 16, 'rgba(255,240,200,.9)');
    // planets
    for(let i = 0; i < 4; i++){ const x = R() * PW, y = R() * PW, r = 20 + R() * 60, col = ['#ff9a5a', '#5ad8ff', '#c86aff', '#8aff9a', '#ffd23a'][(R() * 5) | 0];
      g.fillStyle = rgrad(g, x - r * .3, y - r * .3, r * .1, r, [mixHex(col, '#ffffff', .4), col, mixHex(col, '#000000', .5)]); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      if(R() < .5){ g.strokeStyle = rgba('#ffe8c0', .7); g.lineWidth = 4; g.beginPath(); g.ellipse(x, y, r * 1.7, r * .45, -.3, 0, TAU); g.stroke(); } }
  },
  core(g, R){
    g.fillStyle = rgrad(g, PW / 2, PW / 2, 0, PW * .75, ['#fff6c0', '#ffc84a', '#c8781a', '#5a2a0a']); g.fillRect(0, 0, PW, PW);
    g.save(); g.translate(PW / 2, PW / 2);
    for(let ring = 1; ring < 9; ring++){ const n = ring * 6, r = ring * 42; for(let i = 0; i < n; i++){ const a = i / n * TAU + ring * .2; g.fillStyle = ring % 2 ? rgba('#fff6d0', .5) : rgba('#8a3a0a', .4); g.beginPath(); g.ellipse(Math.cos(a) * r, Math.sin(a) * r, 16, 7, a, 0, TAU); g.fill(); } g.strokeStyle = rgba('#fff0b0', .5); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r + 20, 0, TAU); g.stroke(); }
    for(let i = 0; i < 24; i++){ g.rotate(TAU / 24); g.fillStyle = rgba('#ffffff', .12); g.beginPath(); g.moveTo(0, 0); g.lineTo(-18, -PW); g.lineTo(18, -PW); g.fill(); }
    g.restore();
    circ(g, PW / 2, PW / 2, 40, '#ffffff');
  },
};

/* the tiny painting-within-a-painting, and the vault walls */
PAINT.vault = (g, R) => {
  g.fillStyle = lgrad(g, 0, 0, 0, PW, ['#3a2a1a', '#6a4a22', '#2a1a0a']); g.fillRect(0, 0, PW, PW);
  for(let y = 0; y < PW; y += 60) for(let x = (y / 60 % 2) * 40; x < PW; x += 80){ g.fillStyle = R() < .5 ? '#7a5a2a' : '#6a4a1a'; g.fillRect(x + 2, y + 2, 76, 56); }
  g.fillStyle = rgrad(g, PW / 2, PW / 2, 20, 360, ['rgba(255,220,120,.5)', 'rgba(255,200,80,0)']); g.fillRect(0, 0, PW, PW);
};

/* smooth value noise for the grime layers */
function noise2(R, cells){
  const n = cells + 1, v = new Float32Array(n * n); for(let i = 0; i < v.length; i++) v[i] = R();
  return (x, y) => { const X = Math.floor(x), Y = Math.floor(y), fx = x - X, fy = y - Y, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = v[Y * n + X], b = v[Y * n + X + 1], c = v[(Y + 1) * n + X], d = v[(Y + 1) * n + X + 1];
    return lerp(lerp(a, b, sx), lerp(c, d, sx), sy); };
}
/* three grime textures: dust, grime, stone */
const COVER_TEX = {};
function coverTextures(B){
  if(COVER_TEX[B.id]) return COVER_TEX[B.id];
  const out = B.cover.map((col, li) => {
    const c = mkCanvas(PW), g = c.getContext('2d'), R = mulberry32(hashStr(B.id + li));
    g.fillStyle = col; g.fillRect(0, 0, PW, PW);
    for(let i = 0; i < 2200; i++){ g.fillStyle = rgba(R() < .5 ? '#ffffff' : '#000000', .04 + R() * .08); const s = 2 + R() * (li ? 9 : 5); g.fillRect(R() * PW, R() * PW, s, s); }
    if(li === 1) for(let i = 0; i < 160; i++){ g.strokeStyle = rgba('#000000', .12); g.lineWidth = 1 + R() * 2; const x = R() * PW, y = R() * PW; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 60, y + (R() - .5) * 60); g.stroke(); }
    if(li === 2) for(let i = 0; i < 90; i++){ g.strokeStyle = rgba('#000000', .25); g.lineWidth = 1.5; let x = R() * PW, y = R() * PW; g.beginPath(); g.moveTo(x, y); for(let k = 0; k < 5; k++){ x += (R() - .5) * 40; y += (R() - .5) * 40; g.lineTo(x, y); } g.stroke(); g.fillStyle = rgba('#ffffff', .08); g.fillRect(R() * PW, R() * PW, 20 + R() * 30, 3); }
    return c;
  });
  COVER_TEX[B.id] = out;
  return out;
}
