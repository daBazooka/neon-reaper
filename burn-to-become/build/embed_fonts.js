// Embeds EB Garamond (regular, bold, italic, bold italic) into the .docx so Word
// renders the book in the same typeface and with the same page breaks as the PDF.
// Usage: node embed_fonts.js <file.docx>
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const JSZip = require(process.env.JSZIPLIB || 'jszip');

const FONTS = path.resolve(__dirname, '../illustrations/fonts');
const FACES = [
  ['embedRegular', 'EB_Garamond-normal-400.ttf'],
  ['embedBold', 'EB_Garamond-normal-700.ttf'],
  ['embedItalic', 'EB_Garamond-italic-400.ttf'],
  ['embedBoldItalic', 'EB_Garamond-italic-600.ttf'],
];

function obfuscate(buf, guid) {
  // ECMA-376 Part 2 font obfuscation: XOR the first 32 bytes with the reversed GUID bytes.
  const hex = guid.replace(/[{}-]/g, '');
  const key = [];
  for (let i = 0; i < 16; i++) key.push(parseInt(hex.substr(30 - 2 * i, 2), 16));
  const out = Buffer.from(buf);
  for (let i = 0; i < 32; i++) out[i] ^= key[i % 16];
  return out;
}

(async () => {
  const file = process.argv[2];
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const relsPath = 'word/_rels/fontTable.xml.rels';
  let rels = zip.file(relsPath) ? await zip.file(relsPath).async('string')
    : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  rels = rels.replace(/<Relationships([^>]*)\/>/, '<Relationships$1></Relationships>');
  let embeds = '';
  FACES.forEach(([tag, ttf], k) => {
    const guid = '{' + crypto.randomUUID().toUpperCase() + '}';
    const rid = 'rIdEBG' + (k + 1);
    zip.file(`word/fonts/ebgaramond${k + 1}.odttf`, obfuscate(fs.readFileSync(path.join(FONTS, ttf)), guid));
    rels = rels.replace('</Relationships>', `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/ebgaramond${k + 1}.odttf"/></Relationships>`);
    embeds += `<w:${tag} r:id="${rid}" w:fontKey="${guid}"/>`;
  });
  zip.file(relsPath, rels);

  let ft = await zip.file('word/fontTable.xml').async('string');
  ft = ft.replace(/<w:fonts([^>]*)\/>/, '<w:fonts$1></w:fonts>');
  ft = ft.replace(/<w:font w:name="EB Garamond">[\s\S]*?<\/w:font>/g, '');
  const font = `<w:font w:name="EB Garamond"><w:panose1 w:val="00000500000000000000"/><w:charset w:val="00"/><w:family w:val="roman"/><w:pitch w:val="variable"/>${embeds}</w:font>`;
  ft = ft.replace('</w:fonts>', font + '</w:fonts>');
  zip.file('word/fontTable.xml', ft);

  let ct = await zip.file('[Content_Types].xml').async('string');
  if (!ct.includes('Extension="odttf"')) ct = ct.replace('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="odttf" ContentType="application/vnd.openxmlformats-officedocument.obfuscatedFont"/>');
  zip.file('[Content_Types].xml', ct);

  let st = await zip.file('word/settings.xml').async('string');
  if (!st.includes('w:embedTrueTypeFonts')) {
    // schema order: ... displayBackgroundShape, ..., embedTrueTypeFonts, embedSystemFonts, saveSubsetFonts, ...
    st = st.includes('<w:displayBackgroundShape/>')
      ? st.replace('<w:displayBackgroundShape/>', '<w:displayBackgroundShape/><w:embedTrueTypeFonts/><w:saveSubsetFonts/>')
      : st.replace(/(<w:settings[^>]*>)/, '$1<w:embedTrueTypeFonts/><w:saveSubsetFonts/>');
  }
  zip.file('word/settings.xml', st);

  // docx gives every bookmark the same id; Word needs them unique (start/end pairs share one id)
  let doc = await zip.file('word/document.xml').async('string');
  let bid = 0;
  doc = doc.replace(/<w:bookmarkStart([^>]*?)w:id="\d+"/g, (m, pre) => `<w:bookmarkStart${pre}w:id="${++bid}"`);
  let eid = 0;
  doc = doc.replace(/<w:bookmarkEnd w:id="\d+"/g, () => `<w:bookmarkEnd w:id="${++eid}"`);
  zip.file('word/document.xml', doc);

  fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  console.log('embedded EB Garamond (4 faces) into', path.basename(file));
})();
