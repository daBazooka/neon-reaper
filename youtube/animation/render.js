// usage: NODE_PATH=$(npm root -g) node render.js <project> <W> <H> <fps> <outdir> [part nparts]
//        NODE_PATH=$(npm root -g) node render.js <project> <W> <H> preview <outdir> t1,t2,...
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const [proj,W,H,fps,out,a1,a2]=[process.argv[2],+process.argv[3],+process.argv[4],process.argv[5],process.argv[6],process.argv[7],process.argv[8]];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:W,height:H}});
 p.on('pageerror',e=>{console.log('PAGEERR',e.message);process.exit(1)});
 await p.goto('file://'+path.resolve(__dirname,'engine.html'));
 const total=await p.evaluate(([n,w,h])=>setup(n,w,h),[proj,W,H]);
 if(fps==='events'){fs.writeFileSync(path.join(out,'events.json'),JSON.stringify(await p.evaluate(()=>events())))}
 else if(fps==='preview'){
   for(const t of a1.split(',')){await p.evaluate(t=>frame(t),+t);const d=await p.evaluate(()=>cv.toDataURL('image/png'));fs.writeFileSync(path.join(out,`p_${t}.png`),Buffer.from(d.split(',')[1],'base64'))}
 } else {

   const F=+fps, n=Math.round(total*F), part=+(a1||0), parts=+(a2||1);
   for(let i=part;i<n;i+=parts){
     await p.evaluate(t=>frame(t),i/F);
     const d=await p.evaluate(()=>cv.toDataURL('image/jpeg',.92));
     fs.writeFileSync(path.join(out,'f'+String(i).padStart(6,'0')+'.jpg'),Buffer.from(d.split(',')[1],'base64'));
   }
 }
 await b.close();
})();
