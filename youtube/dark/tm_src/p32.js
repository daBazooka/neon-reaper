// ---------- x13 5,000 years ----------
SC.a_x13=(t)=>{const id='x13',A=aT(id),L=A.lines;tmBg(t,'#140e08','#030201',TMC.gold,.22);tmHud(id,t);
  // pyramid + tablet + timeline
  const g=eo((t-oT(id,0,'five'))/1.2);c.save();c.globalAlpha*=g;c.translate(560,700);c.fillStyle=lg(0,-300,0,0,[[0,'#e8c27a'],[1,'#8a6a34']]);c.beginPath();c.moveTo(-300,0);c.lineTo(0,-300);c.lineTo(300,0);c.closePath();c.fill();c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.moveTo(0,-300);c.lineTo(300,0);c.lineTo(60,0);c.closePath();c.fill();for(let i=1;i<9;i++){c.strokeStyle='rgba(60,40,10,.35)';c.lineWidth=2;const y=-i*33;c.beginPath();c.moveTo(-300+i*33,y);c.lineTo(300-i*33,y);c.stroke()}c.restore();
  oShow(t-oT(id,0,'pyramid'),()=>{oChip('GREAT PYRAMID · ≈ 4,500 YEARS OLD',560,790,28,TMC.gold)});
  // tablet with marks
  oShow(t-oT(id,0,'writing'),(p)=>{c.save();c.translate(1330,520);c.scale(p,p);rr(-230,-190,460,380,28,'#8a6a4a','#c9a56a',5);for(let r=0;r<6;r++)for(let q=0;q<9;q++){if(rnd(r*9+q)<.3)continue;c.fillStyle='rgba(40,25,10,.7)';c.save();c.translate(-190+q*46,-140+r*54);c.rotate(rnd(r+q)*.3);c.fillRect(0,0,28,8);c.fillRect(8,-6,8,26);c.restore()}c.restore();oTxt('WRITING IS BORN',1330,780,34,TMC.gold,'center',800)});
  oShow(t-oT(id,1,'love'),(p)=>{c.save();c.translate(960,830);c.scale(p,p);oChip('EVERY BOOK · EVERY LAW · EVERY LOVE LETTER — INSIDE ONE RUNG',0,0,34,TMC.gold);c.restore()});
};
// ---------- x14 300,000 years ----------
SC.a_x14=(t)=>{const id='x14',A=aT(id),L=A.lines;tmBg(t,'#0d0a12','#020105',TMC.pink,.2);tmHud(id,t);
  // timeline bar 300,000 yrs
  const x0=200,x1=1720,y=470,g=eo((t-oT(id,0,'three'))/1.5);oTxt('300,000 YEARS OF HOMO SAPIENS',960,300,50,'#fff','center',800,20);
  rr(x0,y,(x1-x0)*g,70,35,hexa(TMC.pink,.6));const ta=oT(id,1,'ninety');
  if(t>ta){const f=eo((t-ta)/1.4);rr(x0,y,(x1-x0)*.96*f,70,35,TMC.pink);rr(x0+(x1-x0)*.96,y,(x1-x0)*.04*f,70,20,TMC.gold);oTxt('96%',x0+(x1-x0)*.48,y+35,46,'#05060c','center',800);oTxt('4%',x0+(x1-x0)*.98,y+90,40,TMC.gold,'center',800)}
  oShow(t-ta,()=>{oTxt('HUNTERS AND GATHERERS',x0+(x1-x0)*.48,y-30,32,TMC.pink,'center',800);oTxt('CIVILIZATION',x1-120,y-30,28,TMC.gold,'center',800)});
  // campfire + figures
  oShow(t-oT(id,0,'fossils'),()=>{c.save();c.translate(960,780);oGlow(0,0,260,'#ff8a3d',.4+.1*Math.sin(t*9));for(let k=0;k<5;k++){c.fillStyle=['#ff4a1d','#ff8a3d','#ffd24a'][k%3];c.beginPath();c.moveTo(-34+k*10,0);c.quadraticCurveTo(-20+k*10,-80-Math.sin(t*8+k)*14,0,-130+Math.sin(t*6+k)*12);c.quadraticCurveTo(20-k*10,-70,34-k*10,0);c.fill()}[-300,-180,190,310].forEach((fx,i)=>oFig(fx,40,.55,'#0a0b14',TMC.pink,i%2));c.restore()});
  oTxt('JEBEL IRHOUD, MOROCCO · ≈ 300,000 YEARS',960,880,26,OC.dim,'center',700);
};
// ---------- x15 380,000 years ----------
SC.a_x15=(t)=>{const id='x15',A=aT(id),L=A.lines;tmBg(t,'#14080a','#030102',TMC.red,.25);tmHud(id,t);
  const tc=oT(id,1,'cooled'),g=cl((t-tc)/3.5);
  // fog -> clear
  c.save();c.beginPath();c.roundRect(110,260,860,600,30);c.clip();for(let i=0;i<160;i++){const a=rnd(i)*PI*2,r=Math.sqrt(rnd(i*3))*560;c.fillStyle=`rgba(255,${120+Math.floor(rnd(i)*100)},60,${(.5*(1-g)+.08)*.7})`;c.beginPath();c.arc(540+Math.cos(a+t*.1)*r,560+Math.sin(a+t*.1)*r*.8,30+rnd(i*7)*60,0,PI*2);c.fill()}c.fillStyle=`rgba(255,160,90,${.35*(1-g)})`;c.fillRect(110,260,860,600);
  if(g>0){for(let i=0;i<40;i++){const u=mod(t*.4+rnd(i),1),a=rnd(i*5)*PI*2;c.strokeStyle=`rgba(255,255,255,${g*(1-u)*.7})`;c.lineWidth=2;c.beginPath();c.moveTo(540+Math.cos(a)*u*500,560+Math.sin(a)*u*400);c.lineTo(540+Math.cos(a)*(u*500+40),560+Math.sin(a)*(u*400+30));c.stroke()}}c.restore();
  oTxt(g<.5?'OPAQUE FOG':'LIGHT IS FREE',540,300,34,g<.5?TMC.red:TMC.cyan,'center',800);
  // CMB map
  oPanel(990,260,820,600,.45,hexa(TMC.cyan,.3));oShow(t-oT(id,1,'microwave'),()=>{c.save();c.translate(1400,560);c.beginPath();c.ellipse(0,0,350,190,0,0,PI*2);c.clip();c.fillStyle='#16224a';c.fillRect(-360,-200,720,400);for(let i=0;i<260;i++){const x=(rnd(i)-.5)*700,y=(rnd(i*3)-.5)*380,r=14+rnd(i*5)*34,w=rnd(i*7);c.fillStyle=w<.4?'rgba(255,90,60,.55)':w<.8?'rgba(80,140,255,.55)':'rgba(255,230,120,.5)';c.beginPath();c.arc(x,y,r,0,PI*2);c.fill()}c.restore();c.strokeStyle=hexa(TMC.cyan,.7);c.lineWidth=4;c.beginPath();c.ellipse(1400,560,350,190,0,0,PI*2);c.stroke();oTxt('THE COSMIC MICROWAVE BACKGROUND',1400,300,30,TMC.cyan,'center',800)});
  oShow(t-oT(id,1,'television'),(p)=>{c.save();c.translate(1400,810);c.scale(p,p);oChip('PART OF OLD TV STATIC WAS THIS LIGHT',0,0,30,TMC.gold);c.restore()});
  oShow(t-oT(id,0,'fog'),()=>{oTxt('380,000 YEARS AFTER THE BIG BANG',960,230+0,0,'#fff')});
  tmEgg(1750,840,t,.7,.5);
};
// ---------- x16 66 million ----------
SC.a_x16=(t)=>{const id='x16',A=aT(id),L=A.lines;tmBg(t,'#120a08','#030101',TMC.red,.25);tmHud(id,t);
  const ti=oT(id,0,'rock'),u=cl((t-ti)/3);
  c.save();c.fillStyle=lg(0,300,0,860,[[0,'#1a2a4a'],[1,'#c9784a']]);c.fillRect(110,260,1700,600);c.fillStyle='#10130e';c.beginPath();c.moveTo(110,860);for(let x=110;x<=1810;x+=30)c.lineTo(x,760-Math.sin(x*.01)*30);c.lineTo(1810,860);c.closePath();c.fill();
  // asteroid streak
  if(u<1){const ax=300+u*1000,ay=300+u*420;c.strokeStyle='rgba(255,180,90,.9)';c.lineWidth=14;c.shadowColor='#ff8a3d';c.shadowBlur=40;c.beginPath();c.moveTo(ax-300,ay-250);c.lineTo(ax,ay);c.stroke();c.fillStyle='#ffd8a0';c.beginPath();c.arc(ax,ay,26,0,PI*2);c.fill()}
  else{const w=cl((t-ti-3)/3);oGlow(1300,720,260+w*900,'#ff8a3d',.8*(1-w*.7));c.strokeStyle=`rgba(255,200,120,${1-w})`;c.lineWidth=10;c.beginPath();c.ellipse(1300,740,200+w*900,60+w*160,0,PI,PI*2);c.stroke()}c.restore();
  oShow(t-oT(id,0,'ten'),(p)=>{c.save();c.translate(960,330);c.scale(p,p);oTxt('10 KM WIDE',0,0,110,'#fff','center',800,30,TMC.red);c.restore()});
  oShow(t-oT(id,0,'dinosaurs'),()=>{oChip('66 MILLION YEARS AGO · YUCATÁN, MEXICO',960,760,30,TMC.red)});
  oShow(t-oT(id,1,'merciless'),(p)=>{c.save();c.translate(960,830);c.scale(p,p);oChip('CATASTROPHE: HOURS  ·  RECOVERY: MILLIONS OF YEARS',0,0,34,TMC.gold);c.restore()});
};
// ---------- x17 540 million ----------
SC.a_x17=(t)=>{const id='x17',A=aT(id),L=A.lines;tmBg(t,'#06141a','#010608',TMC.cyan,.22);tmHud(id,t);
  // sea floor + trilobites
  c.fillStyle=lg(0,300,0,880,[[0,'#0b3a52'],[1,'#02141c']]);c.fillRect(110,260,1700,620);c.fillStyle='#16313a';c.beginPath();c.moveTo(110,880);for(let x=110;x<=1810;x+=30)c.lineTo(x,820-Math.sin(x*.012)*18);c.lineTo(1810,880);c.closePath();c.fill();
  for(let i=0;i<7;i++){const u=t-(oT(id,0,'cambrian')+i*.35);oShow(u,(p)=>{c.save();c.translate(260+i*240+Math.sin(t*.5+i)*20,780+rnd(i)*20);c.scale(p,p);c.fillStyle='#8a6a3a';c.beginPath();c.ellipse(0,0,66,30,0,0,PI*2);c.fill();c.strokeStyle='#caa468';c.lineWidth=3;for(let k=-3;k<=3;k++){c.beginPath();c.moveTo(k*14,-26);c.lineTo(k*14,26);c.stroke()}c.fillStyle='#fff';c.beginPath();c.arc(-48,-14,5,0,PI*2);c.arc(-48,14,5,0,PI*2);c.fill();c.restore()})}
  oShow(t-oT(id,0,'eyes'),()=>{oChip('EYES · SHELLS · LEGS',960,330,40,TMC.cyan)});
  // life timeline
  const tl=oT(id,1,'cells');oShow(t-tl,()=>{oPanel(210,430,1500,150,.6,hexa(TMC.cyan,.4));const f=eo((t-tl)/1.6);rr(250,490,1100*f,36,18,TMC.grn);rr(1350,490,320*f,36,18,TMC.gold);oTxt('SINGLE CELLS · ≥ 3.5 BILLION YEARS',800,470,26,TMC.grn,'center',800);oTxt('ANIMALS · 540 MILLION',1510,470,26,TMC.gold,'center',800);oTxt('MOST OF EARTH\'S HISTORY: NOTHING BIGGER THAN A MICROBE',960,555,28,'#fff','center',800)});
};
// ---------- x18 age of the universe ----------
SC.a_x18=(t)=>{const id='x18',A=aT(id),L=A.lines;tmBg(t,'#080a1a','#010208',TMC.vio,.25);tmHud(id,t);
  const x0=200,x1=1720,y=560,g=eo((t-oT(id,0,'four'))/1.4);
  c.save();c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=6;c.beginPath();c.moveTo(x0,y);c.lineTo(x1,y);c.stroke();rr(x0,y-18,(x1-x0)*g,36,18,hexa(TMC.vio,.7));c.restore();
  const marks=[[0,'BIG BANG','',TMC.red,0],[.015,'FIRST STARS','100–250 MILLION YEARS',TMC.gold,oT(id,1,'first')],[.67,'EARTH','4.54 BILLION YEARS AGO',TMC.cyan,oT(id,0,'four')+.2],[1,'NOW','13.8 BILLION YEARS',TMC.grn,oT(id,0,'thirteen')]];
  marks.forEach(([f,a,b,col,tm],i)=>oShow(t-tm,(p)=>{const x=x0+(x1-x0)*f;c.save();c.translate(x,y);c.scale(p,p);c.fillStyle=col;c.shadowColor=col;c.shadowBlur=22;c.beginPath();c.arc(0,0,16,0,PI*2);c.fill();c.restore();oTxt(a,x,y+(i%2?-70:-70),34,col,'center',800);oTxt(b,x,y+(i%2?70:70),22,OC.dim,'center',700)}));
  oShow(t-oT(id,1,'top'),(p)=>{c.save();c.translate(960,800);c.scale(p,p);oChip('THE TOP OF THE PAST · WE ARRIVED VERY LATE',0,0,40,TMC.vio);c.restore()});
  oShow(t-oT(id,0,'age'),(p)=>{c.save();c.translate(960,350);c.scale(p,p);oTxt('13.8 BILLION YEARS',0,0,130,'#fff','center',800,32,TMC.vio);oTxt('= 4.35 × 10¹⁷ SECONDS',0,86,44,TMC.gold,'center',800,16);c.restore()},.4);
};
// ---------- x19 five billion years ----------
SC.a_x19=(t)=>{const id='x19',A=aT(id),L=A.lines;tmBg(t,'#140a08','#030101',TMC.gold,.22);tmHud(id,t);
  // sun swelling
  const ts=oT(id,0,'five'),g=cl((t-ts)/5);oPanel(110,260,860,600,.4,hexa(TMC.gold,.3));
  c.save();c.translate(400,560);const R=70+g*190;oGlow(0,0,R*2.2,g<.5?TMC.gold:TMC.red,.6);c.fillStyle=g<.5?TMC.gold:'#ff5a3a';c.beginPath();c.arc(0,0,R,0,PI*2);c.fill();const ex=500-0;c.fillStyle='#1c6aa8';c.beginPath();c.arc(380,0,24,0,PI*2);c.fill();c.restore();
  oTxt(g<.35?'+1 BILLION YEARS: OCEANS BOIL':'+5 BILLION: RED GIANT',540,300,30,g<.35?TMC.cyan:TMC.red,'center',800);
  // collision
  const tc=oT(id,1,'andromeda'),u=cl((t-tc)/6);oPanel(990,260,820,600,.4,hexa(TMC.vio,.3));
  [[1250,560,1],[1550,560,-1]].forEach(([x,y,d],i)=>{c.save();c.translate(x+d*u*150,y);c.rotate(t*.2*d);oGlow(0,0,140,i?TMC.pink:TMC.vio,.5);for(let k=0;k<140;k++){const a=k*.4,r=10+k*1.1;c.fillStyle=i?'rgba(255,170,220,.7)':'rgba(170,150,255,.7)';c.beginPath();c.arc(Math.cos(a)*r,Math.sin(a)*r*.5,2,0,PI*2);c.fill()}c.restore()});
  oTxt('MILKY WAY  ·  ANDROMEDA',1400,300,30,TMC.vio,'center',800);
  oShow(t-oT(id,1,'fifty'),(p)=>{c.save();c.translate(1400,780);c.scale(p,p);oChip('COLLISION: ABOUT 50 / 50 WITHIN 10 BILLION YEARS',0,0,28,TMC.vio);c.restore();c.save();c.translate(1400,840);oTxt('(SAWALA ET AL. · 2025)',0,0,22,OC.dim,'center',700);c.restore()});
  tmEgg(1760,330,t,.7,.5);
};
