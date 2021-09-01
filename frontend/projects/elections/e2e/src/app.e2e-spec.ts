import * as puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:4202';

describe('workspace-project App', () => {
  it('Test Puppeteer screenshot', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(BASE_URL);
    // await page.screenshot({ path: 'example.png' });

    await page.click('[data-qa=\'elections-list_esia-auth_button\']');

    await page.waitFor(5000);

    await browser.close();
  });
});
