import puppeteer from 'puppeteer';

export class Controller {
  static async init() {
    const browser = await puppeteer.launch(),
      page = await browser.newPage();

    await page.goto('https://www.nytimes.com/games/wordle/index.html');
    await page.screenshot({ path: 'ss.png' });
    await browser.close();

  }
}
