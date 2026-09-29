const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:1280,height:720}});
 p.on('pageerror',e=>{console.log('ERR',e.message);process.exit(1)});
 await p.goto('file://'+path.resolve(__dirname,'thumbs.html'));
 for(const k of (process.argv[2]?process.argv[2].split(','):['A','B','C'])){const d=await p.evaluate(k=>make(k),k);const nm=k.length>1?`${k[1]}-${k[2]}`.replace(/^(\d)-/,'0$1-'):k;const f=path.join(__dirname,'thumbs',`thumbnail-${nm}.jpg`);fs.writeFileSync(f,Buffer.from(d.split(',')[1],'base64'));console.log(k,fs.statSync(f).size)}
 await b.close();
})();
