import json,os,sys,re
SCN=json.load(open('/home/user/neon-reaper/youtube/dark/women.json'))['scenes']
TP=sys.argv[1] if len(sys.argv)>1 else '/tmp/e22/voice.timing.json'
WP=TP.replace('.timing.json','.words.json')
T=json.load(open(TP));W=json.load(open(WP)) if os.path.exists(WP) else None
T=T['scenes']
FLV={'n00':0,'n01':3,'n02':3,'n03':3,'n04':3,'n05':3,'n06':3,'n07':4,'n08':3,'n09':3,'n10':5,'n11':5,'nend':6}
EN={'n00':3,'n01':2,'n02':3,'n03':3,'n04':3,'n05':2,'n06':1,'n07':3,'n08':2,'n09':2,'n10':2,'n11':2,'nend':1}
IMP={'n00','n02','n07','n09','n10'};RIS={'n00','n07','n09'}
PUN={'n00':[(0,'disappears'),(1,'about')],'n01':[(0,'phones')],'n02':[(0,'hospitals'),(1,'seventy')],'n03':[(0,'schools'),(2,'seventy')],'n04':[(0,'food'),(2,'workers')],'n05':[(0,'clear'),(1,'scale')],'n06':[(0,'hardest'),(2,'mourns')],'n07':[(0,'arithmetic'),(1,'births')],'n08':[(0,'older'),(2,'fewer')],'n09':[(0,'light'),(1,'ends')],'n10':[(0,'point')],'n11':[(0,'nobody'),(1,'tell')]}
def wt(start,lines,li,needle):
    if not W: return lines[li]+.8
    t0=start+lines[li];best=min(W,key=lambda l:abs(l['t0']-t0))
    for w,a,b in best['words']:
        if re.sub(r"[^a-z0-9']",'',w.lower()).startswith(needle): return a-start
    return lines[li]+.8
txtmap={s['id']:[l.split() for l in s['lines']] for s in SCN}
out='/* WM-TIMING */\n'
for s in T:
    sid=s['id'];ln=s['lines'];lens=[]
    for L in ln:
        if W:
            best=min(W,key=lambda l:abs(l['t0']-(s['start']+L)));lens.append(round(best['t1']-best['t0'],3))
        else: lens.append(4.0)
    out+="ATM.%s={start:%s,dur:%s,lines:%s,len:%s};\nOTX.%s=%s;\n"%(sid,s['start'],s['dur'],json.dumps(ln),json.dumps(lens),sid,json.dumps(txtmap[sid]))
tl="const EPM=[\n"
for i,s in enumerate(T):
    sid=s['id'];pun=[];snd=[]
    for (li,needle) in PUN.get(sid,[]):
        t=round(wt(s['start'],s['lines'],li,needle),2);pun.append("[%s,.03]"%t);snd.append("[%s,'hit']"%t)
    flags=''
    if sid in IMP:flags+=',impact:true'
    if sid in RIS:flags+=',riser:true'
    tl+=" sg7('a_%s',%s,[],{noOsd:true,xd:.7,xfk:'%s',fl:%d,en:%d,punch:[%s],snd:[%s]%s%s}),\n"%(sid,s['dur'],'zoom' if i%2==0 else 'slide',FLV[sid],EN[sid],','.join(pun),','.join(snd),flags,',xf:0' if i==0 else '')
tl=tl.rstrip(',\n')+"\n];\nObject.assign(PROJ,{women:EPM});\nPMETA.women={hires:true,wide:true,smooth:true,clean:true,cine:true,tag:'',date:''};\n"
open('/tmp/wm/p99.js','w').write(out+tl)
print(len(T),'scenes; total %.1f'%(T[-1]['start']+T[-1]['dur']))
