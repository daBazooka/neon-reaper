'use strict';
/* =====================================================================
   ABYSS HOOK audio: everything synthesized.
   - the sea: a low filtered rumble that darkens with depth
   - music: a calm sea-shanty lilt near the surface that turns into slow
     deep-sea pads further down; drums join during a Frenzy
   - every hooked fish plays the next note up a scale
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, rev:null, noiseBuf:null, seaF:null,
  portalMute:false, adMuted:false, hidden:false, last:{}, step:0, nextT:0, timer:null, key:62, zone:0, heat:0,
  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 8; comp.attack.value = .003; comp.release.value = .25;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(c.destination);
    const rl = c.sampleRate * 2.2 | 0, ir = c.createBuffer(2, rl, c.sampleRate);
    for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 2.3); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; const rg = c.createGain(); rg.gain.value = .45; this.rev.connect(rg); rg.connect(this.master);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.connect(this.master); this.mus.connect(this.rev);
    const len = c.sampleRate * 2; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); let br = 0; for(let i = 0; i < len; i++){ const w = Math.random() * 2 - 1; br = (br + .02 * w) / 1.02; d[i] = w * .4 + br * 3; }
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    this.seaF = c.createBiquadFilter(); this.seaF.type = 'lowpass'; this.seaF.frequency.value = 400;
    const sg = c.createGain(); sg.gain.value = .1; s.connect(this.seaF); this.seaF.connect(sg); sg.connect(this.sfx); s.start();
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
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.sfx); if(wet) g.connect(this.rev); s.start(t, Math.random() * 1.5); s.stop(t + d + .05);
  },
  bubble(v){ if(!this.ctx) return; const f = rnd(500, 1100); this.tone(f, .08, 'sine', v || .04, f * 2.2); },
  SC:[0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36],
  catchFish(n, r){
    if(!this.ctx) return;
    this.heat = Math.min(1, this.heat + .08);
    const k = this.SC[Math.min(this.SC.length - 1, n - 1)], m = this.key + 12 + k;
    this.tone(this.mf(m), .35, 'triangle', .09, 0, 0, 1); this.tone(this.mf(m + 12), .18, 'sine', .04, 0, .01);
    this.bubble(.05);
    if(r === 'R') [4, 7].forEach((s, i) => this.tone(this.mf(m + s), .4, 'sine', .05, 0, .06 + i * .05, 1));
    if(r === 'E') [4, 7, 12, 16].forEach((s, i) => this.tone(this.mf(m + s), .6, 'triangle', .06, 0, .05 + i * .05, 1));
  },
  splash(v){ if(!this.ctx || !this.gate('spl', .15)) return; this.noise(.5 + v * .3, 1800, .2 + v * .12, 'lowpass', 250, 0, .7, 1); this.noise(.15, 5000, .06, 'highpass', 2500); },
  turn(){ if(!this.ctx) return; this.tone(300, .25, 'sine', .08, 520); },
  block(){ if(!this.ctx) return; this.tone(900, .12, 'square', .05, 1400); this.noise(.1, 3000, .08, 'bandpass', 1500, 0, 3); },
  sting(){ if(!this.ctx) return; this.tone(1200, .3, 'sawtooth', .05, 300); this.noise(.25, 4000, .12, 'bandpass', 800, 0, 5); },
  chest(){ if(!this.ctx) return; [0, 4, 7, 12].forEach((s, i) => this.tone(this.mf(this.key + 24 + s), .35, 'triangle', .07, 0, i * .05, 1)); },
  pearl(){ if(!this.ctx || !this.gate('prl', .05)) return; this.tone(this.mf(this.key + 36 + pick([0, 2, 4, 7])), .12, 'sine', .04, 0, 0, 1); },
  frenzy(){ if(!this.ctx) return; this.heat = 1; [0, 4, 7, 12, 16, 19].forEach((s, i) => this.tone(this.mf(this.key + 12 + s), .3, 'square', .04, 0, i * .04, 1)); },
  legendHook(){ if(!this.ctx) return; this.tone(this.mf(this.key - 12), 1.5, 'sawtooth', .1, this.mf(this.key - 24)); this.noise(1.2, 400, .3, 'lowpass', 80, 0, 1, 1); },
  reelTap(){ if(!this.ctx || !this.gate('reel', .04)) return; this.noise(.06, 2500, .08, 'bandpass', 1200, 0, 3); this.tone(rnd(300, 380), .06, 'square', .03); },
  legend(){ if(!this.ctx) return; [0, 4, 7, 12, 16, 19, 24, 28].forEach((s, i) => this.tone(this.mf(this.key + 12 + s), 1, 'triangle', .09, 0, i * .08, 1)); this.noise(1.5, 6000, .08, 'highpass', 10000, .2, 1, 1); },
  escape(){ if(!this.ctx) return; [7, 4, 0, -5].forEach((s, i) => this.tone(this.mf(this.key + s), .5, 'triangle', .08, 0, i * .15, 1)); },
  whoosh(){ if(!this.ctx || !this.gate('wh', .06)) return; this.noise(.3, 600, .08, 'bandpass', 2500, 0, 2); },
  snap(combo){ if(!this.ctx) return; const m = this.key + 24 + this.SC[Math.min(10, combo)]; this.tone(this.mf(m), .25, 'square', .05, 0, 0, 1); this.tone(this.mf(m + 7), .2, 'triangle', .05, 0, .03, 1); this.noise(.08, 6000, .06, 'highpass', 9000); },
  coin(){ if(!this.ctx || !this.gate('coin', .05)) return; this.tone(this.mf(this.key + 31 + pick([0, 2, 4])), .08, 'square', .025); },
  level(){ if(!this.ctx) return; [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(this.mf(this.key + 12 + s), .8, 'triangle', .1, 0, i * .08, 1)); },
  discover(){ if(!this.ctx) return; [12, 16, 19, 24, 28].forEach((s, i) => this.tone(this.mf(this.key + 12 + s), .7, 'sine', .07, 0, .05 + i * .08, 1)); },
  open(){ if(!this.ctx) return; this.noise(.3, 800, .2, 'lowpass', 3000, 0, 1); [0, 7, 12, 19, 24].forEach((s, i) => this.tone(this.mf(this.key + 24 + s), .6, 'triangle', .07, 0, .15 + i * .05, 1)); },
  buy(){ if(!this.ctx) return; [0, 7, 12].forEach((s, i) => this.tone(this.mf(this.key + 12 + s), .15, 'triangle', .07, 0, i * .04)); },
  deny(){ if(!this.ctx) return; this.tone(200, .15, 'square', .05, 130); },
  ui(){ if(!this.ctx) return; this.tone(this.mf(this.key + 24), .06, 'triangle', .05); },
  claim(){ if(!this.ctx) return; [0, 4, 7, 12].forEach((s, i) => this.tone(this.mf(this.key + 24 + s), .4, 'square', .04, 0, i * .06, 1)); },
  setZone(z){ this.zone = z; this.key = ZONES[z].key; },
  depthFilter(d){ if(!this.ctx || !this.seaF) return; this.seaF.frequency.setTargetAtTime(clamp(900 - d * .6, 180, 900), this.ctx.currentTime, .3); },

  /* ---------- music ---------- */
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .1; this.step = 0; this.timer = setInterval(() => this.sched(), 30); },
  mt(f, t, d, type, v, cut){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (d > 2 ? .5 : .01)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    if(cut){ const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(cut, t); o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(this.mus); o.start(t); o.stop(t + d + .05);
  },
  drum(t, v){ const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + .15); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .22); o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + .25); },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .05; return; }
    const deep = this.zone >= 3, sp = 60 / (deep ? 70 : 100) / 2;
    const prog = deep ? [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -2, 2]] : [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [7, 11, 14]];
    const TUNE = [12, 14, 16, 19, 16, 14, 12, 9, 12, 14, 16, 12, 9, 7, 9, -1];
    while(this.nextT < c.currentTime + .15){
      const st = this.step, t = this.nextT, s8 = st % 8, bar = (st / 8 | 0) % 4, ch = prog[bar], r = this.key - 12, h = this.heat;
      if(s8 === 0){ ch.forEach(k => this.mt(this.mf(r + k), t, sp * 8.5, 'sine', deep ? .03 : .02)); this.mt(this.mf(r - 12 + ch[0]), t, sp * 7, 'triangle', .07, 400); }
      if(!deep){ const ar = [0, 1, 2, 1][s8 % 4]; this.mt(this.mf(r + 12 + ch[ar]), t, sp * 1.8, 'triangle', .022, 2000); const n = TUNE[st % 16]; if(n >= 0 && s8 % 2 === 0) this.mt(this.mf(r + 12 + n), t, sp * 1.8, 'sine', .02 + h * .015); }
      else if(s8 % 4 === 2 && Math.random() < .6) this.mt(this.mf(r + 24 + pick([0, 3, 7, 10, 12])), t, sp * 3, 'sine', .018);
      if(h > .4 && s8 % 2 === 0) this.drum(t, .1 + h * .15);
      if(Math.random() < .06) this.mt(rnd(600, 1200), t, .06, 'sine', .01);
      this.heat = Math.max(0, this.heat - .01);
      this.nextT += sp; this.step++;
    }
  },
};
