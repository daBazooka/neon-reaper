// node make.js  -> writes logo.png, logo-transparent.png, banner.png, watermark.png here
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:1200,height:900}});
 p.on('pageerror',e=>{console.log('ERR',e.message);process.exit(1)});
 await p.goto('file://'+path.resolve(__dirname,'brand.html'));
 for(const k of ['logo','logo-transparent','banner','watermark']){
   const d=await p.evaluate(k=>make(k),k); fs.writeFileSync(path.join(__dirname,k+'.png'),Buffer.from(d.split(',')[1],'base64')); console.log('wrote',k);
 }
 await b.close();
})();
