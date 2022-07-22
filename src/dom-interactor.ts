import { KeyInput, Page } from "puppeteer";
import { WordResult } from "./models/word-result.js";
import { Util } from "./util.js";
import { TileResultType } from "./models/tile-result-types.js";
import { DOMInteractorTemplate } from "./dom-interactor-template.js";
import { WordSelector } from "./word-selector.js";

export class DOMInteractor implements DOMInteractorTemplate {
  private page: Page;

  constructor(page: Page) {
    this.page = page;

    // setup global variables
    page.evaluate(() => {
      (<any>window).getCurrentRowStart = () => {
        const tiles = (<any>window).getTiles() as HTMLElement[];

        const filledTileCount: number = tiles.filter((tile) => {
          return tile.innerHTML !== '';
        }).length;

        const rowIndex = (filledTileCount - (filledTileCount % 5)) / 5;

        return (rowIndex - 1) * 5;
      }

      (<any>window).getCurrentRow = () => {
        const startOfWord: number = (<any>window).getCurrentRowStart();
        const tiles: HTMLElement[] = (<any>window).getTiles();

        return tiles.splice(startOfWord, 5);
      }

      (<any>window).getLastFilledTile = () => {
        const tiles = (<any>window).getTiles() as HTMLElement[];

        return tiles.filter((tile) => {
          return tile.getAttribute('data-state') !== 'empty';
        }).pop();
      }

      (<any>window).getTiles = () => {
        return Array.from(document.querySelectorAll('[data-testid="tile"]'));
      }
    });
  }

  async checkForWin(): Promise<boolean> {
    return this.page.evaluate(() => {
      return ((<any>window).getCurrentRow() as HTMLElement[]).map((tile) => {
        return tile.getAttribute('data-state') === 'correct';
      }).reduce((prev, current) => prev && current);
    });
  }

  async closeModal(): Promise<void> {
    function pageRunner() {
      let current: HTMLElement = document.body.querySelector('[data-testid="icon-close"]');
      if (!current) return; // No modal exists
      while (true) {
        if (current.getAttribute('role') === 'button') {
          current.click();
          break;
        }

        current = current.parentElement;
        if (current.parentElement === document.body) throw new Error('No modal closer found.');
      }
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

    await Util.sleep(50);

    await this.page.keyboard.press('Enter');

    await this.waitForLastTileToReveal().catch((reason) => {
      console.log(WordSelector.getSharableResults());

      throw (reason);
    });
    return await this.collectResults(word);
  }

  private async collectResults(word: string): Promise<WordResult> {
    const results: TileResultType[] = await this.page.evaluate(() => {
      const results: TileResultType[] = (<any>window).getCurrentRow()
        .map((tile: HTMLElement) => {
          switch (tile.getAttribute('data-state')) {
            case 'absent': return 1;
            case 'present': return 2;
            case 'correct': return 3;
            default:
              throw new Error('bad evaluation type: ' + tile.getAttribute('data-state'));
          }
        });

      return results;
    });

    return new WordResult(word, results);
  }

  private async waitForLastTileToReveal(): Promise<any> {
    return this.page.evaluate(() => {
      let lastTile: HTMLElement;

      return new Promise((resolve, reject) => {
        let attemptCount: number = 0;
        const interval = setInterval(() => {
          lastTile = (<any>window).getLastFilledTile();

          if (!lastTile) return;

          if (lastTile.getAttribute('data-state') !== 'tbd' && lastTile.getAttribute('data-animation') === 'idle') {
            clearInterval(interval);
            return resolve(true);
          } else if (attemptCount > 60) {
            const tiles: HTMLElement[] = (<any>window).getTiles();
            const rowStart: number = (<any>window).getCurrentRowStart();

            // output generation

            let word: string = '';
            for (let i = 0; i < 5; i++) {
              word += tiles[rowStart + i].innerText;
            }

            const filledTileCount: number = tiles.filter((tile) => {
              return tile.innerHTML !== '';
            }).length;

            reject(`Tile ${lastTile.innerHTML} (of ${filledTileCount} tiles) of row ${rowStart % 5} with word ${word} is not revealed`);
          } else attemptCount++;
        }, 100);
      });
    });
  }
}
