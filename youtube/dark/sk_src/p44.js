// ---------- y12 sunk cost ----------
SC.a_y12=(t)=>{const id='y12';skBg(t,SKC.red,.2,'#14090c');skHud(id,t,oT(id,0,'fifth'));const gy=560;
  // the pit
  const depth=Math.min(330,Math.max(0,(t-oT(id,1,'invests'))*34));c.save();c.fillStyle='#2a1a1a';c.fillRect(0,gy,1920,520);c.fillStyle='#070308';c.beginPath();c.rect(250,gy,520,depth+8);c.fill();c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=3;c.stroke();skFloor(gy,0,250);skFloor(gy,770,1100);c.restore();
  const sw=Math.sin(t*6);skFig(510,gy+depth-92*.9+6,.9,{tl:.22+.12*sw,hd:.1,la:[.9+.7*sw,.6],ra:[.8+.7*sw,.6],ll:[.25,-.15],rl:[-.15,-.1]},{face:'focus',t,glow:8,gc:SKC.red});
  c.save();c.fillStyle=SKC.amb;for(let i=0;i<8;i++){const u=mod(t*.55+i/8,1),x=320+rnd(i)*380,y=gy-300+u*(300+depth*.4);c.globalAlpha=1-u*.2;c.beginPath();c.arc(x,y,12,0,PI*2);c.fill();c.fillStyle='#14090c';c.font='800 15px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('$',x,y+1);c.fillStyle=SKC.amb}c.restore();
  oShow(t-oT(id,1,'trap'),(p)=>{c.save();c.translate(510,gy-340);c.scale(p,p);oChip('THE SUNK COST TRAP',0,0,30,SKC.red);c.restore()});
  // warning lamps ignored
  oShow(t-oT(id,3,'brakes'),(p)=>{c.save();c.translate(1500,330);c.scale(p,p);oPanel(-300,-110,600,230,.8,hexa(SKC.red,.7),26);oTxt('WARNING LIGHTS',0,-70,28,SKC.red,'center',800);[0,1,2].forEach(i=>{const on=Math.sin(t*8+i*2)>0;c.fillStyle=on?SKC.red:'#3a1219';c.shadowColor=SKC.red;c.shadowBlur=on?24:0;c.beginPath();c.arc(-120+i*120,-8,30,0,PI*2);c.fill()});c.shadowBlur=0;oTxt('"PUSH HARDER."',0,74,40,SKC.amb,'center',800);c.restore()});
  // concorde
  oShow(t-oT(id,2,'concorde'),(p)=>{c.save();c.translate(1250+Math.sin(t*.6)*20,620);c.scale(p,p);c.fillStyle='#e8ecff';c.strokeStyle=SKC.vio;c.lineWidth=3;c.beginPath();c.moveTo(-210,10);c.lineTo(-30,-12);c.lineTo(190,0);c.lineTo(250,14);c.lineTo(-30,30);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(-40,-8);c.lineTo(-170,-60);c.lineTo(-110,-6);c.fill();c.restore();oTxt('CONCORDE · THE CLASSIC EXAMPLE',1250,700,24,SKC.vio,'center',800);oTxt('FUNDED BECAUSE SO MUCH WAS ALREADY SPENT',1250,736,20,SKC.dim,'center',700)});
  oShow(t-oT(id,3,'warning'),(p)=>{});
  oShow(t-oT(id,3,'reads'),(p)=>{c.save();c.translate(960,830-40);c.scale(p,p);c.restore()})};
// ---------- y13 spectrum ----------
SC.a_y13=(t)=>{const id='y13';skBg(t,SKC.vio,.2,'#0a0b1c');skHud(id,t,oT(id,0,'warning'));
  const segs=[['DISCIPLINE',SKC.teal],['CONSISTENCY',SKC.blu],['PASSION',SKC.vio],['OBSESSION',SKC.amb]];const x0=120,w=300,y=360;
  segs.forEach(([n,col],i)=>{oShow(t-(oT(id,0,'intense')-1.2+i*.5),(p)=>{c.save();c.translate(x0+i*w+w/2,y);c.scale(p,p);rr(-w/2+5,-50,w-10,100,18,hexa(col,.2),col,3);oTxt(n,0,0,28,col,'center',800);c.restore()})});
  oShow(t-oT(id,0,'intense'),(p)=>{c.save();c.translate(x0+2*w,y-120);c.scale(p,p);oTxt('THIS FILM:  AN INTENSE DRIVE',0,0,34,SKC.wht,'center',800,14);c.strokeStyle=SKC.wht;c.lineWidth=3;c.beginPath();c.moveTo(-2*w+10,36);c.lineTo(-2*w+10,52);c.lineTo(2*w-10,52);c.lineTo(2*w-10,36);c.stroke();c.restore()});
  oShow(t-oT(id,0,'clinical'),(p)=>{c.save();c.translate(1620,y);c.scale(p,p);c.setLineDash([10,8]);rr(-190,-50,380,100,18,'rgba(255,61,87,.14)',SKC.red,3);c.setLineDash([]);oTxt('OCD',0,-12,38,SKC.red,'center',800);oTxt('A DIFFERENT THING',0,28,22,SKC.dim,'center',800);c.restore()});
  oShow(t-oT(id,1,'different'),(p)=>{c.save();c.translate(1620,620);c.scale(p,p);oPanel(-300,-160,600,330,.8,hexa(SKC.red,.5),26);['UNWANTED','INTRUSIVE','DISTRESSING','HOURS A DAY'].forEach((n,i)=>{const u=t-oT(id,1,['unwanted','intrusive','distressing','hours'][i]);if(u>0){c.save();c.globalAlpha=cl(u/.3);oTxt('• '+n,-240,-110+i*60,36,SKC.wht,'left',800);c.restore()}});c.restore()});
  oShow(t-oT(id,1,'treatable'),(p)=>{c.save();c.translate(1620,830);c.scale(p,p);oChip('TREATABLE · NIMH',0,0,30,SKC.grn);c.restore()});
  // Sam with doctor bubble
  const gy=800;skFloor(gy,0,1100);skFig(420,gy-92*1.1,1.1,skWalk(t,.6,.2),{face:'n',t,glow:8,gc:SKC.vio,gy});
  oShow(t-oT(id,2,'torturing'),(p)=>{c.save();c.translate(480,490);c.scale(p,p);skBubble(0,0,520,84,'TORTURED, NOT PULLED?',34,SKC.red);c.restore()});
  oShow(t-oT(id,2,'doctor'),(p)=>{c.save();c.translate(760,640);c.scale(p,p);oChip('TALK TO A DOCTOR OR THERAPIST',0,0,28,SKC.grn);c.restore()});
  oShow(t-oT(id,2,'tool'),(p)=>{c.save();c.translate(760,700);c.scale(p,p);oChip('NOT WEAKNESS.  THE RIGHT TOOL.',0,0,26,SKC.vio);c.restore()})};
// ---------- y14 harmonious vs obsessive ----------
SC.a_y14=(t)=>{const id='y14';skBg(t,SKC.vio,.22,'#0a0b1c');skHud(id,t,oT(id,0,'holding'));const gy=800;skFloor(gy,0,1920);
  c.fillStyle='rgba(255,255,255,.12)';c.fillRect(958,210,4,600);
  const orb=(x,y,col)=>{oGlow(x,y,120,col,.6);c.save();c.shadowColor=col;c.shadowBlur=26;c.fillStyle=col;c.beginPath();c.arc(x,y,26,0,PI*2);c.fill();c.restore()};
  oShow(t-oT(id,1,'harmonious'),(p)=>{c.save();c.translate(0,0);const pts=skFig(480,gy-92*1.25,1.25,{tl:0,hd:0,la:[.5,.9],ra:[-.1,.2],ll:[.05,0],rl:[-.05,0]},{face:'smile',t,glow:10,gc:SKC.grn,gy});orb(pts.la[1][0]+10,pts.la[1][1]-20+Math.sin(t*2)*6,SKC.grn);
    oTxt('HARMONIOUS',480,250,50,SKC.grn,'center',800,18);oTxt('YOU HOLD IT',480,306,34,SKC.wht,'center',800);oTxt('YOU CAN PUT IT DOWN',480,350,24,SKC.dim,'center',700);c.restore()});
  oShow(t-oT(id,1,'obsessive'),(p)=>{c.save();const ox=1440,oy=480;orb(ox,oy,SKC.red);const P={tl:.15,hd:.1,la:[1.4,.2],ra:[1.2,.2],ll:[.1,-.1],rl:[-.1,0]};const pts=skFig(1380,gy-92*1.25,1.25,P,{face:'mania',t,glow:10,gc:SKC.red,gy});
    c.strokeStyle=SKC.red;c.lineWidth=4;c.shadowColor=SKC.red;c.shadowBlur=14;[0,1,2].forEach(i=>{c.beginPath();c.moveTo(ox,oy);c.quadraticCurveTo((ox+pts.sh[0])/2+Math.sin(t*3+i)*40,(oy+pts.sh[1])/2+i*28-28,pts.sh[0]+(i-1)*10,pts.sh[1]+i*30);c.stroke()});c.shadowBlur=0;
    oTxt('OBSESSIVE',1440,250,50,SKC.red,'center',800,18);oTxt('IT HOLDS YOU',1440,306,34,SKC.wht,'center',800);oTxt('YOU CANNOT',1440,350,24,SKC.dim,'center',700);c.restore()});
  oShow(t-oT(id,2,'nurses'),(p)=>{c.save();c.translate(960,590);c.scale(p,p);oPanel(-340,-110,680,260,.88,hexa(SKC.vio,.6),26);oTxt('6-MONTH STUDY · NURSES · 2 COUNTRIES',0,-72,22,SKC.vio,'center',800);
    const g=eo((t-oT(id,2,'nurses')-1)/1.4);oTxt('OBSESSIVE → BURNOUT',-170,-14,26,SKC.red,'center',800);c.fillStyle=SKC.red;c.beginPath();c.moveTo(-170,70-60*g);c.lineTo(-210,70);c.lineTo(-130,70);c.fill();
    oTxt('HARMONIOUS → PROTECTED',170,-14,26,SKC.grn,'center',800);c.fillStyle=SKC.grn;c.beginPath();c.moveTo(170,10+60*g);c.lineTo(130,10);c.lineTo(210,10);c.fill();oTxt('VIA CONFLICT WITH THE REST OF LIFE',0,118,20,SKC.dim,'center',700);c.restore()});
  oShow(t-oT(id,3,'cyclists'),(p)=>{c.save();c.fillStyle='rgba(2,3,10,.95)';c.fillRect(0,0,1920,1080);c.translate(960,480);c.scale(p,p);
    for(let i=0;i<90;i++){c.fillStyle='rgba(255,255,255,.7)';c.fillRect(-900+mod(rnd(i)*1800+t*(200+rnd(i*2)*160),1800),-300+mod(rnd(i*3)*700+t*260,700),3,3)}
    const bike=(x,y,col,dir)=>{c.save();c.translate(x,y);c.scale(dir,1);c.strokeStyle=col;c.lineWidth=5;c.beginPath();c.arc(-46,0,32,0,PI*2);c.arc(46,0,32,0,PI*2);c.moveTo(-46,0);c.lineTo(-8,-52);c.lineTo(46,0);c.moveTo(-8,-52);c.lineTo(30,-52);c.stroke();c.fillStyle=col;c.beginPath();c.arc(-4,-100,16,0,PI*2);c.fill();c.beginPath();c.moveTo(-6,-84);c.lineTo(-8,-56);c.stroke();c.restore()};
    const t0=oT(id,3,'cyclists'),tw=oT(id,3,'winter');const turn=t>tw+1.6;bike(-380+(turn?1:0)*0,90,SKC.grn,turn?-1:1);bike(380,90,SKC.red,1);
    oTxt('HARMONIOUS: TURNS BACK',-380,-130,28,SKC.grn,'center',800);oTxt('OBSESSIVE: KEEPS RIDING',380,-130,28,SKC.red,'center',800);oTxt('DANGEROUS WINTER CONDITIONS · RIGID PERSISTENCE',0,230,26,SKC.amb,'center',800);oTxt('THAT IS THE LEASH SNAPPING',0,280,42,SKC.wht,'center',800,18,SKC.red);c.restore()},.4)};
// ---------- y15 verdict ----------
SC.a_y15=(t)=>{const id='y15';skBg(t,SKC.amb,.2,'#14100a');skHud(id,t,oT(id,0,'honest'));const gy=760;
  const car=(x,y,col,cr)=>{c.save();c.translate(x,y);c.rotate(cr||0);c.fillStyle='#1b2038';c.strokeStyle=col;c.lineWidth=5;c.beginPath();c.moveTo(-150,0);c.lineTo(-150,-48);c.lineTo(-90,-52);c.lineTo(-50,-100);c.lineTo(70,-100);c.lineTo(112,-52);c.lineTo(150,-46);c.lineTo(150,0);c.closePath();c.fill();c.stroke();[-85,85].forEach(wx=>{c.fillStyle='#0a0c18';c.strokeStyle=col;c.beginPath();c.arc(wx,2,30,0,PI*2);c.fill();c.stroke()});c.fillStyle='#0b0d18';c.beginPath();c.arc(-10,-92,15,0,PI*2);c.fill();c.strokeStyle=SKC.wht;c.lineWidth=3;c.stroke();c.restore()};
  skFloor(gy,0,1920);const A=oT(id,1,'engine'),B=oT(id,1,'wrecks'),C=oT(id,1,'seatbelt'),D=oT(id,2,'goal');
  oShow(t-A,(p)=>{c.save();c.translate(600,270);c.scale(p,p);oTxt('ENGINE = OBSESSION',0,0,56,SKC.amb,'center',800,22);c.restore()});
  oShow(t-C,(p)=>{c.save();c.translate(1330,270);c.scale(p,p);oTxt('SEATBELT = DISCIPLINE',0,0,56,SKC.teal,'center',800,22);c.restore()});
  // phase 1: crash
  if(t<C+.5){const u=cl((t-A)/(B-A+.6));const x=300+1100*u*u;const crashed=t>B+.6;const shake=crashed?Math.sin(t*50)*6*Math.exp(-(t-B-.6)*3):0;car(crashed?1400:x,gy-32+shake,SKC.red,crashed?-.06:0);if(crashed){oGlow(1500,gy-60,200,SKC.red,.6);oShow(t-B-.6,(p)=>{c.save();c.translate(1420,gy-200);c.scale(p,p);oTxt('WRECKED',0,0,80,SKC.red,'center',800,26);c.restore()})}c.fillStyle='rgba(255,255,255,.2)';c.fillRect(1560,gy-130,16,130)}
  // phase 2: parked
  if(t>=C+.5&&t<D-.2){car(960,gy-32,SKC.teal,0);oTxt('SAFE. GOING NOWHERE.',960,gy+60,38,SKC.wht,'center',800,14);oShow(t-C-.8,()=>{oChip('A VERY SAFE DRIVER',960,gy-210,30,SKC.teal)})}
  // phase 3: both
  if(t>=D-.2){const k=mod(t*180,160);c.fillStyle='rgba(255,255,255,.35)';for(let i=-1;i<14;i++)c.fillRect(i*160-k,gy+20,70,6);car(900,gy-32+Math.sin(t*14)*1.5,SKC.grn,0);oShow(t-D,(p)=>{c.save();c.translate(960,450);c.scale(p,p);oTxt('OBSESSED.',0,-60,120,SKC.amb,'center',800,30);oTxt('AND DISCIPLINED ABOUT IT.',0,70,64,SKC.teal,'center',800,24);c.restore()},.4)}};
