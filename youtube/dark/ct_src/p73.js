// ---------- scenes f08..fend ----------
SC.a_f08=(t)=>{const id='f08',yrs=Math.floor(10+t*1.6),season=Math.floor(t/4)%4,m=[CTM.day,CTM.dusk,CTM.grey,CTM.dawn][season];const dim=cl(t/22);ctSky(t,m,1500,420,80);ctSkyline(m,0,0,700,.6*(1-dim*.9),21,t);ctSkyline(m,1,0,760,.8*(1-dim*.85),22,t);ctSkyline(m,2,0,830,1*(1-dim*.9),23,t);
  c.fillStyle='#161a28';c.fillRect(0,830,1920,250);
  // playground swings (empty) + grass creeping
  c.strokeStyle='#8a97b0';c.lineWidth=8;c.beginPath();c.moveTo(1200,860);c.lineTo(1280,640);c.lineTo(1520,640);c.lineTo(1600,860);c.stroke();[1330,1450].forEach(x=>{const a=Math.sin(t*1.1+x)*.08*(1-dim*.7);c.save();c.translate(x,640);c.rotate(a);c.strokeStyle='#8a97b0';c.lineWidth=4;c.beginPath();c.moveTo(-12,0);c.lineTo(-12,170);c.moveTo(12,0);c.lineTo(12,170);c.stroke();c.fillStyle='#c0584f';c.fillRect(-26,170,52,10);c.restore()});
  c.strokeStyle='#4a8a4a';c.lineWidth=3;for(let i=0;i<160;i++){const x=rnd(i)*1920,h=(6+rnd(i+4)*50)*dim*(.4+dim);c.beginPath();c.moveTo(x,840+rnd(i+9)*60);c.lineTo(x+Math.sin(t+i)*4,840+rnd(i+9)*60-h);c.stroke()}
  // a few ageing walkers, fewer over time
  for(let i=0;i<6;i++){const alive=cl(1-(t-3-i*3)/4);if(alive<=0)continue;const x=mod(200+i*320+t*(20+i*6),2100)-100;ctPerson(x,960,1.5,{k:'m',sd:130+i,dir:1,ph:t*(1.6),old:t>8,a:alive})}
  // calendar
  oTxt('YEAR '+yrs,960,170,110,'rgba(255,255,255,.9)','center',800,24);oTxt('NO NEW CHILDREN',960,235,30,'#ff8f9f','center',800,14);
  ctGrade(m.amb,.1);ctVignette(.6+dim*.25)};
SC.a_f09=(t)=>{const id='f09',Tl=oT(id,0,'switches')+.3;c.fillStyle='#06070f';c.fillRect(0,0,1920,1080);
  const lampOn=t<Tl;
  // window with dark city + stars
  c.fillStyle='#0a0e1e';c.fillRect(1180,200,520,420);for(let i=0;i<40;i++){c.fillStyle='rgba(255,255,255,.7)';c.fillRect(1190+rnd(i)*500,210+rnd(i+5)*250,2,2)}c.fillStyle='#0d1020';for(let i=0;i<9;i++){const h=60+rnd(i+30)*160;c.fillRect(1190+i*56,610-h,48,h)}c.fillStyle='#10131f';c.fillRect(1180,200,10,420);c.fillRect(1690,200,10,420);c.fillRect(1180,200,520,10);c.fillRect(1180,610,520,10);c.fillRect(1430,200,10,420);
  c.fillStyle='#14111c';c.fillRect(0,800,1920,280);
  if(lampOn){oGlow(780,560,520,'#ffd28a',.55);ctRays(700,430,160,500,'#ffd28a',.1)}
  c.fillStyle=lampOn?'#ffd28a':'#2a2c3a';c.fillRect(884,520,12,280);c.beginPath();c.moveTo(850,520);c.lineTo(930,520);c.lineTo(910,450);c.lineTo(870,450);c.closePath();c.fill();
  // armchair + old man
  c.fillStyle='#3a2a2a';c.beginPath();c.roundRect(380,640,260,200,30);c.fill();c.fillRect(380,600,40,240);
  const reach=cl((t-Tl+2)/1.6);ctPerson(520,830,1.9,{k:'m',sd:140,dir:1,walk:false,old:true,col:'#6e6a7a',a:1});
  if(t>Tl+.4){c.fillStyle='#000';c.globalAlpha=cl((t-Tl-.4)/1.2);c.fillRect(0,0,1920,1080);c.globalAlpha=1}
  oShow(t-oT(id,1,'years'),(p)=>{c.save();c.translate(960,300);c.scale(p,p);oTxt('300,000 YEARS',0,0,120,'#fff','center',800,28,'#ffd48a');c.restore()},.4);
  oShow(t-oT(id,1,'half'),(p)=>{c.save();c.fillStyle='#000';c.globalAlpha=.0;c.restore();c.save();c.translate(960,520);c.scale(p,p);oTxt('BECAUSE HALF OF IT WAS GONE.',0,0,70,'#ffb0c0','center',800,24);c.restore()},.6);
  ctVignette(.7)};
SC.a_f10=(t)=>{const id='f10',m=CTM.dawn;ctSky(t,m,1400,560,90);ctSkyline(m,0,0,760,.7,31,t);ctSkyline(m,1,0,820,.9,32,t);c.fillStyle='#161a28';c.fillRect(0,860,1920,220);
  const seq=[['THE NURSE','nurse',380,'#2f8f8f','w',0],['THE TEACHER','teacher',760,'#c0508f','w',1],['THE MOTHER','mother',1140,'#c9a13f','w',2],['THE FARMER','farmer',1520,'#4fa38b','w',3]];
  seq.forEach(([lab,nd,x,col,k,i])=>{const T=oT(id,1,nd);oShow(t-T,(p)=>{c.save();c.globalAlpha*=cl(p);oGlow(x,800,300,'#ffd48a',.45);ctPerson(x,1010,1.9,{k,sd:150+i,dir:1,walk:false,col,hair:i%2?'bun':'long',skirt:i===1,carry:i===0?null:null});if(i===2)ctPerson(x+110,1010,1.2,{k:'c',sd:160,dir:-1,walk:false});oTxt(lab,x,230,30,'#ffe9b0','center',800,16);c.restore()},.5)});
  oShow(t-oT(id,1,'friend'),(p)=>{c.save();c.translate(960,860);c.scale(p,p);c.restore()});
  oShow(t-oT(id,2,'notice'),(p)=>{c.save();c.fillStyle='rgba(2,3,10,.55)';c.fillRect(0,0,1920,1080);c.translate(960,480);c.scale(p,p);oTxt('NOTICE THE WORK.',0,-30,140,'#fff','center',800,30,'#ffd48a');oTxt('Thank her, today.',0,90,56,'#ffd48a','center',800,18);c.restore()},.5);
  ctGrade('#ffb27a',.2);ctVignette(.45)};
SC.a_fend=(t)=>{const m=CTM.dawn;ctSky(t,m,960,640,120);ctSkyline(m,0,0,760,.6,41,t);ctSkyline(m,1,0,820,.8,42,t);c.fillStyle='#161a28';c.fillRect(0,880,1920,200);
  for(let i=0;i<10;i++){const x=mod(200+i*210+t*30,2200)-150;ctPerson(x,990,1.6,{k:i%2?'w':'m',sd:170+i,dir:1,ph:t*3+i,hair:i%3?'long':'bun',skirt:i%4===1})}
  oShow(t-.8,(p)=>{c.save();c.translate(960,380);c.scale(p,p);oTxt('NOTICE THE WORK.',0,0,150,'#fff','center',800,34,'#ffd48a');c.restore()},.5);
  oShow(t-3.2,()=>{oTxt('IF ALL WOMEN DISAPPEARED  ·  AN ANIMATED SHORT FILM',960,960,28,'rgba(244,246,255,.7)','center',800);oTxt('Say her name in the comments.',960,1006,24,'#ffd48a','center',800)});ctVignette(.4)};
