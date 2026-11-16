import type { Cell } from './cell.js';
import type { CellIndex } from './game-state.js';
import { findBackwardVisibleCells, findForwardVisibleCells } from './line-of-sight.js';
import { PAIR_GROUP_LEADERS, pairPartners } from './pair.js';
import { createPlaceholderBoard, type SolutionPlan } from './solution-plan.js';
import {
  drawRandomFraction,
  drawRandomItem,
  type RandomDraw,
  type RandomState,
} from '@local/seeded-random';

const IMPROVEMENT_STEP_COUNT = 50000;

// The search starts hot, so it often accepts a move that adds unplanned pairs and can leave a dead
// end, and cools step by step until it almost only accepts moves that do not add any.
const START_TEMPERATURE = 2;
const END_TEMPERATURE = 0.1;

// No pair group may take more than this share of the planned pairs, so every number keeps appearing.
const MAX_GROUP_SHARE = 0.3;

const GROUP_COUNT = PAIR_GROUP_LEADERS.length;

interface GroupAssignment {
  /** The group of each planned pair, as an index into the pair group leaders. Indexed like the plan. */
  readonly groupOfPlannedPair: number[];
  /** Per planned pair, the other planned pairs that own a cell it sees at the start, once per visible cell. */
  readonly visiblePlannedPairsOf: readonly (readonly number[])[];
  /**
   * Per planned pair and group, at plannedPairIndex * GROUP_COUNT + group: how many of the cells
   * it sees at the start belong to planned pairs in that group.
   */
  readonly visibleCellsInGroup: number[];
  readonly useOfGroup: number[];
  readonly groupLimit: number;
}

function visibleCellsInGroupOf(
  assignment: GroupAssignment,
  plannedPairIndex: number,
  group: number,
): number {
  return assignment.visibleCellsInGroup[plannedPairIndex * GROUP_COUNT + group] ?? 0;
}

function groupOf(assignment: GroupAssignment, plannedPairIndex: number): number {
  const group = assignment.groupOfPlannedPair[plannedPairIndex];
  if (group === undefined) {
    throw new RangeError(`Planned pair ${String(plannedPairIndex)} is not in the plan`);
  }
  return group;
}

function changeVisibleCounts(
  assignment: GroupAssignment,
  plannedPairIndex: number,
  group: number,
  change: number,
): void {
  for (const visiblePairIndex of assignment.visiblePlannedPairsOf[plannedPairIndex] ?? []) {
    const slot = visiblePairIndex * GROUP_COUNT + group;
    assignment.visibleCellsInGroup[slot] = (assignment.visibleCellsInGroup[slot] ?? 0) + change;
  }
  assignment.useOfGroup[group] = (assignment.useOfGroup[group] ?? 0) + change;
}

function moveToGroup(assignment: GroupAssignment, plannedPairIndex: number, group: number): void {
  changeVisibleCounts(assignment, plannedPairIndex, groupOf(assignment, plannedPairIndex), -1);
  assignment.groupOfPlannedPair[plannedPairIndex] = group;
  changeVisibleCounts(assignment, plannedPairIndex, group, 1);
}

function hasRoom(assignment: GroupAssignment, group: number): boolean {
  return (assignment.useOfGroup[group] ?? 0) < assignment.groupLimit;
}

/**
 * Every number in one pair group pairs with every other, so two cells of different planned pairs
 * that see each other in the same group are an unplanned pair at the start. Each one is seen from
 * both of its planned pairs, so the sum over all planned pairs counts it twice.
 */
function countUnplannedPairs(assignment: GroupAssignment): number {
  const twiceTheCount = assignment.groupOfPlannedPair.reduce(
    (total, group, plannedPairIndex) =>
      total + visibleCellsInGroupOf(assignment, plannedPairIndex, group),
    0,
  );
  return twiceTheCount / 2;
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

/** Gives every planned pair a random group that still has room. */
function drawStartingAssignment(
  plan: SolutionPlan,
  width: number,
  randomState: RandomState,
): RandomDraw<GroupAssignment> {
  const assignment: GroupAssignment = {
    groupOfPlannedPair: [],
    visiblePlannedPairsOf: listVisiblePlannedPairs(plan, width),
    visibleCellsInGroup: Array<number>(plan.length * GROUP_COUNT).fill(0),
    useOfGroup: Array<number>(GROUP_COUNT).fill(0),
    groupLimit: Math.ceil(plan.length * MAX_GROUP_SHARE),
  };
  let currentState = randomState;
  for (let plannedPairIndex = 0; plannedPairIndex < plan.length; plannedPairIndex++) {
    const groupsWithRoom = PAIR_GROUP_LEADERS.flatMap((_, group) =>
      hasRoom(assignment, group) ? [group] : [],
    );
    const groupDraw = drawRandomItem(currentState, groupsWithRoom);
    assignment.groupOfPlannedPair.push(groupDraw.value);
    changeVisibleCounts(assignment, plannedPairIndex, groupDraw.value, 1);
    currentState = groupDraw.randomState;
  }
  return { value: assignment, randomState: currentState };
}

/**
 * Moves planned pairs between groups by simulated annealing until at most the allowed count of
 * unplanned pairs is left, or the steps run out. A move that adds unplanned pairs is still taken
 * with a chance that shrinks as the temperature cools.
 */
function improveGroups(
  assignment: GroupAssignment,
  allowedUnplannedPairCount: number,
  randomState: RandomState,
): RandomState {
  const plannedPairIndexes = assignment.groupOfPlannedPair.map((_, index) => index);
  const groups = PAIR_GROUP_LEADERS.map((_, group) => group);
  let unplannedPairCount = countUnplannedPairs(assignment);
  let currentState = randomState;
  for (
    let step = 0;
    step < IMPROVEMENT_STEP_COUNT && unplannedPairCount > allowedUnplannedPairCount;
    step++
  ) {
    const pairDraw = drawRandomItem(currentState, plannedPairIndexes);
    const groupDraw = drawRandomItem(pairDraw.randomState, groups);
    const acceptDraw = drawRandomFraction(groupDraw.randomState);
    currentState = acceptDraw.randomState;
    const plannedPairIndex = pairDraw.value;
    const currentGroup = groupOf(assignment, plannedPairIndex);
    const newGroup = groupDraw.value;
    if (newGroup === currentGroup || !hasRoom(assignment, newGroup)) {
      continue;
    }
    const change =
      visibleCellsInGroupOf(assignment, plannedPairIndex, newGroup) -
      visibleCellsInGroupOf(assignment, plannedPairIndex, currentGroup);
    const temperature =
      START_TEMPERATURE * (END_TEMPERATURE / START_TEMPERATURE) ** (step / IMPROVEMENT_STEP_COUNT);
    if (change <= 0 || acceptDraw.value < Math.exp(-change / temperature)) {
      moveToGroup(assignment, plannedPairIndex, newGroup);
      unplannedPairCount += change;
    }
  }
  return currentState;
}

/**
 * Gives the two cells of every planned pair numbers that pair (NG-35), choosing the pair group of
 * each planned pair so that few unplanned pairs see each other on the starting board. The search
 * stops once at most the allowed count of unplanned pairs is left, which lets the caller aim for a
 * count of opening pairs.
 */
export function assignPlannedPairDigits(
  width: number,
  plan: SolutionPlan,
  allowedUnplannedPairCount: number,
  randomState: RandomState,
): RandomDraw<Cell[]> {
  const startingDraw = drawStartingAssignment(plan, width, randomState);
  const assignment = startingDraw.value;
  let currentState = improveGroups(assignment, allowedUnplannedPairCount, startingDraw.randomState);

  const cells = Array<Cell>(width * width).fill(null);
  for (const [plannedPairIndex, plannedPair] of plan.entries()) {
    const groupLeader = PAIR_GROUP_LEADERS[groupOf(assignment, plannedPairIndex)];
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
