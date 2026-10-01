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
  flip(){ this.tone(140, 0.06, 'square', 0.12, 0, 90); this.noise(0.05, 0.25, 2500, 900, 1.2); },
  bump(k){ const f = this.note(this.PENTA[k % this.PENTA.length]); this.tone(f, 0.16, 'square', 0.12); this.tone(f * 2, 0.12, 'triangle', 0.12, 0.01); this.noise(0.05, 0.2, 5000, 2000, 2); },
  sling(){ this.tone(320, 0.1, 'square', 0.12, 0, 640); this.noise(0.06, 0.25, 3000, 1200, 1.5); },
  wall(v){ if(v > 300) this.tone(110, 0.05, 'sine', Math.min(0.2, v / 6000), 0, 80); },
  hit(k, crit){ const f = this.note(this.PENTA[(k + 3) % this.PENTA.length] - 12); this.tone(f, 0.12, 'sawtooth', 0.12, 0, f * 0.6); this.noise(0.1, 0.35, 1800, 300, 1); if(crit){ this.tone(f * 4, 0.25, 'square', 0.1, 0.02, f * 6); } },
  shield(){ this.tone(900, 0.08, 'square', 0.08, 0, 1200); this.tone(1400, 0.1, 'sine', 0.08, 0.02); },
  kill(){ this.noise(0.35, 0.5, 2500, 200, 0.7); [0, 7, 12].forEach((s, i) => this.tone(this.note(s), 0.2, 'triangle', 0.16, i * 0.04)); },
  boom(){ this.noise(0.6, 0.7, 1600, 80, 0.6); this.tone(80, 0.5, 'sine', 0.5, 0, 35); },
  coin(){ this.tone(1318, 0.06, 'square', 0.05); this.tone(1760, 0.12, 'square', 0.05, 0.05); },
  lane(k){ this.tone(this.note(7 + k * 5), 0.15, 'triangle', 0.18); },
  mult(){ [0, 4, 7, 12, 16].forEach((s, i) => this.tone(this.note(s + 12), 0.2, 'square', 0.08, i * 0.05)); },
  target(){ this.tone(600, 0.1, 'square', 0.1, 0, 400); },
  jackpot(){ [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(this.note(s), 0.22, 'square', 0.1, i * 0.06)); this.noise(0.8, 0.2, 5000, 9000, 0.7, 0, 'highpass'); },
  zap(){ this.noise(0.4, 0.45, 6000, 400, 4); this.tone(1200, 0.3, 'sawtooth', 0.12, 0, 100); },
  launch(){ this.noise(0.4, 0.35, 400, 3000, 1.2); this.tone(200, 0.35, 'triangle', 0.15, 0, 800); },
  drain(){ [7, 4, 0, -5].forEach((s, i) => this.tone(this.note(s - 5), 0.25, 'triangle', 0.18, i * 0.1)); },
  save(){ [12, 19, 24].forEach((s, i) => this.tone(this.note(s), 0.25, 'sine', 0.2, i * 0.06)); },
  clear(){ [0, 4, 7, 12, 16, 19, 24, 28].forEach((s, i) => this.tone(this.note(s), 0.35, 'triangle', 0.17, i * 0.06)); this.noise(0.9, 0.2, 4000, 9000, 0.7, 0.1, 'highpass'); },
  card(){ [0, 7, 12, 16].forEach((s, i) => this.tone(this.note(s + 7), 0.22, 'triangle', 0.18, i * 0.05)); },
  bossIn(){ this.tone(55, 1.2, 'sawtooth', 0.25, 0, 40); this.tone(82, 1.2, 'sawtooth', 0.18, 0.1, 60); this.noise(1.2, 0.3, 300, 80, 0.8); },
  multi(){ [12, 16, 19, 24, 28].forEach((s, i) => this.tone(this.note(s), 0.2, 'square', 0.08, i * 0.04)); },
  over(){ [7, 4, 0, -5, -8].forEach((s, i) => this.tone(this.note(s), 0.35, 'triangle', 0.18, i * 0.13)); },
  click(){ this.tone(700, 0.05, 'triangle', 0.15, 0, 900); },
  buy(){ [0, 7, 12, 19].forEach((s, i) => this.tone(this.note(s), 0.2, 'triangle', 0.2, i * 0.05)); },
  lose1(){ this.tone(300, 0.15, 'triangle', 0.12, 0, 200); },

  /* bouncy song; faster and brighter during Sugar Rush */
  PROG: [[0, 3, 7, 10], [-4, 0, 3, 7], [-2, 2, 5, 9], [-5, -1, 2, 7]],
  setStyle(s){ this.style = s; },
  startMusic(){
    if(!this.ctx) return;
    this.nextT = this.ctx.currentTime + 0.1;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.sched(), 50);
  },
  sched(){
    if(!this.ctx || this.ctx.state !== 'running') return;
    const bpm = this.fast ? 150 : this.style === 'title' ? 96 : 124, spb = 60 / bpm / 2;
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
