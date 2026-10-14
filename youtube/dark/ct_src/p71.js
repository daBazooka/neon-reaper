// ---------- scenes f00..f03 ----------
function ctCrowd(n,seed){const a=[];for(let i=0;i<n;i++){const r=k=>rnd(seed*100+i*7+k);a.push({x0:r(1)*2300,y:835+r(2)*115,k:r(3)<.5?'w':'m',sd:seed*50+i,sp:(r(4)<.5?1:-1)*(38+r(5)*46),carry:r(6)<.32?'bag':(r(7)<.25?'cup':null),skirt:r(8)<.5,hair:r(9)<.5?'bun':'long',cap:r(10)<.3})}return a.sort((p,q)=>p.y-q.y)}
const CTC1=ctCrowd(26,3);
function ctStreetScene(t,m,cam,lit){ctSky(t,m,1450,640,80);ctSkyline(m,0,cam,690,lit*.6,2,t);ctSkyline(m,1,cam,740,lit*.8,5,t);ctSkyline(m,2,cam,800,lit,9,t);
  c.fillStyle='#161a28';c.fillRect(0,790,1920,70);c.fillStyle='rgba(255,255,255,.05)';c.fillRect(0,790,1920,4);ctRoad(m,860,1000,cam*6);c.fillStyle='#161a28';c.fillRect(0,1000,1920,80)}
// ---------- f00 morning ----------
SC.a_f00=(t)=>{const id='f00',m=CTM.dawn,cam=t*16;ctStreetScene(t,m,cam,.5+.2*Math.sin(t*.2));
  [[180,-1,'#c9a13f',0],[1300,1,'#c04f4f',1]].forEach(([x0,d,col,i])=>{const x=mod(x0+d*(t*(120+i*30)),2500)-250;ctCar(x,930,.72,col,d,{driver:true})});
  const x=mod(300+t*70,2800)-300;ctBus(x,885,.62,'#e8b94a',1,{riders:6});
  ctLamp(260,800,m);ctLamp(1160,800,m);
  CTC1.forEach((p,i)=>{const x=mod(p.x0+p.sp*t,2300)-150,s=.78+(p.y-835)/115*.34;ctPerson(x,p.y,s,{k:p.k,sd:p.sd,dir:p.sp>0?1:-1,ph:t*3.2+i,carry:p.carry,skirt:p.skirt,hair:p.hair,cap:p.cap})});
  ctGrade(m.amb,.12);const L1=oT(id,1,'waking');const tm=t<oT(id,1,'on')+3?'7:41':'7:42';
  oShow(t-.5,()=>ctClock(tm,t));oTxt('TUESDAY',1690,246,22,'rgba(244,246,255,.55)','center',800);
  ctVignette(.5)};
// ---------- f01 the moment ----------
SC.a_f01=(t)=>{const id='f01',m=CTM.dawn,Tv=oT(id,0,'gone')-.4,cam=300;const gr=cl((t-Tv)/3);
  ctStreetScene(t,{...m,top:m.top,bot:m.bot},cam,.55);ctLamp(260,800,m);ctLamp(1160,800,m);
  // vehicles stand still after the moment
  ctBus(1250,885,.62,'#e8b94a',1,{riders:6,hazard:t>Tv+1,t});ctCar(380,930,.72,'#c9a13f',-1,{hazard:t>Tv+1,t});
  CTC1.forEach((p,i)=>{const tv=Tv+(p.x0%1920)/1920*1.7,womanVanish=(p.k==='w'),tstop=womanVanish?tv:Tv+.9+rnd(i)*.6,tt=Math.min(t,tstop),x=mod(p.x0+p.sp*tt+cam*0,2300)-150,s=.78+(p.y-835)/115*.34;
    const walking=t<tstop;
    if(womanVanish){const u=t>tv?(t-tv)/1.6:0;ctVP(x,p.y,s,{k:p.k,sd:p.sd,dir:p.sp>0?1:-1,ph:tt*3.2+i,carry:p.carry,skirt:p.skirt,hair:p.hair,cap:p.cap,vu:u,walk:walking});
      if(t>tv+.5&&p.carry){const dx=(p.carry==='bag'?'#6b4a2a':'#fff');c.fillStyle=dx;if(p.carry==='bag')c.fillRect(x+10*s,p.y-14*s,34*s,24*s);else{c.fillRect(x+10*s,p.y-10*s,12*s,14*s);c.fillStyle='rgba(90,50,20,.6)';c.beginPath();c.ellipse(x+30*s,p.y+2*s,18*s,5*s,0,0,PI*2);c.fill()}}}
    else{const turn=t>Tv+.2?((Math.sin(t*2+i)>0)?-1:1):(p.sp>0?1:-1);ctPerson(x,p.y,s,{k:p.k,sd:p.sd,dir:t<tstop?(p.sp>0?1:-1):turn,ph:tt*3.2+i,carry:p.carry,hair:p.hair,cap:p.cap,walk:walking})}});
  c.save();c.globalAlpha=gr*.9;ctGrade('#6a7aa0',.5);c.restore();c.save();c.globalAlpha=gr;ctVignette(.8);c.restore();
  // flash of light at the moment
  c.save();c.globalAlpha=.35*Math.exp(-Math.abs(t-Tv-.4)*3);c.fillStyle='#ffe3b0';c.fillRect(0,0,1920,1080);c.restore();
  oShow(t-oT(id,0,'sound'),()=>ctClock('7:42',t,'#ff8f8f'));
  oShow(t-oT(id,1,'four'),(p)=>{c.save();c.translate(960,250);c.scale(p,p);oTxt('≈ 4,000,000,000',0,0,100,'#ffd48a','center',800,30);c.restore()},.4)};
// ---------- f02 the streets ----------
SC.a_f02=(t)=>{const id='f02',m=CTM.grey,cam=t*10;ctStreetScene(t,m,cam,.45);ctLamp(300,800,m,false);ctLamp(1250,800,m,false);
  // unattended vehicles coast and stop crookedly
  const Tb=oT(id,0,'buses'),Tt=oT(id,0,'trains'),Tc=oT(id,0,'cars');
  const bx=-300+Math.min(1,cl(t/5))*1100+eo(cl((t-Tb)/6))*600,bs=cl((t-Tb)/5);ctBus(bx+Math.max(0,t-4)*0,885,.62,'#e8b94a',1,{riders:4,hazard:t>1,t});
  [[900,'#c04f4f',0],[1350,'#4f7ec0',1],[1620,'#c9a13f',2]].forEach(([x0,col,i])=>{const u=eo(cl((t-Tc+i*.9)/4)),x=x0-300+u*(i%2?40:120),rot=(i===1?-.06:.04)*u;c.save();c.translate(x,0);c.translate(0,930);c.rotate(rot);ctCar(0,0,.72,col,-1,{hazard:true,t});c.restore()});
  // people running toward vehicles / looking around
  for(let i=0;i<8;i++){const p=CTC1[i*3%CTC1.length],x=300+i*210+Math.sin(t*.7+i)*40,run=(Math.sin(t*.5+i*2)>0);ctPerson(x+Math.sin(t*(run?3:0))*0,p.y,.9,{k:'m',sd:p.sd+7,dir:(i%2?1:-1),ph:t*(run?7:0),walk:run})}
  // drifting papers
  c.save();c.fillStyle='rgba(255,255,255,.65)';for(let i=0;i<14;i++){const x=mod(i*160+t*90,2100)-100,y=880+Math.sin(t*2+i)*40-rnd(i)*120;c.save();c.translate(x,y);c.rotate(t*2+i);c.fillRect(-10,-7,20,14);c.restore()}c.restore();
  ctGrade('#7080a0',.3);ctVignette(.7);
  oShow(t-Tt,()=>{c.save();c.globalAlpha=.9;oTxt('BUSES · TRAINS · CARS',960,200,44,'rgba(244,246,255,.85)','center',800,16);c.restore()},.4)};
// ---------- f03 hospital ----------
SC.a_f03=(t)=>{const id='f03';c.fillStyle='#16202e';c.fillRect(0,0,1920,1080);c.fillStyle='#202c3e';c.fillRect(0,0,1920,640);c.fillStyle='#2b3a50';c.fillRect(0,640,1920,440);
  // ceiling lights
  for(let i=0;i<6;i++){const x=180+i*320,fl=(i===2&&Math.sin(t*14)>.4)?.3:1;c.fillStyle=`rgba(210,235,255,${.8*fl})`;c.fillRect(x-70,40,140,16);c.save();c.globalCompositeOperation='lighter';const g=lg(x,56,x,700,[[0,'rgba(180,220,255,.22)'],[1,'rgba(180,220,255,0)']]);c.fillStyle=g;c.beginPath();c.moveTo(x-70,56);c.lineTo(x+70,56);c.lineTo(x+200,700);c.lineTo(x-200,700);c.fill();c.restore()}
  // red alarm light
  const al=Math.sin(t*6)>0;c.fillStyle=al?'#ff3d57':'#3a1219';c.shadowColor='#ff3d57';c.shadowBlur=al?30:0;c.beginPath();c.arc(1740,170,20,0,PI*2);c.fill();c.shadowBlur=0;
  // beds + patients + monitors
  for(let i=0;i<5;i++){const x=260+i*340,y=800;c.fillStyle='#c8d4e6';c.fillRect(x-130,y-20,260,14);c.fillStyle='#3a4a66';c.fillRect(x-130,y-6,8,70);c.fillRect(x+122,y-6,8,70);c.fillStyle='#dfe8f5';c.beginPath();c.roundRect(x-120,y-60,240,44,12);c.fill();c.fillStyle='#4f7ec0';c.beginPath();c.roundRect(x-20,y-64,140,50,12);c.fill();c.fillStyle=CTSKIN[i%5];c.beginPath();c.arc(x-96,y-62,18,0,PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.roundRect(x-130,y-84,56,28,10);c.fill();
    // monitor
    c.fillStyle='#0a0f18';c.fillRect(x+60,y-250,130,86);c.strokeStyle='#58e08a';c.lineWidth=3;c.beginPath();for(let k=0;k<=26;k++){const xx=x+66+k*4.6,ph=mod(t*1.4-k*.04+i*.3,1),yy=y-206-(ph<.08?30*Math.sin(ph/.08*PI):0)+Math.sin(k)*1.5;k?c.lineTo(xx,yy):c.moveTo(xx,yy)}c.stroke();c.fillStyle=Math.sin(t*5+i*2)>0?'#ff3d57':'#401018';c.fillRect(x+66,y-252+0,8,8);
    // IV stand
    c.strokeStyle='#8a97b0';c.lineWidth=4;c.beginPath();c.moveTo(x-170,y+50);c.lineTo(x-170,y-190);c.lineTo(x-140,y-190);c.stroke();c.fillStyle='rgba(180,220,255,.5)';c.fillRect(x-146,y-190,22,50)}
  // remaining staff rush between beds (men in scrubs)
  [[0,'#2f8f8f'],[1,'#3f6fc0'],[2,'#2f8f8f']].forEach(([i,col])=>{const x=mod(300+t*(150+i*50)*(i%2?-1:1)+i*500,2200)-150;ctPerson(x,990,1.45,{k:'m',sd:40+i,col,dir:(i%2?-1:1),ph:t*6+i,pants:'#2f4f6a'})});
  // abandoned nurse station
  c.fillStyle='#3a4a66';c.fillRect(1480,900,380,80);c.fillStyle='#8a97b0';c.fillRect(1500,860,100,40);c.fillStyle='rgba(255,255,255,.6)';c.fillRect(1640,880,60,18);
  ctGrade('#5a7aa0',.25);ctVignette(.6);
  ctLT('≈ 70% of the health & social care workforce are women','WHO · Delivered by Women, Led by Men · 2019',t,oT(id,1,'seventy'));
  oShow(t-oT(id,1,'nurses'),()=>{oTxt('24 M of 28.5 M NURSES & MIDWIVES',960,200,40,'#ffb0c0','center',800,18)},.4)};
