# usage: python3 audio.py events.json out.wav   — fully synthesised soundtrack (no samples).
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

M=ambient()
for t,n in ev['snd']:
    if n=='jingle': put(M,t,jingle(False),.55)
    elif n=='jingleBad': put(M,t,jingle(True),.6)
    elif n=='thunk': put(M,t,thunk(),.8)
    elif n=='swell': put(M,t,swell(),.55)
    elif n=='door': put(M,t,door(),.7)
    elif n=='swipe': put(M,t,swipe(),.45)
    elif n=='ping': put(M,t,ping(),.6)
    elif n=='warm': put(M,t,warm(),1.0)
for t in ev['clicks']: put(M,t,click(),.5)
for a,b in ev['ticks']:
    tt=a; k=0
    while tt<b:
        put(M,tt,tick(),.5); prog=(tt-a)/(b-a); tt+=max(.07,1.0/(1+7*prog**2))
for t,ch,cps,kind in ev['typ']:
    if kind=='ghost': continue
    g=.05 if kind in('rule','plain','adv') else .04
    for i in range(int(ch)):
        if rng.random()<.85: put(M,t+i/cps,key(),g)
for a,b,*rest in ev['spec']: put(M,a,spec(min(8,b-a),rest[0] if rest else 'LOOK UP'),1.0)
# tape stop: everything decays, then the stop sound
stops=[t for t,n in ev['snd'] if n=='tapestop']
if stops:
    ts=stops[0]; tt=np.arange(len(M))/SR
    M*=np.where(tt<ts,1.0,np.clip(1-(tt-ts)/1.4,0,1)**1.5)
    put(M,ts,tapestop(),.9)
# global fades
f=int(.5*SR); M[:f]*=np.linspace(0,1,f); e=int(DUR*SR); M=M[:e]; M[-f:]*=np.linspace(1,0,f)
M=np.tanh(M*1.2)/np.tanh(1.2); M=M/max(1e-9,np.abs(M).max())*.9
w=wave.open(out,'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((M*32767).astype(np.int16).tobytes()); w.close()
