// ---------- vertical Short (want-s1), content within x 690..1230 ----------
function jBg(t,k,col){skBg(t,col,.24,'#0a0e18');for(let i=0;i<7;i++){c.fillStyle=i<=k?SKC.amb:'rgba(255,255,255,.2)';c.beginPath();c.arc(960-3*30+i*30,70,i===k?9+3*opul(t,5):6,0,PI*2);c.fill()}}
function jT(t,a,b,y,c1,c2,s1=60,s2=96){oShow(t-.05,(p)=>{c.save();c.translate(960,y);c.scale(p,p);oFit(a,0,-52,520,s1,c1,'center',800,22,c2);oFit(b,0,50,520,s2,c2,'center',800,24);c.restore()},.3)}
SC.a_j0=(t)=>{jBg(t,0,SKC.amb);jT(t,'THE','5-STEP SYSTEM',230,'#fff',SKC.amb,70,76);
  WSTEPS.forEach((n,i)=>{oShow(t-(oT('j0',0,'five')+i*.4),(p)=>{c.save();c.translate(960,380+i*76);c.scale(p,p);rr(-190,-30,380,60,30,'rgba(255,200,87,.14)',SKC.amb,2.5);oTxt(n,0,1,28,SKC.amb,'center',800);c.restore()})});
  skFig(960,800-92*.8,.8,skWalk(t,1,.4),{face:'smile',t,glow:10,gc:SKC.teal});skFloor(800,690,1230)};
SC.a_j1=(t)=>{jBg(t,1,SKC.amb);jT(t,'1','NAME IT',230,SKC.amb,'#fff',90,96);
  oShow(t-.4,(p)=>{c.save();c.translate(960,430);c.rotate(-.03);c.scale(p,p);rr(-230,-60,460,120,12,'#2b2f45','rgba(255,255,255,.2)',2);c.globalAlpha=.55;oTxt('"A BETTER JOB"',0,0,40,SKC.dim,'center',800);c.globalAlpha=1;const k=cl((t-oT('j1',0,'specific')+.6)/.5);c.strokeStyle=SKC.red;c.lineWidth=8;c.beginPath();c.moveTo(-210,-4);c.lineTo(-210+420*k,6);c.stroke();c.restore()});
  oShow(t-oT('j1',0,'specific'),(p)=>{c.save();c.translate(960,610);c.scale(p,p);oPanel(-260,-110,520,230,.85,hexa(SKC.amb,.6),24);oTxt('A WRITTEN OFFER',0,-62,34,SKC.wht,'center',800);oTxt('10–50 PERSON STUDIO',0,-14,30,SKC.wht,'center',700);oTxt('BY 1 MARCH',0,46,44,SKC.amb,'center',800);c.restore()},.3);
  oShow(t-oT('j1',0,'deadline'),()=>{oChip('SPECIFIC · HARD · DEADLINE',960,760,26,SKC.grn)})};
SC.a_j2=(t)=>{jBg(t,2,SKC.teal);jT(t,'2','PLAN IT',230,SKC.teal,'#fff',90,96);
  oShow(t-oT('j2',0,'this'),(p)=>{c.save();c.translate(960,470);c.scale(p,p);rr(-250,-80,500,160,22,'rgba(79,216,255,.12)',SKC.teal,3);oTxt('IF',-210,-40,22,SKC.teal,'left',800);oFit('TUE · 7 PM',0,5,400,56,SKC.wht,'center',800);c.restore()});
  oShow(t-oT('j2',0,'then'),(p)=>{c.save();c.translate(960,610);c.scale(p,p);c.strokeStyle=SKC.amb;c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(0,-50);c.lineTo(0,-10);c.moveTo(-18,-28);c.lineTo(0,-6);c.lineTo(18,-28);c.stroke();c.translate(0,90);rr(-250,-60,500,120,22,'rgba(255,200,87,.12)',SKC.amb,3);oTxt('THEN',-210,-34,22,SKC.amb,'left',800);oFit('SEND 2 EMAILS',0,8,420,48,SKC.wht,'center',800);c.restore()});
  oShow(t-oT('j2',0,'willpower'),()=>{oChip('TRIGGERS BEAT WILLPOWER',960,765,28,SKC.amb)})};
SC.a_j3=(t)=>{jBg(t,3,SKC.grn);jT(t,'3','ASK',230,SKC.grn,'#fff',90,120);
  const Tp=oT('j3',0,'underestimate');c.save();c.translate(960,520);
  oShow(t-.5,(p)=>{c.save();c.scale(p,p);oTxt('YOU PREDICT',-130,-170,24,SKC.amb,'center',800);const k=Math.floor(5*cl((t-.6)/1));for(let i=0;i<20;i++){const cx=-205+(i%4)*52,cy=-130+Math.floor(i/4)*70;c.save();c.globalAlpha=i<k?1:.3;skFig(cx,cy+14,.26,STKP.stand,{col:i<k?SKC.amb:SKC.dim,t:0,lw:5});c.restore()}c.restore()});
  oShow(t-Tp,(p)=>{c.save();c.scale(p,p);oTxt('REALITY',130,-170,24,SKC.grn,'center',800);const k=Math.floor(10*cl((t-Tp)/1.2));for(let i=0;i<20;i++){const cx=55+(i%4)*52,cy=-130+Math.floor(i/4)*70;c.save();c.globalAlpha=i<k?1:.3;skFig(cx,cy+14,.26,STKP.stand,{col:i<k?SKC.grn:SKC.dim,t:0,lw:5});c.restore()}c.restore()});c.restore();
  oShow(t-oT('j3',0,'half'),()=>{oChip('UNDERESTIMATED BY ABOUT HALF',960,765,26,SKC.grn)})};
SC.a_j4=(t)=>{jBg(t,4,SKC.blu);jT(t,'4','REACH',230,SKC.blu,'#fff',90,110);
  const cx=960,cy=560;[[75,SKC.dim,3],[145,SKC.amb,6],[205,SKC.dim,3]].forEach(([r,col,w],i)=>{c.save();c.strokeStyle=hexa(i===1?SKC.amb:'#c8d2f0',i===1?.9:.3);c.lineWidth=w;c.setLineDash(i===1?[]:[8,8]);c.beginPath();c.arc(cx,cy,r,0,PI*2);c.stroke();c.restore()});
  for(let i=0;i<14;i++){const a=i/14*PI*2+.3,r=i<3?75:i<9?145:205,hi=(i>=3&&i<9)&&t>oT('j4',0,'moderately');c.fillStyle=hi?SKC.amb:'rgba(200,210,240,.7)';c.beginPath();c.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,hi?10:6,0,PI*2);c.fill()}
  skFig(cx,cy+22,.36,STKP.stand,{face:'smile',t,glow:8,gc:SKC.teal});
  oShow(t-oT('j4',0,'moderately'),()=>{oChip('MODERATELY WEAK TIES',960,770,28,SKC.amb)})};
SC.a_j5=(t)=>{jBg(t,5,SKC.teal);jT(t,'5','ADJUST',230,SKC.teal,'#fff',90,96);
  const r=t*1.1;c.save();c.translate(960,520);c.strokeStyle=SKC.teal;c.lineWidth=12;c.lineCap='round';c.beginPath();c.arc(0,0,140,r,r+4.2);c.stroke();const a=r+4.2;c.fillStyle=SKC.teal;c.beginPath();c.moveTo(Math.cos(a)*140,Math.sin(a)*140);c.lineTo(Math.cos(a-.35)*172,Math.sin(a-.35)*172);c.lineTo(Math.cos(a+.35)*172,Math.sin(a+.35)*172);c.fill();c.fillStyle='#16110a';c.beginPath();c.arc(0,0,86,0,PI*2);c.fill();c.strokeStyle=SKC.amb;c.lineWidth=5;c.stroke();oTxt('GOAL',0,-16,30,SKC.amb,'center',800);oTxt('FIXED',0,22,30,SKC.amb,'center',800);c.restore();
  oShow(t-oT('j5',0,'change'),()=>{oChip('CHANGE THE METHOD',960,765,30,SKC.teal)})};
SC.a_j6=(t)=>{jBg(t,6,SKC.amb);const gy=800;skFloor(gy,690,1230);skFig(960,gy-92*1.1,1.1,skMix(STKP.stand,STKP.cheer,.5+.4*Math.sin(t*3)),{face:'smile',t,glow:12,gc:SKC.amb});
  oShow(t-.3,(p)=>{c.save();c.translate(960,250);c.scale(p,p);oFit('YOUR GOAL',0,-40,520,80,'#fff','center',800,24,SKC.amb);oFit('+ A DEADLINE',0,52,520,76,SKC.amb,'center',800,24);c.restore()},.3);
  oShow(t-oT('j6',0,'comments'),()=>{oChip('WRITE IT IN THE COMMENTS',960,430,26,SKC.teal)});
  oShow(t-oT('j6',0,'channel'),()=>{oChip('FULL FILM ON THE CHANNEL',960,490,26,SKC.amb)})};
