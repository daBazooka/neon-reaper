// ---------- extraordinary clean thumbnails F (scale) and G (equation) ----------
SC.a_cthF=(t)=>{c.fillStyle='#07060c';c.fillRect(0,0,1920,1080);oGlow(560,520,520,SKC.amb,.22);oGlow(1380,780,520,SKC.red,.2);
  const px=960,py=360,a=.2,L=560,lx=px-L*Math.cos(a),ly=py-L*Math.sin(a),rx=px+L*Math.cos(a),ry=py+L*Math.sin(a);
  c.save();c.strokeStyle='#fff';c.lineWidth=7;c.lineCap='round';c.shadowColor='#fff';c.shadowBlur=14;
  c.beginPath();c.moveTo(px,py);c.lineTo(px,900);c.stroke();c.beginPath();c.moveTo(px-150,900);c.lineTo(px+150,900);c.stroke();
  c.beginPath();c.moveTo(lx,ly);c.lineTo(rx,ry);c.stroke();c.fillStyle='#07060c';c.beginPath();c.arc(px,py,20,0,PI*2);c.fill();c.stroke();
  const pan=(x,y,col)=>{c.lineWidth=4;c.beginPath();c.moveTo(x,y);c.lineTo(x-170,y+240);c.moveTo(x,y);c.lineTo(x+170,y+240);c.stroke();c.lineWidth=7;c.strokeStyle=col;c.beginPath();c.moveTo(x-190,y+240);c.quadraticCurveTo(x,y+330,x+190,y+240);c.stroke();c.strokeStyle='#fff'};
  pan(lx,ly,SKC.amb);pan(rx,ry,SKC.red);c.restore();
  // trophy (tiny, gold) on the high pan
  c.save();c.translate(lx,ly+232);c.scale(1.7,1.7);c.shadowColor=SKC.amb;c.shadowBlur=36;c.fillStyle=SKC.amb;c.beginPath();c.moveTo(-34,-70);c.lineTo(34,-70);c.quadraticCurveTo(34,-6,0,0);c.quadraticCurveTo(-34,-6,-34,-70);c.fill();c.fillRect(-6,0,12,26);c.fillRect(-26,26,52,10);c.strokeStyle=SKC.amb;c.lineWidth=6;c.beginPath();c.arc(-36,-48,16,PI*.5,PI*1.5);c.arc(36,-48,16,PI*1.5,PI*.5);c.stroke();c.restore();
  // the four prices, heavy, on the low pan
  ['SLEEP','BODY','PEOPLE','SELF'].forEach((n,i)=>{const y=ry+246-(i+1)*70;rr(rx-150,y,300,62,12,'#2a0f14',SKC.red,4);oTxt(n,rx,y+32,40,'#fff','center',800,0)});
  oTxt('WORTH IT?',960,120,150,'#fff','center',800,24,SKC.amb)};
SC.a_cthG=(t)=>{c.fillStyle='#07060c';c.fillRect(0,0,1920,1080);oGlow(1400,540,720,SKC.amb,.16);
  oTxt('OBSESSION',130,190,200,SKC.amb,'left',800,40);
  [['SLEEP',380],['BODY',510],['PEOPLE',640],['SELF',770]].forEach(([n,y])=>{oTxt('−',130,y,110,SKC.red,'left',800,0);oTxt(n,260,y,110,'rgba(244,246,255,.92)','left',800,0)});
  
  oTxt('=',1120,540,260,'rgba(255,255,255,.5)','center',800,0);oTxt('?',1560,540,700,'#fff','center',800,70,SKC.amb)};
Object.assign(PROJ,{'cost-th3':[sg7('a_cthF',10,[],{noOsd:true,xf:0}),sg7('a_cthG',10,[],{noOsd:true})]});
PMETA['cost-th3']={hires:true,wide:true,smooth:true,clean:true,cine:true,tag:'',date:''};
