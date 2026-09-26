// Builds output/Burn_to_Become.docx from manuscript/*.txt and images/*.png
// Usage: node build_docx.js   (requires the `docx` npm package)
const fs = require('fs');
const path = require('path');
const d = require(process.env.DOCXLIB || 'docx');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, HeadingLevel, PageBreak,
  Header, Footer, PageNumber, TableOfContents, Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType,
  NumberFormat, LineRuleType, HeightRule, VerticalAlign, Bookmark, InternalHyperlink, TabStopType, LeaderType, Tab,
} = d;

const ROOT = path.resolve(__dirname, '..');
const IMG = (n) => { const j = path.join(ROOT, 'images', n + '.jpg'); return fs.existsSync(j) ? j : path.join(ROOT, 'images', n + '.png'); };
const TYPE = (f) => f.endsWith('.jpg') ? 'jpg' : 'png';
const FONT = 'EB Garamond';
const INK = '141414';

// ---------- page geometry: 6 x 9 in ----------
const IN = 1440;
const PAGE = { width: 6 * IN, height: 9 * IN };
const MARGIN = { top: 1.0 * IN, bottom: 0.9 * IN, left: 0.75 * IN, right: 0.75 * IN, header: 0.5 * IN, footer: 0.45 * IN };
const TEXT_W = PAGE.width - MARGIN.left - MARGIN.right; // 4.5in
const PX = (inches) => Math.round(inches * 96);

const NUMWORDS = ['ZERO','ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','ELEVEN','TWELVE','THIRTEEN','FOURTEEN','FIFTEEN','SIXTEEN','SEVENTEEN','EIGHTEEN','NINETEEN','TWENTY','TWENTY-ONE','TWENTY-TWO','TWENTY-THREE','TWENTY-FOUR','TWENTY-FIVE','TWENTY-SIX','TWENTY-SEVEN','TWENTY-EIGHT','TWENTY-NINE','THIRTY','THIRTY-ONE','THIRTY-TWO','THIRTY-THREE','THIRTY-FOUR','THIRTY-FIVE','THIRTY-SIX','THIRTY-SEVEN','THIRTY-EIGHT','THIRTY-NINE','FORTY','FORTY-ONE','FORTY-TWO','FORTY-THREE','FORTY-FOUR','FORTY-FIVE','FORTY-SIX'];
const PLATES = {
  'Potential is undefeated': 'plate_potential',
  'IT IS ME VS. ME.': 'plate_mevsme',
  'The old identity': 'plate_evidence',
  'Use anger as information': 'plate_anger',
  'Burn. But not yourself.': 'plate_burn',
  'You have to break the pattern today': 'plate_cycle',
};

// ---------- small helpers ----------
const run = (text, o = {}) => new TextRun({ text, font: FONT, ...o });
const P = (children, o = {}) => new Paragraph({ children: Array.isArray(children) ? children : [children], ...o });
const imgSize = (file) => { const b = fs.readFileSync(file);
  if (file.endsWith('.png')) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  let o = 2; while (o < b.length) { const m = b[o + 1], len = b.readUInt16BE(o + 2); if (m >= 0xC0 && m <= 0xC3) return { h: b.readUInt16BE(o + 5), w: b.readUInt16BE(o + 7) }; o += 2 + len; }
  throw new Error('bad jpeg ' + file); };
function titleCase(s) {
  const small = new Set(['a','an','the','and','but','or','of','to','in','on','for','at','by','is','it','as','vs.','with','when','you','your']);
  return s.toLowerCase().split(' ').map((w, i) => (i > 0 && small.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    .replace(/(^|[\s:—-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
}

function fullBleed(name) {
  const data = fs.readFileSync(IMG(name));
  return new ImageRun({
    type: TYPE(IMG(name)), data, transformation: { width: PX(6), height: PX(9) },
    floating: {
      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
      behindDocument: true, allowOverlap: true, lockAnchor: true, wrap: { type: TextWrappingType.NONE },
    },
    altText: { title: name, description: 'Full-page illustration', name },
  });
}
function inlineImage(name, widthIn = 4.5) {
  const file = IMG(name); const { w, h } = imgSize(file);
  return new ImageRun({ type: TYPE(file), data: fs.readFileSync(file), transformation: { width: PX(widthIn), height: PX(widthIn * h / w) },
    altText: { title: name, description: 'Illustration', name } });
}

// inline markup: *italic* only
function rich(text, base = {}) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return parts.map((p) => p.startsWith('*') && p.endsWith('*') ? run(p.slice(1, -1), { ...base, italics: true }) : run(p, base));
}

// ---------- paragraph builders ----------
const body = (text, first = false) => P(first ? smallCapsLead(text) : rich(text), {
  style: first ? 'BodyFirst' : 'Body',
});
function smallCapsLead(text) {
  const words = text.split(' ');
  const n = Math.min(words.length, text.length > 60 ? 4 : 2);
  const lead = words.slice(0, n).join(' ');
  const rest = words.slice(n).join(' ');
  return [run(lead, { smallCaps: true }), ...(rest ? rich(' ' + rest) : [])];
}
const ornament = () => P(run('❖', { size: 20, color: '777777' }), { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 360 } });
const sceneBreak = () => P(run('·   ·   ·', { size: 22, color: '555555' }), { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 240 } });
const pull = (text) => P(run(text, { italics: true, size: 28 }), {
  alignment: AlignmentType.CENTER, spacing: { before: 280, after: 280, line: 320 }, indent: { left: 360, right: 360 },
  border: { top: { style: BorderStyle.SINGLE, size: 4, color: '999999', space: 10 }, bottom: { style: BorderStyle.SINGLE, size: 4, color: '999999', space: 10 } },
});
let FIGN = 0;
function figure(name, caption) {
  const out = [P(inlineImage(name), { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 80, line: 240, lineRule: LineRuleType.AUTO }, keepNext: true })];
  FIGN += 1;
  if (caption) out.push(P([run('Figure ' + FIGN + '.  ', { bold: true, size: 17, color: '444444', characterSpacing: 20 }), run(caption, { italics: true, size: 19, color: '444444' })], { alignment: AlignmentType.CENTER, spacing: { after: 280 }, indent: { left: 360, right: 360 } }));
  return out;
}
function exerciseBox(title, lines) {
  const cellP = [
    P(run('TRY THIS', { size: 16, bold: true, characterSpacing: 40, color: '555555' }), { spacing: { after: 40 } }),
    P(run(title, { size: 24, bold: true }), { spacing: { after: 120 } }),
    ...lines.map((l) => P(rich(l, { size: 21 }), { spacing: { after: 100, line: 264 }, alignment: AlignmentType.LEFT })),
  ];
  const border = { style: BorderStyle.SINGLE, size: 6, color: '333333' };
  return [new Table({
    width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: [TEXT_W],
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({
      width: { size: TEXT_W, type: WidthType.DXA }, children: cellP,
      shading: { type: ShadingType.CLEAR, fill: 'F3F3F1', color: 'auto' },
      margins: { top: 200, bottom: 160, left: 260, right: 260 },
      borders: { top: border, bottom: border, left: { style: BorderStyle.SINGLE, size: 24, color: INK }, right: border },
    })] })],
  }), P(run(''), { spacing: { after: 120 } })];
}
function worksheet(title, rows) {
  const cols = rows[0].length;
  const firstW = cols >= 4 ? 1300 : cols === 3 ? 1500 : 2200;
  const restW = Math.floor((TEXT_W - firstW) / (cols - 1));
  const widths = [firstW, ...Array(cols - 1).fill(restW)];
  widths[cols - 1] += TEXT_W - widths.reduce((a, b) => a + b, 0);
  const b = { style: BorderStyle.SINGLE, size: 4, color: '888888' };
  const borders = { top: b, bottom: b, left: b, right: b };
  const trs = rows.map((r, ri) => new TableRow({
    tableHeader: ri === 0, cantSplit: true,
    height: ri === 0 ? undefined : { value: 620, rule: HeightRule.ATLEAST },
    children: r.map((c, ci) => new TableCell({
      width: { size: widths[ci], type: WidthType.DXA }, borders, verticalAlign: VerticalAlign.TOP,
      shading: ri === 0 ? { type: ShadingType.CLEAR, fill: '1E1E1E', color: 'auto' } : undefined,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [P(run(c.trim(), ri === 0 ? { bold: true, size: 17, color: 'FFFFFF' } : { size: 19, italics: ci === 0 }), { spacing: { after: 0 } })],
    })),
  }));
  return [
    P(run('WORKSHEET', { size: 16, bold: true, characterSpacing: 40, color: '555555' }), { spacing: { before: 240, after: 40 }, keepNext: true }),
    P(run(title, { size: 24, bold: true }), { spacing: { after: 120 }, keepNext: true }),
    new Table({ width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: widths, rows: trs }),
    P(run(''), { spacing: { after: 160 } }),
  ];
}

// ---------- headers / footers ----------
const runningHeader = (text) => new Header({ children: [P(run(text.toUpperCase(), { size: 15, characterSpacing: 60, color: '666666' }), { alignment: AlignmentType.CENTER })] });
const pageFooter = () => new Footer({ children: [P(new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: '555555' }), { alignment: AlignmentType.CENTER })] });
const emptyHF = () => ({ header: new Header({ children: [P(run(''))] }), footer: new Footer({ children: [P(run(''))] }) });

// ---------- parse manuscript into sections ----------
const files = fs.readdirSync(path.join(ROOT, 'manuscript')).filter((f) => f.endsWith('.txt')).sort();
const lines = files.flatMap((f) => fs.readFileSync(path.join(ROOT, 'manuscript', f), 'utf8').split(/\r?\n/));

const sections = [];
let cur = null;
let firstPara = false;
let dropNext = false;
let mode = 'body';
let numbering = 'front'; // front (roman) -> main (decimal)
let restartNumbering = false;

function newSection({ header = 'Burn to Become', first = true, bleed = false, restart = false } = {}) {
  cur = { children: [], header, first, bleed, restart, front: numbering === 'front' };
  sections.push(cur);
  return cur;
}
const push = (...els) => cur.children.push(...els.flat());

// ---------- contents page (static, numbered; page numbers from a previous render) ----------
const PAGES_FILE = path.join(__dirname, 'toc_pages.json');
const PAGES = fs.existsSync(PAGES_FILE) ? JSON.parse(fs.readFileSync(PAGES_FILE, 'utf8')) : {};
const TOCENTRIES = [];
let tocSection = null;
function tocMark(kind, label, title) {
  const key = 'toc' + String(TOCENTRIES.length + 1).padStart(3, '0');
  TOCENTRIES.push({ key, kind, label, title });
  return key;
}
const tabRun = (text, o = {}) => new TextRun({ font: FONT, ...o, children: [new Tab(), text] });
const bm = (key, r) => new Bookmark({ id: key, children: [r] });

let i = 0;
while (i < lines.length) {
  const raw = lines[i];
  const line = raw.trim();
  i++;
  if (!line || line.startsWith('@@')) continue;

  if (line.startsWith('@title ')) {
    const [t, sub, author] = line.slice(7).split('|').map((s) => s.trim());
    newSection({ first: true });
    push(P(run(''), { spacing: { before: 2.2 * IN } }));
    push(P(run(t, { size: 60, bold: true, characterSpacing: 60 }), { alignment: AlignmentType.CENTER, spacing: { after: 240 } }));
    push(P(run('❖', { size: 22, color: '777777' }), { alignment: AlignmentType.CENTER, spacing: { after: 240 } }));
    push(P(run(sub, { italics: true, size: 30 }), { alignment: AlignmentType.CENTER, spacing: { after: 2.4 * IN } }));
    push(P(run(author.toUpperCase(), { size: 22, characterSpacing: 80 }), { alignment: AlignmentType.CENTER }));
    continue;
  }
  if (line.startsWith('@frontispiece ')) {
    const [img] = line.slice(14).split('|').map((s) => s.trim());
    newSection({ bleed: true });
    push(P(fullBleed(img)));
    continue;
  }
  if (line === '@copyright') {
    newSection({ first: true });
    push(P(run(''), { spacing: { before: 3.2 * IN } }));
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('@')) {
      push(P(run(lines[i].trim(), { size: 17, color: '333333' }), { spacing: { after: 110, line: 250 }, alignment: AlignmentType.LEFT }));
      i++;
    }
    continue;
  }
  if (line.startsWith('@dedication ')) {
    newSection({ first: true });
    push(P(run(line.slice(12), { italics: true, size: 26 }), { alignment: AlignmentType.CENTER, spacing: { before: 2.8 * IN }, indent: { left: 540, right: 540 } }));
    continue;
  }
  if (line.startsWith('@epigraph ')) {
    const [q, who] = line.slice(10).split('|').map((s) => s.trim());
    newSection({ first: true });
    push(P(run('“' + q + '”', { italics: true, size: 28 }), { alignment: AlignmentType.CENTER, spacing: { before: 2.8 * IN, after: 240, line: 340 }, indent: { left: 540, right: 540 } }));
    const [name, work] = who.split(',').map((s) => s.trim());
    push(P([run('— ' + name + ', ', { size: 20 }), run(work, { size: 20, italics: true })], { alignment: AlignmentType.CENTER }));
    continue;
  }
  if (line === '@toc') {
    newSection({ first: true });
    push(P(run('CONTENTS', { size: 30, characterSpacing: 120 }), { alignment: AlignmentType.CENTER, spacing: { before: 0.25 * IN, after: 300 } }));
    tocSection = cur;
    continue;
  }
  if (line.startsWith('@front ')) {
    const [t, sub] = line.slice(7).split('|').map((s) => s.trim());
    mode = /NOTES|BIBLIOGRAPHY/.test(t) ? 'biblio' : 'body';
    newSection({ header: sub ? titleCase(t) : titleCase(t), first: true });
    push(P(run(''), { spacing: { before: 1.0 * IN } }));
    const fkey = tocMark('front', '', sub && /EPILOGUE|MANUAL/.test(t) ? t + ': ' + sub.toUpperCase() : t);
    push(P(bm(fkey, run(t, { size: 36, characterSpacing: 60 })), { heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: sub ? 120 : 200 } }));
    if (sub) push(P(run(sub, { italics: true, size: 28 }), { alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
    push(ornament());
    firstPara = true;
    continue;
  }
  if (line === '@notes') {
    mode = 'notes';
    newSection({ header: 'Notes', first: true });
    push(P(run(''), { spacing: { before: 1.0 * IN } }));
    const nkey = tocMark('front', '', 'NOTES');
    push(P(bm(nkey, run('NOTES', { size: 36, characterSpacing: 60 })), { heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
    push(ornament());
    firstPara = true;
    continue;
  }
  if (line.startsWith('@part ')) {
    const [num, t, img] = line.slice(6).split('|').map((s) => s.trim());
    mode = 'body';
    const restart = numbering === 'front';
    numbering = 'main';
    newSection({ header: 'Part ' + num, first: true, restart });
    push(P([fullBleed(img)], { spacing: { after: 0 } }));
    push(P(run('PART ' + num, { size: 26, characterSpacing: 200, color: 'DDDDDD' }), { alignment: AlignmentType.CENTER, spacing: { before: 4.3 * IN, after: 200 } }));
    const pkey = tocMark('part', 'PART ' + num, t);
    push(P(bm(pkey, run(t, { size: 38, bold: true, color: 'FFFFFF', characterSpacing: 20 })), { heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, indent: { left: 200, right: 200 } }));
    push(P(new PageBreak()));
    push(P(run(''), { spacing: { before: 0.4 * IN } }));
    firstPara = true;
    continue;
  }
  if (line.startsWith('@chapter ')) {
    const [n, t] = line.slice(9).split('|').map((s) => s.trim());
    mode = 'body';
    newSection({ header: titleCase(t.split(':')[0]), first: true });
    push(P(run(''), { spacing: { before: 0.9 * IN } }));
    push(P(run('CHAPTER ' + NUMWORDS[+n], { size: 19, characterSpacing: 160, color: '555555' }), { alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
    const ckey = tocMark('chapter', String(n).padStart(2, '0'), t);
    push(P(bm(ckey, run(t, { size: 34, bold: true })), { heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 160, line: 380 }, indent: { left: 300, right: 300 } }));
    push(ornament());
    firstPara = true;
    dropNext = true;
    continue;
  }
  if (line.startsWith('@plate ')) {
    const text = line.slice(7).trim();
    const key = Object.entries(PLATES).find(([k]) => text.toLowerCase().startsWith(k.toLowerCase()))?.[1];
    if (!key) throw new Error('No plate image for: ' + text);
    newSection({ bleed: true });
    push(P(fullBleed(key)));
    continue;
  }
  if (line.startsWith('@closing ')) {
    const [a, ...rest] = line.slice(9).split('|').map((s) => s.trim());
    push(P(run(''), { spacing: { before: 480 } }));
    push(P(run(a, { size: 30, bold: true, characterSpacing: 80 }), { alignment: AlignmentType.CENTER, spacing: { after: 200 }, keepNext: true }));
    rest.forEach((r) => push(P(run(r, { italics: true, size: 23 }), { alignment: AlignmentType.CENTER, spacing: { after: 60 }, keepNext: true })));
    continue;
  }
  if (line.startsWith('@interlude ')) {
    const [num, t] = line.slice(11).split('|').map((x) => x.trim());
    const paras = [];
    while (i < lines.length && lines[i].trim() !== '@endinterlude') { if (lines[i].trim()) paras.push(lines[i].trim()); i++; }
    i++;
    push(P(run('INTERLUDE ' + num, { size: 18, characterSpacing: 200, color: '777777' }), { alignment: AlignmentType.CENTER, spacing: { before: 1.1 * IN, after: 160 } }));
    push(P(run(t, { size: 30, italics: true }), { alignment: AlignmentType.CENTER, spacing: { after: 160 } }));
    push(ornament());
    paras.forEach((x, k) => push(P(x.split(/(\*[^*]+\*)/g).filter(Boolean).map((seg) => seg.startsWith('*') ? run(seg.slice(1, -1), { italics: false }) : run(seg, { italics: true })),
      { style: k === 0 ? 'BodyFirst' : 'Body' })));
    push(P(run('❖', { size: 18, color: '999999' }), { alignment: AlignmentType.CENTER, spacing: { before: 240 } }));
    push(P(new PageBreak()));
    push(P(run(''), { spacing: { before: 0.4 * IN } }));
    firstPara = true;
    continue;
  }
  if (line === '@break') { push(sceneBreak()); firstPara = true; continue; }
  if (line.startsWith('@exercise ')) {
    const title = line.slice(10).trim(); const body = [];
    while (i < lines.length && lines[i].trim() !== '@end') { if (lines[i].trim()) body.push(lines[i].trim()); i++; }
    i++;
    push(exerciseBox(title, body));
    continue;
  }
  if (line.startsWith('@table ')) {
    const title = line.slice(7).trim(); const rows = [];
    while (i < lines.length && lines[i].trim() !== '@endtable') { if (lines[i].trim() || lines[i].includes('|')) rows.push(lines[i].split('|')); i++; }
    i++;
    const n = rows[0].length; rows.forEach((r) => { while (r.length < n) r.push(''); });
    push(worksheet(title, rows));
    continue;
  }
  if (line.startsWith('@day ')) {
    const [n, t] = line.slice(5).split('|').map((s) => s.trim());
    push(P([run('DAY ' + n + '   ', { bold: true, size: 20, characterSpacing: 60 }), run(t, { bold: true, italics: true, size: 23 })], { spacing: { before: 280, after: 80 }, keepNext: true,
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'BBBBBB', space: 6 } } }));
    firstPara = true;
    continue;
  }
  if (line.startsWith('@note ')) {
    const [cue, text] = line.slice(6).split('|').map((s) => s.trim());
    push(P([run(cue + '. ', { italics: true, size: 19 }), run(text, { size: 19 })], { style: 'Note' }));
    continue;
  }
  if (line.startsWith('!fig ')) {
    const [name, cap] = line.slice(5).split('|').map((s) => s.trim());
    push(figure(name, cap));
    firstPara = true;
    continue;
  }
  if (line.startsWith('### ')) {
    const t = line.slice(4);
    push(P(run(t, { smallCaps: mode !== 'notes', bold: true, size: mode === 'notes' ? 21 : 24 }), { heading: HeadingLevel.HEADING_3, keepNext: true }));
    firstPara = true;
    continue;
  }
  if (line.startsWith('> ')) { push(pull(line.slice(2))); firstPara = true; continue; }
  if (/^\d+\.\s/.test(line)) {
    const [, num, rest] = line.match(/^(\d+)\.\s(.*)$/);
    push(P([run(num + '.\t', { bold: true }), ...rich(rest)], { style: 'ListItem' }));
    continue;
  }
  if (mode === 'biblio') { push(P(rich(line, { size: 20 }), { style: 'Biblio' })); continue; }
  if (dropNext && /^[A-Za-z]/.test(line)) {
    // classic three-line drop cap (framePr is added in post-processing), then the rest in small caps lead
    // raised initial: a large first letter standing on the first line (renders identically in Word and the PDF)
    push(P([run(line[0], { size: 64, color: '1a1a1a' }), ...smallCapsLead(line.slice(1))], { style: 'BodyFirst', spacing: { before: 60 } }));
    dropNext = false; firstPara = false;
    continue;
  }
  dropNext = false;
  push(body(line, firstPara));
  firstPara = false;
}

// ---------- fill the contents page ----------
if (tocSection) {
  const tabs = [{ type: TabStopType.LEFT, position: 460 }, { type: TabStopType.RIGHT, position: TEXT_W, leader: LeaderType.DOT }];
  for (const e of TOCENTRIES) {
    const pg = PAGES[e.key] || '000';
    let children, opts;
    if (e.kind === 'part') {
      children = [run(e.label + '   ', { size: 16, bold: true, characterSpacing: 60, color: '555555' }), run(e.title, { size: 17, bold: true, characterSpacing: 20 }), tabRun(pg, { size: 17, bold: true })];
      opts = { spacing: { before: 200, after: 60 }, tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W, leader: LeaderType.DOT }], keepNext: true };
    } else if (e.kind === 'chapter') {
      children = [run(e.label, { size: 17, color: '666666' }), tabRun(e.title, { size: 17 }), tabRun(pg, { size: 17 })];
      opts = { spacing: { after: 30, line: 245 }, tabStops: tabs, indent: { left: 460, hanging: 460, right: 360 } };
    } else {
      children = [run(e.title, { size: 17, bold: true, characterSpacing: 20 }), tabRun(pg, { size: 17, bold: true })];
      opts = { spacing: { before: 140, after: 40 }, tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W, leader: LeaderType.DOT }] };
    }
    tocSection.children.push(P(new InternalHyperlink({ anchor: e.key, children }), opts));
  }
  fs.writeFileSync(path.join(__dirname, 'toc_entries.json'), JSON.stringify(TOCENTRIES, null, 1));
}

// ---------- assemble ----------
// WITH_COVERS=1: wrap the book in its front and back cover (full-page images)
const WITH_COVERS = process.env.WITH_COVERS === '1';
if (WITH_COVERS) {
  sections.unshift({ children: [P(fullBleed('cover_front_trim'))], bleed: true, cover: true });
  sections.push({ children: [P(fullBleed('cover_back_trim'))], bleed: true, cover: true });
}
const firstBook = sections.findIndex((x) => !x.cover);
const docSections = sections.map((s, idx) => {
  const pageNumbers = s.restart ? { start: 1, formatType: NumberFormat.DECIMAL } : (idx === firstBook ? { start: 1, formatType: NumberFormat.LOWER_ROMAN } : (s.front ? { formatType: NumberFormat.LOWER_ROMAN } : undefined));
  const props = { page: { size: PAGE, margin: MARGIN, ...(pageNumbers ? { pageNumbers } : {}) }, titlePage: true };
  const hf = s.bleed ? { headers: { default: emptyHF().header, first: emptyHF().header }, footers: { default: emptyHF().footer, first: emptyHF().footer } }
    : { headers: { default: runningHeader(s.header), first: emptyHF().header }, footers: { default: pageFooter(), first: emptyHF().footer } };
  return { properties: props, ...hf, children: s.children };
});

const doc = new Document({
  creator: 'Bazooka', title: 'Burn to Become', description: 'Burn to Become: The Life You Could Have Lived — illustrated manuscript, 6 x 9 in',
  styles: {
    default: { document: { run: { font: FONT, size: 23, color: INK }, paragraph: { spacing: { line: 300, lineRule: LineRuleType.AUTO } } } },
    paragraphStyles: [
      { id: 'Body', name: 'Body', basedOn: 'Normal', quickFormat: true, run: { font: FONT, size: 23 },
        paragraph: { alignment: AlignmentType.JUSTIFIED, indent: { firstLine: 300 }, spacing: { after: 0, line: 300 } } },
      { id: 'BodyFirst', name: 'Body First', basedOn: 'Body', quickFormat: true, paragraph: { indent: { firstLine: 0 } } },
      { id: 'DropCap', name: 'Drop Cap', basedOn: 'Normal', run: { font: FONT, size: 104 },
        paragraph: { spacing: { before: 0, after: 0, line: 900, lineRule: LineRuleType.EXACT }, indent: { firstLine: 0 } } },
      { id: 'ListItem', name: 'List Item', basedOn: 'Normal', run: { font: FONT, size: 22 },
        paragraph: { indent: { left: 400, hanging: 400 }, spacing: { after: 100, line: 280 } } },
      { id: 'Biblio', name: 'Bibliography Entry', basedOn: 'Normal', run: { font: FONT, size: 20 },
        paragraph: { indent: { left: 400, hanging: 400 }, spacing: { after: 100, line: 264 } } },
      { id: 'Note', name: 'Endnote Entry', basedOn: 'Normal', run: { font: FONT, size: 19 },
        paragraph: { alignment: AlignmentType.LEFT, spacing: { after: 110, line: 260 } } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 36 },
        paragraph: { spacing: { before: 0, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 34, bold: true },
        paragraph: { spacing: { before: 0, after: 160 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 24, bold: true },
        paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 2 } },
      { id: 'TOC1', name: 'toc 1', basedOn: 'Normal', run: { font: FONT, size: 21, bold: true }, paragraph: { spacing: { before: 200, after: 60 } } },
      { id: 'TOC2', name: 'toc 2', basedOn: 'Normal', run: { font: FONT, size: 20 }, paragraph: { indent: { left: 280 }, spacing: { after: 40 } } },
    ],
  },
  sections: docSections,
});

const out = path.join(ROOT, 'output', WITH_COVERS ? 'Burn_to_Become_Complete_With_Covers.docx' : 'Burn_to_Become_Illustrated_Manuscript.docx');
fs.mkdirSync(path.dirname(out), { recursive: true });
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log('wrote', out, (buf.length / 1024 / 1024).toFixed(2) + ' MB', sections.length, 'sections'); });
