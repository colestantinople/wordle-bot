export type TileResultType = 0 | 1 | 2 | 3;
export const TileResultTypes = {
  unknown: 0 as TileResultType,
  absent: 1 as TileResultType,
  present: 2 as TileResultType,
  correct: 3 as TileResultType,
}

export class TileResult {
  readonly letter: string;
  readonly result: TileResultType;

  constructor(letter: string, result: TileResultType) {
    if (letter.length !== 1) throw new Error('Bad letter: ' + letter);

    this.letter = letter;
    this.result = result;
  }
}

export class WordResults {
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
