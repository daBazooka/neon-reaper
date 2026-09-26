// Renders every illustration in illustrations/illus.html to images/<name>.png
const path = require('path');
const { chromium } = require(process.env.PWCORE || 'playwright-core');
const names = process.argv.slice(2).length ? process.argv.slice(2) : [
  'frontispiece','part1','part2','part3','part4','part5','star','door','boulder','river','enso','candle',
  'phonecage','summit','hourglass','loop','voices','middle','trytree','control','tuesday',
  'plate_potential','plate_mevsme','plate_evidence','plate_anger','plate_burn'];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1900, height: 2800 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  for (const n of names) {
    await page.goto('file://' + path.resolve(__dirname, '../illustrations/illus.html'));
    await page.evaluate(n => window.render(n), n);
    const el = (await page.$('svg')) || (await page.$('canvas'));
    await el.screenshot({ path: path.resolve(__dirname, n.startsWith('cover_') ? '../cover' : '../images', n + '.png') });
    console.log('rendered', n);
  }
  await browser.close();
})();
