/* TM-LIB-BEGIN */
// ================= ALL OF TIME =================
const TMC={gold:'#ffcf6b',cyan:'#5fe0ff',vio:'#9b7bff',pink:'#ff6bb0',red:'#ff4d5e',grn:'#6bffb0',ice:'#cfe6ff'};
const TMX=[0,-43.3,-35,-18,-15,-9,-6,-3,-1,0,2.5,6,9.4,11.2,13,13.1,15.3,16.2,17.6,17.9,21.5,41.5,74.5,107.5,9.4,9.4,9.4,9.4];
const TMIDS=['x00','x01','x02','x03','x04','x05','x06','x07','x08','x09','x10','x11','x12','x13','x14','x15','x16','x17','x18','x19','x20','x21','x22','x23','x24','x25','x26','xend'];
const TMNAME={x00:'ONE SECOND',x01:'THE PLANCK TIME',x02:'INFLATION',x03:'ONE ATTOSECOND',x04:'ONE FEMTOSECOND',x05:'ONE NANOSECOND',x06:'ONE MICROSECOND',x07:'ONE MILLISECOND',x08:'A TENTH OF A SECOND',x09:'ONE SECOND',x10:'MINUTES',x11:'A DAY · A YEAR',x12:'AN 80-YEAR LIFE',x13:'5,000 YEARS',x14:'300,000 YEARS',x15:'380,000 YEARS',x16:'66 MILLION YEARS',x17:'540 MILLION YEARS',x18:'THE AGE OF THE UNIVERSE',x19:'5 BILLION YEARS FROM NOW',x20:'100 TRILLION YEARS',x21:'THE PROTON LIFETIME',x22:'BLACK HOLES FADE',x23:'THE HEAT DEATH',x24:'YOU ARE HERE',x25:'YOU ARE HERE',x26:'ALL OF TIME',xend:''};
const TMSUP={'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻','.':'·'};
const tmSup=(e)=>{const v=Math.abs(e-Math.round(e))<.05?String(Math.round(e)):e.toFixed(1);return '10'+[...v].map(ch=>TMSUP[ch]||ch).join('')+' s'};
function tmIdx(id){return TMIDS.indexOf(id)}
const TMLAB={x00:'1 second',x01:'5.4 × 10⁻⁴⁴ s',x02:'10⁻³⁵ s',x03:'1 attosecond',x04:'1 femtosecond',x05:'1 nanosecond',x06:'1 microsecond',x07:'1 millisecond',x08:'0.1 second',x09:'1 second',x10:'3 – 8 minutes',x11:'1 day · 1 year',x12:'2.5 × 10⁹ s',x13:'5,000 years',x14:'300,000 years',x15:'380,000 years',x16:'66 million years',x17:'540 million years',x18:'13.8 billion years',x19:'+5 billion years',x20:'10¹⁴ years',x21:'10³⁴ years',x22:'10⁶⁷ years',x23:'10¹⁰⁰ years',x24:'80 years',x25:'80 years',x26:'all of it',xend:''};
function tmHud(id,t){const i=tmIdx(id),ex=TMX[i],prev=i>0?TMX[i-1]:ex,k=eo((t-.15)/1.6),cur=prev+(ex-prev)*k;
  const x0=110,x1=1810,m=(e)=>x0+(e+45)/153*(x1-x0);
  // warp streaks while the marker travels
  const wp=cl(1-(t-.1)/1.5);if(wp>0&&Math.abs(ex-prev)>1){c.save();c.globalCompositeOperation='lighter';c.lineWidth=2;for(let q=0;q<46;q++){const y=250+rnd(q*3.3)*640,len=140+rnd(q)*520,x=mod(rnd(q*7)*2200+t*(2200+rnd(q)*1400)*(ex>prev?-1:1),2400)-200;c.strokeStyle=`rgba(255,215,140,${wp*.22*rnd(q*9)})`;c.beginPath();c.moveTo(x,y);c.lineTo(x+len,y);c.stroke()}c.restore()}
  c.save();c.fillStyle='rgba(255,255,255,.16)';c.fillRect(x0,70,x1-x0,6);
  c.fillStyle=lg(x0,0,x1,0,[[0,'rgba(95,224,255,.85)'],[.5,'rgba(155,123,255,.85)'],[1,'rgba(255,77,94,.85)']]);c.fillRect(x0,70,Math.max(0,m(cur)-x0),6);
  for(let e=-40;e<=100;e+=20){c.fillStyle='rgba(255,255,255,.45)';c.fillRect(m(e),60,2,26);oTxt(e===0?'1 s':'10'+[...String(e)].map(ch=>TMSUP[ch]||ch).join(''),m(e),106,20,'rgba(255,255,255,.55)','center',700)}
  c.fillStyle=TMC.cyan;c.fillRect(m(9.4)-1.5,50,3,40);oTxt('YOU',m(9.4),34,22,TMC.cyan,'center',800);
  const mx=m(cur);c.shadowColor=TMC.gold;c.shadowBlur=26;c.fillStyle=TMC.gold;c.beginPath();c.moveTo(mx,92);c.lineTo(mx-13,60);c.lineTo(mx+13,60);c.closePath();c.fill();c.restore();
  const rung=Math.max(0,Math.min(150,Math.round(cur+43.3)));
  oTxt(TMLAB[id]||tmSup(ex),110,168,74,TMC.gold,'left',800,28);oTxt(TMNAME[id]+(id!=='x26'&&id!=='xend'?'   ·   '+tmSup(ex):''),110,224,26,TMC.ice,'left',800);
  oTxt('RUNG '+rung+' / 150',1810,168,38,TMC.cyan,'right',800)}
function tmEgg(x,y,t,s=1,a=1){c.save();c.globalAlpha*=a;c.translate(x,y);c.scale(s,s);const gl=.5+.5*Math.sin(t*2.2+x);c.shadowColor=TMC.gold;c.shadowBlur=14+10*gl;c.strokeStyle=TMC.gold;c.fillStyle=hexa(TMC.gold,.8);c.lineWidth=4;c.lineJoin='round';
  c.beginPath();c.moveTo(-18,-28);c.lineTo(18,-28);c.lineTo(3,0);c.lineTo(18,28);c.lineTo(-18,28);c.lineTo(-3,0);c.closePath();c.stroke();
  c.beginPath();c.moveTo(-12,24);c.lineTo(12,24);c.lineTo(0,10);c.closePath();c.fill();c.beginPath();c.moveTo(-9,-24);c.lineTo(9,-24);c.lineTo(0,-12);c.closePath();c.fill();c.fillRect(-22,-32,44,4);c.fillRect(-22,28,44,4);
  const sp=mod(t*.6,1);c.globalAlpha*=.5;c.fillStyle='#fff';c.beginPath();c.arc(Math.cos(sp*6.28)*30,Math.sin(sp*6.28)*30,3,0,PI*2);c.fill();c.restore()}
function tmStars(t,n=120,col='255,255,255',a=.5,sp=6){c.save();for(let i=0;i<n;i++){const x=mod(rnd(i)*2000-t*sp*(.3+rnd(i*3)*.9),2000)-40,y=rnd(i*7.7)*1080,r=.6+rnd(i*2.3)*1.8,tw=.4+.6*(.5+.5*Math.sin(t*1.3+i*1.7));c.fillStyle=`rgba(${col},${a*tw})`;c.beginPath();c.arc(x,y,r,0,PI*2);c.fill()}c.restore()}
function tmBg(t,c1='#070914',c2='#010208',glow=TMC.vio,ga=.2){oBg(t,c1,c2,glow,ga);tmStars(t,90,'255,255,255',.4)}
function tmBurst(cx,cy,t,col,n=60,r0=160){c.save();c.strokeStyle=hexa(col,.2);c.lineWidth=2;for(let i=0;i<n;i++){const a=i/n*PI*2,rr0=r0+rnd(i)*100;c.beginPath();c.moveTo(cx+Math.cos(a)*rr0,cy+Math.sin(a)*rr0);c.lineTo(cx+Math.cos(a)*1700,cy+Math.sin(a)*1700);c.stroke()}c.restore()}
// ---------- x00 the hook ----------
function tmClock(x,y,r,tt,col){c.save();c.translate(x,y);oGlow(0,0,r*1.8,col,.3);c.strokeStyle=hexa(col,.85);c.lineWidth=8;c.beginPath();c.arc(0,0,r,0,PI*2);c.stroke();for(let i=0;i<60;i++){const a=i/60*PI*2;c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=i%5?2:5;c.beginPath();c.moveTo(Math.cos(a)*(r-10),Math.sin(a)*(r-10));c.lineTo(Math.cos(a)*(r-(i%5?18:30)),Math.sin(a)*(r-(i%5?18:30)));c.stroke()}
  const a=tt*PI*2-PI/2;c.strokeStyle=TMC.gold;c.lineWidth=7;c.lineCap='round';c.shadowColor=TMC.gold;c.shadowBlur=20;c.beginPath();c.moveTo(Math.cos(a+PI)*30,Math.sin(a+PI)*30);c.lineTo(Math.cos(a)*(r-40),Math.sin(a)*(r-40));c.stroke();c.restore()}
SC.a_x00=(t)=>{const id='x00',A=aT(id),L=A.lines;tmBg(t,'#080a18','#010208',TMC.gold,.18);
  const sec=mod(t,1);
  {const a=oPh(t,0,L[2]-.3);if(a>0){c.save();c.globalAlpha*=a;tmClock(560,500,220,sec,TMC.gold);oTxt('1.000 s',560,770,60,TMC.gold,'center',800,22);
    // chips
    oShow(t-oT(id,1,'light'),(p)=>{c.save();c.translate(1250,330);c.scale(p,p);oPanel(-300,-110,600,220,.6,hexa(TMC.cyan,.5));c.save();c.translate(-170,0);c.fillStyle='#1c4a7a';c.beginPath();c.arc(0,0,70,0,PI*2);c.fill();const an=sec*7.5*PI*2;c.fillStyle='#fff';c.shadowColor=TMC.cyan;c.shadowBlur=18;c.beginPath();c.arc(Math.cos(an)*84,Math.sin(an)*84,9,0,PI*2);c.fill();c.restore();oTxt('LIGHT ×7.5',90,-14,50,TMC.cyan,'center',800);oTxt('AROUND THE EARTH',90,40,28,OC.dim,'center',700);c.restore()});
    oShow(t-oT(id,1,'heart'),(p)=>{c.save();c.translate(1250,560);c.scale(p,p);oPanel(-300,-90,600,180,.6,hexa(TMC.red,.5));const hb=1+.25*Math.exp(-sec*7);c.save();c.translate(-170,0);c.scale(hb,hb);c.fillStyle=TMC.red;c.shadowColor=TMC.red;c.shadowBlur=24;c.beginPath();c.moveTo(0,40);c.bezierCurveTo(-80,-10,-40,-60,0,-24);c.bezierCurveTo(40,-60,80,-10,0,40);c.fill();c.restore();oTxt('1 HEARTBEAT',90,0,46,TMC.red,'center',800);c.restore()});
    oShow(t-oT(id,1,'universe'),(p)=>{c.save();c.translate(1250,760);c.scale(p,p);oPanel(-300,-80,600,160,.6,hexa(TMC.vio,.5));oTxt('+1 s',-170,-6,70,TMC.vio,'center',800);oTxt('OF ~4.35 × 10¹⁷',90,-14,34,'#fff','center',800);oTxt('AGE OF THE UNIVERSE',90,30,24,OC.dim,'center',700);c.restore()});
    c.restore()}}
  {const a=oPh(t,L[2]-.3,L[3]-.3);if(a>0){c.save();c.globalAlpha*=a;const t0=oT(id,2,'ladder'),n=Math.round(150*Math.pow(cl((t-t0)/(L[3]-t0-1.5)),1.6));
    oShow(t-oT(id,2,'time'),(p)=>{c.save();c.translate(960,360);c.scale(p,p);oTxt('TIME IS A LADDER',0,0,120,'#fff','center',800,34,TMC.gold);c.restore()});
    // ladder
    for(let r=0;r<Math.min(n,40);r++){const y=800-r*14-(n>40?(n-40)*0:0),w=40+r*9;c.fillStyle=hexa(TMC.gold,.15+.8*(r/40));c.fillRect(960-w/2,y,w,6)}
    oTxt('RUNG '+n,960,860,60,TMC.gold,'center',800,18);oShow(t-oT(id,2,'longer'),(p)=>{c.save();c.translate(1500,560);c.scale(p,p);oChip('EACH RUNG: ×10',0,0,56,TMC.cyan);c.restore()});
    c.restore()}}
  {const a=oPh(t,L[3]-.3,A.dur+1,.25,.1);if(a>0){c.save();c.globalAlpha*=a;
    const tt=t-(L[3]);oShow(t-oT(id,3,'ladder')+.2,(p)=>{c.save();c.translate(960,380);c.scale(p,p);oSer('ALL OF TIME',0,0,170,'#fff','center',700,40,TMC.gold);c.restore()});
    const th=oT(id,3,'seven');for(let i=0;i<7;i++){const u=t-th-i*.12;if(u<0)continue;const k=eo(u/1.6),ang=i/7*PI*2,tx=960+Math.cos(ang)*(120+k*700),ty=640+Math.sin(ang)*(60+k*220);tmEgg(tx,ty,t+i,1.1-k*.5,1-k*.35)}
    oShow(t-th,(p)=>{c.save();c.translate(960,800);c.scale(p,p);oChip('7 GOLDEN HOURGLASSES ARE HIDDEN IN THIS FILM',0,0,40,TMC.gold);c.restore()});c.restore()}}
};
// ---------- x01 Planck ----------
SC.a_x01=(t)=>{const id='x01',A=aT(id),L=A.lines;tmBg(t,'#0a0716','#020108',TMC.vio,.22);tmHud(id,t);
  // quantum foam grid
  const wall=1180+Math.sin(t*.5)*10;c.save();c.beginPath();c.rect(0,260,wall,640);c.clip();c.strokeStyle=hexa(TMC.vio,.45);c.lineWidth=2;
  for(let gx=0;gx<26;gx++){c.beginPath();for(let y=260;y<=900;y+=20){const nx=gx*48+Math.sin(y*.05+t*3+gx)*10*(1+Math.sin(t+gx)*.5)+(rnd(gx*7+Math.floor(y/20)+Math.floor(t*6))-.5)*18;y===260?c.moveTo(nx,y):c.lineTo(nx,y)}c.stroke()}
  for(let gy=0;gy<14;gy++){c.beginPath();for(let x=0;x<=1200;x+=20){const ny=260+gy*48+Math.sin(x*.05+t*3+gy)*10+(rnd(gy*9+Math.floor(x/20)+Math.floor(t*6))-.5)*18;x===0?c.moveTo(x,ny):c.lineTo(x,ny)}c.stroke()}c.restore();
  oShow(t-oT(id,1,'smallest'),()=>{oTxt('QUANTUM FOAM — NOBODY KNOWS',560,300,28,TMC.vio,'center',800,12)});
  // wall
  c.save();c.strokeStyle=TMC.red;c.lineWidth=6;c.shadowColor=TMC.red;c.shadowBlur=30;c.beginPath();c.moveTo(wall,250);c.lineTo(wall,910);c.stroke();c.restore();
  oShow(t-oT(id,1,'silent'),(p)=>{c.save();c.translate(wall+260,480);c.scale(p,p);oTxt('KNOWN',0,-40,60,TMC.cyan,'center',800,16);oTxt('PHYSICS',0,30,50,TMC.cyan,'center',800,16);c.restore()});
  oShow(t-oT(id,0,'planck'),(p)=>{c.save();c.translate(1560,740);c.scale(p,p);oPanel(-210,-90,420,180,.7,hexa(TMC.gold,.5));oTxt('5.39 × 10⁻⁴⁴ s',0,-24,46,TMC.gold,'center',800);oTxt('tₚ = √(ħG / c⁵)',0,34,38,'#fff','center',600);c.restore()});
  oShow(t-oT(id,2,'quantum'),(p)=>{oChip('QUANTUM MECHANICS  ≠  GRAVITY',960,765,36,TMC.red)});
  tmEgg(1090,300,t,.8,.55);
};
// ---------- x02 inflation ----------
SC.a_x02=(t)=>{const id='x02',A=aT(id),L=A.lines;tmBg(t,'#100a1c','#020108',TMC.pink,.25);tmHud(id,t);
  const t1=oT(id,1,'stretched'),g=cl((t-t1)/3.2),R=6+Math.pow(g,2.2)*900;
  tmBurst(960,600,t,TMC.pink,70,40+R*.2);oGlow(960,600,R*1.4+120,TMC.pink,.5);
  c.save();c.beginPath();c.arc(960,600,R,0,PI*2);c.clip();c.fillStyle='rgba(255,107,176,.2)';c.fillRect(0,0,1920,1080);for(let i=0;i<120;i++){const a=rnd(i)*PI*2,r=Math.sqrt(rnd(i*3))*R,s=1+rnd(i*5)*3*g;c.fillStyle=`rgba(255,${200+Math.floor(rnd(i)*50)},230,${.4+.5*rnd(i*9)})`;c.beginPath();c.arc(960+Math.cos(a)*r,600+Math.sin(a)*r,s,0,PI*2);c.fill()}c.restore();
  oRing(960,600,R,5,'#fff',.9);
  oShow(t-oT(id,1,'factor'),(p)=>{c.save();c.translate(960,690);c.scale(p,p);oTxt('×10²⁶',0,0,130,'#fff','center',800,36,TMC.pink);c.restore()},.4);
  oShow(t-oT(id,1,'smaller'),()=>{oChip('FAR SMALLER THAN AN ATOM',420,330,30,TMC.cyan)});
  oShow(t-oT(id,1,'hold'),()=>{oChip('...TO SOMETHING YOU COULD HOLD',1500,330,30,TMC.gold)});
  oShow(t-oT(id,2,'theory'),(p)=>{c.save();c.translate(960,780);c.scale(p,p);oChip('A THEORY — NOT A FACT',0,0,48,TMC.vio);c.restore()});
};
// ---------- x03 attosecond ----------
function tmAtom(x,y,s,t,per,col,showN){c.save();c.translate(x,y);c.scale(s,s);oGlow(0,0,160,col,.35);c.fillStyle='#ff6b7a';c.shadowColor='#ff6b7a';c.shadowBlur=26;c.beginPath();c.arc(0,0,22,0,PI*2);c.fill();c.shadowBlur=0;
  c.strokeStyle='rgba(255,255,255,.16)';c.lineWidth=2;c.beginPath();c.ellipse(0,0,170,170,0,0,PI*2);c.stroke();const an=t/per*PI*2;c.fillStyle=col;c.shadowColor=col;c.shadowBlur=22;c.beginPath();c.arc(Math.cos(an)*170,Math.sin(an)*170,14,0,PI*2);c.fill();for(let k=1;k<9;k++){c.globalAlpha=.4-k*.04;c.beginPath();c.arc(Math.cos(an-k*.12)*170,Math.sin(an-k*.12)*170,12-k,0,PI*2);c.fill()}c.restore()}
SC.a_x03=(t)=>{const id='x03',A=aT(id),L=A.lines;tmBg(t,'#07101a','#010208',TMC.cyan,.22);tmHud(id,t);
  const per=1.2;tmAtom(640,570,1.6,t,per,TMC.cyan);
  const orb=Math.floor(t/per);oShow(t-oT(id,1,'hydrogen'),()=>{oPanel(1100,300,700,230,.6,hexa(TMC.cyan,.45));oTxt('1 ORBIT',1450,350,30,OC.dim,'center',800);oTxt('≈ 150 attoseconds',1450,420,60,TMC.cyan,'center',800,22);oTxt('ORBITS WATCHED: '+orb,1450,490,28,OC.dim,'center',700)});
  oShow(t-oT(id,1,'if'),(p)=>{c.save();c.translate(1450,680);c.scale(p,p);oPanel(-350,-110,700,220,.6,hexa(TMC.gold,.45));oTxt('1 attosecond = 1 second?',0,-40,34,'#fff','center',800);oTxt('then 1 second = 32 billion years',0,30,40,TMC.gold,'center',800,18);c.restore()});
  oShow(t-oT(id,2,'nobel'),(p)=>{c.save();c.translate(1450,830);c.scale(p,p);oChip('NOBEL PRIZE IN PHYSICS · 2023 · ATTOSECOND LIGHT',0,0,30,TMC.gold);c.restore()});
};
// ---------- x04 femtosecond ----------
SC.a_x04=(t)=>{const id='x04',A=aT(id),L=A.lines;tmBg(t,'#0a1018','#010208',TMC.grn,.2);tmHud(id,t);
  const cyc=mod(t/6,1),ph=cyc;
  const ax=700,ay=600;function atom(x,y,r,col,l){c.save();c.fillStyle=col;c.shadowColor=col;c.shadowBlur=26;c.beginPath();c.arc(x,y,r,0,PI*2);c.fill();c.restore();oTxt(l,x,y,r*.9,'#04060c','center',800)}
  const sep=ph<.4?150+Math.sin(t*14)*10:ph<.7?150+(ph-.4)/.3*260:410, near=ph<.4?190:ph<.7?190-(ph-.4)/.3*70:120; // A-B bond then B-C forms
  const bx=ax+sep,cx2=ax+470+(ph>.4?-(ph-.4)/.3*Math.min(1,1)*120:0);
  atom(ax,ay,56,TMC.cyan,'A');atom(bx>ax+420?ax+420:bx,ay,48,TMC.gold,'B');atom(ax+640+(ph>.55?-Math.min(1,(ph-.55)/.3)*210:0),ay,40,TMC.pink,'C');
  c.save();c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=8;c.setLineDash([12,10]);c.beginPath();if(ph<.5){c.moveTo(ax+56,ay);c.lineTo(Math.min(bx,ax+420)-48,ay)}else if(ph>.8){c.moveTo(ax+640-210+(ph>.85?0:0)-40,ay);c.lineTo(ax+420+48,ay)}c.stroke();c.restore();
  oTxt('A–B + C  →  A + B–C',960,420,48,'#fff','center',800,16);
  oShow(t-oT(id,1,'chemistry'),()=>{oChip('A BOND BREAKS, ANOTHER FORMS: A FEW HUNDRED FEMTOSECONDS',960,730,32,TMC.grn)});
  oShow(t-oT(id,1,'zewail'),(p)=>{c.save();c.translate(960,800);c.scale(p,p);oChip('AHMED ZEWAIL · NOBEL PRIZE · 1999 · FEMTOCHEMISTRY',0,0,30,TMC.gold);c.restore()});
  oShow(t-oT(id,2,'billions'),()=>{oTxt('BILLIONS OF EVENTS, IN A ROW',960,330,40,TMC.cyan,'center',800)});
  tmEgg(1680,520,t,.8,.5);
};
