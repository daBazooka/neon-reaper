// ---------- thumbnails (women film) ----------
SC.a_mthA=(t)=>{c.fillStyle='#07080f';c.fillRect(0,0,1920,1080);oGlow(960,560,900,WMC.rose,.16);
  for(let r=0;r<8;r++)for(let k=0;k<20;k++){const x=135+k*86,y=345+r*72,gone=((r+k)%2===1);c.save();c.globalAlpha=gone?.16:1;c.fillStyle=gone?WMC.rose:'#e9eeff';c.shadowColor=gone?WMC.rose:'#e9eeff';c.shadowBlur=gone?0:16;c.beginPath();c.arc(x,y,22,0,PI*2);c.fill();c.restore()}
  oTxt('IF ALL WOMEN',960,120,170,'#fff','center',800,30,WMC.rose);oTxt('DISAPPEARED',960,255,120,WMC.rose,'center',800,28);oChip('WHAT WOULD ACTUALLY HAPPEN?',960,965,48,WMC.amb)};
SC.a_mthB=(t)=>{c.fillStyle='#07080f';c.fillRect(0,0,1920,1080);oGlow(1300,560,700,WMC.amb,.25);
  c.save();c.translate(1250,700);rr(-340,-30,680,20,6,'#2a2f4a');c.fillStyle='#1c2036';c.fillRect(-300,-10,14,200);c.fillRect(288,-10,14,200);
  [-130,130].forEach((x,i)=>{rr(x-44,-130,88,80,12,'#3a4060');c.strokeStyle='#3a4060';c.lineWidth=10;c.beginPath();c.arc(x+54,-92,20,-PI/2,PI/2);c.stroke();if(i===0){c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=6;for(let k=0;k<3;k++){c.beginPath();c.moveTo(x-18+k*18,-140);c.quadraticCurveTo(x-8+k*18,-170,x-18+k*18,-200);c.stroke()}}});
  c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=8;c.setLineDash([10,10]);c.beginPath();c.moveTo(210,0);c.lineTo(210,190);c.lineTo(320,190);c.moveTo(210,100);c.lineTo(320,100);c.stroke();c.setLineDash([]);c.restore();
  oTxt('7:42 AM.',470,230,190,WMC.amb,'center',800,40);oTxt('EVERY WOMAN',470,420,120,'#fff','center',800,24);oTxt('GONE.',470,560,200,WMC.rose,'center',800,40)};
SC.a_mthC=(t)=>{c.fillStyle='#07080f';c.fillRect(0,0,1920,1080);oGlow(960,540,800,WMC.red,.2);
  oTxt('8.09 B',500,300,260,'#fff','center',800,0);oTxt('→',960,300,200,'rgba(255,255,255,.45)','center',800,0);oTxt('4.07 B',1420,300,260,WMC.rose,'center',800,30);
  oTxt('→ 0',960,640,420,WMC.red,'center',800,60);oTxt('IN ABOUT A CENTURY',960,900,100,'#fff','center',800,24)};
Object.assign(PROJ,{'women-th':[sg7('a_mthA',10,[],{noOsd:true,xf:0}),sg7('a_mthB',10,[],{noOsd:true}),sg7('a_mthC',10,[],{noOsd:true})]});
PMETA['women-th']={hires:true,wide:true,smooth:true,clean:true,cine:true,tag:'',date:''};
