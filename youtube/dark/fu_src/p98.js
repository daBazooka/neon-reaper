/* FU-SHORT-TIMING */
ATM.u0={start:0.0,dur:7.767,lines:[0.5],len:[4]};
OTX.u0=[[]];
ATM.u1={start:7.767,dur:10.775,lines:[0.5],len:[4]};
OTX.u1=[[]];
ATM.u2={start:18.542,dur:12.968,lines:[0.5],len:[4]};
OTX.u2=[[]];
ATM.u3={start:31.511,dur:8.717,lines:[0.5],len:[4]};
OTX.u3=[[]];
const EPFUS=[
 sg7('a_u0',7.767,[],{noOsd:true,xd:.35,xfk:'zoom',fl:3,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']],xf:0}),
 sg7('a_u1',10.775,[],{noOsd:true,xd:.35,xfk:'slide',fl:4,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]}),
 sg7('a_u2',12.968,[],{noOsd:true,xd:.35,xfk:'zoom',fl:4,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]}),
 sg7('a_u3',8.717,[],{noOsd:true,xd:.35,xfk:'slide',fl:5,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]})
];
Object.assign(PROJ,{'fu-s1':EPFUS});
PMETA['fu-s1']={hires:true,wide:true,smooth:true,clean:true,cine:true,capY:.8,tag:'',date:''};
