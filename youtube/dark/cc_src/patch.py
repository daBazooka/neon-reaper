import re,glob
p='/home/user/neon-reaper/youtube/dark/engine.html';s=open(p).read()
lib=''.join(open(f).read()+'\n' for f in sorted(glob.glob('/tmp/cc/p*.js')))
block='/* CC-LIB-BEGIN */\n'+lib+'/* CC-LIB-END */\n'
if '/* CC-LIB-BEGIN */' in s:
    s=re.sub(r'/\* CC-LIB-BEGIN \*/.*?/\* CC-LIB-END \*/\n',lambda m:block,s,flags=re.S)
else:
    a="let TL=[],TOTAL=0,CURP='',DG=[];"
    assert s.count(a)==1
    s=s.replace(a,block+a)
open(p,'w').write(s);print('cc patched',len(block))
