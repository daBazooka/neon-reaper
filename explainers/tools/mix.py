"""Mix voice-over + music bed + video into the final MP4.
usage: python3 mix.py <workdir with video.mp4 & music.raw> <vo dir (line*.wav + timing.json)> <out.mp4>"""
import json, subprocess, sys, glob, os, imageio_ffmpeg
work, vo, out = sys.argv[1:4]
ff = imageio_ffmpeg.get_ffmpeg_exe()
timing = json.load(open(f'{vo}/timing.json')); wavs = [f'{vo}/line{i:02d}.wav' for i in range(len(timing))]
LOOP = 18 * 4 * 60 / 110
cmd = [ff, '-y', '-i', f'{work}/video.mp4', '-f', 's16le', '-ar', '44100', '-ac', '2', '-i', f'{work}/music.raw']
for w in wavs: cmd += ['-i', w]
f = ['[1:a]volume=0.8[m]']
for i, t in enumerate(timing):
    ms = int(t['t'] * 1000); f.append(f'[{i+2}:a]aresample=44100,pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}[v{i}]')
f.append(''.join(f'[v{i}]' for i in range(len(wavs))) + f'amix=inputs={len(wavs)}:normalize=0:duration=longest[vraw]')
f.append('[vraw]highpass=f=75,equalizer=f=250:t=q:w=1:g=1.5,equalizer=f=3500:t=q:w=1.2:g=2.5,acompressor=threshold=-22dB:ratio=3:attack=5:release=90:makeup=4,asplit[vo][sc]')
f.append('[m][sc]sidechaincompress=threshold=0.02:ratio=9:attack=12:release=400[md]')
f.append(f'[md][vo]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=8,atrim=0:{LOOP:.3f}[aout]')
cmd += ['-filter_complex', ';'.join(f), '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', f'{LOOP:.3f}', '-movflags', '+faststart', out]
subprocess.run(cmd, check=True, stderr=subprocess.DEVNULL)
print('wrote', out)
