import { KeyInput, Page } from "puppeteer";
import { TileResultTypes, WordResults } from "./models/results.js";

export class DOMInteractor {
  private page: Page;

  constructor(page: Page) {
    this.page = page;

    // setup global variables
    page.evaluate(() => {
      (<any>window).getCurrentRow = () => {
        const rows = Array.from(document.querySelector('game-app')
          .shadowRoot
          .querySelector('#board')
          .querySelectorAll('game-row'));

        let rowIndex: number = 0;
        for (; rowIndex < rows.length; rowIndex++) {
          if (rows[rowIndex + 1].getAttribute('letters') === '') return rows[rowIndex];
        }
      }

      (<any>window).getLastTile = () => {
        const tiles = Array.from(((<any>window).getCurrentRow() as HTMLElement)
          .shadowRoot
          .querySelectorAll('game-tile'));

        return tiles[tiles.length - 1];
      }
    });
  }

  async closeModal() {
    function pageRunner() {
      document.querySelector('game-app')
        .shadowRoot
        .querySelector('game-modal')
        .dispatchEvent(new Event('click'));
    }

    await this.page.evaluate(pageRunner);
  }

  async tryWord(word: string): Promise<WordResults> {
    if (word.length !== 5)
      throw new Error('bad word length: ' + word);

    word.split('').forEach(async (key: KeyInput) => {
      await this.page.keyboard.press(key);
    });

    this.page.keyboard.press('Enter');

    await this.waitForLastTileToReveal();
    return await this.collectResults(word);
  }

  private async collectResults(word: string): Promise<WordResults> {
    return new WordResults(word, await this.page.evaluate(() => {
      const currentRow = (<any>window).getCurrentRow();

      const results: TileResultTypes[] = Array.from((currentRow as HTMLElement)
        .querySelectorAll('game-tile'))
        .map((tile: HTMLElement) => {
          switch (tile.getAttribute('evaluation')) {
            case 'absent': return TileResultTypes.absent;
            case 'present': return TileResultTypes.present;
            case 'correct': return TileResultTypes.correct;
            default:
              throw new Error('bad evaluation type: ' + tile.getAttribute('evaluation'));
          }
        });

      return results;
    }));
  }

  private async waitForLastTileToReveal(): Promise<void> {
    await this.page.evaluate(() => {
      const lastTile: HTMLElement = (<any>window).getLastTile();

      return new Promise((resolve, reject) => {
        let attemptCount: number = 0;
        const interval = setInterval(() => {
          if (lastTile.hasAttribute('reveal')) {
            clearInterval(interval);
            return resolve(true);
          } else if (attemptCount > 50) {
            reject(false);
          } else attemptCount++;
        }, 100);
      });
    });
  }
}
