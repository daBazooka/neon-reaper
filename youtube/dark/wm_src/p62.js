// ---------- vertical Short (women-s1) ----------
function pBg(t,k,col){skBg(t,col,.2,'#090b17','#020309');for(let i=0;i<6;i++){c.fillStyle=i<=k?WMC.amb:'rgba(255,255,255,.2)';c.beginPath();c.arc(960-2.5*30+i*30,70,i===k?9+3*opul(t,5):6,0,PI*2);c.fill()}}
function pT(t,a,b,y,c1,c2,s1=56,s2=92){oShow(t-.05,(p)=>{c.save();c.translate(960,y);c.scale(p,p);oFit(a,0,-50,520,s1,c1,'center',800,20,c2);oFit(b,0,48,520,s2,c2,'center',800,24);c.restore()},.3)}
SC.a_p0=(t)=>{pBg(t,0,WMC.rose);pT(t,'7:42 AM','EVERY WOMAN GONE',230,WMC.amb,'#fff',64,60);const Td=oT('p0',0,'disappears');
  for(let r=0;r<7;r++)for(let k=0;k<8;k++){const x=720+k*66,y=345+r*64,gone=((r+k)%2===1)&&t>Td+(r*8+k)*.02;c.save();c.globalAlpha=gone?.15:1;c.fillStyle=gone?WMC.rose:'#e9eeff';c.shadowColor=gone?'transparent':'#e9eeff';c.shadowBlur=gone?0:10;c.beginPath();c.arc(x,y,17,0,PI*2);c.fill();c.restore()}
  oShow(t-Td,()=>{oChip('ABOUT 4 BILLION PEOPLE',960,790,26,WMC.rose)})};
SC.a_p1=(t)=>{pBg(t,1,WMC.red);pT(t,'DAY 1','THE HOSPITALS',230,WMC.red,'#fff',60,84);
  oShow(t-oT('p1',0,'seventy'),(p)=>{c.save();c.translate(960,500);c.scale(p,p);oTxt('≈ 70%',0,0,170,WMC.rose,'center',800,30);oTxt('OF HEALTH & SOCIAL CARE WORKERS',0,92,26,'#fff','center',800);oTxt('WHO · 2019',0,128,18,'rgba(244,246,255,.5)','center',700);c.restore()},.3);
  oShow(t-oT('p1',0,'handful'),(p)=>{c.save();c.translate(960,700);c.scale(p,p);for(let i=0;i<29;i++){const x=-250+(i%10)*55,y=-20+Math.floor(i/10)*44;c.fillStyle=i<24?'rgba(255,155,189,.25)':'#e9eeff';c.beginPath();c.arc(x,y,13,0,PI*2);c.fill()}oTxt('24 M of 28.5 M NURSES & MIDWIVES',0,100,22,WMC.rose,'center',800);c.restore()})};
SC.a_p2=(t)=>{pBg(t,2,WMC.amb);pT(t,'WEEK 1','UNPAID CARE',230,WMC.amb,'#fff',60,92);
  oShow(t-oT('p2',0,'seventy'),(p)=>{c.save();c.translate(960,500);c.scale(p,p);const w=eo((t-oT('p2',0,'seventy'))/1.4);c.lineWidth=46;c.strokeStyle='rgba(255,255,255,.12)';c.beginPath();c.arc(0,0,130,0,PI*2);c.stroke();c.strokeStyle=WMC.rose;c.beginPath();c.arc(0,0,130,-PI/2,-PI/2+PI*2*.762*w);c.stroke();oTxt('76%',0,-12,84,WMC.rose,'center',800,22);oTxt('BY WOMEN',0,40,24,'#fff','center',700);c.restore()},.3);
  oShow(t-oT('p2',0,'sixteen'),(p)=>{c.save();c.translate(960,720);c.scale(p,p);oFit('16.4 BILLION HOURS / DAY',0,0,520,44,'#fff','center',800,14);oTxt('ILO · 2018',0,40,18,'rgba(244,246,255,.5)','center',700);c.restore()});
  oShow(t-oT('p2',0,'stops'),(p)=>{c.save();c.translate(960,810);c.scale(p,p);oChip('IT ALL STOPS',0,0,34,WMC.red);c.restore()})};
SC.a_p3=(t)=>{pBg(t,3,WMC.grn);pT(t,'MONTH 1','2 IN 5 WORKERS',230,WMC.grn,'#fff',60,70);
  for(let i=0;i<20;i++){const x=730+(i%5)*100,y=400+Math.floor(i/5)*100,gone=(i%5<2)&&t>oT('p3',0,'workers')+i*.05;rr(x-32,y-32,64,64,10,gone?'rgba(255,255,255,.07)':'rgba(255,200,107,.85)')}
  oShow(t-oT('p3',0,'break'),(p)=>{c.save();c.translate(960,830);c.scale(p,p);oChip('SUPPLY CHAINS BREAK',0,0,30,WMC.red);c.restore()});
  oShow(t-oT('p3',0,'learn'),(p)=>{c.save();c.translate(960,810-0);c.restore()})};
SC.a_p4=(t)=>{pBg(t,4,WMC.red);pT(t,'YEAR 10','NO NEW BIRTHS',230,WMC.red,'#fff',56,74);
  oShow(t-oT('p4',0,'births'),(p)=>{c.save();c.translate(960,470);c.scale(p,p);oTxt('0',0,0,260,WMC.red,'center',800,40);oTxt('births per day',0,110,30,'rgba(244,246,255,.65)','center',700);c.restore()},.3);
  oShow(t-oT('p4',0,'technology'),(p)=>{c.save();c.translate(960,670);c.scale(p,p);oPanel(-260,-60,520,120,.8,hexa(WMC.ice,.5),24);oFit('NO TECHNOLOGY CAN CARRY',0,-20,480,30,'#fff','center',800);oFit('A PREGNANCY OUTSIDE A BODY',0,22,480,30,WMC.ice,'center',800);c.restore()},.3);
  oShow(t-oT('p4',0,'century'),(p)=>{c.save();c.translate(960,810);c.scale(p,p);oChip('HUMANITY ENDS IN ~100 YEARS',0,0,28,WMC.rose);c.restore()})};
SC.a_p5=(t)=>{skBg(t,WMC.amb,.3,'#16100a','#02030a');const gy=800;c.fillStyle='#0b0d18';c.fillRect(0,gy,1920,300);c.save();c.translate(960,gy);c.fillStyle='#10131f';c.fillRect(-150,-190,300,190);c.beginPath();c.moveTo(-180,-190);c.lineTo(0,-300);c.lineTo(180,-190);c.fill();const f=.7+.3*Math.sin(t*3);c.fillStyle=`rgba(255,200,120,${f})`;c.shadowColor=WMC.amb;c.shadowBlur=50;c.fillRect(-60,-130,50,60);c.fillRect(20,-130,50,60);c.restore();oGlow(960,gy-100,360,WMC.amb,.4);
  oShow(t-oT('p5',0,'respect'),(p)=>{c.save();c.translate(960,250);c.scale(p,p);oFit('NOTICE THE WORK.',0,0,520,84,'#fff','center',800,26,WMC.amb);c.restore()},.4);
  oShow(t-oT('p5',0,'name'),(p)=>{c.save();c.translate(960,420);c.scale(p,p);oChip('SAY HER NAME IN THE COMMENTS',0,0,26,WMC.rose);c.restore()})};
