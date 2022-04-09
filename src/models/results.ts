export enum TileResultTypes {
  unknown,
  absent,
  present,
  correct,
}

export class TileResult {
  readonly letter: string;
  readonly result: TileResultTypes;

  constructor(letter: string, result: TileResultTypes) {
    if (letter.length !== 1) throw new Error('Bad letter: ' + letter);

    this.letter = letter;
    this.result = result;
  }
}

export class WordResults {
  readonly word: string;
  readonly values: TileResult[] = [];

  constructor(word: string, results: TileResultTypes[]) {
    this.word = word;

    results.forEach((result: TileResultTypes, index: number) => {
      this.values.push(new TileResult(word[index], result))
    });
  }

  wasSuccessful(): boolean {
    return this.values.reduce((previous, current) => {
      if (current.result !== TileResultTypes.correct) return false;
      else return previous;
    }, true);
  }
}
