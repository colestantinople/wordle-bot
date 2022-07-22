import { KeyInput, Page } from "puppeteer";
import { TileResultType } from "../models/tile-result-types.js";
import { WordResult } from "../models/word-result.js";

class DOMInteractorApril2022 {
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
          if (rows[rowIndex + 1] && rows[rowIndex + 1].getAttribute('letters') === '') return rows[rowIndex];
        }
        return rows[rows.length - 1];
      }

      (<any>window).getLastTile = () => {
        const row = (<any>window).getCurrentRow() as HTMLElement;
        const tiles = Array.from(row
          .shadowRoot
          .querySelectorAll('game-tile'));

        return tiles[tiles.length - 1];
      }
    });
  }

  async checkForWin(): Promise<boolean> {
    return this.page.evaluate(() => {
      return ((<any>window).getCurrentRow() as HTMLElement).hasAttribute('win');
    });
  }

  async closeModal(): Promise<void> {
    function pageRunner() {
      document.querySelector('game-app')
        .shadowRoot
        .querySelector('game-modal')
        .dispatchEvent(new Event('click'));
    }

    await this.page.evaluate(pageRunner);
  }

  async tryWord(word: string): Promise<WordResult> {
    if (!word || word.length !== 5)
      throw new Error('bad word length: ' + (word || 0));

    const keys = word.split('');
    for (const key of keys) {
      await this.page.keyboard.press(key as KeyInput);
    };

    await this.page.keyboard.press('Enter');

    await this.waitForLastTileToReveal();
    return await this.collectResults(word);
  }

  private async collectResults(word: string): Promise<WordResult> {
    const results: TileResultType[] = await this.page.evaluate(() => {
      const currentRow = (<any>window).getCurrentRow();

      const results: TileResultType[] = Array.from((currentRow as HTMLElement)
        .shadowRoot
        .querySelectorAll('game-tile'))
        .map((tile: HTMLElement) => {
          switch (tile.getAttribute('evaluation')) {
            case 'absent': return 1;
            case 'present': return 2;
            case 'correct': return 3;
            default:
              throw new Error('bad evaluation type: ' + tile.getAttribute('evaluation'));
          }
        });

      return results;
    });

    return new WordResult(word, results);
  }

  private async waitForLastTileToReveal(): Promise<any> {
    return this.page.evaluate(() => {
      const lastTile: HTMLElement = (<any>window).getLastTile();
      const lastTileInner: HTMLElement = lastTile.shadowRoot.querySelector('.tile');

      return new Promise((resolve, reject) => {
        let attemptCount: number = 0;
        const interval = setInterval(() => {
          if (lastTile.hasAttribute('reveal') && lastTileInner.getAttribute('data-animation') === 'idle') {
            clearInterval(interval);
            return resolve(true);
          } else if (attemptCount > 100) {
            const row: HTMLElement = (<any>window).getCurrentRow();
            let rowIndex: number;
            Array.from(row.parentElement.children).forEach((child, i) => {
              if (child.isEqualNode(row)) {
                rowIndex = i;
              }
            });

            let receivedWord = '';
            row.shadowRoot.querySelectorAll('game-tile').forEach((tile) => {
              receivedWord += tile.getAttribute('letter');
            });

            reject(`Tile ${lastTile.getAttribute('letter')} of row ${rowIndex} with word ${receivedWord} is not revealed`);
            // reject(`Tile ${lastTile.getAttribute('letter')} of no row is not revealed`);
          } else attemptCount++;
        }, 100);
      });
    });
  }
}
