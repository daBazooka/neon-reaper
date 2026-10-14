import {chromium} from '/tmp/r3d/node_modules/playwright-core/index.mjs';
import http from 'http';import fs from 'fs';import path from 'path';
const HERE=path.dirname(new URL(import.meta.url).pathname);
const srv=http.createServer((req,res)=>{let u=decodeURIComponent(req.url.split('?')[0]);let f=u.startsWith('/node_modules')?'/tmp/r3d'+u:path.join(HERE,u==='/'?'scene.html':u);
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':f.endsWith('.js')||f.endsWith('.mjs')?'text/javascript':'text/html'});res.end(d);});}).listen(8765);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for(const [mode,w,h,out] of [['thumb',1920,1080,'hero_thumb.png'],['icon',1024,1024,'hero_icon.png'],['teams',1920,1080,'teams.png'],['win',1920,1080,'win.png']]){
  const p=await b.newPage({viewport:{width:w,height:h}});
  p.on('console',m=>console.log('console:',m.text()));p.on('pageerror',e=>console.log('pageerror:',e.message));
  await p.goto(`http://localhost:8765/scene.html?mode=${mode}&w=${w}&h=${h}`);
  await p.waitForFunction('window.__done===true',null,{timeout:120000});
  const info=await p.evaluate('window.__info');
  await p.screenshot({path:path.join(HERE,out)});
  fs.writeFileSync(path.join(HERE,out.replace('.png','.json')),JSON.stringify(info));
  console.log(mode,JSON.stringify(info));
}
await b.close();srv.close();
