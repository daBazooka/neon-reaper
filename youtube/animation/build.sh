#!/bin/bash
# usage: ./build.sh <project> <W> <H> <outfile.mp4>   e.g. ./build.sh short-4am 1080 1920 ../videos/animated/short-4am.mp4
set -e; P=$1; W=$2; H=$3; OUT=$4; FPS=30; HERE=$(cd $(dirname $0); pwd)
WORK=${WORK:-/tmp/rex-build}/$P; rm -rf $WORK; mkdir -p $WORK $(dirname $OUT)
export NODE_PATH=${NODE_PATH:-$(npm root -g)}
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
node $HERE/render.js $P $W $H $FPS $WORK 0 4 &
for i in 1 2 3; do node $HERE/render.js $P $W $H $FPS $WORK $i 4 & done
node $HERE/render.js $P $W $H events $WORK
wait
python3 $HERE/audio.py $WORK/events.json $WORK/a.wav
$FF -loglevel error -y -framerate $FPS -i $WORK/f%06d.jpg -i $WORK/a.wav -c:v libx264 -pix_fmt yuv420p -crf 19 -preset medium -c:a aac -b:a 160k -shortest -movflags +faststart $OUT
echo built $OUT
