import re,glob
p='/home/user/neon-reaper/youtube/dark/engine.html';s=open(p).read()
lib=''.join(open(f).read()+'\n' for f in sorted(glob.glob('/tmp/dm/p*.js')))
block='/* DM-LIB-BEGIN */\n'+lib+'/* DM-LIB-END */\n'
if '/* DM-LIB-BEGIN */' in s:
    s=re.sub(r'/\* DM-LIB-BEGIN \*/.*?/\* DM-LIB-END \*/\n',lambda m:block,s,flags=re.S)
else:
    a="let TL=[],TOTAL=0,CURP='',DG=[];"
    assert s.count(a)==1
    s=s.replace(a,block+a)
open(p,'w').write(s);print('dm patched',len(block))
