# usage: python3 audio.py events.json out.wav
# Synthesises the whole soundtrack (music that changes per scene, SFX, character blips). No samples/assets.
import sys, json, wave, numpy as np
SR=44100; ev=json.load(open(sys.argv[1])); out=sys.argv[2]
N=int(ev['dur']*SR)+SR; rng=np.random.default_rng(7)
T=lambda d: np.arange(int(d*SR))/SR
mtof=lambda m: 440*2**((np.asarray(m,dtype=float)-69)/12)
def sq(f,t,duty=.5): return np.where((f*t)%1<duty,1.,-1.)
def saw(f,t): return 2*((f*t)%1)-1
def tri(f,t): return 2*np.abs(2*((f*t)%1)-1)-1
def sin(f,t): return np.sin(2*np.pi*f*t)
def lp(x,k): return np.convolve(x,np.ones(k)/k,'same')
def put(buf,t,a,g=1.):
    i=int(t*SR)
    if i>=len(buf) or i<0: return
    a=a[:len(buf)-i]; buf[i:i+len(a)]+=a*g
def note(f,dur,w='sq',dec=.12,a=.004,duty=.5,vib=0,rel=.02):
    t=T(dur+rel); ph=t+ (np.sin(2*np.pi*5.5*t)*vib/ (2*np.pi*5.5*max(f,1)) if vib else 0)
    y={'sq':lambda:sq(f,ph,duty),'saw':lambda:saw(f,ph),'tri':lambda:tri(f,ph),'sin':lambda:sin(f,ph)}[w]()
    e=np.minimum(1,t/a)*np.exp(-t/dec); e*=np.clip((dur+rel-t)/rel,0,1)
    return y*e
def kick(): t=T(.28); return np.sin(2*np.pi*np.cumsum(45+110*np.exp(-t*30))/SR)*np.exp(-t*11)
def snare(g=1): t=T(.2); return (rng.standard_normal(len(t))*np.exp(-t*24)*.7+sin(190,t)*np.exp(-t*30)*.5)*g
def hat(g=1): t=T(.05); n=rng.standard_normal(len(t)); return (n-np.roll(n,1))*np.exp(-t*90)*.5*g
def clap(): t=T(.16); n=rng.standard_normal(len(t)); return n*(np.exp(-t*40)+.6*np.exp(-((t-.02)%.03)*200)*np.exp(-t*20))*.6

# ---------------- music ----------------
def mus(style,dur):
    y=np.zeros(int(dur*SR)+SR)
    bpm={'upbeat':128,'chase':156,'lofi':78,'suspense':90,'funk':108,'sad':60}[style]
    st=60/bpm/4; steps=int(dur/st)+1
    if style=='upbeat':
        R=[48,43,45,41]; IV=[[0,4,7],[0,4,7],[0,3,7],[0,4,7]]
        for i in range(steps):
            b=(i//16)%4; s=i%16; t=i*st; r=R[b]; iv=IV[b]
            if s%4==0: put(y,t,kick(),.9)
            if s in(4,12): put(y,t,clap(),.5)
            if s%4==2: put(y,t,hat(),.35)
            if s%2==0: put(y,t,note(mtof(r+(12 if (s//2)%2 else 0)),st*1.8,'tri',.2),.55)
            put(y,t,note(mtof(r+24+iv[[0,1,2,1][s%4]]+(12 if s//4%2 else 0)),st*.9,'sq',.09,duty=.3),.13)
            if s==0: [put(y,t,note(mtof(r+12+k),st*15,'sq',.5,a=.02,duty=.5),.045) for k in iv]
    elif style=='chase':
        R=[45,41,48,43]; IV=[[0,3,7],[0,4,7],[0,4,7],[0,4,7]]
        for i in range(steps):
            b=(i//16)%4; s=i%16; t=i*st; r=R[b]; iv=IV[b]
            if s%4==0: put(y,t,kick(),.95)
            if s in(4,12): put(y,t,snare(),.7)
            if s%2==0: put(y,t,hat(),.3)
            if s%2==0: put(y,t,note(mtof(r-12),st*1.8,'saw',.12),.32)
            put(y,t,note(mtof(r+24+iv[[0,1,2,1,0,1,2,1][s%8]]+(12 if s%8>3 else 0)),st*.85,'sq',.07,duty=.25),.13)
    elif style=='lofi':
        R=[45,50,43,48]; IV=[[0,3,7,10],[0,3,7,10],[0,4,7,10],[0,4,7,11]]
        pent=[69,72,74,76,79]
        for i in range(steps):
            b=(i//16)%4; s=i%16; t=i*st; r=R[b]; iv=IV[b]
            if s==0:
                for k in iv:
                    put(y,t,note(mtof(r+12+k),st*15,'sin',.9,a=.12),.09); put(y,t,note(mtof(r+24+k),st*15,'tri',.9,a=.12),.03)
            if s in(0,10): put(y,t,kick(),.6)
            if s in(4,12): put(y,t,snare(.5),.5)
            if s%4==2: put(y,t,hat(.7),.3)
            if s in(0,6,8): put(y,t,note(mtof(r),st*3,'tri',.25),.55)
            if s in(2,7,11) and rng.random()<.6: put(y,t,note(mtof(pent[int(rng.integers(0,5))]),st*2,'sin',.25),.1)
        y+=lp(rng.standard_normal(len(y)),3)*.004
    elif style=='suspense':
        t=np.arange(len(y))/SR; y+=sin(55,t)*.12+sin(55.9,t)*.10+sin(82.4,t)*.05
        for i in range(steps):
            s=i%16; tt=i*st
            if s in(0,2): put(y,tt,kick(),.45 if s==0 else .28)
            if s%4==0: put(y,tt,hat(.6),.15)
            if s in(5,9,13) and rng.random()<.7: put(y,tt,note(mtof([57,60,62,64,67][int(rng.integers(0,5))]),st*.8,'tri',.1),.28)
    elif style=='funk':
        bs=[40,40,43,40,45,43]; bsteps=[0,3,6,8,10,14]
        for i in range(steps):
            s=i%16; t=i*st
            if s in bsteps: m=bs[bsteps.index(s)]; put(y,t,note(mtof(m),st*1.6,'tri',.1),.6); put(y,t,note(mtof(m+12),st*1.2,'sq',.07,duty=.3),.1)
            if s in(2,6,10,13): [put(y,t,note(mtof(m),st*.7,'sq',.06,duty=.35),.06) for m in (64,67,71,74)]
            if s in(0,6,10): put(y,t,kick(),.85)
            if s in(4,12): put(y,t,snare(),.7)
            put(y,t,hat(1 if s%2==0 else .5),.2)
    elif style=='sad':
        seq=[(62,.55),(61,.55),(60,.55),(59,1.4)]; tt=0
        for m,d in seq:
            n=note(mtof(m),d,'saw',.6,a=.05,vib=(0 if d<1 else 25),rel=.05); n=lp(n,int(SR/ (mtof(m)*1.5)) or 3)
            put(y,tt,n,.45); tt+=d
        put(y,0,note(mtof(38),dur,'sin',5,a=.2),.15)
    n=int(dur*SR); y=y[:n]; f=int(.03*SR); g=int(min(.3,dur/2)*SR)
    y[:f]*=np.linspace(0,1,f); y[-g:]*=np.linspace(1,0,g)
    return y

# ---------------- sfx ----------------
def sfx(name):
    if name=='boom': t=T(1.3); return np.tanh(3*np.sin(2*np.pi*np.cumsum(90*np.exp(-t*2.2)+38)/SR)*np.exp(-t*2.6))*.9+lp(rng.standard_normal(len(t)),12)*np.exp(-t*20)*.6
    if name=='thud': t=T(.5); return np.sin(2*np.pi*np.cumsum(60+130*np.exp(-t*22))/SR)*np.exp(-t*8)+rng.standard_normal(len(t))*np.exp(-t*45)*.4
    if name=='stamp':
        th=sfx('thud'); return th*.9+sfx('boom')[:len(th)]*.5
    if name=='whoosh': d=.45; t=T(d); n=lp(rng.standard_normal(len(t)),int(30+60*0)+20); return n*np.sin(np.pi*t/d)**2*1.4
    if name=='pop': t=T(.09); return sin(900*np.exp(-t*25)+250,t)*np.exp(-t*40)
    if name=='ding': t=T(.6); return (sin(1320,t)+.4*sin(2640,t))*np.exp(-t*7)*.5
    if name=='chime': t=T(.9); return (sin(1568,t)+sin(2093,t)*.7+sin(2637,t)*.4)*np.exp(-t*5)*.4
    if name=='cash':
        t=T(.6); y=(sin(2093,t)+sin(3136,t)*.6)*np.exp(-t*9)*.45
        for j in range(4):
            s=int(j*.05*SR); y[s:s+200]+=rng.standard_normal(200)*.5
        return y
    if name=='boing': t=T(.5); f=300+250*np.sin(np.pi*np.minimum(t/.35,1))+ 20*np.sin(2*np.pi*22*t); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*5)*.7
    if name=='alarm': t=T(.42); f=np.where((t%.2)<.1,2000,1600); return np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))*.35*np.where((t%.2)<.16,1,0)
    if name=='splash': t=T(.7); return lp(rng.standard_normal(len(t)),14)*np.exp(-t*6)*2.2
    if name=='freeze': t=T(.7); return (rng.standard_normal(len(t))*.25+sin(3400,t)*.2)*(0.5+0.5*np.sin(2*np.pi*30*t))*np.exp(-t*3)
    if name=='scratch': t=T(.38); f=900*np.exp(-t*3)*(1+.6*np.sin(2*np.pi*9*t)); return (np.sign(np.sin(2*np.pi*np.cumsum(f)/SR))*.25+rng.standard_normal(len(t))*.25)*np.exp(-t*4)
    if name=='snore': t=T(.9); return lp(rng.standard_normal(len(t)),60)*(np.sin(np.pi*t/.9)**2)*4.5+sin(70,t)*.15*np.sin(np.pi*t/.9)
    if name=='type':
        y=np.zeros(int(.5*SR))
        for j in range(8):
            s=int(j*.06*SR); y[s:s+250]+=rng.standard_normal(250)*np.exp(-np.arange(250)/40)*.5
        return y
    if name=='crickets':
        y=np.zeros(int(1.4*SR)); tt=np.arange(1800)/SR; ch=sin(4300,tt)*np.hanning(1800)*.25
        for st in [0,.11,.22,.9,1.01,1.12]:
            s=int(st*SR); y[s:s+1800]+=ch
        return y
    if name=='tick': t=T(.05); return sin(1800,t)*np.exp(-t*90)*.5
    if name=='fanfare':
        y=np.zeros(int(1.4*SR)); [put(y,i*.13,note(mtof(m),.5 if i>3 else .12,'saw',.35),.35) for i,m in enumerate([60,64,67,72,76,79])]; return y
    if name=='sad':
        y=np.zeros(int(3.0*SR)); tt=0
        for m,d in [(62,.5),(61,.5),(60,.5),(59,1.3)]: put(y,tt,lp(note(mtof(m),d,'saw',.6,a=.05,vib=(0 if d<1 else 30),rel=.05),60),.5); tt+=d
        return y
    return sfx('thud')
def blip(base,w,seed):
    f=base*(1+.4*np.sin(seed*1.9)); t=T(.055); y={'tri':tri,'sq':lambda f,t:sq(f,t,.4),'sin':sin}[w](f,t); return y*np.hanning(len(t))*.5

M=np.zeros(N); S=np.zeros(N); V=np.zeros(N)
for a,b,st in ev['music']: put(M,a,mus(st,b-a),1.0)
for t,n,g in ev['sfx']: put(S,t,sfx(n),g)
spk={'rex':(560,'tri'),'greg':(150,'sq'),'bot':(950,'sq')}
for t,who,nc in ev['words']:
    base,w=spk[who]
    for k in range(min(max(2,nc//2),5)): put(V,t+k*.058,blip(base,w,t*7+k*1.3+nc),.55 if who=='greg' else .6)
# gentle music ducking under voice blips
k=int(.12*SR); cs=np.cumsum(np.abs(V)); env=(cs-np.roll(cs,k))/k; env[:k]=0; env=np.roll(env,-k//2); duck=1-.45*np.clip(env*12,0,1)
mix=M*.55*duck+S*.8+V*.9
mix=np.tanh(mix*1.3)/np.tanh(1.3); mix=mix/max(1e-9,np.abs(mix).max())*.92
mix=mix[:int(ev['dur']*SR)]
w=wave.open(out,'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix*32767).astype(np.int16).tobytes()); w.close()
