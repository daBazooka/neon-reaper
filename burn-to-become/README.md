# Burn to Become — illustrated manuscript

- `output/Burn_to_Become_Illustrated_Manuscript.docx` — editable Word manuscript (6 × 9 in), with the EB Garamond typeface embedded so Word shows the same pages as the PDF.
- `output/Burn_to_Become_Illustrated_Manuscript.pdf` — full-quality print PDF.
- `output/Burn_to_Become_Preview.pdf` — small (~1 MB) PDF for reading on screen and phones.
- `manuscript/*.txt` — the book text, in reading order. Edit these, then rebuild.
- `illustrations/illus.html` — source for all 26 original illustrations; `images/` holds the rendered files.

## Rebuild
```
node build/render_illustrations.js        # needs playwright-core + Chromium (only if art changes)
build/build_all.sh                        # Word file + PDF, two passes so the numbered Contents has real page numbers
python3 build/make_pdf.py output/Burn_to_Become_Illustrated_Manuscript.docx output/Burn_to_Become_Preview.pdf --preview
```

## Manuscript markup
`@part`, `@chapter`, `@front` start new pages; `###` section heading; `>` pull quote; `!fig name | caption` illustration;
`@exercise Title … @end` boxed exercise; `@table Title … @endtable` worksheet; `@plate text` full-page quote plate; `@note cue | citation` endnote.
