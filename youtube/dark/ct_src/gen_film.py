import json,os,sys,re
SCN=json.load(open('/home/user/neon-reaper/youtube/dark/film_w.json'))['scenes']
TP=sys.argv[1] if len(sys.argv)>1 else '/tmp/e24/voice.timing.json'
WP=TP.replace('.timing.json','.words.json')
T=json.load(open(TP));W=json.load(open(WP)) if os.path.exists(WP) else None
T=T['scenes']
FLV={'f00':5,'f01':3,'f02':4,'f03':4,'f04':3,'f05':3,'f06':3,'f07':5,'f08':3,'f09':3,'f10':5,'fend':6}
EN={'f00':1,'f01':3,'f02':2,'f03':2,'f04':1,'f05':2,'f06':2,'f07':2,'f08':1,'f09':1,'f10':2,'fend':1}
IMP={'f01','f09','f10'};RIS={'f00','f08'}
PUN={'f01':[(0,'gone')],'f02':[(0,'buses')],'f03':[(1,'seventy')],'f05':[(1,'unpaid')],'f06':[(0,'two')],'f07':[(1,'capable')],'f08':[(1,'no')],'f09':[(0,'switches')],'f10':[(2,'notice')]}
def wt(start,lines,li,needle):
    if not W: return lines[li]+.8
    t0=start+lines[li];best=min(W,key=lambda l:abs(l['t0']-t0))
    for w,a,b in best['words']:
        if re.sub(r"[^a-z0-9']",'',w.lower()).startswith(needle): return a-start
    return lines[li]+.8
txtmap={s['id']:[l.split() for l in s['lines']] for s in SCN}
out='/* CT-TIMING */\n'
for s in T:
    sid=s['id'];ln=s['lines'];lens=[]
    for L in ln:
        if W:
            best=min(W,key=lambda l:abs(l['t0']-(s['start']+L)));lens.append(round(best['t1']-best['t0'],3))
        else: lens.append(4.0)
    out+="ATM.%s={start:%s,dur:%s,lines:%s,len:%s};\nOTX.%s=%s;\n"%(sid,s['start'],s['dur'],json.dumps(ln),json.dumps(lens),sid,json.dumps(txtmap[sid]))
tl="const EPF=[\n"
for i,s in enumerate(T):
    sid=s['id'];pun=[];snd=[]
    for (li,needle) in PUN.get(sid,[]):
        t=round(wt(s['start'],s['lines'],li,needle),2);pun.append("[%s,.03]"%t);snd.append("[%s,'hit']"%t)
    flags=''
    if sid in IMP:flags+=',impact:true'
    if sid in RIS:flags+=',riser:true'
    tl+=" sg7('a_%s',%s,[],{noOsd:true,xd:.9,xfk:'%s',fl:%d,en:%d,punch:[%s],snd:[%s]%s%s}),\n"%(sid,s['dur'],'zoom' if i%2==0 else 'slide',FLV[sid],EN[sid],','.join(pun),','.join(snd),flags,',xf:0' if i==0 else '')
tl=tl.rstrip(',\n')+"\n];\nObject.assign(PROJ,{film:EPF});\nPMETA.film={hires:true,wide:true,smooth:true,clean:true,cine:true,film:true,tag:'',date:''};\n"
open('/tmp/ct/p99.js','w').write(out+tl)
print(len(T),'scenes; total %.1f'%(T[-1]['start']+T[-1]['dur']))
