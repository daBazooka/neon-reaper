// ---------- thumbnails ----------
SC.a_cthA=(t)=>{skBg(t,SKC.red,.35,'#0e0a14');
  c.save();c.beginPath();c.moveTo(0,0);c.lineTo(1000,0);c.lineTo(840,1080);c.lineTo(0,1080);c.closePath();c.clip();c.fillStyle='rgba(47,224,200,.10)';c.fillRect(0,0,1920,1080);oGlow(380,640,520,SKC.teal,.35);c.restore();
  c.save();c.beginPath();c.moveTo(1000,0);c.lineTo(1920,0);c.lineTo(1920,1080);c.lineTo(840,1080);c.closePath();c.clip();oGlow(1400,640,640,SKC.red,.55);for(let i=0;i<16;i++){const y=300+rnd(i)*620;c.strokeStyle=hexa(SKC.red,.35);c.lineWidth=4;c.beginPath();c.moveTo(1100+rnd(i*3)*600,y);c.lineTo(1500+rnd(i*5)*400,y);c.stroke()}c.restore();
  c.save();c.strokeStyle='#fff';c.lineWidth=8;c.shadowColor='#fff';c.shadowBlur=18;c.beginPath();c.moveTo(1000,0);c.lineTo(840,1080);c.stroke();c.restore();
  skFig(420,880-92*2.6,2.6,skWalk(.3,1,.35),{face:'smile',glow:18,gc:SKC.teal,t:1});
  for(let k=3;k>=1;k--)skFig(1440-k*70,880-98*2.6,2.6,skRun(.12-k*.03),{col:SKC.red,a:.14,t:1});
  skFig(1440,880-98*2.6,2.6,skRun(.12),{face:'mania',glow:24,gc:SKC.red,t:1});
  oTxt('DISCIPLINE',440,130,118,SKC.teal,'center',800,36);oTxt('OBSESSION',1440,130,118,SKC.red,'center',800,40);
  c.save();c.translate(960,540);c.fillStyle='#0a0c18';c.beginPath();c.arc(0,0,66,0,PI*2);c.fill();c.strokeStyle='#fff';c.lineWidth=5;c.stroke();oTxt('VS',0,2,60,'#fff','center',800);c.restore()};
SC.a_cthB=(t)=>{skBg(t,SKC.red,.4,'#12080c');
  const ox=1380,oy=330;oGlow(ox,oy,520,SKC.red,.65);c.save();c.shadowColor=SKC.red;c.shadowBlur=70;c.fillStyle='#ffd0c8';c.beginPath();c.arc(ox,oy,90,0,PI*2);c.fill();c.restore();for(let i=0;i<4;i++)oRing(ox,oy,130+i*55,5,SKC.red,.55-.12*i);
  const P={tl:.28,hd:.1,la:[1.3,.2],ra:[1.1,.2],ll:[.3,-.2],rl:[-.3,0]};const pts=skFig(1300,980-92*2.4,2.4,{...P,tl:-.35,hd:-.05,la:[2.1,.2],ra:[1.9,.2]},{face:'shock',glow:20,gc:SKC.red,t:1});
  c.save();c.strokeStyle=SKC.red;c.lineWidth=9;c.shadowColor=SKC.red;c.shadowBlur=24;[0,1,2].forEach(i=>{c.beginPath();c.moveTo(ox-20,oy+60);c.quadraticCurveTo(ox-200+i*40,oy+360,pts.sh[0]+(i-1)*14,pts.sh[1]+i*26);c.stroke()});c.restore();
  oTxt('OBSESSION',660,230,185,'#fff','center',800,50,SKC.red);oTxt('BEATS',420,410,140,SKC.amb,'center',800,40);oTxt('DISCIPLINE',600,570,160,SKC.teal,'center',800,40);
  oChip('...UNTIL IT BILLS YOU',600,780,60,SKC.red);};
SC.a_cthC=(t)=>{skBg(t,SKC.red,.3,'#0e0a14');
  oTxt('4 PRICES',720,240,290,SKC.amb,'center',800,70);oTxt('OF OBSESSION',720,450,140,'#fff','center',800,36,SKC.red);
  [['SLEEP',.12],['BODY',.16],['PEOPLE',.08],['SELF',.05]].forEach(([n,v],i)=>{const y=620+i*92;oTxt(n,160,y,52,'#fff','left',800,16);rr(420,y-30,800,60,30,'rgba(255,255,255,.1)');rr(420,y-30,Math.max(60,800*v),60,30,SKC.red);if(i>=0){oRing(420+Math.max(60,800*v)-10,y,46,6,SKC.red,.8)}});
  skFig(1580,900-92*2.5,2.5,SKP_SLUMP(),{face:'tired',glow:18,gc:SKC.red,t:1});oTxt('SAM',1580,990,46,SKC.amb,'center',800);
  c.save();c.translate(1400,880);c.rotate(-.04);oChip('YOU PAY ALL 4',0,0,56,SKC.red);c.restore()};
function SKP_SLUMP(){return STKP.slump}
Object.assign(PROJ,{'cost-th':[sg7('a_cthA',10,[],{noOsd:true,xf:0}),sg7('a_cthB',10,[],{noOsd:true}),sg7('a_cthC',10,[],{noOsd:true})]});
PMETA['cost-th']={hires:true,wide:true,smooth:true,clean:true,cine:true,tag:'',date:''};
