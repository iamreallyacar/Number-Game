import type { ReportedPlayer, RunStateReport } from '@local/survivor-game';
import type { TimelineFrame } from './state-timeline.js';
import { findVisibleRopes, type VisibleRope } from './visible-ropes.js';
import type { WorldPoint } from './view-transform.js';

export interface DrawnPlayer extends WorldPoint {
  readonly playerId: string;
}

export interface DrawnBullet extends WorldPoint {
  readonly radius: number;
}

/** What one frame draws, with every position already smoothed between two states. */
export interface Scene {
  readonly players: readonly DrawnPlayer[];
  readonly bullets: readonly DrawnBullet[];
  readonly enemies: readonly WorldPoint[];
  readonly ropes: readonly VisibleRope[];
  /** The player's own character, which the view follows (SG-52). */
  readonly own: DrawnPlayer;
}

function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}

function smoothPoint(
  previous: WorldPoint | undefined,
  latest: WorldPoint,
  alpha: number,
): WorldPoint {
  return previous === undefined
    ? { x: latest.x, y: latest.y }
    : { x: lerp(previous.x, latest.x, alpha), y: lerp(previous.y, latest.y, alpha) };
}

function indexById<Item extends { readonly id: number }>(
  items: readonly Item[],
): Map<number, Item> {
  return new Map(items.map((item) => [item.id, item]));
}

/** The character of a player ID in a state, or an error, since a run the player is in always has it. */
export function findOwnPlayer(state: RunStateReport, ownPlayerId: string): ReportedPlayer {
  const player = state.players.find((candidate) => candidate.playerId === ownPlayerId);
  if (player === undefined) {
    throw new Error(`Player '${ownPlayerId}' is not a character in this run`);
  }
  return player;
}

/** Builds what to draw from a frame. A thing that is new in the latest state is drawn where it is. */
export function buildScene(frame: TimelineFrame, ownPlayerId: string): Scene {
  const { previous, latest, alpha } = frame;
  const previousPlayers = new Map(previous?.players.map((player) => [player.playerId, player]));
  const previousBullets = indexById(previous?.bullets ?? []);
  const previousEnemies = indexById(previous?.enemies ?? []);

  const players = latest.players.map((player) => ({
    playerId: player.playerId,
    ...smoothPoint(previousPlayers.get(player.playerId), player, alpha),
  }));
  const own = players.find((player) => player.playerId === ownPlayerId);
  if (own === undefined) {
    throw new Error(`Player '${ownPlayerId}' is not a character in this run`);
  }
  return {
    players,
    bullets: latest.bullets.map((bullet) => ({
      radius: bullet.radius,
      ...smoothPoint(previousBullets.get(bullet.id), bullet, alpha),
    })),
    enemies: latest.enemies.map((enemy) =>
      smoothPoint(previousEnemies.get(enemy.id), enemy, alpha),
    ),
    ropes: findVisibleRopes(players),
    own,
  };
}
