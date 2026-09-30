'use strict';
/* All sound is synthesized: no audio files. Muted while an ad plays, while the
   tab is hidden, and when CrazyGames asks the game to mute. */
const AU = {
  ctx: null, master: null, sfxG: null, musG: null, started: false,
  portalMute: false, adMuted: false, hidden: false,
  step: 0, nextT: 0, timer: 0, fast: false, style: 'title', scr: null,

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
  PENTA: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28],
  note(s){ return 523.25 * Math.pow(2, s / 12); },
  // bounce notes climb a scale with the combo, like playing a xylophone with the ball
  bounce(combo){
    const f = this.note(this.PENTA[combo % this.PENTA.length] + 12 * Math.floor(combo / this.PENTA.length) % 24 - 12);
    this.tone(f, 0.28, 'triangle', 0.28); this.tone(f * 3, 0.12, 'sine', 0.06, 0.005); this.tone(f / 2, 0.1, 'sine', 0.12);
  },
  star(k){ const f = this.note(this.PENTA[(k + 4) % this.PENTA.length] + 12); this.tone(f, 0.18, 'sine', 0.18); this.tone(f * 1.5, 0.14, 'sine', 0.07, 0.03); },
  coin(){ this.tone(1318, 0.06, 'square', 0.05); this.tone(1760, 0.12, 'square', 0.05, 0.05); },
  snap(){ this.noise(0.14, 0.22, 3000, 900, 1.2); },
  wall(){ this.tone(160, 0.08, 'sine', 0.18, 0, 110); },
  peg(k){ const f = this.note(this.PENTA[k % this.PENTA.length] + 12); this.tone(f, 0.22, 'sine', 0.22); this.tone(f * 2, 0.1, 'triangle', 0.06, 0.01); },
  card(){ [0, 4, 7, 12, 16].forEach((s, i) => this.tone(this.note(s + 7), 0.25, 'triangle', 0.18, i * 0.05)); this.noise(0.3, 0.15, 4000, 9000, 0.7, 0.05, 'highpass'); },
  power(){ [12, 16, 19, 24].forEach((s, i) => this.tone(this.note(s), 0.22, 'square', 0.07, i * 0.04)); this.tone(220, 0.4, 'sine', 0.2, 0, 880); },
  smash(){ this.noise(0.3, 0.45, 2500, 200, 0.7); this.tone(120, 0.2, 'square', 0.12, 0, 60); },
  pop(){ this.noise(0.1, 0.3, 5000, 1500, 1); this.tone(900, 0.1, 'sine', 0.15, 0, 300); },
  hit(){ this.noise(0.5, 0.6, 1500, 100, 0.6); this.tone(200, 0.5, 'sawtooth', 0.12, 0, 50); },
  near(){ this.noise(0.18, 0.2, 5000, 1500, 3); },
  mile(){ [0, 7, 12].forEach((s, i) => this.tone(this.note(s + 12), 0.2, 'sine', 0.15, i * 0.06)); },
  best(){ [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(this.note(s + 5), 0.3, 'triangle', 0.18, i * 0.06)); },
  pad(){ this.tone(200, 0.3, 'sine', 0.3, 0, 700); },
  beat(){ this.tone(70, 0.12, 'sine', 0.4, 0, 40); },
  over(){ [7, 4, 0, -5, -8].forEach((s, i) => this.tone(this.note(s), 0.35, 'triangle', 0.18, i * 0.13)); },
  click(){ this.tone(700, 0.05, 'triangle', 0.15, 0, 900); },
  buy(){ [0, 7, 12, 19].forEach((s, i) => this.tone(this.note(s), 0.2, 'triangle', 0.2, i * 0.05)); },
  lose1(){ this.tone(300, 0.15, 'triangle', 0.12, 0, 200); },
  /* pen scratching while drawing */
  scribble(on, speed){
    if(!this.ctx) return;
    if(on && !this.scr){
      const n = this.ctx.sampleRate, buf = this.ctx.createBuffer(1, n, n), d = buf.getChannelData(0);
      for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      s.buffer = buf; s.loop = true; f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 1.4; g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(this.sfxG); s.start();
      this.scr = { s, f, g };
    }
    if(this.scr){
      const t = this.ctx.currentTime;
      this.scr.g.gain.setTargetAtTime(on ? Math.min(0.09, speed / 9000) : 0, t, 0.03);
      this.scr.f.frequency.setTargetAtTime(1800 + Math.min(3000, speed * 1.5), t, 0.05);
    }
  },

  /* bouncy song; faster and brighter during Sugar Rush */
  PROG: [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 11, 14, 17]],
  setStyle(s){ this.style = s; },
  startMusic(){
    if(!this.ctx) return;
    this.nextT = this.ctx.currentTime + 0.1;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.sched(), 50);
  },
  sched(){
    if(!this.ctx || this.ctx.state !== 'running') return;
    const bpm = this.fast ? 128 : this.style === 'title' ? 84 : 104, spb = 60 / bpm / 2;
    while(this.nextT < this.ctx.currentTime + 0.2){
      const st = this.step % 64, bar = Math.floor(st / 16), ch = this.PROG[bar], beat = st % 16;
      const t = this.nextT - this.ctx.currentTime, M = this.musG, k = this.fast ? 5 : 0;
      if(beat % 4 === 0) this.tone(this.note(ch[0] + k - 24), spb * 1.6, 'triangle', 0.4, t, 0, M);
      if(beat % 4 === 2) this.tone(this.note(ch[0] + k - 12), spb * 0.6, 'triangle', 0.18, t, 0, M);
      if(this.style !== 'title' && beat % 4 === 0) this.tone(90, 0.12, 'sine', 0.35, t, 45, M);
      if(this.style !== 'title' && beat % 4 === 2) this.noise(0.06, 0.12, 3000, 6000, 1, t, 'bandpass', M);
      if(beat % 2 === 1) this.noise(0.03, 0.05, 8000, 9000, 1, t, 'highpass', M);
      const arp = [0, 1, 2, 3][beat % 4];
      if(beat % 2 === 0 || this.fast) this.tone(this.note(ch[arp] + k + (beat >= 8 ? 12 : 0)), spb * 0.8, 'sine', 0.1, t, 0, M);
      if(st % 16 === 12 && Math.random() < 0.6) this.tone(this.note(pick([12, 14, 16, 19]) + k + 12), spb * 3, 'triangle', 0.06, t, 0, M);
      this.nextT += spb; this.step++;
    }
  }
};
