'use strict';
/* =====================================================================
   All audio is synthesized with Web Audio: no files.
   Every pop plays the NEXT note of an original melody, so a chain
   reaction literally plays a song. The beat underneath builds as the
   chain grows.
   ===================================================================== */
const MELODY = [0, 2, 4, 7, 9, 7, 4, 2, 4, 7, 9, 12, 9, 7, 4, 7, 9, 12, 14, 12, 9, 7, 9, 12, 14, 16, 14, 12, 9, 12, 14, 19];
const AU = {
  ctx:null, master:null, sfx:null, mus:null, rev:null, noiseBuf:null,
  portalMute:false, adMuted:false, hidden:false, last:{}, mi:0, step:0, nextT:0, timer:null, energy:0, root:60,

  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -18; comp.knee.value = 10; comp.ratio.value = 10; comp.attack.value = .002; comp.release.value = .2;
    const pre = c.createGain(); pre.gain.value = .6;
    const lim = c.createWaveShaper(), curve = new Float32Array(2048);
    for(let i = 0; i < curve.length; i++){ const x = i / (curve.length - 1) * 2 - 1; curve[i] = Math.tanh(x * 2) * .98; }
    lim.curve = curve;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(pre); pre.connect(lim); lim.connect(c.destination);
    const rl = c.sampleRate * 1.8 | 0, ir = c.createBuffer(2, rl, c.sampleRate);
    for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 2.5); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; const rg = c.createGain(); rg.gain.value = .4; this.rev.connect(rg); rg.connect(this.master);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.connect(this.master);
    const len = c.sampleRate; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for(let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.apply(); this.startMusic();
  },
  resume(){ try{ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }catch(e){} },
  apply(){
    if(!this.ctx) return;
    const on = !this.portalMute && !this.adMuted && !this.hidden, t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(on ? 1 : 0, t, .03);
    this.sfx.gain.setTargetAtTime(save.opt.sfx ? .55 : 0, t, .02);
    this.mus.gain.setTargetAtTime(save.opt.music ? .3 : 0, t, .05);
  },
  setPortalMute(m){ this.portalMute = m; this.apply(); },
  adMute(m){ this.adMuted = m; this.apply(); },
  setHidden(h){ this.hidden = h; this.apply(); },
  gate(k, gap){ const t = this.ctx.currentTime; if(t - (this.last[k] || -1) < gap) return false; this.last[k] = t; return true; },
  mf(m){ return 440 * Math.pow(2, (m - 69) / 12); },

  tone(f, d, type, v, f2, delay, wet){
    const c = this.ctx; if(!c) return;
    const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.sfx); if(wet) g.connect(this.rev); o.start(t); o.stop(t + d + .05);
  },
  noise(d, freq, v, type, f2, delay, q, wet){
    const c = this.ctx; if(!c) return;
    const t = c.currentTime + (delay || 0), s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
    if(f2) f.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d);
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.sfx); if(wet) g.connect(this.rev); s.start(t, Math.random() * .5); s.stop(t + d + .05);
  },

  /* ---------- the chain is a song ---------- */
  pop(chain, type){
    if(!this.ctx) return;
    this.energy = Math.min(1, this.energy + .06);
    if(!this.gate('pop', .045)) return;
    const n = MELODY[this.mi % MELODY.length] + 12 * Math.min(2, (this.mi / MELODY.length) | 0); this.mi++;
    const f = this.mf(this.root + n), big = type === 'big' || type === 'nuke';
    this.tone(f, .28, 'triangle', .1, 0, 0, 1);
    this.tone(f * 2, .12, 'sine', .04, 0, .005);
    this.noise(.06, big ? 600 : 2400, big ? .22 : .1, big ? 'lowpass' : 'bandpass', big ? 120 : 900, 0, 1.2);
    if(type === 'gold') this.tone(f * 3, .3, 'sine', .05, 0, .03, 1);
  },
  resetSong(){ this.mi = 0; },
  tap(){ if(!this.ctx) return; this.resetSong(); this.noise(.35, 900, .45, 'lowpass', 80, 0, 1, 1); this.tone(110, .35, 'sine', .4, 40); this.tone(this.mf(this.root - 12), .5, 'triangle', .12, 0, 0, 1); },
  crack(){ if(!this.ctx || !this.gate('crack', .05)) return; this.noise(.08, 3200, .2, 'bandpass', 1200, 0, 3); this.tone(900, .05, 'square', .04, 500); },
  zap(){ if(!this.ctx || !this.gate('zap', .06)) return; this.noise(.18, 5000, .2, 'highpass', 2000); this.tone(1400, .15, 'sawtooth', .05, 300); },
  slow(){ if(!this.ctx) return; this.tone(600, .9, 'sine', .12, 150, 0, 1); },
  nuke(){ if(!this.ctx) return; this.noise(1.2, 700, .7, 'lowpass', 40, 0, 1, 1); this.tone(70, 1, 'sine', .5, 25); },
  swallow(){ if(!this.ctx || !this.gate('sw', .08)) return; this.tone(300, .3, 'sine', .15, 60); },
  milestone(m){ if(!this.ctx) return; const ch = m >= 100 ? [0, 4, 7, 11, 14, 19] : m >= 50 ? [0, 4, 7, 12, 16] : [0, 7, 12]; ch.forEach((k, i) => this.tone(this.mf(this.root + 12 + k), .7, 'triangle', .08, 0, i * .04, 1)); this.noise(.5, 6000, .12, 'highpass', 9000, 0, 1, 1); },
  coreHit(){ if(!this.ctx || !this.gate('core', .06)) return; this.tone(160, .12, 'square', .08, 90); this.noise(.1, 800, .2, 'bandpass', 300, 0, 2); },
  coreDown(){ if(!this.ctx) return; this.nuke(); [0, 4, 7, 12, 16, 19, 24].forEach((k, i) => this.tone(this.mf(this.root + k), .8, 'triangle', .1, 0, .2 + i * .07, 1)); },
  charge(){ if(!this.ctx) return; this.tone(this.mf(this.root + 19), .15, 'sine', .08); this.tone(this.mf(this.root + 24), .2, 'sine', .08, 0, .06); },
  star(n){ if(!this.ctx) return; this.tone(this.mf(this.root + 12 + [0, 4, 7][n]), .5, 'triangle', .12, 0, 0, 1); this.tone(this.mf(this.root + 24 + [0, 4, 7][n]), .3, 'sine', .05); },
  win(){ if(!this.ctx) return; [0, 4, 7, 12].forEach((k, i) => this.tone(this.mf(this.root + k + 12), .5, 'triangle', .1, 0, i * .08, 1)); },
  lose(){ if(!this.ctx) return; [7, 4, 0].forEach((k, i) => this.tone(this.mf(this.root + k), .4, 'triangle', .08, 0, i * .12, 1)); },
  melt(){ if(!this.ctx) return; for(let i = 0; i < 10; i++) this.tone(this.mf(this.root + MELODY[i * 3 % MELODY.length] + 12), .6, 'triangle', .08, 0, i * .06, 1); this.noise(1, 3000, .15, 'highpass', 8000, 0, 1, 1); },
  overload(){ if(!this.ctx) return; this.noise(1.5, 400, .5, 'lowpass', 60, 0, 1, 1); this.tone(220, 1.2, 'sawtooth', .1, 55); },
  buy(){ if(!this.ctx) return; [0, 7, 12].forEach((k, i) => this.tone(this.mf(this.root + 12 + k), .15, 'triangle', .08, 0, i * .04)); },
  deny(){ if(!this.ctx) return; this.tone(200, .15, 'square', .06, 130); },
  ui(){ if(!this.ctx) return; this.tone(this.mf(this.root + 19), .06, 'triangle', .06); },
  count(){ if(!this.ctx || !this.gate('cnt', .05)) return; this.tone(this.mf(this.root + 24 + ((Math.random() * 3) | 0) * 2), .05, 'square', .025); },
  setWorld(w){ this.root = [60, 57, 62, 64, 55][w % 5]; },

  /* ---------- music: a pulse that builds with the chain ---------- */
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .1; this.step = 0; this.timer = setInterval(() => this.sched(), 30); },
  mt(f, t, d, type, v, cut){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    if(cut){ const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(cut, t); o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(this.mus); o.start(t); o.stop(t + d + .05);
  },
  kick(t, v){ const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + .15); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .22); o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + .25); },
  hat(t, v){ const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 8000; const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .04); s.connect(f); f.connect(g); g.connect(this.mus); s.start(t, Math.random() * .5); s.stop(t + .06); },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .05; return; }
    const sp = 60 / 112 / 4;
    while(this.nextT < c.currentTime + .15){
      const st = this.step, t = this.nextT, s16 = st % 16, bar = (st / 16 | 0) % 4, e = this.energy;
      const roots = [0, -3, -7, -5], r = this.root - 24 + roots[bar];
      if(s16 === 0) [0, 7, 12, 16].forEach(k => this.mt(this.mf(r + 12 + k), t, sp * 15, 'sine', .018));
      if(s16 % 8 === 0) this.mt(this.mf(r), t, sp * 6, 'triangle', .1, 600);
      if(e > .15 && s16 % 4 === 0) this.kick(t, .25 + e * .3);
      if(e > .35 && s16 % 2 === 1) this.hat(t, .02 + e * .04);
      if(e > .6 && s16 % 4 === 2) this.mt(this.mf(r + 12 + [0, 7, 12, 7][bar]), t, sp * 2, 'square', .02, 1800);
      this.energy = Math.max(0, this.energy - .012);
      this.nextT += sp; this.step++;
    }
  },
};
