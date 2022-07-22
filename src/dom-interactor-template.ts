import { Page } from "puppeteer";
import { WordResult } from "./models/word-result.js";

export class DOMInteractorTemplate {
  constructor(page: Page) {
  }

  async checkForWin(): Promise<boolean> {
    return null;
  }

  async closeModal(): Promise<void> {
  }

  async tryWord(word: string): Promise<WordResult> {
    return null;
  }
}
