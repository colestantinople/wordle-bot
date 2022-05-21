import { TileResultTypes } from "./tile-result-types.js";
import { LetterData, SingleLetterAttemptData } from "./letter.js";


export class AlphabetData {
  data: Record<string, LetterData> = {};

  constructor() {
    'abcdefghijklmnopqrstuvwxyz'.split('').forEach((letter) => {
      this.data[letter] = new LetterData(letter);
    });
  }

  /**
   * Returns a five-element array with each confirmed letter, and null otherwise if
   * no letter has been found for that position
   */
  getCorrectLetters(): string[] {
    const output: string[] = [];
    const correctLetters = Object.values(this.data).filter((letter: LetterData) => {
      return letter.getBestResultType() === TileResultTypes.correct;
    });

    for (let i = 0; i < 5; i++) {
      const correctLettersAtIndex: LetterData[] = correctLetters.filter((correctLetter: LetterData) => {
        return correctLetter.attempts.filter((attempt: SingleLetterAttemptData) => {
          return attempt.position === i && attempt.result === TileResultTypes.correct;
        }).length > 0;
      });

      if (correctLettersAtIndex.length > 1)
        throw new Error(`multiple correct letters at position ${i}?: ${correctLetters.map((cl) => {
          return cl.letter;
        }).join(', ')} `);
      else if (correctLettersAtIndex.length > 0)
        output.push(correctLettersAtIndex[0].letter);
      else
        output.push(null);
    }

    return output;
  }

  /**
   * Returns a five-element array with each confirmed letter, and null otherwise if
   * no letter has been found for that position.
   * 
   * @deprecated does this still work with letters redesign??
   */
  getPresentLetters(): LetterData[] {
    return Object.values(this.data).filter((letter: LetterData) => {
      return letter.getBestResultType() === TileResultTypes.present;
    });
  }
}
