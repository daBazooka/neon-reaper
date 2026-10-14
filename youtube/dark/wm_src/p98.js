/* WM-SHORT-TIMING */
ATM.p0={start:0.0,dur:6.728,lines:[0.2],len:[6.128]};
OTX.p0=[["At", "seven", "forty", "two", "tomorrow,", "every", "woman", "and", "girl", "on", "Earth", "disappears.", "Here", "is", "what", "happens."]];
ATM.p1={start:6.728,dur:7.977,lines:[0.25],len:[7.327]};
OTX.p1=[["Day", "one.", "Women", "are", "about", "seventy", "percent", "of", "the", "world's", "health", "and", "social", "care", "workers.", "Hospitals", "run", "on", "a", "handful."]];
ATM.p2={start:14.705,dur:7.999,lines:[0.25],len:[7.349]};
OTX.p2=[["Week", "one.", "Women", "do", "seventy", "six", "percent", "of", "all", "unpaid", "care", "work.", "Sixteen", "billion", "hours", "a", "day.", "It", "all", "stops."]];
ATM.p3={start:22.704,dur:7.909,lines:[0.25],len:[7.259]};
OTX.p3=[["Month", "one.", "Two", "in", "five", "workers", "gone.", "Supply", "chains", "break.", "Men", "could", "learn", "these", "jobs.", "But", "not", "four", "billion,", "in", "a", "week."]];
ATM.p4={start:30.613,dur:9.13,lines:[0.25],len:[8.48]};
OTX.p4=[["Year", "ten.", "No", "women,", "no", "births.", "No", "technology", "can", "carry", "a", "pregnancy", "outside", "a", "body.", "Humanity", "ends", "in", "about", "a", "century."]];
ATM.p5={start:39.743,dur:7.0,lines:[0.25],len:[5.133]};
OTX.p5=[["It", "is", "a", "thought", "experiment", "about", "respect.", "See", "the", "work.", "Say", "her", "name", "in", "the", "comments."]];
const EPMS=[
 sg7('a_p0',6.728,[],{noOsd:true,xd:.35,xfk:'zoom',fl:0,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']],xf:0}),
 sg7('a_p1',7.977,[],{noOsd:true,xd:.35,xfk:'slide',fl:3,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]}),
 sg7('a_p2',7.999,[],{noOsd:true,xd:.35,xfk:'zoom',fl:3,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]}),
 sg7('a_p3',7.909,[],{noOsd:true,xd:.35,xfk:'slide',fl:3,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]}),
 sg7('a_p4',9.13,[],{noOsd:true,xd:.35,xfk:'zoom',fl:4,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']],riser:true}),
 sg7('a_p5',7.0,[],{noOsd:true,xd:.35,xfk:'slide',fl:5,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]})
];
Object.assign(PROJ,{'women-s1':EPMS});
PMETA['women-s1']={hires:true,wide:true,smooth:true,clean:true,cine:true,capY:.8,tag:'',date:''};
