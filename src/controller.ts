import puppeteer, { Browser, Page } from "puppeteer";
import { DOMInteractor } from "./dom-interactor.js";
export class Controller {
  static readonly debug: boolean = Controller.useDebug();

  static async init() {
    const browser: Browser = await puppeteer.launch({
      headless: !Controller.debug,
      slowMo: Controller.debug ? 250 : 0,
    }),
      page: Page = await browser.newPage();

    await page.goto('https://www.nytimes.com/games/wordle/index.html');

    const interactor = new DOMInteractor(page);

    await interactor.closeModal();
    const results = await interactor.tryWord('adieu');

    await page.screenshot({ path: 'ss.png' });
    await browser.close();
  }

  static useDebug(): boolean {
    return process.argv.includes('debug');
  }
}
