#!/bin/bash
# Full build: Word file (with embedded fonts and a numbered contents page) and print PDF.
set -e
cd "$(dirname "$0")"
OUT=../output/Burn_to_Become_Illustrated_Manuscript
for pass in 1 2; do
  node build_docx.js
  node embed_fonts.js $OUT.docx
  /usr/bin/python3 make_pdf.py $OUT.docx $OUT.pdf 2>&1 | grep -v javaldx
  python3 toc_pages.py $OUT.pdf
done
