// ---------- vertical Short (project alltime-s1): content stays inside x 670..1250 ----------
function tsBg(t,k,col){tmBg(t,'#080a18','#010208',col||TMC.gold,.22);for(let i=0;i<8;i++){c.fillStyle=i<=k?TMC.gold:'rgba(255,255,255,.2)';c.beginPath();c.arc(960-3.5*30+i*30,70,i===k?9+3*opul(t,5):6,0,PI*2);c.fill()}}
function tsTitle(t,s,y,size,col){oShow(t-.05,(p)=>{c.save();c.translate(960,y);c.scale(p,p);oFit(s,0,0,520,size,col||'#fff','center',800,28,TMC.gold);c.restore()},.3)}
SC.a_t0=(t)=>{const id='t0';tsBg(t,0);tsTitle(t,'ONE SECOND',190,150);
  const a=oPh(t,0,99);tmClock(960,470,190,mod(t,1),TMC.gold);oFit('1.000 s',960,730,520,80,TMC.gold,'center',800,22);
  oShow(t-oT(id,0,'hides'),(p)=>{c.save();c.translate(960,330);c.scale(p,p);c.globalAlpha*=.0;c.restore()})};
SC.a_t1=(t)=>{const id='t1';tsBg(t,1,TMC.cyan);tsTitle(t,'IN ONE SECOND',190,120,TMC.cyan);
  c.save();c.translate(960,480);oGlow(0,0,260,TMC.cyan,.35);c.fillStyle='#1c4a7a';c.beginPath();c.arc(0,0,130,0,PI*2);c.fill();c.strokeStyle='rgba(95,224,255,.4)';c.lineWidth=3;c.beginPath();c.arc(0,0,160,0,PI*2);c.stroke();
  const u=cl((t-oT(id,0,'light'))/3.6),an=u*7.5*PI*2;c.fillStyle='#fff';c.shadowColor=TMC.cyan;c.shadowBlur=24;c.beginPath();c.arc(Math.cos(an-PI/2)*160,Math.sin(an-PI/2)*160,13,0,PI*2);c.fill();c.restore();
  oShow(t-oT(id,0,'seven'),(p)=>{c.save();c.translate(960,700);c.scale(p,p);oFit('LIGHT × 7.5',0,-10,520,100,TMC.cyan,'center',800,26);oFit('AROUND THE EARTH',0,64,520,40,'#fff','center',800);c.restore()})};
SC.a_t2=(t)=>{const id='t2';tsBg(t,2,TMC.vio);tsTitle(t,'A BILLIONTH',190,140,TMC.vio);
  rr(690,455,540,34,10,'rgba(255,255,255,.12)');for(let i=0;i<=30;i++){c.fillStyle='rgba(255,255,255,.55)';c.fillRect(690+i*18,455,2,i%5?14:26)}
  const u=eo((t-oT(id,0,'light'))/2.2);c.save();c.shadowColor=TMC.vio;c.shadowBlur=26;c.fillStyle='#fff';c.beginPath();c.arc(690+540*u,472,14,0,PI*2);c.fill();c.restore();
  oShow(t-oT(id,0,'thirty'),(p)=>{c.save();c.translate(960,640);c.scale(p,p);oFit('30 CM',0,0,500,170,'#fff','center',800,34,TMC.vio);c.restore()});
  oFit('1 NANOSECOND',960,780,540,52,OC.dim,'center',800)};
SC.a_t3=(t)=>{const id='t3';tsBg(t,3,TMC.grn);tsTitle(t,'A QUADRILLIONTH',190,100,TMC.grn);
  const u=eo((t-oT(id,0,'bond')+.6)/2.2);const bx=1040+u*110;
  function at(x,y,l,col){c.save();c.shadowColor=col;c.shadowBlur=26;c.fillStyle=col;c.beginPath();c.arc(x,y,48,0,PI*2);c.fill();c.restore();oTxt(l,x,y,50,'#06101a','center',800)}
  c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=10;c.beginPath();c.moveTo(760,480);c.lineTo(900,480);c.stroke();c.setLineDash([10,12]);c.globalAlpha=.7*(1-u);c.beginPath();c.moveTo(900,480);c.lineTo(bx-40,480);c.stroke();c.setLineDash([]);c.globalAlpha=1;
  at(760,480,'A',TMC.cyan);at(900,480,'B',TMC.gold);at(bx,480,'C',TMC.pink);
  oShow(t-oT(id,0,'bond'),(p)=>{c.save();c.translate(960,640);c.scale(p,p);oFit('A BOND BREAKS',0,0,520,96,'#fff','center',800,24,TMC.grn);c.restore()});oFit('1 FEMTOSECOND',960,745,520,48,OC.dim,'center',800)};
SC.a_t4=(t)=>{const id='t4';tsBg(t,4,TMC.cyan);tsTitle(t,'150 ATTOSECONDS',190,100,TMC.cyan);
  c.save();c.translate(960,460);oGlow(0,0,200,TMC.cyan,.3);c.strokeStyle='rgba(95,224,255,.35)';c.lineWidth=3;c.beginPath();c.arc(0,0,130,0,PI*2);c.stroke();c.fillStyle=TMC.red;c.shadowColor=TMC.red;c.shadowBlur=24;c.beginPath();c.arc(0,0,28,0,PI*2);c.fill();
  for(let k=0;k<10;k++){const an=(t*1.1-k*.07)*PI*2;c.fillStyle=hexa(TMC.cyan,1-k*.09);c.beginPath();c.arc(Math.cos(an)*130,Math.sin(an)*130,12-k,0,PI*2);c.fill()}c.restore();
  oShow(t-oT(id,0,'electron'),(p)=>{c.save();c.translate(960,670);c.scale(p,p);oFit('ONE ELECTRON ORBIT',0,0,520,56,'#fff','center',800,16);c.restore()});
  oShow(t-oT(id,0,'nobel'),(p)=>{c.save();c.translate(960,750);c.scale(p,p);oChip('NOBEL PRIZE · 2023',0,0,36,TMC.gold);c.restore()})};
SC.a_t5=(t)=>{const id='t5';tsBg(t,5,TMC.gold);tsTitle(t,'YOUR WHOLE LIFE',190,110,TMC.gold);
  const u=eo((t-oT(id,0,'life'))/2.6);const n=Math.round(2.5e9*u).toLocaleString('en-US');oFit(n,960,420,520,100,'#fff','center',800,26,TMC.gold);oFit('SECONDS · 80 YEARS',960,520,520,50,TMC.gold,'center',800);
  for(let i=0;i<80;i++){const x=720+(i%10)*54,y=590+Math.floor(i/10)*24,on=i/80<u;c.fillStyle=on?hexa(TMC.gold,.9):'rgba(255,255,255,.12)';c.beginPath();c.arc(x,y,8,0,PI*2);c.fill()}
  };
SC.a_t6=(t)=>{const id='t6';tsBg(t,6,TMC.vio);tsTitle(t,'THE UNIVERSE',190,120,TMC.vio);
  oFit('435,000,000,000,000,000',960,330,520,60,'#fff','center',800,20,TMC.vio);oFit('SECONDS OLD',960,410,500,48,TMC.vio,'center',800);
  rr(690,520,540,30,15,'rgba(155,123,255,.35)');const z=eo((t-oT(id,0,'life'))/1.4);c.save();c.shadowColor=TMC.gold;c.shadowBlur=20;c.fillStyle=TMC.gold;c.fillRect(690,508,3,54);c.restore();oShow(t-oT(id,0,'life'),()=>{oFit('YOUR LIFE ▲',760,600,200,32,TMC.gold,'left',800)});
  oShow(t-oT(id,0,'millionth'),(p)=>{c.save();c.translate(960,720);c.scale(p,p);oFit('< 0.000001 %',0,0,520,100,'#fff','center',800,28,TMC.gold);c.restore()})};
SC.a_t7=(t)=>{const id='t7';tsBg(t,7,TMC.red);
  oShow(t-oT(id,0,'googol'),(p)=>{c.save();c.translate(960,230);c.scale(p,p);oFit('10¹⁰⁰ YEARS',0,0,520,120,TMC.red,'center',800,30);c.restore()},.3);
  rr(690,350,540,10,5,'rgba(255,255,255,.2)');c.save();c.shadowColor=TMC.cyan;c.shadowBlur=24;c.fillStyle=TMC.cyan;c.beginPath();c.arc(700,355,13,0,PI*2);c.fill();c.restore();oFit('YOU ARE HERE',780,410,300,30,TMC.cyan,'left',800);
  oShow(t-oT(id,0,'early'),(p)=>{c.save();c.translate(960,560);c.scale(p,p);oFit('YOU ARE',0,-50,520,120,'#fff','center',800,28,TMC.gold);oFit('EARLY.',0,70,520,170,TMC.gold,'center',800,40);c.restore()},.3);
  tmEgg(1195,690,t,1,1);
  oShow(t-oT(id,0,'channel'),(p)=>{c.save();c.translate(960,760);c.scale(p,p);oChip('FULL FILM: ALL OF TIME',0,0,32,TMC.gold);c.restore()})};
