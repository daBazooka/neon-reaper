'use strict';
/* All sound is synthesized: no audio files. Muted while an ad plays, while the
   tab is hidden, and when CrazyGames asks the game to mute. */
const AU = {
  ctx: null, master: null, sfxG: null, musG: null, started: false,
  portalMute: false, adMuted: false, hidden: false,
  step: 0, nextT: 0, timer: 0, fast: false, nomT: 0, nomN: 0, style: 'title',

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
  // nom sounds are rate limited so a mob of 300 eating at once stays musical
  nom(chain){
    if(!this.ctx) return;
    const now = this.ctx.currentTime;
    if(now - this.nomT > 0.05){ this.nomT = now; this.nomN = 0; }
    if(this.nomN++ > 1) return;
    const f = this.note(this.PENTA[chain % this.PENTA.length]);
    this.tone(f, 0.09, 'triangle', 0.13); this.tone(f * 2, 0.05, 'sine', 0.05, 0.01);
  },
  hatch(n){ [0, 4, 7, 12].forEach((s, i) => this.tone(this.note(s + (n > 8 ? 12 : 5)), 0.22, 'triangle', 0.16, i * 0.035)); this.noise(0.12, 0.2, 3000, 800, 1); },
  join(){ this.tone(this.note(14), 0.08, 'sine', 0.1, 0, this.note(19)); },
  squish(){ this.tone(220, 0.18, 'sine', 0.25, 0, 110); this.noise(0.1, 0.18, 800, 200, 1); },
  burst(){ this.noise(0.3, 0.35, 400, 3000, 0.8); this.tone(160, 0.25, 'triangle', 0.25, 0, 420); },
  thud(){ this.tone(110, 0.14, 'sine', 0.4, 0, 60); this.noise(0.08, 0.3, 1200, 300, 1.2); },
  crate(){ this.noise(0.35, 0.55, 2400, 300, 0.7); this.tone(180, 0.2, 'square', 0.1, 0, 90); [7, 12, 16].forEach((s, i) => this.tone(this.note(s), 0.2, 'triangle', 0.12, 0.05 + i * 0.04)); },
  gulp(){ this.tone(300, 0.16, 'sine', 0.2, 0, 90); },
  lose1(){ this.tone(600, 0.12, 'triangle', 0.08, 0, 300); },
  pop(){ this.noise(0.4, 0.6, 3000, 200, 0.6); [0, 7, 12, 19].forEach((s, i) => this.tone(this.note(s + 7), 0.3, 'triangle', 0.16, i * 0.05)); },
  lift(){ this.tone(330, 0.2, 'triangle', 0.15, 0, 440); },
  deliver(){ [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(this.note(s), 0.35, 'triangle', 0.17, i * 0.05)); this.noise(0.5, 0.2, 5000, 9000, 0.7, 0.1, 'highpass'); },
  coin(){ this.tone(1318, 0.07, 'square', 0.06); this.tone(1760, 0.14, 'square', 0.06, 0.05); },
  event(){ [12, 16, 19, 24, 28].forEach((s, i) => this.tone(this.note(s), 0.25, 'sine', 0.2, i * 0.06)); },
  warn(){ this.tone(440, 0.2, 'square', 0.1); this.tone(440, 0.2, 'square', 0.1, 0.28); },
  melon(){ this.noise(0.6, 0.7, 1800, 150, 0.6); this.tone(90, 0.4, 'sine', 0.5, 0, 40); },
  star(i){ this.tone(this.note(12 + i * 5), 0.35, 'triangle', 0.25); this.tone(this.note(24 + i * 5), 0.25, 'sine', 0.1, 0.03); },
  win(){ [0, 4, 7, 12, 7, 12, 16, 24].forEach((s, i) => this.tone(this.note(s), 0.3, 'triangle', 0.2, i * 0.09)); },
  lose(){ [7, 4, 0, -5].forEach((s, i) => this.tone(this.note(s), 0.35, 'triangle', 0.18, i * 0.14)); },
  click(){ this.tone(700, 0.05, 'triangle', 0.15, 0, 900); },
  buy(){ [0, 7, 12, 19].forEach((s, i) => this.tone(this.note(s), 0.2, 'triangle', 0.2, i * 0.05)); },
  tick(){ this.tone(1000, 0.04, 'square', 0.05); },

  /* bouncy song; faster and brighter during Sugar Rush */
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
    const bpm = this.fast ? 150 : this.style === 'title' ? 100 : 118, spb = 60 / bpm / 2;
    while(this.nextT < this.ctx.currentTime + 0.2){
      const st = this.step % 64, bar = Math.floor(st / 16), ch = this.PROG[bar], beat = st % 16;
      const t = this.nextT - this.ctx.currentTime, M = this.musG, k = this.fast ? 5 : 0;
      if(beat % 4 === 0) this.tone(this.note(ch[0] + k - 24), spb * 1.6, 'triangle', 0.4, t, 0, M);
      if(beat % 4 === 2) this.tone(this.note(ch[0] + k - 12), spb * 0.6, 'triangle', 0.18, t, 0, M);
      if(this.style !== 'title' && beat % 4 === 0) this.tone(90, 0.12, 'sine', 0.35, t, 45, M);
      if(this.style !== 'title' && beat % 4 === 2) this.noise(0.06, 0.12, 3000, 6000, 1, t, 'bandpass', M);
      if(beat % 2 === 1) this.noise(0.03, 0.05, 8000, 9000, 1, t, 'highpass', M);
      const arp = [0, 1, 2, 1][beat % 4];
      if(beat % 2 === 0 || this.fast) this.tone(this.note(ch[arp] + k + (beat >= 8 ? 12 : 0)), spb * 0.8, 'sine', 0.1, t, 0, M);
      if(st % 16 === 12 && Math.random() < 0.6) this.tone(this.note(pick([12, 14, 16, 19]) + k + 12), spb * 3, 'triangle', 0.06, t, 0, M);
      this.nextT += spb; this.step++;
    }
  }
};
