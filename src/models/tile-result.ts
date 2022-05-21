import { TileResultType } from "./tile-result-types.js";

export class TileResult {
  readonly letter: string;
  readonly result: TileResultType;

  constructor(letter: string, result: TileResultType) {
    if (letter.length !== 1)
      throw new Error('Bad letter: ' + letter);

    this.letter = letter;
    this.result = result;
  }
}
