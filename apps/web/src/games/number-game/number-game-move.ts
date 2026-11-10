import type { CellIndex } from '@local/number-game';

/** The moves the server accepts, matching moveSchema in apps/server/src/games/number-game.ts. */
export type NumberGameMove =
  | { readonly type: 'match'; readonly firstIndex: CellIndex; readonly secondIndex: CellIndex }
  | { readonly type: 'add-numbers' }
  | { readonly type: 'hint' };
