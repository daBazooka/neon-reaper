'use strict';
/* =====================================================================
   Verlet ragdolls. While alive, springs pull every joint toward a
   standing pose (so hits make the body wobble and recover); when the
   archer is knocked out the springs let go and the body flops.
   Points: 0 head, 1 chest, 2 hip, 3 knee L, 4 foot L, 5 knee R, 6 foot R,
           7 bow elbow, 8 bow hand, 9 draw elbow, 10 draw hand
   ===================================================================== */
const REST = [[0, -100], [0, -80], [0, -48], [-6, -24], [-11, 0], [6, -24], [11, 0], [14, -76], [30, -76], [8, -70], [18, -74]];
const STICKS = [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [1, 7], [7, 8], [1, 9], [9, 10]];
/* hit shapes: [a, b, radius, part]  (a === b means a circle) */
const SHAPES = [[0, 0, 13, 'head'], [1, 2, 10, 'body'], [2, 3, 5.5, 'leg'], [3, 4, 5.5, 'leg'], [2, 5, 5.5, 'leg'], [5, 6, 5.5, 'leg'], [1, 7, 5, 'arm'], [7, 8, 5, 'arm']];

function makeBody(x, y, face, sc){
  const pts = REST.map(([rx, ry]) => { const px = x + rx * face * sc, py = y + ry * sc; return { x:px, y:py, ox:px, oy:py }; });
  const len = STICKS.map(([a, b]) => Math.hypot(REST[a][0] - REST[b][0], REST[a][1] - REST[b][1]) * sc);
  return { pts, len, sc, face };
}

/* one physics substep. f: fighter (alive pose control), plats: rects the body can lie on */
function stepBody(f, dt, plats){
  const B = f.body, P = B.pts, sc = B.sc, g = GRAV * dt * dt;
  const damp = f.alive ? .965 : .985;
  for(const p of P){ const vx = (p.x - p.ox) * damp, vy = (p.y - p.oy) * damp; p.ox = p.x; p.oy = p.y; p.x += vx; p.y += vy + g; }
  if(f.alive && !f.falling){
    const ax = f.ax, ay = f.top, fc = B.face, k = (i, tx, ty, s) => { const p = P[i]; p.x += (tx - p.x) * s; p.y += (ty - p.y) * s; };
    // feet planted
    P[4].x = P[4].ox = ax - 11 * sc; P[4].y = P[4].oy = ay;
    P[6].x = P[6].ox = ax + 11 * sc; P[6].y = P[6].oy = ay;
    const lean = f.lean || 0;
    k(2, ax + lean * .3, ay - 48 * sc, .22);
    k(3, ax - 6 * sc, ay - 24 * sc, .2); k(5, ax + 6 * sc, ay - 24 * sc, .2);
    k(1, ax + lean, ay - 80 * sc, .16);
    const c = P[1];
    k(0, c.x + lean * .4, c.y - 20 * sc, .25);
    // arms follow the aim
    const a = f.aim, dx = Math.cos(a), dy = Math.sin(a), nx = -dy * fc, ny = dx * fc, sx = c.x, sy = c.y + 4 * sc;
    k(7, sx + dx * 17 * sc + nx * 3 * sc, sy + dy * 17 * sc + ny * 3 * sc, .35);
    k(8, sx + dx * 34 * sc, sy + dy * 34 * sc, .45);
    const pull = 34 - 26 * (f.draw || 0);
    k(10, sx + dx * pull * sc, sy + dy * pull * sc, .45);
    k(9, sx + dx * pull * .5 * sc - nx * 9 * sc, sy + dy * pull * .5 * sc - ny * 9 * sc, .35);
  }
  for(let it = 0; it < 6; it++){
    for(let s = 0; s < STICKS.length; s++){
      const [ia, ib] = STICKS[s], a = P[ia], b = P[ib], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .001, df = (d - B.len[s]) / d * .5;
      a.x += dx * df; a.y += dy * df; b.x -= dx * df; b.y -= dy * df;
    }
    if(!f.alive || f.falling) for(const p of P) for(const r of plats){
      if(p.x > r.x0 && p.x < r.x1 && p.y > r.y0 && p.y < r.y0 + 40){ p.y = r.y0; p.ox = lerp(p.ox, p.x, .3); }
    }
  }
}

/* shove a body point: a velocity kick in verlet terms */
function kick(B, i, vx, vy, dt){ const p = B.pts[i]; p.ox -= vx * dt; p.oy -= vy * dt; }

/* nearest hit shape of fighter f to point (x, y) within its radius; returns {s, t, d} */
function hitTest(f, x, y){
  const P = f.body.pts, sc = f.body.sc;
  let best = null;
  for(let s = 0; s < SHAPES.length; s++){
    const [ia, ib, r] = SHAPES[s], a = P[ia], b = P[ib];
    let t = 0, px = a.x, py = a.y;
    if(ia !== ib){ const vx = b.x - a.x, vy = b.y - a.y, l2 = vx * vx + vy * vy || 1; t = clamp(((x - a.x) * vx + (y - a.y) * vy) / l2, 0, 1); px = a.x + vx * t; py = a.y + vy * t; }
    const d = Math.hypot(x - px, y - py);
    if(d < r * sc && (!best || d / (r * sc) < best.q)) best = { s, t, d, q:d / (r * sc), part:SHAPES[s][3] };
  }
  return best;
}
