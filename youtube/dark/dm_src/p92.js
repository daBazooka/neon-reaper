// ---------- DM vertical Short (dm-s1): column x 690-1230, content above y 800 ----------
SC.a_e0=(t)=>{const L=ATM.e0.lines;dmBg(t);dmPhone(960,470,.78,t,300+t*120);
 oShow(t-.2,(p)=>{c.save();c.translate(960,170);c.scale(p,p);oFit('7 YEARS',0,0,520,120,'#ff5a6a','center',900,26);c.restore()});
 oShow(t-.5,()=>oFit('OF YOUR WAKING LIFE',960,250,520,34,'#e8ecf8','center',800));
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(960,780);c.scale(p,p);oChip('HERE IS THE MATH',0,0,28,'#4fd8ff');c.restore()});ctVignette(.55)};
SC.a_e1=(t)=>{const L=ATM.e1.lines;dmBg(t,'#4fd8ff');
 oShow(t-.2,(p)=>{c.save();c.translate(960,200);c.scale(p,p);oFit('2h 21m',0,0,520,130,'#4fd8ff','center',900,26);oTxt('PER DAY · GLOBAL AVERAGE',0,80,24,'#9aa4c0','center',800);c.restore()});
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(960,400);c.scale(p,p);oTxt('× 365 × 50 YEARS',0,0,40,'#e8ecf8','center',900);c.restore()});
 const days=Math.floor(1787*eo((t-(L[1]+.6))/2.5));oShow(t-(L[1]+.4),(p)=>{c.save();c.translate(960,560);c.scale(p,p);oFit(days.toLocaleString(),0,0,520,150,'#fff','center',900,26,'#ff4fa3');oTxt('DAYS',0,100,56,'#ff4fa3','center',900);c.restore()});
 oShow(t-(L[1]+3.2),()=>oFit('≈ 4.9 yrs nonstop · 7.3 yrs awake',960,740,520,28,'#ffd166','center',800));ctVignette(.55)};
SC.a_e2=(t)=>{const L=ATM.e2.lines;dmBg(t,'#ff5a6a');
 const R=[['A BOOK','has chapters','#e8ecf8'],['A SHOW','has an ending','#e8ecf8'],['A FEED','has neither','#ff5a6a']];
 R.forEach((q,i)=>oShow(t-(L[0]+1.6+i*1.1),(p)=>{c.save();c.translate(960,250+i*150);c.scale(p,p);oPanel(-270,-60,540,120,.8,i===2?'rgba(255,90,106,.8)':'rgba(255,255,255,.25)',20);oTxt(q[0],0,-18,38,q[2],'center',900);oTxt(q[1],0,28,30,'#9aa4c0','center',700);c.restore()}));
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(960,720);c.scale(p,p);oFit('BE THE END.',0,0,520,90,'#58e08a','center',900,22);c.restore()});ctVignette(.55)};
SC.a_e3=(t)=>{const L=ATM.e3.lines;dmBg(t,'#58e08a');
 ['DECIDE BEFORE YOU OPEN','GIVE IT AN ENDING','REPLACE, DON\'T REMOVE'].forEach((q,i)=>oShow(t-(L[0]+1+i*1.6),(p)=>{c.save();c.translate(960,250+i*140);c.scale(p,p);oPanel(-270,-55,540,110,.8,'rgba(88,224,138,.6)',20);oTxt(String(i+1),-225,0,56,'#58e08a','center',900);oFit(q,30,0,400,30,'#fff','center',900);c.restore()}));
 oShow(t-(L[1]+.1),(p)=>{c.save();c.translate(960,740);c.scale(p,p);oFit('FULL FILM ON THE CHANNEL',0,0,520,36,'#ffd48a','center',900);c.restore()});ctVignette(.55)};
