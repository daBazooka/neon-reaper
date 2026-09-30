'use strict';
/* All sound is synthesized with WebAudio: no audio files to download.
   The master bus is silenced while an ad plays, while the tab is hidden,
   and when the player turns sound off. */
const AU = {
  ctx: null, master: null, sfxG: null, musG: null, started: false,
  adMuted: false, hidden: false, whirr: null, world: 0, step: 0, nextT: 0, timer: 0,

  init(){
    if(this.ctx) return;
    try{
      const C = window.AudioContext || window.webkitAudioContext;
      this.ctx = new C();
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      const comp = this.ctx.createDynamicsCompressor(); comp.connect(this.master);
      this.sfxG = this.ctx.createGain(); this.sfxG.connect(comp);
      this.musG = this.ctx.createGain(); this.musG.connect(comp);
      this.apply();
    }catch(e){ this.ctx = null; }
  },
  unlock(){
    this.init();
    if(!this.ctx) return;
    if(this.ctx.state === 'suspended' && !this.adMuted) this.ctx.resume().catch(() => {});
    if(!this.started){ this.started = true; this.startMusic(); }
  },
  apply(){
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.adMuted || this.hidden ? 0 : 1, t, 0.02);
    this.sfxG.gain.setTargetAtTime(S.sfx ? 0.9 : 0, t, 0.02);
    this.musG.gain.setTargetAtTime(S.music ? 0.28 : 0, t, 0.05);
  },
  adMute(on){
    this.adMuted = on; this.apply();
    if(!this.ctx) return;
    if(on) this.ctx.suspend().catch(() => {});
    else if(!this.hidden) this.ctx.resume().catch(() => {});
  },
  setHidden(h){
    this.hidden = h; this.apply();
    if(!this.ctx) return;
    if(h) this.ctx.suspend().catch(() => {});
    else if(!this.adMuted) this.ctx.resume().catch(() => {});
  },

  tone(f, dur, type = 'sine', vol = 0.3, delay = 0, slide = 0, dest){
    if(!this.ctx) return;
    const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxG); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, f0, f1, q = 1, delay = 0, type = 'bandpass', dest){
    if(!this.ctx) return;
    const t = this.ctx.currentTime + delay, n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
    for(let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = this.ctx.createBufferSource(), fl = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = buf; fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || this.sfxG); s.start(t);
  },

  PENTA: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24],
  note(semi){ return 523.25 * Math.pow(2, semi / 12); },

  throw(pow){ this.noise(0.28, 0.5, 600, 2400 + pow * 1500, 2); this.tone(260, 0.18, 'triangle', 0.12, 0, 520); },
  gem(k){
    const f = this.note(this.PENTA[Math.min(this.PENTA.length - 1, k)]);
    this.tone(f, 0.35, 'triangle', 0.3); this.tone(f * 2, 0.25, 'sine', 0.12, 0.03); this.tone(f * 1.5, 0.3, 'sine', 0.08, 0.06);
  },
  last(){ [0, 4, 7, 12].forEach((s, i) => this.tone(this.note(s + 12), 0.5, 'triangle', 0.22, i * 0.06)); this.noise(0.6, 0.2, 3000, 9000, 0.7, 0, 'highpass'); },
  star(){ [12, 16, 19, 24].forEach((s, i) => this.tone(this.note(s), 0.4, 'sine', 0.25, i * 0.05)); },
  edge(){ this.tone(180, 0.1, 'square', 0.1, 0, 120); this.noise(0.06, 0.25, 1500, 600, 1.5); },
  wall(){ this.tone(140, 0.14, 'triangle', 0.35, 0, 90); this.noise(0.08, 0.35, 900, 300, 1); },
  bump(){ this.tone(220, 0.3, 'sine', 0.4, 0, 660); this.tone(330, 0.2, 'triangle', 0.1, 0.02, 880); },
  warp(){ this.tone(900, 0.35, 'sine', 0.25, 0, 180); this.tone(300, 0.35, 'sine', 0.2, 0.12, 1200); },
  near(){ this.noise(0.2, 0.25, 4000, 1200, 3); },
  die(){ this.noise(0.45, 0.6, 2400, 200, 0.8); this.tone(300, 0.4, 'sawtooth', 0.12, 0, 60); },
  miss(){ this.tone(440, 0.18, 'triangle', 0.18, 0, 330); this.tone(330, 0.25, 'triangle', 0.18, 0.15, 247); },
  catch(){ this.tone(120, 0.12, 'sine', 0.5, 0, 60); this.noise(0.06, 0.4, 2500, 800, 1); },
  clear(){ [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(this.note(s), 0.5, 'triangle', 0.2, i * 0.07)); },
  starPop(i){ this.tone(this.note(12 + i * 4), 0.3, 'sine', 0.3); this.tone(this.note(24 + i * 4), 0.2, 'triangle', 0.1, 0.02); },
  coin(){ this.tone(1318, 0.08, 'square', 0.08); this.tone(1760, 0.16, 'square', 0.08, 0.06); },
  click(){ this.tone(660, 0.06, 'triangle', 0.18, 0, 880); },
  buy(){ [0, 7, 12].forEach((s, i) => this.tone(this.note(s), 0.25, 'triangle', 0.22, i * 0.05)); },
  aimTick(p){ this.tone(300 + p * 500, 0.03, 'sine', 0.05); },

  /* the spinning "whirr" while the boomerang flies */
  whirrStart(){
    if(!this.ctx || this.whirr) return;
    const o = this.ctx.createOscillator(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = 90;
    lfo.frequency.value = 16; lg.gain.value = 0.05;
    f.type = 'lowpass'; f.frequency.value = 700;
    g.gain.value = 0.05;
    lfo.connect(lg); lg.connect(g.gain);
    o.connect(f); f.connect(g); g.connect(this.sfxG);
    o.start(); lfo.start();
    this.whirr = { o, lfo, g, f };
  },
  whirrSet(speed, hold){
    if(!this.whirr) return;
    const t = this.ctx.currentTime;
    this.whirr.lfo.frequency.setTargetAtTime(10 + speed / 70, t, 0.05);
    this.whirr.o.frequency.setTargetAtTime(hold ? 130 : 90, t, 0.05);
    this.whirr.f.frequency.setTargetAtTime(hold ? 1300 : 700, t, 0.05);
  },
  whirrStop(){
    if(!this.whirr) return;
    const w = this.whirr; this.whirr = null;
    try{ w.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03); w.o.stop(this.ctx.currentTime + 0.2); w.lfo.stop(this.ctx.currentTime + 0.2); }catch(e){}
  },

  /* a small bouncy song, one key per world */
  KEYS: [0, -3, 2, -5, -2, -4, 3, -1],
  PROG: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]],
  setWorld(w){ this.world = w; },
  startMusic(){
    if(!this.ctx) return;
    this.nextT = this.ctx.currentTime + 0.1;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.sched(), 60);
  },
  sched(){
    if(!this.ctx || this.ctx.state !== 'running') return;
    const spb = 60 / 112 / 2;
    while(this.nextT < this.ctx.currentTime + 0.2){
      const st = this.step % 64, bar = Math.floor(st / 16), k = this.KEYS[this.world] || 0, ch = this.PROG[bar];
      const t = this.nextT - this.ctx.currentTime, beat = st % 16;
      if(beat % 4 === 0) this.tone(this.note(ch[0] + k - 24), spb * 1.8, 'triangle', 0.35, t, 0, this.musG);
      if(beat === 6 || beat === 14) this.tone(this.note(ch[0] + k - 17), spb * 0.9, 'triangle', 0.2, t, 0, this.musG);
      if(beat % 2 === 0){
        const arp = [0, 1, 2, 1, 2, 0, 1, 2][(beat / 2) % 8];
        this.tone(this.note(ch[arp] + k), spb * 0.9, 'sine', 0.12, t, 0, this.musG);
      }
      if(beat % 4 === 2) this.noise(0.05, 0.05, 7000, 9000, 1, t, 'highpass', this.musG);
      if((st === 12 || st === 44) && Math.random() < 0.7){
        const m = [7, 9, 12, 14][Math.floor(Math.random() * 4)];
        this.tone(this.note(m + k + 12), spb * 3, 'sine', 0.07, t, 0, this.musG);
      }
      this.nextT += spb; this.step++;
    }
  }
};
