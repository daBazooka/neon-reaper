#!/bin/bash
# usage: ./build.sh <project> <land|port> <out.mp4>    e.g. ./build.sh ep1 land ../videos/dark/bulletin-01.mp4
set -e; P=$1; O=$2; OUT=$3; FPS=30; HERE=$(cd $(dirname $0); pwd)
WORK=${WORK:-/tmp/bha-build}/$P; rm -rf $WORK; mkdir -p $WORK $(dirname $OUT)
export NODE_PATH=${NODE_PATH:-$(npm root -g)}
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
node $HERE/render.js $P $O events $WORK
for i in 0 1 2 3; do node $HERE/render.js $P $O $FPS $WORK $i 4 & done; wait
python3 $HERE/audio.py $WORK/events.json $WORK/a.wav
$FF -loglevel error -y -framerate $FPS -i $WORK/f%06d.jpg -i $WORK/a.wav -c:v libx264 -pix_fmt yuv420p ${ENC:--crf 21 -preset medium} -c:a aac -b:a 160k -shortest -movflags +faststart $OUT
echo built $OUT
