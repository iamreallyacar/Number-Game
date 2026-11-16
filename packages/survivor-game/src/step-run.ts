import { fireBasicShots } from './basic-shot.js';
import { moveBullets } from './bullets.js';
import {
  applyTouchDamage,
  removeBeatenEnemies,
  removeFarEnemies,
  walkEnemies,
} from './enemy-behaviour.js';
import { spawnEnemies } from './enemy-spawning.js';
import { endRunIfDefeated, isRunOver, RunAlreadyEndedError } from './end-of-run.js';
import { gainExperience } from './experience.js';
import type { Vector } from './geometry.js';
import { movePlayers } from './movement.js';
import { giveLevelUpOffers } from './offers.js';
import { InvalidStepInputError, toUnitDirection, type StepInputs } from './player-input.js';
import { playerSpeedOf } from './player-stats.js';
import type { RunState } from './run-state.js';
import { pullPlayersBackToRope } from './rope.js';
import {
  applyUpgradeChoice,
  findUpgradeChoiceRefusal,
  UpgradeChoiceRefusedError,
} from './upgrade-choice.js';

function checkInputs(state: RunState, inputs: StepInputs): void {
  const knownPlayerIds = new Set(state.players.map((player) => player.playerId));
  for (const [playerId, input] of inputs) {
    if (!knownPlayerIds.has(playerId)) {
      throw new InvalidStepInputError(`Player '${playerId}' is not in this run`);
    }
    if (input.upgradeChoice !== null) {
      const refusal = findUpgradeChoiceRefusal(state, playerId, input.upgradeChoice);
      if (refusal !== null) {
        throw new UpgradeChoiceRefusedError(playerId, input.upgradeChoice, refusal);
      }
    }
  }
}

function applyUpgradeChoices(state: RunState, inputs: StepInputs): RunState {
  let current = state;
  for (const player of state.players) {
    const choice = inputs.get(player.playerId)?.upgradeChoice ?? null;
    // A team upgrade chosen earlier in this same step can take the choice out of this offer. That
    // is a race between two players and not a mistake, so the player just sees the changed offer.
    if (choice !== null && findUpgradeChoiceRefusal(current, player.playerId, choice) === null) {
      current = applyUpgradeChoice(current, player.playerId, choice);
    }
  }
  return current;
}

function unitDirectionsOf(inputs: StepInputs): Map<string, Vector> {
  const directions = new Map<string, Vector>();
  for (const [playerId, input] of inputs) {
    const direction = toUnitDirection(input.direction);
    if (direction !== null) {
      directions.set(playerId, direction);
    }
  }
  return directions;
}

function addExperienceAndOffers(state: RunState, experience: number): RunState {
  const gained = gainExperience(state.teamLevel, state.teamExperience, experience);
  let { players, randomState } = state;
  for (let level = 0; level < gained.levelsGained; level += 1) {
    ({ players, randomState } = giveLevelUpOffers(players, state.teamUpgradeCounts, randomState));
  }
  return {
    ...state,
    teamLevel: gained.level,
    teamExperience: gained.experience,
    players,
    randomState,
  };
}

/**
 * Advances the run by one step of 1 / STEP_RATE seconds. A pure function of the state and the
 * inputs, with all randomness taken from the state. A player without an input stands still.
 *
 * Throws `InvalidStepInputError` for an unknown player or a direction that is not a number, and
 * `UpgradeChoiceRefusedError` for a choice that is not in that player's offer. In both cases
 * nothing has changed. Throws `RunAlreadyEndedError` for a run that is over.
 */
export function stepRun(state: RunState, inputs: StepInputs): RunState {
  if (isRunOver(state)) {
    throw new RunAlreadyEndedError('A run that has ended cannot be stepped');
  }
  checkInputs(state, inputs);
  const afterChoices = applyUpgradeChoices(state, inputs);

  const unitDirections = unitDirectionsOf(inputs);
  const moved = movePlayers(
    afterChoices.players,
    unitDirections,
    playerSpeedOf(afterChoices.teamUpgradeCounts),
  );
  const players = pullPlayersBackToRope(moved, new Set(unitDirections.keys()));

  const shots = fireBasicShots(
    players,
    afterChoices.enemies,
    afterChoices.bullets,
    afterChoices.nextEntityId,
  );
  const flown = moveBullets(shots.bullets, afterChoices.enemies);
  const beaten = removeBeatenEnemies(flown.enemies);

  const spawned = spawnEnemies(
    shots.players,
    beaten.enemies,
    afterChoices.stepCount,
    afterChoices.enemySpawnCarry,
    shots.nextEntityId,
    afterChoices.randomState,
  );
  const touches = applyTouchDamage(walkEnemies(spawned.enemies, shots.players), shots.players);

  const afterFight: RunState = {
    ...afterChoices,
    stepCount: afterChoices.stepCount + 1,
    randomState: spawned.randomState,
    score: afterChoices.score + beaten.points,
    teamHealth: Math.max(0, afterChoices.teamHealth - touches.damage),
    players: shots.players,
    bullets: flown.bullets,
    enemies: removeFarEnemies(touches.enemies, shots.players),
    nextEntityId: spawned.nextEntityId,
    enemySpawnCarry: spawned.spawnCarry,
  };
  return endRunIfDefeated(addExperienceAndOffers(afterFight, beaten.experience));
}
