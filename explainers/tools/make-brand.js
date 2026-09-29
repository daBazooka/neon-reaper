// Renders brand/brand.html into avatar.png, logo-lockup.png, banner.png
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2560, height: 1440 } });
  await p.goto('file://' + path.resolve(__dirname, '../brand/brand.html')); await p.waitForFunction(() => document.title === 'ready');
  for (const id of ['avatar', 'lockup', 'banner'])
    await p.locator('#' + id).screenshot({ path: path.resolve(__dirname, `../brand/${id === 'lockup' ? 'logo-lockup' : id}.png`), omitBackground: id === 'lockup' });
  await b.close();
})();
