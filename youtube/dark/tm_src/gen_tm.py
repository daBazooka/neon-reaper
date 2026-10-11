import json,os,sys,re
SC=json.load(open('/home/user/neon-reaper/youtube/dark/alltime.json'))['scenes']
TP=sys.argv[1] if len(sys.argv)>1 else '/tmp/e16/voice.timing.json'
WP=TP.replace('.timing.json','.words.json')
T=json.load(open(TP));W=json.load(open(WP)) if os.path.exists(WP) else None
T=T['scenes']
FLV={'x00':0}
for i in range(1,8):FLV['x%02d'%i]=1
for i in range(8,15):FLV['x%02d'%i]=2
for i in range(15,20):FLV['x%02d'%i]=3
for i in range(20,24):FLV['x%02d'%i]=4
for i in range(24,28):FLV['x%02d'%i]=5
FLV['xend']=5
EN={'x00':3,'x01':2,'x02':3,'x03':2,'x04':2,'x05':2,'x06':2,'x07':2,'x08':2,'x09':3,'x10':2,'x11':2,'x12':3,'x13':2,'x14':2,'x15':3,'x16':3,'x17':2,'x18':3,'x19':2,'x20':2,'x21':1,'x22':2,'x23':1,'x24':3,'x25':3,'x26':4,'xend':1}
IMP={'x00','x02','x12','x15','x18','x24','x26'};RIS={'x00','x18','x23','x25'}
PUN={'x00':[(0,'one',0),(1,'gone',0),(3,'seven',0)],'x01':[(0,'planck',0),(1,'silent',0)],'x02':[(1,'stretched',0)],'x03':[(1,'hundred',0)],'x04':[(1,'zewail',0)],'x05':[(1,'thirty',0)],'x06':[(1,'protons',0)],'x07':[(1,'spike',0)],'x08':[(1,'false',0)],'x09':[(0,'second',0),(2,'attention',0)],'x10':[(0,'three',0),(1,'eight',0)],'x11':[(1,'thirty',0)],'x12':[(1,'millionth',0),(2,'only',0)],'x15':[(1,'light',0)],'x16':[(0,'rock',0)],'x18':[(0,'thirteen',0)],'x19':[(1,'andromeda',0)],'x20':[(1,'memory',0)],'x22':[(0,'finishes',0)],'x23':[(1,'fading',0)],'x24':[(2,'barely',0)],'x26':[(1,'numbers',0)]}
def wt(start,lines,li,needle,nth):
    if not W: return lines[li]+.8
    t0=start+lines[li];best=min(W,key=lambda l:abs(l['t0']-t0));k=0
    for w,a,b in best['words']:
        ww=re.sub(r"[^a-z0-9']",'',w.lower())
        if ww.startswith(needle):
            if k==nth: return a-start
            k+=1
    return lines[li]+.8
txtmap={s['id']:[l.split() for l in s['lines']] for s in SC}
out='/* TM-TIMING */\n'
for s in T:
    sid=s['id'];ln=s['lines'];lens=[]
    for L in ln:
        if W:
            best=min(W,key=lambda l:abs(l['t0']-(s['start']+L)));lens.append(round(best['t1']-best['t0'],3))
        else: lens.append(4.0)
    out+="ATM.%s={start:%s,dur:%s,lines:%s,len:%s};\nOTX.%s=%s;\n"%(sid,s['start'],s['dur'],json.dumps(ln),json.dumps(lens),sid,json.dumps(txtmap[sid]))
tl="const EPT=[\n"
for i,s in enumerate(T):
    sid=s['id'];pun=[];snd=[]
    for (li,needle,nth) in PUN.get(sid,[]):
        t=round(wt(s['start'],s['lines'],li,needle,nth),2);pun.append("[%s,.03]"%t);snd.append("[%s,'hit']"%t)
    flags=''
    if sid in IMP:flags+=',impact:true'
    if sid in RIS:flags+=',riser:true'
    tl+=" sg7('a_%s',%s,[],{noOsd:true,xd:.6,xfk:'%s',fl:%d,en:%d,punch:[%s],snd:[%s]%s%s}),\n"%(sid,s['dur'],'zoom' if i%2==0 else 'slide',FLV[sid],EN[sid],','.join(pun),','.join(snd),flags,',xf:0' if i==0 else '')
tl=tl.rstrip(',\n')+"\n];\nObject.assign(PROJ,{alltime:EPT});\nPMETA.alltime={hires:true,wide:true,smooth:true,clean:true,cine:true,tag:'',date:''};\n"
open('/tmp/tm/p99.js','w').write(out+tl)
print(len(T),'scenes; total %.1f'%(T[-1]['start']+T[-1]['dur']))
