import json,sys
SCN=json.load(open('/home/user/neon-reaper/youtube/dark/doom.json'))['scenes']
TP=sys.argv[1] if len(sys.argv)>1 else '/tmp/dm/voice.timing.json'
T=json.load(open(TP))['scenes']
FL={'d00':0,'d01':1,'d02':3,'d03':4,'d04':2,'d05':3,'d06':4,'d07':2,'d08':3,'d09':5,'d10':5,'dend':6}
out='/* DM-TIMING */\n';tl='const EPDM=[\n'
for i,s in enumerate(T):
    sid=s['id'];txt=next(x for x in SCN if x['id']==sid)['lines']
    out+="ATM.%s={start:%s,dur:%s,lines:%s,len:%s};\nOTX.%s=%s;\n"%(sid,s['start'],s['dur'],json.dumps(s['lines']),json.dumps([4.0]*len(s['lines'])),sid,json.dumps([l.split() for l in txt]))
    tl+=" sg7('a_%s',%s,[],{noOsd:true,xd:.7,xfk:'%s',fl:%d,en:1%s%s}),\n"%(sid,s['dur'],'zoom' if i%2==0 else 'slide',FL[sid],',impact:true' if sid=='d04' else '',',xf:0' if i==0 else '')
tl=tl.rstrip(',\n')+"\n];\nObject.assign(PROJ,{dm:EPDM});\nPMETA.dm={hires:true,wide:true,smooth:true,clean:true,cine:true,tag:'',date:''};\n"
open('/tmp/dm/p99.js','w').write(out+tl);print(len(T),'scenes %.1fs'%(T[-1]['start']+T[-1]['dur']))
