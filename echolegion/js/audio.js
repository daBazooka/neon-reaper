'use strict';
/* =====================================================================
   All audio is synthesized with Web Audio: no files, no licensing.
   Music: darksynth in A minor (i - VI - III - VII), pumping octave bass,
   gated reverb snares and a square-wave arp; the boss theme turns
   phrygian. Master chain: compressor -> tanh soft limiter (never clips).
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, revIn:null, noiseBuf:null,
  portalMute:false, adMuted:false, hidden:false,
  intensity:0, boss:false, step:0, nextT:0, timer:null,
  last:{},

  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 10; comp.attack.value = .002; comp.release.value = .2;
    const pre = c.createGain(); pre.gain.value = 1.05;
    const lim = c.createWaveShaper(), curve = new Float32Array(2048);
    for(let i = 0; i < curve.length; i++){ const x = i / (curve.length - 1) * 2 - 1; curve[i] = Math.tanh(x * 1.8) * .97; }
    lim.curve = curve;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(pre); pre.connect(lim); lim.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.connect(this.master);
    try{
      const len = Math.round(c.sampleRate * 1.8), ir = c.createBuffer(2, len, c.sampleRate);
      for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4) * (i < 150 ? i / 150 : 1); }
      const conv = c.createConvolver(); conv.buffer = ir;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6000;
      this.revIn = c.createGain(); this.revIn.gain.value = .5;
      this.revIn.connect(lp); lp.connect(conv); conv.connect(this.master);
    }catch(e){ this.revIn = null; }
    const nl = c.sampleRate; this.noiseBuf = c.createBuffer(1, nl, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for(let i = 0; i < nl; i++) d[i] = Math.random() * 2 - 1;
    this.apply(); this.startMusic();
  },
  resume(){ try{ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }catch(e){} },
  apply(){
    if(!this.ctx) return;
    const on = !this.portalMute && !this.adMuted && !this.hidden, t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(on ? 1 : 0, t, .03);
    this.sfx.gain.setTargetAtTime(save.opt.sfx ? .72 : 0, t, .02);
    this.mus.gain.setTargetAtTime(save.opt.music ? .42 : 0, t, .05);
  },
  setPortalMute(m){ this.portalMute = m; this.apply(); },
  adMute(m){ this.adMuted = m; this.apply(); },
  setHidden(h){ this.hidden = h; this.apply(); },
  q(){ return !this.ctx || G.state === 'menuplay'; },
  thr(k, s){ const t = this.ctx.currentTime; if(t - (this.last[k] || -9) < s) return true; this.last[k] = t; return false; },

  /* ---------- primitives: o = { at, delay, f2, attack, rev, bus, cut, det, q } ---------- */
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
    s.start(t, Math.random() * .5); s.stop(t + Math.max(d, a) + .05);
  },
  mf(m){ return 440 * Math.pow(2, (m - 69) / 12); },

  /* ---------- SFX ---------- */
  dash(){ if(this.q()) return; this.noise(.18, 800, .3, { f2:4200, q:.8 }); this.tone(140, .12, 'sawtooth', .07, { f2:420, cut:1800 }); },
  slash(){ if(this.q() || this.thr('slash', .04)) return; this.noise(.14, 5200, .16, { f2:1800, type:'bandpass', q:1.4 }); },
  hit(crit){
    if(this.q() || this.thr('hit', .025)) return;
    this.tone(170, .13, 'sine', .45, { f2:48 }); this.noise(.05, 2600, .3, { type:'bandpass', q:.8 });
    if(crit){ this.tone(1760, .25, 'square', .05, { cut:5000, rev:.3 }); this.tone(2637, .2, 'sine', .06, { delay:.02, rev:.3 }); }
  },
  kill(big){
    if(this.q()) return;
    if(!this.thr('kill', .03)){ this.noise(.28, 7000, .22, { type:'highpass', rev:.2 }); this.tone(900 + Math.random() * 500, .14, 'triangle', .06, { f2:300 }); }
    if(big){ this.tone(90, .6, 'sine', .55, { f2:30 }); this.noise(.5, 900, .3, { type:'lowpass', f2:80 }); }
  },
  sync(n){
    if(this.q()) return;
    const base = 57 + [0, 3, 7, 12][Math.min(3, n)];
    [0, 7, 12, 16].forEach((s, i) => this.tone(this.mf(base + 12 + s), .5, 'sawtooth', .045, { delay:i * .012, cut:4200, cut2:900, rev:.5 }));
    this.tone(this.mf(base - 12), .4, 'sine', .35, { f2:this.mf(base - 24) });
  },
  slam(echo){
    if(this.q()) return;
    if(echo){ if(this.thr('eslam', .08)) return; this.tone(90, .35, 'sine', .3, { f2:40 }); this.noise(.3, 600, .15, { type:'lowpass', f2:120 }); return; }
    this.tone(70, .8, 'sine', .7, { f2:28 }); this.noise(.7, 1400, .45, { type:'lowpass', f2:90, rev:.4 }); this.noise(.12, 5000, .2, { type:'highpass' });
  },
  echo(){
    if(this.q()) return;
    this.tone(1400, .32, 'sawtooth', .06, { f2:160, cut:3000 });
    this.noise(.6, 3000, .1, { type:'bandpass', attack:.45, rev:.6 });
    [0, 3, 7, 10].forEach((s, i) => this.tone(this.mf(69 + s), .9, 'triangle', .04, { delay:.3 + i * .05, rev:.7 }));
  },
  glass(){ if(this.q()) return; this.noise(.45, 6000, .3, { type:'highpass', rev:.4 }); for(let i = 0; i < 4; i++) this.tone(2000 + Math.random() * 2000, .2, 'sine', .05, { delay:i * .03 }); this.tone(300, .5, 'sawtooth', .08, { f2:60, cut:900 }); },
  parry(){ if(this.q() || this.thr('parry', .05)) return; this.tone(2093, .3, 'square', .05, { cut:6000, rev:.4 }); this.tone(3136, .25, 'sine', .05, { delay:.02 }); },
  clang(){ if(this.q() || this.thr('clang', .06)) return; this.tone(880, .25, 'square', .06, { f2:600, cut:3000 }); this.tone(1320, .3, 'triangle', .08); },
  zap(){ if(this.q() || this.thr('zap', .08)) return; for(let i = 0; i < 3; i++) this.noise(.05, 3000 + i * 1500, .18, { delay:i * .04, q:3 }); },
  bolt(){ if(this.q() || this.thr('bolt', .08)) return; this.tone(700, .15, 'square', .05, { f2:300, cut:2500 }); },
  charge(){ if(this.q() || this.thr('charge', .15)) return; this.tone(80, .45, 'sawtooth', .12, { f2:220, cut:900 }); this.noise(.4, 400, .12, { f2:1600 }); },
  land(){ if(this.q() || this.thr('land', .06)) return; this.tone(110, .3, 'sine', .35, { f2:40 }); },
  spawn(){ if(this.q() || this.thr('spawn', .12)) return; this.tone(220, .1, 'square', .025, { f2:880, cut:2000 }); },
  tick(){ if(this.q()) return; this.tone(1200, .06, 'square', .08, { cut:3000 }); this.tone(600, .1, 'sine', .15, { delay:.02 }); },
  sweep(){ if(this.q()) return; this.noise(.8, 300, .35, { f2:3000, q:.7, rev:.3 }); this.tone(60, .8, 'sawtooth', .1, { f2:120, cut:500 }); },
  bossHorn(){ if(this.q()) return; this.tone(this.mf(33), 2.4, 'sawtooth', .15, { cut:500, attack:.4, rev:.5 }); this.tone(this.mf(34), 2.4, 'sawtooth', .12, { cut:600, attack:.5, rev:.5, det:8 }); this.noise(2, 200, .15, { type:'lowpass', attack:.6, rev:.6 }); },
  bossDown(){ if(this.q()) return; this.tone(50, 1.6, 'sine', .7, { f2:25 }); this.noise(1.4, 2000, .4, { type:'lowpass', f2:60, rev:.6 }); [0, 3, 7, 12, 15, 19].forEach((s, i) => this.tone(this.mf(57 + s), 1.4, 'sawtooth', .05, { delay:.3 + i * .07, cut:3500, rev:.7 })); },
  hurt(){ if(this.q()) return; this.tone(220, .4, 'sawtooth', .22, { f2:50, cut:1500 }); this.noise(.3, 500, .35, { type:'lowpass', f2:80 }); },
  death(){ if(this.q()) return; this.tone(440, 1.4, 'sawtooth', .16, { f2:40, cut:2000, rev:.6 }); this.noise(1, 1500, .4, { type:'lowpass', f2:60, rev:.5 }); },
  heal(){ if(this.q()) return; [0, 4, 7, 12].forEach((s, i) => this.tone(this.mf(72 + s), .25, 'triangle', .07, { delay:i * .05, rev:.4 })); },
  shard(){ if(this.q() || this.thr('shard', .03)) return; this.tone(1568 + Math.random() * 400, .06, 'sine', .04); },
  clear(){ if(this.q()) return; [0, 3, 7, 12, 15, 19, 24].forEach((s, i) => this.tone(this.mf(57 + s), .5, 'square', .04, { delay:i * .06, cut:4000, rev:.5 })); this.tone(this.mf(33), 1, 'sawtooth', .12, { cut:800 }); },
  announce(n){ if(this.q()) return; const b = 57 + Math.min(12, n); [0, 7, 12].forEach((s, i) => this.tone(this.mf(b + s), .6, 'sawtooth', .06, { delay:i * .03, cut:5000, cut2:1200, rev:.5 })); this.tone(this.mf(b - 24), .5, 'sine', .3); },
  ult(){ if(this.q()) return; this.noise(.4, 200, .4, { f2:8000, q:.6, rev:.5 }); this.tone(this.mf(33), .9, 'sawtooth', .2, { cut:3000, rev:.5 }); this.tone(this.mf(45), .9, 'square', .08, { cut:4000, rev:.5 }); },
  ultHit(k){ if(this.q()) return; this.noise(.08, 4000 + (k % 8) * 500, .22, { q:1.5 }); this.tone(this.mf(57 + [0, 3, 7, 10, 12, 15, 19, 22][k % 8]), .12, 'square', .05, { cut:5000 }); this.tone(140, .08, 'sine', .3, { f2:50 }); },
  ultEnd(){ if(this.q()) return; this.tone(45, 1.4, 'sine', .8, { f2:25 }); this.noise(1.2, 3000, .5, { type:'lowpass', f2:60, rev:.7 }); [0, 7, 12, 16, 19].forEach((s, i) => this.tone(this.mf(45 + s), 1.6, 'sawtooth', .05, { delay:i * .02, cut:5000, cut2:500, rev:.7 })); },
  card(){ if(this.q()) return; [0, 7, 12].forEach((s, i) => this.tone(this.mf(69 + s), .2, 'square', .05, { delay:i * .05, cut:4000 })); },
  pick(){ if(this.q()) return; [0, 4, 7, 12].forEach((s, i) => this.tone(this.mf(69 + s), .3, 'sawtooth', .05, { delay:i * .04, cut:5000, rev:.4 })); },
  ui(){ if(!this.ctx) return; this.tone(880, .05, 'square', .04, { cut:3000 }); },

  /* ---------- music ---------- */
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .1; this.step = 0; this.timer = setInterval(() => this.sched(), 25); },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .05; return; }
    const bpm = this.intensity === 0 ? 100 : this.boss ? 128 : this.intensity >= 2 ? 118 : 112, sp = 60 / bpm / 4;
    while(this.nextT < c.currentTime + .15){ this.note(this.step, this.nextT, sp); this.nextT += sp; this.step = (this.step + 1) % 64; }
  },
  note(st, t, sp){
    const s16 = st % 16, bar = (st / 16) | 0, I = this.intensity, B = this.boss;
    // A minor: Am - F - C - G ; boss: Am - Bb - Am - G (phrygian menace)
    const roots = B ? [0, 1, 0, -2] : [0, -4, 3, -2], r = 45 + roots[bar];
    const minor = B ? bar !== 3 : bar === 0;
    const ch = minor ? [0, 3, 7] : [0, 4, 7];
    const o = x => Object.assign({ at:t, bus:this.mus }, x);
    // pad
    if(s16 === 0) ch.forEach((s, i) => this.tone(this.mf(r + 12 + s), sp * 16, 'sawtooth', I === 0 ? .03 : .022, o({ attack:.25, cut:I === 0 ? 900 : 1400, det:i % 2 ? 9 : -9, rev:.4 })));
    if(I === 0){
      if(s16 % 4 === 0) this.tone(this.mf(r), sp * 3, 'triangle', .1, o({}));
      if(s16 % 2 === 0){ const n = ch[(st >> 1) % 3] + 24 + (s16 >= 8 ? 12 : 0); this.tone(this.mf(r + n), sp * 1.6, 'square', .018, o({ cut:2200, rev:.5 })); }
      if(s16 === 0 || s16 === 10) this.tone(120, .25, 'sine', .25, o({ f2:45 }));
      return;
    }
    // pumping octave bass
    const bn = r - 12 + (s16 % 2 ? 12 : 0);
    this.tone(this.mf(bn), sp * .9, 'sawtooth', .075, o({ cut:B ? 900 : 700, cut2:180, q:4 }));
    // drums
    if(s16 % 4 === 0) this.tone(150, .24, 'sine', .55, o({ f2:42 }));
    if(s16 === 4 || s16 === 12){ this.noise(.28, 1800, .2, o({ q:.6, rev:.9 })); this.tone(190, .12, 'triangle', .1, o({ f2:120 })); }
    if(s16 % 2 === 1) this.noise(.035, 8000, .05, o({ type:'highpass' }));
    if(B && (s16 === 14 || s16 === 15)) this.tone(110 - (s16 - 14) * 20, .18, 'sine', .3, o({ f2:60 }));
    // arp
    if(I >= 2 || B){ const pat = [0, 1, 2, 1, 0, 2, 1, 2], n = ch[pat[s16 % 8]] + 24 + (s16 >= 8 ? 12 : 0); this.tone(this.mf(r + n), sp * .85, 'square', .03, o({ cut:3200, rev:.3 })); }
    // lead hook on the 4th bar
    if(I >= 2 && bar === 3 && s16 % 4 === 0){ const mel = [12, 10, 7, 3]; this.tone(this.mf(r + 24 + mel[s16 / 4]), sp * 3.5, 'sawtooth', .035, o({ cut:3000, rev:.5, det:6 })); }
  },
  setMusic(i){ this.intensity = i; this.boss = i === 3; },
};
