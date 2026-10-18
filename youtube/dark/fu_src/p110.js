// ---------- FU: "claim check" film on the flying Roadster and "money won't matter in 2036" (wide 1920, film letterbox) ----------
const FUC={st:'#7fb2ff',org:'#ff8a3d',grn:'#5fd49a',red:'#ff5a5a',yel:'#ffd166',wht:'#f2f6ff',dim:'#8c97ad'};
function fuBg(t,tint='#7fb2ff'){c.fillStyle=lg(0,0,0,1080,[[0,'#090c13'],[1,'#12161f']]);c.fillRect(0,0,1920,1080);c.save();c.globalAlpha=.05;c.strokeStyle='#9fb6e8';c.lineWidth=1;for(let i=-10;i<50;i++){c.beginPath();c.moveTo(i*60,0);c.lineTo(i*60+400,1080);c.stroke()}c.restore();oGlow(1500,260,800,tint,.08+.02*Math.sin(t*.5));oGlow(300,950,600,FUC.org,.035)}
function fuTag(u,x,y,s,col=FUC.st,size=28){oShow(u,(p)=>{c.save();c.translate(x,y);c.scale(p,p);oChip(s,0,0,size,col);c.restore()})}
function fuCard(u,x,y,w,h,lab,txt,col=FUC.st,sz=32,big=null){oShow(u,(p)=>{c.save();c.translate(x+w/2,y+h/2);c.scale(p,p);c.translate(-w/2,-h/2);oPanel(0,0,w,h,.76,hexa(col,.55),20);oTxt(lab,26,30,21,col,'left',900);let yy=70;if(big){oFit(big,26,yy+34,w-52,64,'#fff','left',900,10,col);yy+=76}ccWrap(txt,26,yy+10,w-52,sz,'#eef3ff',sz*1.28,'left',700,4);c.restore()})}
function fuHead(t,s,sub,col=FUC.st){oShow(t-.1,()=>{oFit(s,960,160,1500,54,'#fff','center',900,14,col);if(sub)oTxt(sub,960,214,24,FUC.dim,'center',700)})}
function fuCar(x,y,rot,s,flame=0){c.save();c.translate(x,y);c.rotate(rot);c.scale(s,s);
 c.fillStyle='#f2f6ff';c.strokeStyle='#7fb2ff';c.lineWidth=4;c.beginPath();c.moveTo(-100,0);c.quadraticCurveTo(-96,-22,-60,-26);c.lineTo(-30,-48);c.quadraticCurveTo(0,-56,34,-48);c.lineTo(62,-26);c.quadraticCurveTo(100,-22,104,0);c.closePath();c.fill();c.stroke();
 c.fillStyle='#1b2740';c.beginPath();c.moveTo(-26,-30);c.lineTo(-10,-44);c.lineTo(28,-44);c.lineTo(48,-28);c.closePath();c.fill();
 [[-62,4],[64,4]].forEach(([wx,wy])=>{c.fillStyle='#0a0d14';c.beginPath();c.arc(wx,wy,19,0,PI*2);c.fill();c.strokeStyle='#9fb6e8';c.stroke()});
 if(flame>0){c.save();c.globalCompositeOperation='lighter';[-70,70].forEach((fx)=>{c.fillStyle=rg(fx,34,2,60*flame,[[0,'rgba(255,210,150,.95)'],[1,'rgba(255,100,40,0)']]);c.beginPath();c.ellipse(fx,34+30*flame,16,50*flame,0,0,PI*2);c.fill()});c.restore()}
 c.restore()}
SC.a_f00=(t)=>{const L=ATM.f00.lines;fuBg(t);
 oShow(t-.1,()=>oChip('CLAIM CHECK',960,150,30,FUC.org));
 const cc=(u,x,lab,big,sub,col)=>oShow(u,(p)=>{c.save();c.translate(x,470);c.scale(p,p);oPanel(-390,-200,780,400,.78,hexa(col,.6),26);oTxt(lab,0,-150,24,col,'center',900);oFit(big,0,-30,700,110,'#fff','center',900,22,col);ccWrap(sub,0,90,680,28,'#cfd8ee',36,'center',700,3);c.restore()});
 cc(t-(L[0]+1.2),520,'CLAIM 1 · SHOWN OCT 15, 2026','A FLYING CAR','Tesla Roadster demo at a SpaceX test site',FUC.st);
 cc(t-(L[1]+.6),1400,'CLAIM 2 · SAID JULY 2026','"MONEY WON\'T MATTER IN 2036"','Musk, in an interview with The Economist',FUC.org);
 oShow(t-(L[2]+.2),(p)=>{c.save();c.translate(960,470);c.scale(p,p);oTxt('?',0,0,200,'#fff','center',900,40,FUC.yel);c.restore()});
 [['WHAT WAS SHOWN',FUC.st],['WHAT WAS PROMISED',FUC.org],['WHAT WOULD HAVE TO BE TRUE',FUC.grn]].forEach((q,i)=>fuTag(t-(L[2]+1.2+i*1),420+i*540,800,q[0],q[1],26));ctVignette(.6)};
SC.a_f01=(t)=>{const L=ATM.f01.lines;fuBg(t);fuHead(t,'THE DEMO · OCT 15, 2026','SpaceX test site · McGregor, Texas');
 // stage
 c.fillStyle='#0d121b';c.fillRect(0,760,1920,320);c.strokeStyle='rgba(127,178,255,.35)';c.lineWidth=3;c.beginPath();c.moveTo(0,760);c.lineTo(1920,760);c.stroke();
 const u0=L[1]+.5,u=Math.max(0,Math.min(1,(t-u0)/(L[2]-L[1]-1)));
 // ramp (curved)
 c.save();c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=10;c.lineCap='round';c.beginPath();for(let i=0;i<=40;i++){const q=i/40,x=420+q*380,y=760-q*q*360;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();c.restore();
 // path keyframes
 const K=[[0,230,730,0],[.18,420,730,0],[.34,700,520,-.9],[.46,800,410,-PI],[.58,900,420,-PI-.3],[.7,1050,330,-PI*2+.2],[.82,1200,380,-PI*2],[.9,1210,360,-PI*2],[1,1360,730,-PI*2]];
 K.forEach(k=>{k[1]=150+(k[1]-230)*.7});let px=K[0][1],py=K[0][2],pr=K[0][3];for(let i=0;i<K.length-1;i++){if(u>=K[i][0]&&u<=K[i+1][0]){const k=eo((u-K[i][0])/(K[i+1][0]-K[i][0]));px=K[i][1]+(K[i+1][1]-K[i][1])*k;py=K[i][2]+(K[i+1][2]-K[i][2])*k;pr=K[i][3]+(K[i+1][3]-K[i][3])*k}}if(u>=1){px=K[K.length-1][1];py=730;pr=-PI*2}
 const hov=(u>.55&&u<.92)?1:0,bob=hov?Math.sin(t*7)*6:0;
 if(t>u0-1)fuCar(px,py+bob,pr,1.35,hov?.8+.2*Math.sin(t*20):0);
 oShow(t-(L[1]+.1),()=>{oTxt('SCHEMATIC · NOT TO SCALE',960,920,22,FUC.dim,'center',700)});
 // facts
 const F=[['DRIVERLESS · RAMP · UPSIDE DOWN · FLIP · HOVER',FUC.st],['0–60 MPH: UNDER 1 s (CLAIMED)',FUC.org],['PRODUCTION: 2028 (TARGET)',FUC.org],['PRICE: NOT ANNOUNCED',FUC.dim],['"NOT NECESSARILY SAFETY-OPTIMIZED" — MUSK',FUC.red]];
 F.forEach((q,i)=>fuTag(t-(L[1]+.4+i*1.6),1450,300+i*78,q[0],q[1],22));
 oShow(t-(L[2]+.1),(p)=>{c.save();c.translate(960,610);c.scale(p,p);c.fillStyle='rgba(9,12,19,.9)';c.fillRect(-720,-130,1440,260);oTxt('"WE ARE LITERALLY TALKING ABOUT HOPPING."',0,-40,54,'#fff','center',900,14,FUC.yel);oTxt('Roger Connor, curator, Smithsonian',0,30,28,FUC.dim,'center',700);oChip('NO SUSTAINED FLIGHT SHOWN',0,92,26,FUC.red);c.restore()});ctVignette(.6)};
SC.a_f02=(t)=>{const L=ATM.f02.lines;fuBg(t,'#ff8a3d');fuHead(t,'THE ROADSTER PROMISE TIMELINE','dates as reported · promises as announced',FUC.org);
 const X0=200,X1=1720,Y=640,xs=(yr)=>X0+(X1-X0)*(yr-2017)/11;
 c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=5;c.beginPath();c.moveTo(X0,Y);c.lineTo(X1,Y);c.stroke();
 for(let yr=2017;yr<=2028;yr++){oTxt(String(yr),xs(yr),Y+36,20,FUC.dim,'center',700)}
 const mk=(u,yr,lab,col,up)=>oShow(u,(p)=>{c.save();c.translate(xs(yr),Y);c.scale(p,p);c.fillStyle=col;c.beginPath();c.arc(0,0,15,0,PI*2);c.fill();c.strokeStyle=col;c.lineWidth=3;c.beginPath();c.moveTo(0,up?-15:15);c.lineTo(0,up?-70:70);c.stroke();oChip(lab,0,up?-96:96,22,col);c.restore()});
 mk(t-(L[0]+.5),2017,'NOV 2017 · UNVEILED',FUC.st,true);
 fuCard(t-(L[0]+1.6),120,250,560,190,'PROMISED IN 2017','0–60: 1.9 s · range: 620 mi · base price: $200,000',FUC.st,28);
 mk(t-(L[1]+.4),2020,'PROMISED: 2020',FUC.org,false);mk(t-(L[1]+1.6),2022,'2022',FUC.org,true);mk(t-(L[1]+2.6),2023,'2023',FUC.org,false);mk(t-(L[1]+3.6),2024,'2024',FUC.org,true);
 fuCard(t-(L[1]+.2),1240,250,560,190,'DEPOSITS ASKED','$50,000 standard · $250,000 Founder Series',FUC.org,28);
 mk(t-(L[2]+.2),2026,'OCT 2026 · DEMO',FUC.grn,false);mk(t-(L[2]+1.4),2028,'2028 · TARGET',FUC.yel,true);
 oShow(t-(L[2]+.8),(p)=>{c.save();c.translate(960,830);c.scale(p,p);oChip('0–60 CLAIM: 1.9 s → UNDER 1 s   ·   DELIVERY DATE: 2020 → 2028',0,0,26,FUC.yel);c.restore()});ctVignette(.6)};
SC.a_f03=(t)=>{const L=ATM.f03.lines;fuBg(t);fuHead(t,'IS A FLYING CAR EVEN POSSIBLE?','short answer: in a narrow sense, yes');
 const X0=160,X1=1760,Y=520,xs=(yr)=>X0+(X1-X0)*(yr-1945)/85;
 c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=5;c.beginPath();c.moveTo(X0,Y);c.lineTo(X1,Y);c.stroke();
 [[1950],[1970],[1990],[2010],[2030]].forEach(([yr])=>oTxt(String(yr),xs(yr),Y+34,20,FUC.dim,'center',700));
 const mk=(u,yr,lab,sub,col,up)=>oShow(u,(p)=>{c.save();c.translate(xs(yr),Y);c.scale(p,p);c.fillStyle=col;c.beginPath();c.arc(0,0,13,0,PI*2);c.fill();c.strokeStyle=col;c.lineWidth=3;c.beginPath();c.moveTo(0,up?-13:13);c.lineTo(0,up?-62:62);c.stroke();oTxt(lab,0,up?-94:92,24,col,'center',900);ccWrap(sub,0,up?-150:132,300,20,'#dfe7fa',26,'center',700,3);c.restore()});
 mk(t-(L[0]+.5),1949,'1949','Taylor Aerocar first flies',FUC.st,true);mk(t-(L[0]+2),1956,'1956','certified airworthy',FUC.grn,false);
 oShow(t-(L[1]+.2),(p)=>{c.save();c.translate(560,760);c.scale(p,p);oPanel(-440,-80,880,170,.76,hexa(FUC.org,.55),20);oTxt('ONLY 6 BUILT',-400,-40,28,FUC.org,'left',900);ccWrap('needed 500 orders for a manufacturer · got about half · a 1970s Ford study found demand, but safety & regulation stopped it',-400,8,820,24,'#eef3ff',31,'left',700,3);c.restore()});
 mk(t-(L[2]+.2),2023,'NOW','Alef: FAA OK to fly as an experimental aircraft',FUC.st,true);
 oShow(t-(L[2]+1.6),(p)=>{c.save();c.translate(1360,780);c.scale(p,p);oPanel(-420,-84,840,170,.76,hexa(FUC.yel,.55),20);oTxt('AIR TAXIS',-380,-42,26,FUC.yel,'left',900);ccWrap('Joby: furthest in the FAA process · Archer: behind it · none fully certified in the reports found',-380,6,780,24,'#eef3ff',31,'left',700,3);c.restore()});ctVignette(.6)};
SC.a_f04=(t)=>{const L=ATM.f04.lines;fuBg(t);fuHead(t,'THE CORE CONFLICT');
 oShow(t-.3,(p)=>{c.save();c.translate(560,560);c.scale(p,p);const tilt=Math.sin(t*.8)*.03;c.rotate(tilt);c.strokeStyle='#9fb6e8';c.lineWidth=8;c.beginPath();c.moveTo(-320,-110);c.lineTo(320,-110);c.stroke();c.beginPath();c.moveTo(0,-110);c.lineTo(0,140);c.stroke();c.fillStyle='#9fb6e8';c.fillRect(-90,140,180,18);
  oPanel(-460,-100,330,150,.8,hexa(FUC.st,.7),18);oTxt('AIRCRAFT',-295,-60,24,FUC.st,'center',900);oFit('MUST BE LIGHT',-295,-10,300,34,'#fff','center',900);
  oPanel(130,-100,330,200,.8,hexa(FUC.org,.7),18);oTxt('ROAD CAR',295,-60,24,FUC.org,'center',900);oFit('BUMPERS',295,-18,300,34,'#fff','center',900);oFit('CRUMPLE ZONES',295,24,300,34,'#fff','center',900);c.restore()});
 oShow(t-(L[0]+3),()=>oTxt('every pound added for the road makes flight harder',560,860,26,FUC.dim,'center',700));
 const S=[['1','A DEMO','done: a real engineering stunt',FUC.grn,0],['2','A CERTIFIED PRODUCT','not yet',FUC.yel,1],['3','SOLD & SAFE IN USE','not yet',FUC.org,2]];
 S.forEach((q,i)=>oShow(t-(L[1]+.4+i*1.4),(p)=>{c.save();c.translate(1220+i*60,780-i*170);c.scale(p,p);oPanel(-20,-70,520,140,.78,hexa(q[3],.65),18);oTxt(q[0],30,0,70,q[3],'center',900,14,q[3]);oTxt(q[1],280,-22,30,'#fff','center',900);oTxt(q[2],280,28,24,FUC.dim,'center',700);c.restore()}));
 oShow(t-(L[1]+5),(p)=>{c.save();c.translate(1500,190);c.scale(p,p);oChip('YOU ARE HERE: STEP 1 OF 3',0,0,26,FUC.grn);c.restore()});ctVignette(.6)};
SC.a_f05=(t)=>{const L=ATM.f05.lines;fuBg(t,'#ff8a3d');fuHead(t,'THE BIGGER CLAIM','',FUC.org);
 oShow(t-(L[0]+.5),(p)=>{c.save();c.translate(960,330);c.scale(p,p);oPanel(-760,-110,1520,220,.78,hexa(FUC.org,.65),26);oFit('"MONEY WON\'T MATTER IN 2036"',0,-20,1400,86,'#fff','center',900,18,FUC.org);oTxt('Musk · The Economist interview · Tesla Gigafactory Texas · published late July 2026',0,62,24,FUC.dim,'center',700);c.restore()});
 const N=[['AI + ROBOTS',FUC.st],['ABUNDANT GOODS',FUC.grn],['FALLING PRICES\n(DEFLATION)',FUC.yel],['"UNIVERSAL\nHIGH INCOME"',FUC.org]];
 N.forEach((q,i)=>oShow(t-(L[1]+.4+i*2),(p)=>{const x=290+i*447;c.save();c.translate(x,590);c.scale(p,p);oPanel(-190,-70,380,140,.78,hexa(q[1],.7),20);q[0].split('\n').forEach((l,k,a)=>oFit(l,0,(k-(a.length-1)/2)*40,340,34,'#fff','center',900));if(i<3){c.strokeStyle=q[1];c.lineWidth=7;c.beginPath();c.moveTo(210,0);c.lineTo(250,0);c.lineTo(234,-14);c.moveTo(250,0);c.lineTo(234,14);c.stroke()}c.restore()}));
 oShow(t-(L[1]+8.6),(p)=>{c.save();c.translate(1470,730);c.scale(p,p);oChip('"THE TREASURY SHOULD JUST SIMPLY ISSUE PEOPLE CHECKS"',0,0,22,FUC.org);c.restore()});
 [['NOV 2025','work optional in 10–20 years'],['DEC 2025','"either gone or AI eliminates scarcity"'],['JUL 2026','"money won\'t matter in 2036"']].forEach((q,i)=>oShow(t-(L[2]+.3+i*1.1),(p)=>{c.save();c.translate(360+i*600,850);c.scale(p,p);oTxt(q[0],0,-24,24,FUC.org,'center',900);oFit(q[1],0,14,540,24,'#e8eefb','center',700);c.restore()}));
 oShow(t-(L[2]+5),(p)=>{c.save();c.translate(960,240);c.scale(p,p);oChip('HIS CONDITION: NO WORLD WAR',0,0,26,FUC.yel);c.restore()});ctVignette(.6)};
SC.a_f06=(t)=>{const L=ATM.f06.lines;fuBg(t,'#5fd49a');fuHead(t,'WHAT WOULD HAVE TO BE TRUE?','five conditions',FUC.grn);
 const R=[['1','CHEAP OUTPUT AT HUGE SCALE','robots that work reliably in the real world, not only demos'],['2','THE INPUTS MUST NOT RUN OUT','energy, minerals, land, housing: physical things'],['3','WHO OWNS THE MACHINES?','government checks depend on taxes, politics and law'],['4','THE TRANSITION','job losses may come before any abundance (The Economist\'s editor)'],['5','STATUS STAYS SCARCE','a view, a school seat, a place in a city: critics say money keeps a role']];
 R.forEach((q,i)=>oShow(t-(L[i+1]+.1),(p)=>{c.save();c.translate((1-p)*-70,0);const y=260+i*128;oPanel(220,y,1480,108,.76,hexa(FUC.grn,.5),18);oTxt(q[0],280,y+54,64,FUC.grn,'center',900,12,FUC.grn);oTxt(q[1],360,y+30,32,'#fff','left',900);oTxt(q[2],360,y+74,23,'#c5d0e8','left',700);ccStamp('UNPROVEN',1560,y+54,FUC.yel,eo((t-(L[i+1]+.1)-.7)/.3),-.04,22);c.restore()}));ctVignette(.6)};
SC.a_f07=(t)=>{const L=ATM.f07.lines;fuBg(t);fuHead(t,'THE EVIDENCE TODAY');
 const T=[['JOBS','NO DISCERNIBLE DISRUPTION','Yale Budget Lab: broad labor market, 33 months after ChatGPT (late 2025 data; may have changed)',FUC.st,L[0]],['ROBOTS','A FEW DOZEN → SEVERAL HUNDRED / WEEK','Optimus, spring → August (one report, unconfirmed). Public sale target: end of 2027. 2025 target of ~10,000: missed',FUC.org,L[1]],['SELF-DRIVING','500,000+ RIDES / WEEK','Waymo, Sept 2026 report. Musk, April 2026: Tesla robotaxis likely "not super material this year"',FUC.grn,L[2]]];
 T.forEach((q,i)=>oShow(t-(q[4]+.2),(p)=>{c.save();c.translate(340+i*620,540);c.scale(p,p);oPanel(-290,-290,580,600,.78,hexa(q[3],.6),24);oTxt(q[0],0,-240,30,q[3],'center',900);ccWrap(q[1],0,-150,500,40,'#fff',48,'center',900,3);ccWrap(q[2],0,50,500,24,'#cdd7ee',32,'center',700,8);c.restore()}));ctVignette(.6)};
SC.a_f08=(t)=>{const L=ATM.f08.lines;fuBg(t,'#ffd166');fuHead(t,'WHEN MONEY IS HANDED OUT','',FUC.yel);
 fuCard(t-(L[0]+.3),110,250,800,430,'OPENRESEARCH STUDY','About 1,000 people got $1,000 a month for 3 years, vs a control group.',FUC.yel,30);
 [['−1.3 h','worked per week (reported)',FUC.org],['MORE','spent on essentials',FUC.st],['NO CLEAR GAIN','in reported physical health',FUC.dim]].forEach((q,i)=>oShow(t-(L[0]+3+i*1.4),(p)=>{c.save();c.translate(180+i*250,610);c.scale(p,p);oFit(q[0],0,0,230,40,q[2],'center',900);ccWrap(q[1],0,50,230,20,'#dfe7fa',26,'center',700,3);c.restore()}));
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(510,820);c.scale(p,p);oChip('NOT UNIVERSAL HIGH INCOME · SMALL TEST · REAL BEHAVIOUR',0,0,22,FUC.dim);c.restore()});
 fuCard(t-(L[2]+.2),1010,250,800,200,'KEYNES, 1930','Living standards 4–8× higher in a century, and far fewer working hours.',FUC.st,28);
 oShow(t-(L[2]+3),(p)=>{c.save();c.translate(1410,560);c.scale(p,p);oPanel(-390,-90,780,300,.78,hexa(FUC.grn,.5),20);oTxt('WEALTH',-250,-30,40,'#fff','center',900);ccStamp('RIGHT',-250,50,FUC.grn,eo((t-(L[2]+3.4))/.3),-.05,34);oTxt('HOURS',150,-30,40,'#fff','center',900);ccStamp('FELL FAR LESS',150,50,FUC.red,eo((t-(L[2]+4.4))/.3),-.05,26);c.restore()});ctVignette(.6)};
SC.a_f09=(t)=>{const L=ATM.f09.lines;fuBg(t,'#ff5a5a');fuHead(t,'THE TRACK RECORD: DATES','',FUC.red);
 oShow(t-(L[0]+1),(p)=>{c.save();c.translate(960,250);c.scale(p,p);oChip('ALSO TRUE: SPACEX LANDED AN ORBITAL BOOSTER IN 2015',0,0,26,FUC.grn);c.restore()});
 const R=[['2016','LA → NYC self-drive by end of 2017','did not happen as promised'],['2017','Roadster production in 2020','now targeted for 2028'],['JUL 2025','robotaxis to half of the U.S. population by year-end','APR 2026: "not super material this year"'],['2025','~10,000 Optimus robots','missed (reported)']];
 R.forEach((q,i)=>oShow(t-(L[1]+.3+i*2.6),(p)=>{c.save();c.translate((1-p)*-60,0);const y=320+i*130;oPanel(200,y,1520,112,.76,hexa(FUC.red,.5),18);oTxt(q[0],290,y+56,28,FUC.red,'center',900);oFit(q[1],380,y+34,780,30,'#fff','left',900);oFit(q[2],380,y+78,780,26,'#c5d0e8','left',700);ccStamp(i===3?'MISSED':'SLIPPED',1560,y+56,FUC.red,eo((t-(L[1]+.3+i*2.6)-.7)/.3),-.05,26);c.restore()}));
 oShow(t-(L[2]+.2),(p)=>{c.save();c.translate(960,880);c.scale(p,p);oChip('DIRECTION: SOMETIMES RIGHT  ·  DATES: OFTEN LATE  ·  2036 IS A DATE',0,0,28,FUC.yel);c.restore()});ctVignette(.6)};
SC.a_f10=(t)=>{const L=ATM.f10.lines;fuBg(t,'#7fb2ff');fuHead(t,'HOW TO READ A BOLD PREDICTION');
 const Q=[['1','WHAT WAS SHOWN?','and what was only said?'],['2','BY WHEN?','and who will check?'],['3','WHAT HAS TO BE TRUE?','and can any of it be measured today?'],['4','WHO BENEFITS?','if you believe it']];
 Q.forEach((q,i)=>oShow(t-(L[1]+.1+i*2.3),(p)=>{c.save();c.translate(960,320+i*135);c.scale(p,p);oPanel(-700,-55,1400,110,.78,hexa(FUC.st,.6),20);oTxt(q[0],-640,0,70,FUC.st,'center',900,14,FUC.st);oTxt(q[1],-540,-18,38,'#fff','left',900);oTxt(q[2],-540,28,26,'#c5d0e8','left',700);c.restore()}));
 oShow(t-(L[2]+.1),(p)=>{c.save();c.translate(960,880);c.scale(p,p);oChip('A QUESTION IS NOT AN ACCUSATION · IT KEEPS YOU IN CHARGE',0,0,26,FUC.grn);c.restore()});ctVignette(.6)};
SC.a_f11=(t)=>{const L=ATM.f11.lines;fuBg(t,'#5fd49a');fuHead(t,'WATCH THESE NUMBERS','not the headlines',FUC.grn);
 const W=[['OPTIMUS','units per week + price'],['AIR TAXIS','any FAA full certification?'],['ROBOTAXIS','rides per week'],['JOBS & WAGES','esp. new graduates'],['ENERGY & HOUSING','cost trend']];
 W.forEach((q,i)=>oShow(t-(L[0]+.5+i*1.6),(p)=>{const x=250+i*355;c.save();c.translate(x,520);c.scale(p,p);oPanel(-160,-200,320,400,.78,hexa(FUC.grn,.55),22);c.strokeStyle=FUC.grn;c.lineWidth=7;c.beginPath();c.arc(0,-60,56,PI,PI*2);c.stroke();c.save();c.translate(0,-60);c.rotate(-PI/2+Math.sin(t*1.4+i)*.5);c.beginPath();c.moveTo(0,0);c.lineTo(44,0);c.stroke();c.restore();oFit(q[0],0,50,300,30,'#fff','center',900);ccWrap(q[1],0,110,300,22,'#cfd8ee',28,'center',700,3);c.restore()}));
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oChip('IF MONEY STOPS MATTERING, THESE MOVE FIRST · IF THEY STAY FLAT, THE DATE IS A STORY',0,0,24,FUC.yel);c.restore()});ctVignette(.6)};
SC.a_f12=(t)=>{const L=ATM.f12.lines;fuBg(t);
 oShow(t-.3,(p)=>{c.save();c.translate(960,380);c.scale(p,p);oFit('WILL MONEY MATTER IN 2036?',0,0,1600,100,'#fff','center',900,20,FUC.org);c.restore()});
 oShow(t-(L[0]+1.2),(p)=>{c.save();c.translate(960,540);c.scale(p,p);oFit('NOBODY KNOWS.',0,0,1400,120,FUC.yel,'center',900,26);c.restore()});
 ['A DEMO IS REAL','A PRODUCT IS A DIFFERENT THING','A WORLD WITHOUT SCARCITY NEEDS VERY LARGE PROOF'].forEach((s,i)=>oShow(t-(L[1]+.3+i*1.9),(p)=>{c.save();c.translate(960,700+i*64);c.scale(p,p);oFit(s,0,0,1500,38,'#e8eefb','center',800);c.restore()}));
 oShow(t-(L[2]+.2),(p)=>{c.save();c.translate(960,900);c.scale(p,p);oTxt('NOT FINANCIAL ADVICE',0,0,24,FUC.dim,'center',700);c.restore()});ctVignette(.6)};
SC.a_fend=(t)=>{c.fillStyle='#07090e';c.fillRect(0,0,1920,1080);const p=eo(t/1.2);c.save();c.globalAlpha*=p;oFit('WATCH THE NUMBERS.',960,520,1600,130,'#fff','center',900,26,FUC.grn);c.restore();ctVignette(.7)};
// thumbnails (wide 1920)
function fuBig(s,x,y,size,col,al='center',glow=0){c.save();c.font=`900 ${size}px ${SANS}`;c.textAlign=al;c.textBaseline='middle';if(glow){c.shadowColor=col;c.shadowBlur=glow}c.fillStyle=col;c.fillText(s,x,y);c.restore()}
SC.a_fuA=(t)=>{fuBg(0,'#ff8a3d');fuBig('2036?',640,500,400,'#ffffff','center',40);c.save();c.strokeStyle=FUC.red;c.lineWidth=26;c.shadowColor=FUC.red;c.shadowBlur=30;c.beginPath();c.arc(1500,480,230,0,PI*2);c.stroke();c.beginPath();c.moveTo(1340,640);c.lineTo(1660,320);c.stroke();c.restore();fuBig('$',1500,490,330,'#f2f6ff','center',20);
 c.save();rr(110,820,620,96,48,'rgba(255,138,61,.16)',FUC.org,5);c.restore();fuBig('FACT CHECK',420,870,56,'#ffb27a','center')};
SC.a_fuB=(t)=>{fuBg(0,'#7fb2ff');c.fillStyle='#0d121b';c.fillRect(0,820,1920,260);c.strokeStyle='rgba(127,178,255,.4)';c.lineWidth=4;c.beginPath();c.moveTo(0,820);c.lineTo(1920,820);c.stroke();c.save();c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=14;c.lineCap='round';c.beginPath();for(let i=0;i<=40;i++){const q=i/40,x=160+q*440,y=820-q*q*430;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();c.restore();
 fuCar(1500,560,-.35,2.4,1);fuBig('FLYING',90,260,220,'#fff','left',30);fuBig('CAR?',90,470,220,FUC.st,'left',30);c.save();rr(160,900,640,92,46,'rgba(255,90,90,.16)',FUC.red,5);c.restore();fuBig('OR A HOP?',480,946,54,'#ff9a9a','center')};
SC.a_fuC=(t)=>{fuBg(0,'#ffd166');fuBig('MONEY WON\'T',960,300,220,'#ffffff','center',34);fuBig('MATTER?',960,540,280,FUC.yel,'center',40);fuBig('WHAT WOULD HAVE TO BE TRUE',960,820,86,FUC.org,'center',20)};
