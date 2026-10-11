// ---------- HOW TO GET WHATEVER YOU WANT: scenes (uses the stickman lib) ----------
const WSTEPS=['1 NAME IT','2 PLAN IT','3 ASK','4 REACH','5 ADJUST'];
const WSTEP={g02:0,g03:0,g04:1,g05:1,g06:2,g07:2,g08:3,g09:3,g10:4,g11:4,g12:9,g13:9};
function wBg(t,col=SKC.amb,ga=.22,a='#0a0e18',b='#02030a'){skBg(t,col,ga,a,b)}
function wHud(id,t,show=true){const s=WSTEP[id];c.save();oTxt('HOW TO GET WHATEVER YOU WANT',70,52,19,SKC.dim,'left',800);
  if(s!==undefined&&show){WSTEPS.forEach((n,i)=>{const x=560+i*200,act=(s===i),done=(s===9)||(s>i);c.save();c.translate(x,64);rr(-90,-24,180,48,24,act?SKC.amb:done?'rgba(47,224,200,.18)':'rgba(255,255,255,.06)',act?SKC.amb:done?SKC.teal:'rgba(255,255,255,.18)',2);oTxt((done&&!act?'✓ ':'')+n,0,1,20,act?'#10131e':done?SKC.teal:SKC.dim,'center',800);c.restore()})}c.restore()}
function wChip(t,u,x,y,s,size,col){oShow(u,(p)=>{c.save();c.translate(x,y);c.scale(p,p);oChip(s,0,0,size,col);c.restore()})}
function wCard(x,y,w,h,col,a=.78){oPanel(x,y,w,h,a,hexa(col,.55),26)}
function wGoalStar(x,y,t,s=1){c.save();c.translate(x,y);c.scale(s,s);oGlow(0,0,300,SKC.amb,.55+.1*Math.sin(t*3));c.shadowColor=SKC.amb;c.shadowBlur=40;c.fillStyle='#ffe3a0';c.beginPath();for(let i=0;i<10;i++){const r=i%2?32:78,a=-PI/2+i*PI/5;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();c.restore()}
// ---------- g00 hook ----------
SC.a_g00=(t)=>{const id='g00';wBg(t);wHud(id,t,false);const gy=800;skFloor(gy,0,1920);
  const Tn=oT(id,0,'never'),T3=oT(id,3,'system');
  wGoalStar(1640,360,t,1.1);oTxt('THE WANT',1640,470,28,SKC.amb,'center',800);
  // fog -> path
  const pathU=cl((t-T3)/4);for(let i=0;i<14;i++){const u=i/13;if(u<=pathU){const x=330+u*1220,y=gy-120-Math.sin(u*PI)*260*(1-u*.4);c.fillStyle=hexa(SKC.amb,.85);c.shadowColor=SKC.amb;c.shadowBlur=14;c.beginPath();c.arc(x,y,9,0,PI*2);c.fill();c.shadowBlur=0}}
  c.save();c.globalAlpha=.55*(1-cl((t-T3)/1.5));for(let i=0;i<9;i++){const x=480+i*140+Math.sin(t*.6+i)*30,y=600+Math.cos(t*.5+i*2)*70;c.fillStyle='rgba(180,195,230,.14)';c.beginPath();c.ellipse(x,y,150,70,0,0,PI*2);c.fill()}c.restore();
  skFig(330,gy-92*1.25,1.25,skMix(STKP.stand,STKP.reach,cl((t-T3)/1.2)*.6),{face:t<T3?'n':'smile',t,glow:12,gc:SKC.teal,gy});
  oShow(t-Tn,(p)=>{c.save();c.globalAlpha*=1-cl((t-oT(id,1,'capable')+.3)/.5);c.translate(960,300);c.scale(p,p);oTxt('MOST PEOPLE NEVER',0,-60,96,SKC.wht,'center',800,26,SKC.amb);oTxt('GET WHAT THEY WANT.',0,60,110,SKC.amb,'center',800,30);c.restore()},.4);
  const Tc=oT(id,1,'capable'),Tm=oT(id,1,'mistakes');
  oShow(t-Tc,(p)=>{c.save();c.globalAlpha*=1-cl((t-oT(id,2,'fix')+.3)/.5);c.translate(960,270);c.scale(p,p);oChip('NOT BECAUSE THEY ARE INCAPABLE',0,0,42,SKC.teal);c.restore()},.3);
  oShow(t-Tm,(p)=>{c.save();c.globalAlpha*=1-cl((t-oT(id,2,'fix')+.3)/.5);c.translate(960,420);c.scale(p,p);oTxt('3 MISTAKES',0,0,160,SKC.red,'center',800,40);c.restore()},.4);
  oShow(t-oT(id,2,'fix'),(p)=>{c.save();c.globalAlpha*=1-cl((t-T3+.2)/.5);c.translate(960,300);c.scale(p,p);oTxt('FAR MORE',0,-56,120,SKC.wht,'center',800,30,SKC.amb);oTxt('THAN YOU THINK.',0,64,110,SKC.amb,'center',800,30);c.restore()},.4);
  c.save();c.globalAlpha*=1-cl((t-T3+.2)/.4);wChip(t,t-oT(id,2,'luck'),700,520,'LUCK IS REAL',30,SKC.dim);wChip(t,t-oT(id,2,'limits'),1010,520,'LIMITS ARE REAL',30,SKC.dim);c.restore();
  oShow(t-T3,(p)=>{c.save();c.translate(960,250);c.scale(p,p);oTxt('A SYSTEM.',0,-30,110,SKC.wht,'center',800,26,SKC.amb);c.restore()},.4);
  WSTEPS.forEach((n,i)=>{oShow(t-(oT(id,3,'five')+i*.35),(p)=>{c.save();c.translate(560+i*200,420);c.scale(p,p);rr(-90,-26,180,52,26,'rgba(255,200,87,.16)',SKC.amb,2.5);oTxt(n,0,1,22,SKC.amb,'center',800);c.restore()})});
  wChip(t,t-oT(id,3,'ari'),960,610,'FOLLOW ARI: A NEW CAREER',34,SKC.teal)};
// ---------- g01 three mistakes ----------
SC.a_g01=(t)=>{const id='g01';wBg(t,SKC.red,.18,'#10090e');wHud(id,t,false);
  const T=[oT(id,0,'vague'),oT(id,1,'asks'),oT(id,2,'quits')];const X=[380,960,1540];const names=['VAGUE','SILENT','SCATTERED'];
  [0,1,2].forEach(i=>{oShow(t-(T[i]-.5),(p)=>{c.save();c.translate(X[i],480);c.scale(p,p);wCard(-250,-300,500,640,SKC.red);oTxt('MISTAKE '+(i+1),0,-250,26,SKC.red,'center',800);oTxt(names[i],0,-195,64,SKC.wht,'center',800,18);
    if(i===0){for(let k=0;k<7;k++){c.fillStyle='rgba(190,205,240,.13)';c.beginPath();c.ellipse(-120+k*40,-30+Math.sin(t+k)*30,90,50,0,0,PI*2);c.fill()}c.globalAlpha*=.6;oTxt('"a better job"',0,-30,44,SKC.wht,'center',700);c.globalAlpha=1;oTxt('= a mood',0,50,40,SKC.red,'center',800)}
    if(i===1){rr(-170,-120,340,130,16,'rgba(255,255,255,.07)',SKC.dim,2);oTxt('Hi — could I ask you',-150,-90,26,SKC.wht,'left',700);oTxt('something quickly…',-150,-55,26,SKC.wht,'left',700);if(Math.sin(t*5)>0){c.fillStyle=SKC.wht;c.fillRect(30,-70,3,28)}rr(60,-30,100,36,18,'rgba(255,255,255,.12)',SKC.dim,2);oTxt('SEND',110,-12,22,SKC.dim,'center',800);oTxt('never pressed',0,60,38,SKC.red,'center',800)}
    if(i===2){for(let k=0;k<4;k++){const a=k*PI/2+t*.9;c.strokeStyle=SKC.amb;c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(Math.cos(a)*30,-40+Math.sin(a)*30);c.lineTo(Math.cos(a)*110,-40+Math.sin(a)*110);c.stroke()}oTxt('MONTH 1 · 2 · 3',0,100,34,SKC.dim,'center',800);oTxt('new direction each time',0,150,30,SKC.red,'center',800)}
    skFig(0,300-92*.62,.62,i===1?STKP.shrug:i===2?STKP.slump:STKP.stand,{face:i===2?'tired':'sad',t,col:SKC.wht,a:.9});c.restore()})});
  oShow(t-oT(id,3,'five'),(p)=>{c.save();c.fillStyle='rgba(2,3,10,.84)';c.fillRect(0,0,1920,1080);c.translate(960,430);c.scale(p,p);oTxt('VAGUE. SILENT. SCATTERED.',0,-110,70,SKC.red,'center',800,24);oTxt('5 STEPS FIX ALL THREE.',0,-10,86,SKC.wht,'center',800,26,SKC.amb);c.restore()},.4);
  oShow(t-oT(id,3,'step'),(p)=>{c.save();c.translate(960,640);c.scale(p,p);oChip('STEP 1:  NAME IT',0,0,56,SKC.amb);c.restore()})};
// ---------- g02 name it ----------
SC.a_g02=(t)=>{const id='g02';wBg(t,SKC.amb,.22);wHud(id,t);
  oShow(t-oT(id,0,'name'),(p)=>{c.save();c.translate(960,190);c.scale(p,p);oTxt('NAME IT, PRECISELY.',0,0,76,SKC.wht,'center',800,24,SKC.amb);c.restore()},.3);
  // left: vague note struck out
  const Ts=oT(id,2,'rewrites');oShow(t-oT(id,1,'vague')+1,(p)=>{c.save();c.translate(500,420);c.rotate(-.04);c.scale(p,p);rr(-290,-100,580,200,14,'#2b2f45','rgba(255,255,255,.2)',2);c.globalAlpha=.55;oTxt('"A BETTER JOB"',0,0,64,SKC.dim,'center',800);c.globalAlpha=1;const k=cl((t-Ts)/.5);c.strokeStyle=SKC.red;c.lineWidth=10;c.lineCap='round';c.beginPath();c.moveTo(-260,-10);c.lineTo(-260+520*k,10);c.stroke();c.restore()});
  oShow(t-oT(id,1,'decades'),(p)=>{c.save();c.translate(500,620);c.scale(p,p);oChip('LOCKE & LATHAM · 35 YEARS OF GOAL RESEARCH',0,0,24,SKC.vio);oTxt('SPECIFIC + DIFFICULT  >  "DO YOUR BEST"',0,62,30,SKC.wht,'center',800);oTxt('(with commitment and feedback)',0,100,22,SKC.dim,'center',700);c.restore()});
  // right: sharp goal card
  oShow(t-Ts,(p)=>{c.save();c.translate(1330,510);c.scale(p,p);wCard(-430,-250,860,500,SKC.amb);oTxt('ARI\'S GOAL',-380,-210,24,SKC.amb,'left',800);oTxt('A written offer',-380,-150,52,SKC.wht,'left',800);oTxt('from a design studio of 10–50 people',-380,-96,34,SKC.wht,'left',700);oTxt('by 1 March',-380,-46,52,SKC.amb,'left',800);
    [['SPECIFIC','specific'],['MEASURABLE','measurable'],['DEADLINE','deadline'],['HARD, BUT POSSIBLE','hard']].forEach(([n,nd],i)=>{const u=t-oT(id,3,nd);if(u>0){c.save();c.globalAlpha=cl(u/.3);const y=40+i*52;c.strokeStyle=SKC.grn;c.lineWidth=6;c.lineCap='round';c.beginPath();c.moveTo(-380,y);c.lineTo(-366,y+14);c.lineTo(-340,y-12);c.stroke();oTxt(n,-310,y,32,SKC.wht,'left',800);c.restore()}});c.restore()},.3);
  oShow(t-oT(id,3,'beyond'),(p)=>{c.save();c.translate(1330,830);c.scale(p,p);oChip('BEYOND YOUR ABILITY → STOPS HELPING',0,0,26,SKC.red);c.restore()})};
// ---------- g03 test it ----------
SC.a_g03=(t)=>{const id='g03';wBg(t,SKC.vio,.2,'#0b0a1c');wHud(id,t);
  oShow(t-oT(id,0,'test'),(p)=>{c.save();c.translate(960,190);c.scale(p,p);oTxt('NOW TEST IT.',0,0,76,SKC.wht,'center',800,24,SKC.vio);c.restore()},.3);
  wChip(t,t-oT(id,1,'kasser'),520,290,'KASSER & RYAN 1993 · MONEY/STATUS-CENTRAL → LOWER WELL-BEING',20,SKC.vio);
  wChip(t,t-oT(id,1,'wilson'),1400,290,'WILSON & GILBERT · WE OVERESTIMATE HOW HAPPY OUTCOMES MAKE US',20,SKC.blu);
  // impact bias mini chart
  oShow(t-oT(id,1,'overestimate'),(p)=>{c.save();c.translate(1400,500);c.scale(p,p);oPanel(-300,-150,600,300,.7,hexa(SKC.blu,.4),22);c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=3;c.beginPath();c.moveTo(-250,100);c.lineTo(250,100);c.stroke();
    const f=cl((t-oT(id,1,'overestimate'))/2);c.lineWidth=6;c.strokeStyle=SKC.amb;c.setLineDash([12,8]);c.beginPath();for(let i=0;i<=40;i++){const x=i/40;const y=100-130*Math.exp(-Math.pow((x-.25)/.18,2))*(x<.25?1:Math.exp(-(x-.25)*2.2));i?c.lineTo(-250+500*x*f,y):c.moveTo(-250,100)}c.stroke();c.setLineDash([]);
    c.strokeStyle=SKC.grn;c.beginPath();for(let i=0;i<=40;i++){const x=i/40;const y=100-60*Math.exp(-Math.pow((x-.25)/.1,2))*(x<.25?1:Math.exp(-(x-.25)*8))-5;i?c.lineTo(-250+500*x*f,y):c.moveTo(-250,100)}c.stroke();oTxt('PREDICTED',-60,-70,20,SKC.amb,'left',800);oTxt('ACTUAL',-60,-30,20,SKC.grn,'left',800);oTxt('ILLUSTRATIVE',0,128,16,SKC.dim,'center',700);c.restore()});
  // two tests
  oShow(t-oT(id,2,'one'),(p)=>{c.save();c.translate(520,640);c.scale(p,p);wCard(-400,-130,800,230,SKC.vio);oTxt('TEST 1',-360,-90,22,SKC.vio,'left',800);oTxt('WOULD I STILL WANT IT',-360,-40,40,SKC.wht,'left',800);oTxt('IF NOBODY EVER KNEW?',-360,10,40,SKC.amb,'left',800);
    for(let i=0;i<5;i++){c.globalAlpha=.8*(1-cl((t-oT(id,2,'nobody')+.2+i*.1)/.6));skFig(210+i*38,48,.26,STKP.stand,{col:SKC.dim,t});c.globalAlpha=1}c.restore()});
  oShow(t-oT(id,2,'two'),(p)=>{c.save();c.translate(1400,780);c.scale(p,p);c.restore()});
  oShow(t-oT(id,2,'outcome'),(p)=>{c.save();c.translate(1400,750);c.scale(p,p);wCard(-400,-70,800,200,SKC.vio);oTxt('TEST 2',-360,-30,22,SKC.vio,'left',800);oTxt('THE OUTCOME — OR THE DAILY WORK?',-360,20,34,SKC.wht,'left',800);oTxt('A TROPHY  vs  A DAILY ROUTINE',-360,76,30,SKC.amb,'left',800);c.restore()});
  oShow(t-oT(id,3,'real'),(p)=>{c.save();c.fillStyle='rgba(2,3,10,.55)';c.fillRect(0,0,1920,1080);c.translate(960,470);c.scale(p,p);oTxt('BOTH YES = A REAL WANT.',0,-30,100,SKC.grn,'center',800,26);oTxt('KEEP GOING.',0,80,70,SKC.wht,'center',800,18);c.restore()},.4)};
