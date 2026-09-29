// usage: node render.js <project> <land|port> <fps> <outdir> [part nparts]
//        node render.js <project> <land|port> events <outdir>
//        node render.js <project> <land|port> preview <outdir> t1,t2,...
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
const [proj,orient,fps,out,a1,a2]=process.argv.slice(2);
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const land=orient==='land';
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:land?{width:1920,height:1080}:{width:1080,height:1920}});
 p.on('pageerror',e=>{console.log('PAGEERR',e.message);process.exit(1)});
 await p.goto('file://'+path.resolve(__dirname,'engine.html'));
 const total=await p.evaluate(([n,l])=>setup(n,l),[proj,land]);
 const grab=async(T)=>{await p.evaluate(t=>frame(t),T);return await p.evaluate(()=>out.toDataURL('image/jpeg',.93))};
 if(fps==='events'){fs.writeFileSync(path.join(out,'events.json'),JSON.stringify(await p.evaluate(()=>events())))}
 else if(fps==='preview'){for(const t of a1.split(',')){const d=await grab(+t);fs.writeFileSync(path.join(out,`p_${t}.jpg`),Buffer.from(d.split(',')[1],'base64'))}}
 else{const F=+fps,n=Math.round(total*F),part=+(a1||0),parts=+(a2||1);
  const lo=+(process.env.FROM||0),hi=+(process.env.TO||n);
  for(let i=part;i<n;i+=parts){if(i<lo||i>=hi)continue;const d=await grab(i/F);fs.writeFileSync(path.join(out,'f'+String(i).padStart(6,'0')+'.jpg'),Buffer.from(d.split(',')[1],'base64'))}}
 await b.close();
})();
