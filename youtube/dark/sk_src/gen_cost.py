import json,os,sys,re
SCN=json.load(open('/home/user/neon-reaper/youtube/dark/cost.json'))['scenes']
TP=sys.argv[1] if len(sys.argv)>1 else '/tmp/e18/voice.timing.json'
WP=TP.replace('.timing.json','.words.json')
T=json.load(open(TP));W=json.load(open(WP)) if os.path.exists(WP) else None
T=T['scenes']
FLV={}
for i in range(20):
    k='y%02d'%i if i<19 else 'yend'
    FLV[k]=0 if i==0 else 1 if i<=2 else 2 if i<=5 else 3 if i<=11 else 4 if i<=14 else 5 if i<=18 else 6
EN={'y00':3,'y01':2,'y02':1,'y03':3,'y04':3,'y05':3,'y06':2,'y07':3,'y08':2,'y09':3,'y10':2,'y11':3,'y12':3,'y13':1,'y14':2,'y15':3,'y16':3,'y17':2,'y18':3,'yend':1}
IMP={'y00','y03','y06','y07','y08','y09','y11','y15','y18'};RIS={'y00','y05','y11','y15','y17'}
PUN={'y00':[(0,'discipline'),(1,'obsession'),(3,'count')],'y01':[(1,'discipline')],'y03':[(1,'hook'),(2,'obsession'),(3,'stopping')],'y04':[(1,'volume'),(2,'depth'),(3,'resilience')],'y05':[(1,'obsession'),(3,'column')],'y06':[(0,'sleep'),(2,'nature')],'y07':[(0,'body'),(3,'seven')],'y08':[(0,'people'),(3,'harvard')],'y09':[(0,'four'),(1,'nobody'),(3,'betray')],'y10':[(1,'two'),(2,'died'),(3,'lead')],'y11':[(0,'add'),(1,'once')],'y12':[(1,'trap'),(3,'brakes')],'y13':[(0,'intense'),(1,'different')],'y14':[(1,'harmonious'),(1,'obsessive'),(3,'cyclists')],'y15':[(1,'wrecks'),(2,'goal')],'y16':[(1,'one'),(2,'two'),(3,'three'),(4,'four'),(5,'five')],'y17':[(1,'rest'),(1,'panic')],'y18':[(2,'only'),(3,'act')]}
def wt(start,lines,li,needle):
    if not W: return lines[li]+.8
    t0=start+lines[li];best=min(W,key=lambda l:abs(l['t0']-t0))
    for w,a,b in best['words']:
        if re.sub(r"[^a-z0-9']",'',w.lower()).startswith(needle): return a-start
    return lines[li]+.8
txtmap={s['id']:[l.split() for l in s['lines']] for s in SCN}
out='/* SK-TIMING */\n'
for s in T:
    sid=s['id'];ln=s['lines'];lens=[]
    for L in ln:
        if W:
            best=min(W,key=lambda l:abs(l['t0']-(s['start']+L)));lens.append(round(best['t1']-best['t0'],3))
        else: lens.append(4.0)
    out+="ATM.%s={start:%s,dur:%s,lines:%s,len:%s};\nOTX.%s=%s;\n"%(sid,s['start'],s['dur'],json.dumps(ln),json.dumps(lens),sid,json.dumps(txtmap[sid]))
tl="const EPC=[\n"
for i,s in enumerate(T):
    sid=s['id'];pun=[];snd=[]
    for (li,needle) in PUN.get(sid,[]):
        t=round(wt(s['start'],s['lines'],li,needle),2);pun.append("[%s,.03]"%t);snd.append("[%s,'hit']"%t)
    flags=''
    if sid in IMP:flags+=',impact:true'
    if sid in RIS:flags+=',riser:true'
    tl+=" sg7('a_%s',%s,[],{noOsd:true,xd:.45,xfk:'%s',fl:%d,en:%d,punch:[%s],snd:[%s]%s%s}),\n"%(sid,s['dur'],'zoom' if i%2==0 else 'slide',FLV[sid],EN[sid],','.join(pun),','.join(snd),flags,',xf:0' if i==0 else '')
tl=tl.rstrip(',\n')+"\n];\nObject.assign(PROJ,{cost:EPC});\nPMETA.cost={hires:true,wide:true,smooth:true,clean:true,cine:true,tag:'',date:''};\n"
open('/tmp/sk/p99.js','w').write(out+tl)
print(len(T),'scenes; total %.1f'%(T[-1]['start']+T[-1]['dur']))
