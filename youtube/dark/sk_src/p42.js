// ---------- y03 obsession ----------
function skTank(x,y,v,col,t,lab){c.save();c.translate(x,y);oTxt(lab||'WILLPOWER',0,-176,22,SKC.dim,'center',800);rr(-42,-150,84,300,22,'rgba(255,255,255,.07)',col,3);const h=Math.max(10,276*v);rr(-36,144-h,72,h,16,col);c.restore()}
SC.a_y03=(t)=>{const id='y03';skBg(t,SKC.amb,.22,'#14100a');skHud(id,t);const gy=800;skFloor(gy,0,1920);
  const T0=oT(id,1,'hook'),pull=eo((t-T0)/1.4);
  // the hook: glowing orb far right
  const ox=1380,oy=330+Math.sin(t*1.7)*12;oGlow(ox,oy,260,SKC.amb,.5+.2*Math.sin(t*3));c.save();c.shadowColor=SKC.amb;c.shadowBlur=40;c.fillStyle='#ffe0a8';c.beginPath();c.arc(ox,oy,46,0,PI*2);c.fill();c.restore();for(let i=0;i<3;i++)oRing(ox,oy,70+i*38+Math.sin(t*2+i)*8,3,SKC.amb,.5-.14*i);
  // Sam sits at desk, leaning toward the orb
  const lean=.12+.35*pull,Pn=skType(t,12);Pn.tl=lean;Pn.hd=.1+.2*pull;const sx=420,hipY=gy-62;skDesk(560,hipY-36,1.2,360);skLaptop(520,hipY-40,1.05,t,SKC.amb);
  const pts=skFig(sx,hipY,1.3,Pn,{face:pull>.3?'focus':'n',t,glow:12,gc:SKC.amb,gy});
  // the thread
  const a=pts.sh,b=[ox-40,oy+20];if(t>T0-.2){c.save();c.strokeStyle=SKC.amb;c.lineWidth=5;c.shadowColor=SKC.amb;c.shadowBlur=22;c.setLineDash([16,10]);c.lineDashOffset=-t*80;c.globalAlpha*=cl((t-T0+.2)/.5);c.beginPath();c.moveTo(a[0],a[1]);c.bezierCurveTo(a[0]+300,a[1]-260,b[0]-340,b[1]+120,b[0],b[1]);c.stroke();c.restore()}
  // thought bubbles
  [['shower','IN THE SHOWER',[800,250]],['dinner','AT DINNER',[900,520]],['dark','IN THE DARK',[760,640]]].forEach(([nd,lab,[x,y]],i)=>{oShow(t-oT(id,1,nd),(p)=>{c.save();c.translate(x+Math.sin(t*1.2+i)*10,y);c.scale(p,p);oChip(lab,0,0,26,SKC.amb);c.restore()})});
  // willpower tank stays full
  oShow(t-oT(id,2,'tank'),(p)=>{c.save();c.translate(1700,560);c.scale(p,p);skTank(0,0,1,SKC.grn,t,'WILLPOWER');oTxt('STAYS FULL',0,190,24,SKC.grn,'center',800);c.restore()});
  oShow(t-oT(id,2,'pulled'),(p)=>{c.save();c.translate(1400,700);c.scale(p,p);oTxt('NOT PUSHED.',0,-30,64,SKC.wht,'center',800,18);oTxt('PULLED.',0,40,90,SKC.amb,'center',800,30);c.restore()});
  oShow(t-oT(id,3,'stopping'),(p)=>{c.save();c.fillStyle='rgba(2,3,10,.62)';c.fillRect(0,0,1920,1080);c.translate(960,470);c.scale(p,p);oTxt('STOPPING IS',0,-70,110,SKC.wht,'center',800,26);oTxt('THE HARD PART',0,70,150,SKC.red,'center',800,40);c.restore()},.4)};
// ---------- y04 why it wins ----------
SC.a_y04=(t)=>{const id='y04';skBg(t,SKC.amb,.2,'#14100a');skHud(id,t);
  oShow(t-oT(id,0,'beats'),(p)=>{c.save();c.translate(960,235);c.scale(p,p);oTxt('WHY OBSESSION WINS',0,0,76,SKC.wht,'center',800,24,SKC.amb);c.restore()},.3);
  // 1 VOLUME
  oShow(t-oT(id,1,'volume'),(p)=>{c.save();c.translate(330,520);c.scale(p,p);oPanel(-250,-210,500,470,.7,hexa(SKC.amb,.45),26);oTxt('1 · VOLUME',0,-168,38,SKC.amb,'center',800);
    const u=eo((t-oT(id,1,'volume'))/1.6);rr(-150,200-60*u,100,Math.max(8,60*u),10,SKC.teal);rr(50,200-320*u*.85,100,Math.max(8,320*u*.85),10,SKC.red);oTxt('1 H',-100,225,26,SKC.teal,'center',800);oTxt('EVERY AWAKE HOUR',100,225,22,SKC.red,'center',800);oTxt('ILLUSTRATIVE',0,-128,18,SKC.dim,'center',700);c.restore()});
  // 2 DEPTH
  oShow(t-oT(id,2,'depth'),(p)=>{c.save();c.translate(960,520);c.scale(p,p);oPanel(-250,-210,500,470,.7,hexa(SKC.amb,.45),26);oTxt('2 · DEPTH',0,-168,38,SKC.amb,'center',800);
    const u=cl((t-oT(id,2,'depth'))/3.5),N=44;const pts=[];for(let i=0;i<N;i++)pts.push([Math.cos(i*2.4)*(30+rnd(i)*170)*.95,Math.sin(i*2.4)*(24+rnd(i+9)*130)+30]);
    const shown=Math.floor(N*u);c.strokeStyle=hexa(SKC.amb,.28);c.lineWidth=2;for(let i=1;i<shown;i++){for(let j=1;j<=3;j++){const k=(i*7+j*13)%i;c.beginPath();c.moveTo(pts[i][0],pts[i][1]);c.lineTo(pts[k][0],pts[k][1]);c.stroke()}}
    for(let i=0;i<shown;i++){c.fillStyle=i===0?'#fff':SKC.amb;c.beginPath();c.arc(pts[i][0],pts[i][1],i===0?9:5,0,PI*2);c.fill()}oTxt('PATTERNS ONLY YOU SEE',0,232,20,SKC.dim,'center',800);c.restore()});
  // 3 RESILIENCE
  oShow(t-oT(id,3,'resilience'),(p)=>{c.save();c.translate(1590,520);c.scale(p,p);oPanel(-250,-210,500,470,.7,hexa(SKC.amb,.45),26);oTxt('3 · RESILIENCE',0,-168,38,SKC.amb,'center',800);
    const u=eo((t-oT(id,3,'dyson'))/3);const n=Math.round(5127*u);for(let i=0;i<90;i++){const x=-210+(i%15)*30,y=-110+Math.floor(i/15)*22;c.fillStyle=i/90<u?hexa(SKC.amb,.85):'rgba(255,255,255,.1)';c.fillRect(x,y,22,14)}
    oTxt(n.toLocaleString('en-US'),0,70,86,SKC.wht,'center',800,18,SKC.amb);oTxt('PROTOTYPES · JAMES DYSON',0,132,22,SKC.dim,'center',800);oTxt('THEN: IT WORKED',0,190,26,SKC.grn,'center',800);c.restore()})};
// ---------- y05 curve ----------
SC.a_y05=(t)=>{const id='y05';skBg(t,SKC.amb,.18,'#14100a');skHud(id,t);
  const gx=140,gw=1180,gh=450,gyy=800;c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=3;c.beginPath();c.moveTo(gx,gyy-gh);c.lineTo(gx,gyy);c.lineTo(gx+gw,gyy);c.stroke();oTxt('SKILL',gx+6,gyy-gh-18,22,SKC.dim,'left',800);oTxt('TIME →',gx+gw,gyy+28,22,SKC.dim,'right',800);
  const T0=oT(id,1,'discipline'),u=cl((t-T0)/3),u2=cl((t-oT(id,1,'obsession'))/4);const fe=x=>(Math.exp(3.2*x)-1)/(Math.exp(3.2)-1);
  c.save();c.lineWidth=7;c.strokeStyle=SKC.teal;c.shadowColor=SKC.teal;c.shadowBlur=14;c.beginPath();c.moveTo(gx,gyy);c.lineTo(gx+gw*u,gyy-gh*.34*u);c.stroke();
  c.strokeStyle=SKC.red;c.shadowColor=SKC.red;c.shadowBlur=18;c.beginPath();for(let i=0;i<=60;i++){const x=i/60*u2;const px=gx+gw*x,py=gyy-gh*fe(x);i?c.lineTo(px,py):c.moveTo(px,py)}c.stroke();c.restore();
  oShow(t-T0,()=>{oTxt('DISCIPLINE: A LINE',gx+gw*.6,gyy-gh*.34*.6+54,26,SKC.teal,'center',800)});
  oShow(t-oT(id,1,'obsession'),()=>{oTxt('OBSESSION: COMPOUNDS',gx+gw*.5,gyy-gh*fe(.5)-70,26,SKC.red,'center',800)});
  // Sam at the red tip
  const tx=gx+gw*u2,ty=gyy-gh*fe(u2);if(u2>.02)skFig(tx,ty-92*.75,.75,skMix(STKP.stand,STKP.cheer,u2>.9?.8:0),{face:'mania',t,glow:12,gc:SKC.red});
  oShow(t-oT(id,2,'magic'),(p)=>{c.save();c.translate(1000,300);c.scale(p,p);oChip('ILLUSTRATIVE · NOT DATA',0,0,24,SKC.dim);c.restore()});
  oShow(t-oT(id,2,'genius'),(p)=>{c.save();c.translate(1130,360);c.scale(p,p);skBubble(0,0,300,84,'"A GENIUS."',40,SKC.amb);c.restore()});
  // the other column
  oShow(t-oT(id,3,'column'),(p)=>{c.save();c.translate(1620,560);c.scale(p,p);oPanel(-240,-200,480,420,.75,hexa(SKC.red,.6),26);oTxt('THE OTHER COLUMN',0,-160,34,SKC.red,'center',800,16);
    const k=(t-oT(id,3,'column'));[['SLEEP',0],['BODY',1],['PEOPLE',2],['SELF',3]].forEach(([n,i])=>{const v=1-.07*cl(k/3)-.02*i;oTxt(n,-190,-84+i*68,24,SKC.dim,'left',800);skBar(-70,-96+i*68,260,24,v,SKC.grn)});oTxt('QUIETLY FILLING UP',0,196,24,SKC.amb,'center',800);c.restore()})};
