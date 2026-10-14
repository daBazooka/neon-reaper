// ---------- ANIMATED SHORT FILM: environment + citizen art library ----------
const CTM={ // moods: sky top, sky bottom, building tones, window colour, ground
 dawn:{top:'#26335f',bot:'#ff9f6e',b:['#1c2748','#27355e','#34456f'],win:'#ffd48a',road:'#262a3b',sun:'#ffd6a0',amb:'#ffb27a'},
 day:{top:'#5aa7e6',bot:'#ffe3b3',b:['#2b3b5d','#3a4e78','#4b6291'],win:'#fff0c4',road:'#2d3242',sun:'#fff3d0',amb:'#ffffff'},
 grey:{top:'#3a4258',bot:'#8892a8',b:['#232a3a','#2c3548','#374159'],win:'#e8d9b0',road:'#252937',sun:'#c9d0e0',amb:'#aab4c8'},
 dusk:{top:'#2b2352',bot:'#ff7a6e',b:['#1a1a3a','#25254d','#30305f'],win:'#ffcf86',road:'#221f34',sun:'#ff9e7a',amb:'#ff8f7a'},
 night:{top:'#05060f',bot:'#171c36',b:['#0b0d1b','#10132a','#171b38'],win:'#ffd48a',road:'#12141f',sun:'#e8ecff',amb:'#6b7bb0'}};
const CTSKIN=['#e9bf9d','#c98f6c','#8d5a3b','#f2d1b0','#6b3f27'],CTCLOTH=['#c0584f','#4f7ec0','#d49a3d','#4fa38b','#8a5fc0','#c0508f','#6e7a8a','#3f5f8a'],CTHAIR=['#1a1410','#3a2414','#5a3a20','#b0762c','#2a2a2e'];
function ctSky(t,m,sunX=1500,sunY=330,sr=90){c.fillStyle=lg(0,0,0,1080,[[0,m.top],[1,m.bot]]);c.fillRect(0,0,1920,1080);if(sunY<1000){oGlow(sunX,sunY,520,m.sun,.55);c.fillStyle=m.sun;c.shadowColor=m.sun;c.shadowBlur=60;c.beginPath();c.arc(sunX,sunY,sr,0,PI*2);c.fill();c.shadowBlur=0}
  c.save();c.globalAlpha=.16;c.fillStyle='#fff';for(let i=0;i<6;i++){const x=mod(i*420+t*(8+i*3),2300)-200,y=140+i*70;c.beginPath();c.ellipse(x,y,200,36,0,0,PI*2);c.fill();c.beginPath();c.ellipse(x+80,y-20,120,30,0,0,PI*2);c.fill()}c.restore()}
// layered skyline. layer 0 far .. 2 near; cam = horizontal camera position
function ctSkyline(m,layer,cam,base,lit=.6,seed=1,t=0){const par=[.12,.28,.5][layer],hz=[.55,.8,1][layer];c.save();const off=-cam*par;c.translate(off,0);
  let x=-300;const col=m.b[layer];let i=0;while(x<2600+Math.abs(off)){const w=80+rnd(seed+layer*50+i)*120,h=(160+rnd(seed*3+layer*70+i)*340)*(layer===0?.8:1)*(layer===2?1.05:1);const y=base-h*hz;c.fillStyle=col;c.fillRect(x,y,w,h*hz+400);
    if(layer>0){const ww=14*hz,gap=26*hz;for(let wy=y+20;wy<base-20;wy+=gap*1.5){for(let wx=x+14;wx<x+w-ww;wx+=gap){const on=rnd(wx*.13+wy*.07+seed)<lit;c.fillStyle=on?m.win:'rgba(255,255,255,.05)';c.globalAlpha=on?(.55+.35*rnd(wx+wy)):1;c.fillRect(wx,wy,ww,ww*1.3);c.globalAlpha=1}}}
    if(rnd(i+seed*9)>.82&&layer>0){c.fillStyle=col;c.fillRect(x+w/2-3,y-60,6,60);c.fillStyle='#ff4d5e';if(Math.sin(t*3+i)>0){c.beginPath();c.arc(x+w/2,y-60,5,0,PI*2);c.fill()}}
    x+=w+(layer===0?4:10);i++}
  c.restore();c.fillStyle=hexa(m.bot,.0);}
function ctRoad(m,y0,y1,cam=0){c.fillStyle=m.road;c.fillRect(0,y0,1920,y1-y0);c.fillStyle='rgba(255,255,255,.08)';c.fillRect(0,y0,1920,6);
  c.fillStyle='rgba(255,255,255,.35)';const off=mod(cam*1,160);for(let x=-160;x<2100;x+=160)c.fillRect(x-off,(y0+y1)/2-4,90,8)}
function ctLamp(x,y,m,on=true){c.fillStyle='#10131f';c.fillRect(x-4,y-210,8,210);c.fillRect(x-4,y-210,60,8);if(on){c.save();c.globalCompositeOperation='lighter';c.fillStyle=rg(x+56,y-200,0,150,[[0,hexa(m.win,.55)],[1,hexa(m.win,0)]]);c.fillRect(x-100,y-350,320,320);c.restore()}}
// --- citizens (flat silhouettes). k: 'w' woman, 'm' man, 'c' child boy, 'g' girl. ---
function ctPerson(x,y,s,o={}){const k=o.k||'m',sd=o.sd||1,dir=o.dir||1,ph=o.ph||0,sk=CTSKIN[Math.floor(rnd(sd)*5)],cl=o.col||CTCLOTH[Math.floor(rnd(sd*3)*8)],hr=CTHAIR[Math.floor(rnd(sd*5)*5)];
  const kid=(k==='c'||k==='g'),sc=s*(kid?.62:1),a=o.a===undefined?1:o.a;if(a<=0.01)return;c.save();c.globalAlpha*=a;c.translate(x,y);c.scale(sc*dir,sc);
  const sw=Math.sin(ph)*(o.walk===false?0:1);const legL=46,tor=62;
  // shadow
  c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(0,0,34,8,0,0,PI*2);c.fill();
  // legs
  c.strokeStyle=(k==='w'&&o.skirt)?sk:o.pants||'#1d2236';c.lineWidth=14;c.lineCap='round';
  c.beginPath();c.moveTo(-6,-92);c.lineTo(-6+sw*22,-6);c.stroke();c.beginPath();c.moveTo(6,-92);c.lineTo(6-sw*22,-6);c.stroke();
  // back arm
  c.strokeStyle=cl;c.lineWidth=12;c.beginPath();c.moveTo(0,-150);c.lineTo(-sw*20,-100);c.stroke();
  // torso
  c.fillStyle=cl;c.beginPath();c.roundRect(-20,-160,40,76,14);c.fill();
  if(k==='w'&&o.skirt){c.beginPath();c.moveTo(-20,-100);c.lineTo(-34,-52);c.lineTo(34,-52);c.lineTo(20,-100);c.closePath();c.fill()}
  // front arm (+ carry)
  c.strokeStyle=cl;c.lineWidth=12;c.beginPath();c.moveTo(0,-150);c.lineTo(o.carry?18:sw*20,o.carry?-112:-100);c.stroke();
  if(o.carry==='bag'){c.fillStyle='#6b4a2a';c.fillRect(8,-118,26,22)}
  if(o.carry==='cup'){c.fillStyle='#fff';c.fillRect(12,-128,12,16)}
  // head
  if(k==='w'||k==='g'){c.fillStyle=hr;if(o.hair==='bun'){c.beginPath();c.arc(-4,-196,12,0,PI*2);c.fill()}else{c.beginPath();c.ellipse(-10,-172,15,30,0,0,PI*2);c.fill()}}
  c.fillStyle=sk;c.beginPath();c.arc(2,-176,18,0,PI*2);c.fill();
  c.fillStyle=hr;if(k==='w'||k==='g'){c.beginPath();c.arc(2,-182,19,PI,PI*2);c.fill()}else{c.beginPath();c.arc(2,-181,18,PI*1.05,PI*1.95);c.fill();if(o.cap){c.fillStyle=cl;c.fillRect(-16,-198,36,10)}}
  if(o.old){c.fillStyle='#d8dbe6';c.beginPath();c.arc(2,-182,19,PI,PI*2);c.fill()}
  c.restore()}
// gold dust where a person was (u = progress of vanish)
function ctDust(x,y,s,u,seed=1){if(u<=0||u>=1.4)return;const q=cl(u/1.3);c.save();c.globalCompositeOperation='lighter';for(let k=0;k<34;k++){const px=x+(rnd(seed*7+k)-.5)*70*s,py=y-(rnd(seed*3+k+9))*190*s-q*(120+rnd(k+seed)*260)*s,r=(2+rnd(k+3)*4)*(1-q*.4)*Math.max(.7,s);c.fillStyle=hexa('#ffd890',(1-q)*.95);c.shadowColor='#ffcf80';c.shadowBlur=10;c.beginPath();c.arc(px+Math.sin(q*6+k)*8,py,r,0,PI*2);c.fill()}c.restore()}
// vanishing person: o.vu = vanish progress (0..1+), draws silhouette fading + dust
function ctVP(x,y,s,o){const u=o.vu||0;ctPerson(x,y,s,{...o,a:1-cl(u/.55)});ctDust(x,y,s*(o.k==='c'||o.k==='g'?.62:1),u,o.sd||1)}
// vehicles
function ctCar(x,y,s,col,dir,o={}){c.save();c.translate(x,y);c.scale(s*dir,s);c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(0,0,120,12,0,0,PI*2);c.fill();c.fillStyle=col;c.beginPath();c.moveTo(-120,-20);c.lineTo(-118,-52);c.lineTo(-70,-58);c.lineTo(-38,-96);c.lineTo(52,-96);c.lineTo(88,-58);c.lineTo(122,-50);c.lineTo(124,-20);c.closePath();c.fill();c.fillStyle='rgba(180,210,255,.55)';c.beginPath();c.moveTo(-60,-60);c.lineTo(-34,-90);c.lineTo(-2,-90);c.lineTo(-2,-60);c.closePath();c.fill();c.beginPath();c.moveTo(6,-60);c.lineTo(6,-90);c.lineTo(48,-90);c.lineTo(78,-60);c.closePath();c.fill();
  if(o.driver){ctPerson(0,0,.01,{});c.fillStyle='#1d2236';c.beginPath();c.arc(-30,-74,10,0,PI*2);c.fill()}
  [-70,76].forEach(wx=>{c.fillStyle='#0a0c14';c.beginPath();c.arc(wx,-14,22,0,PI*2);c.fill();c.fillStyle='#555d78';c.beginPath();c.arc(wx,-14,10,0,PI*2);c.fill()});
  if(o.hazard&&Math.sin((o.t||0)*9)>0){c.fillStyle='#ffa030';c.shadowColor='#ffa030';c.shadowBlur=24;c.beginPath();c.arc(120,-34,7,0,PI*2);c.fill();c.beginPath();c.arc(-118,-40,7,0,PI*2);c.fill()}
  c.restore()}
function ctBus(x,y,s,col,dir,o={}){c.save();c.translate(x,y);c.scale(s*dir,s);c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(0,0,230,14,0,0,PI*2);c.fill();c.fillStyle=col;c.beginPath();c.roundRect(-230,-150,460,130,16);c.fill();c.fillStyle='rgba(180,210,255,.5)';for(let i=0;i<7;i++)c.fillRect(-212+i*58,-130,46,50);c.fillStyle='rgba(180,210,255,.5)';c.fillRect(196,-130,24,70);
  if(o.riders)for(let i=0;i<o.riders;i++){c.fillStyle='rgba(20,24,40,.8)';c.beginPath();c.arc(-190+i*58,-100,9,0,PI*2);c.fill()}
  [-150,150].forEach(wx=>{c.fillStyle='#0a0c14';c.beginPath();c.arc(wx,-18,26,0,PI*2);c.fill();c.fillStyle='#555d78';c.beginPath();c.arc(wx,-18,11,0,PI*2);c.fill()});
  if(o.hazard&&Math.sin((o.t||0)*9)>0){c.fillStyle='#ffa030';c.shadowColor='#ffa030';c.shadowBlur=26;c.beginPath();c.arc(226,-60,8,0,PI*2);c.fill();c.beginPath();c.arc(-226,-60,8,0,PI*2);c.fill()}
  c.restore()}
// clock HUD
function ctClock(txt,t,col='#ffd48a'){c.save();oPanel(1500,130,380,100,.5,'rgba(255,255,255,.14)',18);oTxt(txt,1690,180,64,col,'center',800,16);c.restore()}
// lower third
function ctLT(a,b,t,u=0){oShow(t-u,(p)=>{c.save();c.translate(80,900);c.globalAlpha*=cl(p);rr(0,-46,6,96,3,'#ffd48a');oTxt(a,26,-14,38,'#fff','left',800);oTxt(b,26,26,22,'rgba(244,246,255,.7)','left',700);c.restore()},.3)}
// god rays from a window
function ctRays(x,y,w,len,col,a=.18){c.save();c.globalCompositeOperation='lighter';const g=lg(x,y,x+len,y+len*.8,[[0,hexa(col,a)],[1,hexa(col,0)]]);c.fillStyle=g;c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.lineTo(x+w+len,y+len*.8);c.lineTo(x+len*.3,y+len*.8);c.closePath();c.fill();c.restore()}
function ctVignette(a=.5){c.save();const g=rg(960,540,300,1200,[[0,'rgba(0,0,0,0)'],[1,`rgba(0,0,0,${a})`]]);c.fillStyle=g;c.fillRect(0,0,1920,1080);c.restore()}
function ctGrade(col,a){c.save();c.globalCompositeOperation='soft-light';c.fillStyle=hexa(col,a);c.fillRect(0,0,1920,1080);c.restore()}
