// ---------- y16 the leash (5 rules) ----------
function skLock(x,y,s,col){c.save();c.translate(x,y);c.scale(s,s);c.strokeStyle=col;c.lineWidth=8;c.beginPath();c.arc(0,-14,24,PI,PI*2);c.stroke();rr(-34,-14,68,54,10,col);c.restore()}
function skRuleCard(t,u,n,title,sub,col,icon){c.save();c.globalAlpha*=cl(u/.25);const p=apop(u,.25);c.translate(1010,520);c.scale(p,p);oPanel(-720,-330,1440,640,.82,hexa(col,.55),34);
  oTxt(n+'',-600,-170,220,col,'center',800,40);oTxt(title,-440,-200,56,SKC.wht,'left',800);oTxt(sub,-440,-130,26,SKC.dim,'left',700);c.save();c.translate(170,20);icon(u);c.restore();c.restore()}
SC.a_y16=(t)=>{const id='y16';skBg(t,SKC.grn,.2,'#07120d');skHud(id,t,oT(id,0,'leash')+1);const gy=800;
  const T=[oT(id,1,'one'),oT(id,2,'two'),oT(id,3,'three'),oT(id,4,'four'),oT(id,5,'five')];
  oShow(t-oT(id,0,'leash'),(p)=>{if(t<T[0]-.2){c.save();c.translate(960,470);c.scale(p,p);oTxt('THE LEASH',0,-40,170,SKC.grn,'center',800,40);oTxt('5 RULES · FOR SAM · AND FOR YOU',0,90,46,SKC.wht,'center',800);c.restore()}});
  const cur=T.filter(x=>t>=x).length;
  if(cur>=1){const i=cur-1,u=t-T[i];const defs=[
    ['SLEEP FLOOR','a fixed bedtime the obsession is not allowed to negotiate',SKC.blu,(u)=>{c.save();rr(-250,40,420,110,14,'#161a38','rgba(255,255,255,.2)',2);rr(-250,10,110,50,10,'#222850');skFig(-90,95,.55,{tl:1.5,hd:0,la:[.2,.1],ra:[.1,.1],ll:[1.5,0],rl:[1.5,0]},{face:'smile',t,a:.9});for(let k=0;k<3;k++){const z=mod(t*.6+k/3,1);c.globalAlpha=1-z;oTxt('z',60+z*50,-10-z*70,40+k*10,SKC.blu,'center',800);c.globalAlpha=1}c.restore();oTxt('10:30 PM',-20,-120,92,SKC.blu,'center',800,24);skLock(150,-110,1.3,SKC.amb)}],
    ['ONE SACRED APPOINTMENT','a person, on the calendar, that work cannot move',SKC.vio,(u)=>{c.save();oPanel(-260,-190,520,330,.9,hexa(SKC.vio,.6),24);oTxt('THURSDAY',0,-140,34,SKC.vio,'center',800);oTxt('7:00 PM',0,-80,70,SKC.wht,'center',800);oTxt('DINNER · NOT MOVABLE',0,-12,26,SKC.amb,'center',800);skPeople(-40,92,1.4,SKC.wht);skLock(190,100,1.2,SKC.amb);c.restore()}],
    ['A BODY CHECK','a doctor visit · one number you track · your body gets a vote',SKC.red,(u)=>{c.save();skHeart(-150,-20,2.1,SKC.red,t);oPanel(-20,-120,330,240,.9,hexa(SKC.red,.6),24);oTxt('1 NUMBER',145,-70,26,SKC.dim,'center',800);c.strokeStyle=SKC.grn;c.lineWidth=5;c.beginPath();for(let k=0;k<=20;k++){const x=0+k*14,y=40-Math.sin(k*.6+t*2)*18-k*1.5;k?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();oTxt('RESTING HEART RATE',145,92,20,SKC.dim,'center',800);c.restore()}],
    ['A KILL SWITCH','decide the red line that means stop — while you are calm',SKC.red,(u)=>{c.save();c.fillStyle='#2a0f14';c.beginPath();c.arc(-70,20,120,0,PI*2);c.fill();c.strokeStyle=SKC.red;c.lineWidth=8;c.stroke();c.fillStyle=SKC.red;c.shadowColor=SKC.red;c.shadowBlur=28;c.beginPath();c.arc(-70,20,84,0,PI*2);c.fill();c.shadowBlur=0;oTxt('STOP',-70,20,56,SKC.wht,'center',800);oTxt('IF SLEEP < 6 H',200,-60,34,SKC.wht,'left',800);oTxt('IF DINNERS MISSED > 2',200,0,34,SKC.wht,'left',800);oTxt('IF BODY SAYS SO',200,60,34,SKC.wht,'left',800);c.restore()}],
    ['AN OFF-RAMP DATE','every 90 days: is this adding to my life, or subtracting?',SKC.teal,(u)=>{c.save();c.strokeStyle=SKC.teal;c.lineWidth=12;c.lineCap='round';c.beginPath();c.arc(-100,10,100,-.5+t*1.2,PI*1.5+t*1.2);c.stroke();const a=t*1.2-.5;c.fillStyle=SKC.teal;c.beginPath();c.moveTo(-100+Math.cos(a)*100,10+Math.sin(a)*100);c.lineTo(-100+Math.cos(a-.4)*130,10+Math.sin(a-.4)*130);c.lineTo(-100+Math.cos(a+.4)*130,10+Math.sin(a+.4)*130);c.fill();oTxt('90',-100,10,80,SKC.wht,'center',800);oTxt('DAYS',-100,66,24,SKC.dim,'center',800);oTxt('ADDING',210,-30,50,SKC.grn,'left',800);oTxt('— OR —',210,24,24,SKC.dim,'left',800);oTxt('SUBTRACTING?',210,70,50,SKC.red,'left',800);c.restore()}]][i];
    skRuleCard(t,u,i+1,defs[0],defs[1],defs[2],defs[3])}
  // Sam on the left bottom, healthier as rules land
  skFloor(gy+30,0,1920,'rgba(255,255,255,.08)');if(cur>=1)skFig(200,gy-92*.8+30,.8,skMix(STKP.slump,STKP.stand,cl(cur/4)),{face:cur>=3?'smile':'n',t,glow:10,gc:SKC.grn})};
// ---------- y17 one day off test ----------
SC.a_y17=(t)=>{const id='y17';skBg(t,SKC.teal,.2,'#07121a');skHud(id,t,oT(id,0,'test'));const gy=800;
  oShow(t-oT(id,0,'test'),(p)=>{c.save();c.translate(960,290);c.scale(p,p);oTxt('ONE FULL DAY OFF',0,0,100,SKC.wht,'center',800,26,SKC.teal);c.restore()},.4);
  ['NO WORK','NO PLANNING','NO CHECKING'].forEach((n,i)=>{oShow(t-(oT(id,0,'work')+i*.9),(p)=>{c.save();c.translate(560+i*400,420);c.scale(p,p);oChip(n,0,0,30,SKC.teal);c.restore()})});
  skFloor(gy,0,1920);
  // rest side
  oShow(t-oT(id,1,'rest'),(p)=>{c.save();c.translate(0,0);c.fillStyle='rgba(255,255,255,.1)';c.fillRect(958,480,4,320);oGlow(500,620,260,SKC.grn,.3);c.save();c.translate(500,620);c.fillStyle='#ffd27a';c.shadowColor='#ffd27a';c.shadowBlur=30;c.beginPath();c.arc(120,-120,40,0,PI*2);c.fill();c.restore();
    skFig(500,gy-52*1.15,1.15,{...STKP.sit,tl:-.1,la:[.2,.6],ra:[.15,.6]},{face:'smile',t,glow:8,gc:SKC.grn,gy});const br=Math.sin(t*1.2)*.5+.5;oChip('REST = PASSIONATE',500,490,28,SKC.grn);c.restore()});
  // panic side
  oShow(t-oT(id,1,'panic'),(p)=>{c.save();const tw=Math.sin(t*30)*2;skFig(1420+tw,gy-52*1.15,1.15,{...STKP.sit,tl:.25,la:[.9+Math.sin(t*20)*.1,1.4],ra:[.8,1.5]},{face:'mania',t,glow:8,gc:SKC.red,gy});
    ['PLAN','CHECK','OPTIMISE','PLAN...'].forEach((w,i)=>{c.save();c.translate(1250+i*110+Math.sin(t*2+i)*8,640-i*38);oThought(0,0,1.1,t,i);oTxt(w,0,2,14,SKC.wht,'center',800);c.restore()});oChip('PANIC = IT HOLDS YOU',1420,490,26,SKC.red);c.restore()});
  oShow(t-oT(id,2,'shame'),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oChip('NO SHAME IN EITHER.  NOW YOU KNOW.',0,0,30,SKC.amb);c.restore()})};
// ---------- y18 close ----------
SC.a_y18=(t)=>{const id='y18';skBg(t,SKC.amb,.26,'#1a1208','#02030a');skHud(id,t,oT(id,0,'back'));const gy=800;
  // sunrise
  const rise=eo(t/6);c.save();c.fillStyle=rg(960,gy-60+(1-rise)*200,10,620,[[0,'rgba(255,200,110,.7)'],[1,'rgba(255,150,60,0)']]);c.fillRect(0,0,1920,1080);c.restore();c.save();c.fillStyle='#ffc866';c.shadowColor='#ffc866';c.shadowBlur=60;c.beginPath();c.arc(960,gy-40+(1-rise)*220,100,0,PI*2);c.fill();c.restore();
  c.fillStyle='#0b0d18';c.beginPath();c.moveTo(0,gy);c.quadraticCurveTo(480,gy-90,960,gy);c.quadraticCurveTo(1440,gy+60,1920,gy-20);c.lineTo(1920,1080);c.lineTo(0,1080);c.fill();
  // fire + friends
  const fx=1060,fy=gy-4;for(let i=0;i<14;i++){const u=mod(t*1.1+i/14,1);c.fillStyle=`rgba(255,${120+u*100|0},60,${1-u})`;c.beginPath();c.arc(fx+Math.sin(i*3+t*4)*14*(1-u),fy-u*110,16*(1-u)+4,0,PI*2);c.fill()}oGlow(fx,fy-30,200,SKC.amb,.5);
  [[820,'smile',1],[1260,'smile',-1],[1370,'smile',-1]].forEach(([x,f,d],i)=>skFig(x,gy-52*.9,.9,{...STKP.sit,la:[.3,.7],ra:[.2,.7]},{dir:d,face:f,t,col:SKC.blu,a:.95}));
  skFig(930,gy-52*1.15,1.15,{...STKP.sit,la:[.3,.7],ra:[.2,.7]},{face:'smile',t,glow:12,gc:SKC.amb});
  oShow(t-oT(id,2,'only'),(p)=>{c.save();c.globalAlpha*=1-cl((t-oT(id,3,'act')+.2)/.5);c.translate(960,300);c.scale(p,p);oTxt('ONLY YOU DECIDE',0,-40,84,SKC.wht,'center',800,26,SKC.amb);oTxt('WHAT YOU WILL PAY.',0,64,100,SKC.amb,'center',800,30);c.restore()},.4);
  // act cards
  oShow(t-oT(id,3,'act'),(p)=>{c.save();c.translate(960,320);c.scale(p,p);oTxt('WHICH ACT OF SAM\'S',0,-44,80,SKC.wht,'center',800,24,SKC.amb);oTxt('STORY WERE YOU IN?',0,50,92,SKC.amb,'center',800,28);c.restore()},.3);
  [['1','DISCIPLINE'],['2','OBSESSION'],['3','THE COST'],['4','THE TRAP'],['5','THE LEASH']].forEach(([n,lab],i)=>{oShow(t-(oT(id,3,'one')+i*.35),(p)=>{c.save();c.translate(260+i*350,860-30);c.scale(p,p);oChip(n+' · '+lab,0,0,24,[SKC.teal,SKC.amb,SKC.red,SKC.vio,SKC.grn][i]);c.restore()})})};
// ---------- yend ----------
SC.a_yend=(t)=>{skBg(t,SKC.amb,.3,'#1a1208','#02030a');const gy=800;
  // fireplace
  c.save();c.translate(960,gy);rr(-300,-420,600,420,10,'#1a1520','rgba(255,255,255,.25)',4);rr(-220,-330,440,330,10,'#05030a','rgba(255,255,255,.18)',3);
  for(let i=0;i<30;i++){const u=mod(t*.9+i/30,1),x=Math.sin(i*5+t*3)*80*(1-u);c.fillStyle=`rgba(255,${100+u*120|0},50,${.9*(1-u)})`;c.beginPath();c.arc(x,-30-u*250,34*(1-u)+6,0,PI*2);c.fill()}c.restore();oGlow(960,gy-120,420,SKC.amb,.5);
  oShow(t-.8,(p)=>{c.save();c.translate(960,220);c.scale(p,p);oTxt('OBSESSION IS A FIRE.',0,0,96,SKC.wht,'center',800,26,SKC.amb);c.restore()},.4);
  oShow(t-2.6,(p)=>{c.save();c.translate(960,330);c.scale(p,p);oTxt('BUILD THE FIREPLACE.',0,0,96,SKC.amb,'center',800,30);c.restore()},.4);
  oShow(t-4.6,()=>{oTxt('THE COST OF OBSESSION',960,900,36,SKC.dim,'center',800);oTxt('Which act were you in?  1 – 5',960,950,30,SKC.amb,'center',800)})};
