import fs from 'fs';
import { LetterData, SingleLetterAttemptData } from './models/letter.js';
import { WordResult } from './models/word-result.js';
import { TileResultTypes } from "./models/tile-result-types.js";
import { TileResult } from "./models/tile-result.js";
import { AlphabetData } from './models/alphabet.js';
import { Controller } from './controller.js';

const WORD_SELECTOR_INDEX: number = 6;

export class WordSelector {
  private static _remainingWords: string[];
  private static _preferredRemainingWords: string[];

  private static lettersData: AlphabetData = new AlphabetData();
  private static previousWords: string[] = [];
  private static previousResults: WordResult[] = [];

  static async init(): Promise<void> {
    this._remainingWords = JSON.parse(fs.readFileSync('data/words.json', 'utf8'));
    this.setPreferredRemainingWords();
  }

  public static get remainingWords(): string[] {
    return this._remainingWords.slice(0);
  }

  static getSharableResults() {
    let output: string = '';
    output += `Wordlebot ${Math.floor((Date.now() - new Date('2021/06/19').getTime()) / (24 * 60 * 60 * 1000))} ${Math.min(this.previousResults.length, 6)}/6\n\n`;

    this.previousResults.forEach((result: WordResult) => {
      result.values.forEach((letter: TileResult) => {
        switch (letter.result) {
          case TileResultTypes.absent:
            output += '⬛';
            break;
          case TileResultTypes.present:
            output += '🟨';
            break;
          case TileResultTypes.correct:
            output += '🟩';
            break;
        }
      });

      output += '\n';
    });

    return output;
  }

  static async processResults(results: WordResult, word: string): Promise<void> {
    const __debugLogFilter = (name: string) => {
      if (Controller.debug)
        console.log(`Remaining words ${name}: ${this.remainingWords.length > 12 ? this.remainingWords.length : this.remainingWords.join(', ')}`);
    }

    // register letter results
    results.values.forEach((result: TileResult, index: number) => {
      this.lettersData.data[result.letter].attempts.push(new SingleLetterAttemptData(result.result, index, word[index]));
    });

    // record results as word
    this.registerFullWordResult(results, word);

    // record result
    this.previousResults.push(results);

    // filter remaining words
    __debugLogFilter('pre-filters');
    this._remainingWords = this._remainingWords.filter(this.filters.wordHasNoAbsents);
    __debugLogFilter('after no absents');
    this._remainingWords = this._remainingWords.filter(this.filters.wordDoesntRetryPastPresents);
    __debugLogFilter('after no present conflicts');
    this._remainingWords = this._remainingWords.filter(this.filters.wordHasCorrectPresentCount);
    __debugLogFilter('after correct present count');
    this._remainingWords = this._remainingWords.filter(this.filters.wordHasAllCorrectLetters);
    __debugLogFilter('after all corrects');
    this._remainingWords = this._remainingWords.filter(this.filters.wordHasAllPresentLetters);
    __debugLogFilter('after all present');
    this._remainingWords = this._remainingWords.filter((remWord) => remWord !== results.word); // not the previous word

    __debugLogFilter('post-filters');

    // filter remaining words by those most helpful
    this.setPreferredRemainingWords();
  }

  static registerFullWordResult(result: WordResult, word: string) {
    const lettersSet: string[] = word.split('').reduce((prev: string[], letter: string) => {
      if (!prev.includes(letter))
        prev.push(letter);

      return prev;
    }, []);

    const resultsPerLetter: {
      letter: string, results: TileResult[]
    }[] = lettersSet.map((uniqueLetter: string) => {
      const resultsForLetter = result.values.filter((tile: TileResult) => {
        return (tile.letter === uniqueLetter);
      });

      return {
        letter: uniqueLetter,
        results: resultsForLetter
      }
    });

    resultsPerLetter.forEach((letterResults) => {
      // filter results by type
      const instances = {
        present: [],
        correct: [],
        absent: [],
      }

      letterResults.results.forEach((tileResult: TileResult) => {
        switch (tileResult.result) {
          case TileResultTypes.correct:
            instances.correct.push(tileResult);
            break;
          case TileResultTypes.present:
            instances.present.push(tileResult);
            break;
          case TileResultTypes.absent:
            instances.absent.push(tileResult);
            break;
        }
      });

      // process type-filtered results
      if (instances.absent.length > 0) {
        this.lettersData.data[letterResults.letter].instancesInWord.max = instances.present.length + instances.correct.length;
      }

      this.lettersData.data[letterResults.letter].instancesInWord.min = instances.present.length + instances.correct.length;
    });
  }

  static reset() {
   WordSelector._remainingWords =[];
   WordSelector._preferredRemainingWords = [];

   WordSelector.lettersData = new AlphabetData();
   WordSelector.previousWords = [];
   WordSelector.previousResults = [];
  }

  static selectWord(wordIndex: number): string {
    let selection: string;
    if (Controller.debug)
      selection = this._preferredRemainingWords[Math.min(this._preferredRemainingWords.length - 1, WORD_SELECTOR_INDEX)];
    else if (wordIndex === 0)
      selection = this.helpers.selectRandom(
        this._preferredRemainingWords.filter(
          this.filters.allLettersUnique
        )
      );
    else
      selection = this.helpers.selectRandom(this._preferredRemainingWords);

    this.previousWords.push(selection);
    return selection;
  }

  static setPreferredRemainingWords() {
    this._preferredRemainingWords = this._remainingWords;

    if (this.previousResults.length < 4) { // filter by unique letters
      const wordsWithUniqueLetters = this._remainingWords.filter(this.filters.wordHasUniqueLetters);
      if (wordsWithUniqueLetters.length > 0)
        this._preferredRemainingWords = wordsWithUniqueLetters;
    }
  }

  static filters = {
    allLettersUnique(word: string): boolean {
      return word.split('').reduce((prev: boolean, current: string) => {
        if (word.match(current).length !== 1) return false;
        else return prev;
      }, true);
    },

    wordHasNoAbsents(word: string): boolean {
      const result: boolean = word.split('').reduce((prev: boolean, letter: string) => {
        if (!prev) return prev;

        const letterData: LetterData = WordSelector.lettersData.data[letter];
        if (letterData.getBestResultType() === TileResultTypes.absent) return false;
        return true;
      }, true);

      return result;
    },

    wordHasCorrectPresentCount(word: string): boolean {
      const result: boolean = word.split('').reduce((prev: boolean, letter: string, index: number) => {
        if (!prev) return prev;

        const letterData: LetterData = WordSelector.lettersData.data[letter];
        const instancesInWord: number = word.split('').filter((wordLetter: string) => wordLetter === letter).length;

        if (instancesInWord < letterData.instancesInWord.min) return false;
        if (instancesInWord > letterData.instancesInWord.max) return false;

        return true;
      }, true);

      return result;
    },

    wordDoesntRetryPastPresents(word: string): boolean {
      const result: boolean = word.split('').reduce((prev: boolean, letter: string, index: number) => {
        if (!prev) return prev;

        const letterData: LetterData = WordSelector.lettersData.data[letter];
        const previousAttempts: number[] = letterData.getPreviousPresentPositions();

        if (previousAttempts.includes(index)) return false;

        return true;
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

    wordHasUniqueLetters(word: string): boolean {
      return word.split('').reduce((prev: boolean, current: string) => {
        return prev && word.indexOf(current) === word.lastIndexOf(current);
      }, true);
    },
  }

  static helpers = {
    selectRandom<T>(array: T[]): T {
      return array[Math.floor(Math.random() * array.length)];
    }
  }
}
