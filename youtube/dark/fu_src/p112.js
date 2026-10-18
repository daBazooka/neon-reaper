// ---------- FU vertical Short (fu-s1): column x 690-1230, content above y 800 ----------
SC.a_u0=(t)=>{fuBg(t,'#ff8a3d');
 oShow(t-.2,(p)=>{c.save();c.translate(960,230);c.scale(p,p);oFit('"MONEY WON\'T',0,0,520,90,'#fff','center',900,18,FUC.org);oFit('MATTER IN 2036"',0,92,520,84,FUC.yel,'center',900,18);c.restore()});
 oShow(t-1,(p)=>{c.save();c.translate(960,520);c.scale(p,p);oPanel(-270,-110,540,220,.78,hexa(FUC.st,.6),24);oFit('FACT CHECK',0,-34,480,70,'#fff','center',900,14,FUC.st);oTxt('in 30 seconds',0,40,32,FUC.dim,'center',700);c.restore()});
 oShow(t-2,(p)=>{c.save();c.translate(960,740);c.scale(p,p);oChip('MUSK · THE ECONOMIST · JULY 2026',0,0,22,FUC.org);c.restore()});ctVignette(.55)};
SC.a_u1=(t)=>{fuBg(t);oTxt('1  THE FLYING CAR',960,150,34,FUC.st,'center',900);
 const u=Math.max(0,Math.min(1,(t-.6)/5));const K=[[0,730,0],[.3,560,-.9],[.55,430,-PI],[.8,450,-PI*2],[1,730,-PI*2]];let py=730,pr=0;for(let i=0;i<K.length-1;i++)if(u>=K[i][0]&&u<=K[i+1][0]){const k=eo((u-K[i][0])/(K[i+1][0]-K[i][0]));py=K[i][1]+(K[i+1][1]-K[i][1])*k;pr=K[i][2]+(K[i+1][2]-K[i][2])*k}
 c.fillStyle='#0d121b';c.fillRect(600,760,720,320);fuCar(960,py,pr,1.0,u>.4&&u<.9?.8:0);
 oShow(t-3,(p)=>{c.save();c.translate(960,310);c.scale(p,p);oFit('A HOP, NOT',0,0,520,54,'#fff','center',900);oFit('SUSTAINED FLIGHT',0,60,520,54,FUC.red,'center',900);c.restore()});
 oShow(t-6,(p)=>{c.save();c.translate(960,780);c.scale(p,p);oChip('PRODUCTION 2028 · PROMISED FOR 2020 IN 2017',0,0,20,FUC.yel);c.restore()});ctVignette(.55)};
SC.a_u2=(t)=>{fuBg(t,'#ff5a5a');oTxt('2  THE DATES',960,150,34,FUC.red,'center',900);
 [['2016: LA→NYC self-drive by end of 2017','did not happen as promised'],['2025: robotaxis for half the U.S. by year-end','April 2026: "not super material this year"']].forEach((q,i)=>oShow(t-(1+i*3.2),(p)=>{c.save();c.translate(960,300+i*210);c.scale(p,p);oPanel(-270,-90,540,180,.78,hexa(FUC.red,.6),20);ccWrap(q[0],0,-40,480,26,'#fff',32,'center',900,2);ccWrap(q[1],0,34,480,22,'#cfd8ee',28,'center',700,2);c.restore()}));
 oShow(t-7,(p)=>{c.save();c.translate(960,740);c.scale(p,p);oChip('DIRECTION SOMETIMES RIGHT · DATES OFTEN LATE',0,0,20,FUC.yel);c.restore()});ctVignette(.55)};
SC.a_u3=(t)=>{fuBg(t,'#5fd49a');oTxt('3  WATCH THE NUMBERS',960,150,34,FUC.grn,'center',900);
 ['ROBOT OUTPUT','AIR-TAXI CERTIFICATION','JOBS & WAGES'].forEach((s,i)=>oShow(t-(1+i*1.2),(p)=>{c.save();c.translate(960,320+i*130);c.scale(p,p);oPanel(-270,-48,540,96,.78,hexa(FUC.grn,.6),20);oFit(s,0,0,480,36,'#fff','center',900);c.restore()}));
 oShow(t-5,(p)=>{c.save();c.translate(960,730);c.scale(p,p);oFit('FULL VIDEO ON THE CHANNEL',0,0,520,36,FUC.yel,'center',900);c.restore()});ctVignette(.55)};
