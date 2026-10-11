// ---------- thumbnails ----------
SC.a_thA=(t)=>{tmBg(t,'#0a0c20','#010208',TMC.gold,.35);tmBurst(960,540,t,TMC.gold,90,260);for(let k=0;k<8;k++)oRing(960,540,170+k*90,3+k,TMC.gold,.45-k*.04);oGlow(960,540,560,TMC.gold,.45);
  for(let r=0;r<44;r++){const yy=1020-r*13,w=60+r*18;c.fillStyle=hexa(TMC.gold,.1+.5*(r/44));c.fillRect(960-w/2,yy,w,6)}
  c.save();c.shadowColor=TMC.gold;c.shadowBlur=70;oSer('ALL OF',960,330,190,'#fff','center',700,0);oSer('TIME',960,560,300,'#ffe9b0','center',700,0);c.restore();
  oChip('FROM 10⁻⁴⁴ SECONDS TO THE END',960,820,56,TMC.cyan);tmEgg(1680,200,t,1.3,1)};
SC.a_thB=(t)=>{tmBg(t,'#0a0816','#010104',TMC.vio,.35);oTxt('150',560,470,520,TMC.gold,'center',800,60);oTxt('RUNGS',1380,360,210,'#fff','center',800,34);oTxt('OF TIME',1380,560,170,TMC.cyan,'center',800,30);
  const x0=140,x1=1780,y=860;c.fillStyle=lg(x0,0,x1,0,[[0,TMC.cyan],[.5,TMC.vio],[1,TMC.red]]);c.fillRect(x0,y,x1-x0,16);c.fillStyle='#fff';c.beginPath();c.arc(x0+(54.4/153)*(x1-x0),y+8,22,0,PI*2);c.fill();oTxt('YOU',x0+(54.4/153)*(x1-x0),y-50,44,TMC.cyan,'center',800);oTxt('10⁻⁴⁴ s',x0,y+70,40,TMC.cyan,'left',800);oTxt('10¹⁰⁰ YEARS',x1,y+70,40,TMC.red,'right',800)};
SC.a_thC=(t)=>{tmBg(t,'#07101a','#010208',TMC.cyan,.35);oTxt('YOU ARE',960,250,230,'#fff','center',800,40);oTxt('EARLY.',960,500,330,TMC.gold,'center',800,60);
  const x0=160,x1=1760,y=800;c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=8;c.beginPath();c.moveTo(x0,y);c.lineTo(x1,y);c.stroke();c.fillStyle=TMC.cyan;c.shadowColor=TMC.cyan;c.shadowBlur=30;c.beginPath();c.arc(x0+4,y,14,0,PI*2);c.fill();c.shadowBlur=0;oChip('NOW',x0+60,y-70,44,TMC.cyan,'left');oChip('THE END OF THE UNIVERSE →',x1,y-70,44,TMC.red,'right');oTxt('13.8 BILLION YEARS  vs  10¹⁰⁰',960,y+80,50,TMC.ice,'center',800)};
Object.assign(PROJ,{'alltime-th':[sg7('a_thA',10,[],{noOsd:true,xf:0}),sg7('a_thB',10,[],{noOsd:true}),sg7('a_thC',10,[],{noOsd:true})]});
PMETA['alltime-th']={hires:true,wide:true,smooth:true,clean:true,cine:true,tag:'',date:''};
