// ---------- vertical Short (cost-s1): content within x 690..1230, y 150..800 ----------
function swBg(t,k,col){skBg(t,col,.24);for(let i=0;i<8;i++){c.fillStyle=i<=k?SKC.amb:'rgba(255,255,255,.2)';c.beginPath();c.arc(960-3.5*30+i*30,70,i===k?9+3*opul(t,5):6,0,PI*2);c.fill()}}
function swTitle(t,a,b,y,col1,col2,s1=88,s2=88){oShow(t-.05,(p)=>{c.save();c.translate(960,y);c.scale(p,p);oFit(a,0,-52,520,s1,col1,'center',800,24,col2);oFit(b,0,52,520,s2,col2,'center',800,24);c.restore()},.3)}
SC.a_w0=(t)=>{swBg(t,0,SKC.red);swTitle(t,'OBSESSION BEATS','DISCIPLINE',230,'#fff',SKC.teal,70,92);
  const gy=800,s=1.3;skFloor(gy,690,1230,hexa(SKC.red,.45));for(let k=3;k>=1;k--)skFig(960-k*28,gy-98*s,s,skRun(t-k*.05),{col:SKC.red,a:.15,t});skFig(960,gy-98*s+Math.abs(Math.sin(t*PI*5.4))*8,s,skRun(t),{face:'mania',t,glow:16,gc:SKC.red,gy});
  oShow(t-oT('w0',0,'until'),(p)=>{c.save();c.translate(960,430);c.scale(p,p);oChip('...UNTIL IT SENDS THE BILL',0,0,26,SKC.red);c.restore()})};
SC.a_w1=(t)=>{swBg(t,1,SKC.amb);const gy=720;skFloor(gy,690,1230);
  const car=(x,y,col)=>{c.save();c.translate(x,y);c.scale(.95,.95);c.fillStyle='#1b2038';c.strokeStyle=col;c.lineWidth=5;c.beginPath();c.moveTo(-150,0);c.lineTo(-150,-48);c.lineTo(-90,-52);c.lineTo(-50,-100);c.lineTo(70,-100);c.lineTo(112,-52);c.lineTo(150,-46);c.lineTo(150,0);c.closePath();c.fill();c.stroke();[-85,85].forEach(wx=>{c.fillStyle='#0a0c18';c.beginPath();c.arc(wx,2,30,0,PI*2);c.fill();c.stroke()});c.restore()};
  car(960+Math.sin(t*14)*1.5,gy-30,SKC.amb);oFit('ENGINE = OBSESSION',960,250,520,66,SKC.amb,'center',800,22);
  oShow(t-oT('w1',0,'seatbelt'),(p)=>{c.save();c.translate(960,350);c.scale(p,p);oFit('SEATBELT = DISCIPLINE',0,0,520,60,SKC.teal,'center',800,22);c.restore()});
  oShow(t-oT('w1',0,'seatbelt')-.8,(p)=>{c.save();c.translate(960,520);c.scale(p,p);oTxt('BOTH.',0,0,120,'#fff','center',800,28,SKC.amb);c.restore()})};
SC.a_w2=(t)=>{swBg(t,2,SKC.vio);swTitle(t,'PRICE 1','SLEEP',230,SKC.vio,'#fff',60,120);
  skMoon(1100,420,52);const u=eo((t-.5)/3.4),hrs=23+u*4,hh=Math.floor(hrs)%24,mm=Math.floor(mod(hrs,1)*60);oFit((hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm,820,420,300,96,SKC.vio,'center',800,26);
  const gy=800,hipY=gy-62;skFloor(gy,690,1230);skDesk(900,hipY-36,.9,300);skLaptop(870,hipY-40,.85,t,SKC.vio);skFig(800,hipY,1.0,skType(t,10),{face:'tired',t,glow:8,gc:SKC.vio,gy});
  oShow(t-oT('w2',0,'drink'),(p)=>{c.save();c.translate(960,640);c.scale(p,p);oChip('LIKE BEING OVER THE LIMIT',0,0,26,SKC.red);c.restore()})};
SC.a_w3=(t)=>{swBg(t,3,SKC.red);swTitle(t,'PRICE 2','YOUR BODY',230,SKC.red,'#fff',60,92);
  const hrs=40+30*eo((t-.6)/3);const col=hrs>55?SKC.red:SKC.amb;c.save();c.translate(960,470);c.lineWidth=26;c.lineCap='round';c.strokeStyle='rgba(255,255,255,.1)';c.beginPath();c.arc(0,0,150,PI*.75,PI*2.25);c.stroke();c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=22;c.beginPath();c.arc(0,0,150,PI*.75,PI*.75+PI*1.5*(hrs-30)/60);c.stroke();c.shadowBlur=0;oTxt(Math.round(hrs)+'',0,-6,120,col,'center',800,22);oTxt('HOURS / WEEK',0,66,24,SKC.dim,'center',800);c.restore();
  oPanel(690,630,540,110,.6,hexa(SKC.red,.4),22);oEcg(700,1220,685,t*1.6,46,SKC.red,420,340);
  oShow(t-oT('w3',0,'thirty'),(p)=>{c.save();c.translate(960,780);c.scale(p,p);oChip('STROKE RISK  +35%',0,0,30,SKC.red);c.restore()})};
SC.a_w4=(t)=>{swBg(t,4,SKC.blu);swTitle(t,'PRICE 3','PEOPLE',230,SKC.blu,'#fff',60,110);
  [['"Birthday · 7pm"',.6],['"Dinner Saturday?"',1.6],['"You alive?"',2.6],['"Hello?"',3.4]].forEach(([m,d],i)=>{oShow(t-d,(p)=>{c.save();c.translate(960,380+i*80);c.scale(p,p);oPanel(-250,-32,500,64,.85,hexa(SKC.blu,.5),18);oTxt(m,-230,0,24,SKC.wht,'left',800);oTxt('UNREAD',226,0,14,SKC.red,'right',800);c.restore()})});
  const gy=800;skFloor(gy,690,1230);[0,1,2].forEach(i=>{const go=cl((t-2.4-i*.5)/2);skFig(780+i*130+go*(i%2?80:-80),gy-90*.9,.9,go>0?skWalk(t+i,1.3,.4):STKP.stand,{col:SKC.blu,a:1-go*.9,face:'sad',t})})};
SC.a_w5=(t)=>{swBg(t,5,SKC.amb);swTitle(t,'PRICE 4','WHO YOU ARE',230,SKC.amb,'#fff',60,84);
  const gone=cl((t-oT('w5',0,'losing')+.4)/1.6),gy=800;skFloor(gy,690,1230);skFig(960,gy-92*1.15,1.15,STKP.stand,{face:gone>.4?'sad':'n',t,a:1-.8*gone,col:gone>.4?SKC.dim:SKC.amb,glow:gone>.4?0:14,gc:SKC.amb});
  oShow(t-.6,()=>{c.save();c.globalAlpha*=1-gone;oChip('= THE WORK',960,420,28,SKC.amb);c.restore()});
  oShow(t-oT('w5',0,'losing'),()=>{oFit('WHO AM I',960,410,420,56,'#fff','center',800,18);oFit('WITHOUT THIS?',960,472,420,56,SKC.vio,'center',800,18)})};
SC.a_w6=(t)=>{swBg(t,6,SKC.grn);swTitle(t,'THE LEASH','5 RULES',230,SKC.grn,'#fff',80,80);
  [['SLEEP FLOOR','floor'],['ONE SACRED APPOINTMENT','sacred'],['BODY CHECK','body'],['KILL SWITCH','kill'],['OFF RAMP','ramp']].forEach(([n,nd],i)=>{oShow(t-oT('w6',0,nd),(p)=>{c.save();c.translate(960,370+i*84);c.scale(p,p);oPanel(-260,-34,520,68,.8,hexa(SKC.grn,.55),20);oTxt(String(i+1),-226,0,40,SKC.grn,'center',800);oFit(n,10,0,400,26,'#fff','center',800);c.restore()})})};
SC.a_w7=(t)=>{skBg(t,SKC.amb,.3,'#1a1208');const gy=800;c.save();c.translate(960,gy);c.scale(.62,.62);rr(-300,-420,600,420,10,'#1a1520','rgba(255,255,255,.25)',4);rr(-220,-330,440,330,10,'#05030a','rgba(255,255,255,.18)',3);for(let i=0;i<30;i++){const u=mod(t*.9+i/30,1),x=Math.sin(i*5+t*3)*80*(1-u);c.fillStyle=`rgba(255,${100+u*120|0},50,${.9*(1-u)})`;c.beginPath();c.arc(x,-30-u*250,34*(1-u)+6,0,PI*2);c.fill()}c.restore();oGlow(960,gy-80,360,SKC.amb,.5);
  oShow(t-oT('w7',0,'fire'),(p)=>{c.save();c.translate(960,250);c.scale(p,p);oFit('OBSESSION IS A FIRE.',0,0,520,64,'#fff','center',800,22,SKC.amb);c.restore()});
  oShow(t-oT('w7',0,'build'),(p)=>{c.save();c.translate(960,340);c.scale(p,p);oFit('BUILD THE FIREPLACE.',0,0,520,64,SKC.amb,'center',800,26);c.restore()});
  oShow(t-oT('w7',0,'channel'),(p)=>{c.save();c.translate(960,470);c.scale(p,p);oChip('FULL FILM ON THE CHANNEL',0,0,26,SKC.amb);c.restore()})};
