import { TileResultTypes } from "./results.js";

export class LettersData {
  data: Record<string, TileResultTypes>;

  constructor() {
    'abcdefghijklmnopqrstuvqxyz'.split('').forEach((letter) => {
      this.data[letter] = TileResultTypes.unknown;
    });
  } 
}
