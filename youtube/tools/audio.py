# usage: python3 audio.py <trailer|stamp> out.wav   (synthesised SFX, no external assets)
import sys, numpy as np, wave
sr=44100; name,out=sys.argv[1],sys.argv[2]
dur=28 if name=='trailer' else 3
y=np.zeros(int(sr*dur)); rng=np.random.default_rng(1)
def add(t,s,g=1.0):
    i=int(t*sr); s=s[:len(y)-i]; y[i:i+len(s)]+=s*g
def thud(): 
    t=np.arange(int(.6*sr))/sr; return (np.sin(2*np.pi*(55+120*np.exp(-t*18))*t)*np.exp(-t*7)+rng.standard_normal(len(t))*np.exp(-t*40)*.5)
def whoosh(d=.5):
    t=np.arange(int(d*sr))/sr; n=rng.standard_normal(len(t)); k=np.ones(60)/60
    return np.convolve(n,k,'same')*np.sin(np.pi*t/d)**2*.6
def tick():
    t=np.arange(int(.05*sr))/sr; return np.sin(2*np.pi*1800*t)*np.exp(-t*90)*.5
def ding():
    t=np.arange(int(.5*sr))/sr; return np.sin(2*np.pi*1320*t)*np.exp(-t*8)*.4
if name=='trailer':
    for t in (1.0,1.5,2.0,3.6,7.6,12.6,20.2,24.2): add(t,whoosh(.4),.6)
    for k in range(int((7.5-3.7)*2)): add(3.7+k*.5,tick(),.7)
    for t in (12.8,15.5,18.0): add(t,thud(),1.0)
    for t in (21.0,21.2,21.4): add(t,ding(),.6)
    add(26.3,thud(),.8)
else:
    add(.5,thud(),1.0)
y=np.clip(y/max(1e-9,np.abs(y).max())*.9,-1,1)
w=wave.open(out,'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((y*32767).astype(np.int16).tobytes()); w.close()
