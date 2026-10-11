// ---------- COST OF OBSESSION: stickman rig, props, ledger HUD ----------
const SKC={teal:'#2fe0c8',amb:'#ffb347',red:'#ff3d57',vio:'#9b7bff',blu:'#4aa8ff',grn:'#58e08a',wht:'#f4f6ff',dim:'rgba(244,246,255,.55)',ink:'#0b0d18'};
const STKP={
 stand:{tl:0,hd:0,la:[.12,.2],ra:[-.12,.2],ll:[.05,0],rl:[-.05,0]},
 slump:{tl:.24,hd:.3,la:[.06,.1],ra:[.0,.12],ll:[.1,-.1],rl:[-.05,-.05]},
 sit:{tl:.06,hd:0,la:[.55,.55],ra:[.45,.6],ll:[1.5,-1.5],rl:[1.56,-1.5]},
 cheer:{tl:-.05,hd:-.1,la:[2.6,.3],ra:[2.3,.4],ll:[.15,0],rl:[-.15,0]},
 point:{tl:.05,hd:0,la:[1.5,0],ra:[-.15,.2],ll:[.1,0],rl:[-.1,0]},
 shrug:{tl:0,hd:.05,la:[.7,1.2],ra:[-.7,-1.2],ll:[.05,0],rl:[-.05,0]},
 hands:{tl:.3,hd:.35,la:[.2,2.4],ra:[.1,2.4],ll:[.1,-.1],rl:[-.05,0]},
 reach:{tl:.28,hd:.1,la:[1.8,.1],ra:[1.5,.1],ll:[.4,-.3],rl:[-.4,0]}
};
function skMix(A,B,u){const m=(a,b)=>a+(b-a)*u,mm=(x,y)=>[m(x[0],y[0]),m(x[1],y[1])];return{tl:m(A.tl,B.tl),hd:m(A.hd,B.hd),la:mm(A.la,B.la),ra:mm(A.ra,B.ra),ll:mm(A.ll,B.ll),rl:mm(A.rl,B.rl)}}
function skWalk(t,sp=1.8,amp=.55){const ph=t*sp*PI*2,sn=Math.sin(ph),cs=Math.cos(ph);return{tl:.05,hd:0,la:[sn*amp*.8,.3],ra:[-sn*amp*.8,.3],ll:[sn*amp,-Math.max(0,cs)*.8],rl:[-sn*amp,-Math.max(0,-cs)*.8]}}
function skRun(t,sp=2.7,amp=.95){const ph=t*sp*PI*2,sn=Math.sin(ph),cs=Math.cos(ph);return{tl:.3,hd:-.1,la:[sn*amp*.9,1.5],ra:[-sn*amp*.9,1.5],ll:[sn*amp,-Math.max(0,cs)*1.5-.2],rl:[-sn*amp,-Math.max(0,-cs)*1.5-.2]}}
function skType(t,sp=9){const a=Math.sin(t*sp)*.09,b=Math.sin(t*sp+1.9)*.09;return{tl:.12,hd:.1,la:[.75+a,.85],ra:[.7+b,.85],ll:[1.5,-1.5],rl:[1.56,-1.5]}}
function skSwim(t,sp=1.1){const ph=t*sp*PI*2;return{tl:1.42,hd:-.5,la:[ph,0],ra:[ph+PI,0],ll:[.1+Math.sin(ph*3)*.18,-.1],rl:[.05-Math.sin(ph*3)*.18,-.1]}}
function skPts(x,y,s,P,dir){const T=78*s,U=40*s,F=38*s,Th=46*s,Sh=46*s,N=11*s,H=24*s;
  const V=(a,l)=>[Math.sin(a)*l*dir,Math.cos(a)*l];
  const hip=[x,y],sh=[x+Math.sin(P.tl)*T*dir,y-Math.cos(P.tl)*T];
  const hd=[sh[0]+Math.sin(P.tl+P.hd)*(N+H)*dir,sh[1]-Math.cos(P.tl+P.hd)*(N+H)];
  const arm=(A)=>{const v=V(A[0],U),e=[sh[0]+v[0],sh[1]+v[1]],w=V(A[0]+A[1],F);return[e,[e[0]+w[0],e[1]+w[1]]]};
  const leg=(A)=>{const v=V(A[0],Th),k=[hip[0]+v[0],hip[1]+v[1]],w=V(A[0]+A[1],Sh);return[k,[k[0]+w[0],k[1]+w[1]]]};
  return{hip,sh,hd,H,la:arm(P.la),ra:arm(P.ra),ll:leg(P.ll),rl:leg(P.rl),dir,s}}
function skFace(hx,hy,H,dir,f,t,s){const ox=hx+dir*H*.22,ey=hy-H*.12,d=H*.42;c.save();c.lineCap='round';c.lineWidth=Math.max(2,2.6*s);c.strokeStyle=SKC.wht;c.fillStyle=SKC.wht;
  const blink=(mod(t,4.3)<.12)&&f!=='mania'&&f!=='shock';
  const eye=(x,y)=>{if(blink||f==='tired'){c.beginPath();c.moveTo(x-H*.16,y+(f==='tired'?H*.04:0));c.lineTo(x+H*.16,y+(f==='tired'?H*.04:0));c.stroke()}else if(f==='mania'||f==='shock'){c.beginPath();c.arc(x,y,H*.2,0,PI*2);c.stroke();c.beginPath();c.arc(x+dir*H*.04,y,H*.075,0,PI*2);c.fill()}else{c.beginPath();c.arc(x,y,H*.1,0,PI*2);c.fill()}};
  eye(ox-d*.5,ey);eye(ox+d*.5,ey);const my=hy+H*.34;
  if(f==='smile'){c.beginPath();c.arc(ox,hy+H*.12,H*.34,.25,PI-.25);c.stroke()}
  else if(f==='sad'){c.beginPath();c.arc(ox,hy+H*.7,H*.3,PI+.4,PI*2-.4);c.stroke();c.beginPath();c.moveTo(ox-d*.9,ey-H*.22);c.lineTo(ox-d*.2,ey-H*.34);c.moveTo(ox+d*.9,ey-H*.22);c.lineTo(ox+d*.2,ey-H*.34);c.stroke()}
  else if(f==='tired'){c.globalAlpha*=.55;c.beginPath();c.arc(ox-d*.5,ey+H*.2,H*.14,.2,PI-.2);c.arc(ox+d*.5,ey+H*.2,H*.14,.2,PI-.2);c.stroke();c.globalAlpha=1;c.beginPath();c.moveTo(ox-H*.22,my);c.quadraticCurveTo(ox,my+H*.12,ox+H*.22,my-H*.02);c.stroke()}
  else if(f==='mania'){c.beginPath();c.arc(ox,hy+H*.1,H*.42,.1,PI-.1);c.closePath();c.fill();c.fillStyle=SKC.blu;for(let i=0;i<2;i++){const u=mod(t*1.6+i*.5,1);c.globalAlpha=1-u;c.beginPath();c.arc(hx-dir*H*(1+i*.18),hy-H*.5+u*H*1.4,H*.12,0,PI*2);c.fill()}c.globalAlpha=1}
  else if(f==='shock'){c.beginPath();c.arc(ox,my+H*.1,H*.16,0,PI*2);c.stroke()}
  else if(f==='focus'){c.beginPath();c.moveTo(ox-d*.9,ey-H*.3);c.lineTo(ox-d*.1,ey-H*.18);c.moveTo(ox+d*.9,ey-H*.3);c.lineTo(ox+d*.1,ey-H*.18);c.stroke();c.beginPath();c.moveTo(ox-H*.18,my);c.lineTo(ox+H*.18,my);c.stroke()}
  else{c.beginPath();c.moveTo(ox-H*.18,my);c.lineTo(ox+H*.18,my);c.stroke()}
  c.restore()}
// draw a stick figure. (x,y)=hip. o:{dir,col,glow,gc,face,a,lw,t,gy(ground shadow y)}
function skFig(x,y,s,P,o={}){const dir=o.dir||1,col=o.col||SKC.wht,t=o.t||0,p=skPts(x,y,s,P,dir);c.save();c.globalAlpha*=o.a===undefined?1:o.a;
  if(o.gy!==undefined){c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(x,o.gy,60*s,9*s,0,0,PI*2);c.fill()}
  c.lineCap='round';c.lineJoin='round';c.lineWidth=o.lw||9*s;if(o.glow){c.shadowColor=o.gc||col;c.shadowBlur=o.glow}
  const ln=(...q)=>{c.beginPath();c.moveTo(q[0][0],q[0][1]);for(let i=1;i<q.length;i++)c.lineTo(q[i][0],q[i][1]);c.stroke()};
  c.strokeStyle=hexa(col,.62);ln(p.sh,p.ra[0],p.ra[1]);ln(p.hip,p.rl[0],p.rl[1]);c.beginPath();c.moveTo(p.rl[1][0],p.rl[1][1]);c.lineTo(p.rl[1][0]+dir*15*s,p.rl[1][1]);c.stroke();
  c.strokeStyle=col;ln(p.hip,p.sh);ln(p.hip,p.ll[0],p.ll[1]);c.beginPath();c.moveTo(p.ll[1][0],p.ll[1][1]);c.lineTo(p.ll[1][0]+dir*15*s,p.ll[1][1]);c.stroke();ln(p.sh,p.la[0],p.la[1]);
  c.beginPath();c.moveTo(p.sh[0],p.sh[1]);c.lineTo(p.sh[0]+(p.hd[0]-p.sh[0])*.45,p.sh[1]+(p.hd[1]-p.sh[1])*.45);c.stroke();
  c.fillStyle=SKC.ink;c.beginPath();c.arc(p.hd[0],p.hd[1],p.H,0,PI*2);c.fill();c.stroke();
  c.shadowBlur=0;skFace(p.hd[0],p.hd[1],p.H,dir,o.face||'n',t,s);c.restore();return p}
// ---- props ----
function skFloor(y,x0=0,x1=1920,col='rgba(255,255,255,.22)'){c.save();c.strokeStyle=col;c.lineWidth=3;c.beginPath();c.moveTo(x0,y);c.lineTo(x1,y);c.stroke();c.restore()}
function skDesk(x,y,s,w=300){c.save();c.translate(x,y);c.scale(s,s);rr(-w/2,-14,w,18,5,'#2a2f4a','rgba(255,255,255,.25)',2);c.fillStyle='#1c2036';c.fillRect(-w/2+14,4,12,92);c.fillRect(w/2-26,4,12,92);c.restore()}
function skLaptop(x,y,s,t,col=SKC.blu,dir=1){c.save();c.translate(x,y);c.scale(s*dir,s);oGlow(0,-60,150,col,.35);rr(-55,-6,110,8,3,'#3a4060');c.beginPath();c.moveTo(-50,-4);c.lineTo(-38,-100);c.lineTo(48,-100);c.lineTo(52,-4);c.closePath();c.fillStyle='#0f1424';c.fill();c.strokeStyle=hexa(col,.8);c.lineWidth=3;c.stroke();for(let i=0;i<6;i++){const w=20+rnd(i*3+Math.floor(t*2+i))*34;c.fillStyle=hexa(col,.7);c.fillRect(-30,-90+i*13,w,5)}c.restore()}
function skAlarm(x,y,s,t,ring,txt){c.save();c.translate(x,y);c.scale(s,s);if(ring)c.rotate(Math.sin(t*60)*.06);c.fillStyle='#16192c';c.strokeStyle=SKC.amb;c.lineWidth=7;c.beginPath();c.arc(0,0,70,0,PI*2);c.fill();c.stroke();c.fillStyle=SKC.amb;[-1,1].forEach(d=>{c.beginPath();c.arc(d*52,-62,22,PI,PI*2);c.fill()});if(txt)oTxt(txt,0,2,44,SKC.wht,'center',800);c.restore()}
function skBubble(x,y,w,h,txt,size,col=SKC.wht,tail=1){c.save();rr(x-w/2,y-h/2,w,h,22,'rgba(20,24,44,.92)',hexa(col,.6),3);c.fillStyle='rgba(20,24,44,.92)';c.beginPath();c.moveTo(x-20*tail,y+h/2-2);c.lineTo(x-42*tail,y+h/2+28);c.lineTo(x+4*tail,y+h/2-2);c.fill();c.restore();oTxt(txt,x,y,size,col,'center',800)}
function skBar(x,y,w,h,v,col,bg='rgba(255,255,255,.1)'){rr(x,y,w,h,h/2,bg);if(v>0)rr(x,y,Math.max(h,w*v),h,h/2,col)}
function skHeart(x,y,s,col,t){c.save();c.translate(x,y);const b=1+.12*Math.exp(-mod(t,.85)*6);c.scale(s*b,s*b);c.fillStyle=col;c.shadowColor=col;c.shadowBlur=22;c.beginPath();c.moveTo(0,32);c.bezierCurveTo(-60,-8,-30,-50,0,-20);c.bezierCurveTo(30,-50,60,-8,0,32);c.fill();c.restore()}
// ---- ledger HUD ----
const SKORDER=['y00','y01','y02','y03','y04','y05','y06','y07','y08','y09','y10','y11','y12','y13','y14','y15','y16','y17','y18','yend'];
const SKT={y00:[1,1,1,1],y01:[1,1,1,1],y02:[1,1,1,1],y03:[1,1,1,1],y04:[1,1,1,1],y05:[.94,.94,.94,.94],y06:[.34,.9,.9,.9],y07:[.34,.38,.9,.9],y08:[.32,.36,.22,.9],y09:[.3,.32,.2,.1],y10:[.3,.32,.2,.1],y11:[.26,.28,.16,.1],y12:[.26,.28,.16,.1],y13:[.26,.28,.16,.1],y14:[.26,.28,.16,.1],y15:[.3,.32,.2,.14],y16:[.92,.9,.9,.85],y17:[.92,.9,.9,.88],y18:[1,1,1,1],yend:[1,1,1,1]};
const SKACT={y00:['PROLOGUE',''],y01:['ACT 1','DISCIPLINE'],y02:['ACT 1','DISCIPLINE'],y03:['ACT 2','OBSESSION'],y04:['ACT 2','OBSESSION'],y05:['ACT 2','OBSESSION'],y06:['ACT 3','THE COST'],y07:['ACT 3','THE COST'],y08:['ACT 3','THE COST'],y09:['ACT 3','THE COST'],y10:['ACT 3','THE COST'],y11:['ACT 3','THE COST'],y12:['ACT 4','THE TRAP'],y13:['ACT 4','THE TRAP'],y14:['ACT 4','THE TRAP'],y15:['ACT 5','THE LEASH'],y16:['ACT 5','THE LEASH'],y17:['ACT 5','THE LEASH'],y18:['ACT 5','THE LEASH']};
function skHud(id,t,delay=.5){const i=SKORDER.indexOf(id),to=SKT[id]||[1,1,1,1],from=i>0?(SKT[SKORDER[i-1]]||to):to,k=eo((t-delay)/2.2);
  const a=SKACT[id];if(a&&a[1]){c.save();c.globalAlpha*=.95;oTxt(a[0],70,52,26,SKC.amb,'left',800,10);oTxt(a[1],70,86,34,SKC.wht,'left',800);c.restore()}
  if(id==='yend')return;c.save();oPanel(1396,26,500,150,.55,'rgba(255,255,255,.12)',20);oTxt('SAM · COST LEDGER',1646,50,20,SKC.dim,'center',800);
  ['SLEEP','BODY','PEOPLE','SELF'].forEach((n,j)=>{const v=from[j]+(to[j]-from[j])*k,x=1424+j*116;const col=v>.66?SKC.grn:v>.36?SKC.amb:SKC.red;rr(x,76,26,72,13,'rgba(255,255,255,.1)');const hh=Math.max(13,72*v);rr(x,76+72-hh,26,hh,13,col);
    oTxt(n,x+34,112,18,SKC.dim,'left',800);if(v<.36&&Math.sin(t*9+j)>0)oRing(x+13,112,26,3,SKC.red,.8)});c.restore()}
