import type { Cell } from './cell.js';
import type { CellIndex } from './game-state.js';
import { findBackwardVisibleCells, findForwardVisibleCells } from './line-of-sight.js';
import { PAIR_GROUP_LEADERS, pairPartners } from './pair.js';
import { createPlaceholderBoard, type SolutionPlan } from './solution-plan.js';
import {
  drawRandomFraction,
  drawRandomItem,
  drawShuffled,
  type RandomDraw,
  type RandomState,
} from '@local/seeded-random';

const IMPROVEMENT_STEP_COUNT = 20000;

// How many improvement steps pass between checks for a board without any unplanned pair.
const STEPS_BETWEEN_CONFLICT_CHECKS = 250;

// Chance that an improvement step moves a conflicting pair to a random group, to escape dead ends.
const RANDOM_WALK_CHANCE = 0.05;

// No pair group may take more than this share of the planned pairs, so every number keeps appearing.
const MAX_GROUP_SHARE = 0.3;

interface GroupAssignment {
  /** The group of each planned pair, as an index into the pair group leaders. Indexed like the plan. */
  readonly groupOfPlannedPair: number[];
  /** Per planned pair, the other planned pairs that own a cell it sees at the start, once per visible cell. */
  readonly visiblePlannedPairsOf: readonly (readonly number[])[];
  readonly useOfGroup: number[];
  readonly groupLimit: number;
}

const UNASSIGNED_GROUP = -1;

/**
 * Every number in one pair group pairs with every other, so two cells of different planned pairs
 * that see each other in the same group are an unplanned pair at the start. Counts those for each
 * group that a planned pair could take.
 */
function countUnplannedPairsPerGroup(
  assignment: GroupAssignment,
  plannedPairIndex: number,
): number[] {
  const counts = PAIR_GROUP_LEADERS.map(() => 0);
  for (const visiblePairIndex of assignment.visiblePlannedPairsOf[plannedPairIndex] ?? []) {
    const group = assignment.groupOfPlannedPair[visiblePairIndex];
    if (group !== undefined && group !== UNASSIGNED_GROUP) {
      counts[group] = (counts[group] ?? 0) + 1;
    }
  }
  return counts;
}

function setGroup(assignment: GroupAssignment, plannedPairIndex: number, group: number): void {
  const previousGroup = assignment.groupOfPlannedPair[plannedPairIndex];
  if (previousGroup !== undefined && previousGroup !== UNASSIGNED_GROUP) {
    assignment.useOfGroup[previousGroup] = (assignment.useOfGroup[previousGroup] ?? 0) - 1;
  }
  assignment.groupOfPlannedPair[plannedPairIndex] = group;
  assignment.useOfGroup[group] = (assignment.useOfGroup[group] ?? 0) + 1;
}

/** Groups a planned pair can take: those with room left once the pair has left its own group. */
function findAllowedGroups(assignment: GroupAssignment, plannedPairIndex: number): number[] {
  const currentGroup = assignment.groupOfPlannedPair[plannedPairIndex];
  return PAIR_GROUP_LEADERS.flatMap((_, group) =>
    (assignment.useOfGroup[group] ?? 0) - (group === currentGroup ? 1 : 0) < assignment.groupLimit
      ? [group]
      : [],
  );
}

/** Picks the allowed group with the fewest unplanned pairs, then the least used, then at random. */
function drawBestGroup(
  assignment: GroupAssignment,
  plannedPairIndex: number,
  randomState: RandomState,
): RandomDraw<number> {
  const unplannedPairsPerGroup = countUnplannedPairsPerGroup(assignment, plannedPairIndex);
  const currentGroup = assignment.groupOfPlannedPair[plannedPairIndex];
  const scoredGroups = findAllowedGroups(assignment, plannedPairIndex).map((group) => ({
    group,
    unplannedPairs: unplannedPairsPerGroup[group] ?? 0,
    use: (assignment.useOfGroup[group] ?? 0) - (group === currentGroup ? 1 : 0),
  }));
  const fewestUnplannedPairs = Math.min(...scoredGroups.map((scored) => scored.unplannedPairs));
  const fewestConflicting = scoredGroups.filter(
    (scored) => scored.unplannedPairs === fewestUnplannedPairs,
  );
  const leastUse = Math.min(...fewestConflicting.map((scored) => scored.use));
  const candidates = fewestConflicting
    .filter((scored) => scored.use === leastUse)
    .map((scored) => scored.group);
  return drawRandomItem(randomState, candidates);
}

function hasUnplannedPair(assignment: GroupAssignment, plannedPairIndex: number): boolean {
  const group = assignment.groupOfPlannedPair[plannedPairIndex];
  return (assignment.visiblePlannedPairsOf[plannedPairIndex] ?? []).some(
    (visiblePairIndex) => assignment.groupOfPlannedPair[visiblePairIndex] === group,
  );
}

function listVisiblePlannedPairs(plan: SolutionPlan, width: number): (readonly number[])[] {
  const startingBoard = createPlaceholderBoard(width);
  const plannedPairOfCell = new Map<CellIndex, number>();
  for (const [plannedPairIndex, plannedPair] of plan.entries()) {
    plannedPairOfCell.set(plannedPair.firstIndex, plannedPairIndex);
    plannedPairOfCell.set(plannedPair.secondIndex, plannedPairIndex);
  }
  return plan.map((plannedPair, plannedPairIndex) =>
    [plannedPair.firstIndex, plannedPair.secondIndex].flatMap((cellIndex) =>
      [
        ...findForwardVisibleCells(startingBoard, width, cellIndex),
        ...findBackwardVisibleCells(startingBoard, width, cellIndex),
      ].flatMap((visibleIndex) => {
        const visiblePairIndex = plannedPairOfCell.get(visibleIndex);
        if (visiblePairIndex === undefined) {
          throw new Error(`Cell ${String(visibleIndex)} sees a number that is not in the plan`);
        }
        return visiblePairIndex === plannedPairIndex ? [] : [visiblePairIndex];
      }),
    ),
  );
}

function improveGroups(assignment: GroupAssignment, randomState: RandomState): RandomState {
  const plannedPairIndexes = assignment.groupOfPlannedPair.map((_, index) => index);
  let currentState = randomState;
  for (let step = 0; step < IMPROVEMENT_STEP_COUNT; step++) {
    if (
      step % STEPS_BETWEEN_CONFLICT_CHECKS === 0 &&
      !plannedPairIndexes.some((index) => hasUnplannedPair(assignment, index))
    ) {
      break;
    }
    const pickDraw = drawRandomItem(currentState, plannedPairIndexes);
    currentState = pickDraw.randomState;
    if (!hasUnplannedPair(assignment, pickDraw.value)) {
      continue;
    }
    const walkDraw = drawRandomFraction(currentState);
    const groupDraw =
      walkDraw.value < RANDOM_WALK_CHANCE
        ? drawRandomItem(walkDraw.randomState, findAllowedGroups(assignment, pickDraw.value))
        : drawBestGroup(assignment, pickDraw.value, walkDraw.randomState);
    setGroup(assignment, pickDraw.value, groupDraw.value);
    currentState = groupDraw.randomState;
  }
  return currentState;
}

/**
 * Gives the two cells of every planned pair numbers that pair (NG-35), choosing the pair group of
 * each planned pair so that few unplanned pairs see each other on the starting board. Groups are
 * picked one pair at a time in a random order, then improved by re-picking the group of pairs that
 * sit in an unplanned visible pair.
 */
export function assignPlannedPairDigits(
  width: number,
  plan: SolutionPlan,
  randomState: RandomState,
): RandomDraw<Cell[]> {
  const assignment: GroupAssignment = {
    groupOfPlannedPair: plan.map(() => UNASSIGNED_GROUP),
    visiblePlannedPairsOf: listVisiblePlannedPairs(plan, width),
    useOfGroup: PAIR_GROUP_LEADERS.map(() => 0),
    groupLimit: Math.ceil(plan.length * MAX_GROUP_SHARE),
  };

  const orderDraw = drawShuffled(
    randomState,
    plan.map((_, plannedPairIndex) => plannedPairIndex),
  );
  let currentState = orderDraw.randomState;
  for (const plannedPairIndex of orderDraw.value) {
    const groupDraw = drawBestGroup(assignment, plannedPairIndex, currentState);
    setGroup(assignment, plannedPairIndex, groupDraw.value);
    currentState = groupDraw.randomState;
  }
  currentState = improveGroups(assignment, currentState);

  const cells = Array<Cell>(width * width).fill(null);
  for (const [plannedPairIndex, plannedPair] of plan.entries()) {
    const groupLeader = PAIR_GROUP_LEADERS[assignment.groupOfPlannedPair[plannedPairIndex] ?? -1];
    if (groupLeader === undefined) {
      throw new Error(`Planned pair ${String(plannedPairIndex)} was left without a pair group`);
    }
    for (const cellIndex of [plannedPair.firstIndex, plannedPair.secondIndex]) {
      const digitDraw = drawRandomItem(currentState, pairPartners(groupLeader));
      cells[cellIndex] = digitDraw.value;
      currentState = digitDraw.randomState;
    }
  }
  return { value: cells, randomState: currentState };
}
