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
  PENTA: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28],
  note(s){ return 523.25 * Math.pow(2, s / 12); },
  // many sounds fire dozens of times per second; a tiny per-sound limiter keeps it musical
  lim: {},
  ok(k, gap){ const t = this.ctx ? this.ctx.currentTime : 0; if(t - (this.lim[k] || 0) < gap) return false; this.lim[k] = t; return true; },
  cast(el){
    if(!this.ctx || !this.ok('c' + el, 0.09)) return;
    if(el === 'fire'){ this.noise(0.25, 0.18, 400, 1400, 1); this.tone(180, 0.2, 'sawtooth', 0.05, 0, 90); }
    else if(el === 'storm'){ this.noise(0.18, 0.22, 6000, 900, 3); this.tone(1400, 0.12, 'square', 0.04, 0, 300); }
    else if(el === 'arcane'){ this.tone(880, 0.12, 'sine', 0.06, 0, 1320); }
    else if(el === 'nature'){ this.noise(0.3, 0.12, 300, 900, 1); this.tone(220, 0.25, 'triangle', 0.08, 0, 330); }
    else if(el === 'frost'){ this.tone(1760, 0.1, 'sine', 0.05, 0, 2400); }
    else if(el === 'meteor'){ this.noise(0.6, 0.45, 1200, 80, 0.7); this.tone(90, 0.5, 'sine', 0.3, 0, 40); }
    else if(el === 'steam'){ this.noise(0.5, 0.25, 2500, 600, 0.6); }
    else if(el === 'plasma'){ this.noise(0.4, 0.4, 8000, 400, 2); this.tone(60, 0.4, 'sawtooth', 0.15, 0, 30); }
    else this.tone(660, 0.1, 'sine', 0.05, 0, 990);
  },
  pop(){ if(!this.ok('pop', 0.035)) return; const f = 400 + Math.random() * 500; this.tone(f, 0.08, 'sine', 0.08, 0, f * 1.8); },
  mote(k){ if(!this.ok('mote', 0.04)) return; const f = this.note(this.PENTA[k % this.PENTA.length] + 12); this.tone(f, 0.07, 'sine', 0.06); },
  hurt(){ if(!this.ok('hurt', 0.2)) return; this.tone(200, 0.2, 'square', 0.12, 0, 90); this.noise(0.15, 0.25, 1200, 300, 1); },
  heal(){ [12, 16, 19].forEach((s, i) => this.tone(this.note(s), 0.2, 'sine', 0.12, i * 0.05)); },
  level(){ [0, 4, 7, 12, 16].forEach((s, i) => this.tone(this.note(s + 7), 0.25, 'triangle', 0.16, i * 0.05)); this.noise(0.5, 0.15, 5000, 9000, 0.7, 0.1, 'highpass'); },
  pickCard(){ [0, 7, 12].forEach((s, i) => this.tone(this.note(s + 12), 0.2, 'sine', 0.15, i * 0.04)); },
  fusion(){ [0, 4, 7, 11, 14, 19, 24, 28].forEach((s, i) => this.tone(this.note(s), 0.6, 'triangle', 0.14, i * 0.07)); this.noise(1.2, 0.25, 2000, 9000, 0.6, 0, 'highpass'); this.tone(65, 1.2, 'sine', 0.3, 0, 130); },
  chest(){ [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(this.note(s + 5), 0.3, 'square', 0.07, i * 0.06)); },
  bossIn(){ this.tone(49, 1.6, 'sawtooth', 0.25, 0, 36); this.tone(73, 1.6, 'sawtooth', 0.18, 0.15, 55); this.noise(1.5, 0.3, 300, 60, 0.8); },
  bossDie(){ this.noise(1.2, 0.6, 2000, 60, 0.6); [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(this.note(s), 0.4, 'triangle', 0.17, 0.2 + i * 0.07)); },
  bomb(){ this.noise(1, 0.6, 3000, 100, 0.6); this.tone(110, 0.8, 'sine', 0.3, 0, 40); },
  dawn(){ [0, 4, 7, 12, 7, 12, 16, 19, 24, 28].forEach((s, i) => this.tone(this.note(s), 0.5, 'triangle', 0.16, i * 0.12)); },
  over(){ [7, 3, 0, -5, -9].forEach((s, i) => this.tone(this.note(s), 0.4, 'triangle', 0.17, i * 0.15)); },
  click(){ this.tone(700, 0.05, 'triangle', 0.15, 0, 900); },
  buy(){ [0, 7, 12, 19].forEach((s, i) => this.tone(this.note(s), 0.2, 'triangle', 0.2, i * 0.05)); },
  lose1(){ this.tone(300, 0.15, 'triangle', 0.12, 0, 200); },
  coin(){ this.tone(1318, 0.06, 'square', 0.05); this.tone(1760, 0.12, 'square', 0.05, 0.05); },

  /* bouncy song; faster and brighter during Sugar Rush */
  PROG: [[-3, 0, 4, 7], [-7, -3, 0, 4], [-4, 0, 3, 7], [-5, -1, 2, 5]],
  setStyle(s){ this.style = s; },
  startMusic(){
    if(!this.ctx) return;
    this.nextT = this.ctx.currentTime + 0.1;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.sched(), 50);
  },
  sched(){
    if(!this.ctx || this.ctx.state !== 'running') return;
    const bpm = this.fast ? 132 : this.style === 'title' ? 80 : 112, spb = 60 / bpm / 2;
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
