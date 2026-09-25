# Burn to Become — illustrated manuscript

- `output/Burn_to_Become_Illustrated_Manuscript.docx` — editable Word manuscript (6 × 9 in). On first open, Word asks to update fields; say **Yes** so the Contents page fills in with page numbers.
- `output/Burn_to_Become_Illustrated_Manuscript.pdf` — print-ready preview (200 pages).
- `manuscript/*.txt` — the book text, in reading order. Edit these, then rebuild.
- `illustrations/illus.html` — source for all 26 original illustrations; `images/` holds the rendered files.

## Rebuild
```
node build/render_illustrations.js        # needs playwright-core + Chromium (only if art changes)
node build/build_docx.js                  # needs the `docx` npm package
python3 build/make_pdf.py output/Burn_to_Become_Illustrated_Manuscript.docx output/Burn_to_Become_Illustrated_Manuscript.pdf
```

## Manuscript markup
`@part`, `@chapter`, `@front` start new pages; `###` section heading; `>` pull quote; `!fig name | caption` illustration;
`@exercise Title … @end` boxed exercise; `@table Title … @endtable` worksheet; `@plate text` full-page quote plate; `@note cue | citation` endnote.
