import json,os,sys
SCN=json.load(open('/home/user/neon-reaper/youtube/dark/conspiracy.json'))['scenes']
TP=sys.argv[1] if len(sys.argv)>1 else '/tmp/cv/voice.timing.json'
T=json.load(open(TP))['scenes']
FL={'u00':0,'u01':1,'u23':3,'u24':4,'u25':5,'uend':6}
out='/* CC-TIMING */\n'
tl='const EPCC=[\n'
for i,s in enumerate(T):
    sid=s['id']
    out+="ATM.%s={start:%s,dur:%s,lines:%s,len:%s};\nOTX.%s=%s;\n"%(sid,s['start'],s['dur'],json.dumps(s['lines']),json.dumps([4.0]*len(s['lines'])),sid,json.dumps([l.split() for l in next(x for x in SCN if x['id']==sid)['lines']]))
    fl=FL.get(sid,[2,3,4][i%3])
    tl+=" sg7('a_%s',%s,[],{noOsd:true,xd:.7,xfk:'%s',fl:%d,en:1%s%s}),\n"%(sid,s['dur'],'zoom' if i%2==0 else 'slide',fl,',impact:true' if sid in('u02','u23') else '',',xf:0' if i==0 else '')
tl=tl.rstrip(',\n')+"\n];\nObject.assign(PROJ,{cc:EPCC});\nPMETA.cc={hires:true,wide:true,smooth:true,clean:true,cine:true,film:true,tag:'',date:''};\n"
open('/tmp/cc/p99.js','w').write(out+tl);print(len(T),'scenes %.1fs'%(T[-1]['start']+T[-1]['dur']))
