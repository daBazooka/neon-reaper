'use strict';
/* =====================================================================
   All audio is synthesized with Web Audio: no files, no licensing.
   Everything is tuned to one musical key (which drifts each night hour),
   so every bloom, every loop and every pickup lands in harmony with the
   music: the player literally plays the soundtrack.
   Master chain: compressor -> tanh soft limiter (never clips), plus a
   generated reverb for a dreamy space.
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, revIn:null, noiseBuf:null,
  portalMute:false, adMuted:false, hidden:false,
  intensity:0, boss:false, key:0, step:0, nextT:0, timer:null,
  lastMote:-1, moteN:0, lastBloom:-1, lastSnap:-1, lastTear:-1, voices:0,

  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 8; comp.attack.value = .003; comp.release.value = .25;
    const pre = c.createGain(); pre.gain.value = 1.15;
    const lim = c.createWaveShaper(), curve = new Float32Array(2048);
    for(let i = 0; i < curve.length; i++){ const x = i / (curve.length - 1) * 2 - 1; curve[i] = Math.tanh(x * 1.8) * .97; }
    lim.curve = curve;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(pre); pre.connect(lim); lim.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.connect(this.master);
    // reverb: generated impulse response (no files)
    try{
      const len = Math.round(c.sampleRate * 2.8), ir = c.createBuffer(2, len, c.sampleRate);
      for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4) * (i < 200 ? i / 200 : 1); }
      const conv = c.createConvolver(); conv.buffer = ir;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
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
    this.sfx.gain.setTargetAtTime(save.opt.sfx ? .8 : 0, t, .02);
    this.mus.gain.setTargetAtTime(save.opt.music ? .46 : 0, t, .05);
  },
  setPortalMute(m){ this.portalMute = m; this.apply(); },
  adMute(m){ this.adMuted = m; this.apply(); },
  setHidden(h){ this.hidden = h; this.apply(); },
  q(){ return !this.ctx || G.state === 'menuplay'; },

  /* ---------- primitives ---------- */
  // o: { at, delay, f2, attack, rev, bus, cut, det }
  tone(f, d, type, v, o){
    const c = this.ctx; if(!c) return;
    o = o || {};
    const t = o.at !== undefined ? o.at : c.currentTime + (o.delay || 0), a = o.attack || .005;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if(o.det) osc.detune.setValueAtTime(o.det, t);
    if(o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, v), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(d, a + .01));
    let src = osc;
    if(o.cut){ const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(o.cut, t); osc.connect(fl); src = fl; }
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
    const g = c.createGain(), a = o.attack || .004; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + Math.max(d, a + .01));
    s.connect(f); f.connect(g); g.connect(o.bus || this.sfx);
    if(o.rev && this.revIn){ const r = c.createGain(); r.gain.value = o.rev; g.connect(r); r.connect(this.revIn); }
    s.start(t, Math.random() * .5); s.stop(t + Math.max(d, a) + .05);
  },
  // a kalimba / music-box tine
  pluck(f, v, o){
    o = o || {};
    this.tone(f, o.d || 1.1, 'sine', v, o);
    this.tone(f * 2, .3, 'sine', v * .22, Object.assign({}, o, { rev:(o.rev || 0) * .5 }));
    this.tone(f * 3.01, .12, 'triangle', v * .08, Object.assign({}, o, { rev:0 }));
  },
  mf(m){ return 440 * Math.pow(2, (m - 69) / 12); },
  // a pentatonic note in the current key: idx 0 = the key's C5
  pent(idx){ const sc = [0, 2, 4, 7, 9], i = Math.max(0, idx | 0); return this.mf(72 + this.key + sc[i % 5] + 12 * Math.floor(i / 5)); },

  /* ---------- SFX ---------- */
  bloom(idx){
    if(this.q()) return;
    const t = this.ctx.currentTime, crowd = t - this.lastBloom < .03; this.lastBloom = t;
    const f = this.pent(Math.min(13, idx));
    this.pluck(f, crowd ? .06 : .11, { rev:.55 });
    this.tone(f * 2, .6, 'sine', .025, { rev:.8, attack:.02 });
  },
  loop(n, chain){
    if(this.q()) return;
    this.noise(.45, 500, .1, { f2:2600, q:.7, rev:.4, attack:.05 });
    if(n >= 3){
      const ch = [0, 4, 7, 11, 14], base = 60 + this.key;
      ch.forEach((s, i) => this.tone(this.mf(base + s), 1.6, 'triangle', .035, { delay:.02 + i * .03, attack:.04, rev:.7 }));
    }
    if(n >= 8){ this.tone(this.mf(36 + this.key), 1.4, 'sine', .22, { attack:.03, rev:.3 }); this.noise(1.2, 3000, .05, { type:'highpass', rev:.9, attack:.2 }); }
  },
  emptyLoop(){ if(this.q()) return; this.tone(620, .18, 'sine', .04, { f2:880, rev:.4 }); },
  purify(big){
    if(this.q()) return;
    this.tone(300, big ? .7 : .4, 'sine', .09, { f2:big ? 1800 : 1300, rev:.5, attack:.02 });
    [9, 11, 13].forEach((k, i) => this.pluck(this.pent(k), .06, { delay:.12 + i * .06, rev:.7, d:.8 }));
    if(big) this.tone(this.mf(48 + this.key), 1.2, 'triangle', .1, { rev:.6, attack:.02 });
  },
  mote(){
    if(this.q()) return;
    const t = this.ctx.currentTime; if(t - this.lastMote < .035) return;
    this.moteN = t - this.lastMote < .4 ? Math.min(9, this.moteN + 1) : 0; this.lastMote = t;
    this.tone(this.pent(10 + this.moteN), .08, 'sine', .025, { rev:.5 });
  },
  dust(){ if(this.q()) return; this.pluck(this.pent(12), .07, { rev:.5, d:.5 }); this.pluck(this.pent(14), .05, { delay:.06, rev:.6, d:.6 }); },
  snap(){ if(this.q()) return; const t = this.ctx.currentTime; if(t - this.lastSnap < .12) return; this.lastSnap = t; this.tone(1100, .16, 'triangle', .05, { f2:320, rev:.3 }); this.noise(.12, 5000, .05, { type:'highpass' }); },
  tear(){ if(this.q()) return; const t = this.ctx.currentTime; if(t - this.lastTear < .3) return; this.lastTear = t; this.tone(900, .1, 'sine', .035, { f2:480, rev:.5 }); },
  hurt(){ if(this.q()) return; this.tone(240, .5, 'sine', .24, { f2:80 }); this.noise(.35, 500, .18, { type:'lowpass', f2:90 }); this.tone(this.mf(54 + this.key), .6, 'triangle', .05, { rev:.5, det:-30 }); },
  beat(){ if(this.q()) return; this.tone(75, .16, 'sine', .22, { f2:50 }); this.tone(70, .16, 'sine', .16, { f2:48, delay:.2 }); },
  levelUp(){ if(this.q()) return; for(let i = 0; i < 10; i++) this.pluck(this.pent(3 + i), .06, { delay:i * .04, rev:.6, d:.9 }); },
  hour(){ if(this.q()) return; [0, 4, 7, 11].forEach((s, i) => this.pluck(this.mf(72 + this.key + s), .05, { delay:i * .09, rev:.9, d:2 })); },
  bossHorn(){
    if(this.q()) return;
    this.tone(this.mf(33 + this.key), 2.6, 'sawtooth', .07, { cut:420, attack:.8, rev:.5 });
    this.tone(this.mf(40 + this.key), 2.6, 'sawtooth', .05, { cut:520, attack:.9, rev:.5, det:7 });
    this.noise(2.2, 260, .08, { type:'lowpass', attack:.9, rev:.6 });
  },
  bossHit(){
    if(this.q()) return;
    this.tone(62, .9, 'sine', .35, { f2:38 });
    [0, 4, 7, 12, 16].forEach((s, i) => this.pluck(this.mf(67 + this.key + s), .07, { delay:i * .035, rev:.8, d:1.4 }));
    this.noise(.9, 4000, .06, { type:'highpass', rev:.9, attack:.05 });
  },
  death(){ if(this.q()) return; for(let i = 0; i < 6; i++) this.pluck(this.pent(9 - i), .06, { delay:i * .13, rev:.8, d:1.2 }); this.tone(this.mf(48 + this.key), 2, 'triangle', .06, { rev:.8, attack:.1 }); },
  card(){ if(this.q()) return; [0, 2, 4].forEach((k, i) => this.pluck(this.pent(5 + k), .07, { delay:i * .06, rev:.6, d:.7 })); },
  parry(){ if(this.q()) return; this.pluck(this.pent(12), .08, { rev:.6 }); this.tone(2400, .25, 'sine', .03, { rev:.7 }); },
  ui(){ if(!this.ctx) return; this.tone(this.pent(8), .07, 'sine', .04, { rev:.3 }); },

  /* ---------- music: lo-fi lullaby in the current key ---------- */
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .1; this.step = 0; this.timer = setInterval(() => this.sched(), 25); },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .05; return; }
    const bpm = this.intensity === 0 ? 72 : this.boss ? 100 : this.intensity >= 2 ? 92 : 86, sp = 60 / bpm / 4;
    while(this.nextT < c.currentTime + .15){ this.note(this.step, this.nextT, sp); this.nextT += sp; this.step = (this.step + 1) % 64; }
  },
  note(st, t, sp){
    const s16 = st % 16, bar = (st / 16) | 0, I = this.intensity, K = this.key;
    // I - vi - IV - V with soft 7ths and 9ths (boss: vi - IV - I - V, heavier)
    const PADS = [[4, 7, 11, 14], [4, 7, 9, 12], [5, 9, 12, 16], [2, 7, 11, 14]], BASS = [0, -3, 5, 7];
    const ord = this.boss ? [1, 2, 0, 3] : [0, 1, 2, 3], ci = ord[bar], pad = PADS[ci], root = BASS[ci];
    const o = (x) => Object.assign({ at:t, bus:this.mus }, x);
    if(s16 === 0){
      pad.forEach((s, i) => { this.tone(this.mf(60 + K + s), sp * 16 * 1.1, 'triangle', .022, o({ attack:.5, cut:1600, rev:.6, det:i % 2 ? 6 : -6 })); });
      this.tone(this.mf(36 + K + root), sp * 14, 'sine', .11, o({ attack:.04 }));
    }
    if(I === 0){
      if(s16 % 4 === 2){ const n = pad[(st >> 2) % 4]; this.tone(this.mf(72 + K + n), sp * 6, 'sine', .018, o({ rev:.8, attack:.01 })); }
      return;
    }
    if(s16 === 10) this.tone(this.mf(36 + K + root), sp * 5, 'sine', .08, o({ attack:.03 }));
    // kalimba arpeggio
    if(s16 % 2 === 0){
      const pat = [0, 2, 1, 3, 2, 1, 3, 2], n = pad[pat[(s16 / 2) | 0]] + 12 + (bar % 2 && s16 === 14 ? 12 : 0);
      const f = this.mf(60 + K + n);
      this.tone(f, .5, 'sine', s16 % 4 === 0 ? .05 : .035, o({ rev:.5 }));
      this.tone(f * 3.01, .08, 'triangle', .006, o({}));
    }
    // soft percussion
    if(s16 % 4 === 2) this.noise(.05, 7000, .025, o({ type:'highpass' }));
    if(I >= 2 || this.boss){
      if(s16 === 0 || s16 === 8 || (this.boss && s16 === 11)) this.tone(95, .2, 'sine', .3, o({ f2:42 }));
      if(s16 === 4 || s16 === 12) this.noise(.1, 2200, .05, o({ q:.8, rev:.3 }));
      if(s16 % 2 === 1) this.noise(.02, 9000, .012, o({ type:'highpass' }));
    } else if(s16 === 0) this.tone(90, .2, 'sine', .2, o({ f2:45 }));
    if(this.boss && s16 % 8 === 0) this.tone(this.mf(33 + K + root), sp * 7, 'sawtooth', .025, o({ cut:380 }));
    // twinkles on top
    if(I >= 2 && (s16 === 7 || s16 === 15) && Math.random() < .5) this.tone(this.pent(8 + ((Math.random() * 5) | 0)), .6, 'sine', .015, o({ rev:.9 }));
  },
  setMusic(i, boss){ this.intensity = i; this.boss = i === 3 || !!boss; },
  setKey(k){ this.key = k; },
};
