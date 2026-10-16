// ---------- PT: Bulletin 10 "STARTING TOMORROW" (recipe v1 from Bulletin 03): second-person rules, harmful habit as advice ----------
const PTAM='255,179,71';
function ptRoom(t,warm=0,dim=0){darkBg(t,'#0c1620','#04070b');c.fillStyle='#060b10';c.fillRect(0,760,1440,320);c.fillStyle='#0a1118';c.fillRect(0,752,1440,12);
 rr(90,150,260,360,6,lg(0,150,0,510,[[0,'#0a1426'],[1,'#101a2c']]),'#03060a',12);c.fillStyle='#03060a';c.fillRect(214,150,12,360);c.fillRect(90,320,260,12);
 if(warm>0)warmGlow(t,warm,720,520);if(dim){c.fillStyle=`rgba(0,0,0,${dim})`;c.fillRect(0,0,1440,1080)}}
function ptLaptop(x,y,s,t,glow,fn){c.save();c.translate(x,y);c.scale(s,s);
 rr(-300,-440,600,390,16,'#070b12','#1c2636',6);c.save();c.beginPath();c.roundRect(-282,-422,564,354,8);c.clip();c.translate(0,-245);fn();c.restore();
 c.fillStyle='#0b1018';c.beginPath();c.moveTo(-340,-40);c.lineTo(340,-40);c.lineTo(390,2);c.lineTo(-390,2);c.closePath();c.fill();rr(-390,2,780,16,6,'#0a0e15');
 c.save();c.globalCompositeOperation='lighter';c.fillStyle=rg(0,-245,10,720,[[0,`rgba(${glow},.22)`],[1,'rgba(0,0,0,0)']]);c.fillRect(-900,-900,1800,1800);c.restore();c.restore()}
function ptDoc(t,words,col='140,190,255',cursorOn=true,lines=[]){c.fillStyle='#e9eef7';c.fillRect(-282,-177,564,354);c.fillStyle='#cfd8e6';c.fillRect(-282,-177,564,26);
 c.fillStyle='#4a5a74';c.font=`700 15px ${MONOF}`;c.textAlign='left';c.textBaseline='middle';c.fillText('Untitled document',-270,-164);
 c.fillStyle='#1a2436';c.font=`600 22px ${SANS}`;lines.forEach((l,i)=>c.fillText(l,-250,-120+i*34));if(cursorOn&&Math.sin(t*5)>0){const li=Math.max(0,lines.length-1),w=lines.length?c.measureText(lines[li]).width:0;c.fillStyle='#1a2436';c.fillRect(-250+w+2,-134+li*34,3,28)}
 c.textAlign='right';c.font=`700 15px ${MONOF}`;c.fillStyle='#4a5a74';c.fillText('WORDS: '+words,270,160)}
SC.pt_title=(t)=>{c.fillStyle=lg(0,0,0,1080,[[0,'#0c1a2c'],[1,'#050a14']]);c.fillRect(0,0,1440,1080);
 const s=kf(t,[[0,.6],[1.6,1]],'out');c.save();c.translate(720,420);c.scale(s,s);c.strokeStyle='#dbe9ff';c.lineWidth=14;c.lineJoin='round';
 c.beginPath();c.moveTo(-190,90);c.lineTo(-190,-30);c.lineTo(0,-170);c.lineTo(190,-30);c.lineTo(190,90);c.closePath();c.stroke();
 rr(-80,-10,160,100,10,`rgba(${GL},.85)`,'#dbe9ff',8);c.beginPath();c.ellipse(0,-92,58,28,0,0,PI*2);c.fillStyle='#050a14';c.fill();c.stroke();c.beginPath();c.arc(0,-92,17,0,PI*2);c.fillStyle='#dbe9ff';c.fill();c.restore();
 c.textAlign='center';c.fillStyle='#dbe9ff';c.font='800 62px Georgia,serif';c.fillText('BUREAU OF HOUSEHOLD ATTENTION',720,700);
 c.font='600 34px "DejaVu Sans Mono",monospace';c.fillStyle='rgba(219,233,255,.8)';c.fillText(META.sub,720,776)};
SC.pt_end=(t)=>{c.fillStyle='#03060b';c.fillRect(0,0,1440,1080);c.textAlign='center';c.fillStyle='#dbe9ff';c.font='800 70px Georgia,serif';c.fillText('THIS TAPE HAS ENDED.',720,260)};
SC.pt_intro=(t)=>{ptRoom(t,0,0);
 const ping=(t>3&&mod(Math.floor(t),6)===4&&(t%1)<.5);
 ptLaptop(720,790,1.3,t,'140,190,255',()=>ptDoc(t,0,'140,190,255',true,['']));
 person(720,1060,{s:1.25,rim:.7});
 if(ping){const p=(t%1)/.5;c.save();c.globalAlpha=1-p;rr(960,250-p*40,400,70,35,'rgba(200,230,255,.9)');c.font=`700 28px ${MONOF}`;c.fillStyle='#04121f';c.textAlign='center';c.fillText('1 new video for you',1160,286-p*40);c.restore()}
 const clk=`${Math.floor(16+t/26*.9)}:${String(Math.floor(47+t*.4)%60).padStart(2,'0')}`;c.font=`800 40px ${MONOF}`;c.textAlign='right';c.fillStyle='rgba(255,179,71,.75)';c.fillText('DUE  09:00',1340,170);c.fillStyle='rgba(219,233,255,.6)';c.font=`700 30px ${MONOF}`;c.fillText('NOW  '+clk+' PM',1340,215)};
SC.pt_r1=(t)=>{darkBg(t,'#0a121c','#03060a');const L=[4,9,16,23,29];const idxA=(tt)=>tt>=14?1:L[Math.min(4,Math.floor(tt/3.2))];
 const cur=idxA(t),prev=t>=14?idxA(13.9):L[Math.max(0,Math.min(4,Math.floor(t/3.2))-1)],k=t>=14?eo((t-14)/.5):eo((t%3.2)/.6),pi=(Math.floor(t/3.2)===0&&t<14)?4:prev;
 const pos=(i)=>[720-3*92+(i%7)*92,282+Math.floor(i/7)*80];
 oTxtPT('MARCH',720,160,56,'#dbe9ff');
 c.save();rr(720-360,215,720,530,24,'rgba(10,16,26,.9)','#1c2636',4);c.restore();
 ['M','T','W','T','F','S','S'].forEach((d,i)=>oTxtPT(d,720-3*92+i*92,246,26,'#6a7c9a'));
 for(let i=0;i<35;i++){const [x,y]=pos(i);oTxtPT(String(i+1),x,y+28,28,i===0?'#fff':'#9fb2d0');}
 const [tx,ty]=pos(0);c.save();c.strokeStyle='#fff';c.lineWidth=4;c.beginPath();c.arc(tx,ty+28,32,0,PI*2);c.stroke();c.restore();
 const A=pos(pi),B=pos(cur),px=A[0]+(B[0]-A[0])*k,py=A[1]+(B[1]-A[1])*k;
 c.save();c.strokeStyle='#ff5a4a';c.lineWidth=8;c.shadowColor='#ff5a4a';c.shadowBlur=16;c.beginPath();c.arc(px,py+28,36,0,PI*2);c.stroke();c.restore();
 oTxtPT('DUE',px,py-18,22,'#ff7a6a');
 oTxtPT('DAYS LEFT',1230,330,26,'#9fb2d0');oTxtPT(String(t>=14?1:cur),1230,410,120,t>=14?'#ff5a4a':'#7be495');
 oTxtPT('PLENTY OF TIME',720,115,26,'#7be495',t<14?1:0);
};
function oTxtPT(s,x,y,size,col,a=1){if(!a)return;c.save();c.globalAlpha*=a;c.font=`800 ${size}px ${MONOF}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=col;c.fillText(s,x,y);c.restore()}
SC.pt_r2=(t)=>{ptRoom(t,0,0);
 const lay=(n,i)=>{const r=rnd(n*7+i*3.1),q=rnd(n*5+i*1.7),side=rnd(n*3+i)>.45;return side?[(r>.5?1150:50)+q*230,260+rnd(n+i*9)*480]:[100+r*1240,800+q*90]};
 const n=Math.floor(t/2.6),f=eo((t%2.6)/.9);
 for(let i=0;i<9;i++){const a=lay(n,i),b=lay(n+1,i),x=a[0]+(b[0]-a[0])*f,y=a[1]+(b[1]-a[1])*f;
  c.save();c.translate(x,y);c.rotate((rnd(i+n)-.5)*.5);const col=['#ffd46a','#7bd8ff','#ff9fb4','#a4f0a0'][i%4];c.fillStyle=col;c.globalAlpha=.88;c.fillRect(-26,-26,52,52);c.restore()}
 ptLaptop(720,790,1.3,t,'140,190,255',()=>ptDoc(t,0,'140,190,255',true,['']));
 oTxtPT('TIDYING: '+Math.floor(t*3.2)+' MIN',1180,170,32,'#ffb347');oTxtPT('WORDS WRITTEN: 0',1180,215,32,'#ff7a6a')};
SC.pt_r3=(t)=>{darkBg(t,'#120a0a','#03060a');const sp=kf(t,[[0,1],[8,20],[20,300]],'in');
 clockFace(720,470,250,t,{speed:sp});
 const left=Math.max(0,9*3600*(1-Math.pow(t/19.5,2.3)));const hh=String(Math.floor(left/3600)).padStart(2,'0'),mm=String(Math.floor(left/60)%60).padStart(2,'0'),ss=String(Math.floor(left)%60).padStart(2,'0');
 const red=Math.min(1,t/16);oTxtPT('TIME LEFT',1150,230,28,'#9fb2d0');oTxtPT(`${hh}:${mm}:${ss}`,1150,300,70,`rgb(${Math.round(255)},${Math.round(179-120*red)},${Math.round(71-30*red)})`);
 rr(180,260,70,420,14,'rgba(255,255,255,.08)','#3a2a2a',3);const p=Math.min(1,t/17);c.fillStyle=lg(0,680,0,260,[[0,'#ffb347'],[1,'#ff3a2a']]);c.fillRect(184,680-416*p,62,416*p);
 oTxtPT('PRESSURE',215,230,24,'#ff7a6a');oTxtPT('WORDS: 0 / 2000',1150,420,36,'#9fb2d0');
 if(t>15&&Math.sin(t*14)>0){c.fillStyle='rgba(255,60,40,.08)';c.fillRect(0,0,1440,1080)}};
SC.pt_r4=(t)=>{phoneFrame(t,t*150,{x:900});
 c.save();rr(110,200,520,640,24,'rgba(8,14,24,.9)','#1c2636',4);c.restore();
 oTxtPT('TO DO  0 / 5',370,260,36,'#dbe9ff');
 ['THE REPORT','THE EMAIL','THE TAXES','THE GYM','THE CALL'].forEach((s,i)=>{rr(150,320+i*92,44,44,8,null,'#6a7c9a',4);c.save();c.font=`800 30px ${MONOF}`;c.textAlign='left';c.textBaseline='middle';c.fillStyle='#9fb2d0';c.fillText(s,220,342+i*92);c.restore()});
 const h=Math.floor(t*.19*60),mm=String(Math.floor(t*11.4)%60).padStart(2,'0');oTxtPT('RESTED: '+Math.floor(t*.19)+'h '+mm+'m',370,800,30,'#ffb347');
 oTxtPT('ENERGY 20%',370,140,26,'#ff7a6a');rr(150,160,440,26,13,'rgba(255,255,255,.1)');rr(150,160,88,26,13,'#ff7a6a')};
SC.pt_r5=(t)=>{facade(t,{zoom:kf(t,[[0,2.1],[12,1.1],[20,.9]],'io'),fk:kf(t,[[0,0],[12,.9]],'io'),stand:[2,4],cols:9,rows:9,standProb:kf(t,[[4,0],[19,.45]],'lin')});
 rr(150,108,440,64,32,'rgba(4,8,14,.85)','#2a7a55',3);oTxtPT('OTHERS BEGUN: '+Math.floor(t*t*7.5),370,142,32,'#7be495');rr(870,108,300,64,32,'rgba(4,8,14,.85)','#8a3a30',3);oTxtPT('YOU: 0',1020,142,32,'#ff7a6a')};
SC.pt_r6=(t)=>{const lamp=kf(t,[[0,0],[5,0],[7,1]],'io');ptRoom(t,.2+.7*lamp,.45*(1-lamp));
 const s='The first sentence is the hardest.';const n=Math.max(0,Math.floor((t-9)*7));const typed=s.slice(0,Math.min(s.length,n));
 const words=typed.trim()?typed.trim().split(/\s+/).length:0;
 const second='Now there is a second one.';const n2=Math.max(0,Math.floor((t-15)*8));const typed2=second.slice(0,Math.min(second.length,n2));
 ptLaptop(720,790,1.3,t,PTAM,()=>ptDoc(t,words+(typed2.trim()?typed2.trim().split(/\s+/).length:0),PTAM,true,[typed,typed2]));
 // desk lamp
 c.save();c.translate(1130,800);c.strokeStyle='#1a1410';c.lineWidth=14;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(-40,-170);c.lineTo(-170,-250);c.stroke();c.fillStyle=`rgba(255,${200+30*lamp},${130+40*lamp},${.35+.65*lamp})`;c.beginPath();c.moveTo(-210,-250);c.lineTo(-130,-250);c.lineTo(-100,-215);c.lineTo(-240,-215);c.closePath();c.fill();c.restore();
 if(lamp>0){c.save();c.globalCompositeOperation='lighter';c.fillStyle=rg(990,560,10,520,[[0,`rgba(255,190,110,${.28*lamp})`],[1,'rgba(0,0,0,0)']]);c.fillRect(0,0,1440,1080);c.restore()}
 person(720,1060,{s:1.25,rim:.7,rimCol:PTAM});
 const left=Math.max(0,120-Math.max(0,t-9));oTxtPT(`${Math.floor(left/60)}:${String(Math.floor(left)%60).padStart(2,'0')}`,1180,170,60,'#ffb347',t>9?1:0);oTxtPT('TWO MINUTES',1180,225,26,'#9fb2d0',t>9?1:0)};
SC.pt_end1=(t)=>{facade(t,{zoom:kf(t,[[0,.95],[24,.5]],'io'),fk:1,stand:[6,8],warm:true,cols:17,rows:13,standProb:kf(t,[[8,0],[23,.5]],'lin')})};
const PTR=[['THE DEADLINE IS\nA LONG WAY OFF.',1],['FIRST, ORGANISE\nYOUR DESK.',3],['YOU WORK BEST\nUNDER PRESSURE.',20],['REST FIRST.\nYOU HAVE EARNED IT.',9],['THE OTHERS HAVE\nALREADY BEGUN.',15],['DO NOT START NOW.',14]];
const ptRule=(id,i,extra={})=>Object.assign({id,dur:20,fx:720,cards:[[2.2,19.6,PTR[i][0],'rule',i+1]],ref:PTR[i][1],dg:.45+i*.08,amb:.65+i*.05,snd:[[.2,'swell']]},extra);
const EP10=[
 {id:'adv',dur:8,fx:720,cards:[[.6,7.4,'THIS TAPE CONTAINS LOW LIGHT,\nTAPE NOISE AND SLOW FLICKER.\nNO RAPID FLASHING.','adv']],dg:.15,amb:0},
 {id:'pt_title',dur:10,fx:720,cards:[],dg:.35,amb:.15,snd:[[.4,'jingle']]},
 {id:'pt_intro',dur:26,fx:720,cards:[[2,8,'YOU HAVE SOMETHING TO DO.','plain'],[8.6,15.5,'IT HAS BEEN DUE FOR A WHILE.','plain'],[16,21.5,'IT CAN WAIT.','plain'],[22,25.6,'JUST A LITTLE LONGER.','plain']],dg:.35,amb:.5,snd:[[1,'thunk'],[4.2,'ping'],[10.2,'ping'],[16.2,'ping'],[22.2,'ping']]},
 ptRule('pt_r1',0,{snd:[[.2,'swell'],[3.2,'thunk'],[6.4,'thunk'],[9.6,'thunk'],[12.8,'thunk'],[14.2,'ping']]}),
 ptRule('pt_r2',1,{snd:[[.2,'swell']].concat([...Array(7)].map((_,i)=>[2.6*i+.4,'swipe']))}),
 ptRule('pt_r3',2),
 ptRule('pt_r4',3,{snd:[[.2,'swell']].concat([...Array(6)].map((_,i)=>[1+i*3,'swipe']))}),
 ptRule('pt_r5',4),
 ptRule('pt_r6',5,{amb:.55,snd:[[.2,'swell'],[6.2,'warm']]}),
 {id:'pt_end1',dur:24,fx:720,cards:[[2,10,'THIS BULLETIN ENDS\nWHEN YOU BEGIN.','plain'],[12.5,20,'YOU HAVE NOT BEGUN.','plain']],dg:.85,amb:.9,snd:[[.2,'swell'],[6,'warm']]},
 {id:'fin',dur:20,fx:720,cards:[],dg:1,amb:.9,snd:[[.6,'jingleBad'],[18.7,'tapestop']],spec:[2,18.5],specText:'ACTION'},
 {id:'pt_end',dur:12,fx:720,cards:[[1,8,'','plain']],dg:.5,amb:.2}
];
const ptSh=(id,off,dur,cards,extra={})=>[Object.assign({id,off,dur,fx:720,cards,dg:.6,amb:.75,snd:[[.1,'swell']]},extra)];
const B10S1=ptSh('pt_r1',0,20,[[.6,7,'THE DEADLINE IS\nA LONG WAY OFF.','short'],[14.2,16.2,'IT IS TOMORROW.','short'],[16.6,19.6,'FULL TAPE ON THE CHANNEL.','small']],{snd:[[.1,'swell'],[3.2,'thunk'],[6.4,'thunk'],[9.6,'thunk'],[12.8,'thunk'],[14.2,'ping']]});
const B10S2=ptSh('pt_r6',0,20,[[.6,8,'DO NOT START NOW.','short'],[12,17,'YOU MIGHT FINISH.','short'],[17.2,19.7,'FULL TAPE ON THE CHANNEL.','small']],{snd:[[.1,'swell'],[6.2,'warm']],amb:.55});
const B10S3=ptSh('pt_r3',0,20,[[.6,8,'YOU WORK BEST\nUNDER PRESSURE.','short'],[12,17,'TIME LEFT: 0.','short'],[17.2,19.7,'FULL TAPE ON THE CHANNEL.','small']]);
Object.assign(PROJ,{ep10:EP10,'b10-s1':B10S1,'b10-s2':B10S2,'b10-s3':B10S3});
PMETA.ep10={hires:true,tag:'BUREAU OF HOUSEHOLD ATTENTION  ·  BULLETIN 10',date:'JAN 14 2000',sub:'HOME SAFETY BULLETIN 10  —  "STARTING TOMORROW"',ghost:'action'};
PMETA['b10-s1']=PMETA['b10-s2']=PMETA['b10-s3']=PMETA.ep10;
