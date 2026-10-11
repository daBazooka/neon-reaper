import json
T=json.load(open('/tmp/e19/voice.timing.json'));W=json.load(open('/tmp/e19/voice.words.json'))
texts=json.load(open('/home/user/neon-reaper/youtube/dark/cost_s.json'))['scenes']
out='/* SK-SHORT-TIMING */\n'
for s in T['scenes']:
    lens=[]
    for L in s['lines']:
        t0=s['start']+L;best=min(W,key=lambda l:abs(l['t0']-t0));lens.append(round(best['t1']-best['t0'],3))
    k=s['id'];out+="ATM.%s={start:%s,dur:%s,lines:%s,len:%s};\n"%(k,s['start'],s['dur'],json.dumps(s['lines']),json.dumps(lens))
    tx=[x for x in texts if x['id']==k][0]['lines'];out+="OTX.%s=%s;\n"%(k,json.dumps([l.split() for l in tx]))
tl="const EPCS=[\n"
for i,s in enumerate(T['scenes']):
    tl+=" sg7('a_%s',%s,[],{noOsd:true,xd:.35,xfk:'%s',fl:%d,en:3,fx:960,punch:[[0.1,.03]],snd:[[0.1,'hit']]%s%s}),\n"%(s['id'],s['dur'],'zoom' if i%2==0 else 'slide',[0,2,3,3,3,3,5,6][i],',xf:0' if i==0 else '',',riser:true' if i==5 else '')
tl=tl.rstrip(',\n')+"\n];\nObject.assign(PROJ,{'cost-s1':EPCS});\nPMETA['cost-s1']={hires:true,wide:true,smooth:true,clean:true,cine:true,capY:.8,tag:'',date:''};\n"
open('/tmp/sk/p98.js','w').write(out+tl);print('ok',T['total'])
