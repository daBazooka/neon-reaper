// ---------- DM: "the scroll" feed-style scene system for the doomscrolling film ----------
const DMC={a:'#ff4fa3',b:'#4fd8ff',w:'#ffd166',g:'#58e08a',r:'#ff5a6a'};
function dmBg(t,tint='#ff4fa3'){c.fillStyle=lg(0,0,0,1080,[[0,'#0a0a14'],[1,'#12101e']]);c.fillRect(0,0,1920,1080);oGlow(1500,300,700,tint,.09+.03*Math.sin(t*.7));oGlow(300,900,600,'#4fd8ff',.05)}
function dmCard(i,w,h,mood=0){const sd=i*7.31,hue=Math.floor(rnd(sd)*360);c.fillStyle='rgba(255,255,255,.07)';rr(0,0,w,h,16,'#1b1a2c');
 c.fillStyle=`hsl(${hue},60%,55%)`;c.beginPath();c.arc(30,30,16,0,PI*2);c.fill();c.fillStyle='rgba(255,255,255,.55)';c.fillRect(56,20,w*.38,9);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(56,36,w*.22,7);
 if(rnd(sd+2)>.55){c.fillStyle=mood>0?'#ff5a6a':'#ff4fa3';rr(w-96,16,80,24,12,c.fillStyle);oTxt(rnd(sd+3)>.5?'BREAKING':'ALERT',w-56,28,13,'#fff','center',900)}
 c.fillStyle=`hsl(${hue},45%,${22+rnd(sd+4)*14}%)`;rr(14,58,w-28,h*.42,10,c.fillStyle);c.fillStyle='rgba(255,255,255,.5)';c.fillRect(18,h*.42+72,w*(.55+rnd(sd+5)*.35),9);c.fillStyle='rgba(255,255,255,.28)';c.fillRect(18,h*.42+90,w*(.35+rnd(sd+6)*.4),8)}
function dmFeed(x,y,w,h,t,speed,mood=0){c.save();c.beginPath();c.roundRect(x,y,w,h,26);c.clip();c.fillStyle='#0e0d1a';c.fillRect(x,y,w,h);const ch=Math.round(w*.78),N=14,off=t*speed;
 for(let k=0;k<N;k++){const yy=y+mod(k*(ch+14)-off,N*(ch+14))-ch;c.save();c.translate(x+14,yy);dmCard(k,w-28,ch,mood);c.restore()}c.restore();rr(x,y,w,h,26,0,'rgba(255,255,255,.5)',4)}
function dmPhone(cx,cy,S,t,speed,mood=0){c.save();c.translate(cx,cy);c.scale(S,S);rr(-196,-386,392,772,44,'#05050c','rgba(255,255,255,.55)',5);dmFeed(-176,-362,352,724,t,speed,mood);rr(-48,-376,96,18,9,'#05050c');c.restore()}
function dmChip(u,x,y,s,col,size=30){oShow(u,(p)=>{c.save();c.translate(x,y);c.scale(p,p);oChip(s,0,0,size,col);c.restore()})}
function dmHud(t,txt,val,x=1920-110,y=150){oTxt(txt,x,y,22,'#9aa4c0','right',800);oTxt(val,x,y+40,44,'#fff','right',900)}
function dmClockStr(sec){sec=Math.floor(sec);const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
SC.a_d00=(t)=>{const L=ATM.d00.lines;dmBg(t);const sp=300+Math.min(t,4)*220;
 dmPhone(960,545,1.02,t,sp);
 oShow(t-.3,(p)=>{c.save();c.translate(420,470);c.scale(p,p);oTxt('TIME ON FEED',0,-60,26,'#9aa4c0','center',800);oTxt(dmClockStr(t*340),0,10,80,'#ff4fa3','center',900,24);c.restore()});
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(1500,470);c.scale(p,p);oTxt('POSTS SEEN',0,-60,26,'#9aa4c0','center',800);oTxt(String(Math.floor(t*37)),0,10,90,'#4fd8ff','center',900,24);c.restore()});
 dmChip(t-(L[0]+1.4),420,640,'YOUR THUMB DID IT',DMC.w,28);dmChip(t-(L[1]+1.5),1500,640,'ONE MORE POST',DMC.r,28);
 oShow(t-(L[2]+.1),(p)=>{c.save();c.fillStyle='rgba(8,8,16,.78)';c.fillRect(0,0,1920,1080);c.translate(960,470);c.scale(p,p);oFit('THE SCROLL',0,0,1500,200,'#fff','center',900,36,'#ff4fa3');oFit('A FILM ABOUT THE FEED WITH NO BOTTOM',0,150,1500,48,'#9aa4c0','center',800);c.restore()});
 ctVignette(.6)};
SC.a_d01=(t)=>{const L=ATM.d01.lines;dmBg(t,'#ff5a6a');
 const word='DOOMSCROLLING',n=Math.min(word.length,Math.floor(t*10));oFit(word.slice(0,n)+(Math.sin(t*8)>0&&n<word.length?'_':''),960,300,1600,150,'#fff','center',900,30,'#ff4fa3');
 oShow(t-.9,()=>oFit('endlessly scrolling bad news, long after it stops helping you',960,420,1500,42,'#b9c2dc','center',700));
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(960,640);c.scale(p,p);oPanel(-560,-130,1120,260,.7,'rgba(255,209,102,.5)',26);oTxt('OXFORD WORD OF THE YEAR 2024',0,-80,28,'#ffd166','center',900);oFit('BRAIN ROT',0,-10,1000,100,'#fff','center',900,24,'#ffd166');oTxt('use of the term up 230% in a year',0,76,34,'#e8ecf8','center',700);c.restore()});
 oShow(t-(L[2]+.1),(p)=>{c.save();c.translate(960,880);c.scale(p,p);oChip('NOT JUST YOU  ·  IT IS A PATTERN',0,0,30,'#58e08a');c.restore()});
 ctVignette(.6)};
SC.a_d02=(t)=>{const L=ATM.d02.lines;dmBg(t);const ph=Math.max(0,Math.min(1,(t-L[0]-.5)/3));
 dmPhone(520,540,1.0,t,260);// scroll thumb shrinking to nothing
 c.fillStyle='rgba(255,255,255,.12)';c.fillRect(740,170,10,740);const th=Math.max(6,300*(1-ph));c.fillStyle='#ff4fa3';c.fillRect(740,170+mod(t*180,740-th),10,th);
 const R=[['A BOOK','has chapters'],['A SHOW','has an ending'],['A FEED','has neither']];
 R.forEach((q,i)=>oShow(t-(L[0]+.4+i*.9),(p)=>{c.save();c.translate(1250,250+i*120);c.scale(p,p);oPanel(-330,-46,660,92,.65,i===2?'rgba(255,90,106,.7)':'rgba(255,255,255,.2)',16);oTxt(q[0],-290,0,34,i===2?'#ff5a6a':'#fff','left',900);oTxt(q[1],310,0,28,'#9aa4c0','right',700);c.restore()}));
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(1250,620);c.scale(p,p);oPanel(-340,-110,680,220,.75,'rgba(255,209,102,.5)',22);oTxt('AZA RASKIN · INVENTED INFINITE SCROLL',0,-70,22,'#ffd166','center',900);oTxt('~100,000 lifetimes / day',0,-8,52,'#fff','center',900,16);oTxt('his own estimate, hard to verify',0,60,26,'#9aa4c0','center',700);c.restore()});
 dmChip(t-(L[2]+.2),1250,860,'ONLY A DECISION CAN STOP IT',DMC.w,28);ctVignette(.6)};
SC.a_d03=(t)=>{const L=ATM.d03.lines;dmBg(t,'#ffd166');
 oShow(t-.1,()=>oTxt('WHAT WILL THE NEXT POST BE?',960,170,50,'#fff','center',900,16,'#ffd166'));
 const S=['BORING','FUNNY','SCARY'],col=['#9aa4c0','#58e08a','#ff5a6a'];
 for(let i=0;i<3;i++){const x=560+i*400,y=500,stop=L[1]+.6+i*.6,u=t-stop;oShow(t-(L[0]+.2),(p)=>{c.save();c.translate(x,y);c.scale(p,p);oPanel(-150,-170,300,340,.8,'rgba(255,255,255,.25)',24);
  c.save();c.beginPath();c.rect(-130,-120,260,240);c.clip();const spin=u<0;for(let k=-2;k<=2;k++){const idx=spin?Math.floor(t*14+k+i*3):Math.floor(stop*14+i*3)+ (k);const lab=spin?S[mod(idx,3)]:(k===0?['SCARY','FUNNY','BORING'][i]:S[mod(idx,3)]);const yy=k*100+(spin?mod(t*1400,100)-50:0);oTxt(lab,0,yy,46,spin?'rgba(255,255,255,.55)':(k===0?col[S.indexOf(lab)]:'rgba(255,255,255,.18)'),'center',900)}c.restore();c.restore()})}
 oShow(t-(L[1]+.2),()=>oTxt('REWARDS THAT ARRIVE AT RANDOM KEEP YOU PULLING',960,860,32,'#e8ecf8','center',800));
 oShow(t-(L[2]+.1),(p)=>{c.save();c.fillStyle='rgba(8,8,16,.82)';c.fillRect(0,0,1920,1080);c.translate(960,380);c.scale(p,p);oPanel(-460,-110,380,220,.9,'rgba(88,224,138,.5)',24);oTxt('CALM HEADLINE',-270,-30,28,'#58e08a','center',900);oTxt('seen 2nd',-270,30,34,'#fff','center',800);oPanel(80,-110,380,220,.9,'rgba(255,90,106,.7)',24);oTxt('SCARY HEADLINE',270,-30,28,'#ff5a6a','center',900);oTxt('eyes land 1st',270,30,34,'#fff','center',800);oTxt('ATTENTION IS BUILT TO NOTICE THREATS',0,200,40,'#ffd166','center',900);c.restore()});
 ctVignette(.6)};
function dmWeeks(x,y,fill,t,col='#ff4fa3'){const cw=14,ch=7.2,tot=52*80;for(let k=0;k<tot;k++){const cx=k%52,cy=Math.floor(k/52);const on=k<fill;c.fillStyle=on?col:'rgba(255,255,255,.14)';c.fillRect(x+cx*cw,y+cy*ch,cw-3,ch-2)}}
SC.a_d04=(t)=>{const L=ATM.d04.lines;dmBg(t,'#4fd8ff');
 oShow(t-.1,()=>oTxt('141 MIN / DAY  ·  GLOBAL AVERAGE (2025)',560,170,34,'#4fd8ff','center',900));
 const days=Math.floor(1787*eo((t-(L[0]+.8))/4));oShow(t-(L[0]+.5),(p)=>{c.save();c.translate(560,360);c.scale(p,p);oTxt('× 365 × 50 YEARS',0,-70,32,'#9aa4c0','center',800);oTxt(days.toLocaleString()+' DAYS',0,20,110,'#fff','center',900,22,'#4fd8ff');c.restore()});
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(560,560);c.scale(p,p);oTxt('≈ 4.9 YEARS · 24h a day',0,0,44,'#ffd166','center',900);oTxt('≈ 7.3 YEARS · awake hours only',0,70,40,'#ff7a8a','center',900);c.restore()});
 const fill=Math.floor(52*80*.0912*eo((t-(L[0]+.3))/5));dmWeeks(1010,150,fill,t);oTxt('A LIFE IN WEEKS (80 YEARS)',1010+364,128,22,'#9aa4c0','center',800);
 oShow(t-(L[2]+.1),(p)=>{c.save();c.translate(1374,760);c.scale(p,p);oChip('≈ 9% OF AN 80-YEAR LIFE',0,0,32,'#ff4fa3');c.restore()});
 oShow(t-(L[2]+1),()=>oTxt('arithmetic on an average — not a prediction about you',960,880,28,'#9aa4c0','center',700));ctVignette(.6)};
SC.a_d05=(t)=>{const L=ATM.d05.lines;dmBg(t,'#58e08a');
 oShow(t-.1,()=>oTxt('TIME ON ONE SCREEN BEFORE SWITCHING',960,170,44,'#fff','center',900,14,'#58e08a'));
 const bars=[['2004','~2.5 min',150,'#58e08a',L[0]+.6],['~2016 →','~47 sec',47,'#ff5a6a',L[0]+3.4]];
 bars.forEach((b,i)=>{const u=eo((t-b[4])/.9),y=340+i*190;oTxt(b[0],360,y,44,'#e8ecf8','right',900);c.fillStyle='rgba(255,255,255,.1)';c.fillRect(400,y-44,1100,88);c.fillStyle=b[3];c.fillRect(400,y-44,1100*(b[2]/150)*u,88);if(u>.5)oTxt(b[1],410+1100*(b[2]/150)*u+20,y,46,b[3],'left',900)});
 oShow(t-(L[1]+.4),(p)=>{c.save();c.translate(960,800);c.scale(p,p);oPanel(-620,-80,1240,160,.75,'rgba(255,209,102,.5)',22);oTxt('CAUTION',-560,-36,24,'#ffd166','left',900);oFit('this measures time on one screen — not how long your brain can pay attention',0,24,1120,36,'#fff','center',700);c.restore()});
 oShow(t-.5,()=>oTxt('Prof. Gloria Mark, UC Irvine',960,230,26,'#9aa4c0','center',700));ctVignette(.6)};
SC.a_d06=(t)=>{const L=ATM.d06.lines;dmBg(t,'#4fd8ff');
 oShow(t-.1,()=>oTxt('WHAT THE STUDIES SAY',960,160,56,'#fff','center',900,16,'#4fd8ff'));
 const card=(u,x,big,col,l1,l2)=>oShow(u,(p)=>{c.save();c.translate(x,520);c.scale(p,p);oPanel(-280,-210,560,420,.8,hexa(col,.55),26);oFit(big,0,-80,500,110,col,'center',900,18);ccWrap(l1,0,30,480,32,'#fff',40,'center',800,3);oTxt(l2,0,160,24,'#9aa4c0','center',700);c.restore()});
 card(t-(L[1]+.1),520,'16.5%','#ff5a6a','had a severely problematic bad-news habit','survey of 1,100 US adults · self-reported');
 card(t-(L[2]+.1),1400,'TWO-WAY','#4fd8ff','feeling worse → seeking worse content → feeling worse','UCL · 1,000+ participants');
 oShow(t-(L[3]+.1),(p)=>{c.save();c.translate(960,870);c.scale(p,p);oChip('MOSTLY CORRELATION  ·  NOT PROVEN THAT SCROLLING ALONE CAUSES DEPRESSION',0,0,24,'#ffd166');c.restore()});ctVignette(.6)};
SC.a_d07=(t)=>{const L=ATM.d07.lines;dmBg(t,'#ff4fa3');
 oShow(t-.1,()=>oTxt('EMOTIONAL CONTAGION · 2014',960,160,50,'#fff','center',900,14,'#ff4fa3'));
 const shift=eo((t-(L[1]+.2))/2);
 for(let r=0;r<2;r++)for(let i=0;i<8;i++){const x=300+i*190,y=340+r*190;const neg=(r*8+i)/16<shift*.8+.1;c.save();c.translate(x,y);rr(-80,-70,160,140,18,'#1b1a2c',neg?'#ff5a6a':'#58e08a',3);c.strokeStyle=neg?'#ff5a6a':'#58e08a';c.lineWidth=6;c.lineCap='round';c.beginPath();c.arc(0,-6,30,0,PI*2);c.stroke();c.beginPath();c.arc(-11,-14,3,0,PI*2);c.arc(11,-14,3,0,PI*2);c.stroke();c.beginPath();if(neg)c.arc(0,20,14,PI*1.15,PI*1.85);else c.arc(0,2,18,PI*.15,PI*.85);c.stroke();c.restore()}
 oShow(t-(L[0]+.3),()=>oTxt('FEWER POSITIVE POSTS IN THE FEED →',960,640,38,'#e8ecf8','center',800));
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(960,760);c.scale(p,p);oChip('PEOPLE WROTE FEWER POSITIVE POSTS AND MORE NEGATIVE ONES',0,0,28,'#ff7a8a');c.restore()});
 oShow(t-(L[2]+.1),()=>oTxt('effects were small · large scale · criticized for no informed consent',960,860,28,'#9aa4c0','center',700));ctVignette(.6)};
SC.a_d08=(t)=>{const L=ATM.d08.lines;dmBg(t,'#58e08a');
 oShow(t-.1,()=>oTxt('INFORMED  vs  THE LOOP',960,160,56,'#fff','center',900,16,'#58e08a'));
 oShow(t-(L[0]+.2),(p)=>{c.save();c.translate(560,500);c.scale(p,p);oPanel(-300,-190,600,380,.8,'rgba(88,224,138,.6)',26);oTxt('INFORMED',0,-120,48,'#58e08a','center',900);['goal in mind','it ends','you can act'].forEach((q,i)=>oTxt('✓  '+q,0,-30+i*66,36,'#fff','center',800));c.restore()});
 oShow(t-(L[1]+.2),(p)=>{c.save();c.translate(1360,500);c.scale(p,p);oPanel(-300,-190,600,380,.8,'rgba(255,90,106,.6)',26);oTxt('THE LOOP',0,-120,48,'#ff5a6a','center',900);['no goal','no end','just worry'].forEach((q,i)=>oTxt('✕  '+q,0,-30+i*66,36,'#fff','center',800));c.restore()});
 oShow(t-(L[2]+.1),(p)=>{c.save();c.translate(960,830);c.scale(p,p);oPanel(-700,-70,1400,140,.8,'rgba(255,209,102,.6)',24);oFit('Is this making me more able to DO something — or just more worried?',0,0,1300,40,'#fff','center',800);c.restore()});ctVignette(.6)};
SC.a_d09=(t)=>{const L=ATM.d09.lines;dmBg(t,'#4fd8ff');
 oShow(t-.1,()=>oTxt('SIX STEPS · NO WILLPOWER NEEDED',960,150,50,'#fff','center',900,14,'#4fd8ff'));
 const S=[['1','ADD FRICTION','log out · move the app · use the browser'],['2','GIVE IT AN ENDING','sources that finish: newsletters, bulletins'],['3','DECIDE BEFORE YOU OPEN','say what for · leave when done'],['4','PROTECT FIRST & LAST 10 MIN','no screen at either end of the day'],['5','REPLACE, DON\'T JUST REMOVE','book · walk · call'],['6','CHECK WEEKLY SCREEN TIME','set a limit you will keep']];
 S.forEach((q,i)=>oShow(t-(L[i+1]+.1),(p)=>{const col=i%2?280:1010,x=i%2?1010:290,row=Math.floor(i/2);c.save();c.translate(x+310,300+row*210);c.scale(p,p);oPanel(-310,-90,620,180,.78,'rgba(79,216,255,.5)',22);oTxt(q[0],-262,0,70,'#4fd8ff','center',900,16);oFit(q[1],30,-30,430,34,'#fff','center',900);oFit(q[2],30,28,430,26,'#b9c2dc','center',700);c.restore()}));
 ctVignette(.6)};
SC.a_d10=(t)=>{const L=ATM.d10.lines;dmBg(t,'#58e08a');const slow=1-eo((t-L[1])/3);
 dmPhone(960,565,.88,t,Math.max(0,260*slow));
 oShow(t-(L[1]+1.8),(p)=>{c.save();c.translate(960,565);c.scale(p,p);oPanel(-400,-70,800,140,.95,'rgba(88,224,138,.7)',26);oTxt("YOU'VE REACHED THE END",0,-14,50,'#58e08a','center',900,16);oTxt('put it down · look up',0,38,30,'#e8ecf8','center',700);c.restore()});
 oShow(t-(L[0]+.3),()=>oTxt('YOU ARE THE BOTTOM OF THE FEED',960,150,44,'#fff','center',900,14,'#58e08a'));ctVignette(.6)};
SC.a_dend=(t)=>{c.fillStyle='#07070d';c.fillRect(0,0,1920,1080);const p=eo(t/1.2);c.save();c.globalAlpha*=p;oFit('YOU HAVE REACHED THE END.',960,500,1500,110,'#fff','center',900,22,'#58e08a');oTxt('put it down.',960,620,44,'#9aa4c0','center',700);c.restore();ctVignette(.7)};
// thumbnails
SC.a_dmthA=(t)=>{dmBg(0);dmPhone(1400,540,1.2,2.4,0);oFit('YOU WILL',470,300,780,130,'#fff','center',900,22,'#ff4fa3');oFit('SCROLL FOR',470,440,780,130,'#fff','center',900,22,'#ff4fa3');oFit('7 YEARS',470,620,780,170,'#ff5a6a','center',900,30);oFit('here is the math',470,780,780,50,'#9aa4c0','center',800);ctVignette(.55)};
SC.a_dmthB=(t)=>{dmBg(0,'#ff5a6a');dmWeeks(500,150,Math.floor(52*80*.0912),0);oFit('YOUR LIFE IN WEEKS',960,90,1500,50,'#e8ecf8','center',900);oFit('THE PINK ONES ARE SCROLLING',960,940,1700,80,'#ff4fa3','center',900,20);ctVignette(.5)};
SC.a_dmthC=(t)=>{dmBg(0,'#58e08a');oFit("YOU'VE REACHED",960,330,1700,150,'#fff','center',900,24,'#58e08a');oFit('THE END OF THE FEED',960,500,1700,130,'#58e08a','center',900,24);oFit('(a film about doomscrolling)',960,660,1500,50,'#9aa4c0','center',800);ctVignette(.55)};
