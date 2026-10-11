function skBg(t,col=SKC.red,ga=.2,a='#0a0c18',b='#02030a'){oBg(t,a,b,col,ga)}
function skMoon(x,y,r,col='#ffe9b0'){c.save();c.shadowColor=col;c.shadowBlur=40;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,PI*2);c.fill();c.fillStyle='#0a0c18';c.shadowBlur=0;c.beginPath();c.arc(x+r*.45,y-r*.2,r*.88,0,PI*2);c.fill();c.restore()}
function skPeople(x,y,s,col){c.save();c.strokeStyle=col;c.lineWidth=7*s;c.lineCap='round';[-1,1].forEach(d=>{c.beginPath();c.arc(x+d*34*s,y-30*s,16*s,0,PI*2);c.stroke();c.beginPath();c.moveTo(x+d*34*s,y-12*s);c.lineTo(x+d*34*s,y+34*s);c.stroke()});c.restore()}
// ---------- y00 hook ----------
SC.a_y00=(t)=>{const id='y00';skBg(t,SKC.red,.2);skHud(id,t);
  const T3=oT(id,3,'story'),T2=oT(id,2,'both'),fade=cl((t-T2)/.8)*.93;const A=1-fade;
  c.save();c.globalAlpha*=A;
  c.fillStyle='rgba(255,255,255,.14)';c.fillRect(958,200,4,640);
  const gy=800,s=1.35;
  oShow(t-oT(id,0,'discipline'),(p)=>{c.save();c.translate(480,0);c.scale(1,1);c.restore();skFloor(gy,60,920,hexa(SKC.teal,.45));
    c.save();c.translate(480,420);const sw=Math.sin(t*PI*2*.9)*.55;c.strokeStyle=SKC.teal;c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(0,160);c.lineTo(Math.sin(sw)*150,160-Math.cos(sw)*150);c.stroke();c.fillStyle=SKC.teal;c.beginPath();c.arc(Math.sin(sw)*150,160-Math.cos(sw)*150,16,0,PI*2);c.fill();c.fillStyle='#16203a';c.beginPath();c.moveTo(-60,170);c.lineTo(60,170);c.lineTo(24,20);c.lineTo(-24,20);c.closePath();c.fill();c.strokeStyle=hexa(SKC.teal,.6);c.lineWidth=3;c.stroke();c.restore();
    const P=skWalk(t,.9,.45);skFig(480,gy-92*s+Math.abs(Math.sin(t*PI*.9*2))*4,s,P,{col:SKC.wht,face:'n',t,glow:12,gc:SKC.teal,gy});
    oTxt('DISCIPLINE',480,225,66,SKC.teal,'center',800,24);oTxt('a decision, on schedule',480,282,28,SKC.dim,'center',700)});
  oShow(t-oT(id,1,'obsession'),(p)=>{skFloor(gy,1000,1860,hexa(SKC.red,.45));
    for(let i=0;i<14;i++){const x=mod(1500-t*(1500+rnd(i)*900)-i*173,1000)+1000;c.strokeStyle=hexa(SKC.red,.28);c.lineWidth=3;c.beginPath();c.moveTo(x,300+rnd(i*3)*480);c.lineTo(x+120+rnd(i)*160,300+rnd(i*3)*480);c.stroke()}
    for(let k=3;k>=1;k--){const P=skRun(t-k*.05);skFig(1440-k*46,gy-98*s+Math.abs(Math.sin(t*PI*2.7*2))*8,s,P,{col:SKC.red,a:.16,t})}
    const P=skRun(t);skFig(1440,gy-98*s+Math.abs(Math.sin(t*PI*2.7*2))*8,s,P,{col:SKC.wht,face:'mania',t,glow:18,gc:SKC.red,gy});
    oTxt('OBSESSION',1440,225,66,SKC.red,'center',800,24);oTxt('a hook you cannot put down',1440,282,28,SKC.dim,'center',700)});
  c.restore();
  const cards=[['sleep','SLEEP',0],['health','HEALTH',1],['friends','FRIENDS',2],['sense','WHO YOU ARE',3]];
  cards.forEach(([nd,lab,i])=>{oShow(t-oT(id,2,nd),(p)=>{const a=1-cl((t-T3)/.6);c.save();c.globalAlpha*=a;c.translate(330+i*420,520);c.scale(p,p);oPanel(-170,-170,340,330,.8,hexa(SKC.red,.7),28);
    if(i===0)skMoon(0,-40,56);if(i===1)skHeart(0,-30,2.1,SKC.red,t);if(i===2)skPeople(0,-30,2.2,SKC.wht);if(i===3){skFig(0,66,1,STKP.stand,{col:SKC.wht,face:'n',t,a:.9});oTxt('?',0,-130,90,SKC.amb,'center',800,20)}
    oTxt(lab,0,120,44,SKC.wht,'center',800);c.restore()})});
  oShow(t-T3,(p)=>{c.save();c.translate(960,300);c.scale(p,p);oTxt('THE COST OF',0,-60,110,SKC.wht,'center',800,30,SKC.red);oTxt('OBSESSION',0,70,210,SKC.red,'center',800,50);c.restore();
    skFig(960,740-92*1.15,1.15,skMix(STKP.stand,STKP.cheer,.5+.5*Math.sin(t*3)),{face:'smile',t,glow:10,gc:SKC.amb,gy:740});oTxt('SAM',960,780,34,SKC.amb,'center',800);
    oShow(t-oT(id,3,'count'),()=>{oChip('PRICES TO PAY: 4  ·  COUNT THEM',960,845,30,SKC.amb)})},.4)};
// ---------- y01 discipline ----------
SC.a_y01=(t)=>{const id='y01';skBg(t,SKC.teal,.2,'#07121a');skHud(id,t);const gy=800;
  // bedroom -> day
  const ring=t<oT(id,0,'anyway')-.4;skAlarm(260,330,1.25,t,ring,'6:00');
  const awake=cl((t-oT(id,0,'feel')+.4)/.8);
  c.save();rr(40,690,560,90,16,'#1b2140','rgba(255,255,255,.18)',2);rr(40,650,140,50,14,'#2a3158');c.restore();
  const P0=skMix({tl:1.5,hd:0,la:[.2,.2],ra:[.1,.2],ll:[1.45,0],rl:[1.5,0]},STKP.stand,eo(awake));skFig(700+awake*60,(1-awake)*640+awake*(gy-92*1.3)+ (1-awake)*(-30),1.3,P0,{face:awake<.5?'tired':'focus',t,glow:10,gc:SKC.teal,gy:awake>.7?gy:undefined});
  skFloor(gy,0,1000);
  oShow(t-oT(id,1,'discipline'),(p)=>{c.save();c.translate(1000,340);c.scale(p,p);oTxt('DISCIPLINE',0,0,92,SKC.teal,'center',800,26);oTxt('= a decision, made again, against the part of you that quits',0,56,28,SKC.dim,'center',700);c.restore()});
  // checklist
  const items=[['GYM','gym'],['WORK BLOCK','work'],['READ','read']];
  items.forEach(([lab],i)=>{const u=t-oT(id,1,'again')-i*.7;oShow(u,(p)=>{c.save();c.translate(1130,470+i*70);c.scale(p,p);oPanel(-130,-30,520,60,.7,hexa(SKC.teal,.4),16);oTxt(lab,-90,0,28,SKC.wht,'left',800);rr(300,-18,36,36,8,null,SKC.teal,3);if(u>.35){c.strokeStyle=SKC.teal;c.lineWidth=6;c.lineCap='round';c.beginPath();c.moveTo(306,0);c.lineTo(316,10);c.lineTo(332,-12);c.stroke()}c.restore()})});
  // fact chips
  oShow(t-oT(id,2,'forty'),(p)=>{c.save();c.translate(1250,690);c.scale(p,p);oChip('≈ 40% OF DAILY ACTIONS = HABIT · W. WOOD',0,0,26,SKC.vio);c.restore()});
  oShow(t-oT(id,2,'sixty'),(p)=>{c.save();c.translate(1250,750);c.scale(p,p);oChip('66 DAYS (MEDIAN) TO FORM A HABIT · RANGE: HUGE',0,0,26,SKC.blu);c.restore()});
  // willpower tank
  const dr=cl((t-oT(id,3,'effort')+2.5)/4);oShow(t-oT(id,3,'effort')+3,()=>{c.save();c.translate(1760,430);oTxt('WILLPOWER',0,-170,24,SKC.dim,'center',800);rr(-44,-140,88,300,22,'rgba(255,255,255,.08)',SKC.teal,3);const h=290*(1-.92*dr);rr(-38,20+(150-h)+0,76,Math.max(8,h-12),16,dr>.7?SKC.red:SKC.teal);c.restore()})};
// ---------- y02 consistency ----------
SC.a_y02=(t)=>{const id='y02';skBg(t,SKC.teal,.18,'#07121a');skHud(id,t);const gy=800;
  // calendar streak
  const T0=oT(id,0,'show'),n=Math.min(60,Math.floor(Math.max(0,t-T0+.4)*7));
  oPanel(90,200,820,330,.55,hexa(SKC.teal,.35),24);oTxt('DAY',500,226,22,SKC.dim,'center',800);
  for(let i=0;i<60;i++){const x=130+(i%15)*52,y=250+Math.floor(i/15)*58;rr(x,y,40,46,8,'rgba(255,255,255,.07)');if(i<n){c.strokeStyle=SKC.teal;c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(x+8,y+10);c.lineTo(x+32,y+36);c.moveTo(x+32,y+10);c.lineTo(x+8,y+36);c.stroke()}}
  oTxt(Math.min(60,n)+'-DAY STREAK',500,500,30,SKC.teal,'center',800,18);
  // chart: straight line
  const gx=1010,gw=820,gh=380,gyy=640;c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=3;c.beginPath();c.moveTo(gx,gyy-gh);c.lineTo(gx,gyy);c.lineTo(gx+gw,gyy);c.stroke();
  const u=cl((t-oT(id,1,'beautiful'))/3.5);c.strokeStyle=SKC.teal;c.lineWidth=7;c.shadowColor=SKC.teal;c.shadowBlur=16;c.beginPath();c.moveTo(gx,gyy);c.lineTo(gx+gw*u,gyy-gh*.55*u);c.stroke();c.shadowBlur=0;
  oShow(t-oT(id,1,'slow'),(p)=>{c.save();c.translate(gx+gw*.55,gyy-gh*.55*.55-70);c.scale(p,p);oChip('A LITTLE BETTER EACH DAY',0,0,26,SKC.teal);c.restore()});
  oTxt('SKILL',gx+8,gyy-gh-16,22,SKC.dim,'left',800);oTxt('TIME →',gx+gw,gyy+28,22,SKC.dim,'right',800);
  // Sam: pleased -> bored
  const bored=cl((t-oT(id,2,'bored')+.3)/.6);skFig(560,gy-92*1.0,1.0,bored>0?skMix(skWalk(t,.8,.3),STKP.slump,eo(bored)):skWalk(t,.8,.3),{face:bored>.5?'tired':'smile',t,glow:10,gc:SKC.teal,gy});
  skFloor(gy,0,1000);
  oShow(t-oT(id,2,'proud'),()=>{oChip('PROUD',780,640,28,SKC.teal)});oShow(t-oT(id,2,'bored'),()=>{oChip('...BORED',780,640,28,SKC.vio)})};
