'use strict';
/* =====================================================================
   BO KATA — all sound is synthesized: no samples, no licensing.
   Music: a rooftop festival groove in D — dhol (bass "dagga" + stick
   "tilli"), a harmonium drone, a breathy bansuri-style flute singing a
   Khamaj-flavoured melody, and chimta jingles. Plastic pipudi horns and
   a crowd roar celebrate every BO KATA.
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, revIn:null, noiseBuf:null,
  hidden:false, step:0, nextT:0, timer:null, last:{}, level:0, sawT:0,

  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 6; comp.attack.value = .003; comp.release.value = .22;
    const lim = c.createWaveShaper(), curve = new Float32Array(2048);
    for(let i = 0; i < curve.length; i++){ const x = i / (curve.length - 1) * 2 - 1; curve[i] = Math.tanh(x * 1.5) * .97; }
    lim.curve = curve;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(lim); lim.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.connect(this.master);
    try{
      // an open-air rooftop: short, bright slap-back
      const len = Math.round(c.sampleRate * 1.4), ir = c.createBuffer(2, len, c.sampleRate);
      for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < c.sampleRate * .09 ? .4 : 1); }
      const conv = c.createConvolver(); conv.buffer = ir;
      this.revIn = c.createGain(); this.revIn.gain.value = .5; this.revIn.connect(conv); conv.connect(this.master);
    }catch(e){ this.revIn = null; }
    const nl = c.sampleRate * 2; this.noiseBuf = c.createBuffer(1, nl, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for(let i = 0; i < nl; i++) d[i] = Math.random() * 2 - 1;
    this.apply(); this.startMusic();
  },
  resume(){ try{ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }catch(e){} },
  apply(){
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.hidden ? 0 : 1, t, .03);
    this.sfx.gain.setTargetAtTime(save.opt.sfx ? .7 : 0, t, .02);
    this.mus.gain.setTargetAtTime(save.opt.music ? .42 : 0, t, .05);
  },
  setHidden(h){ this.hidden = h; this.apply(); },
  q(){ return !this.ctx || !M || M.mode === 'menu'; },
  thr(k, s){ const t = this.ctx.currentTime; if(t - (this.last[k] || -9) < s) return true; this.last[k] = t; return false; },

  tone(f, d, type, v, o){
    const c = this.ctx; if(!c) return;
    o = o || {};
    const t = o.at !== undefined ? o.at : c.currentTime + (o.delay || 0), a = o.attack || .004;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if(o.det) osc.detune.setValueAtTime(o.det, t);
    if(o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.glide || d));
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, v), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(d, a + .01));
    let src = osc;
    if(o.cut){ const fl = c.createBiquadFilter(); fl.type = o.ft || 'lowpass'; fl.Q.value = o.q || 1; fl.frequency.setValueAtTime(o.cut, t); if(o.cut2) fl.frequency.exponentialRampToValueAtTime(o.cut2, t + d); osc.connect(fl); src = fl; }
    if(o.vib){ const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * (o.vd || .012), t + Math.min(d, .25)); l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + d + .05); }
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
  // bansuri: a soft sine with an airy octave, vibrato and breath
  flute(m, d, v, at, bus){
    const f = this.mf(m), o = { at, bus, attack:.05, vib:5.2, vd:.009, rev:.45 };
    this.tone(f, d, 'sine', v, o);
    this.tone(f * 2, d * .8, 'triangle', v * .12, Object.assign({}, o, { rev:.2 }));
    this.noise(Math.min(d, .25), f * 2, v * .35, { at, bus, q:6, attack:.02 });
  },
  // pipudi: the squeaky plastic festival trumpet
  pipudi(f, d, v, delay){ this.tone(f, d, 'sawtooth', v, { delay, cut:f * 3, q:4, f2:f * 1.08, attack:.01, rev:.3 }); this.tone(f * 1.01, d, 'square', v * .5, { delay, cut:f * 2.5, q:2, det:12 }); },
  crowd(v, d){ this.noise(d || 1.6, 1300, v, { q:.7, attack:.25, rev:.4 }); this.noise(d || 1.6, 2600, v * .5, { q:1.2, attack:.3 }); for(let i = 0; i < 4; i++) this.tone(rnd(700, 1100), .35, 'sine', v * .25, { delay:rnd(0, .8), f2:rnd(1300, 1800), glide:.25, vib:9 }); },

  /* ---------- SFX ---------- */
  launch(){ if(this.q()) return; this.noise(.45, 600, .12, { f2:2400, q:.8 }); this.tone(this.mf(74), .18, 'triangle', .05, { delay:.1, f2:this.mf(81) }); },
  go(){ if(this.q()) return; this.tone(90, .4, 'sine', .5, { f2:45 }); this.pipudi(620, .35, .06, 0); this.pipudi(740, .5, .06, .3); this.crowd(.08, 1); },
  penchStart(){ if(this.q()) return; this.noise(.25, 4200, .1, { q:6 }); this.tone(1800, .2, 'sine', .04, { f2:2600 }); },
  saw(sp){ if(this.q() || this.thr('saw', .07)) return; const k = clamp(sp / 440, .2, 1); this.noise(.09, 3000 + k * 3500, .05 + k * .06, { q:3 }); },
  boKata(){
    if(this.q()) return;
    this.noise(.12, 5000, .18, { q:2 }); this.tone(140, .5, 'sine', .55, { f2:50 });
    [0, .18, .36].forEach((d, i) => this.pipudi(560 + i * 90, .22, .07, .12 + d));
    this.pipudi(830, .6, .07, .7);
    this.crowd(.16, 2);
    for(let i = 0; i < 8; i++) this.tone(i % 2 ? 180 : 110, .12, 'sine', .3, { delay:.05 + i * .07, f2:60 });
  },
  lost(){ if(this.q()) return; this.noise(.12, 4500, .15, { q:2 }); [74, 72, 69, 66].forEach((m, i) => this.flute(m, .32, .09, this.ctx.currentTime + .1 + i * .18)); this.noise(1, 600, .06, { attack:.2, q:.6 }); },
  farCut(){ if(this.q() || this.thr('far', .6)) return; this.pipudi(640, .2, .025, 0); this.crowd(.04, 1); },
  loot(){ if(this.q()) return; [0, 4, 7, 12, 16].forEach((s, i) => this.tone(this.mf(74 + s), .25, 'triangle', .07, { delay:i * .05, rev:.3 })); this.noise(.3, 7000, .06, { type:'highpass' }); },
  bump(){ if(this.q() || this.thr('bump', .3)) return; this.noise(.15, 500, .1, { q:1 }); },
  ui(){ if(!this.ctx) return; this.tone(880, .05, 'triangle', .05); this.tone(1320, .05, 'triangle', .03, { delay:.03 }); },
  coin(){ if(!this.ctx || this.thr('coin', .04)) return; this.tone(this.mf(88), .08, 'square', .03, { cut:5000 }); this.tone(this.mf(95), .15, 'square', .03, { delay:.05, cut:5000 }); },
  unlock(){ if(!this.ctx) return; [0, 4, 7, 11, 14, 19].forEach((s, i) => this.flute(62 + s, .5, .07, this.ctx.currentTime + i * .09)); this.tone(this.mf(38), 1.2, 'sine', .25, { f2:this.mf(33) }); this.crowd(.06, 1.2); },
  win(){ if(!this.ctx) return; [0, 4, 7, 12].forEach((s, i) => this.pipudi(this.mf(69 + s), .25, .05, i * .14)); this.crowd(.12, 2); },
  lose(){ if(!this.ctx) return; [69, 67, 65, 62].forEach((m, i) => this.flute(m, .4, .08, this.ctx.currentTime + i * .22)); },

  /* ---------- music ---------- */
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .1; this.step = 0; this.timer = setInterval(() => this.sched(), 25); },
  setLevel(l){ this.level = l; },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .05; return; }
    const bpm = this.level >= 2 ? 116 : this.level === 1 ? 106 : 92, sp = 60 / bpm / 4;
    while(this.nextT < c.currentTime + .15){ this.note(this.step, this.nextT, sp); this.nextT += sp; this.step = (this.step + 1) % 128; }
  },
  // D Khamaj-ish: S R G M P D n S
  SC:[0, 2, 4, 5, 7, 9, 10, 12, 14, 16, 17, 19],
  MEL:[
    [7, -1, 9, 10, 9, -1, 7, -1, 5, -1, 4, 5, 4, -1, 2, -1],
    [0, -1, 2, 4, 5, -1, 4, -1, 2, -1, -1, -1, 0, -1, -1, -1],
    [4, -1, 5, 7, 9, -1, 11, 9, 7, -1, 9, 7, 5, -1, 4, -1],
    [5, -1, 4, 2, 4, -1, -1, -1, 0, -1, -1, -1, -1, -1, -1, -1],
  ],
  note(st, t, sp){
    const s16 = st % 16, bar = (st / 16) | 0, L = this.level, B = this.mus, o = x => Object.assign({ at:t, bus:B }, x);
    const SA = 50;                                         // D3
    const chord = [0, 0, 5, 7, 0, 0, -2, 7][bar % 8];     // Sa Sa Ma Pa Sa Sa ni Pa
    // harmonium drone
    if(s16 === 0){
      for(const s of [0, 7, 12]) this.tone(this.mf(SA + chord + s), sp * 16, 'sawtooth', .018, o({ attack:.12, cut:900, det:s ? 6 : -6, rev:.2 }));
      this.tone(this.mf(SA - 12 + chord), sp * 15, 'triangle', .07, o({ attack:.05 }));
    }
    // dhol: dagga (bass) and tilli (stick)
    const dagga = L ? [0, 6, 8, 12, 14] : [0, 8], tilli = L ? [3, 4, 7, 10, 11, 15] : [4, 12];
    if(dagga.includes(s16)) this.tone(L ? 110 : 95, .22, 'sine', L ? .5 : .32, o({ f2:48 }));
    if(tilli.includes(s16)){ this.noise(.06, 2600, L ? .16 : .08, o({ q:1.4 })); this.tone(420, .05, 'triangle', .05, o({ f2:300 })); }
    if(L >= 2 && s16 % 2 === 1) this.noise(.04, 3400, .07, o({ q:2 }));
    // chimta jingles
    if(s16 % 4 === 2) this.noise(.08, 8200, L ? .05 : .03, o({ type:'highpass' }));
    // bansuri melody (the flute rests every other phrase in the calm menu groove)
    const phrase = this.MEL[bar % 4], n = phrase[s16];
    if(n >= 0 && (L > 0 || bar % 8 < 4)){
      let len = 1; while(s16 + len < 16 && phrase[s16 + len] === -1 && len < 4) len++;
      this.flute(SA + 12 + this.SC[n], sp * len * 1.05 + .05, L ? .055 : .045, t, B);
    }
  },
};
