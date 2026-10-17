import json,sys
SCN=json.load(open('/home/user/neon-reaper/youtube/dark/winter.json'))['scenes']
TP=sys.argv[1] if len(sys.argv)>1 else '/tmp/wa/voice.timing.json'
T=json.load(open(TP))['scenes']
FL={'w00':0,'w01':3,'w02':3,'w03':3,'w04':4,'w05':3,'w06':2,'w07':2,'w08':2,'w09':3,'w10':4,'w11':2,'w12':5,'w13':5,'wend':6}
out='/* WA-TIMING */\n';tl='const EPWA=[\n'
for i,s in enumerate(T):
    sid=s['id'];txt=next(x for x in SCN if x['id']==sid)['lines']
    out+="ATM.%s={start:%s,dur:%s,lines:%s,len:%s};\nOTX.%s=%s;\n"%(sid,s['start'],s['dur'],json.dumps(s['lines']),json.dumps([4.0]*len(s['lines'])),sid,json.dumps([l.split() for l in txt]))
    tl+=" sg7('a_%s',%s,[],{noOsd:true,xd:.7,xfk:'%s',fl:%d,en:1%s%s}),\n"%(sid,s['dur'],'zoom' if i%2==0 else 'slide',FL[sid],',impact:true' if sid in('w02','w13') else '',',xf:0' if i==0 else '')
tl=tl.rstrip(',\n')+"\n];\nObject.assign(PROJ,{wa:EPWA});\nPMETA.wa={hires:true,wide:true,smooth:true,clean:true,cine:true,film:true,tag:'',date:''};\n"
open('/tmp/wa/p99.js','w').write(out+tl);print(len(T),'scenes %.1fs'%(T[-1]['start']+T[-1]['dur']))
