// ---------- g04 plan it: fantasy vs contrast, WOOP ----------
function wBattery(x,y,v,col,lab,t){c.save();c.translate(x,y);rr(-70,-34,140,68,14,'rgba(255,255,255,.07)',col,4);rr(70,-14,14,28,5,col);rr(-62,-26,Math.max(10,124*v),52,10,col);oTxt(lab,0,62,24,SKC.dim,'center',800);c.restore()}
SC.a_g04=(t)=>{const id='g04';wBg(t,SKC.vio,.2,'#0b0a1c');wHud(id,t);
  oShow(t-oT(id,0,'plan'),(p)=>{c.save();c.globalAlpha*=1-cl((t-oT(id,2,'mental')+.2)/.5);c.translate(960,190);c.scale(p,p);oTxt('PLAN IT — AND AVOID THE TRAP',0,0,64,SKC.wht,'center',800,22,SKC.vio);c.restore()},.3);
  const Tf=oT(id,1,'daydreaming'),Tk=oT(id,1,'kappes'),Tm=oT(id,2,'mental');
  oShow(t-Tf,(p)=>{c.save();c.globalAlpha*=1-cl((t-Tm+.2)/.5);c.translate(0,0);
    // fantasy side
    c.save();c.translate(520,520);wCard(-340,-250,680,520,SKC.amb);oTxt('POSITIVE FANTASY',0,-200,38,SKC.amb,'center',800);skFig(-120,200-52*1.0,1.0,{...STKP.sit,tl:-.12,la:[.2,.6],ra:[.1,.6]},{face:'smile',t,col:SKC.wht,glow:8,gc:SKC.amb});
    oThought(140,-40,2.4,t,0);oTxt('OFFER!',140,-36,34,SKC.amb,'center',800);const e=1-.8*cl((t-Tk+1)/3);wBattery(0,140+0,e,SKC.amb,'ENERGY',t);c.restore();
    c.save();c.translate(1400,520);wCard(-340,-250,680,520,SKC.teal);oTxt('MENTAL CONTRASTING',0,-200,38,SKC.teal,'center',800);skFig(-150,200-92*.9,.9,skMix(STKP.stand,STKP.reach,.5),{face:'focus',t,col:SKC.wht,glow:8,gc:SKC.teal});
    c.fillStyle='#1b2038';c.beginPath();c.moveTo(-40,200);c.quadraticCurveTo(60,60,170,200);c.fill();oTxt('OBSTACLE',90,150,24,SKC.red,'center',800);oThought(140,-70,1.9,t,2);oTxt('OFFER!',140,-66,28,SKC.amb,'center',800);const e2=.3+.7*cl((t-Tk+1)/3);wBattery(0,150+0,e2,SKC.teal,'ENERGY',t);c.restore();c.restore()},.3);
  wChip(t,t-Tk,960,830,'OETTINGEN & KAPPES 2011 · 4 EXPERIMENTS · POSITIVE FANTASY SAPPED ENERGY',22,SKC.vio);
  // WOOP
  const L=[['W','WISH','A studio offer by 1 March','wish'],['O','OUTCOME','Proud, secure, learning','outcome'],['O','OBSTACLE','I avoid sending emails','obstacle'],['P','PLAN','If nervous → 5-min draft first','plan']];
  L.forEach(([ch,n,ex,nd],i)=>{oShow(t-oT(id,2,nd),(p)=>{c.save();c.translate(380+i*387,520);c.scale(p,p);wCard(-175,-210,350,420,[SKC.amb,SKC.grn,SKC.red,SKC.teal][i]);oTxt(ch,0,-120,170,[SKC.amb,SKC.grn,SKC.red,SKC.teal][i],'center',800,30);oTxt(n,0,-10,40,SKC.wht,'center',800);const ft=t-oT(id,3,['offer','pictures','obstacle','plan'][i]);if(ft>0){c.save();c.globalAlpha=cl(ft/.4);oFit(ex,0,90,320,28,SKC.wht,'center',700);c.restore()}c.restore()})});
  oShow(t-oT(id,3,'contrast'),(p)=>{c.save();c.translate(960,830);c.scale(p,p);oChip('THAT CONTRAST TURNS A DREAM INTO ENERGY',0,0,32,SKC.amb);c.restore()})};
// ---------- g05 if-then ----------
SC.a_g05=(t)=>{const id='g05';wBg(t,SKC.teal,.2,'#07121a');wHud(id,t);
  oShow(t-oT(id,0,'triggers'),(p)=>{c.save();c.translate(960,190);c.scale(p,p);oTxt('TURN THE PLAN INTO TRIGGERS.',0,0,70,SKC.wht,'center',800,22,SKC.teal);c.restore()},.3);
  wChip(t,t-oT(id,1,'ninety'),960,280,'GOLLWITZER & SHEERAN 2006 · 94 TESTS · MEDIUM-TO-LARGE EFFECT (d ≈ 0.65)',24,SKC.teal);
  const R=[['TUE · 7 PM','SEND 2 PORTFOLIO EMAILS','tuesday'],['I WANT TO SKIP','5 MINUTES FIRST','skip'],['I GET A "NO"','NEXT EMAIL WITHIN 1 HOUR','rejection']];
  R.forEach(([i1,t1,nd],i)=>{oShow(t-oT(id,2,nd),(p)=>{c.save();c.translate(960,420+i*150);c.scale(p,p);rr(-760,-58,560,116,22,'rgba(79,216,255,.12)',SKC.teal,3);oTxt('IF',-730,-30,22,SKC.teal,'left',800);oTxt(i1,-480,6,40,SKC.wht,'center',800);
    c.strokeStyle=SKC.amb;c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(-170,0);c.lineTo(-100,0);c.moveTo(-122,-20);c.lineTo(-100,0);c.lineTo(-122,20);c.stroke();rr(-70,-58,830,116,22,'rgba(255,200,87,.12)',SKC.amb,3);oTxt('THEN',-40,-30,22,SKC.amb,'left',800);oTxt(t1,350,6,40,SKC.wht,'center',800);c.restore()})});
  oShow(t-oT(id,3,'specific'),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oChip('SPECIFIC TRIGGER · SPECIFIC ACTION · NO WILLPOWER DEBATE',0,0,28,SKC.amb);c.restore()})};
// ---------- g06 ask: underestimate ----------
function wCrowd(x,y,lit,col,n=20){for(let i=0;i<n;i++){const cx=x+(i%5)*70,cy=y+Math.floor(i/5)*92,on=i<lit;c.save();c.globalAlpha=on?1:.35;skFig(cx,cy+18,.32,STKP.stand,{col:on?col:SKC.dim,t:0,lw:6*.32});c.restore()}}
SC.a_g06=(t)=>{const id='g06';wBg(t,SKC.grn,.2,'#07120d');wHud(id,t);
  oShow(t-oT(id,0,'ask'),(p)=>{c.save();c.translate(960,190);c.scale(p,p);oTxt('ASK. WHERE MOST PEOPLE STALL.',0,0,64,SKC.wht,'center',800,22,SKC.grn);c.restore()},.3);
  const Tp=oT(id,1,'predict'),Tr=oT(id,1,'underestimated');
  oShow(t-Tp,(p)=>{c.save();c.translate(560,500);c.scale(p,p);wCard(-300,-170,600,470,SKC.amb);oTxt('YOU PREDICT',0,-130,36,SKC.amb,'center',800);const k=Math.floor(5*cl((t-Tp)/1.2));wCrowd(-140,-70,k,SKC.amb);oTxt(k+' OF 20 SAY YES',0,262,30,SKC.wht,'center',800);c.restore()},.3);
  oShow(t-Tr,(p)=>{c.save();c.translate(1360,500);c.scale(p,p);wCard(-300,-170,600,470,SKC.grn);oTxt('REALITY',0,-130,36,SKC.grn,'center',800);const k=Math.floor(10*cl((t-Tr)/1.5));wCrowd(-140,-70,k,SKC.grn);oTxt('≈ TWICE AS MANY',0,262,30,SKC.wht,'center',800);oTxt('ILLUSTRATIVE',0,300,16,SKC.dim,'center',700);c.restore()},.3);
  wChip(t,t-oT(id,1,'flynn'),960,820,'FLYNN & BOHNS · THOUSANDS OF STRANGERS · UNDERESTIMATED BY ABOUT HALF',22,SKC.grn);
  oShow(t-oT(id,2,'awkward'),(p)=>{c.save();c.globalAlpha*=1-cl((t-oT(id,3,'cost')+.2)/.4);c.fillStyle='rgba(2,3,10,.6)';c.fillRect(0,0,1920,1080);c.translate(960,430);c.scale(p,p);skBubble(0,0,860,110,'FOR THEM, SAYING NO IS THE AWKWARD PART',40,SKC.grn);c.restore()});
  oShow(t-oT(id,3,'cost'),(p)=>{c.save();c.fillStyle='rgba(2,3,10,.82)';c.fillRect(0,0,1920,1080);c.translate(960,520);c.scale(p,p);oTxt('COST OF ASKING: LOWER.',0,-40,70,SKC.wht,'center',800,18);oTxt('REWARD: HIGHER.',0,50,86,SKC.amb,'center',800,28);c.restore()},.4)};
// ---------- g07 ask: how ----------
SC.a_g07=(t)=>{const id='g07';wBg(t,SKC.grn,.2,'#07120d');wHud(id,t);
  oShow(t-oT(id,0,'matters'),(p)=>{c.save();c.translate(960,190);c.scale(p,p);oTxt('HOW YOU ASK MATTERS.',0,0,70,SKC.wht,'center',800,22,SKC.grn);c.restore()},.3);
  oShow(t-oT(id,1,'specific'),(p)=>{c.save();c.translate(960,340);c.scale(p,p);wCard(-760,-90,1520,190,SKC.grn);oTxt('"Would you',-720,-30,44,SKC.wht,'left',700);
    oTxt('look at my portfolio',-390,-30,44,SKC.amb,'left',800);oTxt('and tell me',60,-30,44,SKC.wht,'left',700);oTxt('the one thing to fix',320,-30,44,SKC.amb,'left',800);oTxt('by Friday?"',-720,40,44,SKC.wht,'left',700);c.restore()},.3);
  [['SPECIFIC','specific',SKC.amb],['SMALL','small',SKC.grn],['NEXT STEP OBVIOUS','obvious',SKC.teal]].forEach(([n,nd,col],i)=>{wChip(t,t-oT(id,i+1,nd),420+i*540,530,n,34,col)});
  // the math
  oShow(t-oT(id,4,'math'),(p)=>{c.save();c.fillStyle='rgba(2,3,10,.82)';c.fillRect(0,0,1920,1080);c.translate(960,0);c.scale(p,1);c.restore()},.2);
  oShow(t-oT(id,4,'math'),(p)=>{c.save();c.translate(960,610);c.scale(p,p);const n=Math.min(10,Math.floor((t-oT(id,4,'math'))*1.6));
    for(let i=0;i<10;i++){const x=-540+i*120,hit=(i===6),open=i<n;rr(x-44,-90,88,150,10,open?(hit?'rgba(88,224,138,.3)':'rgba(255,255,255,.06)'):'rgba(255,255,255,.12)',open&&hit?SKC.grn:SKC.dim,3);oTxt(open?(hit?'YES':'no'):'?',x,-15,34,open&&hit?SKC.grn:SKC.dim,'center',800)}
    oTxt('30% PER ASK  →  10 ASKS  →',-180,140,36,SKC.wht,'center',800);oTxt('97%',210,140,92,SKC.grn,'center',800,24);oTxt('chance of at least one yes (independent asks)',0,205,24,SKC.dim,'center',700);c.restore()},.3);
  oShow(t-oT(id,4,'rejection'),(p)=>{c.save();c.translate(960,860);c.scale(p,p);oChip('REJECTION IS NOT FAILURE.  IT IS THE PRICE OF THE YES.',0,0,28,SKC.amb);c.restore()})};
// ---------- g08 reach: weak ties ----------
SC.a_g08=(t)=>{const id='g08';wBg(t,SKC.blu,.2,'#08101a');wHud(id,t);
  oShow(t-oT(id,0,'reach'),(p)=>{c.save();c.translate(960,190);c.scale(p,p);oTxt('REACH THE RIGHT PEOPLE.',0,0,66,SKC.wht,'center',800,22,SKC.blu);c.restore()},.3);
  const cx=560,cy=585;[[95,'CLOSE',SKC.dim],[195,'MODERATELY WEAK',SKC.amb],[290,'STRANGERS',SKC.dim]].forEach(([r,n,col],i)=>{c.save();c.strokeStyle=hexa(col==SKC.dim?'#c8d2f0':col,i===1?.9:.3);c.lineWidth=i===1?6:3;c.setLineDash(i===1?[]:[10,10]);c.beginPath();c.arc(cx,cy,r,0,PI*2);c.stroke();c.restore();oTxt(n,cx,cy-r-18+(i===0?10:0),i===1?26:20,col,'center',800)});
  skFig(cx,cy+34,.5,STKP.stand,{face:'smile',t,glow:10,gc:SKC.teal});
  const Tg=oT(id,1,'granovetter'),Tw=oT(id,2,'sweet');
  for(let i=0;i<14;i++){const a=i/14*PI*2+.3,r=i<3?95:i<9?195:290,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r,hi=(i>=3&&i<9);const on=hi&&t>Tw;c.save();c.fillStyle=on?SKC.amb:'rgba(200,210,240,.7)';c.shadowColor=on?SKC.amb:'transparent';c.shadowBlur=on?18:0;c.beginPath();c.arc(x,y,on?12:8,0,PI*2);c.fill();c.restore()}
  // opportunity pulse from outer star to Ari through weak tie
  oShow(t-Tg,()=>{const u=mod((t-Tg)*.35,1);const p1=[cx+Math.cos(.3+9/14*PI*2)*290,cy+Math.sin(.3+9/14*PI*2)*290],p2=[cx+Math.cos(.3+5/14*PI*2)*195,cy+Math.sin(.3+5/14*PI*2)*195],p3=[cx,cy];const pt=u<.5?[p1[0]+(p2[0]-p1[0])*u*2,p1[1]+(p2[1]-p1[1])*u*2]:[p2[0]+(p3[0]-p2[0])*(u-.5)*2,p2[1]+(p3[1]-p2[1])*(u-.5)*2];c.strokeStyle=hexa(SKC.amb,.3);c.lineWidth=3;c.beginPath();c.moveTo(p1[0],p1[1]);c.lineTo(p2[0],p2[1]);c.lineTo(p3[0],p3[1]);c.stroke();oGlow(pt[0],pt[1],40,SKC.amb,.9)});
  wChip(t,t-Tg,1380,300,'GRANOVETTER 1973 · ACQUAINTANCES BRIDGE NEW OPPORTUNITIES',20,SKC.blu);
  wChip(t,t-oT(id,2,'science'),1380,370,'RAJKUMAR ET AL. 2022 · SCIENCE · 20M+ LINKEDIN USERS',20,SKC.vio);
  oShow(t-Tw,(p)=>{c.save();c.translate(1380,500);c.scale(p,p);oTxt('SWEET SPOT:',0,-40,52,SKC.wht,'center',800,18);oTxt('MODERATELY WEAK TIES',0,24,50,SKC.amb,'center',800,24);oTxt('people you barely know',0,76,28,SKC.dim,'center',700);c.restore()});
  oShow(t-oT(id,3,'lists'),(p)=>{c.save();c.translate(1380,690);c.scale(p,p);wCard(-300,-70,600,230,SKC.amb);oTxt('ARI\'S LIST: 30 PEOPLE',0,-34,34,SKC.amb,'center',800);['former classmate','friend of a friend','designer from a talk'].forEach((n,i)=>oTxt('• '+n,-240,22+i*34,26,SKC.wht,'left',700));c.restore()})};
