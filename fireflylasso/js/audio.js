'use strict';
/* =====================================================================
   FIREFLY LASSO audio: everything synthesized.
   - night: crickets and a soft pad
   - music: a music-box lullaby in pentatonic, a heartbeat joins with the chain
   - every caught firefly rings the next note up a pentatonic scale
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, rev:null, noiseBuf:null,
  portalMute:false, adMuted:false, hidden:false, last:{}, step:0, nextT:0, timer:null, key:62, heat:0,
  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 8; comp.attack.value = .003; comp.release.value = .25;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(c.destination);
    const rl = c.sampleRate * 2.4 | 0, ir = c.createBuffer(2, rl, c.sampleRate);
    for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 2.4); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; const rg = c.createGain(); rg.gain.value = .5; this.rev.connect(rg); rg.connect(this.master);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.connect(this.master); this.mus.connect(this.rev);
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
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.sfx); if(wet) g.connect(this.rev); s.start(t, Math.random() * .5); s.stop(t + d + .05);
  },
  PENTA:[0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36],
  draw(){ if(!this.ctx || !this.gate('draw', .09)) return; this.tone(this.mf(this.key + 36 + ((Math.random() * 3) | 0) * 7), .12, 'sine', .012, 0, 0, 1); },
  catch(n, rainbow, pure){
    if(!this.ctx) return;
    this.heat = Math.min(1, this.heat + .12 + n * .03);
    const k = Math.min(this.PENTA.length, 2 + n);
    for(let i = 0; i < k; i++) this.tone(this.mf(this.key + 12 + this.PENTA[i]), .5, 'triangle', .07, 0, i * .045, 1);
    this.tone(this.mf(this.key + 24 + this.PENTA[k - 1]), .9, 'sine', .05, 0, k * .045, 1);
    if(rainbow) [0, 4, 7, 11, 14, 19].forEach((s, i) => this.tone(this.mf(this.key + 24 + s), 1.1, 'sine', .04, 0, .2 + i * .06, 1));
    else if(pure) [0, 7, 12].forEach((s, i) => this.tone(this.mf(this.key + 24 + s), .8, 'triangle', .04, 0, .15 + i * .05, 1));
    this.noise(.4, 7000, .03 + Math.min(.06, n * .005), 'highpass', 11000, 0, 1, 1);
  },
  snap(){ if(!this.ctx || !this.gate('snap', .1)) return; this.noise(.12, 2500, .25, 'bandpass', 600, 0, 2); this.tone(300, .18, 'square', .05, 90); this.heat = 0; },
  shoo(){ if(!this.ctx) return; this.tone(500, .25, 'sawtooth', .04, 1400); this.noise(.3, 1200, .08, 'bandpass', 3000, 0, 2); },
  swarm(){ if(!this.ctx) return; for(let i = 0; i < 8; i++) this.tone(this.mf(this.key + 24 + this.PENTA[(i * 3) % 10]), .3, 'sine', .03, 0, i * .03, 1); },
  bat(){ if(!this.ctx) return; this.tone(4200, .06, 'square', .02, 6000); this.tone(4800, .06, 'square', .02, 7000, .1); this.noise(.5, 600, .06, 'bandpass', 250, .15, 1.5); },
  queenIn(){ if(!this.ctx) return; [0, 4, 7, 12, 16].forEach((s, i) => this.tone(this.mf(this.key + s), 1.4, 'sine', .07, 0, i * .12, 1)); },
  queen(){ if(!this.ctx) return; [0, 4, 7, 12, 16, 19, 24, 28].forEach((s, i) => this.tone(this.mf(this.key + 12 + s), 1.2, 'triangle', .08, 0, i * .07, 1)); this.noise(1.4, 8000, .08, 'highpass', 12000, .1, 1, 1); },
  discover(){ if(!this.ctx) return; [12, 16, 19, 24, 28].forEach((s, i) => this.tone(this.mf(this.key + 12 + s), .9, 'sine', .06, 0, .1 + i * .09, 1)); },
  tick(){ if(!this.ctx) return; this.tone(this.mf(this.key + 31), .08, 'square', .03); },
  star(i){ if(!this.ctx) return; this.tone(this.mf(this.key + 24 + [0, 4, 7][i]), .6, 'triangle', .1, 0, 0, 1); this.tone(this.mf(this.key + 36 + [0, 4, 7][i]), .4, 'sine', .04); },
  win(){ if(!this.ctx) return; [0, 4, 7, 12, 16].forEach((s, i) => this.tone(this.mf(this.key + 12 + s), .7, 'triangle', .08, 0, i * .09, 1)); },
  lose(){ if(!this.ctx) return; [7, 4, 0].forEach((s, i) => this.tone(this.mf(this.key + s), .6, 'triangle', .07, 0, i * .15, 1)); },
  bottle(){ if(!this.ctx) return; this.tone(900, 1.2, 'sine', .08, 200, 0, 1); this.noise(1, 3000, .06, 'bandpass', 400, 0, 3, 1); },
  buy(){ if(!this.ctx) return; [0, 7, 12].forEach((s, i) => this.tone(this.mf(this.key + 12 + s), .2, 'triangle', .07, 0, i * .05, 1)); },
  deny(){ if(!this.ctx) return; this.tone(200, .15, 'square', .05, 130); },
  ui(){ if(!this.ctx) return; this.tone(this.mf(this.key + 24), .07, 'triangle', .05); },
  count(){ if(!this.ctx || !this.gate('cnt', .05)) return; this.tone(this.mf(this.key + 24 + this.PENTA[(Math.random() * 5) | 0]), .06, 'triangle', .025); },
  setPlace(i){ this.key = PLACES[i % PLACES.length].key; },

  /* ---------- night music: 72 bpm, eighth notes ---------- */
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .1; this.step = 0; this.timer = setInterval(() => this.sched(), 30); },
  mt(f, t, d, type, v, cut){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (type === 'sine' && d > 2 ? .6 : .008)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    if(cut){ const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(cut, t); o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(this.mus); o.start(t); o.stop(t + d + .05);
  },
  chirp(t, v){ const c = this.ctx; for(let k = 0; k < 3; k++){ const o = c.createOscillator(), g = c.createGain(), tt = t + k * .045; o.frequency.setValueAtTime(4300 + Math.random() * 300, tt); g.gain.setValueAtTime(.0001, tt); g.gain.exponentialRampToValueAtTime(v, tt + .005); g.gain.exponentialRampToValueAtTime(.0001, tt + .03); o.connect(g); g.connect(this.mus); o.start(tt); o.stop(tt + .05); } },
  beat(t, v){ const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(40, t + .18); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .25); o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + .3); },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .05; return; }
    const sp = 60 / 72 / 2;
    const prog = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]];
    const TUNE = [12, 9, 7, 9, 12, 14, 16, 14, 12, 9, 7, 4, 7, 9, 7, 4];
    while(this.nextT < c.currentTime + .15){
      const st = this.step, t = this.nextT, s8 = st % 8, bar = (st / 8 | 0) % 4, ch = prog[bar], r = this.key - 12, h = this.heat;
      if(s8 === 0){ ch.forEach(k => this.mt(this.mf(r + k), t, sp * 8.5, 'sine', .022)); this.mt(this.mf(r - 12 + ch[0]), t, sp * 7, 'triangle', .06, 400); }
      // music box
      const ar = [0, 2, 1, 2, 0, 2, 1, 2][s8]; if(s8 % 2 === 0 || h > .3) this.mt(this.mf(r + 24 + ch[ar]), t, sp * 3, 'triangle', .02 + h * .01, 3200);
      if(h > .35 && s8 % 2 === 0){ const n = TUNE[(st / 2 | 0) % TUNE.length]; this.mt(this.mf(r + 24 + n), t, sp * 2.2, 'sine', .018 + h * .016); }
      if(h > .55 && (s8 === 0 || s8 === 3)) this.beat(t, .12 + h * .12);
      if(Math.random() < .09) this.chirp(t + Math.random() * sp, .006 + Math.random() * .006);
      this.heat = Math.max(0, this.heat - .004);
      this.nextT += sp; this.step++;
    }
  },
};
