#!/usr/bin/env bash
# Edge-detect the source Golden Gate Bridge photo and vector-trace it to
# public/ggb-wireframe.svg (hero backdrop). Requires: imagemagick, potrace.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="${1:-ChatGPT Image Jun 19, 2026, 12_23_28 PM.png}"
magick "$SRC" -resize 1600x -colorspace Gray -blur 0x0.7 \
  -canny 0x1+7%+22% -morphology Dilate Octagon:1 -negate /tmp/ggb-edges.pbm
potrace /tmp/ggb-edges.pbm -s -t 14 -O 0.45 -o /tmp/ggb-trace.svg
sed 's/fill="#000000"/fill="#F97316"/g' /tmp/ggb-trace.svg > public/ggb-wireframe.svg
echo "wrote public/ggb-wireframe.svg"
