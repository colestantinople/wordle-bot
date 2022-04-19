import fs from 'fs';
import { LetterData, LettersData } from './models/letters.js';
import { TileResult, TileResultTypes, WordResults } from './models/results.js';

export class WordSelector {
  private static _remainingWords: string[];
  private static lettersData: LettersData = new LettersData();
  private static previousWords: string[] = [];

  static async init(): Promise<void> {
    this._remainingWords = JSON.parse(fs.readFileSync('data/words.json', 'utf8'));
  }

  public static get remainingWords(): string[] {
    return this._remainingWords.slice(0);
  }

  static async processResults(results: WordResults, word: string): Promise<void> {
    // register word results
    results.values.forEach((result: TileResult, index: number) => {
      this.registerLetterResult(result, index, word);

      if (result.result === TileResultTypes.correct)
        this.lettersData.data[result.letter].correctPosition = index;
      else if (result.result === TileResultTypes.present)
        this.lettersData.data[result.letter].presentPositions.push(index);
    });

    // filter remaining words
    this._remainingWords = this._remainingWords
      .filter(this.filters.wordHasNoAbsentsNorTriedPresents)
      .filter(this.filters.wordHasAllCorrectLetters)
      .filter(this.filters.wordHasAllPresentLetters)
      .filter((remWord) => remWord !== results.word); // not the previous word
  }

  static registerLetterResult(result: TileResult, index: number, word: string) {
    switch (result.result) {
      case TileResultTypes.correct:
      case TileResultTypes.present:
        this.lettersData.data[result.letter].result = result.result;
        break;
      case TileResultTypes.absent:
        if (word.indexOf(result.letter) === word.lastIndexOf(result.letter)) // letter only appears once
          this.lettersData.data[result.letter].result = result.result;
        break;
    }

  }

  static selectWord(wordIndex: number): string {
    let selection: string;
    if (wordIndex === 0)
      selection = this.helpers.selectRandom(
        this._remainingWords.filter(
          this.filters.allLettersUnique
        )
      );
    else
      selection = this.helpers.selectRandom(this._remainingWords);

    this.previousWords.push(selection);
    return selection;
  }

  static filters = {
    allLettersUnique(word: string): boolean {
      return word.split('').reduce((prev: boolean, current: string) => {
        if (word.match(current).length !== 1) return false;
        else return prev;
      }, true);
    },

    hasAllIncludedLetters(word: string): boolean {
      // true = keep; false = remove
      let stillValid: boolean = true;
      Object.values(WordSelector.lettersData.data).forEach((letterData: LetterData) => {
        if (!stillValid) return;

        switch (letterData.result) {
          case TileResultTypes.correct:
            if (word[letterData.correctPosition] !== letterData.letter) stillValid = false;
            return;
          case TileResultTypes.present:
            if (!word.split('').includes(letterData.letter)) stillValid = false;
            return;
        }
      });

      return stillValid;
    },

    hasNoForbiddenLetters(word: string): boolean {
      // true = keep; false = remove
      return word.split('').reduce((previousResult: boolean, letter: string, index: number) => {
        if (WordSelector.lettersData.data[letter].result === TileResultTypes.absent) return false;

        switch (WordSelector.lettersData.data[letter].result) {
          case TileResultTypes.absent:
            return false;
          case TileResultTypes.present:
            WordSelector.previousWords.reduce((previousWordCheck: boolean, currentWord: string) => {
              if (currentWord[index] === letter) return false;
              else return previousWordCheck;
            }, previousResult);
          case TileResultTypes.correct:
            return previousResult && WordSelector.lettersData.data[letter].correctPosition === index;
          case TileResultTypes.unknown:
          default:
            return previousResult;
        }
      }, true);
    },

    wordHasNoAbsentsNorTriedPresents(word: string): boolean {
      // true = still might be okay; false = remove
      const letterResults: boolean[] = word.split('').map((letter: string, index: number) => {
        const letterData = WordSelector.lettersData.data[letter];

        if (letterData.result === TileResultTypes.absent) return false;
        else if (letterData.result === TileResultTypes.present) {
          if (letterData.presentPositions.includes(index)) return false;
        }

        return true;
      });

      const result: boolean = letterResults.reduce((prev: boolean, current: boolean) => {
        return prev && current;
      }, true);

      return result;
    },

    wordHasAllCorrectLetters(word: string): boolean {
      const correctLetters: string[] = WordSelector.lettersData.getCorrectLetters();

      return correctLetters.reduce((previous: boolean, letter: string | null, index: number) => {
        if (!previous) return false;
        if (!letter) return previous;
        else return word[index] === letter;
      }, true);
    },

    wordHasAllPresentLetters(word: string): boolean {
      const presentLetters: LetterData[] = WordSelector.lettersData.getPresentLetters();

      const result = presentLetters.reduce((previous: boolean, data: LetterData) => {
        if (!previous) return false;
        else return word.includes(data.letter);
      }, true);

      return result;
    },
  }

  static helpers = {
    selectRandom<T>(array: T[]): T {
      return array[Math.floor(Math.random() * array.length)];
    }
  }
}
