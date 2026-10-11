// ---------- x20 last stars ----------
SC.a_x20=(t)=>{const id='x20',A=aT(id),L=A.lines;tmBg(t,'#070810','#010104',TMC.red,.15);tmHud(id,t);
  const t0=oT(id,0,'gas'),t1=oT(id,1,'every')+1.2,g=cl((t-t0)/Math.max(4,t1-t0));
  let alive=0;for(let i=0;i<260;i++){const x=140+rnd(i)*1640,y=290+rnd(i*3)*560,die=rnd(i*7)*.92,on=g<die+0.0;if(on)alive++;const r=2+rnd(i*5)*3.5;const fl=on?1:Math.max(0,1-(g-die)*14);if(fl<=0)continue;c.fillStyle=`rgba(255,${150+Math.floor(rnd(i)*80)},${100+Math.floor(rnd(i*2)*60)},${.4+.5*fl})`;c.shadowColor='#ff8a5a';c.shadowBlur=on?8:20*fl;c.beginPath();c.arc(x,y,r+(on?0:fl*6),0,PI*2);c.fill()}
  c.shadowBlur=0;oTxt(String(alive),960,560,260,'rgba(255,255,255,.12)','center',800);
  oShow(t-oT(id,0,'trillion'),(p)=>{c.save();c.translate(960,300);c.scale(p,p);oTxt('STARS REMAINING: '+alive,0,0,46,TMC.red,'center',800,16);c.restore()});
  oShow(t-oT(id,0,'gas'),()=>{oChip('THE GAS RUNS OUT · NEW STARS STOP FORMING',960,840,32,TMC.red)});
  oShow(t-oT(id,1,'memory'),(p)=>{c.save();c.translate(960,560);c.scale(p,p);c.globalAlpha*=.9;oTxt('EVERY STAR YOU HAVE EVER SEEN',0,-20,58,'#fff','center',800,24);oTxt('WILL BE A MEMORY',0,50,58,TMC.red,'center',800,24);c.restore()},.3);
};
// ---------- x21 proton decay ----------
SC.a_x21=(t)=>{const id='x21',A=aT(id),L=A.lines;tmBg(t,'#05101a','#010308',TMC.cyan,.2);tmHud(id,t);
  // tank
  c.save();c.translate(560,570);c.fillStyle='rgba(60,140,220,.25)';c.strokeStyle=hexa(TMC.cyan,.8);c.lineWidth=5;c.beginPath();c.ellipse(0,-200,230,60,0,0,PI*2);c.fill();c.stroke();c.fillRect(-230,-200,460,400);c.beginPath();c.moveTo(-230,-200);c.lineTo(-230,200);c.moveTo(230,-200);c.lineTo(230,200);c.stroke();c.beginPath();c.ellipse(0,200,230,60,0,0,PI);c.stroke();
  for(let r=0;r<10;r++)for(let q=0;q<14;q++){const x=-210+q*32,y=-170+r*38+Math.sin(q*.5)*8;c.fillStyle=hexa(TMC.gold,.35+.25*Math.sin(t*2+q+r));c.beginPath();c.arc(x,y,6,0,PI*2);c.fill()}c.restore();
  oTxt('ULTRA-PURE WATER · DEEP UNDERGROUND',560,840,24,TMC.cyan,'center',800);
  const t0=oT(id,0,'physicists');oShow(t-t0,()=>{oPanel(960,300,850,250,.6,hexa(TMC.cyan,.4));oTxt('PROTON DECAYS SEEN',1385,350,28,OC.dim,'center',800);oTxt('0',1385,440,130,TMC.cyan,'center',800,28);oTxt('WATCHED FOR ~30 YEARS',1385,520,26,OC.dim,'center',700)});
  oShow(t-oT(id,1,'longer'),(p)=>{c.save();c.translate(1385,700);c.scale(p,p);oTxt('LIFETIME  >  10³⁴ YEARS',0,0,76,'#fff','center',800,26,TMC.cyan);c.restore()},.4);
  oShow(t-oT(id,1,'dies'),(p)=>{c.save();c.translate(1385,790);c.scale(p,p);oChip('IF IT DIES AT ALL',0,0,44,TMC.gold);c.restore()});
};
// ---------- x22 black hole fade ----------
SC.a_x22=(t)=>{const id='x22',A=aT(id),L=A.lines;tmBg(t,'#05030a','#010104',TMC.vio,.2);tmHud(id,t);
  const g=cl((t-oT(id,0,'finishes'))/Math.max(5,A.dur-oT(id,0,'finishes')-3)),R=170*(1-.92*g)+8;
  c.save();c.translate(960,580);oGlow(0,0,R*2.6+60,TMC.gold,.35);for(let k=0;k<5;k++){c.strokeStyle=hexa(TMC.gold,.55-k*.09);c.lineWidth=14-k*2;c.beginPath();c.ellipse(0,0,R*1.9+k*18,R*.55+k*6,-.2,0,PI*2);c.stroke()}c.fillStyle='#000';c.shadowColor='#000';c.shadowBlur=30;c.beginPath();c.arc(0,0,R,0,PI*2);c.fill();c.shadowBlur=0;c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=3;c.beginPath();c.arc(0,0,R+3,0,PI*2);c.stroke();
  for(let i=0;i<90;i++){const u=mod(t*.18+rnd(i),1),a=rnd(i*3)*PI*2,r=R+u*420;c.fillStyle=`rgba(180,200,255,${(1-u)*(.3+.5*(1-g))})`;c.beginPath();c.arc(Math.cos(a)*r,Math.sin(a)*r,2.2,0,PI*2);c.fill()}c.restore();
  oShow(t-oT(id,0,'sun'),()=>{oChip('A BLACK HOLE AS HEAVY AS THE SUN',960,300,34,TMC.gold)});
  oShow(t-oT(id,0,'hawking'),(p)=>{c.save();c.translate(960,840);c.scale(p,p);oChip('HAWKING RADIATION · THE SLOWEST FIRE IN PHYSICS',0,0,32,TMC.vio);c.restore()});
  oShow(t-oT(id,1,'sixty'),(p)=>{c.save();c.translate(960,380);c.scale(p,p);oTxt('10⁶⁷ YEARS',0,0,110,'#fff','center',800,28,TMC.gold);c.restore()},.4);
};
// ---------- x23 heat death ----------
SC.a_x23=(t)=>{const id='x23',A=aT(id),L=A.lines;const fade=1-cl((t-(A.dur-5.5))/4.5);
  oBg(t,'#04030a','#000002',TMC.vio,.08*fade);c.save();c.globalAlpha*=fade;tmStars(t,18,'255,255,255',.18,2);c.restore();tmHud(id,t);
  // drifting photons
  c.save();c.globalAlpha*=fade;for(let i=0;i<40;i++){const x=mod(rnd(i)*2000-t*(8+rnd(i*3)*20),2000)-40,y=300+rnd(i*7)*560;c.fillStyle=`rgba(150,170,255,${.25*rnd(i*9)})`;c.beginPath();c.arc(x,y,1.5,0,PI*2);c.fill()}c.restore();
  oShow(t-oT(id,0,'hundred'),(p)=>{c.save();c.globalAlpha*=fade;c.translate(960,420);c.scale(p,p);oTxt('10¹⁰⁰ YEARS',0,0,150,'#fff','center',800,30,TMC.vio);c.restore()},.4);
  oShow(t-oT(id,1,'fading'),(p)=>{c.save();c.globalAlpha*=fade;c.translate(960,610);c.scale(p,p);oTxt('NOT A COLLAPSE. A FADING.',0,0,70,TMC.ice,'center',800,20);c.restore()});
  oShow(t-oT(id,1,'forecast'),(p)=>{c.save();c.globalAlpha*=fade;c.translate(960,780);c.scale(p,p);oChip('A FORECAST — NOT A CERTAINTY',0,0,40,TMC.gold);c.restore()});
  tmEgg(1620,760,t,.7,.35*fade);
};
// ---------- x24 you are here ----------
SC.a_x24=(t)=>{const id='x24',A=aT(id),L=A.lines;tmBg(t,'#081018','#010208',TMC.cyan,.22);tmHud(id,t);
  const x0=160,x1=1760,y=720;
  const zoom=eo((t-oT(id,1,'sliver'))/2.4);
  oShow(t-oT(id,0,'ladder'),()=>{c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=6;c.beginPath();c.moveTo(x0,y);c.lineTo(x1,y);c.stroke();rr(x0,y-14,6,28,3,TMC.cyan);oTxt('NOW',x0,y+50,32,TMC.cyan,'left',800);oTxt('10¹⁰⁰ YEARS →',x1,y+50,32,TMC.red,'right',800);oTxt('ALL OF THE FUTURE, ON ONE LINE',960,y+50,28,OC.dim,'center',700)});
  oShow(t-oT(id,1,'sliver'),()=>{c.save();c.translate(560,470);const R=150*zoom;c.strokeStyle=TMC.gold;c.lineWidth=5;c.shadowColor=TMC.gold;c.shadowBlur=24;c.beginPath();c.arc(0,0,R,0,PI*2);c.stroke();c.shadowBlur=0;c.strokeStyle='rgba(255,207,107,.5)';c.setLineDash([8,8]);c.beginPath();c.moveTo(-396,246);c.lineTo(-R*.6,R*.8);c.stroke();c.setLineDash([]);if(R>80){oTxt('THE STELLIFEROUS ERA',0,-20,28,TMC.gold,'center',800);oTxt('STARS STILL BURN',0,24,24,'#fff','center',700)}c.restore()});
  oShow(t-oT(id,1,'early'),(p)=>{c.save();c.translate(1330,380);c.scale(p,p);oTxt('WE ARE',0,-50,90,'#fff','center',800,30,TMC.cyan);oTxt('ASTONISHINGLY EARLY',0,36,72,TMC.gold,'center',800,26);c.restore()},.4);
  oShow(t-oT(id,2,'barely'),(p)=>{c.save();c.translate(1330,560);c.scale(p,p);oTxt('THE UNIVERSE HAS',0,-24,52,TMC.ice,'center',800,18);oTxt('BARELY BEGUN.',0,36,66,'#fff','center',800,22);c.restore()},.3);
  oShow(t-oT(id,2,'minds'),(p)=>{c.save();c.translate(1330,650);c.scale(p,p);oChip('ONE OF ITS FIRST MINDS',0,0,34,TMC.cyan);c.restore()});
};
// ---------- x25 the rungs you live on ----------
SC.a_x25=(t)=>{const id='x25',A=aT(id),L=A.lines;tmBg(t,'#0a0a14','#010208',TMC.gold,.2);tmHud(id,t);
  const R=[['1 SECOND','ATTENTION',TMC.red],['1 HOUR','FOCUS',TMC.pink],['1 DAY','HABITS',TMC.gold],['1 YEAR','CHANGE',TMC.grn],['10 YEARS','CAREER',TMC.cyan],['80 YEARS','A LIFE',TMC.vio],['CENTURIES','BRIDGES · BOOKS · IDEAS',TMC.ice]];
  R.forEach(([a,b,col],i)=>{const tt=i<4?oT(id,1,['seconds','days','years','people'][i],0):oT(id,1,['rare','rare','rare'][0])+(i-4)*.5;oShow(t-(i===0?oT(id,0,'ten'):i===1?oT(id,1,'seconds'):i===2?oT(id,1,'days'):i===3?oT(id,1,'years'):i===4?oT(id,1,'rare')-.2:i===5?oT(id,1,'rare')+.4:oT(id,1,'bridges')),(p)=>{const y=790-i*74,x=130+i*58;c.save();c.translate(x,y);c.scale(p,p);oPanel(0,-30,700,60,.75,hexa(col,.7),14);c.fillStyle=col;c.fillRect(0,-30,8,60);oTxt(a,26,0,26,col,'left',800);oTxt(b,250,0,24,'#fff','left',800);c.restore()})});
  oShow(t-oT(id,2,'decide'),(p)=>{c.save();c.translate(1480,420);c.scale(p,p);oTxt('PICK YOUR RUNG.',0,-30,60,'#fff','center',800,22,TMC.gold);oTxt('ACT ONE BELOW IT.',0,40,46,TMC.gold,'center',800);c.restore()});
};
// ---------- x26 closing + loop ----------
SC.a_x26=(t)=>{const id='x26',A=aT(id),L=A.lines;tmBg(t,'#090a16','#010208',TMC.gold,.2);tmHud(id,t);
  // fast ladder replay
  const t0=oT(id,0,'ladder'),u=cl((t-t0)/6);for(let r=0;r<44;r++){const yy=840-r*16,w=40+r*7,on=r/44<u*1.1;c.fillStyle=on?hexa(TMC.gold,.15+.7*(r/44)):'rgba(255,255,255,.05)';c.fillRect(300-w/2,yy,w,7)}
  oShow(t-oT(id,1,'spend'),(p)=>{c.save();c.translate(1100,330);c.scale(p,p);oTxt('SPEND IT LIKE YOU',0,-40,80,'#fff','center',800,28,TMC.gold);oTxt('KNOW THE NUMBERS.',0,50,80,'#fff','center',800,28,TMC.gold);c.restore()},.3);
  oShow(t-oT(id,2,'hid'),(p)=>{c.save();c.translate(1100,500);c.scale(p,p);oTxt('HOW MANY GOLDEN HOURGLASSES DID YOU FIND?',0,0,46,TMC.gold,'center',800,20);c.restore();for(let i=0;i<7;i++)tmEgg(740+i*100,590,t+i,.8,.4)});
  oShow(t-oT(id,2,'rung'),(p)=>{c.save();c.translate(1100,690);c.scale(p,p);oChip('WHICH RUNG STUNNED YOU MOST?  (WRITE ITS NUMBER)',0,0,34,TMC.cyan);c.restore()});
  oShow(t-oT(id,2,'space'),(p)=>{c.save();c.translate(1100,790);c.scale(p,p);oChip('NEXT: THE SAME JOURNEY THROUGH SPACE',0,0,34,TMC.vio);c.restore()});
};
SC.a_xend=(t)=>{tmBg(t,'#090a16','#010208',TMC.gold,.2);const a=eo(t/.6);c.save();c.globalAlpha*=a;oSer('ALL OF TIME',960,150,130,'#fff','center',700,34,TMC.gold);oTxt('THANK YOU FOR WATCHING.',960,260,40,OC.dim,'center',800);c.restore();
  [[250,'NEXT'],[1030,'SUBSCRIBE']].forEach(([x,l])=>{c.save();rr(x,330,640,360,30,'rgba(255,255,255,.05)','rgba(255,255,255,.3)',4);c.restore();oTxt(l,x+320,730,30,OC.dim,'center',800)});tmClock(960,880,70,mod(t,1),TMC.gold)};
