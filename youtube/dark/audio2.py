# usage: python3 audio2.py events.json out.wav   (stereo + reverb + composed score)   — fully synthesised soundtrack (no samples).
import sys, json, wave, numpy as np
SR=44100; ev=json.load(open(sys.argv[1])); out=sys.argv[2]
DUR=ev['dur']; N=int(DUR*SR)+SR; rng=np.random.default_rng(11)
def T(d): return np.arange(int(d*SR))/SR
def ma(x,k):
    k=max(1,int(k)); cs=np.cumsum(np.insert(x,0,0)); y=(cs[k:]-cs[:-k])/k; return np.pad(y,(k//2,len(x)-len(y)-k//2))
def put(buf,t,a,g=1.):
    i=int(t*SR)
    if i>=len(buf) or i<0: return
    a=a[:len(buf)-i]; buf[i:i+len(a)]+=a*g
mtof=lambda m: 440*2**((m-69)/12)
def interp(pairs,t):
    p=np.array(pairs); return np.interp(t,p[:,0],p[:,1])

# ---------- ambient bed ----------
def ambient():
    t=np.arange(N)/SR; L=interp(ev['amb'],t)
    brown=np.cumsum(rng.standard_normal(N)); brown-=ma(brown,SR//2); brown/=max(1e-9,np.abs(brown).max())
    white=rng.standard_normal(N); hiss=white-ma(white,4)
    wow=1+.15*np.sin(2*np.pi*.37*t)+.1*np.sin(2*np.pi*.11*t+1)
    hum=(np.sin(2*np.pi*50*t)+.5*np.sin(2*np.pi*100*t)+.25*np.sin(2*np.pi*150*t))*.02
    # drone: detuned low saws, softened, breathing with the "glow"
    def saw(f): return 2*((f*t)%1)-1
    dr=saw(55)+saw(55.4)+.6*saw(82.6)+.5*saw(41.2)
    dr=ma(dr,40)*(.6+.4*np.sin(2*np.pi*.07*t))
    shim=(np.sin(2*np.pi*440*t)+np.sin(2*np.pi*442.2*t)+np.sin(2*np.pi*659.3*t)*.5)*(.5+.5*np.sin(2*np.pi*.05*t+2))
    y=brown*.05*(.4+L)+hiss*(.010+.016*L)*wow+hum*(.5+.5*L)+dr*.12*L**1.4+shim*.006*L**2
    cr=interp(ev['crowd'],t) if ev.get('crowd') else None
    if cr is not None and cr.max()>0:
        mur=np.zeros(N)
        for k in range(7):
            w=rng.standard_normal(N); bp=ma(w,int(SR/(400+k*230)))-ma(w,int(SR/(120+k*70)))
            am=(.5+.5*np.sin(2*np.pi*(2.6+k*.63)*t+k*1.9))**2*(.6+.4*np.sin(2*np.pi*(.31+k*.07)*t))
            mur+=bp*am
        mur/=max(1e-9,np.abs(mur).max()); y=y+mur*cr**1.3*.20
    return y
# ---------- one-shots ----------
def env(n,a,dec): t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/dec)
def bell(f,d,warp=0,rate=.9,vib=0):
    t=T(d); tw=t+warp*np.sin(2*np.pi*rate*t)/(2*np.pi*rate)
    y=np.sin(2*np.pi*f*tw)+.5*np.sin(2*np.pi*f*2.0*tw)*np.exp(-t*6)+.25*np.sin(2*np.pi*f*4.2*tw)*np.exp(-t*14)
    return y*env(len(t),.004,d*.35)
def jingle(bad=False):
    y=np.zeros(int(9*SR))
    if not bad:
        bpm=100; notes=[72,76,79,76,72,67,72]; durs=[.5,.5,.5,.5,.5,.5,1.6]
        t0=0
        for m,d in zip(notes,durs):
            put(y,t0*60/bpm*2,bell(mtof(m),1.6),.32); put(y,t0*60/bpm*2,bell(mtof(m-12),1.6),.14); t0+=d
        put(y,0,np.sin(2*np.pi*mtof(48)*T(6))*env(int(6*SR),.05,1.5),.12)
    else:
        notes=[72,75,79,75,72,67,72]; t0=0.0
        for k,m in enumerate(notes):
            d=1.1 if k<6 else 3.4
            b=bell(mtof(m-.35),d+1.2,warp=.02+k*.004,rate=.8)
            b=ma(b,6); put(y,t0,b,.34); put(y,t0+.02,bell(mtof(m-12.3),d+1.2,warp=.03),.18); t0+=1.15
        put(y,0,np.sin(2*np.pi*mtof(36)*T(9))*env(int(9*SR),.5,3),.16)
    return y
def thunk():
    t=T(1.0); th=np.sin(2*np.pi*np.cumsum(70+80*np.exp(-t*20))/SR)*np.exp(-t*7)
    st=rng.standard_normal(len(t)); st=(st-ma(st,3))*np.exp(-t*9)*.4
    whine=np.sin(2*np.pi*np.cumsum(600+3000*np.minimum(t/.5,1))/SR)*np.exp(-t*5)*.08
    return th*.9+st+whine
def swell():
    t=T(4.0); f=48-12*(t/4); y=np.sin(2*np.pi*np.cumsum(f)/SR)
    n=rng.standard_normal(len(t)); n=ma(n,60)*4
    e=np.minimum(1,t/1.4)*np.exp(-np.maximum(0,t-1.4)/1.3); return (y*.9+n*.3)*e
def click():
    t=T(.06); return (np.sin(2*np.pi*2400*t)*np.exp(-t*150)*.5+np.sin(2*np.pi*90*t)*np.exp(-t*60)*.6)
def tick():
    t=T(.05); return np.sin(2*np.pi*1500*t)*np.exp(-t*110)*.7+(rng.standard_normal(len(t))*np.exp(-t*200))*.2
def door():
    t=T(.5); th=np.sin(2*np.pi*70*t)*np.exp(-t*14); lat=np.zeros(len(t)); s=int(.13*SR); tt=np.arange(600)/SR; lat[s:s+600]=np.sin(2*np.pi*1900*tt)*np.exp(-tt*300)*.5
    return th*.9+lat+ma(rng.standard_normal(len(t)),30)*np.exp(-t*14)*3
def tapestop():
    t=T(1.6); f=700*np.exp(-t*2.6)+25; y=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*1.4)*.45
    n=rng.standard_normal(len(t)); n=ma(n,int(3+t.size*0)) *np.exp(-t*2.2)*.9; return y+n
def swipe():
    t=T(.18); n=rng.standard_normal(len(t)); n=ma(n,max(3,int(40-t.size*0)))*np.sin(np.pi*t/.18)**2; return n*2.2
def ping():
    t=T(.5); return (np.sin(2*np.pi*1760*t)+.5*np.sin(2*np.pi*2640*t))*np.exp(-t*9)*.35
def warm():
    d=9.0; t=T(d); y=np.zeros(len(t))
    for f in (174.6,220,261.6,329.6,392): y+=np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*f*2.003*t)
    e=np.minimum(1,t/3.5)*np.minimum(1,(d-t)/2.5); return y*e*.06
def key():
    t=T(.012); return (rng.standard_normal(len(t))*np.exp(-t*500)*.6+np.sin(2*np.pi*1300*t)*np.exp(-t*400)*.4)
def select():
    t=T(.35); return (np.sin(2*np.pi*(660+900*np.minimum(t/.08,1))*t)*np.exp(-t*14)*.45+np.sin(2*np.pi*90*t)*np.exp(-t*30)*.5)
def lock():
    t=T(1.1); return np.sin(2*np.pi*np.cumsum(48+40*np.exp(-t*12))/SR)*np.exp(-t*4.5)*.95+ma(rng.standard_normal(len(t)),6)*np.exp(-t*40)*.9
def scan(d=2.4):
    t=T(d); f=400+2600*(t/d)**1.5; return np.sin(2*np.pi*np.cumsum(f)/SR)*.12*np.sin(np.pi*t/d)**2
FONT={'L':['#....','#....','#....','#....','#....','#....','#####'],'O':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
 'K':['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],'U':['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
 'P':['####.','#...#','#...#','####.','#....','#....','#....'],'I':['#####','..#..','..#..','..#..','..#..','..#..','#####'],'S':['.####','#....','#....','.###.','....#','....#','####.'],'T':['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
 'E':['#####','#....','#....','####.','#....','#....','#####'],'N':['#...#','##..#','##..#','#.#.#','#..##','#..##','#...#'],' ':['.....']*7}
def spec(d,word='LOOK UP'):  # writes the word into the spectrogram (5..12 kHz), very quiet — visible in Audacity/Sonic Visualiser
    cols=[]
    for ch in word:
        g=FONT[ch]
        for cx in range(5): cols.append([g[r][cx]=='#' for r in range(7)])
        cols.append([False]*7)
    cd=d/len(cols); y=np.zeros(int(d*SR)); freqs=[12000-r*1000 for r in range(7)]
    for i,col in enumerate(cols):
        a=int(i*cd*SR); n=int(cd*SR); t=np.arange(n)/SR; w=np.hanning(n)
        for r,on in enumerate(col):
            if on: y[a:a+n]+=np.sin(2*np.pi*freqs[r]*t)*w
    return y*.05


FONT.update({'D':['####.','#...#','#...#','#...#','#...#','#...#','####.'],'Y':['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..'],'G':['.###.','#...#','#....','#.###','#...#','#...#','.###.'],'C':['.####','#....','#....','#....','#....','#....','.####'],'A':['.###.','#...#','#...#','#####','#...#','#...#','#...#'],'H':['#...#','#...#','#...#','#####','#...#','#...#','#...#'],'M':['#...#','##.##','#.#.#','#...#','#...#','#...#','#...#']})

# ------------------------- stereo helpers -------------------------
def pan_g(p): a=(p+1)*np.pi/4; return np.cos(a),np.sin(a)
def put2(buf,t,a,g=1.,pan=0.):
    i=int(t*SR)
    if i>=buf.shape[1] or i<0: return
    a=a[:buf.shape[1]-i]; gl,gr=pan_g(pan)
    buf[0,i:i+len(a)]+=a*g*gl; buf[1,i:i+len(a)]+=a*g*gr
def fftconv(x,h):
    n=len(x)+len(h)-1; nf=1<<(n-1).bit_length()
    return np.fft.irfft(np.fft.rfft(x,nf)*np.fft.rfft(h,nf),nf)[:len(x)]
def make_ir(sec,seed,dark=8):
    r=np.random.default_rng(seed); n=int(sec*SR); t=np.arange(n)/SR
    x=r.standard_normal(n)*np.exp(-t*(6.9/sec)); x=ma(x,dark); k=int(.014*SR); x[:k]*=np.linspace(0,1,k)
    return x/np.sqrt((x**2).sum())
def reverb(bus,sec,wet,gain=3.0):
    o=np.zeros_like(bus)
    for ch in (0,1): o[ch]=fftconv(bus[ch],make_ir(sec,int(sec*100)+ch))
    return bus*(1-wet)+o*wet*gain

# ------------------------- new one-shots -------------------------
def modem():
    y=np.zeros(int(7*SR)); dt=[(697,1209),(770,1336),(852,1477),(941,1209),(697,1336),(770,1477),(852,1209)]
    for i,(a,b) in enumerate(dt):
        t=np.arange(int(.09*SR))/SR; put(y,i*.13,(np.sin(2*np.pi*a*t)+np.sin(2*np.pi*b*t))*.22*np.hanning(len(t)),1)
    t=np.arange(int(5.5*SR))/SR
    f=np.where(t<1.2,2100,np.where(t<2.4,1200+300*np.sin(2*np.pi*11*t),np.where(t<3.6,2400+200*np.sin(2*np.pi*23*t),1800+700*np.sin(2*np.pi*3*t))))
    s=np.sin(2*np.pi*np.cumsum(f)/SR)*.22+(rng.standard_normal(len(t))*.07)*(t>1.2)
    put(y,1.0,s*np.minimum(1,t/.05)*np.minimum(1,(5.5-t)/.3),1); return y
def knock():
    t=np.arange(int(.35*SR))/SR; return np.sin(2*np.pi*(150+60*np.exp(-t*40))*t)*np.exp(-t*22)+ma(rng.standard_normal(len(t)),24)*np.exp(-t*60)*2.5
def ring():
    y=np.zeros(int(2.6*SR))
    for k in range(2):
        t=np.arange(int(.95*SR))/SR; s=np.sin(2*np.pi*1400*t)+.6*np.sin(2*np.pi*1900*t)+.4*np.sin(2*np.pi*870*t)
        am=np.sign(np.sin(2*np.pi*24*t))*.5+.5; put(y,k*1.25,s*am*np.minimum(1,t/.02)*np.minimum(1,(.95-t)/.05)*np.exp(-t*.8)*.28,1)
    return y
def buzz():
    t=np.arange(int(.7*SR))/SR; return np.sign(np.sin(2*np.pi*118*t))*.25*(np.sign(np.sin(2*np.pi*28*t))*.5+.5)*np.minimum(1,t/.02)*np.minimum(1,(.7-t)/.05)+ma(rng.standard_normal(len(t)),8)*.12*(np.sign(np.sin(2*np.pi*28*t))*.5+.5)
def paper():
    t=np.arange(int(1.4*SR))/SR; n=ma(rng.standard_normal(len(t)),18)*np.sin(np.pi*t/1.4)**1.5; return n*3.0


def riser(d=4.2):
    t=np.arange(int(d*SR))/SR; f=300*(20**(t/d)); s=np.sin(2*np.pi*np.cumsum(f)/SR)*.25+ma(rng.standard_normal(len(t)),max(2,4))*1.6*(t/d)
    return s*(t/d)**2*np.minimum(1,(d-t)/.05)*.9
def hit():
    t=np.arange(int(1.6*SR))/SR; return np.sin(2*np.pi*np.cumsum(62*np.exp(-t*2.2)+34)/SR)*np.exp(-t*2.6)*.95+ma(rng.standard_normal(len(t)),10)*np.exp(-t*14)*1.6
def wind(d=4.5):
    t=np.arange(int(d*SR))/SR; return ma(rng.standard_normal(len(t)),38)*(np.sin(np.pi*t/d)**2)*(0.6+0.4*np.sin(2*np.pi*.9*t))*5
def chair():
    t=np.arange(int(.7*SR))/SR; return ma(rng.standard_normal(len(t)),14)*np.exp(-t*4)*np.minimum(1,t/.03)*4.5
def foot():
    t=np.arange(int(.16*SR))/SR; return np.sin(2*np.pi*88*t)*np.exp(-t*30)*.8+ma(rng.standard_normal(len(t)),22)*np.exp(-t*40)*2
def creak(d=2.6):
    t=np.arange(int(d*SR))/SR; f=190+70*np.sin(2*np.pi*.55*t)+25*np.sin(2*np.pi*7.3*t); y=np.sin(2*np.pi*np.cumsum(f)/SR)+.5*np.sin(4*np.pi*np.cumsum(f)/SR)
    return (y*.22+ma(rng.standard_normal(len(t)),20)*.7)*np.sin(np.pi*t/d)**1.4*(.6+.4*np.sign(np.sin(2*np.pi*13*t)))
def birds(d=3.2):
    y=np.zeros(int(d*SR)); r=np.random.default_rng(int(d*1000))
    for k in range(7):
        st=r.uniform(0,d-1); f0=3000+r.uniform(0,1800)
        for j in range(r.integers(2,5)):
            t=np.arange(int(.1*SR))/SR; ch=np.sin(2*np.pi*np.cumsum(f0*(1+.45*t/.1)+np.sin(t*80)*120)/SR)*np.hanning(len(t))*.12; put(y,st+j*.14,ch,1)
    return y
def whirr():
    t=np.arange(int(.8*SR))/SR; return ma(rng.standard_normal(len(t)),6)*np.sin(np.pi*t/.8)*1.1+np.sin(2*np.pi*np.cumsum(300+500*t/.8)/SR)*.08*np.sin(np.pi*t/.8)
def pickup():
    t=np.arange(int(.3*SR))/SR; return np.sin(2*np.pi*140*t)*np.exp(-t*28)*.7+(np.sin(2*np.pi*2400*t)*np.exp(-t*160))*.35
def rewind():
    t=np.arange(int(.95*SR))/SR; return (ma(rng.standard_normal(len(t)),5)*(.5+.5*np.sin(2*np.pi*28*t))*1.3+np.sin(2*np.pi*np.cumsum(1200+1200*t/.95)/SR)*.12)*np.sin(np.pi*t/.95)**.6
def heart():
    y=np.zeros(int(.6*SR)); t=np.arange(int(.22*SR))/SR; th=np.sin(2*np.pi*np.cumsum(70*np.exp(-t*14)+42)/SR)*np.exp(-t*16)
    put(y,0,th,1); put(y,.2,th,.7); return y

# ------------------------- composed score -------------------------
def mbox(dur,lvl,seed=3):
    r=np.random.default_rng(seed); n=int(dur*SR)+SR; out=np.zeros((2,n)); bpm=58; step=60/bpm/2
    scale=[57,60,64,67,69,72,76]; pat=[0,2,4,2,1,3,5,3]; k=0; t0=0.0
    while t0<dur:
        bar=int(t0/(step*8)); tr=[0,0,-3,-5][bar%4]; idx=pat[k%8]+(2 if (bar%4==3 and k%8>4) else 0); m=scale[min(idx,6)]+tr; pan=np.sin(k*.7)*.5
        if r.random()<.93: put2(out,t0,bell(mtof(m+12),3.0),.10*(.5+lvl),pan)
        if lvl>.6 and r.random()<.35: put2(out,t0+step*.5,bell(mtof(m+24),2.0),.05*lvl,-pan)
        if k%8==0: put2(out,t0,np.sin(2*np.pi*mtof(m-24)*np.arange(int(3*SR))/SR)*env(int(3*SR),.05,1.2),.10*(.5+lvl),0)
        t0+=step; k+=1
    t=np.arange(n)/SR
    for f in (110,164.8,220,261.6,329.6):
        for ch,det in ((0,-.25),(1,.25)): out[ch]+=np.sin(2*np.pi*(f+det)*t)*(.5+.5*np.sin(2*np.pi*.05*t+f))*.010*(.4+lvl)
    return out[:,:int(dur*SR)]
def choir(dur,lvl):
    n=int(dur*SR); t=np.arange(n)/SR; out=np.zeros((2,n))
    chords=[[110,164.8,220,277.2],[87.3,130.8,174.6,261.6],[130.8,196,261.6,329.6],[82.4,123.5,164.8,207.7]]; seg=6.0
    for ci in range(int(dur/seg)+1):
        a=int(ci*seg*SR); b=min(n,int((ci+1)*seg*SR+1.5*SR))
        if a>=n: break
        tt=t[a:b]-ci*seg; e=np.minimum(1,tt/2.2)*np.minimum(1,(seg+1.5-tt)/1.5)
        for f0 in chords[ci%4]:
            for ch,det in ((0,-.3),(1,.3)):
                y=np.zeros(len(tt)); vib=1+.004*np.sin(2*np.pi*5.1*tt+ch)
                for h in range(1,13):
                    fh=(f0+det)*h; w=np.exp(-((fh-800)/350)**2)+.6*np.exp(-((fh-1250)/450)**2)+.2*np.exp(-((fh-2600)/700)**2); y+=w*np.sin(2*np.pi*fh*tt*vib)/h**.3
                out[ch,a:b]+=y*e*.007*(.3+lvl)
    return out

# ------------------------- build the buses -------------------------
AMB=np.stack([ambient(),ambient()]); SFX=np.zeros((2,N)); MUS=np.zeros((2,N)); DRY=np.zeros((2,N))
SND={'jingle':(lambda:jingle(False),.55,0),'jingleBad':(lambda:jingle(True),.6,0),'thunk':(thunk,.8,0),'swell':(swell,.55,0),'door':(door,.7,-.5),'swipe':(swipe,.45,0),'ping':(ping,.6,.3),'warm':(warm,1.0,0),'modem':(modem,.5,0),'knock':(knock,.9,-.6),'ring':(ring,.55,.45),'buzz':(buzz,.6,-.5),'paper':(paper,.5,-.5),'riser':(riser,.55,0),'hit':(hit,.85,0),'wind':(wind,.5,-.3),'chair':(chair,.6,.4),'foot':(foot,.5,.2),'select':(select,.55,0),'lock':(lock,.8,0),'scan':(scan,.6,.2),'creak':(creak,.5,-.5),'birds':(birds,.6,.3),'whirr':(whirr,.45,.3),'pickup':(pickup,.6,.3),'rewind':(rewind,.6,0)}
for t,n in ev['snd']:
    if n in SND:
        fn,g,p=SND[n]; put2(SFX,t,fn(),g,p)
for t in ev['clicks']: put2(SFX,t,click(),.5,0)
for a,b in ev['ticks']:
    tt=a
    while tt<b: put2(SFX,tt,tick(),.5,.35); prog=(tt-a)/(b-a); tt+=max(.07,1.0/(1+7*prog**2))
for t,ch,cps,kind in ev['typ']:
    if kind=='ghost': continue
    g=.05 if kind in('rule','plain','adv') else .04
    for i in range(int(ch)):
        if rng.random()<.85: put2(SFX,t+i/cps,key(),g,rng.uniform(-.2,.2))
for a,b,cps in ev.get('keys',[]):
    tt=a
    while tt<b: put2(SFX,tt,key(),.16,rng.uniform(-.35,.35)); tt+=(1/cps)*rng.uniform(.5,1.7)
hm=ev.get('hum') or []
if hm and max(v for _,v in hm)>0:
    tt_=np.arange(N)/SR; lv=np.interp(tt_,[p[0] for p in hm],[p[1] for p in hm])
    for ch in (0,1):
        AMB[ch]+=(np.sin(2*np.pi*(60+ch*.3)*tt_)+.5*np.sin(2*np.pi*120*tt_)+.3*np.sin(2*np.pi*180.4*tt_))*.03*lv
    del tt_,lv
nat=ev.get('nature') or []
if nat and max(v for _,v in nat)>0:
    tt_=np.arange(N)/SR; lv=np.interp(tt_,[p[0] for p in nat],[p[1] for p in nat])
    for ch in (0,1):
        cr=np.zeros(N)
        for k in range(5):
            f=4100+k*230+ch*40; gate=(np.sin(2*np.pi*(.83+k*.11+ch*.03)*tt_+k*1.7+ch)>.55)*(.5+.5*np.sign(np.sin(2*np.pi*(36+k*2.7)*tt_)))
            cr+=np.sin(2*np.pi*f*tt_)*gate
        wd=ma(rng.standard_normal(N),44)*(.5+.5*np.sin(2*np.pi*.07*tt_+ch*2))*6
        AMB[ch]+=(cr*.012+wd*.05)*lv
    del tt_,lv
for a,b,bpm0,bpm1,lvl in ev.get('pulse',[]):
    tt=a
    while tt<b:
        put2(SFX,tt,heart(),lvl,0); bpm=bpm0+(bpm1-bpm0)*(tt-a)/max(1e-9,(b-a)); tt+=60/bpm
for a,b,st,lvl in ev.get('music',[]):
    m=(mbox(b-a,lvl,seed=int(a)) if st=='mbox' else choir(b-a,lvl)); i=int(a*SR); m=m[:,:MUS.shape[1]-i]; MUS[:,i:i+m.shape[1]]+=m
for a,b,*rest in ev['spec']:
    put2(DRY,a,spec(min(10,b-a),rest[0] if rest else 'LOOK UP'),1.0,0)
stops=[t for t,n in ev['snd'] if n=='tapestop']
if stops:
    ts=stops[0]; tt=np.arange(N)/SR; ramp=np.where(tt<ts,1.0,np.clip(1-(tt-ts)/1.4,0,1)**1.5)
    for b in (AMB,SFX,MUS,DRY): b*=ramp
    put2(SFX,ts,tapestop(),.9,0)
mix=AMB*.75+reverb(SFX,1.7,.30)*.9+reverb(MUS,3.6,.55)*.55+DRY
f=int(.5*SR); e=int(DUR*SR); mix=mix[:,:e]; mix[:,:f]*=np.linspace(0,1,f); mix[:,-f:]*=np.linspace(1,0,f)
mix=np.tanh(mix*1.0)/np.tanh(1.0); mix=mix/max(1e-9,np.abs(mix).max())*.88
w=wave.open(out,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix.T*32767).astype(np.int16).tobytes()); w.close()
