// ---------- x05 nanosecond ----------
SC.a_x05=(t)=>{const id='x05',A=aT(id),L=A.lines;tmBg(t,'#06101a','#010208',TMC.cyan,.2);tmHud(id,t);
  // ruler 30 cm
  const x0=260,x1=1660,y=560;c.save();rr(x0-20,y-40,x1-x0+40,80,10,'rgba(255,207,107,.16)','rgba(255,207,107,.7)',4);for(let i=0;i<=30;i++){c.fillStyle='rgba(255,207,107,.8)';c.fillRect(x0+i*(x1-x0)/30,y-40,i%5?2:4,i%5?24:44);if(i%5===0)oTxt(String(i),x0+i*(x1-x0)/30,y+16,24,TMC.gold,'center',800)}c.restore();oTxt('centimetres',960,y+84,26,OC.dim,'center',700);
  const u=mod(t*.9,1.3);const px=x0+Math.min(1,u/1)*(x1-x0);if(u<1.1){oGlow(px,y,90,TMC.cyan,.8);c.fillStyle='#fff';c.shadowColor=TMC.cyan;c.shadowBlur=24;c.beginPath();c.arc(px,y,12,0,PI*2);c.fill();c.shadowBlur=0}
  oShow(t-oT(id,1,'thirty'),(p)=>{c.save();c.translate(960,380);c.scale(p,p);oTxt('30 cm  =  ONE FOOT',0,0,100,'#fff','center',800,28,TMC.cyan);c.restore()});
  // cpu
  oShow(t-oT(id,1,'processor'),()=>{c.save();c.translate(300,730);rr(-90,-60,180,120,14,'#101a2c',TMC.vio,3);for(let i=0;i<6;i++){c.fillStyle=TMC.vio;c.fillRect(-70+i*28,-76,8,16);c.fillRect(-70+i*28,60,8,16)}const k=Math.floor(t*5);for(let q=0;q<4;q++){c.fillStyle=hexa(TMC.cyan,mod(t*5-q*.5,2)<.5?.95:.2);c.fillRect(-60+q*30,-24,20,48)}c.restore();oTxt('SEVERAL STEPS PER NANOSECOND',420,730,24,TMC.vio,'left',800)});
  oShow(t-oT(id,2,'hopper'),(p)=>{c.save();c.translate(1380,740);c.scale(p,p);oPanel(-380,-70,760,140,.65,hexa(TMC.gold,.5));oTxt('GRACE HOPPER · THE NANOSECOND WIRE',0,-24,32,TMC.gold,'center',800);oTxt('"why computers cannot be faster than light"',0,28,26,OC.dim,'center',600);c.restore()});
};
// ---------- x06 microsecond ----------
SC.a_x06=(t)=>{const id='x06',A=aT(id),L=A.lines;tmBg(t,'#0b0a18','#010208',TMC.red,.2);tmHud(id,t);
  oPanel(110,260,860,610,.4,hexa(TMC.red,.3));oPanel(990,260,820,610,.4,hexa(TMC.cyan,.3));
  oTxt('THE EARLY UNIVERSE · ~10⁻⁶ s',540,300,30,TMC.red,'center',800);
  // quarks gather into protons
  const g=cl((t-oT(id,1,'cooled'))/4),cols=[TMC.red,TMC.grn,TMC.cyan];
  for(let i=0;i<9;i++){const gx=250+(i%3)*270,gy=450+Math.floor(i/3)*140;for(let q=0;q<3;q++){const a0=rnd(i*3+q)*PI*2,r0=30+rnd(i*5+q)*130;const sx=gx+Math.cos(a0)*r0*3*(1-g)+Math.cos(q*2.09+t)*(26*g),sy=gy+Math.sin(a0)*r0*1.2*(1-g)+Math.sin(q*2.09+t)*(26*g);c.fillStyle=cols[q];c.shadowColor=cols[q];c.shadowBlur=14;c.beginPath();c.arc(sx,sy,12,0,PI*2);c.fill()}if(g>.8){c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=3;c.beginPath();c.arc(gx,gy,44,0,PI*2);c.stroke()}}
  oShow(t-oT(id,1,'protons'),()=>{oChip('QUARKS  →  PROTONS & NEUTRONS',540,830,32,TMC.red)});
  // light crossing 300 m
  oTxt('TODAY · LIGHT IN ONE MICROSECOND',1400,300,28,TMC.cyan,'center',800);
  c.save();c.fillStyle='#0d1830';for(let i=0;i<9;i++){const bh=80+rnd(i*3)*200;c.fillRect(1030+i*84,760-bh,70,bh)}c.restore();
  const u=mod(t*.8,1.25);if(u<1.1){const px=1030+Math.min(1,u)*760;oGlow(px,700,80,TMC.cyan,.8);c.fillStyle='#fff';c.beginPath();c.arc(px,700,10,0,PI*2);c.fill()}
  oShow(t-oT(id,2,'three'),(p)=>{c.save();c.translate(1400,830);c.scale(p,p);oChip('300 METRES  ≈  3 FOOTBALL FIELDS',0,0,32,TMC.cyan);c.restore()});
};
// ---------- x07 millisecond ----------
SC.a_x07=(t)=>{const id='x07',A=aT(id),L=A.lines;tmBg(t,'#0b1018','#010208',TMC.grn,.2);tmHud(id,t);
  // neuron spike graph
  oPanel(110,260,860,560,.45,hexa(TMC.grn,.3));oTxt('ONE NERVE SPIKE · ≈ 1 ms',540,300,30,TMC.grn,'center',800);
  const sp=mod(t*.5,1.4);c.save();c.strokeStyle=TMC.grn;c.lineWidth=7;c.shadowColor=TMC.grn;c.shadowBlur=16;c.beginPath();for(let x=0;x<=700;x+=4){const u=x/700,v=Math.exp(-Math.pow((u-sp/1.4)*14,2));const y=620-(v*320)+(u>sp/1.4+.05&&u<sp/1.4+.18?60*Math.exp(-Math.pow((u-sp/1.4-.1)*30,2)):0);x===0?c.moveTo(190,620):c.lineTo(190+x,y)}c.stroke();c.restore();
  // axon with traveling dot
  c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=10;c.beginPath();c.moveTo(190,720);c.lineTo(890,720);c.stroke();const nx=190+700*(sp/1.4);oGlow(nx,720,60,TMC.grn,.8);c.fillStyle='#fff';c.beginPath();c.arc(nx,720,10,0,PI*2);c.fill();
  oShow(t-oT(id,1,'storm'),(p)=>{c.save();c.translate(540,780);c.scale(p,p);oTxt('EVERY THOUGHT: A STORM OF THESE',0,0,28,OC.dim,'center',800);c.restore()});
  // hummingbird
  oPanel(990,260,820,560,.45,hexa(TMC.pink,.3));oTxt('A HUMMINGBIRD · DOZENS OF BEATS / SECOND',1400,300,28,TMC.pink,'center',800);
  c.save();c.translate(1400,560);const wf=Math.sin(t*40);c.fillStyle='#2f9a7a';c.beginPath();c.ellipse(0,0,100,40,-.15,0,PI*2);c.fill();c.fillStyle='#9bff7a';c.beginPath();c.ellipse(-30,-6,50,26,-.15,0,PI*2);c.fill();c.strokeStyle='#e8ffd0';c.lineWidth=4;c.beginPath();c.moveTo(100,-8);c.lineTo(250,-20);c.stroke();c.fillStyle='#1a1a1a';c.beginPath();c.arc(70,-14,5,0,PI*2);c.fill();
  for(let k=0;k<2;k++){c.save();c.rotate(-.5+wf*.9*(k?-1:1)+(k?.9:0));c.globalAlpha=.55;c.fillStyle='#bff0ff';c.beginPath();c.ellipse(-20,-80,22,90,0,0,PI*2);c.fill();c.restore()}c.restore();
  oShow(t-oT(id,2,'slow'),(p)=>{c.save();c.translate(1400,780);c.scale(p,p);oChip('FOR A HUMMINGBIRD, YOU MOVE IN SLOW MOTION',0,0,30,TMC.pink);c.restore()});
  tmEgg(1700,320,t,.7,.55);
};
// ---------- x08 tenth of a second ----------
SC.a_x08=(t)=>{const id='x08',A=aT(id),L=A.lines;tmBg(t,'#0b0a14','#010208',TMC.vio,.2);tmHud(id,t);
  // eye blink
  c.save();c.translate(540,520);const bl=Math.max(0,Math.sin(t*3.2))>.9?1:0,open=1-bl*.95;c.fillStyle='#e8eaff';c.beginPath();c.ellipse(0,0,230,150*open,0,0,PI*2);c.fill();if(open>.2){c.fillStyle=TMC.vio;c.beginPath();c.arc(0,0,86*Math.min(1,open*1.2),0,PI*2);c.fill();c.fillStyle='#05060c';c.beginPath();c.arc(0,0,42*Math.min(1,open*1.2),0,PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(-24,-24,12,0,PI*2);c.fill()}c.restore();
  oTxt('A BLINK · A FEW TENTHS OF A SECOND',540,730,28,TMC.vio,'center',800);
  // ruler drop reaction
  oPanel(990,260,820,560,.45,hexa(TMC.gold,.3));oTxt('REACTION TIME',1400,300,30,TMC.gold,'center',800);
  const td=oT(id,1,'sprinting'),f=cl((t-td)/2);
  [['SPRINTER LIMIT','0.10 s',.1/.3,TMC.cyan],['NORMAL','≈ 0.25 s',.25/.3,TMC.gold]].forEach(([n,v,w,col],i)=>{const y=430+i*150,u=eo((t-td-.3-i*.8)/1.2);oTxt(n,1030,y-34,26,col,'left',800);rr(1030,y-10,700,44,22,'rgba(255,255,255,.07)');rr(1030,y-10,700*w*u,44,22,col);oTxt(v,1740,y+12,34,'#fff','right',800)});
  oShow(t-oT(id,2,'eyes'),(p)=>{c.save();c.translate(1400,750);c.scale(p,p);oTxt('EYES  →  BRAIN  →  HAND',0,0,40,'#fff','center',800,16);c.restore()});
  oShow(t-oT(id,2,'past'),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oChip('YOU ARE ALWAYS LIVING A LITTLE IN THE PAST',0,0,36,TMC.vio);c.restore()});
};
// ---------- x09 one second ----------
SC.a_x09=(t)=>{const id='x09',A=aT(id),L=A.lines;tmBg(t,'#081018','#010208',TMC.gold,.2);tmHud(id,t);
  const sec=mod(t,1);
  tmClock(500,560,210,sec,TMC.gold);
  // earth + light loops
  oShow(t-oT(id,1,'light'),()=>{c.save();c.translate(1150,500);c.fillStyle='#1c4a7a';c.beginPath();c.arc(0,0,86,0,PI*2);c.fill();c.fillStyle='#2e8f5a';c.beginPath();c.ellipse(-20,-20,30,24,.4,0,PI*2);c.ellipse(30,28,24,18,-.3,0,PI*2);c.fill();const an=sec*7.5*PI*2;c.fillStyle='#fff';c.shadowColor=TMC.cyan;c.shadowBlur=18;c.beginPath();c.arc(Math.cos(an)*112,Math.sin(an)*112,9,0,PI*2);c.fill();c.restore();oTxt('7.5 LAPS',1150,650,40,TMC.cyan,'center',800)});
  oShow(t-oT(id,1,'moon'),()=>{c.save();c.translate(1560,500);c.fillStyle='#cfd6e6';c.beginPath();c.arc(0,0,40,0,PI*2);c.fill();c.restore();oTxt('MOON: 1.28 s',1560,590,34,TMC.ice,'center',800);c.strokeStyle='rgba(95,224,255,.6)';c.setLineDash([10,10]);c.lineWidth=3;c.beginPath();c.moveTo(1240,500);c.lineTo(1510,500);c.stroke();c.setLineDash([])});
  // notifications
  const tn=oT(id,2,'notification');for(let i=0;i<6;i++){const u=t-tn-i*.5;oShow(u,(p)=>{c.save();c.translate(1150+(i%3)*190,740);c.scale(p,p);if(i<3){rr(-80,-34,160,68,18,'rgba(255,61,87,.2)',TMC.red,3);oTxt(['BUZZ','NEW','AUTOPLAY'][i],0,0,28,TMC.red,'center',800)}c.restore()})}
  oShow(t-oT(id,2,'rung'),(p)=>{c.save();c.translate(960,825);c.scale(p,p);oChip('THE RUNG WHERE ATTENTION IS STOLEN — AND WON BACK',0,0,34,TMC.gold);c.restore()});
};
// ---------- x10 minutes ----------
SC.a_x10=(t)=>{const id='x10',A=aT(id),L=A.lines;tmBg(t,'#100a10','#020208',TMC.gold,.2);tmHud(id,t);
  // left: nucleosynthesis
  oPanel(110,260,860,600,.45,hexa(TMC.red,.3));oTxt('THE FIRST 3 MINUTES',540,300,32,TMC.red,'center',800);
  const g=cl((t-oT(id,0,'three'))/6);
  for(let k=0;k<3;k++){const cx=290+k*250,cy=560;const mix=eo(g*1.3-k*.18);for(let i=0;i<4;i++){const a0=rnd(k*9+i)*PI*2,r0=140*(1-mix);const px=cx+Math.cos(a0)*r0+Math.cos(i*1.57+t*2)*18*mix,py=cy+Math.sin(a0)*r0*.8+Math.sin(i*1.57+t*2)*18*mix;c.fillStyle=i%2?TMC.red:TMC.cyan;c.shadowColor=c.fillStyle;c.shadowBlur=12;c.beginPath();c.arc(px,py,17,0,PI*2);c.fill()}c.shadowBlur=0;if(mix>.9)oTxt('He',cx,cy+70,30,'#fff','center',800)}
  [['HYDROGEN','hydrogen'],['HELIUM','helium'],['LITHIUM (TRACE)','lithium']].forEach(([n,nd],i)=>oShow(t-oT(id,0,nd),()=>{oChip(n,290+i*250,760,24,TMC.red)}));
  // right: sunlight 8m20
  oPanel(990,260,820,600,.45,hexa(TMC.gold,.3));oTxt('SUNLIGHT · 8 MIN 20 S',1400,300,32,TMC.gold,'center',800);
  const tsun=oT(id,1,'sunlight'),u=cl((t-tsun)/9);c.save();oGlow(1100,560,170,TMC.gold,.7);c.fillStyle=TMC.gold;c.beginPath();c.arc(1100,560,70,0,PI*2);c.fill();c.fillStyle='#1c4a7a';c.beginPath();c.arc(1700,560,36,0,PI*2);c.fill();c.strokeStyle='rgba(255,207,107,.35)';c.setLineDash([10,10]);c.lineWidth=3;c.beginPath();c.moveTo(1180,560);c.lineTo(1660,560);c.stroke();c.setLineDash([]);const px=1180+u*480;c.fillStyle='#fff';c.shadowColor=TMC.gold;c.shadowBlur=22;c.beginPath();c.arc(px,560,10,0,PI*2);c.fill();c.restore();
  const sec=Math.floor(u*500);oTxt(String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0'),1400,700,90,'#fff','center',800,20,TMC.gold);
  oShow(t-oT(id,1,'vanished'),(p)=>{c.save();c.translate(1400,800);c.scale(p,p);oChip('IF THE SUN VANISHED: 8 MINUTES OF NOTHING',0,0,28,TMC.gold);c.restore()});
};
// ---------- x11 day / year ----------
SC.a_x11=(t)=>{const id='x11',A=aT(id),L=A.lines;tmBg(t,'#071018','#010208',TMC.cyan,.18);tmHud(id,t);
  // left: day
  oPanel(110,260,860,540,.4,hexa(TMC.gold,.3));const td=oT(id,0,'eighty');
  oShow(t-td,()=>{c.save();c.translate(540,520);c.fillStyle='#1c4a7a';c.beginPath();c.arc(0,0,170,0,PI*2);c.fill();c.save();c.beginPath();c.arc(0,0,170,0,PI*2);c.clip();c.fillStyle='rgba(5,8,20,.72)';c.beginPath();c.arc(0,0,172,-PI/2+t*.5,PI/2+t*.5);c.closePath();c.fill();c.restore();c.fillStyle='#2e8f5a';c.beginPath();c.ellipse(Math.cos(t*.5)*40,-30,50,36,.4,0,PI*2);c.fill();c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=3;c.beginPath();c.arc(0,0,172,0,PI*2);c.stroke();c.restore();oTxt('86,400 SECONDS',540,330,38,TMC.gold,'center',800);oTxt('ONE ROTATION',540,760,30,OC.dim,'center',800)});
  // right: year
  oPanel(990,260,820,540,.4,hexa(TMC.cyan,.3));const ty=oT(id,1,'thirty');
  oShow(t-ty,()=>{c.save();c.translate(1400,520);c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=3;c.beginPath();c.ellipse(0,0,250,170,0,0,PI*2);c.stroke();oGlow(0,0,120,TMC.gold,.7);c.fillStyle=TMC.gold;c.beginPath();c.arc(0,0,38,0,PI*2);c.fill();const a=t*.35;c.fillStyle='#1c6aa8';c.shadowColor=TMC.cyan;c.shadowBlur=18;c.beginPath();c.arc(Math.cos(a)*250,Math.sin(a)*170,20,0,PI*2);c.fill();c.restore();oTxt('31.5 MILLION SECONDS',1400,330,34,TMC.cyan,'center',800);oTxt('≈ 100,000 KM/H AROUND THE SUN',1400,760,28,OC.dim,'center',800)});
  ['habits','seasons','learning'].forEach((nd,i)=>oShow(t-oT(id,2,nd),(p)=>{c.save();c.translate(540+i*420,832);c.scale(p,p);oChip(['HABITS','SEASONS','LEARNING'][i],0,0,34,TMC.grn);c.restore()}));
  tmEgg(1700,420,t,.7,.5);
};
// ---------- x12 life ----------
SC.a_x12=(t)=>{const id='x12',A=aT(id),L=A.lines;tmBg(t,'#0a0a18','#010208',TMC.cyan,.18);tmHud(id,t);
  const t0=oT(id,0,'eighty'),n=Math.min(80,Math.floor((t-t0)*14));
  oTxt('2,500,000,000 SECONDS',960,290,100,TMC.gold,'center',800,30);
  for(let i=0;i<80;i++){const x=290+(i%20)*70,y=360+Math.floor(i/20)*62,on=i<n;c.fillStyle=on?hexa(TMC.cyan,.35+.6*(i/80)):'rgba(255,255,255,.07)';rr(x,y,56,48,10,c.fillStyle)}
  oTxt('80 YEARS',960,640,40,TMC.cyan,'center',800);
  // sliver vs universe
  const ts=oT(id,1,'universe');oShow(t-ts,()=>{c.save();oPanel(210,690,1500,100,.6,hexa(TMC.vio,.4));rr(250,735,1420,36,18,'rgba(155,123,255,.5)');c.fillStyle='#fff';c.fillRect(250,730,2,46);oTxt('UNIVERSE · 435,000,000,000,000,000 s',960,712,24,TMC.vio,'center',800);c.restore()});
  oShow(t-oT(id,1,'millionth'),(p)=>{c.save();c.translate(1400,640);c.scale(p,p);oChip('YOUR LIFE  <  0.000001 % OF THAT',0,0,30,TMC.gold);c.restore()});
  oShow(t-oT(id,2,'only'),(p)=>{c.save();c.translate(960,835);c.scale(p,p);oTxt('THE ONLY TIME YOU GET TO BE YOU',0,0,52,'#fff','center',800,20,TMC.cyan);c.restore()},.3);
};
