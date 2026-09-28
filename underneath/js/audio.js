'use strict';
/* =====================================================================
   All audio is synthesized with Web Audio: no files.
   - a continuous scrub texture that follows brush speed and material
   - a chime that climbs the world's scale as your streak grows
   - calm generative music: soft pads and bells, a new key in every world
   ===================================================================== */
const AU = {
  ctx:null, master:null, sfx:null, mus:null, rev:null, noiseBuf:null, scrubG:null, scrubF:null,
  portalMute:false, adMuted:false, hidden:false, bi:0, ci:0, step:0, nextT:0, timer:null, last:{},

  init(){
    if(this.ctx) return;
    try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return; this.ctx = new AC(); }catch(e){ return; }
    const c = this.ctx;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 8; comp.attack.value = .003; comp.release.value = .25;
    const pre = c.createGain(); pre.gain.value = .6;
    const lim = c.createWaveShaper(), curve = new Float32Array(2048);
    for(let i = 0; i < curve.length; i++){ const x = i / (curve.length - 1) * 2 - 1; curve[i] = Math.tanh(x * 2) * .98; }
    lim.curve = curve;
    this.master = c.createGain(); this.master.connect(comp); comp.connect(pre); pre.connect(lim); lim.connect(c.destination);
    const rl = c.sampleRate * 2.4 | 0, ir = c.createBuffer(2, rl, c.sampleRate);
    for(let ch = 0; ch < 2; ch++){ const d = ir.getChannelData(ch); for(let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 2.6); }
    this.rev = c.createConvolver(); this.rev.buffer = ir; const rg = c.createGain(); rg.gain.value = .45; this.rev.connect(rg); rg.connect(this.master);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.mus = c.createGain(); this.mus.connect(this.master); const ms = c.createGain(); ms.gain.value = .6; this.mus.connect(ms); ms.connect(this.rev);
    const len = c.sampleRate * 2; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for(let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // the scrub texture runs all the time; its volume follows the brush
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    this.scrubF = c.createBiquadFilter(); this.scrubF.type = 'bandpass'; this.scrubF.frequency.value = 2400; this.scrubF.Q.value = .9;
    this.scrubG = c.createGain(); this.scrubG.gain.value = 0;
    src.connect(this.scrubF); this.scrubF.connect(this.scrubG); this.scrubG.connect(this.sfx); src.start();
    this.apply(); this.startMusic();
  },
  resume(){ try{ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }catch(e){} },
  apply(){
    if(!this.ctx) return;
    const on = !this.portalMute && !this.adMuted && !this.hidden, t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(on ? 1 : 0, t, .03);
    this.sfx.gain.setTargetAtTime(save.opt.sfx ? .6 : 0, t, .02);
    this.mus.gain.setTargetAtTime(save.opt.music ? .32 : 0, t, .05);
  },
  setPortalMute(m){ this.portalMute = m; this.apply(); },
  adMute(m){ this.adMuted = m; this.apply(); },
  setHidden(h){ this.hidden = h; this.apply(); },
  gate(k, gap){ const t = this.ctx.currentTime; if(t - (this.last[k] || -1) < gap) return false; this.last[k] = t; return true; },
  setBiome(bi){ this.bi = bi; this.ci = 0; },
  note(n){ const B = BIOMES[this.bi] || BIOMES[0], m = B.mode, o = Math.floor(n / m.length); return 440 * Math.pow(2, (B.root + m[((n % m.length) + m.length) % m.length] + o * 12 - 69) / 12); },

  tone(f, d, type, v, f2, delay, wet){
    const c = this.ctx; if(!c) return;
    const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.sfx); if(wet) g.connect(this.rev); o.start(t); o.stop(t + d + .05);
  },
  noise(d, freq, v, type, f2, delay, q, wet){
    const c = this.ctx; if(!c) return;
    const t = c.currentTime + (delay || 0), s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
    if(f2) f.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d);
    const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.sfx); if(wet) g.connect(this.rev); s.start(t, Math.random()); s.stop(t + d + .05);
  },
  bell(f, v, d, delay){ this.tone(f, d || 1.2, 'sine', v, 0, delay, 1); this.tone(f * 2.76, (d || 1.2) * .4, 'sine', v * .25, 0, delay, 1); this.tone(f * 5.4, (d || 1.2) * .2, 'sine', v * .1, 0, delay); },

  /* ---------- SFX ---------- */
  scrub(speed, layer){
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    this.scrubG.gain.setTargetAtTime(speed * .22, t, .04);
    this.scrubF.frequency.setTargetAtTime([3200, 1900, 900][layer] || 2400, t, .08);
  },
  chime(lvl){ if(!this.ctx) return; this.ci = (this.ci + 1) % 10; const f = this.note(this.ci + 5 + Math.min(6, lvl)); this.tone(f, .22, 'triangle', .05 + lvl * .006, 0, 0, 1); if(lvl >= 4) this.tone(f * 2, .14, 'sine', .03, 0, .02); },
  streakUp(lvl){ if(!this.ctx) return; [0, 2, 4].forEach((k, i) => this.tone(this.note(8 + lvl + k), .25, 'triangle', .08, 0, i * .05, 1)); },
  coin(v){ if(!this.ctx || !this.gate('coin', .03)) return; const f = 1318 + Math.random() * 60; this.tone(f, .09, 'square', .045); this.tone(f * 1.5, .22, 'triangle', .06, 0, .05, 1); },
  gem(){ if(!this.ctx) return; [0, 2, 4, 7].forEach((k, i) => this.bell(this.note(10 + k), .07, .9, i * .045)); },
  relic(){ if(!this.ctx) return; [0, 4, 7, 11].forEach((k, i) => this.bell(this.note(5 + k), .09, 1.6, i * .09)); },
  critter(shiny){ if(!this.ctx) return; this.tone(1800, .08, 'sine', .07, 2600); this.tone(2200, .1, 'sine', .06, 3000, .1); if(shiny) this.gem(); },
  catch(shiny){ if(!this.ctx) return; [0, 3, 6, 10].forEach((k, i) => this.tone(this.note(7 + k), .2, 'triangle', .09, 0, i * .05, 1)); if(shiny) this.relic(); },
  keyhole(){ if(!this.ctx) return; [0, 4, 7, 9, 12].forEach((k, i) => this.bell(this.note(3 + k), .1, 2.2, i * .08)); this.noise(1.2, 3000, .06, 'highpass', 8000, 0, 1, 1); },
  dive(){ if(!this.ctx) return; this.noise(1.4, 300, .4, 'bandpass', 5000, 0, 1.5, 1); this.tone(80, 1.4, 'sine', .3, 600); [0, 4, 7, 12, 16].forEach((k, i) => this.bell(this.note(k + 7), .08, 1.8, .7 + i * .06)); },
  secret(){ if(!this.ctx) return; [0, 4, 7, 11, 14, 18].forEach((k, i) => this.bell(this.note(k + 4), .1, 2.4, i * .1)); this.tone(110, 2, 'sine', .15, 0, 0, 1); },
  master(){ if(!this.ctx) return; for(let i = 0; i < 12; i++) this.bell(this.note(i + 2), .08, 1.4, i * .07); },
  glyph(n){ if(!this.ctx) return; this.bell(this.note(4 + n * 2), .12, 1.4); this.noise(.2, 500, .15, 'lowpass', 200); },
  knock(n){ if(!this.ctx) return; this.tone(180 - n * 10, .12, 'sine', .35, 90); this.noise(.06, 1200, .2, 'bandpass', 0, 0, 2); },
  deny(){ if(!this.ctx) return; this.tone(200, .18, 'square', .06, 130); },
  ui(){ if(!this.ctx) return; this.tone(880, .05, 'triangle', .06, 1200); },
  buy(){ if(!this.ctx) return; [0, 2, 4].forEach((k, i) => this.tone(this.note(9 + k), .16, 'triangle', .08, 0, i * .04, 1)); },
  ping(){ if(!this.ctx) return; this.tone(1560, .9, 'sine', .07, 1480, 0, 1); },
  eye(){ if(!this.ctx) return; this.tone(220, 1.2, 'sine', .08, 330, 0, 1); this.bell(880, .05, 1.2, .2); },
  gold(){ if(!this.ctx) return; for(let i = 0; i < 8; i++) this.bell(this.note(i * 2 + 6), .07, 1, i * .05); },
  whirl(){ if(!this.ctx) return; this.noise(1.5, 400, .35, 'bandpass', 3000, 0, 3, 1); this.tone(200, 1.4, 'sine', .08, 700); },
  thunder(){ if(!this.ctx) return; this.noise(.2, 5000, .5, 'highpass', 1500); this.noise(1.6, 500, .5, 'lowpass', 60, .05, 1, 1); this.tone(60, 1, 'sine', .3, 30, .05); },
  drill(){ if(!this.ctx) return; this.noise(.6, 180, .5, 'lowpass', 60); this.tone(90, .5, 'sawtooth', .1, 50); },
  rain(){ if(!this.ctx) return; this.noise(3, 4000, .2, 'highpass', 2000, 0, 1, 1); this.bell(this.note(12), .08, 2); },
  blast(){ if(!this.ctx) return; this.noise(.8, 900, .7, 'lowpass', 60, 0, 1, 1); this.tone(90, .6, 'sine', .5, 30); },
  ready(){ if(!this.ctx) return; this.tone(this.note(12), .15, 'triangle', .06); this.tone(this.note(14), .2, 'triangle', .06, 0, .08); },

  /* ---------- generative music ---------- */
  startMusic(){ if(!this.ctx || this.timer) return; this.nextT = this.ctx.currentTime + .2; this.step = 0; this.timer = setInterval(() => this.sched(), 40); },
  pad(f, t, d, v){
    const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
    o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f * 1.004;
    fl.type = 'lowpass'; fl.frequency.value = 1400;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + d * .35); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(this.mus); o.start(t); o2.start(t); o.stop(t + d + .1); o2.stop(t + d + .1);
  },
  mbell(f, t, v){ const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + 1.6); o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + 1.7); },
  sched(){
    const c = this.ctx; if(!c || c.state !== 'running'){ if(c) this.nextT = c.currentTime + .1; return; }
    const sp = 60 / 76 / 2;
    while(this.nextT < c.currentTime + .25){
      const st = this.step, t = this.nextT, bar = (st / 8 | 0) % 4;
      const roots = [0, 3, 1, 4][bar];
      if(st % 8 === 0){ [0, 2, 4].forEach(k => this.pad(this.note(roots + k) / 2, t, sp * 8.5, .05)); this.pad(this.note(roots) / 4, t, sp * 8.5, .06); }
      const pat = [1, 0, .5, 0, .8, 0, .4, .3];
      if(Math.random() < pat[st % 8] * .8) this.mbell(this.note(roots + 5 + ((Math.random() * 6) | 0)), t, .045);
      this.nextT += sp; this.step++;
    }
  },
};
