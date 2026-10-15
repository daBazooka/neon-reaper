/* CC-SHORT-TIMING */
ATM.k0={start:0.0,dur:8.502,lines:[0.5, 4.807],len:[4, 4]};
OTX.k0=[[]];
ATM.k1={start:8.502,dur:16.937,lines:[0.5, 7.023],len:[4, 4]};
OTX.k1=[[]];
ATM.k2={start:25.438,dur:17.219,lines:[0.5, 6.662, 11.873],len:[4, 4, 4]};
OTX.k2=[[]];
ATM.k3={start:42.657,dur:9.69,lines:[0.5],len:[4]};
OTX.k3=[[]];
const EPCCS=[
 sg7('a_k0',8.502,[],{noOsd:true,xd:.35,xfk:'zoom',fl:3,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']],xf:0}),
 sg7('a_k1',16.937,[],{noOsd:true,xd:.35,xfk:'slide',fl:4,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]}),
 sg7('a_k2',17.219,[],{noOsd:true,xd:.35,xfk:'zoom',fl:3,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]}),
 sg7('a_k3',9.69,[],{noOsd:true,xd:.35,xfk:'slide',fl:5,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]})
];
Object.assign(PROJ,{'cc-s1':EPCCS});
PMETA['cc-s1']={hires:true,wide:true,smooth:true,clean:true,cine:true,capY:.8,tag:'',date:''};
