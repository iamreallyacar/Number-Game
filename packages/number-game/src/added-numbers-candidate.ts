import { digitsOnBoard } from './board.js';
import type { Cell, Digit } from './cell.js';
import { findForwardVisibleCells, findBackwardVisibleCells } from './line-of-sight.js';
import { isPair, pairGroupNumberOf, pairPartners } from './pair.js';
import {
  drawRandomFraction,
  drawRandomItem,
  type RandomDraw,
  type RandomState,
} from '@local/seeded-random';

function digitAt(cells: readonly Cell[], index: number): Digit {
  const cell = cells[index];
  if (cell === null || cell === undefined) {
    throw new Error(`Expected a number at cell ${String(index)}`);
  }
  return cell;
}

function oddPairGroupNumbers(cells: readonly Cell[]): Set<number> {
  const oddGroupNumbers = new Set<number>();
  for (const cell of cells) {
    if (cell !== null) {
      toggleGroup(oddGroupNumbers, cell);
    }
  }
  return oddGroupNumbers;
}

function toggleGroup(oddGroupNumbers: Set<number>, digit: Digit): void {
  const groupNumber = pairGroupNumberOf(digit);
  if (!oddGroupNumbers.delete(groupNumber)) {
    oddGroupNumbers.add(groupNumber);
  }
}

/** A number that sees no partner in any direction on the board as it is now. */
function isStranded(cells: readonly Cell[], width: number, index: number): boolean {
  const ownDigit = digitAt(cells, index);
  return ![
    ...findForwardVisibleCells(cells, width, index),
    ...findBackwardVisibleCells(cells, width, index),
  ].some((seenIndex) => isPair(ownDigit, digitAt(cells, seenIndex)));
}

/**
 * Narrows the choices to digits that pair with a number the next cell will see, preferring a seen
 * number that is stranded. Keeps every choice when none of them can pair with a seen number.
 */
function aimChoices(
  choices: readonly Digit[],
  placedCells: readonly Cell[],
  width: number,
): readonly Digit[] {
  const seenIndexes = findBackwardVisibleCells(placedCells, width, placedCells.length);
  const pairingChoices = (seenDigits: readonly Digit[]): Digit[] =>
    choices.filter((choice) => seenDigits.some((seenDigit) => isPair(choice, seenDigit)));
  const strandedChoices = pairingChoices(
    seenIndexes
      .filter((seenIndex) => isStranded(placedCells, width, seenIndex))
      .map((seenIndex) => digitAt(placedCells, seenIndex)),
  );
  if (strandedChoices.length > 0) {
    return strandedChoices;
  }
  const seenChoices = pairingChoices(
    seenIndexes.map((seenIndex) => digitAt(placedCells, seenIndex)),
  );
  return seenChoices.length > 0 ? seenChoices : choices;
}

function assertCanEvenOut(oddGroupCount: number, slotsLeft: number): void {
  if (oddGroupCount > slotsLeft || (slotsLeft - oddGroupCount) % 2 !== 0) {
    throw new Error(
      `Cannot even out ${String(oddGroupCount)} odd pair groups with ${String(slotsLeft)} numbers left`,
    );
  }
}

/**
 * Builds one set of numbers to add after the last number of the board (NG-36). Numbers are chosen
 * in placement order from the digits still on the board (NG-33). Once the odd pair groups need
 * every number left, only digits from odd groups are allowed, which leaves every group even
 * (NG-34) without a fix-up pass. Each number is aimed with the given chance. When the set is
 * larger than the count of odd groups, the first number pairs with the last number of the board.
 */
export function buildAddedNumbersCandidate(
  randomState: RandomState,
  boardCells: readonly Cell[],
  width: number,
  count: number,
  aimChance: number,
): RandomDraw<Digit[]> {
  const lastNumberIndex = boardCells.findLastIndex((cell) => cell !== null);
  if (lastNumberIndex < 0) {
    throw new Error('Added numbers need at least one number on the board');
  }
  const placedCells: Cell[] = boardCells.slice(0, lastNumberIndex + 1);
  const lastNumberDigit = digitAt(placedCells, lastNumberIndex);
  const allowedDigits = digitsOnBoard(boardCells);
  const oddGroupNumbers = oddPairGroupNumbers(placedCells);
  const needsFloor = count > oddGroupNumbers.size;
  const addedDigits: Digit[] = [];
  let currentState = randomState;

  for (let slotsLeft = count; slotsLeft > 0; slotsLeft--) {
    assertCanEvenOut(oddGroupNumbers.size, slotsLeft);
    let choices: readonly Digit[] = allowedDigits;
    if (oddGroupNumbers.size === slotsLeft) {
      choices = choices.filter((digit) => oddGroupNumbers.has(pairGroupNumberOf(digit)));
    }
    const aimDraw = drawRandomFraction(currentState);
    currentState = aimDraw.randomState;
    if (needsFloor && addedDigits.length === 0) {
      choices = choices.filter((digit) => pairPartners(lastNumberDigit).includes(digit));
    } else if (aimDraw.value < aimChance) {
      choices = aimChoices(choices, placedCells, width);
    }
    const draw = drawRandomItem(currentState, choices);
    currentState = draw.randomState;
    addedDigits.push(draw.value);
    placedCells.push(draw.value);
    toggleGroup(oddGroupNumbers, draw.value);
  }
  assertCanEvenOut(oddGroupNumbers.size, 0);
  return { value: addedDigits, randomState: currentState };
}
