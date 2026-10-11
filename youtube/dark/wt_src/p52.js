// ---------- g09 any want ----------
SC.a_g09=(t)=>{const id='g09';wBg(t,SKC.amb,.22);wHud(id,t);
  oShow(t-oT(id,0,'any'),(p)=>{c.save();c.translate(960,190);c.scale(p,p);oTxt('THE SAME SYSTEM, ANY WANT.',0,0,66,SKC.wht,'center',800,22,SKC.amb);c.restore()},.3);
  const C=[['A RAISE',SKC.amb,'raise',['NAME: the number + the date','EVIDENCE: 3 pieces','ASK: a 20-minute meeting']],['FITNESS',SKC.grn,'fitness',['IF 6:30 AM → THEN shoes on','10 minutes, no debate','TRACK: days done']],['A CREATIVE PROJECT',SKC.vio,'creative',['PUBLISH: one piece every Sunday','ASK: 3 people for honest feedback','ADJUST: weekly']],['A FRIENDSHIP',SKC.blu,'friendship',['PICK: one person this week','ASK: dinner, a date, a place','REACH: keep it small']]];
  C.forEach(([n,col,nd,lines],i)=>{oShow(t-oT(id,i+1,nd),(p)=>{c.save();c.translate(500+(i%2)*920,400+Math.floor(i/2)*300);c.scale(p,p);wCard(-430,-125,860,250,col);oTxt(n,-390,-82,40,col,'left',800,12);lines.forEach((l,k)=>oTxt(l,-390,-24+k*46,28,SKC.wht,'left',700));c.restore()})})};
// ---------- g10 adjust ----------
SC.a_g10=(t)=>{const id='g10';wBg(t,SKC.teal,.2,'#07121a');wHud(id,t);
  oShow(t-oT(id,0,'adjust'),(p)=>{c.save();c.translate(960,190);c.scale(p,p);oTxt('ADJUST — YOUR FIRST PLAN WILL BE WRONG.',0,0,60,SKC.wht,'center',800,22,SKC.teal);c.restore()},.3);
  // weekly review
  oShow(t-oT(id,1,'week'),(p)=>{c.save();c.translate(520,500);c.scale(p,p);wCard(-400,-200,800,430,SKC.teal);oTxt('WEEKLY REVIEW · 10 MINUTES',0,-160,30,SKC.teal,'center',800);
    [['ASKS SENT',20,'asks'],['REPLIES',3,'replies'],['WHAT I LEARNED','…','learned']].forEach(([n,v,nd],i)=>{const u=t-oT(id,1,nd);if(u>-.2){c.save();c.globalAlpha=cl((u+.2)/.4);const y=-70+i*110;oTxt(n,-360,y,34,SKC.wht,'left',800);const k=eo(u/1.2);oTxt(typeof v==='number'?Math.round(v*k)+'':v,320,y,76,SKC.amb,'right',800,18);c.restore()}});c.restore()},.3);
  oShow(t-oT(id,2,'track'),(p)=>{c.save();c.translate(520,790);c.scale(p,p);oChip('TRACK WHAT YOU CONTROL — NOT WHAT YOU DO NOT',0,0,26,SKC.grn);c.restore()});
  // fixed goal / rotating method
  oShow(t-oT(id,3,'fixed'),(p)=>{c.save();c.translate(1400,500);c.scale(p,p);wCard(-400,-200,800,430,SKC.amb);const r=t*1.1;c.strokeStyle=SKC.teal;c.lineWidth=10;c.lineCap='round';c.beginPath();c.arc(0,-10,120,r,r+4.2);c.stroke();const a=r+4.2;c.fillStyle=SKC.teal;c.beginPath();c.moveTo(Math.cos(a)*120,-10+Math.sin(a)*120);c.lineTo(Math.cos(a-.35)*150,-10+Math.sin(a-.35)*150);c.lineTo(Math.cos(a+.35)*150,-10+Math.sin(a+.35)*150);c.fill();
    c.fillStyle='#16110a';c.beginPath();c.arc(0,-10,76,0,PI*2);c.fill();c.strokeStyle=SKC.amb;c.lineWidth=5;c.stroke();oTxt('GOAL',0,-24,26,SKC.amb,'center',800);oTxt('FIXED',0,10,26,SKC.amb,'center',800);oTxt('METHOD: CHANGES',0,-170,28,SKC.teal,'center',800);
    const z=t-oT(id,3,'zero');if(z>0){c.save();c.globalAlpha=cl(z/.4);oTxt('20 ASKS · 0 REPLIES',0,150,34,SKC.red,'center',800);oTxt('→ THE MESSAGE IS WEAK, NOT THE DREAM',0,192,24,SKC.wht,'center',800);c.restore()}c.restore()},.3);
  oShow(t-oT(id,3,'rewrite'),(p)=>{c.save();c.translate(1400,790);c.scale(p,p);oChip('REWRITE IT.  TEST AGAIN.',0,0,30,SKC.amb);c.restore()})};
// ---------- g11 honest ----------
SC.a_g11=(t)=>{const id='g11';wBg(t,SKC.vio,.2,'#0b0a1c');wHud(id,t);
  oShow(t-oT(id,0,'honest'),(p)=>{c.save();c.translate(960,190);c.scale(p,p);oTxt('THE HONEST PART.',0,0,80,SKC.wht,'center',800,24,SKC.vio);c.restore()},.3);
  // luck field: random sparks fall; nets widen with more asks
  oShow(t-oT(id,1,'hands'),(p)=>{c.save();c.translate(520,520);c.scale(p,p);wCard(-400,-250,800,520,SKC.vio);oTxt('LUCK ARRIVES AT RANDOM',0,-210,30,SKC.vio,'center',800);
    const nets=1+Math.floor(5*cl((t-oT(id,1,'raises'))/4));let caught=0;for(let i=0;i<24;i++){const x=-340+rnd(i)*680,u=mod(t*.35+rnd(i*3),1),y=-170+u*320,slot=Math.floor((x+340)/680*6);const on=slot<nets;if(on&&u>.92)caught++;c.fillStyle=on?SKC.amb:'rgba(255,200,87,.35)';c.beginPath();c.arc(x,y,on?7:5,0,PI*2);c.fill()}
    for(let s=0;s<6;s++){const x=-340+s*113.3;rr(x+8,152,97,10,5,s<nets?SKC.grn:'rgba(255,255,255,.12)')}oTxt('YOUR ASKS = NETS: '+nets,0,205,28,SKC.grn,'center',800);c.restore()},.3);
  oShow(t-oT(id,1,'raises'),(p)=>{c.save();c.translate(520,820);c.scale(p,p);oChip('RAISES THE NUMBER OF TIMES LUCK CAN FIND YOU',0,0,24,SKC.amb);c.restore()});
  oShow(t-oT(id,2,'stop'),(p)=>{c.save();c.translate(1400,500);c.scale(p,p);wCard(-400,-250,800,520,SKC.red);oTxt('YOUR STOP RULE',0,-205,34,SKC.red,'center',800);[['A DATE','1 MAY'],['A NUMBER','60 ASKS'],['A COST','NOT MY HEALTH']].forEach(([a,b],i)=>{const u=t-oT(id,2,['date','number','cost'][i]);if(u>0){c.save();c.globalAlpha=cl(u/.3);oTxt(a,-340,-90+i*100,34,SKC.dim,'left',800);oTxt(b,340,-90+i*100,50,SKC.wht,'right',800);c.restore()}});c.restore()},.3);
  oShow(t-oT(id,3,'persist'),(p)=>{c.save();c.translate(1400,820);c.scale(p,p);oChip('PERSIST ON PURPOSE · QUIT ON PURPOSE · NEVER DRIFT',0,0,24,SKC.amb);c.restore()})};
// ---------- g12 first week ----------
SC.a_g12=(t)=>{const id='g12';wBg(t,SKC.amb,.24);wHud(id,t);
  oShow(t-oT(id,0,'first'),(p)=>{c.save();c.translate(960,190);c.scale(p,p);oTxt('YOUR FIRST WEEK.',0,0,84,SKC.wht,'center',800,26,SKC.amb);c.restore()},.3);
  const D=[['1','WRITE THE GOAL',1,'one'],['2','RUN THE 2 TESTS',1,'two'],['3','DO A WOOP',1,'three'],['4','3 IF-THEN PLANS',1,'four'],['5','5 SPECIFIC ASKS',2,'five'],['6','3 WEAK-TIE MESSAGES',2,'six'],['7','REVIEW + ADJUST',2,'seven']];
  D.forEach(([n,tx,li,nd],i)=>{oShow(t-oT(id,li,nd),(p)=>{c.save();c.translate(190+i*257,520);c.scale(p,p);wCard(-118,-190,236,380,i<4?SKC.teal:i<6?SKC.grn:SKC.amb);oTxt('DAY',0,-140,22,SKC.dim,'center',800);oTxt(n,0,-70,120,i<4?SKC.teal:i<6?SKC.grn:SKC.amb,'center',800,20);oFit(tx,0,60,210,30,SKC.wht,'center',800);c.restore()})});
  oShow(t-oT(id,3,'that'),(p)=>{c.save();c.translate(960,830);c.scale(p,p);oChip('MOST PEOPLE NEVER DO EVEN DAY ONE',0,0,34,SKC.amb);c.restore()})};
// ---------- g13 close ----------
SC.a_g13=(t)=>{const id='g13';wBg(t,SKC.amb,.3,'#1a1208');wHud(id,t);const gy=800;skFloor(gy,0,1920);
  WSTEPS.forEach((n,i)=>{oShow(t-(oT(id,0,'name')+i*.4),(p)=>{c.save();c.translate(560+i*200,300);c.scale(p,p);rr(-90,-28,180,56,28,'rgba(255,200,87,.16)',SKC.amb,2.5);oTxt(n,0,1,22,SKC.amb,'center',800);c.restore()})});
  // Ari reaches flag on a hill
  c.fillStyle='#0b0d18';c.beginPath();c.moveTo(900,gy);c.quadraticCurveTo(1300,gy-260,1700,gy);c.fill();const fl=eo((t-oT(id,1,'will')+.2)/2);c.strokeStyle='#fff';c.lineWidth=6;c.beginPath();c.moveTo(1300,gy-210);c.lineTo(1300,gy-380);c.stroke();c.fillStyle=SKC.amb;c.beginPath();c.moveTo(1300,gy-380);c.lineTo(1300+110*fl,gy-355);c.lineTo(1300,gy-330);c.fill();
  skFig(1130+fl*60,gy-150-92*1.1,1.1,skMix(skWalk(t,1,.4),STKP.cheer,cl((t-oT(id,2,'save'))/.6)),{face:'smile',t,glow:12,gc:SKC.amb});oGlow(1300,gy-350,260,SKC.amb,.4);
  oShow(t-oT(id,1,'get'),(p)=>{c.save();c.translate(560,470);c.scale(p,p);oTxt('FAR MORE',0,-50,110,SKC.wht,'center',800,26,SKC.amb);oTxt('THAN THE VAGUE.',0,60,100,SKC.amb,'center',800,26);c.restore()},.4);
  oShow(t-oT(id,2,'now'),(p)=>{c.save();c.translate(560,700);c.scale(p,p);wCard(-400,-70,800,150,SKC.amb);oTxt('DAY ONE: YOUR GOAL, ONE SENTENCE,',0,-26,34,SKC.wht,'center',800);oTxt('WITH A DEADLINE — IN THE COMMENTS.',0,26,34,SKC.amb,'center',800);c.restore()});
  oShow(t-oT(id,2,'save'),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oChip('SAVE THIS FOR DAY TWO',0,0,32,SKC.teal);c.restore()})};
// ---------- gend ----------
SC.a_gend=(t)=>{wBg(t,SKC.amb,.34,'#1a1208');const gy=820;
  c.fillStyle='#0b0d18';c.beginPath();c.moveTo(0,gy);c.quadraticCurveTo(480,gy-200,960,gy-60);c.quadraticCurveTo(1440,gy+30,1920,gy-100);c.lineTo(1920,1080);c.lineTo(0,1080);c.fill();
  const rise=eo(t/5);c.save();c.fillStyle='#ffd27a';c.shadowColor='#ffd27a';c.shadowBlur=80;c.beginPath();c.arc(1300,gy-120+(1-rise)*260,120,0,PI*2);c.fill();c.restore();
  skFig(1640,gy-90-92*1.2,1.2,skMix(STKP.stand,STKP.cheer,.4+.4*Math.sin(t*2)),{face:'smile',t,glow:12,gc:SKC.amb});
  oShow(t-.8,(p)=>{c.save();c.translate(860,230);c.scale(p,p);oTxt('WANT IT.',0,-60,150,SKC.wht,'center',800,30,SKC.amb);c.restore()},.4);
  oShow(t-2.4,(p)=>{c.save();c.translate(860,380);c.scale(p,p);oTxt('NAME IT.',0,0,150,SKC.amb,'center',800,30);c.restore()},.4);
  oShow(t-4,(p)=>{c.save();c.translate(860,530);c.scale(p,p);oTxt('ASK FOR IT.',0,0,150,SKC.wht,'center',800,30,SKC.teal);c.restore()},.4);
  oShow(t-5.6,()=>{oTxt('HOW TO GET WHATEVER YOU WANT',860,930,34,SKC.dim,'center',800);oTxt('Your goal, one sentence, a deadline — in the comments.',860,982,28,SKC.amb,'center',800)})};
