// ---------- y06 sleep ----------
SC.a_y06=(t)=>{const id='y06';skBg(t,SKC.vio,.22,'#0a0b1c','#010208');const gy=800;const T1=oT(id,1,'morning');skHud(id,t,oT(id,0,'sleep'));
  // night window
  c.save();rr(1300,240,420,360,16,'#0b1030','rgba(255,255,255,.25)',3);skMoon(1560,360,56);for(let i=0;i<14;i++){c.fillStyle='rgba(255,255,255,.7)';c.fillRect(1320+rnd(i)*380,260+rnd(i*3)*140,3,3)}c.restore();
  // clock racing from 11pm to 3am
  const u=eo((t-oT(id,1,'three')+3.4)/3.2),hrs=23+u*4,hh=Math.floor(hrs)%24,mm=Math.floor(mod(hrs,1)*60);
  const clk=(hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm;oTxt(clk,1510,670,100,SKC.vio,'center',800,28);oTxt('NIGHT',1510,730,24,SKC.dim,'center',800);
  // Sam typing, tired
  skFloor(gy,0,1260);const hipY=gy-62;skDesk(520,hipY-36,1.2,380);skLaptop(480,hipY-40,1.1,t,SKC.vio);
  const tired=cl((t-oT(id,1,'three')+1)/2);skFig(380,hipY,1.3,skType(t,10),{face:tired>.5?'tired':'focus',t,glow:10,gc:SKC.vio,gy});
  // empty bed
  c.save();rr(880,hipY-40,320,90,14,'#161a38','rgba(255,255,255,.18)',2);rr(880,hipY-70,90,40,10,'#222850');c.restore();oTxt('BED: EMPTY',1040,hipY+90,24,SKC.dim,'center',800);
  // ONE LAST THING bubble
  oShow(t-oT(id,1,'last'),(p)=>{c.save();c.translate(430,340);c.scale(p,p);skBubble(0,0,420,84,'"ONE LAST THING..."',38,SKC.vio);c.restore()});
  // study gauge
  oShow(t-oT(id,2,'nature'),(p)=>{c.save();c.translate(960,230);c.scale(p,p);oPanel(-300,-70,600,140,.8,hexa(SKC.vio,.6),24);oTxt('DAWSON & REID · NATURE · 1997',0,-34,24,SKC.vio,'center',800);oTxt('LONG WAKEFULNESS ≈ OVER THE LEGAL ALCOHOL LIMIT',0,14,22,SKC.wht,'center',800);oTxt('(performance impairment)',0,46,18,SKC.dim,'center',700);c.restore()});
  oShow(t-oT(id,3,'drunk'),(p)=>{c.save();c.translate(700,470);c.scale(p,p);oChip('DRUNK, IN EFFECT.  AND HE CANNOT TELL.',0,0,32,SKC.red);c.restore()})};
// ---------- y07 body ----------
SC.a_y07=(t)=>{const id='y07';skBg(t,SKC.red,.22,'#14090c');skHud(id,t,oT(id,0,'body'));const gy=800;
  // weekly hours dial
  const T1=oT(id,1,'week'),hrs=40+30*eo((t-oT(id,1,'fifty')+.6)/3.8);c.save();c.translate(480,470);c.lineWidth=30;c.lineCap='round';c.strokeStyle='rgba(255,255,255,.1)';c.beginPath();c.arc(0,0,190,PI*.75,PI*2.25);c.stroke();
  const f=(hrs-30)/60,col=hrs>55?SKC.red:hrs>45?SKC.amb:SKC.teal;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=24;c.beginPath();c.arc(0,0,190,PI*.75,PI*.75+PI*1.5*f);c.stroke();c.shadowBlur=0;oTxt(Math.round(hrs)+'',0,-10,150,col,'center',800,26);oTxt('HOURS / WEEK',0,80,28,SKC.dim,'center',800);c.restore();
  // ECG
  c.save();oPanel(720,230,560,200,.6,hexa(SKC.red,.4),22);oEcg(740,1260,330,t*(1+(hrs-40)/20),60+(hrs-40),SKC.red,300+(hrs-40)*6,360);skHeart(780,262,.5,SKC.red,t*(1+(hrs-40)/20));c.restore();
  // coffee pile + Sam hunched
  skFloor(gy,0,1260);const hipY=gy-62;skDesk(1020,hipY-36,1.1,320);skLaptop(990,hipY-40,1,t,SKC.red);
  skFig(900,hipY,1.2,skMix(skType(t,10),STKP.slump,.4),{face:'tired',t,glow:10,gc:SKC.red,gy});
  const cups=Math.floor(Math.max(0,t-T1)/2.2);for(let i=0;i<Math.min(cups,6);i++){const x=1300+i*34;c.fillStyle='#e8d9c0';c.fillRect(x,gy-30,22,28);c.fillStyle='#6b4a2a';c.fillRect(x,gy-30,22,8)}
  // stats panels
  oShow(t-oT(id,2,'organization'),(p)=>{c.save();c.translate(1590,360);c.scale(p,p);oPanel(-290,-130,580,260,.8,hexa(SKC.red,.7),26);oTxt('55+ HOURS / WEEK  vs  35–40',0,-86,24,SKC.dim,'center',800);oTxt('STROKE  +35%',0,-18,52,SKC.red,'center',800,16);oTxt('HEART DISEASE DEATH  +17%',0,52,34,SKC.amb,'center',800);oTxt('WHO / ILO · ENV. INTERNATIONAL 2021',0,100,18,SKC.dim,'center',700);c.restore()});
  oShow(t-oT(id,3,'seven'),(p)=>{c.save();const n=Math.round(745000*eo((t-oT(id,3,'seven'))/2.4));c.translate(1590,640);c.scale(p,p);oTxt(n.toLocaleString('en-US'),0,0,86,SKC.wht,'center',800,22,SKC.red);oTxt('ESTIMATED DEATHS · 2016 · FROM LONG HOURS',0,60,22,SKC.dim,'center',800);c.restore()});
  oShow(t-oT(id,3,'hours'),(p)=>{c.save();c.translate(1590,780);c.scale(p,p);oChip('NOT FROM DANGER. FROM HOURS.',0,0,28,SKC.red);c.restore()})};
// ---------- y08 people ----------
SC.a_y08=(t)=>{const id='y08';skBg(t,SKC.blu,.2,'#08101a');skHud(id,t,oT(id,0,'people'));const gy=800;skFloor(gy,0,1920);
  // dinner table with friends who leave
  c.save();rr(760,gy-100,640,16,6,'#2a2f4a');c.fillStyle='#1c2036';c.fillRect(800,gy-84,12,84);c.fillRect(1340,gy-84,12,84);c.restore();
  const leaveT=[oT(id,2,'cancels'),oT(id,2,'cancels')+1.2,oT(id,2,'next'),oT(id,2,'stops')];
  [0,1,2,3].forEach(i=>{const x=840+i*150,go=cl((t-leaveT[i]-i*.3)/2.2);const P=go>0?skWalk(t+i,1.3,.4):skMix(STKP.sit,STKP.sit,0);const px=x+go*(i%2?500:-420)*(go>0?1:0),a=1-go*.95;skFig(px,go>0?gy-90*.95:gy-52*.95,.95,go>0?P:{...STKP.sit,la:[.2,.5],ra:[.1,.5]},{dir:i<2?-1:1,face:go>0?'sad':'smile',t,a,col:SKC.blu,gy:go>0?gy:undefined})});
  // Sam at his desk, left
  const hipY=gy-62;skDesk(300,hipY-36,1.1,300);skLaptop(280,hipY-40,1,t,SKC.blu);skFig(190,hipY,1.2,skType(t,10),{face:'focus',t,glow:10,gc:SKC.blu,gy});
  // phone notifications
  const msgs=[['"Birthday · 7pm"','birthday'],['"Dinner Saturday?"','dinner'],['"You alive?"','next'],['"Hello?"','stops']];
  msgs.forEach(([m,nd],i)=>{oShow(t-(oT(id,2,nd)-.8),(p)=>{c.save();c.translate(1660,300+i*84);c.scale(p,p);oPanel(-210,-34,420,68,.85,hexa(SKC.blu,.5),18);oTxt(m,-190,0,26,SKC.wht,'left',800);oTxt('UNREAD',190,0,16,SKC.red,'right',800);c.restore()})});
  oShow(t-oT(id,1,'leave'),(p)=>{c.save();c.translate(1090,230);c.scale(p,p);oTxt('THEY LEAVE ONE UNANSWERED MESSAGE AT A TIME',0,0,34,SKC.wht,'center',800,14);c.restore()},.4);
  oShow(t-oT(id,3,'harvard'),(p)=>{c.save();c.translate(1000,430);c.scale(p,p);oPanel(-340,-80,680,160,.85,hexa(SKC.grn,.6),24);oTxt('HARVARD STUDY OF ADULT DEVELOPMENT · SINCE 1938',0,-44,22,SKC.grn,'center',800);oTxt('RELATIONSHIPS BEAT',0,6,46,SKC.wht,'center',800);oTxt('WEALTH · FAME · WORKING HARDER',0,52,28,SKC.amb,'center',800);c.restore()});
  oShow(t-oT(id,4,'audience'),(p)=>{c.save();c.translate(960,860-40);c.scale(p,p);c.restore()})};
// ---------- y09 identity ----------
SC.a_y09=(t)=>{const id='y09';skBg(t,SKC.vio,.2,'#0c0a1c');skHud(id,t,oT(id,0,'four'));const gy=800;
  const Tp=oT(id,2,'phelps'),Tl=oT(id,3,'betray'),dark=cl((t-oT(id,1,'ends'))/1.2);
  // lanes
  c.save();for(let i=0;i<4;i++){const y=470+i*80;c.fillStyle='rgba(74,168,255,.12)';c.fillRect(60,y,1800,64);for(let x=0;x<1800;x+=60){c.fillStyle='rgba(255,255,255,.06)';c.fillRect(60+x+mod(t*50,60),y+30,24,3)}}c.restore();
  // swimmer
  const sx=mod(t*150,2200)-150;skFig(sx,540,.8,skSwim(t),{face:'focus',t,col:SKC.wht,glow:10,gc:SKC.blu});
  // Sam: body made of "the work"
  const gone=cl((t-oT(id,1,'nobody')+.2)/1.6);c.save();c.translate(1560,0);const sp=skFig(0,gy-92*1.2,1.2,STKP.stand,{face:gone>.4?'sad':'n',t,a:1-.8*gone,col:gone>.4?SKC.dim:SKC.amb,glow:gone>.4?0:14,gc:SKC.amb});
  oShow(t-oT(id,1,'become'),()=>{c.save();c.globalAlpha*=1-gone;oChip('= THE WORK',0,gy-92*1.2-190,26,SKC.amb);c.restore()});
  oShow(t-oT(id,1,'nobody'),()=>{oTxt('WHO AM I',0,gy-390,44,SKC.wht,'center',800,18);oTxt('WITHOUT THIS?',0,gy-340,44,SKC.vio,'center',800,18)});c.restore();
  // lights out
  c.save();c.globalAlpha=.55*cl((t-Tl)/1.6);c.fillStyle='#000';c.fillRect(0,0,1920,1080);c.restore();
  oShow(t-Tp,(p)=>{c.save();c.translate(560,280);c.scale(p,p);oPanel(-390,-80,780,170,.85,hexa(SKC.vio,.6),24);oTxt('MICHAEL PHELPS HAS SAID',0,-46,22,SKC.vio,'center',800);oTxt('IN THE POOL EVERY DAY, FOR YEARS',0,-4,30,SKC.wht,'center',800);oTxt('DEPRESSION AFTER 2004 · AND AFTER 2012',0,36,28,SKC.amb,'center',800);oTxt('HE GOT HELP — AND NOW SPEAKS ABOUT IT',0,72,22,SKC.grn,'center',800);c.restore()},.3);
  oShow(t-oT(id,4,'close'),(p)=>{c.save();c.translate(960,700);c.scale(p,p);oPanel(-420,-70,840,140,.9,hexa(SKC.grn,.7),24);oTxt('IF THIS FEELS CLOSE TO HOME — TALK TO SOMEONE YOU TRUST.',0,-26,26,SKC.wht,'center',800);oTxt('US: CALL OR TEXT 988  ·  ELSEWHERE: YOUR LOCAL CRISIS LINE',0,22,24,SKC.grn,'center',800);c.restore()})};
// ---------- y10 Curie ----------
SC.a_y10=(t)=>{const id='y10';skBg(t,SKC.grn,.18,'#07120d','#010208');skHud(id,t,oT(id,0,'invisible'));
  // glowing notebook + geiger
  const gcol=SKC.grn;oGlow(520,520,420,gcol,.35+.08*Math.sin(t*3));
  c.save();c.translate(520,520);c.rotate(-.06);rr(-190,-150,380,300,12,'#13261c',gcol,4);c.fillStyle='rgba(88,224,138,.6)';for(let i=0;i<8;i++)c.fillRect(-150,-110+i*30,300-rnd(i)*120,5);c.restore();
  for(let i=0;i<26;i++){const a=rnd(i)*PI*2,r=240+((t*70+i*40)%240);c.fillStyle=hexa(gcol,.6*(1-(r-240)/240));c.beginPath();c.arc(520+Math.cos(a)*r,520+Math.sin(a)*r*.8,3,0,PI*2);c.fill()}
  const tk=Math.floor(t*(6+10*Math.abs(Math.sin(t*.5))));oShow(t-oT(id,3,'notebooks'),()=>{oTxt('☢',520,330,80,gcol,'center',800,24);oChip('STILL RADIOACTIVE',520,730,28,gcol)});
  // timeline of facts
  oShow(t-oT(id,1,'two'),(p)=>{c.save();c.translate(1330,290);c.scale(p,p);oPanel(-380,-70,760,140,.8,hexa(SKC.amb,.6),24);oTxt('MARIE CURIE',0,-34,28,SKC.amb,'center',800);oTxt('TWO NOBEL PRIZES · PHYSICS & CHEMISTRY',0,14,30,SKC.wht,'center',800);oTxt('LITTLE PROTECTION — NOBODY KNEW YET',0,50,22,SKC.dim,'center',700);c.restore()});
  oShow(t-oT(id,2,'died'),(p)=>{c.save();c.translate(1330,470);c.scale(p,p);oPanel(-380,-60,760,120,.8,hexa(SKC.red,.6),24);oTxt('1934 · APLASTIC ANEMIA',0,-20,36,SKC.red,'center',800,14);oTxt('A BLOOD DISEASE WIDELY LINKED TO RADIATION EXPOSURE',0,28,21,SKC.dim,'center',700);c.restore()});
  oShow(t-oT(id,3,'lead'),(p)=>{c.save();c.translate(1330,650);c.scale(p,p);oPanel(-380,-70,760,140,.8,hexa(SKC.grn,.6),24);oTxt('LEAD-LINED BOXES',0,-34,30,SKC.wht,'center',800);oTxt('RADIUM-226 · HALF-LIFE ≈ 1,600 YEARS',0,12,28,SKC.grn,'center',800);oTxt('Bibliothèque nationale, Paris',0,50,20,SKC.dim,'center',700);c.restore()});
  oShow(t-oT(id,4,'both'),(p)=>{c.save();c.translate(960,805);c.scale(p,p);oTxt('BUILT HER LEGACY.  ALSO MARKED IT.',0,0,40,SKC.wht,'center',800,18);c.restore()})};
// ---------- y11 ledger ----------
SC.a_y11=(t)=>{const id='y11';skBg(t,SKC.red,.24,'#14090c');skHud(id,t,oT(id,0,'add'));
  oShow(t-oT(id,0,'add'),(p)=>{c.save();c.translate(960,270);c.scale(p,p);oPanel(-560,-80,1120,400,.8,hexa(SKC.red,.6),28);oTxt('SAM · THE BILL',0,-30,48,SKC.wht,'center',800);c.restore()},.3);
  ['SLEEP','BODY','PEOPLE','IDENTITY'].forEach((n,i)=>{oShow(t-(oT(id,0,'sleep')+i*.7),(p)=>{c.save();c.translate(960,340+i*62);c.scale(p,p);oTxt(n,-440,0,40,SKC.wht,'left',800);const v=[.34,.38,.22,.1][i];skBar(-200,-14,560,28,1-v,SKC.red);oTxt('OWED',440,0,32,SKC.red,'right',800);c.restore()})});
  // interest compounding
  oShow(t-oT(id,1,'interest'),(p)=>{c.save();c.translate(960,780);c.scale(p,p);const u=cl((t-oT(id,1,'interest'))/6);c.strokeStyle=SKC.red;c.lineWidth=6;c.shadowColor=SKC.red;c.shadowBlur=14;c.beginPath();for(let i=0;i<=40;i++){const x=i/40*u;const px=-480+x*960,py=0-150*(Math.exp(3*x)-1)/(Math.exp(3)-1);i?c.lineTo(px,py):c.moveTo(px,py)}c.stroke();c.restore()});
  oShow(t-oT(id,1,'once'),(p)=>{c.save();c.translate(960,640);c.rotate(-.05);c.scale(p,p);oTxt('DUE: ALL AT ONCE',0,0,70,SKC.red,'center',800,30);c.restore()},.5);
  oShow(t-oT(id,3,'trading'),(p)=>{c.save();c.translate(960,860-30);c.scale(p,p);c.restore()})};
