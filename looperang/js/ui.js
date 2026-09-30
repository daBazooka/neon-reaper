'use strict';
/* DOM overlays: HUD, level clear, menu, level select, customize. */
const $ = id => document.getElementById(id);
const UI = {
  lowFx: false, tipTimer: 0, lvTab: 0, shTab: 'rang',

  init(){
    this.lowFx = (navigator.hardwareConcurrency || 4) <= 2;
    const tap = (id, fn) => $(id).addEventListener('click', e => { if(SDK.adBusy) return; AU.unlock(); AU.click(); fn(e); });
    tap('menuBtn', () => this.togglePause());
    tap('restartBtn', () => restartLevel());
    tap('hintBtn', () => this.askHint());
    tap('skipBtn', () => this.askSkip());
    tap('clNext', () => this.closeClear(() => nextLevel()));
    tap('clReplay', () => this.closeClear(() => { const n = G.daily ? null : G.n; irisOut(() => SDK.commercial(() => { n ? startLevel(n) : startLevel(0, { daily: true }); irisIn(); })); }));
    tap('clDouble', () => this.doubleCoins());
    tap('mResume', () => this.togglePause());
    tap('mLevels', () => this.openLevels());
    tap('mShop', () => this.openShop());
    tap('mDaily', () => this.playDaily());
    tap('tSfx', () => { S.sfx = S.sfx ? 0 : 1; persist(); AU.apply(); this.syncToggles(); });
    tap('tMus', () => { S.music = S.music ? 0 : 1; persist(); AU.apply(); this.syncToggles(); });
    document.querySelectorAll('.back').forEach(b => b.addEventListener('click', () => { AU.click(); this.hide(b.closest('.screen').id); this.show('menu'); }));
    document.querySelectorAll('#shop .tabs button').forEach(b => b.addEventListener('click', () => {
      AU.click(); this.shTab = b.dataset.tab;
      document.querySelectorAll('#shop .tabs button').forEach(x => x.classList.toggle('on', x === b));
      this.renderShop();
    }));
    // clicks on overlays never leak into the game
    document.querySelectorAll('.screen, #hud button').forEach(el => el.addEventListener('pointerdown', e => e.stopPropagation()));
    setTimeout(() => { if(G.st === 'intro') $('logo').classList.remove('hidden'); }, 1000);
    this.syncToggles();
  },
  show(id){ $(id).classList.remove('hidden'); },
  hide(id){ $(id).classList.add('hidden'); },
  modalOpen(){ return ['clear', 'menu', 'levels', 'shop'].some(id => !$(id).classList.contains('hidden')); },
  showHud(on){ $('hud').classList.toggle('hidden', !on); if(on) this.hide('logo'); },
  toast(txt){ const d = document.createElement('div'); d.className = 'toast'; d.textContent = txt; $('toasts').appendChild(d); setTimeout(() => d.remove(), 1900); },

  hud(){
    if(!G.L) return;
    $('lvlTxt').textContent = G.daily ? 'DAILY' : 'LEVEL ' + G.n;
    $('coinTxt').textContent = S.coins;
    this.pips();
    this.failCount();
  },
  pips(){
    const L = G.L, got = G.b && G.st !== 'reset' ? G.b.got : 0;
    let h = '';
    for(let i = 0; i < L.gems.length; i++) h += `<i class="${i < got ? 'on' : ''}"></i>`;
    $('pips').innerHTML = h;
  },
  failCount(){
    $('hintBtn').classList.toggle('pulse', G.fails >= 3 && !G.hint);
    $('skipBtn').classList.toggle('hidden', G.fails < 5 || G.daily);
    $('hintBtn').classList.toggle('hidden', G.hint);
    const free = !G.daily && G.n <= 3;
    $('hintBtn').querySelector('.ad').classList.toggle('hidden', free);
  },
  banner(a, b, c){
    const el = $('banner');
    el.querySelector('b').textContent = a; el.querySelector('span').textContent = b; el.querySelector('small').textContent = c;
    el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden');
    clearTimeout(this.banT); this.banT = setTimeout(() => el.classList.add('hidden'), 2700);
  },
  tip(txt, ms){
    const el = $('tip');
    el.textContent = txt; el.classList.add('hidden'); void el.offsetWidth; el.classList.remove('hidden');
    clearTimeout(this.tipTimer);
    if(ms) this.tipTimer = setTimeout(() => el.classList.add('hidden'), ms);
  },
  tutorialStart(){
    if(!S.tut && G.n === 1) this.tip('Drag back & let go to throw!');
    else if(G.n === 6 && !S.holdTut) this.tip('New! HOLD the screen while it flies to curve tighter', 6000);
  },
  tutorialThrown(){
    if(!S.tut){ S.tut = 1; persist(); this.tip('Loop through every gem, then catch it!', 3500); }
    else if(G.n >= 6 && !S.holdTut){ S.holdTut = 1; persist(); this.tip('Hold = tighter curve!', 2500); }
    else $('tip').classList.add('hidden');
  },

  /* ---------- ads (always opt-in) ---------- */
  askHint(){
    const give = () => { G.hint = true; this.failCount(); this.toast('Follow the golden path!'); if(G.st !== 'aim') toAim(); };
    if(!G.daily && G.n <= 3){ give(); return; }
    SDK.rewarded('small', ok => ok ? give() : this.toast('No hint this time'));
  },
  askSkip(){
    SDK.rewarded('medium', ok => {
      if(!ok){ this.toast('Could not skip right now'); return; }
      if(G.n >= S.lvl) S.lvl = G.n + 1;
      persist();
      irisOut(() => { startLevel(G.n + 1); irisIn(); });
    });
  },
  doubleCoins(){
    const info = G.clearInfo;
    if(!info || info.doubled) return;
    SDK.rewarded('small', ok => {
      if(!ok) return;
      info.doubled = true; S.coins += info.coins; persist();
      $('clCoins').textContent = '+' + info.coins * 2;
      $('clDouble').classList.add('hidden');
      AU.coin(); this.hud();
    });
  },

  /* ---------- level clear ---------- */
  showClear(info){
    this.show('clear');
    $('clTitle').textContent = G.daily ? 'DAILY CLEARED!' : ['NICE!', 'GREAT!', 'PERFECT!'][info.stars - 1];
    const st = $('clStars').children;
    [...st].forEach(s => s.classList.remove('on'));
    for(let i = 0; i < info.stars; i++) setTimeout(() => { st[i].classList.add('on'); AU.starPop(i); }, 250 + i * 280);
    $('clR1').classList.add('on');
    $('clR2').classList.toggle('on', info.star);
    $('clR3').classList.toggle('on', info.fast);
    $('clR3').textContent = `⚡ Fast catch: ${info.time.toFixed(1)}s (goal ${G.L.par}s)`;
    $('clCoins').textContent = '+' + info.coins;
    $('clDouble').classList.remove('hidden');
    const ch = $('clChest');
    if(info.chest){
      ch.classList.remove('hidden');
      if(info.chest.kind === 'coins') ch.innerHTML = '🎁 Treasure chest: +500 coins!';
      else{
        ch.innerHTML = '';
        ch.appendChild(this.preview(info.chest.kind, info.chest.it.id));
        const s = document.createElement('span'); s.textContent = `🎁 Chest unlocked: ${info.chest.it.name}!`; ch.appendChild(s);
      }
    }else ch.classList.add('hidden');
    this.hud();
  },
  closeClear(fn){ this.hide('clear'); fn(); },

  /* ---------- menu ---------- */
  togglePause(){
    if(G.st === 'intro' || !$('clear').classList.contains('hidden')) return;
    const open = !$('menu').classList.contains('hidden') || !$('levels').classList.contains('hidden') || !$('shop').classList.contains('hidden');
    if(open){
      ['menu', 'levels', 'shop'].forEach(id => this.hide(id));
      G.paused = false;
    }else{
      G.paused = true; G.aim = null; G.holding = false;
      SDK.gameplayStop();
      const d = S.daily.day === dayNum() && S.daily.done;
      $('mDaily').textContent = d ? `📅 DAILY DONE · 🔥${S.daily.streak}` : `📅 DAILY CHALLENGE${S.daily.streak ? ' · 🔥' + S.daily.streak : ''}`;
      this.show('menu');
    }
  },
  syncToggles(){ $('tSfx').classList.toggle('off', !S.sfx); $('tMus').classList.toggle('off', !S.music); },
  primaryAction(){
    if(!$('clear').classList.contains('hidden')) $('clNext').click();
    else if(!$('menu').classList.contains('hidden')) $('mResume').click();
  },
  resumeInto(fn){
    ['menu', 'levels', 'shop'].forEach(id => this.hide(id));
    G.paused = false;
    irisOut(() => SDK.commercial(() => { fn(); irisIn(); }));
  },
  playDaily(){
    if(S.daily.day === dayNum() && S.daily.done){ this.toast('Come back tomorrow for a new one!'); }
    this.resumeInto(() => startLevel(0, { daily: true }));
  },

  /* ---------- level select ---------- */
  openLevels(){
    this.hide('menu'); this.show('levels');
    this.lvTab = Math.min(Math.floor((G.daily ? S.cur - 1 : G.n - 1) / LEVELS_PER_WORLD), this.maxTab());
    this.renderLevels();
  },
  maxTab(){ return Math.floor((S.lvl - 1) / LEVELS_PER_WORLD); },
  renderLevels(){
    $('lvStars').textContent = '★ ' + totalStars();
    const tabs = $('lvTabs'); tabs.innerHTML = '';
    const nt = Math.max(WORLDS.length, this.maxTab() + 1);
    for(let i = 0; i < nt; i++){
      const b = document.createElement('button');
      b.textContent = i < WORLDS.length ? String(i + 1) : '★' + (i - WORLDS.length + 1);
      b.className = (i === this.lvTab ? 'on' : '') + (i > this.maxTab() ? ' lock' : '');
      b.onclick = () => { if(i > this.maxTab()) { this.toast('Clear the world before it first!'); return; } AU.click(); this.lvTab = i; this.renderLevels(); };
      tabs.appendChild(b);
    }
    $('lvName').textContent = this.lvTab < WORLDS.length ? WORLDS[this.lvTab].name : 'Bonus levels';
    const g = $('lvGrid'); g.innerHTML = '';
    for(let k = 0; k < LEVELS_PER_WORLD; k++){
      const n = this.lvTab * LEVELS_PER_WORLD + k + 1, b = document.createElement('button');
      const st = S.stars[n] || 0, lock = n > S.lvl;
      b.className = lock ? 'lock' : n === S.lvl ? 'cur' : '';
      b.innerHTML = lock ? '🔒' : `${n}<small>${'★'.repeat(st)}${'☆'.repeat(3 - st)}</small>`;
      b.onclick = () => { if(lock) return; AU.click(); this.resumeInto(() => startLevel(n)); };
      g.appendChild(b);
    }
  },

  /* ---------- customize ---------- */
  openShop(){ this.hide('menu'); this.show('shop'); this.renderShop(); },
  preview(kind, id){
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const c = cv.getContext('2d');
    if(kind === 'rang'){ c.translate(58, 50); c.rotate(-0.3); drawRang(c, RANGS.find(r => r.id === id), 2.2); }
    else{ c.translate(50, 212); c.scale(1.15, 1.15); drawRoo(c, 1, id, 0, 0.9, null, false); }
    return cv;
  },
  renderShop(){
    $('shCoins').textContent = S.coins;
    const g = $('shGrid'); g.innerHTML = '';
    const list = this.shTab === 'rang' ? RANGS : HATS;
    for(const it of list){
      const own = !!S.own[it.id], eq = (this.shTab === 'rang' ? S.rang : S.hat) === it.id;
      const b = document.createElement('button');
      b.className = (eq ? 'eq' : '') + (!own && S.coins < it.price ? ' cant' : '');
      b.appendChild(this.preview(this.shTab, it.id));
      const nm = document.createElement('div'); nm.textContent = it.name; b.appendChild(nm);
      const pr = document.createElement('div'); pr.className = own ? '' : 'price coin';
      pr.textContent = eq ? 'EQUIPPED' : own ? 'OWNED' : it.price; b.appendChild(pr);
      b.onclick = () => {
        if(!own){
          if(S.coins < it.price){ AU.miss(); this.toast('Need more coins: clear levels!'); return; }
          S.coins -= it.price; S.own[it.id] = 1; AU.buy();
        }else AU.click();
        if(this.shTab === 'rang') S.rang = it.id; else S.hat = it.id;
        persist(); this.renderShop(); this.hud();
      };
      g.appendChild(b);
    }
  }
};

boot();
