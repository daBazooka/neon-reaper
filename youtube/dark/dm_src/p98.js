/* DM-SHORT-TIMING */
ATM.e0={start:0.0,dur:7.1,lines:[0.5, 4.853],len:[4, 4]};
OTX.e0=[[]];
ATM.e1={start:7.1,dur:10.447,lines:[0.5, 4.739],len:[4, 4]};
OTX.e1=[[]];
ATM.e2={start:17.546,dur:9.045,lines:[0.5, 6.051],len:[4, 4]};
OTX.e2=[[]];
ATM.e3={start:26.591,dur:9.836,lines:[0.5, 6.707],len:[4, 4]};
OTX.e3=[[]];
const EPDMS=[
 sg7('a_e0',7.1,[],{noOsd:true,xd:.35,xfk:'zoom',fl:3,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']],xf:0}),
 sg7('a_e1',10.447,[],{noOsd:true,xd:.35,xfk:'slide',fl:4,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]}),
 sg7('a_e2',9.045,[],{noOsd:true,xd:.35,xfk:'zoom',fl:3,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]}),
 sg7('a_e3',9.836,[],{noOsd:true,xd:.35,xfk:'slide',fl:5,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]})
];
Object.assign(PROJ,{'dm-s1':EPDMS});
PMETA['dm-s1']={hires:true,wide:true,smooth:true,clean:true,cine:true,capY:.8,tag:'',date:''};
