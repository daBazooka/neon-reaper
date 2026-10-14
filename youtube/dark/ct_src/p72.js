// ---------- scenes f04..f07 ----------
function ctRoom(wall,floor,floorY,m){c.fillStyle=wall;c.fillRect(0,0,1920,floorY);c.fillStyle=floor;c.fillRect(0,floorY,1920,1080-floorY);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(0,floorY-8,1920,8)}
function ctWindow(x,y,w,h,m,t){c.fillStyle='#10131f';c.fillRect(x-10,y-10,w+20,h+20);c.fillStyle=lg(x,y,x,y+h,[[0,m.top],[1,m.bot]]);c.fillRect(x,y,w,h);c.fillStyle='rgba(16,19,31,.8)';c.fillRect(x+w/2-4,y,8,h);c.fillRect(x,y+h/2-4,w,8)}
function ctTable(x,y,w){c.fillStyle='#5a3f2c';c.fillRect(x-w/2,y,w,18);c.fillRect(x-w/2+20,y+18,14,110);c.fillRect(x+w/2-34,y+18,14,110)}
function ctChair(x,y,s,col='#7a5538',dir=1){c.save();c.translate(x,y);c.scale(s*dir,s);c.fillStyle=col;c.fillRect(-26,-70,8,70);c.fillRect(-26,-70,52,10);c.fillRect(-26,-30,52,10);c.fillRect(-26,-30,8,50);c.fillRect(18,-30,8,50);c.restore()}
function ctMug(x,y,s,steam,t){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#e8e8f0';c.fillRect(-14,-24,28,24);c.strokeStyle='#e8e8f0';c.lineWidth=5;c.beginPath();c.arc(16,-12,8,-PI/2,PI/2);c.stroke();if(steam){c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=3;for(let k=0;k<3;k++){const o=mod(t*.6+k/3,1);c.globalAlpha=1-o;c.beginPath();c.moveTo(-8+k*8,-28-o*30);c.quadraticCurveTo(-2+k*8,-40-o*30,-8+k*8,-52-o*30);c.stroke();c.globalAlpha=1}}c.restore()}
// ---------- f04 kitchen ----------
SC.a_f04=(t)=>{const id='f04',m=CTM.dawn;ctRoom('#3a2c38','#2a2030',760,m);const zoom=1+t*.004;c.save();c.translate(960,540);c.scale(zoom,zoom);c.translate(-960,-540);
  ctWindow(120,170,340,360,m,t);ctRays(130,180,300,800,m.sun,.22);c.fillStyle='#2f2330';c.fillRect(560,180,300,120);c.fillStyle='#46394a';c.fillRect(580,200,260,70);
  ctTable(960,620,520);ctChair(1190,760,1.25,'#7a5538',-1);ctChair(740,760,1.25,'#7a5538',1);ctMug(900,622,1.3,true,t);ctMug(1040,622,1.3,false,t);
  // calendar + family photo
  c.fillStyle='#e8d9b0';c.fillRect(1500,220,120,150);c.fillStyle='#10131f';c.fillRect(1510,230,100,24);
  // boy at table, father in doorway
  ctPerson(740,776,1.25,{k:'c',sd:61,dir:1,walk:false,col:'#4f7ec0'});
  const T0=oT(id,1,'father')-1,arr=cl((t-.5)/5),fx=1700-arr*320,walking=arr<1;ctPerson(fx,880,1.9,{k:'m',sd:62,dir:-1,ph:t*3,walk:walking,col:'#6e7a8a'});
  c.restore();ctGrade('#ffb27a',.18);ctVignette(.65);
  oShow(t-oT(id,1,'never'),(p)=>{c.save();c.globalAlpha*=.0;c.restore()})};
// ---------- f05 classroom + home ----------
SC.a_f05=(t)=>{const id='f05',m=CTM.day;
  // left: classroom
  c.save();c.beginPath();c.rect(0,0,960,1080);c.clip();ctRoom('#5a6a5a','#3a3328',720,m);c.fillStyle='#1d3a2a';c.fillRect(120,160,640,260);c.strokeStyle='#8a6a40';c.lineWidth=8;c.strokeRect(120,160,640,260);c.fillStyle='rgba(255,255,255,.6)';for(let i=0;i<4;i++)c.fillRect(150,200+i*40,300+i*60-(i%2)*80,6);
  ctWindow(790,170,130,250,m,t);ctRays(780,180,120,700,'#fff0c0',.18);
  for(let r=0;r<2;r++)for(let k=0;k<4;k++){const x=180+k*190,y=700+r*140+(r?30:0),girl=((r+k)%2===1);c.fillStyle='#8a6a40';c.fillRect(x-50,y-50,100,10);c.fillRect(x-40,y-40,8,60);c.fillRect(x+32,y-40,8,60);ctChair(x,y+4,.7,'#6a4a30',1);if(girl){c.fillStyle='#c0508f';c.fillRect(x-20,y-80,40,32);c.fillStyle='#e8c0d0';c.fillRect(x-14,y-72,28,8)}else if(t>1.5||true){ctPerson(x+4,y+6,.78,{k:'c',sd:70+r*4+k,dir:1,walk:false,col:CTCLOTH[(r*4+k)%8]})}}
  ctPerson(840,640,1.5,{k:'m',sd:75,dir:-1,walk:false,col:'#6e7a8a'});
  oTxt('NINE IN TEN OF THOSE WHO TEACH THE YOUNGEST: WOMEN',460,130,24,'rgba(255,255,255,.75)','center',800);c.restore();
  // right: home piling up
  c.save();c.beginPath();c.rect(960,0,960,1080);c.clip();ctRoom('#3a2f3a','#2a2230',720,m);const days=Math.min(9,Math.floor(t/2.5));
  c.fillStyle='#4a3a4e';c.fillRect(1000,560,880,150);c.fillStyle='#6a5870';c.fillRect(1000,552,880,12);
  for(let i=0;i<Math.min(24,days*3+2);i++){const x=1040+(i%12)*70,y=540-Math.floor(i/12)*26;c.fillStyle=['#e8e8f0','#c8d0e0','#d8c8a8'][i%3];c.beginPath();c.ellipse(x,y,26,8,0,0,PI*2);c.fill()}
  for(let i=0;i<days*2;i++){const x=1020+(i%5)*40,y=700-Math.floor(i/5)*24;c.fillStyle=CTCLOTH[i%8];c.beginPath();c.roundRect(x,y-20,56,26,8);c.fill()}
  c.fillStyle='rgba(255,255,255,.04)';for(let i=0;i<days*6;i++){c.beginPath();c.arc(1000+rnd(i)*880,300+rnd(i+9)*400,2+rnd(i)*3,0,PI*2);c.fill()}
  oTxt('DAY '+(days+1),1440,140,56,'rgba(255,255,255,.85)','center',800,16);oTxt('THE UNPAID WORK STOPS',1440,200,26,'#ffb0c0','center',800);
  oTxt('16.4 BILLION HOURS A DAY · 76% BY WOMEN (ILO)',1440,920,22,'rgba(255,255,255,.7)','center',700);c.restore();c.fillStyle='#000';c.fillRect(956,0,8,1080);ctGrade('#8896b0',.2);ctVignette(.55)};
// ---------- f06 fields, shops, factory ----------
SC.a_f06=(t)=>{const id='f06',m=CTM.grey;
  // panel 1 field
  c.save();c.beginPath();c.rect(0,0,640,1080);c.clip();ctSky(t,m,300,330,70);for(let r=0;r<9;r++){const y=640+r*48;c.strokeStyle=hexa('#d8b04a',.9);c.lineWidth=3+r*.5;for(let k=0;k<30;k++){const x=-40+k*(30+r*3)+Math.sin(t+k+r)*3;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.sin(t*1.5+k)*3,y-40-r*2);c.stroke()}}c.fillStyle='#3a3020';c.fillRect(0,1030,640,50);c.fillStyle='#8a2f2f';c.fillRect(250,820,120,50);c.fillRect(300,780,60,44);c.fillStyle='#0a0c14';c.beginPath();c.arc(270,880,28,0,PI*2);c.arc(350,882,22,0,PI*2);c.fill();oTxt('HARVESTS WAIT',320,180,40,'#fff','center',800,16);oTxt('≈ 43% of the farm workforce (FAO)',320,230,22,'rgba(255,255,255,.7)','center',700);c.restore();
  // panel 2 market
  c.save();c.beginPath();c.rect(640,0,640,1080);c.clip();ctSky(t,m,900,330,70);c.fillStyle='#2a2f42';c.fillRect(640,700,640,380);[0,1,2].forEach(i=>{const x=700+i*200;c.fillStyle=['#c04f4f','#d49a3d','#4f7ec0'][i];c.beginPath();c.moveTo(x,560);c.lineTo(x+170,560);c.lineTo(x+190,640);c.lineTo(x-20,640);c.closePath();c.fill();c.fillStyle='#3a2a1c';c.fillRect(x,640,170,120);c.fillStyle='#10131f';for(let k=0;k<3;k++)c.fillRect(x+16+k*48,700,36,50)});ctPerson(980,960,1.4,{k:'m',sd:90,dir:-1,walk:false,col:'#6e7a8a'});oTxt('SHOPS STAY DARK',960,180,40,'#fff','center',800,16);oTxt('2 IN 5 OF THE WORLD\'S WORKERS: GONE',960,230,22,'rgba(255,255,255,.7)','center',700);c.restore();
  // panel 3 factory
  c.save();c.beginPath();c.rect(1280,0,640,1080);c.clip();c.fillStyle='#10131f';c.fillRect(1280,0,640,1080);c.fillStyle='#1b2038';c.fillRect(1300,300,600,520);const fl=Math.sin(t*9)>.6?.2:.9;for(let i=0;i<6;i++){c.fillStyle=`rgba(255,220,140,${(i===1?fl:.8)*.8})`;c.fillRect(1330+i*95,340,70,40)}c.fillStyle='#2a2f42';c.fillRect(1280,780,640,40);const stop=cl((t-4)/1);for(let i=0;i<7;i++){const x=mod(1300+i*95+(1-stop)*t*90,720)+1280-40;c.fillStyle='#8a6a40';c.fillRect(x,740,60,40)}oTxt('SUPPLY CHAINS BEGIN TO BREAK',1600,180,34,'#fff','center',800,16);c.restore();
  c.fillStyle='#000';c.fillRect(636,0,8,1080);c.fillRect(1276,0,8,1080);ctGrade('#7080a0',.25);ctVignette(.6)};
// ---------- f07 community ----------
SC.a_f07=(t)=>{const id='f07',m=CTM.dusk,cam=t*8;ctSky(t,m,1500,700,90);ctSkyline(m,0,cam,760,.5,12,t);ctSkyline(m,1,cam,800,.7,13,t);c.fillStyle='#161a28';c.fillRect(0,830,1920,250);
  // string lights
  c.strokeStyle='#10131f';c.lineWidth=3;c.beginPath();c.moveTo(0,250);c.quadraticCurveTo(480,360,960,250);c.quadraticCurveTo(1440,360,1920,250);c.stroke();for(let i=0;i<24;i++){const u=i/23,x=u*1920,y=250+Math.sin(u*PI*2)*0+((u<.5)?Math.sin(u*2*PI)*110:Math.sin((u-.5)*2*PI)*110);c.fillStyle=`rgba(255,${200+i%3*20},120,.9)`;c.shadowColor='#ffcf80';c.shadowBlur=16;c.beginPath();c.arc(x,y+10,7,0,PI*2);c.fill();c.shadowBlur=0}
  // long table
  c.fillStyle='#5a3f2c';c.fillRect(250,840,1420,18);c.fillStyle='#46321f';c.fillRect(280,858,14,110);c.fillRect(1626,858,14,110);
  for(let i=0;i<9;i++){const x=330+i*150;c.fillStyle='#e8e8f0';c.beginPath();c.ellipse(x,836,26,7,0,0,PI*2);c.fill()}
  // pots w/ steam
  [500,980,1360].forEach((x,i)=>{c.fillStyle='#8a97b0';c.fillRect(x-40,790,80,50);c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=4;for(let k=0;k<3;k++){const o=mod(t*.5+k/3+i*.2,1);c.globalAlpha=1-o;c.beginPath();c.moveTo(x-16+k*16,780-o*60);c.quadraticCurveTo(x-6+k*16,750-o*60,x-16+k*16,720-o*60);c.stroke();c.globalAlpha=1}});
  // men cooking + kids helping + a recipe card
  [[420,'m',1,'#c9a13f'],[820,'m',2,'#4f7ec0'],[1220,'m',3,'#c0584f'],[1560,'m',4,'#4fa38b']].forEach(([x,k,i,col])=>ctPerson(x,990,1.7,{k,sd:110+i,dir:i%2?1:-1,walk:false,col}));
  [[640,'c',5],[1050,'c',6],[1450,'c',7]].forEach(([x,k,i])=>ctPerson(x+Math.sin(t*2+i)*6,990,1.7,{k,sd:120+i,dir:i%2?1:-1,walk:false}));
  c.save();c.translate(1110,610);c.rotate(Math.sin(t)*.02);c.fillStyle='#f4ecd6';c.fillRect(-90,-60,180,120);c.fillStyle='#8a6a40';for(let i=0;i<5;i++)c.fillRect(-70,-40+i*20,120-i*14,5);c.restore();oTxt('Grandma\'s soup — handwritten',1110,700,22,'rgba(255,255,255,.8)','center',700);
  ctGrade(m.amb,.15);ctVignette(.5)};
