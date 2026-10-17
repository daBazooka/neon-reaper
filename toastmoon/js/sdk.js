'use strict';
/* =====================================================================
   CrazyGames SDK v3 wrapper.
   - Documented order: SDK.init() -> loadingStart() -> (load) -> loadingStop()
   - gameplayStart/Stop are de-duplicated so the portal never sees two
     starts (or two stops) in a row.
   - Every call is wrapped: off-portal (localhost, itch, file://) the game
     runs identically with the SDK absent.
   - ADS_ENABLED stays false during Basic Launch: CrazyGames does not allow
     ads in Basic Launch, so no ad API is touched at all while it's false.
     Flip it to true once the dashboard shows Full Implementation.
   ===================================================================== */
const ADS_ENABLED = false;

const SDK = {
  cg: null, env: 'none', playing: false, lastAd: 0, adBusy: false,
  onMute: null,

  async init(){
    await new Promise(res => {
      let done = false; const fin = () => { if(!done){ done = true; res(); } };
      try{
        const s = document.createElement('script');
        s.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
        s.onload = fin; s.onerror = fin;
        document.head.appendChild(s);
      }catch(e){ fin(); }
      setTimeout(fin, 4000);
    });
    try{
      const sdk = window.CrazyGames && window.CrazyGames.SDK;
      if(!sdk) return;
      await Promise.race([sdk.init(), new Promise((_, rej) => setTimeout(() => rej(new Error('sdk timeout')), 5000))]);
      this.env = sdk.environment || 'crazygames';
      if(this.env === 'disabled') return;   // not on a CrazyGames domain
      this.cg = sdk;
      try{
        this.applySettings(sdk.game.settings);
        sdk.game.addSettingsChangeListener(s => this.applySettings(s));
      }catch(e){}
    }catch(e){ this.cg = null; }
  },
  applySettings(s){
    if(!s) return;
    if(this.onMute) this.onMute(!!s.muteAudio);
  },
  data(){ try{ return this.cg && this.cg.data ? this.cg.data : null; }catch(e){ return null; } },

  loadingStart(){ try{ this.cg && this.cg.game.loadingStart(); }catch(e){} },
  loadingStop(){ try{ this.cg && this.cg.game.loadingStop(); }catch(e){} },
  gameplayStart(){ if(this.playing) return; this.playing = true; try{ this.cg && this.cg.game.gameplayStart(); }catch(e){} },
  gameplayStop(){ if(!this.playing) return; this.playing = false; try{ this.cg && this.cg.game.gameplayStop(); }catch(e){} },
  happytime(){ try{ this.cg && this.cg.game.happytime(); }catch(e){} },

  canRewarded(){ return ADS_ENABLED && !!this.cg && !this.adBusy; },

  /* rewarded ad: cb(true) only when the ad finished */
  rewarded(cb){
    if(!this.canRewarded()){ cb(false); return; }
    this._ad('rewarded', cb);
  },
  /* midgame ad at natural breaks, self-limited to one per 3 minutes */
  midgame(cb){
    if(!ADS_ENABLED || !this.cg || this.adBusy || Date.now() - this.lastAd < 180000){ cb(); return; }
    this._ad('midgame', () => cb());
  },
  _ad(type, cb){
    this.adBusy = true; this.gameplayStop();
    let fin = false;
    const end = ok => { if(fin) return; fin = true; this.adBusy = false; this.lastAd = Date.now(); AU.adMute(false); cb(ok); };
    try{
      this.cg.ad.requestAd(type, {
        adStarted: () => AU.adMute(true),
        adFinished: () => end(true),
        adError: () => end(false)
      });
    }catch(e){ end(false); }
  }
};
