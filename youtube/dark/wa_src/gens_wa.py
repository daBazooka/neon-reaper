import json
T=json.load(open('/tmp/wa/short.timing.json'))
out='/* WA-SHORT-TIMING */\n';tl='const EPWAS=[\n'
for i,s in enumerate(T['scenes']):
    out+="ATM.%s={start:%s,dur:%s,lines:%s,len:%s};\nOTX.%s=[[]];\n"%(s['id'],s['start'],s['dur'],json.dumps(s['lines']),json.dumps([4]*len(s['lines'])),s['id'])
    tl+=" sg7('a_%s',%s,[],{noOsd:true,xd:.35,xfk:'%s',fl:%d,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]%s}),\n"%(s['id'],s['dur'],'zoom' if i%2==0 else 'slide',[3,2,2,5][i],',xf:0' if i==0 else '')
tl=tl.rstrip(',\n')+"\n];\nObject.assign(PROJ,{'wa-s1':EPWAS});\nPMETA['wa-s1']={hires:true,wide:true,smooth:true,clean:true,cine:true,capY:.8,tag:'',date:''};\n"
open('/tmp/wa/p98.js','w').write(out+tl);print('ok',T['total'])
