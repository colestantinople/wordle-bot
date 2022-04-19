import { TileResultType, TileResultTypes } from "./results.js";

export class LetterData {
  letter: string;
  result: TileResultType;
  correctPosition: number;
  presentPositions: number[] = [];

  constructor(letter: string, result: TileResultType) {
    this.letter = letter;
    this.result = result;
  }
}

export class LettersData {
  data: Record<string, LetterData> = {};

  constructor() {
    'abcdefghijklmnopqrstuvwxyz'.split('').forEach((letter) => {
      this.data[letter] = new LetterData(letter, TileResultTypes.unknown);
    });
  }

  /**
   * Returns a five-element array with each confirmed letter, and null otherwise if 
   * no letter has been found for that position
   */
  getCorrectLetters(): string[] {
    const output: string[] = [];
    const correctLetters = Object.values(this.data).filter((letter: LetterData) => {
      return letter.result === TileResultTypes.correct;
    });

    for (let i = 0; i < 5; i++) {
      const correctLettersAtIndex = correctLetters.filter((correctLetter: LetterData) => {
        return correctLetter.correctPosition === i;
      });
      if (correctLettersAtIndex.length > 0) output.push(correctLettersAtIndex[0].letter);
      else output.push(null);
    }

    return output;
  }

  /**
   * Returns a five-element array with each confirmed letter, and null otherwise if 
   * no letter has been found for that position
   */
  getPresentLetters(): LetterData[] {
    return Object.values(this.data).filter((letter: LetterData) => {
      return letter.result === TileResultTypes.present;
    });
  }
}
