'use strict';
/* =====================================================================
   All audio is synthesized with Web Audio: no files, no licensing.
   Master chain: compressor -> tanh soft limiter, plus a small reverb.
   Music: an original campfire folk tune (banjo pluck, fiddle, stomp)
   in G major that turns minor and quicker when a boss wakes up.
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, amb:null, rev:null, noiseBuf:null,
  portalMute:false, adMuted:false, hidden:false,
  mode:0, step:0, nextT:0, timer:null, last:{},

  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 10; comp.attack.value = .003; comp.release.value = .2;
    const pre = c.createGain(); pre.gain.value = .55;
    const lim = c.createWaveShaper(), curve = new Float32Array(2048);
    for(let i = 0; i < curve.length; i++){ const x = i / (curve.length - 1) * 2 - 1; curve[i] = Math.tanh(x * 2) * .98; }
    lim.curve = curve;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(pre); pre.connect(lim); lim.connect(c.destination);
    // short forest reverb
    const rl = c.sampleRate * 1.6 | 0, ir = c.createBuffer(2, rl, c.sampleRate);
    for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 3); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; const rg = c.createGain(); rg.gain.value = .35; this.rev.connect(rg); rg.connect(this.master);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.connect(this.master); const ms = c.createGain(); ms.gain.value = .25; this.mus.connect(ms); ms.connect(this.rev);
    this.amb = c.createGain(); this.amb.connect(this.master);
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
    this.amb.gain.setTargetAtTime(save.opt.sfx ? .5 : 0, t, .05);
    this.mus.gain.setTargetAtTime(save.opt.music ? .28 : 0, t, .05);
  },
  setPortalMute(m){ this.portalMute = m; this.apply(); },
  adMute(m){ this.adMuted = m; this.apply(); },
  setHidden(h){ this.hidden = h; this.apply(); },
  gate(k, gap){ const t = this.ctx.currentTime; if(t - (this.last[k] || -1) < gap) return false; this.last[k] = t; return true; },

  tone(f, d, type, v, f2, delay, dest, wet){
    const c = this.ctx; if(!c) return;
    const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(dest || this.sfx); if(wet) g.connect(this.rev); o.start(t); o.stop(t + d + .05);
  },
  noise(d, freq, v, type, f2, delay, q, dest, wet){
    const c = this.ctx; if(!c) return;
    const t = c.currentTime + (delay || 0), s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
    if(f2) f.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d);
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(dest || this.sfx); if(wet) g.connect(this.rev); s.start(t, Math.random() * .5); s.stop(t + d + .05);
  },

  /* ---------- SFX ---------- */
  chop(last){
    if(!this.ctx || !this.gate('chop', .04)) return;
    this.noise(.09, 1200 + Math.random() * 300, .45, 'bandpass', 500, 0, 2.5, 0, 1);
    this.tone(last ? 150 : 190 + Math.random() * 30, .11, 'triangle', .35, 90);
    this.tone(700 + Math.random() * 100, .04, 'square', .05, 400);
  },
  swish(){ if(!this.ctx || !this.gate('sw', .1)) return; this.noise(.12, 1800, .06, 'bandpass', 700, 0, 1.2); },
  hit(){ if(!this.ctx || !this.gate('hit', .035)) return; this.noise(.06, 1500, .2, 'bandpass', 0, 0, 2); this.tone(260, .07, 'square', .05, 150); },
  creak(h){
    if(!this.ctx || !this.gate('creak', .12)) return;
    const f = 180 - Math.min(90, h / 5);
    this.tone(f, .5, 'sawtooth', .05, f * .6, 0, 0, 1); this.tone(f * 1.51, .45, 'sawtooth', .03, f * .9, .05);
    this.noise(.45, 700, .08, 'bandpass', 300, 0, 6);
  },
  crash(h, chain){
    if(!this.ctx || !this.gate('crash', .06)) return;
    const big = h > 250;
    this.noise(big ? 1.1 : .7, 900, big ? .75 : .55, 'lowpass', 70, 0, 1, 0, 1);
    this.tone(big ? 70 : 95, big ? .8 : .5, 'sine', .6, 32);
    this.noise(.5, 3500, .12, 'highpass', 1200, .03);               // branches and leaves
    for(let i = 0; i < 3; i++) this.tone(300 + Math.random() * 200, .08, 'triangle', .06, 150, .05 + i * .06);
    if(chain >= 2){ const sc = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24], f = 392 * Math.pow(2, sc[clamp(chain - 2, 0, sc.length - 1)] / 12); this.tone(f, .35, 'triangle', .14, 0, .04, 0, 1); this.tone(f * 1.5, .3, 'sine', .06, 0, .08); }
  },
  kill(crush){ if(!this.ctx || !this.gate('kill', .05)) return; this.tone(crush ? 420 : 560, .14, 'square', .06, 170); this.noise(.12, 900, .15, 'lowpass', 250); },
  hurt(){ if(!this.ctx) return; this.tone(300, .22, 'sawtooth', .12, 150); this.noise(.15, 600, .2, 'lowpass', 200); },
  death(){ if(!this.ctx) return; [0, -3, -7, -12].forEach((n, i) => this.tone(392 * Math.pow(2, n / 12), .5, 'triangle', .12, 0, i * .16, 0, 1)); },
  pickWood(){ if(!this.ctx || !this.gate('pw', .03)) return; this.tone(880 + Math.random() * 180, .05, 'triangle', .05, 1300); },
  coin(){ if(!this.ctx || !this.gate('coin', .05)) return; this.tone(1320, .08, 'square', .04); this.tone(1760, .12, 'square', .04, 0, .05); },
  levelUp(){ if(!this.ctx) return; [0, 4, 7, 12].forEach((n, i) => this.tone(523 * Math.pow(2, n / 12), .25, 'triangle', .1, 0, i * .06, 0, 1)); },
  card(){ if(!this.ctx) return; [0, 7, 12].forEach((n, i) => this.tone(587 * Math.pow(2, n / 12), .22, 'triangle', .1, 0, i * .05, 0, 1)); },
  ui(){ if(!this.ctx) return; this.tone(660, .05, 'triangle', .06, 880); },
  deny(){ if(!this.ctx) return; this.tone(180, .14, 'square', .06, 120); },
  buy(){ if(!this.ctx) return; this.coin(); [0, 4, 7].forEach((n, i) => this.tone(784 * Math.pow(2, n / 12), .15, 'triangle', .08, 0, .08 + i * .05)); },
  mission(){ if(!this.ctx) return; [0, 4, 7, 11, 12].forEach((n, i) => this.tone(659 * Math.pow(2, n / 12), .2, 'triangle', .08, 0, i * .07, 0, 1)); },
  owl(){ if(!this.ctx || !this.gate('owl', .5)) return; this.tone(420, .22, 'sine', .08, 380, 0, 0, 1); this.tone(400, .35, 'sine', .08, 350, .3, 0, 1); },
  beaver(){ if(!this.ctx) return; for(let i = 0; i < 4; i++) this.noise(.05, 2400, .1, 'bandpass', 0, i * .06, 4); },
  thunder(){ if(!this.ctx) return; this.noise(.25, 5000, .4, 'highpass', 1500); this.noise(1.8, 400, .6, 'lowpass', 60, .1, 1, 0, 1); this.tone(55, 1.2, 'sine', .3, 30, .1); },
  roots(){ if(!this.ctx) return; this.noise(.9, 300, .35, 'lowpass', 900, 0, 1, 0, 1); this.tone(70, .8, 'sawtooth', .08, 45); },
  ghostRing(){ if(!this.ctx) return; this.tone(660, .6, 'sine', .08, 330, 0, 0, 1); this.tone(990, .5, 'triangle', .05, 495, .05, 0, 1); },
  bossRoar(){ if(!this.ctx) return; this.noise(1.6, 250, .55, 'lowpass', 90, 0, 1, 0, 1); this.tone(60, 1.5, 'sawtooth', .18, 40); this.tone(90, 1.4, 'sawtooth', .1, 55, .1); },
  bossDown(){ if(!this.ctx) return; this.crash(400, 0); [0, 4, 7, 12, 16, 19].forEach((n, i) => this.tone(392 * Math.pow(2, n / 12), .5, 'triangle', .12, 0, .3 + i * .1, 0, 1)); },
  rooster(){ if(!this.ctx) return; [[700, .12, 900], [900, .1, 1000], [1000, .5, 700]].forEach(([f, d, f2], i) => this.tone(f, d, 'sawtooth', .06, f2, i * .13, 0, 1)); },
  dawn(){ if(!this.ctx) return; this.rooster(); [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => this.tone(392 * Math.pow(2, n / 12), .8, 'triangle', .1, 0, .7 + i * .12, 0, 1)); },

  /* ---------- night ambience: crickets and a distant owl ---------- */
  ambient(dt){
    if(!this.ctx || this.ctx.state !== 'running' || G.state !== 'play') return;
    this.ambT = (this.ambT || 0) - dt;
    if(this.ambT <= 0){
      this.ambT = rnd(.3, .9);
      const f = 4200 + Math.random() * 500;
      for(let i = 0; i < 3; i++) this.tone(f, .025, 'sine', .012, 0, i * .05, this.amb);
      if(Math.random() < .04){ this.tone(360, .3, 'sine', .03, 340, 0, this.amb, 1); this.tone(340, .45, 'sine', .03, 320, .4, this.amb, 1); }
    }
  },

  /* ---------- music ----------
     mode 0 menu (gentle), 1 night (folk), 2 after a boss (bright), 3 boss (minor, driving), 4 dawn */
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .1; this.step = 0; this.timer = setInterval(() => this.sched(), 25); },
  setMusic(m){ this.mode = m; },
  mt(f, t, d, type, v, cut, vib){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if(vib){ const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = f * .008; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + d + .05); }
    const att = type === 'sawtooth' && vib ? .05 : .005;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + att); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    if(cut){ const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(cut, t); fl.frequency.exponentialRampToValueAtTime(cut * .35, t + d); o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(this.mus); o.start(t); o.stop(t + d + .05);
  },
  mn(t, d, freq, v, type){
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'highpass'; f.frequency.value = freq;
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .003); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.mus); s.start(t, Math.random() * .5); s.stop(t + d + .05);
  },
  stomp(t, v){ const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(50, t + .12); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .18); o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + .2); this.mn(t, .06, 400, v * .25, 'lowpass'); },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .05; return; }
    const bpm = [84, 104, 110, 124, 96][this.mode] || 100, sp = 60 / bpm / 4;
    while(this.nextT < c.currentTime + .14){ this.note(this.step, this.nextT, sp); this.nextT += sp; this.step = (this.step + 1) % 64; }
  },
  note(st, t, sp){
    const mf = m => 440 * Math.pow(2, (m - 69) / 12), s16 = st % 16, bar = (st / 16) | 0, m = this.mode;
    const minor = m === 3;
    // G - C - D - G  (menu/night), Em - C - D - B (boss)
    const roots = minor ? [40, 36, 38, 35] : [43, 36, 38, 43], r = roots[bar];
    const tri = minor ? (bar === 3 ? [0, 4, 7] : bar === 0 ? [0, 3, 7] : [0, 4, 7]) : [0, 4, 7];
    // banjo roll (forward roll pattern)
    const roll = [0, 1, 2, 0, 1, 2, 0, 1, 0, 2, 1, 0, 2, 1, 0, 2];
    if(m === 0){
      if(s16 % 2 === 0) this.mt(mf(r + 12 + tri[roll[s16]] + (s16 % 8 === 4 ? 12 : 0)), t, sp * 3, 'triangle', .05, 3000);
      if(s16 === 0 || s16 === 8) this.mt(mf(r - 12 + (s16 === 8 ? 7 : 0)), t, sp * 6, 'triangle', .09);
      return;
    }
    // stomp and clap
    if(s16 % 4 === 0) this.stomp(t, minor ? .5 : .38);
    if(s16 % 8 === 4) this.mn(t, .07, 1800, .08, 'bandpass');
    if(minor && s16 % 2 === 1) this.mn(t, .02, 8000, .02);
    // upright bass: root-fifth
    if(s16 % 4 === 0) this.mt(mf(r - 12 + (s16 % 8 === 4 ? 7 : 0)), t, sp * 3.5, 'triangle', .13, 900);
    // banjo
    this.mt(mf(r + 12 + tri[roll[s16]] + (s16 === 7 || s16 === 15 ? 12 : 0)), t, sp * 2.5, 'square', .018, 2400);
    // fiddle melody every other loop (original tune)
    const mel = minor
      ? [[64, 4], [67, 2], [66, 2], [64, 4], [62, 4], [60, 4], [64, 4], [62, 4], [59, 4], [62, 2], [64, 2], [66, 4], [67, 4], [66, 4], [63, 4], [59, 8]]
      : [[67, 2], [71, 2], [74, 4], [71, 2], [69, 2], [67, 4], [72, 4], [71, 2], [69, 2], [67, 4], [69, 2], [71, 2], [74, 4], [72, 2], [71, 2], [69, 4], [71, 2], [74, 2], [79, 4], [78, 2], [76, 2], [74, 8]];
    let pos = 0, idx = st;
    for(const [n, d] of mel){ if(pos === idx){ this.mt(mf(n + (minor ? 0 : 0)), t, sp * d * .95, 'sawtooth', m === 2 ? .04 : .032, 2200, 1); break; } pos += d; if(pos > idx) break; }
  },
};
