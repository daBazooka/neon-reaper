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
  eng: 0, engT: 0,
  hit(k, blocked){ if(!this.ok('hit', 0.04)) return; if(blocked){ this.tone(1200, 0.15, 'square', 0.08, 0, 700); this.noise(0.1, 0.2, 5000, 2000, 2); return; } this.noise(0.18 + k * 0.2, 0.3 + k * 0.4, 1800, 120, 0.8); this.tone(140 - k * 50, 0.2 + k * 0.2, 'sine', 0.35 + k * 0.3, 0, 45); this.tone(900 + k * 400, 0.06, 'square', 0.05); },
  thud(k){ if(!this.ok('thud', 0.08)) return; this.noise(0.12, 0.2 + k * 0.3, 900, 120, 0.8); this.tone(110, 0.15, 'sine', 0.25 * k + 0.1, 0, 50); },
  clank(k){ if(!this.ok('clank', 0.07)) return; this.tone(1600 + Math.random() * 600, 0.12, 'square', 0.04 + k * 0.06, 0, 900); this.noise(0.08, 0.15 * k + 0.05, 6000, 2500, 3); },
  boom(k){ if(!this.ok('boom', 0.05)) return; k = k || 1; this.noise(0.7 * k, Math.min(0.9, 0.55 * k), 2600, 70, 0.6); this.tone(90, 0.6 * k, 'sine', 0.45, 0, 30); this.noise(0.25, 0.3, 7000, 2000, 1, 0, 'highpass'); },
  crate(){ if(!this.ok('crate', 0.05)) return; this.noise(0.18, 0.35, 1400, 300, 1.5); this.tone(260, 0.1, 'triangle', 0.12, 0, 140); },
  cone(){ if(!this.ok('cone', 0.06)) return; this.tone(520, 0.08, 'triangle', 0.1, 0, 300); },
  coin(){ if(!this.ok('coin', 0.035)) return; this.tone(1318, 0.06, 'square', 0.04); this.tone(1976, 0.1, 'square', 0.04, 0.04); },
  combo(n){ [0, 4, 7, 12].slice(0, Math.min(4, n)).forEach((s, i) => this.tone(this.note(s + n * 2), 0.18, 'square', 0.08, i * 0.05)); },
  ouch(){ if(!this.ok('ouch', 0.2)) return; this.tone(220, 0.2, 'sawtooth', 0.12, 0, 90); },
  heal(){ [12, 16, 19].forEach((s, i) => this.tone(this.note(s), 0.2, 'sine', 0.12, i * 0.05)); },
  zap(){ if(!this.ok('zap', 0.08)) return; this.noise(0.15, 0.25, 7000, 1500, 3); this.tone(1800, 0.1, 'square', 0.04, 0, 500); },
  nitro(){ this.noise(0.5, 0.35, 600, 4000, 1); this.tone(200, 0.4, 'sawtooth', 0.1, 0, 600); },
  skid(dt){ if(!this.ok('skid', 0.11)) return; this.noise(0.13, 0.07, 2600, 1800, 4); },
  horn(){ this.tone(311, 0.7, 'sawtooth', 0.12); this.tone(370, 0.7, 'sawtooth', 0.1); this.tone(78, 0.9, 'sawtooth', 0.15, 0, 60); },
  clear(){ [0, 4, 7, 12, 16].forEach((s, i) => this.tone(this.note(s + 2), 0.25, 'square', 0.09, i * 0.07)); this.noise(0.6, 0.15, 4000, 9000, 0.7, 0.2, 'highpass'); },
  pickCard(){ [0, 7, 12].forEach((s, i) => this.tone(this.note(s + 12), 0.2, 'square', 0.08, i * 0.04)); this.tone(200, 0.3, 'sawtooth', 0.1, 0, 800); },
  ko(){ [12, 7, 3, 0].forEach((s, i) => this.tone(this.note(s), 0.2, 'square', 0.1, i * 0.08)); },
  win(){ [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(this.note(s), 0.3, 'square', 0.1, i * 0.09)); },
  over(){ [7, 3, 0, -5, -12].forEach((s, i) => this.tone(this.note(s), 0.35, 'sawtooth', 0.1, i * 0.14)); },
  click(){ this.tone(700, 0.05, 'triangle', 0.15, 0, 900); },
  buy(){ [0, 7, 12, 19].forEach((s, i) => this.tone(this.note(s), 0.2, 'square', 0.1, i * 0.05)); this.tone(1976, 0.2, 'square', 0.05, 0.2); },
  lose1(){ this.tone(300, 0.15, 'triangle', 0.12, 0, 200); },

  /* driving rock: power chords, kick/snare; the engine purrs on the off-steps */
  PROG: [[0, 7, 12], [-4, 3, 8], [-7, 0, 5], [-2, 5, 10]],
  setStyle(s){ this.style = s; },
  startMusic(){
    if(!this.ctx) return;
    this.nextT = this.ctx.currentTime + 0.1;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.sched(), 50);
  },
  sched(){
    if(!this.ctx || this.ctx.state !== 'running') return;
    const bpm = this.style === 'title' ? 116 : 140, spb = 60 / bpm / 2;
    while(this.nextT < this.ctx.currentTime + 0.2){
      const st = this.step % 64, bar = Math.floor(st / 16), ch = this.PROG[bar], beat = st % 16;
      const t = this.nextT - this.ctx.currentTime, M = this.musG, play = this.style !== 'title';
      if(beat % 4 === 0) this.tone(55, 0.14, 'sine', 0.5, t, 40, M);
      if(play && beat % 8 === 4) this.noise(0.12, 0.28, 2400, 1200, 0.8, t, 'bandpass', M);
      if(beat % 2 === 1) this.noise(0.03, 0.07, 8000, 9000, 1, t, 'highpass', M);
      const root = this.note(ch[0] - 36);
      if(beat % 2 === 0) this.tone(root, spb * 0.9, 'sawtooth', play ? 0.16 : 0.1, t, 0, M);
      if(play && (beat === 0 || beat === 6 || beat === 10)) for(const s of ch) this.tone(this.note(s - 12), spb * 1.8, 'square', 0.035, t, 0, M);
      if(st % 32 === 14 && Math.random() < 0.7) [0, 3, 5, 7].forEach((s, i) => this.tone(this.note(ch[0] + s), spb * 0.9, 'square', 0.04, t + i * spb * 0.5, 0, M));
      if(this.eng > 0.02) this.tone(48 + this.eng * 110, spb * 1.15, 'sawtooth', 0.025 + this.eng * 0.035, t, 40 + this.eng * 100);
      this.nextT += spb; this.step++;
    }
  }
};
