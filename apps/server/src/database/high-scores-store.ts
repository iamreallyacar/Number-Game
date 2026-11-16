import type { DatabaseSync, SQLOutputValue } from 'node:sqlite';
import { readIntegerColumn, readTextColumn } from './row-values.js';

/**
 * One finished game. `category` is what high scores are filtered by, such as the difficulty.
 * `playerIds` names everyone on the result in the order they joined, one for a saved game (PS-23).
 */
export interface StoredGameResult {
  readonly gameId: string;
  readonly playerIds: readonly string[];
  readonly score: number;
  readonly category: string;
  /** Extra facts the game wants shown next to the score, such as stage and width, as JSON. */
  readonly detailsJson: string;
  /** The game's format version of `detailsJson`, so older details can be upgraded. */
  readonly detailsVersion: number;
  readonly finishedAt: string;
}

function toGameResult(
  row: Record<string, SQLOutputValue>,
  playerIds: readonly string[],
): StoredGameResult {
  return {
    gameId: readTextColumn(row, 'game_id'),
    playerIds,
    score: readIntegerColumn(row, 'score'),
    category: readTextColumn(row, 'category'),
    detailsJson: readTextColumn(row, 'details_json'),
    detailsVersion: readIntegerColumn(row, 'details_version'),
    finishedAt: readTextColumn(row, 'finished_at'),
  };
}

export class HighScoresStore {
  constructor(private readonly database: DatabaseSync) {}

  /** Writes the result and its player rows together, whether or not a transaction is open. */
  insertResult(result: StoredGameResult): void {
    if (result.playerIds.length === 0) {
      throw new RangeError('A result needs at least one player');
    }
    this.database.exec('SAVEPOINT insert_result');
    try {
      const inserted = this.database
        .prepare(
          `INSERT INTO high_scores
             (game_id, score, category, details_json, details_version, finished_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(
          result.gameId,
          result.score,
          result.category,
          result.detailsJson,
          result.detailsVersion,
          result.finishedAt,
        );
      const insertPlayer = this.database.prepare(
        'INSERT INTO high_score_players (high_score_id, player_id, position) VALUES (?, ?, ?)',
      );
      for (const [position, playerId] of result.playerIds.entries()) {
        insertPlayer.run(inserted.lastInsertRowid, playerId, position);
      }
      this.database.exec('RELEASE insert_result');
    } catch (error) {
      this.database.exec('ROLLBACK TO insert_result');
      this.database.exec('RELEASE insert_result');
      throw error;
    }
  }

  /** Best results first. Ties go to whoever got there first. A null category means all of them. */
  listTopResults(gameId: string, category: string | null, limit: number): StoredGameResult[] {
    const rows = this.database
      .prepare(
        `SELECT * FROM high_scores
         WHERE game_id = ? AND (? IS NULL OR category = ?)
         ORDER BY score DESC, finished_at ASC, high_score_id ASC
         LIMIT ?`,
      )
      .all(gameId, category, category, limit);
    return this.attachPlayers(rows);
  }

  /** The best result in each category among the results the player is on. */
  listPersonalBests(gameId: string, playerId: string): StoredGameResult[] {
    const rows = this.database
      .prepare(
        `SELECT * FROM (
           SELECT high_scores.*, ROW_NUMBER() OVER (
             PARTITION BY category ORDER BY score DESC, finished_at ASC, high_score_id ASC
           ) AS rank_in_category
           FROM high_scores
           WHERE game_id = ?
             AND high_score_id IN (
               SELECT high_score_id FROM high_score_players WHERE player_id = ?
             )
         )
         WHERE rank_in_category = 1
         ORDER BY category`,
      )
      .all(gameId, playerId);
    return this.attachPlayers(rows);
  }

  private attachPlayers(rows: Record<string, SQLOutputValue>[]): StoredGameResult[] {
    const selectPlayers = this.database.prepare(
      'SELECT player_id FROM high_score_players WHERE high_score_id = ? ORDER BY position',
    );
    return rows.map((row) => {
      const playerIds = selectPlayers
        .all(readIntegerColumn(row, 'high_score_id'))
        .map((playerRow) => readTextColumn(playerRow, 'player_id'));
      if (playerIds.length === 0) {
        throw new Error('A stored result has no players');
      }
      return toGameResult(row, playerIds);
    });
  }
}
