// ---------- thumbnails ----------
SC.a_thA=(t)=>{tmBg(t,'#0a0c20','#010208',TMC.gold,.35);tmBurst(960,540,t,TMC.gold,90,260);for(let k=0;k<8;k++)oRing(960,540,170+k*90,3+k,TMC.gold,.45-k*.04);oGlow(960,540,560,TMC.gold,.45);
  for(let r=0;r<44;r++){const yy=1020-r*13,w=60+r*18;c.fillStyle=hexa(TMC.gold,.1+.5*(r/44));c.fillRect(960-w/2,yy,w,6)}
  c.save();c.shadowColor=TMC.gold;c.shadowBlur=70;oSer('ALL OF',960,330,190,'#fff','center',700,0);oSer('TIME',960,560,300,'#ffe9b0','center',700,0);c.restore();
  oChip('FROM 10⁻⁴⁴ SECONDS TO THE END',960,820,56,TMC.cyan);tmEgg(1680,200,t,1.3,1)};
SC.a_thB=(t)=>{tmBg(t,'#0a0816','#010104',TMC.vio,.35);oTxt('150',560,470,520,TMC.gold,'center',800,60);oTxt('RUNGS',1380,360,210,'#fff','center',800,34);oTxt('OF TIME',1380,560,170,TMC.cyan,'center',800,30);
  const x0=140,x1=1780,y=860;c.fillStyle=lg(x0,0,x1,0,[[0,TMC.cyan],[.5,TMC.vio],[1,TMC.red]]);c.fillRect(x0,y,x1-x0,16);c.fillStyle='#fff';c.beginPath();c.arc(x0+(54.4/153)*(x1-x0),y+8,22,0,PI*2);c.fill();oTxt('YOU',x0+(54.4/153)*(x1-x0),y-50,44,TMC.cyan,'center',800);oTxt('10⁻⁴⁴ s',x0,y+70,40,TMC.cyan,'left',800);oTxt('10¹⁰⁰ YEARS',x1,y+70,40,TMC.red,'right',800)};
SC.a_thC=(t)=>{tmBg(t,'#07101a','#010208',TMC.cyan,.35);oTxt('YOU ARE',960,250,230,'#fff','center',800,40);oTxt('EARLY.',960,500,330,TMC.gold,'center',800,60);
  const x0=160,x1=1760,y=800;c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=8;c.beginPath();c.moveTo(x0,y);c.lineTo(x1,y);c.stroke();c.fillStyle=TMC.cyan;c.shadowColor=TMC.cyan;c.shadowBlur=30;c.beginPath();c.arc(x0+4,y,14,0,PI*2);c.fill();c.shadowBlur=0;oChip('NOW',x0+60,y-70,44,TMC.cyan,'left');oChip('THE END OF THE UNIVERSE →',x1,y-70,44,TMC.red,'right');oTxt('13.8 BILLION YEARS  vs  10¹⁰⁰',960,y+80,50,TMC.ice,'center',800)};
SC.a_thD=(t)=>{tmBg(t,'#0b0a1c','#010104',TMC.vio,.4);
  c.save();c.globalAlpha=.16;oTxt('10¹⁰⁰',960,520,900,TMC.red,'center',800,0);c.restore();
  const x0=190,x1=1830,y=800;c.fillStyle=lg(x0,0,x1,0,[[0,TMC.cyan],[.45,TMC.vio],[1,TMC.red]]);c.fillRect(x0,y,x1-x0,10);
  for(let i=0;i<=40;i++){c.fillStyle='rgba(255,255,255,.25)';c.fillRect(x0+i*(x1-x0)/40,y-12,2,14)}
  const dx=x0;c.save();c.shadowColor=TMC.gold;c.shadowBlur=60;c.fillStyle='#fff';c.beginPath();c.arc(dx,y+5,13,0,PI*2);c.fill();c.restore();
  c.save();c.strokeStyle=TMC.gold;c.lineWidth=7;c.shadowColor=TMC.gold;c.shadowBlur=30;c.beginPath();c.arc(dx,y+5,78,0,PI*2);c.stroke();
  c.beginPath();c.moveTo(dx+360,y-120);c.lineTo(dx+88,y-52);c.moveTo(dx+88,y-52);c.lineTo(dx+150,y-52);c.moveTo(dx+88,y-52);c.lineTo(dx+120,y-110);c.stroke();c.restore();
  oTxt('THIS DOT',dx+640,y-170,130,TMC.gold,'center',800,36);oTxt('= YOU',dx+640,y-60,100,'#fff','center',800,30);
  oTxt('YOUR ENTIRE LIFE',960,190,170,'#fff','center',800,46,TMC.gold);
  oTxt('ON THE TIMELINE',1200,390,110,TMC.ice,'center',800,26);oTxt('OF THE UNIVERSE',1200,520,110,TMC.cyan,'center',800,26);
  oTxt('NOW',x0-40,y+100,44,TMC.cyan,'left',800);oTxt('THE END OF TIME · 10¹⁰⁰ YEARS →',x1,y+90,44,TMC.red,'right',800);tmEgg(1830,660,t,1.1,1)};
SC.a_thE=(t)=>{tmBg(t,'#120a05','#010104',TMC.gold,.45);oGlow(960,560,640,TMC.gold,.35);
  c.save();c.translate(960,520);c.scale(.92,.92);c.shadowColor=TMC.gold;c.shadowBlur=60;c.strokeStyle='#ffe3a0';c.lineWidth=14;c.lineJoin='round';
  c.beginPath();c.moveTo(-250,-400);c.lineTo(250,-400);c.lineTo(250,-340);c.bezierCurveTo(250,-170,28,-80,28,0);c.bezierCurveTo(28,80,250,170,250,340);c.lineTo(250,400);c.lineTo(-250,400);c.lineTo(-250,340);c.bezierCurveTo(-250,170,-28,80,-28,0);c.bezierCurveTo(-28,-80,-250,-170,-250,-340);c.closePath();c.stroke();c.shadowBlur=0;
  for(let i=0;i<260;i++){const u=rnd(i*1.7),v=rnd(i*3.1);const yy=-380+v*300,wd=Math.max(0,230-(yy+380)*.62);const xx=(u-.5)*2*wd*.8;c.fillStyle=i%4?'rgba(255,200,100,.8)':'#fff';c.fillRect(xx,yy,3.5,3.5)}
  c.fillStyle='rgba(255,200,100,.6)';c.beginPath();c.moveTo(-210,380);c.quadraticCurveTo(0,200,210,380);c.fill();c.fillStyle='#ffdc8a';c.fillRect(-2,-20,4,380);
  c.restore();
  oTxt('ALL OF',330,300,120,'#fff','center',800,34);oTxt('TIME',330,470,230,TMC.gold,'center',800,50);
  oTxt('7 HIDDEN',1560,330,110,'#fff','center',800,34);oTxt('HOURGLASSES',1560,450,78,TMC.gold,'center',800,30);oChip('CAN YOU FIND THEM ALL?',1560,590,36,TMC.cyan);
  oChip('10⁻⁴⁴ s  →  10¹⁰⁰ YEARS',960,1000,40,TMC.vio)};
Object.assign(PROJ,{'alltime-th':[sg7('a_thA',10,[],{noOsd:true,xf:0}),sg7('a_thB',10,[],{noOsd:true}),sg7('a_thC',10,[],{noOsd:true}),sg7('a_thD',10,[],{noOsd:true}),sg7('a_thE',10,[],{noOsd:true})]});
PMETA['alltime-th']={hires:true,wide:true,smooth:true,clean:true,cine:true,tag:'',date:''};
