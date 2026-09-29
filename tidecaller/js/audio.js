'use strict';
/* =====================================================================
   TIDECALLER audio: everything synthesized.
   - ocean: filtered noise whose swell follows the tide
   - music: a gentle 6/8 sea-shanty arpeggio, key changes by biome,
     drums join as the combo climbs
   - coins climb a scale with the combo
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, amb:null, rev:null, noiseBuf:null,
  portalMute:false, adMuted:false, hidden:false, last:{}, step:0, nextT:0, timer:null, key:62, heat:0, coinN:0,
  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 8; comp.attack.value = .003; comp.release.value = .25;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(c.destination);
    const rl = c.sampleRate * 1.6 | 0, ir = c.createBuffer(2, rl, c.sampleRate);
    for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 2.8); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; const rg = c.createGain(); rg.gain.value = .35; this.rev.connect(rg); rg.connect(this.master);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.connect(this.master);
    this.amb = c.createGain(); this.amb.connect(this.master);
    const len = c.sampleRate * 2; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); let br = 0; for(let i = 0; i < len; i++){ const w = Math.random() * 2 - 1; br = (br + .02 * w) / 1.02; d[i] = w * .5 + br * 3; }
    // the sea: looping noise through a lowpass whose cutoff follows the tide
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    this.seaF = c.createBiquadFilter(); this.seaF.type = 'lowpass'; this.seaF.frequency.value = 500; this.seaF.Q.value = .4;
    this.seaG = c.createGain(); this.seaG.gain.value = .12;
    s.connect(this.seaF); this.seaF.connect(this.seaG); this.seaG.connect(this.amb); s.start();
    this.apply(); this.startMusic();
  },
  resume(){ try{ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }catch(e){} },
  apply(){
    if(!this.ctx) return;
    const on = !this.portalMute && !this.adMuted && !this.hidden, t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(on ? 1 : 0, t, .03);
    this.sfx.gain.setTargetAtTime(save.opt.sfx ? .6 : 0, t, .02);
    this.amb.gain.setTargetAtTime(save.opt.sfx ? .9 : 0, t, .1);
    this.mus.gain.setTargetAtTime(save.opt.music ? .32 : 0, t, .05);
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
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.sfx); if(wet) g.connect(this.rev); o.start(t); o.stop(t + d + .05);
  },
  noise(d, freq, v, type, f2, delay, q, wet){
    const c = this.ctx; if(!c) return;
    const t = c.currentTime + (delay || 0), s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(freq, t); if(f2) f.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d); f.Q.value = q || 1;
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.sfx); if(wet) g.connect(this.rev); s.start(t, Math.random() * 1.5); s.stop(t + d + .05);
  },
  // the sea follows the tide's movement
  tide(v, surf){ if(!this.ctx || !this.seaF) return; const t = this.ctx.currentTime, k = Math.min(1, Math.abs(v) / 1200); this.seaF.frequency.setTargetAtTime(380 + k * 1400 + (600 - surf) * .6, t, .08); this.seaG.gain.setTargetAtTime(.1 + k * .2, t, .08); },
  SCALE:[0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24],
  coin(combo){ if(!this.ctx || !this.gate('coin', .03)) return; const n = this.SCALE[Math.min(this.SCALE.length - 1, (this.coinN++ % 5) + Math.min(6, combo - 1))]; this.tone(this.mf(this.key + 12 + n), .18, 'triangle', .09, 0, 0, 1); this.tone(this.mf(this.key + 24 + n), .08, 'sine', .04); },
  gem(){ if(!this.ctx) return; [0, 4, 7, 12, 16].forEach((k, i) => this.tone(this.mf(this.key + 24 + k), .3, 'triangle', .07, 0, i * .04, 1)); },
  heart(){ if(!this.ctx) return; [0, 7, 12].forEach((k, i) => this.tone(this.mf(this.key + 12 + k), .35, 'sine', .1, 0, i * .07, 1)); },
  bottle(){ if(!this.ctx) return; this.noise(.4, 3000, .1, 'bandpass', 800, 0, 3); [0, 4, 7, 11, 14].forEach((k, i) => this.tone(this.mf(this.key + 12 + k), .6, 'triangle', .07, 0, .1 + i * .08, 1)); },
  splash(v){ if(!this.ctx || !this.gate('spl', .08)) return; this.noise(.35 + v * .25, 1800, .18 + v * .18, 'lowpass', 300, 0, .7, 1); this.noise(.12, 5000, .06 + v * .06, 'highpass', 2500); },
  launch(v){ if(!this.ctx || !this.gate('launch', .2)) return; const k = Math.min(1, v / 1300); this.noise(.5, 600, .2 + k * .2, 'bandpass', 3000, 0, 1.2, 1); this.tone(180, .4, 'sine', .1, 420 + k * 300); },
  perfect(flips){ if(!this.ctx) return; this.splash(1); const ch = flips >= 2 ? [0, 4, 7, 12, 16, 19] : flips ? [0, 4, 7, 12] : [0, 7, 12]; ch.forEach((k, i) => this.tone(this.mf(this.key + 12 + k), .7, 'triangle', .09, 0, .03 + i * .045, 1)); this.noise(.5, 6000, .07, 'highpass', 9000, .05, 1, 1); },
  combo(n){ if(!this.ctx) return; this.heat = Math.min(1, n / 7); this.tone(this.mf(this.key + 24 + Math.min(12, n * 2)), .2, 'square', .025, 0, .12); },
  hop(){ if(!this.ctx) return; this.tone(this.mf(this.key + 19), .15, 'triangle', .08); this.tone(this.mf(this.key + 24), .2, 'triangle', .08, 0, .06, 1); },
  crash(why){ if(!this.ctx) return; this.heat = 0; if(why === 'mine'){ this.noise(1.1, 900, .7, 'lowpass', 50, 0, 1, 1); this.tone(70, .8, 'sine', .5, 25); } else { this.noise(.4, 1200, .5, 'lowpass', 120, 0, 1.5, 1); this.tone(120, .3, 'square', .1, 45); this.noise(.15, 3500, .2, 'bandpass', 900, .02, 4); } },
  scrape(){ if(!this.ctx || !this.gate('scr', .3)) return; this.noise(.3, 900, .12, 'bandpass', 400, 0, 3); },
  sink(){ if(!this.ctx) return; [7, 4, 0, -5].forEach((k, i) => this.tone(this.mf(this.key + k), .5, 'triangle', .08, 0, i * .18, 1)); this.noise(1.5, 700, .2, 'lowpass', 80, 0, 1, 1); },
  kraken(){ if(!this.ctx) return; this.tone(55, 1.2, 'sawtooth', .12, 40); [0, 3, 7, 12, 15, 19].forEach((k, i) => this.tone(this.mf(this.key + 12 + k), .6, 'triangle', .08, 0, .3 + i * .07, 1)); },
  mission(){ if(!this.ctx) return; [0, 4, 7, 12].forEach((k, i) => this.tone(this.mf(this.key + 12 + k), .4, 'square', .045, 0, i * .07, 1)); },
  rank(){ if(!this.ctx) return; [0, 4, 7, 12, 16, 19, 24].forEach((k, i) => this.tone(this.mf(this.key + k), .8, 'triangle', .1, 0, i * .09, 1)); this.noise(1, 5000, .08, 'highpass', 9000, .2, 1, 1); },
  best(){ if(!this.ctx) return; [0, 7, 12, 16, 19, 24].forEach((k, i) => this.tone(this.mf(this.key + 12 + k), .7, 'triangle', .09, 0, i * .08, 1)); },
  buy(){ if(!this.ctx) return; [0, 7, 12].forEach((k, i) => this.tone(this.mf(this.key + 12 + k), .15, 'triangle', .08, 0, i * .04)); },
  deny(){ if(!this.ctx) return; this.tone(200, .15, 'square', .05, 130); },
  ui(){ if(!this.ctx) return; this.tone(this.mf(this.key + 19), .06, 'triangle', .06); },
  count(){ if(!this.ctx || !this.gate('cnt', .05)) return; this.tone(this.mf(this.key + 24 + ((Math.random() * 3) | 0) * 2), .05, 'square', .02); },
  setBiome(i){ this.key = BIOMES[i].key; },

  /* ---------- music: 6/8 at 96 bpm (dotted quarter), eighth-note grid ---------- */
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .1; this.step = 0; this.timer = setInterval(() => this.sched(), 30); },
  mt(f, t, d, type, v, cut){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    if(cut){ const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(cut, t); o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(this.mus); o.start(t); o.stop(t + d + .05);
  },
  kick(t, v){ const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + .14); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .2); o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + .25); },
  shk(t, v){ const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000; const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05); s.connect(f); f.connect(g); g.connect(this.mus); s.start(t, Math.random()); s.stop(t + .07); },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .05; return; }
    const sp = 60 / 96 / 3;   // an eighth note in 6/8
    // i - VI - III - VII (minor-ish shanty), 12 eighths per 2 bars
    const prog = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]];
    const MEL = [7, 5, 3, 5, 7, 7, 7, 8, 10, 8, 7, 5, 3, 5, 7, 3, 0, 2, 3, 5, 7, 5, 3, 2];
    while(this.nextT < c.currentTime + .15){
      const st = this.step, t = this.nextT, s6 = st % 6, bar = (st / 6 | 0) % 8, ch = prog[(bar / 2 | 0) % 4], r = this.key - 12 - 3, h = this.heat;
      if(s6 === 0) this.mt(this.mf(r + ch[0] - 12), t, sp * 5.5, 'triangle', .11, 500);
      if(s6 === 3) this.mt(this.mf(r + ch[0] - 5), t, sp * 2.5, 'triangle', .06, 500);
      // plucked arpeggio
      const ar = [0, 1, 2, 1, 2, 1][s6]; this.mt(this.mf(r + 12 + ch[ar]), t, sp * 1.6, 'triangle', .035, 2400);
      // the tune comes in once the combo warms up
      if(h > .25 && st % 2 === 0){ const n = MEL[(st / 2 | 0) % MEL.length]; this.mt(this.mf(r + 24 + n), t, sp * 1.8, 'square', .012 + h * .012, 1600); }
      if(h > .1 && (s6 === 0 || s6 === 3)) this.kick(t, .16 + h * .2);
      if(h > .45) this.shk(t, .012 + h * .02);
      this.heat = Math.max(0, this.heat - .0015);
      this.nextT += sp; this.step++;
    }
  },
};
