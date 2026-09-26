'use strict';
/* =====================================================================
   All audio is synthesized with Web Audio: no audio files, no licensing.
   Music is an original procedural synthwave loop whose layers follow
   the action; it gets low-passed while you aim in slow motion.
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, lp:null, noiseBuf:null,
  portalMute:false, adMuted:false, hidden:false,
  intensity:0, boss:false, step:0, nextT:0, timer:null, kickAt:0, lastPick:0, lastHit:-1, lastBoom:-1,

  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    // master -> compressor -> soft limiter: big chain reactions stack dozens of
    // voices, so the output is soft-clipped (tanh) instead of hard-clipping
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 10; comp.ratio.value = 12; comp.attack.value = .002; comp.release.value = .18;
    const pre = c.createGain(); pre.gain.value = .5;
    const lim = c.createWaveShaper(), curve = new Float32Array(2048);
    for(let i = 0; i < curve.length; i++){ const x = i / (curve.length - 1) * 2 - 1; curve[i] = Math.tanh(x * 2) * .98; }
    lim.curve = curve;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(pre); pre.connect(lim); lim.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 18000; this.lp.Q.value = 2;
    this.mus = c.createGain(); this.lp.connect(this.mus); this.mus.connect(this.master);
    const len = c.sampleRate; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for(let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.apply();
    this.startMusic();
  },
  resume(){ try{ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }catch(e){} },
  apply(){
    if(!this.ctx) return;
    const on = !this.portalMute && !this.adMuted && !this.hidden;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(on ? 1 : 0, t, .03);
    this.sfx.gain.setTargetAtTime(save.opt.sfx ? .6 : 0, t, .02);
    this.mus.gain.setTargetAtTime(save.opt.music ? .34 : 0, t, .05);
  },
  setPortalMute(m){ this.portalMute = m; this.apply(); },
  adMute(m){ this.adMuted = m; this.apply(); },
  setHidden(h){ this.hidden = h; this.apply(); },
  setSlow(on){ if(!this.ctx) return; this.lp.frequency.setTargetAtTime(on ? 480 : 18000, this.ctx.currentTime, on ? .06 : .2); },

  /* ---------- primitives ---------- */
  tone(f, d, type, v, f2, delay, dest){
    const c = this.ctx; if(!c) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + .006);
    g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(t); o.stop(t + d + .05);
  },
  noise(d, freq, v, type, f2, delay, q, dest){
    const c = this.ctx; if(!c) return;
    const t = c.currentTime + (delay || 0);
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
    if(f2) f.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d);
    const g = c.createGain();
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(dest || this.sfx);
    s.start(t, Math.random() * .5); s.stop(t + d + .05);
  },

  /* ---------- SFX ---------- */
  launch(p){ if(!this.ctx) return; this.noise(.3, 700 + p * 900, .32, 'bandpass', 3200 + p * 2800, 0, .9); this.tone(160 + p * 90, .2, 'sawtooth', .07, 540); },
  hit(chain){
    if(!this.ctx) return;
    const sc = [0,2,4,7,9,12,14,16,19,21,24,26,28,31,33,36];
    const n = sc[clamp(chain - 1, 0, sc.length - 1)];
    const f = 330 * Math.pow(2, n / 12);
    // many kills can land in the same frame; later ones are quieter so they don't stack
    const now = this.ctx.currentTime, k = now - this.lastHit < .03 ? .45 : 1; this.lastHit = now;
    this.tone(f, .18, 'triangle', .3 * k); this.tone(f * 2, .1, 'square', .05 * k);
    this.noise(.07, 2600, .16 * k, 'highpass', 0, 0, .8);
  },
  thud(){ if(!this.ctx) return; this.tone(140, .1, 'square', .1, 70); this.noise(.06, 900, .12); },
  bounce(){ if(!this.ctx) return; this.tone(110, .1, 'sine', .28, 55); this.noise(.05, 1400, .1); },
  clang(){ if(!this.ctx) return; this.tone(880, .22, 'square', .08, 430); this.tone(1320, .28, 'triangle', .12, 940); },
  boom(big){ if(!this.ctx) return; const now = this.ctx.currentTime; if(now - this.lastBoom < .07) return; this.lastBoom = now; this.noise(big ? .8 : .5, 800, big ? .7 : .5, 'lowpass', 70); this.tone(95, big ? .6 : .4, 'sine', .55, 28); },
  hurt(){ if(!this.ctx) return; this.tone(240, .4, 'sawtooth', .22, 50); this.noise(.35, 600, .35, 'lowpass', 90); },
  pickup(){ if(!this.ctx) return; const t = performance.now(); if(t - this.lastPick < 40) return; this.lastPick = t; this.tone(1250 + Math.random() * 300, .07, 'sine', .07, 1900); },
  parry(){ if(!this.ctx) return; this.tone(1700, .09, 'square', .06, 2600); this.noise(.05, 5000, .1, 'highpass'); },
  charge(){ if(!this.ctx) return; this.tone(520, .07, 'sine', .07, 780); },
  empty(){ if(!this.ctx) return; this.tone(180, .12, 'square', .06, 120); },
  zap(){ if(!this.ctx) return; this.noise(.12, 4000, .15, 'bandpass', 900, 0, 4); },
  aim(){ if(!this.ctx) return; this.tone(600, .25, 'sine', .06, 200); },
  ui(){ if(!this.ctx) return; this.tone(700, .05, 'square', .05, 900); },
  card(){ if(!this.ctx) return; [0, 4, 7, 12].forEach((n, i) => this.tone(440 * Math.pow(2, n / 12), .22, 'triangle', .12, 0, i * .05)); },
  waveClear(){ if(!this.ctx) return; [0, 7, 12, 16, 19].forEach((n, i) => this.tone(392 * Math.pow(2, n / 12), .3, 'triangle', .13, 0, i * .07)); },
  levelUp(){ if(!this.ctx) return; [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => this.tone(523 * Math.pow(2, n / 12), .25, 'square', .06, 0, i * .06)); },
  death(){ if(!this.ctx) return; this.boom(true); this.tone(400, 1.2, 'sawtooth', .18, 40, .1); },
  streakLost(){ if(!this.ctx) return; this.tone(330, .25, 'triangle', .1, 160); },
  announce(){ if(!this.ctx) return; this.tone(988, .12, 'square', .06, 0); this.tone(1480, .2, 'square', .06, 0, .08); },

  /* ---------- music ---------- */
  startMusic(){
    if(!this.ctx || this.timer) return;
    this.nextT = this.ctx.currentTime + .1; this.step = 0;
    this.timer = setInterval(() => this.sched(), 25);
  },
  mt(f, t, d, type, v, cut){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    if(cut){ const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(cut, t); fl.frequency.exponentialRampToValueAtTime(cut * .25, t + d); o.connect(fl); fl.connect(g); }
    else o.connect(g);
    g.connect(this.lp); o.start(t); o.stop(t + d + .05);
  },
  mn(t, d, freq, v, type){
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'highpass'; f.frequency.value = freq;
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.lp); s.start(t, Math.random() * .5); s.stop(t + d + .05);
  },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running') { if(c) this.nextT = c.currentTime + .05; return; }
    const bpm = this.boss ? 136 : 124, sp = 60 / bpm / 4;
    while(this.nextT < c.currentTime + .14){
      this.note(this.step, this.nextT, sp);
      this.nextT += sp; this.step = (this.step + 1) % 64;
    }
  },
  note(st, t, sp){
    const I = this.intensity, s16 = st % 16, bar = (st / 16) | 0;
    const mf = m => 440 * Math.pow(2, (m - 69) / 12);
    // original progression: Am - F - C - G   (boss: Am - Bb - Am - E)
    const roots = this.boss ? [45, 46, 45, 40] : [45, 41, 48, 43];
    const minor = this.boss ? [true, false, true, false] : [true, false, false, false];
    const r = roots[bar], third = minor[bar] ? 3 : 4;
    const chord = [r, r + third, r + 7];
    if(I === 0){
      if(s16 === 0){ chord.forEach(n => this.mt(mf(n + 12), t, sp * 15, 'sine', .05)); this.mt(mf(r), t, sp * 15, 'triangle', .06); }
      if(s16 % 4 === 2) this.mt(mf(chord[(st >> 2) % 3] + 24), t, sp * 3, 'sine', .025);
      return;
    }
    // kick
    if(s16 % 4 === 0){
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(42, t + .18);
      g.gain.setValueAtTime(.6, t); g.gain.exponentialRampToValueAtTime(.0001, t + .24);
      o.connect(g); g.connect(this.lp); o.start(t); o.stop(t + .26);
      this.kickAt = t;
    }
    // bass: driving 8ths with octave pop
    if(s16 % 2 === 0) this.mt(mf(r - 12 + (s16 % 8 === 6 ? 12 : 0)), t, sp * 1.8, 'sawtooth', .13, 900);
    // hats / claps
    if(I >= 1 && s16 % 4 === 2) this.mn(t, .05, 7000, .08);
    if(I >= 2 && s16 % 8 === 4) this.mn(t, .16, 1600, .2, 'bandpass');
    if(I >= 3 && s16 % 2 === 1) this.mn(t, .03, 9000, .04);
    // arp
    if(I >= 2){
      const arp = [0, 1, 2, 1, 2, 0, 2, 1];
      const n = chord[arp[s16 % 8]] + 12 + (s16 >= 8 ? 12 : 0);
      this.mt(mf(n), t, sp * .9, 'square', .035, 3200);
    }
    // lead stab on boss / high intensity
    if(I >= 3 && (s16 === 0 || s16 === 10)) this.mt(mf(chord[2] + 24), t, sp * 3, 'sawtooth', .03, 2400);
  },
  // shift music to fit the action. 0 menu, 1 calm, 2 fight, 3 heat
  setMusic(i, boss){ this.intensity = i; this.boss = !!boss; },
};
