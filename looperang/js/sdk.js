'use strict';
/* =====================================================================
   Poki SDK v2 wrapper.
   - PokiSDK.init() -> (load) -> gameLoadingFinished()
   - gameplayStart() on the first player input of a level, gameplayStop()
     whenever play is interrupted (menus, level-complete panel, pause).
     Both are de-duplicated so Poki never sees the same event twice in a row.
   - commercialBreak() only at natural breaks (next level, restarting from
     the menu), rewardedBreak() only when the player taps an opt-in button.
   - During any ad: audio is suspended and all input (pointer + keyboard)
     is ignored (SDK.adBusy), gameplay stays stopped.
   - If the SDK cannot load (offline, ad blocker, other host) every call
     falls through and the game plays normally.
   ===================================================================== */
const SDK = {
  p: null, playing: false, adBusy: false, loaded: false, wantLoaded: false,

  init(){
    return new Promise(res => {
      let done = false;
      const fin = () => { if(!done){ done = true; res(); } };
      const ready = () => {
        this.p = window.PokiSDK;
        if(this.wantLoaded && !this.loaded) this.loadingFinished();
        fin();
      };
      const start = () => {
        try{
          // init() rejects when an ad blocker is on; Poki asks games to continue normally
          window.PokiSDK.init().then(ready).catch(ready);
        }catch(e){ fin(); }
      };
      // the SDK <script> tag in index.html loads async so it never delays the first frame
      if(window.PokiSDK) start();
      else{
        const tag = document.getElementById('pokiSdk');
        if(tag){ tag.addEventListener('load', start); tag.addEventListener('error', fin); }
        else fin();
      }
      setTimeout(fin, 3000);
    });
  },
  loadingFinished(){
    this.wantLoaded = true;
    if(!this.p || this.loaded) return;
    this.loaded = true;
    try{ this.p.gameLoadingFinished(); }catch(e){}
  },
  gameplayStart(){
    if(this.playing || this.adBusy) return;
    this.playing = true;
    try{ this.p && this.p.gameplayStart(); }catch(e){}
  },
  gameplayStop(){
    if(!this.playing) return;
    this.playing = false;
    try{ this.p && this.p.gameplayStop(); }catch(e){}
  },
  /* interstitial at a natural break; Poki decides whether an ad actually shows */
  commercial(cb){
    if(!this.p || this.adBusy){ cb(); return; }
    this.gameplayStop();
    this.adBusy = true;
    let fin = false;
    const end = () => { if(fin) return; fin = true; this.adBusy = false; AU.adMute(false); cb(); };
    try{ this.p.commercialBreak(() => AU.adMute(true)).then(end, end); }catch(e){ end(); }
  },
  /* opt-in rewarded ad; cb(true) only if the player earned the reward */
  rewarded(size, cb){
    if(this.adBusy){ cb(false); return; }
    if(!this.p){ cb(true); return; }   // off Poki there is no ad to watch, just give the reward
    this.gameplayStop();
    this.adBusy = true;
    let fin = false;
    const end = ok => { if(fin) return; fin = true; this.adBusy = false; AU.adMute(false); cb(!!ok); };
    try{ this.p.rewardedBreak({ size, onStart: () => AU.adMute(true) }).then(end, () => end(false)); }catch(e){ end(false); }
  },
  error(err){ try{ this.p && this.p.captureError && this.p.captureError(err); }catch(e){} }
};
window.addEventListener('error', e => SDK.error(e.error || e.message));
