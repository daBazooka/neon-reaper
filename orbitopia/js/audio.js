'use strict';
/* =====================================================================
   All audio is synthesized with Web Audio: no files, no licensing.
   - Music: a slow, dreamy space lullaby (Cmaj9 - Am9 - Fmaj7 - G6/9)
     with warm pads, music-box bells and a soft heartbeat bass.
     Every galaxy plays it in a new key.
   - Every merge is a note on a pentatonic scale: combos climb the
     scale, so merging literally plays a melody.
   Master chain: compressor -> tanh soft limiter (never clips).
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, revIn:null, noiseBuf:null,
  portalMute:false, adMuted:false, hidden:false, step:0, nextT:0, timer:null, last:{},

  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 6; comp.attack.value = .004; comp.release.value = .25;
    const pre = c.createGain(); pre.gain.value = 1.05;
    const lim = c.createWaveShaper(), curve = new Float32Array(2048);
    for(let i = 0; i < curve.length; i++){ const x = i / (curve.length - 1) * 2 - 1; curve[i] = Math.tanh(x * 1.6) * .97; }
    lim.curve = curve;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(pre); pre.connect(lim); lim.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.connect(this.master);
    try{
      // a long, airy hall: space should sound huge
      const len = Math.round(c.sampleRate * 3.2), ir = c.createBuffer(2, len, c.sampleRate);
      for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      const conv = c.createConvolver(); conv.buffer = ir;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
      this.revIn = c.createGain(); this.revIn.gain.value = .55;
      this.revIn.connect(lp); lp.connect(conv); conv.connect(this.master);
    }catch(e){ this.revIn = null; }
    const nl = c.sampleRate * 2; this.noiseBuf = c.createBuffer(1, nl, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for(let i = 0; i < nl; i++) d[i] = Math.random() * 2 - 1;
    this.apply(); this.startMusic();
  },
  resume(){ try{ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }catch(e){} },
  apply(){
    if(!this.ctx) return;
    const on = !this.portalMute && !this.adMuted && !this.hidden, t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(on ? 1 : 0, t, .03);
    this.sfx.gain.setTargetAtTime(save.opt.sfx ? .6 : 0, t, .02);
    this.mus.gain.setTargetAtTime(save.opt.music ? .42 : 0, t, .05);
  },
  setPortalMute(m){ this.portalMute = m; this.apply(); },
  adMute(m){ this.adMuted = m; this.apply(); },
  setHidden(h){ this.hidden = h; this.apply(); },
  q(){ return !this.ctx || G.state !== 'play'; },
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
  key(){ return [0, 2, -3, 5, -1][save.galaxy % 5]; },
  // a music-box bell: sine + a soft inharmonic partial
  bell(m, v, o){
    o = o || {}; const f = this.mf(m + this.key());
    this.tone(f, o.d || 1.2, 'sine', v, Object.assign({ rev:.5 }, o));
    this.tone(f * 2.76, (o.d || 1.2) * .4, 'sine', v * .25, Object.assign({}, o, { rev:.3 }));
    this.tone(f * 2, (o.d || 1.2) * .7, 'triangle', v * .15, Object.assign({}, o, { rev:0 }));
  },
  PENT:[0, 2, 4, 7, 9],
  pent(i){ return 60 + Math.floor(i / 5) * 12 + this.PENT[((i % 5) + 5) % 5]; },

  /* ---------- SFX ---------- */
  spawn(t){ if(this.q()) return; this.tone(this.mf(72 + this.key()), .18, 'sine', .12, { f2:this.mf(84 + this.key()), rev:.25 }); this.noise(.08, 5000, .04, { type:'highpass' }); },
  grab(){ if(this.q() || this.thr('grab', .05)) return; this.tone(900, .05, 'sine', .06); },
  drop(){ if(this.q()) return; this.tone(this.mf(67 + this.key()), .25, 'sine', .07, { rev:.3 }); },
  fling(){ if(this.q()) return; this.noise(.35, 600, .12, { f2:2800, q:.8, rev:.2 }); },
  bonk(k, t){ if(this.q() || this.thr('bonk', .07)) return; this.tone(220 - t * 8, .12, 'sine', .08 * k + .02, { f2:120 }); this.noise(.05, 1400, .05 * k); },
  merge(t, combo){
    if(this.q()) return;
    const n = this.pent(Math.min(14, t + Math.max(0, combo - 1) * 2)) - 12 + (t >= 10 ? -12 : 0);
    this.bell(n, .2, { d:1.4 });
    this.bell(n + 12, .07, { d:.8, delay:.03 });
    this.noise(.12, 3200, .08, { q:.6 });
    if(t >= 4) this.tone(this.mf(36 + this.key()), .6, 'sine', .22 + t * .01, { f2:this.mf(24 + this.key()) });
    if(combo >= 3) this.noise(.9, 7000, .05 * Math.min(3, combo - 2), { type:'highpass', rev:.6 });
  },
  sunTap(k){ if(this.q() || this.thr('tap', .035)) return; const m = 67 + Math.round((1 - k) * -5); this.bell(m, .1 * (.5 + k * .5), { d:.7 }); this.tone(this.mf(43 + this.key()), .3, 'sine', .08, { f2:this.mf(38) }); },
  feed(t){ if(this.q()) return; this.tone(this.mf(84 + this.key()), .9, 'sine', .1, { f2:this.mf(48), rev:.5 }); this.tone(60, 1.2, 'sine', .35, { f2:30 }); this.noise(1.2, 900, .18, { type:'lowpass', f2:120, rev:.5 }); },
  sunUp(){ if(this.q()) return; [0, 4, 7, 11, 14].forEach((s, i) => this.bell(60 + s, .1, { delay:i * .08, d:1.6 })); },
  comet(){ if(this.q()) return; for(let i = 0; i < 6; i++) this.bell(this.pent(8 + i), .045, { delay:i * .07, d:.7 }); this.noise(1.6, 6000, .05, { type:'highpass', attack:.4, rev:.6 }); },
  cometCatch(){ if(this.q()) return; for(let i = 0; i < 10; i++) this.bell(this.pent(5 + i), .07, { delay:i * .045, d:.9 }); this.tone(this.mf(48 + this.key()), .8, 'triangle', .12, { rev:.5 }); },
  wander(){ if(this.q()) return; this.tone(this.mf(50 + this.key()), 2.4, 'triangle', .06, { attack:.6, rev:.8, cut:1200 }); this.tone(this.mf(57 + this.key()), 2.4, 'triangle', .045, { attack:.8, delay:.3, rev:.8, cut:1200 }); },
  catchW(){ if(this.q()) return; [0, 7, 12].forEach((s, i) => this.bell(69 + s, .09, { delay:i * .06 })); },
  seed(){ if(this.q() || this.thr('seed', .1)) return; this.tone(this.mf(79 + this.key()), .15, 'sine', .05, { f2:this.mf(91 + this.key()), rev:.4 }); },
  nope(){ if(!this.ctx || this.thr('nope', .15)) return; this.tone(180, .14, 'triangle', .07, { f2:140, cut:900 }); },
  life(st){ if(this.q()) return; [0, 4, 7, 11].forEach((s, i) => this.tone(this.mf(60 + st * 2 + s + this.key()), 1.6, 'triangle', .045, { attack:.25, delay:i * .05, rev:.7, cut:2200 })); this.bell(84 + st, .06, { delay:.3 }); },
  mission(){ if(this.q()) return; [0, 4, 7, 12].forEach((s, i) => this.bell(72 + s, .085, { delay:i * .07, d:1 })); },
  discovery(t){
    if(!this.ctx) return;
    [0, 4, 7, 11, 14, 19].forEach((s, i) => this.bell(60 + s, .12, { delay:.1 + i * .09, d:2 }));
    [48, 55, 64, 67].forEach(m => this.tone(this.mf(m + this.key()), 3.2, 'triangle', .05, { attack:.6, rev:.8, cut:1800 }));
    this.tone(this.mf(36 + this.key()), 1.4, 'sine', .3, { f2:this.mf(31) });
    this.noise(2.5, 8000, .06, { type:'highpass', attack:.8, rev:.8 });
  },
  nova(){
    if(!this.ctx) return;
    this.tone(55, 3, 'sine', .6, { f2:22 }); this.noise(3.5, 1400, .45, { type:'lowpass', f2:60, rev:.8 });
    this.noise(1.5, 6000, .2, { type:'highpass', rev:.8 });
    [0, 7, 12, 16, 19, 24].forEach((s, i) => this.bell(48 + s, .1, { delay:1 + i * .15, d:2.5 }));
  },
  buy(){ if(!this.ctx) return; this.bell(79, .07, { d:.5 }); this.bell(86, .05, { d:.5, delay:.05 }); },
  ui(){ if(!this.ctx) return; this.tone(1100, .05, 'sine', .04); },

  /* ---------- music: a dreamy space lullaby ---------- */
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .1; this.step = 0; this.timer = setInterval(() => this.sched(), 30); },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .05; return; }
    const sp = 60 / 80 / 4;
    while(this.nextT < c.currentTime + .2){ this.note(this.step, this.nextT, sp); this.nextT += sp; this.step = (this.step + 1) % 128; }
  },
  note(st, t, sp){
    const s16 = st % 16, bar = (st / 16) | 0, K = this.key();
    // Cmaj9 - Am9 - Fmaj7 - G6/9, twice with a lifted second half
    const CH = [[48, 52, 55, 59, 62], [45, 48, 52, 55, 59], [41, 45, 48, 52, 57], [43, 47, 50, 52, 57]];
    const ch = CH[bar % 4].map(m => m + K), o = x => Object.assign({ at:t, bus:this.mus }, x);
    if(s16 === 0){
      // pad: soft detuned triangles with a slow bloom
      for(let i = 1; i < 5; i++){ this.tone(this.mf(ch[i]), sp * 16, 'triangle', .022, o({ attack:.9, cut:1400, det:i % 2 ? 6 : -6, rev:.5 })); }
      this.tone(this.mf(ch[0] - 12), sp * 15, 'sine', .11, o({ attack:.1 }));
    }
    if(s16 === 10) this.tone(this.mf(ch[0] - 12), sp * 5, 'sine', .06, o({ attack:.05 }));
    // music-box arpeggio: a gentle pattern through the chord
    const pat = bar >= 4 ? [0, -1, 2, -1, 4, 3, -1, 2, 1, -1, 4, -1, 3, -1, 2, -1] : [0, -1, -1, 2, -1, -1, 4, -1, 3, -1, -1, 1, -1, -1, 2, -1];
    const n = pat[s16];
    if(n >= 0){ const m = ch[n] + 24, f = this.mf(m); this.tone(f, 1.1, 'sine', .035, o({ rev:.6 })); this.tone(f * 2.76, .3, 'sine', .006, o({ rev:.3 })); }
    // a twinkle of air every few bars
    if(st % 32 === 24) this.noise(1.8, 9000, .018, o({ type:'highpass', attack:.6, rev:.7 }));
  },
};
