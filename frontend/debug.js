/* eslint-env node */
// eslint-disable-next-line no-undef
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('https://roameo-rz80.onrender.com/signup', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
