import re,glob
p='/home/user/neon-reaper/youtube/dark/engine.html';s=open(p).read()
lib=''.join(open(f).read()+'\n' for f in sorted(glob.glob('/tmp/tm/p*.js')))
block=lib+'/* TM-LIB-END */\n'
if '/* TM-LIB-BEGIN */' in s:
    s=re.sub(r'/\* TM-LIB-BEGIN \*/.*?/\* TM-LIB-END \*/\n',lambda m:block,s,flags=re.S)
else:
    a="let TL=[],TOTAL=0,CURP='',DG=[];"
    assert s.count(a)==1
    s=s.replace(a,block+a)
open(p,'w').write(s);print('tm patched',len(block))
