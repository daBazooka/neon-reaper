'use strict';
/* =====================================================================
   All audio is synthesized with Web Audio: no files, no licensing.
   - A live engine: two oscillators through a filter, revving through
     five gears, screaming on nitro. Tire screech, sirens and rotor
     wash are continuous voices mixed by distance.
   - Music: dusty desert rock in E minor (Em - C - D - Em) with a
     twangy spring-reverb lead; the boss theme turns heavier.
   Master chain: compressor -> tanh soft limiter (never clips).
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, revIn:null, noiseBuf:null,
  portalMute:false, adMuted:false, hidden:false,
  intensity:0, boss:false, step:0, nextT:0, timer:null, last:{}, loops:null,

  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 8; comp.attack.value = .003; comp.release.value = .2;
    const pre = c.createGain(); pre.gain.value = 1.05;
    const lim = c.createWaveShaper(), curve = new Float32Array(2048);
    for(let i = 0; i < curve.length; i++){ const x = i / (curve.length - 1) * 2 - 1; curve[i] = Math.tanh(x * 1.8) * .97; }
    lim.curve = curve;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(pre); pre.connect(lim); lim.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.connect(this.master);
    try{
      // a short, bright "spring" reverb for the twang
      const len = Math.round(c.sampleRate * 1.6), ir = c.createBuffer(2, len, c.sampleRate);
      for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < len; i++){ const t = i / c.sampleRate; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.5) * (1 + .5 * Math.sin(t * 900)); } }
      const conv = c.createConvolver(); conv.buffer = ir;
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300;
      this.revIn = c.createGain(); this.revIn.gain.value = .45;
      this.revIn.connect(hp); hp.connect(conv); conv.connect(this.master);
    }catch(e){ this.revIn = null; }
    const nl = c.sampleRate * 2; this.noiseBuf = c.createBuffer(1, nl, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for(let i = 0; i < nl; i++) d[i] = Math.random() * 2 - 1;
    this.apply(); this.startMusic(); this.makeLoops();
  },
  resume(){ try{ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }catch(e){} },
  apply(){
    if(!this.ctx) return;
    const on = !this.portalMute && !this.adMuted && !this.hidden, t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(on ? 1 : 0, t, .03);
    this.sfx.gain.setTargetAtTime(save.opt.sfx ? .62 : 0, t, .02);
    this.mus.gain.setTargetAtTime(save.opt.music ? .4 : 0, t, .05);
  },
  setPortalMute(m){ this.portalMute = m; this.apply(); },
  adMute(m){ this.adMuted = m; this.apply(); },
  setHidden(h){ this.hidden = h; this.apply(); },
  q(){ return !this.ctx || G.state === 'menuplay'; },
  thr(k, s){ const t = this.ctx.currentTime; if(t - (this.last[k] || -9) < s) return true; this.last[k] = t; return false; },

  /* ---------- primitives: o = { at, delay, f2, attack, rev, bus, cut, cut2, q, det } ---------- */
  tone(f, d, type, v, o){
    const c = this.ctx; if(!c) return;
    o = o || {};
    const t = o.at !== undefined ? o.at : c.currentTime + (o.delay || 0), a = o.attack || .004;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if(o.det) osc.detune.setValueAtTime(o.det, t);
    if(o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, v), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(d, a + .01));
    let src = osc;
    if(o.cut){ const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = o.q || 1; fl.frequency.setValueAtTime(o.cut, t); if(o.cut2) fl.frequency.exponentialRampToValueAtTime(o.cut2, t + d); osc.connect(fl); src = fl; }
    src.connect(g); g.connect(o.bus || this.sfx);
    if(o.rev && this.revIn){ const s = c.createGain(); s.gain.value = o.rev; g.connect(s); s.connect(this.revIn); }
    osc.start(t); osc.stop(t + Math.max(d, a) + .05);
  },
  noise(d, freq, v, o){
    const c = this.ctx; if(!c) return;
    o = o || {};
    const t = o.at !== undefined ? o.at : c.currentTime + (o.delay || 0), s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = o.q || 1;
    if(o.f2) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.f2), t + d);
    const g = c.createGain(), a = o.attack || .003; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(d, a + .01));
    s.connect(f); f.connect(g); g.connect(o.bus || this.sfx);
    if(o.rev && this.revIn){ const r = c.createGain(); r.gain.value = o.rev; g.connect(r); r.connect(this.revIn); }
    s.start(t, Math.random() * 1.5); s.stop(t + Math.max(d, a) + .05);
  },
  mf(m){ return 440 * Math.pow(2, (m - 69) / 12); },

  /* ---------- continuous voices: engine, screech, siren, rotor ---------- */
  makeLoops(){
    const c = this.ctx, L = this.loops = {};
    const noiseSrc = () => { const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; s.start(); return s; };
    // engine
    L.o1 = c.createOscillator(); L.o1.type = 'sawtooth'; L.o2 = c.createOscillator(); L.o2.type = 'square';
    L.ef = c.createBiquadFilter(); L.ef.type = 'lowpass'; L.ef.frequency.value = 600; L.ef.Q.value = 3;
    L.eg = c.createGain(); L.eg.gain.value = 0;
    const g2 = c.createGain(); g2.gain.value = .6;
    L.o1.connect(L.ef); L.o2.connect(g2); g2.connect(L.ef); L.ef.connect(L.eg); L.eg.connect(this.sfx);
    L.o1.start(); L.o2.start();
    // tire screech
    const sn = noiseSrc(); L.sf = c.createBiquadFilter(); L.sf.type = 'bandpass'; L.sf.frequency.value = 1900; L.sf.Q.value = 4;
    L.sg = c.createGain(); L.sg.gain.value = 0; sn.connect(L.sf); L.sf.connect(L.sg); L.sg.connect(this.sfx);
    // siren
    L.so = c.createOscillator(); L.so.type = 'triangle'; L.sig = c.createGain(); L.sig.gain.value = 0; L.so.connect(L.sig); L.sig.connect(this.sfx); L.so.start();
    // rotor wash
    const rn = noiseSrc(); L.rf = c.createBiquadFilter(); L.rf.type = 'lowpass'; L.rf.frequency.value = 400;
    L.rg = c.createGain(); L.rg.gain.value = 0; const lfo = c.createOscillator(); lfo.frequency.value = 13; const lg = c.createGain(); lg.gain.value = 0;
    L.rlg = lg; lfo.connect(lg); lg.connect(L.rg.gain); rn.connect(L.rf); L.rf.connect(L.rg); L.rg.connect(this.sfx); lfo.start();
    // fire crackle bed
    const fn = noiseSrc(); L.ff = c.createBiquadFilter(); L.ff.type = 'highpass'; L.ff.frequency.value = 2500;
    L.fg = c.createGain(); L.fg.gain.value = 0; fn.connect(L.ff); L.ff.connect(L.fg); L.fg.connect(this.sfx);
  },
  // called every frame with speed ratio, nitro and slip
  engine(s, nitro, slip){ if(!this.loops || !this.ctx) return; this.applyEng(this.engParams(s, nitro, slip)); },
  engParams(s, nitro, slip){
    const menu = G.state === 'menuplay';
    const gear = Math.min(4, Math.floor(s * 5)), within = s * 5 - gear, rpm = .22 + Math.min(1, within) * .78 + (nitro ? .15 : 0);
    let cop = 1e9, heli = 1e9;
    for(const e of G.E){ const d = Math.hypot(e.x - P.x, e.y - P.y); if(e.type === 'cop' && d < cop) cop = d; if(e.type === 'heli' && d < heli) heli = d; }
    let fire = 0; for(let i = 0; i < G.F.length; i += 4){ const f2 = G.F[i]; if(Math.abs(f2.x - G.camX) < 700 && Math.abs(f2.y - G.camY) < 500) fire++; }
    const hv = menu ? 0 : clamp(1 - heli / 1000, 0, 1) * .12;
    return {
      f:34 + rpm * 70 + gear * 5, cut:300 + rpm * 1400 + (nitro ? 900 : 0), eg:menu ? .015 : .07 + (nitro ? .03 : 0),
      sg:menu ? 0 : clamp((slip - .12) * .35, 0, .09), sf:1500 + slip * 1600,
      sv:menu ? 0 : clamp(1 - cop / 900, 0, 1) * .035, so:((G.rt * 1.6) | 0) % 2 ? 960 : 720,
      hv:hv * .5, fg:menu ? 0 : clamp(fire / 60, 0, 1) * .05 * (.6 + .4 * Math.random()),
    };
  },
  applyEng(p){
    const L = this.loops; if(!L || !this.ctx) return;
    const t = this.ctx.currentTime;
    L.o1.frequency.setTargetAtTime(p.f, t, .04); L.o2.frequency.setTargetAtTime(p.f * .5, t, .04);
    L.ef.frequency.setTargetAtTime(p.cut, t, .05); L.eg.gain.setTargetAtTime(p.eg, t, .08);
    L.sg.gain.setTargetAtTime(p.sg, t, .05); L.sf.frequency.setTargetAtTime(p.sf, t, .05);
    L.sig.gain.setTargetAtTime(p.sv, t, .1); L.so.frequency.setTargetAtTime(p.so, t, .05);
    L.rg.gain.setTargetAtTime(p.hv, t, .1); L.rlg.gain.setTargetAtTime(p.hv, t, .1);
    L.fg.gain.setTargetAtTime(p.fg, t, .03);
  },
  engineOff(){ const L = this.loops; if(!L || !this.ctx) return; const t = this.ctx.currentTime; for(const g of [L.eg, L.sg, L.sig, L.rg, L.fg]) g.gain.setTargetAtTime(0, t, .2); },
  drift(){},

  /* ---------- SFX ---------- */
  crash(k){ if(this.q() || this.thr('crash', .08)) return; k = clamp(k, .2, 1.5); this.noise(.25, 700, .35 * k, { type:'lowpass', f2:120 }); this.tone(120, .2, 'square', .08 * k, { f2:50, cut:800 }); this.noise(.12, 3500, .12 * k, { q:.8 }); },
  crunch(){ if(this.q() || this.thr('crunch', .05)) return; this.noise(.12, 1800, .12, { q:1.2 }); },
  boom(size){ if(this.q() || this.thr('boom', .05)) return; this.tone(80, .9 * size, 'sine', .6, { f2:28 }); this.noise(1.1 * size, 1200, .5, { type:'lowpass', f2:70, rev:.3 }); this.noise(.15, 4000, .2, { type:'highpass' }); },
  ignite(){ if(this.q() || this.thr('ign', .05)) return; this.noise(.35, 600, .18, { f2:3000, q:.7 }); },
  whoosh(){ if(this.q()) return; this.noise(.3, 500, .22, { f2:2200, q:.9 }); this.tone(this.mf(76), .12, 'triangle', .05, { delay:.05 }); },
  cash(){ if(this.q() || this.thr('cash', .04)) return; this.tone(this.mf(88), .08, 'square', .04, { cut:5000 }); this.tone(this.mf(95), .14, 'square', .04, { delay:.05, cut:5000 }); },
  repair(){ if(this.q()) return; [0, 4, 7, 12].forEach((s, i) => this.tone(this.mf(64 + s), .2, 'triangle', .08, { delay:i * .05 })); this.noise(.1, 3000, .1, { delay:.02 }); },
  pickup(){ if(this.q()) return; this.tone(300, .3, 'sawtooth', .07, { f2:1200, cut:3000 }); },
  bombDrop(){ if(this.q()) return; this.tone(1800, 1.1, 'sine', .05, { f2:300 }); },
  heliIn(){ if(this.q()) return; this.noise(1.5, 300, .15, { type:'lowpass', attack:.6 }); },
  siren1(){ if(this.q()) return; for(let i = 0; i < 4; i++) this.tone(i % 2 ? 960 : 720, .25, 'triangle', .08, { delay:i * .25 }); },
  bossHorn(){ if(this.q()) return; this.tone(this.mf(40), 1.8, 'sawtooth', .15, { cut:600, attack:.05 }); this.tone(this.mf(47), 1.8, 'sawtooth', .12, { cut:700, delay:.02 }); this.tone(this.mf(40), .5, 'sawtooth', .15, { cut:600, delay:1.9 }); },
  wreck(){ if(this.q()) return; this.boom(1.8); this.noise(1.4, 3000, .2, { type:'bandpass', f2:400, rev:.4 }); },
  stinger(n){ if(this.q()) return; const b = 64 + Math.min(12, n); [0, 7, 12].forEach((s, i) => this.tone(this.mf(b + s), .5, 'sawtooth', .06, { delay:i * .04, cut:3500, cut2:800, rev:.5 })); this.tone(this.mf(40), .5, 'sawtooth', .1, { cut:500 }); },
  card(){ if(this.q()) return; [0, 7, 12].forEach((s, i) => this.tone(this.mf(64 + s), .25, 'triangle', .07, { delay:i * .06, rev:.3 })); },
  pick(){ if(this.q()) return; this.twang(this.mf(76), .12); this.twang(this.mf(83), .1, .08); },
  ui(){ if(!this.ctx) return; this.tone(660, .05, 'square', .035, { cut:2500 }); },
  // a plucked, twangy guitar string
  twang(f, v, delay, bus, at){
    const o = { cut:4200, cut2:700, q:6, rev:.5, bus };
    if(at !== undefined) o.at = at; else o.delay = delay || 0;
    this.tone(f, .7, 'sawtooth', v, o);
    this.tone(f * 1.003, .7, 'square', v * .35, Object.assign({}, o, { rev:0, det:8 }));
  },

  /* ---------- music: desert rock ---------- */
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .1; this.step = 0; this.timer = setInterval(() => this.sched(), 25); },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .05; return; }
    const bpm = this.intensity === 0 ? 96 : this.boss ? 142 : this.intensity >= 2 ? 132 : 124, sp = 60 / bpm / 4;
    while(this.nextT < c.currentTime + .15){ this.note(this.step, this.nextT, sp); this.nextT += sp; this.step = (this.step + 1) % 64; }
  },
  note(st, t, sp){
    const s16 = st % 16, bar = (st / 16) | 0, I = this.intensity, B = this.boss;
    // Em - C - D - Em   (boss: Em - F - Em - D)
    const roots = B ? [40, 41, 40, 38] : [40, 36, 38, 40], r = roots[bar];
    const o = x => Object.assign({ at:t, bus:this.mus }, x);
    const pent = [0, 3, 5, 7, 10, 12, 15];
    if(I === 0){
      // a lonely twang under the desert sun
      if(s16 % 4 === 0){ const n = [0, 7, 12, 7][(s16 / 4) | 0]; this.twang(this.mf(r + 12 + n), .045, 0, this.mus, t); }
      if(s16 === 0) this.tone(this.mf(r), sp * 14, 'triangle', .08, o({ attack:.02 }));
      if(s16 === 8) this.noise(.25, 1500, .04, o({ rev:.6 }));
      return;
    }
    // drums: kick on 1 and the "and" of 2, snare on 2 and 4, shaker 8ths
    if(s16 === 0 || s16 === 6 || s16 === 8 || (B && s16 === 11)) this.tone(130, .2, 'sine', .55, o({ f2:45 }));
    if(s16 === 4 || s16 === 12){ this.noise(.18, 1900, .22, o({ q:.7, rev:.3 })); this.tone(200, .09, 'triangle', .12, o({ f2:140 })); }
    if(s16 % 2 === 0) this.noise(.04, 7500, .05, o({ type:'highpass' }));
    if(I >= 2 && s16 % 2 === 1) this.noise(.03, 9000, .025, o({ type:'highpass' }));
    if(st % 64 === 0 && I >= 2) this.noise(1.2, 6000, .12, o({ type:'highpass', rev:.4 }));
    // galloping bass
    const bp = [0, 0, 12, 0, 7, 0, 10, 0], bn = r - 12 + bp[s16 % 8];
    if(s16 % 2 === 0 || I >= 2) this.tone(this.mf(bn), sp * .95, 'sawtooth', .08, o({ cut:700, cut2:200, q:3 }));
    // power chords on the boss / high heat
    if((B || I >= 2) && s16 % 8 === 0){ [0, 7, 12].forEach(s => this.tone(this.mf(r + 12 + s), sp * 7, 'sawtooth', .025, o({ cut:1600, det:s ? 5 : -5 }))); }
    // the riff: twangy E minor pentatonic call and response
    const riffA = [0, -1, 3, -1, 5, -1, 3, 0, -1, 0, 3, 5, 7, -1, 5, 3], riffB = [7, -1, 10, -1, 12, -1, 10, 7, -1, 5, 7, -1, 3, -1, 0, -1];
    const riff = bar % 2 ? riffB : riffA, n = riff[s16];
    if(n >= 0 && (bar < 3 || I >= 2)) this.twang(this.mf(52 + n + (r - 40 === -4 ? -4 : r - 40 === -2 ? -2 : 0) + 12), .05, 0, this.mus, t);
  },
  setMusic(i){ this.intensity = i; this.boss = i === 3; },
};
