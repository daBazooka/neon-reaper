import re,glob
p='/home/user/neon-reaper/youtube/dark/engine.html';s=open(p).read()
lib=''.join(open(f).read()+'\n' for f in sorted(glob.glob('/tmp/wa/p*.js')))
block='/* WA-LIB-BEGIN */\n'+lib+'/* WA-LIB-END */\n'
if '/* WA-LIB-BEGIN */' in s:
    s=re.sub(r'/\* WA-LIB-BEGIN \*/.*?/\* WA-LIB-END \*/\n',lambda m:block,s,flags=re.S)
else:
    a="let TL=[],TOTAL=0,CURP='',DG=[];"
    assert s.count(a)==1
    s=s.replace(a,block+a)
open(p,'w').write(s);print('wa patched',len(block))
