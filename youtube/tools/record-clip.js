const { chromium } = require('playwright');
const [W,H,SECS,OUT] = [+process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];
(async()=>{
 const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const ctx = await b.newContext({viewport:{width:W,height:H}, recordVideo:{dir:'out', size:{width:W,height:H}}});
 const p = await ctx.newPage();
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('file://'+require('path').resolve(__dirname,'../../index.html')+'');
 await p.waitForTimeout(1500);
 await p.click('#claimBtn').catch(()=>{});
 await p.waitForTimeout(500);
 await p.evaluate((S)=>{ window.__S=S; G.mode='hardcore'; startRun();
  const d=document.createElement('div');
  d.style.cssText='position:fixed;left:0;right:0;top:16%;z-index:99999;text-align:center;font:900 44px system-ui;color:#fff;text-shadow:0 0 18px #26f0ff,0 4px 0 #000;pointer-events:none;padding:0 24px';
  d.innerHTML='ONE LIFE.<br>100 WAVES.<br><span style="color:#ff2fb9">YOU PICK THE CURSE.</span>';
  document.body.appendChild(d);
  const c=document.createElement('div');
  c.style.cssText='position:fixed;left:0;right:0;bottom:12%;z-index:99999;text-align:center;font:900 34px system-ui;color:#ffd23c;text-shadow:0 3px 0 #000;pointer-events:none';
  document.body.appendChild(c);
  setInterval(()=>{c.textContent='SURVIVED '+G.t.toFixed(0)+'s  |  SCORE '+G.score},200);
  setTimeout(()=>{d.innerHTML='WHICH CURSE NEXT?<br><span style="color:#26f0ff">COMMENT BELOW</span>'},(window.__S*1000)-6000);
 }, SECS);
 const dirs=['w','a','s','d'];
 const t0=Date.now(); let i=0;
 while(Date.now()-t0 < SECS*1000){
   const st = await p.evaluate(()=>G.state);
   if(st==='OVER'||st==='GAMEOVER'){ console.log('over at',(Date.now()-t0)/1000); break; }
   const k=dirs[(i++)%4], k2=dirs[Math.floor(Math.random()*4)];
   await p.keyboard.down(k); await p.keyboard.down(k2);
   await p.waitForTimeout(350+Math.random()*350);
   await p.keyboard.up(k); await p.keyboard.up(k2);
   if(i%6==0) await p.keyboard.press('1');
   if(i==8) await p.screenshot({path:'play.png'});
 }
 console.log('final', await p.evaluate(()=>G.state+' t='+G.t.toFixed(0)+' score='+G.score));
 await ctx.close(); await b.close();
})();
