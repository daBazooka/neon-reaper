// ---------- thumbnails (want) ----------
SC.a_wthA=(t)=>{c.fillStyle='#07090f';c.fillRect(0,0,1920,1080);oGlow(1500,230,640,SKC.amb,.5);
  for(let i=0;i<5;i++){const x=300+i*250,y=960-i*100;rr(x,y,250,60+i*100+10,0,i===4?'rgba(255,200,87,.22)':'rgba(255,255,255,.07)',i===4?SKC.amb:'rgba(255,255,255,.35)',3);oTxt(String(i+1),x+125,y+46,64,i===4?SKC.amb:'rgba(255,255,255,.75)','center',800,i===4?20:0)}
  skFig(300+3*250+125,960-3*100-92*1.2,1.2,skMix(skWalk(.25,1,.3),STKP.reach,.5),{face:'smile',glow:14,gc:SKC.teal,t:1});
  c.save();c.translate(1600,360);oGlow(0,0,300,SKC.amb,.6);c.shadowColor=SKC.amb;c.shadowBlur=60;c.fillStyle='#ffe3a0';c.beginPath();for(let i=0;i<10;i++){const r=i%2?46:112,a=-PI/2+i*PI/5;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();c.restore();
  oTxt('GET WHATEVER',700,150,140,'#fff','center',800,30,SKC.amb);oTxt('YOU WANT',560,300,170,SKC.amb,'center',800,40);oChip('5 STEPS · BACKED BY RESEARCH',640,450,34,SKC.teal)};
SC.a_wthB=(t)=>{c.fillStyle='#07090f';c.fillRect(0,0,1920,1080);oGlow(960,540,800,SKC.amb,.2);
  oTxt('I WANT',960,300,300,'#fff','center',800,0);
  c.save();c.fillStyle=SKC.amb;c.shadowColor=SKC.amb;c.shadowBlur=40;c.fillRect(420,560,1080,22);c.restore();
  c.fillStyle='#fff';c.fillRect(1180,460,10,200);
  oTxt('(and here is how to get it)',960,740,76,'rgba(244,246,255,.75)','center',700,0);oChip('5 STEPS · NO HYPE · REAL RESEARCH',960,900,40,SKC.teal)};
SC.a_wthC=(t)=>{c.fillStyle='#07090f';c.fillRect(0,0,1920,1080);oGlow(960,520,760,SKC.grn,.28);
  oTxt('YES',960,380,560,SKC.grn,'center',800,90);oTxt('IS MORE LIKELY',960,700,120,'#fff','center',800,24);oTxt('THAN YOU THINK',960,830,120,SKC.amb,'center',800,30)};
Object.assign(PROJ,{'want-th':[sg7('a_wthA',10,[],{noOsd:true,xf:0}),sg7('a_wthB',10,[],{noOsd:true}),sg7('a_wthC',10,[],{noOsd:true})]});
PMETA['want-th']={hires:true,wide:true,smooth:true,clean:true,cine:true,tag:'',date:''};
