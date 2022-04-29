export type TileResultType = 0 | 1 | 2 | 3;
export const TileResultTypes = {
  unknown: 0 as TileResultType,
  absent: 1 as TileResultType,
  present: 2 as TileResultType,
  correct: 3 as TileResultType,
};

export const TileResultMap = {
  0: 'unknown',
  1: 'absent',
  2: 'present',
  3: 'correct',
}
