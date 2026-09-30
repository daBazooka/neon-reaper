'use strict';
/* =====================================================================
   SNOWBALL EFFECT audio: everything synthesized.
   - music: a bouncy winter tune with bells; drums join as your streak grows,
     and the Avalanche doubles the tempo feel
   - swallows: a soft crunch plus a bell note that climbs with the streak
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, rev:null, noiseBuf:null,
  portalMute:false, adMuted:false, hidden:false, last:{}, step:0, nextT:0, timer:null, key:64, heat:0, aval:false,
  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 8; comp.attack.value = .003; comp.release.value = .2;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(c.destination);
    const rl = c.sampleRate * 1.6 | 0, ir = c.createBuffer(2, rl, c.sampleRate);
    for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 2.6); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; const rg = c.createGain(); rg.gain.value = .35; this.rev.connect(rg); rg.connect(this.master);
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
    this.sfx.gain.setTargetAtTime(save.opt.sfx ? .6 : 0, t, .02);
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
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.sfx); if(wet) g.connect(this.rev); o.start(t); o.stop(t + d + .05);
  },
  noise(d, freq, v, type, f2, delay, q, wet){
    const c = this.ctx; if(!c) return;
    const t = c.currentTime + (delay || 0), s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(freq, t); if(f2) f.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d); f.Q.value = q || 1;
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.sfx); if(wet) g.connect(this.rev); s.start(t, Math.random() * .5); s.stop(t + d + .05);
  },
  bell(m, v, d, delay){ const f = this.mf(m); this.tone(f, d || .6, 'sine', v, 0, delay, 1); this.tone(f * 2.76, (d || .6) * .5, 'sine', v * .35, 0, delay); this.tone(f * 5.4, (d || .6) * .25, 'sine', v * .15, 0, delay); },
  SC:[0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31],
  eat(combo, rel){
    if(!this.ctx) return;
    this.heat = Math.min(1, this.heat + .04);
    const big = rel > .45;
    this.noise(big ? .22 : .08, big ? 900 : 2600, big ? .25 : .1, 'lowpass', big ? 200 : 700, 0, 1);
    if(!this.gate('eat', .035)) return;
    const n = this.SC[Math.min(this.SC.length - 1, combo % 12 + (combo >= 12 ? 2 : 0))];
    this.bell(this.key + 12 + n, big ? .08 : .05, big ? .7 : .4);
    if(big) this.tone(this.mf(this.key - 12), .25, 'sine', .15, this.mf(this.key - 24));
  },
  streak(n){ if(!this.ctx) return; [0, 4, 7, 12].forEach((k, i) => this.bell(this.key + 24 + k, .06, .6, i * .05)); },
  crystal(){ if(!this.ctx || !this.gate('cry', .04)) return; this.bell(this.key + 31 + pick([0, 2, 4]), .045, .35); },
  jump(){ if(!this.ctx) return; this.tone(260, .18, 'sine', .09, 620); this.noise(.12, 3000, .05, 'bandpass', 5000, 0, 2); },
  slamDown(){ if(!this.ctx) return; this.tone(700, .2, 'sawtooth', .04, 120); },
  slam(){ if(!this.ctx) return; this.noise(.45, 700, .45, 'lowpass', 60, 0, 1, 1); this.tone(90, .35, 'sine', .35, 35); },
  land(){ if(!this.ctx || !this.gate('land', .2)) return; this.noise(.25, 900, .18, 'lowpass', 120, 0, 1); },
  hop(){ if(!this.ctx) return; [7, 12].forEach((k, i) => this.bell(this.key + 24 + k, .06, .4, i * .06)); },
  crash(){ if(!this.ctx) return; this.heat = 0; this.noise(.5, 1400, .5, 'lowpass', 90, 0, 1.3, 1); this.tone(140, .3, 'square', .1, 50); },
  avalanche(){ if(!this.ctx) return; this.aval = true; this.noise(1.6, 300, .5, 'lowpass', 1500, 0, 1, 1); [0, 4, 7, 12, 16, 19, 24].forEach((k, i) => this.bell(this.key + 12 + k, .08, .8, i * .06)); },
  avalEnd(){ this.aval = false; if(!this.ctx) return; [12, 7, 4].forEach((k, i) => this.bell(this.key + 12 + k, .05, .4, i * .08)); },
  tier(n){ if(!this.ctx) return; [0, 4, 7, 12, 16, 19, 24].forEach((k, i) => this.bell(this.key + k, .09, 1, i * .07)); this.tone(this.mf(this.key - 12), 1.2, 'triangle', .12, 0, 0, 1); },
  record(){ if(!this.ctx) return; [0, 7, 12, 16, 19, 24, 28].forEach((k, i) => this.bell(this.key + 12 + k, .08, .8, i * .06)); },
  discover(){ if(!this.ctx) return; [12, 16, 19, 24].forEach((k, i) => this.bell(this.key + 12 + k, .06, .7, .05 + i * .08)); },
  mission(){ if(!this.ctx) return; [0, 4, 7, 12].forEach((k, i) => this.tone(this.mf(this.key + 12 + k), .35, 'square', .04, 0, i * .07, 1)); },
  melt(){ if(!this.ctx) return; this.noise(1.2, 4000, .1, 'highpass', 800, 0, 1, 1); [7, 4, 0, -5].forEach((k, i) => this.tone(this.mf(this.key + k), .5, 'triangle', .08, 0, i * .16, 1)); },
  best(){ this.record(); },
  rank(){ if(!this.ctx) return; [0, 4, 7, 12, 16, 19, 24, 28].forEach((k, i) => this.bell(this.key + k, .1, 1.1, i * .08)); },
  buy(){ if(!this.ctx) return; [0, 7, 12].forEach((k, i) => this.bell(this.key + 12 + k, .06, .3, i * .04)); },
  deny(){ if(!this.ctx) return; this.tone(200, .15, 'square', .05, 130); },
  ui(){ if(!this.ctx) return; this.bell(this.key + 24, .04, .2); },
  count(){ if(!this.ctx || !this.gate('cnt', .05)) return; this.tone(this.mf(this.key + 24 + pick([0, 2, 4, 7])), .05, 'square', .02); },

  /* ---------- music: 132 bpm, sixteenth grid ---------- */
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .1; this.step = 0; this.timer = setInterval(() => this.sched(), 30); },
  mt(f, t, d, type, v, cut){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    if(cut){ const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(cut, t); o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(this.mus); o.start(t); o.stop(t + d + .05);
  },
  kick(t, v){ const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(45, t + .13); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .2); o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + .25); },
  jingle(t, v){ const c = this.ctx; for(let k = 0; k < 3; k++){ const s = c.createBufferSource(); s.buffer = this.noiseBuf; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 7000 + k * 1500; f.Q.value = 6; const g = c.createGain(), tt = t + k * .012; g.gain.setValueAtTime(v, tt); g.gain.exponentialRampToValueAtTime(.0001, tt + .09); s.connect(f); f.connect(g); g.connect(this.mus); s.start(tt, Math.random() * .5); s.stop(tt + .12); } },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .05; return; }
    const sp = 60 / 132 / 4;
    const prog = [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [7, 11, 14]];
    const TUNE = [12, -1, 16, 14, 12, -1, 7, -1, 9, 12, 14, -1, 12, -1, -1, -1, 16, -1, 19, 16, 14, -1, 12, -1, 11, 12, 14, -1, 7, -1, -1, -1];
    while(this.nextT < c.currentTime + .15){
      const st = this.step, t = this.nextT, s16 = st % 16, bar = (st / 16 | 0) % 4, ch = prog[bar], r = this.key - 12, h = this.aval ? 1 : this.heat;
      if(s16 % 8 === 0) this.mt(this.mf(r - 12 + ch[0]), t, sp * 7, 'triangle', .1, 500);
      if(s16 % 4 === 2) ch.forEach(k => this.mt(this.mf(r + 12 + k), t, sp * 1.5, 'square', .012, 1800));
      const n = TUNE[(st % 32)]; if(n >= 0 && (h > .15 || st % 2 === 0)) this.mt(this.mf(r + 24 + n), t, sp * 2.5, 'sine', .03 + h * .015);
      if(s16 % 4 === 0) this.kick(t, .14 + h * .18);
      if(h > .25 && s16 % 2 === 1) this.jingle(t, .012 + h * .02);
      if(this.aval && s16 % 2 === 0) this.mt(this.mf(r + 36 + ch[(st / 2 | 0) % 3]), t, sp * 1.2, 'triangle', .025, 5000);
      this.heat = Math.max(0, this.heat - .003);
      this.nextT += sp; this.step++;
    }
  },
};
