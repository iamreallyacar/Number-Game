import { createRandomState, type RandomState } from '@local/seeded-random';
import { describe, expect, it } from 'vitest';
import { cellIndexAt, countFullLines, createEmptyCells } from './board.js';
import { placeAndClearLines } from './place-and-clear.js';
import { dealHand, drawShapeId, MAX_FAIR_HAND_TRIES } from './deal-shapes.js';
import { canPlaceWholeHand } from './fair-hand.js';
import { BOARD_SIZE, type GameState } from './game-state.js';
import { isGameOver } from './game-over.js';
import { createGame } from './new-game.js';
import { applyPlacement } from './place-shape.js';
import { shapeFitsAt } from './shape-fit.js';
import { CHECKERBOARD_ROWS, cellsFromRows } from './test-support.js';
import { getShape, SHAPE_IDS, type ShapeId } from './shape-catalogue.js';

const EMPTY_BOARD = { cells: createEmptyCells() };

function drawManyShapeIds(randomState: RandomState, count: number, shapesPlaced = 0): ShapeId[] {
  const shapeIds: ShapeId[] = [];
  let currentState = randomState;
  for (let drawn = 0; drawn < count; drawn++) {
    const draw = drawShapeId(currentState, shapesPlaced);
    shapeIds.push(draw.value);
    currentState = draw.randomState;
  }
  return shapeIds;
}

describe('dealing shapes', () => {
  it('deals the same shapes from the same state', () => {
    const state = createRandomState(21);
    expect(drawManyShapeIds(state, 30)).toEqual(drawManyShapeIds(state, 30));
    expect(dealHand(state, 0, EMPTY_BOARD)).toEqual(dealHand(state, 0, EMPTY_BOARD));
  });

  it('deals three slots and moves the random state on', () => {
    const state = createRandomState(4);
    const deal = dealHand(state, 0, EMPTY_BOARD);
    expect(deal.value).toHaveLength(3);
    expect(deal.randomState).not.toBe(state);
  });

  it('can deal every shape, and deals common shapes more often than awkward ones', () => {
    const shapeIds = drawManyShapeIds(createRandomState(99), 20000);
    expect(new Set(shapeIds)).toEqual(new Set(SHAPE_IDS));
    const countOf = (shapeId: ShapeId): number => shapeIds.filter((id) => id === shapeId).length;
    expect(countOf('square-2')).toBeGreaterThan(countOf('square-3') * 3);
    expect(countOf('single')).toBeGreaterThan(countOf('diagonal-3-down') * 2);
  });

  it('deals big shapes more often after 200 placements than at the start', () => {
    const countOfSquare3 = (shapesPlaced: number): number =>
      drawManyShapeIds(createRandomState(7), 20000, shapesPlaced).filter((id) => id === 'square-3')
        .length;
    expect(countOfSquare3(200)).toBeGreaterThan(countOfSquare3(0) * 3);
  });

  it('deals the same shapes at any count from 200 placements on', () => {
    const state = createRandomState(13);
    expect(drawManyShapeIds(state, 50, 200)).toEqual(drawManyShapeIds(state, 50, 1000));
  });
});

describe('dealing fair hands', () => {
  const checkerboard = { cells: cellsFromRows(CHECKERBOARD_ROWS) };
  const crowdedBoard = {
    cells: cellsFromRows([
      '..0.0.0.0.',
      '.0.0.0.0.0',
      '0.0.0.0.0.',
      '.0.0.0.0.0',
      '..0.0.0.0.',
      '.0.0.0.0.0',
      '0.0.0.0.0.',
      '.0.0.0.0.0',
      '0.0.0.0.0.',
      '.0.0.0.0.0',
    ]),
  };

  it('deals three plain weighted draws on an empty board', () => {
    const state = createRandomState(4);
    const drawn = dealHand(state, 0, EMPTY_BOARD);
    const first = drawShapeId(state, 0);
    const second = drawShapeId(first.randomState, 0);
    const third = drawShapeId(second.randomState, 0);
    expect(drawn.value).toEqual([first.value, second.value, third.value]);
    expect(drawn.randomState).toBe(third.randomState);
  });

  it('redraws an unfair first hand on a crowded board until the hand is fair', () => {
    const state = createRandomState(4);
    const plainHand = drawManyShapeIds(state, 3);
    expect(canPlaceWholeHand(crowdedBoard, plainHand)).toBe(false);
    const dealt = dealHand(state, 0, crowdedBoard);
    expect(dealt.value).not.toEqual(plainHand);
    expect(
      canPlaceWholeHand(
        crowdedBoard,
        dealt.value.filter((id) => id !== null),
      ),
    ).toBe(true);
  });

  it('deals three single cells after all tries fail, with the random state after every try', () => {
    const state = createRandomState(0);
    const dealt = dealHand(state, 0, checkerboard);
    expect(dealt.value).toEqual(['single', 'single', 'single']);
    let expectedState = state;
    for (let draw = 0; draw < MAX_FAIR_HAND_TRIES * 3; draw++) {
      expectedState = drawShapeId(expectedState, 0).randomState;
    }
    expect(dealt.randomState).toBe(expectedState);
  });
});

const SIDE_STEPS = [
  { rowStep: -1, columnStep: 0 },
  { rowStep: 1, columnStep: 0 },
  { rowStep: 0, columnStep: -1 },
  { rowStep: 0, columnStep: 1 },
];

describe('playing with fair hands', () => {
  // Clearing lines matters most. Touching filled cells or walls comes next, so the board stays
  // tidy and games last long enough to reach the crowded boards where fair hands are hard to find.
  function scorePlacement(
    state: GameState,
    shapeId: ShapeId,
    topRow: number,
    leftColumn: number,
  ): number {
    const shapeCells = getShape(shapeId).cells;
    const isShapeBlock = (row: number, column: number): boolean =>
      shapeCells.some(
        (cell) => topRow + cell.rowOffset === row && leftColumn + cell.columnOffset === column,
      );
    let touchingSides = 0;
    for (const cell of shapeCells) {
      const row = topRow + cell.rowOffset;
      const column = leftColumn + cell.columnOffset;
      for (const { rowStep, columnStep } of SIDE_STEPS) {
        const neighbourRow = row + rowStep;
        const neighbourColumn = column + columnStep;
        const isOffBoard =
          neighbourRow < 0 ||
          neighbourColumn < 0 ||
          neighbourRow >= BOARD_SIZE ||
          neighbourColumn >= BOARD_SIZE;
        if (
          !isShapeBlock(neighbourRow, neighbourColumn) &&
          (isOffBoard || state.cells[cellIndexAt(neighbourRow, neighbourColumn)] !== null)
        ) {
          touchingSides++;
        }
      }
    }
    const clearedLines = countFullLines(
      placeAndClearLines(state, shapeId, topRow, leftColumn).fullLines,
    );
    return clearedLines * 100 + touchingSides;
  }

  function playBestScoringShape(state: GameState): GameState | null {
    let best: { slotIndex: number; topRow: number; leftColumn: number; score: number } | null =
      null;
    for (const [slotIndex, shapeId] of state.slots.entries()) {
      if (shapeId === null) {
        continue;
      }
      for (let topRow = 0; topRow < BOARD_SIZE; topRow++) {
        for (let leftColumn = 0; leftColumn < BOARD_SIZE; leftColumn++) {
          if (!shapeFitsAt(state, shapeId, topRow, leftColumn)) {
            continue;
          }
          const score = scorePlacement(state, shapeId, topRow, leftColumn);
          if (best === null || score > best.score) {
            best = { slotIndex, topRow, leftColumn, score };
          }
        }
      }
    }
    if (best === null) {
      return null;
    }
    const result = applyPlacement(state, best.slotIndex, best.topRow, best.leftColumn);
    return result.accepted ? result.state : null;
  }

  it.each([1, 2, 3, 4, 5, 6])(
    'never deals a hand that cannot be placed in full or ends the game (seed %i)',
    (seed) => {
      let state = createGame({ seed });
      for (let placement = 0; placement < 400; placement++) {
        const handJustDealt = state.slots.every((shapeId) => shapeId !== null);
        if (handJustDealt) {
          expect(
            canPlaceWholeHand(
              state,
              state.slots.filter((id) => id !== null),
            ),
          ).toBe(true);
          expect(isGameOver(state)).toBe(false);
        }
        const nextState = playBestScoringShape(state);
        if (nextState === null) {
          break;
        }
        state = nextState;
      }
      // The first-fit player ended after 23 to 53 placements; this one reaches 47 to 215, so the
      // run must get well past the near-empty early game.
      expect(state.shapesPlaced).toBeGreaterThan(40);
    },
  );
});
