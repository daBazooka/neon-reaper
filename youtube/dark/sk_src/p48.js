// ---------- clean thumbnails D (leash) and E (receipt) ----------
function skFlame(x,y,s,t){c.save();c.translate(x,y);c.scale(s,s);oGlow(0,-120,420,SKC.amb,.55);
  const layers=[['#ff3d57',1,.0],['#ff8a3d',.78,.3],['#ffd06b',.55,.6],['#fff3d0',.32,.9]];
  layers.forEach(([col,k,ph])=>{c.fillStyle=col;c.shadowColor=col;c.shadowBlur=30*k;const w=Math.sin(t*3+ph)*10*k;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-170*k,-40*k,-140*k+w,-230*k,w,-380*k);c.bezierCurveTo(30*k+w,-250*k,170*k,-200*k,160*k,-60*k);c.bezierCurveTo(150*k,-10*k,60*k,0,0,0);c.fill()});c.restore()}
SC.a_cthD=(t)=>{c.fillStyle='#07060c';c.fillRect(0,0,1920,1080);
  skFlame(520,860,2.3,t);
  // leash: taut thin line from flame to Sam
  const sx=1500,sy=860;c.save();c.strokeStyle='#fff';c.lineWidth=5;c.shadowColor='#fff';c.shadowBlur=10;c.beginPath();c.moveTo(760,700);c.quadraticCurveTo(1120,720,sx-60,sy-330);c.stroke();c.restore();
  skFig(sx,sy-92*1.5,1.5,{tl:-.35,hd:-.1,la:[2.3,.1],ra:[-.6,.2],ll:[-.7,-.5],rl:[.5,-.9]},{dir:-1,face:'shock',glow:12,gc:'#fff',t:1});
  oTxt('WHO IS HOLDING',1380,180,104,'#fff','center',800,0);oTxt('WHOM?',1380,320,210,SKC.amb,'center',800,50)};
SC.a_cthE=(t)=>{c.fillStyle='#07060c';c.fillRect(0,0,1920,1080);oGlow(1500,300,700,SKC.red,.2);
  c.save();c.translate(560,540);c.rotate(-.035);c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=50;c.shadowOffsetY=20;c.fillStyle='#f4efe3';c.beginPath();c.moveTo(-380,-470);c.lineTo(380,-470);c.lineTo(380,430);for(let i=0;i<=19;i++)c.lineTo(380-i*40,430+(i%2?-22:22));c.lineTo(-380,430);c.closePath();c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
  const F=(s,x,y,sz,col,al='left',w=800)=>{c.font=`${w} ${sz}px "Courier New",monospace`;c.textAlign=al;c.textBaseline='middle';c.fillStyle=col;c.fillText(s,x,y)};
  F('THE BILL',0,-390,72,'#14121a','center',900);F('- - - - - - - - - - - - -',0,-330,40,'#8a8578','center');
  [['SLEEP',-230],['BODY',-110],['PEOPLE',10],['SELF',130]].forEach(([n,y])=>{F(n,-330,y+10,60,'#14121a');F('. . . . .',20,y+10,52,'#8a8578','center');F('OWED',340,y+10,60,'#d81f3c','right',900)});
  F('- - - - - - - - - - - - -',0,230,40,'#8a8578','center');F('TOTAL',-320,320,70,'#14121a','left',900);F('EVERYTHING',330,320,70,'#d81f3c','right',900);c.restore();
  oTxt('OBSESSION',1370,330,130,'#fff','center',800,0);oTxt('SENDS',1370,470,130,'#fff','center',800,0);oTxt('A BILL.',1370,640,190,SKC.red,'center',800,50)};
Object.assign(PROJ,{'cost-th2':[sg7('a_cthD',10,[],{noOsd:true,xf:0}),sg7('a_cthE',10,[],{noOsd:true})]});
PMETA['cost-th2']={hires:true,wide:true,smooth:true,clean:true,cine:true,tag:'',date:''};
