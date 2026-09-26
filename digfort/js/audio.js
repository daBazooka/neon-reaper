'use strict';
/* =====================================================================
   All audio is synthesized with Web Audio — no files, no licensing.
   Master chain: compressor -> tanh soft limiter, so stacked explosions
   never hard-clip. Music: calm day loop, tense night loop, boss loop.
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, noiseBuf:null,
  portalMute:false, adMuted:false, hidden:false,
  intensity:0, boss:false, step:0, nextT:0, timer:null, lastBoom:-1, lastTick:-1, lastHit:-1,

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
  mineTick(id){
    if(!this.ctx) return;
    const soft = id === B.DIRT || id === B.GRASS;
    if(soft){ this.noise(.07, 700, .22, 'lowpass', 300); this.tone(110, .06, 'sine', .12, 70); }
    else { this.noise(.05, 2600 + Math.random() * 600, .2, 'bandpass', 0, 0, 3); this.tone(420 + Math.random() * 80, .04, 'square', .05, 300); }
  },
  breakBlock(id){
    if(!this.ctx) return;
    const soft = id === B.DIRT || id === B.GRASS;
    this.noise(soft ? .22 : .18, soft ? 500 : 1800, .4, soft ? 'lowpass' : 'bandpass', soft ? 150 : 700, 0, soft ? 1 : 1.5);
    this.tone(soft ? 90 : 160, .14, 'triangle', .22, soft ? 50 : 80);
  },
  ore(combo, id){
    if(!this.ctx) return;
    this.breakBlock(B.STONE);
    const sc = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    const base = id === B.CRYSTAL ? 880 : id === B.GOLD ? 740 : id === B.IRON ? 587 : 494;
    const f = base * Math.pow(2, sc[clamp(combo - 1, 0, sc.length - 1)] / 12);
    this.tone(f, .35, 'triangle', .2, 0, .02); this.tone(f * 2, .25, 'sine', .08, 0, .05);
    if(id === B.CRYSTAL) this.tone(f * 1.5, .5, 'sine', .08, 0, .1);
  },
  place(){ if(!this.ctx) return; this.tone(150, .09, 'square', .09, 90); this.noise(.07, 900, .2, 'lowpass', 300); },
  deny(){ if(!this.ctx) return; this.tone(180, .12, 'square', .06, 120); },
  twang(){ if(!this.ctx) return; const t = this.ctx.currentTime; if(t - this.lastTick < .04) return; this.lastTick = t; this.tone(520 + Math.random() * 60, .12, 'triangle', .07, 260); this.noise(.05, 3000, .06, 'highpass'); },
  hit(){ if(!this.ctx) return; const t = this.ctx.currentTime; if(t - this.lastHit < .03) return; this.lastHit = t; this.noise(.05, 1400, .15, 'bandpass', 0, 0, 2); this.tone(240, .06, 'square', .05, 150); },
  swat(){ if(!this.ctx) return; this.noise(.08, 1100, .3, 'bandpass', 400, 0, 1.5); this.tone(200, .08, 'square', .1, 90); },
  mobDie(boss){ if(!this.ctx) return; this.tone(boss ? 300 : 620, boss ? .6 : .18, 'square', .09, boss ? 60 : 180); this.noise(boss ? .6 : .15, 900, .25, 'lowpass', 200); },
  mobDig(){ if(!this.ctx) return; this.noise(.12, 600, .18, 'lowpass', 200); },
  fall(dz){ if(!this.ctx) return; this.tone(140 - dz * 15, .16 + dz * .04, 'sine', .3, 45); this.noise(.12, 500, .25, 'lowpass', 120); },
  sizzle(){ if(!this.ctx) return; this.noise(.5, 3000, .25, 'highpass', 6000); this.tone(300, .3, 'sawtooth', .05, 80); },
  magma(){ if(!this.ctx) return; this.noise(.6, 400, .3, 'lowpass', 900); this.tone(90, .5, 'sine', .15, 60); },
  fuse(){ if(!this.ctx) return; this.noise(.4, 5000, .1, 'highpass', 8000); },
  boom(big){ if(!this.ctx) return; const t = this.ctx.currentTime; if(t - this.lastBoom < .07) return; this.lastBoom = t; this.noise(big ? .9 : .6, 800, big ? .7 : .55, 'lowpass', 60); this.tone(90, big ? .7 : .45, 'sine', .55, 28); },
  zap(){ if(!this.ctx) return; this.noise(.1, 4200, .08, 'bandpass', 1500, 0, 5); },
  heartHit(){ if(!this.ctx) return; this.tone(330, .25, 'sawtooth', .12, 200); this.tone(247, .35, 'sine', .15, 0, .06); },
  shatter(){ if(!this.ctx) return; for(let i = 0; i < 6; i++) this.tone(1200 + Math.random() * 1600, .4, 'triangle', .07, 400, i * .04); },
  horn(){ if(!this.ctx) return; this.tone(146.8, 1.4, 'sawtooth', .08, 0); this.tone(220, 1.4, 'sawtooth', .05, 0, .05); this.noise(1.2, 300, .1, 'lowpass', 120); },
  dawn(){ if(!this.ctx) return; [0, 4, 7, 12, 16].forEach((n, i) => this.tone(392 * Math.pow(2, n / 12), .6, 'triangle', .12, 0, i * .09)); },
  rise(){ if(!this.ctx) return; this.noise(1.2, 200, .35, 'lowpass', 900); this.tone(60, 1.2, 'sine', .3, 110); },
  levelUp(){ if(!this.ctx) return; [0, 4, 7, 12].forEach((n, i) => this.tone(523 * Math.pow(2, n / 12), .22, 'square', .05, 0, i * .05)); },
  card(){ if(!this.ctx) return; [0, 7, 12].forEach((n, i) => this.tone(440 * Math.pow(2, n / 12), .2, 'triangle', .1, 0, i * .05)); },
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
    const bpm = this.intensity === 0 ? 92 : this.boss ? 128 : 112, sp = 60 / bpm / 4;
    while(this.nextT < c.currentTime + .14){ this.note(this.step, this.nextT, sp); this.nextT += sp; this.step = (this.step + 1) % 64; }
  },
  note(st, t, sp){
    const mf = m => 440 * Math.pow(2, (m - 69) / 12), s16 = st % 16, bar = (st / 16) | 0;
    if(this.intensity === 0){
      // day: C - Am - F - G, soft pentatonic plucks (original)
      const roots = [48, 45, 41, 43], r = roots[bar], chord = bar === 1 ? [r, r + 3, r + 7] : [r, r + 4, r + 7];
      if(s16 === 0){ chord.forEach(n => this.mt(mf(n + 12), t, sp * 15, 'sine', .035)); this.mt(mf(r - 12), t, sp * 8, 'triangle', .07); }
      const penta = [0, 2, 4, 7, 9], pat = [0, -1, 2, -1, 4, 3, -1, 1, 0, -1, 3, -1, 4, 2, -1, -1];
      const k = pat[s16];
      if(k >= 0) this.mt(mf(60 + penta[k] + (bar === 3 && s16 > 8 ? 2 : 0) + (s16 % 7 === 0 ? 12 : 0)), t, sp * 3, 'triangle', .045);
      if(s16 % 4 === 2) this.mn(t, .03, 8000, .015);
      return;
    }
    // night: Dm - Bb - C - A (original), driving
    const roots = this.boss ? [38, 39, 38, 37] : [38, 34, 36, 33], r = roots[bar];
    const chord = bar === 3 && !this.boss ? [r, r + 4, r + 7] : [r, r + 3, r + 7];
    if(s16 % 4 === 0) this.kick(t);
    if(s16 % 2 === 0) this.mt(mf(r - 12 + (s16 % 8 === 6 ? 12 : 0)), t, sp * 1.8, 'sawtooth', .11, 800);
    if(s16 % 4 === 2) this.mn(t, .04, 7000, .05);
    if(s16 % 8 === 4) this.mn(t, .15, 1500, .14, 'bandpass');
    if(s16 === 0) chord.forEach(n => this.mt(mf(n + 12), t, sp * 14, 'sawtooth', .015, 1200));
    if(this.intensity >= 3 || this.boss){
      const arp = [0, 1, 2, 1, 2, 0, 2, 1], n = chord[arp[s16 % 8]] + 24;
      this.mt(mf(n), t, sp * .9, 'square', .025, 2600);
      if(s16 % 2 === 1) this.mn(t, .02, 9000, .025);
    }
  },
  setMusic(i, boss){ this.intensity = i; this.boss = !!boss; },
};
