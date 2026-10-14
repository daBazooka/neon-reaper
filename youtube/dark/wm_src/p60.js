// ---------- IF ALL WOMEN VANISHED: thought-experiment film ----------
const WMC={rose:'#ff9bbd',ice:'#9bc4ff',amb:'#ffc06b',red:'#ff5a6e',grn:'#6bffb0'};
const WMTAG={n00:'7:42 AM · TUESDAY',n01:'HOUR 1',n02:'DAY 1',n03:'WEEK 1',n04:'MONTH 1',n05:'MONTH 1',n06:'YEAR 1',n07:'YEAR 10',n08:'YEAR 50',n09:'YEAR ~100',n10:'',n11:'',nend:''};
const WMORDER=['n00','n01','n02','n03','n04','n05','n06','n07','n08','n09','n10','n11','nend'];
function wmPop(id,t){const tag=WMTAG[id];c.save();if(tag)oTxt(tag,70,66,34,WMC.amb,'left',800,16);
  let v=8.09;const i=WMORDER.indexOf(id);if(i>=1&&i<=7)v=4.07;if(id==='n00')v=8.09-4.02*eo((t-oT('n00',0,'disappears'))/1.6);if(id==='n07')v=4.07-.3*eo((t-4)/8);if(id==='n08')v=3.77-2.2*eo((t-2)/10);if(id==='n09')v=1.57*(1-eo((t-oT('n09',0,'light'))/2.8))+0;
  if(i<=9){oPanel(1420,30,470,110,.55,'rgba(255,255,255,.12)',20);oTxt('HUMAN POPULATION',1655,56,19,'rgba(244,246,255,.55)','center',800);oTxt(Math.max(0,v).toFixed(2)+' B',1655,100,52,v<4.1&&i>0?WMC.rose:'#fff','center',800,i>0?18:0,WMC.rose)}c.restore()}
function mBg(t,tint=WMC.ice,ga=.16){skBg(t,tint,ga,'#090b17','#020309')}
function wmFade(u){return cl(1-u)}
// a "person" that can dissolve into particles
function wmPerson(x,y,s,u,col,face,t,P){const a=1-cl(u);if(a>0)skFig(x,y,s,P||STKP.stand,{col,a,face:face||'n',t,glow:u>0?14:0,gc:col});if(u>0&&u<1.6){for(let k=0;k<14;k++){const q=cl(u/1.5),px=x+(rnd(k)-.5)*70*s,py=y-92*s*(0.2+rnd(k+3)*1.2)-q*(80+rnd(k)*140);c.fillStyle=hexa(col,(1-q)*.9);c.beginPath();c.arc(px,py,3+rnd(k)*3,0,PI*2);c.fill()}}}
function mT(t,id,s,y=190,size=70,col='#fff',gc=WMC.ice){oShow(t-.1,(p)=>{c.save();c.translate(960,y);c.scale(p,p);oTxt(s,0,0,size,col,'center',800,24,gc);c.restore()},.3)}
// ---------- n00 ----------
SC.a_n00=(t)=>{const id='n00';mBg(t);wmPop(id,t);const gy=760;skFloor(gy,0,1920);
  const Td=oT(id,0,'disappears'),u=t-Td;
  for(let i=0;i<10;i++){const x=260+i*160,vanish=(i%2===1);const P=skWalk(t+i*.3,1.1,.4);skFig&&wmPerson(x,gy-90*1.0+Math.abs(Math.sin((t+i*.3)*PI*1.1*2))*3,1.0,vanish?u-.25*Math.floor(i/2):-1,vanish?WMC.rose:'#e9eeff','n',t,P)}
  oShow(t-oT(id,1,'about'),(p)=>{c.save();c.translate(960,330);c.scale(p,p);oTxt('ABOUT 4 BILLION PEOPLE',0,0,96,WMC.rose,'center',800,28);oTxt('NO WARNING · NO EXPLANATION',0,76,38,'rgba(244,246,255,.75)','center',800);c.restore()},.4);
  oShow(t-oT(id,2,'thought'),(p)=>{c.save();c.fillStyle='rgba(2,3,10,.7)';c.fillRect(0,0,1920,1080);c.translate(960,470);c.scale(p,p);oTxt('A THOUGHT EXPERIMENT.',0,-80,96,'#fff','center',800,24,WMC.ice);oTxt('NOT A PREDICTION.',0,20,70,WMC.amb,'center',800,18);oTxt('HOW MUCH QUIETLY RESTS ON THEM?',0,120,46,WMC.rose,'center',800,14);c.restore()},.4)};
// ---------- n01 hour one ----------
SC.a_n01=(t)=>{const id='n01';mBg(t);wmPop(id,t);const gy=800;skFloor(gy,0,1100);
  oShow(t-.3,(p)=>{c.save();c.translate(540,600);c.scale(p,p);oTxt('SILENCE.',0,-330,64,'#fff','center',800,22,WMC.ice);
    rr(-300,-30,600,16,6,'#2a2f4a');c.fillStyle='#1c2036';c.fillRect(-270,-14,12,160);c.fillRect(258,-14,12,160);
    // two mugs, one still steaming
    [-100,100].forEach((x,i)=>{rr(x-34,-90,68,60,10,'#3a4060');c.strokeStyle='#3a4060';c.lineWidth=8;c.beginPath();c.arc(x+42,-60,16,-PI/2,PI/2);c.stroke();if(i===0){c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=5;for(let k=0;k<3;k++){const o=mod(t*.7+k/3,1);c.globalAlpha=1-o;c.beginPath();c.moveTo(x-14+k*14,-96-o*40);c.quadraticCurveTo(x-6+k*14,-116-o*40,x-14+k*14,-136-o*40);c.stroke();c.globalAlpha=1}}});
    // empty chair
    c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=6;c.setLineDash([8,8]);c.beginPath();c.moveTo(150,0);c.lineTo(150,150);c.lineTo(230,150);c.moveTo(150,70);c.lineTo(230,70);c.stroke();c.setLineDash([]);oTxt('an empty chair',190,200,24,'rgba(244,246,255,.55)','center',700);
    skFig(-200,150-92*.8+10,.8,STKP.slump,{face:'sad',t,col:'#e9eeff',gy:150});c.restore()});
  // phone
  oShow(t-oT(id,0,'phones'),(p)=>{c.save();c.translate(1380,520);c.scale(p,p);rr(-190,-330,380,640,40,'#10131e','rgba(255,255,255,.3)',4);
    ['Mum','Sis','Wife','Friend'].forEach((n,i)=>{const on=t>oT(id,1,'millions')+i*.5-1;c.save();c.globalAlpha=on?1:.35;rr(-160,-250+i*118,320,96,18,'rgba(255,255,255,.07)');oTxt(n,-130,-216+i*118,34,'#fff','left',800);oTxt('calling…',-130,-176+i*118,22,WMC.amb,'left',700);const k=cl((t-oT(id,1,'never')+.5)/.8);if(k>0){c.globalAlpha=k;oTxt('NOT IN SERVICE',150,-196+i*118,16,WMC.red,'right',800)}c.restore()});c.restore()});
  oShow(t-oT(id,1,'beds'),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oChip('IN HOSPITALS, BEDS WITH NO ONE BESIDE THEM',0,0,30,WMC.rose);c.restore()})};
// ---------- n02 hospitals ----------
SC.a_n02=(t)=>{const id='n02';mBg(t,WMC.red);wmPop(id,t);
  mT(t,id,'THE HOSPITALS',190,72,'#fff',WMC.red);
  const T0=oT(id,1,'seventy');oShow(t-oT(id,0,'hospitals'),()=>{for(let i=0;i<10;i++){const x=270+(i%5)*150,y=330+Math.floor(i/5)*160;rr(x-55,y-20,110,70,10,'rgba(255,255,255,.07)','rgba(255,255,255,.25)',2);oTxt('bed',x,y+14,18,'rgba(244,246,255,.4)','center',700);
      const gone=[0,1,2,4,5,6,8].includes(i),u=gone?t-T0-i*.25:-1;wmPerson(x,y+110,.42,u,WMC.rose,'n',t)}},.3);
  oShow(t-T0,(p)=>{c.save();c.translate(1330,400);c.scale(p,p);oPanel(-340,-130,680,260,.8,hexa(WMC.rose,.6),26);oTxt('≈ 70%',0,-50,130,WMC.rose,'center',800,28);oTxt('OF THE HEALTH & SOCIAL CARE WORKFORCE',0,52,26,'#fff','center',800);oTxt('WHO · DELIVERED BY WOMEN, LED BY MEN · 2019',0,96,18,'rgba(244,246,255,.55)','center',700);c.restore()},.3);
  oShow(t-oT(id,1,'nurses'),(p)=>{c.save();c.translate(1330,690);c.scale(p,p);const u=t-oT(id,1,'nurses');for(let i=0;i<29;i++){const x=-336+(i%15)*48,y=-30+Math.floor(i/15)*46;const gone=i<24&&u>.3+i*.06;c.fillStyle=gone?'rgba(255,155,189,.2)':(i<24?WMC.rose:'#e9eeff');c.beginPath();c.arc(x,y,13,0,PI*2);c.fill()}oTxt('24 M of 28.5 M NURSES & MIDWIVES',0,70,26,WMC.rose,'center',800);c.restore()});
  oShow(t-oT(id,2,'patient'),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oChip('EVERY PATIENT, OF EVERY KIND, LESS SAFE',0,0,30,WMC.amb);c.restore()})};
// ---------- n03 schools + unpaid care ----------
SC.a_n03=(t)=>{const id='n03';mBg(t,WMC.amb);wmPop(id,t);
  mT(t,id,'THE SCHOOLS · THE UNPAID WORK',190,60,'#fff',WMC.amb);
  oShow(t-oT(id,1,'ninety'),(p)=>{c.save();c.translate(520,470);c.scale(p,p);oPanel(-380,-210,760,430,.75,hexa(WMC.amb,.5),26);oTxt('WOMEN AMONG TEACHERS',0,-170,26,WMC.amb,'center',800);
    [['PRE-PRIMARY',.94,'94%'],['PRIMARY',.67,'≈ 67%']].forEach(([n,v,l],i)=>{const y=-80+i*120;oTxt(n,-330,y-30,24,'#fff','left',800);rr(-330,y,660,36,18,'rgba(255,255,255,.1)');const k=eo((t-oT(id,1,'ninety')-i*.4)/1.2);rr(-330,y,Math.max(36,660*v*k),36,18,WMC.rose);oTxt(l,320,y-30,30,WMC.rose,'right',800)});
    const x=t-oT(id,1,'classrooms');if(x>0){c.save();c.globalAlpha=cl(x/.5);oTxt('CLASSROOMS CLOSE',0,150,42,WMC.red,'center',800,14);c.restore()}oTxt('UNESCO',0,196,18,'rgba(244,246,255,.5)','center',700);c.restore()},.3);
  oShow(t-oT(id,2,'international'),(p)=>{c.save();c.translate(1400,470);c.scale(p,p);oPanel(-380,-210,760,430,.75,hexa(WMC.rose,.5),26);oTxt('UNPAID CARE WORK · EVERY DAY',0,-170,26,WMC.rose,'center',800);
    const w=eo((t-oT(id,2,'seventy'))/1.4);c.lineWidth=40;c.lineCap='butt';c.strokeStyle='rgba(255,255,255,.12)';c.beginPath();c.arc(0,-10,110,0,PI*2);c.stroke();c.strokeStyle=WMC.rose;c.beginPath();c.arc(0,-10,110,-PI/2,-PI/2+PI*2*.762*w);c.stroke();oTxt('76%',0,-26,64,WMC.rose,'center',800,18);oTxt('BY WOMEN',0,28,22,'#fff','center',700);
    oTxt('16.4 B HOURS / DAY',0,150,34,'#fff','center',800);oTxt('ILO · 2018',0,190,18,'rgba(244,246,255,.5)','center',700);c.restore()},.3);
  oShow(t-oT(id,3,'stops'),(p)=>{c.save();c.fillStyle='rgba(2,3,10,.7)';c.fillRect(0,0,1920,1080);c.translate(960,520);c.scale(p,p);oTxt('IN NO BUDGET.',0,-60,90,'#fff','center',800,22);oTxt('IT STOPS ALL AT ONCE.',0,60,90,WMC.red,'center',800,26);c.restore()},.4)};
// ---------- n04 farms + economy ----------
SC.a_n04=(t)=>{const id='n04';mBg(t,WMC.grn);wmPop(id,t);
  mT(t,id,'THE FOOD · THE ECONOMY',190,64,'#fff',WMC.grn);
  oShow(t-oT(id,1,'women'),(p)=>{c.save();c.translate(520,480);c.scale(p,p);oPanel(-380,-210,760,430,.75,hexa(WMC.grn,.5),26);oTxt('FARMS · DEVELOPING COUNTRIES',0,-170,26,WMC.grn,'center',800);
    for(let r=0;r<4;r++)for(let k=0;k<10;k++){const x=-300+k*66,y=-100+r*58,gone=(r*10+k)%7<3&&t>oT(id,1,'missed')-1+.07*(r*10+k);c.strokeStyle=gone?'rgba(255,255,255,.12)':WMC.grn;c.lineWidth=5;c.beginPath();c.moveTo(x,y+20);c.lineTo(x,y-10);c.moveTo(x,y);c.lineTo(x-12,y-14);c.moveTo(x,y-4);c.lineTo(x+12,y-18);c.stroke()}
    oTxt('≈ 43%',-170,170,64,WMC.rose,'center',800,18);oTxt('OF THE FARM WORKFORCE (FAO)',90,170,22,'#fff','left',800);c.restore()},.3);
  oShow(t-oT(id,2,'workers'),(p)=>{c.save();c.translate(1400,480);c.scale(p,p);oPanel(-380,-210,760,430,.75,hexa(WMC.amb,.5),26);oTxt('2 IN 5 WORKERS GONE',0,-170,30,WMC.amb,'center',800);
    for(let i=0;i<40;i++){const x=-290+(i%10)*64,y=-100+Math.floor(i/10)*58,gone=(i%5<2)&&t>oT(id,2,'half')-.8+i*.03;c.fillStyle=gone?'rgba(255,255,255,.08)':'rgba(255,200,107,.8)';rr(x-18,y-18,36,36,6,c.fillStyle)}oTxt('SUPPLY CHAINS BEGIN TO BREAK',0,170,26,WMC.red,'center',800);c.restore()},.3)};
// ---------- n05 honest framing ----------
SC.a_n05=(t)=>{const id='n05';mBg(t,WMC.ice);wmPop(id,t);
  oShow(t-oT(id,0,'clear'),(p)=>{c.save();c.translate(960,200);c.scale(p,p);oTxt('BE CLEAR ABOUT ONE THING.',0,0,70,'#fff','center',800,22,WMC.ice);c.restore()},.3);
  oShow(t-oT(id,0,'capable'),(p)=>{c.save();c.translate(540,470);c.scale(p,p);oPanel(-360,-170,720,340,.78,hexa(WMC.grn,.6),30);oTxt('ABILITY',0,-100,38,WMC.grn,'center',800);oTxt('YES',0,10,150,WMC.grn,'center',800,26);oTxt('men can learn every one of these jobs',0,120,24,'#fff','center',700);c.restore()},.3);
  oShow(t-oT(id,1,'scale'),(p)=>{c.save();c.translate(1380,470);c.scale(p,p);oPanel(-360,-170,720,340,.78,hexa(WMC.red,.6),30);oTxt('SCALE × SPEED',0,-100,38,WMC.red,'center',800);const k=cl((t-oT(id,1,'replaced'))/3);rr(-300,-30,600,34,17,'rgba(255,255,255,.1)');rr(-300,-30,Math.max(34,600*.03*k+34),34,17,WMC.red);oTxt('RETRAIN 4,000,000,000 PEOPLE',0,60,28,'#fff','center',800);oTxt('after 1 week · 1 year · …',0,110,22,'rgba(244,246,255,.55)','center',700);c.restore()},.3);
  oShow(t-oT(id,1,'year'),(p)=>{c.save();c.translate(960,830);c.scale(p,p);oChip('NOT ABILITY. SCALE AND SPEED.',0,0,34,WMC.amb);c.restore()})};
// ---------- n06 grief ----------
SC.a_n06=(t)=>{const id='n06';mBg(t,WMC.ice,.1);wmPop(id,t);const gy=800;skFloor(gy,0,1920,'rgba(255,255,255,.12)');
  oShow(t-oT(id,0,'hardest'),(p)=>{c.save();c.translate(960,200);c.scale(p,p);oTxt('THE HARDEST LOSSES HAVE NO STATISTIC.',0,0,56,'#fff','center',800,22,WMC.ice);c.restore()},.4);
  // man by window
  c.save();c.fillStyle='rgba(155,196,255,.08)';rr(330,300,330,420,10,'rgba(155,196,255,.06)','rgba(255,255,255,.25)',3);c.beginPath();c.moveTo(495,300);c.lineTo(495,720);c.moveTo(330,510);c.lineTo(660,510);c.strokeStyle='rgba(255,255,255,.25)';c.stroke();c.restore();
  skFig(700,gy-92*1.2,1.2,STKP.slump,{face:'sad',t,col:'#dfe8ff',gy,dir:-1});
  const L=[['MOTHERS','mothers'],['DAUGHTERS','daughters'],['SISTERS','sisters'],['WIVES','wives'],['FRIENDS','friends'],['DOCTORS','doctors'],['TEACHERS','teachers'],['NEIGHBOURS','neighbours']];
  L.forEach(([n,nd],i)=>{oShow(t-oT(id,1,nd),(p)=>{c.save();c.globalAlpha*=.92;oTxt(n,1380,330+i*58,i===7?44:42,i%2?WMC.rose:'#fff','center',800,i%2?16:0);c.restore()},.5)});
  oShow(t-oT(id,2,'mourns'),(p)=>{c.save();c.translate(960,880);c.scale(p,p);oTxt('THE WORLD DOES NOT JUST RUN SHORT.  IT MOURNS.',0,0,40,WMC.amb,'center',800,18);c.restore()},.5)};
// ---------- n07 arithmetic ----------
SC.a_n07=(t)=>{const id='n07';mBg(t,WMC.red);wmPop(id,t);
  oShow(t-oT(id,0,'arithmetic'),(p)=>{c.save();c.translate(960,200);c.scale(p,p);oTxt('THE THOUGHT EXPERIMENT BECOMES ARITHMETIC.',0,0,52,'#fff','center',800,22,WMC.red);c.restore()},.3);
  oShow(t-oT(id,1,'births'),(p)=>{c.save();c.translate(520,470);c.scale(p,p);oPanel(-380,-200,760,400,.78,hexa(WMC.red,.6),28);oTxt('NEW BIRTHS',0,-150,28,'#fff','center',800);oTxt('0',0,-30,220,WMC.red,'center',800,30);oTxt('per day',0,100,34,'rgba(244,246,255,.6)','center',700);c.restore()},.3);
  oShow(t-oT(id,1,'frozen'),(p)=>{c.save();c.translate(1400,360);c.scale(p,p);oPanel(-380,-130,760,260,.78,hexa(WMC.ice,.6),28);oTxt('FROZEN EMBRYOS EXIST',0,-70,30,WMC.ice,'center',800);oTxt('…BUT THEY NEED A WOMB.',0,-10,34,'#fff','center',800);oTxt('No technology can carry a human pregnancy',0,50,22,'rgba(244,246,255,.7)','center',700);oTxt('from start to finish outside a body.',0,80,22,'rgba(244,246,255,.7)','center',700);c.restore()},.3);
  oShow(t-oT(id,1,'artificial'),(p)=>{c.save();c.translate(1400,640);c.scale(p,p);oPanel(-380,-110,760,220,.78,hexa(WMC.amb,.5),28);oTxt('ARTIFICIAL WOMBS: LAMBS · WEEKS (2017: 28 DAYS)',0,-50,24,WMC.amb,'center',800);oTxt('NEVER USED FOR A FULL HUMAN GESTATION',0,0,28,'#fff','center',800);oTxt('(aimed at premature babies, not conception to birth)',0,48,18,'rgba(244,246,255,.55)','center',700);c.restore()},.3);
  oShow(t-oT(id,2,'children'),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oChip('THE LAST CHILDREN BORN ARE ALREADY GROWING UP',0,0,30,WMC.rose);c.restore()})};
// ---------- n08 aging ----------
SC.a_n08=(t)=>{const id='n08';mBg(t,WMC.ice,.12);wmPop(id,t);
  oShow(t-oT(id,0,'older'),(p)=>{c.save();c.translate(960,200);c.scale(p,p);oTxt('A WORLD OF OLDER AND OLDER PEOPLE.',0,0,60,'#fff','center',800,22,WMC.ice);c.restore()},.3);
  // age pyramid inverting
  c.save();c.translate(520,560);oPanel(-380,-240,760,460,.7,hexa(WMC.ice,.4),26);const u=eo((t-1)/9);
  for(let i=0;i<10;i++){const y=170-i*38,base=(300-i*26),cur=base*(1-u)+(60+Math.max(0,i-4)*54)*u*(i>=4?1:.15);rr(-cur/2,y,Math.max(8,cur),30,6,hexa(i>=7?WMC.red:WMC.ice,.7))}oTxt('AGE →',-340,180,18,'rgba(244,246,255,.5)','left',700);oTxt('0',-340,170,16,'rgba(244,246,255,.4)','left',700);oTxt('100',-340,-190,16,'rgba(244,246,255,.4)','left',700);c.restore();
  oShow(t-oT(id,1,'schools'),(p)=>{c.save();c.translate(1400,400);c.scale(p,p);oPanel(-380,-130,760,260,.78,hexa(WMC.amb,.5),28);oTxt('SCHOOLS EMPTY · NO STUDENTS',0,-60,32,WMC.amb,'center',800);oTxt('CARE HOMES · NO ONE LEFT TO CARE',0,10,32,'#fff','center',800);oTxt('Year 10 · 30 · 50',0,70,22,'rgba(244,246,255,.55)','center',700);c.restore()},.3);
  oShow(t-oT(id,1,'seventy'),(p)=>{c.save();c.translate(1400,650);c.scale(p,p);oChip('GLOBAL LIFE EXPECTANCY ≈ 73 YEARS',0,0,30,WMC.ice);c.restore()});
  oShow(t-oT(id,2,'fewer'),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oTxt('EVERY YEAR, FEWER OF US.',0,0,54,WMC.red,'center',800,22);c.restore()},.4)};
// ---------- n09 last light ----------
SC.a_n09=(t)=>{const id='n09';c.fillStyle='#04050c';c.fillRect(0,0,1920,1080);wmPop(id,t);const gy=800;
  const Tl=oT(id,0,'light');
  // skyline of windows going dark
  for(let i=0;i<18;i++){const x=120+i*98,h=220+rnd(i)*280;c.fillStyle='#0b0e1b';c.fillRect(x,gy-h,80,h);for(let r=0;r<Math.floor(h/46);r++)for(let k=0;k<2;k++){const on=rnd(i*13+r*3+k)>(.25+.7*cl((t-.5)/(Tl-.5+.001)))&&true;c.fillStyle=on?'rgba(255,214,140,.85)':'rgba(255,255,255,.04)';c.fillRect(x+12+k*34,gy-h+14+r*46,24,26)}}
  skFloor(gy,0,1920,'rgba(255,255,255,.12)');
  // last person + lamp
  const lampOn=t<Tl+.2;c.save();if(lampOn){oGlow(960,gy-200,260,WMC.amb,.45)}c.fillStyle=lampOn?'#ffd28a':'#2a2c3a';c.fillRect(1000,gy-190,10,190);c.beginPath();c.moveTo(980,gy-190);c.lineTo(1030,gy-190);c.lineTo(1016,gy-230);c.lineTo(994,gy-230);c.fill();c.restore();
  skFig(900,gy-92*1.1,1.1,{...STKP.stand,tl:.2,hd:.2,la:[.4,.4]},{face:'sad',t,col:'#dfe8ff',gy,dir:1});
  oShow(t-oT(id,1,'species'),(p)=>{c.save();c.translate(960,250);c.scale(p,p);oTxt('300,000 YEARS',0,-40,110,'#fff','center',800,24,WMC.ice);oTxt('BUILDING EVERYTHING WE KNOW',0,40,40,'rgba(244,246,255,.75)','center',800);c.restore()},.4);
  oShow(t-oT(id,1,'ends'),(p)=>{c.save();c.translate(960,440);c.scale(p,p);oTxt('ENDS IN ABOUT A CENTURY.',0,0,64,WMC.red,'center',800,22);c.restore()},.4);
  c.save();c.fillStyle='#000';c.globalAlpha=cl((t-oT(id,1,'half'))/3.2);c.fillRect(0,0,1920,1080);c.restore();oShow(t-oT(id,1,'half'),(p)=>{c.save();c.translate(960,520);c.scale(p,p);oTxt('BECAUSE HALF OF IT WAS GONE.',0,0,64,'#fff','center',800,22,WMC.rose);c.restore()},.6)};
// ---------- n10 respect ----------
SC.a_n10=(t)=>{const id='n10';mBg(t,WMC.amb,.2);wmPop(id,t);
  oShow(t-oT(id,0,'point'),(p)=>{c.save();c.translate(960,200);c.scale(p,p);oTxt('THE POINT IS NOT DESPAIR.  IT IS RESPECT.',0,0,60,'#fff','center',800,22,WMC.amb);c.restore()},.3);
  oShow(t-oT(id,1,'health'),(p)=>{c.save();c.translate(520,500);c.scale(p,p);oPanel(-380,-190,760,380,.78,hexa(WMC.rose,.6),28);oTxt('HEALTH WORKERS vs SENIOR ROLES (WHO)',0,-140,24,WMC.rose,'center',800);
    [['WORKFORCE',.70,'≈ 70% WOMEN'],['SENIOR ROLES',.25,'≈ 25% WOMEN']].forEach(([n,v,l],i)=>{const y=-70+i*120;oTxt(n,-340,y-30,22,'#fff','left',800);rr(-340,y,680,38,19,'rgba(255,255,255,.1)');const k=eo((t-oT(id,1,'health')-i*.7)/1.2);rr(-340,y,Math.max(38,680*v*k),38,19,WMC.rose);oTxt(l,340,y-30,26,WMC.rose,'right',800)});c.restore()},.3);
  oShow(t-oT(id,1,'unpaid'),(p)=>{c.save();c.translate(1400,500);c.scale(p,p);oPanel(-380,-190,760,380,.78,hexa(WMC.amb,.6),28);oTxt('UNPAID CARE WORK (ILO)',0,-140,24,WMC.amb,'center',800);oTxt('≈ $11 TRILLION',0,-30,86,'#fff','center',800,22,WMC.amb);oTxt('≈ 9% OF GLOBAL OUTPUT · MOSTLY DONE BY WOMEN',0,56,24,'#fff','center',800);oTxt('(valued at minimum wage, 2011 PPP)',0,100,18,'rgba(244,246,255,.55)','center',700);c.restore()},.3);
  oShow(t-oT(id,2,'depends'),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oTxt('A WORLD THAT DEPENDS ON THEM THIS MUCH SHOULD SEE THEM THIS MUCH.',0,0,34,'#fff','center',800,16,WMC.amb);c.restore()},.4)};
// ---------- n11 close ----------
SC.a_n11=(t)=>{const id='n11';mBg(t,WMC.amb,.3);const gy=800;skFloor(gy,0,1920);
  oShow(t-oT(id,0,'nobody'),(p)=>{c.save();c.translate(960,210);c.scale(p,p);oTxt('NOBODY DISAPPEARS.  NOT TODAY.',0,0,70,'#fff','center',800,24,WMC.amb);c.restore()},.4);
  const Tk=oT(id,0,'thank');['SEE THE WORK','THANK THEM','SHARE IT','PAY FOR IT','STOP CALLING IT NOTHING'].forEach((n,i)=>{oShow(t-(oT(id,0,['see','thank','share','pay','stop'][i])),(p)=>{c.save();c.translate(960,330+i*68);c.scale(p,p);oTxt(n,0,0,46,i===4?WMC.red:WMC.amb,'center',800,14);c.restore()},.3)});
  // phone call
  const call=cl((t-oT(id,1,'tell'))/1);skFig(520,gy-92*1.15,1.15,skMix(STKP.stand,{tl:0,hd:.05,la:[1.7,2.2],ra:[-.1,.2],ll:[.05,0],rl:[-.05,0]},call),{face:'smile',t,glow:12,gc:WMC.amb,gy});
  oShow(t-oT(id,1,'name'),(p)=>{c.save();c.translate(1400,760);c.scale(p,p);oChip('SAY HER NAME IN THE COMMENTS',0,0,34,WMC.rose);c.restore()},.3)};
// ---------- nend ----------
SC.a_nend=(t)=>{mBg(t,WMC.amb,.34);const gy=820;c.fillStyle='#0b0d18';c.fillRect(0,gy,1920,260);
  // lit window house
  c.save();c.translate(960,gy);c.fillStyle='#10131f';c.fillRect(-170,-210,340,210);c.beginPath();c.moveTo(-200,-210);c.lineTo(0,-330);c.lineTo(200,-210);c.fill();const f=.7+.3*Math.sin(t*3);c.fillStyle=`rgba(255,200,120,${f})`;c.shadowColor=WMC.amb;c.shadowBlur=60;c.fillRect(-70,-150,60,70);c.fillRect(30,-150,60,70);c.restore();oGlow(960,gy-110,420,WMC.amb,.4);
  oShow(t-.8,(p)=>{c.save();c.translate(960,380);c.scale(p,p);oTxt('NOTICE THE WORK.',0,0,150,'#fff','center',800,30,WMC.amb);c.restore()},.5);
  oShow(t-3.2,()=>{oTxt('IF ALL WOMEN DISAPPEARED  ·  A THOUGHT EXPERIMENT',960,960,30,'rgba(244,246,255,.6)','center',800);oTxt('Say her name in the comments.',960,1010,26,WMC.amb,'center',800)})};
