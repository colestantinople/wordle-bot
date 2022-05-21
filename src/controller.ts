import fs from "fs";
import puppeteer, { Browser, Page } from "puppeteer";
import { DOMInteractor } from "./dom-interactor.js";
import { WordResult } from "./models/word-result.js";
import { TileResult } from "./models/tile-result";
import { WordSelector } from "./word-selector.js";
import { TileResultTypes } from "./models/tile-result-types.js";

export class Controller {
  static readonly debug: boolean = Controller.shouldUseDebug();
  static wordAttempts: string[] = [];

  static async init() {
    const browser: Browser = await puppeteer.launch({
      headless: !Controller.debug,
      slowMo: Controller.debug ? 200 : 0,
    }),
      page: Page = await browser.newPage();

    await page.goto('https://www.nytimes.com/games/wordle/index.html');

    const interactor = new DOMInteractor(page);

    await interactor.closeModal();

    Controller.introduceWordlebot();
    WordSelector.init();
    Controller.deleteScreenshots();

    if (this.shouldLogOutput()) console.log('');

    if(!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');    
    for (let i = 0; i < 6; i++) {
      const wordChoice = WordSelector.selectWord(i);
      this.wordAttempts.push(wordChoice);
      if (this.shouldLogOutput()) this.logAttempt(wordChoice);

      const results = await interactor.tryWord(wordChoice);
      if (this.shouldLogOutput()) this.logResult(results);

      await WordSelector.processResults(results, wordChoice);
      if (this.shouldLogOutput()) this.logRemainingWords(i);

      await page.screenshot({ path: `screenshots/word-${i}.png` });

      if (await interactor.checkForWin()) {
        this.handleWin(wordChoice, i);
        break;
      }
    }

    console.log(WordSelector.getSharableResults());
    await browser.close();
  }

  static async deleteScreenshots(): Promise<void> {
    for (let i = 0; i < 6; i++) {
      const path: string = `screenshots/word-${i}.png`;
      if (fs.existsSync(path)) fs.rmSync(path);
    }
  }

  static handleWin(winningWord: string, attemptCount: number): void {
    console.log('\nWin: ' + winningWord);
    console.log('Words tried: ' + (attemptCount + 1));
    this.wordAttempts.forEach((word) => {
      console.log('  ' + word);
    });
    console.log('');
  }

  static introduceWordlebot(): void {
    console.log(`\nWordlebot - v${process.env.npm_package_version}`);
  }

  static logAttempt(word: string): void {
    console.log('Attempt: ' + word);
  }

  static logRemainingWords(attemptNumber: number): void {
    if (!fs.existsSync('words')) fs.mkdirSync('words');
    fs.writeFileSync(`words/word-${attemptNumber}.txt`, WordSelector.remainingWords.join('\n'));
  }

  static logResult(results: WordResult): void {
    console.log('Result:  ' + results.values.map((result: TileResult, index: number) => {
      if (result.result === TileResultTypes.correct) return result.letter.toUpperCase();
      else if (result.result === TileResultTypes.present) return result.letter;
      else return '-';
    }).join(''));
  }

  static shouldLogOutput(): boolean {
    return process.argv.includes('log');
  }

  static shouldUseDebug(): boolean {
    return process.argv.includes('debug');
  }
}
