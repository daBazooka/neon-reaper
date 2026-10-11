import json,os,sys,re
SCN=json.load(open('/home/user/neon-reaper/youtube/dark/want.json'))['scenes']
TP=sys.argv[1] if len(sys.argv)>1 else '/tmp/e20/voice.timing.json'
WP=TP.replace('.timing.json','.words.json')
T=json.load(open(TP));W=json.load(open(WP)) if os.path.exists(WP) else None
T=T['scenes']
FLV={'g00':0,'g01':3,'g02':1,'g03':1,'g04':1,'g05':2,'g06':2,'g07':2,'g08':2,'g09':2,'g10':1,'g11':3,'g12':5,'g13':5,'gend':6}
EN={'g00':3,'g01':2,'g02':2,'g03':2,'g04':2,'g05':3,'g06':3,'g07':3,'g08':3,'g09':3,'g10':2,'g11':2,'g12':3,'g13':3,'gend':1}
IMP={'g00','g02','g04','g06','g08','g12','g13'};RIS={'g00','g03','g07','g11','g12'}
PUN={'g00':[(0,'never'),(1,'mistakes'),(2,'fix'),(3,'system')],'g01':[(0,'vague'),(1,'asks'),(2,'quits'),(3,'step')],'g02':[(0,'name'),(2,'rewrites'),(3,'deadline')],'g03':[(0,'test'),(2,'one'),(3,'real')],'g04':[(0,'plan'),(2,'wish'),(3,'contrast')],'g05':[(0,'triggers'),(2,'tuesday'),(2,'rejection')],'g06':[(0,'ask'),(1,'predict'),(3,'cost')],'g07':[(1,'specific'),(4,'math'),(4,'rejection')],'g08':[(0,'reach'),(2,'sweet'),(3,'lists')],'g09':[(1,'raise'),(2,'fitness'),(3,'creative'),(4,'friendship')],'g10':[(0,'adjust'),(3,'fixed'),(3,'zero')],'g11':[(0,'honest'),(2,'stop'),(3,'persist')],'g12':[(1,'one'),(2,'five'),(3,'that')],'g13':[(0,'name'),(2,'now')]}
def wt(start,lines,li,needle):
    if not W: return lines[li]+.8
    t0=start+lines[li];best=min(W,key=lambda l:abs(l['t0']-t0))
    for w,a,b in best['words']:
        if re.sub(r"[^a-z0-9']",'',w.lower()).startswith(needle): return a-start
    return lines[li]+.8
txtmap={s['id']:[l.split() for l in s['lines']] for s in SCN}
out='/* WT-TIMING */\n'
for s in T:
    sid=s['id'];ln=s['lines'];lens=[]
    for L in ln:
        if W:
            best=min(W,key=lambda l:abs(l['t0']-(s['start']+L)));lens.append(round(best['t1']-best['t0'],3))
        else: lens.append(4.0)
    out+="ATM.%s={start:%s,dur:%s,lines:%s,len:%s};\nOTX.%s=%s;\n"%(sid,s['start'],s['dur'],json.dumps(ln),json.dumps(lens),sid,json.dumps(txtmap[sid]))
tl="const EPW=[\n"
for i,s in enumerate(T):
    sid=s['id'];pun=[];snd=[]
    for (li,needle) in PUN.get(sid,[]):
        t=round(wt(s['start'],s['lines'],li,needle),2);pun.append("[%s,.03]"%t);snd.append("[%s,'hit']"%t)
    flags=''
    if sid in IMP:flags+=',impact:true'
    if sid in RIS:flags+=',riser:true'
    tl+=" sg7('a_%s',%s,[],{noOsd:true,xd:.45,xfk:'%s',fl:%d,en:%d,punch:[%s],snd:[%s]%s%s}),\n"%(sid,s['dur'],'zoom' if i%2==0 else 'slide',FLV[sid],EN[sid],','.join(pun),','.join(snd),flags,',xf:0' if i==0 else '')
tl=tl.rstrip(',\n')+"\n];\nObject.assign(PROJ,{want:EPW});\nPMETA.want={hires:true,wide:true,smooth:true,clean:true,cine:true,tag:'',date:''};\n"
open('/tmp/wt/p99.js','w').write(out+tl)
print(len(T),'scenes; total %.1f'%(T[-1]['start']+T[-1]['dur']))
