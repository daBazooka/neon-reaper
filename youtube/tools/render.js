// usage: NODE_PATH=$(npm root -g) node render.js <trailer|verified|busted|complicated> <outdir>
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const [name,out]=[process.argv[2],process.argv[3]]; const FPS=30;
const dur = name==='trailer'?28:3;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:1080,height:1920}});
 await p.goto('file://'+path.resolve(__dirname,'motion.html'));
 const mode=name==='trailer'?'trailer':'stamp';
 for(let i=0;i<dur*FPS;i++){
   await p.evaluate(([t,m,k])=>render(t,m,k),[i/FPS,mode,name]);
   await p.screenshot({path:path.join(out,'f'+String(i).padStart(4,'0')+'.jpg'),type:'jpeg',quality:92});
 }
 await b.close();
})();
