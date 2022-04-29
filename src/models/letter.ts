import { Controller } from "../controller.js";
import { TileResultMap, TileResultType, TileResultTypes } from "./tile-result-types.js";

export class LetterData {
  letter: string;
  attempts: SingleLetterAttemptData[] = [];

  instancesInWord: { min: number, max: number } = {
    min: 0,
    max: 5,
  };

  constructor(letter: string) {
    this.letter = letter;
  }

  getBestResultType(): TileResultType {
    if (this.attempts.length === 0) return TileResultTypes.unknown;

    return this.attempts.reduce((prev: TileResultType, current: SingleLetterAttemptData) => {
      switch (current.result) {
        case TileResultTypes.correct: return TileResultTypes.correct;
        case TileResultTypes.present:
          if (prev === TileResultTypes.correct) return TileResultTypes.correct
          else return TileResultTypes.present;
        case TileResultTypes.absent: return prev;
        default: return TileResultTypes.correct;
      }
    }, TileResultTypes.absent);
  }

  getCorrectPositions(): number[] {
    return this.getPositionsOfType(TileResultTypes.correct, 'correct');
  }

  getPreviousPresentPositions(): number[] {
    return this.getPositionsOfType(TileResultTypes.present, 'present');
  }

  private getPositionsOfType(type: TileResultType, typeName?: string): number[] {
    const output = this.attempts.filter((attempt: SingleLetterAttemptData) => {
      return attempt.result === type;
    }).map((attempt: SingleLetterAttemptData) => {
      return attempt.position;
    });

    return output;
  }
}

export class SingleLetterAttemptData {
  result: TileResultType;
  position: number;

  constructor(result: TileResultType, position: number, letter?: string) {
    this.result = result;
    this.position = position;

    if (Controller.debug)
      console.log(`${letter} is ${TileResultMap[result]} at ${position}`);
  }
}
