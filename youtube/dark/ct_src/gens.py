import json
T=json.load(open('/tmp/e23/voice.timing.json'));W=json.load(open('/tmp/e23/voice.words.json'))
out='/* CT-SHORT-TIMING */\n'
tl="const EPFS=[\n"
for i,s in enumerate(T['scenes']):
    k='v%d'%i;lens=[]
    for L in s['lines']:
        t0=s['start']+L;best=min(W,key=lambda l:abs(l['t0']-t0));lens.append(round(best['t1']-best['t0'],3))
    out+="ATM.%s={start:%s,dur:%s,lines:%s,len:%s};\nOTX.%s=[[]];\n"%(k,s['start'],s['dur'],json.dumps(s['lines']),json.dumps(lens),k)
    tl+=" sg7('a_%s',%s,[],{noOsd:true,xd:.35,xfk:'%s',fl:%d,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]%s%s}),\n"%(k,s['dur'],'zoom' if i%2==0 else 'slide',[3,4,3,3,3,5][i],',xf:0' if i==0 else '',',riser:true' if i==4 else '')
tl=tl.rstrip(',\n')+"\n];\nObject.assign(PROJ,{'film-s1':EPFS});\nPMETA['film-s1']={hires:true,wide:true,smooth:true,clean:true,cine:true,capY:.8,tag:'',date:''};\n"
open('/tmp/ct/p98.js','w').write(out+tl);print('ok',T['total'])
