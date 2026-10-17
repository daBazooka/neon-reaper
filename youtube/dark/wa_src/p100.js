// ---------- WA: "THE WINTER ARC" animated film scene system (wide 1920, film letterbox) ----------
const WAC={ice:'#8fd3ff',amb:'#ffb454',grn:'#6fe3a5',red:'#ff6b6b',vio:'#b69cff',wht:'#f1f6ff',dim:'#8d9bb8'};
function waBg(t,tint='#8fd3ff'){c.fillStyle=lg(0,0,0,1080,[[0,'#060a15'],[1,'#0e1528']]);c.fillRect(0,0,1920,1080);oGlow(1500,200,800,tint,.07+.02*Math.sin(t*.5));oGlow(300,950,700,'#ffb454',.035);
 for(let i=0;i<90;i++){const x=mod(rnd(i)*1920+Math.sin(t*.5+i)*28,1920),y=mod(rnd(i+3)*1080+t*(26+46*rnd(i+5)),1080),r=1+2.2*rnd(i+7);c.fillStyle=`rgba(255,255,255,${.16+.34*rnd(i+9)})`;c.beginPath();c.arc(x,y,r,0,PI*2);c.fill()}}
function waArcPt(u){return [170+1580*u,820-560*Math.pow(Math.sin(PI*u),.8)]}
function waArc(p,w=10,col=WAC.ice,from=0,f=waArcPt){c.save();c.lineWidth=w;c.lineCap='round';c.shadowColor=col;c.shadowBlur=22;c.strokeStyle=col;c.beginPath();for(let i=0;i<=120;i++){const u=from+(p-from)*i/120,[x,y]=f(u);i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();c.restore()}
function waArc3(u){return [170+1580*u,990-310*Math.pow(Math.sin(PI*u),.8)]}
function waArc2(u){return [170+1580*u,600-300*Math.pow(Math.sin(PI*u),.8)]}
function waTag(u,x,y,s,col=WAC.ice,size=30){oShow(u,(p)=>{c.save();c.translate(x,y);c.scale(p,p);oChip(s,0,0,size,col);c.restore()})}
function waCard(u,x,y,w,h,lab,txt,col=WAC.ice,sz=34){oShow(u,(p)=>{c.save();c.translate(x+w/2,y+h/2);c.scale(p,p);c.translate(-w/2,-h/2);oPanel(0,0,w,h,.72,hexa(col,.55),22);oTxt(lab,28,32,22,col,'left',900);ccWrap(txt,28,82,w-56,sz,'#f4f8ff',sz*1.28,'left',700,3);c.restore()})}
function waGrid(x,y,cols,rows,fill,miss=-1,cw=34,ch=34,col=WAC.amb){for(let k=0;k<cols*rows;k++){const cx=k%cols,cy=Math.floor(k/cols),on=k<fill,m=k===miss&&fill>miss;c.fillStyle=on&&!m?col:'rgba(255,255,255,.1)';rr(x+cx*(cw+6),y+cy*(ch+6),cw,ch,6,c.fillStyle,m?WAC.red:null,m?3:0)}}
function waIcon(k,x,y,S,col){c.save();c.translate(x,y);c.scale(S,S);c.strokeStyle=col;c.fillStyle=col;c.lineWidth=7;c.lineCap='round';c.lineJoin='round';c.shadowColor=col;c.shadowBlur=16;
 if(k==='moon'){c.beginPath();c.arc(0,0,60,PI*.35,PI*1.65);c.arc(28,-8,48,PI*1.55,PI*.45,true);c.stroke()}
 else if(k==='sun'){c.beginPath();c.arc(0,0,34,0,PI*2);c.stroke();for(let i=0;i<8;i++){const a=i*PI/4;c.beginPath();c.moveTo(Math.cos(a)*52,Math.sin(a)*52);c.lineTo(Math.cos(a)*76,Math.sin(a)*76);c.stroke()}}
 else if(k==='move'){c.beginPath();c.arc(8,-62,14,0,PI*2);c.fill();c.beginPath();c.moveTo(8,-44);c.lineTo(-6,2);c.lineTo(-40,30);c.moveTo(-6,2);c.lineTo(26,24);c.lineTo(30,66);c.moveTo(8,-40);c.lineTo(46,-14);c.moveTo(8,-40);c.lineTo(-30,-18);c.stroke()}
 c.restore()}
SC.a_w00=(t)=>{const L=ATM.w00.lines;waBg(t);const p=eo((t-.4)/(L[1]-.8));waArc(Math.min(1,p));
 oShow(t-.6,(q)=>{c.save();c.translate(170,870);c.scale(q,q);oChip('OCT 1',0,0,30,WAC.amb);c.restore()});
 if(p>.98)oShow(t-(L[0]+4.6),(q)=>{c.save();c.translate(1750,870);c.scale(q,q);oChip('DEC 31',0,0,30,WAC.amb);c.restore()});
 const [ax,ay]=waArcPt(Math.min(1,p));c.save();c.fillStyle='#fff';c.shadowColor='#fff';c.shadowBlur=26;c.beginPath();c.arc(ax,ay,12,0,PI*2);c.fill();c.restore();
 oShow(t-(L[0]+1),(q)=>{c.save();c.translate(960,420);c.scale(q,q);oFit('90',0,0,500,220,'#fff','center',900,36,WAC.ice);oTxt('DAYS',0,130,40,WAC.dim,'center',800);c.restore()});
 oShow(t-(L[1]+.2),(q)=>{c.save();c.translate(960,230);c.scale(q,q);oFit('STOP WAITING FOR JANUARY',0,0,1300,56,WAC.amb,'center',900,18);c.restore()});
 oShow(t-(L[2]+.1),(q)=>{c.save();c.fillStyle='rgba(6,10,21,.82)';c.fillRect(0,0,1920,1080);c.translate(960,470);c.scale(q,q);oFit('THE WINTER ARC',0,0,1500,170,'#fff','center',900,34,WAC.ice);oFit('THE VERSION WITH THE EVIDENCE',0,130,1400,48,WAC.amb,'center',800);c.restore()});ctVignette(.6)};
SC.a_w01=(t)=>{const L=ATM.w01.lines;waBg(t);
 waCard(t-(L[0]+.1),140,180,780,170,'FALL 2022','Carly Berges pitches it: ~90 days from Oct 1, laser-focused on your goals',WAC.ice,30);
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(0,0);oPanel(140,380,780,330,.72,hexa(WAC.vio,.55),22);oTxt('WHERE THE NAME LIKELY COMES FROM',168,412,22,WAC.vio,'left',900);
  const N=['SETUP','TRAIN','SETBACK','RETURN'];N.forEach((s,i)=>{const x=210+i*195,y=560-(i===2?-40:i===3?80:i*20)*1,a=cl(p*1.4-i*.2);c.globalAlpha=a;c.fillStyle=WAC.vio;c.beginPath();c.arc(x,y,15,0,PI*2);c.fill();if(i)c.strokeStyle=WAC.vio,c.lineWidth=5,c.beginPath(),c.moveTo(x-195+14,[560,540,520,600][i-1]),c.lineTo(x-14,[560,540,600,480][i]),c.stroke();oTxt(s,x,y+44,22,'#e8e2ff','center',800)});c.globalAlpha=1;c.restore()});
 oShow(t-(L[1]+1.6),(p)=>{c.save();c.translate(530,745);c.scale(p,p);oChip('ANIME / MANGA "ARC" · A GUESS, NOT CONFIRMED',0,0,22,WAC.amb);c.restore()});
 oShow(t-(L[2]+.1),(p)=>{c.save();c.translate(1400,500);c.scale(p,p);oPanel(-380,-250,760,500,.72,hexa(WAC.amb,.55),22);oTxt('2024 · THE MEME',0,-190,26,WAC.amb,'center',900);oFit('2× XP',0,-30,640,180,'#fff','center',900,30,WAC.amb);oTxt('"winter is a double experience points event"',0,120,28,'#d8e0f4','center',700);c.restore()});ctVignette(.6)};
SC.a_w02=(t)=>{const L=ATM.w02.lines;waBg(t,'#b69cff');
 oShow(t-.1,()=>oTxt('THE FRESH START EFFECT',960,170,52,'#fff','center',900,16,WAC.vio));
 oShow(t-(L[0]+1.5),()=>oTxt('Dai · Milkman · Riis (2014)',960,225,28,WAC.dim,'center',700));
 const cap=(i)=>[0,7,14,21,10].includes(i);
 oShow(t-(L[1]-.3),(p)=>{c.save();c.globalAlpha*=p;const x0=260,dx=52;c.strokeStyle='rgba(255,255,255,.15)';c.lineWidth=3;c.beginPath();c.moveTo(x0,700);c.lineTo(x0+27*dx,700);c.stroke();
  c.strokeStyle=WAC.vio;c.lineWidth=7;c.shadowColor=WAC.vio;c.shadowBlur=14;c.beginPath();for(let i=0;i<=27;i++){const sp=cap(i)?1:0,x=x0+i*dx,y=700-(60+(sp?190:0)*Math.exp(0))-(i>0?0:0);const base=700-70-28*Math.sin(i*.6);const yy=cap(i)?base-190:base;i?c.lineTo(x,yy):c.moveTo(x,yy)}c.stroke();c.restore();
  [[0,'WEEK'],[7,'WEEK'],[10,'BIRTHDAY'],[14,'WEEK'],[21,'WEEK']].forEach(([i,s])=>{const x=260+i*52;oTxt(s,x,740,20,WAC.vio,'center',800)});c.restore()});
 [['DIET SEARCHES',560],['GYM VISITS',960],['GOAL COMMITMENTS',1360]].forEach((q,i)=>waTag(t-(L[1]+.4+i*.7),q[1],330,q[0],WAC.vio,26));
 oShow(t-(L[1]+2.2),()=>oTxt('ILLUSTRATION OF THE PATTERN · NOT THE STUDY DATA',960,840,24,WAC.dim,'center',700));
 oShow(t-(L[2]+.1),(p)=>{c.save();c.fillStyle='rgba(6,10,21,.78)';c.fillRect(0,0,1920,1080);c.translate(960,470);c.scale(p,p);oTxt('OLD ME',-420,-20,84,WAC.dim,'center',900);c.fillStyle=WAC.vio;c.fillRect(-4,-170,8,330);oTxt('NEW ME',420,-20,84,'#fff','center',900,30,WAC.vio);oChip('ANY DAY CAN BE THE LINE',0,230,34,WAC.amb);c.restore()});ctVignette(.6)};
SC.a_w03=(t)=>{const L=ATM.w03.lines;waBg(t,'#ff6b6b');
 oShow(t-.1,()=>oTxt('RESOLUTIONS: STILL GOING?',960,170,52,'#fff','center',900,14,WAC.red));
 const B=[['START',100,'200 people'],['1 MONTH',55,'55%'],['6 MONTHS',40,'40%'],['2 YEARS',19,'19%']];
 B.forEach((b,i)=>oShow(t-(L[1]+.2+i*.9),(p)=>{const x=420+i*340,h=520*(b[1]/100)*p;c.save();c.fillStyle=i===3?WAC.red:i===0?WAC.dim:WAC.amb;c.shadowColor=c.fillStyle;c.shadowBlur=16;rr(x-90,820-h,180,h,10,c.fillStyle);c.restore();oTxt(b[2],x,820-h-34,44,'#fff','center',900);oTxt(b[0],x,860,26,WAC.dim,'center',800)}));
 oShow(t-(L[1]+4),()=>oTxt('reported figures · Norcross study of 200 resolution-makers',960,235,26,WAC.dim,'center',700));
 oShow(t-(L[2]+.1),(p)=>{c.save();c.translate(960,520);c.scale(p,p);c.fillStyle='rgba(6,10,21,.7)';c.fillRect(-900,-90,1800,180);oFit('HOW TO START ISN\'T THE PROBLEM. STILL BEING THERE IS.',0,0,1700,60,WAC.amb,'center',900);c.restore()});ctVignette(.6)};
SC.a_w04=(t)=>{const L=ATM.w04.lines;waBg(t,'#ff6b6b');
 oShow(t-.1,()=>oTxt('THE INTERNET VERSION · DAY ONE',700,170,46,'#fff','center',900,14,WAC.red));
 ['05:00  WAKE UP','COLD SHOWER','2 H AT THE GYM','HOURS OF STUDYING','NEW WORKOUT PLAN','ALL OF IT. DAY ONE.'].forEach((s,i)=>oShow(t-(L[0]+.5+i*.9),(p)=>{c.save();c.translate((1-p)*-80,0);oPanel(180,230+i*100,1000,82,.72,'rgba(255,255,255,.18)',16);oTxt(s,220,271+i*100,34,'#f4f8ff','left',800);c.restore()}));
 const day=Math.min(7,Math.max(1,1+(t-L[1])*1.1)),en=cl(1-(t-L[1])/6.5);
 oShow(t-L[1],(p)=>{c.save();c.globalAlpha*=p;oTxt('ENERGY',1500,220,26,WAC.dim,'center',800);rr(1440,260,120,480,18,'rgba(255,255,255,.08)',WAC.red,3);c.fillStyle=en>.35?WAC.amb:WAC.red;c.fillRect(1448,260+470*(1-en),104,470*en);oTxt('DAY '+Math.floor(day),1500,800,56,'#fff','center',900);c.restore()});
 oShow(t-(L[1]+6.8),(p)=>{c.save();c.translate(1500,860);c.scale(p,p);oChip('BURNED OUT IN ~1 WEEK · ONE STUDENT\'S ACCOUNT',0,0,22,WAC.red);c.restore()});
 oShow(t-(L[2]+.1),(p)=>{c.save();c.translate(960,520);c.scale(p,p);c.fillStyle='rgba(6,10,21,.82)';c.fillRect(-900,-110,1800,220);ccWrap('A PLAN THAT NEEDS PERFECT DAYS ENDS ON THE FIRST IMPERFECT ONE.',0,-30,1600,56,'#fff',68,'center',900,2);c.restore()});ctVignette(.6)};
SC.a_w05=(t)=>{const L=ATM.w05.lines;waBg(t,'#6fe3a5');
 oShow(t-.1,()=>oTxt('HOW LONG DOES A HABIT TAKE?',960,160,50,'#fff','center',900,14,WAC.grn));
 oShow(t-(L[0]+.5),(p)=>{c.save();c.translate(960,250);c.scale(p,p);oChip('THE "21 DAYS" NUMBER',0,0,26,WAC.red);c.strokeStyle=WAC.red;c.lineWidth=6;c.beginPath();c.moveTo(-190,0);c.lineTo(190,0);c.stroke();c.restore()});
 const X0=300,X1=1620,Y0=800,Y1=410,xs=(d)=>X0+(X1-X0)*d/130,ys=(a)=>Y0-(Y0-Y1)*a;
 c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=3;c.beginPath();c.moveTo(X0,Y1-20);c.lineTo(X0,Y0);c.lineTo(X1,Y0);c.stroke();oTxt('AUTOMATIC',X0-20,Y1-40,22,WAC.dim,'center',700);oTxt('DAYS',X1+10,Y0+40,22,WAC.dim,'right',700);
 const dr=Math.max(0,Math.min(1,(t-(L[1]+.3))/5));
 c.save();c.strokeStyle=WAC.grn;c.lineWidth=9;c.shadowColor=WAC.grn;c.shadowBlur=18;c.beginPath();for(let d=0;d<=130*dr;d+=1){const a=1-Math.exp(-d/22)-(d>=40&&d<45?.07*Math.sin((d-40)/5*PI):0),x=xs(d),y=ys(a);d?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();c.restore();
 [[18,'FASTEST: 18 d',WAC.grn],[66,'MEDIAN: ~66 d',WAC.amb]].forEach(([d,s,col],i)=>oShow(t-(L[1]+1.4+i*1.6),(p)=>{c.save();c.translate(xs(d),Y0);c.scale(p,p);c.strokeStyle=col;c.lineWidth=4;c.setLineDash([8,8]);c.beginPath();c.moveTo(0,0);c.lineTo(0,-(Y0-Y1)*.9);c.stroke();c.setLineDash([]);oChip(s,0,60,24,col);c.restore()}));
 oShow(t-(L[1]+4.6),(p)=>{c.save();c.translate(X1-20,Y0-90);c.scale(p,p);oChip('SLOWEST: 254 d  ➜',0,0,24,WAC.red);c.restore()});
 oShow(t-(L[2]+.2),(p)=>{c.save();c.translate(xs(42),ys(.46)-90);c.scale(p,p);oChip('ONE MISSED DAY: SMALL DIP',0,0,22,WAC.vio);c.restore()});
 oShow(t-(L[2]+1.8),()=>oTxt('study ran 84 days · the longest times are projected',960,900,24,WAC.dim,'center',700));
 oShow(t-(L[3]+.1),(p)=>{c.save();c.translate(960,500);c.scale(p,p);c.fillStyle='rgba(6,10,21,.8)';c.fillRect(-900,-90,1800,180);oFit('90 DAYS IS NOT MAGIC · IT IS ENOUGH TO BUILD SOMETHING SMALL',0,0,1700,52,WAC.grn,'center',900);c.restore()});ctVignette(.6)};
SC.a_w06=(t)=>{const L=ATM.w06.lines;waBg(t);
 oShow(t-.1,()=>{oTxt('RULE 1',960,160,30,WAC.amb,'center',900);oFit('START SMALLER THAN FEELS SERIOUS',960,225,1500,64,'#fff','center',900,18,WAC.ice)});
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(560,450);c.scale(p,p);oPanel(-300,-150,600,300,.74,hexa(WAC.red,.6),24);oFit('10 HABITS',0,-40,520,90,WAC.dim,'center',900);oTxt('✕  too big for a bad day',0,60,30,WAC.red,'center',800);c.restore()});
 oShow(t-(L[1]+1.2),(p)=>{c.save();c.translate(1360,450);c.scale(p,p);oPanel(-300,-150,600,300,.74,hexa(WAC.grn,.7),24);oFit('2 HABITS',0,-40,520,100,'#fff','center',900,22,WAC.grn);oTxt('✓  doable on your worst day',0,60,30,WAC.grn,'center',800);c.restore()});
 ['10 MIN OF MOVEMENT','10 PAGES','LIGHTS OUT AT A SET TIME'].forEach((s,i)=>waTag(t-(L[1]+2.4+i*.8),960,690+i*68,s,WAC.ice,28));
 oShow(t-(L[2]+.1),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oFit('POSSIBLE BEFORE AMBITIOUS',0,0,1400,48,WAC.amb,'center',900);c.restore()});ctVignette(.6)};
SC.a_w07=(t)=>{const L=ATM.w07.lines;waBg(t,'#ffb454');
 oShow(t-.1,()=>{oTxt('RULE 2',960,160,30,WAC.amb,'center',900);oFit('WRITE AN IF-THEN PLAN',960,225,1500,64,'#fff','center',900,18,WAC.amb)});
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(960,330);c.scale(p,p);oTxt('"I WILL EXERCISE MORE."',0,0,48,WAC.dim,'center',800);c.strokeStyle=WAC.red;c.lineWidth=7;c.beginPath();c.moveTo(-420,0);c.lineTo(420,0);c.stroke();c.restore()});
 const typ=(s,u)=>s.slice(0,Math.max(0,Math.min(s.length,Math.floor((u)*18))));
 oShow(t-(L[1]+1.4),(p)=>{c.save();c.translate(540,560);c.scale(p,p);oPanel(-380,-170,760,340,.74,hexa(WAC.amb,.7),24);oTxt('IF',-320,-110,34,WAC.amb,'left',900);oTxt(typ('IT IS 7:00 PM',t-(L[1]+2)),-320,-30,44,'#fff','left',800);oTxt(typ('AND I AM HOME',t-(L[1]+3)),-320,50,44,'#fff','left',800);c.restore()});
 oShow(t-(L[1]+4.2),(p)=>{c.save();c.translate(960,560);c.scale(p,p);c.strokeStyle=WAC.amb;c.lineWidth=10;c.beginPath();c.moveTo(-60,0);c.lineTo(60,0);c.lineTo(30,-28);c.moveTo(60,0);c.lineTo(30,28);c.stroke();c.restore()});
 oShow(t-(L[1]+4.8),(p)=>{c.save();c.translate(1380,560);c.scale(p,p);oPanel(-380,-170,760,340,.74,hexa(WAC.grn,.7),24);oTxt('THEN',-320,-110,34,WAC.grn,'left',900);oTxt(typ('SHOES ON',t-(L[1]+5.2)),-320,-30,44,'#fff','left',800);oTxt(typ('10-MIN WALK',t-(L[1]+6)),-320,50,44,'#fff','left',800);c.restore()});
 waCard(t-(L[2]+.2),560,740,800,150,'94 TESTS · GOLLWITZER & SHEERAN (2006)','average effect on goal attainment: medium to large (d ≈ 0.65) · not a guarantee',WAC.ice,26);ctVignette(.6)};
SC.a_w08=(t)=>{const L=ATM.w08.lines;waBg(t);
 oShow(t-.1,()=>{oTxt('RULE 3',960,160,30,WAC.amb,'center',900);oFit('TRACK IT WHERE YOU CAN SEE IT',960,225,1500,64,'#fff','center',900,18,WAC.ice)});
 waCard(t-(L[1]+.1),130,330,520,430,'138 EXPERIMENTS','19,951 people · monitoring progress improved goal attainment (d ≈ 0.40)',WAC.ice,30);
 oShow(t-(L[1]+2),(p)=>{c.save();c.translate(390,830);c.scale(p,p);oChip('BETTER WHEN WRITTEN DOWN OR SHARED',0,0,22,WAC.amb);c.restore()});
 const fill=Math.floor(90*eo((t-(L[2]+.8))/9));oShow(t-(L[2]+.1),(p)=>{c.save();c.globalAlpha*=p;oTxt('YOUR 90 BOXES',1240,300,30,WAC.amb,'center',900);waGrid(840,330,15,6,fill,23,40,60,WAC.amb);c.restore()});
 oShow(t-(L[2]+4),()=>oTxt('THE GRID IS THE ARC',1240,830,40,'#fff','center',900,14,WAC.amb));ctVignette(.6)};
SC.a_w09=(t)=>{const L=ATM.w09.lines;waBg(t,'#6fe3a5');
 oShow(t-.1,()=>{oTxt('RULE 4',960,150,30,WAC.amb,'center',900);oFit('PROTECT THE FOUNDATIONS',960,215,1500,64,'#fff','center',900,18,WAC.grn)});
 const P=[['moon','SLEEP','7+ HOURS','adults · AASM/SRS consensus',WAC.vio,L[1]],['move','MOVE','150–300 MIN / WEEK','+ 2 DAYS STRENGTH · WHO 2020\nexercise: medium effect on depression & anxiety (97 reviews)',WAC.grn,L[2]],['sun','LIGHT','MORNING DAYLIGHT','seasonal depression: <1% to ~10%, depends on place & method',WAC.amb,L[3]]];
 P.forEach((q,i)=>oShow(t-(q[5]+.1),(p)=>{c.save();c.translate(340+i*620,520);c.scale(p,p);oPanel(-290,-250,580,540,.74,hexa(q[4],.65),26);waIcon(q[0],0,-130,1.15,q[4]);oTxt(q[1],0,-20,34,q[4],'center',900);oFit(q[2],0,50,520,50,'#fff','center',900);ccWrap(q[3],0,120,500,22,'#cfd8ee',30,'center',700,5);c.restore()}));
 oShow(t-(L[3]+3),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oChip('LOW MOOD HEAVY OR LASTING? TALK TO A DOCTOR',0,0,26,WAC.red);c.restore()});ctVignette(.6)};
SC.a_w10=(t)=>{const L=ATM.w10.lines;waBg(t,'#ffb454');
 oShow(t-.1,()=>oTxt('MYTH CHECK',960,170,56,'#fff','center',900,16,WAC.amb));
 const M=[['WAKE UP AT 5?','NOT REQUIRED','the evidence is about sleeping enough',WAC.grn,L[0]+1],['COLD SHOWERS?','MAYBE · NOT REQUIRED','30 days · 3,018 people: −29% self-reported sick DAYS OFF, same illness days',WAC.amb,L[1]+.2],['CHANGE EVERYTHING?','NO','2 small habits + enough sleep',WAC.grn,L[2]+.2]];
 M.forEach((q,i)=>oShow(t-q[4],(p)=>{c.save();c.translate(0,(1-p)*40);const y=260+i*210;oPanel(260,y,1400,170,.74,hexa(q[3],.5),22);oTxt(q[0],310,y+52,40,'#fff','left',900);oTxt(q[2],310,y+118,26,'#cfd8ee','left',700);ccStamp(q[1],1490,y+85,q[3],eo((t-q[4]-.6)/.3),-.04,q[1].length>12?22:32);c.restore()}));ctVignette(.6)};
SC.a_w11=(t)=>{const L=ATM.w11.lines;waBg(t,'#4fd8ff');
 oShow(t-.1,()=>{oTxt('RULE 5',960,150,30,WAC.amb,'center',900);oFit('REVIEW EVERY SUNDAY',960,215,1500,64,'#fff','center',900,18,WAC.ice)});
 const Q=['WHAT DID I DO?','WHAT GOT IN THE WAY?','SMALLEST CHANGE FOR NEXT WEEK?'];
 oShow(t-(L[0]+.3),(p)=>{c.save();c.translate(540,590);c.scale(p,p);oRing(0,0,200,5,hexa(WAC.ice,.5));oTxt('SUNDAY',0,0,44,'#fff','center',900,16,WAC.ice);c.restore()});
 Q.forEach((q,i)=>oShow(t-(L[0]+1.2+i*1.5),(p)=>{const a=-PI/2+i*2*PI/3,x=540+Math.cos(a)*260,y=590+Math.sin(a)*260;c.save();c.translate(x,y);c.scale(p,p);rr(-170,-48,340,96,48,'rgba(8,12,24,.88)',WAC.ice,3);ccWrap(q,0,-8,300,22,'#fff',28,'center',800,2);c.restore()}));
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(1340,380);c.scale(p,p);oPanel(-340,-110,680,220,.74,hexa(WAC.grn,.65),24);oTxt('MISS 1 DAY',0,-60,32,WAC.grn,'center',900);oTxt('→ small version tomorrow',0,0,34,'#fff','center',800);oTxt('one miss is data, not failure',0,56,24,WAC.dim,'center',700);c.restore()});
 oShow(t-(L[2]+.1),(p)=>{c.save();c.translate(1340,680);c.scale(p,p);oPanel(-340,-110,680,220,.74,hexa(WAC.amb,.65),24);oTxt('MISS 2 IN A ROW',0,-60,32,WAC.amb,'center',900);oTxt('→ shrink the habit',0,0,34,'#fff','center',800);oTxt('not quit the arc',0,56,24,WAC.dim,'center',700);c.restore()});ctVignette(.6)};
SC.a_w12=(t)=>{const L=ATM.w12.lines;waBg(t);
 oShow(t-.1,()=>oTxt('THE SHAPE OF A REAL ARC',960,150,52,'#fff','center',900,16,WAC.ice));
 const ph=[['WEEKS 1–2','BUILD THE SMALL VERSION. TRACK IT.',WAC.grn,0,.17,L[0]],['WEEKS 3–6','ADD ONE THING. THE ONE YOU AVOIDED.',WAC.ice,.17,.5,L[1]],['WEEKS 7–10','IT GETS BORING. BORING IS THE POINT.',WAC.vio,.5,.78,L[2]],['WEEKS 11–13','REVIEW. KEEP WHAT WORKED. DROP WHAT DID NOT.',WAC.amb,.78,1,L[3]]];
 ph.forEach((q,i)=>{const u=cl((t-(q[5]+.2))/2.2);if(u>0)waArc(q[3]+(q[4]-q[3])*u,12,q[2],q[3],waArc2)});
 ph.forEach((q,i)=>oShow(t-(q[5]+.4),(p)=>{c.save();c.translate(120+i*430+200,780);c.scale(p,p);oPanel(-200,-95,400,190,.74,hexa(q[2],.65),22);oTxt(q[0],0,-48,30,q[2],'center',900);ccWrap(q[1],0,6,350,24,'#eef3ff',31,'center',800,3);c.restore()}));
 oShow(t-(L[4]+.2),(p)=>{const [x,y]=waArc2(.6);c.save();c.translate(x,y);c.scale(p,p);c.strokeStyle=WAC.red;c.lineWidth=6;c.shadowColor=WAC.red;c.shadowBlur=14;c.beginPath();c.arc(0,0,46,0,PI*2);c.stroke();c.translate(0,-96);oChip('THE SETBACK · PLAN FOR IT',0,0,26,WAC.red);c.restore()});ctVignette(.6)};
SC.a_w13=(t)=>{const L=ATM.w13.lines;waBg(t,'#ffb454');
 const fill=Math.floor(90*eo((t-.4)/(L[0]+9)));oShow(t-.2,(p)=>{c.save();c.globalAlpha*=p;waGrid(540,200,15,6,fill,23,56,66,WAC.amb);oTxt('90 SMALL BOXES = EVIDENCE',1000,180,34,'#fff','center',900,14,WAC.amb);c.restore()});
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(960,700);c.scale(p,p);oFit('THE PRIZE IS THE TRUST YOU REBUILD WITH YOURSELF',0,0,1600,48,WAC.ice,'center',900);c.restore()});
 oShow(t-(L[2]+.1),(p)=>{c.save();c.fillStyle='rgba(6,10,21,.84)';c.fillRect(0,0,1920,1080);c.translate(960,430);c.scale(p,p);oFit('TODAY IS DAY 1',0,0,1500,170,'#fff','center',900,34,WAC.amb);['2 HABITS','IF-THEN PLAN','THE GRID'].forEach((s,i)=>{c.save();c.translate(-380+i*380,170);oChip(s,0,0,34,WAC.ice);c.restore()});c.restore()});ctVignette(.6)};
SC.a_wend=(t)=>{c.fillStyle='#05070e';c.fillRect(0,0,1920,1080);const p=eo(t/1.2);c.save();c.globalAlpha*=p;oFit('DAY 1.',960,480,1500,200,'#fff','center',900,36,WAC.amb);rr(900,640,120,120,20,WAC.amb);c.restore();ctVignette(.7)};
// thumbnails (3) — wide 1920
SC.a_wathA=(t)=>{waBg(0,'#ffb454');waArc(1,14,WAC.ice,0,waArc3);c.save();c.fillStyle='#fff';c.shadowColor='#fff';c.shadowBlur=30;c.beginPath();c.arc(170,990,16,0,PI*2);c.fill();c.restore();oFit('DAY 1.',960,330,1700,330,'#fff','center',900,50,WAC.amb);oFit('WINTER ARC',960,590,1300,110,WAC.ice,'center',900,22);ctVignette(.5)};
SC.a_wathB=(t)=>{waBg(0,'#ff6b6b');oFit('NOT 5 AM.',960,400,1750,320,'#fff','center',900,44,WAC.red);oFit('WINTER ARC · WHAT ACTUALLY WORKS',960,680,1700,84,WAC.amb,'center',900,18);waGrid(560,820,20,2,26,-1,36,36,WAC.amb);ctVignette(.5)};
SC.a_wathC=(t)=>{waBg(0,'#6fe3a5');waGrid(375,110,15,6,52,23,72,84,WAC.amb);oFit('90 BOXES.',960,860,1700,170,'#fff','center',900,34,WAC.amb);ctVignette(.45)};
