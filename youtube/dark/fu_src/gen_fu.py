import json,sys
SCN=json.load(open('/home/user/neon-reaper/youtube/dark/future.json'))['scenes']
TP=sys.argv[1] if len(sys.argv)>1 else '/tmp/fu/voice.timing.json'
T=json.load(open(TP))['scenes']
FL={'f00':0,'f01':4,'f02':3,'f03':3,'f04':2,'f05':4,'f06':2,'f07':3,'f08':3,'f09':4,'f10':2,'f11':5,'f12':5,'fend':6}
out='/* FU-TIMING */\n';tl='const EPFU=[\n'
for i,s in enumerate(T):
    sid=s['id'];txt=next(x for x in SCN if x['id']==sid)['lines']
    out+="ATM.%s={start:%s,dur:%s,lines:%s,len:%s};\nOTX.%s=%s;\n"%(sid,s['start'],s['dur'],json.dumps(s['lines']),json.dumps([4.0]*len(s['lines'])),sid,json.dumps([l.split() for l in txt]))
    tl+=" sg7('a_%s',%s,[],{noOsd:true,xd:.7,xfk:'%s',fl:%d,en:1%s%s}),\n"%(sid,s['dur'],'zoom' if i%2==0 else 'slide',FL[sid],',impact:true' if sid in('f01','f05') else '',',xf:0' if i==0 else '')
tl=tl.rstrip(',\n')+"\n];\nObject.assign(PROJ,{fu:EPFU});\nPMETA.fu={hires:true,wide:true,smooth:true,clean:true,cine:true,film:true,tag:'',date:''};\n"
open('/tmp/fu/p99.js','w').write(out+tl);print(len(T),'scenes %.1fs'%(T[-1]['start']+T[-1]['dur']))
