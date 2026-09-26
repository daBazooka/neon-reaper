// Builds output/Burn_to_Become_Engine_Toolkit.docx: the prompts, the frameworks, and the btb app guide + source.
// Usage: node build_toolkit.js   (then: node embed_fonts.js ../output/Burn_to_Become_Engine_Toolkit.docx)
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, Footer, Header, PageNumber, PageBreak, ImageRun,
} = require(process.env.DOCXLIB || 'docx');

const ROOT = path.resolve(__dirname, '..');
const FONT = 'EB Garamond';
const CODE = 'Consolas';
const IN = 1440;
const PAGE = { width: 11906, height: 16838 }; // A4
const MARGIN = { top: IN, bottom: IN, left: 1.1 * IN, right: 1.1 * IN };
const W = PAGE.width - MARGIN.left - MARGIN.right;
const EMBER = 'C2410C';

const run = (text, o = {}) => new TextRun({ text, font: FONT, size: 22, ...o });
const P = (children, o = {}) => new Paragraph({ children: Array.isArray(children) ? children : [children], spacing: { after: 120, line: 290 }, ...o });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 240 }, children: [run(t, { size: 36, bold: true })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 }, keepNext: true, children: [run(t, { size: 26, bold: true, color: EMBER })] });
const bullet = (t) => P([run('•  ', { color: EMBER }), ...rich(t)], { indent: { left: 360, hanging: 240 }, spacing: { after: 60, line: 280 } });
function rich(t, o = {}) {
  return t.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((s) => s.startsWith('**') ? run(s.slice(2, -2), { ...o, bold: true })
    : s.startsWith('`') ? new TextRun({ text: s.slice(1, -1), font: CODE, size: 19, ...o }) : run(s, o));
}
const border = { style: BorderStyle.SINGLE, size: 6, color: 'BBBBBB' };
function box(title, lines, { fill = 'F6F4F0', mono = false } = {}) {
  const kids = [];
  if (title) kids.push(new Paragraph({ spacing: { after: 100 }, children: [run(title.toUpperCase(), { size: 17, bold: true, color: EMBER, characterSpacing: 30 })] }));
  for (const l of lines) {
    kids.push(new Paragraph({ spacing: { after: mono ? 0 : 80, line: mono ? 240 : 276 },
      children: mono ? [new TextRun({ text: l || ' ', font: CODE, size: 17 })] : rich(l, { size: 21 }) }));
  }
  return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], rows: [new TableRow({ children: [new TableCell({
    width: { size: W, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
    margins: { top: 160, bottom: 160, left: 220, right: 220 },
    borders: { top: border, bottom: border, right: border, left: { style: BorderStyle.SINGLE, size: 24, color: EMBER } },
    children: kids })] })] }), P(run(''), { spacing: { after: 160 } })];
}
function table(head, rows, widths) {
  const cell = (t, i, h) => new TableCell({ width: { size: widths[i], type: WidthType.DXA },
    shading: h ? { type: ShadingType.CLEAR, fill: '1E1E1E', color: 'auto' } : undefined,
    borders: { top: border, bottom: border, left: border, right: border }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ spacing: { after: 0, line: 260 }, children: h ? [run(t, { size: 18, bold: true, color: 'FFFFFF' })] : rich(t, { size: 19 }) })] });
  return [new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, i, true)) }), ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((t, i) => cell(t, i, false)) }))] }),
    P(run(''), { spacing: { after: 160 } })];
}

const MASTER = [
  '**YOU ARE ACTING AS:** the execution, diagnostic, and implementation engine for the book Burn to Become: The Life You Could Have Lived, by Bazooka.',
  '**CORE OBJECTIVE:** Systematically analyze, extract, and convert the book’s philosophical, psychological, and behavioral frameworks into personalized, actionable, high-accountability systems for me. Do not give generic motivational advice. Produce precise, evidence-based, friction-reducing outputs.',
  '**MODES**',
  '1. **The Auditor** (diagnosis): cross-examine my statements, schedules, and goals against Parts I and II (The Comfortable Cage, The Internal Lawyer, The Receipts Week). Find where I am self-handicapping, relying on “later,” or mistaking preparation for action. Make me look at my receipts.',
  '2. **The Historian** (case studies): use Part III (Alexander, Musashi, Jordan, Ronaldo, Bryant, Frankl). Strip away mythology. Extract the systemic, environmental, and behavioral mechanics, including flaws, trade-offs, and constraints.',
  '3. **The Field Manual Architect** (action): turn Parts IV and V and the thirty-day Field Manual into When–Then intentions, friction-reduction protocols, minimum viable habits, and thirty-day tracking.',
  '4. **The Thought Partner** (candor): challenge my assumptions without cruelty or fluff. Name perfectionism or fear of being seen when it is present. Ask the uncomfortable question that isolates my agency within my real constraints.',
  '5. **The Engine Generator** (tools): build working software, scripts, trackers, or templates that enforce the book’s systems in my daily life.',
  '**FILTERS TO RUN ON ANY GOAL OR PROBLEM**',
  '• **Receipts:** ignore stated intentions; evaluate only observable data (time, calendar, energy, output).',
  '• **Four Voices:** separate Fear (“What if it goes badly?”), Ego (“What will this say about me?”), Approval (“What will they think?”), and Values (“What matters even if uncertain?”).',
  '• **Boring Middle:** find where excitement has faded and design a process for the gap before skill arrives.',
  '• **If–Then:** every target gets “If [specific obstacle], then I will [specific action].”',
  '• **Audience Stripper:** remove status and recognition; is the work still worth doing?',
  '**RULES**',
  '1. Start immediately with the analysis, script, or framework. No preamble.',
  '2. Prefer exact numbers, concrete steps, tables, and code over inspiration.',
  '3. Respect my real constraints, then show me exactly where I still have agency.',
  '4. End every session with one specific action I must do or log within the next 24 hours.',
  '5. This is not therapy. If I describe a crisis, tell me plainly to reach a qualified professional.',
];

const children = [];
// ---- title page
const coverImg = path.join(ROOT, 'images', 'cover_front_trim.jpg');
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 300 },
  children: [new ImageRun({ type: 'jpg', data: fs.readFileSync(coverImg), transformation: { width: 220, height: 330 } })] }));
children.push(P(run('BURN TO BECOME', { size: 48, bold: true, characterSpacing: 60 }), { alignment: AlignmentType.CENTER, spacing: { after: 120 } }));
children.push(P(run('THE ENGINE', { size: 30, characterSpacing: 120, color: EMBER }), { alignment: AlignmentType.CENTER, spacing: { after: 200 } }));
children.push(P(run('Prompts, frameworks, and the btb Field Manual app', { italics: true, size: 26 }), { alignment: AlignmentType.CENTER, spacing: { after: 900 } }));
children.push(P(run('BAZOOKA', { size: 22, characterSpacing: 100 }), { alignment: AlignmentType.CENTER }));

// ---- 1. how to use
children.push(H1('1. How to Use This Toolkit'));
children.push(P(rich('The book gives you questions. This toolkit turns them into a working system. There are three ways to use it:')));
[
  '**Ask an AI to apply the book to your life.** Paste the Master Execution Prompt (Section 3) into Claude, then use one of the ready-made prompts in Section 2 with your own details.',
  '**Run the Field Manual every day with the btb app.** It shows each day’s practice, records your When–Then intentions and avoidance, and writes a weekly receipts report (Section 5).',
  '**Use the frameworks by hand.** Section 4 lists every filter with the question it asks and the chapter it comes from. A notebook is enough.',
].forEach((t) => children.push(bullet(t)));
children.push(...box('The one rule', ['Every session, with a notebook, an AI, or the app, ends with **one specific action for the next 24 hours**. Not a plan. An action.']));

// ---- 2. prompts
children.push(H1('2. Ready-to-Use Prompts'));
children.push(P(rich('Replace the words in [brackets] with your own details. Be honest; the prompts only work on real receipts.')));
children.push(H2('For personal diagnosis'));
children.push(...box('Prompt', ['Run “The Receipts Week” framework on my current daily routine: [paste your routine hour by hour, from waking to sleep, including phone time]. Identify my main avoidance loops, what each one protects me from, and the smallest change that would break the strongest loop.']));
children.push(H2('For building your own tools'));
children.push(...box('Prompt', ['Build a Python command-line application that implements the thirty-day Burn to Become Field Manual, letting me log my daily When–Then intentions, track my friction points, and generate weekly receipts.', '(This one is already built for you: see Section 5.)']));
children.push(H2('For vetting a goal'));
children.push(...box('Prompt', ['Analyze my goal to [insert goal] using the “Mountain You Didn’t Choose” and “Four Voices” frameworks. Run the Ordinary Tuesday test and the Audience Stripper. Tell me honestly whether I am climbing someone else’s mountain, and what the smallest real test of this goal would be.']));

// ---- 3. master prompt
children.push(H1('3. The Master Execution Prompt'));
children.push(P(rich('Paste this at the start of a conversation with Claude (or save it as a project instruction). It tells the AI to act as the Burn to Become engine: candid, specific, and always ending with one action.')));
children.push(...box('Burn to Become Engine: master prompt', MASTER, { fill: 'FBFAF7' }));

// ---- 4. frameworks
children.push(H1('4. The Frameworks at a Glance'));
children.push(...table(['Framework', 'The question it asks', 'Chapter'], [
  ['The Receipts', 'What does my behavior seem to believe that my words do not?', '3'],
  ['Recovery or Avoidance', 'After this break, am I more able to return, or less?', '2'],
  ['The Four Voices', 'Fear, ego, approval, or values: which one is deciding?', '4'],
  ['Wish, Then Obstacle', 'What inner obstacle will stop me, and what will I do when it appears?', '6'],
  ['When–Then', 'When [time and place], I will [first physical action].', '9'],
  ['The Friction Test', 'What happens when I remove the easiest escape for 45 minutes?', '8'],
  ['The Boring Middle', 'Excitement has faded and skill has not arrived. What keeps me here?', '5, 15'],
  ['Audience Stripper', 'If nobody ever knew, would I still want this?', '13, 17'],
  ['Whose Mountain', 'Is this goal mine, or inherited? What need sits under my envy?', '19'],
  ['Ordinary Tuesday', 'Do I want the daily life this goal creates, not just the photograph?', '19, 32, 33'],
  ['Evidence File', 'What have I actually done that proves who I am becoming?', '18'],
  ['Failure Portfolio', 'What did I try, what happened, what did I learn, what will I change?', '16'],
  ['Sunk Cost Check', 'Starting today, knowing what I know, would I choose this again?', '34'],
  ['Control / Influence / Accept', 'Where do my hands actually reach?', '36'],
  ['The Last Ordinary Day', 'What would I stop postponing if this were my last ordinary day?', '42'],
], [2300, 5400, W - 7700]));

// ---- 5. btb app
children.push(H1('5. The btb App: the Field Manual in Your Terminal'));
children.push(P(rich('`btb` is a small, private program that runs the book’s thirty-day Field Manual on your computer. It needs Python 3.10 or newer and nothing else. Your data never leaves your machine: it is kept in one file, `~/.btb/log.json`.')));
children.push(H2('Install'));
children.push(...box('In a terminal', ['cd burn-to-become/engine', 'pip install .', '', 'btb start          # begin the 30 days today', 'btb today          # read today’s practice'], { mono: true, fill: 'F3F3F3' }));
children.push(P(rich('No install? Run it directly from the `engine` folder with `python -m btb today`.')));
children.push(H2('Commands'));
children.push(...table(['Command', 'What it does', 'Ch.'], [
  ['`btb start`', 'Begin the thirty days (add `--date YYYY-MM-DD` to backdate).', 'FM'],
  ['`btb today` / `btb day 12`', 'Show today’s practice, or any day’s.', 'FM'],
  ['`btb intent add "When …, I will …"`', 'Log a When–Then intention. Vague ones are rejected or flagged.', '9'],
  ['`btb intent list`', 'Show open intentions (`--all` for everything).', '9'],
  ['`btb intent kept 3`', 'Close intention 3 as kept; it goes into your evidence file.', '7, 18'],
  ['`btb intent missed 3 --reason "tired"`', 'Close it as missed, with the honest reason.', '7'],
  ['`btb friction "writing" "YouTube" --minutes 40`', 'Log an avoidance: what you escaped and what you escaped to.', '2, 8'],
  ['`btb evidence "Sent the application"`', 'Add to your evidence file.', '18'],
  ['`btb fail --tried … --happened … --learned … --change …`', 'Add to your failure portfolio.', '16'],
  ['`btb voices "Quit my job"`', 'Answer the Four Voices about a decision.', '4'],
  ['`btb receipts --save`', 'Weekly report: keep rate, top escapes, avoidance peak hour, the gap, and one action for the next 24 hours.', '3'],
  ['`btb status`', 'One-line summary.', '—'],
], [3200, W - 4000, 800]));
children.push(H2('A week with btb'));
[
  '**Morning (2 minutes):** `btb today`, then one `btb intent add` for the day.',
  '**When you catch yourself escaping (10 seconds):** `btb friction "the task" "the escape" --minutes N`.',
  '**Evening (1 minute):** `btb intent kept N` or `btb intent missed N --reason "…"`.',
  '**Sunday (5 minutes):** `btb receipts --save`, read it once without judging, and do the one action it gives you.',
].forEach((t) => children.push(bullet(t)));
children.push(H2('Example receipts report'));
children.push(...box(null, [
  '## What you said you would do',
  '- Intentions set: 6 · kept 4 · missed 2 · still open 0',
  '- Keep rate (closed intentions): 66%',
  '## What your behavior did instead',
  '- Avoidance episodes logged: 5 · time given to escapes: 190 min (3.2 h)',
  '- Top escapes: youtube ×3, instagram ×2',
  '- Avoidance peaks around 21:00',
  '## One action for the next 24 hours',
  'Tomorrow at 21:00, put “youtube” out of reach for 45 minutes and give that time to “writing”.',
], { mono: true, fill: 'F3F3F3' }));

// ---- appendix: source
children.push(H1('Appendix: btb Source Code'));
children.push(P(rich('The complete program, `btb/cli.py`. It is also in the book’s repository under `burn-to-become/engine/`, with tests (`python -m unittest discover -s tests`).')));
const src = fs.readFileSync(path.join(ROOT, 'engine', 'btb', 'cli.py'), 'utf8').replace(/\t/g, '    ').split('\n');
for (const l of src) children.push(new Paragraph({ spacing: { after: 0, line: 220 }, children: [new TextRun({ text: l || ' ', font: CODE, size: 15 })] }));

const doc = new Document({
  creator: 'Bazooka', title: 'Burn to Become — The Engine',
  styles: { default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', run: { font: FONT, size: 36, bold: true }, paragraph: { outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', run: { font: FONT, size: 26, bold: true }, paragraph: { outlineLevel: 1 } },
    ] },
  sections: [{
    properties: { page: { size: PAGE, margin: MARGIN }, titlePage: true },
    headers: { default: new Header({ children: [P(run('BURN TO BECOME · THE ENGINE', { size: 15, characterSpacing: 60, color: '777777' }), { alignment: AlignmentType.CENTER })] }), first: new Header({ children: [P(run(''))] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: '777777' })] })] }), first: new Footer({ children: [P(run(''))] }) },
    children,
  }],
});
const out = path.join(ROOT, 'output', 'Burn_to_Become_Engine_Toolkit.docx');
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(out, b); console.log('wrote', out, (b.length / 1024).toFixed(0) + ' KB'); });
