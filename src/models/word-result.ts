import { TileResultType, TileResultTypes } from "./tile-result-types.js";
import { TileResult } from "./tile-result.js";

export class WordResult {
  readonly word: string;
  readonly values: TileResult[] = [];

  constructor(word: string, results: TileResultType[]) {
    const me = this;
    this.word = word;

    results.forEach((result: TileResultType, index: number) => {
      me.values.push(new TileResult(word[index], result))
    });
  }

  wasSuccessful(): boolean {
    return this.values.reduce((previous, current) => {
      if (current.result !== TileResultTypes.correct) return false;
      else return previous;
    }, true);
  }
}
