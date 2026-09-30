'use strict';
/* =====================================================================
   Playgama Bridge wrapper (same interface as the CrazyGames js/sdk.js).
   Used only by the Playgama build (build.py --playgama).
   - bridge.initialize() at boot, 'game_ready' once the title is up.
   - 'gameplay_started' / 'gameplay_stopped' de-duplicated.
   - Interstitial between runs (Bridge enforces its own minimum delay),
     rewarded available through SDK.rewarded().
   - Audio follows the platform's audio/pause state and is muted during ads.
   - If the Bridge is missing (offline, blocked) every call falls through.
   ===================================================================== */
const SDK = {
  b: null, playing: false, adBusy: false, ready: false, onMute: null,

  async init(){
    const br = window.bridge;
    if(!br) return;
    try{
      await Promise.race([br.initialize(), new Promise((_, rej) => setTimeout(() => rej(new Error('bridge timeout')), 8000))]);
      this.b = br;
    }catch(e){ this.b = null; return; }
    try{
      const E = br.EVENT_NAME || {};
      if(br.platform.isAudioEnabled === false && this.onMute) this.onMute(true);
      br.platform.on(E.AUDIO_STATE_CHANGED || 'audio_state_changed', on => { if(this.onMute) this.onMute(!on); });
      br.platform.on(E.PAUSE_STATE_CHANGED || 'pause_state_changed', paused => {
        if(this.onMute) this.onMute(!!paused);
        if(paused && typeof pauseGame === 'function') pauseGame();
      });
    }catch(e){}
  },
  msg(m){ try{ this.b && this.b.platform.sendMessage(m); }catch(e){} },
  data(){ return null; },                       // progress stays in localStorage (works on every platform)

  loadingStart(){},
  loadingStop(){ if(this.ready) return; this.ready = true; this.msg('game_ready'); },
  gameplayStart(){ if(this.playing || this.adBusy) return; this.playing = true; this.msg('gameplay_started'); },
  gameplayStop(){ if(!this.playing) return; this.playing = false; this.msg('gameplay_stopped'); },
  happytime(){},

  canRewarded(){ try{ return !!this.b && !this.adBusy && this.b.advertisement.isRewardedSupported !== false; }catch(e){ return false; } },

  /* rewarded ad: cb(true) only when the platform reports the reward */
  rewarded(cb){
    if(!this.canRewarded()){ cb(false); return; }
    this._ad('rewarded', cb);
  },
  /* interstitial at a natural break (between runs) */
  midgame(cb){
    let ok = false;
    try{ ok = !!this.b && !this.adBusy && this.b.advertisement.isInterstitialSupported !== false; }catch(e){}
    if(!ok){ cb(); return; }
    this._ad('interstitial', () => cb());
  },
  _ad(kind, cb){
    const br = this.b, ad = br.advertisement, E = br.EVENT_NAME || {};
    const evName = kind === 'rewarded' ? (E.REWARDED_STATE_CHANGED || 'rewarded_state_changed') : (E.INTERSTITIAL_STATE_CHANGED || 'interstitial_state_changed');
    this.adBusy = true; this.gameplayStop();
    let fin = false, opened = false, rewarded = false, waitT = 0, capT = 0;
    const end = () => {
      if(fin) return; fin = true;
      clearTimeout(waitT); clearTimeout(capT);
      try{ ad.off(evName, onState); }catch(e){}
      this.adBusy = false; AU.adMute(false); cb(rewarded);
    };
    const onState = st => {
      if(st === 'opened'){ opened = true; clearTimeout(waitT); AU.adMute(true); }
      else if(st === 'rewarded') rewarded = true;
      else if(st === 'closed' || st === 'failed') end();
    };
    try{ ad.on(evName, onState); }catch(e){}
    // the platform may skip the ad (frequency cap): never leave the player waiting
    waitT = setTimeout(() => { if(!opened) end(); }, 3000);
    capT = setTimeout(end, 120000);
    try{ kind === 'rewarded' ? ad.showRewarded() : ad.showInterstitial(); }catch(e){ end(); }
  }
};
