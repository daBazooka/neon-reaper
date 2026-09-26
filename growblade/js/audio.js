'use strict';
/* =====================================================================
   All audio is synthesized with Web Audio — no files, no licensing.
   Master chain: compressor -> tanh soft limiter, so stacked explosions
   never hard-clip. Music: calm menu loop, driving fight loop, boss loop.
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, noiseBuf:null,
  portalMute:false, adMuted:false, hidden:false,
  intensity:0, boss:false, step:0, nextT:0, timer:null, lastBoom:-1, lastTick:-1, lastHit:-1, lastPick:-1, gemN:0,

  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 10; comp.ratio.value = 12; comp.attack.value = .002; comp.release.value = .18;
    const pre = c.createGain(); pre.gain.value = .5;
    const lim = c.createWaveShaper(), curve = new Float32Array(2048);
    for(let i = 0; i < curve.length; i++){ const x = i / (curve.length - 1) * 2 - 1; curve[i] = Math.tanh(x * 2) * .98; }
    lim.curve = curve;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(pre); pre.connect(lim); lim.connect(c.destination);
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

  tone(f, d, type, v, f2, delay, dest){
    const c = this.ctx; if(!c) return;
    const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + d + .05);
  },
  noise(d, freq, v, type, f2, delay, q, dest){
    const c = this.ctx; if(!c) return;
    const t = c.currentTime + (delay || 0), s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
    if(f2) f.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d);
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(dest || this.sfx); s.start(t, Math.random() * .5); s.stop(t + d + .05);
  },

  /* ---------- SFX ---------- */
  slice(size, perfect, combo){
    if(!this.ctx) return;
    const t = this.ctx.currentTime, k = t - this.lastHit < .03 ? .5 : 1; this.lastHit = t;
    const f = clamp(2600 / Math.sqrt(Math.max(.3, size)), 700, 4200);
    this.noise(.16, f, .38 * k, 'bandpass', f * .35, 0, 1.6);
    this.noise(.05, 7000, .14 * k, 'highpass');
    const sc = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    this.tone(330 * Math.pow(2, sc[clamp(combo - 1, 0, sc.length - 1)] / 12), .12, 'triangle', .1 * k);
    if(perfect){ this.tone(1318, .5, 'sine', .16, 0, .02); this.tone(1976, .4, 'sine', .08, 0, .06); }
  },
  swish(p){ if(!this.ctx) return; this.noise(.22, 900 + p * 1600, .12 + p * .14, 'bandpass', 300 + p * 500, 0, .9); },
  thud(){ if(!this.ctx) return; const t = this.ctx.currentTime; if(t - this.lastTick < .06) return; this.lastTick = t; this.tone(120, .08, 'square', .08, 70); this.noise(.05, 700, .12, 'lowpass'); },
  clang(){ if(!this.ctx) return; const t = this.ctx.currentTime; if(t - this.lastTick < .06) return; this.lastTick = t; this.tone(880, .3, 'square', .07, 430); this.tone(1320, .35, 'triangle', .1, 1100); },
  parry(){ if(!this.ctx) return; this.tone(1568, .12, 'square', .07, 2400); this.tone(2093, .2, 'sine', .08, 0, .04); },
  gem(){ if(!this.ctx) return; const t = this.ctx.currentTime; if(t - this.lastPick < .035) return; this.gemN = (t - this.lastPick < .5) ? Math.min(14, (this.gemN || 0) + 1) : 0; this.lastPick = t;
    const sc = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33]; this.tone(880 * Math.pow(2, sc[this.gemN] / 12), .09, 'sine', .08); },
  spit(){ if(!this.ctx) return; this.tone(500, .12, 'square', .04, 260); },
  dash(){ if(!this.ctx) return; this.noise(.3, 600, .35, 'bandpass', 3000, 0, .8); this.tone(200, .2, 'sawtooth', .06, 600); },
  boom(){ if(!this.ctx) return; const t = this.ctx.currentTime; if(t - this.lastBoom < .07) return; this.lastBoom = t; this.noise(.7, 800, .6, 'lowpass', 60); this.tone(90, .5, 'sine', .5, 28); },
  hurt(){ if(!this.ctx) return; this.tone(240, .4, 'sawtooth', .2, 50); this.noise(.35, 600, .35, 'lowpass', 90); this.tone(600, .2, 'square', .06, 1200, .05); },
  death(){ if(!this.ctx) return; this.boom(); this.tone(400, 1.1, 'sawtooth', .16, 40, .1); },
  tierUp(){ if(!this.ctx) return; [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => this.tone(523 * Math.pow(2, n / 12), .3, 'square', .05, 0, i * .055)); this.tone(262, .8, 'triangle', .12); },
  announce(){ if(!this.ctx) return; this.tone(988, .12, 'square', .05); this.tone(1480, .2, 'square', .05, 0, .08); },
  bossHorn(){ if(!this.ctx) return; this.tone(110, 1.6, 'sawtooth', .1); this.tone(164.8, 1.6, 'sawtooth', .06, 0, .05); this.noise(1.3, 300, .12, 'lowpass', 100); },
  card(){ if(!this.ctx) return; [0, 7, 12].forEach((n, i) => this.tone(440 * Math.pow(2, n / 12), .2, 'triangle', .1, 0, i * .05)); },
  levelUp(){ this.tierUp(); },
  ui(){ if(!this.ctx) return; this.tone(700, .04, 'square', .04, 900); },

  /* ---------- music ---------- */
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .1; this.step = 0; this.timer = setInterval(() => this.sched(), 25); },
  mt(f, t, d, type, v, cut){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    if(cut){ const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(cut, t); fl.frequency.exponentialRampToValueAtTime(cut * .3, t + d); o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(this.mus); o.start(t); o.stop(t + d + .05);
  },
  mn(t, d, freq, v, type){
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'highpass'; f.frequency.value = freq;
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.mus); s.start(t, Math.random() * .5); s.stop(t + d + .05);
  },
  kick(t){ const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .16); g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.0001, t + .22); o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + .25); },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .05; return; }
    const bpm = this.intensity === 0 ? 100 : this.boss ? 138 : 126, sp = 60 / bpm / 4;
    while(this.nextT < c.currentTime + .14){ this.note(this.step, this.nextT, sp); this.nextT += sp; this.step = (this.step + 1) % 64; }
  },
  note(st, t, sp){
    const mf = m => 440 * Math.pow(2, (m - 69) / 12), s16 = st % 16, bar = (st / 16) | 0, I = this.intensity;
    // original progression: Em - C - G - D (boss: Em - F - Em - B)
    const roots = this.boss ? [40, 41, 40, 35] : [40, 36, 43, 38], r = roots[bar];
    const chord = (this.boss && bar === 3) || (!this.boss && bar > 0) ? [r, r + 4, r + 7] : [r, r + 3, r + 7];
    if(I === 0){
      if(s16 === 0){ chord.forEach(n => this.mt(mf(n + 12), t, sp * 15, 'sine', .035)); this.mt(mf(r), t, sp * 12, 'triangle', .06); }
      if(s16 % 4 === 2) this.mt(mf(chord[(st >> 2) % 3] + 24), t, sp * 3, 'triangle', .025);
      return;
    }
    if(s16 % 4 === 0) this.kick(t);
    if(s16 % 2 === 0) this.mt(mf(r - 12 + (s16 % 8 === 6 ? 12 : 0)), t, sp * 1.7, 'sawtooth', .1, 900);
    if(s16 % 4 === 2) this.mn(t, .04, 7000, .05);
    if(s16 % 8 === 4) this.mn(t, .15, 1600, .15, 'bandpass');
    if(I >= 2){ const arp = [0, 1, 2, 1, 2, 0, 2, 1], n = chord[arp[s16 % 8]] + 24; this.mt(mf(n), t, sp * .85, 'square', .028, 2800); }
    if(I >= 3){ if(s16 % 2 === 1) this.mn(t, .02, 9000, .025); if(s16 === 0 || s16 === 10) this.mt(mf(chord[2] + 24), t, sp * 3, 'sawtooth', .025, 2400); }
  },
  setMusic(i, boss){ this.intensity = i; this.boss = !!boss; },
};
