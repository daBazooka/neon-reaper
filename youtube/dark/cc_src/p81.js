// ---------- CC: "case file" scene system for the conspiracies film ----------
function ccWrap(s,x,y,maxW,size,col,lh,al='left',w=700,maxLines=4){c.save();c.font=`${w} ${size}px ${SANS}`;const ws=s.split(' ');let ln='',L=[];for(const q of ws){const tt=ln?ln+' '+q:q;if(c.measureText(tt).width>maxW&&ln){L.push(ln);ln=q}else ln=tt}L.push(ln);c.restore();L.slice(0,maxLines).forEach((q,i)=>oTxt(q,x,y+i*lh,size,col,al,w));return L.length}
function ccIcon(k,x,y,S,col,t=0){c.save();c.translate(x,y);c.scale(S,S);c.strokeStyle=col;c.fillStyle=col;c.lineWidth=7;c.lineCap='round';c.lineJoin='round';c.shadowColor=col;c.shadowBlur=18;
 const P=(...a)=>{c.beginPath();for(let i=0;i<a.length;i+=2){i?c.lineTo(a[i],a[i+1]):c.moveTo(a[i],a[i+1])}c.stroke()};
 const C=(cx,cy,r,f)=>{c.beginPath();c.arc(cx,cy,r,0,PI*2);f?c.fill():c.stroke()};
 const R=(a,b,w,h,f,r=8)=>{c.beginPath();c.roundRect(a,b,w,h,r);f?c.fill():c.stroke()};
 switch(k){
 case 'syringe':c.save();c.rotate(-.78);R(-20,-30,100,44,0);P(80,-8,120,-8);P(-20,-8,-50,-8);P(-50,-30,-50,14);c.restore();break;
 case 'brain':c.beginPath();c.ellipse(0,0,80,62,0,0,PI*2);c.stroke();P(0,-60,0,60);P(-70,-20,-30,-10,-50,20);P(70,-20,30,-10,50,20);P(-30,-45,-10,-25);P(30,-45,10,-25);break;
 case 'plane':P(-100,10,70,-10,100,0,70,14,-100,18);P(-20,0,-60,-70,-40,-70,40,-4);P(-20,16,-60,80,-40,80,40,16);P(-90,10,-110,-30);break;
 case 'ship':P(-100,20,100,20,70,64,-70,64,-100,20);R(-50,-24,100,44,0);R(-20,-60,40,36,0);P(-20,-80,-20,-60);P(60,20,60,-30);break;
 case 'tape':C(-45,0,38);C(45,0,38);R(-100,-60,200,120,1);c.save();c.globalCompositeOperation='destination-out';C(-45,0,30,1);C(45,0,30,1);c.restore();C(-45,0,38);C(45,0,38);break;
 case 'eye':c.beginPath();c.moveTo(-100,0);c.quadraticCurveTo(0,-90,100,0);c.quadraticCurveTo(0,90,-100,0);c.stroke();C(0,0,28);C(0,0,10,1);break;
 case 'phone':R(-40,-90,80,180,0,16);P(-20,70,20,70);C(0,-60,6,1);P(60,-40,90,-60);P(60,0,100,0);P(60,40,90,60);break;
 case 'crates':R(-90,-10,100,80,0);R(10,10,90,60,0);R(-60,-80,80,70,0);P(-90,-10,10,70);P(10,-10,-90,70);P(-60,-80,20,-10);break;
 case 'barrel':c.beginPath();c.ellipse(0,-70,50,16,0,0,PI*2);c.stroke();P(-50,-70,-60,0,-50,70);P(50,-70,60,0,50,70);c.beginPath();c.ellipse(0,70,50,16,0,0,PI);c.stroke();P(-58,-25,58,-25);P(-58,25,58,25);break;
 case 'cig':R(-100,-14,150,28,0);P(-20,-14,-20,14);P(50,-14,50,14);R(56,-14,44,28,1);P(0,-40,10,-70,-10,-95);P(30,-40,40,-65,22,-92);break;
 case 'pump':R(-50,-80,80,150,0,10);R(-35,-62,50,50,0);P(30,-40,70,-20,70,40);P(70,40,92,52);P(-60,70,40,70);break;
 case 'cube':P(0,-70,70,-35,0,0,-70,-35,0,-70);P(-70,-35,-70,45,0,80,0,0);P(70,-35,70,45,0,80);break;
 case 'thermo':R(-16,-90,32,130,0,16);C(0,62,32);C(0,62,18,1);P(0,-60,0,50);P(24,-60,44,-60);P(24,-30,44,-30);break;
 case 'pill':c.save();c.rotate(-.7);R(-95,-36,190,72,0,36);P(0,-36,0,36);c.restore();break;
 case 'exhaust':R(-100,-20,120,40,0);P(20,-8,70,-8);for(let i=0;i<3;i++){C(60+i*36,-34-i*18+Math.sin(t*3+i)*6,12+i*6)}break;
 case 'monitor':R(-90,-70,180,120,0,10);P(-30,80,30,80);P(0,50,0,80);P(-60,-30,-20,-30);P(-60,0,40,0);P(-60,25,10,25);break;
 case 'radiation':C(0,0,12,1);for(let i=0;i<3;i++){c.save();c.rotate(i*2.094+t*.4);c.beginPath();c.arc(0,0,86,-.5,.5);c.lineTo(34,0);c.closePath();c.fill();c.restore()}break;
 case 'germ':C(0,0,44);for(let i=0;i<8;i++){const a=i*PI/4;P(Math.cos(a)*44,Math.sin(a)*44,Math.cos(a)*74,Math.sin(a)*74);C(Math.cos(a)*80,Math.sin(a)*80,8,1)}break;
 case 'bottle':P(-18,-100,-18,-50,-50,-10,-50,80,50,80,50,-10,18,-50,18,-100,-18,-100);P(-50,20,50,20);break;
 case 'rocket':c.beginPath();c.moveTo(0,-100);c.quadraticCurveTo(50,-30,34,50);c.lineTo(-34,50);c.quadraticCurveTo(-50,-30,0,-100);c.stroke();C(0,-20,14);P(-34,20,-62,60,-34,50);P(34,20,62,60,34,50);P(-14,60,0,92,14,60);break;
 case 'papers':R(-70,-80,110,140,0,6);R(-40,-60,110,140,0,6);P(-18,-30,48,-30);P(-18,0,48,0);P(-18,30,30,30);break;
 case 'megaphone':P(-80,-20,-80,20,-30,20,60,70,60,-70,-30,-20,-80,-20);P(-60,20,-50,70,-20,70,-20,20);P(80,-30,100,-40);P(84,0,108,0);break;
 case 'bomb':C(-10,20,56);P(20,-20,50,-52,70,-50);P(70,-50,80,-70);P(80,-70,92,-60);P(86,-76,100,-86);P(76,-86,90,-98);break;
 case 'dollar':C(0,0,80);c.font='800 110px '+SANS;c.textAlign='center';c.textBaseline='middle';c.lineWidth=1;c.fillText('$',0,6);break;
 case 'pen':c.save();c.rotate(-.7);R(-14,-100,28,150,0,4);P(-14,50,0,90,14,50);P(-14,-70,14,-70);c.restore();break;
 case 'sword':P(0,-100,0,60);P(-40,60,40,60);P(0,60,0,90);P(-12,-80,0,-100,12,-80);R(-10,-40,20,100,0);break;
 case 'target':C(0,0,84);C(0,0,54);C(0,0,24);C(0,0,5,1);P(-100,0,-70,0);P(70,0,100,0);P(0,-100,0,-70);P(0,70,0,100);break;
 case 'cloud':c.beginPath();c.arc(-40,10,36,PI*.5,PI*1.5);c.arc(0,-24,44,PI,PI*2);c.arc(46,6,36,PI*1.5,PI*2.5);c.closePath();c.stroke();for(let i=0;i<5;i++){const yy=40+mod(t*60+i*20,60);P(-60+i*28,yy,-66+i*28,yy+14)}break;
 case 'drop':c.beginPath();c.moveTo(0,-90);c.quadraticCurveTo(70,10,0,70);c.quadraticCurveTo(-70,10,0,-90);c.stroke();P(-24,20,-12,42);break;
 case 'clock':C(0,0,84);P(0,0,0,-56);P(0,0,38,16);for(let i=0;i<12;i++){const a=i*PI/6;P(Math.cos(a)*70,Math.sin(a)*70,Math.cos(a)*78,Math.sin(a)*78)}break;
 case 'bulb':C(0,-20,56);P(-24,36,-24,66,24,66,24,36);P(-18,82,18,82);P(-16,-10,0,10,16,-10);break;
 case 'bank':P(-100,-30,0,-90,100,-30,-100,-30);for(let i=0;i<4;i++)P(-72+i*48,-18,-72+i*48,50);P(-100,70,100,70);P(-90,56,90,56);break;
 case 'network':[[0,0],[-70,-50],[70,-50],[-60,60],[66,56]].forEach(p=>{C(p[0],p[1],14,1);if(p[0]||p[1])P(0,0,p[0],p[1])});C(0,0,24);break;
 case 'phone2':R(-34,-84,68,150,0,12);P(-90,-40,-50,-20);P(-90,0,-60,10);P(60,-50,100,-70);P(60,-10,104,-10);P(-14,50,14,50);break;
 case 'candle':R(-24,-10,48,90,0,4);P(0,-10,0,-24);c.beginPath();c.moveTo(0,-90);c.quadraticCurveTo(24,-56,0,-28);c.quadraticCurveTo(-24,-56,0,-90);c.fill();break;
 case 'gavel':c.save();c.rotate(-.5);R(-70,-70,110,50,0,6);P(-15,-20,-15,80);c.restore();P(30,80,100,80);break;
 case 'doc':R(-60,-86,120,170,0,8);P(-34,-50,34,-50);P(-34,-20,34,-20);P(-34,10,34,10);P(-34,40,10,40);break;
 case 'person':C(0,-52,28);P(-56,80,-56,10,-30,-8,30,-8,56,10,56,80,-56,80);break;
 case 'x':P(-70,-70,70,70);P(70,-70,-70,70);break;
 case 'check':P(-70,4,-24,52,76,-56);break;
 default:C(0,0,70);
 }c.restore()}
function ccStamp(s,x,y,col,p,rot=-.12,size=60){if(p<=0)return;c.save();c.translate(x,y);c.rotate(rot);const k=1+(1-p)*1.2;c.scale(k,k);c.globalAlpha*=cl(p*1.6);c.font=`900 ${size}px ${SANS}`;const w=c.measureText(s).width+size*.9;c.strokeStyle=col;c.lineWidth=7;c.shadowColor=col;c.shadowBlur=16;c.beginPath();c.roundRect(-w/2,-size*.75,w,size*1.5,10);c.stroke();c.lineWidth=2;c.beginPath();c.roundRect(-w/2+9,-size*.75+9,w-18,size*1.5-18,6);c.stroke();c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';c.fillText(s,0,size*.05);c.restore()}
function ccBg(t,ch){const g=lg(0,0,0,1080,[[0,'#0b1018'],[1,'#141c2a']]);c.fillStyle=g;c.fillRect(0,0,1920,1080);c.save();c.globalAlpha=.07;c.strokeStyle='#8fb6ff';c.lineWidth=1;for(let i=0;i<48;i++){c.beginPath();c.moveTo(i*40,0);c.lineTo(i*40,1080);c.stroke()}for(let j=0;j<27;j++){c.beginPath();c.moveTo(0,j*40);c.lineTo(1920,j*40);c.stroke()}c.restore();
 const col=CCCOL[ch]||'#7fb2ff';oGlow(1500,300,700,col,.10+.03*Math.sin(t*.6))}
const CCCOL={1:'#ff6a6a',2:'#ffb454',3:'#7fb2ff',4:'#c58bff',5:'#4fd1a5',6:'#ff8fc0'};
function ccHud(t,done,total,ch){// progress ticks, top-right under letterbox
 const x0=1920-90-total*22;for(let i=0;i<total;i++){const on=i<done;c.fillStyle=on?(CCCOL[CCN2CH[i]]||'#fff'):'rgba(255,255,255,.16)';c.fillRect(x0+i*22,134,14,26)}
 oTxt(done+' / '+total,1920-90,184,26,'#c8d4e8','right',800)}
function ccDeep(id,t){const d=CCASES.find(q=>q.id===id),L=ATM[id].lines,col=CCCOL[d.ch];ccBg(t,d.ch);
 oShow(t-.1,()=>{oChip('CASE '+String(d.no).padStart(2,'0')+'  ·  '+CCCH[d.ch],150,150,24,col,'left')});
 ccHud(t,d.no-1+Math.min(1,t/2),35);
 oShow(t-.25,(p)=>{c.save();c.translate(0,(1-p)*30);oFit(d.title,150,260,1000,86,'#fff','left',900,20,col);oTxt(d.years,152,334,40,col,'left',800,12);c.restore()});
 // icon medallion
 const ip=eo((t-.15)/.6);c.save();c.translate(1470,520);c.scale(.6+.4*ip,.6+.4*ip);c.globalAlpha*=ip;oRing(0,0,230,4,hexa(col,.5));oRing(0,0,252,2,hexa(col,.25),1);for(let i=0;i<24;i++){const a=i*PI/12+t*.15;c.fillStyle=hexa(col,.4);c.fillRect(Math.cos(a)*252-2,Math.sin(a)*252-2,5,5)}ccIcon(d.icon,0,0,1.9,col,t);c.restore();
 const card=(u,y,lab,txt,w=1130)=>oShow(u,(p)=>{c.save();c.translate((1-p)*-60,0);oPanel(150,y,w,150,.6,hexa(col,.4),18);oTxt(lab,184,y+34,22,col,'left',900);const n=ccWrap(txt,184,y+78,w-70,34,'#f2f6ff',42,'left',700,2);c.restore()});
 card(L[0]+.1,380,'THE CLAIM',d.f1);
 card(L[1]+.15,545,'THE ALLEGATION / DETAILS',d.f2);
 card(L[2]+.1,710,'HOW WE KNOW',d.proof);
 oShow(L[3]+.1,(p)=>{c.save();c.translate((1-p)*-60,0);oPanel(150,875,1130,64,.6,hexa('#ffffff',.2),14);oTxt('OUTCOME  ·  '+d.out,184,907,26,'#ffe6b0','left',800);c.restore()});
 const sp=eo((t-(L[2]+.7))/.35);ccStamp('CONFIRMED',1470,800,'#58e08a',sp,-.14,58);
 ctVignette(.55)}
function ccRapid(id,t){const d=CCASES.find(q=>q.id===id),L=ATM[id].lines,col=CCCOL[d.ch],n=d.items.length;ccBg(t,d.ch);
 oShow(t-.1,()=>{oChip('RAPID FIRE  ·  '+CCCH[d.ch],150,150,24,col,'left')});
 const done=d.items[0].no-1;ccHud(t,done+Math.min(n,L.filter(q=>t>q).length),35);
 const W=n===4?405:540,G=30,x0=(1920-(n*W+(n-1)*G))/2;
 d.items.forEach((it,i)=>{const u=t-(L[i]+.05);if(u<0)return;const x=x0+i*(W+G),act=(i===n-1||t<L[i+1]),pc=eo(u/.45);c.save();c.globalAlpha=pc*(act?1:.82);c.translate(x,300+(1-pc)*40);
  rr(0,0,W,610,22,'rgba(10,14,26,.78)',act?col:hexa(col,.35),act?4:2);
  oTxt(String(it.no).padStart(2,'0'),30,36,28,col,'left',900);oTxt(it.years,W-30,36,24,'#9fb2d0','right',800);
  ccIcon(it.icon,W/2,170,1.15,col,t);
  c.save();c.font='900 34px '+SANS;ccWrap(it.title,W/2,310,W-50,n===4?32:36,'#fff',40,'center',900,2);c.restore();
  ccWrap(it.a,W/2,400,W-60,n===4?25:28,'#e6edf9',33,'center',700,3);
  ccWrap(it.b,W/2,485,W-60,n===4?22:25,'#9fb2d0',30,'center',700,3);
  const sp=eo((u-.5)/.3);if(sp>0)ccStamp(it.verdict==='CONFIRMED'?'CONFIRMED':'PARTLY CONFIRMED',W/2,580,it.verdict==='CONFIRMED'?'#58e08a':'#ffcb5b',sp,-.07,n===4?24:28);
  c.restore()});
 ctVignette(.55)}
const CCN2CH=[];
function ccIntro(t){const L=ATM.u00.lines;ccBg(t,3);
 const p=eo(t/.9);c.save();c.globalAlpha*=p;oFit('ALL THE CONSPIRACY THEORIES',960,380,1500,100,'#fff','center',900,22,'#7fb2ff');oFit('THAT CAME TRUE',960,500,1500,130,'#58e08a','center',900,26);c.restore();
 // redaction bars sweeping
 for(let i=0;i<5;i++){const w=300+i*70,y=590+i*30,u=eo((t-1.2-i*.12)/.5);c.fillStyle='rgba(255,255,255,.07)';c.fillRect(960-w/2,y,w,16);c.fillStyle='#e6edf9';c.fillRect(960-w/2,y,w*u*(1-eo((t-4.5)/1)*.0),16)}
 oShow(L[1]-.1,(q)=>{c.save();c.translate(960,850);c.scale(q,q);oTxt('35',-260,0,120,'#58e08a','center',900,30);oTxt('DOCUMENTED CASES',90,6,44,'#fff','center',900);c.restore()});
 ccStamp('DECLASSIFIED',1560,260,'#ff6a6a',eo((t-1.6)/.4),.12,44);ctVignette(.6)}
function ccRules(t){const L=ATM.u01.lines;ccBg(t,3);
 oShow(t-.1,()=>oTxt('THE RULES',960,170,56,'#fff','center',900,16,'#7fb2ff'));
 const R=[['gavel','COURT RULING','or official investigation'],['doc','DECLASSIFIED','government documents'],['person','THE INSIDERS','confessions & internal records']];
 R.forEach((r,i)=>oShow(t-(L[0]+.3+i*1.2),(p)=>{const x=420+i*540;c.save();c.translate(x,520);c.scale(p,p);oPanel(-230,-250,460,500,.6,'rgba(127,178,255,.4)',24);ccIcon(r[0],0,-70,1.5,'#7fb2ff',t);oTxt(r[1],0,100,38,'#fff','center',900);oTxt(r[2],0,150,26,'#9fb2d0','center',700);c.restore()}));
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(960,830);c.scale(p,p);oChip('NOT A VIDEO · NOT A HUNCH · NOT AN ANONYMOUS POST',0,0,28,'#ff6a6a');c.restore()});
 ctVignette(.55)}
function ccNot(t){const L=ATM.u23.lines;ccBg(t,1);
 oShow(t-.1,()=>oTxt('WHAT DID NOT COME TRUE',960,170,60,'#fff','center',900,16,'#ff6a6a'));
 const I=[['MOON LANDINGS','happened · laser mirrors still used','rocket'],['VACCINES → AUTISM','no link in large studies','syringe'],['FLAT EARTH','it is round','cloud'],['SANDY HOOK','it was real','candle']];
 I.forEach((q,i)=>oShow(t-(L[1]+.2+i*1.7),(p)=>{const x=170+i*410;c.save();c.translate(x,300);c.scale(p,p);rr(0,0,380,470,22,'rgba(10,14,26,.78)','#ff6a6a',3);ccIcon(q[2],190,130,1.0,'#ff9a9a',t);oFit(q[0],190,270,340,34,'#fff','center',900);ccWrap(q[1],190,330,320,24,'#c6d2e8',30,'center',700,3);ccStamp('NOT TRUE',190,420,'#ff6a6a',eo((t-(L[1]+.2+i*1.7)-.4)/.3),-.08,28);c.restore()}));
 oShow(t-(L[2]+.1),(p)=>{c.save();c.translate(960,840);c.scale(p,p);oChip('REAL CASES HAVE DOCUMENTS · COURT RECORDS · NAMED INSIDERS · MONEY TRAILS',0,0,24,'#58e08a');c.restore()});
 ctVignette(.55)}
function ccMethod(t){const L=ATM.u24.lines;ccBg(t,3);
 oShow(t-.1,()=>oTxt('FIVE QUESTIONS TO ASK',960,170,60,'#fff','center',900,16,'#7fb2ff'));
 const Q=['How many people must stay silent?','For how long?','Is there a document, court case or named insider?','Who benefits?','What evidence would prove it wrong?'];
 Q.forEach((q,i)=>oShow(t-(L[2]-.2+i*1.15),(p)=>{c.save();c.translate((1-p)*-70,0);const y=290+i*110;oPanel(300,y,1320,86,.6,'rgba(127,178,255,.4)',16);oTxt(String(i+1),350,y+43,44,'#7fb2ff','center',900);oTxt(q,420,y+43,34,'#fff','left',700);c.restore()}));
 // Grimes meter on left of first line
 oShow(t-(L[0]+.3),(p)=>{c.save();c.globalAlpha*=Math.max(0,1-eo((t-(L[1]+.6))/.6));c.translate(960,540);c.scale(p,p);oPanel(-440,-210,880,420,.8,'rgba(255,200,100,.5)',24);oTxt('GRIMES · 2016 · PLOS ONE',0,-150,28,'#ffcb5b','center',900);oTxt('faking the Moon landing',0,-90,36,'#fff','center',800);oTxt('~411,000 people',0,0,84,'#ff9a9a','center',900,20);oTxt('exposed in about 4 years',0,100,40,'#ffe6b0','center',800);c.restore()});
 ctVignette(.55)}
function ccLessons(t){const L=ATM.u25.lines;ccBg(t,6);
 const Q=[['1','POWER HIDES THINGS','when exposure costs money or reputation'],['2','SECRETS COME OUT','through insiders, journalists, documents'],['3','SKEPTICISM CUTS BOTH WAYS','doubt power · doubt claims without proof']];
 Q.forEach((q,i)=>oShow(t-(L[0]+.3+i*2.6),(p)=>{c.save();c.translate((1-p)*-60,0);const y=270+i*190;oPanel(250,y,1420,150,.6,'rgba(255,143,192,.4)',20);oTxt(q[0],330,y+75,80,'#ff8fc0','center',900,16);oTxt(q[1],420,y+52,44,'#fff','left',900);oTxt(q[2],420,y+102,30,'#b6c4de','left',700);c.restore()}));
 oShow(t-(L[1]+.2),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oChip('WHICH CASE SURPRISED YOU MOST? TELL ME IN THE COMMENTS',0,0,26,'#ffd48a');c.restore()});
 ctVignette(.55)}
function ccEnd(t){ccBg(t,3);const p=eo(t/1.2);c.save();c.globalAlpha*=p;oFit('TRUST EVIDENCE.',960,470,1500,130,'#fff','center',900,24,'#7fb2ff');oFit('NOT TONE.',960,620,1500,130,'#58e08a','center',900,24);c.restore();ctVignette(.7)}
['u02','u03','u05','u06','u08','u09','u10','u11','u12','u14','u15','u16','u17','u18','u19','u21'].forEach(id=>{SC['a_'+id]=(t)=>ccDeep(id,t)});
['u04','u07','u13','u20','u22'].forEach(id=>{SC['a_'+id]=(t)=>ccRapid(id,t)});
SC.a_u00=ccIntro;SC.a_u01=ccRules;SC.a_u23=ccNot;SC.a_u24=ccMethod;SC.a_u25=ccLessons;SC.a_uend=ccEnd;
// thumbnails
SC.thumb_cc_A=(t)=>{ccBg(0,3);oGlow(960,540,900,'#58e08a',.12);c.save();c.fillStyle='rgba(0,0,0,.0)';c.restore();
 oFit('THEY SAID',480,300,860,150,'#9fb2d0','center',900);oFit('"CONSPIRACY"',480,470,860,140,'#ff6a6a','center',900,24);
 c.save();c.translate(1360,540);ccStamp('CONFIRMED',0,0,'#58e08a',1,-.14,170);c.restore();oFit('35 DOCUMENTED CASES',960,860,1700,90,'#fff','center',900,18,'#7fb2ff');ctVignette(.5)};
SC.thumb_cc_B=(t)=>{ccBg(0,3);c.save();c.translate(960,470);for(let i=0;i<4;i++){c.fillStyle='#e6edf9';c.fillRect(-600,-200+i*95,Math.min(1200,700+i*170),48)}c.restore();
 c.save();c.fillStyle='#0b1018';c.fillRect(300,180,1320,500);c.restore();for(let i=0;i<5;i++){c.fillStyle=i%2?'#e6edf9':'#c8d4e8';c.fillRect(380,230+i*88,i===4?500:1160-i*70,46)}
 ccStamp('TRUE',1360,500,'#58e08a',1,-.16,220);oFit('DECLASSIFIED',960,820,1700,130,'#ff6a6a','center',900,26);ctVignette(.5)};
SC.thumb_cc_C=(t)=>{ccBg(0,3);oFit('"THAT\'S JUST A',960,260,1700,130,'#9fb2d0','center',900);oFit('CONSPIRACY THEORY"',960,410,1700,140,'#fff','center',900,18);
 c.save();c.strokeStyle='#ff6a6a';c.lineWidth=14;c.shadowColor='#ff6a6a';c.shadowBlur=24;c.beginPath();c.moveTo(220,470);c.lineTo(1700,360);c.stroke();c.restore();
 oFit('...UNTIL THE FILES',960,640,1700,110,'#ffcb5b','center',900);oFit('CAME OUT',960,770,1700,150,'#58e08a','center',900,28);ctVignette(.55)};
