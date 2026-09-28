'use strict';
/* =====================================================================
   BO KATA — rival flyers. They obey the same physics and thread rules
   as you: they climb above a rival, dive across the thread, keep their
   kite moving through the pench and chase every falling kite they see.
   skill 0..1 sets reaction time, aim and nerve.
   ===================================================================== */
function mkBrain(F, skill){
  return { skill, mode:'wander', t:0, think:0, cool:rnd(5, 12), tx:F.ax, ty:F.ay - 700, pull:true, target:null, burst:0, home:[F.ax + rnd(-70, 70), rnd(420, 1000)], ph:rnd(0, TAU), nerve:rnd(.5, 1) };
}
function botThink(F, dt){
  const B = F.bot, k = F.kite, s = B.skill;
  B.t += dt; B.think -= dt; B.cool -= dt;
  const floor = roofAt(k.x);
  // danger first: never scrape the rooftops
  if(k.y > floor - 170){ B.tx = k.x + (M.wind.x > 0 ? 80 : -80); B.ty = k.y - 600; B.pull = true; return B; }
  // in a pench: keep the kite moving fast across the rival's thread
  let pen = null;
  for(const p of M.pench.values()) if((p.a === F || p.b === F) && p.gone <= 0) pen = p;
  if(pen){
    const R = pen.a === F ? pen.b : pen.a, rk = R.kite;
    if(rk){
      // sweep sideways and upward, away from the crossing
      const sx = k.x - pen.x, sy = k.y - pen.y, l = Math.hypot(sx, sy) || 1;
      const side = Math.sign(k.x - rk.x) || 1;
      B.tx = k.x + side * 380 + sx / l * 120; B.ty = Math.min(k.y - 120, pen.y - 200);
      // weaker flyers sometimes panic and let go
      B.pull = M.tut ? false : Math.random() < .55 + s * .45 || B.t % 1 < .7;
      B.wasPench = true;
      return B;
    }
  }
  if(B.wasPench){ B.wasPench = false; B.cool = rnd(5, 10) * (1.3 - s * .5); B.mode = 'wander'; B.think = .5; }
  if(M.tut && M.tutStep < 2){ B.mode = 'wander'; B.think = 1; }
  else if(B.think <= 0){
    B.think = lerp(.7, .2, s) + rnd(0, .25);
    // loot within reach?
    let best = null, bd = 520 + s * 400;
    for(const q of M.loose){ if(q.landed || q.gone || q.t < .5) continue; const d = Math.hypot(q.x - k.x, q.y - k.y); if(d < bd){ bd = d; best = q; } }
    if(best){ B.mode = 'loot'; B.target = best; }
    else {
      // hunt the nearest rival whose thread we can reach, favouring ones below us
      let tgt = null, td = 700 + s * 500;
      for(const R of M.flyers){
        if(R === F || !R.kite || R.kite.launch > 0) continue;
        const d = Math.hypot(R.kite.x - k.x, R.kite.y - k.y) - (R.me ? 120 * s : 0) - (R.kite.y > k.y ? 150 : 0);
        if(d < td){ td = d; tgt = R; }
      }
      if(tgt && B.cool <= 0 && Math.random() < .12 + s * .3 * B.nerve){ B.mode = 'hunt'; B.target = tgt; B.dive = 0; }
      else { B.mode = 'wander'; B.target = null; }
    }
  }
  if(B.mode === 'loot' && B.target && !B.target.gone && !B.target.landed){
    const q = B.target; B.tx = q.x + q.vx * .3; B.ty = q.y + q.vy * .3; B.pull = true;
  } else if(B.mode === 'hunt' && B.target && B.target.kite){
    const R = B.target, rk = R.kite, pts = stringPts(R, 8, []);
    // cross their thread about two thirds of the way up, coming from above
    const i = 2 * Math.round(lerp(4, 7, (Math.sin(B.ph + B.t * .3) + 1) / 2)), px = pts[i], py = pts[i + 1];
    if(k.y > py - 160 && !B.dive){ B.tx = px + (k.x < px ? -140 : 140); B.ty = py - 360; }
    else { B.dive = 1; B.tx = px + (px - k.x) * .8; B.ty = py + 120; }
    if(B.dive && k.y > py + 60) B.dive = 0;
    const err = (1 - s) * 90; B.tx += Math.sin(B.t * 2.1) * err; B.ty += Math.cos(B.t * 1.7) * err;
    B.pull = true;
    if(rk.y < k.y - 250 && s < .6 && Math.random() < .01) B.mode = 'wander';
    if(B.t - (B.huntT0 || (B.huntT0 = B.t)) > 9){ B.mode = 'wander'; B.cool = rnd(3, 6); B.huntT0 = 0; }
  } else {
    B.huntT0 = 0;
    // wander: lazy figure-eights over home, letting the kite spin now and then
    const hx = B.home[0], hy = B.home[1], w = B.t * .55 + B.ph;
    B.tx = hx + Math.cos(w) * 190; B.ty = hy + Math.sin(w * 2) * 110;
    B.burst -= dt;
    if(B.burst <= 0){ B.pull = !B.pull || Math.random() < .6; B.burst = B.pull ? rnd(.8, 2.2) : rnd(.25, .7); }
  }
  B.tx = clamp(B.tx, 60, WW - 60); B.ty = clamp(B.ty, CEIL + 40, GROUND);
  return B;
}
