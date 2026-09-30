'use strict';
/* =====================================================================
   KALEIDREAM audio: everything is synthesized. The music changes its
   style with every dream mode, collect sounds climb a scale with the
   combo, and every twist has its own sting.
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, rev:null, noiseBuf:null, lp:null,
  portalMute:false, adMuted:false, hidden:false, last:{}, step:0, nextT:0, timer:null, key:60, style:'title', twistId:'',
  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 8; comp.ratio.value = 6; comp.attack.value = .003; comp.release.value = .2;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(c.destination);
    const rl = c.sampleRate * 1.8 | 0, ir = c.createBuffer(2, rl, c.sampleRate);
    for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 2.5); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; const rg = c.createGain(); rg.gain.value = .35; this.rev.connect(rg); rg.connect(this.master);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.lp = c.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 18000;
    this.mus = c.createGain(); this.mus.connect(this.lp); this.lp.connect(this.master); this.mus.connect(this.rev);
    const len = c.sampleRate, nb = c.createBuffer(1, len, c.sampleRate), d = nb.getChannelData(0); for(let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; this.noiseBuf = nb;
    this.apply(); this.startMusic();
  },
  resume(){ try{ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }catch(e){} },
  apply(){
    if(!this.ctx) return;
    const on = !this.portalMute && !this.adMuted && !this.hidden, t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(on ? 1 : 0, t, .03);
    this.sfx.gain.setTargetAtTime(save.opt.sfx ? .55 : 0, t, .02);
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
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.sfx); if(wet) g.connect(this.rev); o.start(t); o.stop(t + d + .05);
  },
  noise(d, freq, v, type, f2, delay, q){
    const c = this.ctx; if(!c) return;
    const t = c.currentTime + (delay || 0), s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(freq, t); if(f2) f.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d); f.Q.value = q || 1;
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.sfx); s.start(t, Math.random() * .5); s.stop(t + d + .05);
  },
  arp(steps, gap, type, v, base, d){ steps.forEach((s, i) => this.tone(this.mf((base || this.key + 12) + s), d || .3, type || 'triangle', v || .06, 0, i * (gap || .05), 1)); },
  SC:[0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36],

  /* ---------- sfx ---------- */
  collect(combo, k, how){ if(!this.ctx || !this.gate('col', .03)) return; const m = this.key + 12 + this.SC[Math.min(15, combo % 16)] + (combo >= 16 ? 12 : 0); if(k === 'bld'){ this.noise(.15, 1500, .12, 'lowpass', 200); } this.tone(this.mf(m), .16, how === 'perfect' ? 'square' : 'triangle', .07, 0, 0, 1); this.tone(this.mf(m + 7), .1, 'sine', .04, 0, .02); },
  flap(){ if(!this.ctx) return; this.noise(.12, 900, .06, 'bandpass', 2400, 0, 2); this.tone(420, .1, 'sine', .03, 680); },
  jump(n){ if(!this.ctx) return; this.tone(n > 1 ? 520 : 330, .16, 'square', .04, n > 1 ? 1040 : 700); },
  swap(r){ if(!this.ctx) return; this.tone(r ? 440 : 660, .12, 'sine', .07, r ? 330 : 880); this.noise(.1, 3000, .04, 'highpass'); },
  boing(){ if(!this.ctx || !this.gate('boing', .2)) return; this.tone(180, .25, 'sine', .08, 420); },
  smash(){ if(!this.ctx || !this.gate('sm', .04)) return; this.noise(.22, 900, .18, 'lowpass', 120); this.tone(120, .18, 'square', .05, 50); },
  paint(){ if(!this.ctx) return; this.tone(this.mf(this.key + 24 + pick([0, 4, 7, 11, 14])), .3, 'sine', .07, 0, 0, 1); this.noise(.15, 4000, .05, 'bandpass', 8000, 0, 3); },
  eat(r){ if(!this.ctx || !this.gate('eat', .04)) return; this.tone(300 - Math.min(200, r * 20), .12, 'square', .05, 700); },
  miss(){ if(!this.ctx) return; this.tone(200, .1, 'triangle', .04, 150); },
  tick(bad){ if(!this.ctx) return; if(bad){ this.tone(120, .15, 'sawtooth', .04, 80); return; } this.tone(100, .12, 'sine', .14, 40); this.noise(.04, 6000, .04, 'highpass'); },
  ice(){ if(!this.ctx) return; this.tone(2400, .2, 'sine', .05, 1200); this.noise(.2, 6000, .08, 'highpass'); },
  hit(){ if(!this.ctx) return; this.tone(300, .4, 'sawtooth', .09, 70); this.noise(.3, 800, .2, 'lowpass', 100); },
  shield(){ if(!this.ctx) return; this.tone(900, .3, 'sine', .08, 1800, 0, 1); },
  heart(){ if(!this.ctx) return; this.arp([0, 4, 7, 12], .06, 'sine', .07, this.key + 24); },
  gift(){ if(!this.ctx) return; this.arp([0, 7, 12], .05, 'triangle', .06, this.key + 24); },
  shift(){ if(!this.ctx) return; this.noise(1, 400, .14, 'bandpass', 6000, 0, 2); for(let i = 0; i < 8; i++) this.tone(this.mf(this.key + 12 + this.SC[i]), .25, 'triangle', .04, 0, i * .06, 1); this.tone(80, .8, 'sine', .12, 40); },
  twist(id){
    if(!this.ctx) return; this.twistId = id;
    this.noise(.4, 2000, .1, 'bandpass', 200, 0, 4);
    const mood = { slowmo:[12, 7, 0, -5], flip:[0, 6, 0, 6], mirror:[0, 6, 12, 6], ghost:[0, 3, 7, 10], dark:[0, -2, -5], portal:[0, 5, 10, 15, 20, 25] }[id] || [0, 4, 7, 12, 16];
    this.arp(mood, .07, id === 'dark' || id === 'ghost' ? 'sine' : 'square', .045, this.key + 24);
    this.lp.frequency.setTargetAtTime(id === 'slowmo' || id === 'dark' ? 900 : 18000, this.ctx.currentTime, .2);
  },
  milestone(i){ if(!this.ctx) return; this.arp([0, 4, 7, 12, 16, 19, 24].slice(0, 4 + Math.min(3, i)), .05, 'square', .05, this.key + 12 + i); this.noise(.6, 8000, .06, 'highpass', 12000); },
  jackSpin(){ if(!this.ctx) return; for(let i = 0; i < 20; i++) this.tone(this.mf(this.key + 24 + (i % 4) * 2), .05, 'square', .025, 0, i * .09); },
  reelStop(i){ if(!this.ctx) return; this.tone(this.mf(this.key + 19 + i * 5), .15, 'square', .06); this.noise(.06, 3000, .08, 'bandpass', 1500, 0, 3); },
  jackWin(big){ if(!this.ctx) return; if(big === 2){ for(let k = 0; k < 3; k++) this.arp([0, 4, 7, 12, 16, 19, 24], .045, 'square', .05, this.key + 12 + k * 5, .3); } else if(big) this.arp([0, 4, 7, 12], .06, 'triangle', .06, this.key + 24); else this.arp([7, 4, 0], .1, 'triangle', .05, this.key + 12); },
  portal(){ if(!this.ctx) return; this.tone(200, 1.8, 'sawtooth', .05, 1600, 0, 1); this.noise(1.8, 300, .1, 'bandpass', 4000, 0, 3); },
  boss(){ if(!this.ctx) return; this.tone(90, 1.4, 'sawtooth', .12, 45); this.noise(1.2, 300, .25, 'lowpass', 80); this.arp([0, 1, 0, -1], .15, 'sawtooth', .05, this.key - 12, .4); },
  bossHit(){ if(!this.ctx || !this.gate('bh', .04)) return; this.tone(160, .12, 'square', .06, 90); this.noise(.1, 2500, .08, 'bandpass', 900, 0, 2); },
  bossDie(){ if(!this.ctx) return; this.noise(1.4, 2000, .3, 'lowpass', 60); for(let k = 0; k < 4; k++) this.arp([0, 4, 7, 12, 16, 19], .05, 'triangle', .07, this.key + 12 + k * 4, .5); },
  clear(){ if(!this.ctx) return; this.arp([0, 4, 7, 12, 7, 12, 16, 19, 24], .09, 'square', .06, this.key + 12, .45); },
  over(){ if(!this.ctx) return; this.arp([12, 7, 4, 0, -5], .16, 'triangle', .07, this.key + 12, .6); this.tone(300, 1.4, 'sine', .06, 100); },
  open(r){ if(!this.ctx) return; this.noise(.4, 600, .2, 'lowpass', 4000); const n = { C:3, R:4, E:6, L:9 }[r]; this.arp([0, 4, 7, 12, 16, 19, 24, 28, 31].slice(0, n), .07, r === 'L' ? 'square' : 'triangle', .07, this.key + 12, .6); },
  shake(){ if(!this.ctx) return; this.noise(.08, 1200, .06, 'bandpass', 600, 0, 3); },
  buy(){ if(!this.ctx) return; this.arp([0, 7, 12], .04, 'triangle', .07, this.key + 12, .15); },
  ui(){ if(!this.ctx) return; this.tone(this.mf(this.key + 24), .06, 'triangle', .05); },
  claim(){ if(!this.ctx) return; this.arp([0, 4, 7, 12], .06, 'square', .04, this.key + 24, .4); },

  /* ---------- music: each dream mode has its own groove ---------- */
  STYLES:{
    title:{ bpm:92,  prog:[[0, 4, 7, 11], [5, 9, 12, 16], [-3, 0, 4, 7], [2, 5, 9, 12]], arp:'sine',     kick:0, hat:0, bass:'sine' },
    fly:  { bpm:118, prog:[[0, 4, 7], [5, 9, 12], [-3, 0, 4], [7, 11, 14]],             arp:'triangle', kick:1, hat:1, bass:'triangle' },
    dodge:{ bpm:128, prog:[[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -2, 2]],             arp:'square',   kick:1, hat:2, bass:'sawtooth' },
    run:  { bpm:136, prog:[[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]],            arp:'square',   kick:2, hat:1, bass:'square' },
    orbit:{ bpm:100, prog:[[0, 7, 14], [3, 10, 17], [5, 12, 19], [-2, 5, 12]],          arp:'sine',     kick:0, hat:1, bass:'sine' },
    smash:{ bpm:150, prog:[[0, 3, 7], [0, 3, 7], [5, 8, 12], [3, 7, 10]],               arp:'sawtooth', kick:2, hat:2, bass:'sawtooth' },
    dive: { bpm:124, prog:[[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-5, -1, 2]],             arp:'triangle', kick:1, hat:2, bass:'triangle' },
    beat: { bpm:120, prog:[[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]],             arp:'square',   kick:3, hat:2, bass:'square' },
    paint:{ bpm:96,  prog:[[0, 4, 7, 11], [2, 5, 9, 12], [4, 7, 11, 14], [5, 9, 12, 16]], arp:'sine',   kick:0, hat:1, bass:'sine' },
    grow: { bpm:112, prog:[[0, 5, 7], [2, 7, 9], [-2, 3, 5], [0, 5, 7]],                arp:'triangle', kick:1, hat:1, bass:'square' },
  },
  setMode(m){ this.style = m; this.key = [60, 62, 57, 64, 59, 61, 58, 63, 56][MODE_IDS.indexOf(m)] || 60; if(this.ctx) this.lp.frequency.setTargetAtTime(18000, this.ctx.currentTime, .1); },
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .1; this.step = 0; this.timer = setInterval(() => this.sched(), 30); },
  mt(f, t, d, type, v, cut){
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (d > 1 ? .2 : .008)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    if(cut){ const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(cut, t); o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(this.mus); o.start(t); o.stop(t + d + .05);
  },
  drum(t, kind, v){
    const c = this.ctx;
    if(kind === 'k'){ const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + .12); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .2); o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + .22); return; }
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; const f = c.createBiquadFilter(); f.type = kind === 'h' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'h' ? 8000 : 1800; const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + (kind === 'h' ? .04 : .14)); s.connect(f); f.connect(g); g.connect(this.mus); s.start(t, Math.random() * .5); s.stop(t + .16);
  },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .05; return; }
    const S = this.STYLES[this.style] || this.STYLES.title;
    const slow = this.twistId === 'slowmo' && G.twist ? .6 : 1, sp = 60 / S.bpm / 2 / slow;
    while(this.nextT < c.currentTime + .15){
      const st = this.step, t = this.nextT, s8 = st % 8, bar = (st / 8 | 0) % 4, ch = S.prog[bar], r = this.key - 12;
      if(s8 === 0){ ch.forEach(k => this.mt(this.mf(r + 12 + k), t, sp * 8.3, 'sine', .018)); }
      if(s8 % 2 === 0) this.mt(this.mf(r - 12 + ch[0] + (s8 === 6 ? 7 : 0)), t, sp * 1.6, S.bass, .06, 700);
      const ar = [0, 1, 2, 1, 0, 2, 1, 2][s8], n = ch[ar % ch.length] + (s8 >= 4 ? 12 : 0);
      this.mt(this.mf(r + 24 + n), t, sp * 1.4, S.arp, .022, 3000);
      if(S.kick && (s8 % 4 === 0 || (S.kick >= 2 && s8 === 6) || (S.kick >= 3 && s8 % 2 === 0))) this.drum(t, 'k', .22);
      if(S.hat && (S.hat >= 2 || s8 % 2 === 1)) this.drum(t, 'h', .03 + (s8 % 2) * .02);
      if(S.kick && s8 === 4) this.drum(t, 's', .07);
      if(this.twistId === 'disco' && G.twist && s8 % 2 === 1) this.drum(t, 'h', .06);
      if(Math.random() < .05) this.mt(this.mf(r + 36 + pick([0, 4, 7, 12])), t, .15, 'sine', .012);
      this.nextT += sp; this.step++;
    }
  },
};
