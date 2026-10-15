// ---------- CC vertical Short (cc-s1): central column x 690-1230, content above y 800 ----------
function kCard(u,y,n,title,stat,icon,col,t,h=210){oShow(u,(p)=>{c.save();c.translate(960,y+h/2);c.scale(p,p);c.translate(-270,-h/2);rr(0,0,540,h,22,'rgba(10,14,26,.85)',col,3);oTxt(n,40,40,36,col,'center',900,12);ccIcon(icon,110,h/2+8,.62,col,t);oFit(title,200,h/2-34,320,34,'#fff','left',900);ccWrap(stat,200,h/2+8,320,25,'#d8e2f4',31,'left',700,3);c.restore()})}
SC.a_k0=(t)=>{const L=ATM.k0.lines;ccBg(t,3);
 oShow(t-.1,(p)=>{oFit('THEY CALLED IT A',960,230,520,56,'#9fb2d0','center',900);oFit('"CONSPIRACY',960,330,520,92,'#fff','center',900,18,'#7fb2ff');oFit('THEORY"',960,430,520,92,'#fff','center',900,18,'#7fb2ff')});
 const sp=eo((t-1.5)/.4);if(sp>0){c.save();c.strokeStyle='#ff6a6a';c.lineWidth=10;c.shadowColor='#ff6a6a';c.shadowBlur=18;c.beginPath();c.moveTo(700,430);c.lineTo(700+520*sp,400-60*sp+60);c.stroke();c.restore()}
 oShow(t-2.3,(p)=>{c.save();c.translate(960,560);c.scale(p,p);oFit('THEN THE FILES',0,0,520,60,'#ffcb5b','center',900);oFit('CAME OUT',0,70,520,86,'#58e08a','center',900,22);c.restore()});
 oShow(t-(L[1]+.1),(p)=>{c.save();c.fillStyle='rgba(8,12,22,.9)';c.fillRect(0,0,1920,1080);c.restore();c.save();c.translate(960,440);c.scale(p,p);oTxt('5',0,-60,260,'#58e08a','center',900,40);oFit('TIMES IT WAS REAL',0,110,520,60,'#fff','center',900);c.restore()});
 ctVignette(.55)};
SC.a_k1=(t)=>{const L=ATM.k1.lines;ccBg(t,1);oTxt('CONFIRMED CASES',960,150,34,'#9fb2d0','center',900);
 kCard(t-(L[0]+.1),210,'1','TUSKEGEE','600 men left untreated for decades · apology 1997','syringe','#ff6a6a',t);
 kCard(t-(L[1]+.1),450,'2','NORTHWOODS','Generals proposed fake attacks to blame Cuba · declassified 1997','plane','#ffb454',t);
 ccStamp('CONFIRMED',960,740,'#58e08a',eo((t-(L[1]+2.5))/.3),-.1,40);ctVignette(.55)};
SC.a_k2=(t)=>{const L=ATM.k2.lines;ccBg(t,5);oTxt('KEEP GOING',960,120,34,'#9fb2d0','center',900);
 kCard(t-(L[0]+.1),160,'3','BIG TOBACCO','Court: a 50-year scheme to defraud the public','cig','#4fd1a5',t,190);
 kCard(t-(L[1]+.1),370,'4','DIESELGATE','Cars detected tests and cheated them','exhaust','#4fd1a5',t,190);
 kCard(t-(L[2]+.1),580,'5','SUGAR','Harvard scientists paid to blame fat','cube','#4fd1a5',t,190);ctVignette(.55)};
SC.a_k3=(t)=>{ccBg(t,3);const p=eo(t/.6);c.save();c.globalAlpha*=p;oTxt('35',960,300,240,'#58e08a','center',900,40);oFit('DOCUMENTED CASES',960,430,520,56,'#fff','center',900);c.restore();
 ['DOCUMENTS','COURT RECORDS','NAMED INSIDERS'].forEach((q,i)=>oShow(t-(1.5+i*.9),(p)=>{c.save();c.translate(960,540+i*70);c.scale(p,p);oChip(q,0,0,26,'#7fb2ff');c.restore()}));
 oShow(t-5,(p)=>{c.save();c.translate(960,770);c.scale(p,p);oFit('FULL FILM ON THE CHANNEL',0,0,520,40,'#ffd48a','center',900);c.restore()});ctVignette(.55)};
