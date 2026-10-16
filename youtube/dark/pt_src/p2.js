// ---------- PT thumbnails (wide 1920x1080) ----------
function ptBig(s,x,y,size,col,al='left',glow=0){c.save();c.font=`900 ${size}px ${SANS}`;c.textAlign=al;c.textBaseline='middle';if(glow){c.shadowColor=col;c.shadowBlur=glow}c.fillStyle=col;c.fillText(s,x,y);c.restore()}
function ptBg(top='#0b141f',bot='#03060a'){c.fillStyle=lg(0,0,0,1080,[[0,top],[1,bot]]);c.fillRect(0,0,1920,1080)}
SC.pt_thA=(t)=>{ptBg();c.save();c.translate(560,40);c.scale(1,1);c.restore();
 ptLaptop(1450,860,1.3,t,'140,190,255',()=>ptDoc(t,0,'140,190,255',true,['']));
 person(1450,1230,{s:1.3,rim:.7});
 ptBig('NOT',90,330,230,'#ffffff','left',30);ptBig('TODAY.',90,560,230,'#ff5a4a','left',30);
 c.save();rr(90,760,470,90,45,'rgba(255,90,70,.15)','#ff5a4a',5);c.restore();ptBig('DUE 09:00',325,806,52,'#ff9a8a','center')};
SC.pt_thB=(t)=>{ptBg('#0a121c','#03060a');
 const cw=98,ch=92,ox=1170,oy=330;for(let i=0;i<35;i++){const x=ox+(i%7)*cw,y=oy+Math.floor(i/7)*ch;rr(x,y,cw-10,ch-10,12,'rgba(255,255,255,.07)',i===34?'#ff5a4a':null,i===34?7:0);ptBig(String(i+1),x+(cw-10)/2,y+(ch-10)/2,34,i===34?'#ff9a8a':'#6a7c9a','center')}
 c.save();c.strokeStyle='#ff5a4a';c.lineWidth=10;c.shadowColor='#ff5a4a';c.shadowBlur=24;c.beginPath();c.arc(ox+6*cw+(cw-10)/2,oy+4*ch+(ch-10)/2,58,0,PI*2);c.stroke();c.restore();
 ptBig('STARTING',90,430,150,'#ffffff','left',26);ptBig('TOMORROW.',90,600,150,'#ffb347','left',26);
 ptBig('(it is always tomorrow)',90,770,50,'#9fb2d0','left')};
SC.pt_thC=(t)=>{ptBg('#0a0a0e','#020203');
 c.save();c.globalCompositeOperation='lighter';c.fillStyle=rg(1300,540,10,900,[[0,'rgba(255,190,110,.34)'],[1,'rgba(0,0,0,0)']]);c.fillRect(0,0,1920,1080);c.restore();
 ptLaptop(1520,860,1.2,t,PTAM,()=>ptDoc(t,6,PTAM,true,['The first sentence']));
 ptBig('DO NOT',90,330,200,'#ffffff','left',26);ptBig('START NOW.',90,540,170,'#ffb347','left',30);ptBig('(you might finish)',90,730,52,'#c8a070','left')};
Object.assign(PROJ,{'ep10-th':[{id:'pt_thA',dur:10,fx:720,cards:[],dg:.18,amb:0,noOsd:true},{id:'pt_thB',dur:10,fx:720,cards:[],dg:.18,amb:0,noOsd:true},{id:'pt_thC',dur:10,fx:720,cards:[],dg:.18,amb:0,noOsd:true}]});
PMETA['ep10-th']={hires:true,wide:true,smooth:true,clean:true,tag:'',date:''};
