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
  shot(id){
    if(!this.ok('shot', 0.03)) return;
    if(id === 'shotgun'){ this.noise(0.25, 0.5, 2400, 200, 0.7); this.tone(120, 0.2, 'square', 0.12, 0, 50); }
    else if(id === 'smg'){ this.noise(0.06, 0.25, 4000, 1500, 1.2); this.tone(500, 0.04, 'square', 0.05, 0, 300); }
    else if(id === 'rocket'){ this.noise(0.4, 0.35, 600, 2500, 1); this.tone(160, 0.35, 'sawtooth', 0.1, 0, 420); }
    else if(id === 'laser'){ this.tone(1800, 0.14, 'square', 0.07, 0, 300); this.tone(900, 0.14, 'sawtooth', 0.04, 0, 150); }
    else if(id === 'party'){ this.tone(660, 0.1, 'triangle', 0.12, 0, 1320); this.noise(0.1, 0.2, 5000, 2000, 1); }
    else { this.noise(0.11, 0.35, 3200, 700, 1); this.tone(300, 0.09, 'square', 0.08, 0, 120); }
  },
  land(){ if(!this.ok('land', 0.08)) return; this.noise(0.07, 0.15, 900, 300, 1); },
  reload(){ if(!this.ok('reload', 0.25)) return; this.tone(1200, 0.04, 'square', 0.05); this.tone(1600, 0.05, 'square', 0.05, 0.05); },
  splash(){ if(!this.ok('splash', 0.15)) return; this.noise(0.35, 0.35, 1800, 300, 0.7); this.tone(200, 0.25, 'sine', 0.2, 0, 600); },
  hit(){ if(!this.ok('hit', 0.03)) return; const f = 500 + Math.random() * 200; this.tone(f, 0.06, 'square', 0.06, 0, f * 0.5); },
  pew(){ if(!this.ok('pew', 0.08)) return; this.tone(900, 0.1, 'triangle', 0.06, 0, 400); },
  stomp(){ this.tone(180, 0.15, 'square', 0.15, 0, 520); this.noise(0.12, 0.3, 1500, 400, 1); },
  boom(k){ if(!this.ok('boom', 0.05)) return; k = k || 1; this.noise(0.5 * k, Math.min(0.8, 0.45 * k), 2400, 80, 0.6); this.tone(100, 0.4 * k, 'sine', 0.35, 0, 35); },
  clank(){ if(!this.ok('clank', 0.07)) return; this.tone(1700, 0.1, 'square', 0.06, 0, 1100); },
  coin(){ if(!this.ok('coin', 0.035)) return; this.tone(1318, 0.06, 'square', 0.04); this.tone(1976, 0.1, 'square', 0.04, 0.04); },
  combo(n){ [0, 4, 7, 12].slice(0, Math.min(4, n - 1)).forEach((s, i) => this.tone(this.note(s + n), 0.15, 'square', 0.07, i * 0.05)); },
  ouch(){ if(!this.ok('ouch', 0.2)) return; this.tone(240, 0.2, 'sawtooth', 0.12, 0, 90); },
  heal(){ [12, 16, 19].forEach((s, i) => this.tone(this.note(s), 0.2, 'sine', 0.12, i * 0.05)); },
  horn(){ this.tone(196, 0.6, 'sawtooth', 0.12); this.tone(147, 0.8, 'sawtooth', 0.1, 0.15); this.tone(65, 0.9, 'square', 0.1, 0, 50); },
  clear(){ [0, 4, 7, 12, 16].forEach((s, i) => this.tone(this.note(s + 2), 0.22, 'square', 0.09, i * 0.07)); },
  pickCard(){ [0, 7, 12].forEach((s, i) => this.tone(this.note(s + 12), 0.2, 'square', 0.08, i * 0.04)); },
  ko(){ [12, 7, 3, 0].forEach((s, i) => this.tone(this.note(s), 0.2, 'square', 0.1, i * 0.08)); },
  win(){ [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(this.note(s), 0.3, 'square', 0.1, i * 0.09)); },
  over(){ [7, 3, 0, -5, -12].forEach((s, i) => this.tone(this.note(s), 0.35, 'triangle', 0.12, i * 0.14)); },
  click(){ this.tone(700, 0.05, 'triangle', 0.15, 0, 900); },
  buy(){ [0, 7, 12, 19].forEach((s, i) => this.tone(this.note(s), 0.2, 'square', 0.1, i * 0.05)); },
  lose1(){ this.tone(300, 0.15, 'triangle', 0.12, 0, 200); },

  /* bouncy chiptune: bass, arps and a little drum kit */
  PROG: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]],
  setStyle(s){ this.style = s; },
  startMusic(){
    if(!this.ctx) return;
    this.nextT = this.ctx.currentTime + 0.1;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.sched(), 50);
  },
  sched(){
    if(!this.ctx || this.ctx.state !== 'running') return;
    const bpm = this.style === 'title' ? 110 : 132, spb = 60 / bpm / 2;
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
