'use strict';
/* All sound is synthesized: no audio files. Muted while an ad plays, while the
   tab is hidden, and when CrazyGames asks the game to mute. */
const AU = {
  ctx: null, master: null, sfxG: null, musG: null, started: false,
  portalMute: false, adMuted: false, hidden: false,
  step: 0, nextT: 0, timer: 0, fast: false, style: 'title',

  init(){
    if(this.ctx){ this.resume(); return; }
    try{
      const C = window.AudioContext || window.webkitAudioContext;
      this.ctx = new C();
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      const comp = this.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.connect(this.master);
      this.sfxG = this.ctx.createGain(); this.sfxG.connect(comp);
      this.musG = this.ctx.createGain(); this.musG.connect(comp);
      this.apply();
      this.startMusic();
    }catch(e){ this.ctx = null; }
  },
  resume(){ if(this.ctx && this.ctx.state === 'suspended' && !this.adMuted && !this.hidden) this.ctx.resume().catch(() => {}); },
  apply(){
    if(!this.ctx) return;
    const t = this.ctx.currentTime, on = !this.portalMute && !this.adMuted && !this.hidden;
    this.master.gain.setTargetAtTime(on ? 1 : 0, t, 0.02);
    this.sfxG.gain.setTargetAtTime(save.opt.sfx ? 0.85 : 0, t, 0.02);
    this.musG.gain.setTargetAtTime(save.opt.music ? 0.26 : 0, t, 0.05);
  },
  setPortalMute(m){ this.portalMute = m; this.apply(); },
  adMute(m){ this.adMuted = m; this.apply(); },
  setHidden(h){ this.hidden = h; this.apply(); },

  tone(f, dur, type = 'sine', vol = 0.3, delay = 0, slide = 0, dest){
    if(!this.ctx) return;
    const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxG); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, f0, f1, q = 1, delay = 0, type = 'bandpass', dest){
    if(!this.ctx) return;
    const t = this.ctx.currentTime + delay, n = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
    for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = this.ctx.createBufferSource(), fl = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = buf; fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.sfxG); s.start(t);
  },
  note(s){ return 523.25 * Math.pow(2, s / 12); },
  lim: {},
  ok(k, gap){ const t = this.ctx ? this.ctx.currentTime : 0; if(t - (this.lim[k] || 0) < gap) return false; this.lim[k] = t; return true; },
  pop(perfect){ this.tone(220, .25, 'square', .14, 0, 900); this.noise(.18, .3, 1500, 4000, 1); if(perfect) [0, 4, 7, 12].forEach((n, i) => this.tone(this.note(n + 12), .18, 'triangle', .12, .05 + i * .05)); },
  balloon(n){ if(!this.ok('bal', .03)) return; const k = Math.min(24, n); this.noise(.07, .35, 3000, 1500, 2); this.tone(this.note([0, 2, 4, 7, 9][k % 5] + 12 * Math.floor(k / 5) - 5), .14, 'triangle', .13); },
  bird(){ if(!this.ok('bird', .05)) return; this.tone(900, .12, 'square', .07, 0, 1600); this.tone(1400, .1, 'square', .05, .08, 2200); },
  clang(){ this.tone(1300, .25, 'square', .06, 0, 800); this.tone(700, .3, 'triangle', .1, 0, 500); },
  ufo(){ this.tone(300, .6, 'sine', .15, 0, 1800); this.tone(600, .5, 'triangle', .08, .05, 2400); },
  jam(){ [0, 7, 12].forEach((n, i) => this.tone(this.note(n), .14, 'triangle', .12, i * .05)); },
  zap(){ this.noise(.3, .4, 6000, 900, 3); this.tone(120, .3, 'sawtooth', .12, 0, 60); },
  ouch(){ this.tone(300, .25, 'sawtooth', .12, 0, 90); this.noise(.2, .3, 900, 200, 1); },
  coin(){ if(!this.ok('coin', .035)) return; this.tone(1318, .06, 'square', .04); this.tone(1976, .1, 'square', .04, .04); },
  combo(n){ [0, 4, 7, 12, 16].slice(0, 3 + Math.min(2, n)).forEach((s, i) => this.tone(this.note(s + 7), .16, 'square', .07, i * .05)); },
  zone(){ [0, 4, 7, 12, 16, 19].forEach((s, i) => this.tone(this.note(s), .25, 'triangle', .13, i * .07)); this.noise(.8, .15, 3000, 9000, .7, .2, 'highpass'); },
  moon(){ [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(this.note(s), .4, 'triangle', .14, i * .1)); },
  jet(on){},
  record(){ [0, 4, 7, 11, 12].forEach((s, i) => this.tone(this.note(s + 5), .2, 'square', .08, i * .06)); },
  buy(){ [0, 7, 12, 19].forEach((s, i) => this.tone(this.note(s), .16, 'square', .08, i * .04)); },
  click(){ this.tone(700, .05, 'triangle', .15, 0, 900); },
  over(){ [7, 4, 0].forEach((s, i) => this.tone(this.note(s), .25, 'triangle', .12, i * .1)); },
  lose1(){ this.tone(300, .15, 'triangle', .12, 0, 200); },

  /* sunny ukulele-ish loop */
  PROG: [[0, 4, 7], [5, 9, 12], [-3, 0, 4], [7, 11, 14]],
  setStyle(s){ this.style = s; },
  startMusic(){
    if(!this.ctx) return;
    this.nextT = this.ctx.currentTime + 0.1;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.sched(), 50);
  },
  sched(){
    if(!this.ctx || this.ctx.state !== 'running') return;
    const bpm = this.style === 'title' ? 104 : 118, spb = 60 / bpm / 2;
    while(this.nextT < this.ctx.currentTime + 0.2){
      const st = this.step % 64, bar = Math.floor(st / 16), ch = this.PROG[bar], beat = st % 16;
      const t = this.nextT - this.ctx.currentTime, M = this.musG, play = this.style !== 'title';
      if(beat % 4 === 0) this.tone(55, 0.14, 'sine', 0.5, t, 40, M);
      if(play && beat % 8 === 4) this.noise(0.12, 0.28, 2400, 1200, 0.8, t, 'bandpass', M);
      if(beat % 2 === 1) this.noise(0.03, 0.07, 8000, 9000, 1, t, 'highpass', M);
      const root = this.note(ch[0] - 24);
      if(beat % 2 === 0) this.tone(root, spb * 0.9, 'triangle', play ? 0.3 : 0.2, t, 0, M);
      this.tone(this.note(ch[beat % 3] + (beat >= 8 ? 12 : 0)), spb * 0.7, 'square', play ? 0.03 : 0.022, t, 0, M);
      if(st % 32 === 14 && Math.random() < 0.7) [0, 3, 5, 7].forEach((s, i) => this.tone(this.note(ch[0] + s), spb * 0.9, 'square', 0.04, t + i * spb * 0.5, 0, M));
      this.nextT += spb; this.step++;
    }
  }
};
